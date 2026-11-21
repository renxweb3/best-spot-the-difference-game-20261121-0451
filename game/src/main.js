// Bootstrap: size the canvas, build the game, run the frame loop.
// The canvas always renders the same 1280 x 800 logical picture and is
// scaled by CSS to fit the window, so the game looks identical at any
// window size and the screenshots are always framed the same way.

import { SoundBank } from './audio.js';
import { createGame } from './engine.js';
import { attachInput } from './input.js';
import { draw, VIEW_W, VIEW_H } from './render.js';
import { applyShot } from './shots.js';

const canvas = document.getElementById('game');
const statusLine = document.getElementById('status');
const ctx = canvas.getContext('2d');

const dpr = Math.min(window.devicePixelRatio || 1, 2);
canvas.width = VIEW_W * dpr;
canvas.height = VIEW_H * dpr;

function fit() {
  const scale = Math.min(window.innerWidth / VIEW_W, window.innerHeight / VIEW_H);
  canvas.style.width = `${Math.floor(VIEW_W * scale)}px`;
  canvas.style.height = `${Math.floor(VIEW_H * scale)}px`;
}
window.addEventListener('resize', fit);
fit();

const params = new URLSearchParams(window.location.search);
const frozenT = params.has('t') ? Number(params.get('t')) : null;

const sound = new SoundBank();
const game = createGame(sound);
attachInput(canvas, game);
applyShot(game, params);

// A handle for automated play-testing: the test script reads the state,
// clicks through the pictures and checks the game can be won and lost.
window.__spot = { game, VIEW_W, VIEW_H };

let last = performance.now();
let lastStatus = '';
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  const t = frozenT ?? now / 1000;
  game.tick(dt);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  draw(game, ctx, t);
  const status = `${game.screen}: ${game.scene().name}, ${game.found.size} of ${game.scene().diffs.length} found, score ${game.score}. ${game.message}`;
  if (status !== lastStatus) {
    lastStatus = status;
    statusLine.textContent = status;
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
