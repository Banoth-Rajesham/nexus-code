import { generateDeepExplanation } from '../src/utils/deepExplanationAnalyzer';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion Failed: ${message}`);
  }
}

console.log('================================================================');
console.log('NEXUS CODE 4-LAYER DEEP EXPLANATION TEST SUITE');
console.log('================================================================\n');

let passedTests = 0;

function runTest(name: string, fn: () => void) {
  try {
    fn();
    console.log(`✅ PASS: ${name}`);
    passedTests++;
  } catch (err: any) {
    console.error(`❌ FAIL: ${name}`);
    console.error(`   Error: ${err.message}`);
    process.exit(1);
  }
}

// ─── SUITE 1: Simple Functions ──────────────────────────────────────────────
console.log('--- SUITE 1: Simple Functions ---');

runTest('Simple function: Extracts WHAT (name, params, returns, objective)', () => {
  const code = `def add(a: int, b: int) -> int:
    """Adds two integers and returns sum."""
    return a + b
`;
  const result = generateDeepExplanation(code, 'python');
  assert(result.what.components.length === 1, 'Should find 1 component');
  assert(result.what.components[0].name === 'add', 'Component name should be add');
  assert(result.what.components[0].params.length === 2, 'Should have 2 params');
  assert(result.what.components[0].params[0].name === 'a', 'First param is a');
  assert(result.what.components[0].params[1].name === 'b', 'Second param is b');
  assert(result.what.components[0].docstring?.includes('Adds two integers') || false, 'Docstring captured');
  assert(result.what.outputs.length >= 1, 'Should have at least 1 output');
  assert(result.verify.testCases.length >= 1, 'Should synthesize test cases');
});

// ─── SUITE 2: Nested Conditions & Defensive Guards ─────────────────────────
console.log('\n--- SUITE 2: Nested Conditions & Defensive Guards ---');

runTest('Nested conditions: Detects branching in HOW and guards in WHY', () => {
  const code = `def evaluate_score(score):
    if score >= 90:
        return "A"
    elif score >= 80:
        return "B"
    elif score >= 70:
        return "C"
    else:
        return "F"
`;
  const result = generateDeepExplanation(code, 'python');
  assert(result.what.components[0].returns.length === 4, 'Should detect 4 return paths');
  assert(result.how.flowNodes.some((n) => n.nodeType === 'decision'), 'Flow nodes contain decisions');
  assert(result.why.decisions.some((d) => d.category === 'Defensive Guard'), 'Captures conditional guard decisions');
});

// ─── SUITE 3: Loops & Algorithmic Complexity ────────────────────────────────
console.log('\n--- SUITE 3: Loops & Algorithmic Complexity ---');

runTest('Single loop: Classifies as O(N) time and O(1) space', () => {
  const code = `def find_max(numbers):
    current_max = numbers[0]
    for num in numbers:
        if num > current_max:
            current_max = num
    return current_max
`;
  const result = generateDeepExplanation(code, 'python');
  assert(result.verify.timeComplexity.notation === 'O(N)', 'Time complexity should be O(N)');
  assert(result.verify.spaceComplexity.notation === 'O(1)', 'Space complexity should be O(1)');
  assert(result.how.flowNodes.some((n) => n.nodeType === 'loop'), 'Detects loop node');
});

runTest('Nested loops: Classifies as O(N²) polynomial time', () => {
  const code = `def matrix_multiplication(A, B):
    result = []
    for i in range(len(A)):
        for j in range(len(B[0])):
            pass
    return result
`;
  const result = generateDeepExplanation(code, 'python');
  assert(result.verify.timeComplexity.notation === 'O(N²)', 'Time complexity should be O(N²)');
});

// ─── SUITE 4: Binary Search & Logarithmic Complexity ───────────────────────
console.log('\n--- SUITE 4: Binary Search & Logarithmic Complexity ---');

runTest('Binary search pattern: Detects O(log N) and Divide & Conquer in WHY', () => {
  const code = `def binary_search(arr, target):
    low = 0
    high = len(arr) - 1
    while low <= high:
        mid = (low + high) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            low = mid + 1
        else:
            high = mid - 1
    return -1
`;
  const result = generateDeepExplanation(code, 'python');
  assert(result.verify.timeComplexity.notation === 'O(log N)', 'Time complexity should be O(log N)');
  assert(result.why.decisions.some((d) => d.decision.includes('Binary Search')), 'Identifies binary search in WHY');
  assert(result.why.constraints.some((c) => c.includes('sorted')), 'States sorting constraint');
});

// ─── SUITE 5: Classes and Methods ──────────────────────────────────────────
console.log('\n--- SUITE 5: Classes and Methods ---');

runTest('Classes: Detects class blueprint and constructors', () => {
  const code = `class BankAccount:
    def __init__(self, owner, balance=0):
        self.owner = owner
        self.balance = balance

    def deposit(self, amount):
        self.balance += amount
        return self.balance
`;
  const result = generateDeepExplanation(code, 'python');
  assert(result.what.components.some((c) => c.kind === 'class'), 'Finds BankAccount class');
  assert(result.stats.classesCount >= 1, 'Stats include class');
});

// ─── SUITE 6: Imports & Dependencies ────────────────────────────────────────
console.log('\n--- SUITE 6: Imports & Dependencies ---');

runTest('Imports: Extracts external toolkits with designated purpose', () => {
  const code = `import os
import sys
import re
from pathlib import Path

def setup_env():
    path = os.getenv("APP_PATH")
    return path
`;
  const result = generateDeepExplanation(code, 'python');
  assert(result.what.externalDependencies.length >= 4, 'Extracts 4 external dependencies');
  assert(result.what.externalDependencies.some((d) => d.name === 'os'), 'Extracts os');
  assert(result.what.externalDependencies.some((d) => d.name === 're'), 'Extracts re');
});

// ─── SUITE 7: Weather Tool Example (User Prompt Code) ───────────────────────
console.log('\n--- SUITE 7: Weather Tool (User Sample Example) ---');

runTest('User sample code: Evaluates get_weather() dictionary lookup', () => {
  const code = `import os
from google import genai
from google.genai import types

# 1. Define tools (functions) the agent can use
def get_weather(city: str) -> str:
    """Returns the current weather for a given city."""
    # In a real app, you would call a weather API here
    mock_data = {
        "hyderabad": "30°C and partly cloudy",
        "london": "14°C and rainy",
        "tokyo": "19°C and clear",
    }
    return mock_data.get(city.lower(), f"Weather data unavailable for {city}.")
`;
  const result = generateDeepExplanation(code, 'python');
  assert(result.what.components[0].name === 'get_weather', 'Function name is get_weather');
  assert(result.what.components[0].params[0].name === 'city', 'Parameter is city');
  assert(result.why.decisions.some((d) => d.decision.includes('.get(')), 'Identifies defensive .get() fallback');
  assert(result.why.decisions.some((d) => d.decision.includes('Sanitization') || d.decision.includes('Normalization')), 'Identifies city.lower() normalization');
  assert(result.verify.testCases.some((t) => t.inputArgs.includes('london')), 'Synthesizes test case for london');
  assert(result.verify.testCases.some((t) => t.category === 'Edge Case'), 'Synthesizes edge cases');
  assert(result.verify.timeComplexity.notation === 'O(1)', 'O(1) hash map lookup time');
});

// ─── SUITE 8: Invalid Syntax & Edge Inputs ──────────────────────────────────
console.log('\n--- SUITE 8: Invalid Syntax & Edge Inputs ---');

runTest('Invalid syntax: Missing colon handled gracefully without crash', () => {
  const code = `def broken_func(x)
    return x * 2
`;
  const result = generateDeepExplanation(code, 'python');
  assert(result.hasSyntaxIssues === true, 'Flags syntax issue');
  assert(result.syntaxIssues !== undefined && result.syntaxIssues.length > 0, 'Lists syntax problem');
  assert(result.what.components.length === 1, 'Still extracts component despite syntax error');
});

runTest('Empty code string: Handled safely', () => {
  const result = generateDeepExplanation('', 'python');
  assert(result.what !== undefined, 'WHAT layer generated');
  assert(result.why !== undefined, 'WHY layer generated');
  assert(result.how !== undefined, 'HOW layer generated');
  assert(result.verify !== undefined, 'VERIFY layer generated');
  assert(result.stats.totalLines === 1, 'Empty lines counted');
});

console.log('\n================================================================');
console.log(`FINAL RESULT: ALL ${passedTests} DEEP EXPLANATION TESTS PASSED (100%)`);
console.log('================================================================');
