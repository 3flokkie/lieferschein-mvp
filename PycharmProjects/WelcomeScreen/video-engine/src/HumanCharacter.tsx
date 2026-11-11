import React from "react";

export type HumanPose = "looking_peephole" | "pov_door" | "turning_back" | "shock_hand_shoulder" | "choice_pointing";

interface HumanProps {
  pose: HumanPose;
  scale?: number;
}

export const HumanCharacter: React.FC<HumanProps> = ({ pose, scale = 1.0 }) => {
  return (
    <div
      style={{
        width: 1080 * scale,
        height: 1920 * scale,
        position: "relative",
      }}
    >
      <svg viewBox="0 0 1080 1920" width={1080 * scale} height={1920 * scale}>
        <defs>
          {/* Natural Skin Gradients */}
          <linearGradient id="skin-light" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FBD5B5" />
            <stop offset="100%" stopColor="#E4A882" />
          </linearGradient>
          <linearGradient id="skin-shadow" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#E09C75" />
            <stop offset="100%" stopColor="#B87352" />
          </linearGradient>
          {/* Clothes (Olive Hoodie & Dark Jeans) */}
          <linearGradient id="hoodie-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3E4C3D" />
            <stop offset="100%" stopColor="#222B21" />
          </linearGradient>
          <linearGradient id="jeans-grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#232B38" />
            <stop offset="100%" stopColor="#10141D" />
          </linearGradient>
          {/* Hair Gradient */}
          <linearGradient id="hair-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3A281E" />
            <stop offset="100%" stopColor="#18110B" />
          </linearGradient>
        </defs>

        {/* ============================================================== */}
        {/* SCENE 1: LOOKING INTO PEEPHOLE (Side Profile At The Door) */}
        {/* ============================================================== */}
        {pose === "looking_peephole" && (
          <g id="side-profile-peephole">
            {/* The Door on the Left */}
            <rect x="0" y="0" width="320" height="1920" fill="#1C1815" stroke="#0D0B09" strokeWidth="8" />
            <line x1="320" y1="0" x2="320" y2="1920" stroke="#3A322C" strokeWidth="12" />
            {/* Peephole Brass Ring */}
            <circle cx="320" cy="850" r="26" fill="#C59B27" stroke="#3A281E" strokeWidth="6" />
            <circle cx="320" cy="850" r="16" fill="#00E5FF" opacity="0.8" />
            {/* Cyan Peephole Light Beam radiating into eye */}
            <polygon points="320,845 320,855 460,920 460,780" fill="#00E5FF" opacity="0.15" />

            {/* Back Jeans */}
            <path d="M 440 1420 L 410 1880 L 510 1880 L 530 1460 Z" fill="url(#jeans-grad)" stroke="#111" strokeWidth="4" />
            <path d="M 520 1440 L 580 1880 L 680 1880 L 620 1420 Z" fill="url(#jeans-grad)" stroke="#111" strokeWidth="4" />

            {/* Torso & Hoodie leaning slightly forward */}
            <path
              d="M 400 1020 C 370 1200, 390 1380, 410 1460 L 630 1440 C 640 1340, 650 1180, 610 1020 Z"
              fill="url(#hoodie-grad)"
              stroke="#111"
              strokeWidth="5"
            />
            {/* Arm pressed against the door frame for balance */}
            <path
              d="M 460 1060 Q 360 1120 340 1180 L 330 1160 Q 360 1080 490 1030 Z"
              fill="url(#hoodie-grad)"
              stroke="#111"
              strokeWidth="4"
            />
            {/* Hand on door */}
            <circle cx="330" cy="1170" r="22" fill="url(#skin-light)" stroke="#111" strokeWidth="3" />

            {/* Neck & Chin leaning forward */}
            <path d="M 480 960 L 460 920 L 530 900 L 540 960 Z" fill="url(#skin-shadow)" />

            {/* Side Head & Profile */}
            <path
              d="M 520 740 C 560 750, 580 840, 560 900 C 530 940, 480 940, 450 910 L 430 870 L 440 850 L 420 845 L 440 820 L 450 780 Z"
              fill="url(#skin-light)"
              stroke="#111"
              strokeWidth="4"
            />
            {/* Eye pressed right up to the peephole light */}
            <ellipse cx="442" cy="840" rx="12" ry="8" fill="#FFF" stroke="#111" strokeWidth="2" />
            <circle cx="438" cy="840" r="5" fill="#00E5FF" />
            {/* Eyebrow furrowed in intense focus */}
            <path d="M 432 825 Q 450 820 465 830" stroke="#3A281E" strokeWidth="5" strokeLinecap="round" />
            {/* Ear */}
            <ellipse cx="525" cy="845" rx="14" ry="20" fill="url(#skin-shadow)" stroke="#111" strokeWidth="2" />

            {/* Realistic Messy Hair */}
            <path
              d="M 450 770 C 430 730, 480 690, 540 700 C 590 710, 600 780, 580 840 C 560 830, 550 760, 510 745 C 480 730, 460 750, 450 770 Z"
              fill="url(#hair-grad)"
              stroke="#111"
              strokeWidth="3"
            />
          </g>
        )}

        {/* ============================================================== */}
        {/* SCENE 2: POV THROUGH THE PEEPHOLE (The Double Outside) */}
        {/* ============================================================== */}
        {pose === "pov_door" && (
          <g id="pov-fisheye">
            {/* Fisheye Round Mask */}
            <circle cx="540" cy="960" r="500" fill="#031622" stroke="#C59B27" strokeWidth="24" />
            {/* Dirty Halway corridor through lens distortion */}
            <path d="M 140 1360 L 540 1060 L 940 1360 L 940 1460 L 140 1460 Z" fill="#08202F" />
            <line x1="540" y1="1060" x2="540" y2="460" stroke="#00F0FF" strokeWidth="3" opacity="0.3" />

            {/* The Eerie Double Standing in the Center */}
            <g transform="translate(0, 50)">
              {/* Torso */}
              <path d="M 440 1080 L 420 1400 L 660 1400 L 640 1080 Z" fill="#152726" stroke="#000" strokeWidth="4" />
              {/* Head */}
              <ellipse cx="540" cy="900" rx="90" ry="110" fill="url(#skin-light)" stroke="#000" strokeWidth="5" />
              {/* Hair */}
              <path d="M 450 860 C 450 750, 630 750, 630 860 C 600 800, 480 800, 450 860 Z" fill="url(#hair-grad)" />
              {/* Wide Creepy Glowing Eyes */}
              <circle cx="495" cy="890" r="24" fill="#FFF" stroke="#000" strokeWidth="3" />
              <circle cx="495" cy="890" r="14" fill="#00E5FF" />
              <circle cx="497" cy="888" r="5" fill="#FFF" />
              <circle cx="585" cy="890" r="24" fill="#FFF" stroke="#000" strokeWidth="3" />
              <circle cx="585" cy="890" r="14" fill="#00E5FF" />
              <circle cx="587" cy="888" r="5" fill="#FFF" />
              {/* Unnatural Smile */}
              <path d="M 475 960 Q 540 1010 605 960" stroke="#8A1325" strokeWidth="6" fill="none" strokeLinecap="round" />
            </g>

            {/* Fish-Eye Outer Blackout */}
            <path
              d="M 0 0 L 1080 0 L 1080 1920 L 0 1920 Z M 540 1460 C 816 1460, 1040 1236, 1040 960 C 1040 684, 816 460, 540 460 C 264 460, 40 684, 40 960 C 40 1236, 264 1460, 540 1460 Z"
              fill="#050608"
            />
          </g>
        )}

        {/* ============================================================== */}
        {/* SCENE 3: TURNING BACK (Mother Silhoutte In The Dark Apartment) */}
        {/* ============================================================== */}
        {pose === "turning_back" && (
          <g id="turning-back-mom">
            {/* Long Dark Apartment Hallway */}
            <polygon points="0,0 1080,0 780,700 300,700" fill="#0E0F14" />
            <polygon points="0,1920 1080,1920 780,1250 300,1250" fill="#14151C" />
            <polygon points="0,0 300,700 300,1250 0,1920" fill="#0A0B0E" />
            <polygon points="1080,0 780,700 780,1250 1080,1920" fill="#07080A" />

            {/* Warm Kitchen Doorway At The Far End */}
            <rect x="420" y="680" width="240" height="560" fill="#F49D37" opacity="0.85" />
            <polygon points="420,680 660,680 780,1250 300,1250" fill="#F49D37" opacity="0.25" />

            {/* Mother's Eerie Tall Faceless Silhouette */}
            <g id="mom-silhouette">
              <ellipse cx="540" cy="800" rx="28" ry="38" fill="#0A0B0E" />
              <path d="M 505 840 C 480 980, 470 1150, 460 1240 L 620 1240 C 610 1150, 600 980, 575 840 Z" fill="#0A0B0E" />
            </g>

            {/* Artem in the Foreground (Back To Us, Looking Down Hallway) */}
            <g id="artem-back-view">
              <ellipse cx="540" cy="1540" rx="140" ry="160" fill="url(#hair-grad)" stroke="#111" strokeWidth="6" />
              <path
                d="M 320 1700 C 300 1850, 310 1920, 310 1920 L 770 1920 C 770 1920, 780 1850, 760 1700 Q 540 1660 320 1700 Z"
                fill="url(#hoodie-grad)"
                stroke="#111"
                strokeWidth="6"
              />
            </g>
          </g>
        )}

        {/* ============================================================== */}
        {/* SCENE 4: SHOCK HAND ON SHOULDER */}
        {/* ============================================================== */}
        {pose === "shock_hand_shoulder" && (
          <g id="creepy-hand-shoulder">
            {/* Background Darkness */}
            <rect x="0" y="0" width="1080" height="1920" fill="#080303" />

            {/* Artem's Terrified Front Profile Closeup */}
            <g transform="translate(40, 180)">
              {/* Torso */}
              <path d="M 280 1100 Q 500 1060 720 1100 L 750 1600 L 250 1600 Z" fill="url(#hoodie-grad)" stroke="#000" strokeWidth="6" />
              {/* Neck */}
              <rect x="440" y="940" width="120" height="180" fill="url(#skin-shadow)" />
              {/* Head */}
              <ellipse cx="500" cy="740" rx="180" ry="230" fill="url(#skin-light)" stroke="#000" strokeWidth="7" />
              {/* Messy Hair */}
              <path
                d="M 320 680 C 300 480, 680 460, 680 660 C 650 560, 480 540, 340 640 Z"
                fill="url(#hair-grad)"
              />
              {/* Wide Terrified Eyes With Pupils Dilated in Shock */}
              <circle cx="410" cy="720" r="44" fill="#FFF" stroke="#000" strokeWidth="5" />
              <circle cx="410" cy="720" r="16" fill="#1C140D" />
              <circle cx="415" cy="715" r="5" fill="#FFF" />
              <circle cx="590" cy="720" r="44" fill="#FFF" stroke="#000" strokeWidth="5" />
              <circle cx="590" cy="720" r="16" fill="#1C140D" />
              <circle cx="595" cy="715" r="5" fill="#FFF" />
              {/* Open Gasping Mouth */}
              <ellipse cx="500" cy="850" rx="36" ry="50" fill="#3D0B14" stroke="#FFF" strokeWidth="4" />
            </g>

            {/* The Long Grey Monstrous Hand Touching Left Shoulder */}
            <g id="pale-monster-hand">
              {/* Arm reaching from top-right darkness */}
              <path d="M 980 600 Q 820 900 680 1200" stroke="#7C888A" strokeWidth="56" strokeLinecap="round" fill="none" />
              {/* Palm on Artem's Shoulder */}
              <ellipse cx="680" cy="1220" rx="48" ry="40" fill="#7C888A" />
              {/* Long Bony Fingers Wrapping Around Shoulder */}
              <path d="M 650 1210 Q 610 1240 590 1290" stroke="#9EA8AA" strokeWidth="16" strokeLinecap="round" fill="none" />
              <path d="M 670 1220 Q 640 1260 630 1320" stroke="#9EA8AA" strokeWidth="16" strokeLinecap="round" fill="none" />
              <path d="M 695 1225 Q 675 1270 670 1335" stroke="#9EA8AA" strokeWidth="16" strokeLinecap="round" fill="none" />
              <path d="M 715 1225 Q 710 1265 715 1325" stroke="#9EA8AA" strokeWidth="14" strokeLinecap="round" fill="none" />
            </g>
          </g>
        )}

        {/* ============================================================== */}
        {/* SCENE 5: DILEMMA CHOICE (Two Doors A / B) */}
        {/* ============================================================== */}
        {pose === "choice_pointing" && (
          <g id="choice-doors">
            <rect x="0" y="0" width="1080" height="1920" fill="#07090E" />

            {/* Left Cyan Door (Option A) */}
            <rect x="80" y="320" width="400" height="780" rx="16" fill="#041E28" stroke="#00F0FF" strokeWidth="8" />
            <text x="280" y="740" fill="#00F0FF" fontSize="130" fontWeight="900" textAnchor="middle">А</text>
            <text x="280" y="860" fill="#FFF" fontSize="36" fontWeight="700" textAnchor="middle">ОТКРЫТЬ</text>

            {/* Right Amber Door (Option B) */}
            <rect x="600" y="320" width="400" height="780" rx="16" fill="#2B1A04" stroke="#F7C548" strokeWidth="8" />
            <text x="800" y="740" fill="#F7C548" fontSize="130" fontWeight="900" textAnchor="middle">Б</text>
            <text x="800" y="860" fill="#FFF" fontSize="36" fontWeight="700" textAnchor="middle">ОБЕРНУТЬСЯ</text>

            {/* Artem in the Foreground (Center Pointing Finger at Viewer) */}
            <g transform="translate(0, 150)">
              <ellipse cx="540" cy="1320" rx="140" ry="170" fill="url(#skin-light)" stroke="#000" strokeWidth="6" />
              <path d="M 400 1270 C 400 1140, 680 1140, 680 1270 Z" fill="url(#hair-grad)" />
              <path d="M 320 1520 L 760 1520 L 800 1920 L 280 1920 Z" fill="url(#hoodie-grad)" stroke="#000" strokeWidth="6" />
              {/* Pointing Hand coming forward into camera */}
              <circle cx="540" cy="1640" r="64" fill="url(#skin-light)" stroke="#000" strokeWidth="6" />
              <polygon points="510,1620 570,1620 540,1520" fill="url(#skin-light)" stroke="#000" strokeWidth="5" />
            </g>
          </g>
        )}
      </svg>
    </div>
  );
};
