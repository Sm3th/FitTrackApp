import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MuscleGroup, MuscleScore, MUSCLE_LABELS } from '../utils/bodyScore';

interface Props {
  scores: Record<MuscleGroup, MuscleScore>;
  selectedMuscle: MuscleGroup | null;
  onSelect: (muscle: MuscleGroup | null) => void;
}

// [cx, cy, rx, ry] — centers from calibration tool, radii from anatomy proportions
interface MuscleRegion {
  muscle: MuscleGroup;
  ellipses: [number, number, number, number][];
  badge: [number, number];
}

const REGIONS: MuscleRegion[] = [
  // ── FRONT (calibrated centers) ────────────────────────────
  { muscle: 'chest',     ellipses: [[246, 413, 100, 52]],                                                                          badge: [246, 413] },
  { muscle: 'core',      ellipses: [[233, 518,  60, 72]],                                                                          badge: [233, 518] },
  { muscle: 'shoulders', ellipses: [[174, 378, 48, 52], [397, 372, 48, 52]],                                                      badge: [174, 378] },
  { muscle: 'biceps',    ellipses: [[154, 490, 34, 68], [394, 483, 34, 68]],                                                      badge: [154, 450] },
  { muscle: 'legs',      ellipses: [[195, 808, 56, 110],[328, 811, 56, 110]],                                                     badge: [261, 808] },

  // ── BACK (calibrated centers) ─────────────────────────────
  { muscle: 'back',      ellipses: [[755, 322, 108, 44], [812, 506, 120, 82]],                                                    badge: [783, 415] },
  { muscle: 'triceps',   ellipses: [[612, 468,  36, 68], [899, 463,  36, 68]],                                                    badge: [612, 430] },
  { muscle: 'legs',      ellipses: [[794, 693, 106, 62], [678, 867, 54, 98], [822, 865, 54, 98], [673, 1039, 33, 55], [814, 1039, 33, 55]], badge: [794, 680] },
];

// Generate smooth ellipse as SVG path (4 cubic bezier arcs)
function ep(cx: number, cy: number, rx: number, ry: number): string {
  const k = 0.5523;
  const kx = rx * k, ky = ry * k;
  return (
    `M ${cx},${cy - ry} ` +
    `C ${cx + kx},${cy - ry} ${cx + rx},${cy - ky} ${cx + rx},${cy} ` +
    `C ${cx + rx},${cy + ky} ${cx + kx},${cy + ry} ${cx},${cy + ry} ` +
    `C ${cx - kx},${cy + ry} ${cx - rx},${cy + ky} ${cx - rx},${cy} ` +
    `C ${cx - rx},${cy - ky} ${cx - kx},${cy - ry} ${cx},${cy - ry} Z`
  );
}

function muscleColor(score: MuscleScore | undefined): string {
  if (!score || score.totalSets === 0) return '#94a3b8';
  return score.color;
}

function vividColor(score: MuscleScore | undefined): string {
  if (!score || score.totalSets === 0) return '#94a3b8';
  const s = score.score;
  if (s >= 90) return '#f59e0b';
  if (s >= 75) return '#22c55e';
  if (s >= 55) return '#3b82f6';
  if (s >= 35) return '#a855f7';
  if (s >= 15) return '#f97316';
  return '#ef4444';
}

function buildRenderList() {
  const map: Record<string, MuscleRegion[]> = {};
  for (const r of REGIONS) {
    if (!map[r.muscle]) map[r.muscle] = [];
    map[r.muscle].push(r);
  }
  return map;
}

const BodyScoreMap: React.FC<Props> = ({ scores, selectedMuscle, onSelect }) => {
  const { t } = useTranslation();
  const [imgLoaded, setImgLoaded] = useState(false);
  const regionMap = useMemo(buildRenderList, []);
  const muscleLabel = (m: MuscleGroup) => t(`bodyScore.muscles.${m}` as any, MUSCLE_LABELS[m]);
  const anySelected = selectedMuscle !== null;

  return (
    <div className="flex flex-col items-center gap-4 w-full">

      <div
        className="relative w-full max-w-sm mx-auto rounded-2xl overflow-hidden"
        style={{ background: '#1e293b', aspectRatio: '1024/1536' }}
      >
        <img
          src="/anatomy.png"
          alt="Anatomy"
          onLoad={() => setImgLoaded(true)}
          className="w-full h-full object-cover"
          style={{ opacity: imgLoaded ? 1 : 0, transition: 'opacity 0.3s' }}
          draggable={false}
        />

        {imgLoaded && (
          <svg
            viewBox="0 0 1024 1536"
            className="absolute inset-0 w-full h-full"
            style={{ pointerEvents: 'none' }}
          >
            <defs>
              {/* Wide halo glow */}
              <filter id="halo" x="-100%" y="-100%" width="300%" height="300%">
                <feGaussianBlur stdDeviation="22" result="blur" />
              </filter>
              {/* Edge glow */}
              <filter id="edge" x="-40%" y="-40%" width="180%" height="180%">
                <feGaussianBlur stdDeviation="7" result="blur" />
              </filter>
            </defs>

            {/* FRONT / BACK labels */}
            <text x={261} y={52} textAnchor="middle" fontSize="26" fontWeight="700"
              fill="rgba(255,255,255,0.28)" style={{ fontFamily: 'sans-serif', letterSpacing: '4px' }}>
              {t('bodyScore.front', 'FRONT').toUpperCase()}
            </text>
            <text x={783} y={52} textAnchor="middle" fontSize="26" fontWeight="700"
              fill="rgba(255,255,255,0.28)" style={{ fontFamily: 'sans-serif', letterSpacing: '4px' }}>
              {t('bodyScore.back', 'BACK').toUpperCase()}
            </text>

            {Object.entries(regionMap).map(([muscle, regions]) => {
              const m = muscle as MuscleGroup;
              const score = scores[m];
              const selected = selectedMuscle === m;
              const vivid = vividColor(score);

              return (
                <g
                  key={muscle}
                  onClick={() => onSelect(selected ? null : m)}
                  style={{ cursor: 'pointer', pointerEvents: 'all' }}
                >
                  {regions.flatMap((region, ri) =>
                    region.ellipses.map((e, ei) => {
                      const [cx, cy, rx, ry] = e;
                      const d = ep(cx, cy, rx, ry);
                      return (
                        <g key={`${ri}-${ei}`}>

                          {/* ① Outer halo — pulsing, only when selected */}
                          {selected && (
                            <path d={d} fill={vivid} filter="url(#halo)">
                              <animate
                                attributeName="opacity"
                                values="0.45;0.80;0.45"
                                dur="1.8s"
                                repeatCount="indefinite"
                              />
                            </path>
                          )}

                          {/* ② Edge blur ring */}
                          {selected && (
                            <path d={d} fill="none"
                              stroke={vivid} strokeWidth="10"
                              opacity={0.6} filter="url(#edge)"
                            />
                          )}

                          {/* ③ Solid fill — multiply tints the muscle texture */}
                          <path
                            d={d}
                            fill={vivid}
                            opacity={selected ? 0.78 : anySelected ? 0.05 : 0.25}
                            style={{
                              mixBlendMode: selected ? 'multiply' : 'normal',
                              transition: 'opacity 0.25s',
                            }}
                          />

                          {/* ④ Sharp outline */}
                          {selected && (
                            <path d={d} fill="none"
                              stroke={vivid} strokeWidth="3" opacity={0.95}
                            />
                          )}
                        </g>
                      );
                    })
                  )}

                  {/* Grade badge */}
                  {score && score.totalSets > 0 && (() => {
                    const [bx, by] = regions[0].badge;
                    const op = selected ? 1 : anySelected ? 0.12 : 0.88;
                    return (
                      <g style={{ opacity: op, transition: 'opacity 0.25s' }}>
                        {selected && (
                          <circle cx={bx} cy={by} r={34} fill={vivid} opacity={0.2} filter="url(#edge)" />
                        )}
                        <circle cx={bx} cy={by} r={26} fill={vivid} />
                        <text x={bx} y={by + 9} textAnchor="middle"
                          fontSize="22" fontWeight="900" fill="white"
                          style={{ pointerEvents: 'none', fontFamily: 'sans-serif' }}>
                          {score.grade}
                        </text>
                      </g>
                    );
                  })()}
                </g>
              );
            })}

            {/* Selected muscle label pill */}
            {selectedMuscle && (() => {
              const vivid = vividColor(scores[selectedMuscle]);
              const isFront = ['chest', 'core', 'shoulders', 'biceps', 'legs'].includes(selectedMuscle);
              const lx = isFront ? 261 : 783;
              return (
                <g>
                  <rect x={lx - 84} y={1477} width={168} height={44} rx={22} fill={vivid} opacity={0.92} />
                  <text x={lx} y={1505} textAnchor="middle" fontSize="22" fontWeight="900" fill="white"
                    style={{ fontFamily: 'sans-serif' }}>
                    {muscleLabel(selectedMuscle).toUpperCase()}
                  </text>
                </g>
              );
            })()}
          </svg>
        )}

        {!imgLoaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-white/20 border-t-white/60 rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Score legend grid */}
      <div className="w-full grid grid-cols-4 gap-2">
        {(['chest','back','shoulders','biceps','triceps','legs','core','cardio'] as MuscleGroup[]).map(muscle => {
          const s = scores[muscle];
          const active = selectedMuscle === muscle;
          const color = muscleColor(s);
          return (
            <button
              key={muscle}
              onClick={() => onSelect(active ? null : muscle)}
              className="rounded-xl p-2.5 text-center transition-all duration-200 active:scale-95"
              style={{
                background: active ? `color-mix(in srgb, ${color} 18%, transparent)` : 'rgba(255,255,255,0.03)',
                border: active ? `1px solid color-mix(in srgb, ${color} 45%, transparent)` : '1px solid rgba(255,255,255,0.06)',
                boxShadow: active ? `0 0 14px color-mix(in srgb, ${color} 30%, transparent)` : 'none',
              }}
            >
              <div className="text-[9px] font-bold text-white/40 uppercase tracking-wide mb-1">
                {muscleLabel(muscle)}
              </div>
              <div className="text-base font-black" style={{ color }}>
                {s && s.totalSets > 0 ? s.grade : '—'}
              </div>
              {s && s.totalSets > 0 && (
                <div className="text-[9px] text-white/30 font-medium">{s.score}%</div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BodyScoreMap;
