export interface GamificationStats {
  streakDays: number;
  totalSessions: number;
  presenceScore: number; // 0-100 average
  lastSessionDate: string | null;
  weeklyGoalProgress: number; // e.g. 3 out of 5
}

// In a real app, this would be persisted in SQLite or Supabase
export let currentStats: GamificationStats = {
  streakDays: 4,
  totalSessions: 12,
  presenceScore: 82,
  lastSessionDate: new Date().toISOString(),
  weeklyGoalProgress: 3,
};

export function recordSessionComplete(presenceScore: number) {
  // Mock logic to update stats
  currentStats.totalSessions += 1;
  currentStats.weeklyGoalProgress = Math.min(5, currentStats.weeklyGoalProgress + 1);
  
  // Rolling average of presence score (simplified)
  currentStats.presenceScore = Math.round((currentStats.presenceScore * 0.8) + (presenceScore * 0.2));
  
  currentStats.lastSessionDate = new Date().toISOString();
  
  return currentStats;
}
