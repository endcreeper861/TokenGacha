# 🎰 TokenGacha · LLM API 抽卡模拟器

一家"神秘"的 LLM API 中转站：不卖套餐，只卖盲盒。抽到 Claude Opus 5 还是豆包，全看命。
用抽到的模型额度接 vibe coding 私活赚钱 → 再抽卡 → 财富自由 or 破产收场。

**🔗 在线试玩 / Play Now: https://tokengacha.metagaruta.com**

## 特性

- 🃏 三个卡池、单抽/十连、保底机制，翻卡动画 + 粒子特效
- 📊 35 个真实模型，稀有度按 [Artificial Analysis 智能指数](https://artificialanalysis.ai/leaderboards/models) 分档（图标来自 [@lobehub/icons](https://lobehub.com/icons)）
- 💼 批量/自动工作系统，177 条爆笑终端文本（客户需求 + 程序员梗）
- 💰 充值作弊模式、成就里程碑、分享战绩卡片
- 📦 静态三件套（`index.html` + `css/` + `js/`），零依赖，开箱即玩

## 运行

直接用浏览器打开 `index.html`，或部署到任意静态托管。

## 项目结构

| 文件 | 职责 |
|------|------|
| `index.html` | 页面骨架：三个页面（购买Token / 工作 / 余额）+ 抽卡动画层 + 弹窗 |
| `css/style.css` | 全部样式：布局、组件、移动端适配、粒子与动画特效 |
| `js/app.js` | 全部逻辑：模型数据 / 经济系统 / 抽卡 / 工作流 / 渲染 / 分享 / 存档，内部按 `/* ---------- 分区名 ---------- */` 注释分段 |

> 💾 存档沿用 localStorage key `tokengacha_v2`，旧版单文件 `llm-gacha.html` 的存档无缝延续。
> 🧩 后续加功能时，`js/` 可按模块继续拆分（如 `js/data/models.js`、`js/game/work.js`）。

---

# 🎰 TokenGacha · LLM API Gacha Simulator

A mysterious LLM API relay station that only sells gacha blind boxes. Pull Claude Opus 5 or total trash — pure luck.
Earn money by vibe-coding with the models you pull, then pull again. Get rich or go bankrupt.

**🔗 Play Now: https://tokengacha.metagaruta.com**

## Features

- 🃏 3 card pools, single/×10 pulls, pity system, card-flip animations
- 📊 35 real-world models, rarity tiered by [Artificial Analysis Intelligence Index](https://artificialanalysis.ai/leaderboards/models) (icons by [@lobehub/icons](https://lobehub.com/icons))
- 💼 Batch/auto work mode with 177 hilarious terminal lines
- 💰 Cheat top-up mode, milestones, shareable stat cards
- 📦 Static trio (`index.html` + `css/` + `js/`), zero dependencies

## Run

Open `index.html` in any browser, or deploy to any static host.

## Project Structure

| File | Purpose |
|------|---------|
| `index.html` | Page skeleton: three pages (Buy Tokens / Work / Balance) + gacha overlay + modals |
| `css/style.css` | All styles: layout, components, mobile adaptation, particle & animation effects |
| `js/app.js` | All logic: model data / economy / gacha / work flow / rendering / sharing / save, segmented by `/* ---------- section ---------- */` comments |

> 💾 Saves use the localStorage key `tokengacha_v2`, so old saves from the legacy single-file `llm-gacha.html` carry over seamlessly.
> 🧩 For future features, `js/` can be split further by module (e.g. `js/data/models.js`, `js/game/work.js`).
