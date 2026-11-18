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
import wordsData from "../public/solo_empire_reel/words.json";

/*
 * =========================================================================
 * SOLO EMPIRE REEL — 1080x1920 @ 60 FPS, 3660 FRAMES (61s)
 *
 *   01  0.0 –  8.6s : "2026" glitch + 1 ЧЕЛОВЕК + 3 АГЕНТА vs 20 СОТРУДНИКОВ
 *   02  8.6 – 18.2s : Payroll ledger → "$40,000/МЕС" strike + endless Zoom grid
 *   03 18.2 – 21.6s : 3-agent tmux command center
 *   04 21.6 – 26.8s : AGENT 01 — Trend Radar (YouTube / TikTok)
 *   05 26.8 – 33.7s : AGENT 02 — 15-min builder (site / video / script)
 *   06 33.7 – 41.8s : AGENT 03 — 24/7 autopilot + payment notifications
 *   07 41.8 – 49.9s : 0 ОФИСОВ / 0 ЗАРПЛАТ / 0 ПРАВОК + 24/7
 *   08 49.9 – 55.6s : "ЦИФРОВАЯ АРМИЯ" — crowd vs agent formation
 *   09 55.6 – 61.0s : CTA — НАПИШИ «АРМИЯ»
 *
 * Camera: punch beats every 1.25s + alternating tilt + constant drift.
 * All cyclic array indices go through mod() — safe for negative offsets.
 * =========================================================================
 */

const FPS = 60;

const C = {
  bg: "#05060a",
  yellow: "#facc15",
  green: "#22c55e",
  cyan: "#22d3ee",
  red: "#ef4444",
  white: "#f8fafc",
  blue: "#60a5fa",
  purple: "#a855f7",
  pink: "#f472b6",
  muted: "#64748b",
  panel: "rgba(14,16,24,0.94)",
  border: "rgba(250,204,21,0.35)",
};

const SANS = "'Inter', 'SF Pro Display', -apple-system, 'Helvetica Neue', Arial, sans-serif";
const MONO = "'JetBrains Mono', 'SF Mono', Menlo, Consolas, monospace";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const EXPO_OUT = Easing.bezier(0.16, 1, 0.3, 1);
const sec = (s: number) => Math.round(s * FPS);
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

/** Safe modulo — always returns 0..m-1, even for negative n. */
const mod = (n: number, m: number) => ((Math.floor(n) % m) + m) % m;

const rand = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

const fmt = (n: number) => Math.round(n).toLocaleString("en-US");

const sp = (
  f: number,
  delay: number,
  fps: number,
  config: { damping?: number; stiffness?: number; mass?: number } = { damping: 13, stiffness: 180, mass: 0.6 },
) => spring({ frame: Math.max(0, f - delay), fps, config });

const sceneOpacity = (f: number, [a, b]: number[], fadeIn = 8, fadeOut = 8) => {
  if (f < a - fadeIn || f >= b) return 0;
  const fin = fadeIn > 0 ? interpolate(f, [a - fadeIn, a], [0, 1], clamp) : 1;
  const fout = fadeOut > 0 ? interpolate(f, [b - fadeOut, b], [1, 0], clamp) : 1;
  return Math.min(fin, fout);
};

const win = (a: number, b: number) => [sec(a), sec(b)];
const SC = {
  hook: win(0, 8.6),
  payroll: win(8.6, 18.2),
  term: win(18.2, 21.6),
  radar: win(21.6, 26.8),
  build: win(26.8, 33.7),
  post: win(33.7, 41.8),
  zero: win(41.8, 49.9),
  army: win(49.9, 55.6),
  cta: win(55.6, 61.0),
};
const CUTS = Object.values(SC).map((s) => s[0]).filter((x) => x > 0);

// -------------------------------------------------------------------------
// Words → subtitle chunks (with ASR fixes)
// -------------------------------------------------------------------------
type Word = { word: string; start: number; end: number };

const FIXES: [RegExp, string][] = [
  [/^сазвоны/, "созвоны"],
  [/^Третья$/, "Третий"],
  [/^клиентом$/, "клиентам"],
  [/^первым,$/, "первым"],
];

const WORDS: Word[] = (wordsData as Word[]).map((w) => ({
  ...w,
  word: FIXES.reduce((acc, [re, to]) => acc.replace(re, to), w.word),
}));

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
    if (punct || cur.length >= 3 || letters > 18) flush();
  });
  flush();
  return out;
})();

const KEY_RE =
  /^2026$|человек|агент|^20$|студию|сотрудник|зарплат|созвон|терминал|тренд|заработ|^15$|минут|сайт|видео|скрипт|публикует|оплат|^0$|офис|правок|^24$|^7$|выходн|армию|армия|Напиши/i;

// -------------------------------------------------------------------------
// Camera — punch every 1.25s
// -------------------------------------------------------------------------
const BEATS = Array.from({ length: 50 }, (_, i) => Math.round(i * 1.25 * FPS) + 10);

const useCamera = (f: number, fps: number) => {
  let zoom = 1;
  let tiltX = 0;
  let tiltY = 0;
  BEATS.forEach((b, i) => {
    if (f < b || f > b + 70) return;
    const s = spring({ frame: f - b, fps, config: { damping: 13, stiffness: 210, mass: 0.5 } });
    const pulse = s * interpolate(f - b, [0, 55], [1, 0], clamp);
    zoom += 0.05 * pulse;
    tiltY += (i % 2 === 0 ? 1 : -1) * 4 * pulse;
    tiltX += (i % 3 === 0 ? -2.5 : 2) * pulse;
  });
  const t = f / fps;
  tiltX += Math.sin(t * 0.7) * 1.4;
  tiltY += Math.cos(t * 0.5) * 2;
  return { zoom, tiltX, tiltY, dx: Math.sin(t * 0.43) * 10, dy: Math.cos(t * 0.37) * 8 };
};

// -------------------------------------------------------------------------
// Background — telemetry grid + bokeh particles
// -------------------------------------------------------------------------
const Background: React.FC<{ f: number }> = ({ f }) => {
  const t = f / FPS;
  const gx = 540 + Math.sin(t * 0.4) * 140;
  const gy = 800 + Math.cos(t * 0.3) * 100;
  const money = f >= SC.post[0] && f < SC.zero[1] ? 1 : 0;
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at ${gx}px ${gy}px, rgba(250,204,21,0.14) 0%, rgba(250,204,21,0.04) 32%, transparent 60%)`,
        }}
      />
      <AbsoluteFill
        style={{
          opacity: 0.6,
          background: `radial-gradient(circle at 85% 12%, ${money ? "rgba(34,197,94,0.18)" : "rgba(34,211,238,0.14)"} 0%, transparent 42%)`,
        }}
      />
      {/* fine telemetry dot grid */}
      <AbsoluteFill
        style={{
          opacity: 0.35,
          backgroundImage: "radial-gradient(rgba(148,163,184,0.25) 1.5px, transparent 1.5px)",
          backgroundSize: "36px 36px",
          backgroundPosition: `${mod(f * 0.3, 36)}px 0px`,
          maskImage: "linear-gradient(to bottom, rgba(0,0,0,0.9), transparent 60%)",
          WebkitMaskImage: "linear-gradient(to bottom, rgba(0,0,0,0.9), transparent 60%)",
        }}
      />
      {/* perspective floor */}
      <div
        style={{
          position: "absolute",
          left: -600,
          right: -600,
          top: 1150,
          height: 1400,
          transform: "perspective(900px) rotateX(72deg)",
          transformOrigin: "top center",
          backgroundImage:
            "linear-gradient(rgba(34,211,238,0.10) 2px, transparent 2px), linear-gradient(90deg, rgba(34,211,238,0.10) 2px, transparent 2px)",
          backgroundSize: "90px 90px",
          backgroundPosition: `0px ${mod(f * 2, 90)}px`,
          maskImage: "linear-gradient(to bottom, rgba(0,0,0,0.9), transparent 75%)",
          WebkitMaskImage: "linear-gradient(to bottom, rgba(0,0,0,0.9), transparent 75%)",
        }}
      />
      {Array.from({ length: 34 }).map((_, i) => {
        const x = rand(i) * 1080;
        const y = mod(rand(i + 50) * 1920 - f * (0.4 + rand(i + 9) * 0.8), 1920);
        const size = 4 + rand(i + 3) * 14;
        const col = money && i % 2 === 0 ? C.green : i % 3 === 0 ? C.cyan : C.yellow;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: size,
              height: size,
              borderRadius: "50%",
              background: col,
              opacity: 0.1 + rand(i + 11) * 0.25,
              filter: `blur(${rand(i + 7) * 6}px)`,
              boxShadow: `0 0 ${size * 1.5}px ${col}`,
            }}
          />
        );
      })}
      <AbsoluteFill
        style={{ background: "radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,0.8) 100%)" }}
      />
    </AbsoluteFill>
  );
};

// -------------------------------------------------------------------------
// HUD — persistent micro-telemetry in the corners
// -------------------------------------------------------------------------
const HUD: React.FC<{ f: number }> = ({ f }) => {
  const t = f / FPS;
  const tc = `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(Math.floor(t % 60)).padStart(2, "0")}:${String(mod(f, 60)).padStart(2, "0")}`;
  const k = Math.floor(f / 8);
  const tok = 780 + Math.floor(rand(k) * 140);
  const lat = 9 + Math.floor(rand(k + 4) * 9);
  const online = f >= sec(18.6) ? 3 : 0;
  const style: React.CSSProperties = {
    position: "absolute",
    fontFamily: MONO,
    fontSize: 20,
    letterSpacing: 2,
    color: "rgba(148,163,184,0.75)",
  };
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={{ position: "absolute", top: 0, left: 0, height: 5, width: `${(f / 3660) * 100}%`, background: C.yellow, boxShadow: `0 0 14px ${C.yellow}` }} />
      <div style={{ ...style, top: 52, left: 46, display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ width: 14, height: 14, borderRadius: 7, background: C.red, opacity: mod(f / 20, 2) === 0 ? 1 : 0.25 }} />
        REC {tc}
      </div>
      <div style={{ ...style, top: 52, right: 46, color: online ? C.green : "rgba(148,163,184,0.75)" }}>
        AGENTS {online}/3 {online ? "● ONLINE" : "○ IDLE"}
      </div>
      <div style={{ ...style, bottom: 60, left: 46 }}>
        TOK/S {tok} · LAT {lat}ms
      </div>
      <div style={{ ...style, bottom: 60, right: 46 }}>
        PAYROLL $0 · UPTIME 99.9%
      </div>
      {/* corner brackets */}
      {[
        { top: 30, left: 24, b: "borderTop borderLeft" },
        { top: 30, right: 24, b: "borderTop borderRight" },
        { bottom: 36, left: 24, b: "borderBottom borderLeft" },
        { bottom: 36, right: 24, b: "borderBottom borderRight" },
      ].map((p, i) => {
        const s: React.CSSProperties = { position: "absolute", width: 40, height: 40 };
        const line = "3px solid rgba(250,204,21,0.45)";
        p.b.split(" ").forEach((k2) => ((s as Record<string, unknown>)[k2] = line));
        const { b: _b, ...pos } = p;
        return <div key={i} style={{ ...s, ...pos }} />;
      })}
    </AbsoluteFill>
  );
};

// -------------------------------------------------------------------------
// Shared pieces
// -------------------------------------------------------------------------
const Highlight: React.FC<{ f: number; at: number; children: React.ReactNode; size: number; color?: string }> = ({
  f,
  at,
  children,
  size,
  color = C.yellow,
}) => {
  const w = interpolate(f, [at, at + 14], [0, 1], { ...clamp, easing: EXPO_OUT });
  return (
    <span style={{ position: "relative", display: "inline-block", padding: "0 18px" }}>
      <span
        style={{
          position: "absolute",
          left: 0,
          top: "8%",
          bottom: "4%",
          width: `${w * 100}%`,
          background: color,
          borderRadius: 12,
          boxShadow: `0 0 ${50 * w}px ${color}aa`,
          transform: "skewX(-6deg)",
        }}
      />
      <span
        style={{
          position: "relative",
          fontFamily: SANS,
          fontWeight: 900,
          letterSpacing: -2,
          fontSize: size,
          color: w > 0.4 ? "#0a0a0a" : C.white,
        }}
      >
        {children}
      </span>
    </span>
  );
};

const Slam: React.FC<{ f: number; at: number; fps: number; children: React.ReactNode; style?: React.CSSProperties }> = ({
  f,
  at,
  fps,
  children,
  style,
}) => {
  if (f < at) return null;
  const s = sp(f, at, fps, { damping: 10, stiffness: 260, mass: 0.5 });
  return (
    <div
      style={{
        transform: `scale(${2.2 - s * 1.2}) translateY(${(1 - s) * -20}px)`,
        opacity: interpolate(s, [0, 0.25], [0, 1], clamp),
        filter: `blur(${(1 - s) * 8}px)`,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

const Strike: React.FC<{ f: number; at: number; color?: string; width?: number; rot?: number }> = ({
  f,
  at,
  color = C.red,
  width = 108,
  rot = -6,
}) => {
  const s = interpolate(f, [at, at + 12], [0, 1], { ...clamp, easing: EXPO_OUT });
  if (s <= 0) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: `${(100 - width) / 2}%`,
        top: "50%",
        height: 16,
        width: `${s * width}%`,
        background: color,
        borderRadius: 8,
        transform: `rotate(${rot}deg)`,
        boxShadow: `0 0 30px ${color}`,
      }}
    />
  );
};

const Title: React.FC<{ top?: number; children: React.ReactNode }> = ({ top = 200, children }) => (
  <div
    style={{
      position: "absolute",
      top,
      width: "100%",
      textAlign: "center",
      fontFamily: SANS,
      fontWeight: 900,
      letterSpacing: -3,
      color: C.white,
      lineHeight: 1.02,
      textShadow: "0 10px 40px rgba(0,0,0,0.8)",
    }}
  >
    {children}
  </div>
);

const Badge: React.FC<{ f: number; label: string; color: string; size?: number; solid?: boolean }> = ({
  f,
  label,
  color,
  size = 22,
  solid = false,
}) => (
  <span
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      padding: `${size * 0.25}px ${size * 0.65}px`,
      borderRadius: 999,
      border: `2px solid ${color}`,
      background: solid ? color : `${color}22`,
      color: solid ? "#0a0a0a" : color,
      fontFamily: MONO,
      fontWeight: 800,
      fontSize: size,
      letterSpacing: 2,
      whiteSpace: "nowrap",
    }}
  >
    <span
      style={{
        width: size * 0.45,
        height: size * 0.45,
        borderRadius: "50%",
        background: solid ? "#0a0a0a" : color,
        opacity: 0.35 + 0.65 * Math.abs(Math.sin(f / 9)),
        boxShadow: `0 0 10px ${color}`,
      }}
    />
    {label}
  </span>
);

const Bar: React.FC<{ p: number; color: string; h?: number }> = ({ p, color, h = 12 }) => (
  <div style={{ height: h, borderRadius: h, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
    <div
      style={{
        width: `${clamp01(p) * 100}%`,
        height: "100%",
        borderRadius: h,
        background: `linear-gradient(90deg, ${color}66, ${color})`,
        boxShadow: `0 0 14px ${color}`,
      }}
    />
  </div>
);

/** Mini sparkline with gradient fill that draws itself in. */
const Spark: React.FC<{
  f: number;
  seed: number;
  w: number;
  h: number;
  color: string;
  trend?: number;
  at?: number;
  dur?: number;
}> = ({ f, seed, w, h, color, trend = 0.7, at = 0, dur = 50 }) => {
  const N = 22;
  const pts = Array.from({ length: N }, (_, i) => {
    const u = i / (N - 1);
    const base = trend >= 0 ? 0.12 + trend * u * 0.72 : 0.85 + trend * u * 0.72;
    const v = clamp01(base + (rand(seed * 17 + i) - 0.5) * 0.22 + Math.sin(f / 18 + i * 0.9) * 0.02);
    return [u * w, h - v * h] as const;
  });
  const vis = Math.max(2, Math.ceil(interpolate(f, [at, at + dur], [2, N], clamp)));
  const shown = pts.slice(0, vis);
  const line = shown.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const last = shown[shown.length - 1];
  const id = `sg${seed}`;
  return (
    <svg width={w} height={h} style={{ overflow: "visible", display: "block" }}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.45} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <polygon points={`0,${h} ${line} ${last[0]},${h}`} fill={`url(#${id})`} />
      <polyline points={line} fill="none" stroke={color} strokeWidth={3.5} strokeLinejoin="round" style={{ filter: `drop-shadow(0 0 6px ${color})` }} />
      <circle cx={last[0]} cy={last[1]} r={6 + Math.abs(Math.sin(f / 7)) * 3} fill={color} />
    </svg>
  );
};

/** Little key/value telemetry block with ticking values. */
const Telemetry: React.FC<{ f: number; rows: [string, (k: number) => string][]; color?: string; size?: number }> = ({
  f,
  rows,
  color = C.cyan,
  size = 20,
}) => {
  const k = Math.floor(f / 6);
  return (
    <div style={{ fontFamily: MONO, fontSize: size, lineHeight: 1.5, letterSpacing: 1 }}>
      {rows.map(([key, val], i) => (
        <div key={key} style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
          <span style={{ color: C.muted }}>{key}</span>
          <span style={{ color }}>{val(k + i * 7)}</span>
        </div>
      ))}
    </div>
  );
};

const Card3D: React.FC<{
  f: number;
  fps: number;
  at: number;
  x: number;
  y: number;
  w: number;
  h: number;
  rotY: number;
  rotX?: number;
  children: React.ReactNode;
  accent?: string;
  pad?: number;
  dim?: number;
}> = ({ f, fps, at, x, y, w, h, rotY, rotX = 10, children, accent = C.yellow, pad = 26, dim = 1 }) => {
  const s = sp(f, at, fps, { damping: 13, stiffness: 150, mass: 0.7 });
  const bob = Math.sin((f + at) / 22) * 8;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y + bob,
        width: w,
        height: h,
        perspective: 1400,
        opacity: interpolate(s, [0, 0.3], [0, 1], clamp) * dim,
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          borderRadius: 24,
          background: C.panel,
          border: `2px solid ${accent}`,
          boxShadow: `0 40px 80px rgba(0,0,0,0.65), 0 0 40px ${accent}55, inset 0 1px 0 rgba(255,255,255,0.1)`,
          transform: `translateZ(${(1 - s) * -600}px) translateY(${(1 - s) * 300}px) rotateY(${rotY + (1 - s) * 60}deg) rotateX(${rotX}deg)`,
          padding: pad,
          boxSizing: "border-box",
          overflow: "hidden",
          fontFamily: SANS,
          position: "relative",
        }}
      >
        {children}
      </div>
    </div>
  );
};

/** Flat 2D person with rim light. */
const Person: React.FC<{ size: number; color: string; rim?: string }> = ({ size, color, rim }) => (
  <div style={{ width: size, height: size * 1.2, position: "relative" }}>
    <div
      style={{
        position: "absolute",
        left: size * 0.3,
        top: 0,
        width: size * 0.4,
        height: size * 0.4,
        borderRadius: "50%",
        background: color,
        border: rim ? `3px solid ${rim}` : undefined,
        boxShadow: rim ? `0 0 ${size * 0.25}px ${rim}` : undefined,
        boxSizing: "border-box",
      }}
    />
    <div
      style={{
        position: "absolute",
        left: size * 0.1,
        top: size * 0.46,
        width: size * 0.8,
        height: size * 0.72,
        borderRadius: `${size * 0.4}px ${size * 0.4}px ${size * 0.1}px ${size * 0.1}px`,
        background: color,
        border: rim ? `3px solid ${rim}` : undefined,
        boxShadow: rim ? `0 0 ${size * 0.25}px ${rim}` : undefined,
        boxSizing: "border-box",
      }}
    />
  </div>
);

/** Neon agent bot head. */
const AgentBot: React.FC<{ f: number; size: number; color: string; seed?: number }> = ({ f, size, color, seed = 0 }) => {
  const blink = mod(f / 4 + seed * 11, 45) === 0;
  const eyeH = blink ? 3 : size * 0.18;
  return (
    <div style={{ width: size, height: size * 1.15, position: "relative" }}>
      <div style={{ position: "absolute", left: size / 2 - 2, top: 0, width: 4, height: size * 0.18, background: color }} />
      <div
        style={{
          position: "absolute",
          left: size / 2 - size * 0.08,
          top: -size * 0.06,
          width: size * 0.16,
          height: size * 0.16,
          borderRadius: "50%",
          background: color,
          boxShadow: `0 0 ${size * 0.3}px ${color}`,
          opacity: 0.5 + 0.5 * Math.abs(Math.sin((f + seed * 20) / 8)),
        }}
      />
      <div
        style={{
          position: "absolute",
          top: size * 0.18,
          left: 0,
          width: size,
          height: size * 0.92,
          borderRadius: size * 0.26,
          background: "#0b0d14",
          border: `${Math.max(2, size * 0.05)}px solid ${color}`,
          boxShadow: `0 0 ${size * 0.35}px ${color}88, inset 0 0 ${size * 0.2}px ${color}44`,
          boxSizing: "border-box",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: size * 0.16,
        }}
      >
        {[0, 1].map((e) => (
          <div
            key={e}
            style={{ width: size * 0.16, height: eyeH, borderRadius: size * 0.05, background: color, boxShadow: `0 0 ${size * 0.15}px ${color}` }}
          />
        ))}
      </div>
    </div>
  );
};

const FloorShadow: React.FC<{ x: number; y: number; w: number; f: number }> = ({ x, y, w, f }) => (
  <div
    style={{
      position: "absolute",
      left: x - w / 2,
      top: y,
      width: w,
      height: 60,
      borderRadius: "50%",
      background: "radial-gradient(ellipse at center, rgba(0,0,0,0.75) 0%, transparent 70%)",
      transform: `scaleX(${1 + Math.sin(f / 22) * 0.05})`,
      filter: "blur(6px)",
    }}
  />
);

const Glitch: React.FC<{ f: number; text: string; size: number }> = ({ f, text, size }) => {
  const k = Math.floor(f / 2);
  const amp = rand(k) > 0.55 ? 1 : 0.15;
  const slices = 6;
  return (
    <div style={{ position: "relative", height: size * 1.05, fontFamily: SANS, fontWeight: 900, fontSize: size, letterSpacing: -10, lineHeight: 1 }}>
      <div style={{ visibility: "hidden" }}>{text}</div>
      {[
        { c: C.red, dx: -8 },
        { c: C.cyan, dx: 8 },
      ].map((l) => (
        <div
          key={l.c}
          style={{
            position: "absolute",
            inset: 0,
            color: l.c,
            opacity: 0.8,
            transform: `translateX(${l.dx * amp * (1 + rand(k + 3) * 2)}px)`,
            mixBlendMode: "screen",
          }}
        >
          {text}
        </div>
      ))}
      {Array.from({ length: slices }).map((_, i) => {
        const top = (i / slices) * 100;
        const off = amp > 0.5 ? (rand(k * 13 + i) - 0.5) * 60 : 0;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              inset: 0,
              color: C.white,
              clipPath: `inset(${top}% 0 ${100 - top - 100 / slices}% 0)`,
              transform: `translateX(${off}px)`,
              textShadow: `0 0 40px ${C.yellow}88`,
            }}
          >
            {text}
          </div>
        );
      })}
    </div>
  );
};

/** Header used by agent scenes: colored tag chip + title + status badge. */
const AgentHeader: React.FC<{
  f: number;
  fps: number;
  at: number;
  tag: string;
  title: string;
  color: string;
  status: string;
}> = ({ f, fps, at, tag, title, color, status }) => {
  const s = sp(f, at, fps);
  const s2 = sp(f, at + 8, fps);
  return (
    <div style={{ position: "absolute", top: 140, width: "100%", textAlign: "center", fontFamily: SANS }}>
      <div style={{ display: "inline-flex", alignItems: "center", gap: 18, transform: `scale(${s}) rotate(${(1 - s) * -12}deg)` }}>
        <AgentBot f={f} size={58} color={color} seed={tag.length} />
        <div
          style={{
            fontFamily: MONO,
            fontSize: 34,
            fontWeight: 800,
            color: "#0a0a0a",
            background: color,
            padding: "10px 26px",
            borderRadius: 12,
            letterSpacing: 4,
            boxShadow: `0 0 40px ${color}99`,
          }}
        >
          {tag}
        </div>
        <Badge f={f} label={status} color={color} />
      </div>
      <div
        style={{
          marginTop: 18,
          fontSize: 92,
          fontWeight: 900,
          color: C.white,
          letterSpacing: -2,
          lineHeight: 1.02,
          opacity: s2,
          transform: `translateY(${(1 - s2) * 50}px)`,
          textShadow: `0 10px 40px rgba(0,0,0,0.8), 0 0 30px ${color}55`,
        }}
      >
        {title}
      </div>
    </div>
  );
};

// -------------------------------------------------------------------------
// 01 — Hook: 2026 + 1 человек + 3 агента vs 20 сотрудников
// -------------------------------------------------------------------------
const AGENT_COLORS = [C.cyan, C.purple, C.green];

const SceneHook: React.FC<{ f: number; fps: number }> = ({ f, fps }) => {
  const op = sceneOpacity(f, SC.hook, 0, 10);
  if (op <= 0) return null;
  const hit = sec(0.28);
  const g = sp(f, hit, fps, { damping: 9, stiffness: 300, mass: 0.6 });
  const shake = f >= hit && f < hit + 14 ? (rand(f) - 0.5) * 36 : 0;
  const sub = sp(f, sec(1.62), fps);
  const vs = sp(f, sec(5.24), fps, { damping: 8, stiffness: 280, mass: 0.5 });
  const race = interpolate(f, [sec(5.24), sec(8.4)], [0, 1], { ...clamp, easing: EXPO_OUT });
  const lose = interpolate(f, [sec(5.24), sec(6.5)], [0, 1], clamp);
  return (
    <AbsoluteFill style={{ opacity: op, transform: `translate(${shake}px, ${shake * 0.5}px)` }}>
      <div style={{ position: "absolute", top: 120, width: "100%", textAlign: "center", fontFamily: MONO, fontSize: 26, letterSpacing: 8, color: C.muted }}>
        // SYSTEM DATE · {mod(f * 37, 9999).toString().padStart(4, "0")}
      </div>
      {f >= hit && (
        <div
          style={{
            position: "absolute",
            top: 160,
            width: "100%",
            display: "flex",
            justifyContent: "center",
            transform: `scale(${3 - g * 2})`,
            opacity: interpolate(g, [0, 0.2], [0, 1], clamp),
          }}
        >
          <Glitch f={f} text="2026" size={290} />
        </div>
      )}
      <div
        style={{
          position: "absolute",
          top: 470,
          width: "100%",
          textAlign: "center",
          opacity: sub,
          transform: `translateY(${(1 - sub) * 30}px)`,
        }}
      >
        <Badge f={f} label="ЭПОХА АГЕНТОВ · v3.0" color={C.yellow} size={26} />
      </div>

      {/* LEFT: 1 человек + 3 агента */}
      {f >= sec(2.26) && (
        <Card3D f={f} fps={fps} at={sec(2.26)} x={40} y={560} w={470} h={470} rotY={14} accent={C.yellow} pad={20}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <Badge f={f} label="SOLO + AI" color={C.yellow} size={18} />
            <span style={{ fontFamily: MONO, fontSize: 18, color: C.green }}>▲ {fmt(interpolate(f, [sec(5.24), sec(8.4)], [100, 2600], clamp))}%</span>
          </div>
          <div style={{ position: "absolute", left: 235 - 55, top: 150 }}>
            <Person size={110} color="#111827" rim={C.yellow} />
          </div>
          {[0, 1, 2].map((i) => {
            const s = sp(f, sec(3.56) + i * 7, fps, { damping: 9, stiffness: 240, mass: 0.5 });
            const ang = f / 40 + (i * Math.PI * 2) / 3;
            const r = 150 * s;
            const x = 235 + Math.cos(ang) * r - 32;
            const y = 210 + Math.sin(ang) * r * 0.62 - 36;
            return (
              <div key={i} style={{ position: "absolute", left: x, top: y, transform: `scale(${s})` }}>
                <AgentBot f={f} size={64} color={AGENT_COLORS[i]} seed={i} />
              </div>
            );
          })}
          <svg width={430} height={430} style={{ position: "absolute", left: 20, top: 20, pointerEvents: "none" }}>
            <ellipse cx={215} cy={190} rx={150} ry={93} fill="none" stroke="rgba(250,204,21,0.25)" strokeDasharray="6 10" strokeWidth={2} strokeDashoffset={-f} />
          </svg>
          <div style={{ position: "absolute", left: 0, right: 0, bottom: 22, textAlign: "center", fontWeight: 900, fontSize: 40, color: C.yellow, letterSpacing: -1 }}>
            1 ЧЕЛОВЕК + 3 АГЕНТА
          </div>
        </Card3D>
      )}

      {/* RIGHT: 20 сотрудников */}
      {f >= sec(6.06) && (
        <Card3D f={f} fps={fps} at={sec(6.06)} x={570} y={560} w={470} h={470} rotY={-14} accent={C.muted} pad={20}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <Badge f={f} label="STUDIO" color={C.red} size={18} />
            <span style={{ fontFamily: MONO, fontSize: 18, color: C.red }}>−$40K/мес</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8, marginTop: 18, justifyItems: "center" }}>
            {Array.from({ length: 20 }).map((_, i) => {
              const s = sp(f, sec(6.06) + i * 1.5, fps, { damping: 10, stiffness: 260, mass: 0.4 });
              const sleepy = rand(i + 40) > 0.6;
              return (
                <div key={i} style={{ position: "relative", transform: `scale(${s}) translateY(${Math.sin((f + i * 9) / 14) * 2}px)` }}>
                  <Person size={52} color={sleepy ? "#334155" : "#475569"} />
                  {sleepy && (
                    <span style={{ position: "absolute", right: -6, top: -10, fontFamily: MONO, fontSize: 16, color: C.muted, opacity: Math.abs(Math.sin((f + i * 13) / 18)) }}>
                      z
                    </span>
                  )}
                </div>
              );
            })}
          </div>
          {f >= sec(7.08) && (
            <div style={{ position: "absolute", left: 0, right: 0, bottom: 22, textAlign: "center" }}>
              <Slam f={f} at={sec(7.08)} fps={fps} style={{ fontWeight: 900, fontSize: 40, color: C.white, letterSpacing: -1 }}>
                20 СОТРУДНИКОВ
              </Slam>
            </div>
          )}
        </Card3D>
      )}

      {/* VS */}
      {f >= sec(5.24) && (
        <div
          style={{
            position: "absolute",
            left: 540 - 70,
            top: 730,
            width: 140,
            height: 140,
            borderRadius: 70,
            background: C.red,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: SANS,
            fontWeight: 900,
            fontSize: 62,
            color: C.white,
            transform: `scale(${2 - vs}) rotate(${(1 - vs) * 90}deg)`,
            opacity: vs,
            boxShadow: `0 0 ${50 + Math.sin(f / 5) * 20}px ${C.red}`,
            border: "5px solid #0a0a0a",
          }}
        >
          VS
        </div>
      )}
      <FloorShadow x={540} y={1050} w={900} f={f} />

      {/* race bars */}
      {f >= sec(5.0) && (
        <div
          style={{
            position: "absolute",
            left: 70,
            right: 70,
            top: 1110,
            padding: "22px 28px",
            borderRadius: 22,
            background: C.panel,
            border: "2px solid rgba(255,255,255,0.08)",
            fontFamily: MONO,
            opacity: sp(f, sec(5.0), fps),
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 20, color: C.muted, letterSpacing: 3, marginBottom: 14 }}>
            <span>OUTPUT / 24H</span>
            <span style={{ color: C.yellow }}>LIVE ●</span>
          </div>
          {[
            { l: "1 + 3 AI", p: race, c: C.yellow, v: `${fmt(race * 312)} задач` },
            { l: "20 STAFF", p: race * 0.32, c: lose > 0.5 ? C.red : C.muted, v: `${fmt(race * 41)} задач` },
          ].map((r) => (
            <div key={r.l} style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 10 }}>
              <span style={{ width: 150, fontSize: 22, color: C.white }}>{r.l}</span>
              <div style={{ flex: 1 }}>
                <Bar p={r.p} color={r.c} h={18} />
              </div>
              <span style={{ width: 150, textAlign: "right", fontSize: 22, color: r.c }}>{r.v}</span>
            </div>
          ))}
        </div>
      )}
    </AbsoluteFill>
  );
};

// -------------------------------------------------------------------------
// 02 — Payroll + endless Zoom
// -------------------------------------------------------------------------
const ROLES = [
  { r: "Дизайнер", v: 12000, at: 13.02, c: C.pink },
  { r: "Программист", v: 18000, at: 13.96, c: C.blue },
  { r: "Маркетолог", v: 10000, at: 14.86, c: C.purple },
];
const ZOOM_NAMES = ["Дизайнер", "PM Олег", "Маркетолог", "Dev Team", "Клиент", "Аналитик", "QA", "Ещё +14", "Junior", "HR"];

const ScenePayroll: React.FC<{ f: number; fps: number }> = ({ f, fps }) => {
  const op = sceneOpacity(f, SC.payroll);
  if (op <= 0) return null;
  const a = SC.payroll[0];
  const chip = sp(f, sec(8.78), fps);
  const totalAt = sec(15.5);
  const total = interpolate(f, [totalAt, totalAt + 30], [0, 40000], { ...clamp, easing: EXPO_OUT });
  const strikeAt = sec(16.3);
  const over = f >= totalAt;
  const zoomAt = sec(16.02);
  const zs = sp(f, zoomAt, fps, { damping: 14, stiffness: 140, mass: 0.7 });
  const callSec = 3600 + Math.max(0, f - zoomAt) * 37;
  const callT = `${String(Math.floor(callSec / 3600)).padStart(2, "0")}:${String(Math.floor((callSec % 3600) / 60)).padStart(2, "0")}:${String(Math.floor(callSec % 60)).padStart(2, "0")}`;
  const tileH = 150;
  const scroll = Math.max(0, f - zoomAt) * 2.2;
  return (
    <AbsoluteFill style={{ opacity: op }}>
      <div style={{ position: "absolute", top: 140, width: "100%", textAlign: "center", fontFamily: SANS }}>
        <span
          style={{
            display: "inline-block",
            fontFamily: MONO,
            fontSize: 34,
            fontWeight: 800,
            color: C.white,
            background: C.red,
            padding: "10px 26px",
            borderRadius: 12,
            letterSpacing: 4,
            transform: `scale(${chip}) rotate(${(1 - chip) * -12}deg)`,
            boxShadow: `0 0 40px ${C.red}99`,
          }}
        >
          ⏪ РАНЬШЕ
        </span>
        <div style={{ marginTop: 16, fontSize: 56, fontWeight: 900, color: C.white, letterSpacing: -2, opacity: sp(f, sec(9.7), fps) }}>
          ЗАПУСК ЦИФРОВОГО ПРОДУКТА
        </div>
      </div>

      {/* payroll ledger */}
      <Card3D f={f} fps={fps} at={sec(10.1)} x={70} y={350} w={940} h={590} rotY={-6} rotX={8} accent={over ? C.red : C.border}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontFamily: MONO, fontSize: 22, color: C.muted, letterSpacing: 4 }}>PAYROLL · БЮДЖЕТ / МЕС</div>
            <div style={{ fontSize: 34, fontWeight: 900, color: C.white }}>Команда запуска</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <Spark f={f} seed={3} w={170} h={60} color={C.red} trend={-0.8} at={sec(10.4)} dur={120} />
            {over ? <Badge f={f} label="OVER BUDGET" color={C.red} size={18} /> : <Badge f={f} label="LOADING" color={C.muted} size={18} />}
          </div>
        </div>
        <div style={{ height: 2, background: "rgba(255,255,255,0.08)", margin: "18px 0" }} />
        {ROLES.map((ro, i) => {
          const at = sec(ro.at);
          const s = sp(f, at, fps);
          const on = f >= at;
          return (
            <div key={ro.r} style={{ display: "flex", alignItems: "center", gap: 20, height: 92 }}>
              {on ? (
                <>
                  <div style={{ transform: `scale(${s})` }}>
                    <Person size={56} color="#1f2937" rim={ro.c} />
                  </div>
                  <div style={{ width: 260, fontSize: 36, fontWeight: 800, color: C.white, opacity: s }}>{ro.r}</div>
                  <div style={{ flex: 1 }}>
                    <Bar p={s * (ro.v / 18000)} color={ro.c} h={16} />
                  </div>
                  <div style={{ width: 200, textAlign: "right", fontFamily: MONO, fontSize: 36, fontWeight: 800, color: C.red }}>
                    -${fmt(s * ro.v)}
                  </div>
                </>
              ) : (
                <div
                  style={{
                    flex: 1,
                    height: 50,
                    borderRadius: 12,
                    background: `linear-gradient(90deg, rgba(255,255,255,0.04) ${mod(f * 3 + i * 40, 200) - 50}%, rgba(255,255,255,0.12) ${mod(f * 3 + i * 40, 200) - 25}%, rgba(255,255,255,0.04) ${mod(f * 3 + i * 40, 200)}%)`,
                  }}
                />
              )}
            </div>
          );
        })}
        <div style={{ height: 2, background: "rgba(255,255,255,0.08)", margin: "10px 0 6px" }} />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontFamily: MONO, fontSize: 24, color: C.muted, letterSpacing: 4 }}>ИТОГО</span>
          {over && (
            <div style={{ position: "relative" }}>
              <Slam f={f} at={totalAt} fps={fps} style={{ fontSize: 92, fontWeight: 900, color: f >= strikeAt ? C.muted : C.white, letterSpacing: -3 }}>
                ${fmt(total)}/МЕС
              </Slam>
              <Strike f={f} at={strikeAt} width={106} rot={-5} />
            </div>
          )}
        </div>
      </Card3D>

      {/* endless zoom */}
      {f >= zoomAt - 8 && (
        <div
          style={{
            position: "absolute",
            left: 60,
            right: 60,
            top: 990,
            height: 420,
            borderRadius: 24,
            background: "#0b0d14",
            border: "2px solid rgba(96,165,250,0.5)",
            boxShadow: "0 40px 80px rgba(0,0,0,0.6), 0 0 40px rgba(96,165,250,0.25)",
            overflow: "hidden",
            transform: `perspective(1400px) rotateX(${12 + (1 - zs) * 50}deg) translateY(${(1 - zs) * 300}px)`,
            opacity: zs,
          }}
        >
          <div
            style={{
              height: 54,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0 20px",
              background: "rgba(96,165,250,0.12)",
              fontFamily: MONO,
              fontSize: 20,
              color: C.blue,
            }}
          >
            <span>● Созвон #{47 + Math.floor(Math.max(0, f - zoomAt) / 12)} · «Синк по синку»</span>
            <span style={{ color: C.red }}>{callT}</span>
          </div>
          <div style={{ position: "relative", height: 366, overflow: "hidden" }}>
            <div style={{ position: "absolute", left: 12, right: 12, top: -mod(scroll, tileH + 12) }}>
              {Array.from({ length: 4 }).map((_, row) => (
                <div key={row} style={{ display: "flex", gap: 12, marginTop: 12 }}>
                  {[0, 1, 2].map((col) => {
                    const idx = mod(Math.floor(scroll / (tileH + 12)) * 3 + row * 3 + col, ZOOM_NAMES.length);
                    const speaking = mod(f / 25, ZOOM_NAMES.length) === idx;
                    return (
                      <div
                        key={col}
                        style={{
                          flex: 1,
                          height: tileH,
                          borderRadius: 14,
                          background: `linear-gradient(160deg, #1e293b, #0f172a)`,
                          border: speaking ? `3px solid ${C.green}` : "2px solid rgba(255,255,255,0.06)",
                          position: "relative",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Person size={60} color="#475569" />
                        <span style={{ position: "absolute", left: 10, bottom: 8, fontFamily: SANS, fontSize: 18, fontWeight: 700, color: C.white, background: "rgba(0,0,0,0.5)", padding: "2px 8px", borderRadius: 6 }}>
                          {ZOOM_NAMES[idx]}
                        </span>
                        <span style={{ position: "absolute", right: 10, top: 8, fontSize: 18 }}>{rand(idx + 3) > 0.5 ? "🔇" : "🎙"}</span>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      {f >= sec(16.56) && (
        <div style={{ position: "absolute", right: 80, top: 950, transform: `rotate(6deg) scale(${sp(f, sec(16.56), fps)})` }}>
          <Badge f={f} label={`DAY ${fmt(interpolate(f, [sec(16.56), sec(18.2)], [1, 187], clamp))} / МЕСЯЦЫ`} color={C.red} size={24} solid />
        </div>
      )}
    </AbsoluteFill>
  );
};

// -------------------------------------------------------------------------
// 03 — 3-agent terminal command center
// -------------------------------------------------------------------------
const PANES = [
  {
    tag: "AGENT_01",
    name: "TREND RADAR",
    c: C.cyan,
    at: 19.5,
    lines: [
      "scan youtube/trending … 1,284 videos",
      "tiktok #aitools  +312% ▲",
      "signal: faceless niche · score 94",
      "→ handoff: agent_02",
      "scan reddit/r/sidehustle … ok",
      "cpm estimate: $14.20 ▲",
    ],
  },
  {
    tag: "AGENT_02",
    name: "BUILDER",
    c: C.purple,
    at: 19.8,
    lines: [
      "create-site --template saas ✓",
      "render 1080x1920 … 62%",
      "script.md ✓ 1,200 words",
      "deploy → edge ✓ 4.1s",
      "thumbnail v3 ✓ ctr 11.4%",
      "lint 0 errors · build ok",
    ],
  },
  {
    tag: "AGENT_03",
    name: "AUTOPILOT",
    c: C.green,
    at: 20.1,
    lines: [
      "post → youtube ✓",
      "reply client #318 ✓",
      "payment: +$350 received",
      "post → tiktok ✓",
      "invoice #0042 paid ✓",
      "sleep? never.",
    ],
  },
];

const SceneTerm: React.FC<{ f: number; fps: number }> = ({ f, fps }) => {
  const op = sceneOpacity(f, SC.term);
  if (op <= 0) return null;
  const a = SC.term[0];
  const win3d = sp(f, sec(19.0), fps, { damping: 14, stiffness: 140, mass: 0.7 });
  const cursorOn = mod(f / 15, 2) === 0;
  return (
    <AbsoluteFill style={{ opacity: op }}>
      <Title top={130}>
        <Slam f={f} at={sec(18.32)} fps={fps} style={{ fontSize: 120, color: C.yellow, textShadow: "0 0 60px rgba(250,204,21,0.5)" }}>
          ТЕПЕРЬ
        </Slam>
        <div style={{ fontSize: 54, marginTop: 6, opacity: sp(f, sec(19.04), fps), letterSpacing: -1 }}>
          ВСЯ КОМАНДА — В <Highlight f={f} at={sec(20.46)} size={54}>1 ТЕРМИНАЛЕ</Highlight>
        </div>
      </Title>
      <div
        style={{
          position: "absolute",
          left: 50,
          right: 50,
          top: 420,
          height: 960,
          borderRadius: 24,
          background: C.panel,
          border: `2px solid ${C.border}`,
          boxShadow: "0 60px 120px rgba(0,0,0,0.7), 0 0 60px rgba(250,204,21,0.2)",
          overflow: "hidden",
          transform: `perspective(1600px) rotateX(${10 + (1 - win3d) * 40}deg) rotateY(${-4 + Math.sin(f / 50) * 2}deg) translateY(${(1 - win3d) * 400}px)`,
          opacity: interpolate(win3d, [0, 0.3], [0, 1], clamp),
        }}
      >
        <div style={{ height: 58, display: "flex", alignItems: "center", padding: "0 22px", gap: 12, background: "rgba(255,255,255,0.04)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
            <div key={c} style={{ width: 18, height: 18, borderRadius: 9, background: c }} />
          ))}
          <div style={{ flex: 1, textAlign: "center", fontFamily: MONO, fontSize: 22, color: C.muted }}>~/empire — tmux — 3 agents</div>
          <Badge f={f} label="LIVE" color={C.red} size={16} />
        </div>
        {PANES.map((p, i) => {
          const at = sec(p.at);
          const s = sp(f, at, fps);
          const k = Math.max(0, Math.floor((f - at) / 10));
          const cpu = 40 + rand(Math.floor(f / 8) + i * 9) * 55;
          return (
            <div
              key={p.tag}
              style={{
                height: 290,
                borderBottom: i < 2 ? "1px solid rgba(255,255,255,0.08)" : undefined,
                padding: "16px 24px",
                boxSizing: "border-box",
                opacity: f >= at ? s : 0.15,
                background: `linear-gradient(90deg, ${p.c}10, transparent 40%)`,
                position: "relative",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <AgentBot f={f} size={42} color={p.c} seed={i} />
                <span style={{ fontFamily: MONO, fontSize: 26, fontWeight: 800, color: p.c }}>{p.tag}</span>
                <span style={{ fontFamily: SANS, fontSize: 24, fontWeight: 800, color: C.white }}>{p.name}</span>
                <div style={{ flex: 1 }} />
                <span style={{ fontFamily: MONO, fontSize: 18, color: C.muted }}>CPU</span>
                <div style={{ width: 110 }}>
                  <Bar p={cpu / 100} color={p.c} h={10} />
                </div>
                <Badge f={f + i * 10} label="ONLINE" color={C.green} size={16} />
              </div>
              <div style={{ marginTop: 12, fontFamily: MONO, fontSize: 25, lineHeight: 1.5 }}>
                {f >= at &&
                  [0, 1, 2, 3].map((j) => {
                    const n = k - 3 + j;
                    if (n < 0) return null;
                    const line = p.lines[mod(n, p.lines.length)];
                    const isLast = j === 3;
                    return (
                      <div key={j} style={{ color: isLast ? C.white : "rgba(248,250,252,0.55)", whiteSpace: "pre" }}>
                        <span style={{ color: p.c }}>$ </span>
                        {line}
                        {isLast && <span style={{ color: C.yellow, opacity: cursorOn ? 1 : 0 }}> ▋</span>}
                      </div>
                    );
                  })}
              </div>
              <div style={{ position: "absolute", right: 24, bottom: 16 }}>
                <Spark f={f} seed={20 + i} w={150} h={46} color={p.c} trend={0.7} at={at} dur={60} />
              </div>
            </div>
          );
        })}
        <div style={{ height: 34, display: "flex", alignItems: "center", gap: 24, padding: "0 22px", background: C.yellow, color: "#0a0a0a", fontFamily: MONO, fontSize: 18, fontWeight: 800 }}>
          <span>[0] trend</span>
          <span>[1] build</span>
          <span>[2] post</span>
          <div style={{ flex: 1 }} />
          <span>⏱ 24/7</span>
          <span>💲 PAYROLL $0</span>
        </div>
      </div>
      <FloorShadow x={540} y={1390} w={900} f={f} />
    </AbsoluteFill>
  );
};

// -------------------------------------------------------------------------
// 04 — Agent 01 Trend Radar
// -------------------------------------------------------------------------
const BLIPS = [
  { a: 30, r: 0.55, t: "#aitools" },
  { a: 110, r: 0.78, t: "#faceless" },
  { a: 165, r: 0.4, t: "#notion" },
  { a: 220, r: 0.7, t: "#shorts" },
  { a: 290, r: 0.5, t: "#saas" },
  { a: 335, r: 0.85, t: "#ugc" },
];

const SceneRadar: React.FC<{ f: number; fps: number }> = ({ f, fps }) => {
  const op = sceneOpacity(f, SC.radar);
  if (op <= 0) return null;
  const a = SC.radar[0];
  const cx = 540;
  const cy = 690;
  const R = 270;
  const sweep = mod(f * 4, 360);
  const rs = sp(f, a + 6, fps, { damping: 14, stiffness: 120, mass: 0.8 });
  const found = sec(25.8);
  const fs = sp(f, found, fps, { damping: 9, stiffness: 260, mass: 0.5 });
  const rad = (d: number) => (d * Math.PI) / 180;
  const platforms = [
    { n: "YouTube", sub: "Trending · Shorts", c: C.red, x: 50, at: sec(23.08), seed: 41, views: 1.24e6 },
    { n: "TikTok", sub: "For You · #aitools", c: C.cyan, x: 560, at: sec(23.4), seed: 42, views: 3.8e6 },
  ];
  return (
    <AbsoluteFill style={{ opacity: op }}>
      <AgentHeader f={f} fps={fps} at={a} tag="AGENT 01" title="TREND RADAR" color={C.cyan} status="SCANNING" />
      <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, transform: `scale(${rs})`, transformOrigin: `${cx}px ${cy}px` }}>
        <svg width={1080} height={1100} style={{ position: "absolute", left: 0, top: 0 }}>
          <defs>
            <radialGradient id="radarBg">
              <stop offset="0%" stopColor="rgba(34,211,238,0.18)" />
              <stop offset="100%" stopColor="rgba(34,211,238,0.02)" />
            </radialGradient>
            <linearGradient id="sweepG" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="rgba(34,211,238,0)" />
              <stop offset="100%" stopColor="rgba(34,211,238,0.55)" />
            </linearGradient>
          </defs>
          <circle cx={cx} cy={cy} r={R} fill="url(#radarBg)" stroke={C.cyan} strokeWidth={3} style={{ filter: `drop-shadow(0 0 16px ${C.cyan})` }} />
          {[0.25, 0.5, 0.75].map((k) => (
            <circle key={k} cx={cx} cy={cy} r={R * k} fill="none" stroke="rgba(34,211,238,0.25)" strokeWidth={2} />
          ))}
          <line x1={cx - R} y1={cy} x2={cx + R} y2={cy} stroke="rgba(34,211,238,0.2)" strokeWidth={2} />
          <line x1={cx} y1={cy - R} x2={cx} y2={cy + R} stroke="rgba(34,211,238,0.2)" strokeWidth={2} />
          {Array.from({ length: 36 }).map((_, i) => {
            const ang = rad(i * 10);
            const r1 = R + 6;
            const r2 = R + (i % 3 === 0 ? 22 : 12);
            return <line key={i} x1={cx + Math.cos(ang) * r1} y1={cy + Math.sin(ang) * r1} x2={cx + Math.cos(ang) * r2} y2={cy + Math.sin(ang) * r2} stroke="rgba(34,211,238,0.5)" strokeWidth={2} />;
          })}
          <g transform={`rotate(${sweep} ${cx} ${cy})`}>
            <path d={`M ${cx} ${cy} L ${cx + R} ${cy} A ${R} ${R} 0 0 0 ${cx + Math.cos(rad(-50)) * R} ${cy + Math.sin(rad(-50)) * R} Z`} fill="url(#sweepG)" opacity={0.8} />
            <line x1={cx} y1={cy} x2={cx + R} y2={cy} stroke={C.cyan} strokeWidth={4} style={{ filter: `drop-shadow(0 0 10px ${C.cyan})` }} />
          </g>
        </svg>
        {BLIPS.map((b, i) => {
          const diff = mod(sweep - b.a, 360);
          const glow = Math.max(0, 1 - diff / 160);
          const appear = f >= a + 20 + i * 12;
          if (!appear) return null;
          const x = cx + Math.cos(rad(b.a)) * R * b.r;
          const y = cy + Math.sin(rad(b.a)) * R * b.r;
          return (
            <div key={b.t} style={{ position: "absolute", left: x - 10, top: y - 10 }}>
              <div style={{ width: 20, height: 20, borderRadius: 10, background: C.yellow, opacity: 0.35 + glow * 0.65, boxShadow: `0 0 ${10 + glow * 30}px ${C.yellow}`, transform: `scale(${1 + glow * 0.6})` }} />
              <div style={{ position: "absolute", left: 26, top: -8, fontFamily: MONO, fontSize: 22, color: C.white, whiteSpace: "nowrap", opacity: 0.5 + glow * 0.5, background: "rgba(0,0,0,0.55)", padding: "2px 8px", borderRadius: 6 }}>
                {b.t} <span style={{ color: C.green }}>+{Math.floor(80 + rand(i) * 300)}%</span>
              </div>
            </div>
          );
        })}
        <div style={{ position: "absolute", left: 70, top: 420 }}>
          <Telemetry
            f={f}
            rows={[
              ["SIGNALS", (k) => fmt(900 + k * 3)],
              ["NICHES", (k) => String(20 + mod(k, 17))],
              ["SWEEP", () => `${sweep}°`],
            ]}
          />
        </div>
        <div style={{ position: "absolute", right: 70, top: 420, width: 190 }}>
          <Telemetry
            f={f}
            color={C.yellow}
            rows={[
              ["CPM", (k) => `$${(11 + rand(k) * 4).toFixed(1)}`],
              ["HYPE", (k) => `${Math.floor(70 + rand(k + 2) * 29)}`],
              ["RISK", () => "LOW"],
            ]}
          />
        </div>
      </div>

      {platforms.map((p) =>
        f >= p.at ? (
          <Card3D key={p.n} f={f} fps={fps} at={p.at} x={p.x} y={1010} w={470} h={330} rotY={p.x < 500 ? 12 : -12} accent={p.c} pad={22}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 46, height: 46, borderRadius: 12, background: p.c, display: "flex", alignItems: "center", justifyContent: "center", color: "#0a0a0a", fontSize: 24, fontWeight: 900 }}>
                {p.n === "YouTube" ? "▶" : "♪"}
              </div>
              <div>
                <div style={{ fontSize: 30, fontWeight: 900, color: C.white }}>{p.n}</div>
                <div style={{ fontFamily: MONO, fontSize: 18, color: C.muted }}>{p.sub}</div>
              </div>
            </div>
            <div style={{ marginTop: 14 }}>
              <Spark f={f} seed={p.seed} w={420} h={120} color={p.c} trend={0.8} at={p.at} dur={90} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12, fontFamily: MONO }}>
              <span style={{ fontSize: 26, color: C.white, fontWeight: 800 }}>{fmt(interpolate(f, [p.at, p.at + 150], [p.views * 0.2, p.views], clamp))}</span>
              <span style={{ fontSize: 24, color: C.green }}>▲ {Math.floor(interpolate(f, [p.at, p.at + 150], [12, 340], clamp))}%</span>
            </div>
          </Card3D>
        ) : null,
      )}

      {f >= found && (
        <div
          style={{
            position: "absolute",
            left: 120,
            right: 120,
            top: 600,
            padding: "24px 30px",
            borderRadius: 24,
            background: "rgba(10,12,18,0.96)",
            border: `3px solid ${C.yellow}`,
            boxShadow: `0 0 ${60 + Math.sin(f / 5) * 20}px rgba(250,204,21,0.6)`,
            fontFamily: SANS,
            transform: `scale(${2 - fs}) rotate(${(1 - fs) * -8}deg)`,
            opacity: interpolate(fs, [0, 0.3], [0, 1], clamp),
            textAlign: "center",
          }}
        >
          <div style={{ fontFamily: MONO, fontSize: 22, color: C.yellow, letterSpacing: 4 }}>💰 НИША НАЙДЕНА</div>
          <div style={{ fontSize: 52, fontWeight: 900, color: C.white, marginTop: 6 }}>AI-шаблоны · $$$</div>
          <div style={{ marginTop: 12 }}>
            <Bar p={interpolate(f, [found, found + 30], [0, 0.94], clamp)} color={C.green} h={14} />
          </div>
          <div style={{ fontFamily: MONO, fontSize: 22, color: C.green, marginTop: 8 }}>
            POTENTIAL {Math.floor(interpolate(f, [found, found + 30], [0, 94], clamp))}%
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};

// -------------------------------------------------------------------------
// 05 — Agent 02 Builder (15 min)
// -------------------------------------------------------------------------
const BUILDS = [
  { k: "site", t: "САЙТ", at: 30.4, c: C.cyan, x: 40, rot: 18 },
  { k: "video", t: "ВИДЕО", at: 31.26, c: C.pink, x: 390, rot: 0 },
  { k: "script", t: "СКРИПТ", at: 32.1, c: C.yellow, x: 740, rot: -18 },
];

const BuildMock: React.FC<{ f: number; kind: string; p: number; c: string }> = ({ f, kind, p, c }) => {
  if (kind === "site") {
    return (
      <div style={{ borderRadius: 12, border: "1px solid rgba(255,255,255,0.1)", overflow: "hidden", height: 250 }}>
        <div style={{ height: 22, background: "rgba(255,255,255,0.08)", display: "flex", alignItems: "center", gap: 5, padding: "0 8px" }}>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{ width: 8, height: 8, borderRadius: 4, background: C.muted }} />
          ))}
          <div style={{ flex: 1, height: 10, marginLeft: 8, borderRadius: 5, background: "rgba(255,255,255,0.1)" }} />
        </div>
        <div style={{ padding: 12 }}>
          <div style={{ height: 14, width: `${clamp01(p * 3) * 70}%`, borderRadius: 6, background: C.white, opacity: 0.85 }} />
          <div style={{ height: 10, width: `${clamp01(p * 3 - 0.5) * 90}%`, borderRadius: 5, background: C.muted, marginTop: 8 }} />
          <div style={{ height: 30, width: `${clamp01(p * 2 - 0.6) * 50}%`, borderRadius: 8, background: c, marginTop: 12, boxShadow: `0 0 14px ${c}` }} />
          <div style={{ display: "flex", gap: 6, marginTop: 14 }}>
            {[0, 1, 2].map((i) => (
              <div key={i} style={{ flex: 1, height: 70, borderRadius: 8, background: "rgba(255,255,255,0.06)", opacity: clamp01(p * 3 - 1 - i * 0.3) }} />
            ))}
          </div>
        </div>
      </div>
    );
  }
  if (kind === "video") {
    return (
      <div style={{ height: 250, display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
        <div style={{ width: 130, height: 200, borderRadius: 14, background: `linear-gradient(160deg, ${c}55, #0f172a)`, position: "relative", border: `2px solid ${c}`, overflow: "hidden" }}>
          <div style={{ position: "absolute", left: 40, top: 70, width: 0, height: 0, borderTop: "28px solid transparent", borderBottom: "28px solid transparent", borderLeft: `46px solid ${C.white}`, opacity: 0.9 }} />
          <div style={{ position: "absolute", left: 10, right: 10, bottom: 14, height: 8, borderRadius: 4, background: C.yellow, opacity: 0.8 }} />
        </div>
        <div style={{ width: "100%", height: 30, borderRadius: 6, background: "rgba(255,255,255,0.06)", position: "relative", overflow: "hidden" }}>
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} style={{ position: "absolute", left: `${i * 8.3}%`, top: 4, width: "7%", height: 22, borderRadius: 3, background: i % 2 ? `${c}66` : "rgba(255,255,255,0.15)" }} />
          ))}
          <div style={{ position: "absolute", left: `${p * 100}%`, top: 0, width: 3, height: 30, background: C.red }} />
        </div>
      </div>
    );
  }
  const text = "HOOK: Если это произойдёт…\nСЦЕНА 1: парадокс\nСЦЕНА 2: ставка\nCTA: напиши слово";
  const n = Math.floor(clamp01(p * 1.4) * text.length);
  return (
    <div style={{ height: 250, fontFamily: MONO, fontSize: 18, lineHeight: 1.55, color: C.white, whiteSpace: "pre-wrap" }}>
      {text.slice(0, n)}
      <span style={{ color: c, opacity: mod(f / 15, 2) === 0 ? 1 : 0 }}>▋</span>
    </div>
  );
};

const SceneBuild: React.FC<{ f: number; fps: number }> = ({ f, fps }) => {
  const op = sceneOpacity(f, SC.build);
  if (op <= 0) return null;
  const a = SC.build[0];
  const tStart = sec(28.5);
  const tEnd = sec(33.2);
  const remain = f < tStart ? 900 : interpolate(f, [tStart, tEnd], [900, 0], clamp);
  const mm = String(Math.floor(remain / 60)).padStart(2, "0");
  const ss = String(Math.floor(remain % 60)).padStart(2, "0");
  const ring = 1 - remain / 900;
  const ts = sp(f, tStart, fps, { damping: 9, stiffness: 260, mass: 0.5 });
  const done = remain <= 0;
  const stampAt = sec(32.76);
  const stamp = sp(f, stampAt, fps, { damping: 8, stiffness: 300, mass: 0.5 });
  return (
    <AbsoluteFill style={{ opacity: op }}>
      <AgentHeader f={f} fps={fps} at={a} tag="AGENT 02" title="BUILDER" color={C.purple} status="BUILDING" />
      {/* timer */}
      <div
        style={{
          position: "absolute",
          top: 380,
          width: "100%",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 30,
          transform: `scale(${f >= tStart ? 1.25 - ts * 0.25 : 1})`,
        }}
      >
        <svg width={170} height={170}>
          <circle cx={85} cy={85} r={70} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={14} />
          <circle
            cx={85}
            cy={85}
            r={70}
            fill="none"
            stroke={done ? C.green : C.purple}
            strokeWidth={14}
            strokeLinecap="round"
            strokeDasharray={`${ring * 440} 440`}
            transform="rotate(-90 85 85)"
            style={{ filter: `drop-shadow(0 0 10px ${done ? C.green : C.purple})` }}
          />
          <text x={85} y={96} textAnchor="middle" fontFamily={MONO} fontSize={30} fontWeight={800} fill={C.white}>
            {Math.floor(ring * 100)}%
          </text>
        </svg>
        <div>
          <div style={{ fontFamily: MONO, fontSize: 150, fontWeight: 800, color: done ? C.green : C.white, letterSpacing: -4, lineHeight: 1, textShadow: `0 0 40px ${done ? C.green : C.purple}88` }}>
            {mm}:{ss}
          </div>
          <div style={{ fontFamily: MONO, fontSize: 24, color: C.muted, letterSpacing: 6 }}>{done ? "✓ DEPLOYED" : "15 МИНУТ · ПОД КЛЮЧ"}</div>
        </div>
      </div>
      {BUILDS.map((b, i) => {
        const at = sec(b.at);
        if (f < at - 4) return null;
        const p = interpolate(f, [at, at + 70], [0, 1], { ...clamp, easing: EXPO_OUT });
        const ok = p >= 0.99;
        return (
          <Card3D key={b.k} f={f} fps={fps} at={at} x={b.x} y={650} w={300} h={500} rotY={b.rot} rotX={6} accent={b.c} pad={18}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 34, fontWeight: 900, color: C.white }}>{b.t}</span>
              <span style={{ fontFamily: MONO, fontSize: 16, color: C.muted }}>#{String(i + 1).padStart(2, "0")}</span>
            </div>
            <div style={{ marginTop: 12 }}>
              <BuildMock f={f} kind={b.k} p={p} c={b.c} />
            </div>
            <div style={{ marginTop: 16 }}>
              <Bar p={p} color={ok ? C.green : b.c} h={14} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, fontFamily: MONO, fontSize: 18 }}>
              <span style={{ color: C.muted }}>{ok ? "build ok" : `${["compiling", "rendering", "writing"][i]}…`}</span>
              <span style={{ color: ok ? C.green : b.c }}>{Math.floor(p * 100)}%</span>
            </div>
            {ok && (
              <div style={{ position: "absolute", right: 14, top: 60, transform: `scale(${sp(f, at + 70, fps)}) rotate(8deg)` }}>
                <Badge f={f} label="✓ ГОТОВО" color={C.green} size={18} solid />
              </div>
            )}
          </Card3D>
        );
      })}
      <FloorShadow x={540} y={1170} w={960} f={f} />
      {f >= stampAt && (
        <div
          style={{
            position: "absolute",
            top: 1200,
            width: "100%",
            textAlign: "center",
            transform: `scale(${2.4 - stamp * 1.4}) rotate(-4deg)`,
            opacity: interpolate(stamp, [0, 0.3], [0, 1], clamp),
          }}
        >
          <Highlight f={f} at={stampAt} size={96}>
            ПОД КЛЮЧ
          </Highlight>
        </div>
      )}
    </AbsoluteFill>
  );
};

// -------------------------------------------------------------------------
// 06 — Agent 03 Autopilot + payments
// -------------------------------------------------------------------------
const QUEUE = [
  { p: "YouTube", c: C.red, ic: "▶" },
  { p: "TikTok", c: C.cyan, ic: "♪" },
  { p: "Instagram", c: C.pink, ic: "◎" },
  { p: "Telegram", c: C.blue, ic: "✈" },
];
const PAYMENTS = [
  { v: 350, at: 38.1, who: "Сайт-визитка" },
  { v: 600, at: 38.6, who: "Сайт под ключ" },
  { v: 1200, at: 39.15, who: "Пакет видео ×10" },
  { v: 350, at: 39.8, who: "Скрипт + монтаж" },
  { v: 550, at: 40.45, who: "Лендинг" },
];

const ScenePost: React.FC<{ f: number; fps: number }> = ({ f, fps }) => {
  const op = sceneOpacity(f, SC.post);
  if (op <= 0) return null;
  const a = SC.post[0];
  const payStart = sec(PAYMENTS[0].at);
  const dim = interpolate(f, [payStart - 6, payStart + 12], [1, 0.22], clamp);
  const balance = PAYMENTS.reduce((acc, p) => {
    const at = sec(p.at);
    return acc + p.v * interpolate(f, [at, at + 20], [0, 1], clamp);
  }, 0);
  const chatAt = sec(36.6);
  const replyAt = sec(37.3);
  const reply = "Готово ✓ Ссылка на оплату → $600";
  const replyN = Math.floor(interpolate(f, [replyAt, replyAt + 40], [0, reply.length], clamp));
  const sleepAt = sec(39.32);
  return (
    <AbsoluteFill style={{ opacity: op }}>
      <AgentHeader f={f} fps={fps} at={a} tag="AGENT 03" title="АВТОПИЛОТ 24/7" color={C.green} status="LIVE" />

      {/* publishing queue */}
      <Card3D f={f} fps={fps} at={a + 10} x={60} y={380} w={960} h={420} rotY={-5} rotX={8} accent={C.green} pad={22} dim={dim}>
        <div style={{ display: "flex", justifyContent: "space-between", fontFamily: MONO, fontSize: 20, color: C.muted, letterSpacing: 3, marginBottom: 10 }}>
          <span>PUBLISH QUEUE · AUTO</span>
          <span style={{ color: C.green }}>{fmt(Math.max(0, f - a) * 0.9)} posts/mo</span>
        </div>
        {QUEUE.map((q, i) => {
          const pubAt = sec(35.1) + i * 14;
          const pub = f >= pubAt;
          const spin = ["◐", "◓", "◑", "◒"][mod(f / 5, 4)];
          return (
            <div key={q.p} style={{ display: "flex", alignItems: "center", gap: 18, height: 84, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ width: 50, height: 50, borderRadius: 12, background: q.c, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, fontWeight: 900, color: "#0a0a0a" }}>
                {q.ic}
              </div>
              <div style={{ width: 200, fontSize: 30, fontWeight: 800, color: C.white }}>{q.p}</div>
              <div style={{ flex: 1 }}>
                <Spark f={f} seed={60 + i} w={300} h={50} color={q.c} trend={0.75} at={pubAt} dur={80} />
              </div>
              {pub ? (
                <Badge f={f} label="PUBLISHED ✓" color={C.green} size={18} solid />
              ) : (
                <span style={{ fontFamily: MONO, fontSize: 22, color: C.muted }}>
                  {spin} QUEUED
                </span>
              )}
            </div>
          );
        })}
      </Card3D>

      {/* client chat */}
      {f >= chatAt - 4 && (
        <Card3D f={f} fps={fps} at={chatAt} x={60} y={840} w={960} h={270} rotY={5} rotX={8} accent={C.blue} pad={22} dim={dim}>
          <div style={{ fontFamily: MONO, fontSize: 18, color: C.muted, letterSpacing: 3 }}>DM · КЛИЕНТ #318 · {mod(f / 30, 2) === 0 ? "печатает…" : "online"}</div>
          <div style={{ marginTop: 14, display: "flex" }}>
            <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: "20px 20px 20px 4px", padding: "12px 20px", fontSize: 28, color: C.white }}>
              Сколько стоит сайт под ключ? 🙏
            </div>
          </div>
          {f >= replyAt && (
            <div style={{ marginTop: 12, display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 12 }}>
              <div style={{ background: C.green, borderRadius: "20px 20px 4px 20px", padding: "12px 20px", fontSize: 28, fontWeight: 700, color: "#0a0a0a" }}>
                {reply.slice(0, replyN)}
              </div>
              <AgentBot f={f} size={40} color={C.green} seed={5} />
            </div>
          )}
        </Card3D>
      )}

      {/* payment notifications */}
      {PAYMENTS.map((p, i) => {
        const at = sec(p.at);
        if (f < at) return null;
        const s = sp(f, at, fps, { damping: 12, stiffness: 220, mass: 0.5 });
        const after = PAYMENTS.filter((q) => f >= sec(q.at)).length - 1 - i;
        const y = 370 + after * 118;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: 70,
              right: 70,
              top: y + (1 - s) * -200,
              height: 104,
              borderRadius: 26,
              background: "rgba(22,25,35,0.97)",
              border: `2px solid ${after === 0 ? C.green : "rgba(255,255,255,0.1)"}`,
              boxShadow: after === 0 ? `0 20px 60px rgba(0,0,0,0.6), 0 0 40px ${C.green}66` : "0 20px 40px rgba(0,0,0,0.5)",
              display: "flex",
              alignItems: "center",
              gap: 20,
              padding: "0 24px",
              fontFamily: SANS,
              opacity: interpolate(s, [0, 0.3], [0, 1], clamp) * (after > 3 ? 0.4 : 1),
              transform: `scale(${1 - Math.min(after, 4) * 0.025})`,
            }}
          >
            <div style={{ width: 62, height: 62, borderRadius: 16, background: C.green, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 34, fontWeight: 900, color: "#0a0a0a" }}>
              $
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontFamily: MONO, fontSize: 18, color: C.muted }}>
                <span>PAYMENT · сейчас</span>
                <span>agent_03</span>
              </div>
              <div style={{ fontSize: 30, fontWeight: 700, color: C.white }}>Оплата получена · {p.who}</div>
            </div>
            <div style={{ fontFamily: MONO, fontSize: 46, fontWeight: 900, color: C.green, textShadow: `0 0 20px ${C.green}` }}>+${fmt(p.v)}</div>
          </div>
        );
      })}

      {/* balance + status */}
      {f >= payStart && (
        <div
          style={{
            position: "absolute",
            left: 70,
            right: 70,
            top: 1010,
            padding: "22px 28px",
            borderRadius: 24,
            background: C.panel,
            border: `2px solid ${C.green}`,
            boxShadow: `0 0 40px ${C.green}44`,
            opacity: sp(f, payStart, fps),
            display: "flex",
            alignItems: "center",
            gap: 24,
          }}
        >
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: MONO, fontSize: 20, color: C.muted, letterSpacing: 4 }}>БАЛАНС · СЕГОДНЯ</div>
            <div style={{ fontFamily: SANS, fontSize: 96, fontWeight: 900, color: C.white, letterSpacing: -3, lineHeight: 1 }}>${fmt(balance)}</div>
          </div>
          <Spark f={f} seed={77} w={300} h={110} color={C.green} trend={0.85} at={payStart} dur={150} />
        </div>
      )}
      {f >= sleepAt && (
        <div style={{ position: "absolute", top: 1230, width: "100%", display: "flex", justifyContent: "center", gap: 20, transform: `scale(${sp(f, sleepAt, fps)})` }}>
          <Badge f={f} label="ТЫ: 💤 OFFLINE" color={C.muted} size={26} />
          <Badge f={f} label="АГЕНТЫ: ONLINE" color={C.green} size={26} solid />
        </div>
      )}
    </AbsoluteFill>
  );
};

// -------------------------------------------------------------------------
// 07 — 0 офисов / 0 зарплат / 0 правок / 24/7
// -------------------------------------------------------------------------
const ZEROS = [
  { at: 41.88, from: 3, label: "ОФИСОВ", before: "3 офиса · аренда", icon: "🏢" },
  { at: 42.92, from: 40000, label: "ЗАРПЛАТ", before: "$40,000 / мес", icon: "💸" },
  { at: 44.22, from: 37, label: "ПРАВОК", before: "37 кругов правок", icon: "✏️" },
];
const DAYS = ["ПН", "ВТ", "СР", "ЧТ", "ПТ", "СБ", "ВС"];

const SceneZero: React.FC<{ f: number; fps: number }> = ({ f, fps }) => {
  const op = sceneOpacity(f, SC.zero);
  if (op <= 0) return null;
  const h24 = sec(46.54);
  const s24 = sp(f, h24, fps, { damping: 9, stiffness: 280, mass: 0.6 });
  const s7 = sp(f, sec(47.9), fps, { damping: 8, stiffness: 300, mass: 0.5 });
  const handA = (f - h24) * 6;
  return (
    <AbsoluteFill style={{ opacity: op }}>
      {ZEROS.map((z, i) => {
        const at = sec(z.at);
        if (f < at - 4) return null;
        const s = sp(f, at, fps, { damping: 11, stiffness: 220, mass: 0.5 });
        const v = interpolate(f, [at, at + 28], [z.from, 0], { ...clamp, easing: EXPO_OUT });
        const zero = v < 0.5;
        return (
          <div
            key={z.label}
            style={{
              position: "absolute",
              left: 60,
              right: 60,
              top: 150 + i * 205,
              height: 180,
              borderRadius: 24,
              background: C.panel,
              border: `2px solid ${zero ? C.yellow : "rgba(255,255,255,0.1)"}`,
              boxShadow: zero ? "0 0 40px rgba(250,204,21,0.35)" : "none",
              display: "flex",
              alignItems: "center",
              padding: "0 30px",
              gap: 26,
              fontFamily: SANS,
              transform: `perspective(1200px) rotateY(${(1 - s) * (i % 2 ? -70 : 70)}deg) translateX(${(1 - s) * (i % 2 ? 300 : -300)}px)`,
              opacity: interpolate(s, [0, 0.3], [0, 1], clamp),
            }}
          >
            <div style={{ fontSize: 66 }}>{z.icon}</div>
            <div
              style={{
                width: 290,
                fontWeight: 900,
                letterSpacing: -6,
                color: zero ? C.yellow : C.white,
                textShadow: zero ? "0 0 50px rgba(250,204,21,0.7)" : "none",
                lineHeight: 1,
                textAlign: "center",
                whiteSpace: "nowrap",
                fontSize: zero ? 140 : 90,
              }}
            >
              {z.from > 100 && !zero ? `$${fmt(v)}` : fmt(v)}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 64, fontWeight: 900, color: C.white, letterSpacing: -2 }}>{z.label}</div>
              <div style={{ position: "relative", display: "inline-block", fontFamily: MONO, fontSize: 22, color: C.muted }}>
                {z.before}
                <Strike f={f} at={at + 20} width={110} rot={-3} />
              </div>
            </div>
          </div>
        );
      })}
      {/* 24/7 */}
      {f >= h24 && (
        <div style={{ position: "absolute", top: 800, width: "100%", display: "flex", justifyContent: "center", alignItems: "center", gap: 30 }}>
          <svg width={230} height={230} style={{ transform: `scale(${s24})` }}>
            <circle cx={115} cy={115} r={100} fill="#0b0d14" stroke={C.yellow} strokeWidth={6} style={{ filter: `drop-shadow(0 0 16px ${C.yellow})` }} />
            {Array.from({ length: 24 }).map((_, i) => {
              const ang = (i / 24) * Math.PI * 2;
              const r1 = i % 6 === 0 ? 76 : 86;
              return <line key={i} x1={115 + Math.cos(ang) * r1} y1={115 + Math.sin(ang) * r1} x2={115 + Math.cos(ang) * 94} y2={115 + Math.sin(ang) * 94} stroke={C.yellow} strokeWidth={i % 6 === 0 ? 5 : 2} opacity={0.8} />;
            })}
            <line x1={115} y1={115} x2={115 + Math.cos(((handA / 12 - 90) * Math.PI) / 180) * 50} y2={115 + Math.sin(((handA / 12 - 90) * Math.PI) / 180) * 50} stroke={C.white} strokeWidth={8} strokeLinecap="round" />
            <line x1={115} y1={115} x2={115 + Math.cos(((handA - 90) * Math.PI) / 180) * 78} y2={115 + Math.sin(((handA - 90) * Math.PI) / 180) * 78} stroke={C.yellow} strokeWidth={5} strokeLinecap="round" />
            <circle cx={115} cy={115} r={9} fill={C.yellow} />
          </svg>
          <div style={{ fontFamily: SANS, fontWeight: 900, fontSize: 250, letterSpacing: -12, lineHeight: 1, color: C.white, textShadow: "0 0 60px rgba(250,204,21,0.45)", transform: `scale(${2 - s24})`, opacity: s24 }}>
            24
            <span style={{ color: C.yellow, display: "inline-block", transform: `scale(${f >= sec(47.9) ? s7 : 0})` }}>/7</span>
          </div>
        </div>
      )}
      {f >= sec(48.2) && (
        <div style={{ position: "absolute", top: 1090, left: 60, right: 60 }}>
          <div style={{ display: "flex", gap: 10 }}>
            {DAYS.map((d, i) => {
              const on = f >= sec(48.34) + i * 4;
              const weekend = i >= 5;
              return (
                <div
                  key={d}
                  style={{
                    flex: 1,
                    height: 96,
                    borderRadius: 16,
                    background: on ? (weekend ? C.yellow : `${C.green}33`) : "rgba(255,255,255,0.05)",
                    border: `2px solid ${on ? (weekend ? C.yellow : C.green) : "rgba(255,255,255,0.1)"}`,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: MONO,
                    fontWeight: 800,
                    color: on && weekend ? "#0a0a0a" : C.white,
                    boxShadow: on ? `0 0 20px ${weekend ? C.yellow : C.green}66` : "none",
                  }}
                >
                  <span style={{ fontSize: 26 }}>{d}</span>
                  <span style={{ fontSize: 16, opacity: 0.8 }}>{on ? "ON" : "—"}</span>
                </div>
              );
            })}
          </div>
          {f >= sec(48.76) && (
            <div style={{ marginTop: 22, textAlign: "center" }}>
              <Slam f={f} at={sec(48.76)} fps={fps} style={{ display: "inline-block" }}>
                <Badge f={f} label="БЕЗ ВЫХОДНЫХ · UPTIME 99.99%" color={C.yellow} size={28} solid />
              </Slam>
            </div>
          )}
        </div>
      )}
    </AbsoluteFill>
  );
};

// -------------------------------------------------------------------------
// 08 — Digital army
// -------------------------------------------------------------------------
const SceneArmy: React.FC<{ f: number; fps: number }> = ({ f, fps }) => {
  const op = sceneOpacity(f, SC.army);
  if (op <= 0) return null;
  const a = SC.army[0];
  const p2 = sec(52.66);
  const phase1 = f < p2 + 10;
  const p1op = interpolate(f, [p2 - 4, p2 + 10], [1, 0], clamp);
  const fall = interpolate(f, [sec(52.0), p2 + 10], [0, 1], clamp);
  const assemble = interpolate(f, [sec(53.96), sec(55.0)], [0, 1], { ...clamp, easing: EXPO_OUT });
  const COLS = 6;
  const ROWS = 5;
  return (
    <AbsoluteFill style={{ opacity: op }}>
      {phase1 && (
        <AbsoluteFill style={{ opacity: p1op }}>
          <Title top={160}>
            <Slam f={f} at={sec(49.94)} fps={fps} style={{ fontSize: 96 }}>
              ВЫИГРЫВАЕТ НЕ ТОТ,
            </Slam>
            {f >= sec(51.24) && (
              <div style={{ position: "relative", display: "inline-block", marginTop: 16 }}>
                <Slam f={f} at={sec(51.24)} fps={fps} style={{ fontSize: 76, color: C.muted }}>
                  У КОГО БОЛЬШЕ ЛЮДЕЙ
                </Slam>
                <Strike f={f} at={sec(51.9)} />
              </div>
            )}
          </Title>
          <div style={{ position: "absolute", left: 80, right: 80, top: 560, display: "grid", gridTemplateColumns: "repeat(8, 1fr)", rowGap: 18, justifyItems: "center" }}>
            {Array.from({ length: 40 }).map((_, i) => {
              const s = sp(f, a + 10 + i * 1.2, fps, { damping: 12, stiffness: 240, mass: 0.4 });
              const dy = fall * (300 + rand(i) * 500);
              const rot = fall * (rand(i + 5) - 0.5) * 120;
              return (
                <div key={i} style={{ transform: `scale(${s}) translateY(${dy}px) rotate(${rot}deg)`, opacity: 1 - fall * 0.7 }}>
                  <Person size={78} color={fall > 0.05 ? "#7f1d1d" : "#475569"} />
                </div>
              );
            })}
          </div>
          <div style={{ position: "absolute", top: 1260, width: "100%", textAlign: "center" }}>
            <Badge f={f} label={`HEADCOUNT ${40} · BURN −$${fmt(40000 + mod(f * 97, 9000))}`} color={C.red} size={22} />
          </div>
        </AbsoluteFill>
      )}
      {f >= p2 && (
        <AbsoluteFill>
          <Title top={150}>
            <Slam f={f} at={p2} fps={fps} style={{ fontSize: 84 }}>
              А ТОТ, КТО ПЕРВЫМ
            </Slam>
            {f >= sec(53.96) && (
              <Slam f={f} at={sec(53.96)} fps={fps} style={{ fontSize: 84, color: C.yellow, marginTop: 6 }}>
                СОБРАЛ
              </Slam>
            )}
            {f >= sec(54.5) && (
              <div style={{ marginTop: 18, transform: "rotate(-2deg)" }}>
                <Highlight f={f} at={sec(54.5)} size={104}>
                  ЦИФРОВУЮ АРМИЮ
                </Highlight>
              </div>
            )}
          </Title>
          <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, perspective: 1200 }}>
            <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, transform: "rotateX(18deg)", transformOrigin: "540px 900px" }}>
              {Array.from({ length: COLS * ROWS }).map((_, i) => {
                const col = mod(i, COLS);
                const row = Math.floor(i / COLS);
                const tx = 150 + col * 150 - 32;
                const ty = 640 + row * 115;
                const sx = rand(i + 100) * 1080;
                const sy = 500 + rand(i + 200) * 900;
                const delayed = clamp01(assemble * 1.4 - rand(i + 300) * 0.4);
                const x = sx + (tx - sx) * delayed;
                const y = sy + (ty - sy) * delayed;
                const appear = sp(f, p2 + i * 1.5, fps, { damping: 12, stiffness: 240, mass: 0.4 });
                const col3 = AGENT_COLORS[mod(i, 3)];
                return (
                  <div key={i} style={{ position: "absolute", left: x, top: y + Math.sin((f + i * 7) / 10) * 4 * delayed, transform: `scale(${appear * (0.75 + row * 0.07)})` }}>
                    <AgentBot f={f} size={64} color={col3} seed={i} />
                  </div>
                );
              })}
            </div>
          </div>
          <div style={{ position: "absolute", left: 540 - 55, top: 1230 }}>
            <Person size={110} color="#111827" rim={C.yellow} />
          </div>
          <FloorShadow x={540} y={1360} w={300} f={f} />
          <div style={{ position: "absolute", top: 1395, width: "100%", textAlign: "center", opacity: assemble }}>
            <Badge f={f} label={`UNITS ${Math.floor(assemble * 30)}/30 · READY`} color={C.green} size={22} />
          </div>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};

// -------------------------------------------------------------------------
// 09 — CTA: НАПИШИ «АРМИЯ»
// -------------------------------------------------------------------------
const SceneCta: React.FC<{ f: number; fps: number }> = ({ f, fps }) => {
  const op = sceneOpacity(f, SC.cta, 8, 0);
  if (op <= 0) return null;
  const a = SC.cta[0];
  const lf = f - a;
  const wordAt = sec(56.78);
  const word = sp(f, wordAt, fps, { damping: 8, stiffness: 260, mass: 0.6 });
  const beat = 1 + 0.04 * Math.max(0, Math.sin(lf / 6));
  const comment = "армия";
  const typed = Math.floor(interpolate(f, [sec(57.4), sec(58.0)], [0, comment.length], clamp));
  const box = sp(f, sec(57.3), fps);
  const giftAt = sec(58.76);
  const gift = sp(f, giftAt, fps, { damping: 10, stiffness: 220, mass: 0.6 });
  return (
    <AbsoluteFill style={{ opacity: op }}>
      <Title top={170}>
        <Slam f={f} at={sec(55.68)} fps={fps} style={{ fontSize: 130 }}>
          НАПИШИ
        </Slam>
      </Title>
      {f >= wordAt && (
        <div style={{ position: "absolute", top: 360, width: "100%", textAlign: "center", transform: `scale(${(2.4 - word * 1.4) * beat}) rotate(-3deg)` }}>
          <span
            style={{
              display: "inline-block",
              padding: "10px 56px",
              borderRadius: 26,
              background: C.yellow,
              color: "#0a0a0a",
              fontFamily: SANS,
              fontWeight: 900,
              fontSize: 190,
              letterSpacing: -6,
              boxShadow: `0 0 ${60 + Math.sin(lf / 6) * 30}px rgba(250,204,21,0.8)`,
            }}
          >
            АРМИЯ
          </span>
        </div>
      )}
      <div style={{ position: "absolute", top: 640, width: "100%", textAlign: "center", fontFamily: MONO, fontSize: 30, letterSpacing: 8, color: C.muted, opacity: sp(f, sec(57.36), fps) }}>
        ↓ В КОММЕНТАРИЯХ ↓
      </div>
      <div
        style={{
          position: "absolute",
          left: 80,
          right: 80,
          top: 720,
          padding: "26px 30px",
          borderRadius: 26,
          background: C.panel,
          border: `2px solid ${C.border}`,
          fontFamily: SANS,
          display: "flex",
          alignItems: "center",
          gap: 24,
          transform: `perspective(1200px) rotateX(${(1 - box) * 60}deg) translateY(${(1 - box) * 200}px)`,
          opacity: box,
        }}
      >
        <div style={{ width: 80, height: 80, borderRadius: 40, background: `linear-gradient(135deg, ${C.yellow}, ${C.cyan})` }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 26, color: C.muted, fontWeight: 600 }}>Добавьте комментарий…</div>
          <div style={{ fontSize: 50, color: C.white, fontWeight: 800 }}>
            {comment.slice(0, typed)}
            <span style={{ color: C.yellow, opacity: mod(f / 15, 2) === 0 ? 1 : 0 }}>|</span>
          </div>
        </div>
        <div
          style={{
            padding: "14px 24px",
            borderRadius: 16,
            background: typed >= comment.length ? C.yellow : "rgba(255,255,255,0.08)",
            color: typed >= comment.length ? "#0a0a0a" : C.muted,
            fontWeight: 900,
            fontSize: 30,
          }}
        >
          ➤
        </div>
      </div>
      {/* floating comment chips */}
      {Array.from({ length: 10 }).map((_, i) => {
        const at = sec(58.1) + i * 9;
        if (f < at) return null;
        const t = f - at;
        const left = i % 2 === 0 ? 40 + rand(i) * 140 : 760 + rand(i) * 120;
        const y = 1300 - t * 3.2;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left,
              top: y,
              padding: "8px 16px",
              borderRadius: 999,
              background: "rgba(250,204,21,0.15)",
              border: `2px solid ${C.yellow}`,
              fontFamily: SANS,
              fontWeight: 800,
              fontSize: 24,
              color: C.white,
              opacity: interpolate(t, [0, 10, 120, 160], [0, 1, 1, 0], clamp),
            }}
          >
            {["армия 🔥", "АРМИЯ", "армия!", "армия 🤖", "Армия"][mod(i, 5)]}
          </div>
        );
      })}
      {f >= giftAt && (
        <div style={{ position: "absolute", top: 960, width: "100%", textAlign: "center", transform: `scale(${gift}) translateY(${(1 - gift) * 80}px)` }}>
          <span
            style={{
              display: "inline-block",
              padding: "20px 36px",
              borderRadius: 22,
              border: `3px solid ${C.green}`,
              background: "rgba(34,197,94,0.12)",
              color: C.white,
              fontFamily: SANS,
              fontWeight: 900,
              fontSize: 46,
              boxShadow: "0 0 40px rgba(34,197,94,0.5)",
            }}
          >
            🎁 ПОКАЖУ, КАК СОБРАТЬ ТАКУЮ ЖЕ
          </span>
          <div style={{ marginTop: 18, display: "flex", justifyContent: "center", gap: 16 }}>
            {AGENT_COLORS.map((c, i) => (
              <div key={c} style={{ transform: `scale(${sp(f, giftAt + 10 + i * 6, fps)})` }}>
                <AgentBot f={f} size={56} color={c} seed={i} />
              </div>
            ))}
          </div>
        </div>
      )}
      <div
        style={{
          position: "absolute",
          top: 1220 + Math.sin(lf / 8) * 16,
          width: "100%",
          textAlign: "center",
          fontSize: 90,
          color: C.yellow,
          opacity: f >= sec(57.4) ? 1 : 0,
          textShadow: "0 0 30px rgba(250,204,21,0.8)",
        }}
      >
        ↓
      </div>
    </AbsoluteFill>
  );
};

// -------------------------------------------------------------------------
// Kinetic subtitles (karaoke + yellow keywords)
// -------------------------------------------------------------------------
const Subtitles: React.FC<{ f: number; fps: number }> = ({ f, fps }) => {
  const t = f / fps;
  const idx = CHUNKS.findIndex((c, i) => {
    const next = CHUNKS[i + 1];
    const until = next ? Math.min(next.start, c.end + 0.3) : c.end + 0.5;
    return t >= c.start && t < until;
  });
  if (idx < 0) return null;
  const chunk = CHUNKS[idx];
  const pop = sp(f, sec(chunk.start), fps, { damping: 11, stiffness: 240, mass: 0.5 });
  return (
    <div
      style={{
        position: "absolute",
        bottom: 260,
        left: 50,
        right: 50,
        textAlign: "center",
        transform: `scale(${0.7 + pop * 0.3}) translateY(${(1 - pop) * 30}px) rotate(${idx % 2 ? 1.5 : -1.5}deg)`,
        opacity: interpolate(pop, [0, 0.4], [0, 1], clamp),
      }}
    >
      {chunk.words.map((w, i) => {
        const on = t >= w.start;
        const active = t >= w.start && t < w.end + 0.05;
        const key = KEY_RE.test(w.word.replace(/[.,!?«»]/g, ""));
        const wp = sp(f, sec(w.start), fps, { damping: 10, stiffness: 300, mass: 0.4 });
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              margin: "6px 14px",
              padding: key && on ? "0 14px" : 0,
              borderRadius: 12,
              background: key && on ? C.yellow : "transparent",
              fontFamily: SANS,
              fontSize: 80,
              fontWeight: 900,
              textTransform: "uppercase",
              letterSpacing: -1,
              color: key && on ? "#0a0a0a" : on ? C.white : "rgba(248,250,252,0.4)",
              transform: `scale(${active ? 1 + 0.1 * wp : 1})`,
              boxShadow: key && on ? "0 0 40px rgba(250,204,21,0.6)" : "none",
              textShadow: key && on ? "none" : "0 6px 18px rgba(0,0,0,0.9)",
              WebkitTextStroke: key && on ? undefined : "2px rgba(0,0,0,0.6)",
              paintOrder: "stroke fill",
            }}
          >
            {w.word}
          </span>
        );
      })}
    </div>
  );
};

const CutFlash: React.FC<{ f: number }> = ({ f }) => {
  let o = 0;
  CUTS.forEach((c) => {
    if (f >= c - 2 && f < c + 10) o = Math.max(o, interpolate(f, [c - 2, c, c + 10], [0, 0.35, 0], clamp));
  });
  if (o <= 0) return null;
  return <AbsoluteFill style={{ background: C.yellow, opacity: o, mixBlendMode: "screen" }} />;
};

// -------------------------------------------------------------------------
// Root composition
// -------------------------------------------------------------------------
export const SoloEmpireReel: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const cam = useCamera(f, fps);

  return (
    <AbsoluteFill style={{ backgroundColor: C.bg, overflow: "hidden" }}>
      <Audio src={staticFile("solo_empire_reel/voice.mp3")} />
      <Background f={f} />
      <AbsoluteFill style={{ perspective: 2200 }}>
        <AbsoluteFill
          style={{
            transform: `translate(${cam.dx}px, ${cam.dy}px) scale(${cam.zoom}) rotateX(${cam.tiltX}deg) rotateY(${cam.tiltY}deg)`,
            transformStyle: "preserve-3d",
          }}
        >
          <SceneHook f={f} fps={fps} />
          <ScenePayroll f={f} fps={fps} />
          <SceneTerm f={f} fps={fps} />
          <SceneRadar f={f} fps={fps} />
          <SceneBuild f={f} fps={fps} />
          <ScenePost f={f} fps={fps} />
          <SceneZero f={f} fps={fps} />
          <SceneArmy f={f} fps={fps} />
          <SceneCta f={f} fps={fps} />
        </AbsoluteFill>
      </AbsoluteFill>
      <HUD f={f} />
      <CutFlash f={f} />
      <Subtitles f={f} fps={fps} />
    </AbsoluteFill>
  );
};
