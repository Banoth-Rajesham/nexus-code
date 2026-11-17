/**
 * Python Parse Tree to Flow Graph Converter
 * Transforms Python Tree-Sitter AST / Statement rows into a structured Control Flow Graph
 */

import { FlowGraph, FlowNode, FlowEdge, FlowchartBundle, escapeMermaidLabel } from './flowGraph';
import { StatementExplanationRow } from '../pythonTreeSitterEngine';

interface BuilderContext {
  graph: FlowGraph;
  userFunctions: Set<string>;
  nextId: (prefix?: string) => string;
  loopStack: Array<{ condId: string; exitId: string }>;
  functionEndId: string;
}

export function buildFlowchartFromPython(
  code: string,
  rows: StatementExplanationRow[] = []
): FlowchartBundle {
  const trimmed = code.trim();
  if (!trimmed || rows.length === 0) {
    return {
      charts: {
        Main: {
          name: 'Main',
          kind: 'main',
          nodes: [],
          edges: [],
          startNodeId: '',
          endNodeId: '',
          totalStatements: 0,
        },
      },
      functionNames: [],
      totalNodeCount: 0,
      capped: false,
      empty: true,
    };
  }

  // 1. Identify all user-defined functions
  const userFunctions = new Set<string>();
  const functionRowGroups: Record<string, StatementExplanationRow[]> = {};
  const mainRows: StatementExplanationRow[] = [];

  let currentFunc: string | null = null;
  let funcDepth = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (row.kind === 'function_definition' || row.tag === 'FUNCTION') {
      const match = row.rawCode.match(/def\s+([a-zA-Z0-9_]+)\s*\((.*?)\)/);
      const fnName = match ? match[1] : `func_${row.startLine}`;
      userFunctions.add(fnName);
      currentFunc = fnName;
      funcDepth = row.depth;
      functionRowGroups[fnName] = [row];
      continue;
    }

    if (currentFunc) {
      if (row.depth > funcDepth) {
        functionRowGroups[currentFunc].push(row);
      } else {
        currentFunc = null;
        mainRows.push(row);
      }
    } else {
      mainRows.push(row);
    }
  }

  // 2. Build charts
  const charts: Record<string, FlowGraph> = {};
  let totalNodesAcrossCharts = 0;

  // Build Main Chart
  const mainChart = buildSingleChart('Main', 'main', mainRows, userFunctions);
  charts.Main = mainChart;
  totalNodesAcrossCharts += mainChart.nodes.length;

  // Build Each Function Chart
  const functionNames = Object.keys(functionRowGroups);
  for (const fnName of functionNames) {
    const fnRows = functionRowGroups[fnName];
    // Skip def line itself in body
    const bodyRows = fnRows.slice(1);
    const defRow = fnRows[0];
    const fnChart = buildSingleChart(fnName, 'function', bodyRows, userFunctions, defRow);
    charts[fnName] = fnChart;
    totalNodesAcrossCharts += fnChart.nodes.length;
  }

  const capped = totalNodesAcrossCharts >= 300;

  return {
    charts,
    functionNames,
    totalNodeCount: totalNodesAcrossCharts,
    capped,
    empty: false,
  };
}

function buildSingleChart(
  name: string,
  kind: 'main' | 'function' | 'method',
  rows: StatementExplanationRow[],
  userFunctions: Set<string>,
  defRow?: StatementExplanationRow
): FlowGraph {
  let counter = 1;
  const safeName = name.replace(/[^a-zA-Z0-9_]/g, '_');
  const nextId = (prefix: string = 'n') => `${safeName}_${prefix}_${counter++}`;

  const graph: FlowGraph = {
    name,
    kind,
    nodes: [],
    edges: [],
    startNodeId: '',
    endNodeId: '',
    totalStatements: rows.length,
  };

  const startId = nextId('start');
  const endId = nextId('end');
  graph.startNodeId = startId;
  graph.endNodeId = endId;

  // Start Node
  const startLabel = defRow
    ? `Start ${defRow.rawCode.replace(/:$/, '').trim()}`
    : `Start ${name}`;

  graph.nodes.push({
    id: startId,
    kind: 'start',
    label: escapeMermaidLabel(startLabel, 36),
    fullText: startLabel,
    startLine: defRow?.startLine || (rows[0]?.startLine || 1),
    endLine: defRow?.endLine || (rows[0]?.startLine || 1),
    tag: 'START',
  });

  // End Node
  graph.nodes.push({
    id: endId,
    kind: 'end',
    label: kind === 'function' ? 'Return / End' : 'End',
    fullText: 'End of execution',
    startLine: rows[rows.length - 1]?.endLine || 1,
    endLine: rows[rows.length - 1]?.endLine || 1,
    tag: 'END',
  });

  if (rows.length === 0) {
    graph.edges.push({ from: startId, to: endId });
    return graph;
  }

  const ctx: BuilderContext = {
    graph,
    userFunctions,
    nextId,
    loopStack: [],
    functionEndId: endId,
  };

  // Convert statements into CFG
  const collapseEligible = rows.length > 40;
  const exitNode = convertBlock(rows, 0, rows.length - 1, startId, ctx, collapseEligible);

  // Connect last block exit to End Node
  if (exitNode && exitNode !== endId) {
    graph.edges.push({ from: exitNode, to: endId });
  }

  return graph;
}

function formatCondition(rawCode: string, kind: string): string {
  let cond = rawCode.trim();
  if (cond.endsWith(':')) cond = cond.slice(0, -1).trim();

  if (cond.startsWith('if ')) cond = cond.substring(3).trim();
  else if (cond.startsWith('elif ')) cond = cond.substring(5).trim();
  else if (cond.startsWith('while ')) cond = cond.substring(6).trim();

  // If already question format or comparison, make beginner friendly
  if (/^[a-zA-Z0-9_.]+\s*(==|!=|>=|<=|>|<|in|is)\s*.+/.test(cond)) {
    return `Is ${cond}?`;
  }
  return `Is ${cond} True?`;
}

function formatForCondition(rawCode: string): string {
  let forStr = rawCode.trim();
  if (forStr.endsWith(':')) forStr = forStr.slice(0, -1).trim();
  if (forStr.startsWith('for ')) forStr = forStr.substring(4).trim();

  const match = forStr.match(/^([a-zA-Z0-9_]+)\s+in\s+range\((.*?)\)$/);
  if (match) {
    const varName = match[1];
    const args = match[2].split(',').map((s) => s.trim());
    if (args.length === 1 && /^\d+$/.test(args[0])) {
      const stop = parseInt(args[0], 10);
      return `${varName} from 0 to ${stop - 1}`;
    } else if (args.length === 2 && /^\d+$/.test(args[0]) && /^\d+$/.test(args[1])) {
      return `${varName} from ${args[0]} to ${parseInt(args[1], 10) - 1}`;
    }
  }
  return forStr;
}

function formatAction(row: StatementExplanationRow, userFunctions: Set<string>): {
  label: string;
  kind: 'process' | 'io' | 'subroutine' | 'error';
  target?: string;
} {
  const trimmed = row.rawCode.trim();

  if (row.hasError) {
    return { label: `Fix: ${trimmed}`, kind: 'error' };
  }

  // Print IO
  if (/^print\s*\(/.test(trimmed)) {
    const inside = trimmed.replace(/^print\s*\(/, '').replace(/\)$/, '').trim();
    return { label: inside ? `Show ${inside}` : 'Print line', kind: 'io' };
  }

  // Input IO
  if (/=\s*input\s*\(/.test(trimmed)) {
    const parts = trimmed.split('=');
    const varName = parts[0].trim();
    return { label: `Input ${varName}`, kind: 'io' };
  }
  if (/^input\s*\(/.test(trimmed)) {
    return { label: 'Wait for input', kind: 'io' };
  }

  // User function call check
  for (const fn of userFunctions) {
    const callRegex = new RegExp(`\\b${fn}\\s*\\(`);
    if (callRegex.test(trimmed)) {
      return { label: `Call ${fn}()`, kind: 'subroutine', target: fn };
    }
  }

  // Clean assignment / operation
  return { label: trimmed, kind: 'process' };
}

/**
 * Converts a sequence of rows into a control flow subgraph.
 * Returns the final exit node ID of this block.
 */
function convertBlock(
  rows: StatementExplanationRow[],
  startIndex: number,
  endIndex: number,
  incomingNodeId: string,
  ctx: BuilderContext,
  allowCollapse: boolean = false
): string {
  let prevNodeId = incomingNodeId;
  let i = startIndex;

  while (i <= endIndex) {
    const row = rows[i];

    // Cap at 295 nodes to guarantee stability on massive programs
    if (ctx.graph.nodes.length >= 295) {
      const capId = ctx.nextId('cap');
      ctx.graph.nodes.push({
        id: capId,
        kind: 'error',
        label: 'Diagram capped at 300 nodes',
        fullText: 'Flowchart capped at 300 nodes to preserve browser performance. Focus on individual functions using the Focus dropdown.',
        startLine: row.startLine,
        endLine: row.endLine,
        tag: 'STOP',
      });
      ctx.graph.edges.push({ from: prevNodeId, to: capId });
      return capId;
    }

    // Check for collapsible assignment sequences if allowCollapse is true
    if (
      allowCollapse &&
      row.kind === 'assignment' &&
      !row.rawCode.includes('(') &&
      i + 3 <= endIndex
    ) {
      // Look ahead to see if next 3+ statements are also simple assignments
      let seqEnd = i;
      while (
        seqEnd + 1 <= endIndex &&
        rows[seqEnd + 1].kind === 'assignment' &&
        !rows[seqEnd + 1].rawCode.includes('(') &&
        rows[seqEnd + 1].depth === row.depth
      ) {
        seqEnd++;
      }

      if (seqEnd - i >= 3) {
        const count = seqEnd - i + 1;
        const colId = ctx.nextId('col');
        ctx.graph.nodes.push({
          id: colId,
          kind: 'collapsed',
          label: `Setup: ${count} assignments`,
          fullText: rows.slice(i, seqEnd + 1).map((r) => r.rawCode).join('\n'),
          startLine: row.startLine,
          endLine: rows[seqEnd].endLine,
          collapsedCount: count,
          tag: 'VARIABLE',
        });
        ctx.graph.edges.push({ from: prevNodeId, to: colId });
        prevNodeId = colId;
        i = seqEnd + 1;
        continue;
      }
    }

    // 1. IF / ELIF / ELSE
    if (row.kind === 'if_statement' || row.tag === 'IF') {
      const { exitNodeId, nextIndex } = handleIfStructure(rows, i, prevNodeId, ctx, allowCollapse);
      prevNodeId = exitNodeId;
      i = nextIndex;
      continue;
    }

    // 2. WHILE LOOP
    if (row.kind === 'while_statement' || (row.tag === 'LOOP' && row.rawCode.trim().startsWith('while'))) {
      const { exitNodeId, nextIndex } = handleWhileLoop(rows, i, prevNodeId, ctx, allowCollapse);
      prevNodeId = exitNodeId;
      i = nextIndex;
      continue;
    }

    // 3. FOR LOOP
    if (row.kind === 'for_statement' || (row.tag === 'LOOP' && row.rawCode.trim().startsWith('for'))) {
      const { exitNodeId, nextIndex } = handleForLoop(rows, i, prevNodeId, ctx, allowCollapse);
      prevNodeId = exitNodeId;
      i = nextIndex;
      continue;
    }

    // 4. TRY / EXCEPT
    if (row.kind === 'try_statement' || row.rawCode.trim().startsWith('try:')) {
      const { exitNodeId, nextIndex } = handleTryExcept(rows, i, prevNodeId, ctx, allowCollapse);
      prevNodeId = exitNodeId;
      i = nextIndex;
      continue;
    }

    // 5. BREAK statement
    if (row.kind === 'break_statement' || row.rawCode.trim() === 'break') {
      const breakId = ctx.nextId('brk');
      ctx.graph.nodes.push({
        id: breakId,
        kind: 'process',
        label: 'break',
        fullText: 'break (exits loop immediately)',
        startLine: row.startLine,
        endLine: row.endLine,
        tag: 'STOP',
      });
      ctx.graph.edges.push({ from: prevNodeId, to: breakId });

      if (ctx.loopStack.length > 0) {
        const loop = ctx.loopStack[ctx.loopStack.length - 1];
        ctx.graph.edges.push({ from: breakId, to: loop.exitId, label: 'Exit loop' });
      }
      return breakId;
    }

    // 6. CONTINUE statement
    if (row.kind === 'continue_statement' || row.rawCode.trim() === 'continue') {
      const contId = ctx.nextId('cnt');
      ctx.graph.nodes.push({
        id: contId,
        kind: 'process',
        label: 'continue',
        fullText: 'continue (skips to next loop iteration)',
        startLine: row.startLine,
        endLine: row.endLine,
        tag: 'SKIP',
      });
      ctx.graph.edges.push({ from: prevNodeId, to: contId });

      if (ctx.loopStack.length > 0) {
        const loop = ctx.loopStack[ctx.loopStack.length - 1];
        ctx.graph.edges.push({ from: contId, to: loop.condId, label: 'Next' });
      }
      return contId;
    }

    // 7. RETURN statement
    if (row.kind === 'return_statement' || row.tag === 'RETURN') {
      const retId = ctx.nextId('ret');
      const val = row.rawCode.replace(/^return\b/, '').trim();
      const label = val ? `Return ${val}` : 'Return';

      ctx.graph.nodes.push({
        id: retId,
        kind: 'end',
        label: escapeMermaidLabel(label, 36),
        fullText: row.rawCode,
        startLine: row.startLine,
        endLine: row.endLine,
        tag: 'RETURN',
      });
      ctx.graph.edges.push({ from: prevNodeId, to: retId });
      ctx.graph.edges.push({ from: retId, to: ctx.functionEndId });
      return retId;
    }

    // 8. Normal Linear Statement
    const action = formatAction(row, ctx.userFunctions);
    const nodeId = ctx.nextId('s');

    ctx.graph.nodes.push({
      id: nodeId,
      kind: action.kind,
      label: escapeMermaidLabel(action.label, 36),
      fullText: row.rawCode,
      startLine: row.startLine,
      endLine: row.endLine,
      subroutineTarget: action.target,
      tag: row.tag,
    });

    ctx.graph.edges.push({ from: prevNodeId, to: nodeId });
    prevNodeId = nodeId;
    i++;
  }

  return prevNodeId;
}

function handleIfStructure(
  rows: StatementExplanationRow[],
  ifIndex: number,
  prevNodeId: string,
  ctx: BuilderContext,
  allowCollapse: boolean
): { exitNodeId: string; nextIndex: number } {
  const ifRow = rows[ifIndex];
  const baseDepth = ifRow.depth;

  // Find all branches of this if statement (if, elif, else)
  let curr = ifIndex + 1;
  const branches: Array<{
    type: 'if' | 'elif' | 'else';
    headerRow: StatementExplanationRow;
    bodyStartIndex: number;
    bodyEndIndex: number;
  }> = [];

  let currentBranchType: 'if' | 'elif' | 'else' = 'if';
  let currentHeader = ifRow;
  let bodyStart = curr;

  while (curr < rows.length) {
    const r = rows[curr];
    if (r.depth === baseDepth) {
      const trimmed = r.rawCode.trim();
      if (trimmed.startsWith('elif ') || r.kind === 'elif_clause' || r.tag === 'ELSE IF') {
        branches.push({
          type: currentBranchType,
          headerRow: currentHeader,
          bodyStartIndex: bodyStart,
          bodyEndIndex: curr - 1,
        });
        currentBranchType = 'elif';
        currentHeader = r;
        bodyStart = curr + 1;
        curr++;
        continue;
      } else if (trimmed.startsWith('else:') || r.kind === 'else_clause' || r.tag === 'ELSE') {
        branches.push({
          type: currentBranchType,
          headerRow: currentHeader,
          bodyStartIndex: bodyStart,
          bodyEndIndex: curr - 1,
        });
        currentBranchType = 'else';
        currentHeader = r;
        bodyStart = curr + 1;
        curr++;
        continue;
      } else {
        // Next statement at same depth -> end of if structure
        break;
      }
    } else if (r.depth < baseDepth) {
      // Outer block exited
      break;
    }
    curr++;
  }

  // Push final branch
  branches.push({
    type: currentBranchType,
    headerRow: currentHeader,
    bodyStartIndex: bodyStart,
    bodyEndIndex: curr - 1,
  });

  const junctionId = ctx.nextId('junc');
  // Push junction merge node so it appears in the Mermaid node list
  ctx.graph.nodes.push({
    id: junctionId,
    kind: 'process',
    label: '·',
    fullText: 'Merge point',
    startLine: ifRow.startLine,
    endLine: ifRow.endLine,
  });

  const branchExits: string[] = [];
  let incomingDecisionId = prevNodeId;

  for (let b = 0; b < branches.length; b++) {
    const branch = branches[b];

    if (branch.type === 'if' || branch.type === 'elif') {
      const decId = ctx.nextId('dec');
      const condLabel = formatCondition(branch.headerRow.rawCode, branch.type);

      ctx.graph.nodes.push({
        id: decId,
        kind: 'decision',
        label: escapeMermaidLabel(condLabel, 36),
        fullText: branch.headerRow.rawCode,
        startLine: branch.headerRow.startLine,
        endLine: branch.headerRow.endLine,
        tag: 'IF',
      });

      if (b === 0) {
        ctx.graph.edges.push({ from: incomingDecisionId, to: decId });
      } else {
        ctx.graph.edges.push({ from: incomingDecisionId, to: decId, label: 'No' });
      }

      // Branch Consequence
      if (branch.bodyStartIndex <= branch.bodyEndIndex) {
        const bodyExit = convertBlock(
          rows,
          branch.bodyStartIndex,
          branch.bodyEndIndex,
          decId,
          ctx,
          allowCollapse
        );
        // Tag edge from decision to first body statement as 'Yes'
        const firstEdge = ctx.graph.edges.find((e) => e.from === decId && !e.label);
        if (firstEdge) firstEdge.label = 'Yes';
        branchExits.push(bodyExit);
      } else {
        // Empty if body
        branchExits.push(decId);
      }

      incomingDecisionId = decId;
    } else {
      // Else branch
      if (branch.bodyStartIndex <= branch.bodyEndIndex) {
        const bodyExit = convertBlock(
          rows,
          branch.bodyStartIndex,
          branch.bodyEndIndex,
          incomingDecisionId,
          ctx,
          allowCollapse
        );
        const firstEdge = ctx.graph.edges.find((e) => e.from === incomingDecisionId && !e.label);
        if (firstEdge) firstEdge.label = 'No';
        branchExits.push(bodyExit);
      } else {
        branchExits.push(incomingDecisionId);
      }
      incomingDecisionId = '';
    }
  }

  // If there was no else branch, connect the final 'No' to the junction
  if (incomingDecisionId) {
    ctx.graph.edges.push({ from: incomingDecisionId, to: junctionId, label: 'No' });
  }

  // Connect all branch exits to the junction
  for (const exit of branchExits) {
    if (exit && !exit.includes('_ret_') && !exit.includes('_brk_')) {
      ctx.graph.edges.push({ from: exit, to: junctionId });
    }
  }

  return { exitNodeId: junctionId, nextIndex: curr };
}

function handleWhileLoop(
  rows: StatementExplanationRow[],
  whileIndex: number,
  prevNodeId: string,
  ctx: BuilderContext,
  allowCollapse: boolean
): { exitNodeId: string; nextIndex: number } {
  const whileRow = rows[whileIndex];
  const loopDepth = whileRow.depth;

  // Find loop body extent
  let curr = whileIndex + 1;
  while (curr < rows.length && rows[curr].depth > loopDepth) {
    curr++;
  }

  const condId = ctx.nextId('wh');
  const exitId = ctx.nextId('wh_exit');
  const condLabel = formatCondition(whileRow.rawCode, 'while');

  ctx.graph.nodes.push({
    id: condId,
    kind: 'decision',
    label: escapeMermaidLabel(condLabel, 36),
    fullText: whileRow.rawCode,
    startLine: whileRow.startLine,
    endLine: whileRow.endLine,
    tag: 'LOOP',
  });

  // Push the loop-exit node so it appears in the Mermaid node list
  ctx.graph.nodes.push({
    id: exitId,
    kind: 'process',
    label: '·',
    fullText: 'Loop exit',
    startLine: whileRow.endLine,
    endLine: whileRow.endLine,
  });

  ctx.graph.edges.push({ from: prevNodeId, to: condId });
  ctx.graph.edges.push({ from: condId, to: exitId, label: 'No / Done' });

  ctx.loopStack.push({ condId, exitId });

  if (whileIndex + 1 <= curr - 1) {
    const bodyExit = convertBlock(
      rows,
      whileIndex + 1,
      curr - 1,
      condId,
      ctx,
      allowCollapse
    );
    // Mark first edge as 'Yes'
    const firstEdge = ctx.graph.edges.find((e) => e.from === condId && e.to !== exitId && !e.label);
    if (firstEdge) firstEdge.label = 'Yes';

    // Loop back arrow
    if (bodyExit && !bodyExit.includes('_brk_') && !bodyExit.includes('_ret_')) {
      ctx.graph.edges.push({ from: bodyExit, to: condId, label: 'Loop back' });
    }
  }

  ctx.loopStack.pop();

  return { exitNodeId: exitId, nextIndex: curr };
}

function handleForLoop(
  rows: StatementExplanationRow[],
  forIndex: number,
  prevNodeId: string,
  ctx: BuilderContext,
  allowCollapse: boolean
): { exitNodeId: string; nextIndex: number } {
  const forRow = rows[forIndex];
  const loopDepth = forRow.depth;

  // Find loop body extent
  let curr = forIndex + 1;
  while (curr < rows.length && rows[curr].depth > loopDepth) {
    curr++;
  }

  const condId = ctx.nextId('for');
  const exitId = ctx.nextId('for_exit');
  const condLabel = formatForCondition(forRow.rawCode);

  ctx.graph.nodes.push({
    id: condId,
    kind: 'decision',
    label: escapeMermaidLabel(condLabel, 36),
    fullText: forRow.rawCode,
    startLine: forRow.startLine,
    endLine: forRow.endLine,
    tag: 'LOOP',
  });

  // Push the loop-exit node so it appears in the Mermaid node list
  ctx.graph.nodes.push({
    id: exitId,
    kind: 'process',
    label: '·',
    fullText: 'Loop exit',
    startLine: forRow.endLine,
    endLine: forRow.endLine,
  });

  ctx.graph.edges.push({ from: prevNodeId, to: condId });
  ctx.graph.edges.push({ from: condId, to: exitId, label: 'Done' });

  ctx.loopStack.push({ condId, exitId });

  if (forIndex + 1 <= curr - 1) {
    const bodyExit = convertBlock(
      rows,
      forIndex + 1,
      curr - 1,
      condId,
      ctx,
      allowCollapse
    );
    // Mark first edge as 'Next item' / 'Yes'
    const firstEdge = ctx.graph.edges.find((e) => e.from === condId && e.to !== exitId && !e.label);
    if (firstEdge) firstEdge.label = 'Next item';

    // Loop back arrow
    if (bodyExit && !bodyExit.includes('_brk_') && !bodyExit.includes('_ret_')) {
      ctx.graph.edges.push({ from: bodyExit, to: condId, label: 'Loop back' });
    }
  }

  ctx.loopStack.pop();

  return { exitNodeId: exitId, nextIndex: curr };
}

function handleTryExcept(
  rows: StatementExplanationRow[],
  tryIndex: number,
  prevNodeId: string,
  ctx: BuilderContext,
  allowCollapse: boolean
): { exitNodeId: string; nextIndex: number } {
  const tryRow = rows[tryIndex];
  const baseDepth = tryRow.depth;

  let curr = tryIndex + 1;
  let exceptIndex = -1;

  while (curr < rows.length) {
    const r = rows[curr];
    if (r.depth === baseDepth) {
      if (r.rawCode.trim().startsWith('except') || r.kind === 'except_clause') {
        exceptIndex = curr;
        curr++;
        continue;
      }
      break;
    } else if (r.depth < baseDepth) {
      break;
    }
    curr++;
  }

  const junctionId = ctx.nextId('try_exit');
  const errDecId = ctx.nextId('try_err');

  // Push junction node so it appears in the Mermaid node list
  ctx.graph.nodes.push({
    id: junctionId,
    kind: 'process',
    label: '·',
    fullText: 'After try/except',
    startLine: tryRow.startLine,
    endLine: tryRow.endLine,
  });

  // Try body
  const tryBodyEnd = exceptIndex !== -1 ? exceptIndex - 1 : curr - 1;
  const tryExit = convertBlock(rows, tryIndex + 1, tryBodyEnd, prevNodeId, ctx, allowCollapse);

  ctx.graph.nodes.push({
    id: errDecId,
    kind: 'decision',
    label: 'Error occurs?',
    fullText: 'Exception check for try block',
    startLine: tryRow.startLine,
    endLine: tryRow.endLine,
    tag: 'IF',
  });

  ctx.graph.edges.push({ from: tryExit, to: errDecId });
  ctx.graph.edges.push({ from: errDecId, to: junctionId, label: 'No' });

  // Except body
  if (exceptIndex !== -1) {
    const exceptRow = rows[exceptIndex];
    const exceptExit = convertBlock(
      rows,
      exceptIndex + 1,
      curr - 1,
      errDecId,
      ctx,
      allowCollapse
    );
    const firstExceptEdge = ctx.graph.edges.find((e) => e.from === errDecId && e.to !== junctionId);
    if (firstExceptEdge) firstExceptEdge.label = 'Yes';
    ctx.graph.edges.push({ from: exceptExit, to: junctionId });
  }

  return { exitNodeId: junctionId, nextIndex: curr };
}
