/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Shield } from 'lucide-react';
import { RequestTab, Environment } from '../types';
import { VariableInput } from './VariableInput';

interface AuthEditorProps {
  auth: RequestTab['auth'];
  onUpdate: (auth: RequestTab['auth']) => void;
  environments: Environment[];
  selectedEnvironmentId: string | null;
}

export function AuthEditor({ auth, onUpdate, environments, selectedEnvironmentId }: AuthEditorProps) {
  return (
    <div className="p-8 max-w-2xl">
      <div className="flex gap-4 items-center mb-8">
        <Shield className="w-5 h-5 text-brand-accent" />
        <h3 className="text-sm font-semibold">Authorization Method</h3>
      </div>
      
        <div className="grid grid-cols-2 gap-4 mb-8">
          {(['none', 'bearer', 'basic', 'apikey'] as const).map(type => {
            const isSelected = auth.type === type;
            const label = type === 'none' ? 'No Auth' : type.replace('apikey', 'API Key').replace('bearer', 'Bearer Token').replace('basic', 'Basic Auth');
            
            return (
              <button
                key={type}
                onClick={() => onUpdate({ ...auth, type })}
                className={`px-6 py-4 rounded-2xl border transition-all text-left relative group overflow-hidden ${isSelected ? 'bg-brand-accent/5 border-brand-accent/50 ring-1 ring-brand-accent/20' : 'bg-white/[0.01] border-white/5 hover:border-white/10'}`}
              >
                {isSelected && (
                  <div className="absolute top-0 right-0 w-12 h-12 bg-brand-accent/10 rounded-full blur-xl -mr-6 -mt-6" />
                )}
                <div className="relative z-10">
                  <span className={`block text-[10px] font-black uppercase tracking-[0.2em] mb-1 transition-colors ${isSelected ? 'text-brand-accent' : 'text-text-dim/40 group-hover:text-text-dim'}`}>
                    Method
                  </span>
                  <span className={`text-sm font-bold tracking-tight transition-colors ${isSelected ? 'text-white' : 'text-text-dim group-hover:text-text-main'}`}>
                    {label}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

      <div className="space-y-6">
        {auth.type === 'bearer' && (
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold text-text-dim tracking-wider">Token</label>
            <VariableInput 
              placeholder="Bearer Token..."
              value={auth.bearerToken || ''}
              onChange={(val) => onUpdate({ ...auth, bearerToken: val })}
              environments={environments}
              selectedEnvironmentId={selectedEnvironmentId}
            />
          </div>
        )}
        
        {auth.type === 'basic' && (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold text-text-dim tracking-wider">Username</label>
              <VariableInput 
                placeholder="admin"
                value={auth.username || ''}
                onChange={(val) => onUpdate({ ...auth, username: val })}
                environments={environments}
                selectedEnvironmentId={selectedEnvironmentId}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold text-text-dim tracking-wider">Password</label>
              <VariableInput 
                placeholder="password..."
                value={auth.password || ''}
                onChange={(val) => onUpdate({ ...auth, password: val })}
                environments={environments}
                selectedEnvironmentId={selectedEnvironmentId}
              />
            </div>
          </div>
        )}

        {auth.type === 'apikey' && (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold text-text-dim tracking-wider">Key</label>
              <VariableInput 
                placeholder="X-API-KEY"
                value={auth.apiKeyName || ''}
                onChange={(val) => onUpdate({ ...auth, apiKeyName: val })}
                environments={environments}
                selectedEnvironmentId={selectedEnvironmentId}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold text-text-dim tracking-wider">Value</label>
              <VariableInput 
                placeholder="API Key Value..."
                value={auth.apiKeyValue || ''}
                onChange={(val) => onUpdate({ ...auth, apiKeyValue: val })}
                environments={environments}
                selectedEnvironmentId={selectedEnvironmentId}
              />
            </div>
          </div>
        )}

        {auth.type === 'none' && (
          <div className="py-12 flex flex-col items-center justify-center border-t border-white/5">
            <Shield className="w-12 h-12 text-text-dim opacity-10 mb-4" />
            <p className="text-text-dim text-sm italic">This request does not require authentication.</p>
          </div>
        )}
      </div>
    </div>
  );
}
