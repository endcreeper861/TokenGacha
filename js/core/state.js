"use strict";
/* ================================================================
   TokenGacha · js/core/state.js — 存档状态
   Phase 0.6 · 存档 v3 硬重置: key=tokengacha_v3, ver=4
   新增五阶段字段; 初始资金 ¥0; 删除全部旧迁移逻辑
   ================================================================ */

/* ---------- 状态 ---------- */
let S = null;
function defaultState() {
  return {
    ver: 4, stage: 1, money: 0, inv: [], uid: 1, freeTen: 1,
    pity: { newbie: 0, standard: 0, flagship: 0 }, ledger: [],
    // 五阶段增量字段 (Phase 0.6 起)
    peakMoney: 0,                                   // 历史最高余额 (阶段解锁判定)
    clicker: { clicks: 0, progress: 0 },            // 阶段一: 点击器进度
    upgrades: {},                                   // 已购升级 id -> true
    gpus: { pcie: 2, cards: [], deployed: {} },     // 阶段三: PCIe 插槽/显卡/部署
    research: { progress: 0, staff: { junior: 0, senior: 0, chief: 0 } }, // 阶段四
    techs: [],                                      // 阶段五: 已解锁技术 id
    aiRatio: 0.05,                                  // AI 占比 (AGI 判定, 初始 5%)
    marketEvt: null,                                // 限时市场事件
    stats: { pulls: 0, earn: 0, spent: 0, tasks: 0, best: '', disasters: 0, greats: 0, clicks: 0, selfTokens: 0, elecCost: 0, wages: 0, breakthroughs: 0, agiAt: null, startedAt: Date.now(), byR: { N: 0, R: 0, SR: 0, SSR: 0, UR: 0 } },
    dex: {}, flags: { welcomed: false, ms: {}, muted: false, cheated: false }
  };
}
function save() { try { localStorage.setItem('tokengacha_v3', JSON.stringify(S)); } catch (e) { } }
function load() {
  try {
    const s = JSON.parse(localStorage.getItem('tokengacha_v3'));
    if (s && s.ver === 4 && typeof s.money === 'number') return s;
  } catch (e) { }
  return null;
}
S = load() || defaultState();
muted = !!S.flags.muted;

const totalTokens = () => S.inv.reduce((s, c) => s + c.tokens, 0);
const totalTasks = () => Math.floor(totalTokens() / TASK_TOKENS);
