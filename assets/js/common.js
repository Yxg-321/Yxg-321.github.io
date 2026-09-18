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
    /* 背景图由 CSS 统一设置（body 背景），hero 不再单独设背景图，避免两张图重叠 */
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

  /* ---------- 全局音乐按钮（音符，右下角）+ 播放列表面板 ---------- */
  function initMusic() {
    const btn = document.getElementById("musicBtn");
    if (!btn) return;
    const list = Array.isArray(SITE.music) ? SITE.music : [];
    if (list.length === 0) return;

    let audio = null;
    let playing = false;
    let idx = 0; // 当前播放索引
    /* 音频对象缓存：每首歌预创建并 preload，切歌时直接复用，避免重新下载导致的延迟 */
    const cache = {};

    function getAudio(i) {
      const m = list[i];
      if (!m) return null;
      if (!cache[i]) {
        const a = new Audio();
        a.preload = "auto"; // 预加载，首次播放后整首已缓存
        a.src = m.src;
        a.volume = 0.6;
        a.addEventListener("ended", function () { next(); });
        cache[i] = a;
      }
      return cache[i];
    }

    /* 内置转义（避免依赖 BlogMD，确保所有页面可用） */
    function esc(s) {
      return String(s == null ? "" : s)
        .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
    }

    /* 构建音乐面板 */
    function buildPanel() {
      let panel = document.getElementById("musicPanel");
      if (panel) return panel;
      panel = document.createElement("div");
      panel.className = "music-panel";
      panel.id = "musicPanel";
      panel.innerHTML =
        '<div class="music-panel-head">' +
          '<span class="music-panel-title">音乐</span>' +
          '<button class="music-close" id="musicClose" aria-label="关闭">×</button>' +
        '</div>' +
        '<ul class="music-list">' +
          list.map(function (m, i) {
            return '<li class="music-item" data-i="' + i + '">' +
              '<span class="music-item-name">' + esc(m.name) + '</span>' +
            '</li>';
          }).join("") +
        '</ul>' +
        '<div class="music-ctrl">' +
          '<button id="musicPrev" class="music-btn" aria-label="上一首">⏮</button>' +
          '<button id="musicToggle" class="music-btn music-toggle" aria-label="播放/暂停">▶</button>' +
          '<button id="musicNext" class="music-btn" aria-label="下一首">⏭</button>' +
        '</div>';
      document.body.appendChild(panel);
      return panel;
    }

    function current() { return list[idx]; }

    function loadAndPlay() {
      if (!current()) return;
      /* 停掉正在播的 */
      if (audio) { audio.pause(); audio.currentTime = 0; }
      audio = getAudio(idx);
      if (!audio) return;
      audio.play().then(function () {
        setPlaying(true);
        highlight();
        /* 后台预加载下一首，加速切换 */
        getAudio((idx + 1) % list.length);
      }).catch(function () { setPlaying(false); });
    }

    function setPlaying(on) {
      playing = on;
      btn.classList.toggle("fab-playing", on);
      btn.title = on ? "暂停音乐" : "播放音乐";
      const tg = document.getElementById("musicToggle");
      if (tg) tg.textContent = on ? "⏸" : "▶";
    }

    function highlight() {
      document.querySelectorAll(".music-item").forEach(function (li) {
        li.classList.toggle("active", Number(li.getAttribute("data-i")) === idx);
      });
    }

    function next() {
      idx = (idx + 1) % list.length;
      loadAndPlay();
    }
    function prev() {
      idx = (idx - 1 + list.length) % list.length;
      loadAndPlay();
    }

    /* 音符按钮：展开/收起面板 */
    btn.addEventListener("click", function () {
      const panel = buildPanel();
      const open = panel.classList.toggle("show");
      if (open) highlight();
    });

    /* 面板内交互（事件委托） */
    document.addEventListener("click", function (e) {
      const panel = document.getElementById("musicPanel");
      if (!panel) return;
      if (e.target.id === "musicClose" || !panel.contains(e.target) && e.target.id !== "musicBtn" && panel.classList.contains("show")) {
        // 点关闭或点击面板外部时收起（音乐按钮除外）
        if (e.target.id === "musicClose") panel.classList.remove("show");
        else if (!panel.contains(e.target) && e.target !== btn) panel.classList.remove("show");
      }
      const item = e.target.closest(".music-item");
      if (item) {
        idx = Number(item.getAttribute("data-i"));
        loadAndPlay();
      }
      if (e.target.id === "musicToggle") {
        if (!audio) { loadAndPlay(); return; }
        if (playing) { audio.pause(); setPlaying(false); }
        else { audio.play().then(function () { setPlaying(true); }); }
      }
      if (e.target.id === "musicNext") next();
      if (e.target.id === "musicPrev") prev();
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
