// ============================================================================
// 3D ARCHITECTURE ANALYZER
// Reads a project's files (Python first, JavaScript/TypeScript basic) and
// builds a map of its building blocks — entry point, functions, classes,
// server routes — and the outside services they talk to: databases, AI models,
// web APIs, files, caches, email, cloud. Each connection remembers the source
// lines that cause it, so the 3D view can light it up during step-by-step runs.
// ============================================================================

export type NodeKind =
  | 'main'
  | 'function'
  | 'class'
  | 'route'
  | 'file'
  | 'database'
  | 'ai'
  | 'api'
  | 'server'
  | 'storage'
  | 'cache'
  | 'email'
  | 'cloud'
  | 'ui'
  | 'data'
  | 'library';

export const SERVICE_KINDS: NodeKind[] = ['database', 'ai', 'api', 'server', 'storage', 'cache', 'email', 'cloud', 'ui', 'data', 'library'];

export interface ArchNode {
  id: string;
  label: string;
  kind: NodeKind;
  file: string;
  /** Library / module behind a service node */
  module?: string;
  /** 1-based lines (in `file`) where this node is defined or used */
  lines: number[];
  description: string;
}

export interface ArchEdge {
  from: string;
  to: string;
  /** What the connection does, e.g. "query", "calls", "GET /users" */
  label: string;
  file: string;
  /** 1-based lines in `file` where this interaction happens */
  lines: number[];
}

export interface ArchitectureMap {
  nodes: ArchNode[];
  edges: ArchEdge[];
}

export interface SourceFile {
  name: string;
  content: string;
}

// ── Service catalogue ────────────────────────────────────────────────────────

interface ServiceRule {
  test: RegExp;
  kind: NodeKind;
  label: string;
}

const SERVICE_RULES: ServiceRule[] = [
  // Databases
  { test: /^(sqlite3|aiosqlite)$/, kind: 'database', label: 'SQLite database' },
  { test: /^(mysql|mysql\.connector|pymysql|mysql2|mysqldb)/i, kind: 'database', label: 'MySQL database' },
  { test: /^(psycopg2?|psycopg|asyncpg|pg)$/, kind: 'database', label: 'PostgreSQL database' },
  { test: /^(pymongo|motor|mongoose|mongodb)/, kind: 'database', label: 'MongoDB database' },
  { test: /^(sqlalchemy|peewee|django\.db|sequelize|typeorm|prisma|@prisma\/client|knex|drizzle-orm)/, kind: 'database', label: 'SQL database (ORM)' },
  { test: /^(supabase|@supabase\/supabase-js)/, kind: 'database', label: 'Supabase database' },
  { test: /^(firebase_admin|firebase|firebase-admin)/, kind: 'database', label: 'Firebase' },
  // AI
  { test: /^(openai)$/, kind: 'ai', label: 'OpenAI model' },
  { test: /^(anthropic|@anthropic-ai\/sdk)$/, kind: 'ai', label: 'Claude model' },
  { test: /^(google\.generativeai|google\.genai|@google\/genai|@google\/generative-ai|vertexai)/, kind: 'ai', label: 'Gemini model' },
  { test: /^(langchain|langchain_[a-z_]+|@langchain\/[a-z-]+|langgraph|llama_index|crewai|autogen|google\.adk)/, kind: 'ai', label: 'AI agent framework' },
  { test: /^(ollama|transformers|cohere|mistralai|groq|huggingface_hub|together)$/, kind: 'ai', label: 'AI model' },
  // Web APIs
  { test: /^(requests|httpx|aiohttp|urllib\.request|urllib3|axios|node-fetch|got|superagent)$/, kind: 'api', label: 'Web API (HTTP)' },
  // Servers
  { test: /^(flask|fastapi|django|starlette|tornado|express|koa|hono|@nestjs\/core|bottle|sanic)/, kind: 'server', label: 'Web server' },
  // Storage
  { test: /^(fs|fs\/promises|node:fs|shutil|pathlib|csv|openpyxl|pickle)$/, kind: 'storage', label: 'Files on disk' },
  // Cache
  { test: /^(redis|aioredis|ioredis|memcache|pymemcache)/, kind: 'cache', label: 'Redis cache' },
  // Email
  { test: /^(smtplib|sendgrid|nodemailer|resend|yagmail)/, kind: 'email', label: 'Email service' },
  // Cloud
  { test: /^(boto3|botocore|@aws-sdk\/[a-z-]+|aws-sdk)/, kind: 'cloud', label: 'AWS cloud' },
  { test: /^(google\.cloud|@google-cloud\/[a-z-]+)/, kind: 'cloud', label: 'Google Cloud' },
  { test: /^(azure|@azure\/[a-z-]+)/, kind: 'cloud', label: 'Azure cloud' },
  // User interface
  { test: /^(tkinter|pygame|streamlit|gradio|kivy|PyQt5|PyQt6|PySide6|react|react-dom|vue|svelte)$/, kind: 'ui', label: 'User interface' },
  // Data / science
  { test: /^(numpy|pandas|matplotlib|seaborn|scipy|sklearn|scikit-learn|plotly|polars)/, kind: 'data', label: 'Data & charts' },
];

/** Standard-library helpers that would only clutter the map */
const IGNORED_MODULES = new Set([
  'math', 'random', 'sys', 'os', 'time', 'datetime', 're', 'json', 'typing', 'collections', 'itertools', 'functools',
  'dataclasses', 'enum', 'abc', 'copy', 'string', 'statistics', 'decimal', 'fractions', 'operator', 'heapq', 'bisect',
  'logging', 'argparse', 'uuid', 'hashlib', 'base64', 'secrets', 'traceback', 'warnings', 'contextlib', 'textwrap',
  'pprint', '__future__', 'asyncio', 'threading', 'queue', 'subprocess', 'dotenv', 'path', 'util', 'url', 'events',
]);

const KIND_DESCRIPTION: Record<NodeKind, (label: string, module?: string) => string> = {
  main: () => 'Where the program starts running. Code here runs top to bottom.',
  function: (l) => `A function: a named block of code (${l}) that runs when it is called.`,
  class: (l) => `A class: a blueprint (${l}) for creating objects with their own data and methods.`,
  route: (l) => `A web route: the server runs this code when someone visits ${l}.`,
  file: (l) => `Another file in your project (${l}).`,
  database: (_l, m) => `Stores and reads data permanently using ${m}.`,
  ai: (_l, m) => `Sends prompts to an AI model and receives answers, using ${m}.`,
  api: (_l, m) => `Talks to other services over the internet (HTTP), using ${m}.`,
  server: (_l, m) => `Receives web requests and sends back responses, using ${m}.`,
  storage: (_l, m) => `Reads and writes files on disk${m && m !== 'open()' ? `, using ${m}` : ''}.`,
  cache: (_l, m) => `Keeps frequently used data in fast memory, using ${m}.`,
  email: (_l, m) => `Sends email messages, using ${m}.`,
  cloud: (_l, m) => `Uses cloud services (storage, compute), using ${m}.`,
  ui: (_l, m) => `Shows windows, pages or graphics to the user, using ${m}.`,
  data: (_l, m) => `Works with numbers, tables or charts, using ${m}.`,
  library: (_l, m) => `An external library (${m}) used by this code.`,
};

export function classifyModule(mod: string): { kind: NodeKind; label: string } | null {
  const root = mod.split('.')[0];
  if (IGNORED_MODULES.has(mod) || IGNORED_MODULES.has(root) || mod.startsWith('node:') && IGNORED_MODULES.has(mod.slice(5))) return null;
  for (const rule of SERVICE_RULES) {
    if (rule.test.test(mod) || rule.test.test(root)) return { kind: rule.kind, label: rule.label };
  }
  return { kind: 'library', label: mod };
}

// ── Source parsing helpers ───────────────────────────────────────────────────

interface Block {
  name: string;
  kind: 'function' | 'class' | 'route';
  startLine: number; // 1-based
  endLine: number;
  routeLabel?: string;
}

const isPython = (name: string) => /\.py$/i.test(name);
const isJs = (name: string) => /\.(m?js|cjs|jsx|ts|tsx)$/i.test(name);
const baseName = (name: string) => name.replace(/^.*[\\/]/, '').replace(/\.[^.]+$/, '');

/** Remove comments and string contents (keeping line structure) so regexes do not match inside them. */
function maskCode(code: string, python: boolean): string {
  let out = '';
  let i = 0;
  const n = code.length;
  while (i < n) {
    const c = code[i];
    if (python && c === '#') {
      while (i < n && code[i] !== '\n') { out += ' '; i++; }
      continue;
    }
    if (!python && c === '/' && code[i + 1] === '/') {
      while (i < n && code[i] !== '\n') { out += ' '; i++; }
      continue;
    }
    if (!python && c === '/' && code[i + 1] === '*') {
      const end = code.indexOf('*/', i + 2);
      const stop = end === -1 ? n : end + 2;
      for (; i < stop; i++) out += code[i] === '\n' ? '\n' : ' ';
      continue;
    }
    if (c === '"' || c === "'" || c === '`') {
      const triple = python && code.startsWith(c.repeat(3), i);
      const close = triple ? c.repeat(3) : c;
      out += triple ? close : c;
      i += close.length;
      while (i < n && !code.startsWith(close, i)) {
        if (code[i] === '\\') { out += '  '; i += 2; continue; }
        if (!triple && code[i] === '\n' && c !== '`') break;
        out += code[i] === '\n' ? '\n' : '_';
        i++;
      }
      if (i < n && code.startsWith(close, i)) { out += close; i += close.length; }
      continue;
    }
    out += c;
    i++;
  }
  return out;
}

/** Original string literals (needed for route paths and URLs) */
function firstStringArg(text: string): string | null {
  const m = /\(\s*[fr]?(["'`])([^"'`]{0,80})\1/.exec(text);
  return m ? m[2] : null;
}

function pythonBlocks(lines: string[], masked: string[]): Block[] {
  const blocks: Block[] = [];
  const indentOf = (s: string) => s.match(/^\s*/)![0].replace(/\t/g, '    ').length;
  for (let i = 0; i < masked.length; i++) {
    const m = /^(\s*)(?:async\s+)?(def|class)\s+([A-Za-z_]\w*)/.exec(masked[i]);
    if (!m) continue;
    const indent = indentOf(m[1]);
    if (indent > 0) continue; // methods are part of their class block
    let end = i;
    for (let j = i + 1; j < masked.length; j++) {
      if (!masked[j].trim()) continue;
      if (indentOf(masked[j]) <= indent) break;
      end = j;
    }
    // decorators directly above: @app.route("/x"), @app.get("/x"), @router.post(...)
    let routeLabel: string | undefined;
    for (let d = i - 1; d >= 0 && /^\s*@/.test(masked[d]); d--) {
      const dec = /^\s*@\s*[\w.]+\.(route|get|post|put|patch|delete|websocket)\s*\(/.exec(masked[d]);
      if (dec) {
        const path = firstStringArg(lines[d]) || '/';
        const flaskMethod = /methods\s*=\s*[\[(]\s*["'](\w+)/.exec(lines[d]);
        const method = dec[1] === 'route' ? (flaskMethod ? `${flaskMethod[1].toUpperCase()} ` : '') : `${dec[1].toUpperCase()} `;
        routeLabel = `${method}${path}`;
      }
    }
    blocks.push({
      name: m[3],
      kind: routeLabel ? 'route' : m[2] === 'class' ? 'class' : 'function',
      startLine: i + 1,
      endLine: end + 1,
      routeLabel,
    });
  }
  return blocks;
}

function jsBlocks(lines: string[], masked: string[]): Block[] {
  const blocks: Block[] = [];
  const text = masked.join('\n');
  const lineAt = (idx: number) => text.slice(0, idx).split('\n').length;
  const re = /(?:^|\n)[ \t]*(?:export\s+(?:default\s+)?)?(?:(?:async\s+)?function\s*\*?\s*([A-Za-z_$][\w$]*)\s*\(|class\s+([A-Za-z_$][\w$]*)|(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?(?:\([^)]*\)|[A-Za-z_$][\w$]*)\s*=>)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    const name = m[1] || m[2] || m[3];
    const open = text.indexOf('{', m.index + m[0].length - 1);
    let end = text.indexOf('\n', m.index + m[0].length);
    if (open !== -1 && text.slice(m.index + m[0].length, open).indexOf('\n') <= 1) {
      let depth = 0;
      for (let k = open; k < text.length; k++) {
        if (text[k] === '{') depth++;
        else if (text[k] === '}') {
          depth--;
          if (depth === 0) { end = k; break; }
        }
      }
    }
    const start = lineAt(m.index + (m[0].startsWith('\n') ? 1 : 0));
    blocks.push({ name, kind: m[2] ? 'class' : 'function', startLine: start, endLine: lineAt(end === -1 ? text.length : end) });
  }
  // Express-style routes: app.get('/users', ...)
  const routeRe = /\b(app|router|server)\.(get|post|put|patch|delete|use)\s*\(/g;
  masked.forEach((ln, i) => {
    routeRe.lastIndex = 0;
    const r = routeRe.exec(ln);
    if (r) {
      const path = firstStringArg(lines[i].slice(r.index)) || '/';
      blocks.push({ name: `${r[2].toUpperCase()} ${path}`, kind: 'route', startLine: i + 1, endLine: i + 1, routeLabel: `${r[2].toUpperCase()} ${path}` });
    }
  });
  return blocks;
}

interface ImportInfo {
  module: string;
  /** Local names introduced by the import */
  names: string[];
  line: number;
}

function pythonImports(masked: string[]): ImportInfo[] {
  const out: ImportInfo[] = [];
  masked.forEach((ln, i) => {
    let m = /^\s*import\s+(.+)$/.exec(ln);
    if (m) {
      m[1].split(',').forEach((part) => {
        const pm = /^\s*([\w.]+)(?:\s+as\s+(\w+))?/.exec(part);
        if (pm) out.push({ module: pm[1], names: [pm[2] || pm[1].split('.')[0]], line: i + 1 });
      });
      return;
    }
    m = /^\s*from\s+([\w.]+)\s+import\s+\(?([^)]+)\)?/.exec(ln);
    if (m) {
      const names = m[2]
        .split(',')
        .map((p) => /^\s*(\w+)(?:\s+as\s+(\w+))?/.exec(p))
        .filter(Boolean)
        .map((pm) => pm![2] || pm![1]);
      out.push({ module: m[1], names, line: i + 1 });
    }
  });
  return out;
}

function jsImports(lines: string[], masked: string[]): ImportInfo[] {
  const out: ImportInfo[] = [];
  masked.forEach((ln, i) => {
    const src = lines[i];
    let m = /^\s*import\s+(.+?)\s+from\s+['"]([^'"]+)['"]/.exec(src);
    if (m && /^\s*import/.test(ln)) {
      const names = m[1]
        .replace(/[{}*]/g, ' ')
        .split(/[\s,]+/)
        .filter((w) => w && w !== 'as' && w !== 'type')
        .map((w) => w.trim());
      out.push({ module: m[2], names, line: i + 1 });
      return;
    }
    m = /(?:const|let|var)\s+(\{[^}]*\}|[A-Za-z_$][\w$]*)\s*=\s*require\(\s*['"]([^'"]+)['"]\s*\)/.exec(src);
    if (m) {
      const names = m[1].replace(/[{}]/g, ' ').split(/[\s,:]+/).filter(Boolean);
      out.push({ module: m[2], names, line: i + 1 });
    }
  });
  return out;
}

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// ── Main analysis ───────────────────────────────────────────────────────────

export function analyzeArchitecture(files: SourceFile[]): ArchitectureMap {
  const nodes = new Map<string, ArchNode>();
  const edges = new Map<string, ArchEdge>();
  const projectModules = new Map(files.map((f) => [baseName(f.name), f.name]));
  const multiFile = files.length > 1;

  const addNode = (node: ArchNode) => {
    const existing = nodes.get(node.id);
    if (existing) {
      node.lines.forEach((l) => !existing.lines.includes(l) && existing.lines.push(l));
      return existing;
    }
    nodes.set(node.id, node);
    return node;
  };
  const addEdge = (from: string, to: string, label: string, file: string, line: number) => {
    if (from === to) return;
    const key = `${from}->${to}`;
    const e = edges.get(key);
    if (e) {
      if (!e.lines.includes(line)) e.lines.push(line);
      return;
    }
    edges.set(key, { from, to, label, file, lines: [line] });
  };

  // Pass 1: declarations in every file (so cross-file calls can be resolved)
  const parsed = files
    .filter((f) => isPython(f.name) || isJs(f.name))
    .map((f) => {
      const python = isPython(f.name);
      const lines = f.content.split('\n');
      const masked = maskCode(f.content, python).split('\n');
      const blocks = python ? pythonBlocks(lines, masked) : jsBlocks(lines, masked);
      const imports = python ? pythonImports(masked) : jsImports(lines, masked);
      return { file: f, python, lines, masked, blocks, imports };
    });

  const blockId = (file: string, name: string) => `${multiFile ? file + ':' : ''}${name}`;
  for (const p of parsed) {
    for (const b of p.blocks) {
      addNode({
        id: blockId(p.file.name, b.name),
        label: b.kind === 'route' ? b.routeLabel || b.name : b.kind === 'class' ? b.name : `${b.name}()`,
        kind: b.kind,
        file: p.file.name,
        lines: [b.startLine],
        description: KIND_DESCRIPTION[b.kind](b.routeLabel || b.name),
      });
    }
  }

  // Pass 2: usage inside each block and at top level
  for (const p of parsed) {
    const fname = p.file.name;
    // Names that refer to a service: import aliases + variables created from them
    const serviceOf = new Map<string, string>(); // local name -> service node id
    const localFunctions = new Map<string, string>(); // callable name -> node id

    for (const b of p.blocks) if (b.kind !== 'route' || p.python) localFunctions.set(b.name, blockId(fname, b.name));

    for (const imp of p.imports) {
      const localTarget = projectModules.get(imp.module.replace(/^\.\//, '').replace(/\.[jt]sx?$/, '').split('.').pop() || '');
      if (localTarget && localTarget !== fname) {
        // import from another project file: map names to that file's blocks
        const target = parsed.find((q) => q.file.name === localTarget);
        imp.names.forEach((nm) => {
          if (target?.blocks.some((b) => b.name === nm)) localFunctions.set(nm, blockId(localTarget, nm));
        });
        const fileNodeId = `file:${localTarget}`;
        if (!target || !imp.names.some((nm) => target.blocks.some((b) => b.name === nm))) {
          addNode({ id: fileNodeId, label: localTarget, kind: 'file', file: localTarget, lines: [], description: KIND_DESCRIPTION.file(localTarget) });
          imp.names.forEach((nm) => serviceOf.set(nm, fileNodeId));
        }
        continue;
      }
      const cls = classifyModule(imp.module);
      if (!cls) continue;
      const id = `svc:${cls.kind}:${cls.kind === 'library' ? imp.module : cls.label}`;
      addNode({
        id,
        label: cls.label,
        kind: cls.kind,
        file: fname,
        module: imp.module,
        lines: [imp.line],
        description: KIND_DESCRIPTION[cls.kind](cls.label, imp.module),
      });
      imp.names.forEach((nm) => serviceOf.set(nm, id));
    }

    // Variables derived from services: conn = sqlite3.connect(...), client = OpenAI(), cur = conn.cursor()
    for (let pass = 0; pass < 3; pass++) {
      p.masked.forEach((ln) => {
        const m = /^\s*(?:(?:const|let|var)\s+)?((?:self\.|this\.)?[A-Za-z_$][\w$]*)\s*(?::\s*[\w.\[\]]+\s*)?=\s*(?:await\s+|new\s+)?([A-Za-z_$][\w$]*)\b(?:\.\w+)*\s*[.(]/.exec(ln);
        if (m && serviceOf.has(m[2]) && !serviceOf.has(m[1])) serviceOf.set(m[1], serviceOf.get(m[2])!);
        const w = /^\s*with\s+([A-Za-z_]\w*)\b[^:]*\bas\s+([A-Za-z_]\w*)/.exec(ln);
        if (w && serviceOf.has(w[1]) && !serviceOf.has(w[2])) serviceOf.set(w[2], serviceOf.get(w[1])!);
      });
    }

    const usesRegexes = Array.from(serviceOf.entries()).map(([name, id]) => ({
      re: new RegExp(`(?<![\\w$.])${escapeRe(name)}\\b\\s*(?:\\.\\s*([A-Za-z_$][\\w$]*)|\\()`),
      id,
    }));
    const callRegexes = Array.from(localFunctions.entries()).map(([name, id]) => ({
      re: new RegExp(`(?<![\\w$.])${escapeRe(name)}\\s*\\(`),
      id,
      name,
    }));

    const ownerOf = (lineNo: number): string => {
      const b = p.blocks.find((bl) => bl.kind !== 'route' || p.python ? lineNo >= bl.startLine && lineNo <= bl.endLine : false);
      return b ? blockId(fname, b.name) : `main:${fname}`;
    };

    let hasTopLevelCode = false;
    p.masked.forEach((ln, idx) => {
      const lineNo = idx + 1;
      if (!ln.trim()) return;
      const owner = ownerOf(lineNo);
      const isDecl = p.blocks.some((b) => b.startLine === lineNo);
      if (owner.startsWith('main:') && !/^\s*(import|from|@|#)/.test(ln) && !/^\s*(\}|\)|\]);?\s*$/.test(ln)) {
        if (!(p.python ? false : /^\s*(import|export\s*\{)/.test(ln))) hasTopLevelCode = true;
      }

      for (const { re, id } of usesRegexes) {
        const m = re.exec(ln);
        if (!m) continue;
        if (/^\s*(import|from|@)/.test(ln) || /\brequire\(/.test(ln)) continue;
        const kind = nodes.get(id)?.kind;
        const verb = m[1] ? m[1] : 'uses';
        addEdge(owner, id, kind === 'file' ? 'imports' : verb, fname, lineNo);
      }
      for (const { re, id, name } of callRegexes) {
        if (isDecl && p.blocks.some((b) => b.startLine === lineNo && b.name === name)) continue;
        if (re.test(ln)) addEdge(owner, id, 'calls', fname, lineNo);
      }
      if (p.python && /(?<![\w.])open\s*\(/.test(ln)) {
        const id = 'svc:storage:Files on disk';
        addNode({ id, label: 'Files on disk', kind: 'storage', file: fname, module: 'open()', lines: [lineNo], description: KIND_DESCRIPTION.storage('Files on disk', 'open()') });
        addEdge(owner, id, /['"][wa]\+?b?['"]/.test(p.lines[idx]) ? 'writes' : 'reads', fname, lineNo);
      }
      if (!p.python && /(?<![\w$.])fetch\s*\(/.test(ln)) {
        const id = 'svc:api:Web API (HTTP)';
        addNode({ id, label: 'Web API (HTTP)', kind: 'api', file: fname, module: 'fetch', lines: [lineNo], description: KIND_DESCRIPTION.api('Web API (HTTP)', 'fetch') });
        addEdge(owner, id, 'request', fname, lineNo);
      }
    });

    // Routes are entered from the web server
    const serverId = Array.from(nodes.values()).find((nd) => nd.kind === 'server' && nd.file === fname)?.id;
    p.blocks
      .filter((b) => b.kind === 'route')
      .forEach((b) => serverId && addEdge(serverId, blockId(fname, b.name), 'request', fname, b.startLine));

    const mainId = `main:${fname}`;
    const mainHasEdges = Array.from(edges.values()).some((e) => e.from === mainId);
    if (hasTopLevelCode || mainHasEdges || p.blocks.length === 0) {
      addNode({
        id: mainId,
        label: multiFile ? `${fname} (main)` : 'Main program',
        kind: 'main',
        file: fname,
        lines: [1],
        description: KIND_DESCRIPTION.main(''),
      });
    }
  }

  // Drop edges whose ends do not exist (e.g. main without code)
  const result: ArchitectureMap = {
    nodes: Array.from(nodes.values()),
    edges: Array.from(edges.values()).filter((e) => nodes.has(e.from) && nodes.has(e.to)),
  };
  return result;
}

// ── Layout ──────────────────────────────────────────────────────────────────

export interface PositionedNode extends ArchNode {
  x: number;
  y: number;
  column: number;
}

/** Arrange nodes in three columns: entry points → your code → outside services. */
export function layoutArchitecture(map: ArchitectureMap, spacingX = 230, spacingY = 150): { nodes: PositionedNode[]; width: number; height: number } {
  const column = (n: ArchNode) => (n.kind === 'main' || n.kind === 'server' || n.kind === 'ui' ? 0 : n.kind === 'function' || n.kind === 'class' || n.kind === 'route' || n.kind === 'file' ? 1 : 2);
  const cols: ArchNode[][] = [[], [], []];
  // Keep a stable, readable order: by first line, services by kind
  const sorted = [...map.nodes].sort((a, b) => (a.lines[0] ?? 0) - (b.lines[0] ?? 0) || a.label.localeCompare(b.label));
  sorted.forEach((n) => cols[column(n)].push(n));
  // A server with routes reads better in the middle column's first slot
  const used = cols.filter((c) => c.length > 0);
  const rows = Math.max(1, ...used.map((c) => c.length));
  const positioned: PositionedNode[] = [];
  used.forEach((col, ci) => {
    const offset = ((rows - col.length) * spacingY) / 2;
    col.forEach((n, ri) => positioned.push({ ...n, column: ci, x: 110 + ci * spacingX, y: 90 + offset + ri * spacingY }));
  });
  return { nodes: positioned, width: 220 + (used.length - 1) * spacingX, height: 180 + (rows - 1) * spacingY };
}
