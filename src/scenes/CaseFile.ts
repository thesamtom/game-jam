import { town } from '../data/maps/town';
import { TILE } from '../data/tiles';
import { chapters } from '../data/chapters';
import { discoveries, unlocked } from '../data/discoveries';
import { activities, activityStatus } from '../data/activities';
import { achievements } from '../systems/Achievements';
import { districtId, districtNames } from '../systems/ExplorationManager';
import { currentRank, ranks } from '../systems/ProgressionManager';
import type { Campaign } from '../systems/QuestManager';
import { rewards } from '../systems/RewardManager';
import { button } from './UIScene';

const tabs = ['Briefing', 'Leads', 'People', 'Records'] as const;
type Tab = typeof tabs[number];
const profiles = [
  ['Alex', 'briefing', 'Undercover operative. Raghavan is his sole police contact.', 'evidence', 'Vishnu was the source Alex had been tracking.'],
  ['SP Raghavan', 'briefing', 'Alex’s commanding officer and handler.', 'meet', 'His death leaves Alex without official protection.'],
  ['CI Hamsa', 'briefing', 'An investigator who keeps his own copies of the paperwork.', 'raid', 'The raid went ahead while he was suspended.'],
  ['Shaji', 'orders', 'Handles Kuttappan’s errands and watches new arrivals.', 'injured', 'He recognized Alex as the informer.'],
  ['Kuttappan', 'accepted', 'Controls the market and raised Vishnu.', 'survive', 'His final encounter with Vishnu took place at the goods yard.'],
  ['Vishnu', 'briefing', 'A police officer raised by Kuttappan.', 'evidence', 'He leaked police information to the gang.'],
  ['Dr. Meera', 'clinic', 'The psychiatrist Alex trusted with the evidence.', 'goodbye', 'She left after reading the papers.'],
  ['Sudhi', 'arrest', 'A second gang infiltrator inside the force.', '', '']
] as const;

export function element<K extends keyof HTMLElementTagNameMap>(tag: K, text: string, className?: string) {
  const node = document.createElement(tag);
  node.textContent = text;
  if (className) node.className = className;
  return node;
}

export function renderCaseFile(panel: HTMLElement, campaign: Campaign, selected: Tab, close: () => void,
  quiet: () => void, renderExtras?: (tab: Tab, body: HTMLElement) => void) {
  const render = (tab: Tab) => renderCaseFile(panel, campaign, tab, close, quiet, renderExtras);
  const rank = currentRank(campaign.field.xp);
  const header = document.createElement('header');
  const hasSeal = Object.values(campaign.field.envelopes).includes('copper-seal');
  header.classList.toggle('copper-seal', hasSeal);
  header.append(element('span', hasSeal ? 'Karimkunnu · Copper seal' : 'Karimkunnu', 'eyebrow'), element('h2', 'Case File'),
    element('p', rank.name + '  /  ' + campaign.field.xp + ' XP', 'file-meta'), button('Close', close, 'icon-button'));
  const nav = document.createElement('nav');
  nav.setAttribute('aria-label', 'Case File sections');
  for (const name of tabs) {
    const item = button(name, () => { render(name); panel.querySelector<HTMLButtonElement>('nav [aria-current="page"]')?.focus(); }, 'menu-button');
    if (name === selected) item.setAttribute('aria-current', 'page');
    nav.append(item);
  }
  const body = document.createElement('div');
  body.className = 'file-body';
  const heading = (text: string) => body.append(element('h3', text));
  const row = (name: string, note: string) => {
    const item = document.createElement('article');
    item.append(element('strong', name), element('p', note));
    body.append(item);
  };
  const field = campaign.field;
  if (selected === 'Briefing') {
    heading('Main Story');
    for (const chapter of chapters.slice(0, campaign.chapter)) {
      const complete = chapter.completionConditions.every(flag => campaign.flags.includes(flag));
      row('Chapter ' + chapter.id + ' · ' + chapter.title, complete ? 'Completed' : chapter.description);
    }
    heading('Current Objectives');
    const chapter = chapters[campaign.chapter - 1];
    row(campaign.flags.includes('home') ? 'Campaign complete' : chapter.objectives[campaign.objective].goal,
      campaign.identity === 'Alex' ? 'Alex’s field notes' : 'Vishnu carries the case forward. Alex’s notes remain on file.');
    heading('Town Conditions');
    const hour = String(Math.floor(field.minute / 60)).padStart(2, '0');
    const minute = String(field.minute % 60).padStart(2, '0');
    row(field.town + ' · ' + hour + ':' + minute, 'Local time follows case developments. Return after a new lead or chapter to find changes.');
    heading('Reputation');
    row('Gang Trust ' + field.trust + ' / 100', 'Higher trust opens more market leads and challenge invitations.');
    row('Police Suspicion ' + field.suspicion + ' / 100', 'Attention changes optional leads and the tone of local reports.');
  } else if (selected === 'Leads') {
    heading('Discovered Clues');
    const found = discoveries.filter(site => field.discoveries.includes(site.saveFlag));
    if (!found.length) row('No clues logged yet', 'Investigate a teal signal when one appears near you.');
    for (const site of found) {
      row(site.name, site.description);
      const icon = element('span', '', 'file-icon');
      const tile = site.kind === 'landmark' ? TILE.bollard : site.kind === 'observation' ? TILE.lampTop : TILE.planterEmpty;
      icon.style.backgroundPosition = `-${tile % 12 * 24}px -${Math.floor(tile / 12) * 24}px`;
      icon.style.backgroundImage = `url(${import.meta.env.BASE_URL}assets/kenney/Tilemap/tilemap_packed.png)`;
      body.lastElementChild?.prepend(icon);
    }
    if (rank.xp >= 400 || field.investigation >= 3) {
      heading('Location Hints');
      for (const site of discoveries.filter(site => !found.includes(site) && unlocked(site.unlock, campaign)
        && (rank.xp >= 1400 || site.kind !== 'envelope'))) row(site.district, site.hint);
    }
    heading('Dead Drop Notes');
    for (const rewardId of Object.values(field.envelopes)) {
      const reward = rewards.find(item => item.id === rewardId);
      if (reward) row(reward.title, reward.text);
    }
    if (!Object.keys(field.envelopes).length) row('No envelopes opened.', 'Look for small amber signals as you explore.');
    heading('Side Activities');
    body.append(element('p', activities.filter(item => activityStatus(item, field.activities) === 'solved').length + ' / ' + activities.length + ' investigations solved.', 'file-meta'));
    if (field.suspicion >= 25) row('Some contacts are keeping quiet.', 'Complete a neutral investigation or move on to another district to draw less attention.');
    for (const activity of activities.filter(item => unlocked(item.unlock, campaign))) {
      const status = activityStatus(activity, field.activities);
      row(activity.name + ' · ' + activity.district,
        status === 'solved' ? activity.result : status === 'comparison' ? 'Compare the evidence near ' + activity.comparison.location.toLowerCase() + '.'
          : 'Start near ' + activity.lead.location.toLowerCase() + '.');
    }
    renderExtras?.(selected, body);
  } else if (selected === 'People') {
    heading('Character Profiles');
    for (const [name, flag, note, updateFlag, update] of profiles) {
      if (campaign.flags.includes(flag)) row(name, note + (campaign.flags.includes(updateFlag) ? ' ' + update : ''));
    }
    if (!campaign.flags.includes('briefing')) row('Profiles unlock as the story develops.', '');
  } else {
    heading('Undercover Rank');
    const next = ranks.find(item => item.xp > field.xp);
    row(rank.name, rank.benefit + (next ? ' Next rank in ' + (next.xp - field.xp) + ' XP.' : ' Highest rank reached.'));
    heading('Town Exploration');
    body.append(townMap(field.districts));
    row(field.districts.length + ' / ' + districtNames.length + ' districts', districtNames.filter(name => field.districts.includes(districtId(name))).join(' · ') || 'No districts recorded.');
    row(field.discoveries.length + ' / ' + discoveries.length + ' discoveries', 'Landmarks, clues, observations, envelopes and passages.');
    heading('Achievements');
    for (const achievement of achievements) row(achievement.name, (field.achievements.includes(achievement.id) ? 'Earned · ' : '') + achievement.goal);
    heading('Mission Records');
    renderExtras?.(selected, body);
    body.append(button(field.quiet ? 'Turn field notifications on' : 'Turn field notifications off', () => { quiet(); render(selected); }, 'menu-button'));
  }
  panel.replaceChildren(header, nav, body);
}

function townMap(discovered: readonly string[]) {
  const map = element('div', '', 'file-town-map');
  map.setAttribute('aria-label', 'Karimkunnu district map');
  for (const district of town.districts) {
    const seen = discovered.includes(districtId(district.title));
    const marker = element('span', district.title, seen ? 'charted' : 'uncharted');
    marker.setAttribute('aria-label', district.title + (seen ? ', visited' : ', unexplored'));
    marker.style.left = district.x / town.cols * 100 + '%';
    marker.style.top = district.y / town.rows * 100 + '%';
    marker.style.width = district.w / town.cols * 100 + '%';
    marker.style.height = district.h / town.rows * 100 + '%';
    map.append(marker);
  }
  return map;
}
