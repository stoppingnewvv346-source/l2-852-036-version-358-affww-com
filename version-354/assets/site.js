import { H as Hls } from './hls-vendor-dru42stk.js';

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

function setupMobileMenu() {
  const button = $('.menu-toggle');
  const nav = $('.mobile-nav');
  if (!button || !nav) return;

  button.addEventListener('click', () => {
    const next = !nav.classList.contains('is-open');
    nav.classList.toggle('is-open', next);
    button.setAttribute('aria-expanded', String(next));
  });
}

function setupHeroCarousel() {
  const carousel = $('[data-hero-carousel]');
  if (!carousel) return;

  const slides = $$('[data-hero-slide]', carousel);
  const dots = $$('[data-hero-dot]', carousel);
  if (!slides.length) return;

  let active = 0;
  let timer = null;

  function show(index) {
    active = (index + slides.length) % slides.length;
    slides.forEach((slide, i) => slide.classList.toggle('is-active', i === active));
    dots.forEach((dot, i) => dot.classList.toggle('is-active', i === active));
  }

  function start() {
    stop();
    timer = window.setInterval(() => show(active + 1), 5200);
  }

  function stop() {
    if (timer) window.clearInterval(timer);
  }

  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => {
      show(i);
      start();
    });
  });

  carousel.addEventListener('mouseenter', stop);
  carousel.addEventListener('mouseleave', start);
  start();
}

function normalize(value) {
  return String(value || '').toLowerCase().trim();
}

function setupFilters() {
  $$('[data-filter-panel]').forEach((panel) => {
    const targetId = panel.getAttribute('data-target');
    const target = targetId ? document.getElementById(targetId) : null;
    if (!target) return;

    const input = $('.js-search', panel);
    const region = $('.js-region-filter', panel);
    const year = $('.js-year-filter', panel);
    const category = $('.js-category-filter', panel);
    const clear = $('.clear-filter', panel);
    const count = $('[data-result-count]', panel);
    const items = $$('.movie-card, .ranking-row', target);

    function itemMatches(item) {
      const q = normalize(input ? input.value : '');
      const regionValue = normalize(region ? region.value : '');
      const yearValue = normalize(year ? year.value : '');
      const categoryValue = normalize(category ? category.value : '');
      const text = normalize(`${item.dataset.title || ''} ${item.dataset.text || ''}`);
      const itemRegion = normalize(item.dataset.region || '');
      const itemYear = normalize(item.dataset.year || '');
      const itemCategory = normalize(item.dataset.category || '');

      if (q && !text.includes(q)) return false;
      if (regionValue && !itemRegion.includes(regionValue)) return false;
      if (yearValue && !itemYear.includes(yearValue)) return false;
      if (categoryValue && itemCategory !== categoryValue) return false;
      return true;
    }

    function apply() {
      let visible = 0;
      items.forEach((item) => {
        const ok = itemMatches(item);
        item.classList.toggle('is-hidden-by-filter', !ok);
        if (ok) visible += 1;
      });
      if (count) count.textContent = `当前显示 ${visible} / ${items.length}`;
    }

    [input, region, year, category].forEach((control) => {
      if (control) control.addEventListener('input', apply);
      if (control) control.addEventListener('change', apply);
    });

    if (clear) {
      clear.addEventListener('click', () => {
        if (input) input.value = '';
        if (region) region.value = '';
        if (year) year.value = '';
        if (category) category.value = '';
        apply();
      });
    }

    apply();
  });
}

function setupPlayers() {
  $$('[data-player]').forEach((wrap) => {
    const video = $('video[data-src]', wrap);
    const button = $('[data-play-button]', wrap);
    const message = $('[data-player-message]', wrap);
    if (!video || !button) return;

    let initialized = false;
    let hlsInstance = null;

    async function play() {
      const src = video.dataset.src;
      if (!src) {
        if (message) message.textContent = '当前影片暂未配置播放源。';
        return;
      }

      button.classList.add('is-hidden');
      if (message) message.textContent = '正在加载高清播放源...';

      try {
        if (!initialized) {
          if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = src;
          } else if (Hls && Hls.isSupported()) {
            hlsInstance = new Hls({
              enableWorker: true,
              lowLatencyMode: true,
              backBufferLength: 90,
            });
            hlsInstance.loadSource(src);
            hlsInstance.attachMedia(video);
            hlsInstance.on(Hls.Events.ERROR, (_, data) => {
              if (data && data.fatal && message) {
                message.textContent = '播放源加载失败，请稍后重试或更换浏览器。';
              }
            });
          } else {
            throw new Error('当前浏览器不支持 HLS 播放。');
          }
          initialized = true;
        }

        await video.play();
        if (message) message.textContent = '';
      } catch (error) {
        button.classList.remove('is-hidden');
        if (message) message.textContent = error.message || '播放启动失败，请再次点击播放。';
      }
    }

    button.addEventListener('click', play);
    video.addEventListener('play', () => button.classList.add('is-hidden'));
    video.addEventListener('pause', () => {
      if (video.currentTime === 0 || video.ended) button.classList.remove('is-hidden');
    });
    window.addEventListener('beforeunload', () => {
      if (hlsInstance) hlsInstance.destroy();
    });
  });
}

setupMobileMenu();
setupHeroCarousel();
setupFilters();
setupPlayers();
