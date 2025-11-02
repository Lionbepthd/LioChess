export function saveAnalysisToStorage(
  pgn: string,
  analysisHistory: any,
  blunders: number[],
  analysisDepth: number
) {
  try {
    const data = {
      pgn,
      analysisHistory,
      blunders,
      analysisDepth,
      timestamp: Date.now(),
    };
    localStorage.setItem('liochess-cache', JSON.stringify(data));
  } catch (e) {
    console.warn('Gagal simpan ke localStorage', e);
  }
}

export function loadAnalysisFromStorage() {
  try {
    const raw = localStorage.getItem('liochess-cache');
    if (!raw) return null;
    const saved = JSON.parse(raw);
    return {
      pgn: saved.pgn,
      analysisHistory: saved.analysisHistory,
      blunders: saved.blunders || [],
      analysisDepth: saved.analysisDepth || 10,
      timestamp: saved.timestamp,
    };
  } catch (e) {
    console.warn('Gagal muat dari localStorage', e);
    return null;
  }
}
