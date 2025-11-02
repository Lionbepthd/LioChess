import { Chess } from 'chess.js';

export function parsePgnToMoves(pgn: string) {
  const game = new Chess();
  const moves: { fen: string; san: string; ply: number }[] = [];

  try {
    game.loadPgn(pgn); // Hapus opsi { sloppy: true }
  } catch (e) {
    console.error('PGN parsing error:', e);
    return [];
  }

  const history = game.history({ verbose: true });
  const tempGame = new Chess();
  moves.push({ fen: tempGame.fen(), san: '', ply: 0 });

  for (let i = 0; i < history.length; i++) {
    const move = history[i];
    tempGame.move(move);
    moves.push({
      fen: tempGame.fen(),
      san: move.san,
      ply: i + 1,
    });
  }

  return moves;
}
