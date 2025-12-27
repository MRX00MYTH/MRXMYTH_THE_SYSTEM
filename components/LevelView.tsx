
import React, { useEffect } from 'react';
import { useGame } from '../App.tsx';
import { getLevelThreshold } from '../services/gameLogic.ts';
import { Shield, Zap, TrendingUp, User, Star, Layers, PlusCircle, Target } from 'lucide-react';
import { AppState } from '../types.ts';

const LevelView: React.FC = () => {
  const { state, dispatch } = useGame();
  
  const threshold = getLevelThreshold(state.level);
  const progress = Math.min((state.totalEXP / threshold) * 100, 100);

  const statConfig = [
    { key: 'strength', label: 'Strength', icon: <Zap size={18} />, desc: 'Physical Output' },
    { key: 'vitality', label: 'Vitality', icon: <Shield size={18} />, desc: 'Health & Recovery' },
    { key: 'agility', label: 'Agility', icon: <TrendingUp size={18} />, desc: 'Speed & Reaction' },
    { key: 'intelligence', label: 'Intelligence', icon: <Star size={18} />, desc: 'Logic & MP' },
    { key: 'sense', label: 'Sense', icon: <Layers size={18} />, desc: 'Perception' },
  ];

  const handleSpendPoint = (key: string) => {
    dispatch({ type: 'SPEND_POINT', payload: key });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in pb-20">
      {/* Profile/Rank Side Panel */}
      <div className="lg:col-span-1 space-y-6">
        <div className="status-window p-8 bg-slate-900/80 text-center relative overflow-hidden shadow-2xl">
          <div className="grid-bg opacity-10" />
          
          <div className="w-48 h-48 mx-auto border-4 border-sky-400 p-2 mb-6 relative group">
            <div className="w-full h-full bg-slate-800 flex items-center justify-center overflow-hidden">
               {state.profilePic ? (
                 <img src={state.profilePic} alt="Profile" className="w-full h-full object-cover transition-transform group-hover:scale-110" />
               ) : (
                 <User size={80} className="text-slate-700" />
               )}
            </div>
            <div className="absolute -bottom-4 -right-4 bg-sky-500 text-slate-950 px-4 py-1 font-black italic text-2xl shadow-[0_4px_10px_rgba(56,189,248,0.5)] skew-x-12">
              {state.rank}
            </div>
          </div>

          <h2 className="text-2xl font-black uppercase italic tracking-tighter neon-text text-white">{state.displayName || 'Unawakened Player'}</h2>
          <div className="text-sky-500 font-bold uppercase tracking-[0.3em] text-[10px] mt-1 italic">[{state.selectedTitle}]</div>
          
          <div className="mt-10 space-y-3">
            <div className="flex justify-between text-[10px] font-black uppercase text-slate-400 tracking-widest">
              <span>LVL {state.level} Progress</span>
              <span className="text-sky-400">{Math.floor(state.totalEXP)} / {threshold} EXP</span>
            </div>
            <div className="h-5 bg-slate-950 border border-sky-900 p-[2px] shadow-inner relative">
              <div 
                className="h-full bg-gradient-to-r from-sky-600 via-sky-400 to-sky-300 transition-all duration-700 ease-out" 
                style={{ width: `${progress}%` }} 
              />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="text-[8px] font-black text-white mix-blend-difference">{Math.round(progress)}%</span>
              </div>
            </div>
            <p className="text-[9px] uppercase font-bold text-slate-500 italic mt-2">Mana capacity increases with every cleared directive.</p>
          </div>
        </div>

        {/* Global Records */}
        <div className="status-window p-6 bg-slate-900/60 border-slate-800">
           <div className="flex items-center gap-3 mb-4 text-sky-500">
             <Target size={18} />
             <span className="text-xs font-black uppercase tracking-widest">Global Records</span>
           </div>
           <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-[10px] uppercase font-bold text-slate-500">Total Mana</span>
                <span className="text-sm font-black italic text-white">{state.cumulativeEXP.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] uppercase font-bold text-slate-500">Directives Cleared</span>
                <span className="text-sm font-black italic text-white">{state.totalTasksCompletedCount}</span>
              </div>
           </div>
        </div>
      </div>

      {/* Ability Distribution Panel */}
      <div className="lg:col-span-2 space-y-6">
        <div className="status-window p-8 bg-slate-900/80 shadow-2xl relative">
          <div className="grid-bg opacity-5" />
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-sky-500/30 pb-6 mb-8 gap-4">
            <div>
              <h3 className="text-3xl font-black uppercase italic tracking-tighter text-white neon-text">Abilities</h3>
              <p className="text-[10px] uppercase font-bold text-slate-500 tracking-[0.2em] mt-1">Manual Stat Allocation Protocol</p>
            </div>
            <div className={`bg-sky-500/10 border-2 px-6 py-3 font-black text-xs uppercase tracking-[0.2em] transition-all ${state.statPoints > 0 ? 'border-rose-500 text-rose-500 shadow-[0_0_15px_rgba(225,29,72,0.3)] animate-pulse' : 'border-sky-500 text-sky-400 shadow-[0_0_15px_rgba(56,189,248,0.2)] opacity-50'}`}>
              Stat Points: {state.statPoints}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
            {statConfig.map(s => (
              <div key={s.key} className="flex items-center justify-between group p-4 bg-slate-800/20 border border-transparent hover:border-sky-500/20 transition-all rounded-sm">
                <div className="flex items-center gap-4">
                  <div className={`p-3 bg-slate-800 border transition-all shadow-lg ${state.statPoints > 0 ? 'text-rose-500 border-rose-900 group-hover:border-rose-500 group-hover:bg-rose-600 group-hover:text-white' : 'text-sky-400 border-sky-900 group-hover:border-sky-400 group-hover:bg-sky-500 group-hover:text-slate-950'}`}>
                    {s.icon}
                  </div>
                  <div>
                    <span className="text-xs font-black uppercase tracking-[0.2em] text-white block">{s.label}</span>
                    <span className="text-[9px] uppercase font-bold text-slate-500 italic">{s.desc}</span>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <span className="text-3xl font-black italic text-white tabular-nums drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]">
                    {state.stats[s.key as keyof AppState['stats']]}
                  </span>
                  {state.statPoints > 0 ? (
                    <button 
                      onClick={() => handleSpendPoint(s.key)} 
                      className="text-rose-500 hover:text-rose-400 hover:scale-125 transition-all active:scale-90"
                      title="Invest Stat Point"
                    >
                      <PlusCircle size={28} />
                    </button>
                  ) : (
                    <PlusCircle size={28} className="text-slate-800 opacity-20" />
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 p-4 bg-slate-950 border border-sky-900/30">
            <p className="text-[10px] font-bold text-slate-500 uppercase leading-relaxed text-center tracking-widest italic">
              "The path of the Monarch is selective. Stat point acquisition has been restricted to a 50% chance per level. Every point invested is now more precious than ever."
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LevelView;
