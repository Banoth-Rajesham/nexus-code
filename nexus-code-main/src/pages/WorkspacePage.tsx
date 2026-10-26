import React, { useState, useEffect, useRef } from 'react';
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
  ChevronRight,
  AlertTriangle,
  ArrowRight,
  Terminal,
  FileCode,
  Layers,
  HelpCircle,
} from 'lucide-react';
import {
  SUPPORTED_NATIVE_LANGUAGES,
  SUPPORTED_PROG_LANGUAGES,
  NativeLanguageKey,
  ExplanationData,
  DebugData,
  ConversionData,
} from '../types';

interface WorkspacePageProps {
  onNavigate: (view: string) => void;
  initialProject?: any;
}

export const WorkspacePage: React.FC<WorkspacePageProps> = ({ onNavigate, initialProject }) => {
  const { user, token, quota, refreshUser, openAuthModal } = useAuth();

  // Project state
  const [projectId, setProjectId] = useState<string | null>(initialProject?.id || null);
  const [projectTitle, setProjectTitle] = useState(initialProject?.title || 'Untitled Algorithm');
  const [progLang, setProgLang] = useState(initialProject?.programmingLanguage || 'python');
  const [nativeLang, setNativeLang] = useState<NativeLanguageKey>(
    initialProject?.nativeLanguage || (user?.defaultLanguage as NativeLanguageKey) || 'telugu'
  );
  const [code, setCode] = useState(
    initialProject?.code ||
      SUPPORTED_PROG_LANGUAGES.find((p) => p.key === 'python')?.defaultSnippet ||
      ''
  );

  // Active right-side tab
  const [activeTab, setActiveTab] = useState<'lineByLine' | 'simpleLogic' | 'debug' | 'convert' | 'ask' | 'terminal'>(
    'lineByLine'
  );

  // Results state
  const [explanation, setExplanation] = useState<ExplanationData | null>(initialProject?.explanation || null);
  const [debugResult, setDebugResult] = useState<DebugData | null>(null);
  const [conversionResult, setConversionResult] = useState<ConversionData | null>(null);
  const [terminalOutput, setTerminalOutput] = useState<{ output: string; timeMs: number; success: boolean } | null>(
    null
  );

  // Ask AI state
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'ai'; text: string }>>([
    {
      sender: 'ai',
      text: 'నమస్కారం! ఈ కోడ్‌పై మీకు ఏవైనా సందేహాలు ఉంటే ఇక్కడ అడగవచ్చు. (Hello! Feel free to ask any question about this code snippet).',
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
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedExplanation, setCopiedExplanation] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [highlightedLine, setHighlightedLine] = useState<number | null>(null);
  const [speaking, setSpeaking] = useState(false);

  // Sync when initialProject changes
  useEffect(() => {
    if (initialProject) {
      setProjectId(initialProject.id);
      setProjectTitle(initialProject.title);
      setProgLang(initialProject.programmingLanguage);
      setNativeLang(initialProject.nativeLanguage || 'telugu');
      setCode(initialProject.code);
      if (initialProject.explanation) {
        setExplanation(initialProject.explanation);
      }
    }
  }, [initialProject]);

  // Load preset sample
  const handleLoadSample = (sampleType: string) => {
    if (sampleType === 'binary_search') {
      setProgLang('python');
      setCode(`def binary_search(arr, target):
    left = 0
    right = len(arr) - 1
    
    while left <= right:
        mid = (left + right) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
            
    return -1

numbers = [2, 5, 8, 12, 16, 23, 38, 56, 72, 91]
result = binary_search(numbers, 23)
print(f"Target found at index: {result}")`);
      setProjectTitle('Binary Search in Python');
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
      setProjectTitle('Buggy Average Calculation');
      setActiveTab('debug');
    } else if (sampleType === 'js_filter') {
      setProgLang('javascript');
      setCode(`function getEligibleStudents(students, minAttendance) {
  const qualified = [];
  
  for (let i = 0; i < students.length; i++) {
    const student = students[i];
    if (student.attendanceRate >= minAttendance) {
      qualified.push({
        id: student.id,
        name: student.name,
        status: "Eligible for Lab Exam"
      });
    }
  }
  return qualified;
}

const batch = [
  { id: 101, name: "Ananya", attendanceRate: 85 },
  { id: 102, name: "Karthik", attendanceRate: 68 },
  { id: 103, name: "Pooja", attendanceRate: 92 }
];
console.log(getEligibleStudents(batch, 75));`);
      setProjectTitle('Student Filter in JavaScript');
    }
  };

  // 1. Explain Code Action
  const handleExplain = async () => {
    if (!code.trim()) {
      setErrorMessage('Please enter or paste code first.');
      return;
    }

    setErrorMessage(null);
    setLoadingAction('explain');

    try {
      const res = await fetch('/api/v1/explain', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          code,
          programmingLanguage: progLang,
          nativeLanguage: nativeLang,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (res.status === 429) {
          setErrorMessage(data.error || 'Daily quota limit reached.');
          return;
        }
        setErrorMessage(data.error || 'Failed to generate explanation.');
        return;
      }

      setExplanation(data.data);
      setActiveTab('lineByLine');
      if (token) refreshUser();
    } catch (err: any) {
      setErrorMessage(err.message || 'Network error occurred.');
    } finally {
      setLoadingAction(null);
    }
  };

  // 2. Debug Action
  const handleDebug = async () => {
    if (!code.trim()) {
      setErrorMessage('Please enter code to debug.');
      return;
    }

    setErrorMessage(null);
    setLoadingAction('debug');

    try {
      const res = await fetch('/api/v1/debug', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          code,
          programmingLanguage: progLang,
          nativeLanguage: nativeLang,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || 'Debugging failed.');
        return;
      }

      setDebugResult(data.data);
      setActiveTab('debug');
    } catch (err: any) {
      setErrorMessage(err.message || 'Network error occurred.');
    } finally {
      setLoadingAction(null);
    }
  };

  // 3. Convert Action
  const handleConvert = async () => {
    if (!code.trim()) {
      setErrorMessage('Please enter code to convert.');
      return;
    }

    setErrorMessage(null);
    setLoadingAction('convert');

    try {
      const res = await fetch('/api/v1/convert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          code,
          sourceLanguage: progLang,
          targetLanguage: convertTargetLang,
          nativeLanguage: nativeLang,
          mode: convertMode,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || 'Conversion failed.');
        return;
      }

      setConversionResult(data.data);
      setActiveTab('convert');
    } catch (err: any) {
      setErrorMessage(err.message || 'Network error occurred.');
    } finally {
      setLoadingAction(null);
    }
  };

  // 4. Run Code Action
  const handleExecute = async () => {
    if (!code.trim()) {
      setErrorMessage('Please enter code to execute.');
      return;
    }

    setErrorMessage(null);
    setLoadingAction('execute');

    try {
      const res = await fetch('/api/v1/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          code,
          programmingLanguage: progLang,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || 'Execution failed.');
        return;
      }

      setTerminalOutput({
        output: data.output,
        timeMs: data.executionTimeMs,
        success: data.success,
      });
      setActiveTab('terminal');
    } catch (err: any) {
      setErrorMessage(err.message || 'Execution error.');
    } finally {
      setLoadingAction(null);
    }
  };

  // 5. Ask AI Action
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
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          code,
          question: q,
          programmingLanguage: progLang,
          nativeLanguage: nativeLang,
        }),
      });

      const data = await res.json();
      if (res.ok && data.answer) {
        setChatMessages((prev) => [...prev, { sender: 'ai', text: data.answer }]);
      } else {
        setChatMessages((prev) => [
          ...prev,
          { sender: 'ai', text: data.error || 'క్షమించండి, సమాధానం రూపొందించడంలో సమస్య ఎదురైంది.' },
        ]);
      }
    } catch (err: any) {
      setChatMessages((prev) => [...prev, { sender: 'ai', text: 'Network connection issue.' }]);
    } finally {
      setAskingAi(false);
    }
  };

  // Save Project
  const handleSaveProject = async () => {
    if (!user) {
      openAuthModal('login');
      return;
    }

    try {
      if (projectId) {
        // Update
        const res = await fetch(`/api/v1/projects/${projectId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title: projectTitle,
            code,
            explanation,
            programmingLanguage: progLang,
            nativeLanguage: nativeLang,
          }),
        });
        if (res.ok) {
          setSaveSuccess(true);
          setTimeout(() => setSaveSuccess(false), 2500);
        }
      } else {
        // Create new
        const res = await fetch('/api/v1/projects', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title: projectTitle,
            code,
            explanation,
            programmingLanguage: progLang,
            nativeLanguage: nativeLang,
          }),
        });
        const data = await res.json();
        if (res.ok && data.project) {
          setProjectId(data.project.id);
          setSaveSuccess(true);
          setTimeout(() => setSaveSuccess(false), 2500);
        }
      }
    } catch (err) {
      console.error('Save project error:', err);
    }
  };

  // Copy code to clipboard
  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Download code
  const handleDownloadCode = () => {
    const ext = SUPPORTED_PROG_LANGUAGES.find((p) => p.key === progLang)?.extension || '.txt';
    const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${projectTitle.toLowerCase().replace(/[^a-z0-9]/g, '_')}${ext}`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Text to Speech
  const handleSpeakText = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    if (nativeLang === 'hindi') utterance.lang = 'hi-IN';
    else if (nativeLang === 'telugu') utterance.lang = 'te-IN';
    else if (nativeLang === 'tamil') utterance.lang = 'ta-IN';
    else if (nativeLang === 'kannada') utterance.lang = 'kn-IN';
    else utterance.lang = 'en-US';

    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    setSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const lineCount = code.split('\n').length;

  return (
    <div className="min-h-screen bg-[#F5F6F8] flex flex-col text-[#242424]">
      {/* Top Controls Toolbar (Microsoft Fluent Ribbon) */}
      <div className="bg-white border-b border-[#E1DFDD] px-4 sm:px-6 py-2.5 shadow-2xs">
        <div className="max-w-[1360px] mx-auto flex flex-wrap items-center justify-between gap-4">
          
          {/* Left: Project title and Language pickers */}
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="text"
              value={projectTitle}
              onChange={(e) => setProjectTitle(e.target.value)}
              className="text-xs font-semibold text-[#242424] bg-transparent hover:bg-[#F5F6F8] px-2.5 py-1 rounded-[2px] border border-transparent hover:border-[#E1DFDD] focus:border-[#0067B8] focus:bg-white outline-hidden max-w-[200px] sm:max-w-xs transition-colors"
              title="Click to rename project"
            />

            <div className="h-4 w-px bg-[#E1DFDD] hidden sm:block" />

            {/* Programming Language Picker */}
            <div className="flex items-center gap-1.5 bg-[#F5F6F8] px-2.5 py-1 rounded-[2px] border border-[#E1DFDD]">
              <FileCode className="w-3.5 h-3.5 text-[#0078D4]" />
              <select
                value={progLang}
                onChange={(e) => {
                  const newLang = e.target.value;
                  setProgLang(newLang);
                  const preset = SUPPORTED_PROG_LANGUAGES.find((p) => p.key === newLang)?.defaultSnippet;
                  if (preset && (!code.trim() || code === SUPPORTED_PROG_LANGUAGES.find((p) => p.key === progLang)?.defaultSnippet)) {
                    setCode(preset);
                  }
                }}
                className="bg-transparent text-xs font-semibold text-[#242424] outline-hidden cursor-pointer"
              >
                {SUPPORTED_PROG_LANGUAGES.map((prog) => (
                  <option key={prog.key} value={prog.key}>
                    {prog.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Native Explanation Language Picker */}
            <div className="flex items-center gap-1.5 bg-[#EBF3FC] px-2.5 py-1 rounded-[2px] border border-[#0078D4]/30">
              <span className="text-xs font-bold text-[#0078D4]">భ</span>
              <select
                value={nativeLang}
                onChange={(e) => setNativeLang(e.target.value as NativeLanguageKey)}
                className="bg-transparent text-xs font-semibold text-[#0067B8] outline-hidden cursor-pointer"
              >
                {SUPPORTED_NATIVE_LANGUAGES.map((l) => (
                  <option key={l.key} value={l.key}>
                    {l.native} ({l.english})
                  </option>
                ))}
              </select>
            </div>

            {/* Preset Samples */}
            <select
              onChange={(e) => {
                if (e.target.value) handleLoadSample(e.target.value);
                e.target.value = '';
              }}
              defaultValue=""
              className="hidden lg:block bg-white text-xs font-medium text-[#616161] hover:text-[#242424] border border-[#E1DFDD] px-2.5 py-1 rounded-[4px] outline-hidden cursor-pointer"
            >
              <option value="" disabled>
                Load Sample Algorithm...
              </option>
              <option value="binary_search">Binary Search (Python)</option>
              <option value="buggy_loop">Buggy Loop (Python Debugger)</option>
              <option value="js_filter">Array Filter (JavaScript)</option>
            </select>
          </div>

          {/* Right: Actions (Save, Copy, Download, Clear) */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyCode}
              className="p-1.5 sm:px-2.5 sm:py-1 rounded-[4px] bg-white border border-[#E1DFDD] hover:bg-[#F5F6F8] text-xs font-medium text-[#616161] hover:text-[#242424] flex items-center gap-1.5 transition-colors"
              title="Copy source code"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{copiedCode ? 'Copied' : 'Copy'}</span>
            </button>

            <button
              onClick={handleDownloadCode}
              className="p-1.5 sm:px-2.5 sm:py-1 rounded-[4px] bg-white border border-[#E1DFDD] hover:bg-[#F5F6F8] text-xs font-medium text-[#616161] hover:text-[#242424] flex items-center gap-1.5 transition-colors"
              title="Download file"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Download</span>
            </button>

            <button
              onClick={() => {
                setCode('');
                setExplanation(null);
                setDebugResult(null);
              }}
              className="p-1.5 sm:px-2.5 sm:py-1 rounded-[4px] bg-white border border-[#E1DFDD] hover:bg-rose-50 text-xs font-medium text-rose-600 flex items-center gap-1.5 transition-colors"
              title="Clear editor"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Clear</span>
            </button>

            <button
              onClick={handleSaveProject}
              className={`py-1 px-3 sm:px-3.5 text-xs font-semibold rounded-[4px] flex items-center gap-1.5 transition-all shadow-2xs ${
                saveSuccess
                  ? 'bg-emerald-600 text-white'
                  : 'bg-[#0067B8] hover:bg-[#005A9E] text-white active:scale-95'
              }`}
            >
              {saveSuccess ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
              <span>{saveSuccess ? 'Saved!' : 'Save Project'}</span>
            </button>
          </div>

        </div>
      </div>

      {/* Error alert if any */}
      {errorMessage && (
        <div className="bg-rose-50 border-b border-rose-200 px-4 py-2 text-xs font-medium text-rose-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="font-bold hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Main Workspace Grid (Microsoft 365 Outlook Layout) */}
      <div className="flex-1 max-w-[1360px] w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* LEFT COLUMN: Code Editor */}
        <div className="lg:col-span-6 flex flex-col bg-white rounded-lg border border-[#E1DFDD] shadow-xs overflow-hidden h-[750px] lg:h-auto">
          
          {/* Action Buttons Ribbon */}
          <div className="p-2.5 bg-[#F5F6F8] border-b border-[#E1DFDD] flex flex-wrap items-center gap-2">
            <button
              onClick={handleExplain}
              disabled={!!loadingAction}
              className="py-1.5 px-3.5 rounded-[4px] bg-[#0067B8] hover:bg-[#005A9E] text-white font-semibold text-xs shadow-2xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              {loadingAction === 'explain' ? (
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5" />
              )}
              <span>Explain Code</span>
            </button>

            <button
              onClick={handleDebug}
              disabled={!!loadingAction}
              className="py-1.5 px-3 rounded-[4px] bg-[#0078D4] hover:bg-[#0067B8] text-white font-semibold text-xs shadow-2xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              {loadingAction === 'debug' ? (
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Bug className="w-3.5 h-3.5" />
              )}
              <span>Debug Code</span>
            </button>

            <button
              onClick={() => {
                if (!explanation) handleExplain();
                setActiveTab('simpleLogic');
              }}
              className="py-1.5 px-3 rounded-[4px] bg-white border border-[#E1DFDD] hover:bg-[#EBF3FC] text-[#242424] font-semibold text-xs transition-colors flex items-center gap-1.5"
            >
              <Brain className="w-3.5 h-3.5 text-amber-500" />
              <span>Simple Logic</span>
            </button>

            <button
              onClick={() => setActiveTab('convert')}
              className="py-1.5 px-3 rounded-[4px] bg-white border border-[#E1DFDD] hover:bg-[#EBF3FC] text-[#242424] font-semibold text-xs transition-colors flex items-center gap-1.5"
            >
              <Repeat className="w-3.5 h-3.5 text-indigo-500" />
              <span>Convert</span>
            </button>

            <button
              onClick={handleExecute}
              disabled={!!loadingAction}
              className="py-1.5 px-3 rounded-[4px] bg-[#242424] hover:bg-[#1B1B1B] text-white font-semibold text-xs shadow-2xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              {loadingAction === 'execute' ? (
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Play className="w-3.5 h-3.5 text-emerald-400" />
              )}
              <span>Run Code</span>
            </button>
          </div>

          {/* Editor Container with Line Numbers */}
          <div className="flex-1 relative flex bg-[#15191F] text-slate-100 font-mono text-xs sm:text-sm overflow-hidden">
            
            {/* Line numbers column */}
            <div className="w-12 py-4 select-none bg-[#111418] text-slate-500 text-right pr-3 font-mono text-xs border-r border-slate-800 shrink-0">
              {Array.from({ length: Math.max(lineCount, 20) }).map((_, i) => (
                <div
                  key={i}
                  onClick={() => setHighlightedLine(i + 1)}
                  className={`leading-relaxed cursor-pointer hover:text-slate-300 ${
                    highlightedLine === i + 1 ? 'text-[#FF5722] font-bold' : ''
                  }`}
                >
                  {i + 1}
                </div>
              ))}
            </div>

            {/* Code Textarea */}
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Paste or write your Python, Java, C++, or JavaScript code here..."
              spellCheck={false}
              className="flex-1 p-4 bg-transparent text-slate-200 font-mono text-xs sm:text-sm leading-relaxed resize-none outline-hidden overflow-auto whitespace-pre selection:bg-[#FF5722]/30"
            />
          </div>

          {/* Footer info bar */}
          <div className="px-4 py-2 bg-[#111418] border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <span>Lines: {lineCount}</span>
              <span>·</span>
              <span>Chars: {code.length}</span>
            </span>
            <span className="text-[#18B39D] font-mono">
              {SUPPORTED_PROG_LANGUAGES.find((p) => p.key === progLang)?.name}
            </span>
          </div>

        </div>

        {/* ============================================================== */}
        {/* RIGHT COLUMN: Multilingual Explanation Deck */}
        <div className="lg:col-span-6 flex flex-col bg-white rounded-lg border border-[#E1DFDD] shadow-xs overflow-hidden h-[750px] lg:h-auto">
          
          {/* Deck Tabs */}
          <div className="px-3 pt-2 bg-[#F5F6F8] border-b border-[#E1DFDD] flex items-center gap-1 overflow-x-auto">
            <button
              onClick={() => setActiveTab('lineByLine')}
              className={`px-3 py-2 text-xs font-semibold rounded-t-md transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                activeTab === 'lineByLine'
                  ? 'bg-white text-[#0067B8] border-t-2 border-[#0067B8] shadow-2xs'
                  : 'text-[#616161] hover:text-[#242424]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Line-by-Line</span>
            </button>

            <button
              onClick={() => setActiveTab('simpleLogic')}
              className={`px-3 py-2 text-xs font-semibold rounded-t-md transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                activeTab === 'simpleLogic'
                  ? 'bg-white text-[#0078D4] border-t-2 border-[#0078D4] shadow-2xs'
                  : 'text-[#616161] hover:text-[#242424]'
              }`}
            >
              <Brain className="w-3.5 h-3.5" />
              <span>Simple Logic</span>
            </button>

            <button
              onClick={() => setActiveTab('debug')}
              className={`px-3 py-2 text-xs font-semibold rounded-t-md transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                activeTab === 'debug'
                  ? 'bg-white text-[#0067B8] border-t-2 border-[#0067B8] shadow-2xs'
                  : 'text-[#616161] hover:text-[#242424]'
              }`}
            >
              <Bug className="w-3.5 h-3.5" />
              <span>Debug & Fix</span>
            </button>

            <button
              onClick={() => setActiveTab('convert')}
              className={`px-3 py-2 text-xs font-semibold rounded-t-md transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                activeTab === 'convert'
                  ? 'bg-white text-indigo-600 border-t-2 border-indigo-600 shadow-2xs'
                  : 'text-[#6B7280] hover:text-[#111827]'
              }`}
            >
              <Repeat className="w-3.5 h-3.5" />
              <span>Converter</span>
            </button>

            <button
              onClick={() => setActiveTab('ask')}
              className={`px-3 py-2 text-xs font-semibold rounded-t-xl transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                activeTab === 'ask'
                  ? 'bg-white text-purple-600 border-t-2 border-purple-600 shadow-2xs'
                  : 'text-[#6B7280] hover:text-[#111827]'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Ask AI</span>
            </button>

            <button
              onClick={() => setActiveTab('terminal')}
              className={`px-3 py-2 text-xs font-semibold rounded-t-xl transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                activeTab === 'terminal'
                  ? 'bg-white text-slate-900 border-t-2 border-slate-900 shadow-2xs'
                  : 'text-[#6B7280] hover:text-[#111827]'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>Output</span>
            </button>
          </div>

          {/* Deck Content Area */}
          <div className="flex-1 p-5 overflow-y-auto">
            
            {/* TAB 1: LINE-BY-LINE BREAKDOWN */}
            {activeTab === 'lineByLine' && (
              <div>
                {loadingAction === 'explain' ? (
                  <div className="py-20 flex flex-col items-center justify-center text-center">
                    <div className="w-8 h-8 border-3 border-[#0067B8] border-t-transparent rounded-full animate-spin mb-4" />
                    <p className="text-sm font-bold text-[#242424]">
                      Translating logic into {SUPPORTED_NATIVE_LANGUAGES.find((l) => l.key === nativeLang)?.native}...
                    </p>
                    <p className="text-xs text-[#616161] mt-1">Analyzing loops, variables, and algorithms</p>
                  </div>
                ) : explanation ? (
                  <div className="space-y-6">
                    
                    {/* Overall Summary Card (Microsoft Outlook Accent Banner) */}
                    <div className="p-4 rounded-md bg-[#EBF3FC] border border-[#0078D4]/20">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-semibold text-[#0067B8] uppercase tracking-wider">
                          మొత్తం సారాంశం (Program Overview)
                        </span>
                        <button
                          onClick={() => handleSpeakText(explanation.overview)}
                          className="p-1 rounded-sm text-[#0067B8] hover:bg-white transition-colors"
                          title="Read explanation aloud"
                        >
                          <Volume2 className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-xs sm:text-sm font-medium text-[#242424] leading-relaxed">
                        {explanation.overview}
                      </p>
                    </div>

                    {/* Complexity Stats Strip */}
                    {explanation.inputOutput && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                        <div className="p-2.5 rounded-xl bg-[#F8F6F1] border border-stone-200">
                          <span className="text-[10px] text-[#6B7280] font-semibold block">TIME COMPLEXITY</span>
                          <span className="font-mono font-bold text-[#111827]">
                            {explanation.inputOutput.timeComplexity || 'O(N)'}
                          </span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-[#F8F6F1] border border-stone-200">
                          <span className="text-[10px] text-[#6B7280] font-semibold block">SPACE COMPLEXITY</span>
                          <span className="font-mono font-bold text-[#111827]">
                            {explanation.inputOutput.spaceComplexity || 'O(1)'}
                          </span>
                        </div>
                        <div className="col-span-2 p-2.5 rounded-xl bg-[#F8F6F1] border border-stone-200">
                          <span className="text-[10px] text-[#6B7280] font-semibold block">EXPECTED OUTPUT</span>
                          <span className="font-medium text-[#111827] truncate block">
                            {explanation.inputOutput.outputs || 'Calculated result'}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Line-by-Line Cards */}
                    <div>
                      <h4 className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-3">
                        ప్రతి లైన్ వివరణ (Line-by-Line Explanations)
                      </h4>

                      <div className="space-y-3">
                        {explanation.lineByLine.map((line) => (
                          <div
                            key={line.lineNumber}
                            id={`line-card-${line.lineNumber}`}
                            onMouseEnter={() => setHighlightedLine(line.lineNumber)}
                            className={`p-3.5 rounded-xl border transition-all ${
                              highlightedLine === line.lineNumber
                                ? 'bg-amber-50/70 border-amber-300 shadow-2xs'
                                : 'bg-white border-stone-200 hover:border-stone-300'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2 mb-2">
                              <div className="flex items-center gap-2">
                                <span className="w-6 h-6 rounded-lg bg-stone-100 text-[#FF5722] font-mono text-xs font-bold flex items-center justify-center border border-stone-200">
                                  {line.lineNumber}
                                </span>
                                <code className="text-xs font-mono text-stone-800 bg-stone-100 px-2 py-0.5 rounded-md truncate max-w-[260px]">
                                  {line.codeSnippet}
                                </code>
                              </div>
                              <button
                                onClick={() => handleSpeakText(line.explanation)}
                                className="text-stone-400 hover:text-[#FF5722] p-1 transition-colors"
                                title="Listen to line explanation"
                              >
                                <Volume2 className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <p className="text-xs sm:text-sm text-[#111827] font-medium leading-relaxed pl-8">
                              {line.explanation}
                            </p>

                            {line.variableNotes && (
                              <div className="mt-2 pl-8 text-[11px] text-[#0D9488] font-medium">
                                వేరియబుల్ గమనిక: {line.variableNotes}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>
                ) : (
                  <div className="py-20 text-center max-w-sm mx-auto">
                    <div className="w-12 h-12 rounded-xl bg-[#FFF4EE] text-[#FF5722] border border-[#FF5722]/20 flex items-center justify-center mx-auto mb-4 font-bold text-2xl">
                      భ
                    </div>
                    <h3 className="text-base font-bold text-[#111827]">Ready to Explain Code</h3>
                    <p className="text-xs text-[#4B5563] mt-1 mb-5">
                      Click the orange <strong>"Explain Code"</strong> button above to translate your program line-by-line into {SUPPORTED_NATIVE_LANGUAGES.find((l) => l.key === nativeLang)?.native}.
                    </p>
                    <button
                      onClick={handleExplain}
                      className="py-2 px-5 text-xs font-semibold text-white bg-[#FF5722] hover:bg-[#E64A19] rounded-xl shadow-xs transition-colors inline-flex items-center gap-2"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Generate Explanation</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: SIMPLE LOGIC & MENTAL MODELS */}
            {activeTab === 'simpleLogic' && (
              <div>
                {explanation ? (
                  <div className="space-y-6">
                    <div className="p-6 rounded-3xl bg-amber-50/70 border border-amber-200">
                      <div className="flex items-center gap-2 text-amber-800 font-bold text-xs mb-3">
                        <Brain className="w-4 h-4 text-amber-600" />
                        <span>సాధారణ మాటల్లో అల్గారిథమ్ తర్కం (Simple Everyday Logic)</span>
                      </div>
                      <p className="text-sm sm:text-base text-amber-950 font-medium leading-relaxed">
                        {explanation.simpleLogicSummary}
                      </p>
                    </div>

                    {/* Variables and Roles Table */}
                    {explanation.variablesAndFunctions?.length > 0 && (
                      <div className="bg-white rounded-xl border border-stone-200 p-5">
                        <h4 className="text-xs font-semibold text-[#111827] uppercase tracking-wider mb-4">
                          వేరియబుల్స్ మరియు ఫంక్షన్ల పాత్ర (Roles in Logic)
                        </h4>
                        <div className="space-y-3">
                          {explanation.variablesAndFunctions.map((v, i) => (
                            <div
                              key={i}
                              className="p-3 rounded-xl bg-[#F8F6F1] flex flex-col sm:flex-row sm:items-center justify-between gap-2 border border-stone-200/60"
                            >
                              <div className="flex items-center gap-2">
                                <code className="text-xs font-mono font-semibold text-[#FF5722] bg-white px-2 py-0.5 rounded-md border border-stone-200">
                                  {v.name}
                                </code>
                                <span className="text-[11px] text-[#6B7280]">({v.type})</span>
                              </div>
                              <span className="text-xs text-[#111827] font-medium">{v.purpose}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="py-20 text-center max-w-sm mx-auto">
                    <Brain className="w-12 h-12 text-amber-500 mx-auto mb-3" />
                    <h3 className="text-base font-bold text-[#111827]">Simple Logic Ready</h3>
                    <p className="text-xs text-[#4B5563] mt-1 mb-4">
                      Click below to analyze the mental model of this code.
                    </p>
                    <button
                      onClick={handleExplain}
                      className="py-2 px-4 text-xs font-semibold text-white bg-[#FF5722] hover:bg-[#E64A19] rounded-xl transition-colors shadow-xs"
                    >
                      Analyze Simple Logic
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: DEBUG & FIX */}
            {activeTab === 'debug' && (
              <div>
                {loadingAction === 'debug' ? (
                  <div className="py-20 flex flex-col items-center justify-center text-center">
                    <div className="w-9 h-9 border-3 border-[#0D9488] border-t-transparent rounded-full animate-spin mb-4" />
                    <p className="text-sm font-bold text-[#111827]">Diagnosing errors & boundary issues...</p>
                    <p className="text-xs text-[#6B7280] mt-1">Checking compiler syntax and logic bugs</p>
                  </div>
                ) : debugResult ? (
                  <div className="space-y-6">
                    
                    {/* Bug Summary */}
                    <div className="p-4 rounded-xl bg-rose-50 border border-rose-200">
                      <div className="flex items-center gap-2 text-rose-800 font-bold text-xs mb-2">
                        <Bug className="w-4 h-4 text-rose-600" />
                        <span>సమస్య సారాంశం (Bug Diagnostic)</span>
                      </div>
                      <p className="text-xs sm:text-sm text-rose-900 font-medium leading-relaxed">
                        {debugResult.summary}
                      </p>
                    </div>

                    {/* Likely Causes */}
                    {debugResult.likelyCauses?.length > 0 && (
                      <div className="bg-white rounded-xl border border-stone-200 p-4">
                        <h4 className="text-xs font-semibold text-[#111827] mb-3">
                          లోపం సంభవించడానికి కారణాలు (Likely Causes)
                        </h4>
                        <ul className="space-y-2 text-xs text-[#4B5563]">
                          {debugResult.likelyCauses.map((cause, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="text-[#FF5722] font-bold">·</span>
                              <span>{cause}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Side-by-side Corrected Code */}
                    <div className="bg-slate-900 rounded-xl p-4 text-white">
                      <div className="flex items-center justify-between mb-3 text-xs">
                        <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5" />
                          <span>సరిచేసిన కోడ్ (Corrected Code)</span>
                        </span>
                        <button
                          onClick={() => {
                            setCode(debugResult.correctedCode);
                            setActiveTab('lineByLine');
                          }}
                          className="py-1 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] transition-colors"
                        >
                          Apply Fix to Editor
                        </button>
                      </div>
                      <pre className="text-xs font-mono text-slate-200 overflow-x-auto p-3 bg-slate-950 rounded-xl leading-relaxed">
                        {debugResult.correctedCode}
                      </pre>
                    </div>

                    {/* Why the Fix Works */}
                    <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                      <h4 className="text-xs font-bold text-emerald-900 mb-1">
                        ఈ పరిష్కారం ఎందుకు పనిచేస్తుంది? (Why Fix Works)
                      </h4>
                      <p className="text-xs text-emerald-950 leading-relaxed font-medium">
                        {debugResult.explanationOfFix}
                      </p>
                    </div>

                  </div>
                ) : (
                  <div className="py-20 text-center max-w-sm mx-auto">
                    <Bug className="w-12 h-12 text-[#0D9488] mx-auto mb-3" />
                    <h3 className="text-base font-bold text-[#111827]">AI Code Debugger</h3>
                    <p className="text-xs text-[#4B5563] mt-1 mb-5">
                      Have compiler errors, runtime exceptions, or failing test cases? Run our native debugger to identify and fix the issue.
                    </p>
                    <button
                      onClick={handleDebug}
                      className="py-2 px-5 text-xs font-semibold text-white bg-[#0D9488] hover:bg-[#0f766e] rounded-xl shadow-xs transition-colors inline-flex items-center gap-1.5"
                    >
                      <Bug className="w-3.5 h-3.5" />
                      <span>Debug Current Code</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: CONVERTER (Language to Language OR Native Pseudocode) */}
            {activeTab === 'convert' && (
              <div className="space-y-5">
                
                {/* Conversion Settings Bar */}
                <div className="p-4 rounded-xl bg-[#F8F6F1] border border-stone-200 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-[#6B7280]">Mode:</span>
                    <div className="flex bg-white rounded-xl p-0.5 border border-stone-200">
                      <button
                        onClick={() => setConvertMode('programming_language')}
                        className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                          convertMode === 'programming_language'
                            ? 'bg-indigo-600 text-white'
                            : 'text-[#6B7280]'
                        }`}
                      >
                        Code to Code
                      </button>
                      <button
                        onClick={() => setConvertMode('native_pseudocode')}
                        className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                          convertMode === 'native_pseudocode'
                            ? 'bg-indigo-600 text-white'
                            : 'text-[#6B7280]'
                        }`}
                      >
                        Native Pseudocode
                      </button>
                    </div>
                  </div>

                  {convertMode === 'programming_language' && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-[#6B7280]">To:</span>
                      <select
                        value={convertTargetLang}
                        onChange={(e) => setConvertTargetLang(e.target.value)}
                        className="text-xs font-semibold px-3 py-1 rounded-xl bg-white border border-stone-200 outline-hidden"
                      >
                        {SUPPORTED_PROG_LANGUAGES.filter((p) => p.key !== progLang).map((p) => (
                          <option key={p.key} value={p.key}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <button
                    onClick={handleConvert}
                    disabled={!!loadingAction}
                    className="py-1.5 px-4 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-colors flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Repeat className="w-3.5 h-3.5" />
                    <span>Run Conversion</span>
                  </button>
                </div>

                {/* Conversion Result */}
                {loadingAction === 'convert' ? (
                  <div className="py-20 text-center">
                    <div className="w-9 h-9 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-sm font-bold text-[#111827]">Translating code and validating semantics...</p>
                  </div>
                ) : conversionResult ? (
                  <div className="space-y-4">
                    <div className="bg-slate-900 rounded-xl p-4 text-white">
                      <div className="flex items-center justify-between mb-2 text-xs">
                        <span className="font-semibold text-slate-300">
                          {convertMode === 'native_pseudocode'
                            ? 'మాతృభాష సూడోకోడ్ (Native Pseudocode)'
                            : `Converted to ${convertTargetLang.toUpperCase()}`}
                        </span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(conversionResult.convertedCode);
                            alert('Copied to clipboard!');
                          }}
                          className="text-slate-400 hover:text-white flex items-center gap-1 text-[11px]"
                        >
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </button>
                      </div>
                      <pre className="text-xs font-mono text-slate-200 overflow-x-auto p-3 bg-slate-950 rounded-xl leading-relaxed whitespace-pre-wrap">
                        {conversionResult.convertedCode}
                      </pre>
                    </div>

                    <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-200">
                      <h4 className="text-xs font-bold text-indigo-950 mb-1">
                        వివరణ మరియు మార్పులు (Explanation & Semantic Differences)
                      </h4>
                      <p className="text-xs text-indigo-900 leading-relaxed font-medium">
                        {conversionResult.explanation}
                      </p>
                    </div>

                    {conversionResult.warnings?.length > 0 && (
                      <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs">
                        <span className="font-bold block mb-1">గమనిక (Warning):</span>
                        {conversionResult.warnings.map((w, i) => (
                          <p key={i}>· {w}</p>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="py-16 text-center text-xs text-[#6B7280]">
                    Configure target language or pseudocode mode and click "Run Conversion".
                  </div>
                )}

              </div>
            )}

            {/* TAB 5: ASK AI (Contextual Chat in Native Tongue) */}
            {activeTab === 'ask' && (
              <div className="flex flex-col h-full min-h-[500px]">
                
                {/* Chat Message Stream */}
                <div className="flex-1 space-y-3 overflow-y-auto pr-2 pb-4">
                  {chatMessages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed ${
                          msg.sender === 'user'
                            ? 'bg-[#FF5722] text-white font-medium rounded-tr-xs shadow-2xs'
                            : 'bg-[#F8F6F1] text-[#111827] border border-stone-200 font-medium rounded-tl-xs whitespace-pre-wrap'
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  ))}

                  {askingAi && (
                    <div className="flex justify-start">
                      <div className="bg-[#F8F6F1] text-[#6B7280] border border-stone-200 p-3 rounded-xl text-xs flex items-center gap-2">
                        <span className="w-3.5 h-3.5 border-2 border-[#FF5722] border-t-transparent rounded-full animate-spin" />
                        <span>AI గురువు ఆలోచిస్తున్నారు... (Thinking)</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Question Input */}
                <form onSubmit={handleAskAi} className="pt-3 border-t border-stone-200 flex gap-2">
                  <input
                    type="text"
                    value={questionInput}
                    onChange={(e) => setQuestionInput(e.target.value)}
                    placeholder={`ఈ కోడ్ గురించి ప్రశ్న అడగండి (Ask in ${SUPPORTED_NATIVE_LANGUAGES.find((l) => l.key === nativeLang)?.native} or English)...`}
                    className="flex-1 px-4 py-2 text-xs sm:text-sm rounded-xl border border-stone-200 focus:border-[#FF5722] focus:ring-1 focus:ring-[#FF5722] outline-hidden bg-[#F8F6F1]/60 text-[#111827]"
                  />
                  <button
                    type="submit"
                    disabled={askingAi || !questionInput.trim()}
                    className="py-2 px-4 rounded-xl bg-[#FF5722] hover:bg-[#E64A19] text-white text-xs font-semibold transition-colors disabled:opacity-50 shadow-xs"
                  >
                    Send
                  </button>
                </form>

              </div>
            )}

            {/* TAB 6: TERMINAL / EXECUTION OUTPUT */}
            {activeTab === 'terminal' && (
              <div className="h-full flex flex-col">
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-stone-200">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-semibold text-[#111827]">Sandbox Execution Console</span>
                  </div>
                  {terminalOutput && (
                    <span className="text-[11px] font-mono text-[#6B7280]">
                      Duration: {terminalOutput.timeMs}ms
                    </span>
                  )}
                </div>

                <div className="flex-1 bg-[#15191F] rounded-2xl p-4 font-mono text-xs text-slate-200 overflow-auto">
                  {loadingAction === 'execute' ? (
                    <div className="flex items-center gap-2 text-slate-400 py-6">
                      <span className="w-3.5 h-3.5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                      <span>Executing in isolated sandbox...</span>
                    </div>
                  ) : terminalOutput ? (
                    <div className="space-y-2">
                      <div className="text-[11px] text-slate-400 border-b border-slate-800 pb-1.5 flex items-center justify-between">
                        <span>Status: {terminalOutput.success ? 'Exit Code 0 (Success)' : 'Runtime Error'}</span>
                        <span className={terminalOutput.success ? 'text-emerald-400' : 'text-rose-400'}>
                          ● {terminalOutput.success ? 'PASS' : 'FAIL'}
                        </span>
                      </div>
                      <pre className="text-slate-200 leading-relaxed whitespace-pre-wrap">
                        {terminalOutput.output}
                      </pre>
                    </div>
                  ) : (
                    <div className="text-slate-500 py-8 text-center">
                      Click "Run Code" above to execute JavaScript or Python algorithms in our safe sandbox.
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
};
