/* =========================================================
   Nhat's garden — renders every page from the files in /content
   You normally never need to edit this file:
   change text/photos/colors in content/site.json, content/photos.json
   and write posts in content/posts/*.md (or use Pages CMS).
   ========================================================= */

// ---- Interface words (menu, headings). Edit here if you want different wording.
const UI = {
  en: {
    home: "home", writing: "writing", photos: "photos",
    recently: "recently", about: "about me", research: "research", education: "education",
    slices: "slices of my life", photo_diary: "photo diary", contact: "come by",
    full_cv: "Full resume", notes: "notes", other_lang: "Tiếng Việt",
    other_posts: "Bài viết tiếng Việt", writing_lead: "Stories, notes and theories I've learned — newest first.",
    back: "all writing", not_found: "Post not found.", no_posts: "No posts yet.",
    choose: "change language"
  },
  vi: {
    home: "trang chủ", writing: "bài viết", photos: "ảnh",
    recently: "gần đây", about: "về mình", research: "nghiên cứu", education: "học vấn",
    slices: "những lát cắt cuộc sống", photo_diary: "nhật ký ảnh", contact: "ghé chơi",
    full_cv: "CV đầy đủ", notes: "ghi chép", other_lang: "English",
    other_posts: "Posts in English", writing_lead: "Câu chuyện, ghi chép và lý thuyết mình học được — mới nhất ở trên.",
    back: "tất cả bài viết", not_found: "Không tìm thấy bài viết.", no_posts: "Chưa có bài viết.",
    choose: "đổi ngôn ngữ"
  }
};

// ---- Language
const params = new URLSearchParams(location.search);
function getLang() {
  let l = params.get("lang");
  if (!l) { try { l = localStorage.getItem("lang"); } catch (e) {} }
  if (l !== "en" && l !== "vi") l = "en";
  try { localStorage.setItem("lang", l); } catch (e) {}
  return l;
}
const LANG = getLang();
const OTHER = LANG === "en" ? "vi" : "en";
const U = UI[LANG];
document.documentElement.lang = LANG;

// ---- Helpers
const $ = (s, el = document) => el.querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const tr = v => (v && typeof v === "object") ? (v[LANG] || v.en || v.vi || "") : (v || "");
const src = p => String(p || "").replace(/^\/+/, "");           // "/media/a.jpg" -> "media/a.jpg" (works on any GitHub Pages URL)
const link = (page, extra = "") => `${page}?lang=${LANG}${extra}`;

async function getJSON(path) {
  const r = await fetch(path, { cache: "no-cache" });
  if (!r.ok) throw new Error(path + " " + r.status);
  return r.json();
}

// ---- Markdown + math ($...$ and $$...$$)
function unescapeTex(tex) {
  // rich-text editors sometimes escape markdown characters inside formulas (\\frac, R\_a)
  return /\\\\[a-zA-Z]|\\_/.test(tex) ? tex.replace(/\\([\\_*\[\]`#+\-.!{}()])/g, "$1") : tex;
}
function md(text, inline = false) {
  const math = [];
  const keep = (tex, display) => { math.push([unescapeTex(tex.trim()), display]); return `@@MATH${math.length - 1}@@`; };
  const parts = String(text || "").split(/(```[\s\S]*?```|`[^`\n]*`)/);
  for (let i = 0; i < parts.length; i += 2) {
    parts[i] = parts[i]
      .replace(/\$\$([\s\S]+?)\$\$/g, (m, tex) => keep(tex, true))
      .replace(/(^|[^\\$])\$([^\n$]+?)\$/g, (m, pre, tex) => pre + keep(tex, false));
  }
  let html = inline ? marked.parseInline(parts.join("")) : marked.parse(parts.join(""));
  html = html.replace(/@@MATH(\d+)@@/g, (m, i) => {
    const [tex, display] = math[+i];
    try { return window.katex ? katex.renderToString(tex, { displayMode: display, throwOnError: false }) : esc(tex); }
    catch (e) { return esc(tex); }
  });
  // make "/media/..." image and link paths relative
  return html.replace(/(src|href)="\/(?!\/)/g, '$1="');
}

// ---- Front matter (--- key: value --- ) used by posts
function parseFrontMatter(raw) {
  const m = raw.replace(/^﻿/, "").match(/^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/);
  if (!m) return { data: {}, body: raw };
  const data = {}, lines = m[1].split("\n");
  const clean = v => v.trim().replace(/^(["'])(.*)\1$/, "$2");
  for (let i = 0; i < lines.length; i++) {
    const kv = lines[i].match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!kv) continue;
    let [, key, val] = kv;
    if (val === "" ) {                                 // list on following lines
      const arr = [];
      while (i + 1 < lines.length && /^\s+-\s+/.test(lines[i + 1])) arr.push(clean(lines[++i].replace(/^\s+-\s+/, "")));
      data[key] = arr;
    } else if (/^[>|][-+]?$/.test(val.trim())) {       // multi-line text
      const buf = [];
      while (i + 1 < lines.length && (/^\s+/.test(lines[i + 1]) || lines[i + 1] === "")) buf.push(lines[++i].trim());
      data[key] = buf.join(val.trim().startsWith(">") ? " " : "\n").trim();
    } else if (/^\[.*\]$/.test(val.trim())) {          // [a, b]
      data[key] = val.trim().slice(1, -1).split(",").map(clean).filter(Boolean);
    } else data[key] = clean(val);
  }
  return { data, body: m[2] };
}

// ---- Theme (colors / font from site.json)
function applyTheme(t = {}) {
  const r = document.documentElement.style;
  if (t.background) r.setProperty("--bg", t.background);
  if (t.text) r.setProperty("--text", t.text);
  if (t.accent) r.setProperty("--accent", t.accent);
  if (t.font_size) r.setProperty("--size", t.font_size + "px");
  const font = t.font || "Newsreader";
  r.setProperty("--serif", `"${font}", Georgia, serif`);
  const fam = font.replace(/ /g, "+");
  const l = document.createElement("link");
  l.rel = "stylesheet";
  l.href = `https://fonts.googleapis.com/css2?family=${fam}:ital,wght@0,400;0,500;0,700;1,400&family=JetBrains+Mono&display=swap`;
  document.head.appendChild(l);
  const meta = $('meta[name="theme-color"]'); if (meta && t.background) meta.content = t.background;
}

// ---- Shared nav + footer
function renderChrome(site, active) {
  const otherParams = new URLSearchParams(location.search); otherParams.set("lang", OTHER);
  $("#nav").innerHTML = `
    <a href="${link("home.html")}" class="${active === "home" ? "active" : ""}">${U.home}</a>
    <a href="${link("writing.html")}" class="${active === "writing" ? "active" : ""}">${U.writing}</a>
    ${site.show?.photos !== false ? `<a href="${link("home.html")}#photos">${U.photos}</a>` : ""}
    <span class="spacer"></span>
    <a class="lang" href="?${otherParams}" title="${U.choose}">${U.other_lang}</a>`;
  $("#footer").innerHTML = `© ${new Date().getFullYear()} ${esc(site.name)} · <a href="index.html?choose">${U.choose}</a>`;
}

const datedList = items => `<ol class="dated">${(items || []).map(it =>
  `<li><span class="date">${esc(it.date)}</span><span>${md(tr(it.text), true)}</span></li>`).join("")}</ol>`;

// ---- Pages
async function pageHome(site) {
  document.title = tr(site.site_title);
  const show = site.show || {};
  let photos = [];
  if (show.photos !== false) { try { photos = await getJSON("content/photos.json"); } catch (e) {} }
  const s = [];
  s.push(`<header>
      ${site.banner ? `<img class="banner" src="${esc(src(site.banner))}" alt="">` : ""}
      <h1>${esc(tr(site.site_title))}</h1>
      <p class="lead">${esc(tr(site.tagline))}</p></header>`);
  if (show.timeline !== false && site.timeline?.length) s.push(`<section><h2>${U.recently}</h2>${datedList(site.timeline)}</section>`);
  if (show.about !== false) s.push(`<section id="about"><h2>${U.about}</h2>${md(tr(site.about))}
      ${site.about_photo ? `<figure><img src="${esc(src(site.about_photo))}" alt=""><figcaption>${esc(tr(site.about_caption))}</figcaption></figure>` : ""}</section>`);
  if (show.research !== false && site.research?.length) s.push(`<section id="research"><h2>${U.research}</h2>${datedList(site.research)}</section>`);
  if (show.education !== false && site.education?.length) s.push(`<section id="education"><h2>${U.education}</h2>${datedList(site.education)}
      ${site.cv ? `<p class="after">${U.full_cv}: <a href="${esc(src(site.cv))}">CV (pdf)</a></p>` : ""}</section>`);
  if (show.slices !== false && site.slices?.length) s.push(`<section id="slices"><h2>${U.slices}</h2>
      <div class="chips">${site.slices.map((x, i) => `<button class="chip" data-i="${i}">${esc(tr(x.label))}</button>`).join("")}</div>
      ${site.slices.map((x, i) => `<div class="slice" id="slice-${i}">${md(tr(x.text))}</div>`).join("")}</section>`);
  if (show.photos !== false && photos.length) s.push(`<section id="photos"><h2>${U.photo_diary}</h2><div class="gallery">
      ${photos.map(p => `<figure><img loading="lazy" src="${esc(src(p.image))}" alt="${esc(tr(p.caption))}">
        <figcaption>${esc(tr(p.caption))}${p.date ? " · " + esc(p.date) : ""}</figcaption></figure>`).join("")}</div></section>`);
  if (show.contact !== false && site.contacts?.length) s.push(`<section id="contact"><h2>${U.contact}</h2><ul class="plain">
      ${site.contacts.map(c => `<li><a href="${esc(c.url)}">${esc(c.label)}</a></li>`).join("")}</ul></section>`);
  $("#main").innerHTML = s.join("");

  // toggles
  document.querySelectorAll(".chip").forEach(btn => btn.addEventListener("click", () => {
    const on = btn.classList.contains("on");
    document.querySelectorAll(".chip,.slice").forEach(e => e.classList.remove("on"));
    if (!on) { btn.classList.add("on"); $("#slice-" + btn.dataset.i).classList.add("on"); }
  }));
  // lightbox
  const lb = $(".lightbox");
  document.querySelectorAll(".gallery img").forEach(img => img.addEventListener("click", () => { $("img", lb).src = img.src; lb.classList.add("on"); }));
  lb.addEventListener("click", () => lb.classList.remove("on"));
  document.addEventListener("keydown", e => e.key === "Escape" && lb.classList.remove("on"));
  if (location.hash) document.querySelector(location.hash)?.scrollIntoView();
}

async function pageWriting(site) {
  document.title = `${U.writing} · ${tr(site.site_title)}`;
  let posts = [];
  try { posts = await getJSON("content/posts/index.json"); } catch (e) {}
  posts.sort((a, b) => String(b.date).localeCompare(String(a.date)));
  const row = p => `<li><span class="date">${esc(String(p.date).replace(/-/g, "."))}</span>
      <span><a href="${link("post.html", "&p=" + encodeURIComponent(p.slug))}">${esc(p.title)}</a>
      ${p.summary ? `<br><span class="summary">${esc(p.summary)}</span>` : ""}</span></li>`;
  const mine = posts.filter(p => (p.lang || "en") === LANG), others = posts.filter(p => (p.lang || "en") !== LANG);
  $("#main").innerHTML = `<h1>${U.writing}</h1><p class="lead">${U.writing_lead}</p>
    <section><h2>${U.notes}</h2>${mine.length ? `<ol class="dated">${mine.map(row).join("")}</ol>` : `<p class="muted">${U.no_posts}</p>`}</section>
    ${others.length ? `<section><h2>${U.other_posts}</h2><ol class="dated">${others.map(row).join("")}</ol></section>` : ""}`;
}

async function pagePost(site) {
  const slug = (params.get("p") || "").replace(/[^A-Za-z0-9_.\-]/g, "");
  let out = `<p>${U.not_found}</p>`;
  try {
    const r = await fetch(`content/posts/${slug}.md`, { cache: "no-cache" });
    if (!r.ok) throw 0;
    const { data, body } = parseFrontMatter(await r.text());
    document.title = `${data.title || slug} · ${tr(site.site_title)}`;
    const tags = [].concat(data.tags || []).filter(Boolean);
    out = `<article><h1>${esc(data.title || slug)}</h1>
      <div class="meta">${esc(String(data.date || "").replace(/-/g, "."))}${tags.length ? " · " + tags.map(esc).join(", ") : ""}</div>
      ${data.cover ? `<img class="banner" src="${esc(src(data.cover))}" alt="">` : ""}
      ${md(body)}</article>`;
  } catch (e) {}
  $("#main").innerHTML = out + `<p class="back">← <a href="${link("writing.html")}">${U.back}</a></p>`;
}

// ---- Boot
(async () => {
  const page = document.body.dataset.page;
  let site = {};
  try { site = await getJSON("content/site.json"); } catch (e) { console.error(e); }
  applyTheme(site.theme);
  renderChrome(site, page === "post" ? "writing" : page);
  if (page === "home") await pageHome(site);
  if (page === "writing") await pageWriting(site);
  if (page === "post") await pagePost(site);
  document.body.classList.add("ready");
})();
