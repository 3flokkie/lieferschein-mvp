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
import wordsData from "../public/zero_code_reel/words.json";

/*
 * =========================================================================
 * ZERO CODE APP REEL — 1080x1920 @ 60 FPS, 3000 FRAMES (50s)
 *
 *   01  0.00 –  8.45s : "2026" slam · "SAAS ЗА 2 ВЕЧЕРА" · "0 СТРОЧЕК КОДА"
 *   02  8.45 – 13.95s : legacy quote — crossed-out "6 МЕСЯЦЕВ / $20,000"
 *   03 13.95 – 28.40s : terminal prompt → 3D browser flips: DB → UI → Stripe → LIVE (15 мин)
 *   04 28.40 – 36.15s : "100 КЛИЕНТОВ × $19/МЕС = $1,900/МЕС" + MRR + Stripe notifications
 *   05 36.15 – 43.45s : "НЕ ЗУБРИТЬ СИНТАКСИС" vs "СТАВИТЬ ЗАДАЧИ ИИ"
 *   06 43.45 – 50.00s : CTA — НАПИШИ «СЕРВИС»
 *
 * Palette: deep violet-cobalt / electric violet / ice-cyan / crisp silver.
 * Transitions: radial wipes between scenes, slide-in panels, 3D browser flips.
 * Camera: constant drift + punch zoom on key words.
 * All cyclic indices go through mod().
 * =========================================================================
 */

const FPS = 60;
const TOTAL = 3000;
const W = 1080;
const H = 1920;

const C = {
  bg: "#070612",
  bg2: "#0D0B24",
  violet: "#8B5CF6",
  violetDeep: "#5B21B6",
  cyan: "#38BDF8",
  silver: "#E2E8F0",
  muted: "#8A8FB3",
  dim: "#4B4F75",
  panel: "rgba(13,11,36,0.92)",
  border: "rgba(139,92,246,0.42)",
  borderCyan: "rgba(56,189,248,0.45)",
};

const SANS = "'Avenir Next', 'Futura', 'Montserrat', 'Helvetica Neue', Arial, sans-serif";
const MONO = "'JetBrains Mono', 'SF Mono', Menlo, Consolas, monospace";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const EXPO_OUT = Easing.bezier(0.16, 1, 0.3, 1);
const sec = (s: number) => Math.round(s * FPS);

/** Safe modulo — always 0..m-1, even for negative / fractional n. */
const mod = (n: number, m: number) => ((Math.floor(n) % m) + m) % m;

const rand = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

const ease = (f: number, a: number, b: number, from = 0, to = 1) =>
  interpolate(f, [a, b], [from, to], { ...clamp, easing: EXPO_OUT });

const sp = (
  f: number,
  at: number,
  fps: number,
  config: { damping?: number; stiffness?: number; mass?: number } = { damping: 14, stiffness: 170, mass: 0.6 },
) => spring({ frame: Math.max(0, f - at), fps, config });

const typed = (text: string, f: number, at: number, cps = 28) => {
  const n = Math.max(0, Math.floor(((f - at) / FPS) * cps));
  return text.slice(0, Math.min(text.length, n));
};

const money = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;

// -------------------------------------------------------------------------
// Words — ASR fixes
// -------------------------------------------------------------------------
type Word = { word: string; start: number; end: number };

const FIXES: [RegExp, string][] = [
  [/^посивного$/, "пассивного"],
  [/^синтоксис,$/, "синтаксис,"],
  [/^умения$/, "умение"],
];

const WORDS: Word[] = (wordsData as Word[]).flatMap((w): Word[] => {
  if (w.word === "кодоруками.") {
    const mid = (w.start + w.end) / 2;
    return [
      { word: "кода", start: w.start, end: mid },
      { word: "руками.", start: mid, end: w.end },
    ];
  }
  return [{ ...w, word: FIXES.reduce((acc, [re, to]) => acc.replace(re, to), w.word) }];
});

type Chunk = { words: Word[]; start: number; end: number };
const CHUNKS: Chunk[] = (() => {
  const out: Chunk[] = [];
  let cur: Word[] = [];
  const flush = () => {
    if (!cur.length) return;
    out.push({ words: cur, start: cur[0].start, end: cur[cur.length - 1].end });
    cur = [];
  };
  WORDS.forEach((w, i) => {
    const prev = WORDS[i - 1];
    if (cur.length && prev && w.start - prev.end > 0.28) flush();
    cur.push(w);
    const punct = /[.,!?:;»]$/.test(w.word);
    const letters = cur.reduce((a, x) => a + x.word.length, 0);
    if (punct || cur.length >= 3 || letters > 16) flush();
  });
  flush();
  return out;
})();

const KEY_RE =
  /^2026$|сервис|подписк|вечера|строчки|руками|месяцы|тысяч|долларов|терминал|агент|базу|интерфейс|оплату|сеть|^15$|^100$|^19$|пассивного|навык|синтаксис|задачи|нейросети|Напиши|список|инструментов/i;

const clean = (s: string) => s.replace(/[.,!?«»:;]/g, "");

// -------------------------------------------------------------------------
// Scenes timeline
// -------------------------------------------------------------------------
const SCENES: [number, number][] = [
  [0, sec(8.45)],
  [sec(8.45), sec(13.95)],
  [sec(13.95), sec(28.4)],
  [sec(28.4), sec(36.15)],
  [sec(36.15), sec(43.45)],
  [sec(43.45), TOTAL],
];
const WIPE = 26;
const WIPE_ORIGINS: [number, number][] = [
  [540, 960],
  [980, 260],
  [100, 400],
  [540, 1300],
  [1000, 900],
  [540, 700],
];

const sceneIndex = (f: number) => {
  let idx = 0;
  SCENES.forEach(([s], i) => {
    if (f >= s) idx = i;
  });
  return idx;
};

// -------------------------------------------------------------------------
// Camera — drift + punch zoom on key words
// -------------------------------------------------------------------------
const PUNCHES = WORDS.filter((w) => KEY_RE.test(clean(w.word))).map((w) => sec(w.start));

const useCamera = (f: number, fps: number) => {
  let zoom = 1;
  let rot = 0;
  PUNCHES.forEach((p, i) => {
    if (f < p || f > p + 60) return;
    const s = sp(f, p, fps, { damping: 12, stiffness: 230, mass: 0.5 });
    const pulse = s * interpolate(f - p, [0, 55], [1, 0], clamp);
    zoom += 0.045 * pulse;
    rot += (mod(i, 2) === 0 ? 0.6 : -0.6) * pulse;
  });
  const t = f / fps;
  return {
    zoom: zoom + Math.sin(t * 0.35) * 0.012,
    rot: rot + Math.sin(t * 0.27) * 0.35,
    dx: Math.sin(t * 0.43) * 12,
    dy: Math.cos(t * 0.31) * 10,
    rx: Math.sin(t * 0.5) * 1.6,
    ry: Math.cos(t * 0.38) * 2.2,
  };
};

// -------------------------------------------------------------------------
// Background — cobalt depth, perspective grid floor, bokeh DOF
// -------------------------------------------------------------------------
const BOKEH = Array.from({ length: 22 }, (_, i) => ({
  x: rand(i) * W,
  y: rand(i + 40) * H,
  r: 30 + rand(i + 80) * 110,
  c: mod(i, 3) === 0 ? C.cyan : mod(i, 3) === 1 ? C.violet : C.silver,
  sp: 0.15 + rand(i + 120) * 0.5,
  o: 0.08 + rand(i + 160) * 0.18,
}));

const Background: React.FC<{ f: number; cam: ReturnType<typeof useCamera> }> = ({ f, cam }) => {
  const t = f / FPS;
  const si = sceneIndex(f);
  const hue = [C.violet, C.violetDeep, C.cyan, C.violet, C.cyan, C.violet][si];
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg, overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 900px 1100px at ${540 + Math.sin(t * 0.3) * 160}px ${760 + Math.cos(t * 0.25) * 120}px, ${hue}38 0%, ${C.bg2} 45%, ${C.bg} 80%)`,
        }}
      />
      {/* perspective floor grid */}
      <div
        style={{
          position: "absolute",
          left: -600,
          right: -600,
          top: 1100,
          height: 1400,
          transform: `translateX(${-cam.dx * 2}px) perspective(700px) rotateX(68deg)`,
          transformOrigin: "50% 0%",
          backgroundImage: `linear-gradient(${C.violet}55 2px, transparent 2px), linear-gradient(90deg, ${C.cyan}33 2px, transparent 2px)`,
          backgroundSize: "90px 90px",
          backgroundPosition: `0px ${mod(f * 1.4, 90)}px`,
          maskImage: "linear-gradient(to bottom, rgba(0,0,0,0.9), transparent 70%)",
          WebkitMaskImage: "linear-gradient(to bottom, rgba(0,0,0,0.9), transparent 70%)",
          opacity: 0.55,
        }}
      />
      {/* horizon glow */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 1060,
          height: 90,
          background: `linear-gradient(90deg, transparent, ${C.violet}66, ${C.cyan}66, transparent)`,
          filter: "blur(30px)",
        }}
      />
      {/* bokeh — out-of-focus background (DOF) */}
      {BOKEH.map((b, i) => {
        const y = mod(b.y - f * b.sp, H + 300) - 150;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: b.x - b.r + cam.dx * -1.5,
              top: y - b.r,
              width: b.r * 2,
              height: b.r * 2,
              borderRadius: "50%",
              background: `radial-gradient(circle, ${b.c} 0%, ${b.c}00 70%)`,
              opacity: b.o * (0.7 + 0.3 * Math.sin(t * 1.3 + i)),
              filter: "blur(16px)",
            }}
          />
        );
      })}
      {/* fine dot matrix */}
      <AbsoluteFill
        style={{
          backgroundImage: `radial-gradient(${C.silver}14 1.5px, transparent 1.5px)`,
          backgroundSize: "36px 36px",
          backgroundPosition: `${mod(f * 0.2, 36)}px 0px`,
          opacity: 0.6,
        }}
      />
    </AbsoluteFill>
  );
};

const Overlay: React.FC<{ f: number }> = ({ f }) => (
  <>
    <AbsoluteFill
      style={{
        background: "radial-gradient(ellipse at center, transparent 55%, rgba(3,2,10,0.85) 100%)",
        pointerEvents: "none",
      }}
    />
    <AbsoluteFill
      style={{
        backgroundImage: "repeating-linear-gradient(0deg, rgba(255,255,255,0.025) 0px, rgba(255,255,255,0.025) 1px, transparent 1px, transparent 4px)",
        backgroundPosition: `0px ${mod(f, 4)}px`,
        pointerEvents: "none",
      }}
    />
  </>
);

// -------------------------------------------------------------------------
// HUD — monospace telemetry
// -------------------------------------------------------------------------
const SCENE_TAGS = ["HOOK", "LEGACY", "BUILD", "REVENUE", "SKILL", "CTA"];

const HUD: React.FC<{ f: number }> = ({ f }) => {
  const t = f / FPS;
  const si = sceneIndex(f);
  const tc = `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(Math.floor(t % 60)).padStart(2, "0")}:${String(mod(f, 60)).padStart(2, "0")}`;
  return (
    <>
      <div
        style={{
          position: "absolute",
          top: 64,
          left: 60,
          right: 60,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontFamily: MONO,
          fontSize: 24,
          letterSpacing: 2,
          color: C.muted,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span
            style={{
              width: 14,
              height: 14,
              borderRadius: 7,
              background: C.cyan,
              boxShadow: `0 0 14px ${C.cyan}`,
              opacity: mod(f / 24, 2) === 0 ? 1 : 0.3,
            }}
          />
          <span style={{ color: C.silver }}>ZERO_CODE</span>
          <span>// SCN {String(si + 1).padStart(2, "0")}/06 · {SCENE_TAGS[si]}</span>
        </div>
        <span>{tc}</span>
      </div>
      {/* bottom progress */}
      <div style={{ position: "absolute", left: 60, right: 60, bottom: 70, height: 4, background: `${C.silver}1a`, borderRadius: 2 }}>
        <div
          style={{
            width: `${(f / TOTAL) * 100}%`,
            height: "100%",
            borderRadius: 2,
            background: `linear-gradient(90deg, ${C.violet}, ${C.cyan})`,
            boxShadow: `0 0 12px ${C.cyan}`,
          }}
        />
        {SCENES.map(([s], i) => (
          <div key={i} style={{ position: "absolute", left: `${(s / TOTAL) * 100}%`, top: -6, width: 2, height: 16, background: C.silver, opacity: 0.4 }} />
        ))}
      </div>
    </>
  );
};

// -------------------------------------------------------------------------
// Building blocks
// -------------------------------------------------------------------------
type Dir = "left" | "right" | "top" | "bottom";

const SlidePanel: React.FC<{
  f: number;
  at: number;
  from: Dir;
  style: React.CSSProperties;
  accent?: string;
  children: React.ReactNode;
}> = ({ f, at, from, style, accent = C.violet, children }) => {
  const p = sp(f, at, FPS, { damping: 16, stiffness: 150, mass: 0.7 });
  const d = (1 - p) * 700;
  const tx = from === "left" ? -d : from === "right" ? d : 0;
  const ty = from === "top" ? -d : from === "bottom" ? d : 0;
  if (f < at) return null;
  return (
    <div
      style={{
        position: "absolute",
        background: C.panel,
        border: `2px solid ${accent}77`,
        borderRadius: 28,
        boxShadow: `0 30px 80px rgba(0,0,0,0.6), 0 0 0 1px ${accent}22, inset 0 1px 0 ${C.silver}22, 0 0 50px ${accent}33`,
        transform: `translate(${tx}px, ${ty}px) skewX(${(from === "left" ? 1 : from === "right" ? -1 : 0) * (1 - p) * 8}deg)`,
        opacity: interpolate(p, [0, 0.3], [0, 1], clamp),
        overflow: "hidden",
        ...style,
      }}
    >
      {/* accent edge strip */}
      <div
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          [from === "right" ? "right" : "left"]: 0,
          width: 6,
          background: `linear-gradient(180deg, ${accent}, ${accent}00)`,
        }}
      />
      {children}
    </div>
  );
};

const Tag: React.FC<{ children: React.ReactNode; color?: string; style?: React.CSSProperties }> = ({
  children,
  color = C.cyan,
  style,
}) => (
  <div
    style={{
      fontFamily: MONO,
      fontSize: 22,
      letterSpacing: 3,
      color,
      textTransform: "uppercase",
      ...style,
    }}
  >
    {children}
  </div>
);

const Strike: React.FC<{ p: number; color?: string; tilt?: number; thick?: number }> = ({
  p,
  color = C.violet,
  tilt = -4,
  thick = 12,
}) => (
  <div
    style={{
      position: "absolute",
      left: -14,
      top: "50%",
      height: thick,
      width: `calc(${p * 100}% + ${p * 28}px)`,
      background: color,
      borderRadius: thick,
      transform: `translateY(-50%) rotate(${tilt}deg)`,
      transformOrigin: "0% 50%",
      boxShadow: `0 0 24px ${color}, 0 0 4px ${C.silver}`,
    }}
  />
);

const Check: React.FC<{ p: number; size?: number; color?: string }> = ({ p, size = 40, color = C.cyan }) => (
  <svg width={size} height={size} viewBox="0 0 40 40">
    <circle cx={20} cy={20} r={18} fill={`${color}22`} stroke={color} strokeWidth={2.5} opacity={Math.min(1, p * 2)} />
    <path
      d="M11 21 L18 28 L30 13"
      fill="none"
      stroke={color}
      strokeWidth={4}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeDasharray={34}
      strokeDashoffset={34 * (1 - p)}
    />
  </svg>
);

// Flat 2D character with rim light + soft floor shadow
const Kid: React.FC<{ f: number; x: number; y: number; scale?: number; pose?: "laptop" | "point"; at?: number }> = ({
  f,
  x,
  y,
  scale = 1,
  pose = "laptop",
  at = 0,
}) => {
  const p = sp(f, at, FPS, { damping: 13, stiffness: 140, mass: 0.7 });
  const t = f / FPS;
  const bob = Math.sin(t * 3.2) * 6;
  const blink = mod(f, 170) < 7 ? 0.15 : 1;
  const typing = pose === "laptop" ? Math.sin(t * 22) * 2 : 0;
  const glow = 0.6 + 0.4 * Math.sin(t * 4);
  return (
    <div style={{ position: "absolute", left: x, top: y, width: 300 * scale, height: 420 * scale, opacity: p }}>
      {/* floor shadow */}
      <div
        style={{
          position: "absolute",
          left: "10%",
          right: "10%",
          bottom: -18 * scale,
          height: 46 * scale,
          borderRadius: "50%",
          background: "rgba(0,0,0,0.75)",
          filter: `blur(${14 * scale}px)`,
          transform: `scaleX(${1 - bob / 80})`,
        }}
      />
      <svg
        width={300 * scale}
        height={420 * scale}
        viewBox="0 0 300 420"
        style={{
          position: "absolute",
          transform: `translateY(${(1 - p) * 120 + bob}px)`,
          filter: `drop-shadow(0 0 2px ${C.cyan}) drop-shadow(0 0 3px ${C.silver}) drop-shadow(0 0 18px ${C.violet}cc)`,
          overflow: "visible",
        }}
      >
        {/* legs */}
        <rect x={108} y={300} width={34} height={100} rx={14} fill="#1E1B4B" />
        <rect x={158} y={300} width={34} height={100} rx={14} fill="#1E1B4B" />
        <rect x={98} y={386} width={52} height={22} rx={10} fill={C.silver} />
        <rect x={150} y={386} width={52} height={22} rx={10} fill={C.silver} />
        {/* hoodie body */}
        <path d="M80 190 Q150 150 220 190 L232 318 Q150 336 68 318 Z" fill={C.violet} />
        <path d="M118 190 Q150 222 182 190" fill="none" stroke={C.violetDeep} strokeWidth={6} />
        <path d="M150 210 L150 300" stroke={C.violetDeep} strokeWidth={4} />
        {/* arms */}
        {pose === "point" ? (
          <>
            <path d="M84 200 Q48 250 70 300" fill="none" stroke={C.violet} strokeWidth={30} strokeLinecap="round" />
            <path d="M214 200 Q262 170 282 112" fill="none" stroke={C.violet} strokeWidth={30} strokeLinecap="round" />
            <circle cx={284} cy={104} r={17} fill="#F3D2BF" />
          </>
        ) : (
          <>
            <path d={`M88 205 Q70 265 112 ${282 + typing}`} fill="none" stroke={C.violet} strokeWidth={30} strokeLinecap="round" />
            <path d={`M212 205 Q230 265 188 ${282 - typing}`} fill="none" stroke={C.violet} strokeWidth={30} strokeLinecap="round" />
          </>
        )}
        {/* head */}
        <circle cx={150} cy={118} r={66} fill="#F3D2BF" />
        <path d="M84 110 Q86 40 150 44 Q218 42 218 112 Q196 76 150 80 Q108 78 84 110 Z" fill="#14123A" />
        <ellipse cx={126} cy={124} rx={7} ry={9 * blink} fill="#14123A" />
        <ellipse cx={174} cy={124} rx={7} ry={9 * blink} fill="#14123A" />
        <path d="M134 150 Q150 162 166 150" fill="none" stroke="#14123A" strokeWidth={5} strokeLinecap="round" />
        {/* headphones */}
        <path d="M82 120 Q80 46 150 40 Q220 46 218 120" fill="none" stroke={C.silver} strokeWidth={8} />
        <rect x={70} y={104} width={22} height={44} rx={10} fill={C.cyan} />
        <rect x={208} y={104} width={22} height={44} rx={10} fill={C.cyan} />
        {/* laptop */}
        {pose === "laptop" && (
          <>
            <path d="M70 250 L230 250 L216 286 L84 286 Z" fill={C.silver} />
            <rect x={60} y={284} width={180} height={14} rx={6} fill="#AEB6C8" />
            <circle cx={150} cy={266} r={8} fill={C.cyan} opacity={glow} />
            {/* screen glow on face */}
            <ellipse cx={150} cy={170} rx={70} ry={30} fill={C.cyan} opacity={0.12 * glow} />
          </>
        )}
      </svg>
    </div>
  );
};

// -------------------------------------------------------------------------
// SCENE 1 — HOOK
// -------------------------------------------------------------------------
const Scene1: React.FC<{ f: number }> = ({ f }) => {
  const slam = sp(f, 4, FPS, { damping: 10, stiffness: 220, mass: 0.6 });
  const glitch = f < 40 ? Math.sin(f * 1.7) * 10 * (1 - f / 40) : Math.sin(f * 0.3) * 1.5;
  const s2026 = 2.4 - 1.4 * slam;
  const evening1 = ease(f, sec(4.9), sec(5.2));
  const evening2 = ease(f, sec(5.15), sec(5.45));
  const lines = 0;
  return (
    <AbsoluteFill>
      <Tag style={{ position: "absolute", top: 170, left: 0, right: 0, textAlign: "center", opacity: ease(f, 10, 30) }}>
        ▸ YEAR_INDEX · ROLE: ШКОЛЬНИК · STACK: AI-AGENT
      </Tag>
      {/* 2026 slam with chromatic split */}
      <div
        style={{
          position: "absolute",
          top: 210,
          left: 0,
          right: 0,
          height: 380,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          transform: `scale(${s2026})`,
          opacity: interpolate(slam, [0, 0.2], [0, 1], clamp),
        }}
      >
        {[
          { c: C.cyan, dx: -glitch, o: 0.85 },
          { c: C.violet, dx: glitch, o: 0.85 },
          { c: C.silver, dx: 0, o: 1 },
        ].map((l, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              fontFamily: SANS,
              fontWeight: 900,
              fontSize: 330,
              letterSpacing: -14,
              lineHeight: 1,
              color: l.c,
              opacity: l.o,
              transform: `translateX(${l.dx}px)`,
              mixBlendMode: i < 2 ? "screen" : "normal",
              textShadow: i === 2 ? `0 0 60px ${C.violet}aa, 0 20px 50px rgba(0,0,0,0.7)` : "none",
            }}
          >
            2026
          </div>
        ))}
      </div>
      {/* impact ring */}
      {f > 4 && f < 60 && (
        <div
          style={{
            position: "absolute",
            left: 540 - (f - 4) * 14,
            top: 400 - (f - 4) * 14,
            width: (f - 4) * 28,
            height: (f - 4) * 28,
            borderRadius: "50%",
            border: `4px solid ${C.cyan}`,
            opacity: interpolate(f, [4, 60], [0.9, 0], clamp),
          }}
        />
      )}

      {/* Panel 1 — SAAS ЗА 2 ВЕЧЕРА */}
      <SlidePanel f={f} at={sec(3.0)} from="left" style={{ top: 620, left: 60, right: 60, height: 210, padding: "28px 40px" }}>
        <Tag color={C.violet}>// deploy.window</Tag>
        <div style={{ fontFamily: SANS, fontWeight: 900, fontSize: 72, color: C.silver, letterSpacing: -2, marginTop: 6, whiteSpace: "nowrap" }}>
          SAAS ЗА <span style={{ color: C.cyan }}>2</span> ВЕЧЕРА
        </div>
        <div style={{ display: "flex", gap: 30, marginTop: 10, fontFamily: MONO, fontSize: 24, color: C.muted }}>
          {[evening1, evening2].map((p, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Check p={p} size={34} color={i === 0 ? C.violet : C.cyan} />
              <span style={{ color: p > 0.5 ? C.silver : C.muted }}>ВЕЧЕР_{i + 1}</span>
            </div>
          ))}
          <span style={{ marginLeft: "auto", color: C.cyan, opacity: evening2 }}>+ ПОДПИСКА</span>
        </div>
      </SlidePanel>

      {/* Panel 2 — 0 СТРОЧЕК КОДА */}
      <SlidePanel
        f={f}
        at={sec(6.0)}
        from="right"
        accent={C.cyan}
        style={{ top: 860, right: 60, width: 640, height: 210, padding: "28px 40px" }}
      >
        <Tag>// telemetry.keyboard</Tag>
        <div style={{ display: "flex", alignItems: "baseline", gap: 20, marginTop: 4 }}>
          <span
            style={{
              fontFamily: MONO,
              fontWeight: 800,
              fontSize: 110,
              lineHeight: 1,
              color: C.cyan,
              textShadow: `0 0 30px ${C.cyan}`,
            }}
          >
            {lines}
          </span>
          <span style={{ fontFamily: SANS, fontWeight: 900, fontSize: 54, color: C.silver, letterSpacing: -1 }}>СТРОЧЕК КОДА</span>
        </div>
        <div style={{ fontFamily: MONO, fontSize: 22, color: C.muted, marginTop: 8 }}>
          lines_written=<span style={{ color: C.cyan }}>0</span> · keys_pressed=<span style={{ color: C.cyan }}>0</span>
          <span style={{ color: C.cyan, opacity: mod(f / 15, 2) === 0 ? 1 : 0 }}>▍</span>
        </div>
      </SlidePanel>

      <Kid f={f} x={90} y={1000} scale={0.78} at={sec(0.6)} />
      {/* mini side readouts */}
      <div style={{ position: "absolute", left: 360, top: 1120, opacity: ease(f, sec(1.0), sec(1.4)) }}>
        {["agent.status: ONLINE", "manual_coding: DISABLED", `uptime: ${(f / FPS).toFixed(2)}s`].map((s, i) => (
          <Tag key={i} color={i === 1 ? C.violet : C.muted} style={{ fontSize: 22, marginBottom: 12, letterSpacing: 1.5 }}>
            {s}
          </Tag>
        ))}
      </div>
    </AbsoluteFill>
  );
};

// -------------------------------------------------------------------------
// SCENE 2 — LEGACY QUOTE (crossed out)
// -------------------------------------------------------------------------
const QUOTE_ROWS: [string, string][] = [
  ["Backend-разработчик", "$7,200"],
  ["Frontend-разработчик", "$6,400"],
  ["UI/UX дизайнер", "$3,600"],
  ["DevOps + интеграция оплаты", "$2,800"],
];

const Scene2: React.FC<{ f: number; start: number }> = ({ f, start }) => {
  const lf = f - start;
  const flip = ease(lf, 0, 30);
  const budget = interpolate(f, [sec(11.6), sec(12.9)], [0, 20000], { ...clamp, easing: EXPO_OUT });
  const months = Math.round(interpolate(f, [sec(9.6), sec(10.6)], [0, 6], clamp));
  const strike1 = ease(f, sec(13.0), sec(13.25));
  const strike2 = ease(f, sec(13.15), sec(13.4));
  const stamp = sp(f, sec(13.4), FPS, { damping: 9, stiffness: 260, mass: 0.6 });
  const dim = interpolate(f, [sec(13.0), sec(13.5)], [1, 0.55], clamp);
  return (
    <AbsoluteFill>
      <Tag color={C.muted} style={{ position: "absolute", top: 170, left: 60, opacity: ease(lf, 4, 20) }}>
        ▸ LEGACY_QUOTE.pdf · «КАК БЫЛО РАНЬШЕ»
      </Tag>
      <div style={{ position: "absolute", top: 230, left: 60, right: 60, perspective: 1400 }}>
        <div
          style={{
            background: C.panel,
            border: `2px solid ${C.border}`,
            borderRadius: 30,
            padding: "40px 46px",
            transform: `rotateX(${(1 - flip) * 70}deg)`,
            transformOrigin: "50% 0%",
            opacity: flip,
            boxShadow: `0 40px 90px rgba(0,0,0,0.6), 0 0 60px ${C.violet}22`,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontFamily: SANS, fontWeight: 900, fontSize: 52, color: C.silver }}>Смета: SaaS MVP</div>
            <Tag color={C.muted}>№ 0142</Tag>
          </div>
          <div style={{ height: 2, background: `${C.silver}22`, margin: "22px 0" }} />
          {QUOTE_ROWS.map(([name, price], i) => {
            const rp = ease(lf, 14 + i * 10, 34 + i * 10);
            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontFamily: MONO,
                  fontSize: 30,
                  color: C.muted,
                  padding: "10px 0",
                  opacity: rp * dim,
                  transform: `translateX(${(1 - rp) * -60}px)`,
                }}
              >
                <span>{name}</span>
                <span style={{ color: C.silver }}>{price}</span>
              </div>
            );
          })}
          {/* months strip */}
          <div style={{ display: "flex", gap: 10, marginTop: 26, opacity: dim }}>
            {Array.from({ length: 6 }, (_, i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  height: 54,
                  borderRadius: 12,
                  border: `2px solid ${C.violet}66`,
                  background: i < months ? `${C.violet}55` : "transparent",
                  fontFamily: MONO,
                  fontSize: 20,
                  color: C.silver,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                M{i + 1}
              </div>
            ))}
          </div>
          <div style={{ height: 2, background: `${C.silver}22`, margin: "28px 0 18px" }} />
          {/* totals */}
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Tag color={C.muted} style={{ fontSize: 26 }}>СРОК</Tag>
              <div style={{ position: "relative", fontFamily: SANS, fontWeight: 900, fontSize: 84, color: C.silver, opacity: dim + 0.2 }}>
                {Math.max(1, months)} МЕСЯЦЕВ
                <Strike p={strike1} />
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Tag color={C.muted} style={{ fontSize: 26 }}>БЮДЖЕТ</Tag>
              <div style={{ position: "relative", fontFamily: SANS, fontWeight: 900, fontSize: 96, color: C.silver, opacity: dim + 0.2 }}>
                {money(budget)}
                <Strike p={strike2} tilt={3} />
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* stamp */}
      {f >= sec(13.4) && (
        <div
          style={{
            position: "absolute",
            top: 1130,
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              border: `8px solid ${C.cyan}`,
              borderRadius: 22,
              padding: "14px 40px",
              fontFamily: SANS,
              fontWeight: 900,
              fontSize: 72,
              color: C.cyan,
              letterSpacing: 4,
              transform: `rotate(-8deg) scale(${2.4 - 1.4 * stamp})`,
              opacity: Math.min(1, stamp * 2),
              textShadow: `0 0 30px ${C.cyan}`,
              boxShadow: `0 0 40px ${C.cyan}66, inset 0 0 30px ${C.cyan}44`,
              background: "rgba(7,6,18,0.7)",
            }}
          >
            УСТАРЕЛО
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};

// -------------------------------------------------------------------------
// SCENE 3 — TERMINAL → 3D BROWSER BUILD
// -------------------------------------------------------------------------
const PROMPT = 'agent "сервис подписок: личный кабинет, оплата картой, $19/мес"';
const LOGS: [number, string, string][] = [
  [18.1, "◆", "agent: план принят · 4 шага"],
  [19.9, "✓", "db: schema.sql · 3 таблицы"],
  [22.1, "✓", "ui: 14 компонентов · dark theme"],
  [24.3, "✓", "payments: stripe checkout"],
  [26.6, "✓", "deploy: subbox.app · LIVE"],
];
const STAGES = [sec(18.9), sec(21.1), sec(23.2), sec(25.1)];
const STAGE_NAMES = ["DATABASE", "INTERFACE", "CHECKOUT", "DEPLOY"];

const TABLES = [
  { name: "users", x: 40, y: 40, rows: ["id · uuid", "email · text", "name · text"] },
  { name: "subscriptions", x: 480, y: 40, rows: ["id · uuid", "user_id → users", "plan · $19", "status · active"] },
  { name: "payments", x: 260, y: 330, rows: ["id · uuid", "sub_id → subs", "amount · int", "stripe_id · text"] },
];

const DbStage: React.FC<{ f: number; at: number }> = ({ f, at }) => {
  const lf = f - at;
  const line = ease(lf, 40, 90);
  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <svg width="100%" height="100%" style={{ position: "absolute", inset: 0 }}>
        <path d="M400 110 C440 110 440 110 480 110" stroke={C.cyan} strokeWidth={4} fill="none" strokeDasharray={200} strokeDashoffset={200 * (1 - line)} />
        <path d="M640 280 C640 360 600 400 680 400 L700 400" stroke={C.violet} strokeWidth={4} fill="none" strokeDasharray={400} strokeDashoffset={400 * (1 - line)} />
        <path d="M640 280 C640 330 560 330 560 330" stroke={C.violet} strokeWidth={4} fill="none" strokeDasharray={300} strokeDashoffset={300 * (1 - line)} />
      </svg>
      {TABLES.map((tb, i) => {
        const p = sp(f, at + i * 10, FPS, { damping: 14, stiffness: 200, mass: 0.5 });
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: tb.x,
              top: tb.y,
              width: 360,
              background: "#0F0D2A",
              border: `2px solid ${i === 1 ? C.cyan : C.violet}`,
              borderRadius: 18,
              overflow: "hidden",
              transform: `scale(${0.6 + 0.4 * p})`,
              opacity: p,
              boxShadow: `0 0 30px ${i === 1 ? C.cyan : C.violet}44`,
            }}
          >
            <div
              style={{
                background: i === 1 ? `${C.cyan}33` : `${C.violet}44`,
                padding: "12px 20px",
                fontFamily: MONO,
                fontSize: 26,
                fontWeight: 700,
                color: C.silver,
              }}
            >
              ▦ {tb.name}
            </div>
            {tb.rows.map((r, j) => (
              <div
                key={j}
                style={{
                  padding: "8px 20px",
                  fontFamily: MONO,
                  fontSize: 22,
                  color: r.includes("→") ? C.cyan : C.muted,
                  borderTop: `1px solid ${C.silver}14`,
                  opacity: ease(lf, 12 + i * 10 + j * 5, 22 + i * 10 + j * 5),
                }}
              >
                {r}
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
};

const UiStage: React.FC<{ f: number; at: number }> = ({ f, at }) => {
  const b = (i: number) => sp(f, at + 8 + i * 7, FPS, { damping: 13, stiffness: 220, mass: 0.5 });
  const scan = mod((f - at) * 9, 640);
  const plans: [string, string, boolean][] = [
    ["Старт", "$9", false],
    ["Про", "$19", true],
    ["Команда", "$49", false],
  ];
  return (
    <div style={{ position: "relative", width: "100%", height: "100%", padding: 34, boxSizing: "border-box" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", opacity: b(0), transform: `translateY(${(1 - b(0)) * -30}px)` }}>
        <div style={{ fontFamily: SANS, fontWeight: 900, fontSize: 38, color: C.silver }}>
          sub<span style={{ color: C.cyan }}>box</span>
        </div>
        <div style={{ display: "flex", gap: 22, fontFamily: SANS, fontSize: 24, color: C.muted }}>
          <span>Тарифы</span>
          <span>Вход</span>
          <span style={{ color: C.bg, background: C.cyan, padding: "4px 16px", borderRadius: 10, fontWeight: 700 }}>Старт</span>
        </div>
      </div>
      <div style={{ marginTop: 40, opacity: b(1), transform: `translateX(${(1 - b(1)) * -60}px)` }}>
        <div style={{ fontFamily: SANS, fontWeight: 900, fontSize: 58, color: C.silver, lineHeight: 1.05, letterSpacing: -1.5 }}>
          Твой сервис.
          <br />
          <span style={{ color: C.violet }}>Без кода.</span>
        </div>
      </div>
      <div style={{ display: "flex", gap: 18, marginTop: 40 }}>
        {plans.map(([n, pr, hot], i) => {
          const p = b(2 + i);
          return (
            <div
              key={i}
              style={{
                flex: 1,
                height: 250,
                borderRadius: 20,
                border: `2px solid ${hot ? C.cyan : `${C.violet}66`}`,
                background: hot ? `${C.cyan}18` : "#100E2C",
                padding: 22,
                boxSizing: "border-box",
                transform: `translateY(${(1 - p) * 80}px) scale(${hot ? 1.05 : 1})`,
                opacity: p,
                boxShadow: hot ? `0 0 34px ${C.cyan}55` : "none",
              }}
            >
              <div style={{ fontFamily: SANS, fontSize: 26, color: C.muted, fontWeight: 600 }}>{n}</div>
              <div style={{ fontFamily: SANS, fontWeight: 900, fontSize: 56, color: C.silver, marginTop: 8 }}>
                {pr}
                <span style={{ fontSize: 22, color: C.muted }}>/мес</span>
              </div>
              {[0, 1, 2].map((k) => (
                <div key={k} style={{ height: 10, borderRadius: 5, background: `${C.silver}22`, marginTop: 14, width: `${90 - k * 18}%` }} />
              ))}
            </div>
          );
        })}
      </div>
      {/* build scanline */}
      <div style={{ position: "absolute", left: 0, right: 0, top: scan, height: 3, background: `linear-gradient(90deg, transparent, ${C.cyan}, transparent)`, opacity: 0.6 }} />
    </div>
  );
};

const CheckoutStage: React.FC<{ f: number; at: number }> = ({ f, at }) => {
  const p = sp(f, at, FPS, { damping: 14, stiffness: 180, mass: 0.6 });
  const email = typed("kid@subbox.app", f, at + 14, 30);
  const card = typed("4242 4242 4242 4242", f, at + 34, 34);
  const press = f >= sec(24.5) ? sp(f, sec(24.5), FPS, { damping: 8, stiffness: 300, mass: 0.4 }) : 0;
  const ok = ease(f, sec(24.7), sec(25.0));
  const field = (label: string, val: string, active: boolean) => (
    <div style={{ marginTop: 18 }}>
      <Tag color={C.muted} style={{ fontSize: 18, letterSpacing: 2 }}>{label}</Tag>
      <div
        style={{
          marginTop: 6,
          height: 66,
          borderRadius: 14,
          border: `2px solid ${active ? C.violet : `${C.silver}33`}`,
          background: "#0B0A22",
          fontFamily: MONO,
          fontSize: 28,
          color: C.silver,
          display: "flex",
          alignItems: "center",
          padding: "0 20px",
          boxShadow: active ? `0 0 20px ${C.violet}55` : "none",
        }}
      >
        {val}
        {active && <span style={{ color: C.violet, opacity: mod(f / 15, 2) === 0 ? 1 : 0 }}>▍</span>}
      </div>
    </div>
  );
  return (
    <div style={{ position: "relative", width: "100%", height: "100%", display: "flex", justifyContent: "center", alignItems: "center" }}>
      <div
        style={{
          width: 640,
          background: "#141238",
          borderRadius: 26,
          border: `2px solid ${C.violet}88`,
          padding: "30px 38px",
          transform: `translateY(${(1 - p) * 120}px)`,
          opacity: p,
          boxShadow: `0 30px 70px rgba(0,0,0,0.6), 0 0 50px ${C.violet}44`,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: C.violet, color: C.silver, fontFamily: SANS, fontWeight: 900, fontSize: 30, display: "flex", alignItems: "center", justifyContent: "center" }}>
              S
            </div>
            <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: 28, color: C.silver }}>Stripe Checkout</span>
          </div>
          <Tag color={C.cyan} style={{ fontSize: 18 }}>🔒 TEST MODE</Tag>
        </div>
        <div style={{ fontFamily: SANS, fontWeight: 900, fontSize: 64, color: C.silver, marginTop: 18 }}>
          $19.00<span style={{ fontSize: 26, color: C.muted }}> / месяц</span>
        </div>
        {field("EMAIL", email, f < at + 34)}
        {field("КАРТА", card, f >= at + 34 && f < sec(24.5))}
        <div
          style={{
            marginTop: 26,
            height: 80,
            borderRadius: 16,
            background: ok > 0 ? C.cyan : `linear-gradient(90deg, ${C.violet}, ${C.cyan})`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 14,
            fontFamily: SANS,
            fontWeight: 900,
            fontSize: 32,
            color: ok > 0 ? C.bg : C.silver,
            transform: `scale(${1 - 0.06 * Math.sin(press * Math.PI)})`,
          }}
        >
          {ok > 0 ? (
            <>
              <Check p={ok} size={44} color={C.bg} /> ОПЛАЧЕНО
            </>
          ) : (
            "Оплатить $19.00"
          )}
        </div>
      </div>
    </div>
  );
};

const DeployStage: React.FC<{ f: number; at: number }> = ({ f, at }) => {
  const prog = interpolate(f, [at + 6, sec(26.6)], [0, 100], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const live = sp(f, sec(26.6), FPS, { damping: 10, stiffness: 220, mass: 0.6 });
  const steps = ["build", "optimize", "edge: 32 regions", "ssl", "dns"];
  return (
    <div style={{ position: "relative", width: "100%", height: "100%", padding: 40, boxSizing: "border-box" }}>
      <Tag color={C.muted}>$ deploy --prod</Tag>
      {steps.map((s, i) => {
        const done = prog >= (i + 1) * 20 - 1;
        return (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 14, fontFamily: MONO, fontSize: 26, color: done ? C.silver : C.dim }}>
            <Check p={done ? 1 : 0} size={30} />
            {s}
          </div>
        );
      })}
      <div style={{ marginTop: 26, height: 22, borderRadius: 11, background: `${C.silver}14`, overflow: "hidden" }}>
        <div style={{ width: `${prog}%`, height: "100%", background: `linear-gradient(90deg, ${C.violet}, ${C.cyan})`, boxShadow: `0 0 20px ${C.cyan}` }} />
      </div>
      <Tag color={C.cyan} style={{ marginTop: 10 }}>{Math.round(prog)}%</Tag>
      {f >= sec(26.6) && (
        <div style={{ position: "absolute", right: 60, bottom: 50, display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ position: "relative", width: 200, height: 200 }}>
            {[0, 1, 2].map((k) => {
              const r = mod(f - sec(26.6) + k * 20, 60) / 60;
              return (
                <div
                  key={k}
                  style={{
                    position: "absolute",
                    left: 100 - r * 100,
                    top: 100 - r * 100,
                    width: r * 200,
                    height: r * 200,
                    borderRadius: "50%",
                    border: `3px solid ${C.cyan}`,
                    opacity: 1 - r,
                  }}
                />
              );
            })}
            <div
              style={{
                position: "absolute",
                left: 50,
                top: 70,
                width: 100,
                height: 60,
                borderRadius: 14,
                background: C.cyan,
                fontFamily: SANS,
                fontWeight: 900,
                fontSize: 30,
                color: C.bg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transform: `scale(${live})`,
                boxShadow: `0 0 40px ${C.cyan}`,
              }}
            >
              LIVE
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Scene3: React.FC<{ f: number; start: number }> = ({ f, start }) => {
  const t = f / FPS;
  const prompt = typed(PROMPT, f, sec(14.7), 26);
  const visibleLogs = LOGS.filter(([at]) => t >= at).slice(-3);
  const stageIdx = STAGES.reduce((acc, s, i) => (f >= s ? i : acc), -1);
  const stageAt = stageIdx >= 0 ? STAGES[stageIdx] : STAGES[0];
  const flipP = ease(f, stageAt, stageAt + 22);
  const enter = sp(f, sec(18.7), FPS, { damping: 15, stiffness: 120, mass: 0.8 });
  const rotY = stageIdx <= 0 ? (1 - flipP) * -95 : (1 - flipP) * (mod(stageIdx, 2) === 0 ? -100 : 100);
  const elapsed = interpolate(t, [18.1, 27.3], [0, 15 * 60], clamp);
  const mm = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const ss = String(mod(elapsed, 60)).padStart(2, "0");
  const big15 = sp(f, sec(27.0), FPS, { damping: 9, stiffness: 240, mass: 0.6 });
  const url = stageIdx >= 3 && t >= 26.6 ? "https://subbox.app" : "localhost:3000";
  return (
    <AbsoluteFill>
      {/* Terminal */}
      <SlidePanel f={f} at={start + 4} from="top" accent={C.cyan} style={{ top: 150, left: 50, right: 50, height: 330, padding: 0, borderRadius: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "16px 24px", borderBottom: `1px solid ${C.silver}1a`, background: "#0A0920" }}>
          {[C.violet, C.cyan, C.silver].map((c, i) => (
            <span key={i} style={{ width: 16, height: 16, borderRadius: 8, background: c, opacity: 0.8 }} />
          ))}
          <Tag color={C.muted} style={{ marginLeft: 16, fontSize: 20 }}>~/my-saas — agent</Tag>
          <Tag color={C.cyan} style={{ marginLeft: "auto", fontSize: 20 }}>
            ⏱ {mm}:{ss}
          </Tag>
        </div>
        <div style={{ padding: "20px 28px", fontFamily: MONO, fontSize: 27, lineHeight: 1.5, color: C.silver }}>
          <div style={{ minHeight: 82 }}>
            <span style={{ color: C.cyan }}>❯ </span>
            {prompt}
            {prompt.length < PROMPT.length && <span style={{ color: C.cyan, opacity: mod(f / 12, 2) === 0 ? 1 : 0 }}>▍</span>}
          </div>
          {visibleLogs.map(([at, icon, msg]) => (
            <div key={msg} style={{ color: icon === "✓" ? C.silver : C.violet, opacity: ease(f, sec(at), sec(at) + 10), fontSize: 25 }}>
              <span style={{ color: icon === "✓" ? C.cyan : C.violet }}>{icon}</span> {msg}
            </div>
          ))}
        </div>
      </SlidePanel>

      {/* 3D Browser */}
      {f >= sec(18.7) && (
        <div style={{ position: "absolute", top: 530, left: 50, right: 50, height: 800, perspective: 1800 }}>
          <div
            style={{
              width: "100%",
              height: "100%",
              transform: `translateY(${(1 - enter) * 500}px) rotateY(${rotY}deg) rotateX(${(1 - enter) * 30}deg)`,
              transformStyle: "preserve-3d",
              borderRadius: 26,
              background: "#0B0A1F",
              border: `2px solid ${C.violet}88`,
              boxShadow: `0 50px 100px rgba(0,0,0,0.7), 0 0 70px ${C.violet}44`,
              overflow: "hidden",
              opacity: enter,
            }}
          >
            {/* chrome */}
            <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 22px", background: "#13112F", borderBottom: `1px solid ${C.silver}1a` }}>
              {[0, 1, 2].map((i) => (
                <span key={i} style={{ width: 14, height: 14, borderRadius: 7, background: `${C.silver}55` }} />
              ))}
              <div
                style={{
                  flex: 1,
                  marginLeft: 12,
                  height: 44,
                  borderRadius: 12,
                  background: "#0A0920",
                  display: "flex",
                  alignItems: "center",
                  padding: "0 18px",
                  fontFamily: MONO,
                  fontSize: 22,
                  color: url.startsWith("https") ? C.cyan : C.muted,
                }}
              >
                {url.startsWith("https") ? "🔒 " : ""}
                {url}
              </div>
            </div>
            {/* stage tabs */}
            <div style={{ display: "flex", gap: 10, padding: "14px 22px 0" }}>
              {STAGE_NAMES.map((n, i) => (
                <div
                  key={n}
                  style={{
                    fontFamily: MONO,
                    fontSize: 18,
                    letterSpacing: 2,
                    padding: "6px 14px",
                    borderRadius: 8,
                    color: i === stageIdx ? C.bg : i < stageIdx ? C.cyan : C.dim,
                    background: i === stageIdx ? C.cyan : "transparent",
                    border: `1px solid ${i <= stageIdx ? C.cyan : C.dim}`,
                  }}
                >
                  {i < stageIdx ? "✓ " : ""}
                  {n}
                </div>
              ))}
            </div>
            <div style={{ position: "relative", height: 640 }}>
              {stageIdx <= 0 && <DbStage f={f} at={STAGES[0]} />}
              {stageIdx === 1 && <UiStage f={f} at={STAGES[1]} />}
              {stageIdx === 2 && <CheckoutStage f={f} at={STAGES[2]} />}
              {stageIdx === 3 && <DeployStage f={f} at={STAGES[3]} />}
            </div>
          </div>
        </div>
      )}

      {/* "15 МИН" stamp */}
      {f >= sec(27.0) && (
        <div
          style={{
            position: "absolute",
            top: 640,
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "center",
            transform: `scale(${2 - big15}) rotate(-6deg)`,
            opacity: Math.min(1, big15 * 2),
          }}
        >
          <div
            style={{
              fontFamily: SANS,
              fontWeight: 900,
              fontSize: 150,
              color: C.silver,
              background: `linear-gradient(135deg, ${C.violet}, ${C.violetDeep})`,
              padding: "6px 50px",
              borderRadius: 30,
              boxShadow: `0 0 80px ${C.violet}, 0 30px 60px rgba(0,0,0,0.6)`,
              letterSpacing: -4,
            }}
          >
            15 МИН
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};

// -------------------------------------------------------------------------
// SCENE 4 — MRR
// -------------------------------------------------------------------------
const NOTIFS = Array.from({ length: 14 }, (_, i) => ({
  at: sec(29.0 + i * 0.48),
  id: 1000 + Math.floor(rand(i + 7) * 9000),
}));

const Scene4: React.FC<{ f: number; start: number }> = ({ f, start }) => {
  const t = f / FPS;
  const clients = Math.round(interpolate(t, [28.5, 29.9], [0, 100], { ...clamp, easing: EXPO_OUT }));
  const mrr = interpolate(t, [30.1, 34.6], [0, 1900], { ...clamp, easing: Easing.out(Easing.cubic) });
  const l1 = sp(f, sec(28.5), FPS);
  const l2 = sp(f, sec(29.8), FPS);
  const l3 = sp(f, sec(32.6), FPS, { damping: 9, stiffness: 220, mass: 0.6 });
  const passive = ease(f, sec(33.7), sec(34.1));
  const shown = NOTIFS.filter((n) => f >= n.at).slice(-4).reverse();
  return (
    <AbsoluteFill>
      {/* Formula */}
      <div style={{ position: "absolute", top: 160, left: 60, right: 60 }}>
        <Tag color={C.muted} style={{ opacity: ease(f, start, start + 20) }}>▸ unit_economics.calc</Tag>
        <div
          style={{
            fontFamily: SANS,
            fontWeight: 900,
            fontSize: 104,
            color: C.silver,
            letterSpacing: -3,
            lineHeight: 1.05,
            marginTop: 10,
            transform: `translateX(${(1 - l1) * -800}px)`,
          }}
        >
          <span style={{ fontFamily: MONO, color: C.cyan }}>{clients}</span> КЛИЕНТОВ
        </div>
        <div
          style={{
            fontFamily: SANS,
            fontWeight: 900,
            fontSize: 104,
            color: C.silver,
            letterSpacing: -3,
            lineHeight: 1.05,
            transform: `translateX(${(1 - l2) * 900}px)`,
            textAlign: "right",
          }}
        >
          <span style={{ color: C.violet }}>×</span> $19/МЕС
        </div>
        <div
          style={{
            marginTop: 12,
            display: "flex",
            justifyContent: "center",
            transform: `scale(${l3})`,
            opacity: l3,
          }}
        >
          <div
            style={{
              fontFamily: SANS,
              fontWeight: 900,
              fontSize: 96,
              color: C.bg,
              background: C.cyan,
              padding: "4px 36px",
              borderRadius: 24,
              letterSpacing: -2,
              boxShadow: `0 0 60px ${C.cyan}aa`,
            }}
          >
            = $1,900/МЕС
          </div>
        </div>
      </div>

      {/* MRR panel */}
      <SlidePanel f={f} at={sec(30.0)} from="left" style={{ top: 650, left: 60, right: 60, height: 300, padding: "26px 36px" }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <div>
            <Tag color={C.violet}>MRR · LIVE</Tag>
            <div style={{ fontFamily: MONO, fontWeight: 800, fontSize: 110, color: C.silver, lineHeight: 1.05, textShadow: `0 0 30px ${C.violet}` }}>
              {money(mrr)}
            </div>
            <Tag color={C.cyan} style={{ opacity: passive, fontSize: 24 }}>
              ◆ ПАССИВНЫЙ ДОХОД · КАЖДЫЙ МЕСЯЦ
            </Tag>
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 9, height: 220 }}>
            {Array.from({ length: 10 }, (_, i) => {
              const h = ease(f, sec(30.2) + i * 12, sec(30.2) + i * 12 + 30) * (24 + i * 19);
              return (
                <div
                  key={i}
                  style={{
                    width: 22,
                    height: h,
                    borderRadius: 6,
                    background: i === 9 ? C.cyan : `linear-gradient(180deg, ${C.violet}, ${C.violetDeep})`,
                    boxShadow: i === 9 ? `0 0 20px ${C.cyan}` : "none",
                  }}
                />
              );
            })}
          </div>
        </div>
        {/* client dots */}
        <div style={{ position: "absolute", left: 36, right: 36, bottom: 18, display: "flex", gap: 4 }}>
          {Array.from({ length: 50 }, (_, i) => (
            <div key={i} style={{ flex: 1, height: 8, borderRadius: 4, background: i * 2 < clients ? C.cyan : `${C.silver}1a` }} />
          ))}
        </div>
      </SlidePanel>

      {/* Stripe notifications */}
      <div style={{ position: "absolute", top: 985, left: 60, right: 60 }}>
        {shown.map((n, i) => {
          const p = sp(f, n.at, FPS, { damping: 15, stiffness: 220, mass: 0.5 });
          return (
            <div
              key={n.at}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 20,
                height: 76,
                marginBottom: 12,
                padding: "0 24px",
                borderRadius: 20,
                background: "rgba(20,18,56,0.92)",
                border: `1px solid ${i === 0 ? C.borderCyan : `${C.silver}22`}`,
                transform: `translateX(${(1 - p) * 900}px)`,
                opacity: (1 - i * 0.18) * p,
                boxShadow: i === 0 ? `0 0 30px ${C.cyan}33` : "none",
              }}
            >
              <div style={{ width: 46, height: 46, borderRadius: 12, background: C.violet, color: C.silver, fontFamily: SANS, fontWeight: 900, fontSize: 28, display: "flex", alignItems: "center", justifyContent: "center" }}>
                S
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 26, color: C.silver }}>Платёж получен</div>
                <div style={{ fontFamily: MONO, fontSize: 18, color: C.muted }}>cus_{n.id} · подписка Про</div>
              </div>
              <div style={{ fontFamily: MONO, fontWeight: 800, fontSize: 30, color: C.cyan }}>+$19.00</div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// -------------------------------------------------------------------------
// SCENE 5 — SKILL OF THE FUTURE
// -------------------------------------------------------------------------
const CODE_LINES = [
  "for (let i = 0; i < n; i++) {",
  "  if (arr[i] !== null) {",
  "    res.push(fn(arr[i]));",
  "  }",
  "} // SyntaxError: line 3",
];
const TASKS = ["Цель: сервис подписок", "Аудитория: школьники", "Оплата: $19/мес картой", "Дедлайн: 2 вечера"];

const Scene5: React.FC<{ f: number; start: number }> = ({ f, start }) => {
  const strike = ease(f, sec(39.6), sec(40.0));
  const fade = interpolate(f, [sec(39.6), sec(40.3)], [1, 0.4], clamp);
  const vs = sp(f, sec(40.2), FPS, { damping: 9, stiffness: 260, mass: 0.5 });
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", top: 160, left: 60, right: 60, opacity: ease(f, start + 4, start + 24) }}>
        <Tag color={C.muted}>▸ skill_tree.2026+</Tag>
        <div style={{ fontFamily: SANS, fontWeight: 900, fontSize: 52, color: C.silver, letterSpacing: -1.5, whiteSpace: "nowrap" }}>
          ГЛАВНЫЙ НАВЫК <span style={{ color: C.cyan }}>БУДУЩЕГО</span>
        </div>
      </div>

      {/* NOT */}
      <SlidePanel f={f} at={sec(37.5)} from="left" style={{ top: 330, left: 60, right: 60, height: 400, padding: "28px 38px", filter: `saturate(${fade})` }}>
        <div style={{ opacity: fade }}>
          <Tag color={C.violet}>✕ DEPRECATED</Tag>
          <div style={{ position: "relative", display: "inline-block", fontFamily: SANS, fontWeight: 900, fontSize: 60, color: C.silver, letterSpacing: -1.5, marginTop: 8, whiteSpace: "nowrap" }}>
            НЕ ЗУБРИТЬ СИНТАКСИС
            <Strike p={strike} thick={14} />
          </div>
          <div style={{ marginTop: 18, fontFamily: MONO, fontSize: 26, lineHeight: 1.5, filter: `blur(${strike * 2}px)` }}>
            {CODE_LINES.map((l, i) => (
              <div key={i} style={{ color: i === 4 ? C.violet : C.muted, opacity: ease(f, sec(38.1) + i * 6, sec(38.1) + i * 6 + 10) }}>
                <span style={{ color: C.dim }}>{String(i + 1).padStart(2, "0")} </span>
                {l}
              </div>
            ))}
          </div>
        </div>
      </SlidePanel>

      {/* VS */}
      {f >= sec(40.2) && (
        <div
          style={{
            position: "absolute",
            top: 700,
            left: 480,
            width: 120,
            height: 120,
            borderRadius: 60,
            background: C.bg,
            border: `4px solid ${C.cyan}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: MONO,
            fontWeight: 800,
            fontSize: 40,
            color: C.cyan,
            transform: `scale(${vs}) rotate(${(1 - vs) * 180}deg)`,
            boxShadow: `0 0 40px ${C.cyan}88`,
            zIndex: 5,
          }}
        >
          VS
        </div>
      )}

      {/* YES */}
      <SlidePanel
        f={f}
        at={sec(40.3)}
        from="right"
        accent={C.cyan}
        style={{ top: 770, left: 60, right: 60, height: 560, padding: "64px 38px 28px" }}
      >
        <Tag color={C.cyan}>✓ CORE SKILL</Tag>
        <div style={{ fontFamily: SANS, fontWeight: 900, fontSize: 66, color: C.silver, letterSpacing: -1.5, marginTop: 6, whiteSpace: "nowrap" }}>
          СТАВИТЬ <span style={{ color: C.cyan, textShadow: `0 0 30px ${C.cyan}` }}>ЗАДАЧИ ИИ</span>
        </div>
        <div style={{ marginTop: 20 }}>
          {TASKS.map((task, i) => {
            const at = sec(41.0) + i * 16;
            const txt = typed(task, f, at, 40);
            const ok = ease(f, at + 18, at + 30);
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 14, fontFamily: MONO, fontSize: 30, color: C.silver, opacity: f >= at ? 1 : 0 }}>
                <Check p={ok} size={38} />
                <span>{txt}</span>
              </div>
            );
          })}
        </div>
      </SlidePanel>
    </AbsoluteFill>
  );
};

// -------------------------------------------------------------------------
// SCENE 6 — CTA
// -------------------------------------------------------------------------
const TOOLS = ["AI-агент в терминале", "База данных", "UI-генератор", "Оплата подписок", "Хостинг в 1 клик"];

const Scene6: React.FC<{ f: number; start: number }> = ({ f, start }) => {
  const t = f / FPS;
  const p1 = sp(f, start + 2, FPS, { damping: 10, stiffness: 220, mass: 0.6 });
  const p2 = sp(f, sec(44.25), FPS, { damping: 9, stiffness: 240, mass: 0.6 });
  const comment = typed("сервис", f, sec(44.6), 10);
  const sent = f >= sec(45.6);
  const reply = sp(f, sec(46.4), FPS, { damping: 14, stiffness: 200, mass: 0.5 });
  const burst = t * 20;
  return (
    <AbsoluteFill>
      {/* radial burst */}
      <div
        style={{
          position: "absolute",
          left: 540 - 900,
          top: 380 - 900,
          width: 1800,
          height: 1800,
          background: `repeating-conic-gradient(from ${burst}deg, ${C.violet}22 0deg 8deg, transparent 8deg 20deg)`,
          maskImage: "radial-gradient(circle, black 10%, transparent 60%)",
          WebkitMaskImage: "radial-gradient(circle, black 10%, transparent 60%)",
          opacity: p1,
        }}
      />
      <div style={{ position: "absolute", top: 190, left: 0, right: 0, textAlign: "center" }}>
        <div style={{ fontFamily: SANS, fontWeight: 900, fontSize: 130, color: C.silver, letterSpacing: -4, transform: `scale(${p1})`, textShadow: `0 0 50px ${C.violet}` }}>
          НАПИШИ
        </div>
        <div
          style={{
            display: "inline-block",
            marginTop: 6,
            fontFamily: SANS,
            fontWeight: 900,
            fontSize: 140,
            color: C.bg,
            background: `linear-gradient(90deg, ${C.cyan}, ${C.violet})`,
            padding: "0 40px",
            borderRadius: 30,
            letterSpacing: -3,
            transform: `scale(${p2}) rotate(-3deg)`,
            boxShadow: `0 0 80px ${C.cyan}88`,
          }}
        >
          «СЕРВИС»
        </div>
      </div>

      {/* comment box */}
      <SlidePanel f={f} at={sec(44.8)} from="bottom" accent={C.cyan} style={{ top: 640, left: 60, right: 60, height: 150, padding: "0 30px", display: "flex", alignItems: "center", gap: 22 }}>
        <div style={{ width: 80, height: 80, borderRadius: 40, background: `linear-gradient(135deg, ${C.violet}, ${C.cyan})`, flexShrink: 0 }} />
        <div style={{ flex: 1, fontFamily: SANS, fontSize: 44, fontWeight: 700, color: comment ? C.silver : C.muted }}>
          {comment || "Добавьте комментарий…"}
          {!sent && <span style={{ color: C.cyan, opacity: mod(f / 15, 2) === 0 ? 1 : 0 }}>▍</span>}
        </div>
        <div
          style={{
            width: 90,
            height: 90,
            borderRadius: 45,
            background: sent ? C.cyan : `${C.cyan}33`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 44,
            color: sent ? C.bg : C.cyan,
            transform: `scale(${sent ? 1 + 0.15 * Math.max(0, 1 - (f - sec(45.6)) / 20) : 1})`,
          }}
        >
          ➤
        </div>
      </SlidePanel>

      {/* reply */}
      {f >= sec(46.4) && (
        <div
          style={{
            position: "absolute",
            top: 820,
            right: 60,
            padding: "18px 28px",
            borderRadius: "24px 24px 6px 24px",
            background: `${C.violet}`,
            fontFamily: SANS,
            fontWeight: 700,
            fontSize: 32,
            color: C.silver,
            transform: `translateY(${(1 - reply) * 60}px) scale(${0.8 + 0.2 * reply})`,
            opacity: reply,
            boxShadow: `0 0 40px ${C.violet}88`,
          }}
        >
          Лови список инструментов ↓
        </div>
      )}

      {/* tools list */}
      <SlidePanel f={f} at={sec(46.9)} from="left" style={{ top: 950, left: 60, width: 620, height: 380, padding: "24px 32px" }}>
        <Tag color={C.violet}>tools.list · 5 шт</Tag>
        {TOOLS.map((tool, i) => {
          const r = ease(f, sec(47.3) + i * 9, sec(47.3) + i * 9 + 14);
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 14, fontFamily: MONO, fontSize: 26, color: C.silver }}>
              <span style={{ color: C.cyan }}>{String(i + 1).padStart(2, "0")}</span>
              <span style={{ filter: `blur(${(1 - r) * 8 + (i > 1 ? 6 : 0)}px)` }}>{tool}</span>
              {i > 1 && <span style={{ marginLeft: "auto", color: C.violet }}>🔒</span>}
            </div>
          );
        })}
      </SlidePanel>

      <Kid f={f} x={720} y={960} scale={0.82} pose="point" at={sec(44.0)} />
    </AbsoluteFill>
  );
};

// -------------------------------------------------------------------------
// Radial wipe wrapper
// -------------------------------------------------------------------------
const SceneShell: React.FC<{ f: number; i: number; children: React.ReactNode }> = ({ f, i, children }) => {
  const [s, e] = SCENES[i];
  if (f < s || f >= e + WIPE) return null;
  const [cx, cy] = WIPE_ORIGINS[mod(i, WIPE_ORIGINS.length)];
  const lf = f - s;
  const wiping = i > 0 && lf < WIPE;
  const R = interpolate(lf, [0, WIPE], [0, 2300], { ...clamp, easing: Easing.in(Easing.cubic) });
  return (
    <>
      <AbsoluteFill style={{ clipPath: wiping ? `circle(${R}px at ${cx}px ${cy}px)` : undefined }}>{children}</AbsoluteFill>
      {wiping && (
        <div
          style={{
            position: "absolute",
            left: cx - R,
            top: cy - R,
            width: R * 2,
            height: R * 2,
            borderRadius: "50%",
            border: `6px solid ${mod(i, 2) === 0 ? C.cyan : C.violet}`,
            boxShadow: `0 0 40px ${C.cyan}, inset 0 0 40px ${C.violet}`,
            pointerEvents: "none",
          }}
        />
      )}
    </>
  );
};

// -------------------------------------------------------------------------
// Subtitles — karaoke with guaranteed spacing around the scaled word
// -------------------------------------------------------------------------
const SUB_FONT = 74;
const SUB_GAP = 22;
const ACTIVE_SCALE = 0.14;

const Subtitles: React.FC<{ f: number; fps: number }> = ({ f, fps }) => {
  const t = f / fps;
  const idx = CHUNKS.findIndex((c, i) => {
    const next = CHUNKS[i + 1];
    const until = next ? Math.min(next.start, c.end + 0.35) : c.end + 0.6;
    return t >= c.start - 0.03 && t < until;
  });
  if (idx < 0) return null;
  const chunk = CHUNKS[idx];
  const pop = sp(f, sec(chunk.start) - 2, fps, { damping: 12, stiffness: 240, mass: 0.5 });
  return (
    <div
      style={{
        position: "absolute",
        top: 1420,
        left: 40,
        right: 40,
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        alignItems: "center",
        rowGap: 14,
        transform: `translateY(${(1 - pop) * 40}px) scale(${0.85 + 0.15 * pop})`,
        opacity: interpolate(pop, [0, 0.4], [0, 1], clamp),
      }}
    >
      {chunk.words.map((w, i) => {
        const on = t >= w.start;
        const active = t >= w.start && t < w.end + 0.05;
        const key = KEY_RE.test(clean(w.word));
        const wp = active ? sp(f, sec(w.start), fps, { damping: 10, stiffness: 300, mass: 0.4 }) : 0;
        const scale = 1 + ACTIVE_SCALE * wp;
        // Scale doesn't affect layout → reserve the overflow as real margin so neighbours never touch.
        const estW = w.word.length * SUB_FONT * 0.66 + 32;
        const extra = (estW * (scale - 1)) / 2;
        return (
          <span
            key={`${idx}-${i}`}
            style={{
              display: "inline-block",
              margin: `0 ${SUB_GAP / 2 + extra}px`,
              padding: "4px 16px 8px",
              borderRadius: 14,
              background: active ? (key ? C.cyan : `${C.violet}cc`) : key && on ? `${C.violet}55` : "transparent",
              boxShadow: active ? `0 0 34px ${key ? C.cyan : C.violet}99` : "none",
              fontFamily: SANS,
              fontSize: SUB_FONT,
              fontWeight: 900,
              textTransform: "uppercase",
              letterSpacing: -0.5,
              lineHeight: 1.1,
              color: active && key ? C.bg : on ? C.silver : "rgba(226,232,240,0.38)",
              transform: `scale(${scale}) translateY(${-6 * wp}px)`,
              textShadow: active && key ? "none" : "0 6px 18px rgba(0,0,0,0.95)",
              WebkitTextStroke: active && key ? undefined : "2px rgba(3,2,10,0.7)",
              paintOrder: "stroke fill",
              whiteSpace: "nowrap",
            }}
          >
            {w.word}
          </span>
        );
      })}
    </div>
  );
};

// -------------------------------------------------------------------------
// Root composition
// -------------------------------------------------------------------------
export const ZeroCodeAppReel: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const cam = useCamera(f, fps);
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg, overflow: "hidden" }}>
      <Audio src={staticFile("zero_code_reel/voice.mp3")} />
      <Background f={f} cam={cam} />
      <AbsoluteFill style={{ perspective: 2200 }}>
        <AbsoluteFill
          style={{
            transform: `translate(${cam.dx}px, ${cam.dy}px) scale(${cam.zoom}) rotate(${cam.rot}deg) rotateX(${cam.rx}deg) rotateY(${cam.ry}deg)`,
            transformOrigin: "50% 45%",
          }}
        >
          <SceneShell f={f} i={0}>
            <Scene1 f={f} />
          </SceneShell>
          <SceneShell f={f} i={1}>
            <Scene2 f={f} start={SCENES[1][0]} />
          </SceneShell>
          <SceneShell f={f} i={2}>
            <Scene3 f={f} start={SCENES[2][0]} />
          </SceneShell>
          <SceneShell f={f} i={3}>
            <Scene4 f={f} start={SCENES[3][0]} />
          </SceneShell>
          <SceneShell f={f} i={4}>
            <Scene5 f={f} start={SCENES[4][0]} />
          </SceneShell>
          <SceneShell f={f} i={5}>
            <Scene6 f={f} start={SCENES[5][0]} />
          </SceneShell>
        </AbsoluteFill>
      </AbsoluteFill>
      <Overlay f={f} />
      <HUD f={f} />
      <Subtitles f={f} fps={fps} />
    </AbsoluteFill>
  );
};
