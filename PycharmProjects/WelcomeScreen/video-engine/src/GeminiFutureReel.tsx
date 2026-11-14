import React from "react";
import {
  AbsoluteFill,
  Audio,
  Easing,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

/*
 * =========================================================================
 * GEMINI FUTURE REEL — 1080x1920 @ 60 FPS, 1920 FRAMES (32s)
 *
 * Scenes:
 *   0.0 – 4.5s   : Hook title + glass crystal ball (Google G base)
 *   4.5 – 10.0s  : Camera zoom into the ball, neon past/future chart
 *   10.0 – 17.0s : 3D tilted glass cards fly in (stocks / weather / traffic)
 *   17.0 – 25.0s : Neural matrix plane, correlations light up
 *   25.0 – 32.0s : Zoom back to the ball + kinetic "ЭТО ПРОСТО МАТЕМАТИКА."
 *
 * Camera beats every ~1.8s (perspective tilt + punch) keep the cut rhythm.
 * Subtitles: 21 chunks from /tmp/gemini_future/subs.json, hardcoded below,
 * popping in with spring() at the bottom (~320px from the edge).
 * =========================================================================
 */

const FPS = 60;
const PW = 1080;
const PH = 1920;
const BALL_X = 540;
const BALL_Y = 820;
const BALL_D = 600;

const C = {
  bg: "#07080d",
  blue: "#3b82f6",
  blueLight: "#60a5fa",
  cyan: "#22d3ee",
  gold: "#facc15",
  white: "#ffffff",
};

const SANS =
  "'Helvetica Neue', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
const SERIF = "Georgia, 'Times New Roman', 'Noto Serif', serif";
const MONO = "'SF Mono', Menlo, Consolas, monospace";

const CLAMP = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const EASE = Easing.bezier(0.65, 0, 0.35, 1);
const EXPO_OUT = Easing.bezier(0.16, 1, 0.3, 1);
const SPRING = { damping: 14, stiffness: 170, mass: 0.7 };

const sec = (s: number) => Math.round(s * FPS);

// Kinetic subtitle chunks (from /tmp/gemini_future/subs.json, 21 chunks)
const SUBS: { start: number; end: number; text: string }[] = [
  { start: 0.0, end: 0.93, text: "Google только что" },
  { start: 0.99, end: 2.79, text: "научил Gemini предсказывать" },
  { start: 2.84, end: 4.83, text: "будущее. И нет," },
  { start: 4.95, end: 6.01, text: "это не магия." },
  { start: 6.4, end: 7.31, text: "Это новая модель" },
  { start: 7.34, end: 9.4, text: "временных рядов TimesFM." },
  { start: 9.73, end: 11.53, text: "Обычный ИИ просто" },
  { start: 11.57, end: 13.08, text: "угадывает следующее слово" },
  { start: 13.11, end: 14.3, text: "в тексте. А" },
  { start: 14.38, end: 15.67, text: "новая модель загружает" },
  { start: 15.74, end: 17.17, text: "миллионы графиков из" },
  { start: 17.23, end: 19.2, text: "прошлого: акции, погоду," },
  { start: 19.23, end: 20.77, text: "спрос, трафик. Она" },
  { start: 20.82, end: 22.2, text: "находит скрытые паттерны," },
  { start: 22.22, end: 23.13, text: "которые не видит" },
  { start: 23.18, end: 24.64, text: "человек. И строит" },
  { start: 24.69, end: 26.31, text: "точный вероятностный коридор" },
  { start: 26.37, end: 27.27, text: "того, что случится" },
  { start: 27.34, end: 29.29, text: "завтра. Будущее больше" },
  { start: 29.34, end: 30.64, text: "не загадка. Это" },
  { start: 30.67, end: 31.86, text: "просто математика." },
];
const SUB_FRAMES = SUBS.map((s) => ({
  from: sec(s.start),
  to: sec(s.end),
  text: s.text,
}));

// Camera beats every ~1.8s (all within the 1.5–2.5s rule)
const BEATS = [
  1.8, 3.6, 5.5, 7.3, 9.1, 10.9, 12.7, 14.5, 16.3, 18.1, 19.9, 21.7, 23.6,
  25.4, 27.2, 29.0, 30.8,
].map(sec);

// Spring that starts at `delay` (returns 0 before it)
const sp = (
  frame: number,
  delay: number,
  fps: number,
  config = SPRING,
): number => spring({ frame: Math.max(0, frame - delay), fps, config });

const beatKick = (frame: number) => {
  let last = -1;
  for (let i = 0; i < BEATS.length; i++) {
    if (BEATS[i] <= frame) last = i;
  }
  if (last < 0) return { scale: 1, tilt: 0 };
  const e = frame - BEATS[last];
  const decay = Math.exp(-e / 9);
  const dir = last % 2 === 0 ? 1 : -1;
  return { scale: 1 + 0.025 * decay, tilt: dir * 3.2 * decay };
};

const GRID_BG: React.CSSProperties = {
  backgroundImage:
    "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
  backgroundSize: "72px 72px",
};

// ---------------------------------------------------------------------------
// Crystal ball (glass, floating particles, Google G at the base)
// ---------------------------------------------------------------------------
const PARTICLES = Array.from({ length: 28 }, (_, i) => ({
  a: i * 2.399963,
  r: 0.6 + ((i * 37) % 17) / 17 * 0.5,
  s: 3 + (i % 4),
  ph: i * 0.7,
  dir: i % 2 === 0 ? 1 : -1,
}));

const CrystalBall: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = sp(frame, 0, fps, { damping: 12, stiffness: 120, mass: 0.9 });
  const tiltX = 8 + Math.sin(frame / 80) * 3;
  const tiltY = Math.sin(frame / 110) * 12;
  const bob = Math.sin(frame / 45) * 10;

  return (
    <div
      style={{
        position: "absolute",
        left: BALL_X - BALL_D / 2,
        top: BALL_Y - BALL_D / 2 + bob,
        width: BALL_D,
        height: BALL_D,
        transform: `perspective(1400px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale(${0.6 + 0.4 * enter})`,
      }}
    >
      {/* Glass sphere */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          background:
            "radial-gradient(circle at 34% 30%, rgba(255,255,255,0.55) 0%, rgba(191,219,254,0.22) 14%, rgba(59,130,246,0.14) 42%, rgba(15,23,42,0.35) 75%, rgba(7,8,13,0.9) 100%)",
          border: "2px solid rgba(255,255,255,0.22)",
          boxShadow:
            "0 0 120px rgba(59,130,246,0.45), inset 0 0 120px rgba(96,165,250,0.35), inset -30px -40px 80px rgba(7,8,13,0.6)",
          backdropFilter: "blur(14px)",
        }}
      />
      {/* Specular highlight */}
      <div
        style={{
          position: "absolute",
          left: "14%",
          top: "9%",
          width: "42%",
          height: "22%",
          borderRadius: "50%",
          background:
            "linear-gradient(rgba(255,255,255,0.75), rgba(255,255,255,0))",
          transform: "rotate(-25deg)",
          filter: "blur(6px)",
          opacity: 0.8,
        }}
      />
      {/* Floating particles */}
      {PARTICLES.map((p, i) => {
        const ang = p.a + (frame / 500) * p.dir;
        const rad = (p.r * BALL_D) / 2;
        const x = Math.cos(ang) * rad;
        const y = Math.sin(ang) * rad + Math.sin(frame / 30 + p.ph) * 8;
        const op = 0.4 + 0.4 * Math.sin(frame / 25 + p.ph);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: BALL_D / 2 + x - p.s / 2,
              top: BALL_D / 2 + y - p.s / 2,
              width: p.s,
              height: p.s,
              borderRadius: "50%",
              background: C.blueLight,
              boxShadow: `0 0 ${p.s * 4}px ${C.blueLight}`,
              opacity: op * enter,
            }}
          />
        );
      })}
      {/* Google G badge at the base */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: BALL_D - 66,
          width: 132,
          height: 132,
          marginLeft: -66,
          borderRadius: "50%",
          background: C.white,
          boxShadow: "0 0 60px rgba(96,165,250,0.7)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span
          style={{
            fontFamily: SANS,
            fontWeight: 900,
            fontSize: 104,
            lineHeight: 1,
            background:
              "linear-gradient(135deg, #4285F4 0%, #EA4335 35%, #FBBC05 65%, #34A853 100%)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          G
        </span>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Scene 2 — neon past / future chart (lives inside the ball after zoom)
// ---------------------------------------------------------------------------
const CH_W = 760;
const CH_H = 420;
const TODAY_X = 340;
const PAST: [number, number][] = [
  [0, 250], [30, 215], [55, 265], [80, 200], [110, 240], [140, 170],
  [165, 220], [190, 150], [215, 205], [240, 130], [262, 180], [285, 120],
  [305, 165], [325, 105], [TODAY_X, 140],
];
const FUTURE: [number, number][] = [
  [TODAY_X, 140], [380, 128], [420, 150], [460, 118], [500, 132],
  [540, 100], [580, 116], [620, 92], [660, 104], [700, 84], [740, 96],
];
const CONE_SPREAD = (x: number) => ((x - TODAY_X) / (CH_W - TODAY_X)) * 120;

const toPath = (pts: [number, number][]) =>
  pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x} ${y}`).join(" ");

const ProbabilityChart: React.FC = () => {
  const frame = useCurrentFrame();
  const op =
    interpolate(frame, [310, 345], [0, 1], CLAMP) *
    interpolate(frame, [560, 600], [1, 0], CLAMP);
  const pastP = interpolate(frame, [340, 470], [0, 1], { ...CLAMP, easing: EASE });
  const futP = interpolate(frame, [440, 540], [0, 1], { ...CLAMP, easing: EASE });
  const coneOp = interpolate(frame, [480, 530], [0, 1], CLAMP);
  const pulse = 0.75 + 0.25 * Math.sin(frame / 10);

  const upper: [number, number][] = FUTURE.map(([x, y]) => [x, y - CONE_SPREAD(x)]);
  const lower: [number, number][] = FUTURE.map(([x, y]) => [x, y + CONE_SPREAD(x)]).reverse();
  const cone = [...upper, ...lower].map(([x, y]) => `${x},${y}`).join(" ");

  return (
    <div
      style={{
        position: "absolute",
        left: BALL_X - CH_W / 2,
        top: BALL_Y - CH_H / 2,
        width: CH_W,
        height: CH_H,
        opacity: op,
      }}
    >
      <svg width={CH_W} height={CH_H} viewBox={`0 0 ${CH_W} ${CH_H}`} style={{ overflow: "visible" }}>
        <defs>
          <linearGradient id="gfCone" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={C.blueLight} stopOpacity={0.4} />
            <stop offset="100%" stopColor={C.blueLight} stopOpacity={0.02} />
          </linearGradient>
          <filter id="gfGlow" x="-20%" y="-50%" width="140%" height="200%">
            <feGaussianBlur stdDeviation="5" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Today divider */}
        <line
          x1={TODAY_X}
          y1={0}
          x2={TODAY_X}
          y2={380}
          stroke="rgba(255,255,255,0.6)"
          strokeWidth={2}
          strokeDasharray="10 8"
        />

        {/* Probability cone */}
        <polygon points={cone} fill="url(#gfCone)" opacity={coneOp} />

        {/* Past (white, jagged) */}
        <path
          d={toPath(PAST)}
          fill="none"
          stroke={C.white}
          strokeWidth={5}
          strokeLinejoin="round"
          strokeLinecap="round"
          pathLength={1}
          strokeDasharray="1 1"
          strokeDashoffset={1 - pastP}
        />

        {/* Future (glowing blue, pulsing) */}
        <path
          d={toPath(FUTURE)}
          fill="none"
          stroke={C.blueLight}
          strokeWidth={6}
          strokeLinejoin="round"
          strokeLinecap="round"
          pathLength={1}
          strokeDasharray="1 1"
          strokeDashoffset={1 - futP}
          filter="url(#gfGlow)"
          opacity={pulse}
        />

        {/* Labels */}
        <text x={10} y={404} fill={C.white} fontFamily={MONO} fontSize={24} letterSpacing={3}>
          ПРОШЛОЕ
        </text>
        <text x={TODAY_X} y={404} textAnchor="middle" fill={C.white} fontFamily={MONO} fontSize={24} letterSpacing={3}>
          СЕГОДНЯ
        </text>
        <text x={CH_W - 10} y={404} textAnchor="end" fill={C.blueLight} fontFamily={MONO} fontSize={24} letterSpacing={3}>
          БУДУЩЕЕ
        </text>
      </svg>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Scene 3 — tilted glass cards
// ---------------------------------------------------------------------------
const GlassCard: React.FC<{
  label: string;
  value: string;
  bar: number;
  from: number;
  top: number;
}> = ({ label, value, bar, from, top }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = sp(frame, from, fps, { damping: 15, stiffness: 110, mass: 0.9 });
  const barP = interpolate(frame, [from + 20, from + 90], [0, bar], {
    ...CLAMP,
    easing: EASE,
  });
  const ty = interpolate(enter, [0, 1], [460, 0]);
  const tz = interpolate(enter, [0, 1], [-800, 0]);
  const op = interpolate(enter, [0, 0.35], [0, 1], CLAMP);

  return (
    <div
      style={{
        position: "absolute",
        left: 160,
        top,
        width: 760,
        height: 200,
        boxSizing: "border-box",
        padding: "34px 44px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        opacity: op,
        transform: `perspective(1000px) rotateX(12deg) translate3d(0, ${ty}px, ${tz}px)`,
        borderRadius: 40,
        background:
          "linear-gradient(135deg, rgba(255,255,255,0.14), rgba(255,255,255,0.03))",
        border: "2px solid rgba(255,255,255,0.18)",
        boxShadow:
          "0 40px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.25)",
        backdropFilter: "blur(18px)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <span style={{ fontFamily: MONO, fontSize: 28, letterSpacing: 6, color: C.blueLight }}>
          {label}
        </span>
        <span style={{ fontFamily: SANS, fontSize: 96, fontWeight: 800, color: C.white, letterSpacing: -2 }}>
          {value}
        </span>
      </div>
      <div style={{ height: 14, borderRadius: 7, background: "rgba(255,255,255,0.1)", overflow: "hidden" }}>
        <div
          style={{
            width: `${barP * 100}%`,
            height: "100%",
            borderRadius: 7,
            background: `linear-gradient(90deg, ${C.blue}, ${C.cyan})`,
            boxShadow: `0 0 24px ${C.blueLight}`,
          }}
        />
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Scene 4 — neural pattern matrix on a 3D plane
// ---------------------------------------------------------------------------
const COLS = 9;
const ROWS = 6;
const MX = 1000;
const MY = 620;
const nodeXY = (c: number, r: number) => ({
  x: 80 + c * (840 / (COLS - 1)) + (((c * 7 + r * 13) % 5) - 2) * 6,
  y: 60 + r * (500 / (ROWS - 1)) + (((c * 11 + r * 3) % 5) - 2) * 6,
});
const idx = (c: number, r: number) => r * COLS + c;

const NODES = Array.from({ length: COLS * ROWS }, (_, i) => {
  const c = i % COLS;
  const r = Math.floor(i / COLS);
  return { c, r, ...nodeXY(c, r) };
});

const EDGES: [number, number][] = [];
for (let r = 0; r < ROWS; r++) {
  for (let c = 0; c < COLS; c++) {
    if (c + 1 < COLS && (c + r * 2) % 3 !== 0) EDGES.push([idx(c, r), idx(c + 1, r)]);
    if (r + 1 < ROWS && (c * 2 + r) % 4 !== 1) EDGES.push([idx(c, r), idx(c, r + 1)]);
  }
}

// Hidden correlations that light up in sequence (gold / cyan)
const HL_EDGES: { a: number; b: number; s: number; color: string }[] = [
  { a: idx(1, 1), b: idx(2, 2), s: 17.4, color: C.gold },
  { a: idx(5, 0), b: idx(4, 3), s: 18.3, color: C.cyan },
  { a: idx(7, 4), b: idx(8, 2), s: 19.2, color: C.gold },
  { a: idx(2, 4), b: idx(3, 1), s: 20.1, color: C.cyan },
  { a: idx(6, 2), b: idx(7, 5), s: 21.0, color: C.gold },
  { a: idx(0, 3), b: idx(1, 4), s: 21.9, color: C.cyan },
  { a: idx(4, 4), b: idx(5, 1), s: 22.8, color: C.gold },
  { a: idx(3, 2), b: idx(4, 0), s: 23.7, color: C.cyan },
].map((h) => ({ ...h, s: sec(h.s) }));

const HL_NODES = new Map<number, { s: number; color: string }>();
HL_EDGES.forEach((h) => {
  HL_NODES.set(h.a, { s: h.s, color: h.color });
  HL_NODES.set(h.b, { s: h.s, color: h.color });
});

const MatrixPlane: React.FC = () => {
  const frame = useCurrentFrame();
  const rx = interpolate(frame, [1010, 1070], [78, 58], { ...CLAMP, easing: EXPO_OUT });
  const op =
    interpolate(frame, [1010, 1060], [0, 1], CLAMP) *
    interpolate(frame, [1440, 1470], [1, 0], CLAMP);

  return (
    <div
      style={{
        position: "absolute",
        left: (PW - MX) / 2,
        top: BALL_Y - MY / 2 + 20,
        width: MX,
        height: MY,
        opacity: op,
        transform: `perspective(1400px) rotateX(${rx}deg) rotateZ(-6deg)`,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: 24,
          border: "1px solid rgba(255,255,255,0.08)",
          background: "rgba(255,255,255,0.02)",
          boxShadow: "0 60px 120px rgba(0,0,0,0.7)",
          ...GRID_BG,
          backgroundSize: "60px 60px",
        }}
      />
      <svg width={MX} height={MY} viewBox={`0 0 ${MX} ${MY}`} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        <defs>
          <filter id="gfNodeGlow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="6" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {EDGES.map(([a, b], i) => (
          <line
            key={`e${i}`}
            x1={NODES[a].x}
            y1={NODES[a].y}
            x2={NODES[b].x}
            y2={NODES[b].y}
            stroke="rgba(148,163,184,0.25)"
            strokeWidth={1.5}
          />
        ))}

        {HL_EDGES.map((h, k) => {
          const t = frame - h.s;
          const lineOp = interpolate(t, [0, 20, 220], [0, 1, 0.5], CLAMP);
          const A = NODES[h.a];
          const B = NODES[h.b];
          const p = interpolate(t, [0, 60], [0, 1], { ...CLAMP, easing: EASE });
          const packetX = A.x + (B.x - A.x) * ((t / 50) % 1);
          const packetY = A.y + (B.y - A.y) * ((t / 50) % 1);
          return (
            <g key={`h${k}`}>
              <line
                x1={A.x}
                y1={A.y}
                x2={A.x + (B.x - A.x) * p}
                y2={A.y + (B.y - A.y) * p}
                stroke={h.color}
                strokeWidth={3}
                opacity={lineOp}
                filter="url(#gfNodeGlow)"
              />
              {t > 0 && (
                <circle cx={packetX} cy={packetY} r={5} fill={h.color} opacity={lineOp} />
              )}
            </g>
          );
        })}

        {NODES.map((n, i) => {
          const hl = HL_NODES.get(i);
          if (!hl) {
            return <circle key={`n${i}`} cx={n.x} cy={n.y} r={4} fill="rgba(226,232,240,0.55)" />;
          }
          const t = frame - hl.s;
          const glow = interpolate(t, [0, 15, 120], [0, 1, 0.6], CLAMP);
          return (
            <circle
              key={`n${i}`}
              cx={n.x}
              cy={n.y}
              r={5 + glow * 5}
              fill={hl.color}
              filter="url(#gfNodeGlow)"
              opacity={0.4 + glow * 0.6}
            />
          );
        })}
      </svg>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Scene 1 — hook title with selection box
// ---------------------------------------------------------------------------
const HookTitle: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const out = interpolate(frame, [265, 300], [1, 0], CLAMP);
  const l1 = sp(frame, 0, fps);
  const l2 = sp(frame, 30, fps);
  const wipe = interpolate(frame, [50, 95], [0, 1], { ...CLAMP, easing: EASE });
  const handles = sp(frame, 95, fps, { damping: 10, stiffness: 200, mass: 0.5 });

  const corners: React.CSSProperties[] = [
    { top: -11, left: -11 },
    { top: -11, right: -11 },
    { bottom: -11, left: -11 },
    { bottom: -11, right: -11 },
  ];

  return (
    <div
      style={{
        position: "absolute",
        top: 170,
        left: 0,
        right: 0,
        textAlign: "center",
        opacity: out,
        fontFamily: SANS,
      }}
    >
      <div
        style={{
          fontSize: 118,
          fontWeight: 800,
          color: C.white,
          letterSpacing: -3,
          opacity: l1,
          transform: `translateY(${(1 - l1) * 50}px)`,
        }}
      >
        Google Gemini
      </div>
      <div
        style={{
          display: "inline-block",
          position: "relative",
          marginTop: 26,
          padding: "10px 30px",
          opacity: l2,
          transform: `translateY(${(1 - l2) * 40}px)`,
          border: `3px solid ${C.blue}`,
          boxShadow:
            "0 0 40px rgba(59,130,246,0.55), inset 0 0 30px rgba(59,130,246,0.25)",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(59,130,246,0.35)",
            transform: `scaleX(${wipe})`,
            transformOrigin: "left center",
          }}
        />
        {corners.map((pos, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              width: 18,
              height: 18,
              background: C.blue,
              border: `2px solid ${C.white}`,
              transform: `scale(${handles})`,
              ...pos,
            }}
          />
        ))}
        <span
          style={{
            position: "relative",
            fontFamily: SERIF,
            fontStyle: "italic",
            fontSize: 72,
            color: C.white,
            whiteSpace: "nowrap",
          }}
        >
          предсказывает будущее.
        </span>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Scene 5 — kinetic statement
// ---------------------------------------------------------------------------
const KineticWord: React.FC<{ text: string; from: number; color?: string }> = ({
  text,
  from,
  color = C.white,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = sp(frame, from, fps, { damping: 11, stiffness: 220, mass: 0.6 });
  return (
    <span
      style={{
        display: "inline-block",
        margin: "0 14px",
        color,
        opacity: interpolate(s, [0, 0.3], [0, 1], CLAMP),
        transform: `scale(${0.4 + 0.6 * s}) translateY(${(1 - s) * 60}px)`,
        filter: `blur(${(1 - s) * 12}px)`,
        textShadow: `0 0 40px rgba(96,165,250,0.6)`,
      }}
    >
      {text}
    </span>
  );
};

const Statement: React.FC = () => {
  return (
    <div
      style={{
        position: "absolute",
        top: 1200,
        left: 0,
        right: 0,
        textAlign: "center",
        fontFamily: SANS,
        fontWeight: 900,
        fontSize: 120,
        lineHeight: 1.05,
        letterSpacing: -3,
        textTransform: "uppercase",
        color: C.white,
      }}
    >
      <div>
        <KineticWord text="ЭТО" from={sec(25.5)} />
        <KineticWord text="ПРОСТО" from={sec(25.8)} />
      </div>
      <div>
        <KineticWord text="МАТЕМАТИКА." from={sec(26.1)} color={C.gold} />
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Subtitles
// ---------------------------------------------------------------------------
const KineticSubtitle: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  let active = -1;
  for (let i = 0; i < SUB_FRAMES.length; i++) {
    if (SUB_FRAMES[i].from <= frame) active = i;
  }
  if (active < 0) return null;
  const sub = SUB_FRAMES[active];
  if (frame > sub.to + 12) return null;

  const s = sp(frame, sub.from, fps, { damping: 12, stiffness: 200, mass: 0.6 });

  return (
    <div
      key={active}
      style={{
        position: "absolute",
        bottom: 320,
        left: 0,
        right: 0,
        padding: "0 70px",
        textAlign: "center",
        fontFamily: SANS,
        fontWeight: 800,
        fontSize: 66,
        lineHeight: 1.15,
        color: C.white,
        textShadow:
          "0 0 24px rgba(96,165,250,0.6), 0 4px 18px rgba(0,0,0,0.85)",
        opacity: interpolate(s, [0, 0.3], [0, 1], CLAMP),
        transform: `scale(${0.7 + 0.3 * s})`,
      }}
    >
      {sub.text}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main composition
// ---------------------------------------------------------------------------
export const GeminiFutureReel: React.FC = () => {
  const frame = useCurrentFrame();

  // Camera zoom: scene 2 zoom-in, back to 1 for scenes 3–4, zoom-out to ball in scene 5
  const zoomIn = interpolate(
    frame,
    [270, 330, 560, 640],
    [1, 1.25, 1.25, 1],
    { ...CLAMP, easing: EASE },
  );
  const zoomOut = interpolate(frame, [1470, 1650], [1.7, 1], {
    ...CLAMP,
    easing: EXPO_OUT,
  });
  const zoom = frame >= 1470 ? zoomOut : zoomIn;

  const kick = beatKick(frame);
  const idleDrift = 1 + 0.01 * Math.sin(frame / 120);

  // Ball visibility: on in scene 1, fades out as the chart takes over, back in for scene 5
  const ballOp =
    interpolate(frame, [0, 25, 300, 320], [0, 1, 1, 0], CLAMP) +
    interpolate(frame, [1470, 1500], [0, 1], CLAMP);

  // Scene 3 cards: spaced 1.5s apart, starting at 10.0s
  const cardsOut = interpolate(frame, [1000, 1030], [1, 0], CLAMP);

  return (
    <AbsoluteFill style={{ backgroundColor: C.bg, overflow: "hidden", fontFamily: SANS }}>
      <Audio src={staticFile("gemini_future/voice.mp3")} />

      {/* Background: obsidian + drifting grid + vignette */}
      <AbsoluteFill
        style={{
          ...GRID_BG,
          backgroundPosition: `${(frame * 0.3) % 72}px ${(frame * 0.3) % 72}px`,
        }}
      />
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(7,8,13,0) 40%, rgba(0,0,0,0.75) 100%)",
        }}
      />

      {/* Camera world: ball, chart, cards, plane */}
      <AbsoluteFill
        style={{
          transformOrigin: `${BALL_X}px ${BALL_Y}px`,
          transform: `perspective(1600px) rotateY(${kick.tilt}deg) scale(${zoom * kick.scale * idleDrift})`,
        }}
      >
        <div style={{ position: "absolute", inset: 0, opacity: ballOp }}>
          <CrystalBall />
        </div>
        <ProbabilityChart />
        {frame >= 560 && frame < 1040 && (
          <div style={{ position: "absolute", inset: 0, opacity: cardsOut }}>
            <GlassCard label="АКЦИИ" value="+14.2%" bar={0.71} from={sec(10.0)} top={620} />
            <GlassCard label="ПОГОДА" value="98%" bar={0.98} from={sec(11.5)} top={880} />
            <GlassCard label="ТРАФИК" value="x3.4" bar={0.85} from={sec(13.0)} top={1140} />
          </div>
        )}
        <MatrixPlane />
      </AbsoluteFill>

      {/* HUD labels & text layers (not affected by the camera) */}
      {frame >= 1000 && frame < 1480 && (
        <div
          style={{
            position: "absolute",
            top: 470,
            left: 0,
            right: 0,
            textAlign: "center",
            fontFamily: MONO,
            fontSize: 26,
            letterSpacing: 6,
            color: C.gold,
            opacity:
              interpolate(frame, [1040, 1080], [0, 1], CLAMP) *
              interpolate(frame, [1440, 1470], [1, 0], CLAMP),
          }}
        >
          СКРЫТЫЕ СВЯЗИ
        </div>
      )}

      {frame < 300 && <HookTitle />}
      {frame >= 1480 && <Statement />}

      <KineticSubtitle />
    </AbsoluteFill>
  );
};
