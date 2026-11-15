// ============================================================================
// RAINBOW INDENTATION & ERROR DETECTION TEST SUITE
// Automated verification for all 7 required cases + quick-fix actions
// ============================================================================

import {
  analyzeIndentation,
  fixLineIndentation,
  fixAllIndentation,
  getDepthColor,
  DARK_RAINBOW_THEME,
  COLOR_BLIND_RAINBOW_THEME,
} from '../src/utils/indentAnalyzer';

function runIndentTests() {
  console.log('\n======================================================================');
  console.log('       NEXUS CODE - RAINBOW INDENTATION TEST RUNNER                  ');
  console.log('======================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(desc: string, condition: boolean, detail?: string) {
    if (condition) {
      console.log(`✅ PASS: ${desc}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${desc} ${detail ? `(${detail})` : ''}`);
      failed++;
    }
  }

  // --- Case A: The Pygame ball program (4 levels deep) ---
  console.log('\n--- TEST A: Pygame Ball Program (4 levels deep) ---');
  const pygameCode = `import pygame

running = True
while running:
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False
`;
  const resA = analyzeIndentation(pygameCode, 'python');
  assert('Pygame has 0 indentation errors', resA.totalErrors === 0, `errors: ${resA.totalErrors}`);
  assert('Pygame reaches max depth of at least 3', resA.maxDepth >= 3, `maxDepth: ${resA.maxDepth}`);
  // Line 7: "            running = False" -> 12 spaces = depth 3 (level 3 band)
  assert('Line 7 has 3 bands', resA.lines[6].bands.length === 3);
  assert('Blank lines have 0 errors and do not turn red', !resA.lines[1].hasError);

  // --- Case B: Correct nested loops and ifs (5+ levels, colors repeat) ---
  console.log('\n--- TEST B: 5+ Levels Nested (Colors repeat) ---');
  const deepCode = `def level0():
    if True:
        for i in range(1):
            while False:
                if True:
                    print("level 5")
`;
  const resB = analyzeIndentation(deepCode, 'python');
  assert('Deep code has 0 errors', resB.totalErrors === 0);
  assert('Reaches depth 5', resB.maxDepth === 5);
  // In line 6: "                    print('level 5')" -> 20 spaces = 5 levels
  const line6 = resB.lines[5];
  assert('Line 6 has 5 bands', line6.bands.length === 5);
  // Verify color wrapping: band 1 colorIndex=0, band 2 colorIndex=1, band 3 colorIndex=2, band 4 colorIndex=3, band 5 colorIndex=0!
  assert('Band 1 colorIndex is 0 (Yellow)', line6.bands[0].colorIndex === 0);
  assert('Band 4 colorIndex is 3 (Violet)', line6.bands[3].colorIndex === 3);
  assert('Band 5 colorIndex repeats to 0 (Yellow)', line6.bands[4].colorIndex === 0);
  assert('Solid color depth 5 matches depth 1', getDepthColor(5) === getDepthColor(1));

  // --- Case C: "if x > 5:" followed by an unindented print -> RED ---
  console.log('\n--- TEST C: Missing indent after colon -> RED ---');
  const missingIndentCode = `if x > 5:
print("missing indent")
`;
  const resC = analyzeIndentation(missingIndentCode, 'python');
  assert('Detects 1 indentation error', resC.totalErrors === 1);
  assert('Line 2 is marked with error', resC.lines[1].hasError);
  assert('Error code is MISSING_INDENT', resC.lines[1].errorCode === 'MISSING_INDENT');
  assert('Error message explains colon rule', resC.lines[1].errorMessage?.includes("ends with ':'") || false);
  assert('Suggested indent is 4 spaces', resC.lines[1].suggestedIndent === 4);

  // --- Case D: A line with 3 spaces and one with 5 spaces -> RED ---
  console.log('\n--- TEST D: Inconsistent indent size (3 and 5 spaces) -> RED ---');
  const badSizeCode = `x = 1
   y = 2
     z = 3
`;
  const resD = analyzeIndentation(badSizeCode, 'python');
  assert('Flags lines with 3 and 5 spaces as errors', resD.totalErrors >= 2);
  assert('Line 2 (3 spaces) has INCONSISTENT_SIZE error', resD.lines[1].errorCode === 'INCONSISTENT_SIZE');
  assert('Line 3 (5 spaces) has error', resD.lines[2].hasError);

  // --- Case E: A line mixing a tab and spaces -> RED ---
  console.log('\n--- TEST E: Mixing tab and spaces -> RED ---');
  const mixedCode = `def test():
\t   x = 10
`;
  const resE = analyzeIndentation(mixedCode, 'python');
  assert('Detects mixed tabs and spaces', resE.totalErrors === 1);
  assert('Error code is MIXED_TABS_SPACES', resE.lines[1].errorCode === 'MIXED_TABS_SPACES');
  assert('Error message mentions tabs and spaces are mixed', resE.lines[1].errorMessage?.includes('Tabs and spaces are mixed') || false);

  // --- Case F: Unexpected indent in middle of file -> RED ---
  console.log('\n--- TEST F: Unexpected indent without opener -> RED ---');
  const unexpectedCode = `x = 10
y = 20
    z = 30
`;
  const resF = analyzeIndentation(unexpectedCode, 'python');
  assert('Line 3 has unexpected indent', resF.lines[2].hasError);
  assert('Error code is UNEXPECTED_INDENT', resF.lines[2].errorCode === 'UNEXPECTED_INDENT');

  // --- Case G: JavaScript example with nested braces ---
  console.log('\n--- TEST G: JavaScript with nested braces ---');
  const jsCode = `function test() {
    if (true) {
        console.log("hello");
    }
}
`;
  const resG = analyzeIndentation(jsCode, 'javascript');
  assert('JavaScript snippet has 0 errors', resG.totalErrors === 0);
  assert('Max depth is at least 2', resG.maxDepth >= 2);
  // Check closing brace line: line 4 has "}"
  assert('Closing brace line has 0 errors', !resG.lines[3].hasError);

  // --- Quick Actions: Fix Line and Fix All ---
  console.log('\n--- Quick Actions: Fix Line & Fix All ---');
  const fixTestCode = `if x > 5:
print("unindented")
x += 1
`;
  const fixedLineCode = fixLineIndentation(fixTestCode, 2, 4);
  assert('fixLineIndentation indents line 2 to 4 spaces', fixedLineCode.includes('    print("unindented")'));
  const fixedAllCode = fixAllIndentation(fixTestCode, analyzeIndentation(fixTestCode, 'python'));
  assert('fixAllIndentation produces 0 errors', analyzeIndentation(fixedAllCode, 'python').totalErrors === 0);

  // --- Color-Blind Palette Verification ---
  console.log('\n--- Color-Blind Palette Verification ---');
  assert('Color-blind theme has 4 distinct bands', COLOR_BLIND_RAINBOW_THEME.bands.length === 4);
  assert('Color-blind level 1 is blue', getDepthColor(1, true) === '#3b82f6');
  assert('Color-blind level 2 is orange', getDepthColor(2, true) === '#f97316');

  console.log('\n----------------------------------------------------------------------');
  console.log(`Total: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);
  console.log(`Overall Result: ${failed === 0 ? 'ALL INDENT TESTS PASSED' : 'SOME TESTS FAILED'}`);
  console.log('----------------------------------------------------------------------\n');

  if (failed > 0) process.exit(1);
}

runIndentTests();
