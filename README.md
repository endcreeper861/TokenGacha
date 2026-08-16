# 🎰 TokenGacha · LLM API 中转站增量游戏

一家"神秘"的 LLM API 中转站。从手写代码白手起家，五阶段并行叠加，最终研发出自己的 AGI。
五个阶段：🔨 手写代码 → 🤖 AI 接单 → 🖥️ GPU 机房 → 🔬 模型研发 → 🧠 AGI 之路（通关解锁沙盒）。

**🔗 在线试玩 / Play Now: https://endcreeper861.github.io/TokenGacha**

## 特性

- 🎰 三个卡池、单抽/十连、保底机制，翻卡动画 + 粒子特效
- 📊 35 个真实模型，稀有度按 [Artificial Analysis 智能指数](https://artificialanalysis.ai/leaderboards/models) 分档（图标来自 [@lobehub/icons](https://lobehub.com/icons)）
- 💼 三档工作（小/中/大单）+ 品质系统（盲盒 60%~100% / 官方 95% / 自产 100%）+ 177 条爆笑终端文本
- 🖥️ 六档显卡机房（RTX 4060 → B200），自动产出纯净 token，限时市场事件
- 🔬 三档研究员 + 边际递减 + 灵感迸发，研发出超级模型 AGI-X
- 🧠 九项技术树 + AGI 研究点（RP）+ 最终协议 → AGI 通关 + 沙盒模式
- ⌨️ 工作台支持键盘写代码：按任意字母或空格即可推进手写代码进度
- 💰 充值作弊模式、成就里程碑、分享战绩卡片
- 📦 静态三件套（`index.html` + `css/` + `js/`），零依赖，开箱即玩

## 运行

直接用浏览器打开 `index.html`（支持 file://），或部署到任意静态托管。

## 项目结构

| 文件 | 职责 |
|------|------|
| `index.html` | 页面骨架：六页导航（仪表盘/市场/工作台/机房/实验室/资产）+ 抽卡动画层 + 弹窗 |
| `css/style.css` | 全部样式：布局、组件、移动端适配、粒子与动画特效 |
| `js/data/` | 数据常量：models.js（模型）/ gacha.js（卡池·经济·品质·工作档位）/ texts.js（文本库）/ upgrades.js（升级表）/ gpus.js（显卡表）/ techs.js（研究员·技术树） |
| `js/core/` | 核心：util.js（工具）/ audio.js（音效）/ fx.js（粒子）/ state.js（存档）/ loop.js（1s tick 引擎 + dev 钩子） |
| `js/game/` | 玩法逻辑：gacha.js（抽卡）/ market.js（市场）/ gpu.js（机房）/ research.js（研发）/ tech.js（技术树）/ clicker.js（点击器）/ work.js（工作）/ stage.js（阶段解锁） |
| `js/ui/` | 界面：router.js（路由）/ pages.js（渲染）/ dashboard.js（仪表盘）/ modals.js（弹窗）/ share.js（分享） |
| `js/app.js` | 入口：事件绑定 + 启动引导 |

> 💾 存档使用 localStorage key `tokengacha_v3`（ver=5，v4 自动迁移）。**v3 硬重置**：不兼容旧版 `tokengacha_v2` 存档，旧档被忽略。
> 🛠️ dev 调试钩子：控制台 `window.TG`（`S` 实时存档 / `addMoney` / `skipTo` / `save`）。

---

# 🎰 TokenGacha · LLM API Idle Game

A mysterious LLM API relay station. Start from hand-writing code and work your way up to building your own AGI across five stacking stages:
🔨 Hand Coding → 🤖 AI Contract Work → 🖥️ GPU Farm → 🔬 Model Research → 🧠 AGI Road (win → sandbox mode).

**🔗 Play Now: https://endcreeper861.github.io/TokenGacha**

## Features

- 🎰 3 card pools, single/×10 pulls, pity system, card-flip animations
- 📊 35 real-world models, rarity tiered by [Artificial Analysis Intelligence Index](https://artificialanalysis.ai/leaderboards/models) (icons by [@lobehub/icons](https://lobehub.com/icons))
- 💼 3 work tiers + token quality system (gacha 60–100% / official 95% / self-made 100%) + 177 hilarious terminal lines
- 🖥️ 6 GPU tiers (RTX 4060 → B200), auto token production, timed market events
- 🔬 3 researcher tiers with diminishing returns & inspiration breakthroughs → supermodel AGI-X
- 🧠 9-tech tree + AGI research points (RP) + final protocol → AGI win + sandbox mode
- ⌨️ Keyboard coding on Work page: any letter or Space advances hand-coding progress
- 💰 Cheat top-up mode, milestones, shareable stat cards
- 📦 Static trio (`index.html` + `css/` + `js/`), zero dependencies

## Run

Open `index.html` in any browser (file:// works), or deploy to any static host.

## Project Structure

| File | Purpose |
|------|---------|
| `index.html` | Page skeleton: 6-page nav (Dashboard/Market/Work/GPU/Lab/Assets) + gacha overlay + modals |
| `css/style.css` | All styles: layout, components, mobile adaptation, particle & animation effects |
| `js/data/` | Constants: models / gacha (pools, economy, quality, work tiers) / texts / upgrades / gpus / techs |
| `js/core/` | Core: util / audio / fx / state (save) / loop (1s tick engine + dev hooks) |
| `js/game/` | Gameplay: gacha / market / gpu / research / tech / clicker / work / stage |
| `js/ui/` | UI: router / pages / dashboard / modals / share |
| `js/app.js` | Entry: event binding + bootstrap |

> 💾 Saves use the localStorage key `tokengacha_v3` (ver=5, v4 auto-migrates). **Hard reset**: legacy `tokengacha_v2` saves are ignored.
> 🛠️ Dev hooks: `window.TG` in console (`S` live state / `addMoney` / `skipTo` / `save`).
