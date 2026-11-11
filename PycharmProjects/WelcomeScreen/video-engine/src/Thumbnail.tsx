import React from "react";
import { Character } from "./Character";

interface ThumbnailProps {
  titleLine1?: string;
  titleLine2?: string;
  hookObjectEmoji?: string;
  isShock?: boolean;
}

export const Thumbnail: React.FC<ThumbnailProps> = ({
  titleLine1 = "НЕ СМЕЙ",
  titleLine2 = "ДЫШАТЬ!",
  hookObjectEmoji = "⏳",
  isShock = true,
}) => {
  return (
    <div
      style={{
        width: 1280,
        height: 720,
        backgroundColor: "#07080B",
        position: "relative",
        overflow: "hidden",
        fontFamily: "Impact, system-ui, -apple-system, sans-serif",
      }}
    >
      {/* Dynamic 16:9 Dark Contrast Background with Vignette */}
      <div
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
          background: "radial-gradient(circle at 75% 50%, #2A1010 0%, #0D0505 50%, #030101 100%)",
        }}
      />

      {/* Shock Ray Streaks in Background */}
      <div
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
          opacity: 0.15,
          backgroundImage: "repeating-conic-gradient(from 0deg, #FF3B30 0deg 15deg, transparent 15deg 30deg)",
        }}
      />

      {/* Big Dramatic Shock Object (Emoji / Prop) on Left */}
      <div
        style={{
          position: "absolute",
          left: 100,
          top: 260,
          fontSize: 220,
          filter: "drop-shadow(0 0 50px rgba(255, 59, 48, 0.85))",
          transform: "rotate(-12deg)",
        }}
      >
        {hookObjectEmoji}
      </div>

      {/* Massive Bold CTR Typography (Left / Center) */}
      <div
        style={{
          position: "absolute",
          left: 80,
          top: 60,
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          zIndex: 10,
        }}
      >
        <span
          style={{
            fontSize: "108px",
            fontWeight: 900,
            color: "#FFFFFF",
            letterSpacing: "3px",
            textShadow: "6px 6px 0px #000, -3px -3px 0px #000, 3px -3px 0px #000, -3px 3px 0px #000",
            lineHeight: 0.95,
          }}
        >
          {titleLine1}
        </span>
        <span
          style={{
            fontSize: "128px",
            fontWeight: 900,
            color: "#FFE600",
            letterSpacing: "4px",
            textShadow:
              "8px 8px 0px #000, -4px -4px 0px #000, 4px -4px 0px #000, -4px 4px 0px #000, 0 0 40px rgba(255, 230, 0, 0.6)",
            lineHeight: 0.95,
          }}
        >
          {titleLine2}
        </span>
      </div>

      {/* Huge Character on Right (Rule of Thirds, 45% of Frame) */}
      <div
        style={{
          position: "absolute",
          right: 40,
          bottom: -40,
          transform: "scale(1.5)",
          transformOrigin: "bottom center",
          filter: "drop-shadow(0 0 60px rgba(255, 215, 0, 0.5))",
        }}
      >
        <Character pose="shock" mouth="wide_a" scale={1.2} rimColor="#FFD700" />
      </div>
    </div>
  );
};
