
import { Rank } from '../types';
import { RANK_THRESHOLDS } from '../constants';

export const getLevelThreshold = (level: number): number => {
  if (level <= 10) return Math.floor(150 * Math.pow(1.8, level));
  if (level <= 20) return Math.floor(200 * Math.pow(2.0, level));
  return Math.floor(250 * Math.pow(2.2, level));
};

export const calculateRank = (cumulativeEXP: number): Rank => {
  const thresholds = Object.keys(RANK_THRESHOLDS).map(Number).sort((a, b) => b - a);
  for (const t of thresholds) {
    if (cumulativeEXP >= t) return RANK_THRESHOLDS[t];
  }
  return 'E';
};

export const getEfficiency = (tasksDone: number, totalTasks: number): number => {
  if (totalTasks === 0) return 100;
  return Math.round((tasksDone / totalTasks) * 100);
};

export const generateId = () => Math.random().toString(36).substr(2, 9);
