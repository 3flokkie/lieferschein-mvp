import React from "react";
import {
  AbsoluteFill,
  Audio,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { HumanPart5, Part5Pose } from "./HumanPart5";
import { Part2FilmOverlay } from "./HumanPart2";
import wordsData from "../public/horror_part5_words.json";

type Word = { word: string; start: number; end: number };
const words = wordsData as Word[];

// Punch-zoom hits on key words (sec)
const PUNCHES = [3.96, 13.68, 19.14, 28.38, 34.6, 39.08, 45.82];
// Scene cuts (sec) for black-dip transitions
const CUTS = [12.0, 23.0, 28.3, 37.0];

export const HorrorPart5Movie: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const curSec = frame / fps;

  // --- Story Stages (52 sec total) ---
  let currentPose: Part5Pose = "icy_ledge";
  if (curSec < 12.0) currentPose = "icy_ledge";
  else if (curSec < 23.0) currentPose = "fire_escape";
  else if (curSec < 37.0) currentPose = "running_phone";
  else currentPose = "silhouettes";

  // Camera shake (time-based so it is identical at any fps)
  const inR = (a: number, b: number) => curSec >= a && curSec < b;
  const shakeIntensity = inR(8.3, 9.6)
    ? 10
    : inR(19.1, 21.3)
    ? 9
    : inR(21.3, 22.0)
    ? 16
    : inR(28.38, 33.4)
    ? 4
    : inR(40.3, 41.2)
    ? 7
    : inR(45.8, 46.6)
    ? 12
    : 2;
  const camShakeX = Math.sin(curSec * 33) * shakeIntensity;
  const camShakeY = Math.cos(curSec * 27) * shakeIntensity;

  // Constant soft drift
  const driftX = Math.sin(curSec * 0.55) * 10;
  const driftY = Math.cos(curSec * 0.42) * 8;

  // Base zoom progression + punch zooms
  const baseZoom = interpolate(
    curSec,
    [0, 6, 12, 12.01, 19, 23, 23.01, 28.3, 28.31, 37, 37.01, 41.6, 47, 52],
    [1.04, 1.12, 1.2, 1.05, 1.12, 1.18, 1.02, 1.1, 1.0, 1.08, 1.12, 1.04, 1.1, 1.16],
    { extrapolateRight: "clamp" }
  );
  const punch = PUNCHES.reduce(
    (acc, p) => acc + interpolate(curSec - p, [0, 0.08, 0.7], [0, 0.1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
    0
  );
  const camZoom = baseZoom + punch;

  // Black dip at scene cuts
  const cutDip = CUTS.reduce(
    (acc, c) => Math.max(acc, interpolate(Math.abs(curSec - c), [0, 0.18], [1, 0], { extrapolateRight: "clamp" })),
    0
  );
  const fadeIn = interpolate(curSec, [0, 0.4], [1, 0], { extrapolateRight: "clamp" });
  const fadeOut = interpolate(curSec, [51.3, 52], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const blackOverlay = Math.max(cutDip, fadeIn, fadeOut);

  const activeWordIdx = words.findIndex((w) => curSec >= w.start && curSec < w.end);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#050608",
        overflow: "hidden",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      {/* 1. Main narration (RU, 51.2s) */}
      <Audio src={staticFile("horror_part5_voice.mp3")} volume={1.0} />

      {/* 2. Ambient bed */}
      <Audio src={staticFile("mix_v2/pure_hum_60s.mp3")} volume={0.65} />
      <Audio src={staticFile("mix_v2/breathing_long_60s.mp3")} volume={0.55} />
      <Audio src={staticFile("mix_v2/heartbeat_panic_60s.mp3")} volume={curSec > 23.0 ? 0.75 : 0.45} />

      {/* 3. Story SFX */}
      <Sequence from={Math.round(fps * 0.3)} durationInFrames={Math.round(fps * 2)}>
        <Audio src={staticFile("sfx/wind_gust.wav")} volume={0.6} />
      </Sequence>
      <Sequence from={Math.round(fps * 8.3)} durationInFrames={Math.round(fps * 1)}>
        <Audio src={staticFile("sfx/cut_hit_punch.wav")} volume={0.6} />
      </Sequence>
      <Sequence from={Math.round(fps * 13.6)} durationInFrames={Math.round(fps * 2)}>
        <Audio src={staticFile("sfx/sub_drop.wav")} volume={0.7} />
      </Sequence>
      <Sequence from={Math.round(fps * 17.08)} durationInFrames={Math.round(fps * 2.5)}>
        <Audio src={staticFile("sfx/impact_metal.wav")} volume={0.75} />
      </Sequence>
      <Sequence from={Math.round(fps * 19.14)} durationInFrames={Math.round(fps * 1)}>
        <Audio src={staticFile("sfx/swish_blade.wav")} volume={0.6} />
      </Sequence>
      <Sequence from={Math.round(fps * 21.3)} durationInFrames={Math.round(fps * 1)}>
        <Audio src={staticFile("sfx/cut_hit_punch.wav")} volume={0.85} />
      </Sequence>
      <Sequence from={Math.round(fps * 34.6)} durationInFrames={Math.round(fps * 2)}>
        <Audio src={staticFile("sfx/sub_drop.wav")} volume={0.85} />
      </Sequence>
      <Sequence from={Math.round(fps * 38.0)} durationInFrames={Math.round(fps * 2)}>
        <Audio src={staticFile("sfx/wind_gust.wav")} volume={0.6} />
      </Sequence>
      <Sequence from={Math.round(fps * 45.8)} durationInFrames={Math.round(fps * 2)}>
        <Audio src={staticFile("sfx/sub_drop.wav")} volume={0.95} />
      </Sequence>

      {/* --- LAYER 1+2: Scene & character under camera --- */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: `scale(${camZoom}) translate(${camShakeX + driftX}px, ${camShakeY + driftY}px)`,
          transformOrigin: "center 45%",
        }}
      >
        <HumanPart5 pose={currentPose} />
      </div>

      {/* --- LAYER 3: Film grain & vignette --- */}
      <Part2FilmOverlay />

      {/* Black dip transitions */}
      <AbsoluteFill style={{ backgroundColor: "#000", opacity: blackOverlay, zIndex: 90 }} />

      {/* --- LAYER 4: Result Banner (0.4 - 4.5s) --- */}
      {curSec < 4.5 && (
        <div
          style={{
            position: "absolute",
            top: "8%",
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: "#EF4444",
            color: "#FFFFFF",
            padding: "16px 36px",
            borderRadius: "40px",
            fontWeight: 900,
            fontSize: "36px",
            letterSpacing: "2px",
            boxShadow: "0 0 50px rgba(239, 68, 68, 0.9)",
            border: "3px solid #FFF",
            textAlign: "center",
            maxWidth: "92%",
            whiteSpace: "nowrap",
            zIndex: 100,
          }}
        >
          🅱️ ВЫ ВЫБРАЛИ «ПОЛЗТИ ПО КАРНИЗУ»
        </div>
      )}

      {/* --- LAYER 5: Choice Prompt (47.0s - 52s) --- */}
      {curSec >= 47.0 && (
        <div
          style={{
            position: "absolute",
            top: "6%",
            left: "50%",
            transform: `translateX(-50%) scale(${interpolate(curSec, [47, 47.25], [0.85, 1], { extrapolateRight: "clamp" })})`,
            width: "90%",
            zIndex: 110,
          }}
        >
          <div
            style={{
              backgroundColor: "rgba(0, 0, 0, 0.85)",
              border: "3px solid #EAB308",
              borderRadius: "24px",
              padding: "20px 24px",
              textAlign: "center",
              boxShadow: "0 0 40px rgba(234, 179, 8, 0.6)",
            }}
          >
            <div style={{ fontSize: "36px", fontWeight: 900, color: "#FACC15", marginBottom: "8px", letterSpacing: "1px" }}>
              ⚠️ КУДА БЕЖАТЬ? ПИШИ В КОММЕНТАХ:
            </div>
            <div style={{ fontSize: "28px", fontWeight: 700, color: "#FFF", lineHeight: "1.3" }}>
              🅰️ Обратно в подъезд
              <br />
              🅱️ Через забор в соседний двор
            </div>
          </div>
        </div>
      )}

      {/* --- LAYER 6: Word-by-word karaoke subtitles --- */}
      <div
        style={{
          position: "absolute",
          bottom: "8%",
          width: "100%",
          display: "flex",
          justifyContent: "center",
          flexWrap: "wrap",
          gap: "14px",
          padding: "0 40px",
          boxSizing: "border-box",
          zIndex: 100,
        }}
      >
        {(() => {
          if (activeWordIdx === -1) return null;
          const start = Math.floor(activeWordIdx / 4) * 4;
          const chunk = words.slice(start, start + 4);
          return chunk.map((w, idx) => {
            const isActive = start + idx === activeWordIdx;
            return (
              <span
                key={idx}
                style={{
                  fontSize: isActive ? "56px" : "42px",
                  fontWeight: 900,
                  color: isActive ? "#FFE600" : "#E2E8F0",
                  textShadow: isActive
                    ? "0 0 30px rgba(255, 230, 0, 0.95), 0 4px 12px rgba(0,0,0,0.95)"
                    : "0 4px 10px rgba(0,0,0,0.95)",
                  transform: isActive ? "scale(1.2)" : "scale(1.0)",
                  display: "inline-block",
                }}
              >
                {w.word}
              </span>
            );
          });
        })()}
      </div>
    </AbsoluteFill>
  );
};
