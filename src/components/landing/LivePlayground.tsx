import React, { useEffect, useRef, useState } from 'react';
import { Play, RotateCcw, Loader2, ExternalLink, Terminal, ListOrdered, CheckCircle2, XCircle, AlertOctagon, Lightbulb } from 'lucide-react';
import { runPythonInWorker } from '../../utils/pyodideRunner';
import { parsePythonFallback, parsePythonWithTreeSitter, StatementExplanationRow } from '../../utils/pythonTreeSitterEngine';
import { explainRunError, FriendlyError } from '../../utils/friendlyErrors';

interface Example {
  key: string;
  label: string;
  code: string;
}

const EXAMPLES: Example[] = [
  {
    key: 'loops',
    label: 'Loops',
    code: `marks = [72, 85, 90, 64]
total = 0
for m in marks:
    total = total + m
print("Total:", total)
print("Average:", total / len(marks))`,
  },
  {
    key: 'conditions',
    label: 'If / else',
    code: `temperature = 31
if temperature > 30:
    print("It's hot. Drink water!")
elif temperature > 20:
    print("Nice weather today.")
else:
    print("Take a jacket.")`,
  },
  {
    key: 'functions',
    label: 'Functions',
    code: `def grade(score):
    if score >= 90:
        return "A"
    if score >= 75:
        return "B"
    return "C"

for s in [95, 80, 60]:
    print(s, "->", grade(s))`,
  },
  {
    key: 'error',
    label: 'Fix an error',
    code: `price = 250
quantity = 3
total = price * quantity
print("You pay:", totl)`,
  },
];

const TAG_CLASS: Record<string, string> = {
  LOOP: 'text-amber-700 bg-amber-50 border-amber-200',
  CONDITION: 'text-indigo-700 bg-indigo-50 border-indigo-200',
  FUNCTION: 'text-violet-700 bg-violet-50 border-violet-200',
  RETURN: 'text-violet-700 bg-violet-50 border-violet-200',
  ERROR: 'text-rose-700 bg-rose-50 border-rose-200',
};

interface LivePlaygroundProps {
  onOpenInWorkspace: (code: string, title: string) => void;
}

/** A real, working mini-workspace: runs Python in the browser and explains it with the actual engine. */
export const LivePlayground: React.FC<LivePlaygroundProps> = ({ onOpenInWorkspace }) => {
  const [exampleKey, setExampleKey] = useState(EXAMPLES[0].key);
  const [code, setCode] = useState(EXAMPLES[0].code);
  const [tab, setTab] = useState<'explain' | 'output'>('explain');
  const [rows, setRows] = useState<StatementExplanationRow[]>(() => parsePythonFallback(EXAMPLES[0].code).rows);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<{ output: string; success: boolean; timeMs: number } | null>(null);
  const [friendly, setFriendly] = useState<FriendlyError | null>(null);
  const [hoverLine, setHoverLine] = useState<number | null>(null);
  const [firstRun, setFirstRun] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);

  // Live explanations as you type (debounced, same engine as the workspace)
  useEffect(() => {
    const t = setTimeout(async () => {
      try {
        const res = await parsePythonWithTreeSitter(code);
        setRows(res.rows);
      } catch {
        setRows(parsePythonFallback(code).rows);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [code]);

  const loadExample = (ex: Example) => {
    setExampleKey(ex.key);
    setCode(ex.code);
    setResult(null);
    setFriendly(null);
    setTab('explain');
  };

  const run = async () => {
    if (running || !code.trim()) return;
    setRunning(true);
    setTab('output');
    setFriendly(null);
    try {
      const res = await runPythonInWorker(code, []);
      setResult({ output: res.output, success: res.success, timeMs: res.timeMs });
      setFriendly(res.success ? null : explainRunError(res.output, 'python', code));
    } catch (err: any) {
      setResult({ output: `Could not run the program: ${err?.message || 'unknown error'}`, success: false, timeMs: 0 });
    } finally {
      setRunning(false);
      setFirstRun(false);
    }
  };

  const fixError = () => {
    if (!friendly?.quickFix?.replacement || !friendly.line) return;
    const lines = code.split('\n');
    const { from, to } = friendly.quickFix.replacement;
    lines[friendly.line - 1] = lines[friendly.line - 1].replace(new RegExp(`\\b${from}\\b`, 'g'), to);
    setCode(lines.join('\n'));
    setFriendly(null);
    setResult(null);
    setTab('explain');
  };

  const lineCount = code.split('\n').length;
  const example = EXAMPLES.find((e) => e.key === exampleKey);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-[0_20px_50px_-24px_rgba(15,23,42,0.3)] overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-slate-200 bg-slate-50/70">
        <div className="flex items-center gap-1 p-1 rounded-lg bg-white border border-slate-200 overflow-x-auto max-w-full" role="tablist" aria-label="Example programs">
          {EXAMPLES.map((ex) => (
            <button
              key={ex.key}
              role="tab"
              aria-selected={exampleKey === ex.key}
              onClick={() => loadExample(ex)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-colors ${
                exampleKey === ex.key ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {ex.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => example && loadExample(example)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset
          </button>
          <button
            onClick={run}
            disabled={running || !code.trim()}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white text-xs font-bold shadow-sm transition-colors"
            title="Run (Ctrl+Enter)"
          >
            {running ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-white" />}
            {running ? 'Running…' : 'Run code'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2">
        {/* Editor */}
        <div className="relative bg-[#1e1e1e] min-h-[300px] flex">
          <div
            ref={gutterRef}
            className="select-none text-right font-mono text-[13px] leading-[22px] text-[#6e7681] py-4 pl-3 pr-3 overflow-hidden shrink-0"
            aria-hidden="true"
          >
            {Array.from({ length: Math.max(lineCount, 12) }).map((_, i) => (
              <div key={i} className={hoverLine === i + 1 ? 'text-white' : ''}>
                {i + 1}
              </div>
            ))}
          </div>
          <textarea
            ref={textareaRef}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onScroll={(e) => {
              if (gutterRef.current) gutterRef.current.scrollTop = e.currentTarget.scrollTop;
            }}
            onKeyDown={(e) => {
              if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                run();
              } else if (e.key === 'Tab') {
                e.preventDefault();
                const el = e.currentTarget;
                const s = el.selectionStart;
                const next = code.slice(0, s) + '    ' + code.slice(el.selectionEnd);
                setCode(next);
                requestAnimationFrame(() => el.setSelectionRange(s + 4, s + 4));
              }
            }}
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
            aria-label="Python code editor"
            className="flex-1 bg-transparent text-[#d4d4d4] caret-white font-mono text-[13px] leading-[22px] py-4 pr-4 resize-none outline-none whitespace-pre overflow-auto"
          />
          <div className="absolute bottom-2 right-3 text-[11px] font-medium text-slate-400 pointer-events-none hidden sm:block">
            Edit the code · Ctrl+Enter to run
          </div>
        </div>

        {/* Results */}
        <div className="flex flex-col min-h-[300px] border-t lg:border-t-0 lg:border-l border-slate-200">
          <div className="flex items-center gap-1 px-3 pt-3 border-b border-slate-200" role="tablist" aria-label="Result view">
            {[
              { key: 'explain' as const, label: 'Explanation', icon: ListOrdered },
              { key: 'output' as const, label: 'Output', icon: Terminal },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                role="tab"
                aria-selected={tab === key}
                onClick={() => setTab(key)}
                className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 -mb-px transition-colors ${
                  tab === key ? 'border-blue-600 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" /> {label}
                {key === 'output' && result && (
                  <span className={`w-1.5 h-1.5 rounded-full ${result.success ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                )}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto max-h-[360px] p-3">
            {tab === 'explain' ? (
              rows.length === 0 ? (
                <p className="text-sm text-slate-500 p-4 text-center">Type some Python on the left to see each line explained.</p>
              ) : (
                <ol className="space-y-1.5">
                  {rows.map((r, i) => (
                    <li
                      key={`${r.startLine}-${i}`}
                      onMouseEnter={() => setHoverLine(r.startLine)}
                      onMouseLeave={() => setHoverLine(null)}
                      style={{ marginLeft: Math.min(r.depth, 3) * 14 }}
                      className={`flex items-start gap-2.5 rounded-lg border px-3 py-2 transition-colors ${
                        hoverLine === r.startLine ? 'border-blue-300 bg-blue-50/60' : 'border-slate-200 bg-white'
                      }`}
                    >
                      <span className="text-[10px] font-mono font-semibold rounded bg-slate-100 text-slate-500 px-1.5 py-0.5 mt-0.5 shrink-0">
                        L{r.startLine}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <code className="text-[11.5px] font-mono text-slate-700 truncate max-w-full">{r.rawCode.split('\n')[0].trim()}</code>
                          <span className={`text-[9px] font-bold tracking-wider rounded border px-1.5 py-px ${TAG_CLASS[r.tag] || 'text-slate-500 bg-slate-50 border-slate-200'}`}>
                            {r.tag}
                          </span>
                        </div>
                        <p className="text-[13px] text-slate-800 leading-snug mt-0.5">{r.explanation}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              )
            ) : running ? (
              <div className="flex items-center gap-2.5 p-4 text-sm text-slate-600">
                <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                <span>
                  Running in your browser…
                  {firstRun && <span className="block text-xs text-slate-400">The first run loads Python (a few seconds).</span>}
                </span>
              </div>
            ) : result ? (
              <div className="space-y-3">
                <div className={`flex items-center gap-1.5 text-xs font-semibold ${result.success ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {result.success ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                  {result.success ? `Finished in ${result.timeMs} ms` : 'The program stopped with an error'}
                </div>
                {friendly && (
                  <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-3">
                    <div className="flex items-center gap-2">
                      <AlertOctagon className="w-4 h-4 text-rose-500" />
                      <span className="text-sm font-bold text-slate-900">{friendly.title}</span>
                      {friendly.line && <span className="text-[11px] font-mono text-rose-700 bg-white border border-rose-200 rounded px-1.5">line {friendly.line}</span>}
                    </div>
                    <p className="text-[13px] text-slate-700 mt-1">{friendly.meaning}</p>
                    <div className="mt-2 flex items-start gap-1.5 rounded-lg bg-amber-50 border border-amber-200 px-2.5 py-1.5">
                      <Lightbulb className="w-3.5 h-3.5 text-amber-600 mt-0.5 shrink-0" />
                      <p className="text-xs text-amber-900">{friendly.hint}</p>
                    </div>
                    {friendly.quickFix?.kind === 'rename' && (
                      <button onClick={fixError} className="mt-2.5 inline-flex items-center px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold">
                        {friendly.quickFix.label}
                      </button>
                    )}
                  </div>
                )}
                <pre className="rounded-lg bg-slate-900 text-slate-100 text-[12.5px] font-mono leading-relaxed p-3 whitespace-pre-wrap break-words">
                  {result.output || '(no output)'}
                </pre>
              </div>
            ) : (
              <div className="p-6 text-center">
                <p className="text-sm text-slate-600">Press <span className="font-semibold text-emerald-700">Run code</span> to see the output here.</p>
                <p className="text-xs text-slate-400 mt-1">Python runs privately in your browser — nothing to install.</p>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between gap-2 px-4 py-3 border-t border-slate-200 bg-slate-50/70">
            <span className="text-[11px] text-slate-500">Want step-by-step mode, flowcharts and lessons?</span>
            <button
              onClick={() => onOpenInWorkspace(code, example ? `${example.label.replace(/[^A-Za-z]+/g, '_').toLowerCase()}_example` : 'playground')}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 hover:text-blue-800 whitespace-nowrap"
            >
              Open in workspace <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
