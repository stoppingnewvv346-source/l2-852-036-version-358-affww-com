(function () {
  var video = document.querySelector('[data-player-video]');
  var wrap = document.querySelector('[data-player-wrap]');
  var button = document.querySelector('[data-player-button]');

  if (!video) {
    return;
  }

  var streamUrl = video.getAttribute('data-stream');
  var started = false;
  var hlsInstance = null;

  function attachStream() {
    if (started || !streamUrl) {
      return;
    }

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = streamUrl;
      started = true;
      return;
    }

    if (window.Hls && window.Hls.isSupported()) {
      hlsInstance = new window.Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90
      });
      hlsInstance.loadSource(streamUrl);
      hlsInstance.attachMedia(video);
      started = true;
    }
  }

  function playVideo() {
    attachStream();
    var promise = video.play();
    if (promise && typeof promise.catch === 'function') {
      promise.catch(function () {});
    }
  }

  if (button) {
    button.addEventListener('click', playVideo);
  }

  video.addEventListener('play', function () {
    if (wrap) {
      wrap.classList.add('playing');
    }
  });

  video.addEventListener('pause', function () {
    if (wrap) {
      wrap.classList.remove('playing');
    }
  });

  video.addEventListener('ended', function () {
    if (wrap) {
      wrap.classList.remove('playing');
    }
  });

  video.addEventListener('click', function () {
    if (video.paused) {
      playVideo();
    }
  });

  window.addEventListener('beforeunload', function () {
    if (hlsInstance) {
      hlsInstance.destroy();
    }
  });
})();
