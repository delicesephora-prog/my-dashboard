let ctx: AudioContext | null = null;

// A soft three-note major triad with a slow decay - deliberately gentler
// than the quick task-complete pop. For finishing a full routine, which
// should feel like a small ceremony, not a burst.
export function playGentleChime() {
  try {
    if (typeof window === "undefined") return;
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = ctx ?? new AudioCtx();
    if (ctx.state === "suspended") ctx.resume();

    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5

    notes.forEach((freq, i) => {
      const osc = ctx!.createOscillator();
      const gain = ctx!.createGain();
      const start = now + i * 0.12;

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.14, start + 0.06);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.9);

      osc.connect(gain);
      gain.connect(ctx!.destination);
      osc.start(start);
      osc.stop(start + 0.95);
    });
  } catch {
    // Audio isn't available in this browser/context - fail silently.
  }
}
