import type { Campaign } from './QuestManager';
import type { FieldRecord } from './FieldRecord';

export const ranks = [
  { name: 'Rookie', xp: 0, benefit: 'Standard field notes.', scan: 0, warning: .7 },
  { name: 'Street Insider', xp: 150, benefit: 'Optional clue signals show from farther away.', scan: 8, warning: .7 },
  { name: 'Trusted Operative', xp: 400, benefit: 'The Case File shows location hints.', scan: 12, warning: .7 },
  { name: 'Ghost', xp: 800, benefit: 'The suspicion meter warns you earlier.', scan: 16, warning: .55 },
  { name: 'Master Spy', xp: 1400, benefit: 'The Case File shows every unlocked lead’s location.', scan: 24, warning: .47 }
] as const;
const chapterEnds = new Set(['market', 'accepted', 'van', 'clue', 'alley', 'survive', 'meera', 'roofExit', 'home']);
const baseAward = (id: string) => chapterEnds.has(id) ? 48 : 22;
const trustAward = (id: string) => ['orders', 'deliver', 'collect', 'accepted'].includes(id) ? 9 : 0;
const choiceEffect = (choice: string) => choice === 'quiet' ? { trust: 4, suspicion: 0 }
  : choice === 'firm' ? { trust: 7, suspicion: 4 } : { trust: 0, suspicion: 0 };
export const currentRank = (xp: number) => ranks.reduce<typeof ranks[number]>((best, rank) => xp >= rank.xp ? rank : best, ranks[0]);

export function backfillProgress(field: FieldRecord, flags: string[], choices: Campaign['choices']) {
  const effect = choiceEffect(choices.pressure);
  field.xp = Math.max(field.xp, flags.reduce((sum, objective) => sum + baseAward(objective), 0));
  field.trust = Math.max(field.trust, flags.reduce((sum, objective) => sum + trustAward(objective), 0) + (flags.includes('pressure') ? effect.trust : 0));
  field.suspicion = Math.max(field.suspicion, flags.includes('pressure') ? effect.suspicion : 0);
  field.rank = currentRank(field.xp).name;
}

export class ProgressionManager {
  constructor(private readonly campaign: Campaign, private readonly notice: (message: string) => void) {}
  get field() { return this.campaign.field; }
  award(xp: number, reason: string) {
    const before = currentRank(this.field.xp);
    this.field.xp += xp;
    const after = currentRank(this.field.xp);
    this.field.rank = after.name;
    this.notice('+' + xp + ' XP · ' + reason + (before !== after ? ' · Rank up: ' + after.name : ''));
  }
  reputation(trust: number, suspicion: number, reason: string) {
    const before = [this.field.trust, this.field.suspicion];
    this.field.trust = Math.min(100, Math.max(0, before[0] + trust));
    this.field.suspicion = Math.min(100, Math.max(0, before[1] + suspicion));
    const changes = [this.field.trust !== before[0] ? this.change(this.field.trust - before[0]) + ' Gang Trust' : '',
      this.field.suspicion !== before[1] ? this.change(this.field.suspicion - before[1]) + ' Police Suspicion' : ''].filter(Boolean);
    if (changes.length) this.notice(changes.join(' / ') + ' · ' + reason);
  }
  story(id: string) {
    this.award(baseAward(id), chapterEnds.has(id) ? 'Chapter complete' : 'Story objective');
    const effect = id === 'pressure' ? choiceEffect(this.campaign.choices.pressure) : { trust: trustAward(id), suspicion: 0 };
    this.reputation(effect.trust, effect.suspicion, id === 'pressure' ? 'Shopfront conversation' : 'Shaji’s work');
    if (id === 'tail' || id === 'survive') {
      if (!this.field.seenRoutes.includes(id)) {
        this.field.cleanRoutes.push(id);
        this.award(55, 'Undetected route');
      }
      this.reputation(0, -5, 'Left the area');
    }
  }
  spotted(id: string) {
    if (this.field.seenRoutes.includes(id)) return;
    this.field.seenRoutes.push(id);
    this.reputation(0, 9, 'Spotted on a route');
  }
  private change(value: number) { return value > 0 ? '+' + value : String(value); }
}
