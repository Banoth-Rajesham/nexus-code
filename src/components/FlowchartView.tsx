import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { FlowchartBundle, FlowNode } from '../utils/flowchart/flowGraph';
import { generateMermaidText } from '../utils/flowchart/mermaidGenerator';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  RotateCcw,
  Download,
  Copy,
  Check,
  Info,
  HelpCircle,
  Eye,
  ArrowDownUp,
  Layers,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { Icon } from '@iconify/react';

interface FlowchartViewProps {
  bundle: FlowchartBundle;
  theme?: 'dark' | 'light';
  activeLine?: number | null;
  stepCurrentLine?: number | null;
  visitedLines?: number[];
  onJumpToLine?: (line: number) => void;
}

// Global reference for future Stage 3 export
let activeSvgElement: SVGElement | null = null;
export function getFlowchartSvg(): SVGElement | null {
  return activeSvgElement;
}

export const FlowchartView: React.FC<FlowchartViewProps> = ({
  bundle,
  theme = 'dark',
  activeLine,
  stepCurrentLine,
  visitedLines = [],
  onJumpToLine,
}) => {
  const [selectedChart, setSelectedChart] = useState<string>('Main');
  const [direction, setDirection] = useState<'TD' | 'LR'>('TD');
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isExpanded, setIsExpanded] = useState(false);
  const [followCursor, setFollowCursor] = useState(true);
  const [showLegend, setShowLegend] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [rendering, setRendering] = useState(false);
  const [svgHtml, setSvgHtml] = useState<string>('');
  const [hoveredNode, setHoveredNode] = useState<FlowNode | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const svgWrapperRef = useRef<HTMLDivElement>(null);
  const mermaidRef = useRef<any>(null);

  const currentGraph = bundle.charts[selectedChart] || bundle.charts.Main;

  // Active line target (step current line takes precedence in step mode)
  const effectiveLine = stepCurrentLine || activeLine || null;

  // Find active node based on line range
  const activeNode = useMemo(() => {
    if (!effectiveLine || !currentGraph) return null;
    return (
      currentGraph.nodes.find(
        (n) => effectiveLine >= n.startLine && effectiveLine <= n.endLine && n.kind !== 'start' && n.kind !== 'end'
      ) || null
    );
  }, [effectiveLine, currentGraph]);

  // Set of visited node IDs in Step Mode
  const visitedNodeIds = useMemo(() => {
    const set = new Set<string>();
    if (!visitedLines || visitedLines.length === 0 || !currentGraph) return set;
    for (const line of visitedLines) {
      for (const node of currentGraph.nodes) {
        if (line >= node.startLine && line <= node.endLine) {
          set.add(node.id);
        }
      }
    }
    return set;
  }, [visitedLines, currentGraph]);

  // Generate Mermaid code string
  const mermaidCode = useMemo(() => {
    if (!currentGraph || currentGraph.nodes.length === 0) return '';
    return generateMermaidText(currentGraph, {
      direction,
      theme,
      activeNodeId: activeNode?.id || null,
      visitedNodeIds,
    });
  }, [currentGraph, direction, theme, activeNode?.id, visitedNodeIds]);

  // Lazy-load Mermaid and Render SVG
  useEffect(() => {
    let isCancelled = false;

    async function renderChart() {
      if (!mermaidCode) {
        setSvgHtml('');
        return;
      }

      setRendering(true);
      try {
        if (!mermaidRef.current) {
          const mermaidModule = await import('mermaid');
          mermaidRef.current = mermaidModule.default;
          mermaidRef.current.initialize({
            startOnLoad: false,
            securityLevel: 'strict',
            theme: theme === 'light' ? 'default' : 'dark',
            maxEdges: 2000,
            maxTextSize: 100000,
            flowchart: {
              useMaxWidth: false,
              htmlLabels: false,
              curve: 'basis',
            },
          });
        }

        const uniqueId = `mermaid_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        const { svg } = await mermaidRef.current.render(uniqueId, mermaidCode);

        if (!isCancelled) {
          setSvgHtml(svg);
        }
      } catch (err) {
        console.warn('[Mermaid Render Error]:', err);
      } finally {
        if (!isCancelled) setRendering(false);
      }
    }

    renderChart();

    return () => {
      isCancelled = true;
    };
  }, [mermaidCode, theme]);

  // Attach SVG node click listeners and export reference
  useEffect(() => {
    if (!svgWrapperRef.current) return;
    const svgElem = svgWrapperRef.current.querySelector('svg');
    if (!svgElem) return;
    activeSvgElement = svgElem;

    // Attach click listeners to all nodes in the rendered diagram
    const nodeElems = svgElem.querySelectorAll('.node');
    nodeElems.forEach((elem) => {
      const id = elem.id || '';
      // Find matching FlowNode
      const matchedNode = currentGraph?.nodes.find((n) => id.includes(n.id));

      if (matchedNode) {
        (elem as HTMLElement).style.cursor = 'pointer';

        elem.addEventListener('click', (e) => {
          e.stopPropagation();
          if (matchedNode.subroutineTarget && bundle.charts[matchedNode.subroutineTarget]) {
            setSelectedChart(matchedNode.subroutineTarget);
          } else {
            onJumpToLine?.(matchedNode.startLine);
          }
        });

        elem.addEventListener('mouseenter', () => setHoveredNode(matchedNode));
        elem.addEventListener('mouseleave', () => setHoveredNode(null));
      }
    });
  }, [svgHtml, currentGraph, onJumpToLine, bundle.charts]);

  // Auto-pan to active node if followCursor is true
  useEffect(() => {
    if (!followCursor || !activeNode || !svgWrapperRef.current || !containerRef.current) return;

    const svgElem = svgWrapperRef.current.querySelector('svg');
    if (!svgElem) return;

    const nodeElem = svgElem.querySelector(`[id*="${activeNode.id}"]`);
    if (!nodeElem) return;

    try {
      const bbox = (nodeElem as SVGGraphicsElement).getBBox();
      const containerRect = containerRef.current.getBoundingClientRect();
      const targetX = containerRect.width / 2 - (bbox.x + bbox.width / 2) * zoom;
      const targetY = containerRect.height / 2 - (bbox.y + bbox.height / 2) * zoom;

      setPan({ x: targetX, y: targetY });
    } catch {}
  }, [activeNode, followCursor, zoom]);

  // Pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsPanning(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => setIsPanning(false);

  // Zoom handlers
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.15 : 0.85;
    setZoom((z) => Math.max(0.2, Math.min(3.5, z * factor)));
  };

  const handleZoomIn = () => setZoom((z) => Math.min(3.5, z * 1.2));
  const handleZoomOut = () => setZoom((z) => Math.max(0.2, z / 1.2));
  const handleResetPanZoom = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Export functions
  const handleCopyMermaid = () => {
    navigator.clipboard.writeText(mermaidCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 1500);
  };

  const handleDownloadSvg = () => {
    if (!activeSvgElement) return;
    const serializer = new XMLSerializer();
    const svgStr = serializer.serializeToString(activeSvgElement);
    const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `flowchart_${selectedChart}.svg`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadPng = (lightBg: boolean = false) => {
    if (!activeSvgElement) return;
    const serializer = new XMLSerializer();
    const svgStr = serializer.serializeToString(activeSvgElement);
    const img = new Image();
    const svgBlob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const scale = 2; // High-DPI export
      canvas.width = (img.width || 800) * scale;
      canvas.height = (img.height || 600) * scale;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Background fill
      ctx.fillStyle = lightBg ? '#ffffff' : '#0d1117';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      URL.revokeObjectURL(url);
      const pngUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = pngUrl;
      link.download = `flowchart_${selectedChart}.png`;
      link.click();
    };
    img.src = url;
  };

  // Empty state check
  if (bundle.empty || !currentGraph || currentGraph.nodes.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center select-none text-slate-500">
        <Icon icon="flat-color-icons:tree-structure" width={48} height={48} className="mb-3 opacity-60" />
        <h4 className="text-sm font-bold text-slate-300 mb-1">Flowchart Ready</h4>
        <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
          Type or paste code on the left to see the flowchart here.
        </p>
      </div>
    );
  }

  const chartNames = Object.keys(bundle.charts);

  return (
    <div
      className={`flex-1 flex flex-col min-h-0 relative select-none ${
        isExpanded
          ? 'fixed inset-0 z-50 bg-[#0d1117] p-4 flex flex-col'
          : 'h-full bg-[#1e1e1e]'
      }`}
    >
      {/* ─── TOOLBAR STRIP ─── */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 bg-[#161b22] border-b border-[#30363d] text-xs shrink-0 z-20">
        {/* Left: Focus Selector & Node Count */}
        <div className="flex items-center gap-2">
          {chartNames.length > 1 ? (
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 text-[11px] font-semibold">Focus:</span>
              <select
                value={selectedChart}
                onChange={(e) => {
                  setSelectedChart(e.target.value);
                  handleResetPanZoom();
                }}
                className="bg-[#21262d] border border-[#30363d] text-slate-200 text-xs px-2 py-0.5 rounded font-mono outline-hidden cursor-pointer hover:bg-[#30363d] transition-colors"
                title="Select chart focus"
                aria-label="Select flowchart focus"
              >
                {chartNames.map((name) => (
                  <option key={name} value={name}>
                    {name === 'Main' ? 'Main Program' : `def ${name}()`}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <span className="font-bold text-slate-300 text-xs flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-blue-400" />
              <span>Main Chart</span>
            </span>
          )}

          <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-[#21262d] border border-[#30363d] text-slate-300">
            {currentGraph.nodes.length} nodes
          </span>

          {bundle.capped && (
            <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Capped at 300 nodes
            </span>
          )}
        </div>

        {/* Right: Controls & Actions */}
        <div className="flex items-center gap-1">
          {/* Direction toggle */}
          <button
            onClick={() => setDirection((d) => (d === 'TD' ? 'LR' : 'TD'))}
            title={`Direction: ${direction === 'TD' ? 'Top-Down' : 'Left-Right'}`}
            aria-label="Toggle diagram orientation"
            className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#21262d] hover:bg-[#30363d] text-slate-300 hover:text-white border border-[#30363d] transition-colors"
          >
            <ArrowDownUp className="w-3 h-3 text-slate-400" />
            <span className="font-mono text-[11px]">{direction}</span>
          </button>

          {/* Follow Cursor Toggle */}
          <button
            onClick={() => setFollowCursor((f) => !f)}
            title={followCursor ? 'Auto-pan to active line (Enabled)' : 'Auto-pan to active line (Disabled)'}
            aria-label="Toggle auto-pan to active line"
            className={`p-1 rounded border transition-colors ${
              followCursor
                ? 'bg-blue-600/25 border-blue-500/50 text-blue-300 font-bold'
                : 'bg-[#21262d] border-[#30363d] text-slate-400 hover:text-white'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
          </button>

          {/* Zoom In */}
          <button
            onClick={handleZoomIn}
            title="Zoom In (or Ctrl + Scroll)"
            aria-label="Zoom in"
            className="p-1 rounded bg-[#21262d] hover:bg-[#30363d] text-slate-300 hover:text-white border border-[#30363d] transition-colors"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>

          {/* Zoom Out */}
          <button
            onClick={handleZoomOut}
            title="Zoom Out"
            aria-label="Zoom out"
            className="p-1 rounded bg-[#21262d] hover:bg-[#30363d] text-slate-300 hover:text-white border border-[#30363d] transition-colors"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>

          {/* Reset Pan / Zoom */}
          <button
            onClick={handleResetPanZoom}
            title="Reset Zoom & Pan"
            aria-label="Reset Zoom and Pan"
            className="p-1 rounded bg-[#21262d] hover:bg-[#30363d] text-slate-300 hover:text-white border border-[#30363d] transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Legend Toggle */}
          <button
            onClick={() => setShowLegend((l) => !l)}
            title="Flowchart Symbols Legend"
            aria-label="Toggle flowchart legend"
            className={`p-1 rounded border transition-colors ${
              showLegend
                ? 'bg-amber-600/25 border-amber-500/50 text-amber-300 font-bold'
                : 'bg-[#21262d] border-[#30363d] text-slate-400 hover:text-white'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
          </button>

          {/* Copy Mermaid Code */}
          <button
            onClick={handleCopyMermaid}
            title="Copy Mermaid Code"
            aria-label="Copy Mermaid syntax"
            className="p-1 rounded bg-[#21262d] hover:bg-[#30363d] text-slate-300 hover:text-white border border-[#30363d] transition-colors"
          >
            {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          {/* Export SVG */}
          <button
            onClick={handleDownloadSvg}
            title="Download SVG vector file"
            aria-label="Download SVG"
            className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#21262d] hover:bg-[#30363d] text-slate-300 hover:text-white border border-[#30363d] transition-colors"
          >
            <Download className="w-3 h-3 text-slate-400" />
            <span className="text-[11px]">SVG</span>
          </button>

          {/* Export PNG */}
          <button
            onClick={() => handleDownloadPng(false)}
            title="Download PNG image"
            aria-label="Download PNG"
            className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#21262d] hover:bg-[#30363d] text-slate-300 hover:text-white border border-[#30363d] transition-colors"
          >
            <Download className="w-3 h-3 text-slate-400" />
            <span className="text-[11px]">PNG</span>
          </button>

          {/* Expanded View Toggle */}
          <button
            onClick={() => setIsExpanded((e) => !e)}
            title={isExpanded ? 'Restore Normal View' : 'Expand Flowchart View'}
            aria-label="Toggle expanded flowchart view"
            className="p-1 rounded bg-[#21262d] hover:bg-[#30363d] text-slate-300 hover:text-white border border-[#30363d] transition-colors"
          >
            {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* ─── LEGEND POPOVER ─── */}
      {showLegend && (
        <div className="absolute top-11 right-3 z-30 bg-[#161b22] border border-[#30363d] rounded-lg p-3.5 shadow-2xl w-80 text-xs text-slate-200 animate-fadeIn font-sans space-y-2">
          <div className="flex items-center justify-between border-b border-[#21262d] pb-1.5">
            <span className="font-bold text-white text-xs flex items-center gap-1.5">
              <Icon icon="flat-color-icons:rules" width={16} height={16} />
              Flowchart Symbols & Colors
            </span>
            <button
              onClick={() => setShowLegend(false)}
              className="text-slate-400 hover:text-white text-xs"
            >
              ✕
            </button>
          </div>
          <div className="space-y-1.5 text-[11px]">
            <div className="flex items-center gap-2">
              <div className="w-5 h-3 rounded-full border border-purple-400 bg-purple-900/40" />
              <span><strong>Rounded:</strong> Start / End / Return</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-3 rounded-xs border border-emerald-400 bg-emerald-900/40" />
              <span><strong>Rectangle:</strong> Process / Assignment</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3.5 h-3.5 rotate-45 border border-blue-400 bg-blue-900/40" />
              <span><strong>Diamond (Blue):</strong> Decision (If / Else)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3.5 h-3.5 rotate-45 border border-amber-400 bg-amber-900/40" />
              <span><strong>Diamond (Amber):</strong> Loop Condition (For / While)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-3 skew-x-12 border border-cyan-400 bg-cyan-900/40" />
              <span><strong>Parallelogram:</strong> Input / Output (print, input)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-3 border border-indigo-400 border-dashed bg-slate-800" />
              <span><strong>Subroutine Box:</strong> Function Call (Click to open)</span>
            </div>
          </div>
          <div className="pt-1.5 border-t border-[#21262d] text-[10px] text-slate-400 italic">
            Click any node in the diagram to highlight and jump to its lines in the editor!
          </div>
        </div>
      )}

      {/* ─── HOVERED NODE TOOLTIP STRIP ─── */}
      {hoveredNode && (
        <div className="absolute bottom-2 left-3 z-30 bg-[#161b22]/95 border border-[#30363d] rounded px-3 py-1.5 shadow-xl text-xs max-w-md pointer-events-none animate-fadeIn">
          <div className="flex items-center gap-2 font-mono text-[11px] text-amber-300 font-bold">
            <span>Line {hoveredNode.startLine}{hoveredNode.endLine > hoveredNode.startLine ? `-${hoveredNode.endLine}` : ''}:</span>
            <span className="text-slate-200">{hoveredNode.label}</span>
          </div>
          <div className="text-[10px] text-slate-400 font-mono truncate mt-0.5">
            {hoveredNode.fullText}
          </div>
        </div>
      )}

      {/* ─── INTERACTIVE PAN & ZOOM CANVAS ─── */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        className={`flex-1 overflow-hidden relative ${isPanning ? 'cursor-grabbing' : 'cursor-grab'} flex items-center justify-center`}
      >
        {rendering && (
          <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-[#161b22]/80 px-2.5 py-1 rounded text-xs text-slate-300 border border-[#30363d] backdrop-blur-xs">
            <Sparkles className="w-3.5 h-3.5 text-blue-400 animate-spin" />
            <span>Rendering flowchart...</span>
          </div>
        )}

        <div
          ref={svgWrapperRef}
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: 'center center',
            transition: isPanning ? 'none' : 'transform 0.15s ease-out',
          }}
          className="p-6 inline-block select-none transition-transform"
          dangerouslySetInnerHTML={{ __html: svgHtml }}
        />
      </div>
    </div>
  );
};
