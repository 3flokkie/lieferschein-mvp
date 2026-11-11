import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

/*
 * =========================================================================
 * AINGENEER — 15s MASTER MOTION REEL (1920x1080 @ 60 FPS, 900 FRAMES)
 * 1:1 RE-ENGINEERING OF @m1n9_k7 (prompt-motion.com/m1n9-k7-ff9ab9)
 *
 * EXACT SYSTEM SPECIFICATION:
 * - Frame rate: 60 FPS (900 frames)
 * - Typography: Heavy Neue Haas Grotesk / Helvetica Black, uppercase, tight tracking (-0.05em)
 * - HUD System: Running millisecond timecode, frame counter, BPM (128 BPM), exercise metadata
 * - Color Palette:
 *     Black: #0C0C0C / #090909
 *     Electric Cobalt: #2B3CFE
 *     Warm Alabaster / Milk Paper: #F1EFE3
 *     Hazard Vermilion / Crimson: #FC3C1D
 *     Technical Gold / Amber: #FFD237
 * - Exercises Breakdown:
 *     00:00 - 01.75s (0 - 105f)   : EX 00 / HELLO (Bouncing kinetic physics ball + squash & stretch)
 *     01.75 - 03.75s (105 - 225f) : EX 01 / TYPOGRAPHY ("FRAME" / "WITH" / "INTENT." + grid cuts)
 *     03.75 - 05.50s (225 - 330f) : EX 02 / EASING CURVES (ease: expo.inOut + dynamic graph curves)
 *     05.50 - 07.50s (330 - 450f) : EX 03 / 3D MORPH & ROTATION (Perspective cubes & depth transform)
 *     07.50 - 09.50s (450 - 570f) : EX 04 / FLUID MASK & MORPH (Viscous shape interpolation)
 *     09.50 - 11.50s (570 - 690f) : EX 05 / SYSTEMS & VECTOR PARTICLES (Matrix points & lines)
 *     11.50 - 13.00s (690 - 780f) : EX 06 / RHYTHM & 128 BPM FLASH CUTS ("SNAP", "RENDER", "LOOP")
 *     13.00 - 15.00s (780 - 900f) : EX 07 / OUTRO SHOWREEL MONOLITH ("AINGENEER" / "EVERY FRAME IN CODE")
 * =========================================================================
 */

const SANS =
  "'Helvetica Neue', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
const MONO = "'JetBrains Mono', 'SF Mono', Menlo, Consolas, monospace";

const C = {
  black: "#0C0C0C",
  pureBlack: "#050505",
  blue: "#2B3CFE",
  paper: "#F1EFE3",
  red: "#FC3C1D",
  gold: "#FFD237",
  gridLineLight: "rgba(241, 239, 227, 0.12)",
  gridLineDark: "rgba(12, 12, 12, 0.12)",
};

const CLAMP = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export const AingeneerM1n9Showreel: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill
      style={{
        backgroundColor: C.black,
        fontFamily: SANS,
        overflow: "hidden",
      }}
    >
      {/* 00:00 - 01.75s (0 - 105f) : EX 00 / HELLO & BOUNCE */}
      {frame >= 0 && frame < 105 && <Exercise00Bounce frame={frame} />}

      {/* 01.75 - 03.75s (105 - 225f) : EX 01 / TYPOGRAPHY */}
      {frame >= 105 && frame < 225 && (
        <Exercise01Typography frame={frame - 105} />
      )}

      {/* 03.75 - 05.50s (225 - 330f) : EX 02 / EASING CURVES */}
      {frame >= 225 && frame < 330 && (
        <Exercise02EasingCurves frame={frame - 225} />
      )}

      {/* 05.50 - 07.50s (330 - 450f) : EX 03 / 3D PERSPECTIVE */}
      {frame >= 330 && frame < 450 && (
        <Exercise03Perspective frame={frame - 330} />
      )}

      {/* 07.50 - 09.50s (450 - 570f) : EX 04 / FLUID MORPH */}
      {frame >= 450 && frame < 570 && (
        <Exercise04FluidMorph frame={frame - 450} />
      )}

      {/* 09.50 - 11.50s (570 - 690f) : EX 05 / SYSTEMS & PARTICLES */}
      {frame >= 570 && frame < 690 && (
        <Exercise05Systems frame={frame - 570} />
      )}

      {/* 11.50 - 13.00s (690 - 780f) : EX 06 / RHYTHM & FAST FLASH WORDS */}
      {frame >= 690 && frame < 780 && (
        <Exercise06RhythmCuts frame={frame - 690} />
      )}

      {/* 13.00 - 15.00s (780 - 900f) : EX 07 / OUTRO MONOLITH */}
      {frame >= 780 && frame <= 900 && (
        <Exercise07Monolith frame={frame - 780} />
      )}

      {/* Master HUD & Timecode Overlay */}
      <MasterHUD frame={frame} />
    </AbsoluteFill>
  );
};

/* =========================================================================
   MASTER HUD OVERLAY (Running Timecode, BPM, 1920x1080 60FPS, Corner Crosses)
   ========================================================================= */
const MasterHUD: React.FC<{ frame: number }> = ({ frame }) => {
  // Format TC 00:00:SS:FF
  const totalSeconds = Math.floor(frame / 60);
  const subFrames = frame % 60;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const tc = `TC 00:${String(minutes).padStart(2, "0")}:${String(
    seconds
  ).padStart(2, "0")}:${String(subFrames).padStart(2, "0")}`;

  // Get current active section
  let sectionLabel = "L 00 — HELLO";
  let modeLabel = "exercise_00 / bouncing_ball.comp";
  let isLightBg = false;

  if (frame < 105) {
    sectionLabel = "L 00 — HELLO";
    modeLabel = "exercise_00 / physics_bounce.comp";
  } else if (frame < 225) {
    sectionLabel = "L 01 — TYPOGRAPHY";
    modeLabel = "exercise_01 / kinetic_kerning.comp";
    if (frame >= 140 && frame < 175) isLightBg = true;
  } else if (frame < 330) {
    sectionLabel = "L 02 — EASING";
    modeLabel = "exercise_02 / bezier_math.comp";
  } else if (frame < 450) {
    sectionLabel = "L 03 — 3D DEPTH";
    modeLabel = "exercise_03 / spatial_matrix.comp";
  } else if (frame < 570) {
    sectionLabel = "L 04 — FLUIDS";
    modeLabel = "exercise_04 / organic_viscous.comp";
    isLightBg = true;
  } else if (frame < 690) {
    sectionLabel = "L 05 — SYSTEMS";
    modeLabel = "exercise_05 / autonomous_network.comp";
  } else if (frame < 780) {
    sectionLabel = "L 06 — RHYTHM";
    modeLabel = "exercise_06 / 128_bpm_sync.comp";
  } else {
    sectionLabel = "L 07 — SHOWREEL '26";
    modeLabel = "exercise_07 / studio_monolith.comp";
  }

  const textColor = isLightBg ? C.black : C.paper;
  const mutedColor = isLightBg
    ? "rgba(12,12,12,0.45)"
    : "rgba(241,239,227,0.45)";

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        zIndex: 100,
        padding: "36px 44px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        boxSizing: "border-box",
        fontFamily: MONO,
        fontSize: 13,
        fontWeight: 700,
        letterSpacing: "0.08em",
        color: textColor,
      }}
    >
      {/* Top HUD Bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: `1px solid ${
            isLightBg ? C.gridLineDark : C.gridLineLight
          }`,
          paddingBottom: 14,
        }}
      >
        <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
          <span>┌ AINGENEER • MOTION REEL '26</span>
          <span style={{ color: mutedColor }}>|</span>
          <span style={{ color: mutedColor }}>{modeLabel}</span>
        </div>
        <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
          <span style={{ color: C.red }}>● LIVE</span>
          <span style={{ color: mutedColor }}>|</span>
          <span style={{ fontWeight: 800 }}>{tc}</span>
        </div>
      </div>

      {/* Corner crosshairs */}
      <div
        style={{
          position: "absolute",
          top: 32,
          left: 40,
          color: mutedColor,
          fontSize: 18,
        }}
      >
        +
      </div>
      <div
        style={{
          position: "absolute",
          top: 32,
          right: 40,
          color: mutedColor,
          fontSize: 18,
        }}
      >
        +
      </div>
      <div
        style={{
          position: "absolute",
          bottom: 32,
          left: 40,
          color: mutedColor,
          fontSize: 18,
        }}
      >
        +
      </div>
      <div
        style={{
          position: "absolute",
          bottom: 32,
          right: 40,
          color: mutedColor,
          fontSize: 18,
        }}
      >
        +
      </div>

      {/* Bottom HUD Bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderTop: `1px solid ${
            isLightBg ? C.gridLineDark : C.gridLineLight
          }`,
          paddingTop: 14,
        }}
      >
        <div style={{ display: "flex", gap: 20 }}>
          <span style={{ color: C.gold }}>{sectionLabel}</span>
          <span style={{ color: mutedColor }}>//</span>
          <span style={{ color: mutedColor }}>CODE GENERATED REMOTION 60FPS</span>
        </div>
        <div style={{ display: "flex", gap: 24 }}>
          <span>1920×1080 • 60 FPS</span>
          <span style={{ color: mutedColor }}>|</span>
          <span style={{ color: C.red, fontWeight: 800 }}>128 BPM ♩</span>
        </div>
      </div>
    </div>
  );
};

/* =========================================================================
   EXERCISE 00: BOUNCING BALL & SQUASH/STRETCH (0.0 - 1.75s / 105 frames)
   Exact replicate of m1n9 bouncing ball physics test with trajectory trails
   ========================================================================= */
const Exercise00Bounce: React.FC<{ frame: number }> = ({ frame }) => {
  // 3 bounces with diminishing heights
  const bounce1 = Math.abs(Math.sin((frame / 28) * Math.PI));
  const height1 = interpolate(frame, [0, 45], [380, 0], CLAMP);
  const yPos = 540 - Math.pow(bounce1, 1.4) * height1;

  // Squash and stretch scale calculation
  const isFloor = bounce1 < 0.15;
  const scaleX = isFloor ? 1.4 : 0.85;
  const scaleY = isFloor ? 0.65 : 1.25;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: C.black,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Background Subtle Grid */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `linear-gradient(${C.gridLineLight} 1px, transparent 1px), linear-gradient(90deg, ${C.gridLineLight} 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
          opacity: 0.35,
        }}
      />

      {/* Floor line */}
      <div
        style={{
          position: "absolute",
          top: 610,
          left: 180,
          right: 180,
          height: 3,
          backgroundColor: C.paper,
        }}
      />

      {/* Trajectory Arc Points */}
      {Array.from({ length: 16 }).map((_, i) => {
        const t = (i / 15) * 45;
        const b = Math.abs(Math.sin((t / 28) * Math.PI));
        const h = interpolate(t, [0, 45], [380, 0], CLAMP);
        const y = 540 - Math.pow(b, 1.4) * h;
        const x = 500 + i * 55;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: 5,
              height: 5,
              borderRadius: "50%",
              backgroundColor: C.red,
              opacity: frame > i * 2.5 ? 0.7 : 0,
            }}
          />
        );
      })}

      {/* The Ball */}
      <div
        style={{
          position: "absolute",
          left: 500 + (frame / 45) * 825,
          top: yPos,
          width: 80,
          height: 80,
          borderRadius: "50%",
          backgroundColor: C.paper,
          transform: `scale(${scaleX}, ${scaleY})`,
          transformOrigin: "center bottom",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: "50%",
            backgroundColor: C.red,
          }}
        />
      </div>

      {/* Center Label at t > 1.0s */}
      {frame > 50 && (
        <div
          style={{
            position: "absolute",
            top: 280,
            textAlign: "center",
            color: C.paper,
          }}
        >
          <div
            style={{
              fontSize: 100,
              fontWeight: 900,
              letterSpacing: "-0.04em",
              lineHeight: 1,
            }}
          >
            HELLO WORLD.
          </div>
          <div
            style={{
              fontFamily: MONO,
              fontSize: 20,
              color: C.gold,
              letterSpacing: "0.2em",
              marginTop: 12,
            }}
          >
            [ DYNAMIC FORCE & SQUASH PHYSICS ]
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};

/* =========================================================================
   EXERCISE 01: TYPOGRAPHY (1.75 - 3.75s / 120 frames)
   Rapid snaps: "FRAME" ➔ "WITH" ➔ "INTENT." in Electric Cobalt & Cream
   ========================================================================= */
const Exercise01Typography: React.FC<{ frame: number }> = ({ frame }) => {
  // Step 1: 0 - 35 frames (FRAME - Black/Paper)
  // Step 2: 35 - 75 frames (WITH - Cobalt Blue)
  // Step 3: 75 - 120 frames (INTENT. - Paper White with Split Vermilion)

  const isStep1 = frame < 35;
  const isStep2 = frame >= 35 && frame < 75;
  const isStep3 = frame >= 75;

  const spring1 = spring({ frame, fps: 60, config: { damping: 14, stiffness: 300 } });
  const spring2 = spring({ frame: frame - 35, fps: 60, config: { damping: 12, stiffness: 320 } });
  const spring3 = spring({ frame: frame - 75, fps: 60, config: { damping: 15, stiffness: 280 } });

  if (isStep1) {
    return (
      <AbsoluteFill
        style={{
          backgroundColor: C.red,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            fontSize: 240,
            fontWeight: 900,
            color: C.paper,
            letterSpacing: "-0.06em",
            transform: `scale(${interpolate(spring1, [0, 1], [0.7, 1])})`,
          }}
        >
          FRAME
        </div>
      </AbsoluteFill>
    );
  }

  if (isStep2) {
    return (
      <AbsoluteFill
        style={{
          backgroundColor: C.blue,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            fontSize: 260,
            fontWeight: 900,
            color: C.paper,
            letterSpacing: "-0.06em",
            transform: `translateX(${(1 - spring2) * 300}px)`,
          }}
        >
          WITH
        </div>
      </AbsoluteFill>
    );
  }

  return (
    <AbsoluteFill
      style={{
        backgroundColor: C.paper,
        color: C.black,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          fontSize: 270,
          fontWeight: 900,
          letterSpacing: "-0.06em",
          lineHeight: 0.85,
          color: C.black,
          transform: `scale(${interpolate(spring3, [0, 1], [0.85, 1])})`,
        }}
      >
        INTENT.
      </div>
      <div
        style={{
          backgroundColor: C.black,
          color: C.gold,
          fontFamily: MONO,
          fontSize: 24,
          fontWeight: 800,
          padding: "8px 24px",
          marginTop: 24,
          letterSpacing: "0.2em",
        }}
      >
        MICRO-TYPOGRAPHIC PRECISION
      </div>
    </AbsoluteFill>
  );
};

/* =========================================================================
   EXERCISE 02: EASING CURVES (3.75 - 5.50s / 105 frames)
   Detailed Bezier graphing, ease: expo.inOut, formula labels, live tracer
   ========================================================================= */
const Exercise02EasingCurves: React.FC<{ frame: number }> = ({ frame }) => {
  // Parametric bezier tracer: t from 0 to 1
  const t = Math.min(frame / 75, 1);
  // Expo InOut equation: t === 0 ? 0 : t === 1 ? 1 : t < 0.5 ? Math.pow(2, 20 * t - 10) / 2 : (2 - Math.pow(2, -20 * t + 10)) / 2
  const easeVal =
    t === 0
      ? 0
      : t === 1
      ? 1
      : t < 0.5
      ? Math.pow(2, 20 * t - 10) / 2
      : (2 - Math.pow(2, -20 * t + 10)) / 2;

  // Chart coordinates
  const originX = 660;
  const originY = 720;
  const graphWidth = 600;
  const graphHeight = 360;

  const currentX = originX + t * graphWidth;
  const currentY = originY - easeVal * graphHeight;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: C.black,
        color: C.paper,
        display: "flex",
        flexDirection: "column",
        padding: "120px 140px",
      }}
    >
      {/* Top Section Header */}
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <div>
          <div
            style={{
              fontFamily: MONO,
              fontSize: 22,
              color: C.gold,
              fontWeight: 800,
            }}
          >
            ease: expo.inOut
          </div>
          <div
            style={{
              fontSize: 64,
              fontWeight: 900,
              letterSpacing: "-0.04em",
              marginTop: 4,
            }}
          >
            CURVE ARITHMETIC
          </div>
        </div>

        <div style={{ fontFamily: MONO, textAlign: "right" }}>
          <div style={{ fontSize: 18, color: "rgba(241,239,227,0.5)" }}>
            t = {t.toFixed(2)}
          </div>
          <div style={{ fontSize: 32, fontWeight: 900, color: C.red }}>
            v = {easeVal.toFixed(3)}
          </div>
        </div>
      </div>

      {/* Graph Display Area */}
      <svg
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: 1920,
          height: 1080,
          pointerEvents: "none",
        }}
      >
        {/* Graph Axes */}
        <line
          x1={originX}
          y1={originY}
          x2={originX + graphWidth}
          y2={originY}
          stroke={C.paper}
          strokeWidth={2}
        />
        <line
          x1={originX}
          y1={originY}
          x2={originX}
          y2={originY - graphHeight}
          stroke={C.paper}
          strokeWidth={2}
        />

        {/* Drawn Curve Path */}
        <path
          d={`M ${originX} ${originY} C ${originX + 240} ${originY}, ${
            originX + 360
          } ${originY - graphHeight}, ${originX + graphWidth} ${
            originY - graphHeight
          }`}
          fill="none"
          stroke={C.blue}
          strokeWidth={6}
        />

        {/* Tangent guide line */}
        <line
          x1={currentX}
          y1={originY}
          x2={currentX}
          y2={currentY}
          stroke={C.red}
          strokeDasharray="4 4"
          strokeWidth={2}
        />

        {/* Tracer Dot */}
        <circle cx={currentX} cy={currentY} r={10} fill={C.gold} />
      </svg>

      {/* Target object moved by curve */}
      <div
        style={{
          position: "absolute",
          left: 1400,
          top: 360 + (1 - easeVal) * 360,
          width: 120,
          height: 120,
          backgroundColor: C.paper,
          border: `4px solid ${C.red}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: MONO,
          fontWeight: 900,
          color: C.black,
        }}
      >
        {Math.round(easeVal * 100)}%
      </div>
    </AbsoluteFill>
  );
};

/* =========================================================================
   EXERCISE 03: 3D PERSPECTIVE CUBE & MATRIX ROTATION (5.5 - 7.5s / 120 frames)
   Deep isometric wireframe rotate, cobalt split, spatial projection
   ========================================================================= */
const Exercise03Perspective: React.FC<{ frame: number }> = ({ frame }) => {
  const rotY = (frame / 120) * 360;
  const rotX = Math.sin((frame / 60) * Math.PI) * 35;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: C.blue,
        color: C.paper,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        perspective: 1200,
      }}
    >
      {/* Background massive technical code */}
      <div
        style={{
          position: "absolute",
          top: 120,
          left: 100,
          fontFamily: MONO,
          fontSize: 16,
          lineHeight: 1.6,
          opacity: 0.35,
        }}
      >
        MAT4_PROJECTION_PERSPECTIVE(FOV=60, NEAR=0.1, FAR=1000)
        <br />
        ROT_EULER(X={rotX.toFixed(1)}°, Y={rotY.toFixed(1)}°, Z=0.0°)
        <br />
        HOMOGENEOUS_COORDINATES_NORMALIZED
      </div>

      {/* 3D Wireframe Cube */}
      <div
        style={{
          width: 320,
          height: 320,
          transformStyle: "preserve-3d",
          transform: `rotateX(${rotX}deg) rotateY(${rotY}deg)`,
        }}
      >
        {/* 6 Cube Faces */}
        {[
          { transform: "translateZ(160px)" },
          { transform: "rotateY(180deg) translateZ(160px)" },
          { transform: "rotateY(90deg) translateZ(160px)" },
          { transform: "rotateY(-90deg) translateZ(160px)" },
          { transform: "rotateX(90deg) translateZ(160px)" },
          { transform: "rotateX(-90deg) translateZ(160px)" },
        ].map((face, idx) => (
          <div
            key={idx}
            style={{
              position: "absolute",
              width: 320,
              height: 320,
              border: `3px solid ${C.paper}`,
              backgroundColor: "rgba(12, 12, 12, 0.4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 48,
              fontWeight: 900,
              color: C.gold,
              ...face,
            }}
          >
            AIN // 0{idx + 1}
          </div>
        ))}
      </div>

      {/* Front Hero Text */}
      <div
        style={{
          position: "absolute",
          bottom: 110,
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 96, fontWeight: 900, letterSpacing: "-0.04em" }}>
          SPATIAL SYSTEMS
        </div>
        <div
          style={{
            fontFamily: MONO,
            fontSize: 20,
            color: C.gold,
            letterSpacing: "0.2em",
          }}
        >
          [ 3D MATRIX TRANSFORMATION ENGINE ]
        </div>
      </div>
    </AbsoluteFill>
  );
};

/* =========================================================================
   EXERCISE 04: FLUID MORPH (7.5 - 9.5s / 120 frames)
   Cream paper background, fluid morphing blobs, organic contours
   ========================================================================= */
const Exercise04FluidMorph: React.FC<{ frame: number }> = ({ frame }) => {
  const morph = Math.sin((frame / 40) * Math.PI);
  const r1 = 160 + morph * 40;
  const r2 = 180 - morph * 50;
  const r3 = 150 + morph * 30;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: C.paper,
        color: C.black,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Organic morphing SVG */}
      <svg width={700} height={700} viewBox="0 0 700 700">
        <defs>
          <radialGradient id="grad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={C.red} />
            <stop offset="100%" stopColor={C.black} />
          </radialGradient>
        </defs>
        <path
          d={`M 350,${350 - r1} C ${350 + r2},${350 - r1} ${350 + r1},${
            350 + r3
          } 350,${350 + r2} C ${350 - r2},${350 + r2} ${350 - r3},${
            350 - r2
          } 350,${350 - r1} Z`}
          fill="url(#grad)"
        />
      </svg>

      {/* Overlay typography */}
      <div
        style={{
          position: "absolute",
          textAlign: "center",
          color: C.paper,
        }}
      >
        <div
          style={{
            fontSize: 120,
            fontWeight: 900,
            letterSpacing: "-0.05em",
            textTransform: "uppercase",
          }}
        >
          FLUID VISCOSITY
        </div>
        <div
          style={{
            fontFamily: MONO,
            fontSize: 22,
            color: C.gold,
            fontWeight: 800,
            letterSpacing: "0.25em",
          }}
        >
          ORGANIC MATHEMATICAL INTERPOLATION
        </div>
      </div>
    </AbsoluteFill>
  );
};

/* =========================================================================
   EXERCISE 05: SYSTEMS & PARTICLES (9.5 - 11.5s / 120 frames)
   High density network matrix, node connections, algorithmic telemetry
   ========================================================================= */
const Exercise05Systems: React.FC<{ frame: number }> = ({ frame }) => {
  const points = [
    { x: 300, y: 320 },
    { x: 550, y: 480 },
    { x: 800, y: 280 },
    { x: 1100, y: 420 },
    { x: 1350, y: 300 },
    { x: 1600, y: 520 },
    { x: 950, y: 640 },
    { x: 650, y: 720 },
    { x: 1250, y: 740 },
  ];

  return (
    <AbsoluteFill
      style={{
        backgroundColor: C.black,
        color: C.paper,
      }}
    >
      <svg
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
        }}
      >
        {/* Connective Lines */}
        {points.map((p1, i) =>
          points.slice(i + 1).map((p2, j) => {
            const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
            if (dist < 420) {
              return (
                <line
                  key={`${i}-${j}`}
                  x1={p1.x}
                  y1={p1.y}
                  x2={p2.x}
                  y2={p2.y}
                  stroke={C.blue}
                  strokeWidth={2}
                  strokeOpacity={0.65}
                />
              );
            }
            return null;
          })
        )}

        {/* Nodes */}
        {points.map((p, idx) => (
          <g key={idx}>
            <circle cx={p.x} cy={p.y} r={14} fill={C.paper} />
            <circle cx={p.x} cy={p.y} r={6} fill={C.red} />
          </g>
        ))}
      </svg>

      {/* Giant Center System Statement */}
      <div
        style={{
          position: "absolute",
          bottom: 120,
          left: 100,
        }}
      >
        <div style={{ fontSize: 130, fontWeight: 900, letterSpacing: "-0.05em" }}>
          AUTONOMOUS
        </div>
        <div
          style={{
            fontSize: 72,
            fontWeight: 800,
            color: C.gold,
            letterSpacing: "-0.03em",
          }}
        >
          DISTRIBUTED AGENT MESH
        </div>
      </div>
    </AbsoluteFill>
  );
};

/* =========================================================================
   EXERCISE 06: RHYTHM & 128 BPM FLASH CUTS (11.5 - 13.0s / 90 frames)
   Rapid strobe words matching the exact syncopation: "SNAP", "RENDER", "LOOP"
   ========================================================================= */
const Exercise06RhythmCuts: React.FC<{ frame: number }> = ({ frame }) => {
  // Strobe every 14 frames (~0.23s matching 128 BPM quarter notes)
  const strobeIdx = Math.floor(frame / 14);

  const strobes = [
    { text: "SNAP", bg: C.black, color: C.paper, sub: "128 BEATS PER MINUTE" },
    { text: "RENDER", bg: C.red, color: C.paper, sub: "DETERMINISTIC FRAMES" },
    { text: "LOOP", bg: C.blue, color: C.paper, sub: "TIMELESS CYCLE" },
    { text: "MAKE IT", bg: C.paper, color: C.black, sub: "SWISS MODERNISM" },
    { text: "MOVE.", bg: C.black, color: C.gold, sub: "PURE COMPUTATIONAL MOTION" },
  ];

  const current = strobes[Math.min(strobeIdx, strobes.length - 1)];

  return (
    <AbsoluteFill
      style={{
        backgroundColor: current.bg,
        color: current.color,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
      }}
    >
      <div
        style={{
          fontFamily: MONO,
          fontSize: 26,
          fontWeight: 800,
          letterSpacing: "0.3em",
          marginBottom: 16,
        }}
      >
        [ {current.sub} ]
      </div>
      <div
        style={{
          fontSize: 280,
          fontWeight: 900,
          lineHeight: 0.8,
          letterSpacing: "-0.06em",
          textTransform: "uppercase",
        }}
      >
        {current.text}
      </div>
    </AbsoluteFill>
  );
};

/* =========================================================================
   EXERCISE 07: MONOLITH SHOWREEL OUTRO (13.0 - 15.0s / 120 frames)
   The signature m1n9 final showreel statement + Aingeneer branding
   ========================================================================= */
const Exercise07Monolith: React.FC<{ frame: number }> = ({ frame }) => {
  const scale = spring({
    frame,
    fps: 60,
    config: { damping: 14, stiffness: 240 },
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: C.black,
        color: C.paper,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        textAlign: "center",
        padding: "0 80px",
        boxSizing: "border-box",
      }}
    >
      {/* Sub Header */}
      <div
        style={{
          fontFamily: MONO,
          fontSize: 24,
          fontWeight: 800,
          color: C.gold,
          letterSpacing: "0.25em",
          marginBottom: 20,
        }}
      >
        SHOWREEL 2026 // ENGINEERING LAB
      </div>

      {/* Main Massive Name */}
      <div
        style={{
          fontSize: 190,
          fontWeight: 900,
          lineHeight: 0.85,
          letterSpacing: "-0.05em",
          transform: `scale(${interpolate(scale, [0, 1], [0.88, 1])})`,
        }}
      >
        AINGENEER.
      </div>

      {/* Subtitle statement */}
      <div
        style={{
          fontSize: 42,
          fontWeight: 800,
          letterSpacing: "0.1em",
          color: "rgba(241, 239, 227, 0.7)",
          marginTop: 24,
          textTransform: "uppercase",
        }}
      >
        Autonomous Systems Architecture
      </div>

      {/* Every frame written in code badge */}
      <div
        style={{
          marginTop: 48,
          backgroundColor: C.blue,
          color: C.paper,
          fontFamily: MONO,
          fontSize: 22,
          fontWeight: 900,
          padding: "12px 32px",
          letterSpacing: "0.15em",
        }}
      >
        EVERY FRAME WRITTEN IN CODE • FREILASSING • BAVARIA
      </div>
    </AbsoluteFill>
  );
};
