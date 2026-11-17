/**
 * Pyodide Web Worker Manager for NexusCode
 * Runs Python code and step-by-step trace safely 100% inside browser Web Worker
 */

export interface TraceStep {
  step: number;
  line: number;
  event: string;
  locals: Record<
    string,
    {
      name: string;
      type: string;
      value: string;
      isMeta?: boolean;
      isInstance?: boolean;
      attrs?: Record<string, { name: string; type: string; value: string }>;
    }
  >;
  outputSoFar: string;
  stack: Array<{ function: string; args: Record<string, string>; line: number }>;
  loopInfo?: string | null;
}

export interface WorkerErrorInfo {
  type: string;
  message: string;
  line: number;
  meaning: string;
  hint: string;
}

export interface TraceResult {
  success: boolean;
  trace: TraceStep[];
  totalSteps: number;
  output: string;
  error?: WorkerErrorInfo | null;
  status?: 'ok' | 'capped' | 'error' | 'need_input';
  message?: string;
  timeMs: number;
  engine: string;
}

export interface RunResult {
  success: boolean;
  output: string;
  timeMs: number;
  engine: string;
  error?: WorkerErrorInfo | null;
}

let activeWorker: Worker | null = null;
let currentTimeoutId: any = null;

export function terminateCurrentWorker() {
  if (currentTimeoutId) {
    clearTimeout(currentTimeoutId);
    currentTimeoutId = null;
  }
  if (activeWorker) {
    try {
      activeWorker.terminate();
    } catch {}
    activeWorker = null;
  }
}

function getOrCreateWorker(): Worker {
  if (!activeWorker) {
    activeWorker = new Worker('/workers/pythonWorker.js');
    // Pre-warm Pyodide
    activeWorker.postMessage({ id: 'warmup', type: 'INIT' });
  }
  return activeWorker;
}

/** Check if code imports Pygame (Pygame graphics not supported in Step mode) */
export function isPygameCode(code: string): boolean {
  return /^\s*(import\s+pygame|from\s+pygame\b)/m.test(code);
}

/** Run Python code inside browser Pyodide Web Worker */
export function runPythonInWorker(
  code: string,
  inputs: string[] = [],
  onNeedInput?: (prompt: string, line: number, resume: (val: string) => void) => void,
  timeoutMs: number = 10000
): Promise<RunResult> {
  return new Promise((resolve) => {
    terminateCurrentWorker();
    const worker = getOrCreateWorker();
    const reqId = `run_${Date.now()}_${Math.random()}`;

    let inputAccumulator = [...inputs];

    currentTimeoutId = setTimeout(() => {
      terminateCurrentWorker();
      resolve({
        success: false,
        output: '[Execution Timed Out]: Python program exceeded the 10-second safety limit (potential infinite loop). Execution aborted.',
        timeMs: timeoutMs,
        engine: 'Pyodide Web Worker (Safety Timeout)',
      });
    }, timeoutMs);

    const handleMessage = (e: MessageEvent) => {
      const data = e.data;
      if (data.id !== reqId && data.id !== 'warmup') return;

      if (data.type === 'NEED_INPUT') {
        if (onNeedInput) {
          onNeedInput(data.prompt || 'Input requested:', data.line || 1, (userInput: string) => {
            inputAccumulator.push(userInput);
            // Re-run with accumulated inputs
            worker.postMessage({
              id: reqId,
              type: 'RUN',
              code,
              inputs: inputAccumulator,
            });
          });
        } else {
          // No callback provided, feed empty string
          inputAccumulator.push('');
          worker.postMessage({
            id: reqId,
            type: 'RUN',
            code,
            inputs: inputAccumulator,
          });
        }
        return;
      }

      if (data.type === 'RUN_COMPLETE') {
        if (currentTimeoutId) clearTimeout(currentTimeoutId);
        worker.removeEventListener('message', handleMessage);
        resolve({
          success: data.success,
          output: data.output,
          timeMs: data.timeMs || 0,
          engine: data.engine || 'Pyodide Web Worker',
          error: data.error,
        });
      }

      if (data.type === 'WORKER_ERROR') {
        if (currentTimeoutId) clearTimeout(currentTimeoutId);
        worker.removeEventListener('message', handleMessage);
        resolve({
          success: false,
          output: `Worker Error: ${data.error?.message || 'Unknown error'}`,
          timeMs: 0,
          engine: 'Pyodide Web Worker',
          error: data.error,
        });
      }
    };

    worker.addEventListener('message', handleMessage);
    worker.postMessage({
      id: reqId,
      type: 'RUN',
      code,
      inputs: inputAccumulator,
    });
  });
}

/** Record step-by-step trace using Pyodide sys.settrace */
export function tracePythonInWorker(
  code: string,
  inputs: string[] = [],
  onNeedInput?: (prompt: string, line: number, resume: (val: string) => void) => void,
  timeoutMs: number = 10000
): Promise<TraceResult> {
  return new Promise((resolve) => {
    terminateCurrentWorker();
    const worker = getOrCreateWorker();
    const reqId = `trace_${Date.now()}_${Math.random()}`;

    let inputAccumulator = [...inputs];

    currentTimeoutId = setTimeout(() => {
      terminateCurrentWorker();
      resolve({
        success: false,
        trace: [],
        totalSteps: 0,
        output: '[Step Tracer Timed Out]: Program exceeded the 10-second limit during execution. Aborted.',
        timeMs: timeoutMs,
        engine: 'Pyodide Web Worker (Safety Timeout)',
      });
    }, timeoutMs);

    const handleMessage = (e: MessageEvent) => {
      const data = e.data;
      if (data.id !== reqId && data.id !== 'warmup') return;

      if (data.type === 'NEED_INPUT') {
        if (onNeedInput) {
          onNeedInput(data.prompt || 'Input requested:', data.line || 1, (userInput: string) => {
            inputAccumulator.push(userInput);
            worker.postMessage({
              id: reqId,
              type: 'TRACE',
              code,
              inputs: inputAccumulator,
            });
          });
        } else {
          inputAccumulator.push('');
          worker.postMessage({
            id: reqId,
            type: 'TRACE',
            code,
            inputs: inputAccumulator,
          });
        }
        return;
      }

      if (data.type === 'TRACE_COMPLETE') {
        if (currentTimeoutId) clearTimeout(currentTimeoutId);
        worker.removeEventListener('message', handleMessage);
        resolve({
          success: data.success,
          trace: data.trace || [],
          totalSteps: data.totalSteps || 0,
          output: data.output || '',
          error: data.error || null,
          status: data.status,
          message: data.message,
          timeMs: data.timeMs || 0,
          engine: data.engine || 'Pyodide Web Worker',
        });
      }

      if (data.type === 'WORKER_ERROR') {
        if (currentTimeoutId) clearTimeout(currentTimeoutId);
        worker.removeEventListener('message', handleMessage);
        resolve({
          success: false,
          trace: [],
          totalSteps: 0,
          output: `Worker Error: ${data.error?.message || 'Unknown error'}`,
          error: data.error,
          timeMs: 0,
          engine: 'Pyodide Web Worker',
        });
      }
    };

    worker.addEventListener('message', handleMessage);
    worker.postMessage({
      id: reqId,
      type: 'TRACE',
      code,
      inputs: inputAccumulator,
    });
  });
}
