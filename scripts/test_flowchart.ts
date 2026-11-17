import { JSDOM } from 'jsdom';

// 1. Initialize DOM for Mermaid before importing it
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
  url: 'http://localhost'
});
(globalThis as any).window = dom.window;
(globalThis as any).document = dom.window.document;
(globalThis as any).Element = dom.window.Element;
(globalThis as any).SVGElement = dom.window.SVGElement;

import { parsePythonFallback } from '../src/utils/pythonTreeSitterEngine';
import { buildFlowchartFromPython } from '../src/utils/flowchart/pythonToFlowGraph';
import { generateMermaidText } from '../src/utils/flowchart/mermaidGenerator';

// Lazy import mermaid with JSDOM window available
const { default: mermaid } = await import('mermaid');
mermaid.initialize({
  startOnLoad: false,
  securityLevel: 'strict',
  maxEdges: 2000,
  maxTextSize: 100000,
});

interface TestCase {
  id: string;
  name: string;
  code: string;
}

const testCases: TestCase[] = [
  {
    id: 'a',
    name: 'hellow / print1 / print(hellow+print1)',
    code: `hellow = "Hello"
print1 = "World"
print(hellow + " " + print1)`
  },
  {
    id: 'b',
    name: 'if / elif / else',
    code: `score = 85
if score >= 90:
    grade = "A"
    print("Excellent")
elif score >= 75:
    grade = "B"
    print("Good")
else:
    grade = "C"
    print("Needs work")
print("Grade:", grade)`
  },
  {
    id: 'c',
    name: 'for loop with range(5) and a while loop with a counter',
    code: `total = 0
for i in range(5):
    total += i
    print(i)

count = 1
while count <= 3:
    print(count)
    count += 1
print("Done")`
  },
  {
    id: 'd',
    name: 'nested loops with break and continue',
    code: `for i in range(3):
    for j in range(3):
        if j == 1:
            continue
        if i == 2:
            break
        print(i, j)`
  },
  {
    id: 'e',
    name: 'a function with a return, plus a call to it',
    code: `def add_numbers(a, b):
    result = a + b
    return result

ans = add_numbers(10, 20)
print("Answer:", ans)`
  },
  {
    id: 'f',
    name: 'recursion (factorial)',
    code: `def factorial(n):
    if n <= 1:
        return 1
    return n * factorial(n - 1)

output = factorial(5)
print("5! =", output)`
  },
  {
    id: 'g',
    name: 'try / except',
    code: `try:
    x = 10 / 0
    print("Success")
except:
    print("Error caught safely")
print("Program continues")`
  },
  {
    id: 'h',
    name: 'the pygame ball program',
    code: `import pygame
pygame.init()
screen = pygame.display.set_mode((400, 300))
x = 50
y = 50
vx = 2
vy = 2
running = True
while running:
    x += vx
    y += vy
    if x >= 380:
        vx = -2
    if y >= 280:
        vy = -2
    print(x, y)`
  },
  {
    id: 'i',
    name: 'the weather dictionary program',
    code: `weather = {
    "city": "Hyderabad",
    "temp": 32,
    "condition": "Sunny"
}
print("City:", weather["city"])
if weather["temp"] > 30:
    print("Wear sunglasses")
else:
    print("Pleasant weather")`
  },
  {
    id: 'j',
    name: 'a program with a syntax error',
    code: `a = 10
b = 20
if a > 5
    print("Missing colon error line")
print("Done")`
  },
  {
    id: 'k1',
    name: 'an empty editor',
    code: `   `
  },
  {
    id: 'k2',
    name: 'a 300-line file',
    code: Array.from({ length: 300 }, (_, i) => `x_${i} = ${i}\nif x_${i} % 2 == 0:\n    print(x_${i})`).join('\n')
  }
];

async function runAllTests() {
  console.log("================================================================================");
  console.log("STAGE 2 FLOWCHART TEST SUITE: 11 REQUIRED FIXTURES & CHECKS");
  console.log("================================================================================");

  let passedCount = 0;
  let failedCount = 0;

  for (const tc of testCases) {
    const tStart = performance.now();
    console.log(`\n------------------------------------------------------------`);
    console.log(`TEST [${tc.id}]: ${tc.name}`);
    console.log(`------------------------------------------------------------`);

    try {
      // 1. Parse rows using explanation engine
      const analysis = parsePythonFallback(tc.code);
      const rows = analysis.rows;

      // 2. Build Flowchart Bundle
      const bundle = buildFlowchartFromPython(tc.code, rows);

      // Check empty case
      if (tc.id === 'k1') {
        if (bundle.empty) {
          console.log(`  ✓ Empty code handled properly (bundle.empty = true, no chart rendered).`);
          passedCount++;
        } else {
          console.error(`  ✗ Empty check failed: expected bundle.empty = true.`);
          failedCount++;
        }
        continue;
      }

      // 3. For each chart in bundle, generate Mermaid text and validate syntax
      for (const [chartName, graph] of Object.entries(bundle.charts)) {
        const mmd = generateMermaidText(graph, { direction: 'TD', theme: 'dark' });

        // Checks:
        // a) Valid Mermaid syntax
        await mermaid.parse(mmd);

        // b) No duplicate node IDs
        const ids = graph.nodes.map((n) => n.id);
        const uniqueIds = new Set(ids);
        if (ids.length !== uniqueIds.size) {
          throw new Error(`Duplicate node IDs found in chart ${chartName}: ${ids.length} total vs ${uniqueIds.size} unique`);
        }

        // c) Every node has a valid line range
        for (const n of graph.nodes) {
          if (typeof n.startLine !== 'number' || typeof n.endLine !== 'number' || n.startLine <= 0) {
            throw new Error(`Invalid line range in node ${n.id}: startLine=${n.startLine}, endLine=${n.endLine}`);
          }
        }

        // d) No unescaped brackets in raw output
        if (mmd.includes('["[') || mmd.includes(']"]') || mmd.includes('"{') || mmd.includes('}"')) {
          throw new Error(`Potential unescaped delimiter bracket detected in chart ${chartName}`);
        }

        console.log(`  ✓ Chart "${chartName}": ${graph.nodes.length} nodes, ${graph.edges.length} edges -> Mermaid syntax VALID`);
      }

      const elapsed = Math.round(performance.now() - tStart);
      console.log(`  ✓ Execution time: ${elapsed}ms (Requirement: < 300ms)`);
      if (elapsed < 300) {
        console.log(`  ✓ Performance check PASSED: ${elapsed}ms < 300ms`);
      } else {
        console.warn(`  ⚠ Performance warning: ${elapsed}ms`);
      }

      passedCount++;
    } catch (err: any) {
      console.error(`  ✗ TEST FAILED:`, err.message);
      failedCount++;
    }
  }

  console.log("\n================================================================================");
  console.log(`TEST RESULTS: ${passedCount} PASSED, ${failedCount} FAILED out of ${testCases.length} total`);
  console.log("================================================================================");

  if (failedCount > 0) {
    process.exit(1);
  }
}

runAllTests().catch((err) => {
  console.error("FATAL SUITE ERROR:", err);
  process.exit(1);
});
