import React from "react";
import { AbsoluteFill, Audio, Easing, interpolate, staticFile, useCurrentFrame } from "remotion";
import wordsData from "../public/voice_clone_reel/words.json";

/*
 * =========================================================================
 * VOICE CLONE REEL — 1080x1920 @ 60 FPS, 3240 FRAMES (54s)
 *
 *   01  0.0 –  9.0s : "2026: ГОЛОС НА 10 ЯЗЫКАХ" + live 3D waveform + flat speaker
 *   02  9.0 – 18.2s : Locked foreign platforms + crossed-out tutor/translator/voice invoices
 *   03 18.2 – 28.7s : "30 СЕК ЗАПИСИ" mic ring + voiceprint DNA helix
 *   04 28.7 – 41.6s : 1 script → AI node → 10 language channels fanning out
 *   05 41.6 – 48.5s : 1 → 10 traffic streams + "5X ЦЕНА РЕКЛАМЫ" CPM chart
 *   06 48.5 – 54.0s : CTA — НАПИШИ «ГОЛОС»
 *
 * Palette: emerald-charcoal #040B09 / emerald #10B981 / mint #34D399 / white #F8FAFC.
 * Transitions rotate: smooth wipe → radial pulse → split-screen → wipe → radial.
 * Camera accents rotate: zoom / lateral slide / tilt (never the same twice in a row).
 * All cyclic indices go through mod().
 * =========================================================================
 */

const FPS = 60;

const C = {
  bg: "#040B09",
  bg2: "#07140F",
  emerald: "#10B981",
  mint: "#34D399",
  white: "#F8FAFC",
  dim: "rgba(248,250,252,0.58)",
  faint: "rgba(248,250,252,0.16)",
  line: "rgba(52,211,153,0.30)",
  panel: "rgba(7,20,16,0.92)",
  deep: "#0B1F19",
};

const GROTESK = "'Space Grotesk', 'Inter', 'SF Pro Display', 'Helvetica Neue', Arial, sans-serif";
const MONO = "'JetBrains Mono', 'SF Mono', Menlo, Consolas, monospace";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const EXPO = Easing.bezier(0.16, 1, 0.3, 1);
const SMOOTH = Easing.bezier(0.65, 0, 0.35, 1);
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

/** Safe modulo — always 0..m-1, also for negative / fractional n. */
const mod = (n: number, m: number) => ((Math.floor(n) % m) + m) % m;

const rand = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

/** 0→1 eased progress between seconds a and b. */
const ease = (t: number, a: number, b: number, e: (x: number) => number = EXPO) =>
  interpolate(t, [a, b], [0, 1], { ...clamp, easing: e });

/** Overshoot pop 0→1 (back-out). */
const pop = (t: number, a: number, dur = 0.45) =>
  interpolate(t, [a, a + dur], [0, 1], { ...clamp, easing: Easing.bezier(0.34, 1.56, 0.64, 1) });

const fmt = (n: number) => Math.round(n).toLocaleString("en-US");

// -------------------------------------------------------------------------
// Words (with ASR clean-up for display)
// -------------------------------------------------------------------------
type W = { word: string; start: number; end: number };
const RAW = wordsData as W[];

const WORDS: W[] = (() => {
  const out: W[] = [];
  for (let i = 0; i < RAW.length; i++) {
    const w = RAW[i];
    const n1 = RAW[i + 1];
    const n2 = RAW[i + 2];
    if (w.word === "Не" && n1?.word === "и" && n2?.word.startsWith("рассеть")) {
      out.push({ word: "Нейросеть", start: w.start, end: n2.end });
      i += 2;
      continue;
    }
    if (w.word === "тик" && n1?.word.startsWith("-ток")) {
      out.push({ word: "тик-ток,", start: w.start, end: n1.end });
      i += 1;
      continue;
    }
    const fix: Record<string, string> = { "паус.": "пауз.", рекламой: "рекламы" };
    out.push({ ...w, word: fix[w.word] ?? w.word });
  }
  return out;
})();

type Chunk = { words: W[]; start: number; end: number };
const CHUNKS: Chunk[] = (() => {
  const res: Chunk[] = [];
  let cur: W[] = [];
  const flush = () => {
    if (cur.length) res.push({ words: cur, start: cur[0].start, end: cur[cur.length - 1].end });
    cur = [];
  };
  WORDS.forEach((w, i) => {
    const next = WORDS[i + 1];
    cur.push(w);
    const chars = cur.reduce((s, x) => s + x.word.length + 1, 0);
    const punct = /[.,!?]$/.test(w.word);
    const gap = next ? next.start - w.end > 0.32 : true;
    if (punct || gap || cur.length >= 4 || chars > 20) flush();
  });
  flush();
  return res;
})();

const speechAmp = (t: number) => {
  let a = 0;
  for (const w of RAW) {
    if (t >= w.start - 0.04 && t <= w.end + 0.06) {
      const p = clamp01((t - w.start) / Math.max(0.05, w.end - w.start));
      a = Math.max(a, 0.5 + 0.5 * Math.sin(Math.PI * p));
    }
  }
  return a;
};

// -------------------------------------------------------------------------
// Scenes, transitions, camera
// -------------------------------------------------------------------------
type Tr = "none" | "wipe" | "radial" | "split";
const SCENES: { a: number; b: number; tr: Tr }[] = [
  { a: 0, b: 9.0, tr: "none" },
  { a: 9.0, b: 18.2, tr: "wipe" },
  { a: 18.2, b: 28.7, tr: "radial" },
  { a: 28.7, b: 41.6, tr: "split" },
  { a: 41.6, b: 48.5, tr: "wipe" },
  { a: 48.5, b: 54.5, tr: "radial" },
];
const TR = 0.65;

type Acc = { t: number; kind: "zoom" | "slide" | "tilt" };
const ACCENTS: Acc[] = [
  { t: 0.28, kind: "zoom" },
  { t: 4.72, kind: "slide" },
  { t: 7.68, kind: "tilt" },
  { t: 11.2, kind: "slide" },
  { t: 15.84, kind: "zoom" },
  { t: 17.08, kind: "tilt" },
  { t: 19.96, kind: "zoom" },
  { t: 23.16, kind: "slide" },
  { t: 26.76, kind: "tilt" },
  { t: 29.96, kind: "zoom" },
  { t: 35.12, kind: "slide" },
  { t: 37.48, kind: "tilt" },
  { t: 40.24, kind: "zoom" },
  { t: 43.4, kind: "slide" },
  { t: 46.1, kind: "zoom" },
  { t: 49.46, kind: "tilt" },
];

const PULSES = [4.14, 19.96, 40.24, 49.46, 52.26];

const camera = (t: number) => {
  let scale = 1.03 + 0.012 * Math.sin(t * 0.55);
  let x = Math.sin(t * 0.37) * 12;
  let y = Math.cos(t * 0.29) * 9;
  let rot = Math.sin(t * 0.23) * 0.35;
  ACCENTS.forEach((a, i) => {
    const d = t - a.t;
    if (d < 0 || d > 1.2) return;
    const env = (1 - Math.exp(-d * 28)) * Math.exp(-d * 4.2);
    const sign = mod(i, 2) === 0 ? 1 : -1;
    if (a.kind === "zoom") scale += 0.075 * env;
    if (a.kind === "slide") x += 46 * env * sign;
    if (a.kind === "tilt") {
      rot += 1.4 * env * sign;
      scale += 0.025 * env;
    }
  });
  return { scale, x, y, rot };
};

// -------------------------------------------------------------------------
// Shared visual atoms
// -------------------------------------------------------------------------
const Mono: React.FC<{ children: React.ReactNode; size?: number; color?: string; style?: React.CSSProperties }> = ({
  children,
  size = 26,
  color = C.mint,
  style,
}) => (
  <span style={{ fontFamily: MONO, fontSize: size, color, letterSpacing: 2, fontWeight: 600, ...style }}>{children}</span>
);

const Panel: React.FC<{ style?: React.CSSProperties; children?: React.ReactNode; glow?: number }> = ({
  style,
  children,
  glow = 0.35,
}) => (
  <div
    style={{
      background: C.panel,
      border: `2px solid ${C.line}`,
      borderRadius: 26,
      boxShadow: `0 30px 70px rgba(0,0,0,0.6), 0 0 ${40 * glow}px rgba(16,185,129,${glow * 0.6}), inset 0 1px 0 rgba(248,250,252,0.06)`,
      ...style,
    }}
  >
    {children}
  </div>
);

const Bokeh: React.FC<{ t: number }> = ({ t }) => (
  <AbsoluteFill style={{ pointerEvents: "none" }}>
    {Array.from({ length: 16 }).map((_, i) => {
      const s = 50 + rand(i) * 170;
      const x = rand(i + 11) * 1080 + Math.sin(t * 0.2 + i) * 40;
      const y = rand(i + 23) * 1920 + Math.cos(t * 0.17 + i * 2) * 50;
      const col = mod(i, 3) === 0 ? C.white : mod(i, 3) === 1 ? C.mint : C.emerald;
      return (
        <div
          key={i}
          style={{
            position: "absolute",
            left: x - s / 2,
            top: y - s / 2,
            width: s,
            height: s,
            borderRadius: "50%",
            background: col,
            opacity: 0.05 + rand(i + 5) * 0.12,
            filter: `blur(${14 + rand(i + 3) * 26}px)`,
          }}
        />
      );
    })}
  </AbsoluteFill>
);

const Background: React.FC<{ t: number }> = ({ t }) => (
  <AbsoluteFill>
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse 90% 60% at 50% 38%, ${C.bg2} 0%, ${C.bg} 70%)`,
      }}
    />
    {/* receding floor grid */}
    <div
      style={{
        position: "absolute",
        left: -540,
        right: -540,
        top: 1050,
        height: 1300,
        transform: "perspective(700px) rotateX(68deg)",
        transformOrigin: "50% 0%",
        backgroundImage: `linear-gradient(${C.line} 2px, transparent 2px), linear-gradient(90deg, ${C.line} 2px, transparent 2px)`,
        backgroundSize: "90px 90px",
        backgroundPosition: `0px ${(t * 40) % 90}px`,
        opacity: 0.32,
        maskImage: "linear-gradient(to bottom, rgba(0,0,0,1), rgba(0,0,0,0) 85%)",
        WebkitMaskImage: "linear-gradient(to bottom, rgba(0,0,0,1), rgba(0,0,0,0) 85%)",
      }}
    />
    <Bokeh t={t} />
  </AbsoluteFill>
);

/** Flat 2D speaker with mint rim light, headphones and a soft floor shadow. */
const FlatSpeaker: React.FC<{ t: number; x: number; y: number; size: number; appear: number; talking?: boolean }> = ({
  t,
  x,
  y,
  size,
  appear,
  talking = false,
}) => {
  const k = pop(t, appear, 0.6);
  const blink = mod(t * 60, 210) < 7 ? 0.15 : 1;
  const bob = Math.sin(t * 2.1) * 6;
  const mouthOpen = talking ? 4 + speechAmp(t) * 14 : 0;
  const h = size * 1.4;
  return (
    <div style={{ position: "absolute", left: x - size / 2, top: y - h, width: size, height: h, opacity: k }}>
      {/* floor shadow */}
      <div
        style={{
          position: "absolute",
          left: size * 0.05,
          right: size * 0.05,
          bottom: -size * 0.06,
          height: size * 0.12,
          borderRadius: "50%",
          background: "rgba(0,0,0,0.75)",
          filter: "blur(14px)",
          transform: `scaleX(${0.9 + 0.05 * Math.sin(t * 2.1)})`,
        }}
      />
      <svg
        viewBox="0 0 300 420"
        width={size}
        height={h}
        style={{
          transform: `translateY(${bob + (1 - k) * 60}px)`,
          filter: `drop-shadow(0 0 10px ${C.mint}) drop-shadow(0 0 30px rgba(16,185,129,0.55))`,
          overflow: "visible",
        }}
      >
        <path d="M30 420 C30 300 85 262 150 262 C215 262 270 300 270 420 Z" fill={C.deep} stroke={C.mint} strokeWidth={5} />
        <path d="M118 262 L150 330 L182 262" fill="none" stroke={C.emerald} strokeWidth={5} />
        <rect x={128} y={220} width={44} height={50} rx={12} fill={C.deep} stroke={C.mint} strokeWidth={5} />
        <circle cx={150} cy={160} r={82} fill={C.deep} stroke={C.mint} strokeWidth={5} />
        <path d="M70 150 C72 85 120 66 150 66 C195 66 232 92 230 150 C212 118 170 108 120 116 C98 120 82 132 70 150 Z" fill={C.mint} opacity={0.9} />
        {/* headphones */}
        <path d="M58 168 C52 70 248 70 242 168" fill="none" stroke={C.white} strokeWidth={9} strokeLinecap="round" />
        <rect x={44} y={150} width={28} height={56} rx={12} fill={C.emerald} stroke={C.white} strokeWidth={4} />
        <rect x={228} y={150} width={28} height={56} rx={12} fill={C.emerald} stroke={C.white} strokeWidth={4} />
        {/* eyes */}
        <ellipse cx={122} cy={168} rx={9} ry={11 * blink} fill={C.white} />
        <ellipse cx={178} cy={168} rx={9} ry={11 * blink} fill={C.white} />
        {/* mouth */}
        {mouthOpen > 0 ? (
          <ellipse cx={150} cy={205} rx={16} ry={mouthOpen / 2} fill={C.bg} stroke={C.white} strokeWidth={4} />
        ) : (
          <path d="M132 204 Q150 214 168 204" fill="none" stroke={C.white} strokeWidth={5} strokeLinecap="round" />
        )}
      </svg>
    </div>
  );
};

/** Masked rise-in text line. */
const Rise: React.FC<{ t: number; at: number; children: React.ReactNode; style?: React.CSSProperties }> = ({
  t,
  at,
  children,
  style,
}) => {
  const k = ease(t, at, at + 0.55);
  return (
    <div style={{ clipPath: "inset(-120px -300px 0 -300px)", ...style }}>
      <div style={{ transform: `translateY(${(1 - k) * 110}%)`, opacity: k }}>{children}</div>
    </div>
  );
};

// -------------------------------------------------------------------------
// SCENE 1 — 2026: ГОЛОС НА 10 ЯЗЫКАХ
// -------------------------------------------------------------------------
const LANGS = ["EN", "ES", "DE", "JP", "FR", "PT", "IT", "KO", "TR", "HI"];

const Waveform3D: React.FC<{ t: number; top: number }> = ({ t, top }) => {
  const ROWS = 13;
  const BARS = 38;
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top, height: 360 }}>
      {Array.from({ length: ROWS }).map((_, rr) => {
        const r = ROWS - 1 - rr; // back to front
        const amp = speechAmp(t - r * 0.07);
        const sc = 1 - r * 0.045;
        return (
          <div
            key={r}
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 40 + r * 17,
              display: "flex",
              justifyContent: "center",
              alignItems: "flex-end",
              gap: 7,
              transform: `scale(${sc}) skewX(${-r * 0.8}deg)`,
              opacity: 1 - r * 0.068,
            }}
          >
            {Array.from({ length: BARS }).map((__, b) => {
              const cx = (b - BARS / 2) / (BARS / 2);
              const env = Math.exp(-cx * cx * 2.2);
              const n = 0.45 + 0.55 * Math.abs(Math.sin(b * 0.9 + (t - r * 0.07) * 13 + rand(b) * 6));
              const hgt = 6 + (amp * 0.85 + 0.08) * env * n * 210;
              return (
                <div
                  key={b}
                  style={{
                    width: 17,
                    height: hgt,
                    borderRadius: 6,
                    background: r === 0 ? `linear-gradient(to top, ${C.emerald}, ${C.mint} 70%, ${C.white})` : C.emerald,
                    boxShadow: r === 0 ? `0 0 14px rgba(52,211,153,0.7)` : "none",
                  }}
                />
              );
            })}
          </div>
        );
      })}
      <div style={{ position: "absolute", left: 60, bottom: 0 }}>
        <Mono size={22} color={C.dim}>48kHz · 24bit · LUFS −14</Mono>
      </div>
      <div style={{ position: "absolute", right: 60, bottom: 0 }}>
        <Mono size={22}>{`00:${String(mod(t, 60)).padStart(2, "0")}:${String(mod(t * 60, 60)).padStart(2, "0")}`}</Mono>
      </div>
    </div>
  );
};

const Scene1: React.FC<{ t: number }> = ({ t }) => {
  const tenK = ease(t, 4.72, 5.5);
  const ten = Math.max(1, Math.round(interpolate(tenK, [0, 1], [1, 10])));
  const silent = pop(t, 7.3);
  const recBlink = mod(t * 2, 2) === 0 ? 1 : 0.3;
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", top: 120, left: 70, right: 70, display: "flex", justifyContent: "space-between" }}>
        <Mono size={24}>
          <span style={{ opacity: recBlink }}>●</span> REC / VOICE_ENGINE
        </Mono>
        <Mono size={24} color={C.dim}>
          v.2026.11
        </Mono>
      </div>
      <div style={{ position: "absolute", top: 200, left: 70, right: 70 }}>
        <Rise t={t} at={0.28}>
          <span style={{ fontFamily: MONO, fontSize: 112, fontWeight: 800, color: C.mint, textShadow: `0 0 40px rgba(52,211,153,0.6)` }}>
            2026:
          </span>
        </Rise>
        <Rise t={t} at={2.86}>
          <span style={{ fontFamily: GROTESK, fontSize: 138, fontWeight: 800, color: C.white, letterSpacing: -4, lineHeight: 1.05 }}>
            ГОЛОС НА
          </span>
        </Rise>
        <Rise t={t} at={4.72}>
          <span style={{ fontFamily: GROTESK, fontSize: 138, fontWeight: 800, color: C.white, letterSpacing: -4, lineHeight: 1.05 }}>
            <span style={{ color: C.mint, fontFamily: MONO, textShadow: `0 0 50px ${C.emerald}` }}>{ten}</span> ЯЗЫКАХ
          </span>
        </Rise>
      </div>

      {/* orbiting language chips — "одновременно" */}
      {LANGS.map((l, i) => {
        const k = pop(t, 4.98 + i * 0.09);
        const ang = (i / LANGS.length) * Math.PI * 2 + t * 0.6;
        const depth = Math.sin(ang);
        const cx = 540 + Math.cos(ang) * 400;
        const cy = 1000 + depth * 120;
        const s = (0.75 + 0.3 * (depth + 1) / 2) * k;
        return (
          <div
            key={l}
            style={{
              position: "absolute",
              left: cx - 60,
              top: cy - 32,
              width: 120,
              height: 64,
              borderRadius: 32,
              border: `2px solid ${C.mint}`,
              background: depth > 0 ? "rgba(16,185,129,0.22)" : "rgba(7,20,16,0.8)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transform: `scale(${s})`,
              opacity: k * (0.45 + 0.55 * (depth + 1) / 2),
              filter: depth < -0.3 ? "blur(2px)" : "none",
              zIndex: depth > 0 ? 3 : 1,
            }}
          >
            <Mono size={28} color={C.white}>
              {l}
            </Mono>
          </div>
        );
      })}
      <div style={{ position: "absolute", inset: 0, zIndex: 2 }}>
        <FlatSpeaker t={t} x={540} y={1190} size={300} appear={1.7} />
      </div>

      {/* mouth closed badge */}
      <div
        style={{
          position: "absolute",
          top: 760,
          right: 70,
          zIndex: 4,
          transform: `scale(${silent}) rotate(3deg)`,
          opacity: silent,
        }}
      >
        <Panel style={{ padding: "14px 22px" }} glow={0.6}>
          <Mono size={24} color={C.white}>РОТ: ЗАКРЫТ</Mono>
          <br />
          <Mono size={24}>ГОЛОС: ×10 LIVE</Mono>
        </Panel>
      </div>

      <Waveform3D t={t} top={1120} />
    </AbsoluteFill>
  );
};

// -------------------------------------------------------------------------
// SCENE 2 — РАНЬШЕ: invoices crossed out
// -------------------------------------------------------------------------
const INVOICES = [
  { at: 13.7, title: "РЕПЕТИТОР АНГЛ.", no: "INV-0412", items: [["48 уроков", "$1,440"], ["учебники", "$120"]], total: "$1,560", rot: -3, y: 600 },
  { at: 15.5, title: "ПЕРЕВОДЧИК", no: "INV-0587", items: [["перевод 12 скриптов", "$960"], ["вычитка", "$240"]], total: "$1,200", rot: 2.5, y: 870 },
  { at: 16.9, title: "ДИКТОР (EN)", no: "INV-0733", items: [["озвучка 12 роликов", "$1,800"], ["студия", "$300"]], total: "$2,100", rot: -1.5, y: 1140 },
];

const Scene2: React.FC<{ t: number }> = ({ t }) => {
  const lockK = ease(t, 11.2, 11.8);
  const sumK = ease(t, 17.6, 18.3);
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", top: 120, left: 70, right: 70 }}>
        <Mono size={26} color={C.dim}>
          // РАНЬШЕ · EXPORT_COST.log
        </Mono>
        <Rise t={t} at={9.22} style={{ marginTop: 10 }}>
          <span style={{ fontFamily: GROTESK, fontSize: 96, fontWeight: 800, color: C.white, letterSpacing: -3 }}>
            ВЫХОД НА <span style={{ color: C.mint }}>ЗАПАД</span>
          </span>
        </Rise>
      </div>

      {/* locked foreign platforms */}
      <div style={{ position: "absolute", top: 330, left: 70, right: 70, display: "flex", gap: 30 }}>
        {[
          { at: 11.2, name: "ЮТУБ · US", icon: "▶" },
          { at: 12.06, name: "ТИК-ТОК · EU", icon: "♪" },
        ].map((p, i) => {
          const k = pop(t, p.at);
          const shake = t > 13.0 && t < 13.5 ? Math.sin(t * 90) * 6 : 0;
          return (
            <Panel key={i} style={{ flex: 1, height: 180, padding: 24, transform: `scale(${k}) translateX(${shake}px)`, opacity: k, position: "relative" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
                <div
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: 18,
                    background: C.emerald,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 38,
                    color: C.bg,
                  }}
                >
                  {p.icon}
                </div>
                <span style={{ fontFamily: GROTESK, fontSize: 40, fontWeight: 700, color: C.white }}>{p.name}</span>
              </div>
              <div style={{ marginTop: 22, display: "flex", alignItems: "center", gap: 12, opacity: lockK }}>
                <svg width={30} height={34} viewBox="0 0 30 34">
                  <rect x={3} y={14} width={24} height={18} rx={4} fill={C.mint} />
                  <path d="M8 14 V9 a7 7 0 0 1 14 0 V14" fill="none" stroke={C.mint} strokeWidth={4} />
                </svg>
                <Mono size={21} color={C.dim}>
                  REQUIRES: ENGLISH
                </Mono>
              </div>
            </Panel>
          );
        })}
      </div>

      {/* invoices */}
      {INVOICES.map((inv, i) => {
        const k = ease(t, inv.at, inv.at + 0.5);
        const strikeAt = Math.min(inv.at + 0.9, 17.55);
        const strike = ease(t, strikeAt, strikeAt + 0.35, SMOOTH);
        const stamp = pop(t, strikeAt + 0.3, 0.35);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: 110 + mod(i, 2) * 40,
              top: inv.y,
              width: 820,
              transform: `translateX(${(1 - k) * (i % 2 ? 900 : -900)}px) rotate(${inv.rot}deg)`,
              opacity: k,
            }}
          >
            <div
              style={{
                background: C.white,
                borderRadius: 14,
                padding: "26px 34px",
                boxShadow: "0 30px 60px rgba(0,0,0,0.65)",
                position: "relative",
                opacity: 1 - strike * 0.35,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <span style={{ fontFamily: GROTESK, fontSize: 40, fontWeight: 800, color: C.bg }}>{inv.title}</span>
                <Mono size={20} color="#3d5a50">
                  {inv.no}
                </Mono>
              </div>
              <div style={{ height: 2, background: "#cfd8d4", margin: "12px 0" }} />
              {inv.items.map(([a, b], j) => (
                <div key={j} style={{ display: "flex", justifyContent: "space-between", fontFamily: MONO, fontSize: 24, color: "#1f3a31", marginBottom: 4 }}>
                  <span>{a}</span>
                  <span>{b}</span>
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between", fontFamily: MONO, fontSize: 30, fontWeight: 800, color: C.bg, marginTop: 6 }}>
                <span>ИТОГО</span>
                <span>{inv.total}</span>
              </div>
              {/* strike line */}
              <div
                style={{
                  position: "absolute",
                  left: 20,
                  top: "52%",
                  height: 10,
                  width: `${strike * 94}%`,
                  background: C.emerald,
                  borderRadius: 5,
                  transform: "rotate(-6deg)",
                  transformOrigin: "0 50%",
                  boxShadow: `0 0 18px ${C.mint}`,
                }}
              />
            </div>
            <div
              style={{
                position: "absolute",
                right: 30,
                top: -26,
                padding: "8px 20px",
                border: `5px solid ${C.mint}`,
                borderRadius: 12,
                background: "rgba(4,11,9,0.9)",
                transform: `rotate(${10 - i * 4}deg) scale(${stamp * 1})`,
                opacity: stamp,
              }}
            >
              <Mono size={30} color={C.mint} style={{ fontWeight: 800 }}>
                НЕ НУЖНО
              </Mono>
            </div>
          </div>
        );
      })}

      <div style={{ position: "absolute", top: 1420, left: 0, right: 0, textAlign: "center", opacity: sumK, transform: `translateY(${(1 - sumK) * 30}px)` }}>
        <Mono size={34} color={C.white}>
          <span style={{ textDecoration: "line-through", color: C.dim }}>$4,860/мес</span>
          <span style={{ color: C.mint }}>  →  $0</span>
        </Mono>
      </div>
    </AbsoluteFill>
  );
};

// -------------------------------------------------------------------------
// SCENE 3 — 30 СЕК ЗАПИСИ + voiceprint DNA
// -------------------------------------------------------------------------
const Scene3: React.FC<{ t: number }> = ({ t }) => {
  const R = 220;
  const CX = 540;
  const CY = 640;
  const rec = ease(t, 19.1, 22.5, (x) => x);
  const secs = Math.round(rec * 30);
  const circ = 2 * Math.PI * R;
  const ringIn = pop(t, 18.4, 0.6);
  const onceK = pop(t, 21.94);
  const nnK = ease(t, 23.16, 23.7);
  const helixReveal = ease(t, 23.8, 25.6, SMOOTH);
  const match = interpolate(ease(t, 24.5, 28.2, (x) => x), [0, 1], [12.0, 99.4]);
  const TAGS = [
    { at: 25.92, name: "ТЕМБР", v: "98.9%" },
    { at: 26.76, name: "ИНТОНАЦИИ", v: "97.6%" },
    { at: 27.78, name: "ПАУЗЫ", v: "99.1%" },
  ];
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", top: 120, left: 70, right: 70, display: "flex", justifyContent: "space-between" }}>
        <Mono size={26}>// ТЕПЕРЬ</Mono>
        <Mono size={26} color={C.dim}>
          SAMPLE_01.wav
        </Mono>
      </div>

      {/* mic ring */}
      <svg width={1080} height={1080} style={{ position: "absolute", left: 0, top: CY - 540, transform: `scale(${ringIn})`, transformOrigin: `540px 540px` }}>
        {Array.from({ length: 72 }).map((_, i) => {
          const a = (i / 72) * Math.PI * 2 - Math.PI / 2;
          const amp = speechAmp(t - mod(i, 12) * 0.02);
          const len = 14 + amp * (18 + 40 * Math.abs(Math.sin(i * 1.7 + t * 9)));
          const on = i / 72 <= rec;
          return (
            <line
              key={i}
              x1={540 + Math.cos(a) * (R + 26)}
              y1={540 + Math.sin(a) * (R + 26)}
              x2={540 + Math.cos(a) * (R + 26 + len)}
              y2={540 + Math.sin(a) * (R + 26 + len)}
              stroke={on ? C.mint : C.faint}
              strokeWidth={6}
              strokeLinecap="round"
            />
          );
        })}
        <circle cx={540} cy={540} r={R} fill="none" stroke={C.faint} strokeWidth={14} />
        <circle
          cx={540}
          cy={540}
          r={R}
          fill="none"
          stroke={C.emerald}
          strokeWidth={14}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - rec)}
          transform="rotate(-90 540 540)"
          style={{ filter: `drop-shadow(0 0 16px ${C.mint})` }}
        />
        <circle cx={540} cy={540} r={R - 40} fill={C.deep} stroke={C.line} strokeWidth={3} />
        {/* mic */}
        <rect x={500} y={420} width={80} height={140} rx={40} fill={C.mint} />
        {Array.from({ length: 4 }).map((_, i) => (
          <line key={i} x1={512} x2={568} y1={450 + i * 22} y2={450 + i * 22} stroke={C.deep} strokeWidth={5} strokeLinecap="round" />
        ))}
        <path d="M470 510 a70 70 0 0 0 140 0" fill="none" stroke={C.white} strokeWidth={9} strokeLinecap="round" />
        <line x1={540} y1={580} x2={540} y2={620} stroke={C.white} strokeWidth={9} />
        <line x1={505} y1={622} x2={575} y2={622} stroke={C.white} strokeWidth={9} strokeLinecap="round" />
        <text x={540} y={680} textAnchor="middle" fontFamily={MONO} fontSize={40} fontWeight={800} fill={C.white}>
          {`00:${String(secs).padStart(2, "0")}`}
        </text>
      </svg>

      <div style={{ position: "absolute", top: 940, left: 0, right: 0, textAlign: "center" }}>
        <Rise t={t} at={19.96}>
          <span style={{ fontFamily: GROTESK, fontSize: 104, fontWeight: 800, color: C.white, letterSpacing: -3 }}>
            <span style={{ fontFamily: MONO, color: C.mint }}>30</span> СЕК ЗАПИСИ
          </span>
        </Rise>
      </div>
      <div
        style={{
          position: "absolute",
          top: 300,
          right: 90,
          transform: `scale(${onceK}) rotate(-8deg)`,
          opacity: onceK,
          padding: "10px 22px",
          background: C.emerald,
          borderRadius: 14,
        }}
      >
        <Mono size={32} color={C.bg} style={{ fontWeight: 800 }}>
          1 РАЗ
        </Mono>
      </div>

      {/* neural net label */}
      <div style={{ position: "absolute", top: 1085, left: 70, right: 70, display: "flex", justifyContent: "space-between", opacity: nnK }}>
        <Mono size={26} color={C.white}>
          НЕЙРОСЕТЬ → СЛЕПОК
        </Mono>
        <Mono size={26}>MATCH {match.toFixed(1)}%</Mono>
      </div>

      {/* voiceprint DNA helix */}
      <svg width={1080} height={260} style={{ position: "absolute", top: 1130, left: 0, opacity: nnK }}>
        {Array.from({ length: 34 }).map((_, i) => {
          const x = 80 + i * 28;
          const vis = clamp01(helixReveal * 34 - i);
          if (vis <= 0) return null;
          const ph = i * 0.42 + t * 2.4;
          const a = Math.sin(ph) * 95;
          const depth = Math.cos(ph);
          const bar = 0.4 + 0.6 * Math.abs(Math.sin(i * 1.3 + rand(i) * 4));
          return (
            <g key={i} opacity={vis}>
              <line x1={x} y1={130 + a * bar} x2={x} y2={130 - a * bar} stroke={mod(i, 3) === 0 ? C.white : C.emerald} strokeWidth={8} strokeLinecap="round" opacity={0.45 + 0.55 * Math.abs(depth)} />
              <circle cx={x} cy={130 + a} r={6 + 3 * depth} fill={C.mint} />
              <circle cx={x} cy={130 - a} r={6 - 3 * depth} fill={C.white} opacity={0.85} />
            </g>
          );
        })}
      </svg>

      <div style={{ position: "absolute", top: 1400, left: 70, right: 70, display: "flex", justifyContent: "space-between", gap: 18 }}>
        {TAGS.map((g, i) => {
          const k = pop(t, g.at);
          return (
            <div
              key={i}
              style={{
                flex: 1,
                padding: "12px 0",
                borderRadius: 14,
                border: `2px solid ${k > 0.5 ? C.mint : C.faint}`,
                background: k > 0.5 ? "rgba(16,185,129,0.18)" : "transparent",
                textAlign: "center",
                transform: `scale(${0.9 + 0.1 * k})`,
                opacity: 0.35 + 0.65 * k,
              }}
            >
              <Mono size={24} color={C.white}>
                ✓ {g.name}
              </Mono>
              <br />
              <Mono size={20}>{k > 0.5 ? g.v : "--.-%"}</Mono>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// -------------------------------------------------------------------------
// SCENE 4 — 1 script → 10 channels
// -------------------------------------------------------------------------
const CHANNELS = [
  { code: "EN", hello: "Hello, world", at: 35.12 },
  { code: "ES", hello: "Hola, mundo", at: 35.98 },
  { code: "DE", hello: "Hallo, Welt", at: 36.78 },
  { code: "JP", hello: "こんにちは", at: 37.48 },
  { code: "FR", hello: "Bonjour", at: 38.64 },
  { code: "PT", hello: "Olá, mundo", at: 38.76 },
  { code: "IT", hello: "Ciao, mondo", at: 38.88 },
  { code: "KO", hello: "안녕하세요", at: 39.0 },
  { code: "TR", hello: "Merhaba", at: 39.12 },
  { code: "HI", hello: "नमस्ते", at: 39.24 },
];

/** Palette-locked mini stripe "flag" — 3 stripes in emerald / mint / white rotated per channel. */
const MiniFlag: React.FC<{ i: number }> = ({ i }) => {
  const cols = [C.emerald, C.white, C.mint];
  const vertical = mod(i, 2) === 0;
  return (
    <div style={{ width: 54, height: 36, borderRadius: 6, overflow: "hidden", display: "flex", flexDirection: vertical ? "row" : "column", border: `1px solid ${C.line}` }}>
      {[0, 1, 2].map((s) => (
        <div key={s} style={{ flex: 1, background: cols[mod(i + s, 3)] }} />
      ))}
    </div>
  );
};

const Scene4: React.FC<{ t: number }> = ({ t }) => {
  const docK = ease(t, 29.0, 29.6);
  const LINES = ["СЦЕНАРИЙ_01.txt", "> хук: твой голос — актив", "> 30 сек записи = клон", "> 10 рынков одновременно"];
  const typed = ease(t, 29.4, 30.6, (x) => x);
  const sysK = pop(t, 31.08);
  const translating = t > 31.98 && t < 35.0;
  const cycle = CHANNELS[mod(t * 6, 4)];
  const NODE = { x: 540, y: 760 };
  const total = CHANNELS.reduce((s, c) => s + (t >= c.at ? 1 : 0), 0);
  const tenK = pop(t, 40.24);
  return (
    <AbsoluteFill>
      {/* script doc */}
      <div style={{ position: "absolute", top: 130, left: 90, right: 90, opacity: docK, transform: `translateY(${(1 - docK) * -60}px)` }}>
        <Panel style={{ padding: "26px 32px" }}>
          <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
            {[C.white, C.mint, C.emerald].map((c, i) => (
              <div key={i} style={{ width: 16, height: 16, borderRadius: 8, background: c, opacity: 0.8 }} />
            ))}
            <Mono size={20} color={C.dim} style={{ marginLeft: 14 }}>
              ТЫ ПИШЕШЬ · 1 РАЗ
            </Mono>
          </div>
          {LINES.map((l, i) => {
            const chars = Math.floor(clamp01(typed * LINES.length - i) * l.length);
            return (
              <div key={i} style={{ fontFamily: MONO, fontSize: i === 0 ? 34 : 28, color: i === 0 ? C.mint : C.white, fontWeight: i === 0 ? 800 : 500, minHeight: 42 }}>
                {l.slice(0, chars)}
                {chars < l.length && chars > 0 ? <span style={{ color: C.mint }}>▍</span> : null}
              </div>
            );
          })}
          <div style={{ marginTop: 10, height: 40, display: "flex", alignItems: "center", gap: 16, opacity: translating ? 1 : t >= 35 ? 0.5 : 0 }}>
            <Mono size={22} color={C.dim}>
              TRANSLATE →
            </Mono>
            <Mono size={26} color={C.white}>
              [{cycle.code}] {cycle.hello}
            </Mono>
          </div>
        </Panel>
      </div>

      {/* AI node */}
      <div
        style={{
          position: "absolute",
          left: NODE.x - 90,
          top: NODE.y - 90,
          width: 180,
          height: 180,
          borderRadius: 90,
          background: `radial-gradient(circle, ${C.mint} 0%, ${C.emerald} 55%, rgba(16,185,129,0.1) 100%)`,
          boxShadow: `0 0 ${60 + 30 * Math.sin(t * 6)}px ${C.emerald}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transform: `scale(${sysK})`,
          zIndex: 2,
        }}
      >
        <span style={{ fontFamily: MONO, fontSize: 30, fontWeight: 800, color: C.bg, textAlign: "center", lineHeight: 1.1 }}>
          AI
          <br />
          VOICE
        </span>
      </div>
      <div style={{ position: "absolute", top: NODE.y - 30, left: 70, opacity: sysK }}>
        <Mono size={22} color={C.dim}>
          СИСТЕМА
          <br />
          САМА
        </Mono>
      </div>
      <div style={{ position: "absolute", top: NODE.y - 30, right: 70, textAlign: "right", opacity: sysK }}>
        <Mono size={22} color={C.white}>
          {String(total).padStart(2, "0")}/10
          <br />
          <span style={{ color: C.mint }}>ГОЛОСОВ</span>
        </Mono>
      </div>

      {/* spokes */}
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, zIndex: 1 }}>
        {CHANNELS.map((c, i) => {
          const k = ease(t, c.at, c.at + 0.6);
          if (k <= 0) return null;
          const col = mod(i, 5);
          const row = Math.floor(i / 5);
          const tx = 148 + col * 196;
          const ty = 970 + row * 230;
          const dash = mod(t * 120, 40);
          return (
            <line
              key={i}
              x1={NODE.x}
              y1={NODE.y}
              x2={NODE.x + (tx - NODE.x) * k}
              y2={NODE.y + (ty - NODE.y) * k}
              stroke={C.mint}
              strokeWidth={3}
              strokeDasharray="10 10"
              strokeDashoffset={-dash}
              opacity={0.6}
            />
          );
        })}
      </svg>

      {/* channel cards fanning out */}
      {CHANNELS.map((c, i) => {
        const k = ease(t, c.at, c.at + 0.6);
        const pk = pop(t, c.at, 0.6);
        const col = mod(i, 5);
        const row = Math.floor(i / 5);
        const tx = 148 + col * 196;
        const ty = 970 + row * 230;
        const x = NODE.x + (tx - NODE.x) * k;
        const y = NODE.y + (ty - NODE.y) * k;
        const fanRot = (col - 2) * 9 * (1 - k);
        const up = ease(t, Math.max(39.44, c.at + 0.4), 40.7, (q) => q);
        const voiceActive = t >= c.at && t < c.at + 0.7;
        return (
          <div
            key={c.code}
            style={{
              position: "absolute",
              left: x - 86,
              top: y - 100,
              width: 172,
              height: 200,
              transform: `scale(${0.35 + 0.65 * pk}) rotate(${fanRot}deg)`,
              opacity: k,
              zIndex: 3,
            }}
          >
            <Panel style={{ width: "100%", height: "100%", padding: 16, boxSizing: "border-box", borderColor: voiceActive ? C.mint : C.line }} glow={voiceActive ? 1 : 0.25}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <MiniFlag i={i} />
                <span style={{ fontFamily: GROTESK, fontSize: 40, fontWeight: 800, color: C.white }}>{c.code}</span>
              </div>
              <div style={{ marginTop: 10, display: "flex", gap: 4, alignItems: "flex-end", height: 34 }}>
                {Array.from({ length: 12 }).map((_, b) => (
                  <div
                    key={b}
                    style={{
                      flex: 1,
                      borderRadius: 2,
                      background: C.mint,
                      height: 6 + (voiceActive ? 26 : 8) * Math.abs(Math.sin(b * 1.1 + t * 11 + i)),
                    }}
                  />
                ))}
              </div>
              <Mono size={17} color={C.dim} style={{ display: "block", marginTop: 8, letterSpacing: 0 }}>
                @voice_{c.code.toLowerCase()}
              </Mono>
              <div style={{ marginTop: 8, height: 8, borderRadius: 4, background: C.faint, overflow: "hidden" }}>
                <div style={{ width: `${up * 100}%`, height: "100%", background: C.emerald }} />
              </div>
              <Mono size={16} color={up >= 1 ? C.mint : C.dim} style={{ letterSpacing: 0 }}>
                {up >= 1 ? "✓ ЗАЛИТО" : up > 0 ? `▲ ${Math.round(up * 100)}%` : "в очереди"}
              </Mono>
            </Panel>
          </div>
        );
      })}

      <div style={{ position: "absolute", top: 1420, left: 0, right: 0, textAlign: "center", transform: `scale(${tenK})`, opacity: tenK }}>
        <span style={{ fontFamily: GROTESK, fontSize: 64, fontWeight: 800, color: C.white }}>
          → <span style={{ fontFamily: MONO, color: C.mint }}>10</span> КАНАЛОВ · АВТОЗАЛИВКА
        </span>
      </div>
    </AbsoluteFill>
  );
};

// -------------------------------------------------------------------------
// SCENE 5 — ×10 traffic + 5X CPM chart
// -------------------------------------------------------------------------
const CPM = [
  { code: "RU", v: 1.1 },
  { code: "ES", v: 3.6 },
  { code: "JP", v: 4.3 },
  { code: "DE", v: 5.1 },
  { code: "EN", v: 5.6 },
];

const Scene5: React.FC<{ t: number }> = ({ t }) => {
  const streamsK = ease(t, 41.8, 43.3);
  const count = Math.max(1, Math.round(interpolate(ease(t, 43.4, 44.5), [0, 1], [1, 10])));
  const fiveK = pop(t, 46.1, 0.5);
  const CH_TOP = 760;
  const CH_H = 520;
  const MAXV = 9.5;
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", top: 120, left: 70, right: 70, display: "flex", justifyContent: "space-between" }}>
        <Mono size={26}>// TRAFFIC.SPLIT</Mono>
        <Mono size={26} color={C.dim}>
          1 → {count}
        </Mono>
      </div>

      {/* one video → 10 streams */}
      <svg width={1080} height={420} style={{ position: "absolute", top: 190, left: 0 }}>
        <rect x={70} y={150} width={180} height={120} rx={18} fill={C.emerald} />
        <path d="M145 185 L185 210 L145 235 Z" fill={C.bg} />
        {Array.from({ length: 10 }).map((_, i) => {
          const ty = 20 + i * 42;
          const vis = clamp01(streamsK * 10 - i);
          const d = `M250 210 C 480 210, 560 ${ty}, ${250 + 760 * vis} ${ty}`;
          const dotP = mod(t * 70 + i * 13, 100) / 100;
          return (
            <g key={i} opacity={vis}>
              <path d={d} fill="none" stroke={mod(i, 2) ? C.mint : C.emerald} strokeWidth={4} opacity={0.75} />
              <circle cx={250 + 760 * dotP * vis} cy={210 + (ty - 210) * Math.min(1, dotP * 1.6)} r={7} fill={C.white} />
              <text x={1020} y={ty + 8} textAnchor="end" fontFamily={MONO} fontSize={20} fill={C.dim}>
                {LANGS[mod(i, LANGS.length)]}
              </text>
            </g>
          );
        })}
      </svg>
      <div style={{ position: "absolute", top: 610, left: 70 }}>
        <Rise t={t} at={43.4}>
          <span style={{ fontFamily: GROTESK, fontSize: 60, fontWeight: 800, color: C.white }}>
            <span style={{ fontFamily: MONO, color: C.mint }}>10</span> ИСТОЧНИКОВ ТРАФИКА
          </span>
        </Rise>
      </div>

      {/* CPM chart */}
      <Panel style={{ position: "absolute", top: CH_TOP, left: 70, right: 70, height: CH_H + 140, padding: 30, boxSizing: "border-box" }}>
        <Mono size={22} color={C.dim}>
          CPM · $ ЗА 1000 ПОКАЗОВ
        </Mono>
        <div style={{ position: "absolute", left: 30, right: 30, top: 80, height: CH_H, display: "flex", alignItems: "flex-end", gap: 34, padding: "0 20px" }}>
          {[0.25, 0.5, 0.75].map((g) => (
            <div key={g} style={{ position: "absolute", left: 0, right: 0, bottom: g * (CH_H - 70), height: 1, background: C.faint }} />
          ))}
          {CPM.map((b, i) => {
            const k = ease(t, 45.2 + i * 0.12, 46.0 + i * 0.12);
            const h = (b.v / MAXV) * (CH_H - 70) * k;
            const ru = b.code === "RU";
            return (
              <div key={b.code} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", height: "100%" }}>
                <Mono size={24} color={ru ? C.dim : C.white} style={{ marginBottom: 8, opacity: k }}>
                  ${(b.v * k).toFixed(1)}
                </Mono>
                <div
                  style={{
                    width: "100%",
                    height: h,
                    borderRadius: "12px 12px 4px 4px",
                    background: ru ? "rgba(248,250,252,0.22)" : `linear-gradient(to top, ${C.emerald}, ${C.mint})`,
                    boxShadow: ru ? "none" : `0 0 24px rgba(52,211,153,0.45)`,
                  }}
                />
                <Mono size={26} color={ru ? C.dim : C.mint} style={{ marginTop: 12 }}>
                  {b.code}
                </Mono>
              </div>
            );
          })}
        </div>
      </Panel>

      {/* 5X stamp — sits in the free headroom above the (shorter) bars */}
      <div
        style={{
          position: "absolute",
          top: 850,
          left: 110,
          right: 110,
          display: "flex",
          alignItems: "center",
          gap: 28,
          transform: `scale(${fiveK}) rotate(-3deg)`,
          transformOrigin: "30% 50%",
          opacity: fiveK,
        }}
      >
        <div style={{ fontFamily: MONO, fontSize: 150, fontWeight: 800, color: C.mint, lineHeight: 0.9, textShadow: `0 0 60px ${C.emerald}` }}>5X</div>
        <div>
          <div style={{ fontFamily: GROTESK, fontSize: 46, fontWeight: 800, color: C.white, letterSpacing: 1 }}>ЦЕНА РЕКЛАМЫ</div>
          <Mono size={22} color={C.dim}>
            EN $5.6 vs RU $1.1
          </Mono>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// -------------------------------------------------------------------------
// SCENE 6 — CTA
// -------------------------------------------------------------------------
const Scene6: React.FC<{ t: number }> = ({ t }) => {
  const word = "ГОЛОС";
  const typed = Math.floor(ease(t, 49.46, 50.1, (x) => x) * word.length);
  const sent = pop(t, 50.72);
  const showK = ease(t, 51.16, 51.7);
  const caret = mod(t * 2, 2) === 0;
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", top: 150, left: 0, right: 0, textAlign: "center" }}>
        <Rise t={t} at={48.76}>
          <span style={{ fontFamily: GROTESK, fontSize: 120, fontWeight: 800, color: C.white, letterSpacing: -3 }}>НАПИШИ</span>
        </Rise>
        <Rise t={t} at={49.46}>
          <span style={{ fontFamily: MONO, fontSize: 150, fontWeight: 800, color: C.mint, textShadow: `0 0 70px ${C.emerald}` }}>«ГОЛОС»</span>
        </Rise>
      </div>

      {/* comment box */}
      <div style={{ position: "absolute", top: 600, left: 70, right: 70 }}>
        <Panel style={{ padding: "24px 28px", display: "flex", alignItems: "center", gap: 20 }} glow={0.8}>
          <div style={{ width: 70, height: 70, borderRadius: 35, background: C.emerald, flexShrink: 0 }} />
          <div style={{ flex: 1, fontFamily: MONO, fontSize: 46, fontWeight: 700, color: C.white }}>
            {typed > 0 ? word.slice(0, typed) : <span style={{ color: C.dim, fontSize: 32 }}>Добавьте комментарий…</span>}
            {caret && sent < 0.5 ? <span style={{ color: C.mint }}>▍</span> : null}
          </div>
          <div
            style={{
              width: 84,
              height: 84,
              borderRadius: 42,
              background: typed >= word.length ? C.mint : C.faint,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transform: `scale(${1 + 0.15 * Math.sin(clamp01((t - 50.5) * 3) * Math.PI)})`,
            }}
          >
            <svg width={40} height={40} viewBox="0 0 24 24">
              <path d="M3 11 L21 3 L13 21 L11 13 Z" fill={C.bg} />
            </svg>
          </div>
        </Panel>
        {/* posted comment */}
        <div style={{ marginTop: 26, opacity: sent, transform: `translateY(${(1 - sent) * -40}px)` }}>
          <Panel style={{ padding: "20px 28px" }}>
            <Mono size={22} color={C.dim}>
              @ты · сейчас
            </Mono>
            <div style={{ fontFamily: GROTESK, fontSize: 48, fontWeight: 800, color: C.white, marginTop: 6 }}>ГОЛОС</div>
            <Mono size={22}>♥ 1  ·  ответ автора: настройка в ЛС</Mono>
          </Panel>
        </div>
      </div>

      <div style={{ position: "absolute", top: 1130, right: 70, width: 560, opacity: showK, transform: `translateX(${(1 - showK) * 80}px)` }}>
        <Mono size={30} color={C.white} style={{ lineHeight: 1.5 }}>
          → ПОКАЖУ,
          <br />
          КАК ЭТО
          <br />
          <span style={{ color: C.mint }}>НАСТРОИТЬ_</span>
        </Mono>
      </div>

      <FlatSpeaker t={t} x={250} y={1470} size={270} appear={48.8} talking />
    </AbsoluteFill>
  );
};

// -------------------------------------------------------------------------
// Transition wrapper
// -------------------------------------------------------------------------
const SceneSlot: React.FC<{ t: number; i: number; children: React.ReactNode }> = ({ t, i, children }) => {
  const s = SCENES[i];
  const last = i === SCENES.length - 1;
  if (t < s.a || (!last && t >= s.b + TR)) return null;
  const p = s.tr === "none" ? 1 : ease(t, s.a, s.a + TR, SMOOTH);
  const z = i + 1;

  if (s.tr === "split" && p < 1) {
    return (
      <>
        {[0, 1].map((half) => (
          <AbsoluteFill
            key={half}
            style={{
              zIndex: z,
              background: C.bg,
              clipPath: half === 0 ? "inset(0 0 50% 0)" : "inset(50% 0 0 0)",
              transform: `translateY(${(half === 0 ? -1 : 1) * (1 - p) * 980}px)`,
            }}
          >
            {children}
          </AbsoluteFill>
        ))}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 958,
            height: 4,
            background: C.mint,
            boxShadow: `0 0 30px ${C.mint}`,
            opacity: Math.sin(p * Math.PI),
            zIndex: z + 1,
          }}
        />
      </>
    );
  }

  let clipPath: string | undefined;
  let edge: React.ReactNode = null;
  if (s.tr === "wipe" && p < 1) {
    const X = -500 + p * 2100;
    clipPath = `polygon(0 0, ${X}px 0, ${X - 420}px 1920px, 0 1920px)`;
    edge = (
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, zIndex: z + 1 }}>
        <line x1={X} y1={0} x2={X - 420} y2={1920} stroke={C.mint} strokeWidth={6} style={{ filter: `drop-shadow(0 0 18px ${C.mint})` }} />
      </svg>
    );
  }
  if (s.tr === "radial" && p < 1) {
    const r = p * 1250;
    clipPath = `circle(${r}px at 50% 45%)`;
    edge = (
      <div
        style={{
          position: "absolute",
          left: 540 - r,
          top: 864 - r,
          width: r * 2,
          height: r * 2,
          borderRadius: "50%",
          border: `6px solid ${C.mint}`,
          boxShadow: `0 0 40px ${C.mint}, inset 0 0 40px rgba(16,185,129,0.5)`,
          zIndex: z + 1,
          boxSizing: "border-box",
        }}
      />
    );
  }
  return (
    <>
      <AbsoluteFill style={{ zIndex: z, background: s.tr === "none" ? "transparent" : C.bg, clipPath }}>
        {s.tr !== "none" ? <Background t={t} /> : null}
        {children}
      </AbsoluteFill>
      {edge}
    </>
  );
};

// -------------------------------------------------------------------------
// Overlays: radial pulses, subtitles, HUD
// -------------------------------------------------------------------------
const RadialPulses: React.FC<{ t: number }> = ({ t }) => (
  <AbsoluteFill style={{ pointerEvents: "none" }}>
    {PULSES.map((p, i) => {
      const d = t - p;
      if (d < 0 || d > 0.9) return null;
      return [0, 0.14].map((off, j) => {
        const q = clamp01((d - off) / 0.75);
        if (q <= 0) return null;
        const r = 80 + q * 900;
        return (
          <div
            key={`${i}-${j}`}
            style={{
              position: "absolute",
              left: 540 - r,
              top: 860 - r,
              width: r * 2,
              height: r * 2,
              borderRadius: "50%",
              border: `${4 - j * 2}px solid ${C.mint}`,
              opacity: (1 - q) * 0.7,
              boxSizing: "border-box",
            }}
          />
        );
      });
    })}
  </AbsoluteFill>
);

const KEY_RE = /^(2026|голос|голосом|деньги|10|30|секунд|нейросеть|слепок|10|5|раз|выше|напиши|голос)$/i;

const Subtitles: React.FC<{ t: number }> = ({ t }) => {
  const idx = CHUNKS.findIndex((c, i) => {
    const next = CHUNKS[i + 1];
    const until = next ? Math.min(next.start, c.end + 0.35) : c.end + 0.8;
    return t >= c.start - 0.05 && t < until;
  });
  if (idx < 0) return null;
  const chunk = CHUNKS[idx];
  const inK = ease(t, chunk.start - 0.05, chunk.start + 0.2);
  const variant = mod(idx, 3); // vary entrance: rise / slide / fade-scale
  const enter =
    variant === 0
      ? `translateY(${(1 - inK) * 40}px)`
      : variant === 1
        ? `translateX(${(1 - inK) * (mod(idx, 2) ? 60 : -60)}px)`
        : `scale(${0.88 + 0.12 * inK})`;
  return (
    <div
      style={{
        position: "absolute",
        top: 1545,
        left: 40,
        right: 40,
        height: 260,
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        alignContent: "center",
        columnGap: 10,
        rowGap: 8,
        transform: enter,
        opacity: inK,
        zIndex: 50,
      }}
    >
      {chunk.words.map((w, i) => {
        const on = t >= w.start;
        const act =
          interpolate(t, [w.start - 0.03, w.start + 0.09], [0, 1], { ...clamp, easing: EXPO }) *
          interpolate(t, [w.end, w.end + 0.14], [1, 0], clamp);
        const key = KEY_RE.test(w.word.replace(/[.,!?«»]/g, ""));
        // Font-size (not transform) grows so layout reflows → neighbours are pushed away, never overlap.
        const fs = 70 * (1 + 0.16 * act);
        const hl = key && on;
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              margin: `0 ${10 + 14 * act}px`,
              padding: hl ? "2px 18px" : `2px ${6 + 8 * act}px`,
              borderRadius: 14,
              background: hl ? C.emerald : act > 0.01 ? `rgba(16,185,129,${0.22 * act})` : "transparent",
              fontFamily: hl ? MONO : GROTESK,
              fontSize: fs,
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: hl ? 0 : -1,
              lineHeight: 1.15,
              whiteSpace: "nowrap",
              color: hl ? C.bg : act > 0.5 ? C.mint : on ? C.white : "rgba(248,250,252,0.38)",
              boxShadow: hl ? `0 0 36px rgba(52,211,153,0.55)` : "none",
              textShadow: hl ? "none" : "0 6px 18px rgba(0,0,0,0.9)",
            }}
          >
            {w.word}
          </span>
        );
      })}
    </div>
  );
};

const HUD: React.FC<{ t: number }> = ({ t }) => {
  const total = 54;
  return (
    <AbsoluteFill style={{ pointerEvents: "none", zIndex: 60 }}>
      <div style={{ position: "absolute", top: 0, left: 0, height: 6, width: `${(t / total) * 100}%`, background: C.emerald, boxShadow: `0 0 14px ${C.mint}` }} />
      <div style={{ position: "absolute", top: 60, left: 70 }}>
        <Mono size={20} color={C.dim}>
          MAKE IT EASY AI
        </Mono>
      </div>
      <div style={{ position: "absolute", top: 60, right: 70 }}>
        <Mono size={20} color={C.dim}>
          {`0${SCENES.findIndex((s, i) => t >= s.a && (i === SCENES.length - 1 || t < SCENES[i + 1].a)) + 1}/06`}
        </Mono>
      </div>
      {/* vignette */}
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 80% 70% at 50% 45%, transparent 55%, rgba(0,0,0,0.65) 100%)" }} />
    </AbsoluteFill>
  );
};

// -------------------------------------------------------------------------
// Root
// -------------------------------------------------------------------------
export const VoiceCloneReel: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const cam = camera(t);
  const scenes = [Scene1, Scene2, Scene3, Scene4, Scene5, Scene6];
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg, overflow: "hidden" }}>
      <Audio src={staticFile("voice_clone_reel/voice.mp3")} />
      <Background t={t} />
      <AbsoluteFill
        style={{
          transform: `translate(${cam.x}px, ${cam.y}px) scale(${cam.scale}) rotate(${cam.rot}deg)`,
          transformOrigin: "50% 45%",
        }}
      >
        {scenes.map((S, i) => (
          <SceneSlot key={i} t={t} i={i}>
            <S t={t} />
          </SceneSlot>
        ))}
        <RadialPulses t={t} />
      </AbsoluteFill>
      <Subtitles t={t} />
      <HUD t={t} />
    </AbsoluteFill>
  );
};
