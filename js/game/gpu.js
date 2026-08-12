"use strict";
/* ================================================================
   TokenGacha · js/game/gpu.js — GPU 机房系统 (Phase 4)
   显卡购买 / 模型部署 / 启停 / 产出与电费 (tick)
   ================================================================ */

// 显卡卡槽结构: { uid, gpu: gpuId, model: modelId|null, running: bool, createdAt }
function newCard(gpuId) {
  return { uid: S.uid++, gpu: gpuId, model: null, running: false, createdAt: Date.now() };
}

// PCIe 总槽数（基础 2 + S3 扩展卡/矿场托管）
function pcieSlots() {
  return 2 + (S.upgrades.s3_pcie ? 1 : 0) + (S.upgrades.s3_farm ? 2 : 0);
}
// 已用槽数
function usedSlots() {
  return (S.gpus.cards || []).length;
}

// 购买显卡：校验余额 + 插槽数
function buyGpu(gpuId) {
  const g = GPU_MAP[gpuId];
  if (!g) return;
  if (S.money < g.price) { toast('💸 余额不足！'); SFX.bad(); return; }
  if (usedSlots() >= pcieSlots()) { toast(`🖥️ PCIe 插槽已满（${pcieSlots()} 槽）！买扩展卡扩容`); SFX.bad(); return; }
  S.money -= g.price;
  S.stats.spent += g.price;
  if (!S.gpus.cards) S.gpus.cards = [];
  S.gpus.cards.push(newCard(gpuId));
  addLedger(`🖥️ 购入 ${g.tier} ${g.name}`, -g.price);
  save(); renderAll();
  SFX.coin();
  toast(`🖥️ ${g.name} 已上机！去部署模型开始产出`);
  // 首张显卡 → 阶段三正式解锁（checkStageUnlocks 在 renderAll 尾部）
}

// 可部署模型：图鉴已解锁 + 显存不超该卡（Phase 6.2 MoE ×1.5）
function deployableModels(card) {
  const g = GPU_MAP[card.gpu];
  const cap = g.vram * techDeployVramMult();
  const out = [];
  const cands = MMAP.agix ? [...MODELS, MMAP.agix] : MODELS;
  for (const m of cands) {
    if (!S.dex[m.id]) continue;
    if (VRAM_COST[m.r] > cap) continue;
    out.push(m);
  }
  return out;
}

// 部署模型到指定卡（显存校验；Phase 6.2 MoE 路由显存上限 +50%）
function deployModel(cardUid, modelId) {
  const card = (S.gpus.cards || []).find(c => c.uid === cardUid);
  if (!card) return;
  const g = GPU_MAP[card.gpu];
  const m = modelId ? MMAP[modelId] : null;
  const cap = g.vram * techDeployVramMult();
  if (m && VRAM_COST[m.r] > cap) { toast('🖥️ 显存不足，无法部署该模型'); SFX.bad(); return; }
  if (m && !S.dex[m.id]) { toast('📖 尚未解锁该模型（图鉴未点亮）'); SFX.bad(); return; }
  card.model = m ? m.id : null;
  card.running = m ? true : false; // 部署即开机
  if (m) addLedger(`🖥️ 部署 ${m.name} → ${g.name}`, 0);
  save(); renderAll();
  SFX.click();
  toast(m ? `🖥️ ${m.name} 已部署到 ${g.name}，开始产出！` : '🖥️ 已卸载模型');
}

// 启停切换
function toggleGpu(cardUid) {
  const card = (S.gpus.cards || []).find(c => c.uid === cardUid);
  if (!card || !card.model) return;
  card.running = !card.running;
  if (card.running) toast(`▶️ ${GPU_MAP[card.gpu].name} 已启动`);
  else toast(`⏸ ${GPU_MAP[card.gpu].name} 已暂停（不耗电）`);
  save(); renderAll();
  SFX.click();
}

/* ---------- Phase 4.3: tick 产出与电费 ---------- */
// 单卡每秒产出 tokens（智能调度 +20% · Phase 6.2 推测解码 ×2）
function gpuOutputPerSec(card) {
  const g = GPU_MAP[card.gpu];
  if (!card.model || !card.running) return 0;
  const m = MMAP[card.model];
  const mult = (S.upgrades.s3_sched ? 1.2 : 1) * techSelfOutputMult();
  return g.flops * (SELF_RATE[m.r] || 0) * mult;
}
// 单卡每秒电费（水冷 -15%，太阳能白天 -30%）
function gpuElecPerSec(card) {
  const g = GPU_MAP[card.gpu];
  if (!card.model || !card.running) return 0;
  let e = g.elec * (S.upgrades.s3_water ? 0.85 : 1);
  if (S.upgrades.s3_solar && isDaytime()) e *= 0.7;
  return e;
}
function isDaytime() {
  const h = new Date().getHours();
  return h >= 6 && h < 18;
}
// 自产 token 入 inv：聚合同模型卡（q=1.0, src='self'）
function gpuProduce(card, tokens) {
  if (tokens <= 0) return;
  let c = S.inv.find(x => x.m === card.model && x.src === 'self');
  if (!c) {
    c = { uid: S.uid++, m: card.model, tokens: 0, max: tokens, half: false, q: QUALITY.self, src: 'self', revealed: true };
    S.inv.push(c);
  }
  c.tokens += tokens;
  c.max = Math.max(c.max, c.tokens);
  S.stats.selfTokens += tokens;
}
// tick 回调：产出 + 扣电费；余额不足自动停转
onTick(() => {
  if (S.stage < 3) return;
  const cards = S.gpus.cards || [];
  for (const card of cards) {
    if (!card.model || !card.running) continue;
    const out = gpuOutputPerSec(card);
    if (out > 0) gpuProduce(card, out);
    const elec = gpuElecPerSec(card);
    if (elec > 0) {
      if (S.money < elec) {
        card.running = false;
        save();
        toast(`🖥️ 余额不足，${GPU_MAP[card.gpu].name} 已自动停转！`);
      } else {
        S.money -= elec;
        S.stats.elecCost += elec;
      }
    }
  }
  save();
});

/* ---------- 派生统计 ---------- */
// 总显存占用（已部署模型）
function totalVramUsed() {
  let v = 0;
  for (const c of S.gpus.cards || []) if (c.model) v += VRAM_COST[MMAP[c.model].r];
  return v;
}
// 总算力（工作中显卡）
function totalFlops() {
  let f = 0;
  for (const c of S.gpus.cards || []) if (c.running) f += GPU_MAP[c.gpu].flops;
  return f;
}
// 机房自产收入 ¥/s（按自用估值=官方价 ×1，token 可接单变现；卖出仅 ×0.6）
function gpuIncomePerSec() {
  let v = 0;
  for (const c of S.gpus.cards || []) {
    if (!c.model || !c.running) continue;
    const r = MMAP[c.model].r;
    const unit = API_PRICE[r] / API_UNIT; // 自用估值（官方价）
    v += gpuOutputPerSec(c) * unit;
  }
  return v;
}
