/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  ChevronRight, 
  Folder, 
  FolderOpen, 
  PlusCircle, 
  Copy, 
  MoreVertical,
  Edit2,
  Trash2,
  ChevronLeft,
  FolderPlus,
  Globe,
  LayoutGrid,
  Link,
  ShieldCheck,
  Zap,
  Upload,
  Download
} from 'lucide-react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Collection, RequestItem, HttpMethod, Environment, Workspace } from '../types';
import { getMethodColor } from '../constants';
import { useHistoryStore } from '../store/useHistoryStore';

interface SidebarProps {
  activeTab: 'history' | 'collections' | 'env' | 'settings' | 'workspaces';
  collections: Collection[];
  environments: Environment[];
  workspaces: Workspace[];
  activeWorkspaceId: string;
  activeEnvironmentId: string | null;
  onOpenRequest: (item: RequestItem, collectionId?: string) => void;
  onOpenEnvironment: (id: string) => void;
  onCreateCollection: (parentId?: string) => void;
  onCreateEnvironment: () => void;
  onToggleCollection: (id: string) => void;
  onAddRequest: (id: string) => void;
  onEdit: (type: 'collection' | 'request' | 'environment', id: string, name: string, parentId?: string) => void;
  onDelete: (type: 'collection' | 'request' | 'environment', id: string, parentId?: string) => void;
  onMoveRequest: (requestId: string, sourceId: string, destId: string) => void;
  onSelectWorkspace: (id: string) => void;
  onAddWorkspace: () => void;
  onConnectWorkspace: (id: string) => void;
  onDeleteWorkspace: (id: string) => void;
  onImport: () => void;
  onExportCollection: (id: string) => void;
  width: number;
  isCollapsed: boolean;
  isResizing: boolean;
  onToggleCollapse: () => void;
  onResizeStart: (e: React.MouseEvent) => void;
}

export function Sidebar({ 
  activeTab, 
  collections, 
  environments,
  workspaces,
  activeWorkspaceId,
  activeEnvironmentId,
  onOpenRequest, 
  onOpenEnvironment,
  onCreateCollection, 
  onCreateEnvironment,
  onToggleCollection, 
  onAddRequest, 
  onEdit,
  onDelete,
  onMoveRequest,
  onSelectWorkspace,
  onAddWorkspace,
  onConnectWorkspace,
  onDeleteWorkspace,
  onImport,
  onExportCollection,
  width,
  isCollapsed,
  isResizing,
  onToggleCollapse,
  onResizeStart
}: SidebarProps) {
  const history = useHistoryStore((s) => s.history);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    
    const requestId = result.draggableId;
    const sourceId = result.source.droppableId;
    const destId = result.destination.droppableId;

    if (sourceId !== destId) {
      onMoveRequest(requestId, sourceId, destId);
    }
  };

  return (
    <aside 
      className={`relative border-r border-border-subtle bg-bg-card flex flex-col ${!isResizing ? 'transition-[width] duration-300 ease-in-out' : ''} ${isCollapsed ? 'w-0 overflow-hidden border-none' : ''}`}
      style={{ width: isCollapsed ? 0 : width }}
    >
      <div className={`flex flex-col h-full w-full ${isCollapsed ? 'invisible' : 'visible'}`} style={{ minWidth: width }}>
        <div className="p-4 border-b border-border-subtle flex justify-between items-center text-text-dim">
          <h2 className="text-[11px] font-semibold tracking-widest uppercase px-1">
            {activeTab === 'env' ? 'Environments' : (activeTab === 'workspaces' ? 'Workspaces' : activeTab)}
          </h2>
          <div className="flex items-center gap-1">
            {activeTab === 'collections' && (
              <button 
                onClick={onImport}
                className="p-1.5 hover:bg-white/5 rounded-md transition-colors text-text-dim hover:text-brand-accent group"
                title="Import Collection"
              >
                <Upload className="w-4 h-4 group-hover:scale-110 transition-transform" />
              </button>
            )}
            <button 
              onClick={activeTab === 'collections' ? () => onCreateCollection() : (activeTab === 'env' ? onCreateEnvironment : (activeTab === 'workspaces' ? onAddWorkspace : undefined))}
              className="p-1.5 hover:bg-white/5 rounded-md transition-colors text-text-dim hover:text-text-main"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button 
              onClick={onToggleCollapse}
              className="p-1.5 hover:bg-white/5 rounded-md transition-colors text-text-dim hover:text-text-main"
              title="Collapse Sidebar"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto px-2 py-2 custom-scrollbar">
          {activeTab === 'history' && (
            <div className="space-y-1">
              {history.map((item) => (
                <motion.div
                  layout
                  key={item.id}
                  onClick={() => onOpenRequest({ id: item.id, method: item.method as any, name: item.name, url: item.url, timestamp: item.timestamp })}
                  className="p-3 rounded-lg hover:bg-white/5 cursor-pointer group transition-all"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded ${getMethodColor(item.method as any)}`}>
                      {item.method}
                    </span>
                    <span className="text-sm font-medium text-text-main truncate group-hover:text-white">{item.name}</span>
                  </div>
                  <div className="text-[10px] text-text-dim truncate mono group-hover:text-text-main">{item.url}</div>
                </motion.div>
              ))}
            </div>
          )}

          {activeTab === 'collections' && (
            <DragDropContext onDragEnd={handleDragEnd}>
              <div className="space-y-1 px-1">
                {collections.map((collection) => (
                  <CollectionNode 
                    key={collection.id} 
                    collection={collection} 
                    level={0}
                    onToggleCollection={onToggleCollection}
                    onAddRequest={onAddRequest}
                    onCreateCollection={onCreateCollection}
                    onOpenRequest={onOpenRequest}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onExportCollection={onExportCollection}
                  />
                ))}
                {collections.length === 0 && (
                  <div className="p-8 text-center border-2 border-dashed border-white/5 rounded-2xl">
                    <Folder className="w-8 h-8 text-text-dim mx-auto mb-3 opacity-20" />
                    <p className="text-xs text-text-dim italic opacity-40">Create a collection to get started</p>
                  </div>
                )}
              </div>
            </DragDropContext>
          )}

          {activeTab === 'env' && (
            <div className="space-y-1">
              {environments.map((env) => (
                <motion.div
                  layout
                  key={env.id}
                  onClick={() => onOpenEnvironment(env.id)}
                  className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all group border ${
                    activeEnvironmentId === env.id 
                      ? 'bg-brand-accent/10 border-brand-accent/20' 
                      : 'hover:bg-white/5 border-transparent'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                    activeEnvironmentId === env.id ? 'bg-brand-accent text-white' : 'bg-white/5 text-text-dim group-hover:bg-white/10'
                  }`}>
                    <Globe className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-text-main truncate group-hover:text-white transition-colors">{env.name}</div>
                    <div className="text-[10px] text-text-dim truncate opacity-60">
                      {env.variables.length} Variables
                    </div>
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-all">
                    <ActionMenu 
                      onEdit={() => onEdit('environment', env.id, env.name)} 
                      onDelete={() => onDelete('environment', env.id)} 
                    />
                  </div>
                </motion.div>
              ))}
              {environments.length === 0 && (
                <div className="p-8 text-center border-2 border-dashed border-white/5 rounded-2xl">
                  <Globe className="w-8 h-8 text-text-dim mx-auto mb-3 opacity-20" />
                  <p className="text-xs text-text-dim">No environments found</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'workspaces' && (
            <div className="space-y-2">
              {workspaces.map((ws) => (
                <motion.div
                  layout
                  key={ws.id}
                  onClick={() => onSelectWorkspace(ws.id)}
                  className={`flex flex-col p-4 rounded-2xl cursor-pointer transition-all group border relative overflow-hidden ${
                    activeWorkspaceId === ws.id 
                      ? 'bg-brand-accent/10 border-brand-accent/30 shadow-[0_8px_30px_rgb(139,92,246,0.1)]' 
                      : 'bg-transparent border-white/5 hover:bg-white/[0.02] hover:border-white/10'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-3 relative z-10">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                      activeWorkspaceId === ws.id ? 'bg-brand-accent text-white shadow-[0_0_15px_rgba(139,92,246,0.5)]' : 'bg-white/5 text-text-dim'
                    }`}>
                      {ws.url ? <Globe className="w-5 h-5" /> : <Zap className="w-5 h-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-text-main group-hover:text-white transition-colors truncate">
                          {ws.name}
                        </span>
                        {ws.isConnected && <div className="w-1.5 h-1.5 rounded-full bg-success shadow-[0_0_8px_rgba(16,185,129,0.5)] shrink-0" />}
                      </div>
                      <div className="text-[10px] text-text-dim truncate opacity-60 font-mono">
                        {ws.url || 'Local Workspace'}
                      </div>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-all">
                      <ActionMenu 
                        onEdit={() => {}} 
                        onDelete={() => onDeleteWorkspace(ws.id)} 
                      />
                    </div>
                  </div>

                  {ws.url && !ws.isConnected && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onConnectWorkspace(ws.id); }}
                      className="w-full py-1.5 text-[10px] font-black uppercase tracking-widest bg-brand-accent/20 text-brand-accent hover:bg-brand-accent hover:text-white rounded-lg transition-all border border-brand-accent/30"
                    >
                      Connect to Server
                    </button>
                  )}

                  {ws.isConnected && ws.isLoggedIn && (
                    <div className="flex items-center gap-2 px-2 py-1.5 bg-white/5 rounded-lg border border-white/5">
                      <ShieldCheck className="w-3 h-3 text-success" />
                      <span className="text-[10px] font-bold text-text-dim truncate">Logged in as {ws.user?.name}</span>
                    </div>
                  )}

                  {activeWorkspaceId === ws.id && (
                    <div className="absolute top-0 right-0 p-1 opacity-10">
                      <LayoutGrid className="w-12 h-12 rotate-12" />
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {!isCollapsed && (
        <div 
          onMouseDown={onResizeStart}
          className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-brand-accent/50 active:bg-brand-accent transition-colors z-50"
        />
      )}
    </aside>
  );
}

interface CollectionNodeProps {
  collection: Collection;
  level: number;
  onToggleCollection: (id: string) => void;
  onAddRequest: (id: string) => void;
  onCreateCollection: (parentId?: string) => void;
  onOpenRequest: (item: RequestItem, collectionId?: string) => void;
  onEdit: (type: 'collection' | 'request' | 'environment', id: string, name: string, parentId?: string) => void;
  onDelete: (type: 'collection' | 'request' | 'environment', id: string, parentId?: string) => void;
  onExportCollection: (id: string) => void;
}

function CollectionNode({ 
  collection, 
  level, 
  onToggleCollection, 
  onAddRequest, 
  onCreateCollection, 
  onOpenRequest, 
  onEdit, 
  onDelete,
  onExportCollection
}: CollectionNodeProps) {
  return (
    <div className="space-y-0.5">
      <div 
        onClick={() => onToggleCollection(collection.id)}
        className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/5 cursor-pointer group relative"
        style={{ paddingLeft: `${Math.max(8, level * 12 + 8)}px` }}
      >
        <ChevronRight className={`w-3.5 h-3.5 transition-transform ${collection.collapsed ? '' : 'rotate-90'} text-text-dim`} />
        {collection.collapsed ? (
          <Folder className="w-3.5 h-3.5 text-brand-accent/70" />
        ) : (
          <FolderOpen className="w-3.5 h-3.5 text-brand-accent" />
        )}
        
        <span className={`text-xs font-bold flex-1 truncate ${!collection.collapsed ? 'text-text-main' : 'text-text-dim'}`}>
          {collection.name}
        </span>

        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-all">
          <button 
            title="New Folder"
            onClick={(e) => { e.stopPropagation(); onCreateCollection(collection.id); }}
            className="p-1 hover:text-brand-accent text-text-dim transition-colors"
          >
            <FolderPlus className="w-3.5 h-3.5" />
          </button>
          <button 
            title="New Request"
            onClick={(e) => { e.stopPropagation(); onAddRequest(collection.id); }}
            className="p-1 hover:text-brand-accent text-text-dim transition-colors"
          >
            <PlusCircle className="w-3.5 h-3.5" />
          </button>
          
          <ActionMenu 
            onEdit={() => onEdit('collection', collection.id, collection.name)} 
            onDelete={() => onDelete('collection', collection.id)} 
            onExport={() => onExportCollection(collection.id)}
          />
        </div>
      </div>

      <AnimatePresence>
        {!collection.collapsed && (
          <div className="space-y-0.5">
            {/* Sub-collections */}
            {collection.children?.map((child) => (
              <CollectionNode 
                key={child.id} 
                collection={child} 
                level={level + 1}
                onToggleCollection={onToggleCollection}
                onAddRequest={onAddRequest}
                onCreateCollection={onCreateCollection}
                onOpenRequest={onOpenRequest}
                onEdit={onEdit}
                onDelete={onDelete}
                onExportCollection={onExportCollection}
              />
            ))}

            {/* Droppable Area for Requests */}
            <Droppable droppableId={collection.id} type="REQUEST">
              {(provided, snapshot) => (
                <div 
                  ref={provided.innerRef} 
                  {...provided.droppableProps}
                  className={`min-h-[4px] transition-colors rounded-lg mb-1 ${snapshot.isDraggingOver ? 'bg-brand-accent/5 ring-1 ring-inset ring-brand-accent/20' : ''}`}
                >
                  {collection.items.map((item, index) => (
                    <Draggable key={item.id} draggableId={item.id} index={index}>
                      {(provided, snapshot) => (
                        <div 
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          onClick={() => onOpenRequest(item, collection.id)}
                          className={`flex items-center gap-2 p-2 rounded-lg hover:bg-white/5 cursor-pointer group transition-all ${snapshot.isDragging ? 'bg-bg-deep shadow-2xl scale-[1.02] ring-1 ring-brand-accent/50 z-[100]' : ''}`}
                          style={{ 
                            ...provided.draggableProps.style,
                            paddingLeft: `${(level + 1) * 12 + 24}px` 
                          }}
                        >
                          <span className={`text-[7px] font-black w-7 text-center rounded py-0.5 ${getMethodColor(item.method)}`}>
                            {item.method}
                          </span>
                          <span className="text-xs text-text-dim group-hover:text-text-main truncate flex-1">
                            {item.name}
                          </span>

                          <div className="opacity-0 group-hover:opacity-100 transition-all">
                            <ActionMenu 
                              onEdit={() => onEdit('request', item.id, item.name, collection.id)} 
                              onDelete={() => onDelete('request', item.id, collection.id)} 
                            />
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>

            {((!collection.children || collection.children.length === 0) && collection.items.length === 0) && (
              <div className="py-2 text-center opacity-20" style={{ paddingLeft: `${(level + 1) * 12 + 8}px` }}>
                <p className="text-[9px] font-medium italic">Empty</p>
              </div>
            )}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ActionMenu({ onEdit, onDelete, onExport }: { onEdit: () => void, onDelete: () => void, onExport?: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div className="relative" ref={menuRef}>
      <button 
        onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
        className="p-1 hover:text-text-main text-text-dim transition-all"
      >
        <MoreVertical className="w-3.5 h-3.5" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            className="absolute right-0 top-full mt-2 w-40 bg-bg-card border border-white/10 rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.6)] z-[60] overflow-hidden backdrop-blur-2xl ring-1 ring-white/5 py-1.5"
          >
            <div className="px-3 pb-1 mb-1 border-b border-white/5">
              <span className="text-[9px] font-bold uppercase tracking-widest opacity-30">Manage</span>
            </div>
            <button 
              onClick={(e) => { e.stopPropagation(); setIsOpen(false); onEdit(); }}
              className="w-full flex items-center gap-3 px-3 py-2 text-xs text-text-dim hover:text-white hover:bg-white/5 transition-all group/item"
            >
              <div className="w-6 h-6 rounded-lg bg-brand-accent/10 flex items-center justify-center text-brand-accent group-hover/item:bg-brand-accent group-hover/item:text-white transition-all">
                <Edit2 className="w-3.5 h-3.5" />
              </div>
              <span className="font-bold">Edit</span>
            </button>

            {onExport && (
              <button 
                onClick={(e) => { e.stopPropagation(); setIsOpen(false); onExport(); }}
                className="w-full flex items-center gap-3 px-3 py-2 text-xs text-text-dim hover:text-white hover:bg-white/5 transition-all group/item"
              >
                <div className="w-6 h-6 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 group-hover/item:bg-emerald-500 group-hover/item:text-white transition-all">
                  <Download className="w-3.5 h-3.5" />
                </div>
                <span className="font-bold">Export</span>
              </button>
            )}

            <button 
              onClick={(e) => { e.stopPropagation(); setIsOpen(false); onDelete(); }}
              className="w-full flex items-center gap-3 px-3 py-2 text-xs text-text-dim hover:text-danger hover:bg-danger/10 transition-all group/item"
            >
              <div className="w-6 h-6 rounded-lg bg-danger/10 flex items-center justify-center text-danger group-hover/item:bg-danger group-hover/item:text-white transition-all">
                <Trash2 className="w-3.5 h-3.5" />
              </div>
              <span className="font-bold">Delete</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
