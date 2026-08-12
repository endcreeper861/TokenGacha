"use strict";
/* ================================================================
   TokenGacha · js/ui/router.js — 页面路由 (Phase 1: 六页)
   ================================================================ */

/* ---------- 路由 ---------- */
const PAGES = ['dashboard', 'market', 'work', 'gpu', 'lab', 'assets'];
function go(page) {
  if (!PAGES.includes(page)) page = 'dashboard';
  for (const p of PAGES) {
    $('page-' + p).classList.toggle('active', p === page);
  }
  document.querySelectorAll('.top-nav button').forEach(b => b.classList.toggle('active', b.dataset.page === page));
  if (location.hash !== '#' + page) history.replaceState(null, '', '#' + page);
  renderAll();
}
document.querySelectorAll('.top-nav button').forEach(b => b.onclick = () => { SFX.click(); go(b.dataset.page); });
// 仪表盘快捷入口按钮委托（data-go 属性）
document.addEventListener('click', e => {
  const b = e.target.closest('[data-go]');
  if (b) { SFX.click(); go(b.dataset.go); }
});
addEventListener('hashchange', () => go(location.hash.slice(1)));

