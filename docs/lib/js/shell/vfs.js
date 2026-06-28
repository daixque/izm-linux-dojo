/**
 * 仮想ファイルシステム
 * YAML で定義されたツリー構造をメモリ上で管理する
 */
class VirtualFilesystem {
    constructor(initialTree = {}, initialCwd = '/home/user') {
        this._initialTree = initialTree;
        this._initialCwd = initialCwd;
        this.root = this._cloneTree(this._normalizeInitialTree(initialTree));
        this.cwd = initialCwd;
        this.currentUser = 'user';
        this._applyDefaultsRecursive(this.root);
    }

    _cloneTree(tree) {
        return JSON.parse(JSON.stringify(tree || {}));
    }

    _defaultMode(isDir) {
        return isDir ? 0o755 : 0o644;
    }

    _normalizeMode(mode) {
        if (typeof mode === 'string') {
            return parseInt(mode, 8);
        }
        if (typeof mode === 'number') {
            // Already converted (e.g. 420 for 0644); YAML octal like 644/755 is > 511
            if (mode <= 0o777) {
                return mode;
            }
            return parseInt(String(mode), 8);
        }
        return mode;
    }

    _applyDefaultsRecursive(nodeMap) {
        if (!nodeMap || typeof nodeMap !== 'object') return;
        for (const entry of Object.values(nodeMap)) {
            if (!entry || typeof entry !== 'object') continue;
            const isDir = entry.type === 'directory';
            if (entry.owner === undefined) entry.owner = 'user';
            if (entry.group === undefined) entry.group = 'user';
            if (entry.mode === undefined) {
                entry.mode = this._defaultMode(isDir);
            } else {
                entry.mode = this._normalizeMode(entry.mode);
            }
            if (isDir && entry.children) {
                this._applyDefaultsRecursive(entry.children);
            }
        }
    }

    /** /home/user 形式のキーをネストしたツリーに変換 */
    _normalizeInitialTree(tree) {
        if (!tree || typeof tree !== 'object') return {};

        const hasPathKeys = Object.keys(tree).some(k => k.startsWith('/'));
        if (!hasPathKeys) return tree;

        const result = {};
        for (const [key, value] of Object.entries(tree)) {
            if (!key.startsWith('/')) {
                result[key] = value;
                continue;
            }
            const parts = key.split('/').filter(Boolean);
            let current = result;
            for (let i = 0; i < parts.length; i++) {
                const part = parts[i];
                const isLast = i === parts.length - 1;
                if (isLast) {
                    current[part] = value;
                } else {
                    if (!current[part] || current[part].type !== 'directory') {
                        current[part] = { type: 'directory', children: {} };
                    }
                    if (!current[part].children) current[part].children = {};
                    current = current[part].children;
                }
            }
        }
        return result;
    }

    reset(initialTree, initialCwd) {
        const tree = initialTree ?? this._initialTree;
        this.root = this._cloneTree(this._normalizeInitialTree(tree));
        this.cwd = initialCwd ?? this._initialCwd;
        this.currentUser = 'user';
        this._applyDefaultsRecursive(this.root);
    }

    clone() {
        const vfs = new VirtualFilesystem(this.root, this.cwd);
        vfs._initialTree = this._initialTree;
        vfs._initialCwd = this._initialCwd;
        vfs.currentUser = this.currentUser;
        return vfs;
    }

    getCurrentUser() {
        return this.currentUser;
    }

    setCurrentUser(user) {
        this.currentUser = user;
    }

    getCwd() {
        return this.cwd;
    }

    setCwd(path) {
        this.cwd = path;
    }

    _expandTilde(path) {
        if (path === '~') return '/home/user';
        if (path.startsWith('~/')) return '/home/user' + path.slice(1);
        return path;
    }

    normalizePath(path) {
        if (!path) return this.cwd;
        path = this._expandTilde(path);
        let absolute;
        if (path.startsWith('/')) {
            absolute = path;
        } else {
            absolute = this.cwd === '/' ? `/${path}` : `${this.cwd}/${path}`;
        }

        const parts = absolute.split('/').filter(Boolean);
        const resolved = [];
        for (const part of parts) {
            if (part === '.') continue;
            if (part === '..') {
                resolved.pop();
            } else {
                resolved.push(part);
            }
        }
        return '/' + resolved.join('/');
    }

    _getNode(path) {
        const normalized = this.normalizePath(path);
        if (normalized === '/') {
            return { node: { type: 'directory', children: this.root, owner: 'root', group: 'root', mode: 0o755 }, path: '/', name: '' };
        }

        const parts = normalized.split('/').filter(Boolean);
        let current = this.root;
        let currentPath = '';

        for (let i = 0; i < parts.length; i++) {
            const part = parts[i];
            currentPath += '/' + part;

            if (!current || typeof current !== 'object') {
                return null;
            }

            const entry = current[part];
            if (entry === undefined) {
                return null;
            }

            if (i === parts.length - 1) {
                return { node: entry, path: currentPath, name: part };
            }

            if (entry.type !== 'directory') {
                return null;
            }
            current = entry.children || {};
        }
        return null;
    }

    _getMode(node) {
        if (!node) return 0;
        const isDir = node.type === 'directory';
        if (node.mode === undefined) return this._defaultMode(isDir);
        return node.mode;
    }

    _getOwner(node) {
        return node?.owner ?? 'user';
    }

    _getGroup(node) {
        return node?.group ?? 'user';
    }

    _getPermissionBits(node) {
        if (this.currentUser === 'root') return 7;
        const mode = this._getMode(node);
        const owner = this._getOwner(node);
        const group = this._getGroup(node);
        if (this.currentUser === owner) return (mode >> 6) & 7;
        if (this.currentUser === group) return (mode >> 3) & 7;
        return mode & 7;
    }

    _checkPermission(path, needRead, needWrite, needExecute) {
        const result = this._getNode(path);
        if (!result) return { ok: true };
        const bits = this._getPermissionBits(result.node);
        if (needRead && (bits & 4) === 0) {
            return { ok: false, path: result.path };
        }
        if (needWrite && (bits & 2) === 0) {
            return { ok: false, path: result.path };
        }
        if (needExecute && (bits & 1) === 0) {
            return { ok: false, path: result.path };
        }
        return { ok: true };
    }

    _checkParentWrite(path, displayPath) {
        const ctx = this._getParentContext(path);
        if (!ctx || ctx.parentMissing) return { ok: true };
        const parentPath = ctx.parentPath === '/' ? '/' : ctx.parentPath;
        const parentResult = parentPath === '/'
            ? { node: { type: 'directory', children: this.root, owner: 'root', group: 'root', mode: 0o755 } }
            : this._getNode(parentPath);
        if (!parentResult) return { ok: true };
        const bits = this._getPermissionBits(parentResult.node);
        if ((bits & 3) !== 3) {
            return { ok: false, path: displayPath ?? ctx.normalized };
        }
        return { ok: true };
    }

    /** ディレクトリからエントリを削除する権限（rm / mv の unlink 相当） */
    _checkUnlink(path, displayPath) {
        if (this.currentUser === 'root') return { ok: true };

        const normalized = this.normalizePath(path);
        const result = this._getNode(normalized);
        if (!result) return { ok: true };

        const parentPerm = this._checkParentWrite(path, displayPath);
        if (!parentPerm.ok) return parentPerm;

        const targetPerm = this._checkPermission(path, false, true, false);
        if (!targetPerm.ok) {
            return { ok: false, path: displayPath ?? result.path };
        }
        return { ok: true };
    }

    _permissionDenied(path) {
        return { ok: false, path: this.normalizePath(path) };
    }

    exists(path) {
        return this._getNode(path) !== null;
    }

    isDirectory(path) {
        const result = this._getNode(path);
        return result !== null && result.node.type === 'directory';
    }

    isFile(path) {
        const result = this._getNode(path);
        return result !== null && result.node.type === 'file';
    }

    _getParentContext(path) {
        const normalized = this.normalizePath(path);
        const parts = normalized.split('/').filter(Boolean);
        if (parts.length === 0) {
            return null;
        }
        const name = parts.pop();
        const parentPath = parts.length === 0 ? '/' : '/' + parts.join('/');

        let parentChildren;
        if (parentPath === '/') {
            parentChildren = this.root;
        } else {
            const parentResult = this._getNode(parentPath);
            if (!parentResult) {
                return { parentMissing: true, parentPath, name, normalized };
            }
            if (parentResult.node.type !== 'directory') {
                return { parentNotDir: true, parentPath, name, normalized };
            }
            if (!parentResult.node.children) {
                parentResult.node.children = {};
            }
            parentChildren = parentResult.node.children;
        }
        return { parentChildren, parentPath, name, normalized };
    }

    _cloneNode(node) {
        return JSON.parse(JSON.stringify(node));
    }

    _newNode(type, content = '') {
        const isDir = type === 'directory';
        const node = {
            type,
            owner: this.currentUser,
            group: this.currentUser,
            mode: this._defaultMode(isDir),
        };
        if (isDir) {
            node.children = {};
        } else {
            node.content = content;
        }
        return node;
    }

    _removeNode(path) {
        const ctx = this._getParentContext(path);
        if (!ctx || ctx.parentMissing) {
            throw new Error(`rm: cannot remove '${this.normalizePath(path)}': No such file or directory`);
        }
        if (!ctx.parentChildren[ctx.name]) {
            throw new Error(`rm: cannot remove '${ctx.normalized}': No such file or directory`);
        }
        delete ctx.parentChildren[ctx.name];
    }

    _removeRecursive(node, basePath) {
        if (node.type === 'file') {
            const perm = this._checkUnlink(basePath, basePath);
            if (!perm.ok) {
                throw new Error(`rm: cannot remove '${basePath}': Permission denied`);
            }
            this._removeNode(basePath);
            return;
        }
        const children = node.children || {};
        for (const childName of Object.keys(children)) {
            const childPath = basePath === '/' ? `/${childName}` : `${basePath}/${childName}`;
            this._removeRecursive(children[childName], childPath);
        }
        const perm = this._checkUnlink(basePath, basePath);
        if (!perm.ok) {
            throw new Error(`rm: cannot remove '${basePath}': Permission denied`);
        }
        this._removeNode(basePath);
    }

    _modeToString(mode, isDir) {
        const bits = mode;
        const typeChar = isDir ? 'd' : '-';
        const rwx = (n) =>
            ((n & 4) ? 'r' : '-') +
            ((n & 2) ? 'w' : '-') +
            ((n & 1) ? 'x' : '-');
        const u = (bits >> 6) & 7;
        const g = (bits >> 3) & 7;
        const o = bits & 7;
        return typeChar + rwx(u) + rwx(g) + rwx(o);
    }

    _formatLongEntry(name, node) {
        const isDir = node.type === 'directory';
        const mode = this._getMode(node);
        const owner = this._getOwner(node);
        const group = this._getGroup(node);
        const size = isDir ? 4096 : (node.content ?? '').length;
        const links = isDir ? 2 : 1;
        const sizeStr = String(size).padStart(4, ' ');
        return `${this._modeToString(mode, isDir)} ${links} ${owner} ${group} ${sizeStr} Jan  1 10:00 ${name}`;
    }

    listDir(path, options = {}) {
        const showHidden = options.showHidden === true;
        const longFormat = options.longFormat === true;
        const directoryOnly = options.directoryOnly === true;
        const target = path ? this.normalizePath(path) : this.cwd;
        const result = this._getNode(target);
        if (!result) {
            throw new Error(`ls: cannot access '${target}': No such file or directory`);
        }

        if (result.node.type !== 'directory' || directoryOnly) {
            const name = result.name || target.split('/').filter(Boolean).pop() || target;
            if (longFormat) {
                return [this._formatLongEntry(name, result.node)];
            }
            return [name];
        }

        const perm = this._checkPermission(target, true, false, true);
        if (!perm.ok) {
            throw new Error(`ls: cannot open directory '${target}': Permission denied`);
        }

        const children = result.node.children || {};
        let names = Object.keys(children)
            .filter(name => showHidden || !name.startsWith('.'))
            .sort();
        if (showHidden) {
            names = ['.', '..', ...names];
        }

        if (longFormat) {
            return names.map(name => {
                if (name === '.') {
                    return this._formatLongEntry('.', result.node);
                }
                if (name === '..') {
                    const parentPath = target === '/' ? '/' : target.split('/').slice(0, -1).join('/') || '/';
                    const parent = parentPath === '/'
                        ? { type: 'directory', owner: 'root', group: 'root', mode: 0o755, children: this.root }
                        : this._getNode(parentPath)?.node;
                    return this._formatLongEntry('..', parent || result.node);
                }
                return this._formatLongEntry(name, children[name]);
            });
        }
        return names;
    }

    createDirectory(path, options = {}) {
        const parents = options.parents === true;
        const displayPath = path;
        const ctx = this._getParentContext(path);
        if (!ctx) {
            throw new Error(`mkdir: cannot create directory '${displayPath}': Invalid argument`);
        }

        if (ctx.parentMissing) {
            if (parents) {
                this.createDirectory(ctx.parentPath, { parents: true });
                return this.createDirectory(path, { parents: true });
            }
            throw new Error(`mkdir: cannot create directory '${displayPath}': No such file or directory`);
        }

        const parentPerm = this._checkParentWrite(path, displayPath);
        if (!parentPerm.ok) {
            throw new Error(`mkdir: cannot create directory '${displayPath}': Permission denied`);
        }

        const existing = ctx.parentChildren[ctx.name];
        if (existing !== undefined) {
            if (parents && existing.type === 'directory') {
                return;
            }
            throw new Error(`mkdir: cannot create directory '${displayPath}': File exists`);
        }

        ctx.parentChildren[ctx.name] = this._newNode('directory');
    }

    createFile(path, content = '') {
        const displayPath = path;
        const ctx = this._getParentContext(path);
        if (!ctx || ctx.parentMissing) {
            throw new Error(`touch: cannot touch '${displayPath}': No such file or directory`);
        }

        const existing = ctx.parentChildren[ctx.name];
        if (existing !== undefined) {
            if (existing.type === 'directory') {
                throw new Error(`touch: cannot touch '${displayPath}': Is a directory`);
            }
            const perm = this._checkPermission(path, false, true, false);
            if (!perm.ok) {
                throw new Error(`touch: cannot touch '${displayPath}': Permission denied`);
            }
            return;
        }

        const parentPerm = this._checkParentWrite(path, displayPath);
        if (!parentPerm.ok) {
            throw new Error(`touch: cannot touch '${displayPath}': Permission denied`);
        }

        ctx.parentChildren[ctx.name] = this._newNode('file', content);
    }

    removeEmptyDirectory(path) {
        const normalized = this.normalizePath(path);
        const result = this._getNode(normalized);
        if (!result) {
            throw new Error(`rmdir: failed to remove '${path}': No such file or directory`);
        }
        if (result.node.type !== 'directory') {
            throw new Error(`rmdir: failed to remove '${path}': Not a directory`);
        }
        const children = result.node.children || {};
        if (Object.keys(children).length > 0) {
            throw new Error(`rmdir: failed to remove '${path}': Directory not empty`);
        }
        const unlinkPerm = this._checkUnlink(path, path);
        if (!unlinkPerm.ok) {
            throw new Error(`rmdir: failed to remove '${path}': Permission denied`);
        }
        this._removeNode(path);
    }

    remove(path, recursive = false) {
        const normalized = this.normalizePath(path);
        const result = this._getNode(normalized);
        if (!result) {
            throw new Error(`rm: cannot remove '${path}': No such file or directory`);
        }

        if (!recursive) {
            const unlinkPerm = this._checkUnlink(path, path);
            if (!unlinkPerm.ok) {
                throw new Error(`rm: cannot remove '${path}': Permission denied`);
            }
        }

        if (result.node.type === 'file') {
            this._removeNode(path);
            return;
        }

        const children = result.node.children || {};
        if (!recursive) {
            throw new Error(`rm: cannot remove '${path}': Is a directory`);
        }

        this._removeRecursive(result.node, normalized);
    }

    copy(src, dest, recursive = false) {
        const srcNorm = this.normalizePath(src);
        const destNorm = this.normalizePath(dest);
        const srcResult = this._getNode(srcNorm);
        if (!srcResult) {
            throw new Error(`cp: cannot stat '${src}': No such file or directory`);
        }

        const srcPerm = this._checkPermission(src, true, false, false);
        if (!srcPerm.ok) {
            throw new Error(`cp: cannot stat '${src}': Permission denied`);
        }

        let destParentChildren;
        let destName;

        if (this.exists(destNorm) && this.isDirectory(destNorm)) {
            destName = srcResult.name;
            const destDir = this._getNode(destNorm);
            if (!destDir.node.children) destDir.node.children = {};
            destParentChildren = destDir.node.children;
            const destPerm = this._checkPermission(destNorm, false, true, true);
            if (!destPerm.ok) {
                throw new Error(`cp: cannot create regular file '${dest}/${destName}': Permission denied`);
            }
        } else {
            const destParentCtx = this._getParentContext(dest);
            if (!destParentCtx || destParentCtx.parentMissing) {
                throw new Error(`cp: cannot create regular file '${dest}': No such file or directory`);
            }
            destName = destParentCtx.name;
            destParentChildren = destParentCtx.parentChildren;
            const parentPerm = this._checkParentWrite(dest, dest);
            if (!parentPerm.ok) {
                throw new Error(`cp: cannot create regular file '${dest}': Permission denied`);
            }
        }

        if (srcResult.node.type === 'directory') {
            if (!recursive) {
                throw new Error(`cp: -r not specified; omitting directory '${src}'`);
            }
            if (destNorm === srcNorm || destNorm.startsWith(srcNorm + '/')) {
                throw new Error(`cp: cannot copy a directory, '${src}', into itself, '${dest}'`);
            }
            destParentChildren[destName] = this._cloneNode(srcResult.node);
            return;
        }

        destParentChildren[destName] = this._cloneNode(srcResult.node);
    }

    move(src, dest) {
        const srcNorm = this.normalizePath(src);
        const destNorm = this.normalizePath(dest);
        const srcResult = this._getNode(srcNorm);
        if (!srcResult) {
            throw new Error(`mv: cannot stat '${src}': No such file or directory`);
        }

        const srcUnlinkPerm = this._checkUnlink(src, src);
        if (!srcUnlinkPerm.ok) {
            throw new Error(`mv: cannot move '${src}': Permission denied`);
        }

        let destParentChildren;
        let destName;

        if (this.exists(destNorm) && this.isDirectory(destNorm)) {
            destName = srcResult.name;
            const destDir = this._getNode(destNorm);
            if (!destDir.node.children) destDir.node.children = {};
            destParentChildren = destDir.node.children;
            if (destParentChildren[destName] !== undefined) {
                throw new Error(`mv: cannot move '${src}' to '${dest}/${destName}': File exists`);
            }
            const destPerm = this._checkPermission(destNorm, false, true, true);
            if (!destPerm.ok) {
                throw new Error(`mv: cannot move '${src}' to '${dest}': Permission denied`);
            }
        } else {
            const destCtx = this._getParentContext(dest);
            if (!destCtx || destCtx.parentMissing) {
                throw new Error(`mv: cannot move '${src}' to '${dest}': No such file or directory`);
            }
            destName = destCtx.name;
            destParentChildren = destCtx.parentChildren;
            const parentPerm = this._checkParentWrite(dest, dest);
            if (!parentPerm.ok) {
                throw new Error(`mv: cannot move '${src}' to '${dest}': Permission denied`);
            }
        }

        if (destNorm === srcNorm || destNorm.startsWith(srcNorm + '/')) {
            throw new Error(`mv: cannot move '${src}' to '${dest}': Invalid argument`);
        }

        destParentChildren[destName] = srcResult.node;
        this._removeNode(src);
    }

    readFile(path) {
        const result = this._getNode(path);
        if (!result) {
            throw new Error(`cat: ${path}: No such file or directory`);
        }
        if (result.node.type !== 'file') {
            throw new Error(`cat: ${path}: Is a directory`);
        }
        const perm = this._checkPermission(path, true, false, false);
        if (!perm.ok) {
            throw new Error(`cat: ${path}: Permission denied`);
        }
        return result.node.content ?? '';
    }

    checkCdPermission(path, displayPath) {
        const resolved = this.normalizePath(path);
        if (!this.isDirectory(resolved)) {
            return { ok: false, notFound: true, display: displayPath };
        }
        const perm = this._checkPermission(resolved, false, false, true);
        if (!perm.ok) {
            return { ok: false, denied: true, display: displayPath };
        }
        return { ok: true, resolved };
    }

    checkExecuteFilePermission(path, displayPath) {
        const resolved = this.normalizePath(path);
        if (!this.exists(resolved)) {
            return { ok: false, notFound: true, display: displayPath };
        }
        if (this.isDirectory(resolved)) {
            return { ok: false, isDirectory: true, display: displayPath };
        }
        const perm = this._checkPermission(resolved, false, false, true);
        if (!perm.ok) {
            return { ok: false, denied: true, display: displayPath };
        }
        return { ok: true, resolved };
    }

    chmod(path, modeSpec) {
        const result = this._getNode(path);
        if (!result) {
            throw new Error(`chmod: cannot access '${path}': No such file or directory`);
        }
        const isOwner = this.currentUser === this._getOwner(result.node);
        if (this.currentUser !== 'root' && !isOwner) {
            throw new Error(`chmod: changing permissions of '${path}': Operation not permitted`);
        }
        const newMode = this._parseModeSpec(modeSpec, this._getMode(result.node), result.node.type === 'directory');
        result.node.mode = newMode;
    }

    _parseModeSpec(spec, currentMode, isDir) {
        if (/^[0-7]{3,4}$/.test(spec)) {
            const oct = parseInt(spec.slice(-3), 8);
            return oct;
        }

        let mode = currentMode;
        const clauses = spec.split(',');
        for (const clause of clauses) {
            const match = clause.trim().match(/^([ugoa]*)([-+=])([rwxXst]+)$/);
            if (!match) {
                throw new Error(`chmod: invalid mode: '${spec}'`);
            }
            let [, who, op, perms] = match;
            if (!who) who = 'a';

            let mask = 0;
            for (const p of perms) {
                if (p === 'r') mask |= 4;
                else if (p === 'w') mask |= 2;
                else if (p === 'x') mask |= 1;
                else if (p === 'X' && (isDir || (mode & 0o111))) mask |= 1;
            }

            const applyTo = (bits, shift) => {
                const current = (bits >> shift) & 7;
                let next;
                if (op === '+') next = current | mask;
                else if (op === '-') next = current & ~mask;
                else next = mask;
                return (bits & ~(7 << shift)) | (next << shift);
            };

            if (who.includes('a')) {
                mode = applyTo(mode, 6);
                mode = applyTo(mode, 3);
                mode = applyTo(mode, 0);
            } else {
                if (who.includes('u')) mode = applyTo(mode, 6);
                if (who.includes('g')) mode = applyTo(mode, 3);
                if (who.includes('o')) mode = applyTo(mode, 0);
            }
        }
        return mode;
    }

    chown(path, owner, group) {
        const result = this._getNode(path);
        if (!result) {
            throw new Error(`chown: cannot access '${path}': No such file or directory`);
        }
        const isOwner = this.currentUser === this._getOwner(result.node);
        if (this.currentUser !== 'root' && !isOwner) {
            throw new Error(`chown: changing ownership of '${path}': Operation not permitted`);
        }
        result.node.owner = owner;
        if (group !== undefined) {
            result.node.group = group;
        }
    }

    chgrp(path, group) {
        const result = this._getNode(path);
        if (!result) {
            throw new Error(`chgrp: cannot access '${path}': No such file or directory`);
        }
        const isOwner = this.currentUser === this._getOwner(result.node);
        if (this.currentUser !== 'root' && !isOwner) {
            throw new Error(`chgrp: changing group of '${path}': Operation not permitted`);
        }
        result.node.group = group;
    }

    writeFile(path, content, options = {}) {
        const append = options.append === true;
        const displayPath = path;
        const ctx = this._getParentContext(path);
        if (!ctx || ctx.parentMissing) {
            throw new Error(`bash: ${displayPath}: No such file or directory`);
        }

        const existing = ctx.parentChildren[ctx.name];
        if (existing !== undefined) {
            if (existing.type === 'directory') {
                throw new Error(`bash: ${displayPath}: Is a directory`);
            }
            const perm = this._checkPermission(path, false, true, false);
            if (!perm.ok) {
                throw new Error(`bash: ${displayPath}: Permission denied`);
            }
            if (append) {
                existing.content = (existing.content ?? '') + content;
            } else {
                existing.content = content;
            }
            return;
        }

        const parentPerm = this._checkParentWrite(path, displayPath);
        if (!parentPerm.ok) {
            throw new Error(`bash: ${displayPath}: Permission denied`);
        }
        ctx.parentChildren[ctx.name] = this._newNode('file', content);
    }

    _globMatch(name, pattern) {
        const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp('^' + escaped.replace(/\*/g, '.*').replace(/\?/g, '.') + '$');
        return regex.test(name);
    }

    globInDir(dirPath, pattern) {
        const normalized = this.normalizePath(dirPath);
        const perm = this._checkPermission(normalized, true, false, true);
        if (!perm.ok) {
            throw new Error(`ls: cannot open directory '${normalized}': Permission denied`);
        }
        const result = this._getNode(normalized);
        if (!result || result.node.type !== 'directory') {
            return [];
        }
        const children = result.node.children || {};
        return Object.keys(children)
            .filter((name) => this._globMatch(name, pattern))
            .sort();
    }

    findByName(startDir, pattern) {
        const results = [];
        const normalized = this.normalizePath(startDir);

        const walk = (dirPath) => {
            const perm = this._checkPermission(dirPath, true, false, true);
            if (!perm.ok) return;

            const nodeResult = this._getNode(dirPath);
            if (!nodeResult || nodeResult.node.type !== 'directory') return;

            const children = nodeResult.node.children || {};
            for (const name of Object.keys(children).sort()) {
                const childPath = dirPath === '/' ? `/${name}` : `${dirPath}/${name}`;
                const child = children[name];
                const baseName = name.split('/').pop();
                if (this._globMatch(baseName, pattern)) {
                    results.push(childPath);
                }
                if (child.type === 'directory') {
                    walk(childPath);
                }
            }
        };

        if (!this.isDirectory(normalized)) {
            throw new Error(`find: '${startDir}': No such file or directory`);
        }
        walk(normalized);
        return results;
    }

    getTreeSnapshot() {
        return this._cloneTree(this.root);
    }

    getSnapshot() {
        return {
            cwd: this.cwd,
            currentUser: this.currentUser,
            filesystem: this.getTreeSnapshot(),
        };
    }
}

window.VirtualFilesystem = VirtualFilesystem;
