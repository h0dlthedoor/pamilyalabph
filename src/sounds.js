// ─── Web Audio API sound effects — zero bundle impact, no audio files ────────

/** Soft two-tone chime (880Hz → 1320Hz, 0.3s) for button presses */
export function playChime() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const g = ctx.createGain();
    g.connect(ctx.destination);
    g.gain.setValueAtTime(0.15, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);

    const o1 = ctx.createOscillator();
    o1.type = 'sine';
    o1.frequency.setValueAtTime(880, ctx.currentTime);
    o1.connect(g);
    o1.start(ctx.currentTime);
    o1.stop(ctx.currentTime + 0.15);

    const o2 = ctx.createOscillator();
    o2.type = 'sine';
    o2.frequency.setValueAtTime(1320, ctx.currentTime + 0.1);
    o2.connect(g);
    o2.start(ctx.currentTime + 0.1);
    o2.stop(ctx.currentTime + 0.3);
  } catch { /* silently fail if AudioContext blocked */ }
}

/** Ascending two-note success ding (C6 → E6, 0.4s) for form submission */
export function playSuccess() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const g = ctx.createGain();
    g.connect(ctx.destination);
    g.gain.setValueAtTime(0.18, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

    const o1 = ctx.createOscillator();
    o1.type = 'sine';
    o1.frequency.setValueAtTime(1047, ctx.currentTime); // C6
    o1.connect(g);
    o1.start(ctx.currentTime);
    o1.stop(ctx.currentTime + 0.2);

    const o2 = ctx.createOscillator();
    o2.type = 'sine';
    o2.frequency.setValueAtTime(1319, ctx.currentTime + 0.15); // E6
    o2.connect(g);
    o2.start(ctx.currentTime + 0.15);
    o2.stop(ctx.currentTime + 0.4);
  } catch { /* silently fail if AudioContext blocked */ }
}
