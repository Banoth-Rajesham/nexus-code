// ============================================================================
// 3D DATA SCENE BUILDER
// Turns one recorded execution step (plus the previous one) into a list of
// visual structures: arrays as boxes, index variables as pointers, strings as
// letter tiles, dictionaries as key/value cards, 2D lists as grids, and plain
// values as variable chips. Pure and deterministic — easy to test.
// ============================================================================

import type { TraceStep, VizValue } from '../pyodideRunner';

export interface Cell {
  /** Display text */
  text: string;
  /** Python type name of the value */
  type: string;
  /** Falsy values (0, None, '', False) are drawn as "ghost" boxes */
  ghost: boolean;
  /** Value changed since the previous step */
  changed: boolean;
}

export interface PointerMark {
  name: string;
  index: number;
  /** Pointer moved on this step */
  moved: boolean;
}

export type Structure =
  | { kind: 'array'; name: string; typeName: string; cells: Cell[]; pointers: PointerMark[]; isNew: boolean }
  | { kind: 'string'; name: string; cells: Cell[]; pointers: PointerMark[]; isNew: boolean }
  | { kind: 'grid'; name: string; rows: Cell[][]; isNew: boolean }
  | { kind: 'dict'; name: string; entries: { key: string; value: Cell }[]; isNew: boolean };

export interface ScalarVar {
  name: string;
  type: string;
  value: string;
  changed: boolean;
  isNew: boolean;
  /** This variable is used as an index into a structure */
  isPointer: boolean;
}

export interface DataScene {
  structures: Structure[];
  scalars: ScalarVar[];
  objects: { name: string; type: string; attrs: { name: string; value: string; changed: boolean }[] }[];
  stack: string[];
}

// ── Pointer detection (static) ───────────────────────────────────────────────

/**
 * Find which variables are used as indexes into which sequences:
 *   nums[read], nums[i + 1], s[left], grid[r][c]
 *   for i in range(len(nums))
 * Returns sequence name -> set of index variable names.
 */
export function detectPointers(code: string): Map<string, Set<string>> {
  const map = new Map<string, Set<string>>();
  const add = (seq: string, idx: string) => {
    if (seq === idx || /^\d/.test(idx)) return;
    if (!map.has(seq)) map.set(seq, new Set());
    map.get(seq)!.add(idx);
  };
  // Strip comments and string contents so they never produce matches
  const clean = code.replace(/#.*$/gm, '').replace(/(["'])(?:\\.|(?!\1).)*\1/g, '""');

  const subscript = /\b([A-Za-z_]\w*)\s*\[\s*([A-Za-z_]\w*)\s*(?:[+-]\s*[\w]+\s*)?\]/g;
  let m: RegExpExecArray | null;
  while ((m = subscript.exec(clean))) add(m[1], m[2]);

  const rangeLen = /for\s+([A-Za-z_]\w*)\s+in\s+range\s*\(\s*(?:[^,()]*,\s*)?len\s*\(\s*([A-Za-z_]\w*)\s*\)/g;
  while ((m = rangeLen.exec(clean))) add(m[2], m[1]);

  const enumerate = /for\s+([A-Za-z_]\w*)\s*,\s*[A-Za-z_]\w*\s+in\s+enumerate\s*\(\s*([A-Za-z_]\w*)\s*\)/g;
  while ((m = enumerate.exec(clean))) add(m[2], m[1]);

  return map;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function primText(v: VizValue): string {
  if (v.k === 'prim') return v.r;
  if (v.k === 'str') return `'${v.items.map((c) => (c.k === 'prim' ? c.r : '')).join('')}'`;
  if (v.k === 'list') return v.t === 'tuple' ? '(…)' : '[…]';
  return '{…}';
}

function isGhost(v: VizValue): boolean {
  if (v.k !== 'prim') return v.items.length === 0;
  return v.r === '0' || v.r === '0.0' || v.r === 'None' || v.r === 'False' || v.r === "''" || v.r === '""';
}

function toCell(v: VizValue, prev?: VizValue): Cell {
  const text = primText(v);
  return {
    text,
    type: v.k === 'prim' ? v.t : v.k,
    ghost: isGhost(v),
    changed: prev !== undefined && primText(prev) !== text,
  };
}

function isGrid(v: VizValue): boolean {
  return (
    v.k === 'list' &&
    v.items.length > 0 &&
    v.items.length <= 16 &&
    v.items.every((row) => row.k === 'list' && row.items.length <= 16 && row.items.every((c) => c.k === 'prim'))
  );
}

function asInt(value: string | undefined): number | null {
  if (value === undefined || !/^-?\d+$/.test(value)) return null;
  return Number(value);
}

// ── Scene builder ───────────────────────────────────────────────────────────

/**
 * Build the visual scene for one execution step.
 * `pointers` comes from detectPointers(code) and is computed once per program.
 */
export function buildDataScene(step: TraceStep | null, prev: TraceStep | null, pointers: Map<string, Set<string>>): DataScene {
  const scene: DataScene = { structures: [], scalars: [], objects: [], stack: [] };
  if (!step) return scene;

  scene.stack = (step.stack || []).map((f) => f.function);
  const locals = step.locals || {};
  const prevLocals = prev?.locals || {};

  const pointerVars = new Set<string>();
  pointers.forEach((idxs) => idxs.forEach((i) => pointerVars.add(i)));

  const pointerMarks = (seqName: string, length: number): PointerMark[] => {
    const idxs = pointers.get(seqName);
    if (!idxs) return [];
    const marks: PointerMark[] = [];
    idxs.forEach((idxName) => {
      const v = locals[idxName];
      const n = asInt(v?.value);
      if (n === null) return;
      const index = n < 0 ? length + n : n;
      // allow one-past-the-end so a pointer that just finished is still visible
      if (index < 0 || index > length) return;
      const before = asInt(prevLocals[idxName]?.value);
      marks.push({ name: idxName, index, moved: before !== null && before !== n });
    });
    return marks.sort((a, b) => a.name.localeCompare(b.name));
  };

  for (const [key, entry] of Object.entries(locals)) {
    if (entry.isMeta || key.startsWith('__')) continue;
    const before = prevLocals[key];
    const isNew = !!prev && !before;

    if (entry.isInstance) {
      scene.objects.push({
        name: entry.name || key,
        type: entry.type,
        attrs: Object.values(entry.attrs || {}).map((a) => ({
          name: a.name,
          value: a.value,
          changed: !!before?.attrs && before.attrs[a.name]?.value !== a.value,
        })),
      });
      continue;
    }

    const viz = entry.viz;
    const prevViz = before?.viz;

    if (viz && isGrid(viz) && viz.k === 'list') {
      const prevRows = prevViz && prevViz.k === 'list' ? prevViz.items : [];
      scene.structures.push({
        kind: 'grid',
        name: key,
        isNew,
        rows: viz.items.map((row, r) => {
          const prevRow = prevRows[r];
          return row.k === 'list'
            ? row.items.map((c, ci) => toCell(c, prevRow && prevRow.k === 'list' ? prevRow.items[ci] : undefined))
            : [];
        }),
      });
      continue;
    }

    if (viz && viz.k === 'list') {
      const prevItems = prevViz && prevViz.k === 'list' ? prevViz.items : [];
      scene.structures.push({
        kind: 'array',
        name: key,
        typeName: viz.t,
        isNew,
        cells: viz.items.map((c, i) => toCell(c, prev ? prevItems[i] ?? { k: 'prim', t: 'NoneType', r: '\u0000' } : undefined)),
        pointers: pointerMarks(key, viz.items.length),
      });
      continue;
    }

    if (viz && viz.k === 'str' && (pointers.has(key) || viz.items.length <= 24)) {
      const prevItems = prevViz && prevViz.k === 'str' ? prevViz.items : [];
      scene.structures.push({
        kind: 'string',
        name: key,
        isNew,
        cells: viz.items.map((c, i) => ({ ...toCell(c, prev ? prevItems[i] : undefined), ghost: false })),
        pointers: pointerMarks(key, viz.items.length),
      });
      continue;
    }

    if (viz && viz.k === 'dict') {
      const prevMap = new Map(prevViz && prevViz.k === 'dict' ? prevViz.items : []);
      scene.structures.push({
        kind: 'dict',
        name: key,
        isNew,
        entries: viz.items.map(([k, v]) => {
          const pv = prevMap.get(k);
          const cell = toCell(v, pv);
          // a brand-new key counts as a change
          if (prev && !pv) cell.changed = true;
          return { key: k, value: cell };
        }),
      });
      continue;
    }

    scene.scalars.push({
      name: entry.name || key,
      type: entry.type,
      value: entry.value,
      changed: !!before && before.value !== entry.value,
      isNew,
      isPointer: pointerVars.has(key),
    });
  }

  // Biggest / most interesting structures first
  const order = { array: 0, string: 1, grid: 2, dict: 3 } as const;
  scene.structures.sort((a, b) => order[a.kind] - order[b.kind]);
  scene.scalars.sort((a, b) => Number(b.isPointer) - Number(a.isPointer));
  return scene;
}
