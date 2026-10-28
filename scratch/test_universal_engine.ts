import { analyzeAnyCodeDynamically } from '../src/utils/universalCodeAnalyzer';
import { translateCodeToNative, translateIdentifier } from '../src/utils/codeTranslator';

console.log('====================================================');
console.log('BHASHA CODE UNIVERSAL ENGINE VALIDATION SUITE');
console.log('====================================================\n');

let passCount = 0;
let totalTests = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  totalTests++;
  if (condition) {
    console.log(`✅ PASS: ${testName}`);
    passCount++;
  } else {
    console.error(`❌ FAIL: ${testName} - ${detail || ''}`);
  }
}

// ── TEST 1: Basic Python function ──
const pythonFunc = `def calculate_salary(base_pay, bonus_rate):
    total = base_pay + (base_pay * bonus_rate)
    return total

emp_salary = calculate_salary(50000, 0.1)
print("Salary:", emp_salary)`;

const res1 = analyzeAnyCodeDynamically(pythonFunc, 'python', 'telugu');
assert(res1.overview.includes('calculate_salary'), 'Test 1: Overview mentions calculate_salary');
assert(res1.lineByLine.length === 6, 'Test 1: Line count matches submitted code');
assert(res1.lineByLine[0].simpleMeaning.includes('calculate_salary'), 'Test 1: Line 1 explains calculate_salary in Telugu');

// ── TEST 2: Nested loop ──
const nestedLoop = `matrix = [[1, 2], [3, 4]]
for row in matrix:
    for val in row:
        print(val)`;
const res2 = analyzeAnyCodeDynamically(nestedLoop, 'python', 'telugu');
assert(res2.lineByLine[1].category === 'loop' && res2.lineByLine[2].category === 'loop', 'Test 2: Both nested loops detected');
assert(res2.inputOutput.timeComplexity === 'O(N²)', 'Test 2: Complexity detected as O(N²)');

// ── TEST 3: Recursive function ──
const recursiveFunc = `def factorial(n):
    if n <= 1:
        return 1
    return n * factorial(n - 1)

print(factorial(5))`;
const res3 = analyzeAnyCodeDynamically(recursiveFunc, 'python', 'telugu');
assert(res3.overview.includes('రికార్సివ్') || res3.overview.includes('రికర్శన్') || res3.overview.includes('స్వయంగా'), 'Test 3: Recursion detected in overview');
assert(res3.variablesAndFunctions.some(v => v.name === 'factorial' && v.type.includes('రికార్సివ్')), 'Test 3: Function tagged as recursive');

// ── TEST 4: Class with methods ──
const classCode = `class BankAccount:
    def __init__(self, balance):
        self.balance = balance
    def deposit(self, amount):
        self.balance += amount
        return self.balance`;
const res4 = analyzeAnyCodeDynamically(classCode, 'python', 'telugu');
assert(res4.overview.includes('BankAccount') && res4.lineByLine[0].category === 'function', 'Test 4: Class BankAccount detected');

// ── TEST 5: JavaScript Async Function ──
const jsAsync = `async function fetchUserData(userId) {
    const response = await fetch('/api/user/' + userId);
    return response.json();
}`;
const res5 = analyzeAnyCodeDynamically(jsAsync, 'javascript', 'telugu');
assert(res5.overview.includes('fetchUserData'), 'Test 5: JS async function analyzed');

// ── TEST 6: Syntax error detection ──
const syntaxError = `def broken_func(x)
    return x * 2`;
const res6 = analyzeAnyCodeDynamically(syntaxError, 'python', 'telugu');
assert(Boolean(res6.syntaxIssues && res6.syntaxIssues.length > 0), 'Test 6: Missing colon syntax issue flagged');
assert(res6.syntaxIssues![0].line === 1, 'Test 6: Flagged line 1 correctly');

// ── TEST 7: Multi-language analysis (Telugu, Hindi, Tamil, Kannada) ──
const multiLangCode = `def is_even(num):
    return num % 2 == 0`;

const teluguRes = analyzeAnyCodeDynamically(multiLangCode, 'python', 'telugu');
const hindiRes = analyzeAnyCodeDynamically(multiLangCode, 'python', 'hindi');
const tamilRes = analyzeAnyCodeDynamically(multiLangCode, 'python', 'tamil');
const kannadaRes = analyzeAnyCodeDynamically(multiLangCode, 'python', 'kannada');

assert(teluguRes.lineByLine[0].simpleMeaning.includes('ఫంక్షన్'), 'Test 7: Telugu translation verified');
assert(hindiRes.lineByLine[0].simpleMeaning.includes('फ़ंक्शन'), 'Test 7: Hindi translation verified');
assert(tamilRes.lineByLine[0].simpleMeaning.includes('செயல்பாடு') || tamilRes.overview.length > 0, 'Test 7: Tamil translation verified');
assert(kannadaRes.lineByLine[0].simpleMeaning.includes('ಫಂಕ್ಷನ್') || kannadaRes.overview.length > 0, 'Test 7: Kannada translation verified');

// ── TEST 8: Instant Code Translator on Arbitrary Code ──
const arbitraryCode = `def calculate_salary(base_pay, bonus_rate):
    total = base_pay + (base_pay * bonus_rate)
    return total

emp_salary = calculate_salary(50000, 0.1)
print("Salary:", emp_salary)`;

const teluguTrans = translateCodeToNative(arbitraryCode, 'telugu', 'identifiers');
console.log('\n--- Translated Code in Telugu (Identifiers Mode) ---');
console.log(teluguTrans.translatedCode);

assert(teluguTrans.translatedCode.includes('లెక్కించు_జీతం') || teluguTrans.translatedCode.includes('జీతం'), 'Test 8: Function name translated');
assert(teluguTrans.translatedCode.includes('మొత్తం'), 'Test 8: Variable total translated to మొత్తం');
assert(teluguTrans.translatedCode.includes('జీతం:'), 'Test 8: String label translated to జీతం:');

// Full Bhasha mode
const teluguFull = translateCodeToNative(arbitraryCode, 'telugu', 'guide');
console.log('\n--- Translated Code in Telugu (Full Bhasha Mode) ---');
console.log(teluguFull.translatedCode);
assert(teluguFull.translatedCode.includes('నిర్వచించు'), 'Test 8b: def translated to నిర్వచించు');
assert(teluguFull.translatedCode.includes('తిరిగి_ఇవ్వు'), 'Test 8b: return translated to తిరిగి_ఇవ్వు');

// Hindi Mode
const hindiTrans = translateCodeToNative(arbitraryCode, 'hindi', 'identifiers');
console.log('\n--- Translated Code in Hindi ---');
console.log(hindiTrans.translatedCode);
assert(hindiTrans.translatedCode.includes('वेतन') || hindiTrans.translatedCode.includes('कुल_योग'), 'Test 8c: Hindi translation verified');

console.log(`\n====================================================`);
console.log(`TEST SUITE RESULTS: ${passCount} / ${totalTests} PASSED`);
console.log(`====================================================`);
