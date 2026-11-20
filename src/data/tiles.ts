export const TILE_SIZE = 16;
export const SHEET = { width: 192, height: 176, columns: 12, rows: 11, frames: 132 } as const;
export const TILE = {
  blueRoofCenter: 19, brownRoofCenter: 13, brickWindow: 40, civicWindow: 46,
  roadNorthSouth: 61, roadEastWest: 76, crosswalk: 74, roadPlain: 77,
  treeAmberTop: 67, treeAmberBottom: 79, treeGreenTop: 68, treeGreenBottom: 80,
  planterEmpty: 69, planter: 71, planterLeft: 81, planterMiddle: 82, planterRight: 83,
  stopSign: 84, lampTop: 86, lampBase: 98, benchLeft: 93, benchMiddle: 94, benchRight: 95,
  bollard: 102, boy: 108, bin: 109, rock: 118, girl: 120, officer: 121,
  carNose: 122, carTail: 123, vanNose: 124, vanTail: 125,
  fenceLeft: 126, fenceMiddle: 127, fenceRight: 128
} as const;
export type Stamp = readonly (readonly number[])[];
export const STAMP = {
  brownRoof: [[0, 1, 2], [12, 13, 14], [24, 25, 26]],
  blueRoof: [[6, 7, 8], [18, 19, 20], [30, 31, 32]],
  brickFacade: [[36, 37, 38, 39, 40, 41], [48, 49, 50, 51, 52, 53]],
  civicFacade: [[42, 43, 44, 45, 46, 47], [54, 55, 56, 57, 58, 59]],
  lamp: [[TILE.lampTop], [TILE.lampBase]],
  amberTree: [[TILE.treeAmberTop], [TILE.treeAmberBottom]],
  greenTree: [[TILE.treeGreenTop], [TILE.treeGreenBottom]],
  car: [[TILE.carNose, TILE.carTail]],
  van: [[TILE.vanNose, TILE.vanTail]],
  fence: [[TILE.fenceLeft, TILE.fenceMiddle, TILE.fenceRight]],
  bench: [[TILE.benchLeft, TILE.benchMiddle, TILE.benchRight]],
  hedge: [[TILE.planterLeft, TILE.planterMiddle, TILE.planterRight]]
} as const satisfies Record<string, Stamp>;
export function validTile(index: number): boolean {
  return Number.isInteger(index) && index >= 0 && index < SHEET.frames;
}
