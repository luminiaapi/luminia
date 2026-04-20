/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ReactNode } from 'react';
import { motion } from 'motion/react';

interface NavItemProps {
  icon: ReactNode;
  active?: boolean;
  onClick: () => void;
  label?: string;
}

export function NavItem({ icon, active, onClick, label = "Navigate" }: NavItemProps) {
  return (
    <button 
      onClick={onClick}
      className={`relative p-3.5 rounded-2xl transition-all duration-300 group outline-none ${
        active 
          ? 'bg-brand-accent text-white shadow-[0_8px_20px_rgba(139,92,246,0.3)] ring-1 ring-white/20' 
          : 'text-text-dim hover:text-white hover:bg-white/5 active:scale-95'
      }`}
    >
      <div className={`transition-transform duration-300 ${active ? 'scale-110' : 'group-hover:scale-110'}`}>
        {icon}
      </div>
      
      {active && (
        <motion.div 
          layoutId="nav-active-glow"
          className="absolute inset-0 rounded-2xl bg-brand-accent/40 blur-xl z-[-1]" 
          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
        />
      )}

      {/* Tooltip */}
      <div className="absolute left-full ml-4 px-3 py-1.5 bg-bg-card border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:translate-x-1 pointer-events-none whitespace-nowrap z-[100] shadow-2xl ring-1 ring-white/5">
        {label}
      </div>
    </button>
  );
}
