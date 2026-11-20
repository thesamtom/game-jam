import type { FieldRecord } from './FieldRecord';
import type { Discovery } from '../data/discoveries';

export const rewards = [
  { id: 'sealed-tip', title: 'Sealed tip', text: 'A useful lead on Karimkunnu’s paperwork routes. Earn extra field experience.', xp: 70, points: 0 },
  { id: 'pavement-note', title: 'The wet season', text: 'Before the lane was raised, traders used the tower steps to wait out the rain.', xp: 30, points: 0 },
  { id: 'copper-seal', title: 'Copper dossier seal', text: 'Adds a copper seal to the Case File header.', xp: 30, points: 0 },
  { id: 'cross-reference', title: 'Cross-reference slip', text: 'Two investigation points have been added to your case notes.', xp: 30, points: 2 },
  { id: 'rail-trivia', title: 'The loading bell', text: 'The yard used a bell to signal that the road was clear for unloading.', xp: 30, points: 0 },
  { id: 'fence-hint', title: 'A shortcut pencilled in', text: 'From the west fence, head south of the lamp. The fence opens toward the road before the lowest loading bay.', xp: 30, points: 0 }
] as const;
export class RewardManager {
  constructor(private readonly field: FieldRecord) {}
  claim(discovery: Discovery) {
    if (discovery.kind !== 'envelope' || Object.hasOwn(this.field.envelopes, discovery.id)) return undefined;
    let hash = (this.field.rewardSeed ^ 0x811c9dc5) >>> 0;
    for (const character of discovery.id) hash = Math.imul(hash ^ character.charCodeAt(0), 0x01000193) >>> 0;
    hash ^= hash >>> 15;
    const reward = rewards[(hash >>> 0) % rewards.length];
    this.field.envelopes[discovery.id] = reward.id;
    this.field.investigation += reward.points;
    return reward;
  }
}
