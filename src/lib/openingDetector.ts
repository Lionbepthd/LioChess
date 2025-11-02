// src/lib/openingDetector.ts
import { Chess } from 'chess.js';

const openingDB = [
  { fen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1', name: 'King\'s Pawn Game' },
  { fen: 'rnbqkbnr/ppp1pppp/8/3p4/4P3/8/PPPP1PPP/RNBQKBNR w KQkq d6 0 2', name: 'Scandinavian Defense' },
  { fen: 'rnbqkbnr/pppp1ppp/4p3/8/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2', name: 'French Defense' },
  { fen: 'rnbqkb1r/ppp1pppp/5n2/3p4/3PP3/8/PPP2PPP/RNBQKBNR w KQkq d6 0 3', name: 'Alekhine Defense' },
];

export function detectOpening(moves: { san: string }[]): string {
  const game = new Chess();
  let openingName = 'Unknown Opening';

  for (let i = 0; i < moves.length; i++) {
    if (!moves[i].san) continue;
    try {
      game.move(moves[i].san);
      const fen = game.fen();
      const opening = openingDB.find(o => o.fen === fen);
      if (opening) {
        openingName = opening.name;
      }
    } catch (e) {
      break;
    }
  }

  return openingName;
}
