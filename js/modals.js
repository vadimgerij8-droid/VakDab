import { loadAnimeDetails, fetchByGenre, searchAnimeUA } from './api.js';
import { LampaPlayer } from './player.js';
import { showToast } from './ui.js';

let currentDetailAnime = null;
let lampaPlayerInstance = null;

export function closeDetailModal() {
    const modal = document.getElementById('animeModal');
    if (!modal) return;
    modal.style.display = 'none';
    document.body.style.overflow = '';
    if (lampaPlayerInstance) { lampaPlayerInstance.destroy(); lampaPlayerInstance = null; }
}

export async function openDetailModal(url) {
    closeSectionModal();

    const modal = document.getElementById('animeModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');
    if (!modal) return;
    modal.querySelector('.modal-content').scrollTop = 0;
    if (lampaPlayerInstance) { lampaPlayerInstance.destroy(); lampaPlayerInstance = null; }
    modalTitle.textContent = 'Завантаження...';
    modalBody.innerHTML = '<div class="loader"><i class="fas fa-spinner fa-pulse"></i> Завантаження...</div>';
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    try {
        const anime = await loadAnimeDetails(url);
        currentDetailAnime = anime;
        modalTitle.textContent = anime.title;
        const seasons = Object.keys(anime.seasons).sort((a, b) => parseInt(a) - parseInt(b));
        const firstSeason = seasons[0] || '1';
        const dubs = Object.keys(anime.seasons[firstSeason] || {}).sort();
        const firstDub = dubs[0] || '';
        const episodes = firstDub ? anime.seasons[firstSeason][firstDub] || [] : [];
        const startFile = episodes[0]?.file || '';
        const totalEpisodes = Object.values(anime.seasons).reduce((sum, s) => sum + Object.values(s).reduce((s2, e) => Math.max(s2, e.length), 0), 0);
        modalBody.innerHTML = `
        <div class="anime-detail-grid">
          <div class="detail-poster"><img src="${anime.images.jpg.large_image_url}" alt="${anime.title}"></div>
          <div class="detail-info">
            <div><span class="tag"><i class="fas fa-calendar"></i> ${anime.year||'—'}</span><span class="tag"><i class="fas fa-film"></i> ${totalEpisodes} еп.</span></div>
            <div style="margin:0.5rem 0">${anime.genres.map(g=>`<span class="tag">${g}</span>`).join('')} ${anime.rating?`<span class="tag" style="background:var(--accent);color:var(--accent-text);"><i class="fas fa-user-shield"></i> ${anime.rating}</span>`:''}</div>
            <div class="synopsis-container"><div class="synopsis" id="synopsisText">${anime.synopsis||'Опис відсутній.'}</div><button class="more-btn" id="moreBtn">більше</button></div>
          </div>
        </div>
        <div style="margin-top:1.5rem;position:relative;">
          <div id="lampaDetailPlayer" style="width:100%;background:#000;border-radius:12px;overflow:hidden;aspect-ratio:16/9;"></div>
          <div class="player-overlay-selectors">
            <div class="glass-select-wrap"><select class="glass-select" id="seasonSelect">${seasons.map(s=>`<option value="${s}" ${s===firstSeason?'selected':''}>Сезон ${s}</option>`).join('')}</select><span class="select-label">Сезон</span></div>
            <div class="glass-select-wrap"><select class="glass-select" id="dubSelect">${dubs.map(d=>`<option value="${d}" ${d===firstDub?'selected':''}>${d}</option>`).join('')}</select><span class="select-label">Озвучка</span></div>
            <div class="glass-select-wrap"><select class="glass-select" id="episodeSelect">${episodes.map((ep,i)=>`<option value="${ep.file}" ${i===0?'selected':''}>Еп. ${ep.episode}</option>`).join('')}</select><span class="select-label">Епізод</span></div>
          </div>
        </div>`;
        const playerContainer = document.getElementById('lampaDetailPlayer');
        if (playerContainer) {
            lampaPlayerInstance = new LampaPlayer(playerContainer, {});
            const seasonSel = document.getElementById('seasonSelect');
            const dubSel = document.getElementById('dubSelect');
            const epSel = document.getElementById('episodeSelect');
            function updateDubs() {
                const s = seasonSel.value;
                const avail = Object.keys(anime.seasons[s] || {}).sort();
                dubSel.innerHTML = avail.map(d => `<option value="${d}">${d}</option>`).join('');
                updateEpisodes();
            }
            function updateEpisodes() {
                const s = seasonSel.value, d = dubSel.value;
                const eps = anime.seasons[s]?.[d] || [];
                epSel.innerHTML = eps.map(ep => `<option value="${ep.file}">Еп. ${ep.episode}</option>`).join('');
            }
            function playEpisode(file) {
                if (!file) { showToast('❌ Немає файлу для відтворення'); return; }
                lampaPlayerInstance.loadSource(file, '', '');
            }
            seasonSel.addEventListener('change', () => { updateDubs(); playEpisode(epSel.value); });
            dubSel.addEventListener('change', () => { updateEpisodes(); playEpisode(epSel.value); });
            epSel.addEventListener('change', () => playEpisode(epSel.value));
            if (startFile) lampaPlayerInstance.loadSource(startFile, '', '');
        }
        const synText = document.getElementById('synopsisText');
        const moreBtn = document.getElementById('moreBtn');
        if (synText && moreBtn) {
            const checkOverflow = () => { if (synText.scrollHeight > synText.clientHeight + 2) { moreBtn.style.display = 'block'; } else { moreBtn.style.display = 'none'; } };
            setTimeout(checkOverflow, 100);
            moreBtn.addEventListener('click', () => { const exp = synText.classList.toggle('expanded'); moreBtn.textContent = exp ? 'менше' : 'більше'; });
        }
    } catch (err) {
        modalBody.innerHTML = `<div class="loader"><i class="fas fa-exclamation-circle"></i> Помилка: ${err.message}<br><button class="btn-outline" style="margin-top:1rem;">🔄 Повторити</button></div>`;
        modalBody.querySelector('.btn-outline')?.addEventListener('click', () => openDetailModal(url));
    }
}

const sectionState = { type: null, genreSlug: null, genreName: null, searchQuery: '', page: 1, list: [] };

export function closeSectionModal() {
    const modal = document.getElementById('sectionModal');
    if (!modal) return;
    modal.style.display = 'none';
    document.body.style.overflow = '';
    sectionState.type = null;
}

function openSectionModal(title, bodyHtml) {
    const modal = document.getElementById('sectionModal');
    const modalTitle = document.getElementById('sectionModalTitle');
    const modalBody = document.getElementById('sectionModalBody');
    if (!modal) return;
    modalTitle.textContent = title;
    modalBody.innerHTML = bodyHtml;
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    modal.querySelector('.modal-content').scrollTop = 0;
}

function renderSectionCards(list, container) {
    if (!list.length) { container.innerHTML = '<div class="loader">Нічого не знайдено</div>'; return; }
    let html = '<div class="anime-grid" style="margin-top:0;">';
    html += list.map((a, idx) => `
      <div class="anime-card" data-url="${a.url}" tabindex="0" role="button" aria-label="${a.title}" style="animation-delay:${idx*0.04}s">
        <div class="anime-poster">
          <img src="${a.images.jpg.large_image_url}" alt="${a.title}" loading="lazy" class="img--blur" onload="this.classList.add('img--loaded')">
          <div class="nfx-card-overlay">
            <div class="nfx-card-overlay__title">${a.title}</div>
            <div class="nfx-card-overlay__ua">UA</div>
          </div>
        </div>
      </div>`).join('');
    html += '</div><div class="pagination-row">';
    html += `<button class="btn-outline" ${sectionState.page<=1?'disabled':''} id="sectionPrevBtn"><i class="fas fa-chevron-left"></i> Назад</button>`;
    html += `<span class="page-indicator">Сторінка ${sectionState.page}</span>`;
    html += `<button class="btn-outline" id="sectionNextBtn">Вперед <i class="fas fa-chevron-right"></i></button>`;
    html += '</div>';
    container.innerHTML = html;
    container.querySelectorAll('.anime-card').forEach(card => {
        card.addEventListener('click', () => openDetailModal(card.dataset.url));
        card.addEventListener('keydown', e => { if (e.key === 'Enter') openDetailModal(card.dataset.url); });
    });
    const prevBtn = document.getElementById('sectionPrevBtn');
    const nextBtn = document.getElementById('sectionNextBtn');
    if (prevBtn) prevBtn.addEventListener('click', () => { if (sectionState.page > 1) { sectionState.page--; loadGenreContent(); } });
    if (nextBtn) nextBtn.addEventListener('click', () => { sectionState.page++; loadGenreContent(); });
}

async function loadGenreContent() {
    const body = document.getElementById('sectionModalBody');
    if (!body) return;
    try {
        const list = await fetchByGenre(sectionState.genreSlug, sectionState.page);
        sectionState.list = list;
        renderSectionCards(list, body);
    } catch (err) {
        body.innerHTML = `<div class="loader"><i class="fas fa-exclamation-triangle"></i> Помилка: ${err.message}<br><button class="btn-outline" style="margin-top:1rem;">🔄 Повторити</button></div>`;
        body.querySelector('.btn-outline')?.addEventListener('click', loadGenreContent);
    }
}

export function openGenreSection(slug, name) {
    sectionState.type = 'genre';
    sectionState.genreSlug = slug;
    sectionState.genreName = name;
    sectionState.page = 1;
    sectionState.searchQuery = '';
    openSectionModal(name, '<div class="loader"><i class="fas fa-spinner fa-pulse"></i> Завантаження...</div>');
    loadGenreContent();
}

async function loadSearchContent() {
    const container = document.getElementById('sectionSearchResults');
    if (!container) return;
    container.innerHTML = '<div class="loader"><i class="fas fa-spinner fa-pulse"></i> Пошук...</div>';
    try {
        const list = await searchAnimeUA(sectionState.searchQuery, sectionState.page);
        sectionState.list = list;
        renderSectionCards(list, container);
    } catch (err) {
        container.innerHTML = `<div class="loader"><i class="fas fa-exclamation-triangle"></i> Помилка: ${err.message}</div>`;
    }
}

export function openSearchSection() {
    sectionState.type = 'search';
    sectionState.searchQuery = '';
    sectionState.page = 1;
    const bodyHtml = `
    <div class="search-wrapper" style="margin-bottom:1.5rem;">
      <i class="fas fa-search"></i>
      <input type="text" id="sectionSearchInput" placeholder="Пошук аніме..." autocomplete="off" style="border:none;outline:none;background:transparent;width:100%;font-size:0.97rem;color:var(--text);">
    </div>
    <div id="sectionSearchResults"><div class="loader">Введіть пошуковий запит</div></div>`;
    openSectionModal('Пошук', bodyHtml);
    const input = document.getElementById('sectionSearchInput');
    if (input) {
        input.focus();
        let debounce;
        input.addEventListener('input', () => {
            const q = input.value.trim();
            clearTimeout(debounce);
            debounce = setTimeout(() => {
                sectionState.searchQuery = q;
                sectionState.page = 1;
                if (q) loadSearchContent();
                else document.getElementById('sectionSearchResults').innerHTML = '<div class="loader">Введіть пошуковий запит</div>';
            }, 400);
        });
    }
}

export function openSettingsSection() {
    showToast('⚙️ Налаштування відкриті в меню (M)');
}
