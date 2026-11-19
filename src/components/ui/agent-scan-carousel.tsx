"use client"

import * as React from "react"
import {
  Code,
  Play,
  Check,
  AlertCircle,
  Footprints,
  Workflow,
  GraduationCap,
  Sparkles,
  ArrowRight,
  Terminal,
  Layers,
  Wrench,
  Cpu,
} from "lucide-react"

/**
 * Agent Scan Carousel — a stream of cards drifting through a glowing scanner line.
 * Right of the line is the code/page; left of it is the lean semantic AST breakdown
 * and plain-English explanation, with a running counter riding the scanner beam.
 *
 * Grab the stream and fling it: it coasts, then settles back to its drift.
 * Arrow keys nudge it. Pixels shed off the scan front onto the page side.
 */

export interface AgentScanCard {
  /** The face drawn at 800 x 500 design pixels. */
  face: React.ReactNode
  /** The scanned version shown left of the scanner. */
  markup: string
  /** Comment lines in the second code column. */
  notes?: string[]
  /** Numbers before and after; the counter counts the difference as the card is scanned. */
  original: number
  compressed: number
  /** Accessible name for the card. */
  label: string
}

export interface AgentScanCarouselProps {
  cards?: AgentScanCard[]
  eyebrow?: string
  title?: string
  titleItalic?: string
  description?: string
  ctaLabel?: string
  ctaHref?: string
  counterLabel?: string
  /** Drift speed in px per second at full size. */
  speed?: number
  /** Beam, pixels and counter pill. */
  accent?: string
  /** Button fill. */
  ctaColor?: string
  /** Must be a definite length: percentages collapse on a page with no height chain. */
  height?: string
  /** Where fallback pictures live. */
  imageBase?: string
  /** Google Fonts stylesheet, or null to bring your own. */
  fontHref?: string | null
  className?: string
  onCtaClick?: () => void
  /** Whether to show the top header/eyebrow (set false when embedding below a custom hero) */
  showHeader?: boolean
  /** Whether to use transparent background instead of dark gradient */
  transparent?: boolean
}

const FONT_HREF =
  "https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,400;1,6..72,400&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap"

const IMG_BASE = "https://kedhar-components.pages.dev/agent-scan-carousel/"

// Reliable high-res Unsplash tech/code fallback images
export const STOCK_IMAGES = {
  sky: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80",
  dusk: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80",
  grass: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80",
  lichen: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80",
  bloom: "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&w=1200&q=80",
}

// Card geometry
const CARD_W = 800
const CARD_H = 500
const GAP = 80
const PITCH = CARD_W + GAP
const STAGE_H = 580
const CARD_TOP = 40

// #region model
export function wrap(x: number, period: number): number {
  return ((x % period) + period) % period
}

export function slotX(i: number, offset: number, pitch: number, period: number): number {
  return wrap(i * pitch + offset + pitch, period) - pitch
}

export function scanProgress(scanX: number, cardX: number, cardW: number): number {
  if (scanX < cardX || scanX > cardX + cardW) return -1
  return (scanX - cardX) / cardW
}

export function tokenReadout(p: number, original: number, compressed: number): { saved: number; percent: number } {
  const q = Math.min(1, Math.max(0, p))
  return {
    saved: Math.round(q * (original - compressed)),
    percent: Math.round(q * (1 - compressed / original) * 100),
  }
}

export function formatTokens(n: number): string {
  return "-" + Math.round(n).toLocaleString("en-US")
}

export function relaxVelocity(v: number, base: number, dt: number, tau: number): number {
  return base + (v - base) * Math.exp(-dt / tau)
}

export function fitScale(stageW: number, availH: number): number {
  const byW = (stageW - 32) / CARD_W
  const byH = availH / STAGE_H
  return Math.max(0.3, Math.min(1, byW, byH))
}
// #endregion model

const css =
  ".asc-root{position:relative;width:100%;overflow:hidden;background:linear-gradient(180deg,#0a0f1d 0%,#0f172a 100%);color:#f8fafc;display:flex;flex-direction:column;justify-content:center;font-family:Inter,ui-sans-serif,system-ui,sans-serif;-webkit-font-smoothing:antialiased}" +
  ".asc-gridlines{position:absolute;inset:0;pointer-events:none;opacity:.18;-webkit-mask-image:linear-gradient(to bottom,#000 0,rgba(0,0,0,.55) 35%,transparent 85%);mask-image:linear-gradient(to bottom,#000 0,rgba(0,0,0,.55) 35%,transparent 85%)}" +
  ".asc-head{position:relative;z-index:2;width:100%;max-width:1320px;margin:0 auto;padding:0 24px;box-sizing:border-box;display:grid;grid-template-columns:minmax(0,1.2fr) minmax(0,1fr);justify-content:space-between;column-gap:48px;row-gap:20px;align-items:center}" +
  ".asc-eyebrow{margin:0 0 12px;font-family:'JetBrains Mono','IBM Plex Mono',monospace;font-size:13px;line-height:20px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:#38bdf8}" +
  ".asc-title{margin:0;font-weight:700;font-size:clamp(30px,3.2vw,48px);line-height:1.1;letter-spacing:-.025em;color:#f8fafc}" +
  ".asc-title i{display:block;font-style:normal;background:linear-gradient(90deg,#60a5fa,#818cf8);-webkit-background-clip:text;-webkit-text-fill-color:transparent}" +
  ".asc-desc{margin:0;font-size:clamp(15px,1.15vw,17px);line-height:1.6;color:#94a3b8}" +
  ".asc-cta{display:inline-flex;align-items:center;gap:8px;margin-top:20px;padding:12px 28px;border-radius:12px;font-size:14px;line-height:20px;font-weight:600;color:#fff;text-decoration:none;transition:all .25s ease;cursor:pointer;border:none}" +
  ".asc-cta:hover{transform:translateY(-1px);filter:brightness(1.1);box-shadow:0 10px 25px -5px rgba(59,130,246,0.4)}" +
  ".asc-stage{position:relative;z-index:1;width:100%;flex:none;cursor:grab;touch-action:pan-y;-webkit-user-select:none;user-select:none;outline:none}" +
  ".asc-stage[data-drag='1']{cursor:grabbing}" +
  ".asc-fade{position:absolute;inset:0;-webkit-mask-image:linear-gradient(to right,transparent 0,#000 6%,#000 94%,transparent 100%);mask-image:linear-gradient(to right,transparent 0,#000 6%,#000 94%,transparent 100%)}" +
  ".asc-card{position:absolute;left:0;top:0;width:800px;height:500px;transform-origin:0 0;will-change:transform}" +
  ".asc-face{position:absolute;inset:0;border-radius:24px;overflow:hidden;will-change:clip-path;box-shadow:0 20px 40px -15px rgba(0,0,0,0.5);border:1px solid rgba(255,255,255,0.1)}" +
  ".asc-code{position:absolute;inset:0;border-radius:24px;overflow:hidden;will-change:clip-path;display:flex;font-family:'JetBrains Mono','IBM Plex Mono',monospace;font-size:12px;line-height:19px;white-space:pre-wrap;padding:24px 28px;box-sizing:border-box;background:#030712;border:1px solid rgba(56,189,248,0.25)}" +
  ".asc-code-main{width:430px;flex:none;padding-right:20px;box-sizing:border-box;color:#e2e8f0}" +
  ".asc-code-notes{width:330px;flex:none;color:#38bdf8;opacity:.9;border-left:1px dashed rgba(56,189,248,0.2);padding-left:18px}" +
  ".asc-canvas{position:absolute;left:0;top:0;pointer-events:none;z-index:3}" +
  ".asc-meter{position:absolute;z-index:4;display:flex;flex-direction:column;align-items:center;pointer-events:none;transform:translateX(-50%)}" +
  ".asc-meter-label{font-size:12px;line-height:18px;font-weight:600;letter-spacing:0.04em;text-transform:uppercase;white-space:nowrap;margin-bottom:8px;color:#38bdf8;text-shadow:0 0 12px rgba(56,189,248,0.6)}" +
  ".asc-pill{display:flex;align-items:center;gap:18px;height:32px;padding:5px 16px;box-sizing:border-box;border-radius:999px;background:var(--asc-accent);box-shadow:0 0 30px 4px var(--asc-glow);color:#042f2e;white-space:nowrap;font-weight:700}" +
  ".asc-pill-n{font-family:'JetBrains Mono','IBM Plex Mono',monospace;font-size:14px;line-height:20px;font-weight:700;min-width:6ch;font-variant-numeric:tabular-nums}" +
  ".asc-pill-p{font-size:11px;line-height:20px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em}" +
  ".asc-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}" +
  "@media (max-width:900px){.asc-head{grid-template-columns:minmax(0,1fr)}.asc-cta{margin-top:16px}}" +
  "@media (prefers-reduced-motion:reduce){.asc-cta{transition:none}.asc-cta:hover{transform:none}}@media (max-width:640px){.asc-meter-label{font-size:10px;margin-bottom:3px}.asc-pill{height:26px;padding:3px 10px;gap:8px}.asc-pill-n{font-size:12px;min-width:4ch}.asc-pill-p{font-size:10px}}"

// ─── NexusCode Specialized Interactive Cards ──────────────────────────────────

function CardLoopAverage() {
  return (
    <div className="w-full h-full bg-[#18181b] text-slate-100 flex flex-col font-sans">
      <div className="h-11 px-5 border-b border-white/10 flex items-center justify-between bg-[#121214]">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-rose-500/80" />
          <span className="w-3 h-3 rounded-full bg-amber-500/80" />
          <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
          <span className="ml-2 text-xs font-mono text-slate-400">average.py</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-950/70 border border-emerald-800/60 px-2.5 py-0.5 rounded-full flex items-center gap-1">
            <Footprints className="w-3 h-3" /> Step Narrator
          </span>
          <span className="text-[11px] font-semibold text-white bg-blue-600 px-3 py-1 rounded-md flex items-center gap-1">
            <Play className="w-3 h-3 fill-white" /> Run
          </span>
        </div>
      </div>

      <div className="p-6 flex-1 grid grid-cols-[1.2fr_1fr] gap-5 font-mono text-[13px] leading-[25px]">
        <div className="bg-[#09090b] rounded-xl p-4 border border-white/5 space-y-1">
          <div><span className="text-slate-500 select-none mr-3">1</span><span className="text-sky-300">marks</span> = [<span className="text-emerald-400">72</span>, <span className="text-emerald-400">85</span>, <span className="text-emerald-400">90</span>]</div>
          <div><span className="text-slate-500 select-none mr-3">2</span><span className="text-sky-300">total</span> = <span className="text-emerald-400">0</span></div>
          <div><span className="text-slate-500 select-none mr-3">3</span><span className="text-purple-400">for</span> <span className="text-amber-300">m</span> <span className="text-purple-400">in</span> <span className="text-sky-300">marks</span>:</div>
          <div className="bg-amber-400/15 -mx-4 px-4 border-l-2 border-amber-400">
            <span className="text-amber-300 font-bold select-none mr-3">4</span>{"    "}<span className="text-sky-300">total</span> = <span className="text-sky-300">total</span> + <span className="text-amber-300">m</span>
          </div>
          <div><span className="text-slate-500 select-none mr-3">5</span><span className="text-blue-400">print</span>(<span className="text-amber-200">"Average:"</span>, <span className="text-sky-300">total</span> / <span className="text-blue-400">len</span>(<span className="text-sky-300">marks</span>))</div>
        </div>

        <div className="flex flex-col gap-3 font-sans">
          <div className="p-3.5 rounded-xl bg-blue-950/40 border border-blue-800/40">
            <div className="text-[11px] uppercase tracking-wider text-blue-400 font-bold">Line 4 Breakdown</div>
            <div className="text-xs text-slate-200 mt-1 leading-relaxed">
              Adds the current list item <code className="text-amber-300 font-mono">m</code> to accumulator <code className="text-sky-300 font-mono">total</code>.
            </div>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-900 border border-white/10 flex-1">
            <div className="text-[11px] uppercase tracking-wider text-slate-400 font-bold mb-2">Live Variables</div>
            <div className="space-y-1.5 text-xs font-mono">
              <div className="flex justify-between py-1 border-b border-white/5"><span className="text-slate-400">marks</span><span className="text-emerald-400">[72, 85, 90]</span></div>
              <div className="flex justify-between py-1 border-b border-white/5"><span className="text-slate-400">m</span><span className="text-amber-300">85 (item #2)</span></div>
              <div className="flex justify-between py-1"><span className="text-slate-400">total</span><span className="text-sky-300">72 → 157</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function CardErrorDiagnosis() {
  return (
    <div className="w-full h-full bg-[#18181b] text-slate-100 flex flex-col font-sans">
      <div className="h-11 px-5 border-b border-white/10 flex items-center justify-between bg-[#121214]">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-rose-500/80" />
          <span className="w-3 h-3 rounded-full bg-amber-500/80" />
          <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
          <span className="ml-2 text-xs font-mono text-slate-400">discount.py</span>
        </div>
        <span className="text-[11px] font-semibold text-rose-400 bg-rose-950/70 border border-rose-800/60 px-2.5 py-0.5 rounded-full flex items-center gap-1">
          <AlertCircle className="w-3 h-3" /> Error Detected
        </span>
      </div>

      <div className="p-6 flex-1 flex flex-col justify-between">
        <div className="bg-[#09090b] rounded-xl p-4 border border-white/5 font-mono text-[13px] leading-[24px]">
          <div><span className="text-slate-500 select-none mr-3">1</span><span className="text-purple-400">def</span> <span className="text-blue-400">apply_discount</span>(<span className="text-sky-300">price</span>, <span className="text-sky-300">rate</span>):</div>
          <div><span className="text-slate-500 select-none mr-3">2</span>{"    "}<span className="text-sky-300">discount_amt</span> = <span className="text-sky-300">price</span> * <span className="text-sky-300">rate</span></div>
          <div className="bg-rose-500/20 -mx-4 px-4 border-l-2 border-rose-500">
            <span className="text-rose-400 font-bold select-none mr-3">3</span>{"    "}<span className="text-purple-400">return</span> <span className="text-sky-300">price</span> - <span className="text-rose-300 underline decoration-wavy decoration-rose-500">discount</span>
          </div>
        </div>

        <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-rose-950/40 to-slate-900 border border-rose-800/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-rose-300 font-bold text-sm">
              <Wrench className="w-4 h-4 text-rose-400" />
              <span>Friendly Error Explainer · NameError</span>
            </div>
            <button className="text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 px-3 py-1 rounded-lg transition-colors flex items-center gap-1">
              <Check className="w-3 h-3" /> Fix: Change to "discount_amt"
            </button>
          </div>
          <p className="mt-2 text-xs text-slate-300 leading-relaxed">
            Python cannot find <code className="text-rose-300 font-mono">discount</code>. You created <code className="text-emerald-300 font-mono">discount_amt</code> on line 2 — did you mean to use that instead?
          </p>
        </div>
      </div>
    </div>
  )
}

function CardBinarySearch() {
  return (
    <div className="w-full h-full bg-[#18181b] text-slate-100 flex flex-col font-sans">
      <div className="h-11 px-5 border-b border-white/10 flex items-center justify-between bg-[#121214]">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-rose-500/80" />
          <span className="w-3 h-3 rounded-full bg-amber-500/80" />
          <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
          <span className="ml-2 text-xs font-mono text-slate-400">binary_search.py</span>
        </div>
        <span className="text-[11px] font-semibold text-sky-400 bg-sky-950/70 border border-sky-800/60 px-2.5 py-0.5 rounded-full flex items-center gap-1">
          <Cpu className="w-3 h-3" /> O(log N) Execution
        </span>
      </div>

      <div className="p-6 flex-1 flex flex-col justify-between">
        <div className="bg-[#09090b] rounded-xl p-4 border border-white/5 font-mono text-[13px] leading-[23px]">
          <div><span className="text-slate-500 select-none mr-3">1</span><span className="text-purple-400">while</span> <span className="text-sky-300">low</span> &lt;= <span className="text-sky-300">high</span>:</div>
          <div className="bg-sky-500/15 -mx-4 px-4 border-l-2 border-sky-400">
            <span className="text-sky-300 font-bold select-none mr-3">2</span>{"    "}<span className="text-sky-300">mid</span> = (<span className="text-sky-300">low</span> + <span className="text-sky-300">high</span>) // <span className="text-emerald-400">2</span>
          </div>
          <div><span className="text-slate-500 select-none mr-3">3</span>{"    "}<span className="text-purple-400">if</span> <span className="text-sky-300">arr</span>[<span className="text-sky-300">mid</span>] == <span className="text-sky-300">target</span>: <span className="text-purple-400">return</span> <span className="text-sky-300">mid</span></div>
          <div><span className="text-slate-500 select-none mr-3">4</span>{"    "}<span className="text-purple-400">elif</span> <span className="text-sky-300">arr</span>[<span className="text-sky-300">mid</span>] &lt; <span className="text-sky-300">target</span>: <span className="text-sky-300">low</span> = <span className="text-sky-300">mid</span> + <span className="text-emerald-400">1</span></div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="p-3 rounded-xl bg-slate-900 border border-white/10 text-center">
            <div className="text-[10px] text-slate-400 uppercase font-mono">Pointers</div>
            <div className="text-sm font-bold text-sky-400 font-mono mt-0.5">low: 4 · high: 7</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-900 border border-white/10 text-center">
            <div className="text-[10px] text-slate-400 uppercase font-mono">Bisected Mid</div>
            <div className="text-sm font-bold text-amber-300 font-mono mt-0.5">index 5 (val: 42)</div>
          </div>
          <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-800/40 text-center">
            <div className="text-[10px] text-emerald-400 uppercase font-mono">Match Status</div>
            <div className="text-sm font-bold text-emerald-300 font-mono mt-0.5">Target Found!</div>
          </div>
        </div>
      </div>
    </div>
  )
}

function CardLessonsPath() {
  return (
    <div className="w-full h-full bg-[#18181b] text-slate-100 flex flex-col font-sans">
      <div className="h-11 px-5 border-b border-white/10 flex items-center justify-between bg-[#121214]">
        <div className="flex items-center gap-2">
          <GraduationCap className="w-4 h-4 text-blue-400" />
          <span className="text-xs font-semibold text-slate-200">NexusCode Curriculum Path</span>
        </div>
        <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-950/70 border border-emerald-800/60 px-2.5 py-0.5 rounded-full">
          Lesson 03 of 28
        </span>
      </div>

      <div className="p-6 flex-1 flex flex-col justify-between">
        <div>
          <div className="text-base font-bold text-white">Conditionals & Boolean Branching</div>
          <p className="text-xs text-slate-400 mt-1">
            Write an algorithm that takes student exam marks and returns whether they passed with distinction.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 my-2">
          <div className="p-3 rounded-xl bg-slate-900/90 border border-white/10 flex items-center gap-2.5">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <div className="text-xs text-slate-300">Automatic code evaluation</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-900/90 border border-white/10 flex items-center gap-2.5">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <div className="text-xs text-slate-300">Progressive difficulty tiers</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-900/90 border border-white/10 flex items-center gap-2.5">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <div className="text-xs text-slate-300">Instant plain-English hints</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-900/90 border border-white/10 flex items-center gap-2.5">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <div className="text-xs text-slate-300">Zero setup in-browser Pyodide</div>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-white/10">
          <span>Mastery: Beginner → Intermediate</span>
          <span className="text-blue-400 font-semibold flex items-center gap-1">
            Start Lesson <ArrowRight className="w-3 h-3" />
          </span>
        </div>
      </div>
    </div>
  )
}

function CardFlowchartView() {
  return (
    <div className="w-full h-full bg-[#18181b] text-slate-100 flex flex-col font-sans">
      <div className="h-11 px-5 border-b border-white/10 flex items-center justify-between bg-[#121214]">
        <div className="flex items-center gap-2">
          <Workflow className="w-4 h-4 text-purple-400" />
          <span className="text-xs font-semibold text-slate-200">Automatic Flowchart Synthesis</span>
        </div>
        <span className="text-[11px] font-semibold text-purple-400 bg-purple-950/70 border border-purple-800/60 px-2.5 py-0.5 rounded-full">
          AST View
        </span>
      </div>

      <div className="p-6 flex-1 flex flex-col justify-between">
        <div className="grid grid-cols-[1.1fr_1fr] gap-4 items-center">
          <div className="bg-[#09090b] rounded-xl p-3 border border-white/5 font-mono text-[12px] leading-[22px]">
            <div><span className="text-purple-400">if</span> <span className="text-sky-300">score</span> &gt;= <span className="text-emerald-400">90</span>:</div>
            <div>{"  "}<span className="text-sky-300">grade</span> = <span className="text-amber-200">"A"</span></div>
            <div><span className="text-purple-400">elif</span> <span className="text-sky-300">score</span> &gt;= <span className="text-emerald-400">80</span>:</div>
            <div>{"  "}<span className="text-sky-300">grade</span> = <span className="text-amber-200">"B"</span></div>
            <div><span className="text-purple-400">else</span>:</div>
            <div>{"  "}<span className="text-sky-300">grade</span> = <span className="text-amber-200">"C"</span></div>
          </div>

          <div className="flex flex-col items-center gap-1.5 text-[11px] font-mono">
            <div className="px-3 py-1 rounded bg-blue-600/30 border border-blue-500/50 text-blue-200">score &gt;= 90?</div>
            <span className="text-slate-500">↓</span>
            <div className="px-3 py-1 rounded bg-purple-600/30 border border-purple-500/50 text-purple-200">score &gt;= 80?</div>
            <span className="text-slate-500">↓</span>
            <div className="px-3 py-1 rounded bg-emerald-600/30 border border-emerald-500/50 text-emerald-200">Default: "C"</div>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-purple-950/30 border border-purple-800/40 text-xs text-slate-300 leading-relaxed mt-2">
          NexusCode parses the program's abstract syntax tree (AST) into visual state machines, turning cryptic nested conditionals into an obvious diagram.
        </div>
      </div>
    </div>
  )
}

// ─── Default Cards for NexusCode ──────────────────────────────────────────────

export function nexusCodeCards(): AgentScanCard[] {
  return [
    {
      label: "Python Loops & State Tracking",
      face: <CardLoopAverage />,
      original: 100,
      compressed: 0,
      notes: [
        "// NexusCode AST Engine",
        "// Mode: Line-by-line synced",
        "// Runtime: Pyodide (In-Browser)",
        "// Variables tracked: 3",
        "// Hallucination: 0%",
      ],
      markup: `L1 [LIST]: Creates list \`marks\` with [72, 85, 90]
L2 [VARIABLE]: Initializes \`total = 0\` accumulator
L3 [LOOP]: Iterates over 3 items in \`marks\`
L4 [MUTATION]: total = total + m (72 → 157 → 247)
L5 [OUTPUT]: Prints average 82.33 to stdout

>>> Execution verified: All invariants valid.`,
    },
    {
      label: "Friendly Error Help",
      face: <CardErrorDiagnosis />,
      original: 100,
      compressed: 0,
      notes: [
        "// Heuristic Bug Scanner",
        "// Error: NameError identified",
        "// Root cause: Typo at Line 3",
        "// Suggested fix: discount_amt",
        "// Fix confidence: 100%",
      ],
      markup: `[ROOT CAUSE IDENTIFIED]
Line 3: NameError: name 'discount' is not defined.

Scope analysis:
- Found declared variable \`discount_amt\` on Line 2
- Levenshtein distance: 1 edit away
- Safe automated patch available via 1-click.`,
    },
    {
      label: "Binary Search Execution",
      face: <CardBinarySearch />,
      original: 100,
      compressed: 0,
      notes: [
        "// Algorithm Semantic Trace",
        "// Time: O(log N) logarithmic",
        "// Space: O(1) auxiliary",
        "// Pointer state: low, mid, high",
        "// Loop termination: verified",
      ],
      markup: `[BINARY SEARCH TRACE]
Input Array: [3, 8, 14, 21, 29, 42, 60, 77]
Target Search: 42

Step 1: low=0, high=7, mid=3 (arr[3]=21 < 42)
Step 2: low=4, high=7, mid=5 (arr[5]=42 == 42)
Result: Found at index 5 in 2 operations.`,
    },
    {
      label: "Guided Learning Lessons",
      face: <CardLessonsPath />,
      original: 100,
      compressed: 0,
      notes: [
        "// Learning Path Tracker",
        "// Module: Core Foundations",
        "// Hands-on exercises: 28",
        "// Level: Beginner to Senior",
        "// Real-time evaluation: Active",
      ],
      markup: `[LESSON OBJECTIVES]
1. Conditionals: if / elif / else branches
2. Boolean comparison operators
3. Type casting & boundary checks

Feedback: Automatically evaluated upon Run.
Status: Mastered with instant visual feedback.`,
    },
    {
      label: "Automatic Flowchart Synthesis",
      face: <CardFlowchartView />,
      original: 100,
      compressed: 0,
      notes: [
        "// Control Flow Visualizer",
        "// Parser: Web Tree-sitter AST",
        "// Diagram: Decision branch tree",
        "// Cognitive load: Minimal",
        "// Export: SVG / Mermaid format",
      ],
      markup: `[FLOWCHART SYNTHESIS]
(Score Evaluation)
  ├── Is score >= 90?
  │     ├── TRUE: grade = "A"
  │     └── FALSE: Continue
  ├── Is score >= 80?
  │     ├── TRUE: grade = "B"
  │     └── FALSE: grade = "C"
  └── Terminate branch`,
    },
  ]
}

// Keep original fallback cards exportable
export function defaultCards(base: string = IMG_BASE): AgentScanCard[] {
  return nexusCodeCards()
}

type Particle = { x: number; y: number; vx: number; vy: number; age: number; life: number; size: number; cream: boolean }

const reducedMotion = () =>
  typeof window !== "undefined" && !!window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches

export default function AgentScanCarousel({
  cards,
  eyebrow = "Real-time Code Intelligence",
  title = "Written in code.",
  titleItalic = "Understood in plain English.",
  description = "Fling or drag the stream to watch the scanner slice through real programs. On the right, the code as written; on the left, instant line-by-line explanations, variable states, and friendly error guidance.",
  ctaLabel = "Try the interactive workspace",
  ctaHref = "#playground",
  counterLabel = "Clarity scan",
  speed = 46,
  accent = "#38bdf8",
  ctaColor = "#2563eb",
  height = "max(75vh, 640px)",
  fontHref = FONT_HREF,
  className,
  onCtaClick,
  showHeader = true,
  transparent = false,
}: AgentScanCarouselProps) {
  const list = React.useMemo(() => (cards && cards.length ? cards : nexusCodeCards()), [cards])
  const rootRef = React.useRef<HTMLDivElement | null>(null)
  const headRef = React.useRef<HTMLDivElement | null>(null)
  const stageRef = React.useRef<HTMLDivElement | null>(null)
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null)
  const meterRef = React.useRef<HTMLDivElement | null>(null)
  const numRef = React.useRef<HTMLSpanElement | null>(null)
  const pctRef = React.useRef<HTMLSpanElement | null>(null)
  const cardEls = React.useRef<(HTMLDivElement | null)[]>([])
  const faceEls = React.useRef<(HTMLDivElement | null)[]>([])
  const codeEls = React.useRef<(HTMLDivElement | null)[]>([])
  const [copies, setCopies] = React.useState(2)
  const live = React.useRef({
    offset: 0,
    vel: -speed,
    drag: false,
    lastX: 0,
    lastT: 0,
    dragVel: 0,
    scale: 1,
    stageW: 0,
    placed: false,
  })

  const n = list.length
  const slots = n * copies

  React.useEffect(() => {
    const root = rootRef.current
    const head = headRef.current
    const stage = stageRef.current
    if (!root || !stage) return
    const fit = () => {
      const w = root.clientWidth
      const h = root.clientHeight
      const headH = head ? head.offsetHeight : 0
      const avail = h - headH - (head ? 80 : 20)
      const s = fitScale(w, avail > 200 ? avail : STAGE_H)
      const L = live.current
      L.scale = s
      L.stageW = w
      stage.style.height = STAGE_H * s + "px"
      stage.style.marginTop = Math.round(Math.max(4, (head ? 48 : 12) * s)) + "px"
      const need = Math.max(2, Math.ceil((w + 2 * PITCH * s) / (n * PITCH * s)))
      setCopies((c) => (c === need ? c : need))
      if (!L.placed) {
        L.offset = w / 2 - 0.42 * CARD_W * s
        L.placed = true
      }
    }
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(root)
    if (head) ro.observe(head)
    return () => ro.disconnect()
  }, [n, showHeader])

  React.useEffect(() => {
    const stage = stageRef.current
    const canvas = canvasRef.current
    if (!stage || !canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    const L = live.current
    const reduce = reducedMotion()
    const base = reduce ? 0 : -Math.abs(speed)
    if (!L.drag) L.vel = base
    const particles: Particle[] = []
    let intensity = 0
    let spawnAcc = 0
    let last = performance.now()
    let raf = 0
    let visible = true
    let shown = ""
    let cw = 0
    let ch = 0
    let dpr = 1
    const clipCache: string[] = []
    const posCache: string[] = []
    const accentRgb = (() => {
      const m = /^#?([0-9a-f]{6})$/i.exec(accent.trim())
      const v = m ? parseInt(m[1], 16) : 0x38bdf8
      return [(v >> 16) & 255, (v >> 8) & 255, v & 255]
    })()
    const rgba = (a: number) => "rgba(" + accentRgb[0] + "," + accentRgb[1] + "," + accentRgb[2] + "," + a + ")"

    const sizeCanvas = () => {
      const s = L.scale
      const w = L.stageW || stage.clientWidth
      const h = STAGE_H * s
      dpr = Math.min(2, window.devicePixelRatio || 1)
      if (cw !== w || ch !== h) {
        cw = w
        ch = h
        canvas.width = Math.round(w * dpr)
        canvas.height = Math.round(h * dpr)
        canvas.style.width = w + "px"
        canvas.style.height = h + "px"
      }
    }

    const drawBeam = (scanX: number, s: number) => {
      const top = (CARD_TOP - 25) * s
      const bot = (CARD_TOP + CARD_H + 40) * s
      const core = Math.max(4, 8 * s)
      const left = scanX - core / 2 - 56 * s
      const right = scanX + core / 2 + 48 * s
      const g = ctx.createLinearGradient(left, 0, right, 0)
      const span = right - left
      const at = (x: number) => Math.min(1, Math.max(0, (x - left) / span))
      g.addColorStop(0, rgba(0))
      g.addColorStop(at(scanX - core / 2 - 40 * s), rgba(0.1))
      g.addColorStop(at(scanX - core / 2 - 24 * s), rgba(0.25))
      g.addColorStop(at(scanX - core / 2 - 10 * s), rgba(0.55))
      g.addColorStop(at(scanX - core / 2 - 2 * s), rgba(0.95))
      g.addColorStop(at(scanX - core / 2), rgba(1))
      g.addColorStop(at(scanX + core / 2), rgba(1))
      g.addColorStop(at(scanX + core / 2 + 6 * s), rgba(0.65))
      g.addColorStop(at(scanX + core / 2 + 14 * s), rgba(0.38))
      g.addColorStop(at(scanX + core / 2 + 26 * s), rgba(0.14))
      g.addColorStop(1, rgba(0))
      ctx.save()
      ctx.fillStyle = g
      ctx.fillRect(left, top, span, bot - top)

      ctx.globalCompositeOperation = "destination-out"
      const fade = 34 * s
      const gt = ctx.createLinearGradient(0, top, 0, top + fade)
      gt.addColorStop(0, "rgba(0,0,0,1)")
      gt.addColorStop(1, "rgba(0,0,0,0)")
      ctx.fillStyle = gt
      ctx.fillRect(left, top, span, fade)
      const gb = ctx.createLinearGradient(0, bot - fade, 0, bot)
      gb.addColorStop(0, "rgba(0,0,0,0)")
      gb.addColorStop(1, "rgba(0,0,0,1)")
      ctx.fillStyle = gb
      ctx.fillRect(left, bot - fade, span, fade)
      ctx.restore()
    }

    const frame = (now: number) => {
      raf = 0
      const dt = Math.min(0.05, Math.max(0, (now - last) / 1000))
      last = now
      const s = L.scale
      const pitch = PITCH * s
      const period = slots * pitch
      const scanX = Math.round((L.stageW || stage.clientWidth) / 2)
      if (!L.drag) {
        L.vel = reduce ? 0 : relaxVelocity(L.vel, base, dt, 0.55)
        L.offset += L.vel * dt
      }
      L.offset = wrap(L.offset, period)

      let over = -1
      let overP = 0
      for (let i = 0; i < slots; i++) {
        const el = cardEls.current[i]
        if (!el) continue
        const x = slotX(i, L.offset, pitch, period)
        const pos = "translate3d(" + x.toFixed(2) + "px," + (CARD_TOP * s).toFixed(2) + "px,0) scale(" + s + ")"
        if (posCache[i] !== pos) {
          el.style.transform = pos
          posCache[i] = pos
        }
        const local = Math.min(CARD_W, Math.max(0, (scanX - x) / s))
        const clip = local.toFixed(1)
        if (clipCache[i] !== clip) {
          clipCache[i] = clip
          const f = faceEls.current[i]
          const c = codeEls.current[i]
          if (f) f.style.clipPath = "inset(0 0 0 " + clip + "px)"
          if (c) {
            c.style.clipPath = "inset(0 " + (CARD_W - local).toFixed(1) + "px 0 0)"
            c.style.visibility = local <= 0 ? "hidden" : "visible"
          }
        }
        const p = scanProgress(scanX, x, CARD_W * s)
        if (p >= 0) {
          over = i % n
          overP = p
        }
      }

      if (over >= 0) {
        const c = list[over]
        const r = tokenReadout(overP, c.original, c.compressed)
        const percent = Math.min(100, Math.round(overP * 100))
        const txt = percent + "%"
        if (txt !== shown) {
          shown = txt
          if (numRef.current) numRef.current.textContent = percent + "%"
          if (pctRef.current) pctRef.current.textContent = "Explained"
        }
      }

      sizeCanvas()
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, cw, ch)
      drawBeam(scanX, s)
      if (!reduce) {
        const target = over >= 0 ? 1 : 0
        intensity += (target - intensity) * (1 - Math.exp(-dt / (target > intensity ? 1.4 : 0.55)))
        spawnAcc += 860 * intensity * s * dt
        const top = CARD_TOP * s
        const hgt = CARD_H * s
        const drift = Math.min(0, L.drag ? L.dragVel : L.vel)
        while (spawnAcc >= 1 && particles.length < 3200) {
          spawnAcc -= 1
          particles.push({
            x: scanX + 5 * s + (Math.random() < 0.96 ? Math.pow(Math.random(), 1.75) * 196 : 140 + Math.random() * 140) * s,
            y: top - 32 * s + Math.random() * (hgt + 64 * s),
            vx: (4 + Math.random() * 22) * s,
            vy: (Math.random() - 0.5) * 8 * s,
            age: 0,
            life: 0.7 + Math.random() * 1.5,
            size: [2, 3, 3, 4, 4, 5, 5, 6][(Math.random() * 8) | 0] * Math.max(0.6, s),
            cream: Math.random() < 0.25,
          })
        }
        if (spawnAcc > 1) spawnAcc = 0
        const reach = 300 * s
        let k = 0
        for (let i = 0; i < particles.length; i++) {
          const q = particles[i]
          q.age += dt
          q.x += (q.vx + drift * 0.15) * dt
          q.y += q.vy * dt
          const dx = q.x - scanX
          if (q.age >= q.life || dx > reach || dx < -6) continue
          particles[k++] = q
          const fadeT = Math.min(1, (q.life - q.age) / 0.25, q.age / 0.06)
          const fadeX = 1 - Math.pow(Math.min(1, dx / reach), 6)
          const a = fadeT * fadeX
          if (a <= 0.02) continue
          ctx.globalAlpha = a
          ctx.fillStyle = q.cream ? "#e0f2fe" : accent
          ctx.fillRect(Math.round(q.x), Math.round(q.y), q.size, q.size)
        }
        particles.length = k
        ctx.globalAlpha = 1
      }

      if (meterRef.current) {
        meterRef.current.style.left = scanX + "px"
        meterRef.current.style.top = CARD_TOP * s - 14 - 30 + "px"
      }

      if (visible && !document.hidden && (!reduce || L.drag)) raf = requestAnimationFrame(frame)
    }

    const kick = () => {
      if (!raf && visible && !document.hidden) {
        last = performance.now()
        raf = requestAnimationFrame(frame)
      }
    }
    const io = new IntersectionObserver((e) => {
      visible = e[0] ? e[0].isIntersecting : true
      if (visible) kick()
    })
    io.observe(stage)
    const onVis = () => kick()
    document.addEventListener("visibilitychange", onVis)
    const ro = new ResizeObserver(() => {
      if (reduce) {
        last = performance.now()
        frame(last)
      } else kick()
    })
    ro.observe(stage)

    const onDown = (e: PointerEvent) => {
      if (e.button !== 0) return
      L.drag = true
      L.lastX = e.clientX
      L.lastT = performance.now()
      L.dragVel = 0
      stage.dataset.drag = "1"
      try {
        stage.setPointerCapture(e.pointerId)
      } catch {}
      kick()
    }
    const onMove = (e: PointerEvent) => {
      if (!L.drag) return
      const t = performance.now()
      const dx = e.clientX - L.lastX
      const dts = Math.max(0.001, (t - L.lastT) / 1000)
      L.offset += dx
      L.dragVel = L.dragVel * 0.6 + (dx / dts) * 0.4
      L.lastX = e.clientX
      L.lastT = t
      if (reduce) {
        last = t
        frame(t)
      } else kick()
    }
    const onUp = (e: PointerEvent) => {
      if (!L.drag) return
      L.drag = false
      delete stage.dataset.drag
      const idle = performance.now() - L.lastT > 90
      L.vel = reduce ? 0 : idle ? base : Math.max(-4200, Math.min(4200, L.dragVel))
      try {
        stage.releasePointerCapture(e.pointerId)
      } catch {}
      kick()
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return
      e.preventDefault()
      const dir = e.key === "ArrowLeft" ? -1 : 1
      if (reduce) {
        L.offset += dir * PITCH * L.scale * 0.25
        last = performance.now()
        frame(last)
      } else {
        L.vel += dir * 900
        kick()
      }
    }
    stage.addEventListener("pointerdown", onDown)
    stage.addEventListener("pointermove", onMove)
    stage.addEventListener("pointerup", onUp)
    stage.addEventListener("pointercancel", onUp)
    stage.addEventListener("keydown", onKey)
    kick()
    if (reduce) frame(performance.now())
    return () => {
      if (raf) cancelAnimationFrame(raf)
      io.disconnect()
      ro.disconnect()
      document.removeEventListener("visibilitychange", onVis)
      stage.removeEventListener("pointerdown", onDown)
      stage.removeEventListener("pointermove", onMove)
      stage.removeEventListener("pointerup", onUp)
      stage.removeEventListener("pointercancel", onUp)
      stage.removeEventListener("keydown", onKey)
    }
  }, [slots, n, list, speed, accent])

  const vars = {
    height,
    width: "100%",
    ...(transparent ? { background: "transparent" } : {}),
    "--asc-accent": accent,
    "--asc-glow": "color-mix(in oklab," + accent + " 35%,transparent)",
  } as React.CSSProperties

  return (
    <div ref={rootRef} className={"asc-root" + (className ? " " + className : "")} style={vars}>
      {fontHref && <link rel="stylesheet" href={fontHref} />}
      <style>{css}</style>
      <svg className="asc-gridlines" width="100%" height="100%" aria-hidden="true">
        <defs>
          <pattern id="asc-grid-cell" width="122" height="122" patternUnits="userSpaceOnUse">
            <path d="M122 0.5H0.5V122" fill="none" stroke="#38bdf8" strokeDasharray="4 4" strokeOpacity="0.4" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#asc-grid-cell)" />
      </svg>

      {showHeader && (
        <div ref={headRef} className="asc-head">
          <div>
            <p className="asc-eyebrow flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-sky-400" /> {eyebrow}
            </p>
            <h2 className="asc-title">
              {title}
              <i>{titleItalic}</i>
            </h2>
          </div>
          <div>
            <p className="asc-desc">{description}</p>
            {ctaLabel && (
              <button
                className="asc-cta"
                onClick={onCtaClick ? onCtaClick : undefined}
                style={{ background: ctaColor }}
              >
                <span>{ctaLabel}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      <div
        ref={stageRef}
        className="asc-stage"
        tabIndex={0}
        role="region"
        aria-roledescription="carousel"
        aria-label="Code programs passing through a scanner that breaks them down into plain English explanations and variable states. Drag or use arrow keys."
        style={{ height: STAGE_H }}
      >
        <div className="asc-fade">
          {Array.from({ length: slots }, (_, i) => {
            const c = list[i % n]
            const dup = i >= n
            return (
              <div
                key={i}
                ref={(el) => {
                  cardEls.current[i] = el
                }}
                className="asc-card"
                aria-hidden={dup ? true : undefined}
              >
                <div
                  className="asc-code"
                  ref={(el) => {
                    codeEls.current[i] = el
                  }}
                  aria-hidden="true"
                  style={{ visibility: "hidden" }}
                >
                  <div className="asc-code-main">{c.markup}</div>
                  <div className="asc-code-notes">{(c.notes || []).join("\n")}</div>
                </div>
                <div
                  className="asc-face"
                  role={dup ? undefined : "img"}
                  aria-label={dup ? undefined : c.label}
                  ref={(el) => {
                    faceEls.current[i] = el
                  }}
                >
                  {c.face}
                </div>
              </div>
            )
          })}
        </div>
        <canvas ref={canvasRef} className="asc-canvas" aria-hidden="true" />
        <div ref={meterRef} className="asc-meter" aria-hidden="true" style={{ left: "50%", top: -4 }}>
          <div className="asc-meter-label">{counterLabel}</div>
          <div className="asc-pill">
            <span ref={numRef} className="asc-pill-n">
              0%
            </span>
            <span ref={pctRef} className="asc-pill-p">
              Explained
            </span>
          </div>
        </div>
      </div>
      <span className="asc-sr">
        {list.map((c) => c.label + ": line-by-line understanding verified.").join(" ")}
      </span>
    </div>
  )
}
