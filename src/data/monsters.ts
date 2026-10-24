import monstersJson from './monsters.json';

export interface MonsterDef {
  id: string;
  name: string;
  maxHp: number;
  atk: number;
  def: number;
  agi: number;
  exp: number;
  gold: number;
  spriteId: string;
  canFlee: boolean;
  dropItemId?: string;
  dropChance?: number;
  description: string;
}

export interface SpellDef {
  id: string;
  name: string;
  mpCost: number;
  levelRequired: number;
  type: 'heal' | 'damage' | 'buff';
  powerMin: number;
  powerMax: number;
  description: string;
}

export interface EncounterWeight {
  monsterId: string;
  weight: number;
}

export const MONSTER_CATALOG: MonsterDef[] = monstersJson as MonsterDef[];

const MONSTERS_BY_ID = new Map<string, MonsterDef>(
  MONSTER_CATALOG.map((m) => [m.id, m])
);

export function getMonsterDef(id: string): MonsterDef | undefined {
  return MONSTERS_BY_ID.get(id);
}

export const SPELL_CATALOG: SpellDef[] = [
  {
    id: 'cura',
    name: 'Cura',
    mpCost: 3,
    levelRequired: 3,
    type: 'heal',
    powerMin: 25,
    powerMax: 35,
    description: 'Restaura de 25 a 35 PV\ndo herói.',
  },
  {
    id: 'centelha',
    name: 'Centelha',
    mpCost: 4,
    levelRequired: 5,
    type: 'damage',
    powerMin: 16,
    powerMax: 24,
    description: 'Dispara centelha luminosa\nque ignora a armadura.',
  },
  {
    id: 'protecao',
    name: 'Proteção',
    mpCost: 3,
    levelRequired: 7,
    type: 'buff',
    powerMin: 6,
    powerMax: 6,
    description: 'Aumenta a defesa em +6\naté o fim da batalha.',
  },
  {
    id: 'fagulha',
    name: 'Fagulha',
    mpCost: 6,
    levelRequired: 9,
    type: 'damage',
    powerMin: 34,
    powerMax: 46,
    description: 'Causa explosão de fogo\nde 34 a 46 de dano.',
  },
  {
    id: 'cura_maior',
    name: 'Cura Maior',
    mpCost: 7,
    levelRequired: 12,
    type: 'heal',
    powerMin: 60,
    powerMax: 80,
    description: 'Restaura de 60 a 80 PV\ndo herói.',
  },
  {
    id: 'eco',
    name: 'Eco de Veyra',
    mpCost: 8,
    levelRequired: 10,
    type: 'damage',
    powerMin: 55,
    powerMax: 75,
    description: 'Canto ancestral que purifica\no lume e causa alto dano.',
  },
];

const SPELLS_BY_ID = new Map<string, SpellDef>(
  SPELL_CATALOG.map((s) => [s.id, s])
);

export function getSpellDef(id: string): SpellDef | undefined {
  return SPELLS_BY_ID.get(id);
}

export const ENCOUNTER_TABLES: Record<string, EncounterWeight[]> = {
  grass: [
    { monsterId: 'gosma_cinza', weight: 55 },
    { monsterId: 'lebre_cinza', weight: 40 },
    { monsterId: 'gosma_dourada', weight: 5 },
  ],
  flower_grass: [
    { monsterId: 'gosma_cinza', weight: 45 },
    { monsterId: 'lebre_cinza', weight: 50 },
    { monsterId: 'gosma_dourada', weight: 5 },
  ],
  sand: [
    { monsterId: 'caranguejo_vidro', weight: 30 },
    { monsterId: 'tartaruga_espinho', weight: 25 },
    { monsterId: 'sirena_coral', weight: 20 },
    { monsterId: 'gaivota_abissal', weight: 15 },
    { monsterId: 'gosma_azul', weight: 10 },
  ],
  tree: [
    { monsterId: 'lebre_cinza', weight: 20 },
    { monsterId: 'lobo_brasa', weight: 45 },
    { monsterId: 'tronco_palido', weight: 25 },
    { monsterId: 'bandoleiro', weight: 10 },
  ],
  mountain: [
    { monsterId: 'corvo_manchado', weight: 45 },
    { monsterId: 'lobo_brasa', weight: 35 },
    { monsterId: 'lebre_cinza', weight: 20 },
  ],
  cave_floor: [
    { monsterId: 'morcego_treva', weight: 45 },
    { monsterId: 'mineiro_louco', weight: 35 },
    { monsterId: 'anemona_eletrica', weight: 20 },
  ],
  costa_sol: [
    { monsterId: 'caranguejo_vidro', weight: 22 },
    { monsterId: 'contrabandista', weight: 20 },
    { monsterId: 'tartaruga_espinho', weight: 20 },
    { monsterId: 'sirena_coral', weight: 16 },
    { monsterId: 'gaivota_abissal', weight: 14 },
    { monsterId: 'gosma_azul', weight: 8 },
  ],
  pantano_brumaterra: [
    { monsterId: 'sapo_lume', weight: 40 },
    { monsterId: 'lobo_sombrio', weight: 30 },
    { monsterId: 'gosma_vermelha', weight: 20 },
    { monsterId: 'tronco_palido', weight: 10 },
  ],
  montanhas_pedrasul: [
    { monsterId: 'rochedo_vivo', weight: 45 },
    { monsterId: 'gaivota_abissal', weight: 25 },
    { monsterId: 'lobo_sombrio', weight: 20 },
    { monsterId: 'gosma_vermelha', weight: 10 },
  ],
  planalto_cobreval: [
    { monsterId: 'golem_cobre', weight: 50 },
    { monsterId: 'rochedo_vivo', weight: 30 },
    { monsterId: 'gosma_vermelha', weight: 15 },
    { monsterId: 'gosma_dourada', weight: 5 },
  ],
  ilha_veyra: [
    { monsterId: 'guardiao_espectral', weight: 60 },
    { monsterId: 'golem_cobre', weight: 30 },
    { monsterId: 'gosma_dourada', weight: 10 },
  ],
  gruta_costa_b1: [
    { monsterId: 'anemona_eletrica', weight: 30 },
    { monsterId: 'caranguejo_vidro', weight: 25 },
    { monsterId: 'sirena_coral', weight: 20 },
    { monsterId: 'escorpiao_cristal', weight: 15 },
    { monsterId: 'morcego_treva', weight: 10 },
  ],
  gruta_costa_b2: [
    { monsterId: 'anemona_eletrica', weight: 25 },
    { monsterId: 'escorpiao_cristal', weight: 25 },
    { monsterId: 'sentinela_antiga', weight: 25 },
    { monsterId: 'contrabandista', weight: 15 },
    { monsterId: 'sirena_coral', weight: 10 },
  ],
  gruta_costa_b3: [
    { monsterId: 'salamandra_lava', weight: 40 },
    { monsterId: 'sentinela_antiga', weight: 35 },
    { monsterId: 'gosma_vermelha', weight: 20 },
    { monsterId: 'gosma_dourada', weight: 5 },
  ],
  floresta_secreta: [
    { monsterId: 'lobo_sombrio', weight: 35 },
    { monsterId: 'tronco_palido', weight: 30 },
    { monsterId: 'escorpiao_cristal', weight: 25 },
    { monsterId: 'gosma_dourada', weight: 10 },
  ],
};

/**
 * Seleciona aleatoriamente um monstro com base no terreno e (opcionalmente) na coordenada do overworld ou ID do mapa.
 */
export function rollEncounterForTerrain(
  terrainId: string,
  tileX?: number,
  tileY?: number,
  mapId?: string
): MonsterDef | null {
  let tableKey = terrainId;

  if (mapId === 'gruta_costa') {
    tableKey = 'gruta_costa_b1';
  } else if (mapId === 'gruta_costa_b2') {
    tableKey = 'gruta_costa_b2';
  } else if (mapId === 'gruta_costa_b3') {
    tableKey = 'gruta_costa_b3';
  } else if (mapId === 'floresta_secreta') {
    tableKey = 'floresta_secreta';
  } else if (tileX !== undefined && tileY !== undefined) {
    if (tileY >= 104 && tileX >= 50 && tileX <= 80) {
      tableKey = 'ilha_veyra';
    } else if (tileY >= 70 && tileX >= 36 && tileX <= 74) {
      tableKey = 'costa_sol';
    } else if (tileY >= 70 && tileX <= 33) {
      tableKey = 'pantano_brumaterra';
    } else if (tileY <= 38 && tileX <= 52 && terrainId === 'mountain') {
      tableKey = 'montanhas_pedrasul';
    } else if (tileY <= 40 && tileX >= 60 && !(tileX >= 74 && tileX <= 90 && tileY >= 26)) {
      tableKey = 'planalto_cobreval';
    }
  }

  const table = ENCOUNTER_TABLES[tableKey] || ENCOUNTER_TABLES[terrainId];
  if (!table || table.length === 0) return null;

  const totalWeight = table.reduce((sum, item) => sum + item.weight, 0);
  let roll = Math.random() * totalWeight;

  for (const item of table) {
    if (roll < item.weight) {
      return getMonsterDef(item.monsterId) || null;
    }
    roll -= item.weight;
  }

  return getMonsterDef(table[0].monsterId) || null;
}
