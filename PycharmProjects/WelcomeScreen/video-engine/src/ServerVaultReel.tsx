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

/*
 * =========================================================================
 * SERVER VAULT REEL — 1080x1920 @ 60 FPS, 2520 FRAMES (42s)
 * Titanium-Gold Brutalism.
 *
 *   01  0.0 –  7.8s : Underground 3D vault. Circular steel doors slide open,
 *                     aisle of black-gold racks, master console asks
 *                     "ПОЧЕМУ КОМПАНИИ НЕ НАНИМАЮТ НОВИЧКОВ?".
 *                     6.2 → 7.8s camera flies INTO the console screen.
 *   02  7.8 – 10.8s : 1 цифровой сотрудник ($20/мес) vs 3 стажёра (crossed out)
 *   03 10.8 – 16.1s : 4 zero-counters + 1 000 documents scanned
 *   04 16.1 – 26.3s : Split: "ПОЛДНЯ НА 1 ТАБЛИЦУ" vs "AI-АГЕНТ: 2 МИНУТЫ · 0 ОШИБОК"
 *   05 26.3 – 36.0s : "ПЛАТЯТ ТЕМ, КТО СОЗДАЁТ ЦИФРОВЫХ СОТРУДНИКОВ" — 3D architect node
 *   06 36.0 – 42.0s : Pull back OUT into the glowing vault, "VAULT CLUSTER: ONLINE",
 *                     CTA "НАПИШИ СОТРУДНИК"
 *
 * All cyclic indices / offsets go through mod().
 * =========================================================================
 */

const FPS = 60;

const C = {
  bg: "#090A0C",
  gold: "#D4AF37",
  plat: "#E5E7EB",
  slate: "#1F242D",
  red: "#DC2626",
  slateDeep: "#121419",
  goldDim: "rgba(212,175,55,0.45)",
  goldFaint: "rgba(212,175,55,0.14)",
  platDim: "rgba(229,231,235,0.58)",
  platMute: "rgba(229,231,235,0.32)",
  line: "rgba(229,231,235,0.07)",
  redDim: "rgba(220,38,38,0.35)",
};

const SANS = "'Inter', 'SF Pro Display', -apple-system, 'Helvetica Neue', Arial, sans-serif";
const MONO = "'JetBrains Mono', 'SF Mono', Menlo, Consolas, monospace";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const EASE_IO = Easing.bezier(0.65, 0, 0.3, 1);
const EXPO_OUT = Easing.bezier(0.16, 1, 0.3, 1);
const sec = (s: number) => Math.round(s * FPS);
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

/** Safe modulo — always returns a value in [0, m), even for negative n. */
const mod = (n: number, m: number) => ((n % m) + m) % m;

const rand = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

const smooth = (a: number, b: number, x: number) => {
  const u = clamp01((x - a) / (b - a));
  return u * u * (3 - 2 * u);
};

const ease01 = (a: number, b: number, t: number, e = EASE_IO) => interpolate(t, [a, b], [0, 1], { ...clamp, easing: e });

/** Window alpha: fades in around a, out around b (seconds). */
const win = (t: number, a: number, b: number, fi = 0.3, fo = 0.3) =>
  Math.min(fi > 0 ? smooth(a - fi * 0.5, a + fi * 0.5, t) : t >= a ? 1 : 0, fo > 0 ? 1 - smooth(b - fo, b, t) : t < b ? 1 : 0);

const sp = (f: number, atSec: number, cfg = { damping: 14, stiffness: 170, mass: 0.6 }) =>
  spring({ frame: Math.max(0, f - sec(atSec)), fps: FPS, config: cfg });

const fmt = (n: number) => Math.round(n).toLocaleString("ru-RU").replace(/\s/g, " ");
const pad2 = (n: number) => String(Math.floor(n)).padStart(2, "0");

// -------------------------------------------------------------------------
// Words (inlined from public/server_vault_reel/words.json)
// -------------------------------------------------------------------------
type Word = { word: string; start: number; end: number };
const WORDS: Word[] = [
  { word: "А", start: 0.0, end: 0.24 },
  { word: "знаешь,", start: 0.24, end: 0.48 },
  { word: "почему", start: 0.6, end: 0.86 },
  { word: "в", start: 0.86, end: 1.02 },
  { word: "2026", start: 1.02, end: 2.28 },
  { word: "году", start: 2.28, end: 2.86 },
  { word: "компании", start: 2.86, end: 3.34 },
  { word: "перестали", start: 3.34, end: 3.9 },
  { word: "нанимать", start: 3.9, end: 4.4 },
  { word: "новичков?", start: 4.4, end: 4.9 },
  { word: "Потому", start: 5.3, end: 5.54 },
  { word: "что", start: 5.54, end: 5.78 },
  { word: "один", start: 5.78, end: 5.98 },
  { word: "цифровой", start: 5.98, end: 6.5 },
  { word: "сотрудник", start: 6.5, end: 6.98 },
  { word: "за", start: 6.98, end: 7.14 },
  { word: "20", start: 7.14, end: 7.52 },
  { word: "долларов", start: 7.52, end: 7.92 },
  { word: "в", start: 7.92, end: 8.16 },
  { word: "месяц", start: 8.16, end: 8.56 },
  { word: "заменяет", start: 8.56, end: 9.42 },
  { word: "троих", start: 9.42, end: 9.78 },
  { word: "стажеров.", start: 9.78, end: 10.26 },
  { word: "Он", start: 10.82, end: 10.96 },
  { word: "не", start: 10.96, end: 11.16 },
  { word: "опаздывает,", start: 11.16, end: 11.76 },
  { word: "не", start: 11.9, end: 11.96 },
  { word: "выгарает,", start: 11.96, end: 12.4 },
  { word: "не", start: 12.56, end: 12.6 },
  { word: "просит", start: 12.6, end: 12.96 },
  { word: "отпуск", start: 12.96, end: 13.38 },
  { word: "и", start: 13.38, end: 13.6 },
  { word: "читает", start: 13.6, end: 14.0 },
  { word: "тысячи", start: 14.0, end: 14.5 },
  { word: "документов", start: 14.5, end: 14.96 },
  { word: "за", start: 14.96, end: 15.18 },
  { word: "секунды.", start: 15.18, end: 15.64 },
  { word: "Пока", start: 16.16, end: 16.5 },
  { word: "обычный", start: 16.5, end: 17.0 },
  { word: "работник", start: 17.0, end: 17.52 },
  { word: "тратит", start: 17.52, end: 17.9 },
  { word: "полдня", start: 17.9, end: 18.4 },
  { word: "на", start: 18.4, end: 18.6 },
  { word: "одну", start: 18.6, end: 18.86 },
  { word: "таблицу", start: 18.86, end: 19.4 },
  { word: "и", start: 19.4, end: 19.58 },
  { word: "разбор", start: 19.58, end: 19.9 },
  { word: "почты,", start: 19.9, end: 20.42 },
  { word: "и", start: 20.96, end: 21.04 },
  { word: "иогент", start: 21.04, end: 21.84 },
  { word: "закрывает", start: 21.84, end: 22.62 },
  { word: "весь", start: 22.62, end: 22.86 },
  { word: "объем", start: 22.86, end: 23.4 },
  { word: "за", start: 23.4, end: 23.86 },
  { word: "две", start: 23.86, end: 24.1 },
  { word: "минуты", start: 24.1, end: 24.58 },
  { word: "без", start: 24.58, end: 24.82 },
  { word: "единой", start: 24.82, end: 25.24 },
  { word: "ошибки.", start: 25.24, end: 25.86 },
  { word: "Но", start: 26.38, end: 26.56 },
  { word: "это", start: 26.56, end: 26.74 },
  { word: "не", start: 26.74, end: 26.86 },
  { word: "значит,", start: 26.86, end: 27.22 },
  { word: "что", start: 27.26, end: 27.46 },
  { word: "работы", start: 27.46, end: 27.76 },
  { word: "больше", start: 27.76, end: 28.14 },
  { word: "нет.", start: 28.14, end: 28.46 },
  { word: "Теперь", start: 28.46, end: 29.18 },
  { word: "платят", start: 29.18, end: 29.64 },
  { word: "тем,", start: 29.64, end: 29.92 },
  { word: "кто", start: 30.12, end: 30.26 },
  { word: "умеет", start: 30.26, end: 30.72 },
  { word: "создавать", start: 30.72, end: 31.24 },
  { word: "и", start: 31.24, end: 31.68 },
  { word: "настраивать", start: 31.68, end: 32.3 },
  { word: "таких", start: 32.3, end: 32.6 },
  { word: "цифровых", start: 32.6, end: 33.2 },
  { word: "сотрудников", start: 33.2, end: 33.76 },
  { word: "для", start: 33.76, end: 34.0 },
  { word: "бизнеса.", start: 34.0, end: 34.66 },
  { word: "Напиши", start: 35.28, end: 35.88 },
  { word: "слово", start: 35.88, end: 36.12 },
  { word: "сотрудник", start: 36.12, end: 36.86 },
  { word: "в", start: 36.86, end: 37.02 },
  { word: "комментариях,", start: 37.02, end: 37.88 },
  { word: "и", start: 38.18, end: 38.38 },
  { word: "я", start: 38.38, end: 38.52 },
  { word: "скину", start: 38.52, end: 38.9 },
  { word: "инструкцию", start: 38.9, end: 39.64 },
  { word: "по", start: 39.64, end: 39.9 },
  { word: "сборке.", start: 39.9, end: 40.42 },
];

const DISPLAY_FIX: Record<string, string> = {
  "стажеров.": "стажёров.",
  "выгарает,": "выгорает,",
  "иогент": "ИИ-агент",
  "объем": "объём",
};

// -------------------------------------------------------------------------
// Camera
// -------------------------------------------------------------------------
const SCREEN = { x: 360, y: 640, w: 360, h: 640 }; // console screen, 9:16, centred at (540, 960)
const ZOOM_MAX = 1080 / SCREEN.w; // = 3 → screen fills 1080x1920

type Cam = { camZ: number; camY: number; rx: number; ry: number; zoom: number };

const getCamera = (t: number): Cam => {
  if (t < 20) {
    const k = ease01(0.4, 6.2, t, Easing.bezier(0.42, 0, 0.22, 1));
    const camZ = lerp(-1800, 0, k);
    const drift = 1 - smooth(4.8, 6.2, t);
    const thud = t > 0.62 ? Math.exp(-(t - 0.62) * 9) * Math.sin((t - 0.62) * 70) * 9 : 0;
    const ry = Math.sin(t * 0.7) * 2.4 * drift;
    const rx = (Math.sin(t * 0.5 + 1.2) * 1.0 + 1.4) * drift;
    const zk = ease01(6.2, 7.8, t, Easing.bezier(0.55, 0, 0.3, 1));
    return { camZ, camY: thud, rx, ry, zoom: Math.pow(ZOOM_MAX, zk) };
  }
  const zk = 1 - ease01(36.0, 37.6, t, Easing.bezier(0.6, 0, 0.35, 1));
  const back = ease01(37.2, 42.0, t, Easing.bezier(0.3, 0.1, 0.25, 1));
  const drift = smooth(37.3, 38.8, t);
  return {
    camZ: lerp(0, -620, back),
    camY: 0,
    rx: drift * (1.2 + Math.sin(t * 0.6) * 0.6),
    ry: drift * Math.sin((t - 37.3) * 0.55) * 3.2,
    zoom: Math.pow(ZOOM_MAX, zk),
  };
};

// Punch zoom on key words
const PUNCH_AT = [7.14, 9.42, 11.16, 14.0, 15.18, 17.9, 23.86, 25.24, 29.18, 32.6, 35.28];
const punch = (t: number) => {
  let p = 0;
  for (const k of PUNCH_AT) if (t >= k) p += 0.055 * Math.exp(-(t - k) * 5.5) * smooth(k, k + 0.07, t);
  return p;
};

// -------------------------------------------------------------------------
// 3D VAULT WORLD (CSS 3D)
// -------------------------------------------------------------------------
const FLOOR_Y = 1560;
const CEIL_Y = 200;
const RACK_TOP = 380;
const RACK_H = FLOOR_Y - RACK_TOP;
const RACK_W = 320; // depth along aisle
const RACK_COUNT = 9;
const LEFT_X = 110;
const RIGHT_X = 970;
const BACK_Z = -2800;
const DOOR_Z = 650;
const DOOR_R = 520;

const rackZ = (i: number) => 520 - i * 370;

const RackFace: React.FC<{ i: number; side: -1 | 1; t: number; glow: number; camZ: number }> = ({ i, side, t, glow, camZ }) => {
  const zFront = rackZ(i);
  const dist = -(zFront - RACK_W / 2 + camZ);
  const fog = clamp01((dist - 300) / 2600);
  const blur = fog * 3.2;
  const seed = i * 17 + (side > 0 ? 101 : 0);
  const pulse = 0.5 + 0.5 * Math.sin(t * 3.2 - i * 0.75 + (side > 0 ? 1.3 : 0));
  const strip = lerp(0.35 + 0.65 * pulse, 1, glow);
  const blades = 14;
  const transform =
    side < 0
      ? `translate3d(0,0,${zFront}px) rotateY(90deg)`
      : `translate3d(0,0,${zFront - RACK_W}px) rotateY(-90deg)`;
  // aisle-facing edge = the edge nearest the camera
  const nearEdge = side < 0 ? { left: 0 } : { right: 0 };
  return (
    <div
      style={{
        position: "absolute",
        left: side < 0 ? LEFT_X : RIGHT_X,
        top: RACK_TOP,
        width: RACK_W - 26,
        height: RACK_H,
        transformOrigin: "0 50%",
        transform,
        background: "linear-gradient(180deg, #16191F 0%, #0D0F12 100%)",
        border: `2px solid rgba(212,175,55,${0.35 + 0.4 * glow})`,
        boxSizing: "border-box",
        filter: blur > 0.15 ? `blur(${blur.toFixed(2)}px)` : undefined,
        overflow: "hidden",
      }}
    >
      {/* header plate */}
      <div style={{ position: "absolute", left: 16, right: 16, top: 14, height: 34, background: C.slate, borderBottom: `2px solid ${C.goldDim}`, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 12px", boxSizing: "border-box" }}>
        <span style={{ fontFamily: MONO, fontSize: 15, color: C.gold, letterSpacing: 2 }}>{`R-${side < 0 ? "L" : "R"}${pad2(i + 1)}`}</span>
        <span style={{ width: 10, height: 10, borderRadius: 5, background: glow > 0.5 || pulse > 0.3 ? C.gold : C.slate, boxShadow: `0 0 10px ${C.gold}` }} />
      </div>
      {/* blades */}
      {Array.from({ length: blades }).map((_, b) => {
        const r = rand(seed * 13 + b);
        const blink = mod(Math.floor(t * (5 + r * 6) + r * 40), 7) !== 0;
        const on = lerp(blink ? 0.35 + 0.65 * r : 0.12, 1, glow);
        return (
          <div
            key={b}
            style={{
              position: "absolute",
              left: 16,
              right: 16,
              top: 64 + b * 76,
              height: 62,
              background: "linear-gradient(180deg, #1C2028 0%, #111318 100%)",
              borderTop: "1px solid rgba(229,231,235,0.09)",
              boxSizing: "border-box",
            }}
          >
            <div style={{ position: "absolute", left: 14, top: 26, width: 8, height: 8, borderRadius: 4, background: C.gold, opacity: on, boxShadow: `0 0 ${6 + 10 * on}px ${C.gold}` }} />
            <div style={{ position: "absolute", left: 30, top: 26, width: 8, height: 8, borderRadius: 4, background: r > 0.85 && glow < 0.5 ? C.red : C.gold, opacity: lerp(r * 0.6, 0.9, glow) }} />
            <div style={{ position: "absolute", left: 54, right: 16, top: 22, height: 16, background: "repeating-linear-gradient(90deg, rgba(229,231,235,0.12) 0 3px, transparent 3px 8px)" }} />
          </div>
        );
      })}
      {/* vertical gold LED strip */}
      <div style={{ position: "absolute", ...nearEdge, top: 0, bottom: 0, width: 9, background: C.gold, opacity: strip, boxShadow: `0 0 ${18 + 30 * strip}px ${C.gold}` }} />
      {/* distance fog */}
      <div style={{ position: "absolute", inset: 0, background: `rgba(9,10,12,${fog * 0.78})` }} />
    </div>
  );
};

const ConsoleScreen: React.FC<{ t: number; mode: "hook" | "online"; f: number }> = ({ t, mode, f }) => {
  const scan = mod(t * 220, SCREEN.h + 80) - 40;
  const lines =
    mode === "hook"
      ? [
          { s: "ПОЧЕМУ", at: 0.6, c: C.plat },
          { s: "КОМПАНИИ", at: 2.86, c: C.plat },
          { s: "НЕ НАНИМАЮТ", at: 3.9, c: C.plat },
          { s: "НОВИЧКОВ?", at: 4.4, c: C.gold },
        ]
      : [];
  return (
    <div
      style={{
        position: "absolute",
        left: SCREEN.x,
        top: SCREEN.y,
        width: SCREEN.w,
        height: SCREEN.h,
        background: "radial-gradient(120% 80% at 50% 40%, #171A20 0%, #090A0C 75%)",
        overflow: "hidden",
        boxShadow: `0 0 0 3px ${C.gold}, 0 0 60px rgba(212,175,55,0.35)`,
      }}
    >
      <div style={{ position: "absolute", inset: 0, backgroundImage: `linear-gradient(${C.line} 1px, transparent 1px), linear-gradient(90deg, ${C.line} 1px, transparent 1px)`, backgroundSize: "30px 30px" }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 40, background: C.slate, borderBottom: `2px solid ${C.gold}`, display: "flex", alignItems: "center", padding: "0 14px", justifyContent: "space-between" }}>
        <span style={{ fontFamily: MONO, fontSize: 13, color: C.gold, letterSpacing: 2 }}>MASTER CONSOLE</span>
        <span style={{ fontFamily: MONO, fontSize: 13, color: mode === "hook" ? C.red : C.gold }}>{mode === "hook" ? "● HR-QUERY" : "● LIVE"}</span>
      </div>
      {mode === "hook" ? (
        <div style={{ position: "absolute", left: 26, right: 20, top: 150 }}>
          <div style={{ fontFamily: MONO, fontSize: 14, color: C.platMute, letterSpacing: 2, marginBottom: 18 }}>{"> QUERY_2026:"}</div>
          {lines.map((l, k) => {
            const a = sp(f, l.at, { damping: 16, stiffness: 220, mass: 0.5 });
            return (
              <div
                key={k}
                style={{
                  fontFamily: SANS,
                  fontWeight: 900,
                  fontSize: 42,
                  lineHeight: 1.08,
                  letterSpacing: -1,
                  color: l.c,
                  opacity: clamp01(a * 1.5),
                  transform: `translateX(${(1 - a) * -30}px)`,
                  textShadow: l.c === C.gold ? "0 0 22px rgba(212,175,55,0.55)" : undefined,
                }}
              >
                {l.s}
              </div>
            );
          })}
          <div style={{ marginTop: 26, height: 4, width: 70, background: C.gold, opacity: mod(Math.floor(t * 2.5), 2) === 0 ? 1 : 0.15 }} />
          <div style={{ marginTop: 40, fontFamily: MONO, fontSize: 16, color: C.red, opacity: smooth(4.5, 4.9, t), letterSpacing: 1.5 }}>
            ВАКАНСИЙ ДЛЯ НОВИЧКОВ: 0
          </div>
        </div>
      ) : (
        <div style={{ position: "absolute", left: 0, right: 0, top: 170, textAlign: "center" }}>
          <div style={{ margin: "0 auto", width: 110, height: 110, borderRadius: 60, border: `5px solid ${C.gold}`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 40px rgba(212,175,55,0.5)" }}>
            <div style={{ width: 44, height: 22, borderLeft: `7px solid ${C.gold}`, borderBottom: `7px solid ${C.gold}`, transform: "translateY(-6px) rotate(-45deg)" }} />
          </div>
          <div style={{ marginTop: 34, fontFamily: MONO, fontSize: 18, color: C.platDim, letterSpacing: 3 }}>VAULT CLUSTER</div>
          <div style={{ fontFamily: SANS, fontWeight: 900, fontSize: 60, color: C.gold, letterSpacing: -1, textShadow: "0 0 26px rgba(212,175,55,0.6)" }}>ONLINE</div>
          <div style={{ marginTop: 26, fontFamily: MONO, fontSize: 16, color: C.plat }}>18/18 RACKS · 100%</div>
        </div>
      )}
      <div style={{ position: "absolute", left: 0, right: 0, top: scan, height: 40, background: "linear-gradient(180deg, transparent, rgba(212,175,55,0.08), transparent)" }} />
    </div>
  );
};

const VaultDoorHalf: React.FC<{ side: -1 | 1; t: number; open: number; unlock: number; wheel: number }> = ({ side, t, open, unlock, wheel }) => {
  const x = side < 0 ? 540 - DOOR_R : 540;
  const cx = side < 0 ? DOOR_R : 0; // circle centre in local coords
  const shift = side * open * (DOOR_R + 60);
  const radius = side < 0 ? `${DOOR_R}px 0 0 ${DOOR_R}px` : `0 ${DOOR_R}px ${DOOR_R}px 0`;
  const base: React.CSSProperties = {
    position: "absolute",
    left: x,
    top: 960 - DOOR_R,
    width: DOOR_R,
    height: DOOR_R * 2,
    borderRadius: radius,
    overflow: "hidden",
  };
  const bolts = 7;
  return (
    <>
      {[48, 32, 16].map((dz, k) => (
        <div key={k} style={{ ...base, transform: `translate3d(${shift}px,0,${DOOR_Z - 10 - dz}px)`, background: k === 0 ? "#08090B" : "#15181D", border: `2px solid rgba(212,175,55,0.25)`, boxSizing: "border-box" }} />
      ))}
      <div
        style={{
          ...base,
          transform: `translate3d(${shift}px,0,${DOOR_Z - 10}px)`,
          background: `radial-gradient(circle at ${cx}px ${DOOR_R}px, #2A2F38 0 86px, ${C.gold} 86px 94px, #1F242D 94px 250px, #3A404B 250px 256px, #1A1D23 256px 430px, ${C.gold} 430px 438px, #262A32 438px 500px, #0E1013 500px)`,
        }}
      >
        {/* brushed steel lines */}
        <div style={{ position: "absolute", inset: 0, background: "repeating-linear-gradient(0deg, rgba(229,231,235,0.035) 0 2px, transparent 2px 7px)" }} />
        {/* locking bolts */}
        {Array.from({ length: bolts }).map((_, b) => {
          const a = side < 0 ? Math.PI / 2 + (Math.PI * (b + 0.5)) / bolts : -Math.PI / 2 + (Math.PI * (b + 0.5)) / bolts;
          const r = 470 - unlock * 40;
          return (
            <div
              key={b}
              style={{
                position: "absolute",
                left: cx + Math.cos(a) * r - 22,
                top: DOOR_R + Math.sin(a) * r - 22,
                width: 44,
                height: 44,
                borderRadius: 22,
                background: "radial-gradient(circle at 35% 35%, #F3E3A1 0%, #D4AF37 40%, #6E5A1C 100%)",
                boxShadow: "0 4px 10px rgba(0,0,0,0.6)",
              }}
            />
          );
        })}
        {/* wheel spokes */}
        <div style={{ position: "absolute", left: cx - 220, top: DOOR_R - 220, width: 440, height: 440, transform: `rotate(${wheel}deg)` }}>
          {[0, 60, 120].map((d) => (
            <div key={d} style={{ position: "absolute", left: 0, top: 210, width: 440, height: 20, borderRadius: 10, background: "linear-gradient(180deg, #F0DC92, #D4AF37 50%, #7A6420)", transform: `rotate(${d}deg)` }} />
          ))}
          <div style={{ position: "absolute", left: 160, top: 160, width: 120, height: 120, borderRadius: 60, background: "radial-gradient(circle at 40% 35%, #3A404B, #111317)", border: `6px solid ${C.gold}`, boxSizing: "border-box" }} />
        </div>
        {/* status light */}
        <div
          style={{
            position: "absolute",
            left: cx - 9,
            top: DOOR_R - 330,
            width: 18,
            height: 18,
            borderRadius: 9,
            background: unlock > 0.5 ? C.gold : C.red,
            boxShadow: `0 0 24px ${unlock > 0.5 ? C.gold : C.red}`,
            opacity: unlock > 0.5 ? 1 : 0.5 + 0.5 * Math.abs(Math.sin(t * 9)),
          }}
        />
      </div>
    </>
  );
};

const VaultWorld: React.FC<{ t: number; f: number; cam: Cam; glow: number; mode: "hook" | "online" }> = ({ t, f, cam, glow, mode }) => {
  const unlock = ease01(0.15, 0.6, t);
  const wheel = 120 * ease01(0.05, 0.6, t);
  const open = mode === "hook" ? ease01(0.7, 2.4, t, Easing.bezier(0.6, 0, 0.25, 1)) : 1;
  const consolePulse = lerp(0.5 + 0.5 * Math.sin(t * 2.6), 1, glow);
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, perspective: 1100, perspectiveOrigin: "540px 960px", overflow: "hidden", background: C.bg }}>
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: 1080,
          height: 1920,
          transformStyle: "preserve-3d",
          transformOrigin: "540px 960px",
          transform: `translate3d(0px, ${cam.camY}px, ${cam.camZ}px) rotateX(${cam.rx}deg) rotateY(${cam.ry}deg)`,
        }}
      >
        {/* back wall with vault emblem */}
        <div
          style={{
            position: "absolute",
            left: 540 - 4000,
            top: 960 - 3000,
            width: 8000,
            height: 6000,
            transform: `translateZ(${BACK_Z}px)`,
            background: `radial-gradient(circle at 50% 50%, rgba(212,175,55,${0.22 + 0.25 * glow}) 0 260px, transparent 262px 330px, rgba(212,175,55,${0.3 + 0.4 * glow}) 332px 346px, transparent 348px 560px, rgba(212,175,55,0.18) 562px 572px, #0B0C0F 574px)`,
          }}
        />
        {/* side walls */}
        <div style={{ position: "absolute", left: LEFT_X - 40, top: CEIL_Y, width: 3400, height: FLOOR_Y - CEIL_Y, transformOrigin: "0 50%", transform: `translateZ(600px) rotateY(90deg)`, background: "repeating-linear-gradient(90deg, #0E1013 0 368px, #08090B 368px 370px)" }} />
        <div style={{ position: "absolute", left: RIGHT_X + 40, top: CEIL_Y, width: 3400, height: FLOOR_Y - CEIL_Y, transformOrigin: "0 50%", transform: `translateZ(${BACK_Z}px) rotateY(-90deg)`, background: "repeating-linear-gradient(90deg, #08090B 0 2px, #0E1013 2px 370px)" }} />
        {/* floor */}
        <div
          style={{
            position: "absolute",
            left: -700,
            top: FLOOR_Y,
            width: 2480,
            height: 3500,
            transformOrigin: "50% 0",
            transform: `translateZ(${BACK_Z}px) rotateX(90deg)`,
            background: `linear-gradient(90deg, transparent 0 800px, rgba(212,175,55,${0.1 + 0.18 * glow}) 810px 830px, transparent 840px 1640px, rgba(212,175,55,${0.1 + 0.18 * glow}) 1650px 1670px, transparent 1680px), repeating-linear-gradient(0deg, rgba(212,175,55,0.13) 0 2px, transparent 2px 140px), repeating-linear-gradient(90deg, rgba(229,231,235,0.05) 0 2px, transparent 2px 140px), linear-gradient(0deg, #15171C, #0A0B0D)`,
          }}
        />
        {/* ceiling */}
        <div
          style={{
            position: "absolute",
            left: -700,
            top: CEIL_Y,
            width: 2480,
            height: 3500,
            transformOrigin: "50% 0",
            transform: `translateZ(600px) rotateX(-90deg)`,
            background: `linear-gradient(90deg, transparent 0 1000px, rgba(212,175,55,${0.55 + 0.4 * glow}) 1010px 1040px, transparent 1050px 1430px, rgba(212,175,55,${0.55 + 0.4 * glow}) 1440px 1470px, transparent 1480px), repeating-linear-gradient(0deg, #0B0C0F 0 180px, #16181D 180px 186px)`,
          }}
        />
        {/* racks */}
        {Array.from({ length: RACK_COUNT }).map((_, i) => (
          <React.Fragment key={i}>
            <RackFace i={i} side={-1} t={t} glow={glow} camZ={cam.camZ} />
            <RackFace i={i} side={1} t={t} glow={glow} camZ={cam.camZ} />
          </React.Fragment>
        ))}
        {/* master console rack (z = 0 plane) */}
        <div style={{ position: "absolute", left: 290, top: 330, width: 500, height: FLOOR_Y - 330, background: "linear-gradient(180deg, #181B21, #0C0D10)", border: `3px solid ${C.gold}`, boxSizing: "border-box", boxShadow: `0 0 ${40 + 60 * consolePulse}px rgba(212,175,55,${0.25 + 0.25 * consolePulse})` }}>
          <div style={{ position: "absolute", left: 24, right: 24, top: 26, height: 70, background: C.slate, border: `2px solid ${C.goldDim}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontFamily: MONO, fontSize: 15, color: C.platDim, letterSpacing: 3 }}>MASTER RACK · 00</span>
            <span style={{ fontFamily: SANS, fontWeight: 900, fontSize: 24, color: C.gold, letterSpacing: 4 }}>VAULT CORE</span>
          </div>
          {Array.from({ length: 12 }).map((_, k) => (
            <div key={k} style={{ position: "absolute", left: 30 + k * 37, top: 130, width: 22, height: 120, background: C.gold, opacity: lerp(0.2 + 0.8 * (0.5 + 0.5 * Math.sin(t * 5 - k * 0.6)), 1, glow), boxShadow: `0 0 14px ${C.gold}` }} />
          ))}
          {Array.from({ length: 3 }).map((_, k) => (
            <div key={k} style={{ position: "absolute", left: 24, right: 24, top: 990 + k * 62, height: 50, background: "linear-gradient(180deg, #1F242D, #111318)", borderTop: "1px solid rgba(229,231,235,0.1)" }}>
              <div style={{ position: "absolute", right: 18, top: 20, width: 10, height: 10, borderRadius: 5, background: C.gold, opacity: lerp(mod(Math.floor(t * 4 + k * 3), 4) === 0 ? 0.2 : 1, 1, glow) }} />
            </div>
          ))}
        </div>
        <ConsoleScreen t={t} mode={mode} f={f} />
        {/* desk ledge (top face + front face) */}
        <div style={{ position: "absolute", left: 300, top: 1300, width: 480, height: 150, transformOrigin: "50% 0", transform: "rotateX(90deg)", background: `linear-gradient(0deg, #1F242D, #13161B), repeating-linear-gradient(90deg, rgba(212,175,55,0.2) 0 2px, transparent 2px 40px)` }} />
        <div style={{ position: "absolute", left: 300, top: 1300, width: 480, height: 56, transform: "translateZ(150px)", background: "#15181D", borderTop: `3px solid ${C.gold}` }} />
        {/* vault wall with circular opening */}
        <div
          style={{
            position: "absolute",
            left: 540 - 3000,
            top: 960 - 3000,
            width: 6000,
            height: 6000,
            transform: `translateZ(${DOOR_Z}px)`,
            background: `radial-gradient(circle at 50% 50%, transparent 0 ${DOOR_R}px, ${C.gold} ${DOOR_R}px ${DOOR_R + 14}px, #2A2F38 ${DOOR_R + 14}px ${DOOR_R + 60}px, ${C.gold} ${DOOR_R + 60}px ${DOOR_R + 66}px, #14161A ${DOOR_R + 66}px), repeating-linear-gradient(0deg, transparent 0 238px, #050607 238px 242px)`,
          }}
        />
        {open < 1 && (
          <>
            <VaultDoorHalf side={-1} t={t} open={open} unlock={unlock} wheel={wheel} />
            <VaultDoorHalf side={1} t={t} open={open} unlock={unlock} wheel={-wheel} />
          </>
        )}
      </div>
      {/* gold haze */}
      <div style={{ position: "absolute", inset: 0, background: `radial-gradient(50% 35% at 50% 50%, rgba(212,175,55,${0.07 + 0.1 * glow}), transparent 70%)`, pointerEvents: "none" }} />
    </div>
  );
};

// Bokeh / dust in the foreground (DOF)
const Bokeh: React.FC<{ t: number; amount: number }> = ({ t, amount }) => (
  <>
    {Array.from({ length: 16 }).map((_, i) => {
      const r = rand(i + 7);
      const size = 24 + r * 90;
      const x = mod(rand(i * 3 + 1) * 1180 + t * (8 + r * 18), 1180) - 50;
      const y = mod(rand(i * 5 + 2) * 2020 - t * (14 + r * 22), 2020) - 50;
      return (
        <div
          key={i}
          style={{
            position: "absolute",
            left: x,
            top: y,
            width: size,
            height: size,
            borderRadius: size,
            background: `radial-gradient(circle, rgba(212,175,55,0.5), rgba(212,175,55,0) 70%)`,
            filter: `blur(${4 + r * 10}px)`,
            opacity: amount * (0.25 + 0.35 * rand(i + 40)),
          }}
        />
      );
    })}
  </>
);

// -------------------------------------------------------------------------
// MIDDLE (inside the console)
// -------------------------------------------------------------------------
const Tag: React.FC<{ children: React.ReactNode; color?: string; style?: React.CSSProperties }> = ({ children, color = C.gold, style }) => (
  <div style={{ display: "inline-flex", alignItems: "center", gap: 12, fontFamily: MONO, fontSize: 24, letterSpacing: 3, color, ...style }}>
    <span style={{ width: 14, height: 14, background: color }} />
    {children}
  </div>
);

const Panel: React.FC<{ style?: React.CSSProperties; children?: React.ReactNode; border?: string }> = ({ style, children, border = C.gold }) => (
  <div
    style={{
      position: "absolute",
      background: "linear-gradient(180deg, #1F242D 0%, #14171D 100%)",
      border: `3px solid ${border}`,
      boxShadow: `0 40px 80px rgba(0,0,0,0.65), 0 0 40px ${border === C.gold ? "rgba(212,175,55,0.18)" : "rgba(220,38,38,0.15)"}`,
      boxSizing: "border-box",
      ...style,
    }}
  >
    {children}
  </div>
);

const MiddleFrame: React.FC<{ t: number; label: string }> = ({ t, label }) => (
  <>
    <div style={{ position: "absolute", inset: 0, background: "radial-gradient(120% 70% at 50% 40%, #15181E 0%, #090A0C 70%)" }} />
    <div style={{ position: "absolute", inset: 0, backgroundImage: `linear-gradient(${C.line} 1px, transparent 1px), linear-gradient(90deg, ${C.line} 1px, transparent 1px)`, backgroundSize: "90px 90px", backgroundPosition: `0 ${mod(t * 20, 90)}px` }} />
    {/* console bezel corners */}
    {[
      { left: 36, top: 36, bl: true, bt: true },
      { right: 36, top: 36, br: true, bt: true },
      { left: 36, bottom: 36, bl: true, bb: true },
      { right: 36, bottom: 36, br: true, bb: true },
    ].map((c, k) => (
      <div
        key={k}
        style={{
          position: "absolute",
          left: c.left,
          right: c.right,
          top: c.top,
          bottom: c.bottom,
          width: 70,
          height: 70,
          borderLeft: c.bl ? `4px solid ${C.gold}` : undefined,
          borderRight: c.br ? `4px solid ${C.gold}` : undefined,
          borderTop: c.bt ? `4px solid ${C.gold}` : undefined,
          borderBottom: c.bb ? `4px solid ${C.gold}` : undefined,
        }}
      />
    ))}
    <div style={{ position: "absolute", left: 80, right: 80, top: 92, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <span style={{ fontFamily: MONO, fontSize: 22, color: C.gold, letterSpacing: 3 }}>{label}</span>
      <span style={{ fontFamily: MONO, fontSize: 22, color: C.platMute }}>{`T+${pad2(t)}.${pad2(mod(t * 100, 100))}`}</span>
    </div>
  </>
);

const InternBadge: React.FC<{ x: number; n: number; cross: number; t: number }> = ({ x, n, cross, t }) => {
  const dim = 1 - 0.55 * cross;
  return (
    <div style={{ position: "absolute", left: x, top: 0, width: 290, height: 430 }}>
      <div style={{ position: "absolute", left: 125, top: -40, width: 40, height: 56, background: C.slate, border: `2px solid ${C.platMute}`, borderRadius: 6 }} />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, #E5E7EB, #BFC3CA)", borderRadius: 18, opacity: dim, boxShadow: "0 30px 50px rgba(0,0,0,0.6)", overflow: "hidden" }}>
        <div style={{ height: 64, background: C.slate, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: MONO, fontSize: 22, color: C.plat, letterSpacing: 3 }}>{`СТАЖЁР ${pad2(n)}`}</div>
        {/* flat 2D silhouette */}
        <div style={{ position: "absolute", left: 95, top: 100, width: 100, height: 100, borderRadius: 50, background: "#8A9099" }} />
        <div style={{ position: "absolute", left: 55, top: 210, width: 180, height: 110, borderRadius: "90px 90px 12px 12px", background: "#8A9099" }} />
        <div style={{ position: "absolute", left: 30, right: 30, bottom: 30, height: 14, background: "#9CA1A9", borderRadius: 7 }} />
      </div>
      {/* crimson cross */}
      {[45, -45].map((d, k) => (
        <div
          key={d}
          style={{
            position: "absolute",
            left: -20,
            top: 205,
            width: 330,
            height: 18,
            background: C.red,
            borderRadius: 9,
            transform: `rotate(${d}deg) scaleX(${clamp01(cross * 2 - k)})`,
            boxShadow: "0 0 24px rgba(220,38,38,0.6)",
          }}
        />
      ))}
      <div
        style={{
          position: "absolute",
          left: 20,
          right: 20,
          top: 360,
          textAlign: "center",
          fontFamily: SANS,
          fontWeight: 900,
          fontSize: 34,
          color: C.red,
          border: `4px solid ${C.red}`,
          padding: "4px 0",
          background: "rgba(9,10,12,0.85)",
          transform: `rotate(-6deg) scale(${lerp(1.6, 1, clamp01((cross - 0.6) / 0.4))})`,
          opacity: clamp01((cross - 0.6) / 0.4),
        }}
      >
        ЗАМЕНЁН
      </div>
      <div style={{ display: "none" }}>{t}</div>
    </div>
  );
};

const Scene2: React.FC<{ t: number; f: number }> = ({ t, f }) => {
  const card = sp(f, 7.75, { damping: 15, stiffness: 140, mass: 0.7 });
  const price = Math.round(20 * ease01(7.9, 8.5, t, EXPO_OUT));
  const vs = sp(f, 8.56);
  return (
    <>
      <MiddleFrame t={t} label="VAULT://02 · ШТАТ 2026" />
      <div style={{ position: "absolute", left: 0, right: 0, top: 190, perspective: 1400 }}>
        <Panel style={{ left: 110, top: 0, width: 860, height: 560, transform: `rotateX(${(1 - card) * 25 + Math.sin(t * 1.3) * 2}deg) rotateY(${Math.sin(t * 0.9) * 3}deg) scale(${0.8 + 0.2 * card})`, opacity: clamp01(card * 1.4) }}>
          {/* flat 2D digital employee with gold rim */}
          <div style={{ position: "absolute", left: 50, top: 70, width: 220, height: 300 }}>
            <div style={{ position: "absolute", left: 50, top: 0, width: 120, height: 130, borderRadius: 34, background: C.plat, boxShadow: `0 0 0 5px ${C.gold}, 0 0 34px rgba(212,175,55,0.6)` }}>
              <div style={{ position: "absolute", left: 16, right: 16, top: 42, height: 34, borderRadius: 17, background: C.bg }}>
                <div style={{ position: "absolute", left: 14 + 50 * (0.5 + 0.5 * Math.sin(t * 3)), top: 10, width: 28, height: 14, borderRadius: 7, background: C.gold, boxShadow: `0 0 14px ${C.gold}` }} />
              </div>
            </div>
            <div style={{ position: "absolute", left: 10, top: 150, width: 200, height: 140, borderRadius: "100px 100px 16px 16px", background: C.plat, boxShadow: `0 0 0 5px ${C.gold}, 0 0 34px rgba(212,175,55,0.5)` }} />
            <div style={{ position: "absolute", left: 20, top: 316, width: 180, height: 18, borderRadius: 9, background: "rgba(0,0,0,0.55)", filter: "blur(8px)" }} />
          </div>
          <div style={{ position: "absolute", left: 310, top: 70, right: 40 }}>
            <div style={{ fontFamily: SANS, fontWeight: 900, fontSize: 150, lineHeight: 0.9, color: C.gold, letterSpacing: -6, textShadow: "0 0 40px rgba(212,175,55,0.4)" }}>1</div>
            <div style={{ fontFamily: SANS, fontWeight: 900, fontSize: 56, lineHeight: 1.0, color: C.plat, letterSpacing: -1.5, marginTop: 10 }}>ЦИФРОВОЙ<br />СОТРУДНИК</div>
          </div>
          <div style={{ position: "absolute", left: 40, right: 40, bottom: 34, height: 110, background: C.bg, border: `2px solid ${C.goldDim}`, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 30px" }}>
            <span style={{ fontFamily: MONO, fontSize: 26, color: C.platDim, letterSpacing: 2 }}>ЦЕНА</span>
            <span style={{ fontFamily: SANS, fontWeight: 900, fontSize: 76, color: C.gold, letterSpacing: -2 }}>{`$${price}/МЕС`}</span>
          </div>
        </Panel>
      </div>
      <div style={{ position: "absolute", left: 540 - 70, top: 800, width: 140, height: 140, borderRadius: 70, background: C.red, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: SANS, fontWeight: 900, fontSize: 60, color: C.plat, transform: `scale(${vs})`, boxShadow: "0 0 50px rgba(220,38,38,0.55)" }}>VS</div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 1030 }}>
        {[0, 1, 2].map((k) => {
          const a = sp(f, 8.56 + k * 0.12);
          const cross = ease01(9.42 + k * 0.14, 9.82 + k * 0.14, t, EXPO_OUT);
          return (
            <div key={k} style={{ position: "absolute", left: 0, top: 0, opacity: clamp01(a * 1.5), transform: `translateY(${(1 - a) * 120}px)` }}>
              <InternBadge x={45 + k * 340} n={k + 1} cross={cross} t={t} />
            </div>
          );
        })}
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 1560, textAlign: "center", opacity: smooth(9.9, 10.2, t) }}>
        <Tag>3 СТАЖЁРА → $20 В МЕСЯЦ</Tag>
      </div>
    </>
  );
};

const ZERO_COUNTERS = [
  { label: "ОПОЗДАНИЙ", from: 14, at: 11.16 },
  { label: "ВЫГОРАНИЯ", from: 9, at: 11.96 },
  { label: "ОТПУСКОВ", from: 28, at: 12.96 },
  { label: "БОЛЬНИЧНЫХ", from: 12, at: 13.38 },
];

const Scene3: React.FC<{ t: number; f: number }> = ({ t, f }) => {
  const docs = Math.round(1000 * ease01(14.0, 15.6, t, Easing.bezier(0.3, 0, 0.2, 1)));
  const beltOn = smooth(13.5, 13.9, t);
  const SPAN = 1500;
  const N = 12;
  return (
    <>
      <MiddleFrame t={t} label="VAULT://03 · ЛИЧНОЕ ДЕЛО: AI" />
      {ZERO_COUNTERS.map((c, k) => {
        const a = sp(f, c.at);
        const roll = ease01(c.at, c.at + 0.55, t, EXPO_OUT);
        const n = Math.round(c.from * (1 - roll));
        const done = n === 0;
        const col = mod(k, 2);
        const row = Math.floor(k / 2);
        return (
          <Panel
            key={k}
            border={done ? C.gold : C.red}
            style={{ left: 60 + col * 490, top: 180 + row * 330, width: 470, height: 300, opacity: clamp01(a * 1.4), transform: `translateY(${(1 - a) * 80}px) scale(${0.9 + 0.1 * a})` }}
          >
            <div style={{ position: "absolute", left: 34, top: 18, fontFamily: SANS, fontWeight: 900, fontSize: 170, lineHeight: 1, color: done ? C.gold : C.red, letterSpacing: -6, textShadow: done ? "0 0 40px rgba(212,175,55,0.5)" : undefined }}>{n}</div>
            <div style={{ position: "absolute", left: 38, bottom: 30, fontFamily: SANS, fontWeight: 900, fontSize: 40, color: C.plat, letterSpacing: -0.5 }}>{c.label}</div>
            <div style={{ position: "absolute", right: 30, top: 34, width: 56, height: 56, borderRadius: 28, border: `4px solid ${C.gold}`, opacity: done ? 1 : 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ width: 22, height: 11, borderLeft: `5px solid ${C.gold}`, borderBottom: `5px solid ${C.gold}`, transform: "translateY(-3px) rotate(-45deg)" }} />
            </div>
          </Panel>
        );
      })}
      {/* documents */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 880, textAlign: "center", opacity: smooth(13.5, 13.9, t) }}>
        <div style={{ fontFamily: SANS, fontWeight: 900, fontSize: 190, lineHeight: 1, color: C.gold, letterSpacing: -8, textShadow: "0 0 50px rgba(212,175,55,0.45)" }}>{fmt(docs)}</div>
        <div style={{ fontFamily: SANS, fontWeight: 900, fontSize: 52, color: C.plat, letterSpacing: -1 }}>ДОКУМЕНТОВ ЗА СЕКУНДЫ</div>
      </div>
      <div style={{ position: "absolute", left: 0, top: 1190, width: 1080, height: 460, perspective: 1000, perspectiveOrigin: "50% 0%", opacity: beltOn, overflow: "hidden" }}>
        <div style={{ position: "absolute", left: -200, top: 40, width: 1480, height: 380, transformStyle: "preserve-3d", transform: "rotateX(42deg)", transformOrigin: "50% 50%" }}>
          <div style={{ position: "absolute", inset: 0, background: `repeating-linear-gradient(90deg, #1F242D 0 58px, #14171D 58px 60px)`, backgroundPosition: `${mod(t * 900, 60)}px 0`, borderTop: `4px solid ${C.gold}`, borderBottom: `4px solid ${C.gold}` }} />
          {Array.from({ length: N }).map((_, i) => {
            const x = mod(t * 900 + i * (SPAN / N), SPAN) - 150;
            const scanned = x - 200 + 75 > 540; // belt is offset -200px; beam at x=540
            return (
              <div key={i} style={{ position: "absolute", left: x, top: 70, width: 150, height: 210, background: scanned ? "#F4E7B5" : C.plat, transform: `translateZ(${10 + mod(i, 3) * 4}px)`, boxShadow: "0 18px 22px rgba(0,0,0,0.55)", border: scanned ? `3px solid ${C.gold}` : "3px solid transparent", boxSizing: "border-box" }}>
                {Array.from({ length: 6 }).map((__, l) => (
                  <div key={l} style={{ margin: "16px 16px 0", height: 8, width: `${60 + rand(i * 9 + l) * 35}%`, background: "rgba(31,36,45,0.35)" }} />
                ))}
                {scanned && <div style={{ position: "absolute", right: 10, bottom: 10, width: 24, height: 12, borderLeft: `5px solid ${C.gold}`, borderBottom: `5px solid ${C.gold}`, transform: "rotate(-45deg)" }} />}
              </div>
            );
          })}
        </div>
        {/* scanner beam */}
        <div style={{ position: "absolute", left: 534, top: 0, width: 12, height: 460, background: C.gold, boxShadow: `0 0 50px 16px rgba(212,175,55,0.45)` }} />
        <div style={{ position: "absolute", left: 470, top: 0, width: 140, height: 30, background: C.slate, border: `2px solid ${C.gold}`, fontFamily: MONO, fontSize: 16, color: C.gold, display: "flex", alignItems: "center", justifyContent: "center" }}>SCAN</div>
      </div>
    </>
  );
};

const MiniTable: React.FC<{ filled: number; error?: number; gold: boolean }> = ({ filled, error = -1, gold }) => (
  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
    {Array.from({ length: 24 }).map((_, k) => {
      const on = k < filled;
      const err = k === error && on;
      return <div key={k} style={{ height: 30, background: err ? C.red : on ? (gold ? C.gold : C.platDim) : "rgba(229,231,235,0.07)", boxShadow: on && gold ? "0 0 12px rgba(212,175,55,0.45)" : undefined }} />;
    })}
  </div>
);

const Scene4: React.FC<{ t: number; f: number }> = ({ t, f }) => {
  const top = sp(f, 16.15);
  const hk = ease01(16.5, 20.9, t, Easing.linear);
  const mins = 9 * 60 + 240 * hk;
  const humanFill = Math.floor(5 * hk);
  const bot = sp(f, 20.96);
  const ak = ease01(21.84, 24.1, t, Easing.bezier(0.4, 0, 0.6, 1));
  const aSec = 120 * ak;
  const zeroErr = sp(f, 25.24, { damping: 11, stiffness: 220, mass: 0.6 });
  const topDim = 1 - 0.45 * smooth(21.0, 21.6, t);
  return (
    <>
      <MiddleFrame t={t} label="VAULT://04 · ТЕСТ НА СКОРОСТЬ" />
      {/* human */}
      <Panel border={C.red} style={{ left: 60, top: 170, width: 960, height: 660, opacity: clamp01(top * 1.4) * topDim, transform: `translateX(${(1 - top) * -200}px)` }}>
        <div style={{ position: "absolute", left: 40, top: 32 }}>
          <Tag color={C.red}>ОБЫЧНЫЙ РАБОТНИК</Tag>
        </div>
        <div style={{ position: "absolute", left: 40, top: 100, fontFamily: SANS, fontWeight: 900, fontSize: 84, lineHeight: 0.98, color: C.plat, letterSpacing: -3 }}>
          ПОЛДНЯ<br />
          <span style={{ color: C.red }}>НА 1 ТАБЛИЦУ</span>
        </div>
        {/* clock */}
        <div style={{ position: "absolute", right: 50, top: 80, width: 200, height: 200, borderRadius: 100, border: `6px solid ${C.plat}`, boxSizing: "border-box" }}>
          <div style={{ position: "absolute", left: 91, top: 40, width: 6, height: 56, background: C.plat, transformOrigin: "50% 100%", transform: `rotate(${(mins / 720) * 360}deg)` }} />
          <div style={{ position: "absolute", left: 92, top: 18, width: 4, height: 78, background: C.red, transformOrigin: "50% 100%", transform: `rotate(${mod(mins, 60) * 6}deg)` }} />
          <div style={{ position: "absolute", left: 84, top: 84, width: 20, height: 20, borderRadius: 10, background: C.red }} />
        </div>
        <div style={{ position: "absolute", right: 50, top: 300, width: 200, textAlign: "center", fontFamily: MONO, fontSize: 36, color: C.red }}>{`${pad2(mins / 60)}:${pad2(mod(mins, 60))}`}</div>
        <div style={{ position: "absolute", left: 40, right: 340, top: 330 }}>
          <MiniTable filled={humanFill} error={3} gold={false} />
        </div>
        <div style={{ position: "absolute", left: 40, right: 40, bottom: 110, height: 26, background: "rgba(229,231,235,0.08)" }}>
          <div style={{ width: `${3 + 15 * hk}%`, height: "100%", background: C.red }} />
        </div>
        <div style={{ position: "absolute", left: 40, right: 40, bottom: 44, display: "flex", justifyContent: "space-between", fontFamily: MONO, fontSize: 26, color: C.platDim }}>
          <span>{`ГОТОВО: ${Math.round(3 + 15 * hk)}%`}</span>
          <span>{`ПОЧТА: ${47 - Math.floor(6 * hk)} НЕПРОЧИТАННЫХ`}</span>
        </div>
      </Panel>
      {/* agent */}
      <Panel style={{ left: 60, top: 880, width: 960, height: 720, opacity: clamp01(bot * 1.4), transform: `translateX(${(1 - bot) * 200}px) scale(${1 + 0.02 * zeroErr * Math.exp(-(t - 25.24) * 3) * (t > 25.24 ? 1 : 0)})` }}>
        <div style={{ position: "absolute", left: 40, top: 32 }}>
          <Tag>AI-АГЕНТ</Tag>
        </div>
        <div style={{ position: "absolute", right: 40, top: 22, fontFamily: MONO, fontSize: 48, color: C.gold, textShadow: "0 0 20px rgba(212,175,55,0.5)" }}>{`${pad2(aSec / 60)}:${pad2(mod(aSec, 60))}`}</div>
        <div style={{ position: "absolute", left: 40, top: 100, fontFamily: SANS, fontWeight: 900, fontSize: 96, lineHeight: 0.98, color: C.gold, letterSpacing: -3, textShadow: "0 0 40px rgba(212,175,55,0.35)" }}>
          2 МИНУТЫ
        </div>
        <div style={{ position: "absolute", left: 40, right: 40, top: 230 }}>
          <MiniTable filled={Math.floor(24 * ak)} gold />
        </div>
        <div style={{ position: "absolute", left: 40, right: 40, top: 470, height: 26, background: "rgba(229,231,235,0.08)" }}>
          <div style={{ width: `${100 * ak}%`, height: "100%", background: C.gold, boxShadow: "0 0 20px rgba(212,175,55,0.6)" }} />
        </div>
        <div style={{ position: "absolute", left: 40, right: 40, top: 530, height: 140, display: "flex", alignItems: "center", gap: 30, opacity: clamp01(zeroErr * 1.5), transform: `scale(${0.6 + 0.4 * zeroErr})`, transformOrigin: "0 50%" }}>
          <div style={{ fontFamily: SANS, fontWeight: 900, fontSize: 130, color: C.plat, letterSpacing: -5, lineHeight: 1 }}>0</div>
          <div style={{ fontFamily: SANS, fontWeight: 900, fontSize: 70, color: C.plat, letterSpacing: -2 }}>ОШИБОК</div>
          <div style={{ marginLeft: "auto", width: 100, height: 100, borderRadius: 50, background: C.gold, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 40px rgba(212,175,55,0.6)" }}>
            <div style={{ width: 42, height: 20, borderLeft: `9px solid ${C.bg}`, borderBottom: `9px solid ${C.bg}`, transform: "translateY(-6px) rotate(-45deg)" }} />
          </div>
        </div>
      </Panel>
    </>
  );
};

const SAT_LABELS = ["ПРОДАЖИ", "ПОЧТА", "ТАБЛИЦЫ", "ПОДДЕРЖКА", "ОТЧЁТЫ", "ДОКУМЕНТЫ"];

const GoldCube: React.FC<{ size: number; rx: number; ry: number; glow: number }> = ({ size, rx, ry, glow }) => {
  const h = size / 2;
  const faces = [
    `translateZ(${h}px)`,
    `rotateY(180deg) translateZ(${h}px)`,
    `rotateY(90deg) translateZ(${h}px)`,
    `rotateY(-90deg) translateZ(${h}px)`,
    `rotateX(90deg) translateZ(${h}px)`,
    `rotateX(-90deg) translateZ(${h}px)`,
  ];
  return (
    <div style={{ width: size, height: size, perspective: 1200 }}>
      <div style={{ position: "relative", width: size, height: size, transformStyle: "preserve-3d", transform: `rotateX(${rx}deg) rotateY(${ry}deg)` }}>
        {faces.map((tr, k) => (
          <div
            key={k}
            style={{
              position: "absolute",
              inset: 0,
              transform: tr,
              background: k < 4 ? "linear-gradient(135deg, #2A2F38 0%, #14171D 100%)" : "linear-gradient(135deg, #3A3220, #1F242D)",
              border: `5px solid ${C.gold}`,
              boxSizing: "border-box",
              boxShadow: `inset 0 0 ${30 + 30 * glow}px rgba(212,175,55,0.45)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: SANS,
              fontWeight: 900,
              fontSize: size * 0.36,
              color: C.gold,
            }}
          >
            AI
          </div>
        ))}
      </div>
    </div>
  );
};

const Scene5: React.FC<{ t: number; f: number }> = ({ t, f }) => {
  const stmt = win(t, 26.4, 28.55, 0.3, 0.35);
  const node = smooth(28.4, 28.9, t);
  const cx = 540;
  const cy = 1050;
  const head = [
    { s: "ПЛАТЯТ ТЕМ,", at: 29.18, c: C.plat, fs: 96 },
    { s: "КТО СОЗДАЁТ", at: 30.12, c: C.plat, fs: 96 },
    { s: "ЦИФРОВЫХ СОТРУДНИКОВ", at: 32.6, c: C.gold, fs: 70 },
  ];
  const sats = SAT_LABELS.map((label, i) => {
    const a = (i / SAT_LABELS.length) * Math.PI * 2 + t * 0.45;
    const depth = Math.sin(a);
    return { label, i, x: cx + Math.cos(a) * 390, y: cy + depth * 150, depth, appear: sp(f, 30.72 + i * 0.28) };
  });
  const biz = sp(f, 33.76);
  return (
    <>
      <MiddleFrame t={t} label="VAULT://05 · НОВАЯ ПРОФЕССИЯ" />
      {/* statement */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 700, textAlign: "center", opacity: stmt, transform: `scale(${0.94 + 0.06 * stmt})` }}>
        <div style={{ fontFamily: MONO, fontSize: 30, color: C.platMute, letterSpacing: 4, marginBottom: 20 }}>НО ЭТО НЕ ЗНАЧИТ, ЧТО…</div>
        <div style={{ fontFamily: SANS, fontWeight: 900, fontSize: 130, lineHeight: 0.95, color: C.plat, letterSpacing: -5 }}>РАБОТЫ</div>
        <div style={{ position: "relative", display: "inline-block", fontFamily: SANS, fontWeight: 900, fontSize: 130, lineHeight: 0.95, color: C.platMute, letterSpacing: -5 }}>
          БОЛЬШЕ НЕТ
          <div style={{ position: "absolute", left: -10, right: -10, top: "48%", height: 16, background: C.gold, transformOrigin: "0 50%", transform: `scaleX(${ease01(27.4, 27.9, t, EXPO_OUT)})`, boxShadow: "0 0 24px rgba(212,175,55,0.6)" }} />
        </div>
      </div>
      {/* headline */}
      <div style={{ position: "absolute", left: 70, right: 70, top: 170, opacity: node }}>
        {head.map((h, k) => {
          const a = sp(f, h.at, { damping: 15, stiffness: 200, mass: 0.6 });
          return (
            <div key={k} style={{ fontFamily: SANS, fontWeight: 900, fontSize: h.fs, lineHeight: 1.02, color: h.c, letterSpacing: -3, opacity: clamp01(a * 1.5), transform: `translateY(${(1 - a) * 40}px)`, textShadow: h.c === C.gold ? "0 0 30px rgba(212,175,55,0.45)" : undefined }}>
              {h.s}
            </div>
          );
        })}
      </div>
      {/* architect node */}
      <div style={{ position: "absolute", inset: 0, opacity: node }}>
        <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
          <ellipse cx={cx} cy={cy} rx={390} ry={150} fill="none" stroke="rgba(212,175,55,0.22)" strokeWidth={2} strokeDasharray="6 10" />
          {sats.map((s) => (
            <line key={s.i} x1={cx} y1={cy} x2={s.x} y2={s.y} stroke={C.gold} strokeWidth={3} strokeDasharray="14 10" strokeDashoffset={-mod(t * 120, 24)} opacity={clamp01(s.appear) * (0.45 + 0.4 * (s.depth + 1) / 2)} />
          ))}
        </svg>
        {/* floor shadow */}
        <div style={{ position: "absolute", left: cx - 200, top: cy + 190, width: 400, height: 60, borderRadius: "50%", background: "rgba(0,0,0,0.7)", filter: "blur(18px)" }} />
        {[...sats]
          .sort((a, b) => a.depth - b.depth)
          .map((s) => {
            const sc = (0.72 + 0.28 * (s.depth + 1) / 2) * clamp01(s.appear);
            const back = s.depth < 0;
            const el = (
              <div key={s.i} style={{ position: "absolute", left: s.x - 90, top: s.y - 50, width: 180, height: 100, transform: `scale(${sc})`, opacity: clamp01(s.appear * 1.4) * (back ? 0.7 : 1), filter: back ? `blur(${(-s.depth * 2.2).toFixed(2)}px)` : undefined, zIndex: Math.round((s.depth + 1) * 10) }}>
                <div style={{ position: "absolute", inset: 0, background: C.slate, border: `3px solid ${C.gold}`, boxShadow: "0 0 24px rgba(212,175,55,0.35)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontFamily: MONO, fontSize: 16, color: C.platMute, letterSpacing: 2 }}>{`AGENT ${pad2(s.i + 1)}`}</span>
                  <span style={{ fontFamily: SANS, fontWeight: 900, fontSize: 26, color: C.plat }}>{s.label}</span>
                </div>
              </div>
            );
            return el;
          })}
        <div style={{ position: "absolute", left: cx - 110, top: cy - 110, width: 220, height: 220, zIndex: 10 }}>
          <div style={{ position: "absolute", left: -60, top: -60, width: 340, height: 340, borderRadius: 170, background: "radial-gradient(circle, rgba(212,175,55,0.35), transparent 65%)" }} />
          <GoldCube size={220} rx={-22 + Math.sin(t * 0.8) * 6} ry={t * 50} glow={0.5 + 0.5 * Math.sin(t * 3)} />
        </div>
        <div style={{ position: "absolute", left: 0, right: 0, top: cy + 250, textAlign: "center", zIndex: 30 }}>
          <div style={{ display: "inline-block", padding: "14px 34px", background: C.gold, fontFamily: SANS, fontWeight: 900, fontSize: 44, color: C.bg, letterSpacing: 1 }}>АРХИТЕКТОР</div>
        </div>
        <div style={{ position: "absolute", right: 90, top: cy - 300, zIndex: 30, opacity: clamp01(sp(f, 29.3) * 1.4), transform: `translateY(${-30 * smooth(29.3, 31, t)}px)` }}>
          <div style={{ padding: "10px 22px", border: `3px solid ${C.gold}`, background: C.bg, fontFamily: MONO, fontSize: 28, color: C.gold }}>{"ЗАРПЛАТА ↑"}</div>
        </div>
        <div style={{ position: "absolute", left: 0, right: 0, top: 1490, textAlign: "center", zIndex: 30, opacity: clamp01(biz * 1.4), transform: `scale(${0.7 + 0.3 * biz})` }}>
          <div style={{ display: "inline-block", padding: "14px 30px", border: `3px solid ${C.plat}`, fontFamily: SANS, fontWeight: 900, fontSize: 44, color: C.plat, letterSpacing: 2 }}>ДЛЯ БИЗНЕСА</div>
        </div>
      </div>
    </>
  );
};

const Middle: React.FC<{ t: number; f: number }> = ({ t, f }) => {
  const p = punch(t);
  const dx = Math.sin(t * 0.55) * 10;
  const dy = Math.cos(t * 0.43) * 8;
  const scenes: { a: number; b: number; el: React.ReactNode }[] = [
    { a: 7.6, b: 10.8, el: <Scene2 t={t} f={f} /> },
    { a: 10.8, b: 16.1, el: <Scene3 t={t} f={f} /> },
    { a: 16.1, b: 26.35, el: <Scene4 t={t} f={f} /> },
    { a: 26.35, b: 36.3, el: <Scene5 t={t} f={f} /> },
  ];
  return (
    <AbsoluteFill style={{ background: C.bg, transform: `translate(${dx}px, ${dy}px) scale(${1.02 + p})`, transformOrigin: "540px 900px" }}>
      {scenes.map((s, k) => {
        if (t < s.a - 0.3 || t > s.b + 0.3) return null;
        const o = win(t, s.a, s.b, k === 0 ? 0 : 0.3, k === scenes.length - 1 ? 0 : 0.3);
        const z = 1 + 0.05 * (1 - smooth(s.a - 0.15, s.a + 0.35, t));
        return (
          <AbsoluteFill key={k} style={{ opacity: o, transform: `scale(${z})` }}>
            {s.el}
          </AbsoluteFill>
        );
      })}
    </AbsoluteFill>
  );
};

// -------------------------------------------------------------------------
// Hook overlay + ending overlay (screen space)
// -------------------------------------------------------------------------
const HookOverlay: React.FC<{ t: number; f: number }> = ({ t, f }) => {
  const o = 1 - smooth(5.4, 6.0, t);
  const year = sp(f, 1.02, { damping: 12, stiffness: 200, mass: 0.6 });
  const freeze = sp(f, 3.34);
  const access = t < 0.6 ? "ДОСТУП: ЗАКРЫТ" : "ДОСТУП: РАЗРЕШЁН";
  return (
    <div style={{ position: "absolute", inset: 0, opacity: o }}>
      <div style={{ position: "absolute", left: 70, right: 70, top: 80, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontFamily: MONO, fontSize: 22, color: C.platDim, letterSpacing: 3 }}>VAULT · LEVEL -7</span>
        <span style={{ fontFamily: MONO, fontSize: 22, color: t < 0.6 ? C.red : C.gold, padding: "8px 16px", border: `2px solid ${t < 0.6 ? C.red : C.gold}`, background: "rgba(9,10,12,0.8)" }}>{access}</span>
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 150, textAlign: "center", opacity: clamp01(year * 1.5), transform: `scale(${0.6 + 0.4 * year})` }}>
        <div style={{ fontFamily: SANS, fontWeight: 900, fontSize: 200, lineHeight: 1, color: C.gold, letterSpacing: -8, textShadow: "0 0 60px rgba(212,175,55,0.45), 0 10px 30px rgba(0,0,0,0.8)" }}>2026</div>
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 1580, textAlign: "center", opacity: clamp01(freeze * 1.5), transform: `scale(${0.7 + 0.3 * freeze})` }}>
        <span style={{ display: "inline-block", padding: "14px 30px", background: C.red, fontFamily: SANS, fontWeight: 900, fontSize: 40, color: C.plat, letterSpacing: 1, boxShadow: "0 0 40px rgba(220,38,38,0.5)" }}>НАЙМ НОВИЧКОВ: ЗАМОРОЖЕН</span>
      </div>
    </div>
  );
};

const EndOverlay: React.FC<{ t: number; f: number }> = ({ t, f }) => {
  const badge = sp(f, 37.3);
  const cta = sp(f, 37.7, { damping: 13, stiffness: 150, mass: 0.7 });
  const word = sp(f, 38.0, { damping: 10, stiffness: 220, mass: 0.6 });
  const shimmer = mod(t * 0.7, 1.6) - 0.3;
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <div style={{ position: "absolute", left: 0, right: 0, top: 120, textAlign: "center", opacity: clamp01(badge * 1.5), transform: `translateY(${(1 - badge) * -60}px)` }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 18, padding: "18px 34px", background: "rgba(9,10,12,0.88)", border: `3px solid ${C.gold}`, boxShadow: "0 0 50px rgba(212,175,55,0.35)" }}>
          <span style={{ width: 20, height: 20, borderRadius: 10, background: C.gold, boxShadow: `0 0 20px ${C.gold}`, opacity: 0.6 + 0.4 * Math.sin(t * 6) }} />
          <span style={{ fontFamily: MONO, fontWeight: 700, fontSize: 40, color: C.gold, letterSpacing: 3 }}>VAULT CLUSTER: ONLINE</span>
        </div>
      </div>
      <div style={{ position: "absolute", left: 90, right: 90, top: 1290, opacity: clamp01(cta * 1.4), transform: `translateY(${(1 - cta) * 140}px)` }}>
        <div style={{ position: "relative", background: "rgba(18,20,25,0.95)", border: `4px solid ${C.gold}`, padding: "28px 30px 34px", textAlign: "center", boxShadow: "0 40px 90px rgba(0,0,0,0.75), 0 0 60px rgba(212,175,55,0.25)", overflow: "hidden" }}>
          <div style={{ fontFamily: SANS, fontWeight: 900, fontSize: 62, color: C.plat, letterSpacing: -1 }}>НАПИШИ</div>
          <div style={{ display: "inline-block", marginTop: 10, padding: "8px 34px", background: C.gold, transform: `scale(${0.6 + 0.4 * word})` }}>
            <span style={{ fontFamily: SANS, fontWeight: 900, fontSize: 92, color: C.bg, letterSpacing: -2 }}>СОТРУДНИК</span>
          </div>
          <div style={{ marginTop: 18, fontFamily: MONO, fontSize: 26, color: C.platDim, letterSpacing: 2 }}>В КОММЕНТАРИЯХ → ИНСТРУКЦИЯ ПО СБОРКЕ</div>
          <div style={{ position: "absolute", top: 0, bottom: 0, left: `${shimmer * 100}%`, width: 120, background: "linear-gradient(90deg, transparent, rgba(229,231,235,0.12), transparent)", transform: "skewX(-20deg)" }} />
        </div>
      </div>
    </div>
  );
};

// -------------------------------------------------------------------------
// Subtitles — pill with 24px gap between words
// -------------------------------------------------------------------------
const GROUPS: number[][] = (() => {
  const g: number[][] = [];
  let cur: number[] = [];
  WORDS.forEach((w, i) => {
    cur.push(i);
    const next = WORDS[i + 1];
    const chars = cur.reduce((n, k) => n + WORDS[k].word.length, 0) + (next ? next.word.length : 0);
    if (cur.length >= 3 || chars > 22 || /[.,?!—]$/.test(w.word) || !next || next.start - w.end > 0.3) {
      g.push(cur);
      cur = [];
    }
  });
  return g;
})();

const Subtitles: React.FC<{ f: number; t: number }> = ({ f, t }) => {
  let gi = -1;
  for (let i = 0; i < GROUPS.length; i++) if (WORDS[GROUPS[i][0]].start <= t + 0.04) gi = i;
  if (gi < 0) return null;
  const g = GROUPS[mod(gi, GROUPS.length)];
  const end = WORDS[g[g.length - 1]].end;
  const fadeOut = 1 - smooth(end + 0.35, end + 0.6, t);
  if (fadeOut <= 0) return null;
  const pop = sp(f, WORDS[g[0]].start, { damping: 13, stiffness: 260, mass: 0.5 });
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 1745, display: "flex", justifyContent: "center", opacity: fadeOut * clamp01(pop * 2) }}>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          columnGap: 24,
          rowGap: 8,
          maxWidth: 1000,
          padding: "20px 44px",
          borderRadius: 48,
          background: "rgba(9,10,12,0.88)",
          border: `2px solid ${C.goldDim}`,
          boxShadow: "0 20px 50px rgba(0,0,0,0.6), 0 0 30px rgba(212,175,55,0.12)",
          transform: `scale(${0.85 + 0.15 * pop})`,
        }}
      >
        {g.map((wi) => {
          const w = WORDS[wi];
          const active = t >= w.start && t < w.end + 0.06;
          const said = t >= w.start;
          return (
            <span
              key={wi}
              style={{
                display: "inline-block",
                fontFamily: SANS,
                fontWeight: 800,
                fontSize: 58,
                letterSpacing: -0.5,
                whiteSpace: "nowrap",
                color: active ? C.gold : said ? C.plat : "rgba(229,231,235,0.38)",
                transform: `translateY(${active ? -3 : 0}px)`,
              }}
            >
              {DISPLAY_FIX[w.word] ?? w.word}
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
export const ServerVaultReel: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = f / fps;
  const cam = getCamera(t);
  const showVault = t < 7.95 || t > 35.8;
  const ending = t > 30;
  const glow = ending ? smooth(36.4, 38.2, t) : 0;
  const middleO = win(t, 7.7, 36.05, 0.4, 0.45);
  return (
    <AbsoluteFill style={{ background: C.bg, overflow: "hidden" }}>
      <Audio src={staticFile("server_vault_reel/voice.mp3")} />
      {showVault && (
        <AbsoluteFill style={{ transform: `scale(${cam.zoom})`, transformOrigin: "540px 960px" }}>
          <VaultWorld t={t} f={f} cam={cam} glow={glow} mode={ending ? "online" : "hook"} />
        </AbsoluteFill>
      )}
      {showVault && <Bokeh t={t} amount={ending ? smooth(37.0, 38.0, t) : 1 - smooth(6.0, 7.0, t)} />}
      {t < 6.2 && <HookOverlay t={t} f={f} />}
      {middleO > 0 && (
        <AbsoluteFill style={{ opacity: middleO }}>
          <Middle t={t} f={f} />
        </AbsoluteFill>
      )}
      {t > 37 && <EndOverlay t={t} f={f} />}
      {/* vignette */}
      <AbsoluteFill style={{ background: "radial-gradient(120% 85% at 50% 50%, transparent 55%, rgba(0,0,0,0.6) 100%)", pointerEvents: "none" }} />
      <Subtitles f={f} t={t} />
    </AbsoluteFill>
  );
};
