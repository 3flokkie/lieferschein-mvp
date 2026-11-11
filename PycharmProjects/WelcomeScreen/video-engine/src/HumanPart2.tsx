import React from "react";
import { interpolate, random, useCurrentFrame, useVideoConfig } from "remotion";

export type Part2Pose = "flashlight_reveal" | "old_tyoma_face" | "door_break_shock" | "choice_dilemma";

interface Part2Props {
  pose: Part2Pose;
}

const SCENE_START_SEC: Record<Part2Pose, number> = {
  flashlight_reveal: 0,
  old_tyoma_face: 7.5,
  door_break_shock: 25,
  choice_dilemma: 36,
};

const HAIR_DARK = "#1A120C";
const HAIR_MID = "#3A2A1E";
const HAIR_HI = "#6B5240";

/* ================= HELPERS ================= */

const tuftPath = (
  cx: number, cy: number, rx: number, ry: number,
  fromDeg: number, toDeg: number, count: number, seed: string
) => {
  let d = "";
  for (let i = 0; i < count; i++) {
    const a = ((fromDeg + ((toDeg - fromDeg) * (i + 0.5)) / count) * Math.PI) / 180;
    const w = 0.07 + random(`${seed}-w-${i}`) * 0.04;
    const len = 14 + random(`${seed}-l-${i}`) * 18;
    const bend = (random(`${seed}-b-${i}`) - 0.5) * 16;
    const p = (ang: number, k = 1) => [cx + Math.cos(ang) * rx * k, cy + Math.sin(ang) * ry * k];
    const [x1, y1] = p(a - w, 0.96);
    const [x2, y2] = p(a + w, 0.96);
    const nx = Math.cos(a);
    const ny = Math.sin(a);
    const tx = cx + nx * (rx + len) - ny * bend;
    const ty = cy + ny * (ry + len) + nx * bend;
    d += `M ${x1.toFixed(1)} ${y1.toFixed(1)} Q ${((x1 + tx) / 2 - ny * 6).toFixed(1)} ${((y1 + ty) / 2).toFixed(1)} ${tx.toFixed(1)} ${ty.toFixed(1)} Q ${((x2 + tx) / 2 + ny * 4).toFixed(1)} ${((y2 + ty) / 2).toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)} Z `;
  }
  return d;
};

export const flashIntensity = (frame: number) => {
  const base = 0.88 + Math.sin(frame * 0.21) * 0.05 + Math.sin(frame * 0.53) * 0.03;
  const dip = random(`fl-dip-${Math.floor(frame / 3)}`) < 0.07 ? 0.35 : 1;
  const micro = 0.94 + random(`fl-micro-${frame}`) * 0.06;
  return Math.max(0.15, base * dip * micro);
};

/* ================= HAIR: YOUNG FRONT (head rx140 ry170) ================= */
export const YoungHairFront: React.FC<{ cx: number; cy: number; panic?: boolean }> = ({ cx, cy, panic }) => {
  const lift = panic ? -10 : 0;
  return (
    <g transform={`translate(${cx}, ${cy})`}>
      <path d="M -142 -80 Q -152 -20 -140 22 L -128 20 Q -134 -25 -124 -80 Z" fill={HAIR_DARK} opacity="0.85" />
      <path d="M 142 -80 Q 152 -20 140 22 L 128 20 Q 134 -25 124 -80 Z" fill={HAIR_DARK} opacity="0.85" />
      <path
        d={`M -150 -20
            C -172 -135, -112 ${-236 + lift}, 0 ${-242 + lift}
            C 116 ${-244 + lift}, 174 -140, 150 -20
            L 138 -62 Q 124 -92 112 -90 Q 102 -62 88 -56
            Q 78 -96 60 -102 Q 50 -64 32 -52
            Q 24 -102 4 -106 Q -10 -62 -28 -50
            Q -36 -100 -56 -104 Q -68 -66 -86 -58
            Q -94 -96 -112 -92 Q -124 -72 -138 -62 Z`}
        fill="url(#hair-young)" stroke="#000" strokeWidth="5" strokeLinejoin="round"
      />
      <path d={tuftPath(0, -70 + lift, 150, 168, 205, 335, 13, "yf")} fill={HAIR_DARK} stroke="#000" strokeWidth="3" strokeLinejoin="round" />
      {[
        "M -100 -170 Q -80 -120 -100 -96",
        "M -60 -205 Q -40 -150 -56 -104",
        "M -15 -220 Q 5 -160 4 -106",
        "M 30 -215 Q 50 -150 60 -102",
        "M 75 -195 Q 100 -140 112 -90",
        "M -125 -120 Q -118 -90 -130 -66",
        "M 120 -130 Q 130 -95 136 -66",
      ].map((d, i) => (
        <path key={i} d={d} stroke={HAIR_MID} strokeWidth="4" fill="none" strokeLinecap="round" opacity="0.8" />
      ))}
      <path d={`M -95 ${-185 + lift} Q 0 ${-222 + lift} 95 ${-185 + lift}`} stroke={HAIR_HI} strokeWidth="9" fill="none" strokeLinecap="round" opacity="0.55" />
      <path d={`M -150 -40 C -168 -140, -110 ${-238 + lift}, 0 ${-244 + lift}`} stroke="#F7C548" strokeWidth="3" fill="none" opacity="0.6" />
    </g>
  );
};

/* ================= HAIR: YOUNG BACK (head 540,1540) ================= */
export const YoungHairBack: React.FC = () => (
  <g>
    <rect x="488" y="1650" width="104" height="80" fill="#8C5E44" />
    <ellipse cx="402" cy="1575" rx="22" ry="36" fill="#9E6A4C" stroke="#000" strokeWidth="4" />
    <ellipse cx="678" cy="1575" rx="22" ry="36" fill="#9E6A4C" stroke="#000" strokeWidth="4" />
    <path
      d="M 400 1595 C 382 1468, 448 1372, 540 1368 C 632 1372, 698 1468, 680 1595 Q 660 1662 600 1682 L 480 1682 Q 420 1662 400 1595 Z"
      fill="url(#hair-young)" stroke="#000" strokeWidth="6"
    />
    <path d="M 450 1640 Q 540 1625 630 1640 L 600 1684 L 480 1684 Z" fill="url(#nape-fade)" />
    <path d={tuftPath(540, 1530, 142, 160, 200, 340, 14, "yb")} fill={HAIR_DARK} stroke="#000" strokeWidth="3" strokeLinejoin="round" />
    {Array.from({ length: 11 }).map((_, i) => {
      const a = (-170 + i * 16) * (Math.PI / 180);
      const ex = 540 + Math.cos(a) * 130;
      const ey = 1540 - Math.sin(a) * 120;
      return (
        <path key={i}
          d={`M 540 1450 Q ${540 + Math.cos(a + 0.5) * 70} ${1460 - Math.sin(a + 0.5) * 50} ${ex} ${ey}`}
          stroke={HAIR_MID} strokeWidth="4" fill="none" strokeLinecap="round" opacity="0.75" />
      );
    })}
    <path d="M 405 1540 C 400 1440, 470 1372, 540 1370 C 610 1372, 680 1440, 675 1540" stroke="#FFD27A" strokeWidth="4" fill="none" opacity="0.7" />
  </g>
);

/* ================= HAIR: OLD (head 500,740) ================= */
export const OldHair: React.FC = () => (
  <g>
    <path
      d="M 310 770 C 278 520, 390 462, 500 458 C 616 456, 726 520, 690 770
         L 678 700 Q 672 640 650 610 Q 630 585 600 590 Q 580 565 550 572
         Q 525 555 500 568 Q 470 555 448 572 Q 420 565 400 590
         Q 370 585 350 610 Q 328 640 322 700 Z"
      fill="url(#hair-grey)" stroke="#111" strokeWidth="5" strokeLinejoin="round"
    />
    <path d={tuftPath(500, 640, 196, 176, 210, 330, 11, "old")} fill="#7D8691" stroke="#111" strokeWidth="3" strokeLinejoin="round" />
    {[
      "M 360 600 Q 380 520 450 490",
      "M 410 580 Q 430 510 500 478",
      "M 470 565 Q 500 500 560 480",
      "M 540 568 Q 580 505 630 500",
      "M 600 588 Q 640 540 670 560",
      "M 330 690 Q 320 620 350 570",
      "M 670 690 Q 682 620 650 560",
    ].map((d, i) => (
      <path key={i} d={d} stroke="#C9D0D8" strokeWidth="4" fill="none" strokeLinecap="round" opacity="0.7" />
    ))}
    <path d="M 312 720 C 285 520, 395 462, 500 460" stroke="#FFEAA7" strokeWidth="3" fill="none" opacity="0.5" />
  </g>
);

/* ================= FX: DUST IN BEAM ================= */
export const DustMotes: React.FC<{
  frame: number; apexX: number; apexY: number; length: number;
  spread: number; count: number; intensity: number; seed: string;
}> = ({ frame, apexX, apexY, length, spread, count, intensity, seed }) => (
  <g filter="url(#mote-glow)">
    {Array.from({ length: count }).map((_, i) => {
      const t = 0.08 + random(`${seed}-t-${i}`) * 0.92;
      const u = random(`${seed}-u-${i}`) * 2 - 1;
      const ph = random(`${seed}-p-${i}`) * Math.PI * 2;
      const y = apexY - t * length + Math.sin(frame * 0.025 + ph) * 18;
      const x = apexX + u * t * spread * 0.85 + Math.sin(frame * 0.018 + ph * 1.7) * 20;
      const r = 1.2 + random(`${seed}-r-${i}`) * 3.4 * (1 - t * 0.4);
      const tw = 0.45 + 0.55 * Math.abs(Math.sin(frame * 0.08 + ph));
      return <circle key={i} cx={x} cy={y} r={r} fill="#FFF6D8" opacity={tw * intensity * (1 - t * 0.5)} />;
    })}
  </g>
);

/* ================= FX: AMBIENT DUST ================= */
export const AmbientDust: React.FC<{ frame: number; count: number; color: string; seed: string }> = ({ frame, count, color, seed }) => (
  <g filter="url(#mote-glow)">
    {Array.from({ length: count }).map((_, i) => {
      const ph = random(`${seed}-p-${i}`) * Math.PI * 2;
      const x = (random(`${seed}-x-${i}`) * 1080 + frame * (0.3 + random(`${seed}-s-${i}`) * 0.6)) % 1080;
      const y = (random(`${seed}-y-${i}`) * 1920 - frame * 0.4 + 1920 * 4) % 1920;
      const r = 1 + random(`${seed}-r-${i}`) * 3;
      return <circle key={i} cx={x + Math.sin(frame * 0.03 + ph) * 12} cy={y} r={r} fill={color}
        opacity={0.25 + 0.4 * Math.abs(Math.sin(frame * 0.05 + ph))} />;
    })}
  </g>
);

/* ================= FX: LOW FOG ================= */
export const LowFog: React.FC<{ frame: number; y: number; height: number; color: string; opacity: number; seed: string }> = ({
  frame, y, height, color, opacity, seed,
}) => (
  <g filter="url(#fog-blur)" opacity={opacity}>
    {Array.from({ length: 7 }).map((_, i) => {
      const speed = (0.35 + random(`${seed}-v-${i}`) * 0.6) * (i % 2 ? 1 : -1);
      const span = 1600;
      const x = (((random(`${seed}-x-${i}`) * span + frame * speed) % span) + span) % span - 260;
      const cy = y + random(`${seed}-y-${i}`) * height;
      return (
        <ellipse key={i} cx={x} cy={cy}
          rx={260 + random(`${seed}-rx-${i}`) * 220}
          ry={50 + random(`${seed}-ry-${i}`) * 50 + Math.sin(frame * 0.02 + i) * 8}
          fill={color} opacity={0.35 + random(`${seed}-o-${i}`) * 0.35} />
      );
    })}
  </g>
);

/* ================= GLOBAL FILM OVERLAY (outside camera zoom) ================= */
export const Part2FilmOverlay: React.FC = () => {
  const frame = useCurrentFrame();
  const exposure = 0.03 + random(`exp-${frame}`) * 0.05;
  const scratches = [0, 1, 2].filter((k) => random(`sc-on-${frame}-${k}`) > 0.72);
  const specks = [0, 1, 2, 3, 4, 5].filter((k) => random(`sp-on-${frame}-${k}`) > 0.55);

  return (
    <svg viewBox="0 0 1080 1920" width={1080} height={1920}
      style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <defs>
        <filter id="film-grain" x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed={frame % 24} stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <radialGradient id="film-vignette" cx="50%" cy="48%" r="72%">
          <stop offset="45%" stopColor="#000" stopOpacity="0" />
          <stop offset="80%" stopColor="#000" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.92" />
        </radialGradient>
      </defs>
      <rect width="1080" height="1920" filter="url(#film-grain)" opacity="0.13" style={{ mixBlendMode: "overlay" }} />
      <rect width="1080" height="1920" fill="#000" opacity={exposure} />
      {scratches.map((k) => {
        const x = random(`sc-x-${frame}-${k}`) * 1080;
        const wob = (random(`sc-w-${frame}-${k}`) - 0.5) * 14;
        return (
          <path key={k} d={`M ${x} 0 Q ${x + wob} 960 ${x - wob * 0.5} 1920`}
            stroke={k % 2 ? "#FFF" : "#DCD3C0"}
            strokeWidth={0.8 + random(`sc-s-${frame}-${k}`) * 1.6}
            opacity={0.12 + random(`sc-o-${frame}-${k}`) * 0.22} fill="none" />
        );
      })}
      {specks.map((k) => (
        <circle key={k} cx={random(`sp-x-${frame}-${k}`) * 1080} cy={random(`sp-y-${frame}-${k}`) * 1920}
          r={1 + random(`sp-r-${frame}-${k}`) * 2.5} fill={k % 2 ? "#000" : "#FFF"} opacity="0.35" />
      ))}
      <rect width="1080" height="1920" fill="url(#film-vignette)" />
    </svg>
  );
};

/* ================= MAIN ================= */
export const HumanPart2: React.FC<Part2Props> = ({ pose }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const lf = Math.max(0, frame - Math.round(SCENE_START_SEC[pose] * fps));
  const flash = flashIntensity(frame);
  const sway = Math.sin(frame * 0.045) * 2.2 + Math.sin(frame * 0.13) * 0.6;

  return (
    <div style={{ width: 1080, height: 1920, position: "relative" }}>
      <svg viewBox="0 0 1080 1920" width={1080} height={1920}>
        <defs>
          <linearGradient id="skin-light2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FBD5B5" /><stop offset="100%" stopColor="#E4A882" />
          </linearGradient>
          <linearGradient id="skin-old" x1="0%" y1="0%" x2="100%" y2="100%">

            <stop offset="0%" stopColor="#D9C2B0" /><stop offset="100%" stopColor="#A88E7D" />
          </linearGradient>
          <linearGradient id="hoodie-grad2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3E4C3D" /><stop offset="100%" stopColor="#222B21" />
          </linearGradient>
          <linearGradient id="hair-grey" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#B4BCC6" /><stop offset="100%" stopColor="#5A626D" />
          </linearGradient>
          <linearGradient id="hair-young" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#3B2B1F" /><stop offset="55%" stopColor="#21160F" /><stop offset="100%" stopColor="#140D08" />
          </linearGradient>
          <linearGradient id="nape-fade" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#140D08" /><stop offset="100%" stopColor="#8C5E44" stopOpacity="0.9" />
          </linearGradient>
          <linearGradient id="beam-grad" gradientUnits="userSpaceOnUse" x1="540" y1="1600" x2="540" y2="540">
            <stop offset="0%" stopColor="#FFF8E1" stopOpacity="0.85" />
            <stop offset="60%" stopColor="#FFEAA7" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#FFEAA7" stopOpacity="0.04" />
          </linearGradient>
          <radialGradient id="flash-face" cx="50%" cy="45%" r="60%">
            <stop offset="0%" stopColor="#2A2518" /><stop offset="100%" stopColor="#080705" />
          </radialGradient>
          <radialGradient id="face-key" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFEAA7" stopOpacity="0.35" /><stop offset="100%" stopColor="#FFEAA7" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="lamp-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#E9FDFF" /><stop offset="40%" stopColor="#7DF3FF" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#00E5FF" stopOpacity="0" />
          </radialGradient>
          <filter id="beam-soft" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="16" /></filter>
          <filter id="fog-blur" x="-50%" y="-100%" width="200%" height="300%"><feGaussianBlur stdDeviation="38" /></filter>
          <filter id="mote-glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1.2" /></filter>
          <filter id="dof-far" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="2.5" /></filter>
        </defs>

        {/* ===== SCENE 1: FLASHLIGHT CORRIDOR ===== */}
        {pose === "flashlight_reveal" && (
          <g id="flashlight-corridor">
            <rect width="1080" height="1920" fill="#06070A" />
            <g filter="url(#dof-far)">
              <polygon points="0,0 420,560 420,880 0,1920" fill="#0B0C11" />
              <polygon points="1080,0 660,560 660,880 1080,1920" fill="#090A0E" />
              <polygon points="0,1920 420,880 660,880 1080,1920" fill="#0D0E12" />
              <rect x="420" y="560" width="240" height="320" fill="#020203" />
              {[0, 1, 2, 3, 4, 5].map((i) => {
                const t = Math.pow(i / 6, 1.6);
                const y = 880 + t * 1040;
                const half = 120 + t * 420;
                return <line key={i} x1={540 - half} y1={y} x2={540 + half} y2={y} stroke="#1A1C24" strokeWidth={1 + t * 3} />;
              })}
              {[-2, -1, 0, 1, 2].map((k) => (
                <line key={k} x1={540 + k * 48} y1="880" x2={540 + k * 260} y2="1920" stroke="#1A1C24" strokeWidth="2" />
              ))}
              <polygon points="110,520 250,610 250,1240 110,1440" fill="#0F1016" stroke="#1E2029" strokeWidth="4" />
              <polygon points="970,520 830,610 830,1240 970,1440" fill="#0F1016" stroke="#1E2029" strokeWidth="4" />
            </g>

            <g transform={`rotate(${sway}, 540, 1600)`} opacity={flash}>
              <g filter="url(#beam-soft)" style={{ mixBlendMode: "screen" }}>
                <polygon points="540,1600 160,540 920,540" fill="url(#beam-grad)" opacity="0.55" />
                <polygon points="540,1600 360,600 720,600" fill="url(#beam-grad)" opacity="0.8" />
              </g>
              <ellipse cx="540" cy="760" rx="260" ry="200" fill="#FFEAA7" opacity="0.12" filter="url(#beam-soft)" />
              <DustMotes frame={frame} apexX={540} apexY={1600} length={1020} spread={380} count={80} intensity={flash} seed="s1" />
            </g>

            <g filter="url(#dof-far)">
              <ellipse cx="540" cy="720" rx="90" ry="110" fill="#1A1C24" stroke="#FFEAA7" strokeWidth="4" strokeOpacity={0.4 + flash * 0.6} />
              <path d="M 430 830 L 400 1350 L 680 1350 L 650 830 Z" fill="#151720" stroke="#FFEAA7" strokeWidth="3" strokeOpacity={0.4 + flash * 0.6} />
            </g>

            <LowFog frame={frame} y={1220} height={260} color="#9AA3B5" opacity={0.28 + flash * 0.1} seed="fog1" />

            <g transform="translate(0, 100)">
              <ellipse cx="540" cy="1780" rx="260" ry="30" fill="#000" opacity="0.6" filter="url(#fog-blur)" />
              <path d="M 320 1700 L 760 1700 L 780 1920 L 300 1920 Z" fill="url(#hoodie-grad2)" stroke="#000" strokeWidth="6" />
              <YoungHairBack />
              <circle cx="540" cy="1500" r="32" fill="#FFF" opacity={0.7 + flash * 0.3} />
              <circle cx="540" cy="1500" r={56 + flash * 22} fill="#FFEAA7" opacity={0.35 * flash} filter="url(#beam-soft)" />
              <line x1="380" y1="1500" x2="700" y2="1500" stroke="#FFF6D8" strokeWidth="3" opacity={0.35 * flash} />
            </g>

            <LowFog frame={frame + 300} y={1700} height={200} color="#5E6576" opacity={0.25} seed="fog1b" />
          </g>
        )}

        {/* ===== SCENE 2: OLD ARTEM FACE ===== */}
        {pose === "old_tyoma_face" && (
          <g id="old-artem-reveal">
            <rect width="1080" height="1920" fill="#0A0808" />
            <rect width="1080" height="1920" fill="url(#flash-face)" opacity={0.6 + flash * 0.4} />

            <g transform={`rotate(${sway * 0.8}, 540, 1920)`} opacity={flash}>
              <polygon points="540,1920 120,500 960,500" fill="url(#beam-grad)" opacity="0.18" filter="url(#beam-soft)" />
              <DustMotes frame={frame} apexX={540} apexY={1920} length={1400} spread={420} count={60} intensity={flash * 0.8} seed="s2" />
            </g>

            <g transform="translate(40, 160)">
              <path d="M 240 1100 Q 500 1050 760 1100 L 790 1600 L 210 1600 Z" fill="#20222B" stroke="#000" strokeWidth="6" />
              <rect x="440" y="930" width="120" height="180" fill="url(#skin-old)" />
              <line x1="470" y1="990" x2="530" y2="990" stroke="#7A6557" strokeWidth="4" />
              <ellipse cx="310" cy="760" rx="26" ry="44" fill="url(#skin-old)" stroke="#000" strokeWidth="5" />
              <ellipse cx="690" cy="760" rx="26" ry="44" fill="url(#skin-old)" stroke="#000" strokeWidth="5" />
              <ellipse cx="500" cy="740" rx="190" ry="240" fill="url(#skin-old)" stroke="#000" strokeWidth="7" />
              <OldHair />
              <path d="M 410 628 Q 500 610 590 628" stroke="#7A6557" strokeWidth="5" fill="none" strokeLinecap="round" />
              <path d="M 425 655 Q 500 638 575 655" stroke="#7A6557" strokeWidth="4" fill="none" strokeLinecap="round" />
              <circle cx="410" cy="720" r="38" fill="#E8DDD6" stroke="#000" strokeWidth="4" />
              <circle cx="410" cy="720" r="14" fill="#3D3025" />
              <circle cx="404" cy="714" r="4" fill="#FFF" opacity={0.5 + flash * 0.5} />
              <path d="M 370 760 Q 410 780 450 760" stroke="#7A6557" strokeWidth="4" fill="none" />
              <circle cx="590" cy="720" r="38" fill="#E8DDD6" stroke="#000" strokeWidth="4" />
              <circle cx="590" cy="720" r="14" fill="#3D3025" />
              <circle cx="584" cy="714" r="4" fill="#FFF" opacity={0.5 + flash * 0.5} />
              <path d="M 550 760 Q 590 780 630 760" stroke="#7A6557" strokeWidth="4" fill="none" />
              <path d="M 440 850 Q 500 875 560 850" stroke="#4A1E20" strokeWidth="6" fill="none" strokeLinecap="round" />
              <ellipse cx="500" cy="780" rx="260" ry="320" fill="url(#face-key)" opacity={flash} style={{ mixBlendMode: "screen" }} />
            </g>

            <rect width="1080" height="1920" fill="#000" opacity={(1 - flash) * 0.55} />
            <LowFog frame={frame} y={1500} height={380} color="#7E7466" opacity={0.3} seed="fog2" />
          </g>
        )}

        {/* ===== SCENE 3: DOOR BREAK + STROBE ===== */}
        {pose === "door_break_shock" &&
          (() => {
            const burst = lf < 10;
            const strobeOn = burst || random(`strobe-${Math.floor(lf / 2)}`) > 0.42;
            const lampSwing = Math.sin(lf * 0.14) * 14 * Math.max(0.3, 1 - lf / 240);
            const doorSlam = interpolate(lf, [0, 7], [90, 0], { extrapolateRight: "clamp" });
            const lightLvl = strobeOn ? 1 : 0.12;

            return (
              <g id="door-break-scene">
                <rect width="1080" height="1920" fill="#04060A" />
                <polygon points="200,300 1080,0 1080,1920 180,1650" fill="#00E5FF" opacity={0.08 + lightLvl * 0.28} filter="url(#beam-soft)" />

                <g transform={`rotate(${lampSwing}, 760, 0)`}>
                  <line x1="760" y1="0" x2="760" y2="150" stroke="#222" strokeWidth="4" />
                  <path d="M 720 150 L 800 150 L 790 180 L 730 180 Z" fill="#1B1F26" stroke="#000" strokeWidth="3" />
                  <circle cx="760" cy="188" r="18" fill={strobeOn ? "#F2FEFF" : "#2A3A40"} />
                  <circle cx="760" cy="188" r="180" fill="url(#lamp-glow)" opacity={lightLvl} />
                  <polygon points="742,190 778,190 1000,1900 520,1900" fill="#BFF8FF" opacity={lightLvl * 0.12} filter="url(#beam-soft)" />
                  {strobeOn &&
                    Array.from({ length: 8 }).map((_, i) => {
                      const a = random(`spk-a-${lf}-${i}`) * Math.PI;
                      const l = 20 + random(`spk-l-${lf}-${i}`) * 60;
                      return (
                        <line key={i} x1={760} y1={195} x2={760 + Math.cos(a) * l} y2={195 + Math.sin(a) * l}
                          stroke="#FFE27A" strokeWidth="2.5" strokeLinecap="round" opacity={random(`spk-o-${lf}-${i}`)} />
                      );
                    })}
                </g>

                <g transform={`translate(${doorSlam}, 0) skewY(${doorSlam * 0.06})`}>
                  <polygon points="120,200 480,300 420,1700 80,1600" fill="#1C1815" stroke="#FF2A2A" strokeWidth="8" />
                  <path d="M 450 880 L 380 960 L 420 1010 L 350 1100" stroke="#000" strokeWidth="5" fill="none" />
                  <path d="M 455 900 L 300 860 L 240 930" stroke="#000" strokeWidth="4" fill="none" />
                  <circle cx="440" cy="900" r="14" fill="#8A7A5A" stroke="#000" strokeWidth="3" />
                </g>

                {Array.from({ length: 26 }).map((_, i) => {
                  const ang = -Math.PI * 0.35 + random(`sp-a-${i}`) * Math.PI * 0.9;
                  const v = 14 + random(`sp-v-${i}`) * 22;
                  const x = 450 + Math.cos(ang) * v * lf;
                  const y = 900 + Math.sin(ang) * v * lf + 0.45 * lf * lf;
                  if (y > 2000 || x > 1200 || x < -100) return null;
                  const rot = lf * (8 + random(`sp-r-${i}`) * 20);
                  return (
                    <rect key={i} x={x} y={y} width={10 + random(`sp-l-${i}`) * 28} height={4 + random(`sp-h-${i}`) * 5}
                      fill={i % 4 === 0 ? "#FF2A2A" : "#3A2E25"} transform={`rotate(${rot}, ${x}, ${y})`} />
                  );
                })}

                <g transform="translate(180, 200)">
                  <ellipse cx="260" cy="780" rx="80" ry="100" fill="#000" />
                  <circle cx="230" cy="770" r="14" fill="#FF2A2A" opacity={strobeOn ? 1 : 0.55} />
                  <circle cx="290" cy="770" r="14" fill="#FF2A2A" opacity={strobeOn ? 1 : 0.55} />
                  <circle cx="230" cy="770" r="40" fill="#FF2A2A" opacity="0.25" filter="url(#beam-soft)" />
                  <circle cx="290" cy="770" r="40" fill="#FF2A2A" opacity="0.25" filter="url(#beam-soft)" />
                  <path d="M 160 880 L 360 880 L 390 1450 L 130 1450 Z" fill="#000" />
                </g>

                <LowFog frame={lf * 3} y={1350} height={420} color="#A9C7CF"
                  opacity={interpolate(lf, [0, 6, 120], [0, 0.55, 0.3], { extrapolateRight: "clamp" })} seed="fog3" />
                <AmbientDust frame={lf} count={50} color="#D9FBFF" seed="d3" />

                <g transform="translate(320, 360)">
                  <ellipse cx="440" cy="1140" rx="150" ry="24" fill="#000" opacity="0.5" filter="url(#fog-blur)" />
                  <ellipse cx="300" cy="950" rx="20" ry="32" fill="url(#skin-light2)" stroke="#000" strokeWidth="4" />
                  <ellipse cx="580" cy="950" rx="20" ry="32" fill="url(#skin-light2)" stroke="#000" strokeWidth="4" />
                  <ellipse cx="440" cy="940" rx="140" ry="170" fill="url(#skin-light2)" stroke="#000" strokeWidth="6" />
                  <YoungHairFront cx={440} cy={940} panic />
                  <circle cx="390" cy="920" r="32" fill="#FFF" stroke="#000" strokeWidth="4" />
                  <circle cx="390" cy="920" r="12" fill="#111" />
                  <circle cx="490" cy="920" r="32" fill="#FFF" stroke="#000" strokeWidth="4" />
                  <circle cx="490" cy="920" r="12" fill="#111" />
                  <ellipse cx="440" cy="1020" rx="34" ry="46" fill="#3D0B14" stroke="#FFF" strokeWidth="4" />
                  <path d="M 300 900 C 300 760, 420 760, 440 770" stroke="#7DF3FF" strokeWidth="5" fill="none" opacity={lightLvl} />
                </g>

                <rect width="1080" height="1920" fill="#DFFBFF" opacity={burst ? 0.45 - lf * 0.04 : strobeOn ? 0.1 : 0} />
                <rect width="1080" height="1920" fill="#000" opacity={strobeOn ? 0 : 0.45} />
              </g>
            );
          })()}

        {/* ===== SCENE 4: CHOICE CARDS ===== */}
        {pose === "choice_dilemma" &&
          (() => {
            const pulseA = 0.5 + 0.5 * Math.sin(lf * 0.12);
            const pulseB = 0.5 + 0.5 * Math.sin(lf * 0.12 + Math.PI);
            return (
              <g id="part2-choice-doors">
                <rect width="1080" height="1920" fill="#07090E" />
                <rect x="50" y="300" width="470" height="820" rx="30" fill="#F7C548" opacity={0.12 + pulseA * 0.15} filter="url(#fog-blur)" />
                <rect x="560" y="300" width="470" height="820" rx="30" fill="#00F0FF" opacity={0.12 + pulseB * 0.15} filter="url(#fog-blur)" />

                <rect x="70" y="320" width="430" height="780" rx="20" fill="#2B1A04" stroke="#F7C548" strokeWidth="8" />
                <text x="285" y="680" fill="#F7C548" fontSize="120" fontWeight="900" textAnchor="middle">А</text>
                <text x="285" y="800" fill="#FFF" fontSize="32" fontWeight="700" textAnchor="middle">В КУХНЮ</text>
                <text x="285" y="860" fill="#FFEAA7" fontSize="24" textAnchor="middle">К старому себе</text>

                <rect x="580" y="320" width="430" height="780" rx="20" fill="#041E28" stroke="#00F0FF" strokeWidth="8" />
                <text x="795" y="680" fill="#00F0FF" fontSize="120" fontWeight="900" textAnchor="middle">Б</text>
                <text x="795" y="800" fill="#FFF" fontSize="32" fontWeight="700" textAnchor="middle">В ПОДЪЕЗД</text>
                <text x="795" y="860" fill="#B2F5EA" fontSize="24" textAnchor="middle">Сквозь двойника</text>

                <AmbientDust frame={lf} count={45} color="#FFF3D0" seed="d4" />
                <LowFog frame={lf} y={1250} height={300} color="#6B7488" opacity={0.3} seed="fog4" />

                <g transform="translate(0, 160)">
                  <ellipse cx="540" cy="1740" rx="300" ry="30" fill="#000" opacity="0.6" filter="url(#fog-blur)" />
                  <ellipse cx="400" cy="1330" rx="20" ry="32" fill="url(#skin-light2)" stroke="#000" strokeWidth="4" />
                  <ellipse cx="680" cy="1330" rx="20" ry="32" fill="url(#skin-light2)" stroke="#000" strokeWidth="4" />
                  <ellipse cx="540" cy="1320" rx="140" ry="170" fill="url(#skin-light2)" stroke="#000" strokeWidth="6" />
                  <YoungHairFront cx={540} cy={1320} />
                  <path d="M 320 1520 L 760 1520 L 800 1920 L 280 1920 Z" fill="url(#hoodie-grad2)" stroke="#000" strokeWidth="6" />
                  <circle cx="280" cy="1540" r="44" fill="url(#skin-light2)" stroke="#000" strokeWidth="4" />
                  <circle cx="800" cy="1540" r="44" fill="url(#skin-light2)" stroke="#000" strokeWidth="4" />
                  <path d="M 400 1320 C 400 1200, 460 1150, 540 1150" stroke="#F7C548" strokeWidth="4" fill="none" opacity={0.4 + pulseA * 0.5} />
                  <path d="M 680 1320 C 680 1200, 620 1150, 540 1150" stroke="#00F0FF" strokeWidth="4" fill="none" opacity={0.4 + pulseB * 0.5} />
                </g>
              </g>
            );
          })()}
      </svg>
    </div>
  );
};