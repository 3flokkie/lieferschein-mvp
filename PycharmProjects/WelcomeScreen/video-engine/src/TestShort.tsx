import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Character, CharacterPose, MouthShape } from "./Character";

export const TestShort: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames, width, height } = useVideoConfig();

  // --- Dynamic Camera Parallax (Z & X drift) ---
  const camProgress = frame / durationInFrames;
  const camZoom = interpolate(frame, [0, 45, 120, 240], [1.0, 1.18, 1.05, 1.25], {
    extrapolateRight: "clamp",
  });
  const camShake = Math.sin(frame * 0.8) * interpolate(frame, [0, 30], [8, 0], { extrapolateRight: "clamp" });

  // --- Character Emotion Transitions ---
  let currentPose: CharacterPose = "shock";
  let currentMouth: MouthShape = "wide_a";
  if (frame > 60 && frame <= 140) {
    currentPose = "point";
    currentMouth = frame % 10 < 5 ? "small_o" : "closed";
  } else if (frame > 140) {
    currentPose = "think";
    currentMouth = frame % 12 < 6 ? "smile" : "closed";
  }

  // Character entrance spring
  const charSpring = spring({
    fps,
    frame,
    config: { damping: 11, mass: 0.6 },
  });

  // --- Explosive Cold Open Hook (First 5 seconds = 0 to 150 frames at 30fps) ---
  const isHook = frame < 90;
  const hookBannerScale = spring({
    fps,
    frame: frame - 5,
    config: { damping: 9, mass: 0.4 },
  });

  // --- Kinetic Subtitles (Karaoke style) ---
  const activeWordIdx = Math.floor(frame / 20) % 4;
  const words = ["ЕСЛИ", "ВРЕМЯ", "ОСТАНОВИТСЯ,", "ТЫ — ТРУП!"];

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#08090C",
        overflow: "hidden",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      {/* --- LAYER 1: Deep 3D Background with Parallax --- */}
      <div
        style={{
          position: "absolute",
          width: "120%",
          height: "120%",
          top: "-10%",
          left: "-10%",
          transform: `scale(${1.0 + camProgress * 0.15}) translate(${camShake * 0.3}px, ${camProgress * -30}px)`,
          background: "radial-gradient(circle at 50% 40%, #1A1C29 0%, #090A10 70%, #030406 100%)",
          filter: "blur(4px)",
        }}
      >
        {/* Floating Neon Grid / Cyber Particles in 3D */}
        <div
          style={{
            position: "absolute",
            width: "100%",
            height: "100%",
            opacity: 0.25,
            backgroundImage: "radial-gradient(#F7C548 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      {/* --- LAYER 2: Stage / Contact Floor with Shadows --- */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          width: "100%",
          height: "40%",
          background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%)",
        }}
      >
        {/* Dynamic Character Floor Shadow */}
        <div
          style={{
            position: "absolute",
            bottom: "16%",
            left: "50%",
            width: 320,
            height: 48,
            marginLeft: -160,
            background: "radial-gradient(ellipse at center, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0) 70%)",
            transform: `scale(${0.9 + Math.sin(frame * 0.1) * 0.05})`,
          }}
        />
      </div>

      {/* --- LAYER 3: Character with Spring Physics & Camera Zoom --- */}
      <div
        style={{
          position: "absolute",
          bottom: "14%",
          left: "50%",
          transform: `translateX(-50%) scale(${charSpring * camZoom}) translateY(${camShake}px)`,
          transformOrigin: "bottom center",
          display: "flex",
          justifyContent: "center",
        }}
      >
        <Character pose={currentPose} mouth={currentMouth} scale={1.4} rimColor={isHook ? "#FF3B30" : "#F7C548"} />
      </div>

      {/* --- LAYER 4: UI & Explosive Cold-Open Hook --- */}
      {isHook && (
        <div
          style={{
            position: "absolute",
            top: "10%",
            left: "50%",
            transform: `translateX(-50%) scale(${Math.max(0, hookBannerScale)})`,
            backgroundColor: "#FF3B30",
            color: "#FFF",
            padding: "16px 36px",
            borderRadius: "40px",
            fontWeight: 900,
            fontSize: "36px",
            letterSpacing: "2px",
            boxShadow: "0 0 40px rgba(255, 59, 48, 0.75)",
            border: "3px solid #FFF",
            textAlign: "center",
          }}
        >
          ⚡ НЕ СМЕЙ ДЫШАТЬ: ПЕРВЫЕ 5 СЕКУНД!
        </div>
      )}

      {/* --- LAYER 5: Karaoke Subtitles (Bottom Third) --- */}
      <div
        style={{
          position: "absolute",
          bottom: "7%",
          width: "100%",
          display: "flex",
          justifyContent: "center",
          gap: "14px",
          padding: "0 40px",
          boxSizing: "border-box",
        }}
      >
        {words.map((word, idx) => {
          const isActive = idx === activeWordIdx;
          return (
            <span
              key={idx}
              style={{
                fontSize: isActive ? "52px" : "42px",
                fontWeight: 900,
                color: isActive ? "#FFD700" : "#E2E8F0",
                textShadow: isActive
                  ? "0 0 24px rgba(255, 215, 0, 0.9), 0 4px 10px rgba(0,0,0,0.9)"
                  : "0 4px 10px rgba(0,0,0,0.9)",
                transform: isActive ? "scale(1.18)" : "scale(1.0)",
                transition: "all 0.1s ease",
              }}
            >
              {word}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
