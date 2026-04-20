/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  History, 
  Database, 
  Settings, 
  Globe, 
  Zap,
  User,
  LogOut,
  ChevronLeft,
  ChevronRight,
  LayoutGrid
} from 'lucide-react';

import { 
  HttpMethod, 
  RequestItem, 
  RequestTab, 
  Collection, 
  KeyValuePair,
  EditModalTarget,
  Environment,
  Workspace as WorkspaceType
} from './types';

import { NavItem } from './components/NavItem';
import { Sidebar } from './components/Sidebar';
import { Workspace } from './components/Workspace';
import { EditModal } from './components/EditModal';
import { LoginModal } from './components/LoginModal';
import { SavePromptModal } from './components/SavePromptModal';
import { SaveToCollectionModal } from './components/SaveToCollectionModal';
import { EnvironmentEditor } from './components/EnvironmentEditor';
import { SettingsEditor } from './components/SettingsEditor';
import { CookieModal } from './components/CookieModal';
import { WorkspaceModal } from './components/WorkspaceModal';
import { ImportModal } from './components/ImportModal';

// Stores
import { useTabStore } from './store/useTabStore';
import { useCollectionStore } from './store/useCollectionStore';
import { useEnvironmentStore } from './store/useEnvironmentStore';
import { useWorkspaceStore } from './store/useWorkspaceStore';
import { useUIStore } from './store/useUIStore';
import { useCookieStore } from './store/useCookieStore';
import { useSettingsStore } from './store/useSettingsStore';
import { useHistoryStore } from './store/useHistoryStore';

// Hooks & Use Cases
import { useResponsePanel } from './hooks/useResponsePanel';
import { executeRequest } from './use-cases/requestExecutor';
import { waitForWails, isWailsAvailable, loadCollections, loadEnvironments, loadHistory, getKV, setKV, deleteKV, cancelRequest } from './lib/wails';

const DEFAULT_URL = 'https://api.lumina.io/v1/explore';

export default function App() {
  const [activeWorkTab, setActiveWorkTab] = useState<'params' | 'auth' | 'headers' | 'body' | 'scripts' | 'settings' | 'code'>('params');
  
  // Zustand Stores
  const { 
    tabs, setTabs, activeTabId, setActiveTabId, 
    updateActiveTab, updateKeyValuePair, addKeyValuePair, 
    removeKeyValuePair, closeTab, addNewTab, openRequest,
    isSavePromptOpen, setIsSavePromptOpen, closingTabId, setClosingTabId
  } = useTabStore();

  const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0];

  const {
    collections, setCollections, createCollection, toggleCollection, 
    addRequestToCollection, editItem, deleteItem, moveRequestToCollection
  } = useCollectionStore();

  const {
    environments, setEnvironments, activeEnvironmentId, 
    setActiveEnvironmentId, createEnvironment, updateEnvironment, deleteEnvironment
  } = useEnvironmentStore();

  const {
    workspaces, activeWorkspaceId, setActiveWorkspaceId, 
    activeWorkspaceMode, setActiveWorkspaceMode,
    addWorkspace, connectWorkspace, loginToWorkspace, 
    logoutFromWorkspace, removeWorkspace, getActiveWorkspace
  } = useWorkspaceStore();

  const {
    activeSidebarTab, setActiveSidebarTab, sidebarWidth, setSidebarWidth,
    isSidebarCollapsed, setIsSidebarCollapsed, isResizing, setIsResizing,
    modals, openEditModal, closeEditModal, closeLoginModal, setCookiesModalOpen,
    setWorkspaceModalOpen, setImportModalOpen, handleLogin: onLogin, handleLogout: onLogout
  } = useUIStore();

  const {
    cookies, isCookieModalOpen, addCookie, updateCookie, removeCookie
  } = useCookieStore();

  const { theme, accentColor } = useSettingsStore();

  const responsePanel = useResponsePanel();

  // ── Startup: load all data from SQLite ──────────────────────────────────────
  useEffect(() => {
    waitForWails().then(async () => {
      if (!isWailsAvailable()) return;

      // Collections
      try {
        const cols = await loadCollections();
        if (Array.isArray(cols) && cols.length > 0)
          useCollectionStore.getState().setCollections(cols);
      } catch (e) { console.error('loadCollections', e); }

      // Environments
      try {
        const envs = await loadEnvironments();
        if (Array.isArray(envs) && envs.length > 0) {
          useEnvironmentStore.getState().setEnvironments(envs);
          useEnvironmentStore.getState().setActiveEnvironmentId(envs[0].id);
        }
      } catch (e) { console.error('loadEnvironments', e); }

      // History
      try {
        const hist = await loadHistory(100);
        if (Array.isArray(hist)) useHistoryStore.getState().setHistory(hist);
      } catch (e) { console.error('loadHistory', e); }

      // Login state from KV
      try {
        const email = await getKV('login_email');
        if (email) useUIStore.getState().handleLogin(email);
      } catch (e) { /* not logged in */ }
    });
  }, []);

  // App Theme & Accent Color Effect
  useEffect(() => {
    const root = window.document.documentElement;
    
    // Apply Theme
    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.remove('light', 'dark');
      root.classList.add(systemTheme);
    } else {
      root.classList.remove('light', 'dark');
      root.classList.add(theme);
    }

    // Apply Accent Color
    root.style.setProperty('--color-brand-accent', accentColor);
    
    // Derived colors could be added here if needed
  }, [theme, accentColor]);

  const handleSelectWorkspace = (id: string) => {
    setActiveWorkspaceId(id);
    setActiveWorkspaceMode('request');
  };

  const onSetActiveTabWithMode = (id: string) => {
    setActiveWorkspaceMode('request');
    setActiveTabId(id);
  };

  // Keyboard Shortcuts — ref so handler always sees latest state
  const handleSaveRequestRef = useRef<(tabId?: string) => void>(() => {});
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSaveRequestRef.current();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'w') {
        e.preventDefault();
        closeTab(activeTabId);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTabId, closeTab]);

  const handleOpenEnvironment = (id: string) => {
    setActiveEnvironmentId(id);
    setActiveWorkspaceMode('environment');
  };

  const handleCreateEnvironment = () => {
    createEnvironment();
    // The store updates environments and activeEnvironmentId. We just need to open the edit modal.
    // However, createEnvironment is async in its effect on state, but Zustand updates are synchronous.
    // We can't easily get the new ID from store action if it doesn't return it.
    // Let's assume the new env is the first one.
    setTimeout(() => {
      const newEnv = useEnvironmentStore.getState().environments[0];
      openEditModal('environment', newEnv.id, newEnv.name);
    }, 0);
  };

  const handleCreateCollection = (parentId?: string) => {
    createCollection(parentId);
    setTimeout(() => {
      const allCols = useCollectionStore.getState().collections;
      const newCol = parentId 
        ? findCollectionRecursive(allCols, parentId)?.children?.[0]
        : allCols[0];
      if (newCol) openEditModal('collection', newCol.id, newCol.name, parentId);
    }, 0);
  };

  const findCollectionRecursive = (cols: Collection[], id: string): Collection | undefined => {
    for (const c of cols) {
      if (c.id === id) return c;
      if (c.children) {
        const found = findCollectionRecursive(c.children, id);
        if (found) return found;
      }
    }
    return undefined;
  };

  const handleAddRequestToCollection = (id: string) => {
    addRequestToCollection(id);
    setTimeout(() => {
      const col = findCollectionRecursive(useCollectionStore.getState().collections, id);
      const newReq = col?.items[0];
      if (newReq) openEditModal('request', newReq.id, newReq.name, id);
    }, 0);
  };

  const handleSaveEdit = (newName: string) => {
    if (!modals.edit.isOpen) return;
    const { type, id, parentId } = modals.edit;

    editItem(type, id, newName, parentId);
    
    // Sync with tabs if it's a request
    if (type === 'request' && parentId) {
       const req = findCollectionRecursive(useCollectionStore.getState().collections, parentId)?.items.find(i => i.id === id);
       if (req) {
          setTabs(tabs.map(t => (t.url === req.url && t.method === req.method) ? { ...t, name: newName } : t));
       }
    }
    
    closeEditModal();
  };

  const handleSaveRequest = useCallback((tabId?: string) => {
    const id = tabId ?? activeTabId;
    const tab = tabs.find(t => t.id === id);
    if (!tab) return;

    if (!tab.collectionId) {
      setIsSaveToCollectionModalOpen(true);
      return;
    }

    // Save full tab state into the collection item
    useCollectionStore.getState().updateRequestInCollection(tab.collectionId, tab.id, {
      method: tab.method,
      url: tab.url,
      name: tab.name,
      params: tab.params,
      pathVariables: tab.pathVariables,
      headers: tab.headers,
      auth: tab.auth,
      bodyType: tab.bodyType,
      body: tab.body,
      bodyFormData: tab.bodyFormData,
      bodyUrlEncoded: tab.bodyUrlEncoded,
    });

    // Clear dirty flag on the specific tab
    setTabs((prev: RequestTab[]) => prev.map((t: RequestTab) => t.id === id ? { ...t, isDirty: false } : t));

    if (closingTabId === id) {
      setIsSavePromptOpen(false);
      setClosingTabId(null);
      setTimeout(() => closeTab(id), 0);
    }
  }, [activeTabId, tabs, closingTabId, setTabs, setIsSavePromptOpen, setClosingTabId, closeTab]);

  // Keep ref in sync so Ctrl+S always calls the latest version
  handleSaveRequestRef.current = handleSaveRequest;

  const [isSaveToCollectionModalOpen, setIsSaveToCollectionModalOpen] = useState(false);

  const handleConfirmSaveToCollection = useCallback((collectionId: string, name: string) => {
    if (!activeTab) return;

    // Use the tab's existing id so tab.id === collection item id for future saves
    const reqItem: RequestItem = {
      id: activeTab.id,
      method: activeTab.method,
      name,
      url: activeTab.url,
      timestamp: new Date().toISOString(),
    };

    useCollectionStore.getState().importRequestToCollection(collectionId, reqItem);

    // Link tab to collection and clear dirty
    setTabs((prev: RequestTab[]) => prev.map((t: RequestTab) =>
      t.id === activeTabId ? { ...t, name, collectionId, isDirty: false } : t
    ));

    setIsSaveToCollectionModalOpen(false);
  }, [activeTab, activeTabId, setTabs]);

  const handleDiscardChanges = () => {
    if (!closingTabId) return;
    const id = closingTabId;
    setClosingTabId(null);
    setIsSavePromptOpen(false);
    
    // Discard dirty state first to allow closeTab to bypass the prompt
    setTabs(tabs.map(t => t.id === id ? { ...t, isDirty: false } : t));
    setTimeout(() => closeTab(id), 0);
  };

  const handleSend = async () => {
    const controller = new AbortController();
    updateActiveTab({ isSending: true, abortController: controller });
    
    try {
      const result = await executeRequest(
        activeTab, environments, activeEnvironmentId, cookies, controller.signal
      );
      if (result.response.cancelled) {
        updateActiveTab({ isSending: false, abortController: null });
        return;
      }
      // Add to history store for immediate sidebar update
      if (result.response.status) {
        useHistoryStore.getState().addEntry({
          id: Math.random().toString(36).substring(2, 9),
          method: activeTab.method,
          url: activeTab.url,
          name: activeTab.name,
          status: result.response.status,
          duration: result.response.time || '',
          timestamp: new Date().toISOString(),
        });
      }
      updateActiveTab({ isSending: false, response: result.response, abortController: null });
    } catch (error: any) {
      updateActiveTab({ isSending: false, abortController: null });
    }
  };

  const handleCancelRequest = () => {
    if (activeTab.abortController) activeTab.abortController.abort();
    cancelRequest().catch(console.error);
    updateActiveTab({ isSending: false, abortController: null });
  };

  const handleAppLogin = (email: string) => {
    onLogin(email);
    setKV('login_email', email).catch(console.error);
    if (activeWorkspaceId !== 'local') loginToWorkspace(activeWorkspaceId, email);
  };

  const handleAppLogout = () => {
    onLogout();
    deleteKV('login_email').catch(console.error);
    if (activeWorkspaceId !== 'local') logoutFromWorkspace(activeWorkspaceId);
  };

  const handleImportCollection = (collection: Collection) => {
    const current = useCollectionStore.getState().collections;
    const next = [collection, ...current];
    useCollectionStore.getState().setCollections(next);
    setImportModalOpen(false);
  };

  const handleExport = (id: string) => {
    const collection = findCollectionRecursive(collections, id);
    if (!collection) return;

    const dataStr = JSON.stringify(collection, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `${collection.name.toLowerCase().replace(/\s+/g, '-')}-export.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const activeWorkspaceData = getActiveWorkspace();

  return (
    <div className={`flex h-screen bg-bg-deep text-text-main overflow-hidden ${isResizing ? 'cursor-col-resize select-none' : ''} ${responsePanel.isResizing ? (responsePanel.position === 'right' ? 'cursor-col-resize' : 'cursor-row-resize') + ' select-none' : ''}`} id="lumina-app">
      {activeWorkspaceMode !== 'settings' && (
        <nav className="w-16 flex flex-col items-center py-6 border-r border-border-subtle bg-bg-deep z-50">
          <div className="mb-10 text-brand-accent relative group cursor-pointer">
            <motion.div
              animate={{ boxShadow: ["0 0 15px rgba(139,92,246,0.3)", "0 0 30px rgba(139,92,246,0.6)", "0 0 15px rgba(139,92,246,0.3)"] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-0 rounded-full blur-2xl z-[-1]"
            />
            <Zap className="w-8 h-8 filter drop-shadow-[0_0_12px_rgba(139,92,246,0.8)] group-hover:scale-110 transition-transform duration-500" />
          </div>
          <div className="flex flex-col gap-6 flex-1">
            <NavItem label="Workspaces" icon={<LayoutGrid className="w-5 h-5" />} active={activeSidebarTab === 'workspaces'} onClick={() => { setActiveSidebarTab('workspaces'); setActiveWorkspaceMode('request'); }} />
            <NavItem label="History" icon={<History className="w-5 h-5" />} active={activeSidebarTab === 'history'} onClick={() => { setActiveSidebarTab('history'); setActiveWorkspaceMode('request'); }} />
            <NavItem label="Collections" icon={<Database className="w-5 h-5" />} active={activeSidebarTab === 'collections'} onClick={() => { setActiveSidebarTab('collections'); setActiveWorkspaceMode('request'); }} />
            <NavItem label="Environments" icon={<Globe className="w-5 h-5" />} active={activeSidebarTab === 'env'} onClick={() => { setActiveSidebarTab('env'); setActiveWorkspaceMode('request'); }} />
          </div>
          <div className="mt-auto flex flex-col gap-6">
            {modals.login.email ? (
              <div className="flex flex-col gap-6 items-center">
                 <button onClick={handleAppLogout} className="p-3 text-danger hover:bg-danger/10 rounded-xl transition-all" title="Logout">
                   <LogOut className="w-5 h-5" />
                 </button>
                 <div className="w-8 h-8 rounded-full bg-brand-accent flex items-center justify-center text-[10px] font-bold shadow-[0_4px_10px_rgba(139,92,246,0.3)] border border-white/20">
                   {modals.login.email.substring(0, 2).toUpperCase()}
                 </div>
              </div>
            ) : (
              <NavItem label="Login" icon={<User className="w-5 h-5" />} active={false} onClick={() => useUIStore.getState().openLoginModal()} />
            )}
            <NavItem label="Settings" icon={<Settings className="w-5 h-5" />} active={activeSidebarTab === 'settings'} onClick={() => { setActiveSidebarTab('settings'); setActiveWorkspaceMode('settings'); }} />
            {isSidebarCollapsed && (
              <button onClick={() => setIsSidebarCollapsed(false)} className="p-3 text-brand-accent hover:bg-brand-accent/10 rounded-xl transition-all mt-2" title="Expand Sidebar">
                <ChevronRight className="w-5 h-5" />
              </button>
            )}
          </div>
        </nav>
      )}

      {activeWorkspaceMode !== 'settings' && (
        <Sidebar 
          activeTab={activeSidebarTab}
          collections={collections}
          environments={environments}
          workspaces={workspaces}
          activeWorkspaceId={activeWorkspaceId}
          activeEnvironmentId={activeEnvironmentId}
          onOpenRequest={openRequest}
          onOpenEnvironment={handleOpenEnvironment}
          onCreateCollection={handleCreateCollection}
          onCreateEnvironment={handleCreateEnvironment}
          onToggleCollection={toggleCollection}
          onAddRequest={handleAddRequestToCollection}
          onEdit={openEditModal}
          onDelete={deleteItem}
          onMoveRequest={moveRequestToCollection}
          onSelectWorkspace={handleSelectWorkspace}
          onAddWorkspace={() => setWorkspaceModalOpen(true)}
          onConnectWorkspace={connectWorkspace}
          onDeleteWorkspace={removeWorkspace}
          onImport={() => setImportModalOpen(true)}
          onExportCollection={handleExport}
          width={sidebarWidth}
          isCollapsed={isSidebarCollapsed}
          isResizing={isResizing}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          onResizeStart={(e) => {
            setIsResizing(true);
            const handleMouseMove = (em: any) => setSidebarWidth(Math.max(200, Math.min(600, em.clientX - 64)));
            const handleMouseUp = () => {
              setIsResizing(false);
              window.removeEventListener('mousemove', handleMouseMove);
              window.removeEventListener('mouseup', handleMouseUp);
            };
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
          }}
        />
      )}

      {activeWorkspaceMode === 'request' ? (
        <Workspace 
          tabs={tabs}
          activeTabId={activeTabId}
          activeWorkTab={activeWorkTab}
          environments={environments}
          selectedEnvironmentId={activeEnvironmentId}
          onSetActiveTab={onSetActiveTabWithMode}
          onCloseTab={(e, id) => closeTab(id)}
          onNewTab={addNewTab}
          onUpdateActiveTab={updateActiveTab}
          onUpdateKeyValuePair={updateKeyValuePair}
          onRemoveKeyValuePair={removeKeyValuePair}
          onAddKeyValuePair={addKeyValuePair}
          onSetActiveWorkTab={setActiveWorkTab}
          onSelectEnvironment={setActiveEnvironmentId}
          onSend={handleSend}
          onCancel={handleCancelRequest}
          onOpenCookies={() => setCookiesModalOpen(true)}
          responsePanel={responsePanel}
        />
      ) : activeWorkspaceMode === 'settings' ? (
        <SettingsEditor onBack={() => { setActiveWorkspaceMode('request'); setActiveSidebarTab('collections'); }} />
      ) : activeEnvironmentId && (
        <EnvironmentEditor 
          environment={environments.find(e => e.id === activeEnvironmentId)!}
          environments={environments}
          selectedEnvironmentId={activeEnvironmentId}
          onUpdate={(up) => updateEnvironment(activeEnvironmentId, up)}
          onUpdateVariable={(vid, up) => {
            const env = environments.find(e => e.id === activeEnvironmentId);
            if (env) {
              const newVars = env.variables.map(v => v.id === vid ? { ...v, ...up } : v);
              updateEnvironment(activeEnvironmentId, { variables: newVars });
            }
          }}
          onAddVariable={() => {
             const env = environments.find(e => e.id === activeEnvironmentId);
             if (env) {
               const newVar = { id: Math.random().toString(36).substr(2, 9), key: 'new_var', value: 'value', enabled: true };
               updateEnvironment(activeEnvironmentId, { variables: [...env.variables, newVar] });
             }
          }}
          onRemoveVariable={(vid) => {
             const env = environments.find(e => e.id === activeEnvironmentId);
             if (env) {
               const newVars = env.variables.filter(v => v.id !== vid);
               updateEnvironment(activeEnvironmentId, { variables: newVars });
             }
          }}
          onBack={() => setActiveWorkspaceMode('request')}
        />
      )}

      <EditModal 
        isOpen={modals.edit.isOpen}
        onClose={closeEditModal}
        target={modals.edit}
        onSave={handleSaveEdit}
        environments={environments}
        selectedEnvironmentId={activeEnvironmentId}
      />

      <LoginModal 
        isOpen={modals.login.isOpen}
        onClose={closeLoginModal}
        onLogin={handleAppLogin}
      />

      <CookieModal
        isOpen={isCookieModalOpen}
        onClose={() => setCookiesModalOpen(false)}
        cookies={cookies}
        onAdd={addCookie}
        onUpdate={updateCookie}
        onRemove={removeCookie}
      />

      <SavePromptModal 
        isOpen={isSavePromptOpen}
        onClose={() => { setIsSavePromptOpen(false); setClosingTabId(null); }}
        onSave={() => handleSaveRequest(closingTabId ?? undefined)}
        onDiscard={handleDiscardChanges}
        requestName={tabs.find(t => t.id === closingTabId)?.name || ''}
      />

      <SaveToCollectionModal 
        isOpen={isSaveToCollectionModalOpen}
        onClose={() => setIsSaveToCollectionModalOpen(false)}
        onConfirm={handleConfirmSaveToCollection}
        collections={collections}
        initialRequestName={activeTab?.name || ''}
      />

      <WorkspaceModal 
        isOpen={modals.workspace.isOpen}
        onClose={() => setWorkspaceModalOpen(false)}
        onAdd={addWorkspace}
      />

      <ImportModal
        isOpen={modals.import.isOpen}
        onClose={() => setImportModalOpen(false)}
        onImportCollection={handleImportCollection}
      />
    </div>
  );
}
