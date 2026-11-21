// ============================================================================
// LEARNING UX VERIFICATION SUITE
// Friendly errors, quick fixes, lesson checking, progress and quiz generation
// ============================================================================

import { explainRunError, applyQuickFix, suggestName } from '../src/utils/friendlyErrors';
import { LESSONS, checkLesson, masteredConcepts, nextLesson, generateQuiz, CONCEPTS } from '../src/utils/learningPath';
import { LEVEL_FEATURES } from '../src/utils/experienceLevel';

let pass = 0;
let total = 0;
function assert(cond: boolean, name: string, detail?: unknown) {
  total++;
  if (cond) {
    pass++;
    console.log(`✅ PASS: ${name}`);
  } else {
    console.log(`❌ FAIL: ${name}${detail !== undefined ? `\n   got: ${JSON.stringify(detail)}` : ''}`);
  }
}

// ── Friendly errors: Python (in-browser worker format) ──
const nameCode = 'total = 10\nprint(totl)\n';
let e = explainRunError('NameError: name \'totl\' is not defined (Line 2)', 'python', nameCode);
assert(e?.type === 'NameError' && e.line === 2, 'NameError parsed with line number', e);
assert(!!e?.hint.includes('"total"'), 'NameError suggests the closest existing name', e?.hint);
assert(e?.detail === "name 'totl' is not defined", 'worker "(Line N)" suffix stripped from detail', e?.detail);
assert(applyQuickFix(nameCode, e!) === 'total = 10\nprint(total)\n', 'rename quick fix applied on error line');

const colonCode = 'x = 3\nif x > 2\n    print(x)\n';
e = explainRunError("SyntaxError: expected ':' (<user_code>, line 2) (Line 2)", 'python', colonCode);
assert(e?.title === 'Missing colon' && e.line === 2, 'missing colon detected', e);
assert(applyQuickFix(colonCode, e!) === 'x = 3\nif x > 2:\n    print(x)\n', 'add-colon quick fix');

e = explainRunError('TypeError: can only concatenate str (not "int") to str (Line 1)', 'python', 'print("a" + 1)');
assert(!!e?.hint.includes('str('), 'str + int concatenation gets specific hint', e?.hint);

e = explainRunError("ValueError: invalid literal for int() with base 10: 'abc' (Line 1)", 'python', 'int("abc")');
assert(!!e?.meaning.includes('"abc"'), 'int() ValueError names the bad text', e?.meaning);

e = explainRunError('IndentationError: expected an indented block (Line 2)', 'python', 'if True:\nprint(1)');
assert(e?.quickFix?.kind === 'indent', 'IndentationError offers indent fix', e);

e = explainRunError('ZeroDivisionError: division by zero (Line 1)', 'python', 'print(1/0)');
assert(e?.title === 'Division by zero', 'ZeroDivisionError title');

// Server-style traceback
const tb = 'Traceback (most recent call last):\n  File "main.py", line 3, in <module>\n    print(items[5])\nIndexError: list index out of range';
e = explainRunError(tb, 'python', 'items = [1]\n\nprint(items[5])');
assert(e?.type === 'IndexError' && e.line === 3, 'server traceback parsed (type + line)', e);

e = explainRunError('[Execution Timed Out]: Python program exceeded the 10-second safety limit', 'python', 'while True: pass');
assert(e?.type === 'Timeout', 'timeout explained');

assert(explainRunError('Hello world', 'python', 'print("Hello world")') === null, 'normal output is not treated as an error');
e = explainRunError("Worker Error: Traceback...\nNameError: name 'sys' is not defined", 'python', 'print(1)');
assert(e?.type === 'EngineError' && !e.quickFix, 'runner failures are not blamed on the student code', e);

// ── Friendly errors: JavaScript ──
e = explainRunError('ReferenceError (Line 2): coutn is not defined', 'javascript', 'let count = 1;\nconsole.log(coutn);');
assert(e?.type === 'ReferenceError' && e.line === 2 && !!e.hint.includes('"count"'), 'JS ReferenceError with suggestion', e);
e = explainRunError("TypeError: Cannot read properties of undefined (reading 'x')", 'javascript', 'let a; a.x;');
assert(!!e?.hint.includes('?.'), 'JS undefined property access hint', e?.hint);

assert(suggestName('Print', 'x = 1') === 'print', 'case-only mismatch suggests builtin');
assert(suggestName('zzzzzz', 'x = 1') === null, 'no suggestion for unrelated name');

// ── Lessons: every reference solution passes, every starter fails ──
const SOLUTIONS: Record<string, { code: string; output: string }> = {
  hello_world: { code: 'print("Hello, World!")', output: 'Hello, World!' },
  variables_sum: { code: 'a = 7\nb = 5\nprint(a + b)', output: '12' },
  greet_input: { code: 'name = input("What is your name? ")\nprint(f"Hello, {name}!")', output: 'What is your name? Hello, Ravi!' },
  even_odd: { code: 'number = 14\nif number % 2 == 0:\n    print("Even")\nelse:\n    print("Odd")', output: 'Even' },
  count_to_ten: { code: 'for i in range(1, 11):\n    print(i)', output: '1\n2\n3\n4\n5\n6\n7\n8\n9\n10\n' },
  list_total: { code: 'marks = [72, 85, 90, 64]\ntotal = 0\nfor m in marks:\n    total += m\nprint(f"Total: {total}")', output: 'Total: 311' },
  function_area: { code: 'def area(width, height):\n    return width * height\nprint(area(4, 6))', output: '24' },
  reverse_text: { code: 'word = "python"\nprint(word[::-1])', output: 'nohtyp' },
  word_count: { code: 'fruits = ["apple"]\ncounts = {}\nfor f in fruits:\n    counts[f] = counts.get(f, 0) + 1\nprint(counts)', output: "{'apple': 3, 'mango': 2, 'kiwi': 1}" },
  safe_divide: { code: 'def safe_divide(a, b):\n    try:\n        return a / b\n    except ZeroDivisionError:\n        return "Cannot divide by zero"\nprint(safe_divide(10, 0))', output: 'Cannot divide by zero' },
  bank_account: { code: 'class BankAccount:\n    def __init__(self):\n        self.balance = 0\n    def deposit(self, amount):\n        self.balance += amount\nacc = BankAccount()\nacc.deposit(500)\nacc.deposit(250)\nprint(acc.balance)', output: '750' },
  factorial_recursion: { code: 'def factorial(n):\n    if n <= 1:\n        return 1\n    return n * factorial(n - 1)\nprint(factorial(5))', output: '120' },
  basic_types: { code: "values = [7, 2.5, \"Python\", True]\nprint(type(values[0]).__name__)\nprint(type(values[1]).__name__)\nprint(type(values[2]).__name__)\nprint(type(values[3]).__name__)", output: "int\nfloat\nstr\nbool" },
  arithmetic_operators: { code: "items = 17\nsize = 5\nprint(items // size)\nprint(items % size)", output: "3\n2" },
  convert_input: { code: "age_text = input()\nprint(int(age_text) + 1)", output: "19" },
  slice_text: { code: "word = \"Python\"\nprint(word[0])\nprint(word[:3])\nprint(word.upper())", output: "P\nPyt\nPYTHON" },
  elif_grades: { code: "for score in [95, 72, 40]:\n    if score >= 90:\n        print(\"Distinction\")\n    elif score >= 50:\n        print(\"Pass\")\n    else:\n        print(\"Retry\")", output: "Distinction\nPass\nRetry" },
  boolean_logic: { code: "age = 18\nprint(age >= 18 and True)\nprint(age >= 18 and False)", output: "True\nFalse" },
  while_countdown: { code: "number = 3\nwhile number > 0:\n    print(number)\n    number -= 1\nprint(\"Go!\")", output: "3\n2\n1\nGo!" },
  break_continue: { code: "for number in range(1, 10):\n    if number == 2:\n        continue\n    if number == 5:\n        break\n    print(number)", output: "1\n3\n4" },
  edit_list: { code: "fruits = [\"apple\", \"banana\"]\nfruits.append(\"mango\")\nfruits[0] = \"pear\"\nprint(fruits[0])\nprint(len(fruits))", output: "pear\n3" },
  unpack_tuple: { code: "point = (4, 9)\nx, y = point\nprint(x)\nprint(y)", output: "4\n9" },
  unique_set: { code: "names = [\"Maya\", \"Ravi\", \"Maya\", \"Leah\"]\nunique = set(names)\nprint(len(unique))\nprint(\"Maya\" in unique)", output: "3\nTrue" },
  lookup_dictionary: { code: "scores = {\"english\": 75}\nscores[\"math\"] = 90\nprint(scores[\"math\"])\nprint(scores.get(\"science\", 0))", output: "90\n0" },
  import_math: { code: "import math\nprint(math.sqrt(81))", output: "9.0" },
  read_write_file: { code: "filename = \"notes.txt\"\nwith open(filename, \"w\") as file:\n    file.write(\"hello\")\nwith open(filename) as file:\n    print(file.read())", output: "hello" },
  catch_bad_input: { code: "value = input()\ntry:\n    print(int(value))\nexcept ValueError:\n    print(\"Please enter a number\")", output: "Please enter a number" },
};
for (const lesson of LESSONS) {
  const sol = SOLUTIONS[lesson.id];
  assert(!!sol, `lesson ${lesson.id} has a reference solution in tests`);
  if (!sol) continue;
  const ok = checkLesson(lesson, sol.code, sol.output, true);
  assert(ok.passed, `lesson ${lesson.id}: correct solution passes`, ok.problems);
  const starter = checkLesson(lesson, lesson.starterCode, '', true);
  assert(!starter.passed, `lesson ${lesson.id}: untouched starter code does not pass`);
}
const crashed = checkLesson(LESSONS[0], 'print("Hello, World!")', 'Hello, World!', false);
assert(!crashed.passed, 'a run that errored never passes a lesson');
const loopCheat = checkLesson(LESSONS.find((l) => l.id === 'count_to_ten')!, 'print(1)\nprint(2)', '1\n2', true);
assert(!loopCheat.passed && loopCheat.problems.length >= 2, 'count lesson rejects wrong output and missing loop', loopCheat.problems);

// ── Progress ──
assert(nextLesson([])?.id === 'hello_world', 'first lesson is hello_world');
assert(masteredConcepts(['hello_world']).has('print'), 'completing the only print lesson masters "print"');
assert(!masteredConcepts([]).has('print'), 'nothing mastered initially');
assert(CONCEPTS.every((c) => LESSONS.some((l) => l.concept === c.key)), 'every concept has at least one lesson');

// ── Quiz ──
const rows = [
  { startLine: 1, rawCode: 'total = 0', tag: 'VARIABLE', explanation: 'Creates total and sets it to 0.' },
  { startLine: 2, rawCode: 'for n in nums:', tag: 'LOOP', explanation: 'Repeats the block below for each item in nums.' },
  { startLine: 3, rawCode: '    total += n', tag: 'VARIABLE', explanation: 'Adds n to total.' },
  { startLine: 4, rawCode: 'print(total)', tag: 'OUTPUT', explanation: 'Shows the value of total on the screen.' },
];
const quiz = generateQuiz(rows, 3);
assert(quiz.length === 3, 'quiz produces 3 questions', quiz.length);
assert(quiz.every((q) => q.options.length === 3 && new Set(q.options).size === 3), 'each question has 3 distinct options');
assert(quiz.every((q) => rows.find((r) => r.startLine === q.line)!.explanation === q.options[q.correctIndex]), 'correct option matches the line explanation');
assert(quiz[0].code === 'for n in nums:', 'loops are asked about first');
assert(JSON.stringify(generateQuiz(rows, 3)) === JSON.stringify(quiz), 'quiz is stable for the same code');
assert(generateQuiz(rows.slice(0, 2), 3).length === 0, 'no quiz when there are too few explanations');

// ── Levels ──
const ALL_MODES = ['aligned', 'blocks', 'code', 'flowchart', 'deep', 'variables', '3d'] as const;
assert(ALL_MODES.every((m) => LEVEL_FEATURES.senior.blueprintModes.includes(m)), 'senior level shows every blueprint mode');
assert(LEVEL_FEATURES.beginner.blueprintModes.includes('3d'), 'beginner level includes the 3D view');
assert(LEVEL_FEATURES.beginner.blueprintModes.includes('aligned'), 'beginner keeps the main line blueprint');

console.log('\n----------------------------------------------------------------------');
console.log(`Total: ${total} | Passed: ${pass} | Failed: ${total - pass}`);
if (pass !== total) process.exit(1);
console.log('Overall Result: ALL LEARNING UX TESTS PASSED');
