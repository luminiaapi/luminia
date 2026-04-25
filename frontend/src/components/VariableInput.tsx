/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Environment, Collection } from '../types';
import { getMergedVariables } from '../lib/variableResolver';

interface VariableInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  multiline?: boolean;
  language?: 'json' | 'none';
  environments: Environment[];
  selectedEnvironmentId: string | null;
  currentCollection?: Collection | null; // Add collection context
  readOnly?: boolean;
}

export function VariableInput({ 
  value, 
  onChange, 
  placeholder, 
  className = '', 
  multiline = false,
  language = 'none',
  environments,
  selectedEnvironmentId,
  currentCollection = null,
  readOnly = false
}: VariableInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionIndex, setSuggestionIndex] = useState(0);
  const [cursorPos, setCursorPos] = useState(0);
  const [hoveredVar, setHoveredVar] = useState<{ name: string; value: string; source: string; x: number; y: number } | null>(null);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const mirrorRef = useRef<HTMLDivElement>(null);

  // Get merged variables with proper priority
  const availableVars = useMemo(() => 
    getMergedVariables(environments, selectedEnvironmentId, currentCollection),
    [environments, selectedEnvironmentId, currentCollection]
  );

  // Get variable source for tooltip
  const getVariableSource = (key: string): string => {
    const selectedEnv = environments.find(e => e.id === selectedEnvironmentId);
    if (selectedEnv?.variables.find(v => v.key === key && v.enabled)) {
      return selectedEnv.name;
    }
    if (currentCollection?.variables?.find(v => v.key === key && v.enabled)) {
      return `${currentCollection.name} (Collection)`;
    }
    const globalEnv = environments.find(e => e.scope === 'global');
    if (globalEnv?.variables.find(v => v.key === key && v.enabled)) {
      return 'Global';
    }
    return 'Unknown';
  };

  // Handle mouse move to detect if hovering over a variable tag in the mirror layer
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!mirrorRef.current) return;
    
    const x = e.clientX;
    const y = e.clientY;

    const tags = mirrorRef.current.querySelectorAll('.env-var-tag');
    let foundTag: { name: string; value: string; source: string; x: number; y: number } | null = null;

    for (const tag of Array.from(tags)) {
      const tagRect = tag.getBoundingClientRect();
      if (
        x >= tagRect.left && 
        x <= tagRect.right && 
        y >= tagRect.top && 
        y <= tagRect.bottom
      ) {
        const varName = (tag as HTMLElement).dataset.varName;
        const varData = availableVars.find(v => v.key === varName);
        if (varName && varData) {
          foundTag = {
            name: varName,
            value: varData.value,
            source: getVariableSource(varName),
            x: tagRect.left + tagRect.width / 2,
            y: tagRect.top - 8
          };
          break;
        }
      }
    }

    if (!foundTag) {
      if (hoveredVar) setHoveredVar(null);
    } else {
      // Only update if it's a different variable or position has moved significantly
      if (!hoveredVar || hoveredVar.name !== foundTag.name || Math.abs(hoveredVar.x - foundTag.x) > 1) {
        setHoveredVar(foundTag);
      }
    }
  };

  // Handle the highlighting logic
  const renderHighlightedText = () => {
    if (!value) return null;
    
    let text = value;
    const parts: React.ReactNode[] = [];
    
    const regex = language === 'json' 
      ? /(\{\{.*?\}\})|("(?:\\.|[^"\\])*"(?=\s*:))|("(?:\\.|[^"\\])*")|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)|(\b(?:true|false|null)\b)/g
      : /(\{\{.*?\}\})/g;

    let match: RegExpExecArray | null;
    let lastIndex = 0;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(<span key={`text-${lastIndex}`} className="text-white">{text.substring(lastIndex, match.index)}</span>);
      }

      const [, envVar, jsonKey, jsonString, jsonNumber, jsonKeyword] = match;

      if (envVar) {
        const varName = envVar.replace(/\{\{\s*|\s*\}\}/g, '');
        const exists = availableVars.some(v => v.key === varName);
        parts.push(
          <span 
            key={match.index} 
            data-var-name={varName}
            className={`env-var-tag ${exists ? 'text-yellow-600' : 'text-danger'} font-bold bg-white/5 rounded `}
          >
            {envVar}
          </span>
        );
      } else if (jsonKey) {
        parts.push(<span key={match.index} className="text-[#3fc3ff] font-bold drop-shadow-[0_0_2px_rgba(63,195,255,0.4)]">{jsonKey}</span>);
      } else if (jsonString) {
        parts.push(<span key={match.index} className="text-[#4ffb7b] drop-shadow-[0_0_2px_rgba(79,251,123,0.3)]">{jsonString}</span>);
      } else if (jsonNumber) {
        parts.push(<span key={match.index} className="text-[#ffab70]">{jsonNumber}</span>);
      } else if (jsonKeyword) {
        parts.push(<span key={match.index} className="text-[#ff74c1] font-black">{jsonKeyword}</span>);
      }

      lastIndex = regex.lastIndex;
    }

    if (lastIndex < text.length) {
      parts.push(<span key={`text-${lastIndex}`} className="text-white">{text.substring(lastIndex)}</span>);
    }

    return parts;
  };

  // Autocomplete detection
  useEffect(() => {
    const lastChars = value.substring(0, cursorPos);
    const match = lastChars.match(/\{\{\s*([^}]*)$/);
    if (match && isFocused) {
      setShowSuggestions(true);
      setSuggestionIndex(0);
    } else {
      setShowSuggestions(false);
    }
  }, [value, cursorPos, isFocused]);

  const filteredSuggestions = useMemo(() => {
    const lastChars = value.substring(0, cursorPos);
    const match = lastChars.match(/\{\{\s*([^}]*)$/);
    const query = match ? match[1].trim().toLowerCase() : '';
    return availableVars.filter(v => v.key.toLowerCase().includes(query));
  }, [availableVars, value, cursorPos]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const input = inputRef.current;
    if (!input) return;

    if (showSuggestions && filteredSuggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSuggestionIndex(prev => (prev + 1) % filteredSuggestions.length);
        return;
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSuggestionIndex(prev => (prev - 1 + filteredSuggestions.length) % filteredSuggestions.length);
        return;
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        insertSuggestion(filteredSuggestions[suggestionIndex].key);
        return;
      } else if (e.key === 'Escape') {
        setShowSuggestions(false);
        return;
      }
    }

    if (multiline && language === 'json') {
      const { selectionStart, selectionEnd } = input;
      const before = value.substring(0, selectionStart);
      const after = value.substring(selectionEnd);

      if (e.key === 'Tab') {
        e.preventDefault();
        const newValue = before + '  ' + after;
        onChange(newValue);
        setTimeout(() => {
          input.setSelectionRange(selectionStart + 2, selectionStart + 2);
          setCursorPos(selectionStart + 2);
        }, 0);
      }

      if (e.key === 'Enter') {
        e.preventDefault();
        const lines = before.split('\n');
        const currentLine = lines[lines.length - 1];
        const indentMatch = currentLine.match(/^\s*/);
        let indent = indentMatch ? indentMatch[0] : '';
        
        const lastChar = before.trim().slice(-1);
        const nextChar = after.trim().slice(0, 1);
        
        if ((lastChar === '{' && nextChar === '}') || (lastChar === '[' && nextChar === ']')) {
          const newValue = before + '\n' + indent + '  ' + '\n' + indent + after;
          onChange(newValue);
          
          setTimeout(() => {
            const newPos = selectionStart + 1 + indent.length + 2;
            input.setSelectionRange(newPos, newPos);
            setCursorPos(newPos);
          }, 0);
          return;
        }

        let extraIndent = '';
        if (lastChar === '{' || lastChar === '[') {
          extraIndent = '  ';
        }

        const newValue = before + '\n' + indent + extraIndent + after;
        onChange(newValue);
        
        setTimeout(() => {
          const newPos = selectionStart + 1 + indent.length + extraIndent.length;
          input.setSelectionRange(newPos, newPos);
          setCursorPos(newPos);
        }, 0);
      }

      const pairs: Record<string, string> = {
        '{': '}',
        '[': ']',
        '"': '"',
        '(': ')'
      };

      if (e.key === 'Backspace' && selectionStart === selectionEnd) {
        const charBefore = value[selectionStart - 1];
        const charAfter = value[selectionStart];
        if (pairs[charBefore] === charAfter) {
          e.preventDefault();
          const newValue = value.substring(0, selectionStart - 1) + value.substring(selectionStart + 1);
          onChange(newValue);
          setTimeout(() => {
            input.setSelectionRange(selectionStart - 1, selectionStart - 1);
            setCursorPos(selectionStart - 1);
          }, 0);
          return;
        }
      }

      if (['}', ']', '"', ')'].includes(e.key) && selectionStart === selectionEnd) {
        if (value[selectionStart] === e.key) {
          e.preventDefault();
          input.setSelectionRange(selectionStart + 1, selectionStart + 1);
          setCursorPos(selectionStart + 1);
          return;
        }
      }

      if (pairs[e.key]) {
        e.preventDefault();
        const closing = pairs[e.key];
        const newValue = before + e.key + closing + after;
        onChange(newValue);
        setTimeout(() => {
          input.setSelectionRange(selectionStart + 1, selectionStart + 1);
          setCursorPos(selectionStart + 1);
        }, 0);
      }
    }
  };

  const insertSuggestion = (key: string) => {
    const lastChars = value.substring(0, cursorPos);
    const afterChars = value.substring(cursorPos);
    const match = lastChars.match(/\{\{([^}]*)$/);
    
    if (match) {
      const beforeTrigger = lastChars.substring(0, match.index);
      const newValue = beforeTrigger + '{{' + key + '}}' + afterChars;
      onChange(newValue);
      
      setTimeout(() => {
        const newPos = beforeTrigger.length + key.length + 4;
        inputRef.current?.setSelectionRange(newPos, newPos);
        setCursorPos(newPos);
      }, 0);
    }
    setShowSuggestions(false);
  };

  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    if (mirrorRef.current) {
      mirrorRef.current.scrollTop = e.currentTarget.scrollTop;
      mirrorRef.current.scrollLeft = e.currentTarget.scrollLeft;
    }
  };

  const Tag = multiline ? 'textarea' : 'input';

  return (
    <div className={`relative flex flex-col ${className}`}>
      {/* Background highlighting layer */}
      <div 
        ref={mirrorRef}
        aria-hidden="true"
        className={`absolute inset-0 pointer-events-none whitespace-pre-wrap break-words px-4 py-2.5 font-mono text-sm border border-transparent overflow-hidden rounded-lg ${multiline ? 'min-h-[200px]' : ''}`}
        style={{ color: 'transparent', zIndex: 1, wordWrap: 'break-word', overflowWrap: 'break-word' }}
      >
        {renderHighlightedText()}
        {!value && placeholder && <span className="text-text-dim/30">{placeholder}</span>}
      </div>

      {/* Real interaction layer */}
      <Tag
        ref={inputRef as any}
        value={value}
        onBlur={() => {
          setTimeout(() => setIsFocused(false), 200);
          setHoveredVar(null);
        }}
        onFocus={() => setIsFocused(true)}
        onMouseLeave={() => setHoveredVar(null)}
        onMouseMove={handleMouseMove}
        onChange={(e) => {
          onChange(e.target.value);
          setCursorPos(e.target.selectionStart || 0);
        }}
        onKeyUp={(e) => setCursorPos((e.target as any).selectionStart || 0)}
        onKeyDown={handleKeyDown}
        onScroll={handleScroll}
        readOnly={readOnly}
        className={`w-full bg-transparent border border-white/10 rounded-lg px-4 py-2.5 text-sm font-mono focus:outline-none focus:border-brand-accent/50 transition-[border-color,background-color] placeholder:text-text-dim/50 caret-white relative z-10 ${multiline ? 'resize-y min-h-[200px]' : ''} ${readOnly ? 'cursor-default' : ''}`}
        placeholder={placeholder}
        style={{ 
          color: 'transparent', 
          caretColor: 'white', 
          WebkitTextFillColor: 'transparent',
          textShadow: 'none'
        }}
      />

      {/* Variable Value Tooltip */}
      <AnimatePresence>
        {hoveredVar && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 5 }}
            className="fixed z-[9999] pointer-events-none"
            style={{ 
              left: hoveredVar.x, 
              top: hoveredVar.y,
              transform: 'translate(-50%, -100%)'
            }}
          >
            <div className="bg-bg-card border border-brand-accent/30 rounded-lg px-3 py-2 shadow-[0_10px_30px_rgba(0,0,0,0.5)] flex flex-col items-center gap-1 backdrop-blur-md">
              <span className="text-[9px] font-black text-brand-accent uppercase tracking-widest">{hoveredVar.name}</span>
              <span className="text-xs font-mono text-text-main font-bold truncate max-w-[200px]">{hoveredVar.value}</span>
              <span className="text-[8px] font-bold text-text-dim/60 uppercase tracking-wider">{hoveredVar.source}</span>
              <div className="absolute top-full left-1/2 -ml-1 border-4 border-transparent border-t-bg-card" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Suggestions Popup */}
      <AnimatePresence>
        {showSuggestions && filteredSuggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute left-0 top-full mt-1 w-64 bg-bg-card border border-white/10 rounded-xl shadow-2xl z-[100] overflow-hidden backdrop-blur-xl"
          >
            <div className="p-2 border-b border-white/5 bg-white/[0.02]">
              <div className="text-[9px] font-black text-text-dim/40 uppercase tracking-[0.2em] px-2 py-1">Environment Variables</div>
            </div>
            <div className="max-h-[200px] overflow-y-auto p-1.5 custom-scrollbar">
              {filteredSuggestions.map((v, i) => (
                <div
                  key={v.id}
                  onClick={() => insertSuggestion(v.key)}
                  onMouseEnter={() => setSuggestionIndex(i)}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-all ${
                    i === suggestionIndex ? 'bg-brand-accent/20 text-brand-accent' : 'hover:bg-white/5 text-text-dim'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-1 h-1 rounded-full ${i === suggestionIndex ? 'bg-brand-accent shadow-[0_0_8px_rgba(139,92,246,0.5)]' : 'bg-white/20'}`} />
                    <span className="text-xs font-bold font-mono tracking-tight">{v.key}</span>
                  </div>
                  <span className="text-[10px] text-text-dim/50 font-mono truncate max-w-[80px]">{v.value}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
