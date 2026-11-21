// Screenshot poses: `?shot=start|play|win|over` puts the game into a fixed,
// photogenic state so the screenshots are real renders of the game's own
// code in a state a player can actually reach. `?t=` freezes the animation
// clock, so a shot never flickers between runs.

export function applyShot(game, params) {
  const shot = params.get('shot');
  if (!shot || shot === 'start') return;

  if (shot === 'play') {
    // Mid-hunt in Harbour Dawn: three found (ringed in gold on both
    // pictures), four still hiding, the counter reading 3 / 7.
    game.startLevel(0);
    const scene = game.scene();
    scene.diffs.slice(0, 3).forEach((d) => {
      game.found.add(d.id);
      game.marks.push({ kind: 'found', x: d.x, y: d.y, at: 0 });
    });
    game.score = 300;
    game.clicks = 4;
    game.hits = 3;
    game.timeLeft = 132;
    game.say('Found it — Blue lighthouse band! 4 to go.', 'good', 9999);
    return;
  }

  if (shot === 'win') {
    // The victory screen after all three scenes.
    game.startLevel(2);
    game.scene().diffs.forEach((d) => game.found.add(d.id));
    game.levelScores = [7, 7];
    game.score = 2450;
    game.clicks = 26;
    game.hits = 21;
    game.startedAt = game.elapsed - 452;
    game.screen = 'victory';
    game.sound.victory();
    return;
  }

  if (shot === 'over') {
    // The game-over screen: the clock ran out in Lantern Market.
    game.startLevel(1);
    game.scene().diffs.slice(0, 2).forEach((d) => {
      game.found.add(d.id);
      game.marks.push({ kind: 'found', x: d.x, y: d.y, at: 0 });
    });
    game.score = 640;
    game.clicks = 9;
    game.hits = 5;
    game.strikes = 2;
    game.timeLeft = 0;
    game.overReason = 'time-up';
    game.screen = 'gameover';
    return;
  }
}
