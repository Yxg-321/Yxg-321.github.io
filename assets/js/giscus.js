/* =========================================================
 * Giscus 评论加载器
 * 参数从 config.js 的 SITE.giscus 读取，未配置时显示提示
 * ========================================================= */
(function () {
  const box = document.getElementById("giscus-container");
  if (!box) return;

  const g = SITE.giscus || {};
  // Giscus 需要：repo（"用户名/仓库名"）、repoId、category、categoryId
  if (!g.repo || !g.repoId || !g.category || !g.categoryId) {
    box.innerHTML =
      '<p class="muted" style="text-align:center;padding:20px 0;">' +
      '留言功能即将上线：请先在 config.js 的 <code>giscus</code> 字段填入 Giscus 参数。' +
      '</p>';
    return;
  }

  const script = document.createElement("script");
  script.src = "https://giscus.app/client.js";
  script.async = true;
  script.crossOrigin = "anonymous";
  script.setAttribute("data-repo", g.repo);
  script.setAttribute("data-repo-id", g.repoId);
  script.setAttribute("data-category", g.category);
  script.setAttribute("data-category-id", g.categoryId);
  script.setAttribute("data-mapping", g.mapping || "pathname");
  script.setAttribute("data-strict", "0");
  script.setAttribute("data-reactions-enabled", g.reactions !== false ? "1" : "0");
  script.setAttribute("data-emit-metadata", "0");
  script.setAttribute("data-input-position", g.inputPosition || "top");
  script.setAttribute("data-theme", g.theme || "preferred_color_scheme");
  script.setAttribute("data-lang", g.lang || "zh-CN");
  script.setAttribute("data-loading", "lazy");
  box.appendChild(script);
})();
