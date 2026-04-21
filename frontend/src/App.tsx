import { useState, useRef, useCallback, useEffect } from 'react';
import { motion } from 'motion/react';
import { History, Database, Settings, Globe, Zap, User, LogOut, ChevronRight, LayoutGrid } from 'lucide-react';

import { RequestItem, RequestTab, Collection, KeyValuePair } from './types';

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

import { useTabStore } from './store/useTabStore';
import { useCollectionStore } from './store/useCollectionStore';
import { useEnvironmentStore } from './store/useEnvironmentStore';
import { useWorkspaceStore, loadWorkspaceStateFromDb } from './store/useWorkspaceStore';
import { useUIStore } from './store/useUIStore';
import { useCookieStore } from './store/useCookieStore';
import { useSettingsStore } from './store/useSettingsStore';
import { useHistoryStore } from './store/useHistoryStore';

import { useResponsePanel } from './hooks/useResponsePanel';
import { executeRequest } from './use-cases/requestExecutor';
import { findCollectionById } from './utils/collectionHelpers';
import { generateId } from './utils/idGenerator';
import {
  waitForWails, isWailsAvailable,
  loadCollections, loadEnvironments, loadHistory,
  getKV, setKV, deleteKV, cancelRequest,
} from './lib/wails';

// ── App ───────────────────────────────────────────────────────────────────────

export default function App() {
  const [activeWorkTab, setActiveWorkTab] = useState<
    'params' | 'auth' | 'headers' | 'body' | 'scripts' | 'settings' | 'code'
  >('params');

  // ── Stores ──────────────────────────────────────────────────────────────────
  const {
    tabs, setTabs, activeTabId, setActiveTabId,
    updateActiveTab, updateKeyValuePair, addKeyValuePair,
    removeKeyValuePair, closeTab, addNewTab, openRequest,
    isSavePromptOpen, setIsSavePromptOpen, closingTabId, setClosingTabId,
  } = useTabStore();

  const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0];

  const {
    collections, createCollection, toggleCollection,
    addRequestToCollection, editItem, deleteItem, moveRequestToCollection,
  } = useCollectionStore();

  const {
    environments, activeEnvironmentId,
    setActiveEnvironmentId, createEnvironment, updateEnvironment,
  } = useEnvironmentStore();

  const {
    activeServerId, activeWorkspaceId,
    activeWorkspaceMode, setActiveWorkspaceMode,
    addServer, loginToWorkspace, logoutFromWorkspace,
  } = useWorkspaceStore();

  const {
    activeSidebarTab, setActiveSidebarTab,
    sidebarWidth, setSidebarWidth,
    isSidebarCollapsed, setIsSidebarCollapsed,
    isResizing, setIsResizing,
    modals, openEditModal, closeEditModal, closeLoginModal,
    setCookiesModalOpen, setWorkspaceModalOpen, setImportModalOpen,
    handleLogin: onLogin, handleLogout: onLogout,
  } = useUIStore();

  const { cookies, isCookieModalOpen, addCookie, updateCookie, removeCookie } = useCookieStore();
  const { theme, accentColor } = useSettingsStore();
  const responsePanel = useResponsePanel();

  // ── Workspace data loading ───────────────────────────────────────────────────
  const loadWorkspaceData = useCallback(async (wsId: string) => {
    useCollectionStore.getState().setWorkspaceId(wsId);
    useEnvironmentStore.getState().setWorkspaceId(wsId);
    if (!isWailsAvailable()) return;

    try {
      const cols = await loadCollections(wsId);
      useCollectionStore.getState().setCollections(Array.isArray(cols) && cols.length > 0 ? cols : []);
    } catch (e) { console.error('loadCollections', e); }

    try {
      const envs = await loadEnvironments(wsId);
      if (Array.isArray(envs) && envs.length > 0) {
        useEnvironmentStore.getState().setEnvironments(envs);
        useEnvironmentStore.getState().setActiveEnvironmentId(envs[0].id);
      } else {
        useEnvironmentStore.getState().setEnvironments([]);
        useEnvironmentStore.getState().setActiveEnvironmentId(null);
      }
    } catch (e) { console.error('loadEnvironments', e); }
  }, []);

  // ── Startup ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    waitForWails().then(async () => {
      if (!isWailsAvailable()) return;

      const wsState = await loadWorkspaceStateFromDb();
      if (wsState) useWorkspaceStore.getState().loadFromDb(wsState);

      await loadWorkspaceData(useWorkspaceStore.getState().activeWorkspaceId);

      try {
        const hist = await loadHistory(100);
        if (Array.isArray(hist)) useHistoryStore.getState().setHistory(hist);
      } catch (e) { console.error('loadHistory', e); }

      try {
        const email = await getKV('login_email');
        if (email) useUIStore.getState().handleLogin(email);
      } catch { /* not logged in */ }
    });
  }, []);

  // ── Reload on workspace switch ───────────────────────────────────────────────
  const prevWorkspaceId = useRef(activeWorkspaceId);
  useEffect(() => {
    if (prevWorkspaceId.current === activeWorkspaceId) return;
    prevWorkspaceId.current = activeWorkspaceId;
    waitForWails().then(() => loadWorkspaceData(activeWorkspaceId));
    setActiveSidebarTab('collections');
    setActiveWorkspaceMode('request');
  }, [activeWorkspaceId, loadWorkspaceData]);

  // ── Theme ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const root = document.documentElement;
    const resolved = theme === 'system'
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : theme;
    root.classList.remove('light', 'dark');
    root.classList.add(resolved);
    root.style.setProperty('--color-brand-accent', accentColor);
  }, [theme, accentColor]);

  // ── Keyboard shortcuts ───────────────────────────────────────────────────────
  const handleSaveRequestRef = useRef<(tabId?: string) => void>(() => {});
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); handleSaveRequestRef.current(); }
      if ((e.ctrlKey || e.metaKey) && e.key === 'w') { e.preventDefault(); closeTab(activeTabId); }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeTabId, closeTab]);

  // ── Sidebar resize ───────────────────────────────────────────────────────────
  const handleSidebarResizeStart = useCallback(() => {
    setIsResizing(true);
    const onMove = (e: MouseEvent) => setSidebarWidth(Math.max(200, Math.min(600, e.clientX - 64)));
    const onUp = () => {
      setIsResizing(false);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [setIsResizing, setSidebarWidth]);

  // ── Collection handlers ──────────────────────────────────────────────────────
  const handleCreateCollection = useCallback((parentId?: string) => {
    createCollection(parentId);
    setTimeout(() => {
      const allCols = useCollectionStore.getState().collections;
      const newCol = parentId
        ? findCollectionById(allCols, parentId)?.children?.[0]
        : allCols[0];
      if (newCol) openEditModal('collection', newCol.id, newCol.name, parentId);
    }, 0);
  }, [createCollection, openEditModal]);

  const handleAddRequestToCollection = useCallback((id: string) => {
    addRequestToCollection(id);
    setTimeout(() => {
      const col = findCollectionById(useCollectionStore.getState().collections, id);
      const newReq = col?.items[0];
      if (newReq) openEditModal('request', newReq.id, newReq.name, id);
    }, 0);
  }, [addRequestToCollection, openEditModal]);

  const handleSaveEdit = useCallback((newName: string) => {
    if (!modals.edit.isOpen) return;
    const { type, id, parentId } = modals.edit;
    editItem(type, id, newName, parentId);
    if (type === 'request' && parentId) {
      const req = findCollectionById(useCollectionStore.getState().collections, parentId)
        ?.items.find(i => i.id === id);
      if (req) setTabs(tabs.map(t => (t.url === req.url && t.method === req.method) ? { ...t, name: newName } : t));
    }
    closeEditModal();
  }, [modals.edit, editItem, setTabs, tabs, closeEditModal]);

  const handleExport = useCallback((id: string) => {
    const col = findCollectionById(collections, id);
    if (!col) return;
    const a = document.createElement('a');
    a.href = 'data:application/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(col, null, 2));
    a.download = `${col.name.toLowerCase().replace(/\s+/g, '-')}-export.json`;
    a.click();
  }, [collections]);

  const handleImportCollection = useCallback((collection: Collection) => {
    const next = [collection, ...useCollectionStore.getState().collections];
    useCollectionStore.getState().setCollections(next);
    setImportModalOpen(false);
  }, [setImportModalOpen]);

  // ── Save request ─────────────────────────────────────────────────────────────
  const [isSaveToCollectionModalOpen, setIsSaveToCollectionModalOpen] = useState(false);

  const handleSaveRequest = useCallback((tabId?: string) => {
    const id = tabId ?? activeTabId;
    const tab = tabs.find(t => t.id === id);
    if (!tab) return;

    if (!tab.collectionId) { setIsSaveToCollectionModalOpen(true); return; }

    useCollectionStore.getState().updateRequestInCollection(tab.collectionId, tab.id, {
      method: tab.method, url: tab.url, name: tab.name,
      params: tab.params, pathVariables: tab.pathVariables,
      headers: tab.headers, auth: tab.auth,
      bodyType: tab.bodyType, body: tab.body,
      bodyFormData: tab.bodyFormData, bodyUrlEncoded: tab.bodyUrlEncoded,
    });

    setTabs((prev: RequestTab[]) => prev.map((t: RequestTab) => t.id === id ? { ...t, isDirty: false } : t));

    if (closingTabId === id) {
      setIsSavePromptOpen(false);
      setClosingTabId(null);
      setTimeout(() => closeTab(id), 0);
    }
  }, [activeTabId, tabs, closingTabId, setTabs, setIsSavePromptOpen, setClosingTabId, closeTab]);

  handleSaveRequestRef.current = handleSaveRequest;

  const handleConfirmSaveToCollection = useCallback((collectionId: string, name: string) => {
    if (!activeTab) return;
    const reqItem: RequestItem = {
      id: activeTab.id, method: activeTab.method,
      name, url: activeTab.url, timestamp: new Date().toISOString(),
    };
    useCollectionStore.getState().importRequestToCollection(collectionId, reqItem);
    setTabs((prev: RequestTab[]) => prev.map((t: RequestTab) =>
      t.id === activeTabId ? { ...t, name, collectionId, isDirty: false } : t
    ));
    setIsSaveToCollectionModalOpen(false);
  }, [activeTab, activeTabId, setTabs]);

  const handleDiscardChanges = useCallback(() => {
    if (!closingTabId) return;
    const id = closingTabId;
    setClosingTabId(null);
    setIsSavePromptOpen(false);
    setTabs(tabs.map(t => t.id === id ? { ...t, isDirty: false } : t));
    setTimeout(() => closeTab(id), 0);
  }, [closingTabId, setClosingTabId, setIsSavePromptOpen, setTabs, tabs, closeTab]);

  // ── Request execution ────────────────────────────────────────────────────────
  const handleSend = useCallback(async () => {
    const controller = new AbortController();
    updateActiveTab({ isSending: true, abortController: controller });
    try {
      const result = await executeRequest(activeTab, environments, activeEnvironmentId, cookies, controller.signal);
      if (result.response.cancelled) {
        updateActiveTab({ isSending: false, abortController: null });
        return;
      }
      if (result.response.status) {
        useHistoryStore.getState().addEntry({
          id: generateId(),
          method: activeTab.method,
          url: activeTab.url,
          name: activeTab.name,
          status: result.response.status,
          duration: result.response.time || '',
          timestamp: new Date().toISOString(),
        });
      }
      updateActiveTab({ isSending: false, response: result.response, abortController: null });
    } catch {
      updateActiveTab({ isSending: false, abortController: null });
    }
  }, [activeTab, environments, activeEnvironmentId, cookies, updateActiveTab]);

  const handleCancelRequest = useCallback(() => {
    activeTab.abortController?.abort();
    cancelRequest().catch(console.error);
    updateActiveTab({ isSending: false, abortController: null });
  }, [activeTab, updateActiveTab]);

  // ── Auth ─────────────────────────────────────────────────────────────────────
  const handleAppLogin = useCallback((email: string) => {
    onLogin(email);
    setKV('login_email', email).catch(console.error);
    if (activeServerId !== 'local') loginToWorkspace(activeServerId, email);
  }, [onLogin, activeServerId, loginToWorkspace]);

  const handleAppLogout = useCallback(() => {
    onLogout();
    deleteKV('login_email').catch(console.error);
    if (activeServerId !== 'local') logoutFromWorkspace(activeServerId);
  }, [onLogout, activeServerId, logoutFromWorkspace]);

  // ── Environment editor helpers ───────────────────────────────────────────────
  const activeEnv = environments.find(e => e.id === activeEnvironmentId);

  const handleUpdateVariable = useCallback((vid: string, up: Partial<KeyValuePair>) => {
    if (!activeEnv) return;
    updateEnvironment(activeEnvironmentId!, {
      variables: activeEnv.variables.map(v => v.id === vid ? { ...v, ...up } : v),
    });
  }, [activeEnv, activeEnvironmentId, updateEnvironment]);

  const handleAddVariable = useCallback(() => {
    if (!activeEnv) return;
    updateEnvironment(activeEnvironmentId!, {
      variables: [...activeEnv.variables, { id: generateId(), key: 'new_var', value: 'value', enabled: true }],
    });
  }, [activeEnv, activeEnvironmentId, updateEnvironment]);

  const handleRemoveVariable = useCallback((vid: string) => {
    if (!activeEnv) return;
    updateEnvironment(activeEnvironmentId!, {
      variables: activeEnv.variables.filter(v => v.id !== vid),
    });
  }, [activeEnv, activeEnvironmentId, updateEnvironment]);

  // ── Environment handler ──────────────────────────────────────────────────────
  const handleCreateEnvironment = useCallback(() => {
    createEnvironment();
    setTimeout(() => {
      const newEnv = useEnvironmentStore.getState().environments[0];
      openEditModal('environment', newEnv.id, newEnv.name);
    }, 0);
  }, [createEnvironment, openEditModal]);

  // ── Cursor class ─────────────────────────────────────────────────────────────
  const cursorClass = [
    isResizing ? 'cursor-col-resize select-none' : '',
    responsePanel.isResizing
      ? (responsePanel.position === 'right' ? 'cursor-col-resize' : 'cursor-row-resize') + ' select-none'
      : '',
  ].filter(Boolean).join(' ');

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className={`flex h-screen bg-bg-deep text-text-main overflow-hidden ${cursorClass}`} id="lumina-app">

      {/* ── Nav ── */}
      {activeWorkspaceMode !== 'settings' && (
        <nav className="w-16 flex flex-col items-center py-6 border-r border-border-subtle bg-bg-deep z-50">
          <div className="mb-10 text-brand-accent relative group cursor-pointer">
            <motion.div
              animate={{ boxShadow: ['0 0 15px rgba(139,92,246,0.3)', '0 0 30px rgba(139,92,246,0.6)', '0 0 15px rgba(139,92,246,0.3)'] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute inset-0 rounded-full blur-2xl z-[-1]"
            />
            <Zap className="w-8 h-8 filter drop-shadow-[0_0_12px_rgba(139,92,246,0.8)] group-hover:scale-110 transition-transform duration-500" />
          </div>

          <div className="flex flex-col gap-6 flex-1">
            {[
              { label: 'Workspaces', icon: <LayoutGrid className="w-5 h-5" />, tab: 'workspaces' },
              { label: 'History',    icon: <History    className="w-5 h-5" />, tab: 'history' },
              { label: 'Collections',icon: <Database   className="w-5 h-5" />, tab: 'collections' },
              { label: 'Environments',icon:<Globe      className="w-5 h-5" />, tab: 'env' },
            ].map(({ label, icon, tab }) => (
              <NavItem key={tab} label={label} icon={icon}
                active={activeSidebarTab === tab}
                onClick={() => { setActiveSidebarTab(tab as any); setActiveWorkspaceMode('request'); }}
              />
            ))}
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
              <NavItem label="Login" icon={<User className="w-5 h-5" />} active={false}
                onClick={() => useUIStore.getState().openLoginModal()} />
            )}
            <NavItem label="Settings" icon={<Settings className="w-5 h-5" />}
              active={activeSidebarTab === 'settings'}
              onClick={() => { setActiveSidebarTab('settings'); setActiveWorkspaceMode('settings'); }}
            />
            {isSidebarCollapsed && (
              <button onClick={() => setIsSidebarCollapsed(false)}
                className="p-3 text-brand-accent hover:bg-brand-accent/10 rounded-xl transition-all mt-2" title="Expand Sidebar">
                <ChevronRight className="w-5 h-5" />
              </button>
            )}
          </div>
        </nav>
      )}

      {/* ── Sidebar ── */}
      {activeWorkspaceMode !== 'settings' && (
        <Sidebar
          activeTab={activeSidebarTab}
          collections={collections}
          environments={environments}
          activeEnvironmentId={activeEnvironmentId}
          onOpenRequest={openRequest}
          onOpenEnvironment={(id) => { setActiveEnvironmentId(id); setActiveWorkspaceMode('environment'); }}
          onCreateCollection={handleCreateCollection}
          onCreateEnvironment={handleCreateEnvironment}
          onToggleCollection={toggleCollection}
          onAddRequest={handleAddRequestToCollection}
          onEdit={openEditModal}
          onDelete={deleteItem}
          onMoveRequest={moveRequestToCollection}
          onAddServer={() => setWorkspaceModalOpen(true)}
          onImport={() => setImportModalOpen(true)}
          onExportCollection={handleExport}
          width={sidebarWidth}
          isCollapsed={isSidebarCollapsed}
          isResizing={isResizing}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          onResizeStart={handleSidebarResizeStart}
        />
      )}

      {/* ── Main content ── */}
      {activeWorkspaceMode === 'request' ? (
        <Workspace
          tabs={tabs} activeTabId={activeTabId} activeWorkTab={activeWorkTab}
          environments={environments} selectedEnvironmentId={activeEnvironmentId}
          onSetActiveTab={(id) => { setActiveWorkspaceMode('request'); setActiveTabId(id); }}
          onCloseTab={(_, id) => closeTab(id)}
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
      ) : activeEnv ? (
        <EnvironmentEditor
          environment={activeEnv}
          environments={environments}
          selectedEnvironmentId={activeEnvironmentId}
          onUpdate={(up) => updateEnvironment(activeEnvironmentId!, up)}
          onUpdateVariable={handleUpdateVariable}
          onAddVariable={handleAddVariable}
          onRemoveVariable={handleRemoveVariable}
          onBack={() => setActiveWorkspaceMode('request')}
        />
      ) : null}

      {/* ── Modals ── */}
      <EditModal isOpen={modals.edit.isOpen} onClose={closeEditModal}
        target={modals.edit} onSave={handleSaveEdit}
        environments={environments} selectedEnvironmentId={activeEnvironmentId} />

      <LoginModal isOpen={modals.login.isOpen} onClose={closeLoginModal} onLogin={handleAppLogin} />

      <CookieModal isOpen={isCookieModalOpen} onClose={() => setCookiesModalOpen(false)}
        cookies={cookies} onAdd={addCookie} onUpdate={updateCookie} onRemove={removeCookie} />

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

      <WorkspaceModal isOpen={modals.workspace.isOpen} onClose={() => setWorkspaceModalOpen(false)} onAdd={addServer} />

      <ImportModal isOpen={modals.import.isOpen} onClose={() => setImportModalOpen(false)} onImportCollection={handleImportCollection} />
    </div>
  );
}
