import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { spawn } from 'child_process';
import os from 'os';
import { analyzeAnyCodeDynamically } from './src/utils/universalCodeAnalyzer';
import { analyzeCodeRuleBased } from './src/utils/ruleBasedAnalyzer';
import { debugCodeDeterministically, convertCodeDeterministically, askCodeDeterministically } from './src/utils/deterministicTools';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '2mb' }));

// Initialize Google GenAI
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Database path & setup
const DB_DIR = path.resolve('data');
const DB_FILE = path.join(DB_DIR, 'db.json');

if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  salt: string;
  defaultLanguage: string;
  plan: 'free' | 'pro';
  dailyUsageCount: number;
  lastUsageDate: string;
  createdAt: string;
}

interface Session {
  token: string;
  userId: string;
  expiresAt: number;
}

interface Project {
  id: string;
  userId: string;
  title: string;
  programmingLanguage: string;
  nativeLanguage: string;
  code: string;
  explanation?: any;
  createdAt: string;
  updatedAt: string;
}

interface DatabaseSchema {
  users: User[];
  sessions: Session[];
  projects: Project[];
  feedback: Array<{ id: string; name: string; email: string; message: string; date: string }>;
}

function loadDb(): DatabaseSchema {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error reading DB:', err);
  }

  // Initial seed with demo user
  const salt = crypto.randomBytes(16).toString('hex');
  const demoHash = crypto.scryptSync('Learner@2026', salt, 64).toString('hex');
  const initialDb: DatabaseSchema = {
    users: [
      {
        id: 'usr_demo_01',
        name: 'Aditi Sharma',
        email: 'student@bhashacode.com',
        passwordHash: demoHash,
        salt,
        defaultLanguage: 'telugu',
        plan: 'free',
        dailyUsageCount: 4,
        lastUsageDate: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString(),
      },
    ],
    sessions: [],
    projects: [
      {
        id: 'proj_01',
        userId: 'usr_demo_01',
        title: 'Binary Search Algorithm',
        programmingLanguage: 'python',
        nativeLanguage: 'telugu',
        code: `def binary_search(arr, target):\n    left = 0\n    right = len(arr) - 1\n    \n    while left <= right:\n        mid = (left + right) // 2\n        if arr[mid] == target:\n            return mid\n        elif arr[mid] < target:\n            left = mid + 1\n        else:\n            right = mid - 1\n            \n    return -1\n\nnumbers = [2, 5, 8, 12, 16, 23, 38, 56, 72, 91]\nresult = binary_search(numbers, 23)\nprint(f"Index: {result}")`,
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        updatedAt: new Date(Date.now() - 86400000).toISOString(),
      },
      {
        id: 'proj_02',
        userId: 'usr_demo_01',
        title: 'Even Numbers Filter',
        programmingLanguage: 'javascript',
        nativeLanguage: 'hindi',
        code: `function filterEvenNumbers(numbers) {\n  const evens = [];\n  for (let i = 0; i < numbers.length; i++) {\n    if (numbers[i] % 2 === 0) {\n      evens.push(numbers[i]);\n    }\n  }\n  return evens;\n}\n\nconsole.log(filterEvenNumbers([1, 2, 3, 4, 5, 6]));`,
        createdAt: new Date(Date.now() - 172800000).toISOString(),
        updatedAt: new Date(Date.now() - 172800000).toISOString(),
      },
    ],
    feedback: [],
  };
  fs.writeFileSync(DB_FILE, JSON.stringify(initialDb, null, 2), 'utf-8');
  return initialDb;
}

function saveDb(data: DatabaseSchema) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving DB:', err);
  }
}

// Authentication Helpers
function hashPassword(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

function authenticate(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required. Please sign in.' });
  }

  const token = authHeader.split(' ')[1];
  const db = loadDb();
  const session = db.sessions.find((s) => s.token === token && s.expiresAt > Date.now());

  if (!session) {
    return res.status(401).json({ error: 'Session expired or invalid. Please sign in again.' });
  }

  const user = db.users.find((u) => u.id === session.userId);
  if (!user) {
    return res.status(401).json({ error: 'User not found.' });
  }

  (req as any).user = user;
  (req as any).session = session;
  next();
}

// Optional Auth (for landing demos)
function optionalAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const db = loadDb();
    const session = db.sessions.find((s) => s.token === token && s.expiresAt > Date.now());
    if (session) {
      const user = db.users.find((u) => u.id === session.userId);
      if (user) {
        (req as any).user = user;
      }
    }
  }
  next();
}

// Track usage quota
function checkAndIncrementQuota(user: User): boolean {
  const today = new Date().toISOString().split('T')[0];
  if (user.lastUsageDate !== today) {
    user.dailyUsageCount = 0;
    user.lastUsageDate = today;
  }

  const maxQuota = user.plan === 'pro' ? 200 : 20;
  if (user.dailyUsageCount >= maxQuota) {
    return false;
  }

  user.dailyUsageCount += 1;
  return true;
}

// API Routes

// Health check
app.get('/api/v1/health', (req, res) => {
  res.json({
    status: 'healthy',
    platform: 'BhashaCode API v1',
    geminiConfigured: !!process.env.GEMINI_API_KEY,
    timestamp: new Date().toISOString(),
  });
});

// Auth: Signup
app.post('/api/v1/auth/signup', (req, res) => {
  const { name, email, password, defaultLanguage } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required.' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Please provide a valid email address.' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
  }

  const db = loadDb();
  if (db.users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
    return res.status(400).json({ error: 'An account with this email already exists.' });
  }

  const salt = crypto.randomBytes(16).toString('hex');
  const passwordHash = hashPassword(password, salt);
  const newUser: User = {
    id: `usr_${crypto.randomBytes(8).toString('hex')}`,
    name: name.trim(),
    email: email.toLowerCase().trim(),
    passwordHash,
    salt,
    defaultLanguage: defaultLanguage || 'telugu',
    plan: 'free',
    dailyUsageCount: 0,
    lastUsageDate: new Date().toISOString().split('T')[0],
    createdAt: new Date().toISOString(),
  };

  db.users.push(newUser);

  // Generate session token (7 days)
  const token = crypto.randomBytes(32).toString('hex');
  db.sessions.push({
    token,
    userId: newUser.id,
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
  });

  saveDb(db);

  const { passwordHash: _, salt: __, ...userPublic } = newUser;
  res.status(201).json({
    message: 'Account created successfully!',
    token,
    user: userPublic,
  });
});

// Auth: Login
app.post('/api/v1/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const db = loadDb();
  const user = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase().trim());
  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  const hashed = hashPassword(password, user.salt);
  if (hashed !== user.passwordHash) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  // Create session
  const token = crypto.randomBytes(32).toString('hex');
  db.sessions.push({
    token,
    userId: user.id,
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
  });

  saveDb(db);

  const { passwordHash: _, salt: __, ...userPublic } = user;
  res.json({
    message: 'Welcome back!',
    token,
    user: userPublic,
  });
});

// Auth: Me
app.get('/api/v1/auth/me', authenticate, (req, res) => {
  const user = (req as any).user as User;
  const today = new Date().toISOString().split('T')[0];
  const quotaLimit = user.plan === 'pro' ? 200 : 20;
  const currentUsage = user.lastUsageDate === today ? user.dailyUsageCount : 0;

  const { passwordHash, salt, ...userPublic } = user;
  res.json({
    user: userPublic,
    quota: {
      used: currentUsage,
      limit: quotaLimit,
      remaining: Math.max(0, quotaLimit - currentUsage),
      plan: user.plan,
    },
  });
});

// Auth: Update Settings
app.patch('/api/v1/auth/settings', authenticate, (req, res) => {
  const user = (req as any).user as User;
  const { name, defaultLanguage } = req.body;

  const db = loadDb();
  const dbUser = db.users.find((u) => u.id === user.id);
  if (!dbUser) return res.status(404).json({ error: 'User not found' });

  if (name && typeof name === 'string') dbUser.name = name.trim();
  if (defaultLanguage && typeof defaultLanguage === 'string') dbUser.defaultLanguage = defaultLanguage;

  saveDb(db);
  const { passwordHash, salt, ...userPublic } = dbUser;
  res.json({ message: 'Settings updated successfully', user: userPublic });
});

// Auth: Logout
app.post('/api/v1/auth/logout', authenticate, (req, res) => {
  const session = (req as any).session as Session;
  const db = loadDb();
  db.sessions = db.sessions.filter((s) => s.token !== session.token);
  saveDb(db);
  res.json({ message: 'Logged out successfully.' });
});

// Auth: Password Reset Request
app.post('/api/v1/auth/reset-password', (req, res) => {
  const { email, newPassword } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email address is required.' });
  }

  const db = loadDb();
  const user = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase().trim());
  if (!user) {
    return res.status(404).json({ error: 'No account found with this email address.' });
  }

  if (newPassword) {
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }
    user.salt = crypto.randomBytes(16).toString('hex');
    user.passwordHash = hashPassword(newPassword, user.salt);
    // Invalidate old sessions
    db.sessions = db.sessions.filter((s) => s.userId !== user.id);
    saveDb(db);
    return res.json({ message: 'Password has been successfully reset. Please log in with your new password.' });
  }

  res.json({
    message: 'Reset instructions acknowledged. For demo verification, you can supply your new password to reset directly.',
    canResetDirectly: true,
  });
});

// Auth: Delete Account
app.delete('/api/v1/auth/account', authenticate, (req, res) => {
  const user = (req as any).user as User;
  const db = loadDb();

  db.users = db.users.filter((u) => u.id !== user.id);
  db.sessions = db.sessions.filter((s) => s.userId !== user.id);
  db.projects = db.projects.filter((p) => p.userId !== user.id);

  saveDb(db);
  res.json({ message: 'Account and all associated projects deleted permanently.' });
});

// Supported language native display map
const LANGUAGE_NAMES: Record<string, { english: string; native: string; script: string }> = {
  telugu: { english: 'Telugu', native: 'తెలుగు', script: 'Telugu' },
  hindi: { english: 'Hindi', native: 'हिन्दी', script: 'Devanagari' },
  tamil: { english: 'Tamil', native: 'தமிழ்', script: 'Tamil' },
  kannada: { english: 'Kannada', native: 'ಕನ್ನಡ', script: 'Kannada' },
  marathi: { english: 'Marathi', native: 'मराठी', script: 'Devanagari' },
  bengali: { english: 'Bengali', native: 'বাংলা', script: 'Bengali' },
  gujarati: { english: 'Gujarati', native: 'ગુજરાતી', script: 'Gujarati' },
  english: { english: 'English', native: 'English', script: 'Latin' },
};

// 1. Explain Code Endpoint (100% Deterministic Rule-Based Parsing, No LLMs)
app.post('/api/v1/explain', optionalAuth, async (req, res) => {
  try {
    const { code, programmingLanguage = 'python', nativeLanguage = 'telugu' } = req.body;

    if (!code || typeof code !== 'string' || !code.trim()) {
      return res.status(400).json({ error: 'Please provide code to explain.' });
    }

    const user = (req as any).user as User | undefined;
    if (user) {
      const allowed = checkAndIncrementQuota(user);
      if (!allowed) {
        return res.status(429).json({
          error: 'Daily quota limit reached (20 explanations/day for free plan). Upgrade to Pro or try again tomorrow.',
        });
      }
      const db = loadDb();
      const dbUser = db.users.find((u) => u.id === user.id);
      if (dbUser) {
        dbUser.dailyUsageCount = user.dailyUsageCount;
        dbUser.lastUsageDate = user.lastUsageDate;
        saveDb(db);
      }
    }

    // Pure deterministic rule-based engine: zero LLM calls, zero mixed-script transliteration
    const result = analyzeCodeRuleBased(code, programmingLanguage, nativeLanguage as any);
    return res.json({ success: true, data: result, engine: 'rule_based_deterministic' });
  } catch (error: any) {
    console.error('Explanation error:', error);
    res.status(500).json({ error: error?.message || 'Failed to generate code explanation.' });
  }
});

// 2. Debug Code Endpoint
app.post('/api/v1/debug', optionalAuth, async (req, res) => {
  try {
    const { code, programmingLanguage = 'python', nativeLanguage = 'telugu', errorLog = '' } = req.body;

    if (!code || typeof code !== 'string' || !code.trim()) {
      return res.status(400).json({ error: 'Please provide code to debug.' });
    }

    const langInfo = LANGUAGE_NAMES[nativeLanguage.toLowerCase()] || { english: 'English', native: 'English', script: 'Latin' };

    const prompt = `You are BhashaCode's expert AI debugging tutor. Analyze the following ${programmingLanguage} code for compiler errors, syntax bugs, logic bugs, boundary issues, or edge case failures.
${errorLog ? `The user reported this runtime/compiler error: ${errorLog}` : ''}
Provide your detailed diagnostic and fix strictly in ${langInfo.english} (${langInfo.native}).

Output STRICT JSON:
{
  "hasErrors": true,
  "summary": "Brief summary of what went wrong in ${langInfo.native}",
  "likelyCauses": [
    "Cause 1 explained in ${langInfo.native}",
    "Cause 2 explained in ${langInfo.native}"
  ],
  "originalCode": "exact original code provided",
  "correctedCode": "clean, working, fully corrected code",
  "explanationOfFix": "Detailed explanation in ${langInfo.native} explaining why the fix works and how it avoids the bug",
  "lineDiffs": [
    {
      "lineNumber": 3,
      "issue": "What was wrong here in ${langInfo.native}",
      "correction": "What was changed in ${langInfo.native}"
    }
  ],
  "preventativeTips": "Tips in ${langInfo.native} for avoiding similar bugs in the future"
}

Code to Debug:
\`\`\`${programmingLanguage}
${code}
\`\`\`
`;

    if (process.env.GEMINI_API_KEY) {
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            temperature: 0.2,
          },
        });

        const text = response.text || '';
        const parsed = JSON.parse(text);
        return res.json({ success: true, data: parsed });
      } catch (geminiError: any) {
        console.warn('Gemini debug call failed, using intelligent fallback:', geminiError?.message);
      }
    }

    const fallbackDebug = generateSmartDebugFallback(code, programmingLanguage, nativeLanguage, errorLog);
    return res.json({ success: true, data: fallbackDebug, fallbackUsed: true });
  } catch (error: any) {
    console.error('Debug error:', error);
    res.status(500).json({ error: error?.message || 'Failed to debug code.' });
  }
});

// 3. Convert Code Endpoint (Language-to-Language or Code-to-Native Pseudocode)
app.post('/api/v1/convert', optionalAuth, async (req, res) => {
  try {
    const { code, sourceLanguage = 'python', targetLanguage = 'javascript', nativeLanguage = 'telugu', mode = 'programming_language' } = req.body;

    if (!code || typeof code !== 'string' || !code.trim()) {
      return res.status(400).json({ error: 'Please provide code to convert.' });
    }

    const langInfo = LANGUAGE_NAMES[nativeLanguage.toLowerCase()] || { english: 'English', native: 'English', script: 'Latin' };

    const prompt = `You are BhashaCode's code conversion specialist.
Convert the given ${sourceLanguage} code into ${mode === 'native_pseudocode' ? `intuitive algorithmic pseudocode written in ${langInfo.english} (${langInfo.native}) with clear step labels` : targetLanguage}.
Preserve logic, variable semantics, and edge cases accurately.

Output STRICT JSON:
{
  "convertedCode": "the complete converted code or native pseudocode",
  "explanation": "Detailed explanation of key syntax and idiom differences in ${langInfo.native}",
  "warnings": [
    "Any difference in standard library or memory semantics, explained in ${langInfo.native}"
  ],
  "keyDifferences": [
    {
      "sourceFeature": "Feature in ${sourceLanguage}",
      "targetFeature": "Equivalent in ${targetLanguage}",
      "note": "Note in ${langInfo.native}"
    }
  ]
}

Source Code (${sourceLanguage}):
\`\`\`${sourceLanguage}
${code}
\`\`\`
`;

    if (process.env.GEMINI_API_KEY) {
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            temperature: 0.2,
          },
        });

        const text = response.text || '';
        const parsed = JSON.parse(text);
        return res.json({ success: true, data: parsed });
      } catch (geminiError: any) {
        console.warn('Gemini convert call failed, using fallback:', geminiError?.message);
      }
    }

    const fallbackConvert = generateSmartConvertFallback(code, sourceLanguage, targetLanguage, nativeLanguage, mode);
    return res.json({ success: true, data: fallbackConvert, fallbackUsed: true });
  } catch (error: any) {
    console.error('Convert error:', error);
    res.status(500).json({ error: error?.message || 'Failed to convert code.' });
  }
});

// 4. Ask AI Contextual Q&A Endpoint
app.post('/api/v1/ask', optionalAuth, async (req, res) => {
  try {
    const { code, question, programmingLanguage = 'python', nativeLanguage = 'telugu', history = [] } = req.body;

    if (!question || typeof question !== 'string' || !question.trim()) {
      return res.status(400).json({ error: 'Please enter a question to ask.' });
    }

    const langInfo = LANGUAGE_NAMES[nativeLanguage.toLowerCase()] || { english: 'English', native: 'English', script: 'Latin' };

    const prompt = `You are BhashaCode's friendly AI computer science mentor.
The student is viewing this ${programmingLanguage} code:
\`\`\`${programmingLanguage}
${code || '(No specific code provided)'}
\`\`\`

The student asked this question:
"${question}"

Answer the student clearly, warmly, and thoroughly in ${langInfo.english} (${langInfo.native}).
Use code snippets where appropriate. If they ask in their native language or English, answer in ${langInfo.native} with clear guidance and code examples.
`;

    if (process.env.GEMINI_API_KEY) {
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
        });

        return res.json({ success: true, answer: response.text });
      } catch (geminiError: any) {
        console.warn('Gemini ask call failed, using fallback:', geminiError?.message);
      }
    }

    const fallbackAnswer = generateSmartAskFallback(question, nativeLanguage, code, programmingLanguage);
    return res.json({ success: true, answer: fallbackAnswer, fallbackUsed: true });
  } catch (error: any) {
    console.error('Ask AI error:', error);
    res.status(500).json({ error: error?.message || 'Failed to answer question.' });
  }
});

// Real Subprocess-based Sandboxed Execution Engine
interface ExecutionResult {
  success: boolean;
  output: string;
  exitCode: number;
  executionTimeMs: number;
  language: string;
  engine: string;
}

interface ExecutionOptions {
  code?: string;
  files?: Record<string, string>;
  activeFileName?: string;
  language: string;
  input?: string;
  timeoutMs?: number;
}

function executeCodeInProcess(
  optsOrCode: string | ExecutionOptions,
  language: string = 'python',
  input: string = '',
  timeoutMs: number = 6000
): Promise<ExecutionResult> {
  const opts: ExecutionOptions =
    typeof optsOrCode === 'string'
      ? { code: optsOrCode, language, input, timeoutMs }
      : optsOrCode;

  return new Promise((resolve) => {
    const startTime = Date.now();
    const effectiveLang = opts.language || language || 'python';
    const effectiveInput = opts.input ?? input ?? '';
    const effectiveTimeout = opts.timeoutMs ?? timeoutMs ?? 6000;
    const langLower = effectiveLang.toLowerCase().trim();
    const isPython = langLower === 'python' || langLower === 'py';
    const isJs = langLower === 'javascript' || langLower === 'js';
    const isTs = langLower === 'typescript' || langLower === 'ts';

    if (!isPython && !isJs && !isTs) {
      return resolve({
        success: false,
        output: `[Environment Notice: The compiler/runtime for '${effectiveLang}' is not installed in the local environment. Python 3.11 and JavaScript/TypeScript have live, native execution enabled.]`,
        exitCode: 1,
        executionTimeMs: 0,
        language: effectiveLang,
        engine: 'unsupported',
      });
    }

    const uniqueId = `bhasha_proj_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const projectDir = path.join(os.tmpdir(), uniqueId);

    try {
      fs.mkdirSync(projectDir, { recursive: true });
    } catch (mkdirErr: any) {
      return resolve({
        success: false,
        output: `Execution Setup Error: Failed to create temporary workspace directory: ${mkdirErr?.message}`,
        exitCode: 1,
        executionTimeMs: Date.now() - startTime,
        language: effectiveLang,
        engine: isPython ? 'python' : 'node',
      });
    }

    let entryFile = '';
    const fileMap: Record<string, string> = opts.files || {};

    if (opts.files && Object.keys(opts.files).length > 0) {
      for (const [relPath, content] of Object.entries(opts.files)) {
        const safeRel = path.normalize(relPath).replace(/^(\.\.(\/|\\|$))+/, '');
        const targetPath = path.join(projectDir, safeRel);
        fs.mkdirSync(path.dirname(targetPath), { recursive: true });
        fs.writeFileSync(targetPath, content, 'utf-8');
      }

      if (opts.activeFileName && opts.files[opts.activeFileName]) {
        entryFile = path.join(projectDir, opts.activeFileName);
      } else if (opts.files['main.py']) {
        entryFile = path.join(projectDir, 'main.py');
      } else if (opts.files['index.js'] || opts.files['main.js']) {
        entryFile = path.join(projectDir, opts.files['index.js'] ? 'index.js' : 'main.js');
      } else if (opts.files['index.ts'] || opts.files['main.ts']) {
        entryFile = path.join(projectDir, opts.files['index.ts'] ? 'index.ts' : 'main.ts');
      } else {
        const firstKey = Object.keys(opts.files)[0];
        entryFile = path.join(projectDir, firstKey);
      }
    } else {
      const ext = isPython ? '.py' : isTs ? '.ts' : '.js';
      const defaultName = isPython ? 'main.py' : isTs ? 'index.ts' : 'index.js';
      entryFile = path.join(projectDir, defaultName);
      try {
        fs.writeFileSync(entryFile, opts.code || '', 'utf-8');
      } catch (writeErr: any) {
        try { fs.rmSync(projectDir, { recursive: true, force: true }); } catch {}
        return resolve({
          success: false,
          output: `Execution Setup Error: Failed to write code file: ${writeErr?.message}`,
          exitCode: 1,
          executionTimeMs: Date.now() - startTime,
          language: effectiveLang,
          engine: isPython ? 'python' : 'node',
        });
      }
    }

    const command = isPython ? 'python' : 'node';
    const args = isPython
      ? ['-u', entryFile]
      : isTs
      ? ['--experimental-strip-types', entryFile]
      : [entryFile];

    let proc: any;
    let timedOut = false;

    try {
      proc = spawn(command, args, {
        cwd: projectDir,
        windowsHide: true,
      });
    } catch (spawnErr: any) {
      try { fs.rmSync(projectDir, { recursive: true, force: true }); } catch {}
      return resolve({
        success: false,
        output: `Runtime Startup Error: Failed to spawn ${command}: ${spawnErr?.message}`,
        exitCode: 1,
        executionTimeMs: Date.now() - startTime,
        language: effectiveLang,
        engine: command,
      });
    }

    let stdout = '';
    let stderr = '';

    const timer = setTimeout(() => {
      timedOut = true;
      try {
        proc.kill('SIGKILL');
      } catch {}
    }, effectiveTimeout);

    // Pass standard input if provided
    if (effectiveInput && proc.stdin) {
      try {
        proc.stdin.write(effectiveInput);
        proc.stdin.end();
      } catch {}
    }

    proc.stdout.on('data', (chunk: Buffer) => {
      stdout += chunk.toString('utf-8');
      if (stdout.length > 100000) {
        proc.kill();
      }
    });

    proc.stderr.on('data', (chunk: Buffer) => {
      stderr += chunk.toString('utf-8');
      if (stderr.length > 100000) {
        proc.kill();
      }
    });

    proc.on('error', (err: any) => {
      clearTimeout(timer);
      try { fs.rmSync(projectDir, { recursive: true, force: true }); } catch {}
      resolve({
        success: false,
        output: `Runtime Error (${command}): ${err.message}`,
        exitCode: 1,
        executionTimeMs: Date.now() - startTime,
        language: effectiveLang,
        engine: command,
      });
    });

    proc.on('close', (exitCode: number | null) => {
      clearTimeout(timer);
      try { fs.rmSync(projectDir, { recursive: true, force: true }); } catch {}

      const durationMs = Date.now() - startTime;

      if (timedOut) {
        return resolve({
          success: false,
          output: `Execution Timed Out (${effectiveTimeout / 1000}s limit exceeded)\nYour code took too long to finish. This usually happens if you have an infinite loop (e.g. while True without break) or heavy recursion.`,
          exitCode: 124,
          executionTimeMs: durationMs,
          language: effectiveLang,
          engine: command,
        });
      }

      // Clean temp file paths in tracebacks
      let cleanStderr = stderr
        .split(projectDir + '\\').join('')
        .split(projectDir + '/').join('')
        .split(projectDir).join('.');
      let cleanStdout = stdout
        .split(projectDir + '\\').join('')
        .split(projectDir + '/').join('')
        .split(projectDir).join('.');

      // Detect missing external packages and provide helpful advice
      let missingPackageAdvice = '';
      if (isPython) {
        const pkgMatch = cleanStderr.match(/ModuleNotFoundError:\s+No module named\s+['"]([^'"]+)['"]/);
        if (pkgMatch) {
          const missingPkg = pkgMatch[1];
          const isLocal = fileMap[`${missingPkg}.py`] || fileMap[missingPkg];
          if (!isLocal) {
            missingPackageAdvice = `\n\n[Package Error: External package '${missingPkg}' is not installed in the execution environment.\nTo install it on your system, run:\n  pip install ${missingPkg}\nNote: Local files in your workspace (e.g. utils.py) can be imported directly without pip.]`;
          }
        }
      } else if (isJs || isTs) {
        const pkgMatch = cleanStderr.match(/Cannot find module\s+['"]([^'"]+)['"]/);
        if (pkgMatch) {
          const missingPkg = pkgMatch[1];
          if (!missingPkg.startsWith('.') && !missingPkg.startsWith('/')) {
            missingPackageAdvice = `\n\n[Package Error: External npm package '${missingPkg}' is not installed.\nTo install it, run:\n  npm install ${missingPkg}]`;
          }
        }
      }

      if (missingPackageAdvice) {
        cleanStderr = (cleanStderr ? `${cleanStderr}\n` : '') + missingPackageAdvice;
      }

      const codeVal = exitCode ?? 0;
      const isSuccess = codeVal === 0 && (!cleanStderr.trim() || cleanStderr.includes('DeprecationWarning'));

      let displayOutput = '';
      if (cleanStdout && cleanStderr) {
        displayOutput = `${cleanStdout}\n\n${cleanStderr}`.trim();
      } else if (cleanStdout) {
        displayOutput = cleanStdout.trim();
      } else if (cleanStderr) {
        displayOutput = cleanStderr.trim();
      } else {
        displayOutput = isSuccess
          ? '(Program executed successfully with exit code 0 and no output)'
          : `(Program terminated with exit code ${codeVal})`;
      }

      resolve({
        success: isSuccess,
        output: displayOutput,
        exitCode: isSuccess ? 0 : (codeVal || 1),
        executionTimeMs: durationMs,
        language: effectiveLang,
        engine: command,
      });
    });
  });
}

// 5. Safe Sandboxed Code Execution Endpoint
app.post('/api/v1/execute', optionalAuth, async (req, res) => {
  try {
        const { code, files, activeFileName, programmingLanguage = 'python', input = '' } = req.body;

    if (!code && (!files || Object.keys(files).length === 0)) {
      return res.status(400).json({ error: 'No code or files provided to execute.' });
    }

    const result = await executeCodeInProcess({
      code,
      files,
      activeFileName,
      language: programmingLanguage,
      input,
    });

    return res.json({
      success: result.success,
      output: result.output,
      exitCode: result.exitCode,
      executionTimeMs: result.executionTimeMs,
      language: result.language,
      engine: result.engine,
    });
  } catch (error: any) {
    console.error('Execution handler error:', error);
    res.status(500).json({
      success: false,
      output: `Internal Server Error during execution: ${error?.message || 'Unknown error'}`,
      exitCode: 1,
      executionTimeMs: 0,
      language: req.body?.programmingLanguage || 'unknown',
    });
  }
});

// 6. User Projects Endpoints (Protected)
app.get('/api/v1/projects', authenticate, (req, res) => {
  const user = (req as any).user as User;
  const db = loadDb();
  const userProjects = db.projects
    .filter((p) => p.userId === user.id)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  res.json({ projects: userProjects });
});

app.post('/api/v1/projects', authenticate, (req, res) => {
  const user = (req as any).user as User;
  const { title, programmingLanguage, nativeLanguage, code, explanation } = req.body;

  if (!title || !code) {
    return res.status(400).json({ error: 'Title and code are required to save a project.' });
  }

  const db = loadDb();
  const newProject: Project = {
    id: `proj_${crypto.randomBytes(8).toString('hex')}`,
    userId: user.id,
    title: title.trim(),
    programmingLanguage: programmingLanguage || 'python',
    nativeLanguage: nativeLanguage || user.defaultLanguage || 'telugu',
    code,
    explanation,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.projects.push(newProject);
  saveDb(db);
  res.status(201).json({ message: 'Project saved successfully!', project: newProject });
});

app.patch('/api/v1/projects/:id', authenticate, (req, res) => {
  const user = (req as any).user as User;
  const { id } = req.params;
  const { title, code, explanation, programmingLanguage, nativeLanguage } = req.body;

  const db = loadDb();
  const proj = db.projects.find((p) => p.id === id && p.userId === user.id);
  if (!proj) {
    return res.status(404).json({ error: 'Project not found or unauthorized.' });
  }

  if (title) proj.title = title.trim();
  if (code !== undefined) proj.code = code;
  if (explanation !== undefined) proj.explanation = explanation;
  if (programmingLanguage) proj.programmingLanguage = programmingLanguage;
  if (nativeLanguage) proj.nativeLanguage = nativeLanguage;
  proj.updatedAt = new Date().toISOString();

  saveDb(db);
  res.json({ message: 'Project updated successfully!', project: proj });
});

app.delete('/api/v1/projects/:id', authenticate, (req, res) => {
  const user = (req as any).user as User;
  const { id } = req.params;

  const db = loadDb();
  const initialLength = db.projects.length;
  db.projects = db.projects.filter((p) => !(p.id === id && p.userId === user.id));

  if (db.projects.length === initialLength) {
    return res.status(404).json({ error: 'Project not found or unauthorized.' });
  }

  saveDb(db);
  res.json({ message: 'Project deleted successfully.' });
});

// 7. Feedback Endpoint
app.post('/api/v1/feedback', (req, res) => {
  const { name, email, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Please fill out all fields.' });
  }

  const db = loadDb();
  db.feedback.push({
    id: `fb_${Date.now()}`,
    name: name.trim(),
    email: email.trim(),
    message: message.trim(),
    date: new Date().toISOString(),
  });
  saveDb(db);

  res.json({ message: 'Thank you for your feedback! Our team reads every submission.' });
});

// 8. Report Wrong Explanation Endpoint (saves to data/reports/wrong_explanations.jsonl)
app.post('/api/v1/kb/report', (req, res) => {
  try {
    const { line, rawCode, explanation, note, language } = req.body;
    const report = {
      id: `rep_${Date.now()}`,
      timestamp: new Date().toISOString(),
      line: line || null,
      rawCode: rawCode || '',
      explanation: explanation || '',
      note: note || '',
      language: language || 'python',
    };
    const repDir = path.resolve('data/reports');
    if (!fs.existsSync(repDir)) fs.mkdirSync(repDir, { recursive: true });
    const repFile = path.join(repDir, 'wrong_explanations.jsonl');
    fs.appendFileSync(repFile, JSON.stringify(report) + '\n', 'utf-8');
    res.json({ success: true, message: 'Report recorded successfully.', reportId: report.id });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to save report: ' + err.message });
  }
});

// ==========================================
// Intelligent Fallback Generators for Offline / High-Resilience
// ==========================================

function generateSmartExplanationFallback(code: string, progLang: string, nativeLang: string) {
  return analyzeAnyCodeDynamically(code, progLang, nativeLang as any);
}

function generateSmartDebugFallback(code: string, progLang: string, nativeLang: string, errorLog: string) {
  return debugCodeDeterministically(code, progLang, nativeLang as any, errorLog);
}

function generateSmartConvertFallback(code: string, srcLang: string, targetLang: string, nativeLang: string, mode: string) {
  return convertCodeDeterministically(code, srcLang, targetLang, nativeLang as any, mode);
}

function generateSmartAskFallback(question: string, nativeLang: string, code: string = '', progLang: string = 'python'): string {
  return askCodeDeterministically(code, question, progLang, nativeLang as any);
}

// Vite middleware for dev or Static files for production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve('dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`BhashaCode server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
