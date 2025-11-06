# Assignment 2C: Final Presentation Slides
## Interactive Visual Drum Kit - Keynote Presentation Content

---

## SLIDE 1: Title + Creative Concept
**Layout:** Full-screen with centered title, subtitle, and video embed

### Visual Elements:
- **Background:** Dark gradient or screenshot of the drum kit in action
- **Title:** "Interactive Visual Drum Kit"
- **Subtitle:** "Making Music Through Hand Gestures and Visual Expression"
- **Your Name**
- **30-Second Demo Video** (embedded, auto-play on slide load)
- Small text: "p5.js | MediaPipe | WebGL Shaders"

### Speaker Notes (30 seconds):
"My project is an Interactive Visual Drum Kit that transforms your webcam into a musical instrument. Instead of using a mouse or keyboard, you play drums by moving your hands through virtual drum pads. The system combines hand tracking with audio-reactive visual effects, creating an immersive experience where every gesture produces both sound and dynamic visuals. Let me show you how it works in this demo."

**[VIDEO PLAYS - 30 seconds]**

---

## SLIDE 2: Development Journey - Six Stages
**Layout:** Left side = timeline/stages, Right side = key visuals for each stage

### Content:

**Stage 1: Hand Tracking Foundation**
- Implemented real-time hand tracking with MediaPipe Hands
- Tracked 2 hands with 21 landmarks each
- Rendered skeletal visualization showing bone connections

**Stage 2: Drum Interface Design**
- Created 4 virtual drums: Kick, Snare, Tom, Hi-Hat
- Strategic drum positioning for ergonomic reach
- Designed visual hierarchy with larger bass drums

**Stage 3: Smart Hit Detection**
- Implemented velocity-based triggering (500 px/s threshold)
- Required fast "punch" motions to prevent accidental hits
- Tracked fingertip speed for intentional detection

**Stage 4: Connect Gesture to Audio**
- Linked hit detection to audio playback system
- Loaded 4 drum samples via Web Audio API
- Achieved low-latency sound triggering from gestures

**Stage 5: Pixel Effects (Visual Only)**
- Added reactive pixel animations triggered by drum hits
- Implemented orange-pink filter using WebGL shaders
- Created particle system with 4 burst styles
- Kept visual effects independent from audio

**Stage 6: Make Sound Trigger Visual**
- Connected audio to visuals through FFT analysis
- Built two-layer system: global pixels + Hi-Hat glitch
- Implemented dynamic color palette: teal → pink/orange
- Defined bass/mid/treble relationships to visual intensity

### Visual Elements:
- Timeline arrow from Stage 1 → 6
- Small screenshot or icon for each stage
- Git commit count: "Developed over 6+ commits"

### Speaker Notes (60 seconds):
"I approached this project methodically in six stages. First, I built the hand tracking foundation using MediaPipe, which detects up to 2 hands with 21 landmarks each in real-time. Second, I created the drum interface with four drums positioned for easy reach. Third, I implemented smart hit detection with a velocity threshold - this requires fast 'punch' motions and prevents accidental triggers when you're just moving your hand around. Fourth, I connected gestures to audio by linking the hit detection to Web Audio API for low-latency drum sample playback. Fifth, I added pixel effects - reactive animations and an orange-pink filter - but these were purely visual responses to drum hits, not yet linked to the actual sound. Finally, in stage six, I made sound trigger the visuals by integrating FFT analysis. This created a two-layer system: global pixel effects that respond to bass, mid, and treble frequencies, plus a special Hi-Hat glitch effect. Now the visuals truly react to the music, shifting from cool teals when quiet to warm oranges when intense."

---

## SLIDE 3: Project Structure & Architecture
**Layout:** Center = architecture diagram, Bottom = module descriptions

### Visual Elements:
**Architecture Diagram:**
```
┌─────────────┐
│   Webcam    │
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│  tracker.js     │ ← MediaPipe Hands Integration
│  (Hand Tracking)│
└──────┬──────────┘
       │
       ▼
┌─────────────────────────────────────────────┐
│           sketch.js (Main Loop)             │
│  • Drawing & Orchestration                  │
│  • Particle System                          │
│  • Shader Pipeline                          │
└───┬─────────────┬──────────────┬────────────┘
    │             │              │
    ▼             ▼              ▼
┌─────────┐  ┌─────────┐  ┌──────────────┐
│hitmap.js│  │audio.js │  │  sound.js    │
│Collision│  │ Drum    │  │ Microphone   │
│Detection│  │Playback │  │ FFT Analysis │
└─────────┘  └─────────┘  └──────────────┘
                │
                ▼
         ┌──────────────┐
         │    Shaders   │
         │ pixelate.vert│
         │ pixelate.frag│
         └──────────────┘
```

### Module Descriptions:
- **tracker.js** - Captures webcam, runs MediaPipe detection
- **hitmap.js** - Collision detection with velocity threshold
- **audio.js** - Loads and plays drum samples
- **sound.js** - FFT analysis for visual reactivity
- **sketch.js** - Main orchestrator: drawing, particles, effects
- **Shaders** - GPU-accelerated pixelation & color grading

### Key Architecture Decisions:
✓ **Modular design** - Each file has a single responsibility
✓ **Separation of concerns** - Audio, tracking, and visuals are independent
✓ **Performance-first** - WebGL shaders offload effects to GPU
✓ **Graceful degradation** - CPU fallback when WebGL unavailable

### Speaker Notes (45 seconds):
"The project uses a modular architecture with clear separation of concerns. At the top, the webcam feeds into tracker.js, which runs MediaPipe hand detection. This flows into sketch.js, the main orchestrator that handles drawing, particles, and the shader pipeline. Sketch.js coordinates with three specialized modules: hitmap.js for collision detection, audio.js for playing drum samples, and sound.js for analyzing microphone input. Finally, WebGL shaders handle the heavy visual effects on the GPU. This modular design made development easier - I could work on audio independently from visual effects, and each module has its own clear purpose."

---

## SLIDE 4: User Experience Journey
**Layout:** Step-by-step flow with screenshots/illustrations

### Content:

**1. Grant Permissions**
- User allows webcam and microphone access
- Clear visual feedback when ready

**2. See Your Hands**
- Real-time skeletal tracking appears
- Blue bones, magenta joints
- Index fingertip highlighted (the "drumstick")

**3. Explore the Drums**
- Move hand over each drum to discover placement
- Visual hover feedback (subtle glow)
- No sound until you "hit" with speed

**4. Strike with Intent**
- Fast "punch" motion triggers drum
- Drum highlights briefly (pink stroke, 1.15× scale)
- Immediate audio feedback

**5. Create Your Rhythm**
- Play patterns with one or both hands
- Visual explosion reinforces each hit
- Colors shift as music builds

**6. Immersive Experience**
- Background pixelates and warps with bass
- Particle bursts follow your hand motion
- Color palette evolves: cool → warm based on intensity

### Design Decisions for Better UX:
✓ **Velocity threshold** - Prevents frustrating accidental hits
✓ **Visual confirmation** - Every action has immediate feedback
✓ **Forgiving tracking** - Works even with partial hand visibility
✓ **Aesthetic coherence** - Effects complement, not distract

### Speaker Notes (55 seconds):
"Let me walk through the user experience. First, you grant webcam and microphone permissions. Immediately, you see your hands tracked in real-time with a blue skeletal overlay - your index fingertip becomes your drumstick. As you explore, you can move your hand over the drums without triggering them. To actually play, you need to strike with intent - a fast punching motion. This was a crucial design decision: the velocity threshold prevents accidental hits when you're just moving around, making the experience much less frustrating. When you do hit, you get three layers of feedback: the drum highlights, a sound plays, and particles explode from the impact point. As you build rhythm, the entire scene responds - the background pixelates with the bass, colors shift from cool teals to warm oranges, and the visuals create an immersive musical experience."

---

## SLIDE 5: Visual Feedback & Engagement
**Layout:** Split into 3 sections with before/after comparisons

### Section 1: Particle System
**4 Effect Styles (user can switch with keyboard 0-4):**
- **Burst** - Radiating particles biased toward impact direction
- **Spray** - Narrow cone following hand motion vector
- **Cluster** - Dense, slower-moving particles
- **Ring** - Expanding circular wave

**Particle Features:**
- Small geometric shapes: squares, diamonds, crosses
- Warm color palette: orange, coral, teal
- Occasional sparkles (white/gold highlights)
- Physics: velocity, damping, optional swirl
- Up to 160 particles per drum
- Quadratic fade-out for smooth disappearance

### Section 2: Audio-Reactive Shader Effects
**Pixelation** (reacts to bass)
- Block size: 12-22px based on bass intensity
- Creates "digital" aesthetic that pulses with rhythm

**Dynamic Color Grading** (3-stage palette)
- **Quiet:** Cool teal and indigo
- **Medium:** Balanced mix
- **Intense:** Warm pink and orange
- Smooth transitions driven by overall audio energy

**Additional Effects:**
- **Saturation boost** - Colors become more vivid with bass+mid
- **Hue rotation** - ±36° swing based on frequency balance
- **Posterization** - 2-8 color levels, higher on loud sections
- **Scanlines** - Subtle horizontal darkening for retro feel
- **RGB glitch** (Hi-Hat trigger) - Horizontal band displacement

### Section 3: Special Hi-Hat Glitch Effect
- Aggressive horizontal bands (260-400ms duration)
- Pink glitch lines slice across screen
- Video displacement creates visual "crash"
- Intensity scales with hit velocity

### Visual Elements:
- Before/after screenshots of quiet vs intense audio
- Close-up of particle burst
- Color palette gradient showing teal → pink transition
- Hi-Hat glitch screenshot

### Speaker Notes (50 seconds):
"The visual feedback creates deep engagement through three systems. First, the particle system - I designed four different burst styles that you can switch between. Particles are small geometric shapes in warm colors, and they physically simulate velocity and damping. Up to 160 particles can be active per drum. Second, audio-reactive shaders that run on the GPU. The screen pixelates with the bass, and the color palette shifts from cool teal when quiet to warm pink and orange when intense. This happens smoothly based on real-time frequency analysis. Third, a special glitch effect triggers on Hi-Hat hits - aggressive horizontal bands slice across the screen with pink glitch lines, creating a visual 'crash' that matches the sharp cymbal sound."

---

## SLIDE 6: Impact, Learning & Future Potential
**Layout:** Three columns: Impact | Learning | Future

### Impact: What This Project Achieves

**For Users:**
- **Accessible music creation** - No equipment needed beyond webcam
- **Intuitive interaction** - Natural hand gestures feel playful
- **Visual expression** - Not just hearing but seeing your music
- **Low barrier to entry** - Anyone can start drumming immediately

**Technical Achievement:**
- Combines 3 complex technologies seamlessly
- Real-time performance (60 FPS with tracking + audio + particles + shaders)
- Graceful error handling and fallbacks
- Clean, maintainable code structure

### Learning: Key Insights from Development

**What Worked Well:**
✓ Velocity-based hit detection eliminated frustration
✓ Modular architecture made debugging easier
✓ GPU shaders enabled complex effects without slowdown
✓ Audio + visual coupling created immersive experience

**Challenges Overcome:**
- MediaPipe coordinate normalization (0-1 → pixels)
- Synchronizing visual effects with audio impulses
- Balancing effect intensity (too much → overwhelming)
- Keeping particles purposeful rather than decorative

**Growth Areas:**
- Deeper understanding of WebGL shader programming
- Audio analysis and frequency band extraction
- Real-time systems with multiple moving parts
- User testing and iterative refinement

### Future Potential: Where This Could Go

**Short-term Enhancements:**
- More drums (cymbals, percussion, bass variations)
- Rhythm scoring system (timing accuracy feedback)
- Recording mode (save and playback performances)
- Preset patterns (learn by following visual guides)

**Long-term Vision:**
- Multi-user collaboration (network sync)
- Custom sound packs (electronic, orchestral, nature)
- Full-body tracking (feet for bass, hands for drums)
- AR/VR adaptation for immersive environments
- Educational tool for teaching rhythm and coordination

**Broader Impact:**
- Accessible music therapy for motor skill development
- Interactive art installations in museums
- Remote music education platform
- Live performance instrument for experimental musicians

### Speaker Notes (60 seconds):
"This project has real impact. For users, it makes music creation accessible - you don't need expensive equipment, just a webcam. The interaction feels natural and playful, and the visual expression means you're not just hearing your music but seeing it come alive. Technically, I achieved real-time performance combining hand tracking, audio synthesis, and GPU effects at 60 frames per second.

I learned a lot through challenges. The velocity-based hit detection was crucial - early versions without it were frustrating because any hand movement triggered drums. The modular architecture saved me during debugging, and GPU shaders let me add complex effects without slowdown.

Looking forward, there's huge potential. Short-term, I could add more drums, a rhythm scoring system, and recording capabilities. Long-term, this could become a collaborative platform where multiple people drum together online, or evolve into an AR/VR instrument. It could even be used for music therapy or as an interactive installation in museums. The core idea - turning gestures into audiovisual expression - has applications I'm excited to explore."

---

## PRESENTATION TIPS

### Timing (Total: 5 minutes)
- Slide 1: 30 seconds (video plays)
- Slide 2: 50 seconds (development journey)
- Slide 3: 45 seconds (architecture)
- Slide 4: 55 seconds (UX journey)
- Slide 5: 50 seconds (visual effects)
- Slide 6: 60 seconds (impact & future)
- **Total: 5 minutes 10 seconds** ← Adjust as needed, remove some details if over

### Delivery Notes:
- **Start confidently** - "My project transforms your webcam into a musical instrument"
- **Show, don't just tell** - Point to specific elements in screenshots/video
- **Connect back to rubric:**
  - Concept elegance: Natural gesture → sound + visuals
  - Technical sophistication: MediaPipe + WebGL + Audio API
  - UX design: Velocity threshold, immediate feedback
  - Code quality: Modular, documented, performant
- **End with vision** - "This is just the beginning of gesture-based music"

### Visual Consistency:
- Use a cohesive color scheme (match your app: teal, pink, orange, dark backgrounds)
- Keep text minimal - bullets, not paragraphs
- Large images/diagrams - easier to see from distance
- Consistent font sizes (title 44pt+, body 24pt+, notes 18pt+)

---

## QUESTIONS TO PREPARE FOR (3-minute Q&A)

### Technical Questions:
- **Q: Why MediaPipe over other hand tracking libraries?**
  A: MediaPipe is fast, accurate, and works in the browser without installation. It provides 21 landmarks which gave me precise fingertip tracking.

- **Q: How did you handle performance with so many visual effects?**
  A: GPU shaders offload heavy pixel processing, particle count is capped at 160 per drum, and I use pixelDensity(1) to avoid 2× rendering on retina displays.

- **Q: What if WebGL isn't available?**
  A: I implemented a CPU fallback that downsamples the image, applies filters, then upscales. It's slower but functional.

### Design Questions:
- **Q: Why the velocity threshold for hits?**
  A: Early versions without it were frustrating - any hand movement triggered drums. The 500 px/s threshold requires intentional "punching" motions, which feels more like real drumming.

- **Q: How did you choose the color palette?**
  A: I wanted cool colors for calm states and warm colors for intense moments, matching how music feels. Teal and indigo are calm, pink and orange are energetic.

### Concept Questions:
- **Q: Who is this for?**
  A: Anyone curious about music creation but intimidated by traditional instruments. It's accessible, playful, and visually engaging.

- **Q: What was your biggest challenge?**
  A: Synchronizing visual effects with audio impulses. Audio plays instantly but visual effects need to decay over time. I used exponential decay with a 220ms time constant to match the perceived "echo" of a drum hit.

- **Q: What would you change if you started over?**
  A: I'd plan the shader system earlier - I added it late and had to refactor. Also, more user testing upfront would have revealed the velocity threshold need sooner.

---

## REMINDER: Assignment 2D Reflection (3 minutes)

After your A2C presentation, you'll present your A2D reflection for 3 minutes. Make sure you have:
- 750-word written reflection submitted
- 2 key features/decisions to discuss using the Recount → React → Analyse → Improve cycle

**Suggested features to reflect on:**
1. **Velocity-based hit detection** - How it evolved from frustrating to fluid
2. **Audio-reactive color palette** - How you balanced aesthetics with readability

Good luck with your presentation! 🎵
