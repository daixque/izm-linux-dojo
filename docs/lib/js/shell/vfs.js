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
    }

    _cloneTree(tree) {
        return JSON.parse(JSON.stringify(tree || {}));
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
    }

    clone() {
        const vfs = new VirtualFilesystem(this.root, this.cwd);
        vfs._initialTree = this._initialTree;
        vfs._initialCwd = this._initialCwd;
        return vfs;
    }

    getCwd() {
        return this.cwd;
    }

    setCwd(path) {
        this.cwd = path;
    }

    normalizePath(path) {
        if (!path) return this.cwd;
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
            return { node: this.root, path: '/', name: '' };
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

    listDir(path) {
        const target = path ? this.normalizePath(path) : this.cwd;
        const result = this._getNode(target);
        if (!result) {
            throw new Error(`ls: cannot access '${target}': No such file or directory`);
        }
        if (result.node.type !== 'directory') {
            throw new Error(`ls: cannot access '${target}': Not a directory`);
        }

        const children = result.node.children || {};
        return Object.keys(children).sort();
    }

    readFile(path) {
        const result = this._getNode(path);
        if (!result) {
            throw new Error(`cat: ${path}: No such file or directory`);
        }
        if (result.node.type !== 'file') {
            throw new Error(`cat: ${path}: Is a directory`);
        }
        return result.node.content ?? '';
    }

    getTreeSnapshot() {
        return this._cloneTree(this.root);
    }

    getSnapshot() {
        return {
            cwd: this.cwd,
            filesystem: this.getTreeSnapshot(),
        };
    }
}

window.VirtualFilesystem = VirtualFilesystem;
