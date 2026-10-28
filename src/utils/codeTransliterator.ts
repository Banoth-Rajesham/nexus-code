import { NativeLanguageKey } from '../types';

// ============================================================================
// BHASHA CODE DETERMINISTIC PHONETIC TRANSLITERATION ENGINE v2
// ─ Universal dynamic transliteration of user-defined identifiers.
// ─ Phonetic transliteration into 7 Indic scripts: Telugu, Hindi, Tamil,
//   Kannada, Marathi, Bengali, Gujarati.
// ─ Comments are preserved byte-for-byte unchanged.
// ─ String literals & docstrings are preserved byte-for-byte unchanged.
// ─ Keywords, built-in methods, imports, numbers, syntax preserved exactly.
// ─ Consistent transliteration across definitions, references, and member calls.
// ─ 0 latency · 0 external APIs · 0 LLMs · 100% deterministic.
// ============================================================================

// ─── 1. Native UI Word Mappings ──────────────────────────────────────────────
export const NATIVE_CODE_WORD: Record<NativeLanguageKey, string> = {
  telugu: 'కోడ్',
  hindi: 'कोड',
  tamil: 'கோட்',
  kannada: 'ಕೋಡ್',
  marathi: 'कोड',
  bengali: 'কোড',
  gujarati: 'કોડ',
  english: 'Code',
};

export const NATIVE_GUIDE_WORD: Record<NativeLanguageKey, string> = {
  telugu: 'లైన్ గైడ్',
  hindi: 'लाइन गाइड',
  tamil: 'வரி வழிகாட்டி',
  kannada: 'ಸಾಲು ಮಾರ್ಗದರ್ಶಿ',
  marathi: 'लाइन मार्गदर्शक',
  bengali: 'লাইন গাইড',
  gujarati: 'લાઇન માર્ગદર્શિકા',
  english: 'Line Guide',
};

export const NATIVE_PSEUDO_WORD: Record<NativeLanguageKey, string> = {
  telugu: 'సూడోకోడ్',
  hindi: 'स्यूडोकोड',
  tamil: 'சூடோகோட்',
  kannada: 'ಸ್ಯೂಡೋಕೋಡ್',
  marathi: 'स्यूडोकोड',
  bengali: 'সিউডোকোড',
  gujarati: 'સ્યુડોકોડ',
  english: 'Pseudocode',
};

// ─── 2. Brahmic Script Specifications ─────────────────────────────────────────
export interface ScriptMapping {
  virama: string;
  independentVowels: Record<string, string>;
  matras: Record<string, string>;
  consonants: Record<string, string>;
  hasTrailingVirama: boolean;
}

export type IndicScriptSpec = ScriptMapping;

export const SCRIPT_MAPPINGS: Record<string, ScriptMapping> = {
  telugu: {
    virama: '\u0C4D', // ్
    independentVowels: {
      A: 'అ', AA: 'ఆ', AE: 'యా', AY: 'ఏ', AI: 'ఐ',
      E: 'ఎ', EE: 'ఈ', I: 'ఇ', O: 'ఒ', OH: 'ఓ',
      U: 'ఉ', OO: 'ఊ', YU: 'యూ', AU: 'ఔ', OI: 'ఆయ్', AH: 'అ',
    },
    matras: {
      A: '',
      AA: '\u0C3E', // ా
      AE: '\u0C4D\u0C2F\u0C3E', // ్యా
      AY: '\u0C47', // ే
      AI: '\u0C48', // ై
      E: '\u0C46', // ె
      EE: '\u0C40', // ీ
      I: '\u0C3F', // ి
      O: '\u0C4A', // ొ
      OH: '\u0C4B', // ో
      U: '\u0C41', // ు
      OO: '\u0C42', // ూ
      YU: '\u0C4D\u0C2F\u0C42', // ్యూ
      AU: '\u0C4C', // ౌ
      OI: '\u0C3E\u0C2F\u0C4D', // ాయ్
      AH: '\u0C3E', // ా
    },
    consonants: {
      k: 'క', kh: 'ఖ', g: 'గ', gh: 'ఘ', ch: 'చ', j: 'జ',
      t: 'ట', th: 'థ', d: 'డ', dh: 'ధ', n: 'న', p: 'ప',
      f: 'ఫ', ph: 'ఫ', b: 'బ', bh: 'భ', m: 'మ', y: 'య',
      r: 'ర', l: 'ల', v: 'వ', w: 'వ', s: 'స', sh: 'ష', h: 'హ', z: 'జ్',
    },
    hasTrailingVirama: true,
  },
  hindi: {
    virama: '\u094D', // ्
    independentVowels: {
      A: 'अ', AA: 'आ', AE: 'ऐ', AY: 'ए', AI: 'आइ',
      E: 'ए', EE: 'ई', I: 'इ', O: 'ओ', OH: 'ओ',
      U: 'उ', OO: 'ऊ', YU: 'यू', AU: 'आउ', OI: 'ऑय', AH: 'आ',
    },
    matras: {
      A: '',
      AA: '\u093E', // ा
      AE: '\u0948', // ै
      AY: '\u0947', // े
      AI: '\u093E\u0907', // ाइ
      E: '\u0947', // े
      EE: '\u0940', // ी
      I: '\u093F', // ि
      O: '\u094B', // ो
      OH: '\u094B', // ो
      U: '\u0941', // ु
      OO: '\u0942', // ू
      YU: '\u094D\u092F\u0942', // ्यू
      AU: '\u093E\u0909', // ाउ
      OI: '\u0949\u092F', // ॉय
      AH: '\u093E', // ा
    },
    consonants: {
      k: 'क', kh: 'ख', g: 'ग', gh: 'घ', ch: 'च', j: 'ज',
      t: 'ट', th: 'थ', d: 'ड', dh: 'ध', n: 'न', p: 'प',
      f: 'फ़', ph: 'फ', b: 'ब', bh: 'भ', m: 'म', y: 'य',
      r: 'र', l: 'ल', v: 'व', w: 'व', s: 'स', sh: 'श', h: 'ह', z: 'ज़',
    },
    hasTrailingVirama: false,
  },
  tamil: {
    virama: '\u0BCD', // ்
    independentVowels: {
      A: 'அ', AA: 'ஆ', AE: 'யா', AY: 'ஏ', AI: 'ஐ',
      E: 'எ', EE: 'ஈ', I: 'இ', O: 'ஒ', OH: 'ஓ',
      U: 'உ', OO: 'ஊ', YU: 'யூ', AU: 'ஔ', OI: 'ஆய்', AH: 'அ',
    },
    matras: {
      A: '',
      AA: '\u0BBE', // ா
      AE: '\u0BCD\u0BAF\u0BBE', // ்யா
      AY: '\u0BC7', // ே
      AI: '\u0BC8', // ை
      E: '\u0BC6', // ெ
      EE: '\u0BC0', // ீ
      I: '\u0BBF', // ி
      O: '\u0BCA', // ொ
      OH: '\u0BCB', // ோ
      U: '\u0BC1', // ு
      OO: '\u0BC2', // ூ
      YU: '\u0BCD\u0BAF\u0BC2', // ்யூ
      AU: '\u0BCC', // ௌ
      OI: '\u0BBE\u0BAF\u0BCD', // ாய்
      AH: '\u0BBE', // ா
    },
    consonants: {
      k: 'க', kh: 'க', g: 'க', gh: 'க', ch: 'ச', j: 'ஜ',
      t: 'ட', th: 'த', d: 'ட', dh: 'ட', n: 'ந', p: 'ப',
      f: 'ப', ph: 'ப', b: 'ப', bh: 'ப', m: 'ம', y: 'ய',
      r: 'ர', l: 'ல', v: 'வ', w: 'வ', s: 'ஸ', sh: 'ஷ', h: 'ஹ', z: 'ஜ',
    },
    hasTrailingVirama: true,
  },
  kannada: {
    virama: '\u0CCD', // ್
    independentVowels: {
      A: 'ಅ', AA: 'ಆ', AE: 'ಯಾ', AY: 'ಏ', AI: 'ಐ',
      E: 'ಎ', EE: 'ಈ', I: 'ಇ', O: 'ಒ', OH: 'ಓ',
      U: 'ಉ', OO: 'ಊ', YU: 'ಯೂ', AU: 'ಔ', OI: 'ಆಯ್', AH: 'ಅ',
    },
    matras: {
      A: '',
      AA: '\u0CBE', // ಾ
      AE: '\u0CCD\u0CAF\u0CBE', // ್ಯಾ
      AY: '\u0CC7', // ೇ
      AI: '\u0CC8', // ೈ
      E: '\u0CC6', // ೆ
      EE: '\u0CC0', // ೀ
      I: '\u0CBF', // ಿ
      O: '\u0CCA', // ೊ
      OH: '\u0CCB', // ೋ
      U: '\u0CC1', // ು
      OO: '\u0CC2', // ೂ
      YU: '\u0CCD\u0CAF\u0CC2', // ್ಯೂ
      AU: '\u0CCC', // ೌ
      OI: '\u0CBE\u0CAF\u0CCD', // ಾಯ್
      AH: '\u0CBE', // ಾ
    },
    consonants: {
      k: 'ಕ', kh: 'ಖ', g: 'ಗ', gh: 'ಘ', ch: 'ಚ', j: 'ಜ',
      t: 'ಟ', th: 'ಥ', d: 'ಡ', dh: 'ಧ', n: 'ನ', p: 'ಪ',
      f: 'ಫ', ph: 'ಫ', b: 'ಬ', bh: 'ಭ', m: 'ಮ', y: 'ಯ',
      r: 'ರ', l: 'ಲ', v: 'ವ', w: 'ವ', s: 'ಸ', sh: 'ಶ', h: 'ಹ', z: 'ಜ',
    },
    hasTrailingVirama: true,
  },
  marathi: {
    virama: '\u094D',
    independentVowels: {
      A: 'अ', AA: 'आ', AE: 'ऐ', AY: 'ए', AI: 'आई',
      E: 'ए', EE: 'ई', I: 'इ', O: 'ओ', OH: 'ओ',
      U: 'उ', OO: 'ऊ', YU: 'यू', AU: 'औ', OI: 'ऑय', AH: 'आ',
    },
    matras: {
      A: '', AA: '\u093E', AE: '\u0948', AY: '\u0947', AI: '\u093E\u0908',
      E: '\u0947', EE: '\u0940', I: '\u093F', O: '\u094B', OH: '\u094B',
      U: '\u0941', OO: '\u0942', YU: '\u094D\u092F\u0942', AU: '\u094C',
      OI: '\u0949\u092F', AH: '\u093E',
    },
    consonants: {
      k: 'क', kh: 'ख', g: 'ग', gh: 'घ', ch: 'च', j: 'ज',
      t: 'ट', th: 'थ', d: 'ड', dh: 'ध', n: 'न', p: 'प',
      f: 'फ', ph: 'फ', b: 'ब', bh: 'भ', m: 'म', y: 'य',
      r: 'र', l: 'ल', v: 'व', w: 'व', s: 'स', sh: 'श', h: 'ह', z: 'झ',
    },
    hasTrailingVirama: false,
  },
  bengali: {
    virama: '\u09CD',
    independentVowels: {
      A: 'অ', AA: 'আ', AE: 'অ্যা', AY: 'এ', AI: 'আই',
      E: 'এ', EE: 'ঈ', I: 'ই', O: 'ও', OH: 'ও',
      U: 'উ', OO: 'ঊ', YU: 'ইউ', AU: 'আউ', OI: 'অয়', AH: 'আ',
    },
    matras: {
      A: '', AA: '\u09BE', AE: '\u09CD\u09AF\u09BE', AY: '\u09C7', AI: '\u09BE\u0987',
      E: '\u09C7', EE: '\u09C0', I: '\u09BF', O: '\u09CB', OH: '\u09CB',
      U: '\u09C1', OO: '\u09C2', YU: '\u09CD\u09AF\u09C2', AU: '\u09BE\u0989',
      OI: '\u09AF\u09BC', AH: '\u09BE',
    },
    consonants: {
      k: 'ক', kh: 'খ', g: 'গ', gh: 'ঘ', ch: 'চ', j: 'জ',
      t: 'ট', th: 'থ', d: 'ড', dh: 'ধ', n: 'ন', p: 'প',
      f: 'ফ', ph: 'ফ', b: 'ব', bh: 'ভ', m: 'ম', y: 'য',
      r: 'র', l: 'ল', v: 'ভ', w: 'ভ', s: 'স', sh: 'শ', h: 'হ', z: 'জ',
    },
    hasTrailingVirama: false,
  },
  gujarati: {
    virama: '\u0ACD',
    independentVowels: {
      A: 'અ', AA: 'આ', AE: 'ઍ', AY: 'એ', AI: 'આઇ',
      E: 'એ', EE: 'ઈ', I: 'ઇ', O: 'ઓ', OH: 'ઓ',
      U: 'ઉ', OO: 'ઊ', YU: 'યૂ', AU: 'આઉ', OI: 'ઑય', AH: 'આ',
    },
    matras: {
      A: '', AA: '\u0ABE', AE: '\u0AC5', AY: '\u0AC7', AI: '\u0ABE\u0A87',
      E: '\u0AC7', EE: '\u0AC0', I: '\u0ABF', O: '\u0ACB', OH: '\u0ACB',
      U: '\u0AC1', OO: '\u0AC2', YU: '\u0ACD\u0AAF\u0AC2', AU: '\u0ABE\u0A89',
      OI: '\u0AC9\u0AAF', AH: '\u0ABE',
    },
    consonants: {
      k: 'ક', kh: 'ખ', g: 'ગ', gh: 'ઘ', ch: 'ચ', j: 'જ',
      t: 'ટ', th: 'થ', d: 'ડ', dh: 'ધ', n: 'ન', p: 'પ',
      f: 'ફ', ph: 'ફ', b: 'બ', bh: 'ભ', m: 'મ', y: 'ય',
      r: 'ર', l: 'લ', v: 'વ', w: 'વ', s: 'સ', sh: 'શ', h: 'હ', z: 'ઝ',
    },
    hasTrailingVirama: false,
  },
};

export const INDIC_SCRIPTS = SCRIPT_MAPPINGS;

type Phoneme = { type: 'vowel'; val: string } | { type: 'consonant'; val: string };

/**
 * Universal English Word to Phoneme Converter
 * Incorporates natural phonological rules, suffixes, syllable divisions,
 * and silent-letter heuristics.
 */
export function englishWordToPhonemes(word: string): Phoneme[] {
  const w = word.toLowerCase();
  const phonemes: Phoneme[] = [];
  const len = w.length;
  let i = 0;

  // Specific high-frequency programming prefixes
  if (w.startsWith('agent')) {
    phonemes.push({ type: 'vowel', val: 'AY' });
    phonemes.push({ type: 'consonant', val: 'j' });
    phonemes.push({ type: 'vowel', val: 'E' });
    phonemes.push({ type: 'consonant', val: 'n' });
    phonemes.push({ type: 'consonant', val: 't' });
    i = 5;
    if (i >= len) return phonemes;
  }
  if (w.startsWith('unit')) {
    phonemes.push({ type: 'vowel', val: 'YU' });
    phonemes.push({ type: 'consonant', val: 'n' });
    phonemes.push({ type: 'vowel', val: 'I' });
    phonemes.push({ type: 'consonant', val: 't' });
    i = 4;
    if (i >= len) return phonemes;
  }
  if (w.startsWith('user')) {
    phonemes.push({ type: 'vowel', val: 'YU' });
    phonemes.push({ type: 'consonant', val: 'j' });
    phonemes.push({ type: 'vowel', val: 'A' });
    phonemes.push({ type: 'consonant', val: 'r' });
    i = 4;
    if (i >= len) return phonemes;
  }
  if (w.startsWith('util')) {
    phonemes.push({ type: 'vowel', val: 'YU' });
    phonemes.push({ type: 'consonant', val: 't' });
    phonemes.push({ type: 'vowel', val: 'I' });
    phonemes.push({ type: 'consonant', val: 'l' });
    i = 4;
    if (i >= len) return phonemes;
  }

  while (i < len) {
    const remaining = w.slice(i);

    // End-of-word suffixes
    if (remaining.startsWith('tion') || remaining.startsWith('sion')) {
      phonemes.push({ type: 'consonant', val: 'sh' });
      phonemes.push({ type: 'vowel', val: 'A' });
      phonemes.push({ type: 'consonant', val: 'n' });
      i += 4;
      continue;
    }
    if (remaining.startsWith('ture')) {
      phonemes.push({ type: 'consonant', val: 'ch' });
      phonemes.push({ type: 'vowel', val: 'A' });
      phonemes.push({ type: 'consonant', val: 'r' });
      i += 4;
      continue;
    }
    if (remaining === 'ing' && i > 0) {
      phonemes.push({ type: 'vowel', val: 'I' });
      phonemes.push({ type: 'consonant', val: 'n' });
      phonemes.push({ type: 'consonant', val: 'g' });
      i += 3;
      continue;
    }
    if ((remaining === 'er' || remaining === 'or' || remaining === 'ar') && i > 0) {
      phonemes.push({ type: 'vowel', val: 'A' });
      phonemes.push({ type: 'consonant', val: 'r' });
      i += 2;
      continue;
    }
    if (remaining === 'al' && i > 0) {
      phonemes.push({ type: 'vowel', val: 'A' });
      phonemes.push({ type: 'consonant', val: 'l' });
      i += 2;
      continue;
    }
    if (remaining === 'le' && i > 0) {
      phonemes.push({ type: 'vowel', val: 'I' });
      phonemes.push({ type: 'consonant', val: 'l' });
      i += 2;
      continue;
    }

    // Silent 'e' at end of word
    if (i === len - 1 && w[i] === 'e' && len >= 3) {
      i++;
      continue;
    }

    // Special patterns: hand, func, count, etc.
    if (remaining.startsWith('hand')) {
      phonemes.push({ type: 'consonant', val: 'h' });
      phonemes.push({ type: 'vowel', val: 'AE' });
      phonemes.push({ type: 'consonant', val: 'n' });
      phonemes.push({ type: 'consonant', val: 'd' });
      i += 4;
      continue;
    }
    if (remaining.startsWith('func')) {
      phonemes.push({ type: 'consonant', val: 'f' });
      phonemes.push({ type: 'vowel', val: 'A' });
      phonemes.push({ type: 'consonant', val: 'n' });
      phonemes.push({ type: 'consonant', val: 'k' });
      i += 4;
      continue;
    }
    if (remaining.startsWith('count')) {
      phonemes.push({ type: 'consonant', val: 'k' });
      phonemes.push({ type: 'vowel', val: 'AU' });
      phonemes.push({ type: 'consonant', val: 'n' });
      phonemes.push({ type: 'consonant', val: 't' });
      i += 5;
      continue;
    }
    if (remaining.startsWith('weath')) {
      phonemes.push({ type: 'consonant', val: 'v' });
      phonemes.push({ type: 'vowel', val: 'E' });
      phonemes.push({ type: 'consonant', val: 'th' });
      i += 5;
      continue;
    }
    if (remaining.startsWith('search')) {
      phonemes.push({ type: 'consonant', val: 's' });
      phonemes.push({ type: 'vowel', val: 'E' });
      phonemes.push({ type: 'consonant', val: 'r' });
      phonemes.push({ type: 'consonant', val: 'ch' });
      i += 6;
      continue;
    }

    // Consonant digraphs
    if (remaining.startsWith('ch')) {
      phonemes.push({ type: 'consonant', val: 'ch' });
      i += 2;
      continue;
    }
    if (remaining.startsWith('sh')) {
      phonemes.push({ type: 'consonant', val: 'sh' });
      i += 2;
      continue;
    }
    if (remaining.startsWith('ph')) {
      phonemes.push({ type: 'consonant', val: 'f' });
      i += 2;
      continue;
    }
    if (remaining.startsWith('th')) {
      phonemes.push({ type: 'consonant', val: 'th' });
      i += 2;
      continue;
    }
    if (remaining.startsWith('ck')) {
      phonemes.push({ type: 'consonant', val: 'k' });
      i += 2;
      continue;
    }
    if (remaining.startsWith('qu')) {
      phonemes.push({ type: 'consonant', val: 'k' });
      phonemes.push({ type: 'consonant', val: 'v' });
      i += 2;
      continue;
    }
    if (remaining.startsWith('wh')) {
      phonemes.push({ type: 'consonant', val: 'v' });
      i += 2;
      continue;
    }
    if (remaining.startsWith('wr')) {
      phonemes.push({ type: 'consonant', val: 'r' });
      i += 2;
      continue;
    }
    if (remaining.startsWith('kn') && i === 0) {
      phonemes.push({ type: 'consonant', val: 'n' });
      i += 2;
      continue;
    }

    // Soft 'c' (followed by e, i, y -> s)
    if (w[i] === 'c' && i + 1 < len && (w[i + 1] === 'e' || w[i + 1] === 'i' || w[i + 1] === 'y')) {
      phonemes.push({ type: 'consonant', val: 's' });
      i++;
      continue;
    }

    // Soft 'g' (e.g. register, page, range, logic, agent, digit, message, origin, integer)
    if (w[i] === 'g' && i + 1 < len && (w[i + 1] === 'e' || w[i + 1] === 'i')) {
      const softGPrefixes = ['regis', 'page', 'range', 'logic', 'agent', 'digit', 'messa', 'origin', 'integ', 'manag', 'packag', 'challeng'];
      if (softGPrefixes.some(p => w.includes(p))) {
        phonemes.push({ type: 'consonant', val: 'j' });
        i++;
        continue;
      }
    }

    // Vowel digraphs
    if (remaining.startsWith('ight')) {
      phonemes.push({ type: 'vowel', val: 'AI' });
      phonemes.push({ type: 'consonant', val: 't' });
      i += 4;
      continue;
    }
    if (remaining.startsWith('ee') || remaining.startsWith('ea')) {
      phonemes.push({ type: 'vowel', val: 'EE' });
      i += 2;
      continue;
    }
    if (remaining.startsWith('oo')) {
      phonemes.push({ type: 'vowel', val: 'OO' });
      i += 2;
      continue;
    }
    if (remaining.startsWith('ou') || remaining.startsWith('ow')) {
      phonemes.push({ type: 'vowel', val: 'AU' });
      i += 2;
      continue;
    }
    if (remaining.startsWith('ai') || remaining.startsWith('ay')) {
      phonemes.push({ type: 'vowel', val: 'AY' });
      i += 2;
      continue;
    }
    if (remaining.startsWith('oi') || remaining.startsWith('oy')) {
      phonemes.push({ type: 'vowel', val: 'OI' });
      i += 2;
      continue;
    }
    if (remaining.startsWith('oa')) {
      phonemes.push({ type: 'vowel', val: 'OH' });
      i += 2;
      continue;
    }
    if (remaining.startsWith('au') || remaining.startsWith('aw')) {
      phonemes.push({ type: 'vowel', val: 'AA' });
      i += 2;
      continue;
    }

    // Single vowels
    const ch = w[i];
    if (ch === 'a') {
      if (i + 2 < len && w[i + 2] === 'e' && (i + 2 === len - 1 || !'aeiou'.includes(w[i + 3]))) {
        phonemes.push({ type: 'vowel', val: 'AY' });
      } else if (remaining.startsWith('alcu')) {
        phonemes.push({ type: 'vowel', val: 'AE' });
      } else if (i === 0 && len > 4 && (remaining.startsWith('amou') || remaining.startsWith('acco') || remaining.startsWith('addr') || remaining.startsWith('arra'))) {
        phonemes.push({ type: 'vowel', val: 'A' });
      } else if (i === len - 1) {
        phonemes.push({ type: 'vowel', val: 'AA' });
      } else if (['cat', 'calc', 'bank', 'pack', 'app', 'tax', 'val', 'mat', 'stack', 'track', 'branch', 'cart'].some(p => remaining.startsWith(p) || w.startsWith(p))) {
        phonemes.push({ type: 'vowel', val: 'AE' });
      } else {
        phonemes.push({ type: 'vowel', val: 'AA' });
      }
      i++;
      continue;
    }

    if (ch === 'e') {
      if (i === 0 && (remaining.startsWith('even') || remaining.startsWith('equa'))) {
        phonemes.push({ type: 'vowel', val: 'EE' });
      } else {
        phonemes.push({ type: 'vowel', val: 'E' });
      }
      i++;
      continue;
    }

    if (ch === 'i') {
      if (i + 2 < len && w[i + 2] === 'e' && (i + 2 === len - 1 || !'aeiou'.includes(w[i + 3]))) {
        phonemes.push({ type: 'vowel', val: 'AI' });
      } else if (i === 0 && remaining.startsWith('item')) {
        phonemes.push({ type: 'vowel', val: 'AI' });
      } else if (remaining.startsWith('ind') || remaining.startsWith('ign')) {
        phonemes.push({ type: 'vowel', val: 'AI' });
      } else {
        phonemes.push({ type: 'vowel', val: 'I' });
      }
      i++;
      continue;
    }

    if (ch === 'o') {
      if (i + 2 < len && w[i + 2] === 'e' && (i + 2 === len - 1 || !'aeiou'.includes(w[i + 3]))) {
        phonemes.push({ type: 'vowel', val: 'OH' });
      } else if (remaining.startsWith('otal') || remaining.startsWith('onus') || remaining.startsWith('ocus')) {
        phonemes.push({ type: 'vowel', val: 'OH' });
      } else {
        phonemes.push({ type: 'vowel', val: 'O' });
      }
      i++;
      continue;
    }

    if (ch === 'u') {
      if (remaining.startsWith('unit') || remaining.startsWith('user') || remaining.startsWith('util') || remaining.startsWith('unic')) {
        phonemes.push({ type: 'vowel', val: 'YU' });
      } else if (['cust', 'prod', 'numb', 'sum', 'struc', 'instruc', 'butt', 'run', 'sub'].some(p => remaining.startsWith(p) || w.startsWith(p))) {
        phonemes.push({ type: 'vowel', val: 'A' });
      } else {
        phonemes.push({ type: 'vowel', val: 'U' });
      }
      i++;
      continue;
    }

    if (ch === 'y') {
      if (i === len - 1 && len > 1) {
        phonemes.push({ type: 'vowel', val: 'EE' });
      } else if (i > 0 && i < len - 1 && !'aeiou'.includes(w[i - 1]) && !'aeiou'.includes(w[i + 1])) {
        phonemes.push({ type: 'vowel', val: 'I' });
      } else if (remaining.startsWith('ype') || remaining.startsWith('yte')) {
        phonemes.push({ type: 'vowel', val: 'AI' });
      } else {
        phonemes.push({ type: 'consonant', val: 'y' });
      }
      i++;
      continue;
    }

    // Consonants
    if (ch === 'c') {
      phonemes.push({ type: 'consonant', val: 'k' });
    } else if (ch === 'x') {
      phonemes.push({ type: 'consonant', val: 'k' });
      phonemes.push({ type: 'consonant', val: 's' });
    } else if (ch === 'q') {
      phonemes.push({ type: 'consonant', val: 'k' });
    } else if (['b', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'm', 'n', 'p', 'r', 's', 't', 'v', 'w', 'z'].includes(ch)) {
      phonemes.push({ type: 'consonant', val: ch });
    }
    i++;
  }

  return phonemes;
}

/**
 * Phonetic Transliteration of a single atomic word
 */
export function phoneticTransliterateWord(word: string, lang: NativeLanguageKey): string {
  if (lang === 'english' || !word) return word;
  const spec = SCRIPT_MAPPINGS[lang];
  if (!spec) return word;

  const phonemes = englishWordToPhonemes(word);
  let out = '';
  let lastWasConsonant = false;

  for (let i = 0; i < phonemes.length; i++) {
    const p = phonemes[i];

    if (p.type === 'vowel') {
      if (lastWasConsonant) {
        const matra = spec.matras[p.val] !== undefined ? spec.matras[p.val] : spec.matras['A'];
        out += matra;
      } else {
        const indep = spec.independentVowels[p.val] || spec.independentVowels['A'];
        out += indep;
      }
      lastWasConsonant = false;
    } else {
      const char = spec.consonants[p.val] || p.val;
      if (lastWasConsonant) {
        out += spec.virama;
      }
      out += char;
      lastWasConsonant = true;
    }
  }

  if (lastWasConsonant && spec.hasTrailingVirama && !out.endsWith(spec.virama)) {
    out += spec.virama;
  }

  return out;
}

export function phoneticTransliterate(word: string, lang: NativeLanguageKey): string {
  return phoneticTransliterateWord(word, lang);
}

/**
 * Transliterates compound words (snake_case, camelCase, PascalCase, numbers)
 */
export function transliterateCompoundWord(word: string, lang: NativeLanguageKey): string {
  if (lang === 'english' || !word) return word;

  // 1. snake_case
  if (word.includes('_')) {
    return word.split('_').map(part => {
      if (!part) return '';
      return transliterateCompoundWord(part, lang);
    }).join('_');
  }

  // 2. Trailing/Embedded numbers (e.g. item1, user123, matrix3x3)
  const alphaNumParts = word.match(/([a-zA-Z]+|\d+)/g);
  if (alphaNumParts && alphaNumParts.length > 1 && alphaNumParts.some(p => /^\d+$/.test(p))) {
    return alphaNumParts.map(p => /^\d+$/.test(p) ? p : transliterateCompoundWord(p, lang)).join('');
  }

  // 3. camelCase / PascalCase
  const camelParts = word.replace(/([a-z0-9])([A-Z])/g, '$1\0$2').split('\0');
  if (camelParts.length > 1) {
    return camelParts.map(p => transliterateCompoundWord(p, lang)).join('');
  }

  // 4. Atomic word
  return phoneticTransliterateWord(word, lang);
}

// ─── 3. Legacy Dictionaries for Backward Compatibility ────────────────────────
export const TELUGU_DICTIONARY: Record<string, string> = {};
export const HINDI_DICTIONARY: Record<string, string> = {};
export const TAMIL_DICTIONARY: Record<string, string> = {};
export const KANNADA_DICTIONARY: Record<string, string> = {};
export const MARATHI_DICTIONARY: Record<string, string> = {};
export const BENGALI_DICTIONARY: Record<string, string> = {};
export const GUJARATI_DICTIONARY: Record<string, string> = {};

export const NATIVE_DICTIONARIES: Record<string, Record<string, string>> = {
  telugu: TELUGU_DICTIONARY,
  hindi: HINDI_DICTIONARY,
  tamil: TAMIL_DICTIONARY,
  kannada: KANNADA_DICTIONARY,
  marathi: MARATHI_DICTIONARY,
  bengali: BENGALI_DICTIONARY,
  gujarati: GUJARATI_DICTIONARY,
};

export const TELUGU_COMMENT_PHRASES: Record<string, string> = {};
export const HINDI_COMMENT_PHRASES: Record<string, string> = {};
export const TAMIL_COMMENT_PHRASES: Record<string, string> = {};
export const KANNADA_COMMENT_PHRASES: Record<string, string> = {};
export const MARATHI_COMMENT_PHRASES: Record<string, string> = {};
export const BENGALI_COMMENT_PHRASES: Record<string, string> = {};
export const GUJARATI_COMMENT_PHRASES: Record<string, string> = {};

export const NATIVE_COMMENT_PHRASES: Record<string, Record<string, string>> = {
  telugu: TELUGU_COMMENT_PHRASES,
  hindi: HINDI_COMMENT_PHRASES,
  tamil: TAMIL_COMMENT_PHRASES,
  kannada: KANNADA_COMMENT_PHRASES,
  marathi: MARATHI_COMMENT_PHRASES,
  bengali: BENGALI_COMMENT_PHRASES,
  gujarati: GUJARATI_COMMENT_PHRASES,
};

// ─── 4. Preserved Keywords across Python, Java, JS, TS, C, C++ ──────────────────
export const PRESERVED_KEYWORDS = new Set([
  // Python keywords
  'def', 'return', 'if', 'elif', 'else', 'while', 'for', 'in', 'is', 'not', 'and', 'or',
  'break', 'continue', 'pass', 'class', 'import', 'from', 'as', 'try', 'except', 'finally',
  'raise', 'with', 'global', 'nonlocal', 'lambda', 'assert', 'async', 'await', 'del',
  'yield', 'self',

  // C / C++ keywords & preprocessor (Note: 'register' removed to avoid collision with user identifiers)
  'include', 'define', 'ifdef', 'ifndef', 'endif', 'pragma', 'undef',
  'namespace', 'using', 'std', 'cout', 'cin', 'endl', 'printf', 'scanf',
  'struct', 'union', 'typedef', 'sizeof', 'goto', 'auto', 'volatile', 'extern',
  'template', 'typename', 'virtual', 'override', 'explicit', 'friend', 'inline', 'constexpr',
  'nullptr', 'NULL',

  // Java & C/C++ primitives & modifiers
  'public', 'private', 'protected', 'static', 'final', 'void', 'int', 'float', 'double',
  'char', 'boolean', 'bool', 'byte', 'short', 'long', 'unsigned', 'signed',
  'abstract', 'native', 'synchronized', 'transient', 'strictfp',
  'interface', 'extends', 'implements', 'package', 'new', 'this', 'super',
  'throw', 'throws', 'catch', 'do', 'switch', 'case', 'default',
  'System', 'out', 'println', 'main', 'String', 'Integer', 'Double', 'Boolean', 'Character',

  // JS / TS keywords
  'function', 'func', 'fn', 'const', 'let', 'var', 'typeof', 'instanceof', 'export',
  'type', 'declare', 'module', 'require', 'readonly', 'keyof', 'infer', 'never', 'unknown', 'any',
  'console', 'log', 'error', 'warn', 'info', 'Math', 'JSON', 'Promise', 'Array', 'Object',
  'Date', 'Number',

  // Built-in functions & types
  'print', 'len', 'range', 'input', 'str', 'list', 'dict', 'set', 'tuple', 'open',
  'abs', 'min', 'max', 'sum', 'round', 'enumerate', 'zip', 'map', 'filter', 'sorted',
  'reversed', 'isinstance', 'issubclass', 'help', 'dir', 'id',

  // Popular standard libraries & external modules
  'math', 'sys', 'os', 'json', 'time', 'datetime', 'random', 're', 'collections',
  'itertools', 'functools', 'urllib', 'requests', 'http', 'asyncio', 'sqlite3',
  'pathlib', 'logging', 'subprocess', 'threading', 'multiprocessing', 'shutil',
  'tempfile', 'copy', 'heapq', 'bisect', 'hashlib', 'uuid', 'base64', 'unittest', 'pytest',
  'typing', 'List', 'Dict', 'Set', 'Tuple', 'Optional', 'Union', 'Any', 'Callable',
  'numpy', 'np', 'pandas', 'pd', 'matplotlib', 'plt', 'scipy', 'sklearn', 'torch', 'tensorflow',
  'fs', 'path', 'express', 'react', 'useState', 'useEffect', 'useMemo', 'useRef', 'useCallback',

  // Literals
  'True', 'False', 'None', 'true', 'false', 'null', 'undefined'
]);

// Common built-in object methods (Never transliterate standard standard object method names)
export const BUILTIN_OBJECT_METHODS = new Set([
  'append', 'pop', 'push', 'shift', 'unshift', 'extend', 'insert', 'remove', 'clear',
  'index', 'count', 'sort', 'reverse', 'keys', 'values', 'items', 'get', 'update',
  'split', 'join', 'strip', 'lstrip', 'rstrip', 'replace', 'find', 'startswith', 'endswith',
  'lower', 'upper', 'format', 'encode', 'decode', 'read', 'write', 'close', 'flush', 'seek',
  'slice', 'splice', 'reduce', 'forEach', 'includes', 'indexOf', 'lastIndexOf', 'substring',
  'toUpperCase', 'toLowerCase', 'charAt', 'charCodeAt', 'trim', 'trimStart', 'trimEnd',
  'sqrt', 'pow', 'ceil', 'floor', 'round', 'sin', 'cos', 'tan', 'exp',
  'length', 'size', 'toString', 'valueOf', 'json', 'status', 'send',
  '__init__', '__str__', '__repr__', '__len__', '__main__', '__name__', '__doc__',
]);

export const SINGLE_LETTER_VARS = new Set([
  'i', 'j', 'k', 'n', 'm', 'x', 'y', 'z', 's', 't', 'p', 'q', 'r', 'v', 'w', 'u', 'e', 'f', 'g', 'h', 'c', 'a', 'b', 'd', 'l', 'o'
]);

// ─── 5. Single Word Transliteration Function ──────────────────────────────────
export function transliterateWord(word: string, lang: NativeLanguageKey): string {
  if (lang === 'english' || !word) return word;
  if (PRESERVED_KEYWORDS.has(word) || SINGLE_LETTER_VARS.has(word.toLowerCase())) return word;
  return transliterateCompoundWord(word, lang);
}

export function transliterateWordToTelugu(word: string): string {
  return transliterateWord(word, 'telugu');
}

// ─── 6. Universal Syntax-Aware Code Transliterator ────────────────────────────
export function transliterateCodeUniversal(code: string, lang: NativeLanguageKey = 'telugu'): string {
  if (lang === 'english' || !code) return code;

  // Document-level identifier consistency cache
  const identifierCache = new Map<string, string>();

  const getTransliterated = (ident: string): string => {
    if (identifierCache.has(ident)) {
      return identifierCache.get(ident)!;
    }
    const res = transliterateCompoundWord(ident, lang);
    identifierCache.set(ident, res);
    return res;
  };

  const len = code.length;
  let out = '';
  let i = 0;

  while (i < len) {
    // 1. Python Triple-Quoted Docstrings (""" ... """ or ''' ... ''')
    if (
      (code.slice(i, i + 3) === '"""' || code.slice(i, i + 3) === "'''") ||
      ((code[i] === 'f' || code[i] === 'r' || code[i] === 'b') && (code.slice(i + 1, i + 4) === '"""' || code.slice(i + 1, i + 4) === "'''"))
    ) {
      let startIdx = i;
      if (code[i] === 'f' || code[i] === 'r' || code[i] === 'b') {
        i++;
      }
      const quoteStr = code.slice(i, i + 3);
      i += 3;
      const endIdx = code.indexOf(quoteStr, i);
      if (endIdx !== -1) {
        out += code.slice(startIdx, endIdx + 3);
        i = endIdx + 3;
      } else {
        out += code.slice(startIdx);
        break;
      }
      continue;
    }

    // 2. Regular Strings ("...", '...', `...`)
    if (
      code[i] === '"' || code[i] === "'" || code[i] === '`' ||
      ((code[i] === 'f' || code[i] === 'r' || code[i] === 'b') && (code[i + 1] === '"' || code[i + 1] === "'"))
    ) {
      const startIdx = i;
      let quoteChar = code[i];
      if (code[i] === 'f' || code[i] === 'r' || code[i] === 'b') {
        quoteChar = code[i + 1];
        i++;
      }
      i++; // skip opening quote
      while (i < len && code[i] !== quoteChar && code[i] !== '\n') {
        if (code[i] === '\\' && i + 1 < len) {
          i += 2;
        } else {
          i++;
        }
      }
      if (i < len && code[i] === quoteChar) {
        i++; // skip closing quote
      }
      out += code.slice(startIdx, i);
      continue;
    }

    // 3. Multi-line Block Comments (/* ... */)
    if (code[i] === '/' && code[i + 1] === '*') {
      const endComment = code.indexOf('*/', i + 2);
      if (endComment !== -1) {
        out += code.slice(i, endComment + 2);
        i = endComment + 2;
      } else {
        out += code.slice(i);
        break;
      }
      continue;
    }

    // 4. Single-line Comments (# ... or // ...)
    if (code[i] === '#' || (code[i] === '/' && code[i + 1] === '/')) {
      const nextNewline = code.indexOf('\n', i);
      if (nextNewline !== -1) {
        out += code.slice(i, nextNewline);
        i = nextNewline;
      } else {
        out += code.slice(i);
        break;
      }
      continue;
    }

    // 5. C/C++ Preprocessor Directives (#include, #define, etc.)
    if (code[i] === '#' && (i === 0 || code[i - 1] === '\n')) {
      const lineEnd = code.indexOf('\n', i);
      const directive = lineEnd !== -1 ? code.slice(i, lineEnd) : code.slice(i);
      out += directive;
      i += directive.length;
      continue;
    }

    // 6. Identifiers [a-zA-Z_$][a-zA-Z0-9_$]*
    if (/[a-zA-Z_$]/.test(code[i])) {
      const startIdx = i;
      while (i < len && /[a-zA-Z0-9_$]/.test(code[i])) {
        i++;
      }
      const token = code.slice(startIdx, i);

      // Check Python dunders (__init__, __str__, etc.)
      if (token.startsWith('__') && token.endsWith('__')) {
        out += token;
        continue;
      }

      // Check context: preceded by dot? (obj.method)
      let prevNonWs = startIdx - 1;
      while (prevNonWs >= 0 && /\s/.test(code[prevNonWs]) && code[prevNonWs] !== '\n') prevNonWs--;
      const isMemberAccess = prevNonWs >= 0 && code[prevNonWs] === '.';

      let objectToken = '';
      if (isMemberAccess) {
        let dotIdx = prevNonWs;
        let objEnd = dotIdx - 1;
        while (objEnd >= 0 && /\s/.test(code[objEnd]) && code[objEnd] !== '\n') objEnd--;
        let objStart = objEnd;
        while (objStart >= 0 && /[a-zA-Z0-9_$]/.test(code[objStart])) objStart--;
        objectToken = code.slice(objStart + 1, objEnd + 1);
      }

      // Check if followed by dot (e.g. math.sqrt, user.name)
      let nextNonWs = i;
      while (nextNonWs < len && /\s/.test(code[nextNonWs]) && code[nextNonWs] !== '\n') nextNonWs++;
      const isFollowedByDot = nextNonWs < len && code[nextNonWs] === '.';

      // Rules:
      // A. Preserved Keywords & single letters
      if (PRESERVED_KEYWORDS.has(token) || SINGLE_LETTER_VARS.has(token.toLowerCase())) {
        out += token;
        continue;
      }

      // B. Standard library/built-in module method (e.g. math.sqrt, console.log)
      const isStandardObject = PRESERVED_KEYWORDS.has(objectToken) && objectToken !== 'self' && objectToken !== 'this';
      if (isMemberAccess && (isStandardObject || BUILTIN_OBJECT_METHODS.has(token))) {
        out += token;
        continue;
      }

      // C. Standard built-in object methods on user objects (e.g. user_list.append)
      if (isMemberAccess && BUILTIN_OBJECT_METHODS.has(token)) {
        out += token;
        continue;
      }

      // D. Followed by dot and is a standard module (e.g. math., os., console.)
      if (isFollowedByDot && PRESERVED_KEYWORDS.has(token)) {
        out += token;
        continue;
      }

      // E. Eligible User Identifier
      out += getTransliterated(token);
      continue;
    }

    // 7. Operators, numbers, punctuation, whitespace
    out += code[i];
    i++;
  }

  return out;
}

export function transliterateCode(code: string, lang: NativeLanguageKey = 'telugu'): string {
  return transliterateCodeUniversal(code, lang);
}

export function transliterateCodeLine(line: string, lang: NativeLanguageKey): string {
  return transliterateCodeUniversal(line, lang);
}
