"use strict";
/* ================================================================
   TokenGacha · js/ui/pages.js — 各页面渲染
   Phase 1: 六页拆分 + 阶段锁定守卫
   ================================================================ */

/* ---------- 渲染: 市场 (阶段二半解锁: 余额≥500 开放购买区) ---------- */
function renderBuy() {
  const locked = S.peakMoney < 500;
  $('page-market').classList.toggle('locked', locked);
  $('market-lock').innerHTML = locked ? lockedHTML(2) : '';
  if (locked) return;
  const box = $('pool-cards'); box.innerHTML = '';
  for (const [k, p] of Object.entries(POOLS)) {
    const card = document.createElement('div');
    card.className = 'pool-card' + (p.rec ? ' rec' : '');
    card.style.setProperty('--pc', p.color);
    const pity = S.pity[k];
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
        <button class="pull-btn p10" data-pool="${k}" data-n="10" ${S.money < p.tenPrice ? 'disabled' : ''}>十连抽<small>¥${p.tenPrice} · 必出SR+</small></button>
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
  renderApi();
  renderSell();
}

/* ---------- 渲染: 工作页 ---------- */
function renderWork() {
  const tk = totalTokens(), tasks = totalTasks();
  $('w-tokens').innerHTML = fmtK(tk) + ' <small>tokens</small>';
  $('w-tasks').innerHTML = tasks + ' <small>单</small>';
  $('w-est').textContent = fmt(estValue());
  // Phase 3.3: 档位选择器
  const tierBox = $('tier-select');
  if (tierBox) {
    tierBox.innerHTML = WORK_ORDER.map(key => {
      const t = WORK_TIERS[key];
      const avail = tierAvailable(t);
      return `<button class="tier-btn ${key === selTier ? 'active' : ''} ${avail ? '' : 'no-avail'}" data-tier="${key}"
        title="${avail ? '' : '当前 token 不足以接该档'}">
        ${t.name}<small>${fmtK(t.tokens)} tokens/单 · 报酬 ×${t.payMult}</small>
      </button>`;
    }).join('');
    tierBox.querySelectorAll('[data-tier]').forEach(b => b.onclick = () => setTier(b.dataset.tier));
  }
  // Phase 3.4: 自动化开关
  const autoWrap = $('auto-toggle-wrap');
  if (autoWrap) {
    autoWrap.style.display = S.upgrades.s2_auto ? '' : 'none';
    const tog = $('btn-auto-toggle');
    if (tog) tog.classList.toggle('on', autoOn);
  }
  const rows = $('rarity-rows'); rows.innerHTML = '';
  const maxQ = RARITY.UR.quota * 3;
  for (const r of [...RORDER].reverse()) {
    const cards = S.inv.filter(c => MMAP[c.m].r === r && c.tokens > 0);
    const tkR = cards.reduce((s, c) => s + c.tokens, 0);
    const estR = cards.reduce((s, c) => s + (c.tokens / TASK_TOKENS) * expectedTaskPay(MMAP[c.m], c.q || 1), 0);
    rows.insertAdjacentHTML('beforeend',
      `<div class="rrow" style="--rc:${RARITY[r].hex}">
        <span class="tag">${r}</span>
        <div class="bar"><i style="width:${Math.min(100, tkR / maxQ * 100)}%"></i></div>
        <span class="num">${fmtK(tkR)} tok · ${Math.floor(tkR / TASK_TOKENS)}单</span>
        <span class="est">≈${fmt(estR)}</span>
      </div>`);
  }
  const bw = $('btn-work'), ba = $('btn-auto');
  const tier = selectedTier(); // 返回档位对象本身
  const batch = (S.upgrades.s2_cloud ? 2 : 1) * (S.upgrades.s2_batch ? 2 : 1) * BATCH_TASKS;
  const n = Math.min(batch, tasks);
  bw.disabled = working || tasks <= 0;
  ba.disabled = working || tasks <= 0;
  $('work-sub').textContent = tasks > 0
    ? `一键完成 ${n} 单（${tier.name}）· 消耗 ${fmtK(n * tier.tokens)} tokens`
    : '没有可用 token，去「市场」';
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

/* ---------- 渲染: 资产页 (阶段二解锁) ---------- */
function renderBalance() {
  const locked = !isUnlocked(2);
  $('page-assets').classList.toggle('locked', locked);
  $('assets-lock').innerHTML = locked ? lockedHTML(2) : '';
  if (locked) return;
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
  // Phase 7.2: AGI 总进度 + 五阶段收入明细（资产页）
  const a = agiProgress();
  $('stat-grid').innerHTML = `
    <div class="cell" style="grid-column:1/-1">
      <div class="lb">🧠 AGI 总进度 <b style="float:right;color:#0d9488">${a.pct}%</b></div>
      <div class="agi-bar" style="margin-top:6px"><i style="width:${a.pct}%"></i></div>
      <div style="font-size:10.5px;color:var(--faint);margin-top:4px">${a.txt}</div>
    </div>
    <div class="cell" style="grid-column:1/-1"><div class="lb">📊 五阶段收入明细</div><div class="stage-income">
      <span>🔨 手写代码 ¥${fmt2(clickerIncomePerSec())}/s</span>
      <span>🤖 AI 接单 ¥${fmt2(workIncomePerSec())}/s</span>
      <span>🖥️ 机房自产 ¥${fmt2(gpuIncomePerSec())}/s</span>
      <span>🔬 研究工资 ¥${fmt2(S.stage >= 4 ? wagePerSec() : 0)}/s</span>
    </div></div>
    ${cells.map(([l, v]) => `<div class="cell"><div class="lb">${l}</div><div class="vl">${v}</div></div>`).join('')}
    ${RORDER.map(r => `<div class="cell"><div class="lb">${r} 出货</div><div class="vl" style="color:${RARITY[r].hex}">${S.stats.byR[r] || 0}</div></div>`).join('')}`;
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
  if (!S.inv.length) { g.innerHTML = '<div class="inv-empty" style="grid-column:1/-1">卡库空空如也<br>去「市场」买 token 吧</div>'; }
  else {
    // EX（超级模型）最高优先
    const ri = r => r === 'EX' ? RORDER.length : RORDER.indexOf(r);
    const sorted = [...S.inv].sort((a, b) => ri(MMAP[b.m].r) - ri(MMAP[a.m].r) || b.tokens - a.tokens);
    for (const c of sorted) {
      const m = MMAP[c.m], r = RARITY[m.r];
      const d = document.createElement('div');
      d.className = 'inv-card' + (c.tokens <= 0 ? ' dead' : '');
      d.style.setProperty('--rc', r.hex);
      // Phase 3.1: 品质标签（未揭示显示 ❓，揭示显示 %；检测按钮）
      const qTag = c.revealed
        ? `<span class="qtag" style="background:${qColor(c.q)}">${Math.round(c.q * 100)}%</span>`
        : `<span class="qtag hide-q" title="花 ¥${QUALITY.inspectFee} 检测品质">❓</span>`;
      d.innerHTML = `<span class="rt">${r.name}</span>${c.half ? '<span class="half">体验</span>' : ''}${qTag}`;
      d.appendChild(iconImg(m.icon));
      d.insertAdjacentHTML('beforeend', `<div class="nm">${m.name}</div><div class="tk">${c.tokens > 0 ? fmtK(c.tokens) + ' tok' : '已耗尽'}</div>`);
      if (!c.revealed && c.tokens > 0) {
        const btn = document.createElement('button');
        btn.className = 'qbtn';
        btn.textContent = `🔬 检测 ¥${QUALITY.inspectFee}`;
        btn.onclick = ev => { ev.stopPropagation(); revealCard(c.uid); };
        d.appendChild(btn);
      }
      d.title = `${m.name} · ${m.vendor}\n智能指数 ${m.idx} · 真实成本 ${m.cost}\n${m.quote}`;
      g.appendChild(d);
    }
  }
}
// 品质标签颜色：高绿 / 中黄 / 低红
function qColor(q) {
  if (q >= 0.9) return '#dcfce7;color:#15803d';
  if (q >= 0.75) return '#fef3c7;color:#92600a';
  return '#fee2e2;color:#b91c1c';
}

/* ---------- 渲染: 头部 ---------- */
let shownMoney = S.money;
function renderHeader() {
  $('h-tokens').textContent = fmtK(totalTokens());
  $('h-pulls').textContent = S.stats.pulls;
  // Phase 1: 新资源 chip 按阶段显隐（显存/算力=阶段三，研究=阶段四）
  const hwOn = isUnlocked(3), resOn = isUnlocked(4);
  $('chip-vram').style.display = hwOn ? '' : 'none';
  $('chip-flops').style.display = hwOn ? '' : 'none';
  $('chip-research').style.display = resOn ? '' : 'none';
  // 数值（Phase 4: 真实显存/算力）
  $('h-vram').textContent = fmtK(totalVramUsed());
  $('h-flops').textContent = fmtK(totalFlops());
  $('h-research').textContent = Math.round(S.research.progress) + '%';
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
function renderAll() { renderHeader(); tweenMoney(); renderClicker(); renderBuy(); renderWork(); renderBalance(); renderDashboard(); renderGpu(); renderLab(); checkStageUnlocks(); }

/* ---------- 渲染: 机房 (阶段三) ---------- */
function renderGpu() {
  // Phase 4.2 半解锁：peakMoney≥5000 时显示商店（可买首卡触发正式解锁），不加 locked 遮罩
  const half = !isUnlocked(3) && S.peakMoney >= 5000;
  const locked = !isUnlocked(3) && !half;
  $('page-gpu').classList.toggle('locked', locked);
  $('gpu-lock').innerHTML = locked ? lockedHTML(3) : '';
  const root = $('gpu-root');
  if (!root) return;
  if (!isUnlocked(3)) {
    if (half) {
      const shop = GPUS.map(g => `
        <div class="gpu-shop-card">
          <div class="gpu-name">${g.tier} ${g.name}</div>
          <div class="gpu-specs">显存 ${g.vram}GB · 算力 ${g.flops} TFLOPS · 功耗 ${g.power}W</div>
          <div class="gpu-elec">电费 ¥${g.elec.toFixed(4)}/s</div>
          <button class="up-btn" data-gbuy="${g.id}" ${S.money < g.price ? 'disabled' : ''}>💰 ¥${g.price.toLocaleString('zh-CN')}</button>
        </div>`).join('');
      root.innerHTML = `<div class="panel panel-pad">
        <div class="panel-title">🏬 显卡商店<span class="right">购入首张显卡正式解锁机房</span></div>
        <div class="gpu-shop">${shop}</div>
      </div>`;
      root.querySelectorAll('[data-gbuy]').forEach(b => b.onclick = () => buyGpu(b.dataset.gbuy));
    } else root.innerHTML = '';
    return;
  }
  const slots = pcieSlots(), used = usedSlots();
  // 插槽视图
  let slotsHtml = '';
  const cards = S.gpus.cards || [];
  for (let i = 0; i < slots; i++) {
    const card = cards[i];
    if (!card) { slotsHtml += `<div class="slot empty"><span class="slot-ic">🕳️</span><span class="slot-txt">空插槽</span></div>`; continue; }
    const g = GPU_MAP[card.gpu];
    const m = card.model ? MMAP[card.model] : null;
    slotsHtml += `<div class="slot ${card.running ? 'run' : ''}">
      <div class="slot-head">${g.tier} ${g.name}<span class="slot-st">${card.running ? '▶️ 运行中' : '⏸ 待机'}</span></div>
      <div class="slot-model">${m ? `${m.name}<small>${VRAM_COST[m.r]}GB</small>` : '未部署'}</div>
      <div class="slot-meta">${card.running ? `产出 ${fmtK(gpuOutputPerSec(card))}/s · 电费 ¥${gpuElecPerSec(card).toFixed(4)}/s` : '待机不耗电'}</div>
      <select class="slot-sel" data-card="${card.uid}">
        <option value="">— 卸载 —</option>
        ${deployableModels(card).map(x => `<option value="${x.id}" ${card.model === x.id ? 'selected' : ''}>${x.name}（${VRAM_COST[x.r]}GB）</option>`).join('')}
      </select>
      <div class="slot-btns">
        <button class="mini-btn" data-gtoggle="${card.uid}" ${card.model ? '' : 'disabled'}>${card.running ? '⏸ 暂停' : '▶️ 启动'}</button>
        <button class="mini-btn danger" data-gsell="${card.uid}" title="卖出返还购价 60%，释放插槽">🗑️ 卖出</button>
      </div>
    </div>`;
  }
  // 商店
  const shop = GPUS.map(g => `
    <div class="gpu-shop-card">
      <div class="gpu-name">${g.tier} ${g.name}</div>
      <div class="gpu-specs">显存 ${g.vram}GB · 算力 ${g.flops} TFLOPS · 功耗 ${g.power}W</div>
      <div class="gpu-elec">电费 ¥${g.elec.toFixed(4)}/s</div>
      <button class="up-btn" data-gbuy="${g.id}" ${S.money < g.price ? 'disabled' : ''}>💰 ¥${g.price.toLocaleString('zh-CN')}</button>
    </div>`).join('');
  // S3 升级卡片
  const s3Cards = upgradesOfStage(3).map(u => {
    const owned = !!S.upgrades[u.id];
    return `<div class="upgrade-card ${owned ? 'owned' : ''} ${S.money >= u.price && !owned ? 'afford' : ''}">
      <div class="up-name">${u.name}${owned ? '<span class="up-ok">✓ 已拥有</span>' : ''}</div>
      <div class="up-desc">${u.desc}</div>
      <button class="up-btn" data-up="${u.id}" ${owned || S.money < u.price ? 'disabled' : ''}>${owned ? '已购买' : '💰 ¥' + u.price.toLocaleString('zh-CN')}</button>
    </div>`;
  }).join('');
  root.innerHTML = `
    <div class="dash-grid">
      <div class="panel panel-pad">
        <div class="panel-title">🔌 PCIe 插槽<span class="right">${used}/${slots} 已用</span></div>
        <div class="slot-grid">${slotsHtml}</div>
        <div class="panel-title" style="margin-top:14px">🛠️ 硬件升级<span class="right">阶段三</span></div>
        <div class="upgrade-grid">${s3Cards}</div>
      </div>
      <div class="panel panel-pad">
        <div class="panel-title">🏬 显卡商店<span class="right">部署需图鉴已解锁模型</span></div>
        <div class="gpu-shop">${shop}</div>
      </div>
    </div>`;
  root.querySelectorAll('[data-gbuy]').forEach(b => b.onclick = () => buyGpu(b.dataset.gbuy));
  root.querySelectorAll('[data-gtoggle]').forEach(b => b.onclick = () => toggleGpu(+b.dataset.gtoggle));
  root.querySelectorAll('[data-gsell]').forEach(b => b.onclick = () => sellGpu(+b.dataset.gsell));
  root.querySelectorAll('.slot-sel').forEach(sel => sel.onchange = () => deployModel(+sel.dataset.card, sel.value || null));
  root.querySelectorAll('[data-up]').forEach(b => b.onclick = () => buyUpgrade(b.dataset.up));
}
/* ---------- 渲染: 实验室 (阶段四) ---------- */
// 研究员三档卡片 HTML（半解锁/正式解锁共用）
function researcherCardsHTML() {
  return RESEARCHER_ORDER.map(k => {
    const r = RESEARCHERS[k];
    const n = staffCount(k);
    const affordable = S.money >= r.req;
    return `<div class="researcher-card ${affordable ? 'afford' : ''}">
      <div class="res-name">${r.name}<span class="res-count">×${n}</span></div>
      <div class="res-desc">${r.desc} · 边际递减 1/√n</div>
      <div class="res-meta">当前贡献：${(r.speed * staffDiminish(Math.max(1, n))).toFixed(1)}× · 月薪 ¥${r.salary.toLocaleString('zh-CN')}</div>
      <button class="up-btn" data-hire="${k}" ${!affordable ? 'disabled' : ''}>👥 雇佣（需余额 ≥ ¥${r.req.toLocaleString('zh-CN')}）</button>
    </div>`;
  }).join('');
}
function renderLab() {
  // 半解锁：peakMoney≥50000 时显示研究员雇佣区（可雇首名触发正式解锁）
  const half = !isUnlocked(4) && S.peakMoney >= 50000;
  const locked = !isUnlocked(4) && !half;
  $('page-lab').classList.toggle('locked', locked);
  $('lab-lock').innerHTML = locked ? lockedHTML(4) : '';
  const root = $('lab-root');
  if (!root) return;
  if (!isUnlocked(4)) {
    if (half) {
      root.innerHTML = `<div class="dash-grid">
        <div class="panel panel-pad">
          <div class="panel-title">👥 研究员<span class="right">雇佣首名研究员正式解锁实验室</span></div>
          <div class="res-grid">${researcherCardsHTML()}</div>
        </div>
      </div>`;
      root.querySelectorAll('[data-hire]').forEach(b => b.onclick = () => hireResearcher(b.dataset.hire));
    } else root.innerHTML = '';
    return;
  }
  const progress = Math.min(100, S.research.progress);
  // 研究员三档卡片
  const staffHtml = researcherCardsHTML();
  // 进度大条
  const speed = researchSpeed();
  const wage = wagePerSec();
  // Phase 6.3: 技术树面板（阶段五解锁后显示）
  const techPanel = isUnlocked(5) ? `
    <div class="panel panel-pad" style="margin-top:14px">
      <div class="panel-title">🧠 技术树<span class="right">AI 占比 ${Math.round(S.aiRatio * 100)}% · 解锁 ${S.techs.length}/9 达成 AGI</span></div>
      <div class="tech-tree">${techTreeHTML()}</div>
    </div>` : '';
  root.innerHTML = `
    <div class="dash-grid">
      <div class="panel panel-pad">
        <div class="panel-title">🧠 研究进度<span class="right">${progress.toFixed(2)}%${S.research.done ? ' · ✅ 已完成' : ''}</span></div>
        <div class="research-bar"><i style="width:${progress}%"></i><span>${progress.toFixed(1)}%</span></div>
        <div class="research-meta">
          <span>⚡ 速度 ${speed.toFixed(3)}%/s</span>
          <span>💸 工资 ${fmt2(wage)}/s</span>
          <span>💡 灵感迸发 ×${S.stats.breakthroughs}</span>
        </div>
        <div class="panel-title" style="margin-top:14px">👥 研究员</div>
        <div class="res-grid">${staffHtml}</div>
        <div class="panel-title" style="margin-top:14px">🛠️ 研究升级<span class="right">阶段四</span></div>
        <div class="upgrade-grid" id="s4-upgrades"></div>
      </div>
      <div class="panel panel-pad">
        <div class="panel-title">🔬 研发日志<span class="right">工资与灵感</span></div>
        <div class="research-log" id="research-log"></div>
      </div>
    </div>
    ${techPanel}`;
  root.querySelectorAll('[data-hire]').forEach(b => b.onclick = () => hireResearcher(b.dataset.hire));
  // Phase 6.3: 技术树购买
  root.querySelectorAll('[data-techbuy]').forEach(b => b.onclick = () => unlockTech(b.dataset.techbuy));
  // S4 升级卡片
  const g4 = $('s4-upgrades');
  if (g4) {
    g4.innerHTML = '';
    for (const u of upgradesOfStage(4)) {
      const owned = !!S.upgrades[u.id];
      const d = document.createElement('div');
      d.className = 'upgrade-card' + (owned ? ' owned' : '') + (S.money >= u.price && !owned ? ' afford' : '');
      d.innerHTML = `<div class="up-name">${u.name}${owned ? '<span class="up-ok">✓ 已拥有</span>' : ''}</div>
        <div class="up-desc">${u.desc}</div>
        <button class="up-btn" data-up="${u.id}" ${owned || S.money < u.price ? 'disabled' : ''}>${owned ? '已购买' : '💰 ¥' + u.price.toLocaleString('zh-CN')}</button>`;
      g4.appendChild(d);
    }
    g4.querySelectorAll('[data-up]').forEach(b => b.onclick = () => buyUpgrade(b.dataset.up));
  }
  renderResearchLog();
}
function renderResearchLog() {
  const log = $('research-log');
  if (!log) return;
  // 会话内日志（工资与灵感），从 stats 派生
  const rows = [];
  if (S.stats.breakthroughs > 0) rows.push(`<div class="rlog-row">💡 灵感迸发 ×${S.stats.breakthroughs}（每次 +10%）</div>`);
  rows.push(`<div class="rlog-row">💸 累计工资支出 ${fmt(S.stats.wages)}</div>`);
  if (S.research.done) rows.push('<div class="rlog-row">🧠 AGI-X 研发完成！</div>');
  log.innerHTML = rows.length ? rows.join('') : '<div class="rlog-empty">雇佣研究员开始研究…</div>';
}

/* ---------- Phase 6.3: 技术树渲染 ---------- */
function techTreeHTML() {
  const rows = TECH_TREE.map((layer, li) => {
    const nodes = layer.map(id => {
      const t = TECHS[id];
      const owned = S.techs.includes(id);
      const unlockable = canUnlockTech(id);
      const st = owned ? 'owned' : (unlockable ? 'unlockable' : 'locked');
      const pre = t.pre.length ? `<small class="tt-pre">需 ${t.pre.map(p => TECHS[p].name.replace(/^\S+\s/, '')).join('、')}</small>` : '';
      return `<div class="tech-node ${st}" data-tech="${id}">
        <div class="tt-name">${t.name}</div>
        <div class="tt-desc">${t.desc}</div>
        <div class="tt-ai">AI +${t.ai}%</div>
        ${owned ? '<div class="tt-ok">✓ 已解锁</div>' : `<button class="tt-btn" data-techbuy="${id}" ${unlockable ? '' : 'disabled'}>💰 ¥${t.price.toLocaleString('zh-CN')}</button>`}
        ${pre}
      </div>`;
    }).join('');
    return `<div class="tech-layer">${nodes}</div>`;
  }).join('');
  return `<div class="tech-tree-inner">
    <div class="tech-root">🧠 超级模型 AGI-X</div>
    ${rows}
    <div class="tech-root">👾 AGI（AI 占比 100%）</div>
  </div>`;
}

