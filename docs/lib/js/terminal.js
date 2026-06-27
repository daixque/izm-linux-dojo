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
        this.term.onKey(({ domEvent, key }) => this._handleKey(domEvent, key));
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
        const printable = !domEvent.altKey && !domEvent.ctrlKey && !domEvent.metaKey;

        if (domEvent.keyCode === 13) {
            this._executeCurrentLine();
            return;
        }

        if (domEvent.keyCode === 8) {
            if (this.cursorPos > 0) {
                this.currentLine =
                    this.currentLine.slice(0, this.cursorPos - 1) +
                    this.currentLine.slice(this.cursorPos);
                this.cursorPos--;
                this._redrawLine();
            }
            return;
        }

        if (domEvent.keyCode === 38) {
            const prev = this.simulator.getPreviousHistory();
            this.currentLine = prev;
            this.cursorPos = prev.length;
            this._redrawLine();
            return;
        }

        if (domEvent.keyCode === 40) {
            const next = this.simulator.getNextHistory();
            this.currentLine = next;
            this.cursorPos = next.length;
            this._redrawLine();
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
            this.currentLine =
                this.currentLine.slice(0, this.cursorPos) +
                key +
                this.currentLine.slice(this.cursorPos);
            this.cursorPos++;
            this._redrawLine();
        }
    }

    _redrawLine() {
        this.term.write('\r' + this.simulator.getPrompt() + '\x1b[K');
        this.term.write(this.currentLine);
        const tail = this.currentLine.length - this.cursorPos;
        if (tail > 0) {
            this.term.write('\x1b[' + tail + 'D');
        }
    }

    _executeCurrentLine() {
        const line = this.currentLine;
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
