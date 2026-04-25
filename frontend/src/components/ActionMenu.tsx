import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MoreVertical, Edit2, Trash2, Download, Globe } from 'lucide-react';

interface ActionMenuProps {
  onEdit: () => void;
  onDelete: () => void;
  onExport?: () => void;
  onEnvironment?: () => void; // For collection-scoped environment
}

export function ActionMenu({ onEdit, onDelete, onExport, onEnvironment }: ActionMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleAction = (action: () => void) => {
    setIsOpen(false);
    action();
  };

  return (
    <div className="relative" ref={menuRef}>
      <button 
        onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
        className="p-1 hover:text-text-main text-text-dim transition-all"
      >
        <MoreVertical className="w-3.5 h-3.5" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            className="absolute right-0 top-full mt-2 w-40 bg-bg-card border border-white/10 rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.6)] z-[60] overflow-hidden backdrop-blur-2xl ring-1 ring-white/5 py-1.5"
          >
            <div className="px-3 pb-1 mb-1 border-b border-white/5">
              <span className="text-[9px] font-bold uppercase tracking-widest opacity-30">Manage</span>
            </div>
            
            <button 
              onClick={(e) => { e.stopPropagation(); handleAction(onEdit); }}
              className="w-full flex items-center gap-3 px-3 py-2 text-xs text-text-dim hover:text-white hover:bg-white/5 transition-all group/item"
            >
              <div className="w-6 h-6 rounded-lg bg-brand-accent/10 flex items-center justify-center text-brand-accent group-hover/item:bg-brand-accent group-hover/item:text-white transition-all">
                <Edit2 className="w-3.5 h-3.5" />
              </div>
              <span className="font-bold">Edit</span>
            </button>

            {onEnvironment && (
              <button 
                onClick={(e) => { e.stopPropagation(); handleAction(onEnvironment); }}
                className="w-full flex items-center gap-3 px-3 py-2 text-xs text-text-dim hover:text-white hover:bg-white/5 transition-all group/item"
              >
                <div className="w-6 h-6 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 group-hover/item:bg-blue-500 group-hover/item:text-white transition-all">
                  <Globe className="w-3.5 h-3.5" />
                </div>
                <span className="font-bold">Environment</span>
              </button>
            )}

            {onExport && (
              <button 
                onClick={(e) => { e.stopPropagation(); handleAction(onExport); }}
                className="w-full flex items-center gap-3 px-3 py-2 text-xs text-text-dim hover:text-white hover:bg-white/5 transition-all group/item"
              >
                <div className="w-6 h-6 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 group-hover/item:bg-emerald-500 group-hover/item:text-white transition-all">
                  <Download className="w-3.5 h-3.5" />
                </div>
                <span className="font-bold">Export</span>
              </button>
            )}

            <button 
              onClick={(e) => { e.stopPropagation(); handleAction(onDelete); }}
              className="w-full flex items-center gap-3 px-3 py-2 text-xs text-text-dim hover:text-danger hover:bg-danger/10 transition-all group/item"
            >
              <div className="w-6 h-6 rounded-lg bg-danger/10 flex items-center justify-center text-danger group-hover/item:bg-danger group-hover/item:text-white transition-all">
                <Trash2 className="w-3.5 h-3.5" />
              </div>
              <span className="font-bold">Delete</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
