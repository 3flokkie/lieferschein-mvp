import React from "react";
import {
  AbsoluteFill,
  Easing,
  Sequence,
  interpolate,
  random,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

/*
 * AINGENEER — 15 s hero showreel (1920×1080, 30 fps, 450 frames)
 *
 *  0.0 –  3.0 s  Scene 1  Kinetic intro      "AINGENEER // AUTONOMOUS INTELLIGENCE"
 *  3.0 –  7.0 s  Scene 2  Fleet telemetry    Munich → Salzburg route, CAN-bus, gauges
 *  7.0 – 11.0 s  Scene 3  Sovereign AI       Hash chain, DSGVO / EU AI Act pillars
 * 11.0 – 15.0 s  Scene 4  Finale             "ENGINEERING THE UNTHINKABLE" → aingeneer.com
 *
 * Everything is drawn in code (no external assets). All randomness goes through
 * Remotion's seeded `random`, so every render is frame-identical.
 */

const W = 1920;
const H = 1080;
const DURATION = 450;

const C = {
  bg: "#050608",
  cyan: "#06B6D4",
  emerald: "#10B981",
  violet: "#8B5CF6",
  text: "#F8FAFC",
  dim: "rgba(248,250,252,0.55)",
  glass: "rgba(12,16,24,0.62)",
  line: "rgba(255,255,255,0.09)",
};

const SANS = "'Plus Jakarta Sans', 'Inter', system-ui, -apple-system, sans-serif";
const MONO = "'JetBrains Mono', 'SF Mono', Menlo, Consolas, monospace";

const CLAMP = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const EXPO_OUT = Easing.bezier(0.16, 1, 0.3, 1);
const IN_OUT = Easing.inOut(Easing.cubic);

const glowText = (color: string, strength = 0.6): React.CSSProperties => ({
  textShadow: `0 0 28px ${color}`,
  filter: `drop-shadow(0 0 ${Math.round(18 * strength)}px ${color})`,
});

const gradientText: React.CSSProperties = {
  background: `linear-gradient(90deg, ${C.cyan} 0%, ${C.violet} 100%)`,
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  WebkitTextFillColor: "transparent",
  color: "transparent",
};

/** Spring that starts `delay` frames late and never goes negative. */
const sp = (
  frame: number,
  fps: number,
  delay: number,
  damping = 16,
  stiffness = 140,
): number =>
  spring({
    frame: Math.max(0, frame - delay),
    fps,
    config: { damping, stiffness, mass: 0.9 },
  });

/** Scene opacity: fade in over `inF` frames, fade out over the last `outF` frames. */
const envelope = (lf: number, dur: number, inF: number, outF: number): number => {
  const fin = inF > 0 ? interpolate(lf, [0, inF], [0, 1], CLAMP) : 1;
  const fout = outF > 0 ? interpolate(lf, [dur - outF, dur], [1, 0], CLAMP) : 1;
  return fin * fout;
};

// ---------------------------------------------------------------------------
// Global background: void, drifting glows, perspective floor, dust, vignette
// ---------------------------------------------------------------------------

const DUST = Array.from({ length: 90 }, (_, i) => ({
  x: random(`dust-x-${i}`) * W,
  y: random(`dust-y-${i}`) * H,
  size: 1.5 + random(`dust-s-${i}`) * 3,
  speed: 0.6 + random(`dust-v-${i}`) * 1.8,
  color: i % 3 === 0 ? C.violet : i % 3 === 1 ? C.cyan : C.emerald,
}));

const Background: React.FC = () => {
  const f = useCurrentFrame();

  const orbA = {
    x: W * 0.5 + Math.sin(f / 70) * 260,
    y: H * 0.35 + Math.cos(f / 90) * 120,
  };
  const orbB = {
    x: W * 0.8 + Math.cos(f / 110) * 140,
    y: H * 0.75 + Math.sin(f / 80) * 90,
  };

  return (
    <AbsoluteFill style={{ backgroundColor: C.bg, overflow: "hidden" }}>
      {/* drifting colour glows */}
      <div
        style={{
          position: "absolute",
          width: 1400,
          height: 1400,
          left: orbA.x - 700,
          top: orbA.y - 700,
          background: `radial-gradient(circle, rgba(6,182,212,0.22) 0%, transparent 60%)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 1200,
          height: 1200,
          left: orbB.x - 600,
          top: orbB.y - 600,
          background: `radial-gradient(circle, rgba(139,92,246,0.2) 0%, transparent 60%)`,
        }}
      />

      {/* perspective floor grid, scrolling toward the camera */}
      <div
        style={{
          position: "absolute",
          left: -W * 0.6,
          right: -W * 0.6,
          top: H * 0.42,
          bottom: -H * 0.3,
          transform: "perspective(720px) rotateX(64deg)",
          transformOrigin: "center top",
          backgroundImage: `linear-gradient(${C.line} 1px, transparent 1px), linear-gradient(90deg, ${C.line} 1px, transparent 1px)`,
          backgroundSize: "96px 96px",
          backgroundPosition: `0px ${(f * 2.2) % 96}px`,
          opacity: 0.7,
          WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 45%)",
          maskImage: "linear-gradient(to bottom, transparent 0%, black 45%)",
        } as React.CSSProperties}
      />

      {/* dust motes rising through the scene */}
      {DUST.map((d, i) => {
        const y = (((d.y - f * d.speed * 0.8) % H) + H) % H;
        const twinkle = 0.35 + 0.35 * Math.sin(f / 18 + i);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: d.x,
              top: y,
              width: d.size,
              height: d.size,
              borderRadius: "50%",
              background: d.color,
              opacity: twinkle,
              boxShadow: `0 0 ${d.size * 4}px ${d.color}`,
            }}
          />
        );
      })}

      {/* vignette */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,0.85) 100%)",
        }}
      />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Scene 1 — kinetic intro (0–3 s)
// ---------------------------------------------------------------------------

const INTRO_DUR = 100;
const INTRO_SUB = "// AUTONOMOUS INTELLIGENCE";
const SPEED_LINES = Array.from({ length: 26 }, (_, i) => ({
  y: random(`sl-y-${i}`) * H,
  len: 120 + random(`sl-l-${i}`) * 320,
  offset: random(`sl-o-${i}`) * W * 1.6,
  thick: random(`sl-t-${i}`) > 0.6 ? 2 : 1,
  color: i % 2 === 0 ? C.cyan : C.violet,
}));

const Intro: React.FC = () => {
  const lf = useCurrentFrame();
  const { fps } = useVideoConfig();
  const env = envelope(lf, INTRO_DUR, 0, 10);

  const word = "AINGENEER";
  const typed = Math.floor(interpolate(lf, [48, 82], [0, INTRO_SUB.length], CLAMP));
  const sweepY = interpolate(lf, [0, 38], [-10, H + 10], CLAMP);
  const sweepOpacity = interpolate(lf, [0, 6, 34, 42], [0, 1, 1, 0], CLAMP);
  const hudOpacity = interpolate(lf, [60, 78], [0, 1], CLAMP);
  const flash = interpolate(lf, [0, 4, 14], [0.5, 0.15, 0], CLAMP);

  return (
    <AbsoluteFill style={{ opacity: env, justifyContent: "center", alignItems: "center" }}>
      {/* high-speed streaks, fading out as the wordmark locks in */}
      {SPEED_LINES.map((s, i) => {
        const x = W - (((lf * 46 + s.offset) % (W * 1.6)) - W * 0.2);
        const fade = interpolate(lf, [0, 6, 30, 46], [0, 1, 0.7, 0], CLAMP);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: s.y,
              width: s.len,
              height: s.thick,
              background: `linear-gradient(90deg, transparent, ${s.color})`,
              opacity: fade,
            }}
          />
        );
      })}

      {/* scan line */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: sweepY,
          height: 3,
          background: `linear-gradient(90deg, transparent, ${C.cyan}, transparent)`,
          boxShadow: `0 0 30px ${C.cyan}`,
          opacity: sweepOpacity,
        }}
      />

      {/* flash on the first frames */}
      <AbsoluteFill style={{ background: C.cyan, opacity: flash, mixBlendMode: "screen" }} />

      {/* wordmark: each letter springs in from depth */}
      <div style={{ perspective: 1200, display: "flex" }}>
        {word.split("").map((ch, i) => {
          const s = sp(lf, fps, 3 + i * 2.5, 13, 170);
          return (
            <span
              key={i}
              style={{
                display: "inline-block",
                fontFamily: SANS,
                fontWeight: 900,
                fontSize: 230,
                letterSpacing: -6,
                color: C.text,
                transformOrigin: "50% 100%",
                transform: `translate3d(0, ${(1 - s) * 140}px, ${(1 - s) * -520}px) rotateX(${(1 - s) * -75}deg)`,
                opacity: Math.min(1, s),
                textShadow: `0 0 70px rgba(6,182,212,${0.4 * Math.min(1, s)})`,
              }}
            >
              {ch}
            </span>
          );
        })}
      </div>

      {/* typed tagline */}
      <div
        style={{
          fontFamily: MONO,
          fontSize: 44,
          letterSpacing: 6,
          color: C.cyan,
          marginTop: 22,
          minHeight: 56,
          ...glowText(C.cyan, 0.5),
        }}
      >
        {INTRO_SUB.slice(0, typed)}
        <span style={{ opacity: Math.floor(lf / 8) % 2 === 0 ? 1 : 0 }}>_</span>
      </div>

      {/* HUD footer */}
      <div
        style={{
          position: "absolute",
          bottom: 70,
          left: 0,
          right: 0,
          textAlign: "center",
          fontFamily: MONO,
          fontSize: 20,
          letterSpacing: 4,
          color: C.dim,
          opacity: hudOpacity,
        }}
      >
        SYS.BOOT 0x7F3A · CORE ONLINE · EU-HOSTED
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Scene 2 — fleet telemetry (3–7 s)
// ---------------------------------------------------------------------------

const TELEMETRY_DUR = 130;

// Cubic bezier route Munich → Salzburg in map-SVG coordinates (viewBox 1000×500).
const ROUTE_P = [
  [260, 380],
  [400, 300],
  [560, 300],
  [760, 180],
] as const;
const ROUTE_D = `M${ROUTE_P[0][0]} ${ROUTE_P[0][1]} C${ROUTE_P[1][0]} ${ROUTE_P[1][1]} ${ROUTE_P[2][0]} ${ROUTE_P[2][1]} ${ROUTE_P[3][0]} ${ROUTE_P[3][1]}`;

const bezier = (t: number): { x: number; y: number } => {
  const u = 1 - t;
  const [p0, p1, p2, p3] = ROUTE_P;
  const x = u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0];
  const y = u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1];
  return { x, y };
};

const NODES = Array.from({ length: 34 }, (_, i) => ({
  x: 40 + random(`node-x-${i}`) * 920,
  y: 30 + random(`node-y-${i}`) * 440,
  active: random(`node-a-${i}`) > 0.55,
}));

const CAN_LINES = [
  { color: C.cyan, d: "M0 22 H60 L76 6 H150 L166 22 H240", id: "a" },
  { color: C.emerald, d: "M0 22 H40 L56 38 H120 L136 22 H240", id: "b" },
  { color: C.violet, d: "M0 22 H90 L106 6 H180 L196 22 H240", id: "c" },
];

const Gauge: React.FC<{
  x: number;
  y: number;
  label: string;
  unit: string;
  max: number;
  decimals?: number;
  color: string;
  delay: number;
}> = ({ x, y, label, unit, max, decimals = 0, color, delay }) => {
  const lf = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = sp(lf, fps, delay, 18, 120);
  const r = 90;
  const circ = 2 * Math.PI * r;
  const arc = circ * 0.75;
  const value = interpolate(lf, [delay, delay + 60], [0, max], {
    ...CLAMP,
    easing: EXPO_OUT,
  });
  const shown = decimals > 0 ? value.toFixed(decimals) : Math.round(value).toString();

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: 240,
        height: 240,
        opacity: Math.min(1, s),
        transform: `scale(${0.8 + 0.2 * s})`,
      }}
    >
      <svg width={240} height={240} viewBox="0 0 240 240">
        <circle
          cx={120}
          cy={120}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={10}
          strokeLinecap="round"
          strokeDasharray={`${arc} ${circ}`}
          transform="rotate(135 120 120)"
        />
        <circle
          cx={120}
          cy={120}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={10}
          strokeLinecap="round"
          strokeDasharray={`${arc * (value / max)} ${circ}`}
          transform="rotate(135 120 120)"
          style={{ filter: `drop-shadow(0 0 8px ${color})` }}
        />
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: MONO,
        }}
      >
        <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 56, color: C.text }}>
          {shown}
        </div>
        <div style={{ fontSize: 18, letterSpacing: 3, color: C.dim }}>{unit}</div>
      </div>
      <div
        style={{
          position: "absolute",
          bottom: -36,
          left: 0,
          right: 0,
          textAlign: "center",
          fontFamily: MONO,
          fontSize: 18,
          letterSpacing: 4,
          color,
        }}
      >
        {label}
      </div>
    </div>
  );
};

const Telemetry: React.FC = () => {
  const lf = useCurrentFrame();
  const { fps } = useVideoConfig();
  const env = envelope(lf, TELEMETRY_DUR, 10, 10);

  const heading = sp(lf, fps, 4, 16, 150);
  const draw = interpolate(lf, [22, 80], [0, 1], { ...CLAMP, easing: IN_OUT });
  const vehicleT = interpolate(lf, [22, 92], [0, 1], { ...CLAMP, easing: IN_OUT });
  const vehicle = bezier(vehicleT);
  const pulse = 0.5 + 0.5 * Math.sin(lf / 6);
  const munichIn = sp(lf, fps, 16, 14, 180);
  const salzburgIn = sp(lf, fps, 70, 14, 180);
  const canIn = sp(lf, fps, 30, 16, 140);
  const tickerX = -((lf * 4) % 1100);

  return (
    <AbsoluteFill style={{ opacity: env }}>
      {/* heading */}
      <div
        style={{
          position: "absolute",
          left: 120,
          top: 92,
          opacity: Math.min(1, heading),
          transform: `translate3d(0, ${(1 - heading) * 40}px, 0)`,
        }}
      >
        <div style={{ fontFamily: MONO, fontSize: 22, letterSpacing: 6, color: C.emerald }}>
          FLEET TELEMETRY · LIVE
        </div>
        <div
          style={{
            fontFamily: SANS,
            fontWeight: 800,
            fontSize: 96,
            letterSpacing: -2,
            color: C.text,
            marginTop: 8,
          }}
        >
          Bayern <span style={gradientText}>Logistik &amp; Automotive</span>
        </div>
      </div>

      {/* route map */}
      <div
        style={{
          position: "absolute",
          left: 120,
          top: 300,
          width: 1000,
          height: 500,
          perspective: 1400,
        }}
      >
        <div style={{ width: 1000, height: 500, transform: "rotateX(14deg) rotateY(-4deg)", transformStyle: "preserve-3d" }}>
          <svg width={1000} height={500} viewBox="0 0 1000 500" style={{ overflow: "visible" }}>
            <defs>
              <pattern id="ae-grid" width="50" height="50" patternUnits="userSpaceOnUse">
                <path d="M50 0 H0 V50" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="1000" height="500" fill="url(#ae-grid)" />
            {NODES.map((n, i) => (
              <circle
                key={i}
                cx={n.x}
                cy={n.y}
                r={n.active ? 3 : 2}
                fill={n.active ? C.cyan : "rgba(255,255,255,0.25)"}
                opacity={n.active ? 0.4 + 0.4 * Math.sin(lf / 10 + i) : 0.5}
              />
            ))}
            {/* ghost route */}
            <path d={ROUTE_D} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth={2} strokeDasharray="4 8" />
            {/* drawn route */}
            <path
              d={ROUTE_D}
              fill="none"
              stroke={C.cyan}
              strokeWidth={4}
              strokeLinecap="round"
              pathLength={1}
              strokeDasharray={1}
              strokeDashoffset={1 - draw}
              style={{ filter: `drop-shadow(0 0 10px ${C.cyan})` }}
            />
            {/* vehicle */}
            <circle cx={vehicle.x} cy={vehicle.y} r={22 + pulse * 6} fill={C.cyan} opacity={0.15} />
            <circle cx={vehicle.x} cy={vehicle.y} r={8} fill={C.cyan} style={{ filter: `drop-shadow(0 0 12px ${C.cyan})` }} />
            {/* waypoints */}
            <g opacity={munichIn}>
              <circle cx={ROUTE_P[0][0]} cy={ROUTE_P[0][1]} r={7} fill={C.bg} stroke={C.text} strokeWidth={3} />
              <text x={ROUTE_P[0][0] - 20} y={ROUTE_P[0][1] + 44} fill={C.text} fontFamily={MONO} fontSize={22} letterSpacing={3}>
                MÜNCHEN
              </text>
              <text x={ROUTE_P[0][0] - 20} y={ROUTE_P[0][1] + 68} fill={C.dim} fontFamily={MONO} fontSize={16}>
                48.1351°N 11.5820°E
              </text>
            </g>
            <g opacity={salzburgIn}>
              <circle cx={ROUTE_P[3][0]} cy={ROUTE_P[3][1]} r={7 + pulse * 5} fill="none" stroke={C.emerald} strokeWidth={2} />
              <circle cx={ROUTE_P[3][0]} cy={ROUTE_P[3][1]} r={7} fill={C.emerald} />
              <text x={ROUTE_P[3][0] - 40} y={ROUTE_P[3][1] - 26} fill={C.text} fontFamily={MONO} fontSize={22} letterSpacing={3}>
                SALZBURG
              </text>
              <text x={ROUTE_P[3][0] - 40} y={ROUTE_P[3][1] - 50} fill={C.dim} fontFamily={MONO} fontSize={16}>
                47.8095°N 13.0550°E · 145 KM
              </text>
            </g>
          </svg>
        </div>
      </div>

      {/* CAN-bus panel */}
      <div
        style={{
          position: "absolute",
          left: 150,
          top: 330,
          width: 330,
          padding: "22px 26px",
          borderRadius: 18,
          background: C.glass,
          border: `1px solid ${C.line}`,
          backdropFilter: "blur(10px)",
          opacity: canIn,
          transform: `translate3d(${(1 - canIn) * -60}px, 0, 0)`,
        }}
      >
        <div style={{ fontFamily: MONO, fontSize: 16, letterSpacing: 3, color: C.dim, marginBottom: 14 }}>
          CAN-BUS · 500 kbit/s
        </div>
        {CAN_LINES.map((l, i) => (
          <svg key={l.id} width={280} height={44} viewBox="0 0 240 44" style={{ display: "block", marginBottom: 6 }}>
            <path d={l.d} transform={`translate(0 ${i * 12})`} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={3} />
            <path
              d={l.d}
              transform={`translate(0 ${i * 12})`}
              fill="none"
              stroke={l.color}
              strokeWidth={3}
              strokeLinejoin="round"
              strokeDasharray="14 12"
              strokeDashoffset={-lf * 3 - i * 9}
              style={{ filter: `drop-shadow(0 0 6px ${l.color})` }}
            />
          </svg>
        ))}
      </div>

      {/* gauges */}
      <Gauge x={1340} y={250} label="SPEED" unit="KM/H" max={118} color={C.cyan} delay={24} />
      <Gauge x={1340} y={500} label="THROUGHPUT" unit="MSG/S" max={4800} color={C.emerald} delay={36} />
      <Gauge x={1340} y={750} label="LATENCY" unit="MS" max={12.4} decimals={1} color={C.violet} delay={48} />

      {/* scrolling telemetry ticker */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 60,
          height: 46,
          overflow: "hidden",
          borderTop: `1px solid ${C.line}`,
          borderBottom: `1px solid ${C.line}`,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: tickerX,
            top: 8,
            whiteSpace: "nowrap",
            fontFamily: MONO,
            fontSize: 20,
            letterSpacing: 3,
            color: C.dim,
          }}
        >
          {"GEOFENCE OK · ROUTE A8 · ECU-07 NOMINAL · TEMP 22.4°C · FUEL 61% · DRIVER AUTH ✓ · ".repeat(4)}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Scene 3 — sovereign AI governance & cryptographic compliance (7–11 s)
// ---------------------------------------------------------------------------

const GOV_DUR = 130;
const HASHES = Array.from({ length: 5 }, (_, i) =>
  Array.from({ length: 16 }, (_, j) => Math.floor(random(`hash-${i}-${j}`) * 16).toString(16)).join(""),
);
const PILLARS = [
  "DSGVO · DATA RESIDENCY IN THE EU",
  "EU AI ACT · RISK-BASED GOVERNANCE",
  "CRYPTOGRAPHIC AUDIT · SHA-256 CHAIN",
];

const Governance: React.FC = () => {
  const lf = useCurrentFrame();
  const { fps } = useVideoConfig();
  const env = envelope(lf, GOV_DUR, 10, 10);

  const shield = sp(lf, fps, 2, 15, 140);
  const check = interpolate(lf, [26, 50], [0, 1], { ...CLAMP, easing: IN_OUT });
  const title1 = sp(lf, fps, 10, 14, 160);
  const title2 = sp(lf, fps, 18, 14, 160);

  return (
    <AbsoluteFill style={{ opacity: env }}>
      {/* left column */}
      <div style={{ position: "absolute", left: 150, top: 170, width: 860 }}>
        <svg width={150} height={178} viewBox="0 0 160 190" style={{ opacity: Math.min(1, shield), transform: `scale(${0.7 + 0.3 * shield})`, transformOrigin: "left top" }}>
          <path
            d="M80 8 L150 34 V92 C150 140 120 170 80 184 C40 170 10 140 10 92 V34 Z"
            fill="rgba(16,185,129,0.08)"
            stroke={C.emerald}
            strokeWidth={4}
            style={{ filter: `drop-shadow(0 0 12px ${C.emerald})` }}
          />
          <path
            d="M52 98 L72 118 L110 78"
            fill="none"
            stroke={C.emerald}
            strokeWidth={8}
            strokeLinecap="round"
            strokeLinejoin="round"
            pathLength={1}
            strokeDasharray={1}
            strokeDashoffset={1 - check}
          />
        </svg>

        <div
          style={{
            fontFamily: SANS,
            fontWeight: 800,
            fontSize: 104,
            lineHeight: 0.98,
            letterSpacing: -3,
            color: C.text,
            marginTop: 34,
            opacity: Math.min(1, title1),
            transform: `translate3d(${(1 - title1) * -120}px, 0, 0)`,
          }}
        >
          Sovereign AI
        </div>
        <div
          style={{
            fontFamily: SANS,
            fontWeight: 800,
            fontSize: 104,
            lineHeight: 0.98,
            letterSpacing: -3,
            marginTop: 6,
            opacity: Math.min(1, title2),
            transform: `translate3d(${(1 - title2) * -120}px, 0, 0)`,
          }}
        >
          <span style={gradientText}>Governance</span>
        </div>

        <div style={{ marginTop: 48, display: "flex", flexDirection: "column", gap: 18 }}>
          {PILLARS.map((p, i) => {
            const s = sp(lf, fps, 40 + i * 12, 16, 150);
            return (
              <div
                key={p}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 18,
                  fontFamily: MONO,
                  fontSize: 26,
                  letterSpacing: 2,
                  color: C.text,
                  opacity: Math.min(1, s),
                  transform: `translate3d(${(1 - s) * -80}px, 0, 0)`,
                }}
              >
                <span
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 9,
                    border: `2px solid ${C.emerald}`,
                    color: C.emerald,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 22,
                    fontWeight: 700,
                    boxShadow: `0 0 16px rgba(16,185,129,${0.5 * s})`,
                  }}
                >
                  ✓
                </span>
                {p}
              </div>
            );
          })}
        </div>
      </div>

      {/* right: 3D hash chain */}
      <div
        style={{
          position: "absolute",
          left: 1120,
          top: 150,
          width: 640,
          perspective: 1000,
        }}
      >
        <div style={{ transform: "rotateY(-22deg) rotateX(6deg)", transformStyle: "preserve-3d" }}>
          {HASHES.map((h, i) => {
            const s = sp(lf, fps, 22 + i * 14, 15, 150);
            const link = interpolate(lf, [30 + i * 14, 48 + i * 14], [0, 1], CLAMP);
            return (
              <React.Fragment key={i}>
                <div
                  style={{
                    position: "relative",
                    width: 600,
                    height: 124,
                    borderRadius: 18,
                    background: C.glass,
                    border: `1px solid rgba(6,182,212,${0.25 + 0.5 * s})`,
                    boxShadow: `0 0 ${30 * s}px rgba(6,182,212,${0.25 * s})`,
                    padding: "18px 26px",
                    boxSizing: "border-box",
                    opacity: Math.min(1, s),
                    transform: `translate3d(${(1 - s) * 260}px, 0, ${(1 - s) * -300}px)`,
                    backdropFilter: "blur(10px)",
                    fontFamily: MONO,
                    color: C.text,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 18, letterSpacing: 3, color: C.dim }}>
                    <span>BLOCK 0{i + 1}</span>
                    <span style={{ color: C.emerald }}>SIGNED ✓</span>
                  </div>
                  <div style={{ fontSize: 26, marginTop: 14, letterSpacing: 1 }}>
                    0x{h.slice(0, 8)}…{h.slice(-6)}
                  </div>
                </div>
                {i < HASHES.length - 1 && (
                  <div
                    style={{
                      width: 3,
                      height: 26,
                      margin: "0 auto",
                      background: `linear-gradient(to bottom, ${C.cyan}, ${C.violet})`,
                      transform: `scaleY(${link})`,
                      transformOrigin: "top",
                      boxShadow: `0 0 10px ${C.cyan}`,
                    }}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Scene 4 — explosive finale (11–15 s)
// ---------------------------------------------------------------------------

const FINALE_DUR = 120;
const BURST = Array.from({ length: 70 }, (_, i) => ({
  angle: random(`burst-a-${i}`) * Math.PI * 2,
  dist: 380 + random(`burst-d-${i}`) * 720,
  size: 2 + random(`burst-s-${i}`) * 5,
  color: i % 3 === 0 ? C.cyan : i % 3 === 1 ? C.violet : C.emerald,
}));

const Finale: React.FC = () => {
  const lf = useCurrentFrame();
  const { fps } = useVideoConfig();

  // impact at frame 0 of this scene: damped shake + punch-in
  const impact = Math.max(0, 1 - lf / 16);
  const shakeX = Math.sin(lf * 2.7) * 22 * impact;
  const shakeY = Math.cos(lf * 3.1) * 16 * impact;
  const zoom = interpolate(lf, [0, 120], [1, 1.06], { ...CLAMP, easing: IN_OUT });

  const line1 = sp(lf, fps, 2, 11, 200);
  const line2 = sp(lf, fps, 8, 11, 200);
  const shockScale = interpolate(lf, [0, 36], [0, 7], { ...CLAMP, easing: EXPO_OUT });
  const shockOpacity = interpolate(lf, [0, 6, 36], [0, 0.9, 0], CLAMP);
  const flash = interpolate(lf, [0, 5, 18], [0.7, 0.2, 0], CLAMP);
  const url = sp(lf, fps, 46, 14, 160);
  const pulse = 0.6 + 0.4 * Math.sin(lf / 7);

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", overflow: "hidden" }}>
      <AbsoluteFill style={{ background: "#FFFFFF", opacity: flash * 0.4, mixBlendMode: "screen" }} />

      {/* shock ring */}
      <div
        style={{
          position: "absolute",
          width: 300,
          height: 300,
          borderRadius: "50%",
          border: `4px solid ${C.cyan}`,
          transform: `scale(${shockScale})`,
          opacity: shockOpacity,
          boxShadow: `0 0 60px ${C.cyan}`,
        }}
      />

      {/* burst particles */}
      {BURST.map((b, i) => {
        const d = interpolate(lf, [0, 40], [0, b.dist], { ...CLAMP, easing: EXPO_OUT });
        const o = interpolate(lf, [0, 10, 60], [0, 1, 0], CLAMP);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              width: b.size,
              height: b.size,
              borderRadius: "50%",
              background: b.color,
              boxShadow: `0 0 ${b.size * 3}px ${b.color}`,
              transform: `translate3d(${Math.cos(b.angle) * d}px, ${Math.sin(b.angle) * d}px, 0)`,
              opacity: o,
            }}
          />
        );
      })}

      <div
        style={{
          transform: `translate3d(${shakeX}px, ${shakeY}px, 0) scale(${zoom})`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <div
          style={{
            fontFamily: SANS,
            fontWeight: 900,
            fontSize: 150,
            letterSpacing: -5,
            lineHeight: 0.95,
            color: C.text,
            opacity: Math.min(1, line1),
            transform: `scale(${1 + (1 - line1) * 0.8})`,
            filter: `blur(${(1 - Math.min(1, line1)) * 14}px)`,
            ...glowText(C.cyan, 0.5),
          }}
        >
          ENGINEERING
        </div>
        <div
          style={{
            fontFamily: SANS,
            fontWeight: 900,
            fontSize: 150,
            letterSpacing: -5,
            lineHeight: 0.95,
            opacity: Math.min(1, line2),
            transform: `scale(${1 + (1 - line2) * 0.8})`,
            filter: `blur(${(1 - Math.min(1, line2)) * 14}px)`,
          }}
        >
          <span style={gradientText}>THE UNTHINKABLE</span>
        </div>

        <div
          style={{
            marginTop: 64,
            fontFamily: MONO,
            fontSize: 52,
            letterSpacing: 2,
            color: C.cyan,
            opacity: Math.min(1, url),
            transform: `translate3d(0, ${(1 - url) * 30}px, 0)`,
            textShadow: `0 0 ${30 * pulse}px rgba(6,182,212,${pulse})`,
          }}
        >
          aingeneer.com
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Composition
// ---------------------------------------------------------------------------

export const AingeneerHeroShowreel: React.FC = () => {
  const f = useCurrentFrame();

  // global camera: slow drift + gentle orbit so the whole frame breathes
  const camRx = Math.sin(f / 90) * 1.4;
  const camRy = Math.cos(f / 120) * 2.2;
  const camZ = 1 + Math.sin(f / 150) * 0.01;

  // brand bug: appears after the intro, leaves before the finale wordmark
  const bugOpacity = interpolate(f, [96, 116, 404, 420], [0, 1, 1, 0], CLAMP);

  // thin progress rule across the bottom
  const progress = interpolate(f, [0, DURATION], [0, W], CLAMP);

  return (
    <AbsoluteFill style={{ backgroundColor: C.bg, overflow: "hidden" }}>
      <Background />

      <AbsoluteFill
        style={{
          perspective: 1600,
          transformStyle: "preserve-3d",
          transform: `rotateX(${camRx}deg) rotateY(${camRy}deg) scale(${camZ})`,
        }}
      >
        <Sequence from={0} durationInFrames={INTRO_DUR}>
          <AbsoluteFill>
            <Intro />
          </AbsoluteFill>
        </Sequence>
        <Sequence from={90} durationInFrames={TELEMETRY_DUR}>
          <AbsoluteFill>
            <Telemetry />
          </AbsoluteFill>
        </Sequence>
        <Sequence from={210} durationInFrames={GOV_DUR}>
          <AbsoluteFill>
            <Governance />
          </AbsoluteFill>
        </Sequence>
        <Sequence from={330} durationInFrames={FINALE_DUR}>
          <AbsoluteFill>
            <Finale />
          </AbsoluteFill>
        </Sequence>
      </AbsoluteFill>

      {/* brand bug, top-left */}
      <div
        style={{
          position: "absolute",
          left: 80,
          top: 60,
          fontFamily: MONO,
          fontSize: 22,
          letterSpacing: 5,
          color: C.text,
          opacity: bugOpacity,
        }}
      >
        AINGENEER<span style={{ color: C.cyan }}> //</span>
      </div>

      {/* progress rule */}
      <div
        style={{
          position: "absolute",
          left: 0,
          bottom: 0,
          width: progress,
          height: 4,
          background: `linear-gradient(90deg, ${C.cyan}, ${C.violet}, ${C.emerald})`,
          boxShadow: `0 0 16px ${C.cyan}`,
        }}
      />
    </AbsoluteFill>
  );
};
