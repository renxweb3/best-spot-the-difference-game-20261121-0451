// Everything the player sees: the HUD, the two picture panels, the rings
// around found differences, the chips of what you already found, the
// buttons, and the menu / level-clear / victory / game-over screens.
// The game is drawn in a fixed 1280 x 800 logical space; main.js scales
// that onto whatever window it runs in, so screenshots are always the
// same framing. layout() is shared with input.js so clicks land where
// the buttons are drawn.

import { SCENES, SCENE_W, SCENE_H } from './scenes.js';
import { mulberry32 } from './random.js';
import { rr } from './art.js';

export const VIEW_W = 1280;
export const VIEW_H = 800;

const GOLD = '#e8b93c';
const CREAM = '#f2ead8';
const INK = '#0d1526';
const PANEL_LINE = '#d9b36c';
const GOOD = '#7bc47f';
const BAD = '#e06a5a';

const CONFETTI = (() => {
  const rng = mulberry32(99);
  return Array.from({ length: 90 }, () => ({
    x: rng() * VIEW_W,
    y: rng() * VIEW_H,
    s: 4 + rng() * 6,
    c: ['#e8b93c', '#d64541', '#7bc47f', '#7fb3c8', '#e88bb0'][Math.floor(rng() * 5)],
    v: 30 + rng() * 50,
    ph: rng() * Math.PI * 2,
  }));
})();

export function layout() {
  const panelW = 600;
  const panelH = 452;
  const scale = Math.min(panelW / SCENE_W, panelH / SCENE_H);
  const drawW = SCENE_W * scale;
  const drawH = SCENE_H * scale;
  return {
    leftPanel: { x: 20, y: 78, w: panelW, h: panelH },
    rightPanel: { x: 660, y: 78, w: panelW, h: panelH },
    scene: { scale, ox: (panelW - drawW) / 2, oy: (panelH - drawH) / 2 },
    buttons: {
      hint: { x: 20, y: 640, w: 170, h: 46 },
      restart: { x: 202, y: 640, w: 170, h: 46 },
      sound: { x: 384, y: 640, w: 170, h: 46 },
      menu: { x: 566, y: 640, w: 170, h: 46 },
      start: { x: 490, y: 668, w: 300, h: 62 },
      next: { x: 490, y: 560, w: 300, h: 62 },
      retry: { x: 400, y: 560, w: 220, h: 62 },
      again: { x: 400, y: 560, w: 220, h: 62 },
      victoryMenu: { x: 640, y: 560, w: 220, h: 62 },
      overMenu: { x: 640, y: 560, w: 220, h: 62 },
      resume: { x: 490, y: 470, w: 300, h: 62 },
      pauseMenu: { x: 490, y: 550, w: 300, h: 62 },
    },
  };
}

function panelToScene(panel, scene, px, py) {
  return { x: (px - panel.x - scene.ox) / scene.scale, y: (py - panel.y - scene.oy) / scene.scale };
}

function inPanel(panel, x, y) {
  return x >= panel.x && x <= panel.x + panel.w && y >= panel.y && y <= panel.y + panel.h;
}

// Which panel (if any) a logical point is in, and where it lands in the scene.
export function pickPanel(game, x, y) {
  const L = layout();
  for (const key of ['leftPanel', 'rightPanel']) {
    const p = L[key];
    if (inPanel(p, x, y)) return { side: key, ...panelToScene(p, L.scene, x, y) };
  }
  return null;
}

function drawButton(ctx, rect, label, sub, enabled = true, accent = false) {
  ctx.save();
  ctx.globalAlpha = enabled ? 1 : 0.45;
  ctx.fillStyle = accent ? GOLD : '#1d2a44';
  rr(ctx, rect.x, rect.y, rect.w, rect.h, 10);
  ctx.fill();
  ctx.strokeStyle = accent ? '#8a6d1f' : '#3a4a6a';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = accent ? '#241a05' : CREAM;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `600 ${sub ? 17 : 19}px system-ui, sans-serif`;
  ctx.fillText(label, rect.x + rect.w / 2, rect.y + rect.h / 2 - (sub ? 8 : 0));
  if (sub) {
    ctx.fillStyle = accent ? 'rgba(36,26,5,0.7)' : 'rgba(242,234,216,0.6)';
    ctx.font = '12px system-ui, sans-serif';
    ctx.fillText(sub, rect.x + rect.w / 2, rect.y + rect.h / 2 + 13);
  }
  ctx.restore();
}

function drawPanel(ctx, game, panel, mods, t, side) {
  const L = layout();
  ctx.save();
  ctx.fillStyle = '#101c33';
  rr(ctx, panel.x - 4, panel.y - 4, panel.w + 8, panel.h + 8, 12);
  ctx.fill();
  ctx.strokeStyle = PANEL_LINE;
  ctx.lineWidth = 2;
  ctx.stroke();
  // Clip the scene into the panel.
  ctx.beginPath();
  ctx.rect(panel.x, panel.y, panel.w, panel.h);
  ctx.clip();
  ctx.translate(panel.x + L.scene.ox, panel.y + L.scene.oy);
  ctx.scale(L.scene.scale, L.scene.scale);
  game.scene().draw(ctx, mods, t);
  ctx.restore();
  // Tag ribbon.
  ctx.save();
  ctx.fillStyle = 'rgba(13,21,38,0.85)';
  rr(ctx, panel.x + 10, panel.y + 10, side === 'left' ? 132 : 168, 26, 6);
  ctx.fill();
  ctx.fillStyle = CREAM;
  ctx.font = '600 13px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(side === 'left' ? '◀  AS IT WAS' : 'SOMETHING CHANGED  ▶', panel.x + 20, panel.y + 24);
  ctx.restore();
}

function ring(ctx, x, y, r, color, alpha, width = 4) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x, y, r - 7, 0, Math.PI * 2);
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();
}

function drawMarkers(ctx, game, panel) {
  const L = layout();
  const scene = game.scene();
  const toPx = (sx, sy) => ({
    x: panel.x + L.scene.ox + sx * L.scene.scale,
    y: panel.y + L.scene.oy + sy * L.scene.scale,
  });
  scene.diffs.forEach((d) => {
    if (!game.found.has(d.id)) return;
    const p = toPx(d.x, d.y);
    const r = d.r * L.scene.scale + 5;
    ring(ctx, p.x, p.y, r, GOLD, 0.95, 4);
    // Check mark in the ring.
    ctx.save();
    ctx.strokeStyle = GOLD;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(p.x - 8, p.y + 1);
    ctx.lineTo(p.x - 2, p.y + 7);
    ctx.lineTo(p.x + 9, p.y - 6);
    ctx.stroke();
    ctx.restore();
  });
  // Hint: a pulsing dashed ring on both panels.
  if (game.hinted) {
    const p = toPx(game.hinted.x, game.hinted.y);
    const pulse = 1 + 0.12 * Math.sin(game.elapsed * 6);
    ctx.save();
    ctx.setLineDash([8, 6]);
    ring(ctx, p.x, p.y, (game.hinted ? 24 : 24) * L.scene.scale * pulse, '#9fd6ff', 0.9, 3);
    ctx.restore();
  }
  // Wrong-click X marks, fading.
  game.marks
    .filter((m) => m.kind === 'wrong')
    .forEach((m) => {
      const age = game.elapsed - m.at;
      if (age > 0.9) return;
      const p = toPx(m.x, m.y);
      ctx.save();
      ctx.globalAlpha = 1 - age / 0.9;
      ctx.strokeStyle = BAD;
      ctx.lineWidth = 5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(p.x - 9, p.y - 9);
      ctx.lineTo(p.x + 9, p.y + 9);
      ctx.moveTo(p.x + 9, p.y - 9);
      ctx.lineTo(p.x - 9, p.y + 9);
      ctx.stroke();
      ctx.restore();
    });
}

function drawHud(ctx, game) {
  const scene = game.scene();
  ctx.save();
  ctx.fillStyle = '#0a1220';
  ctx.fillRect(0, 0, VIEW_W, 64);
  ctx.fillStyle = GOLD;
  ctx.fillRect(0, 64, VIEW_W, 2);
  // Title.
  ctx.fillStyle = CREAM;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.font = '700 24px Georgia, serif';
  ctx.fillText('Twin Tides', 24, 26);
  ctx.fillStyle = 'rgba(242,234,216,0.6)';
  ctx.font = '12px system-ui, sans-serif';
  ctx.fillText('spot the difference', 24, 48);
  // Level + counter, centred.
  ctx.textAlign = 'center';
  ctx.fillStyle = CREAM;
  ctx.font = '600 17px system-ui, sans-serif';
  ctx.fillText(`${scene.name}  ·  Scene ${game.levelIndex + 1} of ${SCENES.length}`, VIEW_W / 2, 22);
  const found = game.found.size;
  const total = scene.diffs.length;
  ctx.font = '700 26px system-ui, sans-serif';
  ctx.fillStyle = found === total ? GOOD : GOLD;
  ctx.fillText(`${found} / ${total} found`, VIEW_W / 2, 48);
  // Score, right.
  ctx.textAlign = 'right';
  ctx.fillStyle = CREAM;
  ctx.font = '600 15px system-ui, sans-serif';
  ctx.fillText('SCORE', 1080, 20);
  ctx.font = '700 26px system-ui, sans-serif';
  ctx.fillText(String(game.score), 1080, 46);
  // Timer bar.
  const tLeft = Math.max(0, game.timeLeft);
  const frac = tLeft / scene.timeLimit;
  const bx = 1110;
  const bw = 130;
  ctx.fillStyle = '#1d2a44';
  rr(ctx, bx, 18, bw, 12, 6);
  ctx.fill();
  ctx.fillStyle = frac < 0.2 ? BAD : frac < 0.45 ? '#e8a83c' : GOOD;
  if (frac > 0) {
    rr(ctx, bx, 18, Math.max(12, bw * frac), 12, 6);
    ctx.fill();
  }
  ctx.fillStyle = CREAM;
  ctx.font = '700 18px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`${Math.ceil(tLeft)}s`, bx, 42);
  // Strikes.
  ctx.textAlign = 'left';
  ctx.font = '600 13px system-ui, sans-serif';
  ctx.fillStyle = 'rgba(242,234,216,0.75)';
  ctx.fillText('misses', bx, 60);
  for (let i = 0; i < 3; i += 1) {
    ctx.fillStyle = i < game.strikes ? BAD : 'rgba(242,234,216,0.25)';
    ctx.beginPath();
    ctx.arc(bx + 52 + i * 18, 60, 6, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawChips(ctx, game) {
  const scene = game.scene();
  ctx.save();
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.font = '600 13px system-ui, sans-serif';
  ctx.fillStyle = 'rgba(242,234,216,0.6)';
  ctx.fillText('FOUND:', 24, 566);
  let x = 96;
  scene.diffs.forEach((d) => {
    if (!game.found.has(d.id)) return;
    const w = ctx.measureText(d.label).width + 30;
    if (x + w > VIEW_W - 24) return;
    ctx.fillStyle = 'rgba(232,185,60,0.16)';
    rr(ctx, x, 550, w, 30, 15);
    ctx.fill();
    ctx.strokeStyle = 'rgba(232,185,60,0.6)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = GOLD;
    ctx.fillText(`✓ ${d.label}`, x + 15, 566);
    x += w + 8;
  });
  if (game.found.size === 0) {
    ctx.fillStyle = 'rgba(242,234,216,0.4)';
    ctx.fillText('nothing yet — look closely, the pictures are almost the same…', 96, 566);
  }
  ctx.restore();
}

function drawMessage(ctx, game) {
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const live = game.elapsed < game.messageUntil && game.message;
  ctx.font = '600 17px system-ui, sans-serif';
  ctx.fillStyle =
    game.messageKind === 'good' ? GOOD : game.messageKind === 'bad' ? BAD : 'rgba(242,234,216,0.85)';
  ctx.fillText(live ? game.message : 'Click a difference in either picture — the other one hides it too.', VIEW_W / 2, 614);
  ctx.restore();
}

function drawBottomBar(ctx, game) {
  const L = layout();
  drawButton(ctx, L.buttons.hint, `Hint  (H)`, `${game.hintsLeft} left · −50 pts`, game.hintsLeft > 0);
  drawButton(ctx, L.buttons.restart, 'Restart scene  (R)');
  drawButton(ctx, L.buttons.sound, game.sound.muted ? 'Sound: off  (M)' : 'Sound: on  (M)');
  drawButton(ctx, L.buttons.menu, 'Menu');
  // Level dots + accuracy.
  ctx.save();
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.font = '600 14px system-ui, sans-serif';
  ctx.fillStyle = 'rgba(242,234,216,0.75)';
  ctx.fillText('Scenes:', 790, 663);
  SCENES.forEach((s, i) => {
    const cx = 872 + i * 30;
    ctx.fillStyle = i < game.levelIndex ? GOOD : i === game.levelIndex ? GOLD : 'rgba(242,234,216,0.25)';
    ctx.beginPath();
    ctx.arc(cx, 663, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = INK;
    ctx.font = '700 11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(String(i + 1), cx, 664);
  });
  ctx.textAlign = 'left';
  ctx.fillStyle = 'rgba(242,234,216,0.75)';
  ctx.font = '600 14px system-ui, sans-serif';
  ctx.fillText(`Accuracy ${game.accuracy()}%  ·  ${game.foundTotal()} of ${game.totalDiffs()} differences found in all`, 790, 690);
  ctx.restore();
  // Footer keys.
  ctx.save();
  ctx.textAlign = 'center';
  ctx.font = '12px system-ui, sans-serif';
  ctx.fillStyle = 'rgba(242,234,216,0.45)';
  ctx.fillText('Mouse: click a difference  ·  H hint  ·  R restart scene  ·  P pause  ·  M sound', VIEW_W / 2, 748);
  ctx.restore();
}

function overlay(ctx, alpha = 0.72) {
  ctx.save();
  ctx.fillStyle = `rgba(10, 16, 30, ${alpha})`;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.restore();
}

function panelCard(ctx, x, y, w, h) {
  ctx.save();
  ctx.fillStyle = '#14203a';
  rr(ctx, x, y, w, h, 16);
  ctx.fill();
  ctx.strokeStyle = PANEL_LINE;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
}

function drawMenu(ctx, game, t) {
  const L = layout();
  ctx.save();
  ctx.fillStyle = '#0d1526';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  // A strip of the first scene, dimmed, as a backdrop.
  ctx.save();
  ctx.globalAlpha = 0.28;
  ctx.translate(0, -40);
  ctx.scale(VIEW_W / SCENE_W, VIEW_W / SCENE_W);
  SCENES[0].draw(ctx, new Set(), t);
  ctx.restore();
  ctx.fillStyle = 'rgba(13,21,38,0.55)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.textAlign = 'center';
  ctx.fillStyle = GOLD;
  ctx.font = '700 64px Georgia, serif';
  ctx.fillText('TWIN TIDES', VIEW_W / 2, 108);
  ctx.fillStyle = CREAM;
  ctx.font = 'italic 24px Georgia, serif';
  ctx.fillText('a spot-the-difference hunt in three little worlds', VIEW_W / 2, 148);
  ctx.font = '16px system-ui, sans-serif';
  ctx.fillStyle = 'rgba(242,234,216,0.85)';
  ctx.fillText('Two pictures sit side by side. They look the same — they are not.', VIEW_W / 2, 196);
  ctx.fillText('Click every difference you can spot, in either picture, before the tide runs out.', VIEW_W / 2, 222);
  // Three scene cards with live mini-previews.
  SCENES.forEach((s, i) => {
    const cx = 170 + i * 320;
    const cy = 262;
    panelCard(ctx, cx, cy, 290, 240);
    ctx.save();
    ctx.beginPath();
    ctx.rect(cx + 12, cy + 12, 266, 132);
    ctx.clip();
    ctx.translate(cx + 12, cy + 12);
    ctx.scale(266 / SCENE_W, 132 / SCENE_H);
    s.draw(ctx, new Set(), 1.5);
    ctx.restore();
    ctx.textAlign = 'center';
    ctx.fillStyle = CREAM;
    ctx.font = '700 19px Georgia, serif';
    ctx.fillText(s.name, cx + 145, cy + 172);
    ctx.fillStyle = 'rgba(242,234,216,0.75)';
    ctx.font = '13px system-ui, sans-serif';
    ctx.fillText(s.tagline, cx + 145, cy + 196);
    ctx.fillStyle = GOLD;
    ctx.font = '600 13px system-ui, sans-serif';
    ctx.fillText(`${s.diffs.length} differences  ·  ${s.timeLimit}s on the clock`, cx + 145, cy + 220);
  });
  drawButton(ctx, L.buttons.start, 'START THE HUNT', 'or press Enter', true, true);
  ctx.fillStyle = 'rgba(242,234,216,0.55)';
  ctx.font = '13px system-ui, sans-serif';
  ctx.fillText('21 differences in all  ·  3 wrong clicks in one scene ends the hunt  ·  hints cost 50 points', VIEW_W / 2, 762);
  ctx.restore();
}

function drawLevelClear(ctx, game) {
  const L = layout();
  overlay(ctx);
  panelCard(ctx, 340, 180, 600, 380);
  const scene = game.scene();
  ctx.save();
  ctx.textAlign = 'center';
  ctx.fillStyle = GOOD;
  ctx.font = '700 44px Georgia, serif';
  ctx.fillText('Scene complete!', VIEW_W / 2, 258);
  ctx.fillStyle = CREAM;
  ctx.font = '18px system-ui, sans-serif';
  ctx.fillText(`You found all ${scene.diffs.length} differences in ${scene.name}.`, VIEW_W / 2, 306);
  ctx.fillStyle = GOLD;
  ctx.font = '700 30px system-ui, sans-serif';
  ctx.fillText(`Score: ${game.score}`, VIEW_W / 2, 356);
  ctx.fillStyle = 'rgba(242,234,216,0.8)';
  ctx.font = '16px system-ui, sans-serif';
  ctx.fillText(
    `Next up: ${SCENES[game.levelIndex + 1].name} — ${SCENES[game.levelIndex + 1].diffs.length} differences, ${SCENES[game.levelIndex + 1].timeLimit}s.`,
    VIEW_W / 2, 396,
  );
  ctx.fillText('It hides its changes better than this one did.', VIEW_W / 2, 424);
  ctx.restore();
  drawButton(ctx, L.buttons.next, 'NEXT SCENE', 'or press Enter', true, true);
}

function drawVictory(ctx, game, t) {
  overlay(ctx, 0.6);
  CONFETTI.forEach((c) => {
    const y = (c.y + t * c.v) % VIEW_H;
    const x = c.x + Math.sin(t + c.ph) * 18;
    ctx.save();
    ctx.fillStyle = c.c;
    ctx.fillRect(x, y, c.s, c.s * 0.6);
    ctx.restore();
  });
  panelCard(ctx, 300, 150, 680, 420);
  ctx.save();
  ctx.textAlign = 'center';
  ctx.fillStyle = GOLD;
  ctx.font = '700 52px Georgia, serif';
  ctx.fillText('YOU FOUND THEM ALL!', VIEW_W / 2, 240);
  ctx.fillStyle = CREAM;
  ctx.font = '19px system-ui, sans-serif';
  ctx.fillText('Every difference in all three worlds — harbour, market and garden.', VIEW_W / 2, 286);
  ctx.fillStyle = GOLD;
  ctx.font = '700 34px system-ui, sans-serif';
  ctx.fillText(`Final score: ${game.score}`, VIEW_W / 2, 340);
  ctx.fillStyle = 'rgba(242,234,216,0.85)';
  ctx.font = '17px system-ui, sans-serif';
  const mins = Math.floor(game.totalTime() / 60);
  const secs = game.totalTime() % 60;
  ctx.fillText(
    `${game.totalDiffs()} differences  ·  ${game.accuracy()}% accuracy  ·  ${mins}:${String(secs).padStart(2, '0')} on the hunt`,
    VIEW_W / 2,
    382,
  );
  ctx.fillText('The tide is yours, sharp-eyes.', VIEW_W / 2, 414);
  ctx.restore();
  const L = layout();
  drawButton(ctx, L.buttons.again, 'PLAY AGAIN', 'or press Enter', true, true);
  drawButton(ctx, L.buttons.victoryMenu, 'MENU');
}

function drawGameOver(ctx, game) {
  const L = layout();
  overlay(ctx);
  panelCard(ctx, 340, 180, 600, 380);
  ctx.save();
  ctx.textAlign = 'center';
  ctx.fillStyle = BAD;
  ctx.font = '700 44px Georgia, serif';
  ctx.fillText('The trail went cold', VIEW_W / 2, 258);
  ctx.fillStyle = CREAM;
  ctx.font = '18px system-ui, sans-serif';
  const reason =
    game.overReason === 'time-up'
      ? `The clock ran out in ${game.scene().name} with ${game.scene().diffs.length - game.found.size} differences still hiding.`
      : `Three wrong clicks in ${game.scene().name} — the differences slipped away.`;
  ctx.fillText(reason, VIEW_W / 2, 306);
  ctx.fillStyle = GOLD;
  ctx.font = '700 28px system-ui, sans-serif';
  ctx.fillText(`Score: ${game.score}  ·  ${game.foundTotal()} of ${game.totalDiffs()} found`, VIEW_W / 2, 356);
  ctx.fillStyle = 'rgba(242,234,216,0.8)';
  ctx.font = '16px system-ui, sans-serif';
  ctx.fillText('The pictures have not changed. Your eyes have. Try again.', VIEW_W / 2, 396);
  ctx.restore();
  drawButton(ctx, L.buttons.retry, 'TRY AGAIN', 'or press Enter', true, true);
  drawButton(ctx, L.buttons.overMenu, 'MENU');
}

function drawPaused(ctx, game) {
  const L = layout();
  overlay(ctx, 0.6);
  panelCard(ctx, 390, 260, 500, 300);
  ctx.save();
  ctx.textAlign = 'center';
  ctx.fillStyle = CREAM;
  ctx.font = '700 40px Georgia, serif';
  ctx.fillText('Paused', VIEW_W / 2, 340);
  ctx.fillStyle = 'rgba(242,234,216,0.8)';
  ctx.font = '16px system-ui, sans-serif';
  ctx.fillText('The differences are waiting exactly where you left them.', VIEW_W / 2, 382);
  ctx.restore();
  drawButton(ctx, L.buttons.resume, 'RESUME', 'or press P', true, true);
  drawButton(ctx, L.buttons.pauseMenu, 'MENU');
}

export function draw(game, ctx, t) {
  ctx.clearRect(0, 0, VIEW_W, VIEW_H);
  ctx.fillStyle = INK;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  if (game.screen === 'menu') {
    drawMenu(ctx, game, t);
    return;
  }
  drawHud(ctx, game);
  const L = layout();
  const allMods = new Set(game.scene().diffs.map((d) => d.id));
  drawPanel(ctx, game, L.leftPanel, new Set(), t, 'left');
  drawPanel(ctx, game, L.rightPanel, allMods, t, 'right');
  drawMarkers(ctx, game, L.leftPanel);
  drawMarkers(ctx, game, L.rightPanel);
  drawChips(ctx, game);
  drawMessage(ctx, game);
  drawBottomBar(ctx, game);
  if (game.screen === 'levelClear') drawLevelClear(ctx, game);
  else if (game.screen === 'victory') drawVictory(ctx, game, t);
  else if (game.screen === 'gameover') drawGameOver(ctx, game);
  else if (game.screen === 'paused') drawPaused(ctx, game);
}
