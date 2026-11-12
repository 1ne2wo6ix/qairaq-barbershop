(function () {
  "use strict";
  var S = window.SITE;
  var LANG_KEY = "site-lang";
  var lang = "ru";
  try { lang = localStorage.getItem(LANG_KEY) || "ru"; } catch (e) {}
  var urlLang = new URLSearchParams(location.search).get("lang"); // ссылка вида ?lang=kk
  if (urlLang) lang = urlLang;
  if (!S.i18n[lang]) lang = "ru";

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  var t = function (key) { return S.i18n[lang][key] || S.i18n.ru[key] || ""; };
  var tr = function (obj) { return obj && typeof obj === "object" ? (obj[lang] || obj.ru) : obj; };
  var esc = function (s) {
    return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; });
  };
  var money = function (n) { return n.toLocaleString("ru-RU").replace(/ /g, " ") + " ₸"; };

  /* ---------- Цвета из конфига ---------- */
  var root = document.documentElement.style;
  Object.keys(S.colors).forEach(function (k) {
    root.setProperty("--" + k.replace(/[A-Z]/g, function (m) { return "-" + m.toLowerCase(); }), S.colors[k]);
  });

  /* ---------- Ссылки ---------- */
  function waLink(extra) {
    var msg = tr(S.bookingMessage) + (extra ? ". " + extra : "");
    return "https://wa.me/" + S.contacts.whatsapp + "?text=" + encodeURIComponent(msg);
  }
  function setLinks() {
    $$(".js-wa").forEach(function (a) { a.href = waLink(); });
    $$(".js-tg").forEach(function (a) { a.href = "https://t.me/" + S.contacts.telegram; });
    $$(".js-ig").forEach(function (a) { a.href = "https://instagram.com/" + S.contacts.instagram; });
    $$(".js-tel").forEach(function (a) { a.href = "tel:" + S.contacts.phoneRaw; });
    $$(".js-2gis").forEach(function (a) { a.href = S.contacts.twoGisUrl; });
  }

  /* ---------- Простые подстановки ---------- */
  function bindValues() {
    var vals = {
      name: S.brand.name, tagline: S.brand.tagline, logoLetter: S.brand.logoLetter,
      years: S.stats.years, clients: S.stats.clients,
      rating: S.rating.value, reviewsCount: S.rating.count,
      phone: S.contacts.phone, hours: S.contacts.open + "–" + S.contacts.close
    };
    $$("[data-bind]").forEach(function (el) { el.textContent = vals[el.dataset.bind]; });
    $$("[data-bind-i18n]").forEach(function (el) { el.textContent = tr(S.contacts[el.dataset.bindI18n]); });
    $$("[data-i18n]").forEach(function (el) { el.textContent = t(el.dataset.i18n); });
    $("#year").textContent = new Date().getFullYear();
    $(".demo-note").hidden = !S.showDemoNote;
  }

  /* ---------- Блоки из списков ---------- */
  function placeholder(icon, label) {
    return '<div class="ph"><svg class="ph__ico" aria-hidden="true"><use href="#' + icon + '"/></svg>' +
      (label ? '<span>' + esc(label) + '</span>' : '') + '</div>';
  }
  function photo(src, alt, icon, label) {
    return src
      ? '<img src="' + esc(src) + '" alt="' + esc(alt) + '" loading="lazy" decoding="async">'
      : placeholder(icon, label);
  }

  function renderServices() {
    $("#servicesList").innerHTML = S.services.map(function (s) {
      var name = tr(s.name);
      return '<article class="service' + (s.featured ? ' service--featured' : '') + '">' +
        (s.featured ? '<span class="badge">' + esc(t("featured")) + '</span>' : '') +
        '<div class="service__top"><h3>' + esc(name) + '</h3>' +
        '<b class="service__price">' + money(s.price) + '</b></div>' +
        '<p>' + esc(tr(s.desc)) + '</p>' +
        '<div class="service__bottom"><span class="service__time">' + s.time + ' ' + esc(t("min")) + '</span>' +
        '<a class="link" target="_blank" rel="noopener" href="' + esc(waLink(name)) + '">' + esc(t("bookThis")) + ' →</a></div>' +
        '</article>';
    }).join("");
  }

  function renderMasters() {
    $("#mastersList").innerHTML = S.masters.map(function (m) {
      var name = tr(m.name);
      return '<article class="master">' +
        '<div class="master__photo">' + photo(m.photo, name, "i-user") + '</div>' +
        '<div class="master__body"><h3>' + esc(name) + '</h3>' +
        '<p class="master__role">' + esc(tr(m.role)) + '</p>' +
        '<p class="master__skills">' + esc(tr(m.skills)) + '</p>' +
        '<a class="btn btn--ghost btn--block" target="_blank" rel="noopener" href="' +
          esc(waLink(t("bookMaster") + ": " + name)) + '">' + esc(t("bookMaster")) + '</a></div>' +
        '</article>';
    }).join("");
  }

  function renderGallery() {
    $("#galleryList").innerHTML = S.gallery.map(function (g, i) {
      var label = tr(g.label);
      return '<figure class="gallery__item g' + (i % 6) + '">' +
        photo(g.photo, label, "i-scissors", t("photoSoon")) +
        '<figcaption>' + esc(label) + '</figcaption></figure>';
    }).join("");
  }

  function renderReviews() {
    $("#reviewsList").innerHTML = S.reviews.map(function (r) {
      return '<article class="review">' +
        '<div class="stars" aria-label="' + r.stars + ' / 5">' + "★★★★★".slice(0, r.stars) + '</div>' +
        '<p>«' + esc(tr(r.text)) + '»</p>' +
        '<footer><span class="review__avatar">' + esc(r.name.charAt(0)) + '</span>' +
        '<b>' + esc(r.name) + '</b><small>' + esc(r.source) + '</small></footer>' +
        '</article>';
    }).join("");
  }

  /* ---------- Открыто / закрыто (время Алматы) ---------- */
  function renderStatus() {
    var el = $("#openStatus");
    var now;
    try {
      now = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Almaty", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date());
    } catch (e) { el.textContent = ""; return; }
    var toMin = function (s) { var p = s.split(":"); return (+p[0] % 24) * 60 + +p[1]; };
    var cur = toMin(now), open = toMin(S.contacts.open), close = toMin(S.contacts.close);
    var isOpen = close > open ? cur >= open && cur < close : cur >= open || cur < close;
    el.textContent = isOpen ? t("openNow") : t("closedNow");
    el.classList.toggle("is-open", isOpen);
  }

  /* ---------- Карта: грузим, только когда до неё доскроллили ---------- */
  function initMap() {
    var box = $("#map");
    var load = function () {
      if (box.dataset.loaded) return;
      box.dataset.loaded = "1";
      box.innerHTML = '<iframe title="Карта" loading="lazy" referrerpolicy="no-referrer-when-downgrade" src="https://www.google.com/maps?q=' +
        encodeURIComponent(S.contacts.mapQuery) + '&z=16&output=embed"></iframe>';
    };
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (es) {
        if (es[0].isIntersecting) { load(); io.disconnect(); }
      }, { rootMargin: "300px" });
      io.observe(box);
    } else { load(); }
  }

  /* ---------- Язык ---------- */
  function applyLang() {
    document.documentElement.lang = lang === "kk" ? "kk" : "ru";
    $$("[data-lang]").forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.lang === lang)); });
    bindValues(); setLinks();
    renderServices(); renderMasters(); renderGallery(); renderReviews(); renderStatus();
  }
  $$("[data-lang]").forEach(function (b) {
    b.addEventListener("click", function () {
      lang = b.dataset.lang;
      try { localStorage.setItem(LANG_KEY, lang); } catch (e) {}
      applyLang();
    });
  });

  /* ---------- Шапка при прокрутке ---------- */
  var header = $(".header");
  var onScroll = function () { header.classList.toggle("is-scrolled", window.scrollY > 10); };
  window.addEventListener("scroll", onScroll, { passive: true });

  if (S.brand.heroPhoto) {
    var bg = $(".hero__bg");
    bg.style.backgroundImage = "url('" + S.brand.heroPhoto + "')";
    bg.classList.add("has-photo");
  }
  document.title =S.brand.name + " " + S.brand.tagline + " — " + tr(S.brand.city);
  applyLang(); onScroll(); initMap();
})();
