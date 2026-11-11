import React from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import {
  YoungHairFront,
  YoungHairBack,
  DustMotes,
  AmbientDust,
  LowFog,
  flashIntensity,
} from "./HumanPart2";

export type Part4Pose =
  | "cleaver_strike"
  | "monster_grab"
  | "cut_coat_window"
  | "ledge_precipice"
  | "choice_jump_crawl";

interface Part4Props {
  pose: Part4Pose;
}

export const HumanPart4: React.FC<Part4Props> = ({ pose }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const curSec = frame / fps;
  const flash = flashIntensity(frame);

  // Organic micro-motions
  const breath = Math.sin(frame * 0.16) * 6;
  const tremor = Math.sin(frame * 1.3) * 5;
  const clawTwitch = Math.sin(frame * 0.25) * 8;
  const rainStreak = (frame * 28) % 1920;

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
        <linearGradient id="skin-shadow" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#D98A60" />
          <stop offset="100%" stopColor="#9C5232" />
        </linearGradient>
        <linearGradient id="hoodie-grad2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3E4C3D" />
          <stop offset="100%" stopColor="#222B21" />
        </linearGradient>
        <linearGradient id="hair-young" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#3B2B1F" />
          <stop offset="55%" stopColor="#21160F" />
          <stop offset="100%" stopColor="#140D08" />
        </linearGradient>
        <linearGradient id="monster-flesh" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1E242B" />
          <stop offset="50%" stopColor="#0F1318" />
          <stop offset="100%" stopColor="#050709" />
        </linearGradient>
        <linearGradient id="cleaver-steel" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="35%" stopColor="#CBD5E1" />
          <stop offset="70%" stopColor="#64748B" />
          <stop offset="100%" stopColor="#1E293B" />
        </linearGradient>
      </defs>

      {/* ========================================================================= */}
      {/* 1. CLEAVER STRIKE (0.0s - 13.5s)                                         */}
      {/* Artem seen from back/shoulder hacking down with heavy meat cleaver        */}
      {/* ========================================================================= */}
      {pose === "cleaver_strike" && (
        <g id="scene-cleaver">
          {/* Monster claws reaching over the window sill */}
          <g transform={`translate(540, 720)`}>
            {/* 4 segmented blackened fingers with razor ivory tips */}
            <g transform="translate(-100, 0)">
              <path d="M -30 -40 Q -40 60 -25 110" stroke="#05070A" strokeWidth="20" strokeLinecap="round" />
              <polygon points="-25,110 -35,130 -18,118" fill="#F8FAFC" />
            </g>
            <g transform="translate(-50, -10)">
              <path d="M -10 -50 Q -15 70 5 125" stroke="#05070A" strokeWidth="22" strokeLinecap="round" />
              <polygon points="5,125 -5,145 12,130" fill="#F8FAFC" />
            </g>
            <g transform="translate(10, -5)">
              <path d="M 10 -45 Q 25 65 35 115" stroke="#05070A" strokeWidth="22" strokeLinecap="round" />
              <polygon points="35,115 30,135 45,120" fill="#F8FAFC" />
            </g>
            <g transform="translate(60, 5)">
              <path d="M 30 -30 Q 50 50 60 95" stroke="#05070A" strokeWidth="18" strokeLinecap="round" />
              <polygon points="60,95 56,115 70,100" fill="#F8FAFC" />
            </g>
          </g>

          {/* Slashed black ooze splattering upon contact (sec > 5) */}
          {curSec >= 5.0 && (
            <g transform="translate(540, 760)">
              <circle cx="-20" cy="30" r="14" fill="#000" />
              <circle cx="15" cy="50" r="18" fill="#030712" />
              <circle cx="50" cy="20" r="12" fill="#000" />
              <path d="M -40 20 Q 20 90 70 40 Q 30 -10 -40 20 Z" fill="#000" opacity="0.85" />
            </g>
          )}

          {/* Young Artem Back View (canonical 1:1 geometry from Part 2 & Part 3) */}
          <g transform={`translate(0, ${180 + tremor})`}>
            {/* Dark green hoodie back */}
            <path
              d="M 320 1700 L 760 1700 L 780 1920 L 300 1920 Z"
              fill="url(#hoodie-grad2)"
              stroke="#000"
              strokeWidth="6"
            />
            {/* 100% Exact Canonical YoungHairBack from Part 2 */}
            <YoungHairBack />

            {/* Raised right arm with cleaver swinging diagonally */}
            <g transform={`translate(${620 + tremor}, 1450) rotate(${interpolate(curSec, [0, 4.5, 5.5, 13.5], [-20, -45, 25, 15], { extrapolateRight: "clamp" })})`}>
              {/* Forearm */}
              <path d="M 0 0 L 140 -80 L 170 -40 L 30 40 Z" fill="url(#hoodie-grad2)" stroke="#000" strokeWidth="5" />
              {/* Fist */}
              <circle cx="170" cy="-60" r="38" fill="url(#skin-light2)" stroke="#000" strokeWidth="4" />
              {/* Meat Cleaver */}
              <g transform="translate(170, -60) rotate(-35)">
                {/* Wood handle */}
                <rect x="-15" y="-12" width="75" height="24" rx="6" fill="#451A03" stroke="#000" strokeWidth="3" />
                {/* Massive steel blade */}
                <path
                  d="M 60 -45 L 200 -50 L 210 65 L 60 50 Z"
                  fill="url(#cleaver-steel)"
                  stroke="#CBD5E1"
                  strokeWidth="3"
                />
                {/* Hole in blade corner */}
                <circle cx="85" cy="-25" r="7" fill="#1E293B" />
                {/* Black ichor drip on blade edge */}
                {curSec >= 5.0 && (
                  <path d="M 180 -48 L 210 65 L 195 60 L 170 -40 Z" fill="#000" />
                )}
              </g>
            </g>
          </g>
        </g>
      )}

      {/* ========================================================================= */}
      {/* 2. MONSTER GRAB & TWIN FACE (13.5s - 27.5s)                              */}
      {/* Artem Face terrified (canonical 440, 940 setup) + Twin Monster face       */}
      {/* ========================================================================= */}
      {pose === "monster_grab" && (
        <g id="scene-monster-grab">
          {/* Evil Twin Silhouette grinning in the broken window at top right */}
          <g transform={`translate(240, -180)`}>
            <ellipse cx="440" cy="940" rx="140" ry="170" fill="#05070B" stroke="#000" strokeWidth="6" />
            <YoungHairFront cx={440} cy={940} panic />
            {/* Glowing Red Eyes of the Doppelganger */}
            <circle cx="390" cy="920" r="28" fill="#7F1D1D" />
            <circle cx="390" cy="920" r="14" fill="#EF4444" />
            <circle cx="390" cy="920" r="4" fill="#FFF" />
            <circle cx="490" cy="920" r="28" fill="#7F1D1D" />
            <circle cx="490" cy="920" r="14" fill="#EF4444" />
            <circle cx="490" cy="920" r="4" fill="#FFF" />
            {/* Ghoulish Wide Grin */}
            <path d="M 370 1010 Q 440 1060 510 1010 Q 440 1080 370 1010 Z" fill="#000" stroke="#DC2626" strokeWidth="3" />
          </g>

          {/* Severed monster stump claw grabbing Artem's hoodie collar */}
          <g transform="translate(680, 1180)">
            <path d="M 180 -120 Q 40 -40 -60 20 Q -40 70 80 20 Z" fill="url(#monster-flesh)" stroke="#000" strokeWidth="5" />
            {/* Black severed fingers oozing */}
            <circle cx="-60" cy="20" r="18" fill="#000" />
            <circle cx="-40" cy="50" r="15" fill="#030712" />
          </g>

          {/* Young Artem in Absolute Terror (Foreground canonical 1:1) */}
          <g transform={`translate(${80 + tremor}, ${320 + breath})`}>
            {/* Ears */}
            <ellipse cx="300" cy="950" rx="20" ry="32" fill="url(#skin-light2)" stroke="#000" strokeWidth="4" />
            <ellipse cx="580" cy="950" rx="20" ry="32" fill="url(#skin-light2)" stroke="#000" strokeWidth="4" />
            {/* Head */}
            <ellipse cx="440" cy="940" rx="140" ry="170" fill="url(#skin-light2)" stroke="#000" strokeWidth="6" />
            {/* 100% Canonical YoungHairFront centered perfectly at cx=440, cy=940 */}
            <YoungHairFront cx={440} cy={940} panic />

            {/* Terror Eyes */}
            <circle cx="390" cy="920" r="32" fill="#FFF" stroke="#000" strokeWidth="4" />
            <circle cx="390" cy="920" r="12" fill="#111" />
            <circle cx="490" cy="920" r="32" fill="#FFF" stroke="#000" strokeWidth="4" />
            <circle cx="490" cy="920" r="12" fill="#111" />
            {/* Screaming Open Mouth */}
            <ellipse cx="440" cy="1025" rx="36" ry="50" fill="#3D0B14" stroke="#FFF" strokeWidth="4" />

            {/* Hoodie shoulders pulled right */}
            <path
              d="M 220 1100 L 660 1100 L 720 1500 L 160 1500 Z"
              fill="url(#hoodie-grad2)"
              stroke="#000"
              strokeWidth="6"
            />
          </g>
        </g>
      )}

      {/* ========================================================================= */}
      {/* 3. CUT COAT & DIVE OUT WINDOW (27.5s - 39.0s)                             */}
      {/* Artem slicing collar and diving out, shards of glass scattering           */}
      {/* ========================================================================= */}
      {pose === "cut_coat_window" && (
        <g id="scene-cut-window">
          {/* Flying torn hoodie cloth */}
          <g transform="translate(620, 950)">
            <path d="M 0 0 L 80 -40 L 120 20 L 40 50 Z" fill="#222B21" stroke="#000" strokeWidth="3" />
            <path d="M -30 60 L 30 40 L 50 110 L -10 120 Z" fill="#3E4C3D" stroke="#000" strokeWidth="3" />
          </g>

          {/* Artem Diving Headfirst Through Window (profile angled) */}
          <g transform={`translate(${140 + tremor}, 260) rotate(18)`}>
            {/* Torso */}
            <path d="M 280 980 L 600 980 L 620 1350 L 260 1350 Z" fill="url(#hoodie-grad2)" stroke="#000" strokeWidth="6" />
            {/* Head */}
            <ellipse cx="440" cy="900" rx="130" ry="160" fill="url(#skin-light2)" stroke="#000" strokeWidth="6" />
            {/* Canonical Hair perfectly aligned at cx=440, cy=900 */}
            <YoungHairFront cx={440} cy={900} panic />
            {/* Determined / shock eyes */}
            <circle cx="480" cy="890" r="28" fill="#FFF" stroke="#000" strokeWidth="4" />
            <circle cx="488" cy="890" r="10" fill="#000" />
            {/* Clenched teeth */}
            <path d="M 460 970 Q 490 980 520 970" stroke="#000" strokeWidth="6" fill="none" />

            {/* Hand clutching cleaver cut forward */}
            <g transform="translate(560, 980)">
              <circle cx="0" cy="0" r="30" fill="url(#skin-light2)" stroke="#000" strokeWidth="4" />
              <rect x="10" y="-10" width="55" height="20" rx="5" fill="#451A03" stroke="#000" strokeWidth="3" />
              <path d="M 65 -35 L 165 -40 L 175 45 L 65 35 Z" fill="url(#cleaver-steel)" stroke="#CBD5E1" strokeWidth="3" />
            </g>
          </g>

          {/* Shattered glass particles bursting */}
          {Array.from({ length: 18 }).map((_, i) => {
            const gx = 480 + (i * 41) % 420;
            const gy = 500 + ((frame * 24 + i * 55) % 680);
            return (
              <polygon
                key={`p4-glass-${i}`}
                points={`${gx},${gy} ${gx + 16},${gy - 24} ${gx + 32},${gy + 8}`}
                fill="#94A3B8"
                opacity="0.8"
              />
            );
          })}
        </g>
      )}

      {/* ========================================================================= */}
      {/* 4 & 5. NARROW TIN LEDGE & THE FINAL CLIFFHANGER (39.0s - 59.5s)           */}
      {/* 5th floor brick wall, rain, vertigo abyss, monster looming above          */}
      {/* ========================================================================= */}
      {(pose === "ledge_precipice" || pose === "choice_jump_crawl") && (
        <g id="scene-ledge">
          {/* Heavy Night Rain Lines */}
          <g opacity="0.45" stroke="#93C5FD" strokeWidth="2.5">
            {Array.from({ length: 35 }).map((_, r) => {
              const rx = (r * 32 + (frame * 15) % 90) % 1080;
              const ry = (r * 58 + frame * 40) % 1920;
              return <line key={`r-${r}`} x1={rx} y1={ry} x2={rx - 18} y2={ry + 55} />;
            })}
          </g>

          {/* Narrow 5th floor tin ledge (cornice) */}
          <rect x="0" y="1280" width="1080" height="60" fill="#334155" stroke="#0F172A" strokeWidth="6" />
          <line x1="0" y1="1285" x2="1080" y2="1285" stroke="#94A3B8" strokeWidth="3" opacity="0.65" />

          {/* Abyss / Vertigo drop down below */}
          <rect x="0" y="1340" width="1080" height="580" fill="#020408" />
          {/* Distant wet courtyard pavement with streetlamp puddle */}
          <ellipse cx="280" cy="1820" rx="90" ry="25" fill="#EAB308" opacity="0.15" />
          <circle cx="280" cy="1820" r="6" fill="#FACC15" opacity="0.4" />

          {/* Option A: Branches of the Old Elm reaching from courtyard */}
          <g opacity="0.85">
            <path
              d="M 120 1920 Q 220 1620 280 1450 Q 320 1380 270 1310"
              stroke="#1C1917"
              strokeWidth="32"
              fill="none"
              strokeLinecap="round"
            />
            <path
              d="M 280 1450 Q 180 1390 140 1330"
              stroke="#1C1917"
              strokeWidth="18"
              fill="none"
              strokeLinecap="round"
            />
            <path
              d="M 300 1390 Q 380 1340 430 1320"
              stroke="#1C1917"
              strokeWidth="14"
              fill="none"
              strokeLinecap="round"
            />
          </g>

          {/* Monster bursting out of 5th floor window directly above */}
          <g transform={`translate(${380 + tremor}, 320)`}>
            <ellipse cx="200" cy="180" rx="150" ry="180" fill="#050709" stroke="#000" strokeWidth="6" />
            <YoungHairFront cx={200} cy={180} panic />
            {/* Terrifying predator eyes glaring down at Artem */}
            <circle cx="150" cy="160" r="30" fill="#7F1D1D" />
            <circle cx="150" cy="160" r="15" fill="#EF4444" />
            <circle cx="150" cy="160" r="5" fill="#FFF" />
            <circle cx="250" cy="160" r="30" fill="#7F1D1D" />
            <circle cx="250" cy="160" r="15" fill="#EF4444" />
            <circle cx="250" cy="160" r="5" fill="#FFF" />
            {/* Giant severed black arm hanging down toward Artem */}
            <path d="M 120 280 Q 100 460 130 540" stroke="#050709" strokeWidth="36" strokeLinecap="round" />
          </g>

          {/* Artem shivering on the narrow ledge, back to wall (canonical geometry) */}
          <g transform={`translate(${160 + tremor}, ${460 + breath})`}>
            {/* Ears */}
            <ellipse cx="300" cy="950" rx="20" ry="32" fill="url(#skin-light2)" stroke="#000" strokeWidth="4" />
            <ellipse cx="580" cy="950" rx="20" ry="32" fill="url(#skin-light2)" stroke="#000" strokeWidth="4" />
            {/* Head */}
            <ellipse cx="440" cy="940" rx="140" ry="170" fill="url(#skin-light2)" stroke="#000" strokeWidth="6" />
            {/* Canonical Hair perfectly attached to skull */}
            <YoungHairFront cx={440} cy={940} panic />

            {/* Vertigo eyes looking down at abyss */}
            <circle cx="390" cy="930" r="30" fill="#FFF" stroke="#000" strokeWidth="4" />
            <circle cx="390" cy="942" r="12" fill="#111" />
            <circle cx="490" cy="930" r="30" fill="#FFF" stroke="#000" strokeWidth="4" />
            <circle cx="490" cy="942" r="12" fill="#111" />
            {/* Trembling mouth */}
            <path d="M 400 1020 Q 440 1005 480 1020" stroke="#000" strokeWidth="6" fill="none" />

            {/* Torn green hoodie */}
            <path d="M 260 1100 L 620 1100 L 640 1380 L 240 1380 Z" fill="url(#hoodie-grad2)" stroke="#000" strokeWidth="6" />

            {/* Left hand gripping the brick wall */}
            <circle cx="230" cy="1120" r="34" fill="url(#skin-light2)" stroke="#000" strokeWidth="4" />
            {/* Right hand clutching cleaver */}
            <g transform="translate(630, 1160)">
              <circle cx="0" cy="0" r="34" fill="url(#skin-light2)" stroke="#000" strokeWidth="4" />
              <rect x="10" y="-12" width="60" height="24" rx="6" fill="#451A03" stroke="#000" strokeWidth="3" />
              <path d="M 70 -35 L 160 -40 L 170 45 L 70 35 Z" fill="url(#cleaver-steel)" stroke="#CBD5E1" strokeWidth="3" />
            </g>
          </g>
        </g>
      )}

      {/* Atmospheric Fog & Dark Dust */}
      <DustMotes count={25} />
      <LowFog />
    </svg>
  );
};
