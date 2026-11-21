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
  chapter(1, 'Two Spies', 'You are Alex, a police officer working undercover. SP Raghavan needs you to find out who in the police is warning Kuttappan about raids.', 'start', [
    { id: 'opening', scene: 'Town', mode: 'auto', goal: 'Arrive in Karimkunnu', cutscene: 'opening' },
    { id: 'briefing', scene: 'Town', mode: 'interact', at: 'raghavan', goal: 'Meet SP Raghavan at the police station to learn your assignment', hint: 'Police station, at the blue-grey building.', actor: 'Raghavan', prompt: 'Speak to Raghavan', dialogue: 'briefing', cutscene: 'childhood' },
    { id: 'market', scene: 'Town', mode: 'arrive', at: 'marketEntry', goal: 'Reach Old Market to meet Shaji and get inside Kuttappan’s gang', hint: 'Cross east through the main junction.' }
  ], ['Raghavan', 'Hamsa', 'Vishnu', 'Kuttappan']),
  chapter(2, 'Joining the Gang', 'Raghavan sent Alex to infiltrate Kuttappan’s gang and find the police traitor. To get inside, Alex first has to earn Shaji’s trust.', 'marketEntry', [
    { id: 'orders', scene: 'Town', mode: 'interact', at: 'shaji', goal: 'Talk to Shaji at General Stores to earn the gang’s trust', prompt: 'Speak to Shaji', actor: 'Shaji', dialogue: 'errands' },
    { id: 'deliver', scene: 'Town', mode: 'interact', at: 'package', goal: 'Deliver Shaji’s parcel to the eastern step in Old Market', prompt: 'Deliver the package', dialogue: 'delivery' },
    { id: 'pressure', scene: 'Town', mode: 'interact', at: 'shopkeeper', goal: 'Ask the toddy shop for the money it owes Shaji', prompt: 'Call through the door', dialogue: 'pressure' },
    { id: 'collect', scene: 'Town', mode: 'interact', at: 'money', goal: 'Collect Shaji’s payment by the west planter', prompt: 'Pick up the newspaper', dialogue: 'cash' },
    { id: 'accepted', scene: 'Town', mode: 'interact', at: 'kuttappan', goal: 'Report to Kuttappan so Alex can join the gang', prompt: 'Speak to Kuttappan', actor: 'Kuttappan', dialogue: 'welcome' }
  ], ['Shaji', 'Kuttappan']),
  chapter(3, 'The Failed Deal', 'Alex has earned Kuttappan’s trust. A smuggling deal at the goods yard gives him his first chance to help the police catch the gang.', 'kuttappan', [
    { id: 'tip', scene: 'Town', mode: 'interact', at: 'phone', goal: 'Send Raghavan the time and location of the goods yard deal', hint: 'Use the quiet corner just north of the goods yard.', prompt: 'Open secure messages', dialogue: 'message' },
    { id: 'gate', scene: 'Town', mode: 'arrive', at: 'yardGate', goal: 'Enter the goods yard through the north gate to check the raid' },
    { id: 'van', scene: 'Town', mode: 'interact', at: 'van', goal: 'Search the van to see what the gang left behind', prompt: 'Check the cargo hold', dialogue: 'emptyVan', cutscene: 'warning' }
  ], ['Raghavan', 'Vishnu', 'Kuttappan']),
  chapter(4, 'The Hunt', 'Vishnu warned the gang, so the police found an empty van. Alex is hunting the officer who warned Kuttappan, while Vishnu is hunting the gang member who tipped off the police.', 'huntStart', [
    { id: 'tail', scene: 'Town', mode: 'tail', spawn: 'huntStart', at: 'handoff', goal: 'Follow Kuttappan unseen to learn who is helping him', hint: 'Stay close, outside the cone. Buildings and vehicles block sight.', cutscene: 'handoff' },
    { id: 'clue', scene: 'Town', mode: 'interact', at: 'handoff', goal: 'Read the torn note for a clue about the roof meeting', prompt: 'Read the note', dialogue: 'roofClue' }
  ], ['Kuttappan', 'Vishnu']),
  chapter(5, 'Raghavan Dies', 'Alex saw Kuttappan pass an envelope to a police officer, but couldn’t see his face. A torn note suggests their secret meeting place may have been found.', 'handoff', [
    { id: 'towerIn', scene: 'Town', mode: 'interact', at: 'roofDoor', goal: 'Go to the Roof Tower to warn Raghavan about the meeting', prompt: 'Take the roof stairs' },
    { id: 'meet', scene: 'Roof', mode: 'interact', spawn: 'entry', at: 'meeting', goal: 'Ask Raghavan to pull Alex out before the gang exposes them', prompt: 'Speak to Raghavan', dialogue: 'raghavanRoof', actor: 'Raghavan', cutscene: 'fall' },
    { id: 'injured', scene: 'Town', mode: 'interact', spawn: 'escapeStart', at: 'shajiInjured', goal: 'Find out what Shaji knows before leaving the alley', prompt: 'Speak to Shaji', actor: 'Shaji', dialogue: 'injured' },
    { id: 'alley', scene: 'Town', mode: 'arrive', at: 'alleyExit', goal: 'Escape through the marked alley' }
  ], ['Raghavan', 'Alex', 'Shaji', 'Kuttappan']),
  chapter(6, 'Kuttappan Falls', 'Kuttappan’s crew killed Raghavan, the only officer who could vouch for Alex. With Hamsa suspended, Vishnu now leads a raid against the man who raised him.', 'raidStart', [
    { id: 'raid', scene: 'Town', mode: 'interact', spawn: 'raidStart', at: 'raidRendezvous', goal: 'Find cover at the goods yard and watch Vishnu lead the raid', prompt: 'Look into the yard', cutscene: 'raid' },
    { id: 'survive', scene: 'Town', mode: 'arrive', spawn: 'safeCover', at: 'raidExit', goal: 'Use the west gate to escape without alerting the police', hint: 'Avoid the patrol cones or wait behind cover.', cutscene: 'praise' }
  ], ['Hamsa', 'Vishnu', 'Kuttappan', 'Sudhi']),
  chapter(7, 'The Proof', 'Vishnu shot Kuttappan during the raid and got credit for taking down the gang. Alex still needs proof of who leaked the raid plans, and Raghavan can no longer vouch for him.', 'raidExit', [
    { id: 'evidence', scene: 'Town', mode: 'interact', at: 'evidence', goal: 'Search the police station for proof of who leaked the raid plans', hint: 'Use the police station’s front entrance.', prompt: 'Enter the investigation area', cutscene: 'proof' },
    { id: 'meera', scene: 'Town', mode: 'interact', at: 'clinic', goal: 'Give the envelope to Dr. Meera at the clinic for safekeeping', prompt: 'Speak to Dr. Meera', actor: 'Meera', dialogue: 'clinic' }
  ], ['Alex', 'Vishnu', 'Meera']),
  chapter(8, 'The Rooftop', 'The envelope proved that Vishnu was leaking police plans. Alex left the evidence with Meera and is ready to confront Vishnu.', 'clinic', [
    { id: 'towerReturn', scene: 'Town', mode: 'interact', at: 'roofDoor', goal: 'Return to the Roof Tower to confront Vishnu about the leaks', prompt: 'Take the roof stairs' },
    { id: 'arrest', scene: 'Roof', mode: 'interact', spawn: 'entry', at: 'meeting', goal: 'Confront Vishnu on the roof and tell him what the envelope proves', prompt: 'Confront Vishnu', actor: 'Vishnu', cutscene: 'shooting' },
    { id: 'roofExit', scene: 'Roof', mode: 'interact', at: 'exit', goal: 'As Vishnu, take the stairs down from the roof', prompt: 'Take the stairs down' }
  ], ['Alex', 'Vishnu', 'Sudhi']),
  chapter(9, 'The Ending', 'Sudhi killed Alex, and Vishnu shot Sudhi and blamed him for everything. You now play as Vishnu, but Meera still has the evidence Alex gave her.', 'entry', [
    { id: 'funeral', scene: 'Park', mode: 'auto', goal: 'Remember Alex', cutscene: 'funeral' },
    { id: 'goodbye', scene: 'Park', mode: 'interact', at: 'bench', goal: 'After the funeral, meet Meera by the bench in Town Park', prompt: 'Speak to Dr. Meera', actor: 'Meera', dialogue: 'goodbye' },
    { id: 'parkExit', scene: 'Park', mode: 'arrive', at: 'exit', goal: 'Walk through Town Park toward home' },
    { id: 'home', scene: 'Town', mode: 'interact', spawn: 'homeStart', at: 'home', goal: 'Go to Vishnu’s home to speak with Hamsa', prompt: 'Speak to Hamsa', actor: 'Hamsa', cutscene: 'ending' }
  ], ['Vishnu', 'Meera', 'Hamsa'])
] as const;
