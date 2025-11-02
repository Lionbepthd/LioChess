// @ts-nocheck
importScripts('/stockfish.wasm');

let stockfish = null;
let lastScore = null;

self.onmessage = async (e) => {
  const { type, fen, depth } = e.data;

  if (type === 'init') {
    const sf = await Stockfish();
    stockfish = sf;
    stockfish.postMessage('uci');
    stockfish.postMessage('isready');
    self.postMessage({ type: 'ready' });
  }

  if (type === 'analyze' && stockfish && fen) {
    lastScore = null;
    stockfish.postMessage(`position fen ${fen}`);
    stockfish.postMessage(`go depth ${depth || 12}`);

    const handler = (msg) => {
      const line = msg.data;
      if (line.startsWith('info') && line.includes('score')) {
        const match = line.match(/score (cp|mate) (-?\d+)/);
        if (match) {
          const type = match[1];
          const value = parseInt(match[2], 10);
          lastScore = {
            score: type === 'cp' ? value / 100 : (value > 0 ? `#${value}` : `#-${Math.abs(value)}`),
          };
        }
      }
      if (line.startsWith('bestmove')) {
        const bestMove = line.split(' ')[1];
        self.postMessage({
          type: 'analysis',
          ...lastScore,
          bestmove: bestMove,
        });
        stockfish.removeEventListener('message', handler);
      }
    };

    stockfish.addEventListener('message', handler);
  }
};
