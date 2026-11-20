import type { Point } from './maps/layout';
import { cell } from './maps/layout';
import type { Unlock } from './discoveries';

type Category = 'Shadow' | 'Observation' | 'Escape' | 'Deduction';
interface Challenge {
  id: string; title: string; category: Category; unlock: Unlock; description: string;
  start: Point; finish?: Point; patrol?: readonly Point[]; xp: number;
  observations?: readonly { id: string; at: Point; label: string; clue: boolean }[];
  question?: { context: string; answers: readonly string[]; correct: number };
  tip: string;
}

export const challenges: readonly Challenge[] = [
  {
    id: 'observation', title: 'Crossing Watch', category: 'Observation', unlock: {}, xp: 95,
    description: 'At the junction, log three details that could establish when the road was used. A detail unrelated to timing ends the attempt.',
    start: cell(22, 18.5), tip: 'Look for things that can place an event in time. A street name alone cannot.',
    observations: [
      { id: 'clock', at: cell(20, 16.3), label: 'A stopped clock with its hand jammed at closing time.', clue: true },
      { id: 'tracks', at: cell(26.4, 19.4), label: 'Tire marks cut through fresh rainwater.', clue: true },
      { id: 'chalk', at: cell(23.9, 23.1), label: 'A chalk mark notes the time the north gate closed.', clue: true },
      { id: 'street', at: cell(20, 21.7), label: 'A painted sign gives the name of the street.', clue: false }
    ]
  },
  {
    id: 'signal-survey', title: 'Signal Lamp Survey', category: 'Observation', unlock: { chapter: 3, trust: 45, suspicionBelow: 28 }, xp: 105,
    description: 'Check three details around the market that identify a signal used from either direction. A detail unrelated to the signal ends the attempt.',
    start: cell(35.5, 4.2), tip: 'A useful signal can be seen by someone arriving from either side.',
    observations: [
      { id: 'lamp', at: cell(34.9, 8.6), label: 'The lamp faces the lane rather than the shop wall.', clue: true },
      { id: 'shade', at: cell(37.1, 8.7), label: 'The high shade leaves a strip of light across both approaches.', clue: true },
      { id: 'mark', at: cell(38.1, 5.2), label: 'A worn chalk mark is visible from either end of the lane.', clue: true },
      { id: 'brick', at: cell(37.8, 10.2), label: 'A replaced brick is the same color as the wall.', clue: false }
    ]
  },
  {
    id: 'shadow', title: 'Behind the Annex', category: 'Shadow', unlock: { flag: 'tail' }, xp: 110,
    description: 'Reconstruct the tail. Stay close enough to follow, keep out of sight, and reach the marker behind the target.',
    start: cell(30, 15.2), finish: cell(32, 20.55), tip: 'Follow the pavement west of the target. Move toward the end marker from behind.',
    patrol: [cell(32, 14.5), cell(33.2, 16), cell(33.2, 18.1), cell(32, 20), cell(32, 21.3)],
    observations: [{ id: 'shutter', at: cell(30, 18), label: 'A shutter blocks sight of the west pavement.', clue: true }]
  },
  {
    id: 'escape', title: 'Service Gate Exit', category: 'Escape', unlock: { flag: 'survive' }, xp: 115,
    description: 'Leave the loading yard through the west opening. Use cover and avoid the moving cone.',
    start: cell(36, 30.5), finish: cell(26.5, 32), tip: 'Stay near the middle lane until you are west of the fence, then angle toward the marker.',
    patrol: [cell(41.5, 33.7), cell(37.2, 34.5), cell(33, 34.6), cell(32.1, 31.1)],
    observations: [{ id: 'paint', at: cell(32, 29.6), label: 'The pale bay line ends before the gap in the fence.', clue: true }]
  },
  {
    id: 'deduction', title: 'Two Copies', category: 'Deduction', unlock: { chapter: 3 }, xp: 90,
    description: 'Study the two copies and pick the explanation that they actually establish.',
    start: cell(24, 21.5), tip: 'Separate what the papers say from what you suspect about the person who wrote them.',
    question: {
      context: 'A dated carbon slip has entries for 21:10 and 21:40. The matching public page shows 21:10, a blank line, and the same total. What can both pages prove?',
      answers: ['A specific officer altered the public page.', 'The posted copy omits one entry.', 'Both pages were filled in before the round.'], correct: 1
    }
  }
];
