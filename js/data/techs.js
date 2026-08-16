"use strict";
/* ================================================================
   TokenGacha · js/data/techs.js — 研究员与超级模型 (Phase 5.1)
   RESEARCHERS 三档 / SUPER_MODEL (AGI-X, Phase 5.4) / TECHS 技术树 (Phase 6)
   ================================================================ */

// 研究员三档（无限人数，同档边际递减 1/√n）
const RESEARCHERS = {
  junior: { key: 'junior', name: '🎓 初级研究员', salary: 3000, speed: 1, req: 10000, desc: '月薪 ¥3,000 · 研究速度 1×' },
  senior: { key: 'senior', name: '👨‍🔬 资深研究员', salary: 8000, speed: 3, req: 50000, desc: '月薪 ¥8,000 · 研究速度 3×' },
  chief:  { key: 'chief',  name: '🧑‍🚀 首席科学家', salary: 20000, speed: 8, req: 200000, desc: '月薪 ¥20,000 · 研究速度 8×' },
};
const RESEARCHER_ORDER = ['junior', 'senior', 'chief'];

// 超级模型（研究 100% 后运行时注入 MMAP）
const SUPER_MODEL = {
  id: 'agix', name: 'AGI-X', vendor: 'TokenGacha Labs', icon: 'openai', idx: 99, r: 'EX',
  cost: '无价/任务', spd: 999,
  quote: '你自己研发的超级模型，智能指数 99，全面超越所有商业模型',
};

/* ---------- 阶段五技术树 (Phase 6.1) ----------
   树形结构（plan.md）:
                  超级模型 (起点)
                 /      |      \
        混合注意力    LRU缓存   注意力残差
           |           |         |
       推测解码 ───  MoE路由 ─── 强化对齐
           |           |         |
       自主迭代 ←── 多模态融合 ←── 工具使用
                     |
                  🧠 AGI
   每项: id / name / price / ai (AI占比增量) / desc / effect 挂载点 / pre 前置
   ai 合计 = 8+8+10+10+10+10+12+12+10 = 90 → 初始5% + 90% = 95% 上限；
   九项全解锁后 AI=95%，还需完成最终协议 60,000 RP 补足最后 5% = AGI
*/
const TECHS = {
  attention: {
    id: 'attention', name: '🧠 混合注意力', price: 100000, ai: 8, rp: 14000,
    desc: '工作速度 +40%', pre: [],
  },
  lru: {
    id: 'lru', name: '💾 LRU 缓存', price: 120000, ai: 8, rp: 14000,
    desc: 'token 消耗 -20%', pre: [],
  },
  residual: {
    id: 'residual', name: '🔗 注意力残差', price: 150000, ai: 10, rp: 17000,
    desc: '大成功率 +8%', pre: [],
  },
  speculative: {
    id: 'speculative', name: '🚀 推测解码', price: 200000, ai: 10, rp: 21000,
    desc: '自产 token ×2', pre: ['attention'],
  },
  moe: {
    id: 'moe', name: '🌳 MoE 路由', price: 250000, ai: 10, rp: 23000,
    desc: '可部署模型数 +50%', pre: ['lru'],
  },
  align: {
    id: 'align', name: '🛡️ 强化对齐', price: 300000, ai: 10, rp: 23000,
    desc: '删库率归零', pre: ['residual'],
  },
  iterate: {
    id: 'iterate', name: '🔄 自主迭代', price: 500000, ai: 12, rp: 29000,
    desc: '研究速度 +50%', pre: ['speculative'],
  },
  multimodal: {
    id: 'multimodal', name: '🌐 多模态融合', price: 400000, ai: 12, rp: 32000,
    desc: '全收入 ×1.3', pre: ['moe'],
  },
  tools: {
    id: 'tools', name: '🔧 工具使用', price: 350000, ai: 10, rp: 30000,
    desc: '研究效率 ×3', pre: ['align'],
  },
};
const TECH_ORDER = ['attention', 'lru', 'residual', 'speculative', 'moe', 'align', 'iterate', 'multimodal', 'tools'];
// 树形层级（用于 UI 排版）
const TECH_TREE = [
  ['attention', 'lru', 'residual'],
  ['speculative', 'moe', 'align'],
  ['iterate', 'multimodal', 'tools'],
];

/* ---------- 阶段五：AGI 研究点（Phase A 新增） ---------- */
// 速率：AGI-X 自迭代 6 点/秒，研究员贡献饱和 +12 点/秒
const AGI_RP_BASE = 6;
const AGI_RP_GAIN = 12;
const AGI_RP_HALF = 40;
const AGI_RP_S4_BONUS = 0.06; // 每项 S4 升级 +6% RP 速率
const AGI_FINAL_RP = 60000;
const AGI_FINAL_STEPS = [20000, 20000, 20000];
const AGI_RP_TOTAL = TECH_ORDER.reduce((s, id) => s + (TECHS[id].rp || 0), 0) + AGI_FINAL_RP;
const AGI_MILESTONES = [
  { at: 25000,  txt: '🧠 AGI-X 开始理解自己的推理轨迹' },
  { at: 60000,  txt: '🌌 涌现：它开始写比你更快的代码' },
  { at: 100000, txt: '🔭 自我建模：AGI-X 给自己的权重画了张地图' },
  { at: 150000, txt: '🚀 对齐审计：红队只找到它偷偷点奶茶的证据' },
  { at: 200000, txt: '👑 自我迭代加速，最终协议即将开始' },
];
