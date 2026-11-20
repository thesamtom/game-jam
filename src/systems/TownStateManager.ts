import { cell } from '../data/maps/layout';
import type { Campaign } from './QuestManager';
import { districtId, districtNames } from './ExplorationManager';

const phases = {
  Normal: { start: 970, grading: 'rgba(36,75,62,.04)', lamp: '#ebbb72', ambience: .25,
    yard: 'GOODS YARD', watch: 'Hamsa', route: [cell(12.7, 8), cell(12.2, 11.1), cell(18.6, 11.1)], attention: false },
  Suspicious: { start: 1080, grading: 'rgba(28,56,86,.16)', lamp: '#edbd6e', ambience: .44,
    yard: 'GOODS YARD · CHECK IN', watch: 'Hamsa', route: [cell(11.4, 4), cell(12.3, 8.7), cell(12.9, 11.2), cell(17, 11.1)], attention: true },
  Tense: { start: 1160, grading: 'rgba(75,44,65,.22)', lamp: '#e1a371', ambience: .58,
    yard: 'GOODS YARD · CLOSED', watch: 'Hamsa', route: [cell(19.4, 15.8), cell(19.8, 12.5), cell(12.9, 11.2)], attention: true },
  Crackdown: { start: 1240, grading: 'rgba(36,62,94,.24)', lamp: '#a8bfdc', ambience: .62,
    yard: 'GOODS YARD · RESTRICTED', watch: 'Sudhi', route: [cell(33.8, 25.5), cell(34.5, 28.8), cell(36.2, 29.5)], attention: true },
  Aftermath: { start: 1740, grading: 'rgba(85,66,50,.10)', lamp: '#b8c2a1', ambience: .14,
    yard: 'GOODS YARD · REVIEW PENDING', watch: null, route: [], attention: false }
} as const;
export type TownMood = keyof typeof phases;
export class TownStateManager {
  constructor(private readonly campaign: Campaign) {}
  get mood(): TownMood {
    const { chapter } = this.campaign;
    return chapter <= 2 ? 'Normal' : chapter <= 4 ? 'Suspicious' : chapter === 5 ? 'Tense' : chapter <= 7 ? 'Crackdown' : 'Aftermath';
  }
  get settings() { return phases[this.mood]; }
  sync() {
    this.campaign.field.town = this.mood;
    this.campaign.field.minute = (this.settings.start + (this.campaign.chapter % 2) * 40 + this.campaign.objective * 7) % 1440;
  }
  district(name: string) {
    const id = districtId(name);
    if (!districtNames.some(district => districtId(district) === id) || id === this.campaign.field.lastDistrict) return false;
    this.campaign.field.lastDistrict = id;
    this.campaign.field.visits++;
    return true;
  }
  greeting() {
    const { suspicion, trust } = this.campaign.field;
    if (suspicion >= 20) return 'I’ve seen you at more than one gate today. Keep to the public side.';
    if (this.mood === 'Crackdown') return 'The public log is still on the board. The loose pages are being held for review.';
    if (trust >= 24) return 'The market people know your face now. Ask them which lanes they use when the shop shuts.';
    if (this.mood === 'Tense') return 'The tower lamps will stay on. Anyone using the lane should stay where they can be seen.';
    return 'If you’re crossing back to the market, take the open pavement. The lane gets dark early.';
  }
}
