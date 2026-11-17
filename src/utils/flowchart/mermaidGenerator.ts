import { FlowGraph, FlowNode, escapeMermaidLabel } from './flowGraph';

export interface MermaidGeneratorOptions {
  direction?: 'TD' | 'LR';
  theme?: 'dark' | 'light';
  activeNodeId?: string | null;
  visitedNodeIds?: Set<string>;
}

export function generateMermaidText(
  graph: FlowGraph,
  options: MermaidGeneratorOptions = {}
): string {
  const { direction = 'TD', theme = 'dark', activeNodeId, visitedNodeIds } = options;

  if (!graph || graph.nodes.length === 0) {
    return `flowchart ${direction}\n  empty(["No statements in this chart"])`;
  }

  const lines: string[] = [];
  lines.push(`flowchart ${direction}`);

  // 1. Declare Nodes
  for (const node of graph.nodes) {
    const esc = escapeMermaidLabel(node.label || 'Step');
    let shapeStr = '';

    switch (node.kind) {
      case 'start':
      case 'end':
        shapeStr = `${node.id}(["${esc}"])`;
        break;
      case 'decision':
        shapeStr = `${node.id}{"${esc}"}`;
        break;
      case 'io':
        shapeStr = `${node.id}[/"${esc}"/]`;
        break;
      case 'subroutine':
        shapeStr = `${node.id}[["${esc}"]]`;
        break;
      case 'error':
        shapeStr = `${node.id}["⚠️ ${esc}"]`;
        break;
      case 'collapsed':
        shapeStr = `${node.id}["📦 ${esc}"]`;
        break;
      case 'process':
      default:
        shapeStr = `${node.id}["${esc}"]`;
        break;
    }

    lines.push(`  ${shapeStr}`);
  }

  lines.push('');

  // 2. Declare Edges
  for (const edge of graph.edges) {
    const label = edge.label ? `|${escapeMermaidLabel(edge.label, 20)}|` : '';
    if (edge.style === 'dashed') {
      lines.push(`  ${edge.from} -.->${label} ${edge.to}`);
    } else {
      lines.push(`  ${edge.from} -->${label} ${edge.to}`);
    }
  }

  lines.push('');

  // 3. Theme Styling & ClassDefs
  const isDark = theme !== 'light';

  if (isDark) {
    lines.push(`  classDef default fill:#161b22,stroke:#30363d,stroke-width:1.5px,color:#e6edf3;`);
    lines.push(`  classDef startEnd fill:#2e1b4d,stroke:#a78bfa,stroke-width:2px,color:#f3e8ff;`);
    lines.push(`  classDef decision fill:#1e3a5f,stroke:#60a5fa,stroke-width:2px,color:#eff6ff;`);
    lines.push(`  classDef loopNode fill:#4a3205,stroke:#fbbf24,stroke-width:2px,color:#fefce8;`);
    lines.push(`  classDef ioNode fill:#0e3a47,stroke:#22d3ee,stroke-width:2px,color:#ecfeff;`);
    lines.push(`  classDef processNode fill:#0f382c,stroke:#34d399,stroke-width:1.5px,color:#ecfdf5;`);
    lines.push(`  classDef subroutineNode fill:#1f2937,stroke:#93c5fd,stroke-width:2px,stroke-dasharray: 4 2,color:#ffffff;`);
    lines.push(`  classDef errorNode fill:#4c111a,stroke:#f87171,stroke-width:2px,color:#fee2e2;`);
    lines.push(`  classDef collapsedNode fill:#21262d,stroke:#8b949e,stroke-width:1.5px,stroke-dasharray: 3 3,color:#c9d1d9;`);
    lines.push(`  classDef activeNode fill:#78350f,stroke:#f59e0b,stroke-width:3px,color:#ffffff;`);
    lines.push(`  classDef visitedNode fill:#1e293b,stroke:#38bdf8,stroke-width:1.5px,color:#ffffff;`);
  } else {
    lines.push(`  classDef default fill:#f8fafc,stroke:#cbd5e1,stroke-width:1.5px,color:#0f172a;`);
    lines.push(`  classDef startEnd fill:#f3e8ff,stroke:#9333ea,stroke-width:2px,color:#581c87;`);
    lines.push(`  classDef decision fill:#eff6ff,stroke:#3b82f6,stroke-width:2px,color:#1e40af;`);
    lines.push(`  classDef loopNode fill:#fefce8,stroke:#d97706,stroke-width:2px,color:#854d0e;`);
    lines.push(`  classDef ioNode fill:#ecfeff,stroke:#06b6d4,stroke-width:2px,color:#155e75;`);
    lines.push(`  classDef processNode fill:#ecfdf5,stroke:#10b981,stroke-width:1.5px,color:#065f46;`);
    lines.push(`  classDef subroutineNode fill:#f1f5f9,stroke:#64748b,stroke-width:2px,stroke-dasharray: 4 2,color:#0f172a;`);
    lines.push(`  classDef errorNode fill:#fee2e2,stroke:#ef4444,stroke-width:2px,color:#991b1b;`);
    lines.push(`  classDef collapsedNode fill:#f1f5f9,stroke:#94a3b8,stroke-width:1.5px,stroke-dasharray: 3 3,color:#334155;`);
    lines.push(`  classDef activeNode fill:#fef3c7,stroke:#d97706,stroke-width:3px,color:#78350f;`);
    lines.push(`  classDef visitedNode fill:#e0f2fe,stroke:#0284c7,stroke-width:1.5px,color:#0369a1;`);
  }

  // 4. Apply classes
  const decisions: string[] = [];
  const loops: string[] = [];
  const ios: string[] = [];
  const processes: string[] = [];
  const startEnds: string[] = [];
  const subroutines: string[] = [];
  const errors: string[] = [];
  const collapseds: string[] = [];

  for (const n of graph.nodes) {
    if (n.id === activeNodeId) continue;
    if (n.kind === 'start' || n.kind === 'end') startEnds.push(n.id);
    else if (n.tag === 'LOOP') loops.push(n.id);
    else if (n.kind === 'decision') decisions.push(n.id);
    else if (n.kind === 'io') ios.push(n.id);
    else if (n.kind === 'subroutine') subroutines.push(n.id);
    else if (n.kind === 'error') errors.push(n.id);
    else if (n.kind === 'collapsed') collapseds.push(n.id);
    else processes.push(n.id);
  }

  if (startEnds.length) lines.push(`  class ${startEnds.join(',')} startEnd;`);
  if (decisions.length) lines.push(`  class ${decisions.join(',')} decision;`);
  if (loops.length) lines.push(`  class ${loops.join(',')} loopNode;`);
  if (ios.length) lines.push(`  class ${ios.join(',')} ioNode;`);
  if (processes.length) lines.push(`  class ${processes.join(',')} processNode;`);
  if (subroutines.length) lines.push(`  class ${subroutines.join(',')} subroutineNode;`);
  if (errors.length) lines.push(`  class ${errors.join(',')} errorNode;`);
  if (collapseds.length) lines.push(`  class ${collapseds.join(',')} collapsedNode;`);

  // Active step highlight
  if (activeNodeId) {
    lines.push(`  class ${activeNodeId} activeNode;`);
  }

  return lines.join('\n');
}
