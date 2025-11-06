# Project Structure Diagram
## Interactive Visual Drum Kit - Architecture Visualization

This document provides diagrams and content for **Slide 3: Project Structure & Architecture** in your Keynote presentation.

---

## MAIN ARCHITECTURE DIAGRAM

```
┌─────────────────────────────────────────────────────────┐
│                    WEBCAM INPUT                         │
│                   (1280 × 720)                          │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│                  tracker.js                             │
│          MediaPipe Hands Integration                    │
│  • Captures video frames                               │
│  • Detects up to 2 hands                               │
│  • Returns 21 landmarks per hand (normalized 0-1)      │
│  • Runs continuously via requestAnimationFrame         │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ Hand landmarks (x, y, z)
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│                    sketch.js                            │
│              MAIN ORCHESTRATOR (1,170 lines)            │
│  ┌───────────────────────────────────────────────────┐ │
│  │ Drawing Loop:                                     │ │
│  │ • Convert landmarks to pixel coordinates         │ │
│  │ • Draw skeletal hand overlay                     │ │
│  │ • Draw 4 drum circles                            │ │
│  │ • Update & render particles                      │ │
│  │ • Apply shader effects                           │ │
│  └───────────────────────────────────────────────────┘ │
└───┬─────────────┬──────────────┬──────────────┬─────────┘
    │             │              │              │
    │             │              │              │
    ▼             ▼              ▼              ▼
┌────────┐  ┌──────────┐  ┌──────────┐  ┌─────────────────┐
│hitmap  │  │ audio.js │  │ sound.js │  │  WEBGL SHADERS  │
│  .js   │  │          │  │          │  │                 │
└────────┘  └──────────┘  └──────────┘  └─────────────────┘
    │             │              │              │
    │             │              │              │
    ▼             ▼              ▼              ▼
┌────────┐  ┌──────────┐  ┌──────────┐  ┌─────────────────┐
│Collision│  │ 4 Drum   │  │Microphone│  │ pixelate.vert   │
│Detection│  │ Samples  │  │   FFT    │  │ (Vertex)        │
│         │  │ (M4A)    │  │ 1024-pt  │  │                 │
│Velocity │  │          │  │          │  │ pixelate.frag   │
│≥500px/s │  │• Kick    │  │• Bass    │  │ (Fragment)      │
│Required │  │• Snare   │  │• Mid     │  │ 143 lines       │
│         │  │• Tom     │  │• Treble  │  │                 │
│         │  │• Hi-Hat  │  │          │  │• Pixelation     │
│         │  │          │  │          │  │• Color grading  │
│         │  │Web Audio │  │AnalyserNode│ │• Posterization │
│         │  │   API    │  │          │  │• RGB glitch     │
└────────┘  └──────────┘  └──────────┘  └─────────────────┘
```

---

## DATA FLOW DIAGRAM

```
USER INTERACTION FLOW:
┌──────────┐
│   User   │
│  Moves   │
│  Hand    │
└────┬─────┘
     │
     ▼
┌─────────────────┐
│ MediaPipe       │ → 21 landmarks × 2 hands
│ Hands Tracking  │   (x, y, z) normalized
└────┬────────────┘
     │
     ▼
┌─────────────────┐
│ sketch.js       │ → Convert to pixels
│ Coordinate      │   (x × width, y × height)
│ Transformation  │
└────┬────────────┘
     │
     ▼
┌─────────────────┐
│ hitmap.js       │ → Is fingertip inside drum?
│ Check index     │   Speed ≥ 500 px/s?
│ fingertip #8    │
└────┬────────────┘
     │
     ├─── YES ──┐
     │          ▼
     │     ┌────────────┐
     │     │ Trigger    │
     │     │ Hit!       │
     │     └────┬───────┘
     │          │
     │          ├──────────────────┐
     │          │                  │
     │          ▼                  ▼
     │     ┌────────────┐     ┌──────────┐
     │     │ audio.js   │     │ Visual   │
     │     │ Play drum  │     │ Feedback │
     │     │ sample     │     └──────────┘
     │     └────────────┘          │
     │          │                  │
     │          ▼                  ▼
     │     ┌────────────┐     ┌──────────┐
     │     │ sound.js   │     │• Drum    │
     │     │ Analyse    │     │  highlight│
     │     │ frequency  │     │• Particle│
     │     └────┬───────┘     │  burst   │
     │          │             └──────────┘
     │          ▼
     │     ┌────────────┐
     │     │ Shader     │
     │     │ Effects    │
     │     │ React to   │
     │     │ Audio      │
     │     └────────────┘
     │
     └─── NO ──→ Continue tracking


VISUAL EFFECTS PIPELINE:
┌──────────────┐
│ Video Feed   │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Draw hands   │
│ + drums      │
│ + particles  │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Copy to      │
│ texture      │
└──────┬───────┘
       │
       ▼
┌──────────────────────┐
│ Vertex Shader        │
│ (pixelate.vert)      │
│ • Pass through       │
│ • Setup UV coords    │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│ Fragment Shader      │
│ (pixelate.frag)      │
│ • Pixelate           │
│ • Posterize          │
│ • Color palette map  │
│ • HSV manipulation   │
│ • RGB glitch         │
│ • Scanlines          │
└──────┬───────────────┘
       │
       ▼
┌──────────────┐
│ Final render │
│ to screen    │
└──────────────┘
```

---

## FILE STRUCTURE & RESPONSIBILITIES

```
p5js_homework/
│
├── index.html                    Entry point, loads libraries
│   • Includes p5.js, p5.sound
│   • Includes MediaPipe Hands CDN
│   • Creates canvas container
│
├── sketch.js (1,170 lines)       Main orchestrator
│   • setup() - Initialize canvas, shaders, drums
│   • draw() - Main render loop
│   • Particle system (4 styles)
│   • Drum visualization
│   • Hand landmark rendering
│   • Shader pipeline management
│   • Keyboard controls
│
├── tracker.js                    MediaPipe integration
│   • initTracker() - Setup MediaPipe Hands
│   • getHands() - Returns current hand data
│   • Manages webcam stream
│   • 21 landmarks per hand
│
├── hitmap.js                     Collision detection
│   • checkHit() - Is point inside drum?
│   • Velocity calculation
│   • 500 px/s threshold logic
│   • Previous position tracking
│
├── audio.js                      Drum sample playback
│   • loadDrumSamples() - Preload M4A files
│   • playDrum(type) - Trigger specific drum
│   • Web Audio API buffer management
│
├── sound.js (10KB)               Microphone analysis
│   • initMic() - Setup microphone input
│   • analyse() - FFT processing
│   • Frequency band extraction:
│     - Bass: 40-180 Hz
│     - Mid: 180-2000 Hz
│     - Treble: 2000-6000 Hz
│   • Exponential decay (220ms)
│
└── assets/
    ├── pixelate.vert             Vertex shader (pass-through)
    ├── pixelate.frag (143 lines) Fragment shader (main effects)
    ├── Kick.m4a                  Bass drum sample
    ├── Snare.m4a                 Snare drum sample
    ├── Tom.m4a                   Tom drum sample
    └── HiHat.m4a                 Hi-hat cymbal sample
```

---

## MODULE INTERACTION MATRIX

| Module | Calls → | Called by ← | Data Provided | Purpose |
|--------|---------|-------------|---------------|---------|
| **index.html** | sketch.js | — | DOM container | Entry point |
| **sketch.js** | tracker, hitmap, audio, sound, shaders | — | Orchestration | Main loop |
| **tracker.js** | MediaPipe API | sketch.js | Hand landmarks | Vision |
| **hitmap.js** | — | sketch.js | Collision boolean | Detection |
| **audio.js** | Web Audio API | sketch.js | Audio playback | Sound |
| **sound.js** | Web Audio API | sketch.js | FFT data | Analysis |
| **Shaders** | — | sketch.js | Visual effects | GPU rendering |

---

## KEY ARCHITECTURAL DECISIONS

### 1. **Modular Separation**
Each file has a single, clear responsibility:
- `tracker.js` = Vision
- `hitmap.js` = Physics
- `audio.js` = Playback
- `sound.js` = Analysis
- `sketch.js` = Coordination

**Benefit:** Easy to debug, test, and extend individual components.

### 2. **GPU Offloading**
Heavy pixel processing (pixelation, color grading) happens in WebGL shaders.

**Benefit:** Maintains 60 FPS even with complex effects.

### 3. **Hybrid Audio System**
- `audio.js` = Drum sample playback (consistent, controllable)
- `sound.js` = Microphone FFT (live environment reactivity)

**Benefit:** Visuals react to both synthetic drums AND ambient sound.

### 4. **Velocity-Based Triggering**
Requires fast motion (≥500 px/s) to trigger drums.

**Benefit:** Prevents accidental hits, feels intentional like real drumming.

### 5. **Graceful Degradation**
- If WebGL unavailable → CPU-based downsampling
- If microphone denied → Use synthetic impulses from `audio.js`
- If MediaPipe fails → Show error, don't crash

**Benefit:** Works on more devices, better user experience.

---

## PERFORMANCE OPTIMIZATIONS

| Optimization | Implementation | Impact |
|--------------|----------------|--------|
| **Particle Cap** | Max 160 per drum | Prevents slowdown on long sessions |
| **pixelDensity(1)** | Avoid 2× retina rendering | 4× fewer pixels to process |
| **Single-pass Shader** | All effects in one fragment shader | Reduces texture reads |
| **Frame-adjusted Physics** | `pow(damping, deltaTime/16.67)` | Consistent physics at any FPS |
| **Efficient Collision** | Distance check only on fingertip #8 | Avoid checking all 21 landmarks |

---

## TECHNOLOGY STACK

```
┌─────────────────────────────────────┐
│         Frontend Stack              │
├─────────────────────────────────────┤
│ • p5.js 1.4+         (Canvas/WebGL) │
│ • p5.sound           (Audio/FFT)    │
│ • MediaPipe Hands    (CV Library)   │
│ • WebGL Shaders      (GPU Effects)  │
│ • Web Audio API      (Synthesis)    │
└─────────────────────────────────────┘

No backend required - fully client-side!
```

---

## VISUAL SUGGESTIONS FOR KEYNOTE SLIDE

### Layout Option 1: Vertical Flow
```
┌──────────────────────────────────┐
│  [Webcam Icon]                   │
│       ↓                          │
│  [MediaPipe/tracker.js]          │
│       ↓                          │
│  [sketch.js - main loop]         │
│    ↙    ↓     ↘                  │
│ [hitmap] [audio] [sound]         │
│             ↓                    │
│      [Shaders/GPU]               │
└──────────────────────────────────┘
```

### Layout Option 2: Circular/Hub
```
        ┌──────────┐
        │ sketch.js│ ← Center hub
        │  (Main)  │
        └────┬─────┘
      ┌──────┼──────┬──────┐
      │      │      │      │
   tracker hitmap audio sound
      │      │      │      │
      └──────┴──────┴──────┘
           Modules
```

### Layout Option 3: Layer Stack (Recommended for Keynote)
```
┌────────────────────────────────────┐ Layer 5: Output
│        Final Render                │
├────────────────────────────────────┤ Layer 4: Effects
│    Shaders (pixelate.frag)         │
├────────────────────────────────────┤ Layer 3: Drawing
│    sketch.js (particles, drums)    │
├────────────────────────────────────┤ Layer 2: Logic
│  hitmap + audio + sound            │
├────────────────────────────────────┤ Layer 1: Input
│    tracker.js (MediaPipe)          │
├────────────────────────────────────┤ Layer 0: Source
│        Webcam Feed                 │
└────────────────────────────────────┘
```

---

## COLOR CODING FOR DIAGRAM (Match Your App Aesthetic)

- **Webcam/Input:** Cool blue (#4A90E2)
- **Tracking/Vision:** Cyan (#00CED1)
- **Logic/Physics:** Magenta (#FF006E)
- **Audio:** Orange (#FF6B35)
- **Visuals/Shaders:** Pink/Coral (#FF8FA3)
- **Main Loop:** Teal (#008080)

This matches your app's color palette and creates visual consistency!

---

## KEY TALKING POINTS FOR SLIDE 3

1. **"The architecture is modular - each file has one job."**
   - Point to the diagram showing separation

2. **"sketch.js is the conductor, coordinating all modules."**
   - Emphasize centralized control

3. **"Heavy effects run on the GPU through shaders."**
   - Explain why performance stays smooth

4. **"Audio is hybrid: playback + live mic analysis."**
   - This is unique and worth highlighting

5. **"Graceful degradation ensures it works on more devices."**
   - Shows thoughtful engineering

---

Use this content to create a clean, visual Slide 3 in Keynote!
