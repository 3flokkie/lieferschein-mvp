import React from "react";
import {
  AbsoluteFill,
  Audio,
  Easing,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

/*
 * =========================================================================
 * TESLA FSD REEL — 1080x1920 @ 60 FPS, 3000 FRAMES (50s)
 *
 *   00  0.0 –  9.0s : 3D cockpit, night highway, self-steering wheel,
 *                     touchscreen "КАК ДУМАЕТ АВТОПИЛОТ TESLA?" + 360° lidar.
 *                     7.2 → 9.0s camera flies INTO the touchscreen.
 *   02  9.0 – 22.1s : Planner fan of trajectories → "2026: АВТОПИЛОТ ДЛЯ БИЗНЕСА"
 *   03 22.1 – 27.5s : Agent 01 Radar — 360° sweep locks hot clients
 *   04 27.5 – 33.1s : Agent 02 Filter — orange noise removed + 3D offer card
 *   05 33.1 – 43.0s : Agent 03 Checkout — client car → "+$1,500 ОПЛАЧЕНО" gate,
 *                     "КРУТИТЬ РУЛЬ РУКАМИ 24/7" crossed out, system ON
 *   06 43.0 – 50.0s : Camera pulls back OUT into cockpit parked at glass
 *                     arrival terminal + CTA "НАПИШИ АВТОПИЛОТ"
 *
 * All cyclic indices / offsets go through mod().
 * =========================================================================
 */

const FPS = 60;

const C = {
  bg: "#0B0E14",
  bg2: "#11151D",
  panel: "rgba(17,21,29,0.92)",
  line: "rgba(148,163,184,0.16)",
  blue: "#38BDF8",
  white: "#F8FAFC",
  orange: "#F97316",
  green: "#10B981",
  dim: "#94A3B8",
  muted: "#64748B",
};

const SANS = "'Inter', 'SF Pro Display', -apple-system, 'Helvetica Neue', Arial, sans-serif";
const MONO = "'JetBrains Mono', 'SF Mono', Menlo, Consolas, monospace";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const EASE_IO = Easing.bezier(0.65, 0, 0.3, 1);
const EXPO_OUT = Easing.bezier(0.16, 1, 0.3, 1);
const sec = (s: number) => Math.round(s * FPS);
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

/** Safe modulo — always returns a value in [0, m), even for negative n. */
const mod = (n: number, m: number) => ((n % m) + m) % m;

const rand = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

const smooth = (a: number, b: number, x: number) => {
  const u = clamp01((x - a) / (b - a));
  return u * u * (3 - 2 * u);
};

/** Window alpha: fades in around a, out around b (seconds). */
const win = (t: number, a: number, b: number, fi = 0.3, fo = 0.3) =>
  Math.min(fi > 0 ? smooth(a - fi * 0.5, a + fi * 0.5, t) : t >= a ? 1 : 0, fo > 0 ? 1 - smooth(b - fo, b, t) : t < b ? 1 : 0);

const sp = (f: number, atSec: number, cfg = { damping: 14, stiffness: 170, mass: 0.6 }) =>
  spring({ frame: Math.max(0, f - sec(atSec)), fps: FPS, config: cfg });

const fmt = (n: number) => Math.round(n).toLocaleString("ru-RU").replace(/ /g, " ");

// -------------------------------------------------------------------------
// Words (inlined from public/tesla_fsd_reel/words.json)
// -------------------------------------------------------------------------
type W = { word: string; start: number; end: number };
const WORDS: W[] = [{"word":"А","start":0.0,"end":0.24},{"word":"знаешь,","start":0.24,"end":0.62},{"word":"как","start":0.8,"end":0.88},{"word":"на","start":0.88,"end":1.1},{"word":"самом","start":1.1,"end":1.38},{"word":"деле","start":1.38,"end":1.66},{"word":"думает","start":1.66,"end":2.1},{"word":"автопилот","start":2.1,"end":2.7},{"word":"Теслы?","start":2.7,"end":3.36},{"word":"Каждую","start":3.78,"end":4.28},{"word":"секунду","start":4.28,"end":4.82},{"word":"его","start":4.82,"end":5.0},{"word":"нейросеть","start":5.0,"end":5.56},{"word":"сканирует","start":5.56,"end":6.3},{"word":"дорогу","start":6.3,"end":6.82},{"word":"на","start":6.82,"end":6.94},{"word":"360","start":6.94,"end":7.56},{"word":"градусов,","start":7.56,"end":8.64},{"word":"просчитывает","start":9.08,"end":9.62},{"word":"сотни","start":9.62,"end":10.0},{"word":"траекторий","start":10.0,"end":10.68},{"word":"и","start":10.68,"end":11.12},{"word":"сама","start":11.12,"end":11.42},{"word":"ведет","start":11.42,"end":11.76},{"word":"машину","start":11.76,"end":12.24},{"word":"по","start":12.24,"end":12.44},{"word":"идеальной","start":12.44,"end":12.98},{"word":"сине","start":12.98,"end":13.34},{"word":"и","start":13.34,"end":13.56},{"word":"линии.","start":13.56,"end":13.96},{"word":"Но","start":14.26,"end":14.42},{"word":"самое","start":14.42,"end":14.74},{"word":"интересное,","start":14.74,"end":15.44},{"word":"в","start":15.86,"end":15.94},{"word":"2026","start":15.94,"end":17.18},{"word":"году","start":17.18,"end":17.86},{"word":"точно","start":17.86,"end":18.64},{"word":"такой","start":18.64,"end":19.06},{"word":"же","start":19.06,"end":19.24},{"word":"автопилот","start":19.24,"end":19.74},{"word":"ставит","start":19.74,"end":20.12},{"word":"на","start":20.12,"end":20.28},{"word":"обычный","start":20.28,"end":20.78},{"word":"онлайн","start":20.78,"end":21.18},{"word":"-бизнес.","start":21.18,"end":21.54},{"word":"Первый","start":22.18,"end":22.7},{"word":"агент,","start":22.7,"end":23.02},{"word":"как","start":23.12,"end":23.22},{"word":"радар,","start":23.22,"end":23.66},{"word":"круглосуточно","start":23.86,"end":24.62},{"word":"сканирует","start":24.62,"end":25.2},{"word":"рынок","start":25.2,"end":25.66},{"word":"и","start":25.66,"end":26.04},{"word":"находит","start":26.04,"end":26.42},{"word":"горячих","start":26.42,"end":26.98},{"word":"клиентов.","start":26.98,"end":27.56},{"word":"Второй","start":27.56,"end":28.48},{"word":"агент","start":28.48,"end":28.8},{"word":"отсекает","start":28.8,"end":29.3},{"word":"пустые","start":29.3,"end":29.72},{"word":"вопросы","start":29.72,"end":30.08},{"word":"и","start":30.08,"end":30.42},{"word":"мгновенно","start":30.42,"end":30.88},{"word":"собирает","start":30.88,"end":31.42},{"word":"коммерческое","start":31.42,"end":32.12},{"word":"предложение.","start":32.12,"end":32.82},{"word":"Отретий.","start":33.2,"end":33.68},{"word":"Доводит","start":34.28,"end":34.68},{"word":"сделку","start":34.68,"end":35.18},{"word":"до","start":35.18,"end":35.34},{"word":"оплаты,","start":35.34,"end":35.9},{"word":"пока","start":35.98,"end":36.14},{"word":"ты","start":36.14,"end":36.28},{"word":"просто","start":36.28,"end":36.56},{"word":"сидишь","start":36.56,"end":36.98},{"word":"в","start":36.98,"end":37.08},{"word":"кресле.","start":37.08,"end":37.46},{"word":"Пока","start":38.08,"end":38.26},{"word":"другие","start":38.26,"end":38.66},{"word":"крутят","start":38.66,"end":39.12},{"word":"руль","start":39.12,"end":39.32},{"word":"руками","start":39.32,"end":39.7},{"word":"24","start":39.7,"end":40.22},{"word":"часа","start":40.22,"end":40.82},{"word":"в","start":40.82,"end":40.88},{"word":"сутки,","start":40.88,"end":41.24},{"word":"умные","start":41.6,"end":41.96},{"word":"включают","start":41.96,"end":42.6},{"word":"систему.","start":42.6,"end":43.3},{"word":"Напиши","start":43.9,"end":44.34},{"word":"слово","start":44.34,"end":44.58},{"word":"автопилот","start":44.58,"end":45.44},{"word":"в","start":45.44,"end":45.62},{"word":"комментариях","start":45.62,"end":46.36},{"word":"и","start":46.36,"end":46.76},{"word":"я","start":46.76,"end":46.92},{"word":"покажу,","start":46.92,"end":47.32},{"word":"как","start":47.48,"end":47.58},{"word":"его","start":47.58,"end":47.8},{"word":"собрать.","start":47.8,"end":48.2}];

// Display fixes for ASR typos (timing untouched)
const DISPLAY_FIX: Record<string, string> = { "сине": "синей", "Отретий.": "Третий —", "-бизнес.": "бизнес." };

// -------------------------------------------------------------------------
// Camera: fly-in / pull-back, drift, punch zoom
// -------------------------------------------------------------------------
const SS = 0.42; // touchscreen scale inside cockpit
const SW = 1080 * SS;
const SH = 1920 * SS;
const SX = 640; // touchscreen centre in cockpit
const SY = 1330;

const PUNCH_BEATS = [2.1, 6.94, 9.08, 12.44, 15.94, 22.18, 26.42, 27.56, 31.42, 33.2, 35.34, 39.32, 41.96, 43.9, 44.58];

const punchAt = (t: number) => {
  let v = 0;
  for (const b of PUNCH_BEATS) {
    const k = t - b;
    if (k >= 0 && k < 1.2) v = Math.max(v, Math.exp(-k * 5) * Math.min(1, k * 14));
  }
  return v;
};

const zoomProgress = (t: number) => {
  if (t < 26) return interpolate(t, [7.2, 9.0], [0, 1], { ...clamp, easing: EASE_IO });
  return 1 - interpolate(t, [43.0, 44.8], [0, 1], { ...clamp, easing: EASE_IO });
};

// -------------------------------------------------------------------------
// Windshield world (perspective-projected highway / terminal)
// -------------------------------------------------------------------------
const HZ = 560;
const P = (X: number, h: number, d: number): [number, number] => [540 + (X * 450) / d, HZ + ((1.2 - h) * 450) / d];
const poly = (pts: [number, number][]) => pts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");

type Bld = { x: number; w: number; h: number; win: { x: number; y: number; c: string }[] };
const SKYLINE: Bld[] = (() => {
  const out: Bld[] = [];
  let x = -30;
  let i = 0;
  while (x < 1110) {
    const w = 26 + rand(i) * 52;
    const center = 1 - Math.abs(x + w / 2 - 540) / 700;
    const h = 40 + rand(i + 50) * 150 * (0.5 + center) + (rand(i + 9) > 0.86 ? 120 : 0);
    const wins: Bld["win"] = [];
    const cols = Math.floor((w - 6) / 9);
    const rows = Math.floor((h - 8) / 12);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const k = rand(i * 977 + r * 31 + c * 7);
        if (k > 0.74) wins.push({ x: x + 4 + c * 9, y: HZ - h + 6 + r * 12, c: k > 0.95 ? "#BAE6FD" : "#FCD9A8" });
      }
    }
    out.push({ x, w, h, win: wins });
    x += w + 2 + rand(i + 3) * 6;
    i++;
  }
  return out;
})();

const STARS = Array.from({ length: 60 }, (_, i) => ({ x: rand(i + 400) * 1080, y: rand(i + 500) * 380, r: 0.6 + rand(i + 600) * 1.4 }));

const Windshield: React.FC<{ t: number; parked: boolean }> = ({ t, parked }) => {
  const travel = parked ? 1210.5 : t * 27;
  const dashes: React.ReactNode[] = [];
  for (const X of [-1.8, 1.8]) {
    for (let i = 0; i < 16; i++) {
      const d0 = 1.6 + i * 12 - mod(travel, 12);
      if (d0 + 4 < 1.35) continue;
      const d = Math.max(1.35, d0);
      const len = d0 + 4 - d;
      const w = 0.09;
      dashes.push(
        <polygon
          key={`${X}-${i}`}
          points={poly([P(X - w, 0, d), P(X + w, 0, d), P(X + w, 0, d + len), P(X - w, 0, d + len)])}
          fill={C.white}
          opacity={0.85 * clamp01(1.4 - d / 140)}
        />,
      );
    }
  }
  const lights: React.ReactNode[] = [];
  for (const side of [-1, 1]) {
    for (let i = 0; i < 9; i++) {
      const d = 3 + i * 36 - mod(travel + (side > 0 ? 18 : 0), 36);
      if (d < 1.6) continue;
      const X = side * 8.2;
      const [bx, by] = P(X, 0, d);
      const [tx, ty] = P(X, 9, d);
      const [lx, ly] = P(X - side * 1.8, 8.8, d);
      const s = 450 / d;
      lights.push(
        <g key={`l${side}${i}`} opacity={clamp01(1.2 - d / 300)}>
          <line x1={bx} y1={by} x2={tx} y2={ty} stroke="#1F2631" strokeWidth={Math.max(1, 0.22 * s)} />
          <line x1={tx} y1={ty} x2={lx} y2={ly} stroke="#1F2631" strokeWidth={Math.max(1, 0.16 * s)} />
          <circle cx={lx} cy={ly} r={Math.max(1.5, 2.4 * s)} fill="url(#lampGlow)" />
          <circle cx={lx} cy={ly} r={Math.max(0.8, 0.28 * s)} fill="#FFF7E6" />
          <ellipse cx={P(X - side * 2.2, 0, d)[0]} cy={P(X, 0, d)[1]} rx={3.4 * s} ry={0.9 * s * 0.5} fill="url(#poolGlow)" />
        </g>,
      );
    }
  }
  const cars = parked
    ? []
    : [
        { X: -3.6, d: 34 + 6 * Math.sin(t * 0.31) },
        { X: 0, d: 58 + 4 * Math.sin(t * 0.22 + 1) },
        { X: 3.6, d: 19 + 5 * Math.sin(t * 0.4 + 2) },
      ].sort((a, b) => b.d - a.d);

  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1100, overflow: "hidden", background: "#05070B" }}>
      {/* far layer: sky + skyline (heavy DoF blur) */}
      <svg width={1080} height={1100} style={{ position: "absolute", inset: 0, filter: "blur(2.6px)" }}>
        <defs>
          <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#03050A" />
            <stop offset="0.62" stopColor="#0B1220" />
            <stop offset="1" stopColor="#16233A" />
          </linearGradient>
          <radialGradient id="cityGlow" cx="0.5" cy="1" r="0.7">
            <stop offset="0" stopColor="rgba(56,189,248,0.22)" />
            <stop offset="1" stopColor="rgba(56,189,248,0)" />
          </radialGradient>
        </defs>
        <rect x={0} y={0} width={1080} height={HZ + 4} fill="url(#sky)" />
        {STARS.map((s, i) => (
          <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#E2E8F0" opacity={0.25 + 0.35 * mod(i * 0.37 + t * 0.2, 1)} />
        ))}
        <ellipse cx={540} cy={HZ} rx={720} ry={220} fill="url(#cityGlow)" />
        {SKYLINE.map((b, i) => (
          <g key={i}>
            <rect x={b.x} y={HZ - b.h} width={b.w} height={b.h + 4} fill={i % 3 === 0 ? "#0C111A" : "#0A0E15"} />
            {b.win.map((w, j) => (
              <rect key={j} x={w.x} y={w.y} width={4.5} height={6} fill={w.c} opacity={0.75} />
            ))}
          </g>
        ))}
      </svg>

      {/* mid layer: road + lights */}
      <svg width={1080} height={1100} style={{ position: "absolute", inset: 0, filter: "blur(0.9px)" }}>
        <defs>
          <linearGradient id="asphalt" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#141A24" />
            <stop offset="1" stopColor="#0A0D13" />
          </linearGradient>
          <radialGradient id="lampGlow">
            <stop offset="0" stopColor="rgba(255,236,200,0.85)" />
            <stop offset="0.35" stopColor="rgba(255,214,160,0.25)" />
            <stop offset="1" stopColor="rgba(255,214,160,0)" />
          </radialGradient>
          <radialGradient id="poolGlow">
            <stop offset="0" stopColor="rgba(255,220,170,0.16)" />
            <stop offset="1" stopColor="rgba(255,220,170,0)" />
          </radialGradient>
          <radialGradient id="tail">
            <stop offset="0" stopColor="rgba(249,115,22,1)" />
            <stop offset="1" stopColor="rgba(249,115,22,0)" />
          </radialGradient>
          <linearGradient id="glass" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="rgba(56,189,248,0.28)" />
            <stop offset="0.5" stopColor="rgba(148,163,184,0.10)" />
            <stop offset="1" stopColor="rgba(56,189,248,0.22)" />
          </linearGradient>
        </defs>
        <polygon points={poly([P(-9, 0, 1.25), P(9, 0, 1.25), P(9, 0, 400), P(-9, 0, 400)])} fill="url(#asphalt)" />
        {[-5.4, 5.4].map((X) => (
          <polygon key={X} points={poly([P(X - 0.1, 0, 1.3), P(X + 0.1, 0, 1.3), P(X + 0.1, 0, 300), P(X - 0.1, 0, 300)])} fill={C.white} opacity={0.55} />
        ))}
        {dashes}
        {lights}
        {cars.map((c, i) => {
          const [x0, y0] = P(c.X - 0.95, 1.4, c.d);
          const [x1, y1] = P(c.X + 0.95, 0.15, c.d);
          const s = 450 / c.d;
          return (
            <g key={i}>
              <rect x={x0} y={y0} width={x1 - x0} height={y1 - y0} rx={0.25 * s} fill="#06080C" />
              {[-0.7, 0.7].map((o) => {
                const [lx, ly] = P(c.X + o, 0.85, c.d);
                return (
                  <g key={o}>
                    <circle cx={lx} cy={ly} r={1.1 * s} fill="url(#tail)" opacity={0.6} />
                    <rect x={lx - 0.22 * s} y={ly - 0.07 * s} width={0.44 * s} height={0.14 * s} fill="#FDBA74" />
                  </g>
                );
              })}
            </g>
          );
        })}
        {parked && (
          <g>
            {/* glass arrival terminal */}
            <ellipse cx={540} cy={HZ + 40} rx={560} ry={60} fill="rgba(56,189,248,0.10)" />
            <rect x={110} y={HZ - 290} width={860} height={300} fill="#0B1422" />
            <rect x={110} y={HZ - 290} width={860} height={300} fill="url(#glass)" />
            {Array.from({ length: 21 }, (_, i) => (
              <line key={`v${i}`} x1={110 + i * 43} y1={HZ - 290} x2={110 + i * 43} y2={HZ + 10} stroke="rgba(226,232,240,0.22)" strokeWidth={2} />
            ))}
            {Array.from({ length: 6 }, (_, i) => (
              <line key={`h${i}`} x1={110} y1={HZ - 290 + i * 60} x2={970} y2={HZ - 290 + i * 60} stroke="rgba(226,232,240,0.18)" strokeWidth={2} />
            ))}
            <rect x={110} y={HZ - 110} width={860} height={34} fill="rgba(248,250,252,0.55)" />
            <polygon points={`70,${HZ - 300} 1010,${HZ - 300} 960,${HZ - 330} 120,${HZ - 330}`} fill="#1A2332" />
            <rect x={70} y={HZ - 304} width={940} height={6} fill={C.blue} opacity={0.9} />
            <rect x={330} y={HZ - 262} width={420} height={70} rx={10} fill="rgba(11,14,20,0.85)" stroke={C.green} strokeWidth={3} />
            <text x={540} y={HZ - 216} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={32} letterSpacing={6} fill={C.white}>
              ARRIVAL TERMINAL
            </text>
            {[300, 540, 780].map((x) => (
              <rect key={x} x={x - 3} y={HZ - 100} width={6} height={110} fill="rgba(248,250,252,0.35)" />
            ))}
            {/* parking bay lines */}
            {[-1.8, 1.8].map((X) => (
              <polygon key={`b${X}`} points={poly([P(X - 0.08, 0, 1.6), P(X + 0.08, 0, 1.6), P(X + 0.08, 0, 9), P(X - 0.08, 0, 9)])} fill={C.green} opacity={0.8} />
            ))}
            <polygon points={poly([P(-1.8, 0, 9), P(1.8, 0, 9), P(1.8, 0, 9.4), P(-1.8, 0, 9.4)])} fill={C.green} opacity={0.8} />
          </g>
        )}
      </svg>

      {/* bokeh layer */}
      <div style={{ position: "absolute", inset: 0, filter: "blur(16px)" }}>
        {Array.from({ length: 12 }, (_, i) => {
          const x = mod(rand(i + 70) * 1300 + (parked ? 0 : t * (i % 2 ? 26 : -18)), 1300) - 110;
          const y = HZ - 120 + rand(i + 80) * 200;
          const r = 22 + rand(i + 90) * 40;
          const col = i % 4 === 0 ? "rgba(56,189,248,0.35)" : i % 4 === 1 ? "rgba(249,115,22,0.28)" : "rgba(255,226,180,0.3)";
          return <div key={i} style={{ position: "absolute", left: x - r, top: y - r, width: r * 2, height: r * 2, borderRadius: "50%", background: col }} />;
        })}
      </div>

      {/* windshield reflection */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(115deg, rgba(255,255,255,0) 30%, rgba(255,255,255,0.05) 42%, rgba(255,255,255,0) 52%)",
        }}
      />
    </div>
  );
};

// -------------------------------------------------------------------------
// Cockpit interior
// -------------------------------------------------------------------------
const Interior: React.FC = () => (
  <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
    <defs>
      <linearGradient id="dash" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#151922" />
        <stop offset="0.25" stopColor="#0C0F15" />
        <stop offset="1" stopColor="#040507" />
      </linearGradient>
      <linearGradient id="pillar" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#030406" />
        <stop offset="1" stopColor="#0E1118" />
      </linearGradient>
    </defs>
    {/* roof header */}
    <path d="M0,0 L1080,0 L1080,70 C760,110 320,110 0,70 Z" fill="#06080B" />
    <path d="M0,70 C320,110 760,110 1080,70" stroke="rgba(56,189,248,0.35)" strokeWidth={2} fill="none" />
    {/* mirror */}
    <rect x={410} y={84} width={260} height={84} rx={30} fill="#07090D" stroke="rgba(148,163,184,0.25)" strokeWidth={2} />
    <rect x={426} y={98} width={228} height={56} rx={22} fill="#0E1522" />
    <rect x={532} y={60} width={16} height={30} fill="#07090D" />
    {/* A-pillars */}
    <path d="M0,40 L120,40 L36,1040 L0,1050 Z" fill="url(#pillar)" />
    <path d="M1080,40 L960,40 L1044,1040 L1080,1050 Z" fill="url(#pillar)" />
    <path d="M120,40 L36,1040" stroke="rgba(56,189,248,0.3)" strokeWidth={2} />
    <path d="M960,40 L1044,1040" stroke="rgba(56,189,248,0.3)" strokeWidth={2} />
    {/* dashboard */}
    <path d="M0,1040 C260,985 820,985 1080,1040 L1080,1920 L0,1920 Z" fill="url(#dash)" />
    <path d="M0,1040 C260,985 820,985 1080,1040" stroke="rgba(56,189,248,0.55)" strokeWidth={3} fill="none" />
    <path d="M0,1120 C260,1075 820,1075 1080,1120" stroke="rgba(248,250,252,0.08)" strokeWidth={10} fill="none" />
    <path d="M30,1150 C270,1110 810,1110 1050,1150" stroke="rgba(0,0,0,0.8)" strokeWidth={6} fill="none" />
  </svg>
);

const SteeringWheel: React.FC<{ angle: number }> = ({ angle }) => (
  <svg width={640} height={640} style={{ position: "absolute", left: 150 - 320, top: 1660 - 320, overflow: "visible" }}>
    <defs>
      <radialGradient id="hub">
        <stop offset="0" stopColor="#262B35" />
        <stop offset="1" stopColor="#12151B" />
      </radialGradient>
    </defs>
    <ellipse cx={360} cy={360} rx={260} ry={250} fill="rgba(0,0,0,0.55)" style={{ filter: "blur(22px)" }} />
    <g transform={`rotate(${angle} 320 320)`}>
      <circle cx={320} cy={320} r={238} fill="none" stroke="#0E1116" strokeWidth={56} />
      <circle cx={320} cy={320} r={238} fill="none" stroke="#1B2029" strokeWidth={40} />
      <circle cx={320} cy={320} r={266} fill="none" stroke="rgba(56,189,248,0.55)" strokeWidth={2.5} />
      <path d="M100,330 C180,360 240,370 290,360" stroke="#252B36" strokeWidth={40} fill="none" strokeLinecap="round" />
      <path d="M540,330 C460,360 400,370 350,360" stroke="#252B36" strokeWidth={40} fill="none" strokeLinecap="round" />
      <path d="M320,400 L320,550" stroke="#252B36" strokeWidth={44} strokeLinecap="round" />
      <circle cx={320} cy={340} r={82} fill="url(#hub)" stroke="rgba(148,163,184,0.25)" strokeWidth={2} />
      <rect x={296} y={322} width={48} height={8} rx={4} fill="#94A3B8" />
      <rect x={316} y={322} width={8} height={40} rx={4} fill="#94A3B8" />
      <circle cx={320} cy={84} r={8} fill={C.blue} />
    </g>
  </svg>
);

const HandsFree: React.FC<{ f: number; t: number }> = ({ f, t }) => {
  const a = sp(f, 0.4) * (1 - smooth(6.8, 7.4, t));
  const blink = 0.5 + 0.5 * Math.sin(t * 6);
  return (
    <div
      style={{
        position: "absolute",
        left: 34,
        top: 1150,
        opacity: a,
        transform: `translateY(${(1 - a) * 20}px)`,
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "14px 26px",
        borderRadius: 999,
        background: "rgba(11,14,20,0.88)",
        border: `2px solid ${C.green}`,
        boxShadow: "0 0 30px rgba(16,185,129,0.35)",
        fontFamily: MONO,
        fontSize: 30,
        fontWeight: 800,
        letterSpacing: 4,
        color: C.white,
      }}
    >
      <div style={{ width: 16, height: 16, borderRadius: 8, background: C.green, opacity: 0.4 + 0.6 * blink }} />
      HANDS-FREE
    </div>
  );
};

const Cockpit: React.FC<{ f: number; t: number; zp: number }> = ({ f, t, zp }) => {
  const parked = t >= 26;
  const wheelAngle = parked ? 4 * Math.sin(t * 0.6) * (1 - smooth(44, 46, t)) : Math.sin(t * 1.15) * 24 + Math.sin(t * 0.43 + 1) * 10;
  const scale = lerp(1, 1 / SS, zp);
  const tx = (540 - SX) * zp;
  const ty = (960 - SY) * zp;
  const tilt = 1 - zp;
  return (
    <AbsoluteFill style={{ transformOrigin: `${SX}px ${SY}px`, transform: `translate(${tx}px, ${ty}px) scale(${scale})` }}>
      <Windshield t={t} parked={parked} />
      <Interior />
      {/* soft shadow of touchscreen on dashboard */}
      <div
        style={{
          position: "absolute",
          left: SX - SW * 0.55,
          top: SY + SH / 2 - 30,
          width: SW * 1.1,
          height: 120,
          borderRadius: "50%",
          background: "rgba(0,0,0,0.75)",
          filter: "blur(26px)",
        }}
      />
      {/* touchscreen */}
      <div
        style={{
          position: "absolute",
          left: SX - SW / 2 - 14,
          top: SY - SH / 2 - 14,
          width: SW + 28,
          height: SH + 28,
          borderRadius: 26 * tilt + 4,
          background: "#040507",
          boxShadow: `0 0 0 2px rgba(56,189,248,${0.45 * tilt}), 0 0 60px rgba(56,189,248,${0.25 * tilt}), 0 40px 80px rgba(0,0,0,0.7)`,
          transform: `perspective(1600px) rotateY(${-9 * tilt}deg) rotateX(${3 * tilt}deg)`,
          transformOrigin: "50% 50%",
        }}
      >
        <div style={{ position: "absolute", left: 14, top: 14, width: SW, height: SH, overflow: "hidden", borderRadius: 14 * tilt }}>
          <div style={{ width: 1080, height: 1920, transform: `scale(${SS})`, transformOrigin: "0 0" }}>
            <FsdUI f={f} />
          </div>
          <div
            style={{
              position: "absolute",
              inset: 0,
              opacity: tilt,
              background: "linear-gradient(125deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0) 38%, rgba(255,255,255,0) 70%, rgba(255,255,255,0.05) 100%)",
            }}
          />
        </div>
      </div>
      <SteeringWheel angle={wheelAngle} />
      <HandsFree f={f} t={t} />
    </AbsoluteFill>
  );
};

// -------------------------------------------------------------------------
// FSD UI — 3D road plane (CSS 3D)
// -------------------------------------------------------------------------
const PW = 1000;
const PH = 2800;
const TILT = 62;
const EGO_X = 500;
const EGO_Y = 2380;
const LANE_C = [233, 500, 767];

const Cube: React.FC<{
  x: number;
  y: number;
  w: number;
  d: number;
  h: number;
  color: string;
  fill?: string;
  top?: string;
  alpha?: number;
  bw?: number;
  label?: React.ReactNode;
}> = ({ x, y, w, d, h, color, fill = "rgba(248,250,252,0.05)", top, alpha = 1, bw = 3, label }) => {
  const face: React.CSSProperties = { position: "absolute", border: `${bw}px solid ${color}`, background: fill, opacity: alpha, boxSizing: "border-box" };
  return (
    <div style={{ position: "absolute", left: x - w / 2, top: y - d / 2, width: w, height: d, transformStyle: "preserve-3d" }}>
      <div style={{ ...face, left: 0, top: 0, width: w, height: d, background: "rgba(0,0,0,0.35)", boxShadow: `0 0 40px ${color}55` }} />
      <div style={{ ...face, left: 0, top: -h, width: w, height: h, transformOrigin: "50% 100%", transform: "rotateX(-90deg)" }} />
      <div style={{ ...face, left: -h, top: 0, width: h, height: d, transformOrigin: "100% 50%", transform: "rotateY(90deg)" }} />
      <div style={{ ...face, left: w, top: 0, width: h, height: d, transformOrigin: "0% 50%", transform: "rotateY(-90deg)" }} />
      <div style={{ ...face, left: 0, top: d, width: w, height: h, transformOrigin: "50% 0%", transform: "rotateX(90deg)" }} />
      <div style={{ ...face, left: 0, top: 0, width: w, height: d, background: top ?? fill, transform: `translateZ(${h}px)` }} />
      {label && (
        <div
          style={{
            position: "absolute",
            left: w / 2,
            top: d / 2,
            transformOrigin: "0 0",
            transform: `translateZ(${h + 16}px) rotateX(${-TILT}deg) translate(-50%, -100%)`,
            opacity: alpha,
          }}
        >
          {label}
        </div>
      )}
    </div>
  );
};

const Billboard: React.FC<{ x: number; y: number; z?: number; children: React.ReactNode }> = ({ x, y, z = 0, children }) => (
  <div style={{ position: "absolute", left: x, top: y, width: 0, height: 0, transformStyle: "preserve-3d" }}>
    <div style={{ position: "absolute", left: 0, top: 0, transformOrigin: "0 0", transform: `translateZ(${z}px) rotateX(${-TILT}deg) translate(-50%, -100%)` }}>
      {children}
    </div>
  </div>
);

const Tag: React.FC<{ color: string; children: React.ReactNode; size?: number; solid?: boolean }> = ({ color, children, size = 30, solid }) => (
  <div
    style={{
      whiteSpace: "nowrap",
      padding: `${size * 0.3}px ${size * 0.6}px`,
      borderRadius: size * 0.35,
      background: solid ? color : "rgba(11,14,20,0.9)",
      border: `3px solid ${color}`,
      color: solid ? C.bg : C.white,
      fontFamily: MONO,
      fontWeight: 800,
      fontSize: size,
      letterSpacing: 1,
    }}
  >
    {children}
  </div>
);

const EgoCar: React.FC<{ x?: number; y?: number; label?: React.ReactNode; alpha?: number }> = ({ x = EGO_X, y = EGO_Y, label, alpha = 1 }) => (
  <Cube
    x={x}
    y={y}
    w={132}
    d={250}
    h={64}
    color="rgba(248,250,252,0.95)"
    fill="linear-gradient(180deg, #CBD5E1, #94A3B8)"
    top="linear-gradient(180deg, #F8FAFC 0%, #E2E8F0 30%, #1E293B 31%, #1E293B 55%, #E2E8F0 56%)"
    bw={2}
    alpha={alpha}
    label={label}
  />
);

const Road3D: React.FC<{ travel: number; pathAlpha: number; pathColor?: string; children?: React.ReactNode }> = ({
  travel,
  pathAlpha,
  pathColor = C.blue,
  children,
}) => (
  <div style={{ position: "absolute", left: 0, top: 360, width: 1080, height: 1240, perspective: 1100, perspectiveOrigin: "50% 8%", overflow: "hidden" }}>
    <div
      style={{
        position: "absolute",
        left: (1080 - PW) / 2,
        top: 1240 - PH,
        width: PW,
        height: PH,
        transformOrigin: "50% 100%",
        transform: `translateY(-40px) rotateX(${TILT}deg)`,
        transformStyle: "preserve-3d",
      }}
    >
      {/* asphalt */}
      <div style={{ position: "absolute", left: 60, top: 0, width: PW - 120, height: PH, background: "linear-gradient(180deg, rgba(30,36,48,0.0), rgba(30,36,48,0.9) 30%, #1A1F29)" }} />
      {/* grid shoulder */}
      <div
        style={{
          position: "absolute",
          left: -600,
          top: 0,
          width: PW + 1200,
          height: PH,
          backgroundImage: "linear-gradient(rgba(56,189,248,0.07) 2px, transparent 2px), linear-gradient(90deg, rgba(56,189,248,0.07) 2px, transparent 2px)",
          backgroundSize: "120px 120px",
          backgroundPosition: `0 ${mod(travel, 120)}px`,
        }}
      />
      {/* edge lines */}
      {[100, 900].map((x) => (
        <div key={x} style={{ position: "absolute", left: x - 5, top: 0, width: 10, height: PH, background: "rgba(248,250,252,0.7)" }} />
      ))}
      {/* dashed lane lines */}
      {[366, 633].map((x) => (
        <div
          key={x}
          style={{
            position: "absolute",
            left: x - 5,
            top: 0,
            width: 10,
            height: PH,
            backgroundImage: "repeating-linear-gradient(180deg, rgba(248,250,252,0.85) 0 110px, transparent 110px 240px)",
            backgroundPosition: `0 ${mod(travel, 240)}px`,
          }}
        />
      ))}
      {/* autopilot path */}
      <div
        style={{
          position: "absolute",
          left: EGO_X - 75,
          top: 300,
          width: 150,
          height: EGO_Y - 300,
          opacity: pathAlpha,
          background: `linear-gradient(0deg, ${pathColor}DD, ${pathColor}66 60%, ${pathColor}00)`,
          borderRadius: 75,
          boxShadow: `0 0 60px ${pathColor}66`,
        }}
      />
      <div style={{ position: "absolute", left: EGO_X - 4, top: 300, width: 8, height: EGO_Y - 300, opacity: pathAlpha, background: `linear-gradient(0deg, #E0F2FE, #E0F2FE00)` }} />
      {children}
    </div>
    {/* far fade + scanline */}
    <div style={{ position: "absolute", inset: 0, background: `linear-gradient(180deg, ${C.bg} 0%, ${C.bg}00 30%)`, pointerEvents: "none" }} />
  </div>
);

const Lidar: React.FC<{ t: number; alpha: number; cx?: number; cy?: number; speed?: number }> = ({ t, alpha, cx = EGO_X, cy = EGO_Y, speed = 160 }) => {
  const ang = mod(t * speed, 360);
  const R = 1150;
  return (
    <>
      <div
        style={{
          position: "absolute",
          left: cx - R,
          top: cy - R,
          width: R * 2,
          height: R * 2,
          borderRadius: "50%",
          opacity: alpha * 0.9,
          background: `conic-gradient(from ${ang}deg, rgba(56,189,248,0.55) 0deg, rgba(56,189,248,0.0) 55deg, rgba(56,189,248,0) 360deg)`,
        }}
      />
      {[0, 1, 2, 3].map((i) => {
        const k = mod(t * 0.55 + i * 0.25, 1);
        const r = 120 + k * 1050;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: cx - r,
              top: cy - r,
              width: r * 2,
              height: r * 2,
              borderRadius: "50%",
              border: `4px solid rgba(56,189,248,${0.7 * (1 - k)})`,
              opacity: alpha,
            }}
          />
        );
      })}
      {[300, 600, 900].map((r) => (
        <div
          key={`s${r}`}
          style={{ position: "absolute", left: cx - r, top: cy - r, width: r * 2, height: r * 2, borderRadius: "50%", border: "2px dashed rgba(148,163,184,0.35)", opacity: alpha }}
        />
      ))}
    </>
  );
};

// Market points for radar
const MARKET = Array.from({ length: 80 }, (_, i) => {
  const a = rand(i + 1200) * Math.PI * 2;
  const r = 220 + rand(i + 1300) * 1000;
  return { x: EGO_X + Math.cos(a) * r, y: EGO_Y + Math.sin(a) * r * 1.1, a: mod((a * 180) / Math.PI + 90, 360) };
}).filter((p) => p.y < 2700 && p.y > 200);

const HOT = [
  { x: 233, y: 1450, t: 26.04, p: 94 },
  { x: 767, y: 1150, t: 26.42, p: 91 },
  { x: 500, y: 820, t: 26.98, p: 97 },
];

const NOISE = [
  { x: 500, y: 1700, t: 28.8, txt: "«ПРОСТО СПРОСИТЬ»", dir: -1 },
  { x: 233, y: 1250, t: 29.3, txt: "«А СКИДКА?»", dir: -1 },
  { x: 767, y: 1400, t: 29.72, txt: "«Я ПОДУМАЮ»", dir: 1 },
  { x: 500, y: 950, t: 30.08, txt: "СПАМ", dir: 1 },
];

// -------------------------------------------------------------------------
// FSD UI — 2D chrome + overlays
// -------------------------------------------------------------------------
const TopBar: React.FC<{ t: number; speed: number }> = ({ t, speed }) => (
  <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 150, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 56px", boxSizing: "border-box", borderBottom: `2px solid ${C.line}`, background: "linear-gradient(180deg, #0F131B, #0B0E14)" }}>
    <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
      <div style={{ padding: "8px 18px", borderRadius: 12, background: C.blue, color: C.bg, fontFamily: MONO, fontWeight: 900, fontSize: 30 }}>FSD</div>
      <div style={{ fontFamily: MONO, color: C.dim, fontSize: 26, letterSpacing: 2 }}>SUPERVISED · v14</div>
    </div>
    <div style={{ display: "flex", alignItems: "baseline", gap: 10, fontFamily: SANS, color: C.white }}>
      <span style={{ fontSize: 76, fontWeight: 800, fontVariantNumeric: "tabular-nums" }}>{Math.round(speed)}</span>
      <span style={{ fontSize: 26, color: C.dim }}>км/ч</span>
    </div>
    <div style={{ display: "flex", alignItems: "center", gap: 14, fontFamily: MONO, fontSize: 26, fontWeight: 800, color: C.green, letterSpacing: 2 }}>
      <div style={{ width: 16, height: 16, borderRadius: 8, background: C.green, boxShadow: `0 0 16px ${C.green}`, opacity: 0.55 + 0.45 * Math.sin(t * 5) }} />
      АКТИВЕН
    </div>
  </div>
);

const Header: React.FC<{ alpha: number; f: number; at: number; chip: string; chipColor?: string; title: React.ReactNode; sub?: string }> = ({
  alpha,
  f,
  at,
  chip,
  chipColor = C.blue,
  title,
  sub,
}) => {
  if (alpha <= 0) return null;
  const s = sp(f, at, { damping: 16, stiffness: 160, mass: 0.7 });
  return (
    <div style={{ position: "absolute", left: 60, right: 60, top: 190, opacity: alpha, transform: `translateY(${(1 - s) * 40}px)` }}>
      <div style={{ display: "inline-flex", alignItems: "center", gap: 12, padding: "8px 20px", borderRadius: 999, border: `2px solid ${chipColor}`, color: chipColor, fontFamily: MONO, fontWeight: 800, fontSize: 28, letterSpacing: 4 }}>
        <div style={{ width: 12, height: 12, borderRadius: 6, background: chipColor }} />
        {chip}
      </div>
      <div style={{ marginTop: 18, fontFamily: SANS, fontWeight: 900, fontSize: 92, lineHeight: 1.0, letterSpacing: -2, color: C.white }}>{title}</div>
      {sub && <div style={{ marginTop: 14, fontFamily: SANS, fontWeight: 600, fontSize: 34, color: C.dim }}>{sub}</div>}
    </div>
  );
};

const Stat: React.FC<{ label: string; value: string; color?: string }> = ({ label, value, color = C.white }) => (
  <div style={{ flex: 1, padding: "20px 26px", borderRadius: 22, background: C.panel, border: `2px solid ${C.line}` }}>
    <div style={{ fontFamily: MONO, fontSize: 22, letterSpacing: 3, color: C.muted }}>{label}</div>
    <div style={{ marginTop: 6, fontFamily: SANS, fontWeight: 800, fontSize: 52, color, fontVariantNumeric: "tabular-nums" }}>{value}</div>
  </div>
);

const StatRow: React.FC<{ alpha: number; children: React.ReactNode }> = ({ alpha, children }) =>
  alpha > 0 ? (
    <div style={{ position: "absolute", left: 56, right: 56, top: 1500, display: "flex", gap: 20, opacity: alpha }}>{children}</div>
  ) : null;

const FsdUI: React.FC<{ f: number }> = ({ f }) => {
  const t = f / FPS;
  const travel = t < 43 ? t * 620 : 43 * 620 + (620 * (1 - Math.exp(-(t - 43) * 1.3))) / 1.3;
  const speed = t < 43 ? 98 + 3 * Math.sin(t * 0.7) : 98 * Math.exp(-(t - 43) * 1.3);

  const aHook = win(t, -1, 9.0, 0, 0.4);
  const aTraj = win(t, 9.0, 14.2);
  const aBiz = win(t, 14.2, 22.1);
  const aRadar = win(t, 22.1, 27.5);
  const aFilter = win(t, 27.5, 33.1);
  const aPay = win(t, 33.1, 43.0);
  const aEnd = win(t, 43.0, 99, 0.4, 0);

  const lidarA = Math.max(aHook * smooth(3.7, 4.6, t), aRadar);
  const pathA = Math.max(0.35, aTraj * smooth(12.3, 12.8, t), aBiz, aPay, aEnd, aFilter * smooth(30.0, 30.4, t));
  const offerP = sp(f, 30.42, { damping: 15, stiffness: 120, mass: 0.8 });
  const carP = interpolate(t, [34.28, 35.9], [0, 1], { ...clamp, easing: EASE_IO });
  const paid = t >= 35.34;
  const locked = HOT.filter((h) => t >= h.t).length;

  return (
    <AbsoluteFill style={{ background: `radial-gradient(120% 70% at 50% 45%, ${C.bg2} 0%, ${C.bg} 70%)`, overflow: "hidden" }}>
      <Road3D travel={travel} pathAlpha={pathA} pathColor={aEnd > 0.5 ? C.green : C.blue}>
        {/* HOOK: surrounding traffic + 360 lidar */}
        {lidarA > 0 && <Lidar t={t} alpha={lidarA} speed={t < 22 ? 240 : 180} />}
        {aHook > 0 &&
          [
            { x: 233, y: 1650 + 60 * Math.sin(t * 0.6), l: "28 м" },
            { x: 767, y: 2100 + 80 * Math.sin(t * 0.5 + 1), l: "9 м" },
            { x: 500, y: 1250 + 50 * Math.sin(t * 0.4 + 2), l: "52 м" },
            { x: 767, y: 900, l: "80 м" },
          ].map((v, i) => (
            <Cube key={i} x={v.x} y={v.y} w={120} d={220} h={90} color={C.white} alpha={aHook * sp(f, 0.3 + i * 0.25)} label={<Tag color={C.white} size={26}>{v.l}</Tag>} />
          ))}
        {aHook > 0 && <Cube x={905} y={1500} w={50} d={50} h={150} color={C.orange} fill="rgba(249,115,22,0.15)" alpha={aHook * sp(f, 1.4)} label={<Tag color={C.orange} size={24}>ПЕШЕХОД</Tag>} />}

        {/* TRAJECTORY FAN */}
        {aTraj > 0 && (
          <svg width={PW} height={PH} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", opacity: aTraj }}>
            {Array.from({ length: 25 }, (_, i) => {
              const k = i - 12;
              const best = k === 0;
              const ex = EGO_X + k * 85 + 30 * Math.sin(t * 1.3 + i);
              const cx = EGO_X + k * 20 * Math.sin(t * 0.8 + i * 0.5);
              const draw = smooth(9.08 + mod(i * 7, 25) * 0.04, 9.9 + mod(i * 7, 25) * 0.04, t);
              const chosen = smooth(12.44, 12.9, t);
              const len = 2200;
              return (
                <path
                  key={i}
                  d={`M${EGO_X},${EGO_Y - 120} Q${cx},${1500} ${ex},${350 + Math.abs(k) * 30}`}
                  fill="none"
                  stroke={best ? C.white : C.blue}
                  strokeWidth={best ? 10 + 14 * chosen : 5}
                  strokeOpacity={best ? 0.5 + 0.5 * chosen : 0.45 * (1 - 0.8 * chosen)}
                  strokeDasharray={len}
                  strokeDashoffset={len * (1 - draw)}
                  strokeLinecap="round"
                />
              );
            })}
          </svg>
        )}

        {/* BUSINESS PIPELINE SIGNS */}
        {aBiz > 0 &&
          [
            { y: 2000, x: 40, l: "01 · ЛИД", at: 19.24 },
            { y: 1550, x: 960, l: "02 · ДИАЛОГ", at: 19.74 },
            { y: 1100, x: 40, l: "03 · ОФФЕР", at: 20.28 },
            { y: 650, x: 960, l: "04 · ОПЛАТА", at: 20.78 },
          ].map((s, i) => {
            const a = sp(f, s.at) * aBiz;
            return (
              <React.Fragment key={i}>
                <Cube x={s.x} y={s.y} w={18} d={18} h={170 * a} color="#475569" fill="#334155" bw={1} alpha={aBiz} />
                <Billboard x={s.x} y={s.y} z={170 * a}>
                  <div style={{ opacity: a, transform: `scale(${0.6 + 0.4 * a})` }}>
                    <Tag color={i === 3 ? C.green : C.blue} size={40}>
                      {s.l}
                    </Tag>
                  </div>
                </Billboard>
              </React.Fragment>
            );
          })}

        {/* RADAR */}
        {aRadar > 0 &&
          MARKET.map((p, i) => {
            const ang = mod(t * 180, 360);
            const diff = mod(ang - p.a, 360);
            const hit = diff < 60 ? 1 - diff / 60 : 0;
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: p.x - 9,
                  top: p.y - 9,
                  width: 18,
                  height: 18,
                  borderRadius: 9,
                  background: hit > 0.2 ? C.white : C.muted,
                  opacity: aRadar * (0.35 + 0.65 * hit),
                  boxShadow: hit > 0.2 ? `0 0 20px ${C.blue}` : "none",
                }}
              />
            );
          })}
        {aRadar > 0 && (
          <svg width={PW} height={PH} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", opacity: aRadar }}>
            {HOT.map((h, i) => {
              const k = smooth(h.t, h.t + 0.3, t);
              return k > 0 ? <line key={i} x1={EGO_X} y1={EGO_Y} x2={h.x} y2={h.y} stroke={C.blue} strokeWidth={6} strokeDasharray="20 16" strokeOpacity={k} /> : null;
            })}
          </svg>
        )}
        {aRadar > 0 &&
          HOT.map((h, i) => {
            const k = sp(f, h.t, { damping: 11, stiffness: 220, mass: 0.5 });
            if (t < h.t) return null;
            return (
              <Cube
                key={i}
                x={h.x}
                y={h.y}
                w={140 + 120 * (1 - k)}
                d={140 + 120 * (1 - k)}
                h={110}
                color={C.white}
                fill="rgba(56,189,248,0.10)"
                alpha={aRadar}
                bw={4}
                label={
                  <Tag color={C.white} size={34} solid>
                    ГОРЯЧИЙ · {h.p}%
                  </Tag>
                }
              />
            );
          })}

        {/* FILTER — orange noise obstacles */}
        {aFilter > 0 &&
          NOISE.map((n, i) => {
            const k = interpolate(t, [n.t, n.t + 0.45], [0, 1], { ...clamp, easing: EXPO_OUT });
            const a = aFilter * sp(f, 27.7 + i * 0.12) * (1 - k);
            if (a <= 0.01) return null;
            return (
              <Cube
                key={i}
                x={n.x + n.dir * 520 * k}
                y={n.y}
                w={150}
                d={110}
                h={80}
                color={C.orange}
                fill="rgba(249,115,22,0.16)"
                alpha={a}
                label={
                  <Tag color={C.orange} size={30}>
                    {t >= n.t ? "✕ " : "⚠ "}
                    {n.txt}
                  </Tag>
                }
              />
            );
          })}

        {/* CHECKOUT — gate + client car */}
        {aPay > 0 && (
          <>
            <Cube x={330} y={1250} w={30} d={30} h={300} color={paid ? C.green : C.blue} fill={paid ? "rgba(16,185,129,0.35)" : "rgba(56,189,248,0.3)"} alpha={aPay} />
            <Cube x={670} y={1250} w={30} d={30} h={300} color={paid ? C.green : C.blue} fill={paid ? "rgba(16,185,129,0.35)" : "rgba(56,189,248,0.3)"} alpha={aPay} />
            <Billboard x={500} y={1250} z={300}>
              <div style={{ opacity: aPay, transform: `scale(${paid ? 1 + 0.15 * (1 - sp(f, 35.34)) : 1})` }}>
                <Tag color={paid ? C.green : C.blue} size={52} solid={paid}>
                  {paid ? "+$1,500 ОПЛАЧЕНО" : "ОПЛАТА"}
                </Tag>
              </div>
            </Billboard>
            <div
              style={{
                position: "absolute",
                left: 230,
                top: 1230,
                width: 540,
                height: 40,
                borderRadius: 20,
                background: paid ? C.green : C.blue,
                opacity: aPay * (paid ? 0.9 : 0.5),
                boxShadow: `0 0 50px ${paid ? C.green : C.blue}`,
              }}
            />
            <EgoCar
              y={lerp(2150, 1000, carP)}
              alpha={aPay}
              label={
                <Tag color={C.white} size={30}>
                  КЛИЕНТ
                </Tag>
              }
            />
          </>
        )}

        {/* ego always present (except checkout hands it to client car) */}
        {aPay < 0.99 && <EgoCar alpha={1 - aPay} />}
      </Road3D>

      <TopBar t={t} speed={speed} />

      {/* ===== HOOK ===== */}
      {aHook > 0 && (
        <div style={{ position: "absolute", left: 60, right: 60, top: 200, opacity: aHook }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 12, padding: "8px 20px", borderRadius: 999, border: `2px solid ${C.blue}`, color: C.blue, fontFamily: MONO, fontWeight: 800, fontSize: 28, letterSpacing: 4 }}>
            NEURAL NET · 360°
          </div>
          <div style={{ marginTop: 18, fontFamily: SANS, fontWeight: 900, fontSize: 112, lineHeight: 0.98, letterSpacing: -3, color: C.white, transform: `scale(${0.9 + 0.1 * sp(f, 0.1)})`, transformOrigin: "0 50%" }}>
            КАК ДУМАЕТ
            <br />
            АВТОПИЛОТ <span style={{ color: C.blue }}>TESLA?</span>
          </div>
        </div>
      )}
      {aHook > 0 && t > 6.9 && (
        <div style={{ position: "absolute", right: 60, top: 1380, opacity: aHook * sp(f, 6.94), transform: `scale(${0.6 + 0.4 * sp(f, 6.94)})` }}>
          <Tag color={C.blue} size={64} solid>
            360°
          </Tag>
        </div>
      )}
      <StatRow alpha={aHook * smooth(3.8, 4.3, t)}>
        <Stat label="КАДРОВ / СЕК" value="36" />
        <Stat label="КАМЕР" value="8" />
        <Stat label="ОБЪЕКТОВ" value={fmt(5 + Math.floor(t * 3))} color={C.blue} />
      </StatRow>

      {/* ===== SCENE 2a: TRAJECTORIES ===== */}
      <Header alpha={aTraj} f={f} at={9.08} chip="PLANNER" title={<>СОТНИ<br />ТРАЕКТОРИЙ</>} sub={t > 12.44 ? "→ выбрана идеальная синяя линия" : "просчёт каждые 27 мс"} />
      <StatRow alpha={aTraj}>
        <Stat label="ПРОСЧИТАНО" value={fmt(interpolate(t, [9.08, 12.4], [0, 1024], clamp))} color={C.blue} />
        <Stat label="ЛУЧШАЯ" value={t > 12.44 ? "✓ 1" : "…"} color={C.green} />
      </StatRow>

      {/* ===== SCENE 2b: BUSINESS ===== */}
      {aBiz > 0 && (
        <div style={{ position: "absolute", left: 60, right: 60, top: 190, opacity: aBiz }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 12, padding: "8px 20px", borderRadius: 999, border: `2px solid ${C.green}`, color: C.green, fontFamily: MONO, fontWeight: 800, fontSize: 28, letterSpacing: 4 }}>
            ROUTE UPDATED
          </div>
          <div
            style={{
              marginTop: 10,
              fontFamily: SANS,
              fontWeight: 900,
              fontSize: 200,
              lineHeight: 1,
              letterSpacing: -6,
              color: C.blue,
              opacity: sp(f, 15.94),
              transform: `scale(${1.4 - 0.4 * sp(f, 15.94, { damping: 12, stiffness: 200, mass: 0.6 })})`,
              transformOrigin: "0 50%",
            }}
          >
            2026:
          </div>
          <div style={{ fontFamily: SANS, fontWeight: 900, fontSize: 84, lineHeight: 1.02, letterSpacing: -2, color: C.white, opacity: sp(f, 17.86) }}>
            АВТОПИЛОТ
            <br />
            ДЛЯ БИЗНЕСА
          </div>
        </div>
      )}
      <StatRow alpha={aBiz * smooth(20.6, 21.0, t)}>
        <Stat label="МАРШРУТ" value="ЛИД → $" color={C.blue} />
        <Stat label="ВОДИТЕЛЬ" value="НЕ НУЖЕН" color={C.green} />
      </StatRow>

      {/* ===== SCENE 3: RADAR ===== */}
      <Header alpha={aRadar} f={f} at={22.18} chip="AGENT 01 · RADAR" title={<>РАДАР<br />РЫНКА 24/7</>} sub="сканирует и находит горячих" />
      <StatRow alpha={aRadar}>
        <Stat label="ПРОФИЛЕЙ" value={fmt(interpolate(t, [22.2, 27.4], [0, 12480], clamp))} />
        <Stat label="ГОРЯЧИХ" value={`${locked}`} color={locked ? C.blue : C.white} />
      </StatRow>

      {/* ===== SCENE 4: FILTER + OFFER ===== */}
      <Header alpha={aFilter} f={f} at={27.56} chip="AGENT 02 · FILTER" title={<>ШУМ —<br />ВОН С ДОРОГИ</>} />
      {aFilter > 0 && offerP > 0.01 && (
        <>
          <div style={{ position: "absolute", left: 0, right: 0, top: 480, bottom: 90, background: "rgba(11,14,20,0.6)", opacity: aFilter * offerP }} />
          <div style={{ position: "absolute", left: 110, right: 110, top: 640, perspective: 1400, opacity: aFilter }}>
            <div
              style={{
                padding: "40px 46px",
                borderRadius: 34,
                background: "linear-gradient(160deg, #161B25, #0F131B)",
                border: `2px solid rgba(56,189,248,0.6)`,
                boxShadow: "0 50px 100px rgba(0,0,0,0.65), 0 0 60px rgba(56,189,248,0.18)",
                transform: `rotateX(${(1 - offerP) * 55}deg) rotateY(${(1 - offerP) * -25}deg) translateZ(${(1 - offerP) * -300}px)`,
                transformOrigin: "50% 100%",
                opacity: clamp01(offerP * 1.5),
              }}
            >
              <div style={{ fontFamily: MONO, fontSize: 26, letterSpacing: 4, color: C.blue }}>КОММЕРЧЕСКОЕ ПРЕДЛОЖЕНИЕ</div>
              <div style={{ marginTop: 10, fontFamily: SANS, fontWeight: 800, fontSize: 52, color: C.white }}>Анна К. · горячий 94%</div>
              <div style={{ height: 2, background: C.line, margin: "26px 0" }} />
              {["Аудит воронки", "Настройка 3 агентов", "Запуск за 48 часов"].map((row, i) => {
                const k = sp(f, 30.88 + i * 0.2);
                return (
                  <div key={row} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontFamily: SANS, fontSize: 40, color: C.white, marginBottom: 18, opacity: k, transform: `translateX(${(1 - k) * 60}px)` }}>
                    <span>{row}</span>
                    <span style={{ color: C.green, fontWeight: 900 }}>✓</span>
                  </div>
                );
              })}
              <div style={{ height: 2, background: C.line, margin: "10px 0 22px" }} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", opacity: sp(f, 31.42) }}>
                <span style={{ fontFamily: MONO, fontSize: 28, color: C.dim, letterSpacing: 3 }}>ИТОГО</span>
                <span style={{ fontFamily: SANS, fontWeight: 900, fontSize: 92, color: C.white }}>$1,500</span>
              </div>
              <div
                style={{
                  marginTop: 22,
                  display: "inline-flex",
                  padding: "12px 24px",
                  borderRadius: 999,
                  background: "rgba(16,185,129,0.14)",
                  border: `2px solid ${C.green}`,
                  color: C.green,
                  fontFamily: MONO,
                  fontWeight: 800,
                  fontSize: 28,
                  letterSpacing: 2,
                  opacity: sp(f, 32.12),
                }}
              >
                ✓ СОБРАНО ЗА 0.8 С
              </div>
            </div>
          </div>
        </>
      )}
      <StatRow alpha={aFilter * (1 - offerP)}>
        <Stat label="ОТСЕЯНО" value={`${NOISE.filter((n) => t >= n.t).length} / 4`} color={C.orange} />
        <Stat label="ДОРОГА" value={t > 30.1 ? "ЧИСТО" : "ПОМЕХИ"} color={t > 30.1 ? C.green : C.orange} />
      </StatRow>

      {/* ===== SCENE 5: CHECKOUT ===== */}
      <Header
        alpha={aPay * (1 - smooth(37.8, 38.1, t))}
        f={f}
        at={33.2}
        chip="AGENT 03 · CHECKOUT"
        chipColor={paid ? C.green : C.blue}
        title={<>СДЕЛКА<br />НА АВТОПИЛОТЕ</>}
        sub={t > 35.98 ? "а ты просто сидишь в кресле" : "ведёт клиента до оплаты"}
      />
      {aPay > 0 && paid && t < 38.1 && (
        <div style={{ position: "absolute", left: 0, right: 0, top: 1380, display: "flex", justifyContent: "center", opacity: aPay * sp(f, 35.34) * (1 - smooth(37.8, 38.1, t)) }}>
          <div style={{ transform: `scale(${0.7 + 0.3 * sp(f, 35.34, { damping: 10, stiffness: 240, mass: 0.5 })})` }}>
            <Tag color={C.green} size={72} solid>
              +$1,500
            </Tag>
          </div>
        </div>
      )}
      {aPay > 0 && t >= 37.9 && (
        <div style={{ position: "absolute", inset: 0, opacity: aPay * smooth(37.9, 38.2, t) }}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(11,14,20,0.72)" }} />
          <div style={{ position: "absolute", left: 70, right: 70, top: 300, textAlign: "center" }}>
            <div style={{ fontFamily: MONO, fontSize: 32, letterSpacing: 6, color: C.muted }}>ДРУГИЕ</div>
            <div style={{ position: "relative", display: "inline-block", marginTop: 22, padding: "34px 44px", borderRadius: 30, background: "rgba(249,115,22,0.08)", border: `3px solid ${C.orange}` }}>
              <div style={{ fontFamily: SANS, fontWeight: 900, fontSize: 76, lineHeight: 1.05, color: t > 39.5 ? C.dim : C.white }}>
                КРУТИТЬ РУЛЬ
                <br />
                РУКАМИ 24/7
              </div>
              <div
                style={{
                  position: "absolute",
                  left: 20,
                  top: "50%",
                  height: 14,
                  borderRadius: 7,
                  width: `calc((100% - 40px) * ${interpolate(t, [39.32, 39.75], [0, 1], { ...clamp, easing: EXPO_OUT })})`,
                  background: C.orange,
                  boxShadow: `0 0 24px ${C.orange}`,
                  transform: "rotate(-6deg)",
                }}
              />
            </div>
          </div>
          {t >= 41.5 && (
            <div style={{ position: "absolute", left: 70, right: 70, top: 900, textAlign: "center", opacity: sp(f, 41.6) }}>
              <div style={{ fontFamily: MONO, fontSize: 32, letterSpacing: 6, color: C.green }}>УМНЫЕ</div>
              <div style={{ marginTop: 24, display: "inline-flex", alignItems: "center", gap: 36, padding: "30px 44px", borderRadius: 30, background: C.panel, border: `2px solid ${C.line}` }}>
                <span style={{ fontFamily: SANS, fontWeight: 900, fontSize: 64, color: C.white }}>СИСТЕМА</span>
                {(() => {
                  const on = sp(f, 41.96, { damping: 14, stiffness: 220, mass: 0.5 });
                  return (
                    <div style={{ width: 190, height: 100, borderRadius: 50, background: on > 0.5 ? C.green : "#334155", position: "relative", boxShadow: on > 0.5 ? `0 0 40px ${C.green}88` : "none" }}>
                      <div style={{ position: "absolute", top: 10, left: 10 + 90 * on, width: 80, height: 80, borderRadius: 40, background: C.white }} />
                    </div>
                  );
                })()}
              </div>
            </div>
          )}
        </div>
      )}
      <StatRow alpha={aPay * (1 - smooth(37.8, 38.1, t))}>
        <Stat label="РУКИ НА РУЛЕ" value="0%" color={C.green} />
        <Stat label="СТАТУС" value={paid ? "ОПЛАЧЕНО" : "ВЕДЁТ…"} color={paid ? C.green : C.blue} />
      </StatRow>

      {/* ===== END ===== */}
      {aEnd > 0 && (
        <div style={{ position: "absolute", left: 60, right: 60, top: 200, opacity: aEnd }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 12, padding: "8px 20px", borderRadius: 999, border: `2px solid ${C.green}`, color: C.green, fontFamily: MONO, fontWeight: 800, fontSize: 30, letterSpacing: 4 }}>
            ✓ DESTINATION REACHED
          </div>
          <div style={{ marginTop: 18, fontFamily: SANS, fontWeight: 900, fontSize: 112, lineHeight: 0.98, letterSpacing: -3, color: C.white }}>
            СИСТЕМА
            <br />
            <span style={{ color: C.green }}>АКТИВНА</span>
          </div>
        </div>
      )}
      <StatRow alpha={aEnd}>
        <Stat label="ДОХОД" value="+$1,500" color={C.green} />
        <Stat label="РУКИ" value="0" />
      </StatRow>

      {/* bottom dock */}
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 90, borderTop: `2px solid ${C.line}`, background: "#090C11", display: "flex", alignItems: "center", justifyContent: "space-around" }}>
        {["◐", "♪", "⌖", "☎", "⚙"].map((g, i) => (
          <div key={i} style={{ fontSize: 34, color: mod(Math.floor(t / 5) + i, 5) === 0 ? C.blue : C.muted }}>
            {g}
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

// -------------------------------------------------------------------------
// Ending CTA (screen-space over cockpit)
// -------------------------------------------------------------------------
const EndingCta: React.FC<{ f: number; t: number }> = ({ f, t }) => {
  if (t < 44.3) return null;
  const a = sp(f, 44.4, { damping: 13, stiffness: 160, mass: 0.7 });
  const word = sp(f, 44.58, { damping: 10, stiffness: 220, mass: 0.6 });
  const pulse = 1 + 0.025 * Math.sin((t - 45) * 5);
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 590, display: "flex", flexDirection: "column", alignItems: "center", opacity: a }}>
      <div style={{ padding: "10px 26px", borderRadius: 999, background: "rgba(11,14,20,0.85)", border: `2px solid ${C.green}`, color: C.green, fontFamily: MONO, fontWeight: 800, fontSize: 28, letterSpacing: 3 }}>
        DESTINATION REACHED · СИСТЕМА АКТИВНА
      </div>
      <div style={{ marginTop: 26, fontFamily: SANS, fontWeight: 900, fontSize: 70, color: C.white, letterSpacing: 2, textShadow: "0 6px 30px rgba(0,0,0,0.9)" }}>НАПИШИ</div>
      <div
        style={{
          marginTop: 12,
          padding: "22px 54px",
          borderRadius: 34,
          background: C.blue,
          color: C.bg,
          fontFamily: SANS,
          fontWeight: 900,
          fontSize: 104,
          letterSpacing: -1,
          boxShadow: `0 0 0 4px ${C.white}, 0 0 80px rgba(56,189,248,0.6), 0 30px 60px rgba(0,0,0,0.6)`,
          transform: `scale(${(0.6 + 0.4 * word) * pulse})`,
        }}
      >
        «АВТОПИЛОТ»
      </div>
      <div style={{ marginTop: 22, fontFamily: MONO, fontSize: 30, color: C.white, letterSpacing: 4, opacity: sp(f, 45.62), textShadow: "0 4px 20px rgba(0,0,0,0.9)" }}>
        В КОММЕНТАРИЯХ ↓
      </div>
    </div>
  );
};

// -------------------------------------------------------------------------
// Subtitles — pill with 24px gap between words
// -------------------------------------------------------------------------
const GROUPS: number[][] = (() => {
  const g: number[][] = [];
  let cur: number[] = [];
  WORDS.forEach((w, i) => {
    cur.push(i);
    const next = WORDS[i + 1];
    const chars = cur.reduce((n, k) => n + WORDS[k].word.length, 0) + (next ? next.word.length : 0);
    if (cur.length >= 3 || chars > 22 || /[.,?!—]$/.test(w.word) || !next || next.start - w.end > 0.3) {
      g.push(cur);
      cur = [];
    }
  });
  return g;
})();

const Subtitles: React.FC<{ f: number; t: number }> = ({ f, t }) => {
  let gi = -1;
  for (let i = 0; i < GROUPS.length; i++) if (WORDS[GROUPS[i][0]].start <= t + 0.04) gi = i;
  if (gi < 0) return null;
  const g = GROUPS[gi];
  const end = WORDS[g[g.length - 1]].end;
  const fadeOut = 1 - smooth(end + 0.35, end + 0.6, t);
  if (fadeOut <= 0) return null;
  const pop = sp(f, WORDS[g[0]].start, { damping: 13, stiffness: 260, mass: 0.5 });
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 1745, display: "flex", justifyContent: "center", opacity: fadeOut * clamp01(pop * 2) }}>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          columnGap: 24,
          rowGap: 8,
          maxWidth: 1000,
          padding: "20px 44px",
          borderRadius: 48,
          background: "rgba(11,14,20,0.86)",
          border: "2px solid rgba(56,189,248,0.45)",
          boxShadow: "0 20px 50px rgba(0,0,0,0.6), 0 0 30px rgba(56,189,248,0.15)",
          transform: `scale(${0.85 + 0.15 * pop})`,
        }}
      >
        {g.map((wi) => {
          const w = WORDS[wi];
          const active = t >= w.start && t < w.end + 0.06;
          const said = t >= w.start;
          return (
            <span
              key={wi}
              style={{
                display: "inline-block",
                fontFamily: SANS,
                fontWeight: 800,
                fontSize: 58,
                letterSpacing: -0.5,
                whiteSpace: "nowrap",
                color: active ? C.blue : said ? C.white : "rgba(248,250,252,0.38)",
                transform: `translateY(${active ? -3 : 0}px)`,
              }}
            >
              {DISPLAY_FIX[w.word] ?? w.word}
            </span>
          );
        })}
      </div>
    </div>
  );
};

// -------------------------------------------------------------------------
// Root composition
// -------------------------------------------------------------------------
export const TeslaFsdReel: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = f / fps;
  const zp = zoomProgress(t);
  const punch = punchAt(t);
  const dx = Math.sin(t * 0.55) * 6 + Math.sin(t * 1.3) * 2;
  const dy = Math.cos(t * 0.47) * 5;
  const rot = Math.sin(t * 0.33) * 0.15;
  const camScale = 1.02 + 0.035 * punch;
  const fadeIn = interpolate(f, [0, 10], [0, 1], clamp);

  return (
    <AbsoluteFill style={{ backgroundColor: C.bg, overflow: "hidden" }}>
      <Audio src={staticFile("tesla_fsd_reel/voice.mp3")} />
      <AbsoluteFill style={{ transform: `translate(${dx}px, ${dy}px) rotate(${rot}deg) scale(${camScale})`, opacity: fadeIn }}>
        {zp < 0.999 ? <Cockpit f={f} t={t} zp={zp} /> : <FsdUI f={f} />}
      </AbsoluteFill>
      {/* vignette */}
      <AbsoluteFill style={{ background: "radial-gradient(120% 90% at 50% 45%, rgba(0,0,0,0) 60%, rgba(0,0,0,0.55) 100%)", pointerEvents: "none" }} />
      <EndingCta f={f} t={t} />
      <Subtitles f={f} t={t} />
    </AbsoluteFill>
  );
};
