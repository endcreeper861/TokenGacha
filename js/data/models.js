"use strict";
/* ================================================================
   TokenGacha · js/data/models.js — 模型与稀有度数据
   ================================================================ */

/* ---------- 模型数据 (指数参考 artificialanalysis.ai 排行榜) ---------- */
const MODELS = [
  // UR —— 智能指数 ≥55, 顶级中的顶级
  { id: 'opus5', name: 'Claude Opus 5', vendor: 'Anthropic', icon: 'claude-color', idx: 61, r: 'UR', cost: '$2.03/任务', spd: 54, quote: '智能指数 61，榜一大哥，vibe coding 界的爱马仕' },
  { id: 'fable5', name: 'Claude Fable 5', vendor: 'Anthropic', icon: 'claude-color', idx: 60, r: 'UR', cost: '$2.75/任务', spd: 66, quote: '传说中的 Fable，带着 Opus 4.8 当备胎上场' },
  { id: 'gpt56sol', name: 'GPT-5.6 Sol', vendor: 'OpenAI', icon: 'openai', idx: 59, r: 'UR', cost: '$1.54/任务', spd: 67, quote: 'OpenAI 的 Solaris，亮瞎同行' },
  { id: 'kimik3', name: 'Kimi K3', vendor: 'Moonshot AI', icon: 'moonshot', idx: 57, r: 'UR', cost: '$0.72/任务', spd: 32, quote: '月之暗面杀进总榜前三，国产之光' },
  { id: 'gpt56ter', name: 'GPT-5.6 Terra', vendor: 'OpenAI', icon: 'openai', idx: 55, r: 'UR', cost: '$0.78/任务', spd: 143, quote: '143 tok/s 的速度与激情' },
  // SSR —— 47~54
  { id: 'grok45', name: 'Grok 4.5', vendor: 'xAI', icon: 'grok', idx: 54, r: 'SSR', cost: '$0.35/任务', spd: 54, quote: '马斯克：地表最强，爱用不用' },
  { id: 'sonnet5', name: 'Claude Sonnet 5', vendor: 'Anthropic', icon: 'claude-color', idx: 53, r: 'SSR', cost: '$1.53/任务', spd: 70, quote: 'Opus 太贵？Sonnet 才是打工人标配' },
  { id: 'gpt56lun', name: 'GPT-5.6 Luna', vendor: 'OpenAI', icon: 'openai', idx: 51, r: 'SSR', cost: '$0.29/任务', spd: 197, quote: '197 tok/s，快到没朋友' },
  { id: 'glm52', name: 'GLM-5.2', vendor: '智谱 Z.ai', icon: 'zai', idx: 51, r: 'SSR', cost: '$0.30/任务', spd: 60, quote: '智谱出品，开源阵营第一梯队' },
  { id: 'gem31pro', name: 'Gemini 3.1 Pro', vendor: 'Google', icon: 'gemini-color', idx: 50, r: 'SSR', cost: '$0.45/任务', spd: 80, quote: '谷歌多模态扛把子' },
  { id: 'nemotron3', name: 'Nemotron 3 Ultra', vendor: 'NVIDIA', icon: 'nvidia-color', idx: 48, r: 'SSR', cost: '$0.25/任务', spd: 75, quote: '老黄的算力情怀' },
  // SR —— 40~46
  { id: 'dsv4pro', name: 'DeepSeek V4 Pro', vendor: 'DeepSeek', icon: 'deepseek-color', idx: 44, r: 'SR', cost: '$0.04/任务', spd: 50, quote: '¥0.04/任务，价格屠夫本夫' },
  { id: 'minimax3', name: 'MiniMax M3', vendor: 'MiniMax', icon: 'minimax-color', idx: 44, r: 'SR', cost: '$0.20/任务', spd: 58, quote: '海螺出品，闷声发财' },
  { id: 'kimik26', name: 'Kimi K2.6', vendor: 'Moonshot AI', icon: 'moonshot', idx: 43, r: 'SR', cost: '$0.15/任务', spd: 45, quote: 'K3 的弟弟，依然能打' },
  { id: 'mimo25', name: 'MiMo-V2.5-Pro', vendor: '小米', icon: 'xiaomimimo', idx: 42, r: 'SR', cost: '$0.18/任务', spd: 52, quote: '雷军的 AI 野望' },
  { id: 'qwen37', name: 'Qwen3.7 Max', vendor: '阿里通义', icon: 'qwen-color', idx: 41, r: 'SR', cost: '$0.22/任务', spd: 55, quote: '通义千问，阿里全家桶核心' },
  { id: 'gem36fl', name: 'Gemini 3.6 Flash', vendor: 'Google', icon: 'gemini-color', idx: 40, r: 'SR', cost: '$0.10/任务', spd: 150, quote: '速度翻倍，智商……也够用了' },
  // R —— 28~39
  { id: 'mistral3', name: 'Mistral Large 3', vendor: 'Mistral', icon: 'mistral-color', idx: 38, r: 'R', cost: '$0.12/任务', spd: 62, quote: '法兰西最后的倔强' },
  { id: 'qwen36', name: 'Qwen3.6 Max', vendor: '阿里通义', icon: 'qwen-color', idx: 36, r: 'R', cost: '$0.09/任务', spd: 56, quote: 'Preview 版，爱拼才会赢' },
  { id: 'dsv4fl', name: 'DeepSeek V4 Flash', vendor: 'DeepSeek', icon: 'deepseek-color', idx: 35, r: 'R', cost: '$0.02/任务', spd: 90, quote: '便宜大碗，还要啥自行车' },
  { id: 'kimik27c', name: 'Kimi K2.7 Code', vendor: 'Moonshot AI', icon: 'moonshot', idx: 33, r: 'R', cost: '$0.08/任务', spd: 48, quote: '专精写代码的 Kimi' },
  { id: 'haiku45', name: 'Claude Haiku 4.5', vendor: 'Anthropic', icon: 'claude-color', idx: 31, r: 'R', cost: '$0.06/任务', spd: 85, quote: '小巧玲珑，俳句之神' },
  { id: 'nova2', name: 'Nova 2.0 Pro', vendor: 'Amazon', icon: 'nova-color', idx: 30, r: 'R', cost: '$0.07/任务', spd: 65, quote: '亚马逊：没错，我也做模型了' },
  { id: 'oss120', name: 'gpt-oss-120b', vendor: 'OpenAI', icon: 'openai', idx: 29, r: 'R', cost: '$0.05/任务', spd: 70, quote: 'OpenAI 罕见开荤（开源）' },
  { id: 'gem35lite', name: 'Gemini 3.5 Flash-Lite', vendor: 'Google', icon: 'gemini-color', idx: 28, r: 'R', cost: '$0.03/任务', spd: 180, quote: 'Lite 版，轻量级选手' },
  // N —— <28, 垃圾
  { id: 'gpt4', name: 'GPT-4', vendor: 'OpenAI', icon: 'openai', idx: 23, r: 'N', cost: '$1.20/任务', spd: 30, quote: '2023 年的老皇帝，又贵又慢，但当年也是万国来朝' },
  { id: 'llama4m', name: 'Llama 4 Maverick', vendor: 'Meta', icon: 'meta-color', idx: 25, r: 'N', cost: '$0.04/任务', spd: 75, quote: '小扎的开源梦，泯然众人矣' },
  { id: 'gem15pro', name: 'Gemini 1.5 Pro', vendor: 'Google', icon: 'gemini-color', idx: 24, r: 'N', cost: '$0.10/任务', spd: 40, quote: '博物馆级古董，建议捐了' },
  { id: 'llama4s', name: 'Llama 4 Scout', vendor: 'Meta', icon: 'meta-color', idx: 22, r: 'N', cost: '$0.03/任务', spd: 80, quote: '10M 上下文，可惜脑子跟不上' },
  { id: 'oss20', name: 'gpt-oss-20b', vendor: 'OpenAI', icon: 'openai', idx: 20, r: 'N', cost: '$0.02/任务', spd: 110, quote: '小参数，大智慧？并没有' },
  { id: 'hunyuan', name: '混元 Turbo', vendor: '腾讯', icon: 'hunyuan-color', idx: 19, r: 'N', cost: '$0.03/任务', spd: 66, quote: '腾讯混元，混就完事了' },
  { id: 'wenxin', name: '文心一言 4.5', vendor: '百度', icon: 'wenxin-color', idx: 17, r: 'N', cost: '$0.03/任务', spd: 58, quote: '百度：我曾经也是中国 ChatGPT' },
  { id: 'spark', name: '讯飞星火 Spark', vendor: '科大讯飞', icon: 'spark-color', idx: 16, r: 'N', cost: '$0.02/任务', spd: 60, quote: '星火燎原，可惜风太大' },
  { id: 'doubao', name: '豆包 1.5 Pro', vendor: '字节跳动', icon: 'doubao-color', idx: 14, r: 'N', cost: '$0.02/任务', spd: 72, quote: '「垃圾。」—— 某位玩家的个人想法' },
  { id: 'gemma4', name: 'Gemma 4 E4B', vendor: 'Google', icon: 'gemma-color', idx: 12, r: 'N', cost: '$0.01/任务', spd: 95, quote: '4B 小模型，手机带得动，活干不动' },
];
const MMAP = Object.fromEntries(MODELS.map(m => [m.id, m]));

