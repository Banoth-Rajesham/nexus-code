// ============================================================================
// 3D VIEW VERIFICATION SUITE
// Data scene (pointers, arrays, changes) and architecture analysis
// ============================================================================

import { analyzeArchitecture, layoutArchitecture, classifyModule } from '../src/utils/visual3d/architecture';

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
