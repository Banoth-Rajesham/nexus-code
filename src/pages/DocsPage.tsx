import React from 'react';
import {
  BookOpen,
  Terminal,
  Layers,
  ArrowRight,
  Sparkles,
  Play,
  CheckCircle2,
  Cpu,
  FileCode,
  ShieldCheck,
} from 'lucide-react';

interface DocsPageProps {
  onNavigate: (view: string) => void;
}

export const DocsPage: React.FC<DocsPageProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-screen bg-[#F5F6F8] text-[#242424]">
      {/* Hero Header */}
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-8">
        <div className="mb-8">
          <span className="text-xs font-bold text-[#0078D4] tracking-wider uppercase mb-1.5 block">
            DOCUMENTATION & ARCHITECTURE
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold text-[#242424] tracking-tight">
            Mastering Code with NexusCode Visual Blueprints
          </h1>
          <p className="text-sm text-[#616161] mt-2.5 max-w-2xl">
            Step-by-step guides, cognitive learning science, visual line-by-line arrow mappings, and architectural mental models.
          </p>
        </div>

        {/* Guide 1: Cognitive Science & Visual Blueprints */}
        <div className="bg-white rounded-lg p-6 sm:p-8 border border-[#E1DFDD] shadow-2xs mb-8">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#0078D4] uppercase tracking-wider mb-2.5">
            <BookOpen className="w-4 h-4" />
            <span>LEARNING SCIENCE</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#242424] mb-3">
            Why Visual Code Blueprints Accelerate Concept Mastery
          </h2>
          <div className="prose text-xs sm:text-sm text-[#616161] leading-relaxed space-y-3">
            <p>
              In conventional programming education, developers must navigate two simultaneous cognitive hurdles: comprehending abstract computational logic (loops, state mutations, async flows) and deciphering dense, cryptic syntax.
            </p>
            <p>
              Cognitive load theory shows that working memory is quickly saturated when reading text without visual spatial anchors. By mapping <em>execution semantics</em> directly into visual blueprints connected by line-by-line arrows (<code className="text-[#0078D4] font-bold">──&gt;</code>), your brain instantly binds code syntax to structural architecture. Technical terms (such as <code>variable</code>, <code>array</code>, <code>pointer</code>, <code>function</code>, <code>MCP toolset</code>) are mapped with clear visual icons and semantic badges.
            </p>
          </div>
        </div>

        {/* Guide 2: Step-by-Step Workflow */}
        <div className="bg-white rounded-lg p-6 sm:p-8 border border-[#E1DFDD] shadow-2xs mb-8">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#0078D4] uppercase tracking-wider mb-2.5">
            <Terminal className="w-4 h-4" />
            <span>HOW TO USE</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#242424] mb-6">
            Step-by-Step: From Pasted Code to Clear Mental Models
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="p-5 rounded-md bg-[#F5F6F8] border border-[#E1DFDD]">
              <div className="w-7 h-7 rounded-sm bg-[#0067B8] text-white flex items-center justify-center font-bold text-xs mb-3 shadow-2xs">
                1
              </div>
              <h3 className="text-sm font-bold text-[#242424] mb-1.5">Write or Paste Code</h3>
              <p className="text-xs text-[#616161] leading-relaxed">
                Paste any problem snippet from your codebase, LeetCode, or lab project. Choose Python, TypeScript, Java, C++, or Go.
              </p>
            </div>

            <div className="p-5 rounded-md bg-[#F5F6F8] border border-[#E1DFDD]">
              <div className="w-7 h-7 rounded-sm bg-[#0078D4] text-white flex items-center justify-center font-bold text-xs mb-3 shadow-2xs">
                2
              </div>
              <h3 className="text-sm font-bold text-[#242424] mb-1.5">Interactive Arrow Rail</h3>
              <p className="text-xs text-[#616161] leading-relaxed">
                Notice the right-pointing connector arrows (<code className="text-[#0078D4]">──&gt;</code>) along the seam of every code line. Click any arrow to jump to and highlight its explanation.
              </p>
            </div>

            <div className="p-5 rounded-md bg-[#F5F6F8] border border-[#E1DFDD]">
              <div className="w-7 h-7 rounded-sm bg-[#242424] text-white flex items-center justify-center font-bold text-xs mb-3 shadow-2xs">
                3
              </div>
              <h3 className="text-sm font-bold text-[#242424] mb-1.5">Explore Visual Blueprints</h3>
              <p className="text-xs text-[#616161] leading-relaxed">
                Switch between Line-by-Line Blueprint (exact 1:1 vertical sync), Architecture Blocks (grouped like Excalidraw), and live browser execution.
              </p>
            </div>
          </div>
        </div>

        {/* Matrix of Visual Constructs */}
        <div className="bg-white rounded-lg p-6 sm:p-8 border border-[#E1DFDD] shadow-2xs mb-8">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#0078D4] uppercase tracking-wider mb-2.5">
            <Layers className="w-4 h-4" />
            <span>SEMANTIC BLUEPRINT STANDARDS</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#242424] mb-2">
            Visual Blueprint Construct Mapping
          </h2>
          <p className="text-xs text-[#616161] mb-6">
            Our deterministic analysis engine parses source code into structured architectural components:
          </p>

          <div className="overflow-x-auto rounded-md border border-[#E1DFDD]">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F5F6F8] border-b border-[#E1DFDD] text-[#242424]">
                <tr>
                  <th className="py-3 px-4 font-semibold">Concept</th>
                  <th className="py-3 px-4 font-semibold">Icon</th>
                  <th className="py-3 px-4 font-semibold">Visual Category</th>
                  <th className="py-3 px-4 font-semibold">Semantic Purpose</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EDEBE9] text-[#616161]">
                <tr className="hover:bg-stone-50/50">
                  <td className="py-3 px-4 font-mono font-medium text-[#242424]">import os / sys</td>
                  <td className="py-3 px-4 text-base">💻</td>
                  <td className="py-3 px-4 font-semibold text-sky-600">Essential Toolkits</td>
                  <td className="py-3 px-4">Accesses system info, environment variables, and process parameters.</td>
                </tr>
                <tr className="hover:bg-stone-50/50">
                  <td className="py-3 px-4 font-mono font-medium text-[#242424]">Agent / LLM</td>
                  <td className="py-3 px-4 text-base">🤖</td>
                  <td className="py-3 px-4 font-semibold text-emerald-600">Google AI Connection</td>
                  <td className="py-3 px-4">Builds autonomous agent runtime and connects to Ollama/cloud models.</td>
                </tr>
                <tr className="hover:bg-stone-50/50">
                  <td className="py-3 px-4 font-mono font-medium text-[#242424]">McpToolset</td>
                  <td className="py-3 px-4 text-base">🧰</td>
                  <td className="py-3 px-4 font-semibold text-amber-600">Model Context Protocol</td>
                  <td className="py-3 px-4">Creates toolsets and handles stdio inter-process communication.</td>
                </tr>
                <tr className="hover:bg-stone-50/50">
                  <td className="py-3 px-4 font-mono font-medium text-[#242424]">def function()</td>
                  <td className="py-3 px-4 text-base">🎯</td>
                  <td className="py-3 px-4 font-semibold text-blue-600">Core Procedures</td>
                  <td className="py-3 px-4">Encapsulates reusable computational logic accepting parameters.</td>
                </tr>
                <tr className="hover:bg-stone-50/50">
                  <td className="py-3 px-4 font-mono font-medium text-[#242424]">for / while</td>
                  <td className="py-3 px-4 text-base">🔄</td>
                  <td className="py-3 px-4 font-semibold text-cyan-600">Iteration Loops</td>
                  <td className="py-3 px-4">Sequentially processes collections or loops while condition holds.</td>
                </tr>
                <tr className="hover:bg-stone-50/50">
                  <td className="py-3 px-4 font-mono font-medium text-[#242424]">return payload</td>
                  <td className="py-3 px-4 text-base">📤</td>
                  <td className="py-3 px-4 font-semibold text-indigo-600">Outputs & Payload</td>
                  <td className="py-3 px-4">Yields processed results and structured responses back to caller.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-[#0078D4] text-white rounded-lg p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm">
          <div>
            <h3 className="text-xl font-bold mb-1">Ready to explore your code visually?</h3>
            <p className="text-xs text-white/90">
              Open the interactive workspace to see line-by-line visual blueprint arrows in action.
            </p>
          </div>
          <button
            onClick={() => onNavigate('workspace')}
            className="px-6 py-2.5 rounded-sm bg-white text-[#0078D4] font-bold text-xs hover:bg-[#F3F4F6] transition-colors shrink-0 shadow-2xs flex items-center gap-1.5"
          >
            <span>Launch Workspace</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
