(function () {
  function ready(callback) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback);
      return;
    }

    callback();
  }

  function setupNavigation() {
    var toggle = document.querySelector("[data-nav-toggle]");
    var menu = document.querySelector("[data-nav-menu]");

    if (!toggle || !menu) {
      return;
    }

    toggle.addEventListener("click", function () {
      menu.classList.toggle("is-open");
    });
  }

  function setupHero() {
    var hero = document.querySelector("[data-hero]");

    if (!hero) {
      return;
    }

    var slides = Array.prototype.slice.call(hero.querySelectorAll(".hero-slide"));
    var dots = Array.prototype.slice.call(hero.querySelectorAll("[data-hero-dot]"));
    var current = 0;
    var timer = null;

    function show(index) {
      current = (index + slides.length) % slides.length;

      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle("is-active", slideIndex === current);
      });

      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle("is-active", dotIndex === current);
      });
    }

    function start() {
      stop();
      timer = window.setInterval(function () {
        show(current + 1);
      }, 5600);
    }

    function stop() {
      if (timer) {
        window.clearInterval(timer);
        timer = null;
      }
    }

    dots.forEach(function (dot) {
      dot.addEventListener("click", function () {
        var index = Number(dot.getAttribute("data-hero-dot"));
        show(index);
        start();
      });
    });

    hero.addEventListener("mouseenter", stop);
    hero.addEventListener("mouseleave", start);
    show(0);
    start();
  }

  function cardText(card) {
    return [
      card.getAttribute("data-title"),
      card.getAttribute("data-region"),
      card.getAttribute("data-genre"),
      card.getAttribute("data-type"),
      card.getAttribute("data-year"),
      card.textContent
    ].join(" ").toLowerCase();
  }

  function setupFilters() {
    var inputs = Array.prototype.slice.call(document.querySelectorAll("[data-movie-search]"));
    var pills = Array.prototype.slice.call(document.querySelectorAll("[data-filter]"));
    var cards = Array.prototype.slice.call(document.querySelectorAll(".movie-card, .movie-row"));
    var activeFilter = "all";

    if (!cards.length) {
      return;
    }

    var url = new URL(window.location.href);
    var queryValue = url.searchParams.get("q") || "";

    inputs.forEach(function (input) {
      input.value = queryValue;
    });

    function currentQuery() {
      var value = "";
      inputs.forEach(function (input) {
        if (input.value.trim()) {
          value = input.value.trim();
        }
      });
      return value.toLowerCase();
    }

    function apply() {
      var query = currentQuery();
      var filter = activeFilter.toLowerCase();

      cards.forEach(function (card) {
        var haystack = cardText(card);
        var matchesQuery = !query || haystack.indexOf(query) !== -1;
        var matchesFilter = filter === "all" || haystack.indexOf(filter) !== -1;
        card.classList.toggle("is-hidden", !(matchesQuery && matchesFilter));
      });
    }

    inputs.forEach(function (input) {
      input.addEventListener("input", apply);
    });

    pills.forEach(function (pill) {
      pill.addEventListener("click", function () {
        activeFilter = pill.getAttribute("data-filter") || "all";
        pills.forEach(function (item) {
          item.classList.toggle("is-active", item === pill);
        });
        apply();
      });
    });

    if (pills.length) {
      pills[0].classList.add("is-active");
    }

    apply();
  }

  ready(function () {
    setupNavigation();
    setupHero();
    setupFilters();
  });
})();
