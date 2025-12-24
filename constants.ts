
import { Rank } from './types';

export const RANK_MODIFIERS: Record<Rank, number> = {
  'E': 1.0,
  'D': 0.90,
  'C': 0.85,
  'B': 0.80,
  'A': 0.75,
  'S': 0.70,
  'SS': 0.65,
};

export const RANK_THRESHOLDS: Record<number, Rank> = {
  0: 'E',
  1000: 'D',
  3000: 'C',
  7000: 'B',
  15000: 'A',
  30000: 'S',
  60000: 'SS'
};

export const TITLES = [
  { id: 'novice_hunter', name: 'Novice Hunter' },
  { id: 'consistent_striker', name: 'Consistent Striker' },
  { id: 'iron_will', name: 'Iron Will' },
  { id: 'shadow_monarch', name: 'Shadow Monarch' },
  { id: 'unstoppable', name: 'Unstoppable' },
  { id: 'one_man_army', name: 'One Man Army' },
  { id: 'shadow_soldier', name: 'Shadow Soldier' },
  { id: 'awakened', name: 'The Awakened' },
];

export const INITIAL_STATE = {
  username: "",
  profilePic: "",
  selectedTitle: "Unawakened",
  level: 1,
  rank: "E" as Rank,
  totalEXP: 0,
  cumulativeEXP: 0,
  expPerTask: 10,
  tasksList: [],
  completedToday: [],
  missedToday: [],
  streak: 0,
  analytics: { history: [] },
  resetTime: "00:00",
  lastResetDate: new Date().toDateString(),
  theme: "dark" as const,
  notifications: [],
  titlesUnlocked: ["Unawakened"],
  terminationCountdown: null,
  totalTasksCompletedCount: 0,
  statPoints: 0,
  stats: {
    strength: 0,
    vitality: 0,
    agility: 0,
    intelligence: 0,
    sense: 0
  }
};
