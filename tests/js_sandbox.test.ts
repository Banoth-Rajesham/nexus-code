// ============================================================================
// JS SANDBOX — TypeScript stripping verification suite
// Each case is stripped, then executed as plain JavaScript; output must match.
// ============================================================================

import { stripTypeScript } from '../src/utils/jsSandbox';

let pass = 0;
let total = 0;

function run(js: string): string {
  const logs: string[] = [];
  const c = { log: (...a: any[]) => logs.push(a.map((x) => (typeof x === 'object' ? JSON.stringify(x) : String(x))).join(' ')) };
  new Function('console', js)(c);
  return logs.join('\n');
}

function check(name: string, ts: string, expected: string) {
  total++;
  let js = '';
  try {
    js = stripTypeScript(ts);
    const out = run(js);
    if (out === expected) {
      pass++;
      console.log(`✅ PASS: ${name}`);
    } else {
      console.log(`❌ FAIL: ${name}\n   expected: ${JSON.stringify(expected)}\n   got:      ${JSON.stringify(out)}\n   js:\n${js}`);
    }
  } catch (err: any) {
    console.log(`❌ FAIL: ${name} threw ${err.name}: ${err.message}\n   js:\n${js}`);
  }
}

// Regressions the old regex stripper broke
check('ternary is preserved', `const x = 5; const y = x > 3 ? 'big' : 'small'; console.log(y);`, 'big');
check('object literal values preserved', `const o = { n: 1, s: 'a', b: true }; console.log(o.n, o.s, o.b);`, '1 a true');
check('multi-line object literal preserved', `const cfg = {\n  host: 'x',\n  port: 80\n};\nconsole.log(cfg.port);`, '80');
check('ternary inside call args', `const f = (a, b) => a + b; console.log(f(1, true ? 2 : 3));`, '3');
check('switch/case/default preserved', `function g(k) {\n  switch (k) {\n    case 1: return 'one';\n    default: return 'other';\n  }\n}\nconsole.log(g(1), g(2));`, 'one other');
check('colon inside string untouched', `const s: string = "a: b"; console.log(s);`, 'a: b');

// TypeScript syntax that must be removed
check('typed variables', `let a: number = 2; const b: string[] = ['x']; console.log(a, b[0]);`, '2 x');
check('typed function params + return', `function add(a: number, b: number): number { return a + b; }\nconsole.log(add(2, 3));`, '5');
check('optional + default params', `function greet(name?: string, greeting: string = 'Hi'): string { return greeting + ' ' + (name ?? 'you'); }\nconsole.log(greet(), greet('Ana'));`, 'Hi you Hi Ana');
check('typed arrow function', `const sq = (n: number): number => n * n; console.log(sq(4));`, '16');
check('function-typed variable', `const f: (x: number) => number = (x) => x + 1; console.log(f(1));`, '2');
check('destructured typed param', `function p({ a, b }: { a: number; b: number }) { return a * b; }\nconsole.log(p({ a: 3, b: 4 }));`, '12');
check('interface removed', `interface User {\n  name: string;\n  age?: number;\n}\nconst u: User = { name: 'Ravi' };\nconsole.log(u.name);`, 'Ravi');
check('type alias removed (multi-line union)', `type Shape =\n  | 'circle'\n  | 'square';\nconst s: Shape = 'circle';\nconsole.log(s);`, 'circle');
check('generic function', `function id<T>(v: T): T { return v; }\nconsole.log(id<number>(7));`, '7');
check('as casts', `const raw: unknown = '42'; const n = Number(raw as string); const arr = [1, 2] as const; console.log(n, arr.length);`, '42 2');
check('non-null assertion', `const m = new Map<string, number>([['k', 9]]); console.log(m.get('k')!.toFixed(0));`, '9');
check('class with modifiers and fields', `class Counter {\n  private count: number = 0;\n  readonly label: string;\n  constructor(label: string) { this.label = label; }\n  public inc(): number { return ++this.count; }\n}\nconst c = new Counter('c');\nc.inc();\nconsole.log(c.label, c.inc());`, 'c 2');
check('constructor parameter types', `class P {\n  constructor(x: number, y: number) { this.sum = x + y; }\n}\nconsole.log(new P(1, 2).sum);`, '3');
check('catch clause type', `try { throw new Error('boom'); } catch (e: unknown) { console.log((e as Error).message); }`, 'boom');
check('plain JS unchanged', `for (let i = 0; i < 3; i++) { if (i % 2 === 0) console.log(i); }`, '0\n2');

console.log('\n----------------------------------------------------------------------');
console.log(`Total: ${total} | Passed: ${pass} | Failed: ${total - pass}`);
if (pass !== total) process.exit(1);
console.log('Overall Result: ALL JS SANDBOX TESTS PASSED');
