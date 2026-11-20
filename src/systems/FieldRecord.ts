export interface ChallengeResult {
  score: number;
  grade: 'C' | 'B' | 'A' | 'S';
  detections: number;
  clues: number;
  retries: number;
  seconds: number;
}

export interface FieldRecord {
  discoveries: string[];
  districts: string[];
  xp: number;
  rank: string;
  trust: number;
  suspicion: number;
  activities: Record<string, string[]>;
  achievements: string[];
  envelopes: Record<string, string>;
  rewardSeed: number;
  investigation: number;
  records: Record<string, ChallengeResult>;
  town: string;
  visits: number;
  minute: number;
  lastDistrict: string;
  ambientAlerts: string[];
  quiet: boolean;
  cleanRoutes: string[];
  seenRoutes: string[];
}

export function newFieldRecord(seed = Math.floor(Math.random() * 0x100000000)): FieldRecord {
  return {
    discoveries: [], districts: [], xp: 0, rank: 'Rookie', trust: 0, suspicion: 0,
    activities: {}, achievements: [], envelopes: {}, rewardSeed: seed, investigation: 0,
    records: {}, town: 'Normal', visits: 0, minute: 970, lastDistrict: '', ambientAlerts: [], quiet: false, cleanRoutes: [], seenRoutes: []
  };
}

export function readFieldRecord(raw: unknown): FieldRecord {
  const fresh = newFieldRecord();
  if (!raw || typeof raw !== 'object') return fresh;
  const value = raw as Partial<FieldRecord>;
  const strings = (input: unknown): string[] => Array.isArray(input)
    ? [...new Set(input.filter((item): item is string => typeof item === 'string'))].slice(0, 150) : [];
  const number = (input: unknown, max: number, fallback = 0) =>
    typeof input === 'number' && Number.isFinite(input) ? Math.min(max, Math.max(0, Math.floor(input))) : fallback;
  const entries = (input: unknown) => input && typeof input === 'object' && !Array.isArray(input)
    ? Object.entries(input).filter(([key]) => /^[a-z][a-z0-9-]{0,63}$/.test(key)).slice(0, 100) : [];
  return {
    ...fresh,
    discoveries: strings(value.discoveries), districts: strings(value.districts),
    xp: number(value.xp, 100000), rank: typeof value.rank === 'string' ? value.rank : fresh.rank,
    trust: number(value.trust, 100), suspicion: number(value.suspicion, 100),
    activities: Object.fromEntries(entries(value.activities).map(([id, notes]) => [id, strings(notes)])),
    achievements: strings(value.achievements),
    envelopes: Object.fromEntries(entries(value.envelopes).filter(([, reward]) => typeof reward === 'string')),
    rewardSeed: number(value.rewardSeed, 0xffffffff, fresh.rewardSeed),
    investigation: number(value.investigation, 10000),
    records: readChallengeResults(value.records),
    town: typeof value.town === 'string' ? value.town : fresh.town,
    visits: number(value.visits, 100000), minute: number(value.minute, 1439, 970),
    lastDistrict: typeof value.lastDistrict === 'string' ? value.lastDistrict : '', ambientAlerts: strings(value.ambientAlerts), quiet: value.quiet === true, cleanRoutes: strings(value.cleanRoutes), seenRoutes: strings(value.seenRoutes)
  };
}

export function readChallengeResults(value: unknown): Record<string, ChallengeResult> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value).filter(([id, result]) => /^[a-z][a-z0-9-]{0,63}$/.test(id)
    && result && ['C','B','A','S'].includes(result.grade)
    && ['score','detections','clues','retries','seconds'].every(key =>
      typeof result[key] === 'number' && Number.isFinite(result[key]) && result[key] >= 0)));
}
