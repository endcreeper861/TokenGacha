"use strict";
/* ================================================================
   TokenGacha · js/game/stage.js — 阶段解锁系统 (Phase 1)
   isUnlocked 守卫 / checkStageUnlocks 自动检测 / 解锁横幅
   ================================================================ */

const STAGE_INFO = {
  1: { icon: '🔨', name: '阶段一 · 手写代码', tip: '点击「写代码」按钮完成订单，攒钱解锁市场' },
  2: { icon: '🤖', name: '阶段二 · AI 接单', tip: '去市场购买模型 token，在工作台接单变现' },
  3: { icon: '🖥️', name: '阶段三 · GPU 机房', tip: '购入显卡部署模型，自动产出纯净 token' },
  4: { icon: '🔬', name: '阶段四 · 模型研发', tip: '雇佣研究员推动研究，100% 后研发超级模型' },
  5: { icon: '🧠', name: '阶段五 · AGI 之路', tip: '解锁全部技术，AI 占比 100% 达成 AGI' },
};

// 阶段 N 解锁条件（ok 满足 / txt 文案）
function stageReq(stage) {
  switch (stage) {
    case 2: return { ok: S.peakMoney >= 500 && boughtToken(), txt: '余额曾达 ¥500 且购买第一个模型 token' };
    case 3: return { ok: S.peakMoney >= 5000 && S.gpus.cards.length > 0, txt: '余额曾达 ¥5,000 且购入第一张显卡' };
    case 4: return { ok: S.peakMoney >= 50000 && totalStaff() > 0, txt: '余额曾达 ¥50,000 且雇佣第一名研究员' };
    case 5: return { ok: S.research.progress >= 100, txt: '研究进度达到 100%' };
    default: return { ok: true, txt: '' };
  }
}

// 是否购买过 token（图鉴只增不减，防回退）
function boughtToken() {
  return !!(S.dex && Object.keys(S.dex).length > 0);
}
// 研究员总数（阶段四判定；research.js 提供 totalStaff）
// 页面/功能可用性守卫（阶段只增不减）
function isUnlocked(stage) { return S.stage >= stage; }

// 锁定占位 HTML（未解锁页面）
function lockedHTML(stage) {
  const info = STAGE_INFO[stage] || { name: '未知', icon: '🔒' };
  const req = stageReq(stage);
  return `<div class="locked-wrap">
    <div class="locked-art">${info.icon}</div>
    <div class="locked-title">${info.name} 未解锁</div>
    <div class="locked-txt">解锁条件：${req.txt}</div>
  </div>`;
}

// 阶段解锁检测：挂在 renderAll 尾部，满足条件即推进（不降级）
function checkStageUnlocks() {
  // Phase 2.4: peakMoney 首次 ≥¥500 → 市场购买区开放 + 引导横幅/toast
  if (S.peakMoney >= 500 && !S.flags.marketOpen) {
    S.flags.marketOpen = true;
    save();
    marketGuideBanner();
  }
  // Phase 4.7: peakMoney 首次 ≥¥50,000 → 实验室解锁引导横幅/toast
  if (S.peakMoney >= 50000 && !S.flags.labHint) {
    S.flags.labHint = true;
    save();
    labHintBanner();
  }
  let n = S.stage;
  while (n < 5 && stageReq(n + 1).ok) n++;
  if (n > S.stage) {
    const fresh = [];
    for (let s = S.stage + 1; s <= n; s++) fresh.push(s);
    S.stage = n;
    save();
    renderAll(); // 用新 stage 重渲染（stage 已推进，重入至多一层）
    for (const s of fresh) {
      if (!S.flags.stageBanners['s' + s]) { S.flags.stageBanners['s' + s] = true; stageBanner(s); }
    }
  }
}

// Phase 4.7: 实验室解锁引导（peakMoney ≥ 5 万）
function labHintBanner() {
  const zone = $('dash-banners');
  if (zone) {
    const d = document.createElement('div');
    d.className = 'banner banner-new';
    d.innerHTML = `<span class="banner-ic">🔬</span>
      <div class="banner-txt"><b>实验室可进入了</b><div class="banner-tip">余额曾达 ¥50,000！去实验室雇佣第一个研究员</div></div>
      <button class="banner-x" data-banner-x>×</button>`;
    zone.prepend(d);
  }
  SFX.win();
  toast('🔬 实验室可进入了！去雇佣第一个研究员，开启模型研发', 3600);
}

// 市场开放引导：横幅 + toast（持久化 flag，刷新后由 renderDashboard 恢复横幅）
function marketGuideBanner() {
  const zone = $('dash-banners');
  if (zone) {
    const d = document.createElement('div');
    d.className = 'banner banner-new';
    d.innerHTML = `<span class="banner-ic">🛒</span>
      <div class="banner-txt"><b>市场已开放</b><div class="banner-tip">去市场买第一个模型 token，进入阶段二</div></div>
      <button class="banner-x" data-banner-x>×</button>`;
    zone.prepend(d);
  }
  SFX.win();
  toast('🛒 市场已开放！去「市场」买第一个模型 token，进入阶段二', 3600);
}

// 解锁横幅：插入仪表盘横幅区 + toast + 庆祝弹窗（持久化，刷新后由 renderDashboard 恢复）
function stageBanner(s) {
  const info = STAGE_INFO[s];
  const zone = $('dash-banners');
  if (zone) {
    const d = document.createElement('div');
    d.className = 'banner banner-new';
    d.innerHTML = `<span class="banner-ic">${info.icon}</span>
      <div class="banner-txt"><b>${info.name} 解锁！</b><div class="banner-tip">${info.tip}</div></div>
      <button class="banner-x" data-banner-x>×</button>`;
    zone.prepend(d);
  }
  SFX.win();
  toast(`🎉 ${info.name} 解锁！${info.tip}`, 3600);
  // Phase 3.5: 阶段解锁庆祝弹窗（复用里程碑样式）
  if (!pulling && !working) setTimeout(() => showModal(stageMilestoneHTML(s)), 500);
}

// 阶段解锁庆祝弹窗
function stageMilestoneHTML(s) {
  const info = STAGE_INFO[s];
  const best = S.stats.best ? MMAP[S.stats.best] : null;
  const rows = [['当前余额', fmt(S.money)], ['阶段', info.name], ['累计收入', fmt(S.stats.earn)], ['删库事故', S.stats.disasters], ['最佳出货', best ? best.name : '无']];
  return `<div class="end-title">${info.icon} ${info.name} 解锁！</div>
  <div class="end-sub">${info.tip}</div>
  <div class="end-stats">${rows.map(([l, v]) => `<div class="cell"><div class="lb">${l}</div><b>${v}</b></div>`).join('')}</div>
  <button class="big-btn" onclick="closeModal()">继续！→</button>`;
}
