"use strict";
/* ================================================================
   TokenGacha · js/core/fx.js — 粒子特效与飘字
   ================================================================ */

/* ---------- 粒子 & 飘字 ---------- */
const fx = document.getElementById('fx'), fctx = fx.getContext('2d');
let parts = [];
function fxResize() { fx.width = innerWidth; fx.height = innerHeight; }
addEventListener('resize', fxResize); fxResize();
function burst(x, y, colors, n = 60, power = 7) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, v = (Math.random() * .7 + .3) * power;
    parts.push({
      x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 2, g: .15, life: 1, decay: .008 + Math.random() * .012,
      c: colors[Math.floor(Math.random() * colors.length)], s: 2 + Math.random() * 4
    });
  }
}
(function fxLoop() {
  fctx.clearRect(0, 0, fx.width, fx.height);
  parts = parts.filter(p => p.life > 0);
  for (const p of parts) {
    p.x += p.vx; p.y += p.vy; p.vy += p.g; p.life -= p.decay;
    fctx.globalAlpha = Math.max(0, p.life); fctx.fillStyle = p.c;
    fctx.fillRect(p.x, p.y, p.s, p.s);
  }
  fctx.globalAlpha = 1;
  requestAnimationFrame(fxLoop);
})();
function shake() { document.body.classList.remove('shake'); void document.body.offsetWidth; document.body.classList.add('shake'); }
function floater(text, x, y, color) {
  const d = document.createElement('div'); d.className = 'floater'; d.textContent = text;
  d.style.left = x + 'px'; d.style.top = y + 'px'; d.style.color = color;
  document.body.appendChild(d); setTimeout(() => d.remove(), 1350);
}
// 出金动画: 中央大字 + 金币飞向余额
function bigMoneyPop(amt) {
  const d = document.createElement('div');
  d.className = 'big-money' + (amt < 0 ? ' neg' : '');
  d.textContent = (amt >= 0 ? '+' : '') + fmt(amt);
  document.body.appendChild(d); setTimeout(() => d.remove(), 1650);
}
function coinShower(fromRect, amount) {
  const chip = $('h-money').getBoundingClientRect();
  const tx = chip.left + chip.width / 2, ty = chip.top + chip.height / 2;
  const neg = amount < 0;
  const n = neg ? 6 : Math.min(16, 7 + Math.floor(Math.abs(amount) / 120));
  for (let i = 0; i < n; i++) {
    const d = document.createElement('div');
    d.textContent = pick(neg ? ['💸', '🕳️'] : ['🪙', '💰', '✨']);
    d.style.cssText = `position:fixed;z-index:230;font-size:${15 + Math.random() * 15}px;pointer-events:none;filter:drop-shadow(0 2px 4px rgba(0,0,0,.2))`;
    const sx = fromRect.left + fromRect.width * (.25 + Math.random() * .5), sy = fromRect.top + fromRect.height * .25;
    d.style.left = sx + 'px'; d.style.top = sy + 'px';
    document.body.appendChild(d);
    const mx = (sx + tx) / 2 + (Math.random() * 160 - 80), my = Math.min(sy, ty) - 100 - Math.random() * 100;
    d.animate([
      { transform: 'translate(0,0) scale(.4) rotate(0deg)', opacity: 0 },
      { transform: `translate(${mx - sx}px,${my - sy}px) scale(1.25) rotate(${Math.random() * 200 - 100}deg)`, opacity: 1, offset: .4 },
      { transform: `translate(${tx - sx}px,${ty - sy}px) scale(.5) rotate(${Math.random() * 360 - 180}deg)`, opacity: .9 }
    ], { duration: 650 + Math.random() * 450, delay: i * 55, easing: 'cubic-bezier(.25,.8,.35,1)' }).onfinish = () => {
      d.remove();
      burst(tx, ty, ['#f59e0b', '#fde68a', '#fff'], 6, 2.5);
    };
  }
}
let toastTimer = null;
function toast(msg, ms = 2200) {
  clearTimeout(toastTimer);
  document.querySelectorAll('.toast').forEach(t => t.remove());
  const d = document.createElement('div'); d.className = 'toast'; d.innerHTML = msg;
  document.body.appendChild(d);
  toastTimer = setTimeout(() => d.remove(), ms);
}

