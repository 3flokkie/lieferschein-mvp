import React, { useMemo } from "react";
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  Audio,
  staticFile,
  spring,
} from "remotion";

// Subtitle segments with timestamps in seconds
interface Subtitle {
  start: number;
  end: number;
  speaker: "OPERATOR" | "RUTH" | "SYSTEM";
  textEn: string;
  textRu: string;
}

const SUBTITLES: Subtitle[] = [
  {
    start: 0.5,
    end: 2.2,
    speaker: "OPERATOR",
    textEn: "Emergency operator 24.",
    textRu: "Служба 911, оператор 24.",
  },
  {
    start: 2.3,
    end: 5.0,
    speaker: "RUTH",
    textEn: "Yes... I want somebody to come out.",
    textRu: "Да... Мне нужно, чтобы кто-нибудь приехал.",
  },
  {
    start: 5.1,
    end: 8.5,
    speaker: "RUTH",
    textEn: "There was a man hanging around the outside.",
    textRu: "Здесь возле дома бродит какой-то мужчина.",
  },
  {
    start: 8.6,
    end: 11.2,
    speaker: "OPERATOR",
    textEn: "What's the address, please?",
    textRu: "Назовите ваш адрес, пожалуйста.",
  },
  {
    start: 11.3,
    end: 15.0,
    speaker: "RUTH",
    textEn: "2076 South Lincoln Street.",
    textRu: "Саут Линкольн-стрит, дом 2076.",
  },
  {
    start: 15.2,
    end: 18.0,
    speaker: "OPERATOR",
    textEn: "Is that a house or an apartment?",
    textRu: "Это частный дом или квартира?",
  },
  {
    start: 18.1,
    end: 20.8,
    speaker: "RUTH",
    textEn: "It's an apartment in the front.",
    textRu: "Квартира с передней стороны.",
  },
  {
    start: 21.0,
    end: 24.5,
    speaker: "RUTH",
    textEn: "He went around to the back...",
    textRu: "Он пошел вокруг дома на задний двор...",
  },
  {
    start: 24.6,
    end: 27.5,
    speaker: "RUTH",
    textEn: "And I live alone, I'm an old lady.",
    textRu: "Я живу одна... Я пожилая женщина.",
  },
  {
    start: 27.6,
    end: 30.5,
    speaker: "OPERATOR",
    textEn: "What is he doing in the back?",
    textRu: "Что он делает на заднем дворе?",
  },
  {
    start: 30.6,
    end: 33.5,
    speaker: "RUTH",
    textEn: "I don't know, he's checking the windows...",
    textRu: "Я не знаю, он дергает окна...",
  },
  {
    start: 33.6,
    end: 36.5,
    speaker: "OPERATOR",
    textEn: "Stay on the line, ma'am. Help is on the way.",
    textRu: "Оставайтесь на линии! Помощь уже едет.",
  },
  {
    start: 36.6,
    end: 45.0,
    speaker: "SYSTEM",
    textEn: "[VIOLENT STRUGGLE // DISTRESS SENSORS TRIGGERED]",
    textRu: "[ВЗЛОМ ДВЕРИ // КРИК О ПОМОЩИ // ОБРЫВ СВЯЗИ]",
  },
  {
    start: 45.1,
    end: 49.5,
    speaker: "OPERATOR",
    textEn: "Ma'am? Ma'am?! Can you hear me?!",
    textRu: "Мэм? Мэм?! Вы меня слышите?! Мэм?!",
  },
  {
    start: 49.6,
    end: 54.4,
    speaker: "SYSTEM",
    textEn: "[DISPATCH 12 REPORT: CODE 3 EMERGENCY RESPONSE]",
    textRu: "[РАПОРТ: ЭКИПАЖ ПРИБЫЛ ЧЕРЕЗ 3 МИН 40 СЕК]",
  },
];

export const Real911Reconstruction: React.FC = () => {
  const frame = useCurrentFrame();
  const fps = 30;
  const time = frame / fps;

  // Current active subtitle
  const activeSub = useMemo(() => {
    return SUBTITLES.find((s) => time >= s.start && time < s.end);
  }, [time]);

  // Audio waveform pseudo-data generator based on time
  const waveformBars = useMemo(() => {
    const bars: number[] = [];
    for (let i = 0; i < 48; i++) {
      // Dynamic noise reacting to screaming climax (around 36-45s)
      const isClimax = time >= 36.0 && time <= 45.0;
      const baseAmp = isClimax ? 0.9 : time >= 45.0 ? 0.08 : 0.45;
      const wave =
        Math.sin(frame * 0.45 + i * 0.35) * 0.3 +
        Math.cos(frame * 0.25 - i * 0.5) * 0.3;
      const height = Math.max(
        0.05,
        Math.min(1, Math.abs(wave) * baseAmp + (Math.sin(i * 1.8) * 0.15))
      );
      bars.push(height);
    }
    return bars;
  }, [frame, time]);

  // CRT Screen Flicker
  const crtFlicker = 0.96 + Math.sin(frame * 1.7) * 0.04;
  const scanlineOffset = (frame * 3) % 8;

  // Scene Determination (Dynamic cuts every 3-7s)
  // Scene 0: 0.00 - 5.00s (CAD Terminal initialization)
  // Scene 1: 5.00 - 11.50s (CCTV Exterior Suburban House)
  // Scene 2: 11.50 - 18.00s (Frosted Back Door with passing shadow)
  // Scene 3: 18.00 - 27.50s (Hallway Rotary Phone trembling)
  // Scene 4: 27.50 - 34.00s (Dark Rear Window POV / Silhouette)
  // Scene 5: 34.00 - 45.00s (THE BREACH Climax / Red Alarm Strobe / Glitch)
  // Scene 6: 45.00 - 54.50s (Cold Aftermath / Police Dossier)

  const isAlarmClimax = time >= 34.0 && time < 45.0;
  const flashCycle = Math.sin(frame * 0.8) > 0;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#05070a",
        color: "#ffffff",
        fontFamily: "'Courier New', monospace, sans-serif",
        overflow: "hidden",
      }}
    >
      {/* 1. ARCHIVAL REAL 911 AUDIO */}
      <Audio src={staticFile("ruth_price/raw_audio.aac")} />

      {/* 2. MAIN VISUAL SCENE STACK */}
      <AbsoluteFill style={{ filter: "contrast(115%) brightness(95%)" }}>
        {/* ============================================================ */}
        {/* SCENE 0: CAD DISPATCH TERMINAL (0.00 - 5.00s) */}
        {/* ============================================================ */}
        {time < 5.0 && (
          <AbsoluteFill
            style={{
              background: "radial-gradient(circle at 50% 50%, #0d1e13 0%, #030805 100%)",
              display: "flex",
              flexDirection: "column",
              padding: "80px 60px",
              justifyContent: "space-between",
            }}
          >
            {/* Terminal Header */}
            <div>
              <div
                style={{
                  color: "#00ff66",
                  fontSize: 28,
                  fontWeight: 900,
                  letterSpacing: 4,
                  borderBottom: "2px solid #00ff66",
                  paddingBottom: 16,
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <span>[911 EMERGENCY DISPATCH - TERMINAL 04]</span>
                <span style={{ color: "#ff3333", animation: "blink 1s infinite" }}>
                  ● REC LIVE
                </span>
              </div>
              <div style={{ color: "#66cc88", fontSize: 22, marginTop: 20, lineHeight: 1.6 }}>
                <div>SYSTEM ID: FOIA-REC-1980-04192</div>
                <div>CALLER: PRICE, RUTH (RESIDENCE)</div>
                <div>PRIORITY: CODE 1 (URGENT IN PROGRESS)</div>
                <div>LINE STATUS: CONNECTED [SECURE CHANNEL 2]</div>
              </div>
            </div>

            {/* Central Terminal Graphic: Live Oscilloscope Waveform */}
            <div
              style={{
                background: "rgba(0, 40, 15, 0.4)",
                border: "2px solid #00aa44",
                borderRadius: 8,
                padding: "40px 30px",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  color: "#00ff66",
                  fontSize: 24,
                  letterSpacing: 3,
                  marginBottom: 30,
                  fontWeight: 700,
                }}
              >
                AUDIO SPECTRUM // DISPATCH MONITOR
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  height: 180,
                  gap: 8,
                }}
              >
                {waveformBars.map((height, idx) => (
                  <div
                    key={idx}
                    style={{
                      width: 12,
                      height: `${height * 160}px`,
                      backgroundColor: idx % 3 === 0 ? "#33ff88" : "#00dd55",
                      boxShadow: "0 0 10px rgba(0, 255, 100, 0.6)",
                      borderRadius: 3,
                    }}
                  />
                ))}
              </div>
              <div
                style={{
                  color: "#55aa77",
                  fontSize: 18,
                  marginTop: 24,
                  letterSpacing: 2,
                }}
              >
                FREQ: 3.4 kHz | NOISE REDUCTION: OFF | ARCHIVAL TAPES
              </div>
            </div>

            {/* Warning tag */}
            <div
              style={{
                backgroundColor: "rgba(255, 50, 50, 0.15)",
                border: "1px dashed #ff4444",
                padding: "20px 24px",
                borderRadius: 6,
                color: "#ff7777",
                fontSize: 20,
                lineHeight: 1.5,
              }}
            >
              ВНИМАНИЕ: Подлинная архивная запись звонка диспетчера 911. Материал
              используется для обучения операторов экстренных служб США.
            </div>
          </AbsoluteFill>
        )}

        {/* ============================================================ */}
        {/* SCENE 1: CCTV EXTERIOR SUBURBAN HOUSE (5.00 - 11.50s) */}
        {/* ============================================================ */}
        {time >= 5.0 && time < 11.5 && (
          <AbsoluteFill
            style={{
              backgroundColor: "#070b10",
              overflow: "hidden",
            }}
          >
            {/* Night Sky & Distant Treeline */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: "linear-gradient(180deg, #050a12 0%, #0d1624 50%, #05070a 100%)",
              }}
            />

            {/* Dark Suburban House Silhouette */}
            <div
              style={{
                position: "absolute",
                bottom: 250,
                left: 90,
                right: 90,
                height: 700,
                transform: `scale(${interpolate(frame - 150, [0, 195], [1.0, 1.08])})`,
                transformOrigin: "center bottom",
              }}
            >
              {/* Roof */}
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: "5%",
                  right: "5%",
                  height: 220,
                  backgroundColor: "#0b1118",
                  clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)",
                  borderBottom: "6px solid #141d28",
                }}
              />
              {/* House Walls */}
              <div
                style={{
                  position: "absolute",
                  top: 215,
                  left: "10%",
                  right: "10%",
                  bottom: 0,
                  backgroundColor: "#0e151f",
                  border: "2px solid #1b2636",
                }}
              >
                {/* Solitary lit window (Ruth's lamp) */}
                <div
                  style={{
                    position: "absolute",
                    top: 100,
                    right: 80,
                    width: 140,
                    height: 190,
                    backgroundColor: "#ffe082",
                    boxShadow: "0 0 60px rgba(255, 220, 100, 0.45)",
                    border: "8px solid #221a0f",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {/* Window frame grid */}
                  <div
                    style={{
                      width: "100%",
                      height: 4,
                      backgroundColor: "#221a0f",
                      position: "absolute",
                    }}
                  />
                  <div
                    style={{
                      height: "100%",
                      width: 4,
                      backgroundColor: "#221a0f",
                      position: "absolute",
                    }}
                  />
                  {/* Subtle inner silhouette of Ruth sitting */}
                  <div
                    style={{
                      width: 50,
                      height: 80,
                      backgroundColor: "#332211",
                      borderRadius: "50% 50% 10% 10%",
                      marginTop: 60,
                    }}
                  />
                </div>

                {/* Dark porch with back alleyway */}
                <div
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 60,
                    width: 160,
                    height: 280,
                    backgroundColor: "#06090e",
                    border: "3px solid #121a24",
                  }}
                />
              </div>

              {/* Fog / Misty backyard haze */}
              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: -50,
                  right: -50,
                  height: 350,
                  background: "linear-gradient(0deg, #05070a 10%, transparent 100%)",
                }}
              />
            </div>

            {/* CCTV Security Camera HUD */}
            <div
              style={{
                position: "absolute",
                top: 70,
                left: 60,
                right: 60,
                display: "flex",
                justifyContent: "space-between",
                color: "#00ffcc",
                fontSize: 24,
                letterSpacing: 2,
                textShadow: "0 0 6px #00ffcc",
              }}
            >
              <div>CAM 02 [BACKYARD PERIMETER]</div>
              <div>02:14:38 AM</div>
            </div>
            <div
              style={{
                position: "absolute",
                top: 110,
                left: 60,
                color: "#ff3333",
                fontSize: 22,
                fontWeight: 700,
              }}
            >
              ● SENSOR: MOTION SUSPECTED
            </div>
          </AbsoluteFill>
        )}

        {/* ============================================================ */}
        {/* SCENE 2: FROSTED GLASS BACK DOOR & SHADOW (11.50 - 18.00s) */}
        {/* ============================================================ */}
        {time >= 11.5 && time < 18.0 && (
          <AbsoluteFill
            style={{
              backgroundColor: "#070b10",
              overflow: "hidden",
            }}
          >
            {/* Door Frame Close-up */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {/* Door Wood Texture Frame */}
              <div
                style={{
                  width: 760,
                  height: 1400,
                  backgroundColor: "#161c24",
                  border: "24px solid #0d1218",
                  boxShadow: "0 0 100px rgba(0,0,0,0.9)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  padding: 30,
                  position: "relative",
                }}
              >
                {/* Frosted Glass Panes */}
                <div
                  style={{
                    width: "100%",
                    height: 900,
                    backgroundColor: "#1c2c36",
                    border: "8px solid #0d1218",
                    position: "relative",
                    overflow: "hidden",
                    backdropFilter: "blur(20px)",
                  }}
                >
                  {/* Frosted Glass Texture Grid */}
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      background:
                        "radial-gradient(ellipse at 50% 60%, rgba(120, 160, 180, 0.25) 0%, rgba(5, 10, 15, 0.8) 100%)",
                    }}
                  />

                  {/* Creepy Shadow Passing Outside the Door */}
                  <div
                    style={{
                      position: "absolute",
                      bottom: 0,
                      left: interpolate(
                        frame - 345,
                        [0, 195],
                        [-200, 320]
                      ),
                      width: 320,
                      height: 750,
                      backgroundColor: "#020406",
                      borderRadius: "140px 140px 0 0",
                      filter: "blur(28px)",
                      opacity: 0.92,
                    }}
                  >
                    {/* Head */}
                    <div
                      style={{
                        position: "absolute",
                        top: -50,
                        left: 80,
                        width: 160,
                        height: 190,
                        backgroundColor: "#020406",
                        borderRadius: "50%",
                      }}
                    />
                  </div>

                  {/* Glass reflections */}
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      bottom: 0,
                      width: 120,
                      left: "30%",
                      background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)",
                      transform: "skewX(-25deg)",
                    }}
                  />
                </div>

                {/* Brass Door Knob & Deadbolt Lock */}
                <div
                  style={{
                    position: "absolute",
                    right: 45,
                    top: "62%",
                    width: 70,
                    height: 140,
                    backgroundColor: "#1a1712",
                    borderRadius: 12,
                    border: "3px solid #33281a",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "space-around",
                    padding: 8,
                  }}
                >
                  {/* Keyhole */}
                  <div
                    style={{
                      width: 12,
                      height: 24,
                      backgroundColor: "#080604",
                      borderRadius: 4,
                    }}
                  />
                  {/* Round knob */}
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: "50%",
                      backgroundColor: "#4a3b25",
                      boxShadow: "inset 0 0 10px #1a140b",
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Subtle camera breathe */}
            <div
              style={{
                position: "absolute",
                top: 70,
                left: 60,
                color: "#ffaa00",
                fontSize: 22,
                letterSpacing: 2,
              }}
            >
              [POV: REAR EXIT // ENTRY ATTEMPT]
            </div>
          </AbsoluteFill>
        )}

        {/* ============================================================ */}
        {/* SCENE 3: HALLWAY ROTARY TELEPHONE (18.00 - 27.50s) */}
        {/* ============================================================ */}
        {time >= 18.0 && time < 27.5 && (
          <AbsoluteFill
            style={{
              backgroundColor: "#0a0a0f",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
            }}
          >
            {/* Atmospheric wallpaper with vintage stripes */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "repeating-linear-gradient(90deg, #0d0f17 0px, #0d0f17 40px, #08090e 40px, #08090e 80px)",
                opacity: 0.7,
              }}
            />

            {/* Warm lamp glow from the side */}
            <div
              style={{
                position: "absolute",
                top: 300,
                left: 100,
                width: 600,
                height: 600,
                borderRadius: "50%",
                background: "radial-gradient(circle, rgba(230, 160, 70, 0.22) 0%, transparent 70%)",
              }}
            />

            {/* Wooden Hallway Table */}
            <div
              style={{
                position: "absolute",
                bottom: 300,
                width: 850,
                height: 480,
                backgroundColor: "#20140b",
                borderRadius: 16,
                borderTop: "14px solid #3d2716",
                boxShadow: "0 30px 100px rgba(0,0,0,0.9)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                paddingTop: 50,
              }}
            >
              {/* 1970s Black Rotary Phone Body */}
              <div
                style={{
                  width: 440,
                  height: 260,
                  backgroundColor: "#111417",
                  borderRadius: "30px 30px 15px 15px",
                  boxShadow: "inset 0 10px 20px rgba(255,255,255,0.06), 0 20px 40px rgba(0,0,0,0.8)",
                  position: "relative",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {/* Rotary Dial */}
                <div
                  style={{
                    width: 170,
                    height: 170,
                    borderRadius: "50%",
                    backgroundColor: "#e0dacf",
                    border: "12px solid #22262c",
                    boxShadow: "inset 0 0 15px rgba(0,0,0,0.5)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    position: "relative",
                  }}
                >
                  <div
                    style={{
                      width: 50,
                      height: 50,
                      borderRadius: "50%",
                      backgroundColor: "#15181c",
                    }}
                  />
                  {/* Rotary holes */}
                  {[0, 36, 72, 108, 144, 180, 216, 252, 288, 324].map((deg, i) => (
                    <div
                      key={i}
                      style={{
                        position: "absolute",
                        width: 22,
                        height: 22,
                        borderRadius: "50%",
                        backgroundColor: "#ffffff",
                        border: "2px solid #555",
                        transform: `rotate(${deg}deg) translate(58px)`,
                      }}
                    />
                  ))}
                </div>

                {/* Receiver resting on top, trembling subtly */}
                <div
                  style={{
                    position: "absolute",
                    top: -55,
                    width: 490,
                    height: 80,
                    backgroundColor: "#171a1f",
                    borderRadius: 40,
                    border: "3px solid #262c33",
                    boxShadow: "0 10px 25px rgba(0,0,0,0.8)",
                    transform: `rotate(${Math.sin(frame * 0.4) * 0.6}deg)`,
                  }}
                />

                {/* Coiled Phone Cord */}
                <div
                  style={{
                    position: "absolute",
                    bottom: -80,
                    right: 40,
                    width: 12,
                    height: 120,
                    borderLeft: "6px dashed #262c33",
                    transform: `rotate(${Math.sin(frame * 0.5) * 4}deg)`,
                  }}
                />
              </div>
            </div>

            {/* Emotional context badge */}
            <div
              style={{
                position: "absolute",
                top: 90,
                left: 60,
                color: "#99aabb",
                fontSize: 22,
                letterSpacing: 2,
              }}
            >
              [INTERIOR // 2076 S. LINCOLN ST // ALONE]
            </div>
          </AbsoluteFill>
        )}

        {/* ============================================================ */}
        {/* SCENE 4: DARK REAR WINDOW POV (27.50 - 34.00s) */}
        {/* ============================================================ */}
        {time >= 27.5 && time < 34.0 && (
          <AbsoluteFill
            style={{
              backgroundColor: "#030508",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
            }}
          >
            {/* Camera slow creepy zoom towards window */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transform: `scale(${interpolate(frame - 825, [0, 195], [1.0, 1.25])})`,
              }}
            >
              {/* Window Frame */}
              <div
                style={{
                  width: 720,
                  height: 1100,
                  backgroundColor: "#080c12",
                  border: "28px solid #141c26",
                  position: "relative",
                  boxShadow: "0 0 120px rgba(0,0,0,1)",
                }}
              >
                {/* Outside Darkness & Rain Streaks */}
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: "radial-gradient(circle at 50% 50%, #101924 0%, #030507 80%)",
                    overflow: "hidden",
                  }}
                >
                  {/* Silhouette of human face/hands suddenly appearing outside */}
                  <div
                    style={{
                      position: "absolute",
                      bottom: 200,
                      left: "50%",
                      transform: "translateX(-50%)",
                      width: 280,
                      height: 420,
                      backgroundColor: "#010204",
                      borderRadius: "140px 140px 50px 50px",
                      opacity: interpolate(frame - 825, [60, 120], [0.2, 0.95]),
                      filter: "blur(6px)",
                    }}
                  >
                    {/* Shadow Hands pressing on glass */}
                    <div
                      style={{
                        position: "absolute",
                        top: 100,
                        left: -60,
                        width: 70,
                        height: 90,
                        borderRadius: 20,
                        backgroundColor: "#010204",
                        filter: "blur(8px)",
                      }}
                    />
                    <div
                      style={{
                        position: "absolute",
                        top: 100,
                        right: -60,
                        width: 70,
                        height: 90,
                        borderRadius: 20,
                        backgroundColor: "#010204",
                        filter: "blur(8px)",
                      }}
                    />
                  </div>
                </div>

                {/* Window Mullions */}
                <div
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: 0,
                    right: 0,
                    height: 16,
                    backgroundColor: "#141c26",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    left: "50%",
                    top: 0,
                    bottom: 0,
                    width: 16,
                    backgroundColor: "#141c26",
                  }}
                />
              </div>
            </div>

            <div
              style={{
                position: "absolute",
                top: 90,
                left: 60,
                color: "#ff4444",
                fontSize: 22,
                letterSpacing: 2,
              }}
            >
              [PERIMETER BREACH DETECTED // REAR GLASS]
            </div>
          </AbsoluteFill>
        )}

        {/* ============================================================ */}
        {/* SCENE 5: THE BREACH CLIMAX / RED ALARM STROBE (34.00 - 45.00s) */}
        {/* ============================================================ */}
        {isAlarmClimax && (
          <AbsoluteFill
            style={{
              backgroundColor: flashCycle ? "#770000" : "#0a0002",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "background 0.05s linear",
            }}
          >
            {/* Rapid Strobe Flash FX */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  flashCycle
                    ? "radial-gradient(circle, rgba(255, 30, 30, 0.4) 0%, rgba(20, 0, 0, 0.95) 100%)"
                    : "rgba(0, 0, 0, 0.9)",
              }}
            />

            {/* Shattered Glass Fracture Lines (SVG) */}
            <svg
              style={{
                position: "absolute",
                width: "100%",
                height: "100%",
                opacity: 0.85,
              }}
              viewBox="0 0 1080 1920"
            >
              <line x1="540" y1="960" x2="0" y2="200" stroke="#ffcccc" strokeWidth="6" />
              <line x1="540" y1="960" x2="1080" y2="400" stroke="#ffffff" strokeWidth="8" />
              <line x1="540" y1="960" x2="900" y2="1800" stroke="#ff9999" strokeWidth="5" />
              <line x1="540" y1="960" x2="150" y2="1600" stroke="#ffffff" strokeWidth="7" />
              <line x1="540" y1="960" x2="1080" y2="1100" stroke="#ffaaaa" strokeWidth="5" />
              <line x1="540" y1="960" x2="0" y2="1200" stroke="#ffffff" strokeWidth="6" />
              <circle cx="540" cy="960" r="140" stroke="#ffffff" strokeWidth="8" fill="none" />
              <circle cx="540" cy="960" r="260" stroke="#ff4444" strokeWidth="4" fill="none" />
            </svg>

            {/* Flashing Urgent Dispatch CAD Box */}
            <div
              style={{
                zIndex: 20,
                textAlign: "center",
                padding: "40px 60px",
                backgroundColor: "rgba(0, 0, 0, 0.85)",
                border: "6px solid #ff0033",
                boxShadow: "0 0 80px #ff0033",
                maxWidth: 920,
              }}
            >
              <div
                style={{
                  color: "#ff0033",
                  fontSize: 54,
                  fontWeight: 900,
                  letterSpacing: 4,
                  marginBottom: 20,
                }}
              >
                CRITICAL SIGNAL LOST
              </div>
              <div
                style={{
                  color: "#ffffff",
                  fontSize: 32,
                  fontWeight: 700,
                  lineHeight: 1.5,
                  letterSpacing: 2,
                }}
              >
                UNIT 12 EN ROUTE — PRIORITY 1 CODE 3
                <br />
                <span style={{ color: "#ffcc00" }}>EMERGENCY FORCED ENTRY REPORTED</span>
              </div>
            </div>
          </AbsoluteFill>
        )}

        {/* ============================================================ */}
        {/* SCENE 6: AFTERMATH POLICE DOSSIER (45.00 - 54.48s) */}
        {/* ============================================================ */}
        {time >= 45.0 && (
          <AbsoluteFill
            style={{
              backgroundColor: "#07090c",
              padding: "120px 80px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            {/* Dossier Header */}
            <div>
              <div
                style={{
                  color: "#8899aa",
                  fontSize: 26,
                  fontWeight: 700,
                  letterSpacing: 3,
                  borderBottom: "2px solid #223344",
                  paddingBottom: 20,
                }}
              >
                INCIDENT SUMMARY // OFFICIAL ARCHIVE DOSSIER
              </div>
              <div style={{ color: "#44dd88", fontSize: 22, marginTop: 16 }}>
                STATUS: CLOSED // TRAINING ARCHIVE VAULT
              </div>
            </div>

            {/* Typed Russian Police Facts */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 32,
                backgroundColor: "rgba(15, 22, 32, 0.7)",
                border: "2px solid #223348",
                padding: "50px 40px",
                borderRadius: 8,
              }}
            >
              {[
                "Патрульная машина прибыла через 3 минуты 40 секунд.",
                "Входная дверь была сорвана с петель и разбита.",
                "Телефонная трубка всё ещё свисала на проводе.",
                "Запись стала хрестоматийным обучающим материалом для диспетчерских служб всего мира.",
              ].map((line, idx) => {
                const lineAppearTime = 46.0 + idx * 2.0;
                const isVisible = time >= lineAppearTime;
                return (
                  <div
                    key={idx}
                    style={{
                      opacity: isVisible ? 1 : 0,
                      transform: isVisible ? "none" : "translateY(15px)",
                      transition: "all 0.4s ease-out",
                      display: "flex",
                      gap: 20,
                      alignItems: "flex-start",
                    }}
                  >
                    <span style={{ color: "#ff4444", fontSize: 32, fontWeight: 900 }}>
                      ▶
                    </span>
                    <span
                      style={{
                        color: "#e2e8f0",
                        fontSize: 30,
                        fontWeight: 600,
                        lineHeight: 1.45,
                      }}
                    >
                      {line}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Static Bottom Note */}
            <div
              style={{
                color: "#64748b",
                fontSize: 20,
                textAlign: "center",
                letterSpacing: 2,
              }}
            >
              ARCHIVE RECONSTRUCTION // REMOTION ENGINE
            </div>
          </AbsoluteFill>
        )}
      </AbsoluteFill>

      {/* 3. DYNAMIC KINETIC RUSSIAN SUBTITLES (Pinned at 78% height) */}
      {activeSub && (
        <div
          style={{
            position: "absolute",
            bottom: 340,
            left: 60,
            right: 60,
            zIndex: 50,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
          }}
        >
          {/* Speaker Tag */}
          <div
            style={{
              fontSize: 22,
              fontWeight: 800,
              letterSpacing: 3,
              padding: "6px 18px",
              borderRadius: 4,
              marginBottom: 14,
              backgroundColor:
                activeSub.speaker === "OPERATOR"
                  ? "#0066cc"
                  : activeSub.speaker === "RUTH"
                  ? "#cc3300"
                  : "#990000",
              color: "#ffffff",
              boxShadow: "0 4px 15px rgba(0,0,0,0.5)",
            }}
          >
            {activeSub.speaker === "OPERATOR"
              ? "ДИСПЕТЧЕР 911"
              : activeSub.speaker === "RUTH"
              ? "РУТ ПРАЙС (ЖЕРТВА)"
              : "ЭКСТРЕННАЯ СЛУЖБА"}
          </div>

          {/* Russian Translation Highlight */}
          <div
            style={{
              backgroundColor: "rgba(5, 7, 10, 0.88)",
              border: "2px solid rgba(255, 255, 255, 0.2)",
              borderRadius: 12,
              padding: "20px 32px",
              boxShadow: "0 10px 40px rgba(0,0,0,0.8)",
            }}
          >
            <div
              style={{
                fontSize: 38,
                fontWeight: 900,
                color: "#ffffff",
                lineHeight: 1.35,
                textShadow: "0 2px 10px rgba(0,0,0,0.9)",
              }}
            >
              {activeSub.textRu}
            </div>
            <div
              style={{
                fontSize: 24,
                color: "#94a3b8",
                marginTop: 8,
                fontWeight: 500,
                fontStyle: "italic",
              }}
            >
              « {activeSub.textEn} »
            </div>
          </div>
        </div>
      )}

      {/* 4. ANALOG CRT OVERLAYS & NOISE GRAIN */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          opacity: 0.18,
          background: `repeating-linear-gradient(0deg, rgba(0,0,0,0.8) 0px, rgba(0,0,0,0.8) 2px, transparent 2px, transparent 4px)`,
          transform: `translateY(${scanlineOffset}px)`,
        }}
      />
      {/* Vignette */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          boxShadow: "inset 0 0 160px rgba(0,0,0,0.9)",
        }}
      />
    </AbsoluteFill>
  );
};
