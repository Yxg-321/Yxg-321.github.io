/* =========================================================
 * Markdown 渲染模块
 * 负责：Markdown -> HTML、代码高亮、标题锚点、目录提取、字数统计
 * ========================================================= */
(function () {
  if (window.marked) {
    marked.setOptions({ gfm: true, breaks: false });
  }

  function escapeHtml(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  /* 对渲染结果做后处理：标题加 id、代码高亮、表格包滚动层、外链新开 */
  function enhance(html) {
    const box = document.createElement("div");
    box.innerHTML = html;
    let i = 0;
    box.querySelectorAll("h2, h3").forEach(function (h) {
      h.id = "h-" + (i++);
      h.classList.add("anchor-heading");
    });
    box.querySelectorAll("pre code").forEach(function (block) {
      if (window.hljs) {
        try { hljs.highlightElement(block); } catch (e) { /* 忽略高亮失败 */ }
      }
      block.classList.add("hljs");
    });
    box.querySelectorAll("table").forEach(function (t) {
      if (t.parentElement && t.parentElement.classList.contains("table-wrap")) return;
      const wrap = document.createElement("div");
      wrap.className = "table-wrap";
      t.parentNode.insertBefore(wrap, t);
      wrap.appendChild(t);
    });
    box.querySelectorAll("a[href^='http']").forEach(function (a) {
      a.target = "_blank";
      a.rel = "noopener";
    });
    return box.innerHTML;
  }

  function renderMarkdown(md) {
    return enhance(window.marked.parse(md || ""));
  }

  /* 从渲染后的 HTML 里提取目录（h2 / h3） */
  function extractToc(html) {
    const box = document.createElement("div");
    box.innerHTML = html;
    const items = [];
    box.querySelectorAll("h2, h3").forEach(function (h) {
      items.push({
        id: h.id,
        text: h.textContent,
        level: h.tagName === "H2" ? 2 : 3,
      });
    });
    return items;
  }

  /* 统计字数与阅读时长 */
  function countStats(md) {
    const text = (md || "")
      .replace(/```[\s\S]*?```/g, "")
      .replace(/`[^`]*`/g, "")
      .replace(/<[^>]+>/g, "")
      .replace(/\s+/g, "");
    const chars = text.length;
    return { chars: chars, minutes: Math.max(1, Math.round(chars / 450)) };
  }

  /* 从正文自动截取摘要 */
  function autoSummary(md, max) {
    max = max || 78;
    const text = (md || "")
      .replace(/```[\s\S]*?```/g, "")
      .replace(/[#>*`!\[\]\(\)-]/g, "")
      .replace(/\s+/g, "")
      .trim();
    return text.length > max ? text.slice(0, max) + "……" : text;
  }

  window.BlogMD = {
    escapeHtml: escapeHtml,
    renderMarkdown: renderMarkdown,
    extractToc: extractToc,
    countStats: countStats,
    autoSummary: autoSummary,
  };
})();
