import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

// Reddit horror short: "My mom called me into the kitchen..."
// 50s · 30fps · 1080x1920. Graphic-novel vector hallway, 2.5D dolly,
// comic-panel inset for the bedroom door, word-by-word kinetic captions.

const W = 1080;
const H = 1920;
const INK = "#060607";
const VP_X = 540; // vanishing point of the hallway
const VP_Y = 900;

// ---------- helpers ----------

// Deterministic pseudo-random in [0, 1). Same frame → same frame, so renders are stable.
const rnd = (n: number): number => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

const CLAMP = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ramp = (t: number, xs: number[], ys: number[]): number =>
  interpolate(t, xs, ys, CLAMP);

// Decaying impulse that starts at `at` seconds (0 before it).
const hit = (t: number, at: number, decay: number): number =>
  t < at ? 0 : Math.exp(-(t - at) * decay);

// Hallway perspective. u = depth (0 camera → 1 kitchen wall), v = height (0 top → 1 floor).
const wallTop = (u: number): number => 820 * u;
const wallBottom = (u: number): number => 1920 - 840 * u;
const leftPt = (u: number, v: number): string =>
  `${400 * u},${wallTop(u) + (wallBottom(u) - wallTop(u)) * v}`;

// ---------- story script (seconds) ----------

type Line = { s: number; e: number; text: string; red?: boolean; big?: boolean };

const LINES: Line[] = [
  { s: 0.5, e: 4.2, text: "Мама позвала меня на кухню." },
  { s: 4.6, e: 8.6, text: "Я пошел по темному коридору." },
  { s: 9.0, e: 13.0, text: "И тут за спиной скрипнула дверь." },
  { s: 13.5, e: 17.5, text: "Мама прошептала из спальни:" },
  { s: 18.0, e: 21.5, text: "«Не ходи туда.»", red: true },
  { s: 22.0, e: 26.0, text: "«Я тоже это слышала.»", red: true },
  { s: 27.0, e: 31.4, text: "Но силуэт мамы все еще стоял на кухне." },
  { s: 32.0, e: 36.0, text: "Кто тогда был в спальне?" },
  { s: 36.5, e: 41.0, text: "Я боялся даже оглянуться." },
  { s: 41.5, e: 46.0, text: "И тут нечто за спиной прошептало мое имя." },
  { s: 46.5, e: 49.8, text: "Я тоже это слышала.", red: true, big: true },
];

const INSET_IN = 9.6; // comic panel pops in when the door opens
const INSET_OUT = 46.8;

// ---------- sub-components ----------

const Lamp: React.FC<{ u: number; on: number }> = ({ u, on }) => {
  const cy = wallTop(u) + 8;
  const rx = 90 - 70 * u;
  return (
    <g>
      <circle cx={VP_X} cy={cy} r={260 - 200 * u} fill="url(#lampGlow)" opacity={0.55 * on} />
      <ellipse cx={VP_X} cy={cy} rx={rx} ry={12 - 9 * u} fill="#fff1c9" opacity={on} stroke={INK} strokeWidth={4} />
    </g>
  );
};

// Bedroom door sliver on the left wall, with cold light leaking through the crack.
const WallDoor: React.FC<{ crack: number }> = ({ crack }) => {
  const u1 = 0.2;
  const u2 = 0.27;
  const v1 = 0.2;
  const v2 = 0.86;
  const quad = [leftPt(u1, v1), leftPt(u2, v1), leftPt(u2, v2), leftPt(u1, v2)].join(" ");
  const crackLine = leftPt(u2, v1).split(",");
  const crackEnd = leftPt(u2, v2).split(",");
  return (
    <g>
      <polygon points={quad} fill="#241a14" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
      <line
        x1={crackLine[0]}
        y1={crackLine[1]}
        x2={crackEnd[0]}
        y2={crackEnd[1]}
        stroke="#5ff6ff"
        strokeWidth={5}
        opacity={crack}
      />
    </g>
  );
};

// Protagonist seen from behind. Feet at (0, 0). Walks, then freezes and trembles.
const Protagonist: React.FC<{
  walk: number;
  phase: number;
  bob: number;
  tremor: number;
  rimColor: string;
  rimCyan: string;
}> = ({ walk, phase, bob, tremor, rimColor, rimCyan }) => {
  const legL = Math.sin(phase) * 16 * walk;
  const legR = -legL;
  const armL = -legL * 0.6;
  const armR = legL * 0.6;
  const cloth = "#2d3a2a";
  return (
    <g transform={`translate(${tremor} ${bob})`}>
      <ellipse cx={0} cy={6} rx={200} ry={36} fill="#000" opacity={0.6} />
      <g transform={`rotate(${legL} 0 -262)`}>
        <rect x={-92} y={-270} width={70} height={282} rx={12} fill="#101418" stroke={INK} strokeWidth={7} />
      </g>
      <g transform={`rotate(${legR} 0 -262)`}>
        <rect x={22} y={-270} width={70} height={282} rx={12} fill="#101418" stroke={INK} strokeWidth={7} />
      </g>
      <path
        d="M -150 -520 Q 0 -588 150 -520 L 172 -210 Q 0 -168 -172 -210 Z"
        fill={cloth}
        stroke={INK}
        strokeWidth={8}
        strokeLinejoin="round"
      />
      <path d="M -70 -468 Q 0 -440 70 -468" stroke="#1a2117" strokeWidth={6} fill="none" />
      <path d="M -10 -420 L -20 -260" stroke="#1a2117" strokeWidth={5} fill="none" />
      <g transform={`rotate(${armL} -142 -500)`}>
        <rect x={-170} y={-512} width={58} height={300} rx={29} fill={cloth} stroke={INK} strokeWidth={7} />
      </g>
      <g transform={`rotate(${armR} 142 -500)`}>
        <rect x={112} y={-512} width={58} height={300} rx={29} fill={cloth} stroke={INK} strokeWidth={7} />
      </g>
      {/* hood + head, back view */}
      <path
        d="M -88 -622 Q -88 -716 0 -718 Q 88 -716 88 -622 L 94 -512 Q 0 -492 -94 -512 Z"
        fill={cloth}
        stroke={INK}
        strokeWidth={8}
        strokeLinejoin="round"
      />
      <ellipse cx={0} cy={-636} rx={64} ry={74} fill="#0b0b0d" />
      {/* rim lights: amber from the kitchen on the left, cyan from the bedroom on the right */}
      <path d="M -150 -520 L -172 -210" stroke={rimColor} strokeWidth={7} strokeLinecap="round" fill="none" />
      <path d="M 150 -520 L 172 -210" stroke={rimCyan} strokeWidth={7} strokeLinecap="round" fill="none" />
    </g>
  );
};

// Comic-panel inset: the bedroom door, frontal, opening a crack.
const InsetPanel: React.FC<{ p: number; face: number; faceOn: number; dx: number; dy: number; enter: number; out: number }> = ({
  p,
  face,
  faceOn,
  dx,
  dy,
  enter,
  out,
}) => {
  const leafW = 180 * (1 - 0.8 * p);
  return (
    <div
      style={{
        position: "absolute",
        left: 36,
        top: 1210,
        width: 340,
        height: 400,
        border: `12px solid ${INK}`,
        boxShadow: `14px 14px 0 ${INK}`,
        background: "#000",
        overflow: "hidden",
        transform: `translate(${dx}px, ${dy}px) rotate(-2.5deg) scale(${enter})`,
        opacity: out,
      }}
    >
      <svg width={340} height={400} viewBox="0 0 340 400">
        <rect width={340} height={400} fill="#0a0d12" />
        <rect width={340} height={400} fill="url(#hatch)" opacity={0.35} />
        {/* door frame */}
        <rect x={56} y={20} width={228} height={380} fill="#1c1510" stroke={INK} strokeWidth={6} />
        {/* void behind the door */}
        <rect x={110} y={52} width={180} height={350} fill="#020305" />
        <rect x={110} y={52} width={6 + 12 * p} height={350} fill="#5ff6ff" opacity={0.2 + 0.7 * p} />
        {/* the thing in the dark */}
        <g opacity={faceOn} transform={`translate(226 236) scale(${face})`}>
          <ellipse cx={0} cy={0} rx={50} ry={68} fill="#c9d8dd" stroke={INK} strokeWidth={5} />
          <path d="M -56 -22 Q -60 -82 0 -84 Q 60 -82 56 -22 Q 40 -52 0 -52 Q -40 -52 -56 -22 Z" fill="#050406" />
          <ellipse cx={-18} cy={-8} rx={7} ry={4.5} fill="#050608" />
          <ellipse cx={18} cy={-8} rx={7} ry={4.5} fill="#050608" />
          <path d="M -20 34 Q 0 42 20 34" stroke="#050608" strokeWidth={5} fill="none" strokeLinecap="round" />
        </g>
        {/* the door leaf, hinged on the left */}
        <g>
          <rect x={110} y={52} width={leafW} height={350} fill="#3a2416" stroke={INK} strokeWidth={6} />
          <rect x={124} y={80} width={Math.max(leafW - 28, 0)} height={130} fill="none" stroke="#1e120a" strokeWidth={5} />
          <rect x={124} y={236} width={Math.max(leafW - 28, 0)} height={130} fill="none" stroke="#1e120a" strokeWidth={5} />
          <circle cx={110 + leafW - 18} cy={226} r={8} fill="#c9a24a" stroke={INK} strokeWidth={3} />
        </g>
        {/* vignette inside the panel */}
        <rect width={340} height={400} fill="url(#insetVig)" />
      </svg>
    </div>
  );
};

// One caption line with a word-by-word highlight (karaoke style).
const Caption: React.FC<{ line: Line; t: number; frame: number; fps: number }> = ({ line, t, frame, fps }) => {
  const words = line.text.split(" ");
  const dur = line.e - line.s;
  const idx = Math.max(0, Math.min(words.length - 1, Math.floor(((t - line.s) / dur) * words.length)));
  const enterFrame = line.s * fps;
  const pop =
    frame < enterFrame
      ? 0
      : spring({ frame: frame - enterFrame, fps, config: { damping: 11, stiffness: 220, mass: 0.6 } });
  const alpha = ramp(t, [line.e, line.e + 0.35], [1, 0]);
  const fontSize = line.big ? 150 : words.length > 5 ? 84 : 102;
  const activeBg = line.red ? "#d7000f" : "#ffd23f";
  const activeFg = line.red ? "#ffffff" : "#000000";

  return (
    <div
      style={{
        position: "absolute",
        top: line.big ? 330 : 230,
        left: 60,
        width: 960,
        textAlign: "center",
        fontFamily: "Impact, 'Arial Black', sans-serif",
        fontSize,
        lineHeight: 1.12,
        textTransform: "uppercase",
        opacity: alpha * (pop > 0 ? 1 : 0),
        transform: `scale(${0.82 + 0.18 * pop}) rotate(-1deg)`,
        zIndex: 10,
      }}
    >
      {words.map((w, i) => {
        const active = i === idx;
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              margin: "0 8px",
              padding: "0 12px",
              borderRadius: 8,
              color: active ? activeFg : "#f4efe6",
              background: active ? activeBg : "transparent",
              textShadow: active
                ? "none"
                : `-5px 0 ${INK}, 5px 0 ${INK}, 0 -5px ${INK}, 0 5px ${INK}, 7px 9px 0 ${INK}`,
              boxShadow: active ? `7px 8px 0 ${INK}` : "none",
              transform: active ? "scale(1.08) rotate(-2deg)" : "none",
            }}
          >
            {w}
          </span>
        );
      })}
    </div>
  );
};

// ---------- main composition ----------

export const RedditHorrorShort: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  // Impacts: door slam, whisper, kitchen blackout, final reveal.
  const A =
    26 * hit(t, INSET_IN, 5) +
    14 * hit(t, 13.5, 4) +
    18 * hit(t, 26.5, 4) +
    34 * hit(t, 47.2, 3);
  const shakeX = (rnd(frame * 1.37 + 3) * 2 - 1) * A;
  const shakeY = (rnd(frame * 2.11 + 7) * 2 - 1) * A * 0.8;
  const shakeRot = (rnd(frame * 0.77 + 11) * 2 - 1) * A * 0.02;
  const driftX = Math.sin(t * 0.7) * 6;
  const driftY = Math.cos(t * 0.5) * 4;

  // Camera dolly toward the kitchen.
  const dolly = ramp(t, [0, 4, 9, 30, 40, 47, 50], [1.02, 1.1, 1.18, 1.26, 1.36, 1.46, 1.5]);

  // Heartbeat ramps in after the door opens.
  const hbRamp = ramp(t, [12, 30, 44], [0, 0.6, 1]);
  const hbPhase = t > 12 ? ((t - 12) * 1.15) % 1 : 0;
  const hb = t > 12 ? hbRamp * (Math.exp(-hbPhase * 9) * 0.9 + Math.exp(-Math.abs(hbPhase - 0.2) * 22) * 0.5) : 0;

  // Kitchen light: flickers, dies at 26s, returns dimmer.
  const kitchenOn =
    t < 26
      ? rnd(Math.floor(frame / 3) + 0.5) > 0.1 ? 1 : 0.55
      : t < 27.2
        ? 0.06
        : rnd(Math.floor(frame / 5) + 900) > 0.05 ? 0.92 : 0.5;

  const lampOn = (i: number): number =>
    t < 12 ? 1 : rnd(Math.floor(frame / 4) + i * 31) > 0.12 ? 1 : 0.25;

  // Walk cycle (4s-9s), then frozen.
  const walk = ramp(t, [3.6, 4.2, 8.4, 9.0], [0, 1, 1, 0]);
  const phase = (t - 4.2) * Math.PI * 2 * 1.6;
  const bob = -Math.abs(Math.sin(phase)) * 8 * walk;
  const tremor = t > 9 ? (rnd(frame * 0.5) - 0.5) * 3 : 0;
  const protoScale = ramp(t, [35, 44], [1, 1.16]);

  // Bedroom panel.
  const enterFrame = INSET_IN * fps;
  const enter =
    frame < enterFrame
      ? 0
      : spring({ frame: frame - enterFrame, fps, config: { damping: 9, stiffness: 160, mass: 0.6 } });
  const out = ramp(t, [INSET_OUT, INSET_OUT + 0.5], [1, 0]);
  const doorP = ramp(t, [10.2, 13.2], [0, 1]);
  const faceOn = ramp(t, [13.8, 15.2], [0, 1]);
  const faceScale = ramp(t, [16, 47], [0.8, 1.22]);
  const insetDx = (rnd(frame * 1.9 + 21) * 2 - 1) * (A * 0.6);
  const insetDy = (rnd(frame * 2.7 + 5) * 2 - 1) * (A * 0.5);

  // Crack light from the bedroom door on the wall.
  const crack = t > INSET_IN ? 0.45 + 0.5 * rnd(Math.floor(frame / 2) + 77) : 0;

  // Global looks: desaturate in the dread, bloom red on heartbeat.
  const sat = ramp(t, [29, 31, 37, 47], [1, 0.22, 0.4, 0.5]);
  const vigR = ramp(t, [0, 8, 26, 36, 50], [66, 60, 50, 40, 34]) - hb * 6;
  const flash =
    0.85 * hit(t, INSET_IN, 7) + 0.5 * hit(t, 13.5, 7) + 0.6 * hit(t, 26.5, 6) + 0.9 * hit(t, 47.2, 4);
  const fadeIn = 1 - ramp(t, [0, 0.9], [0, 1]);
  const fadeOut = ramp(t, [48.7, 49.95], [0, 1]);
  const grainCount = Math.floor(160 + 240 * ramp(t, [30, 45], [0, 1]));

  const rimAmber = `rgba(255,179,71,${0.5 + 0.5 * kitchenOn})`;

  const sceneTransform = [
    `translate(${shakeX + driftX} ${shakeY + driftY})`,
    `rotate(${shakeRot} ${VP_X} ${VP_Y})`,
    `translate(${VP_X} ${VP_Y})`,
    `scale(${dolly})`,
    `translate(${-VP_X} ${-VP_Y})`,
  ].join(" ");

  const motes = Array.from({ length: 36 }, (_, i) => {
    const x = (rnd(i * 3.1) * W + t * (8 + rnd(i) * 18)) % W;
    const y = rnd(i * 7.7) * H + Math.sin(t + i) * 18;
    return { x, y, r: 1.5 + rnd(i * 5.3) * 2.2 };
  });

  const grain = Array.from({ length: grainCount }, (_, i) => ({
    x: rnd(frame * 0.37 + i * 1.7) * W,
    y: rnd(frame * 0.91 + i * 2.3) * H,
    c: rnd(frame + i) > 0.5 ? "#ffffff" : "#000000",
  }));

  return (
    <AbsoluteFill style={{ backgroundColor: "#000", overflow: "hidden" }}>
      {/* ---- Graphic-novel scene ---- */}
      <AbsoluteFill style={{ filter: `saturate(${sat})` }}>
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
          <defs>
            <radialGradient id="lampGlow">
              <stop offset="0%" stopColor="#ffd58a" stopOpacity={1} />
              <stop offset="100%" stopColor="#ffd58a" stopOpacity={0} />
            </radialGradient>
            <linearGradient id="kitchenGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffc56b" />
              <stop offset="100%" stopColor="#8a3d0b" />
            </linearGradient>
            <linearGradient id="floorFade" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0c0a09" stopOpacity={0.2} />
              <stop offset="100%" stopColor="#000" stopOpacity={0.9} />
            </linearGradient>
            <pattern id="dots" width={9} height={9} patternUnits="userSpaceOnUse">
              <circle cx={4.5} cy={4.5} r={1.6} fill="#000" />
            </pattern>
            <pattern id="hatch" width={10} height={10} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <line x1={0} y1={0} x2={0} y2={10} stroke="#000" strokeWidth={2} />
            </pattern>
            <radialGradient id="insetVig" cx="50%" cy="50%" r="70%">
              <stop offset="55%" stopColor="#000" stopOpacity={0} />
              <stop offset="100%" stopColor="#000" stopOpacity={0.85} />
            </radialGradient>
          </defs>

          <g transform={sceneTransform}>
            {/* walls, ceiling, floor */}
            <polygon points="0,0 1080,0 680,820 400,820" fill="#0b0d10" />
            <polygon points="0,0 400,820 400,1080 0,1920" fill="#1b2629" />
            <polygon points="1080,0 680,820 680,1080 1080,1920" fill="#15201f" />
            <polygon points="0,1920 1080,1920 680,1080 400,1080" fill="#15110f" />
            <polygon points="0,1920 1080,1920 680,1080 400,1080" fill="url(#floorFade)" />

            {/* perspective lines */}
            {[0, 135, 270, 405, 540, 675, 810, 945, 1080].map((x) => (
              <g key={`pl-${x}`}>
                <line x1={x} y1={1920} x2={400 + (x * 280) / 1080} y2={1080} stroke={INK} strokeWidth={3} opacity={0.6} />
                <line x1={x} y1={0} x2={400 + (x * 280) / 1080} y2={820} stroke={INK} strokeWidth={3} opacity={0.6} />
              </g>
            ))}
            {[0.15, 0.3, 0.45, 0.62, 0.8].map((u) => (
              <g key={`d-${u}`}>
                <line x1={400 * u} y1={wallBottom(u)} x2={1080 - 400 * u} y2={wallBottom(u)} stroke={INK} strokeWidth={4} opacity={0.7} />
                <line x1={400 * u} y1={wallTop(u)} x2={400 * u} y2={wallBottom(u)} stroke={INK} strokeWidth={4} opacity={0.7} />
                <line x1={1080 - 400 * u} y1={wallTop(u)} x2={1080 - 400 * u} y2={wallBottom(u)} stroke={INK} strokeWidth={4} opacity={0.7} />
              </g>
            ))}

            {/* ceiling lamps */}
            {[0.18, 0.42, 0.66].map((u, i) => (
              <Lamp key={`lamp-${u}`} u={u} on={lampOn(i)} />
            ))}

            <WallDoor crack={crack} />

            {/* kitchen end wall + doorway */}
            <rect x={400} y={820} width={280} height={260} fill="#120d0b" stroke={INK} strokeWidth={6} />
            <circle cx={VP_X} cy={960} r={280} fill="url(#lampGlow)" opacity={0.7 * kitchenOn} />
            <rect x={450} y={850} width={180} height={230} fill="url(#kitchenGrad)" opacity={0.25 + 0.75 * kitchenOn} />
            <line x1={VP_X} y1={850} x2={VP_X} y2={872} stroke={INK} strokeWidth={4} />
            <circle cx={VP_X} cy={878} r={9} fill="#fff1c9" stroke={INK} strokeWidth={3} opacity={kitchenOn} />

            {/* mom, backlit silhouette in the kitchen */}
            <g opacity={Math.max(kitchenOn, 0.05)} transform={`rotate(${Math.sin(t * 0.6) * 1.5} ${VP_X} 1000)`}>
              <ellipse cx={VP_X} cy={948} rx={26} ry={32} fill="#0d0704" stroke={rimAmber} strokeWidth={4} />
              <path
                d="M 500 990 Q 540 970 580 990 L 594 1080 L 486 1080 Z"
                fill="#0d0704"
                stroke={rimAmber}
                strokeWidth={4}
                strokeLinejoin="round"
              />
            </g>
            {/* kitchen counter cuts across the bottom of the doorway */}
            <rect x={450} y={1030} width={180} height={50} fill="#1a0f08" stroke={INK} strokeWidth={4} />

            {/* amber spill across the floor from the kitchen */}
            <polygon points="450,1080 630,1080 1080,1920 0,1920" fill="#ffb347" opacity={0.1 * kitchenOn} />

            {/* halftone + hatch shading over the whole set */}
            <rect x={0} y={0} width={W} height={H} fill="url(#dots)" opacity={0.16} />
            <polygon points="0,0 400,820 400,1080 0,1920 0,0" fill="url(#hatch)" opacity={0.18} />
          </g>

          {/* protagonist: fixed in frame, pushed in slightly at the end */}
          <g transform={`translate(${VP_X} 1850) scale(${0.82 * protoScale})`}>
            <Protagonist
              walk={walk}
              phase={phase}
              bob={bob}
              tremor={tremor}
              rimColor={rimAmber}
              rimCyan={`rgba(95,246,255,${0.35 + 0.65 * crack})`}
            />
          </g>

          {/* dust motes in the light */}
          {motes.map((m, i) => (
            <circle key={`m-${i}`} cx={m.x} cy={m.y} r={m.r} fill="#ffe2a8" opacity={0.25 + 0.3 * kitchenOn} />
          ))}
        </svg>
      </AbsoluteFill>

      {/* ---- Comic-panel inset: the bedroom door ---- */}
      <InsetPanel
        p={doorP}
        face={faceScale}
        faceOn={faceOn}
        dx={insetDx}
        dy={insetDy}
        enter={enter}
        out={out}
      />

      {/* ---- Atmosphere ---- */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse at 50% 60%, rgba(190,0,20,${0.35 * hb}) 0%, rgba(0,0,0,0) 70%)`,
          pointerEvents: "none",
        }}
      />
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse at 50% 46%, rgba(0,0,0,0) ${vigR}%, rgba(0,0,0,0.92) 100%)`,
          pointerEvents: "none",
        }}
      />
      <AbsoluteFill style={{ background: "#ffffff", opacity: Math.min(flash, 0.9), pointerEvents: "none" }} />
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        {grain.map((g, i) => (
          <rect key={`g-${i}`} x={g.x} y={g.y} width={2} height={2} fill={g.c} opacity={0.12} />
        ))}
      </svg>

      {/* ---- Kinetic captions ---- */}
      <AbsoluteFill>
        {LINES.map((line) =>
          t >= line.s - 0.1 && t <= line.e + 0.4 ? (
            <Caption key={line.text} line={line} t={t} frame={frame} fps={fps} />
          ) : null
        )}
      </AbsoluteFill>

      {/* ---- Fades ---- */}
      <AbsoluteFill style={{ background: "#000", opacity: Math.max(fadeIn, fadeOut), pointerEvents: "none" }} />
    </AbsoluteFill>
  );
};
