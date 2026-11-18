import * as React from "react";
import type { CSSProperties, ReactNode } from "react";
import { AbsoluteFill, Audio, Easing, interpolate, staticFile, useCurrentFrame } from "remotion";

/*
 * =========================================================================
 * BLUEPRINT ARCHITECT REEL — 1080x1920 @ 60 FPS, 2640 FRAMES (44s)
 * Architectural blueprint style: #0A192F paper, #F8FAFC lines, #38BDF8 grid,
 * #FF6B35 drafting-pencil accent.
 *
 *   01  0.0 –  8.0s : 3D drafting table — blueprint unrolls, wireframe city +
 *                       compass / set-square rise out of the paper, sheet reads
 *                       "ИИ-ОХОТНИК ЗА КЛИЕНТАМИ ЗА 1 ВЕЧЕР".
 *                       6.4 – 8.0s camera flies INTO the sheet (exact 1:1 fill).
 *   02  8.0 – 19.2s : crossed-out "БИРЖИ ФРИЛАНСА: 100 ОТКЛИКОВ ЗА КОПЕЙКИ"
 *                       → "2026: ЧЕРТЁЖ СТРОИТСЯ ОДИН РАЗ"
 *   03 19.2 – 26.0s : MODULE 01 — 3D city map radar scan
 *   04 26.0 – 32.2s : MODULE 02 — X-ray weak spots + custom demo assembly
 *   05 32.2 – 37.5s : MODULE 03 — direct dispatch "ОТПРАВЛЕНО ВЛАДЕЛЬЦУ"
 *   06 37.5 – 44.0s : camera pulls back OUT onto the table — glowing 3D scale
 *                       model "BLUEPRINT READY" + CTA "НАПИШИ ЧЕРТЁЖ"
 *
 * True CSS 3D (preserve-3d) — no opacity/filter on 3D containers.
 * All cyclic indices go through mod().
 * =========================================================================
 */

const FPS = 60;
const W = 1080;
const H = 1920;
const TOTAL = 2640;

const NAVY = "#0A192F";
const NAVY_2 = "#0E2240";
const NAVY_3 = "#13294B";
const WHITE = "#F8FAFC";
const CYAN = "#38BDF8";
const ORANGE = "#FF6B35";
const DIM = "rgba(248,250,252,0.55)";

const IMPACT = 'Impact, "Arial Black", "Helvetica Neue", Arial, sans-serif';
const HEAD = '"Arial Black", "Helvetica Neue", Arial, sans-serif';
const MONO = 'Menlo, "SF Mono", "JetBrains Mono", "Courier New", monospace';

const mod = (n: number, m: number) => ((n % m) + m) % m;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const EASE = Easing.bezier(0.7, 0, 0.2, 1);
const OUT = Easing.bezier(0.16, 1, 0.3, 1);
const BACK = Easing.bezier(0.34, 1.56, 0.64, 1);
const FLY = Easing.bezier(0.6, 0, 0.15, 1);
const s2f = (s: number) => Math.round(s * FPS);
const mix = (a: number, b: number, p: number) => a + (b - a) * p;

/** ramp on GLOBAL seconds */
const rs = (gf: number, a: number, b: number, ease = OUT) =>
  interpolate(gf, [s2f(a), s2f(b)], [0, 1], { ...clamp, easing: ease });

const punchAt = (gf: number, s: number) => {
  const d = gf - s2f(s);
  return d >= 0 && d < 42 ? interpolate(d, [0, 5, 42], [0, 1, 0], { ...clamp, easing: OUT }) : 0;
};

const rnd = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

// Timeline (frames)
const FLY0 = s2f(6.4);
const S2 = s2f(8.0);
const S3 = s2f(19.2);
const S4 = s2f(26.0);
const S5 = s2f(32.2);
const S6 = s2f(37.5);
const BACK1 = s2f(39.4);
const XFADE = 20;

// -------------------------------------------------------------------------
// Words (from public/blueprint_reel/words.json, inlined for strict tsc).
// ASR typos fixed for on-screen text: "фрелансеры"→"фрилансеры",
// "одинаковый ход кликов"→"одинаковых откликов", "Отретий"→"А третий",
// "чертеж"→"чертёж". Timings untouched.
// -------------------------------------------------------------------------
type Word = { word: string; start: number; end: number };

const RAW: [string, number, number][] = [
  ["Как", 0.0, 0.24],
  ["за", 0.24, 0.46],
  ["один", 0.46, 0.7],
  ["вечер", 0.7, 1.08],
  ["собрать", 1.08, 1.44],
  ["и", 1.44, 1.74],
  ["охотника,", 1.74, 2.76],
  ["который", 2.76, 3.06],
  ["сам", 3.06, 3.42],
  ["находит", 3.42, 3.82],
  ["клиентов", 3.82, 4.38],
  ["в", 4.38, 4.56],
  ["любом", 4.56, 4.84],
  ["городе", 4.84, 5.24],
  ["мира,", 5.24, 5.62],
  ["пока", 5.62, 5.78],
  ["ты", 5.78, 5.94],
  ["спишь?", 5.94, 6.5],
  ["Раньше", 7.06, 7.36],
  ["фрилансеры,", 7.36, 8.1],
  ["часами", 8.24, 8.64],
  ["сидели", 8.64, 9.06],
  ["на", 9.06, 9.26],
  ["биржах", 9.26, 9.8],
  ["и", 9.8, 10.2],
  ["вручную", 10.2, 10.68],
  ["отправляли", 10.68, 11.44],
  ["сотни", 11.44, 11.94],
  ["одинаковых", 11.94, 12.56],
  ["откликов", 12.56, 13.06],
  ["за", 13.06, 13.22],
  ["копейки.", 13.22, 13.9],
  ["В", 14.46, 14.7],
  ["2026", 14.7, 15.96],
  ["году", 15.96, 16.5],
  ["ты", 16.5, 16.94],
  ["строишь", 16.94, 17.34],
  ["чертёж", 17.34, 17.78],
  ["один", 17.78, 18.26],
  ["раз.", 18.26, 18.8],
  ["Первый", 19.36, 19.74],
  ["модуль", 19.74, 20.1],
  ["сканирует", 20.1, 20.68],
  ["карты", 20.68, 21.1],
  ["и", 21.1, 21.32],
  ["сайты", 21.32, 21.7],
  ["компании", 21.7, 22.14],
  ["в", 22.14, 22.4],
  ["нужном", 22.4, 22.74],
  ["городе", 22.74, 23.28],
  ["и", 23.28, 23.6],
  ["находит", 23.6, 24.0],
  ["тех,", 24.0, 24.5],
  ["у", 24.5, 24.58],
  ["кого", 24.58, 24.8],
  ["нет", 24.8, 25.06],
  ["автоматизации.", 25.06, 26.0],
  ["Второй", 26.12, 27.18],
  ["модуль", 27.18, 27.54],
  ["анализирует", 27.54, 28.28],
  ["их", 28.28, 28.42],
  ["слабые", 28.42, 28.9],
  ["места", 28.9, 29.22],
  ["и", 29.22, 29.72],
  ["собирает", 29.72, 30.14],
  ["персональный", 30.14, 30.82],
  ["пример", 30.82, 31.18],
  ["решения.", 31.18, 31.9],
  ["А третий,", 32.42, 33.0],
  ["отправляет", 33.26, 33.94],
  ["готовое", 33.94, 34.44],
  ["предложение", 34.44, 35.12],
  ["напрямую", 35.12, 35.76],
  ["владельцу", 35.76, 36.34],
  ["бизнеса.", 36.34, 37.0],
  ["Напиши", 37.58, 37.96],
  ["слово", 37.96, 38.18],
  ["чертёж", 38.18, 38.74],
  ["в", 38.74, 38.96],
  ["комментариях", 38.96, 39.7],
  ["и", 39.7, 40.14],
  ["я", 40.14, 40.3],
  ["покажу", 40.3, 40.72],
  ["архитектуру", 40.72, 41.48],
  ["этой", 41.48, 41.76],
  ["связки.", 41.76, 42.36],
];

const WORDS: Word[] = RAW.map(([word, start, end]) => ({ word, start, end }));

type Chunk = { start: number; end: number; words: Word[] };
const CHUNKS: Chunk[] = (() => {
  const out: Chunk[] = [];
  let cur: Word[] = [];
  const flush = () => {
    if (cur.length) out.push({ start: cur[0].start, end: cur[cur.length - 1].end, words: cur });
    cur = [];
  };
  WORDS.forEach((w, i) => {
    const prev = WORDS[i - 1];
    if (cur.length && prev && w.start - prev.end > 0.35) flush();
    cur.push(w);
    const chars = cur.reduce((a, x) => a + x.word.length, 0);
    if (/[.,?!]$/.test(w.word) || cur.length >= 3 || chars >= 16) flush();
  });
  flush();
  return out;
})();

// -------------------------------------------------------------------------
// Small primitives
// -------------------------------------------------------------------------
const Mono: React.FC<{ size?: number; color?: string; style?: CSSProperties; children: ReactNode }> = ({
  size = 26,
  color = CYAN,
  style,
  children,
}) => (
  <div
    style={{
      fontFamily: MONO,
      fontSize: size,
      color,
      letterSpacing: 3,
      fontWeight: 700,
      textTransform: "uppercase",
      whiteSpace: "nowrap",
      ...style,
    }}
  >
    {children}
  </div>
);

const P3D: CSSProperties = { transformStyle: "preserve-3d" };

/** Wireframe 3D box sitting on the XY plane of its parent, extruding to +Z. */
const Box: React.FC<{
  x: number;
  y: number;
  w: number;
  d: number;
  h: number;
  edge?: string;
  fill?: string;
  glow?: string;
  windows?: boolean;
  alpha?: number;
  top?: ReactNode;
}> = ({ x, y, w, d, h, edge = WHITE, fill = "rgba(56,189,248,0.10)", glow, windows = true, alpha = 1, top }) => {
  if (h < 0.5 || alpha <= 0.01) return null;
  const face: CSSProperties = {
    position: "absolute",
    left: 0,
    top: 0,
    boxSizing: "border-box",
    border: `3px solid ${edge}`,
    background: windows
      ? `repeating-linear-gradient(0deg, transparent 0 34px, ${edge}33 34px 37px), repeating-linear-gradient(90deg, transparent 0 28px, ${edge}22 28px 30px), ${fill}`
      : fill,
    boxShadow: glow ? `0 0 24px ${glow}, inset 0 0 18px ${glow}` : undefined,
    transformOrigin: "0 0",
    opacity: alpha,
  };
  return (
    <div style={{ position: "absolute", left: x, top: y, width: w, height: d, ...P3D }}>
      <div style={{ ...face, width: w, height: h, transform: "rotateX(90deg)" }} />
      <div style={{ ...face, width: h, height: d, transform: "rotateY(-90deg)" }} />
      <div style={{ ...face, width: h, height: d, transform: `translateX(${w}px) rotateY(-90deg)` }} />
      <div style={{ ...face, width: w, height: h, transform: `translateY(${d}px) rotateX(90deg)` }} />
      <div
        style={{
          ...face,
          width: w,
          height: d,
          transform: `translateZ(${h}px)`,
          background: fill,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {top}
      </div>
    </div>
  );
};

/** Upright plane standing on the parent plane at (x, y), facing the viewer. */
const Stand: React.FC<{ x: number; y: number; w: number; h: number; rise: number; rotZ?: number; children: ReactNode }> = ({
  x,
  y,
  w,
  h,
  rise,
  rotZ = 0,
  children,
}) => {
  if (rise <= 0.002) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: 0,
        height: 0,
        ...P3D,
        transform: `rotateZ(${rotZ}deg) scale3d(1,1,${Math.max(0.001, rise)})`,
      }}
    >
      <div
        style={{
          position: "absolute",
          left: -w / 2,
          top: 0,
          width: w,
          height: h,
          transformOrigin: "50% 0",
          transform: `translateZ(${h}px) rotateX(-90deg)`,
        }}
      >
        {children}
      </div>
    </div>
  );
};

/** Soft contact shadow lying on the plane (light from top-left). */
const Shadow: React.FC<{ x: number; y: number; w: number; d: number; h: number; k?: number }> = ({ x, y, w, d, h, k = 1 }) =>
  h < 1 ? null : (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: w + h * 0.45,
        height: d + h * 0.3,
        background: `rgba(2,8,20,${0.55 * k})`,
        filter: "blur(14px)",
        borderRadius: 18,
        transform: "translateZ(0.6px)",
      }}
    />
  );

// -------------------------------------------------------------------------
// The blueprint sheet (shared: table sheet + middle-scene background)
// -------------------------------------------------------------------------
const GridSheet: React.FC<{ sheetNo: string; shift?: number }> = ({ sheetNo, shift = 0 }) => (
  <div style={{ position: "absolute", left: 0, top: 0, width: W, height: H, background: NAVY, overflow: "hidden" }}>
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundImage: `linear-gradient(rgba(56,189,248,0.10) 2px, transparent 2px), linear-gradient(90deg, rgba(56,189,248,0.10) 2px, transparent 2px), linear-gradient(rgba(56,189,248,0.28) 3px, transparent 3px), linear-gradient(90deg, rgba(56,189,248,0.28) 3px, transparent 3px)`,
        backgroundSize: "40px 40px, 40px 40px, 200px 200px, 200px 200px",
        backgroundPosition: `${shift}px ${shift * 0.6}px, ${shift}px ${shift * 0.6}px, ${shift}px ${shift * 0.6}px, ${shift}px ${shift * 0.6}px`,
      }}
    />
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: "radial-gradient(ellipse at 50% 40%, rgba(56,189,248,0.10), transparent 60%), radial-gradient(ellipse at 50% 50%, transparent 55%, rgba(2,8,20,0.55))",
      }}
    />
    {/* drafting frame */}
    <div style={{ position: "absolute", left: 36, top: 36, right: 36, bottom: 36, border: `4px solid ${WHITE}`, opacity: 0.85 }} />
    <div style={{ position: "absolute", left: 50, top: 50, right: 50, bottom: 50, border: `1.5px solid ${WHITE}`, opacity: 0.45 }} />
    {/* title block */}
    <div
      style={{
        position: "absolute",
        right: 50,
        bottom: 50,
        width: 470,
        height: 92,
        borderLeft: `2px solid ${WHITE}`,
        borderTop: `2px solid ${WHITE}`,
        display: "grid",
        gridTemplateColumns: "1.5fr 1fr",
        opacity: 0.8,
      }}
    >
      <div style={{ borderRight: `2px solid ${WHITE}`, padding: "12px 16px" }}>
        <Mono size={15} color={DIM}>
          project
        </Mono>
        <Mono size={20} color={WHITE}>
          AI-HUNTER v1
        </Mono>
      </div>
      <div style={{ padding: "12px 16px" }}>
        <Mono size={15} color={DIM}>
          sheet
        </Mono>
        <Mono size={20} color={ORANGE}>
          {sheetNo}
        </Mono>
      </div>
    </div>
  </div>
);

// -------------------------------------------------------------------------
// Drafting tools (SVG art drawn on upright / flat planes)
// -------------------------------------------------------------------------
const CompassArt: React.FC<{ spread: number }> = ({ spread }) => {
  const a = 10 + 16 * spread;
  const L = 360;
  const r = (a * Math.PI) / 180;
  const lx = -Math.sin(r) * L;
  const rx = Math.sin(r) * L;
  const y = Math.cos(r) * L;
  return (
    <svg width={300} height={440} viewBox="-150 -40 300 440" style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id="bpMetal" x1="0" x2="1">
          <stop offset="0" stopColor="#94A3B8" />
          <stop offset="0.5" stopColor="#F1F5F9" />
          <stop offset="1" stopColor="#64748B" />
        </linearGradient>
      </defs>
      <rect x={-9} y={-38} width={18} height={30} rx={6} fill="url(#bpMetal)" />
      <line x1={0} y1={0} x2={lx} y2={y} stroke="url(#bpMetal)" strokeWidth={16} strokeLinecap="round" />
      <line x1={0} y1={0} x2={rx} y2={y - 20} stroke="url(#bpMetal)" strokeWidth={16} strokeLinecap="round" />
      <line x1={rx * 0.96} y1={(y - 20) * 0.96} x2={rx} y2={y} stroke={ORANGE} strokeWidth={9} strokeLinecap="round" />
      <line x1={lx} y1={y} x2={lx * 1.02} y2={y + 16} stroke="#CBD5E1" strokeWidth={4} />
      <circle cx={0} cy={0} r={22} fill="url(#bpMetal)" stroke="#475569" strokeWidth={3} />
      <circle cx={0} cy={0} r={8} fill={ORANGE} />
    </svg>
  );
};

const SetSquareArt: React.FC = () => (
  <svg width={340} height={300} viewBox="0 0 340 300">
    <path d="M10,290 L330,290 L10,10 Z" fill="rgba(56,189,248,0.22)" stroke={CYAN} strokeWidth={5} />
    <path d="M70,250 L230,250 L70,110 Z" fill={NAVY} fillOpacity={0.5} stroke={CYAN} strokeWidth={3} />
    {Array.from({ length: 15 }).map((_, i) => (
      <line key={i} x1={20 + i * 20} y1={290} x2={20 + i * 20} y2={mod(i, 5) === 0 ? 272 : 280} stroke={WHITE} strokeWidth={2} />
    ))}
  </svg>
);

const Pencil: React.FC<{ len?: number }> = ({ len = 520 }) => (
  <div style={{ position: "relative", width: len, height: 34 }}>
    <div style={{ position: "absolute", left: 60, top: 0, width: len - 120, height: 34, background: `linear-gradient(${ORANGE}, #C2410C)`, borderRadius: 4 }} />
    <div style={{ position: "absolute", left: len - 64, top: 0, width: 44, height: 34, background: "#CBD5E1" }} />
    <div style={{ position: "absolute", left: len - 22, top: 0, width: 22, height: 34, background: "#F9A8D4", borderRadius: "0 8px 8px 0" }} />
    <div style={{ position: "absolute", left: 0, top: 0, width: 0, height: 0, borderTop: "17px solid transparent", borderBottom: "17px solid transparent", borderRight: "60px solid #E7C9A0" }} />
    <div style={{ position: "absolute", left: 0, top: 11, width: 0, height: 0, borderTop: "6px solid transparent", borderBottom: "6px solid transparent", borderRight: "20px solid #1F2937" }} />
  </div>
);

// -------------------------------------------------------------------------
// 3D WORLD — drafting table + sheet. p = 0 (table view) … 1 (sheet fills frame)
// At p === 1 the world transform is the identity → the sheet is exactly 1080x1920.
// -------------------------------------------------------------------------
const INTRO_CITY = [
  [130, 1180, 140, 120, 300],
  [300, 1110, 110, 110, 470],
  [440, 1210, 160, 130, 240],
  [630, 1100, 130, 120, 540],
  [790, 1190, 150, 140, 330],
  [190, 1410, 170, 130, 200],
  [410, 1420, 120, 110, 390],
  [570, 1390, 180, 150, 270],
  [790, 1430, 140, 120, 220],
];

const World: React.FC<{ gf: number; p: number; mode: "intro" | "end" }> = ({ gf, p, mode }) => {
  const t = gf / FPS;
  const intro = mode === "intro";
  const punch = intro ? punchAt(gf, 1.74) + punchAt(gf, 5.94) : punchAt(gf, 38.18) * 0.7;
  const dolly = intro ? 0.52 + 0.07 * rs(gf, 0, 6.4, Easing.linear) : 0.5 - 0.03 * rs(gf, 39.4, 44, Easing.linear);
  const base = dolly * (1 + 0.05 * punch);
  const tilt = mix(44 + 2.5 * Math.sin(t * 0.5), 0, p);
  const rz = mix((intro ? -8 : 7) + 3 * Math.sin(t * 0.33), 0, p);
  const sc = mix(base, 1, p);
  const ty = mix(intro ? 110 : 230, 0, p);
  const tx = mix(10 * Math.sin(t * 0.41), 0, p);
  const away = 1 - interpolate(p, [0, 0.65], [0, 1], clamp); // props sink during the fly

  // intro states
  const unroll = intro ? rs(gf, 0.0, 1.3, EASE) : 1;
  const foot = intro ? rs(gf, 0.9, 1.9) : 0;
  const cityRise = (i: number) => (intro ? rs(gf, 1.6 + i * 0.16, 2.6 + i * 0.16, BACK) : 0) * away;
  const toolRise = intro ? rs(gf, 2.4, 3.4, BACK) * away : 0;
  const titleIn = intro ? 1 - interpolate(p, [0.55, 0.95], [0, 1], clamp) : 0;
  // end states
  const model = (i: number) => (!intro ? rs(gf, 38.7 + i * 0.25, 39.8 + i * 0.25, BACK) * away : 0);
  const ready = !intro ? rs(gf, 38.5, 39.3) : 0;
  const pulse = 0.65 + 0.35 * Math.sin(t * 4);

  const letters = (s: string, start: number, step: number) =>
    s.split("").map((ch, i) => {
      const k = intro ? rs(gf, start + i * step, start + i * step + 0.25) : 0;
      return (
        <span key={i} style={{ opacity: k, display: "inline-block", transform: `translateY(${(1 - k) * 30}px)` }}>
          {ch === " " ? " " : ch}
        </span>
      );
    });

  return (
    <AbsoluteFill style={{ perspective: 1700, perspectiveOrigin: "50% 50%" }}>
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: W,
          height: H,
          ...P3D,
          transformOrigin: "50% 50%",
          transform: `translate3d(${tx}px, ${ty}px, 0) rotateX(${tilt}deg) rotateZ(${rz}deg) scale3d(${sc},${sc},${sc})`,
        }}
      >
        {/* --- drafting table --- */}
        <div
          style={{
            position: "absolute",
            left: -1250,
            top: -1300,
            width: 3580,
            height: 3850,
            transform: "translateZ(-4px)",
            background:
              "radial-gradient(ellipse at 50% 45%, rgba(255,214,170,0.22), transparent 55%), repeating-linear-gradient(92deg, rgba(0,0,0,0.10) 0 6px, transparent 6px 22px, rgba(255,255,255,0.03) 22px 26px, transparent 26px 60px), linear-gradient(180deg, #3B2A1E, #2A1C13 60%, #1E140D)",
            boxShadow: "inset 0 0 280px rgba(0,0,0,0.7)",
          }}
        />
        {/* table front edge (thickness) */}
        <div
          style={{
            position: "absolute",
            left: -1250,
            top: 2550,
            width: 3580,
            height: 110,
            transformOrigin: "0 0",
            transform: "translateZ(-4px) rotateX(-90deg)",
            background: "linear-gradient(#5A4030, #1A110B)",
          }}
        />
        {/* parallel bar (metal straight-edge) across the table */}
        <div
          style={{
            position: "absolute",
            left: -900,
            top: -170,
            width: 2880,
            height: 70,
            transform: "translateZ(6px)",
            background: "linear-gradient(#E2E8F0, #94A3B8 60%, #64748B)",
            borderRadius: 6,
            boxShadow: "0 30px 40px rgba(0,0,0,0.45)",
          }}
        />
        {/* paper shadow */}
        <div
          style={{
            position: "absolute",
            left: 30,
            top: 40,
            width: W,
            height: H * unroll,
            transform: "translateZ(-2px)",
            background: "rgba(0,0,0,0.55)",
            filter: "blur(30px)",
          }}
        />
        {/* --- the blueprint sheet --- */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: W,
            height: H,
            clipPath: `inset(0 0 ${(1 - unroll) * 100}% 0)`,
            boxShadow: p > 0.98 ? undefined : "0 0 0 2px rgba(248,250,252,0.25)",
          }}
        >
          <GridSheet sheetNo={intro ? "A-01" : "A-06"} />
          {/* city footprints drawn on paper */}
          {intro && (
            <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0 }}>
              {INTRO_CITY.map(([x, y, w, d], i) => (
                <rect
                  key={i}
                  x={x}
                  y={y}
                  width={w}
                  height={d}
                  fill="none"
                  stroke={WHITE}
                  strokeWidth={3}
                  pathLength={1}
                  strokeDasharray={1}
                  strokeDashoffset={1 - foot}
                  opacity={0.9 * titleIn}
                />
              ))}
              <line x1={110} x2={970} y1={1060} y2={1060} stroke={CYAN} strokeWidth={2} strokeDasharray="14 10" opacity={foot * titleIn} />
            </svg>
          )}
          {intro && (
            <div style={{ position: "absolute", left: 90, top: 170, right: 90, opacity: titleIn }}>
              <Mono size={26} color={CYAN} style={{ opacity: rs(gf, 0.3, 0.8) }}>
                ◢ project / ai-hunter · scale 1:1
              </Mono>
              <div style={{ fontFamily: IMPACT, fontSize: 176, lineHeight: 1.0, color: WHITE, marginTop: 24, textShadow: `0 0 30px rgba(56,189,248,0.6)` }}>
                {letters("ИИ-ОХОТНИК", 0.25, 0.05)}
              </div>
              <div style={{ height: 10, width: 900 * rs(gf, 1.6, 2.3), background: ORANGE, marginTop: 10, boxShadow: `0 0 20px ${ORANGE}` }} />
              <div style={{ fontFamily: IMPACT, fontSize: 128, lineHeight: 1.08, color: WHITE, marginTop: 22 }}>
                {letters("ЗА КЛИЕНТАМИ", 0.7, 0.04)}
              </div>
              <div style={{ fontFamily: IMPACT, fontSize: 150, lineHeight: 1.05, color: ORANGE, textShadow: `0 0 28px rgba(255,107,53,0.6)` }}>
                {letters("ЗА 1 ВЕЧЕР", 1.1, 0.05)}
              </div>
            </div>
          )}
          {!intro && (
            <div style={{ position: "absolute", left: 90, top: 200, right: 90, opacity: ready * away }}>
              <Mono size={28}>◢ system model · 3 modules</Mono>
              <div style={{ fontFamily: IMPACT, fontSize: 170, color: WHITE, lineHeight: 1.0, marginTop: 20, textShadow: "0 0 30px rgba(56,189,248,0.7)" }}>
                BLUEPRINT
              </div>
              <div
                style={{
                  display: "inline-block",
                  marginTop: 16,
                  fontFamily: IMPACT,
                  fontSize: 150,
                  color: ORANGE,
                  border: `8px solid ${ORANGE}`,
                  padding: "0 30px",
                  transform: `rotate(-3deg) scale(${mix(1.4, 1, ready)})`,
                  boxShadow: `0 0 ${30 * pulse}px ${ORANGE}`,
                }}
              >
                READY
              </div>
            </div>
          )}
        </div>
        {/* paper roll at the unrolling edge */}
        {unroll < 0.999 && (
          <div
            style={{
              position: "absolute",
              left: -20,
              top: H * unroll - 55,
              width: W + 40,
              height: 110,
              borderRadius: 55,
              transform: "translateZ(55px)",
              background: `linear-gradient(180deg, #1E3A64, ${NAVY_3} 30%, #2B5A92 55%, ${NAVY} 85%)`,
              boxShadow: "0 40px 40px rgba(0,0,0,0.5)",
            }}
          />
        )}

        {/* --- intro: wireframe city rising --- */}
        {intro &&
          INTRO_CITY.map(([x, y, w, d, h], i) => {
            const r = cityRise(i);
            return (
              <React.Fragment key={i}>
                <Shadow x={x} y={y} w={w} d={d} h={h * r} k={away} />
                <Box x={x} y={y} w={w} d={d} h={h * r} edge={mod(i, 4) === 3 ? ORANGE : WHITE} glow="rgba(56,189,248,0.55)" alpha={away} />
              </React.Fragment>
            );
          })}
        {intro && (
          <>
            <Stand x={950} y={1720} w={300} h={440} rise={toolRise} rotZ={8}>
              <CompassArt spread={rs(gf, 3.0, 4.2)} />
            </Stand>
            <Stand x={170} y={1740} w={340} h={300} rise={intro ? rs(gf, 2.7, 3.7, BACK) * away : 0} rotZ={-6}>
              <SetSquareArt />
            </Stand>
          </>
        )}
        {/* pencil + scale ruler lying on the table */}
        <div style={{ position: "absolute", left: 1160, top: 520, transform: "translateZ(18px) rotateZ(64deg)", opacity: 1 }}>
          <Pencil len={560} />
        </div>
        <div
          style={{
            position: "absolute",
            left: -560,
            top: 700,
            width: 120,
            height: 1100,
            transform: "translateZ(10px) rotateZ(-4deg)",
            background: `repeating-linear-gradient(180deg, transparent 0 18px, #0F172A 18px 21px), linear-gradient(90deg, #F1F5F9, #CBD5E1)`,
            borderRadius: 6,
            boxShadow: "20px 30px 40px rgba(0,0,0,0.5)",
          }}
        />

        {/* --- ending: glowing scale model of the system --- */}
        {!intro && (
          <>
            <Shadow x={170} y={1020} w={740} d={540} h={180 * model(0)} k={away} />
            <Box x={170} y={1020} w={740} d={540} h={34 * model(0)} edge={CYAN} fill="rgba(56,189,248,0.18)" glow={`rgba(56,189,248,${0.6 * pulse})`} windows={false} alpha={away} />
            {[
              [240, 1150, 170, 170, 280, CYAN, "01"],
              [455, 1080, 170, 170, 430, WHITE, "02"],
              [670, 1150, 170, 170, 330, ORANGE, "03"],
            ].map(([x, y, w, d, h, c, label], i) => {
              const r = model(i + 1);
              return (
                <div key={i} style={{ position: "absolute", left: 0, top: 0, ...P3D, transform: `translateZ(${34 * model(0)}px)` }}>
                  <Box
                    x={x as number}
                    y={y as number}
                    w={w as number}
                    d={d as number}
                    h={(h as number) * r}
                    edge={c as string}
                    glow={`${c as string}${i === 2 ? "CC" : "99"}`}
                    alpha={away}
                    top={
                      <div style={{ fontFamily: IMPACT, fontSize: 96, color: c as string, textShadow: `0 0 20px ${c as string}` }}>{label as string}</div>
                    }
                  />
                </div>
              );
            })}
            {/* glowing beams between modules */}
            {[0, 1].map((i) => {
              const k = rs(gf, 40.0 + i * 0.3, 40.6 + i * 0.3);
              return (
                <div
                  key={i}
                  style={{
                    position: "absolute",
                    left: 410 + i * 215,
                    top: 1225 - i * 10,
                    width: 45 * k,
                    height: 14,
                    transform: `translateZ(${34 * model(0) + 120}px)`,
                    background: ORANGE,
                    boxShadow: `0 0 26px ${ORANGE}`,
                    opacity: away,
                  }}
                />
              );
            })}
          </>
        )}
      </div>
    </AbsoluteFill>
  );
};

/** Dark studio room behind the table, with bokeh (depth of field). */
const Room: React.FC<{ gf: number }> = ({ gf }) => {
  const t = gf / FPS;
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 30%, #1B2B44, #070B14 70%)" }}>
      {Array.from({ length: 16 }).map((_, i) => {
        const x = rnd(i) * W;
        const y = rnd(i + 40) * 700;
        const r = 40 + rnd(i + 80) * 110;
        const c = mod(i, 3) === 0 ? "rgba(255,107,53,0.35)" : "rgba(56,189,248,0.30)";
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x + 20 * Math.sin(t * 0.3 + i),
              top: y + 10 * Math.cos(t * 0.25 + i),
              width: r,
              height: r,
              borderRadius: "50%",
              background: c,
              filter: "blur(16px)",
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

/** Screen-space DOF: blur the far (top) part of the table. */
const DepthBlur: React.FC<{ k: number }> = ({ k }) =>
  k <= 0.01 ? null : (
    <AbsoluteFill
      style={{
        backdropFilter: `blur(${7 * k}px)`,
        WebkitBackdropFilter: `blur(${7 * k}px)`,
        maskImage: "linear-gradient(180deg, black 0%, black 18%, transparent 42%, transparent 82%, black 100%)",
        WebkitMaskImage: "linear-gradient(180deg, black 0%, black 18%, transparent 42%, transparent 82%, black 100%)",
        pointerEvents: "none",
      }}
    />
  );

const Intro: React.FC<{ gf: number }> = ({ gf }) => {
  const p = interpolate(gf, [FLY0, S2], [0, 1], { ...clamp, easing: FLY });
  return (
    <AbsoluteFill>
      <Room gf={gf} />
      <World gf={gf} p={p} mode="intro" />
      <DepthBlur k={1 - p} />
      <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 50%, transparent 50%, rgba(0,0,0,${0.55 * (1 - p)}))` }} />
    </AbsoluteFill>
  );
};

const Ending: React.FC<{ gf: number }> = ({ gf }) => {
  const p = 1 - interpolate(gf, [S6, BACK1], [0, 1], { ...clamp, easing: FLY });
  const t = gf / FPS;
  const k1 = rs(gf, 37.58, 37.95, BACK);
  const k2 = rs(gf, 38.18, 38.6, BACK);
  const k3 = rs(gf, 38.96, 39.5);
  const k4 = rs(gf, 40.72, 41.3);
  const glow = 0.7 + 0.3 * Math.sin(t * 5);
  const pz = 1 + 0.08 * punchAt(gf, 38.18);
  return (
    <AbsoluteFill>
      <Room gf={gf} />
      <World gf={gf} p={p} mode="end" />
      <DepthBlur k={1 - p} />
      <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 60%, transparent 50%, rgba(0,0,0,${0.55 * (1 - p)}))` }} />
      {/* CTA (screen space, top) */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 150, display: "flex", flexDirection: "column", alignItems: "center", transform: `scale(${pz})` }}>
        <div style={{ fontFamily: IMPACT, fontSize: 150, color: WHITE, lineHeight: 1, opacity: k1, transform: `translateY(${(1 - k1) * 40}px)`, textShadow: "0 6px 30px rgba(0,0,0,0.8)" }}>
          НАПИШИ
        </div>
        <div
          style={{
            marginTop: 18,
            fontFamily: IMPACT,
            fontSize: 172,
            lineHeight: 1.05,
            color: NAVY,
            background: ORANGE,
            padding: "6px 48px 14px",
            borderRadius: 26,
            transform: `scale(${mix(0.3, 1, k2)}) rotate(${mix(-8, -2, k2)}deg)`,
            opacity: Math.min(1, k2 * 2),
            boxShadow: `0 0 ${60 * glow}px rgba(255,107,53,0.85), 0 20px 50px rgba(0,0,0,0.6)`,
          }}
        >
          ЧЕРТЁЖ
        </div>
        <Mono size={34} color={WHITE} style={{ marginTop: 34, opacity: k3, textShadow: "0 2px 10px #000" }}>
          в комментариях ↓
        </Mono>
        <Mono size={26} color={CYAN} style={{ marginTop: 14, opacity: k4, textShadow: "0 2px 10px #000" }}>
          → покажу архитектуру связки
        </Mono>
      </div>
    </AbsoluteFill>
  );
};

// -------------------------------------------------------------------------
// Middle-scene helpers
// -------------------------------------------------------------------------
const MID_PUNCHES = [13.22, 17.78, 19.36, 25.06, 26.12, 31.18, 32.42, 35.76];

const Cam: React.FC<{ gf: number; children: ReactNode }> = ({ gf, children }) => {
  const t = gf / FPS;
  const punch = MID_PUNCHES.reduce((a, s) => a + punchAt(gf, s), 0);
  const sc = 1.02 + 0.012 * Math.sin(t * 0.4) + 0.06 * punch;
  return (
    <AbsoluteFill
      style={{
        transform: `translate(${9 * Math.sin(t * 0.5)}px, ${7 * Math.cos(t * 0.37)}px) rotate(${0.35 * Math.sin(t * 0.29)}deg) scale(${sc})`,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

/** Plotter-style reveal: a cyan scan line sweeps down, revealing the scene. */
const SceneShell: React.FC<{ gf: number; from: number; to: number; children: ReactNode }> = ({ gf, from, to, children }) => {
  if (gf < from || gf >= to + XFADE) return null;
  const r = interpolate(gf, [from, from + XFADE], [0, 1], { ...clamp, easing: EASE });
  const outK = interpolate(gf, [to, to + XFADE], [1, 0], clamp);
  return (
    <AbsoluteFill style={{ opacity: outK }}>
      <AbsoluteFill style={{ clipPath: `inset(0 0 ${(1 - r) * 100}% 0)` }}>{children}</AbsoluteFill>
      {r < 1 && (
        <div style={{ position: "absolute", left: 0, right: 0, top: r * H - 3, height: 6, background: CYAN, boxShadow: `0 0 30px ${CYAN}, 0 0 80px ${CYAN}` }} />
      )}
    </AbsoluteFill>
  );
};

const ModuleHeader: React.FC<{ gf: number; at: number; num: string; title: string; sub: string }> = ({ gf, at, num, title, sub }) => {
  const k = rs(gf, at, at + 0.5);
  const k2 = rs(gf, at + 0.2, at + 0.8);
  return (
    <div style={{ position: "absolute", left: 90, top: 140, right: 90 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 20, opacity: k, transform: `translateX(${(1 - k) * -40}px)` }}>
        <div style={{ background: ORANGE, color: NAVY, fontFamily: MONO, fontWeight: 900, fontSize: 30, padding: "8px 18px", letterSpacing: 4 }}>
          MODULE {num}
        </div>
        <div style={{ flex: 1, height: 3, background: WHITE, opacity: 0.6, transformOrigin: "0 50%", transform: `scaleX(${k2})` }} />
        <Mono size={22} color={DIM}>
          {sub}
        </Mono>
      </div>
      <div style={{ fontFamily: IMPACT, fontSize: 112, color: WHITE, lineHeight: 1.05, marginTop: 18, opacity: k2, letterSpacing: 1 }}>{title}</div>
    </div>
  );
};

const Dim: React.FC<{ x1: number; x2: number; y: number; label: string; k: number }> = ({ x1, x2, y, label, k }) => (
  <g opacity={k}>
    <line x1={x1} x2={x1 + (x2 - x1) * k} y1={y} y2={y} stroke={CYAN} strokeWidth={2} />
    <line x1={x1} x2={x1} y1={y - 14} y2={y + 14} stroke={CYAN} strokeWidth={2} />
    <line x1={x2} x2={x2} y1={y - 14} y2={y + 14} stroke={CYAN} strokeWidth={2} />
    <text x={(x1 + x2) / 2} y={y - 12} fill={CYAN} fontFamily={MONO} fontSize={20} textAnchor="middle" letterSpacing={3}>
      {label}
    </text>
  </g>
);

const Stamp: React.FC<{ k: number; text: string; color?: string; size?: number; rot?: number; style?: CSSProperties }> = ({
  k,
  text,
  color = ORANGE,
  size = 70,
  rot = -8,
  style,
}) =>
  k <= 0 ? null : (
    <div
      style={{
        position: "absolute",
        fontFamily: IMPACT,
        fontSize: size,
        color,
        border: `7px solid ${color}`,
        padding: "4px 26px",
        borderRadius: 10,
        whiteSpace: "nowrap",
        opacity: Math.min(1, k * 2),
        transform: `rotate(${rot}deg) scale(${mix(2.2, 1, k)})`,
        boxShadow: `0 0 30px ${color}66, inset 0 0 20px ${color}44`,
        background: "rgba(10,25,47,0.85)",
        ...style,
      }}
    >
      {text}
    </div>
  );

// -------------------------------------------------------------------------
// Scene 2 — crossed-out freelance exchanges → "2026: чертёж один раз"
// -------------------------------------------------------------------------
const Scene2: React.FC<{ gf: number }> = ({ gf }) => {
  const oldOut = rs(gf, 14.2, 14.6, EASE);
  const frame = rs(gf, 8.1, 9.2, EASE);
  const fill = interpolate(gf, [s2f(9.3), s2f(13.1)], [0, 100], clamp);
  const strike1 = rs(gf, 13.22, 13.45, EASE);
  const strike2 = rs(gf, 13.4, 13.65, EASE);
  const stamp = rs(gf, 13.6, 13.95, BACK);
  const shake = gf >= s2f(13.22) && gf < s2f(13.6) ? 6 * Math.sin(gf * 2.1) : 0;

  const y26 = rs(gf, 14.6, 15.2, BACK);
  const circ = rs(gf, 14.9, 16.4, EASE);
  const l1 = rs(gf, 16.9, 17.3, BACK);
  const l2 = rs(gf, 17.78, 18.1, BACK);
  const l3 = rs(gf, 18.3, 18.8);
  const ang = -90 + 360 * circ;
  return (
    <>
      {/* ---- beat A: old way ---- */}
      {oldOut < 1 && (
        <AbsoluteFill style={{ opacity: 1 - oldOut, transform: `translateY(${-oldOut * 120}px) translateX(${shake}px)` }}>
          <div style={{ position: "absolute", left: 90, top: 150, display: "flex", gap: 20, alignItems: "center", opacity: rs(gf, 8.0, 8.4) }}>
            <div style={{ border: `3px solid ${DIM}`, color: DIM, fontFamily: MONO, fontWeight: 900, fontSize: 28, padding: "6px 16px", letterSpacing: 4 }}>
              СТАРЫЙ МЕТОД
            </div>
            <Mono size={22} color={DIM}>
              2015 — 2025
            </Mono>
          </div>
          <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0 }}>
            <rect x={80} y={260} width={920} height={700} fill="rgba(56,189,248,0.05)" stroke={WHITE} strokeWidth={4} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - frame} />
            <Dim x1={80} x2={1000} y={232} label="920 × биржа" k={frame} />
          </svg>
          <div style={{ position: "absolute", left: 120, top: 300, right: 120, opacity: rs(gf, 8.6, 9.2) }}>
            <div style={{ fontFamily: IMPACT, fontSize: 108, color: WHITE, lineHeight: 1.05 }}>БИРЖИ ФРИЛАНСА:</div>
            <div style={{ fontFamily: IMPACT, fontSize: 150, color: CYAN, lineHeight: 1.05, marginTop: 14 }}>
              {Math.round(fill)} ОТКЛИКОВ
            </div>
            <div style={{ fontFamily: IMPACT, fontSize: 124, color: WHITE, lineHeight: 1.05, marginTop: 10 }}>ЗА КОПЕЙКИ</div>
          </div>
          {/* 100 identical responses */}
          <div style={{ position: "absolute", left: 90, top: 1010, width: 900, display: "grid", gridTemplateColumns: "repeat(20, 1fr)", gap: 8 }}>
            {Array.from({ length: 100 }).map((_, i) => {
              const on = i < fill;
              return (
                <div
                  key={i}
                  style={{
                    height: 34,
                    border: `2px solid ${on ? WHITE : "rgba(248,250,252,0.18)"}`,
                    background: on ? "rgba(56,189,248,0.25)" : "transparent",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    gap: 4,
                    padding: "0 5px",
                  }}
                >
                  <div style={{ height: 3, background: on ? WHITE : "transparent", opacity: 0.8 }} />
                  <div style={{ height: 3, width: "60%", background: on ? WHITE : "transparent", opacity: 0.5 }} />
                </div>
              );
            })}
          </div>
          <div style={{ position: "absolute", left: 90, right: 90, top: 1260, display: "flex", justifyContent: "space-between", opacity: rs(gf, 9.4, 9.9) }}>
            <Mono size={28} color={WHITE}>
              откликов: {Math.round(fill)}
            </Mono>
            <Mono size={28} color={ORANGE}>
              ответов: 0
            </Mono>
            <Mono size={28} color={WHITE}>
              ≈ $0.30
            </Mono>
          </div>
          {/* orange pencil strike-through */}
          <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0 }}>
            <line x1={70} y1={300} x2={70 + 940 * strike1} y2={300 + 640 * strike1} stroke={ORANGE} strokeWidth={22} strokeLinecap="round" />
            <line x1={1010} y1={300} x2={1010 - 940 * strike2} y2={300 + 640 * strike2} stroke={ORANGE} strokeWidth={22} strokeLinecap="round" />
          </svg>
          <Stamp k={stamp} text="НЕ РАБОТАЕТ" size={96} rot={-10} style={{ left: 230, top: 1110 }} />
        </AbsoluteFill>
      )}
      {/* ---- beat B: 2026 — build the blueprint once ---- */}
      {oldOut > 0 && (
        <AbsoluteFill>
          <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0 }}>
            <circle cx={540} cy={560} r={330} fill="none" stroke={CYAN} strokeWidth={4} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - circ} transform="rotate(-90 540 560)" />
            <circle cx={540} cy={560} r={360} fill="none" stroke={WHITE} strokeWidth={1.5} strokeDasharray="6 12" opacity={circ * 0.6} />
            <line x1={540} y1={560} x2={540 + 330 * Math.cos((ang * Math.PI) / 180)} y2={560 + 330 * Math.sin((ang * Math.PI) / 180)} stroke={ORANGE} strokeWidth={5} opacity={circ < 1 ? y26 : 0} />
            <circle cx={540} cy={560} r={10} fill={ORANGE} opacity={y26} />
            <Dim x1={140} x2={940} y={1000} label="× 1 · навсегда" k={l2} />
          </svg>
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: 400,
              textAlign: "center",
              fontFamily: IMPACT,
              fontSize: 280,
              lineHeight: 1,
              color: "transparent",
              WebkitTextStroke: `6px ${WHITE}`,
              opacity: y26,
              transform: `scale(${mix(0.6, 1, y26)})`,
              textShadow: "0 0 40px rgba(56,189,248,0.5)",
            }}
          >
            2026
          </div>
          <div style={{ position: "absolute", left: 0, right: 0, top: 1050, textAlign: "center" }}>
            <div style={{ fontFamily: IMPACT, fontSize: 110, color: WHITE, opacity: l1, transform: `translateY(${(1 - l1) * 40}px)` }}>ТЫ СТРОИШЬ ЧЕРТЁЖ</div>
            <div
              style={{
                display: "inline-block",
                marginTop: 16,
                fontFamily: IMPACT,
                fontSize: 150,
                color: NAVY,
                background: ORANGE,
                padding: "0 40px",
                opacity: Math.min(1, l2 * 2),
                transform: `scale(${mix(0.4, 1, l2)})`,
                boxShadow: `0 0 50px rgba(255,107,53,0.7)`,
              }}
            >
              ОДИН РАЗ
            </div>
            <Mono size={26} color={CYAN} style={{ marginTop: 22, opacity: l3 }}>
              ↻ дальше он работает сам · 24/7
            </Mono>
          </div>
        </AbsoluteFill>
      )}
    </>
  );
};

// -------------------------------------------------------------------------
// Scene 3 — MODULE 01: 3D city map radar scan
// -------------------------------------------------------------------------
const CITIES = ["БЕРЛИН", "ДУБАЙ", "ВАРШАВА", "МЮНХЕН", "ТОРОНТО", "ПРАГА", "МИЛАН"];
const MAP_N = 4;
const TARGETS = [2, 5, 7, 10, 13, 15];

const Scene3: React.FC<{ gf: number }> = ({ gf }) => {
  const t = gf / FPS;
  const rise = (i: number) => rs(gf, 19.5 + i * 0.05, 20.4 + i * 0.05, BACK);
  const sweep = rs(gf, 20.1, 20.6);
  const ang = (t - 20.1) * 150;
  const rotZ = mix(-24, 12, rs(gf, 19.2, 26, Easing.linear));
  const checked = Math.round(interpolate(gf, [s2f(20.2), s2f(25.5)], [0, 248], clamp));
  const cityIdx = mod(Math.floor(Math.max(0, t - 21.2) * 2.4), CITIES.length);
  const cityLocked = t >= 22.6;
  const found = TARGETS.filter((_, k) => t >= 23.6 + k * 0.28).length;
  return (
    <>
      <ModuleHeader gf={gf} at={19.36} num="01" title="СКАНЕР ГОРОДА" sub="maps + sites" />
      <AbsoluteFill style={{ perspective: 1500, perspectiveOrigin: "50% 20%" }}>
        <div
          style={{
            position: "absolute",
            left: 170,
            top: 400,
            width: 740,
            height: 740,
            ...P3D,
            transformOrigin: "50% 50%",
            transform: `rotateX(56deg) rotateZ(${rotZ}deg)`,
          }}
        >
          {/* map ground */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: NAVY_2,
              border: `4px solid ${WHITE}`,
              backgroundImage: `linear-gradient(rgba(56,189,248,0.35) 3px, transparent 3px), linear-gradient(90deg, rgba(56,189,248,0.35) 3px, transparent 3px)`,
              backgroundSize: "185px 185px",
              boxShadow: "0 0 60px rgba(56,189,248,0.25)",
            }}
          />
          {/* radar */}
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: 740,
              height: 740,
              borderRadius: "50%",
              transform: "translateZ(1px)",
              opacity: sweep,
              background: `conic-gradient(from ${mod(ang, 360)}deg, rgba(56,189,248,0) 0deg, rgba(56,189,248,0) 290deg, rgba(56,189,248,0.55) 359deg, rgba(56,189,248,0) 360deg)`,
              border: `2px solid rgba(56,189,248,0.5)`,
            }}
          />
          {[120, 240, 370].map((r) => (
            <div
              key={r}
              style={{
                position: "absolute",
                left: 370 - r,
                top: 370 - r,
                width: r * 2,
                height: r * 2,
                borderRadius: "50%",
                border: "2px dashed rgba(248,250,252,0.35)",
                transform: "translateZ(1px)",
                opacity: sweep,
              }}
            />
          ))}
          {/* buildings */}
          {Array.from({ length: MAP_N * MAP_N }).map((_, i) => {
            const cx = mod(i, MAP_N);
            const cy = Math.floor(i / MAP_N);
            const w = 90 + rnd(i) * 40;
            const d = 90 + rnd(i + 9) * 40;
            const h = 80 + rnd(i + 21) * 230;
            const x = cx * 185 + (185 - w) / 2;
            const y = cy * 185 + (185 - d) / 2;
            const k = TARGETS.indexOf(i);
            const hit = k >= 0 ? rs(gf, 23.6 + k * 0.28, 23.9 + k * 0.28) : 0;
            const hr = h * rise(i);
            return (
              <React.Fragment key={i}>
                <Shadow x={x} y={y} w={w} d={d} h={hr} />
                {hit > 0 && (
                  <div
                    style={{
                      position: "absolute",
                      left: x + w / 2 - 95,
                      top: y + d / 2 - 95,
                      width: 190,
                      height: 190,
                      borderRadius: "50%",
                      border: `5px solid ${ORANGE}`,
                      transform: `translateZ(2px) scale(${0.6 + 0.4 * mod(t * 1.4 + k * 0.2, 1)})`,
                      opacity: hit * (1 - mod(t * 1.4 + k * 0.2, 1)),
                    }}
                  />
                )}
                <Box
                  x={x}
                  y={y}
                  w={w}
                  d={d}
                  h={hr}
                  edge={hit > 0.5 ? ORANGE : WHITE}
                  fill={hit > 0.5 ? "rgba(255,107,53,0.28)" : "rgba(56,189,248,0.10)"}
                  glow={hit > 0.5 ? "rgba(255,107,53,0.7)" : "rgba(56,189,248,0.4)"}
                />
                {hit > 0 && (
                  <Stand x={x + w / 2} y={y + d / 2} w={20} h={hr + 110} rise={hit}>
                    <div style={{ width: 20, height: "100%", background: `linear-gradient(180deg, ${ORANGE}, rgba(255,107,53,0))`, boxShadow: `0 0 30px ${ORANGE}` }} />
                  </Stand>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </AbsoluteFill>
      {/* readouts */}
      <div style={{ position: "absolute", left: 90, right: 90, top: 1300, opacity: rs(gf, 20.1, 20.6) }}>
        <div style={{ display: "flex", justifyContent: "space-between", borderTop: `2px solid ${WHITE}`, paddingTop: 18 }}>
          <Mono size={28} color={WHITE}>
            город: <span style={{ color: cityLocked ? ORANGE : CYAN }}>{cityLocked ? "ЛЮБОЙ ✓" : CITIES[cityIdx]}</span>
          </Mono>
          <Mono size={28} color={WHITE}>
            проверено: {checked}
          </Mono>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 18, marginTop: 22 }}>
          <div style={{ fontFamily: IMPACT, fontSize: 84, color: ORANGE, lineHeight: 1, minWidth: 70 }}>{found}</div>
          <Mono size={30} color={found ? ORANGE : DIM}>
            без автоматизации · цели
          </Mono>
        </div>
      </div>
    </>
  );
};

// -------------------------------------------------------------------------
// Scene 4 — MODULE 02: X-ray weak spots + custom demo assembly
// -------------------------------------------------------------------------
const SPOTS = [
  { x: 250, y: 395, r: 70, label: "НЕТ ОНЛАЙН-ЗАПИСИ", lx: 360, ly: 330, at: 28.42 },
  { x: 700, y: 120, r: 58, label: "ОТВЕТ ЧЕРЕЗ 2 ДНЯ", lx: 330, ly: 100, at: 28.66 },
  { x: 650, y: 470, r: 80, label: "НЕТ CRM", lx: 450, ly: 590, at: 28.9 },
];
const FIXES = ["ЧАТ-БОТ ОНЛАЙН-ЗАПИСИ 24/7", "АВТООТВЕТ ЗА 30 СЕКУНД", "CRM-ВОРОНКА ЗАЯВОК"];

const SiteMock: React.FC<{ xray?: boolean }> = ({ xray }) => {
  const c = xray ? "#E0F7FF" : WHITE;
  const sw = xray ? 4 : 3;
  return (
    <g fill="none" stroke={c} strokeWidth={sw} opacity={xray ? 1 : 0.75}>
      <rect x={0} y={0} width={860} height={620} rx={14} />
      <line x1={0} y1={56} x2={860} y2={56} />
      {[28, 58, 88].map((x) => (
        <circle key={x} cx={x} cy={28} r={9} />
      ))}
      <rect x={40} y={86} width={150} height={30} />
      {[480, 580, 680, 770].map((x) => (
        <line key={x} x1={x} y1={101} x2={x + 60} y2={101} />
      ))}
      <rect x={40} y={150} width={420} height={190} />
      <line x1={40} y1={150} x2={460} y2={340} />
      <line x1={460} y1={150} x2={40} y2={340} />
      {[170, 210, 250, 290].map((y, i) => (
        <line key={y} x1={500} y1={y} x2={i === 0 ? 820 : 760 - i * 40} y2={y} strokeWidth={i === 0 ? 10 : sw} />
      ))}
      <rect x={160} y={370} width={180} height={52} rx={26} />
      <rect x={480} y={400} width={340} height={44} />
      <rect x={480} y={460} width={340} height={44} />
      <rect x={480} y={520} width={160} height={44} />
      {[60, 180, 300].map((x) => (
        <rect key={x} x={x - 20} y={460} width={100} height={110} />
      ))}
      {xray && (
        <>
          <path d="M600,26 a14,14 0 1 1 28,0 l0,10 l-28,0 z" />
          <circle cx={700} cy={120} r={20} />
        </>
      )}
    </g>
  );
};

const Scene4: React.FC<{ gf: number }> = ({ gf }) => {
  const draw = rs(gf, 26.1, 26.9, EASE);
  const scanY = interpolate(gf, [s2f(26.6), s2f(28.4)], [-170, 640], { ...clamp, easing: Easing.inOut(Easing.quad) });
  const scanOn = gf >= s2f(26.6) && gf < s2f(28.6);
  const card = rs(gf, 29.5, 30.0, EASE);
  const ready = rs(gf, 31.18, 31.5, BACK);
  const OX = 110;
  const OY = 400;
  return (
    <>
      <ModuleHeader gf={gf} at={26.12} num="02" title="РЕНТГЕН БИЗНЕСА" sub="x-ray analysis" />
      <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0 }}>
        <defs>
          <clipPath id="bpXray">
            <rect x={0} y={scanY} width={860} height={170} />
          </clipPath>
          <linearGradient id="bpBand" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor={CYAN} stopOpacity={0} />
            <stop offset="0.5" stopColor={CYAN} stopOpacity={0.35} />
            <stop offset="1" stopColor={CYAN} stopOpacity={0} />
          </linearGradient>
        </defs>
        <g transform={`translate(${OX},${OY})`}>
          <g style={{ clipPath: `inset(0 0 ${(1 - draw) * 100}% 0)` }}>
            <SiteMock />
          </g>
          {scanOn && (
            <>
              <rect x={0} y={scanY} width={860} height={170} fill="url(#bpBand)" />
              <g clipPath="url(#bpXray)" style={{ filter: "drop-shadow(0 0 8px #38BDF8)" }}>
                <SiteMock xray />
              </g>
              <line x1={-20} x2={880} y1={scanY + 85} y2={scanY + 85} stroke={CYAN} strokeWidth={3} />
            </>
          )}
          {SPOTS.map((s, i) => {
            const k = rs(gf, s.at, s.at + 0.35, EASE);
            const lk = rs(gf, s.at + 0.2, s.at + 0.5);
            const fixed = rs(gf, 29.72 + i * 0.3, 30.1 + i * 0.3);
            const col = fixed > 0.5 ? CYAN : ORANGE;
            return (
              <g key={i}>
                <circle cx={s.x} cy={s.y} r={s.r} fill="none" stroke={col} strokeWidth={7} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - k} transform={`rotate(-90 ${s.x} ${s.y})`} />
                {k > 0 && <circle cx={s.x} cy={s.y} r={s.r + 14} fill="none" stroke={col} strokeWidth={2} strokeDasharray="6 8" opacity={k * 0.7} />}
                <g opacity={lk}>
                  <line x1={s.x + (s.lx > s.x ? s.r : -s.r) * 0.7} y1={s.y} x2={s.lx} y2={s.ly + 8} stroke={col} strokeWidth={3} />
                  <rect x={s.lx - 6} y={s.ly - 28} width={s.label.length * 21 + 30} height={46} fill={NAVY} stroke={col} strokeWidth={3} />
                  <text x={s.lx + 9} y={s.ly + 4} fill={col} fontFamily={MONO} fontWeight={700} fontSize={26} letterSpacing={1}>
                    {fixed > 0.5 ? "✓ " : "⚠ "}
                    {s.label}
                  </text>
                </g>
              </g>
            );
          })}
        </g>
        <text x={OX} y={OY - 18} fill={DIM} fontFamily={MONO} fontSize={20} letterSpacing={3} opacity={draw}>
          LOTUS-STUDIO.DE · SCAN {Math.round(interpolate(gf, [s2f(26.6), s2f(28.4)], [0, 100], clamp))}%
        </text>
      </svg>
      {/* demo assembly */}
      <div
        style={{
          position: "absolute",
          left: 110,
          top: 1080,
          width: 860,
          height: 380,
          border: `4px solid ${WHITE}`,
          background: "rgba(14,34,64,0.9)",
          clipPath: `inset(0 ${(1 - card) * 100}% 0 0)`,
          padding: "24px 30px",
          boxSizing: "border-box",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontFamily: IMPACT, fontSize: 60, color: WHITE }}>ПЕРСОНАЛЬНОЕ ДЕМО</div>
          <Mono size={20} color={CYAN}>
            for: lotus
          </Mono>
        </div>
        {FIXES.map((f, i) => {
          const k = rs(gf, 29.72 + i * 0.3, 30.2 + i * 0.3, BACK);
          return (
            <div
              key={i}
              style={{
                marginTop: 18,
                display: "flex",
                alignItems: "center",
                gap: 18,
                opacity: Math.min(1, k * 2),
                transform: `translateX(${(1 - k) * 500}px)`,
              }}
            >
              <div style={{ width: 54, height: 54, background: CYAN, color: NAVY, fontFamily: HEAD, fontSize: 34, display: "flex", alignItems: "center", justifyContent: "center" }}>✓</div>
              <div style={{ flex: 1, border: `2px solid ${CYAN}`, padding: "8px 18px", fontFamily: MONO, fontWeight: 700, fontSize: 28, color: WHITE, letterSpacing: 1 }}>{f}</div>
            </div>
          );
        })}
      </div>
      <Stamp k={ready} text="DEMO READY" size={64} rot={-7} style={{ left: 600, top: 1385 }} />
    </>
  );
};

// -------------------------------------------------------------------------
// Scene 5 — MODULE 03: direct dispatch to the business owner
// -------------------------------------------------------------------------
const BZ = { p0: [300, 640], c1: [760, 600], c2: [880, 820], p1: [790, 1010] };
const bez = (u: number) => {
  const m = 1 - u;
  const f = (i: 0 | 1) => m * m * m * BZ.p0[i] + 3 * m * m * u * BZ.c1[i] + 3 * m * u * u * BZ.c2[i] + u * u * u * BZ.p1[i];
  return [f(0), f(1)];
};
const bezAngle = (u: number) => {
  const a = bez(Math.max(0, u - 0.01));
  const b = bez(Math.min(1, u + 0.01));
  return (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI;
};

const Scene5: React.FC<{ gf: number }> = ({ gf }) => {
  const t = gf / FPS;
  const nodes = rs(gf, 32.4, 33.0, BACK);
  const path = rs(gf, 33.26, 34.0, EASE);
  const fly = rs(gf, 34.3, 35.76, EASE);
  const cross = rs(gf, 35.12, 35.4, EASE);
  const sent = rs(gf, 35.76, 36.1, BACK);
  const bubble = rs(gf, 36.3, 36.8, BACK);
  const [ex, ey] = bez(fly);
  const ea = bezAngle(fly);
  const node = (x: number, y: number, w: number, label: string, sub: string, col: string, k: number) => (
    <div
      style={{
        position: "absolute",
        left: x - w / 2,
        top: y - 75,
        width: w,
        height: 150,
        border: `4px solid ${col}`,
        background: "rgba(14,34,64,0.92)",
        boxShadow: `0 0 40px ${col}55`,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        opacity: Math.min(1, k * 2),
        transform: `scale(${mix(0.6, 1, k)})`,
      }}
    >
      <div style={{ fontFamily: IMPACT, fontSize: 56, color: col, lineHeight: 1.1 }}>{label}</div>
      <Mono size={18} color={DIM}>
        {sub}
      </Mono>
    </div>
  );
  return (
    <>
      <ModuleHeader gf={gf} at={32.42} num="03" title="ПРЯМАЯ ДОСТАВКА" sub="direct dispatch" />
      <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0 }}>
        {/* abandoned route via the exchange */}
        <line x1={300} y1={720} x2={260} y2={950} stroke={DIM} strokeWidth={3} strokeDasharray="10 12" opacity={nodes * 0.6} />
        <path
          d={`M${BZ.p0[0]},${BZ.p0[1]} C${BZ.c1[0]},${BZ.c1[1]} ${BZ.c2[0]},${BZ.c2[1]} ${BZ.p1[0]},${BZ.p1[1]}`}
          fill="none"
          stroke={CYAN}
          strokeWidth={5}
          strokeDasharray="18 14"
          strokeDashoffset={-t * 60}
          style={{ clipPath: `inset(0 ${(1 - path) * 100}% 0 0)` }}
        />
        <path
          d={`M${BZ.p0[0]},${BZ.p0[1]} C${BZ.c1[0]},${BZ.c1[1]} ${BZ.c2[0]},${BZ.c2[1]} ${BZ.p1[0]},${BZ.p1[1]}`}
          fill="none"
          stroke={ORANGE}
          strokeWidth={8}
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={1 - fly}
          style={{ filter: `drop-shadow(0 0 10px ${ORANGE})` }}
        />
      </svg>
      {node(300, 565, 380, "ИИ-ОХОТНИК", "модуль 01 + 02", CYAN, nodes)}
      {/* crossed-out exchange */}
      <div style={{ position: "absolute", left: 120, top: 950, width: 280, height: 120, opacity: Math.min(1, nodes * 2) * 0.85 }}>
        <div style={{ position: "absolute", inset: 0, border: `3px dashed ${DIM}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ fontFamily: IMPACT, fontSize: 50, color: DIM }}>БИРЖА</div>
        </div>
        <svg width={280} height={120} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
          <line x1={-10} y1={-10} x2={-10 + 300 * cross} y2={-10 + 140 * cross} stroke={ORANGE} strokeWidth={12} strokeLinecap="round" />
          <line x1={290} y1={-10} x2={290 - 300 * cross} y2={-10 + 140 * cross} stroke={ORANGE} strokeWidth={12} strokeLinecap="round" />
        </svg>
      </div>
      {node(790, 1085, 400, "ВЛАДЕЛЕЦ", "бизнеса · лично", sent > 0.5 ? ORANGE : WHITE, nodes)}
      {/* envelope */}
      {fly > 0 && fly < 1 && (
        <div style={{ position: "absolute", left: ex - 60, top: ey - 40, width: 120, height: 80, transform: `rotate(${ea * 0.35}deg) scale(${1 + 0.25 * Math.sin(fly * Math.PI)})` }}>
          <svg width={120} height={80} viewBox="0 0 120 80">
            <rect x={2} y={2} width={116} height={76} rx={6} fill={WHITE} stroke={ORANGE} strokeWidth={4} />
            <path d="M4,6 L60,46 L116,6" fill="none" stroke={ORANGE} strokeWidth={4} />
          </svg>
        </div>
      )}
      <Stamp k={sent} text="ОТПРАВЛЕНО ВЛАДЕЛЬЦУ" size={70} rot={-6} style={{ left: 85, top: 1215 }} />
      {/* message preview */}
      <div
        style={{
          position: "absolute",
          left: 360,
          top: 770,
          width: 300,
          padding: "16px 20px",
          border: `3px solid ${CYAN}`,
          borderRadius: "18px 18px 18px 4px",
          background: "rgba(10,25,47,0.95)",
          opacity: Math.min(1, bubble * 2),
          transform: `scale(${mix(0.5, 1, bubble)})`,
          transformOrigin: "0 100%",
        }}
      >
        <Mono size={18} color={CYAN}>
          новое сообщение
        </Mono>
        <div style={{ fontFamily: HEAD, fontSize: 24, color: WHITE, marginTop: 8, lineHeight: 1.3 }}>Готовое демо для вашего бизнеса ✓</div>
      </div>
    </>
  );
};

// -------------------------------------------------------------------------
// Subtitles — clean navy pill, orange active word, 24px gap between words
// -------------------------------------------------------------------------
const CHUNK_STARTS = CHUNKS.map((c) => c.start);

const Subtitles: React.FC<{ gf: number }> = ({ gf }) => {
  const t = gf / FPS;
  let ci = -1;
  for (let i = 0; i < CHUNK_STARTS.length; i++) if (CHUNK_STARTS[i] <= t) ci = i;
  if (ci < 0) return null;
  const chunk = CHUNKS[mod(ci, CHUNKS.length)];
  const nextStart = ci + 1 < CHUNKS.length ? CHUNKS[mod(ci + 1, CHUNKS.length)].start : chunk.end + 1;
  if (t > Math.min(nextStart, chunk.end + 0.7)) return null;
  const pop = interpolate(gf - s2f(chunk.start), [0, 7], [0, 1], { ...clamp, easing: OUT });
  return (
    <div style={{ position: "absolute", left: 50, right: 50, bottom: 240, display: "flex", justifyContent: "center" }}>
      <div
        style={{
          background: "rgba(10,25,47,0.94)",
          border: `3px solid ${CYAN}`,
          borderRadius: 999,
          padding: "18px 40px",
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          columnGap: 24,
          rowGap: 10,
          maxWidth: 980,
          boxShadow: "0 18px 50px rgba(0,0,0,0.55), 0 0 30px rgba(56,189,248,0.25)",
          transform: `translateY(${(1 - pop) * 22}px) scale(${mix(0.94, 1, pop)})`,
          opacity: pop,
        }}
      >
        {chunk.words.map((w, i) => {
          const active = t >= w.start && t < w.end + 0.05;
          const done = t >= w.end;
          return (
            <span
              key={i}
              style={{
                fontFamily: HEAD,
                fontWeight: 900,
                fontSize: 54,
                lineHeight: 1.15,
                textTransform: "uppercase",
                padding: "0 12px",
                borderRadius: 14,
                whiteSpace: "nowrap",
                color: active ? NAVY : done ? WHITE : "rgba(248,250,252,0.45)",
                background: active ? ORANGE : "transparent",
              }}
            >
              {w.word}
            </span>
          );
        })}
      </div>
    </div>
  );
};

// -------------------------------------------------------------------------
// Root composition
// -------------------------------------------------------------------------
const MIDDLE: { from: number; to: number; C: React.FC<{ gf: number }>; sheet: string }[] = [
  { from: S2, to: S3, C: Scene2, sheet: "A-02" },
  { from: S3, to: S4, C: Scene3, sheet: "A-03" },
  { from: S4, to: S5, C: Scene4, sheet: "A-04" },
  { from: S5, to: S6, C: Scene5, sheet: "A-05" },
];

export const BlueprintArchitectReel: React.FC = () => {
  const gf = useCurrentFrame();
  const t = gf / FPS;
  const inMiddle = gf >= S2 && gf < S6 + XFADE;
  const sceneIdx = MIDDLE.reduce((a, m, i) => (gf >= m.from ? i : a), 0);
  return (
    <AbsoluteFill style={{ background: NAVY, overflow: "hidden" }}>
      <Audio src={staticFile("blueprint_reel/voice.mp3")} />
      {gf >= S6 && <Ending gf={gf} />}
      {gf < S2 && <Intro gf={gf} />}
      {inMiddle && (
        <AbsoluteFill style={{ opacity: interpolate(gf, [S6, S6 + XFADE], [1, 0], clamp) }}>
          <GridSheet sheetNo={MIDDLE[mod(sceneIdx, MIDDLE.length)].sheet} shift={mod((t - 8) * 6, 200)} />
          <Cam gf={gf}>
            {MIDDLE.map(({ from, to, C }, i) => (
              <SceneShell key={i} gf={gf} from={from} to={to}>
                <C gf={gf} />
              </SceneShell>
            ))}
          </Cam>
        </AbsoluteFill>
      )}
      <Subtitles gf={gf} />
      <div style={{ position: "absolute", left: 80, right: 80, top: 66, display: "flex", opacity: inMiddle ? 0.8 : 0 }}>
        <Mono size={18} color={DIM} style={{ flex: 1 }}>
          make it easy ai · blueprint
        </Mono>
        <Mono size={18} color={DIM}>
          {String(Math.floor(t)).padStart(2, "0")}.{String(mod(Math.floor(t * 10), 10))}s / 44.0s
        </Mono>
      </div>
    </AbsoluteFill>
  );
};

export const BLUEPRINT_DURATION = TOTAL;
