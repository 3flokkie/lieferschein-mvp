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
import { KitchenScene } from "./KitchenScene";
import { HumanPart4, Part4Pose } from "./HumanPart4";
import { Part2FilmOverlay } from "./HumanPart2";
import wordsData from "../public/horror_part4_words.json";

export const HorrorPart4Movie: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const curSec = frame / fps;

  // --- Story Stages (59.5 sec total) ---
  let currentPose: Part4Pose = "cleaver_strike";
  if (curSec < 13.5) {
    currentPose = "cleaver_strike";
  } else if (curSec < 27.5) {
    currentPose = "monster_grab";
  } else if (curSec < 39.0) {
    currentPose = "cut_coat_window";
  } else if (curSec < 48.0) {
    currentPose = "ledge_precipice";
  } else {
    currentPose = "choice_jump_crawl";
  }

  // Camera Shake
  const isChopImpact = curSec >= 4.0 && curSec < 8.0;
  const isWindowSmash = curSec >= 32.0 && curSec < 37.0;
  const isMonsterBust = curSec >= 42.0 && curSec < 47.0;
  const shakeIntensity = isChopImpact ? 14 : isWindowSmash ? 16 : isMonsterBust ? 12 : 2;
  const camShakeX = Math.sin(frame * 1.1) * shakeIntensity;
  const camShakeY = Math.cos(frame * 0.9) * shakeIntensity;

  // Camera Zoom Progression
  const camZoom = interpolate(
    curSec,
    [0, 5.0, 13.5, 22.0, 27.5, 39.0, 48.0, 59.5],
    [1.02, 1.15, 1.28, 1.35, 1.1, 1.25, 1.05, 1.0],
    { extrapolateRight: "clamp" }
  );

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
      {/* 1. Main Dialogue Track (Liam 59.5s) */}
      <Audio src={staticFile("horror_part4_liam.mp3")} volume={1.0} />

      {/* 2. ЧИСТЫЙ ГУЛ (Низкочастотный бас-гул без сирены и визгов, растянут на 60с) */}
      <Audio
        src={staticFile("mix_v2/pure_hum_60s.mp3")}
        volume={0.7}
      />

      {/* 3. Дыхание героя (Растянуто на 60s, без вотермарков) */}
      <Audio
        src={staticFile("mix_v2/breathing_long_60s.mp3")}
        volume={0.65}
      />

      {/* 4. Пульс / сердцебиение (Растянуто на 60s, без вотермарков) */}
      <Audio
        src={staticFile("mix_v2/heartbeat_panic_60s.mp3")}
        volume={curSec > 12.0 ? 0.75 : 0.5}
      />

      {/* 5. Точечные звуковые эффекты действий (по секундам сюжета) */}
      <Sequence from={Math.round(fps * 4.2)} durationInFrames={30}>
        <Audio src={staticFile("sfx/swish_blade.wav")} volume={0.85} />
      </Sequence>

      <Sequence from={Math.round(fps * 5.5)} durationInFrames={30}>
        <Audio src={staticFile("sfx/cut_hit_punch.wav")} volume={0.9} />
      </Sequence>

      <Sequence from={Math.round(fps * 31.5)} durationInFrames={75}>
        <Audio src={staticFile("sfx/impact_metal.wav")} volume={0.85} />
      </Sequence>

      <Sequence from={Math.round(fps * 38.0)} durationInFrames={60}>
        <Audio src={staticFile("sfx/wind_gust.wav")} volume={0.7} />
      </Sequence>

      <Sequence from={Math.round(fps * 48.0)} durationInFrames={60}>
        <Audio src={staticFile("sfx/sub_drop.wav")} volume={0.9} />
      </Sequence>

      {/* --- LAYER 1: Background Kitchen or Night Exterior --- */}
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
        {curSec < 39.0 ? (
          <KitchenScene highlightKnife={curSec < 6.0} highlightWindow={curSec >= 6.0} />
        ) : (
          <div
            style={{
              position: "absolute",
              width: "100%",
              height: "100%",
              backgroundColor: "#070B11",
              backgroundImage:
                "radial-gradient(circle at 50% 20%, #172554 0%, #030712 70%)",
            }}
          />
        )}

        {/* --- LAYER 2: Character Animations & Monster --- */}
        <HumanPart4 pose={currentPose} />
      </div>

      {/* --- LAYER 3: Cinematic Film Grain & Vignette --- */}
      <Part2FilmOverlay />

      {/* --- LAYER 4: Result Banner (0 - 4.5s) --- */}
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
            zIndex: 100,
          }}
        >
          🔪 ВЫ ВЫБРАЛИ «ТЕСАК И ОКНО»
        </div>
      )}

      {/* --- LAYER 5: Choice Prompt (48.0s - 59.5s) --- */}
      {curSec >= 48.0 && (
        <div
          style={{
            position: "absolute",
            top: "14%",
            left: "50%",
            transform: "translateX(-50%)",
            width: "90%",
            display: "flex",
            flexDirection: "column",
            gap: "20px",
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
            <div
              style={{
                fontSize: "36px",
                fontWeight: 900,
                color: "#FACC15",
                marginBottom: "8px",
                letterSpacing: "1px",
              }}
            >
              ⚠️ РЕШАЙ СЕЙЧАС В КОММЕНТАХ:
            </div>
            <div
              style={{
                fontSize: "28px",
                fontWeight: 700,
                color: "#FFF",
                lineHeight: "1.3",
              }}
            >
              🅰️ Прыгать вниз на ветки вяза<br />
              🅱️ Ползти по карнизу к балкону
            </div>
          </div>
        </div>
      )}

      {/* --- LAYER 6: Faster-Whisper Synced Karaoke Subtitles --- */}
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
