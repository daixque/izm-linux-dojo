// 演習ページ共通機能（Linux ターミナル版）

let savedSolutionCommands = [];
let terminalUI = null;
let shellSimulator = null;

function setupTaskPanel() {
    const taskPanel = document.querySelector('.task-panel');
    const taskHeader = document.querySelector('.task-header');
    const taskToggle = document.querySelector('.task-toggle');
    const mainContent = document.querySelector('.main-content');

    if (!taskPanel || !taskHeader || !mainContent) return;

    taskHeader.addEventListener('click', () => {
        const isCollapsed = taskPanel.classList.toggle('collapsed');
        mainContent.classList.toggle('task-collapsed', isCollapsed);
        if (taskToggle) {
            taskToggle.textContent = isCollapsed ? '▶' : '◀';
        }
    });
}

function setupHintsPanel() {
    const hintsToggle = document.querySelector('.hints-toggle');
    const hintsContent = document.querySelector('.hints-content');
    const hintsSection = document.querySelector('.hints');

    if (!hintsToggle || !hintsContent || !hintsSection) return;

    hintsToggle.addEventListener('click', () => {
        const isExpanded = hintsSection.classList.toggle('expanded');
        hintsContent.style.display = isExpanded ? 'block' : 'none';
    });
}

function initializeExercise(config = {}) {
    const {
        initialFilesystem = {},
        initialCwd = '/home/user',
        tests = [],
        solutionCommands = [],
    } = config;

    savedSolutionCommands = solutionCommands || [];

    const vfs = new VirtualFilesystem(initialFilesystem, initialCwd);
    shellSimulator = new ShellSimulator({
        vfs,
        initialTree: initialFilesystem,
        initialCwd,
    });

    terminalUI = new TerminalUI('terminal', shellSimulator);
    window.terminalUI = terminalUI;
    terminalUI.onStateChange = () => window.fileExplorer.refresh();
    terminalUI.init();
    terminalUI.focus();

    if (tests.length > 0) {
        window.tester.setTests(tests);
    }

    setupTaskPanel();
    setupHintsPanel();

    window.fileExplorer.init({
        getVfs: () => shellSimulator.vfs,
    });
    window.fileExplorer.refresh();

    const t = (key, fallback) => (window.i18n ? window.i18n.t(key) : fallback);
    const statusElement = document.getElementById('status');
    if (statusElement) {
        statusElement.textContent = t('status_ready', 'Ready ✓');
    }

    const testBtn = document.getElementById('btn-test');
    if (testBtn) testBtn.disabled = false;
}

function setupButtons() {
    const t = (key, fallback) => (window.i18n ? window.i18n.t(key) : fallback);

    const btnTest = document.getElementById('btn-test');
    if (btnTest) {
        btnTest.addEventListener('click', () => {
            const statusElement = document.getElementById('status');
            if (statusElement) statusElement.textContent = t('status_testing', 'Testing...');

            const testResult = window.tester.runAll(shellSimulator);

            window.tester.displayResults(testResult);

            const overlay = document.getElementById('test-results-overlay');
            if (overlay) overlay.style.display = 'block';

            if (statusElement) statusElement.textContent = t('status_ready', 'Ready ✓');

            if (testResult.success && testResult.allPassed) {
                if (window.progress && typeof LESSON_ID !== 'undefined') {
                    window.progress.markLessonCompleted(LESSON_ID);
                    const congratsMsg = window.i18n
                        ? window.i18n.t('progress.congratulations')
                        : '🎉 Congratulations!';

                    const testResultsContainer = document.getElementById('test-results');
                    if (testResultsContainer) {
                        const completionBadge = document.createElement('div');
                        completionBadge.className = 'completion-badge';
                        completionBadge.innerHTML = `
                            <div style="background: #4caf50; color: white; padding: 12px; border-radius: 8px; margin-top: 16px; text-align: center; font-weight: bold;">
                                ${congratsMsg}
                            </div>
                        `;
                        testResultsContainer.appendChild(completionBadge);
                    }
                }
            }
        });
    }

    const btnReset = document.getElementById('btn-reset');
    if (btnReset) {
        btnReset.addEventListener('click', () => {
            if (terminalUI) terminalUI.reset();
        });
    }

    const btnSolution = document.getElementById('btn-solution');
    if (btnSolution && savedSolutionCommands.length > 0) {
        btnSolution.addEventListener('click', () => {
            if (terminalUI) {
                terminalUI.reset();
                terminalUI.runCommands(savedSolutionCommands);
            }
        });
    }

    const btnClear = document.getElementById('btn-clear');
    if (btnClear) {
        btnClear.addEventListener('click', () => {
            if (terminalUI) terminalUI.clear();
        });
    }

    const btnCloseResults = document.getElementById('btn-close-results');
    if (btnCloseResults) {
        btnCloseResults.addEventListener('click', () => {
            const overlay = document.getElementById('test-results-overlay');
            if (overlay) overlay.style.display = 'none';
        });
    }
}

window.initializeExercise = initializeExercise;
window.setupButtons = setupButtons;
