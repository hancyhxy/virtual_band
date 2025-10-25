// p5js_homework/hitmap.js
// Purpose: Provide reusable helpers for detecting drum hits in canvas coordinates.
// Not for: Handling drawing, UI updates, or MediaPipe hand tracking logic.

/**
 * Checks whether a point is inside a circular drum hit area.
 * @param {{x: number, y: number}|null} point - The point to test in canvas pixels.
 * @param {{center: {x: number, y: number}, radius: number}|null} drum - Shape data describing the drum.
 * @returns {boolean}
 */
export function isInside(point, drum) {
  if (!point || !drum || !drum.center) return false;

  const dx = point.x - drum.center.x;
  const dy = point.y - drum.center.y;
  const radius = drum.radius ?? 0;

  return dx * dx + dy * dy <= radius * radius;
}

/**
 * Decides if a hit should trigger based on edge detection and movement speed.
 * @param {boolean} prevInside - Whether the finger was inside the hit area last frame.
 * @param {boolean} currInside - Whether the finger is inside the hit area this frame.
 * @param {number} speedPxPerSec - Finger speed measured in pixels per second.
 * @param {number} threshold - Minimum speed required to count as a hit.
 * @returns {boolean}
 */
export function shouldTrigger(prevInside, currInside, speedPxPerSec, threshold) {
  if (!threshold || threshold <= 0) return false;

  const enteredThisFrame = !prevInside && currInside;
  if (!enteredThisFrame) return false;

  return speedPxPerSec >= threshold;
}
