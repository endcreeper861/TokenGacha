"use strict";
/* ================================================================
   TokenGacha · js/ui/dashboard.js — 仪表盘
   收入流总览 / 快捷入口 / 阶段横幅容器 / 阶段进度
   (clickerIncomePerSec 由 js/game/clicker.js 提供)
   ================================================================ */

/* ---------- Phase 6.6: AGI 总进度（研究进度 × 技术占比加权） ---------- */
function agiProgress() {
  // 阶段四前：研究进度
  if (S.stage < 4) return { pct: 0, txt: '研究进度 0% · 解锁阶段四后开启' };
  const res = Math.min(100, S.research.progress) / 100;
  const ai = S.aiRatio;
  // 加权：研究 60% + AI 占比 40%（到达 AGI 需研究 100% 且 AI 100%）
  const pct = Math.round((res * 0.6 + ai * 0.4) * 100);
  return { pct, txt: `研究 ${Math.round(res * 100)}% · AI 占比 ${Math.round(ai * 100)}%` };
}
function agiBarHTML() {
  const a = agiProgress();
  return `<div class="agi-bar-wrap">
    <div class="lb"><span>🧠 AGI 总进度</span><b>${a.pct}%</b></div>
    <div class="agi-bar"><i style="width:${a.pct}%"></i></div>
    <div class="research-meta" style="margin-top:6px"><span>${a.txt}</span>${S.flags.agi ? '<span style="color:#0d9488;font-weight:800">✅ AGI 已达成！</span>' : ''}</div>
  </div>`;
}

/* ---------- 收入流总览 ---------- */
function incomeFlows() {
  return [
    { icon: '🔨', name: '手写代码', stage: 1, rate: () => clickerIncomePerSec(), note: '手动点击' },
    { icon: '🤖', name: 'AI 接单', stage: 2, rate: () => workIncomePerSec(), note: '自动调度中' },
    { icon: '🖥️', name: 'GPU 机房', stage: 3, rate: () => gpuIncomePerSec(), note: '自产 token' },
    { icon: '🔬', name: '模型研发', stage: 4, rate: () => 0, note: '研究进度' },
  ];
}

/* ---------- 渲染仪表盘 ---------- */
// Phase 4.5: 限时市场事件横幅（仪表盘，倒计时由 market.js tick 每秒刷新）
function marketEvtBanner() {
  if (!S.marketEvt) return '';
  const r = S.marketEvt.rarity;
  const left = Math.max(0, Math.ceil((S.marketEvt.until - Date.now()) / 1000));
  return `<div class="banner" style="background:linear-gradient(90deg,#fef3c7,#fde68a);border-color:#f59e0b">
    <span class="banner-ic">🔥</span>
    <div class="banner-txt"><b>${RARITY[r].name} token 需求暴涨！</b><div class="banner-tip">卖出价 ×${EVT_BOOST} · 倒计时 <b id="dash-evt-left">${left}s</b> · 快去市场卖自产 token</div></div>
  </div>`;
}
function renderDashboard() {
  const root = $('dash-root');
  const flows = incomeFlows();
  const rows = flows.map(f => {
    if (!isUnlocked(f.stage)) {
      return `<div class="flow-row locked">
        <span class="flow-ic">${f.icon}</span>
        <span class="flow-name">${f.name}</span>
        <span class="flow-lock">🔒 未解锁</span>
      </div>`;
    }
    const r = f.rate();
    return `<div class="flow-row">
      <span class="flow-ic">${f.icon}</span>
      <span class="flow-name">${f.name}</span>
      <span class="flow-rate">+${fmt2(r)}/s</span>
      <span class="flow-tag">${f.note}</span>
    </div>`;
  }).join('');
  const total = flows.filter(f => isUnlocked(f.stage)).reduce((s, f) => s + f.rate(), 0);

  // 阶段进度指示
  const dots = [1, 2, 3, 4, 5].map(s =>
    `<div class="sdot ${S.stage >= s ? 'on' : ''}" title="${STAGE_INFO[s].name}">${STAGE_INFO[s].icon}</div>`
  ).join('');

  root.innerHTML = `
    <div class="banner-zone" id="dash-banners">${marketEvtBanner()}${bannerHTML()}</div>
    ${agiBarHTML()}
    <div class="dash-grid">
      <div class="panel panel-pad">
        <div class="panel-title">📈 收入流总览<span class="right">合计 +${fmt2(total)}/s</span></div>
        <div class="flow-list">${rows}</div>
      </div>
      <div class="panel panel-pad">
        <div class="panel-title">🧭 阶段进度</div>
        <div class="stage-dots">${dots}</div>
        <div class="stage-cur">当前：${STAGE_INFO[S.stage].name}</div>
        <div class="panel-title" style="margin-top:14px">⚡ 快捷入口</div>
        <div class="quick-grid">
          <button class="quick-btn" data-go="work">💼 去工作台</button>
          <button class="quick-btn" data-go="market">🛒 去市场买 token</button>
          <button class="quick-btn" data-go="gpu">🖥️ 去机房管显卡</button>
          <button class="quick-btn" data-go="lab">🔬 去实验室搞研究</button>
        </div>
      </div>
    </div>`;
}

/* ---------- 阶段横幅（解锁事件持久化展示） ---------- */
function bannerHTML() {
  const out = [];
  // Phase 2.4: 市场开放引导横幅
  if (S.flags.marketOpen) {
    out.push(`<div class="banner">
      <span class="banner-ic">🛒</span>
      <div class="banner-txt"><b>市场已开放</b><div class="banner-tip">去市场买第一个模型 token，进入阶段二</div></div>
      <button class="banner-x" data-banner-x>×</button>
    </div>`);
  }
  // Phase 4.7: 实验室解锁引导横幅
  if (S.flags.labHint) {
    out.push(`<div class="banner">
      <span class="banner-ic">🔬</span>
      <div class="banner-txt"><b>实验室可进入了</b><div class="banner-tip">余额曾达 ¥50,000！去实验室雇佣第一个研究员</div></div>
      <button class="banner-x" data-banner-x>×</button>
    </div>`);
  }
  const seen = S.flags.stageBanners || {};
  for (const [k, v] of Object.entries(seen)) {
    if (!v) continue;
    const s = Number(k.slice(1));
    if (!STAGE_INFO[s]) continue;
    out.push(`<div class="banner">
      <span class="banner-ic">${STAGE_INFO[s].icon}</span>
      <div class="banner-txt"><b>${STAGE_INFO[s].name} 已解锁</b><div class="banner-tip">${STAGE_INFO[s].tip}</div></div>
      <button class="banner-x" data-banner-x>×</button>
    </div>`);
  }
  return out.join('');
}
document.addEventListener('click', e => {
  const x = e.target.closest('[data-banner-x]');
  if (x) x.closest('.banner').remove();
});
