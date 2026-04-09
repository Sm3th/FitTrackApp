import { useState } from 'react';

interface Point { x: number; y: number; label: string; }

const MUSCLES = ['chest','core','shoulders_L','shoulders_R','biceps_L','biceps_R',
  'legs_quad_L','legs_quad_R','back_traps','back_lats','triceps_L','triceps_R',
  'glutes','hamstring_L','hamstring_R'];

const CalibratePage = () => {
  const [points, setPoints] = useState<Point[]>([]);
  const [nextIdx, setNextIdx] = useState(0);

  const handleClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const scaleX = 1024 / rect.width;
    const scaleY = 1536 / rect.height;
    const x = Math.round((e.clientX - rect.left) * scaleX);
    const y = Math.round((e.clientY - rect.top) * scaleY);
    const label = MUSCLES[nextIdx] || `point_${nextIdx}`;
    setPoints(prev => [...prev, { x, y, label }]);
    setNextIdx(i => i + 1);
  };

  const undo = () => {
    setPoints(prev => prev.slice(0, -1));
    setNextIdx(i => Math.max(0, i - 1));
  };

  const output = points.map(p => `  { muscle: '${p.label}', cx: ${p.x}, cy: ${p.y} }`).join(',\n');

  return (
    <div className="min-h-screen bg-black text-white flex gap-4 p-4">
      <div className="flex-1 relative" style={{ maxWidth: 400 }}>
        <p className="text-yellow-400 font-bold mb-2 text-sm">
          Sıradaki: <span className="text-white">{MUSCLES[nextIdx] ?? 'Bitti!'}</span> — Kas merkezine tıkla
        </p>
        <div style={{ position: 'relative', aspectRatio: '1024/1536' }}>
          <img src="/anatomy.png" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} draggable={false} />
          <svg
            viewBox="0 0 1024 1536"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', cursor: 'crosshair' }}
            onClick={handleClick}
          >
            {/* 100px grid */}
            {Array.from({ length: 16 }, (_, i) => (
              <line key={`h${i}`} x1={0} y1={i * 100} x2={1024} y2={i * 100} stroke="rgba(255,255,0,0.12)" strokeWidth={1} />
            ))}
            {Array.from({ length: 11 }, (_, i) => (
              <line key={`v${i}`} x1={i * 100} y1={0} x2={i * 100} y2={1536} stroke="rgba(255,255,0,0.12)" strokeWidth={1} />
            ))}
            {/* Grid labels */}
            {Array.from({ length: 16 }, (_, i) => (
              <text key={`hl${i}`} x={4} y={i * 100 - 3} fontSize="16" fill="rgba(255,255,0,0.4)">{i * 100}</text>
            ))}
            {Array.from({ length: 11 }, (_, i) => (
              <text key={`vl${i}`} x={i * 100 + 2} y={18} fontSize="16" fill="rgba(255,255,0,0.4)">{i * 100}</text>
            ))}
            {/* Clicked points */}
            {points.map((p, i) => (
              <g key={i}>
                <circle cx={p.x} cy={p.y} r={14} fill="rgba(255,60,60,0.7)" stroke="red" strokeWidth={2} />
                <text x={p.x + 16} y={p.y + 6} fontSize="20" fontWeight="bold" fill="red"
                  style={{ fontFamily: 'monospace' }}>{p.label} ({p.x},{p.y})</text>
              </g>
            ))}
          </svg>
        </div>
        <button onClick={undo} className="mt-2 px-4 py-2 bg-red-700 rounded font-bold text-sm">Geri Al</button>
      </div>

      <div className="flex-1">
        <p className="text-green-400 font-bold mb-2">Koordinatlar (kopyala):</p>
        <pre className="bg-slate-900 p-3 rounded text-xs text-green-300 overflow-auto whitespace-pre-wrap">
          {output || '(henüz tıklanmadı)'}
        </pre>
        <p className="text-white/40 text-xs mt-3">
          Her kas için <strong>merkez noktasına</strong> tıkla.<br/>
          Koordinatları kopyalayıp bana ver — ellipse boyutlarını ben eklerim.
        </p>
      </div>
    </div>
  );
};

export default CalibratePage;
