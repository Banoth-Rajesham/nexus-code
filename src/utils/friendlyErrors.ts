// ============================================================================
// Friendly error explanations
// Turns raw Python / JavaScript error output into a plain-English explanation,
// the line it happened on, a concrete hint and (when safe) a one-click fix.
// ============================================================================

export type QuickFixKind = 'indent' | 'add-colon' | 'rename';

export interface FriendlyError {
  /** Raw error class, e.g. "NameError" */
  type: string;
  /** Short human title, e.g. "Unknown name" */
  title: string;
  /** What went wrong, in plain words */
  meaning: string;
  /** What to try next */
  hint: string;
  /** 1-based line number in the user's file, when known */
  line: number | null;
  /** The original error message text */
  detail: string;
  /** Optional one-click fix */
  quickFix?: { kind: QuickFixKind; label: string; replacement?: { from: string; to: string } };
}

interface ErrorInfo {
  title: string;
  meaning: string;
  hint: string;
}

const PYTHON_ERRORS: Record<string, ErrorInfo> = {
  SyntaxError: {
    title: 'Python could not read this line',
    meaning: 'Something on this line breaks Python grammar rules, so the program could not start.',
    hint: 'Look for a missing colon (:) after if / for / while / def, an unclosed bracket, or a missing quote.',
  },
  IndentationError: {
    title: 'Spacing problem',
    meaning: 'Python uses spaces at the start of a line to know which block it belongs to. This line has the wrong number of spaces.',
    hint: 'Lines inside an if, loop or function should be indented 4 spaces more than the line above that ends with a colon.',
  },
  TabError: {
    title: 'Tabs and spaces mixed',
    meaning: 'This block mixes Tab characters and spaces, so Python cannot tell how deep the indentation is.',
    hint: 'Use only spaces (4 per level). Re-indent the block with spaces.',
  },
  NameError: {
    title: 'Unknown name',
    meaning: 'The program used a variable or function name that has not been created yet.',
    hint: 'Check the spelling (names are case-sensitive) and make sure the variable is given a value above this line.',
  },
  UnboundLocalError: {
    title: 'Variable used before it has a value',
    meaning: 'Inside this function the variable is read before it is assigned.',
    hint: 'Give the variable a value earlier in the function, or pass it in as a parameter.',
  },
  TypeError: {
    title: 'Wrong kind of value',
    meaning: 'An operation was used with a value of the wrong type, for example adding text to a number.',
    hint: 'Convert values first with int(), float() or str() so both sides are the same type.',
  },
  ValueError: {
    title: 'Right type, wrong value',
    meaning: 'A function got a value it cannot work with, for example int("hello").',
    hint: 'Check the input value. If it comes from input(), make sure the user typed what you expect.',
  },
  ZeroDivisionError: {
    title: 'Division by zero',
    meaning: 'The program tried to divide a number by 0, which has no answer.',
    hint: 'Check the number you divide by before dividing, e.g. if divisor != 0:',
  },
  IndexError: {
    title: 'Position does not exist',
    meaning: 'The program asked for a position in a list that is outside the list.',
    hint: 'Positions start at 0 and the last one is len(list) - 1. Check your loop range.',
  },
  KeyError: {
    title: 'Key not found',
    meaning: 'The program asked a dictionary for a key that is not in it.',
    hint: 'Check the spelling of the key, or use my_dict.get(key) / if key in my_dict: first.',
  },
  AttributeError: {
    title: 'No such method or property',
    meaning: 'The value does not have the method or property that the code tried to use.',
    hint: 'Check the spelling, and check what type the value actually is (print(type(x)) helps).',
  },
  ModuleNotFoundError: {
    title: 'Module not found',
    meaning: 'The import could not find that module.',
    hint: 'Check the module name. Your own files can be imported by name (e.g. import utils for utils.py).',
  },
  ImportError: {
    title: 'Import failed',
    meaning: 'The module was found, but the name you asked for is not inside it.',
    hint: 'Check the spelling of the name after "import".',
  },
  RecursionError: {
    title: 'Function called itself too many times',
    meaning: 'A recursive function kept calling itself and never stopped.',
    hint: 'Make sure the function has a base case that returns without calling itself again.',
  },
  FileNotFoundError: {
    title: 'File not found',
    meaning: 'The program tried to open a file that does not exist.',
    hint: 'Check the file name and that the file is part of your project.',
  },
  EOFError: {
    title: 'Input ran out',
    meaning: 'input() was called but there was no more input to read.',
    hint: 'Add the values your program needs in the Input (stdin) tab, one per line.',
  },
  KeyboardInterrupt: {
    title: 'Program stopped',
    meaning: 'The program was interrupted before it finished.',
    hint: 'Run it again. If it never finishes, look for a loop that never ends.',
  },
};

const JS_ERRORS: Record<string, ErrorInfo> = {
  ReferenceError: {
    title: 'Unknown name',
    meaning: 'The code used a variable or function that has not been declared.',
    hint: 'Check the spelling and declare it first with let, const or function.',
  },
  TypeError: {
    title: 'Wrong kind of value',
    meaning: 'A value was used in a way its type does not allow, e.g. calling something that is not a function or reading a property of undefined.',
    hint: 'Check that the value exists (is not undefined or null) and is the type you expect.',
  },
  SyntaxError: {
    title: 'JavaScript could not read the code',
    meaning: 'Something breaks JavaScript grammar rules, so the program could not start.',
    hint: 'Look for a missing bracket, brace, comma or quote near this line.',
  },
  RangeError: {
    title: 'Value out of range',
    meaning: 'A number was outside the allowed range, often caused by endless recursion.',
    hint: 'Check recursive functions for a base case, and check array sizes.',
  },
};

const TIMEOUT_INFO: ErrorInfo = {
  title: 'Program took too long',
  meaning: 'The program ran longer than the time limit, so it was stopped.',
  hint: 'This usually means a loop never ends. Check that the loop condition eventually becomes false (e.g. the counter increases).',
};

const BLOCK_KEYWORDS = /^\s*(if|elif|else|for|while|def|class|try|except|finally|with|match|case)\b/;

/** Levenshtein distance, small inputs only */
function editDistance(a: string, b: string): number {
  if (Math.abs(a.length - b.length) > 3) return 99;
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
  }
  return dp[a.length][b.length];
}

const PY_BUILTINS = ['print', 'input', 'len', 'range', 'int', 'str', 'float', 'list', 'dict', 'set', 'tuple', 'sum', 'min', 'max', 'abs', 'round', 'sorted', 'enumerate', 'zip', 'open', 'type', 'isinstance', 'True', 'False', 'None'];

/** Find the closest identifier in the code for a misspelt name */
export function suggestName(missing: string, code: string): string | null {
  const ids = new Set<string>(PY_BUILTINS);
  for (const m of code.matchAll(/\b[A-Za-z_][A-Za-z0-9_]*\b/g)) ids.add(m[0]);
  ids.delete(missing);
  let best: string | null = null;
  let bestScore = 99;
  for (const id of ids) {
    if (id.toLowerCase() === missing.toLowerCase()) return id;
    const d = editDistance(missing, id);
    const limit = missing.length <= 4 ? 1 : 2;
    if (d <= limit && d < bestScore) {
      best = id;
      bestScore = d;
    }
  }
  return best;
}

function lastMatch(text: string, re: RegExp): RegExpExecArray | null {
  const g = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
  let m: RegExpExecArray | null;
  let last: RegExpExecArray | null = null;
  while ((m = g.exec(text))) last = m;
  return last;
}

function explainPython(output: string, code: string): FriendlyError | null {
  const errLine = lastMatch(output, /^\s*([A-Z][A-Za-z]*(?:Error|Exception)|KeyboardInterrupt)(?::\s*(.*))?$/m);
  if (!errLine) return null;
  const type = errLine[1];
  // In-browser runner appends " (Line N)"; server tracebacks have File "...", line N frames.
  const workerLine = /\s*\(Line (\d+)\)\s*$/.exec(errLine[2] || '');
  const detail = (errLine[2] || '').replace(/\s*\(Line \d+\)\s*$/, '').trim();

  const frame = workerLine || lastMatch(output, /\bline (\d+)/i);
  let line = frame ? Number(frame[1]) : null;
  const codeLines = code.split('\n');
  if (line !== null && (line < 1 || line > codeLines.length)) line = null;

  const info = PYTHON_ERRORS[type] || {
    title: type.replace(/([a-z])([A-Z])/g, '$1 $2'),
    meaning: 'Python stopped because of an error while running this program.',
    hint: 'Read the message below and check the highlighted line.',
  };
  const result: FriendlyError = { type, ...info, line, detail };

  // ── Specific, more helpful messages ──
  if (type === 'NameError' || type === 'UnboundLocalError') {
    const nm = /name '([^']+)'/.exec(detail);
    if (nm) {
      result.meaning = `The name "${nm[1]}" is used here, but nothing called "${nm[1]}" has been created yet.`;
      const suggestion = suggestName(nm[1], code);
      if (suggestion) {
        result.hint = `Did you mean "${suggestion}"? Names must match exactly, including capital letters.`;
        result.quickFix = { kind: 'rename', label: `Change to "${suggestion}"`, replacement: { from: nm[1], to: suggestion } };
      }
    }
  } else if (type === 'TypeError') {
    const concat = /can only concatenate str \(not "(\w+)"\) to str/.exec(detail);
    const operand = /unsupported operand type\(s\) for (.+?): '(\w+)' and '(\w+)'/.exec(detail);
    const missingArg = /(\w+)\(\) missing (\d+) required positional argument/.exec(detail);
    const notCallable = /'(\w+)' object is not callable/.exec(detail);
    if (concat) {
      result.meaning = `You joined text with a ${concat[1]} using +. Python can only join text with text.`;
      result.hint = `Wrap the ${concat[1]} with str(), e.g. "Total: " + str(total), or use an f-string: f"Total: {total}".`;
    } else if (operand) {
      result.meaning = `The ${operand[1]} operator cannot work with a ${operand[2]} and a ${operand[3]} together.`;
      result.hint = 'Convert one side so both values are the same type (int(), float() or str()).';
    } else if (missingArg) {
      result.meaning = `The function ${missingArg[1]}() needs more values than were given when it was called.`;
      result.hint = `Check the function definition and pass all ${missingArg[2]} missing value(s) when you call it.`;
    } else if (notCallable) {
      result.meaning = `A ${notCallable[1]} value was used like a function (with brackets after it).`;
      result.hint = 'Check whether a variable has the same name as a function, or remove the brackets.';
    }
  } else if (type === 'ValueError') {
    const badInt = /invalid literal for int\(\) with base 10: '([^']*)'/.exec(detail);
    if (badInt) {
      result.meaning = `int() was asked to turn "${badInt[1]}" into a whole number, but it is not a number.`;
      result.hint = 'Make sure the text contains only digits. If it has a decimal point, use float() instead.';
    }
  } else if (type === 'SyntaxError') {
    const text = line ? codeLines[line - 1] : '';
    if (/never closed|was not closed/.test(detail)) {
      result.meaning = 'A bracket was opened but never closed.';
      result.hint = 'Add the matching ) ] or } at the end of the expression.';
    } else if (/unterminated string|EOL while scanning/.test(detail)) {
      result.meaning = 'A piece of text was started with a quote but never closed.';
      result.hint = 'Add the matching closing quote (" or \') at the end of the text.';
    } else if (/expected ':'/.test(detail) || (text && BLOCK_KEYWORDS.test(text) && !text.trimEnd().endsWith(':'))) {
      result.title = 'Missing colon';
      result.meaning = 'Lines that start a block (if, for, while, def, class…) must end with a colon.';
      result.hint = 'Add a colon (:) at the end of this line.';
      if (line && text && BLOCK_KEYWORDS.test(text) && !text.trimEnd().endsWith(':')) {
        result.quickFix = { kind: 'add-colon', label: 'Add the missing colon' };
      }
    } else if (/invalid syntax\. Maybe you meant '==' or ':='/.test(detail) || (text && /^\s*(if|elif|while)\b[^=!<>]*[^=!<>]=[^=]/.test(text))) {
      result.meaning = 'A single = was used to compare values. In Python, = stores a value and == compares.';
      result.hint = 'Use == when checking if two values are equal, e.g. if x == 5:';
    }
  } else if (type === 'IndentationError' || type === 'TabError') {
    if (/expected an indented block/.test(detail)) {
      result.meaning = 'The line above ends with a colon, so the next line must be indented to belong to that block.';
    } else if (/unexpected indent/.test(detail)) {
      result.meaning = 'This line is indented, but it is not inside any block that needs indentation.';
    } else if (/unindent does not match/.test(detail)) {
      result.meaning = 'This line is not lined up with any of the blocks above it.';
    }
    result.quickFix = { kind: 'indent', label: 'Fix indentation' };
  } else if (type === 'IndexError' && /out of range/.test(detail)) {
    result.meaning = 'The code asked for a position that is past the end of the list (or string).';
  } else if (type === 'ModuleNotFoundError') {
    const mod = /No module named '([^']+)'/.exec(detail);
    if (mod) result.meaning = `Python could not find a module named "${mod[1]}".`;
  }

  return result;
}

function explainJavaScript(output: string, code: string): FriendlyError | null {
  const m = lastMatch(output, /\b(ReferenceError|TypeError|SyntaxError|RangeError)(?:\s*\(Line (\d+)\))?:\s*(.*)$/m);
  if (!m) return null;
  const type = m[1];
  const detail = (m[3] || '').trim();
  let line: number | null = m[2] ? Number(m[2]) : null;
  if (line === null) {
    const loc = lastMatch(output, /\.(?:js|ts):(\d+)/);
    if (loc) line = Number(loc[1]);
  }
  if (line !== null && (line < 1 || line > code.split('\n').length)) line = null;

  const info = JS_ERRORS[type];
  const result: FriendlyError = { type, ...info, line, detail };
  if (type === 'ReferenceError') {
    const nm = /^(\S+) is not defined/.exec(detail);
    if (nm) {
      result.meaning = `"${nm[1]}" is used here, but it has not been declared.`;
      const suggestion = suggestName(nm[1], code);
      if (suggestion) {
        result.hint = `Did you mean "${suggestion}"? Names must match exactly, including capital letters.`;
        result.quickFix = { kind: 'rename', label: `Change to "${suggestion}"`, replacement: { from: nm[1], to: suggestion } };
      }
    }
  } else if (type === 'TypeError' && /Cannot read propert(y|ies) of (undefined|null)/.test(detail)) {
    result.meaning = 'The code tried to read a property from a value that is undefined or null.';
    result.hint = 'Check that the object exists before using it, or use optional chaining: obj?.property';
  } else if (type === 'TypeError' && /is not a function/.test(detail)) {
    result.meaning = 'Something that is not a function was called with brackets.';
    result.hint = 'Check the spelling of the function and that it is defined before it is called.';
  }
  return result;
}

/**
 * Explain a failed run. Returns null when the output does not look like an error
 * we can explain (the raw output is always still shown).
 */
export function explainRunError(output: string, language: string, code: string): FriendlyError | null {
  if (!output) return null;
  // The runner itself failed (not the student's code) — never blame their program for it
  if (/^\s*Worker Error:/.test(output)) {
    return {
      type: 'EngineError',
      title: 'The code runner had a problem',
      meaning: 'This error came from the in-browser runner, not from your program.',
      hint: 'Try running again. If it keeps happening, reload the page.',
      line: null,
      detail: output.split('\n')[0],
    };
  }
  if (/Timed Out|time limit|safety limit/i.test(output)) {
    return { type: 'Timeout', ...TIMEOUT_INFO, line: null, detail: output.split('\n')[0] };
  }
  const lang = language.toLowerCase();
  if (lang === 'python' || lang === 'py') return explainPython(output, code);
  if (lang === 'javascript' || lang === 'typescript' || lang === 'js' || lang === 'ts') return explainJavaScript(output, code);
  return explainPython(output, code) || explainJavaScript(output, code);
}

/** Apply a quick fix to the code. Indentation fixes are handled by the editor's own indent fixer. */
export function applyQuickFix(code: string, error: FriendlyError): string | null {
  if (!error.quickFix || error.line === null) return null;
  const lines = code.split('\n');
  const idx = error.line - 1;
  if (idx < 0 || idx >= lines.length) return null;
  if (error.quickFix.kind === 'add-colon') {
    lines[idx] = lines[idx].replace(/\s*$/, '') + ':';
    return lines.join('\n');
  }
  if (error.quickFix.kind === 'rename' && error.quickFix.replacement) {
    const { from, to } = error.quickFix.replacement;
    const re = new RegExp(`\\b${from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g');
    const updated = lines[idx].replace(re, to);
    if (updated === lines[idx]) return null;
    lines[idx] = updated;
    return lines.join('\n');
  }
  return null;
}
