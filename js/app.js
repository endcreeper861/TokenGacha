"use strict";
/* ================================================================
   TokenGacha · LLM API 抽卡模拟器 (浅色中转站版)
   稀有度依据 Artificial Analysis Intelligence Index v4.1 分档
   图标: @lobehub/icons (unpkg + npmmirror 双 CDN 兜底)
   ================================================================
   Phase 0 · 模块化拆分: 数据/核心/游戏/UI 逻辑已迁出
   本文件仅保留: 事件绑定 + 启动引导
   ================================================================ */

/* ---------- 事件绑定 ---------- */
$('btn-click').onclick = clickerClick;
$('btn-work').onclick = doWork;
$('btn-auto').onclick = doAuto;
$('btn-auto-toggle').onclick = toggleAuto;
$('btn-sell').onclick = sellSelfTokens;
$('go-work').onclick = () => go('work');
$('btn-rates').onclick = () => { SFX.click(); showModal(ratesHTML()); };
$('btn-dex').onclick = () => { SFX.click(); dexHTML(); };
$('btn-help').onclick = () => { SFX.click(); showModal(helpHTML()); };
$('btn-copy-key').onclick = () => { SFX.click(); toast('🔑 令牌已复制（假的，别往代码里贴）'); };
$('btn-share').onclick = () => { SFX.click(); openShare(null); };
$('btn-topup').onclick = () => { SFX.click(); showModal(topupHTML()); const inp = $('topup-amt'); if (inp) { inp.addEventListener('keydown', e => { if (e.key === 'Enter') doTopup(); }); inp.focus && inp.focus(); } };
document.addEventListener('keydown', e => {
  if (e.target.tagName === 'INPUT') return;
  if (e.code === 'Space') {
    e.preventDefault();
    if (!$('modal-mask').classList.contains('show') && !$('overlay').classList.contains('show') && $('page-work').classList.contains('active')) doWork();
  }
});
document.addEventListener('click', e => {
  if (e.target.id === 'btn-reset') { localStorage.removeItem('tokengacha_v3'); location.reload(); }
  if (e.target.id === 'btn-start') { S.flags.welcomed = true; save(); closeModal(); SFX.win(); toast('🎁 欢迎来到 TokenGacha！先去工作台写代码赚钱'); renderAll(); }
  if (e.target.dataset && e.target.dataset.shareMs) { SFX.click(); const ms = MILESTONES.find(m => m.id === e.target.dataset.shareMs); if (ms) openShare(ms); }
  if (e.target.id === 'btn-copy-share') { SFX.click(); copyText(shareText(shareCtx.ms)); }
  if (e.target.id === 'btn-dl-share') { SFX.click(); const a = document.createElement('a'); a.href = shareCtx.cv.toDataURL('image/png'); a.download = 'tokengacha-share.png'; a.click(); toast('🖼️ 分享图已保存'); }
  if (e.target.id === 'btn-sys-share' && typeof navigator !== 'undefined' && navigator.share) { navigator.share({ title: 'TokenGacha · LLM API 中转站', text: shareText(shareCtx.ms), url: SITE_URL }).catch(() => { }); }
  if (e.target.id === 'btn-do-topup') { doTopup(); }
  if (e.target.id === 'btn-sandbox') { enterSandbox(); }
  if (e.target.dataset && e.target.dataset.amt) { const inp = $('topup-amt'); if (inp) inp.value = e.target.dataset.amt; SFX.click(); }
});

/* ---------- 启动 ---------- */
$('notice-text').textContent = pick(NOTICES);
scheduleMarketEvt(); // Phase 4.5: 限时市场事件调度
go(location.hash.slice(1) || 'dashboard');
if (!S.flags.welcomed) { showModal(welcomeHTML()); }
else checkEnd();
