import React from 'react';
import { Play, Footprints, ArrowRight, AlertOctagon, Lightbulb, Sprout } from 'lucide-react';

// Syntax colours for the static preview (matches the workspace's dark editor)
const K = ({ children }: { children: React.ReactNode }) => <span className="text-[#c586c0]">{children}</span>; // keyword
const F = ({ children }: { children: React.ReactNode }) => <span className="text-[#dcdcaa]">{children}</span>; // function
const N = ({ children }: { children: React.ReactNode }) => <span className="text-[#b5cea8]">{children}</span>; // number
const S = ({ children }: { children: React.ReactNode }) => <span className="text-[#ce9178]">{children}</span>; // string
const V = ({ children }: { children: React.ReactNode }) => <span className="text-[#9cdcfe]">{children}</span>; // variable

const CODE_LINES: React.ReactNode[] = [
  <><V>marks</V> = [<N>72</N>, <N>85</N>, <N>90</N>]</>,
  <><V>total</V> = <N>0</N></>,
  <><K>for</K> <V>m</V> <K>in</K> <V>marks</V>:</>,
  <>{'    '}<V>total</V> = <V>total</V> + <V>m</V></>,
  <><F>print</F>(<S>"Average:"</S>, <V>total</V> / <F>len</F>(<V>marks</V>))</>,
];

const EXPLANATIONS = [
  { line: 1, tag: 'LIST', text: 'Creates a list called marks with three numbers.' },
  { line: 2, tag: 'VARIABLE', text: 'Sets total to 0 so we can add to it.' },
  { line: 3, tag: 'LOOP', text: 'Repeats the next line once for each mark.' },
  { line: 4, tag: 'UPDATE', text: 'Adds the current mark to total.' },
  { line: 5, tag: 'OUTPUT', text: 'Shows the average on the screen.' },
];

/**
 * Static, crisp HTML preview of the workspace for the hero section.
 * Built from real UI patterns so it never goes out of date like a screenshot.
 */
export const ProductPreview: React.FC = () => {
  const activeLine = 4;
  return (
    <div className="relative" aria-hidden="true">
      {/* soft glow */}
      <div className="absolute -inset-6 bg-gradient-to-tr from-blue-200/50 via-indigo-100/40 to-transparent blur-2xl rounded-[40px]" />

      {/* Window */}
      <div className="relative rounded-2xl border border-slate-200 bg-white shadow-[0_24px_60px_-20px_rgba(15,23,42,0.35)] overflow-hidden">
        {/* Title bar */}
        <div className="h-10 flex items-center justify-between px-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
          </div>
          <div className="text-[11px] font-medium text-slate-500">average.py — Workspace</div>
          <div className="flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5">
            <Sprout className="w-3 h-3" /> Beginner
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-[1.05fr_1fr]">
          {/* Editor */}
          <div className="bg-[#1e1e1e] font-mono text-[12px] leading-[22px] py-3 relative">
            <div className="flex items-center justify-between px-3 pb-2 mb-1 border-b border-white/5">
              <span className="text-[10px] uppercase tracking-wider text-slate-500">Python</span>
              <span className="flex items-center gap-1 text-[10px] font-semibold text-white bg-[#238636] rounded px-2 py-0.5">
                <Play className="w-2.5 h-2.5 fill-white" /> Run
              </span>
            </div>
            {CODE_LINES.map((content, i) => {
              const n = i + 1;
              const isActive = n === activeLine;
              return (
                <div key={n} className={`flex pr-3 ${isActive ? 'bg-amber-400/10' : ''}`}>
                  <span className={`w-8 shrink-0 text-right pr-3 select-none ${isActive ? 'text-amber-300' : 'text-[#6e7681]'}`}>
                    {isActive ? '▶' : n}
                  </span>
                  <span className="text-[#d4d4d4] whitespace-pre truncate">{content}</span>
                </div>
              );
            })}
            {/* Step narrator strip */}
            <div className="mx-3 mt-3 rounded-md border border-amber-500/30 bg-amber-500/10 px-2.5 py-1.5 font-sans">
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-amber-300">
                <Footprints className="w-3 h-3" /> Step 6 of 11 · Line 4
              </div>
              <div className="mt-1 flex items-center gap-1.5 text-[10px] font-mono">
                <span className="text-sky-200 bg-sky-500/15 border border-sky-500/30 rounded px-1.5 py-px">
                  total <span className="text-slate-400 line-through">72</span> <ArrowRight className="inline w-2.5 h-2.5" /> 157
                </span>
                <span className="text-sky-200 bg-sky-500/15 border border-sky-500/30 rounded px-1.5 py-px">m = 85</span>
              </div>
            </div>
          </div>

          {/* Explanations */}
          <div className="bg-white p-3 space-y-1.5 border-t sm:border-t-0 sm:border-l border-slate-200">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1 pb-1">Line-by-line explanation</div>
            {EXPLANATIONS.map((e) => {
              const isActive = e.line === activeLine;
              return (
                <div
                  key={e.line}
                  className={`flex items-start gap-2 rounded-lg border px-2.5 py-2 transition-colors ${
                    isActive ? 'border-blue-300 bg-blue-50 ring-1 ring-blue-200' : 'border-slate-200 bg-white'
                  }`}
                >
                  <span className={`text-[10px] font-mono font-semibold rounded px-1.5 py-0.5 shrink-0 ${isActive ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                    L{e.line}
                  </span>
                  <div className="min-w-0">
                    <span className="text-[9px] font-bold tracking-wider text-slate-400">{e.tag}</span>
                    <p className={`text-[11.5px] leading-snug ${isActive ? 'text-slate-900 font-medium' : 'text-slate-600'}`}>{e.text}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Floating friendly-error card */}
      <div className="hidden md:block absolute -left-10 -bottom-10 w-72 rounded-xl border border-rose-200 bg-white shadow-xl p-3.5">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-md bg-rose-50 border border-rose-200 flex items-center justify-center">
            <AlertOctagon className="w-3.5 h-3.5 text-rose-500" />
          </span>
          <span className="text-xs font-bold text-slate-900">Unknown name</span>
          <span className="text-[10px] font-mono text-rose-600 bg-rose-50 border border-rose-200 rounded px-1.5">line 5</span>
        </div>
        <p className="mt-1.5 text-[11px] text-slate-600 leading-snug">
          “totl” is used here, but nothing called “totl” has been created yet.
        </p>
        <div className="mt-2 flex items-start gap-1.5 rounded-md bg-amber-50 border border-amber-200 px-2 py-1.5">
          <Lightbulb className="w-3 h-3 text-amber-600 mt-0.5 shrink-0" />
          <p className="text-[10.5px] text-amber-900 leading-snug">Did you mean “total”?</p>
        </div>
        <div className="mt-2 inline-flex text-[10px] font-semibold text-white bg-emerald-600 rounded px-2 py-1">Change to “total”</div>
      </div>
    </div>
  );
};
