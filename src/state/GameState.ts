import { getItemDef, ItemDef } from '../data/items';
import { StoryFlags, BooleanFlagKey } from './StoryFlags';
import { soundManager } from '../engine/AudioManager';

export interface GameSettings {
  bgmVolume: number; // 0 a 100
  sfxVolume: number; // 0 a 100
  textSpeed: 'normal' | 'fast' | 'instant';
}

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
  public timeOfDay: 'day' | 'night' = 'day';

  /** Meio de transporte atual no mapa-múndi e posição dos veículos estacionados. */
  public transport: 'foot' | 'boat' | 'balloon' = 'foot';
  public boatPos: { x: number; y: number } | null = null;
  public balloonPos: { x: number; y: number } | null = null;

  public respawnMapId = 'castelo';
  public respawnTileX = 18;
  public respawnTileY = 6;
  public respawnDir: 'up' | 'down' | 'left' | 'right' = 'up';

  public settings: GameSettings = {
    bgmVolume: 80,
    sfxVolume: 100,
    textSpeed: 'fast',
  };

  private static readonly SAVE_KEY = 'lenda_luminario_save_v1';
  public static readonly SLOT_COUNT = 3;
  private static memorySaveFallback: Record<number, string | null> = { 1: null, 2: null, 3: null };

  /** Slot de save ativo (1 a 3). Não é zerado por reset(). */
  public currentSlot = 1;

  private static slotKey(slot: number): string {
    // Slot 1 mantém a chave antiga para preservar saves já existentes
    return slot === 1 ? GameState.SAVE_KEY : `${GameState.SAVE_KEY}_slot${slot}`;
  }

  private static readRaw(slot: number): string | null {
    let raw: string | null = GameState.memorySaveFallback[slot] ?? null;
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const fromStorage = window.localStorage.getItem(GameState.slotKey(slot));
        if (fromStorage) raw = fromStorage;
      }
    } catch {
      // usa fallback em memória
    }
    return raw;
  }

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
    this.transport = 'foot';
    this.boatPos = null;
    this.balloonPos = null;
    this.savedMapId = 'castelo';
    this.savedTileX = 18;
    this.savedTileY = 6;
    this.savedDir = 'up';
    this.timeOfDay = 'day';
  }

  public isNight(): boolean {
    return this.timeOfDay === 'night';
  }

  public setTimeOfDay(time: 'day' | 'night'): void {
    this.timeOfDay = time;
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

  public setRespawnPoint(
    mapId: string,
    tileX: number,
    tileY: number,
    dir: 'up' | 'down' | 'left' | 'right' = 'down'
  ): void {
    this.respawnMapId = mapId;
    this.respawnTileX = tileX;
    this.respawnTileY = tileY;
    this.respawnDir = dir;
  }

  public respawn(): {
    mapId: string;
    tileX: number;
    tileY: number;
    dir: 'up' | 'down' | 'left' | 'right';
  } {
    this.gold = Math.floor(this.gold / 2);
    this.hp = this.maxHp;
    this.mp = this.maxMp;
    return {
      mapId: this.respawnMapId,
      tileX: this.respawnTileX,
      tileY: this.respawnTileY,
      dir: this.respawnDir,
    };
  }

  /**
   * Penalidade de derrota: metade do ouro, restaura PV/PM e prepara respawn no último ponto salvo/estalagem.
   */
  public respawnAtCastle(): void {
    this.respawn();
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
      timeOfDay: this.timeOfDay,
      transport: this.transport,
      boatPos: this.boatPos,
      balloonPos: this.balloonPos,
      respawnMapId: this.respawnMapId,
      respawnTileX: this.respawnTileX,
      respawnTileY: this.respawnTileY,
      respawnDir: this.respawnDir,
      settings: { ...this.settings },
    };

    const serialized = JSON.stringify(payload);
    GameState.memorySaveFallback[this.currentSlot] = serialized;
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(GameState.slotKey(this.currentSlot), serialized);
      }
      return true;
    } catch {
      return true;
    }
  }

  /** Verifica se existe save no slot indicado (ou em qualquer slot, se omitido). */
  public hasSaveData(slot?: number): boolean {
    if (slot !== undefined) return Boolean(GameState.readRaw(slot));
    for (let s = 1; s <= GameState.SLOT_COUNT; s++) {
      if (GameState.readRaw(s)) return true;
    }
    return false;
  }

  /** Resumo de um slot para exibir na tela de seleção. */
  public getSlotSummary(
    slot: number
  ): { name: string; level: number; mapId: string; completed: boolean } | null {
    const raw = GameState.readRaw(slot);
    if (!raw) return null;
    try {
      const data = JSON.parse(raw);
      if (!data || typeof data !== 'object') return null;
      return {
        name: typeof data.name === 'string' ? data.name : '???',
        level: typeof data.level === 'number' ? data.level : 1,
        mapId: typeof data.savedMapId === 'string' ? data.savedMapId : '',
        completed: Boolean(
          data?.flags?.flags?.jogo_concluido || data?.flags?.flags?.final_b_coroa_vazia
        ),
      };
    } catch {
      return null;
    }
  }

  public isGameCompleted(): boolean {
    if (this.flags.get('jogo_concluido') || this.flags.get('final_b_coroa_vazia')) return true;
    for (let s = 1; s <= GameState.SLOT_COUNT; s++) {
      if (this.getSlotSummary(s)?.completed) return true;
    }
    return false;
  }

  public loadGame(slot: number = this.currentSlot): boolean {
    const raw = GameState.readRaw(slot);

    if (!raw) return false;

    try {
      const data = JSON.parse(raw);
      if (!data || typeof data !== 'object') return false;

      this.reset();
      this.currentSlot = slot;
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
      if (data.timeOfDay === 'day' || data.timeOfDay === 'night') {
        this.timeOfDay = data.timeOfDay;
      }
      if (data.transport === 'boat' || data.transport === 'balloon' || data.transport === 'foot') {
        this.transport = data.transport;
      }
      const readPos = (p: unknown): { x: number; y: number } | null =>
        p && typeof (p as { x: unknown }).x === 'number' && typeof (p as { y: unknown }).y === 'number'
          ? { x: (p as { x: number }).x, y: (p as { y: number }).y }
          : null;
      this.boatPos = readPos(data.boatPos);
      this.balloonPos = readPos(data.balloonPos);
      if (typeof data.respawnMapId === 'string') this.respawnMapId = data.respawnMapId;
      if (typeof data.respawnTileX === 'number') this.respawnTileX = data.respawnTileX;
      if (typeof data.respawnTileY === 'number') this.respawnTileY = data.respawnTileY;
      if (
        data.respawnDir === 'up' ||
        data.respawnDir === 'down' ||
        data.respawnDir === 'left' ||
        data.respawnDir === 'right'
      ) {
        this.respawnDir = data.respawnDir;
      }
      if (data.settings && typeof data.settings === 'object') {
        this.settings = {
          bgmVolume: typeof data.settings.bgmVolume === 'number' ? data.settings.bgmVolume : 80,
          sfxVolume: typeof data.settings.sfxVolume === 'number' ? data.settings.sfxVolume : 100,
          textSpeed: ['normal', 'fast', 'instant'].includes(data.settings.textSpeed)
            ? data.settings.textSpeed
            : 'fast',
        };
        soundManager.setBgmVolume(this.settings.bgmVolume / 100);
        soundManager.setSfxVolume(this.settings.sfxVolume / 100);
      }
      return true;
    } catch {
      return false;
    }
  }

  public clearSaveData(slot: number = this.currentSlot): void {
    GameState.memorySaveFallback[slot] = null;
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(GameState.slotKey(slot));
      }
    } catch {
      // ignora
    }
  }
}

export const gameState = new GameState();

