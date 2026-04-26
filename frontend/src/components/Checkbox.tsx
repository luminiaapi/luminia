/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import { Check } from 'lucide-react';

interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
  disabled?: boolean;
}

export function Checkbox({ checked, onChange, className = '', disabled }: CheckboxProps) {
  return (
    <button
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className={`
        relative w-4 h-4 rounded-md border transition-all duration-300 flex items-center justify-center outline-none shrink-0
        ${checked 
          ? (disabled ? 'bg-white/10 border-white/[0.06]' : 'bg-brand-accent border-brand-accent/30 shadow-[0_0_10px_rgba(139,92,246,0.4)]')
          : 'bg-white/[0.02] border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.05]'}
        ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
    >
      {checked && (
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", damping: 15, stiffness: 300 }}
        >
          <Check className="w-3 h-3 text-white stroke-[4]" />
        </motion.div>
      )}
      
      {/* Visual focus ring for accessibility */}
      <div className="absolute inset-[-4px] rounded-lg border border-brand-accent/0 group-focus-visible:border-brand-accent/30 transition-all" />
    </button>
  );
}
