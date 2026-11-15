#!/usr/bin/env node
/**
 * Nexus Code - Unknown Call Reporter
 * Reads data/kb/unseen_calls.json and prints top 50 unseen functions/methods.
 */

const fs = require('fs');
const path = require('path');

const UNSEEN_FILE = path.resolve(__dirname, '../data/kb/unseen_calls.json');

function main() {
  console.log('\n======================================================================');
  console.log('         NEXUS CODE - UNSEEN & UNKNOWN KNOWLEDGE BASE TRACKER         ');
  console.log('======================================================================\n');

  if (!fs.existsSync(UNSEEN_FILE)) {
    console.log('No unknown calls recorded yet (data/kb/unseen_calls.json not found).\n');
    return;
  }

  let list = [];
  try {
    list = JSON.parse(fs.readFileSync(UNSEEN_FILE, 'utf-8'));
  } catch (err) {
    console.error('Error reading unseen calls file:', err.message);
    return;
  }

  if (!Array.isArray(list) || list.length === 0) {
    console.log('No unknown calls recorded yet.\n');
    return;
  }

  // Count frequencies
  const counts = new Map();
  for (const item of list) {
    const key = item.name;
    const existing = counts.get(key) || { count: 0, sample: item.sample || '', lastSeen: item.lastSeen };
    existing.count += 1;
    if (item.sample && !existing.sample) existing.sample = item.sample;
    counts.set(key, existing);
  }

  const sorted = Array.from(counts.entries())
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 50);

  console.log(`Found ${counts.size} unique unknown items. Displaying top ${sorted.length}:\n`);
  console.log('| #   | Name / Identifier                     | Calls | Sample Usage');
  console.log('|-----|---------------------------------------|-------|---------------------------------------------');

  sorted.forEach((item, idx) => {
    const num = String(idx + 1).padEnd(3);
    const name = item.name.length > 37 ? item.name.substring(0, 34) + '...' : item.name.padEnd(37);
    const count = String(item.count).padStart(5);
    const sample = (item.sample || '').replace(/\s+/g, ' ');
    const shortSample = sample.length > 43 ? sample.substring(0, 40) + '...' : sample;
    console.log(`| ${num} | ${name} | ${count} | ${shortSample}`);
  });

  console.log('\nTip: Add an explanation using: npm run kb:add -- <name> "<explanation>"\n');
}

main();
