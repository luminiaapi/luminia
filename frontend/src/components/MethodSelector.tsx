/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, Info } from 'lucide-react';
import { HttpMethod } from '../types';
import { getMethodColor } from '../constants';

interface MethodSelectorProps {
  method: HttpMethod;
  onChange: (method: HttpMethod) => void;
}

const METHOD_DETAILS: Record<HttpMethod, { desc: string }> = {
  GET: { desc: 'Retrieve data from a server' },
  POST: { desc: 'Submit data to be processed' },
  PUT: { desc: 'Update or replace existing data' },
  PATCH: { desc: 'Apply partial modifications' },
  DELETE: { desc: 'Remove existing data' },
};

export function MethodSelector({ method, onChange }: MethodSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const methods: HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

  return (
    <div className="relative" ref={containerRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-between gap-4 transition-all outline-none min-w-[140px] rounded-l-xl px-6 py-2.5 bg-white/[0.02] hover:bg-white/[0.04] border-r border-white/10 ${getMethodColor(method)} group`}
      >
        <div className="flex flex-col items-start translate-y-[1px]">
          <span className="text-[8px] uppercase tracking-[0.2em] font-black opacity-30 group-hover:opacity-50 transition-opacity">Method</span>
          <span className="text-sm font-black tracking-tight">{method}</span>
        </div>
        <ChevronDown className={`w-4 h-4 transition-transform duration-500 cubic-bezier(0.4, 0, 0.2, 1) ${isOpen ? 'rotate-180' : ''} opacity-30 group-hover:opacity-60`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ type: "spring", duration: 0.5, bounce: 0.1 }}
            className="absolute top-full left-0 mt-3 w-64 bg-[#1a1a1a] border border-white/20 rounded-2xl shadow-[0_30px_70px_rgba(0,0,0,0.9)] py-3 z-[100] backdrop-blur-2xl ring-1 ring-white/10"
          >
            <div className="px-4 pb-2 mb-2 border-b border-white/5 flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest opacity-30">Change Method</span>
              <Info className="w-3 h-3 opacity-20" />
            </div>
            {methods.map((m) => {
              const isSelected = method === m;
              return (
                <button
                  key={m}
                  onClick={() => {
                    onChange(m);
                    setIsOpen(false);
                  }}
                  className={`w-full flex flex-col items-start gap-0.5 px-4 py-2.5 transition-all hover:bg-white/5 relative group/item`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${isSelected ? getMethodColor(m).replace('text-', 'bg-') + ' shadow-[0_0_12px_currentColor]' : 'bg-white/10 group-hover/item:bg-white/20'}`} />
                    <span className={`text-xs font-black tracking-tight ${isSelected ? getMethodColor(m) : 'text-text-dim group-hover/item:text-text-main'}`}>
                      {m}
                    </span>
                  </div>
                  <span className="text-[10px] opacity-20 group-hover/item:opacity-40 ml-[1.125rem] transition-opacity font-medium leading-tight">
                    {METHOD_DETAILS[m].desc}
                  </span>
                  
                  {isSelected && (
                    <motion.div 
                      layoutId="method-active-indicator"
                      className="absolute right-4 top-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-brand-accent shadow-[0_0_8px_#8b5cf6]"
                    />
                  )}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
