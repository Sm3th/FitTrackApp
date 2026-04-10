import React from 'react';

interface MuscleData {
  name: string;
  value: number;
  color: string;
}

interface Props {
  muscleBreakdown: MuscleData[];
}

// Map muscle group names → heatmap keys
const NAME_MAP: Record<string, string> = {
  chest: 'chest', pecs: 'chest',
  back: 'back', lats: 'back', traps: 'back', rhomboids: 'back',
  shoulders: 'shoulders', delts: 'shoulders', deltoids: 'shoulders',
  biceps: 'biceps',
  triceps: 'triceps',
  legs: 'legs', quads: 'legs', hamstrings: 'legs', glutes: 'legs', calves: 'legs',
  core: 'core', abs: 'core', obliques: 'core',
  cardio: 'cardio', full: 'cardio',
};

const MUSCLE_LABELS: Record<string, string> = {
  chest: 'Chest', back: 'Back', shoulders: 'Shoulders',
  biceps: 'Biceps', triceps: 'Triceps', legs: 'Legs',
  core: 'Core', cardio: 'Cardio',
};

function opacity(value: number, max: number): number {
  if (max === 0 || value === 0) return 0;
  return 0.18 + (value / max) * 0.75;
}

const MuscleHeatmap: React.FC<Props> = ({ muscleBreakdown }) => {
  // Build intensity map
  const intensityMap: Record<string, number> = {};
  muscleBreakdown.forEach(m => {
    const key = NAME_MAP[m.name.toLowerCase()] || m.name.toLowerCase();
    intensityMap[key] = (intensityMap[key] || 0) + m.value;
  });
  const maxVal = Math.max(...Object.values(intensityMap), 1);

  const fill = (key: string) => `rgba(249,115,22,${opacity(intensityMap[key] || 0, maxVal)})`;
  const hasMuscle = (key: string) => (intensityMap[key] || 0) > 0;

  // Get top 3 worked muscles
  const sorted = Object.entries(intensityMap).sort((a, b) => b[1] - a[1]).slice(0, 3);

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Front + Back views */}
      <div className="flex gap-8 flex-wrap justify-center">
        {/* FRONT VIEW */}
        <div className="flex flex-col items-center gap-2">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Front</p>
          <svg width="120" height="240" viewBox="0 0 120 240" className="overflow-visible">
            {/* Body outline */}
            <g stroke="#475569" strokeWidth="1.5" fill="none" opacity="0.6">
              {/* Head */}
              <ellipse cx="60" cy="18" rx="13" ry="16" />
              {/* Neck */}
              <rect x="54" y="32" width="12" height="8" rx="2" />
              {/* Torso */}
              <path d="M30 40 Q20 55 22 85 L24 115 Q40 120 60 120 Q80 120 96 115 L98 85 Q100 55 90 40 Z" />
              {/* Left arm upper */}
              <path d="M30 42 Q14 50 10 80 Q10 95 16 100 Q22 105 26 95 Q30 80 34 65 Z" />
              {/* Right arm upper */}
              <path d="M90 42 Q106 50 110 80 Q110 95 104 100 Q98 105 94 95 Q90 80 86 65 Z" />
              {/* Left arm lower */}
              <path d="M16 100 Q12 115 13 130 Q14 140 18 142 Q22 144 24 135 Q26 120 26 105 Z" />
              {/* Right arm lower */}
              <path d="M104 100 Q108 115 107 130 Q106 140 102 142 Q98 144 96 135 Q94 120 94 105 Z" />
              {/* Hips */}
              <path d="M24 115 Q28 135 30 150 L90 150 Q92 135 96 115 Z" />
              {/* Left leg upper */}
              <path d="M30 150 Q22 165 20 185 Q18 205 22 215 Q28 220 34 215 Q38 205 40 185 Q42 165 42 150 Z" />
              {/* Right leg upper */}
              <path d="M90 150 Q98 165 100 185 Q102 205 98 215 Q92 220 86 215 Q82 205 80 185 Q78 165 78 150 Z" />
              {/* Left leg lower */}
              <path d="M22 215 Q20 225 21 235 Q24 240 28 238 Q32 235 34 225 Q34 218 34 215 Z" />
              {/* Right leg lower */}
              <path d="M98 215 Q100 225 99 235 Q96 240 92 238 Q88 235 86 225 Q86 218 86 215 Z" />
            </g>

            {/* ── HEAT OVERLAYS — FRONT ── */}

            {/* Chest */}
            <ellipse cx="60" cy="62" rx="22" ry="14"
              fill={fill('chest')} className="transition-all duration-500"
              style={{ filter: hasMuscle('chest') ? 'drop-shadow(0 0 4px rgba(249,115,22,0.6))' : 'none' }} />

            {/* Core / Abs */}
            <ellipse cx="60" cy="95" rx="14" ry="16"
              fill={fill('core')} className="transition-all duration-500"
              style={{ filter: hasMuscle('core') ? 'drop-shadow(0 0 4px rgba(249,115,22,0.5))' : 'none' }} />

            {/* Shoulders front */}
            <ellipse cx="25" cy="48" rx="8" ry="10"
              fill={fill('shoulders')} className="transition-all duration-500" />
            <ellipse cx="95" cy="48" rx="8" ry="10"
              fill={fill('shoulders')} className="transition-all duration-500" />

            {/* Biceps */}
            <ellipse cx="17" cy="85" rx="7" ry="14"
              fill={fill('biceps')} className="transition-all duration-500"
              style={{ filter: hasMuscle('biceps') ? 'drop-shadow(0 0 4px rgba(249,115,22,0.5))' : 'none' }} />
            <ellipse cx="103" cy="85" rx="7" ry="14"
              fill={fill('biceps')} className="transition-all duration-500"
              style={{ filter: hasMuscle('biceps') ? 'drop-shadow(0 0 4px rgba(249,115,22,0.5))' : 'none' }} />

            {/* Quads (front of legs) */}
            <ellipse cx="31" cy="180" rx="9" ry="25"
              fill={fill('legs')} className="transition-all duration-500"
              style={{ filter: hasMuscle('legs') ? 'drop-shadow(0 0 4px rgba(249,115,22,0.5))' : 'none' }} />
            <ellipse cx="89" cy="180" rx="9" ry="25"
              fill={fill('legs')} className="transition-all duration-500"
              style={{ filter: hasMuscle('legs') ? 'drop-shadow(0 0 4px rgba(249,115,22,0.5))' : 'none' }} />
          </svg>
        </div>

        {/* BACK VIEW */}
        <div className="flex flex-col items-center gap-2">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Back</p>
          <svg width="120" height="240" viewBox="0 0 120 240" className="overflow-visible">
            {/* Body outline (same as front, mirrored) */}
            <g stroke="#475569" strokeWidth="1.5" fill="none" opacity="0.6">
              <ellipse cx="60" cy="18" rx="13" ry="16" />
              <rect x="54" y="32" width="12" height="8" rx="2" />
              <path d="M30 40 Q20 55 22 85 L24 115 Q40 120 60 120 Q80 120 96 115 L98 85 Q100 55 90 40 Z" />
              <path d="M30 42 Q14 50 10 80 Q10 95 16 100 Q22 105 26 95 Q30 80 34 65 Z" />
              <path d="M90 42 Q106 50 110 80 Q110 95 104 100 Q98 105 94 95 Q90 80 86 65 Z" />
              <path d="M16 100 Q12 115 13 130 Q14 140 18 142 Q22 144 24 135 Q26 120 26 105 Z" />
              <path d="M104 100 Q108 115 107 130 Q106 140 102 142 Q98 144 96 135 Q94 120 94 105 Z" />
              <path d="M24 115 Q28 135 30 150 L90 150 Q92 135 96 115 Z" />
              <path d="M30 150 Q22 165 20 185 Q18 205 22 215 Q28 220 34 215 Q38 205 40 185 Q42 165 42 150 Z" />
              <path d="M90 150 Q98 165 100 185 Q102 205 98 215 Q92 220 86 215 Q82 205 80 185 Q78 165 78 150 Z" />
              <path d="M22 215 Q20 225 21 235 Q24 240 28 238 Q32 235 34 225 Q34 218 34 215 Z" />
              <path d="M98 215 Q100 225 99 235 Q96 240 92 238 Q88 235 86 225 Q86 218 86 215 Z" />
            </g>

            {/* ── HEAT OVERLAYS — BACK ── */}

            {/* Traps */}
            <ellipse cx="60" cy="46" rx="18" ry="8"
              fill={fill('back')} className="transition-all duration-500" />

            {/* Lats / Back */}
            <ellipse cx="60" cy="78" rx="26" ry="22"
              fill={fill('back')} className="transition-all duration-500"
              style={{ filter: hasMuscle('back') ? 'drop-shadow(0 0 6px rgba(249,115,22,0.6))' : 'none' }} />

            {/* Shoulders rear */}
            <ellipse cx="25" cy="48" rx="8" ry="10"
              fill={fill('shoulders')} className="transition-all duration-500" />
            <ellipse cx="95" cy="48" rx="8" ry="10"
              fill={fill('shoulders')} className="transition-all duration-500" />

            {/* Triceps */}
            <ellipse cx="17" cy="82" rx="7" ry="14"
              fill={fill('triceps')} className="transition-all duration-500"
              style={{ filter: hasMuscle('triceps') ? 'drop-shadow(0 0 4px rgba(249,115,22,0.5))' : 'none' }} />
            <ellipse cx="103" cy="82" rx="7" ry="14"
              fill={fill('triceps')} className="transition-all duration-500"
              style={{ filter: hasMuscle('triceps') ? 'drop-shadow(0 0 4px rgba(249,115,22,0.5))' : 'none' }} />

            {/* Glutes */}
            <ellipse cx="60" cy="135" rx="24" ry="14"
              fill={fill('legs')} className="transition-all duration-500" />

            {/* Hamstrings */}
            <ellipse cx="31" cy="182" rx="9" ry="24"
              fill={fill('legs')} className="transition-all duration-500"
              style={{ filter: hasMuscle('legs') ? 'drop-shadow(0 0 4px rgba(249,115,22,0.5))' : 'none' }} />
            <ellipse cx="89" cy="182" rx="9" ry="24"
              fill={fill('legs')} className="transition-all duration-500"
              style={{ filter: hasMuscle('legs') ? 'drop-shadow(0 0 4px rgba(249,115,22,0.5))' : 'none' }} />
          </svg>
        </div>
      </div>

      {/* Legend */}
      <div className="w-full grid grid-cols-4 gap-2">
        {Object.entries(MUSCLE_LABELS).map(([key, label]) => {
          const val = intensityMap[key] || 0;
          const pct = maxVal > 0 ? Math.round((val / maxVal) * 100) : 0;
          return (
            <div key={key} className={`rounded-xl p-2 text-center transition-all ${val > 0 ? 'bg-orange-50 dark:bg-orange-950/30' : 'bg-gray-50 dark:bg-slate-800/30'}`}>
              <div className="text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">{label}</div>
              <div className={`text-sm font-black ${val > 0 ? 'text-orange-500' : 'text-gray-300 dark:text-gray-400'}`}>
                {val > 0 ? `${val}` : '—'}
              </div>
              {val > 0 && (
                <div className="mt-1 h-1 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-orange-400 to-red-500 rounded-full transition-all duration-700"
                    style={{ width: `${pct}%` }} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Top 3 */}
      {sorted.length > 0 && (
        <div className="w-full">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Most Trained This Period</p>
          <div className="flex gap-2">
            {sorted.map(([key, val], i) => (
              <div key={key} className="flex-1 bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-200 dark:border-orange-900/40 rounded-xl p-3 text-center">
                <div className="text-base">{i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}</div>
                <div className="text-xs font-black text-gray-800 dark:text-white mt-1">{MUSCLE_LABELS[key] || key}</div>
                <div className="text-xs text-orange-500 font-bold">{val} sets</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MuscleHeatmap;
