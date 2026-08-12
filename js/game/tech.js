"use strict";
/* ================================================================
   TokenGacha · js/game/tech.js — 技术树系统 (Phase 6)
   解锁校验 / 效果挂载 / AI 占比 / AGI 判定 / 沙盒
   ================================================================ */

// 解锁校验：金钱 + 前置技术
function canUnlockTech(id) {
  const t = TECHS[id];
  if (!t) return false;
  if (S.techs.includes(id)) return false;
  if (S.money < t.price) return false;
  return t.pre.every(p => S.techs.includes(p));
}
// 解锁技术
function unlockTech(id) {
  const t = TECHS[id];
  if (!t) return;
  if (S.techs.includes(id)) { toast('已解锁该技术'); return; }
  if (!canUnlockTech(id)) {
    const need = t.pre.filter(p => !S.techs.includes(p)).map(p => TECHS[p].name).join('、');
    toast(need ? `🔒 需先解锁：${need}` : '💸 金钱不足或条件不满足');
    SFX.bad();
    return;
  }
  S.money -= t.price;
  S.stats.spent += t.price;
  S.techs.push(id);
  S.aiRatio = aiRatio(); // 重算 AI 占比
  addLedger(`🧠 解锁技术 · ${t.name}`, -t.price);
  save(); renderAll();
  SFX.win();
  toast(`🧠 ${t.name} 已解锁！AI 占比 ${Math.round(S.aiRatio * 100)}%`);
  checkAGI();
}

/* ---------- 效果乘区 ---------- */
// 工作速度（混合注意力 +40%）
function techWorkSpeedMult() {
  return S.techs.includes('attention') ? 1.4 : 1;
}
// token 消耗（LRU 缓存 -20%）
function techTokenCostMult() {
  return S.techs.includes('lru') ? 0.8 : 1;
}
// 大成功率（注意力残差 +8% 绝对）
function techGreatBonus() {
  return S.techs.includes('residual') ? 0.08 : 0;
}
// 自产 token（推测解码 ×2）
function techSelfOutputMult() {
  return S.techs.includes('speculative') ? 2 : 1;
}
// 可部署模型数（MoE 路由 +50% 插槽等效：部署显存上限 ×1.5）
function techDeployVramMult() {
  return S.techs.includes('moe') ? 1.5 : 1;
}
// 删库率（强化对齐归零）
function techDisasterZero() {
  return S.techs.includes('align');
}
// 全收入（多模态融合 ×1.3）
function techIncomeMult() {
  return S.techs.includes('multimodal') ? 1.3 : 1;
}
// 研究速度（自主迭代 +50% / 工具使用 ×3）
function techResearchMult() {
  let m = 1;
  if (S.techs.includes('iterate')) m += 0.5;
  if (S.techs.includes('tools')) m *= 3;
  return m;
}

/* ---------- AI 占比 ---------- */
// 初始 5% + 每解锁技术增量
function aiRatio() {
  let v = 0.05;
  for (const id of TECH_ORDER) {
    if (S.techs.includes(id)) v += TECHS[id].ai / 100;
  }
  return Math.min(1, v);
}

/* ---------- AGI 判定 ---------- */
function checkAGI() {
  if (S.aiRatio >= 1 && !S.flags.agi) {
    S.flags.agi = true;
    S.stats.agiAt = Date.now();
    save(); renderAll();
    SFX.win();
    burst(innerWidth / 2, innerHeight / 3, ['#0d9488', '#f59e0b', '#2f6bff', '#ff5f6d', '#fff'], 400, 15);
    setTimeout(() => showModal(agiWinHTML()), 600);
  }
}

// 通关弹窗
function agiWinHTML() {
  const best = S.stats.best ? MMAP[S.stats.best] : null;
  const dur = (Date.now() - (S.stats.startedAt || Date.now())) / 1000;
  const durTxt = dur >= 3600 ? `${(dur / 3600).toFixed(1)} 小时` : `${Math.round(dur / 60)} 分钟`;
  const rows = [
    ['⏱️ 总时长', durTxt],
    ['💰 累计赚取', fmt(S.stats.earn)],
    ['🧠 技术数', `${S.techs.length}/9`],
    ['🏆 最佳模型', best ? best.name : '无'],
    ['💥 删库事故', S.stats.disasters],
    ['🎰 抽卡次数', S.stats.pulls],
    ['💼 工作单数', S.stats.tasks],
  ];
  return `<div class="end-title">🧠 AGI 达成！</div>
  <div class="end-sub">AI 研究员占比 100%，你亲手创造了自己的 AGI。<br>TokenGacha 中转站向你致敬。</div>
  <div class="end-stats">${rows.map(([l, v]) => `<div class="cell"><div class="lb">${l}</div><b>${v}</b></div>`).join('')}</div>
  <button class="big-btn" id="btn-sandbox">🎮 进入沙盒模式</button>
  <button class="big-btn ghost" onclick="closeModal()">继续挂机</button>`;
}

/* ---------- 沙盒模式 ---------- */
let sandboxed = false;
function enterSandbox() {
  sandboxed = true;
  S.money = 1e12;
  S.stats.earn = 1e12;
  for (const u of Object.values(UPGRADES)) S.upgrades[u.id] = true;
  for (const id of TECH_ORDER) if (!S.techs.includes(id)) S.techs.push(id);
  S.aiRatio = 1;
  S.peakMoney = 1e12;
  S.research.progress = 100;
  S.research.done = true;
  save(); closeModal(); renderAll();
  SFX.win();
  toast('🎮 沙盒模式！金钱 ¥10^12，全部解锁，享受数字飞涨', 4000);
  // 确保 AGI-X 注入并点亮图鉴（若研究未完成；unlockSuperModel 会弹庆祝窗，沙盒内免）
  ensureSuperModel();
  if (!S.dex.agix) {
    S.dex.agix = 1;
    S.flags.superModel = true;
    S.stats.best = 'agix';
    save();
  }
}
