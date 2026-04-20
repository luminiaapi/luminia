import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Globe, Plus, Trash2, Lock, ShieldCheck, Calendar } from 'lucide-react';
import { Cookie } from '../types';

interface CookieModalProps {
  isOpen: boolean;
  onClose: () => void;
  cookies: Cookie[];
  onAdd: (domain: string) => void;
  onUpdate: (id: string, updates: Partial<Cookie>) => void;
  onRemove: (id: string) => void;
}

export function CookieModal({
  isOpen,
  onClose,
  cookies,
  onAdd,
  onUpdate,
  onRemove
}: CookieModalProps) {
  const [newDomain, setNewDomain] = useState('');
  
  // Group cookies by domain
  const domains = Array.from(new Set(cookies.map(c => c.domain)));

  const handleAddDomain = (e: React.FormEvent) => {
    e.preventDefault();
    if (newDomain) {
      onAdd(newDomain);
      setNewDomain('');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
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
            className="w-full max-w-3xl bg-bg-card border border-white/10 rounded-2xl shadow-[0_32px_64px_rgba(0,0,0,0.5)] overflow-hidden relative z-10 flex flex-col max-h-[80vh]"
          >
            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-brand-accent/10 rounded-xl">
                  <Globe className="w-5 h-5 text-brand-accent" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white tracking-tight">Cookie Manager</h2>
                  <p className="text-xs text-text-dim uppercase tracking-widest font-bold opacity-40">Manage domain-specific cookies</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 text-text-dim hover:text-white hover:bg-white/5 rounded-lg transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
              <div className="mb-8">
                <form onSubmit={handleAddDomain} className="flex gap-2">
                  <div className="flex-1 relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-dim opacity-40" />
                    <input 
                      type="text"
                      value={newDomain}
                      onChange={(e) => setNewDomain(e.target.value)}
                      placeholder="Enter domain (e.g. google.com)"
                      className="w-full bg-bg-deep border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm font-mono focus:outline-none focus:border-brand-accent/50 transition-all"
                    />
                  </div>
                  <button 
                    type="submit"
                    className="flex items-center gap-2 bg-brand-accent hover:brightness-110 text-white px-5 rounded-xl text-sm font-bold transition-all shadow-[0_8px_20px_rgba(139,92,246,0.3)]"
                  >
                    <Plus className="w-4 h-4" />
                    Add Domain
                  </button>
                </form>
              </div>

              {domains.length === 0 ? (
                <div className="py-20 text-center border-2 border-dashed border-white/5 rounded-2xl">
                  <Globe className="w-12 h-12 text-text-dim opacity-10 mx-auto mb-4" />
                  <p className="text-text-dim font-medium italic">No domains configured yet.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {domains.map(domain => (
                    <div key={domain} className="bg-white/[0.02] border border-white/5 rounded-xl overflow-hidden">
                      <div className="px-4 py-3 bg-white/[0.03] border-b border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Globe className="w-3.5 h-3.5 text-brand-accent" />
                          <span className="text-sm font-black text-white">{domain}</span>
                        </div>
                        <button 
                          onClick={() => onAdd(domain)}
                          className="flex items-center gap-1.5 text-[10px] font-black uppercase text-brand-accent hover:brightness-125 transition-all"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Add Cookie
                        </button>
                      </div>
                      <div className="p-2 space-y-2">
                        {cookies.filter(c => c.domain === domain).map(cookie => (
                          <div key={cookie.id} className="p-3 bg-bg-deep/50 rounded-lg border border-white/5 group relative">
                            <div className="grid grid-cols-2 gap-4 mb-3">
                              <div className="space-y-1">
                                <label className="text-[9px] font-black text-text-dim uppercase tracking-widest pl-1">Name</label>
                                <input 
                                  className="w-full bg-bg-card border border-white/10 rounded-md px-3 py-1.5 text-xs font-mono focus:outline-none focus:border-brand-accent/50 shadow-inner"
                                  value={cookie.name}
                                  onChange={(e) => onUpdate(cookie.id, { name: e.target.value })}
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[9px] font-black text-text-dim uppercase tracking-widest pl-1">Value</label>
                                <input 
                                  className="w-full bg-bg-card border border-white/10 rounded-md px-3 py-1.5 text-xs font-mono focus:outline-none focus:border-brand-accent/50 shadow-inner"
                                  value={cookie.value}
                                  onChange={(e) => onUpdate(cookie.id, { value: e.target.value })}
                                />
                              </div>
                            </div>
                            <div className="flex items-center gap-4 flex-wrap">
                              <div className="flex items-center gap-1.5 bg-bg-card px-2 py-1 rounded border border-white/5">
                                <Calendar className="w-3 h-3 text-text-dim opacity-40" />
                                <span className="text-[10px] text-text-dim font-bold uppercase truncate max-w-[100px]">{cookie.path}</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <button 
                                  onClick={() => onUpdate(cookie.id, { httpOnly: !cookie.httpOnly })}
                                  className={`flex items-center gap-1.5 px-2 py-1 rounded border transition-all ${cookie.httpOnly ? 'bg-amber-500/10 border-amber-500/30 text-amber-500' : 'bg-white/5 border-white/5 text-text-dim hover:bg-white/10'}`}
                                >
                                  <Lock className="w-3 h-3" />
                                  <span className="text-[10px] font-bold pb-0.5">HttpOnly</span>
                                </button>
                                <button 
                                  onClick={() => onUpdate(cookie.id, { secure: !cookie.secure })}
                                  className={`flex items-center gap-1.5 px-2 py-1 rounded border transition-all ${cookie.secure ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' : 'bg-white/5 border-white/5 text-text-dim hover:bg-white/10'}`}
                                >
                                  <ShieldCheck className="w-3 h-3" />
                                  <span className="text-[10px] font-bold pb-0.5">Secure</span>
                                </button>
                              </div>
                              <button 
                                onClick={() => onRemove(cookie.id)}
                                className="absolute right-3 top-3 p-1.5 text-text-dim hover:text-danger hover:bg-danger/10 rounded transition-all opacity-0 group-hover:opacity-100"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="p-6 bg-white/[0.01] border-t border-white/5 flex justify-end">
              <button 
                onClick={onClose}
                className="bg-white/5 hover:bg-white/10 text-white px-8 py-2.5 rounded-xl text-sm font-bold transition-all"
              >
                Close Manager
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
