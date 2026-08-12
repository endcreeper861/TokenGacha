# SPEC: TokenGacha 五阶段增量游戏改造

> 唯一真实信息来源。执行模型严格遵循本计划分 Phase 实施，每 Phase 独立可验证。

## 1. 目标与背景

将现有「LLM API 中转站抽卡模拟器」（单局赌徒循环）改造为五阶段并行叠加的增量游戏：阶段一点击器 → 阶段二 AI 接单 → 阶段三 GPU 机房 → 阶段四模型研发 → 阶段五 AGI 通关，目标总时长约 5 小时。依据 plan.md 与 2026-08-12 grilling 结论实施，保留现有 35 模型数据、终端动画、音效、粒子、图标 CDN、图鉴、分享等资产。

### 已确认决策

- **模块方案**：多 `<script>` 按序加载（普通脚本 + 全局变量），保持 file:// 直接打开能力
- **离线收益**：无。被动收入仅在线 tick 结算
- **技术点数**：取消。技术树用「金钱 + 前置技术」解锁，资源共 5 种（金钱/Token/显存/算力/研究进度）
- **计划范围**：全覆盖，分 Phase 0~7 执行

### 架构决策（计划级，执行中可微调）

- 存档硬重置：新 key `tokengacha_v3`，ver=4，删除全部旧迁移逻辑
- 初始资金 ¥0，移除免费十连与 START_MONEY=800；新手引导改为点击器教学
- 阶段解锁条件：
  - s2 = 余额曾达 ¥500 且首次购买 token
  - s3 = 余额曾达 ¥5,000 且购入第一张显卡
  - s4 = 余额曾达 ¥50,000 且雇佣第一名研究员
  - s5 = 研究 100% 自动进入
- 移除破产结局（点击器纯赚不亏保底）；删库赔钱最多扣到 0
- Token 品质：盲盒 60%~100% 随机（默认隐藏，检测费 ¥20/张揭示）、官方 API 95%、自产 100%；概率修正 pGreat×q、pRework/q（上限 40%）、pDisaster/q（上限 15%）
- Token 消耗顺序保持稀有度高→低（同稀有度不区分品质）
- 工资按秒连续扣除：秒工资 = 月薪 / 600（10 分钟 ≈ 一个"月薪周期"）
- 技术树 9 项全部解锁 → AI 占比 100%（初始 5% + 每项 8%~15%，合计 95%）→ AGI 通关
- 市场操纵：阶段五市场页独立购买（¥200K，冷却 10 分钟）
- 超级模型：EX 稀有度入图鉴，机房可部署（占 32GB），工作报酬 UR×1.5，token 品质 100%
- 全局变量风格沿用现状（不加模块命名空间），仅 window.TG 暴露 dev 调试钩子
- 中央 tick：setInterval 1s 结算经济（产出/电费/工资/研究/事件/自动接单），tick 后只调 renderDynamic() 局部刷新；renderAll() 仅在购买/解锁等离散事件时调用

## 2. 变更文件清单

### 新建（24 个，均在 js/ 下）

| 文件 | 职责 |
|------|------|
| js/data/models.js | MODELS/MMAP/RARITY/RORDER 搬迁；新增 VRAM_COST（N:2/R:4/SR:8/SSR:16/UR:24/EX:32）、各稀有度自产速率系数与卖价系数 |
| js/data/gacha.js | POOLS/PITY_MAX 搬迁；新增品质区间常量、检测费 |
| js/data/texts.js | CLIENT_REQS/MEME_LINES/MID_REQS/OK_LINES/EVT_TXT/NOTICES 原样搬迁；新增阶段一/机房/实验室彩蛋文本 |
| js/data/gpus.js | GPUS 六档显卡表（价格/显存/算力/功耗/电费） |
| js/data/upgrades.js | UPGRADES 全部 22 项升级定义（S1×5/S2×6/S3×6/S4×5）：id/名称/价格/描述/效果挂载点 |
| js/data/techs.js | TECHS 九项技术树（前置/费用/效果/AI占比增量）+ RESEARCHERS 三档 |
| js/core/util.js | $/fmt/fmt2/fmtK/pick/escapeHtml/addLedger |
| js/core/audio.js | beep/SFX 原样搬迁 |
| js/core/fx.js | 粒子/floater/bigMoneyPop/coinShower/shake/toast 原样搬迁 |
| js/core/state.js | defaultState（新 schema）/save/load/派生计算（totalTokens 等）/TG dev hooks |
| js/core/loop.js | 1s tick 引擎 + renderDynamic 调度 |
| js/game/stage.js | 阶段解锁守卫、解锁检测、横幅触发 |
| js/game/clicker.js | 阶段一点击器逻辑 + S1 升级效果 |
| js/game/gacha.js | 盲盒抽卡（含品质生成/检测揭示），自现有代码改造 |
| js/game/market.js | 官方 API 购买、token 卖出、限时市场事件、市场操纵 |
| js/game/work.js | 三档工作、品质修正四态结算、自动化调度，自现有代码改造 |
| js/game/gpu.js | 显卡购买/部署/启停/产出/电费/PCIe |
| js/game/research.js | 研究员雇佣/工资/进度/灵感迸发/超级模型 |
| js/game/tech.js | 技术树解锁/效果应用/AI 占比/AGI 判定/沙盒 |
| js/ui/router.js | 六页 hash 路由 |
| js/ui/dashboard.js | 仪表盘：收入流总览、快捷入口、阶段横幅 |
| js/ui/pages.js | 市场/工作台/机房/实验室/资产五页渲染 |
| js/ui/modals.js | 弹窗体系（图鉴/概率公示/玩法/通关/里程碑/充值），自现有代码改造 |
| js/ui/share.js | 分享卡片，适配新统计 |

### 修改（4 个）

| 文件 | 变更性质 |
|------|---------|
| index.html | 导航改六页、新增五个 page 容器与点击器/机房/实验室 DOM、资源条扩展、按序引入全部 script（data → core → game → ui → app.js） |
| css/style.css | 新增仪表盘/点击器/升级卡片/机房插槽/技术树样式；保留现有全部组件样式 |
| js/app.js | 瘦身为入口：事件绑定 + 启动引导（数据与逻辑全部迁出） |
| README.md | Phase 7 更新结构说明、玩法、存档 key 变更说明 |

### 删除

无文件删除；localStorage 旧 key `tokengacha_v2` 不再读取。

## 3. 详细实施步骤

### Phase 0 · 模块化拆分（玩法不变，行为对等）

- **Step 0.1** ｜ 建 js/data/ 三个数据文件 ｜ 把 app.js 中 MODELS/MMAP/RARITY/RORDER/POOLS/PITY_MAX/TASK_TOKENS/PAY_BOOST/BATCH_TASKS 等常量与全部文本库剪贴搬迁，不改任何数值 ｜ 预期：全局可访问
- **Step 0.2** ｜ 建 js/core/util.js、audio.js、fx.js、state.js ｜ 搬迁工具函数、音效、粒子/飘字、defaultState/save/load ｜ 预期：无逻辑变化
- **Step 0.3** ｜ 建 js/game/gacha.js、work.js ｜ 搬迁抽卡核心/流程与工作核心/工作流（含 settleItems/composeLines/runLines/doWork/doAuto）｜ 预期：无逻辑变化
- **Step 0.4** ｜ 建 js/ui/router.js、pages.js、modals.js、share.js ｜ 搬迁 go/hashchange、各 render 函数、弹窗与分享 ｜ 预期：无逻辑变化
- **Step 0.5** ｜ 改 index.html 与 js/app.js ｜ index.html 按序引入全部 script（data→core→game→ui→app）；app.js 只留事件绑定与启动 ｜ 预期：冒烟测试与拆分前完全对等（抽卡/工作/余额/图鉴/分享/充值全通）
- **Step 0.6** ｜ state.js 存档 v3 ｜ key 改 `tokengacha_v3`、ver=4；defaultState 增加 stage/peakMoney/clicker/upgrades/gpus/pcie(=2)/research/techs/aiRatio(=0.05)/marketEvt 字段与扩展 stats（clicks/selfTokens/elecCost/wages/breakthroughs/agiAt/startedAt）；money 初始 0；删除 load() 全部旧迁移分支 ｜ 预期：新档可存取，旧 key 被忽略
- **Step 0.7** ｜ core/loop.js ｜ 实现 setInterval(1000) tick 骨架（空处理器数组，各 game 模块注册 tick 回调）+ renderDynamic() 局部刷新 + window.TG={S,save,addMoney,skipTo} dev 钩子 ｜ 预期：tick 每秒触发且页面无回归

### Phase 1 · UI 骨架：仪表盘 + 六页导航（依赖 Phase 0）

- **Step 1.1** ｜ index.html ｜ 顶部导航改六页（仪表盘/市场/工作台/机房/实验室/资产）；新建六个 page 容器；资源条扩为 金钱/Token/显存/算力/研究（后三者默认隐藏）｜ 预期：六页可切换，内容为空壳
- **Step 1.2** ｜ router.js + pages.js ｜ PAGES 改六页；render 函数按页拆分：市场=原 renderBuy，工作台=原 renderWork，资产=原 renderBalance；机房/实验室/仪表盘先渲染占位 ｜ 预期：旧三页功能在新导航下无回归
- **Step 1.3** ｜ dashboard.js ｜ 收入流总览卡（点击器/接单/机房/实验室各一行 ¥/s，未解锁显示锁定）+ 快捷入口按钮 + 阶段横幅容器 ｜ 预期：默认首页为仪表盘
- **Step 1.4** ｜ style.css ｜ 仪表盘卡片、资源条新 chip、锁定态样式 ｜ 预期：视觉与现有浅色系一致
- **Step 1.5** ｜ stage.js ｜ isUnlocked(stage) 守卫 + checkStageUnlocks()（挂 renderAll 尾部）；未解锁页面显示锁定插画 + 解锁条件文案 ｜ 预期：初始仅仪表盘/工作台可见，其余锁定

### Phase 2 · 阶段一：手写代码点击器（依赖 Phase 1）

- **Step 2.1** ｜ data/upgrades.js ｜ 定义 S1 五升级：打字速度 ¥50（点击效率×1.2）/多点触控 ¥120（单次=1.5 击）/SO 会员 ¥200（进度条-20%）/机械键盘 ¥80（每单+¥2）/VS Code 插件 ¥300（每秒 5% 概率自动一击）｜ 预期：数据可被读取
- **Step 2.2** ｜ clicker.js ｜ 点击逻辑：每击进度 +4%×效率，满 100% 完成一单得 ¥3~6（+升级修正）；注册 tick 回调处理 VS Code 插件自动点击 ｜ 预期：数值符合定义
- **Step 2.3** ｜ pages.js 工作台页 ｜ 顶部点击器面板（大按钮+进度条+飘字复用 floater）+ S1 升级卡片网格（已购亮起）；阶段二解锁后点击器保留为次要面板 ｜ 预期：点击→进度→入账→ledger 全通
- **Step 2.4** ｜ stage.js ｜ peakMoney 首次 ≥¥500 时解锁市场购买区 + 仪表盘横幅 + toast 引导「去市场买第一个模型 token」｜ 预期：约 4~5 分钟到达，解锁触发正确

### Phase 3 · 阶段二：市场与工作台改造（依赖 Phase 2）

- **Step 3.1** ｜ inv schema + gacha.js ｜ 卡片增加 q（0.6~1.0 随机）/src('gacha')/revealed(false)；资产页卡面加品质标签（未揭示显示 ❓）；检测费 ¥20/张揭示 ｜ 预期：新抽卡含品质，旧渲染不炸
- **Step 3.2** ｜ market.js + 市场页 ｜ 三区块：①官方 API（按稀有度固定价购 token 包，q=0.95；初版定价 N ¥40/R ¥90/SR ¥200/SSR ¥450/UR ¥1000 每 1M）②中转站盲盒（现有三池迁入）③Token 卖出（自产按官价×0.6）｜ 预期：三条渠道买卖全通，首次购买触发阶段二正式解锁
- **Step 3.3** ｜ work.js 三档 ｜ 档位定义 小 50K/中 200K/大 800K，报酬倍率 ×0.25/×1/×4，删库赔付 -¥16/-¥65/-¥260；四态概率加品质修正（pGreat×q、pRework/q≤40%、pDisaster/q≤15%）；工作台页加档位选择器 ｜ 预期：三档结算数学正确，品质影响可观测
- **Step 3.4** ｜ S2 六升级 ｜ IDE 补全 ¥400（动画间隔×0.7）/云服务器 ¥800（批量结算×2）/CI/CD ¥600（返工率-10% 相对）/代码审查 AI ¥500（删库率-5% 相对）/自动化调度 ¥1,500（解锁被动自动接单开关，tick 每秒 5 单无动画）/批量接单 ¥1,000（手动 10→20 单）｜ 预期：全部生效，自动化开关入 tick
- **Step 3.5** ｜ modals.js + stage.js ｜ 删除破产结局分支；里程碑改为阶段解锁庆祝弹窗（复用 milestoneHTML）；checkEnd 简化 ｜ 预期：余额归零不再弹破产，阶段解锁有仪式感

### Phase 4 · 阶段三：GPU 机房（依赖 Phase 3）

- **Step 4.1** ｜ data/gpus.js + models.js ｜ 六档显卡表（4060 ¥2.5K/4070 ¥5.5K/4090 ¥15K/A100 ¥80K/H100 ¥250K/B200 ¥500K）；模型显存占用 N2/R4/SR8/SSR16/UR24；自产速率=算力×稀有度系数（N400/R250/SR120/SSR50/UR20 tok/s/TFLOPS）｜ 预期：数据就绪
- **Step 4.2** ｜ stage.js + gpu.js ｜ peakMoney≥¥5,000 解锁机房购买区；购入首张显卡正式解锁；购买校验插槽数；部署仅允许图鉴已解锁模型且显存不超限；支持启停 ｜ 预期：买卡→插槽-1→部署→状态正确
- **Step 4.3** ｜ loop.js 接入 gpu tick ｜ 每秒：工作中的显卡产出自产 token（q=1.0，src='self'，入 inv 聚合到同模型卡）并扣电费；余额不足自动停转并 toast ｜ 预期：60 秒产出=算力×系数×60（±0），停转逻辑正确
- **Step 4.4** ｜ 机房页 UI ｜ PCIe 插槽视图（空槽/显卡卡）、每卡部署下拉、产出/电费/启停状态、购买商店列表 ｜ 预期：信息完整可读
- **Step 4.5** ｜ market.js 限时事件 ｜ 每 3~8 分钟随机触发：某稀有度卖出价×1.5 持续 60s，仪表盘+市场页横幅倒计时 ｜ 预期：事件触发/过期/价格修正正确
- **Step 4.6** ｜ S3 六升级 ｜ PCIe 扩展卡 ¥8K（+1 槽）/水冷 ¥12K（电费-15%）/光纤 ¥10K（单笔卖出上限 10M→25M）/智能调度 ¥20K（产出+20%）/太阳能 ¥25K（本地 6:00-18:00 电费-30%）/矿场托管 ¥40K（+2 槽）｜ 预期：全部生效
- **Step 4.7** ｜ stage.js ｜ peakMoney≥¥50,000 → 实验室解锁横幅「可雇佣第一个研究员」｜ 预期：引导正确

### Phase 5 · 阶段四：模型研发（依赖 Phase 4）

- **Step 5.1** ｜ techs.js + research.js ｜ RESEARCHERS 三档（初级 ¥3K/1×、资深 ¥8K/3×、首席 ¥20K/8×，雇佣条件 余额≥1万/5万/20万）；进度公式：0.05%/s × Σ(档速度 × Σ1/√i)；工资秒扣=月薪/600；灵感迸发：每分钟 2% 概率进度+10% ｜ 预期：数学正确，雇佣即解锁阶段四
- **Step 5.2** ｜ 实验室页 UI ｜ 研究员三档卡片（人数/工资/边际递减提示）、研究进度大条、工资与灵感日志 ｜ 预期：信息完整
- **Step 5.3** ｜ S4 五升级 ｜ 预印本 ¥60K（速度+20%）/GPU 集群 ¥120K（效率×1.5）/学术会议 ¥80K（随机双倍进度 60s 事件）/开源社区 ¥100K（每已解锁模型+2%）/人才猎头 ¥90K（新雇员前 10 分钟×1.5）｜ 预期：全部生效
- **Step 5.4** ｜ 超级模型 + 阶段五入口 ｜ 进度 100%：运行时向 MMAP 注入 EX 模型「AGI-X」（图鉴点亮、机房可部署占 32GB、工作报酬 UR×1.5、q=1.0）；庆祝弹窗；自动解锁技术树面板 ｜ 预期：全流程触发

### Phase 6 · 阶段五：技术树 + AGI + 沙盒（依赖 Phase 5）

- **Step 6.1** ｜ techs.js ｜ TECHS 九项（前置依赖按 plan.md 树形）：混合注意力 ¥100K（工作速度+40%/+8%）/LRU 缓存 ¥120K（token 消耗-20%/+8%）/注意力残差 ¥150K（大成功+8%/+10%）/推测解码 ¥200K（产 token×2/+10%）/MoE 路由 ¥250K（可部署模型+50%/+10%）/强化对齐 ¥300K（删库率归零/+10%）/自主迭代 ¥500K（+12%）/多模态融合 ¥400K（全收入×1.3/+12%）/工具使用 ¥350K（研究效率×3/+15%）｜ 预期：增量合计 95%
- **Step 6.2** ｜ tech.js ｜ 解锁校验（金钱+前置技术）；效果挂载到 work/gpu/research 各乘区；每项解锁更新 aiRatio，资源条显示 AI 占比 ｜ 预期：效果可观测
- **Step 6.3** ｜ 实验室页技术树 UI ｜ 节点卡片 + CSS/SVG 连线，状态（可解锁/已解锁/未满足）三态 ｜ 预期：树形可读
- **Step 6.4** ｜ market.js ｜ 阶段五市场页出现「市场操纵」：¥200K 购买，主动触发一次暴涨事件，冷却 10 分钟 ｜ 预期：可用且有冷却
- **Step 6.5** ｜ tech.js AGI 判定 + modals.js 通关弹窗 ｜ aiRatio=100% → 通关画面（总时长/累计赚取/技术数/最佳模型/删库次数/抽卡数/工作单数）→ 沙盒模式开关（金钱 10^12、全升级全技术解锁、纯看数字飞涨）｜ 预期：全流程达成
- **Step 6.6** ｜ dashboard.js ｜ 仪表盘增加 AGI 总进度条（研究进度与技术占比加权）｜ 预期：终局目标可见

### Phase 7 · 收尾与调校（依赖 Phase 6）

- **Step 7.1** ｜ 数值调校 ｜ 全流程手测对照目标时长（s1 ~5min、s2 ~2h、s3 ~3h、s4 ~5h、累计 ~5h 主线路径），调整常量表 ｜ 预期：节奏符合设计
- **Step 7.2** ｜ modals.js + share.js ｜ 玩法帮助重写为五阶段版；概率公示补品质分布与检测说明；分享卡片改新统计；资产页加 AGI 总进度与五阶段收入明细 ｜ 预期：文案与新玩法一致
- **Step 7.3** ｜ README.md ｜ 更新项目结构表、玩法说明、存档 key 变更（tokengacha_v3 硬重置不兼容旧档）｜ 预期：文档同步
- **Step 7.4** ｜ 全量回归 ｜ 冒烟脚本全 Phase 断言 + 移动端 @media 三档断点手测 ｜ 预期：零 console 错误
- **Step 7.5** ｜（可选）蒙特卡洛脚本 ｜ Node 脚本模拟阶段一二经济 1000 局，验证正期望与节奏 ｜ 预期：报告输出

## 4. 验证与测试标准

### 环境（沿用仓库既有方法）

- 本地服务器：`python -m http.server 8017 --bind 127.0.0.1`
- 无头冒烟：`npm i --no-save puppeteer-core` + Edge（executablePath 指向 msedge.exe），测后删除 node_modules
- 快速渲染检查：`msedge --headless=new --dump-dom --virtual-time-budget=6000 URL`

### 每 Phase 通用门禁

1. 页面加载零 console 错误、零 404（favicon 除外）
2. 六页路由切换正常，hash 同步
3. 存档往返：TG.save() → reload → 关键字段深度相等
4. 旧功能无回归（Phase 0~3 期间）：抽卡动画/翻卡/保底/图鉴/分享/充值

### 专项验收

- **Phase 0**：拆分前后 DOM 快照对比一致（同一固定 seed 操作序列）
- **Phase 2**：点击 100 击（模拟）入账金额在期望区间；五个升级逐一生效断言
- **Phase 3**：注入 q=0.6 与 q=1.0 各 1000 单，大成功/返工/删库频率符合公式（±2%）；三档 token 扣减精确
- **Phase 4**：60s tick 产出=算力×系数×60（±0）；余额归零自动停转；电费累计=Σ功耗单价；事件 60s 后价格复原
- **Phase 5**：n 个同档研究员进度=Σ1/√i 公式核对；工资 600s 恰扣一个月薪；灵感迸发可触发且封顶 100%
- **Phase 6**：九技术全解锁 → AGI 弹窗；沙盒金钱生效；dev 钩子加速全流程 ≤3 分钟跑完
- **Phase 7**：整局手测（可用 dev 加速）无卡死、无 NaN、数字格式正确
