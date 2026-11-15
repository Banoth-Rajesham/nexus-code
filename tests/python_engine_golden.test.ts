// ============================================================================
// NEXUS CODE - PYTHON ENGINE GOLDEN TEST SUITE
// 40+ Comprehensive Golden Test Programs covering every syntax construct.
// Validates: 0 crashes, 0 empty rows, 0 banned phrases, <100ms parse time,
// and strictly provable truth (LITERAL / KB only).
// ============================================================================

import { parsePythonWithTreeSitter } from '../src/utils/pythonTreeSitterEngine';

// Banned phrases per project rules
const BANNED_PATTERNS = [
  /executes instruction/i,
  /evaluate condition/i,
  /encapsulates/i,
  /orchestrat/i,
  /procedural/i,
  /retrieves and returns matching/i,
];

interface GoldenFixture {
  id: string;
  name: string;
  code: string;
  expectedMinStatements: number;
}

const GOLDEN_FIXTURES: GoldenFixture[] = [
  {
    id: '01_hello_world',
    name: 'Hello World',
    code: `print("Hello, Nexus Code!")`,
    expectedMinStatements: 1,
  },
  {
    id: '02_variables_arithmetic',
    name: 'Variables & Arithmetic',
    code: `width = 1920
height = 1080
area = width * height
print(area)`,
    expectedMinStatements: 4,
  },
  {
    id: '03_walrus_operator',
    name: 'Walrus Operator (:=)',
    code: `items = [1, 2, 3, 4, 5]
if (n := len(items)) > 3:
    print(n)`,
    expectedMinStatements: 3,
  },
  {
    id: '04_match_case',
    name: 'Match / Case (Python 3.10)',
    code: `status = 200
match status:
    case 200:
        print("OK")
    case 404:
        print("Not Found")
    case _:
        print("Other")`,
    expectedMinStatements: 5,
  },
  {
    id: '05_match_case_guard',
    name: 'Match / Case with Guard',
    code: `point = (10, 20)
match point:
    case (x, y) if x > y:
        print("X is greater")
    case (x, y):
        print("Y is greater or equal")`,
    expectedMinStatements: 4,
  },
  {
    id: '06_f_strings',
    name: 'Formatted F-Strings',
    code: `user = "Alice"
score = 98.654
msg = f"User {user} scored {score:.1f}%"
print(msg)`,
    expectedMinStatements: 4,
  },
  {
    id: '07_star_args_def',
    name: 'Star Variadic Parameters (*args, **kwargs)',
    code: `def log_events(category, *events, **metadata):
    print(category, events, metadata)`,
    expectedMinStatements: 2,
  },
  {
    id: '08_star_args_call',
    name: 'Star Variadic Call Unpacking',
    code: `def add(a, b, c):
    return a + b + c

nums = [1, 2, 3]
result = add(*nums)`,
    expectedMinStatements: 4,
  },
  {
    id: '09_keyword_only_separator',
    name: 'Keyword-Only Separator (*)',
    code: `def connect(host, port, *, timeout=30, retry=True):
    print(host, port, timeout)`,
    expectedMinStatements: 2,
  },
  {
    id: '10_positional_only_separator',
    name: 'Positional-Only Separator (/)',
    code: `def calculate(x, y, /, scale=1.0):
    return (x + y) * scale`,
    expectedMinStatements: 2,
  },
  {
    id: '11_slices',
    name: 'Slice Access [start:stop:step]',
    code: `numbers = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
evens = numbers[::2]
reversed_sub = numbers[5:1:-1]
print(evens, reversed_sub)`,
    expectedMinStatements: 4,
  },
  {
    id: '12_chained_comparisons',
    name: 'Chained Comparisons',
    code: `x = 15
if 10 < x <= 20:
    print("In range 10-20")`,
    expectedMinStatements: 3,
  },
  {
    id: '13_ternary_operator',
    name: 'Ternary Conditional Expression',
    code: `age = 21
status = "adult" if age >= 18 else "minor"
print(status)`,
    expectedMinStatements: 3,
  },
  {
    id: '14_list_comprehension',
    name: 'List Comprehension with Filter',
    code: `raw_numbers = [1, 2, 3, 4, 5, 6]
squares = [x ** 2 for x in raw_numbers if x % 2 == 0]
print(squares)`,
    expectedMinStatements: 3,
  },
  {
    id: '15_dict_comprehension',
    name: 'Dictionary Comprehension',
    code: `keys = ["a", "b", "c"]
values = [1, 2, 3]
mapping = {k: v * 10 for k, v in zip(keys, values)}
print(mapping)`,
    expectedMinStatements: 4,
  },
  {
    id: '16_set_comprehension',
    name: 'Set Comprehension',
    code: `words = ["apple", "banana", "APPLE", "cherry"]
unique_lower = {w.lower() for w in words}
print(unique_lower)`,
    expectedMinStatements: 3,
  },
  {
    id: '17_generator_expression',
    name: 'Generator Expression',
    code: `data = [10, 20, 30]
total = sum(x * 2 for x in data)
print(total)`,
    expectedMinStatements: 3,
  },
  {
    id: '18_generator_yield',
    name: 'Generators with Yield',
    code: `def count_up(limit):
    current = 1
    while current <= limit:
        yield current
        current += 1`,
    expectedMinStatements: 5,
  },
  {
    id: '19_yield_from',
    name: 'Yield From Delegation',
    code: `def stream_a():
    yield 1
    yield 2

def stream_both():
    yield from stream_a()
    yield 3`,
    expectedMinStatements: 5,
  },
  {
    id: '20_async_await',
    name: 'Async Def and Await',
    code: `async def fetch_user(uid):
    data = await fetch_remote_user(uid)
    return data`,
    expectedMinStatements: 3,
  },
  {
    id: '21_async_for',
    name: 'Async For Loop',
    code: `async def process_stream(reader):
    async for packet in reader:
        print(packet)`,
    expectedMinStatements: 3,
  },
  {
    id: '22_async_with',
    name: 'Async With Context Manager',
    code: `async def request(url):
    async with client_session.get(url) as response:
        return await response.text()`,
    expectedMinStatements: 3,
  },
  {
    id: '23_with_context_manager',
    name: 'With Statement Context Manager',
    code: `with open("input.txt", "r") as file:
    content = file.read()
    print(content)`,
    expectedMinStatements: 3,
  },
  {
    id: '24_multi_with_context',
    name: 'Multiple Context Managers in With',
    code: `with open("src.txt") as src, open("dst.txt", "w") as dst:
    data = src.read()
    dst.write(data)`,
    expectedMinStatements: 3,
  },
  {
    id: '25_decorators',
    name: 'Decorators (@property, @classmethod)',
    code: `class Rectangle:
    def __init__(self, w, h):
        self.w = w
        self.h = h

    @property
    def area(self):
        return self.w * self.h`,
    expectedMinStatements: 6,
  },
  {
    id: '26_dataclass',
    name: 'Dataclass Decorator',
    code: `from dataclasses import dataclass

@dataclass
class Vector2D:
    x: float
    y: float`,
    expectedMinStatements: 3,
  },
  {
    id: '27_global_nonlocal',
    name: 'Global and Nonlocal Declarations',
    code: `counter = 0

def outer():
    count = 0
    def inner():
        nonlocal count
        global counter
        count += 1
        counter += 1`,
    expectedMinStatements: 7,
  },
  {
    id: '28_type_annotations',
    name: 'Type Annotations',
    code: `name: str = "Alice"
age: int = 30
active: bool = True
scores: list[int] = [90, 95, 100]`,
    expectedMinStatements: 4,
  },
  {
    id: '29_type_alias',
    name: 'Type Alias Statement (Python 3.12+)',
    code: `type Matrix = list[list[float]]
type Coord = tuple[int, int]`,
    expectedMinStatements: 2,
  },
  {
    id: '30_union_types',
    name: 'Union Types (X | Y)',
    code: `def stringify(val: int | float | str) -> str:
    return str(val)`,
    expectedMinStatements: 2,
  },
  {
    id: '31_lambda',
    name: 'Lambda Functions',
    code: `multiply = lambda a, b: a * b
result = multiply(4, 5)
print(result)`,
    expectedMinStatements: 3,
  },
  {
    id: '32_try_except_else_finally',
    name: 'Try / Except / Else / Finally',
    code: `try:
    val = int("123")
except ValueError as err:
    print("Parsing failed", err)
else:
    print("Parsed successfully:", val)
finally:
    print("Done")`,
    expectedMinStatements: 6,
  },
  {
    id: '33_raise_from',
    name: 'Raise From Exception Chaining',
    code: `try:
    compute()
except KeyError as err:
    raise RuntimeError("Missing config") from err`,
    expectedMinStatements: 4,
  },
  {
    id: '34_assert_statement',
    name: 'Assert Statement',
    code: `def set_percentage(pct):
    assert 0 <= pct <= 100, "Percentage must be between 0 and 100"
    return pct`,
    expectedMinStatements: 3,
  },
  {
    id: '35_delete_statement',
    name: 'Delete Statement (del)',
    code: `cache = {"a": 1, "b": 2}
del cache["a"]
del cache`,
    expectedMinStatements: 3,
  },
  {
    id: '36_tuple_unpacking',
    name: 'Tuple Unpacking & Starred Targets',
    code: `a, b, c = 1, 2, 3
head, *tail = [10, 20, 30, 40]
print(head, tail)`,
    expectedMinStatements: 3,
  },
  {
    id: '37_augmented_assignments',
    name: 'All Augmented Assignments',
    code: `x = 100
x += 10
x -= 5
x *= 2
x /= 4
x //= 2
x %= 5
x **= 3`,
    expectedMinStatements: 8,
  },
  {
    id: '38_nested_functions',
    name: 'Nested Functions & Closures',
    code: `def make_multiplier(factor):
    def multiplier(number):
        return number * factor
    return multiplier

double = make_multiplier(2)`,
    expectedMinStatements: 5,
  },
  {
    id: '39_nested_classes',
    name: 'Nested Classes',
    code: `class UIComponent:
    class LayoutConfig:
        def __init__(self, pad):
            self.pad = pad
    def render(self):
        pass`,
    expectedMinStatements: 5,
  },
  {
    id: '40_recursion',
    name: 'Recursive Factorial',
    code: `def factorial(n):
    if n <= 1:
        return 1
    return n * factorial(n - 1)

print(factorial(5))`,
    expectedMinStatements: 5,
  },
  {
    id: '41_unknown_library_graceful',
    name: 'Graceful Unknown Library Degradation',
    code: `import quantum_exotic_toolkit

state = quantum_exotic_toolkit.create_qubit(0)
res = quantum_exotic_toolkit.measure(state)
print(res)`,
    expectedMinStatements: 4,
  },
  {
    id: '42_multiline_statement',
    name: 'Multi-Line Spanning Statement',
    code: `payload = {
    "status": 200,
    "users": [
        "Alice",
        "Bob",
        "Charlie"
    ],
    "active": True
}
print(payload)`,
    expectedMinStatements: 2,
  },
  {
    id: '43_pygame_bouncing_ball',
    name: 'Pygame Interactive Ball Simulation',
    code: `import pygame

pygame.init()
screen = pygame.display.set_mode((640, 480))
pygame.display.set_caption("Ball")
clock = pygame.time.Clock()

x, y = 320, 240
dx, dy = 3, 3
running = True

while running:
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False
    x += dx
    y += dy
    screen.fill((0, 0, 0))
    pygame.draw.circle(screen, (255, 0, 0), (x, y), 20)
    pygame.display.flip()
    clock.tick(60)

pygame.quit()`,
    expectedMinStatements: 18,
  },
];

async function runGoldenTests() {
  console.log('\n======================================================================');
  console.log('       NEXUS CODE - PYTHON ENGINE GOLDEN TEST SUITE (43 TESTS)        ');
  console.log('======================================================================\n');

  let passed = 0;
  let failed = 0;
  const failureDetails: string[] = [];

  for (let i = 0; i < GOLDEN_FIXTURES.length; i++) {
    const fixture = GOLDEN_FIXTURES[i];
    const tStart = performance.now();

    try {
      const res = await parsePythonWithTreeSitter(fixture.code);
      const tElapsed = performance.now() - tStart;

      // 1. Minimum statement count check
      if (res.rows.length < fixture.expectedMinStatements) {
        throw new Error(
          `Expected at least ${fixture.expectedMinStatements} rows, got ${res.rows.length}`
        );
      }

      // 2. Zero empty explanations
      for (const row of res.rows) {
        if (!row.explanation || row.explanation.trim().length === 0) {
          throw new Error(`Line ${row.startLine} has empty explanation`);
        }

        // 3. Provably true tag check: strictly LITERAL or KB (GUESS forbidden)
        if (row.sourceType !== 'LITERAL' && row.sourceType !== 'KB') {
          throw new Error(`Line ${row.startLine} has invalid sourceType: '${row.sourceType}'`);
        }

        // 4. Banned phrases check on row explanation
        for (const pattern of BANNED_PATTERNS) {
          if (pattern.test(row.explanation) || pattern.test(row.title)) {
            throw new Error(`Line ${row.startLine} matched banned pattern ${pattern}: "${row.explanation}"`);
          }
        }
      }

      // 5. Banned phrases check on program summary
      for (const pattern of BANNED_PATTERNS) {
        if (pattern.test(res.summary.title) || pattern.test(res.summary.description)) {
          throw new Error(`Summary matched banned pattern ${pattern}: "${res.summary.description}"`);
        }
      }

      // 6. Performance check (<100ms)
      if (tElapsed > 100) {
        throw new Error(`Parsing exceeded 100ms threshold: ${tElapsed.toFixed(2)}ms`);
      }

      passed++;
      console.log(
        `[PASS] #${String(i + 1).padStart(2)} ${fixture.name.padEnd(42)} | ` +
        `${res.rows.length} rows | ${tElapsed.toFixed(1)}ms`
      );
    } catch (err: any) {
      failed++;
      console.error(`[FAIL] #${String(i + 1).padStart(2)} ${fixture.name}: ${err.message}`);
      failureDetails.push(`${fixture.name}: ${err.message}`);
    }
  }

  console.log('\n----------------------------------------------------------------------');
  console.log(`Total Golden Fixtures: ${GOLDEN_FIXTURES.length}`);
  console.log(`Passed:                ${passed}`);
  console.log(`Failed:                ${failed}`);
  console.log('----------------------------------------------------------------------\n');

  if (failed > 0) {
    console.error('Failure summary:');
    failureDetails.forEach((f) => console.error('  - ' + f));
    process.exit(1);
  }

  console.log('SUCCESS: All 43 Golden Test Fixtures passed with 0 errors and 0 banned words!\n');
}

runGoldenTests().catch((err) => {
  console.error(err);
  process.exit(1);
});
