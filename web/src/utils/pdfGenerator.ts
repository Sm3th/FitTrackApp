import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface WorkoutSession {
  id: string;
  name?: string;
  startTime: string;
  endTime?: string;
  duration?: number;
  exerciseSets?: Array<{
    exercise: { name: string };
    setNumber: number;
    reps?: number;
    weight?: number;
  }>;
}

export const generateWorkoutPDF = (workouts: WorkoutSession[]) => {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(24);
  doc.setTextColor(255, 107, 53); // Orange
  doc.text('FitTrack Pro', 105, 20, { align: 'center' });
  
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text('Workout Report', 105, 30, { align: 'center' });
  
  // Date
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 105, 38, { align: 'center' });
  
  // Stats Summary
  const totalWorkouts = workouts.length;
  const totalSets = workouts.reduce((sum, w) => sum + (w.exerciseSets?.length || 0), 0);
  const totalVolume = workouts.reduce((sum, w) => {
    return sum + (w.exerciseSets?.reduce((s, set) => {
      return s + ((set.reps || 0) * (set.weight || 0));
    }, 0) || 0);
  }, 0);
  
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  let yPos = 50;
  
  doc.text('Summary Statistics', 20, yPos);
  yPos += 10;
  
  doc.setFontSize(10);
  doc.text(`Total Workouts: ${totalWorkouts}`, 20, yPos);
  yPos += 6;
  doc.text(`Total Sets: ${totalSets}`, 20, yPos);
  yPos += 6;
  doc.text(`Total Volume: ${totalVolume.toLocaleString()} kg`, 20, yPos);
  yPos += 15;
  
  // Workout Details Table
  doc.setFontSize(12);
  doc.text('Workout History', 20, yPos);
  yPos += 5;
  
  const tableData = workouts.map(workout => {
    const date = new Date(workout.startTime).toLocaleDateString();
    const exercises = workout.exerciseSets?.length || 0;
    const duration = workout.duration || 0;
    
    return [
      date,
      workout.name || 'Workout Session',
      exercises.toString(),
      `${duration} min`
    ];
  });
  
  autoTable(doc, {
    startY: yPos,
    head: [['Date', 'Workout', 'Sets', 'Duration']],
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: [255, 107, 53] },
    styles: { fontSize: 9 },
  });
  
  // Exercise Breakdown (New Page)
  doc.addPage();
  doc.setFontSize(16);
  doc.text('Exercise Breakdown', 105, 20, { align: 'center' });
  
  yPos = 35;
  
  workouts.forEach((workout) => {
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }
    
    doc.setFontSize(11);
    doc.setTextColor(255, 107, 53);
    doc.text(`${new Date(workout.startTime).toLocaleDateString()} - ${workout.name || 'Workout'}`, 20, yPos);
    yPos += 8;
    
    if (workout.exerciseSets && workout.exerciseSets.length > 0) {
      const exerciseData = workout.exerciseSets.map(set => [
        set.exercise.name,
        `Set ${set.setNumber}`,
        set.reps?.toString() || '-',
        set.weight ? `${set.weight} kg` : '-'
      ]);
      
      autoTable(doc, {
        startY: yPos,
        head: [['Exercise', 'Set', 'Reps', 'Weight']],
        body: exerciseData,
        theme: 'plain',
        styles: { fontSize: 8 },
        headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0] },
        margin: { left: 20 },
      });
      
      yPos = (doc as any).lastAutoTable.finalY + 10;
    }
  });
  
  // Footer on last page
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Page ${i} of ${pageCount}`,
      105,
      290,
      { align: 'center' }
    );
    doc.text(
      '© 2025 FitTrack Pro - Your Fitness Journey',
      105,
      285,
      { align: 'center' }
    );
  }
  
  // Save
  doc.save(`FitTrack-Report-${new Date().toISOString().split('T')[0]}.pdf`);
};