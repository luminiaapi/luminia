/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Database, X } from 'lucide-react';
import { Environment } from '../types';
import { VariableInput } from './VariableInput';

interface EditModalProps {
  isOpen: boolean;
  onClose: () => void;
  target: { type: 'collection' | 'request' | 'environment'; id: string; name: string; parentId?: string } | null;
  onSave: (name: string) => void;
  environments: Environment[];
  selectedEnvironmentId: string | null;
}

export function EditModal({ isOpen, onClose, target, onSave, environments, selectedEnvironmentId }: EditModalProps) {
  const [name, setName] = useState(target?.name || '');

  useEffect(() => {
    if (isOpen && target) {
      setName(target.name);
    }
  }, [isOpen, target]);

  const handleSave = () => {
    onSave(name);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
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
            className="relative w-full max-w-md bg-bg-card border border-border-subtle rounded-2xl shadow-2xl"
          >
            <div className="p-6 border-b border-border-subtle flex justify-between items-center">
              <h3 className="text-lg font-bold text-text-main flex items-center gap-2">
                <Database className="w-5 h-5 text-brand-accent" />
                Rename {target?.type === 'collection' ? 'Collection' : target?.type === 'environment' ? 'Environment' : 'Request'}
              </h3>
              <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-text-dim hover:text-text-main transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-text-dim px-1">New Name</label>
                <VariableInput 
                  value={name}
                  onChange={setName}
                  environments={environments}
                  selectedEnvironmentId={selectedEnvironmentId}
                  placeholder="Enter name..."
                  className="w-full"
                />
              </div>
              <p className="text-[11px] text-text-dim px-1 leading-relaxed">
                Provide a clear and descriptive name to keep your workflow organised. Changes are applied instantly.
              </p>
            </div>

            <div className="p-6 bg-white/[0.01] flex gap-3 justify-end overflow-visible">
              <button 
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl text-sm font-semibold text-text-dim hover:text-text-main hover:bg-white/5 transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={handleSave}
                className="px-8 py-2.5 rounded-xl text-sm font-semibold text-white bg-brand-accent hover:brightness-110 shadow-[0_0_20px_rgba(139,92,246,0.3)] transition-all"
              >
                Save Changes
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
