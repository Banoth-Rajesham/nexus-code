import React from 'react';

// ============================================================================
// VS CODE DARK+ SYNTAX THEME PALETTE
// ============================================================================
export const VSCODE_COLORS = {
  keyword: '#C586C0',      // def, return, for, in, if, else, while (purple)
  control: '#C586C0',      // import, from, class, pass, break (purple)
  storageType: '#569CD6',  // int, str, bool, void, const, let, var, True, False, None (blue)
  functionName: '#DCDCAA', // count_number, సంఖ్య_లెక్కించు, binary_search (yellow)
  builtin: '#4EC9B0',      // print, len, range, console, fmt (teal/cyan)
  string: '#CE9178',       // "...", '...' (orange/peach)
  number: '#B5CEA8',       // 0, 1, 2, 100, 3.14 (light green)
  comment: '#6A9955',      // # ..., // ... (green italic)
  variable: '#9CDCFE',     // arr, target, num, count, లిస్ట్, లక్ష్యం (light sky blue)
  operator: '#D4D4D4',     // =, ==, +=, +, -, *, /, :, <, > (light gray)
  bracket1: '#FFD700',     // ( ) [ ] { } level 1 (gold)
  bracket2: '#DA70D6',     // level 2 (orchid)
  bracket3: '#179FFF',     // level 3 (blue)
  defaultText: '#D4D4D4',  // standard code text
};

// Keywords across standard languages & translated Bhasha equivalents
const KEYWORDS = new Set([
  'def', 'return', 'if', 'else', 'elif', 'while', 'for', 'in', 'class',
  'import', 'from', 'as', 'try', 'except', 'finally', 'raise', 'with',
  'pass', 'break', 'continue', 'lambda', 'yield', 'async', 'await',
  'function', 'func', 'package', 'interface', 'struct', 'type',
  // Telugu translated keywords
  'నిర్వచించు', 'ఫంక్షన్', 'తిరిగి_ఇవ్వు', 'ఒకవేళ', 'లేకపోతే', 'లేదా_ఒకవేళ',
  'వరకు', 'ప్రతి', 'లో', 'శ్రేణి', 'తరగతి', 'ఇంటర్‌ఫేస్', 'ప్యాకేజీ',
  'దిగుమతి', 'ఆపు', 'కొనసాగించు', 'దాటవేయి', 'ప్రయత్నించు',
  // Hindi translated keywords
  'परिभाषित_करें', 'फ़ंक्शन', 'लौटाएं', 'यदि', 'अन्यथा', 'या_फिर',
  'जब_तक', 'प्रत्येक', 'में', 'दायरा', 'वर्ग', 'पैकेज', 'आयात',
  // Tamil translated keywords
  'வரையறு', 'செயல்பாடு', 'திருப்பு', 'எனில்', 'இல்லையெனில்', 'வரை', 'ஒவ்வொரு', 'இல்',
  // Kannada translated keywords
  'ವ್ಯಾಖ್ಯಾನಿಸು', 'ಕಾರ್ಯ', 'ಹಿಂತಿರುಗಿಸು', 'ಆದರೆ', 'ಇಲ್ಲದಿದ್ದರೆ', 'ವರೆಗೆ', 'ಪ್ರತಿಯೊಂದು', 'ನಲ್ಲಿ',
]);

const STORAGE_TYPES = new Set([
  'True', 'False', 'None', 'true', 'false', 'null', 'nil', 'undefined',
  'int', 'float', 'str', 'string', 'bool', 'boolean', 'void', 'const', 'let', 'var',
  'నిజం', 'అబద్ధం', 'శూన్యం', 'పూర్ణాంకం', 'దశాంశం', 'వాక్యం', 'బూలియన్', 'స్థిరం', 'వేరియబుల్',
  'सत्य', 'असत्य', 'शून्य', 'पूर्णांक', 'दशमलव', 'स्ट्रिंग', 'बूलियन', 'स्थिर', 'चर',
  'உண்மை', 'பொய்', 'வெற்று', 'நிஜ', 'ಸುಳ್ಳು', 'ಖಾಲಿ',
]);

const BUILTINS = new Set([
  'print', 'len', 'range', 'enumerate', 'zip', 'map', 'filter', 'sum',
  'min', 'max', 'abs', 'list', 'dict', 'set', 'tuple', 'console', 'log',
  'fmt', 'Println', 'Printf', 'make', 'append',
  'ముద్రించు', 'కన్సోల్', 'లిస్ట్', 'సైజు', 'పొడవు',
  'छापें', 'प्रिंट', 'कंसोल', 'सूची',
  'அச்சிடு', 'முद्रಿಸು',
]);

interface HighlightToken {
  text: string;
  color: string;
  isComment?: boolean;
}

/**
 * Tokenize a single line of code into VS Code colored segments
 */
export function tokenizeLine(line: string): HighlightToken[] {
  if (!line) return [{ text: '', color: VSCODE_COLORS.defaultText }];

  const tokens: HighlightToken[] = [];
  let i = 0;
  let bracketDepth = 0;

  while (i < line.length) {
    const char = line[i];

    // 1. Comments: Python (#) or JS/Go (//)
    if (char === '#' || (char === '/' && line[i + 1] === '/')) {
      tokens.push({
        text: line.slice(i),
        color: VSCODE_COLORS.comment,
        isComment: true,
      });
      break;
    }

    // 2. String literals: "...", '...', f"...", f'...'
    if (char === '"' || char === "'" || (char === 'f' && (line[i + 1] === '"' || line[i + 1] === "'"))) {
      let quoteChar = char;
      let start = i;
      if (char === 'f') {
        quoteChar = line[i + 1];
        i++;
      }
      i++; // skip open quote
      while (i < line.length && line[i] !== quoteChar) {
        if (line[i] === '\\' && i + 1 < line.length) {
          i += 2; // skip escape sequence
        } else {
          i++;
        }
      }
      if (i < line.length) i++; // skip close quote
      tokens.push({
        text: line.slice(start, i),
        color: VSCODE_COLORS.string,
      });
      continue;
    }

    // 3. Numbers: \b\d+(\.\d+)?\b
    if (/\d/.test(char) && (i === 0 || /[^a-zA-Z0-9_\p{L}]/u.test(line[i - 1]))) {
      let start = i;
      while (i < line.length && /[\d.]/.test(line[i])) {
        i++;
      }
      tokens.push({
        text: line.slice(start, i),
        color: VSCODE_COLORS.number,
      });
      continue;
    }

    // 4. Brackets: () [] {}
    if (char === '(' || char === '[' || char === '{') {
      const colors = [VSCODE_COLORS.bracket1, VSCODE_COLORS.bracket2, VSCODE_COLORS.bracket3];
      tokens.push({ text: char, color: colors[bracketDepth % colors.length] });
      bracketDepth++;
      i++;
      continue;
    }
    if (char === ')' || char === ']' || char === '}') {
      bracketDepth = Math.max(0, bracketDepth - 1);
      const colors = [VSCODE_COLORS.bracket1, VSCODE_COLORS.bracket2, VSCODE_COLORS.bracket3];
      tokens.push({ text: char, color: colors[bracketDepth % colors.length] });
      i++;
      continue;
    }

    // 5. Operators & Punctuation: = == += + - * / : , .
    if (/[=+\-*/%<>!&|^~:,.]/.test(char)) {
      let start = i;
      while (i < line.length && /[=+\-*/%<>!&|^~:,.]/.test(line[i])) {
        i++;
      }
      tokens.push({
        text: line.slice(start, i),
        color: VSCODE_COLORS.operator,
      });
      continue;
    }

    // 6. Whitespace
    if (/\s/.test(char)) {
      let start = i;
      while (i < line.length && /\s/.test(line[i])) {
        i++;
      }
      tokens.push({
        text: line.slice(start, i),
        color: VSCODE_COLORS.defaultText,
      });
      continue;
    }

    // 7. Words / Identifiers (supports English, Telugu, Hindi, Tamil, Kannada, etc. via Unicode \p{L})
    if (/[\p{L}_]/u.test(char)) {
      let start = i;
      while (i < line.length && /[\p{L}\p{N}_]/u.test(line[i])) {
        i++;
      }
      const word = line.slice(start, i);

      // Lookahead: check if next non-whitespace char is '(' -> function call or def
      let nextIdx = i;
      while (nextIdx < line.length && /\s/.test(line[nextIdx])) nextIdx++;
      const isFunctionCall = nextIdx < line.length && line[nextIdx] === '(';

      // Lookbehind: was previous word 'def', 'function', 'func', or 'class'?
      const beforeText = line.slice(0, start).trim();
      const isDefName = /\b(def|function|func|class|నిర్వచించు|తరగతి|ఫంక్షన్)\s*$/u.test(beforeText);

      if (KEYWORDS.has(word)) {
        tokens.push({ text: word, color: VSCODE_COLORS.keyword });
      } else if (STORAGE_TYPES.has(word)) {
        tokens.push({ text: word, color: VSCODE_COLORS.storageType });
      } else if (BUILTINS.has(word)) {
        tokens.push({ text: word, color: VSCODE_COLORS.builtin });
      } else if (isDefName || isFunctionCall) {
        tokens.push({ text: word, color: VSCODE_COLORS.functionName });
      } else {
        // Standard variable / parameter
        tokens.push({ text: word, color: VSCODE_COLORS.variable });
      }
      continue;
    }

    // Fallback single char
    tokens.push({ text: char, color: VSCODE_COLORS.defaultText });
    i++;
  }

  return tokens;
}

/**
 * React Component to render syntax-colored line
 */
export const HighlightedLine: React.FC<{ line: string }> = ({ line }) => {
  const tokens = tokenizeLine(line);
  return (
    <span>
      {tokens.map((t, idx) => (
        <span
          key={idx}
          style={{
            color: t.color,
            fontStyle: t.isComment ? 'italic' : 'normal',
          }}
        >
          {t.text}
        </span>
      ))}
    </span>
  );
};

/**
 * React Component to render multi-line syntax colored block with line numbers
 */
export const HighlightedCodeBlock: React.FC<{
  code: string;
  highlightedLine?: number | null;
  onLineHover?: (lineNum: number | null) => void;
}> = ({ code, highlightedLine, onLineHover }) => {
  const lines = code.split('\n');

  return (
    <pre className="m-0 font-mono text-xs sm:text-sm leading-6 whitespace-pre">
      {lines.map((line, idx) => {
        const lineNum = idx + 1;
        const isHovered = highlightedLine === lineNum;
        return (
          <div
            key={idx}
            onMouseEnter={() => onLineHover?.(lineNum)}
            onMouseLeave={() => onLineHover?.(null)}
            className={`leading-6 px-1 rounded transition-colors ${
              isHovered ? 'bg-[#264f78]/40' : ''
            }`}
          >
            <HighlightedLine line={line} />
            {line === '' && '\n'}
          </div>
        );
      })}
    </pre>
  );
};
