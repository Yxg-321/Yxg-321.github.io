/* =========================================================
 * 首页：文章卡片列表 + 分类/标签筛选 + 侧栏
 * ========================================================= */
(async function () {
  const $ = function (id) { return document.getElementById(id); };
  const listEl = $("postList");
  const filterBar = $("filterBar");
  const emptyState = $("emptyState");
  const dataSource = $("dataSource");
  if (!listEl) return;

  let allPosts = [];
  let filter = { type: "all", value: "" }; // type: all | category | tag

  function esc(s) { return BlogMD.escapeHtml(s); }

  function postCard(p) {
    const st = BlogMD.countStats(p.markdown);
    const el = document.createElement("article");
    el.className = "post-card reveal";
    el.innerHTML =
      '<div class="post-meta">' +
        '<span>' + esc(BlogUI.fmtDate(p.date)) + '</span>' +
        '<span class="dot">·</span><span>' + st.chars + ' 字</span>' +
        '<span class="dot">·</span><span>约 ' + st.minutes + ' 分钟</span>' +
        '<span class="cat-chip">' + esc(p.category) + '</span>' +
      '</div>' +
      '<h2 class="post-title"><a href="post.html?p=' + encodeURIComponent(p.id) + '">' + esc(p.title) + '</a></h2>' +
      '<p class="post-summary">' + esc(p.summary) + '</p>' +
      '<div class="post-foot">' +
        '<div class="post-tags">' +
          p.tags.map(function (t) {
            return '<a class="tag-chip" data-tag="' + esc(t) + '" href="javascript:void(0)"># ' + esc(t) + '</a>';
          }).join("") +
        '</div>' +
        '<a class="read-more" href="post.html?p=' + encodeURIComponent(p.id) + '">阅读全文 →</a>' +
      '</div>';
    return el;
  }

  function matches(p) {
    if (filter.type === "category") return p.category === filter.value;
    if (filter.type === "tag") return p.tags.indexOf(filter.value) !== -1;
    return true;
  }

  function renderList() {
    const shown = allPosts.filter(matches);
    listEl.innerHTML = "";
    shown.forEach(function (p) { listEl.appendChild(postCard(p)); });
    emptyState.hidden = shown.length > 0;
    emptyState.querySelector("p").textContent =
      filter.type === "all" ? "这里还没有文章。" :
      "「" + filter.value + "」下暂时没有文章。";
    BlogUI.observeReveal(listEl);
  }

  function renderFilterBar(categories) {
    filterBar.innerHTML = "";
    const mk = function (label, type, value, active) {
      const b = document.createElement("button");
      b.textContent = label;
      b.className = active ? "active" : "";
      b.addEventListener("click", function () {
        filter = { type: type, value: value };
        renderList();
        renderFilterBar(categories);
        renderSideCats(categories);
        renderSideTags();
      });
      filterBar.appendChild(b);
    };
    mk("全部", "all", "", filter.type === "all");
    categories.forEach(function (c) {
      mk(c, "category", c, filter.type === "category" && filter.value === c);
    });
  }

  function renderSideCats(categories) {
    const ul = $("sideCats");
    if (!ul) return;
    ul.innerHTML = "";
    categories.forEach(function (c) {
      const n = allPosts.filter(function (p) { return p.category === c; }).length;
      const li = document.createElement("li");
      li.innerHTML = '<button class="' + (filter.type === "category" && filter.value === c ? "active" : "") + '">' +
        '<span>' + esc(c) + '</span><span class="cnt">' + n + '</span></button>';
      li.querySelector("button").addEventListener("click", function () {
        filter = filter.type === "category" && filter.value === c
          ? { type: "all", value: "" }
          : { type: "category", value: c };
        renderList(); renderFilterBar(categories); renderSideCats(categories); renderSideTags();
      });
      ul.appendChild(li);
    });
  }

  function renderSideTags() {
    const box = $("sideTags");
    if (!box) return;
    const tags = uniqTags();
    box.innerHTML = "";
    tags.forEach(function (t) {
      const b = document.createElement("button");
      b.textContent = t;
      b.className = filter.type === "tag" && filter.value === t ? "active" : "";
      b.addEventListener("click", function () {
        filter = filter.type === "tag" && filter.value === t
          ? { type: "all", value: "" }
          : { type: "tag", value: t };
        renderList(); renderFilterBar(uniqueCats()); renderSideCats(uniqueCats()); renderSideTags();
      });
      box.appendChild(b);
    });
  }

  function renderRecent() {
    const ul = $("sideRecent");
    if (!ul) return;
    ul.innerHTML = "";
    allPosts.slice(0, 5).forEach(function (p) {
      const li = document.createElement("li");
      li.innerHTML = '<a href="post.html?p=' + encodeURIComponent(p.id) + '">' + esc(p.title) + '</a>' +
        '<time>' + esc(BlogUI.fmtDate(p.date)) + '</time>';
      ul.appendChild(li);
    });
  }

  function uniqueCats() {
    const set = [];
    allPosts.forEach(function (p) { if (set.indexOf(p.category) === -1) set.push(p.category); });
    return set;
  }
  function uniqTags() {
    const set = [];
    allPosts.forEach(function (p) {
      p.tags.forEach(function (t) { if (set.indexOf(t) === -1) set.push(t); });
    });
    return set;
  }

  /* 卡片内标签点击 → 按标签筛选 */
  listEl.addEventListener("click", function (e) {
    const t = e.target.closest("[data-tag]");
    if (!t) return;
    filter = { type: "tag", value: t.getAttribute("data-tag") };
    renderList(); renderFilterBar(uniqueCats()); renderSideCats(uniqueCats()); renderSideTags();
    document.getElementById("main").scrollIntoView({ behavior: "smooth" });
  });

  const { posts, source } = await BlogAPI.fetchAllPosts();
  allPosts = posts;

  /* 支持从 URL 读初始筛选（归档页侧栏跳转过来：?cat=xx 或 ?tag=xx） */
  const qp = new URLSearchParams(location.search);
  if (qp.get("cat")) {
    filter = { type: "category", value: qp.get("cat") };
  } else if (qp.get("tag")) {
    filter = { type: "tag", value: qp.get("tag") };
  }

  $("statPosts").textContent = allPosts.length;
  $("statCats").textContent = uniqueCats().length;
  $("statTags").textContent = uniqTags().length;

  renderFilterBar(uniqueCats());
  renderSideCats(uniqueCats());
  renderSideTags();
  renderRecent();
  renderList();

  if (source === "local") {
    dataSource.hidden = false;
    dataSource.textContent = "（云端暂不可达，当前展示内置示例文章）";
  }
})();
