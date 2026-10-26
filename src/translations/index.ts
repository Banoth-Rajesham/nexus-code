import { te } from './te';
import { hi } from './hi';
import { ta } from './ta';
import { kn } from './kn';
import { NativeLanguageKey } from '../types';

export interface LanguagePack {
  sections: {
    overview: string;
    lineByLine: string;
    executionFlow: string;
    expectedOutput: string;
    simpleSummary: string;
    syntaxIssues: string;
    unsupported: string;
  };
  templates: Record<string, string>;
  examples: Record<string, string>;
  overview: Record<string, string>;
  executionFlow: Record<string, string>;
  simpleLogicSummary: Record<string, string>;
  expectedOutput: Record<string, string>;
}

export const TRANSLATIONS: Record<string, LanguagePack> = {
  telugu: te,
  hindi: hi,
  tamil: ta,
  kannada: kn,
};

/**
 * Safely interpolates {placeholder} tokens without string corruption
 */
export function formatTemplate(template: string, params: Record<string, string | number>): string {
  if (!template) return '';
  return template.replace(/\{([a-zA-Z0-9_]+)\}/g, (_match, key) => {
    return params[key] !== undefined ? String(params[key]) : _match;
  });
}

/**
 * Returns the requested language pack, falling back to Telugu
 */
export function getLanguagePack(nativeLang: NativeLanguageKey): LanguagePack {
  return TRANSLATIONS[nativeLang] || TRANSLATIONS.telugu;
}
