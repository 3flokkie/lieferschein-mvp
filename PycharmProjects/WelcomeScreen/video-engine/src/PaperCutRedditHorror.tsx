import React from "react";
import { AbsoluteFill, Sequence, interpolate, useCurrentFrame } from "remotion";

// "The Highway Station That Didn't Exist" — paper-cutout stop-motion short.
// 120s · 30fps · 1080x1920. Every element is a cut paper layer: roughened edge
// (feDisplacementMap on feTurbulence), its own drop shadow for depth, blurred
// far layers for bokeh, a shared fiber texture on top, and jointed puppets whose
// motion snaps to 12fps.

const W = 1080;
const H = 1920;
const FPS = 30;

const C = {
  kraft: "#C8A882",
  kraftDark: "#7E6244",
  kraftLight: "#DCC39C",
  obsidian: "#101715",
  pine: "#1A2722",
  pineLight: "#2A3D35",
  mist: "#E2E6E8",
  red: "#C23B22",
  sodium: "#E5A93C",
  receipt: "#E9DBAE",
  ink: "#2A1D12",
};

// ---------- helpers ----------

const CL = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ramp = (t: number, xs: number[], ys: number[]): number =>
  interpolate(t, xs, ys, CL);

// Decaying impulse starting at `at` seconds (used for punch zooms).
const hit = (t: number, at: number, decay: number): number =>
  t < at ? 0 : Math.exp(-(t - at) * decay);

// Deterministic pseudo-random in [0, 1). Same frame in → same frame out.
const rnd = (n: number): number => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

// 12fps stop-motion: motion is sampled on every 2.5th frame, in seconds.
const stepT = (f: number): number => Math.floor(f / 2.5) / 12;

const pinePath = (x: number, base: number, h: number): string => {
  const w = h * 0.42;
  let d = "";
  for (let i = 0; i < 3; i++) {
    const yb = base - i * h * 0.26;
    const yt = yb - h * 0.5;
    const hw = (w / 2) * (1 - i * 0.2);
    d += `M${x.toFixed(1)} ${yt.toFixed(1)}L${(x - hw).toFixed(1)} ${yb.toFixed(1)}L${(x + hw).toFixed(1)} ${yb.toFixed(1)}Z`;
  }
  d += `M${(x - h * 0.03).toFixed(1)} ${base.toFixed(1)}h${(h * 0.06).toFixed(1)}v${(h * 0.14).toFixed(1)}h${(-h * 0.06).toFixed(1)}Z`;
  return d;
};

// ---------- paper primitives ----------

// Shared SVG defs: rough cut edge, fiber texture, soft floor shadow, beam gradient.
const PaperDefs: React.FC = () => (
  <svg width={0} height={0} style={{ position: "absolute" }}>
    <defs>
      <filter id="paperEdge" x="-2%" y="-2%" width="104%" height="104%">
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.03"
          numOctaves={1}
          seed={4}
          result="edgeNoise"
        />
        <feDisplacementMap
          in="SourceGraphic"
          in2="edgeNoise"
          scale={6}
          xChannelSelector="R"
          yChannelSelector="G"
        />
      </filter>
      <filter id="fiber" x="0" y="0" width="100%" height="100%">
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.6 0.05"
          numOctaves={1}
          seed={9}
          result="fibres"
        />
        <feColorMatrix
          in="fibres"
          type="matrix"
          values="0 0 0 0 0.25  0 0 0 0 0.16  0 0 0 0 0.08  1.4 0 0 0 -0.6"
        />
      </filter>
      <filter id="softShadow" x="-50%" y="-200%" width="200%" height="500%">
        <feGaussianBlur stdDeviation="14" />
      </filter>
      <linearGradient id="beamG" x1="0" y1="1" x2="0" y2="0">
        <stop offset="0" stopColor={C.mist} stopOpacity={0.6} />
        <stop offset="1" stopColor={C.mist} stopOpacity={0} />
      </linearGradient>
    </defs>
  </svg>
);

// One cut-paper layer. z = depth (0 far … 3 near): nearer paper casts a longer,
// softer shadow onto the layer behind it. blur > 0 gives depth-of-field bokeh.
const Layer: React.FC<{ z: number; blur?: number; tiltX?: number; tiltY?: number; children: React.ReactNode }> = ({
  z,
  blur = 0,
  tiltX = 0,
  tiltY = 0,
  children,
}) => {
  // Enhanced 3D layered paper depth
  const translateZ = z * 75; // Physical separation of paper sheets in 3D space
  const parts = [
    "url(#paperEdge)",
    `drop-shadow(${Math.round(tiltY * -2)}px ${6 + z * 14}px ${12 + z * 18}px rgba(0,0,0,${0.45 + z * 0.12}))`,
  ];
  if (blur > 0) parts.push(`blur(${blur}px)`);
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        filter: parts.join(" "),
        transform: `translateZ(${translateZ}px) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`,
        transformStyle: "preserve-3d",
      }}
    >
      <svg
        width={W}
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        style={{ position: "absolute", inset: 0, overflow: "visible" }}
      >
        {children}
      </svg>
    </div>
  );
};

// Light (not paper): no shadow, blended on top.
const Glow: React.FC<{ children: React.ReactNode; blend?: string }> = ({
  children,
  blend = "screen",
}) => (
  <svg
    width={W}
    height={H}
    viewBox={`0 0 ${W} ${H}`}
    style={{
      position: "absolute",
      inset: 0,
      overflow: "visible",
      mixBlendMode: blend as React.CSSProperties["mixBlendMode"],
      pointerEvents: "none",
    }}
  >
    {children}
  </svg>
);

// Soft cloud bands of cold mist, drifting sideways.
const FogBand: React.FC<{ y: number; x: number; opacity: number; h?: number }> = ({
  y,
  x,
  opacity,
  h = 380,
}) => (
  <div
    style={{
      position: "absolute",
      left: -300 + x,
      top: y - h / 2,
      width: W + 600,
      height: h,
      borderRadius: "50%",
      background: `radial-gradient(ellipse at 50% 50%, ${C.mist}, rgba(226,230,232,0) 70%)`,
      opacity,
      filter: "blur(26px)",
      pointerEvents: "none",
    }}
  />
);

// Paper pine trees scrolling past. Wraps around `span`, `pad` shifts the wrap window.
const Pines: React.FC<{
  seed: number;
  count: number;
  spacing: number;
  scroll: number;
  base: number;
  hMin: number;
  hMax: number;
  fill: string;
  span?: number;
  pad?: number;
}> = (p) => {
  const span = p.span ?? W + 240;
  const pad = p.pad ?? -120;
  const out: React.ReactNode[] = [];
  for (let k = 0; k < p.count; k++) {
    const x = ((((k * p.spacing - p.scroll) % span) + span) % span) + pad;
    const h = p.hMin + (p.hMax - p.hMin) * rnd(k * 7.3 + p.seed);
    const base = p.base + rnd(k * 2.1 + p.seed) * 40;
    out.push(<path key={k} d={pinePath(x, base, h)} fill={p.fill} />);
  }
  return <>{out}</>;
};

// Ground shadow under a paper object: a blurred dark ellipse, not a flat drop.
const ContactShadow: React.FC<{ x: number; y: number; rx: number; ry: number }> = ({
  x,
  y,
  rx,
  ry,
}) => (
  <ellipse cx={x} cy={y} rx={rx} ry={ry} fill="#000" opacity={0.65} filter="url(#softShadow)" />
);

// ---------- puppets & props ----------

const Car: React.FC<{ x: number; y: number; wheel: number }> = ({ x, y, wheel }) => (
  <g transform={`translate(${x} ${y})`}>
    <path
      d="M-230 0 L-210 -90 L-110 -120 L-40 -200 L120 -200 L200 -120 L250 -90 L262 0 Z"
      fill={C.mist}
    />
    <path d="M-40 -180 L110 -180 L160 -120 L-70 -120 Z" fill={C.obsidian} />
    <path d="M-230 -4 L262 -4" stroke={C.kraftDark} strokeWidth={6} />
    <rect x={226} y={-72} width={28} height={24} fill={C.sodium} />
    {[-150, 150].map((wx) => (
      <g key={wx} transform={`translate(${wx} 42) rotate(${wheel})`}>
        <circle r={60} fill={C.obsidian} />
        <circle r={22} fill={C.kraft} />
        <path d="M0 -50 L0 50 M-50 0 L50 0" stroke={C.kraft} strokeWidth={8} />
      </g>
    ))}
  </g>
);

// Dashboard + A-pillars + jointed steering wheel, seen from the driver's seat.
const Dashboard: React.FC<{ wheel: number }> = ({ wheel }) => (
  <>
    <Layer z={3}>
      <path d="M-40 1600 Q540 1500 1120 1600 L1120 1960 L-40 1960 Z" fill={C.obsidian} />
      <path d="M-40 1600 Q540 1500 1120 1600" stroke={C.kraft} strokeWidth={10} fill="none" />
      <path d="M0 0 H130 L60 1600 H0 Z" fill={C.kraftDark} />
      <path d="M1080 0 H950 L1020 1600 H1080 Z" fill={C.kraftDark} />
      <g transform={`rotate(${wheel} 540 1840)`}>
        <circle cx={540} cy={1840} r={250} fill="none" stroke={C.kraft} strokeWidth={34} />
        <path d="M290 1840 H790 M540 1590 V2090" stroke={C.kraft} strokeWidth={22} />
      </g>
      <circle cx={540} cy={1840} r={36} fill={C.red} />
    </Layer>
  </>
);

// Gas station, drawn in canvas coordinates; ground at y=1400.
const StationArt: React.FC = () => (
  <>
    <rect x={-80} y={1400} width={1240} height={520} fill={C.pineLight} />
    <rect x={260} y={980} width={520} height={330} fill={C.kraft} />
    <path d="M230 990 L810 990 L772 905 L268 905 Z" fill={C.red} />
    <rect x={300} y={1060} width={130} height={110} fill={C.sodium} opacity={0.9} />
    <rect x={650} y={1060} width={110} height={110} fill={C.sodium} opacity={0.9} />
    <rect x={480} y={1110} width={120} height={200} fill={C.kraftDark} />
    <rect x={130} y={1220} width={820} height={38} fill={C.red} />
    <rect x={150} y={1258} width={22} height={170} fill={C.kraftDark} />
    <rect x={908} y={1258} width={22} height={170} fill={C.kraftDark} />
    <rect x={250} y={1290} width={70} height={140} fill={C.mist} />
    <rect x={250} y={1280} width={70} height={22} fill={C.red} />
    <rect x={740} y={1290} width={70} height={140} fill={C.mist} />
    <rect x={740} y={1280} width={70} height={22} fill={C.red} />
  </>
);

// Hand-jointed attendant. Origin at the feet; hip at -300, neck at -530.
// Legs and arms swing from pivots, the hinged paper head turns on its neck,
// and brass brads mark every joint.
const Attendant: React.FC<{
  x: number;
  y: number;
  s: number;
  swing: number;
  armAngle: number;
  headTilt: number;
  jaw: number;
}> = (p) => {
  const brad = (cx: number, cy: number) => (
    <circle cx={cx} cy={cy} r={7} fill={C.sodium} stroke={C.kraftDark} strokeWidth={2} />
  );
  return (
    <g transform={`translate(${p.x} ${p.y}) scale(${p.s})`}>
      {/* legs */}
      <g transform={`rotate(${-p.swing} 0 -300)`}>
        <rect x={-58} y={-300} width={56} height={300} fill={C.obsidian} />
        <rect x={-66} y={-8} width={70} height={18} fill={C.kraftDark} />
      </g>
      <g transform={`rotate(${p.swing} 0 -300)`}>
        <rect x={2} y={-300} width={56} height={300} fill={C.pineLight} />
        <rect x={0} y={-8} width={70} height={18} fill={C.kraftDark} />
      </g>
      {/* torso: mist shirt, red tie, sodium name tag */}
      <path d="M-120 -520 L120 -520 L140 -300 L-140 -300 Z" fill={C.mist} />
      <path d="M-14 -520 L14 -520 L30 -420 L0 -388 L-30 -420 Z" fill={C.red} />
      <rect x={60} y={-470} width={44} height={22} fill={C.sodium} />
      {/* left arm (hangs) */}
      <g transform="translate(-120 -500)">
        <g transform={`rotate(${p.swing} 0 0)`}>
          <rect x={-26} y={-6} width={52} height={230} fill={C.mist} stroke={C.kraftDark} strokeWidth={2} />
        </g>
        {brad(0, 0)}
      </g>
      {/* right arm (reaches for the nozzle / receipt) */}
      <g transform="translate(120 -500)">
        <g transform={`rotate(${p.armAngle} 0 0)`}>
          <rect x={-26} y={-6} width={52} height={230} fill={C.mist} stroke={C.kraftDark} strokeWidth={2} />
        </g>
        {brad(0, 0)}
      </g>
      {/* hinged paper head */}
      <g transform={`translate(0 -530) rotate(${p.headTilt})`}>
        <ellipse cx={0} cy={-100} rx={78} ry={92} fill={C.kraft} stroke={C.kraftDark} strokeWidth={3} />
        {/* cap */}
        <path d="M-86 -150 Q0 -262 86 -150 L92 -128 L-92 -128 Z" fill={C.red} />
        <rect x={-100} y={-134} width={200} height={14} fill={C.kraftDark} />
        {/* unblinking eyes: no lids, pupils fixed on the viewer */}
        <ellipse cx={-30} cy={-102} rx={15} ry={10} fill={C.mist} />
        <ellipse cx={30} cy={-102} rx={15} ry={10} fill={C.mist} />
        <circle cx={-30} cy={-102} r={6} fill={C.obsidian} />
        <circle cx={30} cy={-102} r={6} fill={C.obsidian} />
        <path d="M-6 -80 Q0 -62 8 -78" stroke={C.kraftDark} strokeWidth={4} fill="none" />
        <circle cx={-48} cy={-70} r={14} fill={C.red} opacity={0.25} />
        <circle cx={48} cy={-70} r={14} fill={C.red} opacity={0.25} />
        {/* hinged jaw */}
        <g transform={`rotate(${p.jaw} 0 -40)`}>
          <path d="M-38 -50 Q0 -30 38 -50" stroke={C.obsidian} strokeWidth={5} fill="none" />
        </g>
        {brad(0, 4)}
      </g>
    </g>
  );
};

// ---------- scenes (local frames) ----------

// 0:00–0:25 — foggy mountain road, pines scrolling in parallax, headlights in mist.
const RoadScene: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const sf = stepT(f);
  const scroll = t * 620;
  const wheel = Math.sin(sf * 2.2) * 5;
  const beamPulse = 0.85 + 0.15 * Math.sin(t * 3.1);

  const dashes = Array.from({ length: 7 }, (_, i) => {
    const u = (i / 7 + t * 0.5) % 1;
    const y = 1040 + 880 * u * u;
    const w = 3 + 14 * u * u;
    return <rect key={i} x={540 - w / 2} y={y} width={w} height={6 + 60 * u * u} fill={C.kraftLight} />;
  });

  return (
    <AbsoluteFill>
      <AbsoluteFill
        style={{ background: `linear-gradient(#070B0A 0%, ${C.obsidian} 45%, ${C.pine} 100%)` }}
      />
      <div
        style={{
          position: "absolute",
          left: 690,
          top: 300,
          width: 150,
          height: 150,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${C.mist} 0%, rgba(226,230,232,0.55) 60%, rgba(226,230,232,0) 72%)`,
          opacity: 0.35,
          filter: "blur(4px)",
        }}
      />
      <Layer z={0} blur={6}>
        <Pines seed={3} count={12} spacing={130} scroll={scroll * 0.15} base={1080} hMin={420} hMax={760} fill="#0F1A16" />
      </Layer>
      <Layer z={0} blur={5}>
        <Pines seed={1} count={14} spacing={96} scroll={scroll * 0.35} base={1110} hMin={140} hMax={260} fill="#162320" />
      </Layer>
      <FogBand y={1000} x={Math.sin(t * 0.4) * 80} opacity={0.18} />
      <Layer z={1} blur={1}>
        <Pines seed={2} count={14} spacing={120} scroll={scroll * 0.7} base={1200} hMin={220} hMax={380} fill={C.pine} />
      </Layer>
      <Layer z={2}>
        <path d="M452 1040 L628 1040 L1180 1920 L-100 1920 Z" fill={C.kraftDark} />
        {dashes}
      </Layer>
      <Glow blend="screen">
        <path d="M410 1600 L120 960 L760 960 L560 1600 Z" fill="url(#beamG)" opacity={beamPulse} />
      </Glow>
      <FogBand y={1080} x={Math.sin(t * 0.25 + 1) * 120} opacity={0.22} h={260} />
      <Dashboard wheel={wheel} />
    </AbsoluteFill>
  );
};

// Neon sign + bokeh halos; buzz is stepped so the tube flickers like real glass.
const NeonSign: React.FC<{ buzz: number }> = ({ buzz }) => (
  <div
    style={{
      position: "absolute",
      left: 300,
      top: 830,
      width: 480,
      textAlign: "center",
      fontFamily: "Impact, 'Arial Black', sans-serif",
      fontSize: 170,
      letterSpacing: 12,
      color: C.sodium,
      textShadow: `0 0 10px ${C.sodium}, 0 0 28px ${C.sodium}, 0 0 60px ${C.red}`,
      opacity: buzz,
      pointerEvents: "none",
    }}
  >
    GAS
  </div>
);

const Bokeh: React.FC<{ buzz: number }> = ({ buzz }) => (
  <>
    {[0, 1, 2, 3, 4].map((i) => (
      <div
        key={i}
        style={{
          position: "absolute",
          left: 80 + rnd(i * 3.1) * 880,
          top: 700 + rnd(i * 5.7) * 500,
          width: 160 + rnd(i) * 140,
          height: 160 + rnd(i) * 140,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${C.sodium} 0%, rgba(229,169,60,0) 70%)`,
          opacity: 0.3 * buzz,
          filter: "blur(18px)",
        }}
      />
    ))}
  </>
);

// 0:25–0:50 — fog lifts, the 1950s station glows, the car pulls up.
const StationScene: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const sf = stepT(f);
  const fog = ramp(t, [0, 6, 11], [0.7, 0.3, 0]);
  const carX = ramp(sf, [4, 16], [1280, 470]);
  const wheel = (carX / 58) * (180 / Math.PI);
  const buzz = rnd(Math.floor(f / 3)) > 0.18 ? 1 : 0.35;

  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ background: `linear-gradient(#050807, ${C.obsidian} 60%, ${C.pine})` }} />
      <Bokeh buzz={buzz} />
      <Layer z={1} blur={2}>
        <StationArt />
      </Layer>
      <NeonSign buzz={buzz} />
      <Layer z={0}>
        <ContactShadow x={carX} y={1528} rx={250} ry={24} />
      </Layer>
      <Layer z={2}>
        <Car x={carX} y={1480} wheel={wheel} />
      </Layer>
      <FogBand y={900} x={Math.sin(t * 0.5) * 60} opacity={fog} />
    </AbsoluteFill>
  );
};

// 0:50–1:15 — the attendant walks out and fuels the car, then the camera
// pushes into an unblinking close-up of his face.
const AttendantScene: React.FC = () => {
  const f = useCurrentFrame();
  const sf = stepT(f);
  const closeK = ramp(sf, [11, 14], [0, 1]);
  const walkX = ramp(sf, [0, 8], [1150, 800]);
  const walking = 1 - closeK;
  const swing = Math.sin(sf * Math.PI * 2 * 1.6) * 20 * walking;
  const hoseP = ramp(sf, [8, 11], [0, 1]);
  const headTilt = Math.sin(sf * 0.8) * 4;
  const jaw = Math.max(0, Math.sin(sf * 1.7)) * 6 * closeK;

  const x = interpolate(closeK, [0, 1], [walkX, 540]);
  const y = interpolate(closeK, [0, 1], [1500, 2340]);
  const s = interpolate(closeK, [0, 1], [1, 2.4]);
  const armAngle = interpolate(closeK, [0, 1], [60, 10]);

  // Hose runs from the attendant's hand (hip height) to the car's side.
  const hx = x - 79 * s;
  const hy = y - 385 * s;
  const hoseLen = 900;

  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ background: `linear-gradient(#050807, ${C.obsidian} 55%, ${C.pine})` }} />
      <div style={{ position: "absolute", inset: 0, opacity: 1 - closeK }}>
        <Layer z={1} blur={2}>
          <StationArt />
        </Layer>
        <Layer z={0}>
          <ContactShadow x={430} y={1528} rx={250} ry={24} />
        </Layer>
        <Layer z={2}>
          <Car x={430} y={1480} wheel={0} />
        </Layer>
        <Glow blend="normal">
          <path
            d={`M${hx.toFixed(1)} ${hy.toFixed(1)} Q 600 1720 300 1420`}
            fill="none"
            stroke={C.obsidian}
            strokeWidth={14}
            strokeLinecap="round"
            strokeDasharray={hoseLen}
            strokeDashoffset={hoseLen * (1 - hoseP)}
          />
        </Glow>
      </div>
      <Layer z={3}>
        <Attendant x={x} y={y} s={s} swing={swing} armAngle={armAngle} headTilt={headTilt} jaw={jaw} />
      </Layer>
    </AbsoluteFill>
  );
};

// Receipt copy, typed out one character every two frames.
const RECEIPT: { text: string; bold?: boolean; red?: boolean; center?: boolean }[] = [
  { text: "ЭШФОРД И СЫНОВЬЯ", bold: true, center: true },
  { text: "ТРАССА 9 · АВТОЗАПРАВКА", center: true },
  { text: "" },
  { text: "Дата: 12 ноября 1974" },
  { text: "Бензин: 54 литра" },
  { text: "Итого: 0.00 $" },
  { text: "" },
  { text: "Пожалуйста, не смотри в зеркало заднего вида.", bold: true, red: true },
];
const TYPE_START = 90;
const CHAR_FRAMES = 2;
const LINE_GAP = 14;
const lineStarts: number[] = [];
{
  let cursor = TYPE_START;
  for (const line of RECEIPT) {
    lineStarts.push(cursor);
    cursor += line.text.length * CHAR_FRAMES + LINE_GAP;
  }
}

// 1:15–1:40 — the receipt slides up into an extreme close-up and types itself out.
const ReceiptScene: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const sf = stepT(f);
  const rise = ramp(sf, [0, 3], [1320, 300]);
  const zoom = ramp(t, [0, 30], [0.95, 1.08]);
  const flicker = rnd(Math.floor(f / 4)) > 0.1 ? 1 : 0.92;

  return (
    <AbsoluteFill>
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse at 50% 40%, #2A3A33, ${C.obsidian} 72%)`,
          opacity: flicker,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 190,
          top: rise,
          width: 700,
          height: 1100,
          transform: `perspective(1000px) rotateX(${12 + Math.sin(t * 1.5) * 3}deg) rotateY(${-6 + Math.cos(t * 1.2) * 2}deg) rotateZ(-2deg) translateZ(80px) scale(${zoom})`,
          transformOrigin: "50% 70%",
          transformStyle: "preserve-3d",
        }}
      >
        {/* paper: rough edge, aged stains, drop shadow */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `radial-gradient(ellipse at 20% 85%, rgba(120,80,30,0.28), transparent 45%), radial-gradient(ellipse at 80% 15%, rgba(120,80,30,0.18), transparent 40%), ${C.receipt}`,
            filter: "url(#paperEdge) drop-shadow(0 22px 30px rgba(0,0,0,0.6))",
          }}
        />
        {/* ink */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            padding: "90px 70px",
            boxSizing: "border-box",
            fontFamily: "'Courier New', Courier, monospace",
            fontSize: 46,
            lineHeight: 1.25,
          }}
        >
          {RECEIPT.map((line, i) => {
            const n = Math.max(
              0,
              Math.min(line.text.length, Math.floor((f - lineStarts[i]) / CHAR_FRAMES)),
            );
            return (
              <div
                key={i}
                style={{
                  minHeight: 58,
                  textAlign: line.center ? "center" : "left",
                  fontWeight: line.bold ? 700 : 400,
                  color: line.red ? C.red : C.ink,
                }}
              >
                {line.text.slice(0, n)}
              </div>
            );
          })}
        </div>
      </div>
      {/* the attendant's paper hand, holding the bottom edge */}
      <Layer z={2}>
        <path
          d="M180 1920 L190 1600 Q230 1540 270 1600 L300 1490 Q335 1440 368 1490 L372 1600 Q420 1540 452 1590 L470 1920 Z"
          transform="translate(0 -150)"
          fill={C.kraft}
          stroke={C.kraftDark}
          strokeWidth={3}
        />
      </Layer>
    </AbsoluteFill>
  );
};

// 1:40–2:00 — the car speeds off. The station shrinks into the mirror and is gone;
// a silhouette sits in the back seat and leans forward.
const EscapeScene: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const sf = stepT(f);
  const scroll = t * 700 + t * t * 40;
  const wheel = Math.sin(sf * 3.4) * 6;
  const stationSc = ramp(t, [0, 6], [1, 0.12]);
  const stationOp = ramp(t, [0, 5], [1, 0]);
  const silOp = ramp(t, [5, 7], [0, 1]);
  const lean = ramp(sf, [13, 18], [0, 12]);
  const fadeOut = ramp(t, [18, 19.8], [0, 1]);

  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ background: `linear-gradient(#070B0A 0%, ${C.obsidian} 45%, ${C.pine} 100%)` }} />
      <Layer z={0} blur={5}>
        <Pines seed={1} count={14} spacing={96} scroll={scroll * 0.35} base={1110} hMin={140} hMax={260} fill="#162320" />
      </Layer>
      <Layer z={1} blur={1}>
        <Pines seed={2} count={14} spacing={120} scroll={scroll * 0.7} base={1200} hMin={220} hMax={380} fill={C.pine} />
      </Layer>
      <Layer z={2}>
        <path d="M452 1040 L628 1040 L1180 1920 L-100 1920 Z" fill={C.kraftDark} />
        {Array.from({ length: 7 }, (_, i) => {
          const u = (i / 7 + t * 0.9) % 1;
          return (
            <rect
              key={i}
              x={540 - (3 + 14 * u * u) / 2}
              y={1040 + 880 * u * u}
              width={3 + 14 * u * u}
              height={6 + 60 * u * u}
              fill={C.kraftLight}
            />
          );
        })}
      </Layer>
      <Dashboard wheel={wheel} />

      {/* rear-view mirror: paper frame, mirror glass */}
      <div
        style={{
          position: "absolute",
          left: 240,
          top: 110,
          width: 600,
          height: 260,
          borderRadius: 40,
          background: C.kraft,
          padding: 16,
          boxSizing: "border-box",
          filter: "url(#paperEdge) drop-shadow(0 18px 26px rgba(0,0,0,0.6))",
        }}
      >
        <svg width={568} height={228} viewBox="0 0 600 260" style={{ display: "block", borderRadius: 26, overflow: "hidden" }}>
          <rect width={600} height={260} fill="#0C1412" />
          <Pines seed={5} count={12} spacing={60} scroll={t * 200} base={225} hMin={70} hMax={130} fill="#1f2d28" span={600} pad={0} />
          <g
            opacity={stationOp}
            transform={`translate(300 230) scale(${0.2 * stationSc}) translate(-540 -1400)`}
          >
            <StationArt />
          </g>
          <g opacity={silOp} transform={`translate(300 260) scale(${1 + lean * 0.02}) translate(-300 -260)`}>
            <path d="M236 260 Q242 190 300 186 Q358 190 364 260 Z" fill={C.obsidian} />
            <ellipse cx={300} cy={150 + lean * 0.8} rx={34} ry={42} fill={C.obsidian} />
            <circle cx={287} cy={146 + lean * 0.8} r={4} fill={C.red} />
            <circle cx={313} cy={146 + lean * 0.8} r={4} fill={C.red} />
          </g>
        </svg>
      </div>

      <AbsoluteFill style={{ background: "#000", opacity: fadeOut }} />
    </AbsoluteFill>
  );
};

// ---------- captions (global time, paper label style) ----------

const CAPTIONS: { s: number; e: number; text: string }[] = [
  { s: 0.5, e: 4.2, text: "2:03 ночи. Горный перевал Черных Сосен." },
  { s: 4.6, e: 9.2, text: "Сто километров. Ни заправок, ни фонарей." },
  { s: 9.8, e: 14.6, text: "И тут сквозь туман пробился свет." },
  { s: 26, e: 30, text: "Старая заправка из пятидесятых. Жужжит неон." },
  { s: 31, e: 36, text: "«Эшфорд и сыновья». Открыто всю ночь." },
  { s: 37, e: 45, text: "Заправщик подошел молча... не мигая." },
  { s: 51, e: 58, text: "Он залил полный бак в мертвой тишине." },
  { s: 59, e: 70, text: "Шланг даже ни разу не шелохнулся." },
  { s: 75.5, e: 80, text: "Затем он молча протянул мне чек." },
  { s: 81, e: 89, text: "Прочитай нижнюю строчку." },
  { s: 101, e: 106, text: "Мне не следовало смотреть." },
  { s: 107, e: 113, text: "Заправка просто исчезла." },
  { s: 114, e: 119, text: "На заднем сиденье кто-то сидит." },
];

const Captions: React.FC<{ t: number }> = ({ t }) => {
  const line = CAPTIONS.find((c) => t >= c.s && t <= c.e);
  if (!line) return null;
  const inK = ramp(t, [line.s, line.s + 0.25], [0, 1]);
  const outK = ramp(t, [line.e - 0.25, line.e], [1, 0]);
  const o = Math.min(inK, outK);
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: 1560,
        display: "flex",
        justifyContent: "center",
        opacity: o,
        transform: `translateY(${(1 - o) * 20}px) rotate(-1.2deg)`,
      }}
    >
      <div
        style={{
          background: C.kraft,
          color: C.obsidian,
          fontFamily: "Georgia, 'Times New Roman', serif",
          fontWeight: 700,
          fontSize: 58,
          lineHeight: 1.2,
          padding: "18px 34px",
          maxWidth: 900,
          textAlign: "center",
          filter: "url(#paperEdge) drop-shadow(0 10px 18px rgba(0,0,0,0.6))",
        }}
      >
        {line.text}
      </div>
    </div>
  );
};

// ---------- composition ----------

export const PaperCutRedditHorror: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;

  // Camera: slow drift, a stepped paper jitter, and punch-zooms on the key beats.
  const jx = (rnd(Math.floor(frame / 2.5)) - 0.5) * 4;
  const jy = (rnd(Math.floor(frame / 2.5) + 500) - 0.5) * 4;
  const dx = Math.sin(t * 0.35) * 12 + jx;
  const dy = Math.cos(t * 0.28) * 8 + jy;
  const drift = 1.015 + 0.015 * Math.sin(t * 0.7);
  const punch =
    1 +
    0.05 *
      (hit(t, 0.5, 5) + hit(t, 26, 5) + hit(t, 51, 5) + hit(t, 75.5, 5) + hit(t, 101, 5));

  return (
    <AbsoluteFill style={{ backgroundColor: C.obsidian, overflow: "hidden" }}>
      <PaperDefs />
      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: `translate(${dx}px, ${dy}px) scale(${drift * punch})`,
          transformOrigin: "50% 50%",
        }}
      >
        <Sequence from={0} durationInFrames={750}>
          <RoadScene />
        </Sequence>
        <Sequence from={750} durationInFrames={750}>
          <StationScene />
        </Sequence>
        <Sequence from={1500} durationInFrames={750}>
          <AttendantScene />
        </Sequence>
        <Sequence from={2250} durationInFrames={750}>
          <ReceiptScene />
        </Sequence>
        <Sequence from={3000} durationInFrames={600}>
          <EscapeScene />
        </Sequence>
      </div>

      {/* vignette + shared paper fibre texture */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 45%, rgba(0,0,0,0.65) 100%)`,
          pointerEvents: "none",
        }}
      />
      <svg width={W} height={H} style={{ position: "absolute", inset: 0, mixBlendMode: "multiply", opacity: 0.55, pointerEvents: "none" }}>
        <rect width={W} height={H} filter="url(#fiber)" />
      </svg>

      <Captions t={t} />
    </AbsoluteFill>
  );
};
