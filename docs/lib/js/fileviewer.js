/**
 * Tree view for the virtual filesystem
 */
class FileExplorer {
    constructor() {
        this.container = null;
        this.treeElement = null;
        this.getVfs = null;
        this.isCollapsed = true;
    }

    init(options = {}) {
        this.container = document.getElementById('file-explorer');
        if (!this.container) return;

        this.treeElement = document.getElementById('file-tree');
        this.getVfs = options.getVfs || null;

        this.container.classList.add('collapsed');
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            mainContent.classList.add('explorer-collapsed');
        }

        const header = this.container.querySelector('.file-explorer-header');
        if (header) {
            header.addEventListener('click', () => this.toggleCollapse());
        }
    }

    refresh() {
        if (!this.treeElement || !this.getVfs) return;

        const vfs = this.getVfs();
        if (!vfs) return;

        const snapshot = vfs.getSnapshot();
        this.treeElement.innerHTML = this.renderTree(snapshot.filesystem, snapshot.cwd);
    }

    renderTree(tree, cwd, path = '') {
        if (!tree || typeof tree !== 'object') return '';

        let html = path === '' ? '' : '<ul class="fs-tree">';
        const entries = Object.keys(tree).sort();

        for (const name of entries) {
            const node = tree[name];
            const fullPath = path ? `${path}/${name}` : `/${name}`;
            const isDir = node.type === 'directory';
            const icon = isDir ? '📁' : '📄';
            const cwdClass = cwd === fullPath ? ' cwd' : '';

            html += `<li class="fs-item${cwdClass}">`;
            html += `<span class="fs-name">${icon} ${name}</span>`;

            if (isDir && node.children) {
                html += this.renderTree(node.children, cwd, fullPath);
            }
            html += '</li>';
        }

        if (path === '') {
            return html ? `<ul class="fs-tree">${html}</ul>` : '';
        }
        html += '</ul>';
        return html;
    }

    toggleCollapse() {
        this.isCollapsed = !this.isCollapsed;
        if (this.container) {
            this.container.classList.toggle('collapsed', this.isCollapsed);
        }

        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            mainContent.classList.toggle('explorer-collapsed', this.isCollapsed);
        }

        const toggle = this.container.querySelector('.file-explorer-toggle');
        if (toggle) {
            toggle.textContent = this.isCollapsed ? '▶' : '◀';
        }
    }
}

window.fileExplorer = new FileExplorer();
