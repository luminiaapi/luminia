/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Trash2, Plus, FileUp, File, Type } from 'lucide-react';
import { KeyValuePair, Environment, Collection } from '../types';
import { Checkbox } from './Checkbox';
import { VariableInput } from './VariableInput';

interface KeyValueEditorProps {
  title: string;
  items: KeyValuePair[];
  extraItems?: KeyValuePair[];
  showHidden?: boolean;
  onToggleHidden?: () => void;
  onUpdate: (id: string, updates: Partial<KeyValuePair>) => void;
  onRemove: (id: string) => void;
  onAdd: () => void;
  showTypeSelector?: boolean;
  environments: Environment[];
  selectedEnvironmentId: string | null;
  currentCollection?: Collection | null;
  isPathParams?: boolean;
}

export function KeyValueEditor({ 
  title, 
  items, 
  extraItems = [],
  showHidden,
  onToggleHidden,
  onUpdate, 
  onRemove, 
  onAdd, 
  showTypeSelector,
  environments,
  selectedEnvironmentId,
  currentCollection,
  isPathParams
}: KeyValueEditorProps) {
  const handleFileChange = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUpdate(id, { 
        file: {
          name: file.name,
          size: file.size,
          type: file.type,
          lastModified: file.lastModified
        },
        value: file.name // Store name in value as well for visible feedback
      });
    }
  };

  return (
    <div className="p-1 rounded-2xl border border-white/5 bg-white/[0.01]">
      <div className="p-4 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">{title}</span>
          {extraItems.length > 0 && onToggleHidden && (
            <button 
              onClick={onToggleHidden}
              className="px-2 py-1 rounded bg-white/5 border border-white/5 text-[9px] font-black uppercase tracking-tighter hover:bg-white/10 transition-all text-text-dim hover:text-text-main"
            >
              {showHidden ? 'Hide' : 'Show'} {extraItems.length} hidden {extraItems.length === 1 ? 'header' : 'headers'}
            </button>
          )}
        </div>
        {!isPathParams && (
          <button 
            onClick={onAdd}
            className="p-1.5 hover:bg-brand-accent/10 text-brand-accent rounded-md transition-all flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="text-[10px] font-bold uppercase">Add Row</span>
          </button>
        )}
      </div>
      <div className="p-2 space-y-px">
        {showHidden && extraItems.map(item => (
          <div key={item.id} className={`flex items-center gap-3 py-1.5 px-2 rounded-lg border border-transparent transition-all group ${item.enabled ? 'bg-white/[0.01] opacity-70' : 'bg-white/[0.01] opacity-40'}`}>
             <Checkbox 
                checked={item.enabled}
                onChange={() => {}}
                disabled
              />
            
            <div className={`flex flex-1 items-center gap-2 bg-white/5 rounded-lg border border-white/5 ${item.enabled ? 'opacity-60' : 'opacity-40 line-through decoration-danger/50'}`}>
              <div className="w-1/3 flex border-r border-border-subtle bg-bg-card">
                <VariableInput
                  value={item.key}
                  onChange={() => {}}
                  environments={environments}
                  selectedEnvironmentId={selectedEnvironmentId}
                  currentCollection={currentCollection}
                  placeholder="Key"
                  className="w-full"
                  readOnly
                />
              </div>
              
              <div className="flex-1 relative bg-bg-card min-w-0">
                <VariableInput
                  value={item.value}
                  onChange={() => {}}
                  environments={environments}
                  selectedEnvironmentId={selectedEnvironmentId}
                  currentCollection={currentCollection}
                  placeholder="Value"
                  className="w-full"
                  readOnly
                />
              </div>
            </div>
            {/* Overridden Badge */}
            {!item.enabled && (
              <div className="px-2 py-1 rounded bg-danger/10 border border-danger/20 text-[8px] font-black uppercase text-danger whitespace-nowrap">
                Overridden
              </div>
            )}
            <div className="w-[30px]" />
          </div>
        ))}

        {items.map(item => (
          <div key={item.id} className="flex items-center gap-3 py-1.5 px-2 rounded-lg border border-transparent hover:bg-white/[0.02] transition-all group">
            {!isPathParams && (
              <Checkbox 
                checked={item.enabled}
                onChange={(checked) => onUpdate(item.id, { enabled: checked })}
              />
            )}
            
            <div className={`flex flex-1 items-center gap-2 bg-white/5 rounded-lg border border-white/5 ${isPathParams ? 'pl-2' : ''}`}>
              {/* Type Switcher */}
              {showTypeSelector && !isPathParams && (
                <div className="flex border-r border-border-subtle bg-bg-card">
                  <button
                    onClick={() => onUpdate(item.id, { type: 'text' })}
                    className={`p-2 transition-all ${item.type === 'text' ? 'text-brand-accent bg-brand-accent/10' : 'text-text-dim hover:text-text-main'}`}
                    title="Text"
                  >
                    <Type className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onUpdate(item.id, { type: 'file' })}
                    className={`p-2 transition-all ${item.type === 'file' ? 'text-brand-accent bg-brand-accent/10' : 'text-text-dim hover:text-text-main'}`}
                    title="File"
                  >
                    <FileUp className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <div className="w-1/3 flex border-r border-border-subtle bg-bg-card">
                <VariableInput
                  value={item.key}
                  onChange={(key) => !isPathParams && onUpdate(item.id, { key })}
                  environments={environments}
                  selectedEnvironmentId={selectedEnvironmentId}
                  currentCollection={currentCollection}
                  placeholder="Key"
                  className={`w-full ${isPathParams ? 'opacity-50' : ''}`}
                  readOnly={isPathParams}
                />
              </div>
              
              <div className="flex-1 relative bg-bg-card min-w-0">
                {item.type === 'file' && !isPathParams ? (
                  <label className="flex items-center gap-2 px-4 py-2 cursor-pointer hover:bg-white/5 transition-all text-xs">
                    <input 
                      type="file" 
                      className="hidden" 
                      onChange={(e) => handleFileChange(item.id, e)}
                    />
                    {item.file ? (
                      <div className="flex items-center gap-2 text-brand-accent truncate">
                        <File className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{item.file.name}</span>
                        <span className="text-[9px] opacity-40 font-mono">({(item.file.size / 1024).toFixed(1)} KB)</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-text-dim/40">
                        <FileUp className="w-3.5 h-3.5" />
                        <span>Select File...</span>
                      </div>
                    )}
                  </label>
                ) : (
                  <VariableInput
                    value={item.value}
                    onChange={(value) => onUpdate(item.id, { value })}
                    environments={environments}
                    selectedEnvironmentId={selectedEnvironmentId}
                    currentCollection={currentCollection}
                    placeholder="Value"
                    className="w-full"
                  />
                )}
              </div>
            </div>

            {!isPathParams && (
              <button 
                onClick={() => onRemove(item.id)}
                className="p-1.5 opacity-0 group-hover:opacity-100 text-text-dim hover:text-danger hover:bg-danger/10 rounded-md transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
