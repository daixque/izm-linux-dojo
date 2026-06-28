/**
 * Shell Tab completion
 */
function getWordBounds(line, cursorPos) {
    let start = Math.min(cursorPos, line.length);
    while (start > 0 && line[start - 1] !== ' ') {
        start--;
    }
    let end = cursorPos;
    while (end < line.length && line[end] !== ' ') {
        end++;
    }
    return { start, end, word: line.slice(start, end) };
}

function isFirstToken(line, wordStart) {
    return line.slice(0, wordStart).trim() === '';
}

function looksLikePath(word) {
    return word.includes('/') || word.startsWith('~');
}

function splitPathWord(word) {
    const lastSlash = word.lastIndexOf('/');
    if (lastSlash === -1) {
        return { dirPart: '', partial: word };
    }
    return {
        dirPart: word.slice(0, lastSlash + 1),
        partial: word.slice(lastSlash + 1),
    };
}

function commonPrefix(strings) {
    if (strings.length === 0) return '';
    let prefix = strings[0];
    for (let i = 1; i < strings.length; i++) {
        while (prefix && !strings[i].startsWith(prefix)) {
            prefix = prefix.slice(0, -1);
        }
    }
    return prefix;
}

function resolveSearchDirectory(vfs, dirPart) {
    if (!dirPart) {
        return vfs.getCwd();
    }

    let pathToResolve = dirPart.endsWith('/') ? dirPart.slice(0, -1) : dirPart;
    if (!pathToResolve) {
        return vfs.getCwd();
    }

    const resolved = vfs.normalizePath(pathToResolve);
    return vfs.isDirectory(resolved) ? resolved : null;
}

function getPathMatches(vfs, word) {
    const { dirPart, partial } = splitPathWord(word);
    const searchDir = resolveSearchDirectory(vfs, dirPart);
    if (!searchDir) {
        return [];
    }

    try {
        return vfs
            .listDir(searchDir)
            .filter((name) => name.startsWith(partial))
            .map((name) => {
                const fullPath =
                    searchDir === '/' ? `/${name}` : `${searchDir}/${name}`;
                return {
                    name,
                    isDir: vfs.isDirectory(fullPath),
                };
            });
    } catch {
        return [];
    }
}

function getCommandMatches(partial) {
    const commands = window.shellCommands.getCommandNames();
    return commands
        .filter((name) => name.startsWith(partial))
        .map((name) => ({ name, isDir: false }));
}

function formatPathReplacement(dirPart, match) {
    return dirPart + (match.isDir ? `${match.name}/` : match.name);
}

function completeLine(line, cursorPos, vfs, options = {}) {
    const { start, end, word } = getWordBounds(line, cursorPos);
    const completingCommand = isFirstToken(line, start) && !looksLikePath(word);

    let matches;
    let partial;
    let dirPart = '';

    if (completingCommand) {
        matches = getCommandMatches(word);
        partial = word;
    } else {
        ({ dirPart, partial } = splitPathWord(word));
        matches = getPathMatches(vfs, word);
    }

    if (matches.length === 0) {
        return null;
    }

    if (options.listOnly) {
        const display = completingCommand
            ? matches.map((m) => m.name)
            : matches.map((m) => formatPathReplacement(dirPart, m));
        return { listMatches: display };
    }

    let replacement;

    if (matches.length === 1) {
        const match = matches[0];
        replacement = completingCommand
            ? `${match.name} `
            : formatPathReplacement(dirPart, match);
    } else {
        const prefix = commonPrefix(matches.map((m) => m.name));
        if (prefix.length <= partial.length) {
            const display = completingCommand
                ? matches.map((m) => m.name)
                : matches.map((m) => formatPathReplacement(dirPart, m));
            if (options.listOnly) {
                return { listMatches: display };
            }
            return null;
        }
        replacement = completingCommand
            ? prefix
            : dirPart + prefix;
    }

    const newLine = line.slice(0, start) + replacement + line.slice(end);
    return {
        newLine,
        newCursorPos: start + replacement.length,
    };
}

window.shellCompletion = {
    completeLine,
    getWordBounds,
    commonPrefix,
};
