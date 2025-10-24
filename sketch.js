// p5js_homework/sketch.js
// Purpose: Create a p5.js canvas that fills the viewport, shows the webcam feed, and overlays hand landmarks.
// Not for: Configuring MediaPipe Hands itself or handling browser permission prompts.

import { initTracker, getLandmarks } from "./tracker.js";

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
    drawStatusMessage("Camera error: " + trackerError.message);
    return;
  }

  if (!trackerReady) {
    drawStatusMessage("Starting camera...");
    return;
  }

  const hands = getLandmarks();

  if (!hands || hands.length === 0) {
    drawStatusMessage("Show your hands to the camera.");
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

function drawStatusMessage(message) {
  push();
  fill("#f5f5f5");
  textAlign(CENTER, CENTER);
  textSize(24);
  text(message, width / 2, height / 2);
  pop();
}
