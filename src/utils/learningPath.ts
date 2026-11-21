// ============================================================================
// Learning path: goal-based Python lessons, automatic checking, progress
// tracking and "Quiz me" questions generated from the explanation engine.
// Everything is deterministic and runs offline.
// ============================================================================

import type { ExperienceLevel } from './experienceLevel';

export type ConceptKey =
  | 'print'
  | 'variables'
  | 'input'
  | 'conditions'
  | 'loops'
  | 'lists'
  | 'functions'
  | 'dictionaries'
  | 'strings'
  | 'errors'
  | 'classes'
  | 'types'
  | 'tuples'
  | 'sets'
  | 'modules'
  | 'files'
  | 'recursion';

export interface Concept {
  key: ConceptKey;
  title: string;
  level: ExperienceLevel;
}

export const CONCEPTS: Concept[] = [
  { key: 'print', title: 'Printing output', level: 'beginner' },
  { key: 'variables', title: 'Variables & math', level: 'beginner' },
  { key: 'input', title: 'Reading input', level: 'beginner' },
  { key: 'conditions', title: 'If / else decisions', level: 'beginner' },
  { key: 'loops', title: 'Loops', level: 'beginner' },
  { key: 'lists', title: 'Lists', level: 'beginner' },
  { key: 'functions', title: 'Functions', level: 'beginner' },
  { key: 'strings', title: 'Working with text', level: 'beginner' },
  { key: 'dictionaries', title: 'Dictionaries', level: 'beginner' },
  { key: 'errors', title: 'Handling errors', level: 'beginner' },
  { key: 'classes', title: 'Classes & objects', level: 'senior' },
  { key: 'types', title: 'Basic data types', level: 'beginner' },
  { key: 'tuples', title: 'Tuples', level: 'beginner' },
  { key: 'sets', title: 'Sets', level: 'beginner' },
  { key: 'modules', title: 'Imports & modules', level: 'beginner' },
  { key: 'files', title: 'Reading & writing files', level: 'beginner' },
  { key: 'recursion', title: 'Recursion', level: 'senior' },
];

export interface LessonCheck {
  /** Every string must appear in the program output (whitespace-normalised) */
  outputIncludes?: string[];
  /** Output must equal these lines exactly (after trimming each line) */
  outputLines?: string[];
  /** Each pattern must match the code */
  codeMatches?: { pattern: RegExp; message: string }[];
  /** stdin lines fed to the program while checking */
  stdin?: string[];
}

export interface Lesson {
  id: string;
  concept: ConceptKey;
  level: ExperienceLevel;
  title: string;
  goal: string;
  starterCode: string;
  hint: string;
  check: LessonCheck;
}

export const LESSONS: Lesson[] = [
  // ── Beginner ──
  {
    id: 'hello_world',
    concept: 'print',
    level: 'beginner',
    title: 'Say hello',
    goal: 'Print exactly: Hello, World!',
    starterCode: '# Use print() to show a message on the screen\n\n',
    hint: 'Text goes inside quotes: print("Hello, World!")',
    check: {
      outputLines: ['Hello, World!'],
      codeMatches: [{ pattern: /print\s*\(/, message: 'Use the print() function.' }],
    },
  },
  {
    id: 'variables_sum',
    concept: 'variables',
    level: 'beginner',
    title: 'Store and add numbers',
    goal: 'Create variables a = 7 and b = 5, then print their sum (12).',
    starterCode: '# Create two variables and print their sum\na = 7\n\n',
    hint: 'Add b = 5 on a new line, then print(a + b).',
    check: {
      outputIncludes: ['12'],
      codeMatches: [
        { pattern: /\bb\s*=\s*5\b/, message: 'Create a variable b with the value 5.' },
        { pattern: /\ba\s*\+\s*b\b|\bb\s*\+\s*a\b/, message: 'Add the two variables with a + b.' },
      ],
    },
  },
  {
    id: 'basic_types',
    concept: 'types',
    level: 'beginner',
    title: "Identify basic types",
    goal: "Use type() to print the type names of a whole number, decimal, string, and Boolean, one per line.",
    starterCode: "values = [7, 2.5, \"Python\", True]\n\n",
    hint: "Use type(value).__name__ to get just the name.",
    check: {
      outputLines: ["int", "float", "str", "bool"],
      codeMatches: [{ pattern: /\btype\s*\(/, message: "Use type(value).__name__ to get just the name." }],
    },
  },
  {
    id: 'arithmetic_operators',
    concept: 'variables',
    level: 'beginner',
    title: "Divide and find the remainder",
    goal: "Use // and % to split 17 items into groups of 5. Print the number of full groups, then the remainder.",
    starterCode: "items = 17\nsize = 5\n\n",
    hint: "Use items // size for full groups and items % size for the remainder.",
    check: {
      outputLines: ["3", "2"],
      codeMatches: [{ pattern: /\/\/[^\n]+\n[\s\S]*%/, message: "Use items // size for full groups and items % size for the remainder." }],
    },
  },
  {
    id: 'greet_input',
    concept: 'input',
    level: 'beginner',
    title: 'Greet the user',
    goal: 'Ask for a name with input() and print "Hello, <name>!" (try typing Ravi).',
    starterCode: '# Ask the user for their name\nname = input("What is your name? ")\n\n',
    hint: 'Use an f-string: print(f"Hello, {name}!")',
    check: {
      stdin: ['Ravi'],
      outputIncludes: ['Hello,'],
      codeMatches: [
        { pattern: /input\s*\(/, message: 'Use input() to read the name.' },
        { pattern: /print\s*\([^\n]*\bname\b/, message: 'Print a greeting that uses the name variable.' },
      ],
    },
  },
  {
    id: 'convert_input',
    concept: 'input',
    level: 'beginner',
    title: "Convert typed input to a number",
    goal: "Read an age, add 1, and print the age next year. The Run button supplies 18.",
    starterCode: "age_text = input()\n\n",
    hint: "Convert with int(age_text) before adding 1.",
    check: {
      outputLines: ["19"],
      codeMatches: [{ pattern: /\bint\s*\(/, message: "Convert with int(age_text) before adding 1." }],
      stdin: ["18"],
    },
  },
  {
    id: 'slice_text',
    concept: 'strings',
    level: 'beginner',
    title: "Index and slice a string",
    goal: "Print the first letter of Python, then its first three letters, then the word in uppercase.",
    starterCode: "word = \"Python\"\n\n",
    hint: "Try word[0], word[:3], and word.upper().",
    check: {
      outputLines: ["P", "Pyt", "PYTHON"],
      codeMatches: [{ pattern: /\bword\s*\[:3\]/, message: "Try word[0], word[:3], and word.upper()." }],
    },
  },
  {
    id: 'even_odd',
    concept: 'conditions',
    level: 'beginner',
    title: 'Even or odd',
    goal: 'For number = 14, print "Even" if it divides by 2, otherwise print "Odd".',
    starterCode: 'number = 14\n\n# Use if / else and the % operator\n',
    hint: 'number % 2 == 0 is True for even numbers.',
    check: {
      outputLines: ['Even'],
      codeMatches: [
        { pattern: /\bif\b/, message: 'Use an if statement.' },
        { pattern: /\belse\b/, message: 'Use else for the odd case.' },
        { pattern: /%\s*2/, message: 'Use % 2 to check if the number is even.' },
      ],
    },
  },
  {
    id: 'elif_grades',
    concept: 'conditions',
    level: 'beginner',
    title: "Choose between three outcomes",
    goal: "Use if, elif, and else to print Distinction for scores of 90 or more, Pass for 50 or more, and Retry otherwise.",
    starterCode: "for score in [95, 72, 40]:\n    # Write your grade conditions here.\n    pass\n\n",
    hint: "Check score >= 90 first, then use elif score >= 50.",
    check: {
      outputLines: ["Distinction", "Pass", "Retry"],
      codeMatches: [{ pattern: /\belif\b/, message: "Check score >= 90 first, then use elif score >= 50." }],
    },
  },
  {
    id: 'boolean_logic',
    concept: 'conditions',
    level: 'beginner',
    title: "Combine conditions",
    goal: "Print whether an 18-year-old with a ticket can enter, then whether they can enter without a ticket. Use and.",
    starterCode: "age = 18\n\n",
    hint: "Combine age >= 18 with a Boolean that says whether the person has a ticket.",
    check: {
      outputLines: ["True", "False"],
      codeMatches: [{ pattern: /\band\b/, message: "Combine age >= 18 with a Boolean that says whether the person has a ticket." }],
    },
  },
  {
    id: 'count_to_ten',
    concept: 'loops',
    level: 'beginner',
    title: 'Count from 1 to 10',
    goal: 'Use a loop to print the numbers 1 to 10, one per line.',
    starterCode: '# Print the numbers 1 to 10 using a loop\n\n',
    hint: 'range(1, 11) gives 1, 2, ... 10. Write: for i in range(1, 11):',
    check: {
      outputLines: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
      codeMatches: [{ pattern: /\b(for|while)\b/, message: 'Use a for or while loop instead of 10 print() lines.' }],
    },
  },
  {
    id: 'while_countdown',
    concept: 'loops',
    level: 'beginner',
    title: "Count down with while",
    goal: "Use a while loop to print 3, 2, 1, then print Go! after the loop.",
    starterCode: "number = 3\n\n",
    hint: "Repeat while number > 0 and subtract 1 on each iteration.",
    check: {
      outputLines: ["3", "2", "1", "Go!"],
      codeMatches: [{ pattern: /\bwhile\s+/, message: "Repeat while number > 0 and subtract 1 on each iteration." }],
    },
  },
  {
    id: 'break_continue',
    concept: 'loops',
    level: 'beginner',
    title: "Skip and stop a loop",
    goal: "Loop through 1 to 9. Skip 2 with continue and stop at 5 with break. Print only the numbers you visit before stopping.",
    starterCode: "for number in range(1, 10):\n    # Add the conditions and print the remaining numbers.\n    pass\n\n",
    hint: "Check number == 2 and number == 5 before calling print().",
    check: {
      outputLines: ["1", "3", "4"],
      codeMatches: [{ pattern: /\bcontinue\b[\s\S]*\bbreak\b/, message: "Check number == 2 and number == 5 before calling print()." }],
    },
  },
  {
    id: 'edit_list',
    concept: 'lists',
    level: 'beginner',
    title: "Read and update a list",
    goal: "Append mango, replace apple with pear, and print the first item and the new list length, one per line.",
    starterCode: "fruits = [\"apple\", \"banana\"]\n\n",
    hint: "Use fruits.append(\"mango\"), fruits[0] = \"pear\", and len(fruits).",
    check: {
      outputLines: ["pear", "3"],
      codeMatches: [{ pattern: /\.append\s*\(/, message: "Use fruits.append(\"mango\"), fruits[0] = \"pear\", and len(fruits)." }],
    },
  },
  {
    id: 'list_total',
    concept: 'lists',
    level: 'beginner',
    title: 'Total of a list',
    goal: 'Add up marks = [72, 85, 90, 64] with a loop and print "Total: 311".',
    starterCode: 'marks = [72, 85, 90, 64]\ntotal = 0\n\n# Loop over the list and add each mark to total\n',
    hint: 'for m in marks: total = total + m  — then print(f"Total: {total}")',
    check: {
      outputIncludes: ['Total: 311'],
      codeMatches: [{ pattern: /\bfor\b/, message: 'Use a for loop to add the marks.' }],
    },
  },
  {
    id: 'unpack_tuple',
    concept: 'tuples',
    level: 'beginner',
    title: "Unpack a tuple",
    goal: "Unpack the pair into x and y, then print the coordinates on separate lines.",
    starterCode: "point = (4, 9)\n\n",
    hint: "Use x, y = point to assign both coordinates.",
    check: {
      outputLines: ["4", "9"],
      codeMatches: [{ pattern: /\bx\s*,\s*y\s*=\s*point\b/, message: "Use x, y = point to assign both coordinates." }],
    },
  },
  {
    id: 'unique_set',
    concept: 'sets',
    level: 'beginner',
    title: "Remove duplicates with a set",
    goal: "Use a set to find the number of distinct names, then print whether Maya is in the set.",
    starterCode: "names = [\"Maya\", \"Ravi\", \"Maya\", \"Leah\"]\n\n",
    hint: "Convert with set(names) and use len() and in on the set.",
    check: {
      outputLines: ["3", "True"],
      codeMatches: [{ pattern: /\bset\s*\(/, message: "Convert with set(names) and use len() and in on the set." }],
    },
  },
  {
    id: 'lookup_dictionary',
    concept: 'dictionaries',
    level: 'beginner',
    title: "Look up and update a dictionary",
    goal: "Add a math score of 90 and print it. Then use get() to print 0 for a missing science score.",
    starterCode: "scores = {\"english\": 75}\n\n",
    hint: "Assign scores[\"math\"] = 90 and use scores.get(\"science\", 0).",
    check: {
      outputLines: ["90", "0"],
      codeMatches: [{ pattern: /\.get\s*\(/, message: "Assign scores[\"math\"] = 90 and use scores.get(\"science\", 0)." }],
    },
  },
  {
    id: 'function_area',
    concept: 'functions',
    level: 'beginner',
    title: 'Write a function',
    goal: 'Write area(width, height) that returns width * height, then print area(4, 6) → 24.',
    starterCode: '# Define a function that returns the area of a rectangle\n\n',
    hint: 'def area(width, height):\n    return width * height',
    check: {
      outputIncludes: ['24'],
      codeMatches: [
        { pattern: /def\s+area\s*\(/, message: 'Define a function named area.' },
        { pattern: /\breturn\b/, message: 'Use return to send back the result.' },
      ],
    },
  },
  {
    id: 'import_math',
    concept: 'modules',
    level: 'beginner',
    title: "Import a standard library module",
    goal: "Import math and print the square root of 81 using math.sqrt().",
    starterCode: "# Add your code here.\n",
    hint: "Use import math, then print(math.sqrt(81)).",
    check: {
      outputLines: ["9.0"],
      codeMatches: [{ pattern: /\bimport\s+math\b/, message: "Use import math, then print(math.sqrt(81))." }],
    },
  },
  {
    id: 'read_write_file',
    concept: 'files',
    level: 'beginner',
    title: "Write and read a text file",
    goal: "Write hello to notes.txt, close it, then read it back and print the file contents.",
    starterCode: "filename = \"notes.txt\"\n\n",
    hint: "Use with open(filename, \"w\") to write and with open(filename) to read.",
    check: {
      outputLines: ["hello"],
      codeMatches: [{ pattern: /\.write\s*\([\s\S]*\.read\s*\(/, message: "Use with open(filename, \"w\") to write and with open(filename) to read." }],
    },
  },
  {
    id: 'catch_bad_input',
    concept: 'errors',
    level: 'beginner',
    title: "Handle invalid numeric input",
    goal: "Try converting the supplied word to an integer. Catch ValueError and print Please enter a number.",
    starterCode: "value = input()\n\n",
    hint: "Put int(value) inside try and catch it with except ValueError.",
    check: {
      outputLines: ["Please enter a number"],
      codeMatches: [{ pattern: /\bexcept\s+ValueError\s*:/, message: "Put int(value) inside try and catch it with except ValueError." }],
      stdin: ["oops"],
    },
  },
  // ── Intermediate ──
  {
    id: 'reverse_text',
    concept: 'strings',
    level: 'intermediate',
    title: 'Reverse a word',
    goal: 'Print the word "python" reversed: nohtyp',
    starterCode: 'word = "python"\n\n',
    hint: 'Slicing with a step of -1 reverses text: word[::-1]',
    check: { outputLines: ['nohtyp'] },
  },
  {
    id: 'word_count',
    concept: 'dictionaries',
    level: 'intermediate',
    title: 'Count fruits',
    goal: 'Count each fruit in the list using a dictionary, then print the dictionary.',
    starterCode: 'fruits = ["apple", "mango", "apple", "kiwi", "mango", "apple"]\ncounts = {}\n\n',
    hint: 'counts[f] = counts.get(f, 0) + 1 inside a for loop.',
    check: {
      outputIncludes: ["'apple': 3", "'mango': 2", "'kiwi': 1"],
      codeMatches: [{ pattern: /\bfor\b/, message: 'Use a for loop to count.' }],
    },
  },
  // ── Senior ──
  {
    id: 'safe_divide',
    concept: 'errors',
    level: 'senior',
    title: 'Handle a crash',
    goal: 'Make safe_divide(10, 0) print "Cannot divide by zero" instead of crashing.',
    starterCode: 'def safe_divide(a, b):\n    return a / b\n\nprint(safe_divide(10, 0))\n',
    hint: 'Wrap the division in try: ... except ZeroDivisionError: ...',
    check: {
      outputIncludes: ['Cannot divide by zero'],
      codeMatches: [{ pattern: /\btry\s*:/, message: 'Use try / except to catch the error.' }],
    },
  },
  {
    id: 'bank_account',
    concept: 'classes',
    level: 'senior',
    title: 'A bank account class',
    goal: 'Create BankAccount with deposit(amount) and a balance. Deposit 500 then 250 and print 750.',
    starterCode: 'class BankAccount:\n    def __init__(self):\n        self.balance = 0\n\n',
    hint: 'def deposit(self, amount): self.balance += amount',
    check: {
      outputIncludes: ['750'],
      codeMatches: [
        { pattern: /class\s+BankAccount/, message: 'Keep the BankAccount class.' },
        { pattern: /def\s+deposit\s*\(\s*self/, message: 'Add a deposit(self, amount) method.' },
      ],
    },
  },
  {
    id: 'factorial_recursion',
    concept: 'recursion',
    level: 'senior',
    title: 'Factorial with recursion',
    goal: 'Write factorial(n) that calls itself, and print factorial(5) → 120.',
    starterCode: 'def factorial(n):\n    # base case first\n    pass\n\nprint(factorial(5))\n',
    hint: 'if n <= 1: return 1  — otherwise return n * factorial(n - 1)',
    check: {
      outputIncludes: ['120'],
      codeMatches: [{ pattern: /return\s+n\s*\*\s*factorial\s*\(/, message: 'factorial should call itself: n * factorial(n - 1).' }],
    },
  },
];

export interface LessonResult {
  passed: boolean;
  problems: string[];
}

const normalise = (s: string) => s.replace(/\r/g, '').replace(/[ \t]+/g, ' ').trim();

/** Check a run against a lesson's goal. */
export function checkLesson(lesson: Lesson, code: string, output: string, runSucceeded: boolean): LessonResult {
  const problems: string[] = [];
  if (!runSucceeded) problems.push('The program stopped with an error. Fix it first, then run again.');

  for (const { pattern, message } of lesson.check.codeMatches || []) {
    if (!pattern.test(code)) problems.push(message);
  }

  const out = normalise(output);
  for (const expected of lesson.check.outputIncludes || []) {
    if (!out.includes(normalise(expected))) problems.push(`The output should include: ${expected}`);
  }

  if (lesson.check.outputLines) {
    const lines = output
      .replace(/\r/g, '')
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0 && !/^\(Program (executed|finished)/.test(l));
    const expected = lesson.check.outputLines;
    const matches = lines.length === expected.length && lines.every((l, i) => l === expected[i]);
    if (!matches) {
      problems.push(
        expected.length === 1
          ? `The output should be exactly: ${expected[0]}`
          : `The output should be ${expected.length} lines: ${expected.slice(0, 3).join(', ')}${expected.length > 3 ? ' …' : ''}`
      );
    }
  }

  return { passed: problems.length === 0, problems };
}

// ── Progress persistence ──────────────────────────────────────────────────────

const PROGRESS_KEY = 'nexus_lesson_progress';

export function loadCompletedLessons(): string[] {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

export function saveCompletedLessons(ids: string[]) {
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(Array.from(new Set(ids))));
  } catch {}
}

/** Concepts the student has mastered (every lesson in that concept completed). */
export function masteredConcepts(completed: string[]): Set<ConceptKey> {
  const done = new Set(completed);
  const result = new Set<ConceptKey>();
  for (const c of CONCEPTS) {
    const lessons = LESSONS.filter((l) => l.concept === c.key);
    if (lessons.length > 0 && lessons.every((l) => done.has(l.id))) result.add(c.key);
  }
  return result;
}

/** The next lesson the student should do. */
export function nextLesson(completed: string[]): Lesson | null {
  const done = new Set(completed);
  return LESSONS.find((l) => !done.has(l.id)) || null;
}

// ── Quiz generation ─────────────────────────────────────────────────────────

export interface QuizRow {
  startLine: number;
  rawCode: string;
  tag: string;
  explanation: string;
}

export interface QuizQuestion {
  line: number;
  code: string;
  options: string[];
  correctIndex: number;
}

/** Small seeded PRNG so a quiz is stable for the same code. */
function seededRandom(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function hashString(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * Build "What does this line do?" questions from explained rows.
 * Each question has the correct explanation plus two explanations of other lines.
 */
export function generateQuiz(rows: QuizRow[], maxQuestions = 3, seedText = ''): QuizQuestion[] {
  const usable = rows.filter(
    (r) => r.tag !== 'COMMENT' && r.explanation && r.explanation.trim().length > 8 && r.rawCode.trim().length > 0
  );
  const uniqueExplanations = Array.from(new Set(usable.map((r) => r.explanation.trim())));
  if (usable.length < 2 || uniqueExplanations.length < 3) return [];

  const rand = seededRandom(hashString(seedText || usable.map((r) => r.rawCode).join('|')));
  const shuffle = <T,>(arr: T[]) => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  // Prefer interesting statements over plain assignments
  const priority = (r: QuizRow) => (['LOOP', 'CONDITION', 'FUNCTION', 'RETURN', 'CLASS'].includes(r.tag) ? 0 : 1);
  const seen = new Set<string>();
  const candidates = shuffle(usable)
    .sort((a, b) => priority(a) - priority(b))
    .filter((r) => {
      const key = r.explanation.trim();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

  return candidates.slice(0, maxQuestions).map((row) => {
    const correct = row.explanation.trim();
    const distractors = shuffle(uniqueExplanations.filter((e) => e !== correct)).slice(0, 2);
    const options = shuffle([correct, ...distractors]);
    return {
      line: row.startLine,
      code: row.rawCode.split('\n')[0].trim(),
      options,
      correctIndex: options.indexOf(correct),
    };
  });
}
