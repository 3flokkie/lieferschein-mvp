import React from "react";
import {
  AbsoluteFill,
  Audio,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { KitchenScene } from "./KitchenScene";
import { HumanPart3, Part3Pose } from "./HumanPart3";
import { Part2FilmOverlay } from "./HumanPart2";
import wordsData from "../public/horror_part3_words.json";

export const HorrorPart3Movie: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const curSec = frame / fps;

  // --- Story Stages (45.46 sec total) ---
  let currentPose: Part3Pose = "barricade_push";
  if (curSec < 9.0) {
    currentPose = "barricade_push";
  } else if (curSec < 23.0) {
    currentPose = "old_artem_whisper";
  } else if (curSec < 31.5) {
    currentPose = "glass_shatter_hand";
  } else {
    currentPose = "choice_dilemma";
  }

  // --- Dynamic Camera Shakes on Door & Glass Breaches ---
  const isDoorImpact = curSec >= 6.0 && curSec < 11.0;
  const isGlassShatter = curSec >= 24.0 && curSec < 31.0;
  const shakeIntensity = isGlassShatter ? 15 : isDoorImpact ? 10 : 1;
  const camShakeX = Math.sin(frame * 0.95) * shakeIntensity;
  const camShakeY = Math.cos(frame * 0.85) * shakeIntensity;

  // Camera Zoom Progression
  const camZoom = interpolate(
    curSec,
    [0, 5.0, 9.0, 18.0, 24.0, 31.0, 35.0, 45.4],
    [1.02, 1.08, 1.15, 1.25, 1.35, 1.05, 1.0, 1.0],
    { extrapolateRight: "clamp" }
  );

  // --- 100% Exact Word Match via Faster-Whisper ---
  const activeWordObj = wordsData.find((w: any) => curSec >= w.start && curSec < w.end);
  const activeWordIdx = wordsData.findIndex((w: any) => curSec >= w.start && curSec < w.end);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#050608",
        overflow: "hidden",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <Audio src={staticFile("horror_part3_liam.mp3")} />

      {/* --- LAYER 1: 100% Vector Dark Night Kitchen (Unified Part 2 Art Style) --- */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          transform: `scale(${camZoom}) translate(${camShakeX}px, ${camShakeY}px)`,
          transformOrigin: "center center",
          transition: "transform 0.08s ease",
        }}
      >
        <KitchenScene
          highlightKnife={currentPose === "choice_dilemma"}
          highlightWindow={currentPose === "choice_dilemma"}
        />

        {/* --- LAYER 2: Live Characters, Barricade & Sinister Hand --- */}
        <HumanPart3 pose={currentPose} />
      </div>

      {/* --- LAYER 3: Cinematic Film Grain & Vignette Overlay --- */}
      <Part2FilmOverlay />

      {/* --- LAYER 4: Result Banner (0 - 4.5s) --- */}
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
          🗳️ ВЫ ВЫБРАЛИ «КУХНЮ»
        </div>
      )}

      {/* --- LAYER 5: 100% Synced Karaoke Subtitles (Whisper) --- */}
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
