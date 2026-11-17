import React from 'react';
import {
  CodeIndentAnalysis,
  DARK_RAINBOW_THEME,
  LIGHT_RAINBOW_THEME,
  COLOR_BLIND_RAINBOW_THEME,
  IndentColorTheme,
} from './indentAnalyzer';

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
    if (/\d/.test(char) && (i === 0 || /[^a-zA-Z0-9_\p{L}\p{M}]/u.test(line[i - 1]))) {
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
    if (/[\p{L}\p{M}_]/u.test(char)) {
      let start = i;
      while (i < line.length && /[\p{L}\p{M}\p{N}_]/u.test(line[i])) {
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
export const HighlightedLine: React.FC<{ line: string }> = React.memo(({ line }) => {
  const tokens = tokenizeLine(line);
  return (
    <span>
      {tokens.map((t, idx) => (
        <span
          key={idx}
          style={{
            color: t.color,
          }}
        >
          {t.text}
        </span>
      ))}
    </span>
  );
});

// Shared VS Code font stack and pixel-perfect editor styles
export const VSCODE_MONO_FONT = 'Consolas, "Cascadia Code", "Fira Code", "Courier New", monospace';

export const CODE_EDITOR_SHARED_STYLE: React.CSSProperties = {
  fontFamily: VSCODE_MONO_FONT,
  fontSize: '15px',
  lineHeight: '26px',
  letterSpacing: '0px',
  wordSpacing: '0px',
  tabSize: 4,
  MozTabSize: 4,
  whiteSpace: 'pre',
  wordBreak: 'normal',
  wordWrap: 'normal',
  overflowWrap: 'normal',
  fontVariantLigatures: 'none',
  fontKerning: 'none',
  WebkitFontSmoothing: 'antialiased',
  MozOsxFontSmoothing: 'grayscale',
  textRendering: 'optimizeLegibility',
  boxSizing: 'border-box',
  padding: '14px 18px',
  margin: 0,
  border: 0,
  willChange: 'scroll-position',
};

export interface HighlightedCodeBlockProps {
  code: string;
  highlightedLine?: number | null;
  activeCursorLine?: number | null;
  indentAnalysis?: CodeIndentAnalysis | null;
  rainbowEnabled?: boolean;
  colorBlindMode?: boolean;
  showWhitespaceDots?: boolean;
  isDarkTheme?: boolean;
  isStepMode?: boolean;
  stepCurrentLine?: number | null;
  onLineHover?: (lineNum: number | null) => void;
  onFixIndent?: (lineNum: number) => void;
}

/**
 * React Component to render multi-line syntax colored block with line numbers and rainbow indents
 */
export const HighlightedCodeBlock: React.FC<HighlightedCodeBlockProps> = React.memo(({
  code,
  highlightedLine,
  activeCursorLine,
  indentAnalysis,
  rainbowEnabled = true,
  colorBlindMode = false,
  showWhitespaceDots = false,
  isDarkTheme = true,
  isStepMode = false,
  stepCurrentLine = null,
  onLineHover,
}) => {
  const lines = code.split('\n');

  // Select appropriate palette based on settings & theme
  const theme: IndentColorTheme = colorBlindMode
    ? COLOR_BLIND_RAINBOW_THEME
    : isDarkTheme
    ? DARK_RAINBOW_THEME
    : LIGHT_RAINBOW_THEME;

  return (
    <div style={{ margin: 0, padding: 0, border: 0, fontFamily: VSCODE_MONO_FONT }}>
      {lines.map((line, idx) => {
        const lineNum = idx + 1;
        const isHovered = highlightedLine === lineNum;
        const isStepLine = isStepMode && stepCurrentLine === lineNum;
        const isCursorLine = activeCursorLine === lineNum;
        const lineInfo = indentAnalysis?.lines[idx];
        const hasError = lineInfo?.hasError || false;
        const hasBands = rainbowEnabled && lineInfo && lineInfo.bands.length > 0;

        // Line highlight background & borders: step highlight has priority (amber),
        // cursor line uses faint underline in step mode so they never compete
        let lineBg: string | undefined = undefined;
        let lineBorderTop = '1px solid transparent';
        let lineBorderBottom = '1px solid transparent';

        if (isStepLine) {
          lineBg = 'rgba(245, 158, 11, 0.22)';
          lineBorderTop = '1px solid rgba(245, 158, 11, 0.50)';
          lineBorderBottom = '1px solid rgba(245, 158, 11, 0.50)';
        } else if (isHovered) {
          lineBg = 'rgba(255, 255, 255, 0.08)';
          lineBorderTop = '1px solid rgba(255, 255, 255, 0.18)';
          lineBorderBottom = '1px solid rgba(255, 255, 255, 0.18)';
        } else if (isCursorLine) {
          if (isStepMode) {
            // Only faint underline when step mode is active
            lineBorderBottom = '1px solid rgba(255, 255, 255, 0.10)';
          } else {
            lineBg = 'rgba(255, 255, 255, 0.04)';
            lineBorderTop = '1px solid rgba(255, 255, 255, 0.12)';
            lineBorderBottom = '1px solid rgba(255, 255, 255, 0.12)';
          }
        }

        return (
          <div
            key={idx}
            onMouseEnter={onLineHover ? () => onLineHover(lineNum) : undefined}
            onMouseLeave={onLineHover ? () => onLineHover(null) : undefined}
            style={{
              position: 'relative',
              height: '26px',
              minHeight: '26px',
              maxHeight: '26px',
              lineHeight: '26px',
              padding: 0,
              margin: 0,
              whiteSpace: 'pre',
              boxSizing: 'border-box',
              backgroundColor: lineBg,
              borderTop: lineBorderTop,
              borderBottom: lineBorderBottom,
            }}
          >
            {/* ─── RAINBOW INDENTATION BANDS & GUIDE LINES ─── */}
            {hasBands && (
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  bottom: 0,
                  height: '26px',
                  lineHeight: '26px',
                  display: 'flex',
                  pointerEvents: 'none',
                  zIndex: 0,
                }}
              >
                {lineInfo.bands.map((band, bIdx) => {
                  const bandWidth = `${band.endChar - band.startChar}ch`;
                  const bgColor = band.isError
                    ? theme.errorBand
                    : theme.bands[band.colorIndex];

                  const guideColor = band.isError
                    ? theme.errorGuide
                    : band.isCursorBlock
                    ? theme.activeGuide
                    : theme.guides[band.colorIndex];

                  const guideWidth = band.isCursorBlock ? '1.5px' : '1px';

                  return (
                    <div
                      key={bIdx}
                      style={{
                        width: bandWidth,
                        height: '26px',
                        backgroundColor: bgColor,
                        borderLeft: `${guideWidth} solid ${guideColor}`,
                        boxSizing: 'border-box',
                        position: 'relative',
                      }}
                    >
                      {/* Optional faint whitespace dots on hover or toggle */}
                      {showWhitespaceDots && (
                        <div
                          style={{
                            position: 'absolute',
                            inset: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-around',
                            opacity: 0.6,
                          }}
                        >
                          {Array.from({ length: band.endChar - band.startChar }).map((_, dIdx) => (
                            <span
                              key={dIdx}
                              style={{
                                width: '2px',
                                height: '2px',
                                borderRadius: '50%',
                                backgroundColor: theme.whitespaceDot,
                              }}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Syntax Colored Code Text with Color-Blind Wavy Underline on Error */}
            <span
              style={{
                position: 'relative',
                zIndex: 1,
                textDecoration: colorBlindMode && hasError ? 'underline wavy #ef4444' : undefined,
                textDecorationThickness: colorBlindMode && hasError ? '2px' : undefined,
              }}
            >
              <HighlightedLine line={line} />
            </span>
            {line === '' && '\u00A0'}
          </div>
        );
      })}
    </div>
  );
});
