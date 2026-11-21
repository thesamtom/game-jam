import type { Character } from '../entities/Npc';

interface Profile {
  id: Character;
  introduction: string;
  role: string;
  relationship: string;
  updates: readonly { flag: string; note: string }[];
}

export const characterProfiles: readonly Profile[] = [
  {
    id: 'Alex', introduction: 'You. A police officer working undercover in Kuttappan’s gang.',
    role: 'Undercover police officer', relationship: 'The officer you play at the start.',
    updates: [
      { flag: 'briefing', note: 'Raghavan sends Alex to find the officer leaking raid plans.' },
      { flag: 'meet', note: 'With Raghavan dead, Alex has nobody who can confirm his assignment.' },
      { flag: 'arrest', note: 'Sudhi shoots Alex on the roof. You now play as Vishnu.' }
    ]
  },
  {
    id: 'Vishnu', introduction: 'A respected police officer.',
    role: 'Police officer', relationship: 'A fellow officer who does not know Alex’s assignment.',
    updates: [
      { flag: 'briefing', note: 'Kuttappan took Vishnu in as a boy and raised him.' },
      { flag: 'van', note: 'You saw Vishnu warn Kuttappan about the raid. Alex still does not know who leaked the plan.' },
      { flag: 'raid', note: 'Vishnu shoots Kuttappan during the raid at the goods yard.' },
      { flag: 'evidence', note: 'Alex finds the envelope and learns Vishnu is the officer he has been looking for.' },
      { flag: 'arrest', note: 'Vishnu shoots Sudhi and blames him alone for the leaks and Alex’s death.' }
    ]
  },
  {
    id: 'Kuttappan', introduction: 'The powerful gang leader.',
    role: 'Gang leader', relationship: 'The man Alex needs to fool to work undercover.',
    updates: [
      { flag: 'briefing', note: 'He raised Vishnu and helped him become a police officer.' },
      { flag: 'accepted', note: 'He trusts Alex enough to invite him to the goods yard deal.' },
      { flag: 'raid', note: 'Vishnu, the man he raised as his son, shoots him during the raid.' }
    ]
  },
  {
    id: 'Meera', introduction: 'A psychiatrist, Vishnu’s girlfriend, and Alex’s counsellor.',
    role: 'Psychiatrist', relationship: 'Alex’s counsellor and Vishnu’s girlfriend.',
    updates: [
      { flag: 'meera', note: 'Alex gives Meera the evidence against Vishnu for safekeeping.' },
      { flag: 'goodbye', note: 'She tells Vishnu she is pregnant, then leaves him after reading the evidence.' }
    ]
  },
  {
    id: 'Raghavan', introduction: 'Alex’s boss and the only person who knows his undercover identity.',
    role: 'Senior police officer', relationship: 'Alex’s boss and only contact for the undercover assignment.',
    updates: [
      { flag: 'tip', note: 'Alex tells him when the gang will be at the goods yard.' },
      { flag: 'meet', note: 'Kuttappan’s crew kills him on the roof. Alex loses the only person who can vouch for him.' }
    ]
  },
  {
    id: 'Hamsa', introduction: 'A strict police investigator.',
    role: 'Police investigator', relationship: 'He works at Alex’s station and has been kept out of the assignment.',
    updates: [
      { flag: 'raid', note: 'Hamsa is suspended before Vishnu takes over the raid.' },
      { flag: 'home', note: 'Hamsa meets Vishnu at home and makes clear he does not believe the official account.' }
    ]
  },
  {
    id: 'Shaji', introduction: 'Kuttappan’s trusted right-hand man.',
    role: 'Kuttappan’s lieutenant', relationship: 'He tests Alex before letting him work for the gang.',
    updates: [
      { flag: 'orders', note: 'He gives Alex three jobs in Old Market.' },
      { flag: 'injured', note: 'He realizes Alex is the one leaking the gang’s plans.' }
    ]
  },
  {
    id: 'Sudhi', introduction: 'A quiet police officer.',
    role: 'Police officer', relationship: 'He works at the same station as Alex.',
    updates: [
      { flag: 'arrest', note: 'He also worked for Kuttappan. He shoots Alex, then Vishnu shoots him and puts all the blame on him.' }
    ]
  }
];
