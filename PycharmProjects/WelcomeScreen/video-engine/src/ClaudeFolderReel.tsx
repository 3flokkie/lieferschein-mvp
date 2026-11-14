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
 * CLAUDE FOLDER REEL — 1080x1920 @ 60 FPS, 1650 FRAMES (27.5s)
 *
 *   0.0 – 4.5s   : Hook title + 3D tilted macOS terminal typing a command
 *   4.5 – 10.0s  : 3D folder `studio/` opens, gold rule-file tabs rise out
 *  10.0 – 18.0s  : VOICE waveform + WORDS marker tracks with glowing scanline
 *  18.0 – 23.5s  : 60 FPS render counter + code blocks snapping into place
 *  23.5 – 27.5s  : Zoom-out to "ОДНА ПАПКА. СВОЯ СТУДИЯ."
 *
 * Camera beats every ~1.8s (spring punch zoom + alternating tilt).
 * Subtitles: 23 chunks from /tmp/claude_reel/subs.json, hardcoded below.
 * =========================================================================
 */

const FPS = 60;

const C = {
  bg: "#07080d",
  amber: "#f59e0b",
  gold: "#fbbf24",
  goldSoft: "rgba(251,191,36,0.18)",
  white: "#f8fafc",
  blue: "#60a5fa",
  blueDeep: "#3b82f6",
  muted: "#64748b",
  panel: "rgba(16,18,28,0.92)",
  border: "rgba(251,191,36,0.35)",
};

const SANS =
  "'Inter', 'SF Pro Display', -apple-system, 'Helvetica Neue', Arial, sans-serif";
const SERIF = "'Playfair Display', 'Georgia', 'Times New Roman', serif";
const MONO = "'JetBrains Mono', 'SF Mono', Menlo, Consolas, monospace";

type Sub = { start: number; end: number; text: string };

const SUBS: Sub[] = [
  { start: 0.0, end: 0.76, text: "Claude больше не" },
  { start: 0.8, end: 1.6, text: "просто чат в" },
  { start: 1.65, end: 3.17, text: "браузере. Теперь он" },
  { start: 3.22, end: 3.89, text: "живёт прямо в" },
  { start: 3.94, end: 5.14, text: "твоём терминале и" },
  { start: 5.26, end: 7.07, text: "управляет всем компьютером." },
  { start: 7.4, end: 7.91, text: "Секрет не в" },
  { start: 7.94, end: 9.71, text: "сложных промптах. Секрет" },
  { start: 9.75, end: 10.46, text: "в одной папке" },
  { start: 10.49, end: 11.52, text: "с правилами. Ты" },
  { start: 11.55, end: 12.39, text: "кладёшь туда три" },
  { start: 12.45, end: 13.57, text: "файла: как двигается" },
  { start: 13.65, end: 15.05, text: "камера, как ложится" },
  { start: 15.12, end: 15.94, text: "голос и как" },
  { start: 16.02, end: 17.21, text: "цеплять зрителя с" },
  { start: 17.26, end: 18.6, text: "первой секунды. И" },
  { start: 18.68, end: 19.59, text: "Claude сам пишет" },
  { start: 19.64, end: 21.06, text: "код, рендерит видео" },
  { start: 21.08, end: 22.06, text: "в 60 FPS" },
  { start: 22.14, end: 23.07, text: "и собирает готовый" },
  { start: 23.1, end: 24.78, text: "ролик. Одна папка." },
  { start: 25.16, end: 25.52, text: "И у тебя" },
  { start: 25.55, end: 27.07, text: "своя автономная студия." },
];

// Scene boundaries (frames)
const S1 = [0, 270];
const S2 = [270, 600];
const S3 = [600, 1080];
const S4 = [1080, 1410];
const S5 = [1410, 1650];

const sec = (s: number) => Math.round(s * FPS);

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** Opacity envelope for a scene with soft in/out fades. */
const sceneOpacity = (f: number, [a, b]: number[], fadeIn = 14, fadeOut = 14) => {
  if (f < a - fadeIn || f >= b) return 0;
  const fin = fadeIn > 0 ? interpolate(f, [a - fadeIn, a], [0, 1], clamp) : 1;
  const fout = fadeOut > 0 ? interpolate(f, [b - fadeOut, b], [1, 0], clamp) : 1;
  return Math.min(fin, fout);
};

/** Deterministic pseudo random 0..1 */
const rand = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

// -------------------------------------------------------------------------
// Camera: punch beats every ~1.8s, alternating tilt, constant drift
// -------------------------------------------------------------------------
const BEATS = Array.from({ length: 15 }, (_, i) => Math.round(i * 1.8 * FPS) + 20);

const useCamera = (f: number, fps: number) => {
  let zoom = 1;
  let tiltX = 0;
  let tiltY = 0;
  BEATS.forEach((b, i) => {
    if (f < b) return;
    const s = spring({ frame: f - b, fps, config: { damping: 14, stiffness: 180, mass: 0.6 } });
    const decay = interpolate(f - b, [0, 70], [1, 0], clamp);
    const pulse = s * decay;
    zoom += 0.045 * pulse;
    const dir = i % 2 === 0 ? 1 : -1;
    tiltY += dir * 4 * pulse;
    tiltX += (i % 3 === 0 ? -2.5 : 2) * pulse;
  });
  const t = f / fps;
  tiltX += Math.sin(t * 0.7) * 1.6;
  tiltY += Math.cos(t * 0.5) * 2.2;
  const dx = Math.sin(t * 0.43) * 10;
  const dy = Math.cos(t * 0.37) * 8;
  return { zoom, tiltX, tiltY, dx, dy };
};

// -------------------------------------------------------------------------
// Background
// -------------------------------------------------------------------------
const Background: React.FC<{ f: number }> = ({ f }) => {
  const t = f / FPS;
  const gx = 540 + Math.sin(t * 0.4) * 120;
  const gy = 760 + Math.cos(t * 0.3) * 90;
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at ${gx}px ${gy}px, rgba(245,158,11,0.16) 0%, rgba(245,158,11,0.04) 32%, transparent 60%)`,
        }}
      />
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(circle at 80% 15%, rgba(96,165,250,0.10) 0%, transparent 40%)",
        }}
      />
      {/* Perspective grid floor */}
      <div
        style={{
          position: "absolute",
          left: -600,
          right: -600,
          top: 1100,
          height: 1400,
          transform: "perspective(900px) rotateX(72deg)",
          transformOrigin: "top center",
          backgroundImage:
            "linear-gradient(rgba(251,191,36,0.10) 2px, transparent 2px), linear-gradient(90deg, rgba(251,191,36,0.10) 2px, transparent 2px)",
          backgroundSize: "90px 90px",
          backgroundPosition: `0px ${(f * 1.5) % 90}px`,
          maskImage: "linear-gradient(to bottom, rgba(0,0,0,0.9), transparent 75%)",
          WebkitMaskImage: "linear-gradient(to bottom, rgba(0,0,0,0.9), transparent 75%)",
        }}
      />
      {/* Floating dust (bokeh) */}
      {Array.from({ length: 26 }).map((_, i) => {
        const x = rand(i) * 1080;
        const baseY = rand(i + 50) * 1920;
        const y = (baseY - f * (0.3 + rand(i + 9) * 0.6) + 1920 * 4) % 1920;
        const size = 4 + rand(i + 3) * 14;
        const blur = rand(i + 7) * 6;
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
              background: i % 4 === 0 ? C.blue : C.gold,
              opacity: 0.12 + rand(i + 11) * 0.25,
              filter: `blur(${blur}px)`,
            }}
          />
        );
      })}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,0.75) 100%)",
        }}
      />
    </AbsoluteFill>
  );
};

// -------------------------------------------------------------------------
// Scene 1 — Hook title + terminal
// -------------------------------------------------------------------------
const CMD = 'claude -p "render 60fps"';

const Scene1: React.FC<{ f: number; fps: number }> = ({ f, fps }) => {
  const op = sceneOpacity(f, S1, 0, 18);
  if (op <= 0) return null;

  const titleIn = spring({ frame: f - 2, fps, config: { damping: 12, stiffness: 160 } });
  const lineIn = spring({ frame: f - 16, fps, config: { damping: 13, stiffness: 150 } });
  const boxW = interpolate(f, [22, 52], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });

  const termIn = spring({ frame: f - 10, fps, config: { damping: 15, stiffness: 110, mass: 0.9 } });
  const typed = Math.floor(interpolate(f, [40, 40 + CMD.length * 4], [0, CMD.length], clamp));
  const cursorOn = Math.floor(f / 18) % 2 === 0;
  const outStart = 40 + CMD.length * 4 + 12;
  const outLines = [
    { t: "✓ reading studio/motion-rules.md", c: C.gold },
    { t: "✓ reading studio/voice-timing.md", c: C.gold },
    { t: "✓ reading studio/hook-rules.md", c: C.gold },
    { t: "▸ rendering 1650 frames @ 60fps…", c: C.blue },
  ];

  const tiltY = interpolate(termIn, [0, 1], [-38, -16]);
  const tiltX = 14 + Math.sin(f / 40) * 2;

  return (
    <AbsoluteFill style={{ opacity: op }}>
      {/* Title */}
      <div
        style={{
          position: "absolute",
          top: 230,
          width: "100%",
          textAlign: "center",
          fontFamily: SANS,
        }}
      >
        <div
          style={{
            fontSize: 150,
            fontWeight: 900,
            color: C.white,
            letterSpacing: -4,
            transform: `translateY(${(1 - titleIn) * 60}px) scale(${0.8 + titleIn * 0.2})`,
            opacity: titleIn,
            textShadow: "0 0 40px rgba(251,191,36,0.35)",
          }}
        >
          Claude
        </div>
        <div
          style={{
            position: "relative",
            display: "inline-block",
            marginTop: 10,
            padding: "6px 26px 14px",
            transform: `translateY(${(1 - lineIn) * 40}px)`,
            opacity: lineIn,
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              bottom: 0,
              width: `${boxW * 100}%`,
              background: C.goldSoft,
              border: `3px solid ${C.gold}`,
              borderRadius: 10,
              boxShadow: `0 0 40px rgba(245,158,11,0.55), inset 0 0 30px rgba(245,158,11,0.25)`,
            }}
          />
          {/* selection handles */}
          {boxW > 0.98 &&
            [
              { l: -9, t: -9 },
              { r: -9, t: -9 },
              { l: -9, b: -9 },
              { r: -9, b: -9 },
            ].map((p, i) => (
              <div
                key={i}
                style={{
                  position: "absolute",
                  width: 16,
                  height: 16,
                  background: C.gold,
                  borderRadius: 3,
                  left: p.l,
                  right: p.r,
                  top: p.t,
                  bottom: p.b,
                }}
              />
            ))}
          <span
            style={{
              position: "relative",
              fontFamily: SERIF,
              fontStyle: "italic",
              fontSize: 92,
              color: C.gold,
              textShadow: "0 0 24px rgba(251,191,36,0.6)",
            }}
          >
            в твоём терминале.
          </span>
        </div>
      </div>

      {/* Terminal */}
      <div
        style={{
          position: "absolute",
          left: 90,
          top: 760,
          width: 900,
          perspective: 1600,
        }}
      >
        <div
          style={{
            transform: `translateY(${(1 - termIn) * 300}px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) rotateZ(-2deg)`,
            transformStyle: "preserve-3d",
            opacity: termIn,
            borderRadius: 22,
            background: C.panel,
            border: `2px solid ${C.border}`,
            boxShadow:
              "0 60px 120px rgba(0,0,0,0.7), 0 0 60px rgba(245,158,11,0.25), inset 0 1px 0 rgba(255,255,255,0.08)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: 62,
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
            <div
              style={{
                flex: 1,
                textAlign: "center",
                fontFamily: SANS,
                fontSize: 24,
                color: C.muted,
                marginRight: 80,
              }}
            >
              ~/studio — zsh
            </div>
          </div>
          <div style={{ padding: "34px 36px 44px", fontFamily: MONO, fontSize: 36, lineHeight: 1.55 }}>
            <div style={{ color: C.white }}>
              <span style={{ color: C.gold }}>➜ </span>
              <span style={{ color: C.blue }}>studio </span>
              {CMD.slice(0, typed)}
              {typed < CMD.length || f < outStart ? (
                <span style={{ opacity: cursorOn ? 1 : 0, color: C.gold }}>▋</span>
              ) : null}
            </div>
            {outLines.map((l, i) => {
              const s = outStart + i * 14;
              const o = interpolate(f, [s, s + 8], [0, 1], clamp);
              return (
                <div
                  key={i}
                  style={{
                    color: l.c,
                    fontSize: 30,
                    opacity: o,
                    transform: `translateX(${(1 - o) * -30}px)`,
                  }}
                >
                  {l.t}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// -------------------------------------------------------------------------
// Folder (shared by scene 2 & 3)
// -------------------------------------------------------------------------
const FILES = ["motion-rules.md", "voice-timing.md", "hook-rules.md"];

const Folder: React.FC<{ f: number; fps: number; start: number; scale?: number }> = ({
  f,
  fps,
  start,
  scale = 1,
}) => {
  const lf = f - start;
  const appear = spring({ frame: lf, fps, config: { damping: 14, stiffness: 120 } });
  const open = spring({ frame: lf - 40, fps, config: { damping: 11, stiffness: 90, mass: 1.1 } });
  const lidAngle = interpolate(open, [0, 1], [0, -58]);
  const rotY = interpolate(appear, [0, 1], [50, -14]) + Math.sin(f / 50) * 4;

  return (
    <div style={{ perspective: 1800, width: 760, height: 620, transform: `scale(${scale})` }}>
      <div
        style={{
          position: "relative",
          width: 760,
          height: 620,
          transformStyle: "preserve-3d",
          transform: `rotateX(18deg) rotateY(${rotY}deg) scale(${0.6 + appear * 0.4})`,
          opacity: appear,
        }}
      >
        {/* Back panel + tab */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 60,
            width: 760,
            height: 560,
            borderRadius: 26,
            background: "linear-gradient(160deg, #3a2a0b 0%, #1c1406 100%)",
            border: `2px solid ${C.border}`,
            boxShadow: "0 80px 140px rgba(0,0,0,0.75), 0 0 80px rgba(245,158,11,0.25)",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 20,
            width: 280,
            height: 70,
            borderRadius: "22px 22px 0 0",
            background: "#3a2a0b",
            border: `2px solid ${C.border}`,
            borderBottom: "none",
          }}
        />
        {/* Files rising */}
        {FILES.map((name, i) => {
          const fs = spring({
            frame: lf - 70 - i * 16,
            fps,
            config: { damping: 12, stiffness: 140 },
          });
          const glow = 0.5 + 0.5 * Math.sin((f + i * 20) / 14);
          return (
            <div
              key={name}
              style={{
                position: "absolute",
                left: 70 + i * 22,
                top: 120 - fs * (230 - i * 70),
                width: 620 - i * 44,
                height: 360,
                borderRadius: 18,
                background: "linear-gradient(180deg, #fffaf0 0%, #f3e6c4 100%)",
                transform: `translateZ(${10 + i * 14}px) rotateZ(${(i - 1) * 2.5 * fs}deg)`,
                boxShadow: `0 20px 40px rgba(0,0,0,0.45), 0 0 ${20 + glow * 30}px rgba(251,191,36,${0.35 + glow * 0.3})`,
                border: `3px solid ${C.gold}`,
                opacity: fs,
                padding: "22px 28px",
                boxSizing: "border-box",
              }}
            >
              <div
                style={{
                  display: "inline-block",
                  fontFamily: MONO,
                  fontSize: 32,
                  fontWeight: 700,
                  color: "#1a1206",
                  background: C.gold,
                  padding: "6px 18px",
                  borderRadius: 10,
                }}
              >
                {name}
              </div>
              {[0.9, 0.7, 0.8].map((w, k) => (
                <div
                  key={k}
                  style={{
                    marginTop: 18,
                    height: 12,
                    width: `${w * 100}%`,
                    borderRadius: 6,
                    background: "rgba(26,18,6,0.18)",
                  }}
                />
              ))}
            </div>
          );
        })}
        {/* Front panel (lid) */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 180,
            width: 760,
            height: 440,
            borderRadius: 26,
            transformOrigin: "bottom center",
            transform: `translateZ(80px) rotateX(${lidAngle}deg)`,
            background: "linear-gradient(170deg, #f59e0b 0%, #b45309 100%)",
            border: `2px solid ${C.gold}`,
            boxShadow: "0 -10px 50px rgba(245,158,11,0.35), inset 0 2px 0 rgba(255,255,255,0.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              fontFamily: MONO,
              fontSize: 76,
              fontWeight: 800,
              color: "#1a1206",
              letterSpacing: -1,
            }}
          >
            studio/
          </div>
        </div>
      </div>
    </div>
  );
};

const Scene2: React.FC<{ f: number; fps: number }> = ({ f, fps }) => {
  const op = sceneOpacity(f, S2, 12, 0);
  if (op <= 0 || f >= S2[1]) return null;
  const headIn = spring({ frame: f - S2[0] - 150, fps, config: { damping: 13, stiffness: 150 } });
  return (
    <AbsoluteFill style={{ opacity: op }}>
      <div
        style={{
          position: "absolute",
          top: 210,
          width: "100%",
          textAlign: "center",
          fontFamily: SANS,
          fontSize: 82,
          fontWeight: 900,
          color: C.white,
          letterSpacing: -2,
          opacity: headIn,
          transform: `translateY(${(1 - headIn) * 50}px)`,
        }}
      >
        НЕ ПРОМПТ.{" "}
        <span style={{ color: C.gold, textShadow: "0 0 30px rgba(251,191,36,0.6)" }}>ПАПКА.</span>
      </div>
      <div style={{ position: "absolute", left: 160, top: 560 }}>
        <Folder f={f} fps={fps} start={S2[0]} />
      </div>
    </AbsoluteFill>
  );
};

// -------------------------------------------------------------------------
// Scene 3 — Folder + VOICE / WORDS tracks with scanline
// -------------------------------------------------------------------------
const BAR_COUNT = 64;
const TRACK_X = 90;
const TRACK_W = 900;
const WIN_START = sec(10);
const WIN_END = sec(18);

const Scene3: React.FC<{ f: number; fps: number }> = ({ f, fps }) => {
  const op = sceneOpacity(f, S3, 0, 16);
  if (op <= 0 || f < S3[0]) return null;
  const lf = f - S3[0];
  const tracksIn = spring({ frame: lf - 6, fps, config: { damping: 14, stiffness: 130 } });
  const progress = interpolate(f, [WIN_START, WIN_END], [0, 1], clamp);
  const scanX = TRACK_X + progress * TRACK_W;
  const nowSec = f / fps;
  const voiceActive = SUBS.some((s) => nowSec >= s.start && nowSec <= s.end);

  const wordsInWindow = SUBS.filter((s) => s.start >= 9.6 && s.start <= 18.2);

  return (
    <AbsoluteFill style={{ opacity: op }}>
      {/* Folder, shrunk and lifted */}
      <div style={{ position: "absolute", left: 160, top: 200 }}>
        <Folder f={f} fps={fps} start={S2[0]} scale={0.82} />
      </div>

      {/* Tracks panel */}
      <div
        style={{
          position: "absolute",
          left: 60,
          top: 930,
          width: 960,
          height: 520,
          borderRadius: 26,
          background: "rgba(12,14,22,0.88)",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 40px 100px rgba(0,0,0,0.6), 0 0 50px rgba(245,158,11,0.12)",
          transform: `perspective(1400px) rotateX(${interpolate(tracksIn, [0, 1], [40, 10])}deg) translateY(${(1 - tracksIn) * 200}px)`,
          opacity: tracksIn,
          overflow: "hidden",
        }}
      >
        {/* time ruler */}
        <div style={{ position: "absolute", left: TRACK_X - 60, top: 24, width: TRACK_W, height: 30 }}>
          {Array.from({ length: 9 }).map((_, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                left: (i / 8) * TRACK_W,
                fontFamily: MONO,
                fontSize: 20,
                color: C.muted,
                transform: "translateX(-50%)",
              }}
            >
              {`0:${String(10 + i).padStart(2, "0")}`}
            </div>
          ))}
        </div>

        {/* VOICE track */}
        <div style={{ position: "absolute", left: 30, top: 80, fontFamily: MONO, fontSize: 22, color: C.gold, fontWeight: 700 }}>
          VOICE
        </div>
        <div style={{ position: "absolute", left: TRACK_X - 60, top: 120, width: TRACK_W, height: 190 }}>
          {Array.from({ length: BAR_COUNT }).map((_, i) => {
            const bx = (i / BAR_COUNT) * TRACK_W;
            const passed = bx <= scanX - (TRACK_X - 60);
            const base = 0.25 + rand(i + 3) * 0.75;
            const near = Math.abs(bx - (scanX - (TRACK_X - 60))) < 40;
            const live = near && voiceActive ? 1 + 0.4 * Math.sin(f / 2 + i) : 1;
            const h = base * 170 * live;
            const reveal = interpolate(lf, [i * 0.6, i * 0.6 + 12], [0, 1], clamp);
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: bx,
                  top: 95 - (h * reveal) / 2,
                  width: TRACK_W / BAR_COUNT - 4,
                  height: h * reveal,
                  borderRadius: 4,
                  background: passed
                    ? `linear-gradient(180deg, ${C.gold}, ${C.amber})`
                    : "rgba(251,191,36,0.22)",
                  boxShadow: passed ? "0 0 12px rgba(251,191,36,0.55)" : "none",
                }}
              />
            );
          })}
        </div>

        {/* WORDS track */}
        <div style={{ position: "absolute", left: 30, top: 340, fontFamily: MONO, fontSize: 22, color: C.blue, fontWeight: 700 }}>
          WORDS
        </div>
        <div style={{ position: "absolute", left: TRACK_X - 60, top: 380, width: TRACK_W, height: 110 }}>
          {wordsInWindow.map((w, i) => {
            const x0 = interpolate(w.start, [10, 18], [0, TRACK_W], clamp);
            const x1 = interpolate(w.end, [10, 18], [0, TRACK_W], clamp);
            const active = nowSec >= w.start && nowSec <= w.end;
            const hit = spring({ frame: f - sec(w.start), fps, config: { damping: 10, stiffness: 200 } });
            if (x1 - x0 < 4) return null;
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: x0,
                  top: i % 2 === 0 ? 8 : 58,
                  width: x1 - x0 - 4,
                  height: 42,
                  borderRadius: 8,
                  background: active ? C.blueDeep : "rgba(96,165,250,0.16)",
                  border: `1px solid ${active ? C.white : "rgba(96,165,250,0.4)"}`,
                  boxShadow: active ? `0 0 24px rgba(96,165,250,0.8)` : "none",
                  transform: `scale(${active ? 1 + 0.08 * hit : 1})`,
                  fontFamily: SANS,
                  fontSize: 18,
                  fontWeight: 700,
                  color: C.white,
                  overflow: "hidden",
                  whiteSpace: "nowrap",
                  padding: "10px 8px",
                  boxSizing: "border-box",
                }}
              >
                {w.text}
              </div>
            );
          })}
        </div>

        {/* Scanline */}
        <div
          style={{
            position: "absolute",
            left: scanX,
            top: 60,
            width: 4,
            height: 450,
            background: C.white,
            boxShadow: `0 0 18px ${C.white}, 0 0 40px ${C.gold}, 0 0 80px ${C.amber}`,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: scanX - 14,
            top: 50,
            width: 0,
            height: 0,
            borderLeft: "16px solid transparent",
            borderRight: "16px solid transparent",
            borderTop: `20px solid ${C.gold}`,
          }}
        />
      </div>
    </AbsoluteFill>
  );
};

// -------------------------------------------------------------------------
// Scene 4 — 60 FPS render counter + snapping code blocks
// -------------------------------------------------------------------------
const CODE_BLOCKS = [
  "const cam = spring({ frame, fps: 60 });",
  "<Audio src={staticFile('voice.mp3')} />",
  "zoom = 1 + 0.045 * punch(beat);",
  "subs.map(w => <Karaoke word={w} />)",
  "npx remotion render --fps=60 ✓",
];

const Scene4: React.FC<{ f: number; fps: number }> = ({ f, fps }) => {
  const op = sceneOpacity(f, S4, 14, 16);
  if (op <= 0) return null;
  const lf = f - S4[0];
  const headIn = spring({ frame: lf, fps, config: { damping: 12, stiffness: 170 } });
  // Fast counter: speeds up to the full 1650 frames
  const counter = Math.min(
    1650,
    Math.floor(interpolate(lf, [0, 270], [0, 1650], { ...clamp, easing: Easing.in(Easing.quad) }))
  );
  const pct = counter / 1650;
  const flash = interpolate(lf % 6, [0, 5], [1, 0.75]);

  return (
    <AbsoluteFill style={{ opacity: op }}>
      <div
        style={{
          position: "absolute",
          top: 200,
          width: "100%",
          textAlign: "center",
          fontFamily: SANS,
          transform: `scale(${0.7 + headIn * 0.3})`,
          opacity: headIn,
        }}
      >
        <div
          style={{
            fontSize: 250,
            fontWeight: 900,
            lineHeight: 1,
            color: C.gold,
            letterSpacing: -10,
            textShadow: "0 0 60px rgba(245,158,11,0.7)",
          }}
        >
          60
        </div>
        <div style={{ fontSize: 52, fontWeight: 800, color: C.white, letterSpacing: 6, marginTop: 10 }}>
          FRAMES PER SECOND
        </div>
      </div>

      {/* Counter + progress */}
      <div
        style={{
          position: "absolute",
          top: 640,
          left: 90,
          width: 900,
          fontFamily: MONO,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <span style={{ fontSize: 30, color: C.muted }}>FRAME</span>
          <span style={{ fontSize: 84, fontWeight: 800, color: C.white, opacity: flash }}>
            {String(counter).padStart(4, "0")}
            <span style={{ color: C.muted, fontSize: 40 }}> / 1650</span>
          </span>
        </div>
        <div
          style={{
            marginTop: 14,
            height: 16,
            borderRadius: 8,
            background: "rgba(255,255,255,0.08)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${pct * 100}%`,
              height: "100%",
              background: `linear-gradient(90deg, ${C.amber}, ${C.gold}, ${C.white})`,
              boxShadow: `0 0 20px ${C.gold}`,
            }}
          />
        </div>
      </div>

      {/* Code blocks snapping */}
      <div style={{ position: "absolute", top: 850, left: 90, width: 900, perspective: 1400 }}>
        {CODE_BLOCKS.map((code, i) => {
          const s = spring({
            frame: lf - 20 - i * 26,
            fps,
            config: { damping: 9, stiffness: 260, mass: 0.5 },
          });
          const fromX = (i % 2 === 0 ? -1 : 1) * 700;
          const done = i === CODE_BLOCKS.length - 1;
          return (
            <div
              key={i}
              style={{
                marginBottom: 20,
                padding: "22px 28px",
                borderRadius: 16,
                background: done ? "rgba(245,158,11,0.16)" : "rgba(16,18,28,0.92)",
                border: `2px solid ${done ? C.gold : "rgba(96,165,250,0.35)"}`,
                fontFamily: MONO,
                fontSize: 30,
                color: done ? C.gold : C.white,
                boxShadow: done
                  ? "0 0 40px rgba(245,158,11,0.45)"
                  : "0 20px 40px rgba(0,0,0,0.5)",
                transform: `translateX(${(1 - s) * fromX}px) rotateY(${(1 - s) * (i % 2 ? -40 : 40)}deg)`,
                opacity: interpolate(s, [0, 0.3], [0, 1], clamp),
                whiteSpace: "nowrap",
                overflow: "hidden",
              }}
            >
              <span style={{ color: C.muted, marginRight: 18 }}>{String(i + 1).padStart(2, "0")}</span>
              {code}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// -------------------------------------------------------------------------
// Scene 5 — Zoom-out finale
// -------------------------------------------------------------------------
const Scene5: React.FC<{ f: number; fps: number }> = ({ f, fps }) => {
  const op = sceneOpacity(f, S5, 14, 0);
  if (op <= 0) return null;
  const lf = f - S5[0];
  const zoomOut = interpolate(lf, [0, 240], [1.35, 0.95], {
    ...clamp,
    easing: Easing.out(Easing.cubic),
  });
  const l1 = spring({ frame: lf - 4, fps, config: { damping: 12, stiffness: 160 } });
  const l2 = spring({ frame: f - sec(25.16), fps, config: { damping: 11, stiffness: 170 } });
  const pulse = 0.6 + 0.4 * Math.sin(lf / 10);

  return (
    <AbsoluteFill style={{ opacity: op, transform: `scale(${zoomOut})` }}>
      <div style={{ position: "absolute", left: 160, top: 300, opacity: 0.55, filter: "blur(3px)" }}>
        <Folder f={f} fps={fps} start={S2[0]} scale={0.7} />
      </div>
      <div
        style={{
          position: "absolute",
          top: 780,
          width: "100%",
          textAlign: "center",
          fontFamily: SANS,
          fontWeight: 900,
          letterSpacing: -3,
        }}
      >
        <div
          style={{
            fontSize: 132,
            color: C.white,
            opacity: l1,
            transform: `translateY(${(1 - l1) * 60}px)`,
            textShadow: "0 10px 40px rgba(0,0,0,0.8)",
          }}
        >
          ОДНА ПАПКА.
        </div>
        <div
          style={{
            fontSize: 132,
            color: C.gold,
            opacity: l2,
            transform: `translateY(${(1 - l2) * 60}px) scale(${0.85 + l2 * 0.15})`,
            textShadow: `0 0 ${40 + pulse * 40}px rgba(245,158,11,0.75)`,
          }}
        >
          СВОЯ СТУДИЯ.
        </div>
      </div>
    </AbsoluteFill>
  );
};

// -------------------------------------------------------------------------
// Kinetic subtitles
// -------------------------------------------------------------------------
const Subtitles: React.FC<{ f: number; fps: number }> = ({ f, fps }) => {
  const t = f / fps;
  const idx = SUBS.findIndex((s, i) => {
    const next = SUBS[i + 1];
    const until = next ? Math.min(next.start, s.end + 0.35) : s.end + 0.4;
    return t >= s.start && t < until;
  });
  if (idx < 0) return null;
  const sub = SUBS[idx];
  const lf = f - sec(sub.start);
  const pop = spring({ frame: lf, fps, config: { damping: 11, stiffness: 220, mass: 0.6 } });
  const words = sub.text.split(" ");
  const dur = sub.end - sub.start;

  return (
    <div
      style={{
        position: "absolute",
        bottom: 320,
        left: 60,
        right: 60,
        textAlign: "center",
        transform: `scale(${0.7 + pop * 0.3}) translateY(${(1 - pop) * 30}px)`,
        opacity: interpolate(pop, [0, 0.4], [0, 1], clamp),
      }}
    >
      {words.map((w, i) => {
        const wStart = sub.start + (dur * i) / words.length;
        const on = t >= wStart;
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              margin: "0 12px",
              fontFamily: SANS,
              fontSize: 76,
              fontWeight: 900,
              color: on ? C.white : "rgba(248,250,252,0.45)",
              textShadow: on
                ? "0 0 24px rgba(251,191,36,0.55), 0 6px 18px rgba(0,0,0,0.9)"
                : "0 6px 18px rgba(0,0,0,0.9)",
              WebkitTextStroke: "2px rgba(0,0,0,0.6)",
              paintOrder: "stroke fill",
            }}
          >
            {w}
          </span>
        );
      })}
    </div>
  );
};

// -------------------------------------------------------------------------
// Root composition
// -------------------------------------------------------------------------
export const ClaudeFolderReel: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const cam = useCamera(f, fps);

  return (
    <AbsoluteFill style={{ backgroundColor: C.bg, overflow: "hidden" }}>
      <Audio src={staticFile("claude_reel/voice.mp3")} />
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
        </AbsoluteFill>
      </AbsoluteFill>
      <Subtitles f={f} fps={fps} />
    </AbsoluteFill>
  );
};
