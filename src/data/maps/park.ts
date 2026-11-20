import { STAMP, TILE } from '../tiles';
import { box, buildLayout, cell, patch, stamp } from './layout';

export const park = buildLayout(32, 22, '#545e46');
patch(park, 1, 1, 30, 20, '#6c7856', '#76805f');
patch(park, 3, 9, 26, 4, '#a3916c', '#9a8868');
patch(park, 14, 2, 4, 18, '#ac9b75', '#a1946f');
patch(park, 9, 7, 14, 8, '#a69470', '#9b8e6a');
patch(park, 10, 8, 12, 6, '#b2a17a', '#a49872');
patch(park, 26, 9, 5, 4, '#9b9076', '#8d846e');
for (let x = 1; x < 31; x += 3) {
  if (x !== 13 && x !== 16) {
    stamp(park, x, 1, STAMP.fence, box(x, 1.7, 3, .3));
    stamp(park, x, 20, STAMP.fence, box(x, 20.7, 3, .3));
  }
}
park.solids.push(box(0, 0, .9, 22), box(31.1, 0, .9, 22));
for (const [x, y] of [[3, 4], [5, 7], [7, 5], [10, 4], [12, 5], [20, 4], [24, 6], [28, 5],
  [3, 16], [6, 18], [9, 16], [11, 18], [20, 18], [24, 16], [26, 18], [29, 16]]) {
  stamp(park, x, y - 1, (x + y) % 3 ? STAMP.greenTree : STAMP.amberTree, box(x + .3, y + .5, .4, .4), true);
}
for (const [x, y] of [[6, 10], [15, 8], [24, 11]]) {
  stamp(park, x, y, STAMP.bench, box(x + .14, y + .52, 2.7, .35), true);
}
for (const [x, y] of [[3, 10], [7, 12], [19, 13], [24, 9], [27, 11]]) {
  stamp(park, x, y, STAMP.hedge, box(x + .12, y + .57, 2.8, .32), true);
}
for (const [x, y] of [[12, 12], [19, 8], [29, 10], [16, 17]]) {
  stamp(park, x, y - 1, STAMP.lamp, box(x + .4, y + .45, .2, .35), true);
  park.lamps.push(cell(x, y - .55));
}
stamp(park, 21, 11, [[TILE.planter]], box(21.3, 11.55, .4, .35), true);
park.signs.push({ x: 27.5, y: 9.1, text: 'POLICE QUARTER  ›', color: '#dbe0b5' });
park.districts.push({ ...box(0, 0, 32, 22), title: 'TOWN PARK' });
park.marks = { entry: cell(15, 18.5), bench: cell(16, 9.6), exit: cell(29.6, 10.25) };
