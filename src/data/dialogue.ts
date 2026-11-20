import type { Character } from '../entities/Npc';

export interface Choice { id: string; text: string; response: readonly Line[] }
export interface Line { speaker: Character | 'Shopkeeper' | 'Unknown Officer' | 'Narrator'; text: string; choices?: readonly Choice[] }
const line = (speaker: Line['speaker'], text: string, choices?: readonly Choice[]): Line => ({ speaker, text, choices });
export const dialogue = {
  briefing: [
    line('Raghavan', 'Three raids. Three empty rooms. Someone in the station is telling Kuttappan when we leave.'),
    line('Alex', 'You want me inside his gang.'),
    line('Raghavan', 'I want you to find the person keeping him safe. To everyone else, you’re a man looking for work.'),
    line('Hamsa', 'Saar, the yard file. Shall I wait outside?'),
    line('Raghavan', 'Leave it here, Hamsa. This gentleman was just going.'),
    line('Alex', 'If even he doesn’t know, who vouches for me?'),
    line('Raghavan', 'I do. Until we know who is listening, that will have to be enough.')
  ],
  beforeKuttappan: [
    line('Kuttappan', 'Come inside, mone. The step is dry. You can sit there as long as you like.')
  ],
  beforeUniform: [
    line('Narrator', 'Years later, Vishnu wore a police uniform. Kuttappan had seen to that.'),
    line('Vishnu', 'I know what I owe you, chetta. You don’t have to keep asking.')
  ],
  errands: [
    line('Shaji', 'Three things, aliyaa. Drop the parcel at the eastern step. Speak to the toddy shop. Pick up the cash by the west planter.'),
    line('Alex', 'What’s in the parcel?'),
    line('Shaji', 'Nothing you’re being paid to know.')
  ],
  delivery: [line('Narrator', 'Alex leaves the parcel beneath the step. Someone on the other side of the door stops moving.')],
  pressure: [
    line('Shopkeeper', 'Tell Shaji I’ll have it tomorrow. The rain kept everyone home.', [
      { id: 'firm', text: 'Shaji sent me for an answer. Give me a time.', response: [
        line('Shopkeeper', 'Before noon. Please. I don’t want him coming here himself.')] },
      { id: 'quiet', text: 'Keep your voice down. What can you pay today?', response: [
        line('Shopkeeper', 'What I have is by the west planter. Tell him that’s all there is.')] }
    ]),
    line('Alex', 'I’ll tell him.')
  ],
  cash: [line('Narrator', 'The notes are folded inside a piece of newspaper. Alex counts them by touch.')],
  welcome: [
    line('Kuttappan', 'Shaji says you listen before you speak. That will do.'),
    line('Alex', 'Does that mean you trust me?'),
    line('Kuttappan', 'Trust is easy, mone. Knowing when someone lies—that is the difficult part.'),
    line('Kuttappan', 'Goods yard tonight. Come to the north gate. Shaji will tell you where to stand.')
  ],
  message: [
    line('Alex', 'Goods Yard. North gate. 22:40. One van.'),
    line('Raghavan', 'Received. I’ll bring the raid forward. Stay outside until it’s quiet.')
  ],
  emptyVan: [
    line('Alex', 'No crates. No driver. The engine is still warm.'),
    line('Raghavan', 'We were fast. Someone was faster. Find out who knew.')
  ],
  warning: [
    line('Vishnu', 'They moved the raid up. Leave the van, chetta. Take everything else.'),
    line('Kuttappan', 'Only my own people knew about tonight. Shaji, find me the one who talked.'),
    line('Vishnu', 'I’ll look from this side.')
  ],
  handoff: [
    line('Kuttappan', 'The names are in the envelope. Read them somewhere quiet.'),
    line('Unknown Officer', 'You were followed. Don’t turn around.'),
    line('Alex', 'A police cap. That’s all I got.')
  ],
  roofClue: [
    line('Narrator', 'A torn note lies beneath the curb. “Roof Tower. Same time. Come alone.”'),
    line('Alex', 'If they found his meeting place, Raghavan needs to hear it from me.')
  ],
  raghavanRoof: [
    line('Alex', 'Pull me out, saar. They know where we meet. You and I might both be exposed.'),
    line('Raghavan', 'All right. No more calls. We’ll go straight to Hamsa.'),
    line('Shaji', 'Going somewhere?'),
    line('Kuttappan', 'Raghavan. You should have told me there was a problem.')
  ],
  injured: [
    line('Shaji', 'I know you’re the informer.'),
    line('Alex', 'Can you stand?'),
    line('Shaji', 'Don’t touch me, eda. Take the alley. Next time I see you, I’ll say it louder.')
  ],
  raid: [
    line('Vishnu', 'Hamsa is suspended. This raid is under my command. Hold the exits.'),
    line('Kuttappan', 'You always called first. Even when you wore that uniform.'),
    line('Vishnu', 'I asked you to leave town. You told me I’d come around.'),
    line('Kuttappan', 'I thought you would, mone.')
  ],
  father: [line('Kuttappan', 'I made you a policeman, mone. I never taught you how to stop being my son.')],
  proof: [
    line('Alex', 'The envelope from the street. On Vishnu’s desk.'),
    line('Narrator', 'Inside are raid times, payment amounts, and a note in Kuttappan’s hand. Vishnu’s name appears on every page.'),
    line('Vishnu', 'Raghavan’s source file. Remove the last copy. There’s no officer left to reopen it.'),
    line('Alex', 'Raghavan was the only one who could say why I was there.')
  ],
  clinic: [
    line('Meera', 'You missed your session. Last time, you said you were afraid you’d forget which version of yourself to bring here.'),
    line('Alex', 'I need you to keep this. Read it after I leave.'),
    line('Meera', 'That’s Vishnu’s name. What are you asking me to believe?'),
    line('Alex', 'Nothing from me. Read it, then decide for yourself. If I don’t come back, take it to Hamsa.')
  ],
  rooftop: [
    line('Alex', 'The yard, the envelope, my file. It was you.'),
    line('Vishnu', 'And you were Raghavan’s man. I spent weeks looking for somebody in uniform.'),
    line('Alex', 'Vishnu, you’re under arrest for leaking police operations and conspiring with Kuttappan. Step away from the edge.'),
    line('Vishnu', 'Where were you going to take me? The station?'),
    line('Sudhi', 'The same station that paid Kuttappan twice over? He had me there long before you started asking.'),
    line('Alex', 'Sudhi. Put it down.')
  ],
  coverup: [
    line('Vishnu', 'Control, this is Vishnu. Suspect Sudhi acted alone.'),
    line('Narrator', 'Vishnu rewrites the seizure list. Only the papers that implicate Sudhi make it into his report. He doesn’t know what Meera already has.')
  ],
  goodbye: [
    line('Meera', 'I kept the papers. I read them twice, hoping I’d misunderstood something.'),
    line('Vishnu', 'Let me explain.'),
    line('Meera', 'I’m pregnant, Vishnu. I wanted to tell you here because this was where I used to feel safe.'),
    line('Vishnu', 'Where will you go?'),
    line('Meera', 'I’ll let you know when I’m ready. Please don’t follow me.')
  ],
  home: [
    line('Hamsa', 'You changed the report after midnight. Sudhi appears on every page. You appear on none.'),
    line('Vishnu', 'You were suspended, Hamsa. You weren’t there.'),
    line('Hamsa', 'No. But I know what an honest report looks like. I never believed yours.'),
    line('Vishnu', 'Come inside, saar. We can talk.')
  ]
} satisfies Record<string, readonly Line[]>;
export type DialogueId = keyof typeof dialogue;
