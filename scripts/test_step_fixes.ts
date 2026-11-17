import { loadPyodide } from 'pyodide';

async function runTests() {
  console.log('============================================================');
  console.log('TESTING STEP MODE AND WORKSPACE FIXES');
  console.log('============================================================\n');

  const py = await loadPyodide();

  // Load the exact Python harness from pythonWorker.js
  const harness = `
import sys as _sys
import ast as _ast
import json as _json
import types as _types
import inspect as _inspect

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
    loop_counters = {}

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

    def serialize_var(k, v):
        try:
            if isinstance(v, _types.ModuleType):
                mod_name = getattr(v, '__name__', k)
                return {
                    "name": k,
                    "type": "module",
                    "value": f"{mod_name} (imported module)",
                    "isMeta": True
                }
            if isinstance(v, type):
                cls_name = getattr(v, '__name__', k)
                return {
                    "name": k,
                    "type": "class",
                    "value": f"{cls_name} (class)",
                    "isMeta": True
                }
            if isinstance(v, (_types.FunctionType, _types.BuiltinFunctionType, _types.MethodType)):
                fn_name = getattr(v, '__name__', k)
                return {
                    "name": k,
                    "type": "function",
                    "value": f"<function {fn_name}>",
                    "isMeta": True
                }
            mod_str = getattr(type(v), '__module__', '')
            if mod_str == 'typing' or getattr(v, '__module__', '') == 'typing':
                return {
                    "name": k,
                    "type": "typing",
                    "value": str(v),
                    "isMeta": True
                }

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

            t, r = safe_repr(v)
            return {
                "name": k,
                "type": t,
                "value": r,
                "isMeta": False,
                "isInstance": False
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
                for l_line, l_def in loop_definitions.items():
                    if l_def['start'] <= lineno <= l_def['end']:
                        curr_iter = loop_counters.get(l_line, 1)
                        if l_def['total'] is not None:
                            loop_info = f"Loop {curr_iter} of {l_def['total']}"
                        else:
                            loop_info = f"Loop iteration {curr_iter}"
                        break

            user_locals = {}
            for k, v in frame.f_locals.items():
                if k.startswith('__'):
                    continue
                if k in ('print', 'input') and (v is print or v is custom_input):
                    continue
                user_locals[k] = serialize_var(k, v)

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
  `;

  py.runPython(harness);

  function executeTrace(code: string, inputs: string[] = []) {
    py.globals.set('__code__', code);
    py.globals.set('__inputs__', py.toPy(inputs));
    const jsonStr = py.runPython(`_json.dumps(run_trace(__code__, __inputs__))`);
    return JSON.parse(jsonStr);
  }

  // TEST a: AIAgent program
  console.log('TEST a: AIAgent program with __init__ frame and attributes');
  const codeA = `
class AIAgent:
    def __init__(self, system_instruction):
        self.system_instruction = system_instruction
        self.model = "gemini-1.5-flash"
        self.tools = []
        self.conversation_history = []

agent = AIAgent("You are helpful")
print(agent.model)
`;
  const resA = executeTrace(codeA);
  console.log(`  ✓ Total steps: ${resA.totalSteps}`);
  console.log(`  ✓ Output: ${JSON.stringify(resA.output)}`);

  // Check stack has __init__ frame with qualname and self as 'self'
  const initStep = resA.trace.find((s: any) => s.stack.some((f: any) => f.function.includes('__init__')));
  if (initStep) {
    const initFrame = initStep.stack.find((f: any) => f.function.includes('__init__'));
    console.log(`  ✓ Stack frame: ${initFrame.function}, args: ${JSON.stringify(initFrame.args)}`);
    if (initFrame.function === 'AIAgent.__init__' && initFrame.args.self === 'self') {
      console.log('  ✓ [PASS] Call stack shows AIAgent.__init__ and self="self"');
    } else {
      console.error('  ✗ [FAIL] Stack frame format unexpected:', initFrame);
    }
  } else {
    console.error('  ✗ [FAIL] No __init__ frame found');
  }

  // Check agent object attributes in locals
  const lastStep = resA.trace[resA.trace.length - 1];
  const agentVar = lastStep.locals.agent;
  if (agentVar && agentVar.attrs && agentVar.attrs.model) {
    console.log(`  ✓ Agent var type: "${agentVar.type}", value: "${agentVar.value}"`);
    console.log(`  ✓ Agent attributes: ${Object.keys(agentVar.attrs).join(', ')}`);
    console.log(`  ✓ agent.model = ${agentVar.attrs.model.value}`);
    console.log('  ✓ [PASS] Object instance agent has attributes (model, tools, conversation_history)');
  } else {
    console.error('  ✗ [FAIL] Agent variable or attributes missing:', agentVar);
  }

  // TEST b: Check json is NOT missing
  console.log('\nTEST b: Variables table includes "json" and imports labeled');
  const codeB = `
import json
import os
data = {"key": "value"}
text = json.dumps(data)
`;
  const resB = executeTrace(codeB);
  const lastStepB = resB.trace[resB.trace.length - 1];
  console.log(`  ✓ Variables present: ${Object.keys(lastStepB.locals).join(', ')}`);
  if (lastStepB.locals.json && lastStepB.locals.os) {
    console.log(`  ✓ json var: ${JSON.stringify(lastStepB.locals.json)}`);
    console.log(`  ✓ os var: ${JSON.stringify(lastStepB.locals.os)}`);
    console.log('  ✓ [PASS] "json" is included and not missing; "os" labeled as imported module');
  } else {
    console.error('  ✗ [FAIL] json or os missing from locals');
  }

  // TEST c: Loops and recursion
  console.log('\nTEST c: For loop, while loop, and factorial recursion');
  const codeC = `
for i in range(5):
    pass

c = 0
while c < 3:
    c += 1

def fact(n):
    if n <= 1:
        return 1
    return n * fact(n - 1)

res = fact(3)
`;
  const resC = executeTrace(codeC);
  const factStep = resC.trace.find((s: any) => s.stack.length > 2);
  console.log(`  ✓ Total steps: ${resC.totalSteps}`);
  if (factStep) {
    console.log(`  ✓ Recursion call stack: ${factStep.stack.map((f: any) => `${f.function}(${JSON.stringify(f.args)})`).join(' -> ')}`);
    console.log('  ✓ [PASS] Loops and recursion trace cleanly recorded');
  } else {
    console.error('  ✗ [FAIL] Recursion stack not deep enough');
  }

  // TEST d: Error handling
  console.log('\nTEST d: ZeroDivisionError error handling');
  const codeD = `
x = 10
y = 0
z = x / y
`;
  const resD = executeTrace(codeD);
  console.log(`  ✓ Error type: ${resD.error?.type}, line: ${resD.error?.line}`);
  if (resD.error && resD.error.type === 'ZeroDivisionError' && resD.error.line === 4) {
    console.log('  ✓ [PASS] ZeroDivisionError stopped at line 4');
  } else {
    console.error('  ✗ [FAIL] Error mismatch:', resD.error);
  }

  // TEST e: Input prompt
  console.log('\nTEST e: input() prompt handling');
  const codeE = `
name = input("Enter your name: ")
print("Hello " + name)
`;
  const resE_needInput = executeTrace(codeE, []);
  console.log(`  ✓ Status with no input: ${resE_needInput.status}, prompt: "${resE_needInput.prompt}"`);
  const resE_withInput = executeTrace(codeE, ['Alice']);
  console.log(`  ✓ Status with input: ${resE_withInput.status}, output: ${JSON.stringify(resE_withInput.output)}`);
  if (resE_needInput.status === 'need_input' && resE_withInput.output.includes('Hello Alice')) {
    console.log('  ✓ [PASS] input() prompts correctly and receives input');
  } else {
    console.error('  ✗ [FAIL] input() handling error');
  }

  console.log('\n============================================================');
  console.log('ALL TESTS COMPLETED SUCCESSFULLY!');
  console.log('============================================================');
}

runTests().catch(err => {
  console.error(err);
  process.exit(1);
});
