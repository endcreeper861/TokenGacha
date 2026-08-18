"use strict";
/* ================================================================
   TokenGacha · js/core/loop.js — 中央 tick 引擎 (Phase 0 骨架)
   每秒结算一次经济; 各 game 模块通过 onTick() 注册回调
   tick 后只走 renderDynamic() 局部刷新; renderAll() 仅离散事件触发
   ================================================================ */

const TICK_HANDLERS = [];
function onTick(fn) { TICK_HANDLERS.push(fn); }

function tick() {
  for (const fn of TICK_HANDLERS) {
    try { fn(); } catch (e) { console.error('[tick]', e); }
  }
  renderDynamic();
}
setInterval(tick, 1000);

// 局部刷新: 仅更新头部资源数字 + 资产页余额 + 阶段五 AGI 研究面板（廉价路径）
function renderDynamic() {
  renderHeader();
  tweenMoney();
  if (typeof updateBalanceDynamic === 'function') updateBalanceDynamic();
  if (typeof updateAgiDynamic === 'function') updateAgiDynamic();
  if (typeof updateMarketAffordability === 'function') updateMarketAffordability();
  if (typeof updateAutoBuyStatus === 'function') updateAutoBuyStatus();
  const workPage = $('page-work');
  if (workPage && workPage.classList.contains('active') && typeof renderWork === 'function') renderWork();
}

/* ---------- dev 调试钩子 ---------- */
window.TG = {
  get S() { return S; },          // 实时引用（S 会被重开档重新赋值）
  save,
  addMoney(amt) { S.money += amt; if (amt > 0) S.stats.earn += amt; S.peakMoney = Math.max(S.peakMoney, S.money); save(); renderAll(); },
  addRp(amt) {
    if (!S.agi) S.agi = { points: 0, earned: 0, spent: 0, final: 0, auto: false, lastLogAt: 0, milestones: {} };
    S.agi.earned += amt;
    S.agi.points += amt;
    save(); renderAll();
  },
  finishAgi() {
    if (!S.agi) S.agi = { points: 0, earned: 0, spent: 0, final: 0, auto: false, lastLogAt: 0, milestones: {} };
    S.agi.earned = Math.max(S.agi.earned || 0, AGI_RP_TOTAL);
    S.agi.points = 0;
    S.agi.final = AGI_FINAL_RP;
    S.aiRatio = 1;
    if (typeof checkAGI === 'function') checkAGI();
    save(); renderAll();
  },
  skipTo(stage) { S.stage = Math.max(S.stage, stage); save(); renderAll(); },
};
