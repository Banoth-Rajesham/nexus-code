#!/usr/bin/env node
/**
 * Nexus Code - Explanation Reports Viewer
 * Reads data/reports/wrong_explanations.jsonl and lists all user reports.
 * Usage: npm run kb:reports
 */

const fs = require('fs');
const path = require('path');

const REPORTS_FILE = path.resolve(__dirname, '../data/reports/wrong_explanations.jsonl');

function main() {
  console.log('\n======================================================================');
  console.log('             NEXUS CODE - USER EXPLANATION ISSUE REPORTS              ');
  console.log('======================================================================\n');

  if (!fs.existsSync(REPORTS_FILE)) {
    console.log('No user reports found (data/reports/wrong_explanations.jsonl is empty or not created yet).\n');
    return;
  }

  const content = fs.readFileSync(REPORTS_FILE, 'utf-8').trim();
  if (!content) {
    console.log('No user reports found in data/reports/wrong_explanations.jsonl.\n');
    return;
  }

  const lines = content.split('\n').filter((l) => l.trim().length > 0);
  const reports = [];

  for (const line of lines) {
    try {
      reports.push(JSON.parse(line));
    } catch {}
  }

  if (reports.length === 0) {
    console.log('No valid user reports found.\n');
    return;
  }

  console.log(`Found ${reports.length} report(s):\n`);

  reports.forEach((rep, idx) => {
    console.log(`[Report #${idx + 1}] Timestamp: ${rep.timestamp || 'N/A'}`);
    console.log(`  Line:        L${rep.line || rep.startLine || '?'}`);
    console.log(`  Code:        ${rep.rawCode || rep.code || 'N/A'}`);
    console.log(`  Explanation: ${rep.explanation || rep.sentence || 'N/A'}`);
    if (rep.note) console.log(`  User Note:   ${rep.note}`);
    console.log('  --------------------------------------------------------------------');
  });

  console.log(`Total: ${reports.length} report(s) logged.\n`);
}

main();
