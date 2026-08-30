/* ==========================================================================
   LEHA NEPLOXO — interactions: i18n, nav, reveal, cursor, video, transitions
   ========================================================================== */

(function () {
  "use strict";

  var LANGS = ["ua", "ru", "en"];
  var DEFAULT_LANG = "ru";

  /* ---------------------------------------------------------------- utils */

  function qs(sel, ctx) { return (ctx || document).querySelector(sel); }
  function qsa(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }

  function detectLang() {
    try {
      var saved = localStorage.getItem("leha_lang");
      if (saved && LANGS.indexOf(saved) !== -1) return saved;
    } catch (e) {}
    var nav = (navigator.language || "").toLowerCase();
    if (nav.indexOf("uk") === 0) return "ua";
    if (nav.indexOf("ru") === 0) return "ru";
    if (nav.indexOf("en") === 0) return "en";
    return DEFAULT_LANG;
  }

  function prefersReducedMotion() {
    return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  /* Only true data-saver / genuinely constrained devices skip the heavy
     background video — a quad-core laptop is completely mainstream and
     must not be treated as "low power". */
  function isLowPower() {
    var mem = navigator.deviceMemory;
    var saveData = navigator.connection && navigator.connection.saveData;
    return !!saveData || (mem && mem <= 2);
  }

  /* ---------------------------------------------------------------- i18n */

  var state = { lang: detectLang() };

  function t(key) {
    var dict = window.SITE_I18N[state.lang] || window.SITE_I18N[DEFAULT_LANG];
    return (dict && dict[key]) || (window.SITE_I18N[DEFAULT_LANG] || {})[key] || key;
  }
  window.t = t;

  function applyTranslations() {
    document.documentElement.setAttribute("lang", state.lang === "ua" ? "uk" : state.lang);
    qsa("[data-i18n]").forEach(function (el) {
      var key = el.getAttribute("data-i18n");
      el.textContent = t(key);
    });
    qsa("[data-i18n-attr]").forEach(function (el) {
      var pairs = el.getAttribute("data-i18n-attr").split(",");
      pairs.forEach(function (pair) {
        var parts = pair.split(":");
        var attr = parts[0].trim();
        var key = parts[1].trim();
        el.setAttribute(attr, t(key));
      });
    });
    qsa(".lang-switch__menu button").forEach(function (b) {
      b.classList.toggle("is-active", b.getAttribute("data-lang") === state.lang);
    });
    qsa("[data-lang-current]").forEach(function (el) { el.textContent = state.lang.toUpperCase(); });
    document.dispatchEvent(new CustomEvent("leha:i18n", { detail: { lang: state.lang } }));
  }

  function setLang(lang) {
    if (LANGS.indexOf(lang) === -1) return;
    state.lang = lang;
    try { localStorage.setItem("leha_lang", lang); } catch (e) {}
    applyTranslations();
  }
  window.setLang = setLang;

  /* ---------------------------------------------------------- boot flags */

  document.addEventListener("DOMContentLoaded", function () {
    if (prefersReducedMotion() || isLowPower()) {
      document.body.classList.add("reduce-fx");
    }

    applyTranslations();
    initIntro();
    initNav();
    initMobileMenu();
    initLangSwitch();
    initReveal();
    initCursor();
    initHeroVideo();
    initTilt();
    initCardVideos();
    initLightbox();
    initSupportToast();
    initPageTransitions();
    initFooterYear();
    if (typeof window.renderProjects === "function") window.renderProjects();
    if (typeof window.renderProjectPage === "function") window.renderProjectPage();
  });

  /* ------------------------------------------------------------- intro */

  function initIntro() {
    var intro = qs(".intro");
    if (!intro) return;
    var delay = prefersReducedMotion() ? 300 : 2100;
    setTimeout(function () {
      intro.classList.add("is-done");
      document.body.classList.remove("no-scroll");
      setTimeout(function () { intro.remove(); }, 900);
    }, delay);
  }

  /* --------------------------------------------------------------- nav */

  function initNav() {
    var nav = qs(".nav");
    if (!nav) return;
    function onScroll() {
      nav.classList.toggle("is-scrolled", window.scrollY > 20);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    var sections = qsa("main section[id]");
    var links = qsa(".nav__links a, .mmenu__links a");
    if (sections.length && "IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var id = entry.target.id;
          links.forEach(function (a) {
            a.classList.toggle("is-active", a.getAttribute("href") === "#" + id);
          });
        });
      }, { rootMargin: "-45% 0px -50% 0px" });
      sections.forEach(function (s) { io.observe(s); });
    }
  }

  /* ------------------------------------------------------- mobile menu */

  function initMobileMenu() {
    var burger = qs(".burger");
    var menu = qs(".mmenu");
    if (!burger || !menu) return;
    function close() {
      burger.classList.remove("is-open");
      menu.classList.remove("is-open");
      document.body.classList.remove("no-scroll");
    }
    burger.addEventListener("click", function () {
      var open = burger.classList.toggle("is-open");
      menu.classList.toggle("is-open", open);
      document.body.classList.toggle("no-scroll", open);
    });
    qsa("a, button", menu).forEach(function (el) { el.addEventListener("click", close); });
  }

  /* -------------------------------------------------------- lang menu */

  function initLangSwitch() {
    qsa(".lang-switch").forEach(function (root) {
      var btn = qs(".lang-switch__btn", root);
      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        root.classList.toggle("is-open");
      });
    });
    document.addEventListener("click", function () {
      qsa(".lang-switch.is-open").forEach(function (r) { r.classList.remove("is-open"); });
    });
    /* any [data-lang] button anywhere on the page (dropdown, mobile menu, footer) */
    qsa("[data-lang]").forEach(function (b) {
      b.addEventListener("click", function () {
        setLang(b.getAttribute("data-lang"));
        var root = b.closest(".lang-switch");
        if (root) root.classList.remove("is-open");
      });
    });
  }

  /* ------------------------------------------------------------ reveal */

  function initReveal() {
    var els = qsa("[data-reveal]");
    if (!els.length) return;
    if (!("IntersectionObserver" in window)) {
      els.forEach(function (el) { el.classList.add("is-visible"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -8% 0px" });
    els.forEach(function (el) { io.observe(el); });
  }

  /* ------------------------------------------------------------ cursor */

  function initCursor() {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    var dot = document.createElement("div");
    var ring = document.createElement("div");
    dot.className = "cursor-dot";
    ring.className = "cursor-ring";
    document.body.appendChild(dot);
    document.body.appendChild(ring);
    var mx = 0, my = 0, rx = 0, ry = 0;
    window.addEventListener("mousemove", function (e) {
      mx = e.clientX; my = e.clientY;
      dot.style.transform = "translate(" + mx + "px," + my + "px) translate(-50%,-50%)";
    });
    (function loop() {
      rx += (mx - rx) * 0.18;
      ry += (my - ry) * 0.18;
      ring.style.transform = "translate(" + rx + "px," + ry + "px) translate(-50%,-50%)";
      requestAnimationFrame(loop);
    })();
    var hoverables = "a, button, .pcard, .scard, [data-cursor-hover]";
    document.addEventListener("mouseover", function (e) {
      if (e.target.closest && e.target.closest(hoverables)) ring.classList.add("is-hover");
    });
    document.addEventListener("mouseout", function (e) {
      if (e.target.closest && e.target.closest(hoverables)) ring.classList.remove("is-hover");
    });
  }

  /* -------------------------------------------------------- hero video */

  function initHeroVideo() {
    qsa("video[data-bgvideo]").forEach(function (video) {
      if (isLowPower() || prefersReducedMotion()) {
        video.removeAttribute("autoplay");
        video.preload = "none";
        video.querySelectorAll("source").forEach(function (s) { s.removeAttribute("src"); });
        video.load();
        return;
      }
      video.addEventListener("canplay", function () { video.classList.add("is-ready"); });
      var playPromise = video.play();
      if (playPromise && playPromise.catch) playPromise.catch(function () {});
    });
  }

  /* ----------------------------------------------------- tilt / glow fx */

  function initTilt() {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    qsa(".pcard, .scard").forEach(function (card) {
      card.addEventListener("mousemove", function (e) {
        var r = card.getBoundingClientRect();
        card.style.setProperty("--mx", ((e.clientX - r.left) / r.width * 100) + "%");
        card.style.setProperty("--my", ((e.clientY - r.top) / r.height * 100) + "%");
      });
    });
  }

  /* --------------------------------------------------- card hover video */

  function initCardVideos() {
    if (isLowPower()) return;
    document.addEventListener("mouseover", function (e) {
      var card = e.target.closest && e.target.closest(".pcard");
      if (!card) return;
      var video = qs(".pcard__media video", card);
      if (video) { video.play().catch(function () {}); }
    });
    document.addEventListener("mouseout", function (e) {
      var card = e.target.closest && e.target.closest(".pcard");
      if (!card) return;
      var video = qs(".pcard__media video", card);
      if (video) { video.pause(); video.currentTime = 0; }
    });
  }

  /* -------------------------------------------------------- lightbox */

  function initLightbox() {
    var lightbox = qs(".lightbox");
    if (!lightbox) return;
    var lbVideo = qs("video", lightbox);
    var closeBtn = qs(".lightbox__close", lightbox);

    function open(src) {
      lbVideo.src = src;
      lightbox.classList.add("is-open");
      document.body.classList.add("no-scroll");
      lbVideo.play().catch(function () {});
    }
    function close() {
      lightbox.classList.remove("is-open");
      document.body.classList.remove("no-scroll");
      lbVideo.pause();
    }
    qsa("[data-open-video]").forEach(function (trigger) {
      trigger.addEventListener("click", function (e) {
        e.preventDefault();
        open(trigger.getAttribute("data-open-video"));
      });
    });
    closeBtn.addEventListener("click", close);
    lightbox.addEventListener("click", function (e) { if (e.target === lightbox) close(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") close(); });
  }

  /* -------------------------------------------------------- support cta */

  function initSupportToast() {
    var toast = qs(".toast");
    var btn = qs("[data-support-cta]");
    if (!toast || !btn) return;
    var timer;
    btn.addEventListener("click", function () {
      toast.textContent = t("support.toast");
      toast.classList.add("is-visible");
      clearTimeout(timer);
      timer = setTimeout(function () { toast.classList.remove("is-visible"); }, 2600);
    });
  }

  /* --------------------------------------------------- page transitions */

  function initPageTransitions() {
    var overlay = qs(".page-fade");
    if (!overlay) return;
    document.addEventListener("click", function (e) {
      var a = e.target.closest && e.target.closest("a[href]");
      if (!a) return;
      var href = a.getAttribute("href");
      if (!href || href.charAt(0) === "#" || a.target === "_blank" || a.hasAttribute("data-open-video")) return;
      if (href.indexOf("http") === 0 || href.indexOf("mailto:") === 0) return;
      e.preventDefault();
      overlay.classList.add("is-active");
      setTimeout(function () { window.location.href = href; }, 420);
    });
    window.addEventListener("pageshow", function () { overlay.classList.remove("is-active"); });
  }

  /* -------------------------------------------------------------- misc */

  function initFooterYear() {
    var el = qs("[data-year]");
    if (el) el.textContent = new Date().getFullYear();
  }
})();
