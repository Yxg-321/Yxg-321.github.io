/* =========================================================
 * 文章页：渲染 Markdown 正文 + 目录 + 上一篇/下一篇
 * ========================================================= */
(async function () {
  const $ = function (id) { return document.getElementById(id); };
  const params = new URLSearchParams(location.search);
  const id = params.get("p") || "";
  const articleEl = $("article");
  if (!articleEl) return;

  const { posts } = await BlogAPI.fetchAllPosts();
  const idx = posts.findIndex(function (p) { return p.id === id; });
  const post = idx >= 0 ? posts[idx] : posts[0];

  if (!post) {
    $("postTitle").textContent = "文章不存在";
    articleEl.innerHTML = '<p class="muted">没有找到这篇文章，可能已被删除。<a href="index.html">返回首页</a></p>';
    return;
  }

  /* 页头信息 */
  document.body.setAttribute("data-pagetitle", post.title);
  document.title = SITE.title + " · " + post.title;
  $("postTitle").textContent = post.title;
  const st = BlogMD.countStats(post.markdown);
  $("postMeta").innerHTML =
    '<span>' + BlogMD.escapeHtml(BlogUI.fmtDate(post.date)) + '</span>' +
    '<span class="dot">·</span><span class="cat-chip">' + BlogMD.escapeHtml(post.category) + '</span>' +
    '<span class="dot">·</span><span>' + st.chars + ' 字</span>' +
    '<span class="dot">·</span><span>约 ' + st.minutes + ' 分钟</span>';
  $("postTags").innerHTML = post.tags.map(function (t) {
    return '<span class="tag-chip"># ' + BlogMD.escapeHtml(t) + '</span>';
  }).join("");

  /* 正文渲染 */
  const html = BlogMD.renderMarkdown(post.markdown);
  articleEl.innerHTML = html;
  BlogUI.observeReveal(articleEl);

  /* 目录 */
  const tocItems = BlogMD.extractToc(html);
  const tocList = $("tocList");
  const tocBox = $("tocBox");
  if (tocItems.length === 0) {
    tocBox.hidden = true;
  } else {
    tocList.innerHTML = tocItems.map(function (it) {
      return '<a class="lv' + it.level + '" href="#' + it.id + '" data-h="' + it.id + '">' +
        BlogMD.escapeHtml(it.text) + '</a>';
    }).join("");
    /* 滚动监听：高亮当前小节 */
    const links = tocList.querySelectorAll("a");
    const headings = tocItems.map(function (it) { return document.getElementById(it.id); }).filter(Boolean);
    function refreshActive() {
      const scrollY = window.scrollY + 120;
      let current = headings[0];
      headings.forEach(function (h) { if (h.offsetTop <= scrollY) current = h; });
      links.forEach(function (a) {
        a.classList.toggle("active", current && a.getAttribute("data-h") === current.id);
      });
    }
    window.addEventListener("scroll", refreshActive, { passive: true });
    refreshActive();
  }

  /* 上一篇 / 下一篇（列表按时间倒序：idx-1 是更新的一篇） */
  const prev = posts[idx + 1]; // 更早
  const next = posts[idx - 1]; // 更新
  if (prev || next) {
    $("postNav").hidden = false;
    const pv = $("navPrev"), nx = $("navNext");
    if (prev) {
      pv.href = "post.html?p=" + encodeURIComponent(prev.id);
      pv.querySelector(".t").textContent = prev.title;
    } else { pv.style.display = "none"; }
    if (next) {
      nx.href = "post.html?p=" + encodeURIComponent(next.id);
      nx.querySelector(".t").textContent = next.title;
    } else { nx.style.display = "none"; }
  }
})();
