/* =========================================================
 * 数据访问层（纯静态版）
 * 文章数据来自本地 assets/data/posts.json，无需任何后端/数据库
 * 发文章 = 编辑 posts.json（或新增 md 后生成）→ git 提交 → 自动上线
 * ========================================================= */
(function () {
  /* 统一字段结构（兼容旧数据里的 _id / slug 等字段） */
  function normalizePost(doc) {
    return {
      id: doc._id || doc.slug || "local-" + Math.random().toString(36).slice(2, 9),
      slug: doc.slug || "",
      title: doc.title || "无题",
      category: doc.category || "随笔",
      tags: Array.isArray(doc.tags) ? doc.tags : [],
      summary: doc.summary || "",
      markdown: doc.markdown || "",
      date: (doc.date || "").slice(0, 10),
      published: doc.published !== false,
    };
  }

  function sortByDateDesc(list) {
    return list.slice().sort(function (a, b) { return b.date.localeCompare(a.date); });
  }

  /* 读取全部已发布文章（直接读本地 JSON） */
  async function fetchAllPosts() {
    const res = await fetch("assets/data/posts.json");
    const list = await res.json();
    return {
      posts: sortByDateDesc(list.filter(function (p) { return p.published !== false; }).map(normalizePost)),
      source: "local",
    };
  }

  window.BlogAPI = {
    fetchAllPosts: fetchAllPosts,
    normalizePost: normalizePost,
  };
})();
