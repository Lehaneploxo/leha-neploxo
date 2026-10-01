/* ==========================================================================
   Pre-renders the home page per language so search engines get real text
   without running JS:  /  (ru, x-default),  /ua/,  /en/.
   index.html is both the template and the ru output — re-running is safe,
   every [data-i18n] node is re-filled from js/data.js by its key.
   Run after editing js/data.js or index.html:   node tools/build-langs.js
   ========================================================================== */

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.join(__dirname, "..");
const SITE = "https://lehaneploxo.com";

/* lang code in data.js -> url dir, html lang, og:locale */
const LANGS = [
  { code: "ru", dir: "",    html: "ru", locale: "ru_RU" },
  { code: "ua", dir: "ua/", html: "uk", locale: "uk_UA" },
  { code: "en", dir: "en/", html: "en", locale: "en_US" }
];

const sandbox = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(ROOT, "js/data.js"), "utf8"), sandbox);
const I18N = sandbox.window.SITE_I18N;

const esc = (s) => String(s)
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function langLinks(lang) {
  const out = [
    '<link rel="canonical" href="' + SITE + "/" + lang.dir + '">',
    '<meta property="og:url" content="' + SITE + "/" + lang.dir + '">',
    '<meta property="og:locale" content="' + lang.locale + '">'
  ];
  LANGS.forEach((l) => out.push('<link rel="alternate" hreflang="' + l.html + '" href="' + SITE + "/" + l.dir + '">'));
  out.push('<link rel="alternate" hreflang="x-default" href="' + SITE + '/">');
  return out.join("\n");
}

function render(template, lang) {
  const dict = I18N[lang.code];
  const t = (key) => (key in dict ? dict[key] : I18N.ru[key]);
  let html = template;

  /* text nodes: <tag ... data-i18n="key" ...>text</tag> (plain-text content only) */
  html = html.replace(/(<(\w+)\b[^>]*\sdata-i18n="([^"]+)"[^>]*>)([^<]*)(<\/\2>)/g,
    (m, open, tag, key, text, close) => (t(key) == null ? m : open + esc(t(key)) + close));

  /* attributes: data-i18n-attr="attr:key,attr:key" */
  html = html.replace(/<[^>]*\sdata-i18n-attr="([^"]+)"[^>]*>/g, (tagStr, spec) => {
    spec.split(",").forEach((pair) => {
      const [attr, key] = pair.split(":").map((x) => x.trim());
      if (t(key) == null) return;
      const re = new RegExp("(\\s" + attr + '=")[^"]*(")');
      const val = esc(t(key)).replace(/\$/g, "$$$$");
      tagStr = re.test(tagStr) ? tagStr.replace(re, "$1" + val + "$2")
                               : tagStr.replace(/\s*\/?>$/, (end) => " " + attr + '="' + val + '"' + end);
    });
    return tagStr;
  });

  html = html.replace(/<html\b[^>]*>/, '<html lang="' + lang.html + '" data-page-lang="' + lang.code + '">');
  html = html.replace(/<!-- lang-links -->[\s\S]*?<!-- \/lang-links -->/,
    "<!-- lang-links -->\n" + langLinks(lang) + "\n<!-- /lang-links -->");

  /* subfolder pages: point relative asset/page urls one level up */
  if (lang.dir) {
    html = html.replace(/(\s(?:src|href|poster|data-open-video)=")(?!https?:|\/|#|data:|mailto:|tel:)([^"]+")/g, "$1../$2");
    html = html.replace('<script src="../js/data.js">', '<script>window.SITE_BASE = "../";</script>\n<script src="../js/data.js">');
  }
  return html;
}

const template = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
LANGS.forEach((lang) => {
  const file = path.join(ROOT, lang.dir, "index.html");
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, render(template, lang));
  console.log("wrote", path.relative(ROOT, file));
});
