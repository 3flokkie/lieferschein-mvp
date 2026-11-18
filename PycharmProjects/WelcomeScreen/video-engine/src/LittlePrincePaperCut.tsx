import React, { useMemo } from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  Audio,
  staticFile,
} from "remotion";

// Exact Word-Level Timestamps from ElevenLabs alignment
interface StorySubtitle {
  start: number;
  end: number;
  speaker: "СКАЗКА" | "МАЛЕНЬКИЙ ПРИНЦ" | "ЛИС";
  text: string;
}

const SUBTITLES: StorySubtitle[] = [
  { start: 0.0, end: 3.86, speaker: "СКАЗКА", text: "Среди миллиардов холодных равнодушных звезд кружился" },
  { start: 3.86, end: 4.5, speaker: "СКАЗКА", text: "крошечный" },
  { start: 4.5, end: 6.1, speaker: "СКАЗКА", text: "астероид Б-612." },
  { start: 7.3, end: 9.14, speaker: "СКАЗКА", text: "На нем жил мальчик и золотистыми" },
  { start: 9.14, end: 9.72, speaker: "СКАЗКА", text: "волосами." },
  { start: 10.92, end: 12.74, speaker: "СКАЗКА", text: "Каждое утро он аккуратно чей стил" },
  { start: 12.74, end: 13.42, speaker: "СКАЗКА", text: "жерла своих" },
  { start: 13.42, end: 16.94, speaker: "СКАЗКА", text: "вулканов и бережно выпалывал ростки баобабов," },
  { start: 17.66, end: 18.08, speaker: "СКАЗКА", text: "чтобы они" },
  { start: 18.08, end: 19.62, speaker: "СКАЗКА", text: "не разорвали планету на части." },
  { start: 20.34, end: 22.1, speaker: "СКАЗКА", text: "Он был совсем один," },
  { start: 22.62, end: 24.32, speaker: "СКАЗКА", text: "пока однажды из зерна не распустилась" },
  { start: 24.32, end: 26.66, speaker: "СКАЗКА", text: "прекрасная гордая роза." },
  { start: 26.66, end: 29.82, speaker: "СКАЗКА", text: "Но приспособился лишь комьюн и еще" },
  { start: 29.82, end: 30.58, speaker: "СКАЗКА", text: "не умел любить" },
  { start: 30.58, end: 31.64, speaker: "СКАЗКА", text: "ее по -настоящему." },
  { start: 33.94, end: 35.54, speaker: "СКАЗКА", text: "В поисках ответов," },
  { start: 35.74, end: 35.9, speaker: "СКАЗКА", text: "в принципе," },
  { start: 36.12, end: 37.26, speaker: "СКАЗКА", text: "покинул свой дом и обошел" },
  { start: 37.26, end: 38.12, speaker: "СКАЗКА", text: "множество миров," },
  { start: 38.8, end: 40.3, speaker: "СКАЗКА", text: "пока не опустился на землю." },
  { start: 41.08, end: 41.36, speaker: "СКАЗКА", text: "Там," },
  { start: 41.74, end: 43.4, speaker: "СКАЗКА", text: "под кроной старой яблоне," },
  { start: 43.74, end: 44.62, speaker: "СКАЗКА", text: "он встретил дикого" },
  { start: 44.62, end: 45.08, speaker: "СКАЗКА", text: "Лиса." },
  { start: 46.66, end: 47.76, speaker: "СКАЗКА", text: "Поиграет со мной," },
  { start: 48.1, end: 48.98, speaker: "СКАЗКА", text: "попросил мальчик." },
  { start: 49.58, end: 50.4, speaker: "СКАЗКА", text: "Меток грустно." },
  { start: 51.3, end: 52.62, speaker: "СКАЗКА", text: "Я не могу играть с тобой," },
  { start: 53.12, end: 54.16, speaker: "СКАЗКА", text: "тихо ответил Лис." },
  { start: 54.8, end: 55.8, speaker: "СКАЗКА", text: "Я еще не приручен." },
  { start: 55.8, end: 57.5, speaker: "СКАЗКА", text: "А что это значит," },
  { start: 57.98, end: 58.56, speaker: "СКАЗКА", text: "приручить?" },
  { start: 59.52, end: 63.04, speaker: "СКАЗКА", text: "Это значит создать невидимые сердечные узы." },
  { start: 64.38, end: 64.86, speaker: "СКАЗКА", text: "Смотри," },
  { start: 65.36, end: 66.48, speaker: "СКАЗКА", text: "для меня ты пока всего лишь" },
  { start: 66.48, end: 67.38, speaker: "СКАЗКА", text: "маленький мальчик." },
  { start: 67.86, end: 68.72, speaker: "СКАЗКА", text: "То есть он такой же," },
  { start: 68.92, end: 70.8, speaker: "СКАЗКА", text: "как 100 тысяч других мальчиков." },
  { start: 71.46, end: 72.52, speaker: "СКАЗКА", text: "И ты мне не нужен," },
  { start: 73.1, end: 74.92, speaker: "СКАЗКА", text: "а я для тебя лишь рыжая" },
  { start: 74.92, end: 75.38, speaker: "СКАЗКА", text: "лисица," },
  { start: 76.0, end: 76.54, speaker: "СКАЗКА", text: "такая же," },
  { start: 76.7, end: 77.86, speaker: "СКАЗКА", text: "как сотни тысяч других." },
  { start: 79.08, end: 80.86, speaker: "СКАЗКА", text: "Но если ты приручишь меня," },
  { start: 81.48, end: 82.78, speaker: "СКАЗКА", text: "мы станем даже друг другу." },
  { start: 82.78, end: 85.32, speaker: "СКАЗКА", text: "Во всей селенной ты будешь для" },
  { start: 85.32, end: 86.26, speaker: "СКАЗКА", text: "меня единственным." },
  { start: 86.84, end: 89.14, speaker: "СКАЗКА", text: "И я для тебя буду один" },
  { start: 89.14, end: 90.48, speaker: "СКАЗКА", text: "на всем белом свете." },
  { start: 92.16, end: 92.7, speaker: "СКАЗКА", text: "Видишь," },
  { start: 92.84, end: 94.28, speaker: "СКАЗКА", text: "дали золотые поля Пшеницы." },
  { start: 95.2, end: 96.42, speaker: "СКАЗКА", text: "Я не ем хлеба." },
  { start: 96.96, end: 98.02, speaker: "СКАЗКА", text: "Колосем меня ни о чем не" },
  { start: 98.02, end: 98.5, speaker: "СКАЗКА", text: "говорили." },
  { start: 99.3, end: 101.2, speaker: "СКАЗКА", text: "Но у тебя золотые волосы." },
  { start: 102.0, end: 102.44, speaker: "СКАЗКА", text: "И теперь," },
  { start: 102.52, end: 104.1, speaker: "СКАЗКА", text: "даже тихий шум ветра в спелой" },
  { start: 104.1, end: 104.56, speaker: "СКАЗКА", text: "Пшеницы" },
  { start: 104.56, end: 105.96, speaker: "СКАЗКА", text: "будет напоминать меня тебе." },
  { start: 107.6, end: 108.2, speaker: "СКАЗКА", text: "Маленький," },
  { start: 108.3, end: 108.56, speaker: "СКАЗКА", text: "в принципе," },
  { start: 108.76, end: 109.52, speaker: "СКАЗКА", text: "ручил Лиса," },
  { start: 110.02, end: 110.68, speaker: "СКАЗКА", text: "а когда настал" },
  { start: 110.68, end: 112.64, speaker: "СКАЗКА", text: "сейчас прощание лис заплакал." },
  { start: 113.44, end: 114.74, speaker: "СКАЗКА", text: "Но ты сам меня ватт," },
  { start: 114.88, end: 115.78, speaker: "СКАЗКА", text: "растерялся мальчик." },
  { start: 116.36, end: 117.38, speaker: "СКАЗКА", text: "Я ведь не хотел делать тебе" },
  { start: 117.38, end: 117.84, speaker: "СКАЗКА", text: "больно." },
  { start: 118.72, end: 119.5, speaker: "СКАЗКА", text: "Мне не больно," },
  { start: 119.98, end: 121.74, speaker: "СКАЗКА", text: "улыбнулся лис с коей слезы." },
  { start: 122.4, end: 123.3, speaker: "СКАЗКА", text: "Мне стало лучше." },
  { start: 123.96, end: 124.46, speaker: "СКАЗКА", text: "Вспомни," },
  { start: 124.72, end: 125.98, speaker: "СКАЗКА", text: "а золотые спелые Пшеницы." },
  { start: 129.72, end: 130.8, speaker: "СКАЗКА", text: "А теперь ступай," },
  { start: 131.44, end: 132.86, speaker: "СКАЗКА", text: "но прежде запомни мой секрет." },
  { start: 133.62, end: 134.32, speaker: "СКАЗКА", text: "Он очень прост." },
  { start: 135.66, end: 137.08, speaker: "СКАЗКА", text: "Зорка одно лишь сердца." },
  { start: 137.72, end: 139.7, speaker: "СКАЗКА", text: "Самого главного глазами не увидишь." },
  { start: 140.62, end: 141.0, speaker: "СКАЗКА", text: "Маленький," },
  { start: 141.12, end: 141.26, speaker: "СКАЗКА", text: "в принципе," },
  { start: 141.42, end: 142.18, speaker: "СКАЗКА", text: "повторил эти слова," },
  { start: 142.76, end: 142.98, speaker: "СКАЗКА", text: "чтобы" },
  { start: 142.98, end: 144.9, speaker: "СКАЗКА", text: "навсегда сохранить их сей душа." },
  { start: 145.7, end: 147.02, speaker: "СКАЗКА", text: "Моя Роза так дорога мне," },
  { start: 147.16, end: 149.48, speaker: "СКАЗКА", text: "потому что я отдал ей столько" },
  { start: 149.48, end: 150.52, speaker: "СКАЗКА", text: "дней своей жизни." },
  { start: 151.66, end: 152.28, speaker: "СКАЗКА", text: "И помни," },
  { start: 152.86, end: 154.56, speaker: "СКАЗКА", text: "ты навсегда в ответе за тех," },
  { start: 155.02, end: 155.96, speaker: "СКАЗКА", text: "кого -то" },
  { start: 155.96, end: 156.92, speaker: "СКАЗКА", text: "однажды приручил." },
];

export const LittlePrincePaperCut: React.FC = () => {
  const frame = useCurrentFrame();
  const fps = 30;
  const time = frame / fps;

  // Active Subtitle
  const currentSub = useMemo(() => {
    return SUBTITLES.find((s) => time >= s.start && time < s.end);
  }, [time]);

  // Gentle breathing motion for paper characters
  const breath = Math.sin(frame * 0.05) * 3;
  const scarfWave = Math.sin(frame * 0.12) * 8;
  const foxTailWag = Math.sin(frame * 0.08) * 6;

  // Soft Cotton Paper Aesthetic Palette
  const paperColors = {
    nightSky: "#0a1128",
    deepIndigo: "#1c2541",
    softCream: "#fdfbf7",
    ivoryPaper: "#f4ede2",
    asteroidBase: "#e8ded1",
    asteroidCrater: "#d5c7b5",
    princeGold: "#f4c430",
    princeScarf: "#ffd166",
    princeCoat: "#3a86c8",
    roseRed: "#e63946",
    roseStem: "#588157",
    foxOrange: "#e76f51",
    foxCream: "#fefae0",
    sunWarmth: "#ffe3a8",
  };

  // Determine current active visual scene:
  // Scene 1: 0 - 23.4s -> Asteroid B-612 & The Rose in space
  // Scene 2: 23.4 - 41.0s -> Meeting under the Apple Tree on Earth
  // Scene 3: 41.0 - 62.9s -> Vast Golden Wheat Fields waving in the wind
  // Scene 4: 62.9 - 69.5s -> Sunset Parting & "Зорко одно лишь сердце"
  // Scene 5: 69.5 - 80.0s -> Night Sky, Stars, B-612 & Golden Final Quote

  return (
    <AbsoluteFill
      style={{
        backgroundColor: paperColors.deepIndigo,
        fontFamily: "'Georgia', serif, -apple-system, sans-serif",
        overflow: "hidden",
      }}
    >
      {/* 1. MASTER ELEVENLABS AUDIO TRACK */}
      <Audio src={staticFile("little_prince/sasha_master_voice.wav")} />

      {/* 2. PAPER CUTOUT SCENE STACK */}
      <AbsoluteFill>
        {/* ============================================================ */}
        {/* SCENE 1: ASTEROID B-612 & THE ROSE (0 - 23.4s) */}
        {/* ============================================================ */}
        {time < 34.0 && (
          <AbsoluteFill
            style={{
              background: "radial-gradient(ellipse at 50% 30%, #1c2541 0%, #080c18 100%)",
            }}
          >
            {/* Multi-layered Paper Stars */}
            {[...Array(28)].map((_, i) => {
              const starX = (i * 137.5) % 1000 + 40;
              const starY = (i * 219.3) % 1100 + 60;
              const starSize = (i % 3) * 6 + 10;
              const starTwinkle = 0.6 + Math.sin(frame * 0.08 + i) * 0.4;
              return (
                <div
                  key={i}
                  style={{
                    position: "absolute",
                    left: starX,
                    top: starY,
                    width: starSize,
                    height: starSize,
                    backgroundColor: paperColors.softCream,
                    clipPath:
                      "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)",
                    boxShadow: "0 4px 12px rgba(255,255,255,0.25)",
                    opacity: starTwinkle,
                  }}
                />
              );
            })}

            {/* Distant Paper Crescent Moon */}
            <div
              style={{
                position: "absolute",
                top: 180,
                right: 120,
                width: 130,
                height: 130,
                borderRadius: "50%",
                boxShadow: "inset 28px 10px 0 0 #fefae0",
                filter: "drop-shadow(0 10px 20px rgba(254, 250, 224, 0.2))",
              }}
            />

            {/* Asteroid B-612 */}
            <div
              style={{
                position: "absolute",
                bottom: -480,
                left: "50%",
                transform: "translateX(-50%)",
                width: 1400,
                height: 1400,
                borderRadius: "50%",
                backgroundColor: paperColors.asteroidBase,
                boxShadow: "0 -20px 60px rgba(0,0,0,0.5), inset 0 20px 40px rgba(255,255,255,0.4)",
              }}
            >
              {/* Paper Craters */}
              <div
                style={{
                  position: "absolute",
                  top: 140,
                  left: 360,
                  width: 160,
                  height: 90,
                  borderRadius: "50%",
                  backgroundColor: paperColors.asteroidCrater,
                  boxShadow: "inset 0 8px 15px rgba(0,0,0,0.25)",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  top: 220,
                  right: 380,
                  width: 220,
                  height: 110,
                  borderRadius: "50%",
                  backgroundColor: paperColors.asteroidCrater,
                  boxShadow: "inset 0 10px 18px rgba(0,0,0,0.25)",
                }}
              />

              {/* Volcano */}
              <div
                style={{
                  position: "absolute",
                  top: 30,
                  left: 450,
                  width: 90,
                  height: 70,
                  backgroundColor: "#cbbba6",
                  clipPath: "polygon(25% 0%, 75% 0%, 100% 100%, 0% 100%)",
                  boxShadow: "0 6px 15px rgba(0,0,0,0.2)",
                }}
              />
            </div>

            {/* THE ROSE (Under Glass Dome) */}
            <div
              style={{
                position: "absolute",
                bottom: 820,
                right: 280,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <div
                style={{
                  width: 140,
                  height: 220,
                  borderRadius: "70px 70px 15px 15px",
                  border: "4px solid rgba(255, 255, 255, 0.4)",
                  background:
                    "linear-gradient(135deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.05) 100%)",
                  boxShadow: "0 15px 35px rgba(0,0,0,0.3)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "flex-end",
                  paddingBottom: 25,
                  position: "relative",
                  backdropFilter: "blur(2px)",
                }}
              >
                {/* Rose Flower Head */}
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: "50% 50% 20% 50%",
                    backgroundColor: paperColors.roseRed,
                    boxShadow: "0 6px 15px rgba(230, 57, 70, 0.4)",
                    transform: `rotate(-15deg) scale(${1 + Math.sin(frame * 0.08) * 0.04})`,
                  }}
                />
                {/* Green Stem */}
                <div
                  style={{
                    width: 6,
                    height: 80,
                    backgroundColor: paperColors.roseStem,
                    borderRadius: 3,
                  }}
                />
                {/* Wooden base */}
                <div
                  style={{
                    position: "absolute",
                    bottom: -10,
                    width: 160,
                    height: 18,
                    borderRadius: 9,
                    backgroundColor: "#8d6e63",
                    boxShadow: "0 5px 12px rgba(0,0,0,0.3)",
                  }}
                />
              </div>
            </div>

            {/* THE LITTLE PRINCE (Standing on B-612) */}
            <div
              style={{
                position: "absolute",
                bottom: 780,
                left: 320,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                transform: `translateY(${breath}px)`,
              }}
            >
              {/* Golden Hair */}
              <div
                style={{
                  width: 90,
                  height: 70,
                  backgroundColor: paperColors.princeGold,
                  borderRadius: "50% 50% 30% 30%",
                  boxShadow: "0 8px 18px rgba(0,0,0,0.2)",
                  position: "relative",
                  zIndex: 3,
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: -12,
                    left: 20,
                    width: 30,
                    height: 25,
                    backgroundColor: paperColors.princeGold,
                    clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    top: -15,
                    right: 25,
                    width: 35,
                    height: 30,
                    backgroundColor: paperColors.princeGold,
                    clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)",
                  }}
                />
              </div>

              {/* Head */}
              <div
                style={{
                  width: 70,
                  height: 70,
                  borderRadius: "50%",
                  backgroundColor: paperColors.softCream,
                  marginTop: -35,
                  zIndex: 2,
                  boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
                }}
              />

              {/* Golden Fluttering Scarf */}
              <div
                style={{
                  width: 110,
                  height: 24,
                  backgroundColor: paperColors.princeScarf,
                  borderRadius: 12,
                  zIndex: 4,
                  marginTop: -10,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                  transform: `rotate(${scarfWave}deg)`,
                  transformOrigin: "left center",
                }}
              />

              {/* Long Coat */}
              <div
                style={{
                  width: 80,
                  height: 150,
                  backgroundColor: paperColors.princeCoat,
                  clipPath: "polygon(20% 0%, 80% 0%, 100% 100%, 0% 100%)",
                  borderRadius: "8px 8px 0 0",
                  zIndex: 1,
                  boxShadow: "0 10px 20px rgba(0,0,0,0.25)",
                }}
              />

              {/* Legs */}
              <div style={{ display: "flex", gap: 16, marginTop: -2 }}>
                <div
                  style={{
                    width: 14,
                    height: 70,
                    backgroundColor: "#f4ede2",
                    borderRadius: 7,
                  }}
                />
                <div
                  style={{
                    width: 14,
                    height: 70,
                    backgroundColor: "#f4ede2",
                    borderRadius: 7,
                  }}
                />
              </div>
            </div>
          </AbsoluteFill>
        )}

        {/* ============================================================ */}
        {/* SCENE 2: MEETING UNDER THE APPLE TREE (23.4 - 41.0s) */}
        {/* ============================================================ */}
        {time >= 34.0 && time < 65.0 && (
          <AbsoluteFill
            style={{
              background: "linear-gradient(180deg, #d8e2dc 0%, #ffe5d9 60%, #faedcd 100%)",
            }}
          >
            {/* Distant Hills */}
            <div
              style={{
                position: "absolute",
                bottom: 400,
                left: -200,
                right: -200,
                height: 500,
                borderRadius: "50% 50% 0 0",
                backgroundColor: "#ccd5ae",
                boxShadow: "0 -10px 30px rgba(0,0,0,0.06)",
              }}
            />
            <div
              style={{
                position: "absolute",
                bottom: 300,
                left: -100,
                right: -300,
                height: 480,
                borderRadius: "60% 40% 0 0",
                backgroundColor: "#b7b7a4",
                boxShadow: "0 -10px 30px rgba(0,0,0,0.08)",
              }}
            />

            {/* Earth Ground */}
            <div
              style={{
                position: "absolute",
                bottom: -200,
                left: -150,
                right: -150,
                height: 650,
                borderRadius: "50% 50% 0 0",
                backgroundColor: "#a3b18a",
                boxShadow: "0 -15px 40px rgba(0,0,0,0.12)",
              }}
            />

            {/* Apple Tree */}
            <div
              style={{
                position: "absolute",
                bottom: 400,
                left: 100,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <div
                style={{
                  width: 520,
                  height: 440,
                  borderRadius: "50%",
                  backgroundColor: "#588157",
                  boxShadow: "0 20px 50px rgba(0,0,0,0.15)",
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {[
                  { x: 120, y: 150 },
                  { x: 340, y: 130 },
                  { x: 230, y: 260 },
                  { x: 400, y: 280 },
                ].map((pos, idx) => (
                  <div
                    key={idx}
                    style={{
                      position: "absolute",
                      left: pos.x,
                      top: pos.y,
                      width: 26,
                      height: 26,
                      borderRadius: "50%",
                      backgroundColor: paperColors.roseRed,
                      boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
                    }}
                  />
                ))}
              </div>
              <div
                style={{
                  width: 70,
                  height: 380,
                  backgroundColor: "#6f4e37",
                  borderRadius: "15px 15px 0 0",
                  marginTop: -40,
                  boxShadow: "0 10px 20px rgba(0,0,0,0.2)",
                }}
              />
            </div>

            {/* THE FOX */}
            <div
              style={{
                position: "absolute",
                bottom: 420,
                right: 220,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                transform: `translateY(${breath * 0.7}px)`,
              }}
            >
              <div
                style={{
                  width: 140,
                  height: 180,
                  backgroundColor: paperColors.foxOrange,
                  borderRadius: "60px 60px 40px 40px",
                  boxShadow: "0 12px 25px rgba(0,0,0,0.15)",
                  position: "relative",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                }}
              >
                <div
                  style={{
                    width: 70,
                    height: 110,
                    backgroundColor: paperColors.foxCream,
                    borderRadius: "40px 40px 20px 20px",
                    marginTop: 20,
                  }}
                />

                <div
                  style={{
                    position: "absolute",
                    top: -70,
                    width: 120,
                    height: 90,
                    backgroundColor: paperColors.foxOrange,
                    borderRadius: "50% 50% 60% 60%",
                    boxShadow: "0 8px 18px rgba(0,0,0,0.12)",
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "0 15px",
                  }}
                >
                  <div
                    style={{
                      width: 32,
                      height: 50,
                      backgroundColor: paperColors.foxOrange,
                      clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)",
                      marginTop: -35,
                      borderTop: "6px solid #2d2a26",
                    }}
                  />
                  <div
                    style={{
                      width: 32,
                      height: 50,
                      backgroundColor: paperColors.foxOrange,
                      clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)",
                      marginTop: -35,
                      borderTop: "6px solid #2d2a26",
                    }}
                  />
                </div>

                {/* Bushy Tail */}
                <div
                  style={{
                    position: "absolute",
                    bottom: 10,
                    right: -70,
                    width: 100,
                    height: 160,
                    backgroundColor: paperColors.foxOrange,
                    borderRadius: "50px 80px 20px 50px",
                    boxShadow: "0 10px 20px rgba(0,0,0,0.15)",
                    transform: `rotate(${25 + foxTailWag}deg)`,
                    transformOrigin: "bottom left",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      right: 0,
                      width: 55,
                      height: 55,
                      borderRadius: "50%",
                      backgroundColor: paperColors.foxCream,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Prince Sitting Listening */}
            <div
              style={{
                position: "absolute",
                bottom: 420,
                left: 360,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                transform: `scale(0.85) translateY(${breath * 0.5}px)`,
              }}
            >
              <div
                style={{
                  width: 80,
                  height: 60,
                  backgroundColor: paperColors.princeGold,
                  borderRadius: "50%",
                  boxShadow: "0 6px 15px rgba(0,0,0,0.15)",
                }}
              />
              <div
                style={{
                  width: 70,
                  height: 120,
                  backgroundColor: paperColors.princeCoat,
                  borderRadius: "15px 15px 0 0",
                  marginTop: -15,
                  boxShadow: "0 8px 18px rgba(0,0,0,0.15)",
                }}
              />
            </div>
          </AbsoluteFill>
        )}

        {/* ============================================================ */}
        {/* SCENE 3: VAST GOLDEN WHEAT FIELDS (41.0 - 62.9s) */}
        {/* ============================================================ */}
        {time >= 65.0 && time < 115.0 && (
          <AbsoluteFill
            style={{
              background: "linear-gradient(180deg, #ffedd5 0%, #fed7aa 40%, #fef08a 100%)",
            }}
          >
            {/* Radiant Sun */}
            <div
              style={{
                position: "absolute",
                top: 220,
                left: "50%",
                transform: "translateX(-50%)",
                width: 320,
                height: 320,
                borderRadius: "50%",
                backgroundColor: paperColors.sunWarmth,
                boxShadow: "0 0 100px rgba(255, 227, 168, 0.8)",
              }}
            />

            {/* Back Golden Wheat Layer */}
            <div
              style={{
                position: "absolute",
                bottom: 350,
                left: -100,
                right: -100,
                height: 480,
                borderRadius: "50% 50% 0 0",
                backgroundColor: "#eab308",
                boxShadow: "0 -10px 30px rgba(0,0,0,0.08)",
              }}
            />

            {/* Waving Golden Wheat Stalks */}
            <div
              style={{
                position: "absolute",
                bottom: 0,
                left: -50,
                right: -50,
                height: 700,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-end",
                padding: "0 40px",
              }}
            >
              {[...Array(24)].map((_, idx) => {
                const stalkHeight = 350 + (idx % 5) * 40;
                const waveOffset = Math.sin(frame * 0.08 + idx * 0.4) * 12;
                return (
                  <div
                    key={idx}
                    style={{
                      width: 14,
                      height: stalkHeight,
                      backgroundColor: idx % 2 === 0 ? "#facc15" : "#ca8a04",
                      borderRadius: "10px 10px 0 0",
                      transform: `rotate(${waveOffset}deg)`,
                      transformOrigin: "bottom center",
                      boxShadow: "0 4px 15px rgba(0,0,0,0.06)",
                      position: "relative",
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        top: 0,
                        left: -8,
                        width: 30,
                        height: 70,
                        borderRadius: "50%",
                        backgroundColor: "#fef08a",
                        boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
                      }}
                    />
                  </div>
                );
              })}
            </div>

            {/* Silhouettes together */}
            <div
              style={{
                position: "absolute",
                bottom: 520,
                left: "50%",
                transform: "translateX(-50%)",
                display: "flex",
                alignItems: "flex-end",
                gap: 50,
              }}
            >
              <div
                style={{
                  width: 120,
                  height: 160,
                  backgroundColor: paperColors.foxOrange,
                  borderRadius: "50px 50px 20px 20px",
                  boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
                }}
              />
              <div
                style={{
                  width: 90,
                  height: 220,
                  backgroundColor: paperColors.princeCoat,
                  borderRadius: "20px 20px 0 0",
                  boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
                  position: "relative",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: -45,
                    left: 5,
                    width: 80,
                    height: 60,
                    borderRadius: "50%",
                    backgroundColor: paperColors.princeGold,
                  }}
                />
              </div>
            </div>
          </AbsoluteFill>
        )}

        {/* ============================================================ */}
        {/* SCENE 4: SUNSET PARTING & "ЗОРКО ОДНО ЛИШЬ СЕРДЦЕ" (62.9 - 69.5s) */}
        {/* ============================================================ */}
        {time >= 115.0 && time < 138.0 && (
          <AbsoluteFill
            style={{
              background: "linear-gradient(180deg, #31103f 0%, #7c2d12 40%, #fb923c 100%)",
            }}
          >
            {/* Glowing Heart Emblem */}
            <div
              style={{
                position: "absolute",
                top: 360,
                left: "50%",
                transform: `translateX(-50%) scale(${1 + Math.sin(frame * 0.08) * 0.06})`,
                width: 240,
                height: 240,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  width: 180,
                  height: 180,
                  backgroundColor: paperColors.roseRed,
                  clipPath:
                    "path('M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z')",
                  transform: "scale(9.0)",
                  filter: "drop-shadow(0 15px 35px rgba(230, 57, 70, 0.6))",
                }}
              />
            </div>

            <div
              style={{
                position: "absolute",
                bottom: -150,
                left: -100,
                right: -100,
                height: 550,
                borderRadius: "50% 50% 0 0",
                backgroundColor: "#1c1917",
                boxShadow: "0 -20px 50px rgba(0,0,0,0.5)",
              }}
            />
          </AbsoluteFill>
        )}

        {/* ============================================================ */}
        {/* SCENE 5: FINALE & RESPONSIBILITY (69.5 - 80.0s) */}
        {/* ============================================================ */}
        {time >= 138.0 && (
          <AbsoluteFill
            style={{
              background: "radial-gradient(circle at 50% 50%, #1e1b4b 0%, #030712 100%)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "100px 80px",
            }}
          >
            {/* The Asteroid B-612 & Golden Rose */}
            <div
              style={{
                width: 320,
                height: 320,
                borderRadius: "50%",
                backgroundColor: paperColors.asteroidBase,
                boxShadow: "0 0 80px rgba(244, 196, 48, 0.35)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 60,
                position: "relative",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: -60,
                  width: 60,
                  height: 60,
                  borderRadius: "50%",
                  backgroundColor: paperColors.roseRed,
                  boxShadow: "0 0 40px #e63946",
                }}
              />
            </div>

            {/* Golden Final Principle Card */}
            <div
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.08)",
                border: "2px solid rgba(255, 209, 102, 0.4)",
                borderRadius: 24,
                padding: "40px 50px",
                textAlign: "center",
                boxShadow: "0 20px 50px rgba(0,0,0,0.6)",
                maxWidth: 900,
              }}
            >
              <div
                style={{
                  color: paperColors.princeGold,
                  fontSize: 44,
                  fontWeight: 900,
                  lineHeight: 1.4,
                  letterSpacing: 2,
                }}
              >
                «Ты навсегда в ответе за всех, кого однажды приручил.»
              </div>
              <div
                style={{
                  color: "#94a3b8",
                  fontSize: 26,
                  marginTop: 20,
                  fontStyle: "italic",
                }}
              >
                Антуан де Сент-Экзюпери • Маленький принц
              </div>
            </div>
          </AbsoluteFill>
        )}
      </AbsoluteFill>

      {/* 3. DYNAMIC KIND RUSSIAN SUBTITLES (Pinned at 82% height) */}
      {currentSub && (
        <div
          style={{
            position: "absolute",
            bottom: 280,
            left: 60,
            right: 60,
            zIndex: 100,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
          }}
        >
          {/* Speaker Badge */}
          <div
            style={{
              fontSize: 22,
              fontWeight: 800,
              letterSpacing: 3,
              padding: "6px 22px",
              borderRadius: 30,
              marginBottom: 12,
              backgroundColor:
                currentSub.speaker === "МАЛЕНЬКИЙ ПРИНЦ"
                  ? paperColors.princeCoat
                  : currentSub.speaker === "ЛИС"
                  ? paperColors.foxOrange
                  : "#475569",
              color: "#ffffff",
              boxShadow: "0 6px 18px rgba(0,0,0,0.3)",
            }}
          >
            {currentSub.speaker}
          </div>

          {/* Subtitle Card (Warm Paper Texture Feel) */}
          <div
            style={{
              backgroundColor: "rgba(253, 251, 247, 0.94)",
              border: "3px solid #e2d9cc",
              borderRadius: 20,
              padding: "24px 38px",
              boxShadow: "0 15px 45px rgba(0,0,0,0.3)",
              maxWidth: 960,
            }}
          >
            <div
              style={{
                fontSize: 34,
                fontWeight: 700,
                color: "#1e293b",
                lineHeight: 1.4,
              }}
            >
              {currentSub.text}
            </div>
          </div>
        </div>
      )}

      {/* 4. SOFT COTTON PAPER TEXTURE OVERLAY */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          opacity: 0.05,
          background:
            "radial-gradient(#000 1px, transparent 1px), radial-gradient(#000 1px, transparent 1px)",
          backgroundSize: "20px 20px",
          backgroundPosition: "0 0, 10px 10px",
        }}
      />
      {/* Soft Vignette */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          boxShadow: "inset 0 0 120px rgba(0,0,0,0.35)",
        }}
      />
    </AbsoluteFill>
  );
};
