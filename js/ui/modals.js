"use strict";
/* ================================================================
   TokenGacha · js/ui/modals.js — 弹窗体系与结局检测
   ================================================================ */

/* ---------- 结局检测 (Phase 3.5: 删破产, 里程碑保留) ---------- */
function checkEnd() {
  if (!S.flags.cheated) for (const ms of MILESTONES) {
    if (S.money >= ms.at && !S.flags.ms[ms.id]) {
      S.flags.ms[ms.id] = true; save();
      SFX.win();
      burst(innerWidth / 2, innerHeight / 3, ['#f59e0b', '#2f6bff', '#ff5f6d', '#fff'], ms.at >= 100000 ? 320 : 200, ms.at >= 100000 ? 13 : 11);
      setTimeout(() => showModal(milestoneHTML(ms)), 400);
      return;
    }
  }
}

/* ---------- 弹窗 ---------- */
function showModal(html, lock = false) { const b = $('modal-box'); b.innerHTML = html; if (lock) b.dataset.locked = '1'; else delete b.dataset.locked; $('modal-mask').classList.add('show'); }
$('modal-mask').addEventListener('click', e => { if (e.target.id === 'modal-mask' && !$('modal-box').dataset.locked) $('modal-mask').classList.remove('show'); });
function closeModal() { $('modal-mask').classList.remove('show'); }

/* ---------- 充值（作弊模式） ---------- */
const TOPUP_MAX = 64800;
function topupHTML() {
  const tiers = [6, 30, 68, 128, 328, 648, 6480, 64800];
  return `<h3>💳 充值中心（作弊模式）<button class="x" onclick="closeModal()">×</button></h3>
  <div class="notice" style="margin-bottom:12px"><span class="dot"></span><span>⚠️ <b>作弊警告</b>：充值后本局将<b>永久关闭成就系统</b>（🎉 小有所成 / 🏆 财富自由 / 👑 传奇大亨 均无法再解锁）。已解锁的成就保留，余额页将打上「作弊」标记。</span></div>
  <p style="font-size:13px;color:var(--dim);margin-bottom:4px">输入充值金额（单次上限 <b>¥64,800</b>）：</p>
  <input id="topup-amt" type="number" min="1" max="64800" step="1" placeholder="想充多少，自己填" style="width:100%;padding:12px 14px;font-size:18px;font-weight:800;border:1.5px solid var(--line);border-radius:12px;margin:6px 0 12px;font-variant-numeric:tabular-nums;color:var(--txt);background:var(--panel2);outline:none">
  <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px">${tiers.map(t => `<button class="mini-btn" data-amt="${t}" style="flex:1;min-width:64px;padding:8px 4px">¥${t.toLocaleString('zh-CN')}</button>`).join('')}</div>
  <div class="note">双倍返利？没有。首充礼包？也没有。这里是作弊，不是福利。</div>
  <button class="big-btn danger" id="btn-do-topup">确认充值（并放弃成就）</button>`;
}
function doTopup() {
  const raw = ($('topup-amt') && $('topup-amt').value || '').trim();
  const v = Number(raw);
  if (!raw || !isFinite(v) || v <= 0) { toast('请输入有效金额'); SFX.bad(); return; }
  if (v > TOPUP_MAX) { toast(`单次充值上限 ${fmt(TOPUP_MAX)}！想充更多请分多次（老赌徒了）`); SFX.bad(); return; }
  const amt = Math.round(v);
  const fromRect = { left: innerWidth / 2 - 60, top: innerHeight / 2 - 40, width: 120, height: 80 };
  S.money += amt;
  S.flags.cheated = true;
  addLedger('💳 充值（作弊模式）', amt);
  save(); closeModal(); renderAll();
  SFX.coin();
  bigMoneyPop(amt);
  coinShower(fromRect, amt);
  toast(`💳 充值 ${fmt(amt)} 已到账！成就系统已永久关闭（本局）`, 3000);
  checkEnd();
}
function rtCell(r) { return `<span class="rt-${r}">${RARITY[r].name}</span>`; }
function ratesHTML() {
  let rows = '';
  for (const [k, p] of Object.entries(POOLS)) {
    rows += `<tr><td><b style="color:${p.color}">${p.name}</b><br><small>¥${p.price}/抽 · ¥${p.tenPrice}/十连</small></td>
      ${['N', 'R', 'SR', 'SSR', 'UR'].map(r => `<td>${p.rates[r] ? rtCell(r) + '<br>' + (p.rates[r] * 100).toFixed(1) + '%' : '—'}</td>`).join('')}
      <td>${p.rtp}</td></tr>`;
  }
  return `<h3>📊 概率公示（像正规抽卡游戏一样诚实）<button class="x" onclick="closeModal()">×</button></h3>
  <table><tr><th>卡池</th><th>N 垃圾</th><th>R 普通</th><th>SR 精锐</th><th>SSR 传说</th><th>UR 神话</th><th>期望回本率</th></tr>${rows}</table>
  <div class="note">
  · ⚠️ 卡池页展示的「回本率」为宣传口径，你懂的；上表才是实测数学期望。本站保留最终解释权。<br>
  · 稀有度按 <a href="https://artificialanalysis.ai/leaderboards/models" target="_blank">Artificial Analysis 智能指数 v4.1</a> 分档：UR≥55 / SSR 47-54 / SR 40-46 / R 28-39 / N&lt;28<br>
  · 每池 ${PITY_MAX} 抽无 SSR+ 触发保底（80% SSR / 20% UR）；十连必出 SR 及以上<br>
  · 新手池为「体验卡」，token 额度 ×50%<br>
  · <b>Token 品质分布</b>：盲盒品质 60%~100% 随机（购买前不可见，可花 ¥${QUALITY.inspectFee}/张检测揭示）；官方 API 品质 95%；机房产出自产品质 100%。品质越高大成功越多、返工/删库越少（返工率上限 ${Math.round(QUALITY.reworkCap * 100)}%、删库率上限 ${Math.round(QUALITY.disasterCap * 100)}%）<br>
  · 工作收入 = 模型报价 × 档位倍率 × 事件倍率（大成功×2.5 / 返工=0 / 删库赔档位罚金）；品质影响四态概率<br>
  · 删库最多扣到 ¥0（不会破产，点击器永远保底）。</div>`;
}
function dexHTML() {
  const counts = {};
  for (const r of RORDER) counts[r] = MODELS.filter(m => m.r === r).length;
  // Phase 5.4: 超级模型 AGI-X 附加（EX 稀有度）
  const exList = MMAP.agix ? [MMAP.agix] : [];
  const totalModels = MODELS.length + exList.length;
  const got = Object.keys(S.dex).length;
  const html = `<h3>📖 模型图鉴 ${got}/${totalModels}<button class="x" onclick="closeModal()">×</button></h3>
  <div class="dex-legend">${RORDER.map(r => `<span style="color:${RARITY[r].hex}">■</span> ${r} ${RARITY[r].label} ×${counts[r]}`).join('　')}${MMAP.agix ? `<span style="color:${RARITY.EX.hex}">■</span> EX ${RARITY.EX.label} ×1` : ''}</div>
  <div class="dex-grid" id="dex-grid"></div>
  <div class="note" style="margin-top:10px">收录 OpenAI / Anthropic / Google / xAI / DeepSeek / Moonshot / 智谱 / 阿里 / Meta / Mistral / NVIDIA / Amazon / 小米 / MiniMax / 字节 / 百度 / 腾讯 / 讯飞 等 18 家厂商。排名参考 Artificial Analysis 智能指数 v4.1。</div>`;
  showModal(html);
  const grid = $('dex-grid');
  const sorted = [...MODELS, ...exList].sort((a, b) => {
    const ri = r => r === 'EX' ? RORDER.length : RORDER.indexOf(r);
    return ri(b.r) - ri(a.r) || b.idx - a.idx;
  });
  grid.innerHTML = sorted.map(m => {
    const owned = S.dex[m.id] > 0;
    return `<div class="dex-cell ${owned ? '' : 'locked'}" style="--rc:${RARITY[m.r].hex}" title="${m.name} · ${m.vendor}&#10;${m.quote}">
      <span class="rr">${m.r}</span><div class="ic"></div>
      <div class="nm">${owned ? m.name : '？？？'}</div>
      <div class="ct">${owned ? `指数 ${m.idx} · 抽到 ${S.dex[m.id]} 次` : '未获得'}</div></div>`;
  }).join('');
  sorted.forEach((m, i) => { grid.children[i].querySelector('.ic').appendChild(iconImg(m.icon)); });
}
function helpHTML() {
  return `<h3>❓ 玩法说明<button class="x" onclick="closeModal()">×</button></h3>
  <p>你是独立开发者，从<b>手写代码</b>白手起家，一路升级到研发自己的 AGI。五个阶段<b>并行叠加</b>：每个新阶段在旧阶段基础上增加新收入来源。</p>
  <p>🔨 <b>阶段一 · 手写代码</b>：工作台狂点「写代码」按钮攒第一桶金（¥500）→ 市场开放。</p>
  <p>🤖 <b>阶段二 · AI 接单</b>：市场买 token（官方 API 稳赚 / 盲盒赌运气，品质 60%~100% 可花 ¥20 检测）→ 工作台接单变现。攒到 ¥5,000 买第一张显卡。</p>
  <p>🖥️ <b>阶段三 · GPU 机房</b>：显卡部署已解锁模型自动产纯净 token（品质 100%）→ 自用或卖出。攒到 ¥50,000 雇第一个研究员。</p>
  <p>🔬 <b>阶段四 · 模型研发</b>：雇研究员（工资月薪/600 秒扣）推进研究 → 100% 研发出超级模型 AGI-X。</p>
  <p>🧠 <b>阶段五 · AGI 之路</b>：实验室解锁 9 项技术（金钱+前置），AI 占比从 5% 到 100% → <b>AGI 通关</b>，解锁沙盒模式。</p>
  <p>💡 攻略：白银盲盒是主力卡池；工作档位越大越赚风险越高；机房产出 token 自用比卖出更划算；删库最多扣到 ¥0 不会破产（点击器永远保底）。</p>
  <p>⌨️ 快捷键：<span class="kbd">空格</span> 批量接单</p>
  <button class="big-btn ghost" id="btn-reset">🗑️ 清空存档，重新来过</button>`;
}
function endStats() {
  const best = S.stats.best ? MMAP[S.stats.best] : null;
  const rows = [['总抽数', S.stats.pulls], ['工作单数', S.stats.tasks], ['累计收入', fmt(S.stats.earn)], ['累计氪金', fmt(S.stats.spent)], ['大成功', S.stats.greats], ['删库事故', S.stats.disasters], ['最佳出货', best ? best.name : '无']];
  return `<div class="end-stats">${rows.map(([l, v]) => `<div class="cell"><div class="lb">${l}</div><b>${v}</b></div>`).join('')}</div>`;
}
function milestoneHTML(ms) {
  return `<div class="end-title">${ms.title}</div>
  <div class="end-sub">${ms.tag}！${ms.hype}</div>
  ${endStats()}
  <button class="big-btn" data-share-ms="${ms.id}">📣 分享这一时刻</button>
  <button class="big-btn ghost" onclick="closeModal()">继续压榨中转站 →</button>`;
}
function welcomeHTML() {
  return `<h3>🎰 欢迎来到 TokenGacha</h3>
  <p>你是独立开发者，身上一分钱没有，只有一台能写代码的电脑。</p>
  <p>🔨 去<b>工作台</b>狂点「写代码」按钮接私活——攒够 <b>¥500</b> 后市场会开放，买第一个模型 token 进入 AI 接单时代。</p>
  <p>目标：从手写代码一路升级到研发自己的 <b>AGI</b>。五个阶段并行叠加，越后期收入来源越多。</p>
  <button class="big-btn" id="btn-start">💻 开始写代码！</button>`;
}

