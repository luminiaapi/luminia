import { motion, AnimatePresence } from 'motion/react';
import { X, Globe, Server, Link, AlertCircle, Loader2 } from 'lucide-react';
import { useState } from 'react';

interface WorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (name: string, url: string) => Promise<void>;
}

export function WorkspaceModal({ isOpen, onClose, onAdd }: WorkspaceModalProps) {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && url.trim()) {
      setIsLoading(true);
      setError(null);
      try {
        await onAdd(name.trim(), url.trim());
        setName(''); 
        setUrl('');
        onClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to connect to server');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setName('');
      setUrl('');
      setError(null);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={handleClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-bg-card border border-white/10 rounded-3xl shadow-[0_32px_64px_rgba(0,0,0,0.5)] overflow-hidden">

            <div className="p-8 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-accent/20 flex items-center justify-center text-brand-accent">
                  <Server className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-white">Add Server</h2>
                  <p className="text-xs text-text-dim opacity-60">Connect to a remote Lumina server</p>
                </div>
              </div>
              <button onClick={handleClose} disabled={isLoading} className="p-2 hover:bg-white/5 rounded-full transition-colors text-text-dim disabled:opacity-50 disabled:cursor-not-allowed">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl"
                >
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-bold text-red-500">Connection Failed</p>
                    <p className="text-xs text-red-400 mt-1">{error}</p>
                  </div>
                </motion.div>
              )}

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-text-dim px-1">Server Name</label>
                <div className="relative group">
                  <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-dim group-focus-within:text-brand-accent transition-colors" />
                  <input 
                    autoFocus 
                    type="text" 
                    value={name} 
                    onChange={e => setName(e.target.value)}
                    placeholder="Production Server"
                    className="w-full bg-white/5 border border-white/5 focus:border-brand-accent/50 rounded-2xl py-4 pl-12 pr-6 text-sm font-medium outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    required 
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-text-dim px-1">Server URL</label>
                <div className="relative group">
                  <Link className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-dim group-focus-within:text-brand-accent transition-colors" />
                  <input 
                    type="url" 
                    value={url} 
                    onChange={e => setUrl(e.target.value)}
                    placeholder="https://lumina.your-domain.com"
                    className="w-full bg-white/5 border border-white/5 focus:border-brand-accent/50 rounded-2xl py-4 pl-12 pr-6 text-sm font-medium outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    required 
                    disabled={isLoading}
                  />
                </div>
              </div>

              <button 
                type="submit"
                disabled={isLoading}
                className="w-full bg-brand-accent hover:brightness-110 text-white font-black py-4 rounded-2xl shadow-[0_8px_20px_rgba(139,92,246,0.3)] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Server className="w-5 h-5" />
                    Add Server
                  </>
                )}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
