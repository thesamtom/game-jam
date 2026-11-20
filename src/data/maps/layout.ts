import { TILE_SIZE, type Stamp } from '../tiles';

export interface Point { x: number; y: number }
export interface Box { x: number; y: number; w: number; h: number }
export interface Patch extends Box { color: string; detail?: string }
export interface Art extends Point { stamp: Stamp; above?: boolean }
export interface Sign extends Point { text: string; color: string }
export interface District extends Box { title: string }
export interface Layout {
  cols: number; rows: number; ground: string;
  patches: Patch[]; art: Art[]; solids: Box[]; signs: Sign[]; lamps: Point[];
  districts: District[]; marks: Record<string, Point>;
}
export const cell = (x: number, y: number): Point => ({ x: x * TILE_SIZE + 8, y: y * TILE_SIZE + 8 });
export const box = (x: number, y: number, w: number, h: number): Box => ({ x, y, w, h });
export function patch(layout: Layout, x: number, y: number, w: number, h: number, color: string, detail?: string) {
  layout.patches.push({ ...box(x, y, w, h), color, detail });
}
export function stamp(layout: Layout, x: number, y: number, tiles: Stamp, solid?: Box, above = false) {
  layout.art.push({ x, y, stamp: tiles, above });
  if (solid) layout.solids.push(solid);
}
export function buildLayout(cols: number, rows: number, ground: string): Layout {
  return { cols, rows, ground, patches: [], art: [], solids: [], signs: [], lamps: [], districts: [], marks: {} };
}
