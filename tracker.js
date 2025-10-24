// p5js_homework/tracker.js
// Purpose: Initialize MediaPipe Hands, keep the newest landmarks for up to two hands, and share them with other modules.
// Not for: Rendering visuals or handling any p5.js drawing logic.

let handsInstance = null;
let videoElement = null;
let latestLandmarks = [];
let isProcessing = false;

/**
 * Prepare the webcam stream and start the MediaPipe Hands runner.
 * @param {HTMLVideoElement} inputVideoElement - The video element that displays the webcam preview.
 */
export async function initTracker(inputVideoElement) {
  if (!inputVideoElement) {
    throw new Error("Video element is required for the hand tracker.");
  }

  videoElement = inputVideoElement;
  videoElement.autoplay = true;
  videoElement.playsInline = true; // keep the video inside the page on iOS Safari
  videoElement.muted = true; // make sure autoplay is not blocked

  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    throw new Error("This browser does not support getUserMedia.");
  }

  handsInstance = new Hands({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
  });

  handsInstance.setOptions({
    maxNumHands: 2,
    modelComplexity: 1,
    minDetectionConfidence: 0.6,
    minTrackingConfidence: 0.5
  });

  handsInstance.onResults((results) => {
    latestLandmarks = results.multiHandLandmarks || [];
  });

  const stream = await navigator.mediaDevices.getUserMedia({
    video: { width: 1280, height: 720 }
  });

  videoElement.srcObject = stream;
  await videoElement.play().catch((error) => {
    console.warn("Autoplay failed, will rely on user interaction:", error);
  });

  const handleCanPlay = () => {
    if (!isProcessing) {
      isProcessing = true;
      requestAnimationFrame(processFrame);
    }
  };

  if (videoElement.readyState >= HTMLMediaElement.HAVE_ENOUGH_DATA) {
    handleCanPlay();
  } else {
    videoElement.addEventListener("loadeddata", handleCanPlay, { once: true });
  }
}

/**
 * Return the latest hand landmarks detected by MediaPipe Hands.
 * @returns {Array<Array<{x:number, y:number, z:number}>>}
 */
export function getLandmarks() {
  return latestLandmarks;
}

async function processFrame() {
  if (!handsInstance || !videoElement) {
    isProcessing = false;
    return;
  }

  if (videoElement.readyState >= HTMLMediaElement.HAVE_ENOUGH_DATA) {
    try {
      await handsInstance.send({ image: videoElement });
    } catch (error) {
      console.error("MediaPipe Hands failed to process a frame:", error);
    }
  }

  requestAnimationFrame(processFrame);
}
