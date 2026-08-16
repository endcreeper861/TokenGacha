/* TokenGacha 最终冒烟测试 (puppeteer-core + Edge) */
const puppeteer = require('puppeteer-core');

const URL = 'http://127.0.0.1:8017/index.html';
const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

const results = [];
function check(name, ok, extra = '') {
  results.push({ name, ok, extra });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${extra ? '  · ' + extra : ''}`);
}

(async () => {
  const browser = await puppeteer.launch({ executablePath: EDGE, headless: 'new' });
  const page = await browser.newPage();
  const errors = [];
  const failedReqs = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
  page.on('requestfailed', r => failedReqs.push(r.url()));
  page.on('response', r => { if (r.status() >= 400) failedReqs.push(r.status() + ' ' + r.url()); });

  await page.goto(URL, { waitUntil: 'networkidle2', timeout: 20000 });

  // 1. 加载无错误 + 欢迎弹窗
  await page.waitForSelector('#modal-mask.show', { timeout: 5000 }).catch(() => { });
  check('页面加载无 console 错误', errors.length === 0, errors.slice(0, 3).join(' | '));
  const welcome = await page.$eval('#modal-box', el => el.textContent.includes('写代码'));
  check('欢迎弹窗为点击器引导', welcome);

  // 关闭欢迎
  await page.click('#btn-start');

  // 2. 初始状态
  const money0 = await page.$eval('#h-money', el => el.textContent);
  check('初始余额 ¥0', money0.includes('0'), money0);
  const navBtns = await page.$$eval('.top-nav button', els => els.length);
  check('导航六页', navBtns === 6, String(navBtns));

  // 3. 阶段一：点击写代码（先切到工作台页）
  await page.evaluate(() => { location.hash = '#work'; });
  await new Promise(r => setTimeout(r, 300));
  const payBefore = await page.$eval('#h-money', el => parseInt(el.textContent.replace(/[^\d]/g, '')) || 0);
  // 快速点击 40 次（每次 5%×1 = 5% 进度 → 40 击 ≈ 2 单）
  for (let i = 0; i < 40; i++) await page.click('#btn-click').catch(() => { });
  await new Promise(r => setTimeout(r, 300));
  const payAfter = await page.$eval('#h-money', el => parseInt(el.textContent.replace(/[^\d]/g, '')) || 0);
  check('点击器产生收入', payAfter > payBefore, `${payBefore} → ${payAfter}`);
  const clicks = await page.$eval('#clicker-sub', el => el.textContent);
  check('点击统计更新', /敲击/.test(clicks), clicks);

  // 4. 用 TG 钩子加速到 500 解锁市场
  await page.evaluate(() => TG.addMoney(600));
  await page.waitForSelector('.banner-new', { timeout: 3000 }).catch(() => { });
  check('¥500 触发市场开放横幅', await page.$eval('#dash-banners', el => el.textContent.includes('市场已开放')));
  // 市场页不再锁定
  await page.evaluate(() => { location.hash = '#market'; });
  await new Promise(r => setTimeout(r, 300));
  const marketLocked = await page.$eval('#page-market', el => el.classList.contains('locked'));
  check('市场页解锁', !marketLocked);

  // 5. 官方 API 购买
  const apiBtns = await page.$$('.api-btn');
  check('官方 API 区渲染 5 档', apiBtns.length === 5, String(apiBtns.length));
  await page.evaluate(() => TG.addMoney(100000));
  await page.click('.api-btn[data-api="UR"]');
  await page.click('.api-btn[data-api="N"]'); // N 包供 8GB 的 4060 部署
  await new Promise(r => setTimeout(r, 300));
  const hasTok = await page.$eval('#h-tokens', el => parseInt(el.textContent.replace(/[^\d]/g, '')) > 0);
  check('购买 UR token 包成功', hasTok);
  const stage2 = await page.evaluate(() => S.stage);
  check('阶段二解锁', stage2 >= 2, 'stage=' + stage2);

  // 6. 免费十连残留检查（设计已移除免费十连）
  const freeTag = await page.$eval('#page-market', el => el.textContent.includes('新手赠送'));
  check('无免费十连残留', !freeTag, freeTag ? '发现免费十连文案' : '');

  // 7. 工作：接单
  await page.evaluate(() => { location.hash = '#work'; });
  await new Promise(r => setTimeout(r, 300));
  const workBtnDisabled = await page.$eval('#btn-work', el => el.disabled);
  check('工作按钮可用', !workBtnDisabled);
  const diagBefore = await page.evaluate(() => ({ tasks: S.stats.tasks, inv: S.inv.map(c => c.m + ':' + c.tokens), tier: selTier, err: null }));
  // DOM click（puppeteer 坐标点击会被动画期 disabled/遮挡干扰，DOM click 验证事件派发本身）
  await page.evaluate(() => document.getElementById('btn-work').click());
  await new Promise(r => setTimeout(r, 3500));
  const diagAfter = await page.evaluate(() => ({ tasks: S.stats.tasks, inv: S.inv.map(c => c.m + ':' + c.tokens), working }));
  const tasks = await page.evaluate(() => S.stats.tasks);
  check('完成工作单', tasks > 0, 'tasks=' + tasks + ' | before=' + JSON.stringify(diagBefore) + ' | after=' + JSON.stringify(diagAfter));

  // 7.5 Phase 8: Token 自动订阅
  const subDisabledBefore = await page.$eval('[data-up="s2_subscribe"]', el => el.disabled).catch(() => true);
  check('自动订阅前置禁用', subDisabledBefore, 'disabled=' + subDisabledBefore);
  await page.evaluate(() => document.querySelector('[data-up="s2_auto"]').click()).catch(() => { });
  await new Promise(r => setTimeout(r, 300));
  const subDisabledAfter = await page.$eval('[data-up="s2_subscribe"]', el => el.disabled).catch(() => true);
  check('自动订阅前置后可用', !subDisabledAfter, 'disabled=' + subDisabledAfter);
  await page.evaluate(() => document.querySelector('[data-up="s2_subscribe"]').click()).catch(() => { });
  await new Promise(r => setTimeout(r, 300));
  const subOwned = await page.evaluate(() => !!S.upgrades.s2_subscribe);
  check('自动订阅升级已购', subOwned);
  await page.evaluate(() => { location.hash = '#market'; });
  await new Promise(r => setTimeout(r, 300));
  const autoPanel = await page.$eval('#autobuy-panel', el => el.textContent.includes('自动订阅')).catch(() => false);
  check('自动订阅面板渲染', autoPanel);
  await page.evaluate(() => document.getElementById('btn-autobuy').click()).catch(() => { });
  await page.evaluate(() => document.querySelector('[data-abrar="R"]').click()).catch(() => { });
  await page.evaluate(() => document.querySelector('[data-abtarget="1000000"]').click()).catch(() => { });
  await new Promise(r => setTimeout(r, 200));
  const autoCfg = await page.evaluate(() => ({ enabled: S.autobuy.enabled, rarity: S.autobuy.rarity, target: S.autobuy.target }));
  check('自动订阅配置生效', autoCfg.enabled && autoCfg.rarity === 'R' && autoCfg.target === 1000000, JSON.stringify(autoCfg));
  await page.evaluate(() => { S.inv = []; });
  await new Promise(r => setTimeout(r, 2200));
  const autoBought = await page.evaluate(() => {
    const c = S.inv.find(x => x.src === 'official' && MMAP[x.m].r === 'R');
    return !!(c && c.tokens >= 1000000 && S.stats.autoBuys >= 1);
  });
  check('自动补货成功', autoBought, 'autoBuys=' + (await page.evaluate(() => S.stats.autoBuys)));
  const autoBeforeStop = await page.evaluate(() => S.stats.autoBuys);
  await page.evaluate(() => { S.inv = []; S.autobuy.enabled = false; });
  await new Promise(r => setTimeout(r, 1200));
  const autoStopped = await page.evaluate(before => S.stats.autoBuys === before && S.inv.length === 0, autoBeforeStop);
  check('关闭后不再补货', autoStopped, 'before=' + autoBeforeStop + ' after=' + (await page.evaluate(() => S.stats.autoBuys)));

  // 8. 阶段三半解锁商店（peakMoney ≥ 5000 后机房应显示商店）
  await page.evaluate(() => { location.hash = '#gpu'; TG.addMoney(20000); });
  await new Promise(r => setTimeout(r, 400));
  const gpuStoreVisible = await page.$eval('#gpu-root', el => el.textContent.includes('显卡商店'));
  const gpuPageLocked = await page.$eval('#page-gpu', el => el.classList.contains('locked'));
  check('机房半解锁商店可见', gpuStoreVisible && !gpuPageLocked, `visible=${gpuStoreVisible} locked=${gpuPageLocked}`);

  // 9. 购买显卡 → 阶段三解锁
  await page.evaluate(() => document.querySelector('[data-gbuy="g4060"]').click()).catch(() => { });
  await new Promise(r => setTimeout(r, 400));
  const stage3 = await page.evaluate(() => S.stage);
  check('阶段三解锁（买卡）', stage3 >= 3, 'stage=' + stage3);

  // 10. 部署模型 + tick 产出
  await page.evaluate(() => {
    const card = S.gpus.cards[0];
    const m = deployableModels(card)[0];
    deployModel(card.uid, m.id);
  });
  await new Promise(r => setTimeout(r, 2200)); // 等 2 个 tick
  const selfTok = await page.evaluate(() => S.stats.selfTokens);
  check('机房产出自产 token', selfTok > 0, 'selfTokens=' + selfTok);

  // 11. 实验室半解锁（peakMoney ≥ 50000 后应显示雇佣按钮）
  await page.evaluate(() => { location.hash = '#lab'; TG.addMoney(200000); });
  await new Promise(r => setTimeout(r, 400));
  const labHasHire = await page.$eval('#lab-root', el => el.textContent.includes('雇佣'));
  const labPageLocked = await page.$eval('#page-lab', el => el.classList.contains('locked'));
  check('实验室半解锁可雇佣', labHasHire && !labPageLocked, `hire=${labHasHire} locked=${labPageLocked}`);

  // 12. 雇佣研究员 → 阶段四解锁
  await page.evaluate(() => document.querySelector('[data-hire="junior"]').click()).catch(() => { });
  await new Promise(r => setTimeout(r, 400));
  const stage4 = await page.evaluate(() => S.stage);
  check('阶段四解锁（雇佣）', stage4 >= 4, 'stage=' + stage4);
  const spd = await page.evaluate(() => researchSpeed());
  check('研究速度 > 0', spd > 0, spd.toFixed(4) + '%/s');

  // 13. 研究推进（TG 加速检查 tick 进度增长）
  const p1 = await page.evaluate(() => S.research.progress);
  await new Promise(r => setTimeout(r, 2100));
  const p2 = await page.evaluate(() => S.research.progress);
  check('研究进度 tick 增长', p2 > p1, `${p1.toFixed(3)} → ${p2.toFixed(3)}`);

  // 14. 研究 100% → 超级模型
  await page.evaluate(() => { S.research.progress = 100; });
  await new Promise(r => setTimeout(r, 1500));
  const hasAgix = await page.evaluate(() => !!MMAP.agix && !!S.dex.agix);
  check('超级模型 AGI-X 解锁', hasAgix);
  const stage5 = await page.evaluate(() => S.stage);
  check('阶段五自动进入', stage5 >= 5, 'stage=' + stage5);

  // 15. 技术树渲染 + AGI 研究面板 + AI 占比
  await page.evaluate(() => { location.hash = '#lab'; });
  await new Promise(r => setTimeout(r, 300));
  const techNodes = await page.$$eval('.tech-node', els => els.length);
  check('技术树 9 节点', techNodes === 9, String(techNodes));
  const agiPanelVisible = await page.$eval('#lab-root', el => el.textContent.includes('AGI 研究'));
  check('AGI 研究面板渲染', agiPanelVisible);
  const ai0 = await page.evaluate(() => S.aiRatio);
  check('AI 占比初始 5%', ai0 === 0.05, String(ai0));

  // 16. 解锁全部技术后不立即 AGI，完成最终协议才 AGI
  const afterTechs = await page.evaluate(() => {
    TG.addMoney(1e9);
    TG.addRp(1e9);
    for (const id of TECH_ORDER) unlockTech(id);
    const after = S.aiRatio;
    TG.finishAgi();
    return after;
  });
  check('九技术后 AI=95%（不立即通关）', Math.abs(afterTechs - 0.95) < 1e-9, 'afterTechs=' + afterTechs);
  await new Promise(r => setTimeout(r, 1200)); // 等 AGI 弹窗延迟显示
  const agi = await page.evaluate(() => S.flags.agi);
  check('AGI 达成', agi);
  const sandboxBtn = await page.$eval('#modal-box', el => el.textContent.includes('沙盒')).catch(() => false);
  check('通关弹窗含沙盒', !!sandboxBtn);

  // 17. 沙盒模式
  await page.evaluate(() => document.getElementById('btn-sandbox').click()).catch(() => { });
  await new Promise(r => setTimeout(r, 400));
  const sbMoney = await page.evaluate(() => S.money);
  check('沙盒金钱 10^12', sbMoney >= 1e12 - 1000, String(sbMoney));

  // 18. 存档往返
  await page.evaluate(() => save());
  await page.reload({ waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 500));
  const relStage = await page.evaluate(() => S.stage);
  const relAgi = await page.evaluate(() => S.flags.agi);
  check('存档往返保留', relStage >= 5 && relAgi, `stage=${relStage} agi=${relAgi}`);
  const relAuto = await page.evaluate(() => ({ enabled: S.autobuy.enabled, rarity: S.autobuy.rarity, target: S.autobuy.target }));
  check('自动订阅配置存档持久化', relAuto.enabled === false && relAuto.rarity === 'R' && relAuto.target === 1000000, JSON.stringify(relAuto));

  // 19. AGI-X 可部署产出（EX SELF_RATE 检查）
  const exRate = await page.evaluate(() => SELF_RATE.EX);
  check('SELF_RATE 含 EX 系数', exRate != null && exRate > 0, String(exRate));

  // 20. 各页快照
  const pages = ['dashboard', 'market', 'work', 'gpu', 'lab', 'assets'];
  for (const p of pages) {
    await page.evaluate(pg => { location.hash = '#' + pg; }, p);
    await new Promise(r => setTimeout(r, 250));
    const h = await page.$eval('#page-' + p, el => el.innerHTML.length);
    check(`页面 ${p} 渲染`, h > 200, h + ' chars');
  }

  console.log('\n===== 汇总 =====');
  const fails = results.filter(r => !r.ok);
  console.log(`${results.length - fails.length}/${results.length} 通过`);
  if (fails.length) {
    console.log('失败项：');
    fails.forEach(f => console.log(' - ' + f.name + (f.extra ? '  · ' + f.extra : '')));
  }
  const bad404 = failedReqs.filter(u => !u.includes('favicon'));
  console.log('非 favicon 失败请求：', bad404.length ? bad404 : '无');

  await page.screenshot({ path: 'v-final-check.png', fullPage: true }).catch(() => { });
  await browser.close();
  process.exit(fails.length ? 1 : 0);
})().catch(e => { console.error('FATAL', e); process.exit(2); });
