# Screenshot Guide for Presentation
## Interactive Visual Drum Kit - Visual Assets Checklist

This guide tells you exactly what screenshots to capture for your 6-slide Keynote presentation.

---

## PREPARATION

### Before You Start:
1. **Run your project** - Open `index.html` in a browser (Chrome recommended)
2. **Allow permissions** - Grant webcam and microphone access
3. **Good lighting** - Make sure your hands are well-lit and visible
4. **Clean background** - Minimize distractions behind you
5. **Screenshot tool ready**:
   - **Mac:** `Cmd + Shift + 4` (drag to select area) or `Cmd + Shift + 3` (full screen)
   - **Windows:** `Windows + Shift + S` or Snipping Tool
6. **Create a folder** - `/screenshots/` to organize your images

### Recommended Screenshot Sizes:
- **Full canvas:** Capture entire p5.js canvas
- **Detail shots:** Zoom in on specific features
- **High resolution:** Use at least 1920×1080 for crisp Keynote slides

---

## SLIDE 1: Title + Concept

### Screenshots Needed: 1-2

**Screenshot 1A: Hero Image (Full Canvas, Inactive State)**
- **When to capture:** Right after setup, before any drumming
- **What to show:**
  - Your hands visible with skeletal tracking
  - All 4 drums clearly visible
  - Clean, calm color palette (cool teal/indigo)
  - No particles or glitch effects yet
- **Purpose:** Background for title slide
- **Filename:** `01_hero_calm.png`

**Screenshot 1B: Hero Image (Full Canvas, Active State) - OPTIONAL**
- **When to capture:** While actively drumming
- **What to show:**
  - Hands hitting drums
  - Particle bursts visible
  - Warm color palette (pink/orange)
  - Visual energy
- **Purpose:** Alternative dynamic background
- **Filename:** `01_hero_active.png`

**Note:** For Slide 1, you'll mainly use the **30-second video** (created separately). These screenshots are backup or for the slide background before video plays.

---

## SLIDE 2: Development Journey - Six Stages

### Screenshots Needed: 6 (one per development stage)

**Screenshot 2A: Stage 1 - Hand Tracking Foundation**
- **What to show:**
  - Skeletal hand overlay with blue bones and magenta joints
  - Clear visibility of 21 landmarks
  - Index fingertip highlighted
  - NO drums or effects visible (if possible, or muted)
- **How to capture:** Hide drums temporarily or crop to focus on hand tracking
- **Filename:** `02_stage1_tracking.png`

**Screenshot 2B: Stage 2 - Drum Interface Design**
- **What to show:**
  - All 4 drums clearly visible
  - Labels or colors showing each drum type
  - Strategic positioning (Kick bottom, Snare left, Tom right, Hi-Hat top)
  - Minimal effects
- **How to capture:** Static moment, no hits
- **Filename:** `02_stage2_drums.png`

**Screenshot 2C: Stage 3 - Smart Hit Detection**
- **What to show:**
  - Hand approaching or touching a drum
  - Drum highlighting (pink stroke, 1.15× scale)
  - Visual indication of velocity/motion
  - Maybe motion blur or multiple hand positions (if you can composite)
- **How to capture:** Moment of hit detection
- **Filename:** `02_stage3_hit_detection.png`

**Screenshot 2D: Stage 4 - Connect Gesture to Audio**
- **What to show:**
  - Hand hitting drum with drum highlighting
  - Visual indication that sound is being triggered
  - OR: Screenshot of your code showing the connection between hit detection and audio playback
  - OR: Diagram showing gesture → audio connection flow
- **How to capture:** Moment of drum hit or code screenshot
- **Filename:** `02_stage4_gesture_audio.png`

**Screenshot 2E: Stage 5 - Pixel Effects (Visual Only)**
- **What to show:**
  - Reactive bouncing pixels when drum is hit
  - Orange-pink pixel style filter visible
  - Particle bursts in action
  - Pixelated background aesthetic
  - No glitch effects yet (this comes in Stage 6)
- **How to capture:** During drum hit, focus on pixel effects
- **Filename:** `02_stage5_pixel_effects.png`

**Screenshot 2F: Stage 6 - Make Sound Trigger Visual**
- **What to show:**
  - Full audio-visual integration
  - Global pixel effects responding to sound intensity
  - Hi-Hat glitch effect with horizontal bands (if possible)
  - Warm color palette (pink/orange) showing sound reactivity
  - Visual difference from Stage 5 (now reacting to sound, not just hits)
- **How to capture:** During intense drumming with FFT-driven effects visible
- **Filename:** `02_stage6_sound_visual.png`

**Alternative:** Instead of 6 separate screenshots, you could create a **composite timeline image** showing all 6 stages side-by-side in Keynote.

---

## SLIDE 3: Project Structure & Architecture

### Screenshots Needed: 2-3

**Screenshot 3A: Code Structure (VS Code or Text Editor)**
- **What to show:**
  - File explorer showing all your .js files
  - Visible: `sketch.js`, `tracker.js`, `hitmap.js`, `audio.js`, `sound.js`
  - Also show `assets/` folder with shaders and drum samples
- **How to capture:** Open your project folder in VS Code, expand all folders, screenshot the sidebar
- **Filename:** `03_file_structure.png`

**Screenshot 3B: Modular Code Example (Code Snippet)**
- **What to show:**
  - Clean, well-commented code from one of your modules
  - Example: `hitmap.js` showing the velocity threshold check
  - OR: `tracker.js` showing MediaPipe integration
- **How to capture:** Open file, screenshot a key function (20-30 lines)
- **Purpose:** Show code quality
- **Filename:** `03_code_quality.png`

**Screenshot 3C: Shader Code (Optional)**
- **What to show:**
  - Fragment shader (`pixelate.frag`) showing the color grading or pixelation logic
  - Syntax-highlighted GLSL code
- **How to capture:** Open `pixelate.frag` in editor, screenshot
- **Filename:** `03_shader_code.png`

**Note:** For Slide 3, you'll primarily use **diagrams** from `project_structure_diagram.md`. These code screenshots are supplementary to show "proof of implementation."

---

## SLIDE 4: User Experience Journey

### Screenshots Needed: 6 (one per UX step)

**Screenshot 4A: Grant Permissions**
- **What to show:**
  - Browser permission dialog (webcam/microphone request)
  - OR: Your app in ready state after permissions granted
- **How to capture:** Reload page, screenshot the permission dialog before clicking "Allow"
- **Filename:** `04_ux1_permissions.png`

**Screenshot 4B: See Your Hands**
- **What to show:**
  - Hands with skeletal tracking visible
  - Blue bones, magenta joints clearly shown
  - Index fingertip highlighted
- **How to capture:** Calm state, hands in view, no drumming
- **Filename:** `04_ux2_hands.png`

**Screenshot 4C: Explore the Drums**
- **What to show:**
  - Hand hovering over a drum (NOT hitting)
  - Subtle visual feedback (glow or highlight if implemented)
  - No particles or sound triggered yet
- **How to capture:** Move hand slowly over drum without triggering
- **Filename:** `04_ux3_explore.png`

**Screenshot 4D: Strike with Intent**
- **What to show:**
  - Hand in fast motion (motion blur if visible)
  - Drum highlighting (pink stroke, enlarged)
  - Moment of impact
- **How to capture:** Fast punch motion, screenshot at peak
- **Filename:** `04_ux4_strike.png`

**Screenshot 4E: Create Your Rhythm**
- **What to show:**
  - Multiple drums recently hit (some still highlighted)
  - Particles visible from several impacts
  - Both hands visible if possible
- **How to capture:** Play a rhythm, screenshot mid-performance
- **Filename:** `04_ux5_rhythm.png`

**Screenshot 4F: Immersive Experience**
- **What to show:**
  - Full immersion: warm colors, pixelated background, particle bursts
  - Glitch effects if Hi-Hat triggered
  - Maximum visual intensity
- **How to capture:** Intense drumming moment
- **Filename:** `04_ux6_immersive.png`

---

## SLIDE 5: Visual Feedback & Engagement

### Screenshots Needed: 6-8

### Section 1: Particle System (4 screenshots)

**Screenshot 5A: Burst Style**
- **What to show:**
  - Particles radiating outward from drum impact
  - Bias toward impact direction
  - Orange/coral/teal colored squares/diamonds
- **How to capture:** Press `1` key (burst mode), hit drum, screenshot particles
- **Filename:** `05_particles_burst.png`

**Screenshot 5B: Spray Style**
- **What to show:**
  - Narrow cone of particles following hand motion
  - Directional spray effect
- **How to capture:** Press `2` key (spray mode), hit drum with motion
- **Filename:** `05_particles_spray.png`

**Screenshot 5C: Cluster Style**
- **What to show:**
  - Dense, slower-moving particles
  - Concentrated around impact point
- **How to capture:** Press `3` key (cluster mode), hit drum
- **Filename:** `05_particles_cluster.png`

**Screenshot 5D: Ring Style**
- **What to show:**
  - Expanding circular wave of particles
  - Even distribution around drum
- **How to capture:** Press `4` key (ring mode), hit drum
- **Filename:** `05_particles_ring.png`

### Section 2: Audio-Reactive Shader Effects (2 screenshots)

**Screenshot 5E: Quiet State (Cool Colors)**
- **What to show:**
  - Minimal pixelation (12px blocks)
  - Cool teal and indigo color palette
  - Low saturation
  - Calm aesthetic
- **How to capture:** Wait 2-3 seconds after last hit, screenshot
- **Filename:** `05_shader_quiet.png`

**Screenshot 5F: Intense State (Warm Colors)**
- **What to show:**
  - Heavy pixelation (22px blocks)
  - Warm pink and orange color palette
  - High saturation
  - Posterization visible (bold color shapes)
- **How to capture:** Play drums rapidly, screenshot at peak intensity
- **Filename:** `05_shader_intense.png`

### Section 3: Special Hi-Hat Glitch Effect (2 screenshots)

**Screenshot 5G: Hi-Hat Glitch - Peak**
- **What to show:**
  - Aggressive horizontal band displacement
  - Pink glitch lines
  - Video slices offset
  - Maximum disruption
- **How to capture:** Hit Hi-Hat drum (top-right), screenshot within 100ms
- **Tip:** You may need to record video and extract frame, as glitch is fast
- **Filename:** `05_glitch_hihat.png`

**Screenshot 5H: Hi-Hat Glitch - Decay**
- **What to show:**
  - Glitch effect fading (200ms in)
  - Partial bands still visible
  - Transitioning back to normal
- **How to capture:** Hit Hi-Hat, screenshot after ~200ms
- **Filename:** `05_glitch_decay.png`

### BONUS: Before/After Comparison

**Screenshot 5I: Split-Screen Comparison (Optional)**
- **What to show:**
  - Side-by-side: Quiet state vs Intense state
  - Same hand position, different audio intensity
- **How to capture:** Take two separate screenshots, composite in Keynote
- **Filename:** `05_comparison_quiet_vs_intense.png`

---

## SLIDE 6: Impact, Learning & Future Potential

### Screenshots Needed: 2-3

**Screenshot 6A: Accessible Music Creation**
- **What to show:**
  - Full setup: just a webcam, no physical equipment
  - Maybe a photo of you playing (not a screenshot, an actual photo from phone)
  - OR: Reuse hero image from Slide 1
- **Purpose:** Show simplicity and accessibility
- **Filename:** `06_accessible.png`

**Screenshot 6B: Real-Time Performance Metrics (Optional)**
- **What to show:**
  - Browser console showing FPS (60 FPS)
  - OR: Performance monitor showing smooth framerate
- **How to capture:** Open browser DevTools, show performance stats
- **Purpose:** Demonstrate technical achievement
- **Filename:** `06_performance.png`

**Screenshot 6C: Future Vision (Conceptual, Optional)**
- **What to show:**
  - Mock-up of expanded drum kit (more drums)
  - OR: Sketch of multi-user interface
  - OR: AR/VR concept art
- **How to capture:** Create in Keynote or other tool
- **Purpose:** Visualize future potential
- **Filename:** `06_future_vision.png`

**Note:** Slide 6 is mostly text-based (impact, learning, future). These screenshots are supplementary.

---

## SPECIAL CAPTURES

### For All Slides: Detail Shots

**Detail Shot 1: Hand Skeleton Close-up**
- **What:** Zoom in on hand tracking landmarks
- **Filename:** `detail_hand_skeleton.png`

**Detail Shot 2: Drum Highlight Animation**
- **What:** Sequence of drum highlighting (before, during, after hit)
- **Filename:** `detail_drum_highlight.png`

**Detail Shot 3: Particle Close-up**
- **What:** Individual particles showing shapes (squares, diamonds, crosses)
- **Filename:** `detail_particles.png`

**Detail Shot 4: Color Palette Gradient**
- **What:** Visual representation of teal → pink/orange transition
- **Filename:** `detail_color_palette.png`

---

## CAPTURE TIPS

### Timing:
- **Hit Detection:** Use rapid screenshot tool or screen recording → extract frames
- **Glitch Effects:** Record video at 60 FPS, extract specific frames
- **Particles:** Wait 0.5-1 second after hit for visible particle spread

### Composition:
- **Rule of thirds:** Place key elements (hands, drums) at intersection points
- **Negative space:** Don't overcrowd - leave breathing room
- **Focus:** Blur or darken backgrounds to highlight subject (do in Keynote)

### Quality:
- **High resolution:** 1920×1080 minimum, 4K if possible
- **No artifacts:** Ensure browser is full-screen before capturing
- **Consistent size:** Capture same area for similar screenshots

### Organization:
```
screenshots/
├── slide1/
│   ├── 01_hero_calm.png
│   └── 01_hero_active.png
├── slide2/
│   ├── 02_stage1_tracking.png
│   ├── 02_stage2_drums.png
│   ├── 02_stage3_hit_detection.png
│   ├── 02_stage4_gesture_audio.png
│   ├── 02_stage5_pixel_effects.png
│   └── 02_stage6_sound_visual.png
├── slide3/
│   ├── 03_file_structure.png
│   ├── 03_code_quality.png
│   └── 03_shader_code.png
├── slide4/
│   ├── 04_ux1_permissions.png
│   ├── 04_ux2_hands.png
│   ├── 04_ux3_explore.png
│   ├── 04_ux4_strike.png
│   ├── 04_ux5_rhythm.png
│   └── 04_ux6_immersive.png
├── slide5/
│   ├── 05_particles_burst.png
│   ├── 05_particles_spray.png
│   ├── 05_particles_cluster.png
│   ├── 05_particles_ring.png
│   ├── 05_shader_quiet.png
│   ├── 05_shader_intense.png
│   ├── 05_glitch_hihat.png
│   └── 05_glitch_decay.png
└── slide6/
    ├── 06_accessible.png
    ├── 06_performance.png
    └── 06_future_vision.png
```

---

## PRIORITY CHECKLIST

If short on time, capture these **ESSENTIAL** screenshots first:

- [ ] `01_hero_calm.png` - Title slide background
- [ ] `04_ux2_hands.png` - Hand tracking visible
- [ ] `04_ux4_strike.png` - Drum hit moment
- [ ] `04_ux6_immersive.png` - Full visual intensity
- [ ] `05_particles_burst.png` - One particle style
- [ ] `05_shader_quiet.png` - Calm state
- [ ] `05_shader_intense.png` - Intense state
- [ ] `05_glitch_hihat.png` - Hi-Hat glitch effect
- [ ] `03_file_structure.png` - Code structure

**Total: 9 essential screenshots**

Then add others as time allows for richer visual storytelling.

---

## ALTERNATIVE: SCREEN RECORDING

If capturing exact moments is difficult, consider:

1. **Record a full 2-minute session** of you playing the drums
2. **Extract frames** from the video using:
   - **Mac:** QuickTime Player → pause at desired frame → `Cmd + C` (copy frame) → paste in Preview
   - **Windows:** VLC Media Player → pause → Video → Take Snapshot
   - **Online:** Use a video frame extractor tool
3. **Benefits:**
   - Capture fast effects (glitch, particles)
   - Ensure smooth motion in screenshots
   - Get multiple options from one recording

---

## FINAL CHECK

Before creating your Keynote presentation, verify:

- [ ] All screenshots are high resolution (1920×1080+)
- [ ] Colors are vibrant and accurate (check display brightness)
- [ ] No browser UI visible (tabs, address bar) unless intentional
- [ ] Filenames are organized and descriptive
- [ ] You have backups of all screenshots
- [ ] Screenshots show variety (calm, active, different particle styles, etc.)

Good luck capturing your visuals! 🎵📸
