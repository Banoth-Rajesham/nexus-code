#!/usr/bin/env node
/**
 * Nexus Code - Knowledge Base Top-Up CLI
 * Adds or updates an entry in data/kb/python.json (curated KB).
 * Usage: npm run kb:add -- <identifier_or_call> "<explanation>"
 * Example: npm run kb:add -- math.isclose "Checks whether numbers {arg0} and {arg1} are close to each other."
 */

const fs = require('fs');
const path = require('path');

const KB_FILE = path.resolve(__dirname, '../data/kb/python.json');
const UNSEEN_FILE = path.resolve(__dirname, '../data/kb/unseen_calls.json');

function main() {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.log('\nUsage: npm run kb:add -- <name> "<explanation>"');
    console.log('Example: npm run kb:add -- math.dist "Calculates distance between points {arg0} and {arg1}."\n');
    process.exit(1);
  }

  const name = args[0].trim();
  const explanation = args.slice(1).join(' ').trim();

  if (!name || !explanation) {
    console.error('Error: Both name and explanation are required.');
    process.exit(1);
  }

  let kb = {};
  if (fs.existsSync(KB_FILE)) {
    try {
      kb = JSON.parse(fs.readFileSync(KB_FILE, 'utf-8'));
    } catch (err) {
      console.error('Error reading python.json:', err.message);
      process.exit(1);
    }
  }

  const isUpdate = Boolean(kb[name]);
  kb[name] = explanation;

  fs.writeFileSync(KB_FILE, JSON.stringify(kb, null, 2) + '\n', 'utf-8');
  console.log(`\nSuccessfully ${isUpdate ? 'updated' : 'added'} '${name}' in data/kb/python.json.`);
  console.log(`Explanation: "${explanation}"\n`);

  // Remove from unseen_calls.json if present
  if (fs.existsSync(UNSEEN_FILE)) {
    try {
      let list = JSON.parse(fs.readFileSync(UNSEEN_FILE, 'utf-8'));
      if (Array.isArray(list)) {
        const filtered = list.filter((item) => item.name !== name && item.name !== `.${name}`);
        if (filtered.length !== list.length) {
          fs.writeFileSync(UNSEEN_FILE, JSON.stringify(filtered, null, 2) + '\n', 'utf-8');
          console.log(`Removed '${name}' from unseen calls list.`);
        }
      }
    } catch {}
  }
}

main();
