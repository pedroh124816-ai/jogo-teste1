import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { TILE_DEFS_BY_ID, TILED_GID_ORDER } from '../src/data/tiles';
import { CONFIG } from '../src/config';

interface TiledMapJson {
  width: number;
  height: number;
  properties?: Array<{ name: string; value: unknown }>;
  layers: Array<{
    name: string;
    type: string;
    data?: number[];
    objects?: Array<{
      id: number;
      name: string;
      type: string;
      x: number;
      y: number;
      properties?: Array<{ name: string; value: unknown }>;
    }>;
  }>;
}

const MAPS_DIR = path.resolve(__dirname, '../src/data/maps');

function loadAllMaps(): Map<string, TiledMapJson> {
  const mapFiles = fs.readdirSync(MAPS_DIR).filter((f) => f.endsWith('.json'));
  const maps = new Map<string, TiledMapJson>();

  for (const file of mapFiles) {
    const filePath = path.join(MAPS_DIR, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const json = JSON.parse(content) as TiledMapJson;
    const mapId = path.basename(file, '.json');
    maps.set(mapId, json);
  }

  return maps;
}

function getProp(props: Array<{ name: string; value: unknown }> | undefined, key: string): unknown {
  if (!props) return undefined;
  const p = props.find((item) => item.name === key);
  return p ? p.value : undefined;
}

describe('Validação do Sistema de Mapas', () => {
  const allMaps = loadAllMaps();

  it('deve carregar todos os 13 mapas mínimos obrigatórios', () => {
    const requiredMaps = [
      'overworld',
      'castelo',
      'castelo_subsolo',
      'cidade_1',
      'cidade_1_casa_1',
      'cidade_1_casa_2',
      'cidade_1_casa_3',
      'cidade_1_estalagem',
      'cidade_1_loja',
      'cidade_2',
      'santuario',
      'caverna_b1',
      'caverna_b2',
    ];

    for (const req of requiredMaps) {
      expect(allMaps.has(req), `Mapa obrigatório '${req}' não encontrado em src/data/maps/`).toBe(true);
    }
  });

  it('todo id de tile em todas as camadas de todos os mapas deve existir', () => {
    for (const [mapId, json] of allMaps) {
      for (const layer of json.layers) {
        if (layer.type === 'tilelayer' && layer.data) {
          for (let i = 0; i < layer.data.length; i++) {
            const gid = layer.data[i];
            expect(gid, `GID inválido ${gid} no mapa ${mapId} no índice ${i}`).toBeGreaterThan(0);
            expect(gid, `GID ${gid} além do tamanho de TILED_GID_ORDER no mapa ${mapId}`).toBeLessThanOrEqual(
              TILED_GID_ORDER.length
            );

            const tileId = TILED_GID_ORDER[gid - 1];
            expect(
              tileId in TILE_DEFS_BY_ID,
              `Tile '${tileId}' (GID ${gid}) não possui definição em TILE_DEFS_BY_ID (mapa: ${mapId})`
            ).toBe(true);
          }
        }
      }
    }
  });

  it('todo warp deve ter um destino válido (mapa e warp alvo existentes)', () => {
    for (const [mapId, json] of allMaps) {
      for (const layer of json.layers) {
        if (layer.type === 'objectgroup' && layer.objects) {
          for (const obj of layer.objects) {
            const isWarp = obj.type === 'warp' || getProp(obj.properties, 'target');
            if (isWarp) {
              const target = String(getProp(obj.properties, 'target') || '');
              expect(target, `Warp '${obj.name}' no mapa '${mapId}' não possui propriedade 'target'`).toBeTruthy();

              const [targetMapId, targetWarpName] = target.split(':');
              expect(
                allMaps.has(targetMapId),
                `Warp '${obj.name}' no mapa '${mapId}' aponta para mapa inexistente: '${targetMapId}'`
              ).toBe(true);

              const targetMapJson = allMaps.get(targetMapId)!;
              let foundTargetWarp = false;

              for (const tLayer of targetMapJson.layers) {
                if (tLayer.type === 'objectgroup' && tLayer.objects) {
                  for (const tObj of tLayer.objects) {
                    if (tObj.name === targetWarpName) {
                      foundTargetWarp = true;
                      break;
                    }
                  }
                }
              }

              expect(
                foundTargetWarp,
                `Warp '${obj.name}' no mapa '${mapId}' aponta para warp '${targetWarpName}' inexistente em '${targetMapId}'`
              ).toBe(true);
            }
          }
        }
      }
    }
  });

  it('todo interior/cidade/castelo/caverna deve ter saída de volta (warps recíprocos)', () => {
    for (const [mapId, json] of allMaps) {
      if (mapId === 'overworld') continue;

      let hasExitWarp = false;
      for (const layer of json.layers) {
        if (layer.type === 'objectgroup' && layer.objects) {
          for (const obj of layer.objects) {
            const isWarp = obj.type === 'warp' || getProp(obj.properties, 'target');
            if (isWarp) {
              hasExitWarp = true;
              break;
            }
          }
        }
      }

      expect(hasExitWarp, `Mapa '${mapId}' não possui nenhum warp de saída`).toBe(true);
    }
  });

  it('todo ponto de chegada de warp deve estar em tile andável (não sólido)', () => {
    for (const [mapId, json] of allMaps) {
      const tilelayer = json.layers.find((l) => l.type === 'tilelayer' && l.data);
      expect(tilelayer, `Mapa '${mapId}' sem camada de tiles`).toBeTruthy();
      const tileData = tilelayer!.data!;

      for (const layer of json.layers) {
        if (layer.type === 'objectgroup' && layer.objects) {
          for (const obj of layer.objects) {
            const isWarp = obj.type === 'warp' || getProp(obj.properties, 'target');
            if (isWarp) {
              const tileX = Math.floor(obj.x / CONFIG.screen.tileSize);
              const tileY = Math.floor(obj.y / CONFIG.screen.tileSize);

              expect(tileX, `Warp '${obj.name}' no mapa '${mapId}' fora dos limites em X (${tileX})`).toBeGreaterThanOrEqual(0);
              expect(tileX, `Warp '${obj.name}' no mapa '${mapId}' fora dos limites em X (${tileX})`).toBeLessThan(json.width);
              expect(tileY, `Warp '${obj.name}' no mapa '${mapId}' fora dos limites em Y (${tileY})`).toBeGreaterThanOrEqual(0);
              expect(tileY, `Warp '${obj.name}' no mapa '${mapId}' fora dos limites em Y (${tileY})`).toBeLessThan(json.height);

              const gid = tileData[tileY * json.width + tileX];
              const tileId = TILED_GID_ORDER[gid - 1];
              const tileDef = TILE_DEFS_BY_ID[tileId];

              expect(
                tileDef.solid,
                `Tile de chegada do warp '${obj.name}' no mapa '${mapId}' em (${tileX}, ${tileY}) é sólido ('${tileId}')!`
              ).toBe(false);
            }
          }
        }
      }
    }
  });

  it('nenhuma entrada do overworld fica inalcançável (busca em grade BFS a partir do ponto inicial)', () => {
    const overworld = allMaps.get('overworld');
    expect(overworld).toBeTruthy();

    const width = overworld!.width;
    const height = overworld!.height;
    expect(width).toBe(128);
    expect(height).toBe(128);

    const tilelayer = overworld!.layers.find((l) => l.type === 'tilelayer')!;
    const tileData = tilelayer.data!;

    // Identifica todos os warps de entrada no overworld
    const entranceWarps: Array<{ name: string; x: number; y: number }> = [];
    for (const layer of overworld!.layers) {
      if (layer.type === 'objectgroup' && layer.objects) {
        for (const obj of layer.objects) {
          if (obj.type === 'warp' || getProp(obj.properties, 'target')) {
            entranceWarps.push({
              name: obj.name,
              x: Math.floor(obj.x / CONFIG.screen.tileSize),
              y: Math.floor(obj.y / CONFIG.screen.tileSize),
            });
          }
        }
      }
    }

    expect(entranceWarps.length, 'Overworld deve ter pelo menos 5 entradas').toBeGreaterThanOrEqual(5);

    // BFS a partir de startTile
    const startX = CONFIG.player.startTile.x;
    const startY = CONFIG.player.startTile.y;

    const startGid = tileData[startY * width + startX];
    const startTileId = TILED_GID_ORDER[startGid - 1];
    expect(TILE_DEFS_BY_ID[startTileId].solid, `Ponto inicial (${startX}, ${startY}) é sólido`).toBe(false);

    const visited = new Set<string>();
    const queue: Array<{ x: number; y: number }> = [{ x: startX, y: startY }];
    visited.add(`${startX},${startY}`);

    const directions = [
      { dx: 0, dy: -1 },
      { dx: 0, dy: 1 },
      { dx: -1, dy: 0 },
      { dx: 1, dy: 0 },
    ];

    while (queue.length > 0) {
      const cur = queue.shift()!;
      for (const dir of directions) {
        const nx = cur.x + dir.dx;
        const ny = cur.y + dir.dy;
        const key = `${nx},${ny}`;

        if (nx >= 0 && nx < width && ny >= 0 && ny < height && !visited.has(key)) {
          const gid = tileData[ny * width + nx];
          const tileId = TILED_GID_ORDER[gid - 1];
          const def = TILE_DEFS_BY_ID[tileId];

          if (!def.solid) {
            visited.add(key);
            queue.push({ x: nx, y: ny });
          }
        }
      }
    }

    // Verifica que cada entrada no overworld foi alcançada pela busca
    for (const entrance of entranceWarps) {
      const key = `${entrance.x},${entrance.y}`;
      expect(
        visited.has(key),
        `Entrada do overworld '${entrance.name}' em (${entrance.x}, ${entrance.y}) não é alcançável a pé a partir de (${startX}, ${startY})!`
      ).toBe(true);
    }
  });

  it('florestas devem ser andáveis com maior taxa de encontro e entradas do overworld devem ter tiles visíveis', () => {
    const treeDef = TILE_DEFS_BY_ID['tree'];
    const grassDef = TILE_DEFS_BY_ID['grass'];

    expect(treeDef.solid, 'Tile de floresta (tree) deve ser andável (solid: false)').toBe(false);
    expect(treeDef.encounterRate).toBeGreaterThan(grassDef.encounterRate);

    for (const def of Object.values(TILE_DEFS_BY_ID)) {
      expect(def.encounterRate).toBeGreaterThanOrEqual(0);
    }

    // Garante que nenhuma entrada do overworld tenha sido apagada por estrada ('path') ou grama ('grass')
    const overworld = allMaps.get('overworld')!;
    const tileData = overworld.layers.find((l) => l.type === 'tilelayer')!.data!;
    for (const layer of overworld.layers) {
      if (layer.type === 'objectgroup' && layer.objects) {
        for (const obj of layer.objects) {
          if (obj.type === 'warp' || getProp(obj.properties, 'target')) {
            const tx = Math.floor(obj.x / CONFIG.screen.tileSize);
            const ty = Math.floor(obj.y / CONFIG.screen.tileSize);
            const gid = tileData[ty * overworld.width + tx];
            const tileId = TILED_GID_ORDER[gid - 1];
            const def = TILE_DEFS_BY_ID[tileId];
            expect(
              def.kind === 'entrance' || def.kind === 'door',
              `Entrada '${obj.name}' em (${tx}, ${ty}) no overworld está com tile invisível '${tileId}' em vez de entrance/door!`
            ).toBe(true);
          }
        }
      }
    }
  });

  it('castelo deve ter dimensões 38x36 e todos os seus NPCs, baús, livros e escadas alcançáveis a partir da entrada', () => {
    const castelo = allMaps.get('castelo')!;
    expect(castelo.width).toBe(38);
    expect(castelo.height).toBe(36);

    const tileData = castelo.layers.find((l) => l.type === 'tilelayer')!.data!;
    const objects = castelo.layers.find((l) => l.type === 'objectgroup')!.objects!;

    const entrada = objects.find((o) => o.name === 'entrada')!;
    expect(entrada).toBeTruthy();

    const startX = Math.floor(entrada.x / CONFIG.screen.tileSize);
    const startY = Math.floor(entrada.y / CONFIG.screen.tileSize);

    const npcPositions = new Set<string>();
    for (const obj of objects) {
      if (obj.type === 'npc') {
        const nx = Math.floor(obj.x / CONFIG.screen.tileSize);
        const ny = Math.floor(obj.y / CONFIG.screen.tileSize);
        npcPositions.add(`${nx},${ny}`);
      }
    }

    const visited = new Set<string>();
    const queue: Array<{ x: number; y: number }> = [{ x: startX, y: startY }];
    visited.add(`${startX},${startY}`);

    const dirs = [
      { dx: 0, dy: -1 },
      { dx: 0, dy: 1 },
      { dx: -1, dy: 0 },
      { dx: 1, dy: 0 },
    ];

    while (queue.length > 0) {
      const cur = queue.shift()!;
      for (const d of dirs) {
        const nx = cur.x + d.dx;
        const ny = cur.y + d.dy;
        const key = `${nx},${ny}`;
        if (nx >= 0 && nx < castelo.width && ny >= 0 && ny < castelo.height && !visited.has(key)) {
          const gid = tileData[ny * castelo.width + nx];
          const tileId = TILED_GID_ORDER[gid - 1];
          const def = TILE_DEFS_BY_ID[tileId];
          if (!def.solid && !npcPositions.has(key)) {
            visited.add(key);
            queue.push({ x: nx, y: ny });
          }
        }
      }
    }

    for (const obj of objects) {
      const ox = Math.floor(obj.x / CONFIG.screen.tileSize);
      const oy = Math.floor(obj.y / CONFIG.screen.tileSize);

      if (obj.type === 'warp') {
        expect(visited.has(`${ox},${oy}`), `Warp '${obj.name}' em (${ox},${oy}) inalcançável no castelo`).toBe(true);
      } else {
        // Para NPCs, baús e placas/livros, pelo menos 1 tile ortogonal adjacente deve ser alcançável
        const hasAdjacentWalkable = dirs.some((d) => visited.has(`${ox + d.dx},${oy + d.dy}`));
        expect(
          hasAdjacentWalkable,
          `Objeto '${obj.name}' (${obj.type}) em (${ox},${oy}) não possui tile adjacente alcançável no castelo`
        ).toBe(true);
      }
    }

    // Garante que a porta entre o Quarto do Herói e a Biblioteca em (27, 14) -> (27, 15) não está bloqueada por estante
    expect(visited.has('27,13')).toBe(true);
    expect(visited.has('27,14')).toBe(true);
    expect(visited.has('27,15')).toBe(true);

    // Garante que o Castelo no overworld é um ícone compacto 3x2 estilo Dragon Quest com 1 único portão em (36, 49)
    const overworld = allMaps.get('overworld')!;
    const owData = overworld.layers.find((l) => l.type === 'tilelayer')!.data!;
    const gateTileId = TILED_GID_ORDER[owData[49 * overworld.width + 36] - 1];
    const keepTopTileId = TILED_GID_ORDER[owData[48 * overworld.width + 36] - 1];
    expect(gateTileId).toBe('castle_gate');
    expect(keepTopTileId).toBe('castle_keep_top');
  });

  it('cidades, castelos e interiores devem ser zonas seguras sem batalhas', () => {
    for (const [mapId, json] of allMaps) {
      const mapType = getProp(json.properties, 'mapType') || getProp(json.properties, 'tipo') || 'overworld';
      const isSafe = mapType === 'cidade' || mapType === 'castelo' || mapType === 'interior';
      if (mapId === 'cidade_1' || mapId === 'cidade_2' || mapId === 'castelo') {
        expect(isSafe, `Mapa '${mapId}' deve ser zona segura (isSafe: true)`).toBe(true);
      }
      if (mapId === 'overworld' || mapId.startsWith('caverna')) {
        expect(isSafe, `Mapa '${mapId}' não deve ser zona segura (isSafe: false)`).toBe(false);
      }
    }
  });
});

