(function () {
  function qs(selector, root) {
    return (root || document).querySelector(selector);
  }

  function qsa(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  function safeText(value) {
    return String(value || '').replace(/[&<>"']/g, function (char) {
      return {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      }[char];
    });
  }

  function setupMenu() {
    var toggle = qs('[data-menu-toggle]');
    var nav = qs('[data-mobile-nav]');
    if (!toggle || !nav) {
      return;
    }
    toggle.addEventListener('click', function () {
      nav.classList.toggle('is-open');
    });
  }

  function setupForms() {
    qsa('[data-search-form]').forEach(function (form) {
      form.addEventListener('submit', function (event) {
        var input = qs('input[name="q"]', form);
        if (!input || !input.value.trim()) {
          event.preventDefault();
          return;
        }
        input.value = input.value.trim();
      });
    });
  }

  function setupHero() {
    var hero = qs('[data-hero]');
    if (!hero) {
      return;
    }
    var slides = qsa('[data-hero-slide]', hero);
    var dots = qsa('[data-hero-dot]', hero);
    var prev = qs('[data-hero-prev]', hero);
    var next = qs('[data-hero-next]', hero);
    var index = 0;
    var timer;

    function show(nextIndex) {
      if (!slides.length) {
        return;
      }
      index = (nextIndex + slides.length) % slides.length;
      slides.forEach(function (slide, pos) {
        slide.classList.toggle('is-active', pos === index);
      });
      dots.forEach(function (dot, pos) {
        dot.classList.toggle('is-active', pos === index);
      });
    }

    function run() {
      clearInterval(timer);
      timer = setInterval(function () {
        show(index + 1);
      }, 5000);
    }

    if (prev) {
      prev.addEventListener('click', function () {
        show(index - 1);
        run();
      });
    }

    if (next) {
      next.addEventListener('click', function () {
        show(index + 1);
        run();
      });
    }

    dots.forEach(function (dot) {
      dot.addEventListener('click', function () {
        show(Number(dot.getAttribute('data-hero-dot')) || 0);
        run();
      });
    });

    show(0);
    run();
  }

  function setupFilter() {
    var input = qs('[data-filter-input]');
    var list = qs('[data-filter-list]');
    if (!input || !list) {
      return;
    }
    var cards = qsa('[data-title]', list);
    input.addEventListener('input', function () {
      var term = input.value.trim().toLowerCase();
      cards.forEach(function (card) {
        var haystack = (card.getAttribute('data-title') + ' ' + card.getAttribute('data-meta')).toLowerCase();
        card.classList.toggle('is-hidden-by-filter', term && haystack.indexOf(term) === -1);
      });
    });
  }

  function renderSearchItem(item) {
    return [
      '<article class="list-card">',
      '  <a href="' + safeText(item.url) + '">',
      '    <div class="list-poster"><img src="' + safeText(item.cover) + '" alt="' + safeText(item.title) + '" loading="lazy" onerror="this.style.display=\'none\'"></div>',
      '    <div class="list-body">',
      '      <h2>' + safeText(item.title) + '</h2>',
      '      <p>' + safeText(item.oneLine) + '</p>',
      '      <div class="meta-tags"><span>' + safeText(item.region) + '</span><span>' + safeText(item.year) + '</span><span>' + safeText(item.category) + '</span></div>',
      '    </div>',
      '  </a>',
      '</article>'
    ].join('');
  }

  function setupSearchPage() {
    var results = qs('#searchResults');
    if (!results || typeof searchItems === 'undefined') {
      return;
    }
    var params = new URLSearchParams(window.location.search);
    var term = (params.get('q') || '').trim();
    var input = qs('[data-search-page-input]');
    if (input) {
      input.value = term;
    }
    if (!term) {
      results.innerHTML = '<div class="search-empty">请输入关键词搜索影片、题材、年份或地区。</div>';
      return;
    }
    var lower = term.toLowerCase();
    var matched = searchItems.filter(function (item) {
      return [item.title, item.region, item.year, item.genre, item.category, item.tags, item.oneLine].join(' ').toLowerCase().indexOf(lower) !== -1;
    }).slice(0, 120);
    if (!matched.length) {
      results.innerHTML = '<div class="search-empty">没有找到匹配内容。</div>';
      return;
    }
    results.innerHTML = matched.map(renderSearchItem).join('');
  }

  function setupPlayer() {
    var video = qs('[data-player]');
    var overlay = qs('[data-play-overlay]');
    if (!video) {
      return;
    }
    var sourceNode = qs('source', video);
    var stream = sourceNode ? sourceNode.getAttribute('src') : video.getAttribute('data-stream');
    var attached = false;

    function attach() {
      if (attached || !stream) {
        return;
      }
      if (window.Hls && window.Hls.isSupported()) {
        var hls = new window.Hls({ enableWorker: true });
        hls.attachMedia(video);
        hls.on(window.Hls.Events.MEDIA_ATTACHED, function () {
          hls.loadSource(stream);
        });
      } else {
        video.src = stream;
      }
      attached = true;
    }

    function start() {
      attach();
      if (overlay) {
        overlay.classList.add('is-hidden');
      }
      video.controls = true;
      var playPromise = video.play();
      if (playPromise && playPromise.catch) {
        playPromise.catch(function () {
          if (overlay) {
            overlay.classList.remove('is-hidden');
          }
        });
      }
    }

    if (overlay) {
      overlay.addEventListener('click', start);
    }
    video.addEventListener('click', function () {
      if (video.paused) {
        start();
      }
    });
    video.addEventListener('play', function () {
      if (overlay) {
        overlay.classList.add('is-hidden');
      }
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    setupMenu();
    setupForms();
    setupHero();
    setupFilter();
    setupSearchPage();
    setupPlayer();
  });
})();
