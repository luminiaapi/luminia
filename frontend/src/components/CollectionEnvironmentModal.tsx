/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion, AnimatePresence } from 'motion/react';
import { X, Globe, Save } from 'lucide-react';
import { Collection, Environment, KeyValuePair } from '../types';
import { KeyValueEditor } from './KeyValueEditor';

interface CollectionEnvironmentModalProps {
  isOpen: boolean;
  collection: Collection | null;
  environments: Environment[];
  selectedEnvironmentId: string | null;
  onClose: () => void;
  onUpdateVariables: (collectionId: string, variables: KeyValuePair[]) => void;
  onUpdateVariable: (id: string, updates: Partial<KeyValuePair>) => void;
  onAddVariable: () => void;
  onRemoveVariable: (id: string) => void;
}

export function CollectionEnvironmentModal({
  isOpen,
  collection,
  environments,
  selectedEnvironmentId,
  onClose,
  onUpdateVariables,
  onUpdateVariable,
  onAddVariable,
  onRemoveVariable
}: CollectionEnvironmentModalProps) {
  if (!isOpen || !collection) return null;

  const variables = collection.variables || [];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-4xl bg-bg-card border border-white/10 rounded-3xl shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 border-b border-white/5 bg-gradient-to-br from-brand-accent/5 to-transparent">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-brand-accent/10 flex items-center justify-center text-brand-accent">
                  <Globe className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-white">{collection.name}</h2>
                  <p className="text-xs text-text-dim uppercase tracking-widest font-bold opacity-40">
                    Collection Environment
                  </p>
                </div>
              </div>
              
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/5 rounded-xl transition-colors text-text-dim hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-brand-accent/5 border border-brand-accent/20">
              <div className="flex items-start gap-3">
                <Save className="w-5 h-5 text-brand-accent mt-0.5 shrink-0" />
                <div className="text-sm text-text-main">
                  <p className="font-bold text-brand-accent mb-1">Collection-Scoped Variables</p>
                  <p className="text-xs text-text-dim leading-relaxed">
                    These variables apply to all requests in this collection and its sub-collections.
                    They override global variables and are overridden by the selected environment.
                  </p>
                  <p className="text-xs text-text-dim mt-2 font-mono">
                    Priority: <span className="text-brand-accent">Selected Env</span> → 
                    <span className="text-blue-400"> Collection Env</span> → 
                    <span className="text-text-dim"> Global Env</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Variables Editor */}
          <div className="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Variables</h3>
              <span className="px-3 py-1 rounded-lg bg-white/5 text-xs font-bold text-text-dim">
                {variables.filter(v => v.key).length} Active
              </span>
            </div>

            <KeyValueEditor
              title=""
              items={variables}
              onUpdate={onUpdateVariable}
              onRemove={onRemoveVariable}
              onAdd={onAddVariable}
              environments={environments}
              selectedEnvironmentId={selectedEnvironmentId}
            />
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-white/5 bg-white/[0.02] flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl bg-white/5 border border-white/5 text-sm font-bold text-text-dim hover:text-white hover:bg-white/10 transition-all"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
