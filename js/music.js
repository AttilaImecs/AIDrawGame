// Tiny procedural music player, same architecture as snail-maze's: no audio
// files, everything generated at runtime with the Web Audio API.

const NOTE_FREQS = {
  REST: 0,
  A2: 110.00, B2: 123.47,
  C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, G3: 196.00,
  A3: 220.00, B3: 246.94,
  C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.00, A4: 440.00, B4: 493.88,
  C5: 523.25, D5: 587.33, E5: 659.25,
};

// One slow, spacious pentatonic-leaning melody for the whole game -- a calm
// "blue sky" backdrop rather than something that demands attention.
const AMBIENT_TRACK = {
  tempo: 66,
  notes: [
    ['C4', 2], ['E4', 2], ['G4', 2], ['REST', 1], ['A4', 3], ['G4', 1],
    ['E4', 2], ['D4', 2], ['C4', 3], ['REST', 2],
    ['G3', 2], ['C4', 2], ['E4', 2], ['REST', 1], ['D4', 3], ['C4', 1],
    ['A3', 2], ['G3', 2], ['C4', 4], ['REST', 2],
  ],
};

let audioCtx = null;
let currentTrackId = -1;
let currentTimeouts = [];
let currentGain = null;

function ensureContext() {
  if (!audioCtx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    audioCtx = new AC();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

function playSequence(ctx, track, myId, gain) {
  if (myId !== currentTrackId) return;

  const beatSeconds = 60 / track.tempo;
  let cursor = 0;
  const timeouts = [];

  for (const [note, beats] of track.notes) {
    const dur = beats * beatSeconds;
    const freq = NOTE_FREQS[note];
    if (freq) {
      const delayMs = cursor * 1000;
      const t = setTimeout(() => {
        if (myId !== currentTrackId) return;
        const osc = ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.value = freq;
        const noteGain = ctx.createGain();
        const now = ctx.currentTime;
        noteGain.gain.setValueAtTime(0.0001, now);
        noteGain.gain.exponentialRampToValueAtTime(0.6, now + 0.15);
        noteGain.gain.exponentialRampToValueAtTime(0.0001, now + Math.max(dur * 0.95, 0.05));
        osc.connect(noteGain);
        noteGain.connect(gain);
        osc.start(now);
        osc.stop(now + dur);
      }, delayMs);
      timeouts.push(t);
    }
    cursor += dur;
  }

  const loopTimeout = setTimeout(() => playSequence(ctx, track, myId, gain), cursor * 1000);
  timeouts.push(loopTimeout);
  currentTimeouts = timeouts;
}

export function playAmbientMusic() {
  const ctx = ensureContext();
  if (!ctx) return;

  stopMusic();
  currentTrackId += 1;
  const myId = currentTrackId;

  const gain = ctx.createGain();
  gain.gain.value = 0.05;
  gain.connect(ctx.destination);
  currentGain = gain;

  playSequence(ctx, AMBIENT_TRACK, myId, gain);
}

export function stopMusic() {
  currentTrackId += 1;
  for (const t of currentTimeouts) clearTimeout(t);
  currentTimeouts = [];
  if (currentGain) {
    try {
      currentGain.disconnect();
    } catch (e) {
      // already disconnected, nothing to do
    }
    currentGain = null;
  }
}
