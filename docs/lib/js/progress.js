// Progress tracking library

const STORAGE_KEY = 'linuxLearning_progress';
const FILTER_KEY = 'linuxLearning_filterMode';

function loadProgress() {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        if (data) return JSON.parse(data);
    } catch (error) {
        console.error('Failed to load progress data:', error);
    }
    return {
        completedLessons: [],
        lastVisited: new Date().toISOString(),
        lessonTimestamps: {},
    };
}

function saveProgress(data) {
    try {
        data.lastVisited = new Date().toISOString();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
        console.error('Failed to save progress data:', error);
    }
}

function markLessonCompleted(lessonId) {
    const data = loadProgress();
    if (!data.completedLessons.includes(lessonId)) {
        data.completedLessons.push(lessonId);
        data.lessonTimestamps[lessonId] = new Date().toISOString();
        saveProgress(data);
    }
}

function markLessonIncomplete(lessonId) {
    const data = loadProgress();
    const index = data.completedLessons.indexOf(lessonId);
    if (index > -1) {
        data.completedLessons.splice(index, 1);
        delete data.lessonTimestamps[lessonId];
        saveProgress(data);
    }
}

function toggleLessonCompletion(lessonId) {
    if (isLessonCompleted(lessonId)) {
        markLessonIncomplete(lessonId);
        return false;
    }
    markLessonCompleted(lessonId);
    return true;
}

function isLessonCompleted(lessonId) {
    return loadProgress().completedLessons.includes(lessonId);
}

function getCompletedLessons() {
    return loadProgress().completedLessons;
}

function getLessonCompletionDate(lessonId) {
    return loadProgress().lessonTimestamps[lessonId] || null;
}

function getProgress(totalLessons) {
    const data = loadProgress();
    const completed = data.completedLessons.length;
    const percentage = totalLessons > 0 ? Math.round((completed / totalLessons) * 100) : 0;
    return { completed, total: totalLessons, percentage };
}

function getChapterProgress(chapterId, chapterLessons) {
    const data = loadProgress();
    const total = chapterLessons.length;
    const completed = chapterLessons.filter(lesson =>
        data.completedLessons.includes(lesson.id)
    ).length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { completed, total, percentage };
}

function clearAllProgress() {
    try {
        localStorage.removeItem(STORAGE_KEY);
        return true;
    } catch (error) {
        console.error('Failed to clear progress data:', error);
        return false;
    }
}

function getFilterMode() {
    try {
        const mode = localStorage.getItem(FILTER_KEY);
        if (mode && ['all', 'incomplete', 'completed'].includes(mode)) return mode;
    } catch (error) {
        console.error('Failed to load filter mode:', error);
    }
    return 'all';
}

function setFilterMode(mode) {
    try {
        if (['all', 'incomplete', 'completed'].includes(mode)) {
            localStorage.setItem(FILTER_KEY, mode);
        }
    } catch (error) {
        console.error('Failed to save filter mode:', error);
    }
}

window.progress = {
    markLessonCompleted,
    markLessonIncomplete,
    toggleLessonCompletion,
    isLessonCompleted,
    getCompletedLessons,
    getLessonCompletionDate,
    getProgress,
    getChapterProgress,
    clearAllProgress,
    getFilterMode,
    setFilterMode,
};
