import React from "react";
import {
  AbsoluteFill,
  Audio,
  Easing,
  interpolate,
  interpolateColors,
  random,
  spring,
  staticFile,
  useCurrentFrame,
} from "remotion";

/*
 * =========================================================================
 * WHY NOT AI REEL — 1080x1920 @ 60 FPS, 2640 FRAMES (44s)
 *
 *   01  0.00 –  9.10s : "ПОЧЕМУ ТЫ НЕ МОЖЕШЬ ЗАРАБАТЫВАТЬ С ИИ?" — shown on a jumbo screen inside a
 *                       3D Wall Street trading floor (marble columns, ticker rings, falling $);
 *                       7.3 – 9.1s camera flies INTO the screen → lands 1:1 on Scene 2
 *   02  9.10 – 14.58s : 3D "ВОЛШЕБНАЯ КНОПКА" — press, falling $ cubes, crossed out
 *   03 14.58 – 26.60s : "НЕ КНОПКА — УСИЛИТЕЛЬ" → 0-understanding cubes → "0 × 1,000 = 0"
 *   04 26.60 – 35.88s : "1 РАБОЧАЯ СВЯЗКА" linked cubes → 3D race "10X БЫСТРЕЕ"
 *   05 35.88 – 44.00s : "ПОЙМИ СИСТЕМУ" grid → CTA "НАПИШИ «БАЗА»"
 *
 * TRUE 3D: perspective(1200px) + preserve-3d world, 6-face boxes at real Z depths,
 * floor plane with contact shadows, depth-of-field blur on far/near geometry,
 * animated camera (rotateX / rotateY / translateZ punch zooms).
 * Palette: #000000 / #FFFFFF / cobalt #2563EB / slate #1E293B (+ their shades).
 * All cyclic indices go through mod().
 * =========================================================================
 */

const FPS = 60;
const TOTAL = 2640;
const W = 1080;
const H = 1920;

const C = {
  black: "#000000",
  white: "#FFFFFF",
  cobalt: "#2563EB",
  slate: "#1E293B",
  // shades for 3D face lighting
  cobaltSide: "#1D4ED8",
  cobaltTop: "#3B82F6",
  slateSide: "#0F172A",
  slateTop: "#334155",
  whiteSide: "#CBD5E1",
  whiteTop: "#F1F5F9",
};

const FONT = "'Inter', 'SF Pro Display', 'Helvetica Neue', Arial, sans-serif";
const FLOOR = 380;

const mod = (n: number, m: number) => ((n % m) + m) % m;
const T = (s: number) => Math.round(s * FPS);
const CL = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

const pop = (
  f: number,
  at: number,
  cfg: { damping?: number; stiffness?: number; mass?: number } = {}
) =>
  f < at
    ? 0
    : spring({
        frame: f - at,
        fps: FPS,
        config: { damping: 14, stiffness: 150, mass: 0.8, ...cfg },
      });

/** in/out window for a scene or phase: alpha + z travel (fly in from depth, fly past camera) */
const win = (f: number, a: number, b: number, fi = 16, fo = 14) => {
  const inP = interpolate(f, [a, a + fi], [0, 1], { ...CL, easing: Easing.out(Easing.cubic) });
  const outP = interpolate(f, [b - fo, b], [0, 1], { ...CL, easing: Easing.in(Easing.cubic) });
  return {
    on: f >= a - 1 && f <= b + 1,
    alpha: Math.min(inP, 1 - outP),
    z: (1 - inP) * -800 + outP * 900,
  };
};

// =========================================================================
// WORDS (inlined from public/why_not_ai_reel/words.json, ASR typos fixed)
// =========================================================================
type Word = { w: string; s: number; e: number };
const WORDS: Word[] = [
  { w: "А", s: 0.0, e: 0.24 },
  { w: "знаешь,", s: 0.24, e: 0.52 },
  { w: "почему", s: 0.64, e: 0.86 },
  { w: "ты", s: 0.86, e: 1.04 },
  { w: "до", s: 1.04, e: 1.16 },
  { w: "сих", s: 1.16, e: 1.34 },
  { w: "пор", s: 1.34, e: 1.52 },
  { w: "не", s: 1.52, e: 1.7 },
  { w: "можешь", s: 1.7, e: 1.96 },
  { w: "зарабатывать", s: 1.96, e: 2.72 },
  { w: "с ИИ?", s: 2.72, e: 3.28 },
  { w: "Потому", s: 3.74, e: 3.96 },
  { w: "что", s: 3.96, e: 4.24 },
  { w: "ты", s: 4.24, e: 4.38 },
  { w: "не", s: 4.38, e: 4.52 },
  { w: "знаешь,", s: 4.52, e: 4.92 },
  { w: "что", s: 5.08, e: 5.2 },
  { w: "такое", s: 5.2, e: 5.52 },
  { w: "ИИ.", s: 5.52, e: 6.26 },
  { w: "И", s: 6.62, e: 6.72 },
  { w: "главное,", s: 6.72, e: 6.98 },
  { w: "ты", s: 7.34, e: 7.42 },
  { w: "даже", s: 7.42, e: 7.66 },
  { w: "не", s: 7.66, e: 7.82 },
  { w: "хочешь", s: 7.82, e: 8.16 },
  { w: "понять.", s: 8.16, e: 8.56 },
  { w: "Ты", s: 9.1, e: 9.2 },
  { w: "думаешь,", s: 9.2, e: 9.62 },
  { w: "что", s: 9.9, e: 10.0 },
  { w: "нейросеть", s: 10.0, e: 10.6 },
  { w: "это", s: 10.8, e: 11.02 },
  { w: "волшебная", s: 11.02, e: 11.58 },
  { w: "кнопка,", s: 11.58, e: 12.08 },
  { w: "нажал", s: 12.3, e: 12.66 },
  { w: "и", s: 12.66, e: 13.08 },
  { w: "деньги", s: 13.08, e: 13.4 },
  { w: "посыпались.", s: 13.4, e: 14.08 },
  { w: "Но", s: 14.58, e: 14.84 },
  { w: "ИИ", s: 14.84, e: 15.54 },
  { w: "это", s: 15.8, e: 16.02 },
  { w: "не", s: 16.02, e: 16.16 },
  { w: "кнопка,", s: 16.16, e: 16.64 },
  { w: "это", s: 16.9, e: 17.1 },
  { w: "усилитель.", s: 17.1, e: 17.7 },
  { w: "Если", s: 18.14, e: 18.44 },
  { w: "у", s: 18.44, e: 18.56 },
  { w: "тебя", s: 18.56, e: 18.76 },
  { w: "ноль", s: 18.76, e: 19.04 },
  { w: "понимания,", s: 19.04, e: 19.62 },
  { w: "как", s: 19.78, e: 19.78 },
  { w: "устроен", s: 19.78, e: 20.36 },
  { w: "продукт,", s: 20.36, e: 20.82 },
  { w: "продажи", s: 20.94, e: 21.3 },
  { w: "и", s: 21.3, e: 21.58 },
  { w: "автоматизация,", s: 21.58, e: 22.46 },
  { w: "нейросеть", s: 23.18, e: 23.74 },
  { w: "просто", s: 23.74, e: 24.12 },
  { w: "умножит", s: 24.12, e: 24.7 },
  { w: "твой", s: 24.7, e: 24.94 },
  { w: "ноль", s: 24.94, e: 25.28 },
  { w: "на", s: 25.28, e: 25.44 },
  { w: "тысячу.", s: 25.44, e: 26.04 },
  { w: "Но", s: 26.04, e: 26.6 },
  { w: "как", s: 26.6, e: 26.72 },
  { w: "только", s: 26.72, e: 27.0 },
  { w: "ты", s: 27.0, e: 27.26 },
  { w: "разберешься", s: 27.26, e: 27.96 },
  { w: "в", s: 27.96, e: 28.1 },
  { w: "базе", s: 28.1, e: 28.5 },
  { w: "и", s: 28.5, e: 28.7 },
  { w: "соберешь", s: 28.7, e: 29.14 },
  { w: "хотя", s: 29.14, e: 29.36 },
  { w: "бы", s: 29.36, e: 29.62 },
  { w: "одну", s: 29.62, e: 30.02 },
  { w: "рабочую", s: 30.02, e: 30.58 },
  { w: "связку,", s: 30.58, e: 31.2 },
  { w: "ИИ", s: 31.62, e: 32.04 },
  { w: "сделает", s: 32.04, e: 32.68 },
  { w: "тебя", s: 32.68, e: 32.96 },
  { w: "в", s: 32.96, e: 33.16 },
  { w: "десять", s: 33.16, e: 33.56 },
  { w: "раз", s: 33.56, e: 33.7 },
  { w: "быстрее", s: 33.7, e: 34.24 },
  { w: "любого", s: 34.24, e: 34.66 },
  { w: "конкурента.", s: 34.66, e: 35.32 },
  { w: "Перестань", s: 35.88, e: 36.36 },
  { w: "искать", s: 36.36, e: 36.72 },
  { w: "халявы", s: 36.72, e: 37.22 },
  { w: "и", s: 37.22, e: 37.34 },
  { w: "начни", s: 37.34, e: 37.68 },
  { w: "понимать", s: 37.68, e: 38.02 },
  { w: "систему.", s: 38.02, e: 38.56 },
  { w: "Напиши", s: 39.12, e: 39.5 },
  { w: "слово", s: 39.5, e: 39.74 },
  { w: "«БАЗА»", s: 39.74, e: 40.01 },
  { w: "в", s: 40.01, e: 40.28 },
  { w: "комментариях,", s: 40.28, e: 41.42 },
  { w: "и", s: 41.42, e: 41.52 },
  { w: "я", s: 41.52, e: 41.66 },
  { w: "скину,", s: 41.66, e: 41.93 },
  { w: "с", s: 41.93, e: 42.2 },
  { w: "чего", s: 42.2, e: 42.42 },
  { w: "начать.", s: 42.42, e: 42.92 },
];

type Chunk = { words: Word[]; s: number; e: number };
const CHUNKS: Chunk[] = (() => {
  const out: Chunk[] = [];
  let cur: Word[] = [];
  WORDS.forEach((w) => {
    const prev = cur[cur.length - 1];
    if (prev && (cur.length >= 4 || /[.,?!»]$/.test(prev.w) || w.s - prev.e > 0.35)) {
      out.push({ words: cur, s: cur[0].s, e: prev.e });
      cur = [];
    }
    cur.push(w);
  });
  if (cur.length) out.push({ words: cur, s: cur[0].s, e: cur[cur.length - 1].e });
  return out;
})();

// =========================================================================
// 3D PRIMITIVES
// =========================================================================
type FaceProps = {
  fw: number;
  fh: number;
  t: string;
  bg: string;
  alpha: number;
  blur: number;
  edge?: string;
  children?: React.ReactNode;
};

const Face: React.FC<FaceProps> = ({ fw, fh, t, bg, alpha, blur, edge, children }) => (
  <div
    style={{
      position: "absolute",
      left: -fw / 2,
      top: -fh / 2,
      width: fw,
      height: fh,
      background: bg,
      transform: t,
      backfaceVisibility: "hidden",
      opacity: alpha,
      filter: blur > 0.2 ? `blur(${blur}px)` : undefined,
      boxShadow: edge ?? "inset 0 0 0 1.5px rgba(255,255,255,0.08)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
    }}
  >
    {children}
  </div>
);

type Palette = { front: string; side: string; top: string };
const PAL = {
  cobalt: { front: C.cobalt, side: C.cobaltSide, top: C.cobaltTop } as Palette,
  slate: { front: C.slate, side: C.slateSide, top: C.slateTop } as Palette,
  white: { front: C.white, side: C.whiteSide, top: C.whiteTop } as Palette,
};
const mixPal = (a: Palette, b: Palette, t: number): Palette => ({
  front: interpolateColors(t, [0, 1], [a.front, b.front]),
  side: interpolateColors(t, [0, 1], [a.side, b.side]),
  top: interpolateColors(t, [0, 1], [a.top, b.top]),
});

type BoxProps = {
  x?: number;
  y?: number;
  z?: number;
  w: number;
  h: number;
  d: number;
  rx?: number;
  ry?: number;
  rz?: number;
  s?: number;
  pal: Palette;
  alpha?: number;
  blur?: number;
  edge?: string;
  wrap?: boolean; // repeat front content on the 3 other vertical faces
  children?: React.ReactNode;
};

const Box: React.FC<BoxProps> = ({
  x = 0,
  y = 0,
  z = 0,
  w,
  h,
  d,
  rx = 0,
  ry = 0,
  rz = 0,
  s = 1,
  pal,
  alpha = 1,
  blur = 0,
  edge,
  wrap,
  children,
}) => {
  if (alpha <= 0.001 || s <= 0.001) return null;
  const common = { alpha, blur };
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        transformStyle: "preserve-3d",
        transform: `translate3d(${x}px,${y}px,${z}px) rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${rz}deg) scale3d(${s},${s},${s})`,
      }}
    >
      <Face fw={w} fh={h} t={`translateZ(${d / 2}px)`} bg={pal.front} edge={edge} {...common}>
        {children}
      </Face>
      <Face fw={w} fh={h} t={`rotateY(180deg) translateZ(${d / 2}px)`} bg={wrap ? pal.front : pal.side} edge={edge} {...common}>
        {wrap ? children : null}
      </Face>
      <Face fw={d} fh={h} t={`rotateY(90deg) translateZ(${w / 2}px)`} bg={pal.side} edge={edge} {...common}>
        {wrap ? children : null}
      </Face>
      <Face fw={d} fh={h} t={`rotateY(-90deg) translateZ(${w / 2}px)`} bg={pal.side} edge={edge} {...common}>
        {wrap ? children : null}
      </Face>
      <Face fw={w} fh={d} t={`rotateX(90deg) translateZ(${h / 2}px)`} bg={pal.top} edge={edge} {...common} />
      <Face fw={w} fh={d} t={`rotateX(-90deg) translateZ(${h / 2}px)`} bg={pal.side} edge={edge} {...common} />
    </div>
  );
};

/** soft contact shadow lying on the floor plane */
const Shadow: React.FC<{ x: number; z: number; w: number; d: number; alpha?: number; soft?: number }> = ({
  x,
  z,
  w,
  d,
  alpha = 1,
  soft = 1,
}) =>
  alpha <= 0.001 ? null : (
    <div
      style={{
        position: "absolute",
        left: -w / 2,
        top: -d / 2,
        width: w,
        height: d,
        transform: `translate3d(${x}px,${FLOOR - 2}px,${z}px) rotateX(90deg)`,
        background:
          "radial-gradient(ellipse at center, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.6) 38%, rgba(0,0,0,0) 70%)",
        opacity: alpha,
        filter: `blur(${10 * soft}px)`,
      }}
    />
  );

/** cobalt light pool / ring on the floor */
const FloorGlow: React.FC<{ x: number; z: number; r: number; alpha?: number; ring?: boolean }> = ({
  x,
  z,
  r,
  alpha = 1,
  ring,
}) =>
  alpha <= 0.001 ? null : (
    <div
      style={{
        position: "absolute",
        left: -r,
        top: -r,
        width: r * 2,
        height: r * 2,
        borderRadius: "50%",
        transform: `translate3d(${x}px,${FLOOR - 3}px,${z}px) rotateX(90deg)`,
        background: ring ? "transparent" : "radial-gradient(circle, rgba(37,99,235,0.55) 0%, rgba(37,99,235,0) 65%)",
        border: ring ? `6px solid ${C.cobalt}` : undefined,
        boxShadow: ring ? `0 0 40px ${C.cobalt}` : undefined,
        opacity: alpha,
      }}
    />
  );

type LabelProps = {
  x?: number;
  y?: number;
  z?: number;
  rx?: number;
  ry?: number;
  s?: number;
  alpha?: number;
  size?: number;
  color?: string;
  bg?: string;
  border?: string;
  pad?: string;
  blur?: number;
  children: React.ReactNode;
};

/** flat text card living in 3D space */
const Label: React.FC<LabelProps> = ({
  x = 0,
  y = 0,
  z = 0,
  rx = 0,
  ry = 0,
  s = 1,
  alpha = 1,
  size = 80,
  color = C.white,
  bg,
  border,
  pad,
  blur = 0,
  children,
}) =>
  alpha <= 0.001 || s <= 0.001 ? null : (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        transform: `translate3d(${x}px,${y}px,${z}px) rotateX(${rx}deg) rotateY(${ry}deg) translate(-50%,-50%) scale(${s})`,
        opacity: alpha,
        fontFamily: FONT,
        fontWeight: 900,
        fontSize: size,
        lineHeight: 1.02,
        letterSpacing: -1,
        color,
        whiteSpace: "pre",
        textAlign: "center",
        background: bg,
        border,
        borderRadius: bg || border ? 999 : 0,
        padding: pad ?? (bg || border ? "18px 44px" : 0),
        textShadow: bg ? undefined : "0 18px 40px rgba(0,0,0,0.9)",
        boxShadow: bg ? "0 30px 60px rgba(0,0,0,0.7)" : undefined,
        filter: blur > 0.2 ? `blur(${blur}px)` : undefined,
      }}
    >
      {children}
    </div>
  );

const Txt: React.FC<{ size: number; color?: string; children: React.ReactNode }> = ({
  size,
  color = C.white,
  children,
}) => (
  <div
    style={{
      fontFamily: FONT,
      fontWeight: 900,
      fontSize: size,
      lineHeight: 1,
      color,
      textAlign: "center",
      whiteSpace: "pre",
      letterSpacing: -1,
    }}
  >
    {children}
  </div>
);

const G: React.FC<{ z?: number; ry?: number; rx?: number; children: React.ReactNode }> = ({
  z = 0,
  ry = 0,
  rx = 0,
  children,
}) => (
  <div
    style={{
      position: "absolute",
      left: 0,
      top: 0,
      transformStyle: "preserve-3d",
      transform: `translateZ(${z}px) rotateX(${rx}deg) rotateY(${ry}deg)`,
    }}
  >
    {children}
  </div>
);

/** depth-of-field: blur grows with distance from the focus plane */
const dof = (z: number, focus = 0) => {
  const dz = Math.abs(z - focus);
  return dz < 500 ? 0 : Math.min(8, (dz - 500) / 220);
};

// =========================================================================
// ENVIRONMENT
// =========================================================================
const Floor: React.FC = () => (
  <div
    style={{
      position: "absolute",
      left: -2400,
      top: -2400,
      width: 4800,
      height: 4800,
      transform: `translate3d(0px,${FLOOR}px,-1500px) rotateX(90deg)`,
      background: `radial-gradient(circle at 50% 66%, rgba(30,41,59,1) 0%, rgba(30,41,59,0.55) 22%, rgba(0,0,0,1) 52%)`,
    }}
  >
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundImage:
          "linear-gradient(rgba(37,99,235,0.22) 2px, transparent 2px), linear-gradient(90deg, rgba(37,99,235,0.22) 2px, transparent 2px)",
        backgroundSize: "160px 160px",
        WebkitMaskImage: "radial-gradient(circle at 50% 66%, black 0%, black 18%, transparent 48%)",
        maskImage: "radial-gradient(circle at 50% 66%, black 0%, black 18%, transparent 48%)",
      }}
    />
  </div>
);

const AMBIENT = new Array(16).fill(0).map((_, i) => {
  const near = mod(i, 8) === 7; // a couple of out-of-focus foreground cubes
  return {
    x: (random(`ax${i}`) - 0.5) * (near ? 1500 : 2600),
    y: -900 + random(`ay${i}`) * 1100,
    z: near ? 380 + random(`az${i}`) * 200 : -2800 + random(`az${i}`) * 1700,
    size: near ? 110 + random(`as${i}`) * 60 : 70 + random(`as${i}`) * 140,
    spin: 0.2 + random(`sp${i}`) * 0.6,
    phase: random(`ph${i}`) * Math.PI * 2,
    pal: mod(i, 4) === 0 ? PAL.cobalt : PAL.slate,
  };
});

const Ambient: React.FC<{ f: number }> = ({ f }) => (
  <>
    {AMBIENT.map((a, i) => {
      const bob = Math.sin(f / 70 + a.phase) * 40;
      return (
        <Box
          key={i}
          x={a.x}
          y={a.y + bob}
          z={a.z}
          w={a.size}
          h={a.size}
          d={a.size}
          rx={f * a.spin * 0.7 + a.phase * 30}
          ry={f * a.spin + a.phase * 50}
          pal={a.pal}
          alpha={a.z > 0 ? 0.55 : 0.75}
          blur={a.z > 0 ? 10 : dof(a.z)}
        />
      );
    })}
  </>
);

// =========================================================================
// SCENE 1 — ПОЧЕМУ ТЫ НЕ МОЖЕШЬ ЗАРАБАТЫВАТЬ С ИИ?
// =========================================================================
const MONOS = [
  { x: -400, z: -700, w: 180, h: 1100, d: 180, at: 0 },
  { x: 430, z: -900, w: 200, h: 1300, d: 200, at: 8 },
  { x: -120, z: -1700, w: 240, h: 1600, d: 240, at: 16 },
  { x: 190, z: -1300, w: 160, h: 950, d: 160, at: 22 },
  { x: -660, z: -1500, w: 200, h: 1250, d: 200, at: 28 },
  { x: 680, z: -1800, w: 220, h: 1450, d: 220, at: 34 },
];

const HEAD1 = [
  { t: "ПОЧЕМУ ТЫ", at: 0.64, y: -600, w: 780, h: 140 },
  { t: "НЕ МОЖЕШЬ", at: 1.52, y: -440, w: 780, h: 140 },
  { t: "ЗАРАБАТЫВАТЬ", at: 1.96, y: -280, w: 860, h: 140 },
  { t: "С ИИ?", at: 2.72, y: -80, w: 600, h: 210, accent: true },
];

const Scene1: React.FC<{ f: number }> = ({ f }) => {
  const sc = win(f, 0, T(9.1), 1, 16);
  if (!sc.on) return null;
  const A = sc.alpha;
  const back = pop(f, T(3.74), { damping: 20, stiffness: 90 });
  const cubeIn = pop(f, T(5.2), { damping: 11 });
  const dim = interpolate(f, [T(7.66), T(8.2)], [0, 1], CL);
  const spinSpeed = interpolate(dim, [0, 1], [1.4, 0.25]);
  const cubeRy = f * spinSpeed + 30;
  const cubePal = mixPal(PAL.cobalt, PAL.slate, dim);

  return (
    <G z={sc.z}>
      {MONOS.map((m, i) => {
        const rise = interpolate(f, [m.at, m.at + 55], [0, 1], { ...CL, easing: Easing.out(Easing.cubic) });
        const h = Math.max(2, m.h * rise);
        return (
          <React.Fragment key={i}>
            <Shadow x={m.x + 70} z={m.z + 60} w={m.w * 2.6} d={m.d * 2.6} alpha={A * rise} />
            <Box
              x={m.x}
              y={FLOOR - h / 2}
              z={m.z}
              w={m.w}
              h={h}
              d={m.d}
              ry={18}
              pal={PAL.slate}
              alpha={A}
              blur={dof(m.z, -500)}
            >
              <div
                style={{
                  position: "absolute",
                  top: 30,
                  left: "50%",
                  width: 8,
                  height: "40%",
                  marginLeft: -4,
                  background: C.cobalt,
                  boxShadow: `0 0 24px ${C.cobalt}`,
                }}
              />
            </Box>
          </React.Fragment>
        );
      })}

      {HEAD1.map((l, i) => {
        const p = pop(f, T(l.at) - 4, { damping: 13, stiffness: 170 });
        const z = interpolate(p, [0, 1], [-1600, 0]) - back * 1400;
        const y = l.y - back * 120;
        const rx = (1 - p) * -70 + back * 22;
        return (
          <Box
            key={i}
            x={0}
            y={y}
            z={z}
            w={l.w}
            h={l.h}
            d={56}
            rx={rx}
            ry={Math.sin(f / 60 + i) * 4}
            pal={l.accent ? PAL.cobalt : PAL.white}
            alpha={A * clamp01(p * 3) * (1 - back * 0.85)}
            blur={back * 6}
            edge={l.accent ? `inset 0 0 0 3px ${C.white}` : undefined}
          >
            <Txt size={l.accent ? 150 : 92} color={l.accent ? C.white : C.black}>
              {l.t}
            </Txt>
          </Box>
        );
      })}

      {/* phase B: ты не знаешь, что такое ИИ */}
      <Label y={-640} z={80} alpha={A * pop(f, T(4.24))} s={0.6 + 0.4 * pop(f, T(4.24))} size={92}>
        ТЫ НЕ ЗНАЕШЬ,
      </Label>
      <Label y={-520} z={80} alpha={A * pop(f, T(5.08))} s={0.6 + 0.4 * pop(f, T(5.08))} size={92} color={C.cobalt}>
        ЧТО ТАКОЕ
      </Label>
      <Shadow x={30} z={40} w={560 * cubeIn} d={420 * cubeIn} alpha={A * cubeIn} />
      <FloorGlow x={0} z={0} r={520} alpha={A * cubeIn * (1 - dim)} />
      <Box
        x={0}
        y={interpolate(cubeIn, [0, 1], [-1200, 80]) + Math.sin(f / 30) * 14}
        z={0}
        w={320}
        h={320}
        d={320}
        rx={-14}
        ry={cubeRy}
        pal={cubePal}
        alpha={A * clamp01(cubeIn * 2)}
        edge={`inset 0 0 0 3px rgba(255,255,255,${0.9 - dim * 0.6})`}
        wrap
      >
        <Txt size={170}>ИИ</Txt>
      </Box>
      <Label
        y={-400}
        z={200}
        alpha={A * pop(f, T(7.34))}
        s={0.5 + 0.5 * pop(f, T(7.34))}
        size={64}
        bg={C.white}
        color={C.black}
      >
        И ДАЖЕ НЕ ХОЧЕШЬ ПОНЯТЬ
      </Label>
    </G>
  );
};

// =========================================================================
// SCENE 2 — ВОЛШЕБНАЯ КНОПКА (crossed out)
// =========================================================================
const COINS = new Array(12).fill(0).map((_, i) => ({
  x: (random(`cx${i}`) - 0.5) * 860,
  z: (random(`cz${i}`) - 0.5) * 520 + 80,
  rot: (random(`cr${i}`) - 0.5) * 80,
  delay: i * 3,
}));

const Scene2: React.FC<{ f: number }> = ({ f }) => {
  const sc = win(f, T(9.1), T(14.58));
  if (!sc.on) return null;
  const A = sc.alpha;
  const btnIn = pop(f, T(10.8), { damping: 12 });
  const press =
    f < T(12.3) ? 0 : interpolate(f, [T(12.3), T(12.3) + 6, T(12.3) + 22], [0, 1, 0], CL);
  const cross = pop(f, T(13.9), { damping: 12, stiffness: 200 });
  const dead = interpolate(f, [T(13.9), T(14.2)], [0, 1], CL);
  const btnPal = mixPal(PAL.cobalt, PAL.slate, dead);
  const pedH = 120;
  const btnH = 150;
  const btnY = FLOOR - pedH - btnH / 2 + press * 50 + (1 - btnIn) * -900;

  return (
    <G z={sc.z} ry={Math.sin(f / 90) * 10}>
      <Label y={-700} z={0} alpha={A * pop(f, T(9.1))} size={64} color={C.whiteSide}>
        ТЫ ДУМАЕШЬ, ЧТО
      </Label>
      <Label y={-590} z={0} alpha={A * pop(f, T(10.0))} s={0.7 + 0.3 * pop(f, T(10.0))} size={96}>
        НЕЙРОСЕТЬ — ЭТО
      </Label>

      <Shadow x={40} z={30} w={1100} d={720} alpha={A} />
      <FloorGlow x={0} z={0} r={620} alpha={A * btnIn * (1 - dead)} />
      <Box x={0} y={FLOOR - pedH / 2} z={0} w={760} h={pedH} d={460} pal={PAL.slate} alpha={A} />
      <Box
        x={0}
        y={btnY}
        z={0}
        w={620}
        h={btnH}
        d={320}
        pal={btnPal}
        alpha={A * clamp01(btnIn * 2)}
        edge={`inset 0 0 0 3px rgba(255,255,255,${0.85 - dead * 0.6})`}
      >
        <Txt size={58}>{"ВОЛШЕБНАЯ\nКНОПКА"}</Txt>
      </Box>
      <Label y={-200} z={120} alpha={A * pop(f, T(12.3)) * (1 - dead)} size={84}>
        НАЖАЛ →
      </Label>

      {COINS.map((c, i) => {
        const p = pop(f, T(13.08) + c.delay, { damping: 8, stiffness: 120 });
        if (p <= 0) return null;
        const y = interpolate(p, [0, 1], [-1400, FLOOR - 45]);
        return (
          <React.Fragment key={i}>
            <Shadow x={c.x} z={c.z} w={150} d={110} alpha={A * clamp01(p)} soft={0.6} />
            <Box
              x={c.x}
              y={Math.min(y, FLOOR - 45)}
              z={c.z}
              w={90}
              h={90}
              d={90}
              rx={c.rot * (1 - p)}
              ry={c.rot + f * 0.5}
              pal={PAL.white}
              alpha={A}
              blur={dof(c.z, 0)}
            >
              <Txt size={64} color={C.black}>
                $
              </Txt>
            </Box>
          </React.Fragment>
        );
      })}

      {[-1, 1].map((sg) => (
        <Box
          key={sg}
          x={0}
          y={-40}
          z={340}
          w={1060}
          h={58}
          d={40}
          rz={sg * 24}
          s={interpolate(cross, [0, 1], [2.6, 1])}
          pal={PAL.white}
          alpha={A * clamp01(cross * 2)}
        />
      ))}
    </G>
  );
};

// =========================================================================
// SCENE 3 — НЕ КНОПКА — УСИЛИТЕЛЬ · 0 × 1,000 = 0
// =========================================================================
const SKILLS = [
  { t: "ПРОДУКТ", at: 20.36, x: -340, z: -60, fs: 46 },
  { t: "ПРОДАЖИ", at: 20.94, x: 0, z: 70, fs: 46 },
  { t: "АВТОМА-\nТИЗАЦИЯ", at: 21.58, x: 340, z: -60, fs: 40 },
];

const EQ = [
  { t: "0", at: 23.74, w: 150, pal: PAL.white, c: C.black },
  { t: "×", at: 24.12, w: 150, pal: PAL.slate, c: C.white },
  { t: "1,000", at: 25.44, w: 300, pal: PAL.white, c: C.black },
  { t: "=", at: 25.8, w: 150, pal: PAL.slate, c: C.white },
  { t: "0", at: 26.04, w: 150, pal: PAL.cobalt, c: C.white, big: true },
];

const Scene3: React.FC<{ f: number }> = ({ f }) => {
  const sc = win(f, T(14.58), T(26.6));
  if (!sc.on) return null;

  // phase A — not a button, an amplifier
  const pa = win(f, T(14.58), T(18.14));
  const xOut = pop(f, T(16.02), { damping: 12, stiffness: 200 });
  const amp = pop(f, T(17.1), { damping: 11, stiffness: 160 });

  // phase B — zero understanding
  const pb = win(f, T(18.14), T(23.1));

  // phase C — equation
  const pc = win(f, T(23.1), T(26.6), 14, 12);
  const finalP = pop(f, T(26.04));

  return (
    <G z={sc.z}>
      {pa.on && (
        <G z={pa.z} ry={Math.sin(f / 80) * 12}>
          <Label y={-660} alpha={pa.alpha * pop(f, T(14.84))} size={96}>
            ИИ — НЕ КНОПКА
          </Label>
          <Shadow x={-240} z={-260} w={520} d={360} alpha={pa.alpha} />
          <Box
            x={-240 - amp * 140}
            y={FLOOR - 70}
            z={-260 - amp * 300}
            w={320}
            h={140}
            d={220}
            ry={20}
            pal={PAL.slate}
            alpha={pa.alpha}
            blur={amp * 3}
          >
            <Txt size={46}>КНОПКА</Txt>
          </Box>
          {[-1, 1].map((sg) => (
            <Box
              key={sg}
              x={-240 - amp * 140}
              y={FLOOR - 70}
              z={-90 - amp * 300}
              w={380}
              h={26}
              d={20}
              rz={sg * 20}
              s={interpolate(xOut, [0, 1], [2.2, 1])}
              pal={PAL.white}
              alpha={pa.alpha * clamp01(xOut * 2)}
              blur={amp * 3}
            />
          ))}
          {[0, 1, 2, 3].map((k) => {
            const ph = mod(f * 0.02 + k * 0.25, 1);
            return (
              <div
                key={k}
                style={{
                  position: "absolute",
                  left: -470,
                  top: -170,
                  width: 940,
                  height: 340,
                  borderRadius: 40,
                  border: `6px solid ${C.cobalt}`,
                  boxShadow: `0 0 50px ${C.cobalt}`,
                  transform: `translate3d(0px,-140px,${-120 - ph * 1100}px) scale(${1 + ph * 0.5})`,
                  opacity: pa.alpha * amp * (1 - ph) * 0.9,
                  filter: `blur(${ph * 6}px)`,
                }}
              />
            );
          })}
          <Box
            x={0}
            y={-140}
            z={interpolate(amp, [0, 1], [-1500, -40])}
            w={740}
            h={230}
            d={90}
            rx={(1 - amp) * -60}
            pal={PAL.cobalt}
            alpha={pa.alpha * clamp01(amp * 2)}
            edge={`inset 0 0 0 3px ${C.white}`}
          >
            <Txt size={96}>УСИЛИТЕЛЬ</Txt>
          </Box>
          <FloorGlow x={0} z={100} r={600} alpha={pa.alpha * amp} />
        </G>
      )}

      {pb.on && (
        <G z={pb.z} ry={Math.sin(f / 70) * 10}>
          <Label y={-660} alpha={pb.alpha * pop(f, T(18.76))} size={78} color={C.whiteSide}>
            ТВОЁ ПОНИМАНИЕ
          </Label>
          <Box
            x={0}
            y={-420}
            z={0}
            w={240}
            h={240}
            d={120}
            ry={f * 0.8}
            s={pop(f, T(18.76) + 6, { damping: 9 })}
            pal={PAL.white}
            alpha={pb.alpha}
            wrap
          >
            <Txt size={200} color={C.black}>
              0
            </Txt>
          </Box>
          {SKILLS.map((k, i) => {
            const p = pop(f, T(k.at), { damping: 11 });
            const y = interpolate(p, [0, 1], [-1300, FLOOR - 140]);
            return (
              <React.Fragment key={i}>
                <Shadow x={k.x + 30} z={k.z + 30} w={440} d={360} alpha={pb.alpha * clamp01(p)} />
                <Box
                  x={k.x}
                  y={Math.min(y, FLOOR - 140)}
                  z={k.z}
                  w={280}
                  h={280}
                  d={280}
                  ry={-14 + i * 14}
                  pal={PAL.slate}
                  alpha={pb.alpha * clamp01(p * 2)}
                  edge="inset 0 0 0 2px rgba(255,255,255,0.18)"
                >
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
                    <Txt size={k.fs}>{k.t}</Txt>
                    <Txt size={110} color={C.cobalt}>
                      0
                    </Txt>
                  </div>
                </Box>
              </React.Fragment>
            );
          })}
        </G>
      )}

      {pc.on && (
        <G z={pc.z} ry={Math.sin(f / 60) * 9} rx={-4}>
          <Label y={-640} alpha={pc.alpha * pop(f, T(23.18))} size={96}>
            НЕЙРОСЕТЬ
          </Label>
          <Label y={-520} alpha={pc.alpha * pop(f, T(24.12))} size={70} color={C.cobalt}>
            УМНОЖИТ ТВОЙ НОЛЬ
          </Label>
          {(() => {
            const gap = 24;
            const total = EQ.reduce((a, e) => a + e.w, 0) + gap * (EQ.length - 1);
            let cx = -total / 2;
            return EQ.map((e, i) => {
              const x = cx + e.w / 2;
              cx += e.w + gap;
              const p = pop(f, T(e.at) - 3, { damping: 12, stiffness: 190 });
              const z = interpolate(p, [0, 1], [-1500, e.big ? 140 : 0]);
              const s = e.big ? 1 + Math.max(0, 1 - (f - T(e.at)) / 25) * 0.35 * (f >= T(e.at) ? 1 : 0) : 1;
              return (
                <React.Fragment key={i}>
                  <Shadow x={x + 20} z={z + 120} w={e.w * 1.8} d={220} alpha={pc.alpha * clamp01(p)} />
                  <Box
                    x={x}
                    y={-120}
                    z={z}
                    w={e.w}
                    h={190}
                    d={150}
                    rx={(1 - p) * 80 - 8}
                    ry={e.big ? Math.sin(f / 20) * 6 : 0}
                    s={s}
                    pal={e.pal}
                    alpha={pc.alpha * clamp01(p * 2)}
                    edge={e.big ? `inset 0 0 0 3px ${C.white}` : undefined}
                  >
                    <Txt size={e.t.length > 2 ? 92 : 140} color={e.c}>
                      {e.t}
                    </Txt>
                  </Box>
                </React.Fragment>
              );
            });
          })()}
          <FloorGlow
            x={0}
            z={120}
            r={150 + finalP * 650}
            ring
            alpha={pc.alpha * finalP * (1 - clamp01((f - T(26.04)) / 30))}
          />
        </G>
      )}
    </G>
  );
};

// =========================================================================
// SCENE 4 — 1 РАБОЧАЯ СВЯЗКА = 10X БЫСТРЕЕ (3D race)
// =========================================================================
const NODES = [
  { t: "ПРОДУКТ", x: -330, z: -160, at: 28.1, fs: 40 },
  { t: "ПРОДАЖИ", x: 0, z: 140, at: 28.4, fs: 40 },
  { t: "АВТОМА-\nТИЗАЦИЯ", x: 330, z: -160, at: 28.7, fs: 34 },
];

const Scene4: React.FC<{ f: number }> = ({ f }) => {
  const sc = win(f, T(26.6), T(35.88));
  if (!sc.on) return null;

  const pa = win(f, T(26.6), T(31.62));
  const linked = interpolate(f, [T(30.58), T(30.9)], [0, 1], CL);
  const nodePal = mixPal(PAL.slate, PAL.cobalt, linked);
  const head = pop(f, T(30.02), { damping: 12 });

  const pb = win(f, T(31.62), T(35.88), 16, 10);
  const r0 = T(31.62);
  const youZ = interpolate(f, [r0, T(32.04), T(34.4)], [-2300, -2200, 120], {
    ...CL,
    easing: Easing.in(Easing.quad),
  });
  const themZ = interpolate(f, [r0, T(35.88)], [-2300, -2050], CL);
  const tenX = pop(f, T(33.16), { damping: 10 });

  return (
    <G z={sc.z}>
      {pa.on && (
        <G z={pa.z} ry={Math.sin(f / 70) * 16} rx={-6}>
          <Label y={-680} alpha={pa.alpha * pop(f, T(27.26))} size={74} color={C.whiteSide}>
            РАЗБЕРИСЬ В БАЗЕ
          </Label>
          {NODES.map((n, i) => {
            const p = pop(f, T(n.at), { damping: 11 });
            return (
              <React.Fragment key={i}>
                <Shadow x={n.x + 30} z={n.z + 30} w={380} d={320} alpha={pa.alpha * clamp01(p)} />
                <Box
                  x={n.x}
                  y={interpolate(p, [0, 1], [-1300, -20])}
                  z={n.z}
                  w={230}
                  h={230}
                  d={230}
                  ry={f * 0.3 + i * 20}
                  pal={nodePal}
                  alpha={pa.alpha * clamp01(p * 2)}
                  edge={`inset 0 0 0 2px rgba(255,255,255,${0.2 + linked * 0.7})`}
                  wrap
                >
                  <Txt size={n.fs}>{n.t}</Txt>
                </Box>
              </React.Fragment>
            );
          })}
          {[0, 1].map((k) => {
            const a = NODES[k];
            const b = NODES[k + 1];
            const dx = b.x - a.x;
            const dz = b.z - a.z;
            const len = Math.hypot(dx, dz);
            const g = interpolate(f, [T(29.14) + k * 28, T(29.14) + k * 28 + 20], [0, 1], {
              ...CL,
              easing: Easing.out(Easing.cubic),
            });
            return (
              <Box
                key={k}
                x={(a.x + b.x) / 2}
                y={-20}
                z={(a.z + b.z) / 2}
                w={Math.max(1, len * g)}
                h={18}
                d={18}
                ry={(Math.atan2(-dz, dx) * 180) / Math.PI}
                pal={PAL.cobalt}
                alpha={pa.alpha * (g > 0 ? 1 : 0)}
                edge={`0 0 30px ${C.cobalt}`}
              />
            );
          })}
          <Box
            x={0}
            y={-470}
            z={interpolate(head, [0, 1], [-1400, 100])}
            w={900}
            h={150}
            d={60}
            rx={(1 - head) * -60}
            pal={PAL.white}
            alpha={pa.alpha * clamp01(head * 2)}
          >
            <Txt size={86} color={C.black}>
              <span style={{ color: C.cobalt }}>1</span> РАБОЧАЯ СВЯЗКА
            </Txt>
          </Box>
          <FloorGlow x={0} z={0} r={700} alpha={pa.alpha * linked} />
        </G>
      )}

      {pb.on && (
        <G z={pb.z} ry={-12 + Math.sin(f / 90) * 4} rx={-4}>
          {/* lanes */}
          {[
            { x: -230, c: "rgba(30,41,59,0.9)", speed: 2 },
            { x: 230, c: "rgba(37,99,235,0.35)", speed: 26 },
          ].map((l, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                left: -150,
                top: -1900,
                width: 300,
                height: 3800,
                transform: `translate3d(${l.x}px,${FLOOR - 2}px,-1300px) rotateX(90deg)`,
                background: l.c,
                boxShadow: i === 1 ? `0 0 40px ${C.cobalt}` : undefined,
                opacity: pb.alpha,
                backgroundImage: `repeating-linear-gradient(0deg, transparent 0 120px, rgba(255,255,255,0.35) 120px 150px)`,
                backgroundPosition: `0 ${-(f - r0) * l.speed}px`,
              }}
            />
          ))}
          {/* speed streaks */}
          {new Array(8).fill(0).map((_, i) => {
            const z = -3000 + mod((f - r0) * 70 + i * 450, 3600);
            return (
              <Box
                key={i}
                x={230 + (mod(i, 2) === 0 ? -170 : 170)}
                y={FLOOR - 60 - mod(i * 37, 120)}
                z={z}
                w={6}
                h={6}
                d={260}
                pal={PAL.white}
                alpha={pb.alpha * 0.7 * clamp01((f - T(32.04)) / 20)}
                blur={dof(z, -200)}
              />
            );
          })}
          {/* racers */}
          {[
            { x: -230, z: themZ, pal: PAL.slate, t: "КОНКУРЕНТ", fs: 34, tag: "1X", tagC: C.whiteSide },
            { x: 230, z: youZ, pal: PAL.cobalt, t: "ТЫ + ИИ", fs: 46, tag: "10X", tagC: C.cobalt },
          ].map((r, i) => (
            <React.Fragment key={i}>
              <Shadow x={r.x} z={r.z + 20} w={360} d={300} alpha={pb.alpha} />
              <Box
                x={r.x}
                y={FLOOR - 115}
                z={r.z}
                w={230}
                h={230}
                d={230}
                pal={r.pal}
                alpha={pb.alpha}
                blur={dof(r.z, 0) * 0.6}
                edge={i === 1 ? `inset 0 0 0 3px ${C.white}` : undefined}
              >
                <Txt size={r.fs}>{r.t}</Txt>
              </Box>
              <Label
                x={r.x}
                y={FLOOR - 330}
                z={r.z}
                size={i === 1 ? 92 : 70}
                color={r.tagC}
                alpha={pb.alpha * (i === 1 ? tenX : 1)}
                blur={dof(r.z, 0) * 0.6}
              >
                {r.tag}
              </Label>
            </React.Fragment>
          ))}
          <Label y={-650} z={-60} size={112} color={C.cobalt} alpha={pb.alpha * tenX} s={0.4 + 0.6 * tenX}>
            10X БЫСТРЕЕ
          </Label>
          <Label y={-520} z={0} size={62} alpha={pb.alpha * pop(f, T(34.24))}>
            ЛЮБОГО КОНКУРЕНТА
          </Label>
        </G>
      )}
    </G>
  );
};

// =========================================================================
// SCENE 5 — ПОЙМИ СИСТЕМУ → CTA НАПИШИ «БАЗА»
// =========================================================================
const GRID = new Array(9).fill(0).map((_, i) => ({
  gx: (mod(i, 3) - 1) * 150,
  gy: (Math.floor(i / 3) - 1) * 150,
  sx: (random(`gx${i}`) - 0.5) * 1800,
  sy: -800 + random(`gy${i}`) * 900,
  sz: -2000 + random(`gz${i}`) * 1200,
  r: (random(`gr${i}`) - 0.5) * 360,
}));

const Scene5: React.FC<{ f: number }> = ({ f }) => {
  const sc = win(f, T(35.88), TOTAL + 30);
  if (!sc.on) return null;

  const pa = win(f, T(35.88), T(39.12));
  const strike = pop(f, T(37.0), { damping: 14, stiffness: 200 });
  const sys = pop(f, T(37.34), { damping: 16, stiffness: 90 });
  const sysHead = pop(f, T(38.02), { damping: 12 });

  const pb = win(f, T(39.12), TOTAL + 30);
  const bubble = pop(f, T(39.74), { damping: 10, stiffness: 140 });
  const last = pop(f, T(41.42), { damping: 12 });

  return (
    <G z={sc.z}>
      {pa.on && (
        <G z={pa.z} ry={Math.sin(f / 80) * 10}>
          <Label y={-680} alpha={pa.alpha * pop(f, T(35.88))} size={80} color={C.whiteSide}>
            ПЕРЕСТАНЬ ИСКАТЬ
          </Label>
          <Box
            x={0}
            y={-530}
            z={0}
            w={620}
            h={150}
            d={70}
            rx={-6}
            s={pop(f, T(36.72))}
            pal={PAL.slate}
            alpha={pa.alpha}
            blur={sysHead * 3}
          >
            <Txt size={100}>ХАЛЯВУ</Txt>
          </Box>
          <Box
            x={0}
            y={-530}
            z={50}
            w={720 * strike}
            h={22}
            d={20}
            rz={-5}
            pal={PAL.white}
            alpha={pa.alpha * (strike > 0.01 ? 1 : 0)}
          />
          <Box
            x={0}
            y={-330}
            z={interpolate(sysHead, [0, 1], [-1300, 0])}
            w={760}
            h={150}
            d={70}
            rx={(1 - sysHead) * -60}
            pal={PAL.cobalt}
            alpha={pa.alpha * clamp01(sysHead * 2)}
            edge={`inset 0 0 0 3px ${C.white}`}
          >
            <Txt size={80}>ПОЙМИ СИСТЕМУ</Txt>
          </Box>
          {GRID.map((g, i) => {
            const turn = interpolate(f, [T(38.02) + i * 3, T(38.02) + i * 3 + 10], [0, 1], CL);
            return (
              <Box
                key={i}
                x={interpolate(sys, [0, 1], [g.sx, g.gx])}
                y={interpolate(sys, [0, 1], [g.sy, 60 + g.gy])}
                z={interpolate(sys, [0, 1], [g.sz, -80])}
                w={130}
                h={130}
                d={130}
                rx={g.r * (1 - sys) - 12}
                ry={g.r * (1 - sys) + 25 + Math.sin(f / 40) * 6}
                pal={mixPal(PAL.slate, PAL.cobalt, turn)}
                alpha={pa.alpha * clamp01(sys * 3)}
                blur={(1 - sys) * 6}
              />
            );
          })}
          <Shadow x={30} z={-40} w={700} d={500} alpha={pa.alpha * sys} />
        </G>
      )}

      {pb.on && (
        <G z={pb.z} ry={Math.sin(f / 70) * 6}>
          <Label y={-700} alpha={pb.alpha * pop(f, T(39.12))} s={0.5 + 0.5 * pop(f, T(39.12))} size={124}>
            НАПИШИ
          </Label>
          <Shadow x={40} z={60} w={1000} d={420} alpha={pb.alpha * bubble} />
          {[0, 1, 2].map((k) => {
            const ph = mod((f - T(39.74)) / 70 + k / 3, 1);
            return (
              <FloorGlow
                key={k}
                x={0}
                z={60}
                r={200 + ph * 600}
                ring
                alpha={pb.alpha * bubble * (1 - ph) * 0.8}
              />
            );
          })}
          <G z={100} ry={Math.sin(f / 50) * 14} rx={-6 + Math.sin(f / 70) * 4}>
            <Box
              x={0}
              y={interpolate(bubble, [0, 1], [-1400, -330])}
              z={0}
              w={720}
              h={300}
              d={120}
              pal={PAL.cobalt}
              alpha={pb.alpha * clamp01(bubble * 2)}
              edge={`inset 0 0 0 4px ${C.white}`}
            >
              <Txt size={200}>«БАЗА»</Txt>
            </Box>
            <Box
              x={-230}
              y={interpolate(bubble, [0, 1], [-1400, -330]) + 165}
              z={0}
              w={90}
              h={90}
              d={110}
              rz={45}
              pal={PAL.cobalt}
              alpha={pb.alpha * clamp01(bubble * 2)}
            />
          </G>
          <Label
            y={-60}
            z={120}
            alpha={pb.alpha * pop(f, T(40.28))}
            s={0.6 + 0.4 * pop(f, T(40.28))}
            size={62}
            bg={C.slate}
            border={`2px solid rgba(255,255,255,0.18)`}
          >
            В КОММЕНТАРИЯХ
          </Label>
          <Box
            x={0}
            y={150}
            z={interpolate(last, [0, 1], [-1200, 80])}
            w={880}
            h={130}
            d={60}
            rx={(1 - last) * -60}
            pal={PAL.white}
            alpha={pb.alpha * clamp01(last * 2)}
          >
            <Txt size={64} color={C.black}>
              СКИНУ, С ЧЕГО НАЧАТЬ <span style={{ color: C.cobalt }}>→</span>
            </Txt>
          </Box>
        </G>
      )}
    </G>
  );
};

// =========================================================================
// CAMERA
// =========================================================================
const PUNCH = [0.64, 2.72, 5.52, 11.02, 13.9, 17.1, 21.58, 26.04, 30.58, 33.16, 38.02, 39.12, 39.74];
const CUTS = [9.1, 14.58, 18.14, 23.1, 26.6, 31.62, 35.88, 39.12];

const camera = (f: number) => {
  let punch = 0;
  PUNCH.forEach((s) => {
    const t = f - T(s);
    if (t < 0) return;
    punch += t < 6 ? t / 6 : Math.exp(-(t - 6) / 16);
  });
  punch = Math.min(punch, 1.3);
  const z = 100 * punch + Math.sin(f / 110) * 30;
  const rx = -8 + Math.sin(f / 170) * 3;
  const ry = Math.sin(f / 130) * 6;
  return { z, rx, ry };
};

// =========================================================================
// SUBTITLES — white / cobalt pills, 24px gap
// =========================================================================
const Subtitles: React.FC<{ f: number }> = ({ f }) => {
  const t = f / FPS;
  let idx = -1;
  for (let i = 0; i < CHUNKS.length; i++) if (CHUNKS[i].s - 0.05 <= t) idx = i;
  if (idx < 0) return null;
  const ch = CHUNKS[idx];
  const next = CHUNKS[idx + 1];
  if (t > ch.e + 0.6 && (!next || t < next.s - 0.05)) return null;
  const appear = interpolate(f, [T(ch.s) - 3, T(ch.s) + 6], [0, 1], CL);

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 180,
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        gap: 24,
        padding: "0 60px",
        opacity: appear,
        transform: `translateY(${(1 - appear) * 30}px)`,
      }}
    >
      {ch.words.map((w, i) => {
        const active = t >= w.s && t < w.e + 0.08;
        const spoken = t >= w.e + 0.08;
        const pp = active ? pop(f, T(w.s), { damping: 12, stiffness: 260 }) : 0;
        return (
          <div
            key={i}
            style={{
              fontFamily: FONT,
              fontWeight: 800,
              fontSize: 52,
              lineHeight: 1,
              textTransform: "uppercase",
              padding: "16px 28px",
              borderRadius: 999,
              background: active ? C.cobalt : spoken ? C.white : "rgba(30,41,59,0.88)",
              color: active ? C.white : spoken ? C.black : "rgba(255,255,255,0.6)",
              border: active || spoken ? "2px solid transparent" : "2px solid rgba(255,255,255,0.14)",
              boxShadow: active ? "0 12px 34px rgba(37,99,235,0.55)" : "0 10px 24px rgba(0,0,0,0.6)",
              transform: `scale(${1 + pp * 0.08})`,
              whiteSpace: "nowrap",
            }}
          >
            {w.w}
          </div>
        );
      })}
    </div>
  );
};

// =========================================================================
// SCENE 1 WRAPPER — 3D WALL STREET TRADING FLOOR (0 – 9.1s)
// The whole 3D stage (Floor + Ambient + Scene1) is rendered INSIDE a giant
// 1080x1920 jumbo screen. 7.3 → 9.1s the hall camera flies into the screen
// until it lands at identity (screen == frame, 1:1), so the cut to Scene 2
// is pixel-continuous.
// =========================================================================
const WS_END = T(9.1);
const FLY_A = T(7.3);
const HALL_FLOOR = 1260; // polished floor plane (screen bottom = 960)
const CEIL = -2300;
const MONEY = { green: "#22C55E", red: "#EF4444", bill: "#A7C79A", billDark: "#4F7A4A", gold: "#E8C35A" };

const hallCam = (f: number) => {
  const fly = interpolate(f, [FLY_A, WS_END - 1], [0, 1], { ...CL, easing: Easing.inOut(Easing.cubic) });
  const intro = interpolate(f, [0, T(3.2)], [0, 1], { ...CL, easing: Easing.out(Easing.cubic) });
  let punch = 0;
  [0.64, 2.72, 5.52].forEach((s) => {
    const t = f - T(s);
    if (t < 0) return;
    punch += t < 6 ? t / 6 : Math.exp(-(t - 6) / 18);
  });
  const z = interpolate(f, [0, FLY_A], [-2600, -1450], { ...CL, easing: Easing.out(Easing.quad) }) + Math.min(punch, 1.2) * 90;
  const y = interpolate(intro, [0, 1], [420, 140]) + Math.sin(f / 95) * 18;
  const rx = interpolate(intro, [0, 1], [10, 3.5]) + Math.sin(f / 150) * 1.2;
  const ry = interpolate(intro, [0, 1], [-22, 0]) + Math.sin(f / 120) * 5;
  const k = 1 - fly;
  return { fly, z: z * k, y: y * k, rx: rx * k, ry: ry * k };
};

const MARBLE = {
  front:
    "linear-gradient(118deg, rgba(0,0,0,0) 30%, rgba(120,120,135,0.35) 31%, rgba(0,0,0,0) 33%), linear-gradient(62deg, rgba(0,0,0,0) 55%, rgba(110,110,125,0.3) 56%, rgba(0,0,0,0) 58%), linear-gradient(90deg, #BFC3CC 0%, #F4F4F2 35%, #E6E4DF 60%, #9EA3AE 100%)",
  side:
    "linear-gradient(104deg, rgba(0,0,0,0) 40%, rgba(90,90,100,0.35) 41%, rgba(0,0,0,0) 43%), linear-gradient(90deg, #6B7180 0%, #A9ADB6 50%, #5A606C 100%)",
  top: "#D9D7D2",
} as Palette;

const COLS = [
  { x: -820, z: -350 },
  { x: 820, z: -350 },
  { x: -900, z: 450 },
  { x: 900, z: 450 },
  { x: -980, z: 1250 },
  { x: 980, z: 1250 },
  { x: -1500, z: -1300 },
  { x: 1500, z: -1300 },
  { x: -560, z: -1900 },
  { x: 560, z: -1900 },
];

const TICKS = [
  ["NVDA", 1, "+4.82%"], ["AAPL", 1, "+1.12%"], ["TSLA", 0, "−2.31%"], ["MSFT", 1, "+0.94%"],
  ["AMZN", 1, "+2.07%"], ["META", 0, "−0.66%"], ["GOOG", 1, "+1.58%"], ["AMD", 1, "+3.40%"],
  ["INTC", 0, "−1.89%"], ["IBM", 1, "+0.41%"], ["ORCL", 1, "+2.66%"], ["NFLX", 0, "−0.72%"],
  ["S&P500", 1, "+0.83%"], ["DOW", 1, "+0.52%"], ["NASDAQ", 1, "+1.37%"], ["BTC", 0, "−3.04%"],
] as const;

const SEG = 380; // ring panel width == one ticker item width
const RING_N = 24;
const RING_R = (SEG * RING_N) / (2 * Math.PI);

const TickerItem: React.FC<{ k: number; x: number; h: number }> = ({ k, x, h }) => {
  const [sym, up, pct] = TICKS[mod(k, TICKS.length)];
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: 0,
        width: SEG,
        height: h,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 14,
        fontFamily: "'SF Mono', Menlo, monospace",
        fontWeight: 800,
        fontSize: h * 0.5,
        color: up ? MONEY.green : MONEY.red,
        textShadow: `0 0 14px ${up ? MONEY.green : MONEY.red}`,
        whiteSpace: "nowrap",
      }}
    >
      <span style={{ color: C.white, textShadow: "0 0 10px rgba(255,255,255,0.6)" }}>{sym}</span>
      <span>{up ? "▲" : "▼"}</span>
      <span>{pct}</span>
    </div>
  );
};

/** wrap-around LED ticker ribbon: RING_N inward-facing panels, one continuous scrolling strip */
const TickerRing: React.FC<{ f: number; y: number; speed: number; h: number; alpha: number; seed: number }> = ({
  f,
  y,
  speed,
  h,
  alpha,
  seed,
}) => {
  const period = SEG * RING_N;
  const scroll = mod(f * speed, period);
  return (
    <>
      {new Array(RING_N).fill(0).map((_, i) => {
        const th = 180 - (i * 360) / RING_N;
        const rad = (th * Math.PI) / 180;
        const x0 = i * SEG;
        const k0 = Math.floor((x0 + scroll) / SEG);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: -SEG / 2 - 1,
              top: -h / 2,
              width: SEG + 2,
              height: h,
              transform: `translate3d(${RING_R * Math.sin(rad)}px,${y}px,${RING_R * Math.cos(rad)}px) rotateY(${th + 180}deg)`,
              backfaceVisibility: "hidden",
              overflow: "hidden",
              background: "linear-gradient(180deg, #05070D 0%, #0B1220 50%, #05070D 100%)",
              borderTop: `3px solid ${C.cobalt}`,
              borderBottom: `3px solid ${C.cobalt}`,
              opacity: alpha,
            }}
          >
            {[0, 1].map((j) => (
              <TickerItem key={j} k={k0 + j + seed} x={(k0 + j) * SEG - scroll - x0} h={h} />
            ))}
          </div>
        );
      })}
    </>
  );
};

/** wall of small trading monitors behind the jumbo screen */
const MONITORS = new Array(48).fill(0).map((_, i) => ({
  c: mod(i, 12),
  r: Math.floor(i / 12),
  up: random(`mu${i}`) > 0.4,
  ph: random(`mp${i}`) * 100,
}));

const BILLS = new Array(64).fill(0).map((_, i) => ({
  x: (random(`bx${i}`) - 0.5) * 2600,
  z: -1800 + random(`bz${i}`) * 3600,
  y0: -2400 + random(`by${i}`) * 900,
  spawn: (random(`bs${i}`) * 13 - 6) * FPS, // some already mid-air at frame 0
  vy: 300 + random(`bv${i}`) * 180,
  ph: random(`bp${i}`) * Math.PI * 2,
  rz: random(`br${i}`) * 360,
}));
const FLOOR_BILLS = new Array(26).fill(0).map((_, i) => ({
  x: (random(`fx${i}`) - 0.5) * 2200,
  z: -900 + random(`fz${i}`) * 2400,
  rz: random(`fr${i}`) * 360,
}));

const Bill: React.FC<{ t: string; alpha: number; blur: number }> = ({ t, alpha, blur }) => (
  <div
    style={{
      position: "absolute",
      left: -85,
      top: -36,
      width: 170,
      height: 72,
      transform: t,
      background: `radial-gradient(ellipse at center, #DDEBD3 0%, ${MONEY.bill} 55%, #7FA272 100%)`,
      border: `4px solid ${MONEY.billDark}`,
      borderRadius: 4,
      boxShadow: "inset 0 0 0 3px #CFE3C4",
      opacity: alpha,
      filter: blur > 0.3 ? `blur(${blur}px)` : undefined,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0 12px",
      boxSizing: "border-box",
      fontFamily: FONT,
      fontWeight: 900,
      fontSize: 26,
      color: MONEY.billDark,
    }}
  >
    <span>100</span>
    <span
      style={{
        width: 38,
        height: 38,
        borderRadius: "50%",
        border: `3px solid ${MONEY.billDark}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 24,
      }}
    >
      $
    </span>
    <span>100</span>
  </div>
);

const TradingFloor: React.FC<{ f: number; children: React.ReactNode }> = ({ f, children }) => {
  const cam = hallCam(f);
  const eyeZ = 1200 - cam.z; // world-space z of the eye
  const hall = 1 - interpolate(cam.fly, [0.82, 0.97], [0, 1], CL);
  const screenFx = 1 - interpolate(cam.fly, [0.45, 0.93], [0, 1], CL);
  // fade anything about to pass through the lens, DOF blur by distance from the screen plane
  const near = (z: number) => interpolate(eyeZ - z, [260, 700], [0, 1], CL);
  const focusBlur = (z: number) => Math.min(9, Math.max(0, (Math.abs(z) - 450) / 200));
  const glowPulse = 0.85 + Math.sin(f / 12) * 0.15;

  return (
    <AbsoluteFill style={{ perspective: "1200px", perspectiveOrigin: "50% 45%" }}>
      {/* hall atmosphere behind everything */}
      <AbsoluteFill
        style={{
          opacity: hall,
          background:
            "radial-gradient(ellipse at 50% 38%, rgba(37,99,235,0.28) 0%, rgba(15,23,42,0.6) 35%, #000 75%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: W / 2,
          top: H / 2,
          width: 0,
          height: 0,
          transformStyle: "preserve-3d",
          transform: `translate3d(0px,${cam.y}px,${cam.z}px) rotateX(${cam.rx}deg) rotateY(${cam.ry}deg)`,
        }}
      >
        {hall > 0.001 && (
          <>
            {/* polished marble floor + screen reflection */}
            <div
              style={{
                position: "absolute",
                left: -3200,
                top: -2800,
                width: 6400,
                height: 5600,
                transform: `translate3d(0px,${HALL_FLOOR}px,0px) rotateX(90deg)`,
                opacity: hall,
                background:
                  "radial-gradient(ellipse at 50% 52%, #1E293B 0%, #0B1120 30%, #000 62%)",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  backgroundImage:
                    "linear-gradient(rgba(232,195,90,0.18) 3px, transparent 3px), linear-gradient(90deg, rgba(232,195,90,0.18) 3px, transparent 3px)",
                  backgroundSize: "400px 400px",
                  backgroundPosition: "0px 200px",
                  WebkitMaskImage: "radial-gradient(ellipse at 50% 55%, black 0%, transparent 55%)",
                  maskImage: "radial-gradient(ellipse at 50% 55%, black 0%, transparent 55%)",
                }}
              />
              {/* mirror reflection of the jumbo screen */}
              <div
                style={{
                  position: "absolute",
                  left: 3200 - 600,
                  top: 2800 + 40,
                  width: 1200,
                  height: 1700,
                  background:
                    "linear-gradient(180deg, rgba(96,165,250,0.55) 0%, rgba(37,99,235,0.25) 35%, rgba(37,99,235,0) 100%)",
                  filter: "blur(30px)",
                  opacity: glowPulse,
                }}
              />
            </div>

            {/* back wall: grid of trading monitors */}
            {MONITORS.map((m, i) => {
              const v = (Math.sin(f / 9 + m.ph) * 0.5 + 0.5) * 100;
              return (
                <div
                  key={i}
                  style={{
                    position: "absolute",
                    left: -150,
                    top: -90,
                    width: 300,
                    height: 180,
                    transform: `translate3d(${(m.c - 5.5) * 330}px,${-1700 + m.r * 210}px,-2400px)`,
                    background: "#03060C",
                    border: "4px solid #1E293B",
                    opacity: hall * 0.85,
                    filter: "blur(4px)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: "Menlo, monospace",
                    fontWeight: 800,
                    fontSize: 54,
                    color: m.up ? MONEY.green : MONEY.red,
                    textShadow: `0 0 18px ${m.up ? MONEY.green : MONEY.red}`,
                  }}
                >
                  {m.up ? "▲" : "▼"}
                  {(v + 10).toFixed(1)}
                </div>
              );
            })}

            {/* volumetric light beams from the ceiling */}
            {[-700, -250, 250, 700].map((x, i) => (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: -260,
                  top: 0,
                  width: 520,
                  height: 3400,
                  transform: `translate3d(${x}px,${CEIL}px,${-900 + (i % 2) * 300}px)`,
                  background:
                    "linear-gradient(180deg, rgba(255,240,200,0.32) 0%, rgba(255,240,200,0.08) 55%, rgba(255,240,200,0) 100%)",
                  clipPath: "polygon(42% 0%, 58% 0%, 100% 100%, 0% 100%)",
                  filter: "blur(18px)",
                  opacity: hall * (0.7 + Math.sin(f / 40 + i) * 0.15),
                }}
              />
            ))}

            {/* towering marble columns */}
            {COLS.map((c, i) => {
              const a = hall * near(c.z + 120);
              if (a <= 0.001) return null;
              const blur = Math.min(7, focusBlur(c.z) * 0.7);
              const h = HALL_FLOOR - CEIL;
              return (
                <React.Fragment key={i}>
                  <Box x={c.x} y={CEIL + h / 2 + 60} z={c.z} w={200} h={h - 220} d={200} pal={MARBLE} alpha={a} blur={blur} />
                  <Box x={c.x} y={HALL_FLOOR - 55} z={c.z} w={290} h={110} d={290} pal={MARBLE} alpha={a} blur={blur} />
                  <Box
                    x={c.x}
                    y={CEIL + 50}
                    z={c.z}
                    w={310}
                    h={100}
                    d={310}
                    pal={{ front: `linear-gradient(180deg, ${MONEY.gold}, #8A6A1E)`, side: "#7A5C17", top: MONEY.gold }}
                    alpha={a}
                    blur={blur}
                  />
                </React.Fragment>
              );
            })}

            {/* wrap-around ticker ribbons */}
            <TickerRing f={f} y={-1180} speed={4.2} h={110} alpha={hall} seed={0} />
            <TickerRing f={f} y={-1430} speed={-2.6} h={80} alpha={hall * 0.8} seed={7} />

            {/* jumbo screen chassis + pedestal + header */}
            <Box x={0} y={0} z={-70} w={1200} h={2050} d={100} pal={{ front: "#0A0F1A", side: "#111827", top: "#1F2937" }} alpha={hall} edge={`inset 0 0 0 4px ${C.cobalt}`} />
            <Box x={0} y={(1025 + HALL_FLOOR) / 2} z={-70} w={520} h={HALL_FLOOR - 1025} d={260} pal={PAL.slate} alpha={hall} />
            <Shadow x={0} z={-40} w={1400} d={700} alpha={hall} />
            <div
              style={{
                position: "absolute",
                left: -600,
                top: -1110,
                width: 1200,
                height: 120,
                transform: "translateZ(-18px)",
                background: "linear-gradient(180deg, #111827, #05070D)",
                borderTop: `4px solid ${MONEY.gold}`,
                borderBottom: `4px solid ${MONEY.gold}`,
                opacity: hall,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 28,
                fontFamily: FONT,
                fontWeight: 900,
                fontSize: 62,
                letterSpacing: 8,
                color: MONEY.gold,
                textShadow: `0 0 24px rgba(232,195,90,0.7)`,
              }}
            >
              <span>★ WALL ST. EXCHANGE ★</span>
              <span
                style={{
                  fontSize: 34,
                  letterSpacing: 2,
                  color: C.white,
                  background: MONEY.red,
                  padding: "6px 16px",
                  borderRadius: 8,
                  opacity: Math.sin(f / 10) > -0.3 ? 1 : 0.35,
                  textShadow: "none",
                }}
              >
                ● LIVE
              </span>
            </div>
            {/* straight LED ticker band under the screen */}
            <div
              style={{
                position: "absolute",
                left: -600,
                top: 975,
                width: 1200,
                height: 70,
                transform: "translateZ(-18px)",
                overflow: "hidden",
                background: "#03060C",
                opacity: hall,
              }}
            >
              {new Array(5).fill(0).map((_, j) => {
                const s = mod(f * 5, SEG);
                const k = Math.floor((f * 5) / SEG);
                return <TickerItem key={j} k={k + j + 3} x={j * SEG - s} h={70} />;
              })}
            </div>
            {/* cobalt halo around the screen */}
            <div
              style={{
                position: "absolute",
                left: -640,
                top: -1060,
                width: 1280,
                height: 2120,
                transform: "translateZ(-130px)",
                boxShadow: `0 0 220px 60px rgba(37,99,235,${0.45 * glowPulse})`,
                opacity: hall,
              }}
            />
          </>
        )}

        {/* THE JUMBO SCREEN — full 3D stage rendered inside, 1:1 with the frame */}
        <div
          style={{
            position: "absolute",
            left: -W / 2,
            top: -H / 2,
            width: W,
            height: H,
            overflow: "hidden",
            background: C.black,
          }}
        >
          {children}
          {screenFx > 0.001 && (
            <AbsoluteFill style={{ opacity: screenFx, pointerEvents: "none" }}>
              <AbsoluteFill
                style={{
                  backgroundImage:
                    "repeating-linear-gradient(0deg, rgba(0,0,0,0.28) 0px, rgba(0,0,0,0.28) 2px, transparent 2px, transparent 6px), repeating-linear-gradient(90deg, rgba(0,0,0,0.18) 0px, rgba(0,0,0,0.18) 2px, transparent 2px, transparent 6px)",
                }}
              />
              <AbsoluteFill
                style={{
                  background:
                    "linear-gradient(125deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.02) 32%, rgba(255,255,255,0) 50%)",
                }}
              />
              <AbsoluteFill style={{ boxShadow: "inset 0 0 120px rgba(37,99,235,0.6)" }} />
            </AbsoluteFill>
          )}
        </div>

        {/* dollar bills fluttering down & settling on the polished floor */}
        {hall > 0.001 && (
          <>
            {FLOOR_BILLS.map((b, i) => {
              const a = hall * near(b.z);
              return a <= 0.001 ? null : (
                <Bill
                  key={`fb${i}`}
                  t={`translate3d(${b.x}px,${HALL_FLOOR - 2}px,${b.z}px) rotateX(90deg) rotateZ(${b.rz}deg)`}
                  alpha={a * 0.9}
                  blur={focusBlur(b.z) * 0.6}
                />
              );
            })}
            {BILLS.map((b, i) => {
              const t = (f - b.spawn) / FPS;
              if (t < 0) return null;
              const yFall = b.y0 + b.vy * t;
              const landed = yFall >= HALL_FLOOR - 4;
              const x = b.x + Math.sin(t * 1.6 + b.ph) * 90;
              const a = hall * near(b.z) * clamp01(t * 3);
              if (a <= 0.001) return null;
              const tr = landed
                ? `translate3d(${b.x + Math.sin(((HALL_FLOOR - 4 - b.y0) / b.vy) * 1.6 + b.ph) * 90}px,${HALL_FLOOR - 3}px,${b.z}px) rotateX(90deg) rotateZ(${b.rz}deg)`
                : `translate3d(${x}px,${yFall}px,${b.z}px) rotateY(${Math.sin(t * 1.3 + b.ph) * 50 + b.rz}deg) rotateX(${Math.sin(t * 2.7 + b.ph) * 65}deg) rotateZ(${Math.sin(t * 2.1) * 35}deg)`;
              return <Bill key={`b${i}`} t={tr} alpha={a} blur={focusBlur(b.z)} />;
            })}
          </>
        )}
      </div>
    </AbsoluteFill>
  );
};

// =========================================================================
// ROOT
// =========================================================================
export const WhyNotAiReel: React.FC = () => {
  const f = useCurrentFrame();
  const cam = camera(f);
  const flash = CUTS.filter((s) => s !== 9.1).reduce((a, s) => {
    const d = f - T(s);
    return d >= -2 && d < 12 ? Math.max(a, 1 - Math.abs(d) / 12) : a;
  }, 0);

  // the main 3D stage; during Scene 1 it lives inside the trading-floor jumbo screen
  const stage = (
    <AbsoluteFill style={{ perspective: "1200px", perspectiveOrigin: "50% 42%" }}>
      <div
        style={{
          position: "absolute",
          left: W / 2,
          top: H / 2,
          width: 0,
          height: 0,
          transformStyle: "preserve-3d",
          transform: `translateZ(${cam.z}px) rotateX(${cam.rx}deg) rotateY(${cam.ry}deg)`,
        }}
      >
        <Floor />
        <Ambient f={f} />
        <Scene1 f={f} />
        <Scene2 f={f} />
        <Scene3 f={f} />
        <Scene4 f={f} />
        <Scene5 f={f} />
      </div>
    </AbsoluteFill>
  );

  return (
    <AbsoluteFill style={{ backgroundColor: C.black, overflow: "hidden" }}>
      <Audio src={staticFile("why_not_ai_reel/voice.mp3")} />

      {f < WS_END ? <TradingFloor f={f}>{stage}</TradingFloor> : stage}

      {/* lens: vignette + top/bottom falloff */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 45%, rgba(0,0,0,0.75) 100%), linear-gradient(180deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0) 12%, rgba(0,0,0,0) 72%, rgba(0,0,0,0.85) 100%)",
          pointerEvents: "none",
        }}
      />

      {/* cut flash: cobalt scanline */}
      {flash > 0 && (
        <AbsoluteFill style={{ pointerEvents: "none" }}>
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: H * 0.42 - 3,
              height: 6,
              background: C.cobalt,
              boxShadow: `0 0 60px 20px ${C.cobalt}`,
              opacity: flash,
              transform: `scaleX(${flash})`,
            }}
          />
          <AbsoluteFill style={{ background: C.white, opacity: flash * 0.12 }} />
        </AbsoluteFill>
      )}

      <Subtitles f={f} />
    </AbsoluteFill>
  );
};
