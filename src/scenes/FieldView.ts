import type Phaser from 'phaser';
import type { Place } from '../data/chapters';
import { unlocked, type Discovery } from '../data/discoveries';
import { activities, activityStatus, type Activity } from '../data/activities';
import { checkAchievements } from '../systems/Achievements';
import { RewardManager } from '../systems/RewardManager';
import { renderChallengeBoard } from './ChallengeBoard';
import { renderCaseFile, element } from './CaseFile';
import type { Point } from '../data/maps/layout';
import type { Campaign } from '../systems/QuestManager';
import { closest, ExplorationManager } from '../systems/ExplorationManager';
import { FieldNotices } from './FieldNotices';
import { currentRank, ProgressionManager } from '../systems/ProgressionManager';
import { button } from './UIScene';

type ActivitySpot = { activity: Activity; at: Point; stage: 'lead' | 'comparison' };

export class FieldView {
  private readonly manager: ExplorationManager;
  private readonly marker: Phaser.GameObjects.Graphics;
  private readonly panel = document.createElement('section');
  private available: Discovery[] = [];
  private nearby?: Discovery;
  private activityNearby?: ActivitySpot;
  private activitySpots: ActivitySpot[] = [];
  private opened = false;
  readonly progression: ProgressionManager;
  readonly notices: FieldNotices;
  constructor(scene: Phaser.Scene, private readonly place: Place, private readonly campaign: Campaign,
    private readonly root: HTMLElement, private readonly save: () => void, private readonly stop: () => void,
    private readonly challenge: (id: string) => void) {
    this.manager = new ExplorationManager(campaign, place);
    this.notices = new FieldNotices(root, () => campaign.field.quiet);
    this.progression = new ProgressionManager(campaign, message => this.notices.push(message));
    scene.events.once('shutdown', () => this.notices.clear());
    this.marker = scene.add.graphics().setDepth(4900);
    this.panel.className = 'field-panel';
    this.panel.setAttribute('role', 'dialog');
    this.panel.setAttribute('aria-label', 'Field notes');
    this.panel.hidden = true;
    root.append(this.panel);
    this.refresh();
  }
  get active() { return this.opened; }
  get prompt() {
    return this.nearby ? (this.nearby.kind === 'envelope' ? 'Open ' : 'Inspect ') + this.nearby.name : this.activityNearby ? 'Investigate ' + this.activityNearby.activity.name : undefined;
  }
  refresh() {
    this.available = this.manager.available();
    this.activitySpots = this.place === 'Town' ? activities.flatMap(activity => {
      const stage = activityStatus(activity, this.campaign.field.activities);
      if (stage === 'solved' || !unlocked(activity.unlock, this.campaign)) return [];
      return [{ activity, stage, at: activity[stage].at }];
    }) : [];
  }
  achievements() {
    const earned = checkAchievements(this.campaign);
    if (earned.length) this.notices.push('Achievement · ' + earned.map(item => item.name).join(' / '));
  }
  private persist() { this.achievements(); this.save(); }
  visit(district: string) {
    if (!this.manager.visit(district)) return;
    this.progression.award(18, 'District discovered');
    this.achievements();
  }
  update(point: Point, enabled: boolean) {
    this.marker.clear();
    this.nearby = enabled ? closest(this.available, point, 19) : undefined;
    this.activityNearby = enabled ? closest(this.activitySpots, point, 19) : undefined;
    if (this.nearby && this.activityNearby && closest([this.nearby, this.activityNearby], point, 19) === this.activityNearby) this.nearby = undefined;
    if (!enabled) return;
    const scan = currentRank(this.campaign.field.xp).scan;
    for (const site of this.available) {
      const radius = (site.kind === 'landmark' ? 48 : site.kind === 'envelope' ? 21 : 29) + scan;
      if ((site.at.x - point.x) ** 2 + (site.at.y - point.y) ** 2 > radius ** 2) continue;
      const { x, y } = site.at;
      this.marker.fillStyle(0x142b30, .88).fillCircle(x, y - 5, 4);
      this.marker.lineStyle(1, site.kind === 'envelope' ? 0xe7bb86 : 0x9dd7c6, .92).strokeRect(x - 2, y - 7, 4, 4);
    }
    for (const { at: { x, y } } of this.activitySpots) {
      if ((x - point.x) ** 2 + (y - point.y) ** 2 > (40 + scan) ** 2) continue;
      this.marker.fillStyle(0x183139, .92).fillCircle(x, y - 6, 5);
      this.marker.lineStyle(1, 0x9dd7c6).strokeTriangle(x, y - 10, x - 3, y - 4, x + 3, y - 4);
    }
  }
  interact() {
    if (!this.nearby && this.activityNearby) { this.investigate(this.activityNearby); return; }
    const site = this.nearby;
    if (!site || !this.manager.inspect(site)) return;
    const reward = new RewardManager(this.campaign.field).claim(site);
    this.progression.award(reward?.xp ?? site.reward, site.name);
    this.refresh();
    this.persist();
    if (reward) {
      this.show(reward.title, reward.text, 'Dead drop opened · +' + reward.xp + ' XP');
      this.panel.classList.add('reward-reveal');
    } else this.show(site.name, site.description, 'Optional discovery · ' + site.district);
  }
  private investigate({ activity, stage }: ActivitySpot) {
    if (stage === 'lead') {
      this.campaign.field.activities[activity.id] = ['lead'];
      this.refresh();
      this.persist();
      this.show(activity.name, activity.lead.text + ' Compare it near ' + activity.comparison.location.toLowerCase() + '.', 'Optional investigation · Lead recorded');
      return;
    }
    this.show(activity.name, activity.comparison.text + ' ' + activity.question, 'Optional investigation · Compare the evidence');
    const response = document.createElement('p');
    response.setAttribute('aria-live', 'polite');
    const options = activity.answers.map((answer, index) => button(answer, () => {
      if (index !== activity.correct) {
        response.textContent = 'Look for what both notes actually support. The first note reads: ' + activity.lead.text;
        return;
      }
      this.campaign.field.activities[activity.id] = ['lead', 'solved'];
      this.campaign.field.investigation += 1;
      this.progression.award(activity.xp, activity.name);
      this.progression.reputation(activity.trust, activity.suspicion, 'Investigation completed');
      this.refresh();
      this.persist();
      this.show(activity.name, activity.result, 'Investigation solved · +' + activity.xp + ' XP');
    }, 'menu-button'));
    this.panel.querySelector('button')?.before(...options, response);
  }
  openFile() {
    this.show('Case File', '', '');
    this.panel.classList.add('case-file');
    renderCaseFile(this.panel, this.campaign, 'Briefing', () => this.close(), () => {
      this.campaign.field.quiet = !this.campaign.field.quiet;
      this.notices.clear();
      this.persist();
    }, (tab, body) => {
      if (tab === 'Records') renderChallengeBoard(body, this.campaign, this.challenge, false);
      else body.append(element('p', 'Investigation points · ' + this.campaign.field.investigation));
    });
    this.panel.querySelector<HTMLButtonElement>('header button')?.focus();
  }
  show(title: string, description: string, tag: string) {
    this.stop();
    this.opened = true;
    this.panel.hidden = false;
    this.panel.classList.remove('case-file', 'reward-reveal');
    this.root.classList.add('field-open');
    const label = document.createElement('span');
    label.className = 'eyebrow';
    label.textContent = tag;
    const heading = document.createElement('h2');
    heading.textContent = title;
    const summary = document.createElement('p');
    summary.textContent = description;
    const close = button('Back to town', () => this.close(), 'menu-button');
    this.panel.replaceChildren(label, heading, summary, close);
    close.focus();
  }
  close() {
    this.opened = false;
    this.panel.hidden = true;
    this.root.classList.remove('field-open');
  }
}
