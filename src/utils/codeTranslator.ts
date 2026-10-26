import { NativeLanguageKey } from '../types';
import { analyzeCodeRuleBased } from './ruleBasedAnalyzer';

// ============================================================================
// BHASHA CODE NATIVE LINE GUIDE & PSEUDOCODE GENERATOR
// Replaces the old corrupted phonetic transliterator.
// Preserves code identifiers intact and generates clean, natural native guidance.
// ============================================================================

export type TranslationMode = 'guide' | 'pseudocode' | 'identifiers';

export interface CodeTranslationResult {
  translatedCode: string;
  translatedLineCount: number;
  mode: TranslationMode;
  nativeLanguage: NativeLanguageKey;
}

/**
 * Generates clean, native-language line-by-line guide or pseudocode.
 * NEVER performs destructive phonetic transliteration on English identifiers.
 */
export function translateCodeToNative(
  code: string,
  nativeLang: NativeLanguageKey,
  mode: TranslationMode = 'guide'
): CodeTranslationResult {
  if (nativeLang === 'english' || !code) {
    return {
      translatedCode: code,
      translatedLineCount: code.split('\n').length,
      mode,
      nativeLanguage: nativeLang,
    };
  }

  // Use the deterministic rule-based analysis
  const analysis = analyzeCodeRuleBased(code, 'python', nativeLang);

  if (mode === 'pseudocode') {
    // Generate clean educational pseudocode in the native language
    const pseudoLines = analysis.lineByLine.map((line) => {
      const trimmed = line.codeSnippet.trim();
      if (!trimmed) return '';

      const indentMatch = line.codeSnippet.match(/^(\s*)/);
      const indent = indentMatch ? indentMatch[1] : '';

      if (line.construct === 'comment') {
        return `${indent}// ${line.simpleMeaning}`;
      }

      // Format as structured pseudocode step
      return `${indent}▸ [లైన్ ${line.lineNumber}] ${line.simpleMeaning}`;
    });

    return {
      translatedCode: pseudoLines.join('\n'),
      translatedLineCount: pseudoLines.length,
      mode,
      nativeLanguage: nativeLang,
    };
  }

  // Default: Synchronized Line-by-Line Native Guide
  // Displays clean native-language meaning aligned with each line,
  // preserving exact identifiers without mixed-script corruption.
  const guideLines = analysis.lineByLine.map((line) => {
    const trimmed = line.codeSnippet.trim();
    if (!trimmed) return '';

    const indentMatch = line.codeSnippet.match(/^(\s*)/);
    const indent = indentMatch ? indentMatch[1] : '';

    if (trimmed.startsWith('#') || trimmed.startsWith('//')) {
      return `${indent}// ${line.simpleMeaning}`;
    }

    // Format clean educational annotation
    return `${indent}// [L${line.lineNumber}] ${line.simpleMeaning}`;
  });

  return {
    translatedCode: guideLines.join('\n'),
    translatedLineCount: guideLines.length,
    mode,
    nativeLanguage: nativeLang,
  };
}
