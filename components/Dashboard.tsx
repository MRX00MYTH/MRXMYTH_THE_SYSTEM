
import React, { useMemo, useState, useEffect } from 'react';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line
} from 'recharts';
import { useGame } from '../App';
import { Shield, Target, Zap, TrendingUp, RefreshCw, Cpu, Flame, Skull, Activity, Binary } from 'lucide-react';

const Dashboard: React.FC = () => {
  const { state, syncData, dispatch } = useGame();
  const [activeFeedback, setActiveFeedback] = useState<string | null>(null);

  const COLORS = {
    exp: '#38bdf8', efficiency: '#10b981',
    strength: '#f43f5e', vitality: '#10b981', agility: '#38bdf8', intelligence: '#a855f7', sense: '#f59e0b'
  };

  useEffect(() => {
    if (state.lastEvent) {
      setActiveFeedback(state.lastEvent.type);
      const timer = setTimeout(() => {
        setActiveFeedback(null);
        dispatch({ type: 'CLEAR_LAST_EVENT' });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [state.lastEvent]);

  // Daily Efficiency calculation for live display
  const currentEfficiency = state.tasksList.length > 0 
    ? Math.round((state.tasksList.filter(t => t.completed).length / state.tasksList.length) * 100) 
    : 100;

  // Calculate current EXP earned today
  const currentExpEarned = state.tasksList.filter(t => t.completed).reduce((sum, t) => sum + t.expValue, 0);

  const chartData = useMemo(() => {
    const history = state.analytics?.history || [];
    const mappedHistory = history.map(h => ({
      name: h.date,
      EXP: h.expEarned,
      Efficiency: h.efficiency
    }));

    // If history is empty, add a baseline 'Start' point to prevent graph 'shrinking'
    if (mappedHistory.length === 0) {
      mappedHistory.push({
        name: 'Awakening',
        EXP: 0,
        Efficiency: 100
      });
    }

    // Append current real-time data point
    mappedHistory.push({
      name: 'Now',
      EXP: currentExpEarned,
      Efficiency: currentEfficiency
    });

    return mappedHistory;
  }, [state.analytics?.history, currentExpEarned, currentEfficiency]);

  const abilityData = useMemo(() => {
    return [
      { name: 'STR', value: state.stats.strength, color: COLORS.strength },
      { name: 'VIT', value: state.stats.vitality, color: COLORS.vitality },
      { name: 'AGI', value: state.stats.agility, color: COLORS.agility },
      { name: 'INT', value: state.stats.intelligence, color: COLORS.intelligence },
      { name: 'SEN', value: state.stats.sense, color: COLORS.sense },
    ].filter(s => s.value > 0);
  }, [state.stats]);

  const statsSummary = [
    { label: 'Total EXP', value: state.cumulativeEXP.toLocaleString(), icon: <Shield size={18} className="text-sky-400" />, sub: 'Total Accumulated Mana', color: 'sky' },
    { label: 'Cleared', value: state.totalTasksCompletedCount, icon: <Target size={18} className="text-rose-400" />, sub: 'Field Directives Executed', color: 'rose' },
    { label: 'Efficiency', value: `${currentEfficiency}%`, icon: <Zap size={18} className="text-amber-400" />, sub: 'Daily Output Ratio', color: 'amber' },
    { 
      label: 'Streak', 
      value: `${state.streak}D`, 
      icon: <TrendingUp size={18} className="text-emerald-400" />, 
      sub: state.streak >= 7 ? '+10% MANA BUFF' : state.streak >= 3 ? '+5% MANA BUFF' : 'Consistent Growth', 
      color: 'emerald',
      bonus: state.streak >= 7 ? '10' : state.streak >= 3 ? '5' : null
    }
  ];

  const getFeedbackClasses = () => {
    if (!activeFeedback || state.visualFeedbackStyle === 'none') return '';
    if (activeFeedback === 'SYSTEM_SYNC') return 'animate-pulse ring-2 ring-emerald-500';
    return activeFeedback === 'QUEST_FAILED' ? 'animate-shake ring-4 ring-rose-600 shadow-[0_0_50px_rgba(225,29,72,0.4)]' : 'animate-pulse ring-4 ring-sky-400 shadow-[0_0_50px_rgba(56,189,248,0.4)]';
  };

  return (
    <div className={`flex flex-col gap-8 mobile-centered transition-all duration-500 pb-12 ${getFeedbackClasses()}`}>
      {/* Header Panel */}
      <div className="status-window p-8 border-sky-500 relative bg-slate-900/60 overflow-hidden shadow-2xl">
        <div className="grid-bg opacity-10" />
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-4">
              <h1 className="text-4xl sm:text-5xl font-black italic uppercase tracking-tighter neon-text leading-none dark:text-white text-slate-900">Status Window</h1>
              {state.streak >= 3 && (
                <div className={`px-3 py-1.5 border-2 flex items-center gap-2 animate-pulse shadow-[0_0_15px_rgba(245,158,11,0.3)] ${state.streak >= 7 ? 'border-amber-500 text-amber-500 bg-amber-500/20' : 'border-sky-400 text-sky-400 bg-sky-400/20'}`}>
                  <Flame size={16} fill="currentColor" />
                  <span className="text-sm font-black italic tracking-widest">{state.streak >= 7 ? 'ULTIMATE' : 'BATTLE'} BUFF</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-4 mt-2">
               <p className="text-slate-500 font-bold uppercase text-[10px] sm:text-xs tracking-[0.3em]">Player Protocol Field Logs | Target: {state.displayName}</p>
               <div className="flex items-center gap-1 px-2 py-0.5 bg-slate-800 border border-slate-700 text-[8px] font-black uppercase text-sky-400 italic">
                 <Binary size={10} /> v3.5.3_live
               </div>
            </div>
          </div>
          <button onClick={() => syncData()} className="w-full sm:w-auto p-4 bg-slate-800 border-2 border-sky-500 text-sky-400 text-xs font-black uppercase tracking-[0.2em] hover:bg-sky-500 hover:text-slate-950 transition-all shadow-[0_0_20px_rgba(56,189,248,0.2)] active:scale-95 flex items-center justify-center gap-3 group">
            <RefreshCw size={18} className="group-active:rotate-180 transition-transform duration-500" /> Sync Dimensional Data
          </button>
        </div>
      </div>

      {/* Stats Summary Panel */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {statsSummary.map((s, i) => (
          <div key={i} className={`status-window p-6 dark:bg-slate-900/50 bg-white border-l-4 relative overflow-hidden transition-all duration-300 hover:-translate-y-1 ${s.color === 'sky' ? 'border-sky-500' : s.color === 'rose' ? 'border-rose-500' : s.color === 'amber' ? 'border-amber-500' : 'border-emerald-500 shadow-[0_5px_15px_rgba(16,185,129,0.1)]'}`}>
            {s.bonus && (
              <div className="absolute top-0 right-0 px-3 py-1 bg-amber-500 text-slate-950 font-black italic text-[10px] skew-x-12 z-10 shadow-lg">
                +{s.bonus}% BUFF
              </div>
            )}
            <div className="mb-4 p-3 bg-slate-100 dark:bg-slate-800 w-fit border border-slate-200 dark:border-slate-700">{s.icon}</div>
            <div className="text-3xl sm:text-4xl font-black italic leading-none tracking-tighter dark:text-white text-slate-900 tabular-nums">{s.value}</div>
            <div className="text-[12px] uppercase font-black text-slate-500 mt-1 tracking-widest">{s.label}</div>
            <div className={`text-[10px] uppercase font-black italic mt-1.5 ${s.bonus ? 'text-amber-500' : 'text-slate-400'}`}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Analytics Trend Area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="status-window p-8 dark:bg-slate-900/50 bg-white border-sky-500 h-[450px] flex flex-col shadow-xl">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-sm font-black uppercase tracking-[0.3em] italic flex items-center gap-3 dark:text-white text-slate-900">
              <TrendingUp size={20} className="text-sky-400" /> Evolution Trend
            </h3>
            <div className="px-3 py-1 bg-sky-500/10 border border-sky-500 text-[9px] font-black uppercase italic text-sky-400">EXP & Efficiency Analysis</div>
          </div>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke={state.theme === 'dark' ? "#334155" : "#cbd5e1"} vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={10} axisLine={false} tickLine={false} padding={{ left: 10, right: 10 }} />
                <YAxis yAxisId="left" stroke="#38bdf8" fontSize={10} axisLine={false} tickLine={false} />
                <YAxis yAxisId="right" orientation="right" stroke="#10b981" fontSize={10} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: state.theme === 'dark' ? '#0f172a' : '#ffffff', border: '2px solid #38bdf8', borderRadius: '0', fontFamily: 'Rajdhani', fontWeight: 'bold' }} 
                  itemStyle={{ fontSize: '12px' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 'bold', paddingTop: '10px' }} />
                <Line yAxisId="left" type="monotone" dataKey="EXP" stroke={COLORS.exp} strokeWidth={4} dot={{ r: 5, fill: COLORS.exp, strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 8 }} animationDuration={1000} />
                <Line yAxisId="right" type="monotone" dataKey="Efficiency" stroke={COLORS.efficiency} strokeWidth={4} dot={{ r: 5, fill: COLORS.efficiency, strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 8 }} animationDuration={1000} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="status-window p-8 dark:bg-slate-900/50 bg-white border-sky-500 h-[450px] flex flex-col shadow-xl">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-sm font-black uppercase tracking-[0.3em] italic flex items-center gap-3 dark:text-white text-slate-900">
              <Cpu size={20} className="text-sky-400" /> Ability Distribution
            </h3>
            <div className="px-3 py-1 bg-sky-500/10 border border-sky-500 text-[9px] font-black uppercase italic text-sky-400">Core Stat Resonance</div>
          </div>
          <div className="flex-1 relative">
            {abilityData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={abilityData} innerRadius={80} outerRadius={110} paddingAngle={5} dataKey="value" stroke="none">
                    {abilityData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: state.theme === 'dark' ? '#0f172a' : '#ffffff', border: '2px solid #38bdf8', borderRadius: '0', fontFamily: 'Rajdhani', fontWeight: 'bold' }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="diamond" wrapperStyle={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-600 gap-4">
                <Binary size={64} className="opacity-20 animate-pulse" />
                <span className="text-xs uppercase font-black italic tracking-widest text-slate-500">Initial Stat Check Pending...</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
