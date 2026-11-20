import { readChallengeResults, type ChallengeResult } from './FieldRecord';

const SCORE_KEY = 'randu-chaaran:mission-records';
export class ChallengeManager {
  detections = 0;
  retries = 0;
  clues = 0;
  mistakes = 0;
  elapsed = 0;
  complete(): ChallengeResult {
    const seconds = Math.round(this.elapsed / 100) / 10;
    const score = Math.max(100, Math.round(850 + Math.min(200, this.clues * 55)
      - this.detections * 135 - this.retries * 80 - this.mistakes * 70 - Math.max(0, seconds - 8) * 3));
    return { score, grade: score >= 900 ? 'S' : score >= 740 ? 'A' : score >= 565 ? 'B' : 'C',
      detections: this.detections, retries: this.retries, clues: this.clues, seconds };
  }
  static best(records: Record<string, ChallengeResult>, id: string, result: ChallengeResult) {
    if (!records[id] || result.score > records[id].score || result.score === records[id].score && result.seconds < records[id].seconds) {
      records[id] = result;
    }
  }
  static leaderboard() {
    try {
      const record = JSON.parse(localStorage.getItem(SCORE_KEY) ?? 'null');
      return record?.version === 1 ? readChallengeResults(record.best) : {};
    } catch { return {}; }
  }
  static post(id: string, result: ChallengeResult) {
    const best = this.leaderboard();
    this.best(best, id, result);
    try { localStorage.setItem(SCORE_KEY, JSON.stringify({ version: 1, best })); } catch { /* Storage can be disabled. */ }
  }
}
