// Shared drawing helpers: the small shapes every scene reuses, so each scene
// file stays about its own place instead of re-drawing clouds and birds.
// All helpers draw in the scene's own 560 x 420 coordinate space.

export function rr(ctx, x, y, w, h, r) {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}

export function sky(ctx, w, h, stops) {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  stops.forEach(([at, color]) => g.addColorStop(at, color));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

// A soft glowing disc: halo first, then the solid disc.
export function glowDisc(ctx, x, y, r, core, halo) {
  const g = ctx.createRadialGradient(x, y, r * 0.2, x, y, r * 2.1);
  g.addColorStop(0, halo);
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r * 2.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = core;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

export function cloud(ctx, x, y, s, alpha = 0.9) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = '#ffffff';
  const puff = (cx, cy, r) => {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
  };
  puff(x, y, 16 * s);
  puff(x + 16 * s, y - 8 * s, 20 * s);
  puff(x + 36 * s, y, 17 * s);
  puff(x + 18 * s, y + 6 * s, 18 * s);
  ctx.restore();
}

// A gull: two shallow arcs, like a wide "m" with no middle.
export function gull(ctx, x, y, s, color = '#2b3442') {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.2 * s;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x - 11 * s, y);
  ctx.quadraticCurveTo(x - 5 * s, y - 7 * s, x, y);
  ctx.quadraticCurveTo(x + 5 * s, y - 7 * s, x + 11 * s, y);
  ctx.stroke();
  ctx.restore();
}

// Four-point sparkle, for stars and glints.
export function sparkle(ctx, x, y, r, color = '#fff8d6') {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.quadraticCurveTo(x, y, x, y + r);
  ctx.quadraticCurveTo(x, y, x - r, y);
  ctx.quadraticCurveTo(x, y, x, y - r);
  ctx.fill();
  ctx.restore();
}

export function flower(ctx, x, y, s, petal, center) {
  ctx.save();
  ctx.fillStyle = petal;
  for (let i = 0; i < 5; i += 1) {
    const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
    ctx.beginPath();
    ctx.ellipse(x + Math.cos(a) * 6 * s, y + Math.sin(a) * 6 * s, 5 * s, 5 * s, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = center;
  ctx.beginPath();
  ctx.arc(x, y, 4.5 * s, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function mushroom(ctx, x, y, s, cap = '#d64541', withSpots = true) {
  ctx.save();
  // Stem.
  ctx.fillStyle = '#f7ead2';
  rr(ctx, x - 5 * s, y - 4 * s, 10 * s, 16 * s, 4 * s);
  ctx.fill();
  // Cap.
  ctx.fillStyle = cap;
  ctx.beginPath();
  ctx.moveTo(x - 17 * s, y - 2 * s);
  ctx.quadraticCurveTo(x - 15 * s, y - 20 * s, x, y - 20 * s);
  ctx.quadraticCurveTo(x + 15 * s, y - 20 * s, x + 17 * s, y - 2 * s);
  ctx.quadraticCurveTo(x, y + 3 * s, x - 17 * s, y - 2 * s);
  ctx.fill();
  if (withSpots) {
    ctx.fillStyle = '#fff6e8';
    const spots = [
      [-8, -12, 2.6],
      [1, -15, 3],
      [8, -10, 2.2],
      [-2, -8, 2],
    ];
    spots.forEach(([dx, dy, r]) => {
      ctx.beginPath();
      ctx.arc(x + dx * s, y + dy * s, r * s, 0, Math.PI * 2);
      ctx.fill();
    });
  }
  ctx.restore();
}

// A paper lantern with a glow, hanging from a point above it.
export function lantern(ctx, x, y, s, color, lit = true) {
  ctx.save();
  ctx.strokeStyle = '#6b4a2f';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x, y - 26 * s);
  ctx.lineTo(x, y - 12 * s);
  ctx.stroke();
  if (lit) {
    const g = ctx.createRadialGradient(x, y, 2, x, y, 30 * s);
    g.addColorStop(0, 'rgba(255, 214, 120, 0.55)');
    g.addColorStop(1, 'rgba(255, 214, 120, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, 30 * s, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(x, y, 13 * s, 15 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.25)';
  ctx.lineWidth = 1;
  for (let i = -1; i <= 1; i += 1) {
    ctx.beginPath();
    ctx.ellipse(x, y + i * 5 * s, 13 * s * Math.cos(0.35 * i), 15 * s, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.fillStyle = '#8a6d3b';
  ctx.fillRect(x - 5 * s, y - 18 * s, 10 * s, 3 * s);
  ctx.fillRect(x - 5 * s, y + 15 * s, 10 * s, 3 * s);
  ctx.restore();
}

export function butterfly(ctx, x, y, s, wing = '#e88bb0', flap = 0) {
  ctx.save();
  ctx.translate(x, y);
  const pinch = 0.55 + 0.45 * Math.abs(Math.sin(flap));
  ctx.fillStyle = wing;
  ctx.beginPath();
  ctx.ellipse(-7 * s * pinch, -4 * s, 8 * s * pinch, 10 * s, -0.4, 0, Math.PI * 2);
  ctx.ellipse(7 * s * pinch, -4 * s, 8 * s * pinch, 10 * s, 0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#f6c9da';
  ctx.beginPath();
  ctx.ellipse(-6 * s * pinch, 6 * s, 6 * s * pinch, 7 * s, 0.3, 0, Math.PI * 2);
  ctx.ellipse(6 * s * pinch, 6 * s, 6 * s * pinch, 7 * s, -0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#3a2b33';
  ctx.lineWidth = 2.4 * s;
  ctx.beginPath();
  ctx.moveTo(0, -8 * s);
  ctx.lineTo(0, 9 * s);
  ctx.stroke();
  ctx.restore();
}

export function fish(ctx, x, y, s, color = '#ff8c42') {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(0, 0, 14 * s, 7 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-12 * s, 0);
  ctx.lineTo(-20 * s, -7 * s);
  ctx.lineTo(-20 * s, 7 * s);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#20242e';
  ctx.beginPath();
  ctx.arc(6 * s, -1.5 * s, 1.8 * s, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// Concentric ripple rings on water.
export function ripple(ctx, x, y, rx, ry, color = 'rgba(255,255,255,0.55)') {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.6;
  [0.5, 0.85, 1.2].forEach((k, i) => {
    ctx.globalAlpha = 0.55 - i * 0.16;
    ctx.beginPath();
    ctx.ellipse(x, y, rx * k, ry * k, 0, 0, Math.PI * 2);
    ctx.stroke();
  });
  ctx.restore();
}
