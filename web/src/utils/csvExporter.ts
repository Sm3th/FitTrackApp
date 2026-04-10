interface WorkoutSession {
  id: string;
  startTime: string;
  endTime?: string;
  duration?: number;
  exerciseSets?: Array<{
    exercise: { name: string; muscleGroup?: string };
    setNumber?: number;
    reps?: number;
    weight?: number;
    duration?: number;
  }>;
}

const escapeCsv = (value: string | number | undefined): string => {
  if (value === undefined || value === null) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

const downloadCsv = (content: string, filename: string) => {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

export const exportWorkoutsToCsv = (workouts: WorkoutSession[]) => {
  const headers = ['Date', 'Workout ID', 'Duration (min)', 'Exercise', 'Muscle Group', 'Set #', 'Reps', 'Weight (kg)', 'Volume (kg)'];
  const rows: string[][] = [headers];

  workouts.forEach(workout => {
    const date = new Date(workout.startTime).toLocaleDateString();
    const duration = workout.duration ? Math.round(workout.duration / 60) : '';

    if (!workout.exerciseSets || workout.exerciseSets.length === 0) {
      rows.push([date, workout.id, String(duration), '', '', '', '', '', '']);
    } else {
      workout.exerciseSets.forEach(set => {
        const volume = (set.reps && set.weight) ? set.reps * set.weight : '';
        rows.push([
          date,
          workout.id,
          String(duration),
          set.exercise.name,
          set.exercise.muscleGroup || '',
          String(set.setNumber || ''),
          String(set.reps || ''),
          String(set.weight || ''),
          String(volume),
        ]);
      });
    }
  });

  const content = rows.map(row => row.map(escapeCsv).join(',')).join('\n');
  const filename = `fittrack-workouts-${new Date().toISOString().split('T')[0]}.csv`;
  downloadCsv(content, filename);
};

export const exportPersonalRecordsToCsv = (prs: Array<{ name: string; weight: number; reps: number; date: string }>) => {
  const headers = ['Exercise', 'Max Weight (kg)', 'Reps', 'Date'];
  const rows = [
    headers,
    ...prs.map(pr => [pr.name, String(pr.weight), String(pr.reps), new Date(pr.date).toLocaleDateString()]),
  ];
  const content = rows.map(row => row.map(escapeCsv).join(',')).join('\n');
  downloadCsv(content, `fittrack-personal-records-${new Date().toISOString().split('T')[0]}.csv`);
};

export const exportNutritionToCsv = (entries: Array<{
  date: string; name: string; meal: string; calories: number; protein: number; carbs: number; fat: number;
}>) => {
  const headers = ['Date', 'Food', 'Meal', 'Calories', 'Protein (g)', 'Carbs (g)', 'Fat (g)'];
  const rows = [
    headers,
    ...entries.map(e => [
      e.date, e.name, e.meal,
      String(e.calories), String(e.protein), String(e.carbs), String(e.fat),
    ]),
  ];
  const content = rows.map(row => row.map(escapeCsv).join(',')).join('\n');
  downloadCsv(content, `fittrack-nutrition-${new Date().toISOString().split('T')[0]}.csv`);
};

export const export1RMsToCsv = () => {
  try {
    const stored: Record<string, { value: number; date: string }> =
      JSON.parse(localStorage.getItem('fittrack_1rm') || '{}');
    const headers = ['Exercise', 'Estimated 1RM (kg)', 'Date'];
    const rows = [
      headers,
      ...Object.entries(stored).map(([name, { value, date }]) => [name, String(value), date]),
    ];
    const content = rows.map(row => row.map(escapeCsv).join(',')).join('\n');
    downloadCsv(content, `fittrack-1rm-${new Date().toISOString().split('T')[0]}.csv`);
  } catch {}
};

export const exportMeasurementsToCsv = (measurements: Array<{
  date: string; chest?: number; waist?: number; hips?: number;
  leftArm?: number; rightArm?: number; leftThigh?: number; rightThigh?: number; weight?: number; bodyFat?: number;
}>) => {
  const headers = ['Date', 'Weight (kg)', 'Body Fat %', 'Chest (cm)', 'Waist (cm)', 'Hips (cm)', 'Left Arm (cm)', 'Right Arm (cm)', 'Left Thigh (cm)', 'Right Thigh (cm)'];
  const rows = [
    headers,
    ...measurements.map(m => [
      new Date(m.date).toLocaleDateString(),
      String(m.weight || ''), String(m.bodyFat || ''),
      String(m.chest || ''), String(m.waist || ''), String(m.hips || ''),
      String(m.leftArm || ''), String(m.rightArm || ''),
      String(m.leftThigh || ''), String(m.rightThigh || ''),
    ]),
  ];
  const content = rows.map(row => row.map(escapeCsv).join(',')).join('\n');
  downloadCsv(content, `fittrack-measurements-${new Date().toISOString().split('T')[0]}.csv`);
};
