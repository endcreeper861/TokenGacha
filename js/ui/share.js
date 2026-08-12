"use strict";
/* ================================================================
   TokenGacha · js/ui/share.js — 分享卡片
   ================================================================ */

/* ---------- 分享 ---------- */
let shareCtx = { cv: null, ms: null };
function shareText(ms) {
  const best = S.stats.best ? MMAP[S.stats.best].name : '无';
  const stageTxt = `阶段${S.stage}/5`;
  if (S.flags.agi) {
    return `🧠 我亲手研发出了 AGI！TokenGacha 五阶段通关：阶段 ${S.stage}/5，技术 ${S.techs.length}/9，累计赚取 ${fmt(S.stats.earn)}，最佳模型 ${best}，删库 ${S.stats.disasters} 次🤡。你也能做到吗？👉 ${SITE_URL}`;
  }
  if (ms) return `【${ms.title} ${ms.tag}】我在 TokenGacha 达成新成就（${stageTxt}）！抽卡 ${S.stats.pulls} 次、工作 ${S.stats.tasks} 单、自产 ${fmtK(S.stats.selfTokens)} tokens，现在余额 ${fmt(S.money)}。从手写代码到 AGI，你能走多远？👉 ${SITE_URL}`;
  return `我在 TokenGacha 从手写代码打到 ${stageTxt}：余额 ${fmt(S.money)}，抽卡 ${S.stats.pulls} 次，最佳出货 ${best}，删库 ${S.stats.disasters} 次🤡，自产 ${fmtK(S.stats.selfTokens)} tokens。距离 AGI 还差 AI 占比 ${Math.round(S.aiRatio * 100)}%。👉 ${SITE_URL}`;
}
function roundRectPath(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
function drawShareCard(ms) {
  const W = 900, H = 500, cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const g = cv.getContext('2d');
  const gr = g.createLinearGradient(0, 0, W, H);
  gr.addColorStop(0, '#eaf1ff'); gr.addColorStop(.55, '#f6f3ff'); gr.addColorStop(1, '#fff7ea');
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  for (const [c, x, y, r] of [['#2f6bff', 60, 60, 90], ['#9333ea', 840, 80, 70], ['#f59e0b', 820, 430, 100], ['#41d9ff', 80, 440, 60]]) {
    g.globalAlpha = .08; g.fillStyle = c; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
  }
  g.globalAlpha = 1; g.textAlign = 'center';
  const F = '"PingFang SC","Microsoft YaHei",system-ui';
  g.font = '44px ' + F; g.fillText('🎰', W / 2, 86);
  g.font = '900 30px ' + F; g.fillStyle = '#1c2340'; g.fillText('TokenGacha · LLM API 中转站', W / 2, 128);
  g.font = '900 46px ' + F; g.fillStyle = ms ? '#d97706' : '#2f53d8';
  g.fillText(ms ? ms.title : '我的抽卡战绩', W / 2, 196);
  if (ms) { g.font = '600 22px ' + F; g.fillStyle = '#67719a'; g.fillText(ms.tag, W / 2, 232); }
  g.font = '900 64px ' + F; g.fillStyle = '#d97706';
  g.fillText('¥' + Math.round(S.money).toLocaleString('zh-CN'), W / 2, ms ? 300 : 288);
  g.font = '500 18px ' + F; g.fillStyle = '#98a2c8'; g.fillText('账户余额', W / 2, ms ? 330 : 318);
  const best = S.stats.best ? MMAP[S.stats.best].name : '—';
  const cells = [['阶段', `S${S.stage}/5`], ['抽卡次数', S.stats.pulls], ['工作单数', S.stats.tasks], ['删库事故', S.stats.disasters]];
  if (S.stage >= 4) cells[0] = ['AI 占比', Math.round(S.aiRatio * 100) + '%'];
  const cw = 180, gap = 16, x0 = (W - (cw * 4 + gap * 3)) / 2, y0 = 352;
  cells.forEach(([l, v], i) => {
    const x = x0 + i * (cw + gap);
    g.fillStyle = 'rgba(255,255,255,.78)'; roundRectPath(g, x, y0, cw, 86, 14); g.fill();
    g.strokeStyle = '#e3e8f2'; g.stroke();
    g.font = '500 15px ' + F; g.fillStyle = '#98a2c8'; g.fillText(l, x + cw / 2, y0 + 30);
    g.font = '800 21px ' + F; g.fillStyle = '#1c2340'; g.fillText(String(v), x + cw / 2, y0 + 62);
  });
  g.font = '700 20px ' + F; g.fillStyle = '#2f6bff';
  g.fillText(S.flags.agi ? '我已达成 AGI，你敢挑战吗？👉 tokengacha.metagaruta.com' : '从手写代码到 AGI，你能走多远？👉 tokengacha.metagaruta.com', W / 2, 478);
  return cv;
}
function shareHTML(ms) {
  return `<h3>📣 分享战绩<button class="x" onclick="closeModal()">×</button></h3>
  <div style="border-radius:12px;overflow:hidden;border:1px solid var(--line);margin-bottom:12px;box-shadow:var(--shadow)"><img id="share-img" style="width:100%;display:block" alt="分享图"></div>
  <div style="background:var(--panel2);border:1px solid var(--line);border-radius:10px;padding:10px 12px;font-size:12px;color:var(--dim);margin-bottom:12px;line-height:1.6">${shareText(ms)}</div>
  <div style="display:flex;gap:8px;flex-wrap:wrap">
    <button class="big-btn" style="flex:1;margin-top:0;min-width:130px" id="btn-copy-share">📋 复制文案</button>
    <button class="big-btn ghost" style="flex:1;margin-top:0;min-width:130px" id="btn-dl-share">🖼️ 保存图片</button>
    ${(typeof navigator !== 'undefined' && navigator.share) ? '<button class="big-btn ghost" style="flex:1;margin-top:0;min-width:130px" id="btn-sys-share">📤 系统分享</button>' : ''}
  </div>`;
}
function openShare(ms) {
  const cv = drawShareCard(ms);
  shareCtx = { cv, ms };
  showModal(shareHTML(ms));
  $('share-img').src = cv.toDataURL('image/png');
}
function copyText(t) {
  const done = () => toast('📋 分享文案已复制，去粘贴给小伙伴吧');
  const legacy = () => { const ta = document.createElement('textarea'); ta.value = t; ta.style.cssText = 'position:fixed;opacity:0'; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); } catch (e) { } ta.remove(); };
  if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(t).then(done).catch(() => { legacy(); done(); }); }
  else { legacy(); done(); }
}
