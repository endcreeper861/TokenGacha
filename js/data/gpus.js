"use strict";
/* ================================================================
   TokenGacha · js/data/gpus.js — 六档显卡数据 (Phase 4.1)
   price 价格 / vram 显存GB / flops 算力TFLOPS / power 功耗W / elec 电费¥/秒
   ================================================================ */

const GPUS = [
  { id: 'g4060', name: 'RTX 4060', tier: '🟢', price: 2500, vram: 8,  flops: 15,   power: 115,  elec: 0.0005 },
  { id: 'g4070', name: 'RTX 4070', tier: '🟡', price: 5500, vram: 12, flops: 29,   power: 200,  elec: 0.0009 },
  { id: 'g4090', name: 'RTX 4090', tier: '🟠', price: 15000, vram: 24, flops: 83,   power: 450,  elec: 0.0020 },
  { id: 'gA100', name: 'A100',     tier: '🔴', price: 80000, vram: 80, flops: 312,  power: 400,  elec: 0.0018 },
  { id: 'gH100', name: 'H100',     tier: '🟣', price: 250000, vram: 80, flops: 756,  power: 700,  elec: 0.0032 },
  { id: 'gB200', name: 'B200',     tier: '👑', price: 500000, vram: 192, flops: 1250, power: 1000, elec: 0.0045 },
];
const GPU_MAP = Object.fromEntries(GPUS.map(g => [g.id, g]));
