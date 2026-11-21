// Tiny synthesised sound bank: every effect is an oscillator through a gain
// envelope, so the game ships no audio files and makes no network request.
// The AudioContext is created lazily on the first user gesture, which is
// what browsers require; until then every call is a silent no-op.
export class SoundBank {
  constructor() {
    this.ctx = null;
    this.muted = false;
    try {
      this.muted = window.localStorage.getItem('twin-tides-muted') === '1';
    } catch {
      this.muted = false;
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    try {
      window.localStorage.setItem('twin-tides-muted', this.muted ? '1' : '0');
    } catch {
      // Storage may be unavailable; the in-memory flag still works.
    }
    return this.muted;
  }

  ensure() {
    if (this.ctx) return this.ctx;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      this.ctx = new AC();
    } catch {
      this.ctx = null;
    }
    return this.ctx;
  }

  tone(freq, at, dur, type, vol) {
    if (this.muted) return;
    const ctx = this.ensure();
    if (!ctx) return;
    if (ctx.state === 'suspended') void ctx.resume();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    const start = ctx.currentTime + at;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(vol, start + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    osc.connect(gain).connect(ctx.destination);
    osc.start(start);
    osc.stop(start + dur + 0.05);
  }

  click() {
    this.tone(660, 0, 0.06, 'triangle', 0.08);
  }

  // Two bright notes, the satisfying "found it" chime.
  found() {
    this.tone(880, 0, 0.12, 'sine', 0.16);
    this.tone(1318.5, 0.09, 0.22, 'sine', 0.16);
  }

  // A low dull buzz for a wrong click.
  wrong() {
    this.tone(160, 0, 0.18, 'sawtooth', 0.07);
    this.tone(110, 0.05, 0.2, 'sawtooth', 0.06);
  }

  hint() {
    this.tone(523.25, 0, 0.1, 'sine', 0.1);
    this.tone(783.99, 0.08, 0.14, 'sine', 0.1);
  }

  levelWin() {
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => this.tone(f, i * 0.11, 0.24, 'triangle', 0.14));
  }

  victory() {
    [523.25, 659.25, 783.99, 1046.5, 783.99, 1046.5, 1318.5].forEach((f, i) =>
      this.tone(f, i * 0.13, 0.3, 'triangle', 0.14),
    );
  }

  gameOver() {
    [392, 329.63, 261.63, 196].forEach((f, i) => this.tone(f, i * 0.16, 0.3, 'sine', 0.12));
  }
}
