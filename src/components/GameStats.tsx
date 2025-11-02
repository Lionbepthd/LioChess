// src/components/GameStats.tsx
interface Props {
  moves: any[];
  blunders: number[];
  inaccuracies: number[];
  dubious: number[];
}

export default function GameStats({ moves, blunders, inaccuracies, dubious }: Props) {
  const totalMoves = moves.length - 1;
  const accuracy = totalMoves > 0 ? ((totalMoves - blunders.length - inaccuracies.length - dubious.length) / totalMoves) * 100 : 0;

  return (
    <div style={{ marginTop: '2rem', padding: '1rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
      <h3>Statistik Permainan</h3>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        <li><strong>Total Langkah:</strong> {totalMoves}</li>
        <li><strong>Blunder:</strong> {blunders.length}</li>
        <li><strong>Inaccuracy:</strong> {inaccuracies.length}</li>
        <li><strong>Dubious Move:</strong> {dubious.length}</li>
        <li><strong>Akurasi:</strong> {accuracy.toFixed(1)}%</li>
      </ul>
    </div>
  );
}
