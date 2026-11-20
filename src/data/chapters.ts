import type { DialogueId } from './dialogue';
import type { Character } from '../entities/Npc';

export type Place = 'Town' | 'Roof' | 'Park';
export interface Objective {
  id: string;
  scene: Place;
  goal: string;
  hint?: string;
  at?: string;
  spawn?: string;
  mode: 'interact' | 'arrive' | 'auto' | 'tail';
  prompt?: string;
  dialogue?: DialogueId;
  actor?: Character;
  cutscene?: string;
}
export interface Chapter {
  id: number;
  title: string;
  description: string;
  startScene: Place;
  checkpoint: string;
  objectives: readonly Objective[];
  completionConditions: readonly string[];
  dialogueIds: readonly DialogueId[];
  requiredNpcs: readonly Character[];
  triggerIds: readonly string[];
  cutsceneIds: readonly string[];
  next: number | null;
}
const cinematicDialogue: Record<string, readonly DialogueId[]> = {
  childhood: ['beforeKuttappan', 'beforeUniform'], warning: ['warning'], handoff: ['handoff'],
  raid: ['raid', 'father'], proof: ['proof'], shooting: ['rooftop', 'coverup'], ending: ['home']
};
function chapter(id: number, title: string, description: string, checkpoint: string, objectives: readonly Objective[], requiredNpcs: readonly Character[]): Chapter {
  return {
    id, title, description, startScene: objectives[0].scene, checkpoint, objectives,
    completionConditions: objectives.map(step => step.id),
    dialogueIds: objectives.flatMap(step => [
      ...(step.dialogue ? [step.dialogue] : []), ...(cinematicDialogue[step.cutscene ?? ''] ?? [])
    ]),
    requiredNpcs, triggerIds: objectives.flatMap(step => step.at ? [step.at] : []),
    cutsceneIds: objectives.flatMap(step => step.cutscene ? [step.cutscene] : []),
    next: id < 9 ? id + 1 : null
  };
}
export const chapters = [
  chapter(1, 'Two Spies', 'An undercover assignment begins in Karimkunnu.', 'start', [
    { id: 'opening', scene: 'Town', mode: 'auto', goal: 'Arrive in Karimkunnu', cutscene: 'opening' },
    { id: 'briefing', scene: 'Town', mode: 'interact', at: 'raghavan', goal: 'Talk to SP Raghavan', hint: 'Police station, at the blue-grey building.', actor: 'Raghavan', prompt: 'Speak to Raghavan', dialogue: 'briefing', cutscene: 'childhood' },
    { id: 'market', scene: 'Town', mode: 'arrive', at: 'marketEntry', goal: 'Walk to Old Market', hint: 'Cross east through the main junction.' }
  ], ['Raghavan', 'Hamsa', 'Vishnu', 'Kuttappan']),
  chapter(2, 'Joining the Gang', 'Shaji gives Alex three errands to earn his place.', 'marketEntry', [
    { id: 'orders', scene: 'Town', mode: 'interact', at: 'shaji', goal: 'Find Shaji at General Stores', prompt: 'Speak to Shaji', actor: 'Shaji', dialogue: 'errands' },
    { id: 'deliver', scene: 'Town', mode: 'interact', at: 'package', goal: 'Leave the parcel at the eastern step', prompt: 'Deliver the package', dialogue: 'delivery' },
    { id: 'pressure', scene: 'Town', mode: 'interact', at: 'shopkeeper', goal: 'Press the toddy shop for payment', prompt: 'Call through the door', dialogue: 'pressure' },
    { id: 'collect', scene: 'Town', mode: 'interact', at: 'money', goal: 'Collect the cash by the west planter', prompt: 'Pick up the newspaper', dialogue: 'cash' },
    { id: 'accepted', scene: 'Town', mode: 'interact', at: 'kuttappan', goal: 'Report to Kuttappan', prompt: 'Speak to Kuttappan', actor: 'Kuttappan', dialogue: 'welcome' }
  ], ['Shaji', 'Kuttappan']),
  chapter(3, 'The Failed Deal', 'A private tip should give the police a head start.', 'kuttappan', [
    { id: 'tip', scene: 'Town', mode: 'interact', at: 'phone', goal: 'Send the deal details to Raghavan', hint: 'Use the quiet corner just north of the goods yard.', prompt: 'Open secure messages', dialogue: 'message' },
    { id: 'gate', scene: 'Town', mode: 'arrive', at: 'yardGate', goal: 'Enter through the goods yard’s north gate' },
    { id: 'van', scene: 'Town', mode: 'interact', at: 'van', goal: 'Search the van', prompt: 'Check the cargo hold', dialogue: 'emptyVan', cutscene: 'warning' }
  ], ['Raghavan', 'Vishnu', 'Kuttappan']),
  chapter(4, 'The Hunt', 'Follow the man who gives the orders.', 'huntStart', [
    { id: 'tail', scene: 'Town', mode: 'tail', spawn: 'huntStart', at: 'handoff', goal: 'Tail Kuttappan without being seen', hint: 'Stay close, outside the cone. Buildings and vehicles block sight.', cutscene: 'handoff' },
    { id: 'clue', scene: 'Town', mode: 'interact', at: 'handoff', goal: 'Examine the torn note at the curb', prompt: 'Read the note', dialogue: 'roofClue' }
  ], ['Kuttappan', 'Vishnu']),
  chapter(5, 'Raghavan Dies', 'Alex and Raghavan are running out of places to meet.', 'handoff', [
    { id: 'towerIn', scene: 'Town', mode: 'interact', at: 'roofDoor', goal: 'Go to the Roof Tower', prompt: 'Take the roof stairs' },
    { id: 'meet', scene: 'Roof', mode: 'interact', spawn: 'entry', at: 'meeting', goal: 'Ask Raghavan to end the operation', prompt: 'Speak to Raghavan', dialogue: 'raghavanRoof', actor: 'Raghavan', cutscene: 'fall' },
    { id: 'injured', scene: 'Town', mode: 'interact', spawn: 'escapeStart', at: 'shajiInjured', goal: 'Check on Shaji in the alley', prompt: 'Speak to Shaji', actor: 'Shaji', dialogue: 'injured' },
    { id: 'alley', scene: 'Town', mode: 'arrive', at: 'alleyExit', goal: 'Escape through the marked alley' }
  ], ['Raghavan', 'Alex', 'Shaji', 'Kuttappan']),
  chapter(6, 'Kuttappan Falls', 'Vishnu takes command of the raid on the goods yard.', 'raidStart', [
    { id: 'raid', scene: 'Town', mode: 'interact', spawn: 'raidStart', at: 'raidRendezvous', goal: 'Find cover and observe the raid', prompt: 'Look into the yard', cutscene: 'raid' },
    { id: 'survive', scene: 'Town', mode: 'arrive', spawn: 'safeCover', at: 'raidExit', goal: 'Slip out through the west service gate', hint: 'Avoid the patrol cones or wait behind cover.', cutscene: 'praise' }
  ], ['Hamsa', 'Vishnu', 'Kuttappan', 'Sudhi']),
  chapter(7, 'The Proof', 'Something from the handoff has found its way into the station.', 'raidExit', [
    { id: 'evidence', scene: 'Town', mode: 'interact', at: 'evidence', goal: 'Search the investigation area', hint: 'Use the police station’s front entrance.', prompt: 'Enter the investigation area', cutscene: 'proof' },
    { id: 'meera', scene: 'Town', mode: 'interact', at: 'clinic', goal: 'Take the envelope to Dr. Meera', prompt: 'Speak to Dr. Meera', actor: 'Meera', dialogue: 'clinic' }
  ], ['Alex', 'Vishnu', 'Meera']),
  chapter(8, 'The Rooftop', 'The two spies finally face each other.', 'clinic', [
    { id: 'towerReturn', scene: 'Town', mode: 'interact', at: 'roofDoor', goal: 'Return to the Roof Tower', prompt: 'Take the roof stairs' },
    { id: 'arrest', scene: 'Roof', mode: 'interact', spawn: 'entry', at: 'meeting', goal: 'Confront Vishnu on the roof', prompt: 'Confront Vishnu', actor: 'Vishnu', cutscene: 'shooting' },
    { id: 'roofExit', scene: 'Roof', mode: 'interact', at: 'exit', goal: 'Leave the rooftop as Vishnu', prompt: 'Take the stairs down' }
  ], ['Alex', 'Vishnu', 'Sudhi']),
  chapter(9, 'The Ending', 'Vishnu goes home by way of the park.', 'entry', [
    { id: 'funeral', scene: 'Park', mode: 'auto', goal: 'Remember Alex', cutscene: 'funeral' },
    { id: 'goodbye', scene: 'Park', mode: 'interact', at: 'bench', goal: 'Meet Meera by the park bench', prompt: 'Speak to Dr. Meera', actor: 'Meera', dialogue: 'goodbye' },
    { id: 'parkExit', scene: 'Park', mode: 'arrive', at: 'exit', goal: 'Walk through Town Park toward home' },
    { id: 'home', scene: 'Town', mode: 'interact', spawn: 'homeStart', at: 'home', goal: 'Go to Vishnu’s home', prompt: 'Speak to Hamsa', actor: 'Hamsa', cutscene: 'ending' }
  ], ['Vishnu', 'Meera', 'Hamsa'])
] as const;
