import React from "react";
import {
  AbsoluteFill,
  Easing,
  Sequence,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
  Audio,
  staticFile,
} from "remotion";

/*
 * AINGENEER — 15s High-Energy Kinetic Typography Showreel
 * Inspired by @m1n9_k7 (prompt-motion.com/m1n9-k7-ff9ab9)
 *
 * Visual System:
 * - Pure Swiss Modernist / Brutalist palette:
 *   - Matte Black: #0A0A0B
 *   - Bold Ultramarine / Electric Cobalt: #2B3CFE
 *   - Warm Alabaster / Chalk: #F4EFE6
 *   - Industrial Vermilion / Hazard Red: #E11D48
 *   - Technical Gold / Amber: #FFD237
 * - Typography: Heavy Geometric Helvetica / Sans-serif (letter-spacing tight, massive scale)
 * - Motion: Extreme snappy springs, razor-sharp slide-ins, hard split screens, diagonal block reveals
 * - Content Beats:
 *   0.0 – 2.5s: "AINGENEER" / "AUTONOMOUS SYSTEM LAB"
 *   2.5 – 6.0s: "ALPINE TELEMATICS // 100Hz TELEMETRY" (Munich -> Salzburg Corridor)
 *   6.0 – 9.5s: "SOVEREIGN AI // EU AI ACT 2026 // ZERO-LEAK"
 *   9.5 – 12.5s: "ENGINEERING AT THE EDGE" (Fast typography rapid cuts)
 *   12.5 – 15.0s: "AINGENEER.COM" // "FREILASSING • BAVARIA"
 */

const SANS =
  "'Helvetica Neue', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
const MONO = "'JetBrains Mono', 'SF Mono', Menlo, Consolas, monospace";

const C = {
  black: "#0A0A0B",
  blue: "#2B3CFE",
  paper: "#F4EFE6",
  red: "#E11D48",
  gold: "#FFD237",
  charcoal: "#141518",
  borderLight: "rgba(244,239,230,0.18)",
  borderDark: "rgba(10,10,11,0.15)",
};

const CLAMP = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// Fast snappy spring config
const SNAPPY = { damping: 14, stiffness: 220, mass: 0.6 };
const ELASTIC = { damping: 11, stiffness: 260, mass: 0.5 };

export const AingeneerM1n9Showreel: React.FC = () => {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: C.black,
        fontFamily: SANS,
        overflow: "hidden",
      }}
    >
      {/* Beat 1: 0.0s – 2.5s (0 – 75 frames) : Punchy Brand Announcement */}
      <Sequence from={0} durationInFrames={75}>
        <SceneIntro />
      </Sequence>

      {/* Beat 2: 2.5s – 6.0s (75 – 180 frames) : Telematics & High Frequency Alpine System */}
      <Sequence from={75} durationInFrames={105}>
        <SceneTelematics />
      </Sequence>

      {/* Beat 3: 6.0s – 9.5s (180 – 285 frames) : Sovereign AI / EU AI Act Architecture */}
      <Sequence from={180} durationInFrames={105}>
        <SceneSovereignAI />
      </Sequence>

      {/* Beat 4: 9.5s – 12.2s (285 – 366 frames) : Rapid Kinetic Word Cuts (Showreel flex) */}
      <Sequence from={285} durationInFrames={81}>
        <SceneSpeedCuts />
      </Sequence>

      {/* Beat 5: 12.2s – 15.0s (366 – 450 frames) : Final Monolith Outro */}
      <Sequence from={366} durationInFrames={84}>
        <SceneOutro />
      </Sequence>
    </AbsoluteFill>
  );
};

/* =========================================================================
   SCENE 1: KINETIC INTRO (0 - 2.5s)
   Heavy black & cobalt split, letters sliding from top and bottom
   ========================================================================= */
const SceneIntro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Slide-in animation for split panels
  const panelProgress = spring({
    frame,
    fps,
    config: SNAPPY,
  });

  const textSlide = spring({
    frame: frame - 6,
    fps,
    config: SNAPPY,
  });

  const flash = frame < 3 ? 1 : 0;

  return (
    <AbsoluteFill style={{ backgroundColor: flash ? C.paper : C.black }}>
      {/* Top half: Cobalt Blue */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "50%",
          backgroundColor: C.blue,
          transform: `translateY(${(1 - panelProgress) * -100}%)`,
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          padding: "0 60px 20px 60px",
          borderBottom: `2px solid ${C.black}`,
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            fontFamily: MONO,
            fontSize: 22,
            fontWeight: 800,
            letterSpacing: "0.2em",
            color: C.paper,
          }}
        >
          [ AIN-2026 // SYSTEM STUDIO ]
        </div>
        <div
          style={{
            fontFamily: MONO,
            fontSize: 22,
            fontWeight: 800,
            letterSpacing: "0.2em",
            color: C.paper,
          }}
        >
          BAVARIA // FREILASSING
        </div>
      </div>

      {/* Center Giant Typographic Punch */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 10,
          textAlign: "center",
          width: "100%",
        }}
      >
        <div
          style={{
            fontSize: 180,
            fontWeight: 900,
            letterSpacing: "-0.05em",
            lineHeight: 0.85,
            color: C.paper,
            textTransform: "uppercase",
            transform: `scale(${interpolate(textSlide, [0, 1], [0.85, 1])})`,
            opacity: interpolate(textSlide, [0, 0.4], [0, 1]),
          }}
        >
          AINGENEER
        </div>
        <div
          style={{
            marginTop: 20,
            fontSize: 32,
            fontWeight: 700,
            letterSpacing: "0.3em",
            color: C.gold,
            textTransform: "uppercase",
          }}
        >
          AUTONOMOUS SYSTEMS ARCHITECTURE
        </div>
      </div>

      {/* Bottom half: Deep Black with Grid Lines */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          width: "100%",
          height: "50%",
          backgroundColor: C.black,
          transform: `translateY(${(1 - panelProgress) * 100}%)`,
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          padding: "20px 60px 0 60px",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            fontFamily: MONO,
            fontSize: 18,
            color: "rgba(244,239,230,0.5)",
          }}
        >
          LAT: 47.8390° N // LON: 12.9733° E
        </div>
        <div
          style={{
            fontFamily: MONO,
            fontSize: 18,
            color: "rgba(244,239,230,0.5)",
          }}
        >
          STACK: DISTRIBUTED RUST • KERNEL TELEMETRY
        </div>
      </div>
    </AbsoluteFill>
  );
};

/* =========================================================================
   SCENE 2: ALPINE FLEET TELEMATICS (2.5 - 6.0s)
   Electric Cobalt blue background, large white blocks, technical telemetry
   ========================================================================= */
const SceneTelematics: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const wipe = spring({ frame, fps, config: ELASTIC });
  const meterVal = interpolate(frame, [0, 80], [12, 142], CLAMP);
  const hzVal = interpolate(frame, [0, 50], [0, 100], CLAMP);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: C.blue,
        color: C.paper,
        padding: "60px 80px",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      {/* Header bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: `3px solid ${C.paper}`,
          paddingBottom: 24,
        }}
      >
        <span
          style={{
            fontSize: 28,
            fontWeight: 900,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
          }}
        >
          CASE 01 // HIGH-SPEED TELEMETRY
        </span>
        <span
          style={{
            fontFamily: MONO,
            fontSize: 22,
            backgroundColor: C.black,
            color: C.gold,
            padding: "6px 16px",
            fontWeight: 700,
          }}
        >
          CORRIDOR: MUC ➔ SZG
        </span>
      </div>

      {/* Main Kinetic Typography */}
      <div style={{ position: "relative" }}>
        <div
          style={{
            fontSize: 140,
            fontWeight: 900,
            lineHeight: 0.9,
            letterSpacing: "-0.04em",
            transform: `translateX(${(1 - wipe) * -80}px)`,
            opacity: wipe,
          }}
        >
          100Hz CAN-BUS
        </div>
        <div
          style={{
            fontSize: 84,
            fontWeight: 900,
            lineHeight: 1,
            color: C.paper,
            opacity: 0.85,
            marginTop: 10,
          }}
        >
          ALPINE TRANSIT TELEMATICS
        </div>
      </div>

      {/* Grid of live technical data blocks */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 30,
        }}
      >
        <div
          style={{
            backgroundColor: C.paper,
            color: C.black,
            padding: "24px 30px",
          }}
        >
          <div style={{ fontFamily: MONO, fontSize: 16, fontWeight: 700 }}>
            SAMPLING FREQUENCY
          </div>
          <div style={{ fontSize: 56, fontWeight: 900, marginTop: 10 }}>
            {Math.floor(hzVal)} Hz
          </div>
          <div style={{ fontFamily: MONO, fontSize: 14, opacity: 0.7 }}>
            ZERO PACKET DROP
          </div>
        </div>

        <div
          style={{
            backgroundColor: C.black,
            color: C.paper,
            padding: "24px 30px",
            border: `2px solid ${C.paper}`,
          }}
        >
          <div
            style={{
              fontFamily: MONO,
              fontSize: 16,
              fontWeight: 700,
              color: C.gold,
            }}
          >
            ACTIVE TRUCKS
          </div>
          <div style={{ fontSize: 56, fontWeight: 900, marginTop: 10 }}>
            {Math.floor(meterVal)} UNITS
          </div>
          <div style={{ fontFamily: MONO, fontSize: 14, opacity: 0.7 }}>
            A8 INN VALLEY CORRIDOR
          </div>
        </div>

        <div
          style={{
            backgroundColor: C.red,
            color: C.paper,
            padding: "24px 30px",
          }}
        >
          <div style={{ fontFamily: MONO, fontSize: 16, fontWeight: 700 }}>
            LATENCY THRESHOLD
          </div>
          <div style={{ fontSize: 56, fontWeight: 900, marginTop: 10 }}>
            1.4 ms
          </div>
          <div style={{ fontFamily: MONO, fontSize: 14 }}>
            REAL-TIME COLLISION AUDIT
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

/* =========================================================================
   SCENE 3: SOVEREIGN AI & COMPLIANCE (6.0 - 9.5s)
   Warm Alabaster / Paper background with massive black brutalist blocks
   ========================================================================= */
const SceneSovereignAI: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const splitIn = spring({ frame, fps, config: SNAPPY });
  const blockSlide = spring({ frame: frame - 10, fps, config: ELASTIC });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: C.paper,
        color: C.black,
        padding: "60px 80px",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      {/* Top Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: `3px solid ${C.black}`,
          paddingBottom: 24,
        }}
      >
        <span
          style={{
            fontSize: 28,
            fontWeight: 900,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
          }}
        >
          CASE 02 // GOVERNANCE & SOVEREIGNTY
        </span>
        <span
          style={{
            fontFamily: MONO,
            fontSize: 22,
            backgroundColor: C.red,
            color: C.paper,
            padding: "6px 16px",
            fontWeight: 800,
          }}
        >
          EU AI ACT • ARTICLE 14
        </span>
      </div>

      {/* Massive Bold Center Text */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        <div
          style={{
            fontSize: 130,
            fontWeight: 900,
            lineHeight: 0.9,
            letterSpacing: "-0.05em",
            textTransform: "uppercase",
            transform: `translateY(${(1 - splitIn) * 60}px)`,
            opacity: splitIn,
          }}
        >
          SOVEREIGN AI
        </div>
        <div
          style={{
            display: "inline-block",
            backgroundColor: C.black,
            color: C.paper,
            padding: "16px 24px",
            fontSize: 64,
            fontWeight: 900,
            letterSpacing: "-0.02em",
            width: "fit-content",
            transform: `translateX(${(1 - blockSlide) * 100}px)`,
          }}
        >
          ZERO THIRD-PARTY DATA LEAK
        </div>
      </div>

      {/* Bottom Technical Indicators */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          borderTop: `2px solid ${C.black}`,
          paddingTop: 24,
        }}
      >
        <div>
          <div style={{ fontFamily: MONO, fontSize: 18, fontWeight: 700 }}>
            CRYPTOGRAPHIC AUDIT TRAIL
          </div>
          <div style={{ fontFamily: MONO, fontSize: 14, opacity: 0.7, marginTop: 4 }}>
            SHA-256 STATE TAMPER-PROOF HASH CHAINS
          </div>
        </div>
        <div
          style={{
            fontFamily: MONO,
            fontSize: 24,
            fontWeight: 900,
            backgroundColor: C.blue,
            color: C.paper,
            padding: "10px 20px",
          }}
        >
          100% AIR-GAPPED READY
        </div>
      </div>
    </AbsoluteFill>
  );
};

/* =========================================================================
   SCENE 4: RAPID KINETIC CUTS (9.5 - 12.2s)
   Superfast flash words mimicking the explosive motion designer showreel
   ========================================================================= */
const SceneSpeedCuts: React.FC = () => {
  const frame = useCurrentFrame();

  // 81 frames total -> 5 sub-beats (~16 frames each)
  const subIndex = Math.floor(frame / 16);

  const words = [
    { text: "DETERMINISTIC", sub: "RELIABILITY OVER HYPE", bg: C.black, color: C.paper },
    { text: "AUTONOMOUS", sub: "AGENTIC WORKFLOWS", bg: C.blue, color: C.paper },
    { text: "LOCAL-FIRST", sub: "BAVARIAN COMPLIANCE", bg: C.paper, color: C.black },
    { text: "HIGH PRECISION", sub: "100Hz TELEMETRY", bg: C.red, color: C.paper },
    { text: "UNCOMPROMISED", sub: "ENGINEERING EXCELLENCE", bg: C.black, color: C.gold },
  ];

  const current = words[Math.min(subIndex, words.length - 1)];

  return (
    <AbsoluteFill
      style={{
        backgroundColor: current.bg,
        color: current.color,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        textAlign: "center",
        padding: "0 40px",
      }}
    >
      <div
        style={{
          fontFamily: MONO,
          fontSize: 28,
          fontWeight: 800,
          letterSpacing: "0.3em",
          marginBottom: 20,
        }}
      >
        [ {current.sub} ]
      </div>
      <div
        style={{
          fontSize: 160,
          fontWeight: 900,
          lineHeight: 0.85,
          letterSpacing: "-0.05em",
          textTransform: "uppercase",
        }}
      >
        {current.text}
      </div>
    </AbsoluteFill>
  );
};

/* =========================================================================
   SCENE 5: FINALE OUTRO (12.2 - 15.0s)
   Brutalist Swiss Monolith: Final call to action & studio domain
   ========================================================================= */
const SceneOutro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = spring({ frame, fps, config: SNAPPY });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: C.black,
        color: C.paper,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "70px 90px",
        boxSizing: "border-box",
      }}
    >
      {/* Top Bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span
          style={{
            fontFamily: MONO,
            fontSize: 20,
            fontWeight: 700,
            letterSpacing: "0.2em",
            color: C.gold,
          }}
        >
          // OLEKSANDR SYROTA • ENGINEERING
        </span>
        <span
          style={{
            fontFamily: MONO,
            fontSize: 20,
            fontWeight: 700,
            letterSpacing: "0.2em",
            opacity: 0.6,
          }}
        >
          EST. 2026
        </span>
      </div>

      {/* Center Giant Punch */}
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            fontSize: 40,
            fontWeight: 800,
            letterSpacing: "0.25em",
            color: "rgba(244,239,230,0.6)",
            textTransform: "uppercase",
            marginBottom: 10,
          }}
        >
          BUILDING THE NEXT STANDARD
        </div>
        <div
          style={{
            fontSize: 150,
            fontWeight: 900,
            letterSpacing: "-0.05em",
            lineHeight: 0.9,
            color: C.paper,
            transform: `scale(${interpolate(scale, [0, 1], [0.9, 1])})`,
          }}
        >
          AINGENEER.COM
        </div>
      </div>

      {/* Bottom Bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderTop: `2px solid rgba(244,239,230,0.15)`,
          paddingTop: 24,
        }}
      >
        <div style={{ fontFamily: MONO, fontSize: 18, opacity: 0.7 }}>
          SALZBURG • FREILASSING • MUNICH
        </div>
        <div
          style={{
            backgroundColor: C.paper,
            color: C.black,
            fontFamily: MONO,
            fontWeight: 900,
            fontSize: 20,
            padding: "8px 24px",
            letterSpacing: "0.1em",
          }}
        >
          DISCUSS YOUR SYSTEM ➔
        </div>
      </div>
    </AbsoluteFill>
  );
};
