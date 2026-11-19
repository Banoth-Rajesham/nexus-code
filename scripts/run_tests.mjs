// Runs every tests/*.test.ts file with tsx and exits non-zero if any fail.
// Usage: npm test            (all suites)
//        npm test -- sandbox (only files whose name contains "sandbox")
import { readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const filter = process.argv[2] || '';
const testDir = path.resolve('tests');
const files = readdirSync(testDir)
  .filter((f) => f.endsWith('.test.ts') && f.includes(filter))
  .sort();

const failed = [];
for (const file of files) {
  const start = Date.now();
  // File names come from our own tests/ folder, so building a shell command string is safe here.
  const result = spawnSync(`npx tsx "${path.join('tests', file)}"`, {
    stdio: process.env.VERBOSE ? 'inherit' : 'pipe',
    encoding: 'utf-8',
    shell: true,
  });
  const ok = result.status === 0;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${file}  (${Date.now() - start}ms)`);
  if (!ok) {
    failed.push(file);
    if (!process.env.VERBOSE) console.log(`${result.stdout || ''}${result.stderr || ''}`.split('\n').slice(-40).join('\n'));
  }
}

console.log(`\n${files.length - failed.length}/${files.length} test files passed.`);
if (failed.length) {
  console.log(`Failed: ${failed.join(', ')}`);
  process.exit(1);
}
