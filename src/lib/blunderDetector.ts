import { AnalysisResult } from '../types';

export function detectBlunders(
  analysisHistory: Record<number, AnalysisResult>,
  threshold: number = 1.0
) {
  const blunders: number[] = [];
  const inaccuracies: number[] = [];
  const dubious: number[] = [];
  const comments: Record<number, string> = {};
  const plies = Object.keys(analysisHistory)
    .map(Number)
    .filter(p => analysisHistory[p])
    .sort((a, b) => a - b);

  for (let i = 1; i < plies.length; i++) {
    const prevPly = plies[i - 1];
    const currPly = plies[i];
    const prev = analysisHistory[prevPly];
    const curr = analysisHistory[currPly];

    const getNumericEval = (score: string | number): number => {
      if (typeof score === 'number') return score;
      if (typeof score === 'string') {
        if (score.startsWith('#')) {
          const n = parseInt(score.replace(/#/, ''), 10);
          return n > 0 ? 10 : -10;
        }
        return parseFloat(score) || 0;
      }
      return 0;
    };

    const prevEval = getNumericEval(prev.score);
    const currEval = getNumericEval(curr.score);

    const effectivePrev = prevPly % 2 === 0 ? -prevEval : prevEval;
    const effectiveCurr = currPly % 2 === 0 ? -currEval : currEval;
    const loss = effectivePrev - effectiveCurr;

    if (loss >= 3.0) {
      blunders.push(currPly);
      comments[currPly] = 'Blunder!';
    } else if (loss >= 1.0) {
      inaccuracies.push(currPly);
      comments[currPly] = 'Inaccuracy';
    } else if (loss >= 0.5) {
      dubious.push(currPly);
      comments[currPly] = 'Dubious move';
    } else if (loss <= -0.5) {
      comments[currPly] = 'Good move';
    } else {
      comments[currPly] = 'Neutral';
    }
  }

  return { blunders, inaccuracies, dubious, comments };
}
