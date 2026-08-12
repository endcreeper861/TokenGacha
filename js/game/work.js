"use strict";
/* ================================================================
   TokenGacha · js/game/work.js — 工作期望计算与工作流
   ================================================================ */

/* ---------- 期望计算 ---------- */
function payFactor(m) {
  const t = RARITY[m.r], span = Math.max(1, t.max - t.min);
  return .8 + .4 * Math.min(1, Math.max(0, (m.idx - t.min) / span));
}
function expectedTaskPay(m) {
  const pay = RARITY[m.r].basePay * payFactor(m);
  const pG = .02 + m.idx / 800, pR = Math.min(.25, Math.max(.04, .25 - m.idx / 250)), pD = Math.min(.02, Math.max(0, (28 - m.idx) / 1200));
  const pO = Math.max(0, 1 - pG - pR - pD);
  return PAY_BOOST * (pO * pay + pG * pay * 2.5 + pR * pay * .4 - pD * 50);
}
const estValue = () => S.inv.reduce((s, c) => s + (c.tokens / TASK_TOKENS) * expectedTaskPay(MMAP[c.m]), 0);

/* ---------- 工作核心 ---------- */
function taskPayout(model) {
  const pay = RARITY[model.r].basePay * payFactor(model);
  const roll = Math.random();
  const pGreat = .02 + model.idx / 800;
  const pRework = Math.min(.25, Math.max(.04, .25 - model.idx / 250));
  const pDisaster = Math.min(.02, Math.max(0, (28 - model.idx) / 1200));
  if (roll < pDisaster) return { amt: -50 * PAY_BOOST, evt: 'disaster' };
  if (roll < pDisaster + pRework) return { amt: pay * .4 * PAY_BOOST, evt: 'rework' };
  if (roll > 1 - pGreat) return { amt: pay * 2.5 * PAY_BOOST, evt: 'great' };
  return { amt: pay * (.85 + Math.random() * .3) * PAY_BOOST, evt: 'ok' };
}
function bestCard() {
  let best = null;
  for (const c of S.inv) {
    if (c.tokens < TASK_TOKENS) continue;
    if (!best || RORDER.indexOf(MMAP[c.m].r) > RORDER.indexOf(MMAP[best.m].r)
      || (MMAP[c.m].r === MMAP[best.m].r && MMAP[c.m].idx > MMAP[best.m].idx)) best = c;
  }
  return best;
}
// 消耗 n 单（按稀有度优先），返回明细
function consumeTasks(n) {
  const items = [];
  for (let i = 0; i < n; i++) {
    const c = bestCard();
    if (!c) break;
    c.tokens -= TASK_TOKENS;
    if (c.tokens <= 0) S.inv.splice(S.inv.indexOf(c), 1); // 耗尽卡自动移除
    const m = MMAP[c.m];
    items.push({ m, res: taskPayout(m) });
  }
  return items;
}

/* ---------- 工作流（批量 + 自动） ---------- */
let working = false;
function termPrint() {
  const term = $('term-body');
  return {
    reset() { term.innerHTML = '<span class="cursor"></span>'; },
    line(text) {
      term.querySelector('.cursor')?.remove();
      const isRes = text.startsWith('  →');
      term.insertAdjacentHTML('beforeend', (isRes ? text : escapeHtml(text)) + '\n<span class="cursor"></span>');
      term.scrollTop = term.scrollHeight;
    },
    done(text) { term.querySelector('.cursor')?.remove(); term.insertAdjacentHTML('beforeend', escapeHtml(text)); term.scrollTop = term.scrollHeight; }
  };
}

// 原子结算: 动画开始前一次性入账, 刷新页面也不会丢统计
function settleItems(items) {
  let total = 0;
  for (const it of items) {
    const amt = it.res.amt;
    S.money = Math.max(0, S.money + amt);
    if (amt > 0) S.stats.earn += amt;
    S.stats.tasks++;
    if (it.res.evt === 'disaster') S.stats.disasters++;
    else if (it.res.evt === 'great') S.stats.greats++;
    total += amt;
  }
  save();
  return total;
}
// lines: [{text, amt?, evt?}]，纯视觉回放（入账已在 settleItems 完成）
function runLines(lines, interval, onDone) {
  const tp = termPrint(); tp.reset();
  let i = 0;
  const timer = setInterval(() => {
    if (i >= lines.length) { clearInterval(timer); onDone(tp); return; }
    const L = lines[i];
    tp.line(L.text);
    if (L.evt === 'disaster') SFX.bad();
    else if (L.evt === 'great') SFX.coin();
    if (L.amt != null) tweenMoney();
    i++;
  }, interval);
}
function composeLines(items, { rich = true, maxDetail = Infinity } = {}) {
  const L = [];
  const n = items.length;
  items.forEach((it, i) => {
    const showDetail = i < maxDetail;
    if (showDetail) {
      L.push({ text: `> [${i + 1}/${n}] 接单 ${pick(CLIENT_REQS)} ｜ 调度: ${it.m.name}` });
      if (rich) {
        const k = 2 + Math.floor(Math.random() * 2);
        for (let j = 0; j < k; j++) L.push({ text: pick(MEME_LINES) });
        if (Math.random() < .4) L.push({ text: pick(MID_REQS) });
        L.push({ text: pick(OK_LINES) });
      }
    } else if (i === maxDetail) {
      L.push({ text: `> …其余 ${n - i} 单全速交付中…` });
    }
    const tag = { great: '🤩 大成功', ok: '✅ 交付', rework: '🔧 返工', disaster: '💥 删库' }[it.res.evt];
    L.push({ text: `  → [${i + 1}/${n}] ${it.m.name} 结算 ${it.res.amt >= 0 ? '+' : ''}${fmt2(it.res.amt)} ｜ ${tag}`, amt: it.res.amt, evt: it.res.evt });
  });
  return L;
}
function finishWork(tp, items, modeLabel) {
  const total = items.reduce((s, x) => s + x.res.amt, 0);
  const evts = { great: 0, ok: 0, rework: 0, disaster: 0 };
  items.forEach(x => evts[x.res.evt]++);
  tp.done(`\n> ${modeLabel} 完成 ${items.length} 单 ｜ 🤩×${evts.great} ✅×${evts.ok} 🔧×${evts.rework} 💥×${evts.disaster}\n> 合计入账 ${total >= 0 ? '+' : ''}${fmt2(total)}${evts.disaster ? '\n> ⚠ 有删库事故，已自动购买数据库恢复服务' : ''}`);
  addWorkLog(`${modeLabel} ×${items.length} ｜ 🤩${evts.great} ✅${evts.ok} 🔧${evts.rework} 💥${evts.disaster}`, total);
  addLedger(`${modeLabel} ×${items.length} 单`, total);
  const rect = $('term-body').getBoundingClientRect();
  bigMoneyPop(total);
  coinShower(rect, total);
  if (evts.great > 0 || total > 500) { burst(rect.left + rect.width / 2, rect.top + 100, ['#16a34a', '#f59e0b', '#fff'], 50, 6); }
  if (evts.disaster > 0) shake();
  working = false; save(); renderAll(); checkEnd();
  if (totalTasks() <= 0 && S.money < Math.min(...Object.values(POOLS).map(p => p.price))) return;
  if (totalTasks() <= 0) toast('⚡ Token 已全部耗尽 → 去「购买Token」抽下一波');
}
function doWork() {
  if (working) return;
  const n = Math.min(BATCH_TASKS, totalTasks());
  if (n <= 0) { toast('没有可用 token，先去抽卡！'); SFX.bad(); return; }
  working = true; renderWork();
  SFX.click();
  const items = consumeTasks(n);
  settleItems(items);
  const lines = composeLines(items, { rich: true });
  runLines(lines, 42, tp => finishWork(tp, items, '批量工作'));
}
function doAuto() {
  if (working) return;
  const n = totalTasks();
  if (n <= 0) { toast('没有可用 token，先去抽卡！'); SFX.bad(); return; }
  working = true; renderWork();
  SFX.pull();
  const items = consumeTasks(n);
  settleItems(items);
  const lines = composeLines(items, { rich: false, maxDetail: 12 });
  runLines(lines, 16, tp => finishWork(tp, items, '⚡ 自动模式'));
}

