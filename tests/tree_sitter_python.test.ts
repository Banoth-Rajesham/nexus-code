// ============================================================================
// STAGE 1: PYTHON TREE-SITTER ENGINE TEST SUITE
// Automated verification for all 10 required fixtures with results table
// ============================================================================

import { parsePythonWithTreeSitter, StatementExplanationRow } from '../src/utils/pythonTreeSitterEngine';

interface TestResult {
  fixture: string;
  lines: number;
  statements: number;
  hasErrors: boolean;
  timeMs: number;
  status: 'PASS' | 'FAIL';
  notes: string;
}

const FIXTURES = {
  // 1. Hello World
  helloWorld: `print("Hello, World!")`,

  // 2. hellow = 22 / print1 = 23 / print(hellow+print1)
  hellowPrint: `hellow = 22
print1 = 23

# Compute sum
print(hellow + print1)`,

  // 3. Pygame Bouncing Ball
  pygameBouncingBall: `import pygame

pygame.init()
screen = pygame.display.set_mode((640, 480))
pygame.display.set_caption("Bouncing Ball")
clock = pygame.time.Clock()

x, y = 320, 240
dx, dy = 3, 3
radius = 20
running = True

while running:
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False
    x += dx
    y += dy
    if x - radius < 0 or x + radius > 640:
        dx = -dx
    if y - radius < 0 or y + radius > 480:
        dy = -dy
    screen.fill((0, 0, 0))
    pygame.draw.circle(screen, (255, 0, 0), (x, y), radius)
    pygame.display.flip()
    clock.tick(60)

pygame.quit()`,

  // 4. Class with Methods
  classWithMethods: `class BankAccount:
    def __init__(self, owner, balance=0):
        self.owner = owner
        self.balance = balance

    def deposit(self, amount):
        self.balance += amount
        return self.balance

    def withdraw(self, amount):
        if amount > self.balance:
            raise ValueError("Insufficient funds")
        self.balance -= amount
        return self.balance

account = BankAccount("Alice", 100)
account.deposit(50)
account.withdraw(30)`,

  // 5. Recursion
  recursion: `def factorial(n):
    if n <= 1:
        return 1
    return n * factorial(n - 1)

result = factorial(5)
print("Factorial:", result)`,

  // 6. List Comprehension
  listComprehension: `numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
evens = [x for x in numbers if x % 2 == 0]
squares = [x ** 2 for x in evens]
print("Squares:", squares)`,

  // 7. Try / Except
  tryExcept: `try:
    value = int("invalid_num")
    result = 100 / value
except ValueError as e:
    print("Caught value conversion error")
except ZeroDivisionError:
    print("Cannot divide by zero")
finally:
    print("Finished operation block")`,

  // 8. Nested Loops
  nestedLoops: `for i in range(1, 4):
    for j in range(1, 4):
        if i == j:
            continue
        product = i * j
        print(i, "times", j, "equals", product)`,

  // 9. Syntax Error
  syntaxError: `x = 10
if x > 5
    print("Missing colon")
y = 20
print(y + (2 * 3`,

  // 10. 300-Line File Generator
  large300LineFile: generateLargePythonFile(),
};

function generateLargePythonFile(): string {
  const parts: string[] = [
    `# 300-Line Comprehensive Python Program Benchmark`,
    `import math`,
    `import os`,
    `import time`,
    `import random`,
    ``,
    `class SimulationEntity:`,
    `    def __init__(self, entity_id, x=0, y=0):`,
    `        self.id = entity_id`,
    `        self.x = x`,
    `        self.y = y`,
    `        self.active = True`,
    ``,
    `    def move(self, dx, dy):`,
    `        self.x += dx`,
    `        self.y += dy`,
    `        return (self.x, self.y)`,
    ``,
    `    def distance_from_origin(self):`,
    `        return math.sqrt(self.x ** 2 + self.y ** 2)`,
    ``,
  ];

  // Generate 25 modular helper functions and loops to reach 300+ lines
  for (let k = 1; k <= 25; k++) {
    parts.push(`def compute_metric_${k}(param_a, param_b):`);
    parts.push(`    # Metric calculation block ${k}`);
    parts.push(`    val = param_a * ${k} + param_b`);
    parts.push(`    if val > 100:`);
    parts.push(`        val = val / 2`);
    parts.push(`    elif val < 0:`);
    parts.push(`        val = 0`);
    parts.push(`    else:`);
    parts.push(`        val += 5`);
    parts.push(`    return val`);
    parts.push(``);
  }

  parts.push(`entities = []`);
  parts.push(`for idx in range(50):`);
  parts.push(`    ent = SimulationEntity(idx, idx * 2, idx * 3)`);
  parts.push(`    entities.append(ent)`);
  parts.push(``);
  parts.push(`total_distance = 0`);
  parts.push(`for ent in entities:`);
  parts.push(`    total_distance += ent.distance_from_origin()`);
  parts.push(``);
  parts.push(`print("Total entities:", len(entities))`);
  parts.push(`print("Total simulated distance:", total_distance)`);

  return parts.join('\n');
}

async function runTests() {
  console.log('\n======================================================================');
  console.log('       NEXUS CODE - STAGE 1: PYTHON TREE-SITTER TEST RUNNER          ');
  console.log('======================================================================\n');

  const results: TestResult[] = [];

  for (const [key, code] of Object.entries(FIXTURES)) {
    const lineCount = code.split('\n').length;
    const t0 = performance.now();
    const result = await parsePythonWithTreeSitter(code);
    const duration = performance.now() - t0;

    let status: 'PASS' | 'FAIL' = 'PASS';
    const notes: string[] = [];

    // Validations
    if (!result.treeSitterAvailable) {
      status = 'FAIL';
      notes.push('Tree-sitter parser failed to load');
    }

    if (result.rows.length === 0) {
      status = 'FAIL';
      notes.push('0 rows generated');
    }

    // Check no generic banned phrases
    const hasGeneric = result.rows.some((r) =>
      r.explanation.includes('Executes instruction') ||
      r.explanation.includes('Evaluate condition')
    );
    if (hasGeneric) {
      status = 'FAIL';
      notes.push('Contains prohibited generic phrasing');
    }

    // Check syntax error fixture specifically detects errors
    if (key === 'syntaxError') {
      const errorRows = result.rows.filter((r) => r.tag === 'ERROR');
      if (errorRows.length === 0) {
        status = 'FAIL';
        notes.push('Expected syntax error row not detected');
      } else {
        notes.push(`Detected ${errorRows.length} syntax error(s) gracefully`);
      }
    }

    // Check 300 line performance
    if (key === 'large300LineFile') {
      if (duration > 100) {
        notes.push(`Duration (${duration.toFixed(1)}ms) exceeded 100ms budget`);
      } else {
        notes.push(`Processed ${lineCount} lines in ${duration.toFixed(1)}ms (<100ms)`);
      }
    }

    // Verify summary is populated
    if (!result.summary.title || !result.summary.description) {
      status = 'FAIL';
      notes.push('Summary card empty');
    }

    results.push({
      fixture: key,
      lines: lineCount,
      statements: result.rows.length,
      hasErrors: result.rows.some((r) => r.tag === 'ERROR'),
      timeMs: parseFloat(duration.toFixed(2)),
      status,
      notes: notes.join('; ') || 'OK',
    });
  }

  // Print results table
  console.log(
    '| #  | Fixture Name          | Lines | Statements | Errors | Time (ms) | Status | Notes'
  );
  console.log(
    '|----|-----------------------|-------|------------|--------|-----------|--------|----------------------------------------'
  );

  results.forEach((r, idx) => {
    const num = String(idx + 1).padEnd(2);
    const name = r.fixture.padEnd(21);
    const lines = String(r.lines).padStart(5);
    const stmts = String(r.statements).padStart(10);
    const errs = (r.hasErrors ? 'YES' : 'NO').padEnd(6);
    const time = `${r.timeMs.toFixed(1)}ms`.padStart(9);
    const st = r.status.padEnd(6);
    console.log(
      `| ${num} | ${name} | ${lines} | ${stmts} | ${errs} | ${time} | ${st} | ${r.notes}`
    );
  });

  console.log('\n----------------------------------------------------------------------');
  const allPassed = results.every((r) => r.status === 'PASS');
  console.log(`Total: ${results.length} | Passed: ${results.filter((r) => r.status === 'PASS').length} | Failed: ${results.filter((r) => r.status === 'FAIL').length}`);
  console.log(`Overall Result: ${allPassed ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'}`);
  console.log('----------------------------------------------------------------------\n');

  // Print detailed sample output for Pygame and Hellow/print1 fixtures
  console.log('--- SAMPLE OUTPUT: hellowPrint ---');
  const hpRes = await parsePythonWithTreeSitter(FIXTURES.hellowPrint);
  console.log(`Summary: [${hpRes.summary.title}] ${hpRes.summary.description}`);
  hpRes.rows.forEach((r) => {
    console.log(`  L${r.startLine}${r.endLine > r.startLine ? `-${r.endLine}` : ''} [${r.tag}] ${r.title}: ${r.explanation} (Code: ${r.rawCode})`);
  });

  console.log('\n--- SAMPLE OUTPUT: pygameBouncingBall (First 10 rows) ---');
  const pgRes = await parsePythonWithTreeSitter(FIXTURES.pygameBouncingBall);
  console.log(`Summary: [${pgRes.summary.title}] ${pgRes.summary.description}`);
  pgRes.rows.slice(0, 10).forEach((r) => {
    console.log(`  L${r.startLine} (depth ${r.depth}) [${r.tag}] ${r.title}: ${r.explanation}`);
  });

  if (!allPassed) {
    process.exit(1);
  }
}

runTests();
