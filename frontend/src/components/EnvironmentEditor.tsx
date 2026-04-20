/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import { Globe, Plus, Trash2, Save, MoreVertical, Search, ArrowLeft } from 'lucide-react';
import { Environment, KeyValuePair } from '../types';
import { KeyValueEditor } from './KeyValueEditor';
import { VariableInput } from './VariableInput';

interface EnvironmentEditorProps {
  environment: Environment;
  environments: Environment[];
  selectedEnvironmentId: string | null;
  onUpdate: (updates: Partial<Environment>) => void;
  onUpdateVariable: (id: string, updates: Partial<KeyValuePair>) => void;
  onAddVariable: () => void;
  onRemoveVariable: (id: string) => void;
  onBack: () => void;
}

export function EnvironmentEditor({ 
  environment, 
  environments,
  selectedEnvironmentId,
  onUpdate, 
  onUpdateVariable, 
  onAddVariable, 
  onRemoveVariable,
  onBack
}: EnvironmentEditorProps) {
  return (
    <div className="flex-1 flex flex-col min-w-0 bg-bg-deep">
      <div className="p-8 pb-4">
        <div className="mb-6">
          <button 
            onClick={onBack}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-text-dim hover:text-text-main hover:bg-white/5 transition-all text-xs font-bold group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            Back to Request
          </button>
        </div>

        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-brand-accent/10 flex items-center justify-center text-brand-accent">
            <Globe className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <VariableInput 
                value={environment.name}
                onChange={(val) => onUpdate({ name: val })}
                environments={environments}
                selectedEnvironmentId={selectedEnvironmentId}
                className="bg-transparent border-none p-0 w-full"
                placeholder="Environment Name"
              />
            </div>
            <p className="text-xs text-text-dim uppercase tracking-widest font-bold opacity-40">Environment Configuration</p>
          </div>
          
          <div className="flex gap-2">
            <button className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl transition-all text-xs font-bold text-text-main">
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="bg-bg-card rounded-3xl border border-white/5">
          <div className="p-6 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h3 className="text-sm font-bold text-white">Variables</h3>
              <span className="px-2 py-0.5 rounded-md bg-white/5 text-[10px] font-bold text-text-dim">
                {environment.variables.filter(v => v.key).length} Active
              </span>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-dim opacity-40" />
                <input 
                  type="text" 
                  placeholder="Filter variables..."
                  className="bg-white/5 border border-white/5 rounded-lg py-1.5 pl-9 pr-4 text-xs focus:outline-none focus:border-brand-accent/50 transition-all w-48"
                />
              </div>
              <button 
                onClick={onAddVariable}
                className="flex items-center gap-2 px-4 py-1.5 bg-brand-accent text-white rounded-lg text-xs font-bold hover:brightness-110 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Variable
              </button>
            </div>
          </div>
          
          <div className="p-4">
            <KeyValueEditor 
              title="Global Variables"
              items={environment.variables}
              onUpdate={onUpdateVariable}
              onRemove={onRemoveVariable}
              onAdd={onAddVariable}
              environments={environments}
              selectedEnvironmentId={selectedEnvironmentId}
            />
          </div>
        </div>
        
        <div className="mt-8 p-6 rounded-3xl border border-warning/20 bg-warning/5 flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center text-warning flex-shrink-0">
            <Save className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white mb-1">Auto-save Enabled</h4>
            <p className="text-xs text-text-dim leading-relaxed">
              Environment variables are automatically synchronized across all requests using this environment. 
              Reference them using <span className="text-warning font-mono">{"{{variable_name}}"}</span> syntax in URLs, headers, or body.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
