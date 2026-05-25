import React from 'react';
import { Node, Edge, MindMap } from '../../types';
import { ChevronRight, ChevronDown, Plus, Trash2, GripVertical } from 'lucide-react';
import { useLanguage } from '../../lib/i18n';

interface Props {
  currentMap: MindMap;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onUpdateNode: (update: Partial<Node>) => void;
  onAddNode: (parentId: string, mode: 'child' | 'sibling') => void;
  onDeleteNode: (id: string) => void;
}

const OutlineView: React.FC<Props> = ({ 
  currentMap, 
  selectedId, 
  onSelect, 
  onUpdateNode, 
  onAddNode, 
  onDeleteNode 
}) => {
  const { t } = useLanguage();

  // Build a tree structure from nodes and edges
  const buildTree = (parentId: string | null = null): any[] => {
    let childNodes: Node[] = [];
    if (parentId === null) {
      // Find root nodes (no incoming edges)
      const targetIds = new Set(currentMap.edges.map(e => e.targetId));
      childNodes = currentMap.nodes.filter(n => !targetIds.has(n.id));
      
      // Fallback if no clear root (circular or just starting)
      if (childNodes.length === 0 && currentMap.nodes.length > 0) {
        childNodes = [currentMap.nodes[0]];
      }
    } else {
      const childrenEdges = currentMap.edges.filter(e => e.sourceId === parentId);
      const childrenIds = new Set(childrenEdges.map(e => e.targetId));
      childNodes = currentMap.nodes.filter(n => childrenIds.has(n.id));
    }

    return childNodes.map(node => ({
      ...node,
      children: buildTree(node.id)
    }));
  };

  const tree = buildTree();

  const renderNode = (item: any, depth: number = 0) => {
    const isSelected = selectedId === item.id;

    return (
      <div key={item.id} className="flex flex-col">
        <div 
          className={`flex items-center group py-2 px-4 border-b border-slate-50 hover:bg-slate-50 transition-colors ${isSelected ? 'bg-blue-50 border-blue-100' : ''}`}
          style={{ paddingLeft: `${depth * 28 + 16}px` }}
          onClick={() => onSelect(item.id)}
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <GripVertical size={14} className="text-slate-300 opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing shrink-0" />
            
            {item.children.length > 0 ? (
               <ChevronDown size={16} className="text-slate-400 shrink-0" />
            ) : (
               <div className="w-4 h-4 shrink-0" />
            )}

            <div className={`w-3 h-3 rounded-full shrink-0`} style={{ backgroundColor: item.backgroundColor, border: `1px solid ${item.borderColor}` }} />

            <input 
              type="text"
              value={item.text}
              placeholder={item.level === 0 ? t('outline_central_topic') : t('outline_type_here')}
              onFocus={() => onSelect(item.id)}
              onChange={(e) => onUpdateNode({ id: item.id, text: e.target.value })}
              className={`bg-transparent outline-none flex-1 min-w-0 font-medium ${isSelected ? 'text-blue-900' : 'text-slate-700'} ${item.level === 0 ? 'text-lg font-bold' : 'text-sm'}`}
            />
          </div>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-4">
            <button 
              onClick={(e) => { e.stopPropagation(); onAddNode(item.id, 'child'); }}
              className="p-1.5 hover:bg-slate-200 rounded text-slate-500 hover:text-blue-600 transition-colors"
              title={t('outline_add_child')}
            >
              <Plus size={14} />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); onDeleteNode(item.id); }}
              className="p-1.5 hover:bg-slate-200 rounded text-slate-500 hover:text-red-500 transition-colors"
              title={t('outline_delete')}
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
        
        {item.children.length > 0 && (
          <div className="flex flex-col">
            {item.children.map((child: any) => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-full w-full bg-white overflow-y-auto flex flex-col custom-scrollbar">
      <div className="p-6 border-b border-slate-100 bg-slate-50/50 sticky top-0 z-10 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{t('outline_title')}</h2>
          <p className="text-xs text-slate-500 font-medium">{t('outline_sub')}</p>
        </div>
        <button 
          onClick={() => {
            const root = currentMap.nodes.find(n => n.level === 0) || currentMap.nodes[0];
            if (root) onAddNode(root.id, 'child');
          }}
          className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm cursor-pointer"
        >
          <Plus size={14} className="text-blue-500" />
          <span>{t('outline_new_topic')}</span>
        </button>
      </div>
      <div className="flex-1 pb-20">
        {tree.length > 0 ? (
          tree.map(rootItem => renderNode(rootItem))
        ) : (
          <div className="flex flex-col items-center justify-center p-20 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
              <Plus size={32} className="text-slate-300" />
            </div>
            <p className="text-slate-500 font-medium mb-2">{t('outline_no_topics')}</p>
            <button 
              onClick={() => onAddNode('', 'child')}
              className="text-blue-600 text-sm font-bold hover:underline"
            >
              {t('outline_add_first')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default OutlineView;
