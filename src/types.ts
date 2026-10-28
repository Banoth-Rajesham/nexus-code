export interface User {
  id: string;
  name: string;
  email: string;
  defaultLanguage: string;
  plan: 'free' | 'pro';
  dailyUsageCount: number;
  lastUsageDate: string;
  createdAt: string;
}

export interface QuotaInfo {
  used: number;
  limit: number;
  remaining: number;
  plan: 'free' | 'pro';
}

export interface LineExplanation {
  lineNumber: number;
  codeSnippet: string;
  explanation: string;
  simpleMeaning?: string;
  smallExample?: string;
  keyConcepts?: string[];
  variableNotes?: string;
  category?: string;
}

export interface VariableFunction {
  name: string;
  type: string;
  purpose: string;
}

export interface ExplanationData {
  overview: string;
  lineByLine: LineExplanation[];
  variablesAndFunctions: VariableFunction[];
  inputOutput: {
    inputs: string;
    outputs: string;
    timeComplexity?: string;
    spaceComplexity?: string;
  };
  simpleLogicSummary: string;
  executionFlow?: string[];
  expectedOutput?: string;
  syntaxIssues?: Array<{ line: number; problem: string; suggestion: string }>;
}

export interface DebugDiff {
  lineNumber: number;
  issue: string;
  correction: string;
}

export interface DebugData {
  hasErrors: boolean;
  summary: string;
  likelyCauses: string[];
  originalCode: string;
  correctedCode: string;
  explanationOfFix: string;
  lineDiffs: DebugDiff[];
  preventativeTips?: string;
}

export interface ConversionData {
  convertedCode: string;
  explanation: string;
  warnings: string[];
  keyDifferences?: Array<{
    sourceFeature: string;
    targetFeature: string;
    note: string;
  }>;
}

export interface Project {
  id: string;
  userId: string;
  title: string;
  programmingLanguage: string;
  nativeLanguage: string;
  code: string;
  explanation?: any;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectFile {
  id: string;
  name: string;
  content: string;
  isEntry?: boolean;
}

export type NativeLanguageKey = 'telugu' | 'hindi' | 'tamil' | 'kannada' | 'marathi' | 'bengali' | 'gujarati' | 'english';

export interface NativeLanguageOption {
  key: NativeLanguageKey;
  english: string;
  native: string;
  greeting: string;
  script: string;
}

export const SUPPORTED_NATIVE_LANGUAGES: NativeLanguageOption[] = [
  { key: 'telugu', english: 'Telugu', native: 'తెలుగు', greeting: 'నమస్కారం', script: 'Telugu' },
  { key: 'hindi', english: 'Hindi', native: 'हिन्दी', greeting: 'नमस्ते', script: 'Devanagari' },
  { key: 'tamil', english: 'Tamil', native: 'தமிழ்', greeting: 'வணக்கம்', script: 'Tamil' },
  { key: 'kannada', english: 'Kannada', native: 'ಕನ್ನಡ', greeting: 'ನಮಸ್ಕಾರ', script: 'Kannada' },
  { key: 'marathi', english: 'Marathi', native: 'मराठी', greeting: 'नमस्कार', script: 'Devanagari' },
  { key: 'bengali', english: 'Bengali', native: 'বাংলা', greeting: 'নমস্কার', script: 'Bengali' },
  { key: 'gujarati', english: 'Gujarati', native: 'ગુજરાતી', greeting: 'નમસ્તે', script: 'Gujarati' },
  { key: 'english', english: 'English', native: 'English', greeting: 'Welcome', script: 'Latin' },
];

export interface ProgrammingLanguageOption {
  key: string;
  name: string;
  extension: string;
  defaultSnippet: string;
}

export const SUPPORTED_PROG_LANGUAGES: ProgrammingLanguageOption[] = [
  {
    key: 'python',
    name: 'Python',
    extension: '.py',
    defaultSnippet: `def binary_search(arr, target):
    left = 0
    right = len(arr) - 1
    
    while left <= right:
        mid = (left + right) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
            
    return -1

numbers = [2, 5, 8, 12, 16, 23, 38, 56, 72, 91]
result = binary_search(numbers, 23)
print("Target found at index:", result)`,
  },
  {
    key: 'javascript',
    name: 'JavaScript',
    extension: '.js',
    defaultSnippet: `function calculateTotalCart(items, taxRate) {
  let subtotal = 0;
  
  for (let i = 0; i < items.length; i++) {
    subtotal += items[i].price * items[i].quantity;
  }
  
  const tax = subtotal * taxRate;
  const grandTotal = subtotal + tax;
  return { subtotal, tax, grandTotal };
}

const cart = [
  { name: "Notebook", price: 40, quantity: 2 },
  { name: "Pen", price: 10, quantity: 5 }
];
console.log(calculateTotalCart(cart, 0.05));`,
  },
  {
    key: 'typescript',
    name: 'TypeScript',
    extension: '.ts',
    defaultSnippet: `interface Student {
  id: number;
  name: string;
  marks: number[];
}

function calculateAverage(student: Student): number {
  if (student.marks.length === 0) return 0;
  const total = student.marks.reduce((acc, curr) => acc + curr, 0);
  return total / student.marks.length;
}

const s: Student = { id: 101, name: "Suresh", marks: [85, 92, 78, 90] };
console.log("Average Marks:", calculateAverage(s));`,
  },
  {
    key: 'java',
    name: 'Java',
    extension: '.java',
    defaultSnippet: `public class PalindromeChecker {
    public static boolean isPalindrome(String str) {
        int left = 0;
        int right = str.length() - 1;
        
        while (left < right) {
            if (str.charAt(left) != str.charAt(right)) {
                return false;
            }
            left++;
            right--;
        }
        return true;
    }

    public static void main(String[] args) {
        String test = "madam";
        System.out.println("Is " + test + " palindrome? " + isPalindrome(test));
    }
}`,
  },
  {
    key: 'cpp',
    name: 'C++',
    extension: '.cpp',
    defaultSnippet: `#include <iostream>
#include <vector>

int findMaxElement(const std::vector<int>& nums) {
    if (nums.empty()) return -1;
    int maxVal = nums[0];
    
    for (size_t i = 1; i < nums.size(); ++i) {
        if (nums[i] > maxVal) {
            maxVal = nums[i];
        }
    }
    return maxVal;
}

int main() {
    std::vector<int> numbers = {14, 82, 35, 99, 41};
    std::cout << "Max: " << findMaxElement(numbers) << std::endl;
    return 0;
}`,
  },
  {
    key: 'go',
    name: 'Go',
    extension: '.go',
    defaultSnippet: `package main

import "fmt"

func fibonacci(n int) []int {
    series := make([]int, n)
    if n > 0 {
        series[0] = 0
    }
    if n > 1 {
        series[1] = 1
    }
    for i := 2; i < n; i++ {
        series[i] = series[i-1] + series[i-2]
    }
    return series
}

func main() {
    fmt.Println(fibonacci(7))
}`,
  },
  {
    key: 'rust',
    name: 'Rust',
    extension: '.rs',
    defaultSnippet: `fn reverse_string(input: &str) -> String {
    input.chars().rev().collect()
}

fn main() {
    let original = "BhashaCode";
    let reversed = reverse_string(original);
    println!("Original: {}, Reversed: {}", original, reversed);
}`,
  },
];
