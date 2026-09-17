/* =========================================================
 * 游的个人博客 · 站点配置
 * 想改名字 / 头像 / 背景图 / 副标题，只需要改这个文件。
 * ========================================================= */
const SITE = {
  /* ---- 站点信息（改成你自己的）---- */
  title: "游的个人博客",                     // 博客标题
  subtitle: "记录学习 · 整理思路 · 慢慢发光",  // 首页副标题
  owner: "游",                              // ← 你的昵称
  slogan: "把学到的东西写下来，才算真的学会。",
  avatar: "assets/images/avatar.jpg",       // 头像：换成你的图片路径即可
  bg: "assets/images/bg.jpg",               // 背景图
  music: "",                                // 全局音乐按钮播放的音频地址（mp3 等，留空则按钮点击后提示无音源）

  /* ---- 留言（Giscus 评论，基于 GitHub Discussions）----
   * 填入后留言板即可用，参数获取方式见 giscus.app
   * 填写示例：
   * repo: "Yxg-321/Yxg-321.github.io",
   * repoId: "R_kgDOxxxxxx",
   * category: "Announcements",
   * categoryId: "DIC_kwDOxxxxxx",
   */
  giscus: {
    repo: "",
    repoId: "",
    category: "",
    categoryId: "",
    mapping: "pathname",
    theme: "preferred_color_scheme",
    lang: "zh-CN",
  },

  /* ---- 页脚 ---- */
  since: "2026",
  footerNote: "由 GitHub Pages 驱动",
};
window.SITE = SITE;
