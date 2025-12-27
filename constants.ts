
import { Rank, AppState } from './types.ts';

export const RANK_MODIFIERS: Record<Rank, number> = {
  'E': 1.0, 'D': 1.1, 'C': 1.25, 'B': 1.5, 'A': 2.0, 'S': 3.0, 'SS': 5.0,
};

export const RANK_THRESHOLDS: Record<number, Rank> = {
  0: 'E', 1000: 'D', 3000: 'C', 7000: 'B', 15000: 'A', 30000: 'S', 60000: 'SS'
};

export const TITLES = [
  { id: 'novice_hunter', name: 'Novice Hunter' },
  { id: 'consistent_striker', name: 'Consistent Striker' },
  { id: 'iron_will', name: 'Iron Will' },
  { id: 'shadow_monarch', name: 'Shadow Monarch' },
  { id: 'awakened', name: 'The Awakened' },
];

/**
 * Returns a fresh, deep-copy instance of the initial state.
 * This prevents data leakage between different user accounts in the same browser session.
 */
export const getInitialState = (username: string = ""): AppState => ({
  username: username,
  displayName: username || "New Subject",
  profilePic: "",
  selectedTitle: "Unawakened",
  level: 1,
  rank: "E" as Rank,
  totalEXP: 0,
  cumulativeEXP: 0,
  tasksList: [],
  reminders: [],
  completedToday: [],
  streak: 0,
  analytics: { history: [] },
  lastResetDate: new Date().toISOString(), // Use full ISO timestamp for precise reset logic
  dailyResetTime: "00:00",
  theme: "dark",
  notifications: [],
  titlesUnlocked: ["Unawakened"],
  totalTasksCompletedCount: 0,
  statPoints: 0,
  stats: {
    strength: 0,
    vitality: 0,
    agility: 0,
    intelligence: 0,
    sense: 0
  },
  animationsEnabled: true,
  animationSpeed: 1.0,
  soundVolume: 0.5, // Standard volume
  deviceNotificationsEnabled: false, // Default to false until user enables
  visualFeedbackStyle: 'subtle',
  lastEvent: null
});
