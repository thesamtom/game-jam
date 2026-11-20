import Phaser from 'phaser';
import { button, interfaceRoot } from './UIScene';
import { loadCampaign } from '../systems/Save';
import type { RoamLaunch } from './CampaignScene';
import { audio } from '../systems/Audio';

export class CreditsScene extends Phaser.Scene {
  constructor() { super('Credits'); }
  create(data?: { ending?: boolean }) {
    audio.stopAmbience();
    this.cameras.main.setBackgroundColor('#111b22');
    const panel = document.createElement('section');
    panel.className = 'credits-screen';
    panel.innerHTML = `<div class="credits-inner">
      <p class="eyebrow">${data?.ending ? 'The End' : 'Credits'}</p>
      <h1>Randu Chaaran</h1><p class="subtitle">Two Spies</p>
      <dl>
        <dt>Story &amp; concept</dt><dd>Original project brief</dd>
        <dt>Pixel art</dt><dd>Kenney · Tiny City · CC0</dd>
        <dt>Sound</dt><dd>Procedural WebAudio</dd>
        <dt>Engine</dt><dd>Phaser 3</dd>
      </dl>
      <p class="credits-note">Karimkunnu and its characters are fictional.</p>
    </div>`;
    panel.querySelector('.credits-inner')!.append(button('Return to title', () => this.scene.start('Title'), 'menu-button'));
    if (data?.ending) {
      const saved = loadCampaign();
      if (saved?.finished) panel.querySelector('.credits-inner')!.append(button('Explore Karimkunnu', () => {
        audio.unlock();
        const launch: RoamLaunch = { campaign: saved.campaign, roam: true };
        this.scene.start('Town', launch);
      }, 'menu-button'));
    }
    interfaceRoot().append(panel);
    this.events.once('shutdown', () => panel.remove());
  }
}
