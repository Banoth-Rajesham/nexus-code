import React, { useState } from 'react';
import { ListOrdered, Footprints, Wrench, GraduationCap, Check, ArrowRight, AlertOctagon, Lightbulb, Trophy, Target } from 'lucide-react';

type TabKey = 'explain' | 'step' | 'errors' | 'learn';

const TABS: { key: TabKey; label: string; icon: React.FC<{ className?: string }>; title: string; body: string; points: string[] }[] = [
  {
    key: 'explain',
    label: 'Explain',
    icon: ListOrdered,
    title: 'Every line, in plain English',
    body: 'As you type, each statement is explained in one short sentence. Click an explanation and the editor jumps to that line.',
    points: ['Updates live as you type', 'Same explanation every time — no AI guesswork', 'Program summary: loops, functions, conditions'],
  },
  {
    key: 'step',
    label: 'Step through',
    icon: Footprints,
    title: 'Watch the program run, one line at a time',
    body: 'Step forward and back through real execution. The current line, its explanation and the variables that changed move together.',
    points: ['See values change: total 72 → 157', 'Loop counters and call stack', 'Auto-generated flowchart highlights the current step'],
  },
  {
    key: 'errors',
    label: 'Fix errors',
    icon: Wrench,
    title: 'Errors explained like a mentor would',
    body: 'Instead of a scary traceback, you get what went wrong, the exact line, a hint — and a one-click fix when it is safe.',
    points: ['Misspelt names: “Did you mean total?”', 'Missing colons and indentation fixed in one click', 'The full original message is still shown'],
  },
  {
    key: 'learn',
    label: 'Learn',
    icon: GraduationCap,
    title: 'Guided lessons that check your code',
    body: 'Twelve short lessons from printing to recursion. Write the code, press Run, and it is checked automatically.',
    points: ['Progress and concepts mastered are saved', '“Quiz me” questions about your own code', 'Beginner, Intermediate and Senior tracks'],
  },
];

const Visual: React.FC<{ tab: TabKey }> = ({ tab }) => {
  if (tab === 'explain') {
    const rows = [
      ['L1', 'for i in range(1, 4):', 'LOOP', 'Repeats the block below for i = 1, 2 and 3.'],
      ['L2', 'square = i * i', 'VARIABLE', 'Multiplies i by itself and stores it in square.'],
      ['L3', 'print(i, square)', 'OUTPUT', 'Shows i and its square on the screen.'],
    ];
    return (
      <div className="space-y-2">
        {rows.map(([l, code, tag, text], i) => (
          <div key={l} style={{ marginLeft: i > 0 ? 18 : 0 }} className={`rounded-xl border p-3 bg-white ${i === 1 ? 'border-blue-300 ring-2 ring-blue-100' : 'border-slate-200'}`}>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-mono font-semibold rounded px-1.5 py-0.5 ${i === 1 ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>{l}</span>
              <code className="text-xs font-mono text-slate-700">{code}</code>
              <span className="ml-auto text-[10px] font-bold tracking-wider text-slate-500">{tag}</span>
            </div>
            <p className="text-sm text-slate-800 mt-1.5">{text}</p>
          </div>
        ))}
      </div>
    );
  }
  if (tab === 'step') {
    return (
      <div className="rounded-xl bg-[#1e1e1e] p-4 font-mono text-[13px] leading-6 text-[#d4d4d4]">
        {['total = 0', 'for m in [72, 85, 90]:', '    total = total + m', 'print(total)'].map((l, i) => (
          <div key={i} className={`flex rounded ${i === 2 ? 'bg-amber-400/10' : ''}`}>
            <span className={`w-7 text-right pr-3 ${i === 2 ? 'text-amber-300' : 'text-[#6e7681]'}`}>{i === 2 ? '▶' : i + 1}</span>
            <span className="whitespace-pre">{l}</span>
          </div>
        ))}
        <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 font-sans">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
            <Footprints className="w-3.5 h-3.5" /> Step 6 of 9 · Line 3
            <span className="font-normal text-slate-300">→ Adds the current mark to total.</span>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] font-mono">
            <span className="rounded border border-sky-500/30 bg-sky-500/15 text-sky-200 px-2 py-0.5">
              total <span className="line-through text-slate-400">72</span> → 157
            </span>
            <span className="rounded border border-sky-500/30 bg-sky-500/15 text-sky-200 px-2 py-0.5">m 72 → 85</span>
            <span className="rounded border border-slate-500/30 bg-white/5 text-slate-300 px-2 py-0.5 font-sans">Loop iteration 2</span>
          </div>
        </div>
      </div>
    );
  }
  if (tab === 'errors') {
    return (
      <div className="space-y-3">
        <pre className="rounded-xl bg-slate-900 text-rose-300 text-xs font-mono p-3 whitespace-pre-wrap">NameError: name 'totl' is not defined (Line 4)</pre>
        <div className="rounded-xl border border-rose-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-md bg-rose-50 border border-rose-200 flex items-center justify-center">
              <AlertOctagon className="w-4 h-4 text-rose-500" />
            </span>
            <span className="text-sm font-bold text-slate-900">Unknown name</span>
            <span className="text-[11px] font-mono text-rose-700 bg-rose-50 border border-rose-200 rounded px-1.5">line 4</span>
          </div>
          <p className="text-sm text-slate-700 mt-2">The name “totl” is used here, but nothing called “totl” has been created yet.</p>
          <div className="mt-2.5 flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2">
            <Lightbulb className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-900">Did you mean “total”? Names must match exactly, including capital letters.</p>
          </div>
          <div className="mt-3 flex gap-2">
            <span className="text-xs font-semibold text-white bg-emerald-600 rounded-md px-3 py-1.5">Change to “total”</span>
            <span className="text-xs font-semibold text-slate-700 bg-slate-100 rounded-md px-3 py-1.5">Go to line 4</span>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 flex items-center gap-2.5">
        <Trophy className="w-5 h-5 text-amber-500" />
        <div>
          <div className="text-sm font-bold text-slate-900">Lesson complete!</div>
          <div className="text-xs text-slate-600">Count from 1 to 10 — checked automatically</div>
        </div>
        <span className="ml-auto text-xs font-semibold text-white bg-emerald-600 rounded-md px-2.5 py-1">Next lesson</span>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="font-semibold text-slate-700">5 of 12 lessons complete</span>
          <span className="font-mono text-slate-500">42%</span>
        </div>
        <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
          <div className="h-full w-[42%] bg-gradient-to-r from-emerald-500 to-blue-500" />
        </div>
        <div className="flex flex-wrap gap-1.5 mt-3">
          {['Printing', 'Variables', 'Input', 'If / else', 'Loops'].map((c) => (
            <span key={c} className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5">
              <Check className="w-3 h-3" /> {c}
            </span>
          ))}
          {['Lists', 'Functions'].map((c) => (
            <span key={c} className="text-[11px] font-medium text-slate-500 bg-slate-50 border border-slate-200 rounded-full px-2 py-0.5">{c}</span>
          ))}
        </div>
      </div>
      <div className="rounded-xl border border-sky-200 bg-sky-50/60 p-3 flex items-center gap-2 text-xs text-sky-900">
        <Target className="w-4 h-4 text-sky-600" /> Quiz me: “What does line 3 do?” — 3 of 3 correct
      </div>
    </div>
  );
};

interface FeatureShowcaseProps {
  onTry: () => void;
}

/** Interactive tabbed tour of the core product features. */
export const FeatureShowcase: React.FC<FeatureShowcaseProps> = ({ onTry }) => {
  const [active, setActive] = useState<TabKey>('explain');
  const tab = TABS.find((t) => t.key === active)!;
  return (
    <div>
      <div className="flex justify-center">
        <div className="inline-flex p-1 rounded-xl bg-white/80 backdrop-blur-xl border border-white/90 shadow-sm overflow-x-auto max-w-full" role="tablist" aria-label="Product features">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              role="tab"
              aria-selected={active === key}
              onClick={() => setActive(key)}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${
                active === key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Icon className="w-4 h-4" /> {label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-10 grid lg:grid-cols-2 gap-10 lg:gap-14 items-center" role="tabpanel">
        <div>
          <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">{tab.title}</h3>
          <p className="mt-3 text-base text-slate-600 leading-relaxed">{tab.body}</p>
          <ul className="mt-6 space-y-3">
            {tab.points.map((p) => (
              <li key={p} className="flex items-start gap-3 text-sm text-slate-700">
                <span className="mt-0.5 w-5 h-5 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0">
                  <Check className="w-3 h-3 text-blue-600" />
                </span>
                {p}
              </li>
            ))}
          </ul>
          <button onClick={onTry} className="mt-8 inline-flex items-center gap-1.5 text-sm font-semibold text-blue-700 hover:text-blue-800">
            Try it in the workspace <ArrowRight className="w-4 h-4" />
          </button>
        </div>
        <div className="rounded-2xl bg-white/80 backdrop-blur-xl border border-white/90 shadow-[0_12px_40px_rgba(0,0,0,0.06)] p-5 sm:p-7">
          <Visual tab={active} />
        </div>
      </div>
    </div>
  );
};
