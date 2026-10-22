/**
 * Gerador exclusivo do mapa Overworld (src/data/maps/overworld.json).
 * Regra 3 (geral.md): Este script gera APENAS o overworld a partir da seed fixa em src/config.ts.
 * Nenhum outro mapa (castelo, cidades, interiores, caverna, santuário) pode ser sobrescrito por este script.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const OVERWORLD_PATH = path.resolve(__dirname, '../src/data/maps/overworld.json');
const CONFIG_PATH = path.resolve(__dirname, '../src/config.ts');

// Tabela de GIDs (1-based, idêntica a TILED_GID_ORDER em src/data/tiles.ts)
const TILED_GID_ORDER = [
  'grass',
  'flower_grass',
  'water',
  'tree',
  'mountain',
  'wall',
  'path',
  'bridge',
  'sand',
  'door',
  'village_entrance',
  'roof_red',
  'house_wall',
  'house_window',
  'house_door',
  'cobblestone',
  'fence',
  'well',
  'sign',
  'castle_floor',
  'carpet_red',
  'throne',
  'chest',
  'chest_open',
  'cave_entrance',
  'shrine_entrance',
  'stairs_up',
  'stairs_down',
  'cave_floor',
  'cave_wall',
  'wood_floor',
  'counter',
  'bed',
  'black_void',
  'pillar',
  'castle_stairs',
  'banner_wall',
  'bookshelf',
  'castle_tower_top',
  'castle_keep_top',
  'castle_tower_base',
  'castle_gate',
  'high_mountain',
];

const GID_MAP = {};
TILED_GID_ORDER.forEach((id, idx) => {
  GID_MAP[id] = idx + 1;
});

/**
 * Lê worldSeed diretamente de src/config.ts para garantir sincronia absoluta.
 */
function readWorldSeedFromConfig() {
  const content = fs.readFileSync(CONFIG_PATH, 'utf-8');
  const match = content.match(/worldSeed:\s*(\d+)/);
  if (!match) {
    throw new Error('worldSeed não encontrado em src/config.ts');
  }
  return Number(match[1]);
}

/**
 * Gerador pseudoaleatório determinístico (Mulberry32)
 */
function createRng(seed) {
  let a = seed >>> 0;
  return function next() {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildOverworld(seed) {
  const width = 128;
  const height = 128;
  const rng = createRng(seed);

  const data = new Array(width * height).fill(GID_MAP['water']);
  const objects = [];

  const getTile = (x, y) => {
    if (x < 0 || x >= width || y < 0 || y >= height) return 'water';
    const gid = data[y * width + x];
    return TILED_GID_ORDER[gid - 1] || 'water';
  };

  const set = (x, y, tileId) => {
    if (x >= 0 && x < width && y >= 0 && y < height) {
      data[y * width + x] = GID_MAP[tileId] || 1;
    }
  };

  const setIfLand = (x, y, tileId) => {
    if (x >= 0 && x < width && y >= 0 && y < height) {
      const cur = getTile(x, y);
      if (cur !== 'water' && cur !== 'high_mountain') {
        data[y * width + x] = GID_MAP[tileId] || 1;
      }
    }
  };

  const fill = (x1, y1, x2, y2, tileId) => {
    for (let y = Math.min(y1, y2); y <= Math.max(y1, y2); y++) {
      for (let x = Math.min(x1, x2); x <= Math.max(x1, x2); x++) {
        set(x, y, tileId);
      }
    }
  };

  const fillBlob = (cx, cy, rx, ry, tileId, landOnly = true) => {
    const minX = Math.floor(cx - rx - 2);
    const maxX = Math.ceil(cx + rx + 2);
    const minY = Math.floor(cy - ry - 2);
    const maxY = Math.ceil(cy + ry + 2);
    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const dx = (x - cx) / rx;
        const dy = (y - cy) / ry;
        const wobble =
          Math.sin(x * 0.37 + y * 0.29) * 0.12 + Math.cos(x * 0.23 - y * 0.41) * 0.08;
        if (dx * dx + dy * dy <= 1.0 + wobble) {
          if (landOnly) setIfLand(x, y, tileId);
          else set(x, y, tileId);
        }
      }
    }
  };

  const lineH = (x1, x2, y, tileId) => {
    for (let x = Math.min(x1, x2); x <= Math.max(x1, x2); x++) {
      set(x, y, tileId);
    }
  };

  const lineV = (x, y1, y2, tileId) => {
    for (let y = Math.min(y1, y2); y <= Math.max(y1, y2); y++) {
      set(x, y, tileId);
    }
  };

  // -------------------------------------------------------------------------
  // 1. SILHUETA CONTINENTAL ORGÂNICA (128x128) — Penínsulas, Golfos e Ilhas
  // Em vez de uma ilha quadrada, esculpimos o continente a partir de massas
  // geográficas orgânicas (Noroeste, Nordeste, Vale Central, Cabo Oeste,
  // Sudoeste, Costa do Sol e Cabo Sudeste) + Golfos profundos no oceano.
  // -------------------------------------------------------------------------
  const p1 = rng() * Math.PI * 2;
  const p2 = rng() * Math.PI * 2;
  const p3 = rng() * Math.PI * 2;
  const p4 = rng() * Math.PI * 2;

  // Massas continentais principais (elipses orgânicas sobrepostas)
  const landmasses = [
    // Vale Real Central (Coração do Reino)
    { cx: 56, cy: 55, rx: 38, ry: 20 },
    // Península de Alvorada (Leste-Central)
    { cx: 78, cy: 54, rx: 24, ry: 15 },
    // Cabo do Bosque Ancestral (Oeste — Refúgio das Raízes)
    { cx: 22, cy: 56, rx: 15, ry: 13 },
    // Península de Pedrasul (Noroeste — Rochedo e Mina Velha)
    { cx: 32, cy: 23, rx: 23, ry: 15 },
    // Planalto de Cobreval e Santuário (Nordeste — Santuário e Cobre-Alto)
    { cx: 86, cy: 27, rx: 27, ry: 17 },
    // Península de Brumaterra (Sudoeste — Cabana de Orun e Vau-Cinza)
    { cx: 22, cy: 86, rx: 15, ry: 20 },
    // Costa do Sol (Centro-Sul — Porto do Sol e Gruta da Costa)
    { cx: 54, cy: 83, rx: 22, ry: 15 },
    // Cabo das Sombras (Sudeste — Maciço da Caverna das Sombras)
    { cx: 92, cy: 84, rx: 20, ry: 19 },
  ];

  // Golfos e enseadas oceânicas que recortam a costa para dar formato dramático
  const seaCutouts = [
    // Golfo da Coroa (Norte, entre Pedrasul e Cobreval)
    { cx: 58, cy: 8, rx: 10, ry: 13 },
    // Golfo das Brumas (Oeste, entre Pedrasul e Bosque das Raízes)
    { cx: 8, cy: 40, rx: 12, ry: 7 },
    // Enseada do Leste (Leste, entre Cobreval e Alvorada)
    { cx: 112, cy: 45, rx: 14, ry: 7 },
    // Estuário das Sombras (Leste-Sul, entre Alvorada e Cabo das Sombras)
    { cx: 110, cy: 67, rx: 14, ry: 6 },
    // Enseada da Bruma (Sudoeste, recorte entre Costa do Sol e Brumaterra)
    { cx: 34, cy: 104, rx: 6, ry: 10 },
    // Baía Funda do Sul (recorte entre Costa do Sol e Cabo das Sombras)
    { cx: 75, cy: 102, rx: 6, ry: 10 },
  ];

  for (let y = 4; y < height - 6; y++) {
    for (let x = 4; x < width - 4; x++) {
      const coastNoise =
        Math.sin(x * 0.14 + p1) * 0.08 +
        Math.cos(y * 0.15 + p2) * 0.08 +
        Math.sin((x + y) * 0.11 + p3) * 0.06 +
        Math.cos((x - y) * 0.13 + p4) * 0.05;

      let insideLand = false;
      for (const m of landmasses) {
        const dx = (x - m.cx) / m.rx;
        const dy = (y - m.cy) / m.ry;
        if (dx * dx + dy * dy <= 1.0 + coastNoise) {
          insideLand = true;
          break;
        }
      }

      if (insideLand) {
        for (const c of seaCutouts) {
          const dx = (x - c.cx) / c.rx;
          const dy = (y - c.cy) / c.ry;
          if (dx * dx + dy * dy <= 1.0 + coastNoise * 0.6) {
            insideLand = false;
            break;
          }
        }
      }

      if (insideLand) {
        set(x, y, 'grass');
      }
    }
  }

  // Arquipélago Austral e Ilha Ancestral de Veyra (no oceano ao sul)
  fillBlob(64, 113, 10, 6, 'sand', false);
  fillBlob(64, 113, 8, 4.5, 'grass', false);
  fillBlob(64, 113, 5, 2.8, 'flower_grass', false);
  // Ilhotas de coral vizinhas no Mar Austral
  fillBlob(47, 112, 3.2, 2.0, 'sand', false);
  fillBlob(47, 112, 1.8, 1.2, 'tree', false);
  fillBlob(81, 111, 3.5, 2.2, 'sand', false);
  fillBlob(81, 111, 2.0, 1.3, 'mountain', false);
  // Ilhota do Farol Antigo a noroeste e recife a leste
  fillBlob(10, 18, 3.0, 2.2, 'sand', false);
  fillBlob(10, 18, 1.8, 1.2, 'high_mountain', false);
  fillBlob(116, 26, 3.2, 2.4, 'sand', false);
  fillBlob(116, 26, 1.8, 1.4, 'mountain', false);

  // Faixa costeira de areia (praias naturais ao redor do continente)
  const coastalSand = [];
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      if (getTile(x, y) !== 'water') {
        const touchesWater =
          getTile(x - 1, y) === 'water' ||
          getTile(x + 1, y) === 'water' ||
          getTile(x, y - 1) === 'water' ||
          getTile(x, y + 1) === 'water';
        if (touchesWater) {
          coastalSand.push([x, y]);
        }
      }
    }
  }
  for (const [cx, cy] of coastalSand) {
    set(cx, cy, 'sand');
    // Praias mais largas na Baía do Sol (Sul) e na Enseada de Alvorada
    if (cy >= 88 && cx >= 38 && cx <= 70 && getTile(cx, cy - 1) === 'grass') {
      set(cx, cy - 1, 'sand');
    }
  }

  // -------------------------------------------------------------------------
  // 2. CORDILHEIRAS ORGÂNICAS E RIOS SINUOSOS (Gating de Progressão por Ato)
  // Em vez de linhas retas artificiais, desenhamos cadeias de montanhas com
  // espinha dorsal de 'high_mountain' (cinza, intransponível) ladeada por
  // contrafortes de 'mountain' (marrom, caminhável), como em Dragon Quest!
  // -------------------------------------------------------------------------

  // Função auxiliar: desenha uma cordilheira horizontal sinuosa 100% vedada em 4 direções
  const drawMountainChainH = (x1, x2, baseY, amp, freq, phase, withFoothills = true) => {
    for (let x = x1; x <= x2; x++) {
      const cy = Math.round(baseY + Math.sin(x * freq + phase) * amp);
      if (withFoothills) {
        const fhTop = 1 + (Math.abs(Math.sin(x * 0.43 + 1.2)) > 0.45 ? 1 : 0);
        const fhBot = 1 + (Math.abs(Math.cos(x * 0.39 + 0.7)) > 0.45 ? 1 : 0);
        for (let dy = -1 - fhTop; dy <= -2; dy++) {
          if (getTile(x, cy + dy) !== 'sand') setIfLand(x, cy + dy, 'mountain');
        }
        for (let dy = 2; dy <= 1 + fhBot; dy++) {
          if (getTile(x, cy + dy) !== 'sand') setIfLand(x, cy + dy, 'mountain');
        }
      }
      // Espinha dorsal de 3 tiles de altura garante vedação ortogonal total mesmo nas curvas
      for (let dy = -1; dy <= 1; dy++) {
        if (getTile(x, cy + dy) !== 'water') {
          set(x, cy + dy, 'high_mountain');
        }
      }
    }
  };

  // Função auxiliar: desenha uma cordilheira vertical sinuosa 100% vedada em 4 direções
  const drawMountainChainV = (y1, y2, baseX, amp, freq, phase, withFoothills = true) => {
    for (let y = y1; y <= y2; y++) {
      const cx = Math.round(baseX + Math.sin(y * freq + phase) * amp);
      if (withFoothills) {
        const fhLeft = 1 + (Math.abs(Math.sin(y * 0.41 + 0.5)) > 0.45 ? 1 : 0);
        const fhRight = 1 + (Math.abs(Math.cos(y * 0.37 + 1.9)) > 0.45 ? 1 : 0);
        for (let dx = -1 - fhLeft; dx <= -2; dx++) {
          if (getTile(cx + dx, y) !== 'sand') setIfLand(cx + dx, y, 'mountain');
        }
        for (let dx = 2; dx <= 1 + fhRight; dx++) {
          if (getTile(cx + dx, y) !== 'sand') setIfLand(cx + dx, y, 'mountain');
        }
      }
      // Espinha dorsal de 3 tiles de largura garante vedação ortogonal total
      for (let dx = -1; dx <= 1; dx++) {
        if (getTile(cx + dx, y) !== 'water') {
          set(cx + dx, y, 'high_mountain');
        }
      }
    }
  };

  // A. CORDILHEIRA NORTE-OESTE (Serra de Pedrasul) — Isola Pedrasul (Rochedo e Mina Velha)
  // Vai do Golfo das Brumas (x = 18) até o Rio Luminar (x = 59) na altura y ≈ 38
  drawMountainChainH(18, 59, 38, 1.4, 0.16, 0.5, true);
  // Estabiliza o trecho exato do Passo de Pedrasul em x = 35..37, y = 37..39
  fill(34, 37, 38, 39, 'high_mountain');
  // Maciços orgânicos nas terras altas de Pedrasul (y = 14..34)
  fillBlob(26, 24, 12, 7, 'mountain', true);
  fillBlob(41, 21, 10, 6, 'mountain', true);
  fillBlob(22, 16, 5, 2.5, 'high_mountain', true);
  fillBlob(36, 15, 6, 2.5, 'high_mountain', true);
  fillBlob(33, 30, 8, 4, 'tree', true);
  fillBlob(18, 28, 4, 3, 'tree', true);

  // B. CORDILHEIRA NORTE-LESTE (Serra da Alvorada e Cobreval)
  // Muralha sul do planalto nordeste indo do Rio Luminar (x = 59) até a Enseada do Leste (x = 102) em y ≈ 42
  drawMountainChainH(59, 102, 42, 1.4, 0.15, 2.1, true);
  // Estabiliza o trecho do Passo do Santuário em x = 80..84, y = 41..43
  fill(80, 41, 84, 43, 'high_mountain');
  // Picos rochosos orgânicos ao norte de Cobreval
  fillBlob(76, 14, 7, 2.5, 'high_mountain', true);
  fillBlob(94, 15, 7, 2.5, 'high_mountain', true);

  // Anel Interno de Cordilheiras que separa o Vale do Santuário (x: 75..89, y: 27..40) de Cobre-Alto!
  drawMountainChainV(25, 42, 73, 0.8, 0.22, 0.4, true);
  drawMountainChainH(73, 91, 25, 0.8, 0.22, 1.2, true);
  drawMountainChainV(25, 42, 91, 0.8, 0.22, 2.5, true);
  // Interior sereno do Vale do Santuário da Luz
  fillBlob(82, 34, 6, 5, 'grass', true);
  fillBlob(82, 34, 4, 3, 'flower_grass', true);
  fillBlob(78, 30, 2.5, 2, 'tree', true);
  fillBlob(87, 36, 2.5, 2, 'tree', true);

  // Corredor montanhoso de Cobreval: da Ponte de Cobre (60, 28) pelo norte (y = 16..22) até Cobre-Alto (98, 34)
  fillBlob(68, 22, 7, 4, 'mountain', true);
  fillBlob(82, 19, 9, 3.5, 'mountain', true);
  fillBlob(97, 25, 7, 5, 'mountain', true);
  fillBlob(103, 32, 4, 5, 'tree', true);
  fillBlob(98, 34, 6, 4, 'grass', true);

  // C. CORDILHEIRA DO BOSQUE ANCESTRAL (Oeste — Isola o Refúgio das Raízes em 18, 56)
  drawMountainChainV(38, 69, 26, 1.0, 0.19, 0.9, true);
  // Estabiliza o trecho da Trilha das Raízes em x = 25..27, y = 55..57
  fill(25, 54, 27, 58, 'high_mountain');
  // Floresta densa dentro da Península das Raízes
  fillBlob(18, 56, 7, 6, 'tree', true);
  fillBlob(18, 56, 3, 2.5, 'flower_grass', true);

  // D. CORDILHEIRAS DIVISÓRIAS DO SUL (Isolam Brumaterra, Costa do Sol e Cabo das Sombras)
  // Serra da Bruma: separa Brumaterra (Sudoeste, x <= 32) da Costa do Sol (Centro-Sul, x >= 36)
  drawMountainChainV(69, 100, 34, 1.1, 0.18, 1.4, true);
  // Serra das Sombras: separa Costa do Sol (x <= 74) do Vale da Caverna das Sombras (Sudeste, x >= 78)
  drawMountainChainV(69, 98, 76, 1.1, 0.17, 0.6, true);

  // E. RIO LUMINAR (Norte-Sul) E RIO REAL DO SUL (Oeste-Leste)
  // Rio Luminar desce sinuosamente do Golfo da Coroa (y = 12) até a confluência central (y = 69)
  for (let y = 12; y <= 69; y++) {
    // Mantém x = 58..60 reto perto da Ponte de Cobre (y = 28) e da Ponte Real (y = 54)
    let rx = 59;
    if (Math.abs(y - 28) > 3 && Math.abs(y - 54) > 3) {
      rx = Math.round(59 + Math.sin(y * 0.21) * 1.4);
    }
    for (let dx = -1; dx <= 1; dx++) {
      set(rx + dx, y, 'water');
    }
  }

  // Rio Real do Sul corta sinuosamente de costa a costa (x = 4..116) em torno de y = 69
  for (let x = 4; x <= 116; x++) {
    // Mantém y = 68..70 reto nas 3 pontes: Pântano (x=30), Sul (x=48) e Caverna (x=84)
    let ry = 69;
    if (Math.abs(x - 30) > 3 && Math.abs(x - 48) > 3 && Math.abs(x - 84) > 3) {
      ry = Math.round(69 + Math.sin(x * 0.16 + 0.8) * 1.3);
    }
    for (let dy = -1; dy <= 1; dy++) {
      set(x, ry + dy, 'water');
    }
  }

  // -------------------------------------------------------------------------
  // 3. PASSOS DE MONTANHA E PONTES DE PROGRESSÃO POR ATO
  // -------------------------------------------------------------------------
  // Passos de montanha (abertos por padrão no JSON para validação de alcançabilidade total;
  // selados dinamicamente por Ato em MapScene.loadMap('overworld'))
  // 1) Passo de Pedrasul (Ato 3): x = 36, y = 36..40
  for (let y = 35; y <= 41; y++) set(36, y, 'mountain');
  set(36, 34, 'grass');
  set(36, 42, 'grass');

  // 2) Passo do Santuário (Ato 2): x = 82, y = 39..45
  for (let y = 39; y <= 45; y++) set(82, y, 'mountain');
  set(82, 38, 'grass');
  set(82, 46, 'grass');

  // 3) Trilha das Raízes (Ato 4): x = 23..29, y = 56
  for (let x = 23; x <= 29; x++) set(x, 56, 'tree');

  // Pontes sobre os rios:
  // 4) Ponte Real (Ato 1 — liga o Castelo à Vila de Alvorada): x = 58..60, y = 54
  set(58, 54, 'bridge');
  set(59, 54, 'bridge');
  set(60, 54, 'bridge');

  // 5) Ponte da Caverna (Ato 1 — liga Alvorada ao Cabo das Sombras): x = 84, y = 68..70
  set(84, 67, 'path');
  set(84, 68, 'bridge');
  set(84, 69, 'bridge');
  set(84, 70, 'bridge');
  set(84, 71, 'path');

  // 6) Ponte do Sul (Ato 2 — liga o Vale Real à Costa do Sol): x = 48, y = 68..70
  set(48, 67, 'grass');
  set(48, 68, 'bridge');
  set(48, 69, 'bridge');
  set(48, 70, 'bridge');
  set(48, 71, 'grass');

  // 7) Ponte do Pântano (Ato 3 — liga o Vale Real a Brumaterra): x = 30, y = 68..70
  set(30, 67, 'grass');
  set(30, 68, 'bridge');
  set(30, 69, 'bridge');
  set(30, 70, 'bridge');
  fill(22, 71, 31, 74, 'grass');

  // 8) Ponte de Cobre (Ato 3 — exige Chave de Cobre e cai após derrotar Daros): x = 58..60, y = 28
  // Corredor da margem oeste do Rio Luminar subindo do Vale Real (x = 53..57, y = 27..42) até a Ponte de Cobre!
  // Isolado de Pedrasul por cordilheira a oeste (x = 51, y = 24..40) e ao norte (x = 50..58, y = 25)
  drawMountainChainV(24, 40, 51, 0.4, 0.25, 0.0, false);
  drawMountainChainH(50, 58, 25, 0.3, 0.25, 0.0, false);
  fill(53, 27, 57, 42, 'grass');
  fill(54, 30, 56, 36, 'flower_grass');
  set(58, 28, 'bridge');
  set(59, 28, 'bridge');
  set(60, 28, 'bridge');
  fill(61, 26, 65, 29, 'mountain');

  // -------------------------------------------------------------------------
  // 4. BIOMAS DETALHADOS DE CADA REGIÃO (Florestas, Colinas, Campinas, Lagos)
  // -------------------------------------------------------------------------
  // Vale Real (Ato 1): Bosque de Brasa ao sul do Castelo + campinas floridas e bosques de Alvorada
  fillBlob(42, 61, 8, 5, 'tree', true);
  fillBlob(42, 62, 2.5, 1.8, 'flower_grass', true); // Clareira de Sael em (42, 62)
  fillBlob(46, 48, 5, 3, 'flower_grass', true);
  fillBlob(49, 58, 4, 3, 'mountain', true);
  fillBlob(31, 46, 4, 3, 'tree', true);
  fillBlob(67, 50, 5, 3, 'flower_grass', true);
  fillBlob(66, 60, 6, 4, 'tree', true);
  fillBlob(84, 52, 6, 4, 'tree', true);
  fillBlob(88, 58, 5, 3.5, 'mountain', true);
  fillBlob(77, 61, 4, 2.5, 'flower_grass', true);

  // Cabo das Sombras (Sudeste — Ato 1): Maciço orgânico de colinas marrons e picos cinzas ao redor da Caverna
  fillBlob(93, 83, 10, 8, 'mountain', true);
  fillBlob(98, 84, 4.5, 5.5, 'high_mountain', true);
  fillBlob(92, 91, 5.5, 3.0, 'high_mountain', true);
  fillBlob(85, 76, 5, 3.5, 'tree', true);
  fillBlob(95, 74, 4, 3, 'tree', true);
  // Clareira e trilha de acesso à Caverna das Sombras em (94, 84)
  fill(88, 82, 95, 86, 'sand');
  lineH(84, 93, 84, 'path');
  lineV(84, 71, 84, 'path');

  // Costa do Sol (Centro-Sul — Ato 2): Bosques litorâneos, campinas e enseada rochosa
  fillBlob(44, 78, 6.5, 4.5, 'tree', true);
  fillBlob(56, 78, 5.5, 3.5, 'flower_grass', true);
  fillBlob(64, 84, 6, 4.5, 'mountain', true);
  fillBlob(52, 86, 4, 3, 'tree', true);

  // Pântano de Brumaterra (Sudoeste — Ato 3): Charcos, árvores densas e clareiras úmidas
  fillBlob(20, 82, 8, 7, 'tree', true);
  fillBlob(25, 92, 7, 5, 'tree', true);
  fillBlob(16, 86, 2.2, 1.5, 'water', true);
  fillBlob(28, 83, 2.5, 1.6, 'water', true);
  fill(21, 72, 25, 91, 'grass'); // Caminho limpo entre a Ponte do Pântano, Orun e Vau-Cinza
  fill(18, 77, 24, 79, 'grass');

  // Estrada Real Pavimentada (Apenas entre o Castelo Real e a Vila de Alvorada!)
  lineV(36, 50, 54, 'path');
  lineH(36, 57, 54, 'path');
  lineH(61, 74, 54, 'path');

  // -------------------------------------------------------------------------
  // 5. PONTOS DE INTERESSE (Carimbados por cima para nunca serem apagados!)
  // -------------------------------------------------------------------------

  // 1. CASTELO REAL DE LUMINÁRIO — Miniatura 3x2 estilo Dragon Quest (x: 35..37, y: 48..49)
  fill(33, 46, 39, 51, 'grass');
  set(34, 48, 'flower_grass');
  set(38, 48, 'flower_grass');
  set(35, 48, 'castle_tower_top');
  set(36, 48, 'castle_keep_top');
  set(37, 48, 'castle_tower_top');
  set(35, 49, 'castle_tower_base');
  set(36, 49, 'castle_gate'); // Warp do castelo em (36, 49)
  set(37, 49, 'castle_tower_base');
  set(36, 50, 'path'); // Tile inicial do herói em (36, 50)

  // 2. VILA DE ALVORADA (cidade_1) — Em (74, 54)
  fill(73, 53, 75, 55, 'grass');
  set(73, 53, 'tree');
  set(75, 53, 'tree');
  set(73, 54, 'flower_grass');
  set(75, 54, 'flower_grass');
  set(74, 54, 'village_entrance'); // Warp de cidade_1 em (74, 54)

  // 3. PORTO DO SOL (cidade_2) — Vila portuária na Baía do Sol em (44, 92)
  fill(42, 90, 46, 93, 'sand');
  fill(43, 88, 45, 91, 'grass');
  set(43, 92, 'flower_grass');
  set(45, 92, 'flower_grass');
  lineV(44, 93, 96, 'bridge'); // Píer portuário avançando no mar
  fill(43, 95, 45, 98, 'water');
  set(44, 95, 'bridge');
  set(44, 96, 'bridge');
  set(44, 92, 'village_entrance'); // Warp de cidade_2 em (44, 92)

  // 4. GRUTA DA COSTA (gruta_costa) — Enseada rochosa em (60, 90)
  fill(58, 88, 62, 91, 'sand');
  set(60, 89, 'mountain');
  set(61, 90, 'mountain');
  set(59, 90, 'mountain');
  set(60, 90, 'cave_entrance'); // Warp de gruta_costa em (60, 90)

  // 5. SANTUÁRIO DA LUZ (santuario) — No Vale do Santuário em (84, 32)
  fill(82, 30, 86, 38, 'grass');
  set(83, 32, 'flower_grass');
  set(85, 32, 'flower_grass');
  set(84, 32, 'shrine_entrance'); // Warp de santuario em (84, 32)

  // 6. CAVERNA DAS SOMBRAS (caverna) — Encravada no Maciço Sudeste em (94, 84)
  set(94, 83, 'mountain');
  set(95, 83, 'mountain');
  set(95, 84, 'mountain');
  set(94, 85, 'mountain');
  set(95, 85, 'mountain');
  set(93, 84, 'path');
  set(94, 84, 'cave_entrance'); // Warp de caverna em (94, 84)

  // 7. VAU-CINZA (vau_cinza) — Cidade do Pântano de Brumaterra em (22, 90)
  fill(20, 88, 24, 91, 'grass');
  set(21, 90, 'tree');
  set(23, 90, 'tree');
  set(22, 90, 'village_entrance'); // Warp de vau_cinza em (22, 90)

  // 8. CABANA DE ORUN (cabana_orun) — Recanto no Pântano de Brumaterra em (18, 78)
  fill(17, 77, 20, 79, 'grass');
  set(18, 77, 'tree');
  set(18, 78, 'shrine_entrance'); // Warp de cabana_orun em (18, 78)

  // 9. ROCHEDO (rochedo) — Cidade mineradora nas Montanhas de Pedrasul em (26, 24)
  fill(24, 22, 37, 35, 'mountain');
  fill(25, 23, 27, 25, 'grass');
  set(25, 24, 'mountain');
  set(27, 24, 'mountain');
  set(26, 24, 'village_entrance'); // Warp de rochedo em (26, 24)

  // 10. MINA VELHA (mina_velha) — Galeria nas Montanhas de Pedrasul em (42, 20)
  fill(35, 19, 43, 25, 'mountain');
  set(42, 21, 'grass');
  set(42, 20, 'cave_entrance'); // Warp de mina_velha em (42, 20)

  // 11. COBRE-ALTO (cobre_alto) — Fortaleza de Cobreval no Planalto Nordeste em (98, 34)
  // Garante corredor contínuo desde a Ponte de Cobre (60, 28) pelo norte do anel do Santuário até (98, 34)
  fill(61, 18, 98, 22, 'mountain');
  fill(94, 20, 99, 35, 'grass');
  set(97, 33, 'mountain');
  set(99, 33, 'mountain');
  set(98, 34, 'village_entrance'); // Warp de cobre_alto em (98, 34)

  // 12. REFÚGIO DAS RAÍZES (refugio_raizes) — Santuário oculto no Cabo Oeste em (18, 56)
  fill(16, 54, 24, 58, 'tree');
  set(18, 57, 'flower_grass');
  set(18, 56, 'shrine_entrance'); // Warp de refugio_raizes em (18, 56)

  // 13. ILHA VEYRA E TEMPLO-CORAÇÃO (templo_coracao) — Ilha ancestral ao sul em (64, 112)
  // Garante praia norte na Costa do Sol em (64, 95..98) e recife submerso até a Ilha Veyra (64, 108..112)
  fill(62, 90, 66, 98, 'sand');
  lineV(64, 98, 109, 'bridge');
  fill(62, 109, 66, 114, 'flower_grass');
  set(64, 112, 'shrine_entrance'); // Warp de templo_coracao em (64, 112)

  // -------------------------------------------------------------------------
  // 6. OBJETOS DE WARP E NPCS DO OVERWORLD
  // -------------------------------------------------------------------------
  objects.push(
    {
      id: 1,
      name: 'castelo',
      type: 'warp',
      x: 36 * 16,
      y: 49 * 16,
      width: 16,
      height: 16,
      properties: [
        { name: 'target', type: 'string', value: 'castelo:entrada' },
        { name: 'arriveDir', type: 'string', value: 'up' },
      ],
    },
    {
      id: 2,
      name: 'cidade_1',
      type: 'warp',
      x: 74 * 16,
      y: 54 * 16,
      width: 16,
      height: 16,
      properties: [
        { name: 'target', type: 'string', value: 'cidade_1:saida' },
        { name: 'arriveDir', type: 'string', value: 'up' },
      ],
    },
    {
      id: 3,
      name: 'cidade_2',
      type: 'warp',
      x: 44 * 16,
      y: 92 * 16,
      width: 16,
      height: 16,
      properties: [
        { name: 'target', type: 'string', value: 'cidade_2:saida' },
        { name: 'arriveDir', type: 'string', value: 'up' },
      ],
    },
    {
      id: 4,
      name: 'santuario',
      type: 'warp',
      x: 84 * 16,
      y: 32 * 16,
      width: 16,
      height: 16,
      properties: [
        { name: 'target', type: 'string', value: 'santuario:saida' },
        { name: 'arriveDir', type: 'string', value: 'up' },
      ],
    },
    {
      id: 5,
      name: 'caverna',
      type: 'warp',
      x: 94 * 16,
      y: 84 * 16,
      width: 16,
      height: 16,
      properties: [
        { name: 'target', type: 'string', value: 'caverna_b1:entrada' },
        { name: 'arriveDir', type: 'string', value: 'down' },
      ],
    },
    {
      id: 6,
      name: 'Sael',
      type: 'npc',
      x: 42 * 16,
      y: 62 * 16,
      width: 16,
      height: 16,
      properties: [
        { name: 'sprite', type: 'string', value: 'npc_villager' },
        { name: 'direction', type: 'string', value: 'down' },
        { name: 'hideIfFlag', type: 'string', value: 'ato1_concluido' },
        { name: 'setFlagOnTalk', type: 'string', value: 'sael_encontrado' },
        { name: 'altFlag', type: 'string', value: 'sael_encontrado' },
        {
          name: 'dialogue',
          type: 'string',
          value: 'Você serve a um ladrão.\nPergunte ao Rei o que\nhá sob a caverna.\n---\nVocê não vai ouvir. Eu\nsei. Treinaram bem você.',
        },
        {
          name: 'altDialogue',
          type: 'string',
          value: 'Olhe bem para as paredes\ndaquela caverna, herói.\n---\nVeja se aquilo parece\ntoca de fera ou prisão.',
        },
      ],
    },
    {
      id: 7,
      name: 'gruta_costa',
      type: 'warp',
      x: 60 * 16,
      y: 90 * 16,
      width: 16,
      height: 16,
      properties: [
        { name: 'target', type: 'string', value: 'gruta_costa:entrada' },
        { name: 'arriveDir', type: 'string', value: 'up' },
      ],
    },
    {
      id: 8,
      name: 'vau_cinza',
      type: 'warp',
      x: 22 * 16,
      y: 90 * 16,
      width: 16,
      height: 16,
      properties: [
        { name: 'target', type: 'string', value: 'vau_cinza:saida' },
        { name: 'arriveDir', type: 'string', value: 'up' },
      ],
    },
    {
      id: 9,
      name: 'cabana_orun',
      type: 'warp',
      x: 18 * 16,
      y: 78 * 16,
      width: 16,
      height: 16,
      properties: [
        { name: 'target', type: 'string', value: 'cabana_orun:saida' },
        { name: 'arriveDir', type: 'string', value: 'up' },
      ],
    },
    {
      id: 10,
      name: 'rochedo',
      type: 'warp',
      x: 26 * 16,
      y: 24 * 16,
      width: 16,
      height: 16,
      properties: [
        { name: 'target', type: 'string', value: 'rochedo:saida' },
        { name: 'arriveDir', type: 'string', value: 'up' },
      ],
    },
    {
      id: 11,
      name: 'mina_velha',
      type: 'warp',
      x: 42 * 16,
      y: 20 * 16,
      width: 16,
      height: 16,
      properties: [
        { name: 'target', type: 'string', value: 'mina_velha:entrada' },
        { name: 'arriveDir', type: 'string', value: 'up' },
      ],
    },
    {
      id: 12,
      name: 'cobre_alto',
      type: 'warp',
      x: 98 * 16,
      y: 34 * 16,
      width: 16,
      height: 16,
      properties: [
        { name: 'target', type: 'string', value: 'cobre_alto:saida' },
        { name: 'arriveDir', type: 'string', value: 'up' },
      ],
    },
    {
      id: 13,
      name: 'refugio_raizes',
      type: 'warp',
      x: 18 * 16,
      y: 56 * 16,
      width: 16,
      height: 16,
      properties: [
        { name: 'target', type: 'string', value: 'refugio_raizes:saida' },
        { name: 'arriveDir', type: 'string', value: 'up' },
      ],
    },
    {
      id: 14,
      name: 'templo_coracao',
      type: 'warp',
      x: 64 * 16,
      y: 112 * 16,
      width: 16,
      height: 16,
      properties: [
        { name: 'target', type: 'string', value: 'templo_coracao:entrada' },
        { name: 'arriveDir', type: 'string', value: 'up' },
      ],
    }
  );

  return {
    type: 'map',
    version: '1.10',
    tiledversion: '1.10.2',
    orientation: 'orthogonal',
    renderorder: 'right-down',
    compressionlevel: -1,
    width,
    height,
    tilewidth: 16,
    tileheight: 16,
    infinite: false,
    properties: [
      { name: 'id', type: 'string', value: 'overworld' },
      { name: 'title', type: 'string', value: 'REINO DE LUMINÁRIO' },
      { name: 'mapType', type: 'string', value: 'overworld' },
      { name: 'music', type: 'string', value: 'overworld' },
      { name: 'boundaryTile', type: 'string', value: 'water' },
      { name: 'exitOnEdge', type: 'bool', value: false },
      { name: 'edgeExit', type: 'string', value: '' },
      { name: 'worldSeed', type: 'int', value: seed },
    ],
    tilesets: [
      {
        firstgid: 1,
        name: 'luminario_tileset',
        tilewidth: 16,
        tileheight: 16,
      },
    ],
    layers: [
      {
        id: 1,
        name: 'terreno',
        type: 'tilelayer',
        visible: true,
        opacity: 1,
        x: 0,
        y: 0,
        width,
        height,
        data,
      },
      {
        id: 2,
        name: 'objetos',
        type: 'objectgroup',
        visible: true,
        opacity: 1,
        x: 0,
        y: 0,
        objects,
      },
    ],
  };
}

const seed = readWorldSeedFromConfig();
const overworldJson = buildOverworld(seed);
fs.writeFileSync(OVERWORLD_PATH, JSON.stringify(overworldJson, null, 2) + '\n', 'utf-8');
console.log(`[OK] Overworld 128x128 gerado com sucesso em src/data/maps/overworld.json (worldSeed: ${seed})`);
