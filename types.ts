
export type Rank = 'E' | 'D' | 'C' | 'B' | 'A' | 'S' | 'SS';
export type TaskType = 'checkbox' | 'reps' | 'duration';
export type TaskDifficulty = 'Easy' | 'Normal' | 'Hard';
export type TaskCategory = 'Physical Health' | 'Mental Health' | 'Personal' | 'Skill' | 'Spiritual';
export type TaskState = 'normal' | 'running' | 'success' | 'failed';

export interface Task {
  id: string;
  name: string;
  type: TaskType;
  difficulty: TaskDifficulty;
  category: TaskCategory;
  repsTarget: number;
  repsDone: number;
  durationMinutes: number;
  remainingSeconds: number; // For the timer
  timerState: 'idle' | 'running' | 'completed';
  repeat: 'daily' | 'custom';
  expValue: number;
  completed: boolean;
  state: TaskState;
  lastUpdated: string;
  createdAt: string;
}

export interface Reminder {
  id: string;
  message: string;
  targetTime: number;
  triggered: boolean;
}

export interface AnalyticsEntry {
  date: string;
  expEarned: number;
  tasksCompleted: number;
  efficiency: number;
}

export interface Notification {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'level' | 'rank' | 'system_alert';
  timestamp: number;
  read: boolean;
}

export interface SystemEvent {
  id: string;
  type: 'QUEST_CLEARED' | 'QUEST_FAILED' | 'LEVEL_UP' | 'RANK_UP' | 'STAT_RESONANCE' | 'SYSTEM_SYNC';
  value?: string | number;
  timestamp: number;
}

export interface User {
  id: string;
  username: string;
  passwordHash: string;
}

export interface AppState {
  username: string;
  displayName: string;
  profilePic: string;
  selectedTitle: string;
  level: number;
  rank: Rank;
  totalEXP: number; 
  cumulativeEXP: number; 
  tasksList: Task[];
  reminders: Reminder[];
  completedToday: string[];
  streak: number;
  analytics: {
    history: AnalyticsEntry[];
  };
  lastResetDate: string;
  dailyResetTime: string; // HH:mm format
  theme: 'light' | 'dark';
  notifications: Notification[];
  titlesUnlocked: string[];
  totalTasksCompletedCount: number;
  statPoints: number;
  stats: {
    strength: number;
    vitality: number;
    agility: number;
    intelligence: number;
    sense: number;
  };
  animationsEnabled: boolean;
  animationSpeed: number;
  soundVolume: number; // Volume control (0-1)
  deviceNotificationsEnabled: boolean; // Native device notification toggle
  visualFeedbackStyle: 'full' | 'subtle' | 'none';
  lastEvent: SystemEvent | null;
}
