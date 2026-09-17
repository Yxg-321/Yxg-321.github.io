/* =========================================================
 * 归档页侧栏：分类 / 标签 / 最近文章（从首页迁移而来）
 * 点击分类/标签 → 跳转首页并按条件筛选（带 query 参数）
 * ========================================================= */
(async function () {
  const $ = function (id) { return document.getElementById(id); };
  const catsBox = $("sideCats");
  const tagsBox = $("sideTags");
  const recentBox = $("sideRecent");
  if (!catsBox && !tagsBox && !recentBox) return;

  function esc(s) { return BlogMD.escapeHtml(s); }

  const { posts } = await BlogAPI.fetchAllPosts();

  function uniqueCats() {
    const set = [];
    posts.forEach(function (p) { if (set.indexOf(p.category) === -1) set.push(p.category); });
    return set;
  }
  function uniqTags() {
    const set = [];
    posts.forEach(function (p) {
      p.tags.forEach(function (t) { if (set.indexOf(t) === -1) set.push(t); });
    });
    return set;
  }

  /* 分类 */
  if (catsBox) {
    catsBox.innerHTML = "";
    uniqueCats().forEach(function (c) {
      const n = posts.filter(function (p) { return p.category === c; }).length;
      const li = document.createElement("li");
      li.innerHTML = '<button><span>' + esc(c) + '</span><span class="cnt">' + n + '</span></button>';
      li.querySelector("button").addEventListener("click", function () {
        location.href = "index.html?cat=" + encodeURIComponent(c);
      });
      catsBox.appendChild(li);
    });
  }

  /* 标签 */
  if (tagsBox) {
    tagsBox.innerHTML = "";
    uniqTags().forEach(function (t) {
      const b = document.createElement("button");
      b.textContent = t;
      b.addEventListener("click", function () {
        location.href = "index.html?tag=" + encodeURIComponent(t);
      });
      tagsBox.appendChild(b);
    });
  }

  /* 最近文章 */
  if (recentBox) {
    recentBox.innerHTML = "";
    posts.slice(0, 5).forEach(function (p) {
      const li = document.createElement("li");
      li.innerHTML = '<a href="post.html?p=' + encodeURIComponent(p.id) + '">' + esc(p.title) + '</a>' +
        '<time>' + esc(BlogUI.fmtDate(p.date)) + '</time>';
      recentBox.appendChild(li);
    });
  }
})();
