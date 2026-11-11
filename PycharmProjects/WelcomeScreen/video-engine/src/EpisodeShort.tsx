import React from "react";
import {
  AbsoluteFill,
  Audio,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Character, CharacterPose, MouthShape } from "./Character";

export interface WordTiming {
  word: string;
  startSec: number;
  endSec: number;
}

export interface SceneData {
  text: string;
  pose: CharacterPose;
  camera: "zoom_in" | "zoom_out" | "shake" | "drift";
  punchWord?: string;
  bgGradient?: string;
}

export interface EpisodeProps {
  title: string;
  hookBanner: string;
  audioUrl?: string;
  scenes: SceneData[];
  words: WordTiming[];
}

export const EpisodeShort: React.FC<EpisodeProps> = ({
  title = "ЧТО, ЕСЛИ ОСТАНОВИТЬ ВРЕМЯ?",
  hookBanner = "⚡ НЕ СМЕЙ ДЫШАТЬ: ПЕРВЫЕ 5 СЕКУНД!",
  audioUrl,
  scenes = [],
  words = [],
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames, width, height } = useVideoConfig();
  const curSec = frame / fps;

  // --- Determine Active Scene ---
  const sceneDurSec = durationInFrames / (fps * Math.max(1, scenes.length));
  const activeSceneIdx = Math.min(scenes.length - 1, Math.floor(curSec / sceneDurSec));
  const activeScene: SceneData = scenes[activeSceneIdx] || {
    text: "",
    pose: "shock",
    camera: "zoom_in",
  };

  // --- Dynamic Camera Animation ---
  let camZoom = 1.0;
  if (activeScene.camera === "zoom_in") {
    const sceneLocalSec = curSec - activeSceneIdx * sceneDurSec;
    camZoom = interpolate(sceneLocalSec, [0, sceneDurSec], [1.0, 1.25], {
      extrapolateRight: "clamp",
    });
  } else if (activeScene.camera === "shake") {
    camZoom = 1.15;
  }

  const isColdOpen = curSec <= 5.0;
  const shakeIntensity = isColdOpen && curSec <= 1.2 ? 14 : 0;
  const camShake = Math.sin(frame * 0.9) * shakeIntensity;

  // Spring entrance for character
  const charSpring = spring({
    fps,
    frame,
    config: { damping: 11, mass: 0.5 },
  });

  // --- Active Word in Karaoke ---
  const activeWordObj = words.find((w) => curSec >= w.startSec && curSec < w.endSec);
  const activeWordText = activeWordObj?.word || "";

  // Dynamic Lip-Sync based on active vowels
  let mouth: MouthShape = "closed";
  if (activeWordText) {
    const lower = activeWordText.toLowerCase();
    if (/[оoуu]/.test(lower)) mouth = "small_o";
    else if (/[аaя]/.test(lower)) mouth = "wide_a";
    else if (/[еeиi]/.test(lower)) mouth = "teeth";
    else mouth = frame % 8 < 4 ? "small_o" : "closed";
  }

  // Hook Banner Scale
  const bannerSpring = spring({
    fps,
    frame: frame - 4,
    config: { damping: 9, mass: 0.4 },
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#07080B",
        overflow: "hidden",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      {audioUrl && <Audio src={audioUrl} />}

      {/* --- LAYER 1: Deep Atmospheric Background --- */}
      <div
        style={{
          position: "absolute",
          width: "120%",
          height: "120%",
          top: "-10%",
          left: "-10%",
          background:
            activeScene.bgGradient ||
            "radial-gradient(circle at 50% 35%, #161A29 0%, #080A12 65%, #030407 100%)",
          filter: "blur(4px)",
          transform: `scale(${1.0 + (curSec / 40.0) * 0.1})`,
        }}
      >
        <div
          style={{
            position: "absolute",
            width: "100%",
            height: "100%",
            opacity: 0.22,
            backgroundImage: "radial-gradient(#F7C548 1.5px, transparent 1.5px)",
            backgroundSize: "64px 64px",
          }}
        />
      </div>

      {/* --- LAYER 2: Contact Floor & Ambient Shadow --- */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          width: "100%",
          height: "38%",
          background: "linear-gradient(to top, rgba(0,0,0,0.92) 0%, transparent 100%)",
        }}
      >
        <div
          style={{
            position: "absolute",
            bottom: "16%",
            left: "50%",
            width: 340,
            height: 52,
            marginLeft: -170,
            background: "radial-gradient(ellipse at center, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0) 70%)",
            transform: `scale(${0.95 + Math.sin(frame * 0.15) * 0.05})`,
          }}
        />
      </div>

      {/* --- LAYER 3: Character with 2.5D Spring & Rim Lighting --- */}
      <div
        style={{
          position: "absolute",
          bottom: "13%",
          left: "50%",
          transform: `translateX(-50%) scale(${charSpring * camZoom}) translateY(${camShake}px)`,
          transformOrigin: "bottom center",
          display: "flex",
          justifyContent: "center",
        }}
      >
        <Character
          pose={activeScene.pose}
          mouth={mouth}
          scale={1.45}
          rimColor={isColdOpen ? "#FF3B30" : "#F7C548"}
        />
      </div>

      {/* --- LAYER 4: Cold Open 5-Second Explosive Hook Banner --- */}
      {isColdOpen && (
        <div
          style={{
            position: "absolute",
            top: "10%",
            left: "50%",
            transform: `translateX(-50%) scale(${Math.max(0, bannerSpring)})`,
            backgroundColor: "#FF3B30",
            color: "#FFF",
            padding: "16px 36px",
            borderRadius: "40px",
            fontWeight: 900,
            fontSize: "34px",
            letterSpacing: "2px",
            boxShadow: "0 0 45px rgba(255, 59, 48, 0.8)",
            border: "3px solid #FFF",
            textAlign: "center",
            maxWidth: "90%",
          }}
        >
          {hookBanner}
        </div>
      )}

      {/* --- LAYER 5: Karaoke Subtitles (Sliding Word Window) --- */}
      <div
        style={{
          position: "absolute",
          bottom: "7%",
          width: "100%",
          display: "flex",
          justifyContent: "center",
          flexWrap: "wrap",
          gap: "12px",
          padding: "0 40px",
          boxSizing: "border-box",
        }}
      >
        {(() => {
          // Window of 5-6 words around current timing
          const curIdx = words.findIndex((w) => curSec >= w.startSec && curSec < w.endSec);
          const safeIdx = curIdx >= 0 ? curIdx : 0;
          const start = Math.floor(safeIdx / 5) * 5;
          const chunk = words.slice(start, start + 5);

          return chunk.map((item, idx) => {
            const isActive = item.word === activeWordText;
            return (
              <span
                key={idx}
                style={{
                  fontSize: isActive ? "52px" : "42px",
                  fontWeight: 900,
                  color: isActive ? "#FFD700" : "#E2E8F0",
                  textShadow: isActive
                    ? "0 0 26px rgba(255, 215, 0, 0.95), 0 4px 10px rgba(0,0,0,0.9)"
                    : "0 4px 10px rgba(0,0,0,0.9)",
                  transform: isActive ? "scale(1.18)" : "scale(1.0)",
                  transition: "all 0.08s ease",
                }}
              >
                {item.word}
              </span>
            );
          });
        })()}
      </div>
    </AbsoluteFill>
  );
};
