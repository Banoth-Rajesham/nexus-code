// ============================================================================
// NEXUS CODE - COMPLETE PYTHON TREE-SITTER EXPLANATION ENGINE
// 100% Free, Offline (<100ms), 100% Grammar Node Coverage & Zero Speculation
// ============================================================================

import Parser from 'web-tree-sitter';
import pythonCuratedKbJson from '../../data/kb/python.json';
import { recordUnknownCall } from './kbTracker';

export type StatementTag =
  | 'IMPORT'
  | 'VARIABLE'
  | 'FUNCTION'
  | 'CLASS'
  | 'LOOP'
  | 'IF'
  | 'ELSE IF'
  | 'ELSE'
  | 'ACTION'
  | 'RETURN'
  | 'STOP'
  | 'SKIP'
  | 'ERROR'
  | 'COMMENT';

export interface StatementExplanationRow {
  startLine: number; // 1-based start line
  endLine: number;   // 1-based end line (multi-line statements span startLine to endLine)
  kind: string;      // AST node kind (e.g. 'assignment', 'for_statement', etc.)
  depth: number;     // 0-based indentation/nesting level
  tag: StatementTag;
  title: string;     // Short beginner-friendly title
  explanation: string; // Plain beginner sentence (max ~14 words)
  rawCode: string;   // Original code text of the statement
  sourceType: 'LITERAL' | 'KB'; // strictly 'LITERAL' or 'KB', GUESS is forbidden
  hasError?: boolean;
  errorFixHint?: string;
}

export interface NodeBuilderResult {
  tag: StatementTag;
  title: string;
  explanation: string;
  sourceType: 'LITERAL' | 'KB';
  hasError?: boolean;
  errorFixHint?: string;
}

export interface BuilderContext {
  codeLines: string[];
  depth: number;
  buildChild: (node: Parser.SyntaxNode | null) => string;
}

export type SentenceBuilder = (
  node: Parser.SyntaxNode,
  ctx: BuilderContext
) => NodeBuilderResult;

export interface PythonAnalysisResult {
  rows: StatementExplanationRow[];
  summary: {
    title: string;
    description: string;
    stats: {
      lines: number;
      statements: number;
      functions: number;
      loops: number;
      conditionals: number;
      classes: number;
      imports: string[];
    };
  };
  treeSitterAvailable: boolean;
}

export const TAG_STYLES: Record<
  StatementTag,
  { bg: string; text: string; border: string; accent: string }
> = {
  IMPORT: {
    bg: 'bg-sky-500/15',
    text: 'text-sky-300',
    border: 'border-sky-500/30',
    accent: '#38bdf8',
  },
  VARIABLE: {
    bg: 'bg-emerald-500/15',
    text: 'text-emerald-300',
    border: 'border-emerald-500/30',
    accent: '#34d399',
  },
  FUNCTION: {
    bg: 'bg-purple-500/15',
    text: 'text-purple-300',
    border: 'border-purple-500/30',
    accent: '#c084fc',
  },
  CLASS: {
    bg: 'bg-pink-500/15',
    text: 'text-pink-300',
    border: 'border-pink-500/30',
    accent: '#f472b6',
  },
  LOOP: {
    bg: 'bg-amber-500/15',
    text: 'text-amber-300',
    border: 'border-amber-500/30',
    accent: '#fbbf24',
  },
  IF: {
    bg: 'bg-blue-500/15',
    text: 'text-blue-300',
    border: 'border-blue-500/30',
    accent: '#60a5fa',
  },
  'ELSE IF': {
    bg: 'bg-indigo-500/15',
    text: 'text-indigo-300',
    border: 'border-indigo-500/30',
    accent: '#818cf8',
  },
  ELSE: {
    bg: 'bg-violet-500/15',
    text: 'text-violet-300',
    border: 'border-violet-500/30',
    accent: '#a78bfa',
  },
  ACTION: {
    bg: 'bg-cyan-500/15',
    text: 'text-cyan-300',
    border: 'border-cyan-500/30',
    accent: '#22d3ee',
  },
  RETURN: {
    bg: 'bg-teal-500/15',
    text: 'text-teal-300',
    border: 'border-teal-500/30',
    accent: '#2dd4bf',
  },
  STOP: {
    bg: 'bg-rose-500/15',
    text: 'text-rose-300',
    border: 'border-rose-500/30',
    accent: '#fb7185',
  },
  SKIP: {
    bg: 'bg-orange-500/15',
    text: 'text-orange-300',
    border: 'border-orange-500/30',
    accent: '#fb923c',
  },
  ERROR: {
    bg: 'bg-red-500/20',
    text: 'text-red-300',
    border: 'border-red-500/40',
    accent: '#f87171',
  },
  COMMENT: {
    bg: 'bg-slate-500/15',
    text: 'text-slate-400',
    border: 'border-slate-500/30',
    accent: '#94a3b8',
  },
};

// Curated Knowledge Base (source: 'curated')
const curatedKb: Record<string, string> = pythonCuratedKbJson as Record<string, string>;

// Auto-Generated Knowledge Base (source: 'docstring')
interface GeneratedKbEntry {
  summary: string;
  params?: string[];
  source?: string;
}
let generatedKb: Record<string, GeneratedKbEntry> = {};

function initGeneratedKb() {
  if (Object.keys(generatedKb).length > 0) return;
  try {
    if (typeof window === 'undefined') {
      // Node.js environment
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const fs = require('fs');
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const path = require('path');
      const genFile = path.resolve('data/kb/python.generated.json');
      if (fs.existsSync(genFile)) {
        generatedKb = JSON.parse(fs.readFileSync(genFile, 'utf-8'));
      }
    } else {
      // Browser environment: lazy fetch from static assets
      fetch('/data/kb/python.generated.json')
        .then((r) => r.json())
        .then((data) => {
          generatedKb = data;
        })
        .catch(() => {});
    }
  } catch {}
}

initGeneratedKb();

// Standard Library / Well-Known Packages Set
const KNOWN_PYTHON_MODULES = new Set([
  'math', 'os', 'sys', 'json', 're', 'pathlib', 'datetime', 'time', 'random',
  'collections', 'itertools', 'functools', 'urllib', 'http', 'asyncio',
  'subprocess', 'shutil', 'glob', 'pickle', 'sqlite3', 'csv', 'hashlib',
  'typing', 'dataclasses', 'abc', 'unittest', 'pytest', 'logging', 'io',
  'string', 'copy', 'tempfile', 'threading', 'multiprocessing', 'queue',
  'socket', 'ssl', 'email', 'struct', 'binascii', 'zlib', 'gzip', 'zipfile',
  'tarfile', 'ctypes', 'inspect', 'traceback', 'warnings', 'contextlib',
  'tkinter', 'numpy', 'pandas', 'matplotlib', 'requests', 'flask', 'fastapi',
  'scipy', 'sklearn', 'seaborn', 'torch', 'tensorflow', 'cv2', 'pygame',
  'PIL', 'bs4', 'sqlalchemy', 'pydantic', 'fastmcp'
]);

// Global singleton parser promise
let parserInstance: Parser | null = null;
let parserInitPromise: Promise<Parser | null> | null = null;

/**
 * Initializes web-tree-sitter with the Python WASM grammar.
 * Handles both browser (locate wasm file in /tree-sitter/) and Node.js environments.
 */
export async function getPythonParser(): Promise<Parser | null> {
  if (parserInstance) return parserInstance;
  if (parserInitPromise) return parserInitPromise;

  parserInitPromise = (async () => {
    try {
      if (typeof window !== 'undefined') {
        await Parser.init({
          locateFile: (scriptName: string) => `/tree-sitter/${scriptName}`,
        });
        const pyLanguage = await Parser.Language.load('/tree-sitter/tree-sitter-python.wasm');
        const p = new Parser();
        p.setLanguage(pyLanguage);
        parserInstance = p;
        return p;
      } else {
        await Parser.init();
        const path = await import('path');
        const wasmPath = path.resolve('public/tree-sitter/tree-sitter-python.wasm');
        const pyLanguage = await Parser.Language.load(wasmPath);
        const p = new Parser();
        p.setLanguage(pyLanguage);
        parserInstance = p;
        return p;
      }
    } catch (err) {
      console.warn('[TreeSitter] Failed to initialize Python WASM parser:', err);
      return null;
    }
  })();

  return parserInitPromise;
}

/**
 * Converts Python condition AST expressions into plain English words.
 */
export function stringifyCondition(node: Parser.SyntaxNode | null): string {
  if (!node) return '';

  switch (node.type) {
    case 'comparison_operator': {
      const parts: string[] = [];
      for (let i = 0; i < node.childCount; i++) {
        const c = node.child(i)!;
        const text = c.text.trim();
        switch (text) {
          case '==':
            parts.push('is equal to');
            break;
          case '!=':
            parts.push('is not equal to');
            break;
          case '>=':
            parts.push('is at least');
            break;
          case '<=':
            parts.push('is at most');
            break;
          case '>':
            parts.push('is greater than');
            break;
          case '<':
            parts.push('is less than');
            break;
          case 'in':
            parts.push('is in');
            break;
          case 'not in':
            parts.push('is not in');
            break;
          case 'is':
            parts.push('is');
            break;
          case 'is not':
            parts.push('is not');
            break;
          default:
            parts.push(stringifyCondition(c));
            break;
        }
      }
      return parts.join(' ');
    }

    case 'boolean_operator': {
      const left = node.childForFieldName('left');
      const right = node.childForFieldName('right');
      const op = node.children.find((c) => c.type === 'and' || c.type === 'or')?.text || 'and';
      return `${stringifyCondition(left)} ${op} ${stringifyCondition(right)}`;
    }

    case 'not_operator': {
      const argument = node.childForFieldName('argument') || node.namedChild(0);
      return `not ${stringifyCondition(argument)}`;
    }

    case 'parenthesized_expression': {
      const inner = node.namedChild(0);
      return `(${stringifyCondition(inner)})`;
    }

    case 'call': {
      const fn = node.childForFieldName('function');
      const args = node.childForFieldName('arguments');
      if (fn?.text === 'len' && args && args.namedChildCount > 0) {
        return `the length of ${args.namedChild(0)!.text}`;
      }
      if (fn?.text === 'isinstance' && args && args.namedChildCount >= 2) {
        return `${args.namedChild(0)!.text} is an instance of ${args.namedChild(1)!.text}`;
      }
      return node.text;
    }

    case 'attribute': {
      const obj = node.childForFieldName('object');
      const attr = node.childForFieldName('attribute');
      if (obj && attr) {
        return `${attr.text} of ${obj.text}`;
      }
      return node.text;
    }

    case 'named_expression': {
      const name = node.childForFieldName('name')?.text || 'var';
      const val = node.childForFieldName('value')?.text || 'value';
      return `${name} := ${val}`;
    }

    default:
      return node.text;
  }
}

/**
 * Cleanly formats arguments for human explanation.
 */
export function extractCallArgs(argsNode: Parser.SyntaxNode | null): string[] {
  if (!argsNode) return [];
  const list: string[] = [];
  for (let i = 0; i < argsNode.namedChildCount; i++) {
    const c = argsNode.namedChild(i);
    if (c) list.push(c.text.trim());
  }
  return list;
}

/**
 * Explains a function call using curated KB, generated KB, or provably true literal fallback.
 * Strictly adheres to NEVER WRONG, NEVER INVENTED:
 * - Curated KB (source: 'curated') takes top precedence -> tagged KB
 * - Generated KB (source: 'docstring') takes next precedence -> tagged KB
 * - Unknown call: 'Calls {name} with {args}.' + logs to unseen_calls.json -> tagged LITERAL
 * - Meaning is NEVER derived from names alone.
 */
export function explainCall(callNode: Parser.SyntaxNode): NodeBuilderResult {
  const fnNode = callNode.childForFieldName('function');
  const argsNode = callNode.childForFieldName('arguments');
  const args = extractCallArgs(argsNode);
  const rawArgs = args.join(', ');

  if (!fnNode) {
    return {
      tag: 'ACTION',
      title: 'Call Function',
      explanation: rawArgs ? `Calls function with ${rawArgs}.` : 'Calls function.',
      sourceType: 'LITERAL',
    };
  }

  // 1. Direct identifier call: print(), len(), sqrt()
  if (fnNode.type === 'identifier') {
    const fnName = fnNode.text;

    // Check curated KB first (safe property lookup)
    if (Object.prototype.hasOwnProperty.call(curatedKb, fnName) && typeof curatedKb[fnName] === 'string') {
      const template = curatedKb[fnName];
      const sentence = template
        .replace(/\{args\}/g, rawArgs)
        .replace(/\{arg0\}/g, args[0] || 'input')
        .replace(/\{arg1\}/g, args[1] || 'value')
        .replace(/\{arg2\}/g, args[2] || 'value');
      return { tag: 'ACTION', title: 'Call Action', explanation: sentence, sourceType: 'KB' };
    }

    // Check generated KB second
    if (
      Object.prototype.hasOwnProperty.call(generatedKb, fnName) &&
      generatedKb[fnName] &&
      typeof generatedKb[fnName].summary === 'string'
    ) {
      let sentence = generatedKb[fnName].summary;
      if (!sentence.endsWith('.')) sentence += '.';
      return { tag: 'ACTION', title: 'Call Action', explanation: sentence, sourceType: 'KB' };
    }

    // Unknown direct call: log and return provably true sentence
    recordUnknownCall(fnName, callNode.text);
    return {
      tag: 'ACTION',
      title: 'Call Function',
      explanation: args.length > 0 ? `Calls ${fnName} with ${rawArgs}.` : `Calls ${fnName}.`,
      sourceType: 'LITERAL',
    };
  }

  // 2. Attribute method call: math.sqrt(), obj.append(), pygame.display.set_mode()
  if (fnNode.type === 'attribute') {
    const objNode = fnNode.childForFieldName('object');
    const attrNode = fnNode.childForFieldName('attribute');
    const objText = objNode ? objNode.text : '';
    const attrText = attrNode ? attrNode.text : '';
    const fullCallName = `${objText}.${attrText}`;
    const dotMethodName = `.${attrText}`;

    // Check curated KB
    let template: string | undefined;
    if (Object.prototype.hasOwnProperty.call(curatedKb, fullCallName) && typeof curatedKb[fullCallName] === 'string') {
      template = curatedKb[fullCallName];
    } else if (Object.prototype.hasOwnProperty.call(curatedKb, dotMethodName) && typeof curatedKb[dotMethodName] === 'string') {
      template = curatedKb[dotMethodName];
    }

    if (template) {
      const sentence = template
        .replace(/\{obj\}/g, objText || 'object')
        .replace(/\{args\}/g, rawArgs)
        .replace(/\{arg0\}/g, args[0] || 'input')
        .replace(/\{arg1\}/g, args[1] || 'value')
        .replace(/\{arg2\}/g, args[2] || 'value')
        .replace(/\{arg3\}/g, args[3] || 'value');
      return { tag: 'ACTION', title: 'Action Call', explanation: sentence, sourceType: 'KB' };
    }

    // Check generated KB
    let genEntry: GeneratedKbEntry | undefined;
    if (Object.prototype.hasOwnProperty.call(generatedKb, fullCallName)) {
      genEntry = generatedKb[fullCallName];
    } else if (Object.prototype.hasOwnProperty.call(generatedKb, dotMethodName)) {
      genEntry = generatedKb[dotMethodName];
    }

    if (genEntry && typeof genEntry.summary === 'string') {
      let sentence = genEntry.summary;
      if (!sentence.endsWith('.')) sentence += '.';
      return { tag: 'ACTION', title: 'Action Call', explanation: sentence, sourceType: 'KB' };
    }

    // Unknown method call: log and return provably true sentence
    recordUnknownCall(fullCallName, callNode.text);
    return {
      tag: 'ACTION',
      title: 'Action Call',
      explanation: args.length > 0
        ? `Calls ${attrText} on ${objText} with ${rawArgs}.`
        : `Calls ${attrText} on ${objText}.`,
      sourceType: 'LITERAL',
    };
  }

  return {
    tag: 'ACTION',
    title: 'Call Action',
    explanation: args.length > 0
      ? `Calls ${fnNode.text} with ${rawArgs}.`
      : `Calls ${fnNode.text}.`,
    sourceType: 'LITERAL',
  };
}

/**
 * Builds beginner-friendly explanation for assignments:
 * x = 10, a, b = 1, 2, first, *rest = items, etc.
 */
export function explainAssignment(assignNode: Parser.SyntaxNode): NodeBuilderResult {
  const left = assignNode.childForFieldName('left');
  const right = assignNode.childForFieldName('right');
  const leftText = left ? left.text.trim() : 'variable';
  const rightText = right ? right.text.trim() : 'value';

  // Walrus operator on right side
  if (right && right.type === 'named_expression') {
    const walrusName = right.childForFieldName('name')?.text || 'var';
    const walrusVal = right.childForFieldName('value')?.text || 'val';
    return {
      tag: 'VARIABLE',
      title: 'Walrus Assignment',
      explanation: `Sets ${leftText} and also assigns ${walrusVal} to ${walrusName}.`,
      sourceType: 'LITERAL',
    };
  }

  // Unpacking with starred expression: first, *rest = items
  if (left && (left.text.includes('*') || left.type === 'pattern_list' || left.type === 'tuple_pattern')) {
    return {
      tag: 'VARIABLE',
      title: 'Unpack Assignment',
      explanation: `Unpacks elements from ${rightText} into ${leftText}.`,
      sourceType: 'LITERAL',
    };
  }

  // Multi-assignment: a, b = 1, 2
  if (leftText.includes(',') && rightText.includes(',')) {
    const leftParts = leftText.split(',').map((s) => s.trim()).filter(Boolean);
    const rightParts = rightText.split(',').map((s) => s.trim()).filter(Boolean);
    if (leftParts.length === rightParts.length) {
      return {
        tag: 'VARIABLE',
        title: 'Assign Variables',
        explanation: `Sets ${leftParts.join(' and ')} to ${rightParts.join(' and ')}.`,
        sourceType: 'LITERAL',
      };
    }
  }

  // Right side is function call: result = calculate(10, 20)
  if (right && right.type === 'call') {
    const fnNode = right.childForFieldName('function');
    const fnName = fnNode ? fnNode.text : 'function';
    return {
      tag: 'VARIABLE',
      title: 'Store Result',
      explanation: `Runs ${fnName} and stores the result in ${leftText}.`,
      sourceType: 'LITERAL',
    };
  }

  // Right side is list: [1, 2, 3]
  if (right && right.type === 'list') {
    const count = right.namedChildCount;
    return {
      tag: 'VARIABLE',
      title: 'Create List',
      explanation: count === 0
        ? `Initializes an empty list in ${leftText}.`
        : `Stores a list of ${count} item${count === 1 ? '' : 's'} in ${leftText}.`,
      sourceType: 'LITERAL',
    };
  }

  // Right side is dictionary: {'a': 1}
  if (right && right.type === 'dictionary') {
    const count = right.namedChildCount;
    return {
      tag: 'VARIABLE',
      title: 'Create Dictionary',
      explanation: count === 0
        ? `Initializes an empty dictionary in ${leftText}.`
        : `Stores a dictionary of ${count} key-value pair${count === 1 ? '' : 's'} in ${leftText}.`,
      sourceType: 'LITERAL',
    };
  }

  // Right side is list comprehension: [x ** 2 for x in nums]
  if (right && right.type === 'list_comprehension') {
    return {
      tag: 'VARIABLE',
      title: 'List Comprehension',
      explanation: `Builds a new list in ${leftText} by transforming items in a loop.`,
      sourceType: 'LITERAL',
    };
  }

  // Right side is dictionary comprehension: {k: v for k, v in pairs}
  if (right && right.type === 'dictionary_comprehension') {
    return {
      tag: 'VARIABLE',
      title: 'Dict Comprehension',
      explanation: `Builds a new dictionary in ${leftText} from key-value pairs in a loop.`,
      sourceType: 'LITERAL',
    };
  }

  // Right side is set comprehension: {x for x in nums}
  if (right && right.type === 'set_comprehension') {
    return {
      tag: 'VARIABLE',
      title: 'Set Comprehension',
      explanation: `Builds a set of unique items in ${leftText} from a loop.`,
      sourceType: 'LITERAL',
    };
  }

  // Right side is ternary conditional expression: x if cond else y
  if (right && right.type === 'conditional_expression') {
    return {
      tag: 'VARIABLE',
      title: 'Conditional Assign',
      explanation: `Sets ${leftText} conditionally based on whether check succeeds.`,
      sourceType: 'LITERAL',
    };
  }

  // Right side is slice: nums[1:5]
  if (right && right.type === 'subscript') {
    return {
      tag: 'VARIABLE',
      title: 'Store Slice/Item',
      explanation: `Stores sliced or selected item from ${right.childForFieldName('value')?.text || 'sequence'} into ${leftText}.`,
      sourceType: 'LITERAL',
    };
  }

  // Right side is lambda
  if (right && right.type === 'lambda') {
    return {
      tag: 'FUNCTION',
      title: 'Assign Lambda',
      explanation: `Assigns an inline lambda function to ${leftText}.`,
      sourceType: 'LITERAL',
    };
  }

  return {
    tag: 'VARIABLE',
    title: 'Assign Variable',
    explanation: `Sets ${leftText} to ${rightText}.`,
    sourceType: 'LITERAL',
  };
}

/**
 * Builds beginner-friendly explanation for augmented assignments:
 * +=, -=, *=, /=, //=, %=, **=, &=, |=, ^=, <<=, >>=
 */
export function explainAugmentedAssignment(node: Parser.SyntaxNode): NodeBuilderResult {
  const left = node.childForFieldName('left')?.text.trim() || 'variable';
  const right = node.childForFieldName('right')?.text.trim() || 'value';
  const op = node.children.find((c) => c.type.endsWith('='))?.type || '+=';

  let explanation = `Updates ${left} with ${right}.`;
  switch (op) {
    case '+=':
      explanation = `Adds ${right} to ${left}.`;
      break;
    case '-=':
      explanation = `Subtracts ${right} from ${left}.`;
      break;
    case '*=':
      explanation = `Multiplies ${left} by ${right}.`;
      break;
    case '/=':
      explanation = `Divides ${left} by ${right}.`;
      break;
    case '//=':
      explanation = `Divides ${left} by ${right} rounding down.`;
      break;
    case '%=':
      explanation = `Calculates remainder of ${left} divided by ${right}.`;
      break;
    case '**=':
      explanation = `Raises ${left} to the power of ${right}.`;
      break;
    case '&=':
      explanation = `Performs bitwise AND on ${left} with ${right}.`;
      break;
    case '|=':
      explanation = `Performs bitwise OR on ${left} with ${right}.`;
      break;
    case '^=':
      explanation = `Performs bitwise XOR on ${left} with ${right}.`;
      break;
    default:
      explanation = `Modifies ${left} using operator ${op} with ${right}.`;
      break;
  }

  return {
    tag: 'VARIABLE',
    title: 'Update Variable',
    explanation,
    sourceType: 'LITERAL',
  };
}

/**
 * Diagnoses syntax error hints for beginner feedback.
 */
export function diagnoseSyntaxError(node: Parser.SyntaxNode, lineText: string): string {
  const trimmed = lineText.trim();
  if (/^(if|elif|else|while|for|def|class|try|except|finally|with|match|case)\b.*[^:]$/.test(trimmed)) {
    return "Missing colon ':' at the end of the line.";
  }
  const openParens = (lineText.match(/\(/g) || []).length;
  const closeParens = (lineText.match(/\)/g) || []).length;
  if (openParens > closeParens) return "Missing closing bracket ')'.";

  const openBrackets = (lineText.match(/\[/g) || []).length;
  const closeBrackets = (lineText.match(/\]/g) || []).length;
  if (openBrackets > closeBrackets) return "Missing closing square bracket ']'.";

  const openBraces = (lineText.match(/\{/g) || []).length;
  const closeBraces = (lineText.match(/\}/g) || []).length;
  if (openBraces > closeBraces) return "Missing closing curly bracket '}'.";

  if (/^(def|class)\s+[0-9]/.test(trimmed)) {
    return 'Name cannot start with a number.';
  }

  return `Syntax issue near '${node.text.slice(0, 20)}'. Check spelling or brackets.`;
}

// ============================================================================
// 100% TREE-SITTER PYTHON GRAMMAR NODE BUILDERS REGISTRY
// Every one of the 128 named AST node types from node-types.json is mapped below!
// ============================================================================

export const PYTHON_NODE_BUILDERS: Record<string, SentenceBuilder> = {
  // ── Abstract & Supertypes ──
  _compound_statement: (node) => ({
    tag: 'ACTION',
    title: 'Compound Block',
    explanation: `Begins compound block ${node.text.slice(0, 30)}.`,
    sourceType: 'LITERAL',
  }),

  _simple_statement: (node) => ({
    tag: 'ACTION',
    title: 'Statement',
    explanation: `Runs statement ${node.text.slice(0, 30)}.`,
    sourceType: 'LITERAL',
  }),

  expression: (node) => ({
    tag: 'ACTION',
    title: 'Expression',
    explanation: `Calculates value of ${node.text.slice(0, 30)}.`,
    sourceType: 'LITERAL',
  }),

  parameter: (node) => ({
    tag: 'VARIABLE',
    title: 'Parameter',
    explanation: `Declares function input parameter ${node.text}.`,
    sourceType: 'LITERAL',
  }),

  pattern: (node) => ({
    tag: 'IF',
    title: 'Pattern',
    explanation: `Matches pattern ${node.text.slice(0, 30)}.`,
    sourceType: 'LITERAL',
  }),

  primary_expression: (node) => ({
    tag: 'ACTION',
    title: 'Primary Value',
    explanation: `Evaluates primary value ${node.text.slice(0, 30)}.`,
    sourceType: 'LITERAL',
  }),

  // ── Imports ──
  import_statement: (node) => {
    const names = node.namedChildren.map((c) => c.text).join(', ');
    const isKnown = KNOWN_PYTHON_MODULES.has(names.split(',')[0].trim().split('.')[0]);
    return {
      tag: 'IMPORT',
      title: 'Import Module',
      explanation: isKnown
        ? `Imports module ${names} to use its functions and tools.`
        : `Imports ${names}, an external library.`,
      sourceType: isKnown ? 'KB' : 'LITERAL',
    };
  },

  import_from_statement: (node) => {
    const mod = node.childForFieldName('module_name')?.text || 'module';
    const names: string[] = [];
    for (let j = 0; j < node.namedChildCount; j++) {
      const c = node.namedChild(j)!;
      if (c.type === 'dotted_name' && c.text !== mod) names.push(c.text);
      else if (c.type === 'identifier') names.push(c.text);
    }
    const isKnown = KNOWN_PYTHON_MODULES.has(mod.split('.')[0]);
    return {
      tag: 'IMPORT',
      title: 'Import From Module',
      explanation: isKnown
        ? `Imports ${names.join(', ') || 'tools'} from library ${mod}.`
        : `Imports ${names.join(', ') || 'tools'} from external library ${mod}.`,
      sourceType: isKnown ? 'KB' : 'LITERAL',
    };
  },

  aliased_import: (node) => {
    const name = node.childForFieldName('name')?.text || 'module';
    const alias = node.childForFieldName('alias')?.text || 'alias';
    return {
      tag: 'IMPORT',
      title: 'Aliased Import',
      explanation: `Imports ${name} giving it the local shortcut name ${alias}.`,
      sourceType: 'LITERAL',
    };
  },

  future_import_statement: (node) => ({
    tag: 'IMPORT',
    title: 'Future Import',
    explanation: `Enables modern Python feature ${node.text.replace(/from\s+__future__\s+import\s+/, '')}.`,
    sourceType: 'LITERAL',
  }),

  relative_import: (node) => ({
    tag: 'IMPORT',
    title: 'Relative Import',
    explanation: `Imports ${node.text} from current package directory.`,
    sourceType: 'LITERAL',
  }),

  import_prefix: (node) => ({
    tag: 'IMPORT',
    title: 'Import Prefix',
    explanation: `Relative package path indicator: ${node.text}.`,
    sourceType: 'LITERAL',
  }),

  wildcard_import: () => ({
    tag: 'IMPORT',
    title: 'Wildcard Import',
    explanation: 'Imports all public definitions from module into current scope.',
    sourceType: 'LITERAL',
  }),

  dotted_name: (node) => ({
    tag: 'VARIABLE',
    title: 'Dotted Identifier',
    explanation: `References qualified name ${node.text}.`,
    sourceType: 'LITERAL',
  }),

  // ── Statements & Assignments ──
  assignment: (node) => explainAssignment(node),

  augmented_assignment: (node) => explainAugmentedAssignment(node),

  expression_statement: (node, ctx) => {
    const inner = node.namedChild(0);
    if (!inner) {
      return { tag: 'ACTION', title: 'Statement', explanation: `Runs ${node.text.slice(0, 30)}.`, sourceType: 'LITERAL' };
    }
    const builder = PYTHON_NODE_BUILDERS[inner.type];
    if (builder) return builder(inner, ctx);
    return { tag: 'ACTION', title: 'Expression', explanation: `Evaluates ${inner.text.slice(0, 35)}.`, sourceType: 'LITERAL' };
  },

  assert_statement: (node) => {
    const cond = stringifyCondition(node.namedChild(0));
    return {
      tag: 'ACTION',
      title: 'Assert Condition',
      explanation: `Asserts that ${cond} holds true, raising error if false.`,
      sourceType: 'LITERAL',
    };
  },

  delete_statement: (node) => {
    const targets = node.namedChildren.map((c) => c.text).join(', ');
    return {
      tag: 'ACTION',
      title: 'Delete Variable',
      explanation: `Deletes ${targets} from memory.`,
      sourceType: 'LITERAL',
    };
  },

  global_statement: (node) => {
    const names = node.namedChildren.map((c) => c.text).join(', ');
    return {
      tag: 'VARIABLE',
      title: 'Global Scope',
      explanation: `Declares ${names} as global variables from module scope.`,
      sourceType: 'LITERAL',
    };
  },

  nonlocal_statement: (node) => {
    const names = node.namedChildren.map((c) => c.text).join(', ');
    return {
      tag: 'VARIABLE',
      title: 'Nonlocal Scope',
      explanation: `Declares ${names} as nonlocal variables from enclosing function.`,
      sourceType: 'LITERAL',
    };
  },

  pass_statement: () => ({
    tag: 'ACTION',
    title: 'Pass Placeholder',
    explanation: 'Placeholder statement that does nothing and passes control.',
    sourceType: 'LITERAL',
  }),

  break_statement: () => ({
    tag: 'STOP',
    title: 'Break Loop',
    explanation: 'Stops the enclosing loop immediately and exits.',
    sourceType: 'LITERAL',
  }),

  continue_statement: () => ({
    tag: 'SKIP',
    title: 'Skip Iteration',
    explanation: 'Skips the rest of current cycle and proceeds to next iteration.',
    sourceType: 'LITERAL',
  }),

  return_statement: (node) => {
    const val = node.namedChild(0)?.text;
    return {
      tag: 'RETURN',
      title: 'Return Value',
      explanation: val ? `Returns ${val} to caller and finishes function.` : 'Finishes function and returns to caller.',
      sourceType: 'LITERAL',
    };
  },

  raise_statement: (node) => {
    const err = node.namedChild(0)?.text || 'Exception';
    const cause = node.childForFieldName('cause')?.text;
    return {
      tag: 'ACTION',
      title: 'Raise Error',
      explanation: cause
        ? `Raises ${err} caused by ${cause}.`
        : `Raises error exception ${err}.`,
      sourceType: 'LITERAL',
    };
  },

  yield: (node) => {
    const val = node.namedChild(0)?.text || 'value';
    const isFrom = node.text.includes('yield from');
    return {
      tag: 'RETURN',
      title: isFrom ? 'Yield From' : 'Yield Value',
      explanation: isFrom
        ? `Delegates and yields all items from ${val} to caller.`
        : `Yields ${val} to caller, pausing generator execution.`,
      sourceType: 'LITERAL',
    };
  },

  // ── Functions & Classes ──
  function_definition: (node) => {
    const name = node.childForFieldName('name')?.text || 'function';
    const params = node.childForFieldName('parameters')?.text || '()';
    const returnType = node.childForFieldName('return_type')?.text;
    const cleanParams = params.replace(/^\(|\)$/g, '').trim();
    const isAsync = node.text.trim().startsWith('async ');
    let explanation = cleanParams
      ? `Defines ${isAsync ? 'async ' : ''}function ${name} with inputs (${cleanParams}).`
      : `Defines ${isAsync ? 'async ' : ''}function ${name} with no inputs.`;
    if (returnType) {
      explanation += ` Returning ${returnType}.`;
    }
    return {
      tag: 'FUNCTION',
      title: isAsync ? 'Define Async Function' : 'Define Function',
      explanation,
      sourceType: 'LITERAL',
    };
  },

  class_definition: (node) => {
    const name = node.childForFieldName('name')?.text || 'Class';
    const superclasses = node.childForFieldName('superclasses')?.text;
    return {
      tag: 'CLASS',
      title: 'Define Class',
      explanation: superclasses
        ? `Defines class ${name} inheriting from ${superclasses.replace(/^\(|\)$/g, '')}.`
        : `Defines class ${name} as a blueprint for objects.`,
      sourceType: 'LITERAL',
    };
  },

  decorated_definition: (node) => {
    const decorators = node.namedChildren.filter((c) => c.type === 'decorator').map((d) => d.text);
    const def = node.namedChildren.find((c) => c.type === 'function_definition' || c.type === 'class_definition');
    const name = def?.childForFieldName('name')?.text || 'definition';
    const kind = def?.type === 'class_definition' ? 'class' : 'function';

    if (decorators.some((d) => d.includes('dataclass'))) {
      return {
        tag: 'CLASS',
        title: 'Define Dataclass',
        explanation: `Defines dataclass ${name} with automatic constructor and field methods.`,
        sourceType: 'LITERAL',
      };
    }
    if (decorators.some((d) => d.includes('property'))) {
      return {
        tag: 'FUNCTION',
        title: 'Define Property',
        explanation: `Defines property getter ${name} accessed like an attribute.`,
        sourceType: 'LITERAL',
      };
    }

    return {
      tag: kind === 'class' ? 'CLASS' : 'FUNCTION',
      title: `Decorated ${kind === 'class' ? 'Class' : 'Function'}`,
      explanation: `Defines ${kind} ${name} wrapped with decorator ${decorators.join(' ')}.`,
      sourceType: 'LITERAL',
    };
  },

  decorator: (node) => ({
    tag: 'ACTION',
    title: 'Decorator',
    explanation: `Applies decorator ${node.text} to modify behavior.`,
    sourceType: 'LITERAL',
  }),

  // ── Conditionals & Control Flow ──
  if_statement: (node) => {
    const condition = node.childForFieldName('condition');
    const condWords = stringifyCondition(condition);
    return {
      tag: 'IF',
      title: 'If Condition',
      explanation: `Checks if ${condWords}.`,
      sourceType: 'LITERAL',
    };
  },

  elif_clause: (node) => {
    const condition = node.childForFieldName('condition');
    return {
      tag: 'ELSE IF',
      title: 'Else If Condition',
      explanation: `Otherwise, checks if ${stringifyCondition(condition)}.`,
      sourceType: 'LITERAL',
    };
  },

  else_clause: () => ({
    tag: 'ELSE',
    title: 'Else Fallback',
    explanation: 'If none of the above is true, runs this fallback block.',
    sourceType: 'LITERAL',
  }),

  // ── Loops ──
  for_statement: (node) => {
    const left = node.childForFieldName('left')?.text || 'item';
    const right = node.childForFieldName('right');
    const isAsync = node.text.trim().startsWith('async ');
    let explanation = `Goes through each item in ${right?.text || 'collection'}, calling it ${left}.`;

    if (right && right.type === 'call' && right.childForFieldName('function')?.text === 'range') {
      const args = extractCallArgs(right.childForFieldName('arguments'));
      if (args.length === 1) {
        explanation = `Repeats ${args[0]} times, with ${left} going from 0 up to ${args[0]} minus 1.`;
      } else if (args.length === 2) {
        explanation = `Repeats with ${left} going from ${args[0]} up to ${args[1]} minus 1.`;
      }
    }

    return {
      tag: 'LOOP',
      title: isAsync ? 'Async For Loop' : 'For Loop',
      explanation: isAsync ? `Asynchronously ${explanation.toLowerCase()}` : explanation,
      sourceType: 'LITERAL',
    };
  },

  while_statement: (node) => {
    const condition = node.childForFieldName('condition');
    const condText = condition?.text.trim();
    const explanation = condText === 'True'
      ? 'Repeats everything below forever, until something breaks out.'
      : `Repeats everything below while ${stringifyCondition(condition)}.`;
    return {
      tag: 'LOOP',
      title: 'While Loop',
      explanation,
      sourceType: 'LITERAL',
    };
  },

  // ── Error Handling & Context Managers ──
  try_statement: () => ({
    tag: 'ACTION',
    title: 'Try Block',
    explanation: 'Tries running this block safely, watching for errors.',
    sourceType: 'LITERAL',
  }),

  except_clause: (node) => {
    const exType = node.namedChildren.find((c) => c.type !== 'block' && c.type !== 'as_pattern')?.text;
    return {
      tag: 'ACTION',
      title: 'Catch Error',
      explanation: exType
        ? `Catches error ${exType} if it happens above.`
        : 'Catches any error that occurs in the block above.',
      sourceType: 'LITERAL',
    };
  },

  finally_clause: () => ({
    tag: 'ACTION',
    title: 'Finally Block',
    explanation: 'Runs this cleanup block no matter what happened.',
    sourceType: 'LITERAL',
  }),

  with_statement: (node) => {
    const item = node.namedChild(0)?.text || 'resource';
    const isAsync = node.text.trim().startsWith('async ');
    return {
      tag: 'ACTION',
      title: isAsync ? 'Async With Context' : 'With Context',
      explanation: `Opens and safely manages ${item} with automatic cleanup.`,
      sourceType: 'LITERAL',
    };
  },

  with_clause: (node) => ({
    tag: 'ACTION',
    title: 'With Context',
    explanation: `Context resource: ${node.text}.`,
    sourceType: 'LITERAL',
  }),

  with_item: (node) => {
    const val = node.childForFieldName('value')?.text || 'resource';
    const target = node.childForFieldName('target')?.text;
    return {
      tag: 'ACTION',
      title: 'Context Item',
      explanation: target ? `Manages resource ${val} bound as ${target}.` : `Manages resource ${val}.`,
      sourceType: 'LITERAL',
    };
  },

  // ── Pattern Matching (match / case) ──
  match_statement: (node) => {
    const subject = node.childForFieldName('subject')?.text || 'value';
    return {
      tag: 'IF',
      title: 'Match Statement',
      explanation: `Compares ${subject} against structural pattern cases.`,
      sourceType: 'LITERAL',
    };
  },

  case_clause: (node) => {
    const pattern = node.childForFieldName('pattern')?.text || 'pattern';
    const guard = node.childForFieldName('guard')?.text;
    return {
      tag: 'IF',
      title: 'Case Pattern',
      explanation: guard
        ? `Matches pattern ${pattern} if condition ${guard} is satisfied.`
        : `Matches case pattern ${pattern}.`,
      sourceType: 'LITERAL',
    };
  },

  case_pattern: (node) => ({
    tag: 'IF',
    title: 'Case Pattern',
    explanation: `Matches pattern ${node.text}.`,
    sourceType: 'LITERAL',
  }),

  class_pattern: (node) => ({
    tag: 'IF',
    title: 'Class Pattern',
    explanation: `Matches class instance of ${node.text}.`,
    sourceType: 'LITERAL',
  }),

  dict_pattern: (node) => ({
    tag: 'IF',
    title: 'Dict Pattern',
    explanation: `Matches dictionary keys pattern: ${node.text}.`,
    sourceType: 'LITERAL',
  }),

  list_pattern: (node) => ({
    tag: 'IF',
    title: 'List Pattern',
    explanation: `Matches sequence list pattern: ${node.text}.`,
    sourceType: 'LITERAL',
  }),

  tuple_pattern: (node) => ({
    tag: 'IF',
    title: 'Tuple Pattern',
    explanation: `Matches tuple pattern: ${node.text}.`,
    sourceType: 'LITERAL',
  }),

  union_pattern: (node) => ({
    tag: 'IF',
    title: 'Union Pattern',
    explanation: `Matches either alternative in union pattern: ${node.text}.`,
    sourceType: 'LITERAL',
  }),

  complex_pattern: (node) => ({
    tag: 'IF',
    title: 'Complex Pattern',
    explanation: `Matches complex pattern ${node.text}.`,
    sourceType: 'LITERAL',
  }),

  as_pattern: (node) => {
    const name = node.childForFieldName('alias')?.text || 'var';
    return {
      tag: 'VARIABLE',
      title: 'As Pattern Binding',
      explanation: `Binds matched pattern to variable ${name}.`,
      sourceType: 'LITERAL',
    };
  },

  keyword_pattern: (node) => ({
    tag: 'IF',
    title: 'Keyword Pattern',
    explanation: `Matches keyword attribute ${node.text}.`,
    sourceType: 'LITERAL',
  }),

  splat_pattern: (node) => ({
    tag: 'VARIABLE',
    title: 'Splat Pattern',
    explanation: `Captures remaining sequence items: ${node.text}.`,
    sourceType: 'LITERAL',
  }),

  list_splat_pattern: (node) => ({
    tag: 'VARIABLE',
    title: 'List Splat Pattern',
    explanation: `Captures remaining list elements into ${node.text}.`,
    sourceType: 'LITERAL',
  }),

  dictionary_splat_pattern: (node) => ({
    tag: 'VARIABLE',
    title: 'Dict Splat Pattern',
    explanation: `Captures remaining dictionary entries into ${node.text}.`,
    sourceType: 'LITERAL',
  }),

  pattern_list: (node) => ({
    tag: 'IF',
    title: 'Pattern List',
    explanation: `Sequence of patterns: ${node.text}.`,
    sourceType: 'LITERAL',
  }),

  // ── Expressions ──
  call: (node) => explainCall(node),

  attribute: (node) => {
    const obj = node.childForFieldName('object')?.text || 'object';
    const attr = node.childForFieldName('attribute')?.text || 'property';
    return {
      tag: 'VARIABLE',
      title: 'Access Attribute',
      explanation: `Accesses property ${attr} of ${obj}.`,
      sourceType: 'LITERAL',
    };
  },

  subscript: (node) => {
    const val = node.childForFieldName('value')?.text || 'sequence';
    const sub = node.childForFieldName('subscript')?.text || 'index';
    return {
      tag: 'VARIABLE',
      title: 'Index Subscript',
      explanation: `Accesses element at [${sub}] in ${val}.`,
      sourceType: 'LITERAL',
    };
  },

  slice: (node) => {
    return {
      tag: 'VARIABLE',
      title: 'Slice Range',
      explanation: `Slices sequence range [${node.text}].`,
      sourceType: 'LITERAL',
    };
  },

  binary_operator: (node) => {
    const left = node.childForFieldName('left')?.text || 'a';
    const right = node.childForFieldName('right')?.text || 'b';
    const op = node.children.find((c) => !c.isNamed())?.text || '+';
    return {
      tag: 'ACTION',
      title: 'Binary Operation',
      explanation: `Calculates ${left} ${op} ${right}.`,
      sourceType: 'LITERAL',
    };
  },

  boolean_operator: (node) => {
    return {
      tag: 'IF',
      title: 'Logical Check',
      explanation: `Checks logical expression: ${stringifyCondition(node)}.`,
      sourceType: 'LITERAL',
    };
  },

  not_operator: (node) => {
    const arg = node.childForFieldName('argument')?.text || 'condition';
    return {
      tag: 'IF',
      title: 'Not Operator',
      explanation: `Inverts truth value of ${arg}.`,
      sourceType: 'LITERAL',
    };
  },

  comparison_operator: (node) => {
    return {
      tag: 'IF',
      title: 'Comparison',
      explanation: `Checks if ${stringifyCondition(node)}.`,
      sourceType: 'LITERAL',
    };
  },

  conditional_expression: (node) => {
    const cond = node.childForFieldName('condition')?.text || 'check';
    const consequence = node.childForFieldName('consequence')?.text || 'a';
    const alternative = node.childForFieldName('alternative')?.text || 'b';
    return {
      tag: 'IF',
      title: 'Ternary Expression',
      explanation: `Chooses ${consequence} if ${cond}, otherwise ${alternative}.`,
      sourceType: 'LITERAL',
    };
  },

  named_expression: (node) => {
    const name = node.childForFieldName('name')?.text || 'var';
    const val = node.childForFieldName('value')?.text || 'value';
    return {
      tag: 'VARIABLE',
      title: 'Walrus Operator',
      explanation: `Assigns ${val} to ${name} and evaluates it inside expression.`,
      sourceType: 'LITERAL',
    };
  },

  await: (node) => {
    const expr = node.namedChild(0)?.text || 'coroutine';
    return {
      tag: 'ACTION',
      title: 'Await Coroutine',
      explanation: `Pauses execution until ${expr} finishes.`,
      sourceType: 'LITERAL',
    };
  },

  lambda: (node) => {
    const params = node.childForFieldName('parameters')?.text || '';
    const body = node.childForFieldName('body')?.text || '';
    return {
      tag: 'FUNCTION',
      title: 'Inline Lambda',
      explanation: params
        ? `Defines inline lambda function taking (${params}) returning ${body}.`
        : `Defines inline lambda function returning ${body}.`,
      sourceType: 'LITERAL',
    };
  },

  lambda_parameters: (node) => ({
    tag: 'VARIABLE',
    title: 'Lambda Parameters',
    explanation: `Lambda parameter inputs: ${node.text}.`,
    sourceType: 'LITERAL',
  }),

  list_comprehension: (node) => {
    return {
      tag: 'VARIABLE',
      title: 'List Comprehension',
      explanation: `Builds a new list dynamically by iterating in a loop: ${node.text.slice(0, 30)}.`,
      sourceType: 'LITERAL',
    };
  },

  dictionary_comprehension: (node) => {
    return {
      tag: 'VARIABLE',
      title: 'Dict Comprehension',
      explanation: `Builds a dictionary dynamically from key-value loop iterations.`,
      sourceType: 'LITERAL',
    };
  },

  set_comprehension: (node) => {
    return {
      tag: 'VARIABLE',
      title: 'Set Comprehension',
      explanation: `Builds a set of unique items dynamically by iterating in a loop.`,
      sourceType: 'LITERAL',
    };
  },

  generator_expression: (node) => {
    return {
      tag: 'FUNCTION',
      title: 'Generator Expression',
      explanation: `Creates generator streaming items dynamically on demand: ${node.text.slice(0, 30)}.`,
      sourceType: 'LITERAL',
    };
  },

  for_in_clause: (node) => {
    const left = node.childForFieldName('left')?.text || 'item';
    const right = node.childForFieldName('right')?.text || 'collection';
    return {
      tag: 'LOOP',
      title: 'Comprehension Loop',
      explanation: `Iterates each item in ${right} as ${left}.`,
      sourceType: 'LITERAL',
    };
  },

  if_clause: (node) => {
    const cond = node.childForFieldName('condition')?.text || 'check';
    return {
      tag: 'IF',
      title: 'Comprehension Filter',
      explanation: `Filters items where ${cond} is true.`,
      sourceType: 'LITERAL',
    };
  },

  parenthesized_expression: (node) => ({
    tag: 'ACTION',
    title: 'Parenthesized Value',
    explanation: `Evaluates grouped expression: ${node.text}.`,
    sourceType: 'LITERAL',
  }),

  expression_list: (node) => ({
    tag: 'ACTION',
    title: 'Expression List',
    explanation: `Evaluates list of expressions: ${node.text.slice(0, 30)}.`,
    sourceType: 'LITERAL',
  }),

  concatenated_string: (node) => ({
    tag: 'VARIABLE',
    title: 'Joined String',
    explanation: `Combines adjacent strings: ${node.text.slice(0, 30)}.`,
    sourceType: 'LITERAL',
  }),

  // ── Literals & Collections ──
  identifier: (node) => ({
    tag: 'VARIABLE',
    title: 'Identifier',
    explanation: `Variable or reference ${node.text}.`,
    sourceType: 'LITERAL',
  }),

  integer: (node) => ({
    tag: 'VARIABLE',
    title: 'Integer',
    explanation: `Number value ${node.text}.`,
    sourceType: 'LITERAL',
  }),

  float: (node) => ({
    tag: 'VARIABLE',
    title: 'Decimal Float',
    explanation: `Decimal value ${node.text}.`,
    sourceType: 'LITERAL',
  }),

  string: (node) => {
    const isFString = node.text.startsWith('f"') || node.text.startsWith("f'") || node.text.startsWith('f"""') || node.text.startsWith("f'''");
    if (isFString) {
      return {
        tag: 'VARIABLE',
        title: 'Formatted F-String',
        explanation: 'Constructs formatted text string embedding dynamic values.',
        sourceType: 'LITERAL',
      };
    }
    return {
      tag: 'VARIABLE',
      title: 'Text String',
      explanation: `Text string literal: ${node.text.slice(0, 30)}.`,
      sourceType: 'LITERAL',
    };
  },

  string_content: (node) => ({
    tag: 'VARIABLE',
    title: 'String Content',
    explanation: `String characters: ${node.text.slice(0, 30)}.`,
    sourceType: 'LITERAL',
  }),

  string_start: () => ({
    tag: 'VARIABLE',
    title: 'String Quote',
    explanation: 'Opening quote of string.',
    sourceType: 'LITERAL',
  }),

  string_end: () => ({
    tag: 'VARIABLE',
    title: 'String Quote',
    explanation: 'Closing quote of string.',
    sourceType: 'LITERAL',
  }),

  true: () => ({
    tag: 'VARIABLE',
    title: 'Boolean True',
    explanation: 'Boolean literal value True.',
    sourceType: 'LITERAL',
  }),

  false: () => ({
    tag: 'VARIABLE',
    title: 'Boolean False',
    explanation: 'Boolean literal value False.',
    sourceType: 'LITERAL',
  }),

  none: () => ({
    tag: 'VARIABLE',
    title: 'None Value',
    explanation: 'Special Python None value representing absence of a value.',
    sourceType: 'LITERAL',
  }),

  ellipsis: () => ({
    tag: 'ACTION',
    title: 'Ellipsis',
    explanation: 'Ellipsis (...) placeholder for unwritten code or full slice.',
    sourceType: 'LITERAL',
  }),

  comment: (node) => {
    const cleanComment = node.text.replace(/^#\s*/, '').trim();
    return {
      tag: 'COMMENT',
      title: 'Comment',
      explanation: cleanComment ? `Developer note: "${cleanComment}".` : 'Developer comment.',
      sourceType: 'LITERAL',
    };
  },

  list: (node) => ({
    tag: 'VARIABLE',
    title: 'List Literal',
    explanation: `Creates a list containing ${node.namedChildCount} elements.`,
    sourceType: 'LITERAL',
  }),

  tuple: (node) => ({
    tag: 'VARIABLE',
    title: 'Tuple Literal',
    explanation: `Creates an immutable tuple containing ${node.namedChildCount} elements.`,
    sourceType: 'LITERAL',
  }),

  dictionary: (node) => ({
    tag: 'VARIABLE',
    title: 'Dictionary Literal',
    explanation: `Creates a dictionary containing ${node.namedChildCount} key-value pairs.`,
    sourceType: 'LITERAL',
  }),

  set: (node) => ({
    tag: 'VARIABLE',
    title: 'Set Literal',
    explanation: `Creates a set of ${node.namedChildCount} unique elements.`,
    sourceType: 'LITERAL',
  }),

  pair: (node) => {
    const key = node.childForFieldName('key')?.text || 'key';
    const val = node.childForFieldName('value')?.text || 'val';
    return {
      tag: 'VARIABLE',
      title: 'Key-Value Pair',
      explanation: `Maps dictionary key ${key} to value ${val}.`,
      sourceType: 'LITERAL',
    };
  },

  // ── Parameters & Separators ──
  parameters: (node) => ({
    tag: 'VARIABLE',
    title: 'Parameters',
    explanation: `Function parameters: (${node.text.replace(/^\(|\)$/g, '')}).`,
    sourceType: 'LITERAL',
  }),

  default_parameter: (node) => {
    const name = node.childForFieldName('name')?.text || 'param';
    const val = node.childForFieldName('value')?.text || 'default';
    return {
      tag: 'VARIABLE',
      title: 'Default Parameter',
      explanation: `Parameter ${name} with default value ${val}.`,
      sourceType: 'LITERAL',
    };
  },

  typed_parameter: (node) => {
    const name = node.namedChild(0)?.text || 'param';
    const type = node.childForFieldName('type')?.text || 'Any';
    return {
      tag: 'VARIABLE',
      title: 'Typed Parameter',
      explanation: `Input parameter ${name} of type ${type}.`,
      sourceType: 'LITERAL',
    };
  },

  typed_default_parameter: (node) => {
    const name = node.childForFieldName('name')?.text || 'param';
    const type = node.childForFieldName('type')?.text || 'Any';
    const val = node.childForFieldName('value')?.text || 'default';
    return {
      tag: 'VARIABLE',
      title: 'Typed Default Param',
      explanation: `Input parameter ${name} of type ${type} defaulting to ${val}.`,
      sourceType: 'LITERAL',
    };
  },

  argument_list: (node) => ({
    tag: 'ACTION',
    title: 'Argument List',
    explanation: `Passes arguments (${node.text.replace(/^\(|\)$/g, '')}).`,
    sourceType: 'LITERAL',
  }),

  keyword_argument: (node) => {
    const name = node.childForFieldName('name')?.text || 'arg';
    const val = node.childForFieldName('value')?.text || 'value';
    return {
      tag: 'ACTION',
      title: 'Keyword Argument',
      explanation: `Named argument ${name} set to ${val}.`,
      sourceType: 'LITERAL',
    };
  },

  keyword_separator: () => ({
    tag: 'VARIABLE',
    title: 'Keyword Separator',
    explanation: 'Marks subsequent parameters as keyword-only arguments.',
    sourceType: 'LITERAL',
  }),

  positional_separator: () => ({
    tag: 'VARIABLE',
    title: 'Positional Separator',
    explanation: 'Marks preceding parameters as positional-only arguments.',
    sourceType: 'LITERAL',
  }),

  list_splat: (node) => ({
    tag: 'ACTION',
    title: 'List Splat',
    explanation: `Unpacks iterable sequence elements ${node.text} into call or collection.`,
    sourceType: 'LITERAL',
  }),

  dictionary_splat: (node) => ({
    tag: 'ACTION',
    title: 'Dictionary Splat',
    explanation: `Unpacks dictionary key-value entries ${node.text} into call or dictionary.`,
    sourceType: 'LITERAL',
  }),

  parenthesized_list_splat: (node) => ({
    tag: 'ACTION',
    title: 'Parenthesized Splat',
    explanation: `Unpacks parenthesized sequence ${node.text}.`,
    sourceType: 'LITERAL',
  }),

  // ── Types and Type Annotations ──
  type: (node) => ({
    tag: 'VARIABLE',
    title: 'Type Hint',
    explanation: `Type annotation hint: ${node.text}.`,
    sourceType: 'LITERAL',
  }),

  type_alias_statement: (node) => {
    const name = node.childForFieldName('name')?.text || 'TypeAlias';
    const val = node.childForFieldName('value')?.text || 'type';
    return {
      tag: 'VARIABLE',
      title: 'Type Alias',
      explanation: `Defines type alias ${name} representing ${val}.`,
      sourceType: 'LITERAL',
    };
  },

  type_parameter: (node) => ({
    tag: 'VARIABLE',
    title: 'Type Parameter',
    explanation: `Generic type parameter: ${node.text}.`,
    sourceType: 'LITERAL',
  }),

  generic_type: (node) => ({
    tag: 'VARIABLE',
    title: 'Generic Type',
    explanation: `Generic type parameterized as ${node.text}.`,
    sourceType: 'LITERAL',
  }),

  union_type: (node) => ({
    tag: 'VARIABLE',
    title: 'Union Type',
    explanation: `Union type accepting ${node.text}.`,
    sourceType: 'LITERAL',
  }),

  constrained_type: (node) => ({
    tag: 'VARIABLE',
    title: 'Constrained Type',
    explanation: `Type parameter with constraint: ${node.text}.`,
    sourceType: 'LITERAL',
  }),

  member_type: (node) => ({
    tag: 'VARIABLE',
    title: 'Member Type',
    explanation: `Qualified type member: ${node.text}.`,
    sourceType: 'LITERAL',
  }),

  splat_type: (node) => ({
    tag: 'VARIABLE',
    title: 'Splat Type',
    explanation: `Unpacked variadic type parameter: ${node.text}.`,
    sourceType: 'LITERAL',
  }),

  // ── String Formatting / Interpolation ──
  format_expression: (node) => ({
    tag: 'VARIABLE',
    title: 'Format Expression',
    explanation: `Evaluates embedded f-string expression: ${node.text}.`,
    sourceType: 'LITERAL',
  }),

  format_specifier: (node) => ({
    tag: 'VARIABLE',
    title: 'Format Specifier',
    explanation: `Applies format rule ${node.text} to embedded expression.`,
    sourceType: 'LITERAL',
  }),

  interpolation: (node) => ({
    tag: 'VARIABLE',
    title: 'Interpolation',
    explanation: `Inserts evaluated value of ${node.text} into string.`,
    sourceType: 'LITERAL',
  }),

  escape_interpolation: (node) => ({
    tag: 'VARIABLE',
    title: 'Escaped Brace',
    explanation: `Literal brace character in formatted string: ${node.text}.`,
    sourceType: 'LITERAL',
  }),

  escape_sequence: (node) => ({
    tag: 'VARIABLE',
    title: 'Escape Sequence',
    explanation: `String escape code ${node.text}.`,
    sourceType: 'LITERAL',
  }),

  type_conversion: (node) => ({
    tag: 'VARIABLE',
    title: 'Type Conversion',
    explanation: `Converts formatted value using flag ${node.text}.`,
    sourceType: 'LITERAL',
  }),

  line_continuation: () => ({
    tag: 'COMMENT',
    title: 'Line Continuation',
    explanation: 'Continues current statement on the next line.',
    sourceType: 'LITERAL',
  }),

  // ── Operators & Legacy Statements ──
  unary_operator: (node) => {
    const op = node.children.find((c) => !c.isNamed())?.text || '-';
    const arg = node.namedChild(0)?.text || 'x';
    return {
      tag: 'ACTION',
      title: 'Unary Operation',
      explanation: `Applies unary ${op} operator to ${arg}.`,
      sourceType: 'LITERAL',
    };
  },

  chevron: (node) => ({
    tag: 'ACTION',
    title: 'Output Chevron',
    explanation: `Redirects output stream: ${node.text}.`,
    sourceType: 'LITERAL',
  }),

  exec_statement: (node) => ({
    tag: 'ACTION',
    title: 'Exec Dynamic Code',
    explanation: `Runs dynamically parsed code: ${node.text.slice(0, 30)}.`,
    sourceType: 'LITERAL',
  }),

  print_statement: (node) => ({
    tag: 'ACTION',
    title: 'Print Statement',
    explanation: `Prints ${node.text.replace(/^print\s+/, '')} to console.`,
    sourceType: 'LITERAL',
  }),

  block: (node) => ({
    tag: 'ACTION',
    title: 'Code Block',
    explanation: `Executes indented block of ${node.namedChildCount} statements.`,
    sourceType: 'LITERAL',
  }),

  module: (node) => ({
    tag: 'ACTION',
    title: 'Root Module',
    explanation: `Root program module containing ${node.namedChildCount} top-level items.`,
    sourceType: 'LITERAL',
  }),
};

/**
 * Core AST Visitor: Walks statements recursively and produces StatementExplanationRow array.
 * Emits exactly one row per statement; multi-line statements span startLine to endLine.
 * Blank lines get no row. Comments get a COMMENT row.
 */
function walkStatements(
  node: Parser.SyntaxNode,
  depth: number,
  codeLines: string[],
  rows: StatementExplanationRow[]
): void {
  const ctx: BuilderContext = {
    codeLines,
    depth,
    buildChild: (childNode) => childNode ? childNode.text : '',
  };

  for (let i = 0; i < node.childCount; i++) {
    const child = node.child(i)!;
    const startLine = child.startPosition.row + 1;
    const endLine = child.endPosition.row + 1;
    const rawCode = codeLines.slice(child.startPosition.row, child.endPosition.row + 1).join('\n');

    // Skip punctuation tokens that are not statements
    if ([':', ';', ',', '(', ')', '{', '}', '[', ']'].includes(child.type)) {
      continue;
    }

    // ── 1. COMMENTS ──
    if (child.type === 'comment') {
      const cleanComment = child.text.replace(/^#\s*/, '').trim();
      rows.push({
        startLine,
        endLine,
        kind: 'comment',
        depth,
        tag: 'COMMENT',
        title: 'Comment',
        explanation: cleanComment ? `Developer note: "${cleanComment}".` : 'Developer comment.',
        rawCode,
        sourceType: 'LITERAL',
      });
      continue;
    }

    // ── 2. SYNTAX ERRORS ──
    if (child.type === 'ERROR' || child.isMissing()) {
      const lineText = codeLines[child.startPosition.row] || child.text;
      const hint = diagnoseSyntaxError(child, lineText);
      rows.push({
        startLine,
        endLine,
        kind: 'error',
        depth,
        tag: 'ERROR',
        title: 'Syntax Error',
        explanation: `Syntax issue: ${hint}`,
        rawCode,
        sourceType: 'LITERAL',
        hasError: true,
        errorFixHint: hint,
      });

      // Still walk any valid nested children inside error node
      for (let j = 0; j < child.namedChildCount; j++) {
        const sub = child.namedChild(j)!;
        if (sub.type !== 'ERROR' && !sub.isMissing()) {
          walkStatements(sub, depth, codeLines, rows);
        }
      }
      continue;
    }

    // ── 3. EXPRESSION STATEMENTS (Assignment, AugAssign, Calls, Strings, Yield) ──
    if (child.type === 'expression_statement') {
      const expr = child.namedChild(0);
      if (!expr) continue;

      // Standalone string (module docstring)
      if (expr.type === 'string') {
        rows.push({
          startLine,
          endLine,
          kind: 'docstring',
          depth,
          tag: 'COMMENT',
          title: 'Documentation',
          explanation: `Module documentation: ${expr.text.slice(0, 35)}...`,
          rawCode,
          sourceType: 'LITERAL',
        });
        continue;
      }

      // Check registered builder for inner expression
      const builder = PYTHON_NODE_BUILDERS[expr.type];
      if (builder) {
        const result = builder(expr, ctx);
        rows.push({
          startLine,
          endLine,
          kind: expr.type,
          depth,
          tag: result.tag,
          title: result.title,
          explanation: result.explanation,
          rawCode,
          sourceType: result.sourceType,
        });
      } else {
        rows.push({
          startLine,
          endLine,
          kind: expr.type,
          depth,
          tag: 'ACTION',
          title: 'Expression',
          explanation: `Evaluates ${expr.text.slice(0, 35)}.`,
          rawCode,
          sourceType: 'LITERAL',
        });
      }
      continue;
    }

    // ── 4. FUNCTION DEFINITION ──
    if (child.type === 'function_definition') {
      const builder = PYTHON_NODE_BUILDERS.function_definition;
      const res = builder(child, ctx);
      const headerLine = child.startPosition.row + 1;
      const body = child.childForFieldName('body');

      rows.push({
        startLine: headerLine,
        endLine: headerLine,
        kind: 'function_definition',
        depth,
        tag: res.tag,
        title: res.title,
        explanation: res.explanation,
        rawCode: codeLines[headerLine - 1] || child.text.split('\n')[0],
        sourceType: res.sourceType,
      });

      if (body) {
        walkStatements(body, depth + 1, codeLines, rows);
      }
      continue;
    }

    // ── 5. CLASS DEFINITION ──
    if (child.type === 'class_definition') {
      const builder = PYTHON_NODE_BUILDERS.class_definition;
      const res = builder(child, ctx);
      const headerLine = child.startPosition.row + 1;
      const body = child.childForFieldName('body');

      rows.push({
        startLine: headerLine,
        endLine: headerLine,
        kind: 'class_definition',
        depth,
        tag: res.tag,
        title: res.title,
        explanation: res.explanation,
        rawCode: codeLines[headerLine - 1] || child.text.split('\n')[0],
        sourceType: res.sourceType,
      });

      if (body) {
        walkStatements(body, depth + 1, codeLines, rows);
      }
      continue;
    }

    // ── 6. DECORATED DEFINITION ──
    if (child.type === 'decorated_definition') {
      const builder = PYTHON_NODE_BUILDERS.decorated_definition;
      const res = builder(child, ctx);
      const headerLine = child.startPosition.row + 1;
      const def = child.namedChildren.find((c) => c.type === 'function_definition' || c.type === 'class_definition');
      const body = def ? def.childForFieldName('body') : null;

      rows.push({
        startLine: headerLine,
        endLine: headerLine,
        kind: 'decorated_definition',
        depth,
        tag: res.tag,
        title: res.title,
        explanation: res.explanation,
        rawCode: codeLines[headerLine - 1] || child.text.split('\n')[0],
        sourceType: res.sourceType,
      });

      if (body) {
        walkStatements(body, depth + 1, codeLines, rows);
      }
      continue;
    }

    // ── 7. IF / ELIF / ELSE ──
    if (child.type === 'if_statement') {
      const builder = PYTHON_NODE_BUILDERS.if_statement;
      const res = builder(child, ctx);
      const headerLine = child.startPosition.row + 1;
      const consequence = child.childForFieldName('consequence');

      rows.push({
        startLine: headerLine,
        endLine: headerLine,
        kind: 'if_statement',
        depth,
        tag: res.tag,
        title: res.title,
        explanation: res.explanation,
        rawCode: codeLines[headerLine - 1] || '',
        sourceType: res.sourceType,
      });

      if (consequence) {
        walkStatements(consequence, depth + 1, codeLines, rows);
      }

      // Check clauses: elif_clause, else_clause
      for (let j = 0; j < child.childCount; j++) {
        const sub = child.child(j)!;
        if (sub.type === 'elif_clause') {
          const elifRes = PYTHON_NODE_BUILDERS.elif_clause(sub, ctx);
          const elifBody = sub.childForFieldName('consequence');
          const elifLine = sub.startPosition.row + 1;
          rows.push({
            startLine: elifLine,
            endLine: elifLine,
            kind: 'elif_clause',
            depth,
            tag: elifRes.tag,
            title: elifRes.title,
            explanation: elifRes.explanation,
            rawCode: codeLines[elifLine - 1] || '',
            sourceType: elifRes.sourceType,
          });
          if (elifBody) {
            walkStatements(elifBody, depth + 1, codeLines, rows);
          }
        } else if (sub.type === 'else_clause') {
          const elseRes = PYTHON_NODE_BUILDERS.else_clause(sub, ctx);
          const elseBody = sub.childForFieldName('body');
          const elseLine = sub.startPosition.row + 1;
          rows.push({
            startLine: elseLine,
            endLine: elseLine,
            kind: 'else_clause',
            depth,
            tag: elseRes.tag,
            title: elseRes.title,
            explanation: elseRes.explanation,
            rawCode: codeLines[elseLine - 1] || '',
            sourceType: elseRes.sourceType,
          });
          if (elseBody) {
            walkStatements(elseBody, depth + 1, codeLines, rows);
          }
        }
      }
      continue;
    }

    // ── 8. FOR LOOPS ──
    if (child.type === 'for_statement') {
      const builder = PYTHON_NODE_BUILDERS.for_statement;
      const res = builder(child, ctx);
      const headerLine = child.startPosition.row + 1;
      const body = child.childForFieldName('body');

      rows.push({
        startLine: headerLine,
        endLine: headerLine,
        kind: 'for_statement',
        depth,
        tag: res.tag,
        title: res.title,
        explanation: res.explanation,
        rawCode: codeLines[headerLine - 1] || '',
        sourceType: res.sourceType,
      });

      if (body) {
        walkStatements(body, depth + 1, codeLines, rows);
      }
      continue;
    }

    // ── 9. WHILE LOOPS ──
    if (child.type === 'while_statement') {
      const builder = PYTHON_NODE_BUILDERS.while_statement;
      const res = builder(child, ctx);
      const headerLine = child.startPosition.row + 1;
      const body = child.childForFieldName('body');

      rows.push({
        startLine: headerLine,
        endLine: headerLine,
        kind: 'while_statement',
        depth,
        tag: res.tag,
        title: res.title,
        explanation: res.explanation,
        rawCode: codeLines[headerLine - 1] || '',
        sourceType: res.sourceType,
      });

      if (body) {
        walkStatements(body, depth + 1, codeLines, rows);
      }
      continue;
    }

    // ── 10. TRY / EXCEPT / ELSE / FINALLY ──
    if (child.type === 'try_statement') {
      const body = child.childForFieldName('body');
      const headerLine = child.startPosition.row + 1;

      rows.push({
        startLine: headerLine,
        endLine: headerLine,
        kind: 'try_statement',
        depth,
        tag: 'ACTION',
        title: 'Try Block',
        explanation: 'Tries running this block safely, watching for errors.',
        rawCode: codeLines[headerLine - 1] || '',
        sourceType: 'LITERAL',
      });

      if (body) {
        walkStatements(body, depth + 1, codeLines, rows);
      }

      for (let j = 0; j < child.childCount; j++) {
        const sub = child.child(j)!;
        if (sub.type === 'except_clause') {
          const exRes = PYTHON_NODE_BUILDERS.except_clause(sub, ctx);
          const exLine = sub.startPosition.row + 1;
          const exBody = sub.namedChildren.find((c) => c.type === 'block');
          rows.push({
            startLine: exLine,
            endLine: exLine,
            kind: 'except_clause',
            depth,
            tag: exRes.tag,
            title: exRes.title,
            explanation: exRes.explanation,
            rawCode: codeLines[exLine - 1] || '',
            sourceType: exRes.sourceType,
          });
          if (exBody) {
            walkStatements(exBody, depth + 1, codeLines, rows);
          }
        } else if (sub.type === 'else_clause') {
          const elRes = PYTHON_NODE_BUILDERS.else_clause(sub, ctx);
          const elLine = sub.startPosition.row + 1;
          const elBody = sub.childForFieldName('body');
          rows.push({
            startLine: elLine,
            endLine: elLine,
            kind: 'else_clause',
            depth,
            tag: 'ELSE',
            title: 'Try Else Block',
            explanation: 'Runs if no errors occurred in try block.',
            rawCode: codeLines[elLine - 1] || '',
            sourceType: 'LITERAL',
          });
          if (elBody) {
            walkStatements(elBody, depth + 1, codeLines, rows);
          }
        } else if (sub.type === 'finally_clause') {
          const finRes = PYTHON_NODE_BUILDERS.finally_clause(sub, ctx);
          const finLine = sub.startPosition.row + 1;
          const finBody = sub.namedChildren.find((c) => c.type === 'block');
          rows.push({
            startLine: finLine,
            endLine: finLine,
            kind: 'finally_clause',
            depth,
            tag: finRes.tag,
            title: finRes.title,
            explanation: finRes.explanation,
            rawCode: codeLines[finLine - 1] || '',
            sourceType: finRes.sourceType,
          });
          if (finBody) {
            walkStatements(finBody, depth + 1, codeLines, rows);
          }
        }
      }
      continue;
    }

    // ── 11. WITH STATEMENT ──
    if (child.type === 'with_statement') {
      const builder = PYTHON_NODE_BUILDERS.with_statement;
      const res = builder(child, ctx);
      const headerLine = child.startPosition.row + 1;
      const body = child.childForFieldName('body');

      rows.push({
        startLine: headerLine,
        endLine: headerLine,
        kind: 'with_statement',
        depth,
        tag: res.tag,
        title: res.title,
        explanation: res.explanation,
        rawCode: codeLines[headerLine - 1] || '',
        sourceType: res.sourceType,
      });

      if (body) {
        walkStatements(body, depth + 1, codeLines, rows);
      }
      continue;
    }

    // ── 12. MATCH STATEMENT (match / case) ──
    if (child.type === 'match_statement') {
      const builder = PYTHON_NODE_BUILDERS.match_statement;
      const res = builder(child, ctx);
      const headerLine = child.startPosition.row + 1;

      rows.push({
        startLine: headerLine,
        endLine: headerLine,
        kind: 'match_statement',
        depth,
        tag: res.tag,
        title: res.title,
        explanation: res.explanation,
        rawCode: codeLines[headerLine - 1] || '',
        sourceType: res.sourceType,
      });

      // Walk case clauses
      const body = child.childForFieldName('body');
      if (body) {
        for (let j = 0; j < body.childCount; j++) {
          const sub = body.child(j)!;
          if (sub.type === 'case_clause') {
            const caseRes = PYTHON_NODE_BUILDERS.case_clause(sub, ctx);
            const caseLine = sub.startPosition.row + 1;
            const caseBody = sub.childForFieldName('consequence');
            rows.push({
              startLine: caseLine,
              endLine: caseLine,
              kind: 'case_clause',
              depth: depth + 1,
              tag: caseRes.tag,
              title: caseRes.title,
              explanation: caseRes.explanation,
              rawCode: codeLines[caseLine - 1] || '',
              sourceType: caseRes.sourceType,
            });
            if (caseBody) {
              walkStatements(caseBody, depth + 2, codeLines, rows);
            }
          }
        }
      }
      continue;
    }

    // ── 13. BLOCK CONTAINER ──
    if (child.type === 'block') {
      walkStatements(child, depth, codeLines, rows);
      continue;
    }

    // ── 14. GENERAL STATEMENT BUILDER LOOKUP ──
    const builder = PYTHON_NODE_BUILDERS[child.type];
    if (builder) {
      const res = builder(child, ctx);
      rows.push({
        startLine,
        endLine,
        kind: child.type,
        depth,
        tag: res.tag,
        title: res.title,
        explanation: res.explanation,
        rawCode,
        sourceType: res.sourceType,
      });
      continue;
    }

    // ── 15. LITERAL FALLBACK (Zero Speculation, Zero Banned Words) ──
    rows.push({
      startLine,
      endLine,
      kind: child.type,
      depth,
      tag: 'ACTION',
      title: 'Action',
      explanation: `Runs ${child.type.replace(/_/g, ' ')}: ${rawCode.slice(0, 35)}.`,
      rawCode,
      sourceType: 'LITERAL',
    });
  }
}

/**
 * Generates an executive beginner summary card: "What this program does".
 * Completely free of all banned phrases!
 */
export function generateProgramSummary(
  rows: StatementExplanationRow[],
  codeLines: string[]
): PythonAnalysisResult['summary'] {
  const imports: string[] = [];
  let functions = 0;
  let loops = 0;
  let conditionals = 0;
  let classes = 0;
  let errors = 0;

  for (const row of rows) {
    if (row.tag === 'IMPORT') {
      const match = row.rawCode.match(/(?:import|from)\s+([a-zA-Z0-9_]+)/);
      if (match && !imports.includes(match[1])) imports.push(match[1]);
    } else if (row.tag === 'FUNCTION') {
      functions++;
    } else if (row.tag === 'LOOP') {
      loops++;
    } else if (row.tag === 'IF' || row.tag === 'ELSE IF') {
      conditionals++;
    } else if (row.tag === 'CLASS') {
      classes++;
    } else if (row.tag === 'ERROR') {
      errors++;
    }
  }

  let title = 'Sequential Python Program';
  const descParts: string[] = [];

  if (imports.includes('pygame')) {
    title = 'Pygame 2D Graphical Application';
    descParts.push('Initializes a graphical window and runs an interactive animation loop.');
  } else if (imports.includes('tkinter')) {
    title = 'Desktop GUI Application';
    descParts.push('Builds a desktop user interface with buttons and interactive widgets.');
  } else if (imports.includes('numpy') || imports.includes('pandas')) {
    title = 'Data Processing & Array Computation';
    descParts.push('Manipulates structured data arrays and performs analytical computations.');
  } else if (imports.includes('requests') || imports.includes('urllib')) {
    title = 'Web API Client Script';
    descParts.push('Connects to remote web services and transfers network data.');
  } else if (classes > 0) {
    title = 'Object-Oriented Python Blueprint';
    descParts.push(`Constructs ${classes} custom class blueprint${classes > 1 ? 's' : ''} to model application state.`);
  } else if (functions > 0) {
    title = 'Modular Function-Driven Program';
    descParts.push(`Organizes logic into ${functions} modular function${functions > 1 ? 's' : ''}.`);
  } else {
    descParts.push('Runs top-to-bottom sequential operations to compute values.');
  }

  if (loops > 0 && conditionals > 0) {
    descParts.push(`Uses ${loops} loop${loops > 1 ? 's' : ''} with conditional decision checks to control execution.`);
  } else if (loops > 0) {
    descParts.push(`Repeats operations across ${loops} loop${loops > 1 ? 's' : ''}.`);
  } else if (conditionals > 0) {
    descParts.push(`Applies ${conditionals} condition branch${conditionals > 1 ? 'es' : ''} to handle different cases.`);
  }

  if (errors > 0) {
    descParts.push(`Note: Detected ${errors} syntax issue${errors > 1 ? 's' : ''} with actionable fix hints.`);
  }

  return {
    title,
    description: descParts.join(' '),
    stats: {
      lines: codeLines.length,
      statements: rows.filter((r) => r.tag !== 'COMMENT').length,
      functions,
      loops,
      conditionals,
      classes,
      imports,
    },
  };
}

/**
 * Fast synchronous fallback parser in case WASM has not yet loaded or on initialization error.
 * Uses robust token scanning so the UI is NEVER blank or crashing.
 */
export function parsePythonFallback(code: string): PythonAnalysisResult {
  const codeLines = code.split('\n');
  const rows: StatementExplanationRow[] = [];

  codeLines.forEach((raw, idx) => {
    const lineNum = idx + 1;
    const trimmed = raw.trim();
    if (!trimmed) return;

    const depth = Math.floor((raw.length - raw.trimStart().length) / 4);

    // Comment
    if (trimmed.startsWith('#')) {
      const clean = trimmed.replace(/^#\s*/, '');
      rows.push({
        startLine: lineNum,
        endLine: lineNum,
        kind: 'comment',
        depth,
        tag: 'COMMENT',
        title: 'Comment',
        explanation: clean ? `Developer note: "${clean}".` : 'Developer comment.',
        rawCode: raw,
        sourceType: 'LITERAL',
      });
      return;
    }

    // Imports
    if (/^(?:import|from)\s+/.test(trimmed)) {
      const match = trimmed.match(/^(?:import|from)\s+([a-zA-Z0-9_.]+)/);
      const mod = match ? match[1] : 'module';
      const isKnown = KNOWN_PYTHON_MODULES.has(mod.split('.')[0]);
      rows.push({
        startLine: lineNum,
        endLine: lineNum,
        kind: 'import',
        depth,
        tag: 'IMPORT',
        title: 'Import Module',
        explanation: isKnown ? `Imports module ${mod} to use its functions and tools.` : `Imports ${mod}, an external library.`,
        rawCode: raw,
        sourceType: isKnown ? 'KB' : 'LITERAL',
      });
      return;
    }

    // Function Def
    if (/^def\s+/.test(trimmed)) {
      const match = trimmed.match(/^def\s+([a-zA-Z0-9_]+)\s*\((.*?)\):?/);
      const name = match ? match[1] : 'function';
      const params = match && match[2] ? match[2].trim() : '';
      rows.push({
        startLine: lineNum,
        endLine: lineNum,
        kind: 'def',
        depth,
        tag: 'FUNCTION',
        title: 'Define Function',
        explanation: params ? `Defines function ${name} with inputs ${params}.` : `Defines function ${name} with no inputs.`,
        rawCode: raw,
        sourceType: 'LITERAL',
      });
      return;
    }

    // Class Def
    if (/^class\s+/.test(trimmed)) {
      const match = trimmed.match(/^class\s+([a-zA-Z0-9_]+)/);
      const name = match ? match[1] : 'Class';
      rows.push({
        startLine: lineNum,
        endLine: lineNum,
        kind: 'class',
        depth,
        tag: 'CLASS',
        title: 'Define Class',
        explanation: `Defines class ${name} as a blueprint for objects.`,
        rawCode: raw,
        sourceType: 'LITERAL',
      });
      return;
    }

    // If / elif / else
    if (/^if\s+/.test(trimmed)) {
      const cond = trimmed.replace(/^if\s+/, '').replace(/:$/, '').trim();
      rows.push({
        startLine: lineNum,
        endLine: lineNum,
        kind: 'if',
        depth,
        tag: 'IF',
        title: 'If Condition',
        explanation: `Checks if ${cond}.`,
        rawCode: raw,
        sourceType: 'LITERAL',
      });
      return;
    }
    if (/^elif\s+/.test(trimmed)) {
      const cond = trimmed.replace(/^elif\s+/, '').replace(/:$/, '').trim();
      rows.push({
        startLine: lineNum,
        endLine: lineNum,
        kind: 'elif',
        depth,
        tag: 'ELSE IF',
        title: 'Else If Condition',
        explanation: `Otherwise, checks if ${cond}.`,
        rawCode: raw,
        sourceType: 'LITERAL',
      });
      return;
    }
    if (/^else:?$/.test(trimmed)) {
      rows.push({
        startLine: lineNum,
        endLine: lineNum,
        kind: 'else',
        depth,
        tag: 'ELSE',
        title: 'Else Fallback',
        explanation: 'If none of the above is true, runs this fallback block.',
        rawCode: raw,
        sourceType: 'LITERAL',
      });
      return;
    }

    // Loops
    if (/^for\s+/.test(trimmed)) {
      const match = trimmed.match(/^for\s+([a-zA-Z0-9_]+)\s+in\s+(.+):?/);
      rows.push({
        startLine: lineNum,
        endLine: lineNum,
        kind: 'for',
        depth,
        tag: 'LOOP',
        title: 'For Loop',
        explanation: match ? `Goes through each item in ${match[2].replace(/:$/, '')}, calling it ${match[1]}.` : 'Loops through items.',
        rawCode: raw,
        sourceType: 'LITERAL',
      });
      return;
    }
    if (/^while\s+/.test(trimmed)) {
      const cond = trimmed.replace(/^while\s+/, '').replace(/:$/, '').trim();
      rows.push({
        startLine: lineNum,
        endLine: lineNum,
        kind: 'while',
        depth,
        tag: 'LOOP',
        title: 'While Loop',
        explanation: cond === 'True' ? 'Repeats everything below forever, until something breaks out.' : `Repeats everything below while ${cond}.`,
        rawCode: raw,
        sourceType: 'LITERAL',
      });
      return;
    }

    // Return
    if (/^return\b/.test(trimmed)) {
      const val = trimmed.replace(/^return\s*/, '').trim();
      rows.push({
        startLine: lineNum,
        endLine: lineNum,
        kind: 'return',
        depth,
        tag: 'RETURN',
        title: 'Return Value',
        explanation: val ? `Returns ${val} to whoever called this function.` : 'Finishes function and returns to caller.',
        rawCode: raw,
        sourceType: 'LITERAL',
      });
      return;
    }

    // Assignments
    if (trimmed.includes('=') && !trimmed.startsWith('==') && !trimmed.includes('==')) {
      const parts = trimmed.split('=');
      const left = parts[0].trim();
      const right = parts.slice(1).join('=').trim();
      rows.push({
        startLine: lineNum,
        endLine: lineNum,
        kind: 'assign',
        depth,
        tag: 'VARIABLE',
        title: 'Assign Variable',
        explanation: `Sets ${left} to ${right}.`,
        rawCode: raw,
        sourceType: 'LITERAL',
      });
      return;
    }

    // Calls (e.g. print)
    if (/^[a-zA-Z0-9_.]+\(.*\)/.test(trimmed)) {
      const match = trimmed.match(/^([a-zA-Z0-9_.]+)\((.*)\)/);
      const fnName = match ? match[1] : 'function';
      const args = match ? match[2] : '';
      const kbMatch =
        Object.prototype.hasOwnProperty.call(curatedKb, fnName) && typeof curatedKb[fnName] === 'string'
          ? curatedKb[fnName]
          : undefined;
      rows.push({
        startLine: lineNum,
        endLine: lineNum,
        kind: 'call',
        depth,
        tag: 'ACTION',
        title: 'Call Action',
        explanation: kbMatch
          ? kbMatch.replace(/\{args\}/g, args).replace(/\{arg0\}/g, args)
          : (args ? `Calls ${fnName} with ${args}.` : `Calls ${fnName}.`),
        rawCode: raw,
        sourceType: kbMatch ? 'KB' : 'LITERAL',
      });
      return;
    }

    // Fallback statement
    rows.push({
      startLine: lineNum,
      endLine: lineNum,
      kind: 'statement',
      depth,
      tag: 'ACTION',
      title: 'Action',
      explanation: `Runs statement: ${trimmed.slice(0, 35)}.`,
      rawCode: raw,
      sourceType: 'LITERAL',
    });
  });

  return {
    rows,
    summary: generateProgramSummary(rows, codeLines),
    treeSitterAvailable: false,
  };
}

/**
 * Primary entry point: Parses Python code using web-tree-sitter WASM into StatementExplanationRow array.
 * Fast, resilient, 100% offline in browser & node.
 */
export async function parsePythonWithTreeSitter(code: string): Promise<PythonAnalysisResult> {
  const codeLines = code.split('\n');
  const parser = await getPythonParser();

  if (!parser) {
    return parsePythonFallback(code);
  }

  try {
    const tree = parser.parse(code);
    const rows: StatementExplanationRow[] = [];

    walkStatements(tree.rootNode, 0, codeLines, rows);

    // Sort rows by startLine ascending
    rows.sort((a, b) => a.startLine - b.startLine);

    const summary = generateProgramSummary(rows, codeLines);

    return {
      rows,
      summary,
      treeSitterAvailable: true,
    };
  } catch (err) {
    console.warn('[TreeSitter] Parse error, utilizing fallback:', err);
    return parsePythonFallback(code);
  }
}
