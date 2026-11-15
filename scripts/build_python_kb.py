#!/usr/bin/env python3
"""
Nexus Code - Python Knowledge Base Auto-Generator
Extracts the first docstring sentence and parameter signatures of public
functions, classes, and methods across Python standard library and installed
packages. Formats summaries using beginner-friendly transformation rules.

Outputs: data/kb/python.generated.json
"""

import inspect
import json
import os
import re
import sys
from typing import Any, Dict, List, Optional

# List of target modules to inspect
TARGET_MODULES = [
    # Python Standard Library
    "math",
    "os",
    "os.path",
    "sys",
    "json",
    "re",
    "pathlib",
    "datetime",
    "collections",
    "itertools",
    "functools",
    "urllib.parse",
    "random",
    "time",
    "shutil",
    "csv",
    "hashlib",
    "sqlite3",
    "tkinter",
    # Third-Party Libraries
    "numpy",
    "pandas",
    "requests",
    "flask",
    "fastapi",
    "matplotlib.pyplot",
    "sklearn",
    "pytest",
    "pygame",
    "fastmcp",
]

def clean_docstring_sentence(raw_doc: Optional[str]) -> Optional[str]:
    """Extracts first sentence from docstring and applies beginner conversion rules."""
    if not raw_doc or not raw_doc.strip():
        return None

    # Remove Sphinx/restructuredText directives and doc comments
    text = raw_doc.strip()
    lines = text.splitlines()
    clean_lines = []
    for line in lines:
        stripped = line.strip()
        if not stripped:
            if clean_lines:
                break
            continue
        if stripped.startswith(("..", ":param", ":return", ":type", ":raises", ">>>")):
            break
        clean_lines.append(stripped)

    if not clean_lines:
        return None

    first_chunk = " ".join(clean_lines)

    # Match first complete sentence
    match = re.search(r"^(.*?(\.|\!|\?))(\s+[A-Z]|$)", first_chunk)
    sentence = match.group(1) if match else first_chunk

    # Strip unwanted prefix signatures (e.g., "sqrt(x) -> float\n")
    if "->" in sentence and "(" in sentence and sentence.index("(") < sentence.index("->"):
        parts = sentence.split("->", 1)
        if len(parts) > 1:
            rest = parts[1].strip()
            # If doc follows
            rest_match = re.search(r"[A-Z].*", rest)
            if rest_match:
                sentence = rest_match.group(0)

    sentence = sentence.strip()
    if not sentence:
        return None

    # Beginner conversion transformations
    replacements = [
        (r"^Return the\b", "Gives back the"),
        (r"^Return a\b", "Gives back a"),
        (r"^Return an\b", "Gives back an"),
        (r"^Returns the\b", "Gives back the"),
        (r"^Returns a\b", "Gives back a"),
        (r"^Returns an\b", "Gives back an"),
        (r"^Return\b", "Gives back"),
        (r"^Returns\b", "Gives back"),
        (r"^Initialize self.*", "Sets up the instance with given options."),
        (r"^Calculate the\b", "Computes the"),
        (r"^Calculates the\b", "Computes the"),
        (r"^Determine whether\b", "Checks whether"),
        (r"^Determines whether\b", "Checks whether"),
        (r"^Determine if\b", "Checks if"),
        (r"^Determines if\b", "Checks if"),
        (r"^Check if\b", "Checks if"),
        (r"^Checks if\b", "Checks if"),
        (r"^Convert the\b", "Transforms the"),
        (r"^Converts the\b", "Transforms the"),
    ]

    for pattern, repl in replacements:
        sentence = re.sub(pattern, repl, sentence, flags=re.IGNORECASE)

    # Ensure sentence ends with a period
    if not sentence.endswith((".", "!", "?")):
        sentence += "."

    # Capitalize first letter
    sentence = sentence[0].upper() + sentence[1:]

    # Remove banned phrases if present
    banned = [
        ("Executes instruction", "Runs action"),
        ("Evaluate condition", "Check test"),
        ("Encapsulates", "Contains"),
        ("orchestrates", "coordinates"),
        ("orchestrating", "coordinating"),
        ("procedural", "step-by-step"),
        ("Retrieves and returns matching", "Finds and returns"),
    ]
    for b_old, b_new in banned:
        sentence = re.sub(re.escape(b_old), b_new, sentence, flags=re.IGNORECASE)

    # Keep summary concise (max ~120 chars)
    if len(sentence) > 130:
        words = sentence[:120].rsplit(" ", 1)[0]
        sentence = words + "..."

    return sentence

def get_params(obj: Any) -> List[str]:
    """Safely extracts parameter names for callable."""
    try:
        sig = inspect.signature(obj)
        params = []
        for name, param in sig.parameters.items():
            if name in ("self", "cls"):
                continue
            if param.kind == inspect.Parameter.VAR_POSITIONAL:
                params.append(f"*{name}")
            elif param.kind == inspect.Parameter.VAR_KEYWORD:
                params.append(f"**{name}")
            else:
                params.append(name)
        return params
    except Exception:
        return []

def harvest_module(mod_name: str) -> Dict[str, Dict[str, Any]]:
    """Inspects a module and its public callables."""
    entries: Dict[str, Dict[str, Any]] = {}
    try:
        mod = __import__(mod_name, fromlist=["*"])
    except Exception:
        return entries

    # Public items in module
    for item_name in dir(mod):
        if item_name.startswith("_"):
            continue
        try:
            item = getattr(mod, item_name)
        except Exception:
            continue

        full_key = f"{mod_name}.{item_name}"
        short_key = item_name

        if inspect.isfunction(item) or inspect.isbuiltin(item) or inspect.isclass(item):
            doc = inspect.getdoc(item)
            summary = clean_docstring_sentence(doc)
            if summary:
                params = get_params(item)
                entry_data = {
                    "summary": summary,
                    "params": params,
                    "source": "docstring"
                }
                entries[full_key] = entry_data
                # Also include short key if not conflicting
                if short_key not in entries:
                    entries[short_key] = entry_data

            # If it's a class, inspect its public methods
            if inspect.isclass(item):
                for meth_name in dir(item):
                    if meth_name.startswith("_") and meth_name != "__init__":
                        continue
                    try:
                        meth = getattr(item, meth_name)
                        if inspect.isfunction(meth) or inspect.ismethod(meth):
                            m_doc = inspect.getdoc(meth)
                            m_summary = clean_docstring_sentence(m_doc)
                            if m_summary:
                                m_params = get_params(meth)
                                meth_key = f"{full_key}.{meth_name}"
                                entries[meth_key] = {
                                    "summary": m_summary,
                                    "params": m_params,
                                    "source": "docstring"
                                }
                                dot_meth = f".{meth_name}"
                                if dot_meth not in entries:
                                    entries[dot_meth] = {
                                        "summary": m_summary,
                                        "params": m_params,
                                        "source": "docstring"
                                    }
                    except Exception:
                        continue

    return entries

def main():
    print("Building Nexus Code Python Knowledge Base...")
    all_kb: Dict[str, Dict[str, Any]] = {}

    for mod in TARGET_MODULES:
        try:
            res = harvest_module(mod)
            print(f"  Harvested {len(res):4d} entries from {mod}")
            all_kb.update(res)
        except Exception as e:
            print(f"  Skipped {mod} ({e})")

    out_dir = os.path.join("data", "kb")
    os.makedirs(out_dir, exist_ok=True)
    out_file = os.path.join(out_dir, "python.generated.json")

    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(all_kb, f, indent=2, ensure_ascii=False)

    print(f"\nSuccessfully generated {len(all_kb)} KB entries saved to {out_file}")

if __name__ == "__main__":
    main()
