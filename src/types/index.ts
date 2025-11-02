export type AnalysisResult = {
  score: number | string;
  bestmove: string;
  comment?: string; // <-- ditambahkan
};
