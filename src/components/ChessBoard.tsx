import { Chessboard } from 'react-chessboard';

type Square = string;

export default function ChessBoard({
  fen,
  bestMove,
}: {
  fen: string;
  bestMove?: string;
}) {
  const getCustomStyles = () => {
    if (!bestMove || bestMove.length !== 4) return {};
    const from = bestMove.substring(0, 2) as Square;
    const to = bestMove.substring(2, 4) as Square;
    return {
      [from]: { backgroundColor: 'rgba(255, 215, 0, 0.6)' },
      [to]: { backgroundColor: 'rgba(50, 205, 50, 0.6)' },
    };
  };

  return (
    <div style={{ width: '100%', maxWidth: '500px', margin: '1rem auto' }}>
      <Chessboard
        position={fen}
        arePiecesDraggable={false}
        customSquareStyles={getCustomStyles()}
        boardOrientation="white"
      />
    </div>
  );
}
