(function () {
  const ready = (fn) => {
    if (document.readyState !== "loading") fn();
    else document.addEventListener("DOMContentLoaded", fn);
  };

  const qs = (sel, root = document) => root.querySelector(sel);
  const qsa = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  function encodeHtml(str) {
    return String(str)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }

  function initMobileNav() {
    const toggle = qs("[data-menu-toggle]");
    const nav = qs("[data-site-nav]");
    if (!toggle || !nav) return;
    toggle.addEventListener("click", () => nav.classList.toggle("is-open"));
  }

  function initSearchForms() {
    qsa("[data-site-search-form]").forEach((form) => {
      form.addEventListener("submit", (event) => {
        event.preventDefault();
        const input = qs("input", form);
        const query = input ? input.value.trim() : "";
        const url = new URL(form.getAttribute("action") || "/search.html", window.location.href);
        if (query) url.searchParams.set("q", query);
        window.location.href = url.toString();
      });
    });
  }

  function initHeroCarousel() {
    const hero = qs("[data-hero-carousel]");
    if (!hero) return;
    const slides = qsa("[data-hero-slide]", hero);
    const dots = qsa("[data-hero-dot]", hero);
    const prev = qs("[data-hero-prev]", hero);
    const next = qs("[data-hero-next]", hero);
    if (!slides.length) return;

    let index = 0;
    let timer = null;

    const activate = (nextIndex) => {
      index = (nextIndex + slides.length) % slides.length;
      slides.forEach((slide, i) => slide.classList.toggle("is-active", i === index));
      dots.forEach((dot, i) => dot.classList.toggle("is-active", i === index));
    };

    const start = () => {
      stop();
      timer = window.setInterval(() => activate(index + 1), 5000);
    };
    const stop = () => { if (timer) window.clearInterval(timer); timer = null; };

    if (prev) prev.addEventListener("click", () => { activate(index - 1); start(); });
    if (next) next.addEventListener("click", () => { activate(index + 1); start(); });
    dots.forEach((dot) => {
      dot.addEventListener("click", () => {
        const i = Number(dot.dataset.index || 0);
        activate(i);
        start();
      });
    });

    activate(0);
    start();
  }

  function initLocalFiltering() {
    qsa("[data-local-filter-wrap]").forEach((wrap) => {
      const input = qs("[data-local-filter-input]", wrap);
      const cards = qsa("[data-card]", wrap);
      const buttons = qsa("[data-local-filter]", wrap);
      const counter = qs("[data-local-count]", wrap);
      if (!input || !cards.length) return;
      let active = "all";
      const apply = () => {
        const q = input.value.trim().toLowerCase();
        let shown = 0;
        cards.forEach((card) => {
          const hay = String(card.dataset.search || "").toLowerCase();
          const region = String(card.dataset.region || "");
          const type = String(card.dataset.type || "");
          const year = String(card.dataset.year || "");
          const matchQ = !q || hay.includes(q);
          const matchFilter = active === "all" || active === region || active === type || active === year;
          const show = matchQ && matchFilter;
          card.classList.toggle("hidden", !show);
          if (show) shown += 1;
        });
        if (counter) counter.textContent = `${shown} 条内容`;
      };
      buttons.forEach((btn) => {
        btn.addEventListener("click", () => {
          active = btn.dataset.localFilter || "all";
          buttons.forEach((x) => x.classList.toggle("is-active", x === btn));
          apply();
        });
      });
      input.addEventListener("input", apply);
      apply();
    });
  }

  async function loadJson(url) {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`加载失败：${res.status}`);
    return await res.json();
  }

  function makeCardHtml(item, root = "") {
    const title = encodeHtml(item.title);
    const meta = encodeHtml(`${item.region} · ${item.year} · ${(item.genre || []).slice(0, 2).join(" / ") || item.type}`);
    const tags = (item.tags || []).slice(0, 3).map((t) => `<span class="tag">${encodeHtml(t)}</span>`).join("");
    const imgSrc = `${root}${item.cover}`;
    const href = `${root}movies/${item.slug}.html`;
    return `
      <article class="movie-card" data-card
        data-title="${title}"
        data-region="${encodeHtml(item.region)}"
        data-type="${encodeHtml(item.type)}"
        data-year="${encodeHtml(item.year)}"
        data-tags="${encodeHtml([...(item.genre || []), ...(item.tags || [])].join(" "))}"
        data-search="${encodeHtml([item.title, item.region, item.type, item.year, ...(item.genre || []), ...(item.tags || []), item.one_line, item.summary, item.review].join(" "))}">
        <a class="movie-link" href="${href}">
          <div class="movie-poster">
            <img src="${imgSrc}" alt="${title}" loading="lazy">
            <span class="badge badge-top">${encodeHtml(item.type)}</span>
            <span class="badge badge-right">${encodeHtml(item.year)}</span>
          </div>
          <div class="movie-body">
            <h3 class="movie-title">${title}</h3>
            <p class="movie-desc">${encodeHtml(item.one_line || item.summary || "")}</p>
            <div class="movie-meta">${meta}</div>
            <div class="movie-tags">${tags}</div>
          </div>
        </a>
      </article>
    `;
  }

  function initSearchPage() {
    const shell = qs("[data-search-shell]");
    if (!shell) return;
    const src = shell.dataset.catalogSrc;
    const root = shell.dataset.root || "";
    const results = qs("[data-search-results]", shell);
    const count = qs("[data-search-count]", shell);
    const hint = qs("[data-search-hint]", shell);
    const queryInput = qs("[data-search-input]", shell);
    const regionSelect = qs("[data-search-region]", shell);
    const typeSelect = qs("[data-search-type]", shell);
    const sortSelect = qs("[data-search-sort]", shell);
    const initialQuery = new URL(window.location.href).searchParams.get("q") || "";
    if (queryInput) queryInput.value = initialQuery;

    let catalog = [];
    const render = () => {
      const q = (queryInput?.value || "").trim().toLowerCase();
      const region = regionSelect?.value || "all";
      const type = typeSelect?.value || "all";
      const sort = sortSelect?.value || "score";
      let items = catalog.filter((item) => {
        const hay = [item.title, item.region, item.type, item.year, ...(item.genre || []), ...(item.tags || []), item.one_line, item.summary, item.review].join(" ").toLowerCase();
        const okQ = !q || hay.includes(q);
        const okRegion = region === "all" || item.region === region || item.group === region;
        const okType = type === "all" || item.type === type;
        return okQ && okRegion && okType;
      });
      items.sort((a, b) => {
        if (sort === "year") return (b.year - a.year) || a.title.localeCompare(b.title, "zh");
        if (sort === "title") return a.title.localeCompare(b.title, "zh");
        return (b.score - a.score) || (b.year - a.year) || a.title.localeCompare(b.title, "zh");
      });
      if (count) count.textContent = `${items.length} 条结果`;
      if (hint) hint.textContent = q ? `关键词：${queryInput.value.trim()}` : "输入关键词即可开始搜索。";
      if (results) {
        results.innerHTML = items.slice(0, 240).map((item) => makeCardHtml(item, root)).join("");
        initLocalFiltering();
      }
    };

    loadJson(src)
      .then((data) => {
        catalog = data;
        render();
      })
      .catch((err) => {
        if (results) results.innerHTML = `<div class="search-panel"><strong>数据加载失败</strong><p>${encodeHtml(err.message)}</p></div>`;
      });

    [queryInput, regionSelect, typeSelect, sortSelect].forEach((el) => {
      if (!el) return;
      el.addEventListener("input", render);
      el.addEventListener("change", render);
    });
  }

  function loadHlsScript() {
    if (window.Hls) return Promise.resolve(window.Hls);
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/hls.js@latest";
      script.async = true;
      script.onload = () => resolve(window.Hls);
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  async function initVideoPlayers() {
    const videos = qsa("video[data-hls-src]");
    if (!videos.length) return;
    for (const video of videos) {
      const src = video.dataset.hlsSrc;
      const overlay = video.parentElement ? qs("[data-play-overlay]", video.parentElement) : null;
      const playBtn = video.parentElement ? qs("[data-play-button]", video.parentElement) : null;

      const hideOverlay = () => { if (overlay) overlay.classList.add("hidden"); };
      const startPlayback = async () => {
        try { await video.play(); } catch (err) {}
        hideOverlay();
      };

      if (overlay) overlay.addEventListener("click", startPlayback);
      if (playBtn) playBtn.addEventListener("click", startPlayback);
      video.addEventListener("play", hideOverlay);

      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = src;
        continue;
      }

      try {
        const Hls = await loadHlsScript();
        if (Hls && Hls.isSupported()) {
          const hls = new Hls({ enableWorker: true, lowLatencyMode: false });
          hls.loadSource(src);
          hls.attachMedia(video);
        } else {
          video.outerHTML = `<div class="search-panel"><strong>当前浏览器不支持 HLS 播放。</strong><p>请使用支持 HLS 的浏览器，或直接打开源链接。</p></div>`;
        }
      } catch (err) {
        video.outerHTML = `<div class="search-panel"><strong>播放器初始化失败。</strong><p>请稍后刷新重试。</p></div>`;
      }
    }
  }

  ready(() => {
    initMobileNav();
    initSearchForms();
    initHeroCarousel();
    initLocalFiltering();
    initSearchPage();
    initVideoPlayers();
  });
})();
