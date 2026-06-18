(function () {
  const body = document.body;
  const root = body ? body.getAttribute('data-root') || './' : './';

  function qs(selector, parent) {
    return (parent || document).querySelector(selector);
  }

  function qsa(selector, parent) {
    return Array.from((parent || document).querySelectorAll(selector));
  }

  function normalize(text) {
    return (text || '').toString().trim().toLowerCase();
  }

  function htmlEscape(text) {
    return (text || '').toString()
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  const toggle = qs('[data-menu-toggle]');
  const mobilePanel = qs('[data-mobile-panel]');
  if (toggle && mobilePanel) {
    toggle.addEventListener('click', function () {
      mobilePanel.classList.toggle('is-open');
    });
  }

  qsa('[data-search-form]').forEach(function (form) {
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      const input = form.querySelector('input[name="q"]');
      const query = input ? input.value.trim() : '';
      if (query) {
        window.location.href = root + 'search.html?q=' + encodeURIComponent(query);
      } else {
        window.location.href = root + 'search.html';
      }
    });
  });

  qsa('[data-hero]').forEach(function (hero) {
    const slides = qsa('.hero-slide', hero);
    const dots = qsa('.hero-dot', hero);
    if (!slides.length) {
      return;
    }
    let active = 0;
    let timer = null;

    function show(index) {
      active = (index + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle('is-active', slideIndex === active);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle('is-active', dotIndex === active);
      });
    }

    function start() {
      stop();
      timer = window.setInterval(function () {
        show(active + 1);
      }, 5000);
    }

    function stop() {
      if (timer) {
        window.clearInterval(timer);
      }
    }

    dots.forEach(function (dot, dotIndex) {
      dot.addEventListener('click', function () {
        show(dotIndex);
        start();
      });
    });

    hero.addEventListener('mouseenter', stop);
    hero.addEventListener('mouseleave', start);
    show(0);
    start();
  });

  function initPlayer(panel) {
    if (!panel || panel.dataset.ready === '1') {
      return;
    }
    const video = panel.querySelector('video');
    const source = panel.getAttribute('data-src');
    if (!video || !source) {
      return;
    }

    function playVideo() {
      const playPromise = video.play();
      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch(function () {
          video.controls = true;
        });
      }
      panel.classList.add('is-playing');
    }

    video.controls = true;
    if (window.Hls && window.Hls.isSupported()) {
      const hls = new window.Hls({
        enableWorker: true,
        lowLatencyMode: true
      });
      hls.loadSource(source);
      hls.attachMedia(video);
      hls.on(window.Hls.Events.MANIFEST_PARSED, playVideo);
      hls.on(window.Hls.Events.ERROR, function (_event, data) {
        if (data && data.fatal) {
          if (data.type === window.Hls.ErrorTypes.NETWORK_ERROR) {
            hls.startLoad();
          } else if (data.type === window.Hls.ErrorTypes.MEDIA_ERROR) {
            hls.recoverMediaError();
          } else {
            hls.destroy();
          }
        }
      });
      panel._hls = hls;
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = source;
      video.addEventListener('loadedmetadata', playVideo, { once: true });
      video.load();
    } else {
      video.src = source;
      playVideo();
    }
    panel.dataset.ready = '1';
  }

  qsa('[data-play-trigger]').forEach(function (button) {
    button.addEventListener('click', function () {
      initPlayer(button.closest('[data-player]') || document.querySelector('[data-player]'));
    });
  });

  qsa('[data-filter-panel]').forEach(function (panel) {
    const scope = document.querySelector(panel.getAttribute('data-filter-panel')) || document;
    const input = qs('[data-filter-keyword]', panel);
    const year = qs('[data-filter-year]', panel);
    const type = qs('[data-filter-type]', panel);
    const note = qs('[data-filter-note]', panel);
    const cards = qsa('[data-title]', scope);

    function applyFilter() {
      const keyword = normalize(input && input.value);
      const selectedYear = year ? year.value : '';
      const selectedType = type ? type.value : '';
      let visible = 0;

      cards.forEach(function (card) {
        const haystack = normalize([
          card.getAttribute('data-title'),
          card.getAttribute('data-region'),
          card.getAttribute('data-type'),
          card.getAttribute('data-tags'),
          card.getAttribute('data-year')
        ].join(' '));
        const matchKeyword = !keyword || haystack.indexOf(keyword) !== -1;
        const matchYear = !selectedYear || card.getAttribute('data-year') === selectedYear;
        const matchType = !selectedType || card.getAttribute('data-type') === selectedType;
        const show = matchKeyword && matchYear && matchType;
        card.classList.toggle('hidden-by-filter', !show);
        if (show) {
          visible += 1;
        }
      });

      if (note) {
        note.textContent = '当前显示 ' + visible + ' 部影片';
      }
    }

    [input, year, type].forEach(function (control) {
      if (control) {
        control.addEventListener('input', applyFilter);
        control.addEventListener('change', applyFilter);
      }
    });
    qsa('button', panel).forEach(function (button) {
      button.addEventListener('click', applyFilter);
    });
    applyFilter();
  });

  const searchPage = qs('[data-search-page]');
  if (searchPage && window.SITE_MOVIES) {
    const params = new URLSearchParams(window.location.search);
    const queryInput = qs('[data-main-search]', searchPage);
    const typeSelect = qs('[data-main-type]', searchPage);
    const yearSelect = qs('[data-main-year]', searchPage);
    const regionSelect = qs('[data-main-region]', searchPage);
    const results = qs('[data-search-results]', searchPage);
    const summary = qs('[data-search-summary]', searchPage);
    const initialQuery = params.get('q') || '';

    if (queryInput) {
      queryInput.value = initialQuery;
    }

    const movies = window.SITE_MOVIES;
    const years = Array.from(new Set(movies.map(function (movie) { return movie.year; }).filter(Boolean))).sort().reverse();
    const regions = Array.from(new Set(movies.map(function (movie) { return movie.region; }).filter(Boolean))).sort();
    const types = Array.from(new Set(movies.map(function (movie) { return movie.type; }).filter(Boolean))).sort();

    function fillSelect(select, values, label) {
      if (!select) {
        return;
      }
      select.innerHTML = '<option value="">' + label + '</option>' + values.map(function (value) {
        return '<option value="' + htmlEscape(value) + '">' + htmlEscape(value) + '</option>';
      }).join('');
    }

    fillSelect(yearSelect, years, '全部年份');
    fillSelect(regionSelect, regions, '全部地区');
    fillSelect(typeSelect, types, '全部类型');

    function render() {
      const q = normalize(queryInput && queryInput.value);
      const selectedType = typeSelect ? typeSelect.value : '';
      const selectedYear = yearSelect ? yearSelect.value : '';
      const selectedRegion = regionSelect ? regionSelect.value : '';

      let list = movies.filter(function (movie) {
        const haystack = normalize([
          movie.title,
          movie.region,
          movie.type,
          movie.year,
          movie.genreRaw,
          movie.oneLine,
          (movie.tags || []).join(' ')
        ].join(' '));
        return (!q || haystack.indexOf(q) !== -1)
          && (!selectedType || movie.type === selectedType)
          && (!selectedYear || movie.year === selectedYear)
          && (!selectedRegion || movie.region === selectedRegion);
      });

      if (!q && !selectedType && !selectedYear && !selectedRegion) {
        list = movies.slice(0, 48);
      }

      if (summary) {
        summary.textContent = '找到 ' + list.length + ' 部影片' + (q ? '：' + q : '');
      }

      if (!results) {
        return;
      }

      if (!list.length) {
        results.innerHTML = '<div class="empty-state">没有找到匹配影片，请调整关键词或筛选条件。</div>';
        return;
      }

      results.innerHTML = list.slice(0, 240).map(function (movie) {
        const tags = (movie.tags || []).slice(0, 3).map(function (tag) {
          return '<span>' + htmlEscape(tag) + '</span>';
        }).join('');
        return ''
          + '<a class="movie-card" href="video/' + htmlEscape(movie.id) + '.html">'
          + '  <div class="movie-cover">'
          + '    <div class="poster-shell" data-fallback="' + htmlEscape(movie.title.slice(0, 6)) + '">'
          + '      <img src="' + htmlEscape(movie.coverNum) + '.jpg" alt="' + htmlEscape(movie.title) + ' 封面" class="poster-image" loading="lazy" onerror="this.closest(\'.poster-shell\').classList.add(\'image-missing\'); this.remove();">'
          + '    </div>'
          + '    <span class="movie-duration">' + htmlEscape(movie.duration) + '</span>'
          + '  </div>'
          + '  <div class="movie-info">'
          + '    <h3>' + htmlEscape(movie.title) + '</h3>'
          + '    <p class="movie-meta">' + htmlEscape(movie.region) + ' · ' + htmlEscape(movie.year) + ' · ' + htmlEscape(movie.type) + '</p>'
          + '    <p class="movie-desc">' + htmlEscape(movie.oneLine) + '</p>'
          + '    <div class="tag-row">' + tags + '</div>'
          + '  </div>'
          + '</a>';
      }).join('');
    }

    [queryInput, typeSelect, yearSelect, regionSelect].forEach(function (control) {
      if (control) {
        control.addEventListener('input', render);
        control.addEventListener('change', render);
      }
    });
    render();
  }
})();
