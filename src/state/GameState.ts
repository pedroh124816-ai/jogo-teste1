import { getItemDef, ItemDef } from '../data/items';
import { StoryFlags, BooleanFlagKey } from './StoryFlags';

export interface InventorySlot {
  itemId: string;
  quantity: number;
}

export interface EquipmentSlots {
  weapon: string | null;
  armor: string | null;
  shield: string | null;
  accessory: string | null;
}

export interface UseItemResult {
  success: boolean;
  consumed: boolean;
  message: string;
}

export interface LevelStats {
  expNeeded: number;
  maxHp: number;
  maxMp: number;
  baseAtk: number;
  baseDef: number;
  agi: number;
  learnedSpell?: string;
}

export interface LevelUpResult {
  leveledUp: boolean;
  oldLevel: number;
  newLevel: number;
  hpGain: number;
  mpGain: number;
  atkGain: number;
  defGain: number;
  agiGain: number;
  learnedSpells: string[];
}

export const LEVEL_TABLE: Record<number, LevelStats> = {
  1: { expNeeded: 0, maxHp: 28, maxMp: 10, baseAtk: 8, baseDef: 4, agi: 6 },
  2: { expNeeded: 10, maxHp: 33, maxMp: 12, baseAtk: 10, baseDef: 6, agi: 7 },
  3: { expNeeded: 28, maxHp: 38, maxMp: 15, baseAtk: 13, baseDef: 8, agi: 9, learnedSpell: 'cura' },
  4: { expNeeded: 56, maxHp: 44, maxMp: 18, baseAtk: 16, baseDef: 10, agi: 11 },
  5: { expNeeded: 98, maxHp: 51, maxMp: 22, baseAtk: 19, baseDef: 13, agi: 13, learnedSpell: 'centelha' },
  6: { expNeeded: 158, maxHp: 58, maxMp: 26, baseAtk: 23, baseDef: 16, agi: 15 },
  7: { expNeeded: 243, maxHp: 66, maxMp: 30, baseAtk: 27, baseDef: 19, agi: 17, learnedSpell: 'protecao' },
  8: { expNeeded: 363, maxHp: 74, maxMp: 35, baseAtk: 31, baseDef: 22, agi: 20 },
  9: { expNeeded: 528, maxHp: 83, maxMp: 40, baseAtk: 36, baseDef: 26, agi: 22, learnedSpell: 'fagulha' },
  10: { expNeeded: 753, maxHp: 92, maxMp: 45, baseAtk: 41, baseDef: 30, agi: 25 },
  11: { expNeeded: 1053, maxHp: 102, maxMp: 50, baseAtk: 46, baseDef: 34, agi: 28 },
  12: { expNeeded: 1453, maxHp: 112, maxMp: 56, baseAtk: 52, baseDef: 39, agi: 31, learnedSpell: 'cura_maior' },
  13: { expNeeded: 1973, maxHp: 123, maxMp: 62, baseAtk: 58, baseDef: 44, agi: 34 },
  14: { expNeeded: 2643, maxHp: 134, maxMp: 68, baseAtk: 64, baseDef: 49, agi: 37 },
  15: { expNeeded: 3493, maxHp: 146, maxMp: 75, baseAtk: 71, baseDef: 55, agi: 40 },
};

export class GameState {
  public name = 'Herói';
  public level = 1;
  public exp = 0;

  public hp = 22;
  public maxHp = 28;
  public mp = 10;
  public maxMp = 10;

  public baseAtk = 8;
  public baseDef = 4;
  public agi = 6;
  public gold = 50;
  public spells: string[] = [];

  public equipment: EquipmentSlots = {
    weapon: 'espada_carvalho',
    armor: 'tunica_viajante',
    shield: null,
    accessory: 'medalhao_real',
  };

  public inventory: InventorySlot[] = [];
  public openedChests: Set<string> = new Set();
  public flags: StoryFlags = new StoryFlags();

  public savedMapId = 'castelo';
  public savedTileX = 18;
  public savedTileY = 6;
  public savedDir: 'up' | 'down' | 'left' | 'right' = 'up';

  private static readonly SAVE_KEY = 'lenda_luminario_save_v1';
  private static memorySaveFallback: string | null = null;

  constructor() {
    this.reset();
  }

  public reset(): void {
    this.name = 'Herói';
    this.level = 1;
    this.exp = 0;
    this.hp = 22;
    this.maxHp = 28;
    this.mp = 10;
    this.maxMp = 10;
    this.baseAtk = 8;
    this.baseDef = 4;
    this.agi = 6;
    this.gold = 50;

    this.equipment = {
      weapon: 'espada_carvalho',
      armor: 'tunica_viajante',
      shield: null,
      accessory: 'medalhao_real',
    };

    this.inventory = [
      { itemId: 'erva_cura', quantity: 2 },
      { itemId: 'tocha', quantity: 1 },
      { itemId: 'espada_carvalho', quantity: 1 },
      { itemId: 'tunica_viajante', quantity: 1 },
      { itemId: 'medalhao_real', quantity: 1 },
    ];

    this.openedChests.clear();
    this.flags.reset();
    this.spells = [];

    this.savedMapId = 'castelo';
    this.savedTileX = 18;
    this.savedTileY = 6;
    this.savedDir = 'up';
  }

  public setHeroName(rawName: string): void {
    const trimmed = rawName.trim().slice(0, 8);
    this.name = trimmed.length > 0 ? trimmed : 'Herói';
  }

  public getFlag(key: BooleanFlagKey | string): boolean {
    return this.flags.get(key);
  }

  public setFlag(key: BooleanFlagKey | string, value = true): void {
    this.flags.set(key, value);
  }

  /**
   * Interpola o marcador [NOME] com o nome atual do herói.
   */
  public interpolateText(text: string): string {
    return text.replace(/\[NOME\]/g, this.name);
  }

  public getAtk(): number {
    let bonus = 0;
    if (this.equipment.weapon) {
      const def = getItemDef(this.equipment.weapon);
      if (def?.atkBonus) bonus += def.atkBonus;
    }
    return this.baseAtk + bonus;
  }

  public getDef(): number {
    let bonus = 0;
    for (const slot of ['armor', 'shield', 'accessory'] as const) {
      const id = this.equipment[slot];
      if (id) {
        const def = getItemDef(id);
        if (def?.defBonus) bonus += def.defBonus;
      }
    }
    return this.baseDef + bonus;
  }

  public isEquipped(itemId: string): boolean {
    return (
      this.equipment.weapon === itemId ||
      this.equipment.armor === itemId ||
      this.equipment.shield === itemId ||
      this.equipment.accessory === itemId
    );
  }

  public getItemQuantity(itemId: string): number {
    const slot = this.inventory.find((s) => s.itemId === itemId);
    return slot ? slot.quantity : 0;
  }

  public addItem(idOrName: string, count = 1): ItemDef | null {
    const def = getItemDef(idOrName);
    if (!def || count <= 0) return null;

    const existing = this.inventory.find((s) => s.itemId === def.id);
    if (existing) {
      existing.quantity += count;
    } else {
      this.inventory.push({ itemId: def.id, quantity: count });
    }
    return def;
  }

  public removeItem(itemId: string, count = 1): boolean {
    const idx = this.inventory.findIndex((s) => s.itemId === itemId);
    if (idx === -1 || this.inventory[idx].quantity < count) {
      return false;
    }

    this.inventory[idx].quantity -= count;
    if (this.inventory[idx].quantity <= 0) {
      this.inventory.splice(idx, 1);
      // Se não restou nenhuma cópia deste item, desequipa caso estivesse equipado
      if (this.equipment.weapon === itemId) this.equipment.weapon = null;
      if (this.equipment.armor === itemId) this.equipment.armor = null;
      if (this.equipment.shield === itemId) this.equipment.shield = null;
      if (this.equipment.accessory === itemId) this.equipment.accessory = null;
    }
    return true;
  }

  public addGold(amount: number): void {
    if (amount > 0) {
      this.gold += amount;
    }
  }

  public spendGold(amount: number): boolean {
    if (amount < 0 || this.gold < amount) {
      return false;
    }
    this.gold -= amount;
    return true;
  }

  /**
   * Usa ou equipa um item do inventário.
   */
  public useOrEquipItem(itemId: string): UseItemResult {
    const def = getItemDef(itemId);
    if (!def || this.getItemQuantity(def.id) <= 0) {
      return {
        success: false,
        consumed: false,
        message: 'Item não encontrado.',
      };
    }

    // 1. Equipamentos (arma, armadura, escudo, acessório)
    if (def.type === 'weapon' || def.type === 'armor' || def.type === 'shield' || def.type === 'accessory') {
      const prevAtk = this.getAtk();
      const prevDef = this.getDef();

      if (this.equipment[def.type] === def.id) {
        this.equipment[def.type] = null;
        return {
          success: true,
          consumed: false,
          message: `Desequipou ${def.name}.\nATQ: ${this.getAtk()}  DEF: ${this.getDef()}`,
        };
      } else {
        this.equipment[def.type] = def.id;
        return {
          success: true,
          consumed: false,
          message: `Equipou ${def.name}!\nATQ: ${prevAtk}->${this.getAtk()}  DEF: ${prevDef}->${this.getDef()}`,
        };
      }
    }

    // 2. Consumíveis de cura de PV / PM
    if (def.type === 'consumable') {
      if (def.healHp) {
        if (this.hp >= this.maxHp) {
          return {
            success: false,
            consumed: false,
            message: `Seus PV já estão no\nmáximo (${this.hp}/${this.maxHp}).`,
          };
        }
        const before = this.hp;
        this.hp = Math.min(this.maxHp, this.hp + def.healHp);
        const recovered = this.hp - before;
        this.removeItem(def.id, 1);
        return {
          success: true,
          consumed: true,
          message: `Usou ${def.name}!\nRecuperou ${recovered} PV (${this.hp}/${this.maxHp}).`,
        };
      }

      if (def.healMp) {
        if (this.mp >= this.maxMp) {
          return {
            success: false,
            consumed: false,
            message: `Seus PM já estão no\nmáximo (${this.mp}/${this.maxMp}).`,
          };
        }
        const before = this.mp;
        this.mp = Math.min(this.maxMp, this.mp + def.healMp);
        const recovered = this.mp - before;
        this.removeItem(def.id, 1);
        return {
          success: true,
          consumed: true,
          message: `Usou ${def.name}!\nRecuperou ${recovered} PM (${this.mp}/${this.maxMp}).`,
        };
      }

      return {
        success: true,
        consumed: false,
        message: def.description,
      };
    }

    // 3. Itens-chave / Lore
    return {
      success: true,
      consumed: false,
      message: def.description,
    };
  }

  /**
   * Descansa na estalagem pagando o custo em ouro e restaurando PV e PM.
   */
  public restAtInn(cost: number): { success: boolean; message: string } {
    if (!this.spendGold(cost)) {
      return {
        success: false,
        message: 'Sinto muito, viajante.\nVocê não tem moedas\nsuficientes para o quarto.',
      };
    }
    this.hp = this.maxHp;
    this.mp = this.maxMp;
    return {
      success: true,
      message: 'Você dormiu profundamente\naté o amanhecer.\nPV e PM restaurados!',
    };
  }

  /**
   * Adiciona experiência ao herói e calcula subidas de nível e novas magias aprendidas.
   */
  public addExp(amount: number): LevelUpResult {
    if (amount <= 0) {
      return {
        leveledUp: false,
        oldLevel: this.level,
        newLevel: this.level,
        hpGain: 0,
        mpGain: 0,
        atkGain: 0,
        defGain: 0,
        agiGain: 0,
        learnedSpells: [],
      };
    }

    this.exp += amount;
    const oldLevel = this.level;
    const learnedSpells: string[] = [];
    const prevMaxHp = this.maxHp;
    const prevMaxMp = this.maxMp;
    const prevAtk = this.baseAtk;
    const prevDef = this.baseDef;
    const prevAgi = this.agi;

    while (this.level < 15) {
      const nextLevel = this.level + 1;
      const nextStats = LEVEL_TABLE[nextLevel];
      if (!nextStats || this.exp < nextStats.expNeeded) {
        break;
      }
      this.level = nextLevel;
      this.maxHp = nextStats.maxHp;
      this.maxMp = nextStats.maxMp;
      this.baseAtk = nextStats.baseAtk;
      this.baseDef = nextStats.baseDef;
      this.agi = nextStats.agi;
      this.hp = this.maxHp;
      this.mp = this.maxMp;

      if (nextStats.learnedSpell && !this.spells.includes(nextStats.learnedSpell)) {
        this.spells.push(nextStats.learnedSpell);
        learnedSpells.push(nextStats.learnedSpell);
      }
    }

    const leveledUp = this.level > oldLevel;
    return {
      leveledUp,
      oldLevel,
      newLevel: this.level,
      hpGain: this.maxHp - prevMaxHp,
      mpGain: this.maxMp - prevMaxMp,
      atkGain: this.baseAtk - prevAtk,
      defGain: this.baseDef - prevDef,
      agiGain: this.agi - prevAgi,
      learnedSpells,
    };
  }

  public getExpForNextLevel(): number {
    if (this.level >= 15) return 0;
    const nextStats = LEVEL_TABLE[this.level + 1];
    if (!nextStats) return 0;
    return Math.max(0, nextStats.expNeeded - this.exp);
  }

  public hasSpell(spellId: string): boolean {
    return this.spells.includes(spellId);
  }

  /**
   * Penalidade de derrota: metade do ouro, restaura PV/PM e prepara respawn no Castelo.
   */
  public respawnAtCastle(): void {
    this.gold = Math.floor(this.gold / 2);
    this.hp = this.maxHp;
    this.mp = this.maxMp;
  }

  public updateLocation(
    mapId: string,
    tileX: number,
    tileY: number,
    dir: 'up' | 'down' | 'left' | 'right' = 'down'
  ): void {
    this.savedMapId = mapId;
    this.savedTileX = tileX;
    this.savedTileY = tileY;
    this.savedDir = dir;
  }

  public saveGame(
    mapId = this.savedMapId,
    tileX = this.savedTileX,
    tileY = this.savedTileY,
    dir: 'up' | 'down' | 'left' | 'right' = this.savedDir
  ): boolean {
    this.updateLocation(mapId, tileX, tileY, dir);
    const payload = {
      version: 1,
      name: this.name,
      level: this.level,
      exp: this.exp,
      hp: this.hp,
      maxHp: this.maxHp,
      mp: this.mp,
      maxMp: this.maxMp,
      baseAtk: this.baseAtk,
      baseDef: this.baseDef,
      agi: this.agi,
      gold: this.gold,
      spells: [...this.spells],
      equipment: { ...this.equipment },
      inventory: this.inventory.map((s) => ({ ...s })),
      openedChests: Array.from(this.openedChests),
      flags: this.flags.toJSON(),
      savedMapId: this.savedMapId,
      savedTileX: this.savedTileX,
      savedTileY: this.savedTileY,
      savedDir: this.savedDir,
    };

    const serialized = JSON.stringify(payload);
    GameState.memorySaveFallback = serialized;
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(GameState.SAVE_KEY, serialized);
      }
      return true;
    } catch {
      return true;
    }
  }

  public hasSaveData(): boolean {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = window.localStorage.getItem(GameState.SAVE_KEY);
        if (raw) return true;
      }
    } catch {
      // ignora erro de localStorage
    }
    return Boolean(GameState.memorySaveFallback);
  }

  public isGameCompleted(): boolean {
    if (this.flags.get('jogo_concluido') || this.flags.get('final_b_coroa_vazia')) return true;
    try {
      let raw: string | null = GameState.memorySaveFallback;
      if (typeof window !== 'undefined' && window.localStorage) {
        const fromStorage = window.localStorage.getItem(GameState.SAVE_KEY);
        if (fromStorage) raw = fromStorage;
      }
      if (raw) {
        const data = JSON.parse(raw);
        if (data?.flags?.flags?.jogo_concluido || data?.flags?.flags?.final_b_coroa_vazia) {
          return true;
        }
      }
    } catch {
      // ignora
    }
    return false;
  }

  public loadGame(): boolean {
    let raw: string | null = GameState.memorySaveFallback;
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const fromStorage = window.localStorage.getItem(GameState.SAVE_KEY);
        if (fromStorage) raw = fromStorage;
      }
    } catch {
      // usa fallback em memória
    }

    if (!raw) return false;

    try {
      const data = JSON.parse(raw);
      if (!data || typeof data !== 'object') return false;

      this.reset();
      if (typeof data.name === 'string') this.name = data.name;
      if (typeof data.level === 'number') this.level = data.level;
      if (typeof data.exp === 'number') this.exp = data.exp;
      if (typeof data.hp === 'number') this.hp = data.hp;
      if (typeof data.maxHp === 'number') this.maxHp = data.maxHp;
      if (typeof data.mp === 'number') this.mp = data.mp;
      if (typeof data.maxMp === 'number') this.maxMp = data.maxMp;
      if (typeof data.baseAtk === 'number') this.baseAtk = data.baseAtk;
      if (typeof data.baseDef === 'number') this.baseDef = data.baseDef;
      if (typeof data.agi === 'number') this.agi = data.agi;
      if (typeof data.gold === 'number') this.gold = data.gold;
      if (Array.isArray(data.spells)) this.spells = [...data.spells];
      if (data.equipment && typeof data.equipment === 'object') {
        this.equipment = {
          weapon: data.equipment.weapon ?? null,
          armor: data.equipment.armor ?? null,
          shield: data.equipment.shield ?? null,
          accessory: data.equipment.accessory ?? null,
        };
      }
      if (Array.isArray(data.inventory)) {
        this.inventory = data.inventory.map((s: InventorySlot) => ({
          itemId: String(s.itemId),
          quantity: Number(s.quantity),
        }));
      }
      if (Array.isArray(data.openedChests)) {
        this.openedChests = new Set(data.openedChests.map(String));
      }
      if (data.flags) {
        this.flags.fromJSON(data.flags);
      }
      if (typeof data.savedMapId === 'string') this.savedMapId = data.savedMapId;
      if (typeof data.savedTileX === 'number') this.savedTileX = data.savedTileX;
      if (typeof data.savedTileY === 'number') this.savedTileY = data.savedTileY;
      if (
        data.savedDir === 'up' ||
        data.savedDir === 'down' ||
        data.savedDir === 'left' ||
        data.savedDir === 'right'
      ) {
        this.savedDir = data.savedDir;
      }
      return true;
    } catch {
      return false;
    }
  }

  public clearSaveData(): void {
    GameState.memorySaveFallback = null;
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(GameState.SAVE_KEY);
      }
    } catch {
      // ignora
    }
  }
}

export const gameState = new GameState();

