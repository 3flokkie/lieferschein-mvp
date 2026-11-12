# TASK FOR CLAUDE CODE: REAL 911 CALL CINEMATIC DOCUMENTARY RECONSTRUCTION

## Target Composition:
- Component: `src/Real911Reconstruction.tsx`
- Duration: 1677 frames at 30fps (55.9 seconds).
- Canvas: 1080x1920 (Vertical 9:16).
- Audio file: Already placed at `public/ruth_price/raw_audio.aac` (load using `staticFile("ruth_price/raw_audio.aac")`).

## Design & Visual System (HIGH QUALITY, DYNAMIC PACING):
Change camera angles every 3-4 seconds. No static holding.
- **Palette:** Monochrome Amber/Green CRT terminal phosphor (#FFB000, #00FF66, #0D1117, #161B22, Blood Red #E53935).
- **Elements:**
  1. **Scene 1 (0 - 5.0s / f0 - f150):** Emergency 911 CAD Terminal. Blinking incident log, real-time reactive audio waveform bars, incoming caller ID: "RUTH PRICE // APARTMENT REAR".
  2. **Scene 2 (5.0 - 12.0s / f150 - f360):** CCTV Night Cam angle of the house. Static grain, timestamp HUD in corner, slow digital zoom towards dark backyard.
  3. **Scene 3 (12.0 - 18.0s / f360 - f540):** Close-up on the frosted glass back door. Dark shadowy human silhouette slowly walks past outside.
  4. **Scene 4 (18.0 - 27.0s / f540 - f810):** Interior hallway. Retro rotary telephone on table, coiled cable trembling.
  5. **Scene 5 (27.0 - 34.0s / f810 - f1020):** POV dark window looking into pitch black yard. Ruth: "I have no idea...". Loud mechanical thump / glass shake.
  6. **Scene 6 (34.0 - 45.0s / f1020 - f1350):** Violent breach climax. Lights blow out, alarm strobe, door latch tearing, shattering glass vector shards, screaming in audio. CAD terminal flashes: `[CODE 3 PRIORITY DISTURBANCE]`.
  7. **Scene 7 (45.0 - 55.9s / f1350 - f1677):** Static hiss, operator repeats "Ma'am? Ma'am?". Clean typed police dossier report in Russian:
     - "Патруль прибыл через 3 минуты 40 секунд."
     - "Входная дверь была сорвана с петель."
     - "Телефонная трубка свисала на проводе."
     - "Кейс вошел в историю как главное обучающее пособие диспетчеров 911."

## Subtitles:
Synced kinetic Russian translation subtitles at the bottom with bright contrast and word highlight.

Create `src/Real911Reconstruction.tsx`, register in `src/Root.tsx`, and test render a still at frame 200 and frame 1100 to verify!
