/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useEffect } from 'react';

interface SimpleCodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  height?: string;
  readOnly?: boolean;
}

const JS_KEYWORDS = [
  // PM API methods
  'pm.environment.set', 'pm.environment.get', 'pm.environment.has', 'pm.environment.unset',
  'pm.request.headers.add', 'pm.request.headers.remove', 'pm.request.headers.upsert',
  'pm.response.json', 'pm.response.text', 'pm.response.status', 'pm.response.headers',
  'pm.test', 'pm.expect',
  // JavaScript keywords
  'function', 'const', 'let', 'var', 'if', 'else', 'for', 'while', 'return',
  'try', 'catch', 'throw', 'async', 'await', 'true', 'false', 'null', 'undefined',
  // Common methods
  'console.log', 'JSON.parse', 'JSON.stringify', 'Date.now', 'Math.random'
];

export function SimpleCodeEditor({
  value,
  onChange,
  placeholder = '// Write your JavaScript code here...',
  height = '300px',
  readOnly = false
}: SimpleCodeEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedSuggestion, setSelectedSuggestion] = useState(0);
  const [cursorPosition, setCursorPosition] = useState({ top: 0, left: 0 });
  const [isTyping, setIsTyping] = useState(false);

  // Debounce typing state to show syntax highlighting after user stops typing
  useEffect(() => {
    if (isTyping) {
      const timeout = setTimeout(() => {
        setIsTyping(false);
      }, 500); // Show syntax highlighting 500ms after stopping typing
      return () => clearTimeout(timeout);
    }
  }, [isTyping, value]);

  const updateCursorPosition = (textarea: HTMLTextAreaElement) => {
    const cursorPos = textarea.selectionStart;
    const textBeforeCursor = value.substring(0, cursorPos);
    const lines = textBeforeCursor.split('\n');
    const currentLine = lines.length - 1;
    const currentColumn = lines[lines.length - 1].length;
    
    // Calculate approximate position
    const lineHeight = 24; // 1.5rem * 16px
    const charWidth = 8; // approximate character width
    
    setCursorPosition({
      top: currentLine * lineHeight + 40, // 40px for padding
      left: Math.min(currentColumn * charWidth + 64, 400) // 64px for line numbers, max 400px
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newValue = value.substring(0, start) + '  ' + value.substring(end);
      onChange(newValue);
      
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2;
      }, 0);
    } else if (showSuggestions) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedSuggestion(prev => Math.min(prev + 1, suggestions.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedSuggestion(prev => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        insertSuggestion(suggestions[selectedSuggestion]);
      } else if (e.key === 'Tab') {
        e.preventDefault();
        insertSuggestion(suggestions[selectedSuggestion]);
      } else if (e.key === 'Escape') {
        setShowSuggestions(false);
      }
    }
  };

  const insertSuggestion = (suggestion: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const beforeCursor = value.substring(0, start);
    const afterCursor = value.substring(start);
    
    let newValue: string;
    let newCursorPos: number;
    
    if (beforeCursor.endsWith('.')) {
      // Insert after dot
      newValue = beforeCursor + suggestion + afterCursor;
      newCursorPos = start + suggestion.length;
    } else {
      // Find the start of the current word and replace it
      const wordMatch = beforeCursor.match(/[\w.]*$/);
      const wordStart = wordMatch ? start - wordMatch[0].length : start;
      newValue = value.substring(0, wordStart) + suggestion + afterCursor;
      newCursorPos = wordStart + suggestion.length;
    }
    
    onChange(newValue);
    setShowSuggestions(false);
    
    setTimeout(() => {
      textarea.selectionStart = textarea.selectionEnd = newCursorPos;
      textarea.focus();
    }, 0);
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const textarea = e.target;
    
    // Set typing state to show plain text while typing
    setIsTyping(true);
    
    // Direct onChange call with the textarea value
    onChange(newValue);

    // Update cursor position for autocomplete
    updateCursorPosition(textarea);

    // Show autocomplete suggestions
    const cursorPos = textarea.selectionStart;
    const beforeCursor = newValue.substring(0, cursorPos);
    const currentWord = beforeCursor.match(/[\w.]*$/)?.[0] || '';

    // Show suggestions for any character input
    if (currentWord.length >= 1 || beforeCursor.endsWith('.')) {
      let matchingSuggestions: string[] = [];
      
      if (beforeCursor.endsWith('.')) {
        // Show context-specific suggestions after dot
        if (beforeCursor.endsWith('pm.environment.')) {
          matchingSuggestions = ['set', 'get', 'has', 'unset'];
        } else if (beforeCursor.endsWith('pm.request.')) {
          matchingSuggestions = ['headers'];
        } else if (beforeCursor.endsWith('pm.request.headers.')) {
          matchingSuggestions = ['add', 'remove', 'upsert'];
        } else if (beforeCursor.endsWith('pm.response.')) {
          matchingSuggestions = ['json', 'text', 'status', 'headers'];
        } else if (beforeCursor.endsWith('pm.')) {
          matchingSuggestions = ['environment', 'request', 'response', 'test', 'expect'];
        } else if (beforeCursor.endsWith('console.')) {
          matchingSuggestions = ['log', 'error', 'warn', 'info'];
        } else if (beforeCursor.endsWith('JSON.')) {
          matchingSuggestions = ['parse', 'stringify'];
        } else if (beforeCursor.endsWith('Math.')) {
          matchingSuggestions = ['random', 'floor', 'ceil', 'round', 'max', 'min'];
        } else if (beforeCursor.endsWith('Date.')) {
          matchingSuggestions = ['now'];
        }
      } else {
        // Regular keyword matching
        matchingSuggestions = JS_KEYWORDS.filter(keyword =>
          keyword.toLowerCase().startsWith(currentWord.toLowerCase()) ||
          (currentWord.length > 1 && keyword.toLowerCase().includes(currentWord.toLowerCase()))
        );
      }

      matchingSuggestions = matchingSuggestions.slice(0, 8);

      if (matchingSuggestions.length > 0) {
        setSuggestions(matchingSuggestions);
        setSelectedSuggestion(0);
        setShowSuggestions(true);
      } else {
        setShowSuggestions(false);
      }
    } else {
      setShowSuggestions(false);
    }
  };

  const handleClick = (e: React.MouseEvent<HTMLTextAreaElement>) => {
    const textarea = e.currentTarget;
    setTimeout(() => updateCursorPosition(textarea), 0);
  };

  const handleKeyUp = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const textarea = e.currentTarget;
    setTimeout(() => updateCursorPosition(textarea), 0);
  };

  // Apply basic syntax highlighting to display text
  const getHighlightedText = (text: string) => {
    return text
      .replace(/\/\/.*$/gm, '<span style="color: #6A9955;">$&</span>') // Comments
      .replace(/(["'`])((?:\\.|(?!\1)[^\\])*?)\1/g, '<span style="color: #CE9178;">$&</span>') // Strings
      .replace(/\b(function|const|let|var|if|else|for|while|return|try|catch|throw|async|await|class|extends|import|export|from|default)\b/g, '<span style="color: #C586C0;">$&</span>') // Keywords
      .replace(/\b(true|false|null|undefined)\b/g, '<span style="color: #569CD6;">$&</span>') // Literals
      .replace(/\b(pm\.[a-zA-Z.]+)/g, '<span style="color: #4FC1FF;">$&</span>') // PM API
      .replace(/\b(console\.[a-zA-Z]+|JSON\.[a-zA-Z]+|Date\.[a-zA-Z]+|Math\.[a-zA-Z]+)/g, '<span style="color: #4EC9B0;">$&</span>') // Built-in APIs
      .replace(/\b(\d+\.?\d*)\b/g, '<span style="color: #B5CEA8;">$&</span>') // Numbers
      .replace(/\n/g, '<br>');
  };

  const lineCount = value.split('\n').length;

  return (
    <div className="border border-white/10 rounded-lg overflow-hidden bg-[#1e1e1e] relative">
      {/* Input textarea */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        onClick={handleClick}
        onKeyUp={handleKeyUp}
        placeholder={placeholder}
        readOnly={readOnly}
        className="w-full bg-transparent caret-white font-mono text-sm leading-6 p-4 pl-16 resize-none outline-none placeholder:text-text-dim/50 relative z-10"
        style={{ 
          height,
          color: isTyping ? '#ffffff' : 'transparent' // Show white text while typing, transparent when not
        }}
        spellCheck={false}
      />

      {/* Syntax highlighting overlay - only visible when not typing */}
      {!isTyping && (
        <div 
          className="absolute inset-0 pointer-events-none overflow-hidden font-mono text-sm leading-6 p-4 pl-16 whitespace-pre-wrap break-words z-5"
          style={{ height }}
          dangerouslySetInnerHTML={{ 
            __html: getHighlightedText(value) + '<br>' 
          }}
        />
      )}
      
      {/* Line numbers */}
      <div className="absolute left-0 top-0 bottom-0 w-12 bg-[#252526] border-r border-white/10 pointer-events-none z-20">
        <div className="p-4 text-xs text-text-dim/50 font-mono leading-6">
          {Array.from({ length: lineCount }, (_, index) => (
            <div key={index} className="text-right pr-2">
              {index + 1}
            </div>
          ))}
        </div>
      </div>

      {/* Autocomplete suggestions */}
      {showSuggestions && (
        <div 
          className="absolute z-30 bg-[#2d2d30] border border-white/20 rounded-lg shadow-lg max-h-48 overflow-y-auto min-w-48"
          style={{
            top: cursorPosition.top,
            left: cursorPosition.left
          }}
        >
          {suggestions.map((suggestion, index) => (
            <div
              key={suggestion}
              className={`px-3 py-2 text-sm cursor-pointer ${
                index === selectedSuggestion
                  ? 'bg-brand-accent/20 text-brand-accent'
                  : 'text-text-main hover:bg-white/5'
              }`}
              onClick={() => insertSuggestion(suggestion)}
            >
              <span className="font-mono">{suggestion}</span>
              {suggestion.startsWith('pm.') && (
                <span className="ml-2 text-xs text-text-dim">API</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}