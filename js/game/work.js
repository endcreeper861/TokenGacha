"use strict";
/* ================================================================
   TokenGacha · js/game/work.js — 工作期望计算与工作流
   ================================================================ */

/* ---------- 期望计算 ---------- */
function payFactor(m) {
  const t = RARITY[m.r], span = Math.max(1, t.max - t.min);
  return .8 + .4 * Math.min(1, Math.max(0, (m.idx - t.min) / span));
}
function expectedTaskPay(m, q = 1) {
  const pay = RARITY[m.r].basePay * payFactor(m);
  const pG = Math.min(.5, (.02 + m.idx / 800) * q);
  const pR = Math.min(QUALITY.reworkCap, Math.min(.25, Math.max(.04, .25 - m.idx / 250)) / q);
  const pD = Math.min(QUALITY.disasterCap, Math.min(.02, Math.max(0, (28 - m.idx) / 1200)) / q);
  const pO = Math.max(0, 1 - pG - pR - pD);
  return PAY_BOOST * (pO * pay + pG * pay * 2.5 + pR * pay * .4 - pD * 50);
}
const estValue = () => S.inv.reduce((s, c) => s + (c.tokens / TASK_TOKENS) * expectedTaskPay(MMAP[c.m], c.q || 1), 0);
// Phase 7.2: AI 接单收入流 ¥/s（自动化开启时按 5 单/s 估算）
function workIncomePerSec() {
  if (!autoOn || !S.upgrades.s2_auto) return 0;
  const tier = selectedTier();
  const cost = Math.round(tier.tokens * techTokenCostMult());
  const card = bestCard(cost);
  if (!card) return 0;
  return 5 * expectedTaskPay(MMAP[card.m], card.q || 1);
}

/* ---------- 工作核心 ---------- */
// Phase 3.4: S2 升级效果（CI/CD 返工-10% 相对、代码审查 删库-5% 相对）
function s2Modifiers() {
  return {
    rework: S.upgrades.s2_cicd ? 0.9 : 1,
    disaster: S.upgrades.s2_review ? 0.95 : 1,
  };
}
// Phase 3.3: 单档结算（tier + 品质 q 修正）
function taskPayout(model, tier, q) {
  // Phase 6.2: 技术乘区（全收入×1.3 / 混合注意力+40%）
  const income = techIncomeMult();
  const pay = RARITY[model.r].basePay * payFactor(model) * tier.payMult * techWorkSpeedMult() * income;
  const roll = Math.random();
  const mod = s2Modifiers();
  // 品质修正: pGreat×q / pRework÷q / pDisaster÷q（各有上限）
  const pGreat = Math.min(.5, (.02 + model.idx / 800) * q + techGreatBonus());
  const pRework = Math.min(QUALITY.reworkCap, Math.min(.25, Math.max(.04, .25 - model.idx / 250)) / q) * mod.rework;
  const pDisaster = techDisasterZero() ? 0 : Math.min(QUALITY.disasterCap, Math.min(.02, Math.max(0, (28 - model.idx) / 1200)) / q) * mod.disaster;
  if (roll < pDisaster) return { amt: -tier.penalty * PAY_BOOST * income, evt: 'disaster' };
  if (roll < pDisaster + pRework) return { amt: 0, evt: 'rework' }; // 返工: 收入 0
  if (roll > 1 - pGreat) return { amt: pay * 2.5 * PAY_BOOST, evt: 'great' };
  return { amt: pay * (.85 + Math.random() * .3) * PAY_BOOST, evt: 'ok' };
}
function bestCard(minTokens = TASK_TOKENS) {
  let best = null;
  for (const c of S.inv) {
    if (c.tokens < minTokens) continue;
    if (!best) { best = c; continue; }
    // EX（超级模型）最高优先
    const ri = r => r === 'EX' ? RORDER.length : RORDER.indexOf(r);
    const dr = ri(MMAP[c.m].r) - ri(MMAP[best.m].r);
    if (dr > 0 || (dr === 0 && MMAP[c.m].idx > MMAP[best.m].idx)) best = c;
  }
  return best;
}
// 消耗 n 单（按稀有度优先），返回明细；tier 决定单耗与赔率
function consumeTasks(n, tier) {
  const items = [];
  // Phase 6.2: LRU 缓存 token 消耗 -20%
  const cost = Math.round(tier.tokens * techTokenCostMult());
  for (let i = 0; i < n; i++) {
    const c = bestCard(cost);
    if (!c) break;
    c.tokens -= cost;
    if (c.tokens <= 0) S.inv.splice(S.inv.indexOf(c), 1); // 耗尽卡自动移除
    const m = MMAP[c.m];
    items.push({ m, res: taskPayout(m, tier, c.q || 1) });
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
function finishWork(tp, items, modeLabel, tier) {
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
  if (totalTasks() <= 0) toast('⚡ Token 已全部耗尽 → 去「市场」补货');
}
function doWork() {
  if (working) return;
  const tier = selectedTier(); // 档位对象
  const batch = (S.upgrades.s2_cloud ? 2 : 1) * (S.upgrades.s2_batch ? 2 : 1) * BATCH_TASKS;
  const n = Math.min(batch, totalTasks());
  if (n <= 0) { toast('没有可用 token，先去市场买！'); SFX.bad(); return; }
  working = true; renderWork();
  SFX.click();
  const items = consumeTasks(n, tier);
  settleItems(items);
  // Phase 3.4: IDE 补全 → 动画间隔 ×0.7
  const interval = 42 * (S.upgrades.s2_ide ? 0.7 : 1);
  const lines = composeLines(items, { rich: true });
  runLines(lines, interval, tp => finishWork(tp, items, '批量工作', tier));
}
function doAuto() {
  if (working) return;
  const tier = selectedTier(); // 档位对象
  const n = totalTasks();
  if (n <= 0) { toast('没有可用 token，先去市场买！'); SFX.bad(); return; }
  working = true; renderWork();
  SFX.pull();
  const items = consumeTasks(n, tier);
  settleItems(items);
  const lines = composeLines(items, { rich: false, maxDetail: 12 });
  runLines(lines, 16, tp => finishWork(tp, items, '⚡ 自动模式', tier));
}

/* ---------- Phase 3.3: 档位选择 ---------- */
let selTier = 'small';
function selectedTier() {
  const t = WORK_TIERS[selTier];
  return t || WORK_TIERS.small;
}
function setTier(key) {
  if (!WORK_TIERS[key]) return;
  selTier = key;
  SFX.click();
  renderWork();
}
// 档位可用性：该档消耗 ≤ 持有最大卡 token 数
function tierAvailable(tier) {
  return S.inv.some(c => c.tokens >= tier.tokens);
}

/* ---------- Phase 3.4: 自动化调度（tick 被动接单） ---------- */
let autoOn = false; // 会话内开关（非存档）
function toggleAuto() {
  autoOn = !autoOn;
  SFX.click();
  toast(autoOn ? '⚡ 自动化调度已开启（每秒 5 单）' : '⏸ 自动化调度已关闭');
  renderWork();
}
// tick: 每秒 5 单，无动画（需解锁自动化调度升级 + 开启开关 + 有 token）
onTick(() => {
  if (!autoOn || !S.upgrades.s2_auto) return;
  if (working) return;
  const tier = selectedTier(); // 档位对象
  const n = Math.min(5, totalTasks());
  if (n <= 0) return;
  const items = consumeTasks(n, tier);
  settleItems(items);
  if (items.length) {
    addWorkLog(`🤖 自动调度 ×${items.length}`, items.reduce((s, x) => s + x.res.amt, 0));
  }
});

