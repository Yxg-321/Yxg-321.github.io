/* =========================================================
 * 归档页：按年份分组的时间线
 * ========================================================= */
(async function () {
  const timeline = document.getElementById("timeline");
  if (!timeline) return;
  const { posts } = await BlogAPI.fetchAllPosts();

  document.getElementById("archCount").textContent = posts.length;
  timeline.innerHTML = "";

  if (posts.length === 0) {
    timeline.innerHTML = '<p class="muted">还没有文章，快去发布第一篇吧。</p>';
    return;
  }

  const byYear = {};
  posts.forEach(function (p) {
    const y = (p.date || "未知").slice(0, 4);
    (byYear[y] = byYear[y] || []).push(p);
  });

  Object.keys(byYear).sort().reverse().forEach(function (y) {
    const yearEl = document.createElement("div");
    yearEl.className = "timeline-year reveal";
    yearEl.innerHTML = y + ' <span class="y-cnt">' + byYear[y].length + ' 篇</span>';
    timeline.appendChild(yearEl);

    byYear[y].forEach(function (p) {
      const item = document.createElement("div");
      item.className = "tl-item reveal";
      item.innerHTML =
        '<time>' + BlogMD.escapeHtml(BlogUI.fmtDate(p.date)) + '</time>' +
        '<a href="post.html?p=' + encodeURIComponent(p.id) + '">' + BlogMD.escapeHtml(p.title) + '</a>';
      timeline.appendChild(item);
    });
  });

  BlogUI.observeReveal(timeline);
})();
