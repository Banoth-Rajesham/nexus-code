import { buildFlowchartFromPython } from '../src/utils/flowchart/pythonToFlowGraph';
import { StatementExplanationRow } from '../src/utils/pythonTreeSitterEngine';

const code = `x = 1
if x > 0:
  y = 2
elif x == 0:
  y = 0
else:
  y = -1
print(y)`;

const rows: StatementExplanationRow[] = [
  { kind: 'assignment', tag: 'VARIABLE', rawCode: 'x = 1', startLine: 1, endLine: 1, depth: 0, explanation: '' },
  { kind: 'if_statement', tag: 'IF', rawCode: 'if x > 0:', startLine: 2, endLine: 2, depth: 0, explanation: '' },
  { kind: 'assignment', tag: 'VARIABLE', rawCode: 'y = 2', startLine: 3, endLine: 3, depth: 1, explanation: '' },
  { kind: 'elif_clause', tag: 'ELSE IF', rawCode: 'elif x == 0:', startLine: 4, endLine: 4, depth: 0, explanation: '' },
  { kind: 'assignment', tag: 'VARIABLE', rawCode: 'y = 0', startLine: 5, endLine: 5, depth: 1, explanation: '' },
  { kind: 'else_clause', tag: 'ELSE', rawCode: 'else:', startLine: 6, endLine: 6, depth: 0, explanation: '' },
  { kind: 'assignment', tag: 'VARIABLE', rawCode: 'y = -1', startLine: 7, endLine: 7, depth: 1, explanation: '' },
  { kind: 'expression_statement', tag: 'ACTION', rawCode: 'print(y)', startLine: 8, endLine: 8, depth: 0, explanation: '' },
];

const bundle = buildFlowchartFromPython(code, rows);
const chart = bundle.charts['Main'];

const nodeIds = new Set(chart.nodes.map(n => n.id));
console.log('All node IDs:', [...nodeIds]);
console.log('\nAll edges:');
chart.edges.forEach(e => console.log(`  ${e.from} -> ${e.to}${e.label ? ` [${e.label}]` : ''}`));

const juncNodes = chart.nodes.filter(n => n.id.includes('junc'));
console.log(`\nJunction nodes IN graph.nodes: ${juncNodes.length}`);
juncNodes.forEach(n => console.log(`  ${n.id}`));

const dangling = chart.edges.filter(e => !nodeIds.has(e.to));
console.log(`\nDangling edges (target NOT in nodes): ${dangling.length}`);
dangling.forEach(e => console.log(`  ${e.from} -> ${e.to}`));

if (dangling.length === 0) {
  console.log('\n✓ No dangling edges. Junction node bug is NOT present.');
} else {
  console.log('\n✗ BUG: Dangling edges found. Junction nodes not in graph.nodes!');
  process.exit(1);
}
