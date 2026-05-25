import React from 'react';
import { Node, Edge, NodeShape } from '../../types';
import { Type, Square, Circle, Hexagon, Diamond, Trash2, Palette, Type as TypeIcon, Hash, ArrowRight, MousePointer2, MoveRight, Scissors, LineChart as LineIcon } from 'lucide-react';
import { useLanguage } from '../../lib/i18n';

interface Props {
  selectedNode?: Node;
  selectedEdge?: Edge;
  onUpdateNode: (update: Partial<Node>) => void;
  onUpdateEdge: (update: Partial<Edge>) => void;
  onDeleteNode: (id: string) => void;
  onDeleteEdge: (id: string) => void;
  onAIExpand: (id: string) => void;
}

const Sidebar: React.FC<Props> = ({ selectedNode, selectedEdge, onUpdateNode, onUpdateEdge, onDeleteNode, onDeleteEdge, onAIExpand }) => {
  const { t, language } = useLanguage();
  if (!selectedNode && !selectedEdge) return null;

  const shapes: { id: NodeShape; icon: React.ReactNode }[] = [
    { id: 'rectangle', icon: <Square size={16} /> },
    { id: 'rounded-rectangle', icon: <Square size={16} className="rounded" /> },
    { id: 'ellipse', icon: <Circle size={16} /> },
    { id: 'diamond', icon: <Diamond size={16} /> },
    { id: 'hexagon', icon: <Hexagon size={16} /> },
  ];

  return (
    <aside className="w-80 sleek-sidebar overflow-y-auto shrink-0 flex flex-col z-20">
      <div className="p-6 border-b border-slate-100 flex items-center justify-between">
        <h2 className="font-bold text-slate-900 tracking-tight">
          {selectedNode ? t('node_inspector') : t('line_inspector')}
        </h2>
        <button 
          onClick={() => selectedNode ? onDeleteNode(selectedNode.id) : onDeleteEdge(selectedEdge!.id)}
          className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg transition-colors cursor-pointer"
          title={t('inspector_delete')}
        >
          <Trash2 size={18} />
        </button>
      </div>

      <div className="p-6 space-y-8">
        {selectedNode ? (
          <div className="space-y-8">
            <div className="space-y-3">
              <label className="sleek-node-label">{t('inspector_content')}</label>
              <textarea 
                value={selectedNode.text}
                onChange={(e) => onUpdateNode({ id: selectedNode.id, text: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-100 outline-none transition-all min-h-[80px]"
              />
            </div>

            <div className="space-y-3">
              <label className="sleek-node-label">{t('inspector_shape')}</label>
              <div className="grid grid-cols-5 gap-2">
                {shapes.map(shape => (
                  <button
                    key={shape.id}
                    onClick={() => onUpdateNode({ id: selectedNode.id, shape: shape.id })}
                    className={`p-2.5 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                      selectedNode.shape === shape.id 
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-100 ring-2 ring-blue-100' 
                        : 'bg-slate-50 text-slate-400 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    {shape.icon}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-slate-600 flex items-center gap-2"><Palette size={14} className="text-slate-400"/> {t('inspector_background')}</span>
                <input 
                  type="color" 
                  value={selectedNode.backgroundColor}
                  onChange={(e) => onUpdateNode({ id: selectedNode.id, backgroundColor: e.target.value })}
                  className="w-8 h-8 p-0 border-none rounded-full bg-transparent cursor-pointer ring-2 ring-slate-100 ring-offset-2"
                />
              </div>

              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-slate-600 flex items-center gap-2"><Square size={14} className="text-slate-400"/> {t('inspector_border')}</span>
                <input 
                  type="color" 
                  value={selectedNode.borderColor}
                  onChange={(e) => onUpdateNode({ id: selectedNode.id, borderColor: e.target.value })}
                  className="w-8 h-8 p-0 border-none rounded-full bg-transparent cursor-pointer ring-2 ring-slate-100 ring-offset-2"
                />
              </div>

              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-slate-600 flex items-center gap-2"><TypeIcon size={14} className="text-slate-400"/> {t('inspector_text')}</span>
                <input 
                  type="color" 
                  value={selectedNode.textColor}
                  onChange={(e) => onUpdateNode({ id: selectedNode.id, textColor: e.target.value })}
                  className="w-8 h-8 p-0 border-none rounded-full bg-transparent cursor-pointer ring-2 ring-slate-100 ring-offset-2"
                />
              </div>
            </div>

            <div className="space-y-3 pt-6 border-t border-slate-100">
               <label className="sleek-node-label">{t('inspector_typography')}</label>
               <div className="flex items-center gap-2">
                  <div className="flex-1 h-10 bg-slate-50 border border-slate-200 rounded-xl flex items-center px-4 text-xs font-medium text-slate-600">
                    Inter {selectedNode.fontWeight === 'bold' ? 'Bold' : 'Regular'}
                  </div>
                  <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                     <button onClick={() => onUpdateNode({ id: selectedNode.id, fontSize: Math.max(8, selectedNode.fontSize - 1)})} className="text-slate-400 hover:text-slate-900 transition-colors">-</button>
                     <span className="text-xs w-6 text-center font-bold text-slate-700">{selectedNode.fontSize}</span>
                     <button onClick={() => onUpdateNode({ id: selectedNode.id, fontSize: Math.min(72, selectedNode.fontSize + 1)})} className="text-slate-400 hover:text-slate-900 transition-colors">+</button>
                  </div>
               </div>

               <div className="flex items-center gap-2 pt-2">
                  <button 
                    onClick={() => onUpdateNode({ id: selectedNode.id, fontWeight: selectedNode.fontWeight === 'bold' ? 'normal' : 'bold' })}
                    className={`flex-1 py-2 text-[10px] font-bold rounded-xl border transition-all cursor-pointer ${selectedNode.fontWeight === 'bold' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                  >
                    {t('inspector_bold')}
                  </button>
                  <button 
                    onClick={() => onUpdateNode({ id: selectedNode.id, fontStyle: selectedNode.fontStyle === 'italic' ? 'normal' : 'italic' })}
                    className={`flex-1 py-2 text-[10px] font-bold rounded-xl border transition-all cursor-pointer ${selectedNode.fontStyle === 'italic' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                  >
                    {t('inspector_italic')}
                  </button>
               </div>
            </div>

            <div className="pt-8">
               <button 
                 onClick={() => onAIExpand(selectedNode.id)}
                 className="w-full py-4 bg-gradient-to-br from-purple-600 to-blue-600 text-white rounded-2xl flex items-center justify-center gap-3 shadow-xl shadow-blue-100 hover:shadow-blue-200 transition-all active:scale-95 group cursor-pointer"
               >
                 <SparklesIcon size={18} className="group-hover:animate-pulse" />
                 <span className="text-sm font-bold tracking-tight">{t('inspector_ai_btn')}</span>
               </button>
               <p className="text-[10px] text-slate-400 mt-3 text-center font-medium opacity-70 italic tracking-tight">{t('inspector_ai_sub')}</p>
            </div>
          </div>
        ) : selectedEdge && (
          <div className="space-y-8">
            <div className="space-y-4">
              <label className="sleek-node-label">{t('inspector_line_style')}</label>
              <div className="flex gap-2">
                {(['solid', 'dashed', 'dotted'] as const).map(style => (
                  <button
                    key={style}
                    onClick={() => onUpdateEdge({ id: selectedEdge.id, style })}
                    className={`flex-1 py-3 px-2 rounded-xl text-[10px] font-bold border transition-all cursor-pointer ${selectedEdge.style === style ? 'bg-slate-900 text-white border-slate-900 shadow-lg' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                  >
                    {style === 'solid' ? t('style_solid') : style === 'dashed' ? t('style_dashed') : t('style_dotted')}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <label className="sleek-node-label">{language === 'nl' ? 'Pijlen & Richting' : 'Ends & Direction'}</label>
              <div className="flex gap-2">
                <button
                  onClick={() => onUpdateEdge({ id: selectedEdge.id, arrowStart: !selectedEdge.arrowStart })}
                  className={`flex-1 py-3 rounded-xl flex flex-col items-center gap-1 border transition-all cursor-pointer ${selectedEdge.arrowStart ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-white'}`}
                >
                  <MoveRight size={14} className="rotate-180" />
                  <span className="text-[9px] font-black uppercase">{language === 'nl' ? 'Begin' : 'Start'}</span>
                </button>
                <button
                  onClick={() => onUpdateEdge({ id: selectedEdge.id, arrowEnd: !selectedEdge.arrowEnd })}
                  className={`flex-1 py-3 rounded-xl flex flex-col items-center gap-1 border transition-all cursor-pointer ${selectedEdge.arrowEnd ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-white'}`}
                >
                   <MoveRight size={14} />
                   <span className="text-[9px] font-black uppercase">{language === 'nl' ? 'Einde' : 'End'}</span>
                </button>
              </div>
            </div>

            <div className="space-y-4">
               <label className="sleek-node-label">{language === 'nl' ? 'Uiterlijk' : 'Appearance'}</label>
               <div className="flex items-center justify-between">
                 <span className="text-xs font-medium text-slate-600 flex items-center gap-2"><Palette size={14} className="text-slate-400"/> {t('inspector_line_color')}</span>
                 <input 
                   type="color" 
                   value={selectedEdge.color}
                   onChange={(e) => onUpdateEdge({ id: selectedEdge.id, color: e.target.value })}
                   className="w-8 h-8 p-0 border-none rounded-full bg-transparent cursor-pointer ring-2 ring-slate-100 ring-offset-2"
                 />
               </div>
               <div className="flex items-center justify-between">
                 <span className="text-xs font-medium text-slate-600 flex items-center gap-2">{t('inspector_line_width')}</span>
                 <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
                    <button onClick={() => onUpdateEdge({ id: selectedEdge.id, width: Math.max(0.5, selectedEdge.width - 0.5)})} className="text-slate-400 hover:text-slate-900">-</button>
                    <span className="text-xs w-8 text-center font-bold text-slate-700">{selectedEdge.width}</span>
                    <button onClick={() => onUpdateEdge({ id: selectedEdge.id, width: Math.min(10, selectedEdge.width + 0.5)})} className="text-slate-400 hover:text-slate-900">+</button>
                 </div>
               </div>
               <div className="flex items-center justify-between">
                 <span className="text-xs font-medium text-slate-600 flex items-center gap-2">{t('inspector_line_curve')}</span>
                 <div className="flex gap-1.5 bg-slate-100 p-0.5 rounded-xl border border-slate-200">
                   <button
                     onClick={() => onUpdateEdge({ id: selectedEdge.id, curve: 0 })}
                     className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${selectedEdge.curve === 0 ? 'bg-white text-slate-900' : 'text-slate-400'}`}
                   >
                     {t('curve_straight')}
                   </button>
                   <button
                     onClick={() => onUpdateEdge({ id: selectedEdge.id, curve: 20 })}
                     className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${selectedEdge.curve > 0 ? 'bg-white text-slate-900' : 'text-slate-400'}`}
                   >
                     {t('curve_curved')}
                   </button>
                 </div>
               </div>
               
               <div className="space-y-2">
                 <span className="text-xs font-medium text-slate-600 flex items-center gap-2">{t('inspector_line_label')}</span>
                 <input
                   type="text"
                   placeholder={t('inspector_label_placeholder')}
                   value={selectedEdge.label || ''}
                   onChange={(e) => onUpdateEdge({ id: selectedEdge.id, label: e.target.value })}
                   className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-100 outline-none transition-all placeholder:text-slate-300 font-medium"
                 />
               </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};

const SparklesIcon = ({ size, className }: { size: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/><path d="M19 3v4"/><path d="M21 5h-4"/>
  </svg>
);

export default Sidebar;
