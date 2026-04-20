/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion, AnimatePresence } from 'motion/react';
import { Save, Trash2, X, AlertCircle } from 'lucide-react';

interface SavePromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  onDiscard: () => void;
  requestName: string;
}

export function SavePromptModal({ isOpen, onClose, onSave, onDiscard, requestName }: SavePromptModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
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
            className="relative w-full max-w-md bg-bg-card border border-white/10 rounded-3xl shadow-2xl overflow-hidden p-8"
          >
            <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-brand-accent/10 rounded-full blur-[80px] pointer-events-none -mr-20 -mt-20" />
            
            <div className="flex justify-between items-center mb-6">
              <div className="w-12 h-12 rounded-2xl bg-brand-accent/10 flex items-center justify-center text-brand-accent">
                <Save className="w-6 h-6" />
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-white/5 rounded-full text-text-dim hover:text-white transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-8">
              <h2 className="text-xl font-bold text-white mb-2">Unsaved Changes</h2>
              <p className="text-sm text-text-dim leading-relaxed">
                The request <span className="text-brand-accent font-mono">"{requestName}"</span> has unsaved changes. Would you like to save them before closing?
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={onDiscard}
                className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-bg-deep border border-white/5 text-text-dim hover:text-danger hover:border-danger/30 transition-all text-sm font-bold"
              >
                <Trash2 className="w-4 h-4" />
                Discard
              </button>
              <button 
                onClick={onSave}
                className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-brand-accent text-white shadow-[0_10px_20px_rgba(139,92,246,0.2)] hover:brightness-110 transition-all text-sm font-bold"
              >
                <Save className="w-4 h-4" />
                Save Changes
              </button>
            </div>
            
            <div className="mt-6 pt-6 border-t border-white/5 flex items-center gap-2 text-[10px] text-text-dim/50 uppercase font-bold tracking-widest justify-center">
              <AlertCircle className="w-3 h-3" />
              <span>You can also use Ctrl + S to save manually</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
