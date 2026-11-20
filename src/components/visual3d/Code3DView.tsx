import React, { useEffect, useMemo, useState } from 'react';
import { Activity, Network, Play, Pause, SkipBack, SkipForward, Loader2, Footprints, AlertTriangle, RefreshCw, Sparkles, Box } from 'lucide-react';
import { DataWorld } from './DataWorld';
import { ArchitectureWorld } from './ArchitectureWorld';
import { RealisticThreeWorld } from './RealisticThreeWorld';
import { buildDataScene, detectPointers } from '../../utils/visual3d/dataScene';
import { analyzeArchitecture } from '../../utils/visual3d/architecture';
import type { TraceStep, WorkerErrorInfo } from '../../utils/pyodideRunner';
import { THEMES_3D, Theme3DContext, Theme3DName, useTheme3D } from './theme3d';

type Mode = 'data' | 'architecture';
type Engine3D = 'realistic' | 'classic';
const MODE_KEY = 'nexus_3d_mode';
const ENGINE_KEY = 'nexus_3d_engine';

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

/** "3D View" for the workspace: data in motion + architecture map. */
export const Code3DView: React.FC<Code3DViewProps> = (props) => {
  const { progLang, code, files, activeFileName, stepTrace, stepIndex, isStepMode } = props;
  const isPython = progLang === 'python';

  const [mode, setMode] = useState<Mode>(() => {
    try {
      const saved = localStorage.getItem(MODE_KEY);
      if (saved === 'data' || saved === 'architecture') return saved;
    } catch {}
    return 'data';
  });
  const effectiveMode: Mode = isPython ? mode : 'architecture';
  const changeMode = (m: Mode) => {
    setMode(m);
    try {
      localStorage.setItem(MODE_KEY, m);
    } catch {}
  };

  const [engine, setEngine] = useState<Engine3D>(() => {
    try {
      const saved = localStorage.getItem(ENGINE_KEY);
      if (saved === 'realistic' || saved === 'classic') return saved;
    } catch {}
    return 'realistic';
  });
  const changeEngine = (e: Engine3D) => {
    setEngine(e);
    try {
      localStorage.setItem(ENGINE_KEY, e);
    } catch {}
  };

  // Static analysis (debounced so typing stays smooth)
  const [archFiles, setArchFiles] = useState(files);
  useEffect(() => {
    const t = setTimeout(() => setArchFiles(files), 350);
    return () => clearTimeout(t);
  }, [files]);
  const archMap = useMemo(() => analyzeArchitecture(archFiles), [archFiles]);

  const pointers = useMemo(() => detectPointers(props.traceCode || code), [props.traceCode, code]);
  const current = isStepMode ? stepTrace[stepIndex] || null : null;
  const previous = isStepMode && stepIndex > 0 ? stepTrace[stepIndex - 1] : null;
  const scene = useMemo(() => buildDataScene(current, previous, pointers), [current, previous, pointers]);

  const activeLine = isStepMode && !props.traceOutdated ? current?.line ?? null : null;
  const theme = THEMES_3D[props.theme || 'dark'];

  return (
    <Theme3DContext.Provider value={theme}>
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden" style={{ background: theme.chromeBg }}>
      {/* Mode switch */}
      <div className="h-10 shrink-0 flex items-center justify-between gap-3 px-3 border-b" style={{ background: theme.chromeBg, borderColor: theme.chromeBorder }}>
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-1 rounded-lg border p-0.5 ${theme.tabGroup}`} role="tablist" aria-label="3D view mode">
            <ModeTab active={effectiveMode === 'data'} disabled={!isPython} onClick={() => changeMode('data')} icon={Activity} label="Data in motion" />
            <ModeTab active={effectiveMode === 'architecture'} onClick={() => changeMode('architecture')} icon={Network} label="Architecture" />
          </div>

          {effectiveMode === 'architecture' && (
            <div className="flex items-center gap-1 rounded-lg border border-slate-700/60 bg-slate-900/60 p-0.5" role="group" aria-label="3D rendering engine">
              <button
                type="button"
                onClick={() => changeEngine('realistic')}
                className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                  engine === 'realistic'
                    ? 'bg-blue-600 text-white shadow-sm font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Three.js WebGL Realistic PBR 3D"
              >
                <Sparkles className="w-3 h-3 text-cyan-300" />
                Realistic WebGL
              </button>
              <button
                type="button"
                onClick={() => changeEngine('classic')}
                className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                  engine === 'classic'
                    ? 'bg-blue-600 text-white shadow-sm font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Classic CSS 3D Boxes"
              >
                <Box className="w-3 h-3 text-slate-400" />
                Classic
              </button>
            </div>
          )}
        </div>

        <span className={`text-[11px] truncate hidden md:block ${theme.floorTextMuted}`}>
          {effectiveMode === 'data'
            ? 'Watch lists, pointers and values change at every step'
            : `${archMap.nodes.length} building blocks · ${archMap.edges.length} connections${activeLine ? ' · live' : ''}`}
        </span>
      </div>

      {effectiveMode === 'data' ? (
        !isStepMode || stepTrace.length === 0 ? (
          <DataEmptyState isTracing={props.isTracing} onStart={props.onStartStep} hasCode={!!code.trim()} />
        ) : (
          <>
            <DataWorld scene={scene} />
            <Transport {...props} current={current} />
          </>
        )
      ) : (
        <>
          {engine === 'realistic' ? (
            <RealisticThreeWorld
              mode="architecture"
              archMap={archMap}
              activeFile={activeFileName}
              activeLine={activeLine}
              onJumpToLine={props.onJumpToLine}
              theme={props.theme === 'light' ? 'light' : 'dark'}
              code={code}
              stepTrace={stepTrace}
              stepIndex={stepIndex}
              isStepMode={isStepMode}
              isPlaying={props.isPlaying}
              isTracing={props.isTracing}
              traceOutdated={props.traceOutdated}
              onStartStep={props.onStartStep}
              onStepNext={props.onStepNext}
              onStepBack={props.onStepBack}
              onTogglePlay={props.onTogglePlay}
              onSeek={props.onSeek}
            />
          ) : (
            <ArchitectureWorld
              map={archMap}
              activeFile={activeFileName}
              activeLine={activeLine}
              onJumpToLine={props.onJumpToLine}
            />
          )}
          {isStepMode && stepTrace.length > 0 && <Transport {...props} current={current} compact />}
        </>
      )}
    </div>
    </Theme3DContext.Provider>
  );
};

const ModeTab: React.FC<{ active: boolean; disabled?: boolean; onClick: () => void; icon: React.FC<{ className?: string }>; label: string }> = ({
  active,
  disabled,
  onClick,
  icon: Icon,
  label,
}) => {
  const theme = useTheme3D();
  return (
  <button
    role="tab"
    aria-selected={active}
    disabled={disabled}
    onClick={onClick}
    title={disabled ? 'Data in motion is available for Python programs' : label}
    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
      active ? 'bg-blue-600 text-white shadow-sm' : theme.tabIdle
    }`}
  >
    <Icon className="w-3.5 h-3.5" /> {label}
  </button>
  );
};

const DataEmptyState: React.FC<{ isTracing: boolean; onStart: () => void; hasCode: boolean }> = ({ isTracing, onStart, hasCode }) => {
  const theme = useTheme3D();
  const light = theme.name === 'light';
  return (
  <div className="flex-1 flex items-center justify-center p-6" style={{ background: theme.sceneBg }}>
    <div className="max-w-md text-center">
      {/* mini preview */}
      <div className="mx-auto mb-6 flex items-end justify-center gap-2" aria-hidden="true" style={{ perspective: 600 }}>
        {['1', '3', '0', '7', '0'].map((v, i) => (
          <div
            key={i}
            className={`w-10 h-10 rounded-md flex items-center justify-center font-mono font-bold text-white border ${
              v === '0'
                ? light
                  ? 'bg-slate-200 border-slate-300 text-slate-500'
                  : 'bg-slate-500/30 border-slate-400/40 text-slate-300'
                : i === 1
                  ? 'bg-amber-500 border-amber-300'
                  : 'bg-blue-600 border-blue-300/50'
            }`}
            style={{ transform: 'rotateX(25deg)', boxShadow: i === 1 ? '0 0 20px #f59e0b88' : light ? '0 8px 16px rgba(15,23,42,0.15)' : '0 8px 16px rgba(0,0,0,0.35)' }}
          >
            {v}
          </div>
        ))}
      </div>
      <h3 className={`text-lg font-bold ${light ? 'text-slate-900' : 'text-white'}`}>Watch your data move in 3D</h3>
      <p className={`mt-2 text-sm leading-relaxed ${theme.floorTextMuted}`}>
        Lists become boxes, index variables like <code className={light ? 'text-cyan-700' : 'text-cyan-300'}>i</code>,{' '}
        <code className={light ? 'text-pink-700' : 'text-pink-300'}>left</code> or <code className={light ? 'text-lime-700' : 'text-lime-300'}>write</code> become
        pointers, and every change lights up as the program runs.
      </p>
      <button
        onClick={onStart}
        disabled={isTracing || !hasCode}
        className="mt-6 inline-flex items-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white text-sm font-semibold px-5 py-2.5 shadow-lg shadow-blue-600/25"
      >
        {isTracing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Footprints className="w-4 h-4" />}
        {isTracing ? 'Recording the program…' : 'Record & visualize'}
      </button>
      <p className={`mt-2 text-[11px] ${theme.hint}`}>Runs your program step by step in the browser.</p>
    </div>
  </div>
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
