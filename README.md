# NexusCode

An intelligent in-browser Python IDE that explains every line of code in plain English, visualizes variable state step-by-step, and generates automatic flowcharts.

---

## 🏗️ Architecture & How It Works

NexusCode is built around **deterministic, zero-hallucination analysis** so beginners and developers get accurate, instant explanations without AI guesswork.

```
       ┌────────────────────────────────────────────────────────┐
       │                 User Code in Editor                    │
       └───────────────────────────┬────────────────────────────┘
                                   │
         ┌─────────────────────────┴─────────────────────────┐
         ▼                                                   ▼
┌──────────────────────────────┐            ┌──────────────────────────────┐
│  Client-Side AST Analyzer    │            │    In-Browser Pyodide Engine │
│  (Web Tree-Sitter WASM)      │            │    (Web Worker Sandbox)      │
│  - Parses syntax tree        │            │    - Safe execution sandbox  │
│  - Generates line breakdowns │            │    - Records variable states │
│  - Builds Mermaid flowchart  │            │    - Captures step history   │
└──────────────┬───────────────┘            └──────────────┬───────────────┘
               │                                           │
               └─────────────────────┬─────────────────────┘
                                     │
                                     ▼
               ┌───────────────────────────────────────────┐
               │    Deep Explainer UI (WHAT, WHY, HOW)     │
               └─────────────────────┬─────────────────────┘
                                     │ (Optional fallback)
                                     ▼
               ┌───────────────────────────────────────────┐
               │    Express Backend + Gemini API           │
               └───────────────────────────────────────────┘
```

### Core Execution Flow:
1. **Editor Input:** User types Python code in the browser editor.
2. **AST Parsing (Tree-Sitter):** Real-time client-side parser breaks code into syntax nodes without needing network calls.
3. **Deterministic Explanations:** Local rules engine converts AST nodes into plain-English explanations (identical, accurate output every time).
4. **Sandboxed Execution (Pyodide):** Runs Python in an isolated Web Worker via WebAssembly with safety timeouts and step-by-step state snapshots.
5. **Visual Flowcharts:** Control structures (loops, conditionals, functions) are converted into Mermaid flowcharts on the fly.
6. **AI Assistant (Backend):** For freeform Q&A and complex errors, Express routes requests to the Gemini API with structured prompts.

### Key Project Structure:
- `src/utils/pythonTreeSitterEngine.ts` — Web Tree-Sitter AST parser and statement extractor
- `src/utils/pyodideRunner.ts` — Web Worker runner managing sandboxed Python execution
- `src/utils/ruleBasedAnalyzer.ts` — Offline, deterministic explanation generator
- `src/components/DeepExplanationView.tsx` — 4-layer code inspector (What, Why, How, Verify)
- `src/components/workspace/` — Code editor, terminal console, variable table, and step timeline
- `server.ts` — Express API server for production hosting and Gemini AI integration

---

## 🛠️ Tech Stack

### Frontend
- **Framework:** React 19 + TypeScript
- **Bundler:** Vite 8
- **Styling:** Tailwind CSS 4
- **Icons:** Lucide React, Iconify
- **Animations:** Motion
- **Code Execution:** Pyodide (WebAssembly in Web Worker)
- **Code Analysis:** Web Tree-Sitter (AST parser)
- **Diagrams:** Mermaid.js

### Backend
- **Runtime:** Node.js (v18+) + TypeScript (`tsx`)
- **Server:** Express.js
- **Security & Performance:** Helmet, Compression
- **AI Integration:** Google Gemini API (`@google/genai`)
- **Engines:** Deterministic AST parser & rule-based analyzer

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js (v18 or higher)
- npm

### 2. Clone & Install
```bash
git clone <repository-url>
cd nexus-code
npm install
```

### 3. Environment Variables (Optional)
Create a `.env` file in the root directory:
```env
PORT=3000
GEMINI_API_KEY=your_gemini_api_key_here
```
*(Note: Core line-by-line explanation, flowcharts, and Pyodide runtime work completely offline without an API key).*

### 4. Run Development Server
```bash
npm run dev
```

- **Local:** [http://localhost:3000](http://localhost:3000)
- **Network (Mobile / Mac mini):** `http://<your-ip>:3000`

---

## 📜 Available Scripts

- `npm run dev` — Start the development server (Express + Vite)
- `npm run build` — Create optimized production build
- `npm start` — Run production server
- `npm test` — Run the 11 test suites
- `npm run lint` — Type-check with TypeScript (`tsc --noEmit`)
