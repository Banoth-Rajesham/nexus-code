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
  Folder,
  Trash2,
  Edit3,
  Star,
  ArrowRight,
  Monitor,
  Smartphone,
  ChevronRight,
} from 'lucide-react';
import {
  SUPPORTED_NATIVE_LANGUAGES,
  SUPPORTED_PROG_LANGUAGES,
  NativeLanguageKey,
  ExplanationData,
  DebugData,
  ConversionData,
  ProjectFile,
} from '../types';
import { translateCodeToNative, TranslationMode } from '../utils/codeTranslator';
import { HighlightedCodeBlock, VSCODE_MONO_FONT, CODE_EDITOR_SHARED_STYLE } from '../utils/codeHighlighter';
import { NATIVE_CODE_WORD, NATIVE_GUIDE_WORD, NATIVE_PSEUDO_WORD, transliterateWord } from '../utils/codeTransliterator';

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

const LANG_ICONS: Record<string, string> = {
  python: '🐍',
  javascript: 'JS',
  typescript: 'TS',
  java: '☕',
  cpp: 'C++',
  go: 'Go',
  rust: '🦀',
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
  marathi: {
    overview: 'कोड काय करतो?',
    lineByLine: 'ओळ दर ओळ स्पष्टीकरण',
    executionFlow: 'कोड कसा चालतो?',
    expectedOutput: 'अंतिम निकाल',
    simpleSummary: 'साधा सारांश',
    syntaxIssues: 'सिंटॅक्स तपासणी / सल्ला',
  },
  bengali: {
    overview: 'কোড কি করে?',
    lineByLine: 'লাইন বাই লাইন ব্যাখ্যা',
    executionFlow: 'কোড কিভাবে চলে?',
    expectedOutput: 'চূড়ান্ত ফলাফল',
    simpleSummary: 'সহজ সারাংশ',
    syntaxIssues: 'সিনট্যাক্স পরীক্ষা / পরামর্শ',
  },
  gujarati: {
    overview: 'કોડ શું કરે છે?',
    lineByLine: 'લાઇન દર લાઇન સમજૂતી',
    executionFlow: 'કોડ કેવી રીતે ચાલે છે?',
    expectedOutput: 'અંતિમ પરિણામ',
    simpleSummary: 'સરળ સારાંશ',
    syntaxIssues: 'સિંટેક્સ ચકાસણી / સલાહ',
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

const DEFAULT_PROJECT_FILES: ProjectFile[] = [
  {
    id: 'f_main',
    name: 'main.py',
    content: `from utils import calculate_sum
from helper import format_result

# Test numbers list
numbers = [10, 20, 30]
result = calculate_sum(numbers)
print(format_result("Calculated sum", result))`,
    isEntry: true,
  },
  {
    id: 'f_utils',
    name: 'utils.py',
    content: `def calculate_sum(numbers):
    # Sum all numbers in the list
    total = 0
    for number in numbers:
        total += number
    return total`,
  },
  {
    id: 'f_helper',
    name: 'helper.py',
    content: `def format_result(label, value):
    return f"==> {label}: {value}"`,
  },
];

export const WorkspacePage: React.FC<WorkspacePageProps> = ({ onNavigate, initialProject }) => {
  const { user, token, quota, refreshUser, openAuthModal } = useAuth();

  // Project & Multi-file state
  const [projectId, setProjectId] = useState<string | null>(initialProject?.id || null);
  const [projectTitle, setProjectTitle] = useState(initialProject?.title || 'my_project');
  const [progLang, setProgLang] = useState(initialProject?.programmingLanguage || 'python');
  const [nativeLang, setNativeLang] = useState<NativeLanguageKey>(
    initialProject?.nativeLanguage || (user?.defaultLanguage as NativeLanguageKey) || 'telugu'
  );

  const [files, setFiles] = useState<ProjectFile[]>(() => {
    if (initialProject?.code) {
      return [
        {
          id: 'f_init',
          name: initialProject.title ? (initialProject.title.includes('.') ? initialProject.title : `${initialProject.title}.py`) : 'main.py',
          content: initialProject.code,
          isEntry: true,
        },
      ];
    }
    return DEFAULT_PROJECT_FILES;
  });

  const [activeFileId, setActiveFileId] = useState<string>(() => {
    return files[0]?.id || 'f_main';
  });

  // Active file helper
  const activeFile = useMemo(() => {
    return files.find((f) => f.id === activeFileId) || files[0] || { id: 'default', name: 'main.py', content: '' };
  }, [files, activeFileId]);

  const code = activeFile.content;

  const handleCodeChange = (newCode: string) => {
    setFiles((prev) =>
      prev.map((f) => (f.id === activeFile.id ? { ...f, content: newCode } : f))
    );
  };

  // Translation configuration
  const [translationMode, setTranslationMode] = useState<TranslationMode>('guide');
  const [viewLayout, setViewLayout] = useState<'split' | 'english' | 'native'>('split');
  const [mobileView, setMobileView] = useState<'files' | 'english' | 'native' | 'console'>('english');

  // Console & AI drawer state
  const [showConsole, setShowConsole] = useState(false);
  const [consoleTab, setConsoleTab] = useState<'terminal' | 'stdin' | 'ai'>('terminal');
  const [aiSubTab, setAiSubTab] = useState<'lineByLine' | 'simpleLogic' | 'debug' | 'convert' | 'ask'>('lineByLine');
  const [consoleMaximized, setConsoleMaximized] = useState(false);

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
  const [syntaxOverlay, setSyntaxOverlay] = useState(true);
  const [speaking, setSpeaking] = useState(false);
  const [langDropOpen, setLangDropOpen] = useState(false);
  const [stdinInput, setStdinInput] = useState('');
  const [showFileExplorer, setShowFileExplorer] = useState(true);

  // Inline file creation / renaming state
  const [isCreatingFile, setIsCreatingFile] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [editingFileId, setEditingFileId] = useState<string | null>(null);
  const [renameInput, setRenameInput] = useState('');

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

  // Cross-file symbol references and module relationship analysis
  const moduleImports = useMemo(() => {
    const list: Array<{
      fromFile: string;
      moduleName: string;
      importedSymbols: string[];
      isLocal: boolean;
      translatedSymbols: string[];
    }> = [];

    files.forEach((file) => {
      const lines = file.content.split('\n');
      lines.forEach((line) => {
        const trimmed = line.trim();
        const fromMatch = trimmed.match(/^from\s+([a-zA-Z0-9_.]+)\s+import\s+(.+)$/);
        if (fromMatch) {
          const mod = fromMatch[1];
          const rawSyms = fromMatch[2].split(',').map((s) => s.trim().split(' as ')[0].trim()).filter(Boolean);
          const isLocal = files.some(
            (f) => f.name === `${mod}.py` || f.name === mod || f.name === `${mod}.js` || f.name === `${mod}.ts`
          );
          list.push({
            fromFile: file.name,
            moduleName: mod,
            importedSymbols: rawSyms,
            isLocal,
            translatedSymbols: rawSyms.map((s) => transliterateWord(s, nativeLang)),
          });
        }
      });
    });

    return list;
  }, [files, nativeLang]);

  // Scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Multi-File Operations
  const handleCreateFileSubmit = () => {
    const name = newFileName.trim();
    if (!name) {
      setIsCreatingFile(false);
      return;
    }
    const ext = SUPPORTED_PROG_LANGUAGES.find((p) => p.key === progLang)?.extension || '.py';
    const finalName = name.includes('.') ? name : `${name}${ext}`;

    if (files.some((f) => f.name.toLowerCase() === finalName.toLowerCase())) {
      setErrorMessage(`File "${finalName}" already exists.`);
      return;
    }

    const newFile: ProjectFile = {
      id: `f_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: finalName,
      content: `# ${finalName}\n\ndef ${finalName.replace(/\.[^/.]+$/, '')}_example():\n    return "Ready"\n`,
    };

    setFiles((prev) => [...prev, newFile]);
    setActiveFileId(newFile.id);
    setIsCreatingFile(false);
    setNewFileName('');
  };

  const handleRenameSubmit = (fileId: string) => {
    const name = renameInput.trim();
    if (!name) {
      setEditingFileId(null);
      return;
    }
    const ext = SUPPORTED_PROG_LANGUAGES.find((p) => p.key === progLang)?.extension || '.py';
    const finalName = name.includes('.') ? name : `${name}${ext}`;

    if (files.some((f) => f.id !== fileId && f.name.toLowerCase() === finalName.toLowerCase())) {
      setErrorMessage(`Another file is already named "${finalName}".`);
      return;
    }

    setFiles((prev) =>
      prev.map((f) => (f.id === fileId ? { ...f, name: finalName } : f))
    );
    setEditingFileId(null);
    setRenameInput('');
  };

  const handleDeleteFile = (fileId: string) => {
    if (files.length <= 1) {
      setErrorMessage('Cannot delete the only file in your project.');
      return;
    }
    const targetFile = files.find((f) => f.id === fileId);
    if (!targetFile) return;

    const remaining = files.filter((f) => f.id !== fileId);
    setFiles(remaining);

    if (activeFileId === fileId) {
      setActiveFileId(remaining[0].id);
    }
  };

  const handleSetEntrypoint = (fileId: string) => {
    setFiles((prev) =>
      prev.map((f) => ({ ...f, isEntry: f.id === fileId }))
    );
  };

  // Load preset samples
  const handleLoadSample = (sampleType: string) => {
    if (sampleType === 'modular_math') {
      setProgLang('python');
      setFiles([
        {
          id: 'f_main',
          name: 'main.py',
          content: `from utils import calculate_sum
from helper import format_result

# Test numbers list
numbers = [10, 20, 30]
result = calculate_sum(numbers)
print(format_result("Calculated sum", result))`,
          isEntry: true,
        },
        {
          id: 'f_utils',
          name: 'utils.py',
          content: `def calculate_sum(numbers):
    # Sum all numbers in the list
    total = 0
    for number in numbers:
        total += number
    return total`,
        },
        {
          id: 'f_helper',
          name: 'helper.py',
          content: `def format_result(label, value):
    return f"==> {label}: {value}"`,
        },
      ]);
      setActiveFileId('f_main');
      setProjectTitle('modular_math');
    } else if (sampleType === 'count_number') {
      setProgLang('python');
      setFiles([
        {
          id: 'f_count',
          name: 'count_number.py',
          content: `def count_number(arr, target):
    # count occurrences in array
    count = 0
    for num in arr:
        if num == target:
            count += 1
    return count

numbers = [2, 5, 8, 2, 9, 2, 11]
result = count_number(numbers, 2)
print("Target count:", result)`,
          isEntry: true,
        },
      ]);
      setActiveFileId('f_count');
      setProjectTitle('count_occurrences');
    } else if (sampleType === 'binary_search') {
      setProgLang('python');
      const snippet = SUPPORTED_PROG_LANGUAGES.find((p) => p.key === 'python')?.defaultSnippet || '';
      setFiles([
        {
          id: 'f_bs',
          name: 'binary_search.py',
          content: snippet,
          isEntry: true,
        },
      ]);
      setActiveFileId('f_bs');
      setProjectTitle('binary_search');
    } else if (sampleType === 'buggy_loop') {
      setProgLang('python');
      setFiles([
        {
          id: 'f_bug',
          name: 'average.py',
          content: `def calculate_average(scores):
    total = 0
    # Bug: Off-by-one and division by zero vulnerability
    for i in range(len(scores) + 1):
        total += scores[i]
    return total / len(scores)

grades = [88, 92, 79, 95]
print("Average:", calculate_average(grades))`,
          isEntry: true,
        },
      ]);
      setActiveFileId('f_bug');
      setProjectTitle('buggy_average');
      setShowConsole(true);
      setConsoleTab('ai');
      setAiSubTab('debug');
    } else if (sampleType === 'js_filter') {
      setProgLang('javascript');
      setFiles([
        {
          id: 'f_js_main',
          name: 'index.js',
          content: `function filterEvenNumbers(numbers) {
  const evens = [];
  for (let i = 0; i < numbers.length; i++) {
    if (numbers[i] % 2 === 0) {
      evens.push(numbers[i]);
    }
  }
  return evens;
}

const nums = [1, 2, 3, 4, 5, 6, 7, 8];
console.log("Even numbers:", filterEvenNumbers(nums));`,
          isEntry: true,
        },
      ]);
      setActiveFileId('f_js_main');
      setProjectTitle('filter_even');
    }
  };

  // Change programming language
  const handleLangChange = (key: string) => {
    setProgLang(key);
    setLangDropOpen(false);
    const ext = SUPPORTED_PROG_LANGUAGES.find((p) => p.key === key)?.extension || '.py';
    const snippet = SUPPORTED_PROG_LANGUAGES.find((p) => p.key === key)?.defaultSnippet || '';

    setFiles([
      {
        id: `f_${Date.now()}`,
        name: `main${ext}`,
        content: snippet,
        isEntry: true,
      },
    ]);
    setActiveFileId(files[0]?.id || 'f_main');
    setTerminalOutput(null);
  };

  // VS Code Smart Keyboard Handler
  const handleEditorKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const ta = e.currentTarget;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const val = ta.value;

    // 1. Ctrl+Enter: Run Code immediately!
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleExecute();
      return;
    }

    // 2. Tab / Shift+Tab: Indent / Unindent
    if (e.key === 'Tab') {
      e.preventDefault();
      if (e.shiftKey) {
        const lineStart = val.lastIndexOf('\n', start - 1) + 1;
        const lineEnd = val.indexOf('\n', end);
        const actualLineEnd = lineEnd === -1 ? val.length : lineEnd;
        const selectedBlock = val.substring(lineStart, actualLineEnd);
        const unindented = selectedBlock
          .split('\n')
          .map((line) => (line.startsWith('    ') ? line.substring(4) : line.replace(/^\s{1,3}/, '')))
          .join('\n');
        const newVal = val.substring(0, lineStart) + unindented + val.substring(actualLineEnd);
        handleCodeChange(newVal);
      } else {
        if (start !== end) {
          const lineStart = val.lastIndexOf('\n', start - 1) + 1;
          const lineEnd = val.indexOf('\n', end);
          const actualLineEnd = lineEnd === -1 ? val.length : lineEnd;
          const selectedBlock = val.substring(lineStart, actualLineEnd);
          const indented = selectedBlock
            .split('\n')
            .map((line) => '    ' + line)
            .join('\n');
          const newVal = val.substring(0, lineStart) + indented + val.substring(actualLineEnd);
          handleCodeChange(newVal);
        } else {
          const newVal = val.substring(0, start) + '    ' + val.substring(end);
          handleCodeChange(newVal);
          setTimeout(() => {
            if (englishEditorRef.current) {
              englishEditorRef.current.selectionStart = englishEditorRef.current.selectionEnd = start + 4;
            }
          }, 0);
        }
      }
      return;
    }

    // 3. Enter: Smart auto-indent after colon (:) or open brace ({)
    if (e.key === 'Enter') {
      e.preventDefault();
      const currentLineStart = val.lastIndexOf('\n', start - 1) + 1;
      const currentLine = val.substring(currentLineStart, start);
      const matchIndent = currentLine.match(/^(\s*)/);
      let indent = matchIndent ? matchIndent[1] : '';

      const trimmedBefore = currentLine.trimEnd();
      if (trimmedBefore.endsWith(':') || trimmedBefore.endsWith('{') || trimmedBefore.endsWith('(') || trimmedBefore.endsWith('[')) {
        indent += '    ';
      }

      const newVal = val.substring(0, start) + '\n' + indent + val.substring(end);
      handleCodeChange(newVal);
      setTimeout(() => {
        if (englishEditorRef.current) {
          englishEditorRef.current.selectionStart = englishEditorRef.current.selectionEnd = start + 1 + indent.length;
        }
      }, 0);
      return;
    }

    // 4. Smart Backspace: Remove 4 spaces if cursor is preceded by 4 spaces
    if (e.key === 'Backspace' && start === end && start >= 4) {
      const preceding = val.substring(start - 4, start);
      const lineStart = val.lastIndexOf('\n', start - 1) + 1;
      const lineToCursor = val.substring(lineStart, start);
      if (preceding === '    ' && lineToCursor.trim() === '') {
        e.preventDefault();
        const newVal = val.substring(0, start - 4) + val.substring(end);
        handleCodeChange(newVal);
        setTimeout(() => {
          if (englishEditorRef.current) {
            englishEditorRef.current.selectionStart = englishEditorRef.current.selectionEnd = start - 4;
          }
        }, 0);
        return;
      }
    }

    // 5. Auto-closing pairs
    const pairs: Record<string, string> = {
      '(': ')',
      '[': ']',
      '{': '}',
      '"': '"',
      "'": "'",
      '`': '`',
    };

    if (pairs[e.key]) {
      e.preventDefault();
      const closeChar = pairs[e.key];
      const selectedText = val.substring(start, end);
      const newVal = val.substring(0, start) + e.key + selectedText + closeChar + val.substring(end);
      handleCodeChange(newVal);
      setTimeout(() => {
        if (englishEditorRef.current) {
          englishEditorRef.current.selectionStart = start + 1;
          englishEditorRef.current.selectionEnd = end + 1;
        }
      }, 0);
      return;
    }

    // 6. Skip-over closing characters
    if (['}', ')', ']', '"', "'", '`'].includes(e.key) && start === end && val[start] === e.key) {
      e.preventDefault();
      ta.selectionStart = ta.selectionEnd = start + 1;
      return;
    }
  };

  // 1. RUN CODE — Real Subprocess Execution with Multi-File support!
  const handleExecute = async () => {
    if (!code.trim()) {
      setErrorMessage('Please enter code to run.');
      return;
    }
    setErrorMessage(null);
    setLoadingAction('execute');
    setShowConsole(true);
    setConsoleTab('terminal');
    setTerminalOutput(null);

    // Build multi-file project payload
    const filePayload: Record<string, string> = {};
    files.forEach((f) => {
      filePayload[f.name] = f.content;
    });

    try {
      const res = await fetch('/api/v1/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({
          files: filePayload,
          code: activeFile.content,
          activeFileName: activeFile.name,
          programmingLanguage: progLang,
          input: stdinInput,
        }),
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
        timeMs: 0,
        success: false,
        exitCode: 1,
        language: progLang,
      });
    } finally {
      setLoadingAction(null);
    }
  };

  // 2. Explain Code
  const handleExplain = async () => {
    if (!code.trim()) {
      setErrorMessage('Please enter code first.');
      return;
    }
    setErrorMessage(null);
    setLoadingAction('explain');
    setShowConsole(true);
    setConsoleTab('ai');
    setAiSubTab('lineByLine');
    setExplanation(null);
    try {
      const res = await fetch('/api/v1/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ code, programmingLanguage: progLang, nativeLanguage: nativeLang }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || 'Failed to explain.');
        return;
      }
      setExplanation(data.data);
      if (token) refreshUser();
    } catch (err: any) {
      setErrorMessage(err.message || 'Network error.');
    } finally {
      setLoadingAction(null);
    }
  };

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
    if (!code.trim()) {
      setErrorMessage('Please enter code first.');
      return;
    }
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
      if (!res.ok) {
        setErrorMessage(data.error || 'Debug failed.');
        return;
      }
      setDebugResult(data.data);
    } catch (err: any) {
      setErrorMessage(err.message || 'Network error.');
    } finally {
      setLoadingAction(null);
    }
  };

  // 4. Convert
  const handleConvert = async () => {
    if (!code.trim()) {
      setErrorMessage('Please enter code first.');
      return;
    }
    setErrorMessage(null);
    setLoadingAction('convert');
    try {
      const res = await fetch('/api/v1/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
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
      setChatMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: res.ok && data.answer ? data.answer : data.error || 'సమాధానం పొందడంలో సమస్య ఎదురైంది.',
        },
      ]);
    } catch (err: any) {
      setChatMessages((prev) => [...prev, { sender: 'ai', text: 'Network connection error.' }]);
    } finally {
      setAskingAi(false);
    }
  };

  // Save project
  const handleSaveProject = async () => {
    if (!user) {
      openAuthModal('login');
      return;
    }
    try {
      const payload = {
        title: projectTitle,
        code,
        explanation,
        programmingLanguage: progLang,
        nativeLanguage: nativeLang,
      };
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
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSpeakText = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
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
    <div className="flex-1 flex flex-col min-h-0 h-full bg-[#0d1117] text-white overflow-hidden">
      {/* ─── TOP BAR (Responsive IDE Toolbar) ────────────────────────── */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#161b22] border-b border-[#30363d] shrink-0 gap-2 overflow-x-auto no-scrollbar">
        {/* Left: Language Picker + File Explorer Toggle + Samples */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Programming Language Dropdown */}
          <div className="relative">
            <button
              onClick={() => setLangDropOpen((v) => !v)}
              className="flex items-center gap-2 px-2.5 py-1.5 bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] rounded-md text-xs font-semibold transition-colors"
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

          {/* Toggle File Explorer button */}
          <button
            onClick={() => setShowFileExplorer((v) => !v)}
            title="Toggle File Explorer & Project Files"
            className={`flex items-center gap-1.5 px-2.5 py-1.5 border rounded-md text-xs font-medium transition-colors ${showFileExplorer ? 'bg-blue-600/20 border-blue-500/50 text-blue-300' : 'bg-[#21262d] border-[#30363d] text-slate-300 hover:bg-[#30363d]'}`}
          >
            <Folder className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Files</span>
            <span className="text-[10px] bg-[#30363d] px-1.5 py-0.2 rounded-full font-mono text-slate-300">
              {files.length}
            </span>
          </button>

          {/* Sample Preset Loader */}
          <select
            onChange={(e) => {
              if (e.target.value) {
                handleLoadSample(e.target.value);
                e.target.value = '';
              }
            }}
            defaultValue=""
            className="hidden md:block bg-[#21262d] border border-[#30363d] text-slate-300 text-xs px-2.5 py-1.5 rounded-md outline-none cursor-pointer hover:bg-[#30363d] transition-colors"
          >
            <option value="" disabled>Load preset sample...</option>
            <option value="modular_math">Modular Math (Multi-File with Imports)</option>
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
          title="Run Code in Native Sandbox (Ctrl+Enter)"
          className="flex items-center gap-2 px-5 py-1.5 bg-[#238636] hover:bg-[#2ea043] disabled:opacity-50 text-white font-bold text-xs sm:text-sm rounded-md transition-all shadow-md shadow-green-950/40 active:scale-95 shrink-0"
        >
          {loadingAction === 'execute' ? (
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Play className="w-4 h-4 fill-white" />
          )}
          <span>{loadingAction === 'execute' ? 'Running...' : 'Run'}</span>
        </button>

        {/* Right: Target Language + View Mode + Console + Save */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Chosen Native Language Selector (All 8 Languages) */}
          <div className="flex items-center gap-1.5 bg-[#21262d] border border-[#30363d] rounded-md px-2.5 py-1">
            <Languages className="w-3.5 h-3.5 text-blue-400 shrink-0" />
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

          {/* Desktop Dual Split Toggle */}
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

          {/* Console Toggle */}
          <button
            onClick={() => setShowConsole((v) => !v)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors border ${showConsole ? 'bg-blue-600 border-blue-500 text-white' : 'bg-[#21262d] border-[#30363d] text-slate-300 hover:bg-[#30363d]'}`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Console</span>
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

      {/* ─── MOBILE VIEW SWITCHER (Visible on Mobile/Tablet < 1024px) ── */}
      <div className="flex lg:hidden items-center bg-[#161b22] border-b border-[#30363d] px-2 py-1 gap-1 text-xs overflow-x-auto shrink-0">
        <button
          onClick={() => setMobileView('files')}
          className={`px-3 py-1 rounded-md font-medium flex items-center gap-1.5 transition-colors ${mobileView === 'files' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
        >
          <Folder className="w-3.5 h-3.5" />
          <span>Files ({files.length})</span>
        </button>
        <button
          onClick={() => {
            setMobileView('english');
            setViewLayout('english');
          }}
          className={`px-3 py-1 rounded-md font-medium flex items-center gap-1.5 transition-colors ${mobileView === 'english' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
        >
          <FileCode className="w-3.5 h-3.5 text-blue-400" />
          <span>English Code</span>
        </button>
        <button
          onClick={() => {
            setMobileView('native');
            setViewLayout('native');
          }}
          className={`px-3 py-1 rounded-md font-medium flex items-center gap-1.5 transition-colors ${mobileView === 'native' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
        >
          <Languages className="w-3.5 h-3.5 text-emerald-400" />
          <span>{currentNative?.native || 'భ'} {NATIVE_CODE_WORD[nativeLang] || 'కోడ్'}</span>
        </button>
        <button
          onClick={() => {
            setMobileView('console');
            setShowConsole(true);
          }}
          className={`px-3 py-1 rounded-md font-medium flex items-center gap-1.5 transition-colors ${mobileView === 'console' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
        >
          <Terminal className="w-3.5 h-3.5" />
          <span>Console</span>
        </button>
      </div>

      {/* ─── ERROR BANNER ────────────────────────────────────────────── */}
      {errorMessage && (
        <div className="flex items-center justify-between px-4 py-2 bg-rose-950/80 border-b border-rose-500/50 text-rose-200 text-xs shrink-0">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-rose-400 hover:text-white ml-4">
            ✕
          </button>
        </div>
      )}

      {/* ─── MAIN IDE BODY ───────────────────────────────────────────── */}
      <div className="flex flex-1 min-h-0 overflow-hidden relative">
        {/* ══ 1. FILE EXPLORER & BHASHA TOOLS SIDEBAR ══ */}
        {(showFileExplorer || mobileView === 'files') && (
          <div
            className={`${mobileView === 'files' ? 'w-full flex' : 'hidden md:flex'} flex-col w-64 lg:w-72 shrink-0 bg-[#0d1117] border-r border-[#30363d] overflow-y-auto`}
          >
            {/* Section A: File Management */}
            <div className="p-3 border-b border-[#30363d]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Folder className="w-3.5 h-3.5 text-blue-400" /> Project Files
                </span>
                <button
                  onClick={() => setIsCreatingFile(true)}
                  className="flex items-center gap-1 text-[11px] bg-blue-600 hover:bg-blue-500 text-white font-semibold px-2 py-0.5 rounded transition-colors"
                  title="Add new file"
                >
                  <Plus className="w-3 h-3" /> New File
                </button>
              </div>

              {/* Inline New File Form */}
              {isCreatingFile && (
                <div className="mb-2 p-2 bg-[#161b22] border border-blue-500/50 rounded-md">
                  <div className="text-[10px] text-slate-400 mb-1">Enter filename (e.g. helper.py):</div>
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      autoFocus
                      value={newFileName}
                      onChange={(e) => setNewFileName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleCreateFileSubmit();
                        if (e.key === 'Escape') setIsCreatingFile(false);
                      }}
                      placeholder="filename.py"
                      className="flex-1 bg-[#0d1117] border border-[#30363d] rounded px-2 py-1 text-xs text-slate-200 outline-none font-mono"
                    />
                    <button
                      onClick={handleCreateFileSubmit}
                      className="bg-blue-600 text-white px-2 py-1 rounded text-xs font-bold"
                    >
                      ✓
                    </button>
                    <button
                      onClick={() => setIsCreatingFile(false)}
                      className="bg-[#21262d] text-slate-400 px-2 py-1 rounded text-xs"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              )}

              {/* Files List */}
              <div className="space-y-1">
                {files.map((file) => (
                  <div
                    key={file.id}
                    className={`group flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-mono transition-colors cursor-pointer ${file.id === activeFile.id ? 'bg-[#21262d] text-white border-l-2 border-blue-500 font-bold' : 'text-slate-400 hover:text-slate-200 hover:bg-[#161b22]'}`}
                    onClick={() => {
                      setActiveFileId(file.id);
                      if (mobileView === 'files') setMobileView('english');
                    }}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <FileCode className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      {editingFileId === file.id ? (
                        <input
                          autoFocus
                          value={renameInput}
                          onChange={(e) => setRenameInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleRenameSubmit(file.id);
                            if (e.key === 'Escape') setEditingFileId(null);
                          }}
                          onBlur={() => handleRenameSubmit(file.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="bg-[#0d1117] border border-blue-500 text-white px-1 rounded text-xs w-28 outline-none"
                        />
                      ) : (
                        <span className="truncate">{file.name}</span>
                      )}
                      {file.isEntry && (
                        <span className="text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1 rounded font-sans uppercase">
                          Entry
                        </span>
                      )}
                    </div>

                    {/* Action buttons on hover */}
                    <div className="hidden group-hover:flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                      {!file.isEntry && (
                        <button
                          onClick={() => handleSetEntrypoint(file.id)}
                          title="Set as main entrypoint"
                          className="p-1 text-slate-400 hover:text-amber-400 transition-colors"
                        >
                          <Star className="w-3 h-3" />
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setEditingFileId(file.id);
                          setRenameInput(file.name);
                        }}
                        title="Rename file"
                        className="p-1 text-slate-400 hover:text-white transition-colors"
                      >
                        <Edit3 className="w-3 h-3" />
                      </button>
                      {files.length > 1 && (
                        <button
                          onClick={() => handleDeleteFile(file.id)}
                          title="Delete file"
                          className="p-1 text-slate-400 hover:text-rose-400 transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Section B: Cross-File Module Relationships */}
            {moduleImports.length > 0 && (
              <div className="p-3 border-b border-[#30363d] bg-[#161b22]/40">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1">
                  <ArrowRight className="w-3 h-3 text-emerald-400" /> Module Imports
                </div>
                <div className="space-y-1.5">
                  {moduleImports.map((rel, idx) => (
                    <div key={idx} className="bg-[#0d1117] border border-[#30363d] p-2 rounded text-[11px] font-mono">
                      <div className="text-slate-400 flex items-center justify-between">
                        <span>{rel.fromFile} → {rel.moduleName}</span>
                        {rel.isLocal ? (
                          <span className="text-[9px] text-emerald-400 bg-emerald-950/60 px-1 rounded">Local</span>
                        ) : (
                          <span className="text-[9px] text-amber-400 bg-amber-950/60 px-1 rounded">Package</span>
                        )}
                      </div>
                      <div className="mt-1 text-emerald-300 font-sans text-xs">
                        {rel.importedSymbols.map((sym, sIdx) => (
                          <span key={sIdx} className="inline-block mr-2">
                            {sym} <span className="text-slate-500">→</span> <span className="font-bold">{rel.translatedSymbols[sIdx]}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Section C: Bhasha Tools */}
            <div className="p-3 border-b border-[#30363d]">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-2">
                Bhasha Tools
              </span>
              <div className="space-y-1">
                {[
                  {
                    icon: <Sparkles className="w-4 h-4 text-blue-400" />,
                    label: 'Explain Code',
                    action: handleExplain,
                    loading: 'explain',
                  },
                  {
                    icon: <Brain className="w-4 h-4 text-amber-400" />,
                    label: 'Simple Logic',
                    action: () => {
                      setShowConsole(true);
                      setConsoleTab('ai');
                      setAiSubTab('simpleLogic');
                    },
                    loading: null,
                  },
                  {
                    icon: <Bug className="w-4 h-4 text-rose-400" />,
                    label: 'Debug & Fix',
                    action: handleDebug,
                    loading: 'debug',
                  },
                  {
                    icon: <Repeat className="w-4 h-4 text-indigo-400" />,
                    label: 'Convert Code',
                    action: () => {
                      setShowConsole(true);
                      setConsoleTab('ai');
                      setAiSubTab('convert');
                    },
                    loading: null,
                  },
                  {
                    icon: <MessageSquare className="w-4 h-4 text-purple-400" />,
                    label: 'Ask in Bhasha',
                    action: () => {
                      setShowConsole(true);
                      setConsoleTab('ai');
                      setAiSubTab('ask');
                    },
                    loading: null,
                  },
                ].map((tool, idx) => (
                  <button
                    key={idx}
                    onClick={tool.action}
                    disabled={!!loadingAction}
                    className="w-full flex items-center gap-2.5 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white hover:bg-[#161b22] rounded-md transition-colors text-left"
                  >
                    <span>
                      {loadingAction === tool.loading ? (
                        <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin inline-block" />
                      ) : (
                        tool.icon
                      )}
                    </span>
                    <span>{tool.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Sidebar Footer */}
            <div className="mt-auto p-3 border-t border-[#30363d] bg-[#161b22]/30">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-400">
                <Zap className="w-3.5 h-3.5 shrink-0" /> Live Transliterator Active
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5 leading-snug">
                Identifiers transliterated to {currentNative?.native} ({currentNative?.english})
              </div>
            </div>
          </div>
        )}

        {/* ══ 2. CENTRAL EDITORS & TABS AREA ══ */}
        {(mobileView !== 'files' || window.innerWidth >= 1024) && (
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            {/* Editor File Tabs Bar (VS Code Style) */}
            <div className="flex items-center bg-[#161b22] border-b border-[#30363d] px-2 overflow-x-auto no-scrollbar shrink-0">
              <div className="flex items-center gap-1 py-1">
                {files.map((file) => (
                  <div
                    key={file.id}
                    onClick={() => setActiveFileId(file.id)}
                    className={`group flex items-center gap-2 px-3 py-1.5 text-xs font-mono rounded-t-md border-t-2 cursor-pointer transition-colors ${file.id === activeFile.id ? 'bg-[#1e1e1e] border-blue-500 text-white font-bold' : 'bg-[#161b22] border-transparent text-slate-400 hover:text-slate-200 hover:bg-[#21262d]'}`}
                  >
                    <FileCode className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <span>{file.name}</span>
                    {files.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteFile(file.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 hover:text-rose-400 p-0.5 rounded transition-opacity"
                        title="Close file"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={() => setIsCreatingFile(true)}
                  title="Add new file"
                  className="p-1 text-slate-400 hover:text-white hover:bg-[#21262d] rounded transition-colors ml-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Split Panes Container */}
            <div className="flex-1 flex min-h-0 overflow-hidden">
              {/* ────── LEFT PANE: ENGLISH CODE EDITOR ────── */}
              {(viewLayout === 'split' || viewLayout === 'english') && mobileView !== 'native' && (
                <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#1e1e1e]">
                  {/* Left Pane Header */}
                  <div className="flex items-center justify-between px-3 py-2 bg-[#161b22] border-b border-[#30363d] text-xs shrink-0">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-500" />
                      <span className="font-semibold text-slate-200">
                        {activeFile.name} (Source)
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">Lines: {lineCount}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setSyntaxOverlay(!syntaxOverlay)}
                        title={syntaxOverlay ? 'Switch to Direct Text Mode' : 'Switch to Syntax Highlighting'}
                        className={`px-2 py-0.5 rounded text-[10px] font-medium border transition-colors ${syntaxOverlay ? 'bg-blue-950/60 text-blue-300 border-blue-500/30 hover:bg-blue-900/60' : 'bg-[#21262d] text-slate-400 border-[#30363d] hover:text-white'}`}
                      >
                        {syntaxOverlay ? '🎨 VS Code Colors' : '📝 Direct Text'}
                      </button>
                      <button
                        onClick={handleCopyEnglish}
                        title="Copy Source Code"
                        className="p-1 text-slate-400 hover:text-white hover:bg-[#21262d] rounded transition-colors"
                      >
                        {copiedEnglish ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onClick={() => handleDownload(code, activeFile.name)}
                        title="Download File"
                        className="p-1 text-slate-400 hover:text-white hover:bg-[#21262d] rounded transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Overlapping Synchronized Editor */}
                  <div className="flex-1 flex overflow-hidden relative bg-[#1e1e1e]">
                    {/* Line numbers column */}
                    <div
                      className="select-none bg-[#1e1e1e] text-[#858585] text-right pr-3 pl-2 shrink-0 border-r border-[#30363d]/60 overflow-hidden"
                      style={{
                        minWidth: '44px',
                        fontFamily: VSCODE_MONO_FONT,
                        fontSize: '13px',
                        lineHeight: '24px',
                        paddingTop: '12px',
                        paddingBottom: '12px',
                      }}
                    >
                      {Array.from({ length: Math.max(lineCount, 25) }).map((_, i) => (
                        <div
                          key={i}
                          onClick={() => setHighlightedLine(i + 1)}
                          style={{ height: '24px', lineHeight: '24px' }}
                          className={`cursor-pointer hover:text-slate-200 ${highlightedLine === i + 1 ? 'text-[#58a6ff] font-bold' : ''}`}
                        >
                          {i + 1}
                        </div>
                      ))}
                    </div>

                    {/* Editor Layers */}
                    <div className="flex-1 relative overflow-hidden bg-[#1e1e1e]">
                      {syntaxOverlay && (
                        <div
                          ref={englishPreRef}
                          aria-hidden="true"
                          style={{
                            ...CODE_EDITOR_SHARED_STYLE,
                            position: 'absolute',
                            inset: 0,
                            pointerEvents: 'none',
                            userSelect: 'none',
                            overflow: 'hidden',
                          }}
                        >
                          <HighlightedCodeBlock code={code} highlightedLine={highlightedLine} />
                        </div>
                      )}

                      <textarea
                        ref={englishEditorRef}
                        value={code}
                        onChange={(e) => handleCodeChange(e.target.value)}
                        onScroll={handleEnglishScroll}
                        onKeyDown={handleEditorKeyDown}
                        placeholder="// Type your code here..."
                        spellCheck={false}
                        autoCorrect="off"
                        autoCapitalize="off"
                        style={{
                          ...CODE_EDITOR_SHARED_STYLE,
                          position: 'absolute',
                          inset: 0,
                          background: 'transparent',
                          color: syntaxOverlay ? 'transparent' : '#e6edf3',
                          caretColor: '#58a6ff',
                          outline: 'none',
                          resize: 'none',
                          overflow: 'auto',
                          zIndex: 10,
                        }}
                        className="selection:bg-[#264f78]/60 selection:text-transparent"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Central Divider in Split View */}
              {viewLayout === 'split' && mobileView !== 'native' && mobileView !== 'english' && (
                <div className="w-[5px] bg-[#1b222d] hover:bg-blue-600/70 border-x border-[#30363d] flex flex-col items-center justify-center cursor-col-resize transition-colors shrink-0 group relative z-10">
                  <div className="w-1.5 h-8 rounded-full bg-slate-600 group-hover:bg-blue-400 transition-colors" />
                </div>
              )}

              {/* ────── RIGHT PANE: NATIVE LANGUAGE CODE ────── */}
              {(viewLayout === 'split' || viewLayout === 'native') && mobileView !== 'english' && (
                <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#0d1117] border-l border-[#30363d]">
                  {/* Right Header */}
                  <div className="flex items-center justify-between px-3 py-2 bg-[#161b22] border-b border-[#30363d] text-xs shrink-0">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span className="font-semibold text-emerald-400">
                        {currentNative?.native || 'తెలుగు'} {NATIVE_CODE_WORD[nativeLang] || 'కోడ్'} ({currentNative?.english})
                      </span>
                      <span className="text-[10px] bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 px-1.5 py-0.2 rounded font-mono">
                        Deterministic
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex bg-[#21262d] border border-[#30363d] rounded text-[10px] font-medium overflow-hidden">
                        <button
                          onClick={() => setTranslationMode('guide')}
                          className={`px-2 py-0.5 transition-colors ${translationMode === 'guide' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
                        >
                          {currentNative?.native} {NATIVE_CODE_WORD[nativeLang] || 'కోడ్'}
                        </button>
                        <button
                          onClick={() => setTranslationMode('pseudocode')}
                          className={`px-2 py-0.5 transition-colors ${translationMode === 'pseudocode' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
                        >
                          {NATIVE_PSEUDO_WORD[nativeLang] || 'సూడోకోడ్'}
                        </button>
                      </div>

                      <button
                        onClick={handleCopyNative}
                        title="Copy Native Code"
                        className="p-1 text-slate-400 hover:text-white hover:bg-[#21262d] rounded transition-colors"
                      >
                        {copiedNative ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onClick={() =>
                          handleDownload(nativeTranslation.translatedCode, `${activeFile.name}_${nativeLang}.txt`)
                        }
                        title="Download Native Code"
                        className="p-1 text-slate-400 hover:text-white hover:bg-[#21262d] rounded transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Right Code Display */}
                  <div className="flex-1 flex overflow-hidden relative bg-[#1e1e1e]">
                    <div
                      className="select-none bg-[#1e1e1e] text-[#858585] text-right pr-3 pl-2 shrink-0 border-r border-[#30363d]/60 overflow-hidden"
                      style={{
                        minWidth: '44px',
                        fontFamily: VSCODE_MONO_FONT,
                        fontSize: '13px',
                        lineHeight: '24px',
                        paddingTop: '12px',
                        paddingBottom: '12px',
                      }}
                    >
                      {Array.from({ length: Math.max(nativeTranslation.translatedCode.split('\n').length, 25) }).map(
                        (_, i) => (
                          <div
                            key={i}
                            style={{ height: '24px', lineHeight: '24px' }}
                            className="cursor-default"
                          >
                            {i + 1}
                          </div>
                        )
                      )}
                    </div>

                    <div
                      ref={nativeViewerRef}
                      onScroll={handleNativeScroll}
                      style={{
                        ...CODE_EDITOR_SHARED_STYLE,
                        position: 'absolute',
                        inset: 0,
                        left: '44px',
                        overflow: 'auto',
                      }}
                    >
                      <HighlightedCodeBlock
                        code={nativeTranslation.translatedCode}
                        highlightedLine={highlightedLine}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ─── BOTTOM CONSOLE & AI INSIGHTS DRAWER ─────────────────────── */}
      {showConsole && (
        <div
          className={`border-t border-[#30363d] bg-[#161b22] shrink-0 flex flex-col transition-all duration-200 ${consoleMaximized ? 'h-[75vh]' : 'h-60 sm:h-72'}`}
        >
          {/* Console Header */}
          <div className="flex items-center justify-between px-3 py-1.5 bg-[#161b22] border-b border-[#30363d] text-xs">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setConsoleTab('terminal')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded font-semibold transition-colors ${consoleTab === 'terminal' ? 'bg-[#30363d] text-white' : 'text-slate-400 hover:text-slate-200'}`}
              >
                <Terminal className="w-3.5 h-3.5" />
                <span>Terminal</span>
                {terminalOutput && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${terminalOutput.success ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'}`}
                  >
                    exit {terminalOutput.exitCode ?? 0}
                  </span>
                )}
              </button>

              <button
                onClick={() => setConsoleTab('stdin')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded font-semibold transition-colors ${consoleTab === 'stdin' ? 'bg-[#30363d] text-white' : 'text-slate-400 hover:text-slate-200'}`}
              >
                <span>Input (stdin)</span>
                {stdinInput && <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />}
              </button>

              <button
                onClick={() => setConsoleTab('ai')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded font-semibold transition-colors ${consoleTab === 'ai' ? 'bg-[#30363d] text-white' : 'text-slate-400 hover:text-slate-200'}`}
              >
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                <span>AI Insights</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              {consoleTab === 'terminal' && terminalOutput && (
                <button
                  onClick={() => setTerminalOutput(null)}
                  className="text-xs text-slate-400 hover:text-white transition-colors"
                >
                  Clear
                </button>
              )}
              <button
                onClick={() => setConsoleMaximized((v) => !v)}
                title={consoleMaximized ? 'Restore Console' : 'Maximize Console'}
                className="text-slate-400 hover:text-white p-1 rounded"
              >
                {consoleMaximized ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={() => setShowConsole(false)}
                title="Close Console"
                className="text-slate-400 hover:text-white p-1 rounded"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Console Content */}
          <div className="flex-1 overflow-auto bg-[#0a0d12] p-3 font-mono text-xs text-slate-200">
            {/* 1. Terminal stdout/stderr view */}
            {consoleTab === 'terminal' && (
              <div>
                {loadingAction === 'execute' ? (
                  <div className="flex items-center gap-2 text-slate-400">
                    <span className="w-3.5 h-3.5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                    <span>Executing {progLang} program in sandbox...</span>
                  </div>
                ) : terminalOutput ? (
                  <div>
                    <div className="text-[11px] text-slate-500 mb-2 border-b border-[#21262d] pb-1 flex items-center justify-between font-sans">
                      <span>Engine: {terminalOutput.engine || 'native'} ({terminalOutput.language})</span>
                      <span>Time: {terminalOutput.timeMs}ms</span>
                    </div>
                    <pre className="whitespace-pre-wrap leading-relaxed select-text font-mono text-[#e6edf3]">
                      {terminalOutput.output}
                    </pre>
                  </div>
                ) : (
                  <div className="text-slate-500 py-6 text-center font-sans">
                    Click <span className="text-emerald-400 font-bold">Run</span> (or press Ctrl+Enter) to execute your program. Output will appear here.
                  </div>
                )}
              </div>
            )}

            {/* 2. Standard Input view */}
            {consoleTab === 'stdin' && (
              <div className="font-sans">
                <div className="text-xs text-slate-400 mb-2">
                  Provide custom standard input for code that reads from <code className="text-blue-400">input()</code> / <code className="text-blue-400">stdin</code>:
                </div>
                <textarea
                  value={stdinInput}
                  onChange={(e) => setStdinInput(e.target.value)}
                  placeholder="Type standard input lines here..."
                  rows={4}
                  className="w-full bg-[#161b22] border border-[#30363d] rounded p-2 text-xs font-mono text-white outline-none focus:border-blue-500"
                />
                <div className="mt-2 flex justify-end">
                  <button
                    onClick={handleExecute}
                    disabled={!!loadingAction}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#238636] hover:bg-[#2ea043] text-white font-bold text-xs rounded transition-colors"
                  >
                    <Play className="w-3 h-3 fill-white" />
                    Run with Input
                  </button>
                </div>
              </div>
            )}

            {/* 3. AI Insights view */}
            {consoleTab === 'ai' && (
              <div className="font-sans">
                {/* Sub-tabs */}
                <div className="flex gap-2 border-b border-[#21262d] pb-2 mb-3 text-xs">
                  {[
                    { key: 'lineByLine', label: 'Line-by-Line' },
                    { key: 'simpleLogic', label: 'Simple Logic' },
                    { key: 'debug', label: 'Debug & Fix' },
                    { key: 'convert', label: 'Convert' },
                    { key: 'ask', label: 'Ask AI' },
                  ].map((sub) => (
                    <button
                      key={sub.key}
                      onClick={() => setAiSubTab(sub.key as any)}
                      className={`px-2.5 py-1 rounded text-xs transition-colors ${aiSubTab === sub.key ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
                    >
                      {sub.label}
                    </button>
                  ))}
                </div>

                {/* Sub-tab 1: Line-by-Line Explanation */}
                {aiSubTab === 'lineByLine' && (
                  <div>
                    {explanation ? (
                      <div className="space-y-3">
                        <div className="p-3 bg-blue-950/30 border border-blue-500/30 rounded-lg">
                          <div className="text-xs font-bold text-blue-400 mb-1">Overview:</div>
                          <p className="text-sm text-slate-200">{explanation.overview}</p>
                        </div>
                        <div className="space-y-2">
                          {explanation.lineByLine.map((line, idx) => (
                            <div key={idx} className="p-2 bg-[#161b22] border border-[#30363d] rounded text-xs">
                              <div className="font-mono text-blue-300 font-bold mb-1">
                                Line {line.lineNumber}: {line.codeSnippet}
                              </div>
                              <div className="text-slate-300">{line.explanation}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-6 text-slate-400">
                        Click "Explain Code" in the sidebar to generate line-by-line explanation in {currentNative?.native}.
                      </div>
                    )}
                  </div>
                )}

                {/* Sub-tab 2: Simple Logic */}
                {aiSubTab === 'simpleLogic' && (
                  <div>
                    {explanation?.simpleLogicSummary ? (
                      <div className="p-3 bg-[#161b22] border border-[#30363d] rounded-lg">
                        <div className="font-bold text-amber-400 text-xs mb-1">Logic Summary:</div>
                        <p className="text-sm text-slate-200">{explanation.simpleLogicSummary}</p>
                      </div>
                    ) : (
                      <div className="text-center py-6 text-slate-400">
                        Click "Simple Logic" in the sidebar to generate a plain-language summary.
                      </div>
                    )}
                  </div>
                )}

                {/* Sub-tab 3: Debug & Fix */}
                {aiSubTab === 'debug' && (
                  <div>
                    {debugResult ? (
                      <div className="space-y-3">
                        <div className={`p-3 rounded-lg border ${debugResult.hasErrors ? 'bg-rose-950/30 border-rose-500/30' : 'bg-emerald-950/30 border-emerald-500/30'}`}>
                          <div className="font-bold text-xs mb-1">
                            {debugResult.hasErrors ? '⚠️ Issues Detected:' : '✅ Code Looks Good:'}
                          </div>
                          <p className="text-sm">{debugResult.summary}</p>
                        </div>
                        {debugResult.correctedCode && (
                          <div className="p-3 bg-[#161b22] border border-[#30363d] rounded-lg">
                            <div className="font-bold text-emerald-400 text-xs mb-1">Suggested Fix:</div>
                            <pre className="font-mono text-xs text-emerald-300 whitespace-pre-wrap">{debugResult.correctedCode}</pre>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-6 text-slate-400">
                        Click "Debug & Fix" in the sidebar to analyze code for potential bugs.
                      </div>
                    )}
                  </div>
                )}

                {/* Sub-tab 4: Convert */}
                {aiSubTab === 'convert' && (
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <select
                        value={convertTargetLang}
                        onChange={(e) => setConvertTargetLang(e.target.value)}
                        className="bg-[#161b22] border border-[#30363d] rounded px-2.5 py-1 text-xs text-white"
                      >
                        <option value="javascript">JavaScript</option>
                        <option value="python">Python</option>
                        <option value="typescript">TypeScript</option>
                        <option value="java">Java</option>
                        <option value="cpp">C++</option>
                      </select>
                      <button
                        onClick={handleConvert}
                        disabled={!!loadingAction}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-3 py-1 rounded text-xs transition-colors"
                      >
                        {loadingAction === 'convert' ? 'Converting...' : 'Convert Now'}
                      </button>
                    </div>
                    {conversionResult && (
                      <div className="p-3 bg-[#161b22] border border-[#30363d] rounded-lg">
                        <pre className="font-mono text-xs text-indigo-300 whitespace-pre-wrap">{conversionResult.convertedCode}</pre>
                      </div>
                    )}
                  </div>
                )}

                {/* Sub-tab 5: Ask in Bhasha */}
                {aiSubTab === 'ask' && (
                  <div className="flex flex-col h-56">
                    <div className="flex-1 overflow-y-auto space-y-2 mb-2 pr-1">
                      {chatMessages.map((msg, i) => (
                        <div
                          key={i}
                          className={`p-2.5 rounded-lg text-xs ${msg.sender === 'user' ? 'bg-blue-600/30 border border-blue-500/40 ml-8 text-white' : 'bg-[#161b22] border border-[#30363d] mr-8 text-slate-200'}`}
                        >
                          {msg.text}
                        </div>
                      ))}
                      <div ref={chatEndRef} />
                    </div>
                    <form onSubmit={handleAskAi} className="flex gap-2">
                      <input
                        type="text"
                        value={questionInput}
                        onChange={(e) => setQuestionInput(e.target.value)}
                        placeholder="Ask anything about your code..."
                        className="flex-1 bg-[#161b22] border border-[#30363d] rounded px-3 py-1 text-xs text-white outline-none focus:border-blue-500"
                      />
                      <button
                        type="submit"
                        disabled={askingAi}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded text-xs font-bold"
                      >
                        Send
                      </button>
                    </form>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
