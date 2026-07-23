import { playPopSound } from "./pop-sound";
import { AmbianceTrack, getAmbianceSettings } from "./ambiance";

// Same philosophy as pop-sound.ts: everything here is synthesized with the
// Web Audio API, not a hosted audio file - no asset to license, host, or
// wait on a network request for.

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = ctx ?? new AudioCtx();
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

// The "gentle tick on check-off" - gated behind Settings -> Ambiance,
// unlike the plain playPopSound() used elsewhere (celebrations, Focus
// session end) which stay on regardless of this setting.
export function playCheckTick() {
  if (!getAmbianceSettings().checkSoundEnabled) return;
  playPopSound();
}

// A warm three-note ascending chime for finishing a whole routine -
// distinct from the everyday check-off tick, reserved for that one moment.
export function playChime() {
  if (!getAmbianceSettings().chimeEnabled) return;
  const audio = getCtx();
  if (!audio) return;
  try {
    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5 - a soft major triad
    const start = audio.currentTime;
    notes.forEach((freq, i) => {
      const t = start + i * 0.14;
      const osc = audio.createOscillator();
      const gain = audio.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.16, t + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.9);
      osc.connect(gain);
      gain.connect(audio.destination);
      osc.start(t);
      osc.stop(t + 0.95);
    });
  } catch {
    // Fail silently - ambiance is a nice-to-have, never worth an error.
  }
}

// --- Focus Candle ambient loop ------------------------------------------

let ambientNodes: { stop: () => void } | null = null;

function makeNoiseBuffer(audio: AudioContext, seconds: number): AudioBuffer {
  const buffer = audio.createBuffer(1, audio.sampleRate * seconds, audio.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  return buffer;
}

function startRain(audio: AudioContext, master: GainNode) {
  const source = audio.createBufferSource();
  source.buffer = makeNoiseBuffer(audio, 4);
  source.loop = true;

  const filter = audio.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 900;

  // A slow, gentle wobble in the cutoff so it doesn't sound like a static
  // hiss - closer to rain's natural ebb and flow.
  const lfo = audio.createOscillator();
  lfo.frequency.value = 0.07;
  const lfoGain = audio.createGain();
  lfoGain.gain.value = 220;
  lfo.connect(lfoGain);
  lfoGain.connect(filter.frequency);
  lfo.start();

  const trackGain = audio.createGain();
  trackGain.gain.value = 0.12;

  source.connect(filter);
  filter.connect(trackGain);
  trackGain.connect(master);
  source.start();

  return () => {
    source.stop();
    lfo.stop();
  };
}

function startCafe(audio: AudioContext, master: GainNode) {
  const source = audio.createBufferSource();
  source.buffer = makeNoiseBuffer(audio, 4);
  source.loop = true;

  const filter = audio.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = 450;
  filter.Q.value = 0.7;

  const trackGain = audio.createGain();
  trackGain.gain.value = 0.1;

  source.connect(filter);
  filter.connect(trackGain);
  trackGain.connect(master);
  source.start();

  // Occasional soft, high "clink" - abstract, not a literal cup sound,
  // just enough texture to read as a room rather than a machine.
  let clinkTimer: ReturnType<typeof setTimeout> | null = null;
  function scheduleClink() {
    const delay = 4000 + Math.random() * 6000;
    clinkTimer = setTimeout(() => {
      const t = audio.currentTime;
      const osc = audio.createOscillator();
      const gain = audio.createGain();
      osc.type = "sine";
      osc.frequency.value = 1800 + Math.random() * 800;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.03, t + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);
      osc.connect(gain);
      gain.connect(master);
      osc.start(t);
      osc.stop(t + 0.3);
      scheduleClink();
    }, delay);
  }
  scheduleClink();

  return () => {
    source.stop();
    if (clinkTimer) clearTimeout(clinkTimer);
  };
}

function startPiano(audio: AudioContext, master: GainNode) {
  // A slow pentatonic pattern, one soft note roughly every two seconds -
  // gentle enough to sit under a focus session without competing with it.
  const scale = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25]; // C major pentatonic-ish
  let stopped = false;
  let timer: ReturnType<typeof setTimeout> | null = null;

  function playNote() {
    if (stopped) return;
    const t = audio.currentTime;
    const freq = scale[Math.floor(Math.random() * scale.length)];
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.12, t + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 1.6);
    osc.connect(gain);
    gain.connect(master);
    osc.start(t);
    osc.stop(t + 1.7);
    timer = setTimeout(playNote, 1600 + Math.random() * 800);
  }
  playNote();

  return () => {
    stopped = true;
    if (timer) clearTimeout(timer);
  };
}

export function startAmbient(track: AmbianceTrack) {
  stopAmbient();
  const audio = getCtx();
  if (!audio) return;
  try {
    const master = audio.createGain();
    master.gain.setValueAtTime(0, audio.currentTime);
    master.gain.linearRampToValueAtTime(1, audio.currentTime + 1.2);
    master.connect(audio.destination);

    const stopTrack =
      track === "rain" ? startRain(audio, master) : track === "cafe" ? startCafe(audio, master) : startPiano(audio, master);

    ambientNodes = {
      stop: () => {
        const now = audio.currentTime;
        master.gain.cancelScheduledValues(now);
        master.gain.setValueAtTime(master.gain.value, now);
        master.gain.linearRampToValueAtTime(0, now + 0.6);
        stopTrack();
        setTimeout(() => master.disconnect(), 700);
      },
    };
  } catch {
    // Fail silently - ambiance is a nice-to-have, never worth an error.
  }
}

export function stopAmbient() {
  ambientNodes?.stop();
  ambientNodes = null;
}
