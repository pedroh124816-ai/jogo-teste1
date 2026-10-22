import itemsRaw from './items.json';

export type ItemType = 'consumable' | 'weapon' | 'armor' | 'shield' | 'accessory' | 'key';

export interface ItemDef {
  id: string;
  name: string;
  type: ItemType;
  price: number;
  healHp?: number;
  healMp?: number;
  atkBonus?: number;
  defBonus?: number;
  unsellable?: boolean;
  description: string;
}

export const ITEM_CATALOG: readonly ItemDef[] = itemsRaw as ItemDef[];

export const ITEM_DEFS_BY_ID: Record<string, ItemDef> = {};
for (const item of ITEM_CATALOG) {
  ITEM_DEFS_BY_ID[item.id] = item;
}

/**
 * Busca um item pelo seu id semântico ou pelo nome de exibição (case-insensitive).
 */
export function getItemDef(idOrName: string): ItemDef | null {
  if (!idOrName) return null;
  if (ITEM_DEFS_BY_ID[idOrName]) {
    return ITEM_DEFS_BY_ID[idOrName];
  }
  const normalized = idOrName.trim().toLowerCase();
  return ITEM_CATALOG.find((i) => i.name.toLowerCase() === normalized) || null;
}

/**
 * Catálogo padrão das lojas por mapa.
 */
export const SHOP_CATALOGS: Record<string, string[]> = {
  cidade_1_loja: [
    'erva_cura',
    'tonico_brasa',
    'adaga_cobre',
    'espada_ferro',
    'couraca_couro',
    'escudo_madeira',
  ],
  cidade_2: [
    'tonico_brasa',
    'agua_lume',
    'asa_retorno',
    'sabre_marinho',
    'cota_malha',
    'escudo_ferro',
  ],
  vau_cinza: [
    'tonico_brasa',
    'agua_lume',
    'lamina_fronteira',
    'armadura_bronze',
    'escudo_cobre',
  ],
  rochedo: [
    'tonico_brasa',
    'elixir_lume',
    'machado_pedrasul',
    'cota_pedrasul',
    'escudo_cobre',
  ],
  cobre_alto: [
    'elixir_lume',
    'agua_lume',
    'espada_cobreval',
    'cota_pedrasul',
    'escudo_cobre',
  ],
  refugio_raizes: [
    'elixir_lume',
    'agua_lume',
    'asa_retorno',
    'lamina_veyra',
    'manto_raizes',
    'escudo_veyra',
  ],
};
