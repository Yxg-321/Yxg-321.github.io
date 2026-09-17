/* =========================================================
 * 留言板：读取留言列表 + 发布新留言
 * ========================================================= */
(function () {
  const $ = function (id) { return document.getElementById(id); };
  const form = $("gbForm");
  if (!form) return;

  const listEl = $("gbList");
  const countEl = $("gbCount");
  const metaEl = $("gbMeta");
  const stateEl = $("gbState");

  function esc(s) { return BlogMD.escapeHtml(s); }

  function fmtTime(t) {
    if (!t) return "";
    const d = new Date(t);
    if (isNaN(d.getTime())) return String(t).slice(0, 16).replace("T", " ");
    const p = function (n) { return n < 10 ? "0" + n : "" + n; };
    return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate()) + " " +
      p(d.getHours()) + ":" + p(d.getMinutes());
  }

  /* 生成默认头像：用昵称首字 + 固定配色 */
  function avatarHtml(name) {
    const first = (name || "匿").trim().charAt(0);
    return '<div class="gb-avatar" style="display:grid;place-items:center;background:var(--accent-weak);color:var(--accent-deep);font-family:var(--serif);font-size:18px;">' +
      esc(first) + '</div>';
  }

  async function loadList() {
    try {
      const list = await BlogAPI.fetchMessages();
      countEl.textContent = list.length;
      listEl.innerHTML = "";
      if (list.length === 0) {
        listEl.innerHTML = '<li class="gb-empty">还没有留言，来做第一个说话的人吧。</li>';
        return;
      }
      list.forEach(function (m) {
        const li = document.createElement("li");
        li.className = "gb-item reveal";
        li.innerHTML =
          '<div class="gb-item-head">' +
            avatarHtml(m.name) +
            '<span class="gb-name">' + esc(m.name) + '</span>' +
            '<span class="gb-time">' + esc(fmtTime(m.time)) + '</span>' +
          '</div>' +
          '<p class="gb-text">' + esc(m.text) + '</p>';
        listEl.appendChild(li);
      });
      BlogUI.observeReveal(listEl);
    } catch (e) {
      listEl.innerHTML = '<li class="gb-empty">留言加载失败：' + esc(e.message) + '</li>';
    }
  }

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    const name = $("gbName").value.trim() || "匿名访客";
    const text = $("gbText").value.trim();
    if (!text) {
      stateEl.textContent = "留言内容不能为空";
      $("gbText").focus();
      return;
    }
    const btn = $("gbSubmit");
    btn.disabled = true;
    stateEl.textContent = "发布中…";
    try {
      await BlogAPI.createMessage(name, text);
      $("gbText").value = "";
      stateEl.textContent = "留言成功，感谢你的分享 ✓";
      await loadList();
    } catch (ex) {
      stateEl.textContent = ex.message;
    } finally {
      btn.disabled = false;
      setTimeout(function () { stateEl.textContent = ""; }, 4000);
    }
  });

  loadList();
})();
