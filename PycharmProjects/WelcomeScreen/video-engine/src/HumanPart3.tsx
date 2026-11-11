import React from "react";
import { interpolate, random, useCurrentFrame, useVideoConfig } from "remotion";
import {
  YoungHairFront,
  YoungHairBack,
  OldHair,
  DustMotes,
  AmbientDust,
  LowFog,
  flashIntensity,
} from "./HumanPart2";

export type Part3Pose =
  | "barricade_push"
  | "old_artem_whisper"
  | "glass_shatter_hand"
  | "choice_dilemma";

interface Part3Props {
  pose: Part3Pose;
}

export const HumanPart3: React.FC<Part3Props> = ({ pose }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const curSec = frame / fps;
  const flash = flashIntensity(frame);

  // Micro-animations:
  const breath = Math.sin(frame * 0.12) * 5;
  const tremorX = Math.sin(frame * 0.95) * 4;
  const tremorY = Math.cos(frame * 0.85) * 3;
  const glassFall = (frame * 16) % 500;
  const clawReach = Math.sin(frame * 0.14) * 35 + 75;

  return (
    <svg
      viewBox="0 0 1080 1920"
      style={{
        width: "100%",
        height: "100%",
        position: "absolute",
        top: 0,
        left: 0,
        pointerEvents: "none",
      }}
    >
      <defs>
        <linearGradient id="skin-light2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FBD5B5" />
          <stop offset="100%" stopColor="#E4A882" />
        </linearGradient>
        <linearGradient id="skin-old" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#D9C2B0" />
          <stop offset="100%" stopColor="#A88E7D" />
        </linearGradient>
        <linearGradient id="hoodie-grad2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3E4C3D" />
          <stop offset="100%" stopColor="#222B21" />
        </linearGradient>
        <linearGradient id="hair-grey" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#B4BCC6" />
          <stop offset="100%" stopColor="#5A626D" />
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
        <linearGradient id="beam-grad" gradientUnits="userSpaceOnUse" x1="540" y1="1600" x2="540" y2="540">
          <stop offset="0%" stopColor="#FFF8E1" stopOpacity="0.85" />
          <stop offset="60%" stopColor="#FFEAA7" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#FFEAA7" stopOpacity="0.04" />
        </linearGradient>
        <radialGradient id="face-key" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFEAA7" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#FFEAA7" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="redDanger" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#EF4444" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#7F1D1D" stopOpacity="0.0" />
        </radialGradient>
        <filter id="claw-shadow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="10" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        <filter id="beam-soft" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="16" />
        </filter>
        <filter id="fog-blur" x="-50%" y="-100%" width="200%" height="300%">
          <feGaussianBlur stdDeviation="38" />
        </filter>
        <filter id="mote-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.2" />
        </filter>
      </defs>

      {/* ======================================================== */}
      {/* SCENE 1: BARRICADE PUSH (0.0s - 9.9s)                    */}
      {/* Kitchen Door & Table Barricade, Young & Old Artem        */}
      {/* ======================================================== */}
      {pose === "barricade_push" && (
        <g id="scene-barricade">
          {/* Heavy Wooden Entrance Door on Left */}
          <g transform="translate(60, 480)">
            <rect x="0" y="0" width="220" height="1200" fill="#0C0A09" stroke="#1C1917" strokeWidth="8" />
            {/* Panels & Door Crossbars */}
            <rect x="25" y="40" width="170" height="260" fill="#1C1917" stroke="#000" strokeWidth="4" />
            <rect x="25" y="340" width="170" height="340" fill="#1C1917" stroke="#000" strokeWidth="4" />
            <rect x="25" y="720" width="170" height="420" fill="#1C1917" stroke="#000" strokeWidth="4" />
            {/* Heavy Brass Lock & Latch */}
            <rect x="180" y="520" width="28" height="45" rx="4" fill="#CA8A04" stroke="#000" strokeWidth="3" />
            <circle cx="194" cy="542" r="6" fill="#000" />
            {/* Shaking cracks from outside hits */}
            <path d="M 120 420 L 150 490 L 130 560" stroke="#EF4444" strokeWidth="3" fill="none" opacity={Math.abs(Math.sin(frame * 0.6))} />
            <path d="M 80 500 L 110 530 L 95 610" stroke="#F59E0B" strokeWidth="2.5" fill="none" opacity={Math.abs(Math.sin(frame * 0.6))} />
          </g>

          {/* Heavy Wooden Table Barricaded Against Door */}
          <g transform="translate(180, 1080)">
            {/* Table Shadow */}
            <ellipse cx="260" cy="580" rx="320" ry="40" fill="#000" opacity="0.7" filter="url(#fog-blur)" />
            {/* Thick Wooden Tabletop */}
            <polygon points="0,80 480,40 520,120 40,160" fill="#291A10" stroke="#120A04" strokeWidth="6" />
            <polygon points="40,160 520,120 520,150 40,190" fill="#1A1008" stroke="#120A04" strokeWidth="4" />
            {/* Massive Wooden Legs */}
            <rect x="30" y="160" width="45" height="420" fill="#1E1208" stroke="#000" strokeWidth="4" />
            <rect x="440" y="120" width="45" height="460" fill="#180E06" stroke="#000" strokeWidth="4" />
            {/* Diagonal Strut Bracing Door */}
            <line x1="40" y1="170" x2="-80" y2="40" stroke="#3D2412" strokeWidth="22" strokeLinecap="round" />
          </g>

          {/* Young Artem (Olive Hoodie) Braced & Pushing (From Behind, Part 2 style) */}
          <g transform={`translate(${460 + breath * 0.5}, ${940 + breath}) rotate(-6)`}>
            {/* Legs Braced on Floor */}
            <line x1="80" y1="520" x2="160" y2="780" stroke="#0F172A" strokeWidth="52" strokeLinecap="round" />
            <line x1="20" y1="520" x2="-60" y2="760" stroke="#1E293B" strokeWidth="54" strokeLinecap="round" />
            {/* Shoes */}
            <ellipse cx="180" cy="800" rx="42" ry="18" fill="#000" />
            <ellipse cx="-80" cy="780" rx="44" ry="18" fill="#000" />

            {/* Torso in Olive Hoodie (Part 2 gradient) */}
            <path
              d="M -30 220 L 160 200 L 150 540 L -20 540 Z"
              fill="url(#hoodie-grad2)"
              stroke="#000"
              strokeWidth="6"
            />
            {/* Arms Extended Straining Against Table */}
            <line x1="0" y1="280" x2="-140" y2="240" stroke="url(#hoodie-grad2)" strokeWidth="44" strokeLinecap="round" />
            <ellipse cx="-150" cy="240" rx="22" ry="18" fill="url(#skin-light2)" stroke="#000" strokeWidth="3" />
            <line x1="120" y1="270" x2="-100" y2="210" stroke="url(#hoodie-grad2)" strokeWidth="40" strokeLinecap="round" />

            {/* Head (Young Hair Back, Part 2 component) */}
            <g transform="translate(-480, -1440)">
              <YoungHairBack />
            </g>
          </g>

          {/* Old Artem (Navy Jacket, Grey Hair) Pushing Table */}
          <g transform={`translate(${720 + breath * 0.3}, ${880 + breath * 0.8}) rotate(-4)`}>
            {/* Coat */}
            <path d="M 0 240 L 180 230 L 170 600 L -20 600 Z" fill="#1E293B" stroke="#0F172A" strokeWidth="6" />
            {/* Arm Pushing Table */}
            <line x1="30" y1="300" x2="-120" y2="280" stroke="#1E293B" strokeWidth="40" strokeLinecap="round" />
            <ellipse cx="-130" cy="280" rx="20" ry="16" fill="url(#skin-old)" stroke="#000" strokeWidth="3" />
            {/* Head Profile with OldHair */}
            <ellipse cx="80" cy="140" rx="75" ry="95" fill="url(#skin-old)" stroke="#000" strokeWidth="5" />
            <path d="M 20 120 Q 80 50 140 120 Q 120 75 80 80 Q 40 75 20 120 Z" fill="url(#hair-grey)" />
            {/* Grey Beard Profile */}
            <path d="M 30 150 Q 10 210 60 210 Q 70 180 60 150 Z" fill="url(#hair-grey)" />
          </g>

          {/* Low Fog & Atmospheric Dust */}
          <LowFog frame={frame} y={1500} height={250} color="#64748B" opacity={0.25} seed="fog-p3" />
          <AmbientDust frame={frame} count={35} color="#E2E8F0" seed="dust-p3" />
        </g>
      )}

      {/* ======================================================== */}
      {/* SCENE 2: OLD ARTEM CLOSE-UP WHISPER (9.9s - 23.0s)       */}
      {/* Recreating Scene 2 of Part 2 with Moonlight & Flashlight */}
      {/* ======================================================== */}
      {pose === "old_artem_whisper" && (
        <g id="scene-whisper">
          {/* Subtle dark backdrop with moonlight rim */}
          <rect width="1080" height="1920" fill="#07090E" opacity="0.65" />

          {/* Volumetric Flashlight Beam from Bottom-Left */}
          <g transform={`rotate(${Math.sin(frame * 0.05) * 2}, 200, 1800)`} opacity={flash}>
            <polygon points="200,1800 380,400 900,450" fill="url(#beam-grad)" opacity="0.22" filter="url(#beam-soft)" />
            <DustMotes frame={frame} apexX={200} apexY={1800} length={1300} spread={360} count={50} intensity={flash} seed="whisper-motes" />
          </g>

          {/* Old Artem Full Close-Up Face (Anatomy from Part 2) */}
          <g transform={`translate(80, ${220 + breath * 0.4})`}>
            {/* Shoulders & Dark Coat */}
            <path d="M 180 1120 Q 460 1060 740 1120 L 780 1650 L 140 1650 Z" fill="#1A1F2C" stroke="#000" strokeWidth="6" />
            <rect x="400" y="940" width="120" height="190" fill="url(#skin-old)" />
            <line x1="430" y1="1010" x2="490" y2="1010" stroke="#7A6557" strokeWidth="4" />

            {/* Ears */}
            <ellipse cx="270" cy="770" rx="26" ry="44" fill="url(#skin-old)" stroke="#000" strokeWidth="5" />
            <ellipse cx="650" cy="770" rx="26" ry="44" fill="url(#skin-old)" stroke="#000" strokeWidth="5" />

            {/* Head Contour */}
            <ellipse cx="460" cy="750" rx="190" ry="240" fill="url(#skin-old)" stroke="#000" strokeWidth="7" />

            {/* Old Artem Hair (Part 2 Component) */}
            <g transform="translate(-40, 10)">
              <OldHair />
            </g>

            {/* Forehead Wrinkles & Eyebrows */}
            <path d="M 370 638 Q 460 620 550 638" stroke="#7A6557" strokeWidth="5" fill="none" strokeLinecap="round" />
            <path d="M 385 665 Q 460 648 535 665" stroke="#7A6557" strokeWidth="4" fill="none" strokeLinecap="round" />

            {/* Left Eye */}
            <circle cx="370" cy="730" r="38" fill="#E8DDD6" stroke="#000" strokeWidth="4" />
            <circle cx="370" cy="730" r="14" fill="#2C241D" />
            <circle cx="364" cy="724" r="5" fill="#FFF" opacity={0.6 + flash * 0.4} />
            <path d="M 330 770 Q 370 790 410 770" stroke="#7A6557" strokeWidth="4" fill="none" />

            {/* Right Eye */}
            <circle cx="550" cy="730" r="38" fill="#E8DDD6" stroke="#000" strokeWidth="4" />
            <circle cx="550" cy="730" r="14" fill="#2C241D" />
            <circle cx="544" cy="724" r="5" fill="#FFF" opacity={0.6 + flash * 0.4} />
            <path d="M 510 770 Q 550 790 590 770" stroke="#7A6557" strokeWidth="4" fill="none" />

            {/* Nose & Shadow */}
            <path d="M 460 720 L 445 800 L 475 800" stroke="#7A6557" strokeWidth="4" fill="none" strokeLinecap="round" />

            {/* Whispering Mouth (Subtly Animated) */}
            <path
              d={`M 400 860 Q 460 ${880 + Math.sin(frame * 0.4) * 6} 520 860`}
              stroke="#4A1E20"
              strokeWidth="6"
              fill="none"
              strokeLinecap="round"
            />

            {/* Face Key Light Shading */}
            <ellipse cx="460" cy="790" rx="260" ry="320" fill="url(#face-key)" opacity={flash * 0.8} style={{ mixBlendMode: "screen" }} />
          </g>

          <LowFog frame={frame} y={1520} height={360} color="#6B7280" opacity={0.3} seed="fog-whisper" />
        </g>
      )}

      {/* ======================================================== */}
      {/* SCENE 3: GLASS SHATTERS + DEMONIC HAND (23.0s - 31.0s)   */}
      {/* Transom Breaks, Black Claw Stretches Toward Latch        */}
      {/* ======================================================== */}
      {pose === "glass_shatter_hand" && (
        <g id="scene-shatter">
          {/* Flashing Red Danger Alert */}
          <rect width="1080" height="1920" fill="#000" opacity={0.35} />

          {/* Door Top Transom Window */}
          <g transform="translate(180, 160)">
            <rect x="0" y="0" width="460" height="240" fill="#030712" stroke="#1E293B" strokeWidth="8" />

            {/* Falling Exploding Glass Shards (Physics + Rotation) */}
            {Array.from({ length: 18 }).map((_, i) => {
              const ang = random(`shard-a-${i}`) * Math.PI * 2;
              const spd = 6 + random(`shard-v-${i}`) * 14;
              const x = 230 + Math.cos(ang) * spd * (glassFall / 25);
              const y = 120 + Math.sin(ang) * spd * (glassFall / 25) + 0.5 * (glassFall * 0.4) ** 2;
              const rot = (frame * (i % 2 === 0 ? 8 : -10)) % 360;
              if (y > 1800) return null;
              return (
                <polygon
                  key={i}
                  points="0,0 24,8 10,32"
                  fill="#93C5FD"
                  opacity="0.75"
                  stroke="#E0F2FE"
                  strokeWidth="2"
                  transform={`translate(${x}, ${y}) rotate(${rot})`}
                />
              );
            })}

            {/* Broken Transom Glass Teeth */}
            <polygon points="0,0 60,60 120,20 180,75 250,15 320,65 390,20 460,50 460,0" fill="#38BDF8" opacity="0.35" stroke="#BAE6FD" strokeWidth="3" />
          </g>

          {/* Demonic Black Claw Stretching Down from Broken Transom */}
          <g filter="url(#claw-shadow)" transform={`translate(360, ${120 + clawReach})`}>
            {/* Long Sinister Forearm */}
            <path
              d="M 50 -120 Q 30 60 65 240 Q 80 400 45 540"
              stroke="#020408"
              strokeWidth="62"
              fill="none"
              strokeLinecap="round"
            />
            {/* Sinister Shadow Tendrils */}
            <path d="M 20 140 Q -30 200 10 280" stroke="#000" strokeWidth="16" fill="none" opacity="0.8" />
            <path d="M 70 300 Q 120 360 75 440" stroke="#000" strokeWidth="14" fill="none" opacity="0.8" />

            {/* Hand with Long Twisted Talons */}
            <g transform="translate(45, 540)">
              <ellipse cx="0" cy="0" rx="38" ry="46" fill="#010204" />
              {/* Claws */}
              <path d="M -28 30 Q -48 130 -32 185" stroke="#010204" strokeWidth="18" strokeLinecap="round" />
              <path d="M -10 38 Q -12 150 4 210" stroke="#010204" strokeWidth="20" strokeLinecap="round" />
              <path d="M 14 36 Q 26 145 38 198" stroke="#010204" strokeWidth="19" strokeLinecap="round" />
              <path d="M 32 26 Q 54 120 66 162" stroke="#010204" strokeWidth="16" strokeLinecap="round" />
              {/* Sharp Bleached Bone Tips */}
              <polygon points="-32,185 -40,205 -26,190" fill="#F8FAFC" />
              <polygon points="4,210 -4,232 12,214" fill="#F8FAFC" />
              <polygon points="38,198 32,220 48,202" fill="#F8FAFC" />
              <polygon points="66,162 62,182 74,166" fill="#F8FAFC" />
            </g>
          </g>

          {/* Young Artem in Pure Terror (Foreground Bottom Right, from Part 2 Scene 3) */}
          <g transform={`translate(${480 + tremorX}, ${1050 + tremorY}) rotate(8)`}>
            <ellipse cx="300" cy="950" rx="20" ry="32" fill="url(#skin-light2)" stroke="#000" strokeWidth="4" />
            <ellipse cx="580" cy="950" rx="20" ry="32" fill="url(#skin-light2)" stroke="#000" strokeWidth="4" />
            <ellipse cx="440" cy="940" rx="140" ry="170" fill="url(#skin-light2)" stroke="#000" strokeWidth="6" />
            {/* Young Hair with Panic Mode */}
            <YoungHairFront cx={440} cy={940} panic />
            {/* Terrified Wide Eyes with Small Dilated Pupils */}
            <circle cx="390" cy="920" r="32" fill="#FFF" stroke="#000" strokeWidth="4" />
            <circle cx="390" cy="920" r="12" fill="#111" />
            <circle cx="490" cy="920" r="32" fill="#FFF" stroke="#000" strokeWidth="4" />
            <circle cx="490" cy="920" r="12" fill="#111" />
            {/* Screaming Open Mouth */}
            <ellipse cx="440" cy="1020" rx="34" ry="46" fill="#3D0B14" stroke="#FFF" strokeWidth="4" />
          </g>
        </g>
      )}

      {/* ======================================================== */}
      {/* SCENE 4: INTERACTIVE CHOICE DILEMMA (31.0s - 45.46s)     */}
      {/* Signature Choice Cards A vs B on top of the Kitchen      */}
      {/* ======================================================== */}
      {pose === "choice_dilemma" && (
        <g id="scene-choice">
          {/* Subtle Darkening Overlay to Make Cards Pop */}
          <rect width="1080" height="1920" fill="rgba(3, 7, 18, 0.45)" />

          {/* Pulsing Red Danger Core */}
          <circle cx="540" cy="1380" r="450" fill="url(#redDanger)" />

          {/* CARD A: ХВАТАТЬ ТЕСАК (Option A - Meat Cleaver) */}
          <g transform="translate(140, 520)">
            {/* Card Body */}
            <rect
              x="0"
              y="0"
              width="380"
              height="480"
              rx="28"
              fill="#0F172A"
              stroke="#EF4444"
              strokeWidth="7"
              filter="drop-shadow(0 0 35px rgba(239, 68, 68, 0.7))"
            />
            {/* Badge Header */}
            <rect x="30" y="30" width="320" height="60" rx="16" fill="#DC2626" />
            <text x="190" y="72" textAnchor="middle" fill="#FFFFFF" fontSize="34" fontWeight="900" letterSpacing="2px">
              ВАРИАНТ А
            </text>

            {/* Heavy Meat Cleaver Graphic */}
            <g transform="translate(190, 240) rotate(-22)">
              {/* Steel Blade with Blood Glint */}
              <polygon points="-80,-60 80,-60 100,60 -80,60" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="4" />
              <line x1="-80" y1="58" x2="98" y2="58" stroke="#FFFFFF" strokeWidth="5" />
              {/* Wooden Handle with Brass Rivets */}
              <rect x="-170" y="-18" width="95" height="34" rx="6" fill="#78350F" stroke="#451A03" strokeWidth="3" />
              <circle cx="-135" cy="-1" r="4" fill="#CA8A04" />
              <circle cx="-100" cy="-1" r="4" fill="#CA8A04" />
            </g>

            {/* Description Text */}
            <text x="190" y="380" textAnchor="middle" fill="#FFFFFF" fontSize="32" fontWeight="900">
              ХВАТАТЬ ТЕСАК
            </text>
            <text x="190" y="425" textAnchor="middle" fill="#F87171" fontSize="24" fontWeight="700">
              Рубить по когтям
            </text>
          </g>

          {/* CARD B: ПРЫГАТЬ НА КАРНИЗ (Option B - 5th Floor Window) */}
          <g transform="translate(560, 520)">
            {/* Card Body */}
            <rect
              x="0"
              y="0"
              width="380"
              height="480"
              rx="28"
              fill="#0F172A"
              stroke="#38BDF8"
              strokeWidth="7"
              filter="drop-shadow(0 0 35px rgba(56, 189, 248, 0.7))"
            />
            {/* Badge Header */}
            <rect x="30" y="30" width="320" height="60" rx="16" fill="#0284C7" />
            <text x="190" y="72" textAnchor="middle" fill="#FFFFFF" fontSize="34" fontWeight="900" letterSpacing="2px">
              ВАРИАНТ Б
            </text>

            {/* Open Night Window Graphic */}
            <g transform="translate(190, 240)">
              {/* Outer Window Frame */}
              <rect x="-70" y="-80" width="140" height="150" fill="#020617" stroke="#64748B" strokeWidth="6" />
              {/* Moon outside */}
              <circle cx="35" cy="-45" r="20" fill="#F8FAFC" opacity="0.9" />
              {/* Narrow Stone Ledge */}
              <rect x="-90" y="70" width="180" height="24" rx="3" fill="#334155" stroke="#1E293B" strokeWidth="2" />
              {/* Danger Label */}
              <text x="0" y="10" textAnchor="middle" fill="#EF4444" fontSize="22" fontWeight="900">
                5 ЭТАЖ
              </text>
            </g>

            {/* Description Text */}
            <text x="190" y="380" textAnchor="middle" fill="#FFFFFF" fontSize="32" fontWeight="900">
              ЛЕЗТЬ В ОКНО
            </text>
            <text x="190" y="425" textAnchor="middle" fill="#7DD3FC" fontSize="24" fontWeight="700">
              Карниз в темноте
            </text>
          </g>

          {/* Bottom Countdown Action Banner */}
          <g transform="translate(140, 1060)">
            <rect x="0" y="0" width="800" height="100" rx="30" fill="#FACC15" stroke="#FFFFFF" strokeWidth="5" filter="drop-shadow(0 0 40px rgba(250, 204, 21, 0.9))" />
            <text x="400" y="64" textAnchor="middle" fill="#000000" fontSize="36" fontWeight="900" letterSpacing="1.5px">
              🗳️ ПИШИ В КОММЕНТАХ: А ИЛИ Б!
            </text>
          </g>
        </g>
      )}
    </svg>
  );
};
