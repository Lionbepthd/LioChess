import { useState, useEffect, useRef } from 'react';
import ChessBoard from '../components/ChessBoard';
import EvaluationChart from '../components/EvaluationChart';
import { StockfishWorker } from '../lib/stockfishWorker';
import { parsePgnToMoves } from '../lib/pgnParser';
import { detectBlunders } from '../lib/blunderDetector';
import { saveAnalysisToStorage, loadAnalysisFromStorage } from '../lib/storage';
import { downloadFile } from '../lib/utils';
import type { AnalysisResult } from '../types';

export default function Home() {
  const [input, setInput] = useState('');
  const [originalPgn, setOriginalPgn] = useState('');
  const [moves, setMoves] = useState<any[]>([]);
  const [currentPly, setCurrentPly] = useState(0);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [analysisHistory, setAnalysisHistory] = useState<Record<number, AnalysisResult>>({});
  const [blunders, setBlunders] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const sfRef = useRef<StockfishWorker | null>(null);

  // Inisialisasi: coba muat dari localStorage
  useEffect(() => {
    const saved = loadAnalysisFromStorage();
    if (saved) {
      const parsed = parsePgnToMoves(saved.pgn);
      if (parsed.length > 0) {
        setMoves(parsed);
        setOriginalPgn(saved.pgn);
        setInput(saved.pgn);
        setAnalysisHistory(saved.analysisHistory || {});
        setBlunders(saved.blunders || []);
        setCurrentPly(0);
      }
    }

    sfRef.current = new StockfishWorker();
    return () => sfRef.current?.terminate();
  }, []);

  // Simpan ke localStorage saat ada perubahan signifikan
  useEffect(() => {
    if (moves.length > 0 && Object.keys(analysisHistory).length > 0) {
      saveAnalysisToStorage(originalPgn, analysisHistory, blunders);
    }
  }, [analysisHistory, blunders, originalPgn, moves.length]);

  // Analisis otomatis saat langkah berubah
  useEffect(() => {
    if (moves.length === 0 || !sfRef.current) return;
    const ply = currentPly;
    const currentFen = moves[ply]?.fen;
    if (!currentFen) return;

    if (analysisHistory[ply]) {
      setAnalysis(analysisHistory[ply]);
      return;
    }

    setAnalysis(null);
    sfRef.current.analyze(currentFen, 10).then((result) => {
      const newAnalysis = {
        score: result.score,
        bestmove: result.bestmove,
      };
      setAnalysis(newAnalysis);
      setAnalysisHistory((prev) => ({ ...prev, [ply]: newAnalysis }));
    });
  }, [currentPly, moves, analysisHistory]);

  // Deteksi blunder saat history berubah
  useEffect(() => {
    if (Object.keys(analysisHistory).length > 1) {
      const detected = detectBlunders(analysisHistory, 1.0);
      setBlunders(detected);
    }
  }, [analysisHistory]);

  const fetchGamesFromChessCom = async (username: string) => {
    setLoading(true);
    try {
      const now = new Date();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const year = now.getFullYear();
      const res = await fetch(`https://api.chess.com/pub/player/${username}/games/${year}/${month}`);
      const data = await res.json();
      if (data.games?.length > 0) {
        const lastGame = data.games[data.games.length - 1];
        loadPgn(lastGame.pgn);
      } else {
        alert('Tidak ada game ditemukan bulan ini.');
      }
    } catch (err) {
      console.error(err);
      alert('Gagal mengambil data. Pastikan username benar.');
    }
    setLoading(false);
  };

  const loadPgn = (pgnText: string) => {
    const parsedMoves = parsePgnToMoves(pgnText);
    if (parsedMoves.length === 0) {
      alert('PGN tidak valid.');
      return;
    }
    setMoves(parsedMoves);
    setOriginalPgn(pgnText);
    setCurrentPly(0);
    setAnalysisHistory({});
    setBlunders([]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    if (input.includes('[Event')) {
      loadPgn(input);
    } else {
      fetchGamesFromChessCom(input.trim());
    }
  };

  const goToPly = (ply: number) => {
    if (ply >= 0 && ply < moves.length) {
      setCurrentPly(ply);
    }
  };

  const currentFen = moves[currentPly]?.fen || 'start';
  const bestMove = analysis?.bestmove;

  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui', maxWidth: '900px', margin: '0 auto' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>LioChess Analyzer</h1>

      <form onSubmit={handleSubmit} style={{ marginBottom: '2rem' }}>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Username Chess.com atau paste PGN di sini..."
          rows={4}
          style={{ width: '100%', padding: '0.75rem', marginBottom: '0.75rem' }}
        />
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '0.5rem 1.5rem',
            backgroundColor: '#4f46e5',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'Loading...' : 'Analisis'}
        </button>
      </form>

      {moves.length > 0 && (
        <>
          <div style={{ textAlign: 'center', margin: '1.5rem 0' }}>
            <button onClick={() => goToPly(0)} disabled={currentPly === 0} style={{ margin: '0 0.25rem' }}>
              ⏪
            </button>
            <button onClick={() => goToPly(currentPly - 1)} disabled={currentPly === 0} style={{ margin: '0 0.25rem' }}>
              ◀️
            </button>
            <span style={{ margin: '0 1rem', fontWeight: 'bold' }}>
              Langkah: {currentPly} / {moves.length - 1}
            </span>
            <button
              onClick={() => goToPly(currentPly + 1)}
              disabled={currentPly >= moves.length - 1}
              style={{ margin: '0 0.25rem' }}
            >
              ▶️
            </button>
            <button
              onClick={() => goToPly(moves.length - 1)}
              disabled={currentPly >= moves.length - 1}
              style={{ margin: '0 0.25rem' }}
            >
              ⏩
            </button>
          </div>

          <ChessBoard fen={currentFen} bestMove={bestMove} />

          {analysis && (
            <div
              style={{
                marginTop: '1rem',
                padding: '1rem',
                background: '#f8fafc',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
              }}
            >
              <div>
                <strong>Evaluasi:</strong>{' '}
                {typeof analysis.score === 'string'
                  ? analysis.score
                  : `${analysis.score >= 0 ? '+' : ''}${analysis.score.toFixed(2)}`}
              </div>
              <div>
                <strong>Best move:</strong> {analysis.bestmove}
              </div>
              {blunders.includes(currentPly) && (
                <div style={{ color: '#dc2626', fontWeight: 'bold', marginTop: '0.5rem' }}>
                  ⚠️ Blunder terdeteksi!
                </div>
              )}
            </div>
          )}

          <EvaluationChart moves={moves} analysisHistory={analysisHistory} />

          {Object.keys(analysisHistory).length > 0 && (
            <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
              <button
                onClick={() => {
                  const reportLines = [];
                  for (let ply = 0; ply < moves.length; ply++) {
                    const move = moves[ply];
                    const ana = analysisHistory[ply];
                    if (!ana) continue;
                    const moveNotation = ply === 0 ? 'Start' : `${Math.ceil(ply / 2)}. ${move.san}`;
                    reportLines.push(
                      `${moveNotation.padEnd(12)} | Eval: ${ana.score.toString().padEnd(6)} | Best: ${ana.bestmove}`
                    );
                  }
                  downloadFile('liochess-analysis.txt', reportLines.join('\n'));
                }}
                style={{
                  padding: '0.5rem 1rem',
                  marginRight: '0.5rem',
                  backgroundColor: '#0d9488',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                }}
              >
                📥 TXT
              </button>
              <button
                onClick={() => {
                  const json = moves.map((move, ply) => ({
                    ply,
                    fen: move.fen,
                    san: ply === 0 ? 'start' : move.san,
                    analysis: analysisHistory[ply] || null,
                  }));
                  downloadFile('liochess-analysis.json', JSON.stringify(json, null, 2));
                }}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#7c3aed',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                }}
              >
                📤 JSON
              </button>
            </div>
          )}
        </>
      )}

      <footer style={{ textAlign: 'center', marginTop: '3rem', color: '#64748b' }}>
        © {new Date().getFullYear()} LIONBEPTHD • LioChess
      </footer>
    </div>
  );
        }
