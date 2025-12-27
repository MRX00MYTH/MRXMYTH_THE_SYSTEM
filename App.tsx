
import React, { useState, useEffect, useCallback, createContext, useContext, useRef } from 'react';
import { HashRouter, Routes, Route, Link, useLocation, Navigate, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Sword, User as UserIcon, Settings, TrendingUp, Menu, LogOut, Zap, CloudLightning, AlertTriangle, Flame, DatabaseZap, Award, Star, MessageSquare, Bell, AlertOctagon, RotateCcw, ShieldCheck, Loader2, Binary, Smartphone, Activity
} from 'lucide-react';
import { AppState, Task, Notification, Rank, AnalyticsEntry, SystemEvent, User, Reminder } from './types';
import { getInitialState, RANK_MODIFIERS, TITLES } from './constants';
import { getLevelThreshold, calculateRank, generateId } from './services/gameLogic';
import { loadState, saveState, getCurrentSession, saveSession, cloudAuth } from './services/persistence';
import { GoogleGenAI } from "@google/genai";
import { systemAudio } from './services/audioService';

// Views
import Dashboard from './components/Dashboard';
import ArcBuilder from './components/ArcBuilder';
import LevelView from './components/LevelView';
import ProfileSettings from './components/ProfileSettings';
import NotificationsView from './components/NotificationsView';
import AskSystem from './components/AskSystem';
import AuthPortal from './components/AuthPortal';

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

const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [state, setState] = useState<AppState>(() => getInitialState(user?.username || ""));
  const [isInitializing, setIsInitializing] = useState(true);
  const [integrityScanProgress, setIntegrityScanProgress] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false); 
  const [activeSequence, setActiveSequence] = useState<string | null>(null);
  const [sequenceProgress, setSequenceProgress] = useState(0);
  const [sequenceData, setSequenceData] = useState<any>(null);

  const [isConfirmingPurge, setIsConfirmingPurge] = useState(false);
  const [isConfirmingReset, setIsConfirmingReset] = useState(false);

  const lastNotifiedId = useRef<string | null>(null);

  useEffect(() => {
    systemAudio.setVolume(state.soundVolume);
  }, [state.soundVolume]);

  const addNotification = useCallback((message: string, type: Notification['type'] = 'info') => {
    setState(prev => ({
      ...prev,
      notifications: [{ id: generateId(), message, type, timestamp: Date.now(), read: false }, ...prev.notifications].slice(0, 50)
    }));
  }, []);

  // Neural Link Protocol
  useEffect(() => {
    if (state.deviceNotificationsEnabled && state.notifications.length > 0) {
      const latest = state.notifications[0];
      if (latest.id !== lastNotifiedId.current && !latest.read) {
        lastNotifiedId.current = latest.id;
        if ("Notification" in window && Notification.permission === "granted") {
          try {
            new window.Notification("[THE SYSTEM]", {
              body: latest.message,
              icon: state.profilePic || undefined,
            });
          } catch (e) {
            console.error("Neural Link delivery error", e);
          }
        }
      }
    }
  }, [state.notifications, state.deviceNotificationsEnabled, state.profilePic]);

  // Global Reminder Polling
  useEffect(() => {
    if (!isLoaded) return;
    const interval = setInterval(() => {
      const now = Date.now();
      setState(prev => {
        let hasTriggered = false;
        const nextReminders = prev.reminders.map(r => {
          if (!r.triggered && r.targetTime <= now) {
            hasTriggered = true;
            addNotification(`[REMINDER]: ${r.message}`, 'system_alert');
            if (state.deviceNotificationsEnabled && "Notification" in window && Notification.permission === "granted") {
              try { new window.Notification("[REMINDER PROTOCOL]", { body: r.message }); } catch (e) {}
            }
            return { ...r, triggered: true };
          }
          return r;
        });
        return hasTriggered ? { ...prev, reminders: nextReminders } : prev;
      });
    }, 10000);
    return () => clearInterval(interval);
  }, [isLoaded, state.deviceNotificationsEnabled, addNotification]);

  const triggerSequence = useCallback((type: string, onComplete: () => void, data?: any) => {
    if (!state.animationsEnabled) { onComplete(); return; }
    setActiveSequence(type);
    setSequenceProgress(0);
    setSequenceData(data);
    
    if (type === 'PENALTY_DETECTED') systemAudio.play('penalty');
    if (type === 'quest_clear') systemAudio.play('success');

    let duration = 2000;
    if (type === 'TERMINATION') duration = 8000;
    if (type === 'PENALTY_DETECTED') duration = 3000;
    const start = Date.now();
    const timer = setInterval(() => {
      const elapsed = Date.now() - start;
      const progress = Math.min((elapsed / duration) * 100, 100);
      setSequenceProgress(progress);
      if (progress >= 100) {
        clearInterval(timer);
        setTimeout(() => { setActiveSequence(null); setSequenceData(null); onComplete(); }, 300);
      }
    }, 50);
  }, [state.animationsEnabled]);

  const applyAiPenalty = useCallback(async (failedTasks: Task[]) => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `PENALTY PROTOCOL: Hunter ${state.displayName} (Level ${state.level}) failed quests: ${failedTasks.map(t => t.name).join(', ')}. Return JSON with "message" and "penalty" object.`;
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });
      const result = JSON.parse(response.text);
      triggerSequence('PENALTY_DETECTED', () => {
        addNotification(result.message, 'error');
        setState(prev => ({
          ...prev,
          totalEXP: Math.max(0, prev.totalEXP - (result.penalty?.value || 0)),
          cumulativeEXP: Math.max(0, prev.cumulativeEXP - (result.penalty?.value || 0)),
        }));
      });
    } catch (e) {
      addNotification("Daily Quest Failed. Penalty applied.", 'error');
    }
  }, [state.displayName, state.level, addNotification, triggerSequence]);

  const triggerReset = useCallback(() => {
    setIsConfirmingReset(false);
    setState(prev => {
      const failed = prev.tasksList.filter(t => !t.completed);
      if (failed.length > 0 && prev.tasksList.length > 0) setTimeout(() => applyAiPenalty(failed), 1000);
      return {
        ...prev,
        streak: failed.length === 0 && prev.tasksList.length > 0 ? prev.streak + 1 : 0,
        tasksList: prev.tasksList.map(t => ({ 
          ...t, 
          completed: false, 
          repsDone: 0, 
          timerState: 'idle' as const, 
          remainingSeconds: t.durationMinutes * 60 
        })),
        lastResetDate: new Date().toISOString(),
      };
    });
  }, [applyAiPenalty]);

  const executeSystemPurge = useCallback(() => {
    setIsConfirmingPurge(false);
    triggerSequence('TERMINATION', () => {
      localStorage.clear();
      window.location.reload();
    });
  }, [triggerSequence]);

  const syncData = useCallback(async () => {
    if (user) {
      const loaded = await loadState(user.username);
      setState(loaded);
      systemAudio.play('sync');
      addNotification("Mana synchronized with Dimensional Vault.", "success");
    }
  }, [user, addNotification]);

  // Initialization & Boot Sequence
  useEffect(() => {
    let active = true;
    const init = async () => {
      if (!user) { setIsInitializing(false); setIsLoaded(false); return; }
      
      setIsInitializing(true);
      setIntegrityScanProgress(0);
      
      const scanTimer = setInterval(() => {
        setIntegrityScanProgress(p => {
          if (p >= 100) { clearInterval(scanTimer); return 100; }
          return p + 4; // Approx 1.25s total
        });
      }, 50);

      const loaded = await loadState(user.username);
      
      setTimeout(() => {
        if (active) {
          setState(loaded);
          setIsInitializing(false);
          setIsLoaded(true);
        }
      }, 1300);

      return () => { clearInterval(scanTimer); active = false; };
    };
    init();
  }, [user]);

  // Periodic Save Loop
  useEffect(() => {
    if (!user || !isLoaded) return;
    saveState(user.username, state);
  }, [state, user, isLoaded]);

  // Global Dispatch
  const dispatch = useCallback((action: any) => {
    setState(prev => {
      switch(action.type) {
        case 'UPDATE_PROFILE': return { ...prev, ...action.payload };
        case 'ADD_TASK': return { ...prev, tasksList: [...prev.tasksList, action.payload] };
        case 'UPDATE_TASK': return { ...prev, tasksList: prev.tasksList.map(t => t.id === action.payload.id ? { ...t, ...action.payload.updates } : t) };
        case 'DELETE_TASK': return { ...prev, tasksList: prev.tasksList.filter(t => t.id !== action.payload) };
        case 'ADD_REMINDER': return { ...prev, reminders: [...prev.reminders, action.payload] };
        case 'TRIGGER_REMINDER': return { ...prev, reminders: prev.reminders.map(r => r.id === action.payload ? { ...r, triggered: true } : r) };
        case 'CLEAR_LAST_EVENT': return { ...prev, lastEvent: null };
        case 'IMPORT_DATA': return { ...prev, ...action.payload };
        case 'SPEND_POINT':
          if (prev.statPoints <= 0) return prev;
          systemAudio.play('stat');
          return { ...prev, statPoints: prev.statPoints - 1, stats: { ...prev.stats, [action.payload]: prev.stats[action.payload as keyof AppState['stats']] + 1 } };
        default: return prev;
      }
    });
  }, []);

  const markNotificationsRead = useCallback(() => setState(p => ({ ...p, notifications: p.notifications.map(n => ({ ...n, read: true })) })), []);
  
  const completeTask = (tid: string) => {
    setState(prev => {
      const task = prev.tasksList.find(t => t.id === tid);
      if (!task || task.completed) return prev;
      const awardedExp = task.expValue;
      let newTotalExp = prev.totalEXP + awardedExp;
      let newLevel = prev.level;
      while (newTotalExp >= getLevelThreshold(newLevel)) { newTotalExp -= getLevelThreshold(newLevel); newLevel++; }
      
      triggerSequence('quest_clear', () => {}, { exp: awardedExp });
      
      return {
        ...prev,
        level: newLevel,
        totalEXP: newTotalExp,
        cumulativeEXP: prev.cumulativeEXP + awardedExp,
        totalTasksCompletedCount: prev.totalTasksCompletedCount + 1,
        tasksList: prev.tasksList.map(t => t.id === tid ? { ...t, completed: true, lastUpdated: new Date().toISOString() } : t),
        completedToday: [...prev.completedToday, tid],
        lastEvent: { id: generateId(), type: 'QUEST_CLEARED', timestamp: Date.now() }
      };
    });
  };

  const updateTaskProgress = (tid: string, p: number) => setState(prev => ({ ...prev, tasksList: prev.tasksList.map(t => t.id === tid ? { ...t, repsDone: p } : t) }));
  const toggleTimer = (tid: string) => setState(prev => ({ ...prev, tasksList: prev.tasksList.map(t => t.id === tid ? { ...t, timerState: t.timerState === 'running' ? 'idle' : 'running' } : t) }));

  if (isInitializing && user) {
    return (
      <div className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center p-8 z-[10000]">
        <div className="grid-bg opacity-20" />
        <div className="relative mb-12">
          <div className="w-32 h-32 border-2 border-sky-500 rounded-full animate-portal-spin flex items-center justify-center">
            <ShieldCheck className="text-sky-400 animate-pulse" size={48} />
          </div>
          <div className="absolute inset-0 border-t-2 border-rose-500 rounded-full animate-spin" />
        </div>
        <div className="w-full max-w-xs space-y-4 text-center">
          <h2 className="text-2xl font-black italic uppercase tracking-tighter text-white neon-text">SYSTEM INTEGRITY SCAN</h2>
          <div className="h-1 bg-slate-900 border border-sky-900 p-[1px] overflow-hidden">
             <div className="h-full bg-sky-500 transition-all duration-300" style={{ width: `${integrityScanProgress}%` }} />
          </div>
          <p className="text-[10px] font-black uppercase text-sky-500/60 tracking-[0.4em] animate-pulse">Synchronizing Dimensional Vault...</p>
        </div>
      </div>
    );
  }

  return (
    <GameContext.Provider value={{ 
      state, dispatch, addNotification, markNotificationsRead, completeTask, updateTaskProgress, toggleTimer, triggerReset, syncData, triggerSequence,
      requestPurge: () => setIsConfirmingPurge(true),
      requestReset: () => setIsConfirmingReset(true)
    }}>
      {children}
      
      {/* Centered Confirmation Modals */}
      {isConfirmingPurge && (
        <div className="fixed inset-0 z-[10000] bg-slate-950/40 backdrop-blur-xl flex items-center justify-center p-6 animate-fade-in font-['Rajdhani']">
          <div className="max-w-md w-full status-window p-8 bg-slate-900 border-rose-600 shadow-[0_0_80px_rgba(225,29,72,0.4)] animate-shake">
            <div className="flex flex-col items-center text-center gap-6">
              <AlertOctagon className="text-rose-600 animate-pulse-fast" size={60} />
              <h2 className="text-3xl font-black italic uppercase tracking-tighter text-rose-500 neon-text leading-none">CRITICAL BREACH</h2>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400 leading-relaxed">Terminating this system will permanently erase your Dimensional Footprint. All Mana will be lost.</p>
              <div className="flex flex-col w-full gap-3">
                <button onClick={executeSystemPurge} className="w-full py-4 bg-rose-600 hover:bg-rose-700 text-white font-black uppercase tracking-widest text-sm shadow-lg transition-all">Confirm Destruction</button>
                <button onClick={() => setIsConfirmingPurge(false)} className="w-full py-4 border-2 border-slate-700 text-slate-400 font-black uppercase tracking-widest text-sm hover:text-white transition-all">Abort Sequence</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isConfirmingReset && (
        <div className="fixed inset-0 z-[10000] bg-slate-950/40 backdrop-blur-xl flex items-center justify-center p-6 animate-fade-in font-['Rajdhani']">
          <div className="max-w-md w-full status-window p-8 bg-slate-900 border-emerald-500 shadow-[0_0_50px_rgba(16,185,129,0.2)]">
            <div className="flex flex-col items-center text-center gap-6">
              <RotateCcw className="text-emerald-500" size={60} />
              <h2 className="text-3xl font-black italic uppercase tracking-tighter text-emerald-500 neon-text leading-none">FORCE CYCLE RESET</h2>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Terminate the current day cycle immediately. Directives will be verified and reset.</p>
              <div className="flex flex-col w-full gap-3">
                <button onClick={triggerReset} className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase tracking-widest text-sm transition-all">Confirm Termination</button>
                <button onClick={() => setIsConfirmingReset(false)} className="w-full py-4 border-2 border-slate-700 text-slate-400 font-black uppercase tracking-widest text-sm hover:text-white transition-all">Cancel Protocol</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeSequence && (
        <div className={`fixed inset-0 z-[10001] flex flex-col items-center justify-center p-4 sm:p-8 animate-fade-in backdrop-blur-sm ${activeSequence === 'PENALTY_DETECTED' ? 'bg-rose-950/95' : 'bg-slate-950/95'}`}>
          <div className="grid-bg opacity-30" />
          <div className="relative mb-12 scale-125 sm:scale-150">
            <div className={`w-32 h-32 border-4 rounded-full animate-portal-spin flex items-center justify-center ${activeSequence === 'PENALTY_DETECTED' ? 'border-rose-500/30' : 'border-sky-500/30'}`}>
               <DatabaseZap className={`${activeSequence === 'PENALTY_DETECTED' ? 'text-rose-500' : 'text-sky-400'} animate-bounce`} size={40} />
            </div>
            {activeSequence === 'quest_clear' && sequenceData?.exp && (
              <div className="absolute -top-10 -right-10 px-6 py-2 bg-emerald-500 text-slate-950 font-black italic text-2xl animate-float shadow-2xl skew-x-12">
                + {sequenceData.exp} EXP
              </div>
            )}
          </div>
          <div className="max-w-md w-full text-center space-y-6 px-4">
            <h2 className={`text-4xl sm:text-5xl font-black italic uppercase tracking-tighter neon-text ${activeSequence === 'PENALTY_DETECTED' ? 'text-rose-400' : 'text-sky-400'}`}>{activeSequence.replace('_', ' ')}</h2>
            <div className={`relative h-2 bg-slate-900 border p-[2px] overflow-hidden ${activeSequence === 'PENALTY_DETECTED' ? 'border-rose-900' : 'border-sky-900'}`}>
              <div className={`h-full transition-all duration-300 ${activeSequence === 'PENALTY_DETECTED' ? 'bg-rose-500' : 'bg-sky-400'}`} style={{ width: `${sequenceProgress}%` }} />
            </div>
            <p className={`text-[10px] font-black uppercase tracking-[0.4em] ${activeSequence === 'PENALTY_DETECTED' ? 'text-rose-500 animate-glitch' : 'text-sky-500'}`}>{activeSequence === 'PENALTY_DETECTED' ? 'PROTOCOL BREACH - EXECUTING SANCTIONS' : 'FIELD DATA SYNCHRONIZED'}</p>
          </div>
        </div>
      )}
    </GameContext.Provider>
  );
};

const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(getCurrentSession());
  const [isLoading, setIsLoading] = useState(false);
  const login = async (u: string, p: string) => { setIsLoading(true); const h = await cloudAuth.login(u, p); if (h) { setUser(h); saveSession(h); setIsLoading(false); return true; } setIsLoading(false); return false; };
  const signup = async (u: string, p: string) => { setIsLoading(true); const s = await cloudAuth.signup(u, p); if (s) { const n: User = { id: `h-${u}`, username: u, passwordHash: p }; setUser(n); saveSession(n); setIsLoading(false); return true; } setIsLoading(false); return false; };
  const logout = () => { setUser(null); saveSession(null); };
  return <AuthContext.Provider value={{ user, login, signup, logout, isLoading }}>{children}</AuthContext.Provider>;
};

const AuthenticatedApp: React.FC = () => {
  const { user, logout } = useAuth();
  const { state } = useGame();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  if (!user) return <Navigate to="/auth" />;
  const isNotificationsPage = location.pathname === '/notifications';
  
  return (
    <div className={`min-h-screen transition-colors duration-300 font-['Rajdhani'] ${state.theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      <nav className="fixed top-0 left-0 right-0 h-16 border-b border-sky-500/30 backdrop-blur-md z-50 px-4 flex items-center justify-between bg-slate-900/80">
        <div className="flex items-center gap-3">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 lg:hidden"><Menu size={20} /></button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 border-2 border-sky-400 bg-slate-800 flex items-center justify-center overflow-hidden rounded-sm">
              {state.profilePic ? <img src={state.profilePic} alt="P" className="w-full h-full object-cover" /> : <UserIcon className="text-sky-400" size={16} />}
            </div>
            <div>
              <div className="text-[10px] font-bold text-sky-500 uppercase neon-text leading-none">[{state.selectedTitle}]</div>
              <div className="text-base font-bold leading-none mt-1">{state.displayName}</div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
           <Link to={isNotificationsPage ? '/' : '/notifications'} onClick={() => { systemAudio.play('click'); setSidebarOpen(false); }} className={`p-2 transition-colors relative ${isNotificationsPage ? 'text-sky-400 bg-sky-500/10' : 'text-slate-400 hover:text-sky-400'}`}>
             <Bell size={18} />
             {state.notifications.some(n => !n.read) && <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full animate-ping" />}
           </Link>
           <button onClick={logout} className="p-2 text-slate-400 hover:text-red-500 transition-colors"><LogOut size={18} /></button>
        </div>
      </nav>
      {sidebarOpen && <div className="fixed inset-0 bg-slate-950/60 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}
      <aside className={`fixed left-0 top-16 bottom-0 w-64 border-r border-sky-500/20 z-[45] transition-transform lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} bg-slate-900/95`}>
        <div className="p-6 flex flex-col gap-2">
          <SidebarLink to="/" icon={<LayoutDashboard size={18} />} label="Dashboard" onClick={() => setSidebarOpen(false)} />
          <SidebarLink to="/arc" icon={<Sword size={18} />} label="Quest Log" onClick={() => setSidebarOpen(false)} />
          <SidebarLink to="/level" icon={<TrendingUp size={18} />} label="Abilities" onClick={() => setSidebarOpen(false)} badge={state.statPoints > 0} />
          <SidebarLink to="/ask-system" icon={<MessageSquare size={18} />} label="Ask System" onClick={() => setSidebarOpen(false)} />
          <SidebarLink to="/settings" icon={<Settings size={18} />} label="Settings" onClick={() => setSidebarOpen(false)} />
        </div>
      </aside>
      <main className="lg:ml-64 pt-20 px-4 min-h-screen">
        <div key={location.key} className={state.animationsEnabled ? "page-transition" : ""}>
          <div className="max-w-4xl mx-auto pb-24">
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
        </div>
      </main>
    </div>
  );
};

const SidebarLink: React.FC<{ to: string; icon: React.ReactNode; label: string; onClick: () => void; badge?: boolean }> = ({ to, icon, label, onClick, badge }) => {
  const loc = useLocation();
  const active = loc.pathname === to;
  return (
    <Link to={to} onClick={onClick} className={`flex items-center p-4 font-bold uppercase tracking-widest text-xs border-l-4 transition-all relative ${active ? 'bg-sky-500/10 border-sky-500 text-sky-500 shadow-[inset_4px_0_10px_rgba(56,189,248,0.1)]' : 'border-transparent text-slate-500 hover:text-white hover:bg-slate-800/50'}`}>
      <div className="flex items-center gap-3">{icon}{label}</div>
      {badge && <span className="absolute right-4 w-2 h-2 bg-rose-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(225,29,72,0.6)] border border-white/20" />}
    </Link>
  );
};

const App: React.FC = () => <AuthProvider><AppProvider><HashRouter><Routes><Route path="/auth" element={<AuthPortal />} /><Route path="/*" element={<AuthenticatedApp />} /></Routes></HashRouter></AppProvider></AuthProvider>;
export default App;
