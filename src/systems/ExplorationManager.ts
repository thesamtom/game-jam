import { discoveries, unlocked, type Discovery } from '../data/discoveries';
import type { Place } from '../data/chapters';
import type { Point } from '../data/maps/layout';
import type { Campaign } from './QuestManager';

export const districtNames = ['Police Quarter', 'Old Market', 'Goods Yard', 'Roof Tower', 'Town Park'] as const;
export const districtId = (name: string) => name.split(' • ')[0].toLowerCase().replaceAll(' ', '-');
export class ExplorationManager {
  constructor(private readonly campaign: Campaign, private readonly scene: Place) {}
  get field() { return this.campaign.field; }
  visit(name: string) {
    const id = districtId(name);
    if (!districtNames.some(district => districtId(district) === id) || this.field.districts.includes(id)) return false;
    this.field.districts.push(id);
    return true;
  }
  available() {
    return discoveries.filter(site => site.scene === this.scene && this.canInspect(site));
  }
  canInspect(site: Discovery) {
    return !this.field.discoveries.includes(site.saveFlag) && !Object.hasOwn(this.field.envelopes, site.id)
      && unlocked(site.unlock, this.campaign);
  }
  inspect(site: Discovery) {
    if (site.scene !== this.scene || !this.canInspect(site)) return false;
    this.field.discoveries.push(site.saveFlag);
    return true;
  }
}

export function closest<T extends { at: Point }>(sites: readonly T[], point: Point, radius: number): T | undefined {
  let nearest: T | undefined;
  let best = radius * radius;
  for (const site of sites) {
    const distance = (site.at.x - point.x) ** 2 + (site.at.y - point.y) ** 2;
    if (distance >= best) continue;
    best = distance;
    nearest = site;
  }
  return nearest;
}
