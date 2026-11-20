import { STAMP, TILE } from '../tiles';
import { box, buildLayout, cell, patch, stamp } from './layout';

export const town = buildLayout(48, 40, '#434c3d');
const walk = '#8b7e65';
const road = '#555d66';
const verge = '#a39a81';
patch(town, 2, 2, 18, 15, '#697777', '#778482');
patch(town, 27, 2, 19, 15, '#8c6c53', '#997a60');
patch(town, 27, 23, 19, 15, '#666b60', '#767970');
patch(town, 3, 23, 17, 13, '#68666a', '#777474');
patch(town, 20, 0, 7, 40, verge);
patch(town, 21, 0, 5, 40, road);
patch(town, 0, 17, 48, 6, verge);
patch(town, 0, 18, 48, 4, road);
for (const x of [0, 26.5]) {
  const w = x === 0 ? 21 : 21.5;
  patch(town, x, 18, w, .13, '#b3a991');
  patch(town, x, 21.86, w, .13, '#b3a991');
}
for (const [top, bottom] of [[0, 18], [22, 36]]) {
  patch(town, 21, top, .13, bottom - top, '#b3a991');
  patch(town, 25.86, top, .13, bottom - top, '#b3a991');
}
for (let x = 1; x < 47; x += 2) {
  if (x < 19 || x > 26) patch(town, x, 19.93, .8, .12, '#b3a787');
}
for (let y = 1; y < 36; y += 2) {
  if (y < 16 || y > 23) patch(town, 23.44, y, .12, .8, '#b3a787');
}
patch(town, 3, 9, 17, 2, '#a29b86', '#97917e');
patch(town, 27, 10, 19, 2, walk, '#9c8b70');
patch(town, 27, 14, 19, 2, walk, '#9c8b70');
patch(town, 8, 31, 10, 3, '#9b8e7a', '#867a6f');
patch(town, 20, 36, 7, 4, '#767a58', '#85886a');

function building(x: number, y: number, civic: boolean, name: string, wide = false) {
  const roof = civic ? [6, 7, 7, 7, 7, 8] : [0, 1, 1, 1, 1, 2];
  const middle = civic ? [18, 19, 19, 19, 19, 20] : [12, 13, 13, 13, 13, 14];
  const eave = civic ? [30, 31, 31, 31, 31, 32] : [24, 25, 25, 25, 25, 26];
  const facade = civic ? STAMP.civicFacade : STAMP.brickFacade;
  const rows = wide ? [roof, middle, middle, eave, ...facade] : [roof, middle, eave, ...facade];
  patch(town, x - 0.25, y + 0.25, 6.7, rows.length + 0.17, '#343d39');
  stamp(town, x, y, rows, box(x + 0.1, y + 0.1, 5.8, rows.length - 0.15));
  town.signs.push({ x: x + 3, y: y + rows.length - 1.5, text: name, color: civic ? '#c8dfdf' : '#f4d9a4' });
}
building(4, 4, true, 'KARIMKUNNU POLICE');
building(13, 4, true, 'MEERA CLINIC');
building(5, 11, true, 'VISHNU’S HOME');
building(28, 5, false, 'GENERAL STORES');
building(39, 5, false, 'കള്ളുഷാപ്പ്  /  TODDY SHOP');
building(35, 12, false, 'MARKET ANNEX');
building(9, 25, true, 'ROOF TOWER', true);

for (const x of [29, 34, 39, 43]) {
  patch(town, x, 27.1, 2.4, .13, '#9a9380');
  patch(town, x, 27.2, .14, 1.7, '#9a9380');
  patch(town, x + 2.25, 27.2, .14, 1.7, '#9a9380');
}
for (const [x, y] of [[3, 3], [11, 6], [17, 12], [19, 15], [28, 4], [33, 3], [43, 4], [45, 12], [4, 30], [16, 30]]) {
  stamp(town, x, y, [[TILE.planter]], box(x + .3, y + .52, .4, .36), true);
}
for (const x of [20, 26]) for (let y = 18; y < 22; y++) {
  stamp(town, x, y, [[TILE.crosswalk]]);
}
for (const x of [28, 35, 38, 41, 44]) stamp(town, x, 24, STAMP.fence, box(x, 24.75, 3, 0.25));
for (const x of [28, 31, 34, 37, 40, 43]) stamp(town, x, 36, STAMP.fence, box(x, 36.73, 3, 0.27));
town.solids.push(box(45.85, 25, .55, 11), box(27.5, 25, .45, 4), box(27.5, 33, .45, 3.7));
patch(town, 45.85, 25, .55, 11, '#545651');
patch(town, 27.5, 25, .45, 4, '#545651');
patch(town, 27.5, 33, .45, 3.7, '#545651');
town.signs.push({ x: 34, y: 24.4, text: 'GOODS YARD', color: '#e7c58c' },
  { x: 23.5, y: 38.75, text: 'TOWN PARK', color: '#dbdfb3' });

for (const [x, y] of [[3, 8], [19, 9], [28, 11], [43, 11], [32, 26], [43, 26], [43, 34], [13, 33], [21, 35], [26, 18], [18, 21]]) {
  stamp(town, x, y - 1, STAMP.lamp, box(x + .38, y + .44, .26, .34), true);
  town.lamps.push(cell(x, y - .55));
}
for (const [x, y] of [[1, 4], [2, 13], [17, 13], [1, 26], [4, 33], [17, 27], [26, 36], [38, 3], [46, 8], [45, 19], [1, 37], [7, 37], [15, 37]]) {
  stamp(town, x, y - 1, (x + y) % 2 ? STAMP.greenTree : STAMP.amberTree, box(x + .3, y + .5, .4, .4), true);
}
for (const [x, y] of [[10, 9], [16, 10], [29, 12], [42, 15], [4, 24], [15, 35]]) {
  stamp(town, x, y, STAMP.hedge, box(x + .15, y + .55, 2.7, .36), true);
}
for (const [x, y] of [[12, 13], [37, 11], [6, 34], [29, 32], [44, 27]]) {
  stamp(town, x, y, y > 26 ? [[TILE.bin]] : STAMP.bench, box(x + .1, y + .55, y > 26 ? .55 : 2.8, .35), true);
}
stamp(town, 12, 15, STAMP.car, box(12.13, 15.15, 1.7, .7), true);
stamp(town, 30, 28, STAMP.van, box(30.12, 28.08, 1.76, .77), true);
stamp(town, 39, 31, STAMP.van, box(39.12, 31.08, 1.76, .77), true);
stamp(town, 35, 32, STAMP.car, box(35.12, 32.08, 1.76, .77), true);
patch(town, 39.2, 31.12, 1.35, .22, '#b4b0a3');

town.districts.push(
  { ...box(0, 0, 21, 18), title: 'POLICE QUARTER' },
  { ...box(26, 0, 22, 18), title: 'OLD MARKET' },
  { ...box(27, 23, 21, 17), title: 'GOODS YARD' },
  { ...box(0, 23, 20, 17), title: 'ROOF TOWER' },
  { ...box(20, 36, 7, 4), title: 'TOWN PARK' }
);
town.marks = {
  start: cell(7, 10.2), raghavan: cell(7, 9.5), marketEntry: cell(29, 10.5),
  shaji: cell(31, 10.3), package: cell(44, 13), shopkeeper: cell(41, 10.1),
  money: cell(28.3, 15), kuttappan: cell(32.5, 10.3),
  phone: cell(26.2, 22.6), yardGate: cell(33, 25.8), van: cell(39, 32.3),
  huntStart: cell(30, 15.2), huntLayby: cell(30, 20), handoff: cell(32, 20.55), roofDoor: cell(12, 32.2),
  escapeStart: cell(14, 33), shajiInjured: cell(16.5, 33.5), alleyExit: cell(19, 35),
  raidStart: cell(29.4, 25.7), raidRendezvous: cell(37.6, 28.5), raidExit: cell(26.5, 32),
  safeCover: cell(36, 30.5),
  evidence: cell(7, 9.7), clinic: cell(16, 9.5), home: cell(8, 16.2),
  homeStart: cell(23, 35.5)
};
