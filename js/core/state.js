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
    ver: 5, stage: 1, money: 0, inv: [], uid: 1,
    pity: { newbie: 0, standard: 0, flagship: 0 }, ledger: [],
    // 五阶段增量字段 (Phase 0.6 起)
    peakMoney: 0,                                   // 历史最高余额 (阶段解锁判定)
    clicker: { clicks: 0, progress: 0 },            // 阶段一: 点击器进度
    upgrades: {},                                   // 已购升级 id -> true
    gpus: { pcie: 2, cards: [], deployed: {} },     // 阶段三: PCIe 插槽/显卡/部署
    research: { progress: 0, done: false, lastHireAt: null, staff: { junior: 0, senior: 0, chief: 0 } }, // 阶段四
    techs: [],                                      // 阶段五: 已解锁技术 id
    aiRatio: 0.05,                                  // AI 占比 (AGI 判定, 初始 5%)
    agi: { points: 0, earned: 0, spent: 0, final: 0, auto: false, lastLogAt: 0, milestones: {} }, // 阶段五 AGI 研究点
    marketEvt: null,                                // 限时市场事件
    stats: { pulls: 0, earn: 0, spent: 0, tasks: 0, best: '', disasters: 0, greats: 0, clicks: 0, selfTokens: 0, elecCost: 0, wages: 0, breakthroughs: 0, agiAt: null, startedAt: Date.now(), byR: { N: 0, R: 0, SR: 0, SSR: 0, UR: 0 } },
    dex: {}, flags: { welcomed: false, ms: {}, stageBanners: {}, marketOpen: false, labHint: false, agi: false, superModel: false, manipAt: null, muted: false, cheated: false, agiMs: {} }
  };
}
function save() { try { localStorage.setItem('tokengacha_v3', JSON.stringify(S)); } catch (e) { } }
function load() {
  try {
    const s = JSON.parse(localStorage.getItem('tokengacha_v3'));
    if (s && (s.ver === 4 || s.ver === 5) && typeof s.money === 'number') {
      if (s.ver === 4) migrateV4toV5(s);
      return s;
    }
  } catch (e) { }
  return null;
}

// ver=4 → 5：新增 AGI 研究点；旧档已解锁技术直接计入累计，避免重复肝
function migrateV4toV5(s) {
  s.ver = 5;
  if (!s.agi) s.agi = { points: 0, earned: 0, spent: 0, final: 0, auto: false, lastLogAt: 0, milestones: {} };
  if (!s.agi.milestones) s.agi.milestones = {};
  if (!s.flags) s.flags = {};
  if (!s.flags.agiMs) s.flags.agiMs = {};
  if (Array.isArray(s.techs) && s.techs.length) {
    const spent = s.techs.reduce((sum, id) => sum + (TECHS[id] ? TECHS[id].rp : 0), 0);
    s.agi.spent = Math.max(s.agi.spent || 0, spent);
    s.agi.earned = Math.max(s.agi.earned || 0, s.agi.spent + (s.agi.final || 0));
  }
  if (s.flags.agi) {
    s.agi.final = AGI_FINAL_RP;
    s.agi.earned = Math.max(s.agi.earned || 0, (s.agi.spent || 0) + AGI_FINAL_RP);
  }
}
S = load() || defaultState();
muted = !!S.flags.muted;

const totalTokens = () => S.inv.reduce((s, c) => s + c.tokens, 0);
const totalTasks = () => Math.floor(totalTokens() / TASK_TOKENS);
