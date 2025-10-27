// p5js_homework/sketch.js
// Purpose: Create a p5.js canvas that fills the viewport, shows the webcam feed, and overlays hand landmarks.
// Not for: Configuring MediaPipe Hands itself or handling browser permission prompts.

import { initTracker, getLandmarks } from "./tracker.js";
import { isInside, shouldTrigger } from "./hitmap.js";
import { loadDrumSamples, playDrum, unlockAudio, getAudioState } from "./audio.js";

const MIRROR_PREVIEW = true; // Flip to false if you prefer a non-mirrored preview.
const FINGER_TIP_ID = 8;
const FINGER_TIP_DIAMETER = 10;
const LANDMARK_DIAMETER = 6;
const HAND_STYLES = [
  { bone: "#4cc9f0", joint: "#d000ff" },
  { bone: "#4895ef", joint: "#ffb703" }
];
const HAND_CONNECTIONS = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4],
  [0, 5],
  [5, 6],
  [6, 7],
  [7, 8],
  [5, 9],
  [9, 10],
  [10, 11],
  [11, 12],
  [9, 13],
  [13, 14],
  [14, 15],
  [15, 16],
  [13, 17],
  [17, 18],
  [18, 19],
  [19, 20],
  [0, 17],
  [0, 9],
  [0, 13],
  [5, 9],
  [9, 13],
  [13, 17]
];

const DRUMS = [
  // Drum placeholders are stored with normalized positions (0-1) so they stay responsive.
  { id: "Kick", x: 0.5, y: 0.78, r: 0.2 },
  { id: "Snare", x: 0.35, y: 0.58, r: 0.14 },
  { id: "Tom", x: 0.62, y: 0.45, r: 0.12 },
  { id: "Hi-Hat", x: 0.8, y: 0.35, r: 0.1 }
];

const HIT_SPEED_THRESHOLD = 500; // Minimum finger speed (px/s) required to count as a drum hit.
const HIGHLIGHT_DURATION_MS = 120;
const HIGHLIGHT_SCALE = 1.15;

// Pixel-burst feedback (bright but non-neon) configuration
const PARTICLE_COLORS = [
  "#f77f00", // orange
  "#f4a261", // sand
  "#e76f51", // coral
  "#2a9d8f", // teal
  "#457b9d", // steel blue
  "#ffd166"  // warm yellow
];
const PARTICLE_COUNT_BASE = 14;
const PARTICLE_COUNT_BOOST = 26; // extra particles at max intensity
const PARTICLE_LIFE_MS = 380;
const PARTICLE_SIZE_MIN = 3;
const PARTICLE_SIZE_MAX = 6;
const PARTICLE_SPEED_MIN = 80;  // px/s
const PARTICLE_SPEED_MAX = 360; // px/s
const PARTICLE_DAMPING = 0.9;   // velocity damping factor (frame-rate adjusted)
const PARTICLE_MAX_ACTIVE = 160; // cap per drum for performance

// Dynamic controls (can be toggled)
let EFFECT_MODE = "random"; // "random" | "burst" | "spray" | "cluster" | "ring"
let SPARKLES_ENABLED = true; // allow occasional white/gold sparkles
let ADD_BLEND = false; // optional additive blending for extra pop
let PARTICLE_MULTIPLIER = 1; // scales count/size for tuning

const drumStates = DRUMS.map(() => ({
  prevInside: false,
  highlightUntil: 0,
  particles: []
}));

const previousFingerPositions = [];

let trackerReady = false;
let trackerError = null;
let videoElementRef = null;
let drumSamplesLoaded = false;
let audioLoadError = null;

// Shader-based pixel effect state
let pixelShader = null; // p5.Shader
let glitchLayer = null; // p5.Graphics (WEBGL)
let pixelFallback = null; // p5.Graphics (2D) for CPU fallback
let videoBuffer = null; // p5.Graphics (2D) used as shader texture source
let shaderReady = false;

// Effect controls (always on by request)
let PIXEL_SIZE = 12; // px
let POSTERIZE_STEPS = 6; // levels
let GLITCH_AMOUNT = 0.12; // 0..1
let SCANLINE_AMOUNT = 0.2; // 0..1

// Preload shader files so they’re ready before setup
window.preload = () => {
  try {
    pixelShader = loadShader("assets/pixelate.vert", "assets/pixelate.frag");
  } catch (e) {
    // If loadShader fails (e.g., unsupported), we'll fall back to CPU path.
    pixelShader = null;
  }
};

window.setup = () => {
  const canvas = createCanvas(windowWidth, windowHeight);
  canvas.parent(document.querySelector("main"));
  pixelDensity(1);
  noStroke();

  videoElementRef = document.getElementById("hand-video");

  // Prepare render targets
  try {
    glitchLayer = createGraphics(windowWidth, windowHeight, WEBGL);
    glitchLayer.pixelDensity(1);
    shaderReady = !!pixelShader;
  } catch (e) {
    glitchLayer = null;
    shaderReady = false;
  }

  // CPU fallback buffer (small, upscaled)
  pixelFallback = createGraphics(max(1, floor(windowWidth / PIXEL_SIZE)), max(1, floor(windowHeight / PIXEL_SIZE)), P2D);
  pixelFallback.pixelDensity(1);
  pixelFallback.noSmooth();

  // 2D video staging buffer for shader texture
  videoBuffer = createGraphics(windowWidth, windowHeight, P2D);
  videoBuffer.pixelDensity(1);

  initTracker(videoElementRef)
    .then(() => {
      trackerReady = true;
    })
    .catch((error) => {
      trackerError = error;
      console.error("Failed to start the hand tracker:", error);
    });

  loadDrumSamples()
    .then(() => {
      drumSamplesLoaded = true;
    })
    .catch((error) => {
      audioLoadError = error;
      console.error("Failed to load drum sounds:", error);
    });

  const handleUserInteraction = () => {
    unlockAudio().catch((error) => {
      audioLoadError = error;
      console.error("Failed to unlock audio playback:", error);
    });

    if (!drumSamplesLoaded) {
      loadDrumSamples()
        .then(() => {
          drumSamplesLoaded = true;
        })
        .catch((error) => {
          audioLoadError = error;
          console.error("Failed to load drum sounds during interaction:", error);
        });
    }
  };

  window.mousePressed = handleUserInteraction;
  window.touchStarted = handleUserInteraction;
  window.keyPressed = (e) => {
    handleUserInteraction();
    handleKeyToggle(e);
  };
};

window.draw = () => {
  background(16);

  const videoReady =
    videoElementRef && videoElementRef.readyState >= HTMLMediaElement.HAVE_ENOUGH_DATA;

  if (videoReady) {
    drawVideoFrame();
  }

  if (trackerError) {
    drawDrums();
    drawStatusMessage("Camera error: " + trackerError.message);
    return;
  }

  if (!trackerReady) {
    drawDrums();
    drawStatusMessage("Starting camera...");
    return;
  }

  const hands = getLandmarks();

  const hasHands = Array.isArray(hands) && hands.length > 0;

  const fingerStates = [];

  if (hasHands) {
    // Track the fingertip in pixel space so we can measure entry speed.
    hands.forEach((landmarks, handIndex) => {
      const fingerTip = landmarks[FINGER_TIP_ID];
      if (!fingerTip) {
        fingerStates[handIndex] = { tip: null, speedPxPerSec: 0, vx: 0, vy: 0 };
        previousFingerPositions[handIndex] = null;
        return;
      }

      const tipPosition = convertToCanvasCoordinates(fingerTip);
      const previousTip = previousFingerPositions[handIndex];
      let speedPxPerSec = 0;
      let vx = 0;
      let vy = 0;

      if (previousTip && deltaTime > 0) {
        const dx = tipPosition.x - previousTip.x;
        const dy = tipPosition.y - previousTip.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const seconds = deltaTime / 1000;
        if (seconds > 0) {
          speedPxPerSec = distance / seconds;
          vx = dx / seconds;
          vy = dy / seconds;
        }
      }

      fingerStates[handIndex] = {
        tip: tipPosition,
        speedPxPerSec,
        vx,
        vy
      };
      previousFingerPositions[handIndex] = tipPosition;
    });

    previousFingerPositions.length = hands.length;
  } else {
    previousFingerPositions.length = 0;
  }

  updateDrumStates(fingerStates);

  drawDrums();
  drawAudioStatus();

  if (!hasHands) {
    return;
  }

  hands.forEach((landmarks, index) => {
    const style = HAND_STYLES[index % HAND_STYLES.length];
    drawBones(landmarks, style.bone);
    drawLandmarks(landmarks, style.joint);
  });
};

window.windowResized = () => {
  resizeCanvas(windowWidth, windowHeight);
  // Recreate WEBGL buffer on resize for correct resolution
  if (glitchLayer) {
    try {
      glitchLayer.remove();
    } catch (_) {}
    glitchLayer = createGraphics(windowWidth, windowHeight, WEBGL);
    glitchLayer.pixelDensity(1);
  }
  // Resize fallback buffer
  if (pixelFallback) {
    try { pixelFallback.remove(); } catch (_) {}
    pixelFallback = createGraphics(max(1, floor(windowWidth / PIXEL_SIZE)), max(1, floor(windowHeight / PIXEL_SIZE)), P2D);
    pixelFallback.pixelDensity(1);
    pixelFallback.noSmooth();
  }
  // Resize video staging buffer
  if (videoBuffer) {
    try { videoBuffer.remove(); } catch (_) {}
    videoBuffer = createGraphics(windowWidth, windowHeight, P2D);
    videoBuffer.pixelDensity(1);
  }
};

function drawVideoFrame() {
  if (!videoElementRef) return;
  // Prefer shader path if WEBGL and shader are available
  if (glitchLayer && pixelShader) {
    // Draw current video frame into a 2D buffer first
    videoBuffer.push();
    videoBuffer.clear(0, 0, 0, 0);
    // No mirroring here; shader handles flip
    videoBuffer.drawingContext.drawImage(
      videoElementRef,
      0,
      0,
      videoBuffer.width,
      videoBuffer.height
    );
    videoBuffer.pop();

    const glw = glitchLayer.width;
    const glh = glitchLayer.height;
    glitchLayer.shader(pixelShader);
    pixelShader.setUniform("tex0", videoBuffer);
    pixelShader.setUniform("u_resolution", [glw, glh]);
    pixelShader.setUniform("u_time", millis() / 1000.0);
    pixelShader.setUniform("u_pixelSize", max(1, PIXEL_SIZE));
    pixelShader.setUniform("u_posterizeSteps", max(1, POSTERIZE_STEPS));
    pixelShader.setUniform("u_glitchAmt", constrain(GLITCH_AMOUNT, 0, 1));
    pixelShader.setUniform("u_scanlineAmt", constrain(SCANLINE_AMOUNT, 0, 1));
    pixelShader.setUniform("u_flipX", MIRROR_PREVIEW ? 1.0 : 0.0);

    glitchLayer.noStroke();
    glitchLayer.rectMode(CENTER);
    glitchLayer.push();
    // Full-screen quad in WEBGL mode (centered at 0,0)
    glitchLayer.rect(0, 0, glw, glh);
    glitchLayer.pop();

    // Composite the processed layer back to the 2D canvas
    image(glitchLayer, 0, 0, width, height);
    return;
  }

  // CPU fallback: scale down then scale up to pixelate; apply simple posterize and warm tint.
  if (pixelFallback) {
    const smallW = max(1, floor(width / PIXEL_SIZE));
    const smallH = max(1, floor(height / PIXEL_SIZE));
    if (pixelFallback.width !== smallW || pixelFallback.height !== smallH) {
      try { pixelFallback.remove(); } catch (_) {}
      pixelFallback = createGraphics(smallW, smallH, P2D);
      pixelFallback.pixelDensity(1);
      pixelFallback.noSmooth();
    }

    // Draw video into the small buffer (with optional mirror)
    pixelFallback.push();
    pixelFallback.noSmooth();
    pixelFallback.clear(0, 0, 0, 0);
    // Use 2D drawImage to accept native HTMLVideoElement
    pixelFallback.drawingContext.drawImage(
      videoElementRef,
      0,
      0,
      pixelFallback.width,
      pixelFallback.height
    );
    pixelFallback.pop();

    // Posterize approximation
    try { pixelFallback.filter(POSTERIZE, max(2, floor(POSTERIZE_STEPS))); } catch (_) {}

    // Warm tint overlay to echo pink/orange
    pixelFallback.push();
    pixelFallback.blendMode(MULTIPLY);
    pixelFallback.noStroke();
    pixelFallback.fill(255, 120, 80, 85); // warm orange
    pixelFallback.rect(0, 0, pixelFallback.width, pixelFallback.height);
    pixelFallback.pop();

    // Now draw the tiny buffer scaled up without smoothing
    push();
    noSmooth();
    image(pixelFallback, 0, 0, width, height);
    pop();
    return;
  }

  // Ultimate fallback: draw video directly (rare)
  push();
  if (MIRROR_PREVIEW) {
    translate(width, 0);
    scale(-1, 1);
  }
  drawingContext.drawImage(videoElementRef, 0, 0, width, height);
  pop();
}

function drawBones(landmarks, strokeColor) {
  stroke(strokeColor);
  strokeWeight(4);
  noFill();

  HAND_CONNECTIONS.forEach(([startIndex, endIndex]) => {
    const startLandmark = landmarks[startIndex];
    const endLandmark = landmarks[endIndex];
    if (!startLandmark || !endLandmark) return;

    const start = convertToCanvasCoordinates(startLandmark);
    const end = convertToCanvasCoordinates(endLandmark);
    line(start.x, start.y, end.x, end.y);
  });
}

function drawLandmarks(landmarks, fillColor) {
  noStroke();

  fill(fillColor);
  landmarks.forEach((landmark, index) => {
    const { x, y } = convertToCanvasCoordinates(landmark);
    const diameter = index === FINGER_TIP_ID ? FINGER_TIP_DIAMETER : LANDMARK_DIAMETER;
    circle(x, y, diameter);
  });
}

function convertToCanvasCoordinates(landmark) {
  const baseX = landmark.x * width;
  const x = MIRROR_PREVIEW ? width - baseX : baseX;
  const y = landmark.y * height;
  return { x, y };
}

function updateDrumStates(fingerStates) {
  const now = millis();
  const canvasScale = Math.min(width, height);

  // Compare each drum with the latest fingertip positions to detect new entries.
  DRUMS.forEach((drum, index) => {
    const center = convertToCanvasCoordinates(drum);
    const radius = drum.r * canvasScale;
    const hitArea = { center, radius };

    let currInside = false;
    let maxSpeed = 0;
    let impactVx = 0;
    let impactVy = 0;

    fingerStates.forEach((finger) => {
      if (!finger || !finger.tip) return;

      if (isInside(finger.tip, hitArea)) {
        currInside = true;
        if (finger.speedPxPerSec > maxSpeed) {
          maxSpeed = finger.speedPxPerSec;
          // Capture motion direction if available
          if (typeof finger.vx === "number" && typeof finger.vy === "number") {
            impactVx = finger.vx;
            impactVy = finger.vy;
          }
        }
      }
    });

    const state = drumStates[index];
    const triggered = shouldTrigger(state.prevInside, currInside, maxSpeed, HIT_SPEED_THRESHOLD);

    if (triggered) {
      state.highlightUntil = now + HIGHLIGHT_DURATION_MS;

      // Map speed to an intensity in [0, 1], starting at the threshold.
      const intensity = constrain(
        (maxSpeed - HIT_SPEED_THRESHOLD) / (HIT_SPEED_THRESHOLD * 2),
        0,
        1
      );
      // Spawn bright pixel squares for visual feedback.
      spawnBurstForDrum(index, center, radius, intensity, { vx: impactVx, vy: impactVy });

      const played = playDrum(drum.id);
      if (!played && drumSamplesLoaded) {
        console.warn("Drum buffer missing:", drum.id);
      }
      console.log("HIT", drum.id);
    }

    state.prevInside = currInside;
  });
}

function drawDrums() {
  push();
  textAlign(CENTER, CENTER);
  const now = millis();

  // Render each drum with a brief highlight when a hit was registered.
  DRUMS.forEach((drum, index) => {
    const { x, y } = convertToCanvasCoordinates(drum);
    const baseRadius = drum.r * Math.min(width, height);
    const state = drumStates[index];
    const isHighlighted = state && state.highlightUntil > now;
    const radius = baseRadius * (isHighlighted ? HIGHLIGHT_SCALE : 1);

    stroke(isHighlighted ? "#ff006e" : "#1d3557");
    strokeWeight(isHighlighted ? 4 : 3);
    if (isHighlighted) {
      fill(255, 214, 165, 180);
    } else {
      fill(236, 244, 255, 120);
    }
    circle(x, y, radius * 2);

    // Draw bright pixel particles above the circle but below the label.
    updateAndDrawParticles(index);

    noStroke();
    fill(isHighlighted ? "#ff006e" : "#1d3557");
    textSize(max(12, radius * 0.55));
    text(drum.id, x, y);
  });
  pop();
}

// Spawn a burst of small square particles for a drum.
function spawnBurstForDrum(drumIndex, center, baseRadius, intensity, impact) {
  const state = drumStates[drumIndex];
  if (!state) return;

  const style = chooseEffectStyle();
  if (style === "ring") {
    spawnStyleRing(state, center, baseRadius, intensity);
  } else if (style === "spray") {
    spawnStyleSpray(state, center, baseRadius, intensity, impact);
  } else if (style === "cluster") {
    spawnStyleCluster(state, center, baseRadius, intensity);
  } else {
    spawnStyleBurst(state, center, baseRadius, intensity, impact);
  }

  // Cap active particles per drum to maintain performance; drop oldest.
  if (state.particles.length > PARTICLE_MAX_ACTIVE) {
    state.particles.splice(0, state.particles.length - PARTICLE_MAX_ACTIVE);
  }
}

function updateAndDrawParticles(drumIndex) {
  const state = drumStates[drumIndex];
  if (!state || !state.particles.length) return;

  const now = millis();
  const dt = deltaTime; // ms since last frame
  const damping = Math.pow(PARTICLE_DAMPING, dt / 16.667);

  // Update and render; remove expired in-place.
  let write = 0;
  rectMode(CENTER);
  noStroke();

  if (ADD_BLEND) {
    push();
    blendMode(ADD);
  }

  for (let read = 0; read < state.particles.length; read++) {
    const p = state.particles[read];
    const age = now - p.bornAt;
    if (age >= p.life) {
      continue; // drop
    }

    // Integrate
    p.vx *= damping;
    p.vy *= damping;

    // Optional swirl/drift
    if (p.swirl) {
      // Rotate velocity slightly each frame
      const omega = p.swirlOmega || 0;
      const cosw = Math.cos(omega * dt);
      const sinw = Math.sin(omega * dt);
      const rvx = p.vx * cosw - p.vy * sinw;
      const rvy = p.vx * sinw + p.vy * cosw;
      p.vx = rvx;
      p.vy = rvy;
    }

    p.x += p.vx * dt;
    p.y += p.vy * dt;

    // Fade out toward end of life (ease out)
    const t = constrain(age / p.life, 0, 1);
    const alpha = 255 * (1 - t * t);

    // Draw shapes: square (default), diamond (rotated square), cross
    const c = color(p.colorHex);
    c.setAlpha(alpha);
    fill(c);
    const cx = Math.round(p.x);
    const cy = Math.round(p.y);
    const s = p.size;
    if (p.shape === "diamond") {
      push();
      translate(cx, cy);
      rotate(PI / 4 + (p.angle || 0));
      rect(0, 0, s, s);
      pop();
    } else if (p.shape === "cross") {
      push();
      translate(cx, cy);
      rotate(p.angle || 0);
      rect(0, 0, s * 1.6, s * 0.35);
      rect(0, 0, s * 0.35, s * 1.6);
      pop();
    } else {
      rect(cx, cy, s, s);
    }

    // Keep particle
    state.particles[write++] = p;
  }

  state.particles.length = write;

  if (ADD_BLEND) {
    pop();
  }
}

function chooseEffectStyle() {
  if (EFFECT_MODE !== "random") return EFFECT_MODE;
  const r = random();
  if (r < 0.25) return "ring";
  if (r < 0.55) return "spray";
  if (r < 0.8) return "cluster";
  return "burst";
}

function pickParticleColor() {
  // Warm base palette with occasional sparkles
  if (SPARKLES_ENABLED && random() < 0.12) {
    return random(["#ffffff", "#f8f1c1", "#daa520"]);
  }
  return random(PARTICLE_COLORS);
}

function spawnStyleBurst(state, center, baseRadius, intensity, impact) {
  const count = Math.max(
    1,
    Math.round((PARTICLE_COUNT_BASE + PARTICLE_COUNT_BOOST * intensity) * PARTICLE_MULTIPLIER)
  );

  // Impact bias direction (normalized)
  let bx = 0;
  let by = 0;
  if (impact && (impact.vx || impact.vy)) {
    const len = Math.hypot(impact.vx, impact.vy) || 1;
    bx = impact.vx / len;
    by = impact.vy / len;
  }

  for (let i = 0; i < count; i++) {
    const angle = random(TWO_PI);
    const bias = 0.55; // mix toward impact direction
    const dirx = lerp(Math.cos(angle), bx, bias * intensity);
    const diry = lerp(Math.sin(angle), by, bias * intensity);
    const norm = Math.hypot(dirx, diry) || 1;
    const speed = lerp(PARTICLE_SPEED_MIN, PARTICLE_SPEED_MAX, intensity) * (0.7 + random() * 0.8);
    const vx = (dirx / norm) * (speed / 1000);
    const vy = (diry / norm) * (speed / 1000);
    const size = random(PARTICLE_SIZE_MIN, PARTICLE_SIZE_MAX) * PARTICLE_MULTIPLIER;
    const colorHex = pickParticleColor();
    const life = PARTICLE_LIFE_MS * (0.8 + random() * 0.7);
    const shape = random() < 0.2 ? "diamond" : random() < 0.1 ? "cross" : "square";

    state.particles.push({
      x: center.x + random(-baseRadius * 0.08, baseRadius * 0.08),
      y: center.y + random(-baseRadius * 0.08, baseRadius * 0.08),
      vx,
      vy,
      size,
      colorHex,
      bornAt: millis(),
      life,
      shape,
      angle: random(TWO_PI) * 0.1,
      swirl: random() < 0.3,
      swirlOmega: (random(-0.9, 0.9) / 1000) * (0.3 + 0.7 * intensity)
    });
  }
}

function spawnStyleSpray(state, center, baseRadius, intensity, impact) {
  const count = Math.max(
    1,
    Math.round((PARTICLE_COUNT_BASE * 0.8 + PARTICLE_COUNT_BOOST * 1.2 * intensity) * PARTICLE_MULTIPLIER)
  );

  // Use impact direction as cone center
  let baseAngle = random(TWO_PI);
  if (impact && (impact.vx || impact.vy)) {
    baseAngle = Math.atan2(impact.vy, impact.vx);
  }
  const cone = lerp(PI / 2, PI / 6, intensity); // narrower on strong hits

  for (let i = 0; i < count; i++) {
    const angle = baseAngle + random(-cone, cone);
    const speed = lerp(PARTICLE_SPEED_MIN, PARTICLE_SPEED_MAX * 1.2, intensity) * (0.9 + random() * 0.7);
    const vx = Math.cos(angle) * (speed / 1000);
    const vy = Math.sin(angle) * (speed / 1000);
    const size = random(PARTICLE_SIZE_MIN, PARTICLE_SIZE_MAX * 1.2) * PARTICLE_MULTIPLIER;
    const colorHex = pickParticleColor();
    const life = PARTICLE_LIFE_MS * (1.0 + random() * 0.6);
    const shape = random() < 0.25 ? "diamond" : "square";

    state.particles.push({
      x: center.x + random(-baseRadius * 0.06, baseRadius * 0.06),
      y: center.y + random(-baseRadius * 0.06, baseRadius * 0.06),
      vx,
      vy,
      size,
      colorHex,
      bornAt: millis(),
      life,
      shape,
      angle: random(TWO_PI) * 0.2,
      swirl: random() < 0.2,
      swirlOmega: (random(-0.6, 0.6) / 1000)
    });
  }
}

function spawnStyleCluster(state, center, baseRadius, intensity) {
  const count = Math.max(
    1,
    Math.round((PARTICLE_COUNT_BASE * 1.2 + PARTICLE_COUNT_BOOST * 0.8 * (0.5 + intensity)) * PARTICLE_MULTIPLIER)
  );
  const clusterRadius = baseRadius * 0.08;

  for (let i = 0; i < count; i++) {
    const angle = random(TWO_PI);
    const speed = lerp(PARTICLE_SPEED_MIN * 0.5, PARTICLE_SPEED_MAX * 0.7, intensity) * (0.5 + random() * 0.7);
    const vx = Math.cos(angle) * (speed / 1000);
    const vy = Math.sin(angle) * (speed / 1000);
    const size = random(PARTICLE_SIZE_MIN * 0.8, PARTICLE_SIZE_MAX * 1.4) * PARTICLE_MULTIPLIER;
    const colorHex = pickParticleColor();
    const life = PARTICLE_LIFE_MS * (0.8 + random() * 0.9);
    const shape = random() < 0.15 ? "cross" : random() < 0.3 ? "diamond" : "square";

    state.particles.push({
      x: center.x + random(-clusterRadius, clusterRadius),
      y: center.y + random(-clusterRadius, clusterRadius),
      vx,
      vy,
      size,
      colorHex,
      bornAt: millis(),
      life,
      shape,
      angle: random(TWO_PI) * 0.3,
      swirl: random() < 0.15,
      swirlOmega: (random(-0.8, 0.8) / 1000)
    });
  }
}

function spawnStyleRing(state, center, baseRadius, intensity) {
  // Discrete ring made of square pixels that expand and fade
  const ringCount = Math.max(8, Math.round((12 + 28 * intensity) * PARTICLE_MULTIPLIER));
  const ringRadius = baseRadius * (0.7 + 0.3 * intensity);
  const ringSpeed = lerp(50, 220, intensity) / 1000; // px per ms outward
  const life = PARTICLE_LIFE_MS * (0.7 + 0.6 * intensity);

  for (let i = 0; i < ringCount; i++) {
    const angle = (i / ringCount) * TWO_PI + random(-0.08, 0.08);
    const x = center.x + Math.cos(angle) * ringRadius;
    const y = center.y + Math.sin(angle) * ringRadius;
    const vx = Math.cos(angle) * ringSpeed * (0.6 + random() * 0.8);
    const vy = Math.sin(angle) * ringSpeed * (0.6 + random() * 0.8);
    const size = random(PARTICLE_SIZE_MIN, PARTICLE_SIZE_MAX * 1.1) * PARTICLE_MULTIPLIER;
    const colorHex = pickParticleColor();
    const shape = random() < 0.2 ? "diamond" : "square";

    state.particles.push({
      x,
      y,
      vx,
      vy,
      size,
      colorHex,
      bornAt: millis(),
      life,
      shape,
      angle: 0,
      swirl: false
    });
  }
}

function drawStatusMessage(message) {
  push();
  fill("#f5f5f5");
  textAlign(CENTER, CENTER);
  textSize(24);
  text(message, width / 2, height / 2);
  pop();
}

function drawAudioStatus() {
  const message = getAudioStatusMessage();
  if (!message) return;

  push();
  fill("#f5f5f5");
  textAlign(LEFT, BOTTOM);
  textSize(16);
  text(message, 18, height - 18);
  pop();
}

function getAudioStatusMessage() {
  if (audioLoadError) {
    return "Audio error. Check console for details.";
  }

  if (!drumSamplesLoaded) {
    return "Loading drum sounds...";
  }

  const state = getAudioState();
  if (state === "suspended") {
    return "Click or tap once to enable sound.";
  }

  return "";
}

function handleKeyToggle(e) {
  // Use p5 global `key` for convenience
  const k = (key || "").toString();
  if (k === "0") EFFECT_MODE = "random";
  if (k === "1") EFFECT_MODE = "burst";
  if (k === "2") EFFECT_MODE = "spray";
  if (k === "3") EFFECT_MODE = "cluster";
  if (k === "4") EFFECT_MODE = "ring";
  if (k === "S" || k === "s") SPARKLES_ENABLED = !SPARKLES_ENABLED;
  if (k === "B" || k === "b") ADD_BLEND = !ADD_BLEND;
  if (k === "]") PARTICLE_MULTIPLIER = min(3, PARTICLE_MULTIPLIER + 0.1);
  if (k === "[") PARTICLE_MULTIPLIER = max(0.5, PARTICLE_MULTIPLIER - 0.1);
}
