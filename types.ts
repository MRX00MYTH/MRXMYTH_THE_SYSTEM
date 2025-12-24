
export type Rank = 'E' | 'D' | 'C' | 'B' | 'A' | 'S' | 'SS';

export type TaskType = 'checkbox' | 'reps' | 'duration';

export type TaskCategory = 'Physical Health' | 'Mental Health' | 'Personal' | 'Skill' | 'Spiritual';

export type TaskState = 'normal' | 'running' | 'success' | 'failed';

export interface Task {
  id: string;
  name: string;
  type: TaskType;
  category: TaskCategory;
  repsTarget: number;
  repsDone: number;
  durationMinutes: number;
  timerState: 'idle' | 'running' | 'completed';
  repeat: 'daily' | 'custom';
  deadline?: string;
  expValue: number;
  finalEXP: number;
  completed: boolean;
  state: TaskState;
  lastUpdated: string;
  createdAt: string;
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
  type: 'info' | 'success' | 'warning' | 'error' | 'level' | 'rank';
  timestamp: number;
  read: boolean;
}

export interface AppState {
  username: string;
  profilePic: string;
  selectedTitle: string;
  level: number;
  rank: Rank;
  totalEXP: number;
  cumulativeEXP: number;
  expPerTask: number;
  tasksList: Task[];
  completedToday: string[];
  missedToday: string[];
  streak: number;
  analytics: {
    history: AnalyticsEntry[];
  };
  resetTime: string;
  lastResetDate: string;
  theme: 'light' | 'dark';
  notifications: Notification[];
  titlesUnlocked: string[];
  terminationCountdown: number | null;
  totalTasksCompletedCount: number;
  statPoints: number;
  stats: {
    strength: number;
    vitality: number;
    agility: number;
    intelligence: number;
    sense: number;
  };
}
