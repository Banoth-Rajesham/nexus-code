import { NativeLanguageKey } from '../types';

// ============================================================================
// DETERMINISTIC INDIC CODE TRANSLITERATION ENGINE
// Multi-script instant syntax-aware code transliterator for:
// Telugu, Hindi, Tamil, Kannada, Marathi, Bengali, Gujarati, English.
// 0 latency, 0 external APIs, 0 LLM dependency, 100% deterministic.
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

// ─── 2. Brahmic Script Specifications for Phonetic Fallback ───────────────────
export interface IndicScriptSpec {
  virama: string;
  startVowels: Record<string, string>;
  matras: Record<string, string>;
  consonants: Record<string, string>;
}

// Universal letter-by-letter phonetic spelling for technical acronyms
export const ACRONYM_LETTERS: Record<NativeLanguageKey, Record<string, string>> = {
  telugu: {
    A: 'ఏ', B: 'బీ', C: 'సీ', D: 'డీ', E: 'ఈ', F: 'ఎఫ్', G: 'జీ',
    H: 'హెచ్', I: 'ఐ', J: 'జే', K: 'కే', L: 'ఎల్', M: 'ఎమ్', N: 'ఎన్',
    O: 'ఓ', P: 'పీ', Q: 'క్యూ', R: 'ఆర్', S: 'ఎస్', T: 'టీ', U: 'యూ',
    V: 'వీ', W: 'డబ్ల్యూ', X: 'ఎక్స్', Y: 'వై', Z: 'జీ'
  },
  hindi: {
    A: 'ए', B: 'बी', C: 'सी', D: 'डी', E: 'ई', F: 'एफ', G: 'जी',
    H: 'एच', I: 'आई', J: 'जे', K: 'के', L: 'एल', M: 'एम', N: 'एन',
    O: 'ओ', P: 'पी', Q: 'क्यू', R: 'आर', S: 'एस', T: 'टी', U: 'यू',
    V: 'वी', W: 'डब्ल्यू', X: 'एक्स', Y: 'वाई', Z: 'ज़ी'
  },
  tamil: {
    A: 'ஏ', B: 'பீ', C: 'ஸீ', D: 'டீ', E: 'ஈ', F: 'எஃப்', G: 'ஜீ',
    H: 'எச்', I: 'ஐ', J: 'ஜே', K: 'கே', L: 'எல்', M: 'எம்', N: 'என்',
    O: 'ஓ', P: 'பீ', Q: 'கியூ', R: 'ஆர்', S: 'எஸ்', T: 'டீ', U: 'யூ',
    V: 'வீ', W: 'டபிள்யூ', X: 'எக்ஸ்', Y: 'வை', Z: 'ஜீ'
  },
  kannada: {
    A: 'ಎ', B: 'ಬೀ', C: 'ಸೀ', D: 'ಡೀ', E: 'ಈ', F: 'ಎಫ್', G: 'ಜೀ',
    H: 'ಹೆಚ್', I: 'ಐ', J: 'ಜೇ', K: 'ಕೇ', L: 'ಎಲ್', M: 'ಎಮ್', N: 'ಎನ್',
    O: 'ಓ', P: 'ಪೀ', Q: 'ಕ್ಯೂ', R: 'ಆರ್', S: 'ಎಸ್', T: 'ಟೀ', U: 'ಯೂ',
    V: 'ವೀ', W: 'ಡಬ್ಲ್ಯೂ', X: 'ಎಕ್ಸ್', Y: 'ವೈ', Z: 'ಜೀ'
  },
  marathi: {
    A: 'ए', B: 'बी', C: 'सी', D: 'डी', E: 'ई', F: 'एफ', G: 'जी',
    H: 'एच', I: 'आय', J: 'जे', K: 'के', L: 'एल', M: 'एम', N: 'एन',
    O: 'ओ', P: 'पी', Q: 'क्यू', R: 'आर', S: 'एस', T: 'टी', U: 'यू',
    V: 'व्ही', W: 'डब्ल्यू', X: 'एक्स', Y: 'वाय', Z: 'झेड'
  },
  bengali: {
    A: 'এ', B: 'বি', C: 'সী', D: 'ডি', E: 'ই', F: 'এফ', G: 'জী',
    H: 'এইচ', I: 'আই', J: 'জে', K: 'কে', L: 'এল', M: 'এম', N: 'এন',
    O: 'ও', P: 'পী', Q: 'কিউ', R: 'আর', S: 'এস', T: 'টি', U: 'ইউ',
    V: 'ভি', W: 'ডব্লিউ', X: 'এক্স', Y: 'ওয়াই', Z: 'জি'
  },
  gujarati: {
    A: 'એ', B: 'બી', C: 'સી', D: 'ડી', E: 'ઈ', F: 'એફ', G: 'જી',
    H: 'એચ', I: 'આઇ', J: 'જે', K: 'કે', L: 'એલ', M: 'એમ', N: 'એન',
    O: 'ઓ', P: 'પી', Q: 'ક્યૂ', R: 'આર', S: 'એસ', T: 'ટી', U: 'યુ',
    V: 'વી', W: 'ડબલ્યુ', X: 'એક્સ', Y: 'વાય', Z: 'ઝી'
  },
  english: {} as Record<string, string>
};

// High-frequency technical acronyms across all supported Indic languages
export const COMMON_ACRONYMS: Record<NativeLanguageKey, Record<string, string>> = {
  telugu: {
    ai: 'ఏఐ',
    api: 'ఏపీఐ',
    url: 'యుఆర్ఎల్',
    urls: 'యుఆర్ఎల్స్',
    sql: 'ఎస్క్యూఎల్',
    http: 'హెచ్‌టీటీపీ',
    https: 'హెచ్‌టీటీపీఎస్',
    id: 'ఐడీ',
    ids: 'ఐడీస్',
    db: 'డీబీ',
    dbs: 'డీబీస్',
    ui: 'యూఐ',
    ux: 'యూఎక్స్',
    json: 'జేసన్',
    xml: 'ఎక్స్‌ఎమ్‌ఎల్',
    html: 'హెచ్‌టీఎంఎల్',
    css: 'సీఎస్ఎస్',
    cpu: 'సీపీయూ',
    ram: 'రామ్',
    io: 'ఐఓ',
    ip: 'ఐపీ',
    os: 'ఓఎస్',
    sdk: 'ఎస్డీకే',
    cli: 'సీఎల్ఐ',
    rest: 'రెస్ట్',
    dom: 'డామ్',
    csv: 'సీఎస్వీ',
    pdf: 'పీడీఎఫ్',
    jwt: 'జేడబ్ల్యూటీ',
    uuid: 'యూయూఐడీ',
    app: 'యాప్',
    apps: 'యాప్స్',
    auth: 'ఆథ్',
    sync: 'సింక్',
    async: 'అసింక్',
  },
  hindi: {
    ai: 'एआई',
    api: 'एपीआई',
    url: 'यूआरएल',
    urls: 'यूआरएल्स',
    sql: 'एसक्यूएल',
    http: 'एचटीटीपी',
    https: 'एचटीटीपीएस',
    id: 'आईडी',
    ids: 'आईडीज़',
    db: 'डीबी',
    dbs: 'डीबीज़',
    ui: 'यूआई',
    ux: 'यूएक्स',
    json: 'जेसन',
    xml: 'एक्सएमएल',
    html: 'एचटीएमएल',
    css: 'सीएसएस',
    cpu: 'सीपीयू',
    ram: 'रैम',
    io: 'आईओ',
    ip: 'आईपी',
    os: 'ओएस',
    sdk: 'एसडीके',
    cli: 'सीएलआई',
    rest: 'रेस्ट',
    dom: 'डॉम',
    csv: 'सीएसवी',
    pdf: 'पीडीएफ',
    jwt: 'जेडब्ल्यूटी',
    uuid: 'यूयूआईडी',
    app: 'ऐप',
    apps: 'ऐप्स',
    auth: 'ऑथ',
    sync: 'सिंक',
    async: 'असिंक',
  },
  tamil: {
    ai: 'ஏஐ',
    api: 'ஏபிஐ',
    url: 'யுஆர்எல்',
    urls: 'யுஆர்எல்ஸ்',
    sql: 'எஸ்கியூஎல்',
    http: 'எச்டிடிபி',
    https: 'எச்டிடிபிஎஸ்',
    id: 'ஐடி',
    ids: 'ஐடிஸ்',
    db: 'டிபி',
    dbs: 'டிபிஸ்',
    ui: 'யூஐ',
    ux: 'யூஎக்ஸ்',
    json: 'ஜேசன்',
    xml: 'எக்ஸ்எம்எல்',
    html: 'எச்டிஎம்எல்',
    css: 'சிஎஸ்எஸ்',
    cpu: 'சிபியூ',
    ram: 'ரேம்',
    io: 'ஐஓ',
    ip: 'ஐபி',
    os: 'ஓஎஸ்',
    sdk: 'எஸ்டிகே',
    cli: 'சிஎல்ஐ',
    rest: 'ரெஸ்ட்',
    dom: 'டாம்',
    csv: 'சிஎஸ்வி',
    pdf: 'பிடிஎஃப்',
    jwt: 'ஜேடபிள்யூடி',
    uuid: 'யூயூஐடி',
    app: 'ஆப்',
    apps: 'ஆப்ஸ்',
    auth: 'ஆத்',
    sync: 'சிங்க்',
    async: 'அசிங்க்',
  },
  kannada: {
    ai: 'ಎಐ',
    api: 'ಎಪಿಐ',
    url: 'ಯುಆರ್ಎಲ್',
    urls: 'ಯುಆರ್ಎಲ್ಸ್',
    sql: 'ಎಸ್ಕ್ಯೂಎಲ್',
    http: 'ಹೆಚ್ಟಿಟಿಪಿ',
    https: 'ಹೆಚ್ಟಿಟಿಪಿಎಸ್',
    id: 'ಐಡಿ',
    ids: 'ಐಡಿಸ್',
    db: 'ಡಿಬಿ',
    dbs: 'ಡಿಬಿಸ್',
    ui: 'ಯೂಐ',
    ux: 'ಯೂಎಕ್ಸ್',
    json: 'ಜೇಸನ್',
    xml: 'ಎಕ್ಸ್‌ಎಂಎಲ್',
    html: 'ಹೆಚ್ಟಿಎಂಎಲ್',
    css: 'ಸಿಎಸ್ಎಸ್',
    cpu: 'ಸಿಪಿಯು',
    ram: 'ರಾಮ್',
    io: 'ಐಓ',
    ip: 'ಐಪಿ',
    os: 'ಓಎಸ್',
    sdk: 'ಎಸ್‌ಡಿಕೆ',
    cli: 'ಸಿಎಲ್ಐ',
    rest: 'ರೆಸ್ಟ್',
    dom: 'ಡಾಮ್',
    csv: 'ಸಿಎಸ್ವಿ',
    pdf: 'ಪಿಡಿಎಫ್',
    jwt: 'ಜೇಡಬ್ಲ್ಯೂಟಿ',
    uuid: 'ಯೂಯೂಐಡಿ',
    app: 'ಆ್ಯಪ್',
    apps: 'ಆ್ಯಪ್ಸ್',
    auth: 'ಆಥ್',
    sync: 'ಸಿಂಕ್',
    async: 'ಅಸಿಂಕ್',
  },
  marathi: {
    ai: 'एआय',
    api: 'एपीआय',
    url: 'यूआरएल',
    urls: 'यूआरएल्स',
    sql: 'एसक्यूएल',
    http: 'एचटीटीपी',
    https: 'एचटीटीपीएस',
    id: 'आयडी',
    ids: 'आयडीज़',
    db: 'डीबी',
    dbs: 'डीबीज़',
    ui: 'यूआय',
    ux: 'यूएक्स',
    json: 'जेसन',
    xml: 'एक्सएमएल',
    html: 'एचटीएमएल',
    css: 'सीएसएस',
    cpu: 'सीपीयू',
    ram: 'रॅम',
    io: 'आयओ',
    ip: 'आयपी',
    os: 'ओएस',
    sdk: 'एसडीके',
    cli: 'सीएलआय',
    rest: 'रेस्ट',
    dom: 'डॉम',
    csv: 'सीएसव्ही',
    pdf: 'पीडीएफ',
    jwt: 'जेडब्ल्यूटी',
    uuid: 'यूयूआयडी',
    app: 'अ‍ॅप',
    apps: 'अ‍ॅप्स',
    auth: 'ऑथ',
    sync: 'सिंक',
    async: 'असिंक',
  },
  bengali: {
    ai: 'এআই',
    api: 'এপিআই',
    url: 'ইউআরএল',
    urls: 'ইউআরএলস',
    sql: 'এসকিউএল',
    http: 'এইচটিটিপি',
    https: 'এইচটিটিপিএস',
    id: 'আইডি',
    ids: 'আইডিস',
    db: 'ডিবি',
    dbs: 'ডিবিন',
    ui: 'ইউআই',
    ux: 'ইউএক্স',
    json: 'জেসন',
    xml: 'এক্সএমএল',
    html: 'এইচটিএমএল',
    css: 'সিএসএস',
    cpu: 'সিপিইউ',
    ram: 'র‍্যাম',
    io: 'আইও',
    ip: 'আইপি',
    os: 'ওএস',
    sdk: 'এসডিকে',
    cli: 'সিএলআই',
    rest: 'রেস্ট',
    dom: 'ডম',
    csv: 'সিএসভি',
    pdf: 'পিডিএফ',
    jwt: 'জেডব্লিউটি',
    uuid: 'ইউইউআইডি',
    app: 'অ্যাপ',
    apps: 'অ্যাপস',
    auth: 'অথ',
    sync: 'সিঙ্ক',
    async: 'অ্যাসিঙ্ক',
  },
  gujarati: {
    ai: 'એઆઇ',
    api: 'એપીઆઇ',
    url: 'યુઆરએલ',
    urls: 'યુઆરએલ્સ',
    sql: 'એસક્યૂએલ',
    http: 'એચટીટીપી',
    https: 'એચટીટીપીએસ',
    id: 'આઇડી',
    ids: 'આઇડીઝ',
    db: 'ડીબી',
    dbs: 'ડીબીઝ',
    ui: 'યુઆઇ',
    ux: 'યુએક્સ',
    json: 'જેસન',
    xml: 'એક્સએમએલ',
    html: 'એચટીએમએલ',
    css: 'સીએસએસ',
    cpu: 'સીપીયુ',
    ram: 'રેમ',
    io: 'આઇઓ',
    ip: 'આઇપી',
    os: 'ઓએસ',
    sdk: 'એસડીકે',
    cli: 'સીએલઆઇ',
    rest: 'રેસ્ટ',
    dom: 'ડૉમ',
    csv: 'સીએસવી',
    pdf: 'પીડીએફ',
    jwt: 'જેડબલ્યુટી',
    uuid: 'યૂયૂઆઇડી',
    app: 'એપ',
    apps: 'એપ્સ',
    auth: 'ઓથ',
    sync: 'સિંક',
    async: 'અસિંક',
  },
  english: {} as Record<string, string>
};


export const INDIC_SCRIPTS: Record<string, IndicScriptSpec> = {
  telugu: {
    virama: '\u0C4D', // ్
    startVowels: {
      aa: 'ఆ', ee: 'ఈ', ii: 'ఈ', oo: 'ఊ', uu: 'ఊ', ai: 'ఐ', au: 'ఔ', ou: 'ఔ',
      ea: 'ఈ', oa: 'ఓ', a: 'అ', e: 'ఎ', i: 'ఇ', o: 'ఒ', u: 'ఉ'
    },
    matras: {
      aa: '\u0C3E', ee: '\u0C40', ii: '\u0C40', oo: '\u0C42', uu: '\u0C42',
      ai: '\u0C48', ay: '\u0C47', au: '\u0C4C', ou: '\u0C4C', ow: '\u0C4C',
      ea: '\u0C40', oa: '\u0C4B', a: '\u0C3E', e: '\u0C46', i: '\u0C3F',
      o: '\u0C4A', u: '\u0C41'
    },
    consonants: {
      sch: 'స్క్', str: 'స్ట్ర', spr: 'స్ప్ర', spl: 'స్ప్ల', scr: 'స్క్ర',
      thr: 'థ్ర', shr: 'శ్ర', chr: 'క్ర', ph: 'ఫ', th: 'థ', sh: 'ష్', ch: 'చ్',
      gh: 'ఘ', kh: 'ఖ', jh: 'ఝ', dh: 'ధ', bh: 'భ', ng: 'ంగ్', nk: 'ంక్', nt: 'ంట్', nd: 'ండ్', mp: 'ంప్', ns: 'న్స్', nch: 'ంచ్', ck: 'క్', wr: 'ర్', kn: 'న్',
      qu: 'క్వ', wh: 'వ్', st: 'స్ట', sp: 'స్ప', sk: 'స్క', sc: 'స్క', sm: 'స్మ',
      sn: 'స్న', sl: 'స్ల', sw: 'స్వ', pl: 'ప్ల', pr: 'ప్ర', bl: 'బ్ల', br: 'బ్ర',
      tr: 'ట్ర', dr: 'డ్ర', cl: 'క్ల', cr: 'క్ర', gl: 'గ్ల', gr: 'గ్ర', fl: 'ఫ్ల',
      fr: 'ఫ్ర', k: 'క', g: 'గ', j: 'జ', t: 'ట', d: 'డ', n: 'న', p: 'ప',
      f: 'ఫ', b: 'బ', m: 'మ', y: 'య', r: 'ర', l: 'ల', v: 'వ', w: 'వ',
      s: 'స', h: 'హ', x: 'క్స్', z: 'జ్', q: 'క్', c: 'క'
    }
  },
  hindi: {
    virama: '\u094D', // ्
    startVowels: {
      aa: 'आ', ee: 'ई', ii: 'ई', oo: 'ऊ', uu: 'ऊ', ai: 'ऐ', au: 'औ', ou: 'औ',
      ea: 'ई', oa: 'ओ', a: 'अ', e: 'ए', i: 'इ', o: 'ओ', u: 'उ'
    },
    matras: {
      aa: '\u093E', ee: '\u0940', ii: '\u0940', oo: '\u0942', uu: '\u0942',
      ai: '\u0948', ay: '\u0947', au: '\u094C', ou: '\u094C', ow: '\u094C',
      ea: '\u0940', oa: '\u094B', a: '\u093E', e: '\u0947', i: '\u093F',
      o: '\u094B', u: '\u0941'
    },
    consonants: {
      sch: 'स्क', str: 'स्ट्र', spr: 'स्प्र', spl: 'स्प्ल', scr: 'स्क्र',
      thr: 'थ्र', shr: 'श्र', chr: 'क्र', ph: 'फ', th: 'थ', sh: 'श', ch: 'च',
      gh: 'घ', kh: 'ख', jh: 'झ', dh: 'ध', bh: 'भ', ng: 'ंग', nk: 'ंक', nt: 'ंट', nd: 'ंड', mp: 'ंप', ns: 'ंस', nch: 'ंच', ck: 'क', wr: 'र', kn: 'न',
      qu: 'क्व', wh: 'व', st: 'स्ट', sp: 'स्प', sk: 'स्क', sc: 'स्क', sm: 'स्म',
      sn: 'स्न', sl: 'स्ल', sw: 'स्व', pl: 'प्ल', pr: 'प्र', bl: 'ब्ल', br: 'ब्र',
      tr: 'ट्र', dr: 'ड्र', cl: 'क्ल', cr: 'क्र', gl: 'ग्ल', gr: 'ग्र', fl: 'फ्ल',
      fr: 'फ्र', k: 'क', g: 'ग', j: 'ज', t: 'ट', d: 'ड', n: 'न', p: 'प',
      f: 'फ', b: 'ब', m: 'म', y: 'य', r: 'र', l: 'ल', v: 'व', w: 'व',
      s: 'स', h: 'ह', x: 'क्स', z: 'ज़', q: 'क', c: 'क'
    }
  },
  tamil: {
    virama: '\u0BCD', // ்
    startVowels: {
      aa: 'ஆ', ee: 'ஈ', ii: 'ஈ', oo: 'ஊ', uu: 'ஊ', ai: 'ஐ', au: 'ஔ', ou: 'ஔ',
      ea: 'ஈ', oa: 'ஓ', a: 'அ', e: 'எ', i: 'இ', o: 'ஒ', u: 'உ'
    },
    matras: {
      aa: '\u0BBE', ee: '\u0BC0', ii: '\u0BC0', oo: '\u0BC2', uu: '\u0BC2',
      ai: '\u0BC8', ay: '\u0BC7', au: '\u0BCC', ou: '\u0BCC', ow: '\u0BCC',
      ea: '\u0BC0', oa: '\u0BCA', a: '\u0BBE', e: '\u0BC6', i: '\u0BBF',
      o: '\u0BCA', u: '\u0BC1'
    },
    consonants: {
      sch: 'ஸ்க்', str: 'ஸ்ட்ர', spr: 'ஸ்ப்ர', spl: 'ஸ்ப்ல', scr: 'ஸ்க்ர',
      thr: 'த்ர', shr: 'ஸ்ர', chr: 'க்ர', ph: 'ப்', th: 'த்', sh: 'ஷ்', ch: 'ச்',
      gh: 'க்', kh: 'க்', jh: 'ஜ்', dh: 'ட்', bh: 'ப்', ng: 'ங்', nk: 'ங்க்', nt: 'ண்ட்', nd: 'ண்ட்', mp: 'ம்ப', ns: 'ன்ஸ்', nch: 'ஞ்ச்', ck: 'க்', wr: 'ர', kn: 'ந',
      qu: 'க்வ', wh: 'வ்', st: 'ஸ்ட', sp: 'ஸ்ப', sk: 'ஸ்க', sc: 'ஸ்க', sm: 'ஸ்ம',
      sn: 'ஸ்ந', sl: 'ஸ்ல', sw: 'ஸ்வ', pl: 'ப்ல', pr: 'ப்ர', bl: 'ப்ல', br: 'ப்ர',
      tr: 'ட்ர', dr: 'ட்ர', cl: 'க்ல', cr: 'க்ர', gl: 'க்ல', gr: 'க்ர', fl: 'ப்ல',
      fr: 'ப்ர', k: 'க', g: 'க', j: 'ஜ', t: 'ட', d: 'ட', n: 'ந', p: 'ப',
      f: 'ப', b: 'ப', m: 'ம', y: 'ய', r: 'ர', l: 'ல', v: 'வ', w: 'வ',
      s: 'ஸ', h: 'ஹ', x: 'க்ஸ்', z: 'ஜ', q: 'க', c: 'க'
    }
  },
  kannada: {
    virama: '\u0CCD', // ್
    startVowels: {
      aa: 'ಆ', ee: 'ಈ', ii: 'ಈ', oo: 'ಊ', uu: 'ಊ', ai: 'ಐ', au: 'ಔ', ou: 'ಔ',
      ea: 'ಈ', oa: 'ಓ', a: 'ಅ', e: 'ಎ', i: 'ಇ', o: 'ಒ', u: 'ಉ'
    },
    matras: {
      aa: '\u0CBE', ee: '\u0CC0', ii: '\u0CC0', oo: '\u0CC2', uu: '\u0CC2',
      ai: '\u0CC8', ay: '\u0CC7', au: '\u0CCC', ou: '\u0CCC', ow: '\u0CCC',
      ea: '\u0CC0', oa: '\u0CCA', a: '\u0CBE', e: '\u0CC6', i: '\u0CBF',
      o: '\u0CCA', u: '\u0CC1'
    },
    consonants: {
      sch: 'ಸ್ಕ್', str: 'ಸ್ಟ್ರ', spr: 'ಸ್ಪ್ರ', spl: 'ಸ್ಪ್ಲ', scr: 'ಸ್ಕ್ರ',
      thr: 'ಥ್ರ', shr: 'ಶ್ರ', chr: 'ಕ್ರ', ph: 'ಫ', th: 'ಥ', sh: 'ಶ್', ch: 'ಚ್',
      gh: 'ಘ', kh: 'ಖ', jh: 'ಝ', dh: 'ಧ', bh: 'ಭ', ng: 'ಂಗ್', nk: 'ಂಕ್', nt: 'ಂಟ್', nd: 'ಂಡ್', mp: 'ಂಪ್', ns: 'ನ್ಸ್', nch: 'ಂಚ್', ck: 'ಕ್', wr: 'ರ', kn: 'ನ',
      qu: 'ಕ್ವ', wh: 'ವ್', st: 'ಸ್ಟ', sp: 'ಸ್ಪ', sk: 'ಸ್ಕ', sc: 'ಸ್ಕ', sm: 'ಸ್ಮ',
      sn: 'ಸ್ನ', sl: 'ಸ್ಲ', sw: 'ಸ್ವ', pl: 'ಪ್ಲ', pr: 'ಪ್ರ', bl: 'ಬ್ಲ', br: 'ಬ್ರ',
      tr: 'ಟ್ರ', dr: 'ಡ್ರ', cl: 'ಕ್ಲ', cr: 'ಕ್ರ', gl: 'ಗ್ಲ', gr: 'ಗ್ರ', fl: 'ಫ್ಲ',
      fr: 'ಫ್ರ', k: 'ಕ', g: 'ಗ', j: 'ಜ', t: 'ಟ', d: 'ಡ', n: 'ನ', p: 'ಪ',
      f: 'ಫ', b: 'ಬ', m: 'ಮ', y: 'ಯ', r: 'ರ', l: 'ಲ', v: 'ವ', w: 'ವ',
      s: 'ಸ', h: 'ಹ', x: 'ಕ್ಸ್', z: 'ಜ', q: 'ಕ', c: 'ಕ'
    }
  },
  marathi: {
    virama: '\u094D', // ्
    startVowels: {
      aa: 'आ', ee: 'ई', ii: 'ई', oo: 'ऊ', uu: 'ऊ', ai: 'ऐ', au: 'औ', ou: 'औ',
      ea: 'ई', oa: 'ओ', a: 'अ', e: 'ए', i: 'इ', o: 'ओ', u: 'उ'
    },
    matras: {
      aa: '\u093E', ee: '\u0940', ii: '\u0940', oo: '\u0942', uu: '\u0942',
      ai: '\u0948', ay: '\u0947', au: '\u094C', ou: '\u094C', ow: '\u094C',
      ea: '\u0940', oa: '\u094B', a: '\u093E', e: '\u0947', i: '\u093F',
      o: '\u094B', u: '\u0941'
    },
    consonants: {
      sch: 'स्क', str: 'स्ट्र', spr: 'स्प्र', spl: 'स्प्ल', scr: 'स्क्र',
      thr: 'थ्र', shr: 'श्र', chr: 'क्र', ph: 'फ', th: 'थ', sh: 'श', ch: 'च',
      gh: 'घ', kh: 'ख', jh: 'झ', dh: 'ध', bh: 'भ', ng: 'ंग', nk: 'ंक', nt: 'ंट', nd: 'ंड', mp: 'ंप', ns: 'ंस', nch: 'ंच', ck: 'क', wr: 'र', kn: 'न',
      qu: 'क्व', wh: 'व', st: 'स्ट', sp: 'स्प', sk: 'स्क', sc: 'स्क', sm: 'स्म',
      sn: 'स्न', sl: 'स्ल', sw: 'स्व', pl: 'प्ल', pr: 'प्र', bl: 'ब्ल', br: 'ब्र',
      tr: 'ट्र', dr: 'ड्र', cl: 'क्ल', cr: 'क्र', gl: 'ग्ल', gr: 'ग्र', fl: 'फ्ल',
      fr: 'फ्र', k: 'क', g: 'ग', j: 'ज', t: 'ट', d: 'ड', n: 'न', p: 'प',
      f: 'फ', b: 'ब', m: 'म', y: 'य', r: 'र', l: 'ल', v: 'व', w: 'व',
      s: 'स', h: 'ह', x: 'क्स', z: 'झ', q: 'क', c: 'क'
    }
  },
  bengali: {
    virama: '\u09CD', // ্
    startVowels: {
      aa: 'আ', ee: 'ঈ', ii: 'ঈ', oo: 'ঊ', uu: 'ঊ', ai: 'ঐ', au: 'ঔ', ou: 'ঔ',
      ea: 'ঈ', oa: 'ও', a: 'অ', e: 'এ', i: 'ই', o: 'ও', u: 'উ'
    },
    matras: {
      aa: '\u09BE', ee: '\u09C0', ii: '\u09C0', oo: '\u09C2', uu: '\u09C2',
      ai: '\u09C8', ay: '\u09C7', au: '\u09CC', ou: '\u09CC', ow: '\u09CC',
      ea: '\u09C0', oa: '\u09CB', a: '\u09BE', e: '\u09C7', i: '\u09BF',
      o: '\u09CB', u: '\u09C1'
    },
    consonants: {
      sch: 'স্ক', str: 'স্ট্র', spr: 'স্প্র', spl: 'স্প্ল', scr: 'স্ক্র',
      thr: 'থ্র', shr: 'শ্র', chr: 'ক্র', ph: 'ফ', th: 'থ', sh: 'শ', ch: 'চ',
      gh: 'ঘ', kh: 'খ', jh: 'ঝ', dh: 'ধ', bh: 'ভ', ng: 'ং', nk: 'ংক', nt: 'ন্ট', nd: 'ন্ড', mp: 'ম্প', ns: 'ন্স', nch: 'ঞ্চ', ck: 'ক', wr: 'র', kn: 'ন',
      qu: 'ক্ব', wh: 'ভ', st: 'স্ট', sp: 'স্প', sk: 'স্ক', sc: 'স্ক', sm: 'স্ম',
      sn: 'স্ন', sl: 'স্ল', sw: 'স্ব', pl: 'প্ল', pr: 'প্র', bl: 'ব্ল', br: 'ব্র',
      tr: 'ট্র', dr: 'ড্র', cl: 'ক্ল', cr: 'ক্র', gl: 'গ্ল', gr: 'গ্র', fl: 'ফ্ল',
      fr: 'ফ্র', k: 'ক', g: 'গ', j: 'জ', t: 'ট', d: 'ড', n: 'ন', p: 'প',
      f: 'ফ', b: 'ব', m: 'ম', y: 'য', r: 'র', l: 'ল', v: 'ভ', w: 'ভ',
      s: 'স', h: 'হ', x: 'ক্স', z: 'জ', q: 'ক', c: 'ক'
    }
  },
  gujarati: {
    virama: '\u0ACD', // ્
    startVowels: {
      aa: 'આ', ee: 'ઈ', ii: 'ઈ', oo: 'ઊ', uu: 'ઊ', ai: 'ઐ', au: 'ઔ', ou: 'ઔ',
      ea: 'ઈ', oa: 'ઓ', a: 'અ', e: 'એ', i: 'ઇ', o: 'ઓ', u: 'ઉ'
    },
    matras: {
      aa: '\u0ABE', ee: '\u0AC0', ii: '\u0AC0', oo: '\u0AC2', uu: '\u0AC2',
      ai: '\u0AC8', ay: '\u0AC7', au: '\u0ACC', ou: '\u0ACC', ow: '\u0ACC',
      ea: '\u0AC0', oa: '\u0ACB', a: '\u0ABE', e: '\u0AC7', i: '\u0ABF',
      o: '\u0ACB', u: '\u0AC1'
    },
    consonants: {
      sch: 'સ્ક', str: 'સ્ટ્ર', spr: 'સ્પ્ર', spl: 'સ્પ્લ', scr: 'સ્ક્ર',
      thr: 'થ્ર', shr: 'શ્ર', chr: 'ક્ર', ph: 'ફ', th: 'થ', sh: 'શ', ch: 'ચ',
      gh: 'ઘ', kh: 'ખ', jh: 'ઝ', dh: 'ધ', bh: 'ભ', ng: 'ંગ', nk: 'ંક', nt: 'ન્ટ', nd: 'ન્ડ', mp: 'મ્પ', ns: 'ન્સ', nch: 'ન્ચ', ck: 'ક', wr: 'ર', kn: 'ન',
      qu: 'ક્વ', wh: 'વ', st: 'સ્ટ', sp: 'સ્પ', sk: 'સ્ક', sc: 'સ્ક', sm: 'સ્મ',
      sn: 'સ્ન', sl: 'સ્લ', sw: 'સ્વ', pl: 'પ્લ', pr: 'પ્ર', bl: 'બ્લ', br: 'બ્ર',
      tr: 'ટ્ર', dr: 'ડ્ર', cl: 'ક્લ', cr: 'ક્ર', gl: 'ગ્લ', gr: 'ગ્ર', fl: 'ફ્લ',
      fr: 'ફ્ર', k: 'ક', g: 'ગ', j: 'જ', t: 'ટ', d: 'ડ', n: 'ન', p: 'પ',
      f: 'ફ', b: 'બ', m: 'મ', y: 'ય', r: 'ર', l: 'લ', v: 'વ', w: 'વ',
      s: 'સ', h: 'હ', x: 'ક્સ', z: 'ઝ', q: 'ક', c: 'ક'
    }
  }
};

const VOWEL_SET = new Set(['a', 'e', 'i', 'o', 'u']);

/**
 * Universal Brahmic Phonetic Transliteration Engine
 * Deterministically transliterates any unknown English identifier to the target Indic script.
 */
export function phoneticTransliterate(word: string, lang: NativeLanguageKey): string {
  if (lang === 'english' || !word) return word;
  const spec = INDIC_SCRIPTS[lang];
  if (!spec) return word;

  const lower = word.toLowerCase();

  // 1. Common acronyms (e.g. ai, api, url, sql, http, etc.)
  if (COMMON_ACRONYMS[lang] && COMMON_ACRONYMS[lang][lower]) {
    return COMMON_ACRONYMS[lang][lower];
  }

  // 2. All-caps acronym letter-by-letter (e.g. RPC, DNS, FTP, CPU, SDK, CLI)
  if (/^[A-Z]{2,5}$/.test(word) && ACRONYM_LETTERS[lang]) {
    const letters = word.split('').map((char) => ACRONYM_LETTERS[lang][char] || char);
    return letters.join('');
  }

  // 3. Ambiguity safeguard: If word length >= 3 and has no vowels/consonant syllables,
  // preserve original identifier untouched rather than producing corrupted output
  if (word.length >= 3 && !/[aeiouy]/i.test(word) && !spec.consonants[lower]) {
    return word;
  }

  // 4. Common English Suffix Heuristics
  // -tion / -sion (e.g. action, condition, section)
  if ((lower.endsWith('tion') || lower.endsWith('sion')) && lower.length > 4) {
    const root = lower.slice(0, -4);
    const rootTrans = root ? phoneticTransliterate(root, lang) : '';
    const shSuffix: Record<NativeLanguageKey, string> = {
      telugu: 'షన్',
      hindi: 'शन',
      tamil: 'ஷன்',
      kannada: 'ಶನ್',
      marathi: 'शन',
      bengali: 'শন',
      gujarati: 'શન',
      english: 'tion',
    };
    return `${rootTrans}${shSuffix[lang] || 'షన్'}`;
  }

  // -ture (e.g. feature, picture, structure)
  if (lower.endsWith('ture') && lower.length > 4) {
    const root = lower.slice(0, -4);
    const rootTrans = phoneticTransliterate(root, lang);
    const tureSuffix: Record<NativeLanguageKey, string> = {
      telugu: 'చర్',
      hindi: 'चर',
      tamil: 'ச்சர்',
      kannada: 'ಚರ್',
      marathi: 'चर',
      bengali: 'চার',
      gujarati: 'ચર',
      english: 'ture',
    };
    return `${rootTrans}${tureSuffix[lang] || 'చర్'}`;
  }

  // -ment (e.g. element, payment, comment)
  if (lower.endsWith('ment') && lower.length > 4) {
    const root = lower.slice(0, -4);
    const rootTrans = phoneticTransliterate(root, lang);
    const mentSuffix: Record<NativeLanguageKey, string> = {
      telugu: 'మెంట్',
      hindi: 'मेंट',
      tamil: 'மென்ட்',
      kannada: 'ಮೆಂಟ್',
      marathi: 'मेंट',
      bengali: 'মেন্ট',
      gujarati: 'મેન્ટ',
      english: 'ment',
    };
    return `${rootTrans}${mentSuffix[lang] || 'మెంట్'}`;
  }

  // -ing (e.g. loading, filtering, sorting)
  if (lower.endsWith('ing') && lower.length > 4) {
    const root = lower.slice(0, -3);
    const rootTrans = phoneticTransliterate(root, lang);
    const ingSuffix: Record<NativeLanguageKey, string> = {
      telugu: 'ఇంగ్',
      hindi: 'इंग',
      tamil: 'இங்',
      kannada: 'ಇಂಗ್',
      marathi: 'इंग',
      bengali: 'ইং',
      gujarati: 'ઇંગ',
      english: 'ing',
    };
    return `${rootTrans}${ingSuffix[lang] || 'ఇంగ్'}`;
  }

  // 5. Silent 'e' / Magic 'e' pattern (e.g. name, rate, price, code, save, base, mode, file)
  const magicEMatch = lower.match(/^([a-z]*?)([aeiou])([bcdfghjklmnpqrstvwxyz])e$/);
  if (magicEMatch && lower.length >= 4) {
    const prefixCons = magicEMatch[1];
    const vowel = magicEMatch[2];
    const finalCons = magicEMatch[3];

    let preOut = prefixCons ? phoneticTransliterate(prefixCons, lang) : '';
    if (preOut.endsWith(spec.virama)) {
      preOut = preOut.slice(0, -spec.virama.length);
    }

    const vowelMatra: Record<string, string> = {
      a: spec.matras['ay'] || spec.matras['e'] || '',
      i: spec.matras['ai'] || '',
      o: spec.matras['oa'] || spec.matras['o'] || '',
      u: spec.matras['uu'] || spec.matras['u'] || '',
      e: spec.matras['ee'] || '',
    };
    const cChar = spec.consonants[finalCons] || finalCons;
    const trailingVirama = (lang === 'telugu' || lang === 'tamil' || lang === 'kannada') ? spec.virama : '';
    return `${preOut}${vowelMatra[vowel] || ''}${cChar}${trailingVirama}`;
  }

  const w = lower;
  let out = '';
  let i = 0;
  let lastWasConsonant = false;

  while (i < w.length) {
    // Check soft c ('ce', 'ci', 'cy' -> 's')
    if (w[i] === 'c' && i + 1 < w.length && (w[i + 1] === 'e' || w[i + 1] === 'i' || w[i + 1] === 'y')) {
      if (lastWasConsonant) out += spec.virama;
      out += spec.consonants['s'];
      lastWasConsonant = true;
      i++;
      continue;
    }

    // Check vowels
    if (VOWEL_SET.has(w[i])) {
      let vKey = w[i];
      if (i + 1 < w.length && spec.matras[w.slice(i, i + 2)]) {
        vKey = w.slice(i, i + 2);
      }

      if (lastWasConsonant) {
        if (vKey === 'a' && i + vKey.length < w.length) {
          // implicit vowel inside word
        } else {
          out += spec.matras[vKey] || '';
        }
      } else {
        out += spec.startVowels[vKey] || vKey;
      }
      i += vKey.length;
      lastWasConsonant = false;
      continue;
    }

    // Consonants (greedy 3, 2, 1 match)
    let match = '';
    let matchLen = 0;
    for (const len of [3, 2, 1]) {
      const sub = w.slice(i, i + len);
      if (spec.consonants[sub]) {
        match = spec.consonants[sub];
        matchLen = len;
        break;
      }
    }

    if (match) {
      if (lastWasConsonant) {
        out += spec.virama;
      }
      out += match;
      lastWasConsonant = true;
      i += matchLen;
    } else {
      i++;
    }
  }

  // Final virama check for South Indian scripts
  if (lastWasConsonant && (lang === 'telugu' || lang === 'tamil' || lang === 'kannada') && !out.endsWith(spec.virama)) {
    out += spec.virama;
  }

  return out;
}

// ─── 3. Curated Indic Dictionaries for Programming Identifiers ───────────────

export const TELUGU_DICTIONARY: Record<string, string> = {
  agent: 'ఏజెంట్',
  react: 'రియాక్ట్',
  series: 'సిరీస్',
  calculate_sum: 'మొత్తం_లెక్క',
  calculatesum: 'మొత్తం_లెక్క',
  calculateSum: 'మొత్తం_లెక్క',
  format_result: 'రిజల్ట్_ఫార్మాట్',
  formatResult: 'రిజల్ట్_ఫార్మాట్',
  count_number: 'నంబర్_కౌంట్',
  count: 'కౌంట్',
  target: 'టార్గెట్',
  arr: 'అర్ర్',
  array: 'అర్రే',
  arrays: 'అర్రేస్',
  num: 'నంబర్',
  number: 'నంబర్',
  numbers: 'నంబర్స్',
  nums: 'నంబర్స్',
  result: 'రిజల్ట్',
  results: 'రిజల్ట్స్',
  val: 'వాల్యూ',
  value: 'వాల్యూ',
  values: 'వాల్యూస్',
  item: 'ఐటమ్',
  items: 'ఐటమ్స్',
  elem: 'ఎలిమెంట్',
  element: 'ఎలిమెంట్',
  elements: 'ఎలిమెంట్స్',
  idx: 'ఇండెక్స్',
  index: 'ఇండెక్స్',
  indices: 'ఇండిసెస్',
  total: 'టోటల్',
  sum: 'సమ్',
  average: 'యావరేజ్',
  avg: 'యావరేజ్',
  calculate_average: 'యావరేజ్_కాలిక్యులేట్',
  calculateAverage: 'యావరేజ్_కాలిక్యులేట్',
  score: 'స్కోర్',
  scores: 'స్కోర్స్',
  grade: 'గ్రేడ్',
  grades: 'గ్రేడ్స్',
  temp: 'టెంప్',
  temporary: 'టెంపరరీ',
  data: 'డేటా',
  database: 'డేటాబేస్',
  table: 'టేబుల్',
  row: 'రో',
  col: 'కాల్',
  column: 'కాలమ్',
  columns: 'కాలమ్స్',
  matrix: 'మాట్రిక్స్',
  key: 'కీ',
  keys: 'కీస్',
  text: 'టెక్స్ట్',
  string: 'స్ట్రింగ్',
  strings: 'స్ట్రింగ్స్',
  char: 'క్యార్',
  chars: 'క్యార్స్',
  character: 'క్యారెక్టర్',
  characters: 'క్యారెక్టర్స్',
  length: 'లెంగ్త్',
  len: 'లెన్',
  size: 'సైజ్',
  width: 'విడ్త్',
  height: 'హైట్',
  max: 'మాక్స్',
  maximum: 'మాక్సిమమ్',
  min: 'మిన్',
  minimum: 'మినిమమ్',
  flag: 'ఫ్లాగ్',
  found: 'ఫౌండ్',
  is_valid: 'ఈజ్_వ్యాలిడ్',
  valid: 'వ్యాలిడ్',
  invalid: 'ఇన్వ్యాలిడ్',
  check: 'చెక్',
  find: 'ఫైండ్',
  search: 'సెర్చ్',
  binary_search: 'బైనరీ_సెర్చ్',
  binarySearch: 'బైనరీ_సెర్చ్',
  linear_search: 'లీనియర్_సెర్చ్',
  sort: 'సార్ట్',
  sorted: 'సార్టెడ్',
  filter: 'ఫిల్టర్',
  filter_even_numbers: 'ఈవెన్_నంబర్స్_ఫిల్టర్',
  filterEvenNumbers: 'ఈవెన్_నంబర్స్_ఫిల్టర్',
  even_numbers: 'ఈవెన్_నంబర్స్',
  evens: 'ఈవెన్స్',
  odds: 'ఆడ్స్',
  even: 'ఈవెన్',
  odd: 'ఆడ్',
  user: 'యూజర్',
  users: 'యూజర్స్',
  user_name: 'యూజర్_నేమ్',
  username: 'యూజర్‌నేమ్',
  name: 'నేమ్',
  names: 'నేమ్స్',
  first_name: 'ఫస్ట్_నేమ్',
  last_name: 'లాస్ట్_నేమ్',
  first: 'ఫస్ట్',
  last: 'లాస్ట్',
  middle: 'మిడిల్',
  start: 'స్టార్ట్',
  end: 'ఎండ్',
  step: 'స్టెప్',
  left: 'లెఫ్ట్',
  right: 'రైట్',
  mid: 'మిడ్',
  low: 'లో',
  high: 'హై',
  head: 'హెడ్',
  tail: 'టైల్',
  node: 'నోడ్',
  nodes: 'నోడ్స్',
  next: 'నెక్స్ట్',
  prev: 'ప్రివ్',
  previous: 'ప్రీవియస్',
  tree: 'ట్రీ',
  root: 'రూట్',
  leaf: 'లీఫ్',
  parent: 'పేరెంట్',
  child: 'చైల్డ్',
  children: 'చిల్డ్రన్',
  graph: 'గ్రాఫ్',
  vertex: 'వర్టెక్స్',
  edge: 'ఎడ్జ్',
  edges: 'ఎడ్జెస్',
  queue: 'క్యూ',
  stack: 'స్టాక్',
  append: 'అపెండ్',
  appended: 'అపెండెడ్',
  push: 'పుష్',
  pop: 'పాప్',
  peek: 'పీక్',
  top: 'టాప్',
  bottom: 'బాటమ్',
  input: 'ఇన్పుట్',
  output: 'అవుట్పుట్',
  file: 'ఫైల్',
  files: 'ఫైల్స్',
  path: 'పాత్',
  dir: 'డైర్',
  directory: 'డైరెక్టరీ',
  folder: 'ఫోల్డర్',
  code: 'కోడ్',
  message: 'మెసేజ్',
  messages: 'మెసేజెస్',
  status: 'స్టేటస్',
  error: 'ఎర్రర్',
  errors: 'ఎర్రర్స్',
  success: 'సక్సెస్',
  failed: 'ఫెయిల్డ్',
  point: 'పాయింట్',
  points: 'పాయింట్స్',
  x: 'ఎక్స్',
  y: 'వై',
  z: 'జెడ్',
  i: 'ఐ',
  j: 'జె',
  k: 'కె',
  n: 'ఎన్',
  m: 'ఎమ్',
  s: 'ఎస్',
  t: 'టి',
  p: 'పి',
  q: 'క్యూ',
  req: 'రిక్వెస్ట్',
  res: 'రెస్పాన్స్',
  request: 'రిక్వెస్ట్',
  response: 'రెస్పాన్స్',
  param: 'పారామ్',
  params: 'పారామ్స్',
  parameter: 'పారామీటర్',
  parameters: 'పారామీటర్స్',
  arg: 'ఆర్గ్',
  args: 'ఆర్గ్స్',
  kwargs: 'క్వార్గ్స్',
  config: 'కాన్ఫిగ్',
  options: 'ఆప్షన్స్',
  props: 'ప్రాప్స్',
  state: 'స్టేట్',
  context: 'కాంటెక్స్ట్',
  helper: 'హెల్పర్',
  util: 'యూటిల్',
  utils: 'యూటిల్స్',
  process: 'ప్రాసెస్',
  handler: 'హ్యాండ్లర్',
  handle: 'హ్యాండిల్',
  event: 'ఈవెంట్',
  events: 'ఈవెంట్స్',
  target_count: 'టార్గెట్_కౌంట్',
  'target count': 'టార్గెట్ కౌంట్',
  occurrences: 'ఎన్ని సార్లు ఉందో',
  occurrence: 'ఒక్కరెన్స్',
  activities: 'యాక్టివిటీస్',
  local: 'లోకల్',
  weather: 'వెదర్',
  condition: 'కండిషన్',
  weather_condition: 'వెదర్_కండిషన్',
  check_local_activities: 'చెక్_లోకల్_యాక్టివిటీస్',
  museum: 'మ్యూజియం',
  library: 'లైబ్రరీ',
  park: 'పార్క్',
  sunny: 'సన్నీ',
  to: 'కు',
  for: 'కోసం',
  from: 'నుండి',
  in: 'లో',
  with: 'తో',
  is: 'అవును',
};

export const HINDI_DICTIONARY: Record<string, string> = {
  agent: 'एजेंट',
  react: 'रिएक्ट',
  series: 'सीरीज',
  calculate_sum: 'योग_गणना',
  calculateSum: 'योग_गणना',
  format_result: 'रिजल्ट_प्रारूप',
  formatResult: 'रिजल्ट_प्रारूप',
  helper: 'हेल्पर',
  helpers: 'हेल्पर्स',
  utils: 'यूटिल्स',
  count_number: 'काउंट_नंबर',
  count: 'काउंट',
  target: 'टार्गेट',
  arr: 'ऐर्र',
  array: 'ऐरे',
  arrays: 'ऐरेस',
  num: 'नंबर',
  number: 'नंबर',
  numbers: 'नंबर्स',
  nums: 'नंबर्स',
  result: 'रिजल्ट',
  results: 'रिजल्ट्स',
  val: 'वैल्यू',
  value: 'वैल्यू',
  values: 'वैल्यूज़',
  item: 'आइटम',
  items: 'आइटम्स',
  elem: 'एलिमेंट',
  element: 'एलिमेंट',
  elements: 'एलिमेंट्स',
  idx: 'इंडेक्स',
  index: 'इंडेक्स',
  indices: 'इंडिसेस',
  total: 'टोटल',
  sum: 'सम',
  average: 'औसत',
  avg: 'औसत',
  score: 'स्कोर',
  scores: 'स्कोर्स',
  grade: 'ग्रेड',
  grades: 'ग्रेड्स',
  temp: 'टेंप',
  data: 'डेटा',
  user: 'यूजर',
  users: 'यूजर्स',
  username: 'यूजरनेम',
  name: 'नाम',
  names: 'नाम',
  first: 'पहला',
  last: 'अंतिम',
  start: 'स्टार्ट',
  end: 'एंड',
  step: 'स्टेप',
  left: 'लेफ्ट',
  right: 'राइट',
  mid: 'मिड',
  low: 'लो',
  high: 'हाई',
  size: 'साइज',
  length: 'लेंथ',
  len: 'लेन',
  min: 'मिन',
  max: 'मैक्स',
  flag: 'फ्लैग',
  check: 'चेक',
  find: 'फाइंड',
  search: 'सर्च',
  binary_search: 'बाइनरी_सर्च',
  binarySearch: 'बाइनरी_सर्च',
  filter: 'फ़िल्टर',
  filter_even_numbers: 'फ़िल्टर_इवन_नंबर्स',
  filterEvenNumbers: 'फ़िल्टर_इवन_नंबर्स',
  even_numbers: 'इवन_नंबर्स',
  evens: 'इवन्स',
  odds: 'ऑड्स',
  even: 'इवन',
  odd: 'ऑड',
  occurrences: 'कितनी बार आया',
  activities: 'गतिविधियां',
  local: 'लोकल',
  weather: 'मौसम',
  condition: 'कंडीशन',
  weather_condition: 'मौसम_कंडीशन',
  check_local_activities: 'चेक_लोकल_गतिविधियां',
  museum: 'म्यूजियम',
  library: 'लाइब्रेरी',
  park: 'पार्क',
  sunny: 'धूप',
  target_count: 'टार्गेट_काउंट',
  msg: 'मैसेज',
  message: 'मैसेज',
};

export const TAMIL_DICTIONARY: Record<string, string> = {
  agent: 'ஏஜென்ட்',
  react: 'ரியாக்ட்',
  series: 'சீரிஸ்',
  calculate_sum: 'கூட்டுத்தொகை_கணக்கிடு',
  calculateSum: 'கூட்டுத்தொகை_கணக்கிடு',
  format_result: 'முடிவு_வடிவமைப்பு',
  formatResult: 'முடிவு_வடிவமைப்பு',
  helper: 'உதவியாளர்',
  utils: 'யூடில்ஸ்',
  count_number: 'கவுண்ட்_நம்பர்',
  count: 'கவுண்ட்',
  target: 'டார்கெட்',
  arr: 'அர்ர்',
  array: 'அரே',
  arrays: 'அரேஸ்',
  num: 'நம்பர்',
  number: 'நம்பர்',
  numbers: 'நம்பர்ஸ்',
  nums: 'நம்பர்ஸ்',
  result: 'ரிசல்ட்',
  results: 'ரிசல்ட்ஸ்',
  val: 'வேல்யூ',
  value: 'வேல்யூ',
  values: 'வேல்யூஸ்',
  item: 'ஐட்டம்',
  items: 'ஐட்டம்ஸ்',
  elem: 'எலிமெண்ட்',
  element: 'எலிமெண்ட்',
  elements: 'எலிமெண்ட்ஸ்',
  idx: 'இன்டெக்ஸ்',
  index: 'இன்டெக்ஸ்',
  indices: 'இன்டிசஸ்',
  total: 'டோட்டல்',
  sum: 'சம்',
  average: 'ஆவரேஜ்',
  avg: 'ஆவரேஜ்',
  score: 'ஸ்கோர்',
  scores: 'ஸ்கோர்ஸ்',
  data: 'டேட்டா',
  user: 'யூசர்',
  users: 'யூசர்ஸ்',
  username: 'யூசர்நேம்',
  name: 'நேம்',
  start: 'ஸ்டார்ட்',
  end: 'எண்ட்',
  left: 'லெஃப்ட்',
  right: 'ரைட்',
  mid: 'மிட்',
  low: 'லோ',
  high: 'ஹை',
  size: 'சைஸ்',
  length: 'லென்த்',
  len: 'லென்',
  min: 'மின்',
  max: 'மேக்ஸ்',
  flag: 'ஃபிளாக்',
  search: 'செர்ச்',
  binary_search: 'பைனரி_செர்ச்',
  binarySearch: 'பைனரி_செர்ச்',
  filter: 'ஃபில்டர்',
  filter_even_numbers: 'ஃபில்டர்_ஈவன்_நம்பர்ஸ்',
  filterEvenNumbers: 'ஃபில்டர்_ஈவன்_நம்பர்ஸ்',
  evens: 'ஈவன்ஸ்',
  even: 'ஈவன்',
  odd: 'ஆட்',
  occurrences: 'எத்தனை முறை உள்ளது',
  activities: 'ஆக்டிவிட்டிஸ்',
  weather: 'வெதர்',
  condition: 'கண்டிஷன்',
  weather_condition: 'வெதர்_கண்டிஷன்',
  target_count: 'டார்கெட்_கவுண்ட்',
};

export const KANNADA_DICTIONARY: Record<string, string> = {
  agent: 'ಏಜೆಂಟ್',
  react: 'ರಿಯಾಕ್ಟ್',
  series: 'ಸಿರೀಸ್',
  calculate_sum: 'ಮೊತ್ತ_ಲೆಕ್ಕ',
  calculateSum: 'ಮೊತ್ತ_ಲೆಕ್ಕ',
  format_result: 'ಫಲಿತಾಂಶ_ಸ್ವರೂಪ',
  formatResult: 'ಫಲಿತಾಂಶ_ಸ್ವರೂಪ',
  helper: 'ಸಹಾಯಕ',
  utils: 'ಯುಟಿಲ್ಸ್',
  count_number: 'ಕೌಂಟ್_ನಂಬರ್',
  count: 'ಕೌಂಟ್',
  target: 'ಟಾರ್ಗೆಟ್',
  arr: 'ಅರ್ರ್',
  array: 'ಅರೇ',
  arrays: 'ಅರೇಸ್',
  num: 'ನಂಬರ್',
  number: 'ನಂಬರ್',
  numbers: 'ನಂಬರ್ಸ್',
  nums: 'ನಂಬರ್ಸ್',
  result: 'ರಿಸಲ್ಟ್',
  results: 'ರಿಸಲ್ಟ್ಸ್',
  val: 'ವ್ಯಾಲ್ಯೂ',
  value: 'ವ್ಯಾಲ್ಯೂ',
  values: 'ವ್ಯಾಲ್ಯೂಸ್',
  item: 'ಐಟಮ್',
  items: 'ಐಟಮ್ಸ್',
  elem: 'ಎಲಿಮೆಂಟ್',
  element: 'ಎಲಿಮೆಂಟ್',
  elements: 'ಎಲಿಮೆಂಟ್ಸ್',
  idx: 'ಇಂಡೆಕ್ಸ್',
  index: 'ಇಂಡೆಕ್ಸ್',
  indices: 'ಇಂಡಿಸೆಸ್',
  total: 'ಟೋಟಲ್',
  sum: 'ಸಮ್',
  average: 'ಆವರೇಜ್',
  avg: 'ಆವರೇಜ್',
  score: 'ಸ್ಕೋರ್',
  scores: 'ಸ್ಕೋರ್ಸ್',
  data: 'ಡೇಟಾ',
  user: 'ಯೂಸರ್',
  users: 'ಯೂಸರ್ಸ್',
  username: 'ಯೂಸರ್‌ನೇಮ್',
  name: 'ನೇಮ್',
  start: 'ಸ್ಟಾರ್ಟ್',
  end: 'ಎಂಡ್',
  left: 'ಲೆಫ್ಟ್',
  right: 'ರೈಟ್',
  mid: 'ಮಿಡ್',
  low: 'ಲೋ',
  high: 'ಹೈ',
  size: 'ಸೈಜ್',
  length: 'ಲೆಂಗ್ತ್',
  len: 'ಲೆನ್',
  min: 'ಮಿನ್',
  max: 'ಮ್ಯಾಕ್ಸ್',
  flag: 'ಫ್ಲ್ಯಾಗ್',
  search: 'ಸರ್ಚ್',
  binary_search: 'ಬೈನರಿ_ಸರ್ಚ್',
  binarySearch: 'ಬೈನರಿ_ಸರ್ಚ್',
  filter: 'ಫಿಲ್ಟರ್',
  filter_even_numbers: 'ಫಿಲ್ಟರ್_ಈವನ್_ನಂಬರ್ಸ್',
  filterEvenNumbers: 'ಫಿಲ್ಟರ್_ಈವನ್_ನಂಬರ್ಸ್',
  evens: 'ಈವನ್ಸ್',
  even: 'ಈವನ್',
  odd: 'ಆಡ್',
  occurrences: 'ಎಷ್ಟು ಬಾರಿ ಇದೆ',
  activities: 'ಆಕ್ಟಿವಿಟೀಸ್',
  weather: 'ವೆದರ್',
  condition: 'ಕಂಡೀಷನ್',
  weather_condition: 'ವೆದರ್_ಕಂಡೀಷನ್',
  target_count: 'ಟಾರ್ಗೆಟ್_ಕೌಂಟ್',
};

export const MARATHI_DICTIONARY: Record<string, string> = {
  agent: 'एजंट',
  react: 'रिएक्ट',
  series: 'सीरीज',
  calculate_sum: 'योग_गणना',
  calculateSum: 'योग_गणना',
  format_result: 'रिजल्ट_प्रारूप',
  formatResult: 'रिजल्ट_प्रारूप',
  helper: 'हेल्पर',
  helpers: 'हेल्पर्स',
  utils: 'यूटिल्स',
  count_number: 'काउंट_नंबर',
  count: 'काउंट',
  target: 'टार्गेट',
  arr: 'ऐर्र',
  array: 'ऐरे',
  arrays: 'ऐरेस',
  num: 'नंबर',
  number: 'नंबर',
  numbers: 'नंबर्स',
  nums: 'नंबर्स',
  result: 'रिजल्ट',
  results: 'रिजल्ट्स',
  val: 'व्हॅल्यू',
  value: 'व्हॅल्यू',
  values: 'व्हॅल्यूज',
  item: 'आयटम',
  items: 'आयटम्स',
  elem: 'एलिमेंट',
  element: 'एलिमेंट',
  elements: 'एलिमेंट्स',
  idx: 'इंडेक्स',
  index: 'इंडेक्स',
  indices: 'इंडिसेस',
  total: 'टोटल',
  sum: 'सम',
  average: 'सरासरी',
  avg: 'सरासरी',
  score: 'स्कोर',
  scores: 'स्कोर्स',
  data: 'डेटा',
  user: 'युझर',
  users: 'युझर्स',
  name: 'नेम',
  start: 'स्टार्ट',
  end: 'एंड',
  left: 'लेफ्ट',
  right: 'राइट',
  mid: 'मिड',
  low: 'लो',
  high: 'हाय',
  size: 'साइज',
  length: 'लेंथ',
  len: 'लेन',
  search: 'सर्च',
  binary_search: 'बायनरी_सर्च',
  binarySearch: 'बायनरी_सर्च',
  filter: 'फिल्टर',
  filter_even_numbers: 'फिल्टर_इव्हन_नंबर्स',
  filterEvenNumbers: 'फिल्टर_इव्हन_नंबर्स',
  even: 'इव्हन',
  odd: 'ऑड',
  occurrences: 'किती वेळा आले',
  target_count: 'टार्गेट_काउंट',
};

export const BENGALI_DICTIONARY: Record<string, string> = {
  agent: 'এজেন্ট',
  react: 'রিয়্যাক্ট',
  series: 'সিরিজ',
  calculate_sum: 'যোগফল_গণনা',
  calculateSum: 'যোগফল_গণনা',
  format_result: 'ফলাফল_ফরম্যাট',
  formatResult: 'ফলাফল_ফরম্যাট',
  helper: 'সহায়িকা',
  utils: 'ইউটিলস',
  count_number: 'কাউন্ট_নাম্বার',
  count: 'কাউন্ট',
  target: 'টার্গেট',
  arr: 'অ্যার্',
  array: 'অ্যারে',
  arrays: 'অ্যারেস',
  num: 'নাম্বার',
  number: 'নাম্বার',
  numbers: 'নাম্বার্স',
  nums: 'নাম্বার্স',
  result: 'রেজাল্ট',
  results: 'রেজাল্টস',
  val: 'ভ্যালু',
  value: 'ভ্যালু',
  values: 'ভ্যালুস',
  item: 'আইটেম',
  items: 'আইটেমস',
  elem: 'এলিমেন্ট',
  element: 'এলিমেন্ট',
  elements: 'এলিমেন্টস',
  idx: 'ইনডেক্স',
  index: 'ইনডেক্স',
  indices: 'ইনডিসেস',
  total: 'টোটাল',
  sum: 'সাম',
  average: 'অ্যাভারেজ',
  avg: 'অ্যাভারেজ',
  score: 'স্কোর',
  scores: 'স্কোরস',
  data: 'ডেটা',
  user: 'ইউজার',
  users: 'ইউজার্স',
  name: 'নেম',
  start: 'স্টার্ট',
  end: 'এন্ড',
  left: 'লেফট',
  right: 'রাইট',
  mid: 'মিড',
  low: 'লো',
  high: 'হাই',
  size: 'সাইজ',
  length: 'লেংথ',
  len: 'লেন',
  search: 'সার্চ',
  binary_search: 'বাইনারি_সার্চ',
  binarySearch: 'বাইনারি_সার্চ',
  filter: 'ফিল্টার',
  filter_even_numbers: 'ফিল্টার_ইভেন_নাম্বার্স',
  filterEvenNumbers: 'ফিল্টার_ইভেন_নাম্বার্স',
  even: 'ইভেন',
  odd: 'অড',
  occurrences: 'কত বার আছে',
  target_count: 'টার্গেট_কাউন্ট',
};

export const GUJARATI_DICTIONARY: Record<string, string> = {
  agent: 'એજન્ટ',
  react: 'રિએક્ટ',
  series: 'સીરીઝ',
  calculate_sum: 'સરવાળો_ગણના',
  calculateSum: 'સરવાળો_ગણના',
  format_result: 'પરિણામ_સ્વરૂપ',
  formatResult: 'પરિણામ_સ્વરૂપ',
  helper: 'મદદનીશ',
  utils: 'યુટિલ્સ',
  count_number: 'કાઉન્ટ_નંબર',
  count: 'કાઉન્ટ',
  target: 'ટાર્ગેટ',
  arr: 'એર્ર',
  array: 'એરે',
  arrays: 'એરેસ',
  num: 'નંબર',
  number: 'નંબર',
  numbers: 'નંબર્સ',
  nums: 'નંબર્સ',
  result: 'રિઝલ્ટ',
  results: 'રિઝલ્ટ્સ',
  val: 'વેલ્યુ',
  value: 'વેલ્યુ',
  values: 'વેલ્યુઝ',
  item: 'આઇટમ',
  items: 'આઇટમ્સ',
  elem: 'એલિમેન્ટ',
  element: 'એલિમેન્ટ',
  elements: 'એલિમેન્ટ્સ',
  idx: 'ઇન્ડેક્સ',
  index: 'ઇન્ડેક્સ',
  indices: 'ઇન્ડિસેસ',
  total: 'ટોટલ',
  sum: 'સમ',
  average: 'એવરેજ',
  avg: 'એવરેજ',
  score: 'સ્કોર',
  scores: 'સ્કોર્સ',
  data: 'ડેટા',
  user: 'યુઝર',
  users: 'યુઝર્સ',
  name: 'નેમ',
  start: 'સ્ટાર્ટ',
  end: 'એન્ડ',
  left: 'લેફ્ટ',
  right: 'રાઇટ',
  mid: 'મિડ',
  low: 'લો',
  high: 'હાઇ',
  size: 'સાઇઝ',
  length: 'લેન્થ',
  len: 'લેન',
  search: 'સર્ચ',
  binary_search: 'બાઈનરી_સર્ચ',
  binarySearch: 'બાઈનરી_સર્ચ',
  filter: 'ફિલ્ટર',
  filter_even_numbers: 'ફિલ્ટર_ઇવન_નંબર્સ',
  filterEvenNumbers: 'ફિલ્ટર_ઇવન_નંબર્સ',
  even: 'ઇવન',
  odd: 'ઓડ',
  occurrences: 'કેટલી વાર છે',
  target_count: 'ટાર્ગેટ_કાઉન્ટ',
};

export const NATIVE_DICTIONARIES: Record<string, Record<string, string>> = {
  telugu: TELUGU_DICTIONARY,
  hindi: HINDI_DICTIONARY,
  tamil: TAMIL_DICTIONARY,
  kannada: KANNADA_DICTIONARY,
  marathi: MARATHI_DICTIONARY,
  bengali: BENGALI_DICTIONARY,
  gujarati: GUJARATI_DICTIONARY,
};

// ─── 4. Comment Phrases per Language ───────────────────────────────────────────
export const TELUGU_COMMENT_PHRASES: Record<string, string> = {
  'count occurrences in array': 'నంబర్ కౌంట్ అర్రే లో టార్గెట్ నంబర్ ఎన్ని సార్లు ఉందో కౌంట్ చేయాలి',
  'count occurrences in list': 'నంబర్ కౌంట్ లిస్ట్ లో టార్గెట్ నంబర్ ఎన్ని సార్లు ఉందో కౌంట్ చేయాలి',
  'count occurrences': 'ఎన్ని సార్లు ఉందో కౌంట్ చేయడం',
  'find target in array': 'అర్రే లో టార్గెట్ వెతకడం',
  'find target': 'టార్గెట్ వెతకడం',
  'binary search': 'బైనరీ సెర్చ్',
  'binary search in array': 'అర్రే లో బైనరీ సెర్చ్',
  'calculate average': 'యావరేజ్ లెక్కించడం',
  'filter even numbers': 'ఈవెన్ నంబర్స్ ఫిల్టర్ చేయడం',
  'off-by-one and division by zero vulnerability': 'ఇండెక్స్ బగ్ మరియు జీరో డివిజన్ సమస్య',
};

export const HINDI_COMMENT_PHRASES: Record<string, string> = {
  'count occurrences in array': 'ऐरे में टारगेट कितनी बार आया काउंट करना',
  'count occurrences in list': 'लिस्ट में टारगेट कितनी बार आया काउंट करना',
  'binary search': 'बाइनरी सर्च',
  'binary search in array': 'ऐरे में बाइनरी सर्च',
  'calculate average': 'औसत निकालना',
  'filter even numbers': 'इवन नंबर्स फ़िल्टर करना',
};

export const TAMIL_COMMENT_PHRASES: Record<string, string> = {
  'count occurrences in array': 'அரேயில் டார்கெட் எத்தனை முறை உள்ளது கவுண்ட் செய்தல்',
  'count occurrences in list': 'பட்டியலில் டார்கெட் எத்தனை முறை உள்ளது கவுண்ட் செய்தல்',
  'binary search': 'பைனரி செர்ச்',
  'binary search in array': 'அரேயில் பைனரி செர்ச்',
};

export const KANNADA_COMMENT_PHRASES: Record<string, string> = {
  'count occurrences in array': 'ಅರೇಯಲ್ಲಿ ಟಾರ್ಗೆಟ್ ಎಷ್ಟು ಬಾರಿ ಇದೆ ಕೌಂಟ್ ಮಾಡುವುದು',
  'count occurrences in list': 'ಪಟ್ಟಿಯಲ್ಲಿ ಟಾರ್ಗೆಟ್ ಎಷ್ಟು ಬಾರಿ ಇದೆ ಕೌಂಟ್ ಮಾಡುವುದು',
  'binary search': 'ಬೈನರಿ ಸರ್ಚ್',
  'binary search in array': 'ಅರೇಯಲ್ಲಿ ಬೈನರಿ ಸರ್ಚ್',
};

export const MARATHI_COMMENT_PHRASES: Record<string, string> = {
  'count occurrences in array': 'ऐरे मध्ये टार्गेट किती वेळा आले काउंट करणे',
  'binary search in array': 'ऐरे मध्ये बायनरी सर्च',
};

export const BENGALI_COMMENT_PHRASES: Record<string, string> = {
  'count occurrences in array': 'অ্যারেতে টার্গেট কত বার আছে কাউন্ট করা',
  'binary search in array': 'অ্যারেতে বাইনারি সার্চ',
};

export const GUJARATI_COMMENT_PHRASES: Record<string, string> = {
  'count occurrences in array': 'એરેમાં ટાર્ગેટ કેટલી વાર છે કાઉન્ટ કરવું',
  'binary search in array': 'એરેમાં બાઈનરી સર્ચ',
};

export const NATIVE_COMMENT_PHRASES: Record<string, Record<string, string>> = {
  telugu: TELUGU_COMMENT_PHRASES,
  hindi: HINDI_COMMENT_PHRASES,
  tamil: TAMIL_COMMENT_PHRASES,
  kannada: KANNADA_COMMENT_PHRASES,
  marathi: MARATHI_COMMENT_PHRASES,
  bengali: BENGALI_COMMENT_PHRASES,
  gujarati: GUJARATI_COMMENT_PHRASES,
};

// ─── 5. Preserved Keywords across Python, Java, JS, TS, C, C++ ──────────────────
export const PRESERVED_KEYWORDS = new Set([
  // Python keywords
  'def', 'return', 'if', 'elif', 'else', 'while', 'for', 'in', 'is', 'not', 'and', 'or',
  'break', 'continue', 'pass', 'class', 'import', 'from', 'as', 'try', 'except', 'finally',
  'raise', 'with', 'global', 'nonlocal', 'lambda', 'assert', 'async', 'await', 'del',
  'yield', 'self',

  // C / C++ keywords & preprocessor
  'include', 'define', 'ifdef', 'ifndef', 'endif', 'pragma', 'undef',
  'namespace', 'using', 'std', 'cout', 'cin', 'endl', 'printf', 'scanf',
  'struct', 'union', 'typedef', 'sizeof', 'goto', 'auto', 'register', 'volatile', 'extern',
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

  // Built-in functions & types
  'print', 'len', 'range', 'input', 'str', 'list', 'dict', 'set', 'tuple', 'open',
  'abs', 'min', 'max', 'sum', 'round', 'enumerate', 'zip', 'map', 'filter', 'sorted',
  'reversed', 'isinstance', 'issubclass',

  // Literals
  'True', 'False', 'None', 'true', 'false', 'null', 'undefined',

  // Standard libraries & built-in modules
  'math', 'sys', 'os', 'json', 'time', 'datetime', 'random', 're', 'collections',
  'itertools', 'functools', 'urllib', 'requests', 'http', 'asyncio', 'sqlite3',
  'pathlib', 'logging', 'subprocess', 'threading', 'multiprocessing', 'shutil',
  'tempfile', 'copy', 'heapq', 'bisect', 'hashlib', 'uuid', 'base64', 'unittest', 'pytest',
  'typing', 'List', 'Dict', 'Set', 'Tuple', 'Optional', 'Union', 'Any', 'Callable',
  'numpy', 'np', 'pandas', 'pd', 'matplotlib', 'plt', 'scipy', 'sklearn', 'torch', 'tensorflow',
  'fs', 'path', 'express', 'react', 'useState', 'useEffect', 'useMemo', 'useRef', 'useCallback'
]);

// Common built-in object methods (Never transliterate standard object method names)
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

// ─── 6. Single Word Transliteration Function ──────────────────────────────────
export function transliterateWord(word: string, lang: NativeLanguageKey): string {
  if (lang === 'english' || !word) return word;

  // Single letters preserved in English (loop indices: i, j, k, x, y, etc.)
  if (word.length === 1 && /[a-zA-Z]/.test(word)) {
    return word;
  }

  const lower = word.toLowerCase();
  const dict = NATIVE_DICTIONARIES[lang] || TELUGU_DICTIONARY;

  // 1. Direct dictionary match
  if (dict[lower]) {
    return dict[lower];
  }

  // 2. Acronym match (case-insensitive for common acronyms like ai, api, url, sql, etc.)
  if (COMMON_ACRONYMS[lang] && COMMON_ACRONYMS[lang][lower]) {
    return COMMON_ACRONYMS[lang][lower];
  }

  // 3. All-caps acronym letter-by-letter (e.g. JWT, RPC, DNS, CPU, SDK, CLI)
  if (/^[A-Z]{2,5}$/.test(word) && ACRONYM_LETTERS[lang]) {
    const letters = word.split('').map((char) => ACRONYM_LETTERS[lang][char] || char);
    return letters.join('');
  }

  // 4. Snake_case compound (e.g. count_number, weather_condition, user_id, api_key)
  if (word.includes('_')) {
    const parts = word.split('_');
    const translatedParts = parts.map((part) => {
      if (!part) return '';
      return transliterateWord(part, lang);
    });
    return translatedParts.join('_');
  }

  // 5. Trailing digits (e.g. num1, item2, var10)
  const numMatch = word.match(/^([a-zA-Z_]+)(\d+)$/);
  if (numMatch) {
    const base = transliterateWord(numMatch[1], lang);
    return `${base}${numMatch[2]}`;
  }

  // 6. CamelCase or PascalCase compound (including acronyms e.g. getAPIResponse, userID, filterEvenNumbers)
  const camelParts = word
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
    .split('_');
  if (camelParts.length > 1) {
    return camelParts.map((p) => transliterateWord(p, lang)).join('_');
  }

  // 7. Fallback: Deterministic universal phonetic transliteration
  return phoneticTransliterate(word, lang);
}

// Backward-compatible alias
export function transliterateWordToTelugu(word: string): string {
  return transliterateWord(word, 'telugu');
}

// ─── 7. String Literal Transliteration ─────────────────────────────────────────
function transliterateStringLiteral(literal: string, lang: NativeLanguageKey): string {
  if (lang === 'english' || !literal) return literal;

  let quote = '"';
  let inner = literal;
  if (literal.startsWith('"""') && literal.endsWith('"""')) {
    quote = '"""';
    inner = literal.slice(3, -3);
  } else if (literal.startsWith("'''") && literal.endsWith("'''")) {
    quote = "'''";
    inner = literal.slice(3, -3);
  } else if (literal.startsWith('"') && literal.endsWith('"')) {
    quote = '"';
    inner = literal.slice(1, -1);
  } else if (literal.startsWith("'") && literal.endsWith("'")) {
    quote = "'";
    inner = literal.slice(1, -1);
  } else if (literal.startsWith('`') && literal.endsWith('`')) {
    quote = '`';
    inner = literal.slice(1, -1);
  } else {
    return literal;
  }

  // Preserve file paths and import paths
  if (
    inner.startsWith('./') ||
    inner.startsWith('../') ||
    inner.startsWith('/') ||
    /\.(py|js|ts|jsx|tsx|json|html|css|png|jpg|svg)$/i.test(inner)
  ) {
    return literal;
  }

  // Check known compound strings in dictionary (e.g. "Target count:")
  const dict = NATIVE_DICTIONARIES[lang];
  const innerTrim = inner.trim();
  const stripped = innerTrim.replace(/[:,\s]+$/, '');
  const trailingPunct = innerTrim.slice(stripped.length);
  const innerLower = stripped.toLowerCase();
  const innerUnderscore = innerLower.replace(/\s+/g, '_');
  if (dict && (dict[innerLower] || dict[innerUnderscore])) {
    const matched = dict[innerLower] || dict[innerUnderscore];
    return `${quote}${matched}${trailingPunct}${quote}`;
  }

  // Preserve all other string literals untouched (data, user messages, URLs, JSON keys, etc.)
  return literal;
}

// ─── 8. Comment Transliteration ────────────────────────────────────────────────
function transliterateComment(comment: string, lang: NativeLanguageKey): string {
  if (lang === 'english' || !comment) return comment;

  // Match prefix (#, //, /*, *)
  const match = comment.match(/^(\s*(?:#|\/\/|\/\*|\*)\s*)(.*)$/);
  if (!match) return comment;

  const prefix = match[1];
  const text = match[2];

  const phrases = NATIVE_COMMENT_PHRASES[lang];
  const textLower = text.trim().toLowerCase();

  if (phrases && phrases[textLower]) {
    return `${prefix}${phrases[textLower]}`;
  }

  // Transliterate individual words
  const transliteratedText = text.replace(/[a-zA-Z_]+/g, (w) => {
    return transliterateWord(w, lang);
  });

  return `${prefix}${transliteratedText}`;
}

// ─── 9. Syntax-Aware Line Transliterator ───────────────────────────────────────
export function transliterateCodeLine(line: string, lang: NativeLanguageKey): string {
  if (lang === 'english' || !line) return line;

  // 1. Preserve indentation
  const indentMatch = line.match(/^(\s*)/);
  const indent = indentMatch ? indentMatch[1] : '';
  const trimmed = line.slice(indent.length);

  if (!trimmed) return line;

  // 2. Preserve C/C++ preprocessor directives (#include, #define, #ifdef, #ifndef, #endif, #pragma)
  if (/^#(include|define|ifdef|ifndef|endif|pragma|undef|if|elif|else)\b/.test(trimmed)) {
    return line;
  }

  // 2b. Module Import Handling: Preserve module paths & external library names across files
  const fromImportMatch = trimmed.match(/^from\s+([a-zA-Z0-9_.]+)\s+import\s+(.+)$/);
  if (fromImportMatch) {
    const modulePath = fromImportMatch[1];
    const rawItems = fromImportMatch[2];
    const transliteratedItems = rawItems.split(',').map((item) => {
      const trimmedItem = item.trim();
      if (!trimmedItem) return item;
      const asMatch = trimmedItem.match(/^([a-zA-Z0-9_]+)\s+as\s+([a-zA-Z0-9_]+)$/);
      if (asMatch) {
        return `${transliterateWord(asMatch[1], lang)} as ${transliterateWord(asMatch[2], lang)}`;
      }
      return transliterateWord(trimmedItem, lang);
    }).join(', ');
    return `${indent}from ${modulePath} import ${transliteratedItems}`;
  }

  const importMatch = trimmed.match(/^import\s+(.+)$/);
  if (importMatch && !trimmed.includes('from ')) {
    const rawModules = importMatch[1];
    const processed = rawModules.split(',').map((item) => {
      const trimmedItem = item.trim();
      const asMatch = trimmedItem.match(/^([a-zA-Z0-9_.]+)\s+as\s+([a-zA-Z0-9_]+)$/);
      if (asMatch) {
        return `${asMatch[1]} as ${transliterateWord(asMatch[2], lang)}`;
      }
      return trimmedItem;
    }).join(', ');
    return `${indent}import ${processed}`;
  }

  // 3. Full line comments
  if (trimmed.startsWith('#') || trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) {
    return `${indent}${transliterateComment(trimmed, lang)}`;
  }

  // 4. Tokenize line syntax-aware
  let out = indent;
  let i = 0;

  while (i < trimmed.length) {
    const char = trimmed[i];

    // Comments: # or // or /* ... */
    if (char === '#' || (char === '/' && trimmed[i + 1] === '/')) {
      const commentPart = trimmed.slice(i);
      out += transliterateComment(commentPart, lang);
      break;
    }

    if (char === '/' && trimmed[i + 1] === '*') {
      const endComment = trimmed.indexOf('*/', i + 2);
      if (endComment !== -1) {
        const commentPart = trimmed.slice(i, endComment + 2);
        out += transliterateComment(commentPart, lang);
        i = endComment + 2;
        continue;
      } else {
        const commentPart = trimmed.slice(i);
        out += transliterateComment(commentPart, lang);
        break;
      }
    }

    // String literals: "...", '...', `...`, f"...", f'...'
    if (char === '"' || char === "'" || char === '`' || (char === 'f' && (trimmed[i + 1] === '"' || trimmed[i + 1] === "'"))) {
      let quoteChar = char;
      const start = i;
      let isFString = false;
      if (char === 'f') {
        isFString = true;
        quoteChar = trimmed[i + 1];
        i++;
      }
      i++; // skip open quote
      while (i < trimmed.length && trimmed[i] !== quoteChar) {
        if (trimmed[i] === '\\' && i + 1 < trimmed.length) {
          i += 2;
        } else {
          i++;
        }
      }
      if (i < trimmed.length) i++; // skip close quote
      const rawString = trimmed.slice(start, i);
      const strLiteral = isFString ? rawString.slice(1) : rawString;
      const trans = transliterateStringLiteral(strLiteral, lang);
      out += isFString ? `f${trans}` : trans;
      continue;
    }

    // Identifiers and Keywords: [a-zA-Z_][a-zA-Z0-9_]*
    if (/[a-zA-Z_]/.test(char)) {
      const start = i;
      while (i < trimmed.length && /[a-zA-Z0-9_]/.test(trimmed[i])) {
        i++;
      }
      const token = trimmed.slice(start, i);

      // Check Python dunders (__init__, __str__, etc.)
      if (token.startsWith('__') && token.endsWith('__')) {
        out += token;
        continue;
      }

      // Check member access: preceded by '.' (e.g. obj.append, console.log)
      let prevNonWs = start - 1;
      while (prevNonWs >= 0 && /\s/.test(trimmed[prevNonWs])) prevNonWs--;
      const isMemberAccess = prevNonWs >= 0 && trimmed[prevNonWs] === '.';

      if (isMemberAccess && (BUILTIN_OBJECT_METHODS.has(token) || PRESERVED_KEYWORDS.has(token))) {
        out += token;
        continue;
      }

      // Check if followed by dot (e.g. math.sqrt, console.log)
      let nextNonWs = i;
      while (nextNonWs < trimmed.length && /\s/.test(trimmed[nextNonWs])) nextNonWs++;
      const isFollowedByDot = nextNonWs < trimmed.length && trimmed[nextNonWs] === '.';

      if (isFollowedByDot && PRESERVED_KEYWORDS.has(token)) {
        out += token;
        continue;
      }

      // Preserve programming keywords intact in English
      if (PRESERVED_KEYWORDS.has(token)) {
        out += token;
      } else {
        // Transliterate user-defined identifier to target native script
        out += transliterateWord(token, lang);
      }
      continue;
    }

    // Numbers: \d+(\.\d+)?
    if (/\d/.test(char)) {
      const start = i;
      while (i < trimmed.length && /[\d.xXa-fA-F]/.test(trimmed[i])) {
        i++;
      }
      out += trimmed.slice(start, i);
      continue;
    }

    // Whitespace
    if (/\s/.test(char)) {
      out += char;
      i++;
      continue;
    }

    // Operators and Punctuation (=, ==, +=, +, -, *, /, :, (, ), [, ], {, }, ,, ., ->, ::)
    out += char;
    i++;
  }

  return out;
}

// ─── 10. Multi-line Code Transliterator ───────────────────────────────────────
export function transliterateCode(code: string, lang: NativeLanguageKey = 'telugu'): string {
  if (lang === 'english' || !code) return code;

  const lines = code.split('\n');
  let inBlockComment = false;
  let inDocstring: string | null = null;

  const transliteratedLines = lines.map((line) => {
    // If inside a multiline docstring
    if (inDocstring) {
      const endIdx = line.indexOf(inDocstring);
      if (endIdx !== -1) {
        inDocstring = null;
      }
      return line;
    }

    // Check if line starts a multiline docstring
    const trimmed = line.trim();
    if ((trimmed.startsWith('"""') && !trimmed.slice(3).includes('"""')) ||
        (trimmed.startsWith("'''") && !trimmed.slice(3).includes("'''"))) {
      inDocstring = trimmed.startsWith('"""') ? '"""' : "'''";
      return line;
    }

    // If inside a multiline block comment /* ... */
    if (inBlockComment) {
      if (line.includes('*/')) {
        inBlockComment = false;
      }
      return line;
    }

    if (trimmed.startsWith('/*') && !trimmed.includes('*/')) {
      inBlockComment = true;
      return line;
    }

    return transliterateCodeLine(line, lang);
  });

  return transliteratedLines.join('\n');
}
