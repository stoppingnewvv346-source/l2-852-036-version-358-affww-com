(function () {
  function qs(selector, root) {
    return (root || document).querySelector(selector);
  }

  function qsa(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  var toggle = qs('[data-nav-toggle]');
  var panel = qs('[data-mobile-panel]');
  if (toggle && panel) {
    toggle.addEventListener('click', function () {
      panel.classList.toggle('open');
    });
  }

  var hero = qs('[data-hero]');
  if (hero) {
    var slides = qsa('[data-hero-slide]', hero);
    var dots = qsa('[data-hero-dot]', hero);
    var index = 0;
    var timer = null;

    function show(next) {
      if (!slides.length) {
        return;
      }
      index = (next + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        slide.classList.toggle('active', i === index);
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle('active', i === index);
      });
    }

    function start() {
      stop();
      timer = window.setInterval(function () {
        show(index + 1);
      }, 5000);
    }

    function stop() {
      if (timer) {
        window.clearInterval(timer);
      }
    }

    var prev = qs('[data-hero-prev]', hero);
    var next = qs('[data-hero-next]', hero);
    if (prev) {
      prev.addEventListener('click', function () {
        show(index - 1);
        start();
      });
    }
    if (next) {
      next.addEventListener('click', function () {
        show(index + 1);
        start();
      });
    }
    dots.forEach(function (dot, i) {
      dot.addEventListener('click', function () {
        show(i);
        start();
      });
    });
    hero.addEventListener('mouseenter', stop);
    hero.addEventListener('mouseleave', start);
    show(0);
    start();
  }

  qsa('[data-filter-scope]').forEach(function (scope) {
    var input = qs('[data-filter-search]', scope);
    var type = qs('[data-filter-type]', scope);
    var region = qs('[data-filter-region]', scope);
    var year = qs('[data-filter-year]', scope);
    var cards = qsa('[data-movie-card]', scope);

    function valueOf(el) {
      return el ? String(el.value || '').trim().toLowerCase() : '';
    }

    function apply() {
      var text = valueOf(input);
      var typeValue = valueOf(type);
      var regionValue = valueOf(region);
      var yearValue = valueOf(year);

      cards.forEach(function (card) {
        var haystack = String(card.getAttribute('data-search') || '').toLowerCase();
        var cardType = String(card.getAttribute('data-type') || '').toLowerCase();
        var cardRegion = String(card.getAttribute('data-region') || '').toLowerCase();
        var cardYear = String(card.getAttribute('data-year') || '').toLowerCase();
        var visible = true;

        if (text && haystack.indexOf(text) === -1) {
          visible = false;
        }
        if (typeValue && cardType.indexOf(typeValue) === -1) {
          visible = false;
        }
        if (regionValue && cardRegion.indexOf(regionValue) === -1) {
          visible = false;
        }
        if (yearValue && cardYear !== yearValue) {
          visible = false;
        }
        card.classList.toggle('hidden-card', !visible);
      });
    }

    [input, type, region, year].forEach(function (el) {
      if (el) {
        el.addEventListener('input', apply);
        el.addEventListener('change', apply);
      }
    });
  });

  qsa('[data-player]').forEach(function (player) {
    var video = qs('video', player);
    var overlay = qs('[data-play-overlay]', player);
    var message = qs('[data-player-message]', player);
    var ready = false;
    var hlsInstance = null;

    function setMessage(text) {
      if (!message) {
        return;
      }
      message.textContent = text;
      message.classList.add('visible');
    }

    function hideOverlay() {
      if (overlay) {
        overlay.classList.add('hidden');
      }
    }

    function init() {
      if (!video) {
        return Promise.resolve();
      }
      if (ready) {
        return Promise.resolve();
      }
      var src = video.getAttribute('data-video-url');
      if (!src) {
        setMessage('暂时无法加载视频');
        return Promise.resolve();
      }
      ready = true;
      if (window.Hls && window.Hls.isSupported()) {
        hlsInstance = new window.Hls({
          enableWorker: true,
          lowLatencyMode: true
        });
        hlsInstance.loadSource(src);
        hlsInstance.attachMedia(video);
        hlsInstance.on(window.Hls.Events.ERROR, function (event, data) {
          if (!data || !data.fatal) {
            return;
          }
          if (data.type === window.Hls.ErrorTypes.NETWORK_ERROR) {
            setMessage('网络连接异常，正在重试');
            hlsInstance.startLoad();
          } else if (data.type === window.Hls.ErrorTypes.MEDIA_ERROR) {
            setMessage('媒体加载异常，正在恢复');
            hlsInstance.recoverMediaError();
          } else {
            setMessage('视频暂时无法播放');
          }
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = src;
      } else {
        setMessage('此浏览器暂不支持该视频格式');
      }
      return Promise.resolve();
    }

    function play() {
      init().then(function () {
        if (!video) {
          return;
        }
        hideOverlay();
        var attempt = video.play();
        if (attempt && typeof attempt.catch === 'function') {
          attempt.catch(function () {
            setMessage('点击视频控制栏开始观看');
          });
        }
      });
    }

    if (overlay) {
      overlay.addEventListener('click', play);
    }
    if (video) {
      video.addEventListener('play', hideOverlay);
      video.addEventListener('ended', function () {
        if (overlay) {
          overlay.classList.remove('hidden');
        }
      });
    }

    window.addEventListener('beforeunload', function () {
      if (hlsInstance) {
        hlsInstance.destroy();
      }
    });
  });
})();
