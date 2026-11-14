// ============================================================================
// NEXUS CODE TRANSLATION RESOURCE — ENGLISH
// Natural, clear, engineering-grade line-by-line visual blueprint explanations
// ============================================================================

export const en = {
  // Section Titles
  sections: {
    overview: 'Code Overview & Architecture',
    lineByLine: 'Line-by-Line Visual Blueprint',
    executionFlow: 'Execution Flow & Logic Trace',
    expectedOutput: 'Expected Output',
    simpleSummary: 'Architecture Summary',
    syntaxIssues: 'Syntax Insights & Checks',
    unsupported: 'Unsupported Constructs',
  },

  // Line-level construct templates
  templates: {
    empty_line: 'Empty line — spacing for clean code readability.',
    comment_line: 'Developer comment: "{text}". Ignored at runtime.',

    // Functions
    function_def: "Defines function '{name}' to encapsulate reusable logic.",
    function_def_params: "Defines function '{name}' accepting parameters ({params}).",
    function_recursive: "Recursive function '{name}' that calls itself to break down problems.",
    function_call: "Executes function '{name}' and consumes its return result.",
    arrow_function: "Defines concise arrow function '{name}'.",

    // Returns
    return_val: "Completes function execution and returns calculated value '{value}'.",
    return_void: "Terminates execution and returns control to caller.",

    // Conditionals
    if_condition: "Conditional branch: executes inner block only if ({condition}) is truthy.",
    elif_condition: "Alternative branch: evaluates ({condition}) if preceding checks were false.",
    else_block: "Fallback branch: executes when none of the preceding conditions matched.",

    // Loops
    for_range: "Iterates counter '{var}' from 0 up to {end}.",
    for_range_start_end: "Iterates counter '{var}' from {start} to {end}.",
    for_collection: "Iterates over each element in '{collection}' as '{var}'.",
    while_loop: "Repeats block continuously while condition ({condition}) holds true.",
    loop_break: "Immediately breaks out of the enclosing loop.",
    loop_continue: "Skips remainder of current iteration and proceeds to next item.",

    // Variables & Assignments
    var_assign: "Assigns value '{value}' to variable '{name}'.",
    var_init_zero: "Initializes counter or accumulator '{name}' to 0.",
    var_init_empty_list: "Initializes empty list '{name}'.",
    var_update_add: "Increments variable '{name}' by '{value}'.",
    var_update_sub: "Decrements variable '{name}' by '{value}'.",
    var_update_mul: "Multiplies variable '{name}' by '{value}'.",
    var_update_div: "Divides variable '{name}' by '{value}'.",

    // Collections
    list_created: "Initializes list '{name}' with values [{items}].",
    dict_created: "Initializes dictionary '{name}' with key-value data mappings.",

    // Classes & OOP
    class_def: "Declares class blueprint '{name}' for object instantiation.",
    class_init: "Constructor __init__ initializing new instance attributes.",
    class_method: "Defines method '{method}' belonging to class '{name}'.",

    // I/O & Output
    print_statement: "Outputs calculated value ({content}) to standard console.",
    console_log: "Logs expression ({content}) to browser / system console.",
    input_prompt: "Halts execution to request input from user terminal.",

    // Imports
    import_module: "Imports module '{module}' for system and library capabilities.",
    import_from: "Imports member '{item}' from module '{module}'.",

    // Error handling
    try_block: "Guarded try block: intercepts runtime errors to prevent program crashes.",
    except_block: "Catches and handles raised exceptions safely.",
    finally_block: "Cleanup block executed unconditionally after try/except.",

    // Fallbacks
    general_statement: "Executes instruction: {statement}.",
    unsupported_construct: "Language construct detected. Executed by standard runtime.",
  },

  // Examples when helpful
  examples: {
    function: 'Encapsulates logic — takes input arguments and computes a result.',
    loop: 'Sequentially processes each item in a collection or numeric range.',
    condition: 'Evaluates logic expression and executes corresponding branch.',
    variable: 'Named memory location holding state or reference to data.',
    return: 'Passes output value back to caller and exits current scope.',
    print: 'Displays formatted strings or variables on the screen.',
  },

  // Overview templates
  overview: {
    with_class: "This program implements object-oriented architecture via '{classes}' to encapsulate state and methods.",
    with_recursive: "This program leverages recursive decomposition in '{functions}' to resolve tasks hierarchically.",
    with_functions: "This program processes inputs through modular function pipeline: '{functions}'.",
    with_loops: "This program utilizes iterative loops to traverse data and compute final outcomes.",
    general: "This program executes top-to-bottom sequential instructions to produce results.",
  },

  // Execution flow steps
  executionFlow: {
    start: '1. Program starts execution from the top of the file.',
    functions_loaded: '2. Functions ({functions}) are defined and registered in memory.',
    classes_loaded: '2. Class blueprint ({classes}) is registered in memory.',
    variables_set: '3. Variables and initial states are assigned.',
    loop_running: '4. Loop begins iterating through items sequentially.',
    result_printed: '5. Computed outputs are written to console / returned.',
  },

  // Logic summary
  simpleLogicSummary: {
    function_and_loop: 'High-level logic: The code accepts input, iterates through data items step by step, and returns the computed outcome once criteria are met.',
    function_only: 'High-level logic: Encapsulates reusable algorithmic operations that execute whenever called with parameters.',
    general: 'High-level logic: Linear execution pipeline following standard control flow from entry point to termination.',
  },

  // Expected output
  expectedOutput: {
    prints_found: 'Console output: {output}',
    function_return: 'Returns calculated value when invoked with valid arguments.',
    completed: 'Execution completes successfully with valid internal state.',
  },
};

