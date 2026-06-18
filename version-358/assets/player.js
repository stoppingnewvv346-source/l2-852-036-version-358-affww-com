(function () {
  function showMessage(message) {
    var box = document.getElementById("player-message");
    if (!box) {
      return;
    }
    box.textContent = message;
    box.hidden = false;
  }

  function hideCover() {
    var cover = document.getElementById("player-cover");
    if (cover) {
      cover.classList.add("is-hidden");
    }
  }

  function init(sourceUrl) {
    var video = document.getElementById("movie-player");
    var cover = document.getElementById("player-cover");
    if (!video || !sourceUrl) {
      return;
    }
    var loaded = false;
    var hlsInstance = null;

    function begin() {
      hideCover();
      var playPromise = video.play();
      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch(function () {
          showMessage("点击视频区域即可继续播放");
        });
      }
    }

    function load() {
      if (loaded) {
        begin();
        return;
      }
      loaded = true;
      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = sourceUrl;
        video.addEventListener("loadedmetadata", begin, { once: true });
        video.load();
        return;
      }
      if (window.Hls && window.Hls.isSupported()) {
        hlsInstance = new window.Hls({
          maxBufferLength: 30,
          enableWorker: true
        });
        hlsInstance.loadSource(sourceUrl);
        hlsInstance.attachMedia(video);
        hlsInstance.on(window.Hls.Events.MANIFEST_PARSED, begin);
        hlsInstance.on(window.Hls.Events.ERROR, function (eventName, data) {
          if (data && data.fatal) {
            showMessage("暂时无法加载，请稍后再试");
          }
        });
        return;
      }
      video.src = sourceUrl;
      video.addEventListener("loadedmetadata", begin, { once: true });
      video.load();
    }

    if (cover) {
      cover.addEventListener("click", load);
    }
    video.addEventListener("click", function () {
      if (!loaded) {
        load();
      } else if (video.paused) {
        begin();
      }
    });
    video.addEventListener("play", hideCover);
    window.addEventListener("beforeunload", function () {
      if (hlsInstance) {
        hlsInstance.destroy();
      }
    });
  }

  window.MoviePlayer = {
    init: init
  };
})();
