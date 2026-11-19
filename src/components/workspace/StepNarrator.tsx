import React, { useMemo } from 'react';
import { Footprints, ArrowRight, AlertTriangle } from 'lucide-react';
import type { TraceStep, WorkerErrorInfo } from '../../utils/pyodideRunner';

interface NarratorRow {
  startLine: number;
  endLine: number;
  explanation: string;
  tag: string;
}

interface StepNarratorProps {
  currentStep: TraceStep | null;
  prevStep: TraceStep | null;
  stepIndex: number;
  totalSteps: number;
  code: string;
  rows: NarratorRow[];
  error: WorkerErrorInfo | null;
  isErrorStep: boolean;
  isOutdated: boolean;
  mode: 'full' | 'compact';
  onJumpToLine: (line: number) => void;
}

interface VarChange {
  name: string;
  kind: 'new' | 'changed';
  from?: string;
  to: string;
}

const clip = (v: string, n = 28) => (v.length > n ? `${v.slice(0, n - 1)}…` : v);

/**
 * "Now running" bar shown during step-by-step execution. It ties together the
 * current line, its plain-English explanation and the variables that changed.
 */
export const StepNarrator: React.FC<StepNarratorProps> = ({
  currentStep,
  prevStep,
  stepIndex,
  totalSteps,
  code,
  rows,
  error,
  isErrorStep,
  isOutdated,
  mode,
  onJumpToLine,
}) => {
  const line = currentStep?.line ?? null;

  const lineCode = useMemo(() => (line ? (code.split('\n')[line - 1] || '').trim() : ''), [code, line]);

  const explanation = useMemo(() => {
    if (!line) return '';
    const exact = rows.find((r) => r.startLine === line);
    const covering = exact || rows.filter((r) => line >= r.startLine && line <= r.endLine).sort((a, b) => b.startLine - a.startLine)[0];
    return covering?.explanation || '';
  }, [rows, line]);

  const changes = useMemo<VarChange[]>(() => {
    if (!currentStep) return [];
    const now = currentStep.locals || {};
    const before = prevStep?.locals || {};
    const out: VarChange[] = [];
    for (const [key, v] of Object.entries(now)) {
      if (v.isMeta || key.startsWith('__')) continue;
      const prev = before[key];
      if (!prev) out.push({ name: v.name || key, kind: 'new', to: v.value });
      else if (prev.value !== v.value) out.push({ name: v.name || key, kind: 'changed', from: prev.value, to: v.value });
    }
    return out;
  }, [currentStep, prevStep]);

  if (!currentStep) return null;

  return (
    <div
      className={`shrink-0 border-t ws-border ws-bg-surface px-3 ${mode === 'compact' ? 'py-1.5' : 'py-2.5'} text-xs select-none`}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-3 min-w-0 flex-wrap">
        <span className="flex items-center gap-1.5 ws-tx-amber font-bold shrink-0">
          <Footprints className="w-3.5 h-3.5" />
          Step {stepIndex + 1}/{totalSteps}
        </span>

        {line && (
          <button
            onClick={() => onJumpToLine(line)}
            className="flex items-center gap-1.5 min-w-0 shrink-0 hover:opacity-80"
            title="Show this line in the editor"
          >
            <span className="px-1.5 py-0.5 rounded bg-amber-500/20 ws-tx-amber-soft border border-amber-500/30 font-mono font-bold">L{line}</span>
            <code className="font-mono ws-tx-emerald truncate max-w-[260px]">{lineCode}</code>
          </button>
        )}

        {mode === 'full' && explanation && (
          <span className="flex items-center gap-1.5 min-w-0 flex-1 ws-text-body">
            <ArrowRight className="w-3.5 h-3.5 ws-text-faint shrink-0" />
            <span className="truncate" title={explanation}>{explanation}</span>
          </span>
        )}

        {isOutdated && (
          <span className="ml-auto text-[11px] ws-tx-amber bg-amber-500/10 border border-amber-500/30 rounded px-2 py-0.5 shrink-0">
            Code changed — restart step mode to trace the new version
          </span>
        )}
      </div>

      {(changes.length > 0 || (isErrorStep && error)) && (
        <div className={`flex items-center gap-1.5 flex-wrap ${mode === 'compact' ? 'mt-1' : 'mt-2'}`}>
          {changes.slice(0, mode === 'compact' ? 4 : 8).map((c) => (
            <span
              key={c.name}
              className={`inline-flex items-center gap-1 font-mono text-[11px] px-2 py-0.5 rounded border animate-in fade-in duration-300 ${
                c.kind === 'new'
                  ? 'bg-emerald-500/10 border-emerald-500/30 ws-tx-emerald-soft'
                  : 'bg-sky-500/10 border-sky-500/30 ws-tx-sky-soft'
              }`}
              title={c.kind === 'new' ? 'New variable' : 'Value changed'}
            >
              <span className="font-bold">{c.name}</span>
              {c.kind === 'changed' ? (
                <>
                  <span className="ws-text-muted line-through decoration-slate-500/60">{clip(c.from || '')}</span>
                  <ArrowRight className="w-3 h-3 ws-text-faint" />
                  <span>{clip(c.to)}</span>
                </>
              ) : (
                <>
                  <span className="ws-text-faint">=</span>
                  <span>{clip(c.to)}</span>
                  <span className="text-[9px] uppercase font-sans font-bold ws-tx-emerald ml-0.5">new</span>
                </>
              )}
            </span>
          ))}
          {changes.length > (mode === 'compact' ? 4 : 8) && (
            <span className="text-[11px] ws-text-faint">+{changes.length - (mode === 'compact' ? 4 : 8)} more</span>
          )}
          {isErrorStep && error && (
            <span className="inline-flex items-center gap-1.5 text-[11px] ws-tx-rose-soft bg-rose-500/10 border border-rose-500/30 rounded px-2 py-0.5">
              <AlertTriangle className="w-3 h-3 ws-tx-rose" />
              <span className="font-bold">{error.type}</span>
              <span className="truncate max-w-[360px]">{error.meaning}</span>
            </span>
          )}
        </div>
      )}
    </div>
  );
};
