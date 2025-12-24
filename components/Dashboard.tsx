
import React, { useMemo, useState } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import { useGame } from '../App';
import { Shield, Target, Zap, TrendingUp, Award, RefreshCw, Layers } from 'lucide-react';

type ChartRange = 'week' | 'month' | 'year';

const Dashboard: React.FC = () => {
  const { state, triggerReset, addNotification } = useGame();
  const [range, setRange] = useState<ChartRange>('week');

  // Chart data is derived from analytics history which now updates in completeTask
  const chartData = useMemo(() => {
    const history = state.analytics.history || [];
    let sliceCount = 7;
    if (range === 'month') sliceCount = 30;
    if (range === 'year') sliceCount = 365;

    return history.slice(-sliceCount).map(h => ({
      name: h.date,
      EXP: h.expEarned,
      Quests: h.tasksCompleted,
      Efficiency: h.efficiency
    }));
  }, [state.analytics.history, range]);

  const handleManualSync = () => {
    if (confirm("Triggering a Daily Reset now will end your current quest cycle, snapshot your data, and apply penalties for unfinished tasks. Proceed?")) {
      triggerReset();
      addNotification("Manual synchronization complete. System logs updated.", "success");
    }
  };

  const dailyEfficiency = state.tasksList.length > 0 
    ? Math.round((state.completedToday.length / state.tasksList.length) * 100) 
    : 0;

  const stats = [
    { label: 'Total EXP Earned', value: state.cumulativeEXP.toLocaleString(), icon: <Shield className="text-sky-400" />, sub: 'All-time progression' },
    { label: 'Quests Conquered', value: state.totalTasksCompletedCount, icon: <Target className="text-rose-400" />, sub: 'System achievements' },
    { label: 'Today\'s Efficiency', value: `${dailyEfficiency}%`, icon: <Zap className="text-amber-400" />, sub: 'Current performance' },
    { label: 'Quest Streak', value: `${state.streak} Days`, icon: <TrendingUp className="text-emerald-400" />, sub: 'Active persistence' }
  ];

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="status-window p-8 relative overflow-hidden group border-sky-500">
        <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />
        <div className="flex justify-between items-start relative z-10">
          <div>
            <h1 className="text-4xl font-black italic uppercase tracking-tighter dark:text-white text-slate-900 neon-text mb-2">Status Window</h1>
            <p className="text-slate-500 font-medium tracking-widest uppercase text-xs">System Analytics & Field Report</p>
          </div>
          <button 
            onClick={handleManualSync}
            className="flex items-center gap-2 p-3 bg-slate-800 dark:bg-slate-800 bg-slate-100 border border-sky-500 text-sky-400 text-[10px] font-bold uppercase tracking-widest hover:bg-sky-500 hover:text-slate-900 transition-all shadow-lg"
          >
            <RefreshCw size={14} /> Force System Sync
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <div key={i} className="status-window p-6 dark:bg-slate-900/50 bg-white hover:bg-slate-900/80 transition-all group border-l-4 border-sky-500">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-slate-800 dark:bg-slate-800 bg-slate-100 group-hover:bg-slate-700 transition-colors border border-sky-900">
                {s.icon}
              </div>
              <div className="text-[10px] font-bold text-sky-500 uppercase tracking-widest italic">Live Status</div>
            </div>
            <div className="text-3xl font-black mb-1 italic tracking-tighter dark:text-white text-slate-900">{s.value}</div>
            <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">{s.label}</div>
            <div className="text-[10px] uppercase font-medium text-sky-400 mt-2 italic opacity-60">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Performance History Chart */}
      <div className="status-window p-6 dark:bg-slate-900/50 bg-white border-sky-500">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div className="flex flex-col">
            <h3 className="text-xl font-bold uppercase tracking-tight italic flex items-center gap-2 dark:text-white text-slate-900">
              <TrendingUp size={20} className="text-sky-400" /> Performance History
            </h3>
            <span className="text-[10px] uppercase font-bold text-slate-500 mt-1">Real-time Progression Tracking</span>
          </div>
          <div className="flex gap-2">
            {(['week', 'month', 'year'] as ChartRange[]).map(r => (
              <button 
                key={r} 
                onClick={() => setRange(r)}
                className={`px-4 py-1 text-[10px] font-bold uppercase tracking-widest border transition-all ${
                  range === r 
                    ? 'bg-sky-500 border-sky-500 text-slate-950 shadow-[0_0_10px_rgba(56,189,248,0.5)]' 
                    : 'border-sky-500/30 text-sky-400 hover:bg-sky-500/10'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <div className="h-[400px] w-full">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke={state.theme === 'dark' ? "#1e293b" : "#e2e8f0"} />
                <XAxis 
                  dataKey="name" 
                  stroke="#64748b" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                  dy={10}
                />
                <YAxis 
                  yId="left"
                  stroke="#38bdf8" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <YAxis 
                  yId="right"
                  orientation="right"
                  stroke="#f43f5e" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: state.theme === 'dark' ? '#0f172a' : '#ffffff', border: '2px solid #38bdf8', borderRadius: '0' }}
                  itemStyle={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase' }}
                />
                <Legend 
                  verticalAlign="top" 
                  height={36} 
                  wrapperStyle={{ textTransform: 'uppercase', fontSize: '9px', fontStyle: 'italic', fontWeight: 'bold', paddingTop: '10px' }} 
                />
                <Line 
                  yId="left"
                  name="EXP Gained"
                  type="monotone" 
                  dataKey="EXP" 
                  stroke="#38bdf8" 
                  strokeWidth={3} 
                  dot={{ fill: '#38bdf8', r: 3 }} 
                  activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }} 
                />
                <Line 
                  yId="right"
                  name="Quests Done"
                  type="monotone" 
                  dataKey="Quests" 
                  stroke="#f43f5e" 
                  strokeWidth={3} 
                  dot={{ fill: '#f43f5e', r: 3 }} 
                />
                <Line 
                  yId="left"
                  name="Efficiency %"
                  type="monotone" 
                  dataKey="Efficiency" 
                  stroke="#10b981" 
                  strokeWidth={2} 
                  strokeDasharray="4 4"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-600 uppercase tracking-widest font-black border-2 border-dashed border-slate-800 bg-slate-900/20">
              <Layers className="mb-4 opacity-20" size={64} />
              <div className="text-lg italic mb-2">The System requires more data</div>
              <div className="text-[10px] text-sky-500 opacity-60">Complete tasks to begin visualization</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
