import React, { useState, useEffect, useRef, useMemo, useLayoutEffect, useDeferredValue } from 'react';
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
  PanelLeft,
  PanelLeftClose,
  LayoutDashboard,
  Layers,
  Compass,
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
import { debugCodeDeterministically, convertCodeDeterministically, askCodeDeterministically } from '../utils/deterministicTools';
import { analyzeCodeRuleBased } from '../utils/ruleBasedAnalyzer';
import { parseVisualBlueprint, VisualBlueprintLine } from '../utils/visualBlueprint';
import { BlueprintIcon } from '../components/BlueprintIcon';
import { Icon } from '@iconify/react';
import { FileIcon, LanguageIcon } from '../components/FileIcon';

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

// Default project files: Only main.py for a new project
const DEFAULT_PROJECT_FILES: ProjectFile[] = [
  {
    id: 'f_main',
    name: 'main.py',
    content: `# NexusCode Python Project\n\ndef calculate_sum(a, b):\n    return a + b\n\nresult = calculate_sum(10, 20)\nprint("Result:", result)\n`,
    isEntry: true,
  },
];

export const WorkspacePage: React.FC<WorkspacePageProps> = ({ onNavigate, initialProject }) => {
  const { user, token, quota, refreshUser, openAuthModal } = useAuth();

  // Project & Multi-file state
  const [projectId, setProjectId] = useState<string | null>(initialProject?.id || null);
  const [projectTitle, setProjectTitle] = useState(initialProject?.title || 'my_project');
  const [progLang, setProgLang] = useState(initialProject?.programmingLanguage || 'python');
  const [nativeLang, setNativeLang] = useState<NativeLanguageKey>(
    initialProject?.nativeLanguage || (user?.defaultLanguage as NativeLanguageKey) || 'english'
  );

  // Files state (persisted to localStorage)
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
    try {
      const saved = localStorage.getItem('bhashacode_files_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return DEFAULT_PROJECT_FILES;
  });

  // Open tabs state (persisted to localStorage)
  const [openTabIds, setOpenTabIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('bhashacode_open_tabs_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [files[0]?.id || 'f_main'];
  });

  // Active file ID
  const [activeFileId, setActiveFileId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('bhashacode_active_file_v2');
      if (saved && files.some((f) => f.id === saved)) return saved;
    } catch {}
    return files[0]?.id || 'f_main';
  });

  // Persist files and tabs to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('bhashacode_files_v2', JSON.stringify(files));
      localStorage.setItem('bhashacode_open_tabs_v2', JSON.stringify(openTabIds));
      localStorage.setItem('bhashacode_active_file_v2', activeFileId);
    } catch {}
  }, [files, openTabIds, activeFileId]);

  // Active file helper
  const activeFile = useMemo(() => {
    return files.find((f) => f.id === activeFileId) || files[0] || { id: 'default', name: 'main.py', content: '' };
  }, [files, activeFileId]);

  const entryFile = useMemo(() => {
    return files.find((f) => f.isEntry) || files[0] || activeFile;
  }, [files, activeFile]);

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

  // Draggable Split Divider State (20% to 80%)
  const [splitPercent, setSplitPercent] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('bhashacode_split_percent');
      if (saved) return Number(saved);
    } catch {}
    return 50;
  });
  const [isDraggingSplit, setIsDraggingSplit] = useState(false);
  const splitContainerRef = useRef<HTMLDivElement>(null);

  // Draggable Bottom Console Resizer State (120px to 80vh)
  const [consoleHeight, setConsoleHeight] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('bhashacode_console_height');
      if (saved) return Number(saved);
    } catch {}
    return 240;
  });
  const [isDraggingConsole, setIsDraggingConsole] = useState(false);

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
  const [showFileExplorer, setShowFileExplorer] = useState(false);

  // Reactive window width for responsive layout decisions
  const [windowWidth, setWindowWidth] = useState(() => window.innerWidth);
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Inline file creation / renaming state
  const [isCreatingFile, setIsCreatingFile] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [editingFileId, setEditingFileId] = useState<string | null>(null);
  const [renameInput, setRenameInput] = useState('');

  // Refs for editor & viewer
  const englishEditorRef = useRef<HTMLTextAreaElement>(null);
  const englishPreRef = useRef<HTMLDivElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  const arrowsRailRef = useRef<HTMLDivElement>(null);
  const nativeViewerRef = useRef<HTMLDivElement>(null);
  const nativeLineNumbersRef = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Synchronous cursor & selection restoration (prevents jumping cursor)
  const pendingSelectionRef = useRef<{ start: number; end: number } | null>(null);

  // Active cursor line for VS Code active line highlight
  const [activeCursorLine, setActiveCursorLine] = useState<number>(1);

  // Restore cursor synchronously before paint
  useLayoutEffect(() => {
    if (pendingSelectionRef.current && englishEditorRef.current) {
      const { start, end } = pendingSelectionRef.current;
      englishEditorRef.current.setSelectionRange(start, end);
      pendingSelectionRef.current = null;
    }
  }, [code]);

  // High-performance deferred code for background translation (zero input lag)
  const deferredCode = useDeferredValue(code);

  // Visual Blueprint View Mode ('aligned' | 'blocks' | 'code')
  const [blueprintMode, setBlueprintMode] = useState<'aligned' | 'blocks' | 'code'>('aligned');

  // Parse semantic visual blueprint from code (Excalidraw / Architectural style)
  const visualBlueprint = useMemo(() => {
    return parseVisualBlueprint(deferredCode, progLang);
  }, [deferredCode, progLang]);

  // Jump cursor to target line and highlight it
  const jumpToLine = (targetLineNum: number) => {
    const lines = code.split('\n');
    let charCount = 0;
    for (let i = 0; i < targetLineNum - 1 && i < lines.length; i++) {
      charCount += lines[i].length + 1;
    }
    const lineLen = lines[targetLineNum - 1]?.length || 0;
    setActiveCursorLine(targetLineNum);
    if (englishEditorRef.current) {
      englishEditorRef.current.focus();
      englishEditorRef.current.setSelectionRange(charCount, charCount + lineLen);
    }
  };

  // INSTANT DETERMINISTIC TRANSLATION (Client-side, updates in background as user types)
  const nativeTranslation = useMemo(() => {
    return translateCodeToNative(deferredCode, nativeLang, translationMode);
  }, [deferredCode, nativeLang, translationMode]);

  // Synchronized scrolling for left editor, overlay, line numbers, arrows, and blueprint
  const handleEnglishScroll = () => {
    if (englishEditorRef.current) {
      const { scrollTop, scrollLeft } = englishEditorRef.current;
      if (englishPreRef.current) {
        englishPreRef.current.scrollTop = scrollTop;
        englishPreRef.current.scrollLeft = scrollLeft;
      }
      if (lineNumbersRef.current) {
        lineNumbersRef.current.scrollTop = scrollTop;
      }
      if (arrowsRailRef.current) {
        arrowsRailRef.current.scrollTop = scrollTop;
      }
      if (blueprintMode === 'aligned') {
        if (nativeViewerRef.current) {
          nativeViewerRef.current.scrollTop = scrollTop;
        }
        if (nativeLineNumbersRef.current) {
          nativeLineNumbersRef.current.scrollTop = scrollTop;
        }
      }
    }
  };

  // Synchronized scrolling for right native viewer and line numbers
  const handleNativeScroll = () => {
    if (nativeViewerRef.current) {
      const { scrollTop } = nativeViewerRef.current;
      if (nativeLineNumbersRef.current) {
        nativeLineNumbersRef.current.scrollTop = scrollTop;
      }
      if (blueprintMode === 'aligned' && englishEditorRef.current) {
        englishEditorRef.current.scrollTop = scrollTop;
        if (englishPreRef.current) englishPreRef.current.scrollTop = scrollTop;
        if (lineNumbersRef.current) lineNumbersRef.current.scrollTop = scrollTop;
        if (arrowsRailRef.current) arrowsRailRef.current.scrollTop = scrollTop;
      }
    }
  };

  // Track cursor position to highlight current active line in VS Code style
  const handleEditorSelect = () => {
    if (englishEditorRef.current) {
      const pos = englishEditorRef.current.selectionStart;
      const currentLine = code.substring(0, pos).split('\n').length;
      setActiveCursorLine(currentLine);
    }
  };

  // Helper to atomically update code and cursor position synchronously
  const updateCodeAndSelection = (newCode: string, newStart: number, newEnd: number = newStart) => {
    pendingSelectionRef.current = { start: newStart, end: newEnd };
    handleCodeChange(newCode);
  };

  // Draggable Split Divider Event Listener
  const handleSplitMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsDraggingSplit(true);
  };

  useEffect(() => {
    if (!isDraggingSplit) return;

    const handleMouseMove = (e: MouseEvent | TouchEvent) => {
      if (!splitContainerRef.current) return;
      const rect = splitContainerRef.current.getBoundingClientRect();
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const newPercent = ((clientX - rect.left) / rect.width) * 100;
      const clamped = Math.max(20, Math.min(80, newPercent));
      setSplitPercent(clamped);
      try {
        localStorage.setItem('bhashacode_split_percent', String(clamped));
      } catch {}
    };

    const handleMouseUp = () => {
      setIsDraggingSplit(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchmove', handleMouseMove);
    window.addEventListener('touchend', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleMouseMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDraggingSplit]);

  // Draggable Bottom Console Resizer Event Listener
  const handleConsoleResizeStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsDraggingConsole(true);
  };

  useEffect(() => {
    if (!isDraggingConsole) return;

    const handleMove = (e: MouseEvent | TouchEvent) => {
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      const newH = window.innerHeight - clientY;
      const clamped = Math.max(120, Math.min(window.innerHeight * 0.8, newH));
      setConsoleHeight(clamped);
      try {
        localStorage.setItem('bhashacode_console_height', String(clamped));
      } catch {}
    };

    const handleUp = () => {
      setIsDraggingConsole(false);
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    window.addEventListener('touchmove', handleMove);
    window.addEventListener('touchend', handleUp);

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleUp);
    };
  }, [isDraggingConsole]);

  // Cross-file symbol references and module relationship analysis
  const moduleImports = useMemo(() => {
    const list: Array<{
      fromFile: string;
      moduleName: string;
      importedSymbols: string[];
      isLocal: boolean;
      targetFile?: ProjectFile;
      missingFile: boolean;
      missingSymbols: string[];
      translatedSymbols: string[];
    }> = [];

    const standardPackages = new Set([
      'math', 'sys', 'os', 'json', 'random', 'time', 'datetime', 're', 'collections',
      'itertools', 'functools', 'urllib', 'requests', 'diagrams', 'numpy', 'pandas',
      'matplotlib', 'scipy', 'typing', 'pathlib', 'sqlite3', 'unittest', 'pytest',
      'fs', 'path', 'http', 'express', 'react', 'crypto'
    ]);

    files.forEach((file) => {
      const lines = file.content.split('\n');
      lines.forEach((line) => {
        const trimmed = line.trim();

        // 1. Python: from <mod> import <syms>
        const fromMatch = trimmed.match(/^from\s+([a-zA-Z0-9_.]+)\s+import\s+(.+)$/);
        if (fromMatch) {
          const mod = fromMatch[1];
          const rawSyms = fromMatch[2].split(',').map((s) => s.trim().split(/\s+as\s+/)[0].trim()).filter(Boolean);
          const target = files.find(
            (f) => f.name === `${mod}.py` || f.name === mod || f.name === `${mod}.js` || f.name === `${mod}.ts`
          );
          const isStandard = standardPackages.has(mod.split('.')[0]);
          const isLocal = !!target;
          const missingFile = !target && !isStandard;

          const missingSymbols: string[] = [];
          if (target) {
            rawSyms.forEach((sym) => {
              if (sym === '*') return;
              const defPattern = new RegExp(`\\b(def|class)\\s+${sym}\\b|\\b${sym}\\s*=`);
              if (!defPattern.test(target.content)) {
                missingSymbols.push(sym);
              }
            });
          }

          list.push({
            fromFile: file.name,
            moduleName: mod,
            importedSymbols: rawSyms,
            isLocal,
            targetFile: target,
            missingFile,
            missingSymbols,
            translatedSymbols: rawSyms.map((s) => transliterateWord(s, nativeLang)),
          });
        }

        // 2. Python: import <mod>
        const importMatch = trimmed.match(/^import\s+([a-zA-Z0-9_.]+)(?:\s+as\s+[a-zA-Z0-9_]+)?$/);
        if (importMatch && !trimmed.startsWith('from ')) {
          const mod = importMatch[1];
          const target = files.find(
            (f) => f.name === `${mod}.py` || f.name === mod || f.name === `${mod}.js` || f.name === `${mod}.ts`
          );
          const isStandard = standardPackages.has(mod.split('.')[0]);
          const isLocal = !!target;
          const missingFile = !target && !isStandard;

          list.push({
            fromFile: file.name,
            moduleName: mod,
            importedSymbols: [mod],
            isLocal,
            targetFile: target,
            missingFile,
            missingSymbols: [],
            translatedSymbols: [transliterateWord(mod, nativeLang)],
          });
        }

        // 3. JS / TS: import ... from './<mod>'
        const jsImportMatch = trimmed.match(/^import\s+(?:\{([^}]+)\}|([a-zA-Z0-9_$]+))\s+from\s+['"]\.\/([^'"]+)['"]/);
        if (jsImportMatch) {
          const rawSyms = jsImportMatch[1]
            ? jsImportMatch[1].split(',').map((s) => s.trim().split(/\s+as\s+/)[0].trim()).filter(Boolean)
            : [jsImportMatch[2].trim()];
          const modRaw = jsImportMatch[3];
          const modClean = modRaw.replace(/\.(js|ts|jsx|tsx)$/, '');
          const target = files.find(
            (f) => f.name === modRaw || f.name === `${modClean}.js` || f.name === `${modClean}.ts` || f.name === modClean
          );
          const isLocal = !!target;
          const missingFile = !target;

          list.push({
            fromFile: file.name,
            moduleName: modClean,
            importedSymbols: rawSyms,
            isLocal,
            targetFile: target,
            missingFile,
            missingSymbols: [],
            translatedSymbols: rawSyms.map((s) => transliterateWord(s, nativeLang)),
          });
        }
      });
    });

    return list;
  }, [files, nativeLang]);

  // Circular imports detection
  const circularImports = useMemo(() => {
    const cycles: Array<{ fileA: string; fileB: string }> = [];
    moduleImports.forEach((imp) => {
      if (imp.isLocal && imp.targetFile) {
        const reverseImp = moduleImports.find(
          (other) =>
            other.fromFile === imp.targetFile?.name &&
            other.moduleName.replace(/\.[^/.]+$/, '') === imp.fromFile.replace(/\.[^/.]+$/, '')
        );
        if (reverseImp) {
          const already = cycles.some(
            (c) =>
              (c.fileA === imp.fromFile && c.fileB === reverseImp.fromFile) ||
              (c.fileA === reverseImp.fromFile && c.fileB === imp.fromFile)
          );
          if (!already) {
            cycles.push({ fileA: imp.fromFile, fileB: reverseImp.fromFile });
          }
        }
      }
    });
    return cycles;
  }, [moduleImports]);

  // Keyboard shortcut: Ctrl+B / Cmd+B to toggle side menu
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        const target = e.target as HTMLElement;
        if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
          return;
        }
        e.preventDefault();
        setShowFileExplorer((v) => !v);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // Scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Multi-File Operations
  const handleOpenFile = (fileId: string) => {
    if (!openTabIds.includes(fileId)) {
      setOpenTabIds((prev) => [...prev, fileId]);
    }
    setActiveFileId(fileId);
    if (mobileView === 'files') setMobileView('english');
  };

  const handleCloseTab = (fileId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const nextOpen = openTabIds.filter((id) => id !== fileId);
    if (nextOpen.length === 0) {
      const fallbackId = files.find((f) => f.id !== fileId)?.id || fileId;
      setOpenTabIds([fallbackId]);
      setActiveFileId(fallbackId);
      return;
    }
    setOpenTabIds(nextOpen);
    if (activeFileId === fileId) {
      setActiveFileId(nextOpen[nextOpen.length - 1]);
    }
  };

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

    const defaultContent = finalName.endsWith('.py')
      ? `# ${finalName}\n\ndef ${finalName.replace(/\.[^/.]+$/, '')}_task():\n    return "Ready"\n`
      : finalName.endsWith('.js') || finalName.endsWith('.ts')
      ? `// ${finalName}\n\nexport function ${finalName.replace(/\.[^/.]+$/, '')}Task() {\n  return "Ready";\n}\n`
      : `// ${finalName}\n`;

    const newFile: ProjectFile = {
      id: `f_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: finalName,
      content: defaultContent,
    };

    setFiles((prev) => [...prev, newFile]);
    setOpenTabIds((prev) => [...prev, newFile.id]);
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

  const handleDeleteFile = (fileId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (files.length <= 1) {
      setErrorMessage('Cannot delete the only file in your project.');
      return;
    }
    const targetFile = files.find((f) => f.id === fileId);
    if (!targetFile) return;

    const remaining = files.filter((f) => f.id !== fileId);
    setFiles(remaining);

    const nextOpen = openTabIds.filter((id) => id !== fileId);
    setOpenTabIds(nextOpen.length > 0 ? nextOpen : [remaining[0].id]);

    if (activeFileId === fileId) {
      setActiveFileId(nextOpen.length > 0 ? nextOpen[0] : remaining[0].id);
    }
  };

  const handleSetEntrypoint = (fileId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setFiles((prev) =>
      prev.map((f) => ({ ...f, isEntry: f.id === fileId }))
    );
  };

  // Load preset samples
  const handleLoadSample = (sampleType: string) => {
    if (sampleType === 'modular_math') {
      setProgLang('python');
      const sampleFiles: ProjectFile[] = [
        {
          id: 'f_main',
          name: 'main.py',
          content: `from utils import calculate_sum\nfrom helper import format_result\n\n# Test numbers list\nnumbers = [10, 20, 30]\nresult = calculate_sum(numbers)\nprint(format_result("Calculated sum", result))`,
          isEntry: true,
        },
        {
          id: 'f_utils',
          name: 'utils.py',
          content: `def calculate_sum(numbers):\n    # Sum all numbers in the list\n    total = 0\n    for number in numbers:\n        total += number\n    return total`,
        },
        {
          id: 'f_helper',
          name: 'helper.py',
          content: `def format_result(label, value):\n    return f"==> {label}: {value}"`,
        },
      ];
      setFiles(sampleFiles);
      setOpenTabIds(['f_main', 'f_utils', 'f_helper']);
      setActiveFileId('f_main');
      setProjectTitle('modular_math');
    } else if (sampleType === 'count_number') {
      setProgLang('python');
      const newId = `f_count_${Date.now()}`;
      setFiles([
        {
          id: newId,
          name: 'count_number.py',
          content: `def count_number(arr, target):\n    # count occurrences in array\n    count = 0\n    for num in arr:\n        if num == target:\n            count += 1\n    return count\n\nnumbers = [2, 5, 8, 2, 9, 2, 11]\nresult = count_number(numbers, 2)\nprint("Target count:", result)`,
          isEntry: true,
        },
      ]);
      setOpenTabIds([newId]);
      setActiveFileId(newId);
      setProjectTitle('count_occurrences');
    } else if (sampleType === 'binary_search') {
      setProgLang('python');
      const snippet = SUPPORTED_PROG_LANGUAGES.find((p) => p.key === 'python')?.defaultSnippet || '';
      const newId = `f_bs_${Date.now()}`;
      setFiles([
        {
          id: newId,
          name: 'binary_search.py',
          content: snippet,
          isEntry: true,
        },
      ]);
      setOpenTabIds([newId]);
      setActiveFileId(newId);
      setProjectTitle('binary_search');
    } else if (sampleType === 'buggy_loop') {
      setProgLang('python');
      const newId = `f_bug_${Date.now()}`;
      setFiles([
        {
          id: newId,
          name: 'average.py',
          content: `def calculate_average(scores):\n    total = 0\n    # Bug: Off-by-one and division by zero vulnerability\n    for i in range(len(scores) + 1):\n        total += scores[i]\n    return total / len(scores)\n\ngrades = [88, 92, 79, 95]\nprint("Average:", calculate_average(grades))`,
          isEntry: true,
        },
      ]);
      setOpenTabIds([newId]);
      setActiveFileId(newId);
      setProjectTitle('buggy_average');
      setShowConsole(true);
      setConsoleTab('ai');
      setAiSubTab('debug');
    } else if (sampleType === 'js_filter') {
      setProgLang('javascript');
      const newId = `f_js_${Date.now()}`;
      setFiles([
        {
          id: newId,
          name: 'index.js',
          content: `function filterEvenNumbers(numbers) {\n  const evens = [];\n  for (let i = 0; i < numbers.length; i++) {\n    if (numbers[i] % 2 === 0) {\n      evens.push(numbers[i]);\n    }\n  }\n  return evens;\n}\n\nconst nums = [1, 2, 3, 4, 5, 6, 7, 8];\nconsole.log("Even numbers:", filterEvenNumbers(nums));`,
          isEntry: true,
        },
      ]);
      setOpenTabIds([newId]);
      setActiveFileId(newId);
      setProjectTitle('filter_even');
    }
  };

  // Change programming language
  const handleLangChange = (key: string) => {
    setProgLang(key);
    setLangDropOpen(false);
    const ext = SUPPORTED_PROG_LANGUAGES.find((p) => p.key === key)?.extension || '.py';
    const snippet = SUPPORTED_PROG_LANGUAGES.find((p) => p.key === key)?.defaultSnippet || '';

    const newId = `f_${Date.now()}`;
    const mainFile: ProjectFile = {
      id: newId,
      name: key === 'javascript' ? 'index.js' : key === 'typescript' ? 'index.ts' : `main${ext}`,
      content: snippet,
      isEntry: true,
    };
    setFiles([mainFile]);
    setOpenTabIds([newId]);
    setActiveFileId(newId);
    setTerminalOutput(null);
  };

  // VS Code Smart Keyboard Handler
  const handleEditorKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const ta = e.currentTarget;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const val = ta.value;

    // 1. Ctrl+Enter / Cmd+Enter: Run Code immediately
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleExecute();
      return;
    }

    // 2. Skip-over closing characters — MUST BE CHECKED BEFORE AUTO-CLOSING!
    const closingChars = [')', ']', '}', '"', "'", '`'];
    if (closingChars.includes(e.key) && start === end && val[start] === e.key) {
      e.preventDefault();
      ta.selectionStart = ta.selectionEnd = start + 1;
      const currentLine = val.substring(0, start + 1).split('\n').length;
      setActiveCursorLine(currentLine);
      return;
    }

    // 3. Tab / Shift+Tab: Smart VS Code Indentation
    if (e.key === 'Tab') {
      e.preventDefault();
      if (e.shiftKey) {
        // Unindent selected lines or current line
        const lineStart = val.lastIndexOf('\n', start - 1) + 1;
        const lineEnd = val.indexOf('\n', end);
        const actualLineEnd = lineEnd === -1 ? val.length : lineEnd;
        const selectedBlock = val.substring(lineStart, actualLineEnd);
        let removedChars = 0;
        const unindented = selectedBlock
          .split('\n')
          .map((line) => {
            if (line.startsWith('    ')) {
              removedChars += 4;
              return line.substring(4);
            }
            const match = line.match(/^\s{1,3}/);
            if (match) {
              removedChars += match[0].length;
              return line.substring(match[0].length);
            }
            return line;
          })
          .join('\n');
        const newVal = val.substring(0, lineStart) + unindented + val.substring(actualLineEnd);
        const newStart = Math.max(lineStart, start - (selectedBlock.startsWith(' ') ? 4 : 0));
        const newEnd = Math.max(newStart, end - removedChars);
        updateCodeAndSelection(newVal, newStart, newEnd);
      } else {
        if (start !== end) {
          // Multiline indent
          const lineStart = val.lastIndexOf('\n', start - 1) + 1;
          const lineEnd = val.indexOf('\n', end);
          const actualLineEnd = lineEnd === -1 ? val.length : lineEnd;
          const selectedBlock = val.substring(lineStart, actualLineEnd);
          const lines = selectedBlock.split('\n');
          const indented = lines.map((line) => '    ' + line).join('\n');
          const addedChars = lines.length * 4;
          const newVal = val.substring(0, lineStart) + indented + val.substring(actualLineEnd);
          updateCodeAndSelection(newVal, start + 4, end + addedChars);
        } else {
          // Single cursor: insert 4 spaces
          const newVal = val.substring(0, start) + '    ' + val.substring(end);
          updateCodeAndSelection(newVal, start + 4);
        }
      }
      return;
    }

    // 4. Enter: Smart auto-indent after colon (:) or open brace ({) + bracket expansion
    if (e.key === 'Enter') {
      e.preventDefault();
      const currentLineStart = val.lastIndexOf('\n', start - 1) + 1;
      const currentLine = val.substring(currentLineStart, start);
      const matchIndent = currentLine.match(/^(\s*)/);
      let indent = matchIndent ? matchIndent[1] : '';

      const trimmedBefore = currentLine.trimEnd();
      if (
        trimmedBefore.endsWith(':') ||
        trimmedBefore.endsWith('{') ||
        trimmedBefore.endsWith('(') ||
        trimmedBefore.endsWith('[')
      ) {
        indent += '    ';
      }

      // Check if cursor is between matching pairs: {|} or (|) or [|]
      const charBefore = val[start - 1];
      const charAfter = val[start];
      const isBetweenBrackets =
        (charBefore === '{' && charAfter === '}') ||
        (charBefore === '(' && charAfter === ')') ||
        (charBefore === '[' && charAfter === ']');

      if (isBetweenBrackets) {
        const baseIndent = matchIndent ? matchIndent[1] : '';
        const newVal = val.substring(0, start) + '\n' + indent + '\n' + baseIndent + val.substring(end);
        updateCodeAndSelection(newVal, start + 1 + indent.length);
        return;
      }

      const newVal = val.substring(0, start) + '\n' + indent + val.substring(end);
      updateCodeAndSelection(newVal, start + 1 + indent.length);
      return;
    }

    // 5. Smart Backspace: Remove 4 spaces or delete matching empty pair () [] {} "" '' ``
    if (e.key === 'Backspace' && start === end && start > 0) {
      // Empty bracket/quote pair deletion
      const charBefore = val[start - 1];
      const charAfter = val[start];
      if (
        (charBefore === '(' && charAfter === ')') ||
        (charBefore === '[' && charAfter === ']') ||
        (charBefore === '{' && charAfter === '}') ||
        (charBefore === '"' && charAfter === '"') ||
        (charBefore === "'" && charAfter === "'") ||
        (charBefore === '`' && charAfter === '`')
      ) {
        e.preventDefault();
        const newVal = val.substring(0, start - 1) + val.substring(end + 1);
        updateCodeAndSelection(newVal, start - 1);
        return;
      }

      // 4-space indentation deletion
      if (start >= 4) {
        const preceding = val.substring(start - 4, start);
        const lineStart = val.lastIndexOf('\n', start - 1) + 1;
        const lineToCursor = val.substring(lineStart, start);
        if (preceding === '    ' && lineToCursor.trim() === '') {
          e.preventDefault();
          const newVal = val.substring(0, start - 4) + val.substring(end);
          updateCodeAndSelection(newVal, start - 4);
          return;
        }
      }
    }

    // 6. Auto-closing opening brackets: ( [ {
    const openBrackets: Record<string, string> = {
      '(': ')',
      '[': ']',
      '{': '}',
    };
    if (openBrackets[e.key]) {
      e.preventDefault();
      const closeChar = openBrackets[e.key];
      const selectedText = val.substring(start, end);
      const newVal = val.substring(0, start) + e.key + selectedText + closeChar + val.substring(end);
      updateCodeAndSelection(newVal, start + 1, end + 1);
      return;
    }

    // 7. Auto-closing quotes: " ' `
    if (['"', "'", '`'].includes(e.key)) {
      // If text is selected, wrap in quotes
      if (start !== end) {
        e.preventDefault();
        const selectedText = val.substring(start, end);
        const newVal = val.substring(0, start) + e.key + selectedText + e.key + val.substring(end);
        updateCodeAndSelection(newVal, start + 1, end + 1);
        return;
      }
      // If cursor is right before an alphanumeric char, do not auto-close (treat as normal key)
      const nextChar = val[start];
      if (nextChar && /[\w\d]/i.test(nextChar)) {
        return; // default browser behavior
      }
      // Otherwise auto-close pair
      e.preventDefault();
      const newVal = val.substring(0, start) + e.key + e.key + val.substring(end);
      updateCodeAndSelection(newVal, start + 1, start + 1);
      return;
    }
  };

  // 1. RUN CODE — Real Subprocess Execution with Multi-File support!
  const handleExecute = async () => {
    if (!code.trim() && files.length === 0) {
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

    const targetRunFile = entryFile || activeFile;

    try {
      const res = await fetch('/api/v1/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({
          files: filePayload,
          code: targetRunFile.content,
          activeFileName: targetRunFile.name,
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

  // 2. Explain Code (Deterministic Rule-Based)
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
    try {
      // Deterministic client-side execution + server sync
      const result = analyzeCodeRuleBased(code, progLang, nativeLang);
      setExplanation(result);

      if (token) {
        fetch('/api/v1/explain', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ code, programmingLanguage: progLang, nativeLanguage: nativeLang }),
        }).then(() => refreshUser()).catch(() => {});
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Explanation failed.');
    } finally {
      setLoadingAction(null);
    }
  };

  // 2b. Simple Logic Tool
  const handleSimpleLogic = () => {
    if (!code.trim()) {
      setErrorMessage('Please enter code first.');
      return;
    }
    setErrorMessage(null);
    setLoadingAction('simpleLogic');
    setShowConsole(true);
    setConsoleTab('ai');
    setAiSubTab('simpleLogic');
    try {
      const result = analyzeCodeRuleBased(code, progLang, nativeLang);
      setExplanation(result);
    } catch (err: any) {
      setErrorMessage(err.message || 'Logic analysis failed.');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleNativeLangChange = (newLang: NativeLanguageKey) => {
    setNativeLang(newLang);
    if (explanation && code.trim()) {
      try {
        const result = analyzeCodeRuleBased(code, progLang, newLang);
        setExplanation(result);
      } catch {}
    }
  };

  // 3. Debug & Fix (Deterministic Rule-Based)
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
      const result = debugCodeDeterministically(
        code,
        progLang,
        nativeLang,
        terminalOutput?.output || ''
      );
      setDebugResult(result);
    } catch (err: any) {
      setErrorMessage(err.message || 'Debug failed.');
    } finally {
      setLoadingAction(null);
    }
  };

  // 4. Convert Code (Deterministic Python <-> JS/TS and Native Pseudocode)
  const handleConvert = async () => {
    if (!code.trim()) {
      setErrorMessage('Please enter code first.');
      return;
    }
    setErrorMessage(null);
    setLoadingAction('convert');
    setShowConsole(true);
    setConsoleTab('ai');
    setAiSubTab('convert');
    try {
      const result = convertCodeDeterministically(
        code,
        progLang,
        convertTargetLang,
        nativeLang,
        convertMode
      );
      setConversionResult(result);
    } catch (err: any) {
      setErrorMessage(err.message || 'Conversion failed.');
    } finally {
      setLoadingAction(null);
    }
  };

  // 5. Ask Nexus Assistant (Deterministic Context-Aware Tutor)
  const handleAskAi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionInput.trim()) return;
    const q = questionInput.trim();
    setQuestionInput('');
    setChatMessages((prev) => [...prev, { sender: 'user', text: q }]);
    setAskingAi(true);
    try {
      const answer = askCodeDeterministically(code, q, progLang, nativeLang);
      setChatMessages((prev) => [...prev, { sender: 'ai', text: answer }]);
    } catch (err: any) {
      setChatMessages((prev) => [...prev, { sender: 'ai', text: 'Error generating response.' }]);
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

  const lineCount = code.split('\n').length;
  const currentLang = SUPPORTED_PROG_LANGUAGES.find((p) => p.key === progLang);
  const currentNative = SUPPORTED_NATIVE_LANGUAGES.find((l) => l.key === nativeLang);
  const langColor = LANG_COLORS[progLang] || '#888';
  const langIcon = LANG_ICONS[progLang] || progLang.slice(0, 2).toUpperCase();

  return (
    <div className="flex-1 flex flex-col min-h-0 h-full bg-[#0d1117] text-white overflow-hidden select-text">
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
              <LanguageIcon language={progLang} width={18} height={18} />
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
                    <LanguageIcon language={l.key} width={18} height={18} />
                    {l.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Side Menu Toggle Button */}
          <button
            onClick={() => setShowFileExplorer((v) => !v)}
            title={showFileExplorer ? 'Hide Side Menu (Ctrl+B) to expand editors' : 'Show Side Menu (Ctrl+B)'}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 border rounded-md text-xs font-semibold transition-colors ${showFileExplorer ? 'bg-blue-600/25 border-blue-500/60 text-blue-300' : 'bg-[#21262d] border-[#30363d] text-slate-400 hover:text-white hover:bg-[#30363d]'}`}
          >
            {showFileExplorer ? <PanelLeftClose className="w-3.5 h-3.5 text-blue-400" /> : <PanelLeft className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{showFileExplorer ? 'Hide Menu' : 'Side Menu'}</span>
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
            <option value="count_number">Count Occurrences (Python)</option>
            <option value="binary_search">Binary Search (Python)</option>
            <option value="buggy_loop">Buggy Loop (Debug AI)</option>
            <option value="js_filter">Filter Evens (JavaScript)</option>
          </select>
        </div>

        {/* Center: BIG GREEN RUN BUTTON WITH ENTRYPOINT BADGE */}
        <button
          onClick={handleExecute}
          disabled={!!loadingAction}
          title={`Run ${entryFile.name} (Ctrl+Enter)`}
          className="flex items-center gap-2 px-5 py-1.5 bg-[#238636] hover:bg-[#2ea043] disabled:opacity-50 text-white font-bold text-xs sm:text-sm rounded-md transition-all shadow-md shadow-green-950/40 active:scale-95 shrink-0"
        >
          {loadingAction === 'execute' ? (
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Play className="w-4 h-4 fill-white" />
          )}
          <span>{loadingAction === 'execute' ? 'Running...' : `Run ${entryFile.name}`}</span>
        </button>

        {/* Right: 3-Way Dual Split Toggle + Console + Save */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Dual Split 3-Segment Switcher (Visible & Responsive across screen sizes) */}
          <div className="flex items-center bg-[#21262d] border border-[#30363d] rounded-md p-0.5 text-xs">
            <button
              onClick={() => {
                setViewLayout('english');
                setMobileView('english');
              }}
              title="Show Source Code Only"
              className={`px-2 py-1 rounded font-medium flex items-center gap-1 transition-colors ${viewLayout === 'english' ? 'bg-[#30363d] text-white font-bold' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <FileCode className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden sm:inline">Source</span>
            </button>
            <button
              onClick={() => {
                setViewLayout('split');
              }}
              title="Dual Split View (Source + Visual Blueprint)"
              className={`px-2 py-1 rounded font-medium flex items-center gap-1 transition-colors ${viewLayout === 'split' ? 'bg-[#30363d] text-white font-bold' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <Columns className="w-3.5 h-3.5 text-emerald-400" />
              <span>Dual Split</span>
            </button>
            <button
              onClick={() => {
                setViewLayout('native');
                setMobileView('native');
              }}
              title="Show Visual Blueprint Only"
              className={`px-2 py-1 rounded font-medium flex items-center gap-1 transition-colors ${viewLayout === 'native' ? 'bg-[#30363d] text-white font-bold' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Blueprint</span>
            </button>
          </div>

          {/* Console Toggle Button */}
          <button
            onClick={() => setShowConsole((v) => !v)}
            title="Toggle Terminal Console"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors border ${showConsole ? 'bg-blue-600 border-blue-500 text-white' : 'bg-[#21262d] border-[#30363d] text-slate-300 hover:bg-[#30363d]'}`}
          >
            <Icon icon="flat-color-icons:command-line" width={16} height={16} className="shrink-0" />
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

      {/* ─── MOBILE VIEW SWITCHER (Visible on Mobile < 768px) ── */}
      <div className="flex md:hidden items-center bg-[#161b22] border-b border-[#30363d] px-2 py-1 gap-1 text-xs overflow-x-auto shrink-0">
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
          className={`px-3 py-1 rounded-md font-medium flex items-center gap-1.5 transition-colors ${mobileView === 'english' && viewLayout === 'english' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
        >
          <FileCode className="w-3.5 h-3.5 text-blue-400" />
          <span>Source Code</span>
        </button>
        <button
          onClick={() => {
            setMobileView('native');
            setViewLayout('native');
          }}
          className={`px-3 py-1 rounded-md font-medium flex items-center gap-1.5 transition-colors ${mobileView === 'native' && viewLayout === 'native' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
        >
          <LayoutDashboard className="w-3.5 h-3.5 text-emerald-400" />
          <span>Visual Blueprint</span>
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
      <div className={`flex flex-1 min-h-0 overflow-hidden relative ${isDraggingSplit ? 'select-none pointer-events-none' : ''}`}>
        {/* ══ 1. FILE EXPLORER & NEXUS TOOLS SIDEBAR ══ */}
        {(showFileExplorer || mobileView === 'files') && (
          <div
            className={`${
              mobileView === 'files'
                ? 'flex w-full'
                : windowWidth >= 768
                  ? 'flex w-64 lg:w-72'
                  : 'hidden'
            } flex-col shrink-0 bg-[#0d1117] border-r border-[#30363d] overflow-y-auto`}
          >
            {/* Section A: File Management */}
            <div className="p-3 border-b border-[#30363d]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <Icon icon="vscode-icons:default-folder" width={16} height={16} className="shrink-0" /> Project Files
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setIsCreatingFile(true)}
                    className="flex items-center gap-1 text-[11px] bg-blue-600 hover:bg-blue-500 text-white font-semibold px-2 py-0.5 rounded transition-colors"
                    title="Add new file"
                  >
                    <Plus className="w-3 h-3" /> New
                  </button>
                  <button
                    onClick={() => setShowFileExplorer(false)}
                    className="p-1 text-slate-400 hover:text-white hover:bg-[#21262d] rounded transition-colors"
                    title="Hide Side Menu (Ctrl+B) to expand editors"
                  >
                    <PanelLeftClose className="w-3.5 h-3.5" />
                  </button>
                </div>
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
                    onClick={() => handleOpenFile(file.id)}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <FileIcon filename={file.name} width={16} height={16} />
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
                          onClick={(e) => handleSetEntrypoint(file.id, e)}
                          title="Set as main entrypoint"
                          className="p-1 text-slate-400 hover:text-amber-400 transition-colors"
                        >
                          <Star className="w-3 h-3" />
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
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
                          onClick={(e) => handleDeleteFile(file.id, e)}
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

            {/* Section B: Real Multi-File Module Imports */}
            <div className="p-3 border-b border-[#30363d] bg-[#161b22]/40">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <ArrowRight className="w-3 h-3 text-emerald-400" /> Module Imports
                </span>
                <span className="text-[9px] font-mono text-slate-500">{moduleImports.length} detected</span>
              </div>

              {/* Circular import alerts */}
              {circularImports.length > 0 && (
                <div className="mb-2 p-1.5 bg-rose-950/60 border border-rose-500/40 rounded text-[10px] text-rose-300 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 shrink-0 text-rose-400" />
                  <span>
                    Circular import: {circularImports[0].fileA} ↔ {circularImports[0].fileB}
                  </span>
                </div>
              )}

              {moduleImports.length > 0 ? (
                <div className="space-y-1.5">
                  {moduleImports.map((rel, idx) => (
                    <div
                      key={idx}
                      onClick={() => {
                        if (rel.targetFile) {
                          handleOpenFile(rel.targetFile.id);
                        }
                      }}
                      className={`bg-[#0d1117] border p-2 rounded text-[11px] font-mono transition-colors ${rel.isLocal ? 'border-[#30363d] hover:border-blue-500/60 cursor-pointer hover:bg-[#161b22]' : 'border-[#30363d]'}`}
                      title={rel.isLocal ? `Click to open ${rel.moduleName}` : `Import from ${rel.moduleName}`}
                    >
                      <div className="text-slate-400 flex items-center justify-between">
                        <span className="font-semibold text-slate-200">
                          {rel.fromFile} → {rel.moduleName}
                        </span>
                        {rel.isLocal ? (
                          <span className="text-[9px] text-emerald-400 bg-emerald-950/60 px-1 rounded flex items-center gap-0.5">
                            <Check className="w-2.5 h-2.5" /> Local
                          </span>
                        ) : rel.missingFile ? (
                          <span className="text-[9px] text-rose-400 bg-rose-950/60 px-1 rounded flex items-center gap-0.5">
                            Missing File
                          </span>
                        ) : (
                          <span className="text-[9px] text-amber-400 bg-amber-950/60 px-1 rounded">Package</span>
                        )}
                      </div>

                      {/* Missing file explanation */}
                      {rel.missingFile && (
                        <div className="text-[10px] text-rose-400 mt-1 font-sans">
                          ⚠️ '{rel.moduleName}.py' not found in workspace.
                        </div>
                      )}

                      {/* Missing symbols in local file */}
                      {rel.missingSymbols.length > 0 && (
                        <div className="text-[10px] text-amber-400 mt-1 font-sans">
                          ⚠️ Missing in {rel.targetFile?.name}: {rel.missingSymbols.join(', ')}
                        </div>
                      )}

                      {/* Translated symbol preview */}
                      <div className="mt-1 text-emerald-300 font-sans text-xs flex flex-wrap gap-1">
                        {rel.importedSymbols.map((sym, sIdx) => (
                          <span key={sIdx} className="inline-block bg-[#161b22] px-1 rounded text-[11px]">
                            {sym} <span className="text-slate-500">→</span> <span className="font-bold">{rel.translatedSymbols[sIdx]}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-[10px] text-slate-500 font-sans py-1">
                  No local or external imports in current files. Type e.g. <code className="text-blue-400">from utils import add</code> to link files.
                </div>
              )}
            </div>

            {/* Section C: Nexus Tools */}
            <div className="p-3 border-b border-[#30363d]">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-2">
                Visual Analysis Tools
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
                    action: handleSimpleLogic,
                    loading: 'simpleLogic',
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
                    action: handleConvert,
                    loading: 'convert',
                  },
                  {
                    icon: <MessageSquare className="w-4 h-4 text-purple-400" />,
                    label: 'Ask AI Assistant',
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
                <Zap className="w-3.5 h-3.5 shrink-0" /> Visual Blueprint Active
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5 leading-snug">
                Real-Time Code Map & Annotations
              </div>
            </div>
          </div>
        )}

        {/* ══ 2. CENTRAL EDITORS & TABS AREA ══ */}
        {(mobileView !== 'files' || windowWidth >= 768) && (
          <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">
            {/* Editor File Tabs Bar (VS Code Style) */}
            <div className="flex items-center bg-[#161b22] border-b border-[#30363d] px-2 overflow-x-auto no-scrollbar shrink-0">
              {!showFileExplorer && (
                <button
                  onClick={() => setShowFileExplorer(true)}
                  title="Show Side Menu (Ctrl+B)"
                  className="hidden md:flex items-center gap-1.5 px-2 py-1 mr-2 text-xs text-blue-400 hover:text-blue-300 bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] rounded transition-colors shrink-0"
                >
                  <PanelLeft className="w-3.5 h-3.5" />
                  <span className="text-[11px] font-semibold">Side Menu</span>
                </button>
              )}
              <div className="flex items-center gap-1 py-1">
                {openTabIds.map((tabId) => {
                  const file = files.find((f) => f.id === tabId);
                  if (!file) return null;
                  return (
                    <div
                      key={file.id}
                      onClick={() => setActiveFileId(file.id)}
                      className={`group flex items-center gap-2 px-3 py-1.5 text-xs font-mono rounded-t-md border-t-2 cursor-pointer transition-colors ${file.id === activeFile.id ? 'bg-[#1e1e1e] border-blue-500 text-white font-bold' : 'bg-[#161b22] border-transparent text-slate-400 hover:text-slate-200 hover:bg-[#21262d]'}`}
                    >
                      <FileIcon filename={file.name} width={16} height={16} />
                      <span>{file.name}</span>
                      {file.isEntry && (
                        <span className="text-[8px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1 rounded font-sans uppercase">
                          Entry
                        </span>
                      )}
                      <button
                        onClick={(e) => handleCloseTab(file.id, e)}
                        className="opacity-60 group-hover:opacity-100 hover:text-rose-400 p-0.5 rounded transition-opacity"
                        title="Close tab"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}
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
            <div ref={splitContainerRef} className="flex-1 flex min-h-0 overflow-hidden relative">
              {/* ────── LEFT PANE: SOURCE CODE EDITOR ────── */}
              <div
                style={{
                  width: viewLayout === 'split' ? `${splitPercent}%` : '100%',
                  display: viewLayout === 'native' ? 'none' : 'flex',
                }}
                className="flex flex-col min-w-0 min-h-0 overflow-hidden bg-[#1e1e1e]"
              >
                {/* Left Pane Header */}
                <div className="flex items-center justify-between px-3 py-2 bg-[#161b22] border-b border-[#30363d] text-xs shrink-0">
                  <div className="flex items-center gap-2">
                    <FileIcon filename={activeFile.name} width={15} height={15} />
                    <span className="font-semibold text-slate-200">
                      {activeFile.name} {activeFile.isEntry ? '(Main Entry)' : ''}
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
                <div className="flex-1 flex min-h-0 overflow-hidden relative bg-[#1e1e1e]">
                  {/* Line numbers column */}
                  <div
                    ref={lineNumbersRef}
                    className="select-none bg-[#1e1e1e] text-[#858585] text-right pr-4 pl-3 shrink-0 border-r border-[#30363d]/50 overflow-hidden"
                    style={{
                      minWidth: '50px',
                      fontFamily: VSCODE_MONO_FONT,
                      fontSize: '14px',
                      lineHeight: '26px',
                      paddingTop: '14px',
                      paddingBottom: '14px',
                      boxSizing: 'border-box',
                    }}
                  >
                    {Array.from({ length: Math.max(lineCount, 25) }).map((_, i) => (
                      <div
                        key={i}
                        onClick={() => {
                          setHighlightedLine(i + 1);
                          setActiveCursorLine(i + 1);
                        }}
                        style={{ height: '26px', lineHeight: '26px' }}
                        className={`cursor-pointer hover:text-slate-200 transition-colors ${
                          (highlightedLine === i + 1 || activeCursorLine === i + 1)
                            ? 'text-[#ffffff] font-bold'
                            : ''
                        }`}
                      >
                        {i + 1}
                      </div>
                    ))}
                  </div>

                  {/* Editor Layers with Independent Scrolling */}
                  <div className="flex-1 relative min-h-0 overflow-hidden bg-[#1e1e1e]">
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
                        <HighlightedCodeBlock
                          code={code}
                          highlightedLine={highlightedLine || activeCursorLine}
                        />
                      </div>
                    )}

                    <textarea
                      ref={englishEditorRef}
                      value={code}
                      onChange={(e) => {
                        handleCodeChange(e.target.value);
                        handleEditorSelect();
                      }}
                      onScroll={handleEnglishScroll}
                      onKeyDown={handleEditorKeyDown}
                      onSelect={handleEditorSelect}
                      onClick={handleEditorSelect}
                      onKeyUp={handleEditorSelect}
                      placeholder="// Type or paste your code here..."
                      spellCheck={false}
                      autoCorrect="off"
                      autoCapitalize="off"
                      autoComplete="off"
                      data-gramm="false"
                      data-gramm_editor="false"
                      data-enable-grammarly="false"
                      style={{
                        ...CODE_EDITOR_SHARED_STYLE,
                        position: 'absolute',
                        inset: 0,
                        background: 'transparent',
                        /* Always keep text visible — only make it transparent when overlay is ON */
                        color: syntaxOverlay ? 'transparent' : '#e6edf3',
                        /* VS Code white caret — always visible regardless of text color */
                        caretColor: '#aeafad',
                        outline: 'none',
                        resize: 'none',
                        overflow: 'auto',
                        overscrollBehavior: 'none',
                        zIndex: 10,
                        /* Prevent browser from adding its own cursor/selection artifacts */
                        cursor: 'text',
                        /* Smooth rendering — no subpixel shifts when scrolling */
                        willChange: 'scroll-position',
                      }}
                      className="selection:bg-[#264f78]/60 selection:text-transparent"
                    />
                  </div>

                  {/* ─── VISUAL ARROW CONNECTOR RAIL (Exact matching code lines ONLY) ─── */}
                  <div
                    ref={arrowsRailRef}
                    className="select-none bg-[#1e1e1e] border-l border-[#30363d]/50 shrink-0 overflow-hidden flex flex-col items-center z-10"
                    style={{
                      width: '44px',
                      paddingTop: '14px',
                      paddingBottom: '14px',
                      boxSizing: 'border-box',
                    }}
                  >
                    {visualBlueprint.lines.map((bLine, i) => {
                      const isCurrent = (highlightedLine === bLine.lineNumber || activeCursorLine === bLine.lineNumber);
                      return (
                        <div
                          key={i}
                          style={{ height: '26px', lineHeight: '26px' }}
                          className="flex items-center justify-center w-full"
                        >
                          {bLine.hasArrow ? (
                            <button
                              type="button"
                              onClick={() => jumpToLine(bLine.lineNumber)}
                              className={`flex items-center justify-center cursor-pointer transition-all ${
                                isCurrent
                                  ? 'scale-115'
                                  : 'text-slate-500 hover:text-slate-200'
                              }`}
                              style={{
                                color: isCurrent ? bLine.colorScheme.accent : undefined,
                                filter: isCurrent ? `drop-shadow(0 0 6px ${bLine.colorScheme.accent})` : undefined,
                              }}
                              title={`Line ${bLine.lineNumber} -> Click to inspect explanation`}
                            >
                              <svg
                                width="26"
                                height="14"
                                viewBox="0 0 26 14"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <line x1="2" y1="7" x2="22" y2="7" />
                                <polyline points="15 2 22 7 15 12" />
                              </svg>
                            </button>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Central Draggable Split Divider in Dual Split View */}
              {viewLayout === 'split' && (
                <div
                  onMouseDown={handleSplitMouseDown}
                  onTouchStart={handleSplitMouseDown}
                  className="w-[6px] hover:w-[8px] bg-[#161b22] hover:bg-blue-500/80 border-x border-[#30363d] flex flex-col items-center justify-center cursor-col-resize transition-all shrink-0 group relative z-20 select-none"
                  title="Drag to resize split panels"
                >
                  <div className="w-1 h-8 rounded-full bg-slate-600 group-hover:bg-blue-300 transition-colors" />
                </div>
              )}

              {/* ────── RIGHT PANE: VISUAL CODE BLUEPRINT & ANNOTATIONS ────── */}
              <div
                style={{
                  width: viewLayout === 'split' ? `${100 - splitPercent}%` : '100%',
                  display: viewLayout === 'english' ? 'none' : 'flex',
                }}
                className="flex flex-col min-w-0 min-h-0 overflow-hidden bg-[#0d1117] border-l border-[#30363d]"
              >
                {/* Right Header */}
                <div className="flex items-center justify-between px-3 py-2 bg-[#161b22] border-b border-[#30363d] text-xs shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="font-semibold text-emerald-400">
                      Visual Blueprint & Line Explanations
                    </span>
                    <span className="text-[10px] bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 px-1.5 py-0.2 rounded font-mono">
                      {visualBlueprint.totalCodeLines} Code Lines Mapped
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* View Switcher: Aligned Line Blueprint | Architecture Blocks | Pseudocode */}
                    <div className="flex bg-[#21262d] border border-[#30363d] rounded text-[10px] font-medium overflow-hidden">
                      <button
                        onClick={() => setBlueprintMode('aligned')}
                        className={`px-2 py-0.5 flex items-center gap-1 transition-colors ${blueprintMode === 'aligned' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
                        title="Line-by-line arrows aligned with editor"
                      >
                        <Icon icon="flat-color-icons:flow-chart" width={13} height={13} className="shrink-0" />
                        <span>Line Blueprint</span>
                      </button>
                      <button
                        onClick={() => setBlueprintMode('blocks')}
                        className={`px-2 py-0.5 flex items-center gap-1 transition-colors ${blueprintMode === 'blocks' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
                        title="Grouped architectural blocks like Excalidraw"
                      >
                        <Icon icon="flat-color-icons:mind-map" width={13} height={13} className="shrink-0" />
                        <span>Architecture Blocks</span>
                      </button>
                      <button
                        onClick={() => setBlueprintMode('code')}
                        className={`px-2 py-0.5 flex items-center gap-1 transition-colors ${blueprintMode === 'code' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
                        title="Pure pseudocode representation"
                      >
                        <Icon icon="flat-color-icons:document" width={13} height={13} className="shrink-0" />
                        <span>Pseudocode</span>
                      </button>
                    </div>

                    <button
                      onClick={handleCopyNative}
                      title="Copy Blueprint"
                      className="p-1 text-slate-400 hover:text-white hover:bg-[#21262d] rounded transition-colors"
                    >
                      {copiedNative ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() =>
                        handleDownload(nativeTranslation.translatedCode, `${activeFile.name}_blueprint.txt`)
                      }
                      title="Download Blueprint"
                      className="p-1 text-slate-400 hover:text-white hover:bg-[#21262d] rounded transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Right Body Display with Independent Scrolling & Synchronized Alignment */}
                <div className="flex-1 flex min-h-0 overflow-hidden relative bg-[#1e1e1e]">
                  {blueprintMode === 'aligned' ? (
                    <>
                      {/* Line Numbers aligned with Left Editor */}
                      <div
                        ref={nativeLineNumbersRef}
                        className="select-none bg-[#1e1e1e] text-[#858585] text-right pr-4 pl-3 shrink-0 border-r border-[#30363d]/50 overflow-hidden"
                        style={{
                          minWidth: '50px',
                          fontFamily: VSCODE_MONO_FONT,
                          fontSize: '14px',
                          lineHeight: '26px',
                          paddingTop: '14px',
                          paddingBottom: '14px',
                          boxSizing: 'border-box',
                        }}
                      >
                        {Array.from({ length: Math.max(visualBlueprint.lines.length, 25) }).map(
                          (_, i) => (
                            <div
                              key={i}
                              style={{ height: '26px', lineHeight: '26px' }}
                              className={`cursor-default ${
                                (highlightedLine === i + 1 || activeCursorLine === i + 1)
                                  ? 'text-[#ffffff] font-bold'
                                  : ''
                              }`}
                            >
                              {i + 1}
                            </div>
                          )
                        )}
                      </div>

                      {/* Line-by-Line Visual Explanations with exact 26px height alignment */}
                      <div
                        ref={nativeViewerRef}
                        onScroll={handleNativeScroll}
                        style={{
                          position: 'absolute',
                          inset: 0,
                          left: '50px',
                          overflow: 'auto',
                          paddingTop: '14px',
                          paddingBottom: '14px',
                          boxSizing: 'border-box',
                          fontFamily: VSCODE_MONO_FONT,
                        }}
                        className="no-scrollbar"
                      >
                        {visualBlueprint.lines.map((bLine, i) => {
                          const isCurrent = (highlightedLine === bLine.lineNumber || activeCursorLine === bLine.lineNumber);
                          if (!bLine.hasArrow) {
                            return (
                              <div
                                key={i}
                                style={{ height: '26px', lineHeight: '26px' }}
                                className="w-full select-none"
                              />
                            );
                          }
                          return (
                            <div
                              key={i}
                              onClick={() => jumpToLine(bLine.lineNumber)}
                              style={{ height: '26px', lineHeight: '26px' }}
                              className={`group flex items-center gap-2 px-2.5 w-full cursor-pointer transition-all rounded-[3px] border ${
                                isCurrent
                                  ? 'bg-[#1e293b] border-blue-500/60 shadow-xs'
                                  : 'border-transparent hover:bg-[#252b36]'
                              }`}
                            >
                              <BlueprintIcon
                                name={bLine.icon}
                                withContainer
                                className="w-3.5 h-3.5"
                              />
                              <span
                                className={`px-1.5 py-0.2 rounded text-[10px] font-semibold uppercase tracking-wider shrink-0 border ${bLine.colorScheme.badgeBg} ${bLine.colorScheme.badgeText} ${bLine.colorScheme.border}`}
                              >
                                {bLine.badge}
                              </span>
                              <span className="text-slate-500 text-xs shrink-0 select-none">──&gt;</span>
                              <span
                                className={`text-[13px] font-medium truncate ${
                                  isCurrent ? 'text-white font-semibold' : 'text-slate-200 group-hover:text-white'
                                }`}
                              >
                                {bLine.title}
                              </span>
                              <span className="text-slate-400 text-[11.5px] truncate hidden md:inline group-hover:text-slate-300">
                                — {bLine.detail}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  ) : blueprintMode === 'blocks' ? (
                    /* ─── ARCHITECTURE BLOCKS VIEW (Grouped semantic cards like Excalidraw) ─── */
                    <div className="flex-1 p-4 overflow-y-auto space-y-6">
                      {visualBlueprint.groups.map((group, gIdx) => (
                        <div
                          key={gIdx}
                          className="bg-[#161b22] rounded-lg border border-[#30363d] p-4 shadow-sm"
                        >
                          {/* Group Header */}
                          <div className="flex items-center gap-2.5 border-b border-[#30363d]/80 pb-2.5 mb-3">
                            <BlueprintIcon
                              name={group.icon}
                              withContainer
                              className="w-4 h-4"
                            />
                            <h3 className="text-sm font-bold text-white tracking-tight">
                              {group.groupTitle}
                            </h3>
                            <span className="text-[10px] bg-blue-500/10 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded-full font-mono ml-auto">
                              {group.lines.length} components
                            </span>
                          </div>

                          {/* Group Items */}
                          <div className="space-y-2">
                            {group.lines.map((item, itIdx) => (
                              <div
                                key={itIdx}
                                onClick={() => jumpToLine(item.lineNumber)}
                                className={`p-2.5 rounded-md border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                                  activeCursorLine === item.lineNumber
                                    ? 'bg-[#1e293b] border-blue-500 shadow-xs'
                                    : 'bg-[#0d1117]/60 border-[#30363d]/60 hover:border-slate-500'
                                }`}
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className="text-xs font-mono text-slate-500 shrink-0">
                                    L{item.lineNumber}
                                  </span>
                                  <code className="text-xs font-mono text-emerald-300 bg-[#1e1e1e] px-2 py-1 rounded border border-[#30363d] truncate max-w-[200px]">
                                    {item.rawText}
                                  </code>
                                  <span className="text-slate-400 font-bold shrink-0">──&gt;</span>
                                  <BlueprintIcon
                                    name={item.icon}
                                    withContainer
                                    className="w-3.5 h-3.5"
                                  />
                                  <span className="text-xs font-semibold text-slate-200">
                                    {item.title}
                                  </span>
                                </div>
                                <span className="text-xs text-slate-400 truncate max-w-[340px]">
                                  {item.detail}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    /* ─── PSEUDOCODE / CODE VIEW ─── */
                    <>
                      <div
                        ref={nativeLineNumbersRef}
                        className="select-none bg-[#1e1e1e] text-[#858585] text-right pr-4 pl-3 shrink-0 border-r border-[#30363d]/50 overflow-hidden"
                        style={{
                          minWidth: '50px',
                          fontFamily: VSCODE_MONO_FONT,
                          fontSize: '14px',
                          lineHeight: '26px',
                          paddingTop: '14px',
                          paddingBottom: '14px',
                          boxSizing: 'border-box',
                        }}
                      >
                        {Array.from({ length: Math.max(nativeTranslation.translatedCode.split('\n').length, 25) }).map(
                          (_, i) => (
                            <div
                              key={i}
                              style={{ height: '26px', lineHeight: '26px' }}
                              className={`cursor-default ${
                                (highlightedLine === i + 1 || activeCursorLine === i + 1)
                                  ? 'text-[#ffffff] font-bold'
                                  : ''
                              }`}
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
                          left: '50px',
                          overflow: 'auto',
                        }}
                      >
                        <HighlightedCodeBlock
                          code={nativeTranslation.translatedCode}
                          highlightedLine={highlightedLine || activeCursorLine}
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ─── BOTTOM CONSOLE & AI INSIGHTS DRAWER (RESIZABLE) ─────────────────────── */}
      {showConsole && (
        <div
          style={{ height: consoleMaximized ? '85vh' : `${consoleHeight}px` }}
          className="border-t border-[#30363d] bg-[#161b22] shrink-0 flex flex-col relative z-30 transition-all duration-75"
        >
          {/* Draggable Top Resize Handle */}
          <div
            onMouseDown={handleConsoleResizeStart}
            onTouchStart={handleConsoleResizeStart}
            className="h-1.5 w-full bg-[#30363d] hover:bg-blue-500/80 cursor-row-resize flex items-center justify-center transition-colors group select-none"
            title="Drag up or down to resize console"
          >
            <div className="w-12 h-0.5 rounded-full bg-slate-500 group-hover:bg-white" />
          </div>

          {/* Console Header */}
          <div className="flex items-center justify-between px-3 py-1.5 bg-[#161b22] border-b border-[#30363d] text-xs shrink-0">
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
                <div className="flex gap-2 border-b border-[#21262d] pb-2 mb-3 text-xs overflow-x-auto">
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
                      className={`px-2.5 py-1 rounded text-xs transition-colors shrink-0 ${aiSubTab === sub.key ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
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
                              <div className="font-mono text-blue-300 font-bold mb-1 flex items-center justify-between">
                                <span>Line {line.lineNumber}: {line.codeSnippet}</span>
                                <span className="text-[10px] text-slate-500 uppercase">{line.category}</span>
                              </div>
                              <div className="text-slate-300">{line.explanation || line.simpleMeaning}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-6 text-slate-400">
                        Click "Explain Code" in the sidebar to generate a line-by-line explanation in {currentNative?.native}.
                      </div>
                    )}
                  </div>
                )}

                {/* Sub-tab 2: Simple Logic */}
                {aiSubTab === 'simpleLogic' && (
                  <div>
                    {explanation?.simpleLogicSummary ? (
                      <div className="space-y-3">
                        <div className="p-3 bg-[#161b22] border border-[#30363d] rounded-lg">
                          <div className="font-bold text-amber-400 text-xs mb-1">Logic Summary:</div>
                          <p className="text-sm text-slate-200">{explanation.simpleLogicSummary}</p>
                        </div>
                        {explanation.executionFlow && explanation.executionFlow.length > 0 && (
                          <div className="p-3 bg-[#161b22] border border-[#30363d] rounded-lg">
                            <div className="font-bold text-blue-400 text-xs mb-2">Execution Flow:</div>
                            <div className="space-y-1.5">
                              {explanation.executionFlow.map((step, i) => (
                                <div key={i} className="text-xs text-slate-300 flex items-start gap-2">
                                  <span className="w-5 h-5 rounded-full bg-blue-600/30 text-blue-300 flex items-center justify-center text-[10px] shrink-0 font-bold">
                                    {i + 1}
                                  </span>
                                  <span>{step}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-6 text-slate-400">
                        Click "Simple Logic" in the sidebar to generate an intuitive plain-language summary.
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
                          <p className="text-sm text-slate-200">{debugResult.summary}</p>
                        </div>

                        {debugResult.lineDiffs && debugResult.lineDiffs.length > 0 && (
                          <div className="space-y-1.5">
                            {debugResult.lineDiffs.map((diff, i) => (
                              <div key={i} className="p-2 bg-[#161b22] border border-[#30363d] rounded text-xs">
                                <div className="text-rose-400 font-bold mb-0.5">Line {diff.lineNumber}: {diff.issue}</div>
                                <div className="text-emerald-300 font-mono text-[11px]">Fix: {diff.correction}</div>
                              </div>
                            ))}
                          </div>
                        )}

                        {debugResult.correctedCode && (
                          <div className="p-3 bg-[#161b22] border border-[#30363d] rounded-lg">
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="font-bold text-emerald-400 text-xs">Suggested Working Fix:</span>
                              <button
                                onClick={() => handleCodeChange(debugResult.correctedCode)}
                                className="text-[10px] bg-emerald-600 hover:bg-emerald-500 text-white px-2 py-0.5 rounded font-bold transition-colors"
                              >
                                Apply Fix to Editor
                              </button>
                            </div>
                            <pre className="font-mono text-xs text-emerald-300 whitespace-pre-wrap">{debugResult.correctedCode}</pre>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-6 text-slate-400">
                        Click "Debug & Fix" in the sidebar to inspect code for syntax or boundary bugs.
                      </div>
                    )}
                  </div>
                )}

                {/* Sub-tab 4: Convert */}
                {aiSubTab === 'convert' && (
                  <div>
                    <div className="flex flex-wrap items-center gap-3 mb-3">
                      <select
                        value={convertTargetLang}
                        onChange={(e) => setConvertTargetLang(e.target.value)}
                        className="bg-[#161b22] border border-[#30363d] rounded px-2.5 py-1 text-xs text-white outline-none cursor-pointer"
                      >
                        <option value="javascript">JavaScript</option>
                        <option value="python">Python</option>
                        <option value="typescript">TypeScript</option>
                      </select>
                      <select
                        value={convertMode}
                        onChange={(e) => setConvertMode(e.target.value as any)}
                        className="bg-[#161b22] border border-[#30363d] rounded px-2.5 py-1 text-xs text-white outline-none cursor-pointer"
                      >
                        <option value="programming_language">Convert to Target Language</option>
                        <option value="native_pseudocode">Convert to Native Pseudocode</option>
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
                        <div className="text-xs text-slate-300 mb-2">{conversionResult.explanation}</div>
                        <pre className="font-mono text-xs text-indigo-300 whitespace-pre-wrap">{conversionResult.convertedCode}</pre>
                      </div>
                    )}
                  </div>
                )}

                {/* Sub-tab 5: Ask AI Assistant */}
                {aiSubTab === 'ask' && (
                  <div className="flex flex-col h-56">
                    <div className="flex-1 overflow-y-auto space-y-2 mb-2 pr-1">
                      {chatMessages.map((msg, i) => (
                        <div
                          key={i}
                          className={`p-2.5 rounded-lg text-xs leading-relaxed whitespace-pre-wrap ${msg.sender === 'user' ? 'bg-blue-600/30 border border-blue-500/40 ml-8 text-white' : 'bg-[#161b22] border border-[#30363d] mr-8 text-slate-200'}`}
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
                        placeholder="Ask anything about this code (e.g. time complexity, line 2)..."
                        className="flex-1 bg-[#161b22] border border-[#30363d] rounded px-3 py-1 text-xs text-white outline-none focus:border-blue-500 font-sans"
                      />
                      <button
                        type="submit"
                        disabled={askingAi}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded text-xs font-bold transition-colors"
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
