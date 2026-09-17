/* =========================================================
 * 全站公共行为：站点配置注入、导航滚动态、滚动显现动画
 * ========================================================= */
(function () {
  /* 把 config.js 里的站点信息填进带 data-site 属性的元素 */
  function injectSite() {
    const map = {
      title: SITE.title,
      subtitle: SITE.subtitle,
      owner: SITE.owner,
      slogan: SITE.slogan,
      since: SITE.since,
      footerNote: SITE.footerNote,
      year: String(new Date().getFullYear()),
    };
    document.querySelectorAll("[data-site]").forEach(function (el) {
      const key = el.getAttribute("data-site");
      if (map[key] != null) el.textContent = map[key];
    });
    document.querySelectorAll("[data-site-avatar]").forEach(function (el) {
      el.src = SITE.avatar;
    });
    document.querySelectorAll("[data-site-bg]").forEach(function (el) {
      el.style.backgroundImage = "url('" + SITE.bg + "')";
    });
    /* 页面标题：<body data-pagetitle="..."> */
    const pt = document.body.getAttribute("data-pagetitle");
    document.title = pt && pt !== SITE.title ? SITE.title + " · " + pt : SITE.title;
  }

  /* 导航栏：滚动后从“透明深色”切换为“浅色毛玻璃” */
  function initNav() {
    const nav = document.getElementById("siteNav");
    if (!nav) return;
    /* 管理页没有大图 Hero，导航始终用实底样式 */
    const alwaysSolid = document.body.classList.contains("admin-body");
    const onScroll = function () {
      nav.classList.toggle("solid", alwaysSolid || window.scrollY > 40);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    /* 高亮当前页链接 */
    const path = location.pathname.split("/").pop() || "index.html";
    nav.querySelectorAll(".nav-links a").forEach(function (a) {
      const href = a.getAttribute("href");
      a.classList.toggle("active", href === path);
    });
  }

  /* 滚动显现动画 */
  function initReveal() {
    const els = document.querySelectorAll(".reveal");
    if (!("IntersectionObserver" in window)) {
      els.forEach(function (el) { el.classList.add("in"); });
      return;
    }
    const io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add("in");
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.08 });
    els.forEach(function (el) { io.observe(el); });
  }

  /* 动态插入的卡片也需要做显现动画 */
  function observeReveal(root) {
    const els = (root || document).querySelectorAll(".reveal:not(.in)");
    if (!("IntersectionObserver" in window)) {
      els.forEach(function (el) { el.classList.add("in"); });
      return;
    }
    const io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add("in");
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.08 });
    els.forEach(function (el) { io.observe(el); });
  }

  function fmtDate(d) {
    return (d || "").slice(0, 10);
  }

  function today() {
    const d = new Date();
    const p = function (n) { return n < 10 ? "0" + n : "" + n; };
    return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate());
  }

  /* ---------- 导航图标：按 data-ico 属性注入对应 SVG ---------- */
  const NAV_ICONS = {
    home: "assets/images/nav-home.svg",
    archive: "assets/images/nav-archive.svg",
    about: "assets/images/nav-about.svg",
    guestbook: "assets/images/nav-guestbook.svg",
  };
  function injectNavIcons() {
    document.querySelectorAll(".nav-links a[data-ico]").forEach(function (a) {
      const key = a.getAttribute("data-ico");
      const src = NAV_ICONS[key];
      if (!src || a.querySelector(".nav-ico")) return;
      const span = document.createElement("span");
      span.className = "nav-ico";
      span.innerHTML = '<img src="' + src + '" alt="" aria-hidden="true">';
      a.insertBefore(span, a.firstChild);
    });
  }

  /* ---------- 主题切换（晴天/星星图片按钮） ---------- */
  const THEME_KEY = "blog_theme";
  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    try { localStorage.setItem(THEME_KEY, theme); } catch (e) {}
    updateThemeBtn();
  }
  function updateThemeBtn() {
    const btn = document.getElementById("themeBtn");
    if (!btn) return;
    const dark = document.documentElement.getAttribute("data-theme") === "dark";
    const img = btn.querySelector("img");
    if (img) img.src = dark ? "assets/images/theme-light.svg" : "assets/images/theme-dark.svg";
    btn.title = dark ? "切换到亮色" : "切换到暗色";
    btn.setAttribute("aria-label", btn.title);
  }
  function initTheme() {
    let saved = null;
    try { saved = localStorage.getItem(THEME_KEY); } catch (e) {}
    applyTheme(saved === "dark" ? "dark" : "light");
    const btn = document.getElementById("themeBtn");
    if (btn) {
      btn.addEventListener("click", function () {
        const dark = document.documentElement.getAttribute("data-theme") === "dark";
        applyTheme(dark ? "light" : "dark");
      });
    }
  }

  /* ---------- 全局音乐按钮（音符，右下角） ---------- */
  function initMusic() {
    const btn = document.getElementById("musicBtn");
    if (!btn) return;
    let audio = null;
    let playing = false;
    const SRC = SITE.music;
    function ensureAudio() {
      if (!audio) {
        audio = new Audio(SRC);
        audio.loop = true;
        audio.volume = 0.6;
        audio.addEventListener("ended", function () { setPlaying(false); });
      }
      return audio;
    }
    function setPlaying(on) {
      playing = on;
      btn.classList.toggle("fab-playing", on);
      btn.title = on ? "暂停音乐" : "播放音乐";
      btn.setAttribute("aria-label", btn.title);
    }
    btn.addEventListener("click", function () {
      if (!SRC) {
        setPlaying(false);
        // 无音源时给一个短暂提示（按钮标题变提示）
        btn.title = "未配置音乐文件（在 config.js 的 music 字段填 mp3 地址）";
        btn.setAttribute("aria-label", btn.title);
        setTimeout(function () { setPlaying(false); }, 2000);
        return;
      }
      const a = ensureAudio();
      if (playing) {
        a.pause();
        setPlaying(false);
      } else {
        a.play().then(function () { setPlaying(true); })
          .catch(function () {
            setPlaying(false);
          });
      }
    });
  }

  /* ---------- 全局浮动按钮组（主题 + 音乐） ---------- */
  function injectFabs() {
    if (document.querySelector(".global-fabs")) return;
    const wrap = document.createElement("div");
    wrap.className = "global-fabs";

    const themeBtn = document.createElement("button");
    themeBtn.className = "fab";
    themeBtn.id = "themeBtn";
    themeBtn.innerHTML = '<img src="assets/images/theme-dark.svg" alt="切换主题">';
    wrap.appendChild(themeBtn);

    const musicBtn = document.createElement("button");
    musicBtn.className = "fab";
    musicBtn.id = "musicBtn";
    musicBtn.innerHTML = '<img src="assets/images/music.svg" alt="播放音乐">';
    wrap.appendChild(musicBtn);

    document.body.appendChild(wrap);
    initTheme();
    initMusic();
  }

  /* 对外暴露 */
  window.BlogUI = {
    injectSite: injectSite,
    observeReveal: observeReveal,
    fmtDate: fmtDate,
    today: today,
    applyTheme: applyTheme,
  };

  document.addEventListener("DOMContentLoaded", function () {
    injectSite();
    injectNavIcons();
    initNav();
    initReveal();
    injectFabs();
  });
})();
