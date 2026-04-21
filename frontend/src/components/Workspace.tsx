/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion, AnimatePresence } from 'motion/react';
import { X, Plus, Copy, Database, Trash2, Shield, Terminal, Cpu, Globe, ChevronDown, Cookie as CookieIcon, LayoutPanelTop, PanelsRightBottom, GripVertical, GripHorizontal } from 'lucide-react';
import { RequestTab, HttpMethod, KeyValuePair, Environment } from '../types';
import { getMethodColor } from '../constants';
import { useState, useRef, useEffect, useMemo } from 'react';
import { MethodSelector } from './MethodSelector';
import { Tab } from './Tab';
import { KeyValueEditor } from './KeyValueEditor';
import { AuthEditor } from './AuthEditor';
import { BodyEditor } from './BodyEditor';
import { VariableInput } from './VariableInput';
import { useResponsePanel } from '../hooks/useResponsePanel';
import { useCookieStore } from '../store/useCookieStore';
import { ScriptEditor } from './ScriptEditor';

import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

import { CodeGeneratorPanel } from './CodeGeneratorPanel';

interface WorkspaceProps {
  tabs: RequestTab[];
  activeTabId: string;
  activeWorkTab: 'params' | 'auth' | 'headers' | 'body' | 'scripts' | 'settings' | 'code';
  environments: Environment[];
  selectedEnvironmentId: string | null;
  onSetActiveTab: (id: string) => void;
  onCloseTab: (e: any, id: string) => void;
  onNewTab: () => void;
  onUpdateActiveTab: (updates: Partial<RequestTab>) => void;
  onUpdateKeyValuePair: (field: 'params' | 'headers' | 'bodyFormData' | 'bodyUrlEncoded' | 'pathVariables', id: string, updates: Partial<KeyValuePair>) => void;
  onRemoveKeyValuePair: (field: 'params' | 'headers' | 'bodyFormData' | 'bodyUrlEncoded' | 'pathVariables', id: string) => void;
  onAddKeyValuePair: (field: 'params' | 'headers' | 'bodyFormData' | 'bodyUrlEncoded' | 'pathVariables') => void;
  onSetActiveWorkTab: (tab: 'params' | 'auth' | 'headers' | 'body' | 'scripts' | 'settings' | 'code') => void;
  onSelectEnvironment: (id: string | null) => void;
  onOpenCookies: () => void;
  onSend: () => void;
  onCancel: () => void;
  responsePanel: ReturnType<typeof useResponsePanel>;
}

export function Workspace({
  tabs,
  activeTabId,
  activeWorkTab,
  environments,
  selectedEnvironmentId,
  onSetActiveTab,
  onCloseTab,
  onNewTab,
  onUpdateActiveTab,
  onUpdateKeyValuePair,
  onRemoveKeyValuePair,
  onAddKeyValuePair,
  onSetActiveWorkTab,
  onSelectEnvironment,
  onOpenCookies,
  onSend,
  onCancel,
  responsePanel
}: WorkspaceProps) {
  const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0];
  const [isEnvSelectorOpen, setIsEnvSelectorOpen] = useState(false);
  const [activeResponseTab, setActiveResponseTab] = useState<'body' | 'cookies' | 'headers' | 'timeline'>('body');
  const [showHiddenHeaders, setShowHiddenHeaders] = useState(false);
  const envSelectorRef = useRef<HTMLDivElement>(null);
  const { cookies } = useCookieStore();

  const hiddenHeaders = useMemo(() => {
    const extra: KeyValuePair[] = [];
    
    // Helper to check if a header is overridden by user
    const isOverridden = (key: string) => {
      return activeTab.headers.some(h => h.enabled && h.key.toLowerCase() === key.toLowerCase() && h.key !== '');
    };

    // Calculate Host from URL
    let hostValue = '';
    try {
      const urlObj = new URL(activeTab.url.startsWith('http') ? activeTab.url : `https://${activeTab.url}`);
      hostValue = urlObj.host;
    } catch (e) {
      // Incomplete URL
    }

    if (hostValue) {
      extra.push({ 
        id: 'host', 
        key: 'Host', 
        value: hostValue, 
        enabled: !isOverridden('Host'),
        type: 'text' 
      });
    }
    
    // Auth Headers
    if (activeTab.auth.type === 'bearer' && activeTab.auth.bearerToken) {
      extra.push({ 
        id: 'auth-bearer', 
        key: 'Authorization', 
        value: `Bearer ${activeTab.auth.bearerToken}`, 
        enabled: !isOverridden('Authorization') 
      });
    } else if (activeTab.auth.type === 'basic' && (activeTab.auth.username || activeTab.auth.password)) {
      try {
        const creds = btoa(`${activeTab.auth.username || ''}:${activeTab.auth.password || ''}`);
        extra.push({ 
          id: 'auth-basic', 
          key: 'Authorization', 
          value: `Basic ${creds}`, 
          enabled: !isOverridden('Authorization') 
        });
      } catch (e) {}
    } else if (activeTab.auth.type === 'apikey' && activeTab.auth.apiKeyName && activeTab.auth.apiKeyValue) {
      extra.push({ 
        id: 'auth-apikey', 
        key: activeTab.auth.apiKeyName, 
        value: activeTab.auth.apiKeyValue, 
        enabled: !isOverridden(activeTab.auth.apiKeyName) 
      });
    }

    // Default headers
    if (activeTab.bodyType === 'json') {
      extra.push({ 
        id: 'contentType', 
        key: 'Content-Type', 
        value: 'application/json', 
        enabled: !isOverridden('Content-Type') 
      });
    } else if (activeTab.bodyType === 'urlencoded') {
      extra.push({ 
        id: 'contentType', 
        key: 'Content-Type', 
        value: 'application/x-www-form-urlencoded', 
        enabled: !isOverridden('Content-Type') 
      });
    }
    
    extra.push({ id: 'accept', key: 'Accept', value: '*/*', enabled: !isOverridden('Accept') });
    extra.push({ id: 'user-agent', key: 'User-Agent', value: 'LuminaAPI/1.0', enabled: !isOverridden('User-Agent') });

    // Cookie header
    if (!isOverridden('Cookie')) {
      try {
        const requestUrl = new URL(activeTab.url.startsWith('http') ? activeTab.url : `https://${activeTab.url}`);
        const matchingCookies = cookies.filter(cookie => {
          if (!cookie.enabled) return false;
          const cookieDomain = cookie.domain.startsWith('.') ? cookie.domain.substring(1) : cookie.domain;
          const requestDomain = requestUrl.hostname;
          return requestDomain === cookieDomain || requestDomain.endsWith('.' + cookieDomain);
        });
        
        if (matchingCookies.length > 0) {
          const cookieValue = matchingCookies.map(c => `${c.name}=${c.value}`).join('; ');
          extra.push({ 
            id: 'cookie', 
            key: 'Cookie', 
            value: cookieValue, 
            enabled: true 
          });
        }
      } catch (e) {
        // Invalid URL
      }
    }

    return extra;
  }, [activeTab.auth, activeTab.bodyType, activeTab.url, activeTab.headers, cookies]);
  const selectedEnv = environments.find(e => e.id === selectedEnvironmentId);

  useEffect(() => {
    const handleClickOutside = (event: any) => {
      if (envSelectorRef.current && !envSelectorRef.current.contains(event.target as Node)) {
        setIsEnvSelectorOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isResponseRight = responsePanel.position === 'right';

  return (
    <main className="flex-1 flex flex-col min-w-0 bg-bg-deep relative overflow-hidden">
      <div className={`flex-1 flex ${isResponseRight ? 'flex-row' : 'flex-col'} min-w-0 min-h-0 overflow-hidden`}>
      <div className={`flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden ${isResponseRight && activeTab.response ? 'border-r border-white/5' : ''}`}>
        <div className="flex bg-bg-card/30 border-b border-white/5 relative z-40 backdrop-blur-md h-[45px] shrink-0">
          <div className="flex-1 flex overflow-x-auto no-scrollbar pr-12">
            {tabs.map((tab) => {
              const isActive = activeTabId === tab.id;
              return (
                <div 
                  key={tab.id}
                  onClick={() => onSetActiveTab(tab.id)}
                  onMouseUp={(e) => {
                    if (e.button === 1) { // Middle click
                      e.preventDefault();
                      onCloseTab(e, tab.id);
                    }
                  }}
                  className={`flex items-center gap-2.5 px-5 py-2.5 border-r border-white/5 cursor-pointer transition-all relative group min-w-[150px] max-w-[220px] shrink-0 ${
                    isActive ? 'bg-bg-deep text-white' : 'text-text-dim hover:bg-white/[0.02]'
                  }`}
                >
                  <span className={`text-[10px] font-black uppercase tracking-tighter transition-colors ${getMethodColor(tab.method)} ${isActive ? 'brightness-125' : 'opacity-60'}`}>
                    {tab.method}
                  </span>
                  <span className={`text-[11px] font-bold truncate flex-1 tracking-tight transition-colors ${isActive ? 'text-white' : 'text-text-dim group-hover:text-text-main'}`}>
                    {tab.name}
                  </span>
                  
                  <button 
                    onClick={(e) => onCloseTab(e, tab.id)}
                    className={`p-1 rounded-md hover:bg-white/10 transition-all ${tab.isDirty ? 'opacity-100' : 'opacity-0 group-hover:opacity-60 hover:opacity-100'} ${isActive && !tab.isDirty ? 'opacity-40' : ''}`}
                  >
                    {tab.isDirty ? (
                      <div className="w-2.5 h-2.5 bg-brand-accent rounded-full shadow-[0_0_8px_rgba(139,92,246,0.8)] animate-pulse" />
                    ) : (
                      <X className="w-3 h-3" />
                    )}
                  </button>
                  {isActive && (
                    <motion.div 
                      layoutId="active-tab-line"
                      className="absolute top-0 left-0 right-0 h-[2px] bg-brand-accent shadow-[0_4px_12px_rgba(139,92,246,0.6)]" 
                    />
                  )}
                </div>
              );
            })}
            <button 
              onClick={onNewTab}
              className="p-3 text-text-dim hover:text-brand-accent hover:bg-white/[0.02] transition-all flex items-center px-4 shrink-0"
              title="New Request"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center border-l border-white/5 px-4 bg-bg-card/40 relative" ref={envSelectorRef}>
            <div 
              onClick={() => setIsEnvSelectorOpen(!isEnvSelectorOpen)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all cursor-pointer select-none group/env whitespace-nowrap ${
                selectedEnv ? 'bg-brand-accent/10 border-brand-accent/20 text-brand-accent' : 'bg-white/5 border-white/5 text-text-dim hover:bg-white/10'
              }`}
            >
              <Globe className={`w-3.5 h-3.5 transition-colors ${selectedEnv ? 'text-brand-accent' : 'text-text-dim group-hover/env:text-text-main'}`} />
              <span className="text-[10px] font-bold tracking-widest uppercase">
                {selectedEnv ? selectedEnv.name : 'No Environment'}
              </span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isEnvSelectorOpen ? 'rotate-180' : ''}`} />
            </div>

            <AnimatePresence>
              {isEnvSelectorOpen && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-4 top-[calc(100%+8px)] w-56 bg-bg-card border border-white/10 rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-[100] overflow-hidden backdrop-blur-xl"
                >
                  <div className="p-2 border-b border-white/5 bg-white/[0.02]">
                    <div className="text-[9px] font-black text-text-dim/40 uppercase tracking-[0.2em] px-2 py-1">Active Environment</div>
                  </div>
                  <div className="max-h-[300px] overflow-y-auto p-1.5 custom-scrollbar">
                    <div 
                      onClick={() => { onSelectEnvironment(null); setIsEnvSelectorOpen(false); }}
                      className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg cursor-pointer transition-all mb-0.5 ${
                        !selectedEnvironmentId ? 'bg-brand-accent/20 text-brand-accent' : 'hover:bg-white/5 text-text-dim'
                      }`}
                    >
                      <div className={`w-1.5 h-1.5 rounded-full ${!selectedEnvironmentId ? 'bg-brand-accent shadow-[0_0_8px_rgba(139,92,246,0.5)]' : 'bg-white/10'}`} />
                      <span className="text-xs font-bold">No Environment</span>
                    </div>
                    {environments.map(env => (
                      <div 
                        key={env.id}
                        onClick={() => { onSelectEnvironment(env.id); setIsEnvSelectorOpen(false); }}
                        className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg cursor-pointer transition-all ${
                          selectedEnvironmentId === env.id ? 'bg-brand-accent/20 text-brand-accent' : 'hover:bg-white/5 text-text-dim'
                        }`}
                      >
                        <div className={`w-1.5 h-1.5 rounded-full ${selectedEnvironmentId === env.id ? 'bg-brand-accent shadow-[0_0_8px_rgba(139,92,246,0.5)]' : 'bg-white/10'}`} />
                        <span className="text-xs font-bold">{env.name}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <button 
              onClick={onOpenCookies}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-white/5 border-white/5 text-text-dim hover:bg-white/10 transition-all cursor-pointer ml-3 group/cookie"
              title="Manage Cookies"
            >
              <CookieIcon className="w-3.5 h-3.5 group-hover/cookie:text-brand-accent transition-colors" />
              <span className="text-[10px] font-bold tracking-widest uppercase">Cookies</span>
            </button>
          </div>
        </div>

        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-accent/5 rounded-full blur-[120px] pointer-events-none -mr-48 -mt-48" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-brand-accent/5 rounded-full blur-[100px] pointer-events-none -ml-32 -mb-32" />

        <div className="flex-1 overflow-y-auto flex flex-col">
          <section className="p-6 pb-2 z-10 shrink-0">
            <div className="flex items-center gap-3 mb-6 bg-bg-card p-1 rounded-xl border border-border-subtle">
              <MethodSelector 
                method={activeTab.method}
                onChange={(m) => onUpdateActiveTab({ method: m })}
              />

              <div className="flex-1 relative">
                <VariableInput 
                  value={activeTab.url}
                  onChange={(url) => onUpdateActiveTab({ url })}
                  environments={environments}
                  selectedEnvironmentId={selectedEnvironmentId}
                  placeholder="https://api.vortex.io/v1/..."
                  className="bg-transparent"
                />
              </div>

              <button 
                onClick={activeTab.isSending ? onCancel : onSend}
                className={`flex items-center gap-2 ${activeTab.isSending ? 'bg-danger hover:bg-danger/80' : 'bg-brand-accent hover:brightness-110'} text-white px-6 py-2.5 rounded-lg text-sm font-semibold transition-all grow-0 shrink-0 mr-1`}
              >
                {activeTab.isSending ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Cancel Request</span>
                  </>
                ) : (
                  <span>Send Request</span>
                )}
              </button>
            </div>

            <div className="flex gap-8 border-b border-border-subtle overflow-x-auto no-scrollbar px-2">
              <Tab label="Params" active={activeWorkTab === 'params'} onClick={() => onSetActiveWorkTab('params')} count={activeTab.params.filter(p => p.key).length || undefined} />
              <Tab label="Authorization" active={activeWorkTab === 'auth'} onClick={() => onSetActiveWorkTab('auth')} />
              <Tab label="Headers" active={activeWorkTab === 'headers'} onClick={() => onSetActiveWorkTab('headers')} count={activeTab.headers.filter(h => h.key).length || undefined} />
              <Tab label="Body" active={activeWorkTab === 'body'} onClick={() => onSetActiveWorkTab('body')} />
              <Tab label="Scripts" active={activeWorkTab === 'scripts'} onClick={() => onSetActiveWorkTab('scripts')} />
              <Tab label="Code" active={activeWorkTab === 'code'} onClick={() => onSetActiveWorkTab('code')} />
              <Tab label="Settings" active={activeWorkTab === 'settings'} onClick={() => onSetActiveWorkTab('settings')} />
            </div>
          </section>

          <section className="flex-1 p-6 overflow-y-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeWorkTab}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                {activeWorkTab === 'params' && (
                  <div className="flex flex-col gap-8">
                    {activeTab.pathVariables && activeTab.pathVariables.length > 0 && (
                      <KeyValueEditor 
                        title="Path Variables" 
                        items={activeTab.pathVariables} 
                        onUpdate={(id, up) => onUpdateKeyValuePair('pathVariables', id, up)}
                        onRemove={(id) => onRemoveKeyValuePair('pathVariables', id)}
                        onAdd={() => onAddKeyValuePair('pathVariables')}
                        environments={environments}
                        selectedEnvironmentId={selectedEnvironmentId}
                        isPathParams={true}
                      />
                    )}
                    
                    <KeyValueEditor 
                      title="Query Parameters" 
                      items={activeTab.params} 
                      onUpdate={(id, up) => onUpdateKeyValuePair('params', id, up)}
                      onRemove={(id) => onRemoveKeyValuePair('params', id)}
                      onAdd={() => onAddKeyValuePair('params')}
                      environments={environments}
                      selectedEnvironmentId={selectedEnvironmentId}
                    />
                  </div>
                )}
                
                {activeWorkTab === 'headers' && (
                  <KeyValueEditor 
                    title="HTTP Headers" 
                    items={activeTab.headers} 
                    extraItems={hiddenHeaders}
                    showHidden={showHiddenHeaders}
                    onToggleHidden={() => setShowHiddenHeaders(!showHiddenHeaders)}
                    onUpdate={(id, up) => onUpdateKeyValuePair('headers', id, up)}
                    onRemove={(id) => onRemoveKeyValuePair('headers', id)}
                    onAdd={() => onAddKeyValuePair('headers')}
                    environments={environments}
                    selectedEnvironmentId={selectedEnvironmentId}
                  />
                )}

                {activeWorkTab === 'auth' && (
                  <AuthEditor 
                    auth={activeTab.auth}
                    onUpdate={(auth) => onUpdateActiveTab({ auth })}
                    environments={environments}
                    selectedEnvironmentId={selectedEnvironmentId}
                  />
                )}

                {activeWorkTab === 'body' && (
                  <BodyEditor 
                    bodyType={activeTab.bodyType}
                    body={activeTab.body}
                    bodyFormData={activeTab.bodyFormData}
                    bodyUrlEncoded={activeTab.bodyUrlEncoded}
                    onUpdate={(up) => onUpdateActiveTab(up)}
                    onUpdateKeyValuePair={onUpdateKeyValuePair}
                    onRemoveKeyValuePair={onRemoveKeyValuePair}
                    onAddKeyValuePair={onAddKeyValuePair}
                    environments={environments}
                    selectedEnvironmentId={selectedEnvironmentId}
                  />
                )}

                {activeWorkTab === 'code' && (
                  <CodeGeneratorPanel tab={activeTab} />
                )}

                {activeWorkTab === 'scripts' && (
                  <ScriptEditor
                    preRequestScript={activeTab.preRequestScript || ''}
                    postResponseScript={activeTab.postResponseScript || ''}
                    onUpdatePreRequestScript={(script) => onUpdateActiveTab({ preRequestScript: script })}
                    onUpdatePostResponseScript={(script) => onUpdateActiveTab({ postResponseScript: script })}
                  />
                )}

                {activeWorkTab === 'settings' && (
                  <div className="p-12 text-center border-2 border-dashed border-white/5 rounded-2xl">
                    <Terminal className="w-8 h-8 text-text-dim mx-auto mb-4 opacity-20" />
                    <p className="text-sm text-text-dim">Sub-module under active implementation</p>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </section>
        </div>
      </div>

      {/* Resize Handle */}
      {activeTab.response && (
        <div
          onMouseDown={responsePanel.startResizing}
          className={`flex items-center justify-center bg-white/[0.02] hover:bg-brand-accent/30 active:bg-brand-accent/40 transition-colors z-[100] group/resize relative shrink-0
            ${isResponseRight ? 'cursor-col-resize w-1 h-full' : 'cursor-row-resize h-1 w-full'}
          `}
        >
          <div className="flex items-center justify-center opacity-0 group-hover/resize:opacity-100 transition-opacity bg-bg-card border border-brand-accent/30 rounded-lg shadow-xl text-brand-accent absolute z-50 w-8 h-8">
            {isResponseRight ? <GripVertical className="w-4 h-4" /> : <GripHorizontal className="w-4 h-4" />}
          </div>
        </div>
      )}

      <AnimatePresence mode="sync">
        {activeTab.response && (
          <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={isResponseRight ? { opacity: 0, width: 0 } : { opacity: 0, height: 0 }}
            transition={{ duration: 0.18, ease: 'easeInOut' }}
            style={
              isResponseRight
                ? { width: responsePanel.width, flexShrink: 0 }
                : { height: responsePanel.height, flexShrink: 0 }
            }
            className={`border-border-subtle bg-bg-card z-20 flex flex-col shadow-[0_-20px_50px_rgba(0,0,0,0.3)] overflow-hidden
              ${isResponseRight ? 'h-full border-l' : 'w-full border-t'}
            `}
          >
            <div className="p-4 border-b border-border-subtle/50 flex items-center justify-between bg-white/[0.01] shrink-0">
              <div className="flex items-center gap-6 px-2 overflow-x-auto no-scrollbar">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-success shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                  <span className="text-xs font-bold text-success whitespace-nowrap">
                    {activeTab.response.status} {activeTab.response.statusText}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-text-dim uppercase font-bold">Time:</span>
                  <span className="text-xs font-mono text-text-main whitespace-nowrap">{activeTab.response.time}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-text-dim uppercase font-bold">Size:</span>
                  <span className="text-xs font-mono text-text-main whitespace-nowrap">{activeTab.response.size}</span>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0 ml-4">
                <div className="flex bg-white/5 p-0.5 rounded-lg mr-2">
                  <button 
                    onClick={() => responsePanel.setPosition('bottom')}
                    className={`p-1.5 rounded-md transition-all ${responsePanel.position === 'bottom' ? 'bg-brand-accent/20 text-brand-accent' : 'text-text-dim hover:text-white'}`}
                    title="Dock Bottom"
                  >
                    <PanelsRightBottom className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    onClick={() => responsePanel.setPosition('right')}
                    className={`p-1.5 rounded-md transition-all ${responsePanel.position === 'right' ? 'bg-brand-accent/20 text-brand-accent' : 'text-text-dim hover:text-white'}`}
                    title="Dock Right"
                  >
                    <LayoutPanelTop className="w-3.5 h-3.5 rotate-90" />
                  </button>
                </div>

                <div className="w-px h-4 bg-white/10 mx-1" />

                <button className="p-2 text-text-dim hover:text-text-main hover:bg-white/5 rounded-lg transition-colors">
                  <Copy className="w-4 h-4" />
                </button>
                <button onClick={() => onUpdateActiveTab({ response: null })} className="p-2 text-text-dim hover:text-danger hover:bg-danger/10 rounded-lg transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col">
              <div className="flex gap-6 border-b border-white/5 mb-0 px-6 shrink-0 bg-white/[0.01] overflow-x-auto no-scrollbar">
                <Tab 
                  label="Body" 
                  active={activeResponseTab === 'body'} 
                  onClick={() => setActiveResponseTab('body')} 
                />
                <Tab 
                  label="Cookies" 
                  active={activeResponseTab === 'cookies'} 
                  onClick={() => setActiveResponseTab('cookies')} 
                  count={activeTab.response.cookies?.length}
                />
                <Tab 
                  label="Headers" 
                  active={activeResponseTab === 'headers'} 
                  onClick={() => setActiveResponseTab('headers')} 
                  count={activeTab.response.headers?.length}
                />
                <Tab 
                  label="Timeline" 
                  active={activeResponseTab === 'timeline'} 
                  onClick={() => setActiveResponseTab('timeline')} 
                />
              </div>
              <div className="flex-1 bg-bg-deep overflow-auto custom-scrollbar">
                {activeResponseTab === 'body' && (
                  <SyntaxHighlighter
                    language="json"
                    style={vscDarkPlus}
                    customStyle={{
                      margin: 0,
                      padding: '1.5rem',
                      fontSize: '12px',
                      lineHeight: '1.6',
                      background: 'transparent',
                      minHeight: '100%',
                    }}
                    showLineNumbers
                    lineNumberStyle={{ minWidth: '2.5rem', paddingRight: '1rem', color: '#3F3F46', textAlign: 'right' }}
                  >
                    {typeof activeTab.response.body === 'string' 
                      ? activeTab.response.body 
                      : JSON.stringify(activeTab.response.body, null, 2)}
                  </SyntaxHighlighter>
                )}

                {activeResponseTab === 'cookies' && (
                  <div className="p-6">
                    <table className="w-full text-left text-[11px] font-mono border-collapse border border-white/5 bg-white/[0.01]">
                      <thead>
                        <tr className="text-text-dim uppercase tracking-widest border-b border-white/10 text-[9px] bg-white/[0.02]">
                          <th className="py-3 pl-3 font-black border-r border-white/5">Name</th>
                          <th className="py-3 pl-3 font-black border-r border-white/5">Value</th>
                          {!isResponseRight && <th className="py-3 pl-3 font-black border-r border-white/5">Domain</th>}
                          {!isResponseRight && <th className="py-3 pl-3 font-black border-r border-white/5">Path</th>}
                          <th className="py-3 pl-3 font-black border-r border-white/5">Secure</th>
                          <th className="py-3 pl-3 font-black text-right pr-3">HttpOnly</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {activeTab.response.cookies?.map((c: any) => (
                          <tr key={c.id} className="hover:bg-brand-accent/5 transition-all group">
                            <td className="py-3 pl-3 text-brand-accent font-bold border-r border-white/5">{c.name}</td>
                            <td className="py-3 pl-3 text-text-main/80 truncate max-w-[150px] border-r border-white/5" title={c.value}>{c.value}</td>
                            {!isResponseRight && <td className="py-3 pl-3 text-text-dim border-r border-white/5">{c.domain}</td>}
                            {!isResponseRight && <td className="py-3 pl-3 text-text-dim border-r border-white/5">{c.path}</td>}
                            <td className="py-3 pl-3 border-r border-white/5">
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${c.secure ? 'bg-emerald-500/10 text-emerald-500' : 'bg-white/5 text-text-dim/40'}`}>
                                {c.secure ? 'Yes' : 'No'}
                              </span>
                            </td>
                            <td className="py-3 text-right pr-3 pl-3">
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${c.httpOnly ? 'bg-amber-500/10 text-amber-500' : 'bg-white/5 text-text-dim/40'}`}>
                                {c.httpOnly ? 'Yes' : 'No'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {activeResponseTab === 'headers' && (
                  <div className="p-6">
                    <table className="w-full text-left text-[11px] font-mono border-collapse border border-white/5 bg-white/[0.01]">
                      <thead>
                        <tr className="text-text-dim uppercase tracking-widest border-b border-white/10 text-[9px] bg-white/[0.02]">
                          <th className="py-3 pl-3 font-black border-r border-white/5">Key</th>
                          <th className="py-3 pl-3 font-black">Value</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {activeTab.response.headers?.map((h: any) => (
                          <tr key={h.id} className="hover:bg-brand-accent/5 transition-all">
                            <td className="py-3 pl-3 text-brand-accent font-bold w-1/3 min-w-[100px] break-all border-r border-white/5">{h.key}</td>
                            <td className="py-3 pl-3 text-text-main/80 break-all">{h.value}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {activeResponseTab === 'timeline' && (
                  <div className="p-12 text-center opacity-40">
                    <Terminal className="w-8 h-8 text-text-dim mx-auto mb-4 opacity-20" />
                    <p className="text-sm italic">Request timeline visualization coming soon.</p>
                  </div>
                )}
              </div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      </div>{/* end flex-row wrapper */}

      <footer className="h-8 border-t border-white/5 bg-bg-deep flex items-center px-4 justify-between text-[11px] font-mono opacity-40 z-30 shrink-0">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-emerald-400">
            <Shield className="w-3 h-3" />
            Connected to Lumina Cloud
          </span>
          <span className="flex items-center gap-1.5">
            <Terminal className="w-3 h-3" />
            Engine v1.42.0
          </span>
        </div>
        <div className="flex items-center gap-4">
           <span className="flex items-center gap-1.5 cursor-pointer hover:opacity-100 transition-opacity">
             <Cpu className="w-3 h-3" />
             CPU: 2%
           </span>
           <span>Region: us-east-1</span>
        </div>
      </footer>
    </main>
  );
}
