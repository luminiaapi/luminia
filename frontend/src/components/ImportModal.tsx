import { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, FileJson, Cloud, Moon, Send, Upload, FileCode, CheckCircle, AlertCircle } from 'lucide-react';
import { Collection } from '../types';
import { importPostmanCollection } from '../lib/importers/postman';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportCollection: (collection: Collection) => void;
}

const options = [
  { id: 'postman',    name: 'Postman',     description: 'Import Postman Collections (v2.0/v2.1)', icon: <Send className="w-5 h-5" />,     color: 'text-orange-400' },
  { id: 'openapi',   name: 'OpenAPI',     description: 'Import from Swagger or OpenAPI 3.0/3.1',  icon: <FileCode className="w-5 h-5" />, color: 'text-blue-400' },
  { id: 'hoppscotch',name: 'Hoppscotch',  description: 'Import Hoppscotch collection JSON files', icon: <Cloud className="w-5 h-5" />,    color: 'text-emerald-400' },
  { id: 'insomnia',  name: 'Insomnia',    description: 'Import Insomnia export JSON files',       icon: <Moon className="w-5 h-5" />,     color: 'text-purple-400' },
] as const;

type ImportType = typeof options[number]['id'];

export function ImportModal({ isOpen, onClose, onImportCollection }: ImportModalProps) {
  const [selected, setSelected] = useState<ImportType | null>(null);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const reset = () => { setSelected(null); setStatus('idle'); setErrorMsg(''); };
  const handleClose = () => { reset(); onClose(); };

  const handleSelect = (id: ImportType) => {
    setSelected(id);
    setStatus('idle');
    setErrorMsg('');
    // Only Postman is implemented — trigger file picker immediately
    if (id === 'postman') {
      setTimeout(() => fileRef.current?.click(), 50);
    }
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = ''; // reset so same file can be re-selected

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const json = ev.target?.result as string;
        let collection: Collection;

        if (selected === 'postman') {
          collection = importPostmanCollection(json);
        } else {
          throw new Error(`${selected} import is not yet supported.`);
        }

        onImportCollection(collection);
        setStatus('success');
        setTimeout(() => handleClose(), 1200);
      } catch (err: any) {
        setStatus('error');
        setErrorMsg(err?.message || 'Failed to parse file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={handleClose} className="absolute inset-0 bg-black/80 backdrop-blur-md" />

          <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-lg bg-bg-card border border-white/10 rounded-3xl shadow-[0_32px_64px_rgba(0,0,0,0.5)] overflow-hidden">

            {/* Header */}
            <div className="p-8 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-accent/20 flex items-center justify-center text-brand-accent">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-white">Import Collection</h2>
                  <p className="text-xs text-text-dim opacity-60">Bring your external requests into Lumina</p>
                </div>
              </div>
              <button onClick={handleClose} className="p-2 hover:bg-white/5 rounded-full transition-colors text-text-dim">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Options */}
            <div className="p-6 grid grid-cols-1 gap-3">
              {options.map((opt) => (
                <button key={opt.id} onClick={() => handleSelect(opt.id)}
                  className={`flex items-center gap-4 p-4 rounded-2xl border transition-all text-left group
                    ${selected === opt.id
                      ? 'border-brand-accent/50 bg-brand-accent/5'
                      : 'bg-white/[0.02] border-white/5 hover:border-brand-accent/30 hover:bg-white/[0.06]'}
                    ${opt.id !== 'postman' ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={opt.id !== 'postman'}
                >
                  <div className={`w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center ${opt.color} group-hover:scale-110 transition-transform`}>
                    {opt.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-black text-white group-hover:text-brand-accent transition-colors flex items-center gap-2">
                      {opt.name}
                      {opt.id !== 'postman' && <span className="text-[9px] bg-white/10 px-1.5 py-0.5 rounded font-bold uppercase tracking-widest text-text-dim">Soon</span>}
                    </div>
                    <div className="text-[11px] text-text-dim opacity-60 leading-tight mt-0.5">{opt.description}</div>
                  </div>
                </button>
              ))}
            </div>

            {/* Status */}
            <AnimatePresence>
              {status !== 'idle' && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className={`mx-6 mb-4 px-4 py-3 rounded-xl flex items-center gap-3 text-sm font-bold
                    ${status === 'success' ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
                  {status === 'success'
                    ? <><CheckCircle className="w-4 h-4 shrink-0" /> Collection imported successfully!</>
                    : <><AlertCircle className="w-4 h-4 shrink-0" /> {errorMsg}</>}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="p-6 pt-0 bg-white/[0.01] border-t border-white/5">
              <p className="text-[10px] text-center text-text-dim opacity-40 uppercase font-bold tracking-widest">
                Select a provider then choose your export file
              </p>
            </div>
          </motion.div>

          {/* Hidden file input */}
          <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={handleFile} />
        </div>
      )}
    </AnimatePresence>
  );
}
