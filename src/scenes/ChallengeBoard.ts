import { challenges } from '../data/challenges';
import { unlocked } from '../data/discoveries';
import { ChallengeManager } from '../systems/ChallengeManager';
import type { Campaign } from '../systems/QuestManager';
import { element } from './CaseFile';
import { button } from './UIScene';

export function renderChallengeBoard(parent: HTMLElement, campaign: Campaign | undefined,
  launch: (id: string) => void, replayOnly: boolean) {
  const records = ChallengeManager.leaderboard();
  const visible = challenges.filter(mission => replayOnly
    ? Object.hasOwn(records, mission.id) || Boolean(campaign?.field.records[mission.id])
    : Boolean(campaign && (campaign.field.records[mission.id] || unlocked(mission.unlock, campaign))));
  if (!visible.length) parent.append(element('p', 'Complete a challenge through the campaign to replay it here.'));
  for (const mission of visible) {
    const best = records[mission.id] ?? campaign?.field.records[mission.id];
    const row = document.createElement('article');
    const replay = replayOnly || Boolean(campaign?.field.records[mission.id]);
    row.append(element('strong', mission.title + ' · ' + mission.category),
      element('p', best ? 'Personal best · Rank ' + best.grade + ' · ' + best.score + ' points · ' + best.seconds + ' s' : mission.description),
      button(replay ? 'Replay ' + mission.title : 'Start ' + mission.title, () => launch(mission.id), 'menu-button'));
    parent.append(row);
  }
  if (campaign && !replayOnly && campaign.chapter >= 3 && !visible.some(mission => mission.id === 'signal-survey')) {
    parent.append(element('p', 'Signal Lamp Survey opens at 45 Gang Trust and below 28 Police Suspicion.'));
  }
  const results = Object.entries(records).sort(([, a], [, b]) => b.score - a.score);
  if (!results.length) return;
  parent.append(element('h3', 'Local leaderboard'));
  const list = document.createElement('ol');
  for (const [id, result] of results) {
    const title = challenges.find(mission => mission.id === id)?.title;
    if (title) list.append(element('li', title + ' · ' + result.grade + ' · ' + result.score + ' points'));
  }
  parent.append(list);
}
