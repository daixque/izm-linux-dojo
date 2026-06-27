/**
 * シェルコマンド演習のテストランナー
 */
let currentTests = [];
let testSimulator = null;

function setTests(tests) {
    currentTests = tests || [];
}

function createTestSimulator(initialFilesystem, initialCwd) {
    const vfs = new VirtualFilesystem(initialFilesystem, initialCwd);
    return new ShellSimulator({
        vfs,
        initialTree: initialFilesystem,
        initialCwd,
    });
}

function normalizeOutput(output) {
    if (output == null) return '';
    return String(output).replace(/\r\n/g, '\n');
}

function compareOutput(actual, expected) {
    const a = normalizeOutput(actual);
    const e = normalizeOutput(expected);

    if (a === e) return { match: true };

    const aLines = a.trimEnd().split('\n').filter(Boolean).sort();
    const eLines = e.trimEnd().split('\n').filter(Boolean).sort();
    if (aLines.join('\n') === eLines.join('\n')) {
        return { match: true };
    }

    return {
        match: false,
        message: `Expected:\n${JSON.stringify(e)}\nActual:\n${JSON.stringify(a)}`,
    };
}

function runSingleTest(sim, test, testNumber) {
    const name = test.name || `Test ${testNumber}`;

    try {
        if (test.setup_commands) {
            sim.executeCommands(test.setup_commands);
        }

        const type = test.type;

        if (type === 'command_output') {
            const commands = test.commands || (test.command ? [test.command] : []);
            let stdout = '';
            for (const cmd of commands) {
                const result = sim.executeLine(cmd);
                stdout += result.stdout;
            }
            const cmp = compareOutput(stdout, test.expected_output);
            return {
                testNumber,
                name,
                description: test.description || '',
                passed: cmp.match,
                message: cmp.match ? '✓ Correct!' : `✗ Output mismatch.\n${cmp.message || ''}`,
            };
        }

        if (type === 'cwd') {
            const commands = test.commands || [];
            for (const cmd of commands) {
                sim.executeLine(cmd);
            }
            const actualCwd = sim.getCwd();
            const passed = actualCwd === test.expected_cwd;
            return {
                testNumber,
                name,
                description: test.description || '',
                passed,
                message: passed
                    ? '✓ Correct!'
                    : `✗ Wrong directory.\nExpected: ${test.expected_cwd}\nActual: ${actualCwd}`,
            };
        }

        if (type === 'command_sequence') {
            const steps = test.steps || [];
            for (const step of steps) {
                const result = sim.executeLine(step.command);
                if (step.expected_output !== undefined) {
                    const cmp = compareOutput(result.stdout, step.expected_output);
                    if (!cmp.match) {
                        return {
                            testNumber,
                            name,
                            description: test.description || '',
                            passed: false,
                            message: `✗ Failed at command: ${step.command}\n${cmp.message || ''}`,
                        };
                    }
                }
                if (step.expected_cwd !== undefined && sim.getCwd() !== step.expected_cwd) {
                    return {
                        testNumber,
                        name,
                        description: test.description || '',
                        passed: false,
                        message: `✗ Wrong cwd after: ${step.command}\nExpected: ${step.expected_cwd}\nActual: ${sim.getCwd()}`,
                    };
                }
            }
            return {
                testNumber,
                name,
                description: test.description || '',
                passed: true,
                message: '✓ Correct!',
            };
        }

        return {
            testNumber,
            name,
            description: test.description || '',
            passed: false,
            message: `Unknown test type: ${type}`,
        };
    } catch (error) {
        return {
            testNumber,
            name,
            description: test.description || '',
            passed: false,
            message: `Test execution error: ${error.message}`,
        };
    }
}

function runAllTests(simulator) {
    if (currentTests.length === 0) {
        return {
            success: false,
            message: window.i18n ? window.i18n.t('msg_noTestsConfigured') : 'No tests configured',
        };
    }

    if (!simulator || !simulator.vfs) {
        return {
            success: false,
            message: 'Simulator not ready',
        };
    }

    const results = [];
    let allPassed = true;
    const snapshot = simulator.vfs.getSnapshot();

    for (let i = 0; i < currentTests.length; i++) {
        const testSim = createTestSimulator(snapshot.filesystem, snapshot.cwd);
        const result = runSingleTest(testSim, currentTests[i], i + 1);
        results.push(result);
        if (!result.passed) allPassed = false;
    }

    return { success: true, allPassed, results };
}

function runAllTestsFromInitial(initialFilesystem, initialCwd) {
    const sim = createTestSimulator(initialFilesystem, initialCwd);
    return runAllTests(sim);
}

function displayTestResults(testResult) {
    const resultContainer = document.getElementById('test-results');
    if (!resultContainer) return;

    resultContainer.innerHTML = '';

    if (!testResult.success) {
        const errorLabel = window.i18n ? window.i18n.t('test_error') : 'Error';
        resultContainer.innerHTML = `
            <div class="test-error">
                <strong>${errorLabel}:</strong> ${testResult.message}
            </div>
        `;
        return;
    }

    const summaryClass = testResult.allPassed ? 'test-summary-success' : 'test-summary-failure';
    const summaryIcon = testResult.allPassed ? '✓' : '✗';
    const passedCount = testResult.results.filter(r => r.passed).length;
    const totalCount = testResult.results.length;
    const allPassedMsg = window.i18n ? window.i18n.t('test_allPassed') : 'All tests passed!';
    const someFailedMsg = window.i18n ? window.i18n.t('test_someFailed') : 'Some tests failed';
    const summaryText = testResult.allPassed
        ? `${allPassedMsg} (${totalCount}/${totalCount})`
        : `${someFailedMsg} (${passedCount}/${totalCount})`;

    const summaryHTML = `
        <div class="${summaryClass}">
            <strong>${summaryIcon} ${summaryText}</strong>
        </div>
    `;

    const resultsHTML = testResult.results.map(result => {
        const statusClass = result.passed ? 'test-passed' : 'test-failed';
        const icon = result.passed ? '✓' : '✗';
        return `
            <div class="test-item ${statusClass}">
                <div class="test-header">
                    <span class="test-icon">${icon}</span>
                    <span class="test-name">${result.name}</span>
                </div>
                ${result.description ? `<div class="test-description">${result.description}</div>` : ''}
                <div class="test-message">${result.message}</div>
            </div>
        `;
    }).join('');

    resultContainer.innerHTML = summaryHTML + resultsHTML;
}

window.tester = {
    setTests,
    runAll: runAllTests,
    runAllFromInitial: runAllTestsFromInitial,
    displayResults: displayTestResults,
    createTestSimulator,
};
