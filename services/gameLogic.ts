
import { Rank } from '../types';
import { RANK_THRESHOLDS } from '../constants';

/**
 * Calculates the EXP required to reach the next level.
 * Formula: 100 * (1.25 ^ level)
 * This provides a smooth but scaling difficulty curve.
 */
export const getLevelThreshold = (level: number): number => {
  // Base requirement is 100. Each level increases requirement by 25%.
  return Math.floor(100 * Math.pow(1.25, level - 1));
};

/**
 * Determines Rank based on total lifetime (cumulative) EXP.
 */
export const calculateRank = (cumulativeEXP: number): Rank => {
  const entries = Object.entries(RANK_THRESHOLDS)
    .map(([exp, rank]) => ({ threshold: Number(exp), rank: rank as Rank }))
    .sort((a, b) => b.threshold - a.threshold);

  for (const entry of entries) {
    if (cumulativeEXP >= entry.threshold) {
      return entry.rank;
    }
  }
  return 'E';
};

export const getEfficiency = (tasksDone: number, totalTasks: number): number => {
  if (totalTasks === 0) return 100;
  return Math.round((tasksDone / totalTasks) * 100);
};

export const generateId = () => Math.random().toString(36).substr(2, 9);
