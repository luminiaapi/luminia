/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Mail, Lock, LogIn, Loader2 } from 'lucide-react';
import { Checkbox } from './Checkbox';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (email: string, password: string) => Promise<void>;
}

export function LoginModal({ isOpen, onClose, onLogin }: LoginModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      await onLogin(email, password);
      onClose();
      setEmail('');
      setPassword('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setEmail('');
      setPassword('');
      setError(null);
      setRememberMe(false);
      onClose();
    }
  };

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setEmail('');
      setPassword('');
      setError(null);
      setRememberMe(false);
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-bg-card border border-white/10 rounded-3xl shadow-2xl overflow-hidden p-8"
          >
            <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-brand-accent/10 rounded-full blur-[80px] pointer-events-none -mr-20 -mt-20" />
            
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">Welcome Back</h2>
                <p className="text-sm text-text-dim">Log in to your Lumina account</p>
              </div>
              <button 
                onClick={handleClose}
                disabled={isLoading}
                className="p-2 hover:bg-white/5 rounded-full text-text-dim hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl"
                >
                  <Lock className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-bold text-red-500">Login Failed</p>
                    <p className="text-xs text-red-400 mt-1">{error}</p>
                  </div>
                </motion.div>
              )}
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-text-dim ml-1">Email Address</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-text-dim group-focus-within:text-brand-accent transition-colors">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input 
                    type="email" 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    className="w-full bg-bg-deep border border-white/5 focus:border-brand-accent/50 rounded-2xl py-3.5 pl-11 pr-4 text-sm outline-none transition-all placeholder:text-text-dim/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="name@company.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-text-dim ml-1">Password</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-text-dim group-focus-within:text-brand-accent transition-colors">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input 
                    type="password" 
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    className="w-full bg-bg-deep border border-white/5 focus:border-brand-accent/50 rounded-2xl py-3.5 pl-11 pr-4 text-sm outline-none transition-all placeholder:text-text-dim/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-xs py-2">
                <div className="flex items-center gap-2 text-text-dim">
                  <Checkbox checked={rememberMe} onChange={setRememberMe} />
                  <span>Remember me</span>
                </div>
                <button type="button" className="text-brand-accent hover:brightness-110 transition-all font-medium">Forgot Password?</button>
              </div>

              <button 
                type="submit"
                disabled={isLoading}
                className="w-full bg-brand-accent hover:brightness-110 disabled:opacity-50 text-white font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-3 shadow-[0_10px_20px_rgba(139,92,246,0.2)]"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <span>Sign In</span>
                    <LogIn className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-white/5 text-center">
              <p className="text-sm text-text-dim">
                Don't have an account? {' '}
                <button className="text-brand-accent hover:brightness-110 transition-all font-medium font-bold">Create one now</button>
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
