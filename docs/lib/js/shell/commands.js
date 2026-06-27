/**
 * シェルコマンド実装（登録制）
 */
const shellCommands = {};

function registerCommand(name, handler) {
    shellCommands[name] = handler;
}

function parseCommandLine(line) {
    const trimmed = line.trim();
    if (!trimmed) return { command: '', args: [] };

    const tokens = [];
    let current = '';
    let inSingle = false;
    let inDouble = false;

    for (let i = 0; i < trimmed.length; i++) {
        const ch = trimmed[i];
        if (ch === "'" && !inDouble) {
            inSingle = !inSingle;
            continue;
        }
        if (ch === '"' && !inSingle) {
            inDouble = !inDouble;
            continue;
        }
        if (ch === ' ' && !inSingle && !inDouble) {
            if (current) {
                tokens.push(current);
                current = '';
            }
            continue;
        }
        current += ch;
    }
    if (current) tokens.push(current);

    const command = tokens[0] || '';
    const args = tokens.slice(1);
    return { command, args };
}

registerCommand('ls', (args, vfs) => {
    const target = args[0] || null;
    const names = vfs.listDir(target);
    if (names.length === 0) return { stdout: '', stderr: '', exitCode: 0 };
    return { stdout: names.join('\n') + '\n', stderr: '', exitCode: 0 };
});

registerCommand('cd', (args, vfs) => {
    const target = args[0] || '/home/user';
    const resolved = vfs.normalizePath(target);
    if (!vfs.isDirectory(resolved)) {
        const display = target;
        return {
            stdout: '',
            stderr: `cd: ${display}: No such file or directory\n`,
            exitCode: 1,
        };
    }
    vfs.setCwd(resolved);
    return { stdout: '', stderr: '', exitCode: 0 };
});

registerCommand('pwd', (_args, vfs) => ({
    stdout: vfs.getCwd() + '\n',
    stderr: '',
    exitCode: 0,
}));

registerCommand('clear', () => ({
    stdout: '',
    stderr: '',
    exitCode: 0,
    clear: true,
}));

registerCommand('cat', (args, vfs) => {
    if (args.length === 0) {
        return { stdout: '', stderr: 'cat: missing file operand\n', exitCode: 1 };
    }
    try {
        const content = vfs.readFile(args[0]);
        const output = content.endsWith('\n') ? content : content + '\n';
        return { stdout: output, stderr: '', exitCode: 0 };
    } catch (err) {
        return { stdout: '', stderr: err.message + '\n', exitCode: 1 };
    }
});

function executeCommand(line, vfs) {
    const { command, args } = parseCommandLine(line);
    if (!command) {
        return { stdout: '', stderr: '', exitCode: 0 };
    }

    const handler = shellCommands[command];
    if (!handler) {
        return {
            stdout: '',
            stderr: `${command}: command not found\n`,
            exitCode: 127,
        };
    }

    try {
        return handler(args, vfs);
    } catch (err) {
        return {
            stdout: '',
            stderr: err.message + '\n',
            exitCode: 1,
        };
    }
}

window.shellCommands = {
    registerCommand,
    parseCommandLine,
    executeCommand,
    getCommandNames: () => Object.keys(shellCommands).sort(),
};
