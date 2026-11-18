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
import wordsData from "../public/frankenstein_reel/words.json";

/*
 * =========================================================================
 * FRANKENSTEIN CLUSTER REEL — 1080x1920 @ 60 FPS, 4200 FRAMES (70s)
 *
 *   01  0.0 –  2.8s : Hook — "ВСЕ ГОВОРЯТ: ДЛЯ ЛОКАЛЬНОГО ИИ…" + myth bubbles
 *   02  2.8 –  5.0s : $5,000 PC price tag → red strike + "НЕ НУЖНО" stamp
 *   03  5.0 –  7.3s : "А ЧТО, ЕСЛИ СКРЕСТИТЬ?" + lightning (Project Frankenstein)
 *   04  7.3 –  9.3s : 3D MacBook card — 8 GB
 *   05  9.3 – 11.1s : + 3D iPhone card — 12 GB → "= 20 GB"
 *   06 11.1 – 14.6s : "БОЛЬШИНСТВО НЕ ДОГАДЫВАЕТСЯ" — crowd of question marks
 *   07 14.6 – 17.6s : Pulsing NPU neural chip + TOPS counter
 *   08 17.6 – 21.2s : 90% idle gauge "ПРОСТАИВАЕТ"
 *   09 21.2 – 23.6s : 4-step scheme overview (2x2 cards)
 *   10 23.6 – 29.7s : 01 SERVER — model loads into iPhone RAM
 *   11 29.7 – 36.1s : 02 WI-FI / USB — Mac ⇄ iPhone data beam
 *   12 36.1 – 39.8s : 03 Mac renders / codes (CPU free)
 *   13 39.8 – 45.5s : Live terminal → OpenAI-compatible API on iPhone IP
 *   14 45.5 – 52.4s : 04 GLOBAL TUNNEL — rotating globe + pins
 *   15 52.4 – 58.0s : "0 ₽ / 0 ЛИМИТОВ" counter + privacy + no-cloud
 *   16 58.0 – 62.9s : 2026 glitch slam + "САМОЕ ДОРОГОЕ ЖЕЛЕЗО" strike
 *   17 62.9 – 64.9s : "САМАЯ ХИТРАЯ СВЯЗКА" Mac ⚡ iPhone
 *   18 64.9 – 70.0s : CTA — НАПИШИ «КЛАСТЕР» + comment typing
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
  muted: "#64748b",
  panel: "rgba(14,16,24,0.94)",
  border: "rgba(250,204,21,0.35)",
};

const SANS = "'Inter', 'SF Pro Display', -apple-system, 'Helvetica Neue', Arial, sans-serif";
const MONO = "'JetBrains Mono', 'SF Mono', Menlo, Consolas, monospace";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const EXPO_OUT = Easing.bezier(0.16, 1, 0.3, 1);
const sec = (s: number) => Math.round(s * FPS);

/** Safe modulo — always returns 0..m-1, even for negative n. */
const mod = (n: number, m: number) => ((Math.floor(n) % m) + m) % m;

const rand = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
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
  hook: win(0, 2.8),
  price: win(2.8, 5.0),
  cross: win(5.0, 7.3),
  mac: win(7.3, 9.3),
  iphone: win(9.3, 11.1),
  secret: win(11.1, 14.6),
  npu: win(14.6, 17.6),
  idle: win(17.6, 21.2),
  scheme: win(21.2, 23.6),
  step1: win(23.6, 29.7),
  step2: win(29.7, 36.1),
  step3: win(36.1, 39.8),
  term: win(39.8, 45.5),
  step4: win(45.5, 52.4),
  zero: win(52.4, 58.0),
  y2026: win(58.0, 62.9),
  combo: win(62.9, 64.9),
  cta: win(64.9, 70.0),
};
const CUTS = Object.values(SC).map((s) => s[0]).filter((x) => x > 0);

// -------------------------------------------------------------------------
// Words → subtitle chunks (with ASR fixes: "и и" → ИИ, "к ластер" → кластер…)
// -------------------------------------------------------------------------
type Word = { word: string; start: number; end: number };

const WORDS: Word[] = (() => {
  const src = wordsData as Word[];
  const out: Word[] = [];
  const MERGE: [string, string, string][] = [
    ["и", "и", "ИИ"],
    ["к", "ластер", "кластер"],
    ["по", "шаговую", "пошаговую"],
  ];
  for (let i = 0; i < src.length; i++) {
    const w = src[i];
    const n = src[i + 1];
    if (n) {
      const m = MERGE.find(([a, b]) => w.word.toLowerCase() === a && n.word.toLowerCase() === b);
      if (m) {
        out.push({ word: m[2], start: w.start, end: n.end });
        i++;
        continue;
      }
      if (n.word.startsWith("-")) {
        out.push({ word: w.word + n.word, start: w.start, end: n.end });
        i++;
        continue;
      }
    }
    out.push({
      ...w,
      word: w.word.replace(/^Прекручиваешь/, "Прикручиваешь").replace(/^нейра-чип/, "нейрочип"),
    });
  }
  return out.map((w) => ({ ...w, word: w.word.replace(/^нейра-чип/, "нейрочип") }));
})();

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
  /^ИИ$|тысяч|доллар|^5$|скрестить|^Mac$|^8$|^12|iPhone|нейрочип|^90$|^%$|четырех|шаг|сервер|модель|Wi-Fi|кабель|^IP$|туннель|кластер|Ноль|лимит|приватн|облака|2026|хитрая|связка/i;

// -------------------------------------------------------------------------
// Camera — punch every 1.25s
// -------------------------------------------------------------------------
const BEATS = Array.from({ length: 58 }, (_, i) => Math.round(i * 1.25 * FPS) + 10);

const useCamera = (f: number, fps: number) => {
  let zoom = 1;
  let tiltX = 0;
  let tiltY = 0;
  BEATS.forEach((b, i) => {
    if (f < b || f > b + 70) return;
    const s = spring({ frame: f - b, fps, config: { damping: 13, stiffness: 210, mass: 0.5 } });
    const pulse = s * interpolate(f - b, [0, 55], [1, 0], clamp);
    zoom += 0.055 * pulse;
    tiltY += (i % 2 === 0 ? 1 : -1) * 4 * pulse;
    tiltX += (i % 3 === 0 ? -2.5 : 2) * pulse;
  });
  const t = f / fps;
  tiltX += Math.sin(t * 0.7) * 1.4;
  tiltY += Math.cos(t * 0.5) * 2;
  return { zoom, tiltX, tiltY, dx: Math.sin(t * 0.43) * 10, dy: Math.cos(t * 0.37) * 8 };
};

// -------------------------------------------------------------------------
// Background — electric grid + bokeh sparks
// -------------------------------------------------------------------------
const Background: React.FC<{ f: number }> = ({ f }) => {
  const t = f / FPS;
  const gx = 540 + Math.sin(t * 0.4) * 140;
  const gy = 800 + Math.cos(t * 0.3) * 100;
  const electric = f >= SC.cross[0] && f < SC.iphone[1] ? 1 : 0;
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at ${gx}px ${gy}px, rgba(250,204,21,0.14) 0%, rgba(250,204,21,0.04) 32%, transparent 60%)`,
        }}
      />
      <AbsoluteFill
        style={{
          opacity: 0.6 + electric * 0.4,
          background: "radial-gradient(circle at 85% 12%, rgba(34,211,238,0.14) 0%, transparent 42%)",
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
            "linear-gradient(rgba(34,211,238,0.10) 2px, transparent 2px), linear-gradient(90deg, rgba(34,211,238,0.10) 2px, transparent 2px)",
          backgroundSize: "90px 90px",
          backgroundPosition: `0px ${mod(f * 2, 90)}px`,
          maskImage: "linear-gradient(to bottom, rgba(0,0,0,0.9), transparent 75%)",
          WebkitMaskImage: "linear-gradient(to bottom, rgba(0,0,0,0.9), transparent 75%)",
        }}
      />
      {Array.from({ length: 30 }).map((_, i) => {
        const x = rand(i) * 1080;
        const y = mod(rand(i + 50) * 1920 - f * (0.4 + rand(i + 9) * 0.8), 1920);
        const size = 4 + rand(i + 3) * 14;
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
              background: i % 3 === 0 ? C.cyan : C.yellow,
              opacity: 0.1 + rand(i + 11) * 0.25,
              filter: `blur(${rand(i + 7) * 6}px)`,
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

const Strike: React.FC<{ f: number; at: number; color?: string; width?: number }> = ({
  f,
  at,
  color = C.red,
  width = 108,
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
        transform: "rotate(-6deg)",
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

const StepChip: React.FC<{ f: number; fps: number; at: number; n: string; title: string; color?: string }> = ({
  f,
  fps,
  at,
  n,
  title,
  color = C.yellow,
}) => {
  const s = sp(f, at, fps);
  const s2 = sp(f, at + 8, fps);
  return (
    <div style={{ position: "absolute", top: 170, width: "100%", textAlign: "center", fontFamily: SANS }}>
      <div
        style={{
          display: "inline-block",
          fontFamily: MONO,
          fontSize: 34,
          fontWeight: 800,
          color: "#0a0a0a",
          background: color,
          padding: "10px 26px",
          borderRadius: 12,
          letterSpacing: 4,
          transform: `scale(${s}) rotate(${(1 - s) * -12}deg)`,
          boxShadow: `0 0 40px ${color}99`,
        }}
      >
        ШАГ {n}
      </div>
      <div
        style={{
          marginTop: 22,
          fontSize: 88,
          fontWeight: 900,
          color: C.white,
          letterSpacing: -2,
          lineHeight: 1.02,
          opacity: s2,
          transform: `translateY(${(1 - s2) * 50}px)`,
          textShadow: "0 10px 40px rgba(0,0,0,0.8)",
        }}
      >
        {title}
      </div>
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
}> = ({ f, fps, at, x, y, w, h, rotY, rotX = 10, children, accent = C.yellow }) => {
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
        opacity: interpolate(s, [0, 0.3], [0, 1], clamp),
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
          padding: 26,
          boxSizing: "border-box",
          overflow: "hidden",
          fontFamily: SANS,
        }}
      >
        {children}
      </div>
    </div>
  );
};

/** Soft floor shadow for floating 3D objects. */
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

// -------------------------------------------------------------------------
// 3D devices
// -------------------------------------------------------------------------
const MacBook3D: React.FC<{
  f: number;
  w?: number;
  rotY?: number;
  screen: React.ReactNode;
  accent?: string;
}> = ({ f, w = 760, rotY = -14, screen, accent = C.yellow }) => {
  const h = w * 0.62;
  const sway = Math.sin(f / 40) * 6;
  return (
    <div style={{ width: w, height: h + 70, perspective: 1600 }}>
      <div style={{ transformStyle: "preserve-3d", transform: `rotateY(${rotY + sway}deg) rotateX(12deg)` }}>
        <div
          style={{
            width: w,
            height: h,
            borderRadius: 26,
            background: "linear-gradient(160deg, #1f2330, #0c0e14)",
            border: `3px solid ${accent}`,
            boxShadow: `0 0 50px ${accent}66, 0 50px 90px rgba(0,0,0,0.7)`,
            padding: 22,
            boxSizing: "border-box",
          }}
        >
          <div
            style={{
              width: "100%",
              height: "100%",
              borderRadius: 12,
              background: "#07090e",
              overflow: "hidden",
              position: "relative",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            {screen}
          </div>
        </div>
        <div
          style={{
            width: w * 1.12,
            marginLeft: -w * 0.06,
            height: 34,
            borderRadius: "0 0 30px 30px",
            background: "linear-gradient(180deg, #b8bec9, #5d6470)",
            transform: "rotateX(-60deg)",
            transformOrigin: "top center",
            boxShadow: "0 30px 50px rgba(0,0,0,0.6)",
          }}
        />
      </div>
    </div>
  );
};

const IPhone3D: React.FC<{
  f: number;
  h?: number;
  rotY?: number;
  screen: React.ReactNode;
  accent?: string;
}> = ({ f, h = 720, rotY = 16, screen, accent = C.cyan }) => {
  const w = h * 0.49;
  const sway = Math.sin(f / 34) * 8;
  return (
    <div style={{ width: w, height: h, perspective: 1600 }}>
      <div
        style={{
          width: w,
          height: h,
          borderRadius: w * 0.17,
          background: "linear-gradient(150deg, #2b303c, #0b0d12)",
          border: `3px solid ${accent}`,
          boxShadow: `0 0 50px ${accent}77, 0 50px 90px rgba(0,0,0,0.7), inset 0 0 0 8px #000`,
          transform: `rotateY(${rotY + sway}deg) rotateX(6deg)`,
          padding: 14,
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            borderRadius: w * 0.13,
            background: "#06080d",
            overflow: "hidden",
            position: "relative",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 16,
              left: "50%",
              width: w * 0.34,
              height: 30,
              marginLeft: -w * 0.17,
              borderRadius: 15,
              background: "#000",
              zIndex: 2,
            }}
          />
          {screen}
        </div>
      </div>
    </div>
  );
};

const NpuChip: React.FC<{ f: number; size?: number; lit?: number; color?: string }> = ({
  f,
  size = 460,
  lit = 1,
  color = C.cyan,
}) => {
  const pulse = 0.5 + 0.5 * Math.sin(f / 8);
  const pins = 9;
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      {[0, 1, 2].map((r) => {
        const u = mod(f + r * 30, 90) / 90;
        return (
          <div
            key={r}
            style={{
              position: "absolute",
              inset: -u * size * 0.5,
              borderRadius: 60 + u * 120,
              border: `3px solid ${color}`,
              opacity: (1 - u) * 0.6 * lit,
            }}
          />
        );
      })}
      {(["top", "bottom", "left", "right"] as const).map((side) =>
        Array.from({ length: pins }).map((_, i) => {
          const along = size * 0.14 + (i * size * 0.72) / (pins - 1);
          const vertical = side === "top" || side === "bottom";
          return (
            <div
              key={side + i}
              style={{
                position: "absolute",
                width: vertical ? 14 : 44,
                height: vertical ? 44 : 14,
                borderRadius: 4,
                background: "linear-gradient(#e5c76b, #8a6d1f)",
                left: vertical ? along - 7 : side === "left" ? -36 : size - 8,
                top: vertical ? (side === "top" ? -36 : size - 8) : along - 7,
              }}
            />
          );
        }),
      )}
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: 40,
          background: "linear-gradient(145deg, #1a1f2b, #07090d)",
          border: `3px solid ${color}`,
          boxShadow: `0 0 ${40 + pulse * 80 * lit}px ${color}${lit > 0.5 ? "cc" : "44"}, inset 0 0 40px rgba(0,0,0,0.8)`,
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 12,
          padding: 46,
          boxSizing: "border-box",
        }}
      >
        {Array.from({ length: 16 }).map((_, i) => {
          const on = lit * (0.25 + 0.75 * (0.5 + 0.5 * Math.sin(f / 6 + i * 1.7)));
          return (
            <div
              key={i}
              style={{
                borderRadius: 10,
                background: `rgba(34,211,238,${0.08 + on * 0.6})`,
                boxShadow: `0 0 ${on * 26}px ${color}`,
                border: "1px solid rgba(34,211,238,0.4)",
              }}
            />
          );
        })}
      </div>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: MONO,
          fontSize: size * 0.13,
          fontWeight: 900,
          color: C.white,
          letterSpacing: 6,
          textShadow: `0 0 30px ${color}, 0 4px 10px #000`,
        }}
      >
        NPU
      </div>
    </div>
  );
};

const Terminal: React.FC<{
  f: number;
  start: number;
  lines: { t: string; c: string }[];
  title: string;
  speed?: number;
  fontSize?: number;
}> = ({ f, start, lines, title, speed = 2.6, fontSize = 28 }) => {
  const cursorOn = mod(f / 15, 2) === 0;
  let budget = Math.max(0, (f - start) * speed);
  return (
    <div
      style={{
        borderRadius: 24,
        background: C.panel,
        border: `2px solid ${C.border}`,
        boxShadow: "0 60px 120px rgba(0,0,0,0.7), 0 0 50px rgba(250,204,21,0.2)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          height: 60,
          display: "flex",
          alignItems: "center",
          padding: "0 24px",
          gap: 14,
          background: "rgba(255,255,255,0.04)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
          <div key={c} style={{ width: 20, height: 20, borderRadius: 10, background: c }} />
        ))}
        <div style={{ flex: 1, textAlign: "center", fontFamily: SANS, fontSize: 24, color: C.muted, marginRight: 80 }}>
          {title}
        </div>
      </div>
      <div style={{ padding: "26px 30px 32px", fontFamily: MONO, fontSize, lineHeight: 1.6, minHeight: 460 }}>
        {lines.map((l, i) => {
          if (budget <= 0) return null;
          const n = Math.min(l.t.length, Math.floor(budget));
          budget -= l.t.length + 6;
          const typing = n < l.t.length;
          return (
            <div key={i} style={{ color: l.c, whiteSpace: "pre" }}>
              {l.t.slice(0, n)}
              {typing && <span style={{ color: C.yellow, opacity: cursorOn ? 1 : 0 }}>▋</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const Bolt: React.FC<{ seed: number; f: number; x1: number; y1: number; x2: number; y2: number; color?: string }> = ({
  seed,
  f,
  x1,
  y1,
  x2,
  y2,
  color = C.cyan,
}) => {
  const k = Math.floor(f / 3);
  const segs = 9;
  const pts = Array.from({ length: segs + 1 }, (_, i) => {
    const u = i / segs;
    const jitter = i === 0 || i === segs ? 0 : (rand(seed * 31 + k * 7 + i) - 0.5) * 90;
    return `${x1 + (x2 - x1) * u + jitter},${y1 + (y2 - y1) * u + jitter * 0.4}`;
  }).join(" ");
  const flicker = rand(seed + k) > 0.35 ? 1 : 0.25;
  return (
    <polyline
      points={pts}
      fill="none"
      stroke={color}
      strokeWidth={6}
      strokeLinejoin="round"
      opacity={flicker}
      style={{ filter: `drop-shadow(0 0 14px ${color})` }}
    />
  );
};

// -------------------------------------------------------------------------
// 01 — Hook
// -------------------------------------------------------------------------
const MYTHS = [
  { t: "Нужна RTX 5090", x: 70, y: 1010, r: -7 },
  { t: "Минимум 128 GB RAM", x: 460, y: 1120, r: 6 },
  { t: "Только сервер", x: 120, y: 1240, r: 4 },
];

const SceneHook: React.FC<{ f: number; fps: number }> = ({ f, fps }) => {
  const op = sceneOpacity(f, SC.hook, 0, 8);
  if (op <= 0) return null;
  const shake = f < 14 ? (rand(f) - 0.5) * 30 : 0;
  return (
    <AbsoluteFill style={{ opacity: op, transform: `translateX(${shake}px)` }}>
      <Title top={260}>
        <Slam f={f} at={0} fps={fps} style={{ fontSize: 130 }}>
          ВСЕ ГОВОРЯТ:
        </Slam>
        <Slam f={f} at={sec(0.9)} fps={fps} style={{ fontSize: 96, marginTop: 20, letterSpacing: -1 }}>
          ДЛЯ ЛОКАЛЬНОГО
        </Slam>
        <div style={{ marginTop: 20 }}>
          {f >= sec(1.6) && (
            <Highlight f={f} at={sec(1.6)} size={220}>
              ИИ
            </Highlight>
          )}
        </div>
      </Title>
      {MYTHS.map((b, i) => {
        const at = sec(0.4) + i * 16;
        if (f < at) return null;
        const s = sp(f, at, fps, { damping: 11, stiffness: 200, mass: 0.6 });
        const fromX = i % 2 === 0 ? -700 : 700;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: b.x,
              top: b.y + Math.sin((f + i * 30) / 18) * 10,
              padding: "22px 34px",
              borderRadius: 30,
              background: "rgba(239,68,68,0.16)",
              border: `2px solid ${C.red}`,
              fontFamily: SANS,
              fontSize: 42,
              fontWeight: 800,
              color: C.white,
              whiteSpace: "nowrap",
              transform: `perspective(1000px) translateX(${(1 - s) * fromX}px) rotate(${b.r}deg) rotateY(${(1 - s) * 50}deg)`,
              boxShadow: "0 20px 50px rgba(0,0,0,0.6)",
              filter: "blur(1px)",
              opacity: 0.85,
            }}
          >
            {b.t}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// -------------------------------------------------------------------------
// 02 — $5,000 PC price tag crossed out
// -------------------------------------------------------------------------
const ScenePrice: React.FC<{ f: number; fps: number }> = ({ f, fps }) => {
  const op = sceneOpacity(f, SC.price);
  if (op <= 0) return null;
  const a = SC.price[0];
  const lf = f - a;
  const pcIn = sp(f, a, fps, { damping: 12, stiffness: 140, mass: 0.8 });
  const tagIn = sp(f, a + 20, fps, { damping: 8, stiffness: 160, mass: 0.6 });
  const swing = Math.sin(Math.max(0, lf) / 9) * 10 * interpolate(lf, [20, 120], [1, 0.3], clamp);
  const price = interpolate(lf, [20, sec(1.0)], [0, 5000], { ...clamp, easing: EXPO_OUT });
  const strikeAt = sec(4.15);
  const stamp = sp(f, sec(4.4), fps, { damping: 9, stiffness: 260, mass: 0.6 });
  return (
    <AbsoluteFill style={{ opacity: op }}>
      <Title top={170}>
        <div style={{ fontSize: 80, color: C.muted, letterSpacing: -1 }}>«НУЖЕН КОМП ЗА…»</div>
      </Title>
      {/* PC tower */}
      <div
        style={{
          position: "absolute",
          left: 260,
          top: 420,
          width: 420,
          height: 720,
          perspective: 1400,
          transform: `translateY(${(1 - pcIn) * 500}px)`,
          opacity: pcIn,
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            borderRadius: 30,
            background: "linear-gradient(160deg, #1e2230, #090b10)",
            border: "3px solid rgba(239,68,68,0.6)",
            boxShadow: "0 0 60px rgba(239,68,68,0.3), 0 60px 100px rgba(0,0,0,0.7)",
            transform: `rotateY(-22deg) rotateX(6deg)`,
            padding: 34,
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "column",
            gap: 22,
          }}
        >
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                height: 170,
                borderRadius: "50%",
                border: `6px solid rgba(239,68,68,${0.4 + 0.3 * Math.sin(f / 4 + i)})`,
                boxShadow: "0 0 30px rgba(239,68,68,0.5)",
                transform: `rotate(${f * 12 + i * 40}deg)`,
                background:
                  "conic-gradient(from 0deg, rgba(239,68,68,0.3), transparent 25%, rgba(239,68,68,0.3) 50%, transparent 75%)",
              }}
            />
          ))}
          <div style={{ fontFamily: MONO, color: C.red, fontSize: 28, textAlign: "center" }}>RTX · 128GB · 1600W</div>
        </div>
      </div>
      <FloorShadow x={470} y={1150} w={460} f={f} />
      {/* Price tag */}
      <div
        style={{
          position: "absolute",
          left: 520,
          top: 520,
          transformOrigin: "20px 0px",
          transform: `rotate(${-14 + swing}deg) scale(${tagIn})`,
        }}
      >
        <div style={{ width: 4, height: 90, background: C.muted, marginLeft: 18 }} />
        <div
          style={{
            position: "relative",
            padding: "30px 50px",
            borderRadius: 24,
            background: C.yellow,
            color: "#0a0a0a",
            fontFamily: SANS,
            fontWeight: 900,
            fontSize: 140,
            letterSpacing: -4,
            boxShadow: "0 30px 70px rgba(0,0,0,0.6), 0 0 60px rgba(250,204,21,0.5)",
          }}
        >
          ${Math.round(price).toLocaleString("en-US")}
          <div style={{ fontSize: 34, letterSpacing: 2, marginTop: -6 }}>GAMING / AI PC</div>
          <Strike f={f} at={strikeAt} />
        </div>
      </div>
      {f >= sec(4.4) && (
        <div
          style={{
            position: "absolute",
            top: 1180,
            width: "100%",
            textAlign: "center",
            transform: `scale(${2.4 - stamp * 1.4}) rotate(-8deg)`,
            opacity: interpolate(stamp, [0, 0.3], [0, 1], clamp),
          }}
        >
          <span
            style={{
              display: "inline-block",
              border: `8px solid ${C.red}`,
              color: C.red,
              padding: "6px 36px",
              borderRadius: 16,
              fontFamily: SANS,
              fontWeight: 900,
              fontSize: 96,
              letterSpacing: 4,
              textShadow: "0 0 30px rgba(239,68,68,0.6)",
              background: "rgba(5,6,10,0.7)",
            }}
          >
            НЕ НУЖЕН
          </span>
        </div>
      )}
    </AbsoluteFill>
  );
};

// -------------------------------------------------------------------------
// 03 — "А ЧТО, ЕСЛИ СКРЕСТИТЬ?" + lightning
// -------------------------------------------------------------------------
const SceneCross: React.FC<{ f: number; fps: number }> = ({ f, fps }) => {
  const op = sceneOpacity(f, SC.cross);
  if (op <= 0) return null;
  const a = SC.cross[0];
  const flash = rand(Math.floor(f / 3)) > 0.82 ? 0.25 : 0;
  return (
    <AbsoluteFill style={{ opacity: op }}>
      <AbsoluteFill style={{ background: C.cyan, opacity: flash, mixBlendMode: "screen" }} />
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <Bolt seed={1} f={f} x1={120} y1={120} x2={420} y2={760} />
        <Bolt seed={2} f={f} x1={980} y1={140} x2={660} y2={780} color={C.yellow} />
        {f > a + 40 && <Bolt seed={3} f={f} x1={540} y1={60} x2={540} y2={520} />}
      </svg>
      <div
        style={{
          position: "absolute",
          top: 360,
          width: "100%",
          textAlign: "center",
          fontFamily: MONO,
          fontSize: 34,
          letterSpacing: 8,
          color: C.cyan,
          opacity: sp(f, a, fps),
        }}
      >
        ▲ ПРОЕКТ: FRANKENSTEIN
      </div>
      <Title top={470}>
        <Slam f={f} at={a + 4} fps={fps} style={{ fontSize: 120 }}>
          А ЧТО, ЕСЛИ
        </Slam>
        <div style={{ marginTop: 30 }}>
          {f >= sec(5.9) && (
            <Highlight f={f} at={sec(5.9)} size={150} color={C.cyan}>
              СКРЕСТИТЬ?
            </Highlight>
          )}
        </div>
      </Title>
      {f >= sec(6.4) && (
        <div
          style={{
            position: "absolute",
            top: 1000,
            width: "100%",
            display: "flex",
            justifyContent: "center",
            gap: 40,
            fontFamily: SANS,
            fontWeight: 900,
            fontSize: 64,
            color: C.white,
          }}
        >
          {["MAC", "⚡", "IPHONE"].map((t, i) => {
            const s = sp(f, sec(6.4) + i * 8, fps, { damping: 9, stiffness: 240, mass: 0.5 });
            return (
              <div
                key={t}
                style={{
                  transform: `scale(${s}) translateY(${(1 - s) * 60}px)`,
                  padding: i === 1 ? 0 : "16px 30px",
                  borderRadius: 20,
                  border: i === 1 ? "none" : `3px solid ${i === 0 ? C.yellow : C.cyan}`,
                  color: i === 1 ? C.yellow : C.white,
                  background: i === 1 ? "transparent" : C.panel,
                }}
              >
                {t}
              </div>
            );
          })}
        </div>
      )}
    </AbsoluteFill>
  );
};

// -------------------------------------------------------------------------
// 04 — 3D MacBook 8GB
// -------------------------------------------------------------------------
const MacScreen8: React.FC<{ f: number; start: number }> = ({ f, start }) => {
  const lf = Math.max(0, f - start);
  const used = interpolate(lf, [10, 70], [0, 0.94], { ...clamp, easing: EXPO_OUT });
  return (
    <div style={{ padding: 30, fontFamily: MONO, color: C.white }}>
      <div style={{ fontSize: 26, color: C.muted }}>MacBook Air · M1 · 2020</div>
      <div style={{ fontSize: 150, fontWeight: 900, fontFamily: SANS, color: C.yellow, lineHeight: 1.05, textShadow: "0 0 40px rgba(250,204,21,0.6)" }}>
        8 GB
      </div>
      <div style={{ fontSize: 24, color: C.muted, marginBottom: 10 }}>MEMORY PRESSURE</div>
      <div style={{ height: 30, borderRadius: 15, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
        <div
          style={{
            width: `${used * 100}%`,
            height: "100%",
            background: `linear-gradient(90deg, ${C.green}, ${C.yellow}, ${C.red})`,
          }}
        />
      </div>
    </div>
  );
};

const SceneMac: React.FC<{ f: number; fps: number }> = ({ f, fps }) => {
  const op = sceneOpacity(f, SC.mac);
  if (op <= 0) return null;
  const a = SC.mac[0];
  const s = sp(f, a, fps, { damping: 12, stiffness: 130, mass: 0.8 });
  return (
    <AbsoluteFill style={{ opacity: op }}>
      <Title top={180}>
        <Slam f={f} at={a} fps={fps} style={{ fontSize: 110 }}>
          СТАРЫЙ MAC
        </Slam>
        <Slam f={f} at={sec(7.66)} fps={fps} style={{ fontSize: 64, color: C.muted, letterSpacing: 0, marginTop: 10 }}>
          ВСЕГО НА 8 ГИГАБАЙТ
        </Slam>
      </Title>
      <div
        style={{
          position: "absolute",
          left: 160,
          top: 560,
          transform: `translateY(${(1 - s) * 700}px) rotateZ(${(1 - s) * -10}deg)`,
          opacity: s,
        }}
      >
        <MacBook3D f={f} screen={<MacScreen8 f={f} start={a} />} />
      </div>
      <FloorShadow x={540} y={1130} w={760} f={f} />
    </AbsoluteFill>
  );
};

// -------------------------------------------------------------------------
// 05 — + 3D iPhone 12GB → = 20GB
// -------------------------------------------------------------------------
const PhoneScreen12: React.FC = () => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: SANS,
      background: "radial-gradient(circle at 50% 40%, rgba(34,211,238,0.25), transparent 70%)",
    }}
  >
    <div style={{ fontFamily: MONO, fontSize: 22, color: C.muted }}>iPhone · A18 Pro</div>
    <div style={{ fontSize: 110, fontWeight: 900, color: C.cyan, lineHeight: 1, textShadow: "0 0 40px rgba(34,211,238,0.8)" }}>
      12
    </div>
    <div style={{ fontSize: 46, fontWeight: 900, color: C.white }}>GB RAM</div>
  </div>
);

const SceneIphone: React.FC<{ f: number; fps: number }> = ({ f, fps }) => {
  const op = sceneOpacity(f, SC.iphone);
  if (op <= 0) return null;
  const a = SC.iphone[0];
  const ph = sp(f, a, fps, { damping: 11, stiffness: 150, mass: 0.7 });
  const plus = sp(f, a + 14, fps, { damping: 8, stiffness: 260, mass: 0.5 });
  const total = sp(f, sec(10.4), fps, { damping: 9, stiffness: 240, mass: 0.5 });
  return (
    <AbsoluteFill style={{ opacity: op }}>
      <Card3D f={f} fps={fps} at={a - 6} x={40} y={420} w={430} h={300} rotY={18} accent={C.yellow}>
        <div style={{ fontFamily: MONO, fontSize: 24, color: C.muted }}>OLD MAC</div>
        <div style={{ fontSize: 120, fontWeight: 900, color: C.yellow, lineHeight: 1.1 }}>8 GB</div>
        <div style={{ fontSize: 28, color: C.white, fontWeight: 700 }}>M1 · пылится на столе</div>
      </Card3D>
      <div
        style={{
          position: "absolute",
          left: 560,
          top: 340,
          transform: `translateX(${(1 - ph) * 600}px) rotate(${(1 - ph) * 25}deg)`,
          opacity: ph,
        }}
      >
        <IPhone3D f={f} h={720} rotY={-18} screen={<PhoneScreen12 />} />
      </div>
      <FloorShadow x={740} y={1080} w={360} f={f} />
      <div
        style={{
          position: "absolute",
          left: 420,
          top: 640,
          fontFamily: SANS,
          fontWeight: 900,
          fontSize: 200,
          color: C.white,
          transform: `scale(${plus}) rotate(${(1 - plus) * 180}deg)`,
          textShadow: "0 0 50px rgba(250,204,21,0.8)",
        }}
      >
        +
      </div>
      {f >= sec(10.4) && (
        <div
          style={{
            position: "absolute",
            top: 1150,
            width: "100%",
            textAlign: "center",
            transform: `scale(${2 - total})`,
            opacity: total,
          }}
        >
          <Highlight f={f} at={sec(10.4)} size={110}>
            = 20 GB КЛАСТЕР
          </Highlight>
        </div>
      )}
    </AbsoluteFill>
  );
};

// -------------------------------------------------------------------------
// 06 — Most people don't know
// -------------------------------------------------------------------------
const SceneSecret: React.FC<{ f: number; fps: number }> = ({ f, fps }) => {
  const op = sceneOpacity(f, SC.secret);
  if (op <= 0) return null;
  const a = SC.secret[0];
  const lf = f - a;
  const reveal = interpolate(f, [sec(13.3), sec(14.0)], [0, 1], clamp);
  return (
    <AbsoluteFill style={{ opacity: op }}>
      <Title top={170}>
        <Slam f={f} at={a} fps={fps} style={{ fontSize: 108 }}>
          БОЛЬШИНСТВО
        </Slam>
        <Slam f={f} at={sec(11.8)} fps={fps} style={{ fontSize: 76, letterSpacing: -1, marginTop: 10 }}>
          ДАЖЕ НЕ
        </Slam>
        <div style={{ marginTop: 12 }}>
          {f >= sec(12.3) && (
            <Highlight f={f} at={sec(12.3)} size={92} color={C.red}>
              ДОГАДЫВАЕТСЯ
            </Highlight>
          )}
        </div>
      </Title>
      {Array.from({ length: 24 }).map((_, i) => {
        const col = i % 6;
        const row = Math.floor(i / 6);
        const at = a + 6 + i * 2;
        const s = sp(f, at, fps, { damping: 12, stiffness: 220, mass: 0.5 });
        const isOne = i === 15;
        const x = 120 + col * 150 + (row % 2) * 40;
        const y = 720 + row * 150;
        const color = isOne && reveal > 0 ? C.yellow : "rgba(148,163,184,0.5)";
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y + Math.sin((lf + i * 13) / 14) * 6,
              width: 100,
              transform: `scale(${s * (isOne ? 1 + reveal * 0.5 : 1 - reveal * 0.15)})`,
              opacity: isOne ? 1 : 1 - reveal * 0.6,
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontFamily: SANS,
                fontWeight: 900,
                fontSize: 40,
                color: isOne && reveal > 0 ? C.yellow : C.muted,
                opacity: mod(lf / 20 + i, 3) === 0 ? 1 : 0.5,
              }}
            >
              {isOne && reveal > 0 ? "!" : "?"}
            </div>
            <div style={{ width: 44, height: 44, borderRadius: 22, background: color, margin: "0 auto" }} />
            <div style={{ width: 80, height: 50, borderRadius: "40px 40px 10px 10px", background: color, margin: "6px auto 0" }} />
          </div>
        );
      })}
      {reveal > 0 && (
        <div
          style={{
            position: "absolute",
            top: 1330,
            width: "100%",
            textAlign: "center",
            fontFamily: MONO,
            fontSize: 38,
            color: C.yellow,
            opacity: reveal,
            letterSpacing: 4,
          }}
        >
          ЧТО ВНУТРИ ТВОЕГО IPHONE →
        </div>
      )}
    </AbsoluteFill>
  );
};

// -------------------------------------------------------------------------
// 07 — Pulsing NPU chip
// -------------------------------------------------------------------------
const SceneNpu: React.FC<{ f: number; fps: number }> = ({ f, fps }) => {
  const op = sceneOpacity(f, SC.npu);
  if (op <= 0) return null;
  const a = SC.npu[0];
  const s = sp(f, a, fps, { damping: 11, stiffness: 120, mass: 0.8 });
  const tops = interpolate(f, [sec(15.8), sec(17.0)], [0, 35], { ...clamp, easing: EXPO_OUT });
  return (
    <AbsoluteFill style={{ opacity: op }}>
      <Title top={170}>
        <Slam f={f} at={a + 4} fps={fps} style={{ fontSize: 84, color: C.muted, letterSpacing: -1 }}>
          ВНУТРИ СТОИТ
        </Slam>
        <div style={{ marginTop: 14 }}>
          {f >= sec(15.8) && (
            <Highlight f={f} at={sec(15.8)} size={100} color={C.cyan}>
              НЕЙРОЧИП
            </Highlight>
          )}
        </div>
      </Title>
      <div
        style={{
          position: "absolute",
          left: 540 - 230,
          top: 600,
          transform: `perspective(1400px) rotateX(${18 + (1 - s) * 60}deg) rotateZ(${(1 - s) * 90 + Math.sin(f / 30) * 4}deg) scale(${s})`,
        }}
      >
        <NpuChip f={f} />
      </div>
      <FloorShadow x={540} y={1150} w={520} f={f} />
      {f >= sec(15.8) && (
        <div
          style={{
            position: "absolute",
            top: 1230,
            width: "100%",
            textAlign: "center",
            fontFamily: MONO,
            fontWeight: 800,
            fontSize: 60,
            color: C.white,
          }}
        >
          <span style={{ color: C.cyan, textShadow: "0 0 30px rgba(34,211,238,0.8)" }}>{tops.toFixed(0)}</span> TOPS
        </div>
      )}
    </AbsoluteFill>
  );
};

// -------------------------------------------------------------------------
// 08 — 90% idle gauge
// -------------------------------------------------------------------------
const SceneIdle: React.FC<{ f: number; fps: number }> = ({ f, fps }) => {
  const op = sceneOpacity(f, SC.idle);
  if (op <= 0) return null;
  const a = SC.idle[0];
  const lf = f - a;
  const pct = interpolate(f, [a + 10, sec(19.2)], [0, 90], { ...clamp, easing: EXPO_OUT });
  const R = 300;
  const circ = 2 * Math.PI * R;
  const s = sp(f, a, fps);
  return (
    <AbsoluteFill style={{ opacity: op }}>
      <Title top={170}>
        <Slam f={f} at={a} fps={fps} style={{ fontSize: 110, color: C.red, textShadow: "0 0 40px rgba(239,68,68,0.5)" }}>
          ПРОСТАИВАЕТ
        </Slam>
      </Title>
      <div style={{ position: "absolute", left: 540 - R - 30, top: 420, transform: `scale(${s})` }}>
        <svg width={(R + 30) * 2} height={(R + 30) * 2}>
          <circle cx={R + 30} cy={R + 30} r={R} stroke="rgba(255,255,255,0.08)" strokeWidth={44} fill="none" />
          <circle
            cx={R + 30}
            cy={R + 30}
            r={R}
            stroke={C.red}
            strokeWidth={44}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={circ * (1 - pct / 100)}
            transform={`rotate(-90 ${R + 30} ${R + 30})`}
            style={{ filter: "drop-shadow(0 0 20px rgba(239,68,68,0.8))" }}
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
            fontFamily: SANS,
          }}
        >
          <div style={{ fontSize: 220, fontWeight: 900, color: C.white, lineHeight: 1, letterSpacing: -8 }}>
            {Math.round(pct)}%
          </div>
          <div style={{ fontFamily: MONO, fontSize: 36, color: C.muted, letterSpacing: 6 }}>ВРЕМЕНИ</div>
        </div>
      </div>
      {["z", "Z", "z"].map((z, i) => {
        const u = mod(lf + i * 25, 75) / 75;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: 820 + u * 80,
              top: 500 - u * 160,
              fontFamily: SANS,
              fontWeight: 900,
              fontSize: 60 + i * 16,
              color: C.cyan,
              opacity: Math.sin(u * Math.PI),
            }}
          >
            {z}
          </div>
        );
      })}
      <div
        style={{
          position: "absolute",
          top: 1150,
          width: "100%",
          textAlign: "center",
          fontFamily: MONO,
          fontSize: 34,
          color: C.muted,
          opacity: interpolate(lf, [60, 90], [0, 1], clamp),
        }}
      >
        npu.utilization = <span style={{ color: C.red }}>idle</span>
      </div>
    </AbsoluteFill>
  );
};

// -------------------------------------------------------------------------
// 09 — 4-step scheme overview
// -------------------------------------------------------------------------
const STEPS = [
  { n: "01", t: "SERVER", d: "модель в памяти iPhone", c: C.yellow },
  { n: "02", t: "WI-FI / USB", d: "одна сеть", c: C.cyan },
  { n: "03", t: "LOCAL IP API", d: "запросы → телефон", c: C.green },
  { n: "04", t: "GLOBAL TUNNEL", d: "доступ отовсюду", c: C.purple },
];

const SceneScheme: React.FC<{ f: number; fps: number }> = ({ f, fps }) => {
  const op = sceneOpacity(f, SC.scheme);
  if (op <= 0) return null;
  const a = SC.scheme[0];
  return (
    <AbsoluteFill style={{ opacity: op }}>
      <Title top={170}>
        <Slam f={f} at={a} fps={fps} style={{ fontSize: 96 }}>
          СХЕМА ИЗ
        </Slam>
        <div style={{ marginTop: 10 }}>
          {f >= sec(22.3) && (
            <Highlight f={f} at={sec(22.3)} size={120}>
              4 ШАГОВ
            </Highlight>
          )}
        </div>
      </Title>
      {STEPS.map((s, i) => (
        <Card3D
          key={s.n}
          f={f}
          fps={fps}
          at={a + 14 + i * 9}
          x={60 + (i % 2) * 500}
          y={600 + Math.floor(i / 2) * 360}
          w={460}
          h={320}
          rotY={i % 2 ? -12 : 12}
          accent={s.c}
        >
          <div style={{ fontFamily: MONO, fontSize: 80, fontWeight: 900, color: s.c, lineHeight: 1 }}>{s.n}</div>
          <div style={{ fontSize: 46, fontWeight: 900, color: C.white, marginTop: 20 }}>{s.t}</div>
          <div style={{ fontSize: 28, color: C.muted, marginTop: 10 }}>{s.d}</div>
        </Card3D>
      ))}
    </AbsoluteFill>
  );
};

// -------------------------------------------------------------------------
// 10 — STEP 01: Server, model into memory
// -------------------------------------------------------------------------
const SceneStep1: React.FC<{ f: number; fps: number }> = ({ f, fps }) => {
  const op = sceneOpacity(f, SC.step1);
  if (op <= 0) return null;
  const a = SC.step1[0];
  const ph = sp(f, a + 6, fps, { damping: 12, stiffness: 140, mass: 0.7 });
  const serverOn = f >= sec(26.1);
  const load = interpolate(f, [sec(27.8), sec(29.3)], [0, 1], { ...clamp, easing: EXPO_OUT });
  const fileIn = sp(f, sec(27.8), fps, { damping: 12, stiffness: 160, mass: 0.6 });
  const fileFly = interpolate(f, [sec(28.4), sec(29.2)], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) });
  return (
    <AbsoluteFill style={{ opacity: op }}>
      <StepChip f={f} fps={fps} at={a} n="01" title="ЛОКАЛЬНЫЙ СЕРВЕР" />
      <div
        style={{
          position: "absolute",
          left: 380,
          top: 460,
          transform: `translateY(${(1 - ph) * 600}px)`,
          opacity: ph,
        }}
      >
        <IPhone3D
          f={f}
          h={700}
          rotY={-10}
          screen={
            <div style={{ padding: "70px 24px", fontFamily: MONO, fontSize: 20, color: C.white, lineHeight: 1.7 }}>
              <div style={{ color: C.muted }}>~ llm-server</div>
              <div style={{ color: serverOn ? C.green : C.muted }}>{serverOn ? "● RUNNING" : "○ starting…"}</div>
              <div>port: 8080</div>
              <div style={{ marginTop: 18, color: C.muted }}>MODEL IN RAM</div>
              <div style={{ height: 22, borderRadius: 11, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
                <div style={{ width: `${load * 100}%`, height: "100%", background: `linear-gradient(90deg, ${C.cyan}, ${C.yellow})` }} />
              </div>
              <div style={{ color: C.yellow, fontSize: 30, fontWeight: 900, marginTop: 8 }}>{Math.round(load * 100)}%</div>
              <div style={{ color: load >= 1 ? C.green : C.muted, marginTop: 6 }}>{load >= 1 ? "✓ ready" : ""}</div>
            </div>
          }
        />
      </div>
      <FloorShadow x={550} y={1170} w={360} f={f} />
      {serverOn && (
        <div
          style={{
            position: "absolute",
            left: 40,
            top: 560,
            padding: "18px 26px",
            borderRadius: 20,
            border: `2px solid ${C.green}`,
            background: C.panel,
            fontFamily: MONO,
            fontSize: 30,
            color: C.green,
            transform: `scale(${sp(f, sec(26.1), fps, { damping: 9, stiffness: 260, mass: 0.5 })})`,
            boxShadow: "0 0 30px rgba(34,197,94,0.4)",
          }}
        >
          SERVER: ON
        </div>
      )}
      {f >= sec(27.8) && fileFly < 1 && (
        <div
          style={{
            position: "absolute",
            left: interpolate(fileFly, [0, 1], [640, 500]),
            top: interpolate(fileFly, [0, 1], [700, 820]),
            padding: "22px 26px",
            borderRadius: 20,
            border: `2px solid ${C.yellow}`,
            background: C.panel,
            fontFamily: MONO,
            fontSize: 28,
            color: C.white,
            transform: `scale(${fileIn * (1 - fileFly * 0.8)}) rotate(${8 - fileFly * 30}deg)`,
            boxShadow: "0 20px 50px rgba(0,0,0,0.6), 0 0 30px rgba(250,204,21,0.4)",
            opacity: 1 - fileFly * 0.5,
          }}
        >
          <div style={{ color: C.yellow, fontWeight: 800 }}>▣ llama-3.2-3b</div>
          <div style={{ color: C.muted, fontSize: 22 }}>q4 · 2.0 GB · лёгкая</div>
        </div>
      )}
    </AbsoluteFill>
  );
};

// -------------------------------------------------------------------------
// 11 — STEP 02: Wi-Fi / USB link
// -------------------------------------------------------------------------
const SceneStep2: React.FC<{ f: number; fps: number }> = ({ f, fps }) => {
  const op = sceneOpacity(f, SC.step2);
  if (op <= 0) return null;
  const a = SC.step2[0];
  const lf = f - a;
  const mac = sp(f, sec(32.6), fps, { damping: 12, stiffness: 140, mass: 0.7 });
  const ph = sp(f, sec(31.8), fps, { damping: 12, stiffness: 140, mass: 0.7 });
  const link = interpolate(f, [sec(33.0), sec(33.6)], [0, 1], clamp);
  const usbMode = f >= sec(34.9);
  const x1 = 400;
  const x2 = 760;
  const y = 860;
  return (
    <AbsoluteFill style={{ opacity: op }}>
      <StepChip f={f} fps={fps} at={a} n="02" title="ОДНА СЕТЬ" color={C.cyan} />
      <div style={{ position: "absolute", left: 30, top: 640, transform: `translateX(${(1 - mac) * -700}px) scale(0.5)`, transformOrigin: "left top" }}>
        <MacBook3D
          f={f}
          rotY={18}
          screen={
            <div style={{ padding: 40, fontFamily: SANS, fontWeight: 900, fontSize: 90, color: C.yellow }}>
              MAC
              <div style={{ fontFamily: MONO, fontSize: 34, color: C.muted, fontWeight: 400 }}>192.168.1.10</div>
            </div>
          }
        />
      </div>
      <div style={{ position: "absolute", left: 760, top: 620, transform: `translateX(${(1 - ph) * 700}px)`, opacity: ph }}>
        <IPhone3D
          f={f}
          h={500}
          rotY={-18}
          screen={
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: MONO }}>
              <div style={{ fontSize: 34, color: C.cyan, fontWeight: 900 }}>iPhone</div>
              <div style={{ fontSize: 20, color: C.muted }}>192.168.1.42</div>
            </div>
          }
        />
      </div>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <line
          x1={x1}
          y1={y}
          x2={x1 + (x2 - x1) * link}
          y2={y}
          stroke={usbMode ? C.yellow : C.cyan}
          strokeWidth={usbMode ? 14 : 6}
          strokeDasharray={usbMode ? "0" : "18 14"}
          strokeDashoffset={-lf * 3}
          style={{ filter: `drop-shadow(0 0 14px ${usbMode ? C.yellow : C.cyan})` }}
        />
        {link >= 1 &&
          Array.from({ length: 5 }).map((_, i) => {
            const u = mod(lf * 1.6 + i * 24, 120) / 120;
            const dir = i % 2 === 0;
            return (
              <rect
                key={i}
                x={(dir ? x1 + (x2 - x1) * u : x2 - (x2 - x1) * u) - 14}
                y={y - 14}
                width={28}
                height={28}
                rx={6}
                fill={dir ? C.yellow : C.green}
                style={{ filter: "drop-shadow(0 0 10px #fff)" }}
              />
            );
          })}
      </svg>
      {/* Wi-Fi arcs */}
      {!usbMode && f >= sec(33.7) && (
        <div style={{ position: "absolute", left: 580 - 80, top: 640, width: 160, height: 140 }}>
          {[0, 1, 2].map((i) => {
            const p = 0.4 + 0.6 * Math.max(0, Math.sin(lf / 8 - i * 0.9));
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: 80 - (30 + i * 30),
                  top: 120 - (30 + i * 30),
                  width: (30 + i * 30) * 2,
                  height: (30 + i * 30) * 2,
                  borderRadius: "50%",
                  border: `8px solid ${C.cyan}`,
                  borderColor: `${C.cyan} transparent transparent transparent`,
                  transform: "rotate(0deg)",
                  opacity: p,
                }}
              />
            );
          })}
        </div>
      )}
      <div style={{ position: "absolute", top: 1180, width: "100%", display: "flex", justifyContent: "center", gap: 30 }}>
        {[
          { t: "Wi-Fi", on: f >= sec(34.0) && !usbMode, c: C.cyan },
          { t: "USB-C КАБЕЛЬ", on: usbMode, c: C.yellow },
        ].map((o) => (
          <div
            key={o.t}
            style={{
              padding: "18px 34px",
              borderRadius: 18,
              fontFamily: MONO,
              fontWeight: 800,
              fontSize: 36,
              color: o.on ? "#0a0a0a" : C.muted,
              background: o.on ? o.c : C.panel,
              border: `2px solid ${o.on ? o.c : "rgba(255,255,255,0.1)"}`,
              transform: `scale(${o.on ? 1.08 : 0.94})`,
              boxShadow: o.on ? `0 0 40px ${o.c}99` : "none",
            }}
          >
            {o.t}
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

// -------------------------------------------------------------------------
// 12 — STEP 03: Mac does heavy work
// -------------------------------------------------------------------------
const CODE = [
  "const scene = new Scene();",
  "render(scene, { fps: 60 });",
  "import { agent } from './ai';",
  "await build('--release');",
  "ffmpeg -i out.mov -c:v h264",
  "export default Reel;",
  "npm run render:4k",
  "git push origin main",
];

const SceneStep3: React.FC<{ f: number; fps: number }> = ({ f, fps }) => {
  const op = sceneOpacity(f, SC.step3);
  if (op <= 0) return null;
  const a = SC.step3[0];
  const lf = f - a;
  const s = sp(f, a + 4, fps, { damping: 12, stiffness: 140, mass: 0.7 });
  const render = interpolate(f, [sec(38.5), sec(39.7)], [0.12, 0.87], clamp);
  return (
    <AbsoluteFill style={{ opacity: op }}>
      <StepChip f={f} fps={fps} at={a} n="03" title="MAC ДЕЛАЕТ СВОЁ" color={C.green} />
      <div style={{ position: "absolute", left: 160, top: 520, transform: `translateY(${(1 - s) * 600}px)`, opacity: s }}>
        <MacBook3D
          f={f}
          rotY={-10}
          accent={C.green}
          screen={
            <div style={{ padding: 24, fontFamily: MONO, fontSize: 24, lineHeight: 1.55 }}>
              {Array.from({ length: 7 }).map((_, i) => {
                const idx = mod(i + lf / 9, CODE.length);
                return (
                  <div key={i} style={{ color: i % 3 === 0 ? C.green : i % 3 === 1 ? C.blue : C.white, whiteSpace: "nowrap" }}>
                    <span style={{ color: C.muted }}>{String(mod(i + lf / 9, 99) + 1).padStart(2, "0")} </span>
                    {CODE[idx]}
                  </div>
                );
              })}
              <div style={{ marginTop: 12, color: C.yellow }}>render.mp4 — {Math.round(render * 100)}%</div>
              <div style={{ height: 18, borderRadius: 9, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
                <div style={{ width: `${render * 100}%`, height: "100%", background: C.green }} />
              </div>
            </div>
          }
        />
      </div>
      <FloorShadow x={540} y={1100} w={760} f={f} />
      <div style={{ position: "absolute", top: 1170, width: "100%", display: "flex", justifyContent: "center", gap: 24 }}>
        {[
          { t: "КОД", at: sec(37.9) },
          { t: "РЕНДЕР ВИДЕО", at: sec(38.5) },
        ].map((o) =>
          f >= o.at ? (
            <div
              key={o.t}
              style={{
                padding: "16px 30px",
                borderRadius: 18,
                background: C.green,
                color: "#0a0a0a",
                fontFamily: SANS,
                fontWeight: 900,
                fontSize: 44,
                transform: `scale(${sp(f, o.at, fps, { damping: 9, stiffness: 260, mass: 0.5 })})`,
                boxShadow: "0 0 40px rgba(34,197,94,0.6)",
              }}
            >
              {o.t}
            </div>
          ) : null,
        )}
      </div>
    </AbsoluteFill>
  );
};

// -------------------------------------------------------------------------
// 13 — Live terminal → OpenAI-compatible API on the iPhone's IP
// -------------------------------------------------------------------------
const API_LINES = [
  { t: "$ export OPENAI_BASE_URL=\\", c: C.white },
  { t: "    http://192.168.1.42:8080/v1", c: C.cyan },
  { t: "$ python agent.py --task=routine", c: C.white },
  { t: "→ POST /v1/chat/completions", c: C.blue },
  { t: "  model: llama-3.2-3b  → iPhone", c: C.muted },
  { t: "✓ 200 OK   0.41s   512 tok", c: C.green },
  { t: "→ POST /v1/chat/completions", c: C.blue },
  { t: "✓ 200 OK   0.38s   347 tok", c: C.green },
  { t: "✓ cost: $0.00   limits: none", c: C.yellow },
];

const SceneTerm: React.FC<{ f: number; fps: number }> = ({ f, fps }) => {
  const op = sceneOpacity(f, SC.term);
  if (op <= 0) return null;
  const a = SC.term[0];
  const lf = f - a;
  const s = sp(f, a, fps, { damping: 13, stiffness: 160, mass: 0.7 });
  const reqs = Math.floor(interpolate(f, [sec(41.8), sec(45.3)], [0, 128], clamp));
  const ipOn = f >= sec(43.4);
  return (
    <AbsoluteFill style={{ opacity: op }}>
      <Title top={150}>
        <div style={{ fontSize: 66, letterSpacing: -1 }}>
          ЗАПРОСЫ →{" "}
          <span style={{ color: ipOn ? C.cyan : C.white, textShadow: ipOn ? "0 0 30px rgba(34,211,238,0.8)" : "none" }}>
            ЛОКАЛЬНЫЙ IP
          </span>
        </div>
      </Title>
      <div
        style={{
          position: "absolute",
          left: 50,
          right: 50,
          top: 290,
          transform: `perspective(1600px) rotateX(${(1 - s) * 40 + 6}deg) rotateY(-4deg) translateY(${(1 - s) * 400}px)`,
          opacity: s,
        }}
      >
        <Terminal f={f} start={a + 10} lines={API_LINES} title="zsh — mac → iphone" speed={3.2} fontSize={30} />
      </div>
      {/* receiving iPhone */}
      <div style={{ position: "absolute", left: 800, top: 1010 }}>
        <IPhone3D
          f={f}
          h={300}
          rotY={-20}
          screen={
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <NpuChip f={f} size={80} />
            </div>
          }
        />
      </div>
      {f >= sec(41.8) &&
        Array.from({ length: 4 }).map((_, i) => {
          const u = mod(lf * 1.4 + i * 22, 88) / 88;
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: interpolate(u, [0, 1], [420, 860]),
                top: interpolate(u, [0, 1], [1000, 1140]) - Math.sin(u * Math.PI) * 120,
                width: 26,
                height: 26,
                borderRadius: 8,
                background: C.cyan,
                boxShadow: "0 0 24px rgba(34,211,238,0.9)",
                opacity: Math.sin(u * Math.PI),
              }}
            />
          );
        })}
      <div
        style={{
          position: "absolute",
          left: 60,
          top: 1050,
          fontFamily: MONO,
          color: C.white,
          opacity: f >= sec(41.8) ? 1 : 0,
        }}
      >
        <div style={{ fontSize: 26, color: C.muted }}>REQUESTS → 192.168.1.42</div>
        <div style={{ fontSize: 96, fontWeight: 900, color: C.cyan, lineHeight: 1 }}>{reqs}</div>
      </div>
    </AbsoluteFill>
  );
};

// -------------------------------------------------------------------------
// 14 — STEP 04: Global tunnel
// -------------------------------------------------------------------------
const PINS = [
  { lon: -40, lat: 30 },
  { lon: 20, lat: -10 },
  { lon: 70, lat: 40 },
  { lon: 130, lat: -20 },
  { lon: 200, lat: 10 },
  { lon: 260, lat: 45 },
  { lon: 310, lat: -35 },
];

const SceneStep4: React.FC<{ f: number; fps: number }> = ({ f, fps }) => {
  const op = sceneOpacity(f, SC.step4);
  if (op <= 0) return null;
  const a = SC.step4[0];
  const lf = f - a;
  const g = sp(f, a + 8, fps, { damping: 13, stiffness: 120, mass: 0.8 });
  const R = 320;
  const cx = 540;
  const cy = 830;
  const rot = lf * 0.6;
  const url = "https://my-cluster.trycloudflare.com";
  const urlN = Math.floor(interpolate(f, [sec(47.7), sec(48.9)], [0, url.length], clamp));
  const pinsOn = f >= sec(50.9);
  return (
    <AbsoluteFill style={{ opacity: op }}>
      <StepChip f={f} fps={fps} at={a} n="04" title="ГЛОБАЛЬНЫЙ ТУННЕЛЬ" color={C.purple} />
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, transform: `scale(${g})`, transformOrigin: `${cx}px ${cy}px` }}>
        <defs>
          <radialGradient id="globeG" cx="40%" cy="35%" r="70%">
            <stop offset="0%" stopColor="rgba(168,85,247,0.35)" />
            <stop offset="100%" stopColor="rgba(10,10,20,0.95)" />
          </radialGradient>
        </defs>
        <circle cx={cx} cy={cy} r={R} fill="url(#globeG)" stroke={C.purple} strokeWidth={4} style={{ filter: "drop-shadow(0 0 40px rgba(168,85,247,0.6))" }} />
        {[-60, -30, 0, 30, 60].map((lat) => {
          const ry = R * Math.cos((lat * Math.PI) / 180);
          return (
            <ellipse
              key={lat}
              cx={cx}
              cy={cy - R * Math.sin((lat * Math.PI) / 180)}
              rx={ry}
              ry={ry * 0.18}
              fill="none"
              stroke="rgba(168,85,247,0.35)"
              strokeWidth={2}
            />
          );
        })}
        {Array.from({ length: 6 }).map((_, i) => {
          const ang = (((i * 30 + rot) % 180) + 180) % 180;
          const rx = Math.abs(Math.cos((ang * Math.PI) / 180)) * R;
          return <ellipse key={i} cx={cx} cy={cy} rx={rx} ry={R} fill="none" stroke="rgba(168,85,247,0.3)" strokeWidth={2} />;
        })}
        {pinsOn &&
          PINS.map((p, i) => {
            const lon = ((p.lon + rot) * Math.PI) / 180;
            const lat = (p.lat * Math.PI) / 180;
            const z = Math.cos(lat) * Math.cos(lon);
            if (z < -0.1) return null;
            const px = cx + R * Math.cos(lat) * Math.sin(lon);
            const py = cy - R * Math.sin(lat);
            const ps = sp(f, sec(50.9) + i * 5, fps, { damping: 9, stiffness: 260, mass: 0.5 });
            const mx = (cx + px) / 2;
            const my = Math.min(cy, py) - 160;
            return (
              <g key={i} opacity={0.4 + z * 0.6}>
                <path d={`M ${cx} ${cy} Q ${mx} ${my} ${px} ${py}`} fill="none" stroke={C.yellow} strokeWidth={3} strokeDasharray="10 8" strokeDashoffset={-lf * 2} />
                <circle cx={px} cy={py} r={14 * ps} fill={C.yellow} style={{ filter: "drop-shadow(0 0 12px #facc15)" }} />
              </g>
            );
          })}
        <circle cx={cx} cy={cy} r={30 + Math.sin(lf / 6) * 6} fill={C.cyan} style={{ filter: "drop-shadow(0 0 30px #22d3ee)" }} />
      </svg>
      {f >= sec(48.7) && (
        <div
          style={{
            position: "absolute",
            left: cx - 170,
            top: cy - 30 - 90,
            width: 340,
            textAlign: "center",
            fontFamily: SANS,
            fontWeight: 900,
            fontSize: 40,
            color: C.white,
            textShadow: "0 4px 20px #000",
            transform: `scale(${sp(f, sec(48.7), fps, { damping: 9, stiffness: 260, mass: 0.5 })})`,
          }}
        >
          МИНИ-КЛАСТЕР
        </div>
      )}
      <div
        style={{
          position: "absolute",
          left: 70,
          right: 70,
          top: 1210,
          padding: "22px 28px",
          borderRadius: 20,
          background: C.panel,
          border: `2px solid ${C.purple}`,
          fontFamily: MONO,
          fontSize: 30,
          color: C.white,
          opacity: f >= sec(47.1) ? 1 : 0,
          boxShadow: "0 0 40px rgba(168,85,247,0.35)",
        }}
      >
        <span style={{ color: C.green }}>🔒 </span>
        {url.slice(0, urlN)}
        <span style={{ color: C.yellow, opacity: mod(f / 15, 2) === 0 ? 1 : 0 }}>▋</span>
      </div>
    </AbsoluteFill>
  );
};

// -------------------------------------------------------------------------
// 15 — 0 ₽ / 0 LIMITS
// -------------------------------------------------------------------------
const SceneZero: React.FC<{ f: number; fps: number }> = ({ f, fps }) => {
  const op = sceneOpacity(f, SC.zero);
  if (op <= 0) return null;
  const a = SC.zero[0];
  const rub = interpolate(f, [a, sec(53.1)], [14990, 0], { ...clamp, easing: EXPO_OUT });
  const zeroHit = sp(f, sec(53.1), fps, { damping: 8, stiffness: 300, mass: 0.5 });
  const limits = sp(f, sec(54.2), fps, { damping: 10, stiffness: 260, mass: 0.5 });
  const items = [
    { t: "100% ПРИВАТНО", at: sec(55.2), c: C.green },
    { t: "ОБЛАКА: ✕", at: sec(56.9), c: C.red },
  ];
  return (
    <AbsoluteFill style={{ opacity: op }}>
      <div style={{ position: "absolute", top: 200, width: "100%", textAlign: "center", fontFamily: SANS }}>
        <div
          style={{
            fontSize: 300,
            fontWeight: 900,
            letterSpacing: -12,
            lineHeight: 1,
            color: rub < 1 ? C.yellow : C.white,
            transform: `scale(${rub < 1 ? 1 + (1 - zeroHit) * 0.4 : 1})`,
            textShadow: rub < 1 ? "0 0 80px rgba(250,204,21,0.7)" : "none",
          }}
        >
          {Math.round(rub).toLocaleString("ru-RU")} ₽
        </div>
        <div style={{ fontFamily: MONO, fontSize: 40, color: C.muted, letterSpacing: 6, marginTop: 10 }}>ЗА ТОКЕНЫ / МЕС</div>
      </div>
      {f >= sec(54.2) && (
        <div
          style={{
            position: "absolute",
            top: 640,
            width: "100%",
            textAlign: "center",
            transform: `scale(${2.2 - limits * 1.2}) rotate(-3deg)`,
            opacity: interpolate(limits, [0, 0.3], [0, 1], clamp),
          }}
        >
          <Highlight f={f} at={sec(54.2)} size={150}>
            0 ЛИМИТОВ
          </Highlight>
        </div>
      )}
      {items.map((it, i) =>
        f >= it.at ? (
          <Card3D key={it.t} f={f} fps={fps} at={it.at} x={i ? 560 : 60} y={930} w={460} h={200} rotY={i ? -14 : 14} accent={it.c}>
            <div style={{ display: "flex", height: "100%", alignItems: "center", justifyContent: "center", fontSize: 44, fontWeight: 900, color: it.c, whiteSpace: "nowrap" }}>
              {it.t}
            </div>
          </Card3D>
        ) : null,
      )}
    </AbsoluteFill>
  );
};

// -------------------------------------------------------------------------
// 16 — 2026 glitch slam
// -------------------------------------------------------------------------
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
        <div key={l.c} style={{ position: "absolute", inset: 0, color: l.c, opacity: 0.8, transform: `translateX(${l.dx * amp * (1 + rand(k + 3) * 2)}px)`, mixBlendMode: "screen" }}>
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
            }}
          >
            {text}
          </div>
        );
      })}
    </div>
  );
};

const Scene2026: React.FC<{ f: number; fps: number }> = ({ f, fps }) => {
  const op = sceneOpacity(f, SC.y2026);
  if (op <= 0) return null;
  const a = SC.y2026[0];
  const slam = sp(f, sec(58.5), fps, { damping: 9, stiffness: 300, mass: 0.6 });
  const shake = f >= sec(58.5) && f < sec(58.5) + 14 ? (rand(f) - 0.5) * 40 : 0;
  return (
    <AbsoluteFill style={{ opacity: op, transform: `translate(${shake}px, ${shake * 0.5}px)` }}>
      <div style={{ position: "absolute", top: 230, width: "100%", textAlign: "center", fontFamily: MONO, fontSize: 40, letterSpacing: 10, color: C.muted, opacity: sp(f, a, fps) }}>
        В ГОДУ
      </div>
      {f >= sec(58.5) && (
        <div
          style={{
            position: "absolute",
            top: 300,
            width: "100%",
            display: "flex",
            justifyContent: "center",
            transform: `scale(${3 - slam * 2})`,
            opacity: interpolate(slam, [0, 0.2], [0, 1], clamp),
          }}
        >
          <Glitch f={f} text="2026" size={330} />
        </div>
      )}
      <Title top={720}>
        <Slam f={f} at={sec(60.4)} fps={fps} style={{ fontSize: 84, letterSpacing: -1 }}>
          ПОБЕЖДАЕТ НЕ
        </Slam>
        {f >= sec(61.2) && (
          <div style={{ position: "relative", display: "inline-block", marginTop: 24 }}>
            <Slam f={f} at={sec(61.2)} fps={fps} style={{ fontSize: 92, color: C.muted, letterSpacing: -2 }}>
              САМОЕ ДОРОГОЕ
              <br />
              ЖЕЛЕЗО
            </Slam>
            <Strike f={f} at={sec(62.1)} width={110} />
          </div>
        )}
      </Title>
    </AbsoluteFill>
  );
};

// -------------------------------------------------------------------------
// 17 — "САМАЯ ХИТРАЯ СВЯЗКА"
// -------------------------------------------------------------------------
const SceneCombo: React.FC<{ f: number; fps: number }> = ({ f, fps }) => {
  const op = sceneOpacity(f, SC.combo);
  if (op <= 0) return null;
  const a = SC.combo[0];
  const m = sp(f, a, fps, { damping: 11, stiffness: 180, mass: 0.6 });
  return (
    <AbsoluteFill style={{ opacity: op }}>
      <Title top={200}>
        <Slam f={f} at={a} fps={fps} style={{ fontSize: 96 }}>
          А САМАЯ ХИТРАЯ
        </Slam>
        <div style={{ marginTop: 16 }}>
          {f >= sec(63.9) && (
            <Highlight f={f} at={sec(63.9)} size={150}>
              СВЯЗКА
            </Highlight>
          )}
        </div>
      </Title>
      <div style={{ position: "absolute", left: 60, top: 760, transform: `translateX(${(1 - m) * -400}px) scale(0.55)`, transformOrigin: "left top" }}>
        <MacBook3D f={f} rotY={20} screen={<MacScreen8 f={f} start={a - 200} />} />
      </div>
      <div style={{ position: "absolute", left: 760, top: 700, transform: `translateX(${(1 - m) * 400}px)` }}>
        <IPhone3D f={f} h={460} rotY={-20} screen={<PhoneScreen12 />} />
      </div>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        {m > 0.8 && <Bolt seed={9} f={f} x1={480} y1={920} x2={770} y2={920} color={C.yellow} />}
      </svg>
      <FloorShadow x={540} y={1240} w={900} f={f} />
    </AbsoluteFill>
  );
};

// -------------------------------------------------------------------------
// 18 — CTA
// -------------------------------------------------------------------------
const SceneCta: React.FC<{ f: number; fps: number }> = ({ f, fps }) => {
  const op = sceneOpacity(f, SC.cta, 8, 0);
  if (op <= 0) return null;
  const a = SC.cta[0];
  const lf = f - a;
  const word = sp(f, sec(65.9), fps, { damping: 8, stiffness: 260, mass: 0.6 });
  const beat = 1 + 0.04 * Math.max(0, Math.sin(lf / 6));
  const comment = "кластер";
  const typed = Math.floor(interpolate(f, [sec(66.4), sec(67.2)], [0, comment.length], clamp));
  const box = sp(f, sec(66.3), fps);
  const gift = sp(f, sec(68.1), fps, { damping: 10, stiffness: 220, mass: 0.6 });
  return (
    <AbsoluteFill style={{ opacity: op }}>
      <Title top={200}>
        <Slam f={f} at={a} fps={fps} style={{ fontSize: 120 }}>
          НАПИШИ
        </Slam>
      </Title>
      {f >= sec(65.9) && (
        <div style={{ position: "absolute", top: 380, width: "100%", textAlign: "center", transform: `scale(${(2.4 - word * 1.4) * beat}) rotate(-3deg)` }}>
          <span
            style={{
              display: "inline-block",
              padding: "10px 50px",
              borderRadius: 26,
              background: C.yellow,
              color: "#0a0a0a",
              fontFamily: SANS,
              fontWeight: 900,
              fontSize: 170,
              letterSpacing: -6,
              boxShadow: `0 0 ${60 + Math.sin(lf / 6) * 30}px rgba(250,204,21,0.8)`,
            }}
          >
            КЛАСТЕР
          </span>
        </div>
      )}
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
      {f >= sec(68.1) && (
        <div
          style={{
            position: "absolute",
            top: 960,
            width: "100%",
            textAlign: "center",
            transform: `scale(${gift}) translateY(${(1 - gift) * 80}px)`,
          }}
        >
          <span
            style={{
              display: "inline-block",
              padding: "20px 40px",
              borderRadius: 22,
              border: `3px solid ${C.green}`,
              background: "rgba(34,197,94,0.12)",
              color: C.white,
              fontFamily: SANS,
              fontWeight: 900,
              fontSize: 52,
              boxShadow: "0 0 40px rgba(34,197,94,0.5)",
            }}
          >
            📄 ПОШАГОВАЯ ИНСТРУКЦИЯ
          </span>
        </div>
      )}
      <div
        style={{
          position: "absolute",
          top: 1130 + Math.sin(lf / 8) * 16,
          width: "100%",
          textAlign: "center",
          fontSize: 90,
          color: C.yellow,
          opacity: f >= sec(66.4) ? 1 : 0,
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
export const FrankensteinClusterReel: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const cam = useCamera(f, fps);

  return (
    <AbsoluteFill style={{ backgroundColor: C.bg, overflow: "hidden" }}>
      <Audio src={staticFile("frankenstein_reel/voice.mp3")} />
      <Background f={f} />
      <AbsoluteFill style={{ perspective: 2200 }}>
        <AbsoluteFill
          style={{
            transform: `translate(${cam.dx}px, ${cam.dy}px) scale(${cam.zoom}) rotateX(${cam.tiltX}deg) rotateY(${cam.tiltY}deg)`,
            transformStyle: "preserve-3d",
          }}
        >
          <SceneHook f={f} fps={fps} />
          <ScenePrice f={f} fps={fps} />
          <SceneCross f={f} fps={fps} />
          <SceneMac f={f} fps={fps} />
          <SceneIphone f={f} fps={fps} />
          <SceneSecret f={f} fps={fps} />
          <SceneNpu f={f} fps={fps} />
          <SceneIdle f={f} fps={fps} />
          <SceneScheme f={f} fps={fps} />
          <SceneStep1 f={f} fps={fps} />
          <SceneStep2 f={f} fps={fps} />
          <SceneStep3 f={f} fps={fps} />
          <SceneTerm f={f} fps={fps} />
          <SceneStep4 f={f} fps={fps} />
          <SceneZero f={f} fps={fps} />
          <Scene2026 f={f} fps={fps} />
          <SceneCombo f={f} fps={fps} />
          <SceneCta f={f} fps={fps} />
        </AbsoluteFill>
      </AbsoluteFill>
      <CutFlash f={f} />
      <Subtitles f={f} fps={fps} />
    </AbsoluteFill>
  );
};
