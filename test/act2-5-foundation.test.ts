import { describe, it, expect, beforeEach } from 'vitest';
import { MAP_REGISTRY } from '../src/data/maps';
import { getItemDef, SHOP_CATALOGS } from '../src/data/items';
import { getMonsterDef, getSpellDef, rollEncounterForTerrain } from '../src/data/monsters';
import { DialogueBox } from '../src/engine/DialogueBox';
import { CreditsScene } from '../src/scenes/CreditsScene';
import { soundManager } from '../src/engine/AudioManager';
import { TiledMap } from '../src/engine/TiledMap';
import { gameState } from '../src/state/GameState';
import cidade2Data from '../src/data/maps/cidade_2.json';
import grutaCostaData from '../src/data/maps/gruta_costa.json';
import santuarioData from '../src/data/maps/santuario.json';
import vauCinzaData from '../src/data/maps/vau_cinza.json';
import cabanaOrunData from '../src/data/maps/cabana_orun.json';
import rochedoData from '../src/data/maps/rochedo.json';
import minaVelhaData from '../src/data/maps/mina_velha.json';
import cobreAltoData from '../src/data/maps/cobre_alto.json';
import casteloData from '../src/data/maps/castelo.json';
import casteloSubsoloData from '../src/data/maps/castelo_subsolo.json';
import refugioRaizesData from '../src/data/maps/refugio_raizes.json';
import criptaRefinoData from '../src/data/maps/cripta_refino.json';
import temploCoracaoData from '../src/data/maps/templo_coracao.json';

describe('Sub-etapa 7A - Fundacao dos Atos 2 a 5', () => {
  it('registra todos os 9 novos mapas dos Atos 2 a 5 no MAP_REGISTRY', () => {
    const newMaps = [
      'gruta_costa',
      'vau_cinza',
      'cabana_orun',
      'rochedo',
      'mina_velha',
      'cobre_alto',
      'refugio_raizes',
      'cripta_refino',
      'templo_coracao',
    ];
    for (const mapId of newMaps) {
      expect(MAP_REGISTRY[mapId], `Mapa '${mapId}' deve estar registrado`).toBeDefined();
    }
  });

  it('possui todos os itens-chave, equipamentos e catalogos de loja dos Atos 2 a 5', () => {
    const keyItems = ['chave_cobre', 'pedra_eco', 'lente_olivia', 'selo_veyra', 'ervas_brejo', 'pao_pedra', 'peca_relogio', 'diario_auren'];
    for (const id of keyItems) {
      const def = getItemDef(id);
      expect(def, `Item-chave '${id}' deve existir`).toBeDefined();
      expect(def?.type).toBe('key');
    }

    expect(SHOP_CATALOGS.cidade_2.length).toBeGreaterThan(0);
    expect(SHOP_CATALOGS.vau_cinza.length).toBeGreaterThan(0);
    expect(SHOP_CATALOGS.rochedo.length).toBeGreaterThan(0);
    expect(SHOP_CATALOGS.cobre_alto.length).toBeGreaterThan(0);
    expect(SHOP_CATALOGS.refugio_raizes.length).toBeGreaterThan(0);
  });

  it('possui os monstros regionais, os 5 chefes dos Atos 2 a 5 e a magia Eco', () => {
    const bosses = ['brasca', 'daros', 'dagan', 'vael', 'auren'];
    for (const bossId of bosses) {
      const boss = getMonsterDef(bossId);
      expect(boss, `Chefe '${bossId}' deve existir`).toBeDefined();
      expect(boss?.canFlee).toBe(false);
    }

    expect(getSpellDef('eco')).toBeDefined();
    expect(rollEncounterForTerrain('sand', 44, 92)).toBeDefined();
    expect(rollEncounterForTerrain('grass', 22, 90)).toBeDefined();
    expect(rollEncounterForTerrain('mountain', 26, 24)).toBeDefined();
    expect(rollEncounterForTerrain('grass', 98, 34)).toBeDefined();
    expect(rollEncounterForTerrain('sand', 64, 112)).toBeDefined();
  });

  it('suporta escolhas morais na DialogueBox via startWithChoice', () => {
    const box = new DialogueBox();
    let chosenIdx = -1;
    box.startWithChoice('TESTE', 'Deseja poupar o inimigo?', ['Poupar', 'Executar'], (idx) => {
      chosenIdx = idx;
    });
    expect(box.isOpen()).toBe(true);
    expect(chosenIdx).toBe(-1);
  });
});

describe('Sub-etapa 7B - Fatia Vertical do Ato 2 (Porto do Sol, Gruta da Costa e Santuario)', () => {
  beforeEach(() => {
    gameState.reset();
  });

  it('possui Garo (D05), Caixote do Cais, Mestre Tavo, Iris e Brasca condicional em Porto do Sol', () => {
    const map = new TiledMap('cidade_2', cidade2Data as any);
    const garo = map.npcs.find((n) => n.name === 'Garo');
    const tavo = map.npcs.find((n) => n.name === 'Mestre Tavo');
    const iris = map.npcs.find((n) => n.name === 'Íris');
    const brasca = map.npcs.find((n) => n.name === 'Almirante Brasca');
    const caixote = map.signs.find((s) => s.title === 'CAIXOTE DO CAIS');

    expect(garo).toBeDefined();
    expect(garo?.altFlag).toBe('garo_carga_vista');
    expect(garo?.altDialogue).toContain('Cargas especiais?');
    expect(tavo?.setFlagOnTalk).toBe('tavo_investigando');
    expect(iris).toBeDefined();
    expect(brasca?.showIfFlag).toBe('brasca_poupado');
    expect(caixote?.setFlag).toBe('garo_carga_vista');
  });

  it('possui Almirante Brasca (D06) na Gruta da Costa e incrementa duvidaPontos ao poupa-lo', () => {
    const map = new TiledMap('gruta_costa', grutaCostaData as any);
    const brasca = map.npcs.find((n) => n.name === 'Almirante Brasca');
    expect(brasca).toBeDefined();
    expect(brasca?.dialogue).toContain('Eu só abro as jaulas que');
    expect(brasca?.hideIfFlag).toBe('brasca_executado');

    expect(gameState.flags.duvidaPontos).toBe(0);
    gameState.setFlag('brasca_poupado', true);
    expect(gameState.flags.duvidaPontos).toBe(1);
  });

  it('possui Sumo Sacerdote Hesper e Irma Olivia (D07) no Santuario da Luz', () => {
    const map = new TiledMap('santuario', santuarioData as any);
    const hesper = map.npcs.find((n) => n.name === 'Sumo Sacerdote Hesper');
    const olivia = map.npcs.find((n) => n.name === 'Irmã Olívia');

    expect(hesper).toBeDefined();
    expect(olivia).toBeDefined();
    expect(olivia?.dialogue).toContain('Não confie na luz que');
  });
});

describe('Sub-etapa 7C - Fatia Vertical do Ato 3 (Brumaterra, Pedrasul, Mina Velha e Cobre-Alto)', () => {
  beforeEach(() => {
    gameState.reset();
  });

  it('possui Regente Olo (D08) em Vau-Cinza e Velho Orun (D09) + bau de ervas na Cabana de Orun', () => {
    const vauMap = new TiledMap('vau_cinza', vauCinzaData as any);
    const cabanaMap = new TiledMap('cabana_orun', cabanaOrunData as any);

    const olo = vauMap.npcs.find((n) => n.name === 'Regente Olo');
    const orun = cabanaMap.npcs.find((n) => n.name === 'Velho Orun');
    const bauErvas = cabanaMap.chests.find((c) => c.item === 'ervas_brejo');

    expect(olo).toBeDefined();
    expect(olo?.dialogue).toContain('Nós não criamos a Treva.');
    expect(orun).toBeDefined();
    expect(orun?.dialogue).toContain('Ulan guardava a porta.');
    expect(bauErvas).toBeDefined();
  });

  it('possui Rainha Maren, Padeiro e bau da Carta de Vael em Rochedo, e Cativo Veyra + Engrenagem na Mina Velha', () => {
    const rochedoMap = new TiledMap('rochedo', rochedoData as any);
    const minaMap = new TiledMap('mina_velha', minaVelhaData as any);

    const maren = rochedoMap.npcs.find((n) => n.name === 'Rainha Maren');
    const padeiro = rochedoMap.npcs.find((n) => n.name === 'Padeiro de Pedrasul');
    const bauCarta = rochedoMap.chests.find((c) => c.item === 'carta_vael');
    const cativo = minaMap.npcs.find((n) => n.name === 'Cativo Veyra');
    const bauPeca = minaMap.chests.find((c) => c.item === 'peca_relogio');

    expect(maren).toBeDefined();
    expect(padeiro).toBeDefined();
    expect(bauCarta?.setFlagOnOpen).toBe('carta_tavo_achada');
    expect(cativo?.setFlagOnTalk).toBe('mina_velha_vista');
    expect(bauPeca).toBeDefined();
  });

  it('possui Rei Daros (D10) e Seu Tome em Cobre-Alto e calcula lealdade = duvida em cobre_alto_traido', () => {
    const cobreMap = new TiledMap('cobre_alto', cobreAltoData as any);
    const daros = cobreMap.npcs.find((n) => n.name === 'Rei Daros');
    const tome = cobreMap.npcs.find((n) => n.name === 'Seu Tomé');

    expect(daros).toBeDefined();
    expect(daros?.dialogue).toContain('Você abriu o meu portão!');
    expect(daros?.hideIfFlag).toBe('daros_derrotado');
    expect(tome).toBeDefined();

    gameState.setFlag('olo_ouvido', true);
    gameState.setFlag('maren_ouvida', true);
    gameState.setFlag('mina_velha_vista', true);
    gameState.setFlag('cobre_alto_traido', true);

    expect(gameState.flags.duvidaPontos).toBe(3);
    expect(gameState.getFlag('dagan_aliado')).toBe(true);
    expect(gameState.flags.lealdade).toBe('duvida');
  });
});

describe('Sub-etapa 7D - Fatia Vertical do Ato 4 (Ruptura, Refugio das Raizes e Cripta do Refino)', () => {
  beforeEach(() => {
    gameState.reset();
  });

  it('possui Mestre Tavo (D11) condicional no Castelo e transiciona lealdade para rebelde em rei_protegeu_vael', () => {
    const casteloMap = new TiledMap('castelo', casteloData as any);
    const tavo = casteloMap.npcs.find((n) => n.name === 'Mestre Tavo');

    expect(tavo).toBeDefined();
    expect(tavo?.showIfFlag).toBe('ato3_concluido');
    expect(tavo?.hideIfFlag).toBe('tavo_morto');
    expect(tavo?.dialogue).toContain('Não foi um monstro.');

    gameState.setFlag('rei_protegeu_vael', true);
    expect(gameState.flags.lealdade).toBe('rebelde');
  });

  it('possui Sael (D13) e Velho Orun no Refugio das Raizes e Príncipe Dagan condicional em Rochedo', () => {
    const refugioMap = new TiledMap('refugio_raizes', refugioRaizesData as any);
    const rochedoMap = new TiledMap('rochedo', rochedoData as any);

    const sael = refugioMap.npcs.find((n) => n.name === 'Sael');
    const orun = refugioMap.npcs.find((n) => n.name === 'Velho Orun');
    const dagan = rochedoMap.npcs.find((n) => n.name === 'Príncipe Dagan');

    expect(sael).toBeDefined();
    expect(sael?.dialogue).toContain('Você é Veyra, [NOME].');
    expect(orun).toBeDefined();
    expect(dagan).toBeDefined();
    expect(dagan?.showIfFlag).toBe('ato3_concluido');
  });

  it('possui Lorde Vael e Pim na Cripta do Refino e registra as flags da escolha de Iris', () => {
    const criptaMap = new TiledMap('cripta_refino', criptaRefinoData as any);
    const vael = criptaMap.npcs.find((n) => n.name === 'Lorde Vael');
    const pim = criptaMap.npcs.find((n) => n.name === 'Pim');

    expect(vael).toBeDefined();
    expect(vael?.hideIfFlag).toBe('vael_derrotado');
    expect(pim).toBeDefined();
    expect(pim?.dialogue).toContain('Irmã Íris só obedeceu a');

    gameState.setFlag('vael_derrotado', true);
    gameState.setFlag('iris_perdoada', true);
    expect(gameState.getFlag('vael_derrotado')).toBe(true);
    expect(gameState.getFlag('iris_perdoada')).toBe(true);
  });
});

describe('Sub-etapa 7E - Fatia Vertical do Ato 5 e Final B (Templo do Coracao e Camara do Lume)', () => {
  beforeEach(() => {
    gameState.reset();
  });

  it('possui Velho Orun, bau do Selo de Veyra e mural de Aneth no Templo do Coracao', () => {
    const temploMap = new TiledMap('templo_coracao', temploCoracaoData as any);
    const orun = temploMap.npcs.find((n) => n.name === 'Velho Orun');
    const bauSelo = temploMap.chests.find((c) => c.item === 'selo_veyra');

    expect(orun).toBeDefined();
    expect(bauSelo).toBeDefined();
    expect(bauSelo?.setFlagOnOpen).toBe('selo_veyra_obtido');
  });

  it('possui Diario de Auren e Rei Auren (chefe final) na Camara do Lume (castelo_subsolo)', () => {
    const subsoloMap = new TiledMap('castelo_subsolo', casteloSubsoloData as any);
    const diarioSign = subsoloMap.signs.find((s) => s.setFlag === 'diario_auren_lido');
    const aurenBoss = subsoloMap.npcs.find((n) => n.name === 'Rei Auren');

    expect(diarioSign).toBeDefined();
    expect(aurenBoss).toBeDefined();
    expect(aurenBoss?.showIfFlag).toBe('selo_veyra_obtido');
    expect(aurenBoss?.hideIfFlag).toBe('auren_derrotado');

    gameState.setFlag('auren_derrotado', true);
    gameState.setFlag('final_b_coroa_vazia', true);
    expect(gameState.getFlag('final_b_coroa_vazia')).toBe(true);
  });
});

describe('Etapa 8 - Save/Load, Montanhas Cinzas (high_mountain) e Progressao Geografica por Ato', () => {
  beforeEach(() => {
    gameState.reset();
    gameState.clearSaveData();
  });

  it('salva e carrega corretamente o estado completo do heroi, flags e posicao no mapa', () => {
    expect(gameState.hasSaveData()).toBe(false);

    gameState.setHeroName('Alden');
    gameState.addGold(125);
    gameState.addItem('chave_cobre', 1);
    gameState.setFlag('rei_missao_recebida', true);
    gameState.setFlag('brasca_poupado', true);
    gameState.saveGame('cidade_2', 14, 10, 'left');

    expect(gameState.hasSaveData()).toBe(true);

    // Reseta o estado em memória e restaura a partir do save
    gameState.reset();
    expect(gameState.name).toBe('Herói');
    expect(gameState.getFlag('rei_missao_recebida')).toBe(false);

    const loaded = gameState.loadGame();
    expect(loaded).toBe(true);
    expect(gameState.name).toBe('Alden');
    expect(gameState.gold).toBe(175);
    expect(gameState.getItemQuantity('chave_cobre')).toBe(1);
    expect(gameState.getFlag('rei_missao_recebida')).toBe(true);
    expect(gameState.getFlag('brasca_poupado')).toBe(true);
    expect(gameState.flags.duvidaPontos).toBe(1);
    expect(gameState.savedMapId).toBe('cidade_2');
    expect(gameState.savedTileX).toBe(14);
    expect(gameState.savedTileY).toBe(10);
    expect(gameState.savedDir).toBe('left');
  });

  it('isola o Vale Central no Ato 1 usando cordilheiras cinzas (high_mountain) e rios, impedindo acesso prematuro aos Atos 2-5', () => {
    const owMap = new TiledMap('overworld', MAP_REGISTRY['overworld'].json);

    // Aplica os mesmos bloqueios iniciais do Ato 1 usados em MapScene.loadMap('overworld')
    owMap.setTileAt(48, 68, 'water');
    owMap.setTileAt(48, 69, 'water');
    owMap.setTileAt(48, 70, 'water');
    owMap.setTileAt(82, 41, 'high_mountain');
    owMap.setTileAt(82, 42, 'high_mountain');
    owMap.setTileAt(82, 43, 'high_mountain');
    owMap.setTileAt(30, 68, 'water');
    owMap.setTileAt(30, 69, 'water');
    owMap.setTileAt(30, 70, 'water');
    owMap.setTileAt(36, 37, 'high_mountain');
    owMap.setTileAt(36, 38, 'high_mountain');
    owMap.setTileAt(36, 39, 'high_mountain');
    owMap.setTileAt(58, 28, 'water');
    owMap.setTileAt(59, 28, 'water');
    owMap.setTileAt(60, 28, 'water');
    owMap.setTileAt(25, 56, 'high_mountain');
    owMap.setTileAt(26, 56, 'high_mountain');
    owMap.setTileAt(27, 56, 'high_mountain');
    owMap.setTileAt(64, 102, 'water');
    owMap.setTileAt(64, 103, 'water');
    owMap.setTileAt(64, 104, 'water');

    // Executa BFS a partir de (36, 50) no Ato 1
    const visited = new Set<string>();
    const queue: Array<{ x: number; y: number }> = [{ x: 36, y: 50 }];
    visited.add('36,50');
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
        if (nx >= 0 && nx < owMap.width && ny >= 0 && ny < owMap.height && !visited.has(key)) {
          if (!owMap.isSolid(nx, ny)) {
            visited.add(key);
            queue.push({ x: nx, y: ny });
          }
        }
      }
    }

    const canReachWarp = (warpName: string) => {
      const w = owMap.getWarpByName(warpName);
      return w ? visited.has(`${w.tileX},${w.tileY}`) : false;
    };

    // No Ato 1, o jogador DEVE alcançar o Castelo, Vila de Alvorada e Caverna das Sombras
    expect(canReachWarp('castelo')).toBe(true);
    expect(canReachWarp('cidade_1')).toBe(true);
    expect(canReachWarp('caverna')).toBe(true);

    // No Ato 1, o jogador NÃO PODE alcançar nenhuma região dos Atos 2, 3, 4 ou 5
    expect(canReachWarp('cidade_2')).toBe(false);
    expect(canReachWarp('gruta_costa')).toBe(false);
    expect(canReachWarp('santuario')).toBe(false);
    expect(canReachWarp('vau_cinza')).toBe(false);
    expect(canReachWarp('cabana_orun')).toBe(false);
    expect(canReachWarp('rochedo')).toBe(false);
    expect(canReachWarp('mina_velha')).toBe(false);
    expect(canReachWarp('cobre_alto')).toBe(false);
    expect(canReachWarp('refugio_raizes')).toBe(false);
    expect(canReachWarp('templo_coracao')).toBe(false);
  });
});

describe('Etapa 9 - Sistema de Audio 8-Bit (BGM e SFX estilo Square Enix NES)', () => {
  it('gerencia trilhas BGM, fanfarras e efeitos sonoros com seguranca', () => {
    soundManager.playBgm('title');
    expect(soundManager.getCurrentBgm()).toBe('title');

    soundManager.playBgm('overworld');
    expect(soundManager.getCurrentBgm()).toBe('overworld');

    // Testa todos os efeitos sonoros e fanfarras principais
    const allSfx = [
      'cursor',
      'confirm',
      'cancel',
      'error',
      'attack',
      'crit',
      'hit',
      'magic',
      'heal',
      'encounter',
      'chest',
      'victory',
      'level_up',
      'defeat',
      'inn',
      'coins',
      'stairs',
      'door',
    ] as const;

    for (const sfx of allSfx) {
      expect(() => soundManager.playSfx(sfx)).not.toThrow();
    }

    expect(soundManager.isMuted()).toBe(false);
    expect(soundManager.toggleMute()).toBe(true);
    expect(soundManager.isMuted()).toBe(true);
    expect(soundManager.toggleMute()).toBe(false);

    soundManager.stopBgm();
    expect(soundManager.getCurrentBgm()).toBeNull();
  });
});

describe('Etapa 10 - Encerramento Formal, CreditsScene e Marcador de Jogo Concluido', () => {
  it('instancia a CreditsScene e registra o estado de jogo concluido com estrela', () => {
    gameState.reset();
    expect(gameState.isGameCompleted()).toBe(false);

    gameState.setFlag('final_b_coroa_vazia', true);
    gameState.setFlag('jogo_concluido', true);
    expect(gameState.isGameCompleted()).toBe(true);

    const dummySceneManager = { fadeTransition: () => {}, push: () => {}, pop: () => {} } as any;
    const dummyInput = { isDown: () => false, wasPressed: () => false } as any;
    const credits = new CreditsScene(dummySceneManager, dummyInput);
    expect(credits.name).toBe('CreditsScene');
  });
});

describe('Etapa 11 - Sistema de Ciclo Dia / Noite & Missoes Noturnas', () => {
  it('alterna corretamente entre dia e noite, persistindo no save/load', () => {
    gameState.reset();
    expect(gameState.isNight()).toBe(false);
    expect(gameState.timeOfDay).toBe('day');

    gameState.setTimeOfDay('night');
    expect(gameState.isNight()).toBe(true);
    expect(gameState.timeOfDay).toBe('night');

    gameState.saveGame();
    gameState.reset();
    expect(gameState.isNight()).toBe(false);

    gameState.loadGame();
    expect(gameState.isNight()).toBe(true);
    expect(gameState.timeOfDay).toBe('night');

    gameState.setTimeOfDay('day');
    expect(gameState.isNight()).toBe(false);
  });
});



