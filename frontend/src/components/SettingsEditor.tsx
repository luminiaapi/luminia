/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import { Settings, Shield, Monitor, Palette, Globe, Server, Check, ArrowLeft } from 'lucide-react';
import { useSettingsStore, Theme } from '../store/useSettingsStore';

interface SettingsEditorProps {
  onBack: () => void;
}

export function SettingsEditor({ onBack }: SettingsEditorProps) {
  const { theme, setTheme, accentColor, setAccentColor, proxy, setProxy } = useSettingsStore();

  const themes: { id: Theme; name: string; icon: any }[] = [
    { id: 'light', name: 'Light', icon: Monitor },
    { id: 'dark', name: 'Dark', icon: Monitor },
    { id: 'system', name: 'System', icon: Monitor },
  ];

  const colors = [
    '#8B5CF6', // Purple
    '#3B82F6', // Blue
    '#10B981', // Emerald
    '#F59E0B', // Amber
    '#EF4444', // Red
    '#EC4899', // Pink
  ];

  return (
    <div className="flex-1 h-full overflow-y-auto bg-bg-deep">
      <div className="p-8 max-w-4xl mx-auto w-full pb-12">
        <div className="mb-6">
          <button 
            onClick={onBack}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-text-dim hover:text-text-main hover:bg-white/5 transition-all text-xs font-bold group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            Back to Workspace
          </button>
        </div>

        <div className="flex items-center gap-4 mb-10">
          <div className="w-12 h-12 rounded-2xl bg-brand-accent/10 flex items-center justify-center text-brand-accent">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight">System Settings</h2>
            <p className="text-xs text-text-dim uppercase tracking-widest font-bold opacity-40">Preferences & Configuration</p>
          </div>
        </div>

        <div className="space-y-8 pb-12">
          {/* Appearance Section */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-text-main">
              <Palette className="w-4 h-4 text-brand-accent" />
              <h3 className="text-sm font-bold uppercase tracking-widest">Appearance</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-bg-card border border-white/5 rounded-3xl p-6">
                <label className="text-[10px] font-black text-text-dim uppercase tracking-widest block mb-4">Color Theme</label>
                <div className="grid grid-cols-3 gap-2">
                  {themes.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setTheme(t.id)}
                      className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${
                        theme === t.id 
                          ? 'bg-brand-accent/10 border-brand-accent text-brand-accent' 
                          : 'bg-white/5 border-transparent text-text-dim hover:bg-white/10'
                      }`}
                    >
                      <t.icon className="w-5 h-5" />
                      <span className="text-[10px] font-bold uppercase tracking-widest">{t.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-bg-card border border-white/5 rounded-3xl p-6">
                <label className="text-[10px] font-black text-text-dim uppercase tracking-widest block mb-4">Accent Color</label>
                <div className="flex flex-wrap gap-3">
                  {colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setAccentColor(color)}
                      className="w-10 h-10 rounded-full border-2 transition-transform hover:scale-110 flex items-center justify-center"
                      style={{ 
                        backgroundColor: color, 
                        borderColor: accentColor === color ? 'white' : 'transparent',
                        boxShadow: accentColor === color ? `0 0 15px ${color}80` : 'none'
                      }}
                    >
                      {accentColor === color && <Check className="w-4 h-4 text-white" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Network Section */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-text-main">
              <Globe className="w-4 h-4 text-brand-accent" />
              <h3 className="text-sm font-bold uppercase tracking-widest">Network & Proxy</h3>
            </div>
            
            <div className="bg-bg-card border border-white/5 rounded-3xl p-8 space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-text-dim">
                    <Server className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Proxy Server</h4>
                    <p className="text-xs text-text-dim">Routing request through a proxy server</p>
                  </div>
                </div>
                <button
                  onClick={() => setProxy({ enabled: !proxy.enabled })}
                  className={`w-12 h-6 rounded-full transition-colors relative ${proxy.enabled ? 'bg-brand-accent' : 'bg-white/10'}`}
                >
                  <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${proxy.enabled ? 'translate-x-6' : ''}`} />
                </button>
              </div>

              <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 transition-opacity duration-300 ${proxy.enabled ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-text-dim uppercase tracking-widest px-1">HTTP Proxy</label>
                  <input 
                    type="text" 
                    value={proxy.http}
                    onChange={(e) => setProxy({ http: e.target.value })}
                    placeholder="http://127.0.0.1:8080"
                    className="w-full bg-bg-deep border border-white/5 rounded-xl px-4 py-2 text-xs focus:ring-1 focus:ring-brand-accent outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-text-dim uppercase tracking-widest px-1">HTTPS Proxy</label>
                  <input 
                    type="text" 
                    value={proxy.https}
                    onChange={(e) => setProxy({ https: e.target.value })}
                    placeholder="https://127.0.0.1:8443"
                    className="w-full bg-bg-deep border border-white/5 rounded-xl px-4 py-2 text-xs focus:ring-1 focus:ring-brand-accent outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-text-dim uppercase tracking-widest px-1">SOCKS Proxy</label>
                  <input 
                    type="text" 
                    value={proxy.socks}
                    onChange={(e) => setProxy({ socks: e.target.value })}
                    placeholder="socks5://127.0.0.1:1080"
                    className="w-full bg-bg-deep border border-white/5 rounded-xl px-4 py-2 text-xs focus:ring-1 focus:ring-brand-accent outline-none"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Security Banner */}
          <div className="p-6 rounded-3xl border border-brand-accent/20 bg-brand-accent/5 flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-brand-accent/10 flex items-center justify-center text-brand-accent shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white mb-1">Local Configuration</h4>
              <p className="text-xs text-text-dim leading-relaxed">
                These settings are stored locally on your device. They are not synchronized across workspaces for security reasons. Theme preferences are applied globally across all local workspaces.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
