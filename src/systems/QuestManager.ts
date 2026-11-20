import { chapters } from '../data/chapters';
import type { Point } from '../data/maps/layout';
import type { Identity } from '../entities/Player';

export interface Campaign {
  chapter: number;
  objective: number;
  flags: string[];
  choices: Record<string, string>;
  position?: Point;
  identity: Identity;
}
export function newCampaign(chapter = 1, objective = 0): Campaign {
  return { chapter, objective, flags: [], choices: {}, identity: chapter === 9 ? 'Vishnu' : 'Alex' };
}

export class QuestManager {
  constructor(readonly state: Campaign) {}
  get chapter() { return chapters[this.state.chapter - 1]; }
  get step() { return this.chapter.objectives[this.state.objective]; }
  choice(id: string) { this.state.choices[this.step.id] = id; }
  complete(id: string): 'step' | 'chapter' | 'credits' | 'ignored' {
    if (id !== this.step.id || this.state.flags.includes(id)) return 'ignored';
    this.state.flags.push(id);
    if (this.state.objective < this.chapter.objectives.length - 1) {
      this.state.objective++;
      return 'step';
    }
    if (!this.chapter.completionConditions.every(flag => this.state.flags.includes(flag))) {
      this.state.flags.pop();
      return 'ignored';
    }
    if (this.chapter.next === null) return 'credits';
    this.state.chapter = this.chapter.next;
    this.state.objective = 0;
    return 'chapter';
  }
}
