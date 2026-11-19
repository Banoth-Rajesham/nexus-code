import React, { useState } from 'react';
import { AlertOctagon, Lightbulb, CornerDownRight, Wrench, ChevronDown, ChevronRight } from 'lucide-react';
import type { FriendlyError } from '../../utils/friendlyErrors';

interface FriendlyErrorCardProps {
  error: FriendlyError;
  mode: 'full' | 'summary' | 'compact';
  lineCode?: string;
  onJumpToLine: (line: number) => void;
  onQuickFix?: () => void;
}

/** Plain-English explanation of a failed run, shown above the raw output. */
export const FriendlyErrorCard: React.FC<FriendlyErrorCardProps> = ({ error, mode, lineCode, onJumpToLine, onQuickFix }) => {
  const [expanded, setExpanded] = useState(mode !== 'compact');

  const actions = (
    <div className="flex items-center gap-2 flex-wrap">
      {error.line && (
        <button
          onClick={() => onJumpToLine(error.line!)}
          className="flex items-center gap-1 px-2.5 py-1 rounded ws-bg-elevated ws-hover-bg border ws-border ws-text-body text-[11px] font-semibold transition-colors"
        >
          <CornerDownRight className="w-3 h-3" /> Go to line {error.line}
        </button>
      )}
      {error.quickFix && onQuickFix && (
        <button
          onClick={onQuickFix}
          className="flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold transition-colors"
        >
          <Wrench className="w-3 h-3" /> {error.quickFix.label}
        </button>
      )}
    </div>
  );

  if (!expanded) {
    return (
      <div className="mb-3 flex items-center gap-2 flex-wrap rounded-md border border-rose-500/30 bg-rose-500/5 px-3 py-1.5 font-sans">
        <AlertOctagon className="w-3.5 h-3.5 ws-tx-rose shrink-0" />
        <span className="text-xs font-bold ws-tx-rose-soft">{error.title}</span>
        {error.line && <span className="text-[11px] ws-text-muted">line {error.line}</span>}
        <button onClick={() => setExpanded(true)} className="flex items-center gap-0.5 text-[11px] font-semibold ws-tx-sky ws-hover-tx-sky">
          <ChevronRight className="w-3 h-3" /> Explain
        </button>
        <div className="ml-auto">{actions}</div>
      </div>
    );
  }

  return (
    <div className="mb-3 rounded-lg border border-rose-500/30 bg-gradient-to-b from-rose-500/10 to-transparent font-sans overflow-hidden">
      <div className="flex items-start gap-3 px-3.5 pt-3">
        <span className="w-7 h-7 rounded-md bg-rose-500/15 border border-rose-500/30 flex items-center justify-center shrink-0">
          <AlertOctagon className="w-4 h-4 ws-tx-rose" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold ws-text-strong">{error.title}</span>
            {error.line && (
              <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-rose-500/20 ws-tx-rose-soft border border-rose-500/30">
                line {error.line}
              </span>
            )}
            <span className="text-[11px] font-mono ws-text-faint">{error.type}</span>
            {mode === 'compact' && (
              <button onClick={() => setExpanded(false)} className="ml-auto flex items-center gap-0.5 text-[11px] ws-text-muted ws-hover-strong">
                <ChevronDown className="w-3 h-3" /> Collapse
              </button>
            )}
          </div>
          <p className="text-[13px] ws-text-body leading-relaxed mt-1">{error.meaning}</p>
          {mode === 'full' && lineCode && error.line && (
            <pre className="mt-2 text-xs font-mono ws-bg-sunken border ws-border rounded px-2.5 py-1.5 ws-tx-rose-soft overflow-x-auto">
              <span className="ws-text-faint select-none mr-2">{error.line}</span>
              {lineCode}
            </pre>
          )}
        </div>
      </div>

      <div className="mx-3.5 mt-2.5 flex items-start gap-2 rounded-md bg-amber-500/10 border border-amber-500/25 px-2.5 py-2">
        <Lightbulb className="w-3.5 h-3.5 ws-tx-amber shrink-0 mt-0.5" />
        <p className="text-xs ws-tx-amber-soft leading-relaxed">{error.hint}</p>
      </div>

      <div className="px-3.5 py-2.5 mt-1 flex items-center justify-between gap-2 flex-wrap">
        {actions}
        {mode === 'full' && <span className="text-[10px] ws-text-faint">The full error message is shown below.</span>}
      </div>
    </div>
  );
};
