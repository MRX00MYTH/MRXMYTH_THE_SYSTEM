
import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { HashRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Sword, 
  User, 
  Settings, 
  TrendingUp,
  Menu,
  X,
  Bell
} from 'lucide-react';
import { AppState, Task, Notification, Rank, TaskCategory } from './types';
import { INITIAL_STATE, RANK_MODIFIERS, TITLES } from './constants';
import { getLevelThreshold, calculateRank, generateId } from './services/gameLogic';

// Views
import Dashboard from './components/Dashboard';
import ArcBuilder from './components/ArcBuilder';
import LevelView from './components/LevelView';
import ProfileSettings from './components/ProfileSettings';
import NotificationsView from './components/NotificationsView';

const GameContext = createContext<{
  state: AppState;
  dispatch: (action: any) => void;
  addNotification: (msg: string, type?: Notification['type']) => void;
  completeTask: (taskId: string) => void;
  failTask: (taskId: string) => void;
  updateTaskProgress: (taskId: string, progress: number) => void;
  triggerReset: () => void;
  markNotificationsRead: () => void;
} | null>(null);

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) throw new Error('useGame must be used within GameProvider');
  return context;
};

const CATEGORY_STAT_MAP: Record<TaskCategory, keyof AppState['stats']> = {
  'Physical Health': 'strength',
  'Mental Health': 'intelligence',
  'Personal': 'agility',
  'Skill': 'sense',
  'Spiritual': 'vitality'
};

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem('system_data');
    return saved ? JSON.parse(saved) : INITIAL_STATE;
  });

  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Persistence & Theme
  useEffect(() => {
    localStorage.setItem('system_data', JSON.stringify(state));
    if (state.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [state.theme, state]);

  const addNotification = useCallback((message: string, type: Notification['type'] = 'info') => {
    const newNotif: Notification = {
      id: generateId(),
      message,
      type,
      timestamp: Date.now(),
      read: false
    };
    setState(prev => ({
      ...prev,
      notifications: [newNotif, ...prev.notifications].slice(0, 100)
    }));
  }, []);

  const markNotificationsRead = useCallback(() => {
    setState(prev => ({
      ...prev,
      notifications: prev.notifications.map(n => ({ ...n, read: true }))
    }));
  }, []);

  const handleDailyReset = useCallback(() => {
    setState(prev => {
      const incomplete = prev.tasksList.filter(t => !t.completed && t.repeat === 'daily');
      const lostExp = Math.round(incomplete.reduce((sum, t) => sum + (t.expValue * RANK_MODIFIERS[prev.rank] * 0.5), 0));
      
      const allDone = prev.tasksList.length > 0 && incomplete.length === 0;
      const newStreak = allDone ? prev.streak + 1 : 0;

      const newState = {
        ...prev,
        totalEXP: Math.max(0, prev.totalEXP - lostExp),
        streak: newStreak,
        lastResetDate: new Date().toDateString(),
        missedToday: incomplete.map(t => t.id),
        completedToday: [],
        tasksList: prev.tasksList.map(t => ({
          ...t,
          completed: false,
          repsDone: 0,
          timerState: 'idle' as const,
          state: 'normal' as const
        }))
      };

      if (lostExp > 0) {
        addNotification(`Daily reset: Missed ${incomplete.length} quests. Lost ${lostExp} EXP.`, 'warning');
      }
      if (allDone) {
        addNotification(`Daily perfect! Streak: ${newStreak} days.`, 'success');
      }

      return newState;
    });
  }, [addNotification]);

  // Clock
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const nowStr = now.toDateString();
      const h = now.getHours().toString().padStart(2, '0');
      const m = now.getMinutes().toString().padStart(2, '0');
      const currentTime = `${h}:${m}`;

      if (state.lastResetDate !== nowStr && currentTime >= state.resetTime) {
        handleDailyReset();
      }

      if (state.terminationCountdown !== null) {
        if (state.terminationCountdown <= 0) {
          localStorage.removeItem('system_data');
          window.location.reload();
        } else {
          setState(prev => ({ ...prev, terminationCountdown: (prev.terminationCountdown || 60) - 1 }));
        }
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [state.lastResetDate, state.resetTime, state.terminationCountdown, handleDailyReset]);

  const levelUp = useCallback((currentExp: number, level: number, cumulative: number) => {
    let nextExp = currentExp;
    let nextLevel = level;
    let threshold = getLevelThreshold(nextLevel);
    let upgraded = false;
    let awardedPoints = 0;

    while (nextExp >= threshold) {
      nextExp -= threshold;
      nextLevel++;
      threshold = getLevelThreshold(nextLevel);
      upgraded = true;
      awardedPoints += 5;
    }

    if (upgraded) {
      addNotification(`LEVEL UP! You are now level ${nextLevel}. +${awardedPoints} Stat Points!`, 'level');
    }

    const nextRank = calculateRank(cumulative);
    return { nextExp, nextLevel, nextRank, awardedPoints };
  }, [addNotification]);

  const completeTask = useCallback((taskId: string) => {
    setState(prev => {
      const task = prev.tasksList.find(t => t.id === taskId);
      if (!task || task.completed) return prev;

      const streakBonus = prev.streak >= 7 ? 1.25 : (prev.streak >= 3 ? 1.1 : 1);
      const earnedExp = Math.round(task.expValue * RANK_MODIFIERS[prev.rank] * streakBonus);

      const cumulative = prev.cumulativeEXP + earnedExp;
      const { nextExp, nextLevel, nextRank, awardedPoints } = levelUp(prev.totalEXP + earnedExp, prev.level, cumulative);

      const updatedTasks = prev.tasksList.map(t => 
        t.id === taskId ? { ...t, completed: true, state: 'success' as const } : t
      );

      // Stat Increment Logic
      const targetStat = CATEGORY_STAT_MAP[task.category];
      const updatedStats = { ...prev.stats, [targetStat]: prev.stats[targetStat] + 1 };

      const todayStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const currentHistory = [...prev.analytics.history];
      const todayIndex = currentHistory.findIndex(h => h.date === todayStr);
      
      const newCompletedToday = [...prev.completedToday, taskId];
      const dailyEff = updatedTasks.length > 0 ? Math.round((newCompletedToday.length / updatedTasks.length) * 100) : 100;

      if (todayIndex > -1) {
        currentHistory[todayIndex] = {
          ...currentHistory[todayIndex],
          expEarned: currentHistory[todayIndex].expEarned + earnedExp,
          tasksCompleted: newCompletedToday.length,
          efficiency: dailyEff
        };
      } else {
        currentHistory.push({
          date: todayStr,
          expEarned: earnedExp,
          tasksCompleted: 1,
          efficiency: dailyEff
        });
      }

      const newState = {
        ...prev,
        totalEXP: nextExp,
        level: nextLevel,
        rank: nextRank,
        cumulativeEXP: cumulative,
        tasksList: updatedTasks,
        completedToday: newCompletedToday,
        totalTasksCompletedCount: prev.totalTasksCompletedCount + 1,
        statPoints: prev.statPoints + awardedPoints,
        stats: updatedStats,
        analytics: { history: currentHistory.slice(-365) }
      };

      addNotification(`Task complete! +${earnedExp} EXP. ${targetStat.toUpperCase()} improved!`, 'success');
      return newState;
    });
  }, [levelUp, addNotification]);

  const failTask = useCallback((taskId: string) => {
    setState(prev => {
      const task = prev.tasksList.find(t => t.id === taskId);
      if (!task) return prev;
      const lostExp = Math.round(task.expValue * RANK_MODIFIERS[prev.rank] * 0.5);
      addNotification(`Quest failed. Lost ${lostExp} EXP.`, 'error');
      return {
        ...prev,
        totalEXP: Math.max(0, prev.totalEXP - lostExp),
        tasksList: prev.tasksList.map(t => t.id === taskId ? { ...t, state: 'failed' as const, completed: false } : t)
      };
    });
  }, [addNotification]);

  const updateTaskProgress = useCallback((taskId: string, progress: number) => {
    setState(prev => ({
      ...prev,
      tasksList: prev.tasksList.map(t => t.id === taskId ? { ...t, repsDone: progress } : t)
    }));
  }, []);

  const dispatch = useCallback((action: any) => {
    setState(prev => {
      switch(action.type) {
        case 'UPDATE_PROFILE': 
          return { ...prev, ...action.payload };
        case 'ADD_TASK':
          return { ...prev, tasksList: [...prev.tasksList, action.payload] };
        case 'DELETE_TASK':
          return { ...prev, tasksList: prev.tasksList.filter(t => t.id !== action.payload) };
        case 'IMPORT_DATA':
          return { ...action.payload };
        case 'START_TERMINATION':
          return { ...prev, terminationCountdown: 60 };
        case 'CANCEL_TERMINATION':
          return { ...prev, terminationCountdown: null };
        case 'SPEND_POINT':
          const stat = action.payload as keyof AppState['stats'];
          if (prev.statPoints <= 0) return prev;
          return {
            ...prev,
            statPoints: prev.statPoints - 1,
            stats: { ...prev.stats, [stat]: prev.stats[stat] + 1 }
          };
        default: return prev;
      }
    });
  }, []);

  const unreadCount = state.notifications.filter(n => !n.read).length;

  return (
    <GameContext.Provider value={{ state, dispatch, addNotification, completeTask, failTask, updateTaskProgress, triggerReset: handleDailyReset, markNotificationsRead }}>
      <HashRouter>
        <div className={`min-h-screen transition-colors duration-300 ${state.theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
          <nav className="fixed top-0 left-0 right-0 h-16 border-b border-sky-500/30 bg-slate-900/80 backdrop-blur-md z-50 px-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 lg:hidden text-white">
                {sidebarOpen ? <X /> : <Menu />}
              </button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 border-2 border-sky-400 bg-slate-800 flex items-center justify-center overflow-hidden rounded-sm">
                  {state.profilePic ? <img src={state.profilePic} alt="P" className="w-full h-full object-cover" /> : <User className="text-sky-400" />}
                </div>
                <div className="text-white">
                  <div className="text-[10px] font-bold text-sky-400 uppercase tracking-tighter neon-text leading-none">[{state.selectedTitle}]</div>
                  <div className="text-base font-bold leading-none mt-1">{state.username || 'The Player'}</div>
                </div>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-6">
              <div className="flex flex-col items-end">
                <span className="text-[10px] uppercase font-bold text-sky-500">Rank {state.rank}</span>
                <span className="text-xl font-black text-white italic tracking-tighter">LVL {state.level}</span>
              </div>
            </div>
          </nav>
          <aside className={`fixed left-0 top-16 bottom-0 w-64 bg-slate-900/95 border-r border-sky-500/20 z-40 transition-transform lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
            <div className="p-6 flex flex-col gap-2">
              <SidebarLink to="/" icon={<LayoutDashboard size={20} />} label="Dashboard" onClick={() => setSidebarOpen(false)} />
              <SidebarLink to="/arc" icon={<Sword size={20} />} label="Quest Log" onClick={() => setSidebarOpen(false)} />
              <SidebarLink to="/level" icon={<TrendingUp size={20} />} label="Abilities" onClick={() => setSidebarOpen(false)} />
              <SidebarLink to="/notifications" icon={<Bell size={20} />} label="System Messages" unread={unreadCount} onClick={() => setSidebarOpen(false)} />
              <SidebarLink to="/settings" icon={<Settings size={20} />} label="Settings" onClick={() => setSidebarOpen(false)} />
            </div>
          </aside>
          <main className="lg:ml-64 pt-20 p-4 min-h-screen">
            <div className="max-w-6xl mx-auto pb-24">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/arc" element={<ArcBuilder />} />
                <Route path="/level" element={<LevelView />} />
                <Route path="/notifications" element={<NotificationsView />} />
                <Route path="/settings" element={<ProfileSettings />} />
              </Routes>
            </div>
          </main>
        </div>
      </HashRouter>
    </GameContext.Provider>
  );
};

const SidebarLink: React.FC<{ to: string; icon: React.ReactNode; label: string; onClick?: () => void; unread?: number }> = ({ to, icon, label, onClick, unread }) => {
  const location = useLocation();
  const active = location.pathname === to;
  return (
    <Link to={to} onClick={onClick} className={`flex items-center justify-between p-4 font-bold uppercase tracking-widest text-xs border-l-4 transition-all ${active ? 'bg-sky-500/10 border-sky-400 text-sky-400' : 'border-transparent text-slate-500 hover:text-white'}`}>
      <div className="flex items-center gap-3">
        {icon}{label}
      </div>
      {unread && unread > 0 ? (
        <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
      ) : null}
    </Link>
  );
};

export default App;
