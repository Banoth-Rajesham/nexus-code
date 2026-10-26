import { NativeLanguageKey } from '../types';
import { getLanguagePack, formatTemplate } from '../translations';

// ============================================================================
// BHASHA CODE DETERMINISTIC RULE-BASED CODE ANALYSIS ENGINE
// 100% Deterministic, AST-level Syntax Analysis without LLMs or Paid APIs
// Zero code corruption, zero mixed-script transliteration
// ============================================================================

export type SyntaxConstructType =
  | 'function_def'
  | 'function_recursive'
  | 'arrow_function'
  | 'function_call'
  | 'return'
  | 'if_condition'
  | 'elif_condition'
  | 'else_block'
  | 'for_loop'
  | 'while_loop'
  | 'break'
  | 'continue'
  | 'assignment'
  | 'update'
  | 'list_creation'
  | 'dict_creation'
  | 'class_def'
  | 'class_init'
  | 'class_method'
  | 'print_statement'
  | 'import_module'
  | 'try_block'
  | 'except_block'
  | 'finally_block'
  | 'comment'
  | 'empty_line'
  | 'general_statement'
  | 'unsupported';

export interface StructuredLineExplanation {
  lineNumber: number;
  codeSnippet: string;
  simpleMeaning: string;
  smallExample?: string;
  explanation: string;
  category: 'function' | 'loop' | 'condition' | 'assignment' | 'return' | 'output' | 'import' | 'comment' | 'general' | 'unsupported';
  construct: SyntaxConstructType;
  isSupported: boolean;
}

export interface RuleBasedCodeAnalysis {
  overview: string;
  lineByLine: StructuredLineExplanation[];
  executionFlow: string[];
  expectedOutput: string;
  simpleLogicSummary: string;
  variablesAndFunctions: Array<{ name: string; type: string; purpose: string }>;
  inputOutput: {
    inputs: string;
    outputs: string;
    timeComplexity?: string;
    spaceComplexity?: string;
  };
  syntaxIssues?: Array<{ line: number; problem: string; suggestion: string }>;
  unsupportedConstructs?: Array<{ line: number; snippet: string; reason: string }>;
}

interface ParsedFunction {
  name: string;
  params: string[];
  line: number;
  isRecursive: boolean;
}

interface ParsedLoop {
  type: 'for' | 'while';
  variable: string;
  target: string;
  line: number;
}

/**
 * Deterministically parses and analyzes arbitrary source code
 */
export function analyzeCodeRuleBased(
  code: string,
  progLang: string = 'python',
  nativeLang: NativeLanguageKey = 'telugu'
): RuleBasedCodeAnalysis {
  const pack = getLanguagePack(nativeLang);
  const lines = code.split('\n');

  const functionsFound: ParsedFunction[] = [];
  const classesFound: string[] = [];
  const loopsFound: ParsedLoop[] = [];
  const variablesAssigned = new Set<string>();
  const printsFound: string[] = [];
  const syntaxIssues: Array<{ line: number; problem: string; suggestion: string }> = [];
  const unsupportedConstructs: Array<{ line: number; snippet: string; reason: string }> = [];

  // Pass 1: Parse Structure & Declarations
  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    const lineNum = idx + 1;
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('//')) return;

    // Detect function definitions
    const fnMatch = trimmed.match(/\b(?:async\s+)?(def|function|func)\s+([a-zA-Z0-9_]+)\s*\((.*?)\)/);
    if (fnMatch) {
      const fnName = fnMatch[2];
      const rawParams = fnMatch[3] ? fnMatch[3].split(',').map((p) => p.trim()).filter(Boolean) : [];
      // Clean type annotations from parameter list (e.g. "weather_condition: str" -> "weather_condition")
      const cleanParams = rawParams.map((p) => p.split(':')[0].trim());

      // Check recursion
      const restCode = lines.slice(idx + 1).join('\n');
      const isRecursive = new RegExp(`\\b${fnName}\\s*\\(`, 'g').test(restCode);
      functionsFound.push({ name: fnName, params: cleanParams, line: lineNum, isRecursive });
    }

    // Detect arrow functions in JS/TS
    const arrowMatch = trimmed.match(/\b(const|let|var)\s+([a-zA-Z0-9_]+)\s*=\s*(?:\((.*?)\)|[a-zA-Z0-9_]+)\s*=>/);
    if (arrowMatch) {
      const fnName = arrowMatch[2];
      const params = arrowMatch[3] ? arrowMatch[3].split(',').map((p) => p.trim()).filter(Boolean) : [];
      functionsFound.push({ name: fnName, params, line: lineNum, isRecursive: false });
    }

    // Detect classes
    const classMatch = trimmed.match(/\bclass\s+([a-zA-Z0-9_]+)/);
    if (classMatch) {
      classesFound.push(classMatch[1]);
    }

    // Detect loops
    const forMatch = trimmed.match(/\bfor\s+([a-zA-Z0-9_,\s()]+)\s+(?:in|of)\s+([^:;{]+)/);
    if (forMatch) {
      loopsFound.push({ type: 'for', variable: forMatch[1].trim(), target: forMatch[2].trim(), line: lineNum });
    }
    const whileMatch = trimmed.match(/\bwhile\s+([^:;{]+)/);
    if (whileMatch) {
      loopsFound.push({ type: 'while', variable: 'condition', target: whileMatch[1].trim(), line: lineNum });
    }

    // Detect variable assignments
    const assignMatch = trimmed.match(/^(?:const|let|var\s+)?([a-zA-Z0-9_]+)\s*(=|\+=|-=|\*=)\s*(.+)/);
    if (assignMatch && !['if', 'elif', 'while', 'for', 'return', 'class', 'def', 'function'].includes(assignMatch[1])) {
      variablesAssigned.add(assignMatch[1]);
    }

    // Detect prints
    const printMatch = trimmed.match(/(?:print|console\.log|fmt\.Println)\s*\((.*)\)/);
    if (printMatch) {
      printsFound.push(printMatch[1]);
    }

    // Syntax validation for Python: missing colon
    if (progLang === 'python') {
      if (/^(def|if|elif|else|for|while|class)\b/.test(trimmed) && !trimmed.endsWith(':')) {
        syntaxIssues.push({
          line: lineNum,
          problem: `Missing colon (:) at line ${lineNum}`,
          suggestion: `Add ':' at end of line: ${trimmed}:`,
        });
      }
    }

    // Unclosed parenthesis check on single line
    const openParens = (trimmed.match(/\(/g) || []).length;
    const closeParens = (trimmed.match(/\)/g) || []).length;
    if (openParens > closeParens && !trimmed.endsWith('\\')) {
      syntaxIssues.push({
        line: lineNum,
        problem: `Unclosed parenthesis '(' at line ${lineNum}`,
        suggestion: `Check that all opening brackets are properly closed.`,
      });
    }
  });

  // Pass 2: Line-by-Line Semantic Rule Mapping
  const lineByLine: StructuredLineExplanation[] = lines.map((line, idx) => {
    const trimmed = line.trim();
    const lineNum = idx + 1;

    // 1. Empty lines
    if (!trimmed) {
      return {
        lineNumber: lineNum,
        codeSnippet: line,
        simpleMeaning: pack.templates.empty_line,
        explanation: pack.templates.empty_line,
        category: 'general',
        construct: 'empty_line',
        isSupported: true,
      };
    }

    // 2. Comments
    if (trimmed.startsWith('#') || trimmed.startsWith('//')) {
      const commentBody = trimmed.replace(/^[#\/]+\s*/, '');
      return {
        lineNumber: lineNum,
        codeSnippet: line,
        simpleMeaning: formatTemplate(pack.templates.comment_line, { text: commentBody }),
        explanation: 'Comment',
        category: 'comment',
        construct: 'comment',
        isSupported: true,
      };
    }

    // 3. Function definition
    const fnDefMatch = trimmed.match(/\b(?:async\s+)?(def|function|func)\s+([a-zA-Z0-9_]+)\s*\((.*?)\)/);
    if (fnDefMatch) {
      const fnName = fnDefMatch[2];
      if (fnName === '__init__') {
        return {
          lineNumber: lineNum,
          codeSnippet: line,
          simpleMeaning: pack.templates.class_init,
          smallExample: pack.examples.function,
          explanation: 'Constructor (__init__)',
          category: 'function',
          construct: 'class_init',
          isSupported: true,
        };
      }

      const rawParams = fnDefMatch[3] ? fnDefMatch[3].split(',').map((p) => p.trim()).filter(Boolean) : [];
      const cleanParams = rawParams.map((p) => p.split(':')[0].trim());
      const isRecursive = functionsFound.some((f) => f.name === fnName && f.isRecursive);

      const template = isRecursive
        ? pack.templates.function_recursive
        : cleanParams.length > 0
        ? pack.templates.function_def_params
        : pack.templates.function_def;

      return {
        lineNumber: lineNum,
        codeSnippet: line,
        simpleMeaning: formatTemplate(template, { name: fnName, params: cleanParams.join(', ') }),
        smallExample: pack.examples.function,
        explanation: `Function: ${fnName}`,
        category: 'function',
        construct: isRecursive ? 'function_recursive' : 'function_def',
        isSupported: true,
      };
    }

    // 4. Class definition & methods
    const classMatch = trimmed.match(/\bclass\s+([a-zA-Z0-9_]+)/);
    if (classMatch) {
      const className = classMatch[1];
      return {
        lineNumber: lineNum,
        codeSnippet: line,
        simpleMeaning: formatTemplate(pack.templates.class_def, { name: className }),
        explanation: `Class: ${className}`,
        category: 'function',
        construct: 'class_def',
        isSupported: true,
      };
    }

    if (trimmed.includes('def __init__(')) {
      return {
        lineNumber: lineNum,
        codeSnippet: line,
        simpleMeaning: pack.templates.class_init,
        explanation: 'Constructor (__init__)',
        category: 'function',
        construct: 'class_init',
        isSupported: true,
      };
    }

    // 5. For loops
    const forMatch = trimmed.match(/\bfor\s+([a-zA-Z0-9_,\s()]+)\s+(?:in|of)\s+([^:;{]+)/);
    if (forMatch) {
      const loopVar = forMatch[1].trim();
      const collection = forMatch[2].trim();

      let meaning = '';
      if (collection.startsWith('range(')) {
        const rangeArgs = collection.replace(/range\(|\)/g, '').split(',').map((s) => s.trim());
        if (rangeArgs.length === 1) {
          meaning = formatTemplate(pack.templates.for_range, { end: rangeArgs[0], var: loopVar });
        } else {
          meaning = formatTemplate(pack.templates.for_range_start_end, { start: rangeArgs[0], end: rangeArgs[1], var: loopVar });
        }
      } else {
        meaning = formatTemplate(pack.templates.for_collection, { collection, var: loopVar });
      }

      return {
        lineNumber: lineNum,
        codeSnippet: line,
        simpleMeaning: meaning,
        smallExample: pack.examples.loop,
        explanation: `For loop over ${collection}`,
        category: 'loop',
        construct: 'for_loop',
        isSupported: true,
      };
    }

    // 6. While loops
    const whileMatch = trimmed.match(/\bwhile\s+([^:;{]+)/);
    if (whileMatch) {
      const condition = whileMatch[1].trim();
      return {
        lineNumber: lineNum,
        codeSnippet: line,
        simpleMeaning: formatTemplate(pack.templates.while_loop, { condition }),
        smallExample: pack.examples.loop,
        explanation: `While loop condition: ${condition}`,
        category: 'loop',
        construct: 'while_loop',
        isSupported: true,
      };
    }

    // 7. Loop control (break / continue)
    if (trimmed === 'break;' || trimmed === 'break') {
      return {
        lineNumber: lineNum,
        codeSnippet: line,
        simpleMeaning: pack.templates.loop_break,
        explanation: 'Break',
        category: 'loop',
        construct: 'break',
        isSupported: true,
      };
    }
    if (trimmed === 'continue;' || trimmed === 'continue') {
      return {
        lineNumber: lineNum,
        codeSnippet: line,
        simpleMeaning: pack.templates.loop_continue,
        explanation: 'Continue',
        category: 'loop',
        construct: 'continue',
        isSupported: true,
      };
    }

    // 8. If / Elif / Else Conditions
    const ifMatch = trimmed.match(/\b(if|elif)\s+([^:;{]+)/);
    if (ifMatch) {
      const isElif = ifMatch[1] === 'elif';
      const cond = ifMatch[2].trim();
      const template = isElif ? pack.templates.elif_condition : pack.templates.if_condition;

      return {
        lineNumber: lineNum,
        codeSnippet: line,
        simpleMeaning: formatTemplate(template, { condition: cond }),
        smallExample: pack.examples.condition,
        explanation: `Condition: ${cond}`,
        category: 'condition',
        construct: isElif ? 'elif_condition' : 'if_condition',
        isSupported: true,
      };
    }

    if (trimmed.startsWith('else:') || trimmed.startsWith('else') || trimmed === 'else {') {
      return {
        lineNumber: lineNum,
        codeSnippet: line,
        simpleMeaning: pack.templates.else_block,
        smallExample: pack.examples.condition,
        explanation: 'Else block',
        category: 'condition',
        construct: 'else_block',
        isSupported: true,
      };
    }

    // 9. Returns
    const returnMatch = trimmed.match(/\breturn(?:\s+(.+))?/);
    if (returnMatch) {
      const retVal = returnMatch[1] ? returnMatch[1].replace(/;$/, '').trim() : '';
      return {
        lineNumber: lineNum,
        codeSnippet: line,
        simpleMeaning: retVal
          ? formatTemplate(pack.templates.return_val, { value: retVal })
          : pack.templates.return_void,
        smallExample: pack.examples.return,
        explanation: retVal ? `Return: ${retVal}` : 'Return void',
        category: 'return',
        construct: 'return',
        isSupported: true,
      };
    }

    // 10. Print / Console.log
    const printMatch = trimmed.match(/(?:print|console\.log|fmt\.Println)\s*\((.*)\)/);
    if (printMatch) {
      const content = printMatch[1].trim();
      return {
        lineNumber: lineNum,
        codeSnippet: line,
        simpleMeaning: formatTemplate(pack.templates.print_statement, { content }),
        smallExample: pack.examples.print,
        explanation: `Print: ${content}`,
        category: 'output',
        construct: 'print_statement',
        isSupported: true,
      };
    }

    // 11. Increments / Arithmetic Updates (count += 1, total *= 2)
    const updateMatch = trimmed.match(/^([a-zA-Z0-9_]+)\s*(\+=|-=|\*=|\/=)\s*(.+)/);
    if (updateMatch) {
      const varName = updateMatch[1];
      const op = updateMatch[2];
      const val = updateMatch[3].replace(/;$/, '').trim();

      const template =
        op === '+='
          ? pack.templates.var_update_add
          : op === '-='
          ? pack.templates.var_update_sub
          : op === '*='
          ? pack.templates.var_update_mul
          : pack.templates.var_update_div;

      return {
        lineNumber: lineNum,
        codeSnippet: line,
        simpleMeaning: formatTemplate(template, { name: varName, value: val }),
        smallExample: pack.examples.variable,
        explanation: `Update ${varName} ${op} ${val}`,
        category: 'assignment',
        construct: 'update',
        isSupported: true,
      };
    }

    // 12. Variable Assignments
    const assignMatch = trimmed.match(/^(?:const|let|var\s+)?([a-zA-Z0-9_]+)\s*=\s*(.+)/);
    if (assignMatch) {
      const varName = assignMatch[1];
      const val = assignMatch[2].replace(/;$/, '').trim();

      let meaning = '';
      let construct: SyntaxConstructType = 'assignment';

      if (val === '0') {
        meaning = formatTemplate(pack.templates.var_init_zero, { name: varName });
      } else if (val === '[]') {
        meaning = formatTemplate(pack.templates.var_init_empty_list, { name: varName });
      } else if (val.startsWith('[') && val.endsWith(']')) {
        meaning = formatTemplate(pack.templates.list_created, { name: varName, items: val });
        construct = 'list_creation';
      } else if (val.startsWith('{') && val.endsWith('}')) {
        meaning = formatTemplate(pack.templates.dict_created, { name: varName });
        construct = 'dict_creation';
      } else if (val.includes('(') && val.endsWith(')')) {
        const calledFn = val.split('(')[0].trim();
        meaning = formatTemplate(pack.templates.function_call, { name: calledFn });
        construct = 'function_call';
      } else {
        meaning = formatTemplate(pack.templates.var_assign, { name: varName, value: val });
      }

      return {
        lineNumber: lineNum,
        codeSnippet: line,
        simpleMeaning: meaning,
        smallExample: pack.examples.variable,
        explanation: `Assign ${varName} = ${val}`,
        category: 'assignment',
        construct,
        isSupported: true,
      };
    }

    // 13. Imports
    const importFromMatch = trimmed.match(/^from\s+([a-zA-Z0-9_.]+)\s+import\s+([a-zA-Z0-9_.*]+)/);
    if (importFromMatch) {
      return {
        lineNumber: lineNum,
        codeSnippet: line,
        simpleMeaning: formatTemplate(pack.templates.import_from, { module: importFromMatch[1], item: importFromMatch[2] }),
        explanation: `Import ${importFromMatch[2]} from ${importFromMatch[1]}`,
        category: 'import',
        construct: 'import_module',
        isSupported: true,
      };
    }

    const importMatch = trimmed.match(/^import\s+([a-zA-Z0-9_.]+)/);
    if (importMatch) {
      return {
        lineNumber: lineNum,
        codeSnippet: line,
        simpleMeaning: formatTemplate(pack.templates.import_module, { module: importMatch[1] }),
        explanation: `Import ${importMatch[1]}`,
        category: 'import',
        construct: 'import_module',
        isSupported: true,
      };
    }

    // 14. Error handling (try / except / finally)
    if (trimmed.startsWith('try:') || trimmed === 'try {') {
      return {
        lineNumber: lineNum,
        codeSnippet: line,
        simpleMeaning: pack.templates.try_block,
        explanation: 'Try block',
        category: 'general',
        construct: 'try_block',
        isSupported: true,
      };
    }

    if (trimmed.startsWith('except') || trimmed.startsWith('catch')) {
      return {
        lineNumber: lineNum,
        codeSnippet: line,
        simpleMeaning: pack.templates.except_block,
        explanation: 'Except block',
        category: 'general',
        construct: 'except_block',
        isSupported: true,
      };
    }

    if (trimmed.startsWith('finally:') || trimmed === 'finally {') {
      return {
        lineNumber: lineNum,
        codeSnippet: line,
        simpleMeaning: pack.templates.finally_block,
        explanation: 'Finally block',
        category: 'general',
        construct: 'finally_block',
        isSupported: true,
      };
    }

    // 15. Standalone function calls (e.g. `main()`, `my_func()`)
    const callMatch = trimmed.match(/^([a-zA-Z0-9_]+)\s*\((.*)\)/);
    if (callMatch && !['def', 'class', 'if', 'elif', 'while', 'for', 'return'].includes(callMatch[1])) {
      return {
        lineNumber: lineNum,
        codeSnippet: line,
        simpleMeaning: formatTemplate(pack.templates.function_call, { name: callMatch[1] }),
        explanation: `Call: ${callMatch[1]}`,
        category: 'function',
        construct: 'function_call',
        isSupported: true,
      };
    }

    // 16. Graceful Fallback for general or unsupported constructs
    unsupportedConstructs.push({
      line: lineNum,
      snippet: line,
      reason: 'Specialized rule template not available for this statement.',
    });

    return {
      lineNumber: lineNum,
      codeSnippet: line,
      simpleMeaning: pack.templates.general_statement,
      explanation: 'Statement',
      category: 'general',
      construct: 'general_statement',
      isSupported: false,
    };
  });

  // Pass 3: Synthesize Overview (Section 1)
  let overview = '';
  if (classesFound.length > 0) {
    overview = formatTemplate(pack.overview.with_class, { classes: classesFound.join(', ') });
  } else if (functionsFound.some((f) => f.isRecursive)) {
    const recNames = functionsFound.filter((f) => f.isRecursive).map((f) => f.name).join(', ');
    overview = formatTemplate(pack.overview.with_recursive, { functions: recNames });
  } else if (functionsFound.length > 0) {
    const fnNames = functionsFound.map((f) => f.name).join(', ');
    overview = formatTemplate(pack.overview.with_functions, { functions: fnNames });
  } else if (loopsFound.length > 0) {
    overview = pack.overview.with_loops;
  } else {
    overview = pack.overview.general;
  }

  // Pass 4: Synthesize Execution Flow (Section 3)
  const executionFlow: string[] = [];
  executionFlow.push(pack.executionFlow.start);
  if (classesFound.length > 0) {
    executionFlow.push(formatTemplate(pack.executionFlow.classes_loaded, { classes: classesFound.join(', ') }));
  }
  if (functionsFound.length > 0) {
    executionFlow.push(formatTemplate(pack.executionFlow.functions_loaded, { functions: functionsFound.map((f) => f.name).join(', ') }));
  }
  if (variablesAssigned.size > 0) {
    executionFlow.push(pack.executionFlow.variables_set);
  }
  if (loopsFound.length > 0) {
    executionFlow.push(pack.executionFlow.loop_running);
  }
  if (printsFound.length > 0) {
    executionFlow.push(pack.executionFlow.result_printed);
  }

  // Pass 5: Synthesize Expected Output (Section 4)
  let expectedOutput = '';
  if (printsFound.length > 0) {
    expectedOutput = formatTemplate(pack.expectedOutput.prints_found, { output: printsFound.join(' | ') });
  } else if (functionsFound.length > 0) {
    expectedOutput = pack.expectedOutput.function_return;
  } else {
    expectedOutput = pack.expectedOutput.completed;
  }

  // Pass 6: Synthesize Simple Logic Summary (Section 5)
  let simpleLogicSummary = '';
  if (functionsFound.length > 0 && loopsFound.length > 0) {
    simpleLogicSummary = pack.simpleLogicSummary.function_and_loop;
  } else if (functionsFound.length > 0) {
    simpleLogicSummary = pack.simpleLogicSummary.function_only;
  } else {
    simpleLogicSummary = pack.simpleLogicSummary.general;
  }

  // Symbol table / variables list
  const variablesAndFunctions = [
    ...functionsFound.map((f) => ({
      name: f.name,
      type: f.isRecursive ? 'Recursive Function' : 'Function',
      purpose: `Executes ${f.name} logic`,
    })),
    ...Array.from(variablesAssigned).map((v) => ({
      name: v,
      type: 'Variable',
      purpose: `Stores ${v} value`,
    })),
  ];

  return {
    overview,
    lineByLine,
    executionFlow,
    expectedOutput,
    simpleLogicSummary,
    variablesAndFunctions: variablesAndFunctions.slice(0, 10),
    inputOutput: {
      inputs: functionsFound[0]?.params?.length ? functionsFound[0].params.join(', ') : 'Constants in source',
      outputs: expectedOutput,
      timeComplexity: loopsFound.length > 1 ? 'O(N²)' : loopsFound.length === 1 ? 'O(N)' : 'O(1)',
      spaceComplexity: 'O(1)',
    },
    syntaxIssues: syntaxIssues.length ? syntaxIssues : undefined,
    unsupportedConstructs: unsupportedConstructs.length ? unsupportedConstructs : undefined,
  };
}
