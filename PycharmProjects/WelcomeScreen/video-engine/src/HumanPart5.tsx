import React from "react";
import { Easing, interpolate, random, useCurrentFrame, useVideoConfig } from "remotion";
import { YoungHairFront, YoungHairBack, AmbientDust, LowFog } from "./HumanPart2";

export type Part5Pose = "icy_ledge" | "fire_escape" | "running_phone" | "silhouettes";

interface Part5Props {
  pose: Part5Pose;
}

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const easeIO = { ...clamp, easing: Easing.inOut(Easing.cubic) };

const SMS_TEXT_1 = "ПРАВИЛО 304 НАРУШЕНО.";
const SMS_TEXT_2 = "ПОСМОТРИ НАВЕРХ";

/* ---------- Rain (normalized to 30fps motion) ---------- */
const Rain: React.FC<{ f: number; count: number; opacity: number; seed: string }> = ({ f, count, opacity, seed }) => (
  <g opacity={opacity} stroke="#93C5FD" strokeWidth="2.5" strokeLinecap="round">
    {Array.from({ length: count }).map((_, r) => {
      const rx = (random(`${seed}-x-${r}`) * 1180 + f * 4) % 1180 - 50;
      const ry = (random(`${seed}-y-${r}`) * 1920 + f * (36 + random(`${seed}-s-${r}`) * 14)) % 2000 - 80;
      return <line key={r} x1={rx} y1={ry} x2={rx - 14} y2={ry + 52} />;
    })}
  </g>
);

/* ---------- Black monster finger hanging down ---------- */
const BlackFinger: React.FC<{ x: number; y: number; len: number; curl: number; w: number }> = ({ x, y, len, curl, w }) => {
  if (len <= 2) return null;
  const midX = x + curl * 0.5;
  const endX = x + curl;
  const endY = y + len;
  return (
    <g>
      <path d={`M ${x} ${y} Q ${midX + curl * 0.6} ${y + len * 0.55} ${endX} ${endY}`} stroke="#05070A" strokeWidth={w} strokeLinecap="round" fill="none" />
      {/* knuckles */}
      {[0.33, 0.66].map((k) => (
        <ellipse key={k} cx={x + curl * k * 1.05} cy={y + len * k} rx={w * 0.55} ry={w * 0.3} fill="#1E242B" opacity="0.8" />
      ))}
      {/* sick blue rim light */}
      <path d={`M ${x + w * 0.45} ${y} Q ${midX + curl * 0.6 + w * 0.45} ${y + len * 0.55} ${endX + w * 0.4} ${endY}`} stroke="#7DD3FC" strokeWidth="2" fill="none" opacity="0.45" />
      <polygon points={`${endX - w * 0.4},${endY} ${endX + curl * 0.15},${endY + w * 1.1} ${endX + w * 0.4},${endY}`} fill="#F8FAFC" />
    </g>
  );
};

/* ---------- Identical Artem silhouette (window watcher) ---------- */
const Watcher: React.FC<{ x: number; y: number; s: number; tilt: number; eyes: number; idx: number }> = ({ x, y, s, tilt, eyes, idx }) => (
  <g transform={`translate(${x}, ${y}) scale(${s}) rotate(${tilt})`}>
    <path d="M -230 170 Q 0 120 230 170 L 300 1500 L -300 1500 Z" fill="#000" />
    <rect x="-55" y="120" width="110" height="80" fill="#000" />
    <ellipse cx="-142" cy="10" rx="22" ry="34" fill="#000" />
    <ellipse cx="142" cy="10" rx="22" ry="34" fill="#000" />
    <ellipse cx="0" cy="0" rx="140" ry="170" fill="#000" />
    <g filter="url(#p5-silhouette)">
      <YoungHairFront cx={0} cy={0} />
    </g>
    {eyes > 0 && (
      <g opacity={eyes} key={`eyes-${idx}`}>
        <circle cx="-50" cy="-20" r="34" fill="#EF4444" filter="url(#p5-eye-glow)" />
        <circle cx="50" cy="-20" r="34" fill="#EF4444" filter="url(#p5-eye-glow)" />
        <circle cx="-50" cy="-20" r="14" fill="#FFF" />
        <circle cx="50" cy="-20" r="14" fill="#FFF" />
      </g>
    )}
  </g>
);

export const HumanPart5: React.FC<Part5Props> = ({ pose }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const curSec = frame / fps;
  // Motion normalized to 30fps so the 60fps render keeps the same organic tempo as Parts 2-4
  const f = (frame * 30) / fps;

  const breath = Math.sin(f * 0.16) * 6;
  const tremor = Math.sin(f * 1.3) * 4;

  return (
    <svg
      viewBox="0 0 1080 1920"
      style={{ width: "100%", height: "100%", position: "absolute", top: 0, left: 0, pointerEvents: "none" }}
    >
      <defs>
        <linearGradient id="skin-light2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FBD5B5" />
          <stop offset="100%" stopColor="#E4A882" />
        </linearGradient>
        <linearGradient id="hoodie-grad2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3E4C3D" />
          <stop offset="100%" stopColor="#222B21" />
        </linearGradient>
        <linearGradient id="jeans-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#334155" />
          <stop offset="100%" stopColor="#111827" />
        </linearGradient>
        <linearGradient id="hair-young" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#3B2B1F" />
          <stop offset="55%" stopColor="#21160F" />
          <stop offset="100%" stopColor="#140D08" />
        </linearGradient>
        <linearGradient id="nape-fade" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#140D08" />
          <stop offset="100%" stopColor="#8C5E44" stopOpacity="0.9" />
        </linearGradient>
        <linearGradient id="ice-grad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#F0F9FF" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#7DD3FC" stopOpacity="0.15" />
        </linearGradient>
        <linearGradient id="rust-grad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#431407" />
          <stop offset="50%" stopColor="#9A3412" />
          <stop offset="100%" stopColor="#431407" />
        </linearGradient>
        <linearGradient id="wall-shade" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#020617" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#020617" stopOpacity="0.85" />
        </linearGradient>
        <linearGradient id="window-sick" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FEF3C7" />
          <stop offset="60%" stopColor="#FCD34D" />
          <stop offset="100%" stopColor="#B45309" />
        </linearGradient>
        <radialGradient id="lamp-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FDE68A" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#FDE68A" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="phone-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#60A5FA" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#60A5FA" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="exit-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FEF9C3" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#FEF9C3" stopOpacity="0" />
        </radialGradient>
        <pattern id="p5-brick" width="120" height="60" patternUnits="userSpaceOnUse">
          <rect width="120" height="60" fill="#1C0F0C" />
          <rect x="2" y="2" width="56" height="26" fill="#4A2520" />
          <rect x="62" y="2" width="56" height="26" fill="#3F201B" />
          <rect x="-28" y="32" width="56" height="26" fill="#43231D" />
          <rect x="32" y="32" width="56" height="26" fill="#502A23" />
          <rect x="92" y="32" width="56" height="26" fill="#43231D" />
        </pattern>
        <filter id="fog-blur" x="-50%" y="-100%" width="200%" height="300%"><feGaussianBlur stdDeviation="38" /></filter>
        <filter id="mote-glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1.2" /></filter>
        <filter id="dof-far" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="6" /></filter>
        <filter id="dof-mid" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="2.5" /></filter>
        <filter id="soft-shadow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="18" /></filter>
        <filter id="p5-eye-glow" x="-200%" y="-200%" width="500%" height="500%"><feGaussianBlur stdDeviation="10" /></filter>
        <filter id="p5-silhouette">
          <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" />
        </filter>
      </defs>

      {/* ========================================================================= */}
      {/* 1. ICY LEDGE (0 - 12s): hanging from frozen cornice, black fingers above  */}
      {/* ========================================================================= */}
      {pose === "icy_ledge" && (() => {
        const fingerLen = interpolate(curSec, [10.4, 13.7], [0, 290], { ...clamp, easing: Easing.out(Easing.cubic) });
        const crack = curSec >= 8.3;
        const slip = crack ? interpolate(curSec, [8.3, 8.6, 9.4], [0, 22, 10], clamp) : 0;
        const swing = Math.sin(f * 0.05) * 2.2 + (crack ? Math.sin(f * 0.9) * interpolate(curSec, [8.3, 10], [3, 0], clamp) : 0);
        return (
          <g id="scene-icy-ledge">
            {/* Brick wall + depth shading */}
            <rect width="1080" height="1920" fill="url(#p5-brick)" />
            <rect width="1080" height="1920" fill="url(#wall-shade)" />

            {/* Broken window above */}
            <g>
              <rect x="290" y="120" width="500" height="450" fill="#111827" stroke="#000" strokeWidth="8" />
              <rect x="315" y="145" width="450" height="400" fill="#000" />
              <ellipse cx="540" cy="360" rx="180" ry="140" fill="#7F1D1D" opacity={0.18 + Math.sin(f * 0.07) * 0.06} filter="url(#dof-far)" />
              {/* jagged glass shards */}
              <polygon points="315,145 420,145 360,240 330,200" fill="#94A3B8" opacity="0.55" />
              <polygon points="765,145 680,145 735,260" fill="#94A3B8" opacity="0.5" />
              <polygon points="315,545 380,545 330,470" fill="#94A3B8" opacity="0.45" />
              <polygon points="765,545 690,545 750,440" fill="#94A3B8" opacity="0.5" />
              {/* sill with frost */}
              <rect x="270" y="560" width="540" height="34" fill="#475569" stroke="#0F172A" strokeWidth="5" />
              <rect x="270" y="556" width="540" height="8" fill="#E0F2FE" opacity="0.8" />
            </g>

            {/* Monster palm over the sill + creeping fingers */}
            {fingerLen > 0 && (
              <g transform={`translate(${tremor * 0.5}, 0)`}>
                <ellipse cx="540" cy="572" rx={interpolate(fingerLen, [0, 80], [40, 150], clamp)} ry="34" fill="#05070A" />
                <BlackFinger x={455} y={585} len={fingerLen * 0.85} curl={-30 + Math.sin(f * 0.11) * 8} w={22} />
                <BlackFinger x={510} y={590} len={fingerLen} curl={-10 + Math.sin(f * 0.13 + 1) * 8} w={24} />
                <BlackFinger x={570} y={590} len={fingerLen * 1.05} curl={12 + Math.sin(f * 0.12 + 2) * 8} w={24} />
                <BlackFinger x={625} y={585} len={fingerLen * 0.8} curl={34 + Math.sin(f * 0.1 + 3) * 8} w={20} />
              </g>
            )}

            {/* Neighbour window (target) on the right */}
            <g filter="url(#dof-mid)">
              <rect x="860" y="980" width="260" height="420" fill="#0B1120" stroke="#000" strokeWidth="8" />
              <rect x="880" y="1000" width="220" height="380" fill="#1E293B" opacity="0.7" />
            </g>

            {/* Icy cornice */}
            <rect x="0" y="900" width="1080" height="52" fill="#475569" stroke="#0F172A" strokeWidth="6" />
            <rect x="0" y="893" width="1080" height="12" fill="#E0F2FE" opacity="0.85" />
            {Array.from({ length: 16 }).map((_, i) => {
              const ix = 20 + i * 68 + random(`ic-x-${i}`) * 20;
              const il = 30 + random(`ic-l-${i}`) * 80;
              return <polygon key={i} points={`${ix},952 ${ix + 18},952 ${ix + 8},${952 + il}`} fill="url(#ice-grad)" />;
            })}

            {/* Cracking plaster under the ledge */}
            {crack && (
              <g>
                <path d="M 240 952 L 270 1010 L 250 1060 L 290 1130" stroke="#000" strokeWidth="4" fill="none" />
                <path d="M 820 952 L 790 1020 L 830 1090" stroke="#000" strokeWidth="4" fill="none" />
                {Array.from({ length: 14 }).map((_, i) => {
                  const t0 = (curSec - 8.3) * 30;
                  const px = 200 + random(`pl-x-${i}`) * 680;
                  const py = 960 + ((t0 * (14 + random(`pl-s-${i}`) * 10) + i * 70) % 1000);
                  const sz = 6 + random(`pl-r-${i}`) * 10;
                  return <rect key={i} x={px} y={py} width={sz} height={sz * 0.8} fill="#CBD5E1" opacity="0.75" transform={`rotate(${f * 6 + i * 30} ${px} ${py})`} />;
                })}
              </g>
            )}

            {/* Soft drop shadow of the body on the wall */}
            <ellipse cx="560" cy="1350" rx="240" ry="420" fill="#000" opacity="0.4" filter="url(#soft-shadow)" />

            {/* Artem hanging (back view), swings from ledge pivot */}
            <g transform={`rotate(${swing} 540 905) translate(0, ${slip})`}>
              {/* legs dangling */}
              <path d={`M 420 1620 Q ${410 + Math.sin(f * 0.07) * 18} 1780 ${400 + Math.sin(f * 0.07) * 30} 1960`} stroke="url(#jeans-grad)" strokeWidth="110" strokeLinecap="round" fill="none" />
              <path d={`M 660 1620 Q ${670 + Math.sin(f * 0.07 + 1) * 18} 1780 ${680 + Math.sin(f * 0.07 + 1) * 30} 1960`} stroke="url(#jeans-grad)" strokeWidth="110" strokeLinecap="round" fill="none" />
              {/* arms up to the ledge */}
              <path d="M 400 1260 L 315 930 L 375 920 L 470 1250 Z" fill="url(#hoodie-grad2)" stroke="#000" strokeWidth="6" />
              <path d="M 680 1260 L 765 930 L 705 920 L 610 1250 Z" fill="url(#hoodie-grad2)" stroke="#000" strokeWidth="6" />
              {/* torso */}
              <path d="M 360 1230 L 720 1230 L 710 1650 L 370 1650 Z" fill="url(#hoodie-grad2)" stroke="#000" strokeWidth="6" />
              {/* gold rim light */}
              <path d="M 315 930 L 400 1260 L 370 1650" stroke="#F7C548" strokeWidth="4" fill="none" opacity="0.75" />
              <path d="M 765 930 L 680 1260 L 710 1650" stroke="#7DD3FC" strokeWidth="3" fill="none" opacity="0.55" />
              {/* back of head (canonical geometry, head moved from 540,1540 to 540,1120) */}
              <g transform="translate(0, -420)">
                <YoungHairBack />
              </g>
            </g>

            {/* Hands gripping the ice (drawn over ledge) */}
            {[345, 735].map((hx, i) => (
              <g key={i} transform={`translate(${hx + (i ? -1 : 1) * tremor * 0.6}, ${905 + slip * 0.3})`}>
                <ellipse cx="0" cy="12" rx="44" ry="30" fill="url(#skin-light2)" stroke="#000" strokeWidth="4" />
                {[-27, -9, 9, 27].map((fx) => (
                  <rect key={fx} x={fx - 8} y="-14" width="16" height="30" rx="8" fill="#F5C6A5" stroke="#000" strokeWidth="3" />
                ))}
                {/* frost-burn redness */}
                <ellipse cx="0" cy="-4" rx="34" ry="8" fill="#F87171" opacity="0.35" />
              </g>
            ))}

            <Rain f={f} count={26} opacity={0.3} seed="r1" />
            <AmbientDust frame={f} count={28} color="#E0F2FE" seed="snow1" />
          </g>
        );
      })()}

      {/* ========================================================================= */}
      {/* 2. FIRE ESCAPE (12 - 23s): climbing down rusty ladder into the wet alley  */}
      {/* ========================================================================= */}
      {pose === "fire_escape" && (() => {
        const headY = interpolate(curSec, [12, 17.0, 19.1, 21.3, 23], [300, 620, 800, 1300, 1300], {
          ...clamp,
          easing: Easing.inOut(Easing.quad),
        });
        const sliding = curSec >= 19.1 && curSec < 21.3;
        const landed = curSec >= 21.3;
        const climb = !sliding && !landed ? Math.sin(f * 0.28) : 0;
        const crouch = landed ? interpolate(curSec, [21.3, 21.6, 22.6], [0, 40, 25], clamp) : 0;
        const handFingers = interpolate(curSec, [12, 14], [180, 260], clamp);
        return (
          <g id="scene-fire-escape">
            {/* wall */}
            <rect width="1080" height="1920" fill="url(#p5-brick)" />
            <rect width="1080" height="1920" fill="url(#wall-shade)" />

            {/* window at top with the black hand hanging out */}
            <rect x="120" y="-40" width="360" height="300" fill="#000" stroke="#111827" strokeWidth="10" />
            <g transform={`translate(${tremor}, 0)`}>
              <BlackFinger x={240} y={240} len={handFingers} curl={-20 + Math.sin(f * 0.1) * 12} w={22} />
              <BlackFinger x={290} y={245} len={handFingers * 1.1} curl={Math.sin(f * 0.12) * 12} w={24} />
              <BlackFinger x={340} y={240} len={handFingers * 0.95} curl={22 + Math.sin(f * 0.11) * 12} w={22} />
              <ellipse cx="290" cy="245" rx="90" ry="26" fill="#05070A" />
            </g>

            {/* streetlamp glow (right) */}
            <circle cx="930" cy="760" r="260" fill="url(#lamp-glow)" />
            <rect x="900" y="720" width="60" height="22" rx="8" fill="#FDE68A" />

            {/* fire escape platform */}
            <g>
              <rect x="320" y="400" width="560" height="22" fill="url(#rust-grad)" stroke="#000" strokeWidth="4" />
              {Array.from({ length: 12 }).map((_, i) => (
                <line key={i} x1={330 + i * 48} y1="300" x2={330 + i * 48} y2="400" stroke="#7C2D12" strokeWidth="6" />
              ))}
              <rect x="320" y="290" width="560" height="14" fill="#7C2D12" stroke="#000" strokeWidth="3" />
              {/* diagonal stair to upper floor */}
              <path d="M 860 400 L 1080 120" stroke="#7C2D12" strokeWidth="18" />
            </g>

            {/* ladder */}
            <g>
              <rect x="430" y="410" width="22" height="1360" fill="url(#rust-grad)" stroke="#000" strokeWidth="3" />
              <rect x="628" y="410" width="22" height="1360" fill="url(#rust-grad)" stroke="#000" strokeWidth="3" />
              {Array.from({ length: 19 }).map((_, i) => (
                <rect key={i} x="450" y={460 + i * 70} width="180" height="12" fill="#9A3412" stroke="#000" strokeWidth="3" />
              ))}
              {/* rust flakes / highlights */}
              {Array.from({ length: 22 }).map((_, i) => (
                <circle key={i} cx={i % 2 ? 439 : 637} cy={430 + random(`rust-${i}`) * 1320} r={3 + random(`rr-${i}`) * 3} fill="#EA580C" opacity="0.7" />
              ))}
            </g>

            {/* wet alley ground */}
            <rect x="0" y="1740" width="1080" height="180" fill="#070B14" />
            <rect x="0" y="1736" width="1080" height="6" fill="#334155" opacity="0.6" />
            <ellipse cx="760" cy="1830" rx="230" ry="30" fill="#FDE68A" opacity={0.18 + Math.sin(f * 0.2) * 0.04} />
            <ellipse cx="300" cy="1860" rx="160" ry="22" fill="#60A5FA" opacity="0.12" />
            {/* dumpster */}
            <g filter="url(#dof-mid)">
              <rect x="20" y="1560" width="300" height="200" fill="#14532D" stroke="#000" strokeWidth="6" />
              <rect x="10" y="1540" width="320" height="30" fill="#166534" stroke="#000" strokeWidth="5" />
            </g>

            {/* character shadow on wall */}
            <ellipse cx={575} cy={headY + 280} rx="130" ry="300" fill="#000" opacity="0.45" filter="url(#soft-shadow)" />

            {/* Artem climbing down (back view, scale 0.5, head center at 540, headY) */}
            <g transform={`translate(${540 + tremor * 0.4}, ${headY + crouch}) scale(0.5) translate(-540, -1540)`}>
              {/* legs */}
              <path d={`M 470 2040 L ${430} ${2380 + climb * 40 - crouch * 2}`} stroke="url(#jeans-grad)" strokeWidth="100" strokeLinecap="round" />
              <path d={`M 610 2040 L ${650} ${2380 - climb * 40 - crouch * 2}`} stroke="url(#jeans-grad)" strokeWidth="100" strokeLinecap="round" />
              {/* arms to rails */}
              <path d={`M 400 1700 L 320 ${1440 + climb * 60} L 380 ${1430 + climb * 60} L 470 1690 Z`} fill="url(#hoodie-grad2)" stroke="#000" strokeWidth="8" />
              <path d={`M 680 1700 L 760 ${1440 - climb * 60} L 700 ${1430 - climb * 60} L 610 1690 Z`} fill="url(#hoodie-grad2)" stroke="#000" strokeWidth="8" />
              {/* torso */}
              <path d="M 370 1670 L 710 1670 L 700 2060 L 380 2060 Z" fill="url(#hoodie-grad2)" stroke="#000" strokeWidth="8" />
              <path d="M 320 1440 L 400 1700 L 380 2060" stroke="#F7C548" strokeWidth="6" fill="none" opacity="0.8" />
              {/* hands */}
              <circle cx="350" cy={1425 + climb * 60} r="40" fill="url(#skin-light2)" stroke="#000" strokeWidth="6" />
              <circle cx="730" cy={1425 - climb * 60} r="40" fill="url(#skin-light2)" stroke="#000" strokeWidth="6" />
              <YoungHairBack />
            </g>

            {/* sparks while sliding */}
            {sliding &&
              Array.from({ length: 10 }).map((_, i) => {
                const sy = headY - 280 + random(`sp-${i}-${Math.floor(f / 2)}`) * 40;
                const side = i % 2 ? 360 : 720;
                const sx = side + (random(`spx-${i}-${Math.floor(f / 2)}`) - 0.5) * 70;
                return <line key={i} x1={side} y1={headY - 280} x2={sx} y2={sy - 40} stroke="#FDBA74" strokeWidth="3" opacity="0.9" />;
              })}

            {/* landing splash rings */}
            {landed &&
              [0, 1, 2].map((k) => {
                const p = interpolate(curSec, [21.3 + k * 0.12, 22.6 + k * 0.12], [0, 1], clamp);
                return (
                  <ellipse key={k} cx="540" cy="1790" rx={40 + p * 320} ry={8 + p * 40} fill="none" stroke="#BFDBFE" strokeWidth="4" opacity={(1 - p) * 0.8} />
                );
              })}

            <Rain f={f} count={45} opacity={0.45} seed="r2" />
            <LowFog frame={f} y={1600} height={260} color="#94A3B8" opacity={0.28} seed="fog2" />
          </g>
        );
      })()}

      {/* ========================================================================= */}
      {/* 3. RUNNING + PHONE (23 - 37s): run through alley, SMS "ПРАВИЛО 304"       */}
      {/* ========================================================================= */}
      {pose === "running_phone" && (() => {
        const phoneMode = curSec >= 28.3;
        const runP = interpolate(curSec, [23, 28.3], [0, 1], clamp);
        const bob = Math.abs(Math.sin(f * 0.36)) * -24;
        const stride = Math.sin(f * 0.36) * 28;
        const runScale = interpolate(runP, [0, 1], [0.62, 0.5]);
        const runY = interpolate(runP, [0, 1], [1420, 1340]);
        const lookBack = interpolate(curSec, [25.4, 25.8, 26.5, 26.9], [0, 1, 1, 0], clamp);

        const vibrating = (curSec >= 28.38 && curSec < 33.4) || (curSec >= 34.6 && curSec < 35.6);
        const vib = vibrating ? Math.sin(f * 4.2) * 7 : 0;
        const screenOn = curSec >= 29.3;
        const msgOn = curSec >= 34.6;
        const typed1 = Math.floor(interpolate(curSec, [34.6, 35.7], [0, SMS_TEXT_1.length], clamp));
        const typed2 = Math.floor(interpolate(curSec, [35.8, 36.6], [0, SMS_TEXT_2.length], clamp));
        const phoneIn = interpolate(curSec, [28.3, 28.8], [500, 0], { ...clamp, easing: Easing.out(Easing.back(1.4)) });

        return (
          <g id="scene-run-phone">
            {/* Alley in perspective (blurred behind the phone = DoF) */}
            <g filter={phoneMode ? "url(#dof-far)" : undefined} opacity={phoneMode ? 0.65 : 1}>
              <rect width="1080" height="1920" fill="#05070D" />
              <polygon points="0,0 400,760 400,1120 0,1920" fill="url(#p5-brick)" />
              <polygon points="1080,0 680,760 680,1120 1080,1920" fill="url(#p5-brick)" />
              <polygon points="0,0 400,760 400,1120 0,1920" fill="#020617" opacity="0.55" />
              <polygon points="1080,0 680,760 680,1120 1080,1920" fill="#020617" opacity="0.55" />
              {/* exit light at the end */}
              <rect x="400" y="760" width="280" height="360" fill="#1E293B" />
              <circle cx="540" cy="960" r="230" fill="url(#exit-glow)" opacity={0.7 + Math.sin(f * 0.1) * 0.08} />
              {/* wet ground with reflections */}
              <polygon points="0,1920 400,1120 680,1120 1080,1920" fill="#0B1220" />
              <polygon points="470,1120 610,1120 760,1920 320,1920" fill="#FEF9C3" opacity="0.08" />
              {Array.from({ length: 6 }).map((_, i) => (
                <ellipse key={i} cx={300 + random(`pd-${i}`) * 480} cy={1250 + i * 110} rx={60 + i * 25} ry={8 + i * 3} fill="#BFDBFE" opacity="0.12" />
              ))}
              {/* fire escape receding on left wall */}
              <path d="M 0 500 L 400 900" stroke="#7C2D12" strokeWidth="10" />
              <path d="M 0 900 L 400 1050" stroke="#7C2D12" strokeWidth="8" />
              {/* ground shadow + running Artem from behind */}
              {!phoneMode && (
                <g>
                  <ellipse cx="540" cy={runY + 560 * runScale} rx={170 * runScale} ry={26 * runScale} fill="#000" opacity="0.6" filter="url(#mote-glow)" />
                  <g transform={`translate(${540 + Math.sin(f * 0.18) * 10}, ${runY + bob}) scale(${runScale}) translate(-540, -1540)`}>
                    <path d={`M 470 2040 L ${470 - stride} 2440`} stroke="url(#jeans-grad)" strokeWidth="100" strokeLinecap="round" />
                    <path d={`M 610 2040 L ${610 + stride} 2440`} stroke="url(#jeans-grad)" strokeWidth="100" strokeLinecap="round" />
                    <path d={`M 400 1700 L ${330 + stride} 1960 L 390 1980 L 450 1720 Z`} fill="url(#hoodie-grad2)" stroke="#000" strokeWidth="8" />
                    <path d={`M 680 1700 L ${750 - stride} 1960 L 690 1980 L 630 1720 Z`} fill="url(#hoodie-grad2)" stroke="#000" strokeWidth="8" />
                    <path d="M 370 1670 L 710 1670 L 700 2060 L 380 2060 Z" fill="url(#hoodie-grad2)" stroke="#000" strokeWidth="8" />
                    <path d="M 370 1670 L 380 2060" stroke="#F7C548" strokeWidth="6" opacity="0.8" />
                    <path d="M 710 1670 L 700 2060" stroke="#F7C548" strokeWidth="6" opacity="0.8" />
                    <g transform={`rotate(${lookBack * -18} 540 1650)`}>
                      <YoungHairBack />
                      {/* glimpse of terrified eye when looking back */}
                      {lookBack > 0.5 && (
                        <g>
                          <ellipse cx="410" cy="1530" rx="26" ry="40" fill="url(#skin-light2)" stroke="#000" strokeWidth="4" />
                          <circle cx="402" cy="1520" r="10" fill="#FFF" stroke="#000" strokeWidth="3" />
                        </g>
                      )}
                    </g>
                  </g>
                </g>
              )}
              <Rain f={f} count={40} opacity={0.4} seed="r3" />
            </g>

            {/* Phone close-up */}
            {phoneMode && (
              <g transform={`translate(${vib}, ${phoneIn + Math.sin(f * 0.16) * 4})`}>
                {screenOn && <circle cx="540" cy="940" r="620" fill="url(#phone-glow)" />}
                {/* vibration arcs */}
                {vibrating &&
                  [0, 1, 2].map((k) => (
                    <g key={k} opacity={0.35 + 0.5 * Math.abs(Math.sin(f * 0.5 + k))} stroke="#E2E8F0" strokeWidth="6" fill="none" strokeLinecap="round">
                      <path d={`M ${290 - k * 34} ${820 - k * 20} Q ${270 - k * 34} 940 ${290 - k * 34} ${1060 + k * 20}`} />
                      <path d={`M ${790 + k * 34} ${820 - k * 20} Q ${810 + k * 34} 940 ${790 + k * 34} ${1060 + k * 20}`} />
                    </g>
                  ))}
                {/* hand behind phone */}
                <path d="M 300 1920 L 340 1300 Q 360 1220 440 1230 L 700 1240 Q 780 1250 780 1330 L 820 1920 Z" fill="url(#skin-light2)" stroke="#000" strokeWidth="6" />
                <path d="M 300 1920 L 340 1300 Q 360 1220 440 1230" stroke="#F7C548" strokeWidth="4" fill="none" opacity="0.7" />
                {/* hoodie cuff */}
                <path d="M 270 1760 L 850 1760 L 880 1920 L 240 1920 Z" fill="url(#hoodie-grad2)" stroke="#000" strokeWidth="6" />
                {/* phone body */}
                <rect x="345" y="540" width="390" height="800" rx="56" fill="#0A0A0A" stroke="#334155" strokeWidth="6" />
                <rect x="365" y="560" width="350" height="760" rx="42" fill={screenOn ? "#0F172A" : "#030303"} />
                <rect x="490" y="578" width="100" height="26" rx="13" fill="#000" />
                {screenOn && (
                  <g fontFamily="system-ui, -apple-system, sans-serif">
                    <text x="540" y="690" fill="#E2E8F0" fontSize="78" fontWeight="300" textAnchor="middle">03:04</text>
                    <text x="540" y="730" fill="#94A3B8" fontSize="22" textAnchor="middle">воскресенье, 15 ноября</text>
                    {/* notification card */}
                    <g opacity={interpolate(curSec, [29.3, 29.7], [0, 1], clamp)}>
                      <rect x="385" y="780" width="310" height={msgOn ? 380 : 120} rx="26" fill="#1E293B" stroke={msgOn ? "#EF4444" : "#475569"} strokeWidth="3" />
                      <circle cx="420" cy="818" r="18" fill="#EF4444" />
                      <text x="420" y="826" fill="#FFF" fontSize="22" fontWeight="900" textAnchor="middle">?</text>
                      <text x="450" y="814" fill="#F8FAFC" fontSize="22" fontWeight="800">Неизвестный номер</text>
                      <text x="450" y="842" fill="#94A3B8" fontSize="18">сейчас</text>
                      {!msgOn && <text x="410" y="878" fill="#CBD5E1" fontSize="20">Новое сообщение</text>}
                      {msgOn && (
                        <g>
                          <text x="405" y="910" fill="#F87171" fontSize="33" fontWeight="900">{SMS_TEXT_1.slice(0, Math.min(typed1, 11))}</text>
                          <text x="405" y="955" fill="#F87171" fontSize="33" fontWeight="900">{typed1 > 11 ? SMS_TEXT_1.slice(11, typed1) : ""}</text>
                          <text x="405" y="1040" fill="#FFFFFF" fontSize="34" fontWeight="900">{SMS_TEXT_2.slice(0, Math.min(typed2, 9))}</text>
                          <text x="405" y="1085" fill="#FFFFFF" fontSize="34" fontWeight="900">{typed2 > 9 ? SMS_TEXT_2.slice(9, typed2) : ""}</text>
                          {curSec >= 36.6 && (
                            <rect x="385" y="780" width="310" height="380" rx="26" fill="#EF4444" opacity={0.12 + 0.12 * Math.abs(Math.sin(f * 0.3))} />
                          )}
                        </g>
                      )}
                    </g>
                  </g>
                )}
                {/* thumb over the side */}
                <path d="M 735 1080 Q 800 1060 805 1150 Q 800 1230 735 1230 Z" fill="url(#skin-light2)" stroke="#000" strokeWidth="5" />
                {/* screen glare */}
                <path d="M 380 580 L 520 580 L 380 900 Z" fill="#FFF" opacity="0.05" />
              </g>
            )}
          </g>
        );
      })()}

      {/* ========================================================================= */}
      {/* 4. SILHOUETTES (37 - 52s): dozens of identical figures in 3rd floor       */}
      {/* ========================================================================= */}
      {pose === "silhouettes" && (() => {
        const tiltUp = interpolate(curSec, [40.3, 41.6], [-260, 380], easeIO);
        const windowsX = [20, 195, 370, 545, 720, 895];
        const winW = 165;
        const winTop = 520;
        const winH = 300;
        const syncTilt = Math.sin(f * 0.03) * 3 + interpolate(curSec, [45.8, 46.2], [0, 12], clamp);
        return (
          <g id="scene-silhouettes">
            <rect width="1080" height="1920" fill="#03050A" />
            <g transform={`translate(0, ${tiltUp})`}>
              {/* night sky band */}
              <rect x="0" y="-600" width="1080" height="700" fill="#0B1226" />
              {/* distant blurred buildings (DoF) */}
              <g filter="url(#dof-far)" opacity="0.8">
                <rect x="-40" y="-200" width="260" height="400" fill="#0F172A" />
                <rect x="860" y="-260" width="260" height="460" fill="#0F172A" />
                {[0, 1, 2].map((k) => (
                  <rect key={k} x={-10 + k * 70} y="-120" width="40" height="60" fill="#FCD34D" opacity={curSec > 42.2 ? 0.55 : 0.1} />
                ))}
                {[0, 1, 2].map((k) => (
                  <rect key={k} x={890 + k * 70} y="-150" width="40" height="60" fill="#FCD34D" opacity={curSec > 42.4 ? 0.55 : 0.1} />
                ))}
              </g>
              {/* front facade */}
              <rect x="0" y="100" width="1080" height="1500" fill="url(#p5-brick)" />
              <rect x="0" y="100" width="1080" height="1500" fill="url(#wall-shade)" />
              {/* floor labels via cornices */}
              {[460, 880, 1250].map((cy) => (
                <g key={cy}>
                  <rect x="0" y={cy} width="1080" height="24" fill="#334155" stroke="#0F172A" strokeWidth="4" />
                  <rect x="0" y={cy - 4} width="1080" height="6" fill="#E0F2FE" opacity="0.5" />
                </g>
              ))}
              {/* the ledge he hung from — 3rd floor broken window */}
              {/* 4th floor dark windows */}
              {windowsX.map((wx, i) => (
                <rect key={`w4-${i}`} x={wx} y="170" width={winW} height="250" fill="#05070C" stroke="#000" strokeWidth="6" />
              ))}
              {/* 2nd floor dark windows */}
              {windowsX.map((wx, i) => (
                <rect key={`w2-${i}`} x={wx} y="940" width={winW} height="270" fill="#05070C" stroke="#000" strokeWidth="6" />
              ))}

              {/* 3rd floor — lit windows with identical watchers */}
              {windowsX.map((wx, i) => {
                const litAt = 41.9 + i * 0.14;
                const lit = interpolate(curSec, [litAt, litAt + 0.25], [0, 1], clamp);
                const flicker = 0.85 + 0.15 * random(`flk-${i}-${Math.floor(f / 3)}`);
                return (
                  <g key={`w3-${i}`}>
                    <rect x={wx} y={winTop} width={winW} height={winH} fill="#05070C" stroke="#000" strokeWidth="6" />
                    <rect x={wx + 6} y={winTop + 6} width={winW - 12} height={winH - 12} fill="url(#window-sick)" opacity={lit * flicker} />
                    {lit > 0 && (
                      <g opacity={lit}>
                        <clipPath id={`clip-w3-${i}`}>
                          <rect x={wx + 6} y={winTop + 6} width={winW - 12} height={winH - 12} />
                        </clipPath>
                        <g clipPath={`url(#clip-w3-${i})`}>
                          {[0, 1, 2, 3].map((k) => {
                            const n = i * 4 + k;
                            const back = k % 2 === 1;
                            const sx = wx + 30 + k * 35;
                            const sy = winTop + (back ? 95 : 125);
                            const eyeAt = 44.48 + n * 0.035;
                            const eyes = interpolate(curSec, [eyeAt, eyeAt + 0.15], [0, 1], clamp);
                            return (
                              <Watcher key={k} idx={n} x={sx} y={sy} s={back ? 0.2 : 0.24} tilt={syncTilt} eyes={eyes} />
                            );
                          })}
                        </g>
                      </g>
                    )}
                    {/* frost on sill */}
                    <rect x={wx - 10} y={winTop + winH} width={winW + 20} height="14" fill="#475569" />
                    <rect x={wx - 10} y={winTop + winH - 3} width={winW + 20} height="5" fill="#E0F2FE" opacity="0.7" />
                  </g>
                );
              })}

              {/* light spill onto the wet street */}
              <rect x="0" y="1600" width="1080" height="700" fill="#070B14" />
              {windowsX.map((wx, i) => (
                <rect key={`ref-${i}`} x={wx + 20} y="1640" width={winW - 40} height="200" fill="#FCD34D" opacity={curSec > 42 ? 0.08 : 0} filter="url(#dof-mid)" />
              ))}
            </g>

            <Rain f={f} count={34} opacity={0.35} seed="r4" />

            {/* Artem foreground — back of head, looking up (rim-lit, slightly blurred = near DoF) */}
            <g transform={`translate(${tremor * 0.4}, ${130 + breath * 0.5}) rotate(${interpolate(curSec, [40.3, 41.2], [6, -4], clamp)} 540 1700)`}>
              <path d="M 300 1700 L 780 1700 L 840 1920 L 240 1920 Z" fill="url(#hoodie-grad2)" stroke="#000" strokeWidth="6" />
              <YoungHairBack />
              <path d="M 405 1540 C 400 1440, 470 1372, 540 1370 C 610 1372, 680 1440, 675 1540" stroke="#FCD34D" strokeWidth={curSec > 42 ? 7 : 3} fill="none" opacity={curSec > 42 ? 0.85 : 0.4} />
            </g>

            <LowFog frame={f} y={1500} height={300} color="#64748B" opacity={0.25} seed="fog4" />
          </g>
        );
      })()}
    </svg>
  );
};
