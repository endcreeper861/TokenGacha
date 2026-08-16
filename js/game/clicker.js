"use strict";
/* ================================================================
   TokenGacha · js/game/clicker.js — 阶段一 · 手写代码点击器
   每击 +4%×效率，满 100% 完成一单得 ¥3~6 (+升级修正)
   S1 升级效果 / VS Code 插件自动点击 (tick 回调)
   ================================================================ */

const CLICK_BASE = 5;        // 每击基础进度 %（Phase 7.1 调校: 原 4, 节奏 ~5min 达标）
const CLICK_PAY_MIN = 3;     // 每单基础收入下限 ¥
const CLICK_PAY_SPAN = 3;    // 每单基础收入浮动区间 ¥ (3~6)
const CLICK_TARGET = 100;    // 完成一单所需进度 %

// 当前点击效率（打字速度 ×1.2 · 多点触控 ×1.5）
function clickerEff() {
  return (S.upgrades.s1_typing ? 1.2 : 1) * (S.upgrades.s1_multitouch ? 1.5 : 1);
}
// 完成一单所需进度（SO 会员 -20%）
function clickerTarget() {
  return CLICK_TARGET * (S.upgrades.s1_so ? 0.8 : 1);
}
// 每单收入（机械键盘 +¥2）
function clickerPay() {
  return CLICK_PAY_MIN + Math.random() * CLICK_PAY_SPAN + (S.upgrades.s1_keyboard ? 2 : 0);
}
// 点击器被动收入 ¥/s（VS Code 插件期望值：5%/s × 单次点击收益期望，供仪表盘展示）
function clickerIncomePerSec() {
  if (!S.upgrades.s1_vscode) return 0;
  const clicksPerTask = clickerTarget() / (CLICK_BASE * clickerEff());
  const payPerTask = CLICK_PAY_MIN + CLICK_PAY_SPAN / 2 + (S.upgrades.s1_keyboard ? 2 : 0);
  return 0.05 * (payPerTask / clicksPerTask);
}

// 一次点击：推进进度，满则完成一单
function clickerClick() {
  S.clicker.clicks++;
  S.stats.clicks++;
  S.clicker.progress += CLICK_BASE * clickerEff();
  const target = clickerTarget();
  if (S.clicker.progress >= target) {
    S.clicker.progress = 0;
    const pay = clickerPay();
    S.money += pay;
    S.stats.earn += pay;
    S.stats.tasks++; // 计入总工作单数
    S.peakMoney = Math.max(S.peakMoney, S.money);
    addLedger('🔨 手写代码接单', pay);
    save();
    renderAll();
    SFX.coin();
    const b = $('btn-click');
    if (b) {
      const r = b.getBoundingClientRect();
      floater(`+${fmt2(pay)}`, r.left + r.width / 2, r.top - 6, '#16a34a');
    }
  } else {
    tweenMoney();
    updateClickerBar();
  }
}

// 轻量进度条刷新（不重建 DOM）
function updateClickerBar() {
  const bar = $('clicker-bar');
  if (bar) bar.style.width = Math.min(100, S.clicker.progress / clickerTarget() * 100) + '%';
  const num = $('clicker-pct');
  if (num) num.textContent = Math.floor(S.clicker.progress / clickerTarget() * 100) + '%';
}

// 购买 S1 升级
function buyUpgrade(id) {
  const u = UPGRADES[id];
  if (!u) return;
  if (S.upgrades[id]) { toast('已拥有该升级'); SFX.bad(); return; }
  if (u.requires && u.requires.some(r => !S.upgrades[r])) {
    const names = u.requires.filter(r => !S.upgrades[r]).map(r => UPGRADES[r] ? UPGRADES[r].name : r).join('、');
    toast(`🔒 需先解锁：${names}`); SFX.bad(); return;
  }
  if (S.money < u.price) { toast('💸 余额不足！'); SFX.bad(); return; }
  S.money -= u.price;
  S.stats.spent += u.price;
  S.upgrades[id] = true;
  addLedger(`🛒 购买升级 · ${u.name}`, -u.price);
  save();
  renderAll();
  SFX.click();
  toast(`✅ ${u.name} 已生效！`);
}

// 渲染点击器面板（工作台页顶部）
function renderClicker() {
  const wrap = $('clicker-panel');
  if (!wrap) return;
  const eff = clickerEff(), target = clickerTarget();
  const payMin = CLICK_PAY_MIN + (S.upgrades.s1_keyboard ? 2 : 0);
  const payMax = CLICK_PAY_MIN + CLICK_PAY_SPAN + (S.upgrades.s1_keyboard ? 2 : 0);
  $('clicker-sub').textContent = `累计敲击 ${S.stats.clicks} 击 · 完成 ${S.stats.tasks} 单`;
  $('clicker-pay').textContent = `¥${payMin}~${payMax}`;
  $('clicker-eff').textContent = `×${Math.round(eff * 10) / 10}`;
  $('clicker-target').textContent = `进度 ${target}%`;
  updateClickerBar();
  // 阶段二解锁后收缩为次要面板
  wrap.classList.toggle('minor', isUnlocked(2));
  // S1 升级卡片
  const grid = $('s1-upgrades');
  if (!grid) return;
  grid.innerHTML = '';
  for (const u of upgradesOfStage(1)) {
    const owned = !!S.upgrades[u.id];
    const d = document.createElement('div');
    d.className = 'upgrade-card' + (owned ? ' owned' : '') + (S.money >= u.price && !owned ? ' afford' : '');
    d.innerHTML = `<div class="up-name">${u.name}${owned ? '<span class="up-ok">✓ 已拥有</span>' : ''}</div>
      <div class="up-desc">${u.desc}</div>
      <button class="up-btn" data-up="${u.id}" ${owned || S.money < u.price ? 'disabled' : ''}>${owned ? '已购买' : '💰 ¥' + u.price.toLocaleString('zh-CN')}</button>`;
    grid.appendChild(d);
  }
  grid.querySelectorAll('[data-up]').forEach(b => b.onclick = () => buyUpgrade(b.dataset.up));
  // Phase 3.4: S2 升级卡片（阶段二解锁后显示）
  const grid2 = $('s2-upgrades');
  if (grid2) {
    grid2.innerHTML = '';
    for (const u of upgradesOfStage(2)) {
      const owned = !!S.upgrades[u.id];
      const reqOk = (u.requires || []).every(id => !!S.upgrades[id]);
      const afford = !owned && reqOk && S.money >= u.price;
      const btnText = owned ? '已购买' : (!reqOk ? '🔒 需先购买自动化调度' : '💰 ¥' + u.price.toLocaleString('zh-CN'));
      const disabled = owned || !reqOk || S.money < u.price;
      const d = document.createElement('div');
      d.className = 'upgrade-card' + (owned ? ' owned' : '') + (afford ? ' afford' : '');
      d.innerHTML = `<div class="up-name">${u.name}${owned ? '<span class="up-ok">✓ 已拥有</span>' : ''}</div>
        <div class="up-desc">${u.desc}</div>
        <button class="up-btn" data-up="${u.id}" ${disabled ? 'disabled' : ''} title="${!reqOk ? '需先购买 🤖 自动化调度' : ''}">${btnText}</button>`;
      grid2.appendChild(d);
    }
    grid2.querySelectorAll('[data-up]').forEach(b => b.onclick = () => buyUpgrade(b.dataset.up));
  }
}

// VS Code 插件自动点击：tick 每秒 5% 概率一击
onTick(() => {
  if (S.upgrades.s1_vscode && Math.random() < 0.05) clickerClick();
});
