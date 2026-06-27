import { getProxyUrl } from './api.js';

export class LampaPlayer {
    constructor(container, options) {
        this.container = container;
        this.options = options || {};
        this.hls = null;
        this.state = { playing: false, currentTime: 0, duration: 0, volume: 0.8, muted: false, fullscreen: false, loading: true, src: null };
        this.videoRef = null;
        this.containerRef = null;
        this._init();
    }
    _init() {
        this.container.innerHTML = '';
        this.containerRef = document.createElement('div');
        this.containerRef.className = 'lampa-player-container';
        this.containerRef.style.cssText = 'width:100%;aspect-ratio:16/9;background:#000;position:relative;border-radius:12px;overflow:hidden;';
        this.videoRef = document.createElement('video');
        this.videoRef.setAttribute('crossorigin', 'anonymous');
        this.videoRef.setAttribute('playsinline', '');
        this.videoRef.controls = false;
        this.videoRef.style.cssText = 'width:100%;height:100%;object-fit:contain;';
        this.containerRef.appendChild(this.videoRef);
        this.container.appendChild(this.containerRef);
        this._bindEvents();
    }
    _bindEvents() {
        const v = this.videoRef;
        v.addEventListener('play', () => { this.state.playing = true; });
        v.addEventListener('pause', () => { this.state.playing = false; });
        v.addEventListener('timeupdate', () => { this.state.currentTime = v.currentTime; this.state.duration = v.duration || 0; });
        v.addEventListener('waiting', () => { this.state.loading = true; });
        v.addEventListener('canplay', () => { this.state.loading = false; });
        v.addEventListener('error', () => { this.state.loading = false; });
        this.containerRef.addEventListener('click', e => { if (e.target.closest('.player-overlay-selectors')) return; this.togglePlay(); });
        this.containerRef.addEventListener('dblclick', e => { if (e.target.closest('.player-overlay-selectors')) return; this.toggleFullscreen(); });
        document.addEventListener('fullscreenchange', () => { this.state.fullscreen = !!document.fullscreenElement; });
    }
    loadSource(src, animeTitle, episodeTitle) {
        this.state.src = src;
        const v = this.videoRef;
        this.state.loading = true;
        this.state.playing = false;
        if (this.hls) { this.hls.destroy(); this.hls = null; }
        v.pause();
        if (!src) { this.state.loading = false; return; }
        const proxyUrl = getProxyUrl(src);
        if (typeof Hls !== 'undefined' && Hls.isSupported()) {
            const hls = new Hls({ enableWorker: true, lowLatencyMode: false, backBufferLength: 90 });
            this.hls = hls;
            hls.loadSource(proxyUrl);
            hls.attachMedia(v);
            hls.on(Hls.Events.MANIFEST_PARSED, () => { this.state.loading = false; });
            hls.on(Hls.Events.ERROR, (ev, data) => { if (data && data.fatal) { this.state.loading = false; v.src = proxyUrl; } });
        } else {
            v.src = proxyUrl;
            const onCanPlay = () => { this.state.loading = false; v.removeEventListener('canplay', onCanPlay); };
            v.addEventListener('canplay', onCanPlay);
        }
    }
    togglePlay() { const v = this.videoRef; if (v.paused) v.play().catch(() => {}); else v.pause(); }
    toggleFullscreen() { if (!document.fullscreenElement) this.containerRef.requestFullscreen().catch(() => {}); else document.exitFullscreen(); }
    destroy() {
        if (this.hls) { this.hls.destroy(); this.hls = null; }
        this.videoRef.pause();
        this.videoRef.removeAttribute('src');
        this.videoRef.load();
        if (this.container) this.container.innerHTML = '';
    }
}
