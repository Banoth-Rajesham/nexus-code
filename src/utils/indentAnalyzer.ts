// ============================================================================
// NEXUS CODE - RAINBOW INDENT & SYNTAX INDENTATION ANALYZER
// Computes multi-level indent rainbow bands, guide lines, and detects
// PEP 8 / syntax indentation errors in real time with quick-fix hints
// ============================================================================

export interface IndentBand {
  level: number;        // 1-based level: 1, 2, 3, 4, 5...
  colorIndex: number;   // 0..3 (0: yellow/blue, 1: green/orange, 2: blue/teal, 3: violet/magenta)
  startChar: number;    // start column (in character units / spaces)
  endChar: number;      // end column
  isError: boolean;
  isCursorBlock?: boolean;
}

export type IndentErrorCode =
  | 'MISSING_INDENT'
  | 'INCONSISTENT_SIZE'
  | 'MIXED_TABS_SPACES'
  | 'UNEXPECTED_INDENT'
  | 'UNMATCHED_DEDENT';

export interface LineIndentInfo {
  lineNum: number;        // 1-based line number
  depth: number;          // 0-based depth level (0 = top-level)
  spaceCount: number;     // number of leading space equivalents
  leadingWhitespace: string;
  isCommentOnly: boolean;
  isBlank: boolean;
  hasError: boolean;
  errorCode?: IndentErrorCode;
  errorMessage?: string;
  suggestedIndent?: number; // suggested number of spaces
  bands: IndentBand[];
}

export interface CodeIndentAnalysis {
  lines: LineIndentInfo[];
  maxDepth: number;
  totalErrors: number;
  errorLineNumbers: number[];
}

// ─── COLOR PALETTES ──────────────────────────────────────────────────────────

export interface IndentColorTheme {
  bands: string[];        // 4 repeating background band colors
  guides: string[];       // 4 repeating vertical guide line colors
  activeGuide: string;    // highlighted guide line for cursor block
  errorBand: string;      // clear red band (~25-30% opacity)
  errorGuide: string;     // red guide line
  errorDot: string;       // gutter red dot
  whitespaceDot: string;  // faint whitespace indicator dot
}

// Standard VS Code Indent Rainbow Palette (Dark Theme)
export const DARK_RAINBOW_THEME: IndentColorTheme = {
  bands: [
    'rgba(234, 179, 8, 0.12)',   // Level 1: Yellow / Amber
    'rgba(34, 197, 94, 0.12)',   // Level 2: Green / Emerald
    'rgba(59, 130, 246, 0.12)',  // Level 3: Blue / Sky
    'rgba(168, 85, 247, 0.12)',  // Level 4: Violet / Purple
  ],
  guides: [
    'rgba(234, 179, 8, 0.35)',
    'rgba(34, 197, 94, 0.35)',
    'rgba(59, 130, 246, 0.35)',
    'rgba(168, 85, 247, 0.35)',
  ],
  activeGuide: 'rgba(255, 255, 255, 0.85)',
  errorBand: 'rgba(239, 68, 68, 0.28)',    // Clear red background band
  errorGuide: 'rgba(239, 68, 68, 0.85)',
  errorDot: '#ef4444',
  whitespaceDot: 'rgba(255, 255, 255, 0.20)',
};

// Standard VS Code Indent Rainbow Palette (Light Theme)
export const LIGHT_RAINBOW_THEME: IndentColorTheme = {
  bands: [
    'rgba(202, 138, 4, 0.14)',   // Level 1: Yellow
    'rgba(22, 163, 74, 0.14)',   // Level 2: Green
    'rgba(37, 99, 235, 0.14)',   // Level 3: Blue
    'rgba(147, 51, 234, 0.14)',  // Level 4: Violet
  ],
  guides: [
    'rgba(202, 138, 4, 0.40)',
    'rgba(22, 163, 74, 0.40)',
    'rgba(37, 99, 235, 0.40)',
    'rgba(147, 51, 234, 0.40)',
  ],
  activeGuide: 'rgba(0, 0, 0, 0.85)',
  errorBand: 'rgba(220, 38, 38, 0.25)',
  errorGuide: 'rgba(220, 38, 38, 0.85)',
  errorDot: '#dc2626',
  whitespaceDot: 'rgba(0, 0, 0, 0.20)',
};

// Color-Blind Friendly Palette (Blue, Orange, Teal, Magenta)
export const COLOR_BLIND_RAINBOW_THEME: IndentColorTheme = {
  bands: [
    'rgba(59, 130, 246, 0.14)',  // Level 1: Blue
    'rgba(249, 115, 22, 0.14)',  // Level 2: Orange
    'rgba(20, 184, 166, 0.14)',  // Level 3: Teal
    'rgba(217, 70, 239, 0.14)',  // Level 4: Magenta
  ],
  guides: [
    'rgba(59, 130, 246, 0.45)',
    'rgba(249, 115, 22, 0.45)',
    'rgba(20, 184, 166, 0.45)',
    'rgba(217, 70, 239, 0.45)',
  ],
  activeGuide: 'rgba(255, 255, 255, 0.90)',
  errorBand: 'rgba(239, 68, 68, 0.32)',
  errorGuide: 'rgba(239, 68, 68, 0.90)',
  errorDot: '#ef4444',
  whitespaceDot: 'rgba(255, 255, 255, 0.25)',
};

export const RAINBOW_SOLID_COLORS = [
  '#eab308', // Level 1: Yellow
  '#22c55e', // Level 2: Green
  '#3b82f6', // Level 3: Blue
  '#a855f7', // Level 4: Violet
];

export const COLOR_BLIND_SOLID_COLORS = [
  '#3b82f6', // Level 1: Blue
  '#f97316', // Level 2: Orange
  '#14b8a6', // Level 3: Teal
  '#d946ef', // Level 4: Magenta
];

/**
 * Returns the solid rainbow color for an indent depth (1-based level)
 */
export function getDepthColor(depth: number, isColorBlind = false): string {
  if (depth <= 0) return '#94a3b8';
  const palette = isColorBlind ? COLOR_BLIND_SOLID_COLORS : RAINBOW_SOLID_COLORS;
  return palette[(depth - 1) % palette.length];
}

/**
 * Core Indentation Analyzer: Computes line-by-line depth, bands, errors, and fix suggestions.
 */
export function analyzeIndentation(
  code: string,
  progLang = 'python',
  activeCursorLine?: number | null,
  indentSize = 4
): CodeIndentAnalysis {
  const rawLines = code.split('\n');
  const lineInfos: LineIndentInfo[] = [];
  let maxDepth = 0;
  const errorLineNumbers: number[] = [];

  const isPython = progLang.toLowerCase() === 'python';
  const isCStyle = ['javascript', 'typescript', 'java', 'cpp', 'go', 'rust'].includes(
    progLang.toLowerCase()
  );

  // Stack of active block indentation levels (for Python dedent checking)
  const blockStack: number[] = [0];

  // For C-style brace tracking
  let braceDepth = 0;

  for (let i = 0; i < rawLines.length; i++) {
    const lineNum = i + 1;
    const raw = rawLines[i];
    const match = raw.match(/^[ \t]*/);
    const leadingWhitespace = match ? match[0] : '';
    const trimmed = raw.trim();
    const isBlank = trimmed.length === 0;
    const isCommentOnly = isPython
      ? trimmed.startsWith('#')
      : trimmed.startsWith('//') || trimmed.startsWith('/*');

    // Count space equivalents (each tab = indentSize spaces)
    let spaceCount = 0;
    for (const ch of leadingWhitespace) {
      if (ch === '\t') {
        spaceCount += indentSize - (spaceCount % indentSize);
      } else {
        spaceCount++;
      }
    }

    // ─── BLANK & COMMENT LINES NEVER TURN RED ────────────────────────────────
    if (isBlank || isCommentOnly) {
      const depth = Math.floor(spaceCount / indentSize);
      const bands: IndentBand[] = [];
      for (let lvl = 1; lvl <= depth; lvl++) {
        bands.push({
          level: lvl,
          colorIndex: (lvl - 1) % 4,
          startChar: (lvl - 1) * indentSize,
          endChar: lvl * indentSize,
          isError: false,
        });
      }
      lineInfos.push({
        lineNum,
        depth,
        spaceCount,
        leadingWhitespace,
        isCommentOnly,
        isBlank,
        hasError: false,
        bands,
      });
      continue;
    }

    // ─── C-STYLE BRACE-BASED INDENTATION ────────────────────────────────────
    if (isCStyle) {
      // If line starts with closing brace, decrement visible depth for this line
      const startsWithClose = trimmed.startsWith('}') || trimmed.startsWith(')');
      const currentBraceDepth = startsWithClose ? Math.max(0, braceDepth - 1) : braceDepth;
      const depth = Math.max(currentBraceDepth, Math.floor(spaceCount / indentSize));
      maxDepth = Math.max(maxDepth, depth);

      let hasError = false;
      let errorCode: IndentErrorCode | undefined;
      let errorMessage: string | undefined;
      let suggestedIndent: number | undefined;

      // Check mixed tabs and spaces
      if (leadingWhitespace.includes('\t') && leadingWhitespace.includes(' ')) {
        hasError = true;
        errorCode = 'MIXED_TABS_SPACES';
        errorMessage = 'Tabs and spaces are mixed. Use only spaces.';
        suggestedIndent = depth * indentSize;
      } else if (spaceCount > 0 && spaceCount % indentSize !== 0) {
        hasError = true;
        errorCode = 'INCONSISTENT_SIZE';
        errorMessage = `This line uses ${spaceCount} spaces. Indentation should be a multiple of ${indentSize}.`;
        suggestedIndent = Math.round(spaceCount / indentSize) * indentSize;
      }

      if (hasError) {
        errorLineNumbers.push(lineNum);
      }

      // Compute bands
      const bands: IndentBand[] = [];
      for (let lvl = 1; lvl <= Math.max(depth, Math.ceil(spaceCount / indentSize)); lvl++) {
        bands.push({
          level: lvl,
          colorIndex: (lvl - 1) % 4,
          startChar: (lvl - 1) * indentSize,
          endChar: lvl * indentSize,
          isError: hasError,
        });
      }

      lineInfos.push({
        lineNum,
        depth,
        spaceCount,
        leadingWhitespace,
        isCommentOnly,
        isBlank,
        hasError,
        errorCode,
        errorMessage,
        suggestedIndent,
        bands,
      });

      // Update brace depth for next lines
      for (const ch of trimmed) {
        if (ch === '{') braceDepth++;
        else if (ch === '}') braceDepth = Math.max(0, braceDepth - 1);
      }
      continue;
    }

    // ─── PYTHON INDENTATION & ERROR RULES ───────────────────────────────────
    let hasError = false;
    let errorCode: IndentErrorCode | undefined;
    let errorMessage: string | undefined;
    let suggestedIndent: number | undefined;

    // Find previous non-blank, non-comment line
    let prevIdx = i - 1;
    while (prevIdx >= 0) {
      const pTrimmed = rawLines[prevIdx].trim();
      if (pTrimmed.length > 0 && !pTrimmed.startsWith('#')) {
        break;
      }
      prevIdx--;
    }

    const prevLine = prevIdx >= 0 ? rawLines[prevIdx] : null;
    const prevTrimmed = prevLine ? prevLine.trim() : '';
    const prevWhitespaceMatch = prevLine ? prevLine.match(/^[ \t]*/) : null;
    let prevSpaceCount = 0;
    if (prevWhitespaceMatch) {
      for (const ch of prevWhitespaceMatch[0]) {
        if (ch === '\t') prevSpaceCount += indentSize - (prevSpaceCount % indentSize);
        else prevSpaceCount++;
      }
    }

    // Strips inline comments to check colon: e.g. "if x > 5: # note" -> "if x > 5:"
    const prevCodeWithoutComment = prevTrimmed.replace(/#.*$/, '').trim();
    const prevEndsWithColon = prevCodeWithoutComment.endsWith(':');

    // Rule c) Mixed tabs and spaces
    if (leadingWhitespace.includes('\t') && leadingWhitespace.includes(' ')) {
      hasError = true;
      errorCode = 'MIXED_TABS_SPACES';
      errorMessage = 'Tabs and spaces are mixed. Use only spaces.';
      suggestedIndent = prevEndsWithColon ? prevSpaceCount + indentSize : prevSpaceCount;
    }
    // Rule b) Indent not a multiple of indentSize (4)
    else if (spaceCount > 0 && spaceCount % indentSize !== 0) {
      hasError = true;
      errorCode = 'INCONSISTENT_SIZE';
      errorMessage = `This line uses ${spaceCount} spaces. Use ${Math.round(spaceCount / indentSize) * indentSize || indentSize}.`;
      suggestedIndent = prevEndsWithColon ? prevSpaceCount + indentSize : Math.round(spaceCount / indentSize) * indentSize;
    }
    // Rule a) Previous line ends with ":" and this line is NOT indented deeper
    else if (prevEndsWithColon && spaceCount <= prevSpaceCount) {
      hasError = true;
      errorCode = 'MISSING_INDENT';
      errorMessage = `This line should be indented ${prevSpaceCount + indentSize} spaces because the line above ends with ':'.`;
      suggestedIndent = prevSpaceCount + indentSize;
    }
    // Rule d) Indented deeper than previous line without a block opener above it
    else if (!prevEndsWithColon && prevLine !== null && spaceCount > prevSpaceCount) {
      hasError = true;
      errorCode = 'UNEXPECTED_INDENT';
      errorMessage = 'Unexpected indent. The line above does not open a new block.';
      suggestedIndent = prevSpaceCount;
    }
    // Rule e) Dedented to a level that matches no earlier block
    else if (spaceCount < prevSpaceCount && !blockStack.includes(spaceCount)) {
      hasError = true;
      errorCode = 'UNMATCHED_DEDENT';
      errorMessage = 'Unindent does not match any outer indentation level.';
      // Suggest closest valid block level
      const closest = blockStack.reduce((prev, curr) =>
        Math.abs(curr - spaceCount) < Math.abs(prev - spaceCount) ? curr : prev
      , 0);
      suggestedIndent = closest;
    }

    if (hasError) {
      errorLineNumbers.push(lineNum);
    }

    // Maintain block stack for dedent verification
    if (prevEndsWithColon && !hasError) {
      if (!blockStack.includes(spaceCount)) {
        blockStack.push(spaceCount);
      }
    } else if (spaceCount < prevSpaceCount) {
      // Pop levels deeper than current
      while (blockStack.length > 1 && blockStack[blockStack.length - 1] > spaceCount) {
        blockStack.pop();
      }
      if (!blockStack.includes(spaceCount)) {
        blockStack.push(spaceCount);
      }
    }

    const depth = Math.floor(spaceCount / indentSize);
    maxDepth = Math.max(maxDepth, depth);

    // Generate indent bands
    const bands: IndentBand[] = [];
    const bandCount = Math.max(depth, Math.ceil(spaceCount / indentSize));
    for (let lvl = 1; lvl <= bandCount; lvl++) {
      bands.push({
        level: lvl,
        colorIndex: (lvl - 1) % 4,
        startChar: (lvl - 1) * indentSize,
        endChar: lvl * indentSize,
        isError: hasError,
      });
    }

    lineInfos.push({
      lineNum,
      depth,
      spaceCount,
      leadingWhitespace,
      isCommentOnly,
      isBlank,
      hasError,
      errorCode,
      errorMessage,
      suggestedIndent,
      bands,
    });
  }

  // Highlight cursor block guide line
  if (activeCursorLine && activeCursorLine >= 1 && activeCursorLine <= lineInfos.length) {
    const cursorLine = lineInfos[activeCursorLine - 1];
    if (cursorLine && cursorLine.depth > 0) {
      // Mark matching guide lines in lines within this block scope
      const targetDepth = cursorLine.depth;
      for (const info of lineInfos) {
        if (info.depth >= targetDepth) {
          const band = info.bands[targetDepth - 1];
          if (band) band.isCursorBlock = true;
        }
      }
    }
  }

  return {
    lines: lineInfos,
    maxDepth,
    totalErrors: errorLineNumbers.length,
    errorLineNumbers,
  };
}

/**
 * Quick-fix action: Corrects indentation of a single line.
 */
export function fixLineIndentation(code: string, lineNum: number, targetSpaces: number): string {
  const lines = code.split('\n');
  if (lineNum < 1 || lineNum > lines.length) return code;
  const line = lines[lineNum - 1];
  const trimmed = line.trimStart();
  lines[lineNum - 1] = ' '.repeat(Math.max(0, targetSpaces)) + trimmed;
  return lines.join('\n');
}

/**
 * Quick-fix action: Corrects all indentation errors across the entire document.
 */
export function fixAllIndentation(code: string, analysis: CodeIndentAnalysis): string {
  const lines = code.split('\n');
  for (const lineInfo of analysis.lines) {
    if (lineInfo.hasError && typeof lineInfo.suggestedIndent === 'number') {
      const idx = lineInfo.lineNum - 1;
      const trimmed = lines[idx].trimStart();
      lines[idx] = ' '.repeat(Math.max(0, lineInfo.suggestedIndent)) + trimmed;
    }
  }
  return lines.join('\n');
}
