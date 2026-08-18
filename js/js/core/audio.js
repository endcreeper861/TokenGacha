"use strict";
/* ================================================================
   TokenGacha · js/core/audio.js — WebAudio 音效
   ================================================================ */

/* ---------- 音效 ---------- */
let AC = null, muted = false;
function ac() { if (!AC) AC = new (window.AudioContext || window.webkitAudioContext)(); return AC; }
function beep(freq, dur = .12, type = 'sine', vol = .15, delay = 0) {
  if (muted) return;
  try {
    const c = ac(), o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.value = freq;
    const t = c.currentTime + delay;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + .01);
    g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + dur + .05);
  } catch (e) { }
}
const SFX = {
  click: () => beep(600, .06, 'square', .06),
  pull: () => { beep(300, .2, 'sawtooth', .08); beep(450, .25, 'sawtooth', .06, .08); },
  flip: (i) => beep(500 + i * 40, .07, 'triangle', .09),
  rarity: (r) => {
    if (r === 'UR') { [523, 659, 784, 1047, 1319].forEach((f, i) => beep(f, .25, 'sine', .14, i * .09)); }
    else if (r === 'SSR') { [523, 659, 784, 1047].forEach((f, i) => beep(f, .2, 'sine', .12, i * .08)); }
    else if (r === 'SR') { [440, 554, 659].forEach((f, i) => beep(f, .15, 'sine', .1, i * .07)); }
  },
  coin: () => { beep(988, .08, 'square', .08); beep(1319, .15, 'square', .08, .07); },
  bad: () => { beep(200, .3, 'sawtooth', .1); beep(150, .4, 'sawtooth', .1, .1); },
  win: () => { [523, 659, 784, 1047, 784, 1047, 1319].forEach((f, i) => beep(f, .3, 'sine', .13, i * .11)); },
};

