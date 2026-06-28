/**
 * シェルコマンド実装（登録制）
 */
const shellCommands = {};

const ENV = {
    HOME: '/home/user',
    USER: 'user',
    PATH: '/usr/local/bin:/usr/bin:/bin',
};

const HELP_PAGES = {
    ls: `Usage: ls [OPTION]... [FILE]...
List directory contents.

  -a, --all    do not ignore entries starting with .
  --help       display this help and exit
`,
    cd: `Usage: cd [DIRECTORY]
Change the shell working directory.
`,
    pwd: `Usage: pwd
Print the name of the current working directory.
`,
    cat: `Usage: cat [FILE]...
Concatenate FILE(s) to standard output.
`,
    grep: `Usage: grep [OPTION]... PATTERN [FILE]...
Search for PATTERN in each FILE.

  -i           ignore case distinctions
  -n           print line number with output lines
  -v           select non-matching lines
  -c           print only a count of matching lines
  --help       display this help and exit
`,
    find: `Usage: find DIRECTORY -name PATTERN
Search for files in DIRECTORY matching PATTERN.
PATTERN supports wildcards * and ?.
`,
    echo: `Usage: echo [STRING]...
Display a line of text.

Environment variables: $HOME, $USER, $PATH
`,
    head: `Usage: head [OPTION]... [FILE]...
Print the first 10 lines of each FILE.

  -n NUM       print the first NUM lines instead of 10
`,
    tail: `Usage: tail [OPTION]... [FILE]...
Print the last 10 lines of each FILE.

  -n NUM       print the last NUM lines instead of 10
`,
    wc: `Usage: wc [OPTION]... [FILE]...
Print newline, word, and byte counts for each FILE.

  -l           print the newline counts
  -w           print the word counts
  -c           print the byte counts
`,
    mkdir: `Usage: mkdir [OPTION]... DIRECTORY...
Create the DIRECTORY(ies), if they do not already exist.

  -p           no error if existing, make parent directories as needed
`,
    touch: `Usage: touch FILE...
Change file timestamps or create empty files.
`,
    rm: `Usage: rm [OPTION]... FILE...
Remove (unlink) the FILE(s).

  -r           remove directories and their contents recursively
`,
    cp: `Usage: cp [OPTION]... SOURCE... DEST
Copy SOURCE to DEST.

  -r           copy directories recursively
`,
    mv: `Usage: mv SOURCE... DEST
Move or rename files.
`,
    man: `Usage: man COMMAND
Display the manual page for COMMAND.
`,
    tree: `Usage: tree [DIRECTORY]...
List contents of directories in a tree-like format.
`,
};

function registerCommand(name, handler) {
    shellCommands[name] = handler;
}

function tokenizeWords(line) {
    const trimmed = line.trim();
    if (!trimmed) return [];

    const tokens = [];
    let current = '';
    let inSingle = false;
    let inDouble = false;
    let quoted = false;

    function pushToken() {
        if (current) {
            tokens.push({ value: current, quoted });
            current = '';
            quoted = false;
        }
    }

    for (let i = 0; i < trimmed.length; i++) {
        const ch = trimmed[i];
        const next = trimmed[i + 1];

        if (!inSingle && !inDouble) {
            if (ch === '>' && next === '>') {
                pushToken();
                tokens.push({ value: '>>', quoted: false });
                i++;
                continue;
            }
            if (ch === '>' || ch === '<' || ch === '|') {
                pushToken();
                tokens.push({ value: ch, quoted: false });
                continue;
            }
        }

        if (ch === "'" && !inDouble) {
            if (!inSingle) quoted = true;
            inSingle = !inSingle;
            continue;
        }
        if (ch === '"' && !inSingle) {
            if (!inDouble) quoted = true;
            inDouble = !inDouble;
            continue;
        }
        if (ch === ' ' && !inSingle && !inDouble) {
            pushToken();
            continue;
        }
        current += ch;
    }
    pushToken();
    return tokens;
}

function tokenValues(tokens) {
    return tokens.map((t) => (typeof t === 'string' ? t : t.value));
}

function parseCommandLine(line) {
    const tokens = tokenizeWords(line);
    const values = tokenValues(tokens);
    const command = values[0] || '';
    const args = values.slice(1);
    return { command, args };
}

function splitOutsideQuotes(line, delimiters) {
    const sorted = [...delimiters].sort((a, b) => b.length - a.length);
    const parts = [];
    let current = '';
    let inSingle = false;
    let inDouble = false;

    for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (!inSingle && !inDouble) {
            let matched = null;
            for (const d of sorted) {
                if (line.slice(i, i + d.length) === d) {
                    matched = d;
                    break;
                }
            }
            if (matched) {
                parts.push({ text: current, delimiter: matched });
                current = '';
                i += matched.length - 1;
                continue;
            }
        }
        if (ch === "'" && !inDouble) inSingle = !inSingle;
        else if (ch === '"' && !inSingle) inDouble = !inDouble;
        current += ch;
    }
    parts.push({ text: current, delimiter: null });
    return parts;
}

function parseCommandSegment(text) {
    const tokens = tokenizeWords(text);
    let stdinFile = null;
    let stdoutFile = null;
    let stdoutAppend = false;
    const cmdTokens = [];

    for (let i = 0; i < tokens.length; i++) {
        const t = tokens[i].value;
        if (t === '<' && i + 1 < tokens.length) {
            stdinFile = tokens[++i].value;
        } else if (t === '>>' && i + 1 < tokens.length) {
            stdoutFile = tokens[++i].value;
            stdoutAppend = true;
        } else if (t === '>' && i + 1 < tokens.length) {
            stdoutFile = tokens[++i].value;
            stdoutAppend = false;
        } else {
            cmdTokens.push(tokens[i]);
        }
    }

    return {
        command: cmdTokens[0]?.value || '',
        argTokens: cmdTokens.slice(1),
        stdinFile,
        stdoutFile,
        stdoutAppend,
    };
}

function expandArgGlob(arg, vfs) {
    if (!arg.includes('*') && !arg.includes('?')) {
        return [arg];
    }

    const lastSlash = arg.lastIndexOf('/');
    let dirPart;
    let pattern;

    if (lastSlash === -1) {
        dirPart = '';
        pattern = arg;
    } else if (lastSlash === 0) {
        dirPart = '/';
        pattern = arg.slice(1);
    } else {
        dirPart = arg.slice(0, lastSlash);
        pattern = arg.slice(lastSlash + 1);
    }

    const dirPath = dirPart ? vfs.normalizePath(dirPart) : vfs.getCwd();
    if (!vfs.isDirectory(dirPath)) {
        return [arg];
    }

    try {
        const matches = vfs.globInDir(dirPath, pattern);
        if (matches.length === 0) {
            return [arg];
        }
        return matches.map((name) => {
            if (!dirPart) return name;
            if (dirPart === '/') return `/${name}`;
            return `${dirPart}/${name}`;
        });
    } catch {
        return [arg];
    }
}

function expandArgs(argTokens, vfs) {
    const expanded = [];
    for (const token of argTokens) {
        const arg = token.value;
        if (token.quoted || (!arg.includes('*') && !arg.includes('?'))) {
            expanded.push(arg);
        } else {
            expanded.push(...expandArgGlob(arg, vfs));
        }
    }
    return expanded;
}

function expandEnvVars(text) {
    return text.replace(/\$(HOME|USER|PATH)\b/g, (_, name) => ENV[name] ?? `$${name}`);
}

function parseFlags(args, flagMap) {
    const positional = [];
    const options = {};
    for (const arg of args) {
        if (arg === '--help') {
            options.help = true;
        } else if (arg.startsWith('-') && arg.length > 1 && !/^-\d/.test(arg)) {
            for (const ch of arg.slice(1)) {
                if (flagMap[ch] !== undefined) {
                    options[flagMap[ch]] = true;
                }
            }
        } else {
            positional.push(arg);
        }
    }
    return { positional, options };
}

function parseNumFlagArgs(args, defaultN = 10) {
    let n = defaultN;
    const files = [];
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (arg === '-n' && i + 1 < args.length) {
            n = parseInt(args[++i], 10);
        } else if (/^-\d+$/.test(arg)) {
            n = parseInt(arg.slice(1), 10);
        } else if (arg.startsWith('-')) {
            continue;
        } else {
            files.push(arg);
        }
    }
    return { n, files };
}

function getHelpText(command) {
    return HELP_PAGES[command] || null;
}

function executeSingleCommand(command, args, vfs, context = {}) {
    if (!command) {
        return { stdout: '', stderr: '', exitCode: 0 };
    }

    if (args.includes('--help') || args.includes('-h')) {
        const help = getHelpText(command);
        if (help) {
            return { stdout: help, stderr: '', exitCode: 0 };
        }
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
        return handler(args, vfs, context);
    } catch (err) {
        return {
            stdout: '',
            stderr: err.message + '\n',
            exitCode: 1,
        };
    }
}

function executePipeline(text, vfs) {
    const pipeParts = splitOutsideQuotes(text, ['|']);
    let stdin = '';
    let result = { stdout: '', stderr: '', exitCode: 0 };

    for (let i = 0; i < pipeParts.length; i++) {
        const segment = pipeParts[i].text.trim();
        if (!segment) continue;

        const { command, argTokens, stdinFile, stdoutFile, stdoutAppend } =
            parseCommandSegment(segment);

        let input = stdin;
        if (stdinFile) {
            try {
                input = vfs.readFile(stdinFile);
            } catch (err) {
                return { stdout: '', stderr: err.message + '\n', exitCode: 1 };
            }
        }

        const expandedArgs = expandArgs(argTokens, vfs);
        result = executeSingleCommand(command, expandedArgs, vfs, { stdin: input });

        const isLast = i === pipeParts.length - 1;
        if (isLast && stdoutFile) {
            try {
                vfs.writeFile(stdoutFile, result.stdout, { append: stdoutAppend });
                result = { stdout: '', stderr: result.stderr, exitCode: result.exitCode };
            } catch (err) {
                return { stdout: '', stderr: err.message + '\n', exitCode: 1 };
            }
        }

        if (result.exitCode !== 0) {
            break;
        }
        stdin = result.stdout;
    }

    return result;
}

function executeCommand(line, vfs) {
    const trimmed = line.trim();
    if (!trimmed) {
        return { stdout: '', stderr: '', exitCode: 0 };
    }

    if (trimmed.startsWith('sudo ')) {
        const innerLine = trimmed.slice(5).trim();
        if (!innerLine) {
            return { stdout: '', stderr: 'sudo: command required\n', exitCode: 1 };
        }
        const savedUser = vfs.getCurrentUser();
        vfs.setCurrentUser('root');
        try {
            return executeCommand(innerLine, vfs);
        } finally {
            vfs.setCurrentUser(savedUser);
        }
    }

    const chainParts = splitOutsideQuotes(trimmed, ['&&', ';']);
    let result = { stdout: '', stderr: '', exitCode: 0 };

    for (let i = 0; i < chainParts.length; i++) {
        const part = chainParts[i];
        const segment = part.text.trim();
        if (!segment) continue;

        if (i > 0 && chainParts[i - 1].delimiter === '&&' && result.exitCode !== 0) {
            break;
        }

        const segmentResult = executePipeline(segment, vfs);
        result = {
            stdout: result.stdout + segmentResult.stdout,
            stderr: result.stderr + segmentResult.stderr,
            exitCode: segmentResult.exitCode,
            clear: result.clear || segmentResult.clear,
        };
    }

    return result;
}

function readLinesFromSources(files, vfs, stdin) {
    const allLines = [];
    if (files.length === 0) {
        const content = stdin || '';
        const lines = content.split('\n');
        if (lines.length > 0 && lines[lines.length - 1] === '') {
            lines.pop();
        }
        for (let i = 0; i < lines.length; i++) {
            allLines.push({ line: lines[i], file: null, lineNum: i + 1 });
        }
        return allLines;
    }

    for (const file of files) {
        const content = vfs.readFile(file);
        const lines = content.split('\n');
        if (lines.length > 0 && lines[lines.length - 1] === '') {
            lines.pop();
        }
        for (let i = 0; i < lines.length; i++) {
            allLines.push({ line: lines[i], file, lineNum: i + 1 });
        }
    }
    return allLines;
}

registerCommand('ls', (args, vfs) => {
    const { positional, options } = parseFlags(args, { a: 'all', l: 'long', d: 'directory' });
    if (options.help) {
        return { stdout: HELP_PAGES.ls, stderr: '', exitCode: 0 };
    }

    if (positional.length > 1) {
        const names = [];
        let stderr = '';
        let exitCode = 0;
        for (const target of positional) {
            try {
                const resolved = vfs.normalizePath(target);
                if (vfs.isDirectory(resolved)) {
                    names.push(...vfs.listDir(target, {
                        showHidden: options.all,
                        longFormat: options.long,
                        directoryOnly: options.directory,
                    }));
                } else if (vfs.exists(resolved)) {
                    const parts = resolved.split('/').filter(Boolean);
                    names.push(parts[parts.length - 1]);
                } else {
                    stderr += `ls: cannot access '${target}': No such file or directory\n`;
                    exitCode = 1;
                }
            } catch (err) {
                stderr += err.message + '\n';
                exitCode = 1;
            }
        }
        const unique = [...new Set(names)].sort();
        if (unique.length === 0) {
            return { stdout: '', stderr, exitCode };
        }
        return { stdout: unique.join('\n') + '\n', stderr, exitCode };
    }

    const target = positional[0] || null;
    try {
        const names = vfs.listDir(target, {
            showHidden: options.all,
            longFormat: options.long,
            directoryOnly: options.directory,
        });
        if (names.length === 0) return { stdout: '', stderr: '', exitCode: 0 };
        return { stdout: names.join('\n') + '\n', stderr: '', exitCode: 0 };
    } catch (err) {
        return { stdout: '', stderr: err.message + '\n', exitCode: 1 };
    }
});

registerCommand('cd', (args, vfs) => {
    const target = args[0] || '/home/user';
    const check = vfs.checkCdPermission(target, target);
    if (!check.ok) {
        if (check.denied) {
            return {
                stdout: '',
                stderr: `cd: ${check.display}: Permission denied\n`,
                exitCode: 1,
            };
        }
        return {
            stdout: '',
            stderr: `cd: ${check.display}: No such file or directory\n`,
            exitCode: 1,
        };
    }
    vfs.setCwd(check.resolved);
    return { stdout: '', stderr: '', exitCode: 0 };
});

registerCommand('whoami', (_args, vfs) => ({
    stdout: vfs.getCurrentUser() + '\n',
    stderr: '',
    exitCode: 0,
}));

registerCommand('chmod', (args, vfs) => {
    if (args.length < 2) {
        return { stdout: '', stderr: 'chmod: missing operand\n', exitCode: 1 };
    }
    const mode = args[0];
    let exitCode = 0;
    let stderr = '';
    for (const path of args.slice(1)) {
        try {
            vfs.chmod(path, mode);
        } catch (err) {
            stderr += err.message + '\n';
            exitCode = 1;
        }
    }
    return { stdout: '', stderr, exitCode };
});

registerCommand('chown', (args, vfs) => {
    if (args.length < 2) {
        return { stdout: '', stderr: 'chown: missing operand\n', exitCode: 1 };
    }
    const ownerSpec = args[0];
    let owner;
    let group;
    if (ownerSpec.includes(':')) {
        [owner, group] = ownerSpec.split(':');
    } else if (ownerSpec.includes('.')) {
        [owner, group] = ownerSpec.split('.');
    } else {
        owner = ownerSpec;
    }
    let exitCode = 0;
    let stderr = '';
    for (const path of args.slice(1)) {
        try {
            vfs.chown(path, owner, group);
        } catch (err) {
            stderr += err.message + '\n';
            exitCode = 1;
        }
    }
    return { stdout: '', stderr, exitCode };
});

registerCommand('chgrp', (args, vfs) => {
    if (args.length < 2) {
        return { stdout: '', stderr: 'chgrp: missing operand\n', exitCode: 1 };
    }
    const group = args[0];
    let exitCode = 0;
    let stderr = '';
    for (const path of args.slice(1)) {
        try {
            vfs.chgrp(path, group);
        } catch (err) {
            stderr += err.message + '\n';
            exitCode = 1;
        }
    }
    return { stdout: '', stderr, exitCode };
});

registerCommand('pwd', (_args, vfs) => ({
    stdout: vfs.getCwd() + '\n',
    stderr: '',
    exitCode: 0,
}));

function formatTreeLabel(name, isDir) {
    return isDir ? `${name}/` : name;
}

function collectTreeChildren(vfs, dirPath) {
    return vfs.listDir(dirPath).map((name) => {
        const fullPath = dirPath === '/' ? `/${name}` : `${dirPath}/${name}`;
        const isDir = vfs.isDirectory(fullPath);
        return { name, isDir, fullPath };
    });
}

function buildTreeLines(vfs, dirPath, prefix) {
    const entries = collectTreeChildren(vfs, dirPath);
    const lines = [];
    for (let i = 0; i < entries.length; i++) {
        const entry = entries[i];
        const isLast = i === entries.length - 1;
        const connector = isLast ? '└── ' : '├── ';
        lines.push(prefix + connector + formatTreeLabel(entry.name, entry.isDir));
        if (entry.isDir) {
            const extension = isLast ? '    ' : '│   ';
            lines.push(...buildTreeLines(vfs, entry.fullPath, prefix + extension));
        }
    }
    return lines;
}

function renderTree(vfs, targetPath, displayLabel) {
    const resolved = vfs.normalizePath(targetPath);
    if (!vfs.exists(resolved)) {
        return {
            stdout: '',
            stderr: `tree: ${displayLabel}: No such file or directory\n`,
            exitCode: 1,
        };
    }

    if (vfs.isFile(resolved)) {
        const name = resolved.split('/').filter(Boolean).pop() || displayLabel;
        return { stdout: name + '\n', stderr: '', exitCode: 0 };
    }

    const perm = vfs._checkPermission(resolved, true, false, true);
    if (!perm.ok) {
        return {
            stdout: '',
            stderr: `tree: ${displayLabel}: Permission denied\n`,
            exitCode: 1,
        };
    }

    const rootLabel = displayLabel === '.'
        ? '.'
        : formatTreeLabel(
            displayLabel.split('/').filter(Boolean).pop() || displayLabel,
            true,
        );
    const lines = [rootLabel];
    lines.push(...buildTreeLines(vfs, resolved, ''));
    return { stdout: lines.join('\n') + '\n', stderr: '', exitCode: 0 };
}

registerCommand('tree', (args, vfs) => {
    if (args.includes('--help')) {
        return { stdout: HELP_PAGES.tree, stderr: '', exitCode: 0 };
    }

    const targets = args.length > 0 ? args : ['.'];
    let stdout = '';
    let stderr = '';
    let exitCode = 0;

    for (let i = 0; i < targets.length; i++) {
        const target = targets[i];
        const displayLabel = target === '.' ? '.' : target.replace(/\/$/, '');
        const result = renderTree(vfs, target, displayLabel);
        stdout += result.stdout;
        stderr += result.stderr;
        if (result.exitCode !== 0) {
            exitCode = result.exitCode;
        }
    }

    return { stdout, stderr, exitCode };
});

registerCommand('clear', () => ({
    stdout: '',
    stderr: '',
    exitCode: 0,
    clear: true,
}));

registerCommand('cat', (args, vfs, ctx = {}) => {
    if (args.length === 0) {
        if (ctx.stdin) {
            const output = ctx.stdin.endsWith('\n') ? ctx.stdin : ctx.stdin + (ctx.stdin ? '\n' : '');
            return { stdout: output, stderr: '', exitCode: 0 };
        }
        return { stdout: '', stderr: 'cat: missing file operand\n', exitCode: 1 };
    }
    try {
        let stdout = '';
        let stderr = '';
        let exitCode = 0;
        for (const file of args) {
            try {
                const content = vfs.readFile(file);
                if (content === '') continue;
                stdout += content.endsWith('\n') ? content : content + '\n';
            } catch (err) {
                stderr += err.message + '\n';
                exitCode = 1;
            }
        }
        return { stdout, stderr, exitCode };
    } catch (err) {
        return { stdout: '', stderr: err.message + '\n', exitCode: 1 };
    }
});

registerCommand('mkdir', (args, vfs) => {
    const { positional, options } = parseFlags(args, { p: 'parents' });
    if (positional.length === 0) {
        return { stdout: '', stderr: 'mkdir: missing operand\n', exitCode: 1 };
    }
    let exitCode = 0;
    let stderr = '';
    for (const dir of positional) {
        try {
            vfs.createDirectory(dir, { parents: options.parents });
        } catch (err) {
            stderr += err.message + '\n';
            exitCode = 1;
        }
    }
    return { stdout: '', stderr, exitCode };
});

registerCommand('touch', (args, vfs) => {
    if (args.length === 0) {
        return { stdout: '', stderr: 'touch: missing file operand\n', exitCode: 1 };
    }
    let exitCode = 0;
    let stderr = '';
    for (const file of args) {
        try {
            vfs.createFile(file);
        } catch (err) {
            stderr += err.message + '\n';
            exitCode = 1;
        }
    }
    return { stdout: '', stderr, exitCode };
});

registerCommand('rm', (args, vfs) => {
    const { positional, options } = parseFlags(args, { r: 'recursive' });
    if (positional.length === 0) {
        return { stdout: '', stderr: 'rm: missing operand\n', exitCode: 1 };
    }
    let exitCode = 0;
    let stderr = '';
    for (const target of positional) {
        try {
            vfs.remove(target, options.recursive);
        } catch (err) {
            stderr += err.message + '\n';
            exitCode = 1;
        }
    }
    return { stdout: '', stderr, exitCode };
});

registerCommand('rmdir', (args, vfs) => {
    if (args.length === 0) {
        return { stdout: '', stderr: 'rmdir: missing operand\n', exitCode: 1 };
    }
    let exitCode = 0;
    let stderr = '';
    for (const target of args) {
        try {
            vfs.removeEmptyDirectory(target);
        } catch (err) {
            stderr += err.message + '\n';
            exitCode = 1;
        }
    }
    return { stdout: '', stderr, exitCode };
});

registerCommand('cp', (args, vfs) => {
    const { positional, options } = parseFlags(args, { r: 'recursive' });
    if (positional.length < 2) {
        return {
            stdout: '',
            stderr: 'cp: missing file operand\n',
            exitCode: 1,
        };
    }
    const dest = positional[positional.length - 1];
    const sources = positional.slice(0, -1);
    let exitCode = 0;
    let stderr = '';
    for (const src of sources) {
        try {
            vfs.copy(src, dest, options.recursive);
        } catch (err) {
            stderr += err.message + '\n';
            exitCode = 1;
        }
    }
    return { stdout: '', stderr, exitCode };
});

registerCommand('mv', (args, vfs) => {
    if (args.length < 2) {
        return { stdout: '', stderr: 'mv: missing file operand\n', exitCode: 1 };
    }
    const dest = args[args.length - 1];
    const sources = args.slice(0, -1);
    let exitCode = 0;
    let stderr = '';
    for (const src of sources) {
        try {
            vfs.move(src, dest);
        } catch (err) {
            stderr += err.message + '\n';
            exitCode = 1;
        }
    }
    return { stdout: '', stderr, exitCode };
});

registerCommand('head', (args, vfs, ctx = {}) => {
    const { n, files } = parseNumFlagArgs(args);
    const targets = files.length > 0 ? files : ctx.stdin ? ['-'] : [];
    if (targets.length === 0) {
        return { stdout: '', stderr: 'head: missing file operand\n', exitCode: 1 };
    }
    let stdout = '';
    let stderr = '';
    let exitCode = 0;
    for (const file of targets) {
        try {
            const content = file === '-' ? (ctx.stdin || '') : vfs.readFile(file);
            const lines = content.split('\n');
            if (lines.length > 0 && lines[lines.length - 1] === '') {
                lines.pop();
            }
            const selected = lines.slice(0, n);
            stdout += selected.join('\n') + (selected.length > 0 ? '\n' : '');
        } catch (err) {
            stderr += err.message.replace(/^cat:/, 'head:') + '\n';
            exitCode = 1;
        }
    }
    return { stdout, stderr, exitCode };
});

registerCommand('tail', (args, vfs, ctx = {}) => {
    const { n, files } = parseNumFlagArgs(args);
    const targets = files.length > 0 ? files : ctx.stdin ? ['-'] : [];
    if (targets.length === 0) {
        return { stdout: '', stderr: 'tail: missing file operand\n', exitCode: 1 };
    }
    let stdout = '';
    let stderr = '';
    let exitCode = 0;
    for (const file of targets) {
        try {
            const content = file === '-' ? (ctx.stdin || '') : vfs.readFile(file);
            const lines = content.split('\n');
            if (lines.length > 0 && lines[lines.length - 1] === '') {
                lines.pop();
            }
            const selected = lines.slice(Math.max(0, lines.length - n));
            stdout += selected.join('\n') + (selected.length > 0 ? '\n' : '');
        } catch (err) {
            stderr += err.message.replace(/^cat:/, 'tail:') + '\n';
            exitCode = 1;
        }
    }
    return { stdout, stderr, exitCode };
});

registerCommand('wc', (args, vfs, ctx = {}) => {
    const { positional, options } = parseFlags(args, { l: 'lines', w: 'words', c: 'chars' });
    const files = positional.length > 0 ? positional : ctx.stdin ? ['-'] : [];
    if (files.length === 0) {
        return { stdout: '', stderr: 'wc: missing file operand\n', exitCode: 1 };
    }
    const showAll = !options.lines && !options.words && !options.chars;
    let stdout = '';
    let stderr = '';
    let exitCode = 0;

    for (const file of files) {
        try {
            const content = file === '-' ? (ctx.stdin || '') : vfs.readFile(file);
            const lineParts = content.split('\n');
            if (lineParts.length > 0 && lineParts[lineParts.length - 1] === '') {
                lineParts.pop();
            }
            const lines = content === '' ? 0 : lineParts.length;
            const words = content.trim() === '' ? 0 : content.trim().split(/\s+/).length;
            const chars = content.length;
            const parts = [];
            if (showAll || options.lines) parts.push(String(lines));
            if (showAll || options.words) parts.push(String(words));
            if (showAll || options.chars) parts.push(String(chars));
            const label = file === '-' ? '' : ' ' + file;
            stdout += parts.join(' ') + label + '\n';
        } catch (err) {
            stderr += err.message.replace(/^cat:/, 'wc:') + '\n';
            exitCode = 1;
        }
    }
    return { stdout, stderr, exitCode };
});

registerCommand('grep', (args, vfs, ctx = {}) => {
    const { positional, options } = parseFlags(args, {
        i: 'ignoreCase',
        n: 'lineNumbers',
        v: 'invert',
        c: 'count',
    });
    if (options.help) {
        return { stdout: HELP_PAGES.grep, stderr: '', exitCode: 0 };
    }
    if (positional.length === 0) {
        return { stdout: '', stderr: 'grep: missing pattern\n', exitCode: 2 };
    }

    const pattern = positional[0];
    const files = positional.slice(1);
    let entries;
    try {
        entries = readLinesFromSources(files, vfs, ctx.stdin);
    } catch (err) {
        return { stdout: '', stderr: err.message.replace(/^cat:/, 'grep:') + '\n', exitCode: 2 };
    }

    const regex = new RegExp(
        pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
        options.ignoreCase ? 'i' : ''
    );

    const matches = [];
    const lineCounts = {};

    for (const entry of entries) {
        const isMatch = regex.test(entry.line);
        const keep = options.invert ? !isMatch : isMatch;
        if (keep) {
            matches.push(entry);
            if (entry.file) {
                lineCounts[entry.file] = (lineCounts[entry.file] || 0) + 1;
            }
        }
    }

    if (options.count) {
        let stdout = '';
        if (files.length === 0) {
            stdout = String(matches.length) + '\n';
        } else if (files.length === 1) {
            stdout = String(matches.length) + '\n';
        } else {
            for (const file of files) {
                stdout += String(lineCounts[file] || 0) + ' ' + file + '\n';
            }
        }
        return { stdout, stderr: '', exitCode: matches.length > 0 ? 0 : 1 };
    }

    if (matches.length === 0) {
        return { stdout: '', stderr: '', exitCode: 1 };
    }

    let stdout = '';
    for (const entry of matches) {
        let prefix = '';
        if (files.length > 1 && entry.file) {
            prefix = entry.file + ':';
        }
        if (options.lineNumbers) {
            prefix += String(entry.lineNum) + ':';
        }
        stdout += prefix + entry.line + '\n';
    }

    return { stdout, stderr: '', exitCode: 0 };
});

registerCommand('find', (args, vfs) => {
    if (args.includes('--help')) {
        return { stdout: HELP_PAGES.find, stderr: '', exitCode: 0 };
    }
    if (args.length < 3 || args[1] !== '-name') {
        return {
            stdout: '',
            stderr: 'find: missing -name pattern\n',
            exitCode: 1,
        };
    }

    const startDir = args[0];
    const pattern = args[2];

    if (!vfs.isDirectory(vfs.normalizePath(startDir))) {
        return {
            stdout: '',
            stderr: `find: '${startDir}': No such file or directory\n`,
            exitCode: 1,
        };
    }

    try {
        const results = vfs.findByName(startDir, pattern);
        if (results.length === 0) {
            return { stdout: '', stderr: '', exitCode: 0 };
        }
        return { stdout: results.join('\n') + '\n', stderr: '', exitCode: 0 };
    } catch (err) {
        return { stdout: '', stderr: err.message + '\n', exitCode: 1 };
    }
});

registerCommand('echo', (args) => {
    if (args.includes('--help')) {
        return { stdout: HELP_PAGES.echo, stderr: '', exitCode: 0 };
    }
    const text = args.length === 0 ? '' : args.map((a) => expandEnvVars(a)).join(' ');
    return { stdout: text + '\n', stderr: '', exitCode: 0 };
});

registerCommand('man', (args) => {
    if (args.length === 0) {
        return { stdout: '', stderr: 'What manual page do you want?\n', exitCode: 1 };
    }
    const page = HELP_PAGES[args[0]];
    if (!page) {
        return {
            stdout: '',
            stderr: `No manual entry for ${args[0]}\n`,
            exitCode: 1,
        };
    }
    return { stdout: page, stderr: '', exitCode: 0 };
});

const CURL_RESPONSES = {
    'https://dojo.example/api/hello': '{"message":"Hello from Dojo API"}\n',
    'https://dojo.example/data/info.txt': 'IZM Linux Dojo\nVersion 1.0\n',
    'https://dojo.example/api/status': '{"status":"ok","uptime":"24h"}\n',
};

registerCommand('ps', () => {
    const pm = window.shellRuntime?.processManager;
    if (!pm) {
        return { stdout: '', stderr: 'ps: process manager unavailable\n', exitCode: 1 };
    }
    return { stdout: pm.formatPs(), stderr: '', exitCode: 0 };
});

registerCommand('kill', (args) => {
    const pm = window.shellRuntime?.processManager;
    if (!pm) {
        return { stdout: '', stderr: 'kill: process manager unavailable\n', exitCode: 1 };
    }
    if (args.length === 0) {
        return { stdout: '', stderr: 'kill: usage: kill [-s sigspec | -n signum] pid\n', exitCode: 1 };
    }
    const pid = parseInt(args[args.length - 1], 10);
    if (Number.isNaN(pid)) {
        return {
            stdout: '',
            stderr: `kill: '${args[args.length - 1]}': arguments must be process or job IDs\n`,
            exitCode: 1,
        };
    }
    const result = pm.kill(pid);
    if (!result.success) {
        return { stdout: '', stderr: result.error + '\n', exitCode: 1 };
    }
    return { stdout: '', stderr: '', exitCode: 0 };
});

registerCommand('jobs', () => {
    const pm = window.shellRuntime?.processManager;
    if (!pm) {
        return { stdout: '', stderr: 'jobs: process manager unavailable\n', exitCode: 1 };
    }
    return { stdout: pm.formatJobs(), stderr: '', exitCode: 0 };
});

registerCommand('curl', (args, vfs) => {
    let outputFile = null;
    const urls = [];
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (arg === '-o') {
            if (i + 1 >= args.length) {
                return { stdout: '', stderr: 'curl: option -o requires an argument\n', exitCode: 2 };
            }
            outputFile = args[++i];
        } else if (arg.startsWith('-')) {
            continue;
        } else {
            urls.push(arg);
        }
    }
    if (urls.length === 0) {
        return { stdout: '', stderr: 'curl: no URL specified\n', exitCode: 2 };
    }
    const url = urls[0];
    const body = CURL_RESPONSES[url];
    if (body === undefined) {
        const host = url.replace(/^https?:\/\//, '').split('/')[0];
        return {
            stdout: '',
            stderr: `curl: (6) Could not resolve host: ${host}\n`,
            exitCode: 6,
        };
    }
    if (outputFile) {
        try {
            vfs.writeFile(outputFile, body);
        } catch (err) {
            return { stdout: '', stderr: `curl: ${err.message}\n`, exitCode: 23 };
        }
        return { stdout: '', stderr: '', exitCode: 0 };
    }
    return { stdout: body, stderr: '', exitCode: 0 };
});

window.shellCommands = {
    registerCommand,
    parseCommandLine,
    executeCommand,
    getCommandNames: () => Object.keys(shellCommands).sort(),
};
