import React from "react";

export type CharacterPose = "idle" | "shock" | "point" | "think";
export type MouthShape = "closed" | "small_o" | "wide_a" | "smile" | "teeth" | "grimace";

interface CharacterProps {
  pose?: CharacterPose;
  mouth?: MouthShape;
  scale?: number;
  rimColor?: string;
}

export const Character: React.FC<CharacterProps> = ({
  pose = "idle",
  mouth = "closed",
  scale = 1.0,
  rimColor = "#F7C548", // Golden-cream rim light
}) => {
  return (
    <div
      style={{
        width: 400 * scale,
        height: 600 * scale,
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <svg
        viewBox="0 0 400 600"
        width={400 * scale}
        height={600 * scale}
        style={{ filter: `drop-shadow(0px 0px 24px ${rimColor}88)` }}
      >
        <defs>
          {/* Rim light glow filter */}
          <filter id="gold-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="0" stdDeviation="8" floodColor={rimColor} floodOpacity="0.85" />
          </filter>
          {/* Smooth radial gradient for body depth */}
          <radialGradient id="body-grad" cx="50%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#252528" />
            <stop offset="100%" stopColor="#0B0B0D" />
          </radialGradient>
        </defs>

        {/* --- BODY --- */}
        {/* Torso with subtle folds & shadows */}
        <path
          d="M 120 340 C 110 460, 100 520, 95 600 L 305 600 C 300 520, 290 460, 280 340 Z"
          fill="url(#body-grad)"
          stroke="#111"
          strokeWidth="6"
        />
        {/* Collar / Hoodie line */}
        <path
          d="M 160 350 C 200 375, 200 375, 240 350"
          stroke={rimColor}
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
        />

        {/* --- HANDS / ARMS BY POSE --- */}
        {pose === "shock" && (
          <g filter="url(#gold-glow)">
            {/* Left hand to head */}
            <path d="M 115 380 Q 70 300 100 230" stroke="#0B0B0D" strokeWidth="24" strokeLinecap="round" fill="none" />
            <circle cx="100" cy="230" r="16" fill="#F4E8D1" stroke="#0B0B0D" strokeWidth="4" />
            {/* Right hand to head */}
            <path d="M 285 380 Q 330 300 300 230" stroke="#0B0B0D" strokeWidth="24" strokeLinecap="round" fill="none" />
            <circle cx="300" cy="230" r="16" fill="#F4E8D1" stroke="#0B0B0D" strokeWidth="4" />
          </g>
        )}
        {pose === "point" && (
          <g filter="url(#gold-glow)">
            {/* Right pointing arm upwards */}
            <path d="M 280 380 L 350 220" stroke="#0B0B0D" strokeWidth="22" strokeLinecap="round" fill="none" />
            <polygon points="340,210 365,210 352,185" fill="#F4E8D1" stroke="#0B0B0D" strokeWidth="3" />
          </g>
        )}
        {pose === "think" && (
          <g filter="url(#gold-glow)">
            {/* Right hand under chin */}
            <path d="M 280 410 Q 280 320 220 300" stroke="#0B0B0D" strokeWidth="20" strokeLinecap="round" fill="none" />
            <circle cx="218" cy="298" r="15" fill="#F4E8D1" stroke="#0B0B0D" strokeWidth="4" />
          </g>
        )}

        {/* --- HEAD (WHAT IF ICONIC ROUND HEAD) --- */}
        <circle
          cx="200"
          cy="200"
          r="105"
          fill="#0D0E12"
          stroke={rimColor}
          strokeWidth="7"
          filter="url(#gold-glow)"
        />

        {/* Messy Hair silhouette with rim highlights */}
        <path
          d="M 105 180 C 95 110, 160 85, 200 85 C 250 85, 305 110, 295 180 C 300 130, 260 98, 200 100 C 140 102, 100 135, 105 180 Z"
          fill={rimColor}
          opacity="0.9"
        />

        {/* --- EYES (HUGE EXPRESSIVE CREAM CONCENTRIC) --- */}
        {/* Left Eye */}
        <g transform={pose === "shock" ? "scale(1.15) translate(-26, -30)" : ""}>
          <circle cx="158" cy="188" r="28" fill="#F6EFE0" stroke="#111" strokeWidth="4" />
          <circle cx="158" cy="188" r="20" fill="#0D0E12" />
          <circle cx="158" cy="188" r="13" fill="#F6EFE0" />
          <circle cx="163" cy="183" r="4" fill="#FFFFFF" /> {/* Eye highlight spark */}
        </g>
        {/* Right Eye */}
        <g transform={pose === "shock" ? "scale(1.15) translate(-34, -30)" : ""}>
          <circle cx="242" cy="188" r="28" fill="#F6EFE0" stroke="#111" strokeWidth="4" />
          <circle cx="242" cy="188" r="20" fill="#0D0E12" />
          <circle cx="242" cy="188" r="13" fill="#F6EFE0" />
          <circle cx="247" cy="183" r="4" fill="#FFFFFF" /> {/* Eye highlight spark */}
        </g>

        {/* Eyebrows by Emotion */}
        {pose === "shock" && (
          <>
            <path d="M 135 145 Q 160 135 180 148" stroke={rimColor} strokeWidth="5" strokeLinecap="round" fill="none" />
            <path d="M 220 148 Q 240 135 265 145" stroke={rimColor} strokeWidth="5" strokeLinecap="round" fill="none" />
          </>
        )}
        {pose === "think" && (
          <>
            <path d="M 138 152 L 180 160" stroke={rimColor} strokeWidth="5" strokeLinecap="round" fill="none" />
            <path d="M 220 156 L 262 148" stroke={rimColor} strokeWidth="5" strokeLinecap="round" fill="none" />
          </>
        )}

        {/* --- MOUTH SHAPES (LIP SYNC) --- */}
        {mouth === "closed" && (
          <path d="M 180 250 Q 200 254 220 250" stroke="#F6EFE0" strokeWidth="5" strokeLinecap="round" fill="none" />
        )}
        {mouth === "small_o" && (
          <circle cx="200" cy="252" r="14" fill="#E63946" stroke="#F6EFE0" strokeWidth="4" />
        )}
        {mouth === "wide_a" && (
          <path
            d="M 172 245 Q 200 235 228 245 Q 200 280 172 245 Z"
            fill="#B7094C"
            stroke="#F6EFE0"
            strokeWidth="4"
          />
        )}
        {mouth === "smile" && (
          <path d="M 175 244 Q 200 270 225 244" stroke="#F6EFE0" strokeWidth="5" strokeLinecap="round" fill="none" />
        )}
        {mouth === "teeth" && (
          <rect x="175" y="244" width="50" height="15" rx="6" fill="#F6EFE0" stroke="#111" strokeWidth="3" />
        )}
        {mouth === "grimace" && (
          <path d="M 175 256 Q 200 240 225 256" stroke="#F6EFE0" strokeWidth="5" strokeLinecap="round" fill="none" />
        )}
      </svg>
    </div>
  );
};
