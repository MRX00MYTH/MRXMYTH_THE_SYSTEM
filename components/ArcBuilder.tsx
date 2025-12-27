
import React, { useState, useEffect } from 'react';
import { Plus, Trash2, CheckCircle2, Clock, Layers, ChevronDown, Flame, Zap, Activity, Brain, User, Sparkles, Wind, Play, Pause, RotateCcw, Award, Binary, Lock, Edit3, X, Hourglass } from 'lucide-react';
import { useGame } from '../App.tsx';
import { generateId } from '../services/gameLogic.ts';
import { TaskType, Task, TaskCategory, TaskDifficulty } from '../types.ts';
import { systemAudio } from '../services/audioService.ts';

const ArcBuilder: React.FC = () => {
  const { state, dispatch, completeTask, updateTaskProgress, toggleTimer, addNotification } = useGame();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<TaskType>('checkbox');
  const [newDifficulty, setNewDifficulty] = useState<TaskDifficulty>('Normal');
  const [newCategory, setNewCategory] = useState<TaskCategory>('Personal');
  const [newReps, setNewReps] = useState(10);
  const [newDuration, setNewDuration] = useState(30);
  const [newBaseExp, setNewBaseExp] = useState(30);

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName) return;
    const newTask: Task = {
      id: generateId(),
      name: newName,
      type: newType,
      difficulty: newDifficulty,
      category: newCategory,
      repsTarget: newReps,
      repsDone: 0,
      durationMinutes: newDuration,
      remainingSeconds: newDuration * 60,
      timerState: 'idle',
      repeat: 'daily',
      expValue: newBaseExp,
      completed: false,
      state: 'normal',
      lastUpdated: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };
    dispatch({ type: 'ADD_TASK', payload: newTask });
    setNewName('');
    setShowAddForm(false);
  };

  const handleUpdateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask) return;

    if (editingTask.type === 'reps' && newReps < editingTask.repsTarget) {
      addNotification("RESTRICTION: Directive intensity cannot be reduced.", "error");
      return;
    }
    if (editingTask.type === 'duration' && newDuration < editingTask.durationMinutes) {
      addNotification("RESTRICTION: Protocol duration cannot be shortened.", "error");
      return;
    }

    const updates: Partial<Task> = {
      category: newCategory,
      repsTarget: newReps,
      durationMinutes: newDuration,
      remainingSeconds: editingTask.timerState === 'idle' ? newDuration * 60 : editingTask.remainingSeconds,
      lastUpdated: new Date().toISOString()
    };

    dispatch({ 
      type: 'UPDATE_TASK', 
      payload: { id: editingTask.id, updates } 
    });
    
    setEditingTask(null);
    addNotification("Quest Log synchronized. Higher stakes detected.", "success");
  };

  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setNewCategory(task.category);
    setNewReps(task.repsTarget);
    setNewDuration(task.durationMinutes);
  };

  return (
    <div className="flex flex-col gap-8 mobile-centered animate-fade-in">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl sm:text-4xl font-black italic uppercase tracking-tighter neon-text">Quest Log</h1>
          {state.streak >= 3 && (
            <div className={`px-3 py-1.5 border-2 flex items-center gap-2 animate-pulse shadow-[0_0_15px_rgba(245,158,11,0.2)] ${state.streak >= 7 ? 'border-amber-500 text-amber-500 bg-amber-500/10' : 'border-sky-500 text-sky-400 bg-sky-500/10'}`}>
               <Flame size={14} fill="currentColor" />
               <span className="text-xs font-black italic tracking-widest">{state.streak >= 7 ? '10%' : '5%'} EXP BUFF</span>
            </div>
          )}
        </div>
        <button onClick={() => setShowAddForm(!showAddForm)} className="p-4 bg-sky-500 hover:bg-sky-400 text-slate-950 font-black flex items-center gap-3 uppercase text-sm tracking-widest shadow-[0_4px_20px_rgba(56,189,248,0.4)] transition-all active:scale-95">
          {showAddForm ? <ChevronDown /> : <Plus />} Initialize Directive
        </button>
      </div>

      {showAddForm && (
        <div className="status-window p-8 bg-slate-900 border-sky-400 animate-slide-up shadow-2xl">
          <form onSubmit={handleAddTask} className="flex flex-col gap-6">
            <div className="space-y-2">
              <label className="text-xs uppercase font-black text-sky-500 tracking-widest">Protocol Codename</label>
              <input type="text" value={newName} onChange={e => setNewName(e.target.value)} placeholder="Objective Designation..." className="w-full bg-slate-800 border-2 border-sky-500/30 p-4 text-white outline-none font-bold italic placeholder:text-slate-600 focus:border-sky-400 transition-colors" />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs uppercase font-black text-sky-500 tracking-widest">Field Category</label>
                <select value={newCategory} onChange={e => setNewCategory(e.target.value as TaskCategory)} className="w-full bg-slate-800 border-2 border-sky-500/30 p-4 text-sky-400 uppercase font-black text-xs outline-none">
                  {['Physical Health', 'Mental Health', 'Personal', 'Skill', 'Spiritual'].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs uppercase font-black text-sky-500 tracking-widest">Hazard Level</label>
                <select value={newDifficulty} onChange={e => setNewDifficulty(e.target.value as TaskDifficulty)} className="w-full bg-slate-800 border-2 border-sky-500/30 p-4 text-sky-400 uppercase font-black text-xs outline-none">
                  {['Easy', 'Normal', 'Hard'].map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs uppercase font-black text-sky-500 tracking-widest">Directive Type</label>
              <div className="flex gap-3">
                {(['checkbox', 'reps', 'duration'] as TaskType[]).map(t => (
                  <button key={t} type="button" onClick={() => setNewType(t)} className={`flex-1 py-4 text-xs font-black uppercase border-2 transition-all ${newType === t ? 'bg-sky-500 text-slate-950 border-sky-500 shadow-[0_0_20px_rgba(56,189,248,0.4)]' : 'border-sky-500/30 text-sky-400 hover:bg-sky-500/10'}`}>{t}</button>
                ))}
              </div>
            </div>

            {newType === 'reps' && (
              <div className="space-y-2 animate-fade-in">
                <label className="text-xs uppercase font-black text-sky-500 tracking-widest">Iteration Threshold (Reps)</label>
                <input type="number" value={newReps} onChange={e => setNewReps(parseInt(e.target.value) || 0)} className="w-full bg-slate-800 border-2 border-sky-500/30 p-4 text-white outline-none font-black italic" />
              </div>
            )}

            {newType === 'duration' && (
              <div className="space-y-2 animate-fade-in">
                <label className="text-xs uppercase font-black text-sky-500 tracking-widest">Flow Required (Minutes)</label>
                <input type="number" value={newDuration} onChange={e => setNewDuration(parseInt(e.target.value) || 1)} className="w-full bg-slate-800 border-2 border-sky-500/30 p-4 text-white outline-none font-black italic" />
              </div>
            )}

            <button type="submit" className="p-5 bg-slate-800 border-2 border-sky-500 text-sky-400 font-black uppercase tracking-[0.3em] text-sm hover:bg-sky-500 hover:text-slate-950 transition-all shadow-[0_0_30px_rgba(56,189,248,0.2)]">Execute Protocol Integration</button>
          </form>
        </div>
      )}

      {editingTask && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-8 animate-fade-in bg-slate-950/90 backdrop-blur-sm">
          <div className="status-window max-w-lg w-full p-8 bg-slate-900 border-sky-500 shadow-2xl relative">
            <button onClick={() => setEditingTask(null)} className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors">
              <X size={24} />
            </button>
            <h2 className="text-2xl font-black uppercase italic tracking-tighter text-sky-400 mb-6 flex items-center gap-3">
              <Edit3 size={24} /> Evolution Protocol
            </h2>
            
            <form onSubmit={handleUpdateTask} className="space-y-6">
              <div className="p-4 bg-sky-500/5 border border-sky-500/20 rounded-sm">
                 <p className="text-[10px] font-bold text-sky-500/60 uppercase tracking-widest mb-1">Quest Designation</p>
                 <p className="text-lg font-black italic text-white">{editingTask.name}</p>
              </div>

              <div className="space-y-2">
                <label className="text-xs uppercase font-black text-sky-500 tracking-widest">Field Category</label>
                <select value={newCategory} onChange={e => setNewCategory(e.target.value as TaskCategory)} className="w-full bg-slate-800 border-2 border-sky-500/30 p-3 text-sky-400 uppercase font-black text-xs outline-none">
                  {['Physical Health', 'Mental Health', 'Personal', 'Skill', 'Spiritual'].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {editingTask.type === 'reps' && (
                <div className="space-y-2">
                  <label className="text-xs uppercase font-black text-sky-500 tracking-widest">Update Iterations (Min: {editingTask.repsTarget})</label>
                  <input type="number" min={editingTask.repsTarget} value={newReps} onChange={e => setNewReps(parseInt(e.target.value) || 0)} className="w-full bg-slate-800 border-2 border-sky-500/30 p-3 text-white outline-none font-black italic" />
                  <p className="text-[9px] text-slate-500 uppercase italic">Goal can only be increased as you grow stronger.</p>
                </div>
              )}

              {editingTask.type === 'duration' && (
                <div className="space-y-2">
                  <label className="text-xs uppercase font-black text-sky-500 tracking-widest">Update Flow Duration (Min: {editingTask.durationMinutes}m)</label>
                  <input type="number" min={editingTask.durationMinutes} value={newDuration} onChange={e => setNewDuration(parseInt(e.target.value) || 1)} className="w-full bg-slate-800 border-2 border-sky-500/30 p-3 text-white outline-none font-black italic" />
                  <p className="text-[9px] text-slate-500 uppercase italic">Flow threshold can only be expanded.</p>
                </div>
              )}

              <div className="flex gap-4 pt-4">
                <button type="submit" className="flex-1 py-4 bg-sky-600 text-white font-black uppercase text-xs tracking-widest hover:bg-sky-500 transition-all shadow-lg active:scale-95">Update Directive</button>
                <button type="button" onClick={() => setEditingTask(null)} className="flex-1 py-4 border-2 border-slate-700 text-slate-400 font-black uppercase text-xs tracking-widest hover:text-white hover:border-slate-500 transition-all">Abort Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-5">
        {state.tasksList.length === 0 ? (
          <div className="status-window p-16 text-center border-dashed border-sky-900/50 bg-slate-900/20">
            <Binary size={64} className="mx-auto mb-6 text-slate-800 animate-pulse" />
            <h3 className="text-2xl font-black italic uppercase tracking-widest text-slate-700">No Active field Data</h3>
            <p className="text-xs uppercase font-bold text-slate-800 mt-2">Initialize a directive to begin growth</p>
          </div>
        ) : (
          state.tasksList.map(task => (
            <TaskCard 
              key={task.id} 
              task={task} 
              streak={state.streak}
              onComplete={() => completeTask(task.id)} 
              onProgress={(p) => updateTaskProgress(task.id, p)}
              onToggleTimer={() => toggleTimer(task.id)}
              onEdit={() => openEditModal(task)}
              onDelete={() => dispatch({ type: 'DELETE_TASK', payload: task.id })} 
            />
          ))
        )}
      </div>
    </div>
  );
};

const TaskCard: React.FC<{ task: Task; streak: number; onComplete: () => void; onProgress: (p: number) => void; onToggleTimer: () => void; onEdit: () => void; onDelete: () => void; }> = ({ task, streak, onComplete, onProgress, onToggleTimer, onEdit, onDelete }) => {
  const [isLocked, setIsLocked] = useState(false);
  const [lockCountdown, setLockCountdown] = useState<string | null>(null);

  useEffect(() => {
    const updateLockState = () => {
      const lockThreshold = 5 * 60 * 1000; 
      const elapsed = Date.now() - new Date(task.createdAt).getTime();
      const remaining = Math.max(0, lockThreshold - elapsed);
      
      if (remaining === 0) {
        setIsLocked(true);
        setLockCountdown(null);
      } else {
        setIsLocked(false);
        const mins = Math.floor(remaining / 60000);
        const secs = Math.floor((remaining % 60000) / 1000);
        setLockCountdown(`${mins}:${secs.toString().padStart(2, '0')}`);
      }
    };

    updateLockState();
    const interval = setInterval(updateLockState, 1000);
    return () => clearInterval(interval);
  }, [task.createdAt]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getIcon = (cat: TaskCategory) => {
    switch (cat) {
      case 'Physical Health': return <Activity size={18} className="text-emerald-500" />;
      case 'Mental Health': return <Brain size={18} className="text-purple-500" />;
      case 'Skill': return <Sparkles size={18} className="text-amber-500" />;
      case 'Spiritual': return <Wind size={18} className="text-rose-500" />;
      default: return <User size={18} className="text-sky-500" />;
    }
  };

  const handleRepInc = () => {
    const next = task.repsDone + 1;
    systemAudio.play('click');
    if (next >= task.repsTarget) onComplete();
    else onProgress(next);
  };

  let multiplier = 1.0;
  if (streak >= 7) multiplier = 1.10;
  else if (streak >= 3) multiplier = 1.05;
  const effectiveExp = Math.floor(task.expValue * multiplier);

  // Hardened Logic: A task cannot be deleted if completed OR 5 minutes is over
  const canDelete = !task.completed && !isLocked;

  return (
    <div className={`status-window p-5 sm:p-6 dark:bg-slate-900/90 bg-white border-sky-500 transition-all ${task.completed ? 'opacity-30 grayscale blur-[1px]' : 'hover:border-sky-400 hover:shadow-[0_0_20px_rgba(56,189,248,0.15)] active:scale-[0.99]'}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-6 flex-1 overflow-hidden">
          <div className={`w-14 h-14 flex-shrink-0 flex items-center justify-center border-4 transition-all relative ${task.completed ? 'border-emerald-500 text-emerald-500' : 'border-sky-500 text-sky-400 shadow-[inset_0_0_15px_rgba(56,189,248,0.2)]'}`}>
            {task.type === 'checkbox' ? <CheckCircle2 size={30} /> : task.type === 'reps' ? <Layers size={30} /> : <Clock size={30} className={task.timerState === 'running' ? 'animate-pulse' : ''} />}
            {(isLocked || task.completed) && (
              <div className="absolute -top-3 -left-3 bg-rose-600 text-white p-1 shadow-lg border border-slate-950">
                {task.completed ? <Award size={12} /> : <Lock size={12} />}
              </div>
            )}
          </div>
          <div className="overflow-hidden">
            <div className="flex items-center gap-3 mb-1">
              {getIcon(task.category)}
              <h3 className="text-lg sm:text-xl font-black italic uppercase truncate dark:text-white text-slate-900 leading-tight tracking-tighter">{task.name}</h3>
            </div>
            <div className="flex items-center gap-4 flex-wrap">
              <span className={`text-[9px] px-2 py-1 border-2 font-black uppercase tracking-widest ${task.difficulty === 'Hard' ? 'border-rose-500 text-rose-500 bg-rose-500/5' : task.difficulty === 'Normal' ? 'border-sky-500 text-sky-400 bg-sky-500/5' : 'border-emerald-500 text-emerald-500 bg-emerald-500/5'}`}>{task.difficulty}</span>
              <span className="text-[11px] font-bold text-slate-500 italic uppercase">Goal: {task.type === 'reps' ? `${task.repsTarget} reps` : task.type === 'duration' ? `${task.durationMinutes}m flow` : 'clear directive'}</span>
              
              {!task.completed && (
                <div className={`flex items-center gap-1.5 px-2 py-0.5 border text-[9px] font-black uppercase tracking-widest italic ${isLocked ? 'border-rose-900 text-rose-500/70' : 'border-amber-500/30 text-amber-500 animate-pulse'}`}>
                  {isLocked ? (
                    <><Lock size={10} /> PROTOCOL HARDENED</>
                  ) : (
                    <><Hourglass size={10} /> LOCKING IN: {lockCountdown}</>
                  )}
                </div>
              )}

              <span className="text-[11px] font-black text-amber-500">
                +{effectiveExp} EXP {multiplier > 1.0 && <span className="text-[9px] opacity-70">(+{Math.round((multiplier - 1) * 100)}% Streak)</span>}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-end gap-5 border-t sm:border-t-0 pt-4 sm:pt-0 border-slate-800/40">
          {!task.completed ? (
            <div className="flex items-center gap-4">
              {task.type === 'checkbox' && (
                <button onClick={onComplete} className="px-8 py-3 bg-sky-500 text-slate-950 font-black text-xs uppercase italic tracking-[0.2em] shadow-[0_4px_15px_rgba(56,189,248,0.4)] hover:scale-105 active:scale-95 transition-all">CLEAR</button>
              )}
              {task.type === 'reps' && (
                <div className="flex items-center gap-4 bg-slate-800/60 p-2 pl-4 border-2 border-sky-900/40">
                  <span className="text-sm font-black dark:text-white tabular-nums tracking-widest">{task.repsDone} / {task.repsTarget}</span>
                  <button onClick={handleRepInc} className="w-10 h-10 flex items-center justify-center bg-sky-500 text-slate-950 font-black text-lg hover:bg-sky-400 transition-colors shadow-lg active:scale-90">+</button>
                </div>
              )}
              {task.type === 'duration' && (
                <div className="flex items-center gap-4">
                   <div className={`px-4 py-2 flex items-center gap-5 bg-slate-800/60 border-2 transition-all ${task.timerState === 'running' ? 'border-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.3)]' : 'border-sky-900/40'}`}>
                      <span className="text-lg font-black dark:text-white font-mono tabular-nums leading-none tracking-tighter">{formatTime(task.remainingSeconds)}</span>
                      <button onClick={onToggleTimer} className={`${task.timerState === 'running' ? 'text-rose-500' : 'text-sky-400'} hover:scale-110 active:scale-90 transition-all`}>
                        {task.timerState === 'running' ? <Pause size={22} fill="currentColor" /> : <Play size={22} fill="currentColor" />}
                      </button>
                   </div>
                </div>
              )}
            </div>
          ) : (
             <div className="flex items-center gap-3 text-emerald-500 text-xs font-black uppercase italic animate-pulse">
               <Award size={20} /> Field Directive Cleared
             </div>
          )}
          
          <div className="flex items-center gap-2">
            {!task.completed && (
              <button 
                onClick={onEdit} 
                className="p-2 text-slate-600 hover:text-sky-400 transition-colors hover:scale-110 active:scale-90"
                title="Evolution Protocol"
              >
                <Edit3 size={20} />
              </button>
            )}
            
            {canDelete ? (
              <button 
                onClick={onDelete} 
                className="p-2 text-slate-600 hover:text-rose-500 transition-colors hover:scale-110 active:scale-90"
                title="Terminate Directive"
              >
                <Trash2 size={22} />
              </button>
            ) : (
              <div className={`p-2 ${task.completed ? 'text-emerald-500' : 'text-rose-500'} opacity-40`} title={task.completed ? "QUEST CLEARED: Record synchronized." : "QUEST HARDENED: Termination forbidden."}>
                <Lock size={20} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskCard;
