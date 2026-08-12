"use strict";
/* ================================================================
   TokenGacha · js/ui/pages.js — 各页面渲染
   ================================================================ */

/* ---------- 渲染: 购买Token ---------- */
function renderBuy() {
  const box = $('pool-cards'); box.innerHTML = '';
  for (const [k, p] of Object.entries(POOLS)) {
    const card = document.createElement('div');
    card.className = 'pool-card' + (p.rec ? ' rec' : '');
    card.style.setProperty('--pc', p.color);
    const pity = S.pity[k];
    const useFree = k === 'standard' && S.freeTen > 0;
    const seg = RORDER.map(r => p.rates[r] ? `<i style="width:${p.rates[r] * 100}%;background:${RARITY[r].hex}" title="${r} ${(p.rates[r] * 100).toFixed(1)}%"></i>` : '').join('');
    card.innerHTML = `<div class="accent"></div><div class="pool-body">
      <div><div class="pool-name">${p.name}</div><div class="pool-sub">${p.sub}</div></div>
      <div class="pool-price"><b>¥${p.price}</b><span>/ 抽 · 十连 ¥${p.tenPrice}</span><span class="rtp-tag">回本率 ${p.rtpFake}</span></div>
      <div class="featured-row"></div>
      <div class="rates-bar" title="稀有度分布">${seg}</div>
      <div class="rates-legend">${RORDER.filter(r => p.rates[r]).map(r => `<span style="color:${RARITY[r].hex}">■</span>${r} ${(p.rates[r] * 100).toFixed(1)}%`).join('　')}</div>
      <div class="pity-row"><span>保底 ${pity}/${PITY_MAX}</span><div class="pity-bar"><i style="width:${pity / PITY_MAX * 100}%"></i></div></div>
      <div class="pool-btns">
        <button class="pull-btn p1" data-pool="${k}" data-n="1" ${S.money < p.price ? 'disabled' : ''}>单抽<small>¥${p.price}</small></button>
        <button class="pull-btn p10" data-pool="${k}" data-n="10" ${(!useFree && S.money < p.tenPrice) ? 'disabled' : ''}>十连抽<small>${useFree ? '新手赠送 · 免费！' : '¥' + p.tenPrice + ' · 必出SR+'}</small>${useFree ? `<span class="free-tag">免费 ×${S.freeTen}</span>` : ''}</button>
      </div>
      <div class="pool-note">${p.note}</div>
    </div>`;
    const fr = card.querySelector('.featured-row');
    for (const mid of p.featured) { fr.appendChild(iconImg(MMAP[mid].icon)); }
    fr.insertAdjacentHTML('beforeend', '<span>UP 渠道</span>');
    box.appendChild(card);
  }
  $('buy-tokens').textContent = fmtK(totalTokens()) + ' tokens';
  $('buy-tasks').textContent = totalTasks();
  box.querySelectorAll('.pull-btn').forEach(b => b.onclick = () => tryPull(b.dataset.pool, +b.dataset.n));
}

/* ---------- 渲染: 工作页 ---------- */
function renderWork() {
  const tk = totalTokens(), tasks = totalTasks();
  $('w-tokens').innerHTML = fmtK(tk) + ' <small>tokens</small>';
  $('w-tasks').innerHTML = tasks + ' <small>单</small>';
  $('w-est').textContent = fmt(estValue());
  const rows = $('rarity-rows'); rows.innerHTML = '';
  const maxQ = RARITY.UR.quota * 3;
  for (const r of [...RORDER].reverse()) {
    const cards = S.inv.filter(c => MMAP[c.m].r === r && c.tokens > 0);
    const tkR = cards.reduce((s, c) => s + c.tokens, 0);
    const estR = cards.reduce((s, c) => s + (c.tokens / TASK_TOKENS) * expectedTaskPay(MMAP[c.m]), 0);
    rows.insertAdjacentHTML('beforeend',
      `<div class="rrow" style="--rc:${RARITY[r].hex}">
        <span class="tag">${r}</span>
        <div class="bar"><i style="width:${Math.min(100, tkR / maxQ * 100)}%"></i></div>
        <span class="num">${fmtK(tkR)} tok · ${Math.floor(tkR / TASK_TOKENS)}单</span>
        <span class="est">≈${fmt(estR)}</span>
      </div>`);
  }
  const bw = $('btn-work'), ba = $('btn-auto');
  const n = Math.min(BATCH_TASKS, tasks);
  bw.disabled = working || tasks <= 0;
  ba.disabled = working || tasks <= 0;
  $('work-sub').textContent = tasks > 0 ? `一键完成 ${n} 单 · 消耗 ${fmtK(n * TASK_TOKENS)} tokens` : '没有可用 token，去「购买Token」';
  $('auto-sub').textContent = tasks > 0 ? `全部 ${tasks} 单一次清完 · ${fmtK(tk)} tokens` : '没有可用 token';
}
function renderWorkLog() {
  // 日志只在会话内保留，渲染由 addWorkLog 完成
}
function addWorkLog(label, amt) {
  const log = $('work-log');
  const row = document.createElement('div'); row.className = 'row';
  row.innerHTML = `<span class="evt">${label}</span><span class="amt ${amt >= 0 ? 'pos' : 'neg'}">${amt >= 0 ? '+' : ''}${fmt(amt)}</span>`;
  log.prepend(row); while (log.children.length > 20) log.lastChild.remove();
}

/* ---------- 渲染: 余额页 ---------- */
function renderBalance() {
  $('b-money').textContent = fmt(S.money);
  $('b-cheat').textContent = S.flags.cheated ? '💳 作弊模式 · 成就已关闭' : '';
  $('b-cheat').style.cssText = S.flags.cheated ? 'font-size:10px;background:#fef2f2;color:#b91c1c;padding:2px 8px;border-radius:8px;border:1px solid #fecaca;font-weight:700' : '';
  $('b-earn').textContent = fmt(S.stats.earn);
  $('b-spent').textContent = fmt(S.stats.spent);
  $('b-tokval').textContent = fmt(estValue());
  $('b-free-bar').style.width = Math.min(100, S.money / VICTORY_AT * 100) + '%';
  $('b-free-txt').textContent = `${fmt(S.money)} / ${fmt(VICTORY_AT)}`;
  const ll = $('ledger-list');
  if (!S.ledger.length) { ll.innerHTML = '<div class="ledger-empty">暂无收支记录</div>'; }
  else ll.innerHTML = S.ledger.map(l => `<div class="lrow"><span class="lab"><small>${l.ts}</small>${l.label}</span><span class="amt ${l.amt >= 0 ? 'pos' : 'neg'}">${l.amt >= 0 ? '+' : ''}${fmt(l.amt)}</span></div>`).join('');
  const best = S.stats.best ? MMAP[S.stats.best] : null;
  const cells = [
    ['总抽数', S.stats.pulls], ['工作单数', S.stats.tasks], ['大成功', S.stats.greats], ['删库事故', S.stats.disasters],
    ['最佳出货', best ? best.name : '无'], ['图鉴', `${Object.keys(S.dex).length}/${MODELS.length}`],
  ];
  $('stat-grid').innerHTML = cells.map(([l, v]) => `<div class="cell"><div class="lb">${l}</div><div class="vl">${v}</div></div>`).join('')
    + RORDER.map(r => `<div class="cell"><div class="lb">${r} 出货</div><div class="vl" style="color:${RARITY[r].hex}">${S.stats.byR[r] || 0}</div></div>`).join('');
  const ch = $('channels'); ch.innerHTML = '';
  const chModels = ['opus5', 'gpt56sol', 'gem31pro', 'dsv4pro', 'qwen37', 'doubao'];
  for (const id of chModels) {
    const m = MMAP[id];
    const warn = Math.random() < .2;
    ch.insertAdjacentHTML('beforeend', `<div class="ch-row"><span class="ic"></span><span>${m.vendor} 渠道</span><span class="st ${warn ? 'warn' : ''}">${warn ? '● 波动' : '● 正常'}</span><span class="lat">${Math.round(80 + Math.random() * 400)}ms</span></div>`);
    ch.lastChild.querySelector('.ic').appendChild(iconImg(m.icon));
  }
  // 卡库
  const g = $('inv-grid'); g.innerHTML = '';
  $('inv-total').textContent = `共 ${S.inv.length} 张 · 耗尽自动移除`;
  if (!S.inv.length) { g.innerHTML = '<div class="inv-empty" style="grid-column:1/-1">卡库空空如也<br>去「购买Token」抽个盲盒吧</div>'; }
  else {
    const sorted = [...S.inv].sort((a, b) => RORDER.indexOf(MMAP[b.m].r) - RORDER.indexOf(MMAP[a.m].r) || b.tokens - a.tokens);
    for (const c of sorted) {
      const m = MMAP[c.m], r = RARITY[m.r];
      const d = document.createElement('div');
      d.className = 'inv-card' + (c.tokens <= 0 ? ' dead' : '');
      d.style.setProperty('--rc', r.hex);
      d.innerHTML = `<span class="rt">${r.name}</span>${c.half ? '<span class="half">体验</span>' : ''}`;
      d.appendChild(iconImg(m.icon));
      d.insertAdjacentHTML('beforeend', `<div class="nm">${m.name}</div><div class="tk">${c.tokens > 0 ? fmtK(c.tokens) + ' tok' : '已耗尽'}</div>`);
      d.title = `${m.name} · ${m.vendor}\n智能指数 ${m.idx} · 真实成本 ${m.cost}\n${m.quote}`;
      g.appendChild(d);
    }
  }
}

/* ---------- 渲染: 头部 ---------- */
let shownMoney = S.money;
function renderHeader() {
  $('h-tokens').textContent = fmtK(totalTokens());
  $('h-pulls').textContent = S.stats.pulls;
}
function tweenMoney() {
  const el = $('h-money');
  const from = shownMoney, to = S.money;
  if (Math.abs(to - from) < 0.5) { shownMoney = to; el.textContent = fmt(to); return; }
  el.classList.remove('flash-up', 'flash-down'); void el.offsetWidth;
  el.classList.add(to > from ? 'flash-up' : 'flash-down');
  const t0 = performance.now(), dur = 450;
  (function step(t) {
    const k = Math.min(1, (t - t0) / dur);
    shownMoney = from + (to - from) * k;
    el.textContent = fmt(shownMoney);
    if (k < 1) requestAnimationFrame(step); else shownMoney = to;
  })(t0);
}
function renderAll() { renderHeader(); tweenMoney(); renderBuy(); renderWork(); renderBalance(); }

