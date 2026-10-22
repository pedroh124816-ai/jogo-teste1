import { describe, it, expect, beforeEach } from 'vitest';
import { gameState } from '../src/state/GameState';
import { TiledMap } from '../src/engine/TiledMap';
import { getItemDef } from '../src/data/items';
import { getMonsterDef, ENCOUNTER_TABLES } from '../src/data/monsters';
import { TILE_DEFS_BY_ID } from '../src/data/tiles';
import cidade1Data from '../src/data/maps/cidade_1.json';
import overworldData from '../src/data/maps/overworld.json';
import cavernaB1Data from '../src/data/maps/caverna_b1.json';
import cavernaB2Data from '../src/data/maps/caverna_b2.json';
import casteloData from '../src/data/maps/castelo.json';

describe('Etapa 6 - Fatia Vertical do Ato 1 Completo e Refinamentos', () => {
  beforeEach(() => {
    gameState.reset();
  });

  it('garante que mapas de cidade, castelo e interior sao seguros (sem encontros aleatorios)', () => {
    const cidadeMap = new TiledMap('cidade_1', cidade1Data as any);
    const casteloMap = new TiledMap('castelo', casteloData as any);
    const overworldMap = new TiledMap('overworld', overworldData as any);
    const cavernaB1Map = new TiledMap('caverna_b1', cavernaB1Data as any);

    expect(cidadeMap.isSafe).toBe(true);
    expect(casteloMap.isSafe).toBe(true);
    expect(overworldMap.isSafe).toBe(false);
    expect(cavernaB1Map.isSafe).toBe(false);
  });

  it('permite caminhar sobre montanhas como em Dragon Quest com tabela de encontros propria', () => {
    expect(TILE_DEFS_BY_ID.mountain.solid).toBe(false);
    expect(TILE_DEFS_BY_ID.mountain.encounterRate).toBeGreaterThan(0);
    expect(ENCOUNTER_TABLES.mountain).toBeDefined();
    expect(ENCOUNTER_TABLES.mountain.length).toBeGreaterThan(0);
  });

  it('possui os NPCs canonicos da Vila de Alvorada (Mestre Tavo, Dona Bina, Iris) e o Poco', () => {
    const cidadeMap = new TiledMap('cidade_1', cidade1Data as any);
    const npcNames = cidadeMap.npcs.map(n => n.name);

    expect(npcNames).toContain('Mestre Tavo');
    expect(npcNames).toContain('Dona Bina');
    expect(npcNames).toContain('Íris');
    expect(cidadeMap.getTileAt(11, 12)?.id).toBe('well');
  });

  it('possui Sael na clareira do Bosque de Brasa e marcas de picareta na Caverna B1', () => {
    const overworldMap = new TiledMap('overworld', overworldData as any);
    const sael = overworldMap.npcs.find(n => n.name === 'Sael');
    expect(sael).toBeDefined();
    expect(sael?.setFlagOnTalk).toBe('sael_encontrado');

    const cavernaB1Map = new TiledMap('caverna_b1', cavernaB1Data as any);
    const marcas = cavernaB1Map.signs.find(s => s.title === 'PAREDE DA CAVERNA');
    expect(marcas).toBeDefined();
    expect(marcas?.text).toContain('Marcas de picareta');
  });

  it('possui o chefe Ulan, a Fera na Caverna B2 que desaparece apos fera_derrotada', () => {
    const cavernaB2Map = new TiledMap('caverna_b2', cavernaB2Data as any);
    const ulan = cavernaB2Map.npcs.find(n => n.name === 'Ulan, a Fera');
    expect(ulan).toBeDefined();
    expect(ulan?.hideIfFlag).toBe('fera_derrotada');
    expect(getMonsterDef('ulan_fera')).toBeDefined();
  });

  it('exibe Rei Daros e Principe Dagan no Salao de Banquetes apos derrotar a Fera', () => {
    const casteloMap = new TiledMap('castelo', casteloData as any);
    const daros = casteloMap.npcs.find(n => n.name === 'Rei Daros');
    const dagan = casteloMap.npcs.find(n => n.name === 'Príncipe Dagan');

    expect(daros).toBeDefined();
    expect(daros?.showIfFlag).toBe('fera_derrotada');
    expect(dagan).toBeDefined();
    expect(dagan?.showIfFlag).toBe('fera_derrotada');
  });

  it('possui os itens chave do Ato 1 (Pulseira Antiga e Selo Real) e sorteia o culpado do Brinde', () => {
    const pulseira = getItemDef('pulseira_antiga');
    const selo = getItemDef('selo_real');
    expect(pulseira).toBeDefined();
    expect(pulseira?.type).toBe('key');
    expect(selo).toBeDefined();
    expect(selo?.type).toBe('key');

    const culpado = gameState.flags.ensureBrindeCulpado();
    expect(['brenn', 'hald', 'vael']).toContain(culpado);
  });
});
