import React, { useState } from 'react';
import { TraceStep, WorkerErrorInfo } from '../utils/pyodideRunner';
import {
  Layers,
  Variable,
  AlertTriangle,
  Repeat,
  ArrowRight,
  CornerDownRight,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';

interface StepInspectorProps {
  currentStep: TraceStep | null;
  prevStep: TraceStep | null;
  stepIndex: number;
  totalSteps: number;
  error: WorkerErrorInfo | null;
  isErrorStep: boolean;
  isTraceOutdated?: boolean;
  onJumpToLine?: (line: number) => void;
}

const DATA_TYPES = new Set([
  'int',
  'float',
  'complex',
  'bool',
  'str',
  'bytes',
  'bytearray',
  'list',
  'tuple',
  'set',
  'frozenset',
  'dict',
  'NoneType',
  'type(None)',
]);

function isDataVariable(
  name: string,
  entry?: { type: string; isMeta?: boolean; isInstance?: boolean }
): boolean {
  if (name.startsWith('__')) return false;
  if (!entry) return true;
  if (entry.isMeta === true) return false;
  if (entry.isMeta === false) return true;
  if (DATA_TYPES.has(entry.type)) return true;
  const metaTypes = [
    'module',
    'type',
    'class',
    'function',
    'builtin_function_or_method',
    'method',
    'classmethod',
    'staticmethod',
    'property',
    'ABCMeta',
    'typing',
    '_SpecialForm',
    '_GenericAlias',
    '_UnionGenericAlias',
  ];
  if (metaTypes.some((m) => entry.type === m || entry.type.endsWith(m))) {
    return false;
  }
  return true;
}

function truncate(s: string, n = 40): string {
  if (!s) return '';
  return s.length > n ? s.slice(0, n) + '…' : s;
}

function cleanDisplayValue(val: string): string {
  if (!val) return '';
  // Remove internal paths like /lib/python312.zip
  return val.replace(/<[^>]*\/lib\/python[^>]*>/g, '<module>');
}

function formatFrame(frame: {
  function: string;
  args: Record<string, string>;
  line: number;
}): { display: string; fullDisplay: string } {
  if (
    frame.function === '<module>' ||
    frame.function === 'Global' ||
    frame.function === 'Global (main program)'
  ) {
    return {
      display: 'Global (main program)',
      fullDisplay: 'Global (main program)',
    };
  }

  const argPairs: string[] = [];
  const fullArgPairs: string[] = [];
  for (const [k, v] of Object.entries(frame.args || {})) {
    if (k === 'self') {
      argPairs.push('self');
      fullArgPairs.push('self');
    } else {
      const truncatedVal = truncate(v, 40);
      argPairs.push(`${k}=${truncatedVal}`);
      fullArgPairs.push(`${k}=${v}`);
    }
  }

  const display = `${frame.function}(${argPairs.join(', ')})`;
  const fullDisplay = `${frame.function}(${fullArgPairs.join(', ')})`;
  return { display, fullDisplay };
}

/** Expandable object instance row */
const ObjectInstanceRow: React.FC<{
  name: string;
  curr: {
    name: string;
    type: string;
    value: string;
    attrs?: Record<string, { name: string; type: string; value: string }>;
  };
  prev?: {
    name: string;
    type: string;
    value: string;
    attrs?: Record<string, { name: string; type: string; value: string }>;
  };
  isNew: boolean;
  isChanged: boolean;
}> = ({ name, curr, prev, isNew, isChanged }) => {
  const [expanded, setExpanded] = useState(false);
  const attrs = curr.attrs;
  const hasAttrs = attrs && Object.keys(attrs).length > 0;

  return (
    <>
      <tr
        className={`transition-colors ${
          isChanged || isNew ? 'bg-amber-500/10' : 'hover:bg-[#161b22]'
        }`}
      >
        <td className="py-1 px-2.5 font-mono font-bold text-slate-200">
          <button
            type="button"
            className="flex items-center gap-1 hover:text-white"
            onClick={() => hasAttrs && setExpanded((e) => !e)}
            title={
              hasAttrs
                ? expanded
                  ? 'Collapse attributes'
                  : 'Expand attributes'
                : undefined
            }
            disabled={!hasAttrs}
          >
            {hasAttrs ? (
              expanded ? (
                <ChevronDown className="w-3 h-3 text-amber-400" />
              ) : (
                <ChevronRight className="w-3 h-3 text-slate-400" />
              )
            ) : (
              <span className="w-3" />
            )}
            <span>{name}</span>
          </button>
        </td>
        <td className="py-1 px-2.5 font-mono text-slate-400 text-[11px]">
          {curr.type.endsWith('object') ? curr.type : `${curr.type} object`}
        </td>
        <td className="py-1 px-2.5 font-mono">
          {isChanged ? (
            <div className="flex items-center gap-1.5">
              <span
                className="px-1.5 py-0.2 rounded bg-amber-500/25 text-amber-200 font-bold border border-amber-500/40 animate-pulse"
                title={curr.value}
              >
                {truncate(curr.value, 36)}
              </span>
              <span className="text-[10px] text-slate-500 line-through">
                {truncate(prev?.value || '', 24)}
              </span>
            </div>
          ) : isNew ? (
            <span
              className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30"
              title={curr.value}
            >
              {truncate(curr.value, 36)}
            </span>
          ) : (
            <span className="text-slate-300" title={curr.value}>
              {truncate(curr.value, 36)}
            </span>
          )}
        </td>
      </tr>
      {expanded &&
        attrs &&
        Object.entries(attrs).map(([attrName, attrVal]) => {
          const prevAttr = prev?.attrs?.[attrName];
          const attrNew = prevAttr === undefined;
          const attrChanged = !attrNew && prevAttr.value !== attrVal.value;

          return (
            <tr
              key={`${name}.${attrName}`}
              className={`transition-colors ${
                attrChanged || attrNew ? 'bg-amber-500/08' : 'bg-[#0d1117]/60'
              }`}
            >
              <td className="py-0.5 px-2.5 pl-8 font-mono text-slate-400 text-[11px]">
                ↳ {attrName}
              </td>
              <td className="py-0.5 px-2.5 font-mono text-slate-500 text-[10px]">
                {attrVal.type}
              </td>
              <td className="py-0.5 px-2.5 font-mono text-[11px]">
                {attrChanged ? (
                  <span
                    className="text-amber-300 animate-pulse font-semibold"
                    title={attrVal.value}
                  >
                    {truncate(attrVal.value, 32)}
                  </span>
                ) : attrNew ? (
                  <span
                    className="text-emerald-300 font-semibold"
                    title={attrVal.value}
                  >
                    {truncate(attrVal.value, 32)}
                  </span>
                ) : (
                  <span className="text-slate-300" title={attrVal.value}>
                    {truncate(attrVal.value, 32)}
                  </span>
                )}
              </td>
            </tr>
          );
        })}
    </>
  );
};

export const StepInspector: React.FC<StepInspectorProps> = ({
  currentStep,
  prevStep,
  stepIndex,
  totalSteps,
  error,
  isErrorStep,
  isTraceOutdated = false,
  onJumpToLine,
}) => {
  const [showImports, setShowImports] = useState<boolean>(() => {
    try {
      return localStorage.getItem('nexus_step_show_imports') === 'true';
    } catch {
      return false;
    }
  });

  const toggleShowImports = () => {
    setShowImports((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('nexus_step_show_imports', String(next));
      } catch {}
      return next;
    });
  };

  // If code changed and trace is outdated, show clear notice and clear variables/stack
  if (isTraceOutdated) {
    return (
      <div className="p-4 bg-[#161b22] border-t border-[#30363d] text-xs">
        <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/15 border border-amber-500/40 text-amber-300">
          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
          <div>
            <p className="font-semibold text-amber-200">Code changed.</p>
            <p className="text-amber-300/90 text-[11px] mt-0.5">
              Press <span className="font-bold underline">Step</span> to start again from step 1.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!currentStep && !error) {
    return (
      <div className="p-4 text-center text-slate-400 text-xs">
        <p className="font-semibold text-slate-300 mb-1">Step Mode Idle</p>
        <p>
          Click <span className="text-amber-400 font-bold">Step</span> (or press F10) to begin step-by-step program execution.
        </p>
      </div>
    );
  }

  const currentLocals = currentStep?.locals || {};
  const prevLocals = prevStep?.locals || {};
  const allVarNames = Object.keys(currentLocals).filter(
    (n) => !n.startsWith('__')
  );

  // Filter visible variables
  const dataVarNames = allVarNames.filter((n) =>
    isDataVariable(n, currentLocals[n])
  );
  const visibleVarNames = showImports ? allVarNames : dataVarNames;

  return (
    <div className="flex flex-col gap-3 p-3 bg-[#161b22] border-t border-[#30363d] text-xs">
      {/* ─── Top Status Strip: Step Counter, Current Line, Loop Counter ─── */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#21262d] pb-2">
        <div className="flex items-center gap-2">
          <span
            title="Rows = statements explained. Steps = lines actually executed."
            className="px-2 py-0.5 rounded font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30"
          >
            Step {stepIndex + 1} of {totalSteps}
          </span>
          {currentStep && (
            <button
              onClick={() => onJumpToLine?.(currentStep.line)}
              className="text-slate-300 hover:text-white underline decoration-slate-600 underline-offset-2 flex items-center gap-1 font-mono"
              title="Jump to line in editor"
              aria-label={`Jump to line ${currentStep.line}`}
            >
              <span>Line {currentStep.line}</span>
              <CornerDownRight className="w-3 h-3 text-slate-400" />
            </button>
          )}
        </div>

        {/* Loop Iteration Counter */}
        {currentStep?.loopInfo && (
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-blue-500/15 border border-blue-500/30 text-blue-300 font-medium">
            <Repeat className="w-3.5 h-3.5 text-blue-400 animate-spin-slow" />
            <span>{currentStep.loopInfo}</span>
          </div>
        )}
      </div>

      {/* ─── Error Card if at Failing Step ─── */}
      {isErrorStep && error && (
        <div className="p-3 bg-red-950/40 border border-red-500/40 rounded-lg text-red-200 space-y-1.5 animate-fadeIn">
          <div className="flex items-center gap-2 font-bold text-red-400 text-xs">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span>
              Runtime Error: {error.type} (Line {error.line})
            </span>
          </div>
          <p className="text-slate-300 text-xs leading-relaxed">
            {error.meaning || error.message}
          </p>
          {error.hint && (
            <div className="mt-1 p-2 bg-[#0d1117] border border-red-500/20 rounded text-[11px] text-amber-300/90 font-mono">
              <span className="font-sans font-bold text-amber-400">Fix Hint: </span>
              {error.hint}
            </div>
          )}
        </div>
      )}

      {/* ─── Active Call Stack ─── */}
      {currentStep?.stack && currentStep.stack.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 text-slate-400 font-semibold mb-1">
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
            <span>Call Stack:</span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {currentStep.stack.map((frame, idx) => {
              const isTop = idx === currentStep.stack.length - 1;
              const { display, fullDisplay } = formatFrame(frame);
              return (
                <div
                  key={idx}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded border text-[11px] font-mono ${
                    isTop
                      ? 'bg-indigo-600/25 border-indigo-500/50 text-indigo-200 font-bold'
                      : 'bg-[#21262d] border-[#30363d] text-slate-400'
                  }`}
                  title={fullDisplay}
                >
                  <span>{display}</span>
                  {idx < currentStep.stack.length - 1 && (
                    <ArrowRight className="w-2.5 h-2.5 text-slate-500 ml-0.5" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── Variables Table ─── */}
      <div>
        <div className="flex items-center justify-between text-slate-400 font-semibold mb-1">
          <div className="flex items-center gap-1.5">
            <Variable className="w-3.5 h-3.5 text-emerald-400" />
            <span>Variables in Scope:</span>
            <span
              className="text-[10px] text-slate-500 ml-1 font-mono"
              title="Count of currently visible variables"
            >
              {visibleVarNames.length} active
            </span>
          </div>
          <button
            onClick={toggleShowImports}
            title="Toggle showing imports, classes and functions in scope"
            className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${
              showImports
                ? 'bg-blue-600/20 border-blue-500/40 text-blue-300'
                : 'border-[#30363d] text-slate-400 hover:text-slate-200 hover:bg-[#21262d]'
            }`}
          >
            {showImports
              ? 'Hide imports & classes'
              : 'Show imports, classes and functions'}
          </button>
        </div>

        {visibleVarNames.length === 0 ? (
          <div className="py-3 text-center text-slate-500 italic bg-[#0d1117] rounded border border-[#30363d]">
            No variables yet.
          </div>
        ) : (
          <div className="overflow-x-auto rounded border border-[#30363d] bg-[#0d1117]">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#30363d] bg-[#161b22] text-slate-400">
                  <th className="py-1 px-2.5 font-semibold">Name</th>
                  <th className="py-1 px-2.5 font-semibold">Type</th>
                  <th className="py-1 px-2.5 font-semibold">Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#21262d]">
                {visibleVarNames.map((name) => {
                  const curr = currentLocals[name];
                  const prev = prevLocals[name];
                  const isNew = prev === undefined;
                  const isChanged = !isNew && prev.value !== curr.value;

                  // Check if object instance (has attrs or marked as instance)
                  if (curr.isInstance || (curr.attrs && Object.keys(curr.attrs).length > 0)) {
                    return (
                      <ObjectInstanceRow
                        key={name}
                        name={name}
                        curr={curr}
                        prev={prev}
                        isNew={isNew}
                        isChanged={isChanged}
                      />
                    );
                  }

                  const displayVal = cleanDisplayValue(curr.value);
                  const prevDisplayVal = cleanDisplayValue(prev?.value || '');

                  return (
                    <tr
                      key={name}
                      className={`transition-colors ${
                        isChanged || isNew
                          ? 'bg-amber-500/10'
                          : 'hover:bg-[#161b22]'
                      }`}
                    >
                      <td className="py-1 px-2.5 font-mono font-bold text-slate-200">
                        {name}
                      </td>
                      <td className="py-1 px-2.5 font-mono text-slate-400 text-[11px]">
                        {curr.type}
                      </td>
                      <td className="py-1 px-2.5 font-mono">
                        {isChanged ? (
                          <div className="flex items-center gap-1.5">
                            <span
                              className="px-1.5 py-0.2 rounded bg-amber-500/25 text-amber-200 font-bold border border-amber-500/40 animate-pulse"
                              title={displayVal}
                            >
                              {truncate(displayVal, 36)}
                            </span>
                            <span className="text-[10px] text-slate-500 line-through">
                              {truncate(prevDisplayVal, 24)}
                            </span>
                          </div>
                        ) : isNew ? (
                          <span
                            className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30"
                            title={displayVal}
                          >
                            {truncate(displayVal, 36)}
                          </span>
                        ) : (
                          <span className="text-slate-300" title={displayVal}>
                            {truncate(displayVal, 36)}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
