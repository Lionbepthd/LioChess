import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { AnalysisResult } from '../types';

interface Props {
  moves: { san: string; ply: number }[];
  analysisHistory: Record<number, AnalysisResult>;
  blunders: number[];       // <-- ditambahkan
  inaccuracies: number[];   // <-- ditambahkan
  dubious: number[];        // <-- ditambahkan
}

export default function EvaluationChart({ moves, analysisHistory, blunders, inaccuracies, dubious }: Props) {
  const data = moves.map((move, index) => {
    const ana = analysisHistory[index];
    if (!ana) return null;

    let evalValue: number;
    if (typeof ana.score === 'string' && ana.score.startsWith('#')) {
      const mateNum = parseInt(ana.score.replace('#', ''), 10);
      evalValue = mateNum > 0 ? 10 : -10;
    } else {
      evalValue = typeof ana.score === 'number' ? ana.score : parseFloat(String(ana.score)) || 0;
    }

    return {
      ply: index,
      move: index === 0 ? 'Start' : move.san,
      evaluation: evalValue,
    };
  }).filter(Boolean);

  if (data.length === 0) return null;

  return (
    <div style={{ width: '100%', height: 300, marginTop: '2rem' }}>
      <h3 style={{ textAlign: 'center' }}>Evaluasi Mesin (Centipawn)</h3>
      <ResponsiveContainer>
        <LineChart data={data}>
          <XAxis dataKey="ply" />
          <YAxis domain={[-5, 5]} />
          <Tooltip
            formatter={(value) => [`${value} CP`, 'Evaluasi']}
            labelFormatter={(ply) => `Langkah ${ply}`}
          />
          <Line
            type="monotone"
            dataKey="evaluation"
            stroke="#4f46e5"
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 6, stroke: '#1e40af' }}
          />
          {/* Highlight blunder */}
          {blunders.map(ply => (
            <ReferenceLine
              key={`blunder-${ply}`}
              x={ply}
              stroke="#dc2626"
              strokeDasharray="3 3"
              label={{ value: 'Blunder', position: 'top', fill: '#dc2626' }}
            />
          ))}
          {/* Highlight inaccuracy */}
          {inaccuracies.map(ply => (
            <ReferenceLine
              key={`inacc-${ply}`}
              x={ply}
              stroke="#f59e0b"
              strokeDasharray="3 3"
              label={{ value: 'Inacc', position: 'top', fill: '#f59e0b' }}
            />
          ))}
          {/* Highlight dubious */}
          {dubious.map(ply => (
            <ReferenceLine
              key={`dub-${ply}`}
              x={ply}
              stroke="#6366f1"
              strokeDasharray="3 3"
              label={{ value: 'Dubious', position: 'top', fill: '#6366f1' }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
