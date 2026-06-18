(function () {
  function ready(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn);
    } else {
      fn();
    }
  }

  function normalize(value) {
    return String(value || "").trim().toLowerCase();
  }

  function uniqueValues(cards, key) {
    var values = [];
    cards.forEach(function (card) {
      var value = card.getAttribute(key) || "";
      if (value && values.indexOf(value) === -1) {
        values.push(value);
      }
    });
    return values.sort();
  }

  function fillSelect(select, values) {
    if (!select) {
      return;
    }
    values.forEach(function (value) {
      var option = document.createElement("option");
      option.value = value;
      option.textContent = value;
      select.appendChild(option);
    });
  }

  function yearMatch(cardYear, selected) {
    if (!selected || selected === "全部年份") {
      return true;
    }
    var year = parseInt(cardYear, 10);
    if (selected === "2010-2019") {
      return year >= 2010 && year <= 2019;
    }
    if (selected === "2000-2009") {
      return year >= 2000 && year <= 2009;
    }
    if (selected === "更早") {
      return year > 0 && year < 2000;
    }
    return cardYear === selected;
  }

  function initFilters() {
    var panel = document.querySelector("[data-filter-panel]");
    if (!panel) {
      return;
    }
    var cards = Array.prototype.slice.call(document.querySelectorAll(".movie-card, .horizontal-card"));
    var input = panel.querySelector("[data-search-input]");
    var region = panel.querySelector("[data-filter-region]");
    var type = panel.querySelector("[data-filter-type]");
    var year = panel.querySelector("[data-filter-year]");
    fillSelect(region, uniqueValues(cards, "data-region"));
    fillSelect(type, uniqueValues(cards, "data-type"));
    var params = new URLSearchParams(window.location.search);
    var query = params.get("q") || "";
    if (input && query) {
      input.value = query;
    }
    function apply() {
      var q = normalize(input ? input.value : "");
      var r = region ? region.value : "";
      var t = type ? type.value : "";
      var y = year ? year.value : "";
      cards.forEach(function (card) {
        var haystack = normalize([
          card.getAttribute("data-title"),
          card.getAttribute("data-region"),
          card.getAttribute("data-type"),
          card.getAttribute("data-year"),
          card.getAttribute("data-genre"),
          card.getAttribute("data-tags")
        ].join(" "));
        var keep = (!q || haystack.indexOf(q) !== -1)
          && (!r || card.getAttribute("data-region") === r)
          && (!t || card.getAttribute("data-type") === t)
          && yearMatch(card.getAttribute("data-year"), y);
        card.classList.toggle("is-hidden", !keep);
      });
    }
    [input, region, type, year].forEach(function (node) {
      if (node) {
        node.addEventListener("input", apply);
        node.addEventListener("change", apply);
      }
    });
    apply();
  }

  function initHero() {
    var slides = Array.prototype.slice.call(document.querySelectorAll("[data-hero-slide]"));
    if (slides.length <= 1) {
      return;
    }
    var dots = Array.prototype.slice.call(document.querySelectorAll("[data-hero-dot]"));
    var prev = document.querySelector("[data-hero-prev]");
    var next = document.querySelector("[data-hero-next]");
    var index = 0;
    function show(target) {
      index = (target + slides.length) % slides.length;
      slides.forEach(function (slide, pos) {
        slide.classList.toggle("is-active", pos === index);
      });
      dots.forEach(function (dot, pos) {
        dot.classList.toggle("is-active", pos === index);
      });
    }
    dots.forEach(function (dot) {
      dot.addEventListener("click", function () {
        show(parseInt(dot.getAttribute("data-hero-dot"), 10) || 0);
      });
    });
    if (prev) {
      prev.addEventListener("click", function () {
        show(index - 1);
      });
    }
    if (next) {
      next.addEventListener("click", function () {
        show(index + 1);
      });
    }
    setInterval(function () {
      show(index + 1);
    }, 5000);
  }

  function initMenu() {
    var button = document.querySelector(".menu-toggle");
    var panel = document.querySelector(".mobile-panel");
    if (!button || !panel) {
      return;
    }
    button.addEventListener("click", function () {
      var open = panel.hasAttribute("hidden");
      if (open) {
        panel.removeAttribute("hidden");
      } else {
        panel.setAttribute("hidden", "");
      }
      button.setAttribute("aria-expanded", String(open));
    });
  }

  ready(function () {
    initMenu();
    initHero();
    initFilters();
  });
})();
