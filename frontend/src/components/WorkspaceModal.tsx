/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion, AnimatePresence } from 'motion/react';
import { X, Globe, Server, Link } from 'lucide-react';
import { useState } from 'react';

interface WorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (name: string, url: string) => void;
}

export function WorkspaceModal({ isOpen, onClose, onAdd }: WorkspaceModalProps) {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && url) {
      onAdd(name, url);
      setName('');
      setUrl('');
      onClose();
    }
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
            className="relative w-full max-w-md bg-bg-card border border-white/10 rounded-3xl shadow-[0_32px_64px_rgba(0,0,0,0.5)] overflow-hidden"
          >
            <div className="p-8 border-b border-white/5 bg-white/[0.02]">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-accent/20 flex items-center justify-center text-brand-accent">
                    <Server className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-white">Add Workspace</h2>
                    <p className="text-xs text-text-dim opacity-60">Connect to a self-hosted Lumina server</p>
                  </div>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors text-text-dim">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-text-dim px-1">Workspace Name</label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-dim group-focus-within:text-brand-accent transition-colors">
                    <Globe className="w-4 h-4" />
                  </div>
                  <input
                    autoFocus
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Engineering Team"
                    className="w-full bg-white/5 border border-white/5 focus:border-brand-accent/50 focus:bg-white/[0.08] rounded-2xl py-4 pl-12 pr-6 text-sm font-medium transition-all outline-none"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-text-dim px-1">Server URL</label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-dim group-focus-within:text-brand-accent transition-colors">
                    <Link className="w-4 h-4" />
                  </div>
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://lumina.your-domain.com"
                    className="w-full bg-white/5 border border-white/5 focus:border-brand-accent/50 focus:bg-white/[0.08] rounded-2xl py-4 pl-12 pr-6 text-sm font-medium transition-all outline-none"
                    required
                  />
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  className="w-full bg-brand-accent hover:brightness-110 text-white font-black py-4 rounded-2xl shadow-[0_8px_20px_rgba(139,92,246,0.3)] transition-all flex items-center justify-center gap-2 group"
                >
                  <Server className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  Connect Workspace
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
