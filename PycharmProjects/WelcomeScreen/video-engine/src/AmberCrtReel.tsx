import * as React from "react";
import type { CSSProperties, ReactNode } from "react";
import {
  AbsoluteFill,
  Audio,
  Easing,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";

/*
 * =========================================================================
 * AMBER CRT REEL: 1080x1920 @ 60 FPS, 2940 FRAMES (49s)
 * Warm retro-amber phosphor terminal. No neon pink/violet/emerald, no paper.
 *
 *   01  0.0 –  9.5s : dark sunset room, CRT on desk shows "90% ЛЮДЕЙ" + Google box;
 *                     7.5–9.5s camera flies INTO the screen (fills 1080x1920)
 *   02  9.5 – 14.6s : 1 ВОПРОС -> СУХОЙ ТЕКСТ -> ЗАКРЫТАЯ ВКЛАДКА
 *   03 14.6 – 27.8s : ДЕНЬГИ В СВЯЗКАХ: ТРЕНД-СКАНЕР -> КОД/СЦЕНАРИЙ -> АВТОПОСТИНГ + ЗАЯВКИ
 *   04 27.8 – 38.1s : ПОЛЬЗОВАТЕЛЬ vs АРХИТЕКТОР СИСТЕМ (Зарплата vs 24/7 Бизнес)
 *   05 38.1 – 49.0s : ЗАСТАВЬ ЕГО РАБОТАТЬ -> CTA "НАПИШИ СВЯЗКА"
 *
 * Transitions: CRT scan-wipe reveal + horizontal phosphor shutter cuts.
 * All cyclic indices go through mod().
 * =========================================================================
 */

const FPS = 60;
const W = 1080;
const H = 1920;
const TOTAL = 2940;

const CHAR = "#0D0A06";
const CHAR_2 = "#17110A";
const AMBER = "#FF9F1C";
const CREAM = "#FDF6E3";
const BRONZE = "#8C6D46";
const AMBER_DIM = "rgba(255,159,28,0.18)";

const COND = 'Impact, "Arial Narrow", "Helvetica Neue Condensed", "Helvetica Neue", sans-serif';
const MONO = '"SF Mono", Menlo, "JetBrains Mono", "Courier New", monospace';
const BODY = '"Helvetica Neue", Helvetica, Arial, sans-serif';

const GLOW = "0 0 12px rgba(255,159,28,0.75), 0 0 36px rgba(255,159,28,0.35)";
const GLOW_SOFT = "0 0 10px rgba(255,159,28,0.45)";

const mod = (n: number, m: number) => ((n % m) + m) % m;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const OUT = Easing.bezier(0.16, 1, 0.3, 1);
const INOUT = Easing.bezier(0.7, 0, 0.2, 1);
const s2f = (s: number) => Math.round(s * FPS);

const ramp = (f: number, a: number, b: number, from = 0, to = 1, ease = OUT) =>
  interpolate(f, [a, b], [from, to], { ...clamp, easing: ease });

// deterministic pseudo-random
const hash = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

// -------------------------------------------------------------------------
// Words (from public/amber_crt_reel/words.json, inlined for strict tsc)
// -------------------------------------------------------------------------
type Word = { word: string; start: number; end: number };

const RAW: [string, number, number][] = [
  ["90", 0.0, 0.5],
  ["%", 0.5, 1.02],
  ["людей", 1.02, 1.56],
  ["в", 1.56, 1.74],
  ["2026", 1.74, 3.04],
  ["году", 3.04, 3.74],
  ["до", 3.74, 4.1],
  ["сих", 4.1, 4.28],
  ["пор", 4.28, 4.4],
  ["используют", 4.4, 5.04],
  ["нейросети", 5.04, 5.64],
  ["как", 5.64, 5.9],
  ["обычный", 5.9, 6.48],
  ["Google", 6.48, 6.86],
  ["и", 6.86, 7.36],
  ["теряют", 7.36, 7.74],
  ["на", 7.74, 7.94],
  ["этом", 7.94, 8.2],
  ["тысячи", 8.2, 8.72],
  ["долларов.", 8.72, 9.02],
  ["Они", 9.66, 9.84],
  ["задают", 9.84, 10.24],
  ["один", 10.24, 10.68],
  ["вопрос,", 10.68, 11.1],
  ["получают", 11.62, 12.12],
  ["сухой", 12.12, 12.54],
  ["текст", 12.54, 12.88],
  ["и", 12.88, 13.14],
  ["закрывают", 13.14, 13.72],
  ["в", 13.72, 13.86],
  ["кладку.", 13.86, 14.38],
  ["Но", 14.72, 14.88],
  ["настоящие", 14.88, 15.62],
  ["деньги", 15.62, 15.98],
  ["лежат", 15.98, 16.48],
  ["не", 16.48, 16.66],
  ["в", 16.66, 16.76],
  ["чате,", 16.76, 17.1],
  ["а", 17.32, 17.36],
  ["в", 17.36, 17.44],
  ["связках.", 17.44, 17.96],
  ["Когда", 18.46, 18.74],
  ["одна", 18.74, 19.08],
  ["модель", 19.08, 19.46],
  ["сама", 19.46, 19.76],
  ["ищет", 19.76, 20.3],
  ["тренд,", 20.3, 20.66],
  ["вторая", 21.18, 21.54],
  ["пишет", 21.54, 21.94],
  ["под", 21.94, 22.1],
  ["него", 22.1, 22.34],
  ["код", 22.34, 22.68],
  ["или", 22.68, 23.0],
  ["сценарий,", 23.0, 23.68],
  ["а", 24.08, 24.18],
  ["третья", 24.18, 24.64],
  ["автоматически", 24.64, 25.46],
  ["публикует", 25.46, 26.06],
  ["результат", 26.06, 26.48],
  ["и", 26.48, 26.84],
  ["собирает", 26.84, 27.3],
  ["заявки.", 27.3, 27.9],
  ["Разница", 27.9, 28.8],
  ["между", 28.8, 29.24],
  ["пользователем", 29.24, 30.04],
  ["и", 30.04, 30.22],
  ["архитектором", 30.22, 30.98],
  ["систем,", 30.98, 31.36],
  ["это", 31.88, 32.06],
  ["разница", 32.06, 32.54],
  ["между", 32.54, 33.02],
  ["зарплатой", 33.02, 33.78],
  ["и", 33.78, 34.04],
  ["собственным", 34.04, 34.72],
  ["бизнесом,", 34.72, 35.32],
  ["которые", 35.4, 35.62],
  ["работают", 35.62, 36.24],
  ["24", 36.24, 36.92],
  ["на", 36.92, 37.38],
  ["7.", 37.38, 37.62],
  ["Перестань", 38.24, 38.66],
  ["просто", 38.66, 38.9],
  ["переписываться", 38.9, 39.68],
  ["с", 39.68, 39.86],
  ["ботом,", 39.86, 40.24],
  ["заставь", 40.66, 41.16],
  ["его", 41.16, 41.3],
  ["работать", 41.3, 41.7],
  ["на", 41.7, 41.94],
  ["тебя.", 41.94, 42.32],
  ["Напиши", 42.8, 43.14],
  ["слово,", 43.14, 43.38],
  ["связка", 43.6, 43.94],
  ["в", 43.94, 44.04],
  ["комментариях,", 44.04, 44.78],
  ["и", 45.24, 45.3],
  ["я", 45.3, 45.46],
  ["покажу", 45.46, 45.8],
  ["три", 45.8, 46.02],
  ["готовых", 46.02, 46.46],
  ["примера.", 46.46, 47.0],
];

const WORDS: Word[] = RAW.map(([word, start, end]) => ({ word, start, end }));

type Chunk = { words: Word[]; start: number; end: number };

const CHUNKS: Chunk[] = (() => {
  const out: Chunk[] = [];
  let cur: Word[] = [];
  const flush = () => {
    if (cur.length) out.push({ words: cur, start: cur[0].start, end: cur[cur.length - 1].end });
    cur = [];
  };
  WORDS.forEach((w, i) => {
    const prev = WORDS[i - 1];
    if (cur.length && prev && w.start - prev.end > 0.35) flush();
    cur.push(w);
    const letters = cur.reduce((a, x) => a + x.word.length, 0);
    if (/[.,?!]$/.test(w.word) || cur.length >= 4 || letters >= 22) flush();
  });
  flush();
  return out;
})();

// -------------------------------------------------------------------------
// Scene timing
// -------------------------------------------------------------------------
const SCENES = [0, s2f(9.5), s2f(14.6), s2f(27.8), s2f(38.1), TOTAL];
const OVERLAP = 24; // frames of scan-wipe overlap

// punch-zoom keywords (seconds)
const PUNCHES = [0.0, 6.48, 8.2, 9.84, 11.62, 13.14, 15.62, 17.44, 18.46, 21.18, 24.08, 27.9, 30.22, 33.02, 36.24, 40.66, 43.6, 45.8];

// -------------------------------------------------------------------------
// Primitives
// -------------------------------------------------------------------------
const Mono: React.FC<{ size?: number; color?: string; style?: CSSProperties; children: ReactNode }> = ({
  size = 26,
  color = BRONZE,
  style,
  children,
}) => (
  <div style={{ fontFamily: MONO, fontSize: size, color, letterSpacing: 2, fontWeight: 600, ...style }}>{children}</div>
);

const Cond: React.FC<{ size: number; color?: string; glow?: boolean; style?: CSSProperties; children: ReactNode }> = ({
  size,
  color = AMBER,
  glow = true,
  style,
  children,
}) => (
  <div
    style={{
      fontFamily: COND,
      fontSize: size,
      lineHeight: 0.95,
      color,
      letterSpacing: 2,
      textTransform: "uppercase",
      textShadow: glow && color === AMBER ? GLOW : "none",
      ...style,
    }}
  >
    {children}
  </div>
);

const Cursor: React.FC<{ f: number; size?: number; color?: string }> = ({ f, size = 40, color = AMBER }) => (
  <span
    style={{
      display: "inline-block",
      width: size * 0.55,
      height: size,
      marginLeft: 6,
      verticalAlign: "middle",
      background: color,
      opacity: mod(Math.floor(f / 18), 2) === 0 ? 1 : 0,
      boxShadow: GLOW_SOFT,
    }}
  />
);

// terminal panel with corner brackets
const Panel: React.FC<{ style?: CSSProperties; hot?: boolean; children: ReactNode; label?: string }> = ({
  style,
  hot = false,
  children,
  label,
}) => {
  const c = hot ? AMBER : BRONZE;
  const br = (pos: CSSProperties): CSSProperties => ({ position: "absolute", width: 26, height: 26, ...pos });
  return (
    <div
      style={{
        position: "relative",
        background: hot ? "rgba(255,159,28,0.07)" : "rgba(140,109,70,0.08)",
        border: `2px solid ${hot ? "rgba(255,159,28,0.55)" : "rgba(140,109,70,0.45)"}`,
        boxShadow: hot ? "0 0 30px rgba(255,159,28,0.22), inset 0 0 24px rgba(255,159,28,0.08)" : "none",
        ...style,
      }}
    >
      <div style={br({ left: -8, top: -8, borderLeft: `4px solid ${c}`, borderTop: `4px solid ${c}` })} />
      <div style={br({ right: -8, top: -8, borderRight: `4px solid ${c}`, borderTop: `4px solid ${c}` })} />
      <div style={br({ left: -8, bottom: -8, borderLeft: `4px solid ${c}`, borderBottom: `4px solid ${c}` })} />
      <div style={br({ right: -8, bottom: -8, borderRight: `4px solid ${c}`, borderBottom: `4px solid ${c}` })} />
      {label ? (
        <div
          style={{
            position: "absolute",
            top: -18,
            left: 28,
            padding: "2px 12px",
            background: CHAR,
            fontFamily: MONO,
            fontSize: 22,
            letterSpacing: 3,
            fontWeight: 700,
            color: c,
          }}
        >
          {label}
        </div>
      ) : null}
      {children}
    </div>
  );
};

// terminal status header
const StatusBar: React.FC<{ f: number; gf: number; title: string; idx: string }> = ({ f, gf, title, idx }) => {
  const typed = Math.floor(ramp(f, 4, 40, 0, title.length, Easing.linear));
  return (
    <div style={{ position: "absolute", left: 72, right: 72, top: 110, display: "flex", alignItems: "center", gap: 18 }}>
      <div
        style={{
          fontFamily: MONO,
          fontSize: 22,
          fontWeight: 800,
          color: CHAR,
          background: AMBER,
          padding: "6px 12px",
          letterSpacing: 2,
          boxShadow: GLOW_SOFT,
        }}
      >
        {idx}
      </div>
      <Mono size={26} color={AMBER} style={{ flex: 1, textShadow: GLOW_SOFT }}>
        {"> " + title.slice(0, typed)}
        <Cursor f={f} size={24} />
      </Mono>
      <Mono size={22} color={BRONZE}>
        T+{(gf / FPS).toFixed(2)}
      </Mono>
    </div>
  );
};

// -------------------------------------------------------------------------
// Camera: constant drift + punch zoom on keywords
// -------------------------------------------------------------------------
const Camera: React.FC<{ gf: number; children: ReactNode }> = ({ gf, children }) => {
  const t = gf / FPS;
  let punch = 0;
  for (let i = 0; i < PUNCHES.length; i++) {
    const d = t - PUNCHES[i];
    if (d >= 0 && d < 0.9) {
      const k = d < 0.12 ? d / 0.12 : Math.exp(-(d - 0.12) * 5);
      punch = Math.max(punch, k);
    }
  }
  const scale = 1.015 + 0.012 * Math.sin(t * 0.7) + punch * 0.045;
  const x = Math.sin(t * 0.45) * 9 + Math.sin(t * 1.3) * 3;
  const y = Math.cos(t * 0.38) * 8;
  const rot = Math.sin(t * 0.3) * 0.25;
  return (
    <AbsoluteFill style={{ transform: `translate(${x}px, ${y}px) scale(${scale}) rotate(${rot}deg)` }}>
      {children}
    </AbsoluteFill>
  );
};

// -------------------------------------------------------------------------
// Scene 1 : 90% ЛЮДЕЙ + crossed-out Google-style box
// -------------------------------------------------------------------------
const Scene1: React.FC<{ f: number; gf: number }> = ({ f, gf }) => {
  const pct = Math.round(ramp(f, 0, s2f(1.0), 0, 90, INOUT));
  const lyudi = ramp(f, s2f(1.0), s2f(1.35));
  const yearIn = ramp(f, s2f(1.74), s2f(2.1));
  const boxIn = ramp(f, s2f(5.6), s2f(6.1));
  const query = "как написать пост для инстаграма";
  const typed = Math.floor(ramp(f, s2f(6.0), s2f(7.2), 0, query.length, Easing.linear));
  const strike = ramp(f, s2f(7.36), s2f(7.75), 0, 1, INOUT);
  const loss = ramp(f, s2f(8.2), s2f(9.2), 0, 4800, Easing.out(Easing.cubic));
  const lossIn = ramp(f, s2f(8.2), s2f(8.5));

  return (
    <AbsoluteFill>
      <StatusBar f={f} gf={gf} title="AI_USAGE_REPORT.2026" idx="01" />

      {/* big counter */}
      <div style={{ position: "absolute", left: 72, top: 200, display: "flex", alignItems: "flex-end", gap: 28 }}>
        <Cond size={330} style={{ letterSpacing: -4 }}>
          {pct}%
        </Cond>
        <div style={{ paddingBottom: 30, opacity: lyudi, transform: `translateX(${(1 - lyudi) * -30}px)` }}>
          <Cond size={128} color={CREAM} glow={false}>
            ЛЮДЕЙ
          </Cond>
          <Mono size={30} color={AMBER} style={{ marginTop: 14, opacity: yearIn }}>
            [ В 2026 ГОДУ ]
          </Mono>
        </div>
      </div>

      {/* 10x10 population grid */}
      <div
        style={{
          position: "absolute",
          left: 72,
          top: 560,
          width: 936,
          display: "grid",
          gridTemplateColumns: "repeat(20, 1fr)",
          rowGap: 14,
          columnGap: 0,
        }}
      >
        {Array.from({ length: 100 }).map((_, i) => {
          const on = i < pct;
          const appear = ramp(f, i * 0.6, i * 0.6 + 12);
          return (
            <div key={i} style={{ display: "flex", justifyContent: "center", opacity: appear }}>
              <div
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 11,
                  background: on ? AMBER : "transparent",
                  border: on ? "none" : `3px solid ${CREAM}`,
                  boxShadow: on ? GLOW_SOFT : "none",
                  opacity: on ? 0.55 + 0.45 * hash(i + Math.floor(f / 8)) : 1,
                }}
              />
            </div>
          );
        })}
      </div>
      <Mono size={22} color={BRONZE} style={{ position: "absolute", left: 72, top: 760 }}>
        ● ИСПОЛЬЗУЮТ ИИ КАК ПОИСКОВИК &nbsp;&nbsp; ○ СТРОЯТ СИСТЕМЫ
      </Mono>

      {/* Google-style single box */}
      <div
        style={{
          position: "absolute",
          left: 72,
          right: 72,
          top: 860,
          opacity: boxIn,
          transform: `translateY(${(1 - boxIn) * 40}px)`,
        }}
      >
        <Mono size={24} color={BRONZE} style={{ marginBottom: 16 }}>
          // ВЕСЬ «ВОРКФЛОУ» — ОДНО ОКНО
        </Mono>
        <div style={{ position: "relative" }}>
          <div
            style={{
              height: 132,
              borderRadius: 66,
              background: CREAM,
              display: "flex",
              alignItems: "center",
              padding: "0 44px",
              gap: 26,
              boxShadow: "0 18px 50px rgba(0,0,0,0.6)",
            }}
          >
            <svg width="48" height="48" viewBox="0 0 48 48">
              <circle cx="20" cy="20" r="13" stroke={BRONZE} strokeWidth="5" fill="none" />
              <line x1="30" y1="30" x2="42" y2="42" stroke={BRONZE} strokeWidth="6" strokeLinecap="round" />
            </svg>
            <div style={{ flex: 1, fontFamily: BODY, fontSize: 40, color: CHAR, whiteSpace: "nowrap", overflow: "hidden" }}>
              {query.slice(0, typed)}
              <Cursor f={f} size={40} color={CHAR} />
            </div>
            <div style={{ width: 16, height: 40, borderRadius: 8, background: BRONZE, opacity: 0.6 }} />
          </div>
          {/* strike lines */}
          <svg width={936} height={132} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
            <line
              x1={-20}
              y1={110}
              x2={-20 + 976 * strike}
              y2={110 - 88 * strike}
              stroke={AMBER}
              strokeWidth={14}
              strokeLinecap="round"
              style={{ filter: "drop-shadow(0 0 10px rgba(255,159,28,0.9))" }}
            />
          </svg>
          {strike > 0.99 ? (
            <div
              style={{
                position: "absolute",
                right: -10,
                top: -40,
                transform: "rotate(6deg)",
                border: `5px solid ${AMBER}`,
                color: AMBER,
                fontFamily: MONO,
                fontWeight: 800,
                fontSize: 30,
                padding: "6px 16px",
                background: CHAR,
                letterSpacing: 3,
                boxShadow: GLOW_SOFT,
              }}
            >
              ERR: ЭТО НЕ GOOGLE
            </div>
          ) : null}
        </div>
      </div>

      {/* loss counter */}
      <div style={{ position: "absolute", left: 72, right: 72, top: 1110, opacity: lossIn }}>
        <Panel hot label="LOSS.MONITOR" style={{ padding: "34px 36px", display: "flex", alignItems: "center", gap: 30 }}>
          <div style={{ flex: 1 }}>
            <Mono size={24} color={BRONZE}>
              УПУЩЕННЫЙ ДОХОД / МЕС
            </Mono>
            <Cond size={110} style={{ marginTop: 8 }}>
              −${Math.round(loss).toLocaleString("en-US")}
            </Cond>
          </div>
          <svg width={220} height={110}>
            <polyline
              points={Array.from({ length: 12 })
                .map((_, i) => `${i * 20},${10 + i * 7 + hash(i) * 14 * (1 - i / 12)}`)
                .join(" ")}
              fill="none"
              stroke={AMBER}
              strokeWidth={4}
              strokeDasharray={400}
              strokeDashoffset={400 * (1 - lossIn)}
            />
          </svg>
        </Panel>
      </div>
    </AbsoluteFill>
  );
};

// -------------------------------------------------------------------------
// Scene 2 : 1 ВОПРОС -> СУХОЙ ТЕКСТ -> ЗАКРЫТАЯ ВКЛАДКА
// -------------------------------------------------------------------------
const Arrow: React.FC<{ p: number }> = ({ p }) => (
  <div style={{ display: "flex", justifyContent: "center", height: 70, opacity: p }}>
    <svg width={60} height={70}>
      <line x1={30} y1={0} x2={30} y2={54 * p} stroke={AMBER} strokeWidth={5} strokeDasharray="8 8" />
      <polygon points="14,48 46,48 30,68" fill={AMBER} opacity={p > 0.9 ? 1 : 0} />
    </svg>
  </div>
);

const Scene2: React.FC<{ f: number; gf: number }> = ({ f, gf }) => {
  const at = (s: number) => s2f(s) - SCENES[1];
  const a = ramp(f, at(9.84), at(10.2));
  const b = ramp(f, at(11.62), at(12.0));
  const c = ramp(f, at(13.14), at(13.5));
  const close = ramp(f, at(13.72), at(14.2), 0, 1, INOUT);
  const q = "ну и что там с ИИ?";
  const typed = Math.floor(ramp(f, at(10.24), at(10.9), 0, q.length, Easing.linear));
  const rowStyle = (p: number): CSSProperties => ({
    opacity: p,
    transform: `translateX(${(1 - p) * -60}px)`,
  });

  return (
    <AbsoluteFill>
      <StatusBar f={f} gf={gf} title="SESSION_LOG // ТИПИЧНЫЙ ЮЗЕР" idx="02" />
      <div style={{ position: "absolute", left: 72, right: 72, top: 220 }}>
        {/* step 1 */}
        <div style={rowStyle(a)}>
          <Panel hot label="STEP_01" style={{ padding: "30px 34px", display: "flex", alignItems: "center", gap: 30 }}>
            <Cond size={150} style={{ width: 120, textAlign: "center" }}>
              1
            </Cond>
            <div style={{ flex: 1 }}>
              <Cond size={84} color={CREAM} glow={false}>
                ВОПРОС
              </Cond>
              <div
                style={{
                  marginTop: 14,
                  background: CREAM,
                  borderRadius: "26px 26px 26px 4px",
                  padding: "12px 22px",
                  display: "inline-block",
                  fontFamily: BODY,
                  fontSize: 32,
                  color: CHAR,
                  fontWeight: 600,
                }}
              >
                {q.slice(0, typed) || " "}
              </div>
            </div>
          </Panel>
        </div>
        <Arrow p={b} />
        {/* step 2 */}
        <div style={rowStyle(b)}>
          <Panel label="STEP_02" style={{ padding: "30px 34px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <Cond size={84} color={CREAM} glow={false}>
                СУХОЙ ТЕКСТ
              </Cond>
              <Mono size={22} color={BRONZE}>
                0 ДЕЙСТВИЙ
              </Mono>
            </div>
            <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 12 }}>
              {[0.94, 0.88, 0.97, 0.7, 0.9, 0.45].map((w, i) => (
                <div
                  key={i}
                  style={{
                    height: 16,
                    width: `${w * 100 * ramp(f, at(11.7) + i * 4, at(11.7) + i * 4 + 16)}%`,
                    background: BRONZE,
                    opacity: 0.55,
                  }}
                />
              ))}
            </div>
          </Panel>
        </div>
        <Arrow p={c} />
        {/* step 3 : tab closing */}
        <div style={rowStyle(c)}>
          <Panel hot label="STEP_03" style={{ padding: "30px 34px" }}>
            <Cond size={84} color={CREAM} glow={false}>
              ЗАКРЫТАЯ ВКЛАДКА
            </Cond>
            <div style={{ marginTop: 22, display: "flex", alignItems: "flex-end", gap: 10, height: 74 }}>
              {[0, 1, 2].map((i) => {
                const isTarget = i === 1;
                const wdt = isTarget ? 300 * (1 - close) : 220;
                return (
                  <div
                    key={i}
                    style={{
                      width: wdt,
                      height: 66,
                      overflow: "hidden",
                      borderRadius: "14px 14px 0 0",
                      background: isTarget ? CREAM : "rgba(140,109,70,0.35)",
                      display: "flex",
                      alignItems: "center",
                      padding: wdt > 40 ? "0 18px" : 0,
                      gap: 12,
                      opacity: isTarget ? 1 - close * 0.6 : 0.8,
                    }}
                  >
                    <div style={{ width: 22, height: 22, borderRadius: 11, background: isTarget ? AMBER : BRONZE, flexShrink: 0 }} />
                    <div
                      style={{
                        flex: 1,
                        fontFamily: BODY,
                        fontSize: 24,
                        fontWeight: 600,
                        color: isTarget ? CHAR : CREAM,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {isTarget ? "AI Chat" : i === 0 ? "YouTube" : "Почта"}
                    </div>
                    {isTarget ? (
                      <div
                        style={{
                          fontFamily: MONO,
                          fontSize: 30,
                          fontWeight: 800,
                          color: CHAR,
                          transform: `scale(${1 + 0.4 * ramp(f, at(13.4), at(13.6)) * (1 - close)})`,
                        }}
                      >
                        ×
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </Panel>
        </div>
      </div>
      {/* summary line */}
      <div style={{ position: "absolute", left: 72, right: 72, top: 1250, display: "flex", gap: 40, opacity: close }}>
        <Mono size={28} color={BRONZE}>
          СЕССИЯ: 00:47
        </Mono>
        <Mono size={28} color={AMBER} style={{ textShadow: GLOW_SOFT }}>
          ПРИБЫЛЬ: $0.00
        </Mono>
      </div>
    </AbsoluteFill>
  );
};

// -------------------------------------------------------------------------
// Scene 3 : ДЕНЬГИ В СВЯЗКАХ — three linked nodes
// -------------------------------------------------------------------------
const NODE_TOP = [480, 750, 1020];
const NODE_H = 210;

const Link: React.FC<{ f: number; y0: number; y1: number; p: number }> = ({ f, y0, y1, p }) => {
  const x = 540;
  const len = y1 - y0;
  return (
    <svg width={W} height={H} style={{ position: "absolute", left: -72, top: 0, pointerEvents: "none" }}>
      <line x1={x} y1={y0} x2={x} y2={y0 + len * p} stroke={AMBER} strokeWidth={6} style={{ filter: "drop-shadow(0 0 8px rgba(255,159,28,0.8))" }} />
      {p > 0.98
        ? [0, 1, 2].map((k) => {
            const ph = mod(f / 40 + k / 3, 1);
            return <rect key={k} x={x - 9} y={y0 + len * ph - 9} width={18} height={18} fill={CREAM} />;
          })
        : null}
    </svg>
  );
};

const Scene3: React.FC<{ f: number; gf: number }> = ({ f, gf }) => {
  const at = (s: number) => s2f(s) - SCENES[2];
  const titleA = ramp(f, at(14.72), at(15.1));
  const chatStrike = ramp(f, at(16.48), at(16.9), 0, 1, INOUT);
  const svyaz = ramp(f, at(17.44), at(17.8));
  const n1 = ramp(f, at(18.46), at(18.85));
  const n2 = ramp(f, at(21.18), at(21.55));
  const n3 = ramp(f, at(24.08), at(24.45));
  const l1 = ramp(f, at(20.6), at(21.2), 0, 1, INOUT);
  const l2 = ramp(f, at(23.4), at(24.1), 0, 1, INOUT);
  const leads = Math.floor(ramp(f, at(26.84), at(27.8), 0, 37, Easing.linear));
  const posts = Math.floor(ramp(f, at(25.46), at(26.4), 0, 12, Easing.linear));

  const trendTags = ["#ai_agents", "#nocode", "#reels"];
  const code = ["fetch(trend)", "  .then(script)", "  .then(render)"];
  const codeChars = Math.floor(ramp(f, at(21.9), at(23.4), 0, 46, Easing.linear));

  const node = (p: number, top: number, idx: string, title: string, body: ReactNode, hot: boolean) => (
    <div
      style={{
        position: "absolute",
        left: 72,
        right: 72,
        top,
        height: NODE_H,
        opacity: p,
        transform: `scale(${0.92 + 0.08 * p})`,
      }}
    >
      <Panel hot={hot} label={idx} style={{ height: "100%", padding: "30px 34px", boxSizing: "border-box" }}>
        <Cond size={70} color={CREAM} glow={false}>
          {title}
        </Cond>
        <div style={{ marginTop: 18 }}>{body}</div>
      </Panel>
    </div>
  );

  let charsLeft = codeChars;
  return (
    <AbsoluteFill>
      <StatusBar f={f} gf={gf} title="PIPELINE.BUILD // СВЯЗКА_v1" idx="03" />
      <div style={{ position: "absolute", left: 72, right: 72, top: 200 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 26, opacity: titleA }}>
          <Cond size={130}>ДЕНЬГИ</Cond>
          <div style={{ position: "relative" }}>
            <Mono size={36} color={CREAM}>
              НЕ В ЧАТЕ
            </Mono>
            <div
              style={{
                position: "absolute",
                left: -6,
                top: "50%",
                height: 6,
                width: `${chatStrike * 106}%`,
                background: AMBER,
                boxShadow: GLOW_SOFT,
              }}
            />
          </div>
        </div>
        <div style={{ opacity: svyaz, transform: `translateY(${(1 - svyaz) * 30}px)`, marginTop: 6 }}>
          <Cond size={130} color={CREAM} glow={false}>
            В СВЯЗКАХ
          </Cond>
        </div>
      </div>

      <Link f={f} y0={NODE_TOP[0] + NODE_H} y1={NODE_TOP[1]} p={l1} />
      <Link f={f} y0={NODE_TOP[1] + NODE_H} y1={NODE_TOP[2]} p={l2} />

      {node(
        n1,
        NODE_TOP[0],
        "MODEL_01",
        "ТРЕНД-СКАНЕР",
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {trendTags.map((t, i) => (
            <div
              key={t}
              style={{
                fontFamily: MONO,
                fontSize: 24,
                fontWeight: 700,
                padding: "6px 14px",
                color: i === mod(Math.floor(f / 30), 3) ? CHAR : AMBER,
                background: i === mod(Math.floor(f / 30), 3) ? AMBER : "transparent",
                border: `2px solid ${AMBER}`,
              }}
            >
              {t}
            </div>
          ))}
          <svg width={150} height={50} style={{ marginLeft: "auto" }}>
            <polyline
              points={Array.from({ length: 10 })
                .map((_, i) => `${i * 16},${44 - i * 4 - hash(i + 3) * 10}`)
                .join(" ")}
              fill="none"
              stroke={AMBER}
              strokeWidth={4}
            />
          </svg>
        </div>,
        n2 < 0.5,
      )}
      {node(
        n2,
        NODE_TOP[1],
        "MODEL_02",
        "КОД / СЦЕНАРИЙ",
        <div style={{ display: "flex", gap: 30 }}>
          {code.map((ln) => {
            const show = ln.slice(0, Math.max(0, charsLeft));
            charsLeft -= ln.length;
            return (
              <Mono key={ln} size={24} color={AMBER} style={{ whiteSpace: "pre", letterSpacing: 0 }}>
                {show}
              </Mono>
            );
          })}
        </div>,
        n2 > 0.5 && n3 < 0.5,
      )}
      {node(
        n3,
        NODE_TOP[2],
        "MODEL_03",
        "АВТОПОСТИНГ + ЗАЯВКИ",
        <div style={{ display: "flex", gap: 50, alignItems: "baseline" }}>
          <Mono size={28} color={CREAM}>
            ПОСТОВ: <span style={{ color: AMBER }}>{posts}</span>
          </Mono>
          <Mono size={28} color={CREAM}>
            ЗАЯВОК: <span style={{ color: AMBER, fontSize: 40, textShadow: GLOW }}>+{leads}</span>
          </Mono>
          <div
            style={{
              marginLeft: "auto",
              width: 18,
              height: 18,
              borderRadius: 9,
              background: AMBER,
              opacity: mod(Math.floor(f / 15), 2) === 0 ? 1 : 0.25,
              boxShadow: GLOW,
            }}
          />
        </div>,
        n3 > 0.5,
      )}
    </AbsoluteFill>
  );
};

// -------------------------------------------------------------------------
// Scene 4 : ПОЛЬЗОВАТЕЛЬ vs АРХИТЕКТОР СИСТЕМ
// -------------------------------------------------------------------------
const Scene4: React.FC<{ f: number; gf: number }> = ({ f, gf }) => {
  const at = (s: number) => s2f(s) - SCENES[3];
  const L = ramp(f, at(29.24), at(29.6));
  const R = ramp(f, at(30.22), at(30.6));
  const vs = ramp(f, at(29.9), at(30.2));
  const sal = ramp(f, at(33.02), at(33.4));
  const biz = ramp(f, at(34.04), at(34.5));
  const tf = ramp(f, at(36.24), at(37.2), 0, 1, INOUT);
  const colW = 440;
  const spin = (f / FPS) * 120;

  const growth = Array.from({ length: 14 }).map((_, i) => `${i * 28},${150 - Math.pow(i / 13, 2.2) * 130 - hash(i) * 8}`);
  const flat = Array.from({ length: 14 }).map((_, i) => `${i * 28},${100 + (mod(i, 4) === 3 ? -14 : 0)}`);

  return (
    <AbsoluteFill>
      <StatusBar f={f} gf={gf} title="COMPARE --role" idx="04" />
      <div style={{ position: "absolute", left: 72, right: 72, top: 210, textAlign: "center" }}>
        <Mono size={30} color={BRONZE}>РАЗНИЦА МЕЖДУ</Mono>
      </div>

      {/* VS badge */}
      <div
        style={{
          position: "absolute",
          left: W / 2 - 60,
          top: 300,
          width: 120,
          height: 120,
          borderRadius: 60,
          background: AMBER,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transform: `scale(${vs})`,
          boxShadow: GLOW,
          zIndex: 2,
        }}
      >
        <Cond size={64} color={CHAR} glow={false}>
          VS
        </Cond>
      </div>

      {/* LEFT: user */}
      <div style={{ position: "absolute", left: 72, top: 300, width: colW, opacity: L, transform: `translateX(${(1 - L) * -60}px)` }}>
        <Panel label="ROLE_A" style={{ padding: "150px 28px 30px", height: 960, boxSizing: "border-box" }}>
          <Cond size={68} color={CREAM} glow={false}>
            ПОЛЬЗО-
            <br />
            ВАТЕЛЬ
          </Cond>
          {/* single chat */}
          <div
            style={{
              marginTop: 30,
              height: 64,
              borderRadius: 32,
              border: `3px solid ${BRONZE}`,
              display: "flex",
              alignItems: "center",
              padding: "0 22px",
              fontFamily: BODY,
              fontSize: 24,
              color: BRONZE,
            }}
          >
            спросить ИИ…
          </div>
          <Mono size={22} color={BRONZE} style={{ marginTop: 40 }}>
            ГРАФИК 09:00–18:00
          </Mono>
          <div style={{ marginTop: 12, height: 20, background: "rgba(140,109,70,0.25)", position: "relative" }}>
            <div style={{ position: "absolute", left: "37%", width: "38%", top: 0, bottom: 0, background: BRONZE }} />
          </div>
          <svg width={380} height={170} style={{ marginTop: 30 }}>
            <polyline points={flat.join(" ")} fill="none" stroke={BRONZE} strokeWidth={5} />
          </svg>
          <div style={{ opacity: sal, marginTop: 10 }}>
            <Cond size={84} color={CREAM} glow={false}>
              ЗАРПЛАТА
            </Cond>
            <Mono size={24} color={BRONZE} style={{ marginTop: 10 }}>
              ПОТОЛОК: ФИКС
            </Mono>
          </div>
        </Panel>
      </div>

      {/* RIGHT: architect */}
      <div style={{ position: "absolute", right: 72, top: 300, width: colW, opacity: R, transform: `translateX(${(1 - R) * 60}px)` }}>
        <Panel hot label="ROLE_B" style={{ padding: "150px 28px 30px", height: 960, boxSizing: "border-box" }}>
          <Cond size={68}>
            АРХИТЕКТОР
            <br />
            СИСТЕМ
          </Cond>
          {/* mini graph */}
          <svg width={380} height={64} style={{ marginTop: 30 }}>
            {[30, 190, 350].map((x, i) => (
              <g key={x}>
                {i < 2 ? <line x1={x} y1={32} x2={x + 160} y2={32} stroke={AMBER} strokeWidth={4} /> : null}
                <rect x={x - 22} y={10} width={44} height={44} fill={CHAR} stroke={AMBER} strokeWidth={4} />
                <rect
                  x={x - 8}
                  y={24}
                  width={16}
                  height={16}
                  fill={AMBER}
                  opacity={mod(Math.floor(f / 12) - i, 3) === 0 ? 1 : 0.3}
                />
              </g>
            ))}
          </svg>
          <Mono size={22} color={AMBER} style={{ marginTop: 40 }}>
            UPTIME 24/7
          </Mono>
          <div style={{ marginTop: 12, height: 20, background: AMBER, boxShadow: GLOW_SOFT }} />
          <svg width={380} height={170} style={{ marginTop: 30 }}>
            <polyline
              points={growth.join(" ")}
              fill="none"
              stroke={AMBER}
              strokeWidth={5}
              strokeDasharray={600}
              strokeDashoffset={600 * (1 - ramp(f, at(30.6), at(32.5)))}
              style={{ filter: "drop-shadow(0 0 6px rgba(255,159,28,0.8))" }}
            />
          </svg>
          <div style={{ opacity: biz, marginTop: 10, display: "flex", alignItems: "center", gap: 18 }}>
            <div>
              <Cond size={84}>{tf > 0.01 ? "24/7" : "СВОЙ"}</Cond>
              <Mono size={24} color={CREAM} style={{ marginTop: 10 }}>
                БИЗНЕС
              </Mono>
            </div>
            <svg width={90} height={90} style={{ marginLeft: "auto" }}>
              <circle cx={45} cy={45} r={36} stroke={AMBER_DIM} strokeWidth={8} fill="none" />
              <circle
                cx={45}
                cy={45}
                r={36}
                stroke={AMBER}
                strokeWidth={8}
                fill="none"
                strokeDasharray={226}
                strokeDashoffset={226 * (1 - Math.max(tf, 0.15))}
                transform={`rotate(${spin} 45 45)`}
              />
            </svg>
          </div>
        </Panel>
      </div>
    </AbsoluteFill>
  );
};

// -------------------------------------------------------------------------
// Scene 5 : ЗАСТАВЬ ЕГО РАБОТАТЬ -> CTA НАПИШИ СВЯЗКА
// -------------------------------------------------------------------------
const Scene5: React.FC<{ f: number; gf: number }> = ({ f, gf }) => {
  const at = (s: number) => s2f(s) - SCENES[4];
  const stop = ramp(f, at(38.24), at(38.6));
  const stopStrike = ramp(f, at(39.86), at(40.3), 0, 1, INOUT);
  const make = ramp(f, at(40.66), at(41.0));
  const prog = ramp(f, at(41.0), at(42.6), 0, 1, Easing.linear);
  const cta = ramp(f, at(42.7), at(43.1));
  const ctaWord = "СВЯЗКА";
  const typed = Math.floor(ramp(f, at(43.6), at(44.0), 0, ctaWord.length, Easing.linear));
  const cards = [ramp(f, at(45.8), at(46.1)), ramp(f, at(46.02), at(46.32)), ramp(f, at(46.2), at(46.5))];
  const partA = 1 - cta;

  return (
    <AbsoluteFill>
      <StatusBar f={f} gf={gf} title={cta > 0.5 ? "CALL_TO_ACTION.exe" : "REBOOT --mode=system"} idx="05" />

      {/* Part A */}
      <div style={{ position: "absolute", left: 72, right: 72, top: 260, opacity: partA }}>
        <div style={{ opacity: stop, position: "relative", display: "inline-block" }}>
          <Cond size={96} color={CREAM} glow={false}>
            ПЕРЕСТАНЬ
            <br />
            ПЕРЕПИСЫВАТЬСЯ
          </Cond>
          <div
            style={{
              position: "absolute",
              left: -10,
              top: "52%",
              height: 12,
              width: `${stopStrike * 104}%`,
              background: AMBER,
              boxShadow: GLOW,
            }}
          />
        </div>
        <div style={{ marginTop: 36, display: "flex", flexDirection: "column", gap: 16, opacity: stop * (1 - make * 0.6) }}>
          {["привет", "напиши текст", "ещё раз", "нет, не так"].map((m, i) => (
            <div
              key={m}
              style={{
                alignSelf: mod(i, 2) === 0 ? "flex-end" : "flex-start",
                background: mod(i, 2) === 0 ? CREAM : "rgba(140,109,70,0.35)",
                color: mod(i, 2) === 0 ? CHAR : CREAM,
                fontFamily: BODY,
                fontWeight: 600,
                fontSize: 30,
                padding: "12px 24px",
                borderRadius: 24,
                opacity: ramp(f, at(38.4) + i * 8, at(38.4) + i * 8 + 10),
              }}
            >
              {m}
            </div>
          ))}
        </div>
        <div style={{ marginTop: 50, opacity: make, transform: `scale(${0.9 + 0.1 * make})`, transformOrigin: "left center" }}>
          <Cond size={128}>
            ЗАСТАВЬ ЕГО
            <br />
            РАБОТАТЬ
          </Cond>
          <div style={{ marginTop: 26, display: "flex", alignItems: "center", gap: 20 }}>
            <div style={{ flex: 1, height: 30, border: `3px solid ${AMBER}`, padding: 4 }}>
              <div style={{ height: "100%", width: `${prog * 100}%`, background: AMBER, boxShadow: GLOW_SOFT }} />
            </div>
            <Mono size={28} color={AMBER}>
              {Math.round(prog * 100)}%
            </Mono>
          </div>
          <Mono size={24} color={BRONZE} style={{ marginTop: 12 }}>
            НА ТЕБЯ // АВТОНОМНО
          </Mono>
        </div>
      </div>

      {/* Part B: CTA */}
      <div style={{ position: "absolute", left: 72, right: 72, top: 230, opacity: cta, transform: `translateY(${(1 - cta) * 50}px)` }}>
        <Mono size={34} color={BRONZE}>
          {">"} НАПИШИ В КОММЕНТАРИЯХ:
        </Mono>
        <div
          style={{
            marginTop: 30,
            border: `6px solid ${AMBER}`,
            padding: "30px 40px",
            boxShadow: `${GLOW}, inset 0 0 60px rgba(255,159,28,0.15)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: 240,
          }}
        >
          <Cond size={230} style={{ letterSpacing: 6 }}>
            {ctaWord.slice(0, typed)}
          </Cond>
          <Cursor f={f} size={190} />
        </div>
        {/* comment input mock */}
        <div
          style={{
            marginTop: 50,
            display: "flex",
            alignItems: "center",
            gap: 20,
            background: CREAM,
            borderRadius: 50,
            padding: "18px 26px",
          }}
        >
          <div style={{ width: 60, height: 60, borderRadius: 30, background: BRONZE }} />
          <div style={{ flex: 1, fontFamily: BODY, fontSize: 36, color: CHAR, fontWeight: 600 }}>
            {typed > 0 ? ctaWord.toLowerCase().slice(0, typed) : "Добавьте комментарий…"}
          </div>
          <div
            style={{
              width: 60,
              height: 60,
              borderRadius: 30,
              background: typed >= ctaWord.length ? AMBER : "rgba(140,109,70,0.4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: MONO,
              fontWeight: 800,
              fontSize: 34,
              color: CHAR,
            }}
          >
            ↑
          </div>
        </div>
        <Mono size={30} color={CREAM} style={{ marginTop: 60 }}>
          → ПОЛУЧИШЬ <span style={{ color: AMBER, textShadow: GLOW_SOFT }}>3 ГОТОВЫХ ПРИМЕРА</span>
        </Mono>
        <div style={{ marginTop: 26, display: "flex", gap: 24 }}>
          {["ТРЕНД→РИЛС", "ЛИД-БОТ", "АВТОПОСТ"].map((t, i) => (
            <div key={t} style={{ flex: 1, opacity: cards[i], transform: `translateY(${(1 - cards[i]) * 40}px)` }}>
              <Panel hot={i === mod(Math.floor(f / 40), 3)} label={`#0${i + 1}`} style={{ padding: "34px 18px 24px", textAlign: "center" }}>
                <Cond size={46} color={CREAM} glow={false}>
                  {t}
                </Cond>
              </Panel>
            </div>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// -------------------------------------------------------------------------
// CRT layers
// -------------------------------------------------------------------------
const CrtOverlay: React.FC<{ gf: number }> = ({ gf }) => {
  const roll = mod(gf * 6, H + 400) - 200;
  const flicker = 0.97 + 0.03 * hash(Math.floor(gf / 2));
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {/* scanlines */}
      <AbsoluteFill
        style={{
          backgroundImage: "repeating-linear-gradient(0deg, rgba(0,0,0,0.28) 0px, rgba(0,0,0,0.28) 2px, transparent 2px, transparent 5px)",
          mixBlendMode: "multiply",
        }}
      />
      {/* rolling refresh bar */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: roll,
          height: 220,
          background: "linear-gradient(180deg, transparent, rgba(255,159,28,0.05), transparent)",
        }}
      />
      {/* flicker + vignette with screen curvature */}
      <AbsoluteFill style={{ background: `rgba(13,10,6,${1 - flicker})` }} />
      <AbsoluteFill
        style={{
          background: "radial-gradient(ellipse at center, transparent 55%, rgba(13,10,6,0.55) 85%, rgba(0,0,0,0.9) 100%)",
        }}
      />
    </AbsoluteFill>
  );
};

// horizontal phosphor shutter at each cut
const Shutter: React.FC<{ gf: number }> = ({ gf }) => {
  let best = -1;
  // cut 1 is the fly-into-the-CRT move, no shutter there
  for (let i = 2; i < SCENES.length - 1; i++) {
    const d = gf - SCENES[i];
    if (d > -14 && d < 18) best = i;
  }
  if (best < 0) return null;
  const d = gf - SCENES[best];
  // close over 14f before cut, open over 18f after
  const k = d < 0 ? ramp(d, -14, 0, 0, 1, INOUT) : ramp(d, 0, 18, 1, 0, INOUT);
  const STRIPS = 14;
  const sh = H / STRIPS;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {Array.from({ length: STRIPS }).map((_, i) => {
        const delay = mod(i * 5, 7) / 7;
        const kk = Math.max(0, Math.min(1, k * 1.3 - delay * 0.3));
        const off = (mod(i, 2) === 0 ? -1 : 1) * (1 - kk) * 120;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: off,
              right: -off,
              top: i * sh + (sh * (1 - kk)) / 2,
              height: sh * kk,
              background: CHAR,
              borderTop: kk > 0.05 ? `2px solid rgba(255,159,28,${0.8 * kk})` : "none",
              boxShadow: kk > 0.05 ? `0 0 18px rgba(255,159,28,${0.5 * kk})` : "none",
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

// CRT scan-wipe reveal for incoming scene
const ScanWipe: React.FC<{ f: number; first: boolean; children: ReactNode }> = ({ f, first, children }) => {
  if (first) {
    // power-on: vertical expand from a bright line
    const p = ramp(f, 0, 16, 0, 1, OUT);
    const flash = ramp(f, 0, 6, 1, 0);
    return (
      <AbsoluteFill style={{ transform: `scaleY(${0.004 + 0.996 * p}) scaleX(${1 + (1 - p) * 0.1})`, filter: `brightness(${1 + flash * 2})` }}>
        {children}
      </AbsoluteFill>
    );
  }
  const p = ramp(f, 0, OVERLAP, 0, 1, INOUT);
  const edge = p * H;
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ clipPath: `inset(0 0 ${(1 - p) * 100}% 0)`, background: CHAR }}>{children}</AbsoluteFill>
      {p < 1 ? (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: edge - 4,
            height: 8,
            background: CREAM,
            boxShadow: "0 0 30px 10px rgba(255,159,28,0.8)",
          }}
        />
      ) : null}
    </AbsoluteFill>
  );
};

// power-off at the very end
const PowerOff: React.FC<{ gf: number; children: ReactNode }> = ({ gf, children }) => {
  const p = ramp(gf, TOTAL - 34, TOTAL - 8, 0, 1, INOUT);
  if (p <= 0) return <>{children}</>;
  const sy = Math.max(0.003, 1 - p);
  const sx = p > 0.85 ? 1 - (p - 0.85) / 0.15 : 1;
  return (
    <AbsoluteFill style={{ transform: `scale(${Math.max(sx, 0.002)}, ${sy})`, filter: `brightness(${1 + p * 3})` }}>
      {children}
    </AbsoluteFill>
  );
};

// -------------------------------------------------------------------------
// Background: warm charcoal + bokeh phosphor dust + floor grid (depth)
// -------------------------------------------------------------------------
const Background: React.FC<{ gf: number }> = ({ gf }) => {
  const t = gf / FPS;
  return (
    <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 35%, ${CHAR_2} 0%, ${CHAR} 70%)` }}>
      {/* perspective floor grid */}
      <div
        style={{
          position: "absolute",
          left: -600,
          right: -600,
          bottom: -200,
          height: 900,
          transform: "perspective(700px) rotateX(68deg)",
          transformOrigin: "bottom center",
          backgroundImage:
            "linear-gradient(rgba(140,109,70,0.22) 2px, transparent 2px), linear-gradient(90deg, rgba(140,109,70,0.22) 2px, transparent 2px)",
          backgroundSize: "90px 90px",
          backgroundPosition: `0 ${mod(t * 40, 90)}px`,
          maskImage: "linear-gradient(0deg, rgba(0,0,0,0.9), transparent)",
          WebkitMaskImage: "linear-gradient(0deg, rgba(0,0,0,0.9), transparent)",
        }}
      />
      {/* bokeh dust */}
      {Array.from({ length: 18 }).map((_, i) => {
        const x = hash(i) * W;
        const y = mod(hash(i + 50) * H - t * (8 + hash(i + 9) * 18), H);
        const r = 20 + hash(i + 20) * 70;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x - r,
              top: y - r,
              width: r * 2,
              height: r * 2,
              borderRadius: r,
              background: i % 3 === 0 ? "rgba(253,246,227,0.05)" : "rgba(255,159,28,0.07)",
              filter: `blur(${6 + hash(i + 4) * 14}px)`,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

// -------------------------------------------------------------------------
// Subtitles: cream pill, amber active word, guaranteed horizontal spacing
// -------------------------------------------------------------------------
const Subtitles: React.FC<{ gf: number }> = ({ gf }) => {
  const t = gf / FPS;
  let ci = -1;
  for (let i = 0; i < CHUNKS.length; i++) if (t >= CHUNKS[i].start - 0.05) ci = i;
  if (ci < 0) return null;
  const chunk = CHUNKS[ci];
  const nextStart = ci + 1 < CHUNKS.length ? CHUNKS[ci + 1].start : chunk.end + 1;
  if (t > Math.min(nextStart, chunk.end + 0.8)) return null;
  const local = gf - s2f(chunk.start);
  const pop = ramp(local, -3, 8);
  return (
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 250, display: "flex", justifyContent: "center", pointerEvents: "none" }}>
      <div
        style={{
          background: CREAM,
          borderRadius: 22,
          padding: "20px 34px",
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          alignItems: "center",
          columnGap: 24,
          rowGap: 12,
          maxWidth: 930,
          transform: `translateY(${(1 - pop) * 24}px) scale(${0.96 + 0.04 * pop})`,
          opacity: pop,
          boxShadow: "0 20px 60px rgba(0,0,0,0.7), 0 0 0 4px rgba(255,159,28,0.9), 0 0 40px rgba(255,159,28,0.35)",
        }}
      >
        {chunk.words.map((w, i) => {
          const active = t >= w.start && t < w.end + 0.05;
          const done = t >= w.end;
          return (
            <span
              key={i}
              style={{
                fontFamily: COND,
                fontSize: 68,
                lineHeight: 1.1,
                letterSpacing: 1.5,
                textTransform: "uppercase",
                padding: "2px 14px",
                borderRadius: 10,
                color: active ? CHAR : done ? CHAR : "rgba(13,10,6,0.4)",
                background: active ? AMBER : "transparent",
                whiteSpace: "nowrap",
              }}
            >
              {w.word}
            </span>
          );
        })}
      </div>
    </div>
  );
};


// -------------------------------------------------------------------------
// Scene 1 ROOM: dark sunset room, bulky CRT on a desk, fly INTO the screen
// The CRT screen is an exact 9:16 miniature of the full frame (SCR_K scale),
// so when the camera reaches scale 1/SCR_K the screen fills 1080x1920
// pixel-for-pixel and Scenes 2-5 continue full-screen seamlessly.
// -------------------------------------------------------------------------
const SCR_K = 0.56;
const SCR_W = W * SCR_K;
const SCR_H = H * SCR_K;
const SCR_CX = W / 2;
const SCR_CY = 790;
const SCR_X = SCR_CX - SCR_W / 2;
const SCR_Y = SCR_CY - SCR_H / 2;
const ZOOM_A = s2f(7.5);
const ZOOM_B = s2f(9.5);
const FLY = Easing.bezier(0.55, 0, 0.15, 1);
const BEZ_L = SCR_X - 64;
const BEZ_T = SCR_Y - 70;
const BEZ_W = SCR_W + 128;
const BEZ_H = SCR_H + 220;
const DESK_Y = BEZ_T + BEZ_H - 30;

const RoomIntro: React.FC<{ f: number; gf: number }> = ({ f, gf }) => {
  const t = gf / FPS;
  const e = ramp(gf, ZOOM_A, ZOOM_B, 0, 1, FLY);
  const pre = interpolate(gf, [0, ZOOM_A], [1.0, 1.07], clamp);
  const lnS = (1 - e) * Math.log(pre) + e * Math.log(1 / SCR_K);
  const tx = (1 - e) * (Math.sin(t * 0.5) * 7) + e * (W / 2 - SCR_CX);
  const ty = (1 - e) * (Math.cos(t * 0.4) * 6) + e * (H / 2 - SCR_CY);
  const rot = (1 - e) * Math.sin(t * 0.33) * 0.35;
  const layer = (d: number, extra: CSSProperties = {}): CSSProperties => ({
    position: "absolute",
    left: 0,
    top: 0,
    width: W,
    height: H,
    transformOrigin: `${SCR_CX}px ${SCR_CY}px`,
    transform: `translate(${tx * d}px, ${ty * d}px) rotate(${rot * d}deg) scale(${Math.exp(lnS * d)})`,
    ...extra,
  });
  // CRT flicker: fine jitter + occasional dips, settles to 1 inside the screen
  const dip = hash(Math.floor(gf / 22) + 7) > 0.9 ? 0.78 : 1;
  const fl = (0.92 + 0.08 * hash(Math.floor(gf / 3))) * dip;
  const scrBright = 1 + (fl - 1) * (1 - e);
  const glass = interpolate(e, [0.55, 1], [1, 0], clamp);
  const roomFade = interpolate(e, [0.7, 1], [1, 0], clamp);

  return (
    <AbsoluteFill style={{ background: "#060403", overflow: "hidden" }}>
      {/* ---------- far wall + window + curtains (DOF blur) ---------- */}
      <div style={layer(0.55, { filter: `blur(${2.5 + e * 6}px)` })}>
        <AbsoluteFill style={{ background: "linear-gradient(180deg, #140d08 0%, #1b120b 45%, #0c0805 100%)" }} />
        {/* window with half-closed blinds, sunset peeking through */}
        <div style={{ position: "absolute", left: -40, top: 110, width: 240, height: 780, border: "12px solid #1c130c", background: "linear-gradient(180deg, #ffb057 0%, #ff7a3d 40%, #d9481a 68%, #4a1d0f 100%)", boxShadow: "0 0 120px 30px rgba(255,120,50,0.25)" }}>
          <AbsoluteFill style={{ backgroundImage: "repeating-linear-gradient(180deg, #2a1a10 0px, #2a1a10 22px, rgba(0,0,0,0) 22px, rgba(0,0,0,0) 30px)" }} />
          <div style={{ position: "absolute", left: "50%", top: 0, bottom: 0, width: 4, background: "#1c130c" }} />
        </div>
        {/* heavy curtain */}
        <div style={{ position: "absolute", left: -30, top: 40, width: 130, height: 1100, background: "repeating-linear-gradient(90deg, #26110a 0px, #3a1a0e 18px, #1d0c06 36px)", boxShadow: "20px 0 40px rgba(0,0,0,0.7)", borderBottomRightRadius: 40 }} />
        {/* blinds projected onto the wall: skewed sunset stripes */}
        <div style={{ position: "absolute", left: 420, top: -60, width: 760, height: 640, transform: "skewY(-20deg)", backgroundImage: "repeating-linear-gradient(180deg, rgba(255,128,52,0.30) 0px, rgba(255,128,52,0.30) 13px, rgba(0,0,0,0) 13px, rgba(0,0,0,0) 34px)", maskImage: "linear-gradient(90deg, transparent 0%, black 25%, black 75%, transparent 100%)", WebkitMaskImage: "linear-gradient(90deg, transparent 0%, black 25%, black 75%, transparent 100%)", filter: "blur(2px)" }} />
        {/* a dim shelf with books on the right */}
        <div style={{ position: "absolute", left: 930, top: 520, width: 200, height: 10, background: "#2a1c11" }} />
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} style={{ position: "absolute", left: 940 + i * 26, top: 520 - (70 + hash(i + 3) * 40), width: 22, height: 70 + hash(i + 3) * 40, background: mod(i, 2) === 0 ? "#2b1d12" : "#1e140c" }} />
        ))}
      </div>

      {/* ---------- desk ---------- */}
      <div style={layer(0.9)}>
        <div style={{ position: "absolute", left: -200, right: -200, top: DESK_Y, height: H, background: "linear-gradient(180deg, #2c1d12 0%, #1b120b 30%, #0c0805 75%)", borderTop: "3px solid rgba(255,159,28,0.18)" }}>
          <AbsoluteFill style={{ backgroundImage: "repeating-linear-gradient(92deg, rgba(0,0,0,0.12) 0px, rgba(0,0,0,0) 6px, rgba(0,0,0,0) 40px)", opacity: 0.8 }} />
        </div>
        {/* sunset stripes falling across the desk */}
        <div style={{ position: "absolute", left: -120, top: DESK_Y + 10, width: 620, height: 300, transform: "skewX(-35deg)", backgroundImage: "repeating-linear-gradient(180deg, rgba(255,128,52,0.16) 0px, rgba(255,128,52,0.16) 10px, rgba(0,0,0,0) 10px, rgba(0,0,0,0) 26px)", maskImage: "linear-gradient(90deg, black, transparent)", WebkitMaskImage: "linear-gradient(90deg, black, transparent)", filter: "blur(1.5px)" }} />
        {/* amber pool of light from the screen */}
        <div style={{ position: "absolute", left: SCR_CX - 520, top: DESK_Y - 120, width: 1040, height: 420, background: `radial-gradient(ellipse at 50% 30%, rgba(255,159,28,${0.26 * fl}) 0%, rgba(255,159,28,0) 70%)` }} />
        {/* soft contact shadow under the monitor */}
        <div style={{ position: "absolute", left: SCR_CX - 330, top: DESK_Y + 40, width: 660, height: 70, borderRadius: "50%", background: "rgba(0,0,0,0.85)", filter: "blur(22px)" }} />
      </div>

      {/* ---------- CRT monitor ---------- */}
      <div style={layer(1)}>
        {/* tapering back casing peeking on the right */}
        <div style={{ position: "absolute", left: BEZ_L + BEZ_W - 12, top: BEZ_T + 60, width: 80, height: BEZ_H - 120, background: "linear-gradient(90deg, #211a12, #0d0906)", clipPath: "polygon(0 0, 100% 7%, 100% 93%, 0 100%)" }} />
        {/* stand */}
        <div style={{ position: "absolute", left: SCR_CX - 170, top: DESK_Y - 10, width: 340, height: 56, borderRadius: 14, background: "linear-gradient(180deg, #2e251a, #120d08)", boxShadow: "0 10px 20px rgba(0,0,0,0.7)" }} />
        {/* front bezel */}
        <div style={{ position: "absolute", left: BEZ_L, top: BEZ_T, width: BEZ_W, height: BEZ_H, borderRadius: 46, background: "linear-gradient(160deg, #3d3226 0%, #2b2319 42%, #18120c 100%)", boxShadow: "inset 0 3px 0 rgba(255,220,180,0.14), inset 0 -10px 18px rgba(0,0,0,0.6), inset 6px 0 14px rgba(255,159,28,0.06), 0 50px 90px rgba(0,0,0,0.75)", overflow: "hidden" }}>
          {/* sunset stripe across the bezel */}
          <div style={{ position: "absolute", left: -200, top: -120, width: 600, height: 700, transform: "skewY(-20deg)", backgroundImage: "repeating-linear-gradient(180deg, rgba(255,128,52,0.12) 0px, rgba(255,128,52,0.12) 12px, rgba(0,0,0,0) 12px, rgba(0,0,0,0) 32px)", maskImage: "linear-gradient(90deg, black, transparent)", WebkitMaskImage: "linear-gradient(90deg, black, transparent)" }} />
          {/* badge, LED, knobs, vents */}
          <div style={{ position: "absolute", left: 70, top: BEZ_H - 112, display: "flex", alignItems: "center", gap: 18 }}>
            <Mono size={20} color={BRONZE} style={{ letterSpacing: 4 }}>AMBR·TRON 86</Mono>
          </div>
          <div style={{ position: "absolute", right: 70, top: BEZ_H - 118, display: "flex", alignItems: "center", gap: 26 }}>
            {[0, 1].map((i) => (
              <div key={i} style={{ width: 34, height: 34, borderRadius: 17, background: "radial-gradient(circle at 35% 30%, #4a3c2c, #120d08)", boxShadow: "0 3px 6px rgba(0,0,0,0.7)" }} />
            ))}
            <div style={{ width: 14, height: 14, borderRadius: 7, background: AMBER, boxShadow: `0 0 ${10 + 8 * fl}px rgba(255,159,28,0.9)`, opacity: 0.7 + 0.3 * fl }} />
          </div>
          <div style={{ position: "absolute", left: BEZ_W / 2 - 120, top: BEZ_H - 60, width: 240, height: 30, backgroundImage: "repeating-linear-gradient(90deg, #0c0805 0px, #0c0805 6px, rgba(0,0,0,0) 6px, rgba(0,0,0,0) 14px)", opacity: 0.8 }} />
        </div>
        {/* recessed screen lip with phosphor spill */}
        <div style={{ position: "absolute", left: SCR_X - 22, top: SCR_Y - 22, width: SCR_W + 44, height: SCR_H + 44, borderRadius: 40, background: "#080604", boxShadow: `inset 0 0 22px rgba(0,0,0,0.95), 0 0 ${50 * fl}px rgba(255,159,28,${0.22 * fl})` }} />
        {/* the screen: full-size Scene 1 shrunk to SCR_K */}
        <div style={{ position: "absolute", left: SCR_X, top: SCR_Y, width: SCR_W, height: SCR_H, borderRadius: 30 * (1 - e), overflow: "hidden", background: CHAR }}>
          <div style={{ position: "absolute", left: 0, top: 0, width: W, height: H, transform: `scale(${SCR_K})`, transformOrigin: "0 0", filter: `brightness(${scrBright})` }}>
            <Background gf={gf} />
            <ScanWipe f={f} first>
              <Camera gf={gf}>
                <Scene1 f={f} gf={gf} />
              </Camera>
            </ScanWipe>
            <CrtOverlay gf={gf} />
          </div>
          {/* curved glass: edge falloff + reflections (fade as we pass through) */}
          <div style={{ position: "absolute", inset: 0, opacity: glass, boxShadow: "inset 0 0 70px 24px rgba(0,0,0,0.8)", background: "radial-gradient(ellipse at 30% 18%, rgba(255,235,200,0.10) 0%, rgba(255,235,200,0) 35%), linear-gradient(125deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0) 30%, rgba(255,255,255,0) 70%, rgba(255,140,60,0.05) 100%)" }} />
        </div>
      </div>

      {/* ---------- foreground: keyboard + mug (near DOF blur) ---------- */}
      <div style={layer(1.35, { filter: `blur(${3 + e * 8}px)`, opacity: roomFade })}>
        <div style={{ position: "absolute", left: 230, top: DESK_Y + 150, width: 620, height: 180, clipPath: "polygon(6% 0, 94% 0, 100% 100%, 0 100%)", background: "linear-gradient(180deg, #3a2f22, #17110a)" }}>
          <AbsoluteFill style={{ backgroundImage: "repeating-linear-gradient(90deg, rgba(0,0,0,0.55) 0px, rgba(0,0,0,0.55) 4px, rgba(0,0,0,0) 4px, rgba(0,0,0,0) 40px), repeating-linear-gradient(180deg, rgba(0,0,0,0.55) 0px, rgba(0,0,0,0.55) 4px, rgba(0,0,0,0) 4px, rgba(0,0,0,0) 36px)" }} />
          <AbsoluteFill style={{ background: `linear-gradient(180deg, rgba(255,159,28,${0.18 * fl}), rgba(255,159,28,0) 50%)` }} />
        </div>
        <div style={{ position: "absolute", left: 880, top: DESK_Y + 70, width: 120, height: 150, borderRadius: "10px 10px 24px 24px", background: "linear-gradient(90deg, #2a1a10, #4a2e1a 40%, #160e08)", boxShadow: "inset 0 6px 0 rgba(255,159,28,0.25)" }} />
      </div>

      {/* ---------- volumetric sunset beams + dust in the air ---------- */}
      <AbsoluteFill style={{ opacity: roomFade, mixBlendMode: "screen", pointerEvents: "none" }}>
        <div style={{ position: "absolute", left: -300, top: 60, width: 1800, height: 900, transform: "rotate(24deg)", transformOrigin: "0 0", backgroundImage: "repeating-linear-gradient(180deg, rgba(255,130,50,0.11) 0px, rgba(255,130,50,0.11) 18px, rgba(0,0,0,0) 18px, rgba(0,0,0,0) 42px)", maskImage: "linear-gradient(90deg, black 0%, transparent 75%)", WebkitMaskImage: "linear-gradient(90deg, black 0%, transparent 75%)", filter: "blur(9px)" }} />
        {Array.from({ length: 34 }).map((_, i) => {
          const x = mod(hash(i + 100) * W + t * (6 + hash(i + 7) * 10), W);
          const y = mod(hash(i + 200) * H * 0.75 - t * (4 + hash(i + 3) * 8), H * 0.75);
          const r = 2 + hash(i + 11) * 5;
          const tw = 0.3 + 0.7 * Math.abs(Math.sin(t * (0.8 + hash(i) * 1.5) + i));
          return (
            <div key={i} style={{ position: "absolute", left: x, top: y, width: r * 2, height: r * 2, borderRadius: r, background: "rgba(255,190,120,0.8)", opacity: 0.35 * tw * (1 - x / W), filter: `blur(${hash(i + 31) * 4}px)` }} />
          );
        })}
      </AbsoluteFill>

      {/* ---------- moody room vignette ---------- */}
      <AbsoluteFill style={{ opacity: roomFade, background: "radial-gradient(ellipse at 50% 42%, rgba(0,0,0,0) 38%, rgba(0,0,0,0.55) 75%, rgba(0,0,0,0.9) 100%)", pointerEvents: "none" }} />
    </AbsoluteFill>
  );
};

// -------------------------------------------------------------------------
// Root composition
// -------------------------------------------------------------------------
const SCENE_COMPONENTS = [Scene1, Scene2, Scene3, Scene4, Scene5];

const SceneHost: React.FC<{ i: number; from: number }> = ({ i, from }) => {
  const f = useCurrentFrame();
  const C = SCENE_COMPONENTS[mod(i, SCENE_COMPONENTS.length)];
  if (i === 0) return <RoomIntro f={f} gf={f + from} />;
  return (
    <ScanWipe f={f} first={i === 0}>
      <Camera gf={f + from}>
        <C f={f} gf={f + from} />
      </Camera>
    </ScanWipe>
  );
};

export const AmberCrtReel: React.FC = () => {
  const gf = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: "#000", overflow: "hidden" }}>
      <Audio src={staticFile("amber_crt_reel/voice.mp3")} />
      <PowerOff gf={gf}>
        <Background gf={gf} />
        {SCENES.slice(0, -1).map((from, i) => {
          const to = SCENES[i + 1];
          const dur = Math.min(to - from + OVERLAP, TOTAL - from);
          return (
            <Sequence key={i} from={from} durationInFrames={dur} layout="none">
              <AbsoluteFill>
                <SceneHost i={i} from={from} />
              </AbsoluteFill>
            </Sequence>
          );
        })}
        <Shutter gf={gf} />
        <Subtitles gf={gf} />
        <div style={{ position: "absolute", left: 72, right: 72, bottom: 120, display: "flex", alignItems: "center" }}>
          <Mono size={20} color={BRONZE} style={{ flex: 1 }}>
            ● REC &nbsp; MAKE IT EASY AI
          </Mono>
          <Mono size={20} color={BRONZE}>
            {String(Math.floor(gf / FPS)).padStart(2, "0")}.{String(mod(Math.floor((gf / FPS) * 10), 10))}s / 49.0s
          </Mono>
        </div>
        {/* Scene 1 renders its own CRT layer inside the monitor screen */}
        {gf >= SCENES[1] ? <CrtOverlay gf={gf} /> : null}
      </PowerOff>
    </AbsoluteFill>
  );
};
