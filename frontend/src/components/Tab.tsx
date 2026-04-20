/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';

interface TabProps {
  label: string;
  active?: boolean;
  count?: number;
  onClick?: () => void;
}

export function Tab({ label, active, count, onClick }: TabProps) {
  return (
    <div 
      onClick={onClick}
      className="relative pb-3 pt-1 px-2 cursor-pointer group flex items-center gap-2.5 outline-none select-none"
    >
      <span className={`text-[11px] font-bold uppercase tracking-widest transition-all duration-300 ${active ? 'text-white' : 'text-text-dim group-hover:text-text-main group-hover:translate-y-[-1px]'}`}>
        {label}
      </span>
      {count !== undefined && (
        <div className={`px-1.5 py-0.5 rounded-md text-[9px] font-black transition-all duration-500 ${active ? 'bg-brand-accent text-white shadow-[0_0_12px_rgba(139,92,246,0.4)]' : 'bg-white/5 text-text-dim group-hover:bg-white/10 opacity-50 group-hover:opacity-100'}`}>
          {count}
        </div>
      )}
      {active && (
        <motion.div 
          layoutId="tab-underline"
          className="absolute bottom-0 left-0 right-0 h-[3px] bg-brand-accent rounded-t-full shadow-[0_-4px_12px_rgba(139,92,246,0.6)]" 
          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
        />
      )}
      {!active && (
        <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-white/0 group-hover:bg-white/5 transition-colors" />
      )}
    </div>
  );
}
