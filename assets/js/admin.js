/* =========================================================
 * 管理后台：登录、文章列表、Markdown 编辑与发布
 * ========================================================= */
(function () {
  const $ = function (id) { return document.getElementById(id); };
  const ADMIN_FLAG = "blog_admin_flag";
  const DRAFT_KEY = "blog_admin_draft";

  const gate = $("gate");
  const panel = $("panel");
  if (!gate || !panel) return;

  let editingId = null;   // 正在编辑的文章 ID（null = 新建）
  let cache = [];         // 全部文章缓存
  let saveTimer = null;

  function esc(s) { return BlogMD.escapeHtml(s); }

  function state(msg, keep) {
    $("saveState").textContent = msg || "";
    if (!keep && msg) {
      clearTimeout(saveTimer);
      saveTimer = setTimeout(function () { $("saveState").textContent = ""; }, 4000);
    }
  }

  /* ---------- 登录 / 登出 ---------- */
  async function isAdminFlagged() {
    return localStorage.getItem(ADMIN_FLAG) === "1";
  }

  async function showPanel() {
    gate.hidden = true;
    panel.hidden = false;
    if (!$("fDate").value) $("fDate").value = BlogUI.today();
    try {
      await loadList();
    } catch (e) {
      $("adminMeta").textContent = "加载失败：" + e.message;
    }
    restoreDraft();
  }

  async function showGate() {
    gate.hidden = false;
    panel.hidden = true;
  }

  $("loginForm").addEventListener("submit", async function (e) {
    e.preventDefault();
    const btn = $("btnLogin");
    const err = $("loginError");
    err.hidden = true;
    btn.disabled = true;
    btn.textContent = "登录中…";
    try {
      await BlogAPI.adminLogin($("loginUser").value.trim(), $("loginPass").value);
      localStorage.setItem(ADMIN_FLAG, "1");
      $("loginPass").value = "";
      await showPanel();
    } catch (ex) {
      err.textContent = ex.message;
      err.hidden = false;
    } finally {
      btn.disabled = false;
      btn.textContent = "登 录";
    }
  });

  $("btnLogout").addEventListener("click", async function () {
    try { await BlogAPI.adminLogout(); } catch (e) { /* 忽略登出错误 */ }
    localStorage.removeItem(ADMIN_FLAG);
    await showGate();
  });

  /* ---------- 文章列表 ---------- */
  async function loadList() {
    $("adminMeta").textContent = "加载中…";
    cache = await BlogAPI.listAllPosts();
    const published = cache.filter(function (p) { return p.published; }).length;
    $("adminMeta").textContent = "共 " + cache.length + " 篇 · 已发布 " + published + " 篇";
    $("postCount").textContent = cache.length;

    /* 分类下拉提示 */
    const cats = [];
    cache.forEach(function (p) { if (cats.indexOf(p.category) === -1) cats.push(p.category); });
    $("catList").innerHTML = cats.map(function (c) { return "<option value=\"" + esc(c) + "\">"; }).join("");

    /* 表格 */
    const tbody = $("postRows");
    if (cache.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="muted">还没有文章，写第一篇吧。</td></tr>';
      return;
    }
    tbody.innerHTML = cache.map(function (p) {
      return '<tr>' +
        '<td class="t-title" title="' + esc(p.title) + '">' + esc(p.title) + '</td>' +
        '<td>' + esc(p.category) + '</td>' +
        '<td>' + esc(BlogUI.fmtDate(p.date)) + '</td>' +
        '<td><span class="status-pill ' + (p.published ? "status-on" : "status-off") + '">' +
          (p.published ? "已发布" : "已下线") + '</span></td>' +
        '<td><div class="row-actions">' +
          '<button class="btn btn-sm" data-act="edit" data-id="' + p.id + '">编辑</button>' +
          '<button class="btn btn-sm" data-act="toggle" data-id="' + p.id + '">' + (p.published ? "下线" : "上线") + '</button>' +
          '<button class="btn btn-sm btn-danger" data-act="del" data-id="' + p.id + '">删除</button>' +
        '</div></td>' +
      '</tr>';
    }).join("");
  }

  $("postRows").addEventListener("click", async function (e) {
    const btn = e.target.closest("[data-act]");
    if (!btn) return;
    const act = btn.getAttribute("data-act");
    const id = btn.getAttribute("data-id");
    const p = cache.find(function (x) { return x.id === id; });
    if (!p) return;

    if (act === "edit") {
      startEdit(p);
      $("editorTitle").scrollIntoView({ behavior: "smooth", block: "center" });
    } else if (act === "toggle") {
      btn.disabled = true;
      try {
        await BlogAPI.updatePost(id, { published: !p.published });
        state(p.published ? "已下线" : "已发布");
        await loadList();
      } catch (ex) {
        btn.disabled = false;
        state(ex.message);
      }
    } else if (act === "del") {
      if (!confirm("确定删除《" + p.title + "》吗？删除后不可恢复。")) return;
      btn.disabled = true;
      try {
        await BlogAPI.deletePost(id);
        if (editingId === id) resetForm();
        state("已删除");
        await loadList();
      } catch (ex) {
        btn.disabled = false;
        state(ex.message);
      }
    }
  });

  /* ---------- 编辑器 ---------- */
  function startEdit(p) {
    editingId = p.id;
    $("fTitle").value = p.title;
    $("fCategory").value = p.category;
    $("fTags").value = p.tags.join(", ");
    $("fSummary").value = p.summary;
    $("fDate").value = p.date || BlogUI.today();
    $("fMarkdown").value = p.markdown;
    $("fPublished").checked = p.published;
    $("editorTitle").textContent = "编辑文章：" + p.title;
    $("btnSave").textContent = "保存修改";
    $("btnCancel").hidden = false;
    renderPreview();
    localStorage.removeItem(DRAFT_KEY);
    state("正在编辑，修改后记得保存");
  }

  function resetForm() {
    editingId = null;
    $("fTitle").value = "";
    $("fCategory").value = "";
    $("fTags").value = "";
    $("fSummary").value = "";
    $("fDate").value = BlogUI.today();
    $("fMarkdown").value = "";
    $("fPublished").checked = true;
    $("editorTitle").textContent = "新建文章";
    $("btnSave").textContent = "发布文章";
    $("btnCancel").hidden = true;
    renderPreview();
    localStorage.removeItem(DRAFT_KEY);
  }

  $("btnNew").addEventListener("click", function () {
    resetForm();
    $("fTitle").focus();
    $("editorTitle").scrollIntoView({ behavior: "smooth", block: "center" });
  });
  $("btnCancel").addEventListener("click", resetForm);

  function collectPayload() {
    const markdown = $("fMarkdown").value;
    const summary = $("fSummary").value.trim() || BlogMD.autoSummary(markdown);
    const tags = $("fTags").value.split(/[,，]/).map(function (s) { return s.trim(); }).filter(Boolean);
    return {
      title: $("fTitle").value.trim(),
      category: $("fCategory").value.trim() || "随笔",
      tags: tags,
      summary: summary,
      markdown: markdown,
      date: $("fDate").value || BlogUI.today(),
      published: $("fPublished").checked,
    };
  }

  $("btnSave").addEventListener("click", async function () {
    const payload = collectPayload();
    if (!payload.title) { state("请填写标题"); $("fTitle").focus(); return; }
    if (!payload.markdown.trim()) { state("正文不能为空"); $("fMarkdown").focus(); return; }

    const btn = $("btnSave");
    btn.disabled = true;
    btn.textContent = editingId ? "保存中…" : "发布中…";
    try {
      if (editingId) {
        await BlogAPI.updatePost(editingId, payload);
        state(payload.published ? "已保存并发布 ✓" : "已保存（当前为下线状态）");
      } else {
        await BlogAPI.createPost(payload);
        state(payload.published ? "发布成功 ✓" : "已保存（当前为下线状态）");
        localStorage.removeItem(DRAFT_KEY);
      }
      resetForm();
      await loadList();
    } catch (ex) {
      state(ex.message);
    } finally {
      btn.disabled = false;
      btn.textContent = editingId ? "保存修改" : "发布文章";
    }
  });

  /* 实时预览 */
  let previewTimer = null;
  function renderPreview() {
    clearTimeout(previewTimer);
    previewTimer = setTimeout(function () {
      const md = $("fMarkdown").value;
      $("previewBody").innerHTML = md.trim()
        ? BlogMD.renderMarkdown(md)
        : '<span class="muted">（左侧正文会实时渲染在这里）</span>';
    }, 180);
  }
  $("fMarkdown").addEventListener("input", renderPreview);

  /* 未发布草稿自动暂存（仅新建模式） */
  function saveDraft() {
    if (editingId) return;
    const d = collectPayload();
    if (d.title || d.markdown) localStorage.setItem(DRAFT_KEY, JSON.stringify(d));
  }
  ["fTitle", "fCategory", "fTags", "fSummary", "fMarkdown"].forEach(function (fid) {
    $(fid).addEventListener("input", function () { saveDraft(); });
  });

  function restoreDraft() {
    if (editingId) return;
    let d = null;
    try { d = JSON.parse(localStorage.getItem(DRAFT_KEY) || "null"); } catch (e) { /* 忽略 */ }
    if (!d) return;
    if ($("fTitle").value || $("fMarkdown").value) return; // 表单非空则不覆盖
    $("fTitle").value = d.title || "";
    $("fCategory").value = d.category || "";
    $("fTags").value = (d.tags || []).join(", ");
    $("fSummary").value = d.summary || "";
    $("fMarkdown").value = d.markdown || "";
    renderPreview();
    state("已恢复上次未发布的草稿");
  }

  /* ---------- 启动 ---------- */
  (async function boot() {
    try {
      await BlogAPI.ensureSession();
    } catch (e) { /* 网络异常时仍显示登录门 */ }
    if (await isAdminFlagged()) {
      await showPanel();
    } else {
      await showGate();
    }
  })();
})();
