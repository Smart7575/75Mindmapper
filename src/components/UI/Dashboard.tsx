import React, { useState } from 'react';
import { Plus, Search, Trash2, Clock, Calendar, ChevronRight, X, Upload } from 'lucide-react';
import { MindMap } from '../../types';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../../lib/i18n';

interface Props {
  maps: MindMap[];
  onOpen: (id: string) => void;
  onCreate: (name?: string) => void;
  onDelete: (id: string) => void;
  onClose?: () => void;
  userEmail?: string | null;
  onSignOut?: () => void;
  onImportJSON: (jsonContent: string) => void;
}

const Dashboard: React.FC<Props> = ({ maps, onOpen, onCreate, onDelete, onClose, userEmail, onSignOut, onImportJSON }) => {
  const { t, language, setLanguage } = useLanguage();
  const [search, setSearch] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [newMapName, setNewMapName] = useState('');

  const filteredMaps = maps.filter(m => m.name.toLowerCase().includes(search.toLowerCase()));

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate(newMapName || t('untitled_mindmap'));
    setNewMapName('');
    setIsCreating(false);
  };

  const formatDate = (ts: number) => {
    return new Date(ts).toLocaleDateString(language === 'en' ? 'en-US' : 'nl-NL', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-5xl bg-white rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] overflow-hidden flex flex-col h-[85vh] border border-white/20"
      >
        {/* Header */}
        <div className="p-10 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white/50 backdrop-blur-sm flex-col md:flex-row gap-6 md:gap-0">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter leading-none">{t('creative_dashboard')}</h1>
            <p className="text-slate-500 text-sm mt-3 font-medium opacity-80">{t('creative_dashboard_desc')}</p>
          </div>
          <div className="flex items-center gap-4 flex-wrap md:flex-nowrap">
            {/* Language Select Pill */}
            <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200/50">
              <button
                onClick={() => setLanguage('nl')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  language === 'nl'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                NL
              </button>
              <button
                onClick={() => setLanguage('en')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  language === 'en'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                EN
              </button>
            </div>

            {userEmail && (
              <div className="flex items-center gap-3 bg-slate-50 border border-slate-150 px-4 py-2 rounded-2xl">
                <div className="flex flex-col text-right">
                  <span className="text-xs font-bold text-slate-700 max-w-[150px] truncate">{userEmail}</span>
                  <span className="text-[9px] font-black uppercase text-blue-600 tracking-wider">
                    {t('my_account')}
                  </span>
                </div>
                {onSignOut && (
                  <button 
                    onClick={onSignOut}
                    className="px-3 py-1.5 bg-white border border-slate-200 text-slate-500 hover:text-red-500 hover:bg-red-50 hover:border-red-200 transition-colors rounded-xl text-xs font-bold active:scale-95 shadow-sm cursor-pointer"
                  >
                    {t('sign_out')}
                  </button>
                )}
              </div>
            )}
            {onClose && (
              <button onClick={onClose} className="p-3 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
                 <X size={28} />
              </button>
            )}
          </div>
        </div>

        {/* Search & Actions */}
        <div className="px-10 py-8 shrink-0 flex items-center justify-between gap-6">
          <div className="relative flex-1 group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={20} />
            <input 
              type="text"
              placeholder={t('search_placeholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 pl-14 pr-6 outline-none focus:border-blue-600/20 focus:ring-4 focus:ring-blue-600/5 transition-all font-bold text-slate-700 placeholder:text-slate-300"
            />
          </div>
          
          <div className="flex items-center gap-4 shrink-0">
            <label className="flex items-center gap-3 px-6 py-4 bg-slate-150 border border-slate-200 text-slate-700 hover:bg-slate-200 hover:text-slate-900 rounded-2xl transition-all hover:scale-[1.02] active:scale-95 cursor-pointer">
              <Upload size={22} className="text-slate-500" />
              <span className="font-bold tracking-tight text-base whitespace-nowrap">{t('import_btn')}</span>
              <input
                type="file"
                accept=".json"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = (event) => {
                    const result = event.target?.result;
                    if (typeof result === 'string') {
                      onImportJSON(result);
                    }
                  };
                  reader.readAsText(file);
                  e.target.value = '';
                }}
              />
            </label>

            <button 
              onClick={() => setIsCreating(true)}
              className="flex items-center gap-3 px-8 py-4 bg-slate-900 text-white rounded-2xl hover:bg-slate-800 transition-all shadow-2xl shadow-slate-200 hover:scale-[1.02] active:scale-95 cursor-pointer"
            >
              <Plus size={24} />
              <span className="font-bold tracking-tight text-lg whitespace-nowrap">{t('new_map')}</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 pt-4">
          {filteredMaps.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-12 border-2 border-dashed border-slate-100 rounded-3xl bg-slate-50/50">
              <div className="w-20 h-20 bg-white rounded-3xl shadow-sm flex items-center justify-center mb-4">
                 <LayoutDashboard size={40} className="text-slate-200" />
              </div>
              <h3 className="text-xl font-bold text-slate-400 tracking-tight">{t('no_maps_found')}</h3>
              <p className="text-slate-400 text-sm mt-1 max-w-xs">{t('no_maps_desc')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredMaps.map(map => (
                <motion.div
                  key={map.id}
                  whileHover={{ y: -4 }}
                  className="group relative bg-white border border-slate-200 p-6 rounded-3xl hover:border-blue-200 hover:shadow-xl transition-all cursor-pointer flex flex-col justify-between"
                  onClick={() => onOpen(map.id)}
                >
                  <div className="flex justify-between items-start mb-6">
                    <div className="space-y-1">
                      <h3 className="text-xl font-bold text-slate-800 tracking-tight group-hover:text-blue-600 transition-colors">{map.name}</h3>
                      <div className="flex items-center gap-3 text-xs font-medium text-slate-400">
                        <span className="flex items-center gap-1"><Calendar size={12}/> {formatDate(map.createdAt)}</span>
                        <span className="flex items-center gap-1"><Clock size={12}/> {map.nodes.length} {t('nodes_count')}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-4 pb-2 border-t border-slate-50 pt-4">
                    <div className="flex -space-x-2">
                       {[...Array(Math.min(3, Math.max(1, Math.floor(map.nodes.length / 3))))].map((_, i) => (
                         <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center" />
                       ))}
                    </div>
                    <div className="flex gap-1">
                      <button 
                        onClick={(e) => { e.stopPropagation(); if (window.confirm(t('confirm_delete_map_prompt'))) onDelete(map.id); }}
                        className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                      <div className="p-2 text-slate-300 group-hover:text-blue-500 transition-colors">
                        <ChevronRight size={20} />
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Create Dialog */}
        <AnimatePresence>
          {isCreating && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md"
            >
              <motion.form 
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                onSubmit={handleCreateSubmit}
                className="w-full max-w-md bg-white rounded-[2rem] p-8 shadow-2xl relative"
              >
                <h3 className="text-2xl font-black text-slate-800 tracking-tighter mb-6">{t('create_new_map')}</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">{t('map_name_label')}</label>
                    <input 
                      autoFocus
                      type="text"
                      placeholder={language === 'en' ? 'e.g. Project Launch Plan' : 'Bijv. Project Launch Plan'}
                      value={newMapName}
                      onChange={(e) => setNewMapName(e.target.value)}
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 px-6 text-lg font-bold outline-none focus:border-blue-500 transition-all placeholder:text-slate-300"
                    />
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button 
                      type="button"
                      onClick={() => setIsCreating(false)}
                      className="flex-1 py-4 text-slate-500 font-bold hover:bg-slate-50 rounded-2xl transition-all"
                    >
                      {t('cancel')}
                    </button>
                    <button 
                      type="submit"
                      className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all"
                    >
                      {t('create')}
                    </button>
                  </div>
                </div>
              </motion.form>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

const LayoutDashboard = ({ size, className }: { size: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} strokeLinecap="round" strokeLinejoin="round">
    <rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/>
  </svg>
);

export default Dashboard;
