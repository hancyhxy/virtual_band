// assets/pixelate.frag
// Pixelation + pink/orange palette remap with optional subtle RGB split and scanlines.
// Designed for use with p5.js (createGraphics WEBGL + shader).

precision mediump float;

uniform sampler2D tex0;
uniform vec2 u_resolution;     // screen/canvas resolution in pixels
uniform float u_time;          // seconds
uniform float u_pixelSize;     // block size in screen pixels (>= 1)
uniform float u_posterizeSteps;// color posterization steps (>= 1)
uniform float u_glitchAmt;     // 0..1, mild channel offset/jitter
uniform float u_scanlineAmt;   // 0..1, scanline darkening
uniform float u_flipX;         // mirror horizontally (to match preview) 0.0 or 1.0

varying vec2 vTexCoord;

// Hash-based noise for mild dithering/jitter; deterministic per block
float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 345.45));
  p += dot(p, p + 34.345);
  return fract(p.x * p.y);
}

vec3 applyPalette(vec3 col) {
  // Map luminance to a warm pink/orange ramp.
  // Three anchors blended by luminance for vibrant but readable tones.
  float l = dot(col, vec3(0.299, 0.587, 0.114));
  vec3 c0 = vec3(0.96, 0.10, 0.45); // deep magenta-pink
  vec3 c1 = vec3(1.00, 0.35, 0.35); // hot pink
  vec3 c2 = vec3(1.00, 0.55, 0.00); // orange
  // Smooth 2-stop blend: [0..0.6] blend c0->c1, [0.6..1] c1->c2
  float t = clamp(l, 0.0, 1.0);
  vec3 mid = mix(c0, c1, smoothstep(0.0, 0.6, t));
  vec3 outCol = mix(mid, c2, smoothstep(0.55, 1.0, t));
  return outCol;
}

void main() {
  // Pixelate in screen space so the block size is in device pixels
  vec2 frag = vTexCoord * u_resolution; // pixel coordinates
  float px = max(u_pixelSize, 1.0);
  vec2 block = floor(frag / px) * px + px * 0.5;

  // Mirror horizontally if requested
  vec2 uv = block / u_resolution;
  if (u_flipX > 0.5) uv.x = 1.0 - uv.x;

  // Mild RGB split driven by jitter per row and time
  float rowJitter = (hash21(vec2(0.0, block.y)) - 0.5);
  float jitter = u_glitchAmt * 0.003; // in UV units
  vec2 offs = vec2(jitter * rowJitter, 0.0);

  vec3 colR = texture2D(tex0, uv + offs).rgb;
  vec3 colG = texture2D(tex0, uv).rgb;
  vec3 colB = texture2D(tex0, uv - offs).rgb;
  vec3 col = vec3(colR.r, colG.g, colB.b);

  // Posterize before palette mapping for bolder shapes
  float steps = max(u_posterizeSteps, 1.0);
  col = floor(col * steps) / steps;

  // Warm palette remap (pink/orange)
  col = applyPalette(col);

  // Mild scanlines for texture
  if (u_scanlineAmt > 0.0) {
    float line = 0.5 + 0.5 * sin((frag.y + 0.5) * 3.14159);
    col *= mix(1.0, 0.8 + 0.2 * line, clamp(u_scanlineAmt, 0.0, 1.0));
  }

  gl_FragColor = vec4(col, 1.0);
}
