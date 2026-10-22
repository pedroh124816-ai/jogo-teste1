import { CONFIG } from '../config';
import { TILE_DEFS, TileDef } from '../data/tiles';
import { Renderer } from './Renderer';
import { Camera } from './Camera';
import { AssetManager } from '../assets/AssetManager';

export class TileMap {
  public readonly width: number;
  public readonly height: number;
  public readonly tileSize = CONFIG.screen.tileSize;

  private grid: string[][];
  private waterFrame = 0;
  private waterTimer = 0;

  constructor(mapData: readonly string[]) {
    this.height = mapData.length;
    this.width = mapData[0].length;
    this.grid = [];

    for (let y = 0; y < this.height; y++) {
      const row = mapData[y];
      const rowChars: string[] = [];
      for (let x = 0; x < this.width; x++) {
        rowChars.push(row[x] || '.');
      }
      this.grid.push(rowChars);
    }
  }

  /**
   * Checa se um tile do grid é sólido para colisão.
   * Coordenadas fora do mapa são consideradas sólidas.
   */
  public isSolid(tileX: number, tileY: number): boolean {
    if (tileX < 0 || tileX >= this.width || tileY < 0 || tileY >= this.height) {
      return true;
    }
    const char = this.grid[tileY][tileX];
    const def = TILE_DEFS[char];
    return def ? def.solid : false;
  }

  public getTileAt(tileX: number, tileY: number): TileDef | null {
    if (tileX < 0 || tileX >= this.width || tileY < 0 || tileY >= this.height) {
      return null;
    }
    const char = this.grid[tileY][tileX];
    return TILE_DEFS[char] || null;
  }

  public update(): void {
    // Animação da água (alterna entre 2 frames)
    this.waterTimer++;
    if (this.waterTimer >= CONFIG.map.waterAnimFrames) {
      this.waterTimer = 0;
      this.waterFrame = (this.waterFrame + 1) % 2;
    }
  }

  public render(renderer: Renderer, camera: Camera, assetManager: AssetManager): void {
    // Culling: desenha somente os tiles visíveis na câmera
    const minTileX = Math.max(0, Math.floor(camera.x / this.tileSize));
    const maxTileX = Math.min(this.width - 1, Math.ceil((camera.x + camera.viewportWidth) / this.tileSize));
    const minTileY = Math.max(0, Math.floor(camera.y / this.tileSize));
    const maxTileY = Math.min(this.height - 1, Math.ceil((camera.y + camera.viewportHeight) / this.tileSize));

    for (let ty = minTileY; ty <= maxTileY; ty++) {
      for (let tx = minTileX; tx <= maxTileX; tx++) {
        const char = this.grid[ty][tx];
        const def = TILE_DEFS[char] || TILE_DEFS['.'];

        let spriteId: string;
        if (Array.isArray(def.spriteId)) {
          spriteId = def.spriteId[this.waterFrame];
        } else {
          spriteId = def.spriteId;
        }

        const sprite = assetManager.getTile(spriteId);
        const screenPos = camera.toScreen(tx * this.tileSize, ty * this.tileSize);

        renderer.drawSprite(sprite, screenPos.x, screenPos.y);
      }
    }
  }
}
