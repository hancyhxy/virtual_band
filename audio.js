// p5js_homework/audio.js
// Purpose: Load drum samples and provide helpers to unlock and play each sound.
// Not for: Drawing canvases, hit detection, or MediaPipe setup logic.

const DRUM_SOURCES = {
  Kick: "assets/kick drum.m4a",
  Snare: "assets/snare.m4a",
  Tom: "assets/tom.m4a",
  "Hi-Hat": "assets/hat.m4a"
};

let audioContext = null;
const drumBuffers = new Map();
let loadingPromise = null;

function getOrCreateAudioContext() {
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  return audioContext;
}

export async function loadDrumSamples() {
  if (!loadingPromise) {
    const context = getOrCreateAudioContext();
    loadingPromise = Promise.all(
      Object.entries(DRUM_SOURCES).map(async ([drumId, path]) => {
        const url = new URL(path, window.location.href);
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Failed to load ${drumId} sample from ${path}.`);
        }

        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await context.decodeAudioData(arrayBuffer);
        drumBuffers.set(drumId, audioBuffer);
      })
    ).then(() => {
      return drumBuffers;
    });
  }

  return loadingPromise;
}

export async function unlockAudio() {
  const context = getOrCreateAudioContext();
  if (context.state === "suspended") {
    await context.resume().catch(() => {
      // Some browsers require the next user gesture to resume audio.
      return context.state;
    });
  }
  return context.state;
}

export function playDrum(drumId) {
  const context = getOrCreateAudioContext();
  const buffer = drumBuffers.get(drumId);
  if (!buffer) {
    return false;
  }

  const source = context.createBufferSource();
  source.buffer = buffer;
  source.connect(context.destination);
  source.start();
  return true;
}

export function getAudioState() {
  return audioContext ? audioContext.state : "closed";
}
