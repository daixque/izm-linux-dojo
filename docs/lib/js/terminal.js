/**
 * xterm.js ターミナル UI ラッパー
 */
class TerminalUI {
    constructor(containerId, simulator) {
        this.container = document.getElementById(containerId);
        this.simulator = simulator;
        this.term = null;
        this.currentLine = '';
        this.cursorPos = 0;
        this._lastTabState = null;
        this._lastTabTime = 0;
        this._isComposing = false;
        this._ignoreNextEnter = false;
        this._enterCommitPending = false;
        this._enterHandledOnKeydown = false;
        this._imeProcessEnterPending = false;
        this.onStateChange = null;
    }

    init() {
        if (!this.container || typeof Terminal === 'undefined') {
            console.error('Terminal container or xterm.js not available');
            return;
        }

        this.term = new Terminal({
            cursorBlink: true,
            fontSize: 14,
            fontFamily: 'Menlo, Monaco, "Courier New", monospace',
            theme: {
                background: '#000000',
                foreground: '#ffffff',
                cursor: '#ffffff',
            },
            convertEol: true,
        });

        this.term.open(this.container);
        this.fitAddon = typeof FitAddon !== 'undefined' ? new FitAddon.FitAddon() : null;
        if (this.fitAddon) {
            this.term.loadAddon(this.fitAddon);
            this.fitAddon.fit();
            window.addEventListener('resize', () => this.fitAddon.fit());
        }

        this.writeWelcome();
        this.writePrompt();
        this._setupImeInput();
        this.term.onKey(({ domEvent, key }) => this._handleKey(domEvent, key));
        this.term.attachCustomKeyEventHandler((domEvent) => {
            if (domEvent.type === 'keydown') {
                if (domEvent.isComposing || this._isComposing) {
                    return false;
                }
                // Enter は textarea の keydown で処理（IME 切替直後の keyCode 229 対策）
                if (domEvent.key === 'Enter' || domEvent.keyCode === 13) {
                    return false;
                }
                if (this._tryCursorShortcut(domEvent)) {
                    return false;
                }
            }
            return true;
        });
    }

    _setupImeInput() {
        const textarea = this.term.textarea;
        if (!textarea) return;

        textarea.addEventListener('compositionstart', () => {
            this._isComposing = true;
        });

        textarea.addEventListener('compositionend', (e) => {
            this._isComposing = false;
            if (e.data) {
                this._insertText(e.data);
                if (this._enterCommitPending) {
                    this._ignoreNextEnter = true;
                }
            }
            this._enterCommitPending = false;
        });

        textarea.addEventListener('keydown', (e) => this._onEnterKeyEvent(e, 'keydown'), true);
        textarea.addEventListener('keyup', (e) => this._onEnterKeyEvent(e, 'keyup'), true);

        textarea.addEventListener('paste', (e) => {
            e.preventDefault();
            const text = e.clipboardData.getData('text');
            if (text) {
                this._insertText(text);
            }
        });
    }

    _isEnterKeyEvent(e) {
        return e.key === 'Enter' || e.keyCode === 13;
    }

    _isImeProcessEnter(e) {
        if (e.keyCode !== 229 && e.key !== 'Process') {
            return false;
        }
        return e.key === 'Process' || e.key === 'Unidentified' || e.code === 'Enter';
    }

    _onEnterKeyEvent(e, phase) {
        if (this._isEnterKeyEvent(e)) {
            if (phase === 'keydown') {
                this._imeProcessEnterPending = false;
                this._enterHandledOnKeydown = false;
                if (this._isComposing) {
                    this._enterCommitPending = true;
                    return;
                }
                if (this._consumeEnter(e)) {
                    this._enterHandledOnKeydown = true;
                }
                return;
            }

            if (this._enterHandledOnKeydown) {
                this._enterHandledOnKeydown = false;
                return;
            }
            if (!this._isComposing) {
                this._consumeEnter(e);
            }
            return;
        }

        if (!this._isImeProcessEnter(e)) {
            if (phase === 'keydown') {
                this._imeProcessEnterPending = false;
            }
            return;
        }

        if (phase === 'keydown') {
            if (this._isComposing) {
                this._enterCommitPending = true;
                return;
            }
            if (!e.isComposing) {
                this._imeProcessEnterPending = true;
            }
            return;
        }

        if (this._imeProcessEnterPending && !this._isComposing) {
            this._imeProcessEnterPending = false;
            this._consumeEnter(e);
        }
    }

    _consumeEnter(e) {
        e.preventDefault();
        e.stopImmediatePropagation();

        if (this._ignoreNextEnter) {
            this._ignoreNextEnter = false;
            return true;
        }
        this._executeCurrentLine();
        return true;
    }

    _insertText(text) {
        if (!text) return;

        const atEnd = this.cursorPos === this.currentLine.length;
        this.currentLine =
            this.currentLine.slice(0, this.cursorPos) + text + this.currentLine.slice(this.cursorPos);
        this.cursorPos += text.length;
        if (atEnd) {
            this.term.write(text);
        } else {
            this._writeInsertMode(text);
        }
    }

    writeWelcome() {
        this.term.writeln('\x1b[1;32mWelcome to IZM Linux Dojo\x1b[0m');
        this.term.writeln('Type commands and press Enter.');
        this.term.writeln('');
    }

    writePrompt() {
        this.currentLine = '';
        this.cursorPos = 0;
        this.term.write('\r\n' + this.simulator.getPrompt());
    }

    _handleKey(domEvent, key) {
        if (domEvent.isComposing || this._isComposing) {
            return;
        }

        if (this._tryCursorShortcut(domEvent)) {
            return;
        }

        const printable = !domEvent.altKey && !domEvent.ctrlKey && !domEvent.metaKey;

        if (domEvent.keyCode === 9) {
            domEvent.preventDefault();
            this._handleTab();
            return;
        }

        if (domEvent.keyCode === 8) {
            if (this.cursorPos > 0) {
                if (this.cursorPos === this.currentLine.length) {
                    this.currentLine = this.currentLine.slice(0, -1);
                    this.cursorPos--;
                    this.term.write('\b \b');
                } else {
                    this._deleteCharBeforeCursor();
                }
            }
            domEvent.preventDefault();
            return;
        }

        if (domEvent.keyCode === 38) {
            const oldLine = this.currentLine;
            const oldCursorPos = this.cursorPos;
            const prev = this.simulator.getPreviousHistory();
            this.currentLine = prev;
            this.cursorPos = prev.length;
            this._applyLineUpdate(oldLine, oldCursorPos);
            return;
        }

        if (domEvent.keyCode === 40) {
            const oldLine = this.currentLine;
            const oldCursorPos = this.cursorPos;
            const next = this.simulator.getNextHistory();
            this.currentLine = next;
            this.cursorPos = next.length;
            this._applyLineUpdate(oldLine, oldCursorPos);
            return;
        }

        if (domEvent.keyCode === 37 && this.cursorPos > 0) {
            this.cursorPos--;
            this.term.write('\x1b[D');
            return;
        }

        if (domEvent.keyCode === 39 && this.cursorPos < this.currentLine.length) {
            this.cursorPos++;
            this.term.write('\x1b[C');
            return;
        }

        if (printable && key.length === 1) {
            domEvent.preventDefault();
            this._ignoreNextEnter = false;
            this._enterCommitPending = false;
            this._imeProcessEnterPending = false;
            if (this.cursorPos === this.currentLine.length) {
                this.currentLine += key;
                this.cursorPos++;
                this.term.write(key);
            } else {
                this._insertCharAtCursor(key);
            }
        }
    }

    _insertCharAtCursor(key) {
        this.currentLine =
            this.currentLine.slice(0, this.cursorPos) +
            key +
            this.currentLine.slice(this.cursorPos);
        this.cursorPos++;
        this._writeInsertMode(key);
    }

    _writeInsertMode(text) {
        // SMIR: 挿入モードで書くと右側の文字を押し出せる（行末へカーソルを飛ばす必要がない）
        this.term.write('\x1b[4h' + text + '\x1b[4l');
    }

    _deleteCharBeforeCursor() {
        this.currentLine =
            this.currentLine.slice(0, this.cursorPos - 1) +
            this.currentLine.slice(this.cursorPos);
        this.cursorPos--;
        this.term.write('\x1b[D\x1b[P');
    }

    _isCtrlShortcut(domEvent, letter) {
        if (!domEvent.ctrlKey || domEvent.metaKey || domEvent.altKey) {
            return false;
        }
        const key = domEvent.key;
        return key === letter || key === letter.toUpperCase();
    }

    _moveCursorTo(newPos) {
        const target = Math.max(0, Math.min(newPos, this.currentLine.length));
        const delta = target - this.cursorPos;
        if (delta === 0) {
            return;
        }
        if (delta < 0) {
            this.term.write('\x1b[' + (-delta) + 'D');
        } else {
            this.term.write('\x1b[' + delta + 'C');
        }
        this.cursorPos = target;
    }

    _tryCursorShortcut(domEvent) {
        if (this._isCtrlShortcut(domEvent, 'a')) {
            domEvent.preventDefault();
            this._moveCursorTo(0);
            return true;
        }
        if (this._isCtrlShortcut(domEvent, 'e')) {
            domEvent.preventDefault();
            this._moveCursorTo(this.currentLine.length);
            return true;
        }
        return false;
    }

    _handleTab() {
        const tabState = `${this.currentLine}|${this.cursorPos}`;
        const listOnly =
            this._lastTabState === tabState && Date.now() - this._lastTabTime < 600;

        const result = this.simulator.complete(this.currentLine, this.cursorPos, {
            listOnly,
        });

        if (!result) {
            return;
        }

        if (result.listMatches) {
            this.term.write('\r\n' + result.listMatches.join('  '));
            this.term.write('\r\n' + this.simulator.getPrompt() + this.currentLine);
            const tail = this.currentLine.length - this.cursorPos;
            if (tail > 0) {
                this.term.write('\x1b[' + tail + 'D');
            }
            this._lastTabState = tabState;
            this._lastTabTime = Date.now();
            return;
        }

        this._lastTabState = null;
        const oldLine = this.currentLine;
        const oldCursorPos = this.cursorPos;
        this.currentLine = result.newLine;
        this.cursorPos = result.newCursorPos;
        this._applyLineUpdate(oldLine, oldCursorPos);
    }

    _applyLineUpdate(oldLine, oldCursorPos) {
        if (
            oldCursorPos === oldLine.length &&
            this.currentLine.startsWith(oldLine)
        ) {
            this.term.write(this.currentLine.slice(oldLine.length));
            return;
        }
        this._redrawInput();
    }

    _redrawInput() {
        this.term.write(
            '\r' + this.simulator.getPrompt() + this.currentLine + '\x1b[K'
        );
        const tail = this.currentLine.length - this.cursorPos;
        if (tail > 0) {
            this.term.write('\x1b[' + tail + 'D');
        }
    }

    _executeCurrentLine() {
        const line = this.currentLine;
        this.term.write('\r\n');
        const result = this.simulator.executeLine(line);

        if (result.clear) {
            this.clear();
        } else {
            if (result.stdout) this.term.write(result.stdout.replace(/\n/g, '\r\n'));
            if (result.stderr) this.term.write('\x1b[31m' + result.stderr.replace(/\n/g, '\r\n') + '\x1b[0m');
        }

        if (this.onStateChange) {
            this.onStateChange();
        }

        this.writePrompt();
    }

    runCommands(commands) {
        for (const cmd of commands) {
            this.term.writeln(this.simulator.getPrompt() + cmd);
            const result = this.simulator.executeLine(cmd);
            if (result.clear) {
                this.clear();
            } else {
                if (result.stdout) this.term.writeln(result.stdout.replace(/\n$/, ''));
                if (result.stderr) this.term.writeln('\x1b[31m' + result.stderr.replace(/\n$/, '') + '\x1b[0m');
            }
        }
        if (this.onStateChange) this.onStateChange();
        this.writePrompt();
    }

    clear() {
        this.term.clear();
        this.writeWelcome();
    }

    reset() {
        this.simulator.reset();
        this.clear();
        this.writePrompt();
        if (this.onStateChange) this.onStateChange();
    }

    focus() {
        this.term.focus();
    }
}

window.TerminalUI = TerminalUI;
