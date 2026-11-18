import * as React from "react";
import type { CSSProperties, ReactNode } from "react";
import {
  AbsoluteFill,
  Audio,
  Easing,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";

/*
 * =========================================================================
 * SWISS AUDIT REEL — 1080x1920 @ 60 FPS, 3180 FRAMES (53s)
 * Light Swiss Editorial Minimalism. Zero neon, zero dark background.
 *
 *   01  0.0 –  8.6s : 3D Zurich hook (Bahnhofstrasse, supercar, Alps): two suits
 *                       hand over a CONFIDENTIAL envelope → it opens toward camera
 *                       → camera flies INTO the sheet "2026: $5,000 ЗА 20 МИНУТ"
 *   02  8.6 – 15.6s : crossed-out "$100 ЧАТ-БОТ" + rejection stamp
 *   03 15.6 – 28.0s : company spreadsheet scan, 3 leaks = $8,000/мес
 *   04 28.0 – 42.8s : СЧЕТА / ЗАЯВКИ / ДАННЫЕ → agent map
 *   05 42.8 – 46.8s : "НЕ ЗА КОД — ЗА ЭКОНОМИЮ" ROI bar chart
 *   06 46.8 – 53.0s : CTA "НАПИШИ АУДИТ" → 3D pull-back: sheet on an executive
 *                       desk, alpine bank office at dusk (espresso, watch, pen)
 *
 * Transitions: hard paper-slide cuts + staggered Swiss grid reveals.
 * All cyclic indices go through mod().
 * =========================================================================
 */

const FPS = 60;
const W = 1080;
const H = 1920;

const PAPER = "#F4F1EA";
const PAPER_2 = "#EBE6DB";
const INK = "#111111";
const RED = "#E11D48";
const GRID = "#D6D1C7";
const MUTED = "#6B665C";

const HEAD = '"Helvetica Neue", Helvetica, "Arial Black", Impact, Arial, sans-serif';
const IMPACT = 'Impact, "Helvetica Neue Condensed", "Arial Narrow", "Helvetica Neue", sans-serif';
const MONO = '"SF Mono", Menlo, "JetBrains Mono", "Courier New", monospace';

const mod = (n: number, m: number) => ((n % m) + m) % m;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const EASE = Easing.bezier(0.7, 0, 0.2, 1);
const OUT = Easing.bezier(0.16, 1, 0.3, 1);
const s2f = (s: number) => Math.round(s * FPS);

const ramp = (f: number, a: number, b: number, from = 0, to = 1, ease = OUT) =>
  interpolate(f, [a, b], [from, to], { ...clamp, easing: ease });

const money = (n: number) => "$" + Math.round(n).toLocaleString("en-US");

// -------------------------------------------------------------------------
// Words (from public/swiss_audit_reel/words.json, inlined for strict tsc)
// -------------------------------------------------------------------------
type Word = { word: string; start: number; end: number };

const RAW: [string, number, number][] = [
  ["Почему", 0.0, 0.4],
  ["в", 0.4, 0.62],
  ["2026", 0.62, 1.78],
  ["году", 1.78, 2.32],
  ["компании", 2.32, 2.72],
  ["платят", 2.72, 3.2],
  ["по", 3.2, 3.36],
  ["5", 3.36, 3.66],
  ["тысяч", 3.66, 3.92],
  ["долларов", 3.92, 4.32],
  ["за", 4.32, 4.64],
  ["один", 4.64, 4.96],
  ["и", 4.96, 5.28],
  ["и", 5.28, 5.56],
  ["аудит,", 5.56, 6.06],
  ["который", 6.46, 6.68],
  ["занимает", 6.68, 7.26],
  ["20", 7.26, 7.62],
  ["минут?", 7.62, 7.96],
  ["Большинство", 8.7, 9.3],
  ["новичков", 9.3, 9.76],
  ["пытаются", 9.76, 10.26],
  ["продавать", 10.26, 10.7],
  ["бизнесу", 10.7, 11.22],
  ["простого", 11.22, 11.64],
  ["чатбота", 11.64, 12.22],
  ["за", 12.22, 12.82],
  ["100", 12.82, 13.06],
  ["долларов", 13.06, 13.42],
  ["и", 13.42, 13.96],
  ["получают", 13.96, 14.5],
  ["отказ.", 14.5, 14.9],
  ["Умный", 15.7, 16.18],
  ["подход", 16.18, 16.5],
  ["работает", 16.5, 17.12],
  ["иначе.", 17.12, 17.74],
  ["Ты", 18.12, 18.22],
  ["открываешь", 18.22, 18.82],
  ["таблицы", 18.82, 19.28],
  ["компании", 19.28, 19.7],
  ["и", 19.7, 20.28],
  ["находишь", 20.28, 20.8],
  ["три", 20.8, 21.12],
  ["рутинных", 21.12, 21.74],
  ["процесса,", 21.74, 22.48],
  ["которые", 22.68, 23.12],
  ["сжигают", 23.12, 23.9],
  ["8", 23.9, 24.38],
  ["тысяч", 24.38, 24.8],
  ["долларов", 24.8, 25.28],
  ["каждый", 25.28, 25.76],
  ["месяц", 25.76, 26.34],
  ["на", 26.34, 26.64],
  ["ручной", 26.64, 27.08],
  ["труд.", 27.08, 27.32],
  ["Обработка", 28.08, 28.74],
  ["счетов,", 28.74, 29.36],
  ["ответы", 29.76, 30.12],
  ["на", 30.12, 30.18],
  ["типовые", 30.18, 30.6],
  ["заявки", 30.6, 31.32],
  ["и", 31.32, 31.72],
  ["перенос", 31.72, 32.16],
  ["данных", 32.16, 32.76],
  ["между", 32.76, 33.02],
  ["сервисами.", 33.02, 33.72],
  ["За", 34.16, 34.26],
  ["20", 34.26, 34.6],
  ["минут", 34.6, 34.96],
  ["ты", 34.96, 35.28],
  ["собираешь", 35.28, 35.78],
  ["наглядную", 35.78, 36.3],
  ["карту", 36.3, 36.68],
  ["автоматизации", 36.68, 37.52],
  ["на", 37.52, 37.78],
  ["агентах", 37.78, 38.4],
  ["и", 38.4, 38.7],
  ["показываешь", 38.7, 39.24],
  ["директор,", 39.24, 39.64],
  ["сколько", 39.78, 40.02],
  ["денег", 40.02, 40.48],
  ["он", 40.48, 40.66],
  ["сэкономит", 40.66, 41.2],
  ["уже", 41.2, 41.42],
  ["в", 41.42, 41.54],
  ["первый", 41.54, 41.76],
  ["месяц.", 41.76, 42.34],
  ["Бизнес", 42.88, 43.12],
  ["платит", 43.12, 43.56],
  ["незакот,", 43.56, 44.26],
  ["а", 44.56, 44.7],
  ["за", 44.7, 44.84],
  ["сэкономленные", 44.84, 45.64],
  ["миллионы.", 45.64, 46.2],
  ["Напиши", 46.88, 47.22],
  ["слово", 47.22, 47.44],
  ["аудит", 47.44, 48.1],
  ["в", 48.1, 48.26],
  ["комментариях", 48.26, 49.12],
  ["и", 49.12, 49.62],
  ["я", 49.62, 49.78],
  ["скину", 49.78, 50.14],
  ["шаблон", 50.14, 50.6],
  ["такого", 50.6, 51.0],
  ["разбора.", 51.0, 51.6]
];

// ASR fixes for on-screen display only
const FIX: Record<string, string> = { "незакот,": "не за код,", "чатбота": "чат-бота", "директор,": "директору," };

const WORDS: Word[] = RAW.filter((w, i) => !(i > 0 && w[0] === "и" && RAW[i - 1][0] === "и")).map(
  ([word, start, end]) => ({ word: FIX[word] ?? word, start, end })
);

type Chunk = { words: Word[]; start: number; end: number };
const CHUNKS: Chunk[] = (() => {
  const out: Chunk[] = [];
  let cur: Word[] = [];
  WORDS.forEach((w, i) => {
    const next = WORDS[i + 1];
    cur.push(w);
    const punct = /[,.?!]$/.test(w.word);
    const gap = next ? next.start - w.end > 0.45 : true;
    const letters = cur.reduce((a, x) => a + x.word.length, 0);
    if (cur.length >= 4 || punct || gap || letters > 22 || !next) {
      out.push({ words: cur, start: cur[0].start, end: cur[cur.length - 1].end });
      cur = [];
    }
  });
  return out;
})();

// Punch-zoom keyword moments (seconds)
const PUNCH = [3.36, 7.26, 12.82, 14.5, 23.9, 34.26, 40.66, 43.56, 47.44];

// Scene boundaries (frames)
const SCENES = [0, s2f(8.6), s2f(15.6), s2f(28.0), s2f(42.8), s2f(46.8), 3180];
const OVERLAP = 18;

// -------------------------------------------------------------------------
// Primitives
// -------------------------------------------------------------------------
const GridBG: React.FC<{ f: number; step?: number }> = ({ f, step = 90 }) => {
  const cols = Math.floor(W / step);
  const rows = Math.floor(H / step);
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {Array.from({ length: cols + 1 }).map((_, i) => {
        const p = ramp(f, 2 + mod(i * 3, 11), 22 + mod(i * 3, 11), 0, 1, EASE);
        return (
          <div
            key={"c" + i}
            style={{
              position: "absolute",
              left: i * step,
              top: 0,
              width: 1,
              height: H * p,
              background: GRID,
            }}
          />
        );
      })}
      {Array.from({ length: rows + 1 }).map((_, i) => {
        const p = ramp(f, 4 + mod(i * 5, 13), 24 + mod(i * 5, 13), 0, 1, EASE);
        return (
          <div
            key={"r" + i}
            style={{
              position: "absolute",
              top: i * step,
              left: 0,
              height: 1,
              width: W * p,
              background: GRID,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

const Mono: React.FC<{ children: ReactNode; size?: number; color?: string; style?: CSSProperties }> = ({
  children,
  size = 26,
  color = INK,
  style,
}) => (
  <div style={{ fontFamily: MONO, fontSize: size, color, letterSpacing: 2, fontWeight: 500, ...style }}>
    {children}
  </div>
);

const Rule: React.FC<{ f: number; at: number; x: number; y: number; w: number; h?: number; color?: string }> = ({
  f,
  at,
  x,
  y,
  w,
  h = 4,
  color = INK,
}) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      height: h,
      width: w * ramp(f, at, at + 18, 0, 1, EASE),
      background: color,
    }}
  />
);

// Sliding block reveal: text rises out of a mask
const Reveal: React.FC<{ f: number; at: number; children: ReactNode; style?: CSSProperties; dur?: number }> = ({
  f,
  at,
  children,
  style,
  dur = 16,
}) => {
  const p = ramp(f, at, at + dur);
  return (
    <div style={{ overflow: "hidden", ...style }}>
      <div style={{ transform: `translateY(${(1 - p) * 110}%)` }}>{children}</div>
    </div>
  );
};

const Stamp: React.FC<{ f: number; at: number; text: string; x: number; y: number; rot?: number; size?: number }> = ({
  f,
  at,
  text,
  x,
  y,
  rot = -12,
  size = 96,
}) => {
  if (f < at) return null;
  const s = interpolate(f, [at, at + 7, at + 12], [2.2, 0.94, 1], clamp);
  const o = ramp(f, at, at + 5);
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: `translate(-50%,-50%) rotate(${rot}deg) scale(${s})`,
        opacity: o,
        border: `8px solid ${RED}`,
        outline: `2px solid ${RED}`,
        outlineOffset: 6,
        padding: "10px 34px",
        color: RED,
        fontFamily: IMPACT,
        fontSize: size,
        letterSpacing: 6,
        lineHeight: 1,
        mixBlendMode: "multiply",
        whiteSpace: "nowrap",
      }}
    >
      {text}
    </div>
  );
};

// Scene chrome: index number + header strip
const Chrome: React.FC<{ f: number; idx: number; title: string }> = ({ f, idx, title }) => (
  <>
    <div style={{ position: "absolute", left: 72, top: 96, right: 72, display: "flex", alignItems: "baseline" }}>
      <Reveal f={f} at={6}>
        <Mono size={30} color={RED} style={{ fontWeight: 700 }}>
          {String(idx).padStart(2, "0")}
        </Mono>
      </Reveal>
      <Reveal f={f} at={9} style={{ marginLeft: 22 }}>
        <Mono size={24} color={INK}>
          / 06 — {title}
        </Mono>
      </Reveal>
      <div style={{ flex: 1 }} />
      <Reveal f={f} at={12}>
        <Mono size={22} color={MUTED}>
          AUDIT·AI·2026
        </Mono>
      </Reveal>
    </div>
    <Rule f={f} at={4} x={72} y={150} w={W - 144} h={3} />
    {/* progress ticks */}
    <div style={{ position: "absolute", left: 72, top: 166, display: "flex", gap: 8 }}>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} style={{ width: 40, height: 6, background: i < idx ? (i === idx - 1 ? RED : INK) : GRID }} />
      ))}
    </div>
  </>
);

// Paper-slide wrapper for each scene
const Paper: React.FC<{ f: number; first?: boolean; children: ReactNode; dir?: number }> = ({
  f,
  first,
  children,
  dir = 1,
}) => {
  const p = first ? 1 : ramp(f, 0, 16, 0, 1, EASE);
  const tx = (1 - p) * W * dir;
  // punch zoom + gentle drift
  return (
    <AbsoluteFill
      style={{
        transform: `translateX(${tx}px)`,
        background: PAPER,
        boxShadow: p < 1 ? `${-dir * 18}px 0 40px rgba(17,17,17,0.18)` : "none",
      }}
    >
      {children}
      {!first && p < 1 && (
        <div style={{ position: "absolute", top: 0, bottom: 0, [dir > 0 ? "left" : "right"]: 0, width: 14, background: RED }} />
      )}
    </AbsoluteFill>
  );
};

const Camera: React.FC<{ gf: number; children: ReactNode }> = ({ gf, children }) => {
  const t = gf / FPS;
  let punch = 0;
  for (const k of PUNCH) {
    const d = gf - s2f(k);
    if (d >= 0 && d < 40) punch += interpolate(d, [0, 5, 40], [0, 1, 0], { ...clamp, easing: OUT });
  }
  const scale = 1.012 + 0.01 * Math.sin(t * 0.5) + 0.045 * punch;
  const x = 8 * Math.sin(t * 0.37);
  const y = 6 * Math.cos(t * 0.29);
  return (
    <AbsoluteFill style={{ transform: `translate(${x}px,${y}px) scale(${scale})`, transformOrigin: "50% 42%" }}>
      {children}
    </AbsoluteFill>
  );
};

// -------------------------------------------------------------------------
// Scene 01 — $5,000 за 20 минут + invoice header
// -------------------------------------------------------------------------
const Scene1: React.FC<{ f: number }> = ({ f }) => {
  const amount = interpolate(f, [s2f(3.3), s2f(4.4)], [0, 5000], { ...clamp, easing: OUT });
  const clockP = ramp(f, s2f(7.2), s2f(8.4), 0, 1, EASE);
  return (
    <>
      <GridBG f={f} />
      <Chrome f={f} idx={1} title="ВОПРОС" />

      {/* Swiss invoice header */}
      <div
        style={{
          position: "absolute",
          left: 72,
          top: 240,
          width: W - 144,
          background: "#FFFFFF",
          border: `2px solid ${INK}`,
          transform: `translateY(${(1 - ramp(f, 8, 30, 0, 1, EASE)) * -60}px)`,
          opacity: ramp(f, 8, 20),
        }}
      >
        <div style={{ display: "flex", borderBottom: `2px solid ${INK}` }}>
          <div style={{ background: RED, width: 110, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ position: "relative", width: 52, height: 52 }}>
              <div style={{ position: "absolute", left: 18, top: 4, width: 16, height: 44, background: "#fff" }} />
              <div style={{ position: "absolute", left: 4, top: 18, width: 44, height: 16, background: "#fff" }} />
            </div>
          </div>
          <div style={{ padding: "22px 28px", flex: 1 }}>
            <div style={{ fontFamily: HEAD, fontWeight: 900, fontSize: 44, color: INK, letterSpacing: -1 }}>
              RECHNUNG / INVOICE
            </div>
            <Mono size={22} color={MUTED}>
              Nr. 2026-0417 · ZÜRICH · MWST 0%
            </Mono>
          </div>
        </div>
        {[
          ["01", "AI PROCESS AUDIT", "20 MIN"],
          ["02", "AUTOMATION MAP", "INCL."],
        ].map((r, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              padding: "16px 28px",
              borderBottom: `1px solid ${GRID}`,
              opacity: ramp(f, 30 + i * 8, 44 + i * 8),
            }}
          >
            <Mono size={24} color={RED} style={{ width: 70 }}>
              {r[0]}
            </Mono>
            <Mono size={24} style={{ flex: 1 }}>
              {r[1]}
            </Mono>
            <Mono size={24} color={MUTED}>
              {r[2]}
            </Mono>
          </div>
        ))}
        <div style={{ display: "flex", padding: "16px 28px", background: PAPER_2 }}>
          <Mono size={24} style={{ flex: 1, fontWeight: 700 }}>
            TOTAL (USD)
          </Mono>
          <Mono size={28} color={RED} style={{ fontWeight: 700 }}>
            {money(amount)}.00
          </Mono>
        </div>
      </div>

      {/* Headline */}
      <div style={{ position: "absolute", left: 72, top: 640 }}>
        <Reveal f={f} at={s2f(0.6)}>
          <div style={{ fontFamily: MONO, fontSize: 64, color: INK, fontWeight: 700, letterSpacing: 4 }}>2026:</div>
        </Reveal>
        <Reveal f={f} at={s2f(3.3)} dur={12}>
          <div
            style={{
              fontFamily: IMPACT,
              fontSize: 300,
              lineHeight: 0.92,
              color: RED,
              letterSpacing: -6,
            }}
          >
            {money(amount)}
          </div>
        </Reveal>
        <Reveal f={f} at={s2f(7.1)} dur={12}>
          <div style={{ fontFamily: HEAD, fontWeight: 900, fontSize: 124, lineHeight: 1, color: INK, letterSpacing: -3 }}>
            ЗА 20 МИНУТ
          </div>
        </Reveal>
      </div>

      {/* Stopwatch: architectural line drawing */}
      <svg style={{ position: "absolute", left: 770, top: 1215 }} width={240} height={240} viewBox="0 0 240 240">
        <circle cx={120} cy={130} r={90} fill="none" stroke={GRID} strokeWidth={2} />
        <circle
          cx={120}
          cy={130}
          r={90}
          fill="none"
          stroke={RED}
          strokeWidth={10}
          strokeDasharray={`${2 * Math.PI * 90 * (20 / 60) * clockP} 999`}
          transform="rotate(-90 120 130)"
        />
        <rect x={110} y={20} width={20} height={14} fill={INK} />
        <line
          x1={120}
          y1={130}
          x2={120 + 70 * Math.sin(clockP * 2 * Math.PI * (20 / 60))}
          y2={130 - 70 * Math.cos(clockP * 2 * Math.PI * (20 / 60))}
          stroke={INK}
          strokeWidth={4}
        />
        <circle cx={120} cy={130} r={6} fill={INK} />
      </svg>
      <Stamp f={f} at={s2f(5.5)} text="ОПЛАЧЕНО" x={330} y={1360} rot={-8} size={80} />
    </>
  );
};

// -------------------------------------------------------------------------
// Scene 01 intro — 3D Zurich hook (0 – 6.8s) → envelope opens toward camera
// → camera flies INTO the invoice sheet (6.8 – 8.6s) until it is 1:1 with
// the frame, so the Scene 2 paper-slide cut lands on a seamless sheet.
// -------------------------------------------------------------------------
const S1_FLY0 = s2f(6.8);
const S1_FLY1 = s2f(8.45);
const CREAM = "#F1E6CC";
const CRIMSON = "#9E1B32";
const RIM = "#FFD27A";
const ENV_W = 1200;
const ENV_H = 2020;
const SM = Easing.bezier(0.45, 0, 0.55, 1);
const mix = (a: number, b: number, p: number) => a + (b - a) * p;

const punchAt = (f: number, s: number) => {
  const d = f - s2f(s);
  return d >= 0 && d < 40 ? interpolate(d, [0, 5, 40], [0, 1, 0], { ...clamp, easing: OUT }) : 0;
};

// Full camera / prop rig for the intro (frames are global == local for scene 1)
const s1Rig = (f: number) => {
  const t = f / FPS;
  const give = ramp(f, s2f(0.9), s2f(2.3), 0, 1, SM);
  const reachB = ramp(f, s2f(1.3), s2f(2.3), 0, 1, SM);
  const lift = ramp(f, s2f(2.7), s2f(4.3), 0, 1, EASE);
  const release = ramp(f, s2f(2.8), s2f(3.4), 0, 1, EASE);
  const flap = ramp(f, s2f(4.35), s2f(5.15), 0, 1, EASE);
  const seal = ramp(f, s2f(4.2), s2f(4.6), 0, 1, OUT);
  const pull = ramp(f, s2f(5.0), s2f(6.7), 0, 1, EASE);
  const fly = ramp(f, S1_FLY0, S1_FLY1, 0, 1, Easing.bezier(0.55, 0, 0.12, 1));

  // street camera (parallax reference = figure layer)
  const cs = 1 + (0.035 * t) / 6.8 + 0.05 * lift + 0.9 * fly * fly;
  const cx = 10 * Math.sin(t * 0.45);
  const cy = 7 * Math.cos(t * 0.33) - 30 * lift;
  const map = (x: number, y: number) => ({ x: 540 + (x - 540) * cs + cx, y: 960 + (y - 960) * cs + cy });

  // envelope in hands (street space)
  const hold = { x: mix(470, 540, give), y: 1150 + 5 * Math.sin(t * 2.2) };
  const hs = map(hold.x, hold.y);

  // envelope offset relative to the sheet (sheet-local px)
  const envPull = mix(-50, 1060, pull);
  const envY = envPull + fly * 1500;
  const cPull = (Math.min(0, envPull) + envPull + ENV_H) / 2;
  const focus = mix(cPull, 960, fly);

  const float = 1 - fly;
  const sx = mix(hs.x, 540, lift);
  const sy = mix(mix(hs.y, 1010, lift), 960, fly);
  let gs = mix(0.13 * cs, 0.6, lift);
  gs = mix(gs, 0.5, pull);
  gs = mix(gs, 1, fly);
  gs *= 1 + 0.07 * punchAt(f, 3.36) * float;

  let rz = mix(-90 + 3 * Math.sin(t * 1.7), -3 + 1.2 * Math.sin(t * 0.9), lift);
  rz = mix(rz, -1.5, pull);
  rz = mix(rz, 0, fly);
  let rx = mix(6, 10 + 2 * Math.sin(t * 1.1), lift);
  rx = mix(rx, 12, pull);
  rx = mix(rx, 0, fly);
  let ry = mix(-22, 6 + 3 * Math.sin(t * 0.8), lift);
  ry = mix(ry, -4, pull);
  ry = mix(ry, 0, fly);

  const gx = sx - 540;
  const gy = sy - 960 - (focus - 960) * gs;
  return { t, give, reachB, lift, release, flap, seal, pull, fly, cs, cx, cy, hold, envY, gs, rx, ry, rz, gx, gy };
};

// ---- Street pieces (street space, SVG) ----------------------------------
const BOUTIQUES = [
  { x: -60, w: 330, top: 640, col: "#D9CBB0", name: "HORLOGERIE" },
  { x: 270, w: 300, top: 700, col: "#C8C2B6", name: "PRIVATBANK" },
  { x: 570, w: 340, top: 620, col: "#E2D6BE", name: "BIJOUTERIE" },
  { x: 910, w: 300, top: 690, col: "#BDB3A2", name: "MAISON 1891" },
];

const Supercar: React.FC<{ x: number; y: number }> = ({ x, y }) => {
  const body =
    "M18,-58 C10,-92 30,-112 90,-120 L250,-134 C300,-176 360,-200 430,-202 C500,-203 560,-186 610,-150 L712,-122 C752,-112 772,-96 774,-74 L770,-50 C768,-40 760,-36 748,-36 L30,-36 C22,-36 18,-44 18,-58 Z";
  const wheel = (cx: number) => (
    <g key={cx}>
      <circle cx={cx} cy={-58} r={68} fill="#040405" />
      <circle cx={cx} cy={-58} r={58} fill="#0C0C0E" />
      <circle cx={cx} cy={-58} r={40} fill="url(#s1rim)" />
      {Array.from({ length: 5 }).map((_, i) => {
        const a = (i / 5) * Math.PI * 2;
        return (
          <line key={i} x1={cx} y1={-58} x2={cx + 38 * Math.cos(a)} y2={-58 + 38 * Math.sin(a)} stroke="#1A1A1E" strokeWidth={7} />
        );
      })}
      <circle cx={cx} cy={-58} r={9} fill={RIM} />
      <path d={`M${cx - 22},-84 A30,30 0 0 1 ${cx + 26},-80`} stroke={CRIMSON} strokeWidth={6} fill="none" />
    </g>
  );
  return (
    <g transform={`translate(${x},${y})`}>
      {/* wet-road reflection */}
      <g transform="scale(1,-0.55)" opacity={0.22} filter="url(#s1soft)">
        <path d={body} fill="#3A3E48" />
      </g>
      <ellipse cx={400} cy={-4} rx={420} ry={22} fill="#000" opacity={0.65} filter="url(#s1soft)" />
      <g filter="url(#s1rimglow)">
        <path d={body} fill="url(#s1car)" />
      </g>
      <path d="M280,-136 C320,-172 370,-190 430,-191 C490,-191 540,-178 585,-150 L560,-140 L300,-134 Z" fill="url(#s1glass)" />
      <path d="M430,-190 L424,-136" stroke="#05060A" strokeWidth={5} />
      <path d="M60,-98 C200,-112 420,-126 720,-112" stroke={RIM} strokeWidth={2.5} fill="none" opacity={0.75} />
      <path d="M330,-118 L470,-122 L440,-70 L360,-68 Z" fill="#050507" opacity={0.7} />
      <path d="M200,-72 L700,-80" stroke="rgba(255,255,255,0.12)" strokeWidth={3} />
      <rect x={20} y={-96} width={26} height={8} rx={3} fill="#FF2340" />
      <path d="M742,-104 L772,-92" stroke="#F4F8FF" strokeWidth={5} strokeLinecap="round" />
      {wheel(165)}
      {wheel(625)}
    </g>
  );
};

type Pt = { x: number; y: number };
const elbowOf = (s: Pt, h: Pt, L = 175): Pt => {
  const dx = h.x - s.x;
  const dy = h.y - s.y;
  const d = Math.max(1, Math.hypot(dx, dy));
  const half = Math.min(d / 2, L - 1);
  const b = Math.sqrt(Math.max(0, L * L - half * half));
  let nx = -dy / d;
  let ny = dx / d;
  if (ny < 0) {
    nx = -nx;
    ny = -ny;
  }
  return { x: (s.x + h.x) / 2 + nx * b * 0.8, y: (s.y + h.y) / 2 + ny * b * 0.8 };
};

const SuitFigure: React.FC<{ x0: number; fy: number; suit: string; tie: string; facing: 1 | -1; hand: Pt; t: number }> = ({
  x0,
  fy,
  suit,
  tie,
  facing,
  hand,
  t,
}) => {
  const sway = 2.5 * Math.sin(t * 1.3 + x0);
  const hx = x0 + sway;
  const sR = { x: x0 + facing * 94, y: fy - 548 };
  const sL = { x: x0 - facing * 94, y: fy - 548 };
  const e = elbowOf(sR, hand);
  const restL = { x: x0 - facing * 110, y: fy - 300 };
  const eL = { x: x0 - facing * 112, y: fy - 420 };
  const SKIN = "#E7C3A2";
  return (
    <g>
      {/* soft contact + cast shadow on the road */}
      <ellipse cx={x0 + 70} cy={fy + 4} rx={170} ry={20} fill="#000" opacity={0.55} filter="url(#s1soft)" />
      <g filter="url(#s1rimglow)">
        {/* back arm */}
        <path d={`M${sL.x},${sL.y} L${eL.x},${eL.y} L${restL.x},${restL.y}`} stroke={suit} strokeWidth={42} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <circle cx={restL.x} cy={restL.y + 14} r={17} fill={SKIN} />
        {/* trousers */}
        <path d={`M${x0 - 72},${fy - 262} L${x0 - 6},${fy - 262} L${x0 - 12},${fy - 14} L${x0 - 60},${fy - 14} Z`} fill={suit} />
        <path d={`M${x0 + 6},${fy - 262} L${x0 + 72},${fy - 262} L${x0 + 60},${fy - 14} L${x0 + 12},${fy - 14} Z`} fill={suit} />
        <path d={`M${x0 - 36},${fy - 250} L${x0 - 36},${fy - 18} M${x0 + 36},${fy - 250} L${x0 + 36},${fy - 18}`} stroke="rgba(255,255,255,0.08)" strokeWidth={2} />
        {/* shoes */}
        <ellipse cx={x0 - 38 + facing * 12} cy={fy - 8} rx={46} ry={13} fill="#08080A" />
        <ellipse cx={x0 + 38 + facing * 12} cy={fy - 8} rx={46} ry={13} fill="#08080A" />
        {/* jacket */}
        <path
          d={`M${x0 - 104},${fy - 540} Q${x0 - 100},${fy - 566} ${x0 - 60},${fy - 568} L${x0 + 60},${fy - 568} Q${x0 + 100},${fy - 566} ${x0 + 104},${fy - 540} L${x0 + 84},${fy - 300} L${x0 + 92},${fy - 240} L${x0 - 92},${fy - 240} L${x0 - 84},${fy - 300} Z`}
          fill={suit}
        />
        {/* shirt V, tie, lapels, buttons, pocket square */}
        <path d={`M${x0 - 34},${fy - 568} L${x0 + 34},${fy - 568} L${x0},${fy - 430} Z`} fill="#F7F5F0" />
        <path d={`M${x0 - 9},${fy - 556} L${x0 + 9},${fy - 556} L${x0 + 13},${fy - 455} L${x0},${fy - 432} L${x0 - 13},${fy - 455} Z`} fill={tie} />
        <path d={`M${x0 - 36},${fy - 568} L${x0 - 62},${fy - 500} L${x0 - 8},${fy - 420} M${x0 + 36},${fy - 568} L${x0 + 62},${fy - 500} L${x0 + 8},${fy - 420}`} stroke="rgba(0,0,0,0.45)" strokeWidth={4} fill="none" />
        <circle cx={x0} cy={fy - 395} r={6} fill="#0A0A0C" />
        <circle cx={x0} cy={fy - 345} r={6} fill="#0A0A0C" />
        <path d={`M${x0 - 78},${fy - 500} l26,-6 l4,14 l-26,4 Z`} fill={tie} opacity={0.9} />
        {/* reaching arm */}
        <path d={`M${sR.x},${sR.y} L${e.x},${e.y} L${hand.x},${hand.y}`} stroke={suit} strokeWidth={42} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <circle cx={hand.x} cy={hand.y} r={18} fill={SKIN} />
        {/* neck + head */}
        <rect x={hx - 17} y={fy - 606} width={34} height={42} fill={SKIN} />
        <circle cx={hx} cy={fy - 640} r={47} fill={SKIN} />
        <path d={`M${hx - 48},${fy - 642} Q${hx - 46},${fy - 700} ${hx},${fy - 692} Q${hx + 50},${fy - 696} ${hx + 48},${fy - 646} Q${hx + 20},${fy - 676} ${hx - 48},${fy - 642} Z`} fill="#17120E" />
        <rect x={hx - 36 + facing * 6} y={fy - 650} width={72} height={18} rx={8} fill="#060608" />
      </g>
    </g>
  );
};

const ZurichStreet: React.FC<{ f: number; rig: ReturnType<typeof s1Rig> }> = ({ f, rig }) => {
  const { t, cs, cx, cy, lift, fly } = rig;
  const dof = Math.min(1, lift + fly);
  const Layer: React.FC<{ k: number; blur: number; children: ReactNode }> = ({ k, blur, children }) => (
    <AbsoluteFill
      style={{
        transform: `translate(${cx * k}px,${cy * k}px) scale(${1 + (cs - 1) * k})`,
        transformOrigin: "540px 960px",
        filter: blur > 0.05 ? `blur(${blur.toFixed(2)}px)` : undefined,
      }}
    >
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        {children}
      </svg>
    </AbsoluteFill>
  );
  const far = ridge(2.2, 880, 22, [[150, 380], [520, 580], [900, 440], [1140, 330]]);
  const midR = ridge(5.3, 920, 18, [[330, 360], [760, 430], [1050, 300]]);
  const poly = (pts: string[], bottom = H) => `M-100,${bottom} L${pts.join(" L")} L${W + 100},${bottom} Z`;
  const snowBand = (limit: number, seed: number) => {
    const pts: string[] = [];
    for (let x = -100; x <= W + 100; x += 14) {
      const y = limit + 24 * Math.sin(x * 0.09 + seed) + 14 * Math.sin(x * 0.23 + seed * 3) + 9 * Math.sin(x * 0.51 + seed);
      pts.push(`${x},${y.toFixed(1)}`);
    }
    return `M-100,-10 L${pts.join(" L")} L${W + 100},-10 Z`;
  };
  const sunset = 0.5 + 0.5 * Math.sin(t * 0.25);
  const hang = (row: number) =>
    Array.from({ length: 13 }).map((_, i) => {
      const x = -40 + i * 95 + row * 40;
      const y = 560 + row * 90 + 26 * Math.sin((i / 12) * Math.PI);
      const tw = 0.55 + 0.35 * Math.sin(t * 2 + i * 1.7 + row);
      return <circle key={`${row}-${i}`} cx={x} cy={y} r={10 + mod(i * 7 + row, 4) * 4} fill="#FFD9A0" opacity={tw} />;
    });
  return (
    <AbsoluteFill style={{ background: "#0D1B3A", overflow: "hidden" }}>
      <svg width={0} height={0} style={{ position: "absolute" }}>
        <defs>
          <linearGradient id="s1sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#0D1B3A" />
            <stop offset="0.2" stopColor="#2E4F80" />
            <stop offset="0.34" stopColor="#9DB4CF" />
            <stop offset="0.46" stopColor="#F1D4AE" />
            <stop offset="1" stopColor="#F1D4AE" />
          </linearGradient>
          <linearGradient id="s1snow" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#FFFFFF" />
            <stop offset="1" stopColor={sunset > 0.5 ? "#F6D9D2" : "#E4ECF6"} />
          </linearGradient>
          <linearGradient id="s1haze" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="rgba(241,212,174,0)" />
            <stop offset="1" stopColor="rgba(241,212,174,0.8)" />
          </linearGradient>
          <linearGradient id="s1shop" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#FFE7BD" />
            <stop offset="1" stopColor="#C98B3E" />
          </linearGradient>
          <linearGradient id="s1road" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#30333A" />
            <stop offset="1" stopColor="#111216" />
          </linearGradient>
          <linearGradient id="s1car" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#2A2D35" />
            <stop offset="0.45" stopColor="#14161B" />
            <stop offset="1" stopColor="#060708" />
          </linearGradient>
          <linearGradient id="s1glass" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#3B4E6E" />
            <stop offset="0.5" stopColor="#0B0F18" />
            <stop offset="1" stopColor="#1C2840" />
          </linearGradient>
          <radialGradient id="s1rim" cx="0.4" cy="0.35" r="0.7">
            <stop offset="0" stopColor="#E8E8EE" />
            <stop offset="1" stopColor="#6A6A74" />
          </radialGradient>
          <filter id="s1soft" x="-50%" y="-200%" width="200%" height="500%">
            <feGaussianBlur stdDeviation="10" />
          </filter>
          <filter id="s1rimglow" x="-30%" y="-30%" width="160%" height="160%">
            <feMorphology in="SourceAlpha" operator="dilate" radius="3" result="d" />
            <feOffset in="d" dx="-2" dy="-2" result="do" />
            <feFlood floodColor={RIM} />
            <feComposite in2="do" operator="in" result="g" />
            <feGaussianBlur in="g" stdDeviation="7" result="gb" />
            <feMerge>
              <feMergeNode in="gb" />
              <feMergeNode in="g" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <clipPath id="s1farclip">
            <path d={snowBand(560, 1)} />
          </clipPath>
          <clipPath id="s1midclip">
            <path d={snowBand(650, 2)} />
          </clipPath>
        </defs>
      </svg>

      {/* sky + Alps */}
      <Layer k={0.15} blur={3 + dof * 4}>
        <rect x={-200} y={-200} width={W + 400} height={H + 400} fill="url(#s1sky)" />
        <circle cx={820} cy={420} r={120} fill="#FFE6C0" opacity={0.35} />
        <path d={poly(far)} fill="#7F93B5" />
        <path d={poly(far)} fill="url(#s1snow)" clipPath="url(#s1farclip)" />
        <path d={poly(midR)} fill="#4E5F80" />
        <path d={poly(midR)} fill="url(#s1snow)" opacity={0.92} clipPath="url(#s1midclip)" />
        <path d={`M520,${880 - 580} L540,700 L700,700 Z`} fill="#2A3556" opacity={0.25} />
        <rect x={-200} y={700} width={W + 400} height={260} fill="url(#s1haze)" />
      </Layer>

      {/* Bahnhofstrasse boutiques */}
      <Layer k={0.5} blur={1.4 + dof * 6}>
        {BOUTIQUES.map((b, bi) => (
          <g key={bi}>
            <path d={`M${b.x + 10},${b.top} L${b.x + b.w - 10},${b.top} L${b.x + b.w - 40},${b.top - 70} L${b.x + 40},${b.top - 70} Z`} fill="#3A3F4A" />
            <path d={`M${b.x + 40},${b.top - 70} L${b.x + b.w - 40},${b.top - 70} L${b.x + b.w - 46},${b.top - 60} L${b.x + 46},${b.top - 60} Z`} fill="#FFFFFF" />
            <rect x={b.x} y={b.top} width={b.w} height={1250 - b.top} fill={b.col} />
            <rect x={b.x - 6} y={b.top - 6} width={b.w + 12} height={16} fill="#EFE7D6" />
            {Array.from({ length: 9 }).map((_, wi) => {
              const r = Math.floor(wi / 3);
              const c = wi % 3;
              const ww = (b.w - 80) / 3 - 20;
              const lit = mod(bi * 7 + r * 3 + c, 5) === 0;
              const wy = b.top + 50 + r * ((1000 - b.top - 50) / 3);
              return (
                <g key={wi}>
                  <rect x={b.x + 40 + c * (ww + 30)} y={wy} width={ww} height={90} fill={lit ? "#F7C873" : "#2A3550"} />
                  <rect x={b.x + 40 + c * (ww + 30)} y={wy} width={ww} height={90} fill="none" stroke="#F5EFE2" strokeWidth={5} />
                  <rect x={b.x + 34 + c * (ww + 30)} y={wy + 92} width={ww + 12} height={7} fill="#EFE7D6" />
                </g>
              );
            })}
            <rect x={b.x + 20} y={1040} width={b.w - 40} height={42} fill="#111" />
            <text x={b.x + b.w / 2} y={1069} textAnchor="middle" fontFamily={HEAD} fontWeight={700} fontSize={24} letterSpacing={5} fill={GOLD}>
              {b.name}
            </text>
            <rect x={b.x + 20} y={1090} width={b.w - 40} height={160} fill="#15110C" />
            <rect x={b.x + 32} y={1102} width={b.w - 64} height={140} fill="url(#s1shop)" opacity={0.9} />
            {[0, 1, 2].map((k) => (
              <g key={k}>
                <rect x={b.x + 60 + k * ((b.w - 120) / 3)} y={1200} width={50} height={42} fill="#2A1C0E" opacity={0.6} />
                <circle cx={b.x + 85 + k * ((b.w - 120) / 3)} cy={1180} r={16} fill="none" stroke="#6B4A1E" strokeWidth={5} />
              </g>
            ))}
          </g>
        ))}
        {/* street lamps */}
        {[140, 980].map((lx) => (
          <g key={lx}>
            <rect x={lx - 6} y={820} width={12} height={480} fill="#1A1A1A" />
            <rect x={lx - 26} y={800} width={52} height={30} rx={6} fill="#1A1A1A" />
            <circle cx={lx} cy={836} r={60} fill="#FFD9A0" opacity={0.35} />
            <circle cx={lx} cy={836} r={16} fill="#FFF3DA" />
          </g>
        ))}
        {/* sidewalk + curb + road */}
        <rect x={-200} y={1250} width={W + 400} height={56} fill="#A9A49B" />
        {Array.from({ length: 16 }).map((_, i) => (
          <line key={i} x1={-100 + i * 90} y1={1250} x2={-120 + i * 90} y2={1304} stroke="#8F8A80" strokeWidth={2} />
        ))}
        <rect x={-200} y={1300} width={W + 400} height={18} fill="#DCD7CD" />
        <rect x={-200} y={1318} width={W + 400} height={H} fill="url(#s1road)" />
        {BOUTIQUES.map((b, bi) => (
          <rect key={bi} x={b.x + 50} y={1330} width={b.w - 100} height={200} fill="#FFD9A0" opacity={0.16} filter="url(#s1soft)" />
        ))}
        <rect x={-200} y={1470} width={W + 400} height={5} fill="#6C6F78" />
        <rect x={-200} y={1530} width={W + 400} height={6} fill="#6C6F78" />
        {Array.from({ length: 9 }).map((_, i) => (
          <ellipse key={i} cx={-40 + i * 150 + mod(i * 37, 50)} cy={1316} rx={60 + mod(i * 13, 30)} ry={11} fill="#F4F7FB" opacity={0.85} />
        ))}
      </Layer>

      {/* hanging winter lights — bokeh */}
      <Layer k={0.7} blur={5 + dof * 6}>
        {hang(0)}
        {hang(1)}
      </Layer>

      {/* supercar at the curb */}
      <Layer k={0.85} blur={0.6 + dof * 6}>
        <Supercar x={-40} y={1336} />
      </Layer>

      {/* the two suits */}
      <Layer k={1} blur={dof * 5}>
        {(() => {
          const ah = { x: rig.hold.x - 112, y: rig.hold.y + 6 };
          const aRest = { x: 230 + 108, y: 1560 - 300 };
          const handA = { x: mix(ah.x, aRest.x, rig.release), y: mix(ah.y, aRest.y, rig.release) };
          const bGrip = { x: rig.hold.x + 112, y: rig.hold.y + 6 };
          const bRest = { x: 850 - 108, y: 1560 - 300 };
          const bReach = { x: mix(bRest.x, bGrip.x, rig.reachB), y: mix(bRest.y, bGrip.y, rig.reachB) };
          const handB = { x: mix(bReach.x, bRest.x, rig.release), y: mix(bReach.y, bRest.y, rig.release) };
          return (
            <>
              <SuitFigure x0={230} fy={1560} suit="#1B2236" tie={CRIMSON} facing={1} hand={handA} t={t} />
              <SuitFigure x0={850} fy={1560} suit="#26262B" tie={GOLD} facing={-1} hand={handB} t={t} />
            </>
          );
        })()}
      </Layer>

      {/* falling snow (near layer) */}
      <Layer k={1.2} blur={1 + dof * 3}>
        {Array.from({ length: 70 }).map((_, i) => {
          const sp = 60 + mod(i * 29, 70);
          const y = mod(i * 211 + t * sp, H + 40) - 20;
          const x = mod(i * 137.5, W) + 20 * Math.sin(t * 0.8 + i);
          return <circle key={i} cx={x} cy={y} r={2 + mod(i, 4)} fill="#FFFFFF" opacity={0.75} />;
        })}
      </Layer>

      {/* DoF darkening so the envelope pops */}
      <AbsoluteFill
        style={{
          opacity: 0.6 * lift,
          background: "radial-gradient(ellipse 60% 45% at 50% 50%, rgba(5,8,18,0.25), rgba(5,8,18,0.85))",
        }}
      />
    </AbsoluteFill>
  );
};

// ---- Envelope (sheet-local coords, flat children of the 3D group) --------
const EnvBack: React.FC<{ envY: number; flapA: number }> = ({ envY, flapA }) => (
  <div style={{ position: "absolute", left: -60, top: envY, width: ENV_W, height: ENV_H }}>
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: "repeating-linear-gradient(45deg, #6E1426 0 14px, #561021 14px 28px)",
        boxShadow: "0 40px 80px rgba(0,0,0,0.55)",
      }}
    />
    {flapA > 90 && (
      <div
        style={{
          position: "absolute",
          left: 0,
          top: -640,
          width: ENV_W,
          height: 640,
          clipPath: "polygon(0 100%, 100% 100%, 50% 0)",
          transformOrigin: "50% 100%",
          transform: `perspective(1800px) rotateX(${-(180 - flapA)}deg)`,
          background: "linear-gradient(0deg, #E9DCBF, #D8C7A2)",
        }}
      >
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(0deg, rgba(0,0,0,0.18), transparent 40%)" }} />
      </div>
    )}
  </div>
);

const EnvFront: React.FC<{ f: number; envY: number; flapA: number; seal: number; fly: number }> = ({ f, envY, flapA, seal, fly }) => (
  <div style={{ position: "absolute", left: -60, top: envY, width: ENV_W, height: ENV_H, opacity: 1 - 0.4 * fly }}>
    <div
      style={{
        position: "absolute",
        inset: 0,
        clipPath: "polygon(0 0, 38% 0, 50% 70px, 62% 0, 100% 0, 100% 100%, 0 100%)",
        background: `linear-gradient(160deg, #F7EEDA, ${CREAM} 55%, #E4D5B4)`,
        boxShadow: `inset 0 0 0 6px ${RIM}`,
      }}
    >
      {/* crimson band (revealed once the flap opens) */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 230, height: 120, background: CRIMSON, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontFamily: MONO, fontSize: 40, letterSpacing: 14, color: CREAM }}>ZÜRICH · SWISS AUDIT · 2026</div>
      </div>
      {/* crimson double rule */}
      <div style={{ position: "absolute", left: 40, right: 40, top: 680, bottom: 40, border: `8px solid ${CRIMSON}` }} />
      <div style={{ position: "absolute", left: 60, right: 60, top: 700, bottom: 60, border: `2px solid ${CRIMSON}` }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 760, textAlign: "center" }}>
        <div style={{ fontFamily: MONO, fontSize: 34, letterSpacing: 8, color: MUTED }}>PRIVAT &amp; VERTRAULICH · ZÜRICH</div>
        <div
          style={{
            display: "inline-block",
            marginTop: 50,
            padding: "10px 30px",
            border: `6px solid ${CRIMSON}`,
            fontFamily: IMPACT,
            fontSize: 150,
            lineHeight: 1,
            letterSpacing: 4,
            color: CRIMSON,
            transform: "rotate(-3deg)",
          }}
        >
          CONFIDENTIAL
        </div>
        <div style={{ marginTop: 80, fontFamily: HEAD, fontWeight: 900, fontSize: 150, color: INK, letterSpacing: 10 }}>AUDIT</div>
        <div style={{ fontFamily: IMPACT, fontSize: 290, lineHeight: 1, color: CRIMSON, letterSpacing: -4 }}>$5,000</div>
        <div style={{ marginTop: 50, display: "flex", justifyContent: "center", gap: 6 }}>
          {Array.from({ length: 42 }).map((_, i) => (
            <div key={i} style={{ width: mod(i * 7, 3) + 3, height: 90, background: INK }} />
          ))}
        </div>
        <div style={{ marginTop: 14, fontFamily: MONO, fontSize: 28, letterSpacing: 6, color: INK }}>Nr. 2026-0417</div>
      </div>
      {/* thickness edge */}
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 22, background: "linear-gradient(0deg, #B9A57E, #D6C49E)" }} />
    </div>
    {flapA <= 90 && (
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: ENV_W,
          height: 640,
          transformOrigin: "50% 0",
          transform: `perspective(1800px) rotateX(${flapA}deg)`,
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            clipPath: "polygon(0 0, 100% 0, 50% 100%)",
            background: `linear-gradient(180deg, #B01E38, #7A0F22)`,
          }}
        />
        {/* gold rim on flap edges */}
        <svg width={ENV_W} height={640} style={{ position: "absolute", inset: 0 }}>
          <path d={`M0,0 L${ENV_W / 2},640 L${ENV_W},0`} fill="none" stroke={RIM} strokeWidth={6} />
        </svg>
        {/* wax seal — cracks before the flap lifts */}
        {[-1, 1].map((side) => (
          <div
            key={side}
            style={{
              position: "absolute",
              left: ENV_W / 2 - 80,
              top: 520,
              width: 160,
              height: 160,
              clipPath: side < 0 ? "inset(0 50% 0 0)" : "inset(0 0 0 50%)",
              transform: `translate(${side * 40 * seal}px, ${30 * seal}px) rotate(${side * 18 * seal}deg)`,
              opacity: 1 - seal,
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: "50%",
                background: `radial-gradient(circle at 38% 32%, #FFE9A8, ${GOLD} 45%, #8A6A1A)`,
                boxShadow: "0 8px 18px rgba(0,0,0,0.45)",
              }}
            />
            <div style={{ position: "absolute", left: 68, top: 36, width: 24, height: 88, background: "#9A7A22" }} />
            <div style={{ position: "absolute", left: 36, top: 68, width: 88, height: 24, background: "#9A7A22" }} />
          </div>
        ))}
      </div>
    )}
  </div>
);

const Scene1Intro: React.FC<{ f: number; from: number }> = ({ f, from }) => {
  const sheet = (
    <Camera gf={f + from}>
      <Scene1 f={f} />
    </Camera>
  );
  // After the fly-in the sheet is exactly the frame: render it flat.
  if (f >= S1_FLY1) return <AbsoluteFill style={{ background: PAPER }}>{sheet}</AbsoluteFill>;

  const rig = s1Rig(f);
  const flapA = rig.flap * 180;
  const rim = rig.pull * (1 - rig.fly);
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <ZurichStreet f={f} rig={rig} />
      <AbsoluteFill style={{ perspective: 2400, perspectiveOrigin: "50% 50%" }}>
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: W,
            height: H,
            transformOrigin: "540px 960px",
            transform: `translate(${rig.gx}px,${rig.gy}px) rotateX(${rig.rx}deg) rotateY(${rig.ry}deg) rotateZ(${rig.rz}deg) scale(${rig.gs})`,
          }}
        >
          <EnvBack envY={rig.envY} flapA={flapA} />
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: W,
              height: H,
              overflow: "hidden",
              background: PAPER,
              boxShadow:
                rim > 0.001
                  ? `0 0 0 ${4 * rim}px rgba(255,210,122,${0.9 * rim}), 0 0 ${70 * rim}px rgba(255,190,90,${0.5 * rim}), 0 -20px 60px rgba(0,0,0,${0.35 * rim})`
                  : "none",
            }}
          >
            {sheet}
          </div>
          <EnvFront f={f} envY={rig.envY} flapA={flapA} seal={rig.seal} fly={rig.fly} />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// -------------------------------------------------------------------------
// Scene 02 — $100 чат-бот, rejected
// -------------------------------------------------------------------------
const Scene2: React.FC<{ f: number }> = ({ f }) => {
  const g0 = SCENES[1];
  const at = (s: number) => s2f(s) - g0;
  const strike = ramp(f, at(13.9), at(14.4), 0, 1, EASE);
  return (
    <>
      <GridBG f={f} />
      <Chrome f={f} idx={2} title="ОШИБКА НОВИЧКА" />
      <Reveal f={f} at={at(8.7)} style={{ position: "absolute", left: 72, top: 250 }}>
        <div style={{ fontFamily: HEAD, fontWeight: 900, fontSize: 96, color: INK, letterSpacing: -3, lineHeight: 1 }}>
          БОЛЬШИНСТВО
        </div>
      </Reveal>
      <Reveal f={f} at={at(9.3)} style={{ position: "absolute", left: 72, top: 350 }}>
        <div style={{ fontFamily: HEAD, fontWeight: 900, fontSize: 96, color: MUTED, letterSpacing: -3, lineHeight: 1 }}>
          НОВИЧКОВ ПРОДАЮТ:
        </div>
      </Reveal>

      {/* Offer card */}
      <div
        style={{
          position: "absolute",
          left: 120,
          top: 560,
          width: W - 240,
          background: "#fff",
          border: `2px solid ${INK}`,
          transform: `translateX(${(1 - ramp(f, at(11.0), at(11.5), 0, 1, EASE)) * 900}px)`,
        }}
      >
        <div style={{ display: "flex", padding: "18px 28px", borderBottom: `2px solid ${INK}` }}>
          <Mono size={22} color={MUTED} style={{ flex: 1 }}>
            ANGEBOT № 001
          </Mono>
          <Mono size={22} color={MUTED}>
            BASIC
          </Mono>
        </div>
        <div style={{ padding: "40px 28px 48px", position: "relative" }}>
          <div style={{ fontFamily: HEAD, fontWeight: 900, fontSize: 92, color: INK, letterSpacing: -2 }}>ЧАТ-БОТ</div>
          <div style={{ fontFamily: IMPACT, fontSize: 210, color: INK, lineHeight: 1 }}>$100</div>
          <Mono size={24} color={MUTED} style={{ marginTop: 14 }}>
            «ОТВЕЧАЕТ НА ВОПРОСЫ 24/7»
          </Mono>
          {/* strike-through */}
          <div
            style={{
              position: "absolute",
              left: 20,
              top: 210,
              height: 18,
              width: (W - 280) * strike,
              background: RED,
              transform: "rotate(-9deg)",
              transformOrigin: "0 50%",
            }}
          />
          <div
            style={{
              position: "absolute",
              left: 20,
              top: 120,
              height: 10,
              width: (W - 280) * ramp(f, at(14.1), at(14.5), 0, 1, EASE),
              background: RED,
              transform: "rotate(9deg)",
              transformOrigin: "0 50%",
            }}
          />
        </div>
      </div>

      {/* reply email */}
      <div
        style={{
          position: "absolute",
          left: 120,
          top: 1180,
          width: W - 240,
          borderLeft: `8px solid ${RED}`,
          background: PAPER_2,
          padding: "22px 28px",
          opacity: ramp(f, at(13.9), at(14.2)),
        }}
      >
        <Mono size={22} color={MUTED}>
          RE: ВАШЕ ПРЕДЛОЖЕНИЕ · 14:02
        </Mono>
        <div style={{ fontFamily: HEAD, fontWeight: 700, fontSize: 40, color: INK, marginTop: 8 }}>
          «Спасибо, нам это не нужно.»
        </div>
      </div>
      <Stamp f={f} at={at(14.5)} text="ОТКАЗ" x={W / 2 + 140} y={900} rot={-14} size={150} />
    </>
  );
};

// -------------------------------------------------------------------------
// Scene 03 — Spreadsheet scan: 3 leaks = $8,000/мес
// -------------------------------------------------------------------------
const ROWS: { name: string; hrs: string; cost: number; leak: boolean }[] = [
  { name: "Маркетинг: посты", hrs: "12 ч", cost: 600, leak: false },
  { name: "Обработка счетов", hrs: "64 ч", cost: 3200, leak: true },
  { name: "Бухгалтерия: сверка", hrs: "8 ч", cost: 400, leak: false },
  { name: "Ответы на заявки", hrs: "52 ч", cost: 2600, leak: true },
  { name: "Встречи / планёрки", hrs: "10 ч", cost: 500, leak: false },
  { name: "Перенос данных", hrs: "44 ч", cost: 2200, leak: true },
  { name: "Склад: остатки", hrs: "6 ч", cost: 300, leak: false },
];

const Scene3: React.FC<{ f: number }> = ({ f }) => {
  const g0 = SCENES[2];
  const at = (s: number) => s2f(s) - g0;
  const top = 560;
  const rowH = 92;
  const scanStart = at(20.3);
  const scanEnd = at(23.4);
  const scanY = interpolate(f, [scanStart, scanEnd], [0, ROWS.length * rowH], clamp);
  const scanning = f >= scanStart && f <= scanEnd + 10;
  const total = interpolate(f, [at(23.9), at(25.2)], [0, 8000], { ...clamp, easing: OUT });
  let leakN = 0;
  return (
    <>
      <GridBG f={f} />
      <Chrome f={f} idx={3} title="УМНЫЙ ПОДХОД" />
      <Reveal f={f} at={at(15.7)} style={{ position: "absolute", left: 72, top: 230 }}>
        <div style={{ fontFamily: HEAD, fontWeight: 900, fontSize: 92, color: INK, letterSpacing: -3, lineHeight: 1 }}>
          ОТКРОЙ ТАБЛИЦЫ.
        </div>
      </Reveal>
      <Reveal f={f} at={at(20.2)} style={{ position: "absolute", left: 72, top: 330 }}>
        <div style={{ fontFamily: HEAD, fontWeight: 900, fontSize: 92, color: RED, letterSpacing: -3, lineHeight: 1 }}>
          НАЙДИ 3 УТЕЧКИ.
        </div>
      </Reveal>

      {/* sheet */}
      <div
        style={{
          position: "absolute",
          left: 72,
          top: top - 70,
          width: W - 144,
          border: `2px solid ${INK}`,
          background: "#fff",
          opacity: ramp(f, at(18.1), at(18.5)),
          transform: `translateY(${(1 - ramp(f, at(18.1), at(18.6), 0, 1, EASE)) * 80}px)`,
        }}
      >
        <div style={{ display: "flex", height: 70, alignItems: "center", background: INK, padding: "0 20px" }}>
          <Mono size={22} color={PAPER} style={{ width: 60 }}>
            #
          </Mono>
          <Mono size={22} color={PAPER} style={{ flex: 1 }}>
            ПРОЦЕСС
          </Mono>
          <Mono size={22} color={PAPER} style={{ width: 120 }}>
            ЧАС/МЕС
          </Mono>
          <Mono size={22} color={PAPER} style={{ width: 170, textAlign: "right" }}>
            $/МЕС
          </Mono>
        </div>
        <div style={{ position: "relative" }}>
          {ROWS.map((r, i) => {
            const passed = scanY > i * rowH + rowH / 2;
            const hit = r.leak && passed;
            if (r.leak && passed) leakN++;
            const n = leakN;
            const rowIn = ramp(f, at(18.4) + i * 4, at(18.4) + i * 4 + 12);
            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  height: rowH,
                  padding: "0 20px",
                  borderBottom: `1px solid ${GRID}`,
                  background: hit ? "rgba(225,29,72,0.09)" : mod(i, 2) === 0 ? "#fff" : "#FAF8F3",
                  opacity: rowIn * (passed && !r.leak ? 0.45 : 1),
                  position: "relative",
                }}
              >
                <Mono size={24} color={hit ? RED : MUTED} style={{ width: 60 }}>
                  {String(i + 1).padStart(2, "0")}
                </Mono>
                <div style={{ flex: 1, fontFamily: HEAD, fontWeight: 700, fontSize: 34, color: INK }}>{r.name}</div>
                <Mono size={24} style={{ width: 120 }}>
                  {r.hrs}
                </Mono>
                <Mono
                  size={28}
                  color={hit ? RED : INK}
                  style={{ width: 170, textAlign: "right", fontWeight: hit ? 700 : 500 }}
                >
                  {hit ? "−" : ""}
                  {money(r.cost)}
                </Mono>
                {hit && (
                  <div
                    style={{
                      position: "absolute",
                      left: -2,
                      top: -2,
                      bottom: -2,
                      border: `4px solid ${RED}`,
                      width: W - 144,
                      pointerEvents: "none",
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        right: -4,
                        top: -30,
                        background: RED,
                        color: "#fff",
                        fontFamily: MONO,
                        fontSize: 20,
                        fontWeight: 700,
                        padding: "4px 12px",
                        letterSpacing: 2,
                      }}
                    >
                      УТЕЧКА {String(n).padStart(2, "0")}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          {scanning && (
            <div style={{ position: "absolute", left: 0, right: 0, top: scanY - 3, height: 6, background: INK }}>
              <div style={{ position: "absolute", right: 0, top: -12, width: 30, height: 30, background: RED }} />
            </div>
          )}
        </div>
      </div>

      {/* Total */}
      <div
        style={{
          position: "absolute",
          left: 72,
          top: top - 70 + 70 + ROWS.length * rowH + 50,
          width: W - 144,
          display: "flex",
          alignItems: "flex-end",
          borderTop: `6px solid ${INK}`,
          paddingTop: 16,
          opacity: ramp(f, at(23.8), at(24.0)),
        }}
      >
        <div style={{ flex: 1 }}>
          <Mono size={24} color={MUTED}>
            Σ 3 ПРОЦЕССА · РУЧНОЙ ТРУД
          </Mono>
          <Mono size={24} color={MUTED}>
            СЖИГАЕТСЯ КАЖДЫЙ МЕСЯЦ
          </Mono>
        </div>
        <div style={{ fontFamily: IMPACT, fontSize: 150, color: RED, lineHeight: 0.9 }}>
          {money(total)}
          <span style={{ fontSize: 60, color: INK }}>/МЕС</span>
        </div>
      </div>
    </>
  );
};

// -------------------------------------------------------------------------
// Scene 04 — 3 process cards → agent map
// -------------------------------------------------------------------------
const CARDS = [
  { t: "СЧЕТА", sub: "PDF → учёт", at: 28.08, cost: 3200 },
  { t: "ЗАЯВКИ", sub: "ответ < 1 мин", at: 29.76, cost: 2600 },
  { t: "ДАННЫЕ", sub: "CRM ⇄ таблицы", at: 31.72, cost: 2200 },
];

const Scene4: React.FC<{ f: number }> = ({ f }) => {
  const g0 = SCENES[3];
  const at = (s: number) => s2f(s) - g0;
  const mapP = ramp(f, at(34.2), at(35.0), 0, 1, EASE);
  const hub = { x: W / 2, y: 1010 };
  // Card layout: stacked list → map positions
  const listPos = (i: number) => ({ x: 72, y: 470 + i * 200, w: W - 144, h: 170 });
  const mapPos = (i: number) => {
    const ang = -Math.PI / 2 + (mod(i, 3) - 1) * 1.15;
    return {
      x: hub.x + Math.cos(ang) * 0 + (mod(i, 3) - 1) * 330 - 150,
      y: 560 + (i === 1 ? -40 : 60) + Math.sin(ang) * 0,
      w: 300,
      h: 170,
    };
  };
  const lerp = (a: number, b: number) => a + (b - a) * mapP;
  const outs = ["УЧЁТ", "CRM", "ОТЧЁТ"];
  return (
    <>
      <GridBG f={f} />
      <Chrome f={f} idx={4} title="КАРТА АВТОМАТИЗАЦИИ" />
      <Reveal f={f} at={at(28.1)} style={{ position: "absolute", left: 72, top: 240 }}>
        <div style={{ fontFamily: HEAD, fontWeight: 900, fontSize: 84, color: INK, letterSpacing: -3, lineHeight: 1 }}>
          {mapP < 0.5 ? "3 ПРОЦЕССА" : "20 МИНУТ → КАРТА"}
        </div>
      </Reveal>
      <Rule f={f} at={at(28.3)} x={72} y={340} w={180} h={10} color={RED} />

      {/* connectors */}
      <svg style={{ position: "absolute", left: 0, top: 0 }} width={W} height={H}>
        {CARDS.map((_, i) => {
          const p = mapPos(i);
          const p2 = ramp(f, at(35.0) + i * 8, at(35.6) + i * 8, 0, 1, EASE);
          const x1 = p.x + p.w / 2;
          const y1 = p.y + p.h;
          const len = Math.hypot(hub.x - x1, hub.y - 90 - y1);
          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={hub.x}
              y2={hub.y - 90}
              stroke={INK}
              strokeWidth={4}
              strokeDasharray={`${len * p2} ${len}`}
            />
          );
        })}
        {outs.map((_, i) => {
          const p2 = ramp(f, at(37.0) + i * 8, at(37.6) + i * 8, 0, 1, EASE);
          const x2 = 220 + i * 320;
          const y2 = 1260;
          const len = Math.hypot(x2 - hub.x, y2 - (hub.y + 90));
          return (
            <line
              key={"o" + i}
              x1={hub.x}
              y1={hub.y + 90}
              x2={x2}
              y2={y2}
              stroke={RED}
              strokeWidth={4}
              strokeDasharray={`${len * p2} ${len}`}
            />
          );
        })}
        {/* moving data packets */}
        {f > at(36.2) &&
          CARDS.map((_, i) => {
            const p = mapPos(i);
            const t = mod((f - at(36.2)) / 50 + i / 3, 1);
            const x1 = p.x + p.w / 2;
            const y1 = p.y + p.h;
            return (
              <rect
                key={"pk" + i}
                x={x1 + (hub.x - x1) * t - 8}
                y={y1 + (hub.y - 90 - y1) * t - 8}
                width={16}
                height={16}
                fill={RED}
              />
            );
          })}
      </svg>

      {/* cards */}
      {CARDS.map((c, i) => {
        const a = listPos(i);
        const b = mapPos(i);
        const inP = ramp(f, at(c.at), at(c.at) + 14, 0, 1, EASE);
        const x = lerp(a.x, b.x);
        const y = lerp(a.y, b.y);
        const w = lerp(a.w, b.w);
        const h = lerp(a.h, b.h);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x + (1 - inP) * -1100,
              top: y,
              width: w,
              height: h,
              background: "#fff",
              border: `3px solid ${INK}`,
              boxShadow: `10px 10px 0 ${i === 0 ? RED : INK}`,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              padding: "0 26px",
              overflow: "hidden",
            }}
          >
            <div style={{ display: "flex", alignItems: "baseline", gap: 18 }}>
              <Mono size={26} color={RED} style={{ fontWeight: 700 }}>
                {String(i + 1).padStart(2, "0")}
              </Mono>
              <div style={{ fontFamily: IMPACT, fontSize: lerp(86, 58), color: INK, letterSpacing: 1 }}>{c.t}</div>
              <div style={{ flex: 1 }} />
              {mapP < 0.5 && (
                <Mono size={30} color={RED} style={{ fontWeight: 700, opacity: 1 - mapP * 2 }}>
                  −{money(c.cost)}
                </Mono>
              )}
            </div>
            <Mono size={22} color={MUTED}>
              {c.sub}
            </Mono>
          </div>
        );
      })}

      {/* Agent hub */}
      {mapP > 0 && (
        <div
          style={{
            position: "absolute",
            left: hub.x - 180,
            top: hub.y - 90,
            width: 360,
            height: 180,
            background: INK,
            transform: `scaleY(${ramp(f, at(34.6), at(35.1), 0, 1, EASE)})`,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Mono size={22} color={GRID}>
            NODE · 01
          </Mono>
          <div style={{ fontFamily: IMPACT, fontSize: 80, color: PAPER, letterSpacing: 4 }}>AI-АГЕНТ</div>
          <div
            style={{
              position: "absolute",
              right: 14,
              top: 14,
              width: 18,
              height: 18,
              background: mod(Math.floor(f / 20), 2) === 0 ? RED : GRID,
            }}
          />
        </div>
      )}
      {outs.map((o, i) => (
        <div
          key={o}
          style={{
            position: "absolute",
            left: 220 + i * 320 - 120,
            top: 1260,
            width: 240,
            padding: "14px 0",
            textAlign: "center",
            border: `3px solid ${RED}`,
            background: PAPER,
            opacity: ramp(f, at(37.4) + i * 8, at(37.7) + i * 8),
          }}
        >
          <Mono size={26} color={RED} style={{ fontWeight: 700 }}>
            {o} ✓
          </Mono>
        </div>
      ))}

      {/* director memo */}
      <div
        style={{
          position: "absolute",
          left: 72,
          top: 1370,
          width: W - 144,
          display: "flex",
          alignItems: "center",
          background: "#fff",
          border: `2px solid ${INK}`,
          padding: "18px 26px",
          transform: `translateY(${(1 - ramp(f, at(38.7), at(39.1), 0, 1, EASE)) * 40}px)`,
          opacity: ramp(f, at(38.7), at(39.0)),
        }}
      >
        <Mono size={22} color={MUTED} style={{ flex: 1 }}>
          ДИРЕКТОРУ · ЭКОНОМИЯ
          <br />С 1-ГО МЕСЯЦА
        </Mono>
        <div style={{ fontFamily: IMPACT, fontSize: 84, color: RED }}>
          +{money(interpolate(f, [at(40.6), at(41.8)], [0, 8000], { ...clamp, easing: OUT }))}
        </div>
      </div>
    </>
  );
};

// -------------------------------------------------------------------------
// Scene 05 — НЕ ЗА КОД — ЗА ЭКОНОМИЮ (ROI bars)
// -------------------------------------------------------------------------
const Scene5: React.FC<{ f: number }> = ({ f }) => {
  const g0 = SCENES[4];
  const at = (s: number) => s2f(s) - g0;
  const base = 1440;
  const maxH = 760;
  const bars = [
    { label: "КОД", val: 5000, note: "РАЗОВО", color: INK, at: at(43.5) },
    { label: "ЭКОНОМИЯ / ГОД", val: 96000, note: "$8,000 × 12", color: RED, at: at(44.8) },
  ];
  const maxV = 96000;
  return (
    <>
      <GridBG f={f} step={60} />
      <Chrome f={f} idx={5} title="ЛОГИКА ЦЕНЫ" />
      <div style={{ position: "absolute", left: 72, top: 230 }}>
        <Reveal f={f} at={at(42.9)} dur={10}>
          <div style={{ fontFamily: HEAD, fontWeight: 900, fontSize: 110, color: INK, letterSpacing: -4, lineHeight: 1 }}>
            <span style={{ textDecoration: `line-through ${RED} 10px` }}>НЕ ЗА КОД</span>
          </div>
        </Reveal>
        <Reveal f={f} at={at(44.6)} dur={10}>
          <div style={{ fontFamily: HEAD, fontWeight: 900, fontSize: 110, color: RED, letterSpacing: -4, lineHeight: 1.05 }}>
            — ЗА ЭКОНОМИЮ
          </div>
        </Reveal>
      </div>
      {/* axis */}
      <Rule f={f} at={at(43.0)} x={72} y={base} w={W - 144} h={4} />
      {[0.25, 0.5, 0.75, 1].map((t, i) => (
        <div key={i} style={{ position: "absolute", left: 72, top: base - maxH * t, width: W - 144, borderTop: `1px dashed ${GRID}` }}>
          <Mono size={18} color={MUTED} style={{ position: "absolute", right: 0, top: -26 }}>
            {money(maxV * t)}
          </Mono>
        </div>
      ))}
      {bars.map((b, i) => {
        const p = ramp(f, b.at, b.at + 26, 0, 1, EASE);
        const h = Math.max(8, (b.val / maxV) * maxH * p);
        const x = 160 + i * 440;
        return (
          <div key={i}>
            <div style={{ position: "absolute", left: x, top: base - h, width: 300, height: h, background: b.color }} />
            <div
              style={{
                position: "absolute",
                left: x,
                top: base - h - 90,
                fontFamily: IMPACT,
                fontSize: 72,
                color: b.color,
                opacity: p,
              }}
            >
              {money(b.val * p)}
            </div>
            <div style={{ position: "absolute", left: x, top: base + 18 }}>
              <Mono size={26} style={{ fontWeight: 700 }}>
                {String(i + 1).padStart(2, "0")} {b.label}
              </Mono>
              <Mono size={20} color={MUTED}>
                {b.note}
              </Mono>
            </div>
          </div>
        );
      })}
      <div
        style={{
          position: "absolute",
          left: 160,
          top: 620,
          background: INK,
          color: PAPER,
          padding: "14px 24px",
          opacity: ramp(f, at(45.6), at(45.8)),
        }}
      >
        <Mono size={22} color={GRID}>
          ROI · 12 МЕС
        </Mono>
        <div style={{ fontFamily: IMPACT, fontSize: 76, color: PAPER }}>×19</div>
      </div>
    </>
  );
};

// -------------------------------------------------------------------------
// Scene 06 — CTA → cinematic 3D pull-back: the Swiss invoice sheet is lying
// on an executive desk in an alpine private-bank office at dusk.
// -------------------------------------------------------------------------
const S6_PERSP = 2000;
const S6_INK_BLUE = "#1B2A6B";
const GOLD = "#D4AF37";

// Camera rig for Scene 6 (local frames). p = 0 → sheet fills screen 1:1.
const s6Cam = (f: number) => {
  const at = (s: number) => s2f(s) - SCENES[5];
  const p1 = ramp(f, 16, at(48.9), 0, 1, Easing.bezier(0.45, 0, 0.55, 1));
  const p2 = ramp(f, at(48.9), at(51.9), 0, 1, EASE);
  const hold = Math.max(0, f - at(51.9)) / FPS;
  const p = 0.12 * p1 + 0.88 * p2;
  return {
    p,
    z: 2050 * p + hold * 60,
    rx: 36 * p + hold * 0.4,
    rz: -7 * p - hold * 0.8,
    tx: -10 * p + 6 * Math.sin(f / 70),
    ty: 150 * p + 4 * Math.cos(f / 80),
  };
};

// Signature curve on the sheet (sheet-local px), u ∈ [0,1]
const sigPoint = (u: number) => {
  const env = 0.55 + 0.45 * Math.sin(u * Math.PI);
  return {
    x: 560 + 400 * u + 26 * Math.sin(u * Math.PI * 2 * 5.5),
    y: 1452 - 34 * env * Math.sin(u * Math.PI * 2 * 5.5 + 0.7) - 18 * u,
  };
};
const SIG_N = 180;

// ---- Alpine dusk window view (screen space, behind the 3D world) --------
const ridge = (seed: number, base: number, amp: number, peaks: [number, number][]) => {
  // peaks: [x, height]; builds a jagged ridge line across W+200
  const pts: string[] = [];
  for (let x = -100; x <= W + 100; x += 18) {
    let h = 0;
    for (const [px, ph] of peaks) h = Math.max(h, ph * Math.max(0, 1 - Math.abs(x - px) / (ph * 1.35)));
    h += amp * (Math.sin(x * 0.031 + seed) * 0.5 + Math.sin(x * 0.087 + seed * 2.1) * 0.3 + Math.sin(x * 0.19 + seed * 3.7) * 0.2);
    pts.push(`${x},${(base - h).toFixed(1)}`);
  }
  return pts;
};

const AlpineRoom: React.FC<{ f: number; p: number }> = ({ f, p }) => {
  const horizon = 560;
  const far = ridge(1.3, horizon, 26, [[120, 250], [470, 300], [880, 270], [1120, 230]]);
  const mid = ridge(4.1, horizon + 40, 22, [[300, 330], [690, 470], [980, 300]]);
  const near = ridge(7.7, horizon + 110, 16, [[60, 210], [420, 160], [860, 220]]);
  // jagged snow line so caps melt into rock instead of a flat cut
  const snowBand = (limit: number, seed: number) => {
    const pts: string[] = [];
    for (let x = -100; x <= W + 100; x += 14) {
      const y = limit + 26 * Math.sin(x * 0.09 + seed) + 16 * Math.sin(x * 0.23 + seed * 3) + 10 * Math.sin(x * 0.51 + seed);
      pts.push(`${x},${y.toFixed(1)}`);
    }
    return `M-100,-10 L${pts.join(" L")} L${W + 100},-10 Z`;
  };
  const poly = (pts: string[], bottom = H) => `M-100,${bottom} L${pts.join(" L")} L${W + 100},${bottom} Z`;
  // snow caps: same ridge clipped to a band under the peaks
  const scale = 1.32 - 0.32 * p;
  const blur = 1.5 + 4 * p;
  const mullions = [0, 270, 540, 810, 1080];
  return (
    <AbsoluteFill style={{ background: "#0B0705", overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `translateY(${-40 * p}px) scale(${scale})`, transformOrigin: "50% 30%", filter: `blur(${blur}px)` }}>
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
          <defs>
            <linearGradient id="s6sky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#070B22" />
              <stop offset="0.06" stopColor="#141C46" />
              <stop offset="0.12" stopColor="#3A2E62" />
              <stop offset="0.18" stopColor="#8A4A6E" />
              <stop offset="0.24" stopColor="#E07A5A" />
              <stop offset="0.29" stopColor="#F6B46E" />
              <stop offset="1" stopColor="#F6B46E" />
            </linearGradient>
            <linearGradient id="s6snow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#FFE2D6" />
              <stop offset="1" stopColor="#C9A3C4" />
            </linearGradient>
            <linearGradient id="s6mist" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="rgba(246,180,110,0)" />
              <stop offset="1" stopColor="rgba(246,180,110,0.55)" />
            </linearGradient>
            <clipPath id="s6snowclip">
              <path d={snowBand(horizon - 220, 1)} />
            </clipPath>
            <clipPath id="s6snowclip2">
              <path d={snowBand(horizon - 250, 2)} />
            </clipPath>
          </defs>
          <rect x={-100} y={0} width={W + 200} height={H} fill="url(#s6sky)" />
          {/* stars */}
          {Array.from({ length: 40 }).map((_, i) => {
            const x = mod(i * 137.5, W);
            const y = mod(i * 71.3, 330);
            const tw = 0.4 + 0.4 * Math.sin(f / 20 + i);
            return <circle key={i} cx={x} cy={y} r={i % 5 === 0 ? 2.2 : 1.3} fill="#fff" opacity={tw * (1 - y / 420)} />;
          })}
          {/* evening star + thin moon */}
          <circle cx={820} cy={210} r={26} fill="#FFF4DA" opacity={0.9} />
          <circle cx={832} cy={202} r={24} fill="#141C46" />
          {/* far range */}
          <path d={poly(far)} fill="#6A5785" opacity={0.85} />
          <path d={poly(far)} fill="url(#s6snow)" opacity={0.55} clipPath="url(#s6snowclip)" />
          {/* mid range: sharp pyramid peak */}
          <path d={poly(mid)} fill="#4A3F72" />
          <path d={poly(mid)} fill="url(#s6snow)" clipPath="url(#s6snowclip2)" />
          {/* shadowed east faces of the main peaks */}
          <path d={`M690,${horizon + 40 - 470} L700,${horizon - 60} L860,${horizon - 60} Z`} fill="#2A2550" opacity={0.45} />
          <path d={`M300,${horizon + 40 - 330} L310,${horizon - 40} L420,${horizon - 40} Z`} fill="#2A2550" opacity={0.35} />
          {/* valley mist */}
          <rect x={-100} y={horizon - 120} width={W + 200} height={260} fill="url(#s6mist)" />
          {/* near range: dark forested slopes */}
          <path d={poly(near)} fill="#1B1E3A" />
          {/* chalet lights in the valley */}
          {Array.from({ length: 14 }).map((_, i) => (
            <circle
              key={i}
              cx={60 + mod(i * 211, W - 120)}
              cy={horizon + 150 + mod(i * 37, 90)}
              r={2.6}
              fill="#FFD27A"
              opacity={0.6 + 0.4 * Math.sin(f / 13 + i * 2)}
            />
          ))}
        </svg>
        {/* glass reflections */}
        <AbsoluteFill
          style={{
            background:
              "linear-gradient(115deg, transparent 20%, rgba(255,255,255,0.07) 26%, transparent 31%, transparent 58%, rgba(255,255,255,0.05) 62%, transparent 66%)",
          }}
        />
        {/* bronze window mullions + transom (floor-to-ceiling glazing) */}
        {mullions.map((x, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x - 11,
              top: 0,
              width: 22,
              height: H,
              background: "linear-gradient(90deg, #120C08, #3A2A1C 45%, #120C08)",
            }}
          />
        ))}
        <div style={{ position: "absolute", left: 0, top: 40, width: W, height: 18, background: "linear-gradient(180deg, #120C08, #3A2A1C, #120C08)" }} />
        {/* interior lamp bokeh */}
        {[
          [90, 1040, 120, 0.35],
          [990, 980, 90, 0.3],
          [200, 380, 60, 0.18],
          [930, 520, 70, 0.16],
        ].map(([x, y, r, o], i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x - r,
              top: y - r,
              width: r * 2,
              height: r * 2,
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(255,196,110,0.9), rgba(255,170,80,0.35) 55%, transparent 72%)",
              opacity: o * (0.85 + 0.15 * Math.sin(f / 30 + i)),
            }}
          />
        ))}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ---- Desk props (world space, preserve-3d) ------------------------------
const Espresso: React.FC<{ x: number; y: number; f: number; rx: number; rz: number }> = ({ x, y, f, rx, rz }) => {
  const R = 120; // cup radius
  const rings = 12;
  return (
    <div style={{ position: "absolute", left: x, top: y, width: 0, height: 0, transformStyle: "preserve-3d" }}>
      {/* saucer shadow + saucer */}
      <div style={{ position: "absolute", left: -200, top: -180, width: 420, height: 420, borderRadius: "50%", background: "rgba(0,0,0,0.55)", filter: "blur(22px)", transform: "translateZ(1px)" }} />
      <div
        style={{
          position: "absolute",
          left: -190,
          top: -190,
          width: 380,
          height: 380,
          borderRadius: "50%",
          background: "radial-gradient(circle at 38% 34%, #FFFFFF, #E9E4DA 55%, #B9B1A3 100%)",
          boxShadow: "inset 0 0 0 10px #F7F4EE, inset 0 0 0 14px #CFC7B8",
          transform: "translateZ(3px)",
        }}
      />
      {/* handle */}
      <div
        style={{
          position: "absolute",
          left: R - 18,
          top: -34,
          width: 110,
          height: 68,
          borderRadius: 34,
          border: "18px solid #F2EEE6",
          boxSizing: "border-box",
          transform: "translateZ(50px)",
          boxShadow: "0 0 0 2px #CFC7B8",
        }}
      />
      {/* cup walls — stacked rings fake a porcelain cylinder */}
      {Array.from({ length: rings }).map((_, i) => {
        const r = R - 6 + (i / rings) * 10;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: -r,
              top: -r,
              width: r * 2,
              height: r * 2,
              borderRadius: "50%",
              background: i === 0 ? "#D8D1C4" : "transparent",
              border: `10px solid ${i < 3 ? "#CFC7B8" : "#F4F1EA"}`,
              boxSizing: "border-box",
              transform: `translateZ(${6 + i * 7}px)`,
            }}
          />
        );
      })}
      {/* rim + crema */}
      <div
        style={{
          position: "absolute",
          left: -R - 4,
          top: -R - 4,
          width: (R + 4) * 2,
          height: (R + 4) * 2,
          borderRadius: "50%",
          border: "12px solid #FFFFFF",
          boxSizing: "border-box",
          background: "radial-gradient(circle at 45% 42%, #E6B472, #B97835 35%, #6B3A16 70%, #3A1C08)",
          transform: `translateZ(${6 + rings * 7}px)`,
        }}
      />
      {/* steam — billboards facing the camera */}
      {[0, 1, 2].map((k) => {
        const t = mod(f / 110 + k / 3, 1);
        const sway = Math.sin(f / 26 + k * 2) * 26;
        return (
          <div
            key={k}
            style={{
              position: "absolute",
              left: -90 + k * 40 + sway,
              top: -560,
              width: 140,
              height: 560,
              transformOrigin: "50% 100%",
              transform: `translateZ(${6 + rings * 7 + 4}px) rotateZ(${-rz}deg) rotateX(${-rx}deg) translateY(${-t * 180}px)`,
              opacity: Math.sin(t * Math.PI) * 0.55 * Math.min(1, rx / 10),
              filter: "blur(10px)",
            }}
          >
            <svg width={140} height={560} viewBox="0 0 140 560">
              <path
                d={`M70,560 C${20 + k * 10},460 ${120 - k * 8},380 70,300 S${30 + k * 6},150 ${80 - k * 6},0`}
                stroke="rgba(255,250,240,0.9)"
                strokeWidth={26 - k * 5}
                fill="none"
                strokeLinecap="round"
              />
            </svg>
          </div>
        );
      })}
    </div>
  );
};

const SwissWatch: React.FC<{ x: number; y: number; f: number; gf: number }> = ({ x, y, f, gf }) => {
  const R = 150;
  const sec = (gf / FPS) * 6; // sweeping seconds
  const min = 8 * 6 + sec / 60;
  const hr = 10 * 30 + min / 12;
  const hand = (deg: number, len: number, w: number, color: string, z: number) => (
    <div
      style={{
        position: "absolute",
        left: -w / 2,
        top: -len,
        width: w,
        height: len + 18,
        background: color,
        borderRadius: w,
        transformOrigin: `50% ${len}px`,
        transform: `translateZ(${z}px) rotate(${deg}deg)`,
        boxShadow: "0 2px 3px rgba(0,0,0,0.4)",
      }}
    />
  );
  return (
    <div style={{ position: "absolute", left: x, top: y, width: 0, height: 0, transformStyle: "preserve-3d", transform: "rotate(18deg)" }}>
      {/* strap */}
      <div style={{ position: "absolute", left: -72, top: -460, width: 144, height: 920, borderRadius: 40, background: "linear-gradient(90deg, #2B160B, #5A3218 50%, #2B160B)", boxShadow: "0 0 0 2px #1A0C05, 0 30px 50px rgba(0,0,0,0.6)", transform: "translateZ(1px)" }} />
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} style={{ position: "absolute", left: -10, top: 250 + i * 40, width: 20, height: 20, borderRadius: "50%", background: "#140A04", transform: "translateZ(2px)" }} />
      ))}
      {/* case shadow */}
      <div style={{ position: "absolute", left: -R, top: -R + 20, width: R * 2, height: R * 2, borderRadius: "50%", background: "rgba(0,0,0,0.6)", filter: "blur(16px)", transform: "translateZ(2px)" }} />
      {/* case thickness */}
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} style={{ position: "absolute", left: -R, top: -R, width: R * 2, height: R * 2, borderRadius: "50%", background: i % 2 ? "#8E8A84" : "#B8B4AE", transform: `translateZ(${4 + i * 5}px)` }} />
      ))}
      {/* crown */}
      <div style={{ position: "absolute", left: R - 6, top: -18, width: 34, height: 36, borderRadius: 6, background: "repeating-linear-gradient(0deg, #D9D5CE 0 4px, #8E8A84 4px 7px)", transform: "translateZ(18px)" }} />
      {/* polished bezel */}
      <div style={{ position: "absolute", left: -R, top: -R, width: R * 2, height: R * 2, borderRadius: "50%", background: "conic-gradient(from 210deg, #F4F2EE, #8C8882, #E8E5E0, #7A766F, #F4F2EE)", transform: "translateZ(34px)" }} />
      {/* guilloché dial */}
      <div
        style={{
          position: "absolute",
          left: -R + 18,
          top: -R + 18,
          width: (R - 18) * 2,
          height: (R - 18) * 2,
          borderRadius: "50%",
          background:
            "repeating-radial-gradient(circle, #13233F 0 2px, #1A2E52 2px 4px), radial-gradient(circle, #1A2E52, #0C1628)",
          backgroundBlendMode: "overlay",
          transform: "translateZ(35px)",
        }}
      >
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: R - 18 - 4,
              top: 8,
              width: 8,
              height: i % 3 === 0 ? 30 : 18,
              background: GOLD,
              transformOrigin: `4px ${R - 18 - 8}px`,
              transform: `rotate(${i * 30}deg)`,
            }}
          />
        ))}
        <div style={{ position: "absolute", left: 0, right: 0, top: 70, textAlign: "center", fontFamily: HEAD, fontWeight: 700, fontSize: 14, letterSpacing: 4, color: GOLD }}>
          ✚ GENÈVE
        </div>
      </div>
      <div style={{ position: "absolute", left: 0, top: 0, width: 0, height: 0, transformStyle: "preserve-3d" }}>
        {hand(hr, 72, 12, GOLD, 37)}
        {hand(min, 108, 8, GOLD, 38)}
        {hand(sec, 116, 3, RED, 39)}
        <div style={{ position: "absolute", left: -9, top: -9, width: 18, height: 18, borderRadius: "50%", background: GOLD, transform: "translateZ(40px)" }} />
      </div>
      {/* sapphire glare */}
      <div style={{ position: "absolute", left: -R + 18, top: -R + 18, width: (R - 18) * 2, height: (R - 18) * 2, borderRadius: "50%", background: "linear-gradient(135deg, rgba(255,255,255,0.28), transparent 40%)", transform: "translateZ(41px)" }} />
    </div>
  );
};

// Fountain pen: nib at (0,0), body extends along +x, rotated by `ang`
const PenShape: React.FC<{ ang: number; shadow?: boolean }> = ({ ang, shadow }) => (
  <div style={{ position: "absolute", left: 0, top: 0, transformOrigin: "0 0", transform: `rotate(${ang}deg)` }}>
    {shadow ? (
      <div style={{ position: "absolute", left: 10, top: -16, width: 560, height: 32, borderRadius: 16, background: "rgba(0,0,0,0.55)", filter: "blur(10px)" }} />
    ) : (
      <>
        {/* gold nib */}
        <div style={{ position: "absolute", left: 0, top: -12, width: 70, height: 24, background: "linear-gradient(180deg, #F6DE8A, #C9982E 60%, #8A6418)", clipPath: "polygon(0 50%, 100% 0, 100% 100%)" }} />
        <div style={{ position: "absolute", left: 6, top: -1, width: 50, height: 2, background: "#5A3E0E" }} />
        {/* grip */}
        <div style={{ position: "absolute", left: 66, top: -17, width: 90, height: 34, borderRadius: 8, background: "linear-gradient(180deg, #3A3A3A, #0A0A0A 55%, #2A2A2A)" }} />
        <div style={{ position: "absolute", left: 152, top: -19, width: 12, height: 38, background: "linear-gradient(180deg, #F6DE8A, #B8862A)" }} />
        {/* lacquer barrel */}
        <div style={{ position: "absolute", left: 162, top: -21, width: 360, height: 42, borderRadius: "6px 21px 21px 6px", background: "linear-gradient(180deg, #4A4A52, #0C0C10 40%, #050507 70%, #2A2A30)" }} />
        <div style={{ position: "absolute", left: 300, top: -22, width: 16, height: 44, background: "linear-gradient(180deg, #F6DE8A, #B8862A)" }} />
        {/* clip */}
        <div style={{ position: "absolute", left: 330, top: -6, width: 170, height: 12, borderRadius: 6, background: "linear-gradient(180deg, #FBEAA6, #C9982E)" }} />
        <div style={{ position: "absolute", left: 180, top: -16, width: 330, height: 6, borderRadius: 3, background: "rgba(255,255,255,0.22)" }} />
      </>
    )}
  </div>
);

const Scene6Sheet: React.FC<{ f: number }> = ({ f }) => {
  const g0 = SCENES[5];
  const at = (s: number) => s2f(s) - g0;
  const typed = "аудит";
  const nChars = Math.floor(interpolate(f, [at(48.1), at(48.9)], [0, typed.length], clamp));
  const caret = mod(Math.floor(f / 18), 2) === 0;
  const sigP = ramp(f, at(50.2), at(51.6), 0, 1, Easing.bezier(0.3, 0, 0.7, 1));
  const nSig = Math.floor(sigP * SIG_N);
  const sigPts = Array.from({ length: nSig + 1 }).map((_, i) => {
    const q = sigPoint(i / SIG_N);
    return `${q.x.toFixed(1)},${q.y.toFixed(1)}`;
  });
  return (
    <>
      <GridBG f={f} />
      <Chrome f={f} idx={6} title="ДЕЙСТВИЕ" />
      <div style={{ position: "absolute", left: 72, top: 260 }}>
        <Reveal f={f} at={at(46.9)} dur={12}>
          <div style={{ fontFamily: IMPACT, fontSize: 210, color: INK, lineHeight: 0.95, letterSpacing: 2 }}>НАПИШИ</div>
        </Reveal>
        <div
          style={{
            marginTop: 20,
            display: "inline-block",
            background: RED,
            padding: "6px 36px 14px",
            clipPath: `inset(0 ${(1 - ramp(f, at(47.4), at(47.8), 0, 1, EASE)) * 100}% 0 0)`,
          }}
        >
          <div style={{ fontFamily: IMPACT, fontSize: 250, color: PAPER, lineHeight: 1, letterSpacing: 6 }}>АУДИТ</div>
        </div>
      </div>

      {/* RECHNUNG line */}
      <div
        style={{
          position: "absolute",
          left: 72,
          right: 72,
          top: 792,
          display: "flex",
          alignItems: "center",
          borderTop: `3px solid ${INK}`,
          paddingTop: 16,
          opacity: ramp(f, at(47.8), at(48.1)),
        }}
      >
        <div style={{ width: 40, height: 40, background: RED, position: "relative", marginRight: 18 }}>
          <div style={{ position: "absolute", left: 16, top: 7, width: 8, height: 26, background: "#fff" }} />
          <div style={{ position: "absolute", left: 7, top: 16, width: 26, height: 8, background: "#fff" }} />
        </div>
        <Mono size={24} color={INK} style={{ flex: 1, fontWeight: 700 }}>
          RECHNUNG Nr. 2026-06
        </Mono>
        <Mono size={24} color={MUTED} style={{ marginRight: 18 }}>
          АУДИТ
        </Mono>
        <div style={{ fontFamily: HEAD, fontWeight: 900, fontSize: 52, color: INK, letterSpacing: -1 }}>$5,000</div>
      </div>

      {/* comment field */}
      <div
        style={{
          position: "absolute",
          left: 72,
          top: 900,
          width: W - 144,
          border: `3px solid ${INK}`,
          background: "#fff",
          display: "flex",
          alignItems: "center",
          padding: "26px 30px",
          opacity: ramp(f, at(48.0), at(48.2)),
        }}
      >
        <Mono size={22} color={MUTED} style={{ width: 230 }}>
          КОММЕНТАРИЙ:
        </Mono>
        <div style={{ flex: 1, fontFamily: HEAD, fontWeight: 700, fontSize: 52, color: INK }}>
          {typed.slice(0, nChars)}
          <span style={{ display: "inline-block", width: 4, height: 50, background: caret ? RED : "transparent", marginLeft: 4 }} />
        </div>
        <div style={{ background: nChars >= typed.length ? RED : GRID, color: "#fff", padding: "12px 22px" }}>
          <Mono size={24} color="#fff" style={{ fontWeight: 700 }}>
            ОТПРАВИТЬ →
          </Mono>
        </div>
      </div>

      {/* template doc */}
      <div
        style={{
          position: "absolute",
          left: 72,
          top: 1070,
          width: 440,
          background: "#fff",
          border: `2px solid ${INK}`,
          boxShadow: `12px 12px 0 ${INK}`,
          transform: `translateY(${(1 - ramp(f, at(49.7), at(50.3), 0, 1, EASE)) * 900}px) rotate(-2deg)`,
        }}
      >
        <div style={{ display: "flex", padding: "14px 18px", borderBottom: `2px solid ${INK}` }}>
          <Mono size={18} color={RED} style={{ flex: 1, fontWeight: 700 }}>
            ШАБЛОН РАЗБОРА.PDF
          </Mono>
          <Mono size={18} color={MUTED}>
            06 стр.
          </Mono>
        </div>
        {["01  Поиск утечек", "02  Карта агентов", "03  Расчёт ROI"].map((t, i) => (
          <div key={i} style={{ padding: "12px 18px", borderBottom: `1px solid ${GRID}`, opacity: ramp(f, at(50.3) + i * 6, at(50.5) + i * 6) }}>
            <Mono size={22}>{t}</Mono>
          </div>
        ))}
      </div>

      {/* signature block */}
      <div style={{ position: "absolute", left: 560, top: 1250, width: 448, opacity: ramp(f, at(49.4), at(49.8)) }}>
        <Mono size={18} color={MUTED}>
          VERTRAG · АУДИТ · $5,000
        </Mono>
        <div style={{ fontFamily: HEAD, fontWeight: 900, fontSize: 40, color: INK, marginTop: 6 }}>ДОГОВОР ПОДПИСАН</div>
        <div style={{ position: "absolute", left: 0, top: 236, width: 448, height: 3, background: INK }} />
        <Mono size={16} color={MUTED} style={{ position: "absolute", left: 0, top: 250 }}>
          UNTERSCHRIFT / ПОДПИСЬ
        </Mono>
      </div>
      <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0 }}>
        {nSig > 1 && (
          <polyline points={sigPts.join(" ")} fill="none" stroke={S6_INK_BLUE} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
        )}
      </svg>
      <Stamp f={f} at={at(51.75)} text="APPROVED" x={300} y={1520} rot={-9} size={64} />
    </>
  );
};

const Scene6: React.FC<{ f: number; from: number }> = ({ f, from }) => {
  const at = (s: number) => s2f(s) - SCENES[5];
  const cam = s6Cam(f);
  const slide = ramp(f, 0, 16, 0, 1, EASE);
  const dir = 1;
  const tx0 = (1 - slide) * W * dir;

  // pen choreography (sheet / world coords)
  const rest = { x: W + 330, y: 1700 };
  const start = sigPoint(0);
  const sigP = ramp(f, at(50.2), at(51.6), 0, 1, Easing.bezier(0.3, 0, 0.7, 1));
  const approach = ramp(f, at(49.3), at(50.2), 0, 1, EASE);
  const retreat = ramp(f, at(51.7), at(52.5), 0, 1, EASE);
  let nib = { x: rest.x + (start.x - rest.x) * approach, y: rest.y + (start.y - rest.y) * approach };
  if (f >= at(50.2)) nib = sigPoint(sigP);
  if (retreat > 0) {
    const e = sigPoint(1);
    nib = { x: e.x + (W + 150 - e.x) * retreat, y: e.y + (1560 - e.y) * retreat };
  }
  const writing = f >= at(50.2) && f < at(51.7);
  const lift = writing ? 4 : 26 + 20 * Math.sin(approach * Math.PI) + 30 * retreat;
  const penAng = 32 + 6 * Math.sin(f / 9) * (writing ? 1 : 0);

  const z = (n: number) => `translateZ(${n}px)`;
  return (
    <AbsoluteFill style={{ transform: `translateX(${tx0}px)`, overflow: "hidden" }}>
      <AlpineRoom f={f} p={cam.p} />
      <AbsoluteFill style={{ perspective: S6_PERSP, perspectiveOrigin: "50% 45%" }}>
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: W,
            height: H,
            transformStyle: "preserve-3d",
            transformOrigin: "50% 50%",
            transform: `translate3d(${cam.tx}px,${cam.ty}px,${-cam.z}px) rotateX(${cam.rx}deg) rotateZ(${cam.rz}deg)`,
          }}
        >
          {/* executive desk: dark walnut with lamp pool */}
          <div
            style={{
              position: "absolute",
              left: -1900,
              top: -950,
              width: W + 3800,
              height: H + 2800,
              transform: z(-3),
              background:
                "radial-gradient(ellipse 34% 26% at 40% 40%, rgba(255,176,90,0.22), transparent 70%)," +
                "repeating-linear-gradient(91deg, rgba(0,0,0,0) 0px, rgba(0,0,0,0.22) 4px, rgba(255,220,180,0.025) 9px, rgba(0,0,0,0) 17px)," +
                "linear-gradient(180deg, #2E1B0F, #1E1209 45%, #120A05)",
              borderTop: "16px solid #7A5532",
              boxShadow: "0 -6px 30px rgba(255,170,90,0.25)",
            }}
          />
          {/* leather desk pad */}
          <div
            style={{
              position: "absolute",
              left: -110,
              top: -110,
              width: W + 220,
              height: H + 220,
              transform: z(-2),
              background: "linear-gradient(160deg, #18221C, #0C120E)",
              borderRadius: 10,
              boxShadow: "inset 0 0 0 14px #0A0F0C, inset 0 0 0 17px rgba(212,175,55,0.35), 0 20px 60px rgba(0,0,0,0.6)",
            }}
          />
          {/* the Swiss sheet */}
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: W,
              height: H,
              overflow: "hidden",
              background: PAPER,
              transform: z(0),
              boxShadow: `0 30px 70px rgba(0,0,0,${0.7 * cam.p}), 0 0 0 ${3 * cam.p}px rgba(212,175,55,${0.7 * cam.p}), 0 0 ${50 * cam.p}px rgba(255,190,90,${0.35 * cam.p})`,
            }}
          >
            <Camera gf={f + from}>
              <Scene6Sheet f={f} />
            </Camera>
          </div>
          {/* props */}
          <Espresso x={-330} y={420} f={f} rx={cam.rx} rz={cam.rz} />
          <SwissWatch x={W + 330} y={900} f={f} gf={f + from} />
          {/* pen: shadow on paper, body hovering */}
          <div style={{ position: "absolute", left: nib.x + lift * 0.6, top: nib.y + lift * 0.9, transform: z(2), opacity: 0.5 + 0.5 / (1 + lift / 40) }}>
            <PenShape ang={penAng + 3} shadow />
          </div>
          <div style={{ position: "absolute", left: nib.x, top: nib.y, transform: z(lift + 6) }}>
            <PenShape ang={penAng} />
          </div>
        </div>
      </AbsoluteFill>
      {/* cinematic grade: warm key + dark vignette, grows with the pull-back */}
      <AbsoluteFill
        style={{
          pointerEvents: "none",
          opacity: cam.p,
          background:
            "radial-gradient(ellipse 70% 55% at 50% 58%, transparent 55%, rgba(5,3,2,0.55) 100%), linear-gradient(180deg, rgba(255,160,90,0.06), transparent 40%)",
        }}
      />
      {slide < 1 && <div style={{ position: "absolute", top: 0, bottom: 0, left: 0, width: 14, background: RED }} />}
    </AbsoluteFill>
  );
};

// -------------------------------------------------------------------------
// Subtitles — dark pill, crimson active word, guaranteed word spacing
// -------------------------------------------------------------------------
const Subtitles: React.FC<{ gf: number }> = ({ gf }) => {
  const t = gf / FPS;
  const idx = React.useMemo(() => CHUNKS.map((c) => c.start), []);
  let ci = -1;
  for (let i = 0; i < idx.length; i++) if (idx[i] <= t) ci = i;
  if (ci < 0) return null;
  const chunk = CHUNKS[ci];
  const nextStart = ci + 1 < CHUNKS.length ? CHUNKS[ci + 1].start : chunk.end + 1;
  if (t > Math.min(nextStart, chunk.end + 0.8)) return null;
  const local = gf - s2f(chunk.start);
  const pop = ramp(local, 0, 7);
  return (
    <div
      style={{
        position: "absolute",
        left: 60,
        right: 60,
        bottom: 150,
        display: "flex",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          background: INK,
          padding: "22px 34px",
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          columnGap: 22,
          rowGap: 12,
          maxWidth: 940,
          transform: `translateY(${(1 - pop) * 24}px)`,
          opacity: pop,
          borderBottom: `6px solid ${RED}`,
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
                fontSize: 62,
                lineHeight: 1.1,
                letterSpacing: 0.5,
                textTransform: "uppercase",
                padding: "2px 10px",
                color: active ? "#FFFFFF" : done ? PAPER : "rgba(244,241,234,0.45)",
                background: active ? RED : "transparent",
                whiteSpace: "nowrap",
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
const SCENE_COMPONENTS = [Scene1, Scene2, Scene3, Scene4, Scene5];

const SceneHost: React.FC<{ i: number; from: number }> = ({ i, from }) => {
  const f = useCurrentFrame();
  if (i === SCENE_COMPONENTS.length) return <Scene6 f={f} from={from} />;
  if (i === 0) return <Scene1Intro f={f} from={from} />;
  const C = SCENE_COMPONENTS[mod(i, SCENE_COMPONENTS.length)];
  return (
    <Paper f={f} first={i === 0} dir={mod(i, 2) === 0 ? -1 : 1}>
      <Camera gf={f + from}>
        <C f={f} />
      </Camera>
    </Paper>
  );
};

export const SwissAuditReel: React.FC = () => {
  const gf = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: PAPER, overflow: "hidden" }}>
      <Audio src={staticFile("swiss_audit_reel/voice.mp3")} />
      {SCENES.slice(0, -1).map((from, i) => {
        const to = SCENES[i + 1];
        const dur = Math.min(to - from + OVERLAP, 3180 - from);
        return (
          <Sequence key={i} from={from} durationInFrames={dur} layout="none">
            <AbsoluteFill>
              <SceneHost i={i} from={from} />
            </AbsoluteFill>
          </Sequence>
        );
      })}
      {/* paper grain vignette edges */}
      <AbsoluteFill
        style={{
          pointerEvents: "none",
          boxShadow: "inset 0 0 160px rgba(107,102,92,0.18)",
        }}
      />
      <Subtitles gf={gf} />
      {/* footer index */}
      <div style={{ position: "absolute", left: 72, right: 72, bottom: 64, display: "flex" }}>
        <Mono size={20} color={MUTED} style={{ flex: 1 }}>
          MAKE IT EASY AI
        </Mono>
        <Mono size={20} color={MUTED}>
          {String(Math.floor(gf / FPS)).padStart(2, "0")}.{String(mod(Math.floor((gf / FPS) * 10), 10))}s / 53.0s
        </Mono>
      </div>
    </AbsoluteFill>
  );
};
