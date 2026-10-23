import { NES_COLORS } from '../engine/Palette';
import type { Sprite } from './AssetManager';

/**
 * Sprites procedurais 16x16 dos veículos do mapa-múndi (barco e balão).
 */
export type VehicleId = 'boat' | 'balloon';

const PALETTE: Record<string, string> = {
  k: NES_COLORS.BLACK,
  w: NES_COLORS.WHITE,
  b: NES_COLORS.BROWN,
  d: NES_COLORS.DARK_BROWN,
  r: NES_COLORS.RED,
  g: NES_COLORS.GOLD,
  y: NES_COLORS.YELLOW,
  s: NES_COLORS.LIGHT_BLUE,
};

export const VEHICLE_RAW_DATA: Record<VehicleId, string[]> = {
  boat: [
    '................',
    '.......k........',
    '.......kw.......',
    '.......kww......',
    '.......kwww.....',
    '.......kwwww....',
    '.......kwwwww...',
    '.......kwwwwww..',
    '.......kkkkkkk..',
    '.......k........',
    '..kkkkkkkkkkkkk.',
    '.kbbbbbbbbbbbbbk',
    '.kbdbdbdbdbdbdbk',
    '..kbbbbbbbbbbbk.',
    '...kkkkkkkkkkk..',
    '................',
  ],
  balloon: [
    '.....kkkkkk.....',
    '...kkrrwwrrkk...',
    '..krrrrwwrrrrk..',
    '.krrrrrwwrrrrrk.',
    '.krrrrrwwrrrrrk.',
    '.kggggggggggggk.',
    '.krrrrrwwrrrrrk.',
    '..krrrrwwrrrrk..',
    '..kkrrrwwrrkk...',
    '...k.k....k.k...',
    '....k.k..k.k....',
    '.....kkkkkk.....',
    '.....kbbbbk.....',
    '.....kbdbbk.....',
    '.....kkkkkk.....',
    '................',
  ],
};

const cache = new Map<VehicleId, Sprite>();

export function getVehicleSprite(id: VehicleId): Sprite {
  const cached = cache.get(id);
  if (cached) return cached;

  const canvas = document.createElement('canvas');
  canvas.width = 16;
  canvas.height = 16;
  const ctx = canvas.getContext('2d')!;
  const matrix = VEHICLE_RAW_DATA[id];
  for (let y = 0; y < 16; y++) {
    const row = matrix[y] || '';
    for (let x = 0; x < 16; x++) {
      const color = PALETTE[row[x] || '.'];
      if (color) {
        ctx.fillStyle = color;
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }
  const sprite: Sprite = { canvas, width: 16, height: 16 };
  cache.set(id, sprite);
  return sprite;
}
