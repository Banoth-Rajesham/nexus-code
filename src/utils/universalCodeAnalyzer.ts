import { NativeLanguageKey } from '../types';
import { analyzeCodeRuleBased, RuleBasedCodeAnalysis, StructuredLineExplanation } from './ruleBasedAnalyzer';

// ============================================================================
// BHASHA CODE UNIVERSAL CODE ANALYZER (RULE-BASED WRAPPER)
// Delegates all code analysis directly to the deterministic rule-based engine.
// Zero LLM calls, zero phonetic transliteration corruption.
// ============================================================================

export type DynamicLineExplanation = StructuredLineExplanation;
export type DynamicCodeAnalysis = RuleBasedCodeAnalysis;

export function analyzeAnyCodeDynamically(
  code: string,
  progLang: string = 'python',
  nativeLang: NativeLanguageKey = 'english'
): DynamicCodeAnalysis {
  return analyzeCodeRuleBased(code, progLang, nativeLang);
}
