// ============================================================================
// NEXUS CODE - MULTI-LANGUAGE PRESET SAMPLES
// High quality, beginner-friendly sample programs for all supported languages
// ============================================================================

export interface PresetSample {
  id: string;
  name: string;
  language: string;
  description: string;
  files: Array<{
    name: string;
    content: string;
    isEntry?: boolean;
  }>;
}

export const WORKSPACE_PRESETS: Record<string, PresetSample[]> = {
  python: [
    {
      id: 'bouncing_ball',
      name: 'Pygame Bouncing Ball',
      language: 'python',
      description: 'Interactive graphical 2D physics simulation loop',
      files: [
        {
          name: 'main.py',
          isEntry: true,
          content: `import pygame

pygame.init()
screen = pygame.display.set_mode((640, 480))
pygame.display.set_caption("Bouncing Ball Simulation")
clock = pygame.time.Clock()

x, y = 320, 240
dx, dy = 3, 3
radius = 20
running = True

while running:
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False

    x += dx
    y += dy

    if x - radius < 0 or x + radius > 640:
        dx = -dx
    if y - radius < 0 or y + radius > 480:
        dy = -dy

    screen.fill((20, 24, 32))
    pygame.draw.circle(screen, (56, 189, 248), (x, y), radius)
    pygame.display.flip()
    clock.tick(60)

pygame.quit()
print("Pygame simulation loop completed successfully.")`,
        },
      ],
    },
    {
      id: 'modular_math',
      name: 'Modular Math Toolkit',
      language: 'python',
      description: 'Multi-file Python module with imports and utility functions',
      files: [
        {
          name: 'main.py',
          isEntry: true,
          content: `from utils import calculate_sum, calculate_average
from helper import format_result

# Dataset of test numbers
numbers = [12, 24, 36, 48, 60]

total = calculate_sum(numbers)
avg = calculate_average(numbers)

print(format_result("Total Sum", total))
print(format_result("Average Value", avg))`,
        },
        {
          name: 'utils.py',
          content: `def calculate_sum(numbers):
    total = 0
    for number in numbers:
        total += number
    return total

def calculate_average(numbers):
    if not numbers:
        return 0
    return calculate_sum(numbers) / len(numbers)`,
        },
        {
          name: 'helper.py',
          content: `def format_result(label, value):
    return f"==> {label}: {value}"`,
        },
      ],
    },
    {
      id: 'binary_search',
      name: 'Binary Search Algorithm',
      language: 'python',
      description: 'Logarithmic O(log N) divide-and-conquer search pattern',
      files: [
        {
          name: 'main.py',
          isEntry: true,
          content: `def binary_search(arr, target):
    low = 0
    high = len(arr) - 1

    while low <= high:
        mid = (low + high) // 2
        guess = arr[mid]

        if guess == target:
            return mid
        elif guess > target:
            high = mid - 1
        else:
            low = mid + 1

    return -1

numbers = [2, 5, 8, 12, 16, 23, 38, 56, 72, 91]
target = 23

index = binary_search(numbers, target)
print(f"Target {target} found at index: {index}")`,
        },
      ],
    },
    {
      id: 'fibonacci_recursion',
      name: 'Recursion & Fibonacci',
      language: 'python',
      description: 'Recursive divide-and-conquer function with base conditions',
      files: [
        {
          name: 'main.py',
          isEntry: true,
          content: `def fibonacci(n):
    if n <= 0:
        return 0
    elif n == 1:
        return 1
    return fibonacci(n - 1) + fibonacci(n - 2)

print("Fibonacci Sequence (first 10 terms):")
for i in range(10):
    print(f"Term {i}: {fibonacci(i)}")`,
        },
      ],
    },
  ],

  javascript: [
    {
      id: 'array_transforms',
      name: 'Array Transformations',
      language: 'javascript',
      description: 'Higher-order functions (map, filter, reduce)',
      files: [
        {
          name: 'index.js',
          isEntry: true,
          content: `// Sample student dataset
const students = [
  { name: "Alice", score: 85 },
  { name: "Bob", score: 58 },
  { name: "Charlie", score: 92 },
  { name: "David", score: 74 },
  { name: "Emma", score: 63 }
];

// 1. Filter passing grades (>= 60)
const passingStudents = students.filter(s => s.score >= 60);

// 2. Map student names
const honorRoll = passingStudents.map(s => s.name.toUpperCase());

// 3. Calculate average score
const totalScore = students.reduce((acc, s) => acc + s.score, 0);
const averageScore = totalScore / students.length;

console.log("Passing Students:", honorRoll);
console.log("Class Average Score:", averageScore.toFixed(1));`,
        },
      ],
    },
    {
      id: 'class_counter',
      name: 'ES6 Class State Manager',
      language: 'javascript',
      description: 'Object-oriented state encapsulation and methods',
      files: [
        {
          name: 'index.js',
          isEntry: true,
          content: `class BankAccount {
  constructor(owner, initialBalance = 0) {
    this.owner = owner;
    this.balance = initialBalance;
    this.history = [];
  }

  deposit(amount) {
    if (amount <= 0) throw new Error("Deposit amount must be positive");
    this.balance += amount;
    this.history.push(\`Deposited: +\${amount}\`);
    return this.balance;
  }

  withdraw(amount) {
    if (amount > this.balance) throw new Error("Insufficient funds");
    this.balance -= amount;
    this.history.push(\`Withdrew: -\${amount}\`);
    return this.balance;
  }

  printStatement() {
    console.log(\`=== Statement for \${this.owner} ===\`);
    console.log(\`Current Balance: $\${this.balance}\`);
    console.log("Transactions:", this.history);
  }
}

const myAccount = new BankAccount("Alex", 100);
myAccount.deposit(50);
myAccount.withdraw(30);
myAccount.printStatement();`,
        },
      ],
    },
  ],

  typescript: [
    {
      id: 'typed_interfaces',
      name: 'Typed Interfaces & Generics',
      language: 'typescript',
      description: 'Strict TypeScript interfaces and generic collection functions',
      files: [
        {
          name: 'index.ts',
          isEntry: true,
          content: `interface UserProfile {
  id: string;
  username: string;
  email: string;
  isAdmin: boolean;
  tags: string[];
}

function filterAdmins(users: UserProfile[]): UserProfile[] {
  return users.filter(user => user.isAdmin);
}

const sampleUsers: UserProfile[] = [
  { id: "u1", username: "sarah", email: "sarah@nexus.io", isAdmin: true, tags: ["engineering", "lead"] },
  { id: "u2", username: "mark", email: "mark@nexus.io", isAdmin: false, tags: ["design"] },
  { id: "u3", username: "lina", email: "lina@nexus.io", isAdmin: true, tags: ["security"] }
];

const admins = filterAdmins(sampleUsers);
console.log("Admin accounts count:", admins.length);
admins.forEach(admin => console.log(\` - \${admin.username} (\${admin.email})\`));`,
        },
      ],
    },
  ],

  java: [
    {
      id: 'java_class_blueprint',
      name: 'Java Class Blueprint',
      language: 'java',
      description: 'Object-oriented Java application with static main method',
      files: [
        {
          name: 'Main.java',
          isEntry: true,
          content: `public class Main {
    public static void main(String[] args) {
        System.out.println("Nexus Code Java Simulation");
        int sum = 0;
        for (int i = 1; i <= 10; i++) {
            sum += i;
        }
        System.out.println("Sum of 1 to 10 is: " + sum);
    }
}`,
        },
      ],
    },
  ],

  cpp: [
    {
      id: 'cpp_vector_demo',
      name: 'C++ STL Vector Algorithm',
      language: 'cpp',
      description: 'Modern C++ standard template library vectors and loop calculations',
      files: [
        {
          name: 'main.cpp',
          isEntry: true,
          content: `#include <iostream>
#include <vector>
#include <numeric>

int main() {
    std::vector<int> numbers = {5, 10, 15, 20, 25};
    int total = std::accumulate(numbers.begin(), numbers.end(), 0);

    std::cout << "Vector elements count: " << numbers.size() << std::endl;
    std::cout << "Sum of elements: " << total << std::endl;
    return 0;
}`,
        },
      ],
    },
  ],

  go: [
    {
      id: 'go_functions',
      name: 'Go Functions & Slices',
      language: 'go',
      description: 'Go package main with slice processing routines',
      files: [
        {
          name: 'main.go',
          isEntry: true,
          content: `package main

import "fmt"

func calculateSum(nums []int) int {
    total := 0
    for _, n := range nums {
        total += n
    }
    return total
}

func main() {
    numbers := []int{10, 20, 30, 40, 50}
    sum := calculateSum(numbers)
    fmt.Printf("Total slice sum: %d\\n", sum)
}`,
        },
      ],
    },
  ],

  rust: [
    {
      id: 'rust_pattern',
      name: 'Rust Pattern Matching & Vectors',
      language: 'rust',
      description: 'Safe Rust memory iteration and match statements',
      files: [
        {
          name: 'main.rs',
          isEntry: true,
          content: `fn main() {
    let numbers = vec![1, 2, 3, 4, 5, 6];
    let mut evens = Vec::new();

    for &n in &numbers {
        if n % 2 == 0 {
            evens.push(n);
        }
    }

    println!("Original numbers: {:?}", numbers);
    println!("Even numbers: {:?}", evens);
}`,
        },
      ],
    },
  ],
};
