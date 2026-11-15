// Nexus Code Knowledge Base Tracker
// Records unseen function/method calls during analysis so the KB can grow

export function recordUnknownCall(name: string, sampleUsage?: string): void {
  // If running in browser, record to localStorage
  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    try {
      const existingRaw = localStorage.getItem('nexus_unseen_kb_calls');
      const set = new Set<string>(existingRaw ? JSON.parse(existingRaw) : []);
      if (!set.has(name)) {
        set.add(name);
        localStorage.setItem('nexus_unseen_kb_calls', JSON.stringify(Array.from(set)));
      }
    } catch {}
    return;
  }

  // If running in Node.js (tests, build runner)
  try {
    // Dynamic import/require to prevent bundling fs/path into client build
    if (typeof process !== 'undefined' && process.versions && process.versions.node) {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const fs = require('fs');
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const path = require('path');
      const UNSEEN_FILE = path.resolve('data/kb/unseen_calls.json');
      let list: Array<{ name: string; sample?: string; lastSeen: string }> = [];
      if (fs.existsSync(UNSEEN_FILE)) {
        try {
          list = JSON.parse(fs.readFileSync(UNSEEN_FILE, 'utf-8'));
        } catch {
          list = [];
        }
      }
      if (!list.some((item) => item.name === name)) {
        list.push({
          name,
          sample: sampleUsage,
          lastSeen: new Date().toISOString(),
        });
        const dir = path.dirname(UNSEEN_FILE);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(UNSEEN_FILE, JSON.stringify(list, null, 2), 'utf-8');
      }
    }
  } catch {}
}
