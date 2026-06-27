import { fetchTop100, fetchMainPage } from './api.js';
import { openDetailModal } from './modals.js';

let heroItems = [];
let heroCurrentIndex = 0;
let heroCurrentItem = null;
let heroRotationTimer = null;
let heroTransitionTimer = null;
let heroMouseMoveTimer = null;
const parallaxIntensity = 15;

function renderHeroSlide(item) {
    const hero = document.getElementById('heroBanner');
    if (!hero || !item) return;
    heroCurrentItem = item;
    const bg = hero.querySelector('.agnative-hero__bg');
    if (bg) {
        bg.style.opacity = '0';
        setTimeout(() => {
            bg.src = item.images.jpg.large_image_url;
            bg.style.opacity = '1';
        }, 200);
    }
    const titleEl = hero.querySelector('.agnative-hero__title');
    if (titleEl) titleEl.textContent = item.title || '';
    const yearEl = hero.querySelector('.agnative-hero__year');
    if (yearEl) yearEl.textContent = item.year || '';
    const overviewEl = hero.querySelector('.agnative-hero__overview');
    if (overviewEl) overviewEl.textContent = '';
    const logoEl = hero.querySelector('.agnative-hero__logo');
    if (logoEl) logoEl.style.display = 'none';
    updateHeroIndicators();
}

function buildHeroIndicators() {
    const container = document.querySelector('.agnative-hero__indicators');
    if (!container) return;
    container.innerHTML = '';
    heroItems.forEach((item, idx) => {
        const dot = document.createElement('div');
        dot.className = 'agnative-hero__indicator' + (idx === heroCurrentIndex ? ' agnative-hero__indicator--active' : '');
        dot.addEventListener('click', () => openHeroItemAt(idx));
        container.appendChild(dot);
    });
}

function updateHeroIndicators() {
    const container = document.querySelector('.agnative-hero__indicators');
    if (!container) return;
    const dots = container.querySelectorAll('.agnative-hero__indicator');
    dots.forEach((dot, i) => dot.classList.toggle('agnative-hero__indicator--active', i === heroCurrentIndex));
}

function transitionHeroToIndex(idx) {
    if (idx < 0 || idx >= heroItems.length || !heroItems[idx]) return;
    if (idx === heroCurrentIndex) return;
    const hero = document.getElementById('heroBanner');
    if (!hero) return;
    if (heroTransitionTimer) { clearTimeout(heroTransitionTimer); heroTransitionTimer = null; }
    heroCurrentIndex = idx;
    heroCurrentItem = heroItems[idx];
    hero.classList.add('agnative-hero--switching');
    heroTransitionTimer = setTimeout(() => {
        heroTransitionTimer = null;
        renderHeroSlide(heroItems[idx]);
        setTimeout(() => hero.classList.remove('agnative-hero--switching'), 200);
    }, 300);
}

export function stopHeroRotation() {
    if (heroRotationTimer) { clearInterval(heroRotationTimer); heroRotationTimer = null; }
}

export function startHeroRotation() {
    stopHeroRotation();
    if (heroItems.length < 2) return;
    heroRotationTimer = setInterval(() => {
        const hero = document.getElementById('heroBanner');
        if (!hero || hero.style.display === 'none') { stopHeroRotation(); return; }
        const nextIdx = (heroCurrentIndex + 1) % heroItems.length;
        transitionHeroToIndex(nextIdx);
    }, 5000);
}

function openHeroItemAt(idx) {
    if (idx < 0 || idx >= heroItems.length) return;
    transitionHeroToIndex(idx);
    if (heroItems[idx]?.url) openDetailModal(heroItems[idx].url);
}

function setupHeroParallax() {
    const heroBanner = document.getElementById('heroBanner');
    if (!heroBanner) return;
    const contentEls = heroBanner.querySelectorAll('.agnative-hero__content > *');
    const depthMap = { 'agnative-hero__title': 20, 'agnative-hero__year': 10, 'agnative-hero__overview': 5 };
    contentEls.forEach(el => {
        for (const [cls, depth] of Object.entries(depthMap)) {
            if (el.classList.contains(cls)) {
                el.dataset.parallaxDepth = depth;
                el.style.transform = `translateZ(${depth}px)`;
                break;
            }
        }
    });
    heroBanner.addEventListener('mouseenter', () => {
        const bg = heroBanner.querySelector('.agnative-hero__bg');
        if (bg) bg.style.animationPlayState = 'paused';
    });
    heroBanner.addEventListener('mousemove', (e) => {
        if (heroMouseMoveTimer) clearTimeout(heroMouseMoveTimer);
        heroMouseMoveTimer = setTimeout(() => {
            const { clientX, clientY } = e;
            const { left, top, width, height } = heroBanner.getBoundingClientRect();
            const centerX = left + width / 2;
            const centerY = top + height / 2;
            const offsetX = (clientX - centerX) / (width / 2);
            const offsetY = (clientY - centerY) / (height / 2);
            const bg = heroBanner.querySelector('.agnative-hero__bg');
            if (bg) {
                bg.style.transform = `scale(1.05) translate(${offsetX * parallaxIntensity * 0.5}px, ${offsetY * parallaxIntensity * 0.5}px)`;
            }
            const contentElements = heroBanner.querySelectorAll('.agnative-hero__content > *');
            contentElements.forEach(el => {
                const depth = parseFloat(el.dataset.parallaxDepth) || 0;
                el.style.transform = `translateZ(${depth}px) translateX(${offsetX * parallaxIntensity * (depth / 20)}px) translateY(${offsetY * parallaxIntensity * (depth / 20)}px)`;
            });
        }, 10);
    });
    heroBanner.addEventListener('mouseleave', () => {
        const bg = heroBanner.querySelector('.agnative-hero__bg');
        if (bg) { bg.style.transform = ''; bg.style.animationPlayState = 'running'; }
        const contentElements = heroBanner.querySelectorAll('.agnative-hero__content > *');
        contentElements.forEach(el => {
            const depth = parseFloat(el.dataset.parallaxDepth) || 0;
            el.style.transform = `translateZ(${depth}px) translateX(0) translateY(0)`;
        });
    });
}

export async function buildHeroBanner() {
    const hero = document.getElementById('heroBanner');
    if (!hero) return;
    try {
        const [topAnime, ordinaryAnime] = await Promise.all([fetchTop100(), fetchMainPage(1)]);
        const getRandomItems = (arr, n) => {
            const validItems = arr.filter(a => a.images.jpg.large_image_url);
            const shuffled = [...validItems].sort(() => 0.5 - Math.random());
            return shuffled.slice(0, n);
        };
        const selectedTop = getRandomItems(topAnime, 4);
        const selectedOrdinary = getRandomItems(ordinaryAnime, 4);
        heroItems = [...selectedTop, ...selectedOrdinary].sort(() => 0.5 - Math.random());
        if (heroItems.length === 0) { hero.style.display = 'none'; return; }
        hero.style.display = 'block';
        heroCurrentIndex = 0;
        renderHeroSlide(heroItems[0]);
        buildHeroIndicators();
        setupHeroParallax();
        startHeroRotation();
        document.body.classList.add('agnative-has-hero');
    } catch (err) {
        console.warn('Hero banner error:', err);
        hero.style.display = 'none';
    }
}

document.getElementById('heroBanner')?.querySelector('.agnative-hero__play')?.addEventListener('click', () => {
    if (heroCurrentItem?.url) openDetailModal(heroCurrentItem.url);
});
