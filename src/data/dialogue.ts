import type { Character } from '../entities/Npc';

export interface Choice { id: string; text: string; response: readonly Line[] }
export interface Line { speaker: Character | 'Shopkeeper' | 'Unknown Officer' | 'Narrator'; text: string; choices?: readonly Choice[] }
const line = (speaker: Line['speaker'], text: string, choices?: readonly Choice[]): Line => ({ speaker, text, choices });
export const dialogue = {
  briefing: [
    line('Raghavan', 'Three raids. Three empty rooms. Someone in the police is warning Kuttappan before every raid.'),
    line('Alex', 'You want me to join the gang and find the officer.'),
    line('Raghavan', 'Exactly. Keep your badge hidden. Tell Shaji you’re looking for work.'),
    line('Hamsa', 'Saar, the yard file. Shall I wait outside?'),
    line('Raghavan', 'Leave it here, Hamsa. This gentleman was just going.'),
    line('Alex', 'If even he doesn’t know, who vouches for me?'),
    line('Raghavan', 'I do. I’m the only one who knows you’re undercover.')
  ],
  beforeKuttappan: [
    line('Kuttappan', 'Come inside, mone. The step is dry. You can sit there as long as you like.')
  ],
  beforeUniform: [
    line('Narrator', 'Kuttappan raised Vishnu. Years later, he helped him join the police.'),
    line('Vishnu', 'I remember what you did for me, chetta.')
  ],
  errands: [
    line('Shaji', 'Three jobs, aliyaa. Leave the parcel at the eastern step. Ask the toddy shop for our money. Pick up the cash by the west planter.'),
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
    line('Kuttappan', 'We have a deal at the goods yard tonight. Meet Shaji at the north gate.')
  ],
  message: [
    line('Alex', 'Goods Yard. North gate. 22:40. One van.'),
    line('Raghavan', 'Received. I’ll bring the raid forward. Stay outside until it’s quiet.')
  ],
  emptyVan: [
    line('Alex', 'No crates. No driver. The engine is still warm.'),
    line('Raghavan', 'Someone warned them. Alex, find the officer who leaked the plan.')
  ],
  warning: [
    line('Vishnu', 'The police are coming early, chetta. Empty the van and get everyone out.'),
    line('Kuttappan', 'One of my people told the police. Vishnu, find out who gave them the tip.'),
    line('Vishnu', 'I’ll check who’s been talking to the police.')
  ],
  handoff: [
    line('Kuttappan', 'Take the envelope. It has the raid times and the payments.'),
    line('Unknown Officer', 'You were followed. Don’t turn around.'),
    line('Alex', 'He’s a police officer, but I couldn’t see his face.')
  ],
  roofClue: [
    line('Narrator', 'A torn note lies beneath the curb. “Roof Tower. Same time. Come alone.”'),
    line('Alex', 'That’s where I meet Raghavan. I need to warn him.')
  ],
  raghavanRoof: [
    line('Alex', 'Pull me out, saar. The gang may know we meet up here.'),
    line('Raghavan', 'All right. No more calls. We’ll go straight to Hamsa.'),
    line('Shaji', 'Going somewhere?'),
    line('Kuttappan', 'So you’re the one Alex has been meeting.')
  ],
  injured: [
    line('Shaji', 'I know you’re the informer.'),
    line('Alex', 'Can you stand?'),
    line('Shaji', 'Take the alley, eda. Next time I see you, I’ll tell everyone.')
  ],
  raid: [
    line('Vishnu', 'Hamsa has been suspended. I’m leading the raid. Keep the exits covered.'),
    line('Kuttappan', 'You used to warn me before every raid. What changed, mone?'),
    line('Vishnu', 'I asked you to leave town. You should have listened.'),
    line('Kuttappan', 'I thought you would, mone.')
  ],
  father: [line('Kuttappan', 'I made you a policeman, mone. I never taught you how to stop being my son.')],
  proof: [
    line('Alex', 'That’s the envelope Kuttappan handed to the officer. It’s on Vishnu’s desk.'),
    line('Narrator', 'Alex finds raid times and payments from Kuttappan to Vishnu. Vishnu was the officer at the handoff.'),
    line('Vishnu', 'Delete Raghavan’s file on his undercover officer. There’s nobody left to challenge it.'),
    line('Alex', 'Without Raghavan or that file, I can’t prove I was working for the police.')
  ],
  clinic: [
    line('Meera', 'You missed our session, Alex. Last time you said you were losing track of who you were.'),
    line('Alex', 'Meera, I need you to keep this envelope safe. Read it after I leave.'),
    line('Meera', 'That’s my boyfriend’s name. What are you saying?'),
    line('Alex', 'Read it and decide for yourself. If I don’t come back, take it to Hamsa.')
  ],
  rooftop: [
    line('Alex', 'You warned Kuttappan about the raid. The envelope lists what he paid you.'),
    line('Vishnu', 'And you were Raghavan’s undercover officer. I was looking for you.'),
    line('Alex', 'Vishnu, you’re under arrest for helping Kuttappan. Step away from the edge.'),
    line('Vishnu', 'Where were you going to take me? The station?'),
    line('Sudhi', 'You thought he only had Vishnu? I’ve been working for Kuttappan for years.'),
    line('Alex', 'Sudhi. Put it down.')
  ],
  coverup: [
    line('Vishnu', 'This is Vishnu. Sudhi leaked the raid plans and shot Alex. He acted alone.'),
    line('Narrator', 'Vishnu changes the report to hide his own part. He doesn’t know Meera has the envelope.')
  ],
  goodbye: [
    line('Meera', 'Alex gave me the envelope. I read it twice, hoping I was wrong.'),
    line('Vishnu', 'Let me explain.'),
    line('Meera', 'I’m pregnant, Vishnu. I wanted to tell you here because this was where I used to feel safe.'),
    line('Vishnu', 'Where will you go?'),
    line('Meera', 'I’m leaving, Vishnu. Please don’t follow me.')
  ],
  home: [
    line('Hamsa', 'You changed the report after midnight. Sudhi appears on every page. You appear on none.'),
    line('Vishnu', 'You were suspended, Hamsa. You weren’t there.'),
    line('Hamsa', 'No. But I know what an honest report looks like. Yours doesn’t add up.'),
    line('Vishnu', 'Come inside, saar. We can talk.')
  ]
} satisfies Record<string, readonly Line[]>;
export type DialogueId = keyof typeof dialogue;
