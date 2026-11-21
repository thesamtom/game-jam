import type Phaser from 'phaser';
import { characterProfiles } from '../data/characters';
import { actorTexture, CAST, type Character } from '../entities/Npc';

export function characterPortrait(scene: Phaser.Scene, id: Character): string {
  return (scene.textures.get(actorTexture(scene, id)).getSourceImage() as HTMLCanvasElement).toDataURL();
}

export function characterCards(portrait: (id: Character) => string, flags?: readonly string[]) {
  const grid = document.createElement('div');
  grid.className = 'character-grid';
  if (!flags) { grid.tabIndex = 0; grid.setAttribute('aria-label', 'Character introductions'); }
  for (const profile of characterProfiles) {
    const card = document.createElement('article');
    card.className = 'character-card';
    const image = document.createElement('img');
    image.alt = '';
    image.src = portrait(profile.id);
    const name = document.createElement('h3');
    name.textContent = CAST[profile.id].name;
    card.append(image, name);
    if (flags) {
      const role = document.createElement('div');
      role.className = 'character-role';
      role.textContent = profile.role;
      const relationship = document.createElement('p');
      relationship.textContent = 'Relationship to Alex: ' + profile.relationship;
      card.append(role, relationship);
    }
    const known = flags ? profile.updates.filter(update => flags.includes(update.flag)).map(update => update.note) : [];
    for (const note of known.length ? known : [profile.introduction]) {
      const current = document.createElement('p');
      current.textContent = note;
      card.append(current);
    }
    grid.append(card);
  }
  return grid;
}
