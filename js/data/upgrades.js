"use strict";
/* ================================================================
   TokenGacha · js/data/upgrades.js — 升级定义
   S1×5 (阶段一) / S2×6 (阶段二, Phase 3) / S3×6 (阶段三, Phase 4) / S4×5 (阶段四, Phase 5)
   字段: id / stage / name / price / desc / 效果挂载点
   ================================================================ */

const UPGRADES = {
  /* ---------- 阶段一 · 个人能力 ---------- */
  s1_typing: {
    id: 's1_typing', stage: 1, name: '⌨️ 打字速度', price: 50,
    desc: '点击效率 ×1.2（手速就是生产力）',
  },
  s1_multitouch: {
    id: 's1_multitouch', stage: 1, name: '👆 多点触控', price: 120,
    desc: '每次点击算 1.5 击（键盘都按出火星子）',
  },
  s1_so: {
    id: 's1_so', stage: 1, name: '💬 SO 会员', price: 200,
    desc: '进度条缩短 20%（报错即答案，抄就完事）',
  },
  s1_keyboard: {
    id: 's1_keyboard', stage: 1, name: '⌨️ 机械键盘', price: 80,
    desc: '每完成一单额外 +¥2（RGB 加持，报价翻倍）',
  },
  s1_vscode: {
    id: 's1_vscode', stage: 1, name: '🧩 VS Code 插件', price: 300,
    desc: '每秒 5% 概率自动敲一击（Copilot 摸鱼，插件不摸）',
  },
  /* ---------- 阶段二 · 工具链 ---------- */
  s2_ide: {
    id: 's2_ide', stage: 2, name: '🧑‍💻 IDE 自动补全', price: 400,
    desc: '工作动画间隔 ×0.7（补全快人一步）',
  },
  s2_cloud: {
    id: 's2_cloud', stage: 2, name: '☁️ 云服务器', price: 800,
    desc: '批量结算 ×2（同时跑 2 个实例）',
  },
  s2_cicd: {
    id: 's2_cicd', stage: 2, name: '🚀 CI/CD 流水线', price: 600,
    desc: '返工率 -10%（相对）',
  },
  s2_review: {
    id: 's2_review', stage: 2, name: '🔍 代码审查 AI', price: 500,
    desc: '删库率 -5%（相对）',
  },
  s2_auto: {
    id: 's2_auto', stage: 2, name: '🤖 自动化调度', price: 1500,
    desc: '解锁被动自动接单开关（每秒 5 单，无动画）',
  },
  s2_batch: {
    id: 's2_batch', stage: 2, name: '📦 批量接单', price: 1000,
    desc: '手动一次 20 单（原 10 单）',
  },
  s2_subscribe: {
    id: 's2_subscribe', stage: 2, name: '📦 Token 自动订阅', price: 2500,
    requires: ['s2_auto'],
    desc: '解锁自动补货套餐：库存低于目标时自动购买官方 API token',
  },
  /* ---------- 阶段三 · 硬件设施 ---------- */
  s3_pcie: {
    id: 's3_pcie', stage: 3, name: '🔌 PCIe 扩展卡', price: 8000,
    desc: 'PCIe 插槽 +1',
  },
  s3_water: {
    id: 's3_water', stage: 3, name: '💧 水冷散热', price: 12000,
    desc: '电费 -15%',
  },
  s3_fiber: {
    id: 's3_fiber', stage: 3, name: '🔗 光纤网络', price: 10000,
    desc: '单笔卖出上限 10M → 25M tokens',
  },
  s3_sched: {
    id: 's3_sched', stage: 3, name: '🧠 智能调度', price: 20000,
    desc: '显卡产出 +20%',
  },
  s3_solar: {
    id: 's3_solar', stage: 3, name: '☀️ 太阳能面板', price: 25000,
    desc: '白天 6:00-18:00 电费 -30%',
  },
  s3_farm: {
    id: 's3_farm', stage: 3, name: '⛏️ 矿场托管', price: 40000,
    desc: 'PCIe 插槽 +2',
  },
  /* ---------- 阶段四 · 研究辅助 ---------- */
  s4_paper: {
    id: 's4_paper', stage: 4, name: '📄 预印本订阅', price: 60000,
    desc: '所有研究员速度 +20%',
  },
  s4_cluster: {
    id: 's4_cluster', stage: 4, name: '🖥️ GPU 集群', price: 120000,
    desc: '研究员效率 ×1.5',
  },
  s4_conf: {
    id: 's4_conf', stage: 4, name: '🎓 学术会议', price: 80000,
    desc: '随机触发双倍进度 60s',
  },
  s4_oss: {
    id: 's4_oss', stage: 4, name: '🌐 开源社区', price: 100000,
    desc: '每已解锁模型 +2% 研究速度',
  },
  s4_hunter: {
    id: 's4_hunter', stage: 4, name: '🔎 人才猎头', price: 90000,
    desc: '新雇员前 10 分钟 ×1.5',
  },
};

// 某阶段全部升级（按价格升序）
function upgradesOfStage(stage) {
  return Object.values(UPGRADES).filter(u => u.stage === stage).sort((a, b) => a.price - b.price);
}
