import { TILE_RAW_DATA, PixelMatrix } from './tileGraphics';
import { HERO_RAW_DATA, HERO_PALETTE, Direction } from './heroGraphics';
import { NPC_RAW_DATA, NPC_PALETTE } from './npcGraphics';
import { MONSTER_RAW_DATA } from './monsterGraphics';

export interface Sprite {
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
}

/**
 * Interface abstrata do carregador de assets.
 * Permite trocar a implementação atual (matrizes em código)
 * por uma baseada em arquivos PNG / spritesheets sem alterar
 * nenhuma cena ou entidade.
 */
export interface IAssetLoader {
  load(): Promise<void>;
  getTile(id: string): Sprite;
  getHero(dir: Direction, frame: number): Sprite;
  getNpc(id: string, dir: Direction): Sprite;
  getMonster(id: string): Sprite;
}

/**
 * Converte uma matriz de caracteres + tabela de cores em um canvas fora da tela.
 */
function createRasterCanvas(
  matrix: PixelMatrix,
  palette: Record<string, string>,
  width = 16,
  height = 16
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  for (let y = 0; y < height; y++) {
    const row = matrix[y] || '';
    for (let x = 0; x < width; x++) {
      const char = row[x] || '.';
      const color = palette[char];
      if (color && color !== 'transparent') {
        ctx.fillStyle = color;
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }

  return canvas;
}

/**
 * Carregador procedural baseado em matrizes de código (fase 1).
 * Implementa IAssetLoader.
 */
export class ProceduralAssetLoader implements IAssetLoader {
  private tiles: Map<string, Sprite> = new Map();
  private hero: Map<string, Sprite> = new Map();
  private npcs: Map<string, Sprite> = new Map();
  private monsters: Map<string, Sprite> = new Map();

  public async load(): Promise<void> {
    // 1. Processa todos os tiles
    for (const [tileId, data] of Object.entries(TILE_RAW_DATA)) {
      const canvas = createRasterCanvas(data.matrix, data.palette, 16, 16);
      this.tiles.set(tileId, {
        canvas,
        width: 16,
        height: 16,
      });
    }

    // 2. Processa os sprites do herói (4 direções x 2 frames)
    const directions: Direction[] = ['down', 'up', 'left', 'right'];
    for (const dir of directions) {
      const frames = HERO_RAW_DATA[dir];
      for (let f = 0; f < frames.length; f++) {
        const canvas = createRasterCanvas(frames[f], HERO_PALETTE, 16, 16);
        const key = `${dir}_${f}`;
        this.hero.set(key, {
          canvas,
          width: 16,
          height: 16,
        });
      }
    }

    // 3. Processa os sprites dos NPCs (4 direções por NPC)
    for (const [npcId, dirMap] of Object.entries(NPC_RAW_DATA)) {
      for (const dir of directions) {
        const matrix = dirMap[dir];
        const canvas = createRasterCanvas(matrix, NPC_PALETTE, 16, 16);
        const key = `${npcId}_${dir}`;
        this.npcs.set(key, {
          canvas,
          width: 16,
          height: 16,
        });
      }
    }

    // 4. Processa os sprites dos Monstros
    for (const [monsterId, data] of Object.entries(MONSTER_RAW_DATA)) {
      const canvas = createRasterCanvas(data.matrix, data.palette, data.width, data.height);
      this.monsters.set(monsterId, {
        canvas,
        width: data.width,
        height: data.height,
      });
    }
  }

  public getTile(id: string): Sprite {
    const sprite = this.tiles.get(id);
    if (!sprite) {
      const fallback = this.tiles.get('grass');
      if (fallback) return fallback;
      throw new Error(`Tile '${id}' não encontrado e fallback indisponível.`);
    }
    return sprite;
  }

  public getHero(dir: Direction, frame: number): Sprite {
    const normalizedFrame = Math.abs(frame) % 2;
    const key = `${dir}_${normalizedFrame}`;
    const sprite = this.hero.get(key);
    if (!sprite) {
      throw new Error(`Sprite do herói '${key}' não encontrado.`);
    }
    return sprite;
  }

  public getNpc(id: string, dir: Direction): Sprite {
    const key = `${id}_${dir}`;
    const sprite = this.npcs.get(key);
    if (!sprite) {
      const fallback = this.npcs.get(`${id}_down`) || this.npcs.get(`npc_elder_down`);
      if (fallback) return fallback;
      throw new Error(`Sprite do NPC '${key}' não encontrado.`);
    }
    return sprite;
  }

  public getMonster(id: string): Sprite {
    const sprite = this.monsters.get(id);
    if (!sprite) {
      const fallback = this.monsters.get('gosma_cinza');
      if (fallback) return fallback;
      throw new Error(`Sprite do monstro '${id}' não encontrado.`);
    }
    return sprite;
  }
}

/**
 * Gerenciador singleton/acesso central a todos os assets gráficos.
 */
export class AssetManager {
  private loader: IAssetLoader;
  private loaded = false;

  constructor(loader?: IAssetLoader) {
    this.loader = loader ?? new ProceduralAssetLoader();
  }

  /**
   * Permite plugar um loader diferente (ex: PngSpritesheetLoader no futuro)
   */
  public setLoader(loader: IAssetLoader): void {
    this.loader = loader;
    this.loaded = false;
  }

  public async init(): Promise<void> {
    if (this.loaded) return;
    await this.loader.load();
    this.loaded = true;
  }

  public getTile(id: string): Sprite {
    return this.loader.getTile(id);
  }

  public getHero(dir: Direction, frame: number): Sprite {
    return this.loader.getHero(dir, frame);
  }

  public getNpc(id: string, dir: Direction): Sprite {
    return this.loader.getNpc(id, dir);
  }

  public getMonster(id: string): Sprite {
    return this.loader.getMonster(id);
  }
}
