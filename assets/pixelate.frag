// assets/pixelate.frag
// Pixelation + cool-to-warm palette remap with optional subtle RGB split and scanlines.
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
uniform float u_saturationBoost; // 0..2.2 extra saturation
uniform float u_hueShiftDeg;     // -36..36 hue rotation in degrees
uniform float u_vividness;       // 0..1.3 brightness lift
uniform float u_colorFlash;      // 0..1.2 mix toward highlight color
uniform float u_paletteProgress; // 0..1 stage blend from cool teal to warm pink/orange

varying vec2 vTexCoord;

// Hash-based noise for mild dithering/jitter; deterministic per block
float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 345.45));
  p += dot(p, p + 34.345);
  return fract(p.x * p.y);
}

vec3 rgb2hsv(vec3 c) {
  vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
  vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
  vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
  float d = q.x - min(q.w, q.y);
  float e = 1.0e-10;
  return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
}

vec3 hsv2rgb(vec3 c) {
  vec3 rgb = clamp(abs(mod(c.x * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
  return c.z * mix(vec3(1.0), rgb, c.y);
}

vec3 stageBlend(float lum, vec3 shadow, vec3 mid, vec3 highlight) {
  float easedShadow = smoothstep(0.0, 0.45, lum);
  float easedHighlight = smoothstep(0.45, 1.0, lum);
  vec3 base = mix(shadow, mid, easedShadow);
  return mix(base, highlight, easedHighlight);
}

vec3 stagePalette0(float lum) {
  return stageBlend(lum,
    vec3(0.00, 0.32, 0.52), // vivid teal shadow
    vec3(0.00, 0.70, 0.78), // saturated aqua
    vec3(0.42, 1.00, 0.96)  // electric cyan
  );
}

vec3 stagePalette1(float lum) {
  return stageBlend(lum,
    vec3(0.05, 0.09, 0.34), // indigo shadow
    vec3(0.30, 0.34, 0.70), // mid blue-violet
    vec3(0.73, 0.58, 0.98)  // lilac highlight
  );
}

vec3 stagePalette2(float lum) {
  return stageBlend(lum,
    vec3(0.54, 0.12, 0.32), // magenta shadow
    vec3(0.93, 0.30, 0.56), // pink midtone
    vec3(1.00, 0.66, 0.28)  // peach highlight
  );
}

vec3 applyPalette(vec3 col) {
  float lum = dot(col, vec3(0.299, 0.587, 0.114));
  float stage = clamp(u_paletteProgress, 0.0, 1.0);

  vec3 coolStage = stagePalette0(lum);
  vec3 midStage = stagePalette1(lum);
  vec3 warmStage = stagePalette2(lum);

  float midBlend = smoothstep(0.25, 0.6, stage);
  float warmBlend = smoothstep(0.65, 0.95, stage);

  vec3 mix01 = mix(coolStage, midStage, midBlend);
  return mix(mix01, warmStage, warmBlend);
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

  // Cool-to-warm palette remap
  col = applyPalette(col);

  // Audio-reactive adjustments: saturation, hue swing, and vividness lift
  vec3 hsv = rgb2hsv(col);
  float satBoost = clamp(u_saturationBoost, 0.0, 2.2);
  hsv.y = clamp(hsv.y * (1.0 + satBoost), 0.0, 1.0);
  float hueShift = clamp(u_hueShiftDeg / 360.0, -0.5, 0.5);
  hsv.x = fract(hsv.x + hueShift + 1.0);
  float vivid = clamp(u_vividness, 0.0, 1.3);
  hsv.z = clamp(hsv.z * (1.0 + vivid * 0.35), 0.0, 1.0);
  col = hsv2rgb(hsv);

  float flash = clamp(u_colorFlash, 0.0, 1.2);
  if (flash > 0.001) {
    vec3 flashColor = vec3(1.0, 0.92, 0.45);
    col = mix(col, flashColor, flash * 0.65);
    col = mix(col, vec3(1.0), flash * 0.25);
  }

  // Mild scanlines for texture
  if (u_scanlineAmt > 0.0) {
    float line = 0.5 + 0.5 * sin((frag.y + 0.5) * 3.14159);
    col *= mix(1.0, 0.8 + 0.2 * line, clamp(u_scanlineAmt, 0.0, 1.0));
  }

  gl_FragColor = vec4(col, 1.0);
}
