
import React, { useState, useEffect, useCallback, createContext, useContext, useRef, useMemo } from 'react';
import { HashRouter, Routes, Route, Link, useLocation, Navigate, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Sword, User as UserIcon, Settings, TrendingUp, Menu, LogOut, Zap, CloudLightning, 
  AlertTriangle, Flame, DatabaseZap, Award, Star, MessageSquare, Bell, AlertOctagon, RotateCcw, 
  ShieldCheck, Loader2, Binary, Smartphone, Activity, Shield, Target, RefreshCw, Cpu, Brain, Sparkles, Wind,
  Plus, Trash2, CheckCircle2, Clock, Layers, Play, Pause, X, Hourglass, Edit3, PlusCircle, Check, Fingerprint, Key,
  ArrowRight, History, CloudUpload, Wifi, WifiOff, Camera, ImageIcon, LinkIcon, Volume2, VolumeX, BellOff, Info,
  Send, Terminal
} from 'lucide-react';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line
} from 'recharts';
import { AppState, Task, Notification, Rank, AnalyticsEntry, SystemEvent, User, Reminder, TaskType, TaskCategory, TaskDifficulty } from './types';
import { getInitialState, RANK_MODIFIERS, TITLES } from './constants';
import { getLevelThreshold, calculateRank, generateId } from './services/gameLogic';
import { loadState, saveState, getCurrentSession, saveSession, cloudAuth } from './services/persistence';
import { GoogleGenAI, Type } from "@google/genai";
import { systemAudio } from './services/audioService';

// --- CONTEXT DEFS ---

const GameContext = createContext<{
  state: AppState;
  dispatch: (action: any) => void;
  addNotification: (msg: string, type?: Notification['type']) => void;
  markNotificationsRead: () => void;
  completeTask: (taskId: string) => void;
  updateTaskProgress: (taskId: string, progress: number) => void;
  toggleTimer: (taskId: string) => void;
  triggerReset: () => void;
  syncData: () => Promise<void>;
  triggerSequence: (type: string, onComplete: () => void, data?: any) => void;
  requestPurge: () => void;
  requestReset: () => void;
} | null>(null);

const AuthContext = createContext<{
  user: User | null;
  login: (u: string, p: string) => Promise<boolean>;
  signup: (u: string, p: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
} | null>(null);

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) throw new Error('useGame must be used within GameProvider');
  return context;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

// --- VIEWS ---

const Dashboard: React.FC = () => {
  const { state, syncData } = useGame();
  const COLORS = {
    exp: '#38bdf8', efficiency: '#10b981',
    strength: '#f43f5e', vitality: '#10b981', agility: '#38bdf8', intelligence: '#a855f7', sense: '#f59e0b'
  };

  const currentEfficiency = state.tasksList.length > 0 
    ? Math.round((state.tasksList.filter(t => t.completed).length / state.tasksList.length) * 100) 
    : 100;
  const currentExpEarned = state.tasksList.filter(t => t.completed).reduce((sum, t) => sum + t.expValue, 0);

  const chartData = useMemo(() => {
    const history = state.analytics?.history || [];
    const mapped = history.map(h => ({ name: h.date, EXP: h.expEarned, Efficiency: h.efficiency }));
    if (mapped.length === 0) mapped.push({ name: 'Awakening', EXP: 0, Efficiency: 100 });
    mapped.push({ name: 'Now', EXP: currentExpEarned, Efficiency: currentEfficiency });
    return mapped.slice(-10);
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
    { label: 'Total EXP', value: state.cumulativeEXP.toLocaleString(), icon: <Shield size={18} className="text-sky-400" />, color: 'sky' },
    { label: 'Cleared', value: state.totalTasksCompletedCount, icon: <Target size={18} className="text-rose-400" />, color: 'rose' },
    { label: 'Efficiency', value: `${currentEfficiency}%`, icon: <Zap size={18} className="text-amber-400" />, color: 'amber' },
    { label: 'Streak', value: `${state.streak}D`, icon: <TrendingUp size={18} className="text-emerald-400" />, color: 'emerald' }
  ];

  return (
    <div className="flex flex-col gap-8 animate-fade-in pb-12">
      <div className="status-window p-8 border-sky-500 relative bg-slate-900/40">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div>
            <h1 className="text-4xl sm:text-5xl font-black italic uppercase tracking-tighter neon-text text-white">Status Window</h1>
            <p className="text-slate-500 font-bold uppercase text-xs tracking-widest mt-2">Hunter Identity: {state.displayName}</p>
          </div>
          <button onClick={() => syncData()} className="p-4 bg-slate-950 border border-sky-500 text-sky-400 text-xs font-black uppercase hover:bg-sky-500 hover:text-slate-950 transition-all flex items-center gap-3">
            <RefreshCw size={18} /> SYNC VAULT
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statsSummary.map((s, i) => (
          <div key={i} className={`status-window p-6 bg-slate-950/50 border-l-4 ${s.color === 'sky' ? 'border-sky-500' : s.color === 'rose' ? 'border-rose-500' : s.color === 'amber' ? 'border-amber-500' : 'border-emerald-500'}`}>
            <div className="p-2 bg-slate-900 w-fit mb-4">{s.icon}</div>
            <div className="text-3xl font-black italic text-white tabular-nums">{s.value}</div>
            <div className="text-[10px] uppercase font-black text-slate-500 mt-1 tracking-widest">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="status-window p-8 bg-slate-950 h-[380px]">
          <h3 className="text-xs font-black uppercase italic text-sky-400 mb-6 tracking-widest">Evolution Path</h3>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="name" stroke="#64748b" fontSize={10} axisLine={false} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={10} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ backgroundColor: '#000', border: '1px solid #38bdf8', fontFamily: 'Rajdhani', fontWeight: 'bold' }} />
              <Line type="monotone" dataKey="EXP" stroke={COLORS.exp} strokeWidth={3} dot={{ r: 4, fill: COLORS.exp }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="status-window p-8 bg-slate-950 h-[380px]">
          <h3 className="text-xs font-black uppercase italic text-sky-400 mb-6 tracking-widest">Ability Distribution</h3>
          {abilityData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={abilityData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                  {abilityData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#000', border: '1px solid #38bdf8', color: '#fff' }} />
                <Legend iconType="diamond" wrapperStyle={{ fontSize: '10px', textTransform: 'uppercase' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : <div className="h-full flex items-center justify-center text-slate-700 font-bold uppercase text-[10px] tracking-widest">Awaiting Mana Data...</div>}
        </div>
      </div>
    </div>
  );
};

const ArcBuilder: React.FC = () => {
  const { state, dispatch, completeTask, updateTaskProgress, toggleTimer } = useGame();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<TaskType>('checkbox');
  const [newDifficulty, setNewDifficulty] = useState<TaskDifficulty>('Normal');
  const [newCategory, setNewCategory] = useState<TaskCategory>('Personal');
  const [newReps, setNewReps] = useState(10);
  const [newDuration, setNewDuration] = useState(30);

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName) return;
    dispatch({ type: 'ADD_TASK', payload: {
      id: generateId(), name: newName, type: newType, difficulty: newDifficulty, category: newCategory,
      repsTarget: newReps, repsDone: 0, durationMinutes: newDuration, remainingSeconds: newDuration * 60,
      timerState: 'idle', repeat: 'daily', expValue: 50, completed: false, state: 'normal',
      lastUpdated: new Date().toISOString(), createdAt: new Date().toISOString()
    }});
    setNewName(''); setShowAddForm(false);
    systemAudio.play('sync');
  };

  return (
    <div className="flex flex-col gap-8 animate-fade-in pb-20">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-black italic uppercase tracking-tighter neon-text text-white">Quest Log</h1>
        <button onClick={() => setShowAddForm(!showAddForm)} className="px-6 py-3 bg-sky-500 text-slate-950 font-black uppercase text-xs tracking-widest hover:bg-sky-400 transition-all flex items-center gap-2">
          {showAddForm ? <X size={16}/> : <Plus size={16}/>} {showAddForm ? 'Cancel' : 'Initialize Directive'}
        </button>
      </div>

      {showAddForm && (
        <div className="status-window p-8 bg-slate-900 border-sky-500 animate-slide-up shadow-2xl">
          <form onSubmit={handleAddTask} className="flex flex-col gap-6">
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-black text-sky-500 tracking-widest">Directive Codename</label>
              <input type="text" value={newName} onChange={e => setNewName(e.target.value)} placeholder="Objective Codename..." className="w-full bg-slate-950 border border-sky-500/30 p-4 text-white font-bold outline-none focus:border-sky-400 transition-all" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-black text-sky-500 tracking-widest">Field Category</label>
                <select value={newCategory} onChange={e => setNewCategory(e.target.value as any)} className="w-full bg-slate-950 border border-sky-500/30 p-3 text-sky-400 uppercase font-black text-xs outline-none">
                  {['Physical Health', 'Mental Health', 'Personal', 'Skill', 'Spiritual'].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-black text-sky-500 tracking-widest">Verification Protocol</label>
                <select value={newType} onChange={e => setNewType(e.target.value as any)} className="w-full bg-slate-950 border border-sky-500/30 p-3 text-sky-400 uppercase font-black text-xs outline-none">
                  {['checkbox', 'reps', 'duration'].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
            {newType === 'reps' && (
              <div className="space-y-2 animate-fade-in">
                <label className="text-[10px] uppercase font-black text-sky-500 tracking-widest">Iteration Threshold (Reps)</label>
                <input type="number" value={newReps} onChange={e => setNewReps(parseInt(e.target.value) || 0)} className="w-full bg-slate-950 border border-sky-500/30 p-4 text-white font-bold outline-none" />
              </div>
            )}
            {newType === 'duration' && (
              <div className="space-y-2 animate-fade-in">
                <label className="text-[10px] uppercase font-black text-sky-500 tracking-widest">Flow Required (Minutes)</label>
                <input type="number" value={newDuration} onChange={e => setNewDuration(parseInt(e.target.value) || 1)} className="w-full bg-slate-950 border border-sky-500/30 p-4 text-white font-bold outline-none" />
              </div>
            )}
            <button type="submit" className="p-4 bg-sky-600 text-white font-black uppercase tracking-widest hover:bg-sky-500 transition-all shadow-[0_4px_20px_rgba(56,189,248,0.2)]">Execute Integration</button>
          </form>
        </div>
      )}

      <div className="flex flex-col gap-4">
        {state.tasksList.length === 0 ? (
          <div className="status-window p-16 text-center border-dashed border-sky-900/40 opacity-40">
            <Terminal size={48} className="mx-auto mb-4 text-slate-700" />
            <p className="text-xs uppercase font-black tracking-widest text-slate-700 italic">Awaiting Field Directives</p>
          </div>
        ) : (
          state.tasksList.map(task => (
            <TaskCard 
              key={task.id} 
              task={task} 
              onComplete={() => completeTask(task.id)} 
              onProgress={(p) => updateTaskProgress(task.id, p)}
              onToggleTimer={() => toggleTimer(task.id)}
              onDelete={() => dispatch({ type: 'DELETE_TASK', payload: task.id })}
            />
          ))
        )}
      </div>
    </div>
  );
};

const TaskCard: React.FC<{ task: Task; onComplete: () => void; onProgress: (p: number) => void; onToggleTimer: () => void; onDelete: () => void; }> = ({ task, onComplete, onProgress, onToggleTimer, onDelete }) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleRepInc = () => {
    systemAudio.play('click');
    const next = task.repsDone + 1;
    if (next >= task.repsTarget) onComplete();
    else onProgress(next);
  };

  return (
    <div className={`status-window p-6 bg-slate-950/80 border-sky-500 flex flex-col sm:flex-row justify-between items-center gap-6 transition-all ${task.completed ? 'opacity-30 grayscale blur-[1px]' : 'hover:border-sky-400'}`}>
       <div className="flex items-center gap-6 flex-1 w-full">
         <div className="w-14 h-14 border-2 border-sky-500 flex items-center justify-center bg-slate-900/50 shadow-[inset_0_0_15px_rgba(56,189,248,0.1)]">
           {task.type === 'checkbox' ? <CheckCircle2 size={24} className="text-sky-400"/> : task.type === 'reps' ? <Layers size={24} className="text-sky-400"/> : <Clock size={24} className={task.timerState === 'running' ? 'text-rose-500 animate-pulse' : 'text-sky-400'}/>}
         </div>
         <div>
           <h3 className="text-xl font-black italic text-white uppercase tracking-tighter leading-tight">{task.name}</h3>
           <div className="flex items-center gap-3 mt-1">
             <span className="text-[10px] text-sky-500 font-bold uppercase tracking-widest">{task.category}</span>
             <span className="text-[10px] text-amber-500 font-black">+{task.expValue} EXP</span>
           </div>
         </div>
       </div>

       <div className="flex items-center gap-4 w-full sm:w-auto justify-end border-t sm:border-t-0 pt-4 sm:pt-0 border-slate-800/40">
         {!task.completed ? (
           <>
             {task.type === 'checkbox' && (
               <button onClick={onComplete} className="px-8 py-2 bg-sky-500 text-slate-950 font-black uppercase text-xs tracking-widest hover:bg-sky-400 active:scale-95 transition-all">Clear</button>
             )}
             {task.type === 'reps' && (
               <div className="flex items-center gap-3 bg-slate-900 border border-sky-900 p-1 pr-3">
                 <button onClick={handleRepInc} className="w-8 h-8 flex items-center justify-center bg-sky-500 text-slate-950 font-black">+</button>
                 <span className="text-xs font-bold text-white tabular-nums">{task.repsDone} / {task.repsTarget}</span>
               </div>
             )}
             {task.type === 'duration' && (
               <div className="flex items-center gap-3 bg-slate-900 border border-sky-900 p-1 pr-3">
                  <button onClick={onToggleTimer} className={`w-8 h-8 flex items-center justify-center ${task.timerState === 'running' ? 'bg-rose-600' : 'bg-sky-500'} text-slate-950`}>
                    {task.timerState === 'running' ? <Pause size={14}/> : <Play size={14}/>}
                  </button>
                  <span className="text-xs font-mono font-black text-white tabular-nums">{formatTime(task.remainingSeconds)}</span>
               </div>
             )}
           </>
         ) : (
           <div className="flex items-center gap-2 text-emerald-500 text-xs font-black uppercase italic"><Award size={16}/> Cleared</div>
         )}
         <button onClick={onDelete} className="p-2 text-slate-600 hover:text-rose-500 transition-colors"><Trash2 size={18}/></button>
       </div>
    </div>
  );
};

const LevelView: React.FC = () => {
  const { state, dispatch } = useGame();
  const threshold = getLevelThreshold(state.level);
  const progress = Math.min((state.totalEXP / threshold) * 100, 100);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in pb-20">
      <div className="status-window p-8 bg-slate-900/60 text-center relative overflow-hidden">
        <div className="grid-bg opacity-10" />
        <div className="w-40 h-40 mx-auto border-4 border-sky-500 mb-6 flex items-center justify-center bg-slate-950 relative">
          <UserIcon size={60} className="text-sky-500 opacity-20" />
          <div className="absolute -bottom-4 -right-4 bg-sky-500 text-slate-950 px-4 py-1 font-black italic text-xl shadow-lg skew-x-12">{state.rank}</div>
        </div>
        <h2 className="text-3xl font-black uppercase italic text-white tracking-tighter">{state.displayName}</h2>
        <div className="text-sky-400 font-bold uppercase tracking-widest text-[10px] mt-1 italic">[{state.selectedTitle}]</div>
        
        <div className="mt-10">
           <div className="flex justify-between text-[10px] font-black uppercase text-slate-500 mb-2 tracking-widest">
             <span>Level {state.level} Progress</span>
             <span className="text-sky-400">{state.totalEXP} / {threshold} EXP</span>
           </div>
           <div className="h-4 bg-slate-950 border border-sky-900 p-0.5 overflow-hidden">
             <div className="h-full bg-gradient-to-r from-sky-600 to-sky-400 transition-all duration-700" style={{ width: `${progress}%` }} />
           </div>
        </div>
      </div>

      <div className="lg:col-span-2 status-window p-8 bg-slate-950/60 relative overflow-hidden">
        <div className="grid-bg opacity-5" />
        <div className="flex justify-between items-center mb-8 border-b border-sky-500/20 pb-4">
          <h3 className="text-2xl font-black uppercase italic text-white tracking-tighter">Abilities</h3>
          <span className="px-4 py-2 bg-rose-500/10 border border-rose-500 text-rose-500 font-black text-xs uppercase tracking-widest animate-pulse shadow-[0_0_15px_rgba(244,63,94,0.1)]">Points: {state.statPoints}</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            { k: 'strength', l: 'Strength', i: <Zap size={18}/> },
            { k: 'vitality', l: 'Vitality', i: <Shield size={18}/> },
            { k: 'agility', l: 'Agility', i: <TrendingUp size={18}/> },
            { k: 'intelligence', l: 'Intelligence', i: <Brain size={18}/> },
            { k: 'sense', l: 'Sense', i: <Target size={18}/> },
          ].map(({ k, l, i }) => {
            const val = state.stats[k as keyof AppState['stats']];
            return (
              <div key={k} className="flex justify-between items-center p-5 bg-slate-900/80 border border-sky-900/40 hover:border-sky-500/30 transition-all group">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-800 text-sky-400 group-hover:text-white transition-colors">{i}</div>
                  <span className="text-xs font-black uppercase text-slate-400 group-hover:text-white">{l}</span>
                </div>
                <div className="flex items-center gap-6">
                  <span className="text-3xl font-black italic text-white tabular-nums">{val}</span>
                  {state.statPoints > 0 && (
                    <button onClick={() => dispatch({ type: 'SPEND_POINT', payload: k })} className="text-sky-400 hover:text-rose-500 transition-all hover:scale-110 active:scale-90"><PlusCircle size={28}/></button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const AskSystem: React.FC = () => {
  const { state } = useGame();
  const [messages, setMessages] = useState<{role:'user'|'system', content:string}[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const msg = input.trim(); setInput('');
    setMessages(prev => [...prev, { role: 'user', content: msg }]);
    setIsLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      const systemMsg = `You are "The System". Authorized agent for Player ${state.displayName}. 
      Status: Level ${state.level}, Rank ${state.rank}. 
      Stats: STR ${state.stats.strength}, INT ${state.stats.intelligence}, VIT ${state.stats.vitality}, AGI ${state.stats.agility}.
      TONE: Cold, robotic, efficient. Refer to Player's growth. If they slack, warn them of Penalty.`;
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `[SYSTEM_IDENTIFIER]: ${systemMsg}\n\n[USER_QUERY]: ${msg}`
      });
      setMessages(prev => [...prev, { role: 'system', content: response.text || '[LINK SEVERED]' }]);
      systemAudio.play('sync');
    } catch (e) {
      setMessages(prev => [...prev, { role: 'system', content: '[CRITICAL ERROR]: Mana Link Broken.' }]);
    } finally { setIsLoading(false); }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-14rem)] status-window bg-slate-950/90 p-6 overflow-hidden border-rose-900/50 shadow-2xl">
      <div className="flex items-center gap-3 mb-6 border-b border-rose-900/30 pb-4">
        <Terminal className="text-rose-500 animate-pulse" size={20}/>
        <h2 className="text-2xl font-black italic uppercase tracking-tighter text-white">Neural Interface</h2>
      </div>
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-6 mb-6 custom-scrollbar pr-2">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-20">
            <Terminal size={48} className="mb-4" />
            <p className="text-xs uppercase font-black tracking-widest italic">Awaiting Dimensional Query</p>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`}>
            <div className={`max-w-[85%] p-4 ${m.role === 'user' ? 'bg-sky-900/20 border border-sky-500' : 'bg-slate-900 border border-rose-900/50'} shadow-lg`}>
              <div className={`text-[8px] font-black uppercase mb-1 ${m.role === 'user' ? 'text-sky-400' : 'text-rose-500'}`}>{m.role === 'user' ? 'Player' : 'The System'}</div>
              <p className="text-sm italic text-slate-100 whitespace-pre-wrap">{m.content}</p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="p-4 bg-slate-900 border border-rose-900/50 flex items-center gap-3">
              <Loader2 className="animate-spin text-rose-500" size={16}/>
              <span className="text-[10px] font-black uppercase text-rose-500 italic">Parsing Reality...</span>
            </div>
          </div>
        )}
      </div>
      <div className="flex gap-2">
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()} className="flex-1 bg-slate-900 border border-rose-900/30 p-4 outline-none text-white font-bold italic focus:border-rose-500 transition-all placeholder:text-slate-700" placeholder="Submit Directive Query..." />
        <button onClick={handleSend} disabled={isLoading} className="px-8 bg-rose-600 hover:bg-rose-500 text-white font-black shadow-lg disabled:opacity-50 transition-all"><Send size={20} /></button>
      </div>
    </div>
  );
};

const ProfileSettings: React.FC = () => {
  const { state, dispatch, requestPurge, requestReset } = useGame();
  const [localName, setLocalName] = useState(state.displayName);

  const handleUpdate = (updates: Partial<AppState>) => {
    dispatch({ type: 'UPDATE_PROFILE', payload: updates });
  };

  const updateVolume = (v: number) => {
    systemAudio.setVolume(v);
    handleUpdate({ soundVolume: v });
  };

  return (
    <div className="flex flex-col gap-8 animate-fade-in pb-20">
      <div className="status-window p-8 bg-slate-950/80 border-sky-500 relative overflow-hidden">
        <div className="grid-bg opacity-10" />
        <h2 className="text-2xl font-black uppercase italic text-sky-400 mb-8 border-b border-sky-500/20 pb-4 tracking-tighter">Identity Protocol</h2>
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <div className="flex flex-col gap-2">
               <label className="text-[10px] uppercase font-black text-slate-500 tracking-widest">Hunter Codename</label>
               <input value={localName} onChange={e => {setLocalName(e.target.value); handleUpdate({displayName:e.target.value})}} className="bg-slate-900 border border-sky-500/30 p-4 text-white font-bold outline-none focus:border-sky-400 transition-all" />
             </div>
             <div className="flex flex-col gap-2">
               <label className="text-[10px] uppercase font-black text-slate-500 tracking-widest">Interface Title</label>
               <select value={state.selectedTitle} onChange={e => handleUpdate({selectedTitle:e.target.value})} className="bg-slate-900 border border-sky-500/30 p-4 text-white font-bold outline-none focus:border-sky-400 appearance-none">
                 {state.titlesUnlocked.map(t => <option key={t} value={t}>{t}</option>)}
               </select>
             </div>
          </div>

          <div className="p-6 bg-slate-900/50 border border-sky-900/30">
            <h3 className="text-xs font-black uppercase text-sky-400 mb-6 tracking-widest flex items-center gap-3"><Volume2 size={16}/> Audio Resonance</h3>
            <div className="space-y-6">
               <div className="flex justify-between items-center text-[10px] font-bold uppercase text-slate-500 tracking-widest">
                 <span>Master Feedback Gain</span>
                 <span className="text-sky-400">{Math.round(state.soundVolume * 100)}%</span>
               </div>
               <input type="range" min="0" max="1" step="0.01" value={state.soundVolume} onChange={e => updateVolume(parseFloat(e.target.value))} className="w-full accent-sky-500 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center justify-between p-4 bg-slate-900/50 border border-sky-900/30">
              <span className="text-xs font-black uppercase text-slate-400 tracking-widest">Visual Feedback</span>
              <button onClick={() => handleUpdate({animationsEnabled:!state.animationsEnabled})} className={`w-14 h-7 flex items-center p-1 rounded-full transition-all ${state.animationsEnabled ? 'bg-sky-500' : 'bg-slate-700'}`}>
                <div className={`w-5 h-5 bg-white rounded-full transition-transform ${state.animationsEnabled ? 'translate-x-7' : 'translate-x-0'}`} />
              </button>
            </div>
            <div className="flex items-center justify-between p-4 bg-slate-900/50 border border-sky-900/30">
              <span className="text-xs font-black uppercase text-slate-400 tracking-widest">Neural Notifications</span>
              <button onClick={() => handleUpdate({deviceNotificationsEnabled:!state.deviceNotificationsEnabled})} className={`w-14 h-7 flex items-center p-1 rounded-full transition-all ${state.deviceNotificationsEnabled ? 'bg-emerald-500' : 'bg-slate-700'}`}>
                <div className={`w-5 h-5 bg-white rounded-full transition-transform ${state.deviceNotificationsEnabled ? 'translate-x-7' : 'translate-x-0'}`} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-8">
            <button onClick={requestReset} className="p-4 border-2 border-emerald-600 text-emerald-500 font-black uppercase text-xs tracking-widest hover:bg-emerald-600 hover:text-white transition-all shadow-lg active:scale-95">Reset Cycle</button>
            <button onClick={requestPurge} className="p-4 border-2 border-rose-600 text-rose-500 font-black uppercase text-xs tracking-widest hover:bg-rose-600 hover:text-white transition-all shadow-lg active:scale-95">Purge Data</button>
          </div>
        </div>
      </div>
    </div>
  );
};

const NotificationsView: React.FC = () => {
  const { state, markNotificationsRead } = useGame();
  useEffect(() => { markNotificationsRead(); }, []);
  return (
    <div className="flex flex-col gap-8 animate-fade-in">
      <h1 className="text-4xl font-black italic uppercase tracking-tighter text-white neon-text">System Logs</h1>
      <div className="space-y-4">
        {state.notifications.length === 0 ? (
          <div className="status-window p-16 text-center opacity-40 italic uppercase text-xs tracking-widest font-black">No Messages in Cache</div>
        ) : (
          state.notifications.map(n => (
            <div key={n.id} className="status-window p-6 bg-slate-950/90 border-l-4 border-sky-500 animate-slide-up">
              <div className="flex items-center gap-4">
                 <div className="p-2 bg-slate-900 border border-sky-900/50 text-sky-400">
                    {n.type === 'error' ? <AlertTriangle size={16}/> : n.type === 'success' ? <Check size={16}/> : <Info size={16}/>}
                 </div>
                 <div>
                    <p className="font-bold uppercase text-white tracking-tight">{n.message}</p>
                    <p className="text-[10px] text-slate-500 mt-1 uppercase font-black italic">{new Date(n.timestamp).toLocaleString()}</p>
                 </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// --- AUTH PORTAL ---

const AuthPortal: React.FC = () => {
  const { login, signup, isLoading } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (username.length < 3) return setError("Codename too short.");
    const success = mode === 'login' ? await login(username, password) : await signup(username, password);
    if (success) navigate('/');
    else setError("Dimensional synchronization failed.");
  };

  return (
    <div className="min-h-screen bg-[#020202] flex items-center justify-center p-6 relative overflow-hidden font-['Rajdhani']">
      <div className="grid-bg opacity-20" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-sky-500/5 rounded-full blur-[100px] pointer-events-none" />
      
      <div className="w-full max-w-md status-window p-10 bg-slate-900/90 border-sky-500 shadow-2xl animate-fade-in">
        <div className="text-center mb-10">
          <div className="w-16 h-16 mx-auto border-2 border-sky-400 flex items-center justify-center mb-6 bg-sky-500/10 shadow-[0_0_20px_rgba(56,189,248,0.2)]">
            <ShieldCheck size={32} className="text-sky-400" />
          </div>
          <h1 className="text-4xl font-black italic uppercase tracking-tighter text-white neon-text">The System</h1>
          <p className="text-[10px] uppercase font-bold text-sky-500 tracking-[0.4em] mt-2 italic">Dimensional Synchronization Protocol</p>
        </div>

        {error && <div className="mb-6 p-4 bg-rose-950/20 border border-rose-500/50 text-rose-500 text-[10px] uppercase font-black tracking-widest text-center">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-black text-sky-500 tracking-widest">Hunter Codename</label>
            <input required value={username} onChange={e => setUsername(e.target.value)} placeholder="HUNTER_ID" className="w-full bg-slate-950 border border-sky-500/30 p-4 text-white font-bold outline-none focus:border-sky-400 transition-all" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-black text-sky-500 tracking-widest">Mana Signature</label>
            <input required type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="w-full bg-slate-950 border border-sky-500/30 p-4 text-white font-bold outline-none focus:border-sky-400 transition-all" />
          </div>
          <button disabled={isLoading} className="w-full py-5 bg-sky-600 hover:bg-sky-500 text-white font-black uppercase tracking-widest text-sm shadow-lg transition-all active:scale-95 disabled:opacity-50">
            {isLoading ? 'Synchronizing...' : mode === 'login' ? 'Establish Link' : 'Commence Awakening'}
          </button>
        </form>

        <button onClick={() => setMode(mode === 'login' ? 'signup' : 'login')} className="w-full mt-8 text-[11px] font-bold uppercase tracking-widest text-slate-500 hover:text-sky-400 transition-all italic text-center">
          {mode === 'login' ? '[ Awakening Needed? ]' : '[ Already Awakened? ]'}
        </button>
      </div>
    </div>
  );
};

// --- CORE APP WRAPPER ---

const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [state, setState] = useState<AppState>(() => getInitialState(user?.username || ""));
  const [isInitializing, setIsInitializing] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false); 

  const [isConfirmingPurge, setIsConfirmingPurge] = useState(false);
  const [isConfirmingReset, setIsConfirmingReset] = useState(false);

  useEffect(() => {
    let active = true;
    const init = async () => {
      if (!user) { setIsInitializing(false); setIsLoaded(false); return; }
      const loaded = await loadState(user.username);
      if (active) { setState(loaded); setIsInitializing(false); setIsLoaded(true); }
    };
    init();
    return () => { active = false; };
  }, [user]);

  // Global Timer Tick
  useEffect(() => {
    if (!isLoaded) return;
    const interval = setInterval(() => {
      setState(prev => {
        let changed = false;
        const nextTasks = prev.tasksList.map(t => {
          if (t.timerState === 'running' && t.remainingSeconds > 0) {
            changed = true;
            const newRem = t.remainingSeconds - 1;
            if (newRem === 0) {
              systemAudio.play('success');
              // Logic to mark complete is usually better done inside completeTask to trigger visuals, 
              // but we'll flag it here and the user will see it's 00:00.
              return { ...t, remainingSeconds: 0, timerState: 'completed' as const, completed: true };
            }
            return { ...t, remainingSeconds: newRem };
          }
          return t;
        });
        return changed ? { ...prev, tasksList: nextTasks } : prev;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isLoaded]);

  useEffect(() => { if (user && isLoaded) saveState(user.username, state); }, [state, user, isLoaded]);

  const dispatch = useCallback((action: any) => {
    setState(prev => {
      switch(action.type) {
        case 'UPDATE_PROFILE': return { ...prev, ...action.payload };
        case 'ADD_TASK': return { ...prev, tasksList: [...prev.tasksList, action.payload] };
        case 'DELETE_TASK': return { ...prev, tasksList: prev.tasksList.filter(t => t.id !== action.payload) };
        case 'UPDATE_TASK': return { ...prev, tasksList: prev.tasksList.map(t => t.id === action.payload.id ? { ...t, ...action.payload.updates } : t) };
        case 'SPEND_POINT':
          if (prev.statPoints <= 0) return prev;
          systemAudio.play('stat');
          return { ...prev, statPoints: prev.statPoints - 1, stats: { ...prev.stats, [action.payload]: prev.stats[action.payload as keyof AppState['stats']] + 1 } };
        case 'IMPORT_DATA': return { ...prev, ...action.payload };
        default: return prev;
      }
    });
  }, []);

  const completeTask = (tid: string) => {
    systemAudio.play('success');
    setState(prev => {
      const task = prev.tasksList.find(t => t.id === tid);
      if (!task || task.completed) return prev;
      const awardedExp = task.expValue;
      let newTotalExp = prev.totalEXP + awardedExp;
      let newLevel = prev.level;
      let newStatPoints = prev.statPoints;
      while (newTotalExp >= getLevelThreshold(newLevel)) { 
        newTotalExp -= getLevelThreshold(newLevel); 
        newLevel++; 
        newStatPoints += 3; // Award 3 stat points per level
        systemAudio.play('levelUp');
      }
      return {
        ...prev, 
        level: newLevel, 
        totalEXP: newTotalExp, 
        cumulativeEXP: prev.cumulativeEXP + awardedExp,
        totalTasksCompletedCount: prev.totalTasksCompletedCount + 1,
        statPoints: newStatPoints,
        rank: calculateRank(prev.cumulativeEXP + awardedExp),
        tasksList: prev.tasksList.map(t => t.id === tid ? { ...t, completed: true, timerState: 'idle' } : t),
      };
    });
  };

  const updateTaskProgress = (tid: string, p: number) => {
    setState(prev => ({ ...prev, tasksList: prev.tasksList.map(t => t.id === tid ? { ...t, repsDone: p } : t) }));
  };

  const toggleTimer = (tid: string) => {
    systemAudio.play('click');
    setState(prev => ({ 
      ...prev, 
      tasksList: prev.tasksList.map(t => t.id === tid ? { ...t, timerState: t.timerState === 'running' ? 'idle' : 'running' } : t) 
    }));
  };

  if (isInitializing && user) {
    return (
      <div className="fixed inset-0 bg-[#020202] flex flex-col items-center justify-center p-8 z-[1000]">
        <div className="grid-bg opacity-20" />
        <div className="w-32 h-32 border-2 border-sky-500 rounded-full animate-portal-spin flex items-center justify-center mb-8 relative">
           <div className="absolute inset-0 border-t-2 border-rose-500 rounded-full animate-spin" />
           <ShieldCheck size={48} className="text-sky-400 animate-pulse" />
        </div>
        <div className="max-w-xs w-full space-y-4 text-center">
          <h2 className="text-2xl font-black italic uppercase tracking-tighter text-white neon-text">SYSTEM INTEGRITY SCAN</h2>
          <div className="h-1 bg-slate-900 border border-sky-900 p-0.5 overflow-hidden">
             <div className="h-full bg-sky-500 animate-[scan_2s_linear_infinite]" style={{ width: '60%' }} />
          </div>
          <p className="text-[10px] font-black uppercase text-sky-500/60 tracking-[0.4em] animate-pulse">Syncing Dimensional Mirror...</p>
        </div>
      </div>
    );
  }

  return (
    <GameContext.Provider value={{ 
      state, dispatch, addNotification: (m, t) => {}, markNotificationsRead: () => {}, 
      completeTask, updateTaskProgress, toggleTimer, 
      triggerReset: () => { setIsConfirmingReset(false); setState(p => ({ ...p, tasksList: p.tasksList.map(t => ({...t, completed:false, repsDone: 0, timerState: 'idle', remainingSeconds: t.durationMinutes * 60})) })); }, 
      syncData: async () => { if (user) setState(await loadState(user.username)) }, 
      triggerSequence: () => {},
      requestPurge: () => setIsConfirmingPurge(true),
      requestReset: () => setIsConfirmingReset(true)
    }}>
      {children}
      {isConfirmingPurge && <div className="fixed inset-0 z-[1001] bg-black/90 flex items-center justify-center p-8 animate-fade-in"><div className="status-window p-8 bg-slate-900 border-rose-600 text-center max-w-sm w-full"><AlertOctagon className="mx-auto mb-6 text-rose-500 animate-shake" size={48}/><h2 className="text-2xl font-black text-rose-500 mb-6 uppercase tracking-tighter">TERMINATE SYSTEM?</h2><p className="text-[10px] uppercase font-bold text-slate-500 mb-8 italic">All dimensional data will be erased forever.</p><div className="flex gap-4"><button onClick={() => {localStorage.clear(); window.location.reload();}} className="flex-1 py-3 bg-rose-600 text-white font-black uppercase text-xs">Confirm</button><button onClick={() => setIsConfirmingPurge(false)} className="flex-1 py-3 border border-slate-700 text-slate-400 font-black uppercase text-xs hover:text-white transition-all">Abort</button></div></div></div>}
      {isConfirmingReset && <div className="fixed inset-0 z-[1001] bg-black/90 flex items-center justify-center p-8 animate-fade-in"><div className="status-window p-8 bg-slate-900 border-emerald-600 text-center max-w-sm w-full"><RotateCcw className="mx-auto mb-6 text-emerald-500 animate-spin" size={48}/><h2 className="text-2xl font-black text-emerald-500 mb-6 uppercase tracking-tighter">FORCE NEW CYCLE?</h2><p className="text-[10px] uppercase font-bold text-slate-500 mb-8 italic">Terminate the current day cycle immediately.</p><div className="flex gap-4"><button onClick={() => {setState(p => ({ ...p, tasksList: p.tasksList.map(t => ({...t, completed:false, repsDone: 0, timerState: 'idle', remainingSeconds: t.durationMinutes * 60})) })); setIsConfirmingReset(false);}} className="flex-1 py-3 bg-emerald-600 text-white font-black uppercase text-xs">Confirm</button><button onClick={() => setIsConfirmingReset(false)} className="flex-1 py-3 border border-slate-700 text-slate-400 font-black uppercase text-xs hover:text-white transition-all">Abort</button></div></div></div>}
    </GameContext.Provider>
  );
};

const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(getCurrentSession());
  const [isLoading, setIsLoading] = useState(false);
  const login = async (u: string, p: string) => { setIsLoading(true); const h = await cloudAuth.login(u, p); if (h) { setUser(h); saveSession(h); setIsLoading(false); return true; } setIsLoading(false); return false; };
  const signup = async (u: string, p: string) => { setIsLoading(true); const s = await cloudAuth.signup(u, p); if (s) { const n: User = { id: `h-${u}`, username: u, passwordHash: p }; setUser(n); saveSession(n); setIsLoading(false); return true; } setIsLoading(false); return false; };
  return <AuthContext.Provider value={{ user, login, signup, logout: () => { setUser(null); saveSession(null); }, isLoading }}>{children}</AuthContext.Provider>;
};

const AuthenticatedApp: React.FC = () => {
  const { user, logout } = useAuth();
  const { state } = useGame();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  if (!user) return <Navigate to="/auth" />;
  
  return (
    <div className="min-h-screen bg-[#020202] text-slate-100 font-['Rajdhani']">
      <nav className="fixed top-0 left-0 right-0 h-16 border-b border-sky-500/20 backdrop-blur-md z-40 px-4 flex items-center justify-between bg-black/60 shadow-lg">
        <div className="flex items-center gap-3">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 lg:hidden text-sky-400 hover:text-white transition-colors"><Menu size={24} /></button>
          <div onClick={() => { navigate('/settings'); setSidebarOpen(false); }} className="flex items-center gap-4 cursor-pointer group">
            <div className="w-10 h-10 border border-sky-500/40 bg-slate-900 flex items-center justify-center shadow-inner group-hover:border-sky-400 transition-all">
              <UserIcon size={18} className="text-sky-400 group-hover:scale-110 transition-transform" />
            </div>
            <div>
              <div className="text-[8px] font-black uppercase text-sky-500 tracking-[0.2em] italic leading-none mb-1 group-hover:text-sky-400">[{state.selectedTitle}]</div>
              <div className="text-base font-black text-white uppercase tracking-tighter leading-none group-hover:text-sky-100">{state.displayName}</div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
           <button onClick={() => navigate('/notifications')} className="p-2 text-slate-500 hover:text-sky-400 transition-all relative">
             <Bell size={20}/>
             {state.notifications.some(n => !n.read) && <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full animate-ping shadow-[0_0_10px_rgba(244,63,94,0.5)]" />}
           </button>
           <button onClick={() => { systemAudio.play('click'); logout(); }} className="p-2 text-slate-500 hover:text-rose-500 transition-all active:scale-90"><LogOut size={22} /></button>
        </div>
      </nav>

      {sidebarOpen && <div className="fixed inset-0 bg-black/80 z-30 lg:hidden animate-fade-in" onClick={() => setSidebarOpen(false)} />}
      
      <aside className={`fixed left-0 top-16 bottom-0 w-64 border-r border-sky-500/10 z-[35] transition-transform lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} bg-[#050505] shadow-2xl`}>
        <div className="p-6 flex flex-col gap-2">
          <SidebarLink to="/" icon={<LayoutDashboard size={20} />} label="Dashboard" active={location.pathname === '/'} onClick={() => setSidebarOpen(false)} />
          <SidebarLink to="/arc" icon={<Sword size={20} />} label="Quest Log" active={location.pathname === '/arc'} onClick={() => setSidebarOpen(false)} />
          <SidebarLink to="/level" icon={<TrendingUp size={20} />} label="Abilities" active={location.pathname === '/level'} onClick={() => setSidebarOpen(false)} badge={state.statPoints > 0} />
          <SidebarLink to="/ask-system" icon={<MessageSquare size={20} />} label="Ask System" active={location.pathname === '/ask-system'} onClick={() => setSidebarOpen(false)} />
          <SidebarLink to="/settings" icon={<Settings size={20} />} label="Settings" active={location.pathname === '/settings'} onClick={() => setSidebarOpen(false)} />
        </div>

        <div className="absolute bottom-8 left-6 right-6 p-4 bg-slate-900/40 border border-sky-900/30 rounded-sm">
           <div className="flex justify-between items-center mb-2">
             <span className="text-[8px] font-black uppercase text-slate-500 tracking-[0.2em] italic">Mana Integrity</span>
             <span className="text-[8px] font-black uppercase text-emerald-500 tracking-[0.2em] italic animate-pulse">Stable</span>
           </div>
           <div className="h-1 bg-slate-950 overflow-hidden relative">
             <div className="h-full bg-sky-500 transition-all duration-1000" style={{ width: '92%' }} />
           </div>
        </div>
      </aside>

      <main className="lg:ml-64 pt-20 px-4 min-h-screen relative overflow-hidden bg-[#020202]">
        <div className="max-w-4xl mx-auto pb-24 page-transition relative z-10">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/arc" element={<ArcBuilder />} />
            <Route path="/level" element={<LevelView />} />
            <Route path="/ask-system" element={<AskSystem />} />
            <Route path="/notifications" element={<NotificationsView />} />
            <Route path="/settings" element={<ProfileSettings />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
      </main>
    </div>
  );
};

const SidebarLink: React.FC<{ to: string; icon: React.ReactNode; label: string; active: boolean; onClick: () => void; badge?: boolean }> = ({ to, icon, label, active, onClick, badge }) => (
  <Link to={to} onClick={() => { systemAudio.play('click'); onClick(); }} className={`flex items-center gap-4 p-4 font-black uppercase text-xs tracking-widest border-l-2 transition-all relative group ${active ? 'text-sky-400 bg-sky-500/5 border-sky-500 shadow-[inset_4px_0_10px_rgba(56,189,248,0.1)]' : 'text-slate-500 border-transparent hover:text-white hover:bg-slate-900/50'}`}>
    <span className="group-hover:scale-110 transition-transform">{icon}</span>
    {label}
    {badge && <span className="absolute right-4 w-2 h-2 bg-rose-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(244,63,94,0.6)]" />}
  </Link>
);

const App: React.FC = () => (
  <AuthProvider>
    <AppProvider>
      <HashRouter>
        <Routes>
          <Route path="/auth" element={<AuthPortal />} />
          <Route path="/*" element={<AuthenticatedApp />} />
        </Routes>
      </HashRouter>
    </AppProvider>
  </AuthProvider>
);

export default App;
