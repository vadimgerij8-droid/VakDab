export const Storage = {
    getTheme() {
        try { return localStorage.getItem('mono_anime_theme') || 'light'; } catch { return 'light'; }
    },
    setTheme(t) {
        localStorage.setItem('mono_anime_theme', t);
    },
    getColorTheme() {
        try { return localStorage.getItem('mono_anime_color_theme') || 'default'; } catch { return 'default'; }
    },
    setColorTheme(t) {
        localStorage.setItem('mono_anime_color_theme', t);
    },
    getSettings() {
        try { return JSON.parse(localStorage.getItem('mono_anime_settings') || '{}'); } catch { return {}; }
    },
    saveSettings(s) {
        localStorage.setItem('mono_anime_settings', JSON.stringify(s));
    }
};
