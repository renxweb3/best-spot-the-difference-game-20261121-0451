// Pointer and keyboard input. Mouse clicks are mapped from the page into
// the game's fixed 1280 x 800 space, then routed by screen: a click on a
// picture hunts for a difference, a click on a button presses it. The
// keyboard mirrors the same actions (H hint, R restart, P pause, M sound,
// Enter to start / continue), so the game is fully playable either way.

import { layout, pickPanel } from './render.js';

function inRect(x, y, r) {
  return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
}

export function attachInput(canvas, game) {
  const toLogical = (clientX, clientY) => {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((clientX - rect.left) / rect.width) * 1280,
      y: ((clientY - rect.top) / rect.height) * 800,
    };
  };

  canvas.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    const { x, y } = toLogical(event.clientX, event.clientY);
    const B = layout().buttons;
    const screen = game.screen;

    if (screen === 'menu') {
      if (inRect(x, y, B.start)) game.startGame();
      return;
    }
    if (screen === 'paused') {
      if (inRect(x, y, B.resume)) game.togglePause();
      else if (inRect(x, y, B.pauseMenu)) game.toMenu();
      return;
    }
    if (screen === 'levelClear') {
      if (inRect(x, y, B.next)) game.nextLevel();
      return;
    }
    if (screen === 'victory') {
      if (inRect(x, y, B.again)) game.startGame();
      else if (inRect(x, y, B.victoryMenu)) game.toMenu();
      return;
    }
    if (screen === 'gameover') {
      if (inRect(x, y, B.retry)) game.restartLevel();
      else if (inRect(x, y, B.overMenu)) game.toMenu();
      return;
    }

    // Playing: HUD buttons first, then the pictures.
    if (inRect(x, y, B.hint)) {
      game.useHint();
      return;
    }
    if (inRect(x, y, B.restart)) {
      game.restartLevel();
      return;
    }
    if (inRect(x, y, B.sound)) {
      game.sound.toggleMute();
      game.say(game.sound.muted ? 'Sound off.' : 'Sound on.', 'info', 1.5);
      return;
    }
    if (inRect(x, y, B.menu)) {
      game.toMenu();
      return;
    }
    const hit = pickPanel(game, x, y);
    if (hit) game.clickScene(hit.x, hit.y);
  });

  window.addEventListener('keydown', (event) => {
    if (event.repeat) return;
    const key = event.key.toLowerCase();
    const screen = game.screen;
    if (key === 'enter' || key === ' ') {
      event.preventDefault();
      if (screen === 'menu') game.startGame();
      else if (screen === 'levelClear') game.nextLevel();
      else if (screen === 'victory') game.startGame();
      else if (screen === 'gameover') game.restartLevel();
      else if (screen === 'paused') game.togglePause();
      return;
    }
    if (key === 'h') game.useHint();
    else if (key === 'r' && (screen === 'playing' || screen === 'paused')) game.restartLevel();
    else if (key === 'm') {
      game.sound.toggleMute();
      game.say(game.sound.muted ? 'Sound off.' : 'Sound on.', 'info', 1.5);
    } else if (key === 'p' || key === 'escape') game.togglePause();
  });
}
