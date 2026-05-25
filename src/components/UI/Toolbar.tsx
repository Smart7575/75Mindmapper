import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Download, Undo2, Redo2, Share2, Plus, Sparkles, Grid, Edit2, Check, List, Map, Columns2, Palette } from 'lucide-react';
import { MindMap, ThemeId } from '../../types';
import { THEME_OPTIONS } from '../../lib/themes';
import { useLanguage } from '../../lib/i18n';

export type ViewMode = 'map' | 'outline' | 'split';

interface Props {
  currentMap?: MindMap;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onDashboard: () => void;
  onExport: (format: string) => void;
  onUndo: () => void;
  onRedo: () => void;
  onAddNode: () => void;
  onAutoLayout: () => void;
  snapToGrid: boolean;
  onToggleSnap: () => void;
  onRenameMap: (name: string) => void;
  theme: ThemeId;
  onThemeChange: (theme: ThemeId) => void;
  userEmail?: string | null;
  onSignOut?: () => void;
}

const Toolbar: React.FC<Props> = ({ 
  currentMap, 
  viewMode, 
  onViewModeChange, 
  onDashboard, 
  onExport, 
  onUndo, 
  onRedo, 
  onAddNode, 
  onAutoLayout, 
  snapToGrid, 
  onToggleSnap, 
  onRenameMap,
  theme,
  onThemeChange,
  userEmail,
  onSignOut
}) => {
  const { t, language, setLanguage } = useLanguage();
  const [showExportOptions, setShowExportOptions] = useState(false);
  const [showThemeOptions, setShowThemeOptions] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(currentMap?.name || '');

  useEffect(() => {
    if (currentMap) {
      setEditedName(currentMap.name);
    }
  }, [currentMap]);

  const handleNameSubmit = () => {
    if (editedName.trim() && editedName !== currentMap?.name) {
      onRenameMap(editedName);
    }
    setIsEditingName(false);
  };

  const getThemeDisplayName = (id: ThemeId): string => {
    switch (id) {
      case 'default': return t('theme_default');
      case 'retro-terminal': return t('theme_retro');
      case 'elegant-warm': return t('theme_warm');
      case 'playful-bubble': return t('theme_bubble');
      default: return t('theme_default');
    }
  };

  return (
    <header className="h-16 sleek-header px-3 md:px-6 flex items-center justify-between z-30 shrink-0">
      <div className="flex items-center gap-3 md:gap-6 min-w-0">
        <button 
          onClick={onDashboard}
          className="flex items-center gap-2 md:gap-3 group cursor-pointer shrink-0"
          title="Go to Dashboard"
        >
          <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-200 group-hover:scale-105 transition-transform animate-fade-in">
             <LayoutDashboard size={20} className="text-white" />
          </div>
          <span className="font-bold text-xl tracking-tighter text-slate-900 hidden sm:inline">75Mindmapper</span>
        </button>

        <div className="h-4 w-[1px] bg-slate-200 mx-0.5 md:mx-1 hidden sm:block" />

        <div className="flex flex-col min-w-[100px] md:min-w-[120px] truncate">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Project</span>
          {isEditingName ? (
            <div className="flex items-center gap-2">
              <input 
                autoFocus
                type="text"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                onBlur={handleNameSubmit}
                onKeyDown={(e) => e.key === 'Enter' && handleNameSubmit()}
                className="text-sm font-semibold text-slate-705 bg-slate-100 px-2 py-0.5 rounded outline-none border border-blue-400 focus:bg-white w-24 md:w-auto"
              />
              <button onClick={handleNameSubmit} className="text-blue-600 hover:text-blue-700 cursor-pointer">
                <Check size={14} />
              </button>
            </div>
          ) : (
            <div 
              className="flex items-center gap-1.5 group cursor-pointer min-w-0"
              onClick={() => setIsEditingName(true)}
            >
              <h1 className="text-sm font-bold text-slate-700 truncate max-w-[120px] md:max-w-[180px] border-b border-transparent group-hover:border-slate-300 transition-all">
                {currentMap ? currentMap.name : t('no_map_selected')}
              </h1>
              <Edit2 size={12} className="text-slate-300 group-hover:text-slate-500 opacity-0 group-hover:opacity-100 transition-all shrink-0" />
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1 md:gap-1.5 min-w-0">
        <button 
          onClick={onAddNode}
          className="flex items-center justify-center gap-1.5 px-2.5 md:px-3.5 py-2 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all font-bold text-xs shadow-lg hover:shadow-slate-100 active:scale-95 cursor-pointer shrink-0"
          title={t('new_node_btn')}
        >
          <Plus size={16} />
          <span className="hidden lg:inline">{t('new_node_btn')}</span>
        </button>

        <button 
          onClick={onAutoLayout}
          className="flex items-center justify-center gap-1.5 px-2.5 md:px-3.5 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-all font-bold text-xs shadow-sm active:scale-95 cursor-pointer shrink-0"
          title={t('layout_tooltip')}
        >
          <Sparkles size={16} className="text-blue-500 animate-pulse" />
          <span className="hidden lg:inline">{t('layout_btn')}</span>
        </button>

        <div className="h-6 w-[1px] bg-slate-200 mx-0.5 md:mx-1 shrink-0" />

        <div className="flex bg-slate-100 p-0.5 md:p-1 rounded-xl shrink-0">
          <button 
            onClick={() => onViewModeChange('map')}
            className={`p-1 md:p-1.5 rounded-lg flex items-center gap-1.5 px-2 md:px-3 transition-all cursor-pointer ${viewMode === 'map' ? 'bg-white text-blue-600 shadow-sm font-bold' : 'text-slate-500 hover:text-slate-700'}`}
            title="Mindmap View"
          >
            <Map size={16} />
            <span className="text-[10px] uppercase tracking-wider hidden lg:inline">{t('view_map')}</span>
          </button>
          <button 
            onClick={() => onViewModeChange('outline')}
            className={`p-1 md:p-1.5 rounded-lg flex items-center gap-1.5 px-2 md:px-3 transition-all cursor-pointer ${viewMode === 'outline' ? 'bg-white text-blue-600 shadow-sm font-bold' : 'text-slate-500 hover:text-slate-700'}`}
            title="Outline View"
          >
            <List size={16} />
            <span className="text-[10px] uppercase tracking-wider hidden lg:inline">{t('view_list')}</span>
          </button>
          <button 
            onClick={() => onViewModeChange('split')}
            className={`p-1 md:p-1.5 rounded-lg flex items-center gap-1.5 px-2 md:px-3 transition-all cursor-pointer ${viewMode === 'split' ? 'bg-white text-blue-600 shadow-sm font-bold' : 'text-slate-500 hover:text-slate-700'}`}
            title="Split View"
          >
            <Columns2 size={16} />
            <span className="text-[10px] uppercase tracking-wider hidden lg:inline">{t('view_both')}</span>
          </button>
        </div>

        <div className="h-6 w-[1px] bg-slate-200 mx-0.5 md:mx-1 shrink-0" />

        <button 
          onClick={onToggleSnap}
          className={`p-2 rounded-lg transition-colors flex items-center gap-1.5 px-2 md:px-3 cursor-pointer shrink-0 ${snapToGrid ? 'bg-blue-50 text-blue-600 font-bold' : 'hover:bg-slate-100 text-slate-400'}`}
          title="Toggle Grid Snapping"
        >
          <Grid size={18} />
          <span className="text-[10px] uppercase tracking-wider hidden lg:inline">{t('snap_grid')}</span>
        </button>

        <div className="h-4 w-[1px] bg-slate-200 mx-0.5 md:mx-1 shrink-0" />

        <div className="relative shrink-0">
          <button 
            onClick={() => setShowThemeOptions(!showThemeOptions)}
            className="p-2 rounded-lg transition-colors flex items-center gap-1.5 px-2 md:px-3 hover:bg-slate-100 text-slate-700 cursor-pointer"
            title={t('theme_menu_title')}
          >
            <Palette size={18} className="text-blue-500" />
            <span className="text-[10px] uppercase tracking-wider font-bold hidden lg:inline">{t('theme_btn')}</span>
            <span className="text-xs bg-slate-200 text-slate-707 px-1.5 py-0.5 rounded font-black text-[9px]">
              {getThemeDisplayName(theme)}
            </span>
          </button>
          
          {showThemeOptions && (
            <>
              <div className="fixed inset-0 z-20" onClick={() => setShowThemeOptions(false)} />
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-slate-200 py-2 z-30 overflow-hidden">
                <div className="px-3.5 pb-2 mb-1 border-b border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('theme_menu_title')}</span>
                </div>
                {THEME_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => {
                      onThemeChange(opt.id);
                      setShowThemeOptions(false);
                    }}
                    className={`w-full text-left px-3.5 py-2 hover:bg-slate-50 transition-colors flex items-start gap-3 cursor-pointer ${theme === opt.id ? 'bg-blue-50/50 text-blue-707' : 'text-slate-700'}`}
                  >
                    <span className="text-xl shrink-0 mt-0.5">{opt.icon}</span>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold truncate">
                        {opt.id === 'default' ? t('theme_default') : opt.id === 'retro-terminal' ? t('theme_retro') : opt.id === 'elegant-warm' ? t('theme_warm') : t('theme_bubble')}
                      </span>
                      <span className="text-[9px] text-slate-400 line-clamp-2 mt-0.5 leading-snug">
                        {opt.id === 'default' ? t('theme_default_desc') : opt.id === 'retro-terminal' ? t('theme_retro_desc') : opt.id === 'elegant-warm' ? t('theme_warm_desc') : t('theme_bubble_desc')}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="h-4 w-[1px] bg-slate-200 mx-0.5 md:mx-1 shrink-0" />

        <button 
          className="p-1.5 md:p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-900 transition-colors cursor-pointer shrink-0"
          title={language === 'nl' ? 'Ongedaan maken (Ctrl+Z)' : 'Undo (Ctrl+Z)'}
          onClick={onUndo}
        >
          <Undo2 size={18} />
        </button>
        <button 
          className="p-1.5 md:p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-900 transition-colors cursor-pointer shrink-0"
          title={language === 'nl' ? 'Opnieuw uitvoeren (Ctrl+Y)' : 'Redo (Ctrl+Y)'}
          onClick={onRedo}
        >
          <Redo2 size={18} />
        </button>

        <div className="h-4 w-[1px] bg-slate-200 mx-0.5 md:mx-1 shrink-0" />

        <div className="relative shrink-0">
          <button 
            className="flex items-center gap-1.5 px-2 py-1.5 hover:bg-slate-100 rounded-lg text-slate-750 transition-colors cursor-pointer"
            onClick={() => setShowExportOptions(!showExportOptions)}
          >
            <Download size={18} className="text-slate-500" />
            <span className="text-sm font-medium hidden lg:inline">{t('export_btn')}</span>
          </button>
          
          {showExportOptions && (
            <>
              <div className="fixed inset-0 z-20" onClick={() => setShowExportOptions(false)} />
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-200 py-1 z-30 overflow-hidden">
                <button onClick={() => {onExport('svg'); setShowExportOptions(false);}} className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 transition-colors font-medium cursor-pointer">{t('export_svg')}</button>
                <button onClick={() => {onExport('png'); setShowExportOptions(false);}} className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 transition-colors font-medium cursor-pointer">{t('export_png')}</button>
                <button onClick={() => {onExport('pdf'); setShowExportOptions(false);}} className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 transition-colors font-medium cursor-pointer">{t('export_pdf')}</button>
                <button onClick={() => {onExport('markdown'); setShowExportOptions(false);}} className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 transition-colors font-medium cursor-pointer">{t('export_markdown')}</button>
                <button onClick={() => {onExport('json'); setShowExportOptions(false);}} className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 transition-colors font-medium cursor-pointer">{t('export_json')}</button>
              </div>
            </>
          )}
        </div>

        <button 
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-medium text-sm shadow-md hover:shadow-lg active:scale-95 cursor-pointer shrink-0"
        >
          <Share2 size={18} />
          <span className="hidden lg:inline">{t('share_btn')}</span>
        </button>

        {/* Inline Language Selector Pill in the workspace bar */}
        <div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-200 font-mono text-[10px] tracking-tighter shrink-0 select-none">
          <button
            onClick={() => setLanguage('nl')}
            className={`px-1.5 py-1 rounded-lg font-bold transition-all ${
              language === 'nl'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-400 hover:text-slate-700'
            }`}
          >
            NL
          </button>
          <button
            onClick={() => setLanguage('en')}
            className={`px-1.5 py-1 rounded-lg font-bold transition-all ${
              language === 'en'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-400 hover:text-slate-700'
            }`}
          >
            EN
          </button>
        </div>

        {userEmail && (
          <div className="flex items-center gap-2 md:gap-3 ml-1 md:ml-2 pl-1 md:pl-2 border-l border-slate-200 flex shrink-0">
            <div className="flex flex-col text-right hidden xs:flex">
              <span className="text-[10px] font-bold text-slate-700 truncate max-w-[100px]">{userEmail}</span>
              <span className="text-[8px] font-bold text-green-500 uppercase tracking-wider">{t('cloud_active')}</span>
            </div>
            <button 
              onClick={onSignOut}
              className="px-2 py-1 border border-slate-250 text-slate-600 rounded-lg hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-all text-[10px] font-bold active:scale-95 cursor-pointer shrink-0"
            >
              {t('sign_out')}
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Toolbar;
