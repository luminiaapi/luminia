/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef, useState } from 'react';
import Editor from '@monaco-editor/react';
import type { editor } from 'monaco-editor';
import { SimpleCodeEditor } from './SimpleCodeEditor';

interface JavaScriptEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  height?: string;
  readOnly?: boolean;
}

export function JavaScriptEditor({
  value,
  onChange,
  placeholder = '// Write your JavaScript code here...',
  height = '300px',
  readOnly = false
}: JavaScriptEditorProps) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const [useSimpleEditor, setUseSimpleEditor] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingError, setLoadingError] = useState<string | null>(null);

  // Check if we're in a Wails environment and Monaco might not work
  useEffect(() => {
    // If we're in a Wails environment, Monaco might have issues
    if (typeof window !== 'undefined' && (window as any).wails) {
      console.log('Detected Wails environment, using fallback editor');
      setUseSimpleEditor(true);
      setIsLoading(false);
      return;
    }
  }, []);

  // Timeout to fallback to simple editor if Monaco takes too long
  useEffect(() => {
    if (useSimpleEditor) return; // Skip timeout if already using simple editor
    
    const timeout = setTimeout(() => {
      if (isLoading) {
        console.warn('Monaco Editor taking too long to load, falling back to simple editor');
        setLoadingError('Monaco Editor failed to load');
        setUseSimpleEditor(true);
        setIsLoading(false);
      }
    }, 3000); // 3 second timeout

    return () => clearTimeout(timeout);
  }, [isLoading, useSimpleEditor]);

  const handleEditorDidMount = (editor: editor.IStandaloneCodeEditor, monaco: any) => {
    editorRef.current = editor;
    setIsLoading(false);

    // Configure editor options
    editor.updateOptions({
      fontSize: 13,
      fontFamily: 'JetBrains Mono, Consolas, Monaco, "Courier New", monospace',
      lineHeight: 20,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      wordWrap: 'on',
      automaticLayout: true,
      tabSize: 2,
      insertSpaces: true,
      folding: true,
      lineNumbers: 'on',
      glyphMargin: false,
      contextmenu: true,
      mouseWheelZoom: true,
      smoothScrolling: true,
      cursorBlinking: 'smooth',
      renderLineHighlight: 'line',
      selectOnLineNumbers: true,
      roundedSelection: false,
      readOnly,
      cursorStyle: 'line'
    });

    // Add custom snippets and autocomplete
    monaco.languages.registerCompletionItemProvider('javascript', {
      provideCompletionItems: () => {
        const suggestions = [
          {
            label: 'pm.environment.set',
            kind: monaco.languages.CompletionItemKind.Method,
            insertText: 'pm.environment.set("${1:key}", "${2:value}");',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Set an environment variable'
          },
          {
            label: 'pm.environment.get',
            kind: monaco.languages.CompletionItemKind.Method,
            insertText: 'pm.environment.get("${1:key}")',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Get an environment variable'
          },
          {
            label: 'pm.request.headers.add',
            kind: monaco.languages.CompletionItemKind.Method,
            insertText: 'pm.request.headers.add("${1:header}", "${2:value}");',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Add a request header'
          },
          {
            label: 'pm.response.json',
            kind: monaco.languages.CompletionItemKind.Method,
            insertText: 'pm.response.json()',
            documentation: 'Parse response as JSON'
          },
          {
            label: 'pm.response.text',
            kind: monaco.languages.CompletionItemKind.Method,
            insertText: 'pm.response.text()',
            documentation: 'Get response as text'
          },
          {
            label: 'pm.test',
            kind: monaco.languages.CompletionItemKind.Method,
            insertText: 'pm.test("${1:test name}", () => {\n    ${2:// test logic}\n    return ${3:true};\n});',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Add a test assertion'
          }
        ];

        return { suggestions };
      }
    });
  };

  const handleEditorChange = (value: string | undefined) => {
    onChange(value || '');
  };

  const handleBeforeMount = (monaco: any) => {
    // Configure Monaco before mounting
    try {
      monaco.editor.defineTheme('custom-dark', {
        base: 'vs-dark',
        inherit: true,
        rules: [],
        colors: {
          'editor.background': '#1e1e1e',
        }
      });
    } catch (error) {
      console.warn('Failed to configure Monaco theme:', error);
      // If theme configuration fails, fallback to simple editor
      setUseSimpleEditor(true);
      setIsLoading(false);
    }
  };

  // Use simple editor if Monaco failed to load or took too long
  if (useSimpleEditor) {
    return (
      <div>
        {loadingError && (
          <div className="mb-2 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded text-xs text-yellow-400">
            {loadingError} - Using fallback editor
          </div>
        )}
        <SimpleCodeEditor
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          height={height}
          readOnly={readOnly}
        />
      </div>
    );
  }

  return (
    <div className="border border-white/10 rounded-lg overflow-hidden bg-[#1e1e1e]">
      <Editor
        height={height}
        defaultLanguage="javascript"
        value={value}
        onChange={handleEditorChange}
        onMount={handleEditorDidMount}
        beforeMount={handleBeforeMount}
        theme="custom-dark"
        loading={
          <div className="flex items-center justify-center h-full bg-[#1e1e1e] text-text-dim">
            <div className="flex flex-col items-center gap-2">
              <div className="w-6 h-6 border-2 border-brand-accent border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm">Loading editor...</span>
            </div>
          </div>
        }
        options={{
          readOnly,
          automaticLayout: true
        }}
        onValidate={(markers) => {
          // Handle validation errors
          if (markers.length > 0) {
            console.log('Monaco validation markers:', markers);
          }
        }}
      />
    </div>
  );
}