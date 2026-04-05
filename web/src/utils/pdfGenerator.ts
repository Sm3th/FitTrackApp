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

interface MonthlyReportData {
  user: {
    name: string;
    username: string;
  };
  period: {
    month: string; // e.g. "April 2025"
    start: Date;
    end: Date;
  };
  workouts: WorkoutSession[];
  bodyMeasurements?: {
    start?: { weight?: number; bodyFat?: number };
    end?: { weight?: number; bodyFat?: number };
  };
  nutrition?: {
    avgCalories: number;
    avgProtein: number;
    avgCarbs: number;
    avgFat: number;
    daysLogged: number;
  };
  achievements?: string[];
  streak?: number;
}

// ─── Color palette ───────────────────────────────────────────────────────────
const ORANGE: [number, number, number] = [249, 115, 22];
const DARK: [number, number, number] = [15, 23, 42];
const GRAY: [number, number, number] = [100, 116, 139];
const LIGHT: [number, number, number] = [241, 245, 249];
const WHITE: [number, number, number] = [255, 255, 255];
const GREEN: [number, number, number] = [34, 197, 94];
const RED: [number, number, number] = [239, 68, 68];

function drawPageHeader(doc: jsPDF, title: string, subtitle: string) {
  // Background bar
  doc.setFillColor(...DARK);
  doc.rect(0, 0, 210, 28, 'F');

  // Orange accent line
  doc.setFillColor(...ORANGE);
  doc.rect(0, 26, 210, 2, 'F');

  // Logo text
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...ORANGE);
  doc.text('FitTrack Pro', 14, 12);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184);
  doc.text('Monthly Progress Report', 14, 19);

  // Page title (right)
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...WHITE);
  doc.text(title, 196, 12, { align: 'right' });
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184);
  doc.text(subtitle, 196, 19, { align: 'right' });
}

function drawPageFooter(doc: jsPDF, pageNum: number, totalPages: number) {
  doc.setFillColor(...LIGHT);
  doc.rect(0, 284, 210, 13, 'F');

  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...GRAY);
  doc.text('FitTrack Pro — Your Fitness Journey', 14, 291);
  doc.text(`Page ${pageNum} of ${totalPages}`, 196, 291, { align: 'right' });
  doc.text(new Date().toLocaleDateString(), 105, 291, { align: 'center' });
}

function statBox(
  doc: jsPDF,
  x: number, y: number, w: number, h: number,
  label: string, value: string, sub: string,
  color: [number, number, number] = ORANGE
) {
  // Card bg
  doc.setFillColor(...LIGHT);
  doc.roundedRect(x, y, w, h, 3, 3, 'F');

  // Left accent
  doc.setFillColor(...color);
  doc.roundedRect(x, y, 3, h, 1.5, 1.5, 'F');

  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...GRAY);
  doc.text(label.toUpperCase(), x + 7, y + 7);

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...DARK);
  doc.text(value, x + 7, y + 17);

  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...GRAY);
  doc.text(sub, x + 7, y + 23);
}

// ─── MAIN EXPORT ─────────────────────────────────────────────────────────────

export const generateMonthlyReport = (data: MonthlyReportData) => {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const { user, period, workouts, bodyMeasurements, nutrition, achievements, streak } = data;

  // ── PAGE 1: Cover + Summary ────────────────────────────────────────────────
  // Full dark cover area
  doc.setFillColor(...DARK);
  doc.rect(0, 0, 210, 90, 'F');

  // Gradient-like orange accent
  doc.setFillColor(...ORANGE);
  doc.rect(0, 88, 210, 3, 'F');

  // App name
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...ORANGE);
  doc.text('FitTrack Pro', 105, 28, { align: 'center' });

  // Report type
  doc.setFontSize(13);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...WHITE);
  doc.text('Monthly Progress Report', 105, 40, { align: 'center' });

  // Period
  doc.setFontSize(11);
  doc.setTextColor(148, 163, 184);
  doc.text(period.month, 105, 50, { align: 'center' });

  // User info
  doc.setFontSize(10);
  doc.setTextColor(...WHITE);
  doc.text(user.name || user.username, 105, 65, { align: 'center' });
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text(`@${user.username}`, 105, 72, { align: 'center' });

  // ── Summary stat cards ────────────────────────────────────────────────────
  const totalWorkouts = workouts.length;
  const totalSets = workouts.reduce((s, w) => s + (w.exerciseSets?.length || 0), 0);
  const totalVolume = workouts.reduce((s, w) =>
    s + (w.exerciseSets?.reduce((ss, set) => ss + ((set.reps || 0) * (set.weight || 0)), 0) || 0), 0);
  const avgDuration = totalWorkouts > 0
    ? Math.round(workouts.reduce((s, w) => s + (w.duration || 0), 0) / totalWorkouts)
    : 0;

  const cardY = 98;
  const cardW = 42;
  const cardH = 28;
  const gap = 4;

  statBox(doc, 14,         cardY, cardW, cardH, 'Workouts',     `${totalWorkouts}`,               'sessions this month', ORANGE);
  statBox(doc, 14 + cardW + gap, cardY, cardW, cardH, 'Total Sets',    `${totalSets}`,               'sets completed',      [99, 102, 241]);
  statBox(doc, 14 + (cardW + gap) * 2, cardY, cardW, cardH, 'Volume',       `${(totalVolume / 1000).toFixed(1)}t`, 'total kg lifted',     GREEN);
  statBox(doc, 14 + (cardW + gap) * 3, cardY, cardW, cardH, 'Avg Duration', `${avgDuration}m`,            'per session',         [234, 179, 8]);

  if (streak !== undefined) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...ORANGE);
    doc.text(`🔥 ${streak}-day streak`, 105, cardY + cardH + 10, { align: 'center' });
  }

  // ── Body measurements progress ─────────────────────────────────────────────
  let y = cardY + cardH + 22;

  if (bodyMeasurements?.start || bodyMeasurements?.end) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...DARK);
    doc.text('Body Measurements', 14, y);
    doc.setFillColor(...ORANGE);
    doc.rect(14, y + 2, 30, 0.8, 'F');
    y += 10;

    const rows: string[][] = [];
    if (bodyMeasurements.start?.weight !== undefined || bodyMeasurements.end?.weight !== undefined) {
      const start = bodyMeasurements.start?.weight ?? 0;
      const end = bodyMeasurements.end?.weight ?? 0;
      const diff = end - start;
      rows.push(['Weight (kg)', start ? `${start}` : '—', end ? `${end}` : '—', diff !== 0 ? `${diff > 0 ? '+' : ''}${diff.toFixed(1)}` : '—']);
    }
    if (bodyMeasurements.start?.bodyFat !== undefined || bodyMeasurements.end?.bodyFat !== undefined) {
      const start = bodyMeasurements.start?.bodyFat ?? 0;
      const end = bodyMeasurements.end?.bodyFat ?? 0;
      const diff = end - start;
      rows.push(['Body Fat (%)', start ? `${start}` : '—', end ? `${end}` : '—', diff !== 0 ? `${diff > 0 ? '+' : ''}${diff.toFixed(1)}` : '—']);
    }

    if (rows.length > 0) {
      autoTable(doc, {
        startY: y,
        head: [['Metric', 'Start of Month', 'End of Month', 'Change']],
        body: rows,
        theme: 'grid',
        headStyles: { fillColor: DARK, textColor: WHITE, fontSize: 8 },
        styles: { fontSize: 9, cellPadding: 3 },
        columnStyles: {
          3: {
            fontStyle: 'bold',
            textColor: rows.map(r => parseFloat(r[3])).some(v => v < 0) ? RED : GREEN,
          },
        },
        margin: { left: 14, right: 14 },
      });
      y = (doc as any).lastAutoTable.finalY + 10;
    }
  }

  // ── Nutrition summary ──────────────────────────────────────────────────────
  if (nutrition && nutrition.daysLogged > 0) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...DARK);
    doc.text('Nutrition Overview', 14, y);
    doc.setFillColor(...ORANGE);
    doc.rect(14, y + 2, 30, 0.8, 'F');
    y += 10;

    autoTable(doc, {
      startY: y,
      head: [['Days Logged', 'Avg Calories', 'Avg Protein', 'Avg Carbs', 'Avg Fat']],
      body: [[
        `${nutrition.daysLogged} days`,
        `${nutrition.avgCalories} kcal`,
        `${nutrition.avgProtein}g`,
        `${nutrition.avgCarbs}g`,
        `${nutrition.avgFat}g`,
      ]],
      theme: 'grid',
      headStyles: { fillColor: [5, 150, 105], textColor: WHITE, fontSize: 8 },
      styles: { fontSize: 9, cellPadding: 3 },
      margin: { left: 14, right: 14 },
    });
    y = (doc as any).lastAutoTable.finalY + 10;
  }

  // ── Achievements ───────────────────────────────────────────────────────────
  if (achievements && achievements.length > 0) {
    if (y > 240) { doc.addPage(); y = 35; }

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...DARK);
    doc.text('Achievements Unlocked', 14, y);
    doc.setFillColor(...ORANGE);
    doc.rect(14, y + 2, 40, 0.8, 'F');
    y += 10;

    autoTable(doc, {
      startY: y,
      body: achievements.map(a => [a]),
      theme: 'plain',
      styles: { fontSize: 9, cellPadding: 2 },
      margin: { left: 14, right: 14 },
    });
    y = (doc as any).lastAutoTable.finalY + 10;
  }

  // ── PAGE 2: Workout History ────────────────────────────────────────────────
  doc.addPage();
  drawPageHeader(doc, 'Workout Log', period.month);
  y = 38;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...DARK);
  doc.text('All Workout Sessions', 14, y);
  doc.setFillColor(...ORANGE);
  doc.rect(14, y + 2, 35, 0.8, 'F');
  y += 8;

  const workoutRows = workouts.map(w => {
    const date = new Date(w.startTime).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
    const sets = w.exerciseSets?.length || 0;
    const vol = (w.exerciseSets?.reduce((s, set) => s + ((set.reps || 0) * (set.weight || 0)), 0) || 0);
    return [
      date,
      w.name || 'Workout',
      `${w.duration || 0} min`,
      `${sets}`,
      `${vol.toLocaleString()} kg`,
    ];
  });

  autoTable(doc, {
    startY: y,
    head: [['Date', 'Name', 'Duration', 'Sets', 'Volume']],
    body: workoutRows,
    theme: 'striped',
    headStyles: { fillColor: DARK, textColor: WHITE, fontSize: 8 },
    styles: { fontSize: 8, cellPadding: 2.5 },
    alternateRowStyles: { fillColor: LIGHT },
    margin: { left: 14, right: 14 },
  });

  // ── PAGE 3: Personal Records ───────────────────────────────────────────────
  doc.addPage();
  drawPageHeader(doc, 'Personal Records', period.month);
  y = 38;

  // Build PRs: best weight per exercise
  const prMap: Record<string, { reps: number; weight: number }> = {};
  workouts.forEach(w => {
    w.exerciseSets?.forEach(set => {
      const name = set.exercise.name;
      const current = prMap[name];
      if (!current || (set.weight || 0) > (current.weight || 0)) {
        prMap[name] = { reps: set.reps || 0, weight: set.weight || 0 };
      }
    });
  });

  const prRows = Object.entries(prMap)
    .filter(([, v]) => v.weight > 0)
    .sort((a, b) => b[1].weight - a[1].weight)
    .map(([name, v]) => [name, `${v.weight} kg`, `${v.reps} reps`, `${(v.weight * v.reps).toFixed(0)} kg vol`]);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...DARK);
  doc.text('Best Performance This Month', 14, y);
  doc.setFillColor(...GREEN);
  doc.rect(14, y + 2, 50, 0.8, 'F');
  y += 8;

  if (prRows.length > 0) {
    autoTable(doc, {
      startY: y,
      head: [['Exercise', 'Best Weight', 'Reps', 'Volume']],
      body: prRows,
      theme: 'striped',
      headStyles: { fillColor: [5, 150, 105], textColor: WHITE, fontSize: 8 },
      styles: { fontSize: 8, cellPadding: 2.5 },
      alternateRowStyles: { fillColor: LIGHT },
      margin: { left: 14, right: 14 },
    });
  } else {
    doc.setFontSize(9);
    doc.setTextColor(...GRAY);
    doc.text('No weighted exercises recorded this month.', 14, y + 8);
  }

  // ── Add footers to all pages ───────────────────────────────────────────────
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    drawPageFooter(doc, i, totalPages);
  }

  doc.save(`FitTrack-Monthly-Report-${period.month.replace(' ', '-')}.pdf`);
};

// ─── Legacy: basic workout PDF (kept for WorkoutHistoryPage) ─────────────────
export const generateWorkoutPDF = (workouts: WorkoutSession[]) => {
  const now = new Date();
  const monthName = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const userRaw = localStorage.getItem('user');
  const user = userRaw ? JSON.parse(userRaw) : { name: 'User', username: 'user' };

  generateMonthlyReport({
    user: { name: user.fullName || user.username || 'User', username: user.username || 'user' },
    period: {
      month: monthName,
      start: new Date(now.getFullYear(), now.getMonth(), 1),
      end: new Date(now.getFullYear(), now.getMonth() + 1, 0),
    },
    workouts,
    streak: 0,
  });
};
