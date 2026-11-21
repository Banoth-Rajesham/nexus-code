import React, { useEffect, useMemo, useState } from 'react';
import { Network, Play, Pause, SkipBack, SkipForward, AlertTriangle, RefreshCw } from 'lucide-react';
import { IsometricDiagramWorld } from './IsometricDiagramWorld';
import { analyzeArchitecture } from '../../utils/visual3d/architecture';
import type { TraceStep, WorkerErrorInfo } from '../../utils/pyodideRunner';
import { THEMES_3D, Theme3DContext, Theme3DName, useTheme3D } from './theme3d';

interface ExplainedRow {
  startLine: number;
  endLine: number;
  explanation: string;
}

interface Code3DViewProps {
  progLang: string;
  code: string;
  files: { name: string; content: string }[];
  activeFileName: string;
  rows: ExplainedRow[];
  stepTrace: TraceStep[];
  stepIndex: number;
  isStepMode: boolean;
  isPlaying: boolean;
  isTracing: boolean;
  traceOutdated: boolean;
  traceCode: string;
  stepError: WorkerErrorInfo | null;
  onStartStep: () => void;
  onStepNext: () => void;
  onStepBack: () => void;
  onTogglePlay: () => void;
  onSeek: (index: number) => void;
  onJumpToLine: (line: number) => void;
  /** Follows the workspace's light / dark theme */
  theme?: Theme3DName;
}

/** "3D View" for the workspace: isometric architecture diagram of the program. */
export const Code3DView: React.FC<Code3DViewProps> = (props) => {
  const { code, files, activeFileName, stepTrace, stepIndex, isStepMode } = props;

  // Static analysis (debounced so typing stays smooth)
  const [archFiles, setArchFiles] = useState(files);
  useEffect(() => {
    const t = setTimeout(() => setArchFiles(files), 350);
    return () => clearTimeout(t);
  }, [files]);
  const archMap = useMemo(() => analyzeArchitecture(archFiles), [archFiles]);

  const current = isStepMode ? stepTrace[stepIndex] || null : null;
  const activeLine = isStepMode && !props.traceOutdated ? current?.line ?? null : null;
  const theme = THEMES_3D[props.theme || 'dark'];

  return (
    <Theme3DContext.Provider value={theme}>
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden" style={{ background: theme.chromeBg }}>
      <div className="h-10 shrink-0 flex items-center justify-between gap-3 px-3 border-b" style={{ background: theme.chromeBg, borderColor: theme.chromeBorder }}>
        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${theme.panelText}`}>
          <Network className="w-3.5 h-3.5" /> Architecture
        </span>
        <span className={`text-[11px] truncate hidden md:block ${theme.floorTextMuted}`}>
          {`${archMap.nodes.length} building blocks · ${archMap.edges.length} connections${activeLine ? ' · live' : ''}`}
        </span>
      </div>

      <IsometricDiagramWorld map={archMap} activeFile={activeFileName} activeLine={activeLine} onJumpToLine={props.onJumpToLine} />
      {isStepMode && stepTrace.length > 0 && <Transport {...props} current={current} compact />}
    </div>
    </Theme3DContext.Provider>
  );
};

const Transport: React.FC<Code3DViewProps & { current: TraceStep | null; compact?: boolean }> = ({
  stepTrace,
  stepIndex,
  isPlaying,
  rows,
  traceCode,
  code,
  traceOutdated,
  stepError,
  current,
  compact,
  onStepBack,
  onStepNext,
  onTogglePlay,
  onSeek,
  onStartStep,
  onJumpToLine,
}) => {
  const total = stepTrace.length;
  const line = current?.line ?? null;
  const lineText = line ? ((traceCode || code).split('\n')[line - 1] || '').trim() : '';
  const explanation = useMemo(() => {
    if (!line) return '';
    const exact = rows.find((r) => r.startLine === line);
    const covering = exact || rows.filter((r) => line >= r.startLine && line <= r.endLine).sort((a, b) => b.startLine - a.startLine)[0];
    return covering?.explanation || '';
  }, [rows, line]);
  const isErrorStep = !!stepError && stepIndex === total - 1;
  const theme = useTheme3D();
  const light = theme.name === 'light';

  return (
    <div className="shrink-0 border-t px-3 py-2.5" style={{ background: light ? '#ffffff' : '#0d1324', borderColor: theme.chromeBorder }}>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          <IconBtn label="Previous step" onClick={onStepBack} disabled={stepIndex <= 0}>
            <SkipBack className="w-3.5 h-3.5" />
          </IconBtn>
          <button
            onClick={onTogglePlay}
            aria-label={isPlaying ? 'Pause' : 'Play'}
            className="w-8 h-8 rounded-full bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center shadow"
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-white ml-0.5" />}
          </button>
          <IconBtn label="Next step" onClick={onStepNext} disabled={stepIndex >= total - 1}>
            <SkipForward className="w-3.5 h-3.5" />
          </IconBtn>
        </div>
        <input
          type="range"
          min={0}
          max={Math.max(0, total - 1)}
          value={stepIndex}
          onChange={(e) => onSeek(Number(e.target.value))}
          aria-label="Step"
          className="flex-1 accent-blue-500 h-1.5 cursor-pointer"
        />
        <span className={`text-[11px] font-mono shrink-0 w-[74px] text-right ${theme.floorTextMuted}`}>
          {stepIndex + 1} / {total}
        </span>
        {traceOutdated && (
          <button onClick={onStartStep} className={`inline-flex items-center gap-1 text-[11px] font-semibold shrink-0 ${light ? 'text-amber-700 hover:text-amber-800' : 'text-amber-300 hover:text-amber-200'}`} title="The code changed — record again">
            <RefreshCw className="w-3 h-3" /> Re-record
          </button>
        )}
      </div>
      {!compact && line && (
        <button
          onClick={() => onJumpToLine(line)}
          className={`mt-2 w-full text-left rounded-lg border px-3 py-2 transition-colors ${
            light ? 'bg-slate-50 border-slate-200 hover:border-slate-300' : 'bg-black/30 border-white/10 hover:border-white/20'
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            <span
              className={`text-[10px] font-mono font-bold rounded border px-1.5 py-0.5 shrink-0 ${
                light ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
              }`}
            >
              L{line}
            </span>
            <code className={`text-[12.5px] font-mono truncate ${light ? 'text-slate-800' : 'text-slate-100'}`}>{lineText}</code>
          </div>
          {explanation && <p className={`mt-1 text-xs truncate ${theme.floorTextMuted}`}>{explanation}</p>}
        </button>
      )}
      {isErrorStep && stepError && (
        <div className={`mt-2 flex items-start gap-2 rounded-lg border px-3 py-2 text-xs ${light ? 'border-rose-200 bg-rose-50 text-rose-800' : 'border-rose-500/30 bg-rose-500/10 text-rose-100'}`}>
          <AlertTriangle className="w-3.5 h-3.5 text-rose-400 mt-0.5 shrink-0" />
          <span>
            <span className="font-bold">{stepError.type}</span> on line {stepError.line}: {stepError.meaning}
          </span>
        </div>
      )}
    </div>
  );
};

const IconBtn: React.FC<{ label: string; onClick: () => void; disabled?: boolean; children: React.ReactNode }> = ({ label, onClick, disabled, children }) => {
  const theme = useTheme3D();
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={`w-7 h-7 rounded-md flex items-center justify-center disabled:opacity-30 disabled:hover:bg-transparent ${theme.button}`}
    >
      {children}
    </button>
  );
};
