/**
 * シェルシミュレータ — xterm.js から独立した実行エンジン
 */
class ShellSimulator {
    constructor(options = {}) {
        this.vfs = options.vfs;
        this.prompt = options.prompt || 'user@dojo:~$ ';
        this.history = [];
        this.historyIndex = -1;
        this._initialTree = options.initialTree;
        this._initialCwd = options.initialCwd || '/home/user';
    }

    reset() {
        if (this.vfs) {
            this.vfs.reset(this._initialTree, this._initialCwd);
        }
        this.history = [];
        this.historyIndex = -1;
    }

    getCwd() {
        return this.vfs.getCwd();
    }

    getHistory() {
        return [...this.history];
    }

    getPrompt() {
        const cwd = this.vfs.getCwd();
        const home = '/home/user';
        let displayPath;
        if (cwd === home) {
            displayPath = '~';
        } else if (cwd.startsWith(home + '/')) {
            displayPath = '~' + cwd.slice(home.length);
        } else {
            displayPath = cwd;
        }
        return `user@dojo:${displayPath}$ `;
    }

    executeLine(line) {
        const trimmed = line.trim();
        if (trimmed) {
            this.history.push(trimmed);
        }
        this.historyIndex = this.history.length;

        const result = window.shellCommands.executeCommand(line, this.vfs);
        return {
            ...result,
            prompt: this.getPrompt(),
        };
    }

    executeCommands(commands) {
        const outputs = [];
        for (const cmd of commands) {
            const result = this.executeLine(cmd);
            outputs.push(result);
        }
        return outputs;
    }

    getPreviousHistory() {
        if (this.history.length === 0) return '';
        this.historyIndex = Math.max(0, this.historyIndex - 1);
        return this.history[this.historyIndex] || '';
    }

    getNextHistory() {
        if (this.history.length === 0) return '';
        if (this.historyIndex >= this.history.length - 1) {
            this.historyIndex = this.history.length;
            return '';
        }
        this.historyIndex += 1;
        return this.history[this.historyIndex] || '';
    }
}

window.ShellSimulator = ShellSimulator;
