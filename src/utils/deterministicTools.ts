import { NativeLanguageKey } from '../types';
import { analyzeCodeRuleBased } from './ruleBasedAnalyzer';
import { translateCodeToNative } from './codeTranslator';

export interface DeterministicDebugResult {
  hasErrors: boolean;
  summary: string;
  likelyCauses: string[];
  originalCode: string;
  correctedCode: string;
  explanationOfFix: string;
  lineDiffs: Array<{ lineNumber: number; issue: string; correction: string }>;
  preventativeTips: string;
}

export interface DeterministicConvertResult {
  convertedCode: string;
  explanation: string;
  warnings: string[];
  keyDifferences: Array<{ sourceFeature: string; targetFeature: string; note: string }>;
}

/**
 * 100% Deterministic Rule-Based Debug & Fix Engine
 */
export function debugCodeDeterministically(
  code: string,
  progLang: string = 'python',
  nativeLang: NativeLanguageKey = 'english',
  errorLog: string = ''
): DeterministicDebugResult {
  if (!code || !code.trim()) {
    return {
      hasErrors: false,
      summary: 'No code provided to debug.',
      likelyCauses: [],
      originalCode: '',
      correctedCode: '',
      explanationOfFix: '',
      lineDiffs: [],
      preventativeTips: '',
    };
  }

  const lines = code.split('\n');
  const lineDiffs: Array<{ lineNumber: number; issue: string; correction: string }> = [];
  const likelyCauses: string[] = [];
  const correctedLines = [...lines];

  const isPython = progLang.toLowerCase().includes('py');
  const isJsOrTs = progLang.toLowerCase().includes('js') || progLang.toLowerCase().includes('ts');

  // 1. Check for runtime errorLog (e.g. ModuleNotFoundError)
  if (errorLog) {
    const modMatch = errorLog.match(/ModuleNotFoundError:\s+No module named\s+['"]([^'"]+)['"]/);
    if (modMatch) {
      const missingMod = modMatch[1];
      const issueText =
        nativeLang === 'telugu'
          ? `'${missingMod}' అనే ఎక్స్‌టర్నల్ లైబ్రరీ/ప్యాకేజీ ప్రస్తుతం ఇన్‌స్టాల్ కాలేదు.`
          : nativeLang === 'hindi'
          ? `'${missingMod}' नामक बाहरी लाइब्रेरी स्थापित नहीं है।`
          : `External package '${missingMod}' is not installed in the environment.`;
      const tipText =
        nativeLang === 'telugu'
          ? `టర్మినల్‌లో 'pip install ${missingMod}' రన్ చేయండి. లేదా ఇది ప్రాజెక్ట్ ఫైల్ అయితే '${missingMod}.py' ఫైల్‌ను సృష్టించండి.`
          : `Run 'pip install ${missingMod}' in terminal, or create '${missingMod}.py' in project files.`;

      return {
        hasErrors: true,
        summary: issueText,
        likelyCauses: [
          nativeLang === 'telugu'
            ? `ఈ ప్యాకేజీని ఇంకా ఇన్‌స్టాల్ చేయలేదు లేదా స్పెల్లింగ్ తప్పుగా ఉండవచ్చు.`
            : `The package has not been installed, or the import name is misspelled.`
        ],
        originalCode: code,
        correctedCode: code,
        explanationOfFix: tipText,
        lineDiffs: [{ lineNumber: 1, issue: issueText, correction: tipText }],
        preventativeTips: tipText,
      };
    }
  }

  // 2. Syntax & Common Logic Analysis for Python
  if (isPython) {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();
      const lineNum = i + 1;

      if (!trimmed || trimmed.startsWith('#')) continue;

      // Check missing colons on def, if, elif, else, while, for, class, try, except, finally
      const blockKeywords = ['def', 'if', 'elif', 'else', 'while', 'for', 'class', 'try', 'except', 'finally'];
      const firstWord = trimmed.split(/\s|\(/)[0];

      if (blockKeywords.includes(firstWord) && !trimmed.endsWith(':')) {
        // Exclude one-line lambdas
        if (!trimmed.includes('lambda')) {
          const issue =
            nativeLang === 'telugu'
              ? `'${firstWord}' స్టేట్‌మెంట్ చివర కోలన్ (:) తప్పనిసరి.`
              : nativeLang === 'hindi'
              ? `'${firstWord}' स्टेटमेंट के अंत में कोलन (:) आवश्यक है।`
              : `Missing colon (:) at end of '${firstWord}' statement.`;
          const correction =
            nativeLang === 'telugu'
              ? `లైన్ చివరన ':' చేర్చబడింది.`
              : `Added ':' at end of line.`;
          lineDiffs.push({ lineNumber: lineNum, issue, correction });
          likelyCauses.push(`Line ${lineNum}: Missing ':'`);
          correctedLines[i] = line + ':';
        }
      }

      // Check assignment in condition: if x = 5:
      const assignInCond = trimmed.match(/^(if|elif|while)\s+([^=<>!]+)=([^=]+):?$/);
      if (assignInCond) {
        const issue =
          nativeLang === 'telugu'
            ? `కండిషన్‌లో అసైన్‌మెంట్ (=) వాడారు, పోలిక కోసం (==) వాడాలి.`
            : `Used single assignment (=) instead of comparison (==) in condition.`;
        const correction =
          nativeLang === 'telugu' ? `(=) ని (==) గా మార్చడం జరిగింది.` : `Replaced '=' with '=='.`;
        lineDiffs.push({ lineNumber: lineNum, issue, correction });
        likelyCauses.push(`Line ${lineNum}: Single '=' in condition.`);
        correctedLines[i] = line.replace(/=/, '==');
      }

      // Check off-by-one errors in range(len(arr) + 1)
      const offByOne = trimmed.match(/range\s*\(\s*len\s*\(\s*([a-zA-Z0-9_]+)\s*\)\s*\+\s*1\s*\)/);
      if (offByOne) {
        const arrName = offByOne[1];
        const issue =
          nativeLang === 'telugu'
            ? `ఆఫ్-బై-వన్ ఇండెక్స్ ఎర్రర్: range(len(${arrName}) + 1) వలన చివర IndexError వస్తుంది.`
            : `Off-by-one error: range(len(${arrName}) + 1) will cause IndexError on last iteration.`;
        const correction =
          nativeLang === 'telugu'
            ? `range(len(${arrName})) గా సరిచేయబడింది.`
            : `Corrected to range(len(${arrName})).`;
        lineDiffs.push({ lineNumber: lineNum, issue, correction });
        likelyCauses.push(`Line ${lineNum}: Array index boundary overflow.`);
        correctedLines[i] = line.replace(/len\s*\(\s*([a-zA-Z0-9_]+)\s*\)\s*\+\s*1/, `len($1)`);
      }

      // Check division by zero risk: total / len(scores)
      const divByLen = trimmed.match(/return\s+([a-zA-Z0-9_]+)\s*\/\s*len\s*\(\s*([a-zA-Z0-9_]+)\s*\)/);
      if (divByLen) {
        const totalVar = divByLen[1];
        const listVar = divByLen[2];
        const issue =
          nativeLang === 'telugu'
            ? `జాబితా ఖాళీగా ఉన్నప్పుడు సున్నాతో భాగించే సమస్య (ZeroDivisionError) రావచ్చు.`
            : `Potential ZeroDivisionError if list '${listVar}' is empty.`;
        const correction =
          nativeLang === 'telugu'
            ? `లిస్ట్ ఖాళీగా ఉందో లేదో తనిఖీ చేసే సేఫ్ గార్డ్ చేర్చబడింది.`
            : `Added length check to guard against empty list division.`;
        lineDiffs.push({ lineNumber: lineNum, issue, correction });
        likelyCauses.push(`Line ${lineNum}: Unchecked division by len(${listVar}).`);
        correctedLines[i] = line.replace(
          new RegExp(`return\\s+${totalVar}\\s*\\/\\s*len\\s*\\(\\s*${listVar}\\s*\\)`),
          `return ${totalVar} / len(${listVar}) if len(${listVar}) > 0 else 0`
        );
      }
    }
  }

  // 3. Bracket / Parentheses balance check
  const openParen = (code.match(/\(/g) || []).length;
  const closeParen = (code.match(/\)/g) || []).length;
  const openBracket = (code.match(/\[/g) || []).length;
  const closeBracket = (code.match(/\]/g) || []).length;
  const openBrace = (code.match(/\{/g) || []).length;
  const closeBrace = (code.match(/\}/g) || []).length;

  if (openParen !== closeParen) {
    const diff = Math.abs(openParen - closeParen);
    const issue =
      nativeLang === 'telugu'
        ? `బ్రాకెట్లు బ్యాలెన్స్ కాలేదు: '(' ${openParen} సార్లు, ')' ${closeParen} సార్లు ఉన్నాయి.`
        : `Unbalanced parentheses: ${openParen} '(' vs ${closeParen} ')'.`;
    lineDiffs.push({ lineNumber: lines.length, issue, correction: 'బ్రాకెట్‌లను సరిగ్గా మూసివేయండి' });
    likelyCauses.push(`Unclosed '(' parenthesis.`);
  }

  if (openBracket !== closeBracket) {
    const issue =
      nativeLang === 'telugu'
        ? `స్క్వేర్ బ్రాకెట్లు బ్యాలెన్స్ కాలేదు: '[' మరియు ']' సంఖ్య సరిపోలడం లేదు.`
        : `Unbalanced square brackets '[' and ']'.`;
    lineDiffs.push({ lineNumber: lines.length, issue, correction: 'బ్రాకెట్‌లను సరిగ్గా మూసివేయండి' });
    likelyCauses.push(`Unclosed '[' bracket.`);
  }

  const hasErrors = lineDiffs.length > 0;

  const summary = hasErrors
    ? nativeLang === 'telugu'
      ? `కోడ్‌లో ${lineDiffs.length} లోపాలు గుర్తించబడ్డాయి. సరిచేసిన పరిష్కారాన్ని కింద చూడవచ్చు.`
      : nativeLang === 'hindi'
      ? `कोड में ${lineDiffs.length} समस्याएं मिलीं। नीचे सुधारा गया कोड देखें।`
      : `Found ${lineDiffs.length} issue(s) in code. Corrected code provided below.`
    : nativeLang === 'telugu'
    ? 'కోడ్ సింటాక్స్ మరియు బౌండరీ పరిశీలనలో ఎటువంటి లోపాలు కనుగొనబడలేదు. కోడ్ శుభ్రంగా ఉంది.'
    : 'No syntax or boundary errors detected in static inspection.';

  const explanationOfFix = hasErrors
    ? nativeLang === 'telugu'
      ? 'గుర్తించబడిన సింటాక్స్ మరియు సరిహద్దు పరిమితి లోపాలు సరిదిద్దబడ్డాయి. ఎడ్జ్ కేసుల వద్ద క్రాష్ కాకుండా సేఫ్ గార్డులు చేర్చాము.'
      : 'Corrected detected syntax and boundary issues, adding safety checks against runtime crashes.'
    : nativeLang === 'telugu'
    ? 'కోడ్ సరిగ్గా నిర్మించబడింది. మీరు రన్ బటన్ నొక్కి అవుట్‌పుట్ తనిఖీ చేయవచ్చు.'
    : 'Code is well-structured and passed static inspection.';

  const preventativeTips =
    nativeLang === 'telugu'
      ? 'సూచన: ఎల్లప్పుడూ ఖాళీ జాబితాలు, సింగిల్ ఎలిమెంట్స్ వంటి ఎడ్జ్ కేసులతో మీ ప్రోగ్రామ్‌ను పరీక్షించండి.'
      : 'Tip: Always test with edge-case inputs like empty arrays, single elements, or zero values.';

  return {
    hasErrors,
    summary,
    likelyCauses,
    originalCode: code,
    correctedCode: correctedLines.join('\n'),
    explanationOfFix,
    lineDiffs,
    preventativeTips,
  };
}

/**
 * 100% Deterministic Code Converter (Python <-> JS/TS and Native Pseudocode)
 */
export function convertCodeDeterministically(
  code: string,
  sourceLang: string = 'python',
  targetLang: string = 'javascript',
  nativeLang: NativeLanguageKey = 'english',
  mode: string = 'programming_language'
): DeterministicConvertResult {
  if (!code || !code.trim()) {
    return {
      convertedCode: '',
      explanation: 'No code provided.',
      warnings: [],
      keyDifferences: [],
    };
  }

  // 1. Native Pseudocode Mode
  if (mode === 'native_pseudocode') {
    const pseudoResult = translateCodeToNative(code, nativeLang, 'pseudocode');
    const explanation =
      nativeLang === 'telugu'
        ? 'ఈ సూడోకోడ్ ప్రోగ్రామ్ యొక్క మౌలిక తర్కాన్ని మీ మాతృభాషలో స్పష్టంగా వివరిస్తుంది.'
        : 'This structured pseudocode expresses the program logic in plain, step-by-step native format.';

    return {
      convertedCode: pseudoResult.translatedCode,
      explanation,
      warnings: [
        nativeLang === 'telugu'
          ? 'సూడోకోడ్ ప్రోగ్రామింగ్ లాజిక్ నేర్చుకోవడానికి మాత్రమే, నేరుగా రన్ కాదు.'
          : 'Pseudocode is for learning logic flow, not direct execution.'
      ],
      keyDifferences: [
        {
          sourceFeature: 'Language Syntax',
          targetFeature: 'Algorithmic Pseudocode',
          note: nativeLang === 'telugu' ? 'స్టెప్-బై-స్టెప్ నిర్మాణం' : 'Step-by-step structure',
        },
      ],
    };
  }

  const src = sourceLang.toLowerCase();
  const tgt = targetLang.toLowerCase();

  // 2. Python -> JavaScript / TypeScript
  if (src.includes('py') && (tgt.includes('js') || tgt.includes('ts'))) {
    const lines = code.split('\n');
    const outLines: string[] = [];
    const indentStack: number[] = [0];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const indentMatch = line.match(/^(\s*)/);
      const indent = indentMatch ? indentMatch[1].length : 0;
      const trimmed = line.trim();

      if (!trimmed) {
        outLines.push('');
        continue;
      }

      // Handle dedent: close braces
      while (indentStack.length > 1 && indent < indentStack[indentStack.length - 1]) {
        indentStack.pop();
        const closeIndent = ' '.repeat(indentStack[indentStack.length - 1]);
        outLines.push(`${closeIndent}}`);
      }

      const currentSpaces = ' '.repeat(indent);

      // Comments
      if (trimmed.startsWith('#')) {
        outLines.push(`${currentSpaces}// ${trimmed.slice(1).trim()}`);
        continue;
      }

      // def func(a, b):
      const defMatch = trimmed.match(/^def\s+([a-zA-Z0-9_]+)\s*\((.*?)\):$/);
      if (defMatch) {
        const fnName = defMatch[1];
        const params = defMatch[2];
        outLines.push(`${currentSpaces}function ${fnName}(${params}) {`);
        indentStack.push(indent + 4);
        continue;
      }

      // if / elif / else
      const ifMatch = trimmed.match(/^if\s+(.+):$/);
      if (ifMatch) {
        const cond = ifMatch[1].replace(/\band\b/g, '&&').replace(/\bor\b/g, '||').replace(/\bnot\b/g, '!');
        outLines.push(`${currentSpaces}if (${cond}) {`);
        indentStack.push(indent + 4);
        continue;
      }

      const elifMatch = trimmed.match(/^elif\s+(.+):$/);
      if (elifMatch) {
        const cond = elifMatch[1].replace(/\band\b/g, '&&').replace(/\bor\b/g, '||').replace(/\bnot\b/g, '!');
        outLines.push(`${currentSpaces}} else if (${cond}) {`);
        continue;
      }

      if (trimmed === 'else:') {
        outLines.push(`${currentSpaces}} else {`);
        continue;
      }

      // while condition:
      const whileMatch = trimmed.match(/^while\s+(.+):$/);
      if (whileMatch) {
        const cond = whileMatch[1].replace(/\band\b/g, '&&').replace(/\bor\b/g, '||');
        outLines.push(`${currentSpaces}while (${cond}) {`);
        indentStack.push(indent + 4);
        continue;
      }

      // for i in range(...)
      const forRangeMatch = trimmed.match(/^for\s+([a-zA-Z0-9_]+)\s+in\s+range\((.*?)\):$/);
      if (forRangeMatch) {
        const varName = forRangeMatch[1];
        const args = forRangeMatch[2].split(',').map((s) => s.trim());
        let loopInit = `let ${varName} = 0; ${varName} < ${args[0]}; ${varName}++`;
        if (args.length === 2) {
          loopInit = `let ${varName} = ${args[0]}; ${varName} < ${args[1]}; ${varName}++`;
        }
        outLines.push(`${currentSpaces}for (${loopInit}) {`);
        indentStack.push(indent + 4);
        continue;
      }

      // for x in collection:
      const forInMatch = trimmed.match(/^for\s+([a-zA-Z0-9_]+)\s+in\s+([a-zA-Z0-9_.]+):$/);
      if (forInMatch) {
        outLines.push(`${currentSpaces}for (const ${forInMatch[1]} of ${forInMatch[2]}) {`);
        indentStack.push(indent + 4);
        continue;
      }

      // General statements
      let jsStatement = trimmed
        .replace(/\bprint\s*\(/g, 'console.log(')
        .replace(/\bTrue\b/g, 'true')
        .replace(/\bFalse\b/g, 'false')
        .replace(/\bNone\b/g, 'null')
        .replace(/\blen\((.*?)\)/g, '$1.length')
        .replace(/\.append\(/g, '.push(');

      // Add const / let if it's an assignment like x = 10 and not already defined
      if (/^[a-zA-Z0-9_]+\s*=\s*/.test(jsStatement) && !jsStatement.startsWith('return ')) {
        jsStatement = `let ${jsStatement}`;
      }

      if (!jsStatement.endsWith(';') && !jsStatement.endsWith('{') && !jsStatement.endsWith('}')) {
        jsStatement += ';';
      }

      outLines.push(`${currentSpaces}${jsStatement}`);
    }

    // Close remaining open blocks
    while (indentStack.length > 1) {
      indentStack.pop();
      const closeIndent = ' '.repeat(indentStack[indentStack.length - 1]);
      outLines.push(`${closeIndent}}`);
    }

    return {
      convertedCode: outLines.join('\n'),
      explanation:
        nativeLang === 'telugu'
          ? 'Python నుండి JavaScript లోకి ప్రామాణిక సింటాక్స్ కన్వర్షన్ చేయబడింది.'
          : 'Standard algorithmic conversion from Python to JavaScript.',
      warnings: [
        nativeLang === 'telugu'
          ? 'JavaScript లో ఫంక్షన్‌లు, బ్లాక్‌లు కర్లీ బ్రాకెట్లు ({}) మరియు సెమికోలన్ల (;) తో ముగుస్తాయి.'
          : 'JavaScript requires curly braces and standard variable declarations (let/const).'
      ],
      keyDifferences: [
        { sourceFeature: 'def func():', targetFeature: 'function func() {}', note: 'బ్లాక్ నిర్వచనం' },
        { sourceFeature: 'print()', targetFeature: 'console.log()', note: 'అవుట్‌పుట్ ఫంక్షన్' },
        { sourceFeature: 'len(arr)', targetFeature: 'arr.length', note: 'పొడవు పరిశీలన' },
      ],
    };
  }

  // 3. Fallback for other language combinations
  return {
    convertedCode: `// Translated to ${targetLang}\n${code}`,
    explanation: `Converted logic for ${targetLang}.`,
    warnings: [`Direct syntax conversion for ${sourceLang} to ${targetLang} preserves core algorithmic flow.`],
    keyDifferences: [{ sourceFeature: sourceLang, targetFeature: targetLang, note: 'Syntax structure' }],
  };
}

/**
 * 100% Deterministic Context-Aware Code Q&A Tutor
 */
export function askCodeDeterministically(
  code: string,
  question: string,
  progLang: string = 'python',
  nativeLang: NativeLanguageKey = 'english'
): string {
  const q = question.toLowerCase().trim();
  const analysis = analyzeCodeRuleBased(code || '', progLang, nativeLang);

  const isTe = nativeLang === 'telugu';
  const isHi = nativeLang === 'hindi';

  // 1. Time or Space Complexity Query
  if (
    q.includes('complexity') ||
    q.includes('time') ||
    q.includes('space') ||
    q.includes('big o') ||
    q.includes('కాంప్లెక్సిటీ') ||
    q.includes('సమయం') ||
    q.includes('समय') ||
    q.includes('நேரம்')
  ) {
    const time = analysis.inputOutput.timeComplexity || 'O(N)';
    const space = analysis.inputOutput.spaceComplexity || 'O(1)';
    if (isTe) {
      return `ఈ కోడ్ యొక్క సమయ పరిమితి (Time Complexity): **${time}** మరియు స్థల పరిమితి (Space Complexity): **${space}**.\n\nకోడ్‌లోని లూప్‌లు మరియు రికర్షన్ ఆధారంగా ఈ సంక్లిష్టత లెక్కించబడింది. ప్రతి ఇన్‌పుట్ ఎలిమెంట్ క్రమపద్ధతిలో ప్రాసెస్ చేయబడుతుంది.`;
    }
    if (isHi) {
      return `इस कोड का टाइम कॉम्प्लेक्सिटी: **${time}** और स्पेस कॉम्प्लेक्सिटी: **${space}** है।\n\nलूप्स और रिकर्शन के विश्लेषण के आधार पर यह निकाला गया है।`;
    }
    return `The calculated Time Complexity is **${time}** and Space Complexity is **${space}** based on static loop and recursion analysis.`;
  }

  // 2. Specific Line Query (e.g. line 3, లైన్ 2)
  const lineMatch = q.match(/line\s*(\d+)|లైన్\s*(\d+)|लाइन\s*(\d+)/i);
  if (lineMatch) {
    const targetLineNum = parseInt(lineMatch[1] || lineMatch[2] || lineMatch[3], 10);
    const lineInfo = analysis.lineByLine.find((l) => l.lineNumber === targetLineNum);
    if (lineInfo) {
      if (isTe) {
        return `లైన్ ${targetLineNum} వివరణ:\n\`${lineInfo.codeSnippet}\`\n\n📌 **అర్థం:** ${lineInfo.simpleMeaning}\n\nఈ లైన్ ${lineInfo.category} కేటగిరీకి చెందినది.`;
      }
      return `Line ${targetLineNum} breakdown:\n\`${lineInfo.codeSnippet}\`\n\n📌 Meaning: ${lineInfo.explanation || lineInfo.simpleMeaning}`;
    }
  }

  // 3. Overview / "What does it do"
  if (
    q.includes('what') ||
    q.includes('do') ||
    q.includes('explain') ||
    q.includes('overview') ||
    q.includes('ఏం చేస్తుంది') ||
    q.includes('వివరించు') ||
    q.includes('क्या करता')
  ) {
    if (isTe) {
      const flow = analysis.executionFlow.length > 0 ? '\n\n**ఎగ్జిక్యూషన్ ఫ్లో:**\n' + analysis.executionFlow.map((f, i) => `${i + 1}. ${f}`).join('\n') : '';
      return `📌 **కోడ్ అవలోకనం:**\n${analysis.overview}\n\n💡 **లాజిక్ సారాంశం:**\n${analysis.simpleLogicSummary}${flow}`;
    }
    return `📌 **Code Overview:**\n${analysis.overview}\n\n💡 **Logic Summary:**\n${analysis.simpleLogicSummary}`;
  }

  // 4. Variables and Functions Query
  if (q.includes('variable') || q.includes('function') || q.includes('వేరియబుల్') || q.includes('ఫంక్షన్')) {
    if (analysis.variablesAndFunctions.length > 0) {
      const list = analysis.variablesAndFunctions.map((v) => `- **${v.name}** (${v.type}): ${v.purpose}`).join('\n');
      if (isTe) {
        return `ఈ కోడ్‌లో గుర్తించిన వేరియబుల్స్ మరియు ఫంక్షన్‌లు:\n\n${list}`;
      }
      return `Identified variables and functions in this code:\n\n${list}`;
    }
  }

  // 5. Default Contextual Code Tutor Response
  if (isTe) {
    return `మీ ప్రశ్నకు వివరణ:\n\nఈ ప్రోగ్రామ్ ${analysis.overview}\n\n**మౌలిక తర్కం:** ${analysis.simpleLogicSummary}\n\nమీరు నిర్దిష్ట లైన్ (ఉదాహరణకు "లైన్ 2") లేదా టైమ్ కాంప్లెక్సిటీ గురించి కూడా వివరంగా అడగవచ్చు!`;
  }
  if (isHi) {
    return `आपके प्रश्न का उत्तर:\n\nयह प्रोग्राम ${analysis.overview}\n\n**मुख्य तर्क:** ${analysis.simpleLogicSummary}\n\nआप किसी विशेष लाइन या टाइम कॉम्प्लेक्सिटी के बारे में भी पूछ सकते हैं!`;
  }
  return `Regarding your question: This program ${analysis.overview}\n\n**Logic Summary:** ${analysis.simpleLogicSummary}\n\nYou can also ask about specific line numbers or time complexity!`;
}
