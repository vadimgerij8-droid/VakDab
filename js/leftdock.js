import { fetchGenres } from './api.js';
import { currentTab, currentSearchQuery, currentGenreSlug } from './state.js';

const leftdock = document.getElementById('leftdock');
const leftdockOverlay = document.getElementById('leftdockOverlay');
let leftdockOpen = false;
let leftdockHideTimer = 0;

function iconCircleLetter(label) {
    const letter = (label || '?').trim().charAt(0).toUpperCase();
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><text x="12" y="17" text-anchor="middle" font-size="13" font-weight="700" fill="currentColor" stroke="none">${letter}</text></svg>`;
}
function iconSearchSvg() { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>`; }
function iconCrownSvg() { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7z"/><path d="M4 16h16v4H4z"/></svg>`; }
function iconSettingsSvg() { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`; }

let dockActions = {};

export function toggleLeftdock(force) {
    const shouldOpen = force !== undefined ? force : !leftdockOpen;
    if (shouldOpen) showLeftdock();
    else hideLeftdock(true);
}

export function showLeftdock() {
    leftdockOpen = true;
    leftdock.classList.add('is-visible');
    leftdockOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';
    if (leftdockHideTimer) { clearTimeout(leftdockHideTimer); leftdockHideTimer = 0; }
    syncLeftdockActive();
    document.getElementById('burgerBtn')?.classList.add('active');
}

export function hideLeftdock(immediate) {
    if (immediate) {
        if (leftdockHideTimer) { clearTimeout(leftdockHideTimer); leftdockHideTimer = 0; }
        leftdock.classList.remove('is-visible');
        leftdockOverlay.classList.remove('open');
        document.body.style.overflow = '';
        leftdockOpen = false;
        document.getElementById('burgerBtn')?.classList.remove('active');
        return;
    }
    if (leftdockHideTimer) clearTimeout(leftdockHideTimer);
    leftdockHideTimer = setTimeout(() => {
        leftdock.classList.remove('is-visible');
        leftdockOverlay.classList.remove('open');
        document.body.style.overflow = '';
        leftdockOpen = false;
        document.getElementById('burgerBtn')?.classList.remove('active');
        leftdockHideTimer = 0;
    }, 260);
}
leftdockOverlay.addEventListener('click', () => hideLeftdock(true));

export function buildLeftdock(actions) {
    dockActions = actions;
    const inner = document.getElementById('leftdockInner');
    if (!inner) return;
    const genres = fetchGenres();
    let html = '<div class="agnative-leftdock__case">';
    html += `
    <div class="agnative-leftdock__item selector" data-action="main" data-selector="true" tabindex="0">
      <div class="menu__ico">${iconCircleLetter('Г')}</div><div class="menu__text">Головна</div>
    </div>
    <div class="agnative-leftdock__item selector" data-action="search" data-selector="true" tabindex="0">
      <div class="menu__ico">${iconSearchSvg()}</div><div class="menu__text">Пошук</div>
    </div>`;
    html += '</div><div class="agnative-leftdock__split"></div><div class="agnative-leftdock__case">';
    genres.forEach(g => {
        html += `
        <div class="agnative-leftdock__item selector genre-item-dock" data-action="genre-${g.slug}" data-selector="true" tabindex="0" data-genre="${g.slug}">
          <div class="menu__ico">${iconCircleLetter(g.name.charAt(0))}</div><div class="menu__text">${g.name}</div>
        </div>`;
    });
    html += '</div><div class="agnative-leftdock__split"></div><div class="agnative-leftdock__case">';
    html += `
    <div class="agnative-leftdock__item selector" data-action="settings" data-selector="true" tabindex="0">
      <div class="menu__ico">${iconSettingsSvg()}</div><div class="menu__text">Налаштування</div>
    </div>`;
    html += '</div>';
    inner.innerHTML = html;
    inner.querySelectorAll('.agnative-leftdock__item.selector').forEach(btn => {
        const action = btn.dataset.action;
        btn.addEventListener('click', () => {
            handleLeftdockAction(action);
            hideLeftdock(true);
        });
        btn.addEventListener('keydown', e => { if (e.key === 'Enter') { handleLeftdockAction(action); hideLeftdock(true); } });
    });
    syncLeftdockActive();
}

function handleLeftdockAction(action) {
    if (!action) return;
    if (action === 'main') { dockActions.showMainPage?.(); }
    else if (action === 'search') { dockActions.openSearchSection?.(); }
    else if (action.startsWith('genre-')) {
        const slug = action.replace('genre-', '');
        const name = fetchGenres().find(g => g.slug === slug)?.name || slug;
        dockActions.openGenreSection?.(slug, name);
    }
    else if (action === 'settings') { dockActions.openSettingsSection?.(); }
}

export function syncLeftdockActive() {
    const dock = document.getElementById('leftdock');
    if (!dock) return;
    dock.querySelectorAll('.agnative-leftdock__item.selector').forEach(btn => {
        btn.classList.remove('is-active');
        const action = btn.dataset.action;
        if (!action) return;
        if (action === 'main' && currentTab === 'main' && !currentSearchQuery && !currentGenreSlug) btn.classList.add('is-active');
        else if (action.startsWith('genre-') && currentGenreSlug === action.replace('genre-', '')) btn.classList.add('is-active');
    });
}
