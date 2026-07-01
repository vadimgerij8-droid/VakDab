import { PROXY_URL, ANIMEUA_BASE, GENRE_MAP } from './config.js';
import { Storage } from './storage.js';
import { currentTab, currentPage, currentSearchQuery, currentGenreSlug, currentList, setCurrentTab, setCurrentPage, setCurrentSearchQuery, setCurrentGenreSlug, setCurrentList } from './state.js';
import { fetchMainPage, searchAnimeUA, fetchByGenre, fetchTop100 } from './api.js';
import { LampaPlayer } from './player.js';
import { buildHeroBanner, stopHeroRotation } from './hero.js';
import { buildLeftdock, toggleLeftdock, showLeftdock, hideLeftdock, syncLeftdockActive } from './leftdock.js';
import { openDetailModal, closeDetailModal, closeSectionModal, openGenreSection, openSearchSection, openSettingsSection } from './modals.js';
import { applyTheme, toggleTheme, startClock, showToast } from './ui.js';
import { initSettings, closeSettingsSection } from './settings.js';

const animeContainer = document.getElementById('animeContainer');
const paginationRow = document.getElementById('paginationRow');
const searchInput = document.getElementById('searchInput');
const clearBtn = document.getElementById('searchClearBtn');
const top100Btn = document.getElementById('top100Btn');
const randomBtn = document.getElementById('randomBtn');
const backToTopBtn = document.getElementById('backToTopBtn');
const settingsBtn = document.getElementById('settingsBtn');

function showMainPage() {
    setCurrentTab('main');
    setCurrentPage(1);
    setCurrentSearchQuery('');
    setCurrentGenreSlug(null);
    document.querySelectorAll('.action-pill').forEach(p => p.classList.remove('active-pill'));
    document.querySelectorAll('.genre-item').forEach(p => p.classList.remove('active-genre'));
    if (searchInput) searchInput.value = '';
    if (clearBtn) clearBtn.classList.remove('visible');
    loadContent();
    syncLeftdockActive();
}

function showTop100() {
    setCurrentTab('top100');
    setCurrentPage(1);
    setCurrentSearchQuery('');
    setCurrentGenreSlug(null);
    document.querySelectorAll('.action-pill').forEach(p => p.classList.remove('active-pill'));
    top100Btn?.classList.add('active-pill');
    document.querySelectorAll('.genre-item').forEach(p => p.classList.remove('active-genre'));
    if (searchInput) searchInput.value = '';
    if (clearBtn) clearBtn.classList.remove('visible');
    loadContent();
    syncLeftdockActive();
    showToast('👑 ТОП 100 аніме');
}

function clearSearch() {
    if (searchInput) searchInput.value = '';
    setCurrentSearchQuery('');
    setCurrentPage(1);
    setCurrentTab('main');
    setCurrentGenreSlug(null);
    document.querySelectorAll('.action-pill').forEach(p => p.classList.remove('active-pill'));
    document.querySelectorAll('.genre-item').forEach(p => p.classList.remove('active-genre'));
    loadContent();
    if (clearBtn) clearBtn.classList.remove('visible');
    syncLeftdockActive();
}

function openRandomAnime() {
    openDetailModal(`${ANIMEUA_BASE}/index.php?do=rand`);
    showToast('🎲 Випадкове аніме');
}

function showSkeleton() {
    if (!animeContainer) return;
    const cols = Math.floor(animeContainer.offsetWidth / 195) || 4;
    let html = '';
    for (let i = 0; i < cols * 2; i++) {
        html += `<div class="anime-card"><div class="anime-poster skeleton" style="padding-top: 140%;"></div></div>`;
    }
    animeContainer.innerHTML = html;
}

async function loadContent() {
    if (!animeContainer) return;
    showSkeleton();
    try {
        let list;
        if (currentTab === 'top100') list = await fetchTop100();
        else if (currentSearchQuery) list = await searchAnimeUA(currentSearchQuery, currentPage);
        else if (currentGenreSlug) list = await fetchByGenre(currentGenreSlug, currentPage);
        else list = await fetchMainPage(currentPage);
        setCurrentList(list);
        renderCards(list);
    } catch (err) {
        animeContainer.innerHTML = `<div class="loader"><i class="fas fa-exclamation-triangle"></i> Помилка: ${err.message}<br><button class="btn-outline" style="margin-top:1rem;">🔄 Спробувати ще</button></div>`;
        animeContainer.querySelector('.btn-outline')?.addEventListener('click', loadContent);
    }
}

function renderCards(list) {
    if (!animeContainer) return;
    if (!list.length) {
        animeContainer.innerHTML = `
          <div class="loader" style="grid-column:1/-1;text-align:center;">
            <i class="fas fa-search" style="font-size:3rem;display:block;margin-bottom:1rem;color:var(--text-muted);"></i>
            <p style="font-size:1.1rem;margin-bottom:0.5rem;">Нічого не знайдено</p>
            <p style="font-size:0.8rem;color:var(--text-muted);">Спробуйте змінити пошуковий запит або фільтри</p>
            <button class="btn-outline" style="margin-top:1rem;">🏠 На головну</button>
          </div>`;
        animeContainer.querySelector('.btn-outline')?.addEventListener('click', showMainPage);
        paginationRow.innerHTML = '';
        return;
    }
    animeContainer.innerHTML = list.map((a, idx) => `
      <div class="anime-card" data-url="${a.url}" tabindex="0" role="button" aria-label="${a.title}" style="animation-delay:${idx*0.04}s">
        <div class="anime-poster">
          <img src="${a.images.jpg.large_image_url}" alt="${a.title}" loading="lazy" class="img--blur" onload="this.classList.add('img--loaded')" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22180%22 height=%22250%22%3E%3Crect fill=%22%23333%22 width=%22180%22 height=%22250%22/%3E%3C/svg%3E'">
          <div class="nfx-card-overlay">
            <div class="nfx-card-overlay__title">${a.title}</div>
            <div class="nfx-card-overlay__ua">UA</div>
          </div>
        </div>
      </div>`).join('');
    animeContainer.querySelectorAll('.anime-card').forEach(card => {
        card.addEventListener('click', () => openDetailModal(card.dataset.url));
        card.addEventListener('keydown', e => { if (e.key === 'Enter') openDetailModal(card.dataset.url); });
    });
    renderPagination();
}

function renderPagination() {
    if (!paginationRow) return;
    if (currentTab === 'top100') { paginationRow.innerHTML = ''; return; }
    const prevDisabled = currentPage <= 1 ? 'disabled' : '';
    paginationRow.innerHTML = `
      <button class="btn-outline" id="prevPageBtn" ${prevDisabled}><i class="fas fa-chevron-left"></i> Назад</button>
      <span class="page-indicator">Сторінка ${currentPage}</span>
      <button class="btn-outline" id="nextPageBtn">Вперед <i class="fas fa-chevron-right"></i></button>
    `;
    const prevBtn = document.getElementById('prevPageBtn');
    const nextBtn = document.getElementById('nextPageBtn');
    if (prevBtn) prevBtn.addEventListener('click', () => {
        if (currentPage > 1) { setCurrentPage(currentPage - 1); window.scrollTo({ top: 0, behavior: 'smooth' }); loadContent(); }
    });
    if (nextBtn) nextBtn.addEventListener('click', () => {
        setCurrentPage(currentPage + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); loadContent();
    });
}

function updateBackToTop() {
    if (window.scrollY > 500) backToTopBtn?.classList.add('visible');
    else backToTopBtn?.classList.remove('visible');
}

let searchDebounce = 0;
function handleSearchInput() {
    const q = searchInput.value.trim();
    if (clearBtn) {
        if (q.length > 0) clearBtn.classList.add('visible');
        else clearBtn.classList.remove('visible');
    }
    clearTimeout(searchDebounce);
    searchDebounce = setTimeout(() => {
        if (q !== currentSearchQuery) {
            setCurrentSearchQuery(q);
            setCurrentPage(1);
            setCurrentTab('main');
            setCurrentGenreSlug(null);
            document.querySelectorAll('.action-pill').forEach(p => p.classList.remove('active-pill'));
            document.querySelectorAll('.genre-item').forEach(p => p.classList.remove('active-genre'));
            loadContent();
            syncLeftdockActive();
        }
    }, 400);
}

function onKeyDown(e) {
    const tag = document.activeElement?.tagName?.toLowerCase();
    const isInput = tag === 'input' || tag === 'textarea' || tag === 'select' || document.activeElement?.isContentEditable;
    if (e.key === 'Escape') {
        closeDetailModal();
        closeSectionModal();
        closeSettingsSection();
        hideLeftdock(true);
        const pm = document.getElementById('playerModal');
        if (pm && pm.style.display === 'flex') {
            pm.style.display = 'none';
            document.body.style.overflow = '';
            if (window._lampaPlayerInstance) { window._lampaPlayerInstance.destroy(); window._lampaPlayerInstance = null; }
        }
        return;
    }
    if (isInput) return;
    if (e.key === '/' || (e.key === 'k' && (e.ctrlKey || e.metaKey))) { e.preventDefault(); searchInput?.focus(); return; }
    if (e.key === 'm' || e.key === 'M') { e.preventDefault(); toggleLeftdock(); return; }
    if (e.key === 't' || e.key === 'T') { e.preventDefault(); toggleTheme(); return; }
    if (e.key === 's' || e.key === 'S') { e.preventDefault(); openSettingsSection(); return; }
    if (e.key === 'r' || e.key === 'R') { e.preventDefault(); openRandomAnime(); return; }
}

function init() {
    applyTheme(Storage.getTheme());
    initSettings();
    buildLeftdock({
        showMainPage,
        openGenreSection,
        openSearchSection,
        openSettingsSection
    });
    buildHeroBanner();
    startClock();
    showMainPage();
    updateBackToTop();

    document.getElementById('burgerBtn')?.addEventListener('click', (e) => { e.stopPropagation(); toggleLeftdock(); });
    document.getElementById('themeToggleBtn')?.addEventListener('click', toggleTheme);
    document.getElementById('settingsBtn')?.addEventListener('click', openSettingsSection);
    top100Btn?.addEventListener('click', showTop100);
    randomBtn?.addEventListener('click', openRandomAnime);
    document.getElementById('closeModalBtn')?.addEventListener('click', closeDetailModal);
    document.getElementById('closePlayerBtn')?.addEventListener('click', () => {
        const pm = document.getElementById('playerModal');
        if (pm) { pm.style.display = 'none'; document.body.style.overflow = ''; }
    });
    document.getElementById('logoHome')?.addEventListener('click', showMainPage);
    searchInput?.addEventListener('input', handleSearchInput);
    clearBtn?.addEventListener('click', clearSearch);
    backToTopBtn?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    window.addEventListener('scroll', updateBackToTop, { passive: true });
    document.addEventListener('keydown', onKeyDown);
    document.getElementById('closeSectionModalBtn')?.addEventListener('click', closeSectionModal);

    window.addEventListener('click', e => {
        if (e.target === document.getElementById('animeModal')) closeDetailModal();
        if (e.target === document.getElementById('sectionModal')) closeSectionModal();
    });
}

document.addEventListener('DOMContentLoaded', init);
