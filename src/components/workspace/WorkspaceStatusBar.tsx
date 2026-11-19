import React from 'react';
import { CheckCircle2, XCircle, Loader2, Footprints, GraduationCap, AlertTriangle } from 'lucide-react';
import { ExperienceLevel, LEVEL_META } from '../../utils/experienceLevel';
import { LEVEL_ICONS, LEVEL_ACCENT } from './LevelSwitcher';

interface WorkspaceStatusBarProps {
  level: ExperienceLevel;
  onLevelClick: () => void;
  languageName: string;
  cursorLine: number;
  lineCount: number;
  statements: number | null;
  indentErrors: number;
  runState: 'idle' | 'running' | 'success' | 'error';
  runTimeMs: number | null;
  engine: string | null;
  isStepMode: boolean;
  stepLabel: string | null;
  lessonTitle: string | null;
  isDirty: boolean;
  isLight?: boolean;
}

/** VS Code-style status bar along the bottom of the workspace. */
export const WorkspaceStatusBar: React.FC<WorkspaceStatusBarProps> = ({
  level,
  onLevelClick,
  languageName,
  cursorLine,
  lineCount,
  statements,
  indentErrors,
  runState,
  runTimeMs,
  engine,
  isStepMode,
  stepLabel,
  lessonTitle,
  isDirty,
  isLight = false,
}) => {
  const LevelIcon = LEVEL_ICONS[level];
  const levelLabel = LEVEL_META.find((l) => l.key === level)?.label;

  return (
    <div className={`h-6 min-h-6 shrink-0 flex items-center justify-between gap-3 px-2.5 border-t text-[11px] select-none overflow-hidden whitespace-nowrap transition-colors ${
      isLight
        ? 'bg-slate-100 border-slate-300 text-slate-700'
        : 'bg-[#121214] border-[#27272a] text-zinc-400'
    }`}>
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onLevelClick}
          className={`flex items-center gap-1 transition-colors ${
            isLight ? 'hover:text-slate-950 text-slate-800' : 'hover:text-white'
          }`}
          title="Change experience level"
        >
          <LevelIcon className={`w-3 h-3 ${LEVEL_ACCENT[level]}`} />
          <span className="font-semibold">{levelLabel}</span>
        </button>

        {runState === 'running' && (
          <span className={`flex items-center gap-1 font-medium ${isLight ? 'text-sky-700' : 'text-sky-300'}`}>
            <Loader2 className="w-3 h-3 animate-spin" /> Running…
          </span>
        )}
        {runState === 'success' && (
          <span className={`flex items-center gap-1 font-medium ${isLight ? 'text-emerald-700' : 'text-[#10b981]'}`} title={engine || undefined}>
            <CheckCircle2 className="w-3 h-3" /> Ran OK{runTimeMs !== null ? ` · ${runTimeMs}ms` : ''}
          </span>
        )}
        {runState === 'error' && (
          <span className={`flex items-center gap-1 font-medium ${isLight ? 'text-rose-700' : 'text-rose-400'}`} title={engine || undefined}>
            <XCircle className="w-3 h-3" /> Run failed
          </span>
        )}

        {isStepMode && stepLabel && (
          <span className={`hidden sm:flex items-center gap-1 font-medium ${isLight ? 'text-amber-800' : 'text-amber-300'}`}>
            <Footprints className="w-3 h-3" /> {stepLabel}
          </span>
        )}

        {lessonTitle && (
          <span className={`hidden md:flex items-center gap-1 truncate ${isLight ? 'text-blue-700 font-medium' : 'text-blue-300'}`}>
            <GraduationCap className="w-3 h-3" /> {lessonTitle}
          </span>
        )}

        {indentErrors > 0 && (
          <span className={`hidden sm:flex items-center gap-1 font-medium ${isLight ? 'text-rose-700' : 'text-rose-300'}`}>
            <AlertTriangle className="w-3 h-3" /> {indentErrors} indent issue{indentErrors > 1 ? 's' : ''}
          </span>
        )}
      </div>

      <div className="flex items-center gap-3 shrink-0">
        {isDirty && <span className={`hidden sm:inline font-medium ${isLight ? 'text-amber-800' : 'text-amber-300/90'}`}>● Unsaved</span>}
        {statements !== null && <span className={`hidden md:inline ${isLight ? 'text-slate-600 font-medium' : ''}`}>{statements} statements</span>}
        <span className={isLight ? 'text-slate-600 font-medium' : ''}>
          Ln {cursorLine}, {lineCount} lines
        </span>
        <span className={`font-semibold ${isLight ? 'text-slate-900' : 'text-slate-300'}`}>{languageName}</span>
      </div>
    </div>
  );
};
