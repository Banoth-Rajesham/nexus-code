const fs = require('fs');
const types = JSON.parse(fs.readFileSync('data/grammar/python-node-types.json', 'utf8'));
const named = types.filter(t => t.named).map(t => t.type);

const engineSrc = fs.readFileSync('src/utils/pythonTreeSitterEngine.ts', 'utf8');

// Extract keys inside PYTHON_NODE_BUILDERS block
const match = engineSrc.match(/export const PYTHON_NODE_BUILDERS[\s\S]*?\n\};/);
if (!match) {
  console.error('Could not locate PYTHON_NODE_BUILDERS in engine!');
  process.exit(1);
}

const block = match[0];
const missing = [];
const covered = [];

for (const t of named) {
  const reg = new RegExp(`(?:['"\`]${t}['"\`]|\\b${t})\\s*:`);
  if (reg.test(block)) {
    covered.push(t);
  } else {
    missing.push(t);
  }
}

console.log('Total named grammar types:', named.length);
console.log('Covered in PYTHON_NODE_BUILDERS:', covered.length);
console.log('Missing from PYTHON_NODE_BUILDERS:', missing.length);

if (missing.length > 0) {
  console.log('Missing types:', missing);
  process.exit(1);
} else {
  console.log('SUCCESS: All 128 named grammar node types have builders! 100% Coverage!');
}
