import { describe, it, expect, beforeEach } from 'vitest';
import { GameState, LEVEL_TABLE } from '../src/state/GameState';
import {
  MONSTER_CATALOG,
  getMonsterDef,
  SPELL_CATALOG,
  getSpellDef,
  ENCOUNTER_TABLES,
  rollEncounterForTerrain,
} from '../src/data/monsters';
import { getItemDef } from '../src/data/items';
import { BattleEffects } from '../src/engine/BattleEffects';
import { MONSTER_RAW_DATA } from '../src/assets/monsterGraphics';

describe('Sistema de Batalha, Balanceamento e Monstros Originais (Etapa 5)', () => {
  let state: GameState;

  beforeEach(() => {
    state = new GameState();
  });

  it('o catálogo de monstros deve conter todos os 9 monstros do Ato 1 com atributos válidos', () => {
    expect(MONSTER_CATALOG.length).toBeGreaterThanOrEqual(9);

    for (const monster of MONSTER_CATALOG) {
      expect(monster.id, 'Id do monstro não pode ser vazio').toBeTruthy();
      expect(monster.name.length, `Nome do monstro '${monster.id}' muito longo`).toBeLessThanOrEqual(18);
      expect(monster.maxHp, `HP de '${monster.id}' deve ser > 0`).toBeGreaterThan(0);
      expect(monster.atk, `ATQ de '${monster.id}' deve ser > 0`).toBeGreaterThan(0);
      expect(monster.def, `DEF de '${monster.id}' deve ser > 0`).toBeGreaterThan(0);
      expect(monster.agi, `AGI de '${monster.id}' deve ser > 0`).toBeGreaterThan(0);
      expect(monster.exp, `EXP de '${monster.id}' deve ser > 0`).toBeGreaterThan(0);
      expect(monster.gold, `Ouro de '${monster.id}' deve ser > 0`).toBeGreaterThan(0);

      // Descrição respeitando 28 caracteres por linha
      for (const line of monster.description.split('\n')) {
        expect(
          line.length,
          `Descrição de '${monster.id}' excede 28 caracteres: "${line}"`
        ).toBeLessThanOrEqual(28);
      }

      // Sprite correspondente no atlas procedural de monstros
      expect(
        MONSTER_RAW_DATA[monster.spriteId],
        `Sprite '${monster.spriteId}' de '${monster.id}' não encontrado em MONSTER_RAW_DATA`
      ).toBeTruthy();

      // Se tiver drop, deve existir no catálogo de itens
      if (monster.dropItemId) {
        expect(
          getItemDef(monster.dropItemId),
          `Item de drop '${monster.dropItemId}' do monstro '${monster.id}' não existe`
        ).toBeTruthy();
      }
    }

    // O chefe do Ato 1 não permite fuga
    const ulan = getMonsterDef('ulan_fera');
    expect(ulan).toBeTruthy();
    expect(ulan?.canFlee).toBe(false);

    // Monstros do Ato 2 possuem atributos elevados para desafiar heróis Nível 10+
    const act2Ids = [
      'caranguejo_vidro',
      'contrabandista',
      'sirena_coral',
      'gaivota_abissal',
      'tartaruga_espinho',
      'anemona_eletrica',
    ];
    for (const id of act2Ids) {
      const m = getMonsterDef(id);
      expect(m, `Monstro do Ato 2 '${id}' deve existir`).toBeTruthy();
      expect(m!.maxHp).toBeGreaterThanOrEqual(90);
      expect(m!.atk).toBeGreaterThanOrEqual(48);
      expect(m!.def).toBeGreaterThanOrEqual(34);
    }
  });

  it('tabelas de encontro por bioma devem conter monstros válidos e somatório positivo de pesos', () => {
    const requiredTerrains = ['grass', 'flower_grass', 'sand', 'tree', 'mountain', 'cave_floor'];

    for (const terrain of requiredTerrains) {
      const table = ENCOUNTER_TABLES[terrain];
      expect(table, `Tabela de encontro para terreno '${terrain}' não encontrada`).toBeTruthy();
      expect(table.length).toBeGreaterThan(0);

      let totalWeight = 0;
      for (const entry of table) {
        expect(getMonsterDef(entry.monsterId), `Monstro '${entry.monsterId}' da tabela '${terrain}' não existe`).toBeTruthy();
        expect(entry.weight).toBeGreaterThan(0);
        totalWeight += entry.weight;
      }
      expect(totalWeight).toBeGreaterThan(0);

      const rolled = rollEncounterForTerrain(terrain);
      expect(rolled, `rollEncounterForTerrain falhou para o terreno '${terrain}'`).toBeTruthy();
    }
  });

  it('o catálogo de magias deve conter magias válidas com custos e poderes equilibrados', () => {
    expect(SPELL_CATALOG.length).toBeGreaterThanOrEqual(5);

    const cura = getSpellDef('cura');
    expect(cura).toBeTruthy();
    expect(cura?.mpCost).toBe(3);
    expect(cura?.type).toBe('heal');

    const centelha = getSpellDef('centelha');
    expect(centelha).toBeTruthy();
    expect(centelha?.mpCost).toBe(4);
    expect(centelha?.type).toBe('damage');

    for (const spell of SPELL_CATALOG) {
      for (const line of spell.description.split('\n')) {
        expect(
          line.length,
          `Descrição da magia '${spell.id}' excede 28 caracteres: "${line}"`
        ).toBeLessThanOrEqual(28);
      }
    }
  });

  it('deve calcular experiência e subida de nível progressiva aprendendo magias corretamente', () => {
    expect(state.level).toBe(1);
    expect(state.exp).toBe(0);
    expect(state.hp).toBe(22);
    expect(state.maxHp).toBe(28);
    expect(state.spells.length).toBe(0);

    // EXP necessária para nível 2 é 10
    expect(state.getExpForNextLevel()).toBe(10);

    // Adiciona 10 EXP -> sobe para nível 2
    const resLevel2 = state.addExp(10);
    expect(resLevel2.leveledUp).toBe(true);
    expect(resLevel2.newLevel).toBe(2);
    expect(state.level).toBe(2);
    expect(state.maxHp).toBe(LEVEL_TABLE[2].maxHp);
    expect(state.maxMp).toBe(LEVEL_TABLE[2].maxMp);
    expect(state.baseAtk).toBe(LEVEL_TABLE[2].baseAtk);
    expect(state.baseDef).toBe(LEVEL_TABLE[2].baseDef);
    expect(state.hp).toBe(state.maxHp); // Restaura vida ao subir de nível
    expect(state.spells.length).toBe(0);

    // Adiciona EXP até 28 -> sobe para nível 3 e aprende 'cura'
    const resLevel3 = state.addExp(18);
    expect(resLevel3.leveledUp).toBe(true);
    expect(resLevel3.newLevel).toBe(3);
    expect(state.hasSpell('cura')).toBe(true);
    expect(resLevel3.learnedSpells).toContain('cura');

    // Salto para nível 5 com 98 EXP total
    const neededFor5 = LEVEL_TABLE[5].expNeeded - state.exp;
    const resLevel5 = state.addExp(neededFor5);
    expect(resLevel5.leveledUp).toBe(true);
    expect(state.level).toBe(5);
    expect(state.hasSpell('centelha')).toBe(true);
  });

  it('deve aplicar penalidade de derrota reduzindo o ouro pela metade e restaurando vida', () => {
    state.gold = 100;
    state.hp = 0;
    state.mp = 0;

    state.respawnAtCastle();
    expect(state.gold).toBe(50);
    expect(state.hp).toBe(state.maxHp);
    expect(state.mp).toBe(state.maxMp);
  });

  it('módulo BattleEffects deve gerenciar tremor, flash e textos flutuantes', () => {
    const effects = new BattleEffects();
    expect(effects.getScreenOffset()).toEqual({ x: 0, y: 0 });

    effects.triggerScreenShake(6, 10);
    expect(effects.getScreenOffset().x).not.toBeNull();

    effects.triggerMonsterFlash(10);
    expect(effects.isMonsterFlashVisible()).toBe(true);

    effects.addFloatingText('12', 100, 100);
    expect(effects.getFloatingTexts().length).toBe(1);

    // Avança 15 frames
    for (let i = 0; i < 15; i++) {
      effects.update();
    }

    expect(effects.getScreenOffset()).toEqual({ x: 0, y: 0 });
    expect(effects.isMonsterFlashVisible()).toBe(false);
  });
});
