import { chapters, type Place } from '../data/chapters';
import { maps } from '../data/maps';
import type { Point } from '../data/maps/layout';
import { newCampaign, type Campaign } from './QuestManager';

const KEY = 'randu-chaaran:campaign';
const MUTE = 'randu-chaaran:muted';
const VERSION = 1;
interface SaveRecord {
  version: number;
  scene: Place;
  campaign: Campaign;
  finished: boolean;
  muted: boolean;
}
function readable(key: string) {
  try { return localStorage.getItem(key); } catch { return null; }
}
function writable(key: string, value: string) {
  try { localStorage.setItem(key, value); } catch { /* Browsers may disable storage. */ }
}
export function mutedPreference() { return readable(MUTE) === 'true'; }
export function setMutedPreference(mute: boolean) { writable(MUTE, String(mute)); }

export function safePosition(scene: Place, point: unknown): point is Point {
  if (typeof point !== 'object' || !point) return false;
  const { x, y } = point as Point;
  const map = maps[scene];
  if (!Number.isFinite(x) || !Number.isFinite(y) || x < 4 || y < 4 || x > map.cols * 16 - 4 || y > map.rows * 16 - 4) return false;
  return !map.solids.some(b => x > b.x * 16 - 4 && x < (b.x + b.w) * 16 + 4 &&
    y > b.y * 16 - 4 && y < (b.y + b.h) * 16 + 4);
}

export function saveCampaign(campaign: Campaign, finished = false) {
  const scene = chapters[campaign.chapter - 1].objectives[campaign.objective].scene;
  const record: SaveRecord = { version: VERSION, scene, campaign, finished, muted: mutedPreference() };
  writable(KEY, JSON.stringify(record));
}

export function loadCampaign(): SaveRecord | null {
  try {
    const raw = readable(KEY);
    if (!raw) return null;
    const saved = JSON.parse(raw) as Partial<SaveRecord>;
    const campaign = saved.campaign;
    if (saved.version !== VERSION || !campaign || !Number.isInteger(campaign.chapter) || !Number.isInteger(campaign.objective)
      || !Array.isArray(campaign.flags) || typeof campaign.choices !== 'object' || !campaign.choices) return null;
    const chapter = chapters[campaign.chapter - 1];
    const step = chapter?.objectives[campaign.objective];
    if (!chapter || !step || saved.scene !== step.scene) return null;
    const expected = chapters.slice(0, campaign.chapter - 1).flatMap(entry => entry.completionConditions)
      .concat(chapter.completionConditions.slice(0, campaign.objective));
    const finished = saved.finished === true;
    if (finished) {
      if (step.id !== 'home') return null;
      expected.push(step.id);
    }
    if (expected.length !== campaign.flags.length || !expected.every((flag, i) => campaign.flags[i] === flag)) return null;
    const requiredIdentity = chapter.id === 9 || step.id === 'roofExit' ? 'Vishnu' : 'Alex';
    if (campaign.identity !== requiredIdentity) return null;
    const choices: Record<string, string> = {};
    if (campaign.choices.pressure === 'firm' || campaign.choices.pressure === 'quiet') choices.pressure = campaign.choices.pressure;
    return {
      version: VERSION, scene: step.scene, finished, muted: typeof saved.muted === 'boolean' ? saved.muted : mutedPreference(),
      campaign: { ...campaign, choices, position: safePosition(step.scene, campaign.position) ? campaign.position : undefined }
    };
  } catch { return null; }
}
export function debugCampaign(chapter: number, objective: number) {
  const state = newCampaign(chapter, objective);
  state.flags = chapters.slice(0, chapter - 1).flatMap(entry => entry.completionConditions)
    .concat(chapters[chapter - 1].completionConditions.slice(0, objective));
  if (chapters[chapter - 1].objectives[objective].id === 'roofExit') state.identity = 'Vishnu';
  return state;
}
