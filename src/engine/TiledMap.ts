import { CONFIG } from '../config';
import { TILE_DEFS, TILE_DEFS_BY_ID, TILED_GID_ORDER, TileDef } from '../data/tiles';
import { Renderer } from './Renderer';
import { Camera } from './Camera';
import { AssetManager } from '../assets/AssetManager';
import { Direction } from '../assets/heroGraphics';
import { NpcSpriteId } from '../assets/npcGraphics';

export type MapType = 'overworld' | 'cidade' | 'castelo' | 'caverna' | 'interior';

export interface TiledProperty {
  name: string;
  type: string;
  value: string | number | boolean;
}

export interface TiledObject {
  id: number;
  name: string;
  type: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  properties?: TiledProperty[];
}

export interface TiledLayer {
  id?: number;
  name: string;
  type: 'tilelayer' | 'objectgroup';
  data?: number[];
  objects?: TiledObject[];
  width?: number;
  height?: number;
  visible?: boolean;
  opacity?: number;
}

export interface TiledMapJson {
  width: number;
  height: number;
  tilewidth: number;
  tileheight: number;
  orientation: string;
  renderorder?: string;
  properties?: TiledProperty[];
  layers: TiledLayer[];
  tilesets?: Array<{
    firstgid: number;
    name: string;
    tilewidth: number;
    tileheight: number;
  }>;
}

export interface MapWarpDef {
  id: number;
  name: string;
  tileX: number;
  tileY: number;
  targetMap: string;
  targetWarp: string;
  targetX?: number;
  targetY?: number;
  arriveDir: Direction;
  trigger: 'step' | 'stairs';
  oneWay?: boolean;
}

export type WarpDef = MapWarpDef;

export interface MapChestDef {
  id: string;
  name: string;
  tileX: number;
  tileY: number;
  item?: string;
  gold?: number;
  message?: string;
  setFlagOnOpen?: string;
}

export interface MapSignDef {
  id: string;
  title: string;
  tileX: number;
  tileY: number;
  text: string;
  setFlag?: string;
}

export interface MapNpcDef {
  id: string;
  name: string;
  spriteId: NpcSpriteId;
  tileX: number;
  tileY: number;
  direction: Direction;
  dialogue: string;
  showIfFlag?: string;
  hideIfFlag?: string;
  setFlagOnTalk?: string;
  altFlag?: string;
  altDialogue?: string;
  wanderRadius?: number;
}

export class TiledMap {
  public readonly id: string;
  public readonly title: string;
  public readonly mapType: MapType;
  public readonly music: string;
  public readonly boundaryTile: string;
  public readonly exitOnEdge: boolean;
  public readonly edgeExit: string;
  public readonly width: number;
  public readonly height: number;
  public readonly tileSize = CONFIG.screen.tileSize;

  // Grade de IDs de tiles (ex: 'grass', 'roof_red', etc.)
  private grid: string[][];
  private warps: MapWarpDef[] = [];
  private npcs: MapNpcDef[] = [];
  private chests: MapChestDef[] = [];
  private signs: MapSignDef[] = [];

  // Animação de água
  private waterFrame = 0;
  private waterTimer = 0;

  constructor(mapId: string, json: TiledMapJson) {
    this.id = mapId;
    this.width = json.width;
    this.height = json.height;
    this.grid = [];

    // Propriedades do mapa
    const props = this.mapProperties(json.properties);
    this.title = String(props['title'] || props['nome'] || mapId);
    this.mapType = ((props['mapType'] || props['tipo'] || 'overworld') as MapType);
    this.music = String(props['music'] || 'overworld');
    this.boundaryTile = String(
      props['boundaryTile'] ||
      (this.mapType === 'interior' || this.mapType === 'caverna' ? 'black_void' : 'grass')
    );
    this.exitOnEdge = Boolean(props['exitOnEdge'] || false);
    this.edgeExit = String(props['edgeExit'] || '');

    // 1. Inicializa grid vazio com boundaryTile
    const defaultFill = this.boundaryTile in TILE_DEFS_BY_ID ? this.boundaryTile : 'grass';
    for (let y = 0; y < this.height; y++) {
      this.grid.push(new Array(this.width).fill(defaultFill));
    }

    // 2. Processa camadas de tiles e objetos
    for (const layer of json.layers) {
      if (layer.type === 'tilelayer' && layer.data) {
        this.parseTileLayer(layer.data);
      } else if (layer.type === 'objectgroup' && layer.objects) {
        this.parseObjects(layer.objects);
      }
    }
  }

  public get isSafe(): boolean {
    return this.mapType === 'cidade' || this.mapType === 'castelo' || this.mapType === 'interior';
  }

  private parseTileLayer(data: number[]): void {
    for (let i = 0; i < data.length; i++) {
      const gid = data[i];
      const x = i % this.width;
      const y = Math.floor(i / this.width);

      if (gid > 0 && gid <= TILED_GID_ORDER.length) {
        const tileId = TILED_GID_ORDER[gid - 1];
        this.grid[y][x] = tileId;
      } else {
        this.grid[y][x] = 'grass';
      }
    }
  }

  private parseObjects(objects: TiledObject[]): void {
    for (const obj of objects) {
      const tileX = Math.floor(obj.x / this.tileSize);
      const tileY = Math.floor(obj.y / this.tileSize);
      const props = this.mapProperties(obj.properties);

      if (obj.type === 'warp' || props['target'] || props['targetMap']) {
        let targetMap = '';
        let targetWarp = '';
        if (props['target']) {
          const parts = String(props['target']).split(':');
          targetMap = parts[0] || '';
          targetWarp = parts[1] || '';
        } else {
          targetMap = String(props['targetMap'] || '');
          targetWarp = String(props['targetWarp'] || '');
        }

        const tileDef = this.getTileAt(tileX, tileY);
        const isStairs = tileDef?.kind === 'stairs_up' || tileDef?.kind === 'stairs_down';
        const trigger = (props['trigger'] as 'step' | 'stairs') || (isStairs ? 'stairs' : 'step');

        this.warps.push({
          id: obj.id,
          name: obj.name || `warp_${obj.id}`,
          tileX,
          tileY,
          targetMap,
          targetWarp,
          targetX: props['targetX'] !== undefined ? Number(props['targetX']) : undefined,
          targetY: props['targetY'] !== undefined ? Number(props['targetY']) : undefined,
          arriveDir: (props['arriveDir'] as Direction) || (props['targetDir'] as Direction) || 'down',
          trigger,
          oneWay: Boolean(props['oneWay']),
        });
      } else if (obj.type === 'npc' || props['sprite']) {
        const flagToSet = props['setFlagOnTalk'] || props['setFlag'];
        const wanderVal =
          props['wanderRadius'] !== undefined
            ? Number(props['wanderRadius'])
            : props['wander']
              ? 1
              : undefined;
        this.npcs.push({
          id: `npc_${obj.id}`,
          name: String(props['name'] || obj.name || 'Aldeão'),
          spriteId: (props['sprite'] as NpcSpriteId) || 'npc_elder',
          tileX,
          tileY,
          direction: (props['direction'] as Direction) || 'down',
          dialogue: String(props['dialogue'] || '...'),
          showIfFlag: props['showIfFlag'] ? String(props['showIfFlag']) : undefined,
          hideIfFlag: props['hideIfFlag'] ? String(props['hideIfFlag']) : undefined,
          setFlagOnTalk: flagToSet ? String(flagToSet) : undefined,
          altFlag: props['altFlag'] ? String(props['altFlag']) : undefined,
          altDialogue: props['altDialogue'] ? String(props['altDialogue']) : undefined,
          wanderRadius: wanderVal,
        });
      } else if (obj.type === 'chest' || props['item'] || props['gold']) {
        this.chests.push({
          id: String(props['chestId'] || obj.name || `chest_${this.id}_${tileX}_${tileY}`),
          name: obj.name || 'Baú',
          tileX,
          tileY,
          item: props['item'] ? String(props['item']) : undefined,
          gold: props['gold'] !== undefined ? Number(props['gold']) : undefined,
          message: props['message'] ? String(props['message']) : undefined,
          setFlagOnOpen: props['setFlagOnOpen'] ? String(props['setFlagOnOpen']) : undefined,
        });
      } else if (obj.type === 'sign' || props['text']) {
        const flagToSet = props['setFlag'] || props['setFlagOnTalk'];
        this.signs.push({
          id: `sign_${obj.id}`,
          title: String(props['title'] || 'PLACA'),
          tileX,
          tileY,
          text: String(props['text'] || obj.name || 'Placa'),
          setFlag: flagToSet ? String(flagToSet) : undefined,
        });
      }
    }
  }

  private mapProperties(props?: TiledProperty[]): Record<string, string | number | boolean> {
    const map: Record<string, string | number | boolean> = {};
    if (!props) return map;
    for (const p of props) {
      map[p.name] = p.value;
    }
    return map;
  }

  public getWarps(): readonly MapWarpDef[] {
    return this.warps;
  }

  public getWarpAt(tileX: number, tileY: number): MapWarpDef | null {
    for (const w of this.warps) {
      if (w.tileX === tileX && w.tileY === tileY) return w;
    }
    return null;
  }

  public getWarpByName(name: string): MapWarpDef | null {
    for (const w of this.warps) {
      if (w.name === name) return w;
    }
    return null;
  }

  public getChests(): readonly MapChestDef[] {
    return this.chests;
  }

  public getChestAt(tileX: number, tileY: number): MapChestDef | null {
    for (const c of this.chests) {
      if (c.tileX === tileX && c.tileY === tileY) return c;
    }
    return null;
  }

  public getSigns(): readonly MapSignDef[] {
    return this.signs;
  }

  public getSignAt(tileX: number, tileY: number): MapSignDef | null {
    for (const s of this.signs) {
      if (s.tileX === tileX && s.tileY === tileY) return s;
    }
    return null;
  }

  public getNpcDefs(): readonly MapNpcDef[] {
    return this.npcs;
  }

  public setTileAt(tileX: number, tileY: number, tileId: string): void {
    if (tileX >= 0 && tileX < this.width && tileY >= 0 && tileY < this.height) {
      this.grid[tileY][tileX] = tileId;
    }
  }

  public isSolid(tileX: number, tileY: number): boolean {
    if (tileX < 0 || tileX >= this.width || tileY < 0 || tileY >= this.height) {
      if (this.exitOnEdge) {
        return false;
      }
      return true;
    }
    const tileId = this.grid[tileY][tileX];
    const def = TILE_DEFS_BY_ID[tileId];
    return def ? def.solid : false;
  }

  public getTileAt(tileX: number, tileY: number): TileDef | null {
    if (tileX < 0 || tileX >= this.width || tileY < 0 || tileY >= this.height) {
      return null;
    }
    const tileId = this.grid[tileY][tileX];
    return TILE_DEFS_BY_ID[tileId] || null;
  }

  public update(): void {
    this.waterTimer++;
    if (this.waterTimer >= CONFIG.map.waterAnimFrames) {
      this.waterTimer = 0;
      this.waterFrame = (this.waterFrame + 1) % 2;
    }
  }

  /** Escolhe o sprite de piso (tile vizinho não sólido) para desenhar sob objetos transparentes. */
  private findUnderlaySprite(tx: number, ty: number): string {
    const neighbors = [
      [tx, ty + 1],
      [tx, ty - 1],
      [tx - 1, ty],
      [tx + 1, ty],
    ];
    for (const [nx, ny] of neighbors) {
      if (nx < 0 || nx >= this.width || ny < 0 || ny >= this.height) continue;
      const nDef = TILE_DEFS_BY_ID[this.grid[ny][nx]];
      if (!nDef || nDef.solid || nDef.kind === 'entrance') continue;
      const nSprite = Array.isArray(nDef.spriteId) ? nDef.spriteId[0] : nDef.spriteId;
      if (nSprite === 'barrel' || nSprite === 'pot' || nSprite === 'door') continue;
      return nSprite;
    }
    return 'wood_floor';
  }

  public render(renderer: Renderer, camera: Camera, assetManager: AssetManager): void {
    const minTileX = Math.max(0, Math.floor(camera.x / this.tileSize));
    const maxTileX = Math.min(this.width - 1, Math.ceil((camera.x + camera.viewportWidth) / this.tileSize));
    const minTileY = Math.max(0, Math.floor(camera.y / this.tileSize));
    const maxTileY = Math.min(this.height - 1, Math.ceil((camera.y + camera.viewportHeight) / this.tileSize));

    for (let ty = minTileY; ty <= maxTileY; ty++) {
      for (let tx = minTileX; tx <= maxTileX; tx++) {
        const tileId = this.grid[ty][tx];
        const def = TILE_DEFS_BY_ID[tileId] || TILE_DEFS['.'];

        let spriteId: string;
        if (Array.isArray(def.spriteId)) {
          spriteId = def.spriteId[this.waterFrame];
        } else {
          spriteId = def.spriteId;
        }

        const sprite = assetManager.getTile(spriteId);
        const screenPos = camera.toScreen(tx * this.tileSize, ty * this.tileSize);

        // Objetos com fundo transparente (barril, vaso) recebem o piso vizinho por baixo
        if (spriteId === 'barrel' || spriteId === 'pot') {
          renderer.drawSprite(
            assetManager.getTile(this.findUnderlaySprite(tx, ty)),
            screenPos.x,
            screenPos.y
          );
        }

        renderer.drawSprite(sprite, screenPos.x, screenPos.y);
      }
    }
  }
}
