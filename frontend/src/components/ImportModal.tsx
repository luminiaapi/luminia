/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion, AnimatePresence } from 'motion/react';
import { X, FileJson, Cloud, Moon, Send, Upload, FileCode } from 'lucide-react';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (type: 'openapi' | 'postman' | 'insomnia' | 'hoppscotch') => void;
}

export function ImportModal({ isOpen, onClose, onImport }: ImportModalProps) {
  const options = [
    { id: 'openapi', name: 'OpenAPI', description: 'Import from Swagger or OpenAPI 3.0/3.1 specs', icon: <FileCode className="w-5 h-5" />, color: 'text-blue-400' },
    { id: 'postman', name: 'Postman', description: 'Import Postman Collections (v2.0/v2.1)', icon: <Send className="w-5 h-5" />, color: 'text-orange-400' },
    { id: 'hoppscotch', name: 'Hoppscotch', description: 'Import Hoppscotch collection JSON files', icon: <Cloud className="w-5 h-5" />, color: 'text-emerald-400' },
    { id: 'insomnia', name: 'Insomnia', description: 'Import Insomnia export JSON files', icon: <Moon className="w-5 h-5" />, color: 'text-purple-400' },
  ] as const;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-lg bg-bg-card border border-white/10 rounded-3xl shadow-[0_32px_64px_rgba(0,0,0,0.5)] overflow-hidden"
          >
            <div className="p-8 border-b border-white/5 bg-white/[0.02]">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-accent/20 flex items-center justify-center text-brand-accent">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-white">Import Collection</h2>
                    <p className="text-xs text-text-dim opacity-60">Bring your external requests into Lumina</p>
                  </div>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors text-text-dim">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 grid grid-cols-1 gap-3">
              {options.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => onImport(opt.id)}
                  className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-brand-accent/50 hover:bg-white/[0.06] transition-all text-left group"
                >
                  <div className={`w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center ${opt.color} group-hover:scale-110 transition-transform`}>
                    {opt.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-black text-white group-hover:text-brand-accent transition-colors">{opt.name}</div>
                    <div className="text-[11px] text-text-dim opacity-60 leading-tight mt-0.5">{opt.description}</div>
                  </div>
                </button>
              ))}
            </div>

            <div className="p-6 bg-white/[0.01] border-t border-white/5">
              <p className="text-[10px] text-center text-text-dim opacity-40 uppercase font-bold tracking-widest leading-relaxed">
                Choose a provider to upload your export file. <br/>
                Lumina will automatically convert folders, requests, and variables.
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
