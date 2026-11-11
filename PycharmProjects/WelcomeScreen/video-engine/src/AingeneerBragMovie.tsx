import React from "react";
import {
  AbsoluteFill,
  Audio,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import wordsData from "../public/aingeneer_launch_words.json";

export const AingeneerBragMovie: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const curSec = frame / fps;

  // Active word for subtitles
  const activeWordObj = wordsData.find((w: any) => curSec >= w.start && curSec < w.end);
  const activeWordIdx = wordsData.findIndex((w: any) => curSec >= w.start && curSec < w.end);

  // Dynamic Camera / Zoom
  const camZoom = interpolate(
    curSec,
    [0, 4.0, 8.0, 16.0, 23.5, 31.0],
    [1.0, 1.05, 1.0, 1.06, 1.0, 1.04],
    { extrapolateRight: "clamp" }
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#07090E",
        overflow: "hidden",
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
        color: "#F8FAFC",
      }}
    >
      <Audio src={staticFile("aingeneer_launch_audio.mp3")} />

      {/* BACKGROUND GRID & AMBIENT GLOW */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `
            radial-gradient(circle at 50% 20%, rgba(56, 189, 248, 0.15) 0%, transparent 60%),
            radial-gradient(circle at 80% 80%, rgba(139, 92, 246, 0.12) 0%, transparent 50%),
            linear-gradient(to right, rgba(255, 255, 255, 0.03) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.03) 1px, transparent 1px)
          `,
          backgroundSize: "100% 100%, 100% 100%, 60px 60px, 60px 60px",
          transform: `scale(${camZoom})`,
          transformOrigin: "center center",
        }}
      />

      {/* TOP BRAND BADGE */}
      <div
        style={{
          position: "absolute",
          top: "60px",
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          padding: "10px 24px",
          borderRadius: "9999px",
          background: "rgba(14, 19, 31, 0.8)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(56, 189, 248, 0.3)",
          boxShadow: "0 0 25px rgba(56, 189, 248, 0.2)",
          zIndex: 50,
        }}
      >
        <div
          style={{
            width: "10px",
            height: "10px",
            borderRadius: "50%",
            backgroundColor: "#10B981",
            boxShadow: "0 0 10px #10B981",
          }}
        />
        <span style={{ fontSize: "20px", fontWeight: 800, letterSpacing: "1px" }}>
          AIngeneer<span style={{ color: "#38BDF8" }}>.com</span>
        </span>
        <span style={{ fontSize: "14px", color: "#94A3B8", fontFamily: "monospace" }}>
          [v2.4.0]
        </span>
      </div>

      {/* SCENE CONTENT SWITCHER */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transform: `scale(${camZoom})`,
          transformOrigin: "center center",
          padding: "0 40px",
        }}
      >
        {/* ======================================================== */}
        {/* SCENE 1 (0.0s - 4.2s): THE HOOK                          */}
        {/* "Хватит гонять бессмысленные чат-боты"                   */}
        {/* ======================================================== */}
        {curSec < 4.2 && (
          <div style={{ textAlign: "center", width: "100%", maxWidth: "880px" }}>
            {/* Cancelled Chatbot bubble */}
            <div
              style={{
                position: "relative",
                padding: "30px 40px",
                borderRadius: "28px",
                background: "rgba(30, 41, 59, 0.7)",
                border: "2px solid #EF4444",
                boxShadow: "0 0 40px rgba(239, 68, 68, 0.3)",
                marginBottom: "40px",
              }}
            >
              <div style={{ fontSize: "36px", color: "#94A3B8", marginBottom: "12px", fontFamily: "monospace" }}>
                "As an AI language model, I cannot..."
              </div>
              {/* Giant Red Cross Strike */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "140px",
                  fontWeight: 900,
                  color: "#EF4444",
                  textShadow: "0 0 30px rgba(239, 68, 68, 0.9)",
                  transform: "rotate(-12deg)",
                }}
              >
                ✕ NO MORE
              </div>
            </div>

            <div
              style={{
                fontSize: "64px",
                fontWeight: 900,
                lineHeight: "1.1",
                textTransform: "uppercase",
                letterSpacing: "-1px",
              }}
            >
              ХВАТИТ ГОНЯТЬ <br />
              <span style={{ color: "#EF4444", textShadow: "0 0 30px rgba(239, 68, 68, 0.6)" }}>
                БЕССМЫСЛЕННЫЕ ЧАТ-БОТЫ
              </span>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* SCENE 2 (4.2s - 8.2s): THE REVEAL                        */}
        {/* "Встречайте AIngeneer — студию автономных агентов"       */}
        {/* ======================================================== */}
        {curSec >= 4.2 && curSec < 8.2 && (
          <div style={{ textAlign: "center", width: "100%", maxWidth: "900px" }}>
            {/* Big Glowing Logo */}
            <div
              style={{
                width: "160px",
                height: "160px",
                margin: "0 auto 36px",
                borderRadius: "36px",
                background: "linear-gradient(135deg, #38BDF8 0%, #2563EB 50%, #7C3AED 100%)",
                padding: "3px",
                boxShadow: "0 0 60px rgba(56, 189, 248, 0.4)",
              }}
            >
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  borderRadius: "33px",
                  background: "#07090E",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "72px",
                  fontWeight: 900,
                  color: "#38BDF8",
                  fontFamily: "monospace",
                }}
              >
                AI
              </div>
            </div>

            <div
              style={{
                fontSize: "76px",
                fontWeight: 900,
                letterSpacing: "-2px",
                marginBottom: "16px",
                background: "linear-gradient(to right, #FFFFFF, #38BDF8)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              AIngeneer
            </div>

            <div
              style={{
                fontSize: "36px",
                fontWeight: 800,
                color: "#E2E8F0",
                textTransform: "uppercase",
                letterSpacing: "2px",
                marginBottom: "24px",
              }}
            >
              Студия автономных <br />
              <span style={{ color: "#38BDF8" }}>инженерных агентов</span>
            </div>

            <div
              style={{
                display: "inline-block",
                padding: "12px 30px",
                borderRadius: "16px",
                background: "rgba(56, 189, 248, 0.1)",
                border: "1px solid rgba(56, 189, 248, 0.3)",
                fontSize: "24px",
                color: "#38BDF8",
                fontFamily: "monospace",
                fontWeight: 700,
              }}
            >
              ⚡ 0% Чат-ботов · 100% Детерминированный Код
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* SCENE 3 (8.2s - 16.0s): ENTERPRISE OCR AGENT             */}
        {/* "Один агент парсит сложные накладные Lieferschein..."    */}
        {/* ======================================================== */}
        {curSec >= 8.2 && curSec < 16.0 && (
          <div style={{ width: "100%", maxWidth: "940px" }}>
            <div
              style={{
                textAlign: "center",
                fontSize: "24px",
                fontWeight: 900,
                color: "#38BDF8",
                letterSpacing: "2px",
                textTransform: "uppercase",
                marginBottom: "20px",
                fontFamily: "monospace",
              }}
            >
              /lieferschein-ocr · Bavarian Logistics
            </div>

            {/* Document Scanner Hologram Card */}
            <div
              style={{
                borderRadius: "28px",
                background: "#0E131F",
                border: "2px solid rgba(56, 189, 248, 0.4)",
                padding: "36px",
                boxShadow: "0 0 50px rgba(56, 189, 248, 0.2)",
                position: "relative",
                overflow: "hidden",
              }}
            >
              {/* Laser Scan Line moving up and down */}
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  height: "4px",
                  background: "linear-gradient(90deg, transparent, #38BDF8, #FFF, #38BDF8, transparent)",
                  boxShadow: "0 0 20px #38BDF8",
                  top: `${(Math.sin(frame * 0.12) * 0.5 + 0.5) * 85 + 5}%`,
                  zIndex: 10,
                }}
              />

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", borderBottom: "1px solid #1E293B", pb: "16px" }}>
                <div>
                  <div style={{ fontSize: "28px", fontWeight: 800, color: "#FFF" }}>Lieferschein #LS-88421</div>
                  <div style={{ fontSize: "18px", color: "#94A3B8" }}>Private Landbrauerei Schönram · Freilassing</div>
                </div>
                <div style={{ padding: "8px 18px", borderRadius: "12px", background: "#10B98120", border: "1px solid #10B981", color: "#10B981", fontSize: "18px", fontWeight: 800 }}>
                  ✓ 99.4% OCR ACCURACY
                </div>
              </div>

              {/* Items Table */}
              <div style={{ fontFamily: "monospace", fontSize: "20px", spaceY: "14px", color: "#CBD5E1" }}>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #1E293B40" }}>
                  <span>24x Kiste Schönramer Hell (20x0.5L)</span>
                  <span style={{ color: "#38BDF8", fontWeight: 700 }}>VERIFIED</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #1E293B40" }}>
                  <span>12x Kiste Schönramer Pils (20x0.5L)</span>
                  <span style={{ color: "#38BDF8", fontWeight: 700 }}>VERIFIED</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0" }}>
                  <span>50x Pfand Euro-Kiste + 720x Flaschen</span>
                  <span style={{ color: "#10B981", fontWeight: 700 }}>SYNCED TO DATEV</span>
                </div>
              </div>
            </div>

            <div
              style={{
                marginTop: "24px",
                textAlign: "center",
                fontSize: "24px",
                fontWeight: 800,
                color: "#10B981",
              }}
            >
              Прямая синхронизация с ERP складов без ошибок оператора
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* SCENE 4 (16.0s - 23.5s): QUANT INTELLIGENCE & MONTE CARLO */}
        {/* "Второй — отслеживает отчеты конгрессменов..."             */}
        {/* ======================================================== */}
        {curSec >= 16.0 && curSec < 23.5 && (
          <div style={{ width: "100%", maxWidth: "940px" }}>
            <div
              style={{
                textAlign: "center",
                fontSize: "24px",
                fontWeight: 900,
                color: "#FACC15",
                letterSpacing: "2px",
                textTransform: "uppercase",
                marginBottom: "20px",
                fontFamily: "monospace",
              }}
            >
              /trader-pelosi + /trader-timemachine
            </div>

            {/* Quant Intelligence Card */}
            <div
              style={{
                borderRadius: "28px",
                background: "#0E131F",
                border: "2px solid rgba(250, 204, 21, 0.4)",
                padding: "36px",
                boxShadow: "0 0 50px rgba(250, 204, 21, 0.2)",
              }}
            >
              {/* Congressional Alert */}
              <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "24px" }}>
                <div style={{ padding: "10px 16px", borderRadius: "12px", background: "#FACC1520", color: "#FACC15", fontSize: "20px", fontWeight: 900 }}>
                  HOUSE CLERK PTR
                </div>
                <div style={{ fontSize: "24px", fontWeight: 800, color: "#FFF" }}>
                  Hon. Nancy Pelosi · NVDA Call Options ($5M)
                </div>
              </div>

              {/* Monte Carlo Visual Bars */}
              <div style={{ borderTop: "1px solid #1E293B", paddingTop: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "20px", fontFamily: "monospace", color: "#94A3B8", marginBottom: "10px" }}>
                  <span>10,000 MONTE CARLO SESSIONS</span>
                  <span style={{ color: "#10B981", fontWeight: 700 }}>WIN EXPECTANCY +1.84R</span>
                </div>

                {/* Progress Bar 64% vs 28% */}
                <div style={{ width: "100%", height: "32px", borderRadius: "10px", background: "#1E293B", overflow: "hidden", display: "flex" }}>
                  <div style={{ width: "64.2%", background: "#10B981", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", fontWeight: 900, color: "#000" }}>
                    64.2% TARGET FIRST
                  </div>
                  <div style={{ width: "28.1%", background: "#EF4444", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", fontWeight: 900, color: "#FFF" }}>
                    28.1% STOP
                  </div>
                  <div style={{ width: "7.7%", background: "#F59E0B" }} />
                </div>
              </div>

              <div style={{ marginTop: "24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontSize: "18px", color: "#94A3B8", fontFamily: "monospace" }}>
                  Strict Risk: Max 1% Drawdown / Prop-Firm Ready
                </div>
                <div style={{ color: "#38BDF8", fontSize: "18px", fontWeight: 800 }}>
                  LATENCY &lt; 200MS
                </div>
              </div>
            </div>

            <div
              style={{
                marginTop: "24px",
                textAlign: "center",
                fontSize: "24px",
                fontWeight: 800,
                color: "#FACC15",
              }}
            >
              Ни цента на удачу: 10,000 симуляций до входа в сделку
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* SCENE 5 (23.5s - 31.0s): OUTRO & FOUNDER & CTA           */}
        {/* "Никаких галлюцинаций. Чистый код. Создано Александром"   */}
        {/* ======================================================== */}
        {curSec >= 23.5 && (
          <div style={{ textAlign: "center", width: "100%", maxWidth: "920px" }}>
            <div
              style={{
                fontSize: "36px",
                fontWeight: 900,
                color: "#38BDF8",
                letterSpacing: "3px",
                textTransform: "uppercase",
                marginBottom: "16px",
              }}
            >
              НИКАКИХ ГАЛЛЮЦИНАЦИЙ
            </div>

            <div
              style={{
                fontSize: "64px",
                fontWeight: 900,
                lineHeight: "1.15",
                marginBottom: "36px",
              }}
            >
              ЧИСТЫЙ ДЕТЕРМИНИРОВАННЫЙ <br />
              <span style={{ color: "#10B981" }}>КОД И АГЕНТЫ</span>
            </div>

            {/* Founder Card */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "20px",
                padding: "16px 36px",
                borderRadius: "24px",
                background: "rgba(14, 19, 31, 0.9)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                marginBottom: "40px",
              }}
            >
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "16px",
                  background: "linear-gradient(135deg, #38BDF8, #6366F1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "24px",
                  fontWeight: 900,
                  color: "#FFF",
                }}
              >
                OS
              </div>
              <div style={{ textAlign: "left" }}>
                <div style={{ fontSize: "26px", fontWeight: 800, color: "#FFF" }}>Oleksandr Syrota</div>
                <div style={{ fontSize: "18px", color: "#94A3B8" }}>B.Sc. Artificial Intelligence · PLUS Salzburg</div>
              </div>
            </div>

            {/* CTA Button */}
            <div>
              <div
                style={{
                  display: "inline-block",
                  padding: "24px 60px",
                  borderRadius: "24px",
                  background: "linear-gradient(90deg, #38BDF8, #2563EB)",
                  color: "#000",
                  fontSize: "36px",
                  fontWeight: 900,
                  letterSpacing: "1px",
                  boxShadow: "0 0 50px rgba(56, 189, 248, 0.5)",
                }}
              >
                aingeneer.com ➔
              </div>
            </div>
          </div>
        )}
      </div>

      {/* KINETIC WHISPER SUBTITLES */}
      <div
        style={{
          position: "absolute",
          bottom: "100px",
          width: "100%",
          display: "flex",
          justifyContent: "center",
          flexWrap: "wrap",
          gap: "16px",
          padding: "0 50px",
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
                  fontSize: isActive ? "52px" : "40px",
                  fontWeight: 900,
                  color: isActive ? "#38BDF8" : "#E2E8F0",
                  textShadow: isActive
                    ? "0 0 35px rgba(56, 189, 248, 0.95), 0 4px 12px rgba(0,0,0,0.95)"
                    : "0 4px 10px rgba(0,0,0,0.95)",
                  transform: isActive ? "scale(1.18)" : "scale(1.0)",
                  transition: "all 0.05s ease",
                  display: "inline-block",
                  fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
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
