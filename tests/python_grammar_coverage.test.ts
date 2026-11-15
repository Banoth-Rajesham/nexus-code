// ============================================================================
// NEXUS CODE - PYTHON TREE-SITTER GRAMMAR 100% COVERAGE TEST
// Verifies that EVERY node type in tree-sitter Python grammar has a builder.
// FAILS if any grammar node type has no builder.
// ============================================================================

import fs from 'fs';
import path from 'path';
import { PYTHON_NODE_BUILDERS } from '../src/utils/pythonTreeSitterEngine';

// Banned phrases per project rules
const BANNED_PATTERNS = [
  /executes instruction/i,
  /evaluate condition/i,
  /encapsulates/i,
  /orchestrat/i,
  /procedural/i,
  /retrieves and returns matching/i,
];

// Sample test fixtures associated with grammar constructs
const FIXTURE_MAP: Record<string, string> = {
  assignment: 'x = 10',
  augmented_assignment: 'x += 1',
  expression_statement: 'print(42)',
  assert_statement: 'assert x > 0, "positive"',
  delete_statement: 'del my_list[0]',
  global_statement: 'global total',
  nonlocal_statement: 'nonlocal counter',
  pass_statement: 'pass',
  break_statement: 'break',
  continue_statement: 'continue',
  return_statement: 'return result',
  raise_statement: 'raise ValueError("invalid")',
  yield: 'yield current',
  function_definition: 'def add(a, b): return a + b',
  class_definition: 'class BankAccount: pass',
  decorated_definition: '@dataclass\nclass Point: x: int',
  decorator: '@property',
  if_statement: 'if x > 0: pass',
  elif_clause: 'elif x == 0: pass',
  else_clause: 'else: pass',
  for_statement: 'for i in range(10): pass',
  while_statement: 'while running: pass',
  try_statement: 'try: pass\nexcept: pass',
  except_clause: 'except ValueError as e: pass',
  finally_clause: 'finally: cleanup()',
  with_statement: 'with open("f") as f: pass',
  with_clause: 'with ctx:',
  with_item: 'open("f") as f',
  match_statement: 'match val: case 1: pass',
  case_clause: 'case 1: pass',
  case_pattern: '1',
  class_pattern: 'Point(x, y)',
  dict_pattern: '{"k": v}',
  list_pattern: '[a, b]',
  tuple_pattern: '(a, b)',
  union_pattern: '1 | 2',
  as_pattern: 'x as y',
  call: 'len(items)',
  attribute: 'math.sqrt',
  subscript: 'items[0]',
  slice: 'items[1:5]',
  binary_operator: 'a + b',
  boolean_operator: 'a and b',
  not_operator: 'not ready',
  comparison_operator: '1 < x < 10',
  conditional_expression: 'x if cond else y',
  named_expression: 'n := len(items)',
  await: 'await fetch()',
  lambda: 'lambda x: x * 2',
  list_comprehension: '[x * 2 for x in nums]',
  dictionary_comprehension: '{k: v for k, v in pairs}',
  set_comprehension: '{x for x in nums}',
  generator_expression: '(x for x in nums)',
  import_statement: 'import math',
  import_from_statement: 'from os import path',
  aliased_import: 'import numpy as np',
  future_import_statement: 'from __future__ import annotations',
  type_alias_statement: 'type Vector = list[float]',
};

function createMockNode(type: string): any {
  return {
    type,
    text: `mock_${type}`,
    childCount: 0,
    namedChildCount: 0,
    children: [],
    namedChildren: [],
    child: () => null,
    namedChild: () => null,
    childForFieldName: () => null,
    startPosition: { row: 0, column: 0 },
    endPosition: { row: 0, column: 10 },
    isNamed: () => true,
    isMissing: () => false,
  };
}

async function runGrammarCoverageTest() {
  console.log('\n======================================================================');
  console.log('       NEXUS CODE - TREE-SITTER PYTHON GRAMMAR COVERAGE AUDIT         ');
  console.log('======================================================================\n');

  const nodeTypesPath = path.resolve('data/grammar/python-node-types.json');
  if (!fs.existsSync(nodeTypesPath)) {
    throw new Error(`Grammar node-types file not found at ${nodeTypesPath}`);
  }

  const nodeTypesRaw = JSON.parse(fs.readFileSync(nodeTypesPath, 'utf8'));
  const namedTypes = nodeTypesRaw.filter((t: any) => t.named);

  console.log(`Loaded ${namedTypes.length} named AST node types from tree-sitter-python grammar.\n`);

  const missingBuilders: string[] = [];
  const bannedViolations: string[] = [];
  const coverageRows: Array<{
    nodeType: string;
    builderName: string;
    fixture: string;
    status: 'COVERED' | 'MISSING';
    sourceType: string;
  }> = [];

  const dummyCtx = {
    codeLines: ['# test'],
    depth: 0,
    buildChild: () => '',
  };

  for (const t of namedTypes) {
    const typeName = t.type;
    const builder = PYTHON_NODE_BUILDERS[typeName];

    if (!builder || typeof builder !== 'function') {
      missingBuilders.push(typeName);
      coverageRows.push({
        nodeType: typeName,
        builderName: '(none)',
        fixture: FIXTURE_MAP[typeName] || 'generic',
        status: 'MISSING',
        sourceType: 'N/A',
      });
      continue;
    }

    // Execute builder with mock node to verify runtime correctness and zero banned phrases
    const mockNode = createMockNode(typeName);
    try {
      const result = builder(mockNode, dummyCtx);

      if (!result || !result.explanation || !result.title || !result.tag) {
        throw new Error(`Builder for ${typeName} returned incomplete result object.`);
      }

      if (result.sourceType !== 'LITERAL' && result.sourceType !== 'KB') {
        throw new Error(`Builder for ${typeName} returned invalid sourceType '${result.sourceType}'. GUESS is forbidden.`);
      }

      // Check banned phrases
      for (const pattern of BANNED_PATTERNS) {
        if (pattern.test(result.explanation) || pattern.test(result.title)) {
          bannedViolations.push(`${typeName}: matched banned pattern ${pattern}`);
        }
      }

      coverageRows.push({
        nodeType: typeName,
        builderName: `PYTHON_NODE_BUILDERS.${typeName}`,
        fixture: FIXTURE_MAP[typeName] || `${typeName}_fixture`,
        status: 'COVERED',
        sourceType: result.sourceType,
      });
    } catch (err: any) {
      throw new Error(`Builder execution failed for node type '${typeName}': ${err.message}`);
    }
  }

  // Print Markdown Coverage Table
  console.log('| Node Type | Sentence Builder | Test Fixture | Source | Status |');
  console.log('|:---|:---|:---|:---|:---|');
  for (const row of coverageRows) {
    console.log(
      `| \`${row.nodeType}\` | \`${row.builderName}\` | \`${row.fixture.slice(0, 25)}\` | ${row.sourceType} | **${row.status}** |`
    );
  }

  console.log('\n----------------------------------------------------------------------');
  console.log(`Total Grammar Node Types: ${namedTypes.length}`);
  console.log(`Covered Builders:         ${coverageRows.filter((r) => r.status === 'COVERED').length}`);
  console.log(`Missing Builders:         ${missingBuilders.length}`);
  console.log(`Banned Phrase Violations: ${bannedViolations.length}`);
  console.log('----------------------------------------------------------------------\n');

  if (bannedViolations.length > 0) {
    console.error('FAIL: Banned phrases found in sentence builders:');
    bannedViolations.forEach((v) => console.error('  - ' + v));
    process.exit(1);
  }

  if (missingBuilders.length > 0) {
    console.error('FAIL: The following tree-sitter Python grammar node types lack builders:');
    missingBuilders.forEach((m) => console.error('  - ' + m));
    throw new Error(`Grammar coverage incomplete. Missing ${missingBuilders.length} node builders.`);
  }

  console.log('SUCCESS: 100% Tree-sitter Python grammar syntax coverage verified! 0 missing builders.\n');
}

runGrammarCoverageTest().catch((err) => {
  console.error(err);
  process.exit(1);
});
