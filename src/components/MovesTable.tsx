// src/components/MovesTable.tsx
import { AnalysisResult } from '../types';

interface Props {
  moves: { san: string; ply: number }[];
  analysisHistory: Record<number, AnalysisResult>;
  comments: Record<number, string>;
  blunders: number[];
  inaccuracies: number[];
  dubious: number[];
  currentPly: number;
  onMoveClick: (ply: number) => void;
}

const getMoveTypeClass = (ply: number, blunders: number[], inaccuracies: number[], dubious: number[]) => {
  if (blunders.includes(ply)) return 'blunder';
  if (inaccuracies.includes(ply)) return 'inaccuracy';
  if (dubious.includes(ply)) return 'dubious';
  return '';
};

const getSymbolFromComment = (comment: string) => {
  switch (comment) {
    case 'Blunder!': return '??';
    case 'Inaccuracy': return '?';
    case 'Dubious move': return '?!';
    case 'Good move': return '!';
    default: return '';
  }
};

export default function MovesTable({ moves, analysisHistory, comments, blunders, inaccuracies, dubious, currentPly, onMoveClick }: Props) {
  const renderMoves = () => {
    const rows = [];
    for (let i = 0; i < moves.length; i += 2) {
      const whiteMove = moves[i];
      const blackMove = moves[i + 1];

      const whiteAnalysis = analysisHistory[whiteMove.ply];
      const blackAnalysis = analysisHistory[blackMove?.ply];

      const whiteComment = comments[whiteMove.ply] || '';
      const blackComment = comments[blackMove?.ply] || '';

      const whiteSymbol = getSymbolFromComment(whiteComment);
      const blackSymbol = getSymbolFromComment(blackComment);

      const whiteClass = getMoveTypeClass(whiteMove.ply, blunders, inaccuracies, dubious);
      const blackClass = blackMove ? getMoveTypeClass(blackMove.ply, blunders, inaccuracies, dubious) : '';

      rows.push(
        <tr
          key={whiteMove.ply}
          onClick={() => onMoveClick(whiteMove.ply)}
          style={{
            backgroundColor: currentPly === whiteMove.ply ? '#dbeafe' : 'transparent',
            cursor: 'pointer',
          }}
        >
          <td style={{ textAlign: 'right', padding: '0.25rem 0.5rem' }}>{Math.ceil(whiteMove.ply / 2)}.</td>
          <td className={whiteClass} style={{ padding: '0.25rem 0.5rem', color: whiteClass === 'blunder' ? '#dc2626' : whiteClass === 'inaccuracy' ? '#f59e0b' : whiteClass === 'dubious' ? '#6366f1' : 'inherit' }}>
            {whiteMove.san} {whiteSymbol}
            {whiteAnalysis && <div style={{ fontSize: '0.8em', color: '#64748b' }}>{typeof whiteAnalysis.score === 'number' ? whiteAnalysis.score.toFixed(2) : whiteAnalysis.score}</div>}
          </td>
          <td className={blackClass} style={{ padding: '0.25rem 0.5rem', color: blackClass === 'blunder' ? '#dc2626' : blackClass === 'inaccuracy' ? '#f59e0b' : blackClass === 'dubious' ? '#6366f1' : 'inherit' }}>
            {blackMove && (
              <>
                {blackMove.san} {blackSymbol}
                {blackAnalysis && <div style={{ fontSize: '0.8em', color: '#64748b' }}>{typeof blackAnalysis.score === 'number' ? blackAnalysis.score.toFixed(2) : blackAnalysis.score}</div>}
              </>
            )}
          </td>
        </tr>
      );
    }
    return rows;
  };

  return (
    <div style={{ marginTop: '2rem', overflowX: 'auto' }}>
      <h3>Langkah-Langkah Permainan</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #e2e8f0' }}>
        <thead>
          <tr style={{ backgroundColor: '#f8fafc' }}>
            <th style={{ padding: '0.5rem', border: '1px solid #e2e8f0' }}>No</th>
            <th style={{ padding: '0.5rem', border: '1px solid #e2e8f0' }}>Putih</th>
            <th style={{ padding: '0.5rem', border: '1px solid #e2e8f0' }}>Hitam</th>
          </tr>
        </thead>
        <tbody>
          {renderMoves()}
        </tbody>
      </table>
    </div>
  );
}
