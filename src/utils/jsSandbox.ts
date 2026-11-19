// ============================================================================
// In-browser JavaScript / TypeScript sandbox
//  - stripTypeScript(): context-aware removal of TS-only syntax so the code can
//    run as plain JS (no regex that mangles ternaries or object literals).
//  - runJsInWorker(): executes code inside a throwaway Web Worker with a hard
//    timeout, so infinite loops never freeze the page.
// ============================================================================

type Edit = { start: number; end: number; text?: string };

/**
 * Replace the contents of strings, template literals and comments with filler
 * characters (same length, newlines preserved) so the analysis passes below
 * never react to `:` or `(` that appear inside them.
 */
function maskNonCode(src: string): string {
  const out = src.split('');
  const n = src.length;
  let i = 0;
  while (i < n) {
    const c = src[i];
    const d = src[i + 1];
    if (c === '/' && d === '/') {
      while (i < n && src[i] !== '\n') out[i++] = ' ';
      continue;
    }
    if (c === '/' && d === '*') {
      const close = src.indexOf('*/', i + 2);
      const end = close === -1 ? n : close + 2;
      for (let k = i; k < end; k++) if (src[k] !== '\n') out[k] = ' ';
      i = end;
      continue;
    }
    if (c === '"' || c === "'" || c === '`') {
      let j = i + 1;
      while (j < n && src[j] !== c) {
        if (src[j] === '\\') j++;
        j++;
      }
      for (let k = i + 1; k < j && k < n; k++) if (src[k] !== '\n') out[k] = '_';
      i = j + 1;
      continue;
    }
    i++;
  }
  return out.join('');
}

const OPENERS = '([{<';
const CLOSERS = ')]}>';

function matchForward(m: string, openIdx: number): number {
  const open = m[openIdx];
  const close = CLOSERS[OPENERS.indexOf(open)];
  let depth = 0;
  for (let i = openIdx; i < m.length; i++) {
    if (m[i] === open) depth++;
    else if (m[i] === close) {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

function skipWs(m: string, i: number): number {
  while (i < m.length && /\s/.test(m[i])) i++;
  return i;
}

/**
 * Scan past a type expression starting at `i`. Returns the index of the first
 * character that is no longer part of the type.
 *  - 'decl'   : variable / class-field type, ends at = ; , ) } or newline
 *  - 'param'  : parameter type, ends at , ) or =
 *  - 'return' : return type, ends at the function body `{` or the arrow `=>`
 *  - 'alias'  : `type X = ...` right-hand side, ends at ; or a newline that is
 *               not followed by a continuing | or &
 */
function skipType(m: string, i: number, mode: 'decl' | 'param' | 'return' | 'alias'): number {
  let depth = 0;
  let consumed = false;
  const n = m.length;
  while (i < n) {
    const c = m[i];
    if (c === '=' && m[i + 1] === '>') {
      if (depth === 0 && mode === 'return' && consumed) return i;
      i += 2;
      consumed = true;
      continue;
    }
    if (depth === 0) {
      if (mode === 'return') {
        if ((c === '{' && consumed) || c === ';') return i;
      } else if (mode === 'alias') {
        if (c === ';') return i;
        if (c === '\n' && consumed) {
          const next = skipWs(m, i);
          if (m[next] !== '|' && m[next] !== '&') return i;
        }
      } else {
        if (c === '=' || c === ',' || c === ';') return i;
        if (mode === 'decl' && c === '\n' && consumed) return i;
      }
    }
    if (OPENERS.includes(c)) depth++;
    else if (CLOSERS.includes(c)) {
      if (depth === 0) return i;
      depth--;
    }
    if (!/\s/.test(c)) consumed = true;
    i++;
  }
  return i;
}

const NON_SIGNATURE_KEYWORDS = new Set(['if', 'while', 'for', 'switch', 'with', 'return', 'typeof', 'await', 'yield']);

/** Strip TypeScript-only syntax and return runnable JavaScript. */
export function stripTypeScript(src: string): string {
  const m = maskNonCode(src);
  const edits: Edit[] = [];
  const del = (start: number, end: number) => {
    if (end > start) edits.push({ start, end });
  };
  let match: RegExpExecArray | null;

  // 1. interface declarations
  const ifaceRe = /(?<![\w$.])(?:export\s+)?interface\s+[A-Za-z_$][\w$]*[^{]*\{/g;
  while ((match = ifaceRe.exec(m))) {
    const close = matchForward(m, match.index + match[0].length - 1);
    if (close !== -1) del(match.index, close + 1);
  }

  // 2. type aliases
  const aliasRe = /(?<![\w$.])(?:export\s+)?type\s+[A-Za-z_$][\w$]*\s*(?:<[^=]*>)?\s*=/g;
  while ((match = aliasRe.exec(m))) {
    let end = skipType(m, match.index + match[0].length, 'alias');
    if (m[end] === ';') end++;
    del(match.index, end);
  }

  // 3. declare statements (single line)
  const declareRe = /(?<![\w$.])declare\s+[^\n]*/g;
  while ((match = declareRe.exec(m))) del(match.index, match.index + match[0].length);

  // 4. variable declaration annotations: let x: T = ..., const {a}: T = ...
  const varRe = /(?<![\w$.])(?:let|const|var)\s+/g;
  while ((match = varRe.exec(m))) {
    let p = match.index + match[0].length;
    if (m[p] === '{' || m[p] === '[') {
      const close = matchForward(m, p);
      if (close === -1) continue;
      p = close + 1;
    } else {
      while (p < m.length && /[\w$]/.test(m[p])) p++;
    }
    let q = skipWs(m, p);
    if (m[q] === '!') q++;
    if (m[q] === ':') del(p, skipType(m, q + 1, 'decl'));
  }

  // 5. function / method / arrow signatures: (a: T, b?: U = 1): R => / {
  for (let open = 0; open < m.length; open++) {
    if (m[open] !== '(') continue;
    const close = matchForward(m, open);
    if (close === -1) continue;

    // What precedes the paren? Control-flow keywords are never signatures.
    let b = open - 1;
    while (b >= 0 && /\s/.test(m[b])) b--;
    let wEnd = b + 1;
    while (b >= 0 && /[\w$]/.test(m[b])) b--;
    const prevWord = m.slice(b + 1, wEnd);
    if (NON_SIGNATURE_KEYWORDS.has(prevWord)) continue;

    // What follows? Must be a body `{` or an arrow `=>`, optionally after a return type.
    let after = skipWs(m, close + 1);
    let returnTypeStart = -1;
    let returnTypeEnd = -1;
    if (m[after] === ':') {
      returnTypeStart = close + 1;
      returnTypeEnd = skipType(m, after + 1, 'return');
      after = skipWs(m, returnTypeEnd);
    }
    const isBody = m[after] === '{';
    const isArrow = m[after] === '=' && m[after + 1] === '>';
    if (!isBody && !isArrow) continue;
    if (returnTypeStart !== -1) del(returnTypeStart, returnTypeEnd);

    // Walk each top-level parameter.
    let p = open + 1;
    while (p < close) {
      p = skipWs(m, p);
      const mod = /^(public|private|protected|readonly|override)\s+/.exec(m.slice(p, close));
      if (mod) {
        del(p, p + mod[0].length);
        p += mod[0].length;
        continue;
      }
      if (m.startsWith('...', p)) p += 3;
      if (m[p] === '{' || m[p] === '[') {
        const c2 = matchForward(m, p);
        if (c2 === -1 || c2 > close) break;
        p = c2 + 1;
      } else {
        while (p < close && /[\w$]/.test(m[p])) p++;
      }
      let q = skipWs(m, p);
      let optionalAt = -1;
      if (m[q] === '?' && m[q + 1] !== '.') {
        optionalAt = q;
        q = skipWs(m, q + 1);
      }
      if (m[q] === ':') {
        const tEnd = skipType(m, q + 1, 'param');
        del(p, tEnd); // covers the `?` too
        q = tEnd;
      } else if (optionalAt !== -1) {
        del(optionalAt, optionalAt + 1);
      }
      // Skip default value / rest of this parameter up to the next top-level comma.
      let depth = 0;
      while (q < close) {
        const c = m[q];
        if (OPENERS.slice(0, 3).includes(c)) depth++;
        else if (CLOSERS.slice(0, 3).includes(c)) depth--;
        else if (c === ',' && depth === 0) break;
        q++;
      }
      p = q + 1;
    }
  }

  // 6. generic parameters on functions / classes, and `implements` clauses
  const fnGenericRe = /(?<![\w$.])function\s*\*?\s*[A-Za-z_$][\w$]*\s*(<[^()]*?>)\s*\(/g;
  while ((match = fnGenericRe.exec(m))) {
    const g = match.index + match[0].indexOf(match[1]);
    del(g, g + match[1].length);
  }
  const classGenericRe = /(?<![\w$.])class\s+[A-Za-z_$][\w$]*\s*(<[^{]*?>)/g;
  while ((match = classGenericRe.exec(m))) {
    const g = match.index + match[0].lastIndexOf(match[1]);
    del(g, g + match[1].length);
  }
  const implementsRe = /\s+implements\s+[^{]+(?=\{)/g;
  while ((match = implementsRe.exec(m))) del(match.index, match.index + match[0].length);

  // 7. generic call arguments: useState<number>(0)
  const callGenericRe = /(?<=[\w$])<[\w$.,\s\[\]|'_]+>(?=\s*\()/g;
  while ((match = callGenericRe.exec(m))) del(match.index, match.index + match[0].length);

  // 8. `as` casts and `satisfies`
  const asRe = /\s+(?:as|satisfies)\s+(?:const\b|[A-Za-z_$][\w$.]*(?:\s*<[^<>]*>)?(?:\[\])*)/g;
  while ((match = asRe.exec(m))) del(match.index, match.index + match[0].length);

  // 9. non-null assertions: value!.prop, value!)
  const bangRe = /(?<=[\w$)\]])!(?=[.\[),;])/g;
  while ((match = bangRe.exec(m))) del(match.index, match.index + 1);

  // 10. class member modifiers and typed class fields
  const modRe = /(?<![\w$.])(?:public|private|protected|readonly|abstract|override)\s+(?=[\w$#\[]|constructor)/g;
  while ((match = modRe.exec(m))) del(match.index, match.index + match[0].length);
  const fieldRe = /^([ \t]*(?:(?:public|private|protected|readonly|static|override|declare)\s+)*([A-Za-z_$#][\w$]*))\s*[!?]?\s*:/gm;
  const STATEMENT_START = /^\s*(for|while|do|return|break|continue|if|switch|throw|try|const|let|var)\b/;
  while ((match = fieldRe.exec(m))) {
    if (match[2] === 'default' || match[2] === 'case') continue;
    const colon = match.index + match[0].length - 1;
    const tEnd = skipType(m, colon + 1, 'decl');
    const typeText = m.slice(colon + 1, tEnd);
    if (typeText.includes('\n') || STATEMENT_START.test(typeText)) continue;
    const stop = m[tEnd];
    if (stop === ';' || (stop === '=' && m[tEnd + 1] !== '=')) {
      del(match.index + match[1].length, tEnd);
    }
  }

  // Keep outermost edits (drop ones nested inside / overlapping an earlier one),
  // then apply back-to-front so offsets stay valid.
  edits.sort((a, b) => a.start - b.start || b.end - a.end);
  const kept: Edit[] = [];
  let lastEnd = -1;
  for (const e of edits) {
    if (e.start < lastEnd) continue;
    kept.push(e);
    lastEnd = e.end;
  }
  let out = src;
  for (let k = kept.length - 1; k >= 0; k--) {
    const e = kept[k];
    out = out.slice(0, e.start) + (e.text ?? '') + out.slice(e.end);
  }
  return out;
}

// ─── Web Worker runner ───────────────────────────────────────────────────────

export interface JsRunResult {
  output: string;
  success: boolean;
  timeMs: number;
  timedOut: boolean;
  aborted: boolean;
}

const WORKER_SOURCE = `
const fmt = (a) => {
  if (typeof a === 'string') return a;
  if (a instanceof Error) return a.name + ': ' + a.message;
  try { return typeof a === 'object' && a !== null ? JSON.stringify(a) : String(a); } catch (e) { return String(a); }
};
const send = (prefix) => (...args) => self.postMessage({ type: 'log', line: prefix + args.map(fmt).join(' ') });
const sandboxConsole = { log: send(''), info: send(''), debug: send(''), warn: send('[WARN] '), error: send('[ERROR] ') };
const report = (err) => {
  let line = '';
  const m = err && err.stack ? String(err.stack).match(/<anonymous>:(\\d+):(\\d+)/) : null;
  if (m) { const n = Number(m[1]) - 2; if (n > 0) line = ' (Line ' + n + ')'; }
  self.postMessage({ type: 'error', text: ((err && err.name) || 'RuntimeError') + line + ': ' + ((err && err.message) || String(err)) });
};
self.addEventListener('unhandledrejection', (e) => report(e.reason));
self.onmessage = (e) => {
  try {
    const fn = new Function('console', e.data.code);
    fn(sandboxConsole);
    setTimeout(() => self.postMessage({ type: 'done' }), 0);
  } catch (err) {
    report(err);
  }
};
`;

/**
 * Run JavaScript in an isolated Web Worker. The worker is terminated after
 * `timeoutMs`, so an infinite loop can never lock up the page.
 */
export function runJsInWorker(code: string, timeoutMs = 5000, signal?: AbortSignal): Promise<JsRunResult> {
  return new Promise((resolve) => {
    const start = performance.now();
    const blobUrl = URL.createObjectURL(new Blob([WORKER_SOURCE], { type: 'text/javascript' }));
    const worker = new Worker(blobUrl);
    const lines: string[] = [];
    let settled = false;

    const finish = (success: boolean, tail = '', flags: { timedOut?: boolean; aborted?: boolean } = {}) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      signal?.removeEventListener('abort', onAbort);
      worker.terminate();
      URL.revokeObjectURL(blobUrl);
      const body = lines.join('\n');
      const output = tail ? `${body}${body ? '\n' : ''}${tail}` : body || '(Program finished with no output)';
      resolve({
        output,
        success,
        timeMs: Math.round(performance.now() - start),
        timedOut: !!flags.timedOut,
        aborted: !!flags.aborted,
      });
    };

    const onAbort = () => finish(false, '', { aborted: true });
    signal?.addEventListener('abort', onAbort);

    const timer = setTimeout(() => {
      finish(
        false,
        `Execution Timed Out (${timeoutMs / 1000}s limit exceeded)\nYour code took too long to finish. This usually happens with an infinite loop (e.g. while (true) without break) or heavy recursion.`,
        { timedOut: true }
      );
    }, timeoutMs);

    worker.onmessage = (e: MessageEvent) => {
      const msg = e.data;
      if (msg.type === 'log') lines.push(msg.line);
      else if (msg.type === 'error') finish(false, msg.text);
      else if (msg.type === 'done') finish(true);
    };
    worker.onerror = (e: ErrorEvent) => {
      e.preventDefault();
      finish(false, e.message || 'Worker error');
    };

    if (signal?.aborted) return onAbort();
    worker.postMessage({ code });
  });
}
