interface WorkoutSession {
  id: string;
  startTime: string;
  exerciseSets?: Array<{
    exercise: { name: string; muscleGroup?: string };
    setNumber?: number;
    reps?: number;
    weight?: number;
    duration?: number;
  }>;
}

export const calculateStreak = (workouts: WorkoutSession[]): number => {
  if (workouts.length === 0) return 0;

  const sortedWorkouts = [...workouts].sort(
    (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
  );

  let streak = 0;
  let currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);

  for (const workout of sortedWorkouts) {
    const workoutDate = new Date(workout.startTime);
    workoutDate.setHours(0, 0, 0, 0);

    const diffDays = Math.floor(
      (currentDate.getTime() - workoutDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays === streak) {
      streak++;
    } else if (diffDays > streak) {
      break;
    }
  }

  return streak;
};

export const getWeeklyWorkoutData = (workouts: WorkoutSession[]) => {
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return date;
  });

  return last7Days.map(date => {
    const dateStr = date.toISOString().split('T')[0];
    const count = workouts.filter(w => {
      const workoutDate = new Date(w.startTime).toISOString().split('T')[0];
      return workoutDate === dateStr;
    }).length;

    return {
      day: date.toLocaleDateString('en-US', { weekday: 'short' }),
      count,
      date: dateStr,
    };
  });
};

export const getTotalVolume = (workouts: WorkoutSession[]): number => {
  let totalVolume = 0;
  workouts.forEach(workout => {
    workout.exerciseSets?.forEach(set => {
      if (set.reps && set.weight) {
        totalVolume += set.reps * set.weight;
      }
    });
  });
  return Math.round(totalVolume);
};

export const getExerciseStats = (workouts: WorkoutSession[]) => {
  const exerciseData: Record<string, { count: number; maxWeight: number; totalSets: number }> = {};

  workouts.forEach(workout => {
    workout.exerciseSets?.forEach(set => {
      const name = set.exercise.name;
      if (!exerciseData[name]) {
        exerciseData[name] = { count: 0, maxWeight: 0, totalSets: 0 };
      }
      exerciseData[name].count++;
      exerciseData[name].totalSets++;
      if (set.weight && set.weight > exerciseData[name].maxWeight) {
        exerciseData[name].maxWeight = set.weight;
      }
    });
  });

  return Object.entries(exerciseData)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.totalSets - a.totalSets)
    .slice(0, 5);
};

export const getPersonalRecords = (workouts: WorkoutSession[]) => {
  const prs: Record<string, { weight: number; reps: number; date: string }> = {};

  workouts.forEach(workout => {
    workout.exerciseSets?.forEach(set => {
      const name = set.exercise.name;
      if (set.weight && set.reps) {
        const currentPR = prs[name];
        if (!currentPR || set.weight > currentPR.weight) {
          prs[name] = {
            weight: set.weight,
            reps: set.reps,
            date: workout.startTime,
          };
        }
      }
    });
  });

  return Object.entries(prs)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 5);
};

// Volume over time (last 12 weeks)
export const getVolumeOverTime = (workouts: WorkoutSession[]) => {
  const weeks: Record<string, number> = {};

  workouts.forEach(workout => {
    const date = new Date(workout.startTime);
    // Get Monday of that week
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(date.setDate(diff));
    const weekKey = monday.toISOString().split('T')[0];

    let volume = 0;
    workout.exerciseSets?.forEach(set => {
      if (set.reps && set.weight) {
        volume += set.reps * set.weight;
      }
    });

    weeks[weekKey] = (weeks[weekKey] || 0) + volume;
  });

  return Object.entries(weeks)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12)
    .map(([date, volume]) => ({
      date,
      label: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      volume: Math.round(volume),
    }));
};

// Workout count per week over time
export const getWorkoutsOverTime = (workouts: WorkoutSession[]) => {
  const weeks: Record<string, number> = {};

  workouts.forEach(workout => {
    const date = new Date(workout.startTime);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(date.setDate(diff));
    const weekKey = monday.toISOString().split('T')[0];
    weeks[weekKey] = (weeks[weekKey] || 0) + 1;
  });

  return Object.entries(weeks)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12)
    .map(([date, count]) => ({
      date,
      label: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      workouts: count,
    }));
};

// Muscle group breakdown for pie chart
export const getMuscleGroupBreakdown = (workouts: WorkoutSession[]) => {
  const groups: Record<string, number> = {};

  workouts.forEach(workout => {
    workout.exerciseSets?.forEach(set => {
      const group = set.exercise.muscleGroup || 'Other';
      const label = group.charAt(0).toUpperCase() + group.slice(1);
      groups[label] = (groups[label] || 0) + 1;
    });
  });

  const colors = [
    '#f97316', '#3b82f6', '#8b5cf6', '#10b981',
    '#ef4444', '#f59e0b', '#06b6d4', '#ec4899',
  ];

  return Object.entries(groups)
    .sort(([, a], [, b]) => b - a)
    .map(([name, value], index) => ({
      name,
      value,
      color: colors[index % colors.length],
    }));
};

// Smart text insights derived from workout history
export const getSmartInsights = (workouts: WorkoutSession[]): string[] => {
  if (workouts.length === 0) return [];
  const insights: string[] = [];

  // Most active day of week
  const dayCounts = [0, 0, 0, 0, 0, 0, 0];
  workouts.forEach(w => { dayCounts[new Date(w.startTime).getDay()]++; });
  const maxDay = dayCounts.indexOf(Math.max(...dayCounts));
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  if (dayCounts[maxDay] > 1) {
    insights.push(`Your most active day is ${dayNames[maxDay]} (${dayCounts[maxDay]} workouts).`);
  }

  // Most trained exercise
  const exerciseCount: Record<string, number> = {};
  workouts.forEach(w => {
    w.exerciseSets?.forEach(s => {
      exerciseCount[s.exercise.name] = (exerciseCount[s.exercise.name] || 0) + 1;
    });
  });
  const topExercise = Object.entries(exerciseCount).sort((a, b) => b[1] - a[1])[0];
  if (topExercise) {
    insights.push(`You've performed ${topExercise[0]} the most — ${topExercise[1]} sets total.`);
  }

  // Average workout frequency
  if (workouts.length >= 2) {
    const sorted = [...workouts].sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    const spanDays = Math.max(1, Math.round((new Date(sorted[sorted.length - 1].startTime).getTime() - new Date(sorted[0].startTime).getTime()) / 86400000));
    const perWeek = ((workouts.length / spanDays) * 7).toFixed(1);
    insights.push(`You average ${perWeek} workouts per week over the last ${spanDays} days.`);
  }

  // Volume trend (this month vs last month)
  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const vol = (ws: WorkoutSession[]) => ws.reduce((s, w) => s + (w.exerciseSets?.reduce((sv, set) => sv + (set.reps && set.weight ? set.reps * set.weight : 0), 0) || 0), 0);
  const thisMonthVol = vol(workouts.filter(w => new Date(w.startTime) >= thisMonthStart));
  const lastMonthVol = vol(workouts.filter(w => new Date(w.startTime) >= lastMonthStart && new Date(w.startTime) < thisMonthStart));
  if (lastMonthVol > 0 && thisMonthVol > 0) {
    const pct = Math.round(((thisMonthVol - lastMonthVol) / lastMonthVol) * 100);
    if (pct > 0) insights.push(`Volume is up ${pct}% this month vs last month. Great progress! 🚀`);
    else if (pct < -10) insights.push(`Volume is down ${Math.abs(pct)}% this month. Time to push harder! 💪`);
  }

  // Best workout time
  const hourCounts: Record<number, number> = {};
  workouts.forEach(w => { const h = new Date(w.startTime).getHours(); hourCounts[h] = (hourCounts[h] || 0) + 1; });
  const topHour = Object.entries(hourCounts).sort((a, b) => Number(b[1]) - Number(a[1]))[0];
  if (topHour) {
    const h = parseInt(topHour[0]);
    const label = h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening';
    insights.push(`You prefer ${label} workouts (most at ${h}:00).`);
  }

  return insights.slice(0, 4);
};

// This week vs last week comparison
export const getWeekComparison = (workouts: WorkoutSession[]) => {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0=Sun
  const monday = new Date(now);
  monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  monday.setHours(0, 0, 0, 0);

  const lastMonday = new Date(monday);
  lastMonday.setDate(monday.getDate() - 7);

  const thisWeek = workouts.filter(w => new Date(w.startTime) >= monday);
  const lastWeek = workouts.filter(w => {
    const d = new Date(w.startTime);
    return d >= lastMonday && d < monday;
  });

  const volume = (ws: WorkoutSession[]) =>
    ws.reduce((s, w) => s + (w.exerciseSets?.reduce((sv, set) => sv + (set.reps && set.weight ? set.reps * set.weight : 0), 0) || 0), 0);

  const sets = (ws: WorkoutSession[]) =>
    ws.reduce((s, w) => s + (w.exerciseSets?.length || 0), 0);

  const tw = { workouts: thisWeek.length, sets: sets(thisWeek), volume: Math.round(volume(thisWeek)) };
  const lw = { workouts: lastWeek.length, sets: sets(lastWeek), volume: Math.round(volume(lastWeek)) };

  const pct = (curr: number, prev: number) =>
    prev === 0 ? (curr > 0 ? 100 : 0) : Math.round(((curr - prev) / prev) * 100);

  return {
    thisWeek: tw,
    lastWeek: lw,
    delta: {
      workouts: pct(tw.workouts, lw.workouts),
      sets: pct(tw.sets, lw.sets),
      volume: pct(tw.volume, lw.volume),
    },
  };
};

// Calendar heatmap data (last 6 months)
export const getCalendarHeatmapData = (workouts: WorkoutSession[]) => {
  const heatmap: Record<string, number> = {};

  workouts.forEach(workout => {
    const dateStr = new Date(workout.startTime).toISOString().split('T')[0];
    heatmap[dateStr] = (heatmap[dateStr] || 0) + 1;
  });

  return heatmap;
};

// Monthly workout data for calendar
export const getMonthlyData = (workouts: WorkoutSession[], year: number, month: number) => {
  return workouts.filter(w => {
    const d = new Date(w.startTime);
    return d.getFullYear() === year && d.getMonth() === month;
  });
};

// PR history for a specific exercise
export const getPRHistory = (workouts: WorkoutSession[], exerciseName: string) => {
  const history: Array<{ date: string; weight: number; reps: number }> = [];
  let currentMax = 0;

  const sorted = [...workouts].sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );

  sorted.forEach(workout => {
    workout.exerciseSets?.forEach(set => {
      if (set.exercise.name === exerciseName && set.weight && set.reps) {
        if (set.weight > currentMax) {
          currentMax = set.weight;
          history.push({
            date: new Date(workout.startTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            weight: set.weight,
            reps: set.reps,
          });
        }
      }
    });
  });

  return history;
};

// XP and level calculation
export const calculateXP = (workouts: WorkoutSession[]): number => {
  let xp = 0;
  workouts.forEach(workout => {
    xp += 100; // Base XP per workout
    workout.exerciseSets?.forEach(set => {
      xp += 10; // XP per set
      if (set.weight && set.reps) {
        xp += Math.floor(set.weight * set.reps * 0.1); // XP for volume
      }
    });
  });
  return Math.round(xp);
};

export const getLevelInfo = (xp: number) => {
  const levels = [
    { level: 1, name: 'Beginner', minXP: 0, maxXP: 500, color: '#94a3b8', badge: '🌱' },
    { level: 2, name: 'Rookie', minXP: 500, maxXP: 1500, color: '#22c55e', badge: '💪' },
    { level: 3, name: 'Athlete', minXP: 1500, maxXP: 3500, color: '#3b82f6', badge: '🏃' },
    { level: 4, name: 'Warrior', minXP: 3500, maxXP: 7000, color: '#8b5cf6', badge: '⚔️' },
    { level: 5, name: 'Champion', minXP: 7000, maxXP: 12000, color: '#f59e0b', badge: '🏆' },
    { level: 6, name: 'Hero', minXP: 12000, maxXP: 20000, color: '#ef4444', badge: '🦸' },
    { level: 7, name: 'Legend', minXP: 20000, maxXP: 35000, color: '#ec4899', badge: '⭐' },
    { level: 8, name: 'Master', minXP: 35000, maxXP: 60000, color: '#f97316', badge: '👑' },
    { level: 9, name: 'Grandmaster', minXP: 60000, maxXP: 100000, color: '#06b6d4', badge: '💎' },
    { level: 10, name: 'God Tier', minXP: 100000, maxXP: Infinity, color: '#fbbf24', badge: '🌟' },
  ];

  const current = levels.find(l => xp >= l.minXP && xp < l.maxXP) || levels[levels.length - 1];
  const next = levels.find(l => l.level === current.level + 1);

  const progressXP = xp - current.minXP;
  const rangeXP = (next?.minXP || current.maxXP) - current.minXP;
  const progressPct = Math.min(100, Math.round((progressXP / rangeXP) * 100));

  return {
    ...current,
    xp,
    progressXP,
    rangeXP: next ? rangeXP : 0,
    progressPct,
    nextLevel: next,
  };
};
