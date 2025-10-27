// assets/pixelate.vert
// Vertex shader compatible with p5 WEBGL transform pipeline.
// Uses p5's projection and model-view matrices so regular pixel units work
// with calls like rect(0,0,width,height) on a WEBGL graphics buffer.

precision mediump float;

attribute vec3 aPosition;
attribute vec2 aTexCoord;
varying vec2 vTexCoord;

// p5.js provides these uniforms in WEBGL mode
uniform mat4 uProjectionMatrix;
uniform mat4 uModelViewMatrix;

void main() {
  vTexCoord = aTexCoord;
  gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(aPosition, 1.0);
}
