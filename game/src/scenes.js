// The three scenes of Twin Tides, all drawn by hand in canvas paths — no
// image files, no borrowed art. Each scene is drawn twice per frame: once
// plain (left panel) and once with every difference applied (right panel).
// A difference is a small `alter` step painted over the base picture, so the
// two panels stay identical everywhere except the seven hidden changes.
//
// Every scene lives in a 560 x 420 space; render.js scales it into a panel.
// `mods` is the set of difference ids to apply; `t` is seconds, for the
// gentle motion (bobbing boats, twinkling fireflies) that keeps the picture
// alive without moving any difference.

import { butterfly, cloud, fish, flower, glowDisc, gull, lantern, mushroom, ripple, sky, sparkle } from './art.js';
import { mulberry32, scatter, sway } from './random.js';

const W = 560;
const H = 420;

function vgrad(ctx, y0, y1, stops) {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  stops.forEach(([at, color]) => g.addColorStop(at, color));
  return g;
}

function skyPatch(ctx, x, y, r, stops) {
  ctx.save();
  ctx.fillStyle = vgrad(ctx, 0, H, stops);
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// ---------------------------------------------------------------- harbour
const HARBOUR_SKY = [
  [0, '#ffe3a3'],
  [0.55, '#ffb877'],
  [1, '#ff9d6e'],
];
const HARBOUR_SEA = [
  [0, '#3a9aa8'],
  [1, '#1e6076'],
];

function seaPatch(ctx, x, y, r) {
  ctx.save();
  ctx.fillStyle = vgrad(ctx, 250, H, HARBOUR_SEA);
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawSun(ctx, withSmile) {
  glowDisc(ctx, 88, 72, 30, '#ffd76e', 'rgba(255, 214, 110, 0.75)');
  ctx.save();
  ctx.strokeStyle = '#e8a83c';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  for (let i = 0; i < 8; i += 1) {
    const a = (i / 8) * Math.PI * 2 + 0.2;
    ctx.beginPath();
    ctx.moveTo(88 + Math.cos(a) * 38, 72 + Math.sin(a) * 38);
    ctx.lineTo(88 + Math.cos(a) * 48, 72 + Math.sin(a) * 48);
    ctx.stroke();
  }
  ctx.restore();
  if (withSmile) {
    ctx.save();
    ctx.fillStyle = '#7a4a12';
    ctx.beginPath();
    ctx.arc(80, 68, 2.6, 0, Math.PI * 2);
    ctx.arc(96, 68, 2.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#7a4a12';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.arc(88, 76, 9, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.stroke();
    ctx.restore();
  }
}

function drawLighthouse(ctx, lit) {
  ctx.save();
  // Rock.
  ctx.fillStyle = '#5d6b73';
  ctx.beginPath();
  ctx.ellipse(430, 252, 52, 14, 0, Math.PI, 0);
  ctx.fill();
  // Tower, clipped so the stripes stay inside it.
  const tower = new Path2D();
  tower.moveTo(408, 250);
  tower.lineTo(452, 250);
  tower.lineTo(446, 118);
  tower.lineTo(414, 118);
  tower.closePath();
  ctx.fillStyle = '#fdf6e9';
  ctx.fill(tower);
  ctx.save();
  ctx.clip(tower);
  ctx.fillStyle = '#d64541';
  ctx.fillRect(406, 168, 48, 24);
  ctx.fillRect(406, 214, 48, 24);
  ctx.restore();
  ctx.strokeStyle = '#8a7a66';
  ctx.lineWidth = 1.5;
  ctx.stroke(tower);
  // Door and windows.
  ctx.fillStyle = '#4a3423';
  ctx.beginPath();
  ctx.moveTo(424, 250);
  ctx.lineTo(424, 232);
  ctx.quadraticCurveTo(430, 226, 436, 232);
  ctx.lineTo(436, 250);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#2c4a5a';
  ctx.fillRect(419, 150, 7, 10);
  ctx.fillRect(434, 198, 7, 10);
  // Gallery and lamp room.
  ctx.fillStyle = '#3a3f47';
  ctx.fillRect(408, 112, 44, 7);
  if (lit) glowDisc(ctx, 430, 102, 9, '#ffe9a8', 'rgba(255, 233, 168, 0.8)');
  ctx.fillStyle = lit ? '#ffe9a8' : '#33424f';
  ctx.fillRect(419, 92, 22, 20);
  ctx.strokeStyle = '#3a3f47';
  ctx.lineWidth = 2;
  ctx.strokeRect(419, 92, 22, 20);
  ctx.beginPath();
  ctx.moveTo(419, 92);
  ctx.lineTo(430, 76);
  ctx.lineTo(441, 92);
  ctx.closePath();
  ctx.fillStyle = '#8a2f2b';
  ctx.fill();
  ctx.restore();
}

function drawBoat(ctx, x, y, s, sailColor, bob) {
  ctx.save();
  ctx.translate(x, y + bob);
  ctx.fillStyle = '#7a4a2b';
  ctx.beginPath();
  ctx.moveTo(-30 * s, 0);
  ctx.lineTo(30 * s, 0);
  ctx.lineTo(20 * s, 15 * s);
  ctx.lineTo(-20 * s, 15 * s);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#5d3a20';
  ctx.lineWidth = 2 * s;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, -46 * s);
  ctx.stroke();
  ctx.fillStyle = sailColor;
  ctx.beginPath();
  ctx.moveTo(0, -46 * s);
  ctx.lineTo(0, -2 * s);
  ctx.lineTo(-26 * s, -2 * s);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#d64541';
  ctx.beginPath();
  ctx.moveTo(0, -46 * s);
  ctx.lineTo(12 * s, -42 * s);
  ctx.lineTo(0, -38 * s);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawHarbour(ctx, mods, t) {
  sky(ctx, W, H, HARBOUR_SKY);
  drawSun(ctx, !mods.has('sun-smile'));
  cloud(ctx, 190, 56, 1.1);
  cloud(ctx, 372, 40, 0.9);
  cloud(ctx, 462, 106, 0.8);
  if (!mods.has('gull-gone')) gull(ctx, 250, 62, 1.1);
  gull(ctx, 150, 95, 1);
  gull(ctx, 350, 112, 0.9);
  // Sea.
  ctx.fillStyle = vgrad(ctx, 250, H, HARBOUR_SEA);
  ctx.fillRect(0, 250, W, 170);
  ctx.save();
  ctx.strokeStyle = 'rgba(255, 220, 140, 0.35)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 4; i += 1) {
    ctx.beginPath();
    const yy = 268 + i * 42;
    for (let x = 66; x <= 116; x += 6) {
      const y = yy + Math.sin(x * 0.3 + t + i) * 3;
      if (x === 66) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  ctx.restore();
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.28)';
  ctx.lineWidth = 2;
  [292, 332, 378].forEach((yy, row) => {
    ctx.beginPath();
    for (let x = 0; x <= W; x += 10) {
      const y = yy + Math.sin(x * 0.05 + t * 0.8 + row * 2) * 2.5;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  });
  ctx.restore();
  // Lighthouse, pier, boats, buoy, fish.
  drawLighthouse(ctx, !mods.has('lamp-dark'));
  ctx.save();
  ctx.fillStyle = '#8a6d4b';
  ctx.beginPath();
  ctx.moveTo(20, 300);
  ctx.lineTo(212, 316);
  ctx.lineTo(212, 330);
  ctx.lineTo(20, 314);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#6b4f33';
  [44, 112, 180].forEach((x) => ctx.fillRect(x, 312, 8, 38));
  ctx.strokeStyle = 'rgba(0,0,0,0.2)';
  ctx.lineWidth = 1;
  for (let x = 50; x < 210; x += 26) {
    ctx.beginPath();
    ctx.moveTo(x, 303 + (x - 20) * 0.08);
    ctx.lineTo(x, 317 + (x - 20) * 0.08);
    ctx.stroke();
  }
  ctx.restore();
  drawBoat(ctx, 180, 302, 1, mods.has('sail-blue') ? '#2f6fb2' : '#d64541', sway(t, 1.1, 0) * 2);
  drawBoat(ctx, 306, 346, 0.68, '#2f8f9d', sway(t, 1.1, 2) * 1.6);
  if (!mods.has('buoy-gone')) {
    ctx.save();
    ctx.translate(485, 332 + sway(t, 1.3, 1) * 2);
    ctx.fillStyle = '#d64541';
    ctx.beginPath();
    ctx.moveTo(-9, -14);
    ctx.lineTo(9, -14);
    ctx.lineTo(6, 12);
    ctx.lineTo(-6, 12);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#fdf6e9';
    ctx.fillRect(-8, -4, 16, 6);
    ctx.strokeStyle = '#5d3a20';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -14);
    ctx.lineTo(0, -22);
    ctx.stroke();
    ctx.restore();
  }
  if (!mods.has('fish-gone')) {
    ctx.save();
    ctx.translate(120, 282);
    ctx.rotate(-0.5);
    fish(ctx, 0, 0, 1, '#ff8c42');
    ctx.restore();
    ripple(ctx, 120, 302, 26, 7);
  }
  // Rocks, bottom right.
  ctx.fillStyle = '#54626b';
  ctx.beginPath();
  ctx.ellipse(505, 402, 42, 16, 0, Math.PI, 0);
  ctx.ellipse(540, 406, 26, 12, 0, Math.PI, 0);
  ctx.fill();
  // --- alterations (painted over the base picture) ---
  if (mods.has('sun-smile')) {
    ctx.fillStyle = '#ffd76e';
    ctx.beginPath();
    ctx.arc(88, 72, 19, 0, Math.PI * 2);
    ctx.fill();
  }
  if (mods.has('gull-gone')) skyPatch(ctx, 250, 62, 20, HARBOUR_SKY);
  if (mods.has('stripe-blue')) {
    ctx.fillStyle = '#2f6fb2';
    ctx.fillRect(409, 168, 42, 24);
  }
  if (mods.has('lamp-dark')) {
    skyPatch(ctx, 430, 102, 24, HARBOUR_SKY);
    ctx.fillStyle = '#8a2f2b';
    ctx.beginPath();
    ctx.moveTo(419, 92);
    ctx.lineTo(430, 76);
    ctx.lineTo(441, 92);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#3a3f47';
    ctx.fillRect(408, 112, 44, 7);
    ctx.fillStyle = '#33424f';
    ctx.fillRect(419, 92, 22, 20);
    ctx.strokeStyle = '#3a3f47';
    ctx.lineWidth = 2;
    ctx.strokeRect(419, 92, 22, 20);
  }
  if (mods.has('buoy-gone')) seaPatch(ctx, 485, 334, 22);
  if (mods.has('fish-gone')) seaPatch(ctx, 120, 288, 24);
}

// ------------------------------------------------------------------ market
const MARKET_SKY = [
  [0, '#131b31'],
  [0.6, '#232f57'],
  [1, '#31427a'],
];
const MARKET_STARS = scatter(mulberry32(21), 10, 8, 540, 240, 36, 20).filter(
  (p) => (p.x - 472) ** 2 + (p.y - 68) ** 2 > 55 * 55,
);

function drawAwning(ctx, x0, x1, y, colorA, colorB) {
  const path = new Path2D();
  path.moveTo(x0 - 6, y);
  path.lineTo(x1 + 6, y);
  path.lineTo(x1 - 4, y + 40);
  path.lineTo(x0 + 4, y + 40);
  path.closePath();
  ctx.save();
  ctx.clip(path);
  for (let x = x0 - 6; x < x1 + 6; x += 22) {
    ctx.fillStyle = (Math.round((x - x0) / 22) % 2 === 0 ? colorA : colorB);
    ctx.fillRect(x, y, 22, 44);
  }
  ctx.restore();
  ctx.fillStyle = colorA;
  for (let x = x0 + 4; x < x1; x += 22) {
    ctx.beginPath();
    ctx.arc(x + 11, y + 40, 8, 0, Math.PI);
    ctx.fill();
  }
}

function drawStall(ctx, x0, x1, awningA, awningB) {
  ctx.fillStyle = '#6b4a2f';
  ctx.fillRect(x0 + 6, 130, 8, 200);
  ctx.fillRect(x1 - 14, 130, 8, 200);
  drawAwning(ctx, x0, x1, 128, awningA, awningB);
  ctx.fillStyle = '#8a6d4b';
  ctx.fillRect(x0, 282, x1 - x0, 48);
  ctx.fillStyle = '#a07f56';
  ctx.fillRect(x0 - 4, 276, x1 - x0 + 8, 10);
  ctx.strokeStyle = 'rgba(0,0,0,0.25)';
  ctx.lineWidth = 1;
  for (let y = 294; y < 330; y += 12) {
    ctx.beginPath();
    ctx.moveTo(x0, y);
    ctx.lineTo(x1, y);
    ctx.stroke();
  }
}

function drawFruitCrate(ctx, x, y, color, count) {
  ctx.fillStyle = '#7a5a38';
  ctx.fillRect(x, y, 46, 26);
  ctx.strokeStyle = '#5d4026';
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, 46, 26);
  ctx.fillStyle = color;
  for (let i = 0; i < count; i += 1) {
    const cx = x + 10 + (i % 3) * 13;
    const cy = y - 2 - Math.floor(i / 3) * 11;
    ctx.beginPath();
    ctx.arc(cx, cy, 7, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawCat(ctx, x, y) {
  ctx.save();
  ctx.fillStyle = '#5a6472';
  ctx.beginPath();
  ctx.ellipse(x, y + 8, 16, 18, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x + 2, y - 12, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x - 7, y - 18);
  ctx.lineTo(x - 4, y - 28);
  ctx.lineTo(x + 1, y - 20);
  ctx.closePath();
  ctx.moveTo(x + 7, y - 20);
  ctx.lineTo(x + 12, y - 28);
  ctx.lineTo(x + 14, y - 17);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#5a6472';
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x + 14, y + 20);
  ctx.quadraticCurveTo(x + 30, y + 18, x + 26, y + 2);
  ctx.stroke();
  ctx.fillStyle = '#ffd76e';
  ctx.beginPath();
  ctx.arc(x - 2, y - 13, 1.8, 0, Math.PI * 2);
  ctx.arc(x + 7, y - 13, 1.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawMarket(ctx, mods, t) {
  sky(ctx, W, H, MARKET_SKY);
  MARKET_STARS.forEach((p, i) => {
    const tw = 0.5 + 0.5 * sway(t, 1.4, i * 1.7);
    ctx.globalAlpha = 0.35 + 0.55 * tw;
    ctx.fillStyle = '#fff8d6';
    ctx.beginPath();
    ctx.arc(p.x, p.y, i % 5 === 0 ? 2.4 : 1.5, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;
  // Crescent moon (or full, when the difference is on).
  ctx.fillStyle = '#f7d774';
  ctx.beginPath();
  ctx.arc(472, 68, 24, 0, Math.PI * 2);
  ctx.fill();
  if (!mods.has('moon-full')) {
    ctx.fillStyle = '#1d2745';
    ctx.beginPath();
    ctx.arc(481, 64, 21, 0, Math.PI * 2);
    ctx.fill();
  }
  // String lights sagging between the stalls.
  ctx.save();
  ctx.strokeStyle = '#3a2f22';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(16, 66);
  ctx.quadraticCurveTo(150, 132, 280, 78);
  ctx.moveTo(280, 78);
  ctx.quadraticCurveTo(410, 132, 544, 66);
  ctx.stroke();
  const bulbColors = ['#ffd76e', '#ff9d6e', '#9fd6a8'];
  for (let i = 0; i < 14; i += 1) {
    const u = i / 13;
    const bx = 16 + u * 528;
    // The string sags: highest at the ends, lowest in the middle.
    const yy = 66 + Math.sin(u * Math.PI) * 46;
    ctx.fillStyle = bulbColors[i % 3];
    ctx.beginPath();
    ctx.arc(bx, yy + 6, 3.4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
  // Lanterns.
  lantern(ctx, 120, 100, 1, '#d64541');
  lantern(ctx, 220, 108, 0.9, '#e8b93c');
  lantern(ctx, 330, 104, 1, mods.has('lantern-red') ? '#d64541' : '#4da96b');
  lantern(ctx, 440, 96, 0.95, '#d64541');
  // Stalls and goods.
  drawStall(ctx, 40, 240, '#d64541', '#f7ead2');
  drawStall(ctx, 320, 520, '#2f8f9d', '#f7ead2');
  drawFruitCrate(ctx, 58, 254, '#d64541', 5);
  drawFruitCrate(ctx, 138, 254, '#ff8c42', 5);
  drawFruitCrate(ctx, 348, 254, '#6a9e4f', 5);
  ctx.fillStyle = '#8a6d4b';
  ctx.fillRect(452, 252, 40, 26);
  ctx.strokeStyle = '#5d4026';
  ctx.lineWidth = 2;
  ctx.strokeRect(452, 252, 40, 26);
  flower(ctx, 462, 244, 0.8, '#e88bb0', '#ffd76e');
  flower(ctx, 476, 242, 0.9, '#b48ae0', '#ffd76e');
  flower(ctx, 486, 246, 0.7, '#fff6e8', '#e8a83c');
  // Jars on the left counter.
  ctx.fillStyle = '#c9a86a';
  [196, 210, 224].forEach((x) => {
    ctx.fillRect(x, 258, 10, 18);
    ctx.fillStyle = '#8a6d3b';
    ctx.fillRect(x - 1, 254, 12, 4);
    ctx.fillStyle = '#c9a86a';
  });
  // Sign board with a fish (or a flower, when changed).
  ctx.fillStyle = '#5d4026';
  ctx.fillRect(64, 292, 56, 26);
  ctx.strokeStyle = '#3a2a18';
  ctx.lineWidth = 2;
  ctx.strokeRect(64, 292, 56, 26);
  if (mods.has('sign-flower')) {
    flower(ctx, 92, 305, 1, '#e88bb0', '#ffd76e');
  } else {
    fish(ctx, 92, 305, 0.9, '#f7ead2');
  }
  // Cat between the stalls.
  if (!mods.has('cat-gone')) drawCat(ctx, 300, 300);
  // Cobblestone ground.
  ctx.fillStyle = '#2c3350';
  ctx.fillRect(0, 330, W, 90);
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  for (let row = 0; row < 4; row += 1) {
    for (let col = 0; col < 12; col += 1) {
      const cx = col * 48 + (row % 2) * 24 + 8;
      ctx.beginPath();
      ctx.ellipse(cx, 344 + row * 20, 18, 7, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  // --- alterations ---
  if (mods.has('cat-gone')) {
    ctx.fillStyle = '#2c3350';
    ctx.beginPath();
    ctx.arc(300, 300, 26, 0, Math.PI * 2);
    ctx.fill();
  }
  if (mods.has('awning-stripe')) {
    const path = new Path2D();
    path.moveTo(34, 128);
    path.lineTo(246, 128);
    path.lineTo(236, 168);
    path.lineTo(44, 168);
    path.closePath();
    ctx.save();
    ctx.clip(path);
    ctx.fillStyle = '#2f8f9d';
    ctx.fillRect(130, 128, 22, 42);
    ctx.restore();
  }
  if (mods.has('fruit-swap')) {
    drawFruitCrate(ctx, 58, 254, '#ff8c42', 5);
  }
  if (mods.has('star-extra')) sparkle(ctx, 200, 48, 10, '#ffe9a8');
}

// ------------------------------------------------------------------ garden
const GARDEN_SKY = [
  [0, '#d9a7c7'],
  [0.55, '#f2c9a0'],
  [1, '#f7ddae'],
];
const FIREFLIES = scatter(mulberry32(7), 60, 120, 440, 140, 6, 55);
const GARDEN_FLOWERS = scatter(mulberry32(11), 20, 370, 520, 36, 10, 34);

function drawFoxglove(ctx, x, topY, baseY, bellColor) {
  ctx.save();
  ctx.strokeStyle = '#4e7a45';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x, baseY);
  ctx.lineTo(x, topY);
  ctx.stroke();
  ctx.fillStyle = '#5d8a4e';
  ctx.beginPath();
  ctx.ellipse(x - 12, baseY - 14, 12, 5, -0.5, 0, Math.PI * 2);
  ctx.ellipse(x + 12, baseY - 26, 12, 5, 0.5, 0, Math.PI * 2);
  ctx.fill();
  for (let i = 0; i < 5; i += 1) {
    const by = topY + 14 + i * 16;
    const side = i % 2 === 0 ? -1 : 1;
    const bx = x + side * 7;
    ctx.fillStyle = bellColor;
    ctx.beginPath();
    ctx.moveTo(bx, by - 7);
    ctx.quadraticCurveTo(bx - 6, by + 2, bx - 2, by + 10);
    ctx.quadraticCurveTo(bx, by + 13, bx + 2, by + 10);
    ctx.quadraticCurveTo(bx + 6, by + 2, bx, by - 7);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.beginPath();
    ctx.arc(bx, by + 4, 1.6, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawFox(ctx, x, y, whiteTip) {
  ctx.save();
  // Tail, curled to the right, white tip at its end.
  ctx.fillStyle = '#e8722a';
  ctx.beginPath();
  ctx.moveTo(x + 18, y + 18);
  ctx.quadraticCurveTo(x + 52, y + 22, x + 54, y - 2);
  ctx.quadraticCurveTo(x + 54, y - 14, x + 42, y - 12);
  ctx.quadraticCurveTo(x + 38, y + 4, x + 14, y + 2);
  ctx.closePath();
  ctx.fill();
  if (whiteTip) {
    ctx.fillStyle = '#fff6e8';
    ctx.beginPath();
    ctx.arc(x + 46, y - 6, 10, 0, Math.PI * 2);
    ctx.fill();
  }
  // Body and chest.
  ctx.fillStyle = '#e8722a';
  ctx.beginPath();
  ctx.ellipse(x, y + 12, 30, 28, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff6e8';
  ctx.beginPath();
  ctx.ellipse(x - 4, y + 18, 16, 18, 0, 0, Math.PI * 2);
  ctx.fill();
  // Head, ears, muzzle.
  ctx.fillStyle = '#e8722a';
  ctx.beginPath();
  ctx.moveTo(x - 16, y - 14);
  ctx.lineTo(x - 12, y - 32);
  ctx.lineTo(x - 2, y - 18);
  ctx.closePath();
  ctx.moveTo(x + 12, y - 16);
  ctx.lineTo(x + 16, y - 32);
  ctx.lineTo(x + 20, y - 14);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x + 2, y - 12, 19, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff6e8';
  ctx.beginPath();
  ctx.ellipse(x + 2, y - 2, 9, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#2b2b2b';
  ctx.beginPath();
  ctx.arc(x - 4, y - 14, 2.2, 0, Math.PI * 2);
  ctx.arc(x + 9, y - 14, 2.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x + 2, y - 5, 2.6, 0, Math.PI * 2);
  ctx.fill();
  // Paws.
  ctx.fillStyle = '#3a2b22';
  ctx.beginPath();
  ctx.ellipse(x - 12, y + 38, 8, 4, 0, 0, Math.PI * 2);
  ctx.ellipse(x + 8, y + 38, 8, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawNest(ctx, x, y) {
  ctx.save();
  ctx.strokeStyle = '#6b4a2f';
  ctx.lineWidth = 2.5;
  for (let i = -2; i <= 2; i += 1) {
    ctx.beginPath();
    ctx.moveTo(x - 12 + i * 5, y - 2);
    ctx.quadraticCurveTo(x - 10 + i * 5, y + 8, x - 6 + i * 5, y + 10);
    ctx.stroke();
  }
  ctx.fillStyle = '#8a6d4b';
  ctx.beginPath();
  ctx.ellipse(x, y + 4, 14, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#bcd8e8';
  ctx.beginPath();
  ctx.arc(x - 4, y - 1, 4, 0, Math.PI * 2);
  ctx.arc(x + 5, y - 1, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawGarden(ctx, mods, t) {
  sky(ctx, W, H, GARDEN_SKY);
  glowDisc(ctx, 86, 66, 26, '#fff6dd', 'rgba(255, 246, 221, 0.6)');
  // Hills.
  ctx.fillStyle = '#8aa864';
  ctx.beginPath();
  ctx.moveTo(0, 310);
  ctx.quadraticCurveTo(140, 268, 300, 302);
  ctx.quadraticCurveTo(430, 328, 560, 296);
  ctx.lineTo(560, 420);
  ctx.lineTo(0, 420);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#75975a';
  ctx.beginPath();
  ctx.moveTo(0, 340);
  ctx.quadraticCurveTo(200, 306, 380, 336);
  ctx.quadraticCurveTo(480, 352, 560, 330);
  ctx.lineTo(560, 420);
  ctx.lineTo(0, 420);
  ctx.closePath();
  ctx.fill();
  // Tree and nest.
  ctx.save();
  ctx.fillStyle = '#6b4a2f';
  ctx.beginPath();
  ctx.moveTo(474, 310);
  ctx.lineTo(482, 190);
  ctx.lineTo(492, 190);
  ctx.lineTo(498, 310);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#6b4a2f';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(484, 220);
  ctx.lineTo(452, 138);
  ctx.stroke();
  ctx.fillStyle = '#4e7a45';
  [[442, 168, 38], [490, 148, 46], [512, 188, 36], [466, 196, 30]].forEach(([cx, cy, r]) => {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();
  if (!mods.has('nest-gone')) drawNest(ctx, 452, 132);
  // Foxgloves on the left.
  drawFoxglove(ctx, 70, 196, 330, '#8e6cc0');
  drawFoxglove(ctx, 105, 214, 336, '#8e6cc0');
  drawFoxglove(ctx, 140, 206, 332, '#8e6cc0');
  // Fox, mushrooms, pond.
  drawFox(ctx, 280, 296, !mods.has('tail-orange'));
  mushroom(ctx, 100, 350, 1);
  mushroom(ctx, 126, 354, 0.8);
  mushroom(ctx, 148, 352, 0.62);
  ctx.save();
  ctx.fillStyle = '#7fb3c8';
  ctx.beginPath();
  ctx.ellipse(420, 362, 72, 26, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#5d8a4e';
  ctx.beginPath();
  ctx.ellipse(392, 356, 18, 7, 0, 0, Math.PI * 2);
  ctx.ellipse(448, 368, 16, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ripple(ctx, 420, 362, 40, 12, 'rgba(255,255,255,0.4)');
  ctx.restore();
  // Fireflies, twinkling.
  FIREFLIES.forEach((p, i) => {
    if (mods.has('firefly-out') && i === 2) return;
    const tw = 0.4 + 0.6 * (0.5 + 0.5 * sway(t, 2.2, i * 2.1));
    ctx.save();
    ctx.globalAlpha = tw;
    glowDisc(ctx, p.x, p.y, 3.5, '#ffe9a8', 'rgba(255, 233, 168, 0.7)');
    ctx.restore();
  });
  // Butterfly.
  if (!mods.has('butterfly-gone')) butterfly(ctx, 428, 148, 1, '#e88bb0', t * 3);
  // Small flowers along the bottom.
  GARDEN_FLOWERS.forEach((p, i) => {
    flower(ctx, p.x, p.y, 0.8, ['#e88bb0', '#fff6e8', '#b48ae0'][i % 3], '#e8a83c');
  });
  // Foreground grass strip.
  ctx.fillStyle = '#5d8a4e';
  ctx.fillRect(0, 392, W, 28);
  ctx.strokeStyle = '#4e7a45';
  ctx.lineWidth = 2;
  for (let x = 12; x < W; x += 34) {
    ctx.beginPath();
    ctx.moveTo(x, 392);
    ctx.lineTo(x - 4, 382);
    ctx.moveTo(x + 6, 392);
    ctx.lineTo(x + 10, 381);
    ctx.stroke();
  }
  // --- alterations ---
  if (mods.has('tail-orange')) {
    ctx.fillStyle = '#e8722a';
    ctx.beginPath();
    ctx.arc(326, 290, 10, 0, Math.PI * 2);
    ctx.fill();
  }
  if (mods.has('mushroom-plain')) {
    mushroom(ctx, 126, 354, 0.8, '#d64541', false);
  }
  if (mods.has('butterfly-gone')) skyPatch(ctx, 428, 148, 20, GARDEN_SKY);
  if (mods.has('flower-pink')) {
    const bx = 105 + 7;
    const by = 214 + 14 + 2 * 16;
    ctx.fillStyle = '#e88bb0';
    ctx.beginPath();
    ctx.moveTo(bx, by - 7);
    ctx.quadraticCurveTo(bx - 6, by + 2, bx - 2, by + 10);
    ctx.quadraticCurveTo(bx, by + 13, bx + 2, by + 10);
    ctx.quadraticCurveTo(bx + 6, by + 2, bx, by - 7);
    ctx.fill();
  }
  if (mods.has('firefly-out')) skyPatch(ctx, FIREFLIES[2].x, FIREFLIES[2].y, 12, GARDEN_SKY);
  if (mods.has('frog-here')) {
    ctx.save();
    ctx.fillStyle = '#5da24a';
    ctx.beginPath();
    ctx.arc(392, 350, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(386, 342, 5, 0, Math.PI * 2);
    ctx.arc(398, 342, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#20242e';
    ctx.beginPath();
    ctx.arc(386, 341, 2, 0, Math.PI * 2);
    ctx.arc(398, 341, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  if (mods.has('nest-gone')) {
    ctx.fillStyle = '#4e7a45';
    ctx.beginPath();
    ctx.arc(452, 132, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#6b4a2f';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(484, 220);
    ctx.lineTo(452, 138);
    ctx.stroke();
  }
}

// ------------------------------------------------------------------- export
export const SCENES = [
  {
    id: 'harbour',
    name: 'Harbour Dawn',
    tagline: 'A sleepy fishing harbour at first light.',
    timeLimit: 180,
    draw: drawHarbour,
    diffs: [
      { id: 'sun-smile', x: 88, y: 72, r: 26, label: "The sun's smile" },
      { id: 'gull-gone', x: 250, y: 62, r: 20, label: 'A gull flew off' },
      { id: 'stripe-blue', x: 430, y: 180, r: 22, label: 'Blue lighthouse band' },
      { id: 'sail-blue', x: 168, y: 282, r: 26, label: 'A blue sail' },
      { id: 'buoy-gone', x: 485, y: 334, r: 20, label: 'The missing buoy' },
      { id: 'lamp-dark', x: 430, y: 102, r: 20, label: 'A dark lamp' },
      { id: 'fish-gone', x: 120, y: 286, r: 22, label: 'The jumping fish' },
    ],
  },
  {
    id: 'market',
    name: 'Lantern Market',
    tagline: 'Stalls, lanterns and one very smug cat.',
    timeLimit: 150,
    draw: drawMarket,
    diffs: [
      { id: 'lantern-red', x: 330, y: 104, r: 22, label: 'A lantern turned red' },
      { id: 'cat-gone', x: 300, y: 300, r: 24, label: 'The cat slipped away' },
      { id: 'moon-full', x: 472, y: 68, r: 26, label: 'A full moon' },
      { id: 'awning-stripe', x: 141, y: 148, r: 22, label: 'A teal awning stripe' },
      { id: 'fruit-swap', x: 81, y: 250, r: 22, label: 'Oranges, not apples' },
      { id: 'star-extra', x: 200, y: 48, r: 18, label: 'A brand-new star' },
      { id: 'sign-flower', x: 92, y: 305, r: 20, label: 'A flower on the sign' },
    ],
  },
  {
    id: 'garden',
    name: 'Foxglove Garden',
    tagline: 'Dusk, and the fox keeps watch.',
    timeLimit: 120,
    draw: drawGarden,
    diffs: [
      { id: 'tail-orange', x: 326, y: 290, r: 22, label: 'An orange tail tip' },
      { id: 'mushroom-plain', x: 126, y: 348, r: 22, label: 'A spotless mushroom' },
      { id: 'butterfly-gone', x: 428, y: 148, r: 20, label: 'The vanished butterfly' },
      { id: 'flower-pink', x: 112, y: 260, r: 22, label: 'A pink foxglove' },
      { id: 'firefly-out', x: FIREFLIES[2].x, y: FIREFLIES[2].y, r: 18, label: 'A firefly gone out' },
      { id: 'frog-here', x: 392, y: 352, r: 22, label: 'A frog on the lily pad' },
      { id: 'nest-gone', x: 452, y: 132, r: 22, label: 'An empty branch' },
    ],
  },
];

export const SCENE_W = W;
export const SCENE_H = H;
