import { Chessboard } from 'react-chessboard';

type Square = string;

export default function ChessBoard({
  fen,
  bestMove,
  boardOrientation = 'white',
}: {
  fen: string;
  bestMove?: string;
  boardOrientation?: 'white' | 'black';
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

  // Kita hapus definisi tipe Arrow dan tipe return
  const getCustomArrows = () => {
    if (!bestMove || bestMove.length !== 4) return [];
    const from = bestMove.substring(0, 2) as Square;
    const to = bestMove.substring(2, 4) as Square;
    // Kirimkan array objek secara langsung
    return [{ from, to }];
  };

  return (
    <div style={{ width: '100%', maxWidth: '500px', margin: '1rem auto' }}>
      <Chessboard
        position={fen}
        arePiecesDraggable={false}
        customSquareStyles={getCustomStyles()}
        customArrows={getCustomArrows()} // <-- Ini sekarang sesuai
        boardOrientation={boardOrientation}
        customArrowColor="#1e40af"
      />
    </div>
  );
}
