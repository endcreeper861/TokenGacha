"use strict";
/* ================================================================
   TokenGacha · js/core/util.js — 通用工具函数
   ================================================================ */

/* ---------- 图标 CDN ---------- */
const CDN1 = 'https://unpkg.com/@lobehub/icons-static-svg@latest/icons/';
const CDN2 = 'https://registry.npmmirror.com/@lobehub/icons-static-svg/latest/files/icons/';
function iconImg(slug, cls = '') {
  const img = document.createElement('img');
  img.className = cls; img.alt = slug; img.loading = 'lazy';
  img.src = CDN1 + slug + '.svg';
  img.onerror = () => {
    img.onerror = () => {
      const d = document.createElement('div');
      const s = img.width || 36;
      d.style.cssText = `width:${s}px;height:${s}px;display:flex;align-items:center;justify-content:center;border-radius:8px;background:#e8ecf8;font-weight:900;color:#67719a;font-size:${Math.round(s * .45)}px`;
      d.textContent = slug[0].toUpperCase();
      img.replaceWith(d);
    }; img.src = CDN2 + slug + '.svg';
  };
  return img;
}

const $ = id => document.getElementById(id);
const fmt = n => '¥' + Math.round(n).toLocaleString('zh-CN');
const fmt2 = n => '¥' + n.toLocaleString('zh-CN', { maximumFractionDigits: 1 });
const fmtNum = n => Math.round(n).toLocaleString('zh-CN');
const fmtK = n => n >= 10000 ? (n / 10000).toLocaleString('zh-CN', { maximumFractionDigits: 1 }) + '万' : n >= 1000 ? (n / 1000).toLocaleString('zh-CN', { maximumFractionDigits: 1 }) + 'K' : Math.round(n);
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
function addLedger(label, amt) {
  const t = new Date();
  const ts = `${String(t.getHours()).padStart(2, '0')}:${String(t.getMinutes()).padStart(2, '0')}`;
  S.ledger.unshift({ ts, label, amt });
  if (S.ledger.length > 80) S.ledger.length = 80;
}

function escapeHtml(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
