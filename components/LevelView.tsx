
import React from 'react';
import { useGame } from '../App';
import { getLevelThreshold, generateId } from '../services/gameLogic';
import { Shield, Zap, TrendingUp, User, Star, Award, Layers, PlusCircle } from 'lucide-react';
import { AppState } from '../types';

const LevelView: React.FC = () => {
  const { state, dispatch } = useGame();
  const threshold = getLevelThreshold(state.level);
  const progress = (state.totalEXP / threshold) * 100;

  const statConfig = [
    { key: 'strength', label: 'Strength', icon: <Zap size={18} /> },
    { key: 'vitality', label: 'Vitality', icon: <Shield size={18} /> },
    { key: 'agility', label: 'Agility', icon: <TrendingUp size={18} /> },
    { key: 'intelligence', label: 'Intelligence', icon: <Star size={18} /> },
    { key: 'sense', label: 'Sense', icon: <Layers size={18} /> },
  ];

  const handleSpendPoint = (key: string) => {
    dispatch({ type: 'SPEND_POINT', payload: key });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-1 space-y-6">
        <div className="status-window p-8 bg-slate-900/80 text-center relative overflow-hidden">
          <div className="w-48 h-48 mx-auto border-4 border-sky-400 p-2 mb-6 relative">
            <div className="w-full h-full bg-slate-800 flex items-center justify-center overflow-hidden">
               {state.profilePic ? <img src={state.profilePic} alt="Profile" className="w-full h-full object-cover" /> : <User size={80} className="text-slate-700" />}
            </div>
            <div className="absolute -bottom-4 -right-4 bg-sky-500 text-slate-950 px-4 py-1 font-black italic text-2xl skew-x-12">{state.rank}</div>
          </div>
          <h2 className="text-2xl font-black uppercase italic tracking-tighter neon-text text-white">{state.username || 'The Player'}</h2>
          <div className="text-sky-500 font-bold uppercase tracking-[0.2em] text-xs mt-1">[{state.selectedTitle}]</div>
          <div className="mt-8 space-y-2">
            <div className="flex justify-between text-[10px] font-bold uppercase text-slate-400">
              <span>LVL {state.level} Progress</span>
              <span>{state.totalEXP} / {threshold}</span>
            </div>
            <div className="h-4 bg-slate-950 border border-sky-900 p-[2px]">
              <div className="h-full bg-gradient-to-r from-sky-600 to-sky-400 progress-bar-fill" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>
      </div>

      <div className="lg:col-span-2 space-y-6">
        <div className="status-window p-8 bg-slate-900/80">
          <div className="flex justify-between items-center border-b border-sky-500/30 pb-4 mb-8">
            <h3 className="text-2xl font-black uppercase italic tracking-tighter text-white neon-text">Abilities</h3>
            <div className="bg-sky-500/10 border border-sky-500 px-4 py-2 text-sky-400 font-bold text-xs uppercase tracking-widest">
              Available Points: {state.statPoints}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
            {statConfig.map(s => (
              <div key={s.key} className="flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-slate-800 text-sky-400 border border-sky-900 group-hover:bg-sky-500 group-hover:text-slate-950 transition-colors">{s.icon}</div>
                  <span className="text-sm font-bold uppercase tracking-widest text-slate-400">{s.label}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-2xl font-black italic text-white">{state.stats[s.key as keyof AppState['stats']]}</span>
                  {state.statPoints > 0 && (
                    <button onClick={() => handleSpendPoint(s.key)} className="text-sky-500 hover:text-sky-300 transition-colors">
                      <PlusCircle size={24} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LevelView;
