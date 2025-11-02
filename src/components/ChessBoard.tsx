import { Chessboard } from 'react-chessboard'; // <-- Hapus 'Arrow' dari sini

// Definisikan tipe Arrow secara lokal
type Arrow = {
  from: string;
  to: string;
};

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

  const getCustomArrows = (): Arrow[] => { // <-- Gunakan tipe lokal
    if (!bestMove || bestMove.length !== 4) return [];
    const from = bestMove.substring(0, 2) as Square;
    const to = bestMove.substring(2, 4) as Square;
    return [{ from, to }]; // <-- Format ini benar
  };

  return (
    <div style={{ width: '100%', maxWidth: '500px', margin: '1rem auto' }}>
      <Chessboard
        position={fen}
        arePiecesDraggable={false}
        customSquareStyles={getCustomStyles()}
        customArrows={getCustomArrows()} // <-- Sekarang type-safe
        boardOrientation={boardOrientation}
        customArrowColor="#1e40af"
      />
    </div>
  );
}
