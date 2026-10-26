import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Sparkles,
  Bug,
  Brain,
  Repeat,
  Play,
  MessageSquare,
  Save,
  Download,
  Copy,
  Check,
  RotateCcw,
  Volume2,
  AlertTriangle,
  Terminal,
  FileCode,
  ChevronDown,
  Settings,
  Plus,
  X,
  Share2,
  Maximize2,
  Minimize2,
  Columns,
  Eye,
  Languages,
  Zap,
} from 'lucide-react';
import {
  SUPPORTED_NATIVE_LANGUAGES,
  SUPPORTED_PROG_LANGUAGES,
  NativeLanguageKey,
  ExplanationData,
  DebugData,
  ConversionData,
} from '../types';
import { translateCodeToNative, TranslationMode } from '../utils/codeTranslator';
import { HighlightedCodeBlock } from '../utils/codeHighlighter';

interface WorkspacePageProps {
  onNavigate: (view: string) => void;
  initialProject?: any;
}

const LANG_COLORS: Record<string, string> = {
  python: '#3572A5',
  javascript: '#f7df1e',
  typescript: '#3178c6',
  java: '#b07219',
  cpp: '#f34b7d',
  go: '#00ADD8',
  rust: '#dea584',
};

const SECTION_TITLES: Record<string, {
  overview: string;
  lineByLine: string;
  executionFlow: string;
  expectedOutput: string;
  simpleSummary: string;
  syntaxIssues: string;
}> = {
  telugu: {
    overview: 'కోడ్ ఏం చేస్తుంది?',
    lineByLine: 'లైన్ బై లైన్ వివరణ',
    executionFlow: 'కోడ్ ఎలా నడుస్తుంది?',
    expectedOutput: 'చివరి ఫలితం',
    simpleSummary: 'సులభమైన సారాంశం',
    syntaxIssues: 'సింటాక్స్ పరిశీలన / సలహా',
  },
  hindi: {
    overview: 'कोड क्या करता है?',
    lineByLine: 'लाइन दर लाइन व्याख्या',
    executionFlow: 'कोड कैसे चलता है?',
    expectedOutput: 'अंतिम परिणाम',
    simpleSummary: 'सरल सारांश',
    syntaxIssues: 'सिंटैक्स जांच / सुझाव',
  },
  tamil: {
    overview: 'குறியீடு என்ன செய்கிறது?',
    lineByLine: 'வரிக்கு வரி விளக்கம்',
    executionFlow: 'குறியீடு எவ்வாறு இயங்குகிறது?',
    expectedOutput: 'இறுதி முடிவு',
    simpleSummary: 'எளிய சுருக்கம்',
    syntaxIssues: 'தொடரியல் சோதனை / ஆலோசனை',
  },
  kannada: {
    overview: 'ಕೋಡ್ ಏನು ಮಾಡುತ್ತದೆ?',
    lineByLine: 'ಸಾಲಿನಿಂದ ಸಾಲಿಗೆ ವಿವರಣೆ',
    executionFlow: 'ಕೋಡ್ ಹೇಗೆ ಚಲಿಸುತ್ತದೆ?',
    expectedOutput: 'ಅಂತಿಮ ಫಲಿತಾಂಶ',
    simpleSummary: 'ಸರಳ ಸಾರಾಂಶ',
    syntaxIssues: 'ಸಿಂಟ್ಯಾಕ್ಸ್ ಪರಿಶೀಲನೆ / ಸಲಹೆ',
  },
  english: {
    overview: 'What Does the Code Do?',
    lineByLine: 'Line-by-Line Explanation',
    executionFlow: 'How Does the Code Run?',
    expectedOutput: 'Expected Output / Final Result',
    simpleSummary: 'Simple Summary',
    syntaxIssues: 'Syntax Issues / Suggestions',
  },
};

const LANG_ICONS: Record<string, string> = {
  python: '🐍',
  javascript: 'JS',
  typescript: 'TS',
  java: '☕',
  cpp: 'C++',
  go: 'Go',
  rust: '🦀',
};

export const WorkspacePage: React.FC<WorkspacePageProps> = ({ onNavigate, initialProject }) => {
  const { user, token, quota, refreshUser, openAuthModal } = useAuth();

  // Project state
  const [projectId, setProjectId] = useState<string | null>(initialProject?.id || null);
  const [projectTitle, setProjectTitle] = useState(initialProject?.title || 'main');
  const [progLang, setProgLang] = useState(initialProject?.programmingLanguage || 'python');
  const [nativeLang, setNativeLang] = useState<NativeLanguageKey>(
    initialProject?.nativeLanguage || (user?.defaultLanguage as NativeLanguageKey) || 'telugu'
  );
  const [code, setCode] = useState(
    initialProject?.code ||
    `def count_number(arr, target):
    # count occurrences in array
    count = 0
    for num in arr:
        if num == target:
            count += 1
    return count

numbers = [2, 5, 8, 2, 9, 2, 11]
result = count_number(numbers, 2)
print("Target count:", result)`
  );

  // Translation configuration
  const [translationMode, setTranslationMode] = useState<TranslationMode>('guide');
  const [viewLayout, setViewLayout] = useState<'split' | 'english' | 'native'>('split');

  // Console & AI drawer state
  const [showConsole, setShowConsole] = useState(false);
  const [consoleTab, setConsoleTab] = useState<'terminal' | 'ai'>('terminal');
  const [aiSubTab, setAiSubTab] = useState<'lineByLine' | 'simpleLogic' | 'debug' | 'convert' | 'ask'>('lineByLine');

  // Results state
  const [explanation, setExplanation] = useState<ExplanationData | null>(initialProject?.explanation || null);
  const [debugResult, setDebugResult] = useState<DebugData | null>(null);
  const [conversionResult, setConversionResult] = useState<ConversionData | null>(null);
  const [terminalOutput, setTerminalOutput] = useState<{
    output: string;
    timeMs: number;
    success: boolean;
    exitCode?: number;
    language?: string;
    engine?: string;
  } | null>(null);

  // Ask AI state
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'ai'; text: string }>>([
    {
      sender: 'ai',
      text: 'నమస్కారం! మీ కోడ్ గురించి ఏదైనా సందేహం ఉంటే అడగండి. (Ask anything about your code).',
    },
  ]);
  const [questionInput, setQuestionInput] = useState('');
  const [askingAi, setAskingAi] = useState(false);

  // Converter state
  const [convertTargetLang, setConvertTargetLang] = useState('javascript');
  const [convertMode, setConvertMode] = useState<'programming_language' | 'native_pseudocode'>('programming_language');

  // UI state
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedEnglish, setCopiedEnglish] = useState(false);
  const [copiedNative, setCopiedNative] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [highlightedLine, setHighlightedLine] = useState<number | null>(null);
  const [speaking, setSpeaking] = useState(false);
  const [langDropOpen, setLangDropOpen] = useState(false);
  const [stdinInput, setStdinInput] = useState('');

  // Refs for synchronized scroll & syntax highlighting
  const englishEditorRef = useRef<HTMLTextAreaElement>(null);
  const englishPreRef = useRef<HTMLDivElement>(null);
  const nativeViewerRef = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // INSTANT TRANSLATION (Client-side, 0 latency, updates as user types!)
  const nativeTranslation = useMemo(() => {
    return translateCodeToNative(code, nativeLang, translationMode);
  }, [code, nativeLang, translationMode]);

  // Sync scroll between background highlight, left editor and right viewer
  const handleEnglishScroll = () => {
    if (englishEditorRef.current) {
      if (englishPreRef.current) {
        englishPreRef.current.scrollTop = englishEditorRef.current.scrollTop;
        englishPreRef.current.scrollLeft = englishEditorRef.current.scrollLeft;
      }
      if (nativeViewerRef.current) {
        nativeViewerRef.current.scrollTop = englishEditorRef.current.scrollTop;
      }
    }
  };

  const handleNativeScroll = () => {
    if (nativeViewerRef.current) {
      if (englishEditorRef.current) {
        englishEditorRef.current.scrollTop = nativeViewerRef.current.scrollTop;
      }
      if (englishPreRef.current) {
        englishPreRef.current.scrollTop = nativeViewerRef.current.scrollTop;
      }
    }
  };

  // Sync when initialProject changes
  useEffect(() => {
    if (initialProject) {
      setProjectId(initialProject.id);
      setProjectTitle(initialProject.title || 'main');
      setProgLang(initialProject.programmingLanguage);
      setNativeLang(initialProject.nativeLanguage || 'telugu');
      setCode(initialProject.code);
      if (initialProject.explanation) setExplanation(initialProject.explanation);
    }
  }, [initialProject]);

  // Scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Load preset sample
  const handleLoadSample = (sampleType: string) => {
    if (sampleType === 'count_number') {
      setProgLang('python');
      setCode(`def count_number(arr, target):
    # count occurrences in array
    count = 0
    for num in arr:
        if num == target:
            count += 1
    return count

numbers = [2, 5, 8, 2, 9, 2, 11]
result = count_number(numbers, 2)
print("Target count:", result)`);
      setProjectTitle('count_number.py');
    } else if (sampleType === 'binary_search') {
      setProgLang('python');
      const snippet = SUPPORTED_PROG_LANGUAGES.find((p) => p.key === 'python')?.defaultSnippet || '';
      setCode(snippet);
      setProjectTitle('binary_search.py');
    } else if (sampleType === 'buggy_loop') {
      setProgLang('python');
      setCode(`def calculate_average(scores):
    total = 0
    # Bug: Off-by-one and division by zero vulnerability
    for i in range(len(scores) + 1):
        total += scores[i]
    return total / len(scores)

grades = [88, 92, 79, 95]
print("Average:", calculate_average(grades))`);
      setProjectTitle('buggy_average.py');
      setShowConsole(true);
      setConsoleTab('ai');
      setAiSubTab('debug');
    } else if (sampleType === 'js_filter') {
      setProgLang('javascript');
      setCode(`function filterEvenNumbers(numbers) {
  const evens = [];
  for (let i = 0; i < numbers.length; i++) {
    if (numbers[i] % 2 === 0) {
      evens.push(numbers[i]);
    }
  }
  return evens;
}

const nums = [1, 2, 3, 4, 5, 6, 7, 8];
console.log("Even numbers:", filterEvenNumbers(nums));`);
      setProjectTitle('filter.js');
    }
  };

  // Change language
  const handleLangChange = (key: string) => {
    setProgLang(key);
    setLangDropOpen(false);
    const preset = SUPPORTED_PROG_LANGUAGES.find((p) => p.key === key)?.defaultSnippet || '';
    setCode(preset);
    const ext = SUPPORTED_PROG_LANGUAGES.find((p) => p.key === key)?.extension || '';
    setProjectTitle(`main${ext}`);
    setTerminalOutput(null);
  };

  // 1. RUN CODE — real subprocess execution
  const handleExecute = async () => {
    if (!code.trim()) { setErrorMessage('Please enter code to run.'); return; }
    setErrorMessage(null);
    setLoadingAction('execute');
    setShowConsole(true);
    setConsoleTab('terminal');
    setTerminalOutput(null);
    try {
      const res = await fetch('/api/v1/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ code, programmingLanguage: progLang, input: stdinInput }),
      });
      const data = await res.json();
      setTerminalOutput({
        output: data.output || (res.ok ? '(Program finished with no output)' : data.error || 'Execution failed'),
        timeMs: data.executionTimeMs || 0,
        success: !!data.success,
        exitCode: data.exitCode ?? (data.success ? 0 : 1),
        language: data.language || progLang,
        engine: data.engine,
      });
    } catch (err: any) {
      setTerminalOutput({
        output: `Connection error: ${err.message || 'Failed to reach execution server'}`,
        timeMs: 0, success: false, exitCode: 1, language: progLang,
      });
    } finally {
      setLoadingAction(null);
    }
  };

  // 2. Explain Code (Universal dynamic code explanation)
  const handleExplain = async () => {
    if (!code.trim()) {
      setErrorMessage(
        nativeLang === 'telugu'
          ? 'దయచేసి వివరణ కోసం కోడ్ ఎంటర్ చేయండి.'
          : nativeLang === 'hindi'
          ? 'कृपया विश्लेषण के लिए पहले कोई कोड दर्ज करें।'
          : 'Please enter or paste code first.'
      );
      return;
    }
    setErrorMessage(null);
    setLoadingAction('explain');
    setShowConsole(true);
    setConsoleTab('ai');
    setAiSubTab('lineByLine');
    setExplanation(null); // Clear stale explanation so previous results are not mistakenly shown
    try {
      const res = await fetch('/api/v1/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ code, programmingLanguage: progLang, nativeLanguage: nativeLang }),
      });
      const data = await res.json();
      if (!res.ok) { setErrorMessage(data.error || 'Failed to explain.'); return; }
      setExplanation(data.data);
      if (token) refreshUser();
    } catch (err: any) {
      setErrorMessage(err.message || 'Network error.');
    } finally {
      setLoadingAction(null);
    }
  };

  // Change Native Language & refresh active explanation dynamically
  const handleNativeLangChange = (newLang: NativeLanguageKey) => {
    setNativeLang(newLang);
    if (explanation && code.trim()) {
      setLoadingAction('explain');
      fetch('/api/v1/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ code, programmingLanguage: progLang, nativeLanguage: newLang }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data?.data) setExplanation(data.data);
        })
        .catch(() => {})
        .finally(() => setLoadingAction(null));
    }
  };

  // 3. Debug
  const handleDebug = async () => {
    if (!code.trim()) { setErrorMessage('Please enter code first.'); return; }
    setErrorMessage(null);
    setLoadingAction('debug');
    setShowConsole(true);
    setConsoleTab('ai');
    setAiSubTab('debug');
    try {
      const res = await fetch('/api/v1/debug', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ code, programmingLanguage: progLang, nativeLanguage: nativeLang }),
      });
      const data = await res.json();
      if (!res.ok) { setErrorMessage(data.error || 'Debug failed.'); return; }
      setDebugResult(data.data);
    } catch (err: any) {
      setErrorMessage(err.message || 'Network error.');
    } finally {
      setLoadingAction(null);
    }
  };

  // 4. Convert
  const handleConvert = async () => {
    if (!code.trim()) { setErrorMessage('Please enter code first.'); return; }
    setErrorMessage(null);
    setLoadingAction('convert');
    try {
      const res = await fetch('/api/v1/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ code, sourceLanguage: progLang, targetLanguage: convertTargetLang, nativeLanguage: nativeLang, mode: convertMode }),
      });
      const data = await res.json();
      if (!res.ok) { setErrorMessage(data.error || 'Conversion failed.'); return; }
      setConversionResult(data.data);
    } catch (err: any) {
      setErrorMessage(err.message || 'Network error.');
    } finally {
      setLoadingAction(null);
    }
  };

  // 5. Ask AI
  const handleAskAi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionInput.trim()) return;
    const q = questionInput.trim();
    setQuestionInput('');
    setChatMessages((prev) => [...prev, { sender: 'user', text: q }]);
    setAskingAi(true);
    try {
      const res = await fetch('/api/v1/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ code, question: q, programmingLanguage: progLang, nativeLanguage: nativeLang }),
      });
      const data = await res.json();
      setChatMessages((prev) => [...prev, { sender: 'ai', text: (res.ok && data.answer) ? data.answer : (data.error || 'సమాధానం పొందడంలో సమస్య ఎదురైంది.') }]);
    } catch (err: any) {
      setChatMessages((prev) => [...prev, { sender: 'ai', text: 'Network connection error.' }]);
    } finally {
      setAskingAi(false);
    }
  };

  // Save project
  const handleSaveProject = async () => {
    if (!user) { openAuthModal('login'); return; }
    try {
      const payload = { title: projectTitle, code, explanation, programmingLanguage: progLang, nativeLanguage: nativeLang };
      const endpoint = projectId ? `/api/v1/projects/${projectId}` : '/api/v1/projects';
      const method = projectId ? 'PATCH' : 'POST';
      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        if (data.project?.id) setProjectId(data.project.id);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2500);
      }
    } catch (err) {
      console.error('Save error:', err);
    }
  };

  const handleCopyEnglish = () => {
    navigator.clipboard.writeText(code);
    setCopiedEnglish(true);
    setTimeout(() => setCopiedEnglish(false), 2000);
  };

  const handleCopyNative = () => {
    navigator.clipboard.writeText(nativeTranslation.translatedCode);
    setCopiedNative(true);
    setTimeout(() => setCopiedNative(false), 2000);
  };

  const handleDownload = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    a.click(); URL.revokeObjectURL(url);
  };

  const handleSpeakText = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    if (speaking) { window.speechSynthesis.cancel(); setSpeaking(false); return; }
    const u = new SpeechSynthesisUtterance(text);
    const langMap: Record<string, string> = { hindi: 'hi-IN', telugu: 'te-IN', tamil: 'ta-IN', kannada: 'kn-IN' };
    u.lang = langMap[nativeLang] || 'en-US';
    u.onend = () => setSpeaking(false);
    u.onerror = () => setSpeaking(false);
    setSpeaking(true);
    window.speechSynthesis.speak(u);
  };

  const lineCount = code.split('\n').length;
  const currentLang = SUPPORTED_PROG_LANGUAGES.find((p) => p.key === progLang);
  const currentNative = SUPPORTED_NATIVE_LANGUAGES.find((l) => l.key === nativeLang);
  const langColor = LANG_COLORS[progLang] || '#888';
  const langIcon = LANG_ICONS[progLang] || progLang.slice(0, 2).toUpperCase();

  return (
    <div className="flex flex-col bg-[#0d1117] text-white" style={{ height: 'calc(100vh - 56px)' }}>

      {/* ─── TOP BAR (OneCompiler Style with Language Selectors & Run) ───── */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#161b22] border-b border-[#30363d] shrink-0 gap-2">

        {/* Left: Language Picker + File Title + Sample Loader */}
        <div className="flex items-center gap-2 min-w-0">
          {/* Programming Language Dropdown */}
          <div className="relative">
            <button
              onClick={() => setLangDropOpen((v) => !v)}
              className="flex items-center gap-2 px-3 py-1.5 bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] rounded-md text-xs font-semibold transition-colors"
            >
              <span
                className="w-5 h-5 rounded text-[10px] font-bold flex items-center justify-center shrink-0"
                style={{ background: langColor + '33', color: langColor, border: `1px solid ${langColor}55` }}
              >
                {langIcon}
              </span>
              <span>{currentLang?.name || progLang}</span>
              <ChevronDown className="w-3 h-3 opacity-60" />
            </button>
            {langDropOpen && (
              <div className="absolute top-full left-0 mt-1 bg-[#161b22] border border-[#30363d] rounded-lg shadow-2xl z-50 w-48 py-1 overflow-hidden">
                {SUPPORTED_PROG_LANGUAGES.map((l) => (
                  <button
                    key={l.key}
                    onClick={() => handleLangChange(l.key)}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center gap-2 hover:bg-[#21262d] transition-colors ${progLang === l.key ? 'bg-[#21262d] text-white font-bold' : 'text-slate-300'}`}
                  >
                    <span
                      className="w-5 h-5 rounded text-[10px] font-bold flex items-center justify-center shrink-0"
                      style={{ background: (LANG_COLORS[l.key] || '#888') + '33', color: LANG_COLORS[l.key] || '#888' }}
                    >
                      {LANG_ICONS[l.key] || l.key.slice(0, 2).toUpperCase()}
                    </span>
                    {l.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* File Name Tab */}
          <div className="flex items-center gap-1.5 bg-[#0d1117] border border-[#30363d] rounded-md px-3 py-1.5 text-xs text-slate-200 font-mono">
            <span className="text-[10px]" style={{ color: langColor }}>●</span>
            <input
              value={projectTitle}
              onChange={(e) => setProjectTitle(e.target.value)}
              className="bg-transparent outline-none border-none text-xs text-slate-200 font-mono w-24 sm:w-32"
              title="Rename file"
            />
          </div>

          {/* Sample Preset Loader */}
          <select
            onChange={(e) => { if (e.target.value) { handleLoadSample(e.target.value); e.target.value = ''; } }}
            defaultValue=""
            className="hidden md:block bg-[#21262d] border border-[#30363d] text-slate-300 text-xs px-2.5 py-1.5 rounded-md outline-none cursor-pointer hover:bg-[#30363d] transition-colors"
          >
            <option value="" disabled>Load preset sample...</option>
            <option value="count_number">Count Occurrences (count_number)</option>
            <option value="binary_search">Binary Search (Python)</option>
            <option value="buggy_loop">Buggy Loop (Debug AI)</option>
            <option value="js_filter">Filter Evens (JavaScript)</option>
          </select>
        </div>

        {/* Center: BIG GREEN RUN BUTTON */}
        <button
          onClick={handleExecute}
          disabled={!!loadingAction}
          className="flex items-center gap-2 px-6 py-2 bg-[#238636] hover:bg-[#2ea043] disabled:opacity-50 text-white font-bold text-xs sm:text-sm rounded-md transition-all shadow-lg shadow-green-950/40 active:scale-95 shrink-0"
        >
          {loadingAction === 'execute' ? (
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Play className="w-4 h-4 fill-white" />
          )}
          <span>{loadingAction === 'execute' ? 'Running...' : 'Run'}</span>
        </button>

        {/* Right: Target Mother Tongue + Split View Toggles + Console */}
        <div className="flex items-center gap-2">

          {/* Chosen Native Language Selector (Telugu, Hindi, Tamil...) */}
          <div className="flex items-center gap-1.5 bg-[#21262d] border border-[#30363d] rounded-md px-2.5 py-1">
            <Languages className="w-3.5 h-3.5 text-blue-400" />
            <select
              value={nativeLang}
              onChange={(e) => handleNativeLangChange(e.target.value as NativeLanguageKey)}
              className="bg-transparent text-xs font-semibold text-slate-200 outline-none cursor-pointer"
            >
              {SUPPORTED_NATIVE_LANGUAGES.map((l) => (
                <option key={l.key} value={l.key} className="bg-[#161b22]">
                  {l.native} ({l.english})
                </option>
              ))}
            </select>
          </div>

          {/* View Mode Toggle: Split / English / Native */}
          <div className="hidden lg:flex items-center bg-[#21262d] border border-[#30363d] rounded-md p-0.5 text-xs">
            <button
              onClick={() => setViewLayout('split')}
              title="Dual Split View (English ↔ Native)"
              className={`px-2 py-1 rounded font-medium flex items-center gap-1 transition-colors ${viewLayout === 'split' ? 'bg-[#30363d] text-white font-bold' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <Columns className="w-3 h-3 text-blue-400" />
              <span>Dual Split</span>
            </button>
            <button
              onClick={() => setViewLayout('english')}
              title="English Code Only"
              className={`px-2 py-1 rounded font-medium transition-colors ${viewLayout === 'english' ? 'bg-[#30363d] text-white font-bold' : 'text-slate-400 hover:text-slate-200'}`}
            >
              EN
            </button>
            <button
              onClick={() => setViewLayout('native')}
              title="Native Code Only"
              className={`px-2 py-1 rounded font-medium transition-colors ${viewLayout === 'native' ? 'bg-[#30363d] text-white font-bold' : 'text-slate-400 hover:text-slate-200'}`}
            >
              {currentNative?.native || 'భ'}
            </button>
          </div>

          {/* Console / Output Toggle Button */}
          <button
            onClick={() => setShowConsole((v) => !v)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors border ${showConsole ? 'bg-blue-600 border-blue-500 text-white' : 'bg-[#21262d] border-[#30363d] text-slate-300 hover:bg-[#30363d]'}`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Console</span>
            {terminalOutput && (
              <span className={`w-2 h-2 rounded-full ${terminalOutput.success ? 'bg-emerald-400' : 'bg-rose-400 animate-pulse'}`} />
            )}
          </button>

          {/* Save Button */}
          <button
            onClick={handleSaveProject}
            title="Save Project"
            className={`p-1.5 rounded-md transition-colors ${saveSuccess ? 'text-emerald-400 bg-emerald-500/10' : 'text-slate-400 hover:text-white hover:bg-[#21262d]'}`}
          >
            {saveSuccess ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* ─── ERROR BANNER ────────────────────────────────────────────────── */}
      {errorMessage && (
        <div className="flex items-center justify-between px-4 py-2 bg-rose-950/80 border-b border-rose-500/50 text-rose-200 text-xs shrink-0">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-rose-400 hover:text-white ml-4">✕</button>
        </div>
      )}

      {/* ─── MAIN WORKSPACE BODY ─────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ══ 1. LEFT AI TOOLS COMPACT SIDEBAR ══ */}
        <div className="hidden md:flex flex-col w-14 lg:w-44 shrink-0 bg-[#0d1117] border-r border-[#30363d]">
          <div className="p-3 border-b border-[#30363d] hidden lg:block">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Bhasha Tools</span>
          </div>

          <div className="flex flex-col py-2 space-y-1">
            {[
              { icon: <Sparkles className="w-4 h-4" />, label: 'Explain Code', action: handleExplain, color: 'text-blue-400', loading: 'explain' },
              { icon: <Brain className="w-4 h-4" />, label: 'Simple Logic', action: () => { setShowConsole(true); setConsoleTab('ai'); setAiSubTab('simpleLogic'); }, color: 'text-amber-400', loading: null },
              { icon: <Bug className="w-4 h-4" />, label: 'Debug & Fix', action: handleDebug, color: 'text-rose-400', loading: 'debug' },
              { icon: <Repeat className="w-4 h-4" />, label: 'Convert Code', action: () => { setShowConsole(true); setConsoleTab('ai'); setAiSubTab('convert'); }, color: 'text-indigo-400', loading: null },
              { icon: <MessageSquare className="w-4 h-4" />, label: 'Ask in Bhasha', action: () => { setShowConsole(true); setConsoleTab('ai'); setAiSubTab('ask'); }, color: 'text-purple-400', loading: null },
            ].map((tool, idx) => (
              <button
                key={idx}
                onClick={tool.action}
                disabled={!!loadingAction}
                className="flex items-center gap-3 px-3 py-2 text-xs font-medium text-slate-400 hover:text-white hover:bg-[#161b22] transition-colors rounded-md mx-1 text-left"
                title={tool.label}
              >
                <span className={tool.color}>
                  {loadingAction === tool.loading ? <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin inline-block" /> : tool.icon}
                </span>
                <span className="hidden lg:inline">{tool.label}</span>
              </button>
            ))}
          </div>

          {/* Bottom badge in sidebar */}
          <div className="mt-auto p-3 border-t border-[#30363d] hidden lg:block">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-400">
              <Zap className="w-3 h-3" /> Live Translator
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              Instant identifier & comment translation active
            </div>
          </div>
        </div>

        {/* ══ 2. CENTRAL DUAL-SPLIT CODE WORKSPACE ══ */}
        <div className="flex-1 flex overflow-hidden min-w-0">

          {/* ────── LEFT PANE: ENGLISH CODE EDITOR ────── */}
          {(viewLayout === 'split' || viewLayout === 'english') && (
            <div className="flex-1 flex flex-col overflow-hidden bg-[#0d1117] min-w-0">

              {/* Left Pane Header */}
              <div className="flex items-center justify-between px-3 py-2 bg-[#161b22] border-b border-[#30363d] text-xs shrink-0">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  <span className="font-semibold text-slate-200">English Code (Source)</span>
                  <span className="text-[10px] text-slate-500 font-mono">Lines: {lineCount}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleCopyEnglish}
                    title="Copy English Code"
                    className="p-1 text-slate-400 hover:text-white hover:bg-[#21262d] rounded transition-colors"
                  >
                    {copiedEnglish ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={() => handleDownload(code, projectTitle)}
                    title="Download English File"
                    className="p-1 text-slate-400 hover:text-white hover:bg-[#21262d] rounded transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Code Editor Body with Line Numbers & VS Code Syntax Coloring */}
              <div className="flex-1 flex overflow-hidden relative bg-[#1e1e1e]">
                {/* Line numbers column */}
                <div
                  className="select-none bg-[#1e1e1e] text-[#858585] text-right pr-3 pl-2 font-mono text-xs sm:text-sm leading-6 pt-3 shrink-0 border-r border-[#30363d]/60 overflow-hidden"
                  style={{ minWidth: '44px' }}
                >
                  {Array.from({ length: Math.max(lineCount, 25) }).map((_, i) => (
                    <div
                      key={i}
                      onClick={() => setHighlightedLine(i + 1)}
                      className={`leading-6 cursor-pointer hover:text-slate-200 ${highlightedLine === i + 1 ? 'text-[#58a6ff] font-bold' : ''}`}
                    >
                      {i + 1}
                    </div>
                  ))}
                </div>

                {/* Overlapping Editor: Syntax Highlighted Layer (Back) + Transparent Interactive Textarea (Front) */}
                <div className="flex-1 relative overflow-hidden font-mono text-xs sm:text-sm leading-6">
                  {/* Syntax Highlighted Background */}
                  <div
                    ref={englishPreRef}
                    aria-hidden="true"
                    className="absolute inset-0 pointer-events-none select-none m-0 pt-3 px-3 font-mono text-xs sm:text-sm leading-6 overflow-hidden whitespace-pre"
                  >
                    <HighlightedCodeBlock code={code} highlightedLine={highlightedLine} />
                  </div>

                  {/* Foreground Transparent Textarea (handles typing, cursor, selection) */}
                  <textarea
                    ref={englishEditorRef}
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    onScroll={handleEnglishScroll}
                    onKeyDown={(e) => {
                      if (e.key === 'Tab') {
                        e.preventDefault();
                        const ta = e.currentTarget;
                        const start = ta.selectionStart;
                        const end = ta.selectionEnd;
                        const newCode = code.substring(0, start) + '    ' + code.substring(end);
                        setCode(newCode);
                        setTimeout(() => { ta.selectionStart = ta.selectionEnd = start + 4; }, 0);
                      }
                      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                        e.preventDefault();
                        handleExecute();
                      }
                    }}
                    placeholder="// Write or paste your English code here..."
                    spellCheck={false}
                    autoCorrect="off"
                    autoCapitalize="off"
                    className="absolute inset-0 m-0 pt-3 px-3 font-mono text-xs sm:text-sm leading-6 bg-transparent text-transparent caret-[#58a6ff] outline-none resize-none border-none overflow-auto whitespace-pre z-10 selection:bg-[#264f78]/60 selection:text-transparent"
                    style={{ tabSize: 4 }}
                  />
                </div>
              </div>

              {/* Stdin Drawer (Collapsible) */}
              <div className="border-t border-[#30363d] bg-[#161b22] px-3 py-1.5 shrink-0">
                <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold uppercase mb-1">
                  <span>Standard Input (stdin)</span>
                </div>
                <input
                  type="text"
                  value={stdinInput}
                  onChange={(e) => setStdinInput(e.target.value)}
                  placeholder="Optional input for code requiring input()..."
                  className="w-full bg-[#0d1117] border border-[#30363d] rounded px-2.5 py-1 text-xs text-slate-300 font-mono outline-none focus:border-blue-500/50"
                />
              </div>
            </div>
          )}

          {/* ────── THE SEPARATOR LINE (The exact dividing line requested by user!) ────── */}
          {viewLayout === 'split' && (
            <div className="w-[6px] bg-[#1b222d] hover:bg-blue-600/70 border-x border-[#30363d] flex flex-col items-center justify-center cursor-col-resize transition-colors shrink-0 group relative z-10">
              <div className="w-1.5 h-10 rounded-full bg-slate-600 group-hover:bg-blue-400 transition-colors" />
              {/* Floating Center Badge */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#161b22] border border-blue-500/40 shadow-lg text-[9px] font-bold text-blue-400 px-1.5 py-0.5 rounded uppercase tracking-wider whitespace-nowrap pointer-events-none">
                ⇄ Live
              </div>
            </div>
          )}

          {/* ────── RIGHT PANE: CHOSEN NATIVE LANGUAGE CODE (LIVE TRANSLATED) ────── */}
          {(viewLayout === 'split' || viewLayout === 'native') && (
            <div className="flex-1 flex flex-col overflow-hidden bg-[#0d1117] min-w-0 border-l border-[#30363d]">

              {/* Right Pane Header */}
              <div className="flex items-center justify-between px-3 py-2 bg-[#161b22] border-b border-[#30363d] text-xs shrink-0">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="font-semibold text-emerald-400">
                    {currentNative?.native || 'తెలుగు'} గైడ్ ({currentNative?.english} Guide)
                  </span>
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 px-1.5 py-0.2 rounded font-mono">
                    Deterministic
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {/* Mode switcher: Line Guide vs Pseudocode */}
                  <div className="flex bg-[#21262d] border border-[#30363d] rounded text-[10px] font-medium overflow-hidden">
                    <button
                      onClick={() => setTranslationMode('guide')}
                      title="Line-by-line synchronized native explanation guide"
                      className={`px-2 py-0.5 transition-colors ${translationMode === 'guide' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
                    >
                      Line Guide
                    </button>
                    <button
                      onClick={() => setTranslationMode('pseudocode')}
                      title="Algorithmic native pseudocode representation"
                      className={`px-2 py-0.5 transition-colors ${translationMode === 'pseudocode' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
                    >
                      Pseudocode
                    </button>
                  </div>

                  <button
                    onClick={handleCopyNative}
                    title="Copy Translated Code"
                    className="p-1 text-slate-400 hover:text-white hover:bg-[#21262d] rounded transition-colors"
                  >
                    {copiedNative ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>

                  <button
                    onClick={() => handleDownload(nativeTranslation.translatedCode, `${projectTitle.replace(/\.[^/.]+$/, '')}_${nativeLang}.py`)}
                    title="Download Translated File"
                    className="p-1 text-slate-400 hover:text-white hover:bg-[#21262d] rounded transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Native Code Viewer Body with Line Numbers & VS Code Syntax Coloring */}
              <div className="flex-1 flex overflow-hidden relative bg-[#1e1e1e]">
                {/* Line numbers column */}
                <div
                  className="select-none bg-[#1e1e1e] text-[#858585] text-right pr-3 pl-2 font-mono text-xs sm:text-sm leading-6 pt-3 shrink-0 border-r border-[#30363d]/60 overflow-hidden"
                  style={{ minWidth: '44px' }}
                >
                  {Array.from({ length: Math.max(nativeTranslation.translatedLineCount, 25) }).map((_, i) => (
                    <div
                      key={i}
                      className={`leading-6 ${highlightedLine === i + 1 ? 'text-[#4ec9b0] font-bold' : ''}`}
                    >
                      {i + 1}
                    </div>
                  ))}
                </div>

                {/* Translated Code Viewer (VS Code Syntax Colored) */}
                <div
                  ref={nativeViewerRef}
                  onScroll={handleNativeScroll}
                  className="flex-1 overflow-auto bg-[#1e1e1e] font-mono text-xs sm:text-sm leading-6 pt-3 px-3 text-[#d4d4d4]"
                >
                  <HighlightedCodeBlock
                    code={nativeTranslation.translatedCode}
                    highlightedLine={highlightedLine}
                    onLineHover={setHighlightedLine}
                  />
                </div>
              </div>

              {/* Native explanation quick-tip bar */}
              <div className="border-t border-[#30363d] bg-[#161b22] px-3 py-1.5 flex items-center justify-between text-[11px] text-slate-400 shrink-0">
                <span className="flex items-center gap-1.5">
                  <span className="text-emerald-400">💡</span>
                  <span>{currentNative?.native}లో కోడ్ చూడడం ద్వారా ప్రతి లైన్ మరియు ఫంక్షన్ సులభంగా అర్థమవుతుంది.</span>
                </span>
                <button
                  onClick={handleExplain}
                  className="text-blue-400 hover:text-blue-300 font-semibold underline text-[10px]"
                >
                  AI విశ్లేషణ కావాలా? →
                </button>
              </div>
            </div>
          )}

        </div>

        {/* ══ 3. RIGHT COLLAPSIBLE CONSOLE & AI PANEL ══ */}
        {showConsole && (
          <div className="flex flex-col w-[380px] lg:w-[440px] shrink-0 bg-[#0d1117] border-l border-[#30363d] overflow-hidden">

            {/* Console Header Tabs */}
            <div className="flex items-center justify-between bg-[#161b22] border-b border-[#30363d] px-2 shrink-0">
              <div className="flex items-center">
                <button
                  onClick={() => setConsoleTab('terminal')}
                  className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold border-b-2 transition-colors ${consoleTab === 'terminal' ? 'text-white border-emerald-500' : 'text-slate-400 border-transparent hover:text-slate-200'}`}
                >
                  <Terminal className="w-3.5 h-3.5" />
                  Terminal Output
                  {terminalOutput && (
                    <span className={`w-2 h-2 rounded-full ${terminalOutput.success ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                  )}
                </button>
                <button
                  onClick={() => setConsoleTab('ai')}
                  className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold border-b-2 transition-colors ${consoleTab === 'ai' ? 'text-white border-blue-500' : 'text-slate-400 border-transparent hover:text-slate-200'}`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                  AI Studio
                </button>
              </div>
              <button
                onClick={() => setShowConsole(false)}
                className="p-1 text-slate-500 hover:text-white rounded transition-colors"
                title="Close Panel"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* ── SUB-PANEL: TERMINAL OUTPUT ── */}
            {consoleTab === 'terminal' && (
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex items-center justify-between px-3 py-1.5 bg-[#161b22]/50 border-b border-[#30363d] text-[10px] text-slate-400 shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold uppercase tracking-wider text-slate-400">Execution Output</span>
                    {terminalOutput && (
                      <span className={`px-1.5 py-0.5 rounded font-bold ${terminalOutput.success ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
                        {terminalOutput.success ? '✓ Exit 0' : `✗ Exit ${terminalOutput.exitCode ?? 1}`}
                      </span>
                    )}
                  </div>
                  {terminalOutput && (
                    <span className="font-mono text-slate-500">{terminalOutput.timeMs}ms</span>
                  )}
                </div>

                <div className="flex-1 overflow-auto p-3 font-mono text-xs sm:text-sm">
                  {loadingAction === 'execute' ? (
                    <div className="flex items-center gap-3 text-slate-400 py-8">
                      <span className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin shrink-0" />
                      <div>
                        <div className="text-xs font-medium text-slate-200">Executing {progLang} code in local engine...</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">Capturing live stdout/stderr</div>
                      </div>
                    </div>
                  ) : terminalOutput ? (
                    <div>
                      <div className={`leading-relaxed whitespace-pre-wrap font-mono ${terminalOutput.success ? 'text-slate-100' : 'text-rose-300'}`}>
                        {terminalOutput.output}
                      </div>
                      <div className="mt-4 pt-3 border-t border-[#30363d] flex items-center justify-between">
                        <span className={`text-[11px] font-mono font-semibold ${terminalOutput.success ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {terminalOutput.success ? 'Process finished with exit code 0' : `Process exited with code ${terminalOutput.exitCode ?? 1}`}
                        </span>
                        {!terminalOutput.success && (
                          <button
                            onClick={handleDebug}
                            className="text-[10px] bg-rose-600 hover:bg-rose-500 text-white px-2.5 py-1 rounded font-semibold flex items-center gap-1 transition-colors"
                          >
                            <Bug className="w-3 h-3" /> Debug with AI
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="py-12 text-center text-slate-500">
                      <Play className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                      <p className="text-xs">Click Run or press Ctrl+Enter to execute</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── SUB-PANEL: AI STUDIO (Explain, Logic, Debug, Convert, Chat) ── */}
            {consoleTab === 'ai' && (
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex overflow-x-auto scrollbar-hide border-b border-[#30363d] bg-[#161b22] shrink-0">
                  {[
                    { key: 'lineByLine', label: 'Explain', icon: <Sparkles className="w-3 h-3" />, color: 'border-blue-500 text-blue-400' },
                    { key: 'simpleLogic', label: 'Logic', icon: <Brain className="w-3 h-3" />, color: 'border-amber-500 text-amber-400' },
                    { key: 'debug', label: 'Debug', icon: <Bug className="w-3 h-3" />, color: 'border-rose-500 text-rose-400' },
                    { key: 'convert', label: 'Convert', icon: <Repeat className="w-3 h-3" />, color: 'border-indigo-500 text-indigo-400' },
                    { key: 'ask', label: 'Ask AI', icon: <MessageSquare className="w-3 h-3" />, color: 'border-purple-500 text-purple-400' },
                  ].map((t) => (
                    <button
                      key={t.key}
                      onClick={() => setAiSubTab(t.key as any)}
                      className={`flex items-center gap-1.5 px-3 py-2 text-[11px] font-semibold whitespace-nowrap border-b-2 transition-colors shrink-0 ${aiSubTab === t.key ? t.color : 'border-transparent text-slate-400 hover:text-slate-200'}`}
                    >
                      {t.icon}{t.label}
                    </button>
                  ))}
                </div>

                <div className="flex-1 overflow-y-auto p-3 space-y-3">
                  {/* TAB: Line by Line Explanation — Structured 5 Sections */}
                  {aiSubTab === 'lineByLine' && (() => {
                    const titles = SECTION_TITLES[nativeLang] || SECTION_TITLES.telugu;
                    return (
                      <div>
                        {loadingAction === 'explain' ? (
                          <div className="py-8 text-center">
                            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                            <p className="text-xs text-slate-400">
                              {nativeLang === 'telugu'
                                ? 'కోడ్ విశ్లేషణ సిద్ధమవుతోంది...'
                                : nativeLang === 'hindi'
                                ? 'कोड का विश्लेषण तैयार हो रहा है...'
                                : 'Analyzing code dynamically...'}
                            </p>
                          </div>
                        ) : explanation ? (
                          <div className="space-y-4">
                            {/* ── SECTION 1: కోడ్ ఏం చేస్తుంది? (What the code does) ── */}
                            <div className="p-3.5 rounded-lg bg-blue-500/10 border border-blue-500/30 text-xs text-blue-100 leading-relaxed">
                              <div className="flex items-center gap-1.5 font-bold text-blue-300 text-xs mb-1.5">
                                <span>💡 {titles.overview}</span>
                              </div>
                              <p className="text-slate-200 text-xs leading-relaxed">
                                {explanation.overview}
                              </p>
                            </div>

                            {/* ── SECTION 6 (Optional): సింటాక్స్ సమస్యలు / సలహా ── */}
                            {explanation.syntaxIssues && explanation.syntaxIssues.length > 0 && (
                              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs space-y-2">
                                <div className="font-bold text-amber-300 flex items-center gap-1.5">
                                  <span>⚠️ {titles.syntaxIssues}</span>
                                </div>
                                {explanation.syntaxIssues.map((issue, idx) => (
                                  <div key={idx} className="bg-[#161b22] p-2 rounded border border-[#30363d] text-[11px]">
                                    <div className="text-rose-400 font-semibold">లైన్ {issue.line}: {issue.problem}</div>
                                    <div className="text-emerald-300 font-mono mt-0.5">{issue.suggestion}</div>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* ── SECTION 2: లైన్ బై లైన్ వివరణ (Line-by-line explanation) ── */}
                            <div className="space-y-2.5">
                              <div className="flex items-center justify-between text-xs font-bold text-slate-300 px-1">
                                <span className="flex items-center gap-1.5">
                                  <span>📖 {titles.lineByLine}</span>
                                </span>
                                <span className="text-[10px] text-slate-500 font-normal">
                                  {explanation.lineByLine.length} లైన్లు
                                </span>
                              </div>

                              {explanation.lineByLine.map((line) => (
                                <div
                                  key={line.lineNumber}
                                  className={`p-3 rounded-lg bg-[#161b22] border text-xs space-y-2 transition-colors ${
                                    highlightedLine === line.lineNumber
                                      ? 'border-blue-500 bg-blue-950/20 shadow-md shadow-blue-500/10'
                                      : 'border-[#30363d] hover:border-blue-500/40'
                                  }`}
                                  onMouseEnter={() => setHighlightedLine(line.lineNumber)}
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-bold text-blue-400 font-mono px-1.5 py-0.5 bg-blue-500/10 rounded">
                                      లైన్ {line.lineNumber}
                                    </span>
                                    <button
                                      onClick={() => handleSpeakText(line.simpleMeaning || line.explanation)}
                                      className="text-slate-500 hover:text-blue-400 p-0.5 rounded transition-colors"
                                      title="వినండి (Listen)"
                                    >
                                      <Volume2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>

                                  {/* 1. కోడ్ (Code) */}
                                  <div>
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                                      కోడ్:
                                    </span>
                                    <code className="block text-[11px] font-mono text-[#dcdcaa] bg-[#0d1117] px-2.5 py-1.5 rounded border border-[#30363d] overflow-x-auto">
                                      {line.codeSnippet}
                                    </code>
                                  </div>

                                  {/* 2. సులభమైన అర్థం (Simple Everyday Meaning) */}
                                  <div>
                                    <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider block mb-0.5">
                                      సులభమైన అర్థం:
                                    </span>
                                    <p className="text-slate-200 leading-relaxed text-[12px]">
                                      {line.simpleMeaning || line.explanation}
                                    </p>
                                  </div>

                                  {/* 3. చిన్న ఉదాహరణ (Small Example) */}
                                  {line.smallExample && (
                                    <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-md text-[11px] text-amber-200 flex items-start gap-1.5">
                                      <span className="text-amber-400 shrink-0 mt-0.5">💡</span>
                                      <div>
                                        <strong className="text-amber-300 font-semibold mr-1">చిన్న ఉదాహరణ:</strong>
                                        <span>{line.smallExample}</span>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>

                            {/* ── SECTION 3: కోడ్ ఎలా నడుస్తుంది? (Execution flow) ── */}
                            {explanation.executionFlow && explanation.executionFlow.length > 0 && (
                              <div className="p-3.5 rounded-lg bg-[#161b22] border border-[#30363d] text-xs space-y-2">
                                <div className="font-bold text-purple-400 text-xs flex items-center gap-1.5">
                                  <span>⚡ {titles.executionFlow}</span>
                                </div>
                                <div className="space-y-1.5 pt-1">
                                  {explanation.executionFlow.map((step, idx) => (
                                    <div key={idx} className="flex items-start gap-2 text-slate-300 text-[11.5px] leading-relaxed">
                                      <span className="w-4 h-4 rounded-full bg-purple-500/20 text-purple-300 font-bold text-[9px] flex items-center justify-center shrink-0 mt-0.5">
                                        {idx + 1}
                                      </span>
                                      <span>{step.replace(/^\d+\.\s*/, '')}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* ── SECTION 4: చివరి ఫలితం (Expected output / final result) ── */}
                            <div className="p-3.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-200 leading-relaxed">
                              <div className="font-bold text-emerald-300 text-xs mb-1.5 flex items-center gap-1.5">
                                <span>🎯 {titles.expectedOutput}</span>
                              </div>
                              <p className="text-slate-200 text-xs font-mono bg-[#0d1117] p-2 rounded border border-[#30363d]">
                                {explanation.expectedOutput || (explanation.inputOutput?.outputs) || 'కోడ్ రన్ పూర్తి కాగానే ఫలితం సిద్ధమవుతుంది.'}
                              </p>
                            </div>

                            {/* ── SECTION 5: సులభమైన సారాంశం (Simple summary) ── */}
                            <div className="p-3.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-200 leading-relaxed">
                              <div className="font-bold text-indigo-300 text-xs mb-1.5 flex items-center gap-1.5">
                                <span>✨ {titles.simpleSummary}</span>
                              </div>
                              <p className="text-slate-200 text-xs leading-relaxed">
                                {explanation.simpleLogicSummary}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="py-8 text-center text-slate-500">
                            <Sparkles className="w-8 h-8 text-blue-500/40 mx-auto mb-2" />
                            <p className="text-xs mb-3">కోడ్ యొక్క పూర్తి వివరణ పొందండి</p>
                            <button onClick={handleExplain} className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded transition-colors">
                              Explain Code
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* TAB: Simple Logic */}
                  {aiSubTab === 'simpleLogic' && (
                    <div>
                      {explanation ? (
                        <div className="space-y-3">
                          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded text-xs text-amber-100 leading-relaxed">
                            {explanation.simpleLogicSummary}
                          </div>
                        </div>
                      ) : (
                        <div className="py-8 text-center text-slate-500">
                          <Brain className="w-8 h-8 text-amber-500/40 mx-auto mb-2" />
                          <p className="text-xs mb-3">సులభమైన ఉపమానాలతో లాజిక్ తెలుసుకోండి</p>
                          <button onClick={handleExplain} className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold rounded transition-colors">
                            Generate Logic Summary
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB: Debug */}
                  {aiSubTab === 'debug' && (
                    <div>
                      {loadingAction === 'debug' ? (
                        <div className="py-8 text-center">
                          <div className="w-6 h-6 border-2 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                          <p className="text-xs text-slate-400">బగ్స్ విశ్లేషించబడుతున్నాయి...</p>
                        </div>
                      ) : debugResult ? (
                        <div className="space-y-3 text-xs">
                          <div className={`p-2.5 rounded border ${debugResult.hasErrors ? 'bg-rose-500/10 border-rose-500/30 text-rose-200' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'}`}>
                            <div className="font-bold mb-1">{debugResult.hasErrors ? '🐛 Bug Found' : '✅ Code Looks Good'}</div>
                            {debugResult.summary}
                          </div>
                          {debugResult.correctedCode && (
                            <div>
                              <div className="text-[10px] font-bold text-slate-400 mb-1 uppercase">సవరించబడిన కోడ్</div>
                              <pre className="p-2.5 bg-[#0d1117] border border-emerald-500/30 rounded font-mono text-[11px] text-emerald-300 overflow-x-auto whitespace-pre-wrap">
                                {debugResult.correctedCode}
                              </pre>
                              <button
                                onClick={() => setCode(debugResult.correctedCode)}
                                className="mt-2 w-full py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded text-xs transition-colors"
                              >
                                Apply Fix
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="py-8 text-center text-slate-500">
                          <Bug className="w-8 h-8 text-rose-500/40 mx-auto mb-2" />
                          <p className="text-xs mb-3">మీ కోడ్‌లోని బగ్స్‌ను AIతో గుర్తించండి</p>
                          <button onClick={handleDebug} className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded transition-colors">
                            Debug Code
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB: Convert */}
                  {aiSubTab === 'convert' && (
                    <div className="space-y-3 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-400">Target:</span>
                        <select
                          value={convertTargetLang}
                          onChange={(e) => setConvertTargetLang(e.target.value)}
                          className="bg-[#21262d] border border-[#30363d] rounded px-2 py-1 text-slate-200 flex-1 outline-none"
                        >
                          {SUPPORTED_PROG_LANGUAGES.filter((p) => p.key !== progLang).map((p) => (
                            <option key={p.key} value={p.key}>{p.name}</option>
                          ))}
                        </select>
                      </div>
                      <button
                        onClick={handleConvert}
                        disabled={!!loadingAction}
                        className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded text-xs transition-colors flex items-center justify-center gap-1.5"
                      >
                        {loadingAction === 'convert' ? <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Repeat className="w-3.5 h-3.5" />}
                        Convert to {convertTargetLang}
                      </button>
                      {conversionResult && (
                        <div>
                          <pre className="p-2.5 bg-[#0d1117] border border-indigo-500/30 rounded font-mono text-[11px] text-slate-200 overflow-x-auto whitespace-pre-wrap">
                            {conversionResult.convertedCode}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB: Ask AI in Bhasha */}
                  {aiSubTab === 'ask' && (
                    <div className="flex flex-col h-[320px]">
                      <div className="flex-1 space-y-2 overflow-y-auto pb-2 text-xs">
                        {chatMessages.map((msg, idx) => (
                          <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed ${msg.sender === 'user' ? 'bg-blue-600 text-white' : 'bg-[#161b22] text-slate-300 border border-[#30363d]'}`}>
                              {msg.text}
                            </div>
                          </div>
                        ))}
                        {askingAi && (
                          <div className="flex items-center gap-1.5 text-slate-500 text-xs">
                            <span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                            ఆలోచిస్తోంది...
                          </div>
                        )}
                        <div ref={chatEndRef} />
                      </div>
                      <form onSubmit={handleAskAi} className="pt-2 border-t border-[#30363d] flex gap-1.5 mt-auto">
                        <input
                          type="text"
                          value={questionInput}
                          onChange={(e) => setQuestionInput(e.target.value)}
                          placeholder="కోడ్ గురించి ప్రశ్న అడగండి..."
                          className="flex-1 bg-[#161b22] border border-[#30363d] rounded-lg px-2.5 py-1.5 text-xs text-slate-200 outline-none focus:border-blue-500"
                        />
                        <button type="submit" disabled={askingAi || !questionInput.trim()} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold transition-colors">
                          Send
                        </button>
                      </form>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
