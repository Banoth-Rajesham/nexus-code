import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import {
  DeepExplanationAnalysis,
  ComponentItem,
  FlowNode,
  TestCaseExample,
  WhyReasoningItem,
} from '../utils/deepExplanationAnalyzer';

interface DeepExplanationViewProps {
  analysis: DeepExplanationAnalysis;
  onJumpToLine: (line: number) => void;
  highlightedLine?: number | null;
}

type LayerTab = 'all' | 'what' | 'why' | 'how' | 'verify';

export const DeepExplanationView: React.FC<DeepExplanationViewProps> = ({
  analysis,
  onJumpToLine,
  highlightedLine,
}) => {
  const [activeTab, setActiveTab] = useState<LayerTab>('all');
  const [selectedComponentId, setSelectedComponentId] = useState<string>('all');

  const { what, why, how, verify, stats, hasSyntaxIssues, syntaxIssues } = analysis;

  // Filtered components if user chooses a specific function
  const filteredComponent =
    selectedComponentId === 'all'
      ? null
      : what.components.find((c) => c.id === selectedComponentId);

  return (
    <div className="flex-1 flex flex-col min-h-0 h-full bg-[#0d1117] text-slate-200 overflow-hidden font-sans">
      {/* ─── LAYER NAVIGATION TABS (WHAT · WHY · HOW · VERIFY) ─────────── */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#161b22] border-b border-[#30363d] gap-2 shrink-0 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'all'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-[#21262d]'
            }`}
          >
            <Icon icon="flat-color-icons:radar-plot" width={14} height={14} />
            <span>All 4 Layers</span>
          </button>

          <button
            onClick={() => setActiveTab('what')}
            className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'what'
                ? 'bg-sky-600/30 text-sky-300 border border-sky-500/50 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-[#21262d]'
            }`}
          >
            <Icon icon="flat-color-icons:about" width={14} height={14} />
            <span className="font-bold">1. WHAT</span>
            <span className="text-[10px] opacity-75 hidden sm:inline">Purpose</span>
          </button>

          <button
            onClick={() => setActiveTab('why')}
            className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'why'
                ? 'bg-purple-600/30 text-purple-300 border border-purple-500/50 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-[#21262d]'
            }`}
          >
            <Icon icon="flat-color-icons:idea" width={14} height={14} />
            <span className="font-bold">2. WHY</span>
            <span className="text-[10px] opacity-75 hidden sm:inline">Reasoning</span>
          </button>

          <button
            onClick={() => setActiveTab('how')}
            className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'how'
                ? 'bg-blue-600/30 text-blue-300 border border-blue-500/50 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-[#21262d]'
            }`}
          >
            <Icon icon="flat-color-icons:flow-chart" width={14} height={14} />
            <span className="font-bold">3. HOW</span>
            <span className="text-[10px] opacity-75 hidden sm:inline">Execution Flow</span>
          </button>

          <button
            onClick={() => setActiveTab('verify')}
            className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'verify'
                ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/50 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-[#21262d]'
            }`}
          >
            <Icon icon="flat-color-icons:ok" width={14} height={14} />
            <span className="font-bold">4. VERIFY</span>
            <span className="text-[10px] opacity-75 hidden sm:inline">Validation</span>
          </button>
        </div>

        {/* Function Focus Picker (if multi-function file) */}
        {what.components.length > 1 && (
          <div className="flex items-center gap-1.5 shrink-0 text-xs">
            <span className="text-[11px] text-slate-400 hidden md:inline">Focus:</span>
            <select
              value={selectedComponentId}
              onChange={(e) => setSelectedComponentId(e.target.value)}
              className="bg-[#21262d] border border-[#30363d] text-slate-200 text-xs px-2 py-0.5 rounded outline-none cursor-pointer"
            >
              <option value="all">Entire File ({what.components.length} components)</option>
              {what.components.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.kind === 'class' ? 'Class' : 'Fn'}: {c.name}()
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Syntax Error Warning Banner */}
      {hasSyntaxIssues && syntaxIssues && (
        <div className="px-4 py-2 bg-amber-950/40 border-b border-amber-500/40 text-amber-200 text-xs flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Icon icon="flat-color-icons:warning" width={16} height={16} />
            <span>
              Syntax Notice: {syntaxIssues[0].problem} — {syntaxIssues[0].suggestion}
            </span>
          </div>
          <button
            onClick={() => onJumpToLine(syntaxIssues[0].line)}
            className="text-[11px] underline text-amber-400 hover:text-white cursor-pointer ml-2"
          >
            Go to Line {syntaxIssues[0].line}
          </button>
        </div>
      )}

      {/* ─── MAIN SCROLLABLE BODY ────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Quick Executive Banner */}
        <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3.5 shadow-sm">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <h2 className="text-sm font-bold text-white tracking-tight">
                {what.primaryObjective}
              </h2>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
              <span className="bg-[#21262d] px-2 py-0.5 rounded border border-[#30363d]">
                {stats.codeLines} Code Lines
              </span>
              <span className="bg-[#21262d] px-2 py-0.5 rounded border border-[#30363d]">
                {verify.timeComplexity.notation} Time
              </span>
            </div>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            {what.executiveSummary}
          </p>
        </div>

        {/* ════════════════════════════════════════════════════════════════════
            LAYER 1: WHAT — PURPOSE
            ════════════════════════════════════════════════════════════════════ */}
        {(activeTab === 'all' || activeTab === 'what') && (
          <section className="bg-[#161b22] border border-sky-500/30 rounded-lg p-4 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-[#30363d] pb-2.5 mb-3.5">
              <div className="flex items-center gap-2">
                <span className="p-1 rounded bg-sky-500/10 border border-sky-500/30 text-sky-400">
                  <Icon icon="flat-color-icons:about" width={18} height={18} />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    1. WHAT — Purpose & Functional Scope
                  </h3>
                  <span className="text-[11px] text-sky-300/80">
                    Defines what the code does, inputs accepted, outputs generated, and modular components.
                  </span>
                </div>
              </div>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-sky-500/10 text-sky-300 border border-sky-500/20">
                Layer 1
              </span>
            </div>

            {/* Components Grid */}
            <div className="space-y-3 mb-4">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Components & Routines ({what.components.length})
              </h4>
              <div className="grid grid-cols-1 gap-2.5">
                {(filteredComponent ? [filteredComponent] : what.components).map((comp) => (
                  <div
                    key={comp.id}
                    className="p-3 bg-[#0d1117] border border-[#30363d] rounded-md hover:border-sky-500/50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-sky-300">
                          {comp.kind === 'class' ? 'class' : 'def'} {comp.name}()
                        </span>
                        {comp.isRecursive && (
                          <span className="text-[9px] bg-purple-500/20 text-purple-300 border border-purple-500/40 px-1.5 py-0.2 rounded font-sans uppercase">
                            Recursive
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => onJumpToLine(comp.lineStart)}
                        className="text-[10px] font-mono text-slate-400 hover:text-sky-300 bg-[#21262d] px-1.5 py-0.5 rounded transition-colors flex items-center gap-1"
                        title="Jump to definition in editor"
                      >
                        Line {comp.lineStart}
                      </button>
                    </div>

                    <p className="text-xs text-slate-300 mb-2">{comp.purpose}</p>

                    {comp.docstring && (
                      <div className="p-2 mb-2 bg-[#161b22] border-l-2 border-sky-400 rounded-r text-[11px] font-mono text-slate-300 italic">
                        "{comp.docstring}"
                      </div>
                    )}

                    {/* Params & Returns */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1 border-t border-[#21262d]">
                      <div>
                        <span className="text-slate-400 font-semibold block mb-0.5">
                          Inputs ({comp.params.length}):
                        </span>
                        {comp.params.length > 0 ? (
                          <ul className="space-y-0.5">
                            {comp.params.map((p) => (
                              <li key={p.name} className="font-mono text-slate-300">
                                • <span className="text-sky-400 font-bold">{p.name}</span>
                                <span className="text-slate-500"> ({p.inferredType})</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <span className="text-slate-500 italic">None (parameterless)</span>
                        )}
                      </div>

                      <div>
                        <span className="text-slate-400 font-semibold block mb-0.5">
                          Returns ({comp.returns.length}):
                        </span>
                        {comp.returns.length > 0 ? (
                          <ul className="space-y-0.5">
                            {comp.returns.map((r, rIdx) => (
                              <li key={rIdx} className="font-mono text-slate-300 flex items-center gap-1">
                                • <span className="text-emerald-400">{r.inferredType}</span>
                                <button
                                  onClick={() => onJumpToLine(r.line)}
                                  className="text-[9px] text-slate-500 hover:text-slate-300 underline"
                                >
                                  (L{r.line})
                                </button>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <span className="text-slate-500 italic">Implicit None / Void</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* External Toolkits & Libraries */}
            {what.externalDependencies.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  External Toolkits & Modules ({what.externalDependencies.length})
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {what.externalDependencies.map((dep, idx) => (
                    <div
                      key={idx}
                      className="p-2 bg-[#0d1117] border border-[#30363d] rounded flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-mono font-bold text-slate-200 block">
                          {dep.name}
                        </span>
                        <span className="text-[11px] text-slate-400">{dep.purpose}</span>
                      </div>
                      <button
                        onClick={() => onJumpToLine(dep.line)}
                        className="text-[10px] font-mono text-slate-500 hover:text-sky-400"
                      >
                        Line {dep.line}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            LAYER 2: WHY — REASONING
            ════════════════════════════════════════════════════════════════════ */}
        {(activeTab === 'all' || activeTab === 'why') && (
          <section className="bg-[#161b22] border border-purple-500/30 rounded-lg p-4 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-[#30363d] pb-2.5 mb-3.5">
              <div className="flex items-center gap-2">
                <span className="p-1 rounded bg-purple-500/10 border border-purple-500/30 text-purple-400">
                  <Icon icon="flat-color-icons:idea" width={18} height={18} />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    2. WHY — Algorithmic Reasoning & Design Decisions
                  </h3>
                  <span className="text-[11px] text-purple-300/80">
                    Justifies why specific patterns were chosen. Distinguishes code evidence from inferred assumptions.
                  </span>
                </div>
              </div>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20">
                Layer 2
              </span>
            </div>

            {/* Approach Overview */}
            <div className="p-3 bg-[#0d1117] border border-purple-500/20 rounded-md mb-3 text-xs text-slate-200 leading-relaxed">
              <span className="text-purple-400 font-bold block mb-1">Architectural Pattern:</span>
              {why.approachOverview}
            </div>

            {/* Design Decisions List */}
            <div className="space-y-2.5 mb-4">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Design Decisions & Patterns ({why.decisions.length})
              </h4>
              {why.decisions.map((item) => (
                <div
                  key={item.id}
                  className="p-3 bg-[#0d1117] border border-[#30363d] rounded-md hover:border-purple-500/50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">{item.decision}</span>
                      <span
                        className={`text-[9px] uppercase px-1.5 py-0.2 rounded font-semibold border ${
                          item.evidenceType === 'code_evidence'
                            ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                            : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                        }`}
                      >
                        {item.evidenceType === 'code_evidence' ? 'Code Evidence' : 'Inferred Assumption'}
                      </span>
                    </div>
                    {item.lineReference && (
                      <button
                        onClick={() => onJumpToLine(item.lineReference!)}
                        className="text-[10px] font-mono text-slate-400 hover:text-purple-300 bg-[#21262d] px-1.5 py-0.5 rounded"
                      >
                        Line {item.lineReference}
                      </button>
                    )}
                  </div>

                  <p className="text-xs text-slate-300 mb-1">{item.reasoning}</p>

                  {item.tradeoff && (
                    <div className="text-[11px] text-slate-400 flex items-start gap-1 mt-1">
                      <span className="text-amber-400 font-bold">Trade-off:</span>
                      <span>{item.tradeoff}</span>
                    </div>
                  )}

                  {item.evidenceSnippet && (
                    <pre className="mt-1.5 p-1.5 bg-[#161b22] text-[11px] font-mono text-purple-300 rounded border border-[#30363d]/60 overflow-x-auto">
                      {item.evidenceSnippet}
                    </pre>
                  )}
                </div>
              ))}
            </div>

            {/* Inferred Assumptions & Constraints */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-[#30363d]">
              <div>
                <span className="text-xs font-semibold text-slate-400 block mb-1">
                  Inferred Assumptions:
                </span>
                <ul className="space-y-1 text-xs text-slate-300">
                  {why.assumptions.map((a, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-amber-400 shrink-0">⚠</span>
                      <div>
                        <span className="font-semibold text-slate-200">{a.statement}</span>
                        <span className="block text-[11px] text-slate-400">{a.basis}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <span className="text-xs font-semibold text-slate-400 block mb-1">
                  Operational Constraints:
                </span>
                <ul className="space-y-1 text-xs text-slate-300">
                  {why.constraints.map((c, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-purple-400 shrink-0">🔒</span>
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            LAYER 3: HOW — EXECUTION & FLOW DIAGRAM
            ════════════════════════════════════════════════════════════════════ */}
        {(activeTab === 'all' || activeTab === 'how') && (
          <section className="bg-[#161b22] border border-blue-500/30 rounded-lg p-4 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-[#30363d] pb-2.5 mb-3.5">
              <div className="flex items-center gap-2">
                <span className="p-1 rounded bg-blue-500/10 border border-blue-500/30 text-blue-400">
                  <Icon icon="flat-color-icons:flow-chart" width={18} height={18} />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    3. HOW — Step-by-Step Execution & Interactive Flow Diagram
                  </h3>
                  <span className="text-[11px] text-blue-300/80">
                    Traces runtime flow, state evolution, and conditional branches. Click any diagram node to jump to source code.
                  </span>
                </div>
              </div>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20">
                Layer 3
              </span>
            </div>

            {/* Interactive Flow Diagram */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Icon icon="flat-color-icons:flow-chart" width={14} height={14} />
                  Interactive Flow Diagram (Click node to inspect code)
                </h4>
                <span className="text-[11px] text-slate-500 font-mono">
                  {how.flowNodes.length} Nodes Mapped
                </span>
              </div>

              {/* Flowchart Node Canvas */}
              <div className="p-3 bg-[#0d1117] border border-[#30363d] rounded-lg overflow-x-auto">
                <div className="flex flex-col items-center space-y-2 min-w-[320px]">
                  {how.flowNodes.map((node, nIdx) => {
                    const isNodeActive = highlightedLine === node.line;
                    return (
                      <React.Fragment key={node.id}>
                        <div
                          onClick={() => onJumpToLine(node.line)}
                          className={`w-full max-w-md p-2.5 rounded-md border cursor-pointer transition-all flex items-center justify-between gap-2 ${
                            isNodeActive
                              ? 'bg-[#1e293b] border-blue-500 shadow-md scale-102 ring-1 ring-blue-400'
                              : 'bg-[#161b22] border-[#30363d] hover:border-blue-500/70 hover:bg-[#21262d]'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span
                              className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded shrink-0 border ${
                                node.nodeType === 'start'
                                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                  : node.nodeType === 'return'
                                  ? 'bg-pink-500/20 text-pink-300 border-pink-500/40'
                                  : node.nodeType === 'decision'
                                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                  : node.nodeType === 'loop'
                                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                                  : 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                              }`}
                            >
                              {node.nodeType}
                            </span>
                            <div className="min-w-0">
                              <span className="text-xs font-mono font-bold text-white block truncate">
                                {node.label}
                              </span>
                              <span className="text-[11px] text-slate-400 block truncate">
                                {node.detail}
                              </span>
                            </div>
                          </div>

                          <span className="text-[10px] font-mono text-slate-400 bg-[#0d1117] px-1.5 py-0.5 rounded border border-[#30363d] shrink-0">
                            L{node.line}
                          </span>
                        </div>

                        {/* Connector Arrow */}
                        {nIdx < how.flowNodes.length - 1 && (
                          <div className="flex flex-col items-center text-slate-500 py-0.5">
                            <span className="text-xs font-bold leading-none">↓</span>
                          </div>
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Execution Steps Timeline */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Sequential Execution Pipeline
              </h4>
              <div className="space-y-1.5">
                {how.steps.map((st) => (
                  <div
                    key={st.stepIndex}
                    onClick={() => onJumpToLine(st.line)}
                    className="p-2.5 bg-[#0d1117] border border-[#30363d] rounded-md hover:border-blue-500/50 cursor-pointer transition-colors flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40 flex items-center justify-center text-[10px] font-bold shrink-0">
                        {st.stepIndex}
                      </span>
                      <div>
                        <span className="text-[11px] text-blue-400 font-bold uppercase tracking-wider mr-2">
                          {st.phase}:
                        </span>
                        <span className="text-slate-200">{st.description}</span>
                        {st.stateDelta && (
                          <span className="block text-[10px] text-emerald-400/90 font-mono mt-0.5">
                            ↳ {st.stateDelta}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 bg-[#161b22] px-1.5 py-0.5 rounded border border-[#30363d] shrink-0">
                      Line {st.line}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            LAYER 4: VERIFY — VALIDATION & EDGE CASES
            ════════════════════════════════════════════════════════════════════ */}
        {(activeTab === 'all' || activeTab === 'verify') && (
          <section className="bg-[#161b22] border border-emerald-500/30 rounded-lg p-4 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-[#30363d] pb-2.5 mb-3.5">
              <div className="flex items-center gap-2">
                <span className="p-1 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                  <Icon icon="flat-color-icons:ok" width={18} height={18} />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    4. VERIFY — Static Validation, Edge Cases & Complexity
                  </h3>
                  <span className="text-[11px] text-emerald-300/80">
                    Synthesizes test inputs/outputs, edge boundaries, failure paths, and computational bounds.
                  </span>
                </div>
              </div>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                Layer 4
              </span>
            </div>

            {/* Strict Static Analysis Disclaimer */}
            <div className="p-2.5 mb-3.5 bg-emerald-950/20 border border-emerald-500/30 rounded-md text-xs text-emerald-200 flex items-center gap-2">
              <Icon icon="flat-color-icons:shield" width={16} height={16} className="shrink-0" />
              <span>
                <strong>Static Verification Mode:</strong> Results are evaluated via deterministic AST parsing. Untrusted code is never executed automatically.
              </span>
            </div>

            {/* Complexity Badges */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <div className="p-3 bg-[#0d1117] border border-[#30363d] rounded-md">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-slate-400">Time Complexity</span>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-blue-500/15 text-blue-300 border border-blue-500/30">
                    {verify.timeComplexity.notation}
                  </span>
                </div>
                <p className="text-[11px] text-slate-300">{verify.timeComplexity.derivation}</p>
              </div>

              <div className="p-3 bg-[#0d1117] border border-[#30363d] rounded-md">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-slate-400">Space Complexity</span>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-purple-500/15 text-purple-300 border border-purple-500/30">
                    {verify.spaceComplexity.notation}
                  </span>
                </div>
                <p className="text-[11px] text-slate-300">{verify.spaceComplexity.derivation}</p>
              </div>
            </div>

            {/* Test Case Scenarios */}
            {verify.testCases.length > 0 && (
              <div className="space-y-2 mb-4">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Sample Inputs & Expected Outputs ({verify.testCases.length})
                </h4>
                <div className="grid grid-cols-1 gap-2">
                  {verify.testCases.map((tc) => (
                    <div
                      key={tc.id}
                      className="p-3 bg-[#0d1117] border border-[#30363d] rounded-md text-xs"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[9px] uppercase font-bold px-1.5 py-0.2 rounded border ${
                              tc.category === 'Happy Path'
                                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                                : tc.category === 'Boundary Condition'
                                ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30'
                                : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                            }`}
                          >
                            {tc.category}
                          </span>
                          <span className="font-bold text-white">{tc.title}</span>
                        </div>
                        {tc.relevantLines.length > 0 && (
                          <button
                            onClick={() => onJumpToLine(tc.relevantLines[0])}
                            className="text-[10px] font-mono text-slate-400 hover:text-emerald-400"
                          >
                            Line {tc.relevantLines.join(', ')}
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono text-[11px] my-1.5">
                        <div className="p-1.5 bg-[#161b22] rounded border border-[#30363d]/60">
                          <span className="text-slate-400 block text-[9px] uppercase font-sans">Input:</span>
                          <span className="text-sky-300">{tc.inputArgs}</span>
                        </div>
                        <div className="p-1.5 bg-[#161b22] rounded border border-[#30363d]/60">
                          <span className="text-slate-400 block text-[9px] uppercase font-sans">Expected Output:</span>
                          <span className="text-emerald-300">{tc.expectedOutput}</span>
                        </div>
                      </div>

                      <p className="text-[11px] text-slate-400">{tc.explanation}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Edge Cases & Failure Paths */}
            <div className="space-y-2 mb-4">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Edge Cases & Failure Boundary Analysis
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {verify.edgeCases.map((ec, i) => (
                  <div key={i} className="p-2.5 bg-[#0d1117] border border-[#30363d] rounded-md text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-white">{ec.scenario}</span>
                      {ec.lineRef && (
                        <button
                          onClick={() => onJumpToLine(ec.lineRef!)}
                          className="text-[10px] font-mono text-slate-500 hover:text-emerald-300"
                        >
                          L{ec.lineRef}
                        </button>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400 block mb-0.5">
                      <strong>Condition:</strong> {ec.condition}
                    </span>
                    <span className="text-[11px] text-amber-300/90 block">
                      <strong>Behavior:</strong> {ec.outcome}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Potential Errors & Mitigations */}
            {verify.potentialErrors.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Potential Vulnerabilities & Failure Paths ({verify.potentialErrors.length})
                </h4>
                <div className="space-y-2">
                  {verify.potentialErrors.map((err, i) => (
                    <div
                      key={i}
                      className="p-3 bg-[#0d1117] border border-rose-500/30 rounded-md text-xs"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5 text-rose-400 font-bold">
                          <span>⚠ {err.type}</span>
                          <span className="text-[9px] uppercase px-1 py-0.2 rounded bg-rose-500/10 border border-rose-500/30">
                            {err.severity} severity
                          </span>
                        </div>
                        <button
                          onClick={() => onJumpToLine(err.line)}
                          className="text-[10px] font-mono text-slate-400 hover:text-rose-300"
                        >
                          Line {err.line}
                        </button>
                      </div>
                      <p className="text-[11px] text-slate-300 mb-1.5">{err.description}</p>
                      <div className="p-2 bg-[#161b22] border-l-2 border-emerald-400 rounded-r text-[11px] text-emerald-300">
                        <strong>Recommended Guard:</strong> {err.mitigationAdvice}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
};
