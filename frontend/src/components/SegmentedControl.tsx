/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';

interface Option {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

interface SegmentedControlProps {
  options: readonly Option[];
  value: string;
  onChange: (value: any) => void;
  className?: string;
}

export function SegmentedControl({ options, value, onChange, className = '' }: SegmentedControlProps) {
  return (
    <div className={`relative flex p-1 bg-white/[0.03] border border-white/5 rounded-xl ${className}`}>
      {options.map((option) => {
        const isActive = value === option.id;
        
        return (
          <button
            key={option.id}
            onClick={() => onChange(option.id)}
            className={`
              relative flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider 
              transition-all duration-300 z-10
              ${isActive ? 'text-white' : 'text-text-dim hover:text-text-main'}
            `}
          >
            {isActive && (
              <motion.div
                layoutId="segmented-bg"
                className="absolute inset-0 bg-brand-accent rounded-lg shadow-[0_0_20px_rgba(139,92,246,0.3)] z-[-1]"
                transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
              />
            )}
            {option.icon && (
              <span className={`transition-transform duration-300 ${isActive ? 'scale-110' : 'opacity-50'}`}>
                {option.icon}
              </span>
            )}
            <span>{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
