import React, { useMemo, useState } from 'react';
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
import { Scene3D, Box3D, Billboard, BoxPalette } from './Scene3D';
import type { ArchitectureMap, NodeKind, PositionedNode } from '../../utils/visual3d/architecture';
import { layoutArchitecture } from '../../utils/visual3d/architecture';
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

const shade = (hex: string, amt: number) => {
  const n = parseInt(hex.slice(1), 16);
  const f = (c: number) => Math.max(0, Math.min(255, Math.round(c * amt)));
  return `#${[(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => f(c).toString(16).padStart(2, '0')).join('')}`;
};
const paletteFor = (color: string, active: boolean): BoxPalette => ({
  top: shade(color, active ? 1.05 : 0.85),
  front: shade(color, 0.62),
  side: shade(color, 0.45),
  edge: `${color}99`,
  glow: active ? `${color}aa` : undefined,
});

const NODE_W = 132;
const ARCH_CAMERA = { tilt: 54, turn: -26 };
const NODE_D = 84;

interface ArchitectureWorldProps {
  map: ArchitectureMap;
  activeFile: string;
  /** Line currently executing in step mode (in the active file), if any */
  activeLine: number | null;
  onJumpToLine: (line: number) => void;
}

/** Isometric 3D map of the program's building blocks and the services they use. */
export const ArchitectureWorld: React.FC<ArchitectureWorldProps> = ({ map, activeFile, activeLine, onJumpToLine }) => {
  const layout = useMemo(() => layoutArchitecture(map, 250, 160), [map]);
  const byId = useMemo(() => new Map(layout.nodes.map((n) => [n.id, n])), [layout]);
  const [selected, setSelected] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);

  const activeEdges = useMemo(() => {
    if (activeLine === null) return new Set<string>();
    return new Set(map.edges.filter((e) => e.file === activeFile && e.lines.includes(activeLine)).map((e) => `${e.from}->${e.to}`));
  }, [map.edges, activeFile, activeLine]);
  const activeNodes = useMemo(() => {
    const s = new Set<string>();
    map.edges.forEach((e) => {
      if (activeEdges.has(`${e.from}->${e.to}`)) {
        s.add(e.from);
        s.add(e.to);
      }
    });
    return s;
  }, [activeEdges, map.edges]);

  const theme = useTheme3D();
  const light = theme.name === 'light';
  const focus = hovered || selected;
  const selectedNode = selected ? byId.get(selected) : null;
  const kindsPresent = Array.from(new Set(map.nodes.map((n) => n.kind)));

  if (map.nodes.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-center" style={{ background: theme.sceneBg }}>
        <div className="max-w-sm">
          <p className={`text-sm font-semibold ${theme.panelText}`}>Nothing to map yet</p>
          <p className={`text-xs mt-1 ${theme.floorTextMuted}`}>
            Write functions, classes, or use libraries like a database, an AI model or a web API — they will appear here as a 3D map.
          </p>
        </div>
      </div>
    );
  }

  return (
    <Scene3D
      width={layout.width}
      height={layout.height}
      defaultCamera={ARCH_CAMERA}
      ariaLabel="3D architecture map of the program"
      overlay={
        <>
          {/* Legend */}
          <div data-no-orbit className="absolute bottom-3 left-3 z-20 flex flex-wrap gap-1.5 max-w-[60%] cursor-default">
            {kindsPresent.map((k) => {
              const st = KIND_STYLE[k];
              return (
                <span key={k} className={`inline-flex items-center gap-1 rounded-full border backdrop-blur px-2 py-0.5 text-[10px] ${theme.panel}`}>
                  <span className="w-2 h-2 rounded-full" style={{ background: st.color }} /> {st.label}
                </span>
              );
            })}
          </div>
          {selectedNode && (
            <NodeDetails
              node={selectedNode}
              map={map}
              byId={byId}
              activeFile={activeFile}
              onClose={() => setSelected(null)}
              onSelect={setSelected}
              onJumpToLine={onJumpToLine}
            />
          )}
        </>
      }
    >
      {/* Connections, drawn flat on the floor */}
      <svg className="absolute inset-0 overflow-visible pointer-events-none" width={layout.width} height={layout.height} style={{ transform: 'translateZ(2px)' }}>
        <defs>
          <filter id="v3d-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {map.edges.map((e) => {
          const a = byId.get(e.from);
          const b = byId.get(e.to);
          if (!a || !b) return null;
          const key = `${e.from}->${e.to}`;
          const active = activeEdges.has(key);
          const related = focus ? e.from === focus || e.to === focus : false;
          const dim = focus && !related && !active;
          const color = KIND_STYLE[b.kind].color;
          const mx = (a.x + b.x) / 2;
          const my = (a.y + b.y) / 2 - (a.column === b.column ? 70 : 24);
          const path = `M ${a.x} ${a.y} Q ${mx} ${my} ${b.x} ${b.y}`;
          return (
            <g key={key} opacity={dim ? 0.15 : 1}>
              <path d={path} fill="none" stroke={light ? theme.accentText(color) : color} strokeOpacity={active || related ? 0.95 : light ? 0.55 : 0.45} strokeWidth={active ? 4 : related ? 3 : 2} filter={active ? 'url(#v3d-glow)' : undefined} />
              <path d={path} fill="none" stroke={light ? '#0f172a' : '#ffffff'} strokeOpacity={active ? (light ? 0.55 : 0.9) : light ? 0.18 : 0.35} strokeWidth={1.2} strokeDasharray="4 10" className="v3d-flow" style={{ animationDuration: active ? '0.6s' : '1.8s' }} />
              <circle r={active ? 6 : 3.5} fill={light ? theme.accentText(color) : color} filter={light ? undefined : 'url(#v3d-glow)'}>
                <animateMotion dur={active ? '0.9s' : '2.8s'} repeatCount="indefinite" path={path} />
              </circle>
            </g>
          );
        })}
      </svg>

      {/* Edge labels on the floor */}
      {map.edges.map((e) => {
        const a = byId.get(e.from);
        const b = byId.get(e.to);
        if (!a || !b) return null;
        const key = `${e.from}->${e.to}`;
        const show = activeEdges.has(key) || (focus && (e.from === focus || e.to === focus));
        if (!show) return null;
        return (
          <div
            key={`lbl-${key}`}
            className={`absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none rounded-md border px-1.5 py-0.5 text-[10px] font-mono whitespace-nowrap ${light ? 'bg-white border-slate-300 text-slate-700 shadow-sm' : 'bg-slate-900/90 border-white/15 text-slate-100'}`}
            style={{ left: (a.x + b.x) / 2, top: (a.y + b.y) / 2 - (a.column === b.column ? 35 : 12), transform: 'translateZ(3px)' }}
          >
            {e.label}
          </div>
        );
      })}

      {/* Nodes */}
      {layout.nodes.map((n) => (
        <NodeBlock
          key={n.id}
          node={n}
          active={activeNodes.has(n.id)}
          selected={selected === n.id}
          dim={!!focus && focus !== n.id && !map.edges.some((e) => (e.from === focus && e.to === n.id) || (e.to === focus && e.from === n.id))}
          onSelect={() => setSelected(n.id === selected ? null : n.id)}
          onHover={(on) => setHovered(on ? n.id : null)}
        />
      ))}
    </Scene3D>
  );
};

const NodeBlock: React.FC<{
  node: PositionedNode;
  active: boolean;
  selected: boolean;
  dim: boolean;
  onSelect: () => void;
  onHover: (on: boolean) => void;
}> = ({ node, active, selected, dim, onSelect, onHover }) => {
  const theme = useTheme3D();
  const st = KIND_STYLE[node.kind];
  const Icon = st.icon;
  const isService = !['main', 'function', 'class', 'route', 'file'].includes(node.kind);
  const h = isService ? 46 : 32;
  // Note: no opacity on 3D containers — browsers flatten preserve-3d when opacity < 1.
  return (
    <>
      <Box3D
        x={node.x}
        y={node.y}
        w={NODE_W}
        d={NODE_D}
        h={h}
        z={active ? 10 : 0}
        palette={paletteFor(st.color, active || selected)}
        ghost={dim}
        onClick={onSelect}
        onHover={onHover}
        title={`${st.label}: ${node.label}`}
        className={active ? 'v3d-pop' : ''}
        top={<Icon className="w-8 h-8" style={{ color: '#0f172a', opacity: dim ? 0.3 : 0.75 }} />}
        front={<span className={`text-[10px] font-bold uppercase tracking-wider ${dim ? 'text-white/30' : 'text-white/85'}`}>{st.label}</span>}
      />
      <Billboard x={node.x} y={node.y} z={h + (active ? 10 : 0) + 22}>
        <span
          className="block px-3 py-1.5 rounded-lg text-[16px] font-semibold border backdrop-blur transition-opacity"
          style={{
            background: theme.labelBg,
            color: theme.labelText,
            borderColor: selected || active ? theme.accentText(st.color) : theme.labelBorder,
            boxShadow: active ? `0 0 18px ${st.color}88` : theme.name === 'light' ? '0 6px 16px rgba(15,23,42,0.12)' : undefined,
            opacity: dim ? 0.35 : 1,
          }}
        >
          {node.label.length > 26 ? `${node.label.slice(0, 25)}…` : node.label}
        </span>
      </Billboard>
    </>
  );
};

const NodeDetails: React.FC<{
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
