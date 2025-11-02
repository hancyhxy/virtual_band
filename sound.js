// p5js_homework/sound.js
// Purpose: Capture live microphone input, analyze its spectrum, and expose
// band-reactive values so the webcam pixel effect can respond musically.
// Not for: Triggering drum samples or managing p5 draw loops.

import { getSharedAudioContext } from "./audio.js";

const FFT_SIZE = 1024;
const MIC_CONSTRAINTS = {
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: false
  }
};

const LOW_BAND = [40, 180];
const MID_BAND = [180, 2000];
const HIGH_BAND = [2000, 6000];
const RHYTHM_WINDOW_MS = 2000;
const PEAK_COOLDOWN_MS = 120;

let analyser = null;
let mediaStream = null;
let streamSource = null;
let frequencyData = null;
let bandRanges = null;
let energyEma = 0;
let lastPeakMs = 0;
const peakTimes = [];

const bandState = {
  bass: 0,
  mid: 0,
  treble: 0
};

const reactState = {
  active: false,
  pixelSizeFactor: 1,
  saturationBoost: 0,
  hueShiftDeg: 0,
  jitterStrength: 0,
  vividness: 0,
  colorFlash: 0,
  rhythmDensity: 0,
  bassLevel: 0,
  midLevel: 0,
  trebleLevel: 0
};

const DRUM_IMPULSE_PROFILES = {
  Kick: { overall: 1.0, bass: 1.1, mid: 0.25, treble: 0.12 },
  Snare: { overall: 0.85, bass: 0.35, mid: 0.95, treble: 0.7 },
  Tom: { overall: 0.95, bass: 0.8, mid: 0.5, treble: 0.3 },
  "Hi-Hat": { overall: 0.7, bass: 0.15, mid: 0.6, treble: 1.0 },
  default: { overall: 0.85, bass: 0.45, mid: 0.5, treble: 0.55 }
};

const drumImpulse = {
  overall: 0,
  bass: 0,
  mid: 0,
  treble: 0
};

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function smooth(current, target, alpha) {
  return current + (target - current) * clamp(alpha, 0, 1);
}

function freqToIndex(freq, binHz, maxIndex) {
  return clamp(Math.round(freq / binHz), 0, maxIndex);
}

function getNow() {
  if (typeof performance !== "undefined" && typeof performance.now === "function") {
    return performance.now();
  }
  return Date.now();
}

function computeBandAverages() {
  if (!frequencyData || !bandRanges) {
    return { bass: 0, mid: 0, treble: 0, energy: 0 };
  }

  const counts = {};
  const sums = {};
  let energySum = 0;
  const length = frequencyData.length;

  Object.keys(bandRanges).forEach((key) => {
    const { start, end } = bandRanges[key];
    let bandTotal = 0;
    const startIdx = clamp(start, 0, length - 1);
    const endIdx = clamp(end, startIdx + 1, length);
    for (let i = startIdx; i < endIdx; i += 1) {
      bandTotal += frequencyData[i];
    }
    const count = Math.max(endIdx - startIdx, 1);
    counts[key] = count;
    sums[key] = bandTotal;
  });

  for (let i = 0; i < length; i += 1) {
    energySum += frequencyData[i];
  }

  const norm = 255;
  return {
    bass: sums.bass / (counts.bass * norm),
    mid: sums.mid / (counts.mid * norm),
    treble: sums.treble / (counts.treble * norm),
    energy: energySum / (length * norm)
  };
}

function updateBandRanges(sampleRate, fftSize) {
  const binHz = sampleRate / fftSize;
  const maxIndex = (fftSize / 2) - 1;
  bandRanges = {
    bass: {
      start: freqToIndex(LOW_BAND[0], binHz, maxIndex),
      end: freqToIndex(LOW_BAND[1], binHz, maxIndex)
    },
    mid: {
      start: freqToIndex(MID_BAND[0], binHz, maxIndex),
      end: freqToIndex(MID_BAND[1], binHz, maxIndex)
    },
    treble: {
      start: freqToIndex(HIGH_BAND[0], binHz, maxIndex),
      end: freqToIndex(HIGH_BAND[1], binHz, maxIndex)
    }
  };
}

function applyImpulseDecay(deltaMs) {
  const decay = Math.exp(-Math.max(deltaMs, 0) / 220);
  drumImpulse.overall *= decay;
  drumImpulse.bass *= decay;
  drumImpulse.mid *= decay;
  drumImpulse.treble *= decay;

  if (drumImpulse.overall < 0.0005) drumImpulse.overall = 0;
  if (drumImpulse.bass < 0.0005) drumImpulse.bass = 0;
  if (drumImpulse.mid < 0.0005) drumImpulse.mid = 0;
  if (drumImpulse.treble < 0.0005) drumImpulse.treble = 0;
}

export function registerDrumImpulse(drumId, strength = 1) {
  const profile = DRUM_IMPULSE_PROFILES[drumId] || DRUM_IMPULSE_PROFILES.default;
  const boost = clamp(strength, 0, 1);
  const overallGain = profile.overall * boost;
  drumImpulse.overall = clamp(drumImpulse.overall + overallGain, 0, 1.6);
  drumImpulse.bass = clamp(drumImpulse.bass + profile.bass * boost, 0, 1.6);
  drumImpulse.mid = clamp(drumImpulse.mid + profile.mid * boost, 0, 1.6);
  drumImpulse.treble = clamp(drumImpulse.treble + profile.treble * boost, 0, 1.6);

  const now = getNow();
  peakTimes.push(now);
  while (peakTimes.length && now - peakTimes[0] > RHYTHM_WINDOW_MS) {
    peakTimes.shift();
  }
  reactState.active = true;
}

export async function initAudioAnalysis() {
  if (analyser) {
    return true;
  }

  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    throw new Error("Microphone input is not supported in this browser.");
  }

  const audioContext = getSharedAudioContext();

  try {
    if (audioContext.state === "suspended") {
      await audioContext.resume();
    }
  } catch (_) {
    // If resume fails, the next user gesture should retry.
  }

  try {
    mediaStream = await navigator.mediaDevices.getUserMedia(MIC_CONSTRAINTS);
  } catch (error) {
    throw new Error("Microphone permission denied or unavailable.");
  }

  streamSource = audioContext.createMediaStreamSource(mediaStream);
  analyser = audioContext.createAnalyser();
  analyser.fftSize = FFT_SIZE;
  analyser.smoothingTimeConstant = 0.6;
  streamSource.connect(analyser);

  frequencyData = new Uint8Array(analyser.frequencyBinCount);
  updateBandRanges(audioContext.sampleRate, analyser.fftSize);
  reactState.active = true;
  return true;
}

export function updateAudioFrame(deltaMs = 16.67) {
  const dt = Math.max(deltaMs, 1);
  applyImpulseDecay(dt);

  let bassRaw = 0;
  let midRaw = 0;
  let trebleRaw = 0;
  let energyRaw = 0;

  const hasAnalyser = analyser && frequencyData && bandRanges;
  if (hasAnalyser) {
    analyser.getByteFrequencyData(frequencyData);
    const { bass, mid, treble, energy } = computeBandAverages();
    bassRaw = bass;
    midRaw = mid;
    trebleRaw = treble;
    energyRaw = energy;
  }

  const approachBass = hasAnalyser ? 0.25 : 0.15;
  const approachMid = hasAnalyser ? 0.22 : 0.15;
  const approachTreble = hasAnalyser ? 0.24 : 0.15;

  bandState.bass = smooth(bandState.bass, bassRaw, approachBass);
  bandState.mid = smooth(bandState.mid, midRaw, approachMid);
  bandState.treble = smooth(bandState.treble, trebleRaw, approachTreble);

  const combinedBass = clamp(bandState.bass + drumImpulse.bass, 0, 1.6);
  const combinedMid = clamp(bandState.mid + drumImpulse.mid, 0, 1.6);
  const combinedTreble = clamp(bandState.treble + drumImpulse.treble, 0, 1.6);
  const impulseEnergy = clamp(drumImpulse.overall, 0, 1.3);

  const now = getNow();
  const energyForPeaks = Math.max(energyRaw, impulseEnergy * 0.85);
  const prevEnergyEma = energyEma;
  energyEma = smooth(energyEma, energyForPeaks, 0.08);
  const dynamicThreshold = prevEnergyEma + 0.18;
  if (energyForPeaks > dynamicThreshold && now - lastPeakMs > PEAK_COOLDOWN_MS) {
    peakTimes.push(now);
    lastPeakMs = now;
  }

  while (peakTimes.length && now - peakTimes[0] > RHYTHM_WINDOW_MS) {
    peakTimes.shift();
  }

  const peakDensity = clamp(peakTimes.length / 6, 0, 1);
  reactState.rhythmDensity = smooth(reactState.rhythmDensity, peakDensity, 0.22);

  // Pixel geometry stays gentle while color reacts strongly.
  const pixelTarget = clamp(1 + combinedBass * 0.22 + impulseEnergy * 0.15, 0.7, 1.6);
  reactState.pixelSizeFactor = smooth(reactState.pixelSizeFactor, pixelTarget, hasAnalyser ? 0.28 : 0.32);

  const saturationTarget = clamp(
    combinedBass * 1.4 + combinedMid * 0.6 + impulseEnergy * 1.1 + reactState.rhythmDensity * 0.35,
    0,
    2.2
  );
  reactState.saturationBoost = smooth(reactState.saturationBoost, saturationTarget, 0.35);

  const hueBase = clamp((combinedMid - combinedBass) * 32, -32, 32);
  const hueTreble = combinedTreble * 14;
  const hueImpulse = clamp((drumImpulse.mid - drumImpulse.bass) * 24 + impulseEnergy * 10, -24, 24);
  const hueTarget = clamp(hueBase + hueTreble + hueImpulse, -36, 36);
  reactState.hueShiftDeg = smooth(reactState.hueShiftDeg, hueTarget, 0.4);

  const jitterTarget = clamp(combinedTreble * 0.35 + impulseEnergy * 0.12, 0, 0.5);
  reactState.jitterStrength = smooth(reactState.jitterStrength, jitterTarget, 0.3);

  const vividTarget = clamp(
    impulseEnergy * 0.8 + combinedTreble * 0.6 + reactState.rhythmDensity * 0.5,
    0,
    1.3
  );
  reactState.vividness = smooth(reactState.vividness, vividTarget, 0.35);

  const flashTarget = clamp(
    Math.max(impulseEnergy, combinedBass * 0.45 + combinedTreble * 0.4),
    0,
    1.2
  );
  reactState.colorFlash = smooth(reactState.colorFlash, flashTarget, 0.45);

  reactState.bassLevel = combinedBass;
  reactState.midLevel = combinedMid;
  reactState.trebleLevel = combinedTreble;
  reactState.active = !!(
    hasAnalyser ||
    impulseEnergy > 0.02 ||
    combinedBass > 0.02 ||
    combinedMid > 0.02 ||
    combinedTreble > 0.02
  );

  return reactState;
}

export function getAudioReactState() {
  return { ...reactState };
}

export function disposeAudioAnalysis() {
  if (mediaStream) {
    mediaStream.getTracks().forEach((track) => track.stop());
  }
  if (streamSource) {
    try {
      streamSource.disconnect();
    } catch (_) {}
  }
  analyser = null;
  streamSource = null;
  mediaStream = null;
  frequencyData = null;
  bandRanges = null;
  energyEma = 0;
  lastPeakMs = 0;
  peakTimes.length = 0;
  drumImpulse.overall = 0;
  drumImpulse.bass = 0;
  drumImpulse.mid = 0;
  drumImpulse.treble = 0;
  bandState.bass = 0;
  bandState.mid = 0;
  bandState.treble = 0;
  reactState.active = false;
  reactState.pixelSizeFactor = 1;
  reactState.saturationBoost = 0;
  reactState.hueShiftDeg = 0;
  reactState.jitterStrength = 0;
  reactState.vividness = 0;
  reactState.colorFlash = 0;
  reactState.rhythmDensity = 0;
  reactState.bassLevel = 0;
  reactState.midLevel = 0;
  reactState.trebleLevel = 0;
}
