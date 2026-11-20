import { discoveries } from '../data/discoveries';
import { activities } from '../data/activities';
import type { Campaign } from './QuestManager';
import { currentRank } from './ProgressionManager';

interface Achievement {
  id: string; name: string; goal: string; earned: (state: Campaign) => boolean;
}
const story = (id: string, name: string, goal: string, flag: string): Achievement =>
  ({ id, name, goal, earned: state => state.flags.includes(flag) });
export const achievements: readonly Achievement[] = [
  story('assignment','First Assignment','Complete Chapter 1.','market'),
  story('trusted','Trusted by the Gang','Complete Chapter 2.','accepted'),
  story('empty','Empty Van','Complete the failed deal.','van'),
  story('witness','The Last Witness','Complete Chapter 8.','roofExit'),
  story('twospies','Two Spies','Reach the credits.','home'),
  { id:'shadow', name:'Invisible Shadow', goal:'Finish a story stealth route without detection.', earned: s => s.field.cleanRoutes.length > 0 },
  { id:'curious', name:'Curious Mind', goal:'Record five non-landmark discoveries.', earned: s => discoveries.filter(site => site.kind !== 'landmark' && s.field.discoveries.includes(site.saveFlag)).length >= 5 },
  { id:'hidden', name:'Hidden Truths', goal:'Record ten discoveries.', earned: s => s.field.discoveries.length >= 10 },
  { id:'town', name:'Every Street', goal:'Visit all five districts.', earned: s => s.field.districts.length >= 5 },
  { id:'ghost', name:'Ghost of Karimkunnu', goal:'Earn the Ghost rank.', earned: s => s.field.xp >= 800 },
  { id:'master', name:'Master Spy', goal:'Reach the top rank.', earned: s => currentRank(s.field.xp).name === 'Master Spy' },
  { id:'investigator', name:'Master Investigator', goal:'Solve every optional investigation.', earned: s => activities.every(a => s.field.activities[a.id]?.includes('solved')) },
  { id:'observation', name:'Silent Streets', goal:'Complete an optional observation challenge.', earned: s => 'observation' in s.field.records || 'signal-survey' in s.field.records },
  { id:'drop', name:'Dead Drop', goal:'Open your first envelope.', earned: s => Object.keys(s.field.envelopes).length > 0 }
];
export function checkAchievements(state: Campaign) {
  const unlocked = achievements.filter(entry => !state.field.achievements.includes(entry.id) && entry.earned(state));
  state.field.achievements.push(...unlocked.map(entry => entry.id));
  return unlocked;
}
