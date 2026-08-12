"use strict";
/* ================================================================
   TokenGacha · js/game/gacha.js — 抽卡核心与动画流程
   ================================================================ */

/* ---------- 抽卡核心 ---------- */
function drawRarity(poolKey) {
  const pool = POOLS[poolKey];
  if (S.pity[poolKey] >= PITY_MAX - 1) return Math.random() < .2 ? 'UR' : 'SSR';
  const r = Math.random(); let acc = 0;
  for (const t of ['UR', 'SSR', 'SR', 'R', 'N']) { acc += pool.rates[t]; if (r < acc) return t; }
  return 'N';
}
function makeCard(poolKey, rarity) {
  const cands = MODELS.filter(m => m.r === rarity);
  const m = cands[Math.floor(Math.random() * cands.length)];
  const quota = POOLS[poolKey].half ? Math.round(RARITY[rarity].quota / 2) : RARITY[rarity].quota;
  // Phase 3.1: 盲盒品质 60%~100% 随机，默认隐藏，可花检测费揭示
  const q = +(QUALITY.min + Math.random() * (QUALITY.max - QUALITY.min)).toFixed(2);
  return { uid: S.uid++, m: m.id, tokens: quota, max: quota, half: POOLS[poolKey].half, q, src: 'gacha', revealed: false };
}
// 最佳出货: 先比稀有度, 同档比智能指数
function maybeBest(c) {
  const m = MMAP[c.m];
  if (!S.stats.best) { S.stats.best = c.m; return; }
  const b = MMAP[S.stats.best];
  // EX 稀有度（超级模型）最高优先
  const ri = r => r === 'EX' ? RORDER.length : RORDER.indexOf(r);
  const d = ri(m.r) - ri(b.r);
  if (d > 0 || (d === 0 && m.idx > b.idx)) S.stats.best = c.m;
}
function doPulls(poolKey, count) {
  const cards = [];
  for (let i = 0; i < count; i++) {
    const r = drawRarity(poolKey);
    S.pity[poolKey] = (r === 'SSR' || r === 'UR') ? 0 : S.pity[poolKey] + 1;
    const c = makeCard(poolKey, r);
    cards.push(c);
    S.stats.pulls++;
    S.stats.byR[r] = (S.stats.byR[r] || 0) + 1;
    S.dex[c.m] = (S.dex[c.m] || 0) + 1;
    maybeBest(c);
  }
  if (count === 10 && !cards.some(c => ['SR', 'SSR', 'UR'].includes(MMAP[c.m].r))) {
    const old = cards[cards.length - 1];
    S.stats.byR[MMAP[old.m].r]--;
    if (S.dex[old.m]) { S.dex[old.m]--; if (S.dex[old.m] <= 0) delete S.dex[old.m]; }
    cards[cards.length - 1] = makeCard(poolKey, 'SR');
    const c = cards[cards.length - 1];
    S.stats.byR.SR++;
    S.dex[c.m] = (S.dex[c.m] || 0) + 1;
    maybeBest(c);
  }
  S.inv.push(...cards);
  save();
  return cards;
}

/* ---------- 抽卡流程 ---------- */
let pulling = false;
function tryPull(poolKey, count) {
  if (pulling) return;
  const p = POOLS[poolKey];
  const useFree = poolKey === 'standard' && count === 10 && S.freeTen > 0;
  const cost = count === 10 ? p.tenPrice : p.price;
  if (!useFree && S.money < cost) { toast('💸 余额不足！先去「工作」赚钱'); SFX.bad(); return; }
  if (useFree) { S.freeTen--; addLedger('新手赠送 · 白银盲盒十连', 0); }
  else { S.money -= cost; S.stats.spent += cost; addLedger(`购买${p.name} ×${count}`, -cost); }
  SFX.pull();
  const cards = doPulls(poolKey, count);
  save(); renderAll();
  showGacha(cards, p);
}

// Phase 3.1: 花检测费揭示一张卡的品质
function revealCard(uid) {
  const c = S.inv.find(x => x.uid === uid);
  if (!c) return;
  if (c.revealed) { toast('这张卡已揭示过品质'); return; }
  if (S.money < QUALITY.inspectFee) { toast('💸 检测费不足！'); SFX.bad(); return; }
  S.money -= QUALITY.inspectFee;
  S.stats.spent += QUALITY.inspectFee;
  c.revealed = true;
  addLedger(`🔬 品质检测 · ${MMAP[c.m].name}`, -QUALITY.inspectFee);
  save();
  renderAll();
  SFX.flip(0);
  toast(`🔬 检测完成：品质 <b>${Math.round(c.q * 100)}%</b>！`);
}
function showGacha(cards, pool) {
  pulling = true;
  const ov = $('overlay'), row = $('gacha-row');
  $('overlay-title').textContent = cards.length > 1 ? `✨ ${pool.name} · 十连抽 ✨` : `✨ ${pool.name} · 单抽 ✨`;
  $('gacha-summary').classList.remove('show');
  $('close-overlay').classList.remove('show');
  row.innerHTML = ''; ov.classList.add('show');
  let skipped = false, flippedCount = 0;
  const els = cards.map((c, i) => {
    const m = MMAP[c.m], r = RARITY[m.r];
    const d = document.createElement('div');
    d.className = 'gcard' + (m.r === 'UR' ? ' ur' : '');
    d.style.setProperty('--rc', r.hex);
    d.innerHTML = `<div class="inner">
      <div class="face back"><div class="q">?</div><small>API 盲盒</small></div>
      <div class="face front">
        <div class="rr">${r.name} · ${r.label}</div>
        <div class="ic"></div>
        <div class="nm">${m.name}</div>
        <div class="vd">${m.vendor}${c.half ? ' · 体验卡' : ''}</div>
        <div class="idx">智能指数 ${m.idx}</div>
        <div class="tk">⚡ ${fmtK(c.tokens)} tokens</div>
      </div></div>`;
    d.querySelector('.ic').appendChild(iconImg(m.icon));
    d.onclick = () => flipOne(i);
    row.appendChild(d);
    return d;
  });
  function flipOne(i) {
    const el = els[i];
    if (el.classList.contains('flipped')) return;
    el.classList.add('flipped', 'pop');
    flippedCount++;
    const r = MMAP[cards[i].m].r;
    SFX.flip(i);
    if (r === 'SSR' || r === 'UR') {
      setTimeout(() => {
        SFX.rarity(r);
        const rect = el.getBoundingClientRect();
        burst(rect.left + rect.width / 2, rect.top + rect.height / 2,
          r === 'UR' ? ['#ff5f6d', '#f59e0b', '#2f6bff', '#fff'] : ['#f59e0b', '#fde68a', '#fff'], r === 'UR' ? 120 : 70, r === 'UR' ? 9 : 7);
        if (r === 'UR') shake();
      }, 250);
    }
    if (flippedCount >= cards.length) finish();
  }
  cards.forEach((c, i) => setTimeout(() => { if (!skipped) flipOne(i); }, 450 + i * 380));
  $('skip-btn').onclick = () => { skipped = true; els.forEach((e, i) => { if (!e.classList.contains('flipped')) setTimeout(() => flipOne(i), i * 40); }); };
  function finish() {
    const totTok = cards.reduce((s, c) => s + c.tokens, 0);
    const best = cards.reduce((a, c) => RORDER.indexOf(MMAP[c.m].r) > RORDER.indexOf(MMAP[a.m].r) ? c : a, cards[0]);
    const bm = MMAP[best.m];
    $('gacha-summary').innerHTML = `共获得 <b>${fmtK(totTok)} tokens</b> · 最佳: <b style="color:${RARITY[bm.r].hex}">${bm.name}</b>（${RARITY[bm.r].name}）`;
    $('gacha-summary').classList.add('show');
    $('close-overlay').classList.add('show');
    save(); renderAll();
  }
  $('close-overlay').onclick = () => { ov.classList.remove('show'); pulling = false; checkEnd(); };
}

