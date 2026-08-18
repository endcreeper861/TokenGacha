"use strict";
/* ================================================================
   TokenGacha · js/game/market.js — 市场系统 (Phase 3.2)
   官方 API 直购 / Token 卖出 / 限时市场事件 (Phase 4.5) / 市场操纵 (Phase 6.4)
   ================================================================ */

const API_UNIT = 1000000; // 官方 API 每包 1M token
const EVT_BOOST = 1.5;    // 限时事件卖出价倍率
const EVT_DURATION = 60;  // 事件持续时间（秒）

// 官方 API 购买：按稀有度固定价购 1M token 包（q=0.95, src='official'）
// opts.auto=true 时用于自动订阅：静默购买，不刷 toast/音效/ledger/renderAll
function buyApi(rarity, opts = {}) {
  const price = API_PRICE[rarity];
  if (price == null) return false;
  if (S.money < price) {
    if (!opts.auto) { toast('💸 余额不足！'); SFX.bad(); }
    return false;
  }
  // 稀有度对应模型里随机一张（图鉴解锁优先）
  const cands = MODELS.filter(m => m.r === rarity);
  const owned = cands.filter(m => S.dex[m.id] > 0);
  const pool = owned.length ? owned : cands;
  const m = pool[Math.floor(Math.random() * pool.length)];
  S.money -= price;
  S.stats.spent += price;
  // 聚合到同模型同来源卡
  let card = S.inv.find(c => c.m === m.id && c.src === 'official');
  if (!card) {
    card = { uid: S.uid++, m: m.id, tokens: 0, max: API_UNIT, half: false, q: QUALITY.official, src: 'official', revealed: true };
    S.inv.push(card);
  }
  card.tokens += API_UNIT;
  card.max = Math.max(card.max, card.tokens);
  S.dex[m.id] = (S.dex[m.id] || 0) + 1; // 图鉴点亮（满足"首次购买"解锁判定）
  if (opts.auto) {
    S.stats.autoBuys = (S.stats.autoBuys || 0) + 1;
    S.stats.autoBuySpent = (S.stats.autoBuySpent || 0) + price;
    if (S.autobuy) S.autobuy.lastBuyAt = Date.now();
    save();
    return true;
  }
  addLedger(`🏛️ 官方 API · ${m.name} ×1M`, -price);
  save(); renderAll();
  SFX.coin();
  toast(`🏛️ 已购入 <b>${m.name}</b> ×1M token（品质 95%）`);
  return true;
}

// 可卖出 token 统计：仅自产（src='self'）可卖
function sellableTokens() {
  return S.inv.filter(c => c.src === 'self').reduce((s, c) => s + c.tokens, 0);
}
// 卖出单价：按卡所属稀有度官方价 ×0.6（限时事件 ×1.5）
function sellPricePerUnit(c) {
  let p = API_PRICE[MMAP[c.m].r] / API_UNIT * SELL_FACTOR;
  if (S.marketEvt && S.marketEvt.rarity === MMAP[c.m].r) p *= EVT_BOOST;
  return p;
}

/* ---------- Phase 4.5: 限时市场事件 ---------- */
// 每 3~8 分钟随机触发：某稀有度卖出价 ×1.5 持续 60s
let evtTimer = null;
function scheduleMarketEvt() {
  clearTimeout(evtTimer);
  const wait = 180 + Math.floor(Math.random() * 300); // 3~8 分钟
  evtTimer = setTimeout(() => {
    if (S.stage >= 3) triggerMarketEvt();
    scheduleMarketEvt();
  }, wait * 1000);
}
function triggerMarketEvt() {
  const r = RORDER[Math.floor(Math.random() * RORDER.length)];
  S.marketEvt = { rarity: r, until: Date.now() + EVT_DURATION * 1000 };
  save(); renderAll();
  SFX.win();
  toast(`🔥 市场行情：${RARITY[r].name} 稀有度 token 需求暴涨！卖出价 ×${EVT_BOOST}（60s）`, 4000);
}
// tick: 事件过期自动清除 + 倒计时实时刷新（市场页 & 仪表盘）
onTick(() => {
  if (!S.marketEvt) return;
  const left = Math.max(0, Math.ceil((S.marketEvt.until - Date.now()) / 1000));
  if (left <= 0) {
    S.marketEvt = null;
    save(); renderAll();
    return;
  }
  const m = $('market-evt-left'); if (m) m.textContent = left + 's';
  const d = $('dash-evt-left'); if (d) d.textContent = left + 's';
});

/* ---------- Phase 6.4: 市场操纵（阶段五） ---------- */
const MANIP_PRICE = 200000;   // 市场操纵费用
const MANIP_COOLDOWN = 600;   // 冷却 10 分钟（秒）
function manipCooldownLeft() {
  if (!S.flags.manipAt) return 0;
  const left = MANIP_COOLDOWN - (Date.now() - S.flags.manipAt) / 1000;
  return Math.max(0, Math.ceil(left));
}
// 主动触发一次暴涨事件（¥200K，冷却 10 分钟）
function marketManip() {
  if (manipCooldownLeft() > 0) { toast(`⏳ 市场操纵冷却中（剩 ${manipCooldownLeft()}s）`); SFX.bad(); return; }
  if (S.money < MANIP_PRICE) { toast('💸 市场操纵需要 ¥200,000！'); SFX.bad(); return; }
  S.money -= MANIP_PRICE;
  S.stats.spent += MANIP_PRICE;
  S.flags.manipAt = Date.now();
  addLedger('🎛️ 市场操纵', -MANIP_PRICE);
  save(); renderAll();
  triggerMarketEvt();
  toast('🎛️ 市场操纵成功！已触发一次暴涨事件（60s）', 3000);
}
// 卖出全部自产 token（光纤升级提升单笔上限）
function sellSelfTokens() {
  const cards = S.inv.filter(c => c.src === 'self' && c.tokens > 0);
  if (!cards.length) { toast('没有可卖出的自产 token'); SFX.bad(); return; }
  // 单笔卖出上限：基础 10M，光纤 +15M/级
  const cap = (10 + (S.upgrades.s3_fiber || 0) * 15) * 1000000;
  let total = 0, units = 0, remaining = cap;
  for (const c of cards) {
    const take = Math.min(c.tokens, remaining);
    total += take * sellPricePerUnit(c);
    units += take;
    c.tokens -= take;
    remaining -= take;
    if (c.tokens <= 0) S.inv.splice(S.inv.indexOf(c), 1);
    if (remaining <= 0) break;
  }
  S.money += total;
  S.stats.earn += total;
  S.peakMoney = Math.max(S.peakMoney, S.money); // 收入同步历史峰值（阶段解锁判定）
  addLedger('💱 卖出自产 token', total);
  save(); renderAll();
  SFX.coin();
  bigMoneyPop(total);
  const b = $('btn-sell');
  if (b) { const r = b.getBoundingClientRect(); coinShower(r, total); }
  toast(`💱 卖出 ${fmtK(units)} tokens，入账 ${fmt(total)}${remaining <= 0 ? '（已达单笔上限）' : ''}`);
}

/* ---------- 渲染 ---------- */
// 官方 API 购买区
function renderApi() {
  const g = $('api-grid');
  if (!g) return;
  g.innerHTML = '';
  for (const r of RORDER) {
    const price = API_PRICE[r];
    const d = document.createElement('div');
    d.className = 'api-card';
    d.style.setProperty('--rc', RARITY[r].hex);
    d.innerHTML = `<div class="api-rr">${RARITY[r].name} · ${RARITY[r].label}</div>
      <div class="api-price">¥${price}<small> / 1M</small></div>
      <div class="api-note">品质 95% · 可靠</div>
      <button class="api-btn" data-api="${r}" ${S.money < price ? 'disabled' : ''}>购买 ×1M</button>`;
    g.appendChild(d);
  }
  g.querySelectorAll('[data-api]').forEach(b => b.onclick = () => buyApi(b.dataset.api));
}
// Token 卖出区
function renderSell() {
  const el = $('sell-amount');
  if (!el) return;
  // Phase 4.5: 限时事件横幅（市场页）
  const evtBox = $('market-evt');
  if (evtBox) {
    if (S.marketEvt) {
      const r = S.marketEvt.rarity;
      const left = Math.max(0, Math.ceil((S.marketEvt.until - Date.now()) / 1000));
      evtBox.innerHTML = `<div class="market-evt-banner">
        🔥 ${RARITY[r].name} token 需求暴涨 · 卖出价 ×${EVT_BOOST} · <b id="market-evt-left">${left}s</b>
      </div>`;
    } else evtBox.innerHTML = '';
  }
  const sellable = sellableTokens();
  $('sell-amount').textContent = fmtK(sellable);
  $('sell-note').textContent = sellable > 0
    ? `≈ 可入账 ${fmt(estSellValue())}`
    : '（自产 token 才可卖出，机房产出）';
  const btn = $('btn-sell');
  if (btn) btn.disabled = sellable <= 0;
  // Phase 6.4: 市场操纵（阶段五）
  const manBox = $('market-manip');
  if (manBox) {
    if (isUnlocked(5)) {
      const cd = manipCooldownLeft();
      manBox.innerHTML = `<button class="work-btn auto manip-btn" id="btn-manip" ${cd > 0 ? 'disabled' : ''}>
        🎛️ 市场操纵<small>${cd > 0 ? `冷却中 ${cd}s` : '¥200,000 主动触发暴涨 · 冷却 10 分钟'}</small></button>`;
      const mb = $('btn-manip');
      if (mb) mb.onclick = marketManip;
    } else manBox.innerHTML = '';
  }
}
// 卖出估值（粗略：按 N 官价 ×0.6 下限估算，实际按稀有度）
function estSellValue() {
  return S.inv.filter(c => c.src === 'self').reduce((s, c) => s + c.tokens * sellPricePerUnit(c), 0);
}
