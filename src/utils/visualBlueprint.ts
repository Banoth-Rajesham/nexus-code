// ============================================================================
// NEXUS CODE VISUAL BLUEPRINT & LINE-BY-LINE EXPLAINER ENGINE
// Generates rich, icon-annotated semantic visual blueprints matching
// line-by-line arrows from the code editor (Excalidraw / Architectural style)
// ============================================================================

export interface VisualBlueprintLine {
  lineNumber: number;
  isEmpty: boolean;
  rawText: string;
  icon: string;
  badge: string;
  title: string;
  detail: string;
  groupTitle: string;
  colorScheme: {
    badgeBg: string;
    badgeText: string;
    border: string;
    accent: string;
  };
}

export interface ArchitectureGroup {
  groupTitle: string;
  icon: string;
  lines: VisualBlueprintLine[];
}

export function parseVisualBlueprint(code: string, _progLang: string = 'python'): {
  lines: VisualBlueprintLine[];
  groups: ArchitectureGroup[];
  totalNonEmpty: number;
} {
  const rawLines = code.split('\n');
  const blueprintLines: VisualBlueprintLine[] = [];
  const groupMap = new Map<string, VisualBlueprintLine[]>();

  rawLines.forEach((raw, idx) => {
    const lineNum = idx + 1;
    const trimmed = raw.trim();

    if (!trimmed) {
      blueprintLines.push({
        lineNumber: lineNum,
        isEmpty: true,
        rawText: '',
        icon: '',
        badge: '',
        title: '',
        detail: '',
        groupTitle: '',
        colorScheme: {
          badgeBg: 'transparent',
          badgeText: 'transparent',
          border: 'transparent',
          accent: 'transparent',
        },
      });
      return;
    }

    // ─── 1. Imports & Toolkits ──────────────────────────────────────────────
    if (/^(import\s+|from\s+)/.test(trimmed)) {
      let icon = '📦';
      let title = 'Import Library';
      let detail = `Imports external library dependencies into current scope.`;
      let badge = 'Toolkit';
      let groupTitle = 'Importing Essential Toolkits';
      let colorScheme = {
        badgeBg: 'bg-sky-500/10',
        badgeText: 'text-sky-300',
        border: 'border-sky-500/30',
        accent: '#38bdf8',
      };

      if (/\bos\b/.test(trimmed)) {
        icon = '💻';
        badge = 'System Info';
        title = 'Access System Info (Env Vars)';
        detail = 'Provides access to operating system interfaces, environment variables, and process info.';
      } else if (/\bre\b|\bregex\b/.test(trimmed)) {
        icon = '🔍';
        badge = 'Pattern Search';
        title = 'Search & Match Patterns';
        detail = 'Compiles and evaluates regular expressions for advanced string search and extraction.';
      } else if (/\bsys\b/.test(trimmed)) {
        icon = '🖥️';
        badge = 'Interpreter';
        title = 'Get Interpreter Path';
        detail = 'Accesses Python runtime parameters, interpreter paths, and standard I/O pipes.';
      } else if (/pathlib|path/i.test(trimmed)) {
        icon = '📁';
        badge = 'Filesystem';
        title = 'Locate Server File';
        detail = 'Constructs cross-platform object-oriented filesystem paths and directory navigation.';
      } else if (/google\.adk\.agents|Agent\b|crewai|langchain|autogen/i.test(trimmed)) {
        icon = '🤖';
        badge = 'AI Agent';
        groupTitle = 'Google AI Connection';
        title = 'Build the Agent';
        detail = 'Constructs autonomous AI agent execution runtime with memory and decision capabilities.';
        colorScheme = {
          badgeBg: 'bg-emerald-500/10',
          badgeText: 'text-emerald-300',
          border: 'border-emerald-500/30',
          accent: '#34d399',
        };
      } else if (/lite_llm|LiteLlm|ollama|openai|gemini|anthropic|models?\./i.test(trimmed)) {
        icon = '🐻';
        badge = 'LLM Model';
        groupTitle = 'Google AI Connection';
        title = 'Connect to Ollama / LLM Model';
        detail = 'Establishes local or cloud LLM inference interface for reasoning and tool invocation.';
        colorScheme = {
          badgeBg: 'bg-purple-500/10',
          badgeText: 'text-purple-300',
          border: 'border-purple-500/30',
          accent: '#c084fc',
        };
      } else if (/llm_response|LlmResponse|streaming/i.test(trimmed)) {
        icon = '📄';
        badge = 'Response Stream';
        groupTitle = 'Google AI Connection';
        title = 'Model Response Parser';
        detail = 'Parses structured output tokens and message chunks from model completions.';
        colorScheme = {
          badgeBg: 'bg-purple-500/10',
          badgeText: 'text-purple-300',
          border: 'border-purple-500/30',
          accent: '#c084fc',
        };
      } else if (/mcp|McpToolset|mcp_session|mcp_tool/i.test(trimmed)) {
        icon = '🧰';
        badge = 'MCP Toolset';
        groupTitle = 'Model Context Protocol (MCP) Setup';
        title = 'Create Toolset & Protocol';
        detail = 'Registers standard MCP servers and toolsets for secure tool calling.';
        colorScheme = {
          badgeBg: 'bg-amber-500/10',
          badgeText: 'text-amber-300',
          border: 'border-amber-500/30',
          accent: '#fbbf24',
        };
      }

      const item: VisualBlueprintLine = {
        lineNumber: lineNum,
        isEmpty: false,
        rawText: trimmed,
        icon,
        badge,
        title,
        detail,
        groupTitle,
        colorScheme,
      };
      blueprintLines.push(item);
      if (!groupMap.has(groupTitle)) groupMap.set(groupTitle, []);
      groupMap.get(groupTitle)!.push(item);
      return;
    }

    // ─── 2. Functions & Callbacks ───────────────────────────────────────────
    const fnMatch = trimmed.match(/^(?:async\s+)?(?:def|function)\s+([a-zA-Z0-9_]+)\s*\((.*?)\)/);
    if (fnMatch) {
      const fnName = fnMatch[1];
      const params = fnMatch[2].trim();
      let icon = '🎯';
      let title = `Define ${fnName}()`;
      let detail = params ? `Accepts parameters: (${params}) to process.` : `Encapsulates reusable procedure.`;
      let badge = 'Function';
      let groupTitle = 'Core Functions & Handlers';
      let colorScheme = {
        badgeBg: 'bg-blue-500/10',
        badgeText: 'text-blue-300',
        border: 'border-blue-500/30',
        accent: '#60a5fa',
      };

      if (/callback|guard|intercept|auth|security|before_/i.test(fnName)) {
        icon = '🛡️';
        badge = 'Security Interceptor';
        groupTitle = 'Security & Interceptors';
        title = 'Callback Interceptor';
        detail = 'Security gate that inspects context, user permissions, and blocks unverified requests.';
        colorScheme = {
          badgeBg: 'bg-rose-500/10',
          badgeText: 'text-rose-300',
          border: 'border-rose-500/30',
          accent: '#f43f5e',
        };
      } else if (/agent|react|chat|prompt|ai/i.test(fnName)) {
        icon = '🤖';
        badge = 'Agent Handler';
        groupTitle = 'Agent Execution Logic';
        title = 'Agent Reaction Flow';
        detail = `Orchestrates agent decision loop with parameters (${params || 'none'}).`;
        colorScheme = {
          badgeBg: 'bg-emerald-500/10',
          badgeText: 'text-emerald-300',
          border: 'border-emerald-500/30',
          accent: '#34d399',
        };
      }

      const item: VisualBlueprintLine = {
        lineNumber: lineNum,
        isEmpty: false,
        rawText: trimmed,
        icon,
        badge,
        title,
        detail,
        groupTitle,
        colorScheme,
      };
      blueprintLines.push(item);
      if (!groupMap.has(groupTitle)) groupMap.set(groupTitle, []);
      groupMap.get(groupTitle)!.push(item);
      return;
    }

    // ─── 3. System Instructions & Rules ─────────────────────────────────────
    if (/^(?:instruction|system_prompt|prompt|rules)\s*=\s*/i.test(trimmed)) {
      const item: VisualBlueprintLine = {
        lineNumber: lineNum,
        isEmpty: false,
        rawText: trimmed,
        icon: '📋',
        badge: 'System Rules',
        title: 'CRM Assistant Rules & Instructions',
        detail: 'System instructions: A comprehensive guide defining persona, constraints, and operational bounds.',
        groupTitle: 'CRM Assistant Rules',
        colorScheme: {
          badgeBg: 'bg-teal-500/10',
          badgeText: 'text-teal-300',
          border: 'border-teal-500/30',
          accent: '#2dd4bf',
        },
      };
      blueprintLines.push(item);
      if (!groupMap.has(item.groupTitle)) groupMap.set(item.groupTitle, []);
      groupMap.get(item.groupTitle)!.push(item);
      return;
    }

    // ─── 4. Toolsets & Registration ─────────────────────────────────────────
    if (/^(?:tools|toolset)\s*=\s*/i.test(trimmed)) {
      const item: VisualBlueprintLine = {
        lineNumber: lineNum,
        isEmpty: false,
        rawText: trimmed,
        icon: '🧰',
        badge: 'Tool Registry',
        title: 'Tool Registration',
        detail: 'Tool Registration: Attaches MCP toolsets and subroutines to the active agent execution loop.',
        groupTitle: 'Model Context Protocol (MCP) Setup',
        colorScheme: {
          badgeBg: 'bg-amber-500/10',
          badgeText: 'text-amber-300',
          border: 'border-amber-500/30',
          accent: '#fbbf24',
        },
      };
      blueprintLines.push(item);
      if (!groupMap.has(item.groupTitle)) groupMap.set(item.groupTitle, []);
      groupMap.get(item.groupTitle)!.push(item);
      return;
    }

    // ─── 5. Returns ─────────────────────────────────────────────────────────
    if (/^return\b/.test(trimmed)) {
      const val = trimmed.replace(/^return\s*/, '').trim();
      const item: VisualBlueprintLine = {
        lineNumber: lineNum,
        isEmpty: false,
        rawText: trimmed,
        icon: '📤',
        badge: 'Return Data',
        title: 'Return Payload Output',
        detail: val ? `Completes function execution and returns payload (${val}).` : 'Exits function execution scope.',
        groupTitle: 'Outputs & Payload',
        colorScheme: {
          badgeBg: 'bg-indigo-500/10',
          badgeText: 'text-indigo-300',
          border: 'border-indigo-500/30',
          accent: '#818cf8',
        },
      };
      blueprintLines.push(item);
      if (!groupMap.has(item.groupTitle)) groupMap.set(item.groupTitle, []);
      groupMap.get(item.groupTitle)!.push(item);
      return;
    }

    // ─── 6. Conditionals (if, elif, else) ────────────────────────────────────
    if (/^(if|elif|else)\b/.test(trimmed)) {
      const cond = trimmed.replace(/^(if|elif)\s+/, '').replace(/:$/, '').trim();
      let title = 'Evaluate Condition';
      let detail = `Checks condition: (${cond}) before executing branch.`;
      if (trimmed.startsWith('else')) {
        title = 'Fallback Branch';
        detail = 'Fallback branch executed when preceding conditions evaluate to false.';
      }
      if (/mobile|user|auth|token/i.test(trimmed)) {
        title = 'Validate Request Arguments';
        detail = "Argument validation: verifies required fields (name, mobile, auth) are present in request context.";
      }

      const item: VisualBlueprintLine = {
        lineNumber: lineNum,
        isEmpty: false,
        rawText: trimmed,
        icon: '⚡',
        badge: 'Branch Logic',
        title,
        detail,
        groupTitle: 'Control Flow & Logic',
        colorScheme: {
          badgeBg: 'bg-yellow-500/10',
          badgeText: 'text-yellow-300',
          border: 'border-yellow-500/30',
          accent: '#facc15',
        },
      };
      blueprintLines.push(item);
      if (!groupMap.has(item.groupTitle)) groupMap.set(item.groupTitle, []);
      groupMap.get(item.groupTitle)!.push(item);
      return;
    }

    // ─── 7. Loops (for, while) ──────────────────────────────────────────────
    if (/^(for|while)\b/.test(trimmed)) {
      const item: VisualBlueprintLine = {
        lineNumber: lineNum,
        isEmpty: false,
        rawText: trimmed,
        icon: '🔄',
        badge: 'Loop Cycle',
        title: 'Iterate Sequence',
        detail: `Sequentially iterates over elements in collection until loop condition completes.`,
        groupTitle: 'Iteration & Loops',
        colorScheme: {
          badgeBg: 'bg-cyan-500/10',
          badgeText: 'text-cyan-300',
          border: 'border-cyan-500/30',
          accent: '#22d3ee',
        },
      };
      blueprintLines.push(item);
      if (!groupMap.has(item.groupTitle)) groupMap.set(item.groupTitle, []);
      groupMap.get(item.groupTitle)!.push(item);
      return;
    }

    // ─── 8. Variable Assignments & Dict / List keys ─────────────────────────
    const assignMatch = trimmed.match(/^([a-zA-Z0-9_]+)\s*(=|\+=|-=|\*=)\s*(.+)/);
    if (assignMatch) {
      const varName = assignMatch[1];
      const val = assignMatch[3];
      const item: VisualBlueprintLine = {
        lineNumber: lineNum,
        isEmpty: false,
        rawText: trimmed,
        icon: '📌',
        badge: 'Variable State',
        title: `Assign ${varName}`,
        detail: `Initializes or updates state variable '${varName}' with value (${val}).`,
        groupTitle: 'State & Variables',
        colorScheme: {
          badgeBg: 'bg-emerald-500/10',
          badgeText: 'text-emerald-300',
          border: 'border-emerald-500/30',
          accent: '#34d399',
        },
      };
      blueprintLines.push(item);
      if (!groupMap.has(item.groupTitle)) groupMap.set(item.groupTitle, []);
      groupMap.get(item.groupTitle)!.push(item);
      return;
    }

    // ─── 9. Dictionary Key-Value Pairs inside literals ──────────────────────
    const kvMatch = trimmed.match(/^(["'][a-zA-Z0-9_ -]+["']|[a-zA-Z0-9_]+)\s*:\s*(.+)/);
    if (kvMatch) {
      const keyName = kvMatch[1].replace(/["']/g, '');
      const item: VisualBlueprintLine = {
        lineNumber: lineNum,
        isEmpty: false,
        rawText: trimmed,
        icon: '🗂️',
        badge: 'Data Property',
        title: `Property '${keyName}'`,
        detail: `Sets payload property '${keyName}' for structured return data or configuration.`,
        groupTitle: 'Outputs & Payload',
        colorScheme: {
          badgeBg: 'bg-indigo-500/10',
          badgeText: 'text-indigo-300',
          border: 'border-indigo-500/30',
          accent: '#818cf8',
        },
      };
      blueprintLines.push(item);
      if (!groupMap.has(item.groupTitle)) groupMap.set(item.groupTitle, []);
      groupMap.get(item.groupTitle)!.push(item);
      return;
    }

    // ─── 10. Comments ───────────────────────────────────────────────────────
    if (/^(#|\/\/|\/\*)/.test(trimmed)) {
      const commentText = trimmed.replace(/^(#|\/\/|\/\*)\s*/, '').replace(/\*\/$/, '');
      const item: VisualBlueprintLine = {
        lineNumber: lineNum,
        isEmpty: false,
        rawText: trimmed,
        icon: '💡',
        badge: 'Comment',
        title: 'Developer Annotation',
        detail: commentText || 'Inline architectural note or explanation.',
        groupTitle: 'Developer Notes',
        colorScheme: {
          badgeBg: 'bg-slate-500/10',
          badgeText: 'text-slate-400',
          border: 'border-slate-500/30',
          accent: '#94a3b8',
        },
      };
      blueprintLines.push(item);
      if (!groupMap.has(item.groupTitle)) groupMap.set(item.groupTitle, []);
      groupMap.get(item.groupTitle)!.push(item);
      return;
    }

    // ─── 11. Closing Brackets or General Statement ──────────────────────────
    if (/^[}\])]+$/.test(trimmed)) {
      const item: VisualBlueprintLine = {
        lineNumber: lineNum,
        isEmpty: false,
        rawText: trimmed,
        icon: '📦',
        badge: 'Block Closure',
        title: 'End of Scope',
        detail: 'Closes code structure block and returns indentation to outer context.',
        groupTitle: 'Control Flow & Logic',
        colorScheme: {
          badgeBg: 'bg-slate-500/10',
          badgeText: 'text-slate-400',
          border: 'border-slate-500/30',
          accent: '#64748b',
        },
      };
      blueprintLines.push(item);
      return;
    }

    // General fallback
    const item: VisualBlueprintLine = {
      lineNumber: lineNum,
      isEmpty: false,
      rawText: trimmed,
      icon: '⚙️',
      badge: 'Statement',
      title: 'Execute Instruction',
      detail: `Executes instruction: ${trimmed}`,
      groupTitle: 'Execution Pipeline',
      colorScheme: {
        badgeBg: 'bg-slate-500/10',
        badgeText: 'text-slate-300',
        border: 'border-slate-500/30',
        accent: '#94a3b8',
      },
    };
    blueprintLines.push(item);
    if (!groupMap.has(item.groupTitle)) groupMap.set(item.groupTitle, []);
    groupMap.get(item.groupTitle)!.push(item);
  });

  const groups: ArchitectureGroup[] = Array.from(groupMap.entries()).map(([groupTitle, lines]) => {
    const firstLine = lines[0];
    return {
      groupTitle,
      icon: firstLine ? firstLine.icon : '📌',
      lines,
    };
  });

  const totalNonEmpty = blueprintLines.filter((l) => !l.isEmpty).length;

  return { lines: blueprintLines, groups, totalNonEmpty };
}
