import { Storage } from './storage.js';

export function applyTheme(theme) {
    const btn = document.getElementById('themeToggleBtn');
    if (theme === 'dark') {
        document.body.classList.add('dark-mode');
        if (btn) btn.innerHTML = '<i class="fas fa-sun"></i>';
    } else {
        document.body.classList.remove('dark-mode');
        if (btn) btn.innerHTML = '<i class="fas fa-moon"></i>';
    }
}

export function toggleTheme() {
    const next = Storage.getTheme() === 'dark' ? 'light' : 'dark';
    Storage.setTheme(next);
    applyTheme(next);
    showToast(next === 'dark' ? '🌙 Темний режим' : '☀️ Світлий режим');
}

export function showToast(msg) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toast._timeout);
    toast._timeout = setTimeout(() => toast.classList.remove('show'), 2200);
}

export function updateClock() {
    const clock = document.getElementById('agnativeTopnavClock');
    if (!clock) return;
    const d = new Date();
    clock.textContent = String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
}

let clockTimer = null;
export function startClock() {
    updateClock();
    if (clockTimer) return;
    clockTimer = setInterval(updateClock, 20000);
}
