(function () {
  function attachVideo(video, srcUrl) {
    var nativeType = "application/vnd.apple.mpegurl";

    if (video.canPlayType(nativeType)) {
      video.src = srcUrl;
      return null;
    }

    if (window.Hls && window.Hls.isSupported()) {
      var hls = new window.Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 60
      });

      hls.loadSource(srcUrl);
      hls.attachMedia(video);
      return hls;
    }

    video.src = srcUrl;
    return null;
  }

  window.initMoviePlayer = function (videoId, srcUrl, overlayId) {
    var video = document.getElementById(videoId);
    var overlay = document.getElementById(overlayId);
    var attached = false;
    var hlsInstance = null;

    if (!video) {
      return;
    }

    function hideOverlay() {
      if (overlay) {
        overlay.classList.add("is-hidden");
      }
    }

    function showOverlay() {
      if (overlay) {
        overlay.classList.remove("is-hidden");
      }
    }

    function start() {
      if (!attached) {
        hlsInstance = attachVideo(video, srcUrl);
        attached = true;
      }

      hideOverlay();

      var playPromise = video.play();

      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch(function () {
          showOverlay();
        });
      }
    }

    if (overlay) {
      overlay.addEventListener("click", start);
    }

    video.addEventListener("click", function () {
      if (!attached) {
        start();
      }
    });

    video.addEventListener("play", hideOverlay);
    video.addEventListener("ended", showOverlay);

    window.addEventListener("pagehide", function () {
      if (hlsInstance && typeof hlsInstance.destroy === "function") {
        hlsInstance.destroy();
      }
    });
  };
})();
