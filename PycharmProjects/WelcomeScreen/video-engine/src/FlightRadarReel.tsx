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
 * FLIGHT RADAR REEL — 1080x1920 @ 60 FPS, 2460 FRAMES (41s)
 * Aviation radar HUD: night navy, cyan sweep, amber blips.
 *
 *   01  0.0 –  7.5s : 3D night control tower. Angled panoramic glass, runway
 *                     lights, a plane taking off, radar console showing
 *                     "ЛИЧНАЯ ДИСПЕТЧЕРСКАЯ ИИ". 6.0 → 7.5s fly INTO the screen.
 *   02  7.5 – 16.3s : "100 ЗАДАЧ В НЕБЕ · 0 ОШИБОК" — blips on radar rings
 *   03 16.3 – 23.0s : "ХАОС В ГОЛОВЕ" (crossed out) vs "ЕДИНЫЙ РАДАР"
 *   04 23.0 – 31.6s : 3 flight vectors ЗАЯВКИ / ДОКУМЕНТЫ / КОНТЕНТ + КОММЕНТЫ 15 МИН
 *   05 31.6 – 34.9s : "НЕ РАБОТАЕШЬ РУКАМИ — УПРАВЛЯЕШЬ КУРСОМ"
 *   06 34.5 – 41.0s : Pull back OUT into the tower, "ALL SYSTEMS ON COURSE",
 *                     CTA "НАПИШИ РАДАР"
 *
 * Pure CSS 3D + light SVG (no feTurbulence / no heavy filters).
 * All cyclic indices go through mod().
 * =========================================================================
 */

const FPS = 60;

const C = {
  bg: "#03090E",
  cyan: "#06B6D4",
  amber: "#F59E0B",
  white: "#F8FAFC",
  slate: "#0F172A",
  cyanDim: "rgba(6,182,212,0.45)",
  cyanFaint: "rgba(6,182,212,0.14)",
  amberDim: "rgba(245,158,11,0.45)",
  whiteDim: "rgba(248,250,252,0.62)",
  whiteMute: "rgba(248,250,252,0.32)",
  line: "rgba(6,182,212,0.08)",
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
  const k = clamp01((x - a) / (b - a));
  return k * k * (3 - 2 * k);
};

const ease01 = (a: number, b: number, t: number, e = EASE_IO) => interpolate(t, [a, b], [0, 1], { ...clamp, easing: e });

/** visibility window with fade in / fade out */
const win = (t: number, a: number, b: number, fi = 0.3, fo = 0.3) => smooth(a, a + fi, t) * (1 - smooth(b - fo, b, t));

const sp = (f: number, atSec: number, cfg = { damping: 14, stiffness: 170, mass: 0.6 }) =>
  spring({ frame: f - sec(atSec), fps: FPS, config: cfg });

const pad2 = (n: number) => String(Math.floor(n)).padStart(2, "0");

// -------------------------------------------------------------------------
// Words (inlined from public/flight_radar_reel/words.json, "и и агентов" merged)
// -------------------------------------------------------------------------
type Word = { word: string; start: number; end: number };

const WORDS: Word[] = [
  { word: "Представь", start: 0.0, end: 0.7 },
  { word: "ночную", start: 0.7, end: 1.02 },
  { word: "вышку", start: 1.02, end: 1.38 },
  { word: "аэропорта.", start: 1.38, end: 2.06 },
  { word: "За", start: 2.34, end: 2.44 },
  { word: "секунду", start: 2.44, end: 2.98 },
  { word: "диспетчер", start: 2.98, end: 3.64 },
  { word: "контролирует", start: 3.64, end: 4.38 },
  { word: "десятки", start: 4.38, end: 4.88 },
  { word: "самолетов", start: 4.88, end: 5.52 },
  { word: "в", start: 5.52, end: 5.68 },
  { word: "небе", start: 5.68, end: 6.14 },
  { word: "и", start: 6.14, end: 6.52 },
  { word: "не", start: 6.52, end: 6.62 },
  { word: "допускает", start: 6.62, end: 7.2 },
  { word: "не", start: 7.2, end: 7.4 },
  { word: "одной", start: 7.4, end: 7.66 },
  { word: "ошибки.", start: 7.66, end: 8.22 },
  { word: "В", start: 8.74, end: 8.9 },
  { word: "2026", start: 8.9, end: 10.32 },
  { word: "году", start: 10.32, end: 10.82 },
  { word: "точно", start: 10.82, end: 11.54 },
  { word: "также", start: 11.54, end: 12.0 },
  { word: "работает", start: 12.0, end: 12.54 },
  { word: "твоя", start: 12.54, end: 12.94 },
  { word: "личная", start: 12.94, end: 13.32 },
  { word: "система", start: 13.32, end: 13.8 },
  { word: "из", start: 13.8, end: 14.42 },
  { word: "ИИ-агентов.", start: 14.42, end: 15.72 },
  { word: "Пока", start: 16.36, end: 16.68 },
  { word: "другие", start: 16.68, end: 17.08 },
  { word: "держат", start: 17.08, end: 17.62 },
  { word: "все", start: 17.62, end: 17.84 },
  { word: "задачи", start: 17.84, end: 18.38 },
  { word: "в", start: 18.38, end: 18.46 },
  { word: "голове", start: 18.46, end: 18.86 },
  { word: "и", start: 18.86, end: 19.06 },
  { word: "тонут", start: 19.06, end: 19.44 },
  { word: "в", start: 19.44, end: 19.64 },
  { word: "хаосе,", start: 19.64, end: 20.14 },
  { word: "у", start: 20.46, end: 20.54 },
  { word: "тебя", start: 20.54, end: 20.8 },
  { word: "перед", start: 20.8, end: 21.12 },
  { word: "глазами", start: 21.12, end: 21.7 },
  { word: "единый", start: 21.7, end: 22.26 },
  { word: "радар.", start: 22.26, end: 22.64 },
  { word: "Один", start: 23.22, end: 23.54 },
  { word: "поток", start: 23.54, end: 23.92 },
  { word: "собирает", start: 23.92, end: 24.36 },
  { word: "заявки,", start: 24.36, end: 24.88 },
  { word: "второй", start: 24.98, end: 25.26 },
  { word: "проверяет", start: 25.26, end: 25.86 },
  { word: "документы,", start: 25.86, end: 26.48 },
  { word: "третий", start: 26.48, end: 26.9 },
  { word: "выпускает", start: 26.9, end: 27.5 },
  { word: "контент", start: 27.5, end: 28.04 },
  { word: "и", start: 28.04, end: 28.66 },
  { word: "отвечает", start: 28.66, end: 29.32 },
  { word: "людям", start: 29.32, end: 29.6 },
  { word: "каждые", start: 29.6, end: 30.22 },
  { word: "15", start: 30.22, end: 30.74 },
  { word: "минут.", start: 30.74, end: 31.14 },
  { word: "Ты", start: 31.8, end: 32.02 },
  { word: "не", start: 32.02, end: 32.14 },
  { word: "работаешь", start: 32.14, end: 32.56 },
  { word: "руками,", start: 32.56, end: 33.06 },
  { word: "ты", start: 33.22, end: 33.28 },
  { word: "сидишь", start: 33.28, end: 33.6 },
  { word: "на", start: 33.6, end: 33.76 },
  { word: "вышке", start: 33.76, end: 34.2 },
  { word: "и", start: 34.2, end: 34.46 },
  { word: "управляешь", start: 34.46, end: 35.06 },
  { word: "курсом.", start: 35.06, end: 35.52 },
  { word: "Напиши", start: 35.94, end: 36.24 },
  { word: "слово", start: 36.24, end: 36.42 },
  { word: "радар", start: 36.42, end: 36.86 },
  { word: "в", start: 36.86, end: 37.0 },
  { word: "комментариях", start: 37.0, end: 37.62 },
  { word: "и", start: 37.62, end: 37.84 },
  { word: "я", start: 37.84, end: 37.94 },
  { word: "покажу", start: 37.94, end: 38.26 },
  { word: "схему", start: 38.26, end: 38.66 },
  { word: "этой", start: 38.66, end: 38.88 },
  { word: "панели.", start: 38.88, end: 39.3 },
];

const DISPLAY_FIX: Record<string, string> = {
  "самолетов": "самолётов",
  "радар": "«радар»",
};

// -------------------------------------------------------------------------
// Camera
// -------------------------------------------------------------------------
const SCREEN = { cx: 540, cy: 1040, w: 315, h: 560 }; // console screen, exact 9:16
const SCREEN_L = SCREEN.cx - SCREEN.w / 2;
const SCREEN_T = SCREEN.cy - SCREEN.h / 2;
const ZOOM_MAX = 1080 / SCREEN.w; // screen fills 1080x1920

type Cam = { camZ: number; camY: number; rx: number; ry: number; zoom: number };

const getCamera = (t: number): Cam => {
  if (t < 20) {
    const k = ease01(0.0, 6.0, t, Easing.bezier(0.4, 0, 0.25, 1));
    const drift = 1 - smooth(4.6, 6.0, t);
    const zk = ease01(6.0, 7.5, t, Easing.bezier(0.55, 0, 0.3, 1));
    return {
      camZ: lerp(-600, 0, k),
      camY: Math.sin(t * 0.9) * 8 * drift,
      rx: (Math.sin(t * 0.5 + 1.2) * 1.1 - 0.6) * drift,
      ry: Math.sin(t * 0.7) * 3.2 * drift,
      zoom: Math.pow(ZOOM_MAX, zk),
    };
  }
  const zk = 1 - ease01(34.5, 36.0, t, Easing.bezier(0.6, 0, 0.35, 1));
  const back = ease01(35.6, 41.0, t, Easing.bezier(0.3, 0.1, 0.25, 1));
  const drift = smooth(35.7, 37.2, t);
  return {
    camZ: lerp(0, -560, back),
    camY: Math.sin((t - 35.7) * 0.8) * 6 * drift,
    rx: drift * (Math.sin(t * 0.6) * 0.8 - 0.4),
    ry: drift * Math.sin((t - 35.7) * 0.55) * 3.4,
    zoom: Math.pow(ZOOM_MAX, zk),
  };
};

/** 2D zoom transform that brings the console screen centre to frame centre */
const zoomTransform = (zoom: number) => {
  const k = (zoom - 1) / (ZOOM_MAX - 1);
  const dx = (540 - SCREEN.cx) * k;
  const dy = (960 - SCREEN.cy) * k;
  return `translate(${dx}px, ${dy}px) scale(${zoom})`;
};

// Punch zoom on key words
const PUNCH_AT = [8.9, 10.82, 19.64, 21.7, 24.36, 25.86, 27.5, 30.22, 32.56, 34.46, 35.94];
const punch = (t: number) => {
  let p = 0;
  for (const k of PUNCH_AT) if (t >= k) p += 0.05 * Math.exp(-(t - k) * 5.5) * smooth(k, k + 0.07, t);
  return p;
};

// -------------------------------------------------------------------------
// Radar primitives (used both on the console screen and in the HUD)
// -------------------------------------------------------------------------
const SWEEP_DPS = 72; // sweep degrees per second

type Blip = { r: number; a0: number; w: number; id: string };
const BLIPS: Blip[] = Array.from({ length: 30 }).map((_, i) => ({
  r: 0.22 + 0.72 * rand(i * 3 + 11),
  a0: rand(i * 7 + 5) * 360,
  w: (rand(i * 13 + 2) - 0.5) * 7,
  id: `T-${String(100 + Math.floor(rand(i + 90) * 899)).slice(0, 3)}`,
}));

const RadarDisc: React.FC<{
  t: number;
  size: number;
  blips: number;
  labels?: boolean;
  glow?: number;
  calm?: number; // 0 = normal
}> = ({ t, size, blips, labels = true, glow = 0 }) => {
  const R = size / 2;
  const sweep = mod(t * SWEEP_DPS, 360);
  const n = Math.max(0, Math.min(BLIPS.length, Math.floor(blips)));
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      {/* disc + rings */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          background: `repeating-radial-gradient(circle at 50% 50%, transparent 0 ${R / 4 - 2}px, rgba(6,182,212,0.32) ${R / 4 - 2}px ${R / 4}px), radial-gradient(circle at 50% 50%, rgba(6,182,212,${0.1 + 0.08 * glow}), rgba(15,23,42,0.85) 70%, #050D14 100%)`,
          border: `3px solid ${C.cyan}`,
          boxShadow: `0 0 ${50 + 40 * glow}px rgba(6,182,212,${0.25 + 0.2 * glow}), inset 0 0 60px rgba(6,182,212,0.18)`,
          overflow: "hidden",
        }}
      >
        {/* crosshair */}
        <div style={{ position: "absolute", left: R - 1, top: 0, width: 2, height: size, background: "rgba(6,182,212,0.22)" }} />
        <div style={{ position: "absolute", top: R - 1, left: 0, height: 2, width: size, background: "rgba(6,182,212,0.22)" }} />
        <div style={{ position: "absolute", left: R - 1, top: 0, width: 2, height: size, background: "rgba(6,182,212,0.12)", transform: "rotate(45deg)" }} />
        <div style={{ position: "absolute", left: R - 1, top: 0, width: 2, height: size, background: "rgba(6,182,212,0.12)", transform: "rotate(-45deg)" }} />
        {/* sweep trail */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            background: `conic-gradient(from ${sweep - 70}deg, transparent 0deg, rgba(6,182,212,0.06) 20deg, rgba(6,182,212,0.5) 69deg, rgba(6,182,212,0.95) 70deg, transparent 70.6deg)`,
          }}
        />
      </div>
      {/* degree ticks */}
      {Array.from({ length: 36 }).map((_, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: R - 1.5,
            top: -14,
            width: 3,
            height: i % 3 === 0 ? 18 : 10,
            background: i % 3 === 0 ? C.cyan : C.cyanDim,
            transformOrigin: `1.5px ${R + 14}px`,
            transform: `rotate(${i * 10}deg)`,
          }}
        />
      ))}
      {/* blips */}
      {BLIPS.slice(0, n).map((b, i) => {
        const a = mod(b.a0 + b.w * t, 360);
        const rr = b.r * (R - 20);
        const x = R + rr * Math.sin((a * Math.PI) / 180);
        const y = R - rr * Math.cos((a * Math.PI) / 180);
        const since = mod(sweep - a, 360);
        const hit = Math.exp(-since / 90);
        const o = 0.35 + 0.65 * hit;
        const s = Math.max(10, size * 0.018);
        return (
          <React.Fragment key={i}>
            <div
              style={{
                position: "absolute",
                left: x - s * 1.6,
                top: y - s * 1.6,
                width: s * 3.2,
                height: s * 3.2,
                borderRadius: "50%",
                background: `radial-gradient(circle, rgba(245,158,11,${0.55 * o}), transparent 68%)`,
              }}
            />
            <div style={{ position: "absolute", left: x - s / 2, top: y - s / 2, width: s, height: s, background: C.amber, opacity: o, transform: "rotate(45deg)" }} />
            {labels && (
              <div style={{ position: "absolute", left: x + s, top: y - s * 2.2, fontFamily: MONO, fontSize: Math.max(14, size * 0.022), color: C.amber, opacity: 0.25 + 0.75 * hit, letterSpacing: 1, whiteSpace: "nowrap" }}>
                {b.id}
              </div>
            )}
          </React.Fragment>
        );
      })}
      {/* centre */}
      <div style={{ position: "absolute", left: R - 8, top: R - 8, width: 16, height: 16, borderRadius: 8, background: C.cyan, boxShadow: `0 0 20px ${C.cyan}` }} />
    </div>
  );
};

// HUD background + frame (shared by console screen and full-screen HUD)
const HudBackground: React.FC<{ t: number }> = ({ t }) => (
  <AbsoluteFill
    style={{
      background: `radial-gradient(70% 45% at 50% 50%, rgba(6,182,212,0.12), transparent 75%), repeating-linear-gradient(0deg, ${C.line} 0 2px, transparent 2px 90px), repeating-linear-gradient(90deg, ${C.line} 0 2px, transparent 2px 90px), ${C.bg}`,
    }}
  >
    {/* slow scan band */}
    <div style={{ position: "absolute", left: 0, right: 0, top: mod(t * 260, 2300) - 300, height: 220, background: "linear-gradient(180deg, transparent, rgba(6,182,212,0.05), transparent)" }} />
  </AbsoluteFill>
);

const Bracket: React.FC<{ x: number; y: number; sx: 1 | -1; sy: 1 | -1 }> = ({ x, y, sx, sy }) => (
  <div style={{ position: "absolute", left: sx > 0 ? x : x - 70, top: sy > 0 ? y : y - 70, width: 70, height: 70, borderLeft: sx > 0 ? `4px solid ${C.cyan}` : undefined, borderRight: sx < 0 ? `4px solid ${C.cyan}` : undefined, borderTop: sy > 0 ? `4px solid ${C.cyan}` : undefined, borderBottom: sy < 0 ? `4px solid ${C.cyan}` : undefined, opacity: 0.8 }} />
);

const HudFrame: React.FC<{ t: number; label: string }> = ({ t, label }) => {
  const clk = 23 * 3600 + 47 * 60 + t;
  const hh = pad2(mod(Math.floor(clk / 3600), 24));
  const mm = pad2(mod(Math.floor(clk / 60), 60));
  const ss = pad2(mod(Math.floor(clk), 60));
  const rec = mod(Math.floor(t * 2), 2) === 0;
  return (
    <AbsoluteFill>
      <Bracket x={40} y={40} sx={1} sy={1} />
      <Bracket x={1040} y={40} sx={-1} sy={1} />
      <Bracket x={40} y={1880} sx={1} sy={-1} />
      <Bracket x={1040} y={1880} sx={-1} sy={-1} />
      <div style={{ position: "absolute", left: 130, right: 130, top: 58, display: "flex", justifyContent: "space-between", fontFamily: MONO, fontSize: 24, letterSpacing: 3, color: C.cyan }}>
        <span>
          <span style={{ color: C.amber, opacity: rec ? 1 : 0.3 }}>●</span> AI-ATC · {label}
        </span>
        <span>
          {hh}:{mm}:{ss}Z
        </span>
      </div>
      <div style={{ position: "absolute", left: 130, right: 130, top: 1842, display: "flex", justifyContent: "space-between", fontFamily: MONO, fontSize: 20, letterSpacing: 3, color: C.cyanDim }}>
        <span>SECTOR 01 · FL350</span>
        <span>SQK 7000</span>
      </div>
    </AbsoluteFill>
  );
};

/** Scene 2 layout. Also rendered (scaled) on the tower console screen. */
const RadarHome: React.FC<{ t: number; f: number; phase: "hook" | "s2" | "online" }> = ({ t, f, phase }) => {
  const toS2 = phase === "s2" ? smooth(8.5, 9.0, t) : 0;
  const tasks = phase === "s2" ? Math.round(100 * ease01(8.9, 12.2, t, EXPO_OUT)) : phase === "online" ? 100 : 37;
  const blips = phase === "s2" ? lerp(12, 30, ease01(8.9, 12.2, t)) : phase === "online" ? 30 : 12 + 6 * smooth(1, 5, t);
  const zeroPop = phase === "s2" ? sp(f, 9.6) : 1;
  const footerO = phase === "s2" ? smooth(13.2, 13.7, t) : 1;
  const glow = phase === "online" ? 1 : 0;
  return (
    <AbsoluteFill>
      {/* header */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 170, height: 330 }}>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", opacity: 1 - toS2 }}>
          <div style={{ fontFamily: MONO, fontSize: 28, letterSpacing: 8, color: C.cyan, marginBottom: 18 }}>
            {phase === "online" ? "STATUS · GREEN" : "SYSTEM · ONLINE"}
          </div>
          {phase === "online" ? (
            <div style={{ fontFamily: SANS, fontWeight: 900, fontSize: 108, lineHeight: 1.0, color: C.white, textAlign: "center", letterSpacing: -2 }}>
              ALL SYSTEMS
              <br />
              <span style={{ color: C.cyan }}>ON COURSE</span>
            </div>
          ) : (
            <div style={{ fontFamily: SANS, fontWeight: 900, fontSize: 92, lineHeight: 1.04, color: C.white, textAlign: "center", letterSpacing: -2 }}>
              ЛИЧНАЯ
              <br />
              ДИСПЕТЧЕРСКАЯ <span style={{ color: C.cyan }}>ИИ</span>
            </div>
          )}
        </div>
        {toS2 > 0 && (
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", opacity: toS2, transform: `translateY(${(1 - toS2) * 30}px)` }}>
            <div style={{ fontFamily: SANS, fontWeight: 900, fontSize: 112, lineHeight: 1.0, color: C.white, letterSpacing: -3, textAlign: "center" }}>
              <span style={{ color: C.amber }}>{tasks}</span> ЗАДАЧ
              <br />В НЕБЕ
            </div>
            <div
              style={{
                marginTop: 22,
                padding: "10px 34px",
                borderRadius: 40,
                border: `3px solid ${C.cyan}`,
                background: "rgba(6,182,212,0.14)",
                fontFamily: SANS,
                fontWeight: 900,
                fontSize: 54,
                color: C.cyan,
                letterSpacing: 2,
                transform: `scale(${0.6 + 0.4 * zeroPop})`,
                opacity: clamp01(zeroPop * 2),
              }}
            >
              0 ОШИБОК
            </div>
          </div>
        )}
      </div>
      {/* radar */}
      <div style={{ position: "absolute", left: 100, top: 580 }}>
        <RadarDisc t={t} size={880} blips={blips} glow={glow} />
      </div>
      {/* stats */}
      <div style={{ position: "absolute", left: 90, right: 90, top: 1510, display: "flex", gap: 24, opacity: footerO }}>
        {[
          ["TRACKED", String(tasks), C.amber],
          ["CONFLICTS", "0", C.cyan],
          ["AGENTS", "AI × 3", C.white],
        ].map(([k, v, col]) => (
          <div key={k} style={{ flex: 1, padding: "14px 0", border: `2px solid ${C.cyanDim}`, background: "rgba(15,23,42,0.8)", borderRadius: 14, textAlign: "center" }}>
            <div style={{ fontFamily: MONO, fontSize: 20, letterSpacing: 4, color: C.cyanDim }}>{k}</div>
            <div style={{ fontFamily: SANS, fontWeight: 900, fontSize: 48, color: col }}>{v}</div>
          </div>
        ))}
      </div>
      {phase === "s2" && (
        <div style={{ position: "absolute", left: 0, right: 0, top: 1650, textAlign: "center", fontFamily: MONO, fontSize: 28, letterSpacing: 6, color: C.cyan, opacity: footerO * (1 - smooth(15.9, 16.3, t)) }}>
          {t > 14.4 ? "СИСТЕМА ИИ-АГЕНТОВ · 2026" : "2026 · ТВОЯ СИСТЕМА"}
        </div>
      )}
    </AbsoluteFill>
  );
};

// -------------------------------------------------------------------------
// Outside world (sky, runway, plane) — one flat SVG far behind the glass
// -------------------------------------------------------------------------
const BD = { w: 4400, h: 3000, left: 540 - 2200, top: -1500, z: -1500, horizon: 1610 };
const RW = { nearY: 2700, nearL: 950, nearR: 1850, farY: 1640, farL: 2380, farR: 2420 };

const rwPoint = (side: number, v: number) => {
  // side: 0 = left edge, 1 = right edge, 0.5 = centreline; v: 0 far → 1 near
  const k = v * v;
  const y = lerp(RW.farY, RW.nearY, k);
  const xl = lerp(RW.farL, RW.nearL, k);
  const xr = lerp(RW.farR, RW.nearR, k);
  return { x: lerp(xl, xr, side), y, s: 1.5 + 9 * k };
};

const qb = (p0: number, p1: number, p2: number, u: number) => (1 - u) * (1 - u) * p0 + 2 * (1 - u) * u * p1 + u * u * p2;

const Plane: React.FC<{ t: number; t0: number; t1: number }> = ({ t, t0, t1 }) => {
  if (t < t0 - 0.1 || t > t1 + 0.1) return null;
  const u = ease01(t0, t1, t, Easing.bezier(0.45, 0, 0.75, 0.9));
  const P0 = [1700, 2330];
  const P1 = [2350, 1750];
  const P2 = [3300, 420];
  const x = qb(P0[0], P1[0], P2[0], u);
  const y = qb(P0[1], P1[1], P2[1], u);
  const dx = 2 * (1 - u) * (P1[0] - P0[0]) + 2 * u * (P2[0] - P1[0]);
  const dy = 2 * (1 - u) * (P1[1] - P0[1]) + 2 * u * (P2[1] - P1[1]);
  const pitch = ((Math.atan2(dy, dx) * 180) / Math.PI) * 0.55;
  const s = lerp(1.35, 0.35, u);
  const blink = mod(Math.floor(t * 60), 70) < 6 ? 1 : 0;
  const beacon = mod(Math.floor(t * 60 + 30), 60) < 10 ? 1 : 0.15;
  return (
    <g transform={`translate(${x} ${y}) rotate(${pitch}) scale(${s})`}>
      {/* landing light beam */}
      <polygon points="118,0 520,-70 520,70" fill="url(#beam)" opacity={0.6} />
      <circle cx={122} cy={2} r={36} fill="url(#glowW)" />
      <path d="M-95,-4 L-75,-6 L-98,-46 L-112,-46 Z" fill="#0B1622" stroke="rgba(248,250,252,0.35)" strokeWidth={2} />
      <path d="M-10,-6 L30,-6 L-40,-44 L-58,-44 Z" fill="#08111A" stroke="rgba(248,250,252,0.25)" strokeWidth={2} />
      <path d="M-110,0 Q-100,-10 -60,-10 L90,-8 Q118,-4 120,0 Q118,5 90,7 L-60,8 Q-100,8 -110,0 Z" fill="#0E1A27" stroke="rgba(248,250,252,0.45)" strokeWidth={2} />
      <path d="M-20,4 L28,4 L-30,54 L-52,54 Z" fill="#0E1A27" stroke="rgba(248,250,252,0.35)" strokeWidth={2} />
      <path d="M-100,2 L-80,2 L-110,18 L-118,18 Z" fill="#0E1A27" />
      {Array.from({ length: 8 }).map((_, i) => (
        <rect key={i} x={-40 + i * 15} y={-5} width={6} height={4} fill={C.amber} opacity={0.8} />
      ))}
      <circle cx={-46} cy={52} r={9} fill="url(#glowG)" />
      <circle cx={-52} cy={-44} r={9} fill="url(#glowR)" />
      <circle cx={0} cy={-11} r={10 * beacon + 2} fill="url(#glowR)" />
      <circle cx={-112} cy={-2} r={26} fill="url(#glowW)" opacity={blink} />
    </g>
  );
};

const STARS = Array.from({ length: 150 }).map((_, i) => ({ x: rand(i * 2 + 1) * BD.w, y: rand(i * 5 + 3) * (BD.horizon - 120), r: 1.5 + rand(i + 300) * 3.2, tw: rand(i + 600) * 6.28 }));

const Outside: React.FC<{ t: number; glow: number }> = ({ t, glow }) => {
  const N = 22;
  const rabbit = mod(Math.floor(t * 12), 10);
  return (
    <svg width={BD.w} height={BD.h} viewBox={`0 0 ${BD.w} ${BD.h}`} style={{ position: "absolute", left: 0, top: 0 }}>
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#01040A" />
          <stop offset="0.75" stopColor="#061826" />
          <stop offset="1" stopColor="#0B2A3A" />
        </linearGradient>
        <linearGradient id="ground" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#04101A" />
          <stop offset="1" stopColor="#010509" />
        </linearGradient>
        <radialGradient id="glowW">
          <stop offset="0" stopColor="#F8FAFC" stopOpacity="1" />
          <stop offset="1" stopColor="#F8FAFC" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="glowA">
          <stop offset="0" stopColor="#F59E0B" stopOpacity="1" />
          <stop offset="1" stopColor="#F59E0B" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="glowC">
          <stop offset="0" stopColor="#06B6D4" stopOpacity="1" />
          <stop offset="1" stopColor="#06B6D4" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="glowR">
          <stop offset="0" stopColor="#FF4D4D" stopOpacity="1" />
          <stop offset="1" stopColor="#FF4D4D" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="glowG">
          <stop offset="0" stopColor="#4ADE80" stopOpacity="1" />
          <stop offset="1" stopColor="#4ADE80" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="beam" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#F8FAFC" stopOpacity="0.55" />
          <stop offset="1" stopColor="#F8FAFC" stopOpacity="0" />
        </linearGradient>
        <radialGradient id="haze" cx="0.55" cy="1" r="0.6">
          <stop offset="0" stopColor="#06B6D4" stopOpacity="0.28" />
          <stop offset="1" stopColor="#06B6D4" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width={BD.w} height={BD.horizon} fill="url(#sky)" />
      <rect y={BD.horizon - 900} width={BD.w} height={900} fill="url(#haze)" />
      {STARS.map((s, i) => (
        <circle key={i} cx={s.x} cy={s.y} r={s.r} fill={C.white} opacity={0.25 + 0.45 * (0.5 + 0.5 * Math.sin(t * 1.7 + s.tw))} />
      ))}
      {/* distant city line */}
      {Array.from({ length: 90 }).map((_, i) => {
        const x = rand(i * 9 + 4) * BD.w;
        return <circle key={i} cx={x} cy={BD.horizon - 6 - rand(i + 77) * 18} r={3 + rand(i + 31) * 3} fill={i % 4 === 0 ? C.white : C.amber} opacity={0.35 + 0.4 * rand(i + 5)} />;
      })}
      <rect y={BD.horizon} width={BD.w} height={BD.h - BD.horizon} fill="url(#ground)" />
      {/* runway */}
      <polygon points={`${RW.farL},${RW.farY} ${RW.farR},${RW.farY} ${RW.nearR},${RW.nearY} ${RW.nearL},${RW.nearY}`} fill="#0A1520" />
      {/* taxiway arc */}
      {Array.from({ length: 14 }).map((_, i) => {
        const v = 0.25 + i * 0.05;
        const p = rwPoint(1, v);
        return <circle key={`tx${i}`} cx={p.x + 120 + 380 * v * v} cy={p.y - 20} r={p.s * 2.2} fill="url(#glowA)" opacity={0.6 + 0.4 * glow} />;
      })}
      {Array.from({ length: N }).map((_, i) => {
        const v = i / (N - 1);
        const L = rwPoint(0, v);
        const Rt = rwPoint(1, v);
        const Cc = rwPoint(0.5, v);
        const o = 0.7 + 0.3 * glow;
        return (
          <React.Fragment key={i}>
            <circle cx={L.x} cy={L.y} r={L.s * 3.4} fill="url(#glowW)" opacity={o} />
            <circle cx={Rt.x} cy={Rt.y} r={Rt.s * 3.4} fill="url(#glowW)" opacity={o} />
            {i % 2 === 0 && <circle cx={Cc.x} cy={Cc.y} r={Cc.s * 2.4} fill="url(#glowC)" opacity={0.5 + 0.5 * glow} />}
          </React.Fragment>
        );
      })}
      {/* threshold bar + approach rabbit */}
      {Array.from({ length: 10 }).map((_, i) => {
        const p = rwPoint(i / 9, 0.92);
        return <circle key={`th${i}`} cx={p.x} cy={p.y} r={p.s * 3} fill="url(#glowA)" />;
      })}
      {Array.from({ length: 10 }).map((_, i) => {
        const p = rwPoint(0.5, 0.94 + i * 0.012);
        const on = mod(rabbit - (9 - i), 10) === 0;
        return <circle key={`rb${i}`} cx={p.x} cy={p.y + i * 14} r={p.s * 4.2} fill="url(#glowW)" opacity={on ? 1 : 0.08} />;
      })}
      <Plane t={t} t0={0.9} t1={6.6} />
      <Plane t={t} t0={36.4} t1={41.6} />
    </svg>
  );
};

// -------------------------------------------------------------------------
// 3D CONTROL TOWER (CSS 3D)
// -------------------------------------------------------------------------
const WIN_Z = -300;
const WIN_TOP = 0;
const WIN_BOT = 940;
const PANEL_TOP = -1400;
const FLOOR_Y = 1700;
const SIDE_W = 1300;
const SIDE_ANGLE = 55;

/** One glass wall section: dark wall above/below, mullioned glass in between */
const GlassWall: React.FC<{ width: number; mullions: number; flip?: boolean }> = ({ width, mullions, flip }) => {
  const H = FLOOR_Y - PANEL_TOP;
  const gTop = WIN_TOP - PANEL_TOP;
  const gH = WIN_BOT - WIN_TOP;
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width, height: H }}>
      <div style={{ position: "absolute", left: 0, top: 0, width, height: gTop, background: "linear-gradient(180deg, #02060A, #07121C)", borderBottom: `6px solid #0F172A` }} />
      {/* recessed ceiling light strip */}
      <div style={{ position: "absolute", left: 0, top: gTop - 60, width, height: 10, background: "rgba(6,182,212,0.55)", boxShadow: "0 0 30px rgba(6,182,212,0.6)" }} />
      {/* glass */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: gTop,
          width,
          height: gH,
          background: `linear-gradient(${flip ? 245 : 115}deg, transparent 0 30%, rgba(6,182,212,0.07) 34%, transparent 40% 62%, rgba(248,250,252,0.05) 65%, transparent 70%), linear-gradient(180deg, rgba(6,182,212,0.05), rgba(6,182,212,0.02))`,
        }}
      >
        {Array.from({ length: mullions + 1 }).map((_, i) => (
          <div key={i} style={{ position: "absolute", left: (i * width) / mullions - 9, top: 0, width: 18, height: gH, background: "linear-gradient(90deg, #050B12, #111D2B, #050B12)" }} />
        ))}
        <div style={{ position: "absolute", left: 0, top: 0, width, height: 16, background: "#0B1520" }} />
      </div>
      {/* sill + lower wall */}
      <div style={{ position: "absolute", left: 0, top: gTop + gH, width, height: H - gTop - gH, background: "linear-gradient(180deg, #0F172A 0 22px, #07101A 22px, #040A10)", borderTop: `3px solid rgba(6,182,212,0.4)` }} />
    </div>
  );
};

const SideConsole: React.FC<{ x: number; t: number; kind: "list" | "scope" }> = ({ x, t, kind }) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: 1120,
      width: 280,
      height: 210,
      transformOrigin: "50% 100%",
      transform: "translateZ(40px) rotateX(-16deg)",
      background: "#0A1420",
      border: `3px solid ${kind === "list" ? C.amberDim : C.cyanDim}`,
      boxShadow: `0 0 30px ${kind === "list" ? "rgba(245,158,11,0.25)" : "rgba(6,182,212,0.25)"}`,
      overflow: "hidden",
      boxSizing: "border-box",
    }}
  >
    {kind === "list" ? (
      Array.from({ length: 7 }).map((_, i) => {
        const row = mod(i + Math.floor(t * 1.5), 7);
        return (
          <div key={i} style={{ position: "absolute", left: 14, top: 12 + i * 27, fontFamily: MONO, fontSize: 16, color: row === 0 ? C.white : C.amber, opacity: row === 0 ? 1 : 0.7, whiteSpace: "nowrap" }}>
            {["AI-214  FL350  ✓", "DOC-07  CHECK  ✓", "LEAD-3  CRM    ✓", "POST-9  QUEUE  ✓", "MSG-41  REPLY  ✓", "AI-117  FL310  ✓", "INV-22  SENT   ✓"][row]}
          </div>
        );
      })
    ) : (
      <div style={{ position: "absolute", left: 50, top: 15 }}>
        <RadarDisc t={t + 1.3} size={180} blips={8} labels={false} />
      </div>
    )}
  </div>
);

const Controller: React.FC = () => (
  <svg width={260} height={820} viewBox="0 0 260 820" style={{ position: "absolute", left: 0, top: 0 }}>
    {/* soft outer rim glow (stroke, no filter) */}
    <g fill="none" stroke="rgba(6,182,212,0.18)" strokeWidth={18} strokeLinejoin="round">
      <circle cx={130} cy={92} r={58} />
      <path d="M40,236 Q40,172 130,166 Q220,172 220,236 L232,520 Q236,560 210,560 L50,560 Q24,560 28,520 Z" />
    </g>
    <g fill="#04090F" stroke={C.cyan} strokeWidth={3.5} strokeLinejoin="round">
      <path d="M62,552 L80,815 L122,815 L128,584 L134,584 L140,815 L182,815 L200,552 Z" />
      <path d="M40,236 Q40,172 130,166 Q220,172 220,236 L232,520 Q236,560 210,560 L50,560 Q24,560 28,520 Z" />
      <rect x={110} y={140} width={40} height={34} />
      <circle cx={130} cy={92} r={58} />
    </g>
    {/* headset */}
    <path d="M70,92 Q70,22 130,22 Q190,22 190,92" fill="none" stroke={C.amber} strokeWidth={7} />
    <rect x={60} y={80} width={20} height={36} rx={6} fill={C.amber} />
    <rect x={180} y={80} width={20} height={36} rx={6} fill={C.amber} />
  </svg>
);

const TowerWorld: React.FC<{ t: number; f: number; cam: Cam; glow: number; mode: "hook" | "online" }> = ({ t, f, cam, glow, mode }) => {
  const consolePulse = lerp(0.55 + 0.45 * Math.sin(t * 2.6), 1, glow);
  const centerW = 1000;
  const centerL = 40;
  const sideRad = (SIDE_ANGLE * Math.PI) / 180;
  const sideReachZ = WIN_Z + SIDE_W * Math.sin(sideRad);
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
        {/* outside world */}
        <div style={{ position: "absolute", left: BD.left, top: BD.top, width: BD.w, height: BD.h, transform: `translateZ(${BD.z}px)` }}>
          <Outside t={t} glow={glow} />
        </div>
        {/* floor */}
        <div
          style={{
            position: "absolute",
            left: -900,
            top: FLOOR_Y,
            width: 2880,
            height: sideReachZ - WIN_Z,
            transformOrigin: "50% 0",
            transform: `translateZ(${WIN_Z}px) rotateX(90deg)`,
            background: `radial-gradient(40% 60% at 50% 0%, rgba(6,182,212,${0.1 + 0.1 * glow}), transparent 70%), repeating-linear-gradient(0deg, rgba(6,182,212,0.08) 0 2px, transparent 2px 120px), repeating-linear-gradient(90deg, rgba(6,182,212,0.05) 0 2px, transparent 2px 120px), linear-gradient(0deg, #08111B, #050B12)`,
          }}
        />
        {/* glass walls */}
        <div style={{ position: "absolute", left: centerL, top: PANEL_TOP, width: centerW, height: FLOOR_Y - PANEL_TOP, transform: `translateZ(${WIN_Z}px)` }}>
          <GlassWall width={centerW} mullions={3} />
        </div>
        <div style={{ position: "absolute", left: centerL - SIDE_W, top: PANEL_TOP, width: SIDE_W, height: FLOOR_Y - PANEL_TOP, transformOrigin: "100% 50%", transform: `translateZ(${WIN_Z}px) rotateY(${SIDE_ANGLE}deg)` }}>
          <GlassWall width={SIDE_W} mullions={3} />
        </div>
        <div style={{ position: "absolute", left: centerL + centerW, top: PANEL_TOP, width: SIDE_W, height: FLOOR_Y - PANEL_TOP, transformOrigin: "0% 50%", transform: `translateZ(${WIN_Z}px) rotateY(${-SIDE_ANGLE}deg)` }}>
          <GlassWall width={SIDE_W} mullions={3} flip />
        </div>
        {/* side consoles on the desk */}
        <SideConsole x={50} t={t} kind="list" />
        <SideConsole x={750} t={t} kind="scope" />
        {/* desk: top face + front face */}
        <div style={{ position: "absolute", left: 0, top: 1350, width: 1080, height: 320, transformOrigin: "50% 0", transform: "translateZ(-20px) rotateX(90deg)", background: "linear-gradient(0deg, #142033, #0B1522), repeating-linear-gradient(90deg, rgba(6,182,212,0.12) 0 2px, transparent 2px 60px)" }} />
        <div style={{ position: "absolute", left: 0, top: 1350, width: 1080, height: 350, transform: "translateZ(300px)", background: "linear-gradient(180deg, #0F172A, #060C14)", borderTop: `4px solid ${C.cyan}`, boxShadow: `0 -10px 40px rgba(6,182,212,${0.15 + 0.2 * glow})` }}>
          {Array.from({ length: 18 }).map((_, i) => (
            <div key={i} style={{ position: "absolute", left: 40 + i * 56, top: 34, width: 30, height: 12, borderRadius: 3, background: i % 5 === 0 ? C.amber : C.cyan, opacity: mod(Math.floor(t * 3) + i * 7, 9) === 0 ? 0.25 : 0.85 }} />
          ))}
        </div>
        {/* radar console housing + screen (z = 0) */}
        <div style={{ position: "absolute", left: SCREEN.cx - 30, top: SCREEN_T + SCREEN.h + 20, width: 60, height: 1350 - SCREEN_T - SCREEN.h - 20, background: "#0B1522" }} />
        <div
          style={{
            position: "absolute",
            left: SCREEN_L - 24,
            top: SCREEN_T - 24,
            width: SCREEN.w + 48,
            height: SCREEN.h + 48,
            borderRadius: 18,
            background: "linear-gradient(180deg, #16243A, #0A1320)",
            border: `3px solid ${C.cyan}`,
            boxSizing: "border-box",
            boxShadow: `0 0 ${40 + 60 * consolePulse}px rgba(6,182,212,${0.3 + 0.25 * consolePulse})`,
          }}
        >
          <div style={{ position: "absolute", left: 0, right: 0, bottom: 4, textAlign: "center", fontFamily: MONO, fontSize: 11, letterSpacing: 3, color: C.cyanDim }}>AI-ATC · MK II</div>
        </div>
        <div style={{ position: "absolute", left: SCREEN_L, top: SCREEN_T, width: SCREEN.w, height: SCREEN.h, overflow: "hidden", background: C.bg }}>
          <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, transformOrigin: "0 0", transform: `scale(${SCREEN.w / 1080})` }}>
            <HudBackground t={t} />
            <HudFrame t={t} label={mode === "online" ? "TOWER" : "SECTOR 01"} />
            <RadarHome t={t} f={f} phase={mode} />
          </div>
        </div>
        {/* flat 2D controller with rim light + soft floor shadow */}
        <div style={{ position: "absolute", left: 790, top: FLOOR_Y - 80, width: 300, height: 160, borderRadius: "50%", transform: "translateZ(240px) rotateX(90deg)", background: "radial-gradient(closest-side, rgba(0,0,0,0.75), rgba(0,0,0,0))" }} />
        <div style={{ position: "absolute", left: 800, top: FLOOR_Y - 820, width: 260, height: 820, transform: "translateZ(260px)" }}>
          <Controller />
        </div>
      </div>
      {/* cyan room haze */}
      <div style={{ position: "absolute", inset: 0, background: `radial-gradient(50% 30% at 50% 55%, rgba(6,182,212,${0.06 + 0.08 * glow}), transparent 70%)`, pointerEvents: "none" }} />
    </div>
  );
};

// Bokeh in the foreground (DOF) — soft gradients, no blur filter
const Bokeh: React.FC<{ t: number; amount: number }> = ({ t, amount }) => (
  <>
    {Array.from({ length: 14 }).map((_, i) => {
      const r = rand(i + 7);
      const size = 40 + r * 130;
      const x = mod(rand(i * 3 + 1) * 1180 + t * (8 + r * 18), 1180) - 50;
      const y = mod(rand(i * 5 + 2) * 2020 - t * (12 + r * 20), 2020) - 50;
      const col = i % 3 === 0 ? "245,158,11" : "6,182,212";
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
            background: `radial-gradient(circle, rgba(${col},0.45), rgba(${col},0.12) 45%, rgba(${col},0) 70%)`,
            opacity: amount * (0.25 + 0.35 * rand(i + 40)),
          }}
        />
      );
    })}
  </>
);

// -------------------------------------------------------------------------
// HOOK + ENDING overlays
// -------------------------------------------------------------------------
const HookOverlay: React.FC<{ t: number; f: number }> = ({ t, f }) => {
  const o = 1 - smooth(5.6, 6.1, t);
  const a = sp(f, 0.05);
  const b = sp(f, 2.4);
  const c = sp(f, 3.65);
  return (
    <AbsoluteFill style={{ opacity: o, pointerEvents: "none" }}>
      <div style={{ position: "absolute", left: 0, right: 0, top: 120, display: "flex", justifyContent: "center", opacity: clamp01(a * 2) }}>
        <div style={{ padding: "10px 26px", borderRadius: 30, border: `2px solid ${C.cyanDim}`, background: "rgba(3,9,14,0.75)", fontFamily: MONO, fontSize: 26, letterSpacing: 5, color: C.cyan }}>
          TWR · НОЧНАЯ СМЕНА · RWY 27L
        </div>
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 220, textAlign: "center", fontFamily: SANS, fontWeight: 900, letterSpacing: -2, lineHeight: 1.02 }}>
        <div style={{ fontSize: 104, color: C.white, opacity: clamp01(b * 2), transform: `translateY(${(1 - b) * 40}px) scale(${0.9 + 0.1 * b})`, textShadow: "0 6px 30px rgba(0,0,0,0.9)" }}>
          1 ДИСПЕТЧЕР
        </div>
        <div style={{ fontSize: 104, color: C.amber, opacity: clamp01(c * 2), transform: `translateY(${(1 - c) * 40}px) scale(${0.9 + 0.1 * c})`, textShadow: "0 6px 30px rgba(0,0,0,0.9)" }}>
          ДЕСЯТКИ САМОЛЁТОВ
        </div>
      </div>
    </AbsoluteFill>
  );
};

const EndOverlay: React.FC<{ t: number; f: number }> = ({ t, f }) => {
  const tag = sp(f, 36.0);
  const cta = sp(f, 35.94, { damping: 11, stiffness: 190, mass: 0.6 });
  const sub = smooth(37.6, 38.1, t);
  const pulse = 0.5 + 0.5 * Math.sin(t * 5);
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={{ position: "absolute", left: 0, right: 0, top: 130, display: "flex", justifyContent: "center", opacity: clamp01(tag * 2), transform: `translateY(${(1 - tag) * -30}px)` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18, padding: "14px 34px", borderRadius: 40, border: `3px solid ${C.cyan}`, background: "rgba(3,9,14,0.82)", boxShadow: `0 0 40px rgba(6,182,212,${0.25 + 0.25 * pulse})` }}>
          <div style={{ width: 20, height: 20, borderRadius: 10, background: C.cyan, boxShadow: `0 0 ${10 + 14 * pulse}px ${C.cyan}` }} />
          <span style={{ fontFamily: MONO, fontWeight: 700, fontSize: 38, letterSpacing: 5, color: C.white }}>ALL SYSTEMS ON COURSE</span>
        </div>
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 1390, display: "flex", flexDirection: "column", alignItems: "center", opacity: clamp01(cta * 2), transform: `scale(${0.7 + 0.3 * cta})` }}>
        <div
          style={{
            padding: "22px 54px",
            borderRadius: 34,
            background: "rgba(3,9,14,0.9)",
            border: `4px solid ${C.amber}`,
            boxShadow: `0 0 ${40 + 30 * pulse}px rgba(245,158,11,0.45), 0 20px 60px rgba(0,0,0,0.7)`,
            fontFamily: SANS,
            fontWeight: 900,
            fontSize: 100,
            letterSpacing: -2,
            color: C.white,
            whiteSpace: "nowrap",
          }}
        >
          НАПИШИ <span style={{ color: C.amber }}>«РАДАР»</span>
        </div>
        <div style={{ marginTop: 18, fontFamily: MONO, fontSize: 30, letterSpacing: 4, color: C.cyan, opacity: sub, background: "rgba(3,9,14,0.75)", padding: "6px 18px", borderRadius: 12 }}>
          В КОММЕНТАХ → СХЕМА ПАНЕЛИ
        </div>
      </div>
    </AbsoluteFill>
  );
};

// -------------------------------------------------------------------------
// MIDDLE (inside the radar HUD)
// -------------------------------------------------------------------------
const Tag: React.FC<{ children: React.ReactNode; color?: string; style?: React.CSSProperties }> = ({ children, color = C.cyan, style }) => (
  <div style={{ display: "inline-block", padding: "8px 22px", borderRadius: 26, border: `2px solid ${color}`, fontFamily: MONO, fontSize: 24, letterSpacing: 5, color, background: "rgba(3,9,14,0.7)", ...style }}>{children}</div>
);

const Strike: React.FC<{ k: number; width: number; top: number }> = ({ k, width, top }) => (
  <div style={{ position: "absolute", left: `calc(50% - ${width / 2}px)`, top, width: width * k, height: 12, borderRadius: 6, background: C.amber, boxShadow: `0 0 20px ${C.amber}`, transform: "rotate(-4deg)", transformOrigin: "0 50%" }} />
);

// Scene 3 — chaos vs unified radar
const CHAOS = Array.from({ length: 26 }).map((_, i) => ({ x: 60 + rand(i * 4 + 1) * 780, y: 40 + rand(i * 6 + 2) * 420, ph: rand(i + 50) * 6.28, sp: 1.5 + rand(i + 70) * 3 }));

const Scene3: React.FC<{ t: number; f: number }> = ({ t, f }) => {
  const topIn = sp(f, 16.4);
  const strike = ease01(19.6, 20.1, t, EXPO_OUT);
  const dim = 1 - 0.6 * strike;
  const bottomIn = sp(f, 21.6, { damping: 13, stiffness: 160, mass: 0.7 });
  const pts = CHAOS.map((p) => ({
    x: p.x + Math.sin(t * p.sp + p.ph) * 40 * (1 - 0.7 * strike),
    y: p.y + Math.cos(t * p.sp * 1.3 + p.ph) * 34 * (1 - 0.7 * strike),
  }));
  return (
    <AbsoluteFill>
      {/* top: chaos */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 150, textAlign: "center", opacity: clamp01(topIn * 2), transform: `translateY(${(1 - topIn) * 30}px)` }}>
        <Tag color={C.amber}>БЕЗ СИСТЕМЫ</Tag>
        <div style={{ position: "relative", marginTop: 16, fontFamily: SANS, fontWeight: 900, fontSize: 104, letterSpacing: -2, color: C.white, opacity: dim }}>ХАОС В ГОЛОВЕ</div>
        <Strike k={strike} width={820} top={110} />
      </div>
      <div style={{ position: "absolute", left: 90, top: 380, width: 900, height: 500, borderRadius: 24, border: `2px solid ${C.amberDim}`, background: "rgba(15,23,42,0.6)", overflow: "hidden", opacity: clamp01(topIn * 2) * dim }}>
        <svg width={900} height={500} style={{ position: "absolute", inset: 0 }}>
          {pts.map((p, i) => {
            const q = pts[mod(i * 7 + 3, pts.length)];
            return <line key={`l${i}`} x1={p.x} y1={p.y} x2={q.x} y2={q.y} stroke={C.amber} strokeOpacity={0.28} strokeWidth={2} />;
          })}
          {pts.map((p, i) => (
            <g key={i} transform={`translate(${p.x} ${p.y}) rotate(45)`}>
              <rect x={-8} y={-8} width={16} height={16} fill={i % 5 === 0 ? C.white : C.amber} opacity={0.6 + 0.4 * Math.sin(t * 9 + i)} />
            </g>
          ))}
        </svg>
        <div style={{ position: "absolute", right: 20, top: 16, fontFamily: MONO, fontSize: 22, color: C.amber, opacity: mod(Math.floor(t * 4), 2) === 0 ? 1 : 0.3 }}>⚠ CONFLICT × {12 + mod(Math.floor(t * 6), 9)}</div>
      </div>
      {/* VS */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 905, textAlign: "center", fontFamily: MONO, fontWeight: 700, fontSize: 40, letterSpacing: 10, color: C.whiteMute, opacity: smooth(20.6, 21.0, t) }}>— VS —</div>
      {/* bottom: unified radar */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 985, display: "flex", flexDirection: "column", alignItems: "center", opacity: clamp01(bottomIn * 2), transform: `scale(${0.8 + 0.2 * bottomIn})` }}>
        <div style={{ fontFamily: SANS, fontWeight: 900, fontSize: 104, letterSpacing: -2, color: C.cyan, textShadow: "0 0 40px rgba(6,182,212,0.5)" }}>ЕДИНЫЙ РАДАР</div>
        <div style={{ marginTop: 24 }}>
          <RadarDisc t={t} size={540} blips={20} labels={false} glow={0.6} />
        </div>
      </div>
    </AbsoluteFill>
  );
};

// Scene 4 — three flight vectors
type Vec = { label: string[]; at: number; p: number[][]; card: number; status: string };
const HUB = { x: 540, y: 1380 };
const VECS: Vec[] = [
  { label: ["ЗАЯВКИ"], at: 24.2, card: 200, status: "→ CRM ✓", p: [[540, 1230], [540, 950], [200, 950], [200, 660]] },
  { label: ["ДОКУМЕНТЫ"], at: 25.7, card: 540, status: "ПРОВЕРЕНО ✓", p: [[540, 1230], [540, 1000], [540, 820], [540, 660]] },
  { label: ["КОНТЕНТ +", "КОММЕНТЫ"], at: 27.3, card: 880, status: "ОТВЕТЫ ✓", p: [[540, 1230], [540, 950], [880, 950], [880, 660]] },
];

const cb = (p: number[][], u: number, k: 0 | 1) => {
  const a = 1 - u;
  return a * a * a * p[0][k] + 3 * a * a * u * p[1][k] + 3 * a * u * u * p[2][k] + u * u * u * p[3][k];
};

const Scene4: React.FC<{ t: number; f: number }> = ({ t, f }) => {
  const titleIn = sp(f, 23.1);
  const hubIn = sp(f, 23.4);
  const timerIn = sp(f, 29.6);
  const cycle = mod(t - 29.6, 2.4) / 2.4; // stylised "every 15 min" loop
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: 0, right: 0, top: 140, textAlign: "center", opacity: clamp01(titleIn * 2), transform: `translateY(${(1 - titleIn) * 30}px)` }}>
        <Tag>AUTOPILOT · ROUTING</Tag>
        <div style={{ marginTop: 14, fontFamily: SANS, fontWeight: 900, fontSize: 92, letterSpacing: -2, color: C.white }}>
          <span style={{ color: C.cyan }}>3</span> ВЕКТОРА ПОЛЁТА
        </div>
      </div>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        {VECS.map((v, i) => {
          const d = `M${v.p[0][0]},${v.p[0][1]} C${v.p[1][0]},${v.p[1][1]} ${v.p[2][0]},${v.p[2][1]} ${v.p[3][0]},${v.p[3][1]}`;
          const draw = ease01(v.at, v.at + 0.8, t, EXPO_OUT);
          return (
            <g key={i}>
              <path d={d} fill="none" stroke="rgba(6,182,212,0.15)" strokeWidth={16} strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - draw} />
              <path d={d} fill="none" stroke={C.cyan} strokeWidth={5} strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - draw} />
              <path d={d} fill="none" stroke={C.white} strokeOpacity={0.5 * draw} strokeWidth={2} strokeDasharray="10 26" strokeDashoffset={-t * 120} />
            </g>
          );
        })}
        {VECS.map((v, i) => {
          if (t < v.at + 0.8) return null;
          return [0, 0.5].map((off, j) => {
            const u = mod((t - v.at) * 0.42 + off, 1);
            const x = cb(v.p, u, 0);
            const y = cb(v.p, u, 1);
            const u2 = Math.min(1, u + 0.01);
            const ang = (Math.atan2(cb(v.p, u2, 1) - y, cb(v.p, u2, 0) - x) * 180) / Math.PI;
            const o = smooth(0, 0.08, u) * (1 - smooth(0.9, 1, u));
            return (
              <g key={`${i}-${j}`} transform={`translate(${x} ${y}) rotate(${ang})`} opacity={o}>
                <circle r={26} fill={C.amber} opacity={0.18} />
                <path d="M18,0 L-10,-14 L-4,0 L-10,14 Z" fill={C.amber} />
              </g>
            );
          });
        })}
      </svg>
      {/* waypoint nodes + cards */}
      {VECS.map((v, i) => {
        const pop = sp(f, v.at + 0.55, { damping: 12, stiffness: 200, mass: 0.6 });
        const pulse = 0.5 + 0.5 * Math.sin(t * 4 + i);
        return (
          <React.Fragment key={i}>
            <div style={{ position: "absolute", left: v.card - 26, top: 660 - 26, width: 52, height: 52, transform: `rotate(45deg) scale(${pop})`, border: `4px solid ${C.cyan}`, background: C.bg, boxShadow: `0 0 ${20 + 20 * pulse}px ${C.cyan}` }} />
            <div
              style={{
                position: "absolute",
                left: v.card - 150,
                top: 340,
                width: 300,
                height: 250,
                borderRadius: 20,
                border: `3px solid ${C.cyan}`,
                background: "rgba(15,23,42,0.88)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                opacity: clamp01(pop * 2),
                transform: `translateY(${(1 - pop) * 40}px)`,
                boxShadow: "0 18px 40px rgba(0,0,0,0.5)",
              }}
            >
              <div style={{ fontFamily: MONO, fontSize: 20, letterSpacing: 4, color: C.cyanDim }}>VECTOR 0{i + 1}</div>
              {v.label.map((l) => (
                <div key={l} style={{ fontFamily: SANS, fontWeight: 900, fontSize: 44, lineHeight: 1.08, color: C.white }}>
                  {l}
                </div>
              ))}
              <div style={{ marginTop: 8, fontFamily: MONO, fontSize: 22, color: C.amber }}>{v.status}</div>
            </div>
          </React.Fragment>
        );
      })}
      {/* 15 min timer on vector 3 */}
      <div style={{ position: "absolute", left: 760, top: 760, width: 240, display: "flex", flexDirection: "column", alignItems: "center", opacity: clamp01(timerIn * 2), transform: `scale(${0.6 + 0.4 * timerIn})` }}>
        <div style={{ width: 150, height: 150, borderRadius: "50%", background: `conic-gradient(${C.amber} 0deg ${cycle * 360}deg, rgba(245,158,11,0.15) ${cycle * 360}deg 360deg)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ width: 120, height: 120, borderRadius: "50%", background: C.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <div style={{ fontFamily: SANS, fontWeight: 900, fontSize: 48, lineHeight: 1, color: C.amber }}>15</div>
            <div style={{ fontFamily: MONO, fontSize: 20, color: C.amber }}>МИН</div>
          </div>
        </div>
        <div style={{ marginTop: 8, fontFamily: MONO, fontSize: 20, letterSpacing: 3, color: C.amber }}>КАЖДЫЕ 15 МИН</div>
      </div>
      {/* hub */}
      <div style={{ position: "absolute", left: HUB.x - 160, top: HUB.y - 160, opacity: clamp01(hubIn * 2), transform: `scale(${0.7 + 0.3 * hubIn})` }}>
        <RadarDisc t={t} size={320} blips={6} labels={false} glow={0.5} />
        <div style={{ position: "absolute", left: 0, right: 0, top: 340, textAlign: "center", fontFamily: MONO, fontWeight: 700, fontSize: 28, letterSpacing: 5, color: C.cyan }}>ИИ-ЯДРО</div>
      </div>
    </AbsoluteFill>
  );
};

// Scene 5 — hands vs course
const Scene5: React.FC<{ t: number; f: number }> = ({ t, f }) => {
  const l1 = sp(f, 31.8);
  const strike = ease01(32.5, 32.95, t, EXPO_OUT);
  const l2 = sp(f, 33.2, { damping: 12, stiffness: 170, mass: 0.7 });
  const dialIn = sp(f, 32.0);
  const hdg = lerp(205, 270, ease01(33.2, 35.0, t, EXPO_OUT)) + Math.sin(t * 1.3) * 1.5;
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: 0, right: 0, top: 170, textAlign: "center", opacity: clamp01(l1 * 2), transform: `translateY(${(1 - l1) * 30}px)` }}>
        <div style={{ fontFamily: SANS, fontWeight: 900, fontSize: 90, letterSpacing: -2, color: C.white, opacity: 1 - 0.55 * strike, lineHeight: 1.04 }}>
          НЕ РАБОТАЕШЬ
          <br />
          РУКАМИ
        </div>
        <Strike k={strike} width={720} top={52} />
        <Strike k={ease01(32.7, 33.1, t, EXPO_OUT)} width={420} top={146} />
      </div>
      {/* heading indicator */}
      <div style={{ position: "absolute", left: 540 - 330, top: 520, width: 660, height: 660, opacity: clamp01(dialIn * 2), transform: `scale(${0.8 + 0.2 * dialIn})` }}>
        <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: `4px solid ${C.cyan}`, background: "radial-gradient(circle, rgba(6,182,212,0.12), rgba(15,23,42,0.9) 70%)", boxShadow: "0 0 60px rgba(6,182,212,0.3)" }} />
        <div style={{ position: "absolute", inset: 0, transform: `rotate(${-hdg}deg)` }}>
          {Array.from({ length: 72 }).map((_, i) => (
            <div key={i} style={{ position: "absolute", left: 328, top: 10, width: 4, height: i % 6 === 0 ? 40 : 20, background: i % 6 === 0 ? C.white : C.cyanDim, transformOrigin: "2px 320px", transform: `rotate(${i * 5}deg)` }} />
          ))}
          {Array.from({ length: 12 }).map((_, i) => {
            const deg = i * 30;
            const lab = ["N", "3", "6", "E", "12", "15", "S", "21", "24", "W", "30", "33"][mod(i, 12)];
            return (
              <div key={i} style={{ position: "absolute", left: 330 - 40, top: 0, width: 80, height: 330, transformOrigin: "40px 330px", transform: `rotate(${deg}deg)` }}>
                <div style={{ marginTop: 60, textAlign: "center", fontFamily: SANS, fontWeight: 800, fontSize: i % 3 === 0 ? 46 : 34, color: i % 3 === 0 ? C.cyan : C.white }}>{lab}</div>
              </div>
            );
          })}
        </div>
        {/* lubber line + aircraft */}
        <div style={{ position: "absolute", left: 324, top: -20, width: 0, height: 0, borderLeft: "16px solid transparent", borderRight: "16px solid transparent", borderTop: `30px solid ${C.amber}` }} />
        <svg width={660} height={660} style={{ position: "absolute", inset: 0 }}>
          <path d="M330,220 L345,300 L440,350 L440,370 L345,350 L340,420 L370,445 L370,460 L330,450 L290,460 L290,445 L320,420 L315,350 L220,370 L220,350 L315,300 Z" fill={C.amber} />
        </svg>
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 1210, textAlign: "center", fontFamily: MONO, fontWeight: 700, fontSize: 34, letterSpacing: 6, color: C.cyan, opacity: clamp01(dialIn * 2) }}>
        HDG {String(Math.round(mod(hdg, 360))).padStart(3, "0")}° · ON COURSE
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 1310, textAlign: "center", opacity: clamp01(l2 * 2), transform: `scale(${0.75 + 0.25 * l2})` }}>
        <div style={{ fontFamily: SANS, fontWeight: 900, fontSize: 96, letterSpacing: -2, lineHeight: 1.04, color: C.cyan, textShadow: "0 0 40px rgba(6,182,212,0.55)" }}>
          УПРАВЛЯЕШЬ
          <br />
          КУРСОМ
        </div>
      </div>
    </AbsoluteFill>
  );
};

const Middle: React.FC<{ t: number; f: number }> = ({ t, f }) => {
  const d = smooth(7.5, 9.0, t) * (1 - smooth(34.0, 34.5, t));
  const p = punch(t);
  const s2 = win(t, 7.0, 16.4, 0.01, 0.35);
  const s3 = win(t, 16.2, 23.1, 0.3, 0.35);
  const s4 = win(t, 22.9, 31.7, 0.3, 0.35);
  const s5 = win(t, 31.5, 36.0, 0.3, 0.01);
  const label = t < 16.3 ? "SECTOR 01" : t < 23 ? "MODE · COMPARE" : t < 31.6 ? "MODE · ROUTING" : "MODE · COMMAND";
  return (
    <AbsoluteFill>
      <HudBackground t={t} />
      <AbsoluteFill
        style={{
          transform: `translate(${Math.sin(t * 0.4) * 8 * d}px, ${Math.cos(t * 0.33) * 10 * d}px) rotate(${Math.sin(t * 0.25) * 0.4 * d}deg) scale(${1 + 0.02 * d + p})`,
        }}
      >
        {s2 > 0 && (
          <AbsoluteFill style={{ opacity: s2 }}>
            <RadarHome t={t} f={f} phase="s2" />
          </AbsoluteFill>
        )}
        {s3 > 0 && (
          <AbsoluteFill style={{ opacity: s3 }}>
            <Scene3 t={t} f={f} />
          </AbsoluteFill>
        )}
        {s4 > 0 && (
          <AbsoluteFill style={{ opacity: s4 }}>
            <Scene4 t={t} f={f} />
          </AbsoluteFill>
        )}
        {s5 > 0 && (
          <AbsoluteFill style={{ opacity: s5 }}>
            <Scene5 t={t} f={f} />
          </AbsoluteFill>
        )}
      </AbsoluteFill>
      <HudFrame t={t} label={label} />
    </AbsoluteFill>
  );
};

// -------------------------------------------------------------------------
// Subtitles — dark-cyan pill with 24px gap between words
// -------------------------------------------------------------------------
const GROUPS: number[][] = (() => {
  const g: number[][] = [];
  let cur: number[] = [];
  WORDS.forEach((w, i) => {
    cur.push(i);
    const next = WORDS[i + 1];
    const chars = cur.reduce((n, k) => n + WORDS[k].word.length, 0) + (next ? next.word.length : 0);
    if (cur.length >= 3 || chars > 20 || /[.,?!—]$/.test(w.word) || !next || next.start - w.end > 0.3) {
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
    <div style={{ position: "absolute", left: 0, right: 0, top: 1720, display: "flex", justifyContent: "center", opacity: fadeOut * clamp01(pop * 2) }}>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          columnGap: 24,
          rowGap: 8,
          maxWidth: 1000,
          padding: "18px 44px",
          borderRadius: 48,
          background: "rgba(8,51,68,0.9)",
          border: `2px solid ${C.cyanDim}`,
          boxShadow: "0 20px 50px rgba(0,0,0,0.6), 0 0 30px rgba(6,182,212,0.18)",
          transform: `scale(${0.85 + 0.15 * pop})`,
        }}
      >
        {g.map((wi) => {
          const w = WORDS[mod(wi, WORDS.length)];
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
                color: active ? C.amber : said ? C.white : "rgba(248,250,252,0.38)",
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
export const FlightRadarReel: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = f / fps;
  const cam = getCamera(t);
  const showTower = t < 7.6 || t > 34.4;
  const ending = t > 20;
  const glow = ending ? smooth(35.2, 37.0, t) : 0;
  const middleO = win(t, 7.25, 34.9, 0.3, 0.4);
  const endPunch = ending ? punch(t) : 0;
  return (
    <AbsoluteFill style={{ background: C.bg, overflow: "hidden" }}>
      <Audio src={staticFile("flight_radar_reel/voice.mp3")} />
      {showTower && (
        <AbsoluteFill style={{ transform: `${zoomTransform(cam.zoom)} scale(${1 + endPunch})`, transformOrigin: `${SCREEN.cx}px ${SCREEN.cy}px` }}>
          <TowerWorld t={t} f={f} cam={cam} glow={glow} mode={ending ? "online" : "hook"} />
        </AbsoluteFill>
      )}
      {showTower && <Bokeh t={t} amount={ending ? smooth(36.0, 37.0, t) : 1 - smooth(5.6, 6.6, t)} />}
      {t < 6.2 && <HookOverlay t={t} f={f} />}
      {middleO > 0 && (
        <AbsoluteFill style={{ opacity: middleO }}>
          <Middle t={t} f={f} />
        </AbsoluteFill>
      )}
      {t > 35.5 && <EndOverlay t={t} f={f} />}
      {/* vignette */}
      <AbsoluteFill style={{ background: "radial-gradient(120% 85% at 50% 50%, transparent 55%, rgba(0,0,0,0.6) 100%)", pointerEvents: "none" }} />
      <Subtitles f={f} t={t} />
    </AbsoluteFill>
  );
};
