import { PROXY_URL, ANIMEUA_BASE, GENRE_MAP } from './config.js';

function hashCode(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) {
        h = ((h << 5) - h) + str.charCodeAt(i);
        h |= 0;
    }
    return Math.abs(h);
}

function safeQuery(sel, parent) {
    try { return (parent || document).querySelector(sel); } catch { return null; }
}
function safeQueryAll(sel, parent) {
    try { return Array.from((parent || document).querySelectorAll(sel)); } catch { return []; }
}

export function getProxyUrl(url) {
    if (!url) return null;
    return PROXY_URL + '?url=' + encodeURIComponent(url);
}

export async function fetchUA(url) {
    const proxyUrl = getProxyUrl(url);
    const resp = await fetch(proxyUrl);
    if (!resp.ok) throw new Error(`Помилка ${resp.status}`);
    const html = await resp.text();
    return new DOMParser().parseFromString(html, 'text/html');
}

export function parseCards(doc) {
    const cards = safeQueryAll('.poster', doc);
    if (cards.length) {
        return cards.map(card => {
            const linkEl = card.tagName === 'A' ? card : safeQuery('a', card);
            const href = linkEl?.getAttribute('href') || '';
            const img = safeQuery('img', card);
            const posterSrc = img?.getAttribute('data-src') || img?.getAttribute('src') || '';
            const titleEl = safeQuery('.poster__title', card) || safeQuery('h3', card);
            const title = (titleEl?.textContent || '').trim() || 'Без назви';
            return {
                mal_id: hashCode(href),
                title,
                url: href.startsWith('http') ? href : ANIMEUA_BASE + href,
                images: { jpg: { large_image_url: posterSrc.startsWith('http') ? posterSrc : (posterSrc ? ANIMEUA_BASE + posterSrc : '') } },
                score: null,
                year: null,
                from: 'animeua'
            };
        });
    }
    const links = safeQueryAll('a[href*="/anime/"]', doc);
    const unique = new Map();
    links.forEach(a => { if (!unique.has(a.href)) unique.set(a.href, a); });
    return Array.from(unique.values()).map(a => {
        const img = safeQuery('img', a);
        const src = img?.getAttribute('data-src') || img?.getAttribute('src') || '';
        const title = (safeQuery('.poster__title', a)?.textContent || a.textContent || '').trim();
        return {
            mal_id: hashCode(a.href),
            title: title || 'Без назви',
            url: a.href,
            images: { jpg: { large_image_url: src.startsWith('http') ? src : ANIMEUA_BASE + src } },
            score: null,
            year: null,
            from: 'animeua'
        };
    });
}

export async function fetchMainPage(page) {
    const doc = await fetchUA(`${ANIMEUA_BASE}/page/${page}/`);
    return parseCards(doc);
}

export async function searchAnimeUA(query, page) {
    const doc = await fetchUA(`${ANIMEUA_BASE}/index.php?do=search&subaction=search&story=${encodeURIComponent(query)}&page=${page}`);
    return parseCards(doc);
}

export async function fetchByGenre(genreSlug, page) {
    const url = page > 1 ? `${ANIMEUA_BASE}/${genreSlug}/page/${page}/` : `${ANIMEUA_BASE}/${genreSlug}/`;
    const doc = await fetchUA(url);
    return parseCards(doc);
}

export async function fetchTop100() {
    const doc = await fetchUA(`${ANIMEUA_BASE}/top.html`);
    return parseCards(doc);
}

export function fetchGenres() {
    return Object.entries(GENRE_MAP).map(([name, slug]) => ({ slug, name })).sort((a, b) => a.name.localeCompare(b.name, 'uk'));
}

function extractSourcesFromText(text, providerName) {
    let sources = [];
    const jsonMatch = text.match(/file\s*:\s*(\[[\s\S]+?\]|\'[\s\S]+?\'|\"[\s\S]+?\"|\{[\s\S]+?\})/i) || text.match(/playlist\s*:\s*(\[[\s\S]+?\])/i);
    if (jsonMatch) {
        try {
            let raw = jsonMatch[1].trim();
            if ((raw.startsWith("'") && raw.endsWith("'")) || (raw.startsWith('"') && raw.endsWith('"'))) raw = raw.slice(1, -1);
            if (raw.startsWith('{') && raw.endsWith('}')) raw = `[${raw}]`;
            const clean = raw.replace(/,\s*\]/g, ']').replace(/,\s*\}/g, '}');
            const arr = JSON.parse(clean);
            const walk = (items, dub, season) => {
                dub = dub || '';
                season = season || '1';
                items.forEach(item => {
                    if (item.folder || item.playlist) {
                        let nd = dub, ns = season;
                        const ft = item.title || '';
                        const sm = ft.match(/[Сс]езон\s*(\d+)/);
                        if (sm) { ns = sm[1]; if (ft.trim().toLowerCase() !== `сезон ${ns}`.toLowerCase()) nd = ft.replace(/[Сс]езон\s*\d+/g, '').replace(/\//g, '').trim() || dub; }
                        else if (ft) nd = ft;
                        walk(item.folder || item.playlist, nd, ns);
                    } else if (item.file) {
                        const epT = item.title || 'Серія';
                        let fd = dub || providerName || 'UA', fs = season;
                        const esm = epT.match(/[Сс]езон\s*(\d+)/);
                        if (esm) fs = esm[1];
                        const epm = epT.match(/(\d+)\s*[Сс]ері[яіяа]|[Сс]ері[яіяа]\s*(\d+)|[Ее]п\.?\s*(\d+)/);
                        sources.push({ label: epT, file: item.file, provider: providerName, dub: fd.trim(), season: fs, episode: epm ? (epm[1] || epm[2] || epm[3]) : '1' });
                    }
                });
            };
            if (Array.isArray(arr)) walk(arr);
            else if (arr.file) sources.push({ label: arr.title || 'Озвучка', file: arr.file, provider: providerName, dub: providerName || 'UA', season: '1', episode: '1' });
        } catch (e) { console.warn('JSON parse error', e); }
    }
    if (sources.length === 0) {
        const urlMatches = [...text.matchAll(/https?:\/\/[^\s\'"<>]+\.m3u8[^\s\'"<>]*/g)];
        urlMatches.forEach((m, idx) => {
            if (!sources.some(s => s.file === m[0])) sources.push({ label: `Потік ${idx+1}`, file: m[0], provider: providerName, dub: providerName || 'UA', season: '1', episode: String(idx+1) });
        });
    }
    return sources;
}

function extractPlayerIframeUrls(doc) {
    const selectors = ['.video-responsive iframe', '.player-responsive iframe', '#player iframe', '.pmovie__player iframe', 'iframe[src]', 'iframe[data-src]'];
    const urls = [];
    for (const sel of selectors) {
        safeQueryAll(sel, doc).forEach(el => {
            let src = el.getAttribute('src') || el.getAttribute('data-src');
            if (!src || src === 'about:blank') return;
            if (src.startsWith('//')) src = 'https:' + src;
            if (!src.startsWith('http')) src = ANIMEUA_BASE + src;
            urls.push(src);
        });
    }
    const scripts = safeQueryAll('script:not([src])', doc);
    for (const s of scripts) {
        const matches = s.textContent.matchAll(/(?:playerUrl|iframeUrl|src)\s*[:=]\s*['"]([^'"]+)['"]/g);
        for (const match of matches) {
            let url = match[1];
            if (url.includes('ashdi.vip') || url.includes('vidmoly') || url.includes('player')) {
                if (url.startsWith('//')) url = 'https:' + url;
                if (!url.startsWith('http')) url = ANIMEUA_BASE + url;
                urls.push(url);
            }
        }
    }
    return [...new Set(urls)];
}

export async function loadAnimeDetails(animeUrl) {
    const doc = await fetchUA(animeUrl);
    let title = '';
    for (const sel of ['.page__subcol-main h1', '.pmovie__title', 'h1.title', 'h1']) {
        const el = safeQuery(sel, doc);
        if (el?.textContent.trim()) { title = el.textContent.trim(); break; }
    }
    let poster = '';
    for (const sel of ['div.page__subcol-side .img-fit-cover img', '.pmovie__poster img', '.anime__poster img']) {
        const el = safeQuery(sel, doc);
        if (el) {
            const src = el.getAttribute('data-src') || el.getAttribute('src') || '';
            if (src) { poster = src.startsWith('http') ? src : ANIMEUA_BASE + src; break; }
        }
    }
    const genres = safeQueryAll('.pmovie__genres a, .genres a', doc).map(a => a.textContent.trim()).filter(Boolean);
    const yearEl = safeQuery('.pmovie__year, .release-year', doc);
    const yearMatch = (yearEl?.textContent || '').match(/\d{4}/);
    const year = yearMatch ? parseInt(yearMatch[0]) : null;
    let synopsis = '';
    for (const sel of ['.full-text', '.pmovie__description', '.anime__description']) {
        const el = safeQuery(sel, doc);
        if (el?.textContent.trim()) { synopsis = el.textContent.trim(); break; }
    }
    let rating = '';
    const ratingEl = doc.querySelector('.pmovie__age p, .pmovie__age');
    if (ratingEl) rating = ratingEl.textContent.replace('Рейтинг:', '').trim();

    const playerUrls = extractPlayerIframeUrls(doc);
    const allRawSources = [];
    for (const playerUrl of playerUrls) {
        try {
            let provider = 'Джерело';
            if (playerUrl.includes('ashdi')) provider = 'Ashdi';
            else if (playerUrl.includes('vidmoly')) provider = 'Vidmoly';
            else if (playerUrl.includes('player')) provider = 'Player';
            const playerHtml = await fetchUA(playerUrl);
            const text = playerHtml.body?.innerHTML || '';
            allRawSources.push(...extractSourcesFromText(text, provider));
            const nestedIframes = safeQueryAll('iframe', playerHtml);
            for (const nested of nestedIframes) {
                let nestedUrl = nested.getAttribute('src') || nested.getAttribute('data-src');
                if (nestedUrl && nestedUrl !== 'about:blank') {
                    if (nestedUrl.startsWith('//')) nestedUrl = 'https:' + nestedUrl;
                    if (!nestedUrl.startsWith('http')) nestedUrl = ANIMEUA_BASE + nestedUrl;
                    const nestedHtml = await fetchUA(nestedUrl);
                    allRawSources.push(...extractSourcesFromText(nestedHtml.body?.innerHTML || '', provider));
                }
            }
        } catch (e) { console.warn('Player fetch failed', playerUrl, e); }
    }

    const seasons = {};
    const seenKeys = new Set();
    allRawSources.forEach(s => {
        const sn = s.season || '1', dn = s.dub || 'UA', en = s.episode || '1';
        const uk = `${sn}-${dn}-${en}-${s.file}`;
        if (!seenKeys.has(uk)) {
            seenKeys.add(uk);
            if (!seasons[sn]) seasons[sn] = {};
            if (!seasons[sn][dn]) seasons[sn][dn] = [];
            seasons[sn][dn].push({ title: s.label, season: sn, episode: en, file: s.file, dub: dn, provider: s.provider });
        }
    });
    for (const s in seasons)
        for (const d in seasons[s])
            seasons[s][d].sort((a, b) => parseInt(a.episode) - parseInt(b.episode));

    return {
        mal_id: hashCode(animeUrl),
        title,
        images: { jpg: { large_image_url: poster, image_url: poster } },
        genres, year, synopsis, seasons, url: animeUrl, from: 'animeua', rating
    };
}
