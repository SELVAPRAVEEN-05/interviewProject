"use client";

import { getYjsProviderForRoom } from "@liveblocks/yjs";
import { useRoom } from "@liveblocks/react/suspense";
import { useCallback, useEffect, useState } from "react";
import { Editor } from "@monaco-editor/react";
import { editor } from "monaco-editor";
import { MonacoBinding } from "y-monaco";
import { Awareness } from "y-protocols/awareness";
import { Cursors } from "../cursors";
import { Toolbar } from "../toolbar";
import { Avatars } from "../avatar";

// Types for output
interface CodeOutput {
  stdout: string;
  stderr: string;
  error?: string;
  exitCode?: number;
}

// Language configurations for different code execution
const LANGUAGE_CONFIGS = {
  c: {
    name: "C",
    fileExtension: ".c",
    compileCommand: "gcc -o output",
    runCommand: "./output",
  },
  cpp: {
    name: "C++",
    fileExtension: ".cpp",
    compileCommand: "g++ -o output",
    runCommand: "./output",
  },
  python: {
    name: "Python",
    fileExtension: ".py",
    runCommand: "python3",
  },
  javascript: {
    name: "JavaScript",
    fileExtension: ".js",
    runCommand: "node",
  },
  java: {
    name: "Java",
    fileExtension: ".java",
    compileCommand: "javac",
    runCommand: "java",
  },
};

// Add this after your imports
import { loader } from '@monaco-editor/react';
const getTemplateForLanguage = (lang: string): string => {
  switch (lang) {
    case 'python':
      return '# Python starter code\n\ndef main():\n    print("Hello, World!")\n\nif __name__ == "__main__":\n    main()';
    case 'java':
      return 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}';
    case 'cpp':
      return '#include <iostream>\n\nint main() {\n    std::cout << "Hello, World!" << std::endl;\n    return 0;\n}';
    case 'c':
      return '#include <stdio.h>\n\nint main() {\n    printf("Hello, World!\\n");\n    return 0;\n}';
    case 'javascript':
      return '// JavaScript starter code\n\nfunction main() {\n    console.log("Hello, World!");\n}\n\nmain();';
    default:
      return '';
  }
};
// Before your component:
loader.init().then((monaco) => {
  // Python language features
  monaco.languages.registerCompletionItemProvider('python', {
    provideCompletionItems: (model, position) => {
      const word = model.getWordUntilPosition(position);
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn
      };

      return {
        suggestions: [
          { label: 'print', kind: monaco.languages.CompletionItemKind.Function, insertText: 'print(${1:value})', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
          { label: 'if', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'if ${1:condition}:\n\t${2}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
          { label: 'for', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'for ${1:item} in ${2:items}:\n\t${3}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
          // Add more Python snippets as needed
        ]
      };
    }
  });

  // C++ language features
  monaco.languages.registerCompletionItemProvider('cpp', {
    provideCompletionItems: (model, position) => {
      const word = model.getWordUntilPosition(position);
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn
      };

      return {
        suggestions: [
          { label: 'include', kind: monaco.languages.CompletionItemKind.Keyword, insertText: '#include <${1:iostream}>', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
          { label: 'cout', kind: monaco.languages.CompletionItemKind.Function, insertText: 'std::cout << ${1:value} << std::endl;', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
          { label: 'if', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'if (${1:condition}) {\n\t${2}\n}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
          // Add more C++ snippets as needed
        ]
      };
    }
  });

  // Java language features
  monaco.languages.registerCompletionItemProvider('java', {
    provideCompletionItems: (model, position) => {
      const word = model.getWordUntilPosition(position);
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn
      };

      return {
        suggestions: [
          { label: 'System.out.println', kind: monaco.languages.CompletionItemKind.Method, insertText: 'System.out.println(${1:value});', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
          { label: 'public class', kind: monaco.languages.CompletionItemKind.Class, insertText: 'public class ${1:ClassName} {\n\t${2}\n}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
          { label: 'main', kind: monaco.languages.CompletionItemKind.Method, insertText: 'public static void main(String[] args) {\n\t${1}\n}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
          // Add more Java snippets as needed
        ]
      };
    }
  });

  // C language features
  monaco.languages.registerCompletionItemProvider('c', {
    provideCompletionItems: (model, position) => {
      const word = model.getWordUntilPosition(position);
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn
      };

      return {
        suggestions: [
          { label: 'include', kind: monaco.languages.CompletionItemKind.Keyword, insertText: '#include <${1:stdio.h}>', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
          { label: 'printf', kind: monaco.languages.CompletionItemKind.Function, insertText: 'printf("${1:%s}\\n", ${2:value});', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
          { label: 'main', kind: monaco.languages.CompletionItemKind.Function, insertText: 'int main() {\n\t${1}\n\treturn 0;\n}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
          // Add more C snippets as needed
        ]
      };
    }
  });
});
loader.config({
  paths: {
    vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.36.1/min/vs'
  }
});

// Ensure these languages are loaded
const languages = ['python', 'c', 'cpp', 'java'];
languages.forEach(lang => {
  loader.init().then(monaco => {
    import(`monaco-editor/esm/vs/basic-languages/${lang}/${lang}.contribution.js`);
  });
});
// Replace mockCodeExecution with this real implementation
const executeCodeWithJudge0 = async (
  code: string,
  lang: string
): Promise<CodeOutput> => {
  // Judge0 language IDs mapping
  const languageIds: Record<string, number> = {
    c: 50,       // C (GCC 9.2.0)
    cpp: 54,     // C++ (GCC 9.2.0)
    python: 71,  // Python (3.8.1)
    javascript: 63, // JavaScript (Node.js 12.14.0)
    java: 62,    // Java (OpenJDK 13.0.1)
  };

  const languageId = languageIds[lang];

  if (!languageId) {
    return {
      stdout: "",
      stderr: `Unsupported language: ${lang}`,
      exitCode: 1,
    };
  }

  try {
    // You need a RapidAPI key for Judge0
    const RAPIDAPI_KEY = process.env.NEXT_PUBLIC_RAPIDAPI_KEY;

    if (!RAPIDAPI_KEY) {
      throw new Error("Missing API key for Judge0");
    }

    // Submit code to Judge0 API
    const submitResponse = await fetch('https://judge0-ce.p.rapidapi.com/submissions?base64_encoded=false&wait=true', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com',
        'X-RapidAPI-Key': RAPIDAPI_KEY,
      },
      body: JSON.stringify({
        language_id: languageId,
        source_code: code,
        stdin: '',
      }),
    });

    if (!submitResponse.ok) {
      throw new Error(`API error: ${submitResponse.statusText}`);
    }

    const submission = await submitResponse.json();

    if (!submission.token) {
      throw new Error("Failed to get submission token");
    }

    // Poll for result
    const output = await pollSubmissionResult(submission.token, RAPIDAPI_KEY);

    return {
      stdout: output.stdout || '',
      stderr: output.stderr || output.compile_output || '',
      exitCode: output.status?.id === 3 ? 0 : 1, // 3 = Accepted
    };
  } catch (error) {
    return {
      stdout: '',
      stderr: '',
      error: error instanceof Error ? error.message : 'Failed to execute code',
      exitCode: 1,
    };
  }
};

// Helper function to poll for results
const pollSubmissionResult = async (token: string, apiKey: string, attempts = 10): Promise<any> => {
  if (attempts <= 0) {
    throw new Error("Timed out waiting for execution result");
  }

  const response = await fetch(
    `https://judge0-ce.p.rapidapi.com/submissions/${token}?base64_encoded=false&fields=stdout,stderr,status_id,compile_output,status`,
    {
      method: 'GET',
      headers: {
        'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com',
        'X-RapidAPI-Key': apiKey,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`API error: ${response.statusText}`);
  }

  const result = await response.json();

  // Status IDs: 1 = In Queue, 2 = Processing
  if (result.status?.id <= 2) {
    // Wait before trying again
    await new Promise(resolve => setTimeout(resolve, 1000));
    return pollSubmissionResult(token, apiKey, attempts - 1);
  }

  return result;
};
// Run Button Component
function RunButton({
  onClick,
  isRunning,
  language,
}: {
  onClick: () => void;
  isRunning: boolean;
  language: string;
}) {
  const config = LANGUAGE_CONFIGS[language as keyof typeof LANGUAGE_CONFIGS];

  return (
    <button
      onClick={onClick}
      disabled={isRunning}
      className={`
        inline-flex items-center px-4 py-2 text-sm font-medium rounded-md
        transition-all duration-200 min-w-[100px] justify-center
        ${
          isRunning
            ? "bg-orange-500 text-white cursor-not-allowed"
            : "bg-green-600 hover:bg-green-700 text-white hover:shadow-md"
        }
      `}
    >
      {isRunning ? (
        <>
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              className="opacity-25"
            ></circle>
            <path
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              className="opacity-75"
            ></path>
          </svg>
          Running...
        </>
      ) : (
        <>
          <svg
            className="mr-2 h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h1m4 0h1m-6-8h8a2 2 0 012 2v8a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2z"
            />
          </svg>
          Run {config?.name || language}
        </>
      )}
    </button>
  );
}

// Output Panel Component
function OutputPanel({ output }: { output: CodeOutput | null }) {
  return (
    <div className="h-full flex flex-col bg-gray-900 border-t border-gray-700">
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center space-x-2">
          <h3 className="text-sm font-medium text-gray-200">Output</h3>
          {output && (
            <span
              className={`px-2 py-1 text-xs rounded ${
                output.exitCode === 0
                  ? "bg-green-600 text-green-100"
                  : "bg-red-600 text-red-100"
              }`}
            >
              {output.exitCode === 0 ? "Success" : "Error"}
            </span>
          )}
        </div>
      </div>

      <div className="flex-1 p-4 overflow-auto">
        {output ? (
          <div className="space-y-4">
            {output.stdout && (
              <div>
                <div className="text-xs text-green-400 font-medium mb-1">
                  STDOUT:
                </div>
                <pre className="text-green-300 text-sm whitespace-pre-wrap bg-gray-800 p-3 rounded">
                  {output.stdout}
                </pre>
              </div>
            )}
            {output.stderr && (
              <div>
                <div className="text-xs text-red-400 font-medium mb-1">
                  STDERR:
                </div>
                <pre className="text-red-300 text-sm whitespace-pre-wrap bg-gray-800 p-3 rounded">
                  {output.stderr}
                </pre>
              </div>
            )}
            {output.error && (
              <div>
                <div className="text-xs text-red-400 font-medium mb-1">
                  ERROR:
                </div>
                <pre className="text-red-300 text-sm whitespace-pre-wrap bg-gray-800 p-3 rounded">
                  {output.error}
                </pre>
              </div>
            )}
            {!output.stdout && !output.stderr && !output.error && (
              <div className="text-gray-400 text-sm italic">No output</div>
            )}
          </div>
        ) : (
          <div className="text-gray-400 text-sm italic">
            Click "Run" to execute code
          </div>
        )}
      </div>
    </div>
  );
}

// Collaborative code editor with undo/redo, live cursors, live avatars, and run functionality
export function CollaborativeEditor() {
  const room = useRoom();
  const provider = getYjsProviderForRoom(room);
  const [editorRef, setEditorRef] = useState<editor.IStandaloneCodeEditor>();
  const [language, setLanguage] = useState("python");
  const [isRunning, setIsRunning] = useState(false);
  const [output, setOutput] = useState<CodeOutput | null>(null);

  // Set up Liveblocks Yjs provider and attach Monaco editor
  useEffect(() => {
    let binding: MonacoBinding;

    if (editorRef) {
      const yDoc = provider.getYDoc();
      const yText = yDoc.getText("monaco");

      // Attach Yjs to Monaco
      binding = new MonacoBinding(
        yText,
        editorRef.getModel() as editor.ITextModel,
        new Set([editorRef]),
        provider.awareness as unknown as Awareness
      );
    }

    return () => {
      binding?.destroy();
    };
  }, [editorRef, room]);

  const handleOnMount = useCallback((e: editor.IStandaloneCodeEditor) => {
    setEditorRef(e);
  }, []);

  const executeCode = useCallback(async () => {
    if (!editorRef) return;

    const code = editorRef.getValue();
    if (!code.trim()) {
      setOutput({ stdout: "", stderr: "No code to execute", exitCode: 1 });
      return;
    }

    setIsRunning(true);

    try {
      // Use real implementation instead of mock
      const result = await executeCodeWithJudge0(code, language);
      setOutput(result);
    } catch (error) {
      setOutput({
        stdout: "",
        stderr: "",
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
        exitCode: 1,
      });
    } finally {
      setIsRunning(false);
    }
  }, [editorRef, language]);
  const handleLanguageChange = useCallback(
    (newLanguage: string) => {
      setLanguage(newLanguage);
      if (editorRef) {
        const model = editorRef.getModel();
        if (model) {
          // Update the language of the current model
          editor.setModelLanguage(model, newLanguage);
          if (editorRef.getValue().trim() === '') {
            editorRef.setValue(getTemplateForLanguage(newLanguage));
          }
        }
      }
    },
    [editorRef]
  );

  return (
    <div className="h-screen flex flex-col bg-gray-900">
      {provider ? <Cursors yProvider={provider} /> : null}

      {/* Header with controls */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700 shrink-0">
        <div className="flex items-center space-x-4">
          {editorRef ? <Toolbar editor={editorRef} /> : null}

          {/* Language Selector */}
          <select
            value={language}
            onChange={(e) => handleLanguageChange(e.target.value)}
            className="px-3 py-1 text-sm bg-gray-700 text-gray-200 border border-gray-600 rounded focus:outline-none focus:border-blue-500"
          >
            <option value="c">C</option>
            <option value="cpp">C++</option>
            <option value="python">Python</option>
            <option value="javascript">JavaScript</option>
            <option value="java">Java</option>
          </select>

          {/* Run Button */}
          <RunButton
            onClick={executeCode}
            isRunning={isRunning}
            language={language}
          />
        </div>

        <Avatars />
      </div>

      {/* Main content area - split into two equal halves */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Top half - Code Editor */}
        <div className="h-1/2 border-b border-gray-700">
          <Editor
            onMount={handleOnMount}
            height="100%"
            theme="vs-dark"
            language={language}
            defaultValue={getTemplateForLanguage(language)}
            options={{
              tabSize: 4,
              padding: { top: 20 },
              fontSize: 14,
              lineNumbers: "on",
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              quickSuggestions: true,
              suggestOnTriggerCharacters: true,
              acceptSuggestionOnEnter: "on",
              acceptSuggestionOnCommitCharacter: true,
              parameterHints: { enabled: true },
              suggest: {
                showMethods: true,
                showFunctions: true,
                showConstructors: true,
                showFields: true,
                showVariables: true,
                showClasses: true,
                showInterfaces: true,
                showModules: true,
              },
            }}
          />
        </div>

        {/* Bottom half - Output Panel */}
        <div className="h-1/2">
          <OutputPanel output={output} />
        </div>
      </div>
    </div>
  );
}
