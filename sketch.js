// p5js_homework/sketch.js
// Purpose: Create a p5.js canvas that fills the viewport, shows the webcam feed, and overlays hand landmarks.
// Not for: Configuring MediaPipe Hands itself or handling browser permission prompts.

import { initTracker, getLandmarks } from "./tracker.js";
import { isInside, shouldTrigger } from "./hitmap.js";

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

const drumStates = DRUMS.map(() => ({
  prevInside: false,
  highlightUntil: 0
}));

const previousFingerPositions = [];

let trackerReady = false;
let trackerError = null;
let videoElementRef = null;

window.setup = () => {
  const canvas = createCanvas(windowWidth, windowHeight);
  canvas.parent(document.querySelector("main"));
  pixelDensity(1);
  noStroke();

  videoElementRef = document.getElementById("hand-video");

  initTracker(videoElementRef)
    .then(() => {
      trackerReady = true;
    })
    .catch((error) => {
      trackerError = error;
      console.error("Failed to start the hand tracker:", error);
    });
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
        fingerStates[handIndex] = { tip: null, speedPxPerSec: 0 };
        previousFingerPositions[handIndex] = null;
        return;
      }

      const tipPosition = convertToCanvasCoordinates(fingerTip);
      const previousTip = previousFingerPositions[handIndex];
      let speedPxPerSec = 0;

      if (previousTip && deltaTime > 0) {
        const dx = tipPosition.x - previousTip.x;
        const dy = tipPosition.y - previousTip.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const seconds = deltaTime / 1000;
        if (seconds > 0) {
          speedPxPerSec = distance / seconds;
        }
      }

      fingerStates[handIndex] = {
        tip: tipPosition,
        speedPxPerSec
      };
      previousFingerPositions[handIndex] = tipPosition;
    });

    previousFingerPositions.length = hands.length;
  } else {
    previousFingerPositions.length = 0;
  }

  updateDrumStates(fingerStates);

  drawDrums();

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
};

function drawVideoFrame() {
  if (!videoElementRef) return;

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

    fingerStates.forEach((finger) => {
      if (!finger || !finger.tip) return;

      if (isInside(finger.tip, hitArea)) {
        currInside = true;
        if (finger.speedPxPerSec > maxSpeed) {
          maxSpeed = finger.speedPxPerSec;
        }
      }
    });

    const state = drumStates[index];
    const triggered = shouldTrigger(state.prevInside, currInside, maxSpeed, HIT_SPEED_THRESHOLD);

    if (triggered) {
      state.highlightUntil = now + HIGHLIGHT_DURATION_MS;
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

    noStroke();
    fill(isHighlighted ? "#ff006e" : "#1d3557");
    textSize(max(12, radius * 0.55));
    text(drum.id, x, y);
  });
  pop();
}

function drawStatusMessage(message) {
  push();
  fill("#f5f5f5");
  textAlign(CENTER, CENTER);
  textSize(24);
  text(message, width / 2, height / 2);
  pop();
}
