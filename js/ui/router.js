"use strict";
/* ================================================================
   TokenGacha · js/ui/router.js — 页面路由
   ================================================================ */

/* ---------- 路由 ---------- */
const PAGES = ['buy', 'work', 'balance'];
function go(page) {
  if (!PAGES.includes(page)) page = 'buy';
  for (const p of PAGES) {
    $('page-' + p).classList.toggle('active', p === page);
  }
  document.querySelectorAll('.top-nav button').forEach(b => b.classList.toggle('active', b.dataset.page === page));
  if (location.hash !== '#' + page) history.replaceState(null, '', '#' + page);
  renderAll();
}
document.querySelectorAll('.top-nav button').forEach(b => b.onclick = () => { SFX.click(); go(b.dataset.page); });
addEventListener('hashchange', () => go(location.hash.slice(1)));

