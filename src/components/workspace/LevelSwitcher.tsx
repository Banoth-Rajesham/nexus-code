import React, { useEffect, useRef, useState } from 'react';
import { Sprout, GraduationCap, Rocket, ChevronDown, Check } from 'lucide-react';
import { ExperienceLevel, LEVEL_META } from '../../utils/experienceLevel';

export const LEVEL_ICONS: Record<ExperienceLevel, React.FC<{ className?: string }>> = {
  beginner: Sprout,
  intermediate: GraduationCap,
  senior: Rocket,
};

export const LEVEL_ACCENT: Record<ExperienceLevel, string> = {
  beginner: 'text-emerald-400',
  intermediate: 'text-sky-400',
  senior: 'text-violet-400',
};

interface LevelSwitcherProps {
  level: ExperienceLevel;
  onChange: (level: ExperienceLevel) => void;
  showLabel?: boolean;
  isLight?: boolean;
}

/** Compact toolbar dropdown for choosing Beginner / Intermediate / Senior. */
export const LevelSwitcher: React.FC<LevelSwitcherProps> = ({ level, onChange, showLabel = true, isLight = false }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const CurrentIcon = LEVEL_ICONS[level];
  const current = LEVEL_META.find((l) => l.key === level)!;

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="relative shrink-0" ref={ref} data-tour="level">
      <button
        onClick={() => setOpen((v) => !v)}
        title={`Experience level: ${current.label} — change what the workspace shows`}
        aria-label={`Experience level: ${current.label}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="nx-btn"
      >
        <CurrentIcon className={`w-3.5 h-3.5 ${LEVEL_ACCENT[level]}`} />
        {showLabel && <span className="hidden lg:inline">{current.label}</span>}
        <ChevronDown className="w-3 h-3 opacity-60" />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="Choose experience level"
          className={`absolute top-full right-0 mt-1 w-72 rounded-lg shadow-2xl z-50 p-1.5 border ${
            isLight
              ? 'bg-white border-slate-200 text-slate-800'
              : 'bg-[#161b22] border-[#30363d] text-slate-200'
          }`}
        >
          <div className={`px-2 pt-1 pb-1.5 text-[10px] font-bold uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>
            Experience level
          </div>
          {LEVEL_META.map((meta) => {
            const Icon = LEVEL_ICONS[meta.key];
            const active = meta.key === level;
            return (
              <button
                key={meta.key}
                role="option"
                aria-selected={active}
                onClick={() => {
                  onChange(meta.key);
                  setOpen(false);
                }}
                className={`w-full text-left flex items-start gap-2.5 px-2.5 py-2 rounded-md transition-colors ${
                  active
                    ? isLight
                      ? 'bg-blue-50 ring-1 ring-blue-500/40 text-blue-900'
                      : 'bg-[#21262d] ring-1 ring-blue-500/40'
                    : isLight
                    ? 'hover:bg-slate-100'
                    : 'hover:bg-[#1c2128]'
                }`}
              >
                <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${LEVEL_ACCENT[meta.key]}`} />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className={`text-xs font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{meta.label}</span>
                    <span className="text-[10px] text-slate-500">{meta.tagline}</span>
                  </span>
                  <span className={`block text-[11px] leading-snug ${isLight ? 'text-slate-600' : 'text-slate-400'} mt-0.5`}>{meta.description}</span>
                </span>
                {active && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />}
              </button>
            );
          })}
          <div className="px-2.5 pt-1.5 pb-1 mt-1 border-t border-[#30363d] text-[10px] text-slate-500 leading-snug">
            Levels only hide extra tools. Nothing is deleted — Senior always shows everything.
          </div>
        </div>
      )}
    </div>
  );
};
