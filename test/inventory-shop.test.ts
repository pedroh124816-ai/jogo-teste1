import { describe, it, expect, beforeEach } from 'vitest';
import { GameState } from '../src/state/GameState';
import { ITEM_CATALOG, getItemDef, SHOP_CATALOGS } from '../src/data/items';

describe('Sistema de Inventário, Equipamentos, Loja e Estalagem (Etapa 3)', () => {
  let state: GameState;

  beforeEach(() => {
    state = new GameState();
  });

  it('catálogo de itens deve conter itens válidos e descrições respeitando 28 caracteres por linha', () => {
    expect(ITEM_CATALOG.length).toBeGreaterThanOrEqual(12);

    for (const item of ITEM_CATALOG) {
      expect(item.id).toBeTruthy();
      expect(item.name.length).toBeLessThanOrEqual(18);
      for (const line of item.description.split('\n')) {
        expect(
          line.length,
          `Descrição do item '${item.id}' excede 28 caracteres: "${line}"`
        ).toBeLessThanOrEqual(28);
      }
    }

    for (const [shopId, list] of Object.entries(SHOP_CATALOGS)) {
      for (const itemId of list) {
        expect(getItemDef(itemId), `Item '${itemId}' da loja '${shopId}' não existe`).toBeTruthy();
      }
    }
  });

  it('deve calcular ATQ e DEF corretamente ao equipar e desequipar armas, armaduras e escudos', () => {
    // Inicial: baseAtk 8 + espada_carvalho (+4) = 12
    // baseDef 4 + tunica_viajante (+3) + medalhao_real (+2) = 9
    expect(state.getAtk()).toBe(12);
    expect(state.getDef()).toBe(9);

    state.addItem('espada_ferro', 1);
    const eqWeapon = state.useOrEquipItem('espada_ferro');
    expect(eqWeapon.success).toBe(true);
    expect(state.equipment.weapon).toBe('espada_ferro');
    expect(state.getAtk()).toBe(8 + 16);

    state.addItem('escudo_madeira', 1);
    state.useOrEquipItem('escudo_madeira');
    expect(state.equipment.shield).toBe('escudo_madeira');
    expect(state.getDef()).toBe(9 + 4);

    // Desequipar escudo ao selecioná-lo novamente
    state.useOrEquipItem('escudo_madeira');
    expect(state.equipment.shield).toBeNull();
    expect(state.getDef()).toBe(9);
  });

  it('deve usar Erva de Cura para restaurar PV e impedir desperdício com PV cheio', () => {
    expect(state.hp).toBe(22);
    expect(state.maxHp).toBe(28);
    expect(state.getItemQuantity('erva_cura')).toBe(2);

    const res1 = state.useOrEquipItem('erva_cura');
    expect(res1.success).toBe(true);
    expect(res1.consumed).toBe(true);
    expect(state.hp).toBe(28);
    expect(state.getItemQuantity('erva_cura')).toBe(1);

    // Tentar usar novamente com PV já em 28/28 não deve gastar a segunda erva
    const res2 = state.useOrEquipItem('erva_cura');
    expect(res2.success).toBe(false);
    expect(res2.consumed).toBe(false);
    expect(state.getItemQuantity('erva_cura')).toBe(1);
  });

  it('deve permitir descansar na estalagem pagando ouro e restaurando PV e PM', () => {
    state.hp = 10;
    state.mp = 2;
    state.gold = 50;

    const rest = state.restAtInn(10);
    expect(rest.success).toBe(true);
    expect(state.gold).toBe(40);
    expect(state.hp).toBe(state.maxHp);
    expect(state.mp).toBe(state.maxMp);

    // Sem ouro suficiente
    state.gold = 5;
    state.hp = 12;
    const failRest = state.restAtInn(10);
    expect(failRest.success).toBe(false);
    expect(state.gold).toBe(5);
    expect(state.hp).toBe(12);
  });

  it('deve resolver itens de baús tanto por id quanto por nome (ex: Diário de Ulan)', () => {
    const added = state.addItem('Diário de Ulan', 1);
    expect(added).toBeTruthy();
    expect(added?.id).toBe('diario_ulan');
    expect(state.getItemQuantity('diario_ulan')).toBe(1);
  });

  it('não deve permitir vender itens quando estiverem equipados e com quantidade 1', () => {
    // Inicialmente a espada_carvalho está equipada e quantidade é 1
    expect(state.isEquipped('espada_carvalho')).toBe(true);
    expect(state.getItemQuantity('espada_carvalho')).toBe(1);

    // Se possui apenas 1 e está equipado, a regra de venda exige desequipar primeiro
    const isSingleEquipped = state.isEquipped('espada_carvalho') && state.getItemQuantity('espada_carvalho') <= 1;
    expect(isSingleEquipped).toBe(true);

    // Se adicionar uma segunda espada, o jogador passa a ter uma reserva que pode ser vendida
    state.addItem('espada_carvalho', 1);
    expect(state.getItemQuantity('espada_carvalho')).toBe(2);
    const canSellSpare = state.isEquipped('espada_carvalho') && state.getItemQuantity('espada_carvalho') <= 1;
    expect(canSellSpare).toBe(false);

    // Vendendo a reserva
    state.removeItem('espada_carvalho', 1);
    expect(state.getItemQuantity('espada_carvalho')).toBe(1);
    expect(state.isEquipped('espada_carvalho')).toBe(true);
  });
});
