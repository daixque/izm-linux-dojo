/**
 * プロセス状態のシミュレーション（ps / kill / jobs 用）
 */
class ProcessManager {
    constructor() {
        this._initialProcesses = [
            { pid: 1, tty: '?', time: '00:00:01', cmd: 'systemd', status: 'running' },
            { pid: 1042, tty: 'pts/0', time: '00:00:00', cmd: 'bash', status: 'running' },
            { pid: 2048, tty: 'pts/0', time: '00:00:02', cmd: 'python simulator.py', status: 'running' },
            { pid: 3099, tty: 'pts/0', time: '00:00:00', cmd: 'sleep 100', status: 'running' },
        ];
        this._initialJobs = [{ id: 1, pid: 3099, status: 'Running', cmd: 'sleep 100' }];
        this.reset();
    }

    reset() {
        this.processes = this._initialProcesses.map((p) => ({ ...p }));
        this.backgroundJobs = this._initialJobs.map((j) => ({ ...j }));
    }

    listRunning() {
        return this.processes.filter((p) => p.status === 'running');
    }

    kill(pid) {
        const proc = this.processes.find((p) => p.pid === pid);
        if (!proc || proc.status !== 'running') {
            return { success: false, error: `kill: (${pid}) - No such process` };
        }
        if (proc.pid === 1) {
            return { success: false, error: 'kill: Operation not permitted' };
        }
        proc.status = 'terminated';
        this.backgroundJobs = this.backgroundJobs.filter((j) => j.pid !== pid);
        return { success: true };
    }

    formatPs() {
        const lines = ['  PID TTY          TIME CMD'];
        for (const p of this.listRunning()) {
            const pid = String(p.pid).padStart(5);
            const tty = p.tty.padEnd(12);
            lines.push(`${pid} ${tty}${p.time} ${p.cmd}`);
        }
        return lines.join('\n') + (lines.length > 1 ? '\n' : '');
    }

    formatJobs() {
        if (this.backgroundJobs.length === 0) {
            return '';
        }
        return (
            this.backgroundJobs
                .map((j) => `[${j.id}]+ ${j.status.padEnd(7)} ${j.cmd} &`)
                .join('\n') + '\n'
        );
    }
}

/** コマンド間で共有するランタイム状態 */
window.shellRuntime = window.shellRuntime || {
    processManager: new ProcessManager(),
    reset() {
        this.processManager.reset();
    },
};

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
        if (window.shellRuntime) {
            window.shellRuntime.reset();
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
        const user = this.vfs.getCurrentUser();
        const home = '/home/user';
        let displayPath;
        if (cwd === home) {
            displayPath = '~';
        } else if (cwd.startsWith(home + '/')) {
            displayPath = '~' + cwd.slice(home.length);
        } else {
            displayPath = cwd;
        }
        return `${user}@dojo:${displayPath}$ `;
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

    complete(line, cursorPos, options = {}) {
        return window.shellCompletion.completeLine(line, cursorPos, this.vfs, options);
    }
}

window.ShellSimulator = ShellSimulator;
