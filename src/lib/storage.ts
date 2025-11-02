export function saveAnalysisToStorage(pgn: string, analysisHistory: any, blunders: number[]) {
  try {
    const data = { pgn, analysisHistory, blunders, timestamp: Date.now() };
    localStorage.setItem('liochess-cache', JSON.stringify(data));
  } catch (e) {
    console.warn('Gagal simpan ke localStorage', e);
  }
}

export function loadAnalysisFromStorage() {
  try {
    const raw = localStorage.getItem('liochess-cache');
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.warn('Gagal muat dari localStorage', e);
    return null;
  }
}
