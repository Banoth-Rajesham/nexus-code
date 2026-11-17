/**
 * Language-Neutral Flow Graph Data Structures
 * Supports Python, JavaScript, Java, C++, etc.
 */

export type FlowNodeKind =
  | 'start'
  | 'end'
  | 'process'
  | 'decision'
  | 'io'
  | 'subroutine'
  | 'collapsed'
  | 'error';

export interface FlowNode {
  id: string;
  kind: FlowNodeKind;
  label: string;          // Escaped, human-readable short label (<=40 chars)
  fullText: string;       // Full raw code or description for tooltip
  startLine: number;      // 1-based start line in source code
  endLine: number;        // 1-based end line in source code
  subroutineTarget?: string; // If calling a user-defined function
  collapsedCount?: number;   // If multiple linear steps are collapsed
  tag?: string;           // Optional semantic tag (e.g. 'LOOP', 'IF', 'ACTION', 'VARIABLE')
}

export interface FlowEdge {
  from: string;           // Source node id
  to: string;             // Target node id
  label?: string;         // 'Yes', 'No', 'Loop back', 'Next item', 'Done', etc.
  style?: 'normal' | 'dashed' | 'dotted';
}

export interface FlowGraph {
  name: string;           // 'Main' or function name e.g. 'factorial'
  kind: 'main' | 'function' | 'method';
  nodes: FlowNode[];
  edges: FlowEdge[];
  startNodeId: string;
  endNodeId: string;
  totalStatements: number;
}

export interface FlowchartBundle {
  charts: Record<string, FlowGraph>; // name -> FlowGraph
  functionNames: string[];           // List of function charts available
  totalNodeCount: number;
  capped: boolean;
  empty: boolean;
}

/**
 * Escapes labels strictly for Mermaid syntax.
 * Replaces characters that conflict with Mermaid node delimiters:
 * quotes, brackets, braces, pipes, hashes, angle brackets, backticks.
 * Truncates at maxLen (default 40 chars) with '...'.
 */
export function escapeMermaidLabel(raw: string, maxLen: number = 40): string {
  if (!raw) return '';
  let str = raw.trim().replace(/\r?\n/g, ' ');

  if (str.length > maxLen) {
    str = str.substring(0, maxLen - 3) + '...';
  }

  return str
    .replace(/"/g, "'")
    .replace(/[[\]]/g, (m) => (m === '[' ? '(' : ')'))
    .replace(/[{}]/g, '')
    .replace(/[<>]/g, (m) => (m === '<' ? '&lt;' : '&gt;'))
    .replace(/\|/g, '/')
    .replace(/#/g, '')
    .replace(/`/g, "'")
    .trim();
}
