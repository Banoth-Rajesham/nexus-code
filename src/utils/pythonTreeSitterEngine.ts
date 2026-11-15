// ============================================================================
// NEXUS CODE - PYTHON TREE-SITTER EXPLANATION ENGINE (STAGE 1)
// 100% Free, Offline (<100ms), WebAssembly Syntax Tree Walker & Beginner Explainer
// ============================================================================

import Parser from 'web-tree-sitter';
import pythonKbJson from '../../data/kb/python.json';
import enLocaleJson from '../../locales/en.json';
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
  hasError?: boolean;
  errorFixHint?: string;
}

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

const pythonKb: Record<string, string> = pythonKbJson;
const enLocale: {
  tags: Record<string, string>;
  templates: Record<string, string>;
  conditions: Record<string, string>;
} = enLocaleJson as any;

// Global singleton parser promise
let parserInstance: Parser | null = null;
let parserInitPromise: Promise<Parser | null> | null = null;

/**
 * Initializes web-tree-sitter with the Python WASM grammar.
 * Seamlessly handles both browser (fetch) and Node.js (filesystem) environments.
 */
export async function getPythonParser(): Promise<Parser | null> {
  if (parserInstance) return parserInstance;
  if (parserInitPromise) return parserInitPromise;

  parserInitPromise = (async () => {
    try {
      if (typeof window !== 'undefined') {
        // Browser environment: locate wasm in /tree-sitter/
        await Parser.init({
          locateFile: (scriptName: string) => `/tree-sitter/${scriptName}`,
        });
        const pyLanguage = await Parser.Language.load('/tree-sitter/tree-sitter-python.wasm');
        const p = new Parser();
        p.setLanguage(pyLanguage);
        parserInstance = p;
        return p;
      } else {
        // Node.js environment (tests, server side)
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
 * == -> "is equal to", != -> "is not equal to", >= -> "is at least",
 * <= -> "is at most", > -> "is greater than", < -> "is less than",
 * and, or, not, in, is, len(x) -> "the length of x", obj.attr -> "attr of obj"
 */
export function stringifyCondition(node: Parser.SyntaxNode | null): string {
  if (!node) return '';

  switch (node.type) {
    case 'comparison_operator': {
      // Comparison operator has children: operand, operator, operand, ...
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

    default:
      return node.text;
  }
}

/**
 * Cleanly formats arguments for human explanation.
 */
function extractCallArgs(argsNode: Parser.SyntaxNode | null): string[] {
  if (!argsNode) return [];
  const list: string[] = [];
  for (let i = 0; i < argsNode.namedChildCount; i++) {
    const c = argsNode.namedChild(i);
    if (c) list.push(c.text.trim());
  }
  return list;
}

/**
 * Explains a function call using python.json Knowledge Base or fallback.
 */
function explainCall(callNode: Parser.SyntaxNode): { explanation: string; title: string } {
  const fnNode = callNode.childForFieldName('function');
  const argsNode = callNode.childForFieldName('arguments');
  const args = extractCallArgs(argsNode);
  const rawArgs = args.join(', ');

  if (!fnNode) {
    return {
      title: 'Call Function',
      explanation: `Runs command with ${rawArgs || 'no arguments'}.`,
    };
  }

  // 1. Direct identifier call: print(), len(), etc.
  if (fnNode.type === 'identifier') {
    const fnName = fnNode.text;
    const template = pythonKb[fnName];
    if (template) {
      let sentence = template
        .replace(/\{args\}/g, rawArgs)
        .replace(/\{arg0\}/g, args[0] || 'input')
        .replace(/\{arg1\}/g, args[1] || 'value')
        .replace(/\{arg2\}/g, args[2] || 'value');
      return { title: 'Call Action', explanation: sentence };
    }
    // Record unknown call for KB growth
    recordUnknownCall(fnName, callNode.text);
    return {
      title: 'Call Function',
      explanation: args.length > 0 ? `Calls ${fnName} with ${rawArgs}.` : `Calls ${fnName}.`,
    };
  }

  // 2. Attribute method call: pygame.display.set_mode(), screen.fill(), items.append()
  if (fnNode.type === 'attribute') {
    const objNode = fnNode.childForFieldName('object');
    const attrNode = fnNode.childForFieldName('attribute');
    const objText = objNode ? objNode.text : '';
    const attrText = attrNode ? attrNode.text : '';
    const fullCallName = `${objText}.${attrText}`;
    const dotMethodName = `.${attrText}`;

    // Try full match: e.g. "pygame.display.set_mode" or "pygame.init" or "screen.fill"
    let template = pythonKb[fullCallName];
    // If not matched, try method pattern: e.g. ".append", ".tick", ".fill"
    if (!template) {
      template = pythonKb[dotMethodName];
    }

    if (template) {
      let sentence = template
        .replace(/\{obj\}/g, objText || 'object')
        .replace(/\{args\}/g, rawArgs)
        .replace(/\{arg0\}/g, args[0] || 'input')
        .replace(/\{arg1\}/g, args[1] || 'value')
        .replace(/\{arg2\}/g, args[2] || 'value')
        .replace(/\{arg3\}/g, args[3] || 'value');
      return { title: 'Action Call', explanation: sentence };
    }

    // Record unknown method call
    recordUnknownCall(fullCallName, callNode.text);
    return {
      title: 'Action Call',
      explanation: args.length > 0
        ? `Calls ${attrText} on ${objText} with ${rawArgs}.`
        : `Calls ${attrText} on ${objText}.`,
    };
  }

  return {
    title: 'Call Action',
    explanation: `Executes ${fnNode.text}(${rawArgs}).`,
  };
}

/**
 * Builds beginner-friendly explanation for assignments:
 * x = 10, a, b = 1, 2, fruits = ['apple', 'banana'], etc.
 */
function explainAssignment(assignNode: Parser.SyntaxNode): { explanation: string; title: string } {
  const left = assignNode.childForFieldName('left');
  const right = assignNode.childForFieldName('right');
  const leftText = left ? left.text.trim() : 'variable';
  const rightText = right ? right.text.trim() : 'value';

  // Multi-assignment: a, b = 1, 2
  if (leftText.includes(',') && rightText.includes(',')) {
    const leftParts = leftText.split(',').map((s) => s.trim()).filter(Boolean);
    const rightParts = rightText.split(',').map((s) => s.trim()).filter(Boolean);
    if (leftParts.length === rightParts.length) {
      return {
        title: 'Assign Variables',
        explanation: `Sets ${leftParts.join(' and ')} to ${rightParts.join(' and ')}.`,
      };
    }
  }

  // Right side is a function call: result = calculate_sum(10, 20)
  if (right && right.type === 'call') {
    const fnName = right.childForFieldName('function')?.text || 'function';
    return {
      title: 'Store Result',
      explanation: `Runs ${fnName} and stores the result in ${leftText}.`,
    };
  }

  // Right side is list: [1, 2, 3]
  if (right && right.type === 'list') {
    const count = right.namedChildCount;
    return {
      title: 'Create List',
      explanation: count === 0
        ? `Initializes an empty list in ${leftText}.`
        : `Stores a list of ${count} item${count === 1 ? '' : 's'} in ${leftText}.`,
    };
  }

  // Right side is dictionary: {'a': 1}
  if (right && right.type === 'dictionary') {
    const count = right.namedChildCount;
    return {
      title: 'Create Dictionary',
      explanation: count === 0
        ? `Initializes an empty dictionary in ${leftText}.`
        : `Stores a dictionary of ${count} key-value pair${count === 1 ? '' : 's'} in ${leftText}.`,
    };
  }

  // Right side is list comprehension: [x ** 2 for x in nums]
  if (right && right.type === 'list_comprehension') {
    return {
      title: 'List Comprehension',
      explanation: `Builds a new list in ${leftText} by transforming items in a loop.`,
    };
  }

  return {
    title: 'Assign Variable',
    explanation: `Sets ${leftText} to ${rightText}.`,
  };
}

/**
 * Builds beginner-friendly explanation for augmented assignments:
 * +=, -=, *=, /=, //=, %=, **=
 */
function explainAugmentedAssignment(node: Parser.SyntaxNode): { explanation: string; title: string } {
  const left = node.childForFieldName('left')?.text.trim() || 'variable';
  const right = node.childForFieldName('right')?.text.trim() || 'value';
  const op = node.children.find((c) => c.type.endsWith('='))?.type || '+=';

  switch (op) {
    case '+=':
      return { title: 'Update Variable', explanation: `Adds ${right} to ${left}.` };
    case '-=':
      return { title: 'Update Variable', explanation: `Subtracts ${right} from ${left}.` };
    case '*=':
      return { title: 'Update Variable', explanation: `Multiplies ${left} by ${right}.` };
    case '/=':
      return { title: 'Update Variable', explanation: `Divides ${left} by ${right}.` };
    case '//=':
      return { title: 'Update Variable', explanation: `Divides ${left} by ${right} rounding down.` };
    case '%=':
      return { title: 'Update Variable', explanation: `Calculates remainder of ${left} divided by ${right}.` };
    case '**=':
      return { title: 'Update Variable', explanation: `Raises ${left} to the power of ${right}.` };
    default:
      return { title: 'Update Variable', explanation: `Updates ${left} with ${right}.` };
  }
}

/**
 * Diagnoses syntax error hints for beginner feedback.
 */
function diagnoseSyntaxError(node: Parser.SyntaxNode, lineText: string): string {
  const trimmed = lineText.trim();
  if (/^(if|elif|else|while|for|def|class|try|except|finally|with)\b.*[^:]$/.test(trimmed)) {
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

/**
 * Core AST Visitor: Walks statements recursively and produces StatementExplanationRow array.
 */
function walkStatements(
  node: Parser.SyntaxNode,
  depth: number,
  codeLines: string[],
  rows: StatementExplanationRow[]
): void {
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
        hasError: true,
        errorFixHint: hint,
      });

      // Still walk any valid nested children inside the error to salvage explanations!
      for (let j = 0; j < child.namedChildCount; j++) {
        const sub = child.namedChild(j)!;
        if (sub.type !== 'ERROR' && !sub.isMissing()) {
          walkStatements(sub, depth, codeLines, rows);
        }
      }
      continue;
    }

    // ── 3. EXPRESSION STATEMENTS (Assignment, AugAssign, Calls) ──
    if (child.type === 'expression_statement') {
      const expr = child.namedChild(0);
      if (!expr) continue;

      if (expr.type === 'assignment') {
        const { explanation, title } = explainAssignment(expr);
        rows.push({
          startLine,
          endLine,
          kind: 'assignment',
          depth,
          tag: 'VARIABLE',
          title,
          explanation,
          rawCode,
        });
        continue;
      }

      if (expr.type === 'augmented_assignment') {
        const { explanation, title } = explainAugmentedAssignment(expr);
        rows.push({
          startLine,
          endLine,
          kind: 'augmented_assignment',
          depth,
          tag: 'VARIABLE',
          title,
          explanation,
          rawCode,
        });
        continue;
      }

      if (expr.type === 'call') {
        const { explanation, title } = explainCall(expr);
        rows.push({
          startLine,
          endLine,
          kind: 'call',
          depth,
          tag: 'ACTION',
          title,
          explanation,
          rawCode,
        });
        continue;
      }

      if (expr.type === 'yield') {
        rows.push({
          startLine,
          endLine,
          kind: 'yield',
          depth,
          tag: 'RETURN',
          title: 'Yield Value',
          explanation: `Pauses and yields ${expr.namedChild(0)?.text || 'value'} to caller.`,
          rawCode,
        });
        continue;
      }

      // Other expressions (standalone string docstring or calculation)
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
        });
        continue;
      }

      rows.push({
        startLine,
        endLine,
        kind: expr.type,
        depth,
        tag: 'ACTION',
        title: 'Evaluate Expression',
        explanation: `Evaluates ${expr.text.slice(0, 35)}.`,
        rawCode,
      });
      continue;
    }

    // ── 4. IMPORT STATEMENTS ──
    if (child.type === 'import_statement') {
      const names = child.namedChildren.map((c) => c.text).join(', ');
      rows.push({
        startLine,
        endLine,
        kind: 'import_statement',
        depth,
        tag: 'IMPORT',
        title: 'Import Module',
        explanation: `Imports module ${names} to use its tools.`,
        rawCode,
      });
      continue;
    }

    if (child.type === 'import_from_statement') {
      const mod = child.childForFieldName('module_name')?.text || 'module';
      const names: string[] = [];
      for (let j = 0; j < child.namedChildCount; j++) {
        const c = child.namedChild(j)!;
        if (c.type === 'dotted_name' && c.text !== mod) names.push(c.text);
        else if (c.type === 'identifier') names.push(c.text);
      }
      rows.push({
        startLine,
        endLine,
        kind: 'import_from_statement',
        depth,
        tag: 'IMPORT',
        title: 'Import From Module',
        explanation: `Imports ${names.join(', ') || 'tools'} from library ${mod}.`,
        rawCode,
      });
      continue;
    }

    // ── 5. FUNCTION DEFINITION ──
    if (child.type === 'function_definition') {
      const name = child.childForFieldName('name')?.text || 'function';
      const params = child.childForFieldName('parameters')?.text || '()';
      const cleanParams = params.replace(/^\(|\)$/g, '').trim();
      const body = child.childForFieldName('body');
      const headerLine = child.startPosition.row + 1;

      rows.push({
        startLine: headerLine,
        endLine: headerLine,
        kind: 'function_definition',
        depth,
        tag: 'FUNCTION',
        title: 'Define Function',
        explanation: cleanParams
          ? `Defines function ${name} with inputs ${cleanParams}.`
          : `Defines function ${name} with no inputs.`,
        rawCode: codeLines[headerLine - 1] || child.text.split('\n')[0],
      });

      if (body) {
        walkStatements(body, depth + 1, codeLines, rows);
      }
      continue;
    }

    // ── 6. CLASS DEFINITION ──
    if (child.type === 'class_definition') {
      const name = child.childForFieldName('name')?.text || 'Class';
      const superclasses = child.childForFieldName('superclasses')?.text;
      const body = child.childForFieldName('body');
      const headerLine = child.startPosition.row + 1;

      rows.push({
        startLine: headerLine,
        endLine: headerLine,
        kind: 'class_definition',
        depth,
        tag: 'CLASS',
        title: 'Define Class',
        explanation: superclasses
          ? `Defines class ${name} inheriting from ${superclasses.replace(/^\(|\)$/g, '')}.`
          : `Defines class ${name} as a blueprint for objects.`,
        rawCode: codeLines[headerLine - 1] || child.text.split('\n')[0],
      });

      if (body) {
        walkStatements(body, depth + 1, codeLines, rows);
      }
      continue;
    }

    // ── 7. IF / ELIF / ELSE ──
    if (child.type === 'if_statement') {
      const condition = child.childForFieldName('condition');
      const consequence = child.childForFieldName('consequence');
      const headerLine = child.startPosition.row + 1;
      const condWords = stringifyCondition(condition);

      rows.push({
        startLine: headerLine,
        endLine: headerLine,
        kind: 'if_statement',
        depth,
        tag: 'IF',
        title: 'If Condition',
        explanation: `Checks if ${condWords}.`,
        rawCode: codeLines[headerLine - 1] || '',
      });

      if (consequence) {
        walkStatements(consequence, depth + 1, codeLines, rows);
      }

      // Check for elif_clause or else_clause in children
      for (let j = 0; j < child.childCount; j++) {
        const sub = child.child(j)!;
        if (sub.type === 'elif_clause') {
          const elifCond = sub.childForFieldName('condition');
          const elifBody = sub.childForFieldName('consequence');
          const elifLine = sub.startPosition.row + 1;
          rows.push({
            startLine: elifLine,
            endLine: elifLine,
            kind: 'elif_clause',
            depth,
            tag: 'ELSE IF',
            title: 'Else If Condition',
            explanation: `Otherwise, checks if ${stringifyCondition(elifCond)}.`,
            rawCode: codeLines[elifLine - 1] || '',
          });
          if (elifBody) {
            walkStatements(elifBody, depth + 1, codeLines, rows);
          }
        } else if (sub.type === 'else_clause') {
          const elseBody = sub.childForFieldName('body');
          const elseLine = sub.startPosition.row + 1;
          rows.push({
            startLine: elseLine,
            endLine: elseLine,
            kind: 'else_clause',
            depth,
            tag: 'ELSE',
            title: 'Else Fallback',
            explanation: 'If none of the above is true, runs this fallback block.',
            rawCode: codeLines[elseLine - 1] || '',
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
      const left = child.childForFieldName('left')?.text || 'item';
      const right = child.childForFieldName('right');
      const body = child.childForFieldName('body');
      const headerLine = child.startPosition.row + 1;

      let explanation = `Goes through each item in ${right?.text || 'collection'}, calling it ${left}.`;
      if (right && right.type === 'call' && right.childForFieldName('function')?.text === 'range') {
        const args = extractCallArgs(right.childForFieldName('arguments'));
        if (args.length === 1) {
          explanation = `Repeats ${args[0]} times, with ${left} going from 0 up to ${args[0]} minus 1.`;
        } else if (args.length === 2) {
          explanation = `Repeats with ${left} going from ${args[0]} up to ${args[1]} minus 1.`;
        }
      }

      rows.push({
        startLine: headerLine,
        endLine: headerLine,
        kind: 'for_statement',
        depth,
        tag: 'LOOP',
        title: 'For Loop',
        explanation,
        rawCode: codeLines[headerLine - 1] || '',
      });

      if (body) {
        walkStatements(body, depth + 1, codeLines, rows);
      }
      continue;
    }

    // ── 9. WHILE LOOPS ──
    if (child.type === 'while_statement') {
      const condition = child.childForFieldName('condition');
      const body = child.childForFieldName('body');
      const headerLine = child.startPosition.row + 1;
      const condText = condition?.text.trim();

      const explanation = condText === 'True'
        ? 'Repeats everything below forever, until something breaks out.'
        : `Repeats everything below while ${stringifyCondition(condition)}.`;

      rows.push({
        startLine: headerLine,
        endLine: headerLine,
        kind: 'while_statement',
        depth,
        tag: 'LOOP',
        title: 'While Loop',
        explanation,
        rawCode: codeLines[headerLine - 1] || '',
      });

      if (body) {
        walkStatements(body, depth + 1, codeLines, rows);
      }
      continue;
    }

    // ── 10. TRY / EXCEPT / FINALLY ──
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
      });

      if (body) {
        walkStatements(body, depth + 1, codeLines, rows);
      }

      // Check clauses: except_clause, finally_clause
      for (let j = 0; j < child.childCount; j++) {
        const sub = child.child(j)!;
        if (sub.type === 'except_clause') {
          const exLine = sub.startPosition.row + 1;
          const exBody = sub.namedChildren.find((c) => c.type === 'block');
          const exType = sub.namedChildren.find((c) => c.type !== 'block' && c.type !== 'as_pattern')?.text;

          rows.push({
            startLine: exLine,
            endLine: exLine,
            kind: 'except_clause',
            depth,
            tag: 'ACTION',
            title: 'Catch Error',
            explanation: exType
              ? `Catches error ${exType} if it happens above.`
              : 'Catches any error that occurs in the block above.',
            rawCode: codeLines[exLine - 1] || '',
          });

          if (exBody) {
            walkStatements(exBody, depth + 1, codeLines, rows);
          }
        } else if (sub.type === 'finally_clause') {
          const finLine = sub.startPosition.row + 1;
          const finBody = sub.namedChildren.find((c) => c.type === 'block');
          rows.push({
            startLine: finLine,
            endLine: finLine,
            kind: 'finally_clause',
            depth,
            tag: 'ACTION',
            title: 'Finally Block',
            explanation: 'Runs this cleanup block no matter what happened.',
            rawCode: codeLines[finLine - 1] || '',
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
      const headerLine = child.startPosition.row + 1;
      const body = child.childForFieldName('body');
      rows.push({
        startLine: headerLine,
        endLine: headerLine,
        kind: 'with_statement',
        depth,
        tag: 'ACTION',
        title: 'With Resource',
        explanation: `Opens and safely manages ${child.namedChild(0)?.text || 'resource'}.`,
        rawCode: codeLines[headerLine - 1] || '',
      });
      if (body) {
        walkStatements(body, depth + 1, codeLines, rows);
      }
      continue;
    }

    // ── 12. FLOW CONTROLS: RETURN, BREAK, CONTINUE, PASS, RAISE, ASSERT ──
    if (child.type === 'return_statement') {
      const val = child.namedChild(0)?.text;
      rows.push({
        startLine,
        endLine,
        kind: 'return_statement',
        depth,
        tag: 'RETURN',
        title: 'Return Value',
        explanation: val
          ? `Returns ${val} to whoever called this function.`
          : 'Exits the function.',
        rawCode,
      });
      continue;
    }

    if (child.type === 'break_statement') {
      rows.push({
        startLine,
        endLine,
        kind: 'break_statement',
        depth,
        tag: 'STOP',
        title: 'Break Loop',
        explanation: 'Stops the loop immediately and exits.',
        rawCode,
      });
      continue;
    }

    if (child.type === 'continue_statement') {
      rows.push({
        startLine,
        endLine,
        kind: 'continue_statement',
        depth,
        tag: 'SKIP',
        title: 'Skip Cycle',
        explanation: 'Skips the rest of this cycle and starts the next.',
        rawCode,
      });
      continue;
    }

    if (child.type === 'pass_statement') {
      rows.push({
        startLine,
        endLine,
        kind: 'pass_statement',
        depth,
        tag: 'ACTION',
        title: 'Pass Placeholder',
        explanation: 'Does nothing and moves to the next line.',
        rawCode,
      });
      continue;
    }

    if (child.type === 'raise_statement') {
      const err = child.namedChild(0)?.text || 'Exception';
      rows.push({
        startLine,
        endLine,
        kind: 'raise_statement',
        depth,
        tag: 'ACTION',
        title: 'Raise Error',
        explanation: `Triggers an error: ${err}.`,
        rawCode,
      });
      continue;
    }

    if (child.type === 'assert_statement') {
      const cond = stringifyCondition(child.namedChild(0));
      rows.push({
        startLine,
        endLine,
        kind: 'assert_statement',
        depth,
        tag: 'ACTION',
        title: 'Assert Condition',
        explanation: `Checks that ${cond} is true, or stops execution.`,
        rawCode,
      });
      continue;
    }

    if (child.type === 'global_statement' || child.type === 'nonlocal_statement') {
      const names = child.namedChildren.map((c) => c.text).join(', ');
      rows.push({
        startLine,
        endLine,
        kind: child.type,
        depth,
        tag: 'VARIABLE',
        title: 'Scope Declaration',
        explanation: `Declares ${names} as ${child.type === 'global_statement' ? 'global' : 'nonlocal'} variables.`,
        rawCode,
      });
      continue;
    }

    if (child.type === 'delete_statement') {
      const targets = child.namedChildren.map((c) => c.text).join(', ');
      rows.push({
        startLine,
        endLine,
        kind: 'delete_statement',
        depth,
        tag: 'ACTION',
        title: 'Delete Variable',
        explanation: `Deletes ${targets} from memory.`,
        rawCode,
      });
      continue;
    }

    // ── 13. BLOCK CONTAINER / GENERIC FALLBACK ──
    if (child.type === 'block') {
      walkStatements(child, depth, codeLines, rows);
      continue;
    }

    // Fallback: don't crash, generate safe statement row
    rows.push({
      startLine,
      endLine,
      kind: child.type,
      depth,
      tag: 'ACTION',
      title: 'Action',
      explanation: `Executes statement: ${rawCode.slice(0, 35)}.`,
      rawCode,
    });
  }
}

/**
 * Generates an executive beginner-friendly summary card: "What this program does".
 */
function generateProgramSummary(
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

  // Derive domain title and concise beginner overview
  let title = 'Sequential Python Program';
  let descParts: string[] = [];

  if (imports.includes('pygame')) {
    title = 'Pygame 2D Graphical Application';
    descParts.push('Initializes a graphical window and runs an interactive animation loop.');
  } else if (imports.includes('tkinter')) {
    title = 'Desktop GUI Application';
    descParts.push('Builds a desktop user interface with buttons and interactive widgets.');
  } else if (imports.includes('numpy') || imports.includes('pandas')) {
    title = 'Data Processing & Array Computation';
    descParts.push('Manipulates structured data arrays and performs analytical computations.');
  } else if (imports.includes('requests')) {
    title = 'Web API Client Script';
    descParts.push('Connects to remote web services and transfers network data.');
  } else if (classes > 0) {
    title = 'Object-Oriented Python Blueprint';
    descParts.push(`Constructs ${classes} custom class blueprint${classes > 1 ? 's' : ''} to model application state.`);
  } else if (functions > 0) {
    title = 'Modular Function-Driven Program';
    descParts.push(`Organizes logic into ${functions} modular function${functions > 1 ? 's' : ''}.`);
  } else {
    descParts.push('Executes top-to-bottom sequential instructions to compute values.');
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

    // Comments
    if (trimmed.startsWith('#')) {
      const clean = trimmed.replace(/^#\s*/, '');
      rows.push({
        startLine: lineNum,
        endLine: lineNum,
        kind: 'comment',
        depth: 0,
        tag: 'COMMENT',
        title: 'Comment',
        explanation: clean ? `Developer note: "${clean}".` : 'Developer comment.',
        rawCode: raw,
      });
      return;
    }

    // Indentation depth
    const indentMatch = raw.match(/^\s*/);
    const depth = indentMatch ? Math.floor(indentMatch[0].length / 4) : 0;

    // Imports
    if (/^import\s+/.test(trimmed)) {
      const mod = trimmed.replace(/^import\s+/, '').split(',')[0].trim();
      rows.push({
        startLine: lineNum,
        endLine: lineNum,
        kind: 'import',
        depth,
        tag: 'IMPORT',
        title: 'Import Module',
        explanation: `Imports module ${mod} to use its tools.`,
        rawCode: raw,
      });
      return;
    }
    if (/^from\s+/.test(trimmed)) {
      const match = trimmed.match(/^from\s+([a-zA-Z0-9_.]+)\s+import\s+(.+)$/);
      rows.push({
        startLine: lineNum,
        endLine: lineNum,
        kind: 'import_from',
        depth,
        tag: 'IMPORT',
        title: 'Import From Module',
        explanation: match ? `Imports ${match[2]} from library ${match[1]}.` : 'Imports tools from module.',
        rawCode: raw,
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
        explanation: val ? `Returns ${val} to whoever called this function.` : 'Exits the function.',
        rawCode: raw,
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
      });
      return;
    }

    // Calls (e.g. print)
    if (/^[a-zA-Z0-9_.]+\(.*\)/.test(trimmed)) {
      const match = trimmed.match(/^([a-zA-Z0-9_.]+)\((.*)\)/);
      const fnName = match ? match[1] : 'function';
      const args = match ? match[2] : '';
      const kbMatch = pythonKb[fnName];
      rows.push({
        startLine: lineNum,
        endLine: lineNum,
        kind: 'call',
        depth,
        tag: 'ACTION',
        title: 'Call Action',
        explanation: kbMatch ? kbMatch.replace(/\{args\}/g, args).replace(/\{arg0\}/g, args) : `Calls ${fnName} with ${args || 'no arguments'}.`,
        rawCode: raw,
      });
      return;
    }

    // Default
    rows.push({
      startLine: lineNum,
      endLine: lineNum,
      kind: 'statement',
      depth,
      tag: 'ACTION',
      title: 'Action',
      explanation: `Executes ${trimmed.slice(0, 35)}.`,
      rawCode: raw,
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
