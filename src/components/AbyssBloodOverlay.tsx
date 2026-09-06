import React from 'react';

export interface AbyssBloodOverlayProps {
  stage: 1 | 2 | 3;
}

export const AbyssBloodOverlay: React.FC<AbyssBloodOverlayProps> = ({ stage }) => {
  return (
    <div
      className={`abyss-blood-overlay stage-${stage}`}
      data-testid={`abyss-blood-stage-${stage}`}
      aria-hidden="true"
    >
      <svg
        className="abyss-blood-svg-layer"
        viewBox="0 0 1920 1080"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <radialGradient id="bloodGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#991b1b" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#450a0a" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Stage 1: Corner blood droplets and seepage */}
        {stage >= 1 && (
          <g fill="#7f1d1d" opacity="0.75">
            {/* Top-left splatter */}
            <circle cx="20" cy="18" r="14" />
            <circle cx="50" cy="25" r="9" />
            <circle cx="32" cy="55" r="11" />
            <path d="M0,0 Q60,10 40,60 Q20,40 0,70 Z" />

            {/* Top-right splatter */}
            <circle cx="1900" cy="20" r="15" />
            <circle cx="1870" cy="35" r="10" />
            <circle cx="1890" cy="65" r="8" />
            <path d="M1920,0 Q1860,15 1880,65 Q1900,45 1920,80 Z" />

            {/* Bottom edge micro-drips */}
            <circle cx="960" cy="1070" r="12" />
            <circle cx="480" cy="1065" r="10" />
            <circle cx="1440" cy="1068" r="11" />
          </g>
        )}

        {/* Stage 2: Deep blood flows, creeping tendrils */}
        {stage >= 2 && (
          <g fill="#881337" opacity="0.85">
            {/* Left border creeping blood flows */}
            <path d="M0,150 Q45,220 20,320 T40,480 T10,650 L0,700 Z" />
            <circle cx="55" cy="330" r="16" />
            <circle cx="65" cy="360" r="9" />
            <circle cx="45" cy="495" r="12" />

            {/* Right border creeping blood flows */}
            <path d="M1920,200 Q1870,280 1900,420 T1880,590 T1915,750 L1920,800 Z" />
            <circle cx="1860" cy="430" r="15" />
            <circle cx="1875" cy="605" r="13" />

            {/* Bottom corner heavy pools */}
            <path d="M0,1080 Q90,1010 140,1080 Z" />
            <path d="M1920,1080 Q1830,1000 1760,1080 Z" />
          </g>
        )}

        {/* Stage 3: Veins, heavy splatter curtains across periphery */}
        {stage >= 3 && (
          <g fill="#450a0a" opacity="0.92">
            {/* Upper dripping ceiling */}
            <path d="M100,0 C250,90 350,20 500,70 C650,110 750,30 960,85 C1150,20 1280,95 1450,55 C1600,100 1750,30 1920,60 L1920,0 Z" />
            <circle cx="520" cy="95" r="18" />
            <circle cx="525" cy="125" r="10" />
            <circle cx="980" cy="115" r="22" />
            <circle cx="985" cy="155" r="13" />
            <circle cx="1470" cy="80" r="16" />

            {/* Dense lower blood sea */}
            <path d="M0,1000 Q300,1030 600,980 T1200,1010 T1800,970 L1920,1080 L0,1080 Z" />
            <circle cx="610" cy="960" r="20" />
            <circle cx="1220" cy="990" r="18" />
          </g>
        )}
      </svg>
    </div>
  );
};
