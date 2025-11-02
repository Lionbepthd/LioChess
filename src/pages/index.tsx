import { useState, useEffect, useRef } from 'react';
import ChessBoard from '../components/ChessBoard';
import EvaluationChart from '../components/EvaluationChart';
import { StockfishWorker } from '../lib/stockfishWorker';
import { parsePgnToMoves } from '../lib/pgnParser';
import { detectBlunders } from '../lib/blunderDetector';
import { detectOpening } from '../lib/openingDetector';
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
  const [inaccuracies, setInaccuracies] = useState<number[]>([]); // <-- ditambahkan
  const [dubious, setDubious] = useState<number[]>([]); // <-- ditambahkan
  const [comments, setComments] = useState<Record<number, string>>({}); // <-- ditambahkan
  const [opening, setOpening] = useState(''); // <-- ditambahkan
  const [loading, setLoading] = useState(false);
  const [analysisDepth, setAnalysisDepth] = useState(10); // <-- ditambahkan
  const [analysisStatus, setAnalysisStatus] = useState<'idle' | 'analyzing' | 'ready'>('idle'); // <-- ditambahkan
  const [isAnalyzingBatch, setIsAnalyzingBatch] = useState(false); // <-- ditambahkan
  const [currentBatchPly, setCurrentBatchPly] = useState(0); // <-- ditambahkan
  const [showBatchComplete, setShowBatchComplete] = useState(false); // <-- ditambahkan
  const [darkMode, setDarkMode] = useState(false); // <-- ditambahkan (opsional)

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
        setAnalysisDepth(saved.analysisDepth || 10); // <-- load depth
        setCurrentPly(0);
        // Karena history sudah ada, kita panggil deteksi ulang
        const { blunders, inaccuracies, dubious, comments } = detectBlunders(saved.analysisHistory, 1.0);
        setBlunders(blunders);
        setInaccuracies(inaccuracies);
        setDubious(dubious);
        setComments(comments);
      }
    }

    sfRef.current = new StockfishWorker();
    return () => sfRef.current?.terminate();
  }, []);

  // Simpan ke localStorage saat ada perubahan signifikan
  useEffect(() => {
    if (moves.length > 0 && Object.keys(analysisHistory).length > 0) {
      saveAnalysisToStorage(originalPgn, analysisHistory, blunders, analysisDepth); // <-- kirim depth
    }
  }, [analysisHistory, blunders, originalPly, moves.length, analysisDepth]);

  // Analisis otomatis saat langkah berubah (jika belum dianalisis)
  useEffect(() => {
    if (moves.length === 0 || !sfRef.current || analysisHistory[currentPly]) return;
    const currentFen = moves[currentPly]?.fen;
    if (!currentFen) return;

    setAnalysis(null);
    setAnalysisStatus('analyzing');
    sfRef.current.analyze(currentFen, analysisDepth).then((result) => {
      const newAnalysis = {
        score: result.score,
        bestmove: result.bestmove,
        comment: '', // Akan diisi oleh deteksi nanti
      };
      setAnalysis(newAnalysis);
      setAnalysisHistory((prev) => ({ ...prev, [currentPly]: newAnalysis }));
      setAnalysisStatus('ready');

      // Deteksi komentar & blunder setelah satu langkah baru
      const updatedHistory = { ...analysisHistory, [currentPly]: newAnalysis };
      const { blunders, inaccuracies, dubious, comments } = detectBlunders(updatedHistory, 1.0);
      setBlunders(blunders);
      setInaccuracies(inaccuracies);
      setDubious(dubious);
      setComments(comments);
    });
  }, [currentPly, moves, analysisHistory, analysisDepth]);

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
    setInaccuracies([]);
    setDubious([]);
    setComments({});
    setOpening(detectOpening(parsedMoves)); // <-- tambahkan deteksi opening
  };

  const runBatchAnalysis = async () => {
    if (!sfRef.current || moves.length === 0 || isAnalyzingBatch) return;

    setIsAnalyzingBatch(true);
    setAnalysisStatus('analyzing');
    const newAnalysisHistory: Record<number, AnalysisResult> = {};

    for (let i = 0; i < moves.length; i++) {
      const { fen } = moves[i];
      if (!fen) continue;

      setCurrentBatchPly(i);

      try {
        const result = await sfRef.current.analyze(fen, analysisDepth);
        newAnalysisHistory[i] = {
          score: result.score,
          bestmove: result.bestmove,
          comment: '', // Akan diisi oleh deteksi nanti
        };
      } catch (e) {
        console.error(`Gagal menganalisis langkah ${i}:`, e);
        newAnalysisHistory[i] = {
          score: 0,
          bestmove: '',
          comment: 'Gagal analisis',
        };
      }
    }

    setAnalysisHistory(newAnalysisHistory);

    // Deteksi blunder, inaccuracy, dubious, dan komentar setelah semua selesai
    const { blunders, inaccuracies, dubious, comments } = detectBlunders(newAnalysisHistory, 1.0);
    setBlunders(blunders);
    setInaccuracies(inaccuracies);
    setDubious(dubious);
    setComments(comments);

    setIsAnalyzingBatch(false);
    setAnalysisStatus('ready');
    setCurrentBatchPly(0);
    // Update analisis tampilan jika sedang di langkah saat ini
    setAnalysis(newAnalysisHistory[currentPly] || null);

    // Tampilkan notifikasi selesai
    setShowBatchComplete(true);
    setTimeout(() => setShowBatchComplete(false), 3000);
  };

  const goToPly = (ply: number) => {
    if (ply >= 0 && ply < moves.length) {
      setCurrentPly(ply);
    }
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

  const currentFen = moves[currentPly]?.fen || 'start';
  const bestMove = analysis?.bestmove;

  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui', maxWidth: '900px', margin: '0 auto', backgroundColor: darkMode ? '#1f2937' : 'white', color: darkMode ? 'white' : 'black' }}>
      {/* Dark Mode Toggle */}
      <button
        onClick={() => setDarkMode(!darkMode)}
        style={{
          position: 'absolute',
          top: '1rem',
          right: '1rem',
          padding: '0.5rem',
          backgroundColor: darkMode ? '#4b5563' : '#e5e7eb',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
        }}
      >
        {darkMode ? '☀️' : '🌙'}
      </button>

      <h1 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>LioChess Analyzer</h1>

      <form onSubmit={handleSubmit} style={{ marginBottom: '2rem' }}>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Username Chess.com atau paste PGN di sini..."
          rows={4}
          style={{ width: '100%', padding: '0.75rem', marginBottom: '0.75rem', backgroundColor: darkMode ? '#374151' : 'white', color: darkMode ? 'white' : 'black' }}
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
          {/* Slider Depth */}
          <div style={{ textAlign: 'center', margin: '1rem 0' }}>
            <label htmlFor="depth-slider" style={{ marginRight: '0.5rem' }}>
              <strong>Depth Analisis:</strong> {analysisDepth}
            </label>
            <input
              id="depth-slider"
              type="range"
              min="5"
              max="20"
              value={analysisDepth}
              onChange={(e) => setAnalysisDepth(parseInt(e.target.value))}
              disabled={isAnalyzingBatch}
              style={{ width: '200px', verticalAlign: 'middle' }}
            />
          </div>

          {/* Tombol Batch Analysis */}
          <div style={{ textAlign: 'center', margin: '1.5rem 0' }}>
            <button
              onClick={runBatchAnalysis}
              disabled={isAnalyzingBatch}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: isAnalyzingBatch ? '#94a3b8' : '#7c3aed',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: isAnalyzingBatch ? 'not-allowed' : 'pointer',
                marginBottom: '1rem',
              }}
            >
              {isAnalyzingBatch ? `Analisis... (${currentBatchPly} / ${moves.length - 1})` : '🔄 Analisis Batch Semua Langkah'}
            </button>
            {isAnalyzingBatch && (
              <div style={{ color: '#64748b', fontSize: '0.9rem' }}>
                Proses analisis berjalan di browser kamu...
              </div>
            )}
            {/* Status Analisis */}
            {analysisStatus === 'analyzing' && !isAnalyzingBatch && (
              <div style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                Menganalisis posisi...
              </div>
            )}
          </div>

          {/* Opening */}
          {opening && (
            <div style={{ marginTop: '0.5rem', padding: '0.5rem', background: darkMode ? '#374151' : '#f1f5f9', borderRadius: '4px' }}>
              <strong>Opening:</strong> {opening}
            </div>
          )}

          {/* Navigasi Langkah */}
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
                background: darkMode ? '#374151' : '#f8fafc',
                borderRadius: '8px',
                border: `1px solid ${darkMode ? '#4b5563' : '#e2e8f0'}`,
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
              {comments[currentPly] && (
                <div style={{ color: blunders.includes(currentPly) ? '#dc2626' : inaccuracies.includes(currentPly) ? '#f59e0b' : dubious.includes(currentPly) ? '#6366f1' : '#64748b', fontWeight: 'bold', marginTop: '0.5rem' }}>
                  {comments[currentPly]}
                </div>
              )}
            </div>
          )}

          {/* Navigasi Cepat */}
          {blunders.length > 0 && (
            <div style={{ marginTop: '1rem', textAlign: 'center' }}>
              <strong>Blunders:</strong>
              {blunders.map(ply => (
                <button
                  key={`blunder-${ply}`}
                  onClick={() => goToPly(ply)}
                  style={{
                    margin: '0 0.25rem',
                    padding: '0.25rem 0.5rem',
                    backgroundColor: currentPly === ply ? '#dc2626' : darkMode ? '#4b5563' : '#e2e8f0',
                    color: currentPly === ply ? 'white' : darkMode ? 'white' : 'black',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                >
                  {ply}
                </button>
              ))}
            </div>
          )}

          {inaccuracies.length > 0 && (
            <div style={{ marginTop: '0.5rem', textAlign: 'center' }}>
              <strong>Inaccuracies:</strong>
              {inaccuracies.map(ply => (
                <button
                  key={`inacc-${ply}`}
                  onClick={() => goToPly(ply)}
                  style={{
                    margin: '0 0.25rem',
                    padding: '0.25rem 0.5rem',
                    backgroundColor: currentPly === ply ? '#f59e0b' : darkMode ? '#4b5563' : '#e2e8f0',
                    color: currentPly === ply ? 'white' : darkMode ? 'white' : 'black',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                >
                  {ply}
                </button>
              ))}
            </div>
          )}

          {dubious.length > 0 && (
            <div style={{ marginTop: '0.5rem', textAlign: 'center' }}>
              <strong>Dubious Moves:</strong>
              {dubious.map(ply => (
                <button
                  key={`dub-${ply}`}
                  onClick={() => goToPly(ply)}
                  style={{
                    margin: '0 0.25rem',
                    padding: '0.25rem 0.5rem',
                    backgroundColor: currentPly === ply ? '#6366f1' : darkMode ? '#4b5563' : '#e2e8f0',
                    color: currentPly === ply ? 'white' : darkMode ? 'white' : 'black',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                >
                  {ply}
                </button>
              ))}
            </div>
          )}

          <EvaluationChart moves={moves} analysisHistory={analysisHistory} blunders={blunders} inaccuracies={inaccuracies} dubious={dubious} />

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
                      `${moveNotation.padEnd(12)} | Eval: ${ana.score.toString().padEnd(6)} | Best: ${ana.bestmove} | Comment: ${comments[ply] || ''}`
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
                    comment: comments[ply] || null,
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

      {/* Notifikasi Batch Selesai */}
      {showBatchComplete && (
        <div style={{
          position: 'fixed',
          bottom: '2rem',
          right: '2rem',
          backgroundColor: '#10b981',
          color: 'white',
          padding: '1rem',
          borderRadius: '8px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        }}>
          ✅ Analisis batch selesai!
        </div>
      )}

      <footer style={{ textAlign: 'center', marginTop: '3rem', color: darkMode ? '#9ca3af' : '#64748b' }}>
        © {new Date().getFullYear()} LIONBEPTHD • LioChess
      </footer>
    </div>
  );
}
