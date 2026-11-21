// Seeded random numbers, so a scene renders the same way every time for a
// given seed. Screenshots and replays stay identical; gameplay still feels
// alive because the seed only places decoration, never the differences.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Pick `count` scattered points inside a rectangle, spread apart so nothing
// piles up in one corner. Used for stars, fireflies and pebbles.
export function scatter(rng, x, y, w, h, count, minGap) {
  const points = [];
  let guard = 0;
  while (points.length < count && guard < count * 40) {
    guard += 1;
    const px = x + rng() * w;
    const py = y + rng() * h;
    if (points.every((p) => (p.x - px) ** 2 + (p.y - py) ** 2 > minGap * minGap)) {
      points.push({ x: px, y: py });
    }
  }
  return points;
}

// A value that wobbles gently between -1 and 1, for bobbing boats and
// twinkling stars. Deterministic in time, so screenshots never flicker.
export function sway(t, speed, phase) {
  return Math.sin(t * speed + phase);
}
