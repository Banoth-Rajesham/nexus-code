import React from 'react';

interface AnimatedLightBeamsProps {
  variant?: 'compact' | 'tall';
  className?: string;
}

export const AnimatedLightBeams: React.FC<AnimatedLightBeamsProps> = ({
  variant = 'compact',
  className = '',
}) => {
  const isTall = variant === 'tall';
  const viewBox = isTall ? '0 0 1440 2200' : '0 0 1440 680';
  const height = isTall ? 2200 : 680;

  return (
    <div
      className={`pointer-events-none select-none absolute inset-0 overflow-hidden ${className}`}
      aria-hidden="true"
    >
      <style>{`
        @keyframes alb-float-blue {
          0%, 100% {
            transform: translate3d(0, 0, 0) scale(1);
            filter: drop-shadow(0 0 20px rgba(0, 180, 255, 0.45));
          }
          50% {
            transform: translate3d(14px, -18px, 0) scale(1.02);
            filter: drop-shadow(0 0 32px rgba(0, 210, 255, 0.7));
          }
        }
        @keyframes alb-float-red {
          0%, 100% {
            transform: translate3d(0, 0, 0) scale(1);
            filter: drop-shadow(0 0 20px rgba(255, 60, 90, 0.45));
          }
          50% {
            transform: translate3d(-16px, 14px, 0) scale(1.02);
            filter: drop-shadow(0 0 35px rgba(255, 75, 110, 0.75));
          }
        }
        @keyframes alb-pulse-laser {
          0% {
            stroke-dashoffset: 2400;
          }
          100% {
            stroke-dashoffset: -2400;
          }
        }
        @keyframes alb-glow-breathe {
          0%, 100% {
            opacity: 0.55;
            transform: scale(0.97);
          }
          50% {
            opacity: 0.85;
            transform: scale(1.06);
          }
        }
        .alb-blue-group {
          animation: alb-float-blue 8s ease-in-out infinite;
          transform-origin: bottom left;
        }
        .alb-red-group {
          animation: alb-float-red 9s ease-in-out infinite;
          transform-origin: top right;
        }
        .alb-laser-pulse {
          stroke-dasharray: 200 400;
          animation: alb-pulse-laser 12s linear infinite;
        }
        .alb-laser-pulse-fast {
          stroke-dasharray: 120 300;
          animation: alb-pulse-laser 8s linear infinite;
        }
        .alb-glow-ambient {
          animation: alb-glow-breathe 7s ease-in-out infinite;
        }
      `}</style>

      <svg
        className="absolute inset-0 w-full h-full"
        viewBox={viewBox}
        preserveAspectRatio="xMidYMid slice"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* ─── BLUES GRADIENTS ─── */}
          <linearGradient id={`alb-bg-blue-${variant}`} x1="0%" y1="100%" x2="65%" y2="0%">
            <stop offset="0%" stopColor="#00b4d8" stopOpacity="0.85" />
            <stop offset="25%" stopColor="#0096c7" stopOpacity="0.65" />
            <stop offset="55%" stopColor="#48cae4" stopOpacity="0.35" />
            <stop offset="85%" stopColor="#90e0ef" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>

          <linearGradient id={`alb-laser-blue-${variant}`} x1="0%" y1="100%" x2="60%" y2="0%">
            <stop offset="0%" stopColor="#0077b6" stopOpacity="0.95" />
            <stop offset="30%" stopColor="#00b4d8" stopOpacity="1" />
            <stop offset="60%" stopColor="#90e0ef" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>

          {/* ─── RED / CORAL GRADIENTS ─── */}
          <linearGradient id={`alb-bg-red-${variant}`} x1="100%" y1="0%" x2="35%" y2="100%">
            <stop offset="0%" stopColor="#ff3366" stopOpacity="0.85" />
            <stop offset="28%" stopColor="#ff5277" stopOpacity="0.65" />
            <stop offset="60%" stopColor="#ff758f" stopOpacity="0.35" />
            <stop offset="88%" stopColor="#ffb3c1" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>

          <linearGradient id={`alb-laser-red-${variant}`} x1="100%" y1="0%" x2="40%" y2="100%">
            <stop offset="0%" stopColor="#e11d48" stopOpacity="0.95" />
            <stop offset="30%" stopColor="#ff3366" stopOpacity="1" />
            <stop offset="65%" stopColor="#fb7185" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>

          {/* ─── NEON GLOW FILTERS ─── */}
          <filter id={`alb-blur-heavy-${variant}`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="24" result="blur" />
          </filter>
          <filter id={`alb-blur-mid-${variant}`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="12" result="blur" />
          </filter>
          <filter id={`alb-blur-fine-${variant}`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
          </filter>
        </defs>

        {isTall ? (
          <>
            {/* ══════════ TALL VARIANT (FAQ -> FOOTER: ~2200px) ══════════ */}
            {/* Ambient Atmosphere Backdrops */}
            <g className="alb-glow-ambient">
              <ellipse cx="60" cy="2050" rx="380" ry="260" fill="url(#alb-bg-blue-tall)" filter="url(#alb-blur-heavy-tall)" opacity="0.45" />
              <ellipse cx="1380" cy="180" rx="420" ry="300" fill="url(#alb-bg-red-tall)" filter="url(#alb-blur-heavy-tall)" opacity="0.45" />
            </g>

            {/* Blue Swoop Beams (Bottom-Left sweeping upwards) */}
            <g className="alb-blue-group">
              {/* Diffused broad beam aura */}
              <path
                d="M -120 2260 Q 260 1600 680 950 Q 940 540 1180 120 L 1230 140 Q 980 580 720 980 Q 290 1630 -70 2280 Z"
                fill="url(#alb-bg-blue-tall)"
                filter="url(#alb-blur-mid-tall)"
                opacity="0.65"
              />
              {/* Secondary mid beam */}
              <path
                d="M -80 2240 Q 220 1660 580 1100 Q 820 720 1060 300"
                stroke="url(#alb-laser-blue-tall)"
                strokeWidth="6"
                strokeLinecap="round"
                filter="url(#alb-blur-fine-tall)"
                opacity="0.8"
              />
              {/* Razor core line */}
              <path
                d="M -80 2240 Q 220 1660 580 1100 Q 820 720 1060 300"
                stroke="#38bdf8"
                strokeWidth="2.5"
                strokeLinecap="round"
                opacity="0.95"
              />
              {/* Animated racing laser pulse */}
              <path
                d="M -80 2240 Q 220 1660 580 1100 Q 820 720 1060 300"
                stroke="#ffffff"
                strokeWidth="3.5"
                strokeLinecap="round"
                className="alb-laser-pulse"
                filter="url(#alb-blur-fine-tall)"
              />
              {/* Parallel satellite trail */}
              <path
                d="M -150 2200 Q 140 1700 480 1220 Q 720 860 960 480"
                stroke="url(#alb-laser-blue-tall)"
                strokeWidth="2"
                strokeDasharray="8 12"
                strokeLinecap="round"
                opacity="0.45"
              />
            </g>

            {/* Red / Coral Swoop Beams (Top-Right sweeping downwards) */}
            <g className="alb-red-group">
              {/* Diffused broad beam aura */}
              <path
                d="M 1560 -80 Q 1180 620 780 1280 Q 520 1700 240 2140 L 190 2120 Q 480 1660 740 1250 Q 1140 580 1510 -100 Z"
                fill="url(#alb-bg-red-tall)"
                filter="url(#alb-blur-mid-tall)"
                opacity="0.65"
              />
              {/* Secondary mid beam */}
              <path
                d="M 1520 -40 Q 1220 580 860 1160 Q 620 1560 360 2000"
                stroke="url(#alb-laser-red-tall)"
                strokeWidth="6"
                strokeLinecap="round"
                filter="url(#alb-blur-fine-tall)"
                opacity="0.8"
              />
              {/* Razor core line */}
              <path
                d="M 1520 -40 Q 1220 580 860 1160 Q 620 1560 360 2000"
                stroke="#fb7185"
                strokeWidth="2.5"
                strokeLinecap="round"
                opacity="0.95"
              />
              {/* Animated racing laser pulse */}
              <path
                d="M 1520 -40 Q 1220 580 860 1160 Q 620 1560 360 2000"
                stroke="#ffffff"
                strokeWidth="3.5"
                strokeLinecap="round"
                className="alb-laser-pulse-fast"
                filter="url(#alb-blur-fine-tall)"
              />
              {/* Parallel satellite trail */}
              <path
                d="M 1580 40 Q 1300 660 960 1240 Q 720 1640 460 2080"
                stroke="url(#alb-laser-red-tall)"
                strokeWidth="2"
                strokeDasharray="8 12"
                strokeLinecap="round"
                opacity="0.45"
              />
            </g>
          </>
        ) : (
          <>
            {/* ══════════ COMPACT VARIANT (LEVELS SECTION: ~680px) ══════════ */}
            {/* Ambient Atmosphere Backdrops */}
            <g className="alb-glow-ambient">
              <ellipse cx="80" cy="620" rx="360" ry="220" fill="url(#alb-bg-blue-compact)" filter="url(#alb-blur-heavy-compact)" opacity="0.5" />
              <ellipse cx="1360" cy="80" rx="400" ry="240" fill="url(#alb-bg-red-compact)" filter="url(#alb-blur-heavy-compact)" opacity="0.5" />
            </g>

            {/* Blue Swoop Beams (Bottom-Left) */}
            <g className="alb-blue-group">
              {/* Diffused broad beam aura matching Mercari bottom-left glow */}
              <path
                d="M -80 720 Q 140 440 460 240 Q 640 130 840 40 L 870 55 Q 670 148 488 258 Q 170 460 -48 735 Z"
                fill="url(#alb-bg-blue-compact)"
                filter="url(#alb-blur-mid-compact)"
                opacity="0.75"
              />
              {/* Secondary mid beam */}
              <path
                d="M -50 700 Q 160 420 450 230 Q 620 120 820 30"
                stroke="url(#alb-laser-blue-compact)"
                strokeWidth="6"
                strokeLinecap="round"
                filter="url(#alb-blur-fine-compact)"
                opacity="0.85"
              />
              {/* Razor core line */}
              <path
                d="M -50 700 Q 160 420 450 230 Q 620 120 820 30"
                stroke="#38bdf8"
                strokeWidth="2.5"
                strokeLinecap="round"
                opacity="1"
              />
              {/* Animated racing laser pulse */}
              <path
                d="M -50 700 Q 160 420 450 230 Q 620 120 820 30"
                stroke="#ffffff"
                strokeWidth="3.5"
                strokeLinecap="round"
                className="alb-laser-pulse"
                filter="url(#alb-blur-fine-compact)"
              />
              {/* Secondary delicate parallel filament */}
              <path
                d="M -90 660 Q 100 400 370 230 Q 530 130 710 50"
                stroke="url(#alb-laser-blue-compact)"
                strokeWidth="2"
                strokeDasharray="6 10"
                strokeLinecap="round"
                opacity="0.55"
              />
            </g>

            {/* Red / Coral Swoop Beams (Top-Right) */}
            <g className="alb-red-group">
              {/* Diffused broad beam aura matching Mercari top-right diagonal glow */}
              <path
                d="M 1520 -40 Q 1280 220 960 420 Q 780 530 580 620 L 550 605 Q 750 512 932 402 Q 1250 200 1488 -55 Z"
                fill="url(#alb-bg-red-compact)"
                filter="url(#alb-blur-mid-compact)"
                opacity="0.75"
              />
              {/* Secondary mid beam */}
              <path
                d="M 1490 -20 Q 1260 240 970 430 Q 800 540 600 630"
                stroke="url(#alb-laser-red-compact)"
                strokeWidth="6"
                strokeLinecap="round"
                filter="url(#alb-blur-fine-compact)"
                opacity="0.85"
              />
              {/* Razor core line */}
              <path
                d="M 1490 -20 Q 1260 240 970 430 Q 800 540 600 630"
                stroke="#fb7185"
                strokeWidth="2.5"
                strokeLinecap="round"
                opacity="1"
              />
              {/* Animated racing laser pulse */}
              <path
                d="M 1490 -20 Q 1260 240 970 430 Q 800 540 600 630"
                stroke="#ffffff"
                strokeWidth="3.5"
                strokeLinecap="round"
                className="alb-laser-pulse-fast"
                filter="url(#alb-blur-fine-compact)"
              />
              {/* Secondary delicate parallel filament */}
              <path
                d="M 1530 20 Q 1320 260 1050 430 Q 890 530 710 610"
                stroke="url(#alb-laser-red-compact)"
                strokeWidth="2"
                strokeDasharray="6 10"
                strokeLinecap="round"
                opacity="0.55"
              />
            </g>
          </>
        )}
      </svg>
    </div>
  );
};

export default AnimatedLightBeams;
