import { Storage } from './storage.js';
import { applyTheme, showToast } from './ui.js';

let settingsState = {
    theme: Storage.getTheme(),
    colorTheme: Storage.getColorTheme(),
    ...Storage.getSettings()
};

const COLOR_THEMES = {
    default: { name: 'Default', accent: '#7c3aed' },
    ocean: { name: 'Ocean', accent: '#0ea5e9' },
    sunset: { name: 'Sunset', accent: '#f97316' },
    forest: { name: 'Forest', accent: '#10b981' },
    rose: { name: 'Rose', accent: '#ec4899' },
    violet: { name: 'Violet', accent: '#a855f7' },
    pink: { name: 'Pink', accent: '#db2777' },
    amber: { name: 'Amber', accent: '#d97706' }
};

const DEFAULT_SETTINGS = {
    autoplay: true,
    notifications: true,
    animationsEnabled: true,
    compactMode: false,
    fontSize: 'normal',
    language: 'uk',
    autoQuality: 'auto',
    subtitles: true,
    subtitleSize: 'medium',
    volumeLevel: 80,
    savedPosition: true,
    adultContent: false,
    blur18: false,
    theme: 'light',
    colorTheme: 'default'
};

export function initSettings() {
    settingsState = { ...DEFAULT_SETTINGS, ...Storage.getSettings() };
    applyStoredSettings();
    createSettingsModal();
}

export function openSettingsSection() {
    renderSettingsModal();
    const modal = document.getElementById('settingsModal');
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

export function closeSettingsSection() {
    const modal = document.getElementById('settingsModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = '';
    }
}

function createSettingsModal() {
    if (document.getElementById('settingsModal')) return;
    const modal = document.createElement('div');
    modal.id = 'settingsModal';
    modal.className = 'modal';
    modal.style.display = 'none';
    modal.innerHTML = `<div class="settings-container"><div class="settings-sidebar" id="settingsSidebar"></div><div class="settings-content" id="settingsContent"></div></div>`;
    document.body.appendChild(modal);
    
    modal.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeSettingsSection();
    });
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeSettingsSection();
    });
}

function renderSettingsModal() {
    const modal = document.getElementById('settingsModal');
    if (!modal) return;

    const sections = [
        { id: 'appearance', icon: 'fa-palette', label: 'Внешній вигляд', render: renderAppearanceSection },
        { id: 'playback', icon: 'fa-play', label: 'Відтворення', render: renderPlaybackSection },
        { id: 'display', icon: 'fa-tv', label: 'Дисплей', render: renderDisplaySection },
        { id: 'content', icon: 'fa-filter', label: 'Контент', render: renderContentSection },
        { id: 'shortcuts', icon: 'fa-keyboard', label: 'Гарячі клавіші', render: renderShortcutsSection },
        { id: 'about', icon: 'fa-info-circle', label: 'Про додаток', render: renderAboutSection }
    ];

    const sidebar = document.getElementById('settingsSidebar');
    const content = document.getElementById('settingsContent');

    sidebar.innerHTML = sections.map((s, idx) => `
        <div class="settings-sidebar-item ${idx === 0 ? 'active' : ''}" data-section="${s.id}">
            <i class="fas ${s.icon}"></i>
            <span>${s.label}</span>
        </div>
    `).join('');

    content.innerHTML = sections.map((s, idx) => `
        <div class="settings-section ${idx === 0 ? 'active' : ''}" data-section="${s.id}" id="section-${s.id}"></div>
    `).join('');

    sections.forEach(s => {
        const sectionEl = document.getElementById(`section-${s.id}`);
        if (sectionEl) {
            sectionEl.innerHTML = s.render();
            attachSectionListeners(s.id);
        }
    });

    sidebar.querySelectorAll('.settings-sidebar-item').forEach(item => {
        item.addEventListener('click', () => {
            sidebar.querySelectorAll('.settings-sidebar-item').forEach(i => i.classList.remove('active'));
            content.querySelectorAll('.settings-section').forEach(s => s.classList.remove('active'));
            item.classList.add('active');
            const sectionId = item.dataset.section;
            document.getElementById(`section-${sectionId}`).classList.add('active');
        });
    });
}

function renderAppearanceSection() {
    return `
        <div class="settings-header"><h1><i class="fas fa-palette"></i> Внешній вигляд</h1></div>
        <div class="settings-group">
            <div class="settings-group-title"><i class="fas fa-moon"></i> Тема</div>
            <div class="setting-item">
                <div class="setting-item-info"><div class="setting-item-label">Режим дня/ночі</div><div class="setting-item-desc">Виберіть бажану тему оформлення</div></div>
                <div class="setting-item-control"><select class="settings-select" id="themeSelect"><option value="light">☀️ Світлий режим</option><option value="dark">🌙 Темний режим</option></select></div>
            </div>
        </div>
        <div class="settings-group">
            <div class="settings-group-title"><i class="fas fa-swatchbook"></i> Колір акценту</div>
            <div class="color-picker-grid" id="colorPicker">
                ${Object.entries(COLOR_THEMES).map(([key, theme]) => `
                    <div class="color-option ${key === settingsState.colorTheme ? 'selected' : ''}" data-color="${key}" style="background: ${theme.accent};" title="${theme.name}"></div>
                `).join('')}
            </div>
        </div>
        <div class="settings-group">
            <div class="settings-group-title"><i class="fas fa-compact-disc"></i> Анімації</div>
            <div class="setting-item">
                <div class="setting-item-info"><div class="setting-item-label">Включити анімації</div><div class="setting-item-desc">Спеціальні ефекти та переходи</div></div>
                <div class="setting-item-control"><button class="toggle-switch ${settingsState.animationsEnabled ? 'on' : ''}" id="animationsToggle"></button></div>
            </div>
        </div>
        <div class="settings-group">
            <div class="settings-group-title"><i class="fas fa-expand"></i> Компактний режим</div>
            <div class="setting-item">
                <div class="setting-item-info"><div class="setting-item-label">Зменшити відступи</div><div class="setting-item-desc">Більше контенту на екрані</div></div>
                <div class="setting-item-control"><button class="toggle-switch ${settingsState.compactMode ? 'on' : ''}" id="compactModeToggle"></button></div>
            </div>
        </div>
        <div class="settings-group">
            <div class="settings-group-title"><i class="fas fa-text-height"></i> Розмір шрифту</div>
            <div class="setting-item">
                <div class="setting-item-info"><div class="setting-item-label">Розмір тексту</div><div class="setting-item-desc">Налаштування читаності</div></div>
                <div class="setting-item-control"><select class="settings-select" id="fontSizeSelect"><option value="small">Малий</option><option value="normal">Нормальний</option><option value="large">Великий</option><option value="xlarge">Дуже великий</option></select></div>
            </div>
        </div>
        <div class="settings-group">
            <div class="settings-group-title"><i class="fas fa-language"></i> Мова</div>
            <div class="setting-item">
                <div class="setting-item-info"><div class="setting-item-label">Мова інтерфейсу</div><div class="setting-item-desc">Виберіть мову додатка</div></div>
                <div class="setting-item-control"><select class="settings-select" id="languageSelect"><option value="uk">🇺🇦 Українська</option><option value="en">🇬🇧 English</option><option value="ru">🇷🇺 Русский</option></select></div>
            </div>
        </div>
    `;
}

function renderPlaybackSection() {
    return `
        <div class="settings-header"><h1><i class="fas fa-play-circle"></i> Налаштування відтворення</h1></div>
        <div class="settings-group">
            <div class="settings-group-title"><i class="fas fa-play"></i> Загальні</div>
            <div class="setting-item">
                <div class="setting-item-info"><div class="setting-item-label">Автовідтворення</div><div class="setting-item-desc">Автоматично грати при відкритті</div></div>
                <div class="setting-item-control"><button class="toggle-switch ${settingsState.autoplay ? 'on' : ''}" id="autoplayToggle"></button></div>
            </div>
            <div class="setting-item">
                <div class="setting-item-info"><div class="setting-item-label">Зберігати позицію</div><div class="setting-item-desc">Продовжувати з місця паузи</div></div>
                <div class="setting-item-control"><button class="toggle-switch ${settingsState.savedPosition ? 'on' : ''}" id="savedPositionToggle"></button></div>
            </div>
            <div class="setting-item">
                <div class="setting-item-info"><div class="setting-item-label">Субтитри за замовчуванням</div><div class="setting-item-desc">Показувати субтитри автоматично</div></div>
                <div class="setting-item-control"><button class="toggle-switch ${settingsState.subtitles ? 'on' : ''}" id="subtitlesToggle"></button></div>
            </div>
        </div>
        <div class="settings-group">
            <div class="settings-group-title"><i class="fas fa-cog"></i> Якість</div>
            <div class="setting-item">
                <div class="setting-item-info"><div class="setting-item-label">Якість відео</div><div class="setting-item-desc">Вибір розширення потоку</div></div>
                <div class="setting-item-control"><select class="settings-select" id="qualitySelect"><option value="auto">Авто (рекомендовано)</option><option value="480p">480p - Економ</option><option value="720p">720p - HD</option><option value="1080p">1080p - Full HD</option></select></div>
            </div>
        </div>
        <div class="settings-group">
            <div class="settings-group-title"><i class="fas fa-volume-up"></i> Звук</div>
            <div class="setting-item">
                <div class="setting-item-info"><div class="setting-item-label">Гучність за замовчуванням</div><div class="setting-item-desc">Встановіть початкову гучність</div></div>
                <div class="setting-item-control"><input type="range" min="0" max="100" value="${settingsState.volumeLevel}" class="settings-slider" id="volumeSlider"><span class="slider-value" id="volumeValue">${settingsState.volumeLevel}%</span></div>
            </div>
            <div class="setting-item">
                <div class="setting-item-info"><div class="setting-item-label">Розмір субтитрів</div><div class="setting-item-desc">Розмір тексту субтитрів</div></div>
                <div class="setting-item-control"><select class="settings-select" id="subtitleSizeSelect"><option value="small">Малий</option><option value="medium">Середній</option><option value="large">Великий</option></select></div>
            </div>
        </div>
        <div class="settings-info-box"><i class="fas fa-lightbulb"></i><div class="settings-info-box-text"><strong>Порада:</strong> Якщо ви часто змінюєте якість - використовуйте опцію "Авто" для найкращого досвіду.</div></div>
    `;
}

function renderDisplaySection() {
    return `
        <div class="settings-header"><h1><i class="fas fa-tv"></i> Налаштування дисплею</h1></div>
        <div class="settings-group">
            <div class="settings-group-title"><i class="fas fa-images"></i> Контент</div>
            <div class="setting-item">
                <div class="setting-item-info"><div class="setting-item-label">Розмитість 18+</div><div class="setting-item-desc">Розмивати контент для дорослих</div></div>
                <div class="setting-item-control"><button class="toggle-switch ${settingsState.blur18 ? 'on' : ''}" id="blur18Toggle"></button></div>
            </div>
            <div class="setting-item">
                <div class="setting-item-info"><div class="setting-item-label">Показувати вміст 18+</div><div class="setting-item-desc">Дозволити показувати контент для дорослих</div></div>
                <div class="setting-item-control"><button class="toggle-switch ${settingsState.adultContent ? 'on' : ''}" id="adultToggle"></button></div>
            </div>
        </div>
        <div class="settings-group">
            <div class="settings-group-title"><i class="fas fa-bell"></i> Сповіщення</div>
            <div class="setting-item">
                <div class="setting-item-info"><div class="setting-item-label">Включити сповіщення</div><div class="setting-item-desc">Показувати поточні сповіщення</div></div>
                <div class="setting-item-control"><button class="toggle-switch ${settingsState.notifications ? 'on' : ''}" id="notificationsToggle"></button></div>
            </div>
        </div>
        <div class="settings-info-box"><i class="fas fa-info-circle"></i><div class="settings-info-box-text"><strong>Інформація:</strong> Налаштування дисплею застосовуються одразу після збереження.</div></div>
    `;
}

function renderContentSection() {
    return `
        <div class="settings-header"><h1><i class="fas fa-filter"></i> Налаштування контенту</h1></div>
        <div class="settings-info-box"><i class="fas fa-shield"></i><div class="settings-info-box-text"><strong>Батьківський контроль:</strong> Виберіть які види контенту показувати в каталозі.</div></div>
        <div class="settings-group">
            <div class="settings-group-title"><i class="fas fa-star"></i> Фільтри</div>
            <div class="setting-item">
                <div class="setting-item-info"><div class="setting-item-label">Показувати контент 18+</div><div class="setting-item-desc">Включити еччі та інший вміст для дорослих</div></div>
                <div class="setting-item-control"><button class="toggle-switch ${settingsState.adultContent ? 'on' : ''}" id="filterAdultToggle"></button></div>
            </div>
            <div class="setting-item">
                <div class="setting-item-info"><div class="setting-item-label">Розмивати подібний контент</div><div class="setting-item-desc">Менш привабливо показувати 18+ постери</div></div>
                <div class="setting-item-control"><button class="toggle-switch ${settingsState.blur18 ? 'on' : ''}" id="filterBlurToggle"></button></div>
            </div>
        </div>
    `;
}

function renderShortcutsSection() {
    const shortcuts = [
        { key: '/', action: 'Відкрити пошук' },
        { key: 'M', action: 'Відкрити меню' },
        { key: 'T', action: 'Перемикнути тему' },
        { key: 'S', action: 'Відкрити налаштування' },
        { key: 'Space', action: 'Паузу/Грати' },
        { key: 'F', action: 'Повноекранний режим' },
        { key: '→', action: 'Перемотати на 10с' },
        { key: '←', action: 'Перемотати на -10с' },
        { key: '↑', action: 'Збільшити гучність' },
        { key: '↓', action: 'Зменшити гучність' }
    ];
    return `
        <div class="settings-header"><h1><i class="fas fa-keyboard"></i> Гарячі клавіші</h1></div>
        <div class="settings-info-box"><i class="fas fa-keyboard"></i><div class="settings-info-box-text">Швидкий доступ до функцій за допомогою клавіш.</div></div>
        <div class="shortcuts-grid">${shortcuts.map(s => `<div class="shortcut-card"><span>${s.action}</span><div class="shortcut-keys"><div class="key">${s.key}</div></div></div>`).join('')}</div>
    `;
}

function renderAboutSection() {
    return `
        <div class="settings-header"><h1><i class="fas fa-info-circle"></i> Про додаток</h1></div>
        <div class="profile-header">
            <div class="profile-avatar">⎈</div>
            <div class="profile-info"><h2>VAKDAB</h2><p>Чорно-білий аніме каталог</p><p style="margin-top: 0.5rem; font-size: 0.85rem;">Версія 2.0</p></div>
        </div>
        <div class="settings-group">
            <div class="settings-group-title"><i class="fas fa-code"></i> Інформація</div>
            <div class="setting-item">
                <div class="setting-item-info"><div class="setting-item-label">Сховище</div><div class="setting-item-desc">GitHub</div></div>
                <div class="setting-item-control"><a href="https://github.com/vadimgerij8-droid/VakDab" target="_blank" class="settings-button"><i class="fab fa-github"></i> Відкрити</a></div>
            </div>
        </div>
        <div class="settings-group">
            <div class="settings-group-title"><i class="fas fa-exclamation-circle"></i> Дані</div>
            <div class="setting-item">
                <div class="setting-item-info"><div class="setting-item-label">Кеш</div><div class="setting-item-desc">Очистити кеш браузера</div></div>
                <div class="setting-item-control"><button class="settings-button" id="clearCacheBtn">Очистити</button></div>
            </div>
            <div class="setting-item">
                <div class="setting-item-info"><div class="setting-item-label">Локальні дані</div><div class="setting-item-desc">Скинути всі налаштування</div></div>
                <div class="setting-item-control"><button class="settings-button danger" id="resetDataBtn">Скинути</button></div>
            </div>
        </div>
        <div class="settings-info-box"><i class="fas fa-heart"></i><div class="settings-info-box-text"><strong>Спасибо за користування!</strong> Сподіваємось вам подобається VAKDAB. Якщо у вас є пропозиції - відвідайте GitHub.</div></div>
    `;
}

function attachSectionListeners(sectionId) {
    if (sectionId === 'appearance') {
        document.getElementById('themeSelect')?.addEventListener('change', (e) => {
            settingsState.theme = e.target.value;
            Storage.setTheme(e.target.value);
            applyTheme(e.target.value);
            showToast(e.target.value === 'dark' ? '🌙 Темний режим' : '☀️ Світлий режим');
        });
        document.getElementById('animationsToggle')?.addEventListener('click', function() {
            this.classList.toggle('on');
            settingsState.animationsEnabled = this.classList.contains('on');
            saveSettings();
            showToast('✓ Налаштування збережено');
        });
        document.getElementById('compactModeToggle')?.addEventListener('click', function() {
            this.classList.toggle('on');
            settingsState.compactMode = this.classList.contains('on');
            applyCompactMode(settingsState.compactMode);
            saveSettings();
            showToast('✓ Налаштування збережено');
        });
        document.getElementById('fontSizeSelect')?.addEventListener('change', (e) => {
            settingsState.fontSize = e.target.value;
            applyFontSize(e.target.value);
            saveSettings();
            showToast('✓ Розмір шрифту змінено');
        });
        document.getElementById('languageSelect')?.addEventListener('change', (e) => {
            settingsState.language = e.target.value;
            saveSettings();
            showToast('✓ Мова змінена');
        });
        document.querySelectorAll('.color-option').forEach(option => {
            option.addEventListener('click', function() {
                document.querySelectorAll('.color-option').forEach(o => o.classList.remove('selected'));
                this.classList.add('selected');
                const color = this.dataset.color;
                settingsState.colorTheme = color;
                applyColorTheme(color);
                saveSettings();
                showToast('✓ Колір оновлено');
            });
        });
        if (document.getElementById('themeSelect')) document.getElementById('themeSelect').value = settingsState.theme;
        if (document.getElementById('fontSizeSelect')) document.getElementById('fontSizeSelect').value = settingsState.fontSize;
        if (document.getElementById('languageSelect')) document.getElementById('languageSelect').value = settingsState.language;
    }
    if (sectionId === 'playback') {
        document.getElementById('autoplayToggle')?.addEventListener('click', function() {
            this.classList.toggle('on');
            settingsState.autoplay = this.classList.contains('on');
            saveSettings();
            showToast('✓ Налаштування збережено');
        });
        document.getElementById('savedPositionToggle')?.addEventListener('click', function() {
            this.classList.toggle('on');
            settingsState.savedPosition = this.classList.contains('on');
            saveSettings();
            showToast('✓ Налаштування збережено');
        });
        document.getElementById('subtitlesToggle')?.addEventListener('click', function() {
            this.classList.toggle('on');
            settingsState.subtitles = this.classList.contains('on');
            saveSettings();
            showToast('✓ Налаштування збережено');
        });
        document.getElementById('qualitySelect')?.addEventListener('change', (e) => {
            settingsState.autoQuality = e.target.value;
            saveSettings();
            showToast('✓ Якість оновлена');
        });
        document.getElementById('subtitleSizeSelect')?.addEventListener('change', (e) => {
            settingsState.subtitleSize = e.target.value;
            saveSettings();
            showToast('✓ Розмір субтитрів змінено');
        });
        document.getElementById('volumeSlider')?.addEventListener('input', (e) => {
            settingsState.volumeLevel = parseInt(e.target.value);
            document.getElementById('volumeValue').textContent = settingsState.volumeLevel + '%';
            saveSettings();
        });
        if (document.getElementById('qualitySelect')) document.getElementById('qualitySelect').value = settingsState.autoQuality;
        if (document.getElementById('subtitleSizeSelect')) document.getElementById('subtitleSizeSelect').value = settingsState.subtitleSize;
    }
    if (sectionId === 'display') {
        document.getElementById('blur18Toggle')?.addEventListener('click', function() {
            this.classList.toggle('on');
            settingsState.blur18 = this.classList.contains('on');
            saveSettings();
            showToast('✓ Налаштування збережено');
        });
        document.getElementById('adultToggle')?.addEventListener('click', function() {
            this.classList.toggle('on');
            settingsState.adultContent = this.classList.contains('on');
            saveSettings();
            showToast('✓ Налаштування збережено');
        });
        document.getElementById('notificationsToggle')?.addEventListener('click', function() {
            this.classList.toggle('on');
            settingsState.notifications = this.classList.contains('on');
            saveSettings();
            showToast('✓ Налаштування збережено');
        });
    }
    if (sectionId === 'content') {
        document.getElementById('filterAdultToggle')?.addEventListener('click', function() {
            this.classList.toggle('on');
            settingsState.adultContent = this.classList.contains('on');
            saveSettings();
            showToast('✓ Фільтри оновлені');
        });
        document.getElementById('filterBlurToggle')?.addEventListener('click', function() {
            this.classList.toggle('on');
            settingsState.blur18 = this.classList.contains('on');
            saveSettings();
            showToast('✓ Фільтри оновлені');
        });
    }
    if (sectionId === 'about') {
        document.getElementById('clearCacheBtn')?.addEventListener('click', () => {
            if (confirm('Очистити кеш браузера?')) {
                if ('caches' in window) {
                    caches.keys().then(cacheNames => {
                        cacheNames.forEach(cacheName => caches.delete(cacheName));
                    });
                }
                showToast('✓ Кеш очищено');
            }
        });
        document.getElementById('resetDataBtn')?.addEventListener('click', () => {
            if (confirm('Ви впевнені? Це видалить ВСІ налаштування!')) {
                localStorage.clear();
                settingsState = { ...DEFAULT_SETTINGS };
                showToast('✓ Дані скинені');
                setTimeout(() => location.reload(), 1000);
            }
        });
    }
}

function applyColorTheme(theme) {
    const colors = COLOR_THEMES[theme];
    if (colors) {
        document.documentElement.style.setProperty('--accent', colors.accent);
        document.documentElement.style.setProperty('--accent-text', '#ffffff');
    }
}

function applyFontSize(size) {
    const sizes = { 'small': '0.9rem', 'normal': '1rem', 'large': '1.1rem', 'xlarge': '1.25rem' };
    document.documentElement.style.setProperty('--font-size-base', sizes[size] || '1rem');
}

function applyCompactMode(enabled) {
    document.body.classList.toggle('compact-mode', enabled);
}

function applyStoredSettings() {
    if (settingsState.fontSize && settingsState.fontSize !== 'normal') applyFontSize(settingsState.fontSize);
    if (settingsState.compactMode) applyCompactMode(true);
    if (settingsState.colorTheme && settingsState.colorTheme !== 'default') applyColorTheme(settingsState.colorTheme);
}

function saveSettings() {
    const { theme, colorTheme, ...rest } = settingsState;
    Storage.saveSettings(rest);
}

export function getSettings() { return { ...settingsState }; }
export function updateSetting(key, value) { settingsState[key] = value; saveSettings(); }
