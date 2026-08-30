/* ==========================================================================
   LEHA NEPLOXO — project grid + project detail page rendering
   ========================================================================== */

(function () {
  "use strict";

  var ARROW = '<svg viewBox="0 0 24 24" fill="none"><path d="M5 19L19 5M19 5H8M19 5V16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  function mediaMarkup(project, cls) {
    if (project.cyberVisual) {
      return '<div class="' + cls + ' cyber-visual"><span class="cyber-visual__grid"></span><span class="cyber-visual__glyphs">01</span></div>';
    }
    if (project.video) {
      return '<video class="' + cls + '" src="' + project.video + '" poster="' + project.image + '" muted loop playsinline preload="metadata"></video>';
    }
    return '<img class="' + cls + '" src="' + project.image + '" alt="" loading="lazy">';
  }

  function cardHTML(project, i) {
    var title = window.t(project.titleKey);
    var category = window.t(project.categoryKey || "projects.card.category");
    var date = window.t(project.dateKey || "projects.card.date");
    var desc = window.t(project.descKey || "projects.card.desc");
    var badge = /^\d+$/.test(project.id) ? "0" + project.id : "";
    return (
      '<article class="pcard" data-reveal="scale" style="transition-delay:' + (i * 90) + 'ms">' +
        (badge ? '<div class="pcard__index">' + badge + '</div>' : "") +
        '<div class="pcard__media">' + mediaMarkup(project, "") + '</div>' +
        '<div class="pcard__glow"></div>' +
        '<div class="pcard__scrim"></div>' +
        '<div class="pcard__body">' +
          '<div class="pcard__meta"><span>' + category + '</span><span>' + date + '</span></div>' +
          '<h3 class="pcard__title">' + title + '</h3>' +
          '<p class="pcard__desc">' + desc + '</p>' +
          '<span class="pcard__cta">' + window.t("projects.card.cta") + ' ' + ARROW + '</span>' +
        '</div>' +
        '<a class="pcard__link" href="project.html?id=' + project.id + '" aria-label="' + title + '"></a>' +
      '</article>'
    );
  }

  window.renderProjects = function renderProjects() {
    var grid = document.querySelector("[data-projects-grid]");
    if (!grid || !window.SITE_PROJECTS) return;
    grid.innerHTML = window.SITE_PROJECTS.map(cardHTML).join("");
    reobserve(grid);
  };

  function reobserve(scope) {
    var els = Array.prototype.slice.call(scope.querySelectorAll("[data-reveal]"));
    if (!("IntersectionObserver" in window) || !els.length) {
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
    }, { threshold: 0.1, rootMargin: "0px 0px -8% 0px" });
    els.forEach(function (el) { io.observe(el); });
  }

  /* ------------------------------------------------------- world cards */

  function worldCardHTML(project, world, i) {
    var label = window.t("project.world.number") + " " + world.id;
    return (
      '<a class="wcard" data-reveal="scale" style="transition-delay:' + (i * 90) + 'ms" href="world.html?project=' + project.id + '&world=' + world.id + '">' +
        '<span class="wcard__visual"><span class="cyber-visual__grid"></span></span>' +
        '<span class="wcard__index">' + world.id + '</span>' +
        '<span class="wcard__body">' +
          '<span class="wcard__title">' + label + '</span>' +
          '<span class="wcard__cta">' + window.t("project.world.enter") + ' ' + ARROW + '</span>' +
        '</span>' +
      '</a>'
    );
  }

  /* ------------------------------------------------------- project page */

  window.renderProjectPage = function renderProjectPage() {
    var root = document.querySelector("[data-project-page]");
    if (!root) return;
    var id = new URLSearchParams(window.location.search).get("id");
    var project = (window.SITE_PROJECTS || []).find(function (p) { return p.id === id; });

    if (!project) {
      root.innerHTML =
        '<div class="notfound wrap">' +
          '<div class="eyebrow">404</div>' +
          '<h1 class="section-title">' + window.t("project.notfound.title") + '</h1>' +
          '<p class="section-sub">' + window.t("project.notfound.text") + '</p>' +
          '<a class="btn btn--primary" style="margin-top:28px" href="index.html#projects">' + window.t("project.notfound.cta") + '</a>' +
        '</div>';
      return;
    }

    var title = window.t(project.titleKey);
    var category = window.t(project.categoryKey || "projects.card.category");
    var date = window.t(project.dateKey || "projects.card.date");
    var about = window.t(project.descLongKey || project.descKey || "project.placeholder");
    document.title = title + " — LEHA NEPLOXO";

    var worldsSection = "";
    if (project.worlds && project.worlds.length) {
      worldsSection =
        '<section class="section wrap" style="padding-top:0">' +
          '<div class="section-head" data-reveal>' +
            '<div class="eyebrow">' + window.t("project.worlds.label") + '</div>' +
            '<h2 class="section-title">' + window.t("project.worlds.title") + '</h2>' +
            '<p class="section-sub">' + window.t("project.worlds.sub") + '</p>' +
          '</div>' +
          '<div class="worlds__grid">' +
            project.worlds.map(function (w, i) { return worldCardHTML(project, w, i); }).join("") +
          '</div>' +
        '</section>';
    }

    var gallerySection = "";
    if (!project.worlds) {
      var siblings = (window.SITE_PROJECTS || []).filter(function (p) { return p.id !== project.id && p.image; });
      if (siblings.length) {
        gallerySection =
          '<div class="pgallery">' +
            siblings.map(function (p, i) { return '<img class="' + (i === 0 ? "wide" : "") + '" data-reveal="scale" style="transition-delay:' + (i * 100) + 'ms" src="' + p.image + '" alt="" loading="lazy">'; }).join("") +
          '</div>';
      }
    }

    root.innerHTML =
      '<section class="phero">' +
        '<div class="phero__media">' + mediaMarkup(project, "") + '</div>' +
        '<div class="phero__scrim"></div>' +
        '<div class="phero__content wrap">' +
          '<a class="phero__back" href="index.html#projects">' +
            '<svg viewBox="0 0 24 24" fill="none" style="width:12px;height:12px;transform:rotate(180deg)"><path d="M5 19L19 5M19 5H8M19 5V16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
            window.t("project.back") +
          '</a>' +
          '<h1 class="phero__title">' + title + '</h1>' +
          '<div class="phero__meta">' +
            '<span>' + category + '</span>' +
            '<span>' + date + '</span>' +
          '</div>' +
        '</div>' +
      '</section>' +
      '<section class="section wrap">' +
        '<div class="pbody">' +
          '<div class="pbody__panel" data-reveal>' +
            '<h3>' + window.t("project.about") + '</h3>' +
            '<p>' + about + '</p>' +
          '</div>' +
          '<div class="pbody__panel" data-reveal style="transition-delay:120ms">' +
            '<h3>' + window.t("project.links") + '</h3>' +
            '<p style="display:flex;flex-direction:column;gap:10px;margin:0">' +
              '<a href="https://www.tiktok.com/@lehaneploxo" target="_blank" rel="noopener" style="color:var(--text)">TikTok ↗</a>' +
              '<a href="https://www.instagram.com/leha_neploxo" target="_blank" rel="noopener" style="color:var(--text)">Instagram ↗</a>' +
              '<a href="https://t.me/leha_neploxo" target="_blank" rel="noopener" style="color:var(--text)">Telegram ↗</a>' +
            '</p>' +
          '</div>' +
        '</div>' +
        gallerySection +
      '</section>' +
      worldsSection;

    reobserve(root);
  };

  /* --------------------------------------------------------- world page */

  window.renderWorldPage = function renderWorldPage() {
    var root = document.querySelector("[data-world-page]");
    if (!root) return;
    var params = new URLSearchParams(window.location.search);
    var projectId = params.get("project");
    var worldId = params.get("world");
    var project = (window.SITE_PROJECTS || []).find(function (p) { return p.id === projectId; });
    var world = project && project.worlds ? project.worlds.find(function (w) { return w.id === worldId; }) : null;

    if (!project || !world) {
      root.innerHTML =
        '<div class="notfound wrap">' +
          '<div class="eyebrow">404</div>' +
          '<h1 class="section-title">' + window.t("project.notfound.title") + '</h1>' +
          '<p class="section-sub">' + window.t("project.notfound.text") + '</p>' +
          '<a class="btn btn--primary" style="margin-top:28px" href="index.html#projects">' + window.t("project.notfound.cta") + '</a>' +
        '</div>';
      return;
    }

    var label = window.t("project.world.number") + " " + world.id;
    document.title = label + " — LEHA NEPLOXO";

    root.innerHTML =
      '<a class="world__back" href="project.html?id=' + project.id + '">' +
        '<svg viewBox="0 0 24 24" fill="none"><path d="M5 19L19 5M19 5H8M19 5V16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="transform:rotate(180deg);transform-origin:center"/></svg>' +
        '<span>' + window.t("world.back") + '</span>' +
      '</a>' +
      '<div class="world__label">' + label + '</div>' +
      '<iframe class="world__frame" src="' + world.file + '" title="' + label + '" loading="eager"></iframe>';
  };

  document.addEventListener("leha:i18n", function () {
    if (document.querySelector("[data-projects-grid]")) window.renderProjects();
    if (document.querySelector("[data-project-page]")) window.renderProjectPage();
    if (document.querySelector("[data-world-page]") && typeof window.renderWorldPage === "function") window.renderWorldPage();
  });
})();
