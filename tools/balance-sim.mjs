#!/usr/bin/env node
/* TokenGacha 阶段五 AGI 研究点节奏模拟器
 * 用法: node tools/balance-sim.mjs
 * 模拟不同研究员/升级/购买顺序下阶段五所需时间（不含随机事件）。
 */
const dim = n => {
  let v = 0;
  for (let i = 1; i <= n; i++) v += 1 / Math.sqrt(i);
  return v;
};
const units = st => dim(st.j) + st.s * 3 * dim(st.s) + st.c * 8 * dim(st.c);

const TECHS = [
  { id: 'attention', rp: 14000, pre: [] },
  { id: 'lru', rp: 14000, pre: [] },
  { id: 'residual', rp: 17000, pre: [] },
  { id: 'speculative', rp: 21000, pre: ['attention'] },
  { id: 'moe', rp: 23000, pre: ['lru'] },
  { id: 'align', rp: 23000, pre: ['residual'] },
  { id: 'iterate', rp: 29000, pre: ['speculative'] },
  { id: 'multimodal', rp: 32000, pre: ['moe'] },
  { id: 'tools', rp: 30000, pre: ['align'] },
];
const FINAL = 60000;
const TOTAL = TECHS.reduce((s, t) => s + t.rp, 0) + FINAL;

function sim(staff, s4) {
  const u = units(staff);
  let bank = 0;
  const unlocked = new Set();
  let t = 0;
  const rate = () => {
    let v = 6 + 12 * u / (u + 40);
    v *= 1 + 0.06 * s4;
    if (unlocked.has('iterate')) v *= 1.5;
    if (unlocked.has('tools')) v *= 3;
    return v;
  };
  while (unlocked.size < TECHS.length) {
    bank += rate();
    const avail = TECHS.filter(x => !unlocked.has(x.id) && x.pre.every(p => unlocked.has(p)));
    const can = avail.filter(x => bank >= x.rp);
    if (can.length) {
      const x = can.sort((a, b) => a.rp - b.rp)[0];
      bank -= x.rp;
      unlocked.add(x.id);
    }
    t++;
  }
  while (bank < FINAL) { bank += rate(); t++; }
  return t / 3600;
}

const builds = [
  { name: '1初级 · 无S4', staff: { j: 1, s: 0, c: 0 }, s4: 0 },
  { name: '3初级3资深2首席 · 3S4', staff: { j: 3, s: 3, c: 2 }, s4: 3 },
  { name: '3初级3资深3首席 · 4S4', staff: { j: 3, s: 3, c: 3 }, s4: 4 },
  { name: '10初级5资深5首席 · 5S4', staff: { j: 10, s: 5, c: 5 }, s4: 5 },
  { name: '3首席 · 2S4', staff: { j: 0, s: 0, c: 3 }, s4: 2 },
];

console.log(`阶段五总 RP 需求: ${TOTAL.toLocaleString('zh-CN')}\n`);
for (const b of builds) {
  const h = sim(b.staff, b.s4);
  console.log(`${b.name.padEnd(24)} ${h.toFixed(2)} 小时`);
}
