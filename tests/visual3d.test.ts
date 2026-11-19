// ============================================================================
// 3D VIEW VERIFICATION SUITE
// Data scene (pointers, arrays, changes) and architecture analysis
// ============================================================================

import { detectPointers, buildDataScene } from '../src/utils/visual3d/dataScene';
import { analyzeArchitecture, layoutArchitecture, classifyModule } from '../src/utils/visual3d/architecture';
import type { TraceStep, VizValue } from '../src/utils/pyodideRunner';

let pass = 0;
let total = 0;
function assert(cond: boolean, name: string, detail?: unknown) {
  total++;
  if (cond) {
    pass++;
    console.log(`✅ PASS: ${name}`);
  } else {
    console.log(`❌ FAIL: ${name}${detail !== undefined ? `\n   got: ${JSON.stringify(detail)}` : ''}`);
  }
}

// ── Pointer detection ──
const moveZeroes = `def move_zeroes(nums):
    write = 0
    for read in range(len(nums)):
        if nums[read] != 0:
            tmp = nums[write]
            nums[write] = nums[read]
            nums[read] = tmp
            write += 1
`;
const ptrs = detectPointers(moveZeroes);
assert(ptrs.get('nums')?.has('read') && ptrs.get('nums')?.has('write') ? true : false, 'detects read & write as pointers into nums', Array.from(ptrs.get('nums') || []));
assert(detectPointers('for i in range(len(arr)):\n    pass').get('arr')?.has('i') === true, 'range(len(arr)) loop variable is a pointer');
assert(detectPointers('x = "a[i]"  # b[j]').size === 0, 'ignores subscripts in strings and comments');
assert(detectPointers('grid[r][c] = 1').get('grid')?.has('r') === true, 'grid[r] detected');
assert(detectPointers('for i, v in enumerate(items):\n    pass').get('items')?.has('i') === true, 'enumerate index is a pointer');

// ── Data scene ──
const prim = (r: string, t = 'int'): VizValue => ({ k: 'prim', t, r });
const list = (...vals: string[]): VizValue => ({ k: 'list', t: 'list', items: vals.map((v) => prim(v)) });
const mkStep = (line: number, vars: Record<string, { value: string; type?: string; viz?: VizValue }>): TraceStep => ({
  step: line,
  line,
  event: 'line',
  outputSoFar: '',
  stack: [{ function: 'move_zeroes', args: {}, line }],
  locals: Object.fromEntries(
    Object.entries(vars).map(([k, v]) => [k, { name: k, type: v.type || 'int', value: v.value, viz: v.viz }])
  ),
});

const s1 = mkStep(5, { nums: { value: '[0, 1, 0, 3]', type: 'list', viz: list('0', '1', '0', '3') }, write: { value: '0' }, read: { value: '1' } });
const s2 = mkStep(6, { nums: { value: '[1, 0, 0, 3]', type: 'list', viz: list('1', '0', '0', '3') }, write: { value: '0' }, read: { value: '1' }, tmp: { value: '0' } });
const s3 = mkStep(8, { nums: { value: '[1, 0, 0, 3]', type: 'list', viz: list('1', '0', '0', '3') }, write: { value: '1' }, read: { value: '1' }, tmp: { value: '0' } });

let scene = buildDataScene(s2, s1, ptrs);
const arr = scene.structures[0];
assert(arr?.kind === 'array' && arr.name === 'nums' && arr.cells.length === 4, 'list becomes an array structure', arr);
if (arr?.kind === 'array') {
  assert(arr.cells[0].changed && arr.cells[1].changed && !arr.cells[2].changed, 'changed cells detected after a swap', arr.cells.map((c) => c.changed));
  assert(arr.cells[1].ghost && !arr.cells[0].ghost, 'zeros are ghost boxes');
  assert(arr.pointers.length === 2 && arr.pointers.some((p) => p.name === 'read' && p.index === 1), 'pointers placed at their index', arr.pointers);
}
assert(scene.scalars.some((v) => v.name === 'tmp' && v.isNew), 'new scalar variable flagged as new');
assert(scene.scalars[0].isPointer, 'pointer variables listed first among scalars');
assert(scene.stack[0] === 'move_zeroes', 'call stack carried through');

scene = buildDataScene(s3, s2, ptrs);
const arr3 = scene.structures[0];
assert(arr3.kind === 'array' && arr3.pointers.find((p) => p.name === 'write')?.moved === true, 'moved pointer flagged', arr3);
assert(scene.scalars.find((v) => v.name === 'write')?.changed === true, 'changed scalar flagged');

// grid, dict, string
const gridViz: VizValue = { k: 'list', t: 'list', items: [list('1', '0'), list('0', '1')] };
const dictViz: VizValue = { k: 'dict', t: 'dict', items: [["'apple'", prim('3')], ["'kiwi'", prim('1')]] };
const strViz: VizValue = { k: 'str', items: ['c', 'a', 't'].map((c) => prim(c, 'str')) };
scene = buildDataScene(
  mkStep(3, { grid: { value: '[[1, 0], [0, 1]]', type: 'list', viz: gridViz }, counts: { value: "{'apple': 3}", type: 'dict', viz: dictViz }, word: { value: "'cat'", type: 'str', viz: strViz } }),
  mkStep(2, { counts: { value: "{'apple': 2}", type: 'dict', viz: { k: 'dict', t: 'dict', items: [["'apple'", prim('2')]] } } }),
  new Map()
);
const kinds = scene.structures.map((s) => s.kind);
assert(kinds.includes('grid') && kinds.includes('dict') && kinds.includes('string'), 'grid, dict and string structures built', kinds);
const dict = scene.structures.find((s) => s.kind === 'dict');
assert(dict?.kind === 'dict' && dict.entries[0].value.changed && dict.entries[1].value.changed, 'changed and newly added dict keys flagged', dict);
assert(buildDataScene(null, null, new Map()).structures.length === 0, 'empty scene without a step');

// ── Architecture: Python web app with DB + AI ──
const flaskApp = `import sqlite3
from flask import Flask, request
from openai import OpenAI
import requests

app = Flask(__name__)
client = OpenAI()

def get_db():
    conn = sqlite3.connect("chat.db")
    return conn

@app.route("/chat", methods=["POST"])
def chat():
    question = request.json["q"]
    reply = client.chat.completions.create(model="gpt", messages=[question])
    db = get_db()
    db.execute("INSERT INTO log VALUES (?)", (question,))
    return {"reply": reply}

def fetch_weather(city):
    return requests.get("https://api.example.com/" + city).json()

def save_report(text):
    with open("report.txt", "w") as f:
        f.write(text)

if __name__ == "__main__":
    app.run()
`;
const map = analyzeArchitecture([{ name: 'app.py', content: flaskApp }]);
const byKind = (k: string) => map.nodes.filter((n) => n.kind === k);
const edge = (from: string, to: string) => map.edges.find((e) => e.from === from && e.to === to);
assert(byKind('database').length === 1 && byKind('ai').length === 1 && byKind('api').length === 1 && byKind('server').length === 1, 'detects database, AI, web API and server', map.nodes.map((n) => `${n.kind}:${n.label}`));
assert(byKind('storage').length === 1, 'open() becomes file storage');
assert(map.nodes.some((n) => n.kind === 'route' && n.label === 'POST /chat'), 'flask route detected with method and path', map.nodes.filter((n) => n.kind === 'route'));
const dbId = byKind('database')[0].id;
const aiId = byKind('ai')[0].id;
assert(!!edge('chat', aiId), 'route function connects to the AI model');
assert(!!edge('chat', 'get_db'), 'route function calls get_db()');
assert(!!edge('get_db', dbId), 'get_db() connects to the database');
assert(edge('chat', aiId)!.lines.includes(16), 'edge remembers the line that makes the AI call', edge('chat', aiId));
assert(!!edge(byKind('server')[0].id, 'chat'), 'server routes requests into the route');
assert(!!edge('save_report', 'svc:storage:Files on disk') && edge('save_report', 'svc:storage:Files on disk')!.label === 'writes', 'file write labelled "writes"');
assert(map.nodes.some((n) => n.kind === 'main'), 'main program node present');
assert(!map.edges.some((e) => e.from === 'main:app.py' && e.label === 'route'), 'decorators are not treated as main-program calls');

// ── Architecture: plain script and multi-file ──
const plain = analyzeArchitecture([{ name: 'main.py', content: 'import math\n\ndef area(r):\n    return math.pi * r * r\n\nprint(area(2))\n' }]);
assert(!plain.nodes.some((n) => n.label.includes('math')), 'standard library helpers are not shown');
assert(plain.edges.some((e) => e.from === 'main:main.py' && e.to === 'area'), 'main program calls area()');

const multi = analyzeArchitecture([
  { name: 'main.py', content: 'from utils import add\n\nprint(add(1, 2))\n' },
  { name: 'utils.py', content: 'def add(a, b):\n    return a + b\n' },
]);
assert(multi.edges.some((e) => e.from === 'main:main.py' && e.to === 'utils.py:add'), 'cross-file call resolved to the function in the other file', multi.edges);

// ── Architecture: JavaScript ──
const js = analyzeArchitecture([
  {
    name: 'server.js',
    content: `const express = require('express');
const mongoose = require('mongoose');
import axios from 'axios';

const app = express();

async function loadUser(id) {
  const res = await axios.get('/users/' + id);
  return res.data;
}

app.get('/profile', async (req, res) => {
  res.json(await loadUser(1));
});
`,
  },
]);
assert(js.nodes.some((n) => n.kind === 'server') && js.nodes.some((n) => n.kind === 'database') && js.nodes.some((n) => n.kind === 'api'), 'JS: express, mongoose and axios detected', js.nodes.map((n) => n.kind));
assert(js.nodes.some((n) => n.kind === 'route' && n.label === 'GET /profile'), 'JS: express route detected');
assert(js.edges.some((e) => e.from === 'loadUser' && e.to.startsWith('svc:api')), 'JS: function connects to the web API', js.edges);

assert(classifyModule('numpy')?.kind === 'data' && classifyModule('os') === null && classifyModule('langchain_openai')?.kind === 'ai', 'module classification');

// ── Layout ──
const layout = layoutArchitecture(map);
assert(layout.nodes.length === map.nodes.length, 'every node positioned');
const col = (k: string) => layout.nodes.find((n) => n.kind === k)!.column;
assert(col('main') < col('function') && col('function') < col('database'), 'entry → code → services left to right');
assert(new Set(layout.nodes.map((n) => `${n.x},${n.y}`)).size === layout.nodes.length, 'no two nodes overlap');

console.log('\n----------------------------------------------------------------------');
console.log(`Total: ${total} | Passed: ${pass} | Failed: ${total - pass}`);
if (pass !== total) process.exit(1);
console.log('Overall Result: ALL 3D VIEW TESTS PASSED');
