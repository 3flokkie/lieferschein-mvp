import React, { useMemo } from "react";
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  Audio,
  staticFile,
  spring,
} from "remotion";

// Subtitle timeline calibrated for the 118-second narration
interface StorySubtitle {
  start: number;
  end: number;
  speaker: "NARRATOR" | "PRINCE" | "FOX";
  text: string;
}

const SUBTITLES: StorySubtitle[] = [
  // ACT 1: Asteroid B-612 & Rose (0 - 24s)
  {
    start: 0.0,
    end: 4.8,
    speaker: "NARRATOR",
    text: "Среди миллиардов холодных звёзд кружился крошечный астероид Б-612.",
  },
  {
    start: 4.9,
    end: 8.8,
    speaker: "NARRATOR",
    text: "На нём жил маленький принц с золотыми волосами.",
  },
  {
    start: 8.9,
    end: 14.5,
    speaker: "NARRATOR",
    text: "Каждое утро он аккуратно прочищал жерла трёх своих вулканов...",
  },
  {
    start: 14.6,
    end: 19.5,
    speaker: "NARRATOR",
    text: "И бережно выпалывал корни баобабов, чтобы они не разорвали планету на части.",
  },
  {
    start: 19.6,
    end: 24.5,
    speaker: "NARRATOR",
    text: "Он был совсем один, пока однажды из зерна не распустилась прекрасная Роза.",
  },
  {
    start: 24.6,
    end: 29.5,
    speaker: "NARRATOR",
    text: "Но принц был слишком юн и ещё не умел любить её по-настоящему.",
  },

  // ACT 2: Journey & Meeting the Fox (29.6 - 55s)
  {
    start: 29.6,
    end: 35.8,
    speaker: "NARRATOR",
    text: "В поисках ответов принц обошёл множество миров, пока не опустился на Землю.",
  },
  {
    start: 35.9,
    end: 40.5,
    speaker: "NARRATOR",
    text: "Там, под кроной старой яблони, он встретил дикого Лиса.",
  },
  {
    start: 40.6,
    end: 44.5,
    speaker: "PRINCE",
    text: "— Поиграй со мной, — попросил мальчик. — Мне так грустно...",
  },
  {
    start: 44.6,
    end: 49.0,
    speaker: "FOX",
    text: "— Я не могу играть с тобой, — ответил Лис. — Я ещё не приручен.",
  },
  {
    start: 49.1,
    end: 52.5,
    speaker: "PRINCE",
    text: "— А что значит... «приручить»?",
  },
  {
    start: 52.6,
    end: 56.5,
    speaker: "FOX",
    text: "— Это значит — создать невидимые сердечные узы.",
  },

  // ACT 3: The Golden Wheat Fields & Becoming Unique (56.6 - 86s)
  {
    start: 56.6,
    end: 63.5,
    speaker: "FOX",
    text: "— Для меня ты пока всего лишь мальчик, такой же, как сто тысяч других мальчиков.",
  },
  {
    start: 63.6,
    end: 69.5,
    speaker: "FOX",
    text: "И ты мне не нужен. А я для тебя — лишь рыжая лисица.",
  },
  {
    start: 69.6,
    end: 75.5,
    speaker: "FOX",
    text: "Но если ты приручишь меня... мы станем нужны друг другу.",
  },
  {
    start: 75.6,
    end: 80.5,
    speaker: "FOX",
    text: "Во всей Вселенной ты будешь для меня единственным.",
  },
  {
    start: 80.6,
    end: 87.5,
    speaker: "FOX",
    text: "Видишь вдали золотые поля пшеницы? Я не ем хлеба, и колосья мне ни о чём не говорили.",
  },
  {
    start: 87.6,
    end: 93.5,
    speaker: "FOX",
    text: "Но у тебя золотые волосы. И теперь даже шум ветра в спелой пшенице будет напоминать мне о тебе.",
  },

  // ACT 4: The Parting & The Great Secret (93.6 - 110s)
  {
    start: 93.6,
    end: 98.0,
    speaker: "NARRATOR",
    text: "И Маленький принц приручил Лиса. А когда настал час прощания, Лис заплакал.",
  },
  {
    start: 98.1,
    end: 102.5,
    speaker: "PRINCE",
    text: "— Ты сам виноват... Я ведь не хотел делать тебе больно.",
  },
  {
    start: 102.6,
    end: 107.5,
    speaker: "FOX",
    text: "— Мне стало лучше. Вспомни о золоте спелой пшеницы.",
  },
  {
    start: 107.6,
    end: 112.5,
    speaker: "FOX",
    text: "Зорко одно лишь сердце. Самого главного глазами не увидишь.",
  },

  // ACT 5: Finale & Responsibility (112.6 - 120s)
  {
    start: 112.6,
    end: 116.5,
    speaker: "PRINCE",
    text: "— Моя Роза так дорога мне потому, что я отдал ей столько дней своей жизни.",
  },
  {
    start: 116.6,
    end: 120.0,
    speaker: "FOX",
    text: "«Ты навсегда в ответе за всех, кого однажды приручил.»",
  },
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
  const wheatWave = Math.sin(frame * 0.07);

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
    wheatGold1: "#e9c46a",
    wheatGold2: "#f4a261",
    sunWarmth: "#ffe3a8",
  };

  // Determine current active visual scene:
  // Scene 1: 0 - 29.5s -> Asteroid B-612 & The Rose in space
  // Scene 2: 29.5 - 56.5s -> Meeting under the Apple Tree on Earth
  // Scene 3: 56.5 - 93.5s -> Vast Golden Wheat Fields waving in the wind
  // Scene 4: 93.5 - 112.5s -> Sunset Parting & "Зорко одно лишь сердце"
  // Scene 5: 112.5 - 120s -> Night Sky, Stars, B-612 & Golden Final Quote

  return (
    <AbsoluteFill
      style={{
        backgroundColor: paperColors.deepIndigo,
        fontFamily: "'Georgia', serif, -apple-system, sans-serif",
        overflow: "hidden",
      }}
    >
      {/* 1. MASTER AUDIO TRACK */}
      <Audio src={staticFile("little_prince/story_voice.mp3")} />

      {/* 2. PAPER CUTOUT SCENE STACK */}
      <AbsoluteFill>
        {/* ============================================================ */}
        {/* SCENE 1: ASTEROID B-612 & THE ROSE (0 - 29.5s) */}
        {/* ============================================================ */}
        {time < 29.5 && (
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

            {/* Asteroid B-612 (Spherical layered Paper Cutout) */}
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

              {/* Volcano 1 */}
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
              {/* Glass Dome */}
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
                {/* Hair Spikes */}
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
        {/* SCENE 2: MEETING UNDER THE APPLE TREE (29.5 - 56.5s) */}
        {/* ============================================================ */}
        {time >= 29.5 && time < 56.5 && (
          <AbsoluteFill
            style={{
              background: "linear-gradient(180deg, #d8e2dc 0%, #ffe5d9 60%, #faedcd 100%)",
            }}
          >
            {/* Distant Hills (Paper Cut Layers) */}
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

            {/* Earth Ground Paper Hill */}
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

            {/* Big Stylized Apple Tree */}
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
              {/* Tree Crown (Paper Cloud Shapes) */}
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
                {/* Red Apples */}
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
              {/* Tree Trunk */}
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

            {/* THE FOX (Cute Paper Cut Sitting Fox) */}
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
              {/* Fox Body */}
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
                {/* White Chest Patch */}
                <div
                  style={{
                    width: 70,
                    height: 110,
                    backgroundColor: paperColors.foxCream,
                    borderRadius: "40px 40px 20px 20px",
                    marginTop: 20,
                  }}
                />

                {/* Fox Head */}
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
                  {/* Pointy Ears */}
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

                {/* Bushy Tail (Layered behind) */}
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
                  {/* White tail tip */}
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
              {/* Golden Hair */}
              <div
                style={{
                  width: 80,
                  height: 60,
                  backgroundColor: paperColors.princeGold,
                  borderRadius: "50%",
                  boxShadow: "0 6px 15px rgba(0,0,0,0.15)",
                }}
              />
              {/* Green/Blue Coat */}
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
        {/* SCENE 3: VAST GOLDEN WHEAT FIELDS (56.5 - 93.5s) */}
        {/* ============================================================ */}
        {time >= 56.5 && time < 93.5 && (
          <AbsoluteFill
            style={{
              background: "linear-gradient(180deg, #ffedd5 0%, #fed7aa 40%, #fef08a 100%)",
            }}
          >
            {/* Big Warm Radiant Sun */}
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

            {/* Front Waving Golden Wheat Stalks (Loop) */}
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
                    {/* Wheat Grains */}
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

            {/* Silhouettes of Prince and Fox together looking at wheat */}
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
              {/* Fox Silhouette */}
              <div
                style={{
                  width: 120,
                  height: 160,
                  backgroundColor: paperColors.foxOrange,
                  borderRadius: "50px 50px 20px 20px",
                  boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
                }}
              />
              {/* Prince Silhouette */}
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
        {/* SCENE 4: SUNSET PARTING & "ЗОРКО ОДНО ЛИШЬ СЕРДЦЕ" (93.5 - 112.5s) */}
        {/* ============================================================ */}
        {time >= 93.5 && time < 112.5 && (
          <AbsoluteFill
            style={{
              background: "linear-gradient(180deg, #31103f 0%, #7c2d12 40%, #fb923c 100%)",
            }}
          >
            {/* Dusk Stars Appearing */}
            {[...Array(16)].map((_, i) => (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: (i * 153.2) % 950 + 50,
                  top: (i * 97.4) % 450 + 60,
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  backgroundColor: "#ffffff",
                  opacity: 0.8,
                  boxShadow: "0 0 10px #ffffff",
                }}
              />
            ))}

            {/* Glowing Heart Emblem (Paper Cut Layer) */}
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

            {/* Hill with Silhouettes */}
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
        {/* SCENE 5: FINALE & RESPONSIBILITY (112.5 - 120s) */}
        {/* ============================================================ */}
        {time >= 112.5 && (
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
            {/* The Asteroid B-612 & Golden Rose shining bright in deep space */}
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
              {/* Glowing Rose */}
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
                currentSub.speaker === "PRINCE"
                  ? paperColors.princeCoat
                  : currentSub.speaker === "FOX"
                  ? paperColors.foxOrange
                  : "#475569",
              color: "#ffffff",
              boxShadow: "0 6px 18px rgba(0,0,0,0.3)",
            }}
          >
            {currentSub.speaker === "PRINCE"
              ? "МАЛЕНЬКИЙ ПРИНЦ"
              : currentSub.speaker === "FOX"
              ? "ЛИС"
              : "СКАЗКА"}
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
