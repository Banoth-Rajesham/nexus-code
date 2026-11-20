/**
 * Pyodide Web Worker for NexusCode / BhashaCode
 * 100% Offline, Client-Side execution & Step-by-Step Tracer
 */

let pyodide = null;
let isInitializing = false;
let initPromise = null;

async function getPyodide() {
  if (pyodide) return pyodide;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    importScripts('/pyodide/pyodide.js');
    const py = await self.loadPyodide({
      indexURL: '/pyodide/',
    });
    pyodide = py;
    return py;
  })();

  return initPromise;
}

// Friendly error explanations for students
const ERROR_EXPLANATIONS = {
  ZeroDivisionError: {
    meaning: "Division by zero is mathematically undefined. Your code tried to divide a number by 0.",
    hint: "Check the divisor variable before dividing (e.g. use `if y != 0:` to protect the division)."
  },
  IndexError: {
    meaning: "List index out of range. You tried to access an index that does not exist in the list.",
    hint: "Remember Python indexes start at 0 and end at len(list) - 1. Check your loop bounds or index."
  },
  KeyError: {
    meaning: "The dictionary key you requested was not found.",
    hint: "Check spelling or check if key exists using `if key in my_dict:` before accessing."
  },
  NameError: {
    meaning: "A variable or function is used before it was assigned or defined.",
    hint: "Check for typos in variable names, or make sure the variable is initialized above this line."
  },
  TypeError: {
    meaning: "An operation or function was applied to an inappropriate type (e.g. adding string and integer).",
    hint: "Convert values to compatible types using int(), str(), or float() before operating on them."
  },
  ValueError: {
    meaning: "A function received an argument with the right type but an inappropriate value.",
    hint: "Verify input values (e.g. int('hello') fails because 'hello' is not a valid number)."
  },
  AttributeError: {
    meaning: "The object does not have the attribute or method you tried to call.",
    hint: "Check the spelling of the method or verify the type of the object you are calling it on."
  },
  RecursionError: {
    meaning: "Maximum recursion depth exceeded (stack overflow).",
    hint: "Make sure your recursive function has a base case (e.g. `if n <= 1: return 1`) that terminates."
  },
  SyntaxError: {
    meaning: "Python encountered invalid syntax that breaks grammar rules.",
    hint: "Check for missing colons (`:`), unclosed parentheses, or quotes on this line."
  },
  IndentationError: {
    meaning: "Indentation does not match the expected indentation level for this block.",
    hint: "Use consistent 4 spaces per indentation level. Avoid mixing tabs and spaces."
  }
};

const PYTHON_HARNESS = `
import sys as _sys
import ast as _ast
import json as _json
import types as _types
import inspect as _inspect
import importlib.abc as _importlib_abc
import importlib.util as _importlib_util

class _AutoMock(_types.ModuleType):
    """Universal Mock Module for uninstalled packages in browser environment."""
    def __init__(self, name):
        super().__init__(name)
        self.__name__ = name
        self.__all__ = []

    def __getattr__(self, attr):
        if attr.startswith('__') and attr.endswith('__'):
            raise AttributeError(attr)
        sub = _AutoMock(f"{self.__name__}.{attr}")
        setattr(self, attr, sub)
        return sub

    def __call__(self, *args, **kwargs):
        return _AutoMock(f"{self.__name__}()")

    def __getitem__(self, item):
        return _AutoMock(f"{self.__name__}[{item}]")

    def __iter__(self):
        return iter([])

    def __repr__(self):
        return f"<module '{self.__name__}' (auto-mocked)>"

class _AutoMockLoader(_importlib_abc.Loader):
    def __init__(self, fullname):
        self.fullname = fullname

    def create_module(self, spec):
        return _AutoMock(self.fullname)

    def exec_module(self, module):
        pass

class _AutoMockFinder(_importlib_abc.MetaPathFinder):
    def find_spec(self, fullname, path, target=None):
        if fullname in _sys.modules:
            return None
        return _importlib_util.spec_from_loader(fullname, _AutoMockLoader(fullname))

if not any(isinstance(f, _AutoMockFinder) for f in _sys.meta_path):
    _sys.meta_path.append(_AutoMockFinder())

class StepLimitExceeded(Exception):
    pass

class NeedInputException(Exception):
    def __init__(self, prompt, line):
        self.prompt = prompt
        self.line = line
        super().__init__(prompt)

MAX_STEPS = 2000

def analyze_loops(code_str):
    try:
        tree = _ast.parse(code_str)
        loops = {}
        for node in _ast.walk(tree):
            if isinstance(node, _ast.For):
                total = None
                if isinstance(node.iter, _ast.Call) and getattr(node.iter.func, 'id', '') == 'range':
                    args = node.iter.args
                    if len(args) == 1 and isinstance(args[0], _ast.Constant):
                        total = args[0].value
                    elif len(args) == 2 and isinstance(args[0], _ast.Constant) and isinstance(args[1], _ast.Constant):
                        total = args[1].value - args[0].value
                loops[node.lineno] = {
                    'type': 'for',
                    'start': node.lineno,
                    'end': getattr(node, 'end_lineno', node.lineno + 50),
                    'total': total,
                    'var': getattr(node.target, 'id', 'item')
                }
            elif isinstance(node, _ast.While):
                loops[node.lineno] = {
                    'type': 'while',
                    'start': node.lineno,
                    'end': getattr(node, 'end_lineno', node.lineno + 50),
                    'total': None
                }
        return loops
    except:
        return {}

def run_trace(code_str, input_list=[]):
    trace = []
    output_chunks = []
    input_queue = list(input_list)
    step_count = 0
    has_exceeded = False
    error_info = None

    loop_definitions = analyze_loops(code_str)
    loop_counters = {} # lineno -> current_iteration

    class CustomStdout:
        def write(self, text):
            output_chunks.append(text)
        def flush(self):
            pass

    def custom_input(prompt=""):
        if prompt:
            output_chunks.append(str(prompt))
        if len(input_queue) > 0:
            val = input_queue.pop(0)
            output_chunks.append(str(val) + "\\n")
            return str(val)
        else:
            frame = _sys._getframe(1)
            line = frame.f_lineno if frame.f_code.co_filename == '<user_code>' else 1
            raise NeedInputException(str(prompt), line)

    def safe_repr(val):
        try:
            t = type(val).__name__
            r = repr(val)
            if len(r) > 120:
                r = r[:117] + "..."
            return t, r
        except:
            return "unknown", "<unprintable>"

    def to_viz(v, depth=0):
        # Structured, size-limited copy of a value for the 3D data view
        try:
            if v is None or isinstance(v, bool):
                return {"k": "prim", "t": type(v).__name__, "r": repr(v)}
            if isinstance(v, (int, float)):
                return {"k": "prim", "t": type(v).__name__, "r": repr(v)[:24]}
            if isinstance(v, str):
                if depth == 0 and 0 < len(v) <= 40:
                    return {"k": "str", "items": [{"k": "prim", "t": "str", "r": c} for c in v]}
                return {"k": "prim", "t": "str", "r": repr(v)[:24]}
            if depth < 2 and isinstance(v, (list, tuple)) and len(v) <= 64:
                return {"k": "list", "t": type(v).__name__, "items": [to_viz(x, depth + 1) for x in v]}
            if depth < 2 and isinstance(v, (set, frozenset)) and len(v) <= 64:
                return {"k": "list", "t": type(v).__name__, "items": [to_viz(x, depth + 1) for x in sorted(v, key=repr)]}
            if depth < 1 and isinstance(v, dict) and len(v) <= 32:
                return {"k": "dict", "t": "dict", "items": [[repr(dk)[:20], to_viz(dv, depth + 1)] for dk, dv in v.items()]}
            return {"k": "prim", "t": type(v).__name__, "r": repr(v)[:24]}
        except:
            return {"k": "prim", "t": "unknown", "r": "?"}

    def serialize_var(k, v):
        try:
            # 1. Module
            if isinstance(v, _types.ModuleType):
                mod_name = getattr(v, '__name__', k)
                return {
                    "name": k,
                    "type": "module",
                    "value": f"{mod_name} (imported module)",
                    "isMeta": True
                }
            # 2. Class
            if isinstance(v, type):
                cls_name = getattr(v, '__name__', k)
                return {
                    "name": k,
                    "type": "class",
                    "value": f"{cls_name} (class)",
                    "isMeta": True
                }
            # 3. Function / Method
            if isinstance(v, (_types.FunctionType, _types.BuiltinFunctionType, _types.MethodType)):
                fn_name = getattr(v, '__name__', k)
                return {
                    "name": k,
                    "type": "function",
                    "value": f"<function {fn_name}>",
                    "isMeta": True
                }
            # 4. Typing constructs
            mod_str = getattr(type(v), '__module__', '')
            if mod_str == 'typing' or getattr(v, '__module__', '') == 'typing':
                return {
                    "name": k,
                    "type": "typing",
                    "value": str(v),
                    "isMeta": True
                }

            # 5. Object Instance (e.g. agent = AIAgent(...))
            t_name = type(v).__name__
            is_primitive = isinstance(v, (int, float, complex, bool, str, bytes, bytearray, list, tuple, set, frozenset, dict)) or v is None

            if not is_primitive and hasattr(v, '__dict__'):
                attrs = {}
                if isinstance(v.__dict__, dict):
                    for ak, av in v.__dict__.items():
                        if not ak.startswith('__'):
                            at, ar = safe_repr(av)
                            attrs[ak] = {"name": ak, "type": at, "value": ar}
                return {
                    "name": k,
                    "type": f"{t_name} object",
                    "value": f"{t_name} object",
                    "isMeta": False,
                    "isInstance": True,
                    "attrs": attrs
                }

            # 6. Standard primitive/data variable
            t, r = safe_repr(v)
            return {
                "name": k,
                "type": t,
                "value": r,
                "isMeta": False,
                "isInstance": False,
                "viz": to_viz(v)
            }
        except:
            return {
                "name": k,
                "type": "unknown",
                "value": "<unserializable>",
                "isMeta": False,
                "isInstance": False
            }

    def tracer(frame, event, arg):
        nonlocal step_count, has_exceeded
        if frame.f_code.co_filename != '<user_code>':
            return tracer

        if event in ('line', 'return'):
            step_count += 1
            if step_count > MAX_STEPS:
                has_exceeded = True
                raise StepLimitExceeded()

            lineno = frame.f_lineno

            # Detect loops
            loop_info = None
            if lineno in loop_definitions:
                loop_def = loop_definitions[lineno]
                curr_iter = loop_counters.get(lineno, 0) + 1
                loop_counters[lineno] = curr_iter
                if loop_def['total'] is not None:
                    loop_info = f"Loop {curr_iter} of {loop_def['total']}"
                else:
                    loop_info = f"Loop iteration {curr_iter}"
            else:
                # Check if currently inside any active loop body
                for l_line, l_def in loop_definitions.items():
                    if l_def['start'] <= lineno <= l_def['end']:
                        curr_iter = loop_counters.get(l_line, 1)
                        if l_def['total'] is not None:
                            loop_info = f"Loop {curr_iter} of {l_def['total']}"
                        else:
                            loop_info = f"Loop iteration {curr_iter}"
                        break

            # Filter user locals - NEVER exclude user's json/sys/etc.
            user_locals = {}
            for k, v in frame.f_locals.items():
                if k.startswith('__'):
                    continue
                if k in ('print', 'input') and (v is print or v is custom_input):
                    continue
                user_locals[k] = serialize_var(k, v)

            # Build call stack: only frames (Global or functions), NEVER print globals dict
            stack_snapshot = []
            curr = frame
            while curr:
                if curr.f_code.co_filename == '<user_code>':
                    fname = getattr(curr.f_code, 'co_qualname', curr.f_code.co_name)
                    if curr.f_code.co_name == '<module>':
                        stack_snapshot.append({
                            "function": "Global (main program)",
                            "args": {},
                            "line": curr.f_lineno
                        })
                    else:
                        arg_count = curr.f_code.co_argcount + getattr(curr.f_code, 'co_kwonlyargcount', 0)
                        param_names = curr.f_code.co_varnames[:arg_count]
                        args = {}
                        for p in param_names:
                            if p in curr.f_locals:
                                if p == 'self':
                                    args['self'] = 'self'
                                else:
                                    args[p] = safe_repr(curr.f_locals[p])[1]
                        stack_snapshot.append({
                            "function": fname,
                            "args": args,
                            "line": curr.f_lineno
                        })
                curr = curr.f_back
            stack_snapshot.reverse()

            trace.append({
                "step": step_count,
                "line": lineno,
                "event": event,
                "locals": user_locals,
                "outputSoFar": "".join(output_chunks),
                "stack": stack_snapshot,
                "loopInfo": loop_info
            })

        return tracer

    custom_stdout = CustomStdout()
    old_stdout = _sys.stdout
    old_stderr = _sys.stderr
    old_input = _sys.modules['builtins'].input
    _sys.stdout = custom_stdout
    _sys.stderr = custom_stdout
    _sys.modules['builtins'].input = custom_input

    try:
        compiled = compile(code_str, '<user_code>', 'exec')
        _sys.settrace(tracer)
        exec_globals = {
            '__name__': '__main__',
            'print': print,
            'input': custom_input
        }
        exec(compiled, exec_globals)
    except NeedInputException as nie:
        return {
            "status": "need_input",
            "prompt": nie.prompt,
            "line": nie.line,
            "trace": trace,
            "outputSoFar": "".join(output_chunks)
        }
    except StepLimitExceeded:
        return {
            "status": "capped",
            "message": "Execution paused: Program exceeded 2,000 steps (potential infinite loop). Showing first 2,000 steps.",
            "trace": trace,
            "outputSoFar": "".join(output_chunks),
            "totalSteps": len(trace)
        }
    except Exception as exc:
        tb = _sys.exc_info()[2]
        err_line = 1
        while tb:
            if tb.tb_frame.f_code.co_filename == '<user_code>':
                err_line = tb.tb_lineno
            tb = tb.tb_next
        if isinstance(exc, SyntaxError) and getattr(exc, 'lineno', None):
            err_line = exc.lineno
        error_info = {
            "type": type(exc).__name__,
            "message": str(exc),
            "line": err_line
        }
    finally:
        _sys.settrace(None)
        _sys.stdout = old_stdout
        _sys.stderr = old_stderr
        _sys.modules['builtins'].input = old_input

    return {
        "status": "error" if error_info else "ok",
        "trace": trace,
        "error": error_info,
        "output": "".join(output_chunks),
        "totalSteps": len(trace)
    }

def run_code_simple(code_str, input_list=[]):
    output_chunks = []
    input_queue = list(input_list)

    class CustomStdout:
        def write(self, text):
            output_chunks.append(text)
        def flush(self):
            pass

    def custom_input(prompt=""):
        if prompt:
            output_chunks.append(str(prompt))
        if len(input_queue) > 0:
            val = input_queue.pop(0)
            output_chunks.append(str(val) + "\\n")
            return str(val)
        else:
            frame = _sys._getframe(1)
            line = frame.f_lineno if frame.f_code.co_filename == '<user_code>' else 1
            raise NeedInputException(str(prompt), line)

    custom_stdout = CustomStdout()
    old_stdout = _sys.stdout
    old_stderr = _sys.stderr
    old_input = _sys.modules['builtins'].input
    _sys.stdout = custom_stdout
    _sys.stderr = custom_stdout
    _sys.modules['builtins'].input = custom_input

    error_info = None
    try:
        compiled = compile(code_str, '<user_code>', 'exec')
        exec_globals = {
            '__name__': '__main__',
            'print': print,
            'input': custom_input
        }
        exec(compiled, exec_globals)
    except NeedInputException as nie:
        return {
            "status": "need_input",
            "prompt": nie.prompt,
            "line": nie.line,
            "outputSoFar": "".join(output_chunks)
        }
    except Exception as exc:
        tb = _sys.exc_info()[2]
        err_line = 1
        while tb:
            if tb.tb_frame.f_code.co_filename == '<user_code>':
                err_line = tb.tb_lineno
            tb = tb.tb_next
        if isinstance(exc, SyntaxError) and getattr(exc, 'lineno', None):
            err_line = exc.lineno
        error_info = {
            "type": type(exc).__name__,
            "message": str(exc),
            "line": err_line
        }
    finally:
        _sys.stdout = old_stdout
        _sys.stderr = old_stderr
        _sys.modules['builtins'].input = old_input

    return {
        "status": "error" if error_info else "ok",
        "output": "".join(output_chunks),
        "error": error_info
    }
`;

self.onmessage = async (e) => {
  const { id, type, code, inputs = [] } = e.data;

  try {
    const py = await getPyodide();

    // Warm up python harness
    py.runPython(PYTHON_HARNESS);

    if (type === 'INIT') {
      self.postMessage({ id, type: 'INIT_SUCCESS' });
      return;
    }

    if (type === 'RUN') {
      const startTime = performance.now();
      py.globals.set('__student_code__', code);
      py.globals.set('__student_inputs__', py.toPy(inputs));

      const rawJson = py.runPython(`
import json
json.dumps(run_code_simple(__student_code__, __student_inputs__))
      `);
      const result = JSON.parse(rawJson);
      const timeMs = Math.round(performance.now() - startTime);

      if (result.status === 'need_input') {
        self.postMessage({
          id,
          type: 'NEED_INPUT',
          prompt: result.prompt,
          line: result.line,
          outputSoFar: result.outputSoFar,
        });
        return;
      }

      if (result.error) {
        const expl = ERROR_EXPLANATIONS[result.error.type] || {
          meaning: result.error.message,
          hint: "Review the code around this line and verify inputs and variable types."
        };
        self.postMessage({
          id,
          type: 'RUN_COMPLETE',
          success: false,
          output: (result.output ? result.output + '\n' : '') + `${result.error.type}: ${result.error.message} (Line ${result.error.line})`,
          error: {
            ...result.error,
            meaning: expl.meaning,
            hint: expl.hint
          },
          timeMs,
          engine: 'Pyodide (Browser Web Worker)'
        });
      } else {
        self.postMessage({
          id,
          type: 'RUN_COMPLETE',
          success: true,
          output: result.output || '(Program finished with no output)',
          timeMs,
          engine: 'Pyodide (Browser Web Worker)'
        });
      }
      return;
    }

    if (type === 'TRACE') {
      const startTime = performance.now();
      py.globals.set('__student_code__', code);
      py.globals.set('__student_inputs__', py.toPy(inputs));

      const rawJson = py.runPython(`
import json
json.dumps(run_trace(__student_code__, __student_inputs__))
      `);
      const result = JSON.parse(rawJson);
      const timeMs = Math.round(performance.now() - startTime);

      if (result.status === 'need_input') {
        self.postMessage({
          id,
          type: 'NEED_INPUT',
          prompt: result.prompt,
          line: result.line,
          outputSoFar: result.outputSoFar,
          traceSoFar: result.trace
        });
        return;
      }

      let errorData = null;
      if (result.error) {
        const expl = ERROR_EXPLANATIONS[result.error.type] || {
          meaning: result.error.message,
          hint: "Check variable values and syntax on this line."
        };
        errorData = {
          ...result.error,
          meaning: expl.meaning,
          hint: expl.hint
        };
      }

      self.postMessage({
        id,
        type: 'TRACE_COMPLETE',
        success: !errorData,
        trace: result.trace || [],
        totalSteps: result.totalSteps || (result.trace ? result.trace.length : 0),
        output: result.output || '',
        error: errorData,
        status: result.status,
        message: result.message,
        timeMs,
        engine: 'Pyodide Web Worker'
      });
      return;
    }
  } catch (err) {
    self.postMessage({
      id,
      type: 'WORKER_ERROR',
      error: {
        type: err.name || 'RuntimeError',
        message: err.message,
        line: 1,
        meaning: "Execution failed inside the Pyodide Web Worker: " + err.message,
        hint: "Please check your code syntax."
      }
    });
  }
};
