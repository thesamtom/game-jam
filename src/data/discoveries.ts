import type { Place } from './chapters';
import { cell, type Point } from './maps/layout';

export interface Unlock { chapter?: number; flag?: string; trust?: number; suspicionBelow?: number; visits?: number }
export interface Discovery {
  id: string; name: string; description: string; scene: Place; at: Point; district: string;
  kind: 'landmark' | 'clue' | 'observation' | 'passage' | 'envelope';
  unlock: Unlock; reward: number; saveFlag: string; hint: string;
}
function site(id: string, name: string, description: string, x: number, y: number, district: string,
  kind: Discovery['kind'], hint: string, unlock: Unlock = {}, reward = 35, scene: Place = 'Town'): Discovery {
  return { id, name, description, scene, at: cell(x, y), district, kind, unlock, reward, saveFlag: id, hint };
}
export const discoveries: readonly Discovery[] = [
  site('police-plaque','Police Station Plaque','The building has two date stones. The older one used to face the market.', 11.2, 10.1,'Police Quarter','landmark','Look beside the police station.'),
  site('market-scale','Old Weighing Step','The step is worn where traders once lined up before dawn.', 34.5, 10.8,'Old Market','landmark','Look between the two shopfronts.'),
  site('rail-gate','North Loading Gate','Its old sliding rail leaves enough room for a person to slip through.', 34, 23.4,'Goods Yard','landmark','Approach the yard from the north.'),
  site('tower-plaque','Tower Service Plaque','The west lane was designed as a service entrance.', 8, 32.5,'Roof Tower','landmark','Check the west side of the tower.'),
  site('park-mile','The Park Milepost','A faded arrow points back to the station. People used to walk past here on their way to work.', 24, 38,'Town Park','landmark','Follow the road south to the park sign.'),
  site('clinic-louver','Clinic Louver','The glass reflects the street. Someone inside can watch the road without lifting the blinds.', 18.8, 10.5,'Police Quarter','observation','Stand near the east end of the clinic walkway.'),
  site('quiet-wall','Quiet Wall','From here the annex hides the crossing. Someone taking the west lane could leave without being seen from the shop.', 34.1, 16.1,'Old Market','observation','Watch the junction from west of the market annex.', { chapter: 3 }),
  site('hedge-gap','Hedge Gap','The gap below the tower joins its back lane to the road south. The paving is worn beneath the leaves.', 18.6, 35.7,'Roof Tower','passage','Follow the hedge along the south face of the tower.'),
  site('east-gap','East Fence Break','Old paving marks a second way out. The fence ends just short of the drainage strip.', 46.7,31.2,'Goods Yard','passage','Follow the eastern fence toward the break.', { chapter: 3 }),
  site('service-cut','Service Cut','A maintenance gap in the west fence leads to the junction without crossing the loading bays.', 27, 30.7,'Goods Yard','passage','Follow the outside of the west fence.'),
  site('paper-return','The Reposted Notice','The date on the replacement notice is earlier than the one it replaced. The order of events may matter.', 35.7,4.4,'Old Market','clue','Revisit the back lane after the tower incident.', { flag: 'meet', visits: 4 }, 62),
  site('rain-ledger','Waterlogged Ledger','An old dispatch line was rewritten over wet ink. The truck was never scheduled to enter that night.', 43.5, 33,'Goods Yard','clue','Check the east loading bays after the van search.', { flag: 'van' }, 58),
  site('torn-carbon','Torn Carbon Copy','The carbon impression lists a dispatch time that never made it into the public notes.', 4, 16.2,'Police Quarter','clue','Check the station’s back lane during the crackdown.', { chapter: 6 }, 58),
  site('rail-scratches','Parapet Scratches','Several marks face the stairs. The best lookout on the roof was watching for an arrival.', 16.8, 6.5,'Roof Tower','observation','Check the north-east parapet during a rooftop visit.', { chapter: 5 }, 45,'Roof'),
  site('drop-station','Station Wall Envelope','An envelope is folded into the rain gutter. No name is written on it.', 11.4, 3,'Police Quarter','envelope','Check the walk behind the station.'),
  site('drop-market','Market Eave Envelope','A folded envelope is tucked beneath the eave.', 35.6,4.3,'Old Market','envelope','Walk the lane north of the market.', { chapter: 2 }),
  site('drop-clinic','Clinic Planter Envelope','The paper is dry under the planter’s rim.', 18.9,14.3,'Police Quarter','envelope','Look south of the clinic.', { chapter: 3 }),
  site('drop-yard','Loading Bay Envelope','A strip of paper marks where the envelope was hidden.', 42.9,34.9,'Goods Yard','envelope','Check the yard after the empty van is discovered.', { flag: 'van' }),
  site('drop-tower','Tower Drain Envelope','An unmarked packet sits against the narrow drain.', 7.7,34.3,'Roof Tower','envelope','Trace the drain west of the tower.', { chapter: 4 }),
  site('drop-fence','Service Fence Envelope','The envelope is tied to the back of the old fence.', 44.7,37.5,'Goods Yard','envelope','Check the outside of the south fence after the raid.', { flag: 'survive' }),
  site('drop-park','Milepost Envelope','A blank envelope was tipped under a flat stone.', 22.2,38.3,'Town Park','envelope','Look west of the park sign during the aftermath.', { chapter: 8 }),
  site('park-etching','Bench Inscription','The carving was rubbed almost smooth by hands resting on the same spot.', 19.4, 10.8,'Town Park','clue','Read the paving near the center bench.', {}, 50,'Park')
];

export function unlocked(rule: Unlock, context: { chapter: number; flags: readonly string[]; field: { trust: number; suspicion: number; visits: number } }) {
  return context.chapter >= (rule.chapter ?? 1) && (!rule.flag || context.flags.includes(rule.flag))
    && context.field.trust >= (rule.trust ?? 0) && context.field.suspicion < (rule.suspicionBelow ?? 101)
    && context.field.visits >= (rule.visits ?? 0);
}
