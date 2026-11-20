import { park } from '../data/maps/park';
import { roof } from '../data/maps/roof';
import { CampaignScene } from './CampaignScene';

export class FieldParkScene extends CampaignScene {
  constructor() { super('Park', park, 'FieldPark'); }
}
export class FieldRoofScene extends CampaignScene {
  constructor() { super('Roof', roof, 'FieldRoof'); }
}
