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
import wordsData from "../public/future_money_reel/words.json";

/*
 * =========================================================================
 * FUTURE MONEY REEL — 1080x1920 @ 60 FPS, 2340 FRAMES (39s)
 *
 *   S1  0.0 –  3.1s : Hook — "ПОКА ВСЕ СПОРЯТ" + flying debate bubbles
 *   S2  3.1 –  8.4s : 3D agent card + revenue counter $0 → $1,000/нед + payments
 *   S3  8.4 – 13.4s : "5 ЛЕТ" code wall → strike → "3 ШАГА"
 *   S4 13.4 – 17.2s : ШАГ 01 — live terminal scraping leads + 3D lead cards
 *   S5 17.2 – 21.5s : ШАГ 02 — 10:00 countdown, solution cards assemble
 *   S6 21.5 – 25.4s : ШАГ 03 — invoice card, 03:14 AM, payments while you sleep
 *   S7 25.4 – 30.6s : "2026" + growth chart w/ glowing particles, "ПАШЕТ РУКАМИ" strike
 *   S8 30.6 – 33.7s : "А ТОТ, КТО ПЕРВЫМ СОБРАЛ СВОЮ СИСТЕМУ" + node pipeline
 *   S9 33.7 – 39.0s : CTA — НАПИШИ «СИСТЕМА» + comment box typing
 *
 * Camera: punch beats every 1.5s + alternating tilt + constant drift.
 * Subtitles: chunked from words.json, karaoke + yellow keyword highlights.
 * =========================================================================
 */

const FPS = 60;

const C = {
  bg: "#06070b",
  yellow: "#facc15",
  yellowSoft: "rgba(250,204,21,0.18)",
  green: "#22c55e",
  greenSoft: "rgba(34,197,94,0.18)",
  red: "#ef4444",
  white: "#f8fafc",
  blue: "#60a5fa",
  muted: "#64748b",
  panel: "rgba(14,16,24,0.94)",
  border: "rgba(250,204,21,0.35)",
};

const SANS =
  "'Inter', 'SF Pro Display', -apple-system, 'Helvetica Neue', Arial, sans-serif";
const MONO = "'JetBrains Mono', 'SF Mono', Menlo, Consolas, monospace";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const EXPO_OUT = Easing.bezier(0.16, 1, 0.3, 1);
const sec = (s: number) => Math.round(s * FPS);

const rand = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

const sp = (
  f: number,
  delay: number,
  fps: number,
  config: { damping?: number; stiffness?: number; mass?: number } = {
    damping: 13,
    stiffness: 180,
    mass: 0.6,
  },
) => spring({ frame: Math.max(0, f - delay), fps, config });

const sceneOpacity = (f: number, [a, b]: number[], fadeIn = 10, fadeOut = 10) => {
  if (f < a - fadeIn || f >= b) return 0;
  const fin = fadeIn > 0 ? interpolate(f, [a - fadeIn, a], [0, 1], clamp) : 1;
  const fout = fadeOut > 0 ? interpolate(f, [b - fadeOut, b], [1, 0], clamp) : 1;
  return Math.min(fin, fout);
};

// Scene windows (frames)
const S1 = [0, 186];
const S2 = [186, 504];
const S3 = [504, 804];
const S4 = [804, 1032];
const S5 = [1032, 1290];
const S6 = [1290, 1524];
const S7 = [1524, 1836];
const S8 = [1836, 2022];
const S9 = [2022, 2340];

const fmtMoney = (n: number) => "$" + Math.round(n).toLocaleString("en-US");

// -------------------------------------------------------------------------
// Words → subtitle chunks
// -------------------------------------------------------------------------
type Word = { word: string; start: number; end: number };
const WORDS = wordsData as Word[];

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
  /тысяч|доллар|недел|программир|трех|шаг|клиент|^10$|минут|спишь|2026|систем|первым|руками|агент|данные|счет|5/i;

// -------------------------------------------------------------------------
// Camera — punch every 1.5s
// -------------------------------------------------------------------------
const BEATS = Array.from({ length: 26 }, (_, i) => Math.round(i * 1.5 * FPS) + 12);

const useCamera = (f: number, fps: number) => {
  let zoom = 1;
  let tiltX = 0;
  let tiltY = 0;
  BEATS.forEach((b, i) => {
    if (f < b || f > b + 80) return;
    const s = spring({ frame: f - b, fps, config: { damping: 13, stiffness: 200, mass: 0.5 } });
    const pulse = s * interpolate(f - b, [0, 60], [1, 0], clamp);
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
// Background
// -------------------------------------------------------------------------
const Background: React.FC<{ f: number }> = ({ f }) => {
  const t = f / FPS;
  const gx = 540 + Math.sin(t * 0.4) * 140;
  const gy = 800 + Math.cos(t * 0.3) * 100;
  const moneyMode = f >= S2[0] && f < S3[0] ? 1 : 0;
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at ${gx}px ${gy}px, rgba(250,204,21,0.15) 0%, rgba(250,204,21,0.04) 32%, transparent 60%)`,
        }}
      />
      <AbsoluteFill
        style={{
          opacity: 0.6 + moneyMode * 0.4,
          background: "radial-gradient(circle at 85% 12%, rgba(34,197,94,0.12) 0%, transparent 42%)",
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
            "linear-gradient(rgba(250,204,21,0.10) 2px, transparent 2px), linear-gradient(90deg, rgba(250,204,21,0.10) 2px, transparent 2px)",
          backgroundSize: "90px 90px",
          backgroundPosition: `0px ${(f * 2) % 90}px`,
          maskImage: "linear-gradient(to bottom, rgba(0,0,0,0.9), transparent 75%)",
          WebkitMaskImage: "linear-gradient(to bottom, rgba(0,0,0,0.9), transparent 75%)",
        }}
      />
      {Array.from({ length: 28 }).map((_, i) => {
        const x = rand(i) * 1080;
        const y = (rand(i + 50) * 1920 - f * (0.4 + rand(i + 9) * 0.8) + 1920 * 6) % 1920;
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
              background: i % 4 === 0 ? C.green : C.yellow,
              opacity: 0.1 + rand(i + 11) * 0.25,
              filter: `blur(${rand(i + 7) * 6}px)`,
            }}
          />
        );
      })}
      <AbsoluteFill
        style={{
          background: "radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,0.78) 100%)",
        }}
      />
    </AbsoluteFill>
  );
};

// -------------------------------------------------------------------------
// Shared pieces
// -------------------------------------------------------------------------
const Highlight: React.FC<{
  f: number;
  at: number;
  children: React.ReactNode;
  size: number;
  dark?: boolean;
}> = ({ f, at, children, size }) => {
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
          background: C.yellow,
          borderRadius: 12,
          boxShadow: `0 0 ${50 * w}px rgba(250,204,21,0.7)`,
          transform: "skewX(-6deg)",
        }}
      />
      <span
        style={{
          position: "relative",
          fontSize: size,
          color: w > 0.4 ? "#0a0a0a" : C.white,
        }}
      >
        {children}
      </span>
    </span>
  );
};

const Slam: React.FC<{
  f: number;
  at: number;
  fps: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ f, at, fps, children, style }) => {
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

const StepChip: React.FC<{ f: number; fps: number; at: number; n: string; title: string }> = ({
  f,
  fps,
  at,
  n,
  title,
}) => {
  const s = sp(f, at, fps);
  const s2 = sp(f, at + 8, fps);
  return (
    <div style={{ position: "absolute", top: 190, width: "100%", textAlign: "center", fontFamily: SANS }}>
      <div
        style={{
          display: "inline-block",
          fontFamily: MONO,
          fontSize: 34,
          fontWeight: 800,
          color: "#0a0a0a",
          background: C.yellow,
          padding: "10px 26px",
          borderRadius: 12,
          letterSpacing: 4,
          transform: `scale(${s}) rotate(${(1 - s) * -12}deg)`,
          boxShadow: "0 0 40px rgba(250,204,21,0.6)",
        }}
      >
        ШАГ {n}
      </div>
      <div
        style={{
          marginTop: 22,
          fontSize: 86,
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

const Notification: React.FC<{
  f: number;
  fps: number;
  at: number;
  amount: string;
  label: string;
  top: number;
  out?: number;
}> = ({ f, fps, at, amount, label, top, out = 9999 }) => {
  if (f < at) return null;
  const s = sp(f, at, fps, { damping: 12, stiffness: 220, mass: 0.6 });
  const o = interpolate(f, [out, out + 12], [1, 0], clamp);
  const flash = interpolate(f - at, [0, 18], [1, 0], clamp);
  return (
    <div
      style={{
        position: "absolute",
        left: 120,
        right: 120,
        top,
        height: 128,
        borderRadius: 30,
        background: "rgba(22,26,36,0.94)",
        border: `2px solid rgba(34,197,94,${0.4 + flash * 0.6})`,
        boxShadow: `0 30px 60px rgba(0,0,0,0.6), 0 0 ${30 + flash * 60}px rgba(34,197,94,${0.3 + flash * 0.4})`,
        display: "flex",
        alignItems: "center",
        padding: "0 28px",
        gap: 24,
        transform: `perspective(1200px) translateY(${(1 - s) * -160}px) rotateX(${(1 - s) * 50}deg) scale(${0.85 + s * 0.15})`,
        opacity: s * o,
        fontFamily: SANS,
      }}
    >
      <div
        style={{
          width: 76,
          height: 76,
          borderRadius: 20,
          background: `linear-gradient(160deg, ${C.green}, #15803d)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 46,
          fontWeight: 900,
          color: C.white,
        }}
      >
        $
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 26, color: C.muted, fontWeight: 600 }}>{label}</div>
        <div style={{ fontSize: 30, color: C.white, fontWeight: 700 }}>Оплата получена</div>
      </div>
      <div
        style={{
          fontSize: 52,
          fontWeight: 900,
          color: C.green,
          textShadow: "0 0 24px rgba(34,197,94,0.7)",
        }}
      >
        {amount}
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

// -------------------------------------------------------------------------
// S1 — Hook
// -------------------------------------------------------------------------
const BUBBLES = [
  { t: "ИИ заберёт работу?!", x: 60, y: 1060, r: -8 },
  { t: "Это просто хайп", x: 540, y: 1180, r: 7 },
  { t: "Нас всех заменят", x: 90, y: 1300, r: 5 },
  { t: "Ещё 10 лет минимум", x: 480, y: 980, r: -6 },
];

const Scene1: React.FC<{ f: number; fps: number }> = ({ f, fps }) => {
  const op = sceneOpacity(f, S1, 0, 10);
  if (op <= 0) return null;
  const shake = f < 14 ? (rand(f) - 0.5) * 30 : 0;
  return (
    <AbsoluteFill style={{ opacity: op, transform: `translateX(${shake}px)` }}>
      <div
        style={{
          position: "absolute",
          top: 300,
          width: "100%",
          textAlign: "center",
          fontFamily: SANS,
          fontWeight: 900,
          letterSpacing: -4,
          color: C.white,
          lineHeight: 1,
        }}
      >
        <Slam f={f} at={0} fps={fps} style={{ fontSize: 150 }}>
          ПОКА ВСЕ
        </Slam>
        <Slam f={f} at={sec(0.6)} fps={fps} style={{ fontSize: 170, color: C.yellow, textShadow: "0 0 50px rgba(250,204,21,0.6)" }}>
          СПОРЯТ
        </Slam>
        <div style={{ height: 40 }} />
        <Slam f={f} at={sec(1.3)} fps={fps} style={{ fontSize: 74, letterSpacing: -1 }}>
          ЗАМЕНИТ ЛИ НАС
        </Slam>
        <div style={{ marginTop: 14 }}>
          {f >= sec(2.0) && (
            <Highlight f={f} at={sec(2.0)} size={110}>
              НЕЙРОСЕТЬ?
            </Highlight>
          )}
        </div>
      </div>
      {BUBBLES.map((b, i) => {
        const at = 20 + i * 18;
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
              background: i % 2 ? "rgba(96,165,250,0.16)" : "rgba(239,68,68,0.16)",
              border: `2px solid ${i % 2 ? C.blue : C.red}`,
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
// S2 — Agent card + revenue counter
// -------------------------------------------------------------------------
const Scene2: React.FC<{ f: number; fps: number }> = ({ f, fps }) => {
  const op = sceneOpacity(f, S2, 10, 12);
  if (op <= 0) return null;
  const lf = f - S2[0];
  const cardIn = sp(f, S2[0], fps, { damping: 14, stiffness: 120, mass: 0.8 });
  const value = interpolate(f, [sec(3.6), sec(7.0)], [0, 1000], {
    ...clamp,
    easing: Easing.inOut(Easing.cubic),
  });
  const done = f >= sec(7.0);
  const donePop = sp(f, sec(7.0), fps, { damping: 8, stiffness: 300, mass: 0.5 });
  const tiltY = interpolate(cardIn, [0, 1], [-45, -12]) + Math.sin(lf / 40) * 4;
  const tiltX = 14 + Math.cos(lf / 50) * 3;
  const pts = Array.from({ length: 24 }, (_, i) => {
    const x = (i / 23) * 760;
    const v = Math.pow(i / 23, 1.8) * 140 + rand(i + 3) * 18;
    return `${x},${170 - v}`;
  }).join(" ");
  const drawn = interpolate(f, [sec(3.6), sec(7.0)], [1, 0], clamp);
  const tagIn = sp(f, sec(3.2), fps);

  return (
    <AbsoluteFill style={{ opacity: op }}>
      <div style={{ position: "absolute", top: 190, width: "100%", textAlign: "center", fontFamily: SANS }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 18,
            padding: "14px 30px",
            borderRadius: 40,
            background: C.greenSoft,
            border: `2px solid ${C.green}`,
            fontSize: 40,
            fontWeight: 800,
            color: C.white,
            transform: `scale(${tagIn})`,
          }}
        >
          <span
            style={{
              width: 20,
              height: 20,
              borderRadius: 10,
              background: C.green,
              boxShadow: `0 0 ${10 + 10 * Math.sin(lf / 6)}px ${C.green}`,
            }}
          />
          1 АГЕНТ · ONLINE
        </div>
      </div>

      <div style={{ position: "absolute", left: 80, top: 330, width: 920, perspective: 1600 }}>
        <div
          style={{
            transform: `translateY(${(1 - cardIn) * 400}px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) rotateZ(-2deg) scale(${1 + donePop * 0.04 * (done ? 1 : 0)})`,
            transformStyle: "preserve-3d",
            borderRadius: 34,
            background: "linear-gradient(160deg, rgba(24,28,40,0.96), rgba(10,12,18,0.96))",
            border: `3px solid ${done ? C.yellow : C.border}`,
            boxShadow: `0 70px 140px rgba(0,0,0,0.7), 0 0 ${done ? 90 : 40}px rgba(250,204,21,${done ? 0.5 : 0.2})`,
            padding: "40px 50px 30px",
            fontFamily: SANS,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", fontFamily: MONO, fontSize: 26, color: C.muted }}>
            <span>REVENUE · WEEKLY</span>
            <span style={{ color: C.green }}>▲ LIVE</span>
          </div>
          <div
            style={{
              marginTop: 10,
              fontSize: 190,
              fontWeight: 900,
              letterSpacing: -8,
              color: done ? C.yellow : C.white,
              textShadow: done ? "0 0 60px rgba(250,204,21,0.8)" : "0 0 30px rgba(255,255,255,0.2)",
              fontVariantNumeric: "tabular-nums",
              lineHeight: 1.05,
            }}
          >
            {fmtMoney(value)}
            <span style={{ fontSize: 64, color: C.muted, letterSpacing: 0 }}>/нед</span>
          </div>
          <svg width={760} height={180} style={{ marginTop: 10, overflow: "visible" }}>
            <defs>
              <linearGradient id="fmrSpark" x1="0" x2="1">
                <stop offset="0%" stopColor={C.green} />
                <stop offset="100%" stopColor={C.yellow} />
              </linearGradient>
            </defs>
            <polyline
              points={pts}
              fill="none"
              stroke="url(#fmrSpark)"
              strokeWidth={8}
              strokeLinecap="round"
              strokeLinejoin="round"
              pathLength={1}
              strokeDasharray={1}
              strokeDashoffset={drawn}
              style={{ filter: "drop-shadow(0 0 12px rgba(250,204,21,0.8))" }}
            />
          </svg>
          <div style={{ display: "flex", gap: 16, marginTop: 10 }}>
            {["Заказ #01", "Заказ #02", "Заказ #03", "Заказ #04"].map((t, i) => {
              const on = f >= sec(4.0) + i * 40;
              return (
                <div
                  key={t}
                  style={{
                    flex: 1,
                    padding: "12px 0",
                    textAlign: "center",
                    borderRadius: 14,
                    fontFamily: MONO,
                    fontSize: 22,
                    fontWeight: 700,
                    color: on ? "#0a0a0a" : C.muted,
                    background: on ? C.green : "rgba(255,255,255,0.05)",
                    boxShadow: on ? "0 0 20px rgba(34,197,94,0.6)" : "none",
                  }}
                >
                  {on ? "✓ " : ""}
                  {t}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <Notification f={f} fps={fps} at={sec(4.0)} amount="+$180" label="STRIPE · сейчас" top={945} />
      <Notification f={f} fps={fps} at={sec(5.4)} amount="+$320" label="STRIPE · сейчас" top={1080} />
      <Notification f={f} fps={fps} at={sec(6.6)} amount="+$500" label="STRIPE · сейчас" top={1215} />
    </AbsoluteFill>
  );
};

// -------------------------------------------------------------------------
// S3 — 5 лет → 3 шага
// -------------------------------------------------------------------------
const CODE_WALL = [
  "for (let i = 0; i < n; i++) {",
  "  if (tree.left?.val > k) {",
  "class Solution<T> extends Base {",
  "  private async void mutex();",
  "SELECT * FROM users JOIN ...",
  "def __init__(self, *args):",
  "  return recursion(n - 1) +",
  "pointer->next = malloc(sz);",
  "git rebase -i HEAD~42",
  "Segmentation fault (core dumped)",
  "TypeError: undefined is not...",
  "  while (!done) { await tick();",
];

const Scene3: React.FC<{ f: number; fps: number }> = ({ f, fps }) => {
  const op = sceneOpacity(f, S3, 10, 10);
  if (op <= 0) return null;
  const lf = f - S3[0];
  const strikeAt = sec(11.7);
  const stepsAt = sec(12.1);
  const strike = interpolate(f, [strikeAt, strikeAt + 14], [0, 1], { ...clamp, easing: EXPO_OUT });
  const old = interpolate(f, [stepsAt, stepsAt + 14], [1, 0], clamp);
  const wallIn = sp(f, S3[0], fps, { damping: 14, stiffness: 110 });
  const s3 = sp(f, stepsAt, fps, { damping: 9, stiffness: 260, mass: 0.5 });

  return (
    <AbsoluteFill style={{ opacity: op }}>
      {/* tilted code wall */}
      <div
        style={{
          position: "absolute",
          left: 60,
          top: 260,
          width: 960,
          height: 1100,
          perspective: 1400,
          opacity: 0.55 * old + 0.15,
          filter: `blur(${(1 - old) * 6}px)`,
        }}
      >
        <div
          style={{
            transform: `rotateX(28deg) rotateY(-16deg) translateY(${(1 - wallIn) * 300}px)`,
            fontFamily: MONO,
            fontSize: 34,
            lineHeight: 1.7,
            color: C.blue,
          }}
        >
          {Array.from({ length: 22 }).map((_, i) => {
            const idx = ((i + Math.floor(lf / 8)) % CODE_WALL.length + CODE_WALL.length) % CODE_WALL.length;
            const line = CODE_WALL[idx] ?? "";
            const err = line.includes("fault") || line.includes("Error");
            return (
              <div key={i} style={{ color: err ? C.red : i % 3 ? C.blue : C.muted, whiteSpace: "nowrap" }}>
                {line}
              </div>
            );
          })}
        </div>
      </div>

      {/* 5 ЛЕТ */}
      <div
        style={{
          position: "absolute",
          top: 430,
          width: "100%",
          textAlign: "center",
          fontFamily: SANS,
          fontWeight: 900,
          opacity: old,
          transform: `scale(${1 - (1 - old) * 0.3})`,
        }}
      >
        <Slam f={f} at={S3[0] + 10} fps={fps} style={{ fontSize: 60, color: C.muted, letterSpacing: 2 }}>
          УЧИТЬ КОД
        </Slam>
        <div style={{ position: "relative", display: "inline-block" }}>
          <Slam f={f} at={sec(10.6)} fps={fps} style={{ fontSize: 320, color: C.white, letterSpacing: -14, lineHeight: 1 }}>
            5 ЛЕТ
          </Slam>
          <div
            style={{
              position: "absolute",
              left: -20,
              top: "52%",
              height: 26,
              width: `${strike * 110}%`,
              background: C.red,
              borderRadius: 13,
              transform: "rotate(-8deg)",
              boxShadow: `0 0 40px ${C.red}`,
            }}
          />
        </div>
      </div>

      {/* 3 ШАГА */}
      {f >= stepsAt && (
        <div
          style={{
            position: "absolute",
            top: 380,
            width: "100%",
            textAlign: "center",
            fontFamily: SANS,
            fontWeight: 900,
            transform: `scale(${2 - s3})`,
            opacity: interpolate(s3, [0, 0.3], [0, 1], clamp),
          }}
        >
          <div style={{ fontSize: 64, color: C.white, letterSpacing: 2 }}>ДОСТАТОЧНО</div>
          <div
            style={{
              fontSize: 260,
              color: C.yellow,
              letterSpacing: -10,
              lineHeight: 1,
              textShadow: "0 0 80px rgba(250,204,21,0.7)",
            }}
          >
            3 ШАГА
          </div>
          <div style={{ display: "flex", justifyContent: "center", gap: 30, marginTop: 50 }}>
            {["01", "02", "03"].map((n, i) => {
              const d = sp(f, stepsAt + 10 + i * 8, fps, { damping: 10, stiffness: 240, mass: 0.5 });
              return (
                <div
                  key={n}
                  style={{
                    width: 200,
                    height: 200,
                    borderRadius: 30,
                    background: C.panel,
                    border: `3px solid ${C.yellow}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: MONO,
                    fontSize: 80,
                    color: C.yellow,
                    transform: `perspective(800px) rotateY(${(1 - d) * 90 + (i - 1) * 14}deg) scale(${d})`,
                    boxShadow: "0 0 40px rgba(250,204,21,0.4)",
                  }}
                >
                  {n}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};

// -------------------------------------------------------------------------
// S4 — Step 1: terminal + leads
// -------------------------------------------------------------------------
const TERM_LINES = [
  { t: "$ agent scout --niche=clinics --geo=EU", c: C.white },
  { t: "→ scanning 2,431 profiles…", c: C.blue },
  { t: "✓ lead  SmileDent        score 94", c: C.green },
  { t: "✓ lead  FitLab Studio    score 91", c: C.green },
  { t: "✓ lead  Nova Realty      score 88", c: C.green },
  { t: "→ enriching emails + budgets…", c: C.blue },
  { t: "✓ 47 leads saved → crm.json", c: C.yellow },
];

const Terminal: React.FC<{ f: number; start: number; lines: { t: string; c: string }[]; title: string }> = ({
  f,
  start,
  lines,
  title,
}) => {
  const cursorOn = Math.floor(f / 15) % 2 === 0;
  let budget = Math.max(0, (f - start) * 2.6);
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
      <div style={{ padding: "28px 32px 36px", fontFamily: MONO, fontSize: 30, lineHeight: 1.6, minHeight: 420 }}>
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

const LEADS = [
  { n: "SmileDent", v: "$450" },
  { n: "FitLab", v: "$300" },
  { n: "Nova Realty", v: "$600" },
];

const Scene4: React.FC<{ f: number; fps: number }> = ({ f, fps }) => {
  const op = sceneOpacity(f, S4, 10, 10);
  if (op <= 0) return null;
  const lf = f - S4[0];
  const termIn = sp(f, S4[0] + 6, fps, { damping: 15, stiffness: 120, mass: 0.8 });
  const leads = Math.floor(interpolate(lf, [40, 200], [0, 47], clamp));
  return (
    <AbsoluteFill style={{ opacity: op }}>
      <StepChip f={f} fps={fps} at={S4[0]} n="01" title="НАХОДИТ КЛИЕНТОВ" />
      <div style={{ position: "absolute", left: 70, top: 470, width: 940, perspective: 1600 }}>
        <div
          style={{
            transform: `translateY(${(1 - termIn) * 300}px) rotateX(${12 + Math.sin(lf / 40) * 2}deg) rotateY(${interpolate(termIn, [0, 1], [35, 12])}deg) rotateZ(1.5deg)`,
            opacity: termIn,
          }}
        >
          <Terminal f={f} start={S4[0] + 12} lines={TERM_LINES} title="~/agents — scout" />
        </div>
      </div>
      {/* leads counter */}
      <div
        style={{
          position: "absolute",
          right: 70,
          top: 420,
          padding: "14px 26px",
          borderRadius: 20,
          background: C.yellow,
          fontFamily: MONO,
          fontWeight: 900,
          fontSize: 44,
          color: "#0a0a0a",
          transform: `rotate(6deg) scale(${termIn * (1 + (lf % 20 < 3 && leads < 47 ? 0.06 : 0))})`,
          boxShadow: "0 0 50px rgba(250,204,21,0.6)",
        }}
      >
        LEADS {String(leads).padStart(2, "0")}
      </div>
      {LEADS.map((l, i) => (
        <Card3D
          key={l.n}
          f={f}
          fps={fps}
          at={S4[0] + 70 + i * 22}
          x={60 + i * 330}
          y={1090}
          w={300}
          h={200}
          rotY={(i - 1) * -18}
          accent={C.green}
        >
          <div style={{ fontFamily: MONO, fontSize: 20, color: C.green }}>● NEW LEAD</div>
          <div style={{ fontSize: 40, fontWeight: 900, color: C.white, marginTop: 10, whiteSpace: "nowrap" }}>
            {l.n}
          </div>
          <div style={{ fontSize: 34, fontWeight: 800, color: C.yellow, marginTop: 8 }}>{l.v}</div>
        </Card3D>
      ))}
    </AbsoluteFill>
  );
};

// -------------------------------------------------------------------------
// S5 — Step 2: 10 minutes packaging
// -------------------------------------------------------------------------
const PRODUCTS = [
  { t: "Лендинг", i: "▦" },
  { t: "AI-бот", i: "◉" },
  { t: "Отчёт", i: "▤" },
];

const Scene5: React.FC<{ f: number; fps: number }> = ({ f, fps }) => {
  const op = sceneOpacity(f, S5, 10, 10);
  if (op <= 0) return null;
  const lf = f - S5[0];
  const remain = interpolate(lf, [20, 200], [600, 0], { ...clamp, easing: Easing.in(Easing.quad) });
  const mm = String(Math.floor(remain / 60)).padStart(2, "0");
  const ss = String(Math.floor(remain % 60)).padStart(2, "0");
  const done = remain <= 0;
  const donePop = sp(f, S5[0] + 200, fps, { damping: 8, stiffness: 300, mass: 0.5 });
  const pct = 1 - remain / 600;
  const timerIn = sp(f, S5[0] + 8, fps);

  return (
    <AbsoluteFill style={{ opacity: op }}>
      <StepChip f={f} fps={fps} at={S5[0]} n="02" title="УПАКОВЫВАЕТ РЕШЕНИЕ" />
      <div
        style={{
          position: "absolute",
          top: 460,
          width: "100%",
          textAlign: "center",
          fontFamily: MONO,
          fontWeight: 900,
          transform: `perspective(1200px) rotateX(14deg) scale(${timerIn * (1 + donePop * 0.08 * (done ? 1 : 0))})`,
        }}
      >
        <div
          style={{
            fontSize: 250,
            letterSpacing: -6,
            color: done ? C.green : C.white,
            textShadow: done ? "0 0 70px rgba(34,197,94,0.8)" : "0 0 40px rgba(250,204,21,0.35)",
            lineHeight: 1,
          }}
        >
          {done ? "ГОТОВО" : `${mm}:${ss}`}
        </div>
        <div style={{ margin: "30px auto 0", width: 860, height: 22, borderRadius: 11, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
          <div
            style={{
              width: `${pct * 100}%`,
              height: "100%",
              background: `linear-gradient(90deg, ${C.yellow}, ${C.green})`,
              boxShadow: `0 0 24px ${C.yellow}`,
            }}
          />
        </div>
      </div>
      {PRODUCTS.map((p, i) => {
        const at = S5[0] + 40 + i * 45;
        const ok = lf > 70 + i * 45;
        return (
          <Card3D
            key={p.t}
            f={f}
            fps={fps}
            at={at}
            x={70 + i * 320}
            y={860}
            w={300}
            h={380}
            rotY={(i - 1) * -22}
            rotX={8}
            accent={ok ? C.green : C.yellow}
          >
            <div style={{ fontSize: 120, color: C.yellow, textAlign: "center", lineHeight: 1.2 }}>{p.i}</div>
            <div style={{ fontSize: 44, fontWeight: 900, color: C.white, textAlign: "center", marginTop: 10 }}>
              {p.t}
            </div>
            {[0.9, 0.6, 0.75].map((w, k) => (
              <div
                key={k}
                style={{
                  margin: "16px auto 0",
                  height: 10,
                  width: `${w * interpolate(lf, [at - S5[0], at - S5[0] + 40], [0, 100], clamp)}%`,
                  borderRadius: 5,
                  background: "rgba(255,255,255,0.15)",
                }}
              />
            ))}
            <div
              style={{
                marginTop: 18,
                textAlign: "center",
                fontFamily: MONO,
                fontSize: 26,
                fontWeight: 800,
                color: ok ? C.green : C.muted,
              }}
            >
              {ok ? "✓ BUILT" : "building…"}
            </div>
          </Card3D>
        );
      })}
    </AbsoluteFill>
  );
};

// -------------------------------------------------------------------------
// S6 — Step 3: invoice while you sleep
// -------------------------------------------------------------------------
const Scene6: React.FC<{ f: number; fps: number }> = ({ f, fps }) => {
  const op = sceneOpacity(f, S6, 10, 10);
  if (op <= 0) return null;
  const lf = f - S6[0];
  const cardIn = sp(f, S6[0] + 8, fps, { damping: 14, stiffness: 120, mass: 0.8 });
  const stampAt = sec(24.2);
  const stamp = sp(f, stampAt, fps, { damping: 9, stiffness: 320, mass: 0.6 });
  const sleepIn = sp(f, sec(24.5), fps);
  const minute = 14 + Math.floor(lf / 30);

  return (
    <AbsoluteFill style={{ opacity: op }}>
      <StepChip f={f} fps={fps} at={S6[0]} n="03" title="ВЫСТАВЛЯЕТ СЧЁТ" />
      {/* clock + moon */}
      <div
        style={{
          position: "absolute",
          top: 450,
          width: "100%",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 26,
          fontFamily: MONO,
          opacity: cardIn,
        }}
      >
        <div
          style={{
            width: 70,
            height: 70,
            borderRadius: 35,
            boxShadow: `inset -18px -6px 0 0 ${C.yellow}`,
            transform: "rotate(-20deg)",
            filter: "drop-shadow(0 0 20px rgba(250,204,21,0.6))",
          }}
        />
        <div style={{ fontSize: 64, fontWeight: 800, color: C.white }}>
          03:{String(minute).padStart(2, "0")} AM
        </div>
      </div>
      {/* invoice card */}
      <div style={{ position: "absolute", left: 140, top: 580, width: 800, perspective: 1600 }}>
        <div
          style={{
            position: "relative",
            transform: `translateY(${(1 - cardIn) * 400}px) rotateX(${12 + Math.sin(lf / 40) * 2}deg) rotateY(${interpolate(cardIn, [0, 1], [-50, -14])}deg)`,
            borderRadius: 30,
            background: "linear-gradient(180deg, #fffdf5, #f3ead0)",
            boxShadow: "0 70px 140px rgba(0,0,0,0.7), 0 0 60px rgba(250,204,21,0.35)",
            padding: "40px 46px",
            fontFamily: SANS,
            color: "#111",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", fontFamily: MONO, fontSize: 26, color: "#666" }}>
            <span>INVOICE #0427</span>
            <span>→ SmileDent</span>
          </div>
          <div style={{ fontSize: 50, fontWeight: 900, marginTop: 18 }}>AI-автоматизация</div>
          {[
            ["Лендинг + бот", "$300"],
            ["Отчёт по лидам", "$150"],
          ].map(([a, b], i) => (
            <div
              key={a}
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 34,
                marginTop: 16,
                opacity: interpolate(lf, [30 + i * 14, 42 + i * 14], [0, 1], clamp),
              }}
            >
              <span style={{ color: "#444" }}>{a}</span>
              <span style={{ fontWeight: 800 }}>{b}</span>
            </div>
          ))}
          <div style={{ height: 3, background: "#ddd", margin: "24px 0" }} />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 64, fontWeight: 900 }}>
            <span>ИТОГО</span>
            <span>$450</span>
          </div>
          {f >= stampAt && (
            <div
              style={{
                position: "absolute",
                right: 40,
                top: 110,
                padding: "10px 30px",
                border: `8px solid ${C.green}`,
                borderRadius: 18,
                color: C.green,
                fontSize: 70,
                fontWeight: 900,
                letterSpacing: 4,
                transform: `rotate(-14deg) scale(${3 - stamp * 2})`,
                opacity: interpolate(stamp, [0, 0.3], [0, 0.95], clamp),
                background: "rgba(255,255,255,0.6)",
              }}
            >
              ОПЛАЧЕНО
            </div>
          )}
        </div>
      </div>
      {f >= sec(24.5) && (
        <div
          style={{
            position: "absolute",
            right: 70,
            top: 380,
            fontFamily: SANS,
            fontSize: 70,
            fontWeight: 900,
            color: C.blue,
            opacity: sleepIn,
            transform: `translateY(${-(f - sec(24.5)) * 0.5}px) rotate(-10deg)`,
            textShadow: "0 0 30px rgba(96,165,250,0.7)",
          }}
        >
          Zzz
        </div>
      )}
      <Notification f={f} fps={fps} at={sec(24.3)} amount="+$450" label="SmileDent · 03:16" top={1180} />
    </AbsoluteFill>
  );
};

// -------------------------------------------------------------------------
// S7 — 2026 + growth chart with glowing particles
// -------------------------------------------------------------------------
const CH_X = 90;
const CH_Y = 560;
const CH_W = 900;
const CH_H = 560;
const N_PTS = 40;
const curve = (u: number) => Math.pow(u, 2.4) * 0.92 + Math.sin(u * 18) * 0.025 * u + 0.04;
const CHART_PTS = Array.from({ length: N_PTS }, (_, i) => {
  const u = i / (N_PTS - 1);
  return { x: u * CH_W, y: CH_H - curve(u) * CH_H };
});

const Scene7: React.FC<{ f: number; fps: number }> = ({ f, fps }) => {
  const op = sceneOpacity(f, S7, 10, 12);
  if (op <= 0) return null;
  const lf = f - S7[0];
  const yearAt = sec(26.1);
  const year = sp(f, yearAt, fps, { damping: 9, stiffness: 260, mass: 0.5 });
  const prog = interpolate(lf, [10, 230], [0, 1], { ...clamp, easing: Easing.inOut(Easing.quad) });
  const path = CHART_PTS.map((p, i) => `${i ? "L" : "M"}${p.x},${p.y}`).join(" ");
  const area = `${path} L${CH_W},${CH_H} L0,${CH_H} Z`;
  const headIdx = Math.min(N_PTS - 1, prog * (N_PTS - 1));
  const hi = Math.floor(headIdx);
  const ht = headIdx - hi;
  const a = CHART_PTS[hi];
  const b = CHART_PTS[Math.min(N_PTS - 1, hi + 1)];
  const head = { x: a.x + (b.x - a.x) * ht, y: a.y + (b.y - a.y) * ht };
  const revenue = Math.round(curve(prog) * 10870);
  const strikeAt = sec(29.8);
  const strike = interpolate(f, [strikeAt, strikeAt + 14], [0, 1], { ...clamp, easing: EXPO_OUT });
  const lineIn = sp(f, sec(27.9), fps);
  const chartIn = sp(f, S7[0], fps, { damping: 14, stiffness: 120 });

  return (
    <AbsoluteFill style={{ opacity: op }}>
      {/* 2026 */}
      <div style={{ position: "absolute", top: 170, width: "100%", textAlign: "center", fontFamily: SANS, fontWeight: 900 }}>
        {f >= yearAt && (
          <div
            style={{
              fontSize: 260,
              letterSpacing: -12,
              lineHeight: 1,
              color: C.yellow,
              transform: `scale(${2.2 - year * 1.2})`,
              opacity: interpolate(year, [0, 0.25], [0, 1], clamp),
              textShadow: "0 0 90px rgba(250,204,21,0.75)",
            }}
          >
            2026
          </div>
        )}
      </div>

      {/* chart */}
      <div
        style={{
          position: "absolute",
          left: CH_X,
          top: CH_Y,
          width: CH_W,
          height: CH_H,
          perspective: 1600,
          opacity: chartIn,
        }}
      >
        <div
          style={{
            position: "relative",
            width: CH_W,
            height: CH_H,
            transform: `rotateX(${16 - chartIn * 4}deg) rotateY(${-12 + Math.sin(lf / 50) * 3}deg)`,
          }}
        >
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: (i / 4) * CH_H,
                height: 1,
                background: "rgba(255,255,255,0.08)",
              }}
            >
              <span style={{ position: "absolute", left: -6, top: -34, fontFamily: MONO, fontSize: 22, color: C.muted }}>
                {["$10k", "$7.5k", "$5k", "$2.5k", "$0"][i]}
              </span>
            </div>
          ))}
          <svg width={CH_W} height={CH_H} style={{ position: "absolute", overflow: "visible" }}>
            <defs>
              <linearGradient id="fmrArea" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor={C.yellow} stopOpacity={0.45} />
                <stop offset="100%" stopColor={C.yellow} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="fmrLine" x1="0" x2="1">
                <stop offset="0%" stopColor={C.green} />
                <stop offset="100%" stopColor={C.yellow} />
              </linearGradient>
              <clipPath id="fmrClip">
                <rect x={0} y={-200} width={head.x} height={CH_H + 400} />
              </clipPath>
            </defs>
            <path d={area} fill="url(#fmrArea)" clipPath="url(#fmrClip)" />
            <path
              d={path}
              fill="none"
              stroke="url(#fmrLine)"
              strokeWidth={10}
              strokeLinecap="round"
              clipPath="url(#fmrClip)"
              style={{ filter: "drop-shadow(0 0 16px rgba(250,204,21,0.9))" }}
            />
          </svg>
          {/* trailing particles */}
          {Array.from({ length: 22 }).map((_, i) => {
            const life = (lf + i * 7) % 50;
            const ox = head.x - life * (1.5 + rand(i) * 3);
            const oy = head.y + (rand(i + 5) - 0.5) * life * 3 - life * 0.6;
            const sz = 6 + rand(i + 2) * 10;
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: ox - sz / 2,
                  top: oy - sz / 2,
                  width: sz,
                  height: sz,
                  borderRadius: "50%",
                  background: i % 3 ? C.yellow : C.white,
                  boxShadow: `0 0 ${sz * 2}px ${C.yellow}`,
                  opacity: interpolate(life, [0, 50], [1, 0]) * (prog > 0 ? 1 : 0),
                }}
              />
            );
          })}
          {/* head glow */}
          <div
            style={{
              position: "absolute",
              left: head.x - 22,
              top: head.y - 22,
              width: 44,
              height: 44,
              borderRadius: 22,
              background: C.white,
              boxShadow: `0 0 30px ${C.white}, 0 0 70px ${C.yellow}, 0 0 120px ${C.yellow}`,
            }}
          />
          <div
            style={{
              position: "absolute",
              left: Math.min(head.x - 120, CH_W - 300),
              top: head.y - 110,
              padding: "10px 22px",
              borderRadius: 14,
              background: C.yellow,
              fontFamily: MONO,
              fontSize: 40,
              fontWeight: 900,
              color: "#0a0a0a",
              whiteSpace: "nowrap",
              boxShadow: "0 0 40px rgba(250,204,21,0.6)",
            }}
          >
            {fmtMoney(revenue)}/нед
          </div>
        </div>
      </div>

      {/* не тот, кто пашет руками */}
      <div
        style={{
          position: "absolute",
          top: 1180,
          width: "100%",
          textAlign: "center",
          fontFamily: SANS,
          fontWeight: 900,
          opacity: lineIn,
          transform: `translateY(${(1 - lineIn) * 40}px)`,
        }}
      >
        <div style={{ fontSize: 54, color: C.muted }}>ЗАРАБАТЫВАЕТ НЕ ТОТ, КТО</div>
        <div style={{ position: "relative", display: "inline-block", fontSize: 100, color: C.white, letterSpacing: -2 }}>
          ПАШЕТ РУКАМИ
          <div
            style={{
              position: "absolute",
              left: -10,
              top: "50%",
              height: 18,
              width: `${strike * 104}%`,
              background: C.red,
              borderRadius: 9,
              transform: "rotate(-4deg)",
              boxShadow: `0 0 30px ${C.red}`,
            }}
          />
        </div>
      </div>
    </AbsoluteFill>
  );
};

// -------------------------------------------------------------------------
// S8 — "А тот, кто первым собрал свою систему"
// -------------------------------------------------------------------------
const NODES = [
  { t: "ПОИСК", x: 180 },
  { t: "РЕШЕНИЕ", x: 540 },
  { t: "СЧЁТ", x: 900 },
];

const Scene8: React.FC<{ f: number; fps: number }> = ({ f, fps }) => {
  const op = sceneOpacity(f, S8, 10, 10);
  if (op <= 0) return null;
  const lf = f - S8[0];
  const NY = 1130;
  return (
    <AbsoluteFill style={{ opacity: op }}>
      <div
        style={{
          position: "absolute",
          top: 260,
          width: "100%",
          textAlign: "center",
          fontFamily: SANS,
          fontWeight: 900,
          color: C.white,
          letterSpacing: -3,
          lineHeight: 1.05,
        }}
      >
        <Slam f={f} at={sec(30.8)} fps={fps} style={{ fontSize: 96 }}>
          А ТОТ, КТО
        </Slam>
        <Slam f={f} at={sec(31.4)} fps={fps} style={{ fontSize: 150, color: C.yellow, textShadow: "0 0 60px rgba(250,204,21,0.6)" }}>
          ПЕРВЫМ
        </Slam>
        <Slam f={f} at={sec(31.9)} fps={fps} style={{ fontSize: 96 }}>
          СОБРАЛ СВОЮ
        </Slam>
        <div style={{ marginTop: 16, fontWeight: 900 }}>
          {f >= sec(32.7) && (
            <Highlight f={f} at={sec(32.7)} size={140}>
              СИСТЕМУ
            </Highlight>
          )}
        </div>
      </div>
      {/* pipeline */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: "perspective(1400px) rotateX(24deg)",
          transformOrigin: `540px ${NY}px`,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: NODES[0].x,
            width: NODES[2].x - NODES[0].x,
            top: NY - 3,
            height: 6,
            background: "rgba(250,204,21,0.3)",
          }}
        />
        {Array.from({ length: 8 }).map((_, i) => {
          const u = ((lf * 0.012 + i / 8) % 1);
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: NODES[0].x + u * (NODES[2].x - NODES[0].x) - 9,
                top: NY - 9,
                width: 18,
                height: 18,
                borderRadius: 9,
                background: C.yellow,
                boxShadow: `0 0 20px ${C.yellow}`,
              }}
            />
          );
        })}
        {NODES.map((n, i) => {
          const s = sp(f, S8[0] + 6 + i * 10, fps, { damping: 10, stiffness: 220, mass: 0.5 });
          const pulse = 0.5 + 0.5 * Math.sin((lf - i * 10) / 8);
          return (
            <div
              key={n.t}
              style={{
                position: "absolute",
                left: n.x - 140,
                top: NY - 75,
                width: 280,
                height: 150,
                borderRadius: 26,
                background: C.panel,
                border: `3px solid ${C.yellow}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: MONO,
                fontWeight: 900,
                fontSize: 38,
                color: C.white,
                transform: `scale(${s})`,
                boxShadow: `0 30px 60px rgba(0,0,0,0.6), 0 0 ${20 + pulse * 40}px rgba(250,204,21,0.5)`,
              }}
            >
              {n.t}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// -------------------------------------------------------------------------
// S9 — CTA
// -------------------------------------------------------------------------
const Scene9: React.FC<{ f: number; fps: number }> = ({ f, fps }) => {
  const op = sceneOpacity(f, S9, 10, 0);
  if (op <= 0) return null;
  const lf = f - S9[0];
  const word = "система";
  const typeStart = sec(34.6);
  const typed = Math.floor(interpolate(f, [typeStart, typeStart + word.length * 5], [0, word.length], clamp));
  const sent = f >= typeStart + word.length * 5 + 20;
  const sentPop = sp(f, typeStart + word.length * 5 + 20, fps, { damping: 9, stiffness: 260, mass: 0.5 });
  const pulse = 1 + 0.04 * Math.sin(lf / 7);
  const boxIn = sp(f, sec(35.2), fps, { damping: 13, stiffness: 160 });
  const schemeIn = sp(f, sec(36.6), fps);
  const cursorOn = Math.floor(f / 15) % 2 === 0;

  return (
    <AbsoluteFill style={{ opacity: op }}>
      <div style={{ position: "absolute", top: 220, width: "100%", textAlign: "center", fontFamily: SANS, fontWeight: 900 }}>
        <Slam f={f} at={S9[0]} fps={fps} style={{ fontSize: 150, color: C.white, letterSpacing: -4 }}>
          НАПИШИ
        </Slam>
        {f >= sec(34.3) && (
          <div
            style={{
              display: "inline-block",
              marginTop: 20,
              padding: "16px 50px 26px",
              borderRadius: 30,
              background: C.yellow,
              color: "#0a0a0a",
              fontSize: 150,
              letterSpacing: -4,
              transform: `scale(${sp(f, sec(34.3), fps, { damping: 8, stiffness: 280, mass: 0.5 }) * pulse}) rotate(-3deg)`,
              boxShadow: `0 0 ${60 + 40 * Math.sin(lf / 7)}px rgba(250,204,21,0.8)`,
            }}
          >
            «СИСТЕМА»
          </div>
        )}
      </div>

      {/* comment box */}
      <div
        style={{
          position: "absolute",
          left: 90,
          right: 90,
          top: 860,
          perspective: 1400,
          opacity: boxIn,
        }}
      >
        <div
          style={{
            transform: `translateY(${(1 - boxIn) * 200}px) rotateX(16deg)`,
            borderRadius: 30,
            background: "rgba(22,26,36,0.95)",
            border: `2px solid ${sent ? C.green : "rgba(255,255,255,0.15)"}`,
            boxShadow: "0 40px 80px rgba(0,0,0,0.6)",
            padding: "28px 34px",
            fontFamily: SANS,
          }}
        >
          <div style={{ fontSize: 28, color: C.muted, fontWeight: 700, marginBottom: 14 }}>Комментарии · 2 418</div>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <div
              style={{
                width: 70,
                height: 70,
                borderRadius: 35,
                background: `linear-gradient(160deg, ${C.yellow}, #ca8a04)`,
              }}
            />
            <div
              style={{
                flex: 1,
                height: 80,
                borderRadius: 40,
                background: "rgba(255,255,255,0.06)",
                display: "flex",
                alignItems: "center",
                padding: "0 30px",
                fontSize: 46,
                fontWeight: 800,
                color: C.white,
              }}
            >
              {word.slice(0, typed)}
              {!sent && <span style={{ color: C.yellow, opacity: cursorOn ? 1 : 0 }}>|</span>}
            </div>
            <div
              style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                background: sent ? C.green : C.yellow,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 44,
                fontWeight: 900,
                color: "#0a0a0a",
                transform: `scale(${1 + (sent ? (1 - sentPop) * 0.6 : 0)})`,
              }}
            >
              {sent ? "✓" : "➤"}
            </div>
          </div>
        </div>
      </div>

      {/* scheme promise */}
      <div
        style={{
          position: "absolute",
          top: 1150,
          width: "100%",
          textAlign: "center",
          fontFamily: SANS,
          fontWeight: 900,
          fontSize: 62,
          color: C.white,
          opacity: schemeIn,
          transform: `translateY(${(1 - schemeIn) * 40}px)`,
        }}
      >
        → ПОЛНАЯ <span style={{ color: C.yellow }}>СХЕМА</span> В ОТВЕТЕ
        <div style={{ fontSize: 90, color: C.yellow, transform: `translateY(${Math.abs(Math.sin(lf / 9)) * 24}px)` }}>
          ↓
        </div>
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
        bottom: 300,
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
              margin: "6px 16px",
              padding: key && on ? "0 14px" : 0,
              borderRadius: 12,
              background: key && on ? C.yellow : "transparent",
              fontFamily: SANS,
              fontSize: 84,
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

// Flash frame on every scene cut — hard visual hook
const CutFlash: React.FC<{ f: number }> = ({ f }) => {
  const cuts = [S2, S3, S4, S5, S6, S7, S8, S9].map((s) => s[0]);
  let o = 0;
  cuts.forEach((c) => {
    if (f >= c - 2 && f < c + 10) o = Math.max(o, interpolate(f, [c - 2, c, c + 10], [0, 0.35, 0], clamp));
  });
  if (o <= 0) return null;
  return <AbsoluteFill style={{ background: C.yellow, opacity: o, mixBlendMode: "screen" }} />;
};

// -------------------------------------------------------------------------
// Root composition
// -------------------------------------------------------------------------
export const FutureMoneyReel: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const cam = useCamera(f, fps);

  return (
    <AbsoluteFill style={{ backgroundColor: C.bg, overflow: "hidden" }}>
      <Audio src={staticFile("future_money_reel/voice.mp3")} />
      <Background f={f} />
      <AbsoluteFill style={{ perspective: 2200 }}>
        <AbsoluteFill
          style={{
            transform: `translate(${cam.dx}px, ${cam.dy}px) scale(${cam.zoom}) rotateX(${cam.tiltX}deg) rotateY(${cam.tiltY}deg)`,
            transformStyle: "preserve-3d",
          }}
        >
          <Scene1 f={f} fps={fps} />
          <Scene2 f={f} fps={fps} />
          <Scene3 f={f} fps={fps} />
          <Scene4 f={f} fps={fps} />
          <Scene5 f={f} fps={fps} />
          <Scene6 f={f} fps={fps} />
          <Scene7 f={f} fps={fps} />
          <Scene8 f={f} fps={fps} />
          <Scene9 f={f} fps={fps} />
        </AbsoluteFill>
      </AbsoluteFill>
      <CutFlash f={f} />
      <Subtitles f={f} fps={fps} />
    </AbsoluteFill>
  );
};
