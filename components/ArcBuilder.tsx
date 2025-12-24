
import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, 
  Trash2, 
  Play, 
  Square, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Layers, 
  ChevronDown,
  Info,
  Lock,
  Tag
} from 'lucide-react';
import { useGame } from '../App';
import { generateId } from '../services/gameLogic';
import { TaskType, Task, TaskCategory } from '../types';

const ArcBuilder: React.FC = () => {
  const { state, dispatch, completeTask, failTask, updateTaskProgress } = useGame();
  const [showAddForm, setShowAddForm] = useState(false);
  
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<TaskType>('checkbox');
  const [newCategory, setNewCategory] = useState<TaskCategory>('Personal');
  const [newReps, setNewReps] = useState(10);
  const [newDuration, setNewDuration] = useState(30);

  const categories: TaskCategory[] = ['Physical Health', 'Mental Health', 'Personal', 'Skill', 'Spiritual'];

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName) return;

    const now = new Date().toISOString();
    // Balanced XP rewards for E Rank: Checkbox=15, Reps=30, Duration=60 (Scale up to 100 later)
    const expMap = { checkbox: 15, reps: 30, duration: 60 };
    
    const newTask: Task = {
      id: generateId(),
      name: newName,
      type: newType,
      category: newCategory,
      repsTarget: newReps,
      repsDone: 0,
      durationMinutes: newDuration,
      timerState: 'idle',
      repeat: 'daily',
      expValue: expMap[newType],
      finalEXP: 0,
      completed: false,
      state: 'normal',
      lastUpdated: now,
      createdAt: now
    };

    dispatch({ type: 'ADD_TASK', payload: newTask });
    setNewName('');
    setShowAddForm(false);
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-black italic uppercase tracking-tighter neon-text mb-1 dark:text-white text-slate-900">Quest Log</h1>
          <p className="opacity-60 font-medium tracking-widest uppercase text-xs">Register your daily objectives</p>
        </div>
        <button 
          onClick={() => setShowAddForm(!showAddForm)}
          className="p-4 bg-sky-500 hover:bg-sky-400 transition-colors text-slate-950 font-black flex items-center gap-2 uppercase tracking-tighter shadow-lg"
        >
          {showAddForm ? <ChevronDown /> : <Plus />}
          Commence New Objective
        </button>
      </div>

      {showAddForm && (
        <div className="status-window p-8 dark:bg-slate-900 bg-white border-2 border-sky-400 animate-in fade-in slide-in-from-top duration-300">
          <form onSubmit={handleAddTask} className="flex flex-col gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-xs uppercase font-bold text-sky-400">Objective Name</label>
                <input 
                  type="text" 
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="e.g. 100 Pushups"
                  className="bg-slate-800 dark:bg-slate-800 bg-slate-100 border border-sky-500/30 p-3 text-slate-900 dark:text-white focus:border-sky-400 outline-none"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs uppercase font-bold text-sky-400">Task Category</label>
                <select 
                  value={newCategory}
                  onChange={e => setNewCategory(e.target.value as TaskCategory)}
                  className="bg-slate-800 dark:bg-slate-800 bg-slate-100 border border-sky-500/30 p-3 text-slate-900 dark:text-white focus:border-sky-400 outline-none uppercase font-bold"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs uppercase font-bold text-sky-400">Task Type</label>
                <div className="flex gap-2">
                  {(['checkbox', 'reps', 'duration'] as TaskType[]).map(t => (
                    <button 
                      key={t}
                      type="button"
                      onClick={() => setNewType(t)}
                      className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest border transition-all ${newType === t ? 'bg-sky-500 border-sky-500 text-slate-950 shadow-[0_0_10px_rgba(56,189,248,0.4)]' : 'border-sky-500/30 text-sky-400'}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              
              {newType === 'reps' && (
                <div className="flex flex-col gap-2 animate-in fade-in duration-300">
                  <label className="text-xs uppercase font-bold text-sky-400">Repetition Goal</label>
                  <input 
                    type="number" 
                    value={newReps}
                    onChange={e => setNewReps(parseInt(e.target.value) || 0)}
                    className="bg-slate-800 dark:bg-slate-800 bg-slate-100 border border-sky-500/30 p-3 text-slate-900 dark:text-white focus:border-sky-400 outline-none"
                  />
                </div>
              )}

              {newType === 'duration' && (
                <div className="flex flex-col gap-2 animate-in fade-in duration-300">
                  <label className="text-xs uppercase font-bold text-sky-400">Duration (Minutes)</label>
                  <input 
                    type="number" 
                    value={newDuration}
                    onChange={e => setNewDuration(parseInt(e.target.value) || 0)}
                    className="bg-slate-800 dark:bg-slate-800 bg-slate-100 border border-sky-500/30 p-3 text-slate-900 dark:text-white focus:border-sky-400 outline-none"
                  />
                </div>
              )}
            </div>
            <button type="submit" className="mt-4 p-4 bg-slate-800 dark:bg-slate-800 bg-slate-100 border border-sky-500 text-sky-400 font-bold uppercase tracking-widest hover:bg-sky-500 hover:text-slate-950 transition-all">
              Register Quest
            </button>
          </form>
        </div>
      )}

      <div className="flex flex-col gap-4">
        {state.tasksList.length === 0 ? (
          <div className="status-window p-12 text-center opacity-50">
            <Layers size={48} className="mx-auto mb-4" />
            <h2 className="text-2xl font-bold uppercase italic">No active quests detected</h2>
          </div>
        ) : (
          state.tasksList.map(task => (
            <TaskCard 
              key={task.id} 
              task={task} 
              onComplete={() => completeTask(task.id)}
              onFail={() => failTask(task.id)}
              onProgress={(v) => updateTaskProgress(task.id, v)}
              onDelete={() => dispatch({ type: 'DELETE_TASK', payload: task.id })}
            />
          ))
        )}
      </div>
    </div>
  );
};

const TaskCard: React.FC<{ task: Task; onComplete: () => void; onFail: () => void; onProgress: (v: number) => void; onDelete: () => void; }> = ({ task, onComplete, onFail, onProgress, onDelete }) => {
  const [timeLeft, setTimeLeft] = useState(task.durationMinutes * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [canDelete, setCanDelete] = useState(true);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    const checkExpiry = () => {
      const created = new Date(task.createdAt || task.lastUpdated).getTime();
      setCanDelete(Date.now() - created < 5 * 60 * 1000);
    };
    checkExpiry();
    const interval = setInterval(checkExpiry, 10000);
    return () => clearInterval(interval);
  }, [task.createdAt, task.lastUpdated]);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      timerRef.current = window.setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0) {
      setIsRunning(false);
      onComplete();
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isRunning, timeLeft, onComplete]);

  return (
    <div className={`status-window p-6 dark:bg-slate-900/80 bg-white/80 group transition-all relative overflow-hidden ${task.completed ? 'opacity-60 grayscale border-slate-500' : 'border-sky-500'}`}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
        <div className="flex items-center gap-6">
          <div className={`w-12 h-12 flex items-center justify-center border-2 ${task.completed ? 'border-emerald-500 text-emerald-500' : 'border-sky-500 text-sky-500'} transition-colors`}>
            {task.type === 'checkbox' && <CheckCircle2 size={24} />}
            {task.type === 'reps' && <Layers size={24} />}
            {task.type === 'duration' && <Clock size={24} />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className={`text-xl font-bold uppercase tracking-tight italic ${task.completed ? 'text-slate-500' : 'dark:text-white text-slate-900'}`}>{task.name}</h3>
              <span className="text-[10px] px-2 py-0.5 bg-sky-500/20 text-sky-400 border border-sky-500/30 font-bold uppercase tracking-widest">{task.category}</span>
            </div>
            <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">+{task.expValue} EXP</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {!task.completed && task.state === 'normal' && (
            <>
              {task.type === 'checkbox' && <button onClick={onComplete} className="p-3 bg-sky-500 text-slate-900 font-black uppercase text-xs shadow-md hover:scale-105 transition-transform">Complete</button>}
              {task.type === 'reps' && <div className="flex items-center gap-3"><span className="font-black italic dark:text-white text-slate-900">{task.repsDone}/{task.repsTarget}</span><button onClick={() => task.repsDone + 1 >= task.repsTarget ? onComplete() : onProgress(task.repsDone + 1)} className="px-4 py-2 bg-slate-800 border border-sky-500 text-sky-400 font-bold uppercase text-xs hover:bg-sky-500 hover:text-slate-900 transition-all">+1</button></div>}
              {task.type === 'duration' && <div className="flex items-center gap-4"><span className="text-xl font-black font-mono dark:text-white text-slate-900">{Math.floor(timeLeft/60)}:{String(timeLeft%60).padStart(2,'0')}</span>{!isRunning ? <button onClick={() => setIsRunning(true)} className="p-3 bg-emerald-500 text-slate-900 font-black uppercase text-xs">Begin</button> : <button onClick={() => { setIsRunning(false); onFail(); }} className="p-3 bg-red-500 text-slate-900 font-black uppercase text-xs">Fail</button>}</div>}
            </>
          )}
          {task.completed && <CheckCircle2 className="text-emerald-500" size={24} />}
          {canDelete && !task.completed && <button onClick={onDelete} className="p-2 text-slate-500 hover:text-red-500 transition-colors"><Trash2 size={20} /></button>}
        </div>
      </div>
    </div>
  );
};

export default ArcBuilder;
