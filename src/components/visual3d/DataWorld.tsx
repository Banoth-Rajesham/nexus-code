import React, { useMemo } from 'react';
import { Layers3 } from 'lucide-react';
import { Scene3D, Box3D, Billboard, FloorText, BoxPalette } from './Scene3D';
import type { DataScene, Structure, Cell } from '../../utils/visual3d/dataScene';
import { useTheme3D } from './theme3d';

const PALETTES: Record<'value' | 'changed' | 'pointed' | 'ghost' | 'string' | 'dict' | 'grid' | 'platform', BoxPalette> = {
  value: { top: '#4f8df7', front: '#2f6fe0', side: '#1f4fb0', edge: '#93c5fd55' },
  changed: { top: '#fbbf24', front: '#f59e0b', side: '#b45309', edge: '#fde68a88', glow: '#f59e0b88' },
  pointed: { top: '#34d399', front: '#10b981', side: '#047857', edge: '#a7f3d088', glow: '#10b98166' },
  ghost: { top: '#94a3b8', front: '#64748b', side: '#475569', edge: '#cbd5e199' },
  string: { top: '#c4b5fd', front: '#8b5cf6', side: '#6d28d9', edge: '#ddd6fe66' },
  dict: { top: '#67e8f9', front: '#06b6d4', side: '#0e7490', edge: '#a5f3fc66' },
  grid: { top: '#60a5fa', front: '#3b82f6', side: '#1d4ed8', edge: '#bfdbfe55' },
  platform: { top: '#1e293b', front: '#16203a', side: '#0f172a', edge: '#33415588' },
};

const POINTER_COLORS = ['#22d3ee', '#f472b6', '#a3e635', '#fb923c', '#c084fc', '#facc15'];
export const pointerColor = (name: string) => POINTER_COLORS[Array.from(name).reduce((h, c) => h + c.charCodeAt(0), 0) % POINTER_COLORS.length];

const clipText = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

interface Laid {
  structure: Structure;
  y: number; // row centre on the floor
  height: number; // floor depth used by this row
  width: number;
}

const MARGIN = 56;
const DATA_CAMERA = { tilt: 50, turn: -16 };

function measure(s: Structure): { width: number; height: number; size: number } {
  if (s.kind === 'array' || s.kind === 'string') {
    const n = Math.max(1, s.cells.length);
    const size = Math.max(30, Math.min(62, Math.floor(860 / n) - 8));
    return { width: n * (size + 8) + 40, height: size + 110, size };
  }
  if (s.kind === 'grid') {
    const cols = Math.max(1, ...s.rows.map((r) => r.length));
    const size = Math.max(26, Math.min(44, Math.floor(520 / cols) - 6));
    return { width: cols * (size + 6) + 40, height: s.rows.length * (size + 6) + 90, size };
  }
  const n = Math.max(1, s.entries.length);
  return { width: Math.min(n, 6) * 110 + 40, height: Math.ceil(n / 6) * 96 + 70, size: 88 };
}

interface DataWorldProps {
  scene: DataScene;
}

/** The "data in motion" world: one platform per data structure. */
export const DataWorld: React.FC<DataWorldProps> = ({ scene }) => {
  const theme = useTheme3D();
  const layout = useMemo(() => {
    const rows: Laid[] = [];
    let y = MARGIN;
    for (const s of scene.structures.slice(0, 5)) {
      const m = measure(s);
      rows.push({ structure: s, y: y + m.height / 2, height: m.height, width: m.width });
      y += m.height + 36;
    }
    const width = Math.max(560, ...rows.map((r) => r.width + MARGIN * 2));
    return { rows, width, height: Math.max(360, y + MARGIN - 36) };
  }, [scene.structures]);

  return (
    <Scene3D
      width={layout.width}
      height={layout.height}
      bottomInset={0}
      leftInset={scene.scalars.length || scene.objects.length || scene.stack.length ? 240 : 0}
      defaultCamera={DATA_CAMERA}
      ariaLabel="3D view of the program's data at the current step"
      overlay={<VariablesHud scene={scene} />}
    >
      {layout.rows.map((row) => (
        <StructureRow key={`${row.structure.kind}:${row.structure.name}`} row={row} floorWidth={layout.width} />
      ))}
      {layout.rows.length === 0 && (
        <FloorText x={layout.width / 2} y={layout.height / 2 - 10} className={`text-sm ${theme.floorTextMuted}`}>
          No lists, strings or dictionaries at this step yet
        </FloorText>
      )}
    </Scene3D>
  );
};

const StructureRow: React.FC<{ row: Laid; floorWidth: number }> = ({ row, floorWidth }) => {
  const theme = useTheme3D();
  const s = row.structure;
  const m = measure(s);
  const left = (floorWidth - m.width) / 2;
  const title =
    s.kind === 'array'
      ? `${s.name} · ${s.typeName}[${s.cells.length}]`
      : s.kind === 'string'
        ? `${s.name} · str[${s.cells.length}]`
        : s.kind === 'grid'
          ? `${s.name} · ${s.rows.length}×${Math.max(0, ...s.rows.map((r) => r.length))} grid`
          : `${s.name} · dict{${s.entries.length}}`;

  return (
    <>
      {/* platform slab */}
      <Box3D x={left + m.width / 2} y={row.y} w={m.width} d={row.height - 24} h={10} palette={theme.platform} />
      <FloorText x={left + 14} y={row.y - row.height / 2 + 18} align="left" className={`text-[16px] font-semibold ${theme.floorText}`}>
        <span className="font-mono">{title}</span>
        {s.isNew && <span className={`ml-2 text-[10px] font-bold uppercase ${theme.name === 'light' ? 'text-emerald-600' : 'text-emerald-300'}`}>new</span>}
      </FloorText>

      {(s.kind === 'array' || s.kind === 'string') && <SequenceRow s={s} left={left} y={row.y + 10} size={m.size} />}
      {s.kind === 'grid' && <GridRow s={s} left={left} top={row.y - row.height / 2 + 50} size={m.size} />}
      {s.kind === 'dict' && <DictRow s={s} left={left} top={row.y - row.height / 2 + 52} />}
    </>
  );
};

const valueFace = (cell: Cell, size: number, dark = false) => (
  <span
    className={`font-mono font-bold leading-none ${dark ? 'text-slate-900' : 'text-white'}`}
    style={{ fontSize: Math.max(11, Math.min(22, size * 0.42 - Math.max(0, cell.text.length - 3) * 2)), textShadow: dark ? undefined : '0 1px 2px rgba(0,0,0,0.35)' }}
  >
    {clipText(cell.text.replace(/^'(.*)'$/, '$1'), 6)}
  </span>
);

const SequenceRow: React.FC<{ s: Extract<Structure, { kind: 'array' | 'string' }>; left: number; y: number; size: number }> = ({ s, left, y, size }) => {
  const theme = useTheme3D();
  const gap = 8;
  const xOf = (i: number) => left + 20 + i * (size + gap) + size / 2;
  const pointed = new Set(s.pointers.map((p) => p.index));
  const isStr = s.kind === 'string';
  // stack pointers that share an index
  const stackIndex = new Map<string, number>();
  const counts = new Map<number, number>();
  s.pointers.forEach((p) => {
    const c = counts.get(p.index) || 0;
    stackIndex.set(p.name, c);
    counts.set(p.index, c + 1);
  });

  return (
    <>
      {s.cells.map((cell, i) => {
        const palette = cell.changed ? PALETTES.changed : pointed.has(i) ? PALETTES.pointed : isStr ? PALETTES.string : cell.ghost ? theme.ghost : PALETTES.value;
        return (
          <React.Fragment key={i}>
            <Box3D
              x={xOf(i)}
              y={y}
              w={size}
              d={size}
              h={isStr ? size * 0.7 : size}
              z={10 + (cell.changed ? 14 : 0)}
              palette={palette}
              ghost={cell.ghost && !cell.changed && !pointed.has(i)}
              front={valueFace(cell, size, theme.name === 'light' && cell.ghost && !cell.changed && !pointed.has(i))}
              top={valueFace(cell, size * 0.8, theme.name === 'light' && cell.ghost && !cell.changed && !pointed.has(i))}
              className={cell.changed ? 'v3d-pop' : ''}
              title={`${s.name}[${i}] = ${cell.text}`}
            />
            <FloorText x={xOf(i)} y={y + size / 2 + 8} className={`text-[13px] font-mono ${theme.floorTextMuted}`}>
              {i}
            </FloorText>
          </React.Fragment>
        );
      })}
      {s.pointers.map((p) => {
        const color = pointerColor(p.name);
        const textColor = theme.accentText(color);
        const light = theme.name === 'light';
        const lift = 10 + (isStr ? size * 0.7 : size) + 24 + (stackIndex.get(p.name) || 0) * 30;
        const x = p.index >= s.cells.length ? xOf(s.cells.length - 1) + size + gap : xOf(p.index);
        return (
          <Billboard key={p.name} x={x} y={y} z={lift}>
            <div className="flex flex-col items-center">
              <span
                className={`px-2.5 py-1 rounded-lg text-[17px] font-mono font-bold ${p.moved ? 'v3d-bounce' : ''}`}
                style={{
                  color: textColor,
                  background: light ? '#ffffff' : `${color}1f`,
                  border: light ? `2px solid ${textColor}` : `1px solid ${color}88`,
                  boxShadow: light ? '0 6px 14px rgba(15,23,42,0.15)' : `0 0 16px ${color}55`,
                }}
              >
                {p.name}
                {p.index >= s.cells.length && <span className="ml-1 text-[10px] opacity-70">(end)</span>}
              </span>
              <span className="w-[3px] h-7 rounded-full" style={{ background: `linear-gradient(${textColor}, transparent)` }} />
            </div>
          </Billboard>
        );
      })}
    </>
  );
};

const GridRow: React.FC<{ s: Extract<Structure, { kind: 'grid' }>; left: number; top: number; size: number }> = ({ s, left, top, size }) => {
  const theme = useTheme3D();
  return (
  <>
    {s.rows.map((row, r) =>
      row.map((cell, c) => (
        <Box3D
          key={`${r}-${c}`}
          x={left + 20 + c * (size + 6) + size / 2}
          y={top + r * (size + 6) + size / 2}
          w={size}
          d={size}
          h={cell.ghost ? 8 : size * 0.6}
          z={10 + (cell.changed ? 12 : 0)}
          palette={cell.changed ? PALETTES.changed : cell.ghost ? theme.ghost : PALETTES.grid}
          ghost={cell.ghost && !cell.changed}
          top={valueFace(cell, size, theme.name === 'light' && cell.ghost && !cell.changed)}
          className={cell.changed ? 'v3d-pop' : ''}
          title={`${s.name}[${r}][${c}] = ${cell.text}`}
        />
      ))
    )}
  </>
  );
};

const DictRow: React.FC<{ s: Extract<Structure, { kind: 'dict' }>; left: number; top: number }> = ({ s, left, top }) => {
  const theme = useTheme3D();
  return (
  <>
    {s.entries.slice(0, 24).map((e, i) => {
      const x = left + 20 + (i % 6) * 110 + 50;
      const y = top + Math.floor(i / 6) * 96 + 24;
      return (
        <React.Fragment key={e.key}>
          <Box3D
            x={x}
            y={y}
            w={96}
            d={48}
            h={40}
            z={10 + (e.value.changed ? 12 : 0)}
            palette={e.value.changed ? PALETTES.changed : PALETTES.dict}
            front={valueFace(e.value, 40, !e.value.changed)}
            top={<span className="font-mono text-[11px] font-semibold text-slate-900">{clipText(e.key, 12)}</span>}
            className={e.value.changed ? 'v3d-pop' : ''}
            title={`${s.name}[${e.key}] = ${e.value.text}`}
          />
          <FloorText x={x} y={y + 30} className={`text-[10px] font-mono ${theme.floorTextMuted}`}>
            {clipText(e.key, 14)}
          </FloorText>
        </React.Fragment>
      );
    })}
  </>
  );
};

/** Plain variables, objects and the call stack as a glass panel. */
const VariablesHud: React.FC<{ scene: DataScene }> = ({ scene }) => {
  const theme = useTheme3D();
  const light = theme.name === 'light';
  if (scene.scalars.length === 0 && scene.objects.length === 0 && scene.stack.length === 0) return null;
  return (
    <div data-no-orbit className={`absolute top-3 left-3 z-20 w-56 max-h-[calc(100%-1.5rem)] overflow-y-auto rounded-xl border backdrop-blur p-3 space-y-3 cursor-default ${theme.panel}`}>
      {scene.stack.length > 0 && (
        <div>
          <div className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider mb-1.5 ${theme.panelTitle}`}>
            <Layers3 className="w-3 h-3" /> Call stack
          </div>
          <div className="flex flex-col-reverse gap-1">
            {scene.stack.map((f, i) => (
              <div
                key={`${f}-${i}`}
                className={`text-[11px] font-mono rounded px-2 py-1 border ${i === scene.stack.length - 1 ? (light ? 'bg-indigo-50 border-indigo-300 text-indigo-700' : 'bg-indigo-500/20 border-indigo-400/40 text-indigo-100') : `${theme.chip} ${theme.panelMuted}`}`}
              >
                {f === '<module>' || /\s|\(/.test(f) ? f.replace(/^Global \(main program\)$/, 'Main program') : `${f}()`}
              </div>
            ))}
          </div>
        </div>
      )}
      {scene.scalars.length > 0 && (
        <div>
          <div className={`text-[10px] font-bold uppercase tracking-wider mb-1.5 ${theme.panelTitle}`}>Variables</div>
          <div className="space-y-1">
            {scene.scalars.slice(0, 14).map((v) => (
              <div
                key={v.name}
                className={`flex items-center justify-between gap-2 rounded px-2 py-1 text-[11px] font-mono border transition-colors ${
                  v.changed || v.isNew ? theme.chipChanged : theme.chip
                }`}
              >
                <span className="font-semibold truncate" style={{ color: v.isPointer ? theme.accentText(pointerColor(v.name)) : light ? '#334155' : '#e2e8f0' }}>
                  {v.name}
                </span>
                <span className={`truncate max-w-[110px] ${theme.panelText}`} title={v.value}>
                  {v.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
      {scene.objects.length > 0 && (
        <div>
          <div className={`text-[10px] font-bold uppercase tracking-wider mb-1.5 ${theme.panelTitle}`}>Objects</div>
          {scene.objects.slice(0, 4).map((o) => (
            <div key={o.name} className={`rounded border p-2 mb-1.5 ${light ? 'border-violet-200 bg-violet-50' : 'border-violet-400/30 bg-violet-500/10'}`}>
              <div className={`text-[11px] font-mono font-semibold ${light ? 'text-violet-700' : 'text-violet-200'}`}>
                {o.name} <span className={`font-normal ${light ? 'text-violet-400' : 'text-violet-300/60'}`}>{o.type}</span>
              </div>
              {o.attrs.slice(0, 6).map((a) => (
                <div key={a.name} className={`flex justify-between gap-2 text-[10.5px] font-mono mt-0.5 ${a.changed ? (light ? 'text-amber-700' : 'text-amber-200') : theme.panelText}`}>
                  <span>.{a.name}</span>
                  <span className="truncate max-w-[100px]">{a.value}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
