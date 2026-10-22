import { Scene } from '../engine/Scene';
import { Renderer } from '../engine/Renderer';
import { Input } from '../engine/Input';
import { SceneManager } from '../engine/SceneManager';
import { NES_COLORS } from '../engine/Palette';
import { CONFIG } from '../config';
import { MAP_REGISTRY } from '../data/maps';
import { TILED_GID_ORDER } from '../data/tiles';

interface LandmarkPoint {
  key: string;
  label: string;
  tileX: number;
  tileY: number;
  color: string;
}

const TILE_MINIMAP_COLORS: Record<string, string> = {
  water: NES_COLORS.BLUE,
  sand: NES_COLORS.SAND,
  grass: NES_COLORS.GRASS_GREEN,
  flower_grass: NES_COLORS.PALE_GREEN,
  tree: NES_COLORS.FOREST_GREEN,
  mountain: NES_COLORS.BROWN,
  wall: NES_COLORS.WHITE,
  castle_floor: NES_COLORS.LIGHT_GRAY,
  roof_red: NES_COLORS.RED,
  carpet_red: NES_COLORS.RED,
  path: NES_COLORS.DIRT,
  cobblestone: NES_COLORS.LIGHT_GRAY,
  bridge: NES_COLORS.GOLD,
  door: NES_COLORS.GOLD,
  village_entrance: NES_COLORS.PALE_GREEN,
  shrine_entrance: NES_COLORS.WHITE,
  cave_entrance: NES_COLORS.RED,
  castle_tower_top: NES_COLORS.WHITE,
  castle_keep_top: NES_COLORS.GOLD,
  castle_tower_base: NES_COLORS.LIGHT_GRAY,
  castle_gate: NES_COLORS.GOLD,
  high_mountain: NES_COLORS.DARK_GRAY,
};

export class WorldMapScene implements Scene {
  public readonly name = 'WorldMapScene';
  public readonly isTransparent = true;

  private sceneManager: SceneManager;
  private input: Input;
  private currentMapId: string;
  private heroX: number;
  private heroY: number;
  private blinkTimer = 0;

  private overworldWidth = 128;
  private overworldHeight = 128;
  private overworldData: number[] = [];
  private warpCoords: Record<string, { x: number; y: number }> = {};
  private landmarks: LandmarkPoint[] = [
    { key: 'castelo', label: 'CASTELO', tileX: 36, tileY: 49, color: NES_COLORS.GOLD },
    { key: 'cidade_1', label: 'ALVORADA', tileX: 74, tileY: 54, color: NES_COLORS.PALE_GREEN },
    { key: 'cidade_2', label: 'PORTO SOL', tileX: 44, tileY: 92, color: NES_COLORS.LIGHT_BLUE },
    { key: 'santuario', label: 'SANTUÁRIO', tileX: 84, tileY: 32, color: NES_COLORS.WHITE },
    { key: 'caverna', label: 'CAVERNA', tileX: 94, tileY: 84, color: NES_COLORS.RED },
  ];

  constructor(
    sceneManager: SceneManager,
    input: Input,
    currentMapId: string,
    heroX: number,
    heroY: number
  ) {
    this.sceneManager = sceneManager;
    this.input = input;
    this.currentMapId = currentMapId;
    this.heroX = heroX;
    this.heroY = heroY;

    const owEntry = MAP_REGISTRY['overworld'];
    if (owEntry) {
      this.overworldWidth = owEntry.json.width;
      this.overworldHeight = owEntry.json.height;
      const tileLayer = owEntry.json.layers.find((l) => l.type === 'tilelayer' && l.data);
      if (tileLayer && tileLayer.data) {
        this.overworldData = tileLayer.data;
      }

      // Sincroniza coordenadas dos marcos diretamente com os warps de overworld.json
      const objLayer = owEntry.json.layers.find((l) => l.type === 'objectgroup' && l.objects);
      if (objLayer && objLayer.objects) {
        for (const obj of objLayer.objects) {
          if (obj.name) {
            this.warpCoords[obj.name] = {
              x: Math.floor(obj.x / CONFIG.screen.tileSize),
              y: Math.floor(obj.y / CONFIG.screen.tileSize),
            };
          }
        }
        for (const lm of this.landmarks) {
          const coord = this.warpCoords[lm.key];
          if (coord) {
            lm.tileX = coord.x;
            lm.tileY = coord.y;
          }
        }
      }
    }
  }

  public update(): void {
    this.blinkTimer++;

    if (
      this.input.wasPressed('confirm') ||
      this.input.wasPressed('cancel') ||
      this.input.wasPressed('map')
    ) {
      this.sceneManager.pop();
    }
  }

  private getHeroWorldCoords(): { x: number; y: number } {
    if (this.currentMapId === 'overworld') {
      return { x: this.heroX, y: this.heroY };
    }

    let matchKey = this.currentMapId;
    if (this.currentMapId.startsWith('castelo')) matchKey = 'castelo';
    else if (this.currentMapId.startsWith('cidade_1')) matchKey = 'cidade_1';
    else if (this.currentMapId.startsWith('cidade_2')) matchKey = 'cidade_2';
    else if (this.currentMapId === 'cripta_refino' || this.currentMapId.startsWith('santuario')) {
      matchKey = 'santuario';
    } else if (this.currentMapId.startsWith('caverna')) matchKey = 'caverna';

    if (this.warpCoords[matchKey]) {
      return this.warpCoords[matchKey];
    }

    const found = this.landmarks.find((l) => l.key === matchKey);
    if (found) {
      return { x: found.tileX, y: found.tileY };
    }

    return { x: this.heroX, y: this.heroY };
  }

  public render(renderer: Renderer): void {
    const winX = 8;
    const winY = 8;
    const winW = CONFIG.screen.width - 16; // 240
    const winH = CONFIG.screen.height - 16; // 208

    renderer.drawWindow(winX, winY, winW, winH, NES_COLORS.BLACK);

    // 1. Cabeçalho
    const title = 'MAPA DO REINO DE LUMINÁRIO';
    const titleW = renderer.measureText(title);
    renderer.drawText(title, winX + Math.floor((winW - titleW) / 2), winY + 7, {
      color: NES_COLORS.GOLD,
    });
    renderer.fillRect(winX + 8, winY + 17, winW - 16, 1, NES_COLORS.WHITE);

    // 2. Minimapa Real (128x128 tiles -> 128x128 px, escala dinâmica para caber em 128x128 px)
    const mapX = winX + 8; // 16
    const mapY = winY + 21; // 29
    const scale = Math.max(1, Math.floor(128 / this.overworldWidth));
    const mapW = this.overworldWidth * scale; // 128
    const mapH = this.overworldHeight * scale; // 128

    // Moldura externa do minimapa
    renderer.fillRect(mapX - 1, mapY - 1, mapW + 2, mapH + 2, NES_COLORS.WHITE);

    if (this.overworldData.length > 0) {
      for (let ty = 0; ty < this.overworldHeight; ty++) {
        for (let tx = 0; tx < this.overworldWidth; tx++) {
          const gid = this.overworldData[ty * this.overworldWidth + tx];
          const tileId = TILED_GID_ORDER[gid - 1] || 'grass';
          const color = TILE_MINIMAP_COLORS[tileId] || NES_COLORS.GRASS_GREEN;
          renderer.fillRect(mapX + tx * scale, mapY + ty * scale, scale, scale, color);
        }
      }
    }

    // 3. Destaque dos 5 Marcos no Minimapa (quadradinho 4x4 com borda preta)
    for (const lm of this.landmarks) {
      const lx = mapX + lm.tileX * scale - 1;
      const ly = mapY + lm.tileY * scale - 1;
      renderer.fillRect(lx - 1, ly - 1, 6, 6, NES_COLORS.BLACK);
      renderer.fillRect(lx, ly, 4, 4, lm.color);
    }

    // 4. Marcador piscante do Herói na coordenada real
    const blink = Math.floor(this.blinkTimer / CONFIG.ui.cursorBlinkFrames) % 2 === 0;
    const worldPos = this.getHeroWorldCoords();
    const hx = mapX + worldPos.x * scale;
    const hy = mapY + worldPos.y * scale;

    if (blink) {
      renderer.fillRect(hx - 2, hy - 2, 6, 6, NES_COLORS.BLACK);
      renderer.fillRect(hx - 1, hy - 1, 4, 4, NES_COLORS.YELLOW);
    }

    // 5. Coluna de Legenda à Direita (x: 150..240)
    const legX = mapX + mapW + 6; // 150
    let legY = mapY + 2;

    renderer.drawText('LOCAIS:', legX, legY, { color: NES_COLORS.GOLD });
    legY += 12;

    for (const lm of this.landmarks) {
      renderer.fillRect(legX, legY + 1, 5, 5, lm.color);
      renderer.drawText(lm.label, legX + 8, legY, { color: NES_COLORS.WHITE });
      legY += 11;
    }

    legY += 4;
    renderer.drawText('BIOMAS:', legX, legY, { color: NES_COLORS.GOLD });
    legY += 11;

    renderer.fillRect(legX, legY + 1, 5, 5, NES_COLORS.FOREST_GREEN);
    renderer.drawText('BOSQUE', legX + 8, legY, { color: NES_COLORS.LIGHT_GRAY });
    legY += 10;

    renderer.fillRect(legX, legY + 1, 5, 5, NES_COLORS.BROWN);
    renderer.drawText('MONTANHA', legX + 8, legY, { color: NES_COLORS.LIGHT_GRAY });
    legY += 10;

    renderer.fillRect(legX, legY + 1, 5, 5, NES_COLORS.SAND);
    renderer.drawText('COSTA', legX + 8, legY, { color: NES_COLORS.LIGHT_GRAY });
    legY += 12;

    if (blink) {
      renderer.fillRect(legX, legY + 1, 5, 5, NES_COLORS.YELLOW);
    }
    renderer.drawText('★ VOCÊ', legX + 8, legY, { color: NES_COLORS.YELLOW });

    // 6. Rodapé informativo
    const footY = mapY + mapH + 5; // 162
    renderer.fillRect(winX + 8, footY, winW - 16, 1, NES_COLORS.WHITE);

    const currentEntry = MAP_REGISTRY[this.currentMapId];
    const locTitle = currentEntry ? currentEntry.title : 'REINO DE LUMINÁRIO';

    renderer.drawText(`LOCAL: ${locTitle}`, winX + 10, footY + 5, {
      color: NES_COLORS.LIGHT_BLUE,
    });
    renderer.drawText(
      `POS: X:${this.heroX} Y:${this.heroY}   [Enter/Esc] Fechar`,
      winX + 10,
      footY + 17,
      { color: NES_COLORS.MED_GRAY }
    );
  }
}
