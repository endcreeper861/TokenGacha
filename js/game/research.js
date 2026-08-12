"use strict";
/* ================================================================
   TokenGacha · js/game/research.js — 模型研发系统 (Phase 5)
   研究员雇佣 / 工资秒扣 / 研究进度 / 灵感迸发 / 超级模型 AGI-X
   ================================================================ */

const RESEARCH_BASE = 0.012; // %/s 基准速率（Phase 7.1 调校: 1 初级 ≈ 2.3h 到 100%, 原 0.05）

// 雇佣研究员（雇佣即解锁阶段四）
function hireResearcher(key) {
  const r = RESEARCHERS[key];
  if (!r) return;
  if (S.money < r.req) { toast('💸 雇佣条件不满足（需余额 ≥ ' + fmt(r.req) + '）'); SFX.bad(); return; }
  // 人才猎头：新雇员前 10 分钟 ×1.5（记录雇佣时刻）
  S.research.staff[key] = (S.research.staff[key] || 0) + 1;
  S.research.lastHireAt = Date.now();
  addLedger(`👥 雇佣 ${r.name}`, 0);
  save(); renderAll();
  SFX.coin();
  toast(`👥 ${r.name} 已入职！开始推进研究`);
}

// 某档研究员当前人数
function staffCount(key) { return S.research.staff[key] || 0; }
// 总人数
function totalStaff() {
  return RESEARCHER_ORDER.reduce((s, k) => s + staffCount(k), 0);
}
// 某档边际递减合计：Σ1/√i（i=1..n）
function staffDiminish(n) {
  let v = 0;
  for (let i = 1; i <= n; i++) v += 1 / Math.sqrt(i);
  return v;
}
// 研究速度总量 %/s（0.05% × Σ(档速度 × Σ1/√i)）
function researchSpeed() {
  if (totalStaff() === 0) return 0;
  let sum = 0;
  for (const k of RESEARCHER_ORDER) {
    const r = RESEARCHERS[k];
    sum += r.speed * staffDiminish(staffCount(k));
  }
  let v = RESEARCH_BASE * sum * headhuntBoost();
  // S4 升级：预印本 +20% / GPU 集群 ×1.5 / 开源社区 每已解锁模型 +2%
  if (S.upgrades.s4_paper) v *= 1.2;
  if (S.upgrades.s4_cluster) v *= 1.5;
  if (S.upgrades.s4_oss) v *= 1 + 0.02 * Object.keys(S.dex).length;
  // Phase 6.2: 技术乘区（自主迭代 +50% / 工具使用 ×3）
  v *= techResearchMult();
  return v;
}
// 人才猎头：新雇员前 10 分钟 ×1.5（按雇用时刻标记）
function headhuntBoost() {
  if (!S.upgrades.s4_hunter || !S.research.lastHireAt) return 1;
  return Date.now() - S.research.lastHireAt < 10 * 60 * 1000 ? 1.5 : 1;
}
// 工资总额 ¥/秒（月薪/600，秒扣）
function wagePerSec() {
  let w = 0;
  for (const k of RESEARCHER_ORDER) {
    w += staffCount(k) * RESEARCHERS[k].salary;
  }
  return w / 600;
}

// 灵感迸发：每分钟 2% 概率，进度 +10%
function maybeInspiration() {
  if (totalStaff() === 0) return;
  if (Math.random() < 0.02) {
    S.research.progress = Math.min(100, S.research.progress + 10);
    S.stats.breakthroughs++;
    save(); renderAll();
    SFX.win();
    toast('💡 灵感迸发！研究进度 +10%');
  }
}
// 学术会议事件（S4 升级）：双倍进度 60s
let conferenceUntil = 0;
function startConference() {
  conferenceUntil = Date.now() + 60000;
  toast('🎓 学术会议召开！60 秒内研究速度 ×2', 4000);
  SFX.win();
}
function conferenceActive() { return S.upgrades.s4_conf && Date.now() < conferenceUntil; }

// tick: 研究进度 + 工资 + 灵感 + 学术会议
onTick(() => {
  if (S.stage < 4 || totalStaff() === 0) return;
  // 学术会议随机触发（有升级时，每分钟 ~1% 概率）
  if (S.upgrades.s4_conf && !conferenceActive() && Math.random() < 0.01 / 60) startConference();
  // 进度（学术会议双倍）
  const spd = researchSpeed() * (conferenceActive() ? 2 : 1);
  S.research.progress = Math.min(100, S.research.progress + spd);
  // 工资秒扣（余额不足扣到 0）
  const wage = wagePerSec();
  if (wage > 0) {
    const pay = Math.min(S.money, wage);
    S.money -= pay;
    S.stats.wages += pay;
  }
  // 灵感迸发：maybeInspiration 内部已有 2% 判定，此处仅按秒取样（每分钟一次取样）
  if (Math.random() < 1 / 60) maybeInspiration();
  // 研究 100% → 超级模型
  if (S.research.progress >= 100 && !S.research.done) {
    S.research.progress = 100;
    S.research.done = true;
    save(); renderAll();
    unlockSuperModel();
  }
  save();
});

/* ---------- Phase 5.4: 超级模型 AGI-X ---------- */
// 恢复运行时注入（reload 后 RARITY.EX/MMAP.agix 丢失，存档里有 agix 时需重建）
function ensureSuperModel() {
  if (S.research.done || S.flags.superModel || S.dex.agix) {
    if (!MMAP.agix) {
      MMAP.agix = { ...SUPER_MODEL };
      RARITY.EX = { name: 'EX', label: '超级', hex: '#0d9488', min: 90, max: 100, tasks: 30, basePay: 120, quota: 8000000 };
    }
  }
}
ensureSuperModel();

function unlockSuperModel() {
  // 运行时注入 MMAP（EX 稀有度入图鉴、机房可部署、q=1.0、报酬 UR×1.5）
  if (!MMAP.agix) {
    MMAP.agix = { ...SUPER_MODEL };
    // EX basePay = UR basePay(80) ×1.5 = 120
    RARITY.EX = { name: 'EX', label: '超级', hex: '#0d9488', min: 90, max: 100, tasks: 30, basePay: 120, quota: 8000000 };
  }
  S.dex.agix = (S.dex.agix || 0) + 1;
  S.stats.best = 'agix';
  S.flags.superModel = true;
  addLedger('🧠 超级模型 AGI-X 研发完成！', 0);
  save(); renderAll();
  SFX.win();
  burst(innerWidth / 2, innerHeight / 3, ['#0d9488', '#f59e0b', '#2f6bff', '#fff'], 320, 13);
  setTimeout(() => showModal(superModelHTML()), 400);
}

// 超级模型庆祝弹窗
function superModelHTML() {
  return `<div class="end-title">🧠 AGI-X 研发完成！</div>
  <div class="end-sub">你亲手研发出智能指数 99 的超级模型。<br>它全面超越所有商业模型，机房可以部署它（32GB 显存），工作报酬 UR×1.5。</div>
  <div class="end-stats">
    <div class="cell"><div class="lb">研究用时</div><b>${fmt(S.stats.wages)} 工资投入</b></div>
    <div class="cell"><div class="lb">灵感迸发</div><b>${S.stats.breakthroughs} 次</b></div>
    <div class="cell"><div class="lb">当前余额</div><b>${fmt(S.money)}</b></div>
    <div class="cell"><div class="lb">累计收入</div><b>${fmt(S.stats.earn)}</b></div>
  </div>
  <button class="big-btn" onclick="closeModal()">🚀 进入阶段五 · AGI 之路</button>`;
}
