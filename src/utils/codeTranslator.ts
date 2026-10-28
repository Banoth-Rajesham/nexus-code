import { NativeLanguageKey } from '../types';
import { analyzeCodeRuleBased } from './ruleBasedAnalyzer';
import { transliterateCode, transliterateWord, transliterateWordToTelugu } from './codeTransliterator';

// ============================================================================
// BHASHA CODE NATIVE TRANSLATOR & CODE TRANSLITERATOR
// Implements instant local deterministic English-to-Telugu script transliteration.
// Preserves code keywords and structure while writing identifiers and readable
// text in Telugu Unicode.
// ============================================================================

export type TranslationMode = 'guide' | 'pseudocode' | 'identifiers' | 'explanation';

export interface CodeTranslationResult {
  translatedCode: string;
  translatedLineCount: number;
  mode: TranslationMode;
  nativeLanguage: NativeLanguageKey;
}

export { transliterateCode, transliterateWord, transliterateWordToTelugu };

/**
 * Convenience helper to transliterate a single identifier.
 */
export function translateIdentifier(word: string, nativeLang: NativeLanguageKey = 'telugu'): string {
  return transliterateWord(word, nativeLang);
}

/**
 * Translates/transliterates code to target native language (Telugu script by default).
 * Free, deterministic, 0-latency, instant rule-based engine.
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

  // 1. Pseudocode mode
  if (mode === 'pseudocode') {
    const analysis = analyzeCodeRuleBased(code, 'python', nativeLang);
    const pseudoLines = analysis.lineByLine.map((line) => {
      const trimmed = line.codeSnippet.trim();
      if (!trimmed) return '';

      const indentMatch = line.codeSnippet.match(/^(\s*)/);
      const indent = indentMatch ? indentMatch[1] : '';

      if (line.construct === 'comment') {
        return `${indent}// ${line.simpleMeaning}`;
      }

      // Format as structured pseudocode step
      const lineWord = nativeLang === 'hindi' ? 'लाइन' : nativeLang === 'tamil' ? 'வரி' : nativeLang === 'kannada' ? 'ಸಾಲು' : 'లైన్';
      return `${indent}▸ [${lineWord} ${line.lineNumber}] ${line.simpleMeaning}`;
    });

    return {
      translatedCode: pseudoLines.join('\n'),
      translatedLineCount: pseudoLines.length,
      mode,
      nativeLanguage: nativeLang,
    };
  }

  // 2. Line Guide (Line-by-line explanation comments)
  if (mode === 'explanation') {
    const analysis = analyzeCodeRuleBased(code, 'python', nativeLang);
    const guideLines = analysis.lineByLine.map((line) => {
      const trimmed = line.codeSnippet.trim();
      if (!trimmed) return '';

      const indentMatch = line.codeSnippet.match(/^(\s*)/);
      const indent = indentMatch ? indentMatch[1] : '';

      if (trimmed.startsWith('#') || trimmed.startsWith('//')) {
        return `${indent}// ${line.simpleMeaning}`;
      }

      return `${indent}// [L${line.lineNumber}] ${line.simpleMeaning}`;
    });

    return {
      translatedCode: guideLines.join('\n'),
      translatedLineCount: guideLines.length,
      mode,
      nativeLanguage: nativeLang,
    };
  }

  // 3. Default: Instant Telugu-Script Code Transliteration
  // Displays the SAME code with important identifiers and readable text written in Telugu script.
  // Keywords (def, for, if, return, print) and syntax structure remain preserved.
  const transliterated = transliterateCode(code, nativeLang);
  const lines = transliterated.split('\n');

  return {
    translatedCode: transliterated,
    translatedLineCount: lines.length,
    mode,
    nativeLanguage: nativeLang,
  };
}
