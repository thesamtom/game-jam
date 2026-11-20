import { cell, type Point } from './maps/layout';
import type { Unlock } from './discoveries';

export interface Activity {
  id: string; name: string; district: string; unlock: Unlock;
  lead: { at: Point; text: string; location: string };
  comparison: { at: Point; text: string; location: string };
  question: string; answers: readonly [string, string]; correct: number;
  result: string; xp: number; trust: number; suspicion: number;
}

function file(id: string, name: string, district: string, unlock: Unlock,
  lead: [number, number, string, string], comparison: [number, number, string, string],
  question: string, answers: Activity['answers'], correct: number, result: string,
  xp = 68, trust = 0, suspicion = 0): Activity {
  return { id, name, district, unlock, lead: { at: cell(lead[0], lead[1]), location: lead[2], text: lead[3] },
    comparison: { at: cell(comparison[0], comparison[1]), location: comparison[2], text: comparison[3] },
    question, answers, correct, result, xp, trust, suspicion };
}

export const activities: readonly Activity[] = [
  file('duty-gap','A Gap in the Duty Board','Police Quarter', {},
    [11.1,6.8,'East wall of the station','The duty board has a blank between the second and fourth rounds. The frame is undamaged.'],
    [11.8,11.3,'Pavement south of the clinic turn','The carbon sheet has an evenly spaced entry for every round, including the third.'],
    'What best explains the gap?', ['A line was removed from the posted board.', 'The board was never filled out.'], 0,
    'The schedule existed. Only the public copy has a gap.', 65, 0, -5),
  file('double-round','The Double Round','Police Quarter', { chapter: 3 },
    [3.2,11.2,'Alley west of Vishnu’s home','Two rounds were signed off under the same time.'],
    [3.4,15.3,'West end of the home lane','The chalk route takes the full interval just to get from one end to the other.'],
    'What makes the two entries doubtful?', ['The chalk was the wrong color.', 'One round could not have covered both routes on time.'], 1,
    'The duplication covers an unexplained absence. It does not identify the officer.'),
  file('chalk-account','Chalk Account','Old Market', { flag: 'deliver' },
    [30.5,13.2,'Under the General Stores window','The chalk marks along the sill match parcels, one mark per current delivery. One extra mark is crossed out.'],
    [34,11.2,'End of the weighing step','The loose receipt counts the crossed-out mark as a return. It was paid a second time.'],
    'What was billed twice?', ['Every current delivery.', 'The returned parcel.'], 1,
    'The extra payment was for returning the parcel, not bringing a new one.', 72, 5),
  file('back-lane','Exchange in the Back Lane','Old Market', { chapter: 3, trust: 24 },
    [30.2,3.7,'Behind General Stores','Shaji’s repeat message says to look for a lamp facing the street.'],
    [37.1,4.1,'North of the toddy shop','The one lamp visible from both directions is outside the shop line. The others face the walls.'],
    'Where could both sides recognize the signal?', ['The street-facing lamp.', 'Behind the shutter.'], 0,
    'The signal was chosen for people arriving from different streets.', 75, 6),
  file('yard-window','The Loading Window','Goods Yard', { flag: 'tip' },
    [36.3,26,'North loading marks','The chalk gate log lists two deliveries. Both lines use the same cart number.'],
    [41.9,28.8,'Painted bay on the east side','The paper strip inside the bay lists one cart and two windows, inbound and outbound.'],
    'What should the log have said?', ['One delivery and one return movement.', 'Two different carts arrived.'], 0,
    'The repeated number counts the same cart twice.', 70),
  file('van-shadow','What the Van Left','Goods Yard', { flag: 'van' },
    [41.9,32.1,'East of the empty van','The wheel imprint has a second edge over the first. The van was repositioned.'],
    [36.8,33.5,'South of the central bays','Debris and dry space mark the earlier parking place. The exposed ground has stayed dry.'],
    'When was the van moved?', ['After the late shower stopped.', 'Before the late shower stopped.'], 0,
    'The original covered patch stayed dry. The van was moved after the rain eased.', 78),
  file('tower-angle','The Tower’s Blind Side','Roof Tower', { chapter: 4 },
    [7.4,30.6,'West wall of the tower','The wall blocks the stairs from every point on this lane.'],
    [16.6,31.9,'East corner outside the tower','From here, the steps and main road are both visible, even with the doors shut.'],
    'Where would a lookout have seen both approaches?', ['On the east corner.', 'In the west lane.'], 0,
    'Watch the east corner when approaching the stairs.'),
  file('splintered-tag','A Splintered Tag','Roof Tower', { flag: 'alley' },
    [16.8,34.5,'Below the marked escape alley','The wooden tag has two nail holes close together.'],
    [13.4,35.6,'Fence west of the alley','The old gate has no holes. The small service post has a matching pair.'],
    'Where did the tag come from?', ['The main gate.', 'The service post.'], 1,
    'The tag marked a side entrance that could be used without opening the gate.'),
  file('clinic-mirror','Reflection at the Clinic','Police Quarter', { chapter: 5, suspicionBelow: 25 },
    [19.1,6.8,'Along the clinic’s eastern side','The lit window appears to look onto the street. A second glass pane reflects east.'],
    [17.9,11.5,'South-east clinic path','From the path you can see the reflection, but the pane itself faces the other way.'],
    'Why did the street appear occupied?', ['A reflection placed the light in the wrong window.', 'Two lamps were turned on.'], 0,
    'The reflection explains the apparent movement. A lit window alone proves little.', 65, 0, -7),
  file('after-raid','A Missing Seal','Goods Yard', { flag: 'survive' },
    [32.9,28.5,'Beside the west loading bays','A public copy shows a single seizure seal at the close of the raid.'],
    [36.1,29.8,'West edge of the middle bay','The pad retained an earlier impression of another seal. Its number has no corresponding entry.'],
    'What can be established from both copies?', ['Who stole the sealed paperwork.', 'The public copy omitted a seal.'], 1,
    'A numbered seal is missing from the public copy. Neither document identifies who removed it.', 85),
  file('park-memory','A Name in Pencil','Town Park', { chapter: 8 },
    [22,37.6,'West side of the park approach','One pencilled name in the old public notice was erased and written again.'],
    [25.5,38.4,'East of the milepost','The carbon impression preserves the first spelling. It differs only by one vowel.'],
    'Which explanation is the evidence enough to support?', ['Someone corrected a spelling.', 'Someone secretly removed an attendee.'], 0,
    'Two versions can look incriminating without being evidence of a cover-up.', 75, 0, -5)
];

export function activityStatus(activity: Activity, states: Record<string, string[]>) {
  const notes = states[activity.id] ?? [];
  return notes.includes('solved') ? 'solved' : notes.includes('lead') ? 'comparison' : 'lead';
}
