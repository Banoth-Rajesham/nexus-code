// Shared look-up data for the architecture diagram: colour, label and icon
// for every kind of building block, plus the block details panel.

import React from 'react';
import {
  PlayCircle,
  Braces,
  Boxes,
  Route,
  FileCode2,
  Database,
  Bot,
  Globe,
  Server,
  HardDrive,
  Zap,
  Mail,
  Cloud,
  MonitorSmartphone,
  BarChart3,
  Package,
  X,
  CornerDownRight,
} from 'lucide-react';
import type { ArchitectureMap, NodeKind, PositionedNode } from '../../utils/visual3d/architecture';
import { useTheme3D } from './theme3d';

interface KindStyle {
  label: string;
  color: string;
  icon: React.FC<{ className?: string; style?: React.CSSProperties }>;
}

export const KIND_STYLE: Record<NodeKind, KindStyle> = {
  main: { label: 'Entry point', color: '#34d399', icon: PlayCircle },
  function: { label: 'Function', color: '#60a5fa', icon: Braces },
  class: { label: 'Class', color: '#a78bfa', icon: Boxes },
  route: { label: 'Web route', color: '#38bdf8', icon: Route },
  file: { label: 'Project file', color: '#94a3b8', icon: FileCode2 },
  database: { label: 'Database', color: '#fbbf24', icon: Database },
  ai: { label: 'AI model', color: '#f472b6', icon: Bot },
  api: { label: 'Web API', color: '#22d3ee', icon: Globe },
  server: { label: 'Web server', color: '#818cf8', icon: Server },
  storage: { label: 'File storage', color: '#fb923c', icon: HardDrive },
  cache: { label: 'Cache', color: '#facc15', icon: Zap },
  email: { label: 'Email', color: '#fb7185', icon: Mail },
  cloud: { label: 'Cloud', color: '#7dd3fc', icon: Cloud },
  ui: { label: 'User interface', color: '#2dd4bf', icon: MonitorSmartphone },
  data: { label: 'Data & charts', color: '#a3e635', icon: BarChart3 },
  library: { label: 'Library', color: '#94a3b8', icon: Package },
};

export const NodeDetails: React.FC<{
  node: PositionedNode;
  map: ArchitectureMap;
  byId: Map<string, PositionedNode>;
  activeFile: string;
  onClose: () => void;
  onSelect: (id: string) => void;
  onJumpToLine: (line: number) => void;
}> = ({ node, map, byId, activeFile, onClose, onSelect, onJumpToLine }) => {
  const theme = useTheme3D();
  const light = theme.name === 'light';
  const st = KIND_STYLE[node.kind];
  const Icon = st.icon;
  const accent = theme.accentText(st.color);
  const outgoing = map.edges.filter((e) => e.from === node.id);
  const incoming = map.edges.filter((e) => e.to === node.id);
  const usageLines = Array.from(new Set([...node.lines, ...incoming.filter((e) => e.file === activeFile).flatMap((e) => e.lines)])).sort((a, b) => a - b);
  const canJump = node.file === activeFile || incoming.some((e) => e.file === activeFile);

  const Conn: React.FC<{ id: string; label: string; dir: 'in' | 'out' }> = ({ id, label, dir }) => {
    const other = byId.get(id);
    if (!other) return null;
    const ost = KIND_STYLE[other.kind];
    return (
      <button onClick={() => onSelect(id)} className={`w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-left ${light ? 'hover:bg-slate-50' : 'hover:bg-white/5'}`}>
        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: ost.color }} />
        <span className={`text-[11px] truncate flex-1 ${theme.panelText}`}>{other.label}</span>
        <span className={`text-[10px] font-mono shrink-0 ${theme.panelMuted}`}>
          {dir === 'out' ? '→' : '←'} {label}
        </span>
      </button>
    );
  };

  return (
    <div data-no-orbit className={`absolute top-14 right-3 z-30 w-72 max-h-[calc(100%-5rem)] overflow-y-auto rounded-xl border backdrop-blur shadow-2xl cursor-default ${theme.panel}`}>
      <div className={`flex items-start gap-2.5 p-3 border-b ${light ? 'border-slate-200' : 'border-white/10'}`}>
        <span className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${st.color}22`, border: `1px solid ${st.color}66` }}>
          <Icon className="w-4 h-4" style={{ color: accent }} />
        </span>
        <div className="min-w-0 flex-1">
          <div className={`text-sm font-semibold truncate ${light ? 'text-slate-900' : 'text-white'}`}>{node.label}</div>
          <div className="text-[11px]" style={{ color: accent }}>
            {st.label}
            {node.module && node.module !== node.label && <span className={`font-mono ${theme.panelMuted}`}> · {node.module}</span>}
          </div>
        </div>
        <button onClick={onClose} aria-label="Close details" className={`p-1 rounded ${theme.button}`}>
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      <p className={`px-3 pt-2.5 text-xs leading-relaxed ${theme.panelText}`}>{node.description}</p>
      {usageLines.length > 0 && canJump && (
        <div className="px-3 pt-2.5 flex flex-wrap items-center gap-1">
          <span className={`text-[10px] uppercase tracking-wider font-bold mr-1 ${theme.panelTitle}`}>Lines</span>
          {usageLines.slice(0, 10).map((l) => (
            <button key={l} onClick={() => onJumpToLine(l)} className={`text-[10.5px] font-mono rounded border px-1.5 py-0.5 ${light ? 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700' : 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-200'}`}>
              {l}
            </button>
          ))}
        </div>
      )}
      {(outgoing.length > 0 || incoming.length > 0) && (
        <div className="p-2 mt-1.5">
          <div className={`px-1 pb-1 text-[10px] uppercase tracking-wider font-bold ${theme.panelTitle}`}>Connections</div>
          {incoming.map((e) => (
            <Conn key={`in-${e.from}`} id={e.from} label={e.label} dir="in" />
          ))}
          {outgoing.map((e) => (
            <Conn key={`out-${e.to}`} id={e.to} label={e.label} dir="out" />
          ))}
        </div>
      )}
      {canJump && usageLines[0] && (
        <div className="px-3 pb-3">
          <button
            onClick={() => onJumpToLine(usageLines[0])}
            className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold py-2"
          >
            <CornerDownRight className="w-3.5 h-3.5" /> Show in code
          </button>
        </div>
      )}
    </div>
  );
};
