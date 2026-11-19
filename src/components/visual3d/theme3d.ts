import { createContext, useContext } from 'react';

// ============================================================================
// Light / dark design tokens for the 3D view. Everything in the 3D view reads
// its colours from here so both themes stay consistent.
// ============================================================================

export type Theme3DName = 'dark' | 'light';

export interface Theme3D {
  name: Theme3DName;
  /** Scene background behind the floor */
  sceneBg: string;
  /** Star dust overlay (empty string = none) */
  stars: string;
  floorBg: string;
  floorGrid: string;
  floorShadow: string;
  /** Header bar + transport bar */
  chromeBg: string;
  chromeBorder: string;
  /** Glass HUD panels (tailwind classes) */
  panel: string;
  panelTitle: string;
  panelText: string;
  panelMuted: string;
  chip: string;
  chipChanged: string;
  /** Floating labels above boxes */
  labelBg: string;
  labelText: string;
  labelBorder: string;
  /** Text printed on the floor */
  floorText: string;
  floorTextMuted: string;
  /** Neutral control buttons (tailwind classes) */
  button: string;
  hint: string;
  /** Tab group (tailwind classes) */
  tabGroup: string;
  tabIdle: string;
  /** Platform slab under each structure */
  platform: { top: string; front: string; side: string; edge: string };
  /** Ghost (empty / zero) boxes */
  ghost: { top: string; front: string; side: string; edge: string };
  /** Darken accent colours on light backgrounds for readable text */
  accentText: (hex: string) => string;
}

const darken = (hex: string, amt: number) => {
  const n = parseInt(hex.slice(1), 16);
  const f = (c: number) => Math.max(0, Math.min(255, Math.round(c * amt)));
  return `#${[(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => f(c).toString(16).padStart(2, '0')).join('')}`;
};

export const THEMES_3D: Record<Theme3DName, Theme3D> = {
  dark: {
    name: 'dark',
    sceneBg: 'radial-gradient(1200px 600px at 50% 35%, #172036 0%, #0b1020 55%, #070a14 100%)',
    stars:
      'radial-gradient(1px 1px at 12% 22%, #ffffff55 50%, transparent 51%), radial-gradient(1px 1px at 72% 18%, #ffffff44 50%, transparent 51%), radial-gradient(1px 1px at 38% 70%, #ffffff33 50%, transparent 51%), radial-gradient(1px 1px at 86% 62%, #ffffff44 50%, transparent 51%), radial-gradient(1.5px 1.5px at 55% 40%, #93c5fd55 50%, transparent 51%)',
    floorBg: 'linear-gradient(135deg, rgba(30,41,74,0.85), rgba(15,23,42,0.9))',
    floorGrid: 'rgba(148,163,184,0.09)',
    floorShadow: '0 0 0 1px rgba(148,163,184,0.18), 0 40px 120px rgba(37,99,235,0.18) inset',
    chromeBg: '#0f1528',
    chromeBorder: 'rgba(255,255,255,0.1)',
    panel: 'bg-slate-900/80 border-white/10 text-slate-200',
    panelTitle: 'text-slate-400',
    panelText: 'text-slate-200',
    panelMuted: 'text-slate-500',
    chip: 'bg-white/5 border-white/10',
    chipChanged: 'bg-amber-400/15 border-amber-400/40',
    labelBg: 'rgba(15,23,42,0.85)',
    labelText: '#ffffff',
    labelBorder: 'rgba(255,255,255,0.15)',
    floorText: 'text-slate-200',
    floorTextMuted: 'text-slate-400',
    button: 'text-slate-300 hover:text-white hover:bg-white/10',
    hint: 'text-slate-500',
    tabGroup: 'bg-white/5 border-white/10',
    tabIdle: 'text-slate-300 hover:text-white',
    platform: { top: '#1e293b', front: '#16203a', side: '#0f172a', edge: '#33415588' },
    ghost: { top: '#94a3b8', front: '#64748b', side: '#475569', edge: '#cbd5e199' },
    accentText: (hex) => hex,
  },
  light: {
    name: 'light',
    sceneBg: 'radial-gradient(1200px 600px at 50% 30%, #ffffff 0%, #f1f5fb 55%, #e6ecf5 100%)',
    stars: '',
    floorBg: 'linear-gradient(135deg, #ffffff, #f4f7fc)',
    floorGrid: 'rgba(100,116,139,0.13)',
    floorShadow: '0 0 0 1px rgba(148,163,184,0.45), 0 30px 80px rgba(37,99,235,0.08) inset, 0 30px 60px -20px rgba(15,23,42,0.25)',
    chromeBg: '#f8fafc',
    chromeBorder: '#e2e8f0',
    panel: 'bg-white/90 border-slate-200 text-slate-700 shadow-lg shadow-slate-900/5',
    panelTitle: 'text-slate-500',
    panelText: 'text-slate-800',
    panelMuted: 'text-slate-400',
    chip: 'bg-slate-50 border-slate-200',
    chipChanged: 'bg-amber-50 border-amber-300',
    labelBg: 'rgba(255,255,255,0.95)',
    labelText: '#0f172a',
    labelBorder: 'rgba(148,163,184,0.6)',
    floorText: 'text-slate-700',
    floorTextMuted: 'text-slate-500',
    button: 'text-slate-600 hover:text-slate-900 hover:bg-slate-100',
    hint: 'text-slate-400',
    tabGroup: 'bg-white border-slate-200',
    tabIdle: 'text-slate-600 hover:text-slate-900',
    platform: { top: '#e2e8f0', front: '#cbd5e1', side: '#b6c2d2', edge: '#94a3b8aa' },
    ghost: { top: '#e2e8f0', front: '#cbd5e1', side: '#b6c2d2', edge: '#94a3b8' },
    accentText: (hex) => darken(hex, 0.62),
  },
};

export const Theme3DContext = createContext<Theme3D>(THEMES_3D.dark);
export const useTheme3D = () => useContext(Theme3DContext);
