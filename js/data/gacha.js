"use strict";
/* ================================================================
   TokenGacha · js/data/gacha.js — 卡池与经济常量
   ================================================================ */

/* ---------- 稀有度 & 经济参数 (与蒙特卡洛模拟一致) ---------- */
const RARITY = {
  N: { name: 'N', label: '垃圾', hex: '#94a3b8', min: 10, max: 27, tasks: 4, basePay: 3.2, quota: 400000 },
  R: { name: 'R', label: '普通', hex: '#3b82f6', min: 28, max: 39, tasks: 8, basePay: 7.2, quota: 800000 },
  SR: { name: 'SR', label: '精锐', hex: '#9333ea', min: 40, max: 46, tasks: 12, basePay: 15.5, quota: 1200000 },
  SSR: { name: 'SSR', label: '传说', hex: '#f59e0b', min: 47, max: 54, tasks: 16, basePay: 35, quota: 1600000 },
  UR: { name: 'UR', label: '神话', hex: '#ec4899', min: 55, max: 61, tasks: 20, basePay: 80, quota: 2000000 },
};
const RORDER = ['N', 'R', 'SR', 'SSR', 'UR'];
const POOLS = {
  newbie: {
    name: '青铜盲盒', sub: '新手体验池 · token 额度 ×50%', color: '#8ba3c7', price: 30, tenPrice: 285,
    rates: { N: .695, R: .26, SR: .04, SSR: .005, UR: 0 }, half: true, rtp: '约 73%', rtpFake: '约 88%',
    note: '体验卡额度减半。适合第一桶金，别指望出奇迹。',
    featured: ['doubao', 'qwen37', 'mistral3', 'gpt4']
  },
  standard: {
    name: '白银盲盒', sub: '标准池 · 全档位可出', color: '#3b82f6', price: 150, tenPrice: 1425, rec: true,
    rates: { N: .407, R: .34, SR: .18, SSR: .055, UR: .018 }, half: false, rtp: '约 109%', rtpFake: '约 128%',
    note: '主力卡池。UR 爆率 1.8%，出一张 Claude Opus 5 直接起飞。',
    featured: ['opus5', 'gpt56sol', 'glm52', 'dsv4pro']
  },
  flagship: {
    name: '王者盲盒', sub: '旗舰池 · 不出 N 垃圾 · 欧皇专属', color: '#f59e0b', price: 600, tenPrice: 5700,
    rates: { N: 0, R: .15, SR: .60, SSR: .20, UR: .05 }, half: false, rtp: '约 74%', rtpFake: '约 168%',
    note: '⚠️ UR 爆率仅 5%。庄家镰刀最锋利的一关：欧皇的天堂，赌狗的坟场。',
    featured: ['opus5', 'fable5', 'kimik3', 'grok45']
  },
};
const PITY_MAX = 50;
const TASK_TOKENS = 200000;
const PAY_BOOST = 3.0;   // 工作报酬倍率（Phase 7.1 调校: 官方 API 全档位微利, 原 1.3）
const BATCH_TASKS = 10;          // 手动一次工作 = 10 单
const VICTORY_AT = 50000;
const SITE_URL = 'https://tokengacha.metagaruta.com';

/* ---------- Phase 3: Token 品质系统 ---------- */
const QUALITY = {                    // 品质 = 工作结果概率修正系数
  min: 0.6, max: 1.0,                // 盲盒随机区间
  official: 0.95,                    // 官方 API 固定品质
  self: 1.0,                         // 自产 token（阶段三）
  inspectFee: 20,                    // 检测费 ¥/张（揭示品质）
  reworkCap: 0.40,                   // 返工率上限（品质修正后）
  disasterCap: 0.15,                 // 删库率上限（品质修正后）
};
// 官方 API 定价（每 1M token，按稀有度）
const API_PRICE = { N: 40, R: 90, SR: 200, SSR: 450, UR: 1000, EX: 1500 }; // EX: 超级模型（UR ×1.5）
// 自产 token 卖出系数（官方价 ×0.6）
const SELL_FACTOR = 0.6;
// 三档工作定义（Phase 3.3）
const WORK_TIERS = {
  small:  { key: 'small',  name: '🟢 小单', tokens: 50000,  payMult: 0.25, penalty: 16 },
  medium: { key: 'medium', name: '🟡 中单', tokens: 200000, payMult: 1,    penalty: 65 },
  large:  { key: 'large',  name: '🔴 大单', tokens: 800000, payMult: 4,    penalty: 260 },
};
const WORK_ORDER = ['small', 'medium', 'large'];
const MILESTONES = [
  { id: 'm10k', at: 10000, title: '🎉 小有所成', tag: '余额突破 ¥10,000', hype: '从电子垃圾堆里爬了出来，开始人模狗样。' },
  { id: 'm50k', at: 50000, title: '🏆 财富自由', tag: '余额突破 ¥50,000', hype: '你击败了 70% 的玩家，成功跻身"持续赚钱"的那 30%。庄家已拉黑你。' },
  { id: 'm100k', at: 100000, title: '👑 传奇大亨', tag: '余额突破 ¥100,000', hype: '中转站庄家看到你都绕道走。建议本站给你立个雕像。' },
];

