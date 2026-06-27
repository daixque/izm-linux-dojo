// 多言語対応ライブラリ

const translations = {
    ja: {
        appTitle: 'IZM Linux 道場',
        subtitle: 'ターミナルで学ぶ Linux 入門',
        status_ready: '準備完了 ✓',
        status_testing: 'テスト中...',
        btn_test: '✓ テスト',
        btn_reset: '🔄 リセット',
        btn_clear: 'クリア',
        btn_close: '閉じる',
        btn_backToMenu: '← 目次に戻る',
        btn_backToLearn: '📚 説明に戻る',
        btn_startExercise: '演習を始める →',
        label_learn: '📚 説明',
        label_exercise: '✏️ 演習課題',
        msg_noTestsConfigured: 'テストが設定されていません',
        test_results: 'テスト結果',
        test_allPassed: 'すべてのテストに合格しました！',
        test_someFailed: '一部のテストに失敗しました',
        test_error: 'エラー',
        lang_ja: '日本語',
        lang_en: 'English',
        'progress.overall_title': '全体の進捗',
        'progress.lessons_completed': 'レッスン完了',
        'progress.chapter_progress': 'レッスン完了',
        'progress.filter_all': '全て表示',
        'progress.filter_incomplete': '未完了のみ',
        'progress.filter_completed': '完了済みのみ',
        'progress.showing_count': '件表示中',
        'progress.reset_confirm': '本当に全ての進捗をリセットしますか？この操作は取り消せません。',
        'progress.mark_complete': '完了にする',
        'progress.mark_incomplete': '未完了にする',
        'progress.congratulations': '🎉 おめでとうございます！レッスンを完了しました！',
        'progress.status_completed': '完了',
        'progress.status_incomplete': '未完了',
    },
    en: {
        appTitle: 'IZM Linux Dojo',
        subtitle: 'Learn Linux Through the Terminal',
        status_ready: 'Ready ✓',
        status_testing: 'Testing...',
        btn_test: '✓ Test',
        btn_reset: '🔄 Reset',
        btn_clear: 'Clear',
        btn_close: 'Close',
        btn_backToMenu: '← Back to Menu',
        btn_backToLearn: '📚 Back to Learn',
        btn_startExercise: 'Start Exercise →',
        label_learn: '📚 Learn',
        label_exercise: '✏️ Exercise',
        msg_noTestsConfigured: 'No tests configured',
        test_results: 'Test Results',
        test_allPassed: 'All tests passed!',
        test_someFailed: 'Some tests failed',
        test_error: 'Error',
        lang_ja: '日本語',
        lang_en: 'English',
        'progress.overall_title': 'Overall Progress',
        'progress.lessons_completed': 'Lessons Completed',
        'progress.chapter_progress': 'Lessons Completed',
        'progress.filter_all': 'Show All',
        'progress.filter_incomplete': 'Incomplete Only',
        'progress.filter_completed': 'Completed Only',
        'progress.showing_count': 'showing',
        'progress.reset_confirm': 'Are you sure you want to reset all progress? This action cannot be undone.',
        'progress.mark_complete': 'Mark as Complete',
        'progress.mark_incomplete': 'Mark as Incomplete',
        'progress.congratulations': "🎉 Congratulations! You've completed this lesson!",
        'progress.status_completed': 'Completed',
        'progress.status_incomplete': 'Incomplete',
    },
};

let currentLang = 'ja';

function initLanguage() {
    const urlParams = new URLSearchParams(window.location.search);
    const langParam = urlParams.get('lang');
    if (langParam && translations[langParam]) {
        currentLang = langParam;
        localStorage.setItem('preferredLanguage', langParam);
        return currentLang;
    }

    const path = window.location.pathname;
    if (path.includes('.en.')) {
        currentLang = 'en';
        return currentLang;
    }
    if (path.includes('.ja.')) {
        currentLang = 'ja';
        return currentLang;
    }

    const savedLang = localStorage.getItem('preferredLanguage');
    if (savedLang && translations[savedLang]) {
        currentLang = savedLang;
    }
    return currentLang;
}

function t(key) {
    const translation = translations[currentLang][key];
    if (translation !== undefined) return translation;
    console.warn(`Translation not found for key: ${key}`);
    return key;
}

function getCurrentLanguage() {
    return currentLang;
}

function setLanguage(lang, options = {}) {
    const { reload = false } = options;
    if (translations[lang]) {
        currentLang = lang;
        localStorage.setItem('preferredLanguage', lang);
        const url = new URL(window.location);
        url.searchParams.set('lang', lang);
        window.history.pushState({}, '', url);
        if (reload) window.location.reload();
    }
}

function createLanguageSwitcher(containerId, onLanguageChange) {
    const container = document.getElementById(containerId);
    if (!container) return null;

    const switcher = document.createElement('div');
    switcher.className = 'language-switcher';
    switcher.innerHTML = `
        <select id="language-select" class="language-select">
            <option value="ja" ${currentLang === 'ja' ? 'selected' : ''}>${t('lang_ja')}</option>
            <option value="en" ${currentLang === 'en' ? 'selected' : ''}>${t('lang_en')}</option>
        </select>
    `;

    switcher.querySelector('#language-select').addEventListener('change', (e) => {
        const newLang = e.target.value;
        if (translations[newLang]) {
            if (onLanguageChange && typeof onLanguageChange === 'function') {
                setLanguage(newLang, { reload: false });
                onLanguageChange();
            } else {
                setLanguage(newLang, { reload: true });
            }
        }
    });

    container.appendChild(switcher);
    return switcher;
}

function getMetadataFilePath() {
    return `lessons/metadata.${currentLang}.json?v=${Date.now()}`;
}

window.i18n = {
    init: initLanguage,
    t,
    getCurrentLanguage,
    setLanguage,
    createLanguageSwitcher,
    getMetadataFilePath,
    get currentLang() { return currentLang; },
};
