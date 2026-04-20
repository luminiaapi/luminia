/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion, AnimatePresence } from 'motion/react';
import { Save, X, Folder, ChevronRight, Search, Plus, FolderOpen } from 'lucide-react';
import { Collection } from '../types';
import { useState } from 'react';

interface SaveToCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (collectionId: string, name: string) => void;
  collections: Collection[];
  initialRequestName: string;
}

export function SaveToCollectionModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  collections,
  initialRequestName
}: SaveToCollectionModalProps) {
  const [search, setSearch] = useState('');
  const [requestName, setRequestName] = useState(initialRequestName);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(
    collections.length > 0 ? collections[0].id : null
  );

  const handleSave = () => {
    if (selectedCollectionId && requestName.trim()) {
      onConfirm(selectedCollectionId, requestName.trim());
    }
  };

  const renderCollectionItems = (cols: Collection[], level = 0) => {
    // Flatten search filter for simplicity in a modal selector
    return cols.map(col => {
      const isVisible = col.name.toLowerCase().includes(search.toLowerCase());
      const hasVisibleChildren = col.children?.some(c => c.name.toLowerCase().includes(search.toLowerCase()));
      
      if (!isVisible && !hasVisibleChildren && search) return null;

      return (
        <div key={col.id} className="space-y-1">
          <div 
            onClick={() => setSelectedCollectionId(col.id)}
            className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all border ${
              selectedCollectionId === col.id 
                ? 'bg-brand-accent/10 border-brand-accent/30 text-brand-accent' 
                : 'bg-transparent border-transparent text-text-dim hover:bg-white/[0.02] hover:border-white/5'
            }`}
            style={{ marginLeft: `${level * 16}px` }}
          >
            <div className={`p-1.5 rounded-xl border ${selectedCollectionId === col.id ? 'bg-brand-accent/20 border-brand-accent/20' : 'bg-white/5 border-white/5'}`}>
              <Folder className="w-3.5 h-3.5" />
            </div>
            <span className="text-sm font-bold flex-1 truncate">{col.name}</span>
            {selectedCollectionId === col.id && (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                <FolderOpen className="w-3.5 h-3.5" />
              </motion.div>
            )}
          </div>
          {col.children && renderCollectionItems(col.children, level + 1)}
        </div>
      );
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
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
            className="relative w-full max-w-lg bg-bg-card border border-white/10 rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-brand-accent/10 rounded-full blur-[100px] pointer-events-none -mr-32 -mt-32" />
            
            <div className="p-8 pb-4 shrink-0">
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-brand-accent/10 flex items-center justify-center text-brand-accent shadow-[0_8px_16px_rgba(139,92,246,0.15)] border border-brand-accent/20">
                    <Save className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-white tracking-tight">Save to Collection</h2>
                    <p className="text-[10px] text-text-dim uppercase tracking-[0.2em] font-black opacity-40">Choose a location</p>
                  </div>
                </div>
                <button 
                  onClick={onClose}
                  className="p-2.5 hover:bg-white/5 rounded-xl text-text-dim hover:text-white transition-all group"
                >
                  <X className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="text-[10px] text-text-dim uppercase tracking-widest font-black mb-2.5 block ml-1 opacity-60">Request Name</label>
                  <div className="relative group">
                    <input 
                      autoFocus
                      type="text" 
                      value={requestName}
                      onChange={(e) => setRequestName(e.target.value)}
                      placeholder="e.g. Get User Profile"
                      className="w-full bg-bg-deep border border-white/5 rounded-2xl px-5 py-4 text-sm text-white placeholder:text-text-dim/30 focus:outline-none focus:border-brand-accent/50 transition-all font-medium"
                    />
                  </div>
                </div>

                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-dim/40">
                    <Search className="w-4 h-4" />
                  </div>
                  <input 
                    type="text" 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search collections..."
                    className="w-full bg-white/[0.02] border border-white/5 rounded-2xl pl-11 pr-5 py-3 text-xs text-white placeholder:text-text-dim/20 focus:outline-none focus:border-white/10 transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-8 py-2 custom-scrollbar min-h-[200px]">
              <div className="space-y-1.5">
                {collections.length > 0 ? (
                  renderCollectionItems(collections)
                ) : (
                  <div className="py-12 text-center">
                    <Folder className="w-8 h-8 text-text-dim mx-auto mb-3 opacity-20" />
                    <p className="text-sm text-text-dim opacity-40 italic">No collections found</p>
                  </div>
                )}
              </div>
            </div>

            <div className="p-8 pt-4 bg-white/[0.01] border-t border-white/5 shrink-0 flex gap-3">
              <button 
                onClick={onClose}
                className="flex-1 px-6 py-4 rounded-2xl bg-bg-deep border border-white/5 text-text-dim hover:text-white hover:border-white/10 transition-all text-sm font-black uppercase tracking-widest"
              >
                Cancel
              </button>
              <button 
                onClick={handleSave}
                disabled={!selectedCollectionId || !requestName.trim()}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-brand-accent text-white shadow-[0_10px_30px_rgba(139,92,246,0.3)] hover:brightness-110 disabled:opacity-50 disabled:grayscale transition-all text-sm font-black uppercase tracking-widest"
              >
                <Save className="w-4 h-4" />
                Save Request
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
