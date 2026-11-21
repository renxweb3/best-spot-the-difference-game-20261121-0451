// The rules of Twin Tides: screens, scoring, the clock, hints and strikes.
// This file knows nothing about pixels — render.js draws whatever state it
// finds here, and input.js only calls the small public methods below.

import { SCENES } from './scenes.js';

export const SCREENS = ['menu', 'playing', 'paused', 'levelClear', 'victory', 'gameover'];

const FIND_POINTS = 100;
const WRONG_SECONDS = 5;
const WRONG_POINTS = 25;
const HINT_COST = 50;
const MAX_STRIKES = 3;
const HINTS_PER_LEVEL = 3;

export function createGame(sound) {
  const game = {
    screen: 'menu',
    levelIndex: 0,
    found: new Set(),
    hinted: null, // {x, y, until} — the difference a hint is pointing at
    strikes: 0,
    score: 0,
    timeLeft: 0,
    hintsLeft: HINTS_PER_LEVEL,
    message: '',
    messageKind: 'info',
    messageUntil: 0,
    levelScores: [],
    clicks: 0,
    hits: 0,
    startedAt: 0,
    elapsed: 0,
    // A wrong click leaves a red X that fades; a found one leaves a ring.
    marks: [],
    sound,
  };

  game.scene = () => SCENES[game.levelIndex];
  game.totalDiffs = () => SCENES.reduce((n, s) => n + s.diffs.length, 0);
  game.foundTotal = () =>
    game.levelScores.reduce((n, s) => n + s, 0) + game.found.size;

  function say(text, kind = 'info', seconds = 2.6) {
    game.message = text;
    game.messageKind = kind;
    game.messageUntil = game.elapsed + seconds;
  }

  game.startGame = () => {
    game.score = 0;
    game.levelScores = [];
    game.clicks = 0;
    game.hits = 0;
    game.startedAt = game.elapsed;
    game.startLevel(0);
    sound.click();
  };

  game.startLevel = (i) => {
    game.levelIndex = i;
    game.found = new Set();
    game.hinted = null;
    game.strikes = 0;
    game.marks = [];
    game.hintsLeft = HINTS_PER_LEVEL;
    game.timeLeft = game.scene().timeLimit;
    game.screen = 'playing';
    say(`${game.scene().name} — find all ${game.scene().diffs.length} differences!`, 'info', 3.2);
  };

  game.restartLevel = () => {
    game.startLevel(game.levelIndex);
    sound.click();
  };

  game.toMenu = () => {
    game.screen = 'menu';
    game.found = new Set();
    game.marks = [];
    game.hinted = null;
    sound.click();
  };

  game.togglePause = () => {
    if (game.screen === 'playing') {
      game.screen = 'paused';
      sound.click();
    } else if (game.screen === 'paused') {
      game.screen = 'playing';
      sound.click();
    }
  };

  // A click inside a panel, in scene coordinates (0..560, 0..420).
  // Returns 'found' | 'already' | 'wrong' | 'none'.
  game.clickScene = (sx, sy) => {
    if (game.screen !== 'playing') return 'none';
    game.clicks += 1;
    const scene = game.scene();
    const already = scene.diffs.find(
      (d) => game.found.has(d.id) && (d.x - sx) ** 2 + (d.y - sy) ** 2 <= d.r * d.r,
    );
    if (already) {
      // Clicking a difference you already found is not a miss — you found
      // it before, the ring is right there. Just a gentle reminder.
      say(`Already found — ${already.label}. Look for the ones still hiding.`, 'info', 1.8);
      return 'already';
    }
    const hit = scene.diffs.find(
      (d) => !game.found.has(d.id) && (d.x - sx) ** 2 + (d.y - sy) ** 2 <= d.r * d.r,
    );
    if (hit) {
      game.found.add(hit.id);
      game.hits += 1;
      game.score += FIND_POINTS;
      game.marks.push({ kind: 'found', x: hit.x, y: hit.y, at: game.elapsed });
      if (game.hinted && game.hinted.id === hit.id) game.hinted = null;
      sound.found();
      const left = scene.diffs.length - game.found.size;
      if (left === 0) {
        const timeBonus = Math.round(game.timeLeft) * 2;
        game.score += timeBonus;
        game.levelScores.push(scene.diffs.length);
        say(`All found! Time bonus +${timeBonus}.`, 'good', 2.2);
        if (game.levelIndex + 1 < SCENES.length) {
          game.screen = 'levelClear';
          sound.levelWin();
        } else {
          game.screen = 'victory';
          sound.victory();
        }
      } else {
        say(`Found it — ${hit.label}! ${left} to go.`, 'good');
      }
      return 'found';
    }
    // Wrong spot: a strike, a time penalty and a fading red X.
    game.strikes += 1;
    game.timeLeft = Math.max(0, game.timeLeft - WRONG_SECONDS);
    game.score = Math.max(0, game.score - WRONG_POINTS);
    game.marks.push({ kind: 'wrong', x: sx, y: sy, at: game.elapsed });
    sound.wrong();
    if (game.strikes >= MAX_STRIKES) {
      game.screen = 'gameover';
      game.overReason = 'too-many-misses';
      sound.gameOver();
      say('Three misses in one scene — the trail went cold.', 'bad', 3);
    } else {
      say(`Not a difference — that's ${MAX_STRIKES - game.strikes} miss${MAX_STRIKES - game.strikes === 1 ? '' : 'es'} left. −${WRONG_SECONDS}s.`, 'bad');
    }
    return 'wrong';
  };

  // A hint rings one difference you have not found yet, for a few seconds.
  game.useHint = () => {
    if (game.screen !== 'playing') return false;
    if (game.hintsLeft <= 0) {
      say('No hints left in this scene.', 'bad');
      return false;
    }
    const scene = game.scene();
    const remaining = scene.diffs.filter((d) => !game.found.has(d.id));
    if (remaining.length === 0) return false;
    const pick = remaining[Math.floor(Math.random() * remaining.length)];
    game.hintsLeft -= 1;
    game.score = Math.max(0, game.score - HINT_COST);
    game.hinted = { id: pick.id, x: pick.x, y: pick.y, until: game.elapsed + 3 };
    sound.hint();
    say(`Hint: look near “${pick.label}”… (−${HINT_COST} pts)`, 'info', 3);
    return true;
  };

  game.nextLevel = () => {
    if (game.screen === 'levelClear') game.startLevel(game.levelIndex + 1);
  };

  game.accuracy = () => (game.clicks === 0 ? 100 : Math.round((game.hits / game.clicks) * 100));

  game.totalTime = () => Math.round(game.elapsed - game.startedAt);

  // Called every animation frame with the seconds since the last one.
  game.tick = (dt) => {
    game.elapsed += dt;
    if (game.screen === 'playing') {
      game.timeLeft -= dt;
      if (game.hinted && game.elapsed > game.hinted.until) game.hinted = null;
      if (game.timeLeft <= 0) {
        game.timeLeft = 0;
        game.screen = 'gameover';
        game.overReason = 'time-up';
        sound.gameOver();
      }
    }
    // Old marks fade out after a while.
    if (game.marks.length > 40) game.marks = game.marks.slice(-40);
  };

  game.overReason = null;
  game.say = say;
  return game;
}
