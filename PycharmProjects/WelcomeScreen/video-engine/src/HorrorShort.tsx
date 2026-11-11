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
import { Character, CharacterPose } from "./Character";

export const HorrorShort: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames, width, height } = useVideoConfig();
  const curSec = frame / fps;

  // --- Story Stages (56.0 sec total) ---
  // 0.0 - 5.5s: Hook: "3:07 ночи. В глазке ты сам."
  // 5.5 - 14.0s: "Скрипит пол. Голос мамы..."
  // 14.0 - 24.0s: "Двойник шепчет: она не мама..."
  // 24.0 - 38.0s: "Холодные пальцы касаются плеча. Отсчет 5..4..3.."
  // 38.0 - 56.0s: "Вариант А: открыть дверь. Вариант Б: обернуться."

  let currentPose: CharacterPose = "shock";
  let activeTheme: "door" | "mom" | "whisper" | "countdown" | "choice" = "door";

  if (curSec < 5.5) {
    currentPose = "shock";
    activeTheme = "door";
  } else if (curSec < 14.0) {
    currentPose = "think";
    activeTheme = "mom";
  } else if (curSec < 24.0) {
    currentPose = "shock";
    activeTheme = "whisper";
  } else if (curSec < 38.0) {
    currentPose = "shock";
    activeTheme = "countdown";
  } else {
    currentPose = "point";
    activeTheme = "choice";
  }

  // --- Camera Motion (Tension Zoom & Dutch Jitter) ---
  const camZoom = interpolate(
    curSec,
    [0, 5, 14, 24, 34, 38, 50],
    [1.0, 1.25, 1.05, 1.3, 1.45, 1.1, 1.2],
    { extrapolateRight: "clamp" }
  );

  // Intense heartbeat / fear shake on countdown
  const isCountdown = curSec >= 24.0 && curSec < 38.0;
  const shakeIntensity = isCountdown ? 12 : curSec < 3.0 ? 8 : 1.5;
  const camShake = Math.sin(frame * 0.85) * shakeIntensity;

  // Lights: Cold Cyan from door peephole vs Amber kitchen glow
  const isDoorLight = activeTheme === "door" || activeTheme === "whisper";
  const rimColor = isDoorLight ? "#00F0FF" : isCountdown ? "#FF2A2A" : "#F7C548";

  // --- Subtitles Timing Sequence ---
  const punchTitles: { start: number; end: number; text: string; sub: string }[] = [
    { start: 0.0, end: 2.2, text: "3:07 НОЧИ", sub: "В глазке — ты сам." },
    { start: 2.2, end: 5.5, text: "НЕ ОБОРАЧИВАЙСЯ", sub: "У тебя 10 секунд..." },
    { start: 5.5, end: 9.5, text: "СКРИПИТ ПОЛ", sub: "Голос мамы: не открывай!" },
    { start: 9.5, end: 14.0, text: "НО ОНА НИКОГДА", sub: "не звала тебя Тёмочкой..." },
    { start: 14.0, end: 19.0, text: "ОНА НЕ МАМА", sub: "Двойник стучит: 3 раза." },
    { start: 19.0, end: 24.0, text: "ОТКРОЙ МНЕ", sub: "И я спрячу нас обоих..." },
    { start: 24.0, end: 30.0, text: "ХОЛОДНЫЕ ПАЛЬЦЫ", sub: "касаются твоего плеча..." },
    { start: 30.0, end: 38.0, text: "5... 4... 3... 2...", sub: "Свет в подъезде ГАСНЕТ!" },
    { start: 38.0, end: 46.0, text: "ВАРИАНТ А", sub: "Открыть дверь и впустить себя" },
    { start: 46.0, end: 56.0, text: "ВАРИАНТ Б", sub: "Обернуться и посмотреть на маму" },
  ];

  const activePunch = punchTitles.find((p) => curSec >= p.start && curSec < p.end);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#050608",
        overflow: "hidden",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <Audio src={staticFile("horror_liam.mp3")} />

      {/* --- LAYER 1: 3D Parallax Corridor Background --- */}
      <div
        style={{
          position: "absolute",
          width: "120%",
          height: "120%",
          top: "-10%",
          left: "-10%",
          background: isDoorLight
            ? "radial-gradient(circle at 50% 30%, #06283D 0%, #03131F 55%, #010408 100%)"
            : isCountdown
            ? "radial-gradient(circle at 50% 40%, #3A0505 0%, #150202 60%, #020101 100%)"
            : "radial-gradient(circle at 50% 35%, #2B1805 0%, #110901 60%, #030200 100%)",
          filter: "blur(4px)",
          transform: `scale(${1.0 + (curSec / 56.0) * 0.15}) translateY(${camShake * 0.4}px)`,
          transition: "background 0.8s ease",
        }}
      >
        {/* Fisheye Peephole Vignette overlay */}
        <div
          style={{
            position: "absolute",
            width: "100%",
            height: "100%",
            background: "radial-gradient(circle at center, transparent 40%, rgba(0,0,0,0.85) 90%)",
          }}
        />
      </div>

      {/* --- LAYER 2: Contact Floor Shadow --- */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          width: "100%",
          height: "40%",
          background: "linear-gradient(to top, rgba(0,0,0,0.95) 0%, transparent 100%)",
        }}
      >
        <div
          style={{
            position: "absolute",
            bottom: "16%",
            left: "50%",
            width: 360,
            height: 56,
            marginLeft: -180,
            background: "radial-gradient(ellipse at center, rgba(0,0,0,0.98) 0%, rgba(0,0,0,0) 70%)",
            transform: `scale(${1.0 + Math.sin(frame * 0.18) * 0.06})`,
          }}
        />
      </div>

      {/* --- LAYER 3: Character with Emotional Rim Light & Camera Zoom --- */}
      <div
        style={{
          position: "absolute",
          bottom: "13%",
          left: "50%",
          transform: `translateX(-50%) scale(${camZoom}) translateY(${camShake}px)`,
          transformOrigin: "bottom center",
          display: "flex",
          justifyContent: "center",
          transition: "transform 0.1s ease",
        }}
      >
        <Character pose={currentPose} mouth={curSec < 5.0 ? "wide_a" : "closed"} scale={1.5} rimColor={rimColor} />
      </div>

      {/* --- LAYER 4: Cold Open Timer / Warning Banner --- */}
      {curSec < 5.5 && (
        <div
          style={{
            position: "absolute",
            top: "9%",
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: "#FF2A2A",
            color: "#FFF",
            padding: "16px 38px",
            borderRadius: "40px",
            fontWeight: 900,
            fontSize: "36px",
            letterSpacing: "3px",
            boxShadow: "0 0 50px rgba(255, 42, 42, 0.85)",
            border: "3px solid #FFF",
            textAlign: "center",
            maxWidth: "92%",
          }}
        >
          🚨 ПРАВИЛО ВЫЖИВАНИЯ 304
        </div>
      )}

      {/* Choice overlay cards for Part 5 (38.0 - 56.0s) */}
      {curSec >= 38.0 && (
        <div
          style={{
            position: "absolute",
            top: "14%",
            width: "100%",
            display: "flex",
            justifyContent: "center",
            gap: "28px",
            padding: "0 40px",
            boxSizing: "border-box",
          }}
        >
          <div
            style={{
              flex: 1,
              backgroundColor: "rgba(0, 240, 255, 0.18)",
              border: "3px solid #00F0FF",
              borderRadius: "24px",
              padding: "20px 14px",
              textAlign: "center",
              boxShadow: "0 0 35px rgba(0, 240, 255, 0.45)",
            }}
          >
            <div style={{ fontSize: "56px", fontWeight: 900, color: "#00F0FF" }}>А</div>
            <div style={{ fontSize: "28px", fontWeight: 700, color: "#FFF", marginTop: 8 }}>ОТКРЫТЬ ДВЕРЬ</div>
          </div>
          <div
            style={{
              flex: 1,
              backgroundColor: "rgba(247, 197, 72, 0.18)",
              border: "3px solid #F7C548",
              borderRadius: "24px",
              padding: "20px 14px",
              textAlign: "center",
              boxShadow: "0 0 35px rgba(247, 197, 72, 0.45)",
            }}
          >
            <div style={{ fontSize: "56px", fontWeight: 900, color: "#F7C548" }}>Б</div>
            <div style={{ fontSize: "28px", fontWeight: 700, color: "#FFF", marginTop: 8 }}>ОБЕРНУТЬСЯ</div>
          </div>
        </div>
      )}

      {/* --- LAYER 5: Dynamic Karaoke Subtitles (Bottom Third) --- */}
      {activePunch && (
        <div
          style={{
            position: "absolute",
            bottom: "7%",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "10px",
            padding: "0 40px",
            boxSizing: "border-box",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: "64px",
              fontWeight: 900,
              color: "#FFE600",
              textShadow: "0 0 30px rgba(255, 230, 0, 0.9), 0 4px 12px rgba(0,0,0,0.95)",
              letterSpacing: "2px",
              transform: `scale(${1.0 + Math.sin(frame * 0.2) * 0.04})`,
            }}
          >
            {activePunch.text}
          </div>
          <div
            style={{
              fontSize: "36px",
              fontWeight: 700,
              color: "#E2E8F0",
              textShadow: "0 3px 10px rgba(0,0,0,0.95)",
            }}
          >
            {activePunch.sub}
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};
