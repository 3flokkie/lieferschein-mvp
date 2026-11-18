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
import wordsData from "../public/gta6_bot_reel/words.json";

/*
 * =========================================================================
 * GTA 6 CLIP BOT REEL — 1080x1920 @ 60 FPS, 3240 FRAMES (54s)
 *
 *   01  0.0 –  5.3s : "ЖДАТЬ КОНЦА СТРИМА — ПОЗДНО" + crossed-out "6 ЧАСОВ VOD"
 *   02  5.3 – 12.4s : "19.11" launch slam, neon/amber sunset, "СЕКУНДА В СЕКУНДУ"
 *   03 12.4 – 23.3s : Live stream + scrolling chat → 3x HYPE SPIKE chart
 *   04 23.3 – 35.9s : "-40s" ring buffer → 16:9→9:16 crop → karaoke → auto-upload
 *   05 35.9 – 43.9s : "SONY & MICROSOFT: #1 MOST WANTED" trophy / ranking card
 *   06 43.9 – 54.0s : CTA — aingeneer.com + НАПИШИ «БОТ»
 *
 * Camera: punch beats every 1.25s + alternating tilt + constant drift.
 * All cyclic array indices go through mod() — safe for negative offsets.
 * =========================================================================
 */

const FPS = 60;
const TOTAL = 3240;

const C = {
  bg: "#07040d",
  pink: "#ff2e88",
  amber: "#ffb020",
  cyan: "#22d3ee",
  purple: "#a855f7",
  green: "#22c55e",
  red: "#ef4444",
  white: "#f8fafc",
  muted: "#7c7a96",
  panel: "rgba(16,10,24,0.94)",
  border: "rgba(255,46,136,0.38)",
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
const smooth = (a: number, b: number, x: number) => {
  const u = clamp01((x - a) / (b - a));
  return u * u * (3 - 2 * u);
};

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
  hook: win(0, 5.3),
  launch: win(5.3, 12.4),
  chat: win(12.4, 23.3),
  clip: win(23.3, 35.9),
  award: win(35.9, 43.9),
  cta: win(43.9, 54.0),
};
const CUTS = Object.values(SC).map((s) => s[0]).filter((x) => x > 0);

// -------------------------------------------------------------------------
// Words → subtitle chunks (with ASR fixes)
// -------------------------------------------------------------------------
type Word = { word: string; start: number; end: number };

const FIXES: [RegExp, string][] = [
  [/^ПГТА$/, "GTA"],
  [/^ГТА$/, "GTA"],
  [/^-6,?$/, "6"],
  [/^-секунда$/, "секунда"],
  [/^короохи$/, "караоке"],
  [/^шорт$/, "шортс"],
  [/^aiengineer$/, "aingeneer.com"],
];

const WORDS: Word[] = (wordsData as Word[])
  .filter(
    (w) =>
      w.word !== "–" &&
      w.word !== ".com" &&
      !(w.word === "и" && Math.abs(w.start - 14.18) < 0.01) &&
      !(w.word === "с" && Math.abs(w.start - 33.56) < 0.01),
  )
  .map((w) => ({
    ...w,
    word: FIXES.reduce((acc, [re, to]) => acc.replace(re, to), w.word),
    end: w.word === "aiengineer" ? 50.1 : w.end,
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
  /^GTA$|^6$|стрим|нарезк|поздно|^19$|ноября|миллион|первые|секунд|бот|живом|спишь|три|раза|^40$|вертикальн|караоке|субтитры|публикует|шортс|быстрее|желанная|Sony|Microsoft|трафик|канал|aingeneer|Напиши|пиши|комментар/i;

// -------------------------------------------------------------------------
// Camera — punch every 1.25s
// -------------------------------------------------------------------------
const BEATS = Array.from({ length: 44 }, (_, i) => Math.round(i * 1.25 * FPS) + 10);

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
// Background — neon dusk gradient, scanlines, perspective floor, bokeh
// -------------------------------------------------------------------------
const Background: React.FC<{ f: number }> = ({ f }) => {
  const t = f / FPS;
  const gx = 540 + Math.sin(t * 0.4) * 140;
  const gy = 820 + Math.cos(t * 0.3) * 100;
  const vice = f >= SC.launch[0] - 8 && f < SC.launch[1] ? 1 : 0.35;
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at ${gx}px ${gy}px, rgba(255,46,136,${0.16 * vice + 0.04}) 0%, rgba(255,176,32,0.05) 32%, transparent 60%)`,
        }}
      />
      <AbsoluteFill
        style={{
          opacity: 0.7,
          background: "radial-gradient(circle at 85% 10%, rgba(34,211,238,0.14) 0%, transparent 42%)",
        }}
      />
      <AbsoluteFill
        style={{
          opacity: 0.35,
          backgroundImage: "radial-gradient(rgba(200,160,220,0.22) 1.5px, transparent 1.5px)",
          backgroundSize: "36px 36px",
          backgroundPosition: `${mod(f * 0.3, 36)}px 0px`,
          maskImage: "linear-gradient(to bottom, rgba(0,0,0,0.9), transparent 60%)",
          WebkitMaskImage: "linear-gradient(to bottom, rgba(0,0,0,0.9), transparent 60%)",
        }}
      />
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
            "linear-gradient(rgba(255,46,136,0.13) 2px, transparent 2px), linear-gradient(90deg, rgba(255,46,136,0.13) 2px, transparent 2px)",
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
        const col = i % 3 === 0 ? C.cyan : i % 3 === 1 ? C.pink : C.amber;
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
      {/* CRT scanlines */}
      <AbsoluteFill
        style={{
          opacity: 0.08,
          backgroundImage: "repeating-linear-gradient(0deg, #fff 0px, #fff 1px, transparent 1px, transparent 4px)",
          backgroundPosition: `0px ${mod(f, 4)}px`,
        }}
      />
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,0.82) 100%)" }} />
    </AbsoluteFill>
  );
};

// -------------------------------------------------------------------------
// HUD — persistent micro-telemetry
// -------------------------------------------------------------------------
const HUD: React.FC<{ f: number }> = ({ f }) => {
  const t = f / FPS;
  const tc = `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(Math.floor(t % 60)).padStart(2, "0")}:${String(mod(f, 60)).padStart(2, "0")}`;
  const k = Math.floor(f / 8);
  const live = f >= SC.chat[0];
  const clips = f >= sec(33.7) ? 1 + Math.floor((f - sec(33.7)) / 40) : 0;
  const style: React.CSSProperties = {
    position: "absolute",
    fontFamily: MONO,
    fontSize: 20,
    letterSpacing: 2,
    color: "rgba(180,170,200,0.75)",
  };
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={{ position: "absolute", top: 0, left: 0, height: 5, width: `${(f / TOTAL) * 100}%`, background: `linear-gradient(90deg, ${C.pink}, ${C.amber})`, boxShadow: `0 0 14px ${C.pink}` }} />
      <div style={{ ...style, top: 52, left: 46, display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ width: 14, height: 14, borderRadius: 7, background: C.red, opacity: mod(f / 20, 2) === 0 ? 1 : 0.25 }} />
        REC {tc}
      </div>
      <div style={{ ...style, top: 52, right: 46, color: live ? C.green : style.color }}>
        CLIPBOT {live ? "● WATCHING" : "○ STANDBY"}
      </div>
      <div style={{ ...style, bottom: 60, left: 46 }}>
        BUFFER 40s · FPS 60 · {(0.6 + rand(k) * 0.5).toFixed(2)}s
      </div>
      <div style={{ ...style, bottom: 60, right: 46 }}>
        CLIPS {String(clips).padStart(3, "0")} · AUTO
      </div>
      {[
        { top: 30, left: 24, b: "borderTop borderLeft" },
        { top: 30, right: 24, b: "borderTop borderRight" },
        { bottom: 36, left: 24, b: "borderBottom borderLeft" },
        { bottom: 36, right: 24, b: "borderBottom borderRight" },
      ].map((p, i) => {
        const s: React.CSSProperties = { position: "absolute", width: 40, height: 40 };
        const line = "3px solid rgba(255,46,136,0.5)";
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
  color = C.amber,
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
    const base = 0.12 + trend * u * 0.72;
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
}> = ({ f, fps, at, x, y, w, h, rotY, rotX = 8, children, accent = C.pink, pad = 26 }) => {
  const s = sp(f, at, fps, { damping: 13, stiffness: 150, mass: 0.7 });
  const bob = Math.sin((f + at) / 22) * 8;
  return (
    <div style={{ position: "absolute", left: x, top: y + bob, width: w, height: h, perspective: 1400, opacity: interpolate(s, [0, 0.3], [0, 1], clamp) }}>
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

/** Soft floor shadow under floating cards (depth cue). */
const FloorShadow: React.FC<{ x: number; y: number; w: number; f: number }> = ({ x, y, w, f }) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      width: w,
      height: 50,
      borderRadius: "50%",
      background: "radial-gradient(ellipse, rgba(0,0,0,0.75) 0%, transparent 70%)",
      filter: "blur(10px)",
      transform: `scaleX(${1 + Math.sin(f / 22) * 0.04})`,
    }}
  />
);

/** Little clip-bot robot head. */
const BotIcon: React.FC<{ f: number; size: number; color?: string }> = ({ f, size, color = C.pink }) => {
  const blink = mod(f, 150) < 6 ? 0.15 : 1;
  return (
    <div style={{ position: "relative", width: size, height: size * 1.05 }}>
      <div style={{ position: "absolute", left: size * 0.47, top: 0, width: size * 0.06, height: size * 0.18, background: color }} />
      <div
        style={{
          position: "absolute",
          left: size * 0.41,
          top: -size * 0.06,
          width: size * 0.18,
          height: size * 0.18,
          borderRadius: "50%",
          background: color,
          boxShadow: `0 0 ${12 + Math.abs(Math.sin(f / 8)) * 14}px ${color}`,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: size * 0.17,
          width: size,
          height: size * 0.82,
          borderRadius: size * 0.24,
          background: "linear-gradient(160deg, #241a33, #0d0915)",
          border: `3px solid ${color}`,
          boxShadow: `0 0 24px ${color}88, inset 0 0 18px ${color}33`,
        }}
      >
        {[0.26, 0.6].map((x) => (
          <div
            key={x}
            style={{
              position: "absolute",
              left: size * x,
              top: size * 0.26,
              width: size * 0.16,
              height: size * 0.2 * blink,
              borderRadius: size * 0.08,
              background: C.cyan,
              boxShadow: `0 0 14px ${C.cyan}`,
            }}
          />
        ))}
        <div style={{ position: "absolute", left: size * 0.3, top: size * 0.56, width: size * 0.4, height: size * 0.06, borderRadius: 4, background: color }} />
      </div>
    </div>
  );
};

/** Generic neon-dusk "game feed" (no real assets). Fills its box at 16:9 scale. */
const GameFeed: React.FC<{ f: number; w: number; h: number; hype?: number }> = ({ f, w, h, hype = 0 }) => {
  const t = f / FPS;
  const carX = mod(f * 9, w + 400) - 200;
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", background: "linear-gradient(180deg, #2a0b3d 0%, #a01a5c 42%, #ff8a3d 62%, #1a0b22 63%)" }}>
      {/* sun */}
      <div
        style={{
          position: "absolute",
          left: w * 0.5 - h * 0.28,
          top: h * 0.2,
          width: h * 0.56,
          height: h * 0.56,
          borderRadius: "50%",
          background: `linear-gradient(180deg, ${C.amber}, ${C.pink})`,
          boxShadow: `0 0 ${h * 0.25}px ${C.pink}`,
          maskImage: "repeating-linear-gradient(180deg, #000 0px, #000 14px, transparent 14px, transparent 20px)",
          WebkitMaskImage: "repeating-linear-gradient(180deg, #000 0px, #000 14px, transparent 14px, transparent 20px)",
        }}
      />
      {/* skyline */}
      {Array.from({ length: 18 }).map((_, i) => {
        const bw = w / 18;
        const bh = h * (0.12 + rand(i + 40) * 0.28);
        return (
          <div key={i} style={{ position: "absolute", left: i * bw, top: h * 0.63 - bh, width: bw + 1, height: bh, background: "#12081c" }}>
            {Array.from({ length: 6 }).map((__, j) => (
              <div
                key={j}
                style={{
                  position: "absolute",
                  left: bw * (0.2 + (j % 2) * 0.4),
                  top: 8 + Math.floor(j / 2) * 14,
                  width: bw * 0.2,
                  height: 6,
                  background: rand(i * 9 + j + Math.floor(t * 2)) > 0.5 ? C.amber : "transparent",
                  opacity: 0.8,
                }}
              />
            ))}
          </div>
        );
      })}
      {/* palm silhouettes (generic) */}
      {[0.08, 0.86].map((px, i) => (
        <div key={px} style={{ position: "absolute", left: w * px, top: h * 0.3, width: 10, height: h * 0.34, background: "#0c0612", transform: `rotate(${i ? 6 : -6}deg)` }}>
          {[0, 1, 2, 3, 4].map((k) => (
            <div
              key={k}
              style={{
                position: "absolute",
                left: -h * 0.09,
                top: -6,
                width: h * 0.2,
                height: 10,
                borderRadius: 10,
                background: "#0c0612",
                transform: `rotate(${-50 + k * 25 + Math.sin(t * 2 + k) * 4}deg)`,
                transformOrigin: "center",
              }}
            />
          ))}
        </div>
      ))}
      {/* road + speeding car lights */}
      <div style={{ position: "absolute", left: 0, right: 0, top: h * 0.63, bottom: 0, background: "linear-gradient(180deg, #1a0b22, #070309)" }} />
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} style={{ position: "absolute", top: h * 0.8, left: mod(i * 160 - f * 14, w + 160) - 80, width: 70, height: 6, background: "rgba(255,255,255,0.5)" }} />
      ))}
      <div style={{ position: "absolute", top: h * 0.7, left: carX, width: 150, height: 34, borderRadius: 14, background: C.pink, boxShadow: `0 0 30px ${C.pink}` }}>
        <div style={{ position: "absolute", right: -40, top: 10, width: 60, height: 12, background: `linear-gradient(90deg, ${C.amber}, transparent)` }} />
      </div>
      {/* hype flash */}
      {hype > 0 && <div style={{ position: "absolute", inset: 0, background: C.amber, opacity: hype * 0.25 * Math.abs(Math.sin(f / 3)) }} />}
    </div>
  );
};

// -------------------------------------------------------------------------
// 01 — HOOK: waiting for the stream to end is too late
// -------------------------------------------------------------------------
const SceneHook: React.FC<{ f: number; fps: number }> = ({ f, fps }) => {
  const op = sceneOpacity(f, SC.hook, 0, 10);
  if (op <= 0) return null;
  const shake = f >= sec(4.44) && f < sec(4.44) + 16 ? (rand(f) - 0.5) * 34 : 0;
  const card = sp(f, sec(0.9), fps);
  const scrub = interpolate(f, [sec(0.9), sec(5.3)], [0.02, 0.07], clamp);
  const lost = interpolate(f, [sec(2.98), sec(5.3)], [0, 2400000], { ...clamp, easing: Easing.in(Easing.quad) });
  const vodLeft = 6 * 3600 - Math.floor((f / fps) * 7);
  const hh = Math.floor(vodLeft / 3600);
  const mm = Math.floor((vodLeft % 3600) / 60);
  const ss = vodLeft % 60;
  return (
    <AbsoluteFill style={{ opacity: op, transform: `translate(${shake}px, ${shake * 0.5}px)` }}>
      <div style={{ position: "absolute", top: 120, width: "100%", textAlign: "center", fontFamily: MONO, fontSize: 26, letterSpacing: 8, color: C.muted }}>
        // STREAM.STATUS = ⏳ WAITING
      </div>
      <Title top={180}>
        <Slam f={f} at={sec(0)} fps={fps}>
          <div style={{ fontSize: 120 }}>ЖДАТЬ КОНЦА</div>
        </Slam>
        <Slam f={f} at={sec(1.32)} fps={fps}>
          <div style={{ fontSize: 120, color: C.pink, textShadow: `0 0 40px ${C.pink}` }}>СТРИМА</div>
        </Slam>
        <div style={{ height: 24 }} />
        {f >= sec(4.44) && (
          <Slam f={f} at={sec(4.44)} fps={fps}>
            <Highlight f={f} at={sec(4.48)} size={150} color={C.red}>
              — ПОЗДНО
            </Highlight>
          </Slam>
        )}
      </Title>

      {/* VOD player card */}
      {f >= sec(0.9) && (
        <Card3D f={f} fps={fps} at={sec(0.9)} x={90} y={720} w={900} h={560} rotY={-8} accent={C.muted} pad={0}>
          <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 440, background: "#0b0812", overflow: "hidden", filter: "grayscale(0.7) brightness(0.55)" }}>
            <GameFeed f={f} w={900} h={440} />
          </div>
          {/* spinner */}
          <div
            style={{
              position: "absolute",
              left: 450 - 50,
              top: 170,
              width: 100,
              height: 100,
              borderRadius: "50%",
              border: "10px solid rgba(255,255,255,0.15)",
              borderTopColor: C.white,
              transform: `rotate(${f * 9}deg)`,
            }}
          />
          <div style={{ position: "absolute", left: 24, top: 20 }}>
            <Badge f={f} label="VOD · ОБРАБОТКА…" color={C.muted} size={20} />
          </div>
          {/* timeline */}
          <div style={{ position: "absolute", left: 24, right: 24, top: 462 }}>
            <div style={{ height: 10, borderRadius: 5, background: "rgba(255,255,255,0.1)", position: "relative" }}>
              <div style={{ width: `${scrub * 100}%`, height: "100%", borderRadius: 5, background: C.white }} />
              {Array.from({ length: 24 }).map((_, i) => (
                <div key={i} style={{ position: "absolute", left: `${(i / 24) * 100}%`, top: -6, width: 2, height: 22, background: "rgba(255,255,255,0.12)" }} />
              ))}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 14, fontFamily: MONO, fontSize: 24, color: C.muted }}>
              <span>
                ОСТАЛОСЬ {String(hh).padStart(2, "0")}:{String(mm).padStart(2, "0")}:{String(ss).padStart(2, "0")}
              </span>
              <span>RENDER {Math.floor(scrub * 100)}%</span>
            </div>
          </div>
        </Card3D>
      )}
      <FloorShadow x={140} y={1300} w={800} f={f} />

      {/* crossed-out "6 ЧАСОВ VOD" */}
      {f >= sec(1.62) && (
        <div style={{ position: "absolute", top: 900, width: "100%", textAlign: "center", transform: `scale(${sp(f, sec(1.62), fps)}) rotate(-4deg)` }}>
          <span
            style={{
              position: "relative",
              display: "inline-block",
              padding: "14px 40px",
              borderRadius: 20,
              background: "rgba(10,6,16,0.9)",
              border: `3px solid ${C.white}`,
              fontFamily: SANS,
              fontWeight: 900,
              fontSize: 96,
              color: C.white,
              letterSpacing: -2,
            }}
          >
            6 ЧАСОВ VOD
            <Strike f={f} at={sec(2.5)} />
          </span>
        </div>
      )}

      {/* views lost ticker */}
      {f >= sec(2.98) && (
        <div style={{ position: "absolute", top: 1320, width: "100%", display: "flex", justifyContent: "center", gap: 20, opacity: sp(f, sec(2.98), fps) }}>
          <Badge f={f} label={`-${fmt(lost)} VIEWS`} color={C.red} size={30} />
          <Badge f={f} label="КОНКУРЕНТЫ: 214 КЛИПОВ" color={C.amber} size={30} />
        </div>
      )}
    </AbsoluteFill>
  );
};

// -------------------------------------------------------------------------
// 02 — LAUNCH: 19.11 slam, millions of viewers, second-by-second race
// -------------------------------------------------------------------------
const SceneLaunch: React.FC<{ f: number; fps: number }> = ({ f, fps }) => {
  const op = sceneOpacity(f, SC.launch, 8, 10);
  if (op <= 0) return null;
  const hit = sec(5.44);
  const g = sp(f, hit, fps, { damping: 9, stiffness: 300, mass: 0.6 });
  const shake = f >= hit && f < hit + 14 ? (rand(f) - 0.5) * 40 : 0;
  const viewers = interpolate(f, [sec(6.64), sec(8.6)], [0, 18400000], { ...clamp, easing: EXPO_OUT }) + (f > sec(8.6) ? (f - sec(8.6)) * 913 : 0);
  const race = interpolate(f, [sec(8.72), sec(11.3)], [0, 1], { ...clamp, easing: EXPO_OUT });
  const ms = Math.max(0, f - sec(11.3)) * 16.67;
  return (
    <AbsoluteFill style={{ opacity: op, transform: `translate(${shake}px, ${shake * 0.4}px)` }}>
      {/* retro sun behind */}
      <div
        style={{
          position: "absolute",
          left: 540 - 380,
          top: 140,
          width: 760,
          height: 760,
          borderRadius: "50%",
          background: `linear-gradient(180deg, ${C.amber} 0%, ${C.pink} 70%, ${C.purple} 100%)`,
          opacity: 0.32 * g,
          filter: "blur(2px)",
          maskImage: "repeating-linear-gradient(180deg, #000 0px, #000 34px, transparent 34px, transparent 46px)",
          WebkitMaskImage: "repeating-linear-gradient(180deg, #000 0px, #000 34px, transparent 34px, transparent 46px)",
          transform: `translateY(${(1 - g) * 200 + mod(f * 0.5, 46) * 0}px)`,
        }}
      />
      <div style={{ position: "absolute", top: 150, width: "100%", textAlign: "center" }}>
        <Badge f={f} label="GTA VI · LAUNCH DAY · 00:00:00" color={C.amber} size={26} />
      </div>
      {f >= hit && (
        <div
          style={{
            position: "absolute",
            top: 210,
            width: "100%",
            textAlign: "center",
            transform: `scale(${3 - g * 2})`,
            opacity: interpolate(g, [0, 0.2], [0, 1], clamp),
          }}
        >
          <span
            style={{
              fontFamily: SANS,
              fontWeight: 900,
              fontSize: 330,
              letterSpacing: -14,
              lineHeight: 1,
              background: `linear-gradient(180deg, #fff3c4 0%, ${C.amber} 40%, ${C.pink} 100%)`,
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
              filter: `drop-shadow(0 0 30px ${C.pink}) drop-shadow(0 12px 0 rgba(0,0,0,0.5))`,
            }}
          >
            19.11
          </span>
          <div style={{ fontFamily: MONO, fontSize: 30, letterSpacing: 18, color: C.cyan, marginTop: -6, textShadow: `0 0 20px ${C.cyan}` }}>НОЯБРЯ · 2026</div>
        </div>
      )}

      {/* stream wall + viewers */}
      {f >= sec(6.64) && (
        <div style={{ position: "absolute", left: 60, right: 60, top: 680, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
          {Array.from({ length: 8 }).map((_, i) => {
            const s = sp(f, sec(6.64) + i * 4, fps, { damping: 12, stiffness: 220, mass: 0.5 });
            return (
              <div
                key={i}
                style={{
                  position: "relative",
                  height: 136,
                  borderRadius: 14,
                  overflow: "hidden",
                  border: `2px solid ${i % 2 ? C.pink : C.amber}88`,
                  transform: `scale(${s}) rotate(${(rand(i) - 0.5) * 4}deg)`,
                  opacity: s,
                }}
              >
                <div style={{ position: "absolute", inset: 0, transform: `scale(0.27)`, transformOrigin: "top left", width: 900, height: 506 }}>
                  <GameFeed f={f + i * 37} w={900} h={506} />
                </div>
                <div style={{ position: "absolute", left: 6, top: 6, padding: "2px 8px", borderRadius: 6, background: C.red, fontFamily: MONO, fontSize: 14, fontWeight: 800, color: C.white }}>LIVE</div>
                <div style={{ position: "absolute", right: 6, bottom: 6, fontFamily: MONO, fontSize: 14, color: C.white, background: "rgba(0,0,0,0.6)", padding: "1px 6px", borderRadius: 6 }}>
                  👁 {fmt(40000 + rand(i + Math.floor(f / 20)) * 900000)}
                </div>
              </div>
            );
          })}
          <div style={{ gridColumn: "1 / span 4", textAlign: "center", marginTop: 10, fontFamily: SANS, fontWeight: 900, fontSize: 64, color: C.white }}>
            👁 {fmt(viewers)} <span style={{ fontSize: 30, color: C.muted, fontFamily: MONO }}>ЗРИТЕЛЕЙ</span>
          </div>
        </div>
      )}

      {/* upload race */}
      {f >= sec(8.72) && (
        <div style={{ position: "absolute", left: 90, right: 90, top: 1130, opacity: sp(f, sec(8.72), fps) }}>
          {[
            { n: "ПЕРВЫЙ КЛИП", p: race, c: C.amber, v: "1.2M" },
            { n: "ВТОРОЙ", p: race * 0.62, c: C.muted, v: "84K" },
            { n: "ТЫ (ЖДЁШЬ VOD)", p: race * 0.08, c: C.red, v: "312" },
          ].map((r) => (
            <div key={r.n} style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontFamily: MONO, fontSize: 22, color: r.c, marginBottom: 6 }}>
                <span>{r.n}</span>
                <span>{r.v} views</span>
              </div>
              <Bar p={r.p} color={r.c} h={14} />
            </div>
          ))}
        </div>
      )}

      {/* stopwatch stamp */}
      {f >= sec(11.3) && (
        <div style={{ position: "absolute", top: 560, width: "100%", textAlign: "center" }}>
          <Slam f={f} at={sec(11.3)} fps={fps}>
            <span
              style={{
                display: "inline-block",
                padding: "16px 34px",
                border: `6px solid ${C.cyan}`,
                borderRadius: 18,
                background: "rgba(7,4,13,0.92)",
                color: C.cyan,
                fontFamily: SANS,
                fontWeight: 900,
                fontSize: 74,
                letterSpacing: -1,
                transform: "rotate(-5deg)",
                boxShadow: `0 0 50px ${C.cyan}88`,
              }}
            >
              ⏱ СЕКУНДА В СЕКУНДУ
              <div style={{ fontFamily: MONO, fontSize: 30, letterSpacing: 4, color: C.white }}>
                00:00:{String(Math.floor(ms / 1000)).padStart(2, "0")}.{String(Math.floor(ms % 1000)).padStart(3, "0")}
              </div>
            </span>
          </Slam>
        </div>
      )}
    </AbsoluteFill>
  );
};

// -------------------------------------------------------------------------
// 03 — CHAT: bot sits on the live stream, chat velocity spikes 3x
// -------------------------------------------------------------------------
const USERS = [
  ["vice_king", C.pink],
  ["lucia_fan", C.amber],
  ["n00bmaster", C.cyan],
  ["hype_train", C.green],
  ["xX_jason_Xx", C.purple],
  ["clipper228", C.amber],
  ["Kappa_Lord", C.cyan],
  ["miami_nights", C.pink],
  ["speedrun_ru", C.green],
] as const;
const MSGS = ["го го го", "ГРАФОН 🔥", "это реально?", "LUL", "лучший старт", "ждал 10 лет", "PogChamp", "карта огромная", "ахахах", "ЧТООО", "W стример", "клип клип!!"];
const HYPE_MSGS = ["ЧТОООО 😱", "КЛИП!!!", "OMEGALUL", "ААААА", "POGGERS", "НЕ МОЖЕТ БЫТЬ", "🔥🔥🔥🔥", "ЛЕГЕНДА"];

const rateAt = (t: number) => 1.6 + 3.2 * smooth(21.2, 22.4, t);

const SceneChat: React.FC<{ f: number; fps: number }> = ({ f, fps }) => {
  const op = sceneOpacity(f, SC.chat, 8, 10);
  if (op <= 0) return null;
  const t = f / fps;
  const spike = smooth(21.2, 22.4, t);
  // cumulative message count (integral of rate)
  let cum = 0;
  for (let k = SC.chat[0] - 60; k <= f; k++) cum += rateAt(k / fps) / fps;
  const scroll = cum * 2.2; // 2.2 msgs per rate unit — visual density
  const top = Math.floor(scroll);
  const frac = scroll - top;
  const player = sp(f, SC.chat[0], fps);
  const chatIn = sp(f, sec(12.9), fps);
  const sleep = sp(f, sec(17.8), fps);
  const graphIn = sp(f, sec(19.24), fps);
  const alertS = sp(f, sec(22.2), fps, { damping: 8, stiffness: 280, mass: 0.5 });
  const viewers = 412000 + Math.floor(f * 37 + rand(Math.floor(f / 10)) * 900);
  const shake = spike > 0.5 && spike < 1 ? (rand(f) - 0.5) * 10 : 0;

  // rate history for chart (40 bins, newest right)
  const BINS = 40;
  const hist = Array.from({ length: BINS }, (_, i) => {
    const tt = t - (BINS - 1 - i) * 0.12;
    return rateAt(tt) * (0.8 + rand(i + Math.floor(tt * 8)) * 0.4);
  });

  return (
    <AbsoluteFill style={{ opacity: op, transform: `translate(${shake}px, 0px)` }}>
      <div style={{ position: "absolute", top: 120, width: "100%", textAlign: "center", fontFamily: MONO, fontSize: 26, letterSpacing: 6, color: C.muted }}>
        // CLIPBOT v2 · ATTACHED TO LIVE
      </div>
      {/* player */}
      <div
        style={{
          position: "absolute",
          left: 60,
          top: 180,
          width: 960,
          height: 540,
          borderRadius: 22,
          overflow: "hidden",
          border: `3px solid ${spike > 0.3 ? C.amber : C.purple}`,
          boxShadow: `0 30px 80px rgba(0,0,0,0.7), 0 0 ${30 + spike * 50}px ${spike > 0.3 ? C.amber : C.purple}88`,
          transform: `perspective(1400px) rotateX(${(1 - player) * 30}deg) translateY(${(1 - player) * 120}px)`,
          opacity: player,
        }}
      >
        <GameFeed f={f} w={960} h={540} hype={spike} />
        <div style={{ position: "absolute", left: 18, top: 18, display: "flex", gap: 10 }}>
          <span style={{ padding: "4px 12px", borderRadius: 8, background: C.red, fontFamily: MONO, fontWeight: 800, fontSize: 22, color: C.white }}>● LIVE</span>
          <span style={{ padding: "4px 12px", borderRadius: 8, background: "rgba(0,0,0,0.6)", fontFamily: MONO, fontSize: 22, color: C.white }}>👁 {fmt(viewers)}</span>
        </div>
        <div style={{ position: "absolute", right: 18, top: 18, display: "flex", alignItems: "center", gap: 10, padding: "6px 12px", borderRadius: 12, background: "rgba(7,4,13,0.75)", border: `2px solid ${C.pink}` }}>
          <BotIcon f={f} size={34} />
          <span style={{ fontFamily: MONO, fontSize: 20, color: C.pink, fontWeight: 800 }}>BOT WATCHING</span>
        </div>
        {/* bot scan line */}
        <div style={{ position: "absolute", left: 0, right: 0, top: mod(f * 6, 540), height: 3, background: `linear-gradient(90deg, transparent, ${C.cyan}, transparent)`, opacity: 0.7 }} />
        {/* buffering ring-buffer indicator */}
        <div style={{ position: "absolute", left: 18, bottom: 16, right: 18 }}>
          <div style={{ display: "flex", gap: 3 }}>
            {Array.from({ length: 40 }).map((_, i) => (
              <div key={i} style={{ flex: 1, height: 10, borderRadius: 2, background: i === mod(f / 6, 40) ? C.white : i < 40 ? `${C.cyan}66` : "transparent" }} />
            ))}
          </div>
          <div style={{ fontFamily: MONO, fontSize: 16, color: C.cyan, marginTop: 4 }}>RING BUFFER · LAST 40s IN RAM</div>
        </div>
      </div>

      {/* chat window */}
      <div
        style={{
          position: "absolute",
          left: 60,
          top: 750,
          width: 560,
          height: 560,
          borderRadius: 22,
          background: C.panel,
          border: `2px solid ${spike > 0.3 ? C.amber : "rgba(168,85,247,0.6)"}`,
          overflow: "hidden",
          transform: `perspective(1400px) rotateY(${(1 - chatIn) * -40 + 6}deg)`,
          opacity: chatIn,
          boxShadow: "0 30px 70px rgba(0,0,0,0.65)",
        }}
      >
        <div style={{ padding: "14px 18px", borderBottom: "1px solid rgba(255,255,255,0.1)", fontFamily: MONO, fontSize: 20, color: C.white, display: "flex", justifyContent: "space-between" }}>
          <span>ЧАТ ТРАНСЛЯЦИИ</span>
          <span style={{ color: spike > 0.3 ? C.amber : C.muted }}>{(rateAt(t) * 9.4).toFixed(1)} msg/s</span>
        </div>
        <div style={{ position: "absolute", left: 0, right: 0, top: 58, bottom: 0, overflow: "hidden" }}>
          {Array.from({ length: 11 }).map((_, j) => {
            const k = top - j;
            const [u, col] = USERS[mod(k * 7, USERS.length)];
            const hot = rand(k * 3) < spike;
            const msg = hot ? HYPE_MSGS[mod(k, HYPE_MSGS.length)] : MSGS[mod(k, MSGS.length)];
            const y = 470 - (j - frac) * 46;
            return (
              <div
                key={k}
                style={{
                  position: "absolute",
                  left: 18,
                  right: 18,
                  top: y,
                  fontFamily: SANS,
                  fontSize: 26,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  color: C.white,
                  opacity: interpolate(y, [-20, 60, 470], [0, 1, 1], clamp),
                }}
              >
                <span style={{ color: col, fontWeight: 800 }}>{u}</span>: <span style={{ fontWeight: hot ? 900 : 500, color: hot ? C.amber : C.white }}>{msg}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* right column: sleeping user + telemetry */}
      {f >= sec(16.0) && (
        <Card3D f={f} fps={fps} at={sec(16.0)} x={650} y={760} w={370} h={250} rotY={-12} accent={C.cyan} pad={20}>
          <Telemetry
            f={f}
            color={C.cyan}
            size={20}
            rows={[
              ["STREAM", () => "LIVE ●"],
              ["VIEWERS", () => fmt(viewers)],
              ["CHAT/S", (k) => (rateAt(t) * 9.4 + rand(k) * 2).toFixed(1)],
              ["BASELINE", () => "15.0"],
              ["TRIGGER", () => "×3.0"],
            ]}
          />
        </Card3D>
      )}
      {f >= sec(17.8) && (
        <div style={{ position: "absolute", left: 650, top: 1040, width: 370, textAlign: "center", opacity: sleep, transform: `translateY(${(1 - sleep) * 40}px)` }}>
          <div style={{ fontSize: 90, lineHeight: 1 }}>
            🌙<span style={{ fontSize: 40, verticalAlign: "top", opacity: 0.5 + 0.5 * Math.abs(Math.sin(f / 15)) }}>z</span>
            <span style={{ fontSize: 30, verticalAlign: "top", opacity: 0.5 + 0.5 * Math.abs(Math.sin(f / 15 + 1)) }}>z</span>
          </div>
          <div style={{ fontFamily: MONO, fontSize: 24, color: C.muted, letterSpacing: 2 }}>ТЫ СПИШЬ · 03:{String(47 + Math.floor((f - sec(17.8)) / 60)).padStart(2, "0")}</div>
          <div style={{ fontFamily: MONO, fontSize: 24, color: C.green, letterSpacing: 2 }}>БОТ НЕ СПИТ ●</div>
        </div>
      )}

      {/* chat-velocity chart */}
      {f >= sec(19.24) && (
        <div
          style={{
            position: "absolute",
            left: 60,
            right: 60,
            top: 1330,
            height: 210,
            borderRadius: 20,
            background: C.panel,
            border: `2px solid ${spike > 0.3 ? C.amber : C.border}`,
            padding: "14px 20px",
            boxSizing: "border-box",
            opacity: graphIn,
            transform: `translateY(${(1 - graphIn) * 60}px)`,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", fontFamily: MONO, fontSize: 18, color: C.muted }}>
            <span>СКОРОСТЬ ЧАТА · msg/s</span>
            <span style={{ color: C.amber }}>— — ПОРОГ ×3</span>
          </div>
          <div style={{ position: "relative", height: 140, display: "flex", alignItems: "flex-end", gap: 4, marginTop: 8 }}>
            {hist.map((v, i) => {
              const hot = v > 3.8;
              return <div key={i} style={{ flex: 1, height: `${clamp01(v / 5.6) * 100}%`, borderRadius: 3, background: hot ? C.amber : `${C.purple}aa`, boxShadow: hot ? `0 0 12px ${C.amber}` : "none" }} />;
            })}
            <div style={{ position: "absolute", left: 0, right: 0, bottom: `${(4.6 / 5.6) * 100}%`, borderTop: `3px dashed ${C.amber}` }} />
          </div>
        </div>
      )}

      {/* HYPE SPIKE alert */}
      {f >= sec(22.2) && (
        <div style={{ position: "absolute", top: 560, width: "100%", textAlign: "center", transform: `scale(${0.4 + alertS * 0.6}) rotate(-4deg)`, opacity: alertS }}>
          <span
            style={{
              display: "inline-block",
              padding: "18px 40px",
              borderRadius: 20,
              background: C.amber,
              color: "#0a0a0a",
              fontFamily: SANS,
              fontWeight: 900,
              fontSize: 82,
              letterSpacing: -2,
              boxShadow: `0 0 ${60 + Math.abs(Math.sin(f / 4)) * 40}px ${C.amber}`,
            }}
          >
            ⚡ HYPE SPIKE ×3
          </span>
        </div>
      )}
    </AbsoluteFill>
  );
};

// -------------------------------------------------------------------------
// 04 — CLIP: -40s ring buffer → 16:9→9:16 crop → karaoke → auto-upload
// -------------------------------------------------------------------------
const PHONE_WORDS = ["ОН", "РЕАЛЬНО", "ЭТО", "СДЕЛАЛ", "😱"];

const SceneClip: React.FC<{ f: number; fps: number }> = ({ f, fps }) => {
  const op = sceneOpacity(f, SC.clip, 8, 10);
  if (op <= 0) return null;
  const t = f / fps;
  const cap = sec(23.42);
  const ringIn = sp(f, SC.clip[0], fps);
  const capP = interpolate(f, [cap, cap + 50], [0, 1], { ...clamp, easing: EXPO_OUT });
  const ringOut = interpolate(f, [sec(26.4), sec(26.9)], [1, 0], clamp);
  const crop = interpolate(f, [sec(26.82), sec(28.4)], [0, 1], { ...clamp, easing: EXPO_OUT });
  const grow = interpolate(f, [sec(28.4), sec(29.4)], [0, 1], { ...clamp, easing: EXPO_OUT });
  const cardIn = sp(f, sec(26.6), fps);
  const upP = interpolate(f, [sec(32.54), sec(33.6)], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const done = sp(f, sec(33.6), fps, { damping: 8, stiffness: 260, mass: 0.5 });

  // crop box size: 900x506 → 285x506 → 470x836
  const bw = interpolate(grow, [0, 1], [interpolate(crop, [0, 1], [900, 285]), 470]);
  const bh = interpolate(grow, [0, 1], [506, 836]);
  const feedW = bh * (16 / 9);
  const track = Math.sin(t * 1.3) * 40 * crop * (1 - grow);
  const boxLeft = 540 - bw / 2;
  const boxTop = interpolate(grow, [0, 1], [640, 520]);
  const views = upP >= 1 ? Math.floor(Math.pow(Math.max(0, f - sec(33.6)), 1.8) * 9) : 0;

  return (
    <AbsoluteFill style={{ opacity: op }}>
      {/* header */}
      <Title top={150}>
        {f < sec(26.82) ? (
          <Slam f={f} at={cap} fps={fps}>
            <span style={{ fontSize: 210, color: C.pink, letterSpacing: -10, textShadow: `0 0 50px ${C.pink}` }}>-40s</span>
            <div style={{ fontFamily: MONO, fontSize: 30, letterSpacing: 10, color: C.white, fontWeight: 700 }}>CAPTURE · RING BUFFER</div>
          </Slam>
        ) : f < sec(29.62) ? (
          <Slam f={f} at={sec(26.82)} fps={fps}>
            <span style={{ fontSize: 110 }}>
              16:9 <span style={{ color: C.amber }}>→</span> 9:16
            </span>
          </Slam>
        ) : f < sec(32.54) ? (
          <Slam f={f} at={sec(29.62)} fps={fps}>
            <Highlight f={f} at={sec(29.7)} size={96} color={C.amber}>
              + КАРАОКЕ
            </Highlight>
          </Slam>
        ) : (
          <Slam f={f} at={sec(32.54)} fps={fps}>
            <span style={{ fontSize: 96 }}>
              САМ <span style={{ color: C.green }}>ПУБЛИКУЕТ</span>
            </span>
          </Slam>
        )}
      </Title>

      {/* ring buffer */}
      {ringOut > 0 && (
        <div style={{ position: "absolute", left: 540 - 300, top: 560, width: 600, height: 600, opacity: ringIn * ringOut, transform: `scale(${0.7 + ringIn * 0.3}) rotate(${-f * 0.3}deg)` }}>
          <svg width={600} height={600}>
            {Array.from({ length: 60 }).map((_, i) => {
              const a0 = (i / 60) * Math.PI * 2 - Math.PI / 2;
              const a1 = ((i + 0.8) / 60) * Math.PI * 2 - Math.PI / 2;
              const r0 = 230;
              const r1 = 280;
              const head = mod(f / 6, 60);
              const age = mod(head - i, 60);
              const captured = age < 40 * capP;
              const col = captured ? C.pink : age < 40 ? `${C.cyan}88` : "rgba(255,255,255,0.08)";
              const p = (r: number, a: number) => `${300 + Math.cos(a) * r},${300 + Math.sin(a) * r}`;
              return <polygon key={i} points={`${p(r0, a0)} ${p(r1, a0)} ${p(r1, a1)} ${p(r0, a1)}`} fill={i === head ? C.white : col} style={captured ? { filter: `drop-shadow(0 0 6px ${C.pink})` } : undefined} />;
            })}
          </svg>
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", transform: `rotate(${f * 0.3}deg)` }}>
            <BotIcon f={f} size={120} />
            <div style={{ fontFamily: MONO, fontSize: 26, color: capP > 0 ? C.pink : C.cyan, marginTop: 18, fontWeight: 800 }}>{capP > 0 ? `✂ ${Math.round(capP * 40)}s / 40s` : "BUFFERING"}</div>
          </div>
        </div>
      )}
      {f >= cap && ringOut > 0 && (
        <div style={{ position: "absolute", left: 90, right: 90, top: 1200, opacity: ringOut }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontFamily: MONO, fontSize: 22, color: C.muted, marginBottom: 8 }}>
            <span>02:14:07</span>
            <span style={{ color: C.pink }}>[ −00:40 ▸ NOW ]</span>
            <span>02:14:47</span>
          </div>
          <div style={{ height: 70, borderRadius: 12, background: "rgba(255,255,255,0.06)", position: "relative", overflow: "hidden" }}>
            {Array.from({ length: 70 }).map((_, i) => (
              <div key={i} style={{ position: "absolute", left: `${(i / 70) * 100}%`, bottom: 0, width: 6, height: 10 + rand(i * 5) * 50 + (i > 52 ? 10 : 0), background: i > 70 * (1 - 0.57 * capP) ? C.pink : "rgba(255,255,255,0.2)", borderRadius: 2 }} />
            ))}
            <div style={{ position: "absolute", top: 0, bottom: 0, right: 0, width: `${57 * capP}%`, border: `3px solid ${C.pink}`, borderRadius: 12, boxSizing: "border-box", background: `${C.pink}18` }} />
          </div>
        </div>
      )}

      {/* crop / phone */}
      {f >= sec(26.6) && (
        <>
          {/* ghost full frame during crop */}
          {grow < 1 && (
            <div style={{ position: "absolute", left: 90, top: 640, width: 900, height: 506, borderRadius: 18, overflow: "hidden", opacity: cardIn * (1 - grow) * 0.45, filter: "brightness(0.4) blur(2px)" }}>
              <GameFeed f={f} w={900} h={506} />
            </div>
          )}
          <div
            style={{
              position: "absolute",
              left: boxLeft + track,
              top: boxTop,
              width: bw,
              height: bh,
              borderRadius: interpolate(grow, [0, 1], [18, 54]),
              overflow: "hidden",
              border: `${interpolate(grow, [0, 1], [4, 12])}px solid ${grow > 0.5 ? "#15101e" : C.amber}`,
              boxShadow: `0 40px 90px rgba(0,0,0,0.7), 0 0 ${40 + grow * 30}px ${grow > 0.5 ? C.pink : C.amber}88`,
              opacity: cardIn,
              transform: `scale(${0.85 + cardIn * 0.15}) rotateY(${grow * -8}deg)`,
              boxSizing: "border-box",
            }}
          >
            <div style={{ position: "absolute", top: 0, left: bw / 2 - feedW / 2 - track, width: feedW, height: bh }}>
              <GameFeed f={f} w={feedW} h={bh} />
            </div>
            {/* crop guides */}
            {grow < 0.5 && crop > 0 && (
              <>
                {[1, 2].map((k) => (
                  <div key={`v${k}`} style={{ position: "absolute", top: 0, bottom: 0, left: `${(k / 3) * 100}%`, width: 1, background: "rgba(255,255,255,0.4)" }} />
                ))}
                {[1, 2].map((k) => (
                  <div key={`h${k}`} style={{ position: "absolute", left: 0, right: 0, top: `${(k / 3) * 100}%`, height: 1, background: "rgba(255,255,255,0.4)" }} />
                ))}
                <div style={{ position: "absolute", left: 8, top: 8, fontFamily: MONO, fontSize: 16, color: C.amber, background: "rgba(0,0,0,0.6)", padding: "2px 6px", borderRadius: 4 }}>
                  AUTO-TRACK ◎
                </div>
              </>
            )}
            {/* phone UI */}
            {grow > 0.6 && (
              <>
                <div style={{ position: "absolute", left: bw / 2 - 60, top: 14, width: 120, height: 30, borderRadius: 15, background: "#000" }} />
                <div style={{ position: "absolute", right: 16, top: 300, display: "flex", flexDirection: "column", gap: 26, alignItems: "center", fontSize: 40 }}>
                  {["❤️", "💬", "↗"].map((e, i) => (
                    <div key={e} style={{ textAlign: "center", transform: `scale(${sp(f, sec(29.4) + i * 5, fps)})` }}>
                      {e}
                      <div style={{ fontFamily: MONO, fontSize: 16, color: C.white }}>{fmt(views / (i + 1) / 12)}</div>
                    </div>
                  ))}
                </div>
                <div style={{ position: "absolute", left: 20, bottom: 40, fontFamily: SANS, fontSize: 20, color: C.white, fontWeight: 700 }}>
                  @clipbot · GTA VI 🔥
                  <div style={{ fontWeight: 500, opacity: 0.8 }}>#gta6 #shorts</div>
                </div>
                <div style={{ position: "absolute", left: 0, bottom: 0, height: 5, width: `${mod(f - sec(29.4), 600) / 6}%`, background: C.white }} />
              </>
            )}
            {/* karaoke subtitles inside the phone */}
            {f >= sec(29.62) && (
              <div style={{ position: "absolute", left: 16, right: 16, top: 470, textAlign: "center" }}>
                {PHONE_WORDS.map((w, i) => {
                  const at = sec(29.62) + i * 14;
                  const on = mod(f - at, 80) < 80 && f >= at;
                  const cycle = Math.floor((f - sec(29.62)) / 70);
                  const activeIdx = mod((f - sec(29.62)) / 14, PHONE_WORDS.length + 1);
                  const active = activeIdx === i;
                  return (
                    <span
                      key={`${w}${cycle}`}
                      style={{
                        display: "inline-block",
                        margin: "4px 8px",
                        padding: active ? "0 10px" : 0,
                        borderRadius: 10,
                        fontFamily: SANS,
                        fontWeight: 900,
                        fontSize: 52,
                        color: active ? "#0a0a0a" : on ? C.white : "rgba(255,255,255,0.4)",
                        background: active ? C.amber : "transparent",
                        transform: `scale(${active ? 1.15 : 1}) rotate(${active ? -3 : 0}deg)`,
                        WebkitTextStroke: active ? undefined : "2px #000",
                        paintOrder: "stroke fill",
                        boxShadow: active ? `0 0 24px ${C.amber}` : "none",
                      }}
                    >
                      {w}
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* side spec chips during crop/karaoke */}
      {f >= sec(27.2) && f < sec(32.54) && (
        <div style={{ position: "absolute", left: 50, top: 760, display: "flex", flexDirection: "column", gap: 16, opacity: sp(f, sec(27.2), fps) }}>
          <Badge f={f} label="1080×1920" color={C.amber} size={20} />
          <Badge f={f} label="FACE TRACK" color={C.cyan} size={20} />
          {f >= sec(29.62) && <Badge f={f} label="WHISPER ✓" color={C.pink} size={20} />}
        </div>
      )}
      {f >= sec(29.62) && f < sec(32.54) && (
        <div style={{ position: "absolute", right: 50, top: 760, display: "flex", flexDirection: "column", gap: 16, alignItems: "flex-end", opacity: sp(f, sec(29.62), fps) }}>
          <Badge f={f} label="FONT 900" color={C.white} size={20} />
          <Badge f={f} label="WORD SYNC" color={C.amber} size={20} />
        </div>
      )}

      {/* upload */}
      {f >= sec(32.54) && (
        <div style={{ position: "absolute", left: 90, right: 90, top: 1380 }}>
          {upP < 1 ? (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontFamily: MONO, fontSize: 24, color: C.white, marginBottom: 10 }}>
                <span>⬆ UPLOADING clip_0001.mp4</span>
                <span>{Math.floor(upP * 100)}%</span>
              </div>
              <Bar p={upP} color={C.green} h={18} />
            </div>
          ) : (
            <div style={{ textAlign: "center", transform: `scale(${done})` }}>
              <span
                style={{
                  display: "inline-block",
                  padding: "16px 34px",
                  borderRadius: 999,
                  background: C.green,
                  color: "#0a0a0a",
                  fontFamily: SANS,
                  fontWeight: 900,
                  fontSize: 48,
                  boxShadow: `0 0 50px ${C.green}`,
                }}
              >
                ✓ AUTO-UPLOADED · 0:38
              </span>
              <div style={{ display: "flex", justifyContent: "center", gap: 14, marginTop: 16 }}>
                {["SHORTS", "TIKTOK", "REELS"].map((p, i) => (
                  <div key={p} style={{ transform: `scale(${sp(f, sec(33.8) + i * 5, fps)})` }}>
                    <Badge f={f} label={p} color={[C.red, C.cyan, C.pink][i]} size={22} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      {f >= sec(34.26) && (
        <>
          <div style={{ position: "absolute", left: 40, top: 820, width: 210, textAlign: "center", fontFamily: MONO, fontSize: 26, fontWeight: 800, color: C.green, opacity: sp(f, sec(34.26), fps) }}>
            БОТ
            <div style={{ fontFamily: SANS, fontSize: 64, fontWeight: 900 }}>0:38</div>
          </div>
          <div style={{ position: "absolute", right: 40, top: 820, width: 210, textAlign: "center", fontFamily: MONO, fontSize: 26, fontWeight: 800, color: C.red, opacity: sp(f, sec(34.4), fps) }}>
            ЧЕЛОВЕК
            <div style={{ fontFamily: SANS, fontSize: 64, fontWeight: 900, textDecoration: "line-through" }}>2:00:00</div>
          </div>
        </>
      )}
    </AbsoluteFill>
  );
};

// -------------------------------------------------------------------------
// 05 — AWARD: Sony & Microsoft #1 most wanted
// -------------------------------------------------------------------------
const RANKS = [
  { n: "GTA VI", v: 1, c: C.amber },
  { n: "ИГРА #2", v: 0.58, c: C.muted },
  { n: "ИГРА #3", v: 0.46, c: C.muted },
  { n: "ИГРА #4", v: 0.33, c: C.muted },
];

const Trophy: React.FC<{ f: number; size: number }> = ({ f, size }) => {
  const shine = mod(f * 3, 400) - 100;
  const gold = `linear-gradient(135deg, #fff3c4 0%, ${C.amber} 35%, #b7791f 70%, #ffe08a 100%)`;
  return (
    <div style={{ position: "relative", width: size, height: size * 1.2 }}>
      {/* handles */}
      {[-1, 1].map((d) => (
        <div
          key={d}
          style={{
            position: "absolute",
            top: size * 0.08,
            left: d < 0 ? size * 0.02 : size * 0.68,
            width: size * 0.3,
            height: size * 0.32,
            borderRadius: "50%",
            border: `${size * 0.05}px solid ${C.amber}`,
          }}
        />
      ))}
      <div style={{ position: "absolute", left: size * 0.18, top: 0, width: size * 0.64, height: size * 0.56, borderRadius: `${size * 0.04}px ${size * 0.04}px ${size * 0.34}px ${size * 0.34}px`, background: gold, overflow: "hidden", boxShadow: `0 0 60px ${C.amber}88` }}>
        <div style={{ position: "absolute", top: -20, left: shine, width: 40, height: size, background: "rgba(255,255,255,0.55)", transform: "rotate(20deg)" }} />
        <div style={{ position: "absolute", width: "100%", top: size * 0.12, textAlign: "center", fontFamily: SANS, fontWeight: 900, fontSize: size * 0.22, color: "#5a3a06" }}>#1</div>
      </div>
      <div style={{ position: "absolute", left: size * 0.44, top: size * 0.55, width: size * 0.12, height: size * 0.24, background: gold }} />
      <div style={{ position: "absolute", left: size * 0.26, top: size * 0.78, width: size * 0.48, height: size * 0.1, borderRadius: 8, background: gold }} />
      <div style={{ position: "absolute", left: size * 0.2, top: size * 0.88, width: size * 0.6, height: size * 0.14, borderRadius: 8, background: "#1e1426", border: `3px solid ${C.amber}` }} />
    </div>
  );
};

const SceneAward: React.FC<{ f: number; fps: number }> = ({ f, fps }) => {
  const op = sceneOpacity(f, SC.award, 8, 10);
  if (op <= 0) return null;
  const tro = sp(f, sec(37.62), fps, { damping: 9, stiffness: 200, mass: 0.7 });
  const ranks = interpolate(f, [sec(38.56), sec(39.9)], [0, 1], { ...clamp, easing: EXPO_OUT });
  const traffic = sp(f, sec(41.86), fps);
  const wish = interpolate(f, [sec(37.62), sec(43.9)], [0, 9800000], { ...clamp, easing: EXPO_OUT });
  return (
    <AbsoluteFill style={{ opacity: op }}>
      <div style={{ position: "absolute", top: 130, width: "100%", textAlign: "center" }}>
        <Slam f={f} at={sec(39.94)} fps={fps}>
          <span style={{ fontFamily: SANS, fontWeight: 900, fontSize: 84, letterSpacing: -2, color: C.white, textShadow: "0 10px 40px rgba(0,0,0,0.8)" }}>
            SONY <span style={{ color: C.pink }}>&</span> MICROSOFT
          </span>
        </Slam>
      </div>
      {f < sec(39.94) && (
        <div style={{ position: "absolute", top: 150, width: "100%", textAlign: "center" }}>
          <Slam f={f} at={SC.award[0] + 12} fps={fps}>
            <span style={{ fontFamily: SANS, fontWeight: 900, fontSize: 120, letterSpacing: -4, color: C.amber, textShadow: `0 0 40px ${C.amber}` }}>GTA VI</span>
          </Slam>
        </div>
      )}
      <div style={{ position: "absolute", top: 260, width: "100%", textAlign: "center" }}>
        {f >= sec(37.98) && (
          <Slam f={f} at={sec(37.98)} fps={fps}>
            <Highlight f={f} at={sec(38.1)} size={96} color={C.amber}>
              #1 MOST WANTED
            </Highlight>
          </Slam>
        )}
      </div>

      {/* trophy with rays */}
      {f >= sec(37.62) && (
        <div style={{ position: "absolute", left: 540 - 150, top: 420, transform: `scale(${tro}) translateY(${Math.sin(f / 20) * 10}px)` }}>
          <div
            style={{
              position: "absolute",
              left: 150 - 320,
              top: 180 - 320,
              width: 640,
              height: 640,
              background: `repeating-conic-gradient(from ${f * 0.6}deg, ${C.amber}33 0deg 10deg, transparent 10deg 24deg)`,
              borderRadius: "50%",
              maskImage: "radial-gradient(circle, #000 20%, transparent 70%)",
              WebkitMaskImage: "radial-gradient(circle, #000 20%, transparent 70%)",
            }}
          />
          <Trophy f={f} size={300} />
        </div>
      )}
      <FloorShadow x={540 - 200} y={790} w={400} f={f} />

      {/* confetti */}
      {f >= sec(37.98) &&
        Array.from({ length: 40 }).map((_, i) => {
          const tt = (f - sec(37.98)) / fps;
          const x = 540 + (rand(i) - 0.5) * 1000 * Math.min(1, tt * 2);
          const y = 300 + tt * (200 + rand(i + 3) * 400) - Math.max(0, 1 - tt * 2) * 200;
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: x,
                top: y,
                width: 14,
                height: 24,
                background: [C.amber, C.pink, C.cyan, C.white][mod(i, 4)],
                transform: `rotate(${f * (4 + rand(i) * 6)}deg)`,
                opacity: interpolate(tt, [0, 0.2, 3, 4], [0, 1, 1, 0], clamp),
              }}
            />
          );
        })}

      {/* ranking card */}
      {f >= sec(38.56) && (
        <Card3D f={f} fps={fps} at={sec(38.56)} x={80} y={860} w={920} h={400} rotY={6} accent={C.amber} pad={28}>
          <div style={{ display: "flex", justifyContent: "space-between", fontFamily: MONO, fontSize: 20, color: C.muted, marginBottom: 18 }}>
            <span>MOST WISHLISTED · 2026</span>
            <span style={{ color: C.amber }}>♥ {fmt(wish)}</span>
          </div>
          {RANKS.map((r, i) => (
            <div key={r.n} style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 18 }}>
              <span style={{ width: 44, fontFamily: MONO, fontSize: 28, fontWeight: 800, color: r.c }}>#{i + 1}</span>
              <span style={{ width: 170, fontFamily: SANS, fontSize: 30, fontWeight: 900, color: i === 0 ? C.white : C.muted }}>{r.n}</span>
              <div style={{ flex: 1 }}>
                <Bar p={r.v * interpolate(ranks, [i * 0.1, 1], [0, 1], clamp)} color={r.c} h={i === 0 ? 30 : 18} />
              </div>
              {i === 0 && <span style={{ fontSize: 36 }}>👑</span>}
            </div>
          ))}
        </Card3D>
      )}

      {/* traffic spark */}
      {f >= sec(41.86) && (
        <div style={{ position: "absolute", left: 80, right: 80, top: 1300, display: "flex", alignItems: "center", gap: 30, opacity: traffic, transform: `translateY(${(1 - traffic) * 40}px)` }}>
          <Spark f={f} seed={7} w={520} h={150} color={C.green} trend={1} at={sec(41.86)} dur={60} />
          <div style={{ fontFamily: SANS, fontWeight: 900, fontSize: 48, color: C.green, lineHeight: 1.05 }}>
            ТРАФИК
            <div style={{ fontFamily: MONO, fontSize: 30 }}>▲ +{fmt(interpolate(f, [sec(41.86), sec(43.9)], [0, 4200], clamp))}%</div>
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};

// -------------------------------------------------------------------------
// 06 — CTA
// -------------------------------------------------------------------------
const SceneCta: React.FC<{ f: number; fps: number }> = ({ f, fps }) => {
  const op = sceneOpacity(f, SC.cta, 8, 0);
  if (op <= 0) return null;
  const lf = f - SC.cta[0];
  const url = "aingeneer.com";
  const typed = Math.floor(interpolate(f, [sec(47.4), sec(48.9)], [0, url.length], clamp));
  const urlIn = sp(f, sec(47.2), fps);
  const click = f >= sec(49.2) && f < sec(49.6);
  const boxIn = sp(f, sec(50.24), fps);
  const pulse = 1 + Math.abs(Math.sin(f / 9)) * 0.07;
  const comment = "БОТ";
  const ctyped = Math.floor(interpolate(f, [sec(51.38), sec(51.9)], [0, comment.length], clamp));
  return (
    <AbsoluteFill style={{ opacity: op }}>
      <Title top={150}>
        <Slam f={f} at={sec(44.38)} fps={fps}>
          <div style={{ fontSize: 104 }}>ХОЧЕШЬ ТАКОГО</div>
        </Slam>
        <Slam f={f} at={sec(45.2)} fps={fps}>
          <div style={{ fontSize: 104 }}>
            ЖЕ <span style={{ color: C.pink, textShadow: `0 0 40px ${C.pink}` }}>БОТА?</span>
          </div>
        </Slam>
      </Title>

      {/* bot hero */}
      {f >= sec(44.6) && (
        <div style={{ position: "absolute", left: 540 - 80, top: 430, transform: `scale(${sp(f, sec(44.6), fps)}) translateY(${Math.sin(lf / 18) * 12}px)` }}>
          <BotIcon f={f} size={160} />
        </div>
      )}
      <FloorShadow x={540 - 120} y={630} w={240} f={f} />
      {f >= sec(45.76) && (
        <div style={{ position: "absolute", top: 680, width: "100%", display: "flex", justifyContent: "center", gap: 14, opacity: sp(f, sec(45.76), fps) }}>
          <Badge f={f} label="24/7 LIVE" color={C.green} size={22} />
          <Badge f={f} label="×3 HYPE" color={C.amber} size={22} />
          <Badge f={f} label="9:16 AUTO" color={C.cyan} size={22} />
        </div>
      )}

      {/* browser URL bar */}
      {f >= sec(47.2) && (
        <div
          style={{
            position: "absolute",
            left: 80,
            right: 80,
            top: 780,
            padding: "22px 28px",
            borderRadius: 26,
            background: C.panel,
            border: `3px solid ${C.cyan}`,
            boxShadow: `0 0 50px ${C.cyan}55, 0 30px 60px rgba(0,0,0,0.6)`,
            display: "flex",
            alignItems: "center",
            gap: 20,
            transform: `perspective(1200px) rotateX(${(1 - urlIn) * 50}deg) translateY(${(1 - urlIn) * 120}px) scale(${click ? 0.96 : 1})`,
            opacity: urlIn,
          }}
        >
          <div style={{ display: "flex", gap: 8 }}>
            {[C.red, C.amber, C.green].map((c) => (
              <div key={c} style={{ width: 16, height: 16, borderRadius: 8, background: c }} />
            ))}
          </div>
          <span style={{ fontSize: 34 }}>🔒</span>
          <span style={{ flex: 1, fontFamily: MONO, fontWeight: 800, fontSize: 60, color: C.white }}>
            {url.slice(0, typed)}
            <span style={{ color: C.cyan, opacity: mod(f / 15, 2) === 0 ? 1 : 0 }}>|</span>
          </span>
          <span style={{ fontFamily: MONO, fontSize: 40, color: typed >= url.length ? C.cyan : C.muted }}>↵</span>
          {/* cursor */}
          {f >= sec(48.6) && (
            <div style={{ position: "absolute", right: 30 + interpolate(f, [sec(48.6), sec(49.2)], [200, 0], { ...clamp, easing: EXPO_OUT }), top: 60, fontSize: 56, transform: `scale(${click ? 0.85 : 1})` }}>👆</div>
          )}
          {click && <div style={{ position: "absolute", right: 30, top: 40, width: 80, height: 80, borderRadius: 40, border: `4px solid ${C.cyan}`, transform: `scale(${1 + (f - sec(49.2)) / 8})`, opacity: 1 - (f - sec(49.2)) / 24 }} />}
        </div>
      )}

      {/* OR + comment box */}
      {f >= sec(50.24) && (
        <div style={{ position: "absolute", top: 940, width: "100%", textAlign: "center", fontFamily: MONO, fontSize: 30, letterSpacing: 10, color: C.muted, opacity: boxIn }}>— ИЛИ —</div>
      )}
      {f >= sec(50.6) && (
        <div style={{ position: "absolute", top: 1000, width: "100%", textAlign: "center", transform: `scale(${sp(f, sec(50.6), fps, { damping: 8, stiffness: 240, mass: 0.5 }) * pulse})` }}>
          <span
            style={{
              display: "inline-block",
              padding: "24px 54px",
              borderRadius: 28,
              background: `linear-gradient(135deg, ${C.pink}, ${C.amber})`,
              color: "#0a0a0a",
              fontFamily: SANS,
              fontWeight: 900,
              fontSize: 88,
              letterSpacing: -2,
              boxShadow: `0 0 ${50 + Math.abs(Math.sin(f / 9)) * 50}px ${C.pink}`,
            }}
          >
            НАПИШИ «БОТ»
          </span>
        </div>
      )}
      {f >= sec(51.14) && (
        <div
          style={{
            position: "absolute",
            left: 100,
            right: 100,
            top: 1190,
            padding: "18px 24px",
            borderRadius: 22,
            background: C.panel,
            border: `2px solid ${C.border}`,
            display: "flex",
            alignItems: "center",
            gap: 18,
            opacity: sp(f, sec(51.14), fps),
          }}
        >
          <div style={{ width: 60, height: 60, borderRadius: 30, background: `linear-gradient(135deg, ${C.pink}, ${C.cyan})` }} />
          <div style={{ flex: 1, fontFamily: SANS }}>
            <div style={{ fontSize: 20, color: C.muted, fontWeight: 600 }}>Добавьте комментарий…</div>
            <div style={{ fontSize: 42, color: C.white, fontWeight: 900 }}>
              {comment.slice(0, ctyped)}
              <span style={{ color: C.pink, opacity: mod(f / 15, 2) === 0 ? 1 : 0 }}>|</span>
            </div>
          </div>
          <div style={{ padding: "10px 20px", borderRadius: 14, background: ctyped >= comment.length ? C.pink : "rgba(255,255,255,0.08)", color: "#0a0a0a", fontWeight: 900, fontSize: 28 }}>➤</div>
        </div>
      )}
      {/* floating comment chips */}
      {Array.from({ length: 12 }).map((_, i) => {
        const at = sec(51.9) + i * 8;
        if (f < at) return null;
        const tt = f - at;
        const left = i % 2 === 0 ? 40 + rand(i) * 140 : 760 + rand(i) * 120;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left,
              top: 1300 - tt * 3.4,
              padding: "8px 16px",
              borderRadius: 999,
              background: "rgba(255,46,136,0.15)",
              border: `2px solid ${C.pink}`,
              fontFamily: SANS,
              fontWeight: 800,
              fontSize: 24,
              color: C.white,
              opacity: interpolate(tt, [0, 10, 100, 130], [0, 1, 1, 0], clamp),
            }}
          >
            {["бот 🤖", "БОТ", "бот!", "бот 🔥", "Бот"][mod(i, 5)]}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// -------------------------------------------------------------------------
// Kinetic subtitles (karaoke + amber keywords)
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
        bottom: 220,
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
              background: key && on ? C.amber : "transparent",
              fontFamily: SANS,
              fontSize: 78,
              fontWeight: 900,
              textTransform: w.word.includes(".com") ? "none" : "uppercase",
              letterSpacing: -1,
              color: key && on ? "#0a0a0a" : on ? C.white : "rgba(248,250,252,0.4)",
              transform: `scale(${active ? 1 + 0.1 * wp : 1})`,
              boxShadow: key && on ? "0 0 40px rgba(255,176,32,0.6)" : "none",
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
  return <AbsoluteFill style={{ background: C.pink, opacity: o, mixBlendMode: "screen" }} />;
};

// -------------------------------------------------------------------------
// Root composition
// -------------------------------------------------------------------------
export const Gta6BotReel: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const cam = useCamera(f, fps);

  return (
    <AbsoluteFill style={{ backgroundColor: C.bg, overflow: "hidden" }}>
      <Audio src={staticFile("gta6_bot_reel/voice.mp3")} />
      <Background f={f} />
      <AbsoluteFill style={{ perspective: 2200 }}>
        <AbsoluteFill
          style={{
            transform: `translate(${cam.dx}px, ${cam.dy}px) scale(${cam.zoom}) rotateX(${cam.tiltX}deg) rotateY(${cam.tiltY}deg)`,
            transformStyle: "preserve-3d",
          }}
        >
          <SceneHook f={f} fps={fps} />
          <SceneLaunch f={f} fps={fps} />
          <SceneChat f={f} fps={fps} />
          <SceneClip f={f} fps={fps} />
          <SceneAward f={f} fps={fps} />
          <SceneCta f={f} fps={fps} />
        </AbsoluteFill>
      </AbsoluteFill>
      <HUD f={f} />
      <CutFlash f={f} />
      <Subtitles f={f} fps={fps} />
    </AbsoluteFill>
  );
};
