import React from "react";
import {
  AbsoluteFill,
  Audio,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { HumanPart2, Part2Pose, Part2FilmOverlay } from "./HumanPart2";
import wordsData from "../public/horror_part2_words.json";

export const HorrorPart2Movie: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const curSec = frame / fps;

  // --- Story Stages (47.2 sec total) ---
  let currentPose: Part2Pose = "flashlight_reveal";
  if (curSec < 7.5) {
    currentPose = "flashlight_reveal";
  } else if (curSec < 25.0) {
    currentPose = "old_tyoma_face";
  } else if (curSec < 36.0) {
    currentPose = "door_break_shock";
  } else {
    currentPose = "choice_dilemma";
  }

  // --- 100% Exact Word Match via Faster-Whisper ---
  const activeWordObj = wordsData.find((w: any) => curSec >= w.start && curSec < w.end);
  const activeWordIdx = wordsData.findIndex((w: any) => curSec >= w.start && curSec < w.end);

  // Dynamic Camera Motion
  const isDoorBreak = curSec >= 25.0 && curSec < 36.0;
  const shakeIntensity = isDoorBreak ? 12 : curSec < 2.0 ? 5 : 1;
  const camShake = Math.sin(frame * 0.9) * shakeIntensity;

  const camZoom = interpolate(
    curSec,
    [0, 7.5, 12.0, 25.0, 36.0, 47.0],
    [1.0, 1.15, 1.3, 1.05, 1.25, 1.0],
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
      <Audio src={staticFile("horror_part2_liam.mp3")} />

      {/* --- LAYER 1: Full Story Scenes & Realistic Characters --- */}
      <div
        style={{
          width: "100%",
          height: "100%",
          transform: `scale(${camZoom}) translateY(${camShake}px)`,
          transformOrigin: "center center",
          transition: "transform 0.08s ease",
        }}
      >
        <HumanPart2 pose={currentPose} />
      </div>

      {/* --- LAYER 2: Cinematic Film Grain & Vignette Overlay --- */}
      <Part2FilmOverlay />

      {/* --- LAYER 3: Result Banner (0 - 4.5s) --- */}
      {curSec < 4.5 && (
        <div
          style={{
            position: "absolute",
            top: "8%",
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: "#F7C548",
            color: "#000",
            padding: "16px 36px",
            borderRadius: "40px",
            fontWeight: 900,
            fontSize: "36px",
            letterSpacing: "2px",
            boxShadow: "0 0 50px rgba(247, 197, 72, 0.9)",
            border: "3px solid #FFF",
            textAlign: "center",
            maxWidth: "92%",
            zIndex: 100,
          }}
        >
          🗳️ ВЫ ВЫБРАЛИ ВАРИАНТ «Б»
        </div>
      )}

      {/* --- LAYER 4: 100% Synced Karaoke Subtitles (Whisper) --- */}
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
