import React from "react";
import {
  AbsoluteFill,
  Audio,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { HumanCharacter, HumanPose } from "./HumanCharacter";
import wordsData from "../public/horror_words.json";

export const HorrorMovie: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const curSec = frame / fps;

  // --- Story-Driven Scene Switching (Matches Script Exact Content) ---
  // 0.0 - 5.5s: "3:07 ночи. В глазке ты сам." -> Profile at the door looking in peephole
  // 5.5 - 9.5s: "POV глазка: двойник снаружи" -> POV Fisheye
  // 9.5 - 19.0s: "Скрипит пол. Голос мамы..." -> Turning back to dark hallway / Mom silhouette
  // 19.0 - 38.0s: "Холодные пальцы касаются плеча. Отсчет 5..4..3.." -> Closeup hand on shoulder
  // 38.0 - 56.0s: "Вариант А / Вариант Б. Пиши в комментах" -> Two choice doors

  let currentPose: HumanPose = "looking_peephole";
  if (curSec < 5.5) {
    currentPose = "looking_peephole";
  } else if (curSec < 10.0) {
    currentPose = "pov_door";
  } else if (curSec < 20.0) {
    currentPose = "turning_back";
  } else if (curSec < 38.0) {
    currentPose = "shock_hand_shoulder";
  } else {
    currentPose = "choice_pointing";
  }

  // --- Precise Word Match from Faster-Whisper ---
  const activeWordObj = wordsData.find((w: any) => curSec >= w.start && curSec < w.end);
  const activeWordIdx = wordsData.findIndex((w: any) => curSec >= w.start && curSec < w.end);

  // Dynamic Camera Movement
  const isCountdown = curSec >= 24.0 && curSec < 38.0;
  const shakeIntensity = isCountdown ? 10 : curSec < 2.0 ? 6 : 0;
  const camShake = Math.sin(frame * 0.9) * shakeIntensity;

  const camZoom = interpolate(
    curSec,
    [0, 5.5, 10, 20, 38, 56],
    [1.0, 1.15, 1.05, 1.25, 1.0, 1.12],
    { extrapolateRight: "clamp" }
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#050608",
        overflow: "hidden",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <Audio src={staticFile("horror_liam.mp3")} />

      {/* --- LAYER 1: Full Story SVG Scene & Real Human Characters --- */}
      <div
        style={{
          width: "100%",
          height: "100%",
          transform: `scale(${camZoom}) translateY(${camShake}px)`,
          transformOrigin: "center center",
          transition: "transform 0.08s ease",
        }}
      >
        <HumanCharacter pose={currentPose} />
      </div>

      {/* --- LAYER 2: Cold Open Banner (0 - 5.5s) --- */}
      {curSec < 5.5 && (
        <div
          style={{
            position: "absolute",
            top: "8%",
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: "#FF1A1A",
            color: "#FFF",
            padding: "16px 36px",
            borderRadius: "40px",
            fontWeight: 900,
            fontSize: "36px",
            letterSpacing: "2px",
            boxShadow: "0 0 50px rgba(255, 26, 26, 0.9)",
            border: "3px solid #FFF",
            textAlign: "center",
            maxWidth: "92%",
          }}
        >
          🚨 ПРАВИЛО ВЫЖИВАНИЯ 304
        </div>
      )}

      {/* --- LAYER 3: 100% Synced Karaoke Subtitles (From Whisper) --- */}
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
        }}
      >
        {(() => {
          if (activeWordIdx === -1) return null;
          // 4-5 words sliding window
          const start = Math.floor(activeWordIdx / 4) * 4;
          const chunk = wordsData.slice(start, start + 4);

          return chunk.map((w: any, idx: number) => {
            const isActive = activeWordObj && w.word === activeWordObj.word;
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
                  transition: "all 0.05s ease",
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
