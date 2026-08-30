/* ==========================================================================
   LEHA NEPLOXO — project grid + project detail page rendering
   ========================================================================== */

(function () {
  "use strict";

  var ARROW = '<svg viewBox="0 0 24 24" fill="none"><path d="M5 19L19 5M19 5H8M19 5V16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  function mediaMarkup(project, cls) {
    if (project.video) {
      return '<video class="' + cls + '" src="' + project.video + '" poster="' + project.image + '" muted loop playsinline preload="metadata"></video>';
    }
    return '<img class="' + cls + '" src="' + project.image + '" alt="" loading="lazy">';
  }

  function cardHTML(project, i) {
    var title = window.t(project.titleKey);
    return (
      '<article class="pcard" data-reveal="scale" style="transition-delay:' + (i * 90) + 'ms">' +
        '<div class="pcard__index">0' + project.id + '</div>' +
        '<div class="pcard__media">' + mediaMarkup(project, "") + '</div>' +
        '<div class="pcard__glow"></div>' +
        '<div class="pcard__scrim"></div>' +
        '<div class="pcard__body">' +
          '<div class="pcard__meta"><span>' + window.t("projects.card.category") + '</span><span>' + window.t("projects.card.date") + '</span></div>' +
          '<h3 class="pcard__title">' + title + '</h3>' +
          '<p class="pcard__desc">' + window.t("projects.card.desc") + '</p>' +
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
    if (typeof window.__reinitReveal === "function") window.__reinitReveal();
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
    document.title = title + " — LEHA NEPLOXO";

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
            '<span>' + window.t("projects.card.category") + '</span>' +
            '<span>' + window.t("projects.card.date") + '</span>' +
          '</div>' +
        '</div>' +
      '</section>' +
      '<section class="section wrap">' +
        '<div class="pbody">' +
          '<div class="pbody__panel" data-reveal>' +
            '<h3>' + window.t("project.about") + '</h3>' +
            '<p>' + window.t("project.placeholder") + '</p>' +
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
        '<div class="pgallery">' +
          (window.SITE_PROJECTS || [])
            .filter(function (p) { return p.id !== project.id; })
            .map(function (p, i) { return '<img class="' + (i === 0 ? "wide" : "") + '" data-reveal="scale" style="transition-delay:' + (i * 100) + 'ms" src="' + p.image + '" alt="" loading="lazy">'; })
            .join("") +
        '</div>' +
      '</section>';

    reobserve(root);
  };

  document.addEventListener("leha:i18n", function () {
    if (document.querySelector("[data-projects-grid]")) window.renderProjects();
    if (document.querySelector("[data-project-page]")) window.renderProjectPage();
  });
})();
