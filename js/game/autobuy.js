"use strict";
/* ================================================================
   TokenGacha · js/game/autobuy.js — Token 自动订阅套餐 (Phase 8)
   依赖 js/game/market.js 的 buyApi；需在 market.js 之后、work.js 之前加载，
   保证同一 tick 先自动补货，再由自动化调度消耗。
   ================================================================ */

function autoBuyEnabled() {
  return !!(S.upgrades && S.upgrades.s2_subscribe && S.autobuy && S.autobuy.enabled);
}

/* ---------- 核心：每秒至多补一包 ---------- */
function autoBuyOnce() {
  if (!autoBuyEnabled()) return false;
  if (S.stage < 2) return false;
  const target = S.autobuy.target || AUTOBUY_DEFAULT.target;
  if (totalTokens() >= target) return false;
  const price = API_PRICE[S.autobuy.rarity];
  if (price == null || S.money < price) return false;
  const ok = buyApi(S.autobuy.rarity, { auto: true });
  if (ok && typeof updateAutoBuyStatus === 'function') updateAutoBuyStatus();
  return ok;
}
onTick(() => { autoBuyOnce(); });

/* ---------- 配置操作 ---------- */
function toggleAutoBuy() {
  if (!S.upgrades.s2_subscribe) { toast('💸 请先购买「Token 自动订阅」升级'); SFX.bad(); return; }
  if (!S.autobuy) S.autobuy = { ...AUTOBUY_DEFAULT };
  S.autobuy.enabled = !S.autobuy.enabled;
  if (S.autobuy.enabled && !S.autobuy.lastBuyAt) S.autobuy.lastBuyAt = Date.now();
  save(); renderAll();
  SFX.click();
  toast(S.autobuy.enabled ? '📦 Token 自动订阅已开启' : '⏸ Token 自动订阅已暂停');
}
function setAutoBuyRarity(r) {
  if (!S.autobuy) S.autobuy = { ...AUTOBUY_DEFAULT };
  if (!RORDER.includes(r)) return;
  S.autobuy.rarity = r;
  save(); renderAll();
  SFX.click();
  toast(`📦 自动订阅将购买 ${RARITY[r].name} 包（品质 95%）`);
}
function setAutoBuyTarget(t) {
  const n = Number(t);
  if (!S.autobuy) S.autobuy = { ...AUTOBUY_DEFAULT };
  if (!AUTOBUY_TARGETS.includes(n)) return;
  S.autobuy.target = n;
  save(); renderAll();
  SFX.click();
  toast(`📦 自动订阅目标库存设为 ${fmtK(n)} tokens`);
}

/* ---------- 渲染 ---------- */
function autobuyCardHTML(u) {
  const owned = !!S.upgrades[u.id];
  const reqOk = (u.requires || []).every(id => !!S.upgrades[id]);
  const afford = !owned && reqOk && S.money >= u.price;
  const btnText = owned ? '已购买' : (!reqOk ? '🔒 需先购买自动化调度' : '💰 ¥' + u.price.toLocaleString('zh-CN'));
  const disabled = owned || !reqOk || S.money < u.price;
  return `<div class="upgrade-card ${owned ? 'owned' : ''} ${afford ? 'afford' : ''}">
    <div class="up-name">${u.name}${owned ? '<span class="up-ok">✓ 已拥有</span>' : ''}</div>
    <div class="up-desc">${u.desc}</div>
    <button class="up-btn" data-up="${u.id}" ${disabled ? 'disabled' : ''} title="${!reqOk ? '需先购买 🤖 自动化调度' : ''}">${btnText}</button>
  </div>`;
}

function renderAutoBuy() {
  const el = $('autobuy-panel');
  if (!el) return;
  const u = UPGRADES.s2_subscribe;
  if (!u) return;
  if (!S.upgrades.s2_subscribe) {
    el.innerHTML = `<div class="panel-title">📦 Token 自动订阅<span class="right">官方 API 自动补货</span></div>
      ${autobuyCardHTML(u)}`;
    const btn = el.querySelector('[data-up]');
    if (btn) btn.onclick = () => buyUpgrade(btn.dataset.up);
    return;
  }
  if (!S.autobuy) S.autobuy = { ...AUTOBUY_DEFAULT };
  const on = !!S.autobuy.enabled;
  const rarity = S.autobuy.rarity;
  const target = S.autobuy.target;
  el.innerHTML = `
    <div class="panel-title">📦 Token 自动订阅<span class="right"><span class="autobuy-state ${on ? 'on' : ''}">${on ? '▶ 运行中' : '⏸ 已暂停'}</span></span></div>
    <div class="autobuy-controls">
      <button id="btn-autobuy" class="work-btn auto autobuy-toggle ${on ? 'on' : ''}">${on ? '⏸ 暂停自动订阅' : '▶ 开启自动订阅'}<small>${on ? '库存低于目标自动购买' : '官方 API 自动补货'}</small></button>
      <div class="autobuy-row">
        <span class="autobuy-label">购买包</span>
        <div class="autobuy-pills">${RORDER.map(r => `<button class="tier-btn autobuy-pill ${r === rarity ? 'active' : ''}" data-abrar="${r}">${RARITY[r].name}<small>¥${API_PRICE[r]}/1M</small></button>`).join('')}</div>
      </div>
      <div class="autobuy-row">
        <span class="autobuy-label">目标库存</span>
        <div class="autobuy-pills">${AUTOBUY_TARGETS.map(t => `<button class="tier-btn autobuy-pill ${t === target ? 'active' : ''}" data-abtarget="${t}">${fmtK(t)}<small>≈ ${Math.round(t / 200000)} 中单</small></button>`).join('')}</div>
      </div>
      <div class="autobuy-note" id="autobuy-note"></div>
      <div class="autobuy-stats">累计自动补货 <b id="autobuy-count">${S.stats.autoBuys || 0}</b> 次 · 支出 <b id="autobuy-spent">${fmt(S.stats.autoBuySpent || 0)}</b></div>
    </div>`;
  const btn = $('btn-autobuy');
  if (btn) btn.onclick = toggleAutoBuy;
  el.querySelectorAll('[data-abrar]').forEach(b => b.onclick = () => setAutoBuyRarity(b.dataset.abrar));
  el.querySelectorAll('[data-abtarget]').forEach(b => b.onclick = () => setAutoBuyTarget(+b.dataset.abtarget));
  updateAutoBuyStatus();
}

// tick 轻量刷新订阅状态（不重建面板 DOM）
function updateAutoBuyStatus() {
  const el = $('autobuy-panel');
  if (!el || !S.upgrades.s2_subscribe) return;
  if (!S.autobuy) S.autobuy = { ...AUTOBUY_DEFAULT };
  const on = !!S.autobuy.enabled;
  const note = $('autobuy-note');
  if (note) {
    const price = API_PRICE[S.autobuy.rarity];
    const need = Math.max(0, (S.autobuy.target || AUTOBUY_DEFAULT.target) - totalTokens());
    let txt = `当前库存 ${fmtK(totalTokens())} / 目标 ${fmtK(S.autobuy.target || AUTOBUY_DEFAULT.target)}`;
    if (!on) txt += ' · 已暂停';
    else if (need <= 0) txt += ' · 库存充足';
    else if (S.money < price) txt += ` · 余额不足（还差 ¥${fmt(Math.max(0, price - S.money))}）`;
    else txt += ` · 下次补货 ${RARITY[S.autobuy.rarity].name} 包 ¥${price}`;
    note.innerHTML = txt;
  }
  const btn = $('btn-autobuy');
  if (btn) {
    btn.classList.toggle('on', on);
    btn.innerHTML = `${on ? '⏸ 暂停自动订阅' : '▶ 开启自动订阅'}<small>${on ? '库存低于目标自动购买' : '官方 API 自动补货'}</small>`;
  }
  const count = $('autobuy-count'); if (count) count.textContent = S.stats.autoBuys || 0;
  const spent = $('autobuy-spent'); if (spent) spent.textContent = fmt(S.stats.autoBuySpent || 0);
  const st = el.querySelector('.autobuy-state');
  if (st) { st.textContent = on ? '▶ 运行中' : '⏸ 已暂停'; st.classList.toggle('on', on); }
}
