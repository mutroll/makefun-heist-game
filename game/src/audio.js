// The Sunspire Job — tiny WebAudio synth for footsteps of sound, no audio files.
// One job: every blip, clink and alarm pulse the game makes.

let audioContext = null;
let muted = false;

/** Create the audio context on the first user gesture (browsers demand one). */
export function unlockAudio() {
  if (audioContext) return;
  try {
    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (Ctor) audioContext = new Ctor();
  } catch {
    audioContext = null;
  }
}

export function toggleMute() {
  muted = !muted;
  return muted;
}

export function isMuted() {
  return muted;
}

function tone(freq, seconds, type, gain, when = 0) {
  if (!audioContext || muted) return;
  const t0 = audioContext.currentTime + when;
  const osc = audioContext.createOscillator();
  const amp = audioContext.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  amp.gain.setValueAtTime(0.0001, t0);
  amp.gain.exponentialRampToValueAtTime(gain, t0 + 0.015);
  amp.gain.exponentialRampToValueAtTime(0.0001, t0 + seconds);
  osc.connect(amp).connect(audioContext.destination);
  osc.start(t0);
  osc.stop(t0 + seconds + 0.05);
}

/** A brass coin bouncing on marble. */
export function playCoinClink() {
  tone(2093, 0.09, 'triangle', 0.12);
  tone(2637, 0.12, 'triangle', 0.08, 0.06);
}

/** The case cracking — a glassy tick. */
export function playCrackTick() {
  tone(1568, 0.05, 'square', 0.05);
}

/** The diamond lifts out of its case. */
export function playLootChime() {
  tone(1046, 0.16, 'sine', 0.14);
  tone(1318, 0.16, 'sine', 0.14, 0.09);
  tone(1568, 0.28, 'sine', 0.14, 0.18);
}

/** A guard has spotted the thief — a short brass sting. */
export function playSpotted() {
  tone(220, 0.22, 'sawtooth', 0.1);
  tone(174, 0.3, 'sawtooth', 0.1, 0.12);
}

/** The getaway fanfare. */
export function playGetaway() {
  [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.22, 'triangle', 0.12, i * 0.11));
}

/** Caught — a low thud. */
export function playCaught() {
  tone(110, 0.4, 'sawtooth', 0.14);
  tone(82, 0.5, 'sawtooth', 0.12, 0.15);
}

/** A soft alarm pulse while the meter is high (called at most once per 0.5 s). */
export function playAlarmPulse() {
  tone(880, 0.08, 'square', 0.045);
}
