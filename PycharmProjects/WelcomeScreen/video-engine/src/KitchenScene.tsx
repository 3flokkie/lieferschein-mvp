import React from "react";
import { interpolate, useCurrentFrame } from "remotion";

export interface KitchenSceneProps {
  highlightKnife?: boolean;
  highlightWindow?: boolean;
}

export const KitchenScene: React.FC<KitchenSceneProps> = ({
  highlightKnife = false,
  highlightWindow = false,
}) => {
  const frame = useCurrentFrame();

  // Gentle subtle environmental animations
  const moonGlow = 0.85 + Math.sin(frame * 0.04) * 0.15;
  const dripY = (frame * 5) % 120;
  const dripOpacity = dripY < 110 ? 0.8 : 0;
  const curtainSway = Math.sin(frame * 0.03) * 6;
  const fridgeLedPulse = 0.7 + Math.sin(frame * 0.08) * 0.3;

  return (
    <svg
      viewBox="0 0 1080 1920"
      style={{
        width: "100%",
        height: "100%",
        position: "absolute",
        top: 0,
        left: 0,
      }}
    >
      <defs>
        {/* Cold Moonlight Gradient */}
        <linearGradient id="moonlightBeam" x1="0%" y1="0%" x2="70%" y2="100%">
          <stop offset="0%" stopColor="#8AC4FF" stopOpacity="0.35" />
          <stop offset="40%" stopColor="#4A7BB0" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#1E2A38" stopOpacity="0.0" />
        </linearGradient>

        {/* Deep Night Wall Gradient */}
        <linearGradient id="kitchenWall" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#0B1017" />
          <stop offset="50%" stopColor="#070A0F" />
          <stop offset="100%" stopColor="#040608" />
        </linearGradient>

        {/* Floor Tiles Gradient */}
        <linearGradient id="floorGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#090E14" />
          <stop offset="50%" stopColor="#05070A" />
          <stop offset="100%" stopColor="#020305" />
        </linearGradient>

        {/* Stainless Steel Fridge Gradient */}
        <linearGradient id="fridgeSteel" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#1C242F" />
          <stop offset="25%" stopColor="#2E3C4E" />
          <stop offset="50%" stopColor="#1E2835" />
          <stop offset="75%" stopColor="#3A4A5F" />
          <stop offset="100%" stopColor="#131B24" />
        </linearGradient>

        {/* Moon Surface Glow Filter */}
        <filter id="moonBlur" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="18" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>

        {/* Window Glow Filter */}
        <radialGradient id="moonDisc" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#F8FAFC" />
          <stop offset="70%" stopColor="#CBD5E1" />
          <stop offset="90%" stopColor="#94A3B8" />
          <stop offset="100%" stopColor="#64748B" />
        </radialGradient>

        {/* Countertop Dark Granite */}
        <linearGradient id="countertopGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#111822" />
          <stop offset="50%" stopColor="#1E2736" />
          <stop offset="100%" stopColor="#0E141C" />
        </linearGradient>

        {/* Cabinet Wood / Dark Slate */}
        <linearGradient id="cabinetGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#151E2A" />
          <stop offset="100%" stopColor="#0B1119" />
        </linearGradient>
      </defs>

      {/* 1. ROOM BACKGROUND WALL */}
      <rect x="0" y="0" width="1080" height="1350" fill="url(#kitchenWall)" />

      {/* Subway Tile Backsplash Grid */}
      <g opacity="0.18" stroke="#334155" strokeWidth="2">
        {Array.from({ length: 9 }).map((_, r) => {
          const y = 820 + r * 50;
          return (
            <React.Fragment key={`row-${r}`}>
              <line x1="0" y1={y} x2="1080" y2={y} />
              {Array.from({ length: 11 }).map((_, c) => {
                const xOffset = (r % 2) * 50;
                const x = c * 100 + xOffset;
                return <line key={`tile-${r}-${c}`} x1={x} y1={y} x2={x} y2={y + 50} />;
              })}
            </React.Fragment>
          );
        })}
      </g>

      {/* 2. LARGE NIGHT WINDOW WITH MOON */}
      {/* Window Outer Sill / Frame */}
      <rect
        x="360"
        y="160"
        width="460"
        height="620"
        rx="8"
        fill="#03060A"
        stroke={highlightWindow ? "#38BDF8" : "#1E293B"}
        strokeWidth={highlightWindow ? 12 : 8}
        filter={highlightWindow ? "drop-shadow(0 0 30px #38BDF8)" : undefined}
      />
      {/* Night Sky Outside */}
      <rect x="375" y="175" width="430" height="590" fill="#020408" />

      {/* Distant Cold Stars */}
      <circle cx="410" cy="220" r="1.5" fill="#E2E8F0" opacity="0.8" />
      <circle cx="580" cy="205" r="2" fill="#E2E8F0" opacity="0.9" />
      <circle cx="720" cy="240" r="1.5" fill="#E2E8F0" opacity="0.7" />
      <circle cx="490" cy="310" r="1.5" fill="#E2E8F0" opacity="0.6" />
      <circle cx="750" cy="380" r="2" fill="#E2E8F0" opacity="0.85" />
      <circle cx="400" cy="450" r="1" fill="#E2E8F0" opacity="0.5" />

      {/* Detailed Glowing Moon */}
      <g filter="url(#moonBlur)" opacity={moonGlow}>
        {/* Moon Outer Halo */}
        <circle cx="640" cy="330" r="85" fill="#93C5FD" opacity="0.22" />
        <circle cx="640" cy="330" r="65" fill="#BFDBFE" opacity="0.4" />
        {/* Moon Body */}
        <circle cx="640" cy="330" r="50" fill="url(#moonDisc)" />
        {/* Moon Craters */}
        <circle cx="625" cy="315" r="9" fill="#94A3B8" opacity="0.45" />
        <circle cx="652" cy="342" r="12" fill="#94A3B8" opacity="0.4" />
        <circle cx="630" cy="350" r="7" fill="#64748B" opacity="0.35" />
        <circle cx="660" cy="318" r="6" fill="#64748B" opacity="0.35" />
      </g>

      {/* Distant Cold Apartment Windows Silhouettes */}
      <rect x="390" y="580" width="80" height="185" fill="#010204" />
      <rect x="405" y="620" width="10" height="14" fill="#FDE047" opacity="0.35" />
      <rect x="440" y="660" width="10" height="14" fill="#60A5FA" opacity="0.25" />
      <rect x="710" y="520" width="95" height="245" fill="#010204" />
      <rect x="730" y="560" width="12" height="16" fill="#F59E0B" opacity="0.3" />

      {/* Window Frame Panes (Cross) */}
      <line x1="590" y1="175" x2="590" y2="765" stroke="#1E293B" strokeWidth="10" />
      <line x1="375" y1="460" x2="805" y2="460" stroke="#1E293B" strokeWidth="10" />

      {/* Swaying Dark Curtain on Left */}
      <path
        d={`M 360 160 Q ${380 + curtainSway} 450 360 765 L 340 765 L 340 160 Z`}
        fill="#0A1017"
        opacity="0.85"
      />

      {/* Volumetric Moonlight Beam Cutting Down Across Kitchen */}
      <polygon
        points="375,175 805,460 1080,1650 120,1720"
        fill="url(#moonlightBeam)"
        style={{ mixBlendMode: "screen" }}
      />

      {/* 3. WALL CABINETS (TOP ROW) */}
      <rect x="40" y="140" width="280" height="520" rx="4" fill="url(#cabinetGrad)" stroke="#1E293B" strokeWidth="4" />
      <line x1="180" y1="140" x2="180" y2="660" stroke="#0B1119" strokeWidth="4" />
      {/* Handles */}
      <rect x="165" y="440" width="6" height="60" rx="3" fill="#64748B" />
      <rect x="189" y="440" width="6" height="60" rx="3" fill="#64748B" />

      {/* Wall Clock (03:12 AM) */}
      <g transform="translate(180, 70)">
        <circle cx="0" cy="0" r="38" fill="#0B1119" stroke="#334155" strokeWidth="5" />
        <circle cx="0" cy="0" r="34" fill="#020408" />
        {/* Clock Marks */}
        <line x1="0" y1="-28" x2="0" y2="-22" stroke="#94A3B8" strokeWidth="2" />
        <line x1="28" y1="0" x2="22" y2="0" stroke="#94A3B8" strokeWidth="2" />
        <line x1="0" y1="28" x2="0" y2="22" stroke="#94A3B8" strokeWidth="2" />
        <line x1="-28" y1="0" x2="-22" y2="0" stroke="#94A3B8" strokeWidth="2" />
        {/* Hour Hand at ~3 */}
        <line x1="0" y1="0" x2="18" y2="4" stroke="#EF4444" strokeWidth="3" strokeLinecap="round" />
        {/* Minute Hand at ~12 */}
        <line x1="0" y1="0" x2="8" y2="-24" stroke="#E2E8F0" strokeWidth="2" strokeLinecap="round" />
        <circle cx="0" cy="0" r="3" fill="#EF4444" />
      </g>

      {/* 4. TALL REFRIGERATOR ON RIGHT */}
      <g transform="translate(860, 480)">
        {/* Fridge Body */}
        <rect x="0" y="0" width="200" height="960" rx="14" fill="url(#fridgeSteel)" stroke="#090E14" strokeWidth="5" />
        {/* Freezer Door Separation Line */}
        <line x1="0" y1="320" x2="200" y2="320" stroke="#080C10" strokeWidth="6" />
        {/* Long Modern Handles */}
        <rect x="15" y="120" width="8" height="150" rx="4" fill="#475569" stroke="#1E293B" strokeWidth="2" />
        <rect x="15" y="370" width="8" height="300" rx="4" fill="#475569" stroke="#1E293B" strokeWidth="2" />
        {/* Magnets on Fridge Door */}
        <circle cx="90" cy="180" r="10" fill="#EF4444" />
        <rect x="120" y="160" width="35" height="45" rx="3" fill="#FEF08A" transform="rotate(-6, 120, 160)" opacity="0.9" />
        <circle cx="130" cy="165" r="3" fill="#DC2626" />
        {/* Creepy sticky note scribble */}
        <line x1="125" y1="180" x2="150" y2="180" stroke="#334155" strokeWidth="2" />
        <line x1="125" y1="190" x2="145" y2="190" stroke="#334155" strokeWidth="2" />
        {/* Blue/Green Power LED Indicator */}
        <circle cx="100" cy="40" r="4" fill="#10B981" opacity={fridgeLedPulse} filter="drop-shadow(0 0 6px #10B981)" />
      </g>

      {/* 5. COUNTERTOP & SINK */}
      {/* Base Cabinets */}
      <rect x="0" y="1180" width="860" height="340" fill="url(#cabinetGrad)" stroke="#1E293B" strokeWidth="4" />
      <line x1="280" y1="1180" x2="280" y2="1520" stroke="#0F172A" strokeWidth="4" />
      <line x1="570" y1="1180" x2="570" y2="1520" stroke="#0F172A" strokeWidth="4" />

      {/* Granite Countertop Slab */}
      <rect x="0" y="1140" width="870" height="45" rx="4" fill="url(#countertopGrad)" stroke="#334155" strokeWidth="3" />

      {/* Stainless Steel Kitchen Sink */}
      <rect x="120" y="1145" width="240" height="30" rx="3" fill="#0F172A" stroke="#475569" strokeWidth="2" />
      {/* Curved Chrome Faucet */}
      <path
        d="M 230 1145 L 230 1060 Q 230 1020 200 1020 Q 170 1020 170 1045 L 170 1060"
        fill="none"
        stroke="#94A3B8"
        strokeWidth="10"
        strokeLinecap="round"
      />
      {/* Faucet Knobs */}
      <rect x="245" y="1120" width="16" height="25" rx="3" fill="#64748B" />
      <rect x="195" y="1120" width="16" height="25" rx="3" fill="#64748B" />

      {/* Animated Dripping Water Droplet */}
      <ellipse
        cx="170"
        cy={1060 + dripY}
        rx="3"
        ry="5"
        fill="#93C5FD"
        opacity={dripOpacity}
      />

      {/* Dish Drying Rack with Plates & Glasses */}
      <g transform="translate(400, 1070)">
        {/* Metal Rack Tray */}
        <rect x="0" y="65" width="170" height="8" rx="2" fill="#475569" />
        <rect x="5" y="20" width="160" height="45" fill="none" stroke="#64748B" strokeWidth="3" rx="4" />
        {/* Slanted Ceramic Plates */}
        <ellipse cx="30" cy="42" rx="10" ry="24" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="2" transform="rotate(12, 30, 42)" />
        <ellipse cx="55" cy="42" rx="10" ry="24" fill="#CBD5E1" stroke="#94A3B8" strokeWidth="2" transform="rotate(12, 55, 42)" />
        <ellipse cx="80" cy="42" rx="10" ry="24" fill="#F1F5F9" stroke="#94A3B8" strokeWidth="2" transform="rotate(12, 80, 42)" />
        {/* Inverted Glass Cups */}
        <rect x="115" y="28" width="18" height="36" rx="3" fill="#93C5FD" opacity="0.35" stroke="#BAE6FD" strokeWidth="2" />
        <rect x="140" y="32" width="18" height="32" rx="3" fill="#93C5FD" opacity="0.35" stroke="#BAE6FD" strokeWidth="2" />
      </g>

      {/* Knife Block & Ceramic Mug with Faint Steam */}
      <g
        transform="translate(620, 1075)"
        filter={highlightKnife ? "drop-shadow(0 0 35px #EF4444)" : undefined}
      >
        {highlightKnife && (
          <ellipse cx="40" cy="40" rx="90" ry="70" fill="#EF4444" opacity="0.3" filter="url(#moonBlur)" />
        )}
        {/* Wooden Knife Block */}
        <polygon points="0,65 35,15 75,22 45,65" fill="#451A03" stroke="#291205" strokeWidth="2" />
        {/* Knife Handles */}
        <rect x="15" y="5" width="8" height="28" fill="#1E293B" transform="rotate(30, 15, 5)" />
        <rect x="30" y="10" width="8" height="28" fill="#1E293B" transform="rotate(30, 30, 10)" />
        <rect x="45" y="15" width="8" height="28" fill="#1E293B" transform="rotate(30, 45, 15)" />

        {/* Ceramic Coffee Mug */}
        <rect x="95" y="32" width="30" height="33" rx="4" fill="#DC2626" stroke="#991B1B" strokeWidth="2" />
        {/* Mug Handle */}
        <path d="M 125 38 Q 138 48 125 58" fill="none" stroke="#DC2626" strokeWidth="4" />
      </g>

      {/* 6. FLOOR (TILES & MOONLIGHT REFLECTION) */}
      <rect x="0" y="1480" width="1080" height="440" fill="url(#floorGrad)" />

      {/* Floor Tile Perspective Lines */}
      <g stroke="#1E293B" strokeWidth="2" opacity="0.45">
        <line x1="0" y1="1620" x2="1080" y2="1620" />
        <line x1="0" y1="1780" x2="1080" y2="1780" />
        <line x1="200" y1="1480" x2="60" y2="1920" />
        <line x1="450" y1="1480" x2="380" y2="1920" />
        <line x1="720" y1="1480" x2="720" y2="1920" />
        <line x1="950" y1="1480" x2="1020" y2="1920" />
      </g>

      {/* Soft Moonlight Pool on Floor */}
      <ellipse
        cx="540"
        cy="1720"
        rx="340"
        ry="130"
        fill="#60A5FA"
        opacity="0.12"
        filter="blur(25px)"
      />

      {/* Broken Ceramic Shards & Spilled Tea on Floor */}
      <g transform="translate(320, 1720)">
        {/* Dark Spilled Liquid Pool */}
        <ellipse cx="40" cy="20" rx="60" ry="18" fill="#1E1610" opacity="0.8" />
        {/* White Ceramic Shards */}
        <polygon points="20,15 28,8 35,22" fill="#E2E8F0" />
        <polygon points="50,18 64,12 58,28" fill="#CBD5E1" />
        <polygon points="10,24 16,30 5,28" fill="#94A3B8" />
      </g>
    </svg>
  );
};
