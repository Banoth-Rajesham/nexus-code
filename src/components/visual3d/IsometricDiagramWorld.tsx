import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Play,
  Braces,
  Boxes,
  Route,
  FileCode2,
  Database,
  Bot,
  Globe,
  HardDrive,
  Zap,
  Mail,
  Cloud,
  Package,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Pause,
} from 'lucide-react';
import type { ArchitectureMap, ArchNode, NodeKind, PositionedNode } from '../../utils/visual3d/architecture';
import { SERVICE_KINDS } from '../../utils/visual3d/architecture';
import { KIND_STYLE, NodeDetails } from './architectureStyle';
import { useTheme3D } from './theme3d';

// ============================================================================
// ISOMETRIC DIAGRAM VIEW
// A clean, "diagram kit" style isometric picture of the program's
// architecture: outlined blocks with flat shading, grouped on platforms, labels
// lying on the floor, and connectors routed along the grid. Pure SVG, so it is
// crisp at any zoom and cheap to render. Works for any code the analyzer maps.
// ============================================================================

type P2 = [number, number];

/** Pixels per world unit */
const U = 44;
const C = Math.cos(Math.PI / 6);
const S = 0.5;
const proj = (gx: number, gy: number, gz = 0): P2 => [(gx - gy) * C * U, (gx + gy) * S * U - gz * U];
const fmt = (p: P2) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`;
const pts = (list: P2[]) => list.map(fmt).join(' ');

/** Height of the platform slabs; blocks and connectors sit on top */
const SLAB = 0.3;
const COL_STEP = 4.2;
const ROW_STEP = 3.4;
const GROUP_GAP = 4.6;

// ── Colour ──────────────────────────────────────────────────────────────────

interface Body {
  top: string;
  left: string;
  right: string;
  line: string;
}

interface Palette {
  bg: string;
  grid: string;
  blue: Body;
  lav: Body;
  slab: Body;
  slabShadow: string;
  screen: string;
  slot: string;
  glassFill: string;
  glassLine: string;
  pillBg: string;
  pillLine: string;
  pillText: string;
  band: string;
  bandHot: string;
  dotted: string;
  active: string;
  select: string;
  shadow: string;
  trayBg: string;
  trayLine: string;
  title: string;
  subtitle: string;
}

const PALETTES: Record<'light' | 'dark', Palette> = {
  light: {
    bg: '#f4f5fa',
    grid: 'rgba(120,130,170,0.13)',
    blue: { top: '#7ea4ff', left: '#5b86f5', right: '#3f67d8', line: '#1e2847' },
    lav: { top: '#f3f4fc', left: '#dfe2f4', right: '#c8cde8', line: '#2b3148' },
    slab: { top: '#fbfbfe', left: '#eceef5', right: '#dfe2ec', line: '#d3d7e4' },
    slabShadow: 'rgba(60,70,110,0.10)',
    screen: '#8a96c9',
    slot: '#eef2ff',
    glassFill: 'rgba(225,229,242,0.55)',
    glassLine: 'rgba(120,132,175,0.55)',
    pillBg: '#eef0fa',
    pillLine: '#2b3148',
    pillText: '#2b3148',
    band: 'rgba(170,180,222,0.85)',
    bandHot: '#8ea5f2',
    dotted: '#3a4160',
    active: '#2f6bff',
    select: '#5a6690',
    shadow: 'rgba(40,50,95,0.20)',
    trayBg: 'rgba(255,255,255,0.92)',
    trayLine: '#d9dcea',
    title: '#262c3f',
    subtitle: '#5b6380',
  },
  dark: {
    bg: '#0c1120',
    grid: 'rgba(130,145,200,0.08)',
    blue: { top: '#6b94ff', left: '#4673ea', right: '#2f53bf', line: '#050816' },
    lav: { top: '#414b70', left: '#323a5a', right: '#262d47', line: '#050816' },
    slab: { top: '#161e35', left: '#121931', right: '#0e1428', line: '#253054' },
    slabShadow: 'rgba(0,0,0,0.35)',
    screen: '#6d7ac0',
    slot: '#c9d6ff',
    glassFill: 'rgba(60,75,125,0.22)',
    glassLine: 'rgba(130,150,215,0.45)',
    pillBg: '#1c2440',
    pillLine: '#7884b8',
    pillText: '#dfe5ff',
    band: 'rgba(95,110,170,0.75)',
    bandHot: '#6f88dc',
    dotted: '#9aa6d8',
    active: '#4f86ff',
    select: '#8f9bd0',
    shadow: 'rgba(0,0,0,0.45)',
    trayBg: 'rgba(17,23,42,0.92)',
    trayLine: 'rgba(255,255,255,0.10)',
    title: '#eef1ff',
    subtitle: '#9aa3c7',
  },
};

const hexToRgb = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const mix = (a: string, b: string, t: number) => {
  const A = hexToRgb(a);
  const B = hexToRgb(b);
  return `#${A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join('')}`;
};

// ── Geometry ────────────────────────────────────────────────────────────────

const rect = (hw: number, hd: number): P2[] => [
  [hw, -hd],
  [hw, hd],
  [-hw, hd],
  [-hw, -hd],
];

const roundedRect = (hw: number, hd: number, r: number, seg = 5): P2[] => {
  const out: P2[] = [];
  const corners: [number, number, number][] = [
    [hw - r, -(hd - r), -Math.PI / 2],
    [hw - r, hd - r, 0],
    [-(hw - r), hd - r, Math.PI / 2],
    [-(hw - r), -(hd - r), Math.PI],
  ];
  for (const [cx, cy, a0] of corners) {
    for (let i = 0; i <= seg; i++) {
      const a = a0 + (i / seg) * (Math.PI / 2);
      out.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
    }
  }
  return out;
};

const ngon = (r: number, n: number, rot = 0): P2[] =>
  Array.from({ length: n }, (_, i) => {
    const a = rot + (i / n) * Math.PI * 2;
    return [Math.cos(a) * r, Math.sin(a) * r] as P2;
  });

function hull(points: P2[]): P2[] {
  const p = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  if (p.length < 3) return p;
  const cross = (o: P2, a: P2, b: P2) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lower: P2[] = [];
  for (const q of p) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], q) <= 0) lower.pop();
    lower.push(q);
  }
  const upper: P2[] = [];
  for (let i = p.length - 1; i >= 0; i--) {
    const q = p[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], q) <= 0) upper.pop();
    upper.push(q);
  }
  return lower.slice(0, -1).concat(upper.slice(0, -1));
}

/**
 * An extruded footprint (any convex polygon) drawn kit-style: shaded side
 * faces, light top, and a crisp dark outline around the silhouette.
 */
const Prism: React.FC<{
  fp: P2[];
  cx: number;
  cy: number;
  z0: number;
  h: number;
  body: Body;
  smooth?: boolean;
  stroke?: number;
}> = ({ fp, cx, cy, z0, h, body, smooth, stroke = 1.6 }) => {
  const n = fp.length;
  const bot = fp.map(([x, y]) => proj(cx + x, cy + y, z0));
  const top = fp.map(([x, y]) => proj(cx + x, cy + y, z0 + h));
  const faces: { poly: P2[]; color: string }[] = [];
  const visible: boolean[] = [];
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const ex = fp[j][0] - fp[i][0];
    const ey = fp[j][1] - fp[i][1];
    const len = Math.hypot(ex, ey) || 1;
    const nx = ey / len;
    const ny = -ex / len;
    const vis = nx + ny > 1e-6;
    visible.push(vis);
    if (vis) {
      const t = Math.max(0, Math.min(1, (nx - ny + 1) / 2));
      faces.push({ poly: [bot[i], bot[j], top[j], top[i]], color: mix(body.left, body.right, t) });
    }
  }
  const silhouette = hull([...bot, ...top]);
  const ridges: [P2, P2][] = [];
  if (!smooth) {
    for (let j = 0; j < n; j++) if (visible[(j - 1 + n) % n] && visible[j]) ridges.push([bot[j], top[j]]);
  }
  return (
    <g strokeLinejoin="round" strokeLinecap="round">
      {faces.map((f, i) => (
        <polygon key={i} points={pts(f.poly)} fill={f.color} stroke={f.color} strokeWidth={0.8} />
      ))}
      <polygon points={pts(top)} fill={body.top} stroke={body.line} strokeWidth={stroke * 0.8} />
      {ridges.map(([a, b], i) => (
        <line key={i} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={body.line} strokeWidth={stroke * 0.8} />
      ))}
      <polygon points={pts(silhouette)} fill="none" stroke={body.line} strokeWidth={stroke} />
    </g>
  );
};

/** Transform that maps local px onto the horizontal plane at (gx, gy, gz). */
const floorMatrix = (gx: number, gy: number, gz: number) => {
  const [X, Y] = proj(gx, gy, gz);
  return `matrix(${C},${S},${-C},${S},${X.toFixed(1)},${Y.toFixed(1)})`;
};
/** Transform onto the vertical face whose normal points to +gy (the lit left face). */
const leftFaceMatrix = (gx: number, gy: number, gz: number) => {
  const [X, Y] = proj(gx, gy, gz);
  return `matrix(${C},${S},0,1,${X.toFixed(1)},${Y.toFixed(1)})`;
};

type IconCmp = React.FC<{ x?: number; y?: number; width?: number; height?: number; color?: string; strokeWidth?: number }>;

const TopIcon: React.FC<{ icon: IconCmp; gx: number; gy: number; gz: number; color: string; size?: number }> = ({ icon: Icon, gx, gy, gz, color, size = 30 }) => (
  <g transform={floorMatrix(gx, gy, gz)}>
    <Icon x={-size / 2} y={-size / 2} width={size} height={size} color={color} strokeWidth={2.2} />
  </g>
);

/** Horizontal rings visible on the front half of a cylinder */
const CylinderBand: React.FC<{ cx: number; cy: number; z: number; r: number; color: string }> = ({ cx, cy, z, r, color }) => {
  const arc: P2[] = [];
  for (let i = 0; i <= 32; i++) {
    const a = -Math.PI / 4 + (i / 32) * Math.PI;
    arc.push(proj(cx + Math.cos(a) * r, cy + Math.sin(a) * r, z));
  }
  return <polyline points={pts(arc)} fill="none" stroke={color} strokeWidth={1.3} strokeLinecap="round" />;
};

// ── Shapes per building block ───────────────────────────────────────────────

const ICONS: Partial<Record<NodeKind, IconCmp>> = {
  main: Play,
  function: Braces,
  class: Boxes,
  route: Route,
  file: FileCode2,
  database: Database,
  ai: Bot,
  api: Globe,
  storage: HardDrive,
  cache: Zap,
  email: Mail,
  cloud: Cloud,
  library: Package,
};

const BlockShape: React.FC<{ kind: NodeKind; cx: number; cy: number; z0: number; pal: Palette; accent: string }> = ({ kind, cx, cy, z0, pal, accent }) => {
  const B = pal.blue;
  const L = pal.lav;
  const Icon = ICONS[kind] || Package;
  switch (kind) {
    case 'main':
      return (
        <>
          <Prism fp={rect(0.85, 0.85)} cx={cx} cy={cy} z0={z0} h={1.45} body={B} />
          <TopIcon icon={Icon} gx={cx} gy={cy} gz={z0 + 1.45} color="#ffffff" size={32} />
        </>
      );
    case 'function':
      return (
        <>
          <Prism fp={roundedRect(0.85, 0.85, 0.3)} cx={cx} cy={cy} z0={z0} h={1.15} body={B} smooth />
          <TopIcon icon={Icon} gx={cx} gy={cy} gz={z0 + 1.15} color="#ffffff" />
        </>
      );
    case 'class':
      return (
        <>
          <Prism fp={ngon(0.98, 6, Math.PI / 6)} cx={cx} cy={cy} z0={z0} h={1.25} body={B} />
          <TopIcon icon={Icon} gx={cx} gy={cy} gz={z0 + 1.25} color="#ffffff" />
        </>
      );
    case 'route':
      return (
        <>
          <Prism fp={roundedRect(0.92, 0.66, 0.22)} cx={cx} cy={cy} z0={z0} h={0.32} body={L} smooth />
          <Prism fp={roundedRect(0.78, 0.52, 0.18)} cx={cx} cy={cy} z0={z0 + 0.36} h={0.42} body={B} smooth />
          <TopIcon icon={Icon} gx={cx} gy={cy} gz={z0 + 0.78} color="#ffffff" size={26} />
        </>
      );
    case 'file':
      return (
        <>
          <Prism fp={rect(0.66, 0.86)} cx={cx + 0.08} cy={cy - 0.08} z0={z0} h={0.16} body={L} />
          <Prism fp={rect(0.66, 0.86)} cx={cx} cy={cy} z0={z0 + 0.22} h={0.16} body={L} />
          <TopIcon icon={Icon} gx={cx} gy={cy} gz={z0 + 0.38} color={accent} size={28} />
        </>
      );
    case 'server': {
      const unit = (z: number, key: string) => (
        <g key={key}>
          <Prism fp={rect(0.85, 0.85)} cx={cx} cy={cy} z0={z} h={0.68} body={B} />
          <g transform={leftFaceMatrix(cx - 0.85, cy + 0.85, z + 0.68)}>
            <rect x={11} y={11} width={30} height={6} rx={3} fill={pal.slot} opacity={0.9} />
            <rect x={11} y={20} width={20} height={4} rx={2} fill={pal.slot} opacity={0.55} />
            <circle cx={60} cy={15} r={3} fill="#7cf0b4" />
          </g>
        </g>
      );
      const topZ = z0 + 1.44;
      return (
        <>
          {unit(z0, 'a')}
          {unit(z0 + 0.76, 'b')}
          {[
            [-0.55, -0.55],
            [0.55, -0.55],
            [-0.55, 0.55],
            [0.55, 0.55],
          ].map(([dx, dy], i) => {
            const [x, y] = proj(cx + dx, cy + dy, topZ);
            return <ellipse key={i} cx={x} cy={y} rx={3.4} ry={2} fill={pal.slot} opacity={0.9} />;
          })}
        </>
      );
    }
    case 'ui': {
      const screen = rect(0.86, 0.58).map(([x, y]) => proj(cx + x, cy + y, z0 + 0.24));
      return (
        <>
          <Prism fp={roundedRect(1.0, 0.74, 0.12)} cx={cx} cy={cy} z0={z0} h={0.24} body={L} smooth />
          <polygon points={pts(screen)} fill={pal.screen} stroke={L.line} strokeWidth={1.3} strokeLinejoin="round" />
          <Prism fp={roundedRect(0.3, 0.48, 0.08)} cx={cx + 1.55} cy={cy + 0.25} z0={z0} h={0.16} body={L} smooth />
          <polygon
            points={pts(rect(0.22, 0.36).map(([x, y]) => proj(cx + 1.55 + x, cy + 0.25 + y, z0 + 0.16)))}
            fill={pal.screen}
            stroke={L.line}
            strokeWidth={1.1}
            strokeLinejoin="round"
          />
        </>
      );
    }
    case 'database':
      return (
        <>
          <Prism fp={ngon(0.85, 36)} cx={cx} cy={cy} z0={z0} h={1.4} body={L} smooth />
          <CylinderBand cx={cx} cy={cy} z={z0 + 0.47} r={0.85} color={L.line} />
          <CylinderBand cx={cx} cy={cy} z={z0 + 0.94} r={0.85} color={L.line} />
          <TopIcon icon={Icon} gx={cx} gy={cy} gz={z0 + 1.4} color={accent} />
        </>
      );
    case 'cache':
      return (
        <>
          <Prism fp={ngon(0.8, 36)} cx={cx} cy={cy} z0={z0} h={0.62} body={L} smooth />
          <TopIcon icon={Icon} gx={cx} gy={cy} gz={z0 + 0.62} color={accent} />
        </>
      );
    case 'ai': {
      const topZ = z0 + 1.25;
      const ring: P2[] = ngon(0.6, 36).map(([x, y]) => proj(cx + x, cy + y, topZ));
      return (
        <>
          <Prism fp={ngon(0.95, 8, Math.PI / 8)} cx={cx} cy={cy} z0={z0} h={1.25} body={L} />
          <polygon points={pts(ring)} fill="none" stroke={accent} strokeWidth={1.4} strokeDasharray="2 4" strokeLinecap="round" />
          <TopIcon icon={Icon} gx={cx} gy={cy} gz={topZ} color={accent} size={28} />
        </>
      );
    }
    case 'api':
      return (
        <>
          <Prism fp={roundedRect(0.85, 0.85, 0.3)} cx={cx} cy={cy} z0={z0} h={1.2} body={L} smooth />
          <TopIcon icon={Icon} gx={cx} gy={cy} gz={z0 + 1.2} color={accent} />
        </>
      );
    case 'storage':
      return (
        <>
          <Prism fp={ngon(0.92, 6, Math.PI / 6)} cx={cx} cy={cy} z0={z0} h={0.42} body={L} />
          <Prism fp={ngon(0.92, 6, Math.PI / 6)} cx={cx} cy={cy} z0={z0 + 0.48} h={0.42} body={L} />
          <TopIcon icon={Icon} gx={cx} gy={cy} gz={z0 + 0.9} color={accent} />
        </>
      );
    case 'email':
      return (
        <>
          <Prism fp={rect(0.88, 0.64)} cx={cx} cy={cy} z0={z0} h={0.78} body={L} />
          <TopIcon icon={Icon} gx={cx} gy={cy} gz={z0 + 0.78} color={accent} />
        </>
      );
    case 'cloud':
      return (
        <>
          <Prism fp={roundedRect(0.9, 0.9, 0.6)} cx={cx} cy={cy} z0={z0} h={0.95} body={L} smooth />
          <TopIcon icon={Icon} gx={cx} gy={cy} gz={z0 + 0.95} color={accent} />
        </>
      );
    case 'data':
      return (
        <>
          <Prism fp={roundedRect(0.98, 0.98, 0.15)} cx={cx} cy={cy} z0={z0} h={0.22} body={L} smooth />
          {[
            [-0.45, 0.45, 0.7],
            [0, 0, 1.3],
            [0.45, -0.45, 0.95],
          ].map(([dx, dy, h], i) => (
            <Prism key={i} fp={rect(0.2, 0.2)} cx={cx + dx} cy={cy + dy} z0={z0 + 0.22} h={h} body={B} stroke={1.3} />
          ))}
        </>
      );
    case 'library':
    default:
      return (
        <>
          <Prism fp={rect(0.8, 0.8)} cx={cx} cy={cy} z0={z0} h={1.15} body={L} />
          <TopIcon icon={Icon} gx={cx} gy={cy} gz={z0 + 1.15} color={accent} />
        </>
      );
  }
};

// ── Floor labels ────────────────────────────────────────────────────────────

const pillWidth = (text: string, size: number) => text.length * size * 0.6 + 26;

const FloorPill: React.FC<{
  gx: number;
  gy: number;
  gz?: number;
  text: string;
  pal: Palette;
  variant?: 'node' | 'group' | 'active' | 'edge';
  /** Counter-scale so labels stay readable when zoomed out */
  scale?: number;
}> = ({ gx, gy, gz = 0, text, pal, variant = 'node', scale = 1 }) => {
  const size = variant === 'group' ? 12.5 : 11.5;
  const w = pillWidth(text, size);
  const h = variant === 'group' ? 24 : 21;
  const fill = variant === 'active' ? pal.active : pal.pillBg;
  const line = variant === 'active' ? pal.active : pal.pillLine;
  const color = variant === 'active' ? '#ffffff' : pal.pillText;
  return (
    <g transform={`${floorMatrix(gx, gy, gz)} scale(${scale.toFixed(3)})`} style={{ pointerEvents: 'none' }}>
      <rect x={-w / 2 + 1.5} y={-h / 2 + 3} width={w} height={h} rx={h / 2} fill={pal.shadow} opacity={0.5} />
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={h / 2} fill={fill} stroke={line} strokeWidth={variant === 'group' ? 1.6 : 1.2} />
      <text
        x={0}
        y={size * 0.36}
        textAnchor="middle"
        fontSize={size}
        fontWeight={variant === 'group' ? 800 : 700}
        letterSpacing={variant === 'group' ? 0.6 : 0.1}
        fill={color}
        style={{ fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif' }}
      >
        {text}
      </text>
    </g>
  );
};

/** Upright name tag hanging under a block's front corner (always readable). */
const NodeTag: React.FC<{ gx: number; gy: number; gz: number; text: string; kind: string; pal: Palette; active: boolean; dim: boolean; scale: number }> = ({
  gx,
  gy,
  gz,
  text,
  kind,
  pal,
  active,
  dim,
  scale,
}) => {
  const [x, y] = proj(gx + 0.95, gy + 0.95, gz);
  const w = Math.max(text.length * 7.1, kind.length * 5.6) + 22;
  return (
    <g transform={`translate(${x.toFixed(1)},${(y + 12).toFixed(1)}) scale(${scale.toFixed(3)})`} opacity={dim ? 0.3 : 1} style={{ pointerEvents: 'none', transition: 'opacity 200ms' }}>
      <rect x={-w / 2 + 1} y={3} width={w} height={34} rx={9} fill={pal.shadow} opacity={0.45} />
      <rect x={-w / 2} y={0} width={w} height={34} rx={9} fill={active ? pal.active : pal.pillBg} stroke={active ? pal.active : pal.pillLine} strokeWidth={1.3} />
      <text x={0} y={14.5} textAnchor="middle" fontSize={12.5} fontWeight={700} fill={active ? '#ffffff' : pal.pillText} style={{ fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif' }}>
        {text}
      </text>
      <text x={0} y={27} textAnchor="middle" fontSize={9} fontWeight={600} letterSpacing={0.8} fill={active ? 'rgba(255,255,255,0.8)' : pal.subtitle} style={{ fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif' }}>
        {kind.toUpperCase()}
      </text>
    </g>
  );
};

// ── Layout ──────────────────────────────────────────────────────────────────

type GroupId = 'entry' | 'code' | 'services';
const GROUP_OF = (k: NodeKind): GroupId =>
  k === 'main' || k === 'server' || k === 'ui' ? 'entry' : k === 'function' || k === 'class' || k === 'route' || k === 'file' ? 'code' : 'services';
const GROUP_LABEL: Record<GroupId, string> = { entry: 'ENTRY & INTERFACE', code: 'YOUR CODE', services: 'SERVICES & LIBRARIES' };

interface IsoNode extends ArchNode {
  gx: number;
  gy: number;
  group: GroupId;
}
interface IsoGroup {
  id: GroupId;
  x0: number;
  x1: number;
  y0: number;
  y1: number;
}

function layoutIso(map: ArchitectureMap) {
  const order: GroupId[] = ['entry', 'code', 'services'];
  const sorted = [...map.nodes].sort((a, b) => (a.lines[0] ?? 0) - (b.lines[0] ?? 0) || a.label.localeCompare(b.label));
  const nodes: IsoNode[] = [];
  const groups: IsoGroup[] = [];
  let cursor = 0;
  for (const gid of order) {
    const members = sorted.filter((n) => GROUP_OF(n.kind) === gid);
    if (members.length === 0) continue;
    const rowsPer = members.length <= 4 ? members.length : Math.max(4, Math.ceil(Math.sqrt(members.length * 1.4)));
    const cols = Math.ceil(members.length / rowsPer);
    members.forEach((n, i) => {
      const ci = Math.floor(i / rowsPer);
      const ri = i % rowsPer;
      nodes.push({ ...n, group: gid, gx: cursor + ci * COL_STEP, gy: (ri - (rowsPer - 1) / 2) * ROW_STEP });
    });
    const half = ((rowsPer - 1) / 2) * ROW_STEP;
    groups.push({ id: gid, x0: cursor - 2.1, x1: cursor + (cols - 1) * COL_STEP + 2.1, y0: -half - 1.7, y1: half + 2.3 });
    cursor += (cols - 1) * COL_STEP + COL_STEP + GROUP_GAP;
  }
  return { nodes, groups };
}

/** Grid-aligned route between two blocks, in world units, at slab height. */
function routeEdge(a: IsoNode, b: IsoNode, lane: number): P2[] {
  const rA = 1.0;
  const rB = 1.12;
  if (Math.abs(a.gx - b.gx) < 0.01) {
    const lx = a.gx + COL_STEP / 2 + lane;
    return [
      [a.gx + rA, a.gy],
      [lx, a.gy],
      [lx, b.gy],
      [b.gx + rB, b.gy],
    ];
  }
  const dir = Math.sign(b.gx - a.gx);
  if (Math.abs(a.gy - b.gy) < 0.01) {
    return [
      [a.gx + dir * rA, a.gy],
      [b.gx - dir * rB, b.gy],
    ];
  }
  const lx = b.gx - dir * (COL_STEP / 2) + lane;
  return [
    [a.gx + dir * rA, a.gy],
    [lx, a.gy],
    [lx, b.gy],
    [b.gx - dir * rB, b.gy],
  ];
}

function roundedPath(list: P2[], r = 14): string {
  if (list.length < 2) return '';
  let d = `M ${fmt(list[0])}`;
  for (let i = 1; i < list.length - 1; i++) {
    const [px, py] = list[i - 1];
    const [cx, cy] = list[i];
    const [nx, ny] = list[i + 1];
    const l1 = Math.hypot(px - cx, py - cy) || 1;
    const l2 = Math.hypot(nx - cx, ny - cy) || 1;
    const rr = Math.min(r, l1 / 2, l2 / 2);
    const a: P2 = [cx + ((px - cx) / l1) * rr, cy + ((py - cy) / l1) * rr];
    const b: P2 = [cx + ((nx - cx) / l2) * rr, cy + ((ny - cy) / l2) * rr];
    d += ` L ${fmt(a)} Q ${fmt([cx, cy])} ${fmt(b)}`;
  }
  d += ` L ${fmt(list[list.length - 1])}`;
  return d;
}

// ── Main component ─────────────────────────────────────────────────────────

interface IsometricDiagramWorldProps {
  map: ArchitectureMap;
  activeFile: string;
  /** Line currently executing in step mode (in the active file), if any */
  activeLine: number | null;
  onJumpToLine: (line: number) => void;
}

interface View {
  k: number;
  tx: number;
  ty: number;
}

export const IsometricDiagramWorld: React.FC<IsometricDiagramWorldProps> = ({ map, activeFile, activeLine, onJumpToLine }) => {
  const theme = useTheme3D();
  const light = theme.name === 'light';
  const pal = PALETTES[light ? 'light' : 'dark'];
  const accentOf = (k: NodeKind) => (light ? theme.accentText(KIND_STYLE[k].color) : KIND_STYLE[k].color);

  const { nodes, groups } = useMemo(() => layoutIso(map), [map]);
  const byId = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);
  const detailsById = useMemo(
    () => new Map<string, PositionedNode>(nodes.map((n) => [n.id, { ...n, x: n.gx, y: n.gy, column: 0 }])),
    [nodes],
  );

  const [selected, setSelected] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [focusKind, setFocusKind] = useState<NodeKind | null>(null);
  /** Connectors animate (glow + moving pulses) unless the user pauses them */
  const [flowOn, setFlowOn] = useState(true);
  useEffect(() => {
    if (selected && !byId.has(selected)) setSelected(null);
    if (focusKind && !nodes.some((n) => n.kind === focusKind)) setFocusKind(null);
  }, [byId, nodes, selected, focusKind]);

  // Live step highlighting
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
    if (activeLine !== null && s.size === 0) {
      nodes.forEach((n) => n.file === activeFile && n.lines.includes(activeLine) && s.add(n.id));
    }
    return s;
  }, [activeEdges, map.edges, nodes, activeFile, activeLine]);

  const focus = hovered || selected;
  const neighbours = useMemo(() => {
    const s = new Set<string>();
    if (!focus) return s;
    s.add(focus);
    map.edges.forEach((e) => {
      if (e.from === focus) s.add(e.to);
      if (e.to === focus) s.add(e.from);
    });
    return s;
  }, [focus, map.edges]);
  const isDim = (n: IsoNode) => (focusKind ? n.kind !== focusKind : !!focus && !neighbours.has(n.id));

  // Edge geometry
  const edges = useMemo(() => {
    const laneCount = new Map<string, number>();
    return map.edges
      .map((e) => {
        const a = byId.get(e.from);
        const b = byId.get(e.to);
        if (!a || !b) return null;
        const laneKey = `${Math.abs(a.gx - b.gx) < 0.01 ? a.gx : b.gx}:${Math.sign(b.gx - a.gx)}`;
        const idx = laneCount.get(laneKey) ?? 0;
        laneCount.set(laneKey, idx + 1);
        const lane = ((idx % 5) - 2) * 0.22;
        const world = routeEdge(a, b, lane);
        const screen = world.map(([x, y]) => proj(x, y, SLAB + 0.02));
        // Pull the line back so it ends under the arrowhead
        const tip = screen[screen.length - 1];
        const prev = screen[screen.length - 2];
        const len = Math.hypot(tip[0] - prev[0], tip[1] - prev[1]) || 1;
        const dir: P2 = [(tip[0] - prev[0]) / len, (tip[1] - prev[1]) / len];
        const service = SERVICE_KINDS.includes(b.kind) && b.kind !== 'server';
        const arrowLen = service ? 9 : 13;
        const body = [...screen.slice(0, -1), [tip[0] - dir[0] * arrowLen * 0.7, tip[1] - dir[1] * arrowLen * 0.7] as P2];
        const mid = world.length >= 4 ? [(world[1][0] + world[2][0]) / 2, (world[1][1] + world[2][1]) / 2] : [(world[0][0] + world[1][0]) / 2, (world[0][1] + world[1][1]) / 2];
        return {
          edge: e,
          key: `${e.from}->${e.to}`,
          service,
          d: roundedPath(body),
          full: roundedPath(screen),
          tip,
          dir,
          arrowLen,
          mid: mid as P2,
          depth: Math.min(a.gx + a.gy, b.gx + b.gy),
        };
      })
      .filter(Boolean) as {
      edge: (typeof map.edges)[number];
      key: string;
      service: boolean;
      d: string;
      full: string;
      tip: P2;
      dir: P2;
      arrowLen: number;
      mid: P2;
      depth: number;
    }[];
  }, [map.edges, byId]);

  // Scene bounds (screen px)
  const bounds = useMemo(() => {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    const add = ([x, y]: P2) => {
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
    };
    groups.forEach((g) => {
      [
        [g.x0, g.y0],
        [g.x1, g.y0],
        [g.x0, g.y1],
        [g.x1, g.y1],
      ].forEach(([x, y]) => {
        add(proj(x, y, 0));
        add(proj(x, y, g.id === 'code' ? 2.6 : 1.8));
      });
      add(proj(g.x0 + 2.5, g.y1 + 1.6, 0));
    });
    if (!isFinite(minX)) return { x: -200, y: -150, w: 400, h: 300 };
    return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
  }, [groups]);

  // Pan & zoom
  const wrapRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [view, setView] = useState<View>({ k: 1, tx: 0, ty: 0 });
  const userMoved = useRef(false);
  const dragMoved = useRef(false);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setSize({ w: entry.contentRect.width, h: entry.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const fit = useCallback(() => {
    if (!size.w || !size.h) return;
    const trayH = 96;
    const availH = Math.max(120, size.h - trayH - 70);
    const k = Math.max(0.2, Math.min(1.35, (size.w - 60) / bounds.w, availH / bounds.h));
    setView({ k, tx: size.w / 2 - k * (bounds.x + bounds.w / 2), ty: 64 + availH / 2 - k * (bounds.y + bounds.h / 2) });
  }, [size, bounds]);

  useEffect(() => {
    if (!userMoved.current) fit();
  }, [fit]);
  // A different program shape → reframe
  const shapeKey = `${groups.map((g) => `${g.id}${g.x1.toFixed(0)}${g.y1.toFixed(0)}`).join('|')}`;
  useEffect(() => {
    userMoved.current = false;
    fit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shapeKey]);

  const zoomAt = useCallback((factor: number, px: number, py: number) => {
    userMoved.current = true;
    setView((v) => {
      const k = Math.max(0.2, Math.min(3, v.k * factor));
      const r = k / v.k;
      return { k, tx: px - (px - v.tx) * r, ty: py - (py - v.ty) * r };
    });
  }, []);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if ((e.target as HTMLElement).closest('[data-no-orbit]')) return;
      e.preventDefault();
      const r = el.getBoundingClientRect();
      zoomAt(Math.exp(-e.deltaY * 0.0015), e.clientX - r.left, e.clientY - r.top);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [zoomAt]);

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    const start = { x: e.clientX, y: e.clientY, tx: view.tx, ty: view.ty };
    dragMoved.current = false;
    const move = (ev: PointerEvent) => {
      const dx = ev.clientX - start.x;
      const dy = ev.clientY - start.y;
      if (!dragMoved.current && Math.hypot(dx, dy) < 4) return;
      dragMoved.current = true;
      userMoved.current = true;
      setView((v) => ({ ...v, tx: start.tx + dx, ty: start.ty + dy }));
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  // Floor grid lines covering the scene
  const grid = useMemo(() => {
    if (groups.length === 0) return '';
    const gx0 = Math.floor(Math.min(...groups.map((g) => g.x0))) - 14;
    const gx1 = Math.ceil(Math.max(...groups.map((g) => g.x1))) + 14;
    const gy0 = Math.floor(Math.min(...groups.map((g) => g.y0))) - 14;
    const gy1 = Math.ceil(Math.max(...groups.map((g) => g.y1))) + 14;
    let d = '';
    for (let x = gx0; x <= gx1; x += 0.5) d += `M ${fmt(proj(x, gy0))} L ${fmt(proj(x, gy1))} `;
    for (let y = gy0; y <= gy1; y += 0.5) d += `M ${fmt(proj(gx0, y))} L ${fmt(proj(gx1, y))} `;
    return d;
  }, [groups]);

  const kindsPresent = useMemo(() => {
    const counts = new Map<NodeKind, number>();
    nodes.forEach((n) => counts.set(n.kind, (counts.get(n.kind) ?? 0) + 1));
    return Array.from(counts.entries());
  }, [nodes]);

  if (map.nodes.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-center" style={{ background: pal.bg }}>
        <div className="max-w-sm">
          <p className="text-sm font-semibold" style={{ color: pal.title }}>
            Nothing to map yet
          </p>
          <p className="text-xs mt-1" style={{ color: pal.subtitle }}>
            Write functions, classes, or use libraries like a database, an AI model or a web API. They will appear here as an architecture diagram.
          </p>
        </div>
      </div>
    );
  }

  const orderedNodes = [...nodes].sort((a, b) => a.gx + a.gy - (b.gx + b.gy));
  const selectedNode = selected ? detailsById.get(selected) : null;
  const codeGroup = groups.find((g) => g.id === 'code');
  const WALL = 2.5;
  const ls = Math.max(1, Math.min(1.6, 1 / view.k));

  const handleNodeClick = (id: string) => {
    if (dragMoved.current) return;
    setSelected((s) => (s === id ? null : id));
  };

  return (
    <div
      ref={wrapRef}
      className="flex-1 relative min-h-0 overflow-hidden select-none"
      style={{ background: pal.bg, cursor: 'grab' }}
      aria-label="Isometric architecture diagram of the program"
    >
      <style>{`
        @keyframes isoFlow { to { stroke-dashoffset: -28; } }
        @keyframes isoPulse { 0%,100% { opacity: .35 } 50% { opacity: .75 } }
        @keyframes isoFlowLong { to { stroke-dashoffset: -40; } }
        @keyframes isoDots { to { stroke-dashoffset: -13.2; } }
        .iso-flow { animation: isoFlow .7s linear infinite; }
        .iso-flow-long { animation: isoFlowLong 1.3s linear infinite; }
        .iso-dots { animation: isoDots .8s linear infinite; }
        .iso-pulse { animation: isoPulse 1.4s ease-in-out infinite; }
      `}</style>

      <svg width="100%" height="100%" onPointerDown={onPointerDown} onClick={() => !dragMoved.current && setSelected(null)} style={{ display: 'block' }}>
        <defs>
          <filter id="iso-blur" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="5" />
          </filter>
          <filter id="iso-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3.2" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="iso-blur-lg" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="14" />
          </filter>
          <radialGradient id="iso-vignette" cx="50%" cy="45%" r="75%">
            <stop offset="60%" stopColor={pal.bg} stopOpacity={0} />
            <stop offset="100%" stopColor={pal.bg} stopOpacity={0.9} />
          </radialGradient>
        </defs>

        <g transform={`translate(${view.tx.toFixed(1)},${view.ty.toFixed(1)}) scale(${view.k.toFixed(4)})`}>
          <path d={grid} stroke={pal.grid} strokeWidth={1 / view.k} fill="none" />

          {/* Platforms */}
          {groups.map((g) => {
            const cx = (g.x0 + g.x1) / 2;
            const cy = (g.y0 + g.y1) / 2;
            const hw = (g.x1 - g.x0) / 2;
            const hd = (g.y1 - g.y0) / 2;
            const shadow = rect(hw, hd).map(([x, y]) => proj(cx + x + 0.5, cy + y + 0.5, 0));
            return (
              <g key={g.id}>
                <polygon points={pts(shadow)} fill={pal.slabShadow} filter="url(#iso-blur-lg)" />
                <Prism fp={rect(hw, hd)} cx={cx} cy={cy} z0={0} h={SLAB} body={pal.slab} stroke={1.1} />
              </g>
            );
          })}

          {/* Glass enclosure behind "your code" (back walls) */}
          {codeGroup && (
            <g pointerEvents="none">
              <polygon
                points={pts([proj(codeGroup.x0, codeGroup.y0, SLAB), proj(codeGroup.x1, codeGroup.y0, SLAB), proj(codeGroup.x1, codeGroup.y0, WALL), proj(codeGroup.x0, codeGroup.y0, WALL)])}
                fill={pal.glassFill}
                stroke={pal.glassLine}
                strokeWidth={1.2}
              />
              <polygon
                points={pts([proj(codeGroup.x0, codeGroup.y0, SLAB), proj(codeGroup.x0, codeGroup.y1, SLAB), proj(codeGroup.x0, codeGroup.y1, WALL), proj(codeGroup.x0, codeGroup.y0, WALL)])}
                fill={pal.glassFill}
                stroke={pal.glassLine}
                strokeWidth={1.2}
              />
              <line
                x1={proj(codeGroup.x0, codeGroup.y0, SLAB)[0]}
                y1={proj(codeGroup.x0, codeGroup.y0, SLAB)[1]}
                x2={proj(codeGroup.x0, codeGroup.y0, WALL)[0]}
                y2={proj(codeGroup.x0, codeGroup.y0, WALL)[1]}
                stroke={pal.glassLine}
                strokeWidth={1.2}
                strokeDasharray="4 4"
              />
            </g>
          )}

          {/* Group name plates on the floor */}
          {groups.map((g) => (
            <FloorPill key={`gl-${g.id}`} gx={g.x0 + pillWidth(GROUP_LABEL[g.id], 12.5) / U / 2 + 0.2} gy={g.y1 + 0.95} text={GROUP_LABEL[g.id]} pal={pal} variant="group" scale={ls} />
          ))}

          {/* Connectors: always flowing from caller to callee so you can see how the program runs */}
          {edges
            .slice()
            .sort((a, b) => a.depth - b.depth)
            .map((e, idx) => {
              const active = activeEdges.has(e.key);
              const related = !!focus && (e.edge.from === focus || e.edge.to === focus);
              const kindHit = focusKind ? byId.get(e.edge.from)?.kind === focusKind || byId.get(e.edge.to)?.kind === focusKind : true;
              const dim = (focus && !related && !active) || (!kindHit && !active);
              const target = byId.get(e.edge.to);
              // Glow colour: blue for calls inside your code, the service's own colour for outside services
              const glow = active ? pal.active : e.service && target ? accentOf(target.kind) : pal.active;
              const base = active ? pal.active : e.service ? pal.dotted : related ? pal.bandHot : pal.band;
              const [tx, ty] = e.tip;
              const [dx, dy] = e.dir;
              const bx = tx - dx * e.arrowLen;
              const by = ty - dy * e.arrowLen;
              const wing = e.service ? 6 : 9;
              const p1: P2 = [bx - dy * wing, by + dx * wing];
              const p2: P2 = [bx + dy * wing, by - dx * wing];
              const strong = active || related;
              const dur = active ? 1.1 : 2.6;
              const begin = `${-((idx * 0.61) % dur).toFixed(2)}s`;
              return (
                <g key={e.key} opacity={dim ? 0.14 : 1} style={{ transition: 'opacity 200ms' }}>
                  {/* Track */}
                  {e.service && !active ? (
                    <path d={e.d} fill="none" stroke={base} strokeWidth={2.4} strokeDasharray="0.1 6.5" strokeLinecap="round" strokeLinejoin="round" className={flowOn ? 'iso-dots' : undefined} />
                  ) : (
                    <path d={e.d} fill="none" stroke={base} strokeWidth={active ? 5 : related ? 8 : 7} strokeLinecap="round" strokeLinejoin="round" />
                  )}
                  {/* Soft glow along the whole line */}
                  <path
                    d={e.d}
                    fill="none"
                    stroke={glow}
                    strokeOpacity={active ? 0.32 : strong ? 0.26 : 0.14}
                    strokeWidth={active ? 14 : e.service ? 7 : 10}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    filter="url(#iso-blur)"
                  />
                  {/* Moving light dashes (direction = caller -> callee) */}
                  <path
                    d={e.d}
                    fill="none"
                    stroke={active ? '#ffffff' : glow}
                    strokeOpacity={active ? 1 : strong ? 0.95 : 0.75}
                    strokeWidth={active ? 2.2 : 2}
                    strokeDasharray={active ? '8 20' : '14 26'}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    filter={active ? undefined : 'url(#iso-glow)'}
                    className={flowOn || active ? (active ? 'iso-flow' : 'iso-flow-long') : undefined}
                  />
                  {/* Arrowhead */}
                  {e.service && !active ? (
                    <polyline points={pts([p1, e.tip, p2])} fill="none" stroke={glow} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" filter="url(#iso-glow)" />
                  ) : (
                    <polygon points={pts([e.tip, p1, p2])} fill={active ? pal.active : base} stroke={active ? pal.active : base} strokeWidth={1.5} strokeLinejoin="round" />
                  )}
                  {/* Travelling pulse */}
                  {(flowOn || active) && (
                    <circle r={active ? 5.5 : 4} fill={active ? '#ffffff' : glow} stroke={active ? pal.active : '#ffffff'} strokeWidth={active ? 2.5 : 1.5} filter="url(#iso-glow)">
                      <animateMotion dur={`${dur}s`} begin={begin} repeatCount="indefinite" path={e.full} />
                    </circle>
                  )}
                </g>
              );
            })}

          {/* Blocks, painted back to front */}
          {orderedNodes.map((n) => {
            const active = activeNodes.has(n.id);
            const sel = selected === n.id;
            const dim = isDim(n) && !active;
            const z0 = SLAB;
            const glow = ngon(1.35, 36).map(([x, y]) => proj(n.gx + x, n.gy + y, z0 + 0.01));
            const shadow = ngon(1.05, 24).map(([x, y]) => proj(n.gx + x + 0.35, n.gy + y + 0.35, z0));
            const outline = roundedRect(1.38, 1.38, 0.4).map(([x, y]) => proj(n.gx + x, n.gy + y, z0 + 0.01));
            return (
              <g
                key={n.id}
                opacity={dim ? 0.28 : 1}
                style={{ transition: 'opacity 200ms', cursor: 'pointer' }}
                onPointerEnter={() => setHovered(n.id)}
                onPointerLeave={() => setHovered((h) => (h === n.id ? null : h))}
                onClick={(ev) => {
                  ev.stopPropagation();
                  handleNodeClick(n.id);
                }}
              >
                <title>{`${KIND_STYLE[n.kind].label}: ${n.label}`}</title>
                {active && <polygon points={pts(glow)} fill={pal.active} className="iso-pulse" filter="url(#iso-blur)" />}
                {(sel || hovered === n.id) && (
                  <polygon
                    points={pts(outline)}
                    fill={sel ? (light ? 'rgba(47,107,255,0.06)' : 'rgba(79,134,255,0.10)') : 'none'}
                    stroke={sel ? pal.select : pal.glassLine}
                    strokeWidth={1.6}
                    strokeDasharray="6 5"
                    strokeLinejoin="round"
                  />
                )}
                <polygon points={pts(shadow)} fill={pal.shadow} filter="url(#iso-blur)" />
                <g style={{ transform: active ? `translateY(${-0.35 * U}px)` : 'translateY(0px)', transition: 'transform 320ms cubic-bezier(.2,.8,.2,1)' }}>
                  <BlockShape kind={n.kind} cx={n.gx} cy={n.gy} z0={z0} pal={pal} accent={accentOf(n.kind)} />
                </g>
              </g>
            );
          })}

          {/* Glass enclosure front rim */}
          {codeGroup && (
            <g pointerEvents="none" stroke={pal.glassLine} strokeWidth={1.1} fill="none" strokeDasharray="5 5">
              <polyline points={pts([proj(codeGroup.x0, codeGroup.y1, WALL), proj(codeGroup.x1, codeGroup.y1, WALL), proj(codeGroup.x1, codeGroup.y0, WALL)])} />
              <line x1={proj(codeGroup.x1, codeGroup.y1, SLAB)[0]} y1={proj(codeGroup.x1, codeGroup.y1, SLAB)[1]} x2={proj(codeGroup.x1, codeGroup.y1, WALL)[0]} y2={proj(codeGroup.x1, codeGroup.y1, WALL)[1]} />
              <line x1={proj(codeGroup.x1, codeGroup.y0, SLAB)[0]} y1={proj(codeGroup.x1, codeGroup.y0, SLAB)[1]} x2={proj(codeGroup.x1, codeGroup.y0, WALL)[0]} y2={proj(codeGroup.x1, codeGroup.y0, WALL)[1]} />
              <line x1={proj(codeGroup.x0, codeGroup.y1, SLAB)[0]} y1={proj(codeGroup.x0, codeGroup.y1, SLAB)[1]} x2={proj(codeGroup.x0, codeGroup.y1, WALL)[0]} y2={proj(codeGroup.x0, codeGroup.y1, WALL)[1]} />
            </g>
          )}

          {/* Connector labels (shown for the live step or the focused block) */}
          {edges.map((e) => {
            const active = activeEdges.has(e.key);
            const related = !!focus && (e.edge.from === focus || e.edge.to === focus);
            if (!active && !related) return null;
            return <FloorPill key={`el-${e.key}`} gx={e.mid[0]} gy={e.mid[1]} gz={SLAB + 0.05} text={e.edge.label} pal={pal} variant={active ? 'active' : 'edge'} scale={ls} />;
          })}

          {/* Block name tags, drawn last so nothing hides them */}
          {orderedNodes.map((n) => {
            const active = activeNodes.has(n.id);
            return (
              <NodeTag
                key={`tag-${n.id}`}
                gx={n.gx}
                gy={n.gy}
                gz={SLAB}
                text={n.label.length > 24 ? `${n.label.slice(0, 23)}…` : n.label}
                kind={KIND_STYLE[n.kind].label}
                pal={pal}
                active={active}
                dim={isDim(n) && !active}
                scale={ls}
              />
            );
          })}
        </g>

        <rect width="100%" height="100%" fill="url(#iso-vignette)" pointerEvents="none" />
      </svg>

      {/* Title */}
      <div className="absolute top-3 left-4 pointer-events-none">
        <div className="text-[15px] font-extrabold tracking-tight" style={{ color: pal.title }}>
          Architecture diagram
        </div>
        <div className="text-[11px]" style={{ color: pal.subtitle }}>
          Drag to pan · scroll to zoom · click a block for details
        </div>
      </div>

      {/* Zoom controls */}
      <div
        data-no-orbit
        className="absolute top-3 right-3 z-20 flex flex-col rounded-xl border overflow-hidden shadow-sm cursor-default"
        style={{ background: pal.trayBg, borderColor: pal.trayLine, display: selectedNode ? 'none' : undefined }}
      >
        {[
          { icon: ZoomIn, label: 'Zoom in', on: () => zoomAt(1.2, size.w / 2, size.h / 2) },
          { icon: ZoomOut, label: 'Zoom out', on: () => zoomAt(1 / 1.2, size.w / 2, size.h / 2) },
          {
            icon: flowOn ? Pause : Play,
            label: flowOn ? 'Pause flow animation' : 'Play flow animation',
            on: () => setFlowOn((f) => !f),
          },
          {
            icon: Maximize2,
            label: 'Fit to screen',
            on: () => {
              userMoved.current = false;
              fit();
            },
          },
        ].map(({ icon: I, label, on }) => (
          <button key={label} onClick={on} title={label} aria-label={label} className={`w-8 h-8 flex items-center justify-center ${theme.button}`}>
            <I className="w-4 h-4" />
          </button>
        ))}
      </div>

      {/* Component tray (legend + filter) */}
      <div
        data-no-orbit
        className="absolute bottom-3 left-3 right-3 z-20 rounded-2xl border shadow-sm cursor-default overflow-x-auto"
        style={{ background: pal.trayBg, borderColor: pal.trayLine, backdropFilter: 'blur(8px)' }}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-stretch gap-1 px-2 py-1.5 min-w-max">
          {kindsPresent.map(([kind, count]) => {
            const on = focusKind === kind;
            return (
              <button
                key={kind}
                onClick={() => setFocusKind(on ? null : kind)}
                title={on ? 'Show all blocks' : `Highlight: ${KIND_STYLE[kind].label}`}
                className="flex items-center gap-1.5 rounded-xl px-2 py-1 transition-colors"
                style={{ background: on ? (light ? 'rgba(47,107,255,0.10)' : 'rgba(79,134,255,0.18)') : 'transparent', outline: on ? `1.5px solid ${pal.active}` : 'none' }}
              >
                <svg width={46} height={46} viewBox={`${-1.45 * U} ${-2.15 * U} ${2.9 * U} ${3.2 * U}`} aria-hidden="true">
                  <BlockShape kind={kind} cx={0} cy={0} z0={0} pal={pal} accent={accentOf(kind)} />
                </svg>
                <span className="text-left leading-tight">
                  <span className="block text-[11.5px] font-semibold" style={{ color: pal.title }}>
                    {KIND_STYLE[kind].label}
                  </span>
                  <span className="block text-[10.5px]" style={{ color: pal.subtitle }}>
                    {count} {count === 1 ? 'block' : 'blocks'}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {selectedNode && (
        <NodeDetails
          node={selectedNode}
          map={map}
          byId={detailsById}
          activeFile={activeFile}
          onClose={() => setSelected(null)}
          onSelect={setSelected}
          onJumpToLine={onJumpToLine}
        />
      )}
    </div>
  );
};

export default IsometricDiagramWorld;
