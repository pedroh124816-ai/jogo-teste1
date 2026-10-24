import { Scene } from '../engine/Scene';
import { Renderer } from '../engine/Renderer';
import { Input } from '../engine/Input';
import { SceneManager } from '../engine/SceneManager';
import { Camera } from '../engine/Camera';
import { TiledMap } from '../engine/TiledMap';
import { Player, ISolidMap } from '../entities/Player';
import { getVehicleSprite } from '../assets/vehicleGraphics';
import { NPC } from '../entities/NPC';
import { DialogueBox } from '../engine/DialogueBox';
import { AssetManager } from '../assets/AssetManager';
import { CONFIG } from '../config';
import { NES_COLORS } from '../engine/Palette';
import { MenuScene } from './MenuScene';
import { BattleScene } from './BattleScene';
import { WorldMapScene } from './WorldMapScene';
import { ShopScene } from './ShopScene';
import { InnScene } from './InnScene';
import { CreditsScene } from './CreditsScene';
import { VignetteScene } from './VignetteScene';
import { Direction } from '../assets/heroGraphics';
import { MAP_REGISTRY } from '../data/maps';
import { gameState } from '../state/GameState';
import { rollEncounterForTerrain, getMonsterDef } from '../data/monsters';
import { soundManager, BgmTrackId } from '../engine/AudioManager';

type WarpState = 'none' | 'fade_out' | 'fade_in';

interface PendingWarp {
  targetMap: string;
  targetWarp?: string;
  targetX?: number;
  targetY?: number;
  targetDir?: Direction;
}

export class MapScene implements Scene {
  public readonly name = 'MapScene';
  public readonly isTransparent = false;

  private sceneManager: SceneManager;
  private input: Input;
  private assetManager: AssetManager;

  private camera: Camera;
  private currentMapId = 'overworld';
  private currentMap!: TiledMap;
  private npcs: NPC[] = [];
  private player: Player;

  private dialogueBox: DialogueBox;

  // Estado de transição entre mapas (Warp com Fade)
  private warpState: WarpState = 'none';
  private warpProgress = 0;
  private quakeTimer = 0;

  /** Colisão consciente do meio de transporte (a pé, de barco ou de balão). */
  private readonly transportSolidMap: ISolidMap = {
    isSolid: (x: number, y: number) => this.isSolidForTransport(x, y),
  };
  private pendingWarp: PendingWarp | null = null;

  private showDebug: boolean = CONFIG.debug.overlayOnStart;
  private locationBannerTitle = '';
  private locationBannerTimer = 180; // Some após ~3 segundos

  constructor(
    sceneManager: SceneManager,
    input: Input,
    assetManager?: AssetManager,
    initialMapId: string = 'overworld',
    initialX: number = CONFIG.player.startTile.x,
    initialY: number = CONFIG.player.startTile.y,
    initialDir: Direction = 'down',
    autoStartRoyalAudience = false
  ) {
    this.sceneManager = sceneManager;
    this.input = input;
    this.assetManager = assetManager ?? new AssetManager();

    this.camera = new Camera();
    this.dialogueBox = new DialogueBox();
    this.player = new Player(initialX, initialY);

    // Carrega o mapa inicial
    this.loadMap(initialMapId, initialX, initialY, initialDir);

    if (autoStartRoyalAudience && initialMapId === 'castelo') {
      const rei = this.npcs.find((n) => n.name === 'Rei Auren');
      if (rei) {
        this.interactWithNpcEntity(rei);
      }
    }
  }

  public setAssetManager(assetManager: AssetManager): void {
    this.assetManager = assetManager;
  }

  /**
   * Carrega um mapa a partir do registro automático em src/data/maps/,
   * posiciona câmera, carrega entidades, baús abertos e atualiza dimensões.
   */
  public loadMap(
    mapId: string,
    spawnTileX?: number,
    spawnTileY?: number,
    spawnDir?: Direction,
    destWarpName?: string
  ): void {
    const entry = MAP_REGISTRY[mapId];
    if (!entry) {
      throw new Error(`Mapa '${mapId}' não encontrado no registro automático de mapas.`);
    }

    this.currentMapId = mapId;
    this.currentMap = new TiledMap(mapId, entry.json);

    // Atualiza limites da câmera
    this.camera.setMapBounds(this.currentMap.width, this.currentMap.height);

    // Carrega NPCs cadastrados no JSON do mapa
    this.npcs = this.currentMap.getNpcDefs().map((def) => {
      return new NPC({
        id: def.id,
        name: def.name,
        spriteId: def.spriteId,
        tileX: def.tileX,
        tileY: def.tileY,
        direction: def.direction,
        dialogue: def.dialogue,
        showIfFlag: def.showIfFlag,
        hideIfFlag: def.hideIfFlag,
        setFlagOnTalk: def.setFlagOnTalk,
        altFlag: def.altFlag,
        altDialogue: def.altDialogue,
      });
    });

    // Se houver baús já abertos neste mapa, atualiza visualmente para 'chest_open'
    for (const chest of this.currentMap.getChests()) {
      if (gameState.openedChests.has(chest.id)) {
        this.currentMap.setTileAt(chest.tileX, chest.tileY, 'chest_open');
      }
    }

    // Alterações dinâmicas de terreno no overworld conforme progressão de Atos
    if (mapId === 'overworld') {
      // Ato 2: Ponte do Sul (48, 68..70) abre após concluir o Ato 1 (Selo Real)
      if (!gameState.getFlag('ato1_concluido')) {
        this.currentMap.setTileAt(48, 68, 'water');
        this.currentMap.setTileAt(48, 69, 'water');
        this.currentMap.setTileAt(48, 70, 'water');
      }

      // Passo do Santuário (82, 39..45 e 83, 40..45) desaba no terremoto do Ato 1
      if (!gameState.getFlag('terremoto_visto')) {
        this.currentMap.setTileAt(82, 39, 'high_mountain');
        for (let y = 40; y <= 45; y++) {
          this.currentMap.setTileAt(82, y, 'high_mountain');
          this.currentMap.setTileAt(83, y, 'high_mountain');
        }
      } else {
        // Desmoronamento abre a passagem com trilha de terra e rochas caídas
        this.currentMap.setTileAt(82, 39, 'path');
        this.currentMap.setTileAt(83, 39, 'grass');
        for (let y = 40; y <= 45; y++) {
          this.currentMap.setTileAt(82, y, 'path');
          this.currentMap.setTileAt(83, y, 'path');
        }
      }

      // Ato 3: Ponte do Pântano (30, 68..70) e Passo de Pedrasul (36, 37..39) só abrem após concluir o Ato 2
      if (!gameState.getFlag('ato2_concluido')) {
        this.currentMap.setTileAt(30, 68, 'water');
        this.currentMap.setTileAt(30, 69, 'water');
        this.currentMap.setTileAt(30, 70, 'water');
        this.currentMap.setTileAt(36, 37, 'high_mountain');
        this.currentMap.setTileAt(36, 38, 'high_mountain');
        this.currentMap.setTileAt(36, 39, 'high_mountain');
      }

      // Cobre-Alto: Ponte de Cobre (58..60, 28) exige a Chave de Cobre do Rei Auren e cai após derrotar Daros
      if (!gameState.getFlag('chave_cobre_recebida') || gameState.getFlag('ponte_destruida')) {
        this.currentMap.setTileAt(58, 28, 'water');
        this.currentMap.setTileAt(59, 28, 'water');
        this.currentMap.setTileAt(60, 28, 'water');
      }

      // Ato 4: Trilha secreta do Refúgio das Raízes (25..27, 56) só abre após a ruptura no Castelo
      if (!gameState.getFlag('refugio_aberto')) {
        this.currentMap.setTileAt(25, 56, 'high_mountain');
        this.currentMap.setTileAt(26, 56, 'high_mountain');
        this.currentMap.setTileAt(27, 56, 'high_mountain');
      }

      // Ato 5: o mar ao redor da Ilha Veyra só é atravessável de barco (recife submerso permanece fechado)
      this.currentMap.setTileAt(64, 102, 'water');
      this.currentMap.setTileAt(64, 103, 'water');
      this.currentMap.setTileAt(64, 104, 'water');
    }
    if (mapId !== 'overworld') {
      gameState.transport = 'foot';
    }

    // Se foi especificado um warp de destino por id/nome, posiciona exatamente nele
    if (destWarpName) {
      if (mapId === 'overworld' && destWarpName === 'cobre_alto' && gameState.getFlag('ponte_destruida')) {
        this.player.setTilePosition(57, 28, 'left');
      } else {
        const destWarp = this.currentMap.getWarpByName(destWarpName);
        if (destWarp) {
          this.player.setTilePosition(destWarp.tileX, destWarp.tileY, destWarp.arriveDir);
        } else if (spawnTileX !== undefined && spawnTileY !== undefined) {
          this.player.setTilePosition(spawnTileX, spawnTileY, spawnDir);
        }
      }
    } else if (spawnTileX !== undefined && spawnTileY !== undefined) {
      this.player.setTilePosition(spawnTileX, spawnTileY, spawnDir);
    }

    // Sincroniza localização atual do herói no GameState para o sistema de Save/Load
    gameState.updateLocation(
      this.currentMapId,
      this.player.tileX,
      this.player.tileY,
      this.player.direction
    );

    // Centraliza a câmera no herói
    this.camera.follow(this.player.pixelX, this.player.pixelY);

    // Controle de iluminação narrativa (Dia / Noite por evento)
    if (mapId === 'cobre_alto' && !gameState.getFlag('ato3_concluido')) {
      gameState.setTimeOfDay('night');
    } else if (mapId === 'overworld' && destWarpName === 'cobre_alto' && gameState.getFlag('ponte_destruida')) {
      gameState.setTimeOfDay('day');
    }

    // Banner de localização
    this.locationBannerTitle = this.currentMap.title;
    this.locationBannerTimer = 180;
    this.syncMapBgm();
  }

  private syncMapBgm(): void {
    const musicProp = this.currentMap?.music || 'overworld';
    let track: BgmTrackId = 'overworld';
    if (musicProp === 'castle' || this.currentMap?.mapType === 'castelo') track = 'castle';
    else if (musicProp === 'town' || this.currentMap?.mapType === 'cidade' || this.currentMap?.mapType === 'interior') track = 'town';
    else if (musicProp === 'cave' || this.currentMap?.mapType === 'caverna') track = 'cave';
    else if (musicProp === 'shrine' || this.currentMapId === 'santuario' || this.currentMapId === 'refugio_raizes' || this.currentMapId === 'templo_coracao') track = 'shrine';
    soundManager.playBgm(track);
  }

  public enter(): void {
    this.camera.follow(this.player.pixelX, this.player.pixelY);
    this.syncMapBgm();
  }

  private interactWithNpcEntity(npc: NPC): void {
    npc.faceHero(this.player.tileX, this.player.tileY);

    const shopNpcNames = [
      'Comerciante',
      'Mercador do Porto',
      'Mercador de Vau',
      'Mercador de Rochedo',
      'Mercador de Cobre',
      'Artesã Veyra',
    ];
    if (this.currentMapId === 'cidade_1_loja' || shopNpcNames.includes(npc.name)) {
      npc.resetDirection();
      this.sceneManager.push(new ShopScene(this.sceneManager, this.input, this.currentMapId));
      return;
    }

    const innNpcNames = [
      'Hospedeiro',
      'Estalajadeira do Porto',
      'Estalajadeira de Vau',
      'Estalajadeira de Rochedo',
      'Guardiã do Repouso',
    ];
    if (this.currentMapId === 'cidade_1_estalagem' || innNpcNames.includes(npc.name)) {
      npc.resetDirection();
      this.sceneManager.push(
        new InnScene(this.sceneManager, this.input, 10, {
          mapId: this.currentMapId,
          tileX: this.player.tileX,
          tileY: this.player.tileY,
          dir: this.player.direction,
        })
      );
      return;
    }

    // 0.85 Missão Secundária Noturna de Alvorada: Jardineira Flora e o Jardim do Luar
    if (npc.name === 'Jardineira Flora') {
      if (gameState.getFlag('missao_jardim_luar')) {
        this.dialogueBox.start(
          npc.name,
          'Veja como a Flor do Luar\nresplandece com pétalas\nazuladas, [NOME]!\n---\nGraças a você, nosso jardim\nestá protegido da escuridão!',
          () => npc.resetDirection()
        );
        return;
      }

      if (!gameState.isNight()) {
        this.dialogueBox.start(
          npc.name,
          'Olá, viajante! Eu cuido das\nflores azuis do Jardim do Luar.\n---\nNossas flores são mágicas e só\ndesabrocham sob a lua!\n---\nDescanse na Estalagem e volte\naqui à NOITE se quiser vê-las\nabertas sob o luar!',
          () => npc.resetDirection()
        );
        return;
      }

      // Durante a NOITE
      this.dialogueBox.start(
        npc.name,
        'Socorro, viajante! Que bom\nque você apareceu sob a lua!\n---\nUma Praga das Sombras surgiu\nno canteiro sagrado ao lado e\nquer devorar a Flor do Luar!\n---\nAjude-me a enfrentá-la antes\nque a flor murche!',
        () => {
          npc.resetDirection();
          const monster = getMonsterDef('gosma_azul') || getMonsterDef('gosma_cinza')!;
          this.sceneManager.push(
            new BattleScene(
              this.sceneManager,
              this.input,
              monster,
              this.assetManager,
              () => this.handleHeroDefeat(),
              () => {
                gameState.setFlag('missao_jardim_luar', true);
                gameState.addGold(50);
                gameState.addItem('tonico_brasa', 1);
                soundManager.playSfx('victory');
                this.dialogueBox.start(
                  'Jardineira Flora',
                  'Você venceu a criatura das\nsombras! A Flor do Luar\ndesabrochou em toda a glória!\n---\nTome um Tônico de Brasa e\n50 Moedas de Ouro como gratidão\nda vila de Alvorada!'
                );
              }
            )
          );
        }
      );
      return;
    }

    // 0.86 Moradores do Distrito Leste de Alvorada
    if (npc.name === 'Boticário Elor') {
      if (!gameState.getFlag('elor_conhecido')) {
        gameState.setFlag('elor_conhecido', true);
        gameState.addItem('erva_cura', 1);
        soundManager.playSfx('chest');
        this.dialogueBox.start(
          npc.name,
          'Bem-vindo à minha botica!\nPreparo remédios com as ervas\ncolhidas nos campos de Alvorada.\n---\nTome esta Erva de Cura de\ncortesia para proteger sua vida\npelos caminhos do vale!',
          () => npc.resetDirection()
        );
        return;
      }
      this.dialogueBox.start(
        npc.name,
        'Lembre-se: ervas frescas e\num bom descanso na estalagem\nsalvam qualquer aventureiro!',
        () => npc.resetDirection()
      );
      return;
    }

    if (npc.name === 'Velho Bento') {
      this.dialogueBox.start(
        npc.name,
        'Saudações, jovem guerreiro!\nServi trinta anos na guarda real\nde Luminário.\n---\nUm conselho de veterano: monstros\nnoturnos são mais agressivos, mas\nrendem o dobro de glória!\n---\nSe ferir-se, não hesite em usar\nsuas magias ou correr!',
        () => npc.resetDirection()
      );
      return;
    }

    // 0.9 Missão secundária: Barqueiro Tião (Porto do Sol) — carona até a costa de Vau-Cinza
    if (npc.name === 'Barqueiro Tião') {
      if (!gameState.getFlag('barqueiro_pedido')) {
        this.dialogueBox.start(
          npc.name,
          'Sou o Tião, barqueiro do\ncais. Minha filha Lia está\ncom febre há dias...\n---\nTraga-me 2 Ervas de Cura\ne eu lhe devo um favor,\nviajante!',
          () => {
            gameState.setFlag('barqueiro_pedido', true);
            npc.resetDirection();
          }
        );
        return;
      }
      if (!gameState.getFlag('barqueiro_ajudado')) {
        if (gameState.getItemQuantity('erva_cura') >= 2) {
          this.dialogueBox.start(
            npc.name,
            'Ervas de Cura! Que os\nventos lhe sejam gentis!\n---\nLia vai melhorar. Tome\n40 de ouro pelo trabalho.\nEu levo você de barco\nquando o mar acalmar!',
            () => {
              gameState.removeItem('erva_cura', 2);
              gameState.addGold(40);
              gameState.setFlag('barqueiro_ajudado', true);
              soundManager.playSfx('coins');
              npc.resetDirection();
            }
          );
        } else {
          this.dialogueBox.start(
            npc.name,
            'Preciso de 2 Ervas de\nCura para a pequena Lia.\nElas vendem na cidade!',
            () => npc.resetDirection()
          );
        }
        return;
      }
      if (!gameState.getFlag('ato2_concluido')) {
        this.dialogueBox.start(
          npc.name,
          'O mar a oeste está\nrevolto, [NOME]. Volte quando\no Rei liberar as fronteiras\ne eu levo você de barco!',
          () => npc.resetDirection()
        );
        return;
      }
      this.dialogueBox.startWithChoice(
        npc.name,
        'O mar acalmou! Posso levar\nvocê pela costa até as\nterras de Vau-Cinza. Vamos?',
        ['Zarpar', 'Ficar'],
        (choiceIdx) => {
          npc.resetDirection();
          if (choiceIdx === 0) {
            this.triggerWarp({
              targetMap: 'overworld',
              targetX: 22,
              targetY: 91,
              targetDir: 'up',
            });
          }
        }
      );
      return;
    }

    // 0.91 Missão Secundária Noturna de Porto do Sol: O Farol Apagado
    if (npc.name === 'Faroleiro Bartô') {
      if (gameState.getFlag('farol_reaceso')) {
        this.dialogueBox.start(
          npc.name,
          'A chama do Farol está firme\ne reluzente sobre a baía!\n---\nOs marinheiros e caravelas\nestão a salvo da escuridão!\nObrigado pelo socorro, [NOME]!',
          () => npc.resetDirection()
        );
        return;
      }

      if (!gameState.isNight()) {
        this.dialogueBox.start(
          npc.name,
          'Olá, aventureiro! Mantenho o\nFarol do Sol preparado para guiar\nos navios nas noites de bruma.\n---\nQuando a noite cai, a cerração\ndo mar torna os recifes traiçoeiros!',
          () => npc.resetDirection()
        );
        return;
      }

      // Durante a NOITE com farol apagado
      if (gameState.getItemQuantity('tocha') > 0) {
        this.dialogueBox.start(
          npc.name,
          'Céus! Uma rajada de vento\napagou a chama do Farol!\n---\nVocê tem uma Tocha aí!\nAjude-me a reacender o braseiro!',
          () => {
            gameState.removeItem('tocha', 1);
            gameState.setFlag('farol_reaceso', true);
            gameState.addGold(60);
            soundManager.playSfx('magic');
            npc.resetDirection();
            this.dialogueBox.start(
              'Faroleiro Bartô',
              'O braseiro arde em glória!\nA luz volta a rasgar a cerração\nda baía do Porto do Sol!\n---\nTome 60 Moedas de Ouro pelo\nseu auxílio valoroso, [NOME]!'
            );
          }
        );
        return;
      }

      this.dialogueBox.start(
        npc.name,
        'Céus! Uma rajada de vento\napagou a chama do Farol!\n---\nPreciso de uma Tocha para\nreacender o braseiro antes\nque algum navio colida!\n---\nVocê pode comprar Tochas com o\nmercador ou revistar barris!',
        () => npc.resetDirection()
      );
      return;
    }

    // 0.95 Cadeia secundária do Balão: Zéfiro, o Inventor (Porto do Sol)
    if (npc.name === 'Zéfiro, o Inventor') {
      const say = (text: string, after?: () => void) =>
        this.dialogueBox.start(npc.name, text, () => {
          npc.resetDirection();
          if (after) after();
        });

      if (gameState.getFlag('balao_obtido')) {
        say('O balão está ancorado a\nleste do cais. Pise nele e\nvoe sobre as montanhas!\n---\nPouse com Z em terreno\nlivre. Boa viagem, [NOME]!');
        return;
      }

      if (!gameState.getFlag('balao_missao_pena')) {
        say(
          'Sou Zéfiro! Sonho em voar\nsobre as montanhas num\nbalão de seda e vapor.\n---\nPreciso de 3 Penas de\nVento para a vela. Os\ncorvos manchados as soltam!',
          () => gameState.setFlag('balao_missao_pena', true)
        );
        return;
      }

      if (!gameState.getFlag('balao_pena_ok')) {
        if (gameState.getItemQuantity('pena_vento') >= 3) {
          say(
            'Que penas leves! Perfeito.\n---\nAgora o vapor: só à NOITE\na maré solta um brilho no\nfim do cais ao sul.\n---\nEnche este frasco lá e\ntraga-o de volta!',
            () => {
              gameState.removeItem('pena_vento', 3);
              gameState.setFlag('balao_pena_ok', true);
              gameState.setFlag('balao_missao_vapor', true);
              soundManager.playSfx('confirm');
            }
          );
        } else {
          say('Ainda faltam Penas de Vento.\nPreciso de 3, [NOME]. Os\ncorvos manchados as soltam!');
        }
        return;
      }

      if (!gameState.getFlag('balao_vapor_ok')) {
        if (gameState.getItemQuantity('frasco_vapor') > 0) {
          say(
            'O Vapor da Maré! Ele vai\ninflar o balão.\n---\nFalta o cobre das engrenagens:\nme traga 150 moedas de ouro\ne o balão será seu!',
            () => {
              gameState.removeItem('frasco_vapor', 1);
              gameState.setFlag('balao_vapor_ok', true);
              soundManager.playSfx('confirm');
            }
          );
        } else {
          say('O vapor só sobe à NOITE,\nno fim do cais ao sul.\nDescanse na Estalagem e\nespere a maré, [NOME]!');
        }
        return;
      }

      if (gameState.gold >= 150) {
        say(
          'Cobre suficiente! Tudo\npronto!\n---\nO balão está ancorado a\nleste do cais. Pise nele,\ne pouse com Z em terreno\nlivre, [NOME]!',
          () => {
            gameState.spendGold(150);
            gameState.setFlag('balao_obtido', true);
            gameState.balloonPos = { x: 47, y: 94 };
            soundManager.playSfx('victory');
          }
        );
      } else {
        say('Faltam moedas para o cobre\nda engrenagem: 150 de ouro,\n[NOME]. Volte quando tiver!');
      }
      return;
    }

    // 0.98 Desafio do Santuário Celeste: Guardião Celeste (Ilha Secreta do Balão)
    if (npc.name === 'Guardião Celeste') {
      if (gameState.getFlag('guardiao_celeste_derrotado')) {
        this.dialogueBox.start(
          npc.name,
          'A luz da Espada Solar agora\nguia os seus passos, Campeão\ndos Céus!\n---\nQue o calor do Grande Lume\nilumine seus caminhos contra\na escuridão!',
          () => npc.resetDirection()
        );
        return;
      }

      this.dialogueBox.start(
        npc.name,
        'Viajante dos céus... Há séculos\nnenhum mortal pisa neste solo.\n---\nSe busca a lendária Espada Solar\ndos Antigos, prove sua honra\ne coragem em combate!',
        () => {
          npc.resetDirection();
          const guardianDef = getMonsterDef('guardiao_espectral') || getMonsterDef('ulan_fera')!;
          this.sceneManager.push(
            new BattleScene(
              this.sceneManager,
              this.input,
              guardianDef,
              this.assetManager,
              () => this.handleHeroDefeat(),
              () => {
                gameState.setFlag('guardiao_celeste_derrotado', true);
                soundManager.playSfx('victory');
                this.dialogueBox.start(
                  'Guardião Celeste',
                  'Incrível! Sua lâmina pulsa com\na verdadeira determinação do Sol!\n---\nO selo do Altar Celeste foi\ndesfeito. Abrace seu destino e\nreclame a Espada Solar!'
                );
              }
            )
          );
        }
      );
      return;
    }

    // 1. Chefe do Ato 1: Ulan, a Fera (Caverna B2)
    if (npc.name === 'Ulan, a Fera') {
      const introText = npc.getActiveDialogue();
      this.dialogueBox.start(npc.name, introText, () => {
        npc.resetDirection();
        const ulanDef = getMonsterDef('ulan_fera')!;
        this.sceneManager.push(
          new BattleScene(
            this.sceneManager,
            this.input,
            ulanDef,
            this.assetManager,
            () => this.handleHeroDefeat(),
            () => {
              gameState.setFlag('fera_derrotada', true);
              gameState.setFlag('pulseira_ulan_vista', true);
              gameState.addItem('pulseira_antiga', 1);
              const vignette = new VignetteScene(
                this.sceneManager,
                this.input,
                'ulan_ultimo_suspiro',
                'Ulan, o Guardião',
                [
                  '...Aneth?\nPerdoe-me...',
                  'Não pude guardar a porta...\nO lume me consumiu...',
                  'No pulso da fera caída brilha\numa Pulseira Antiga com o\nsímbolo do seu Medalhão!',
                  'Volte ao Castelo Real e\nrelate tudo ao Rei Auren.',
                ],
                () => {
                  this.sceneManager.pop();
                }
              );
              this.sceneManager.push(vignette);
            }
          )
        );
      });
      return;
    }

    // 1.05 Investigação Noturna no Porto do Sol (Ato 2)
    if (npc.name === 'Mestre Tavo' && this.currentMapId === 'cidade_2') {
      gameState.setFlag('tavo_investigando', true);
      if (!gameState.isNight() && !gameState.getFlag('garo_carga_vista')) {
        this.dialogueBox.start(
          npc.name,
          'Bom ver você, [NOME]!\nGaro esconde os caixotes\nde dia com guardas reais.\n---\nVá até a Estalagem e\nespere a NOITE para invadir\no cais sem ser visto!',
          () => npc.resetDirection()
        );
        return;
      }
      if (gameState.isNight() && !gameState.getFlag('garo_carga_vista')) {
        this.dialogueBox.start(
          npc.name,
          'A noite caiu no porto!\nOs guardas se recolheram.\nVá agora investigar o cais\nao sul sem ser visto!',
          () => npc.resetDirection()
        );
        return;
      }
    }

    // 1.1 Duelo do Ato 2: Almirante Brasca na Gruta da Costa
    if (npc.name === 'Almirante Brasca' && this.currentMapId === 'gruta_costa') {
      if (gameState.getFlag('brasca_poupado')) {
        this.dialogueBox.start(
          npc.name,
          'Nos veremos no cais do\nPorto do Sol, [NOME].\nVá ao Santuário da Luz!',
          () => npc.resetDirection()
        );
        return;
      }

      this.dialogueBox.start(
        npc.name,
        'Eu só abro as jaulas que\no seu Rei fecha.\nMate-me, se tiver coragem.',
        () => {
          npc.resetDirection();
          const brascaDef = getMonsterDef('brasca')!;
          this.sceneManager.push(
            new BattleScene(
              this.sceneManager,
              this.input,
              brascaDef,
              this.assetManager,
              () => this.handleHeroDefeat(),
              () => {
                this.dialogueBox.startWithChoice(
                  'ALMIRANTE BRASCA',
                  'Brasca cai de joelhos,\nferido. O que você fará\ncom o rebelde?',
                  ['Poupar', 'Executar'],
                  (choiceIdx) => {
                    if (choiceIdx === 0) {
                      gameState.setFlag('brasca_poupado', true);
                      this.dialogueBox.start(
                        'Almirante Brasca',
                        'Você guarda a espada.\nBrasca promete ajudá-lo\nno Porto do Sol!\n---\nAgora leve seu Medalhão\nao Santuário da Luz!'
                      );
                    } else {
                      gameState.setFlag('brasca_executado', true);
                      this.dialogueBox.start(
                        'GRUTA DA COSTA',
                        'Você cumpre a ordem real.\nO mar leva o silêncio da\ngruta. Vá ao Santuário!'
                      );
                    }
                  }
                );
              }
            )
          );
        }
      );
      return;
    }

    // 1.2 Santuário da Luz (Ato 2): Sumo Sacerdote Hesper e Irmã Olívia
    if (npc.name === 'Sumo Sacerdote Hesper' && this.currentMapId === 'santuario') {
      this.dialogueBox.start(
        npc.name,
        'Aproxime o Medalhão do\naltar sagrado, [NOME]...\n---\nO Medalhão brilha forte!\nHesper empalidece ao ver\no símbolo de Veyra!\n---\n"Esconda isso, herói!\nNinguém deve ver esse\nsinal antigo!"',
        () => {
          gameState.setFlag('medalhao_brilhou', true);
          gameState.setFlag('hesper_viu_medalhao', true);
          npc.resetDirection();
        }
      );
      return;
    }

    if (npc.name === 'Irmã Olívia' && this.currentMapId === 'santuario') {
      if (
        (gameState.getFlag('rei_protegeu_vael') || gameState.getFlag('origem_revelada')) &&
        !gameState.getFlag('lente_olivia_obtida')
      ) {
        this.dialogueBox.start(
          npc.name,
          'Tome a Lente da Verdade.\nEla revela a aura de\nquem consome lume humano!\n---\nUse a Pedra do Eco no\naltar ao norte para descer\nà Cripta do Refino!',
          () => {
            gameState.setFlag('lente_olivia_obtida', true);
            if (gameState.getItemQuantity('lente_olivia') === 0) {
              gameState.addItem('lente_olivia', 1);
            }
            npc.resetDirection();
          }
        );
        return;
      }

      this.dialogueBox.start(
        npc.name,
        'Não confie na luz que\nsó brilha para os ricos.\n---\nPergunte aos que vivem\nnos porões, filho.',
        () => {
          gameState.setFlag('olivia_aviso_dado', true);
          npc.resetDirection();
        }
      );
      return;
    }

    // 1.3 Brumaterra (Ato 3): Regente Olo, Curandeira de Vau e Velho Orun
    if (npc.name === 'Regente Olo' && this.currentMapId === 'vau_cinza') {
      if (gameState.getFlag('olo_ouvido')) {
        this.dialogueBox.start(
          npc.name,
          'Obrigado por ouvir a voz\nde Brumaterra, [NOME].\nProcure Orun na cabana!',
          () => npc.resetDirection()
        );
        return;
      }

      this.dialogueBox.startWithChoice(
        npc.name,
        'Nós não criamos a Treva.\nEla desce dos rios que\no seu Rei suja.\n---\nOuça-me, só uma vez.',
        ['Ouvir Olo', 'Ignorar'],
        (choiceIdx) => {
          npc.resetDirection();
          if (choiceIdx === 0) {
            gameState.setFlag('olo_ouvido', true);
            this.dialogueBox.start(
              npc.name,
              'Olo mostra a água verde\nque desce das minas do\nnorte e envenena o rio!\n---\n"Procure o Velho Orun na\ncabana do pântano, herói."'
            );
          } else {
            this.dialogueBox.start(
              npc.name,
              'Você exige apenas o tributo\nem nome de Auren. Olo\ncala-se com tristeza.'
            );
          }
        }
      );
      return;
    }

    if (npc.name === 'Curandeira de Vau' && this.currentMapId === 'vau_cinza') {
      if (gameState.getFlag('ervas_entregues')) {
        this.dialogueBox.start(
          npc.name,
          'O chá das Ervas do Brejo\nsalvou as crianças! O rio\nbrilha por culpa da mina!',
          () => npc.resetDirection()
        );
        return;
      }
      if (gameState.getItemQuantity('ervas_brejo') > 0) {
        this.dialogueBox.start(
          npc.name,
          'Você trouxe as Ervas do\nBrejo! Obrigada, herói!\nTome 80 moedas de ouro!\n---\nVeja como a raiz brilha:\né o resíduo do lume que\ndesce das minas do Rei!',
          () => {
            gameState.removeItem('ervas_brejo', 1);
            gameState.setFlag('ervas_entregues', true);
            gameState.addGold(80);
            npc.resetDirection();
          }
        );
        return;
      }
    }

    if (npc.name === 'Velho Orun' && this.currentMapId === 'cabana_orun') {
      this.dialogueBox.start(
        npc.name,
        'O que você matou na\ncaverna tinha nome.\nUlan guardava a porta.\n---\nEle protegia o povo Veyra\ndos escavadores de Auren!',
        () => {
          gameState.setFlag('orun_encontrado', true);
          gameState.setFlag('fera_era_guardiao', true);
          npc.resetDirection();
        }
      );
      return;
    }

    // 1.4 Pedrasul (Ato 3): Rainha Maren, Padeiro e Cativo Veyra na Mina Velha
    if (npc.name === 'Rainha Maren' && this.currentMapId === 'rochedo') {
      if (gameState.getFlag('maren_ouvida')) {
        this.dialogueBox.start(
          npc.name,
          'Entre na Mina Velha a\nleste de Rochedo, [NOME],\ne veja a verdade!',
          () => npc.resetDirection()
        );
        return;
      }

      this.dialogueBox.startWithChoice(
        npc.name,
        'Auren exige minério, mas\nleva nossos jovens para\nas galerias de Brenn!\n---\nQuer ouvir a verdade\nsobre a Mina Velha?',
        ['Ouvir Maren', 'Ignorar'],
        (choiceIdx) => {
          npc.resetDirection();
          if (choiceIdx === 0) {
            gameState.setFlag('maren_ouvida', true);
            this.dialogueBox.start(
              npc.name,
              'Maren revela que Lorde\nBrenn escraviza cativos na\nMina Velha a leste!'
            );
          } else {
            this.dialogueBox.start(
              npc.name,
              'Você cobra o tributo real\nsem ouvir as queixas do\npovo de Pedrasul.'
            );
          }
        }
      );
      return;
    }

    if (npc.name === 'Padeiro de Pedrasul' && this.currentMapId === 'rochedo') {
      if (gameState.getFlag('pao_entregue')) {
        this.dialogueBox.start(
          npc.name,
          'Obrigado por alimentar os\ncativos da Mina Velha!',
          () => npc.resetDirection()
        );
        return;
      }
      if (gameState.getItemQuantity('pao_pedra') === 0) {
        this.dialogueBox.start(
          npc.name,
          'Leve este Pão de Pedra\naos trabalhadores presos\nna Mina Velha a leste!',
          () => {
            gameState.addItem('pao_pedra', 1);
            npc.resetDirection();
          }
        );
        return;
      }
    }

    if (npc.name === 'Cativo Veyra' && this.currentMapId === 'mina_velha') {
      gameState.setFlag('mina_velha_vista', true);
      if (gameState.getItemQuantity('pao_pedra') > 0 && !gameState.getFlag('pao_entregue')) {
        this.dialogueBox.start(
          npc.name,
          'Pão de Pedra! Você salvou\nnossas vidas na mina!\nTome 80 moedas de ouro!\n---\nAuren nos prendeu aqui\npara extrair lume verde\npara a Cripta de Vael!',
          () => {
            gameState.removeItem('pao_pedra', 1);
            gameState.setFlag('pao_entregue', true);
            gameState.addGold(80);
            npc.resetDirection();
          }
        );
        return;
      }
    }

    // 1.5 Cobre-Alto (Ato 3): Seu Tomé ("O relojoeiro") e Chefe Rei Daros
    if (npc.name === 'Seu Tomé' && this.currentMapId === 'cobre_alto') {
      if (gameState.getFlag('relojoeiro_resolvido')) {
        this.dialogueBox.start(
          npc.name,
          'Ouça o carrilhão bater!\nO relógio de Cobre-Alto\njamais esquecerá você!',
          () => npc.resetDirection()
        );
        return;
      }
      if (!gameState.getFlag('daros_derrotado') && gameState.getItemQuantity('peca_relogio') > 0) {
        this.dialogueBox.start(
          npc.name,
          'A Engrenagem Fina da Mina\nVelha! O grande relógio\nvolta a funcionar!\n---\nTome 120 moedas de ouro\npela sua bondade, [NOME]!',
          () => {
            gameState.removeItem('peca_relogio', 1);
            gameState.setFlag('relojoeiro_resolvido', true);
            gameState.addGold(120);
            npc.resetDirection();
          }
        );
        return;
      }
    }

    if (npc.name === 'Rei Daros' && this.currentMapId === 'cobre_alto') {
      gameState.setFlag('cobre_alto_traido', true);
      this.dialogueBox.start(
        npc.name,
        'Você abriu o meu portão!\nEu recebi você como\nfilho de um aliado!',
        () => {
          npc.resetDirection();
          const darosDef = getMonsterDef('daros')!;
          this.sceneManager.push(
            new BattleScene(
              this.sceneManager,
              this.input,
              darosDef,
              this.assetManager,
              () => this.handleHeroDefeat(),
              () => {
                gameState.setFlag('daros_derrotado', true);
                gameState.setFlag('ponte_destruida', true);
                gameState.setFlag('ato3_concluido', true);
                const vignette = new VignetteScene(
                  this.sceneManager,
                  this.input,
                  'queda_ponte_cobre',
                  'Príncipe Dagan',
                  [
                    'Rei Daros tomba! As tropas de\nAuren tomam a fortaleza\nem chamas ardentes!',
                    'Você nos traiu, [NOME]!\nEu recebi você como um irmão!',
                    'Dagan corta os cabos da\nPonte de Cobre e foge para\nas montanhas do norte!',
                    'Volte ao Castelo Real e\nconfronte o Rei Auren!\n[FIM DO ATO 3]',
                  ],
                  () => {
                    this.sceneManager.pop();
                  }
                );
                this.sceneManager.push(vignette);
              }
            )
          );
        }
      );
      return;
    }

    // 1.6 Ato 4: Mestre Tavo, Capitã Marta, Sael, Orun, Príncipe Dagan e Lorde Vael
    if (npc.name === 'Mestre Tavo' && this.currentMapId === 'castelo') {
      const vignette = new VignetteScene(
        this.sceneManager,
        this.input,
        'tavo_morte',
        'Mestre Tavo',
        [
          '[NOME]... a prova está\nno meu alforje.\nNão confie em Vael...',
          'Não foi um monstro.\nFoi só pura conveniência,\ne todos obedeceram...',
          'Tavo respira com dificuldade\ne fecha os olhos para sempre\nnos degraus do palácio.',
          'Confronte o Rei Auren no\nSalão do Trono e exija a\nverdade sobre Luminário!',
        ],
        () => {
          gameState.setFlag('tavo_morto', true);
          npc.resetDirection();
          this.sceneManager.pop();
        }
      );
      this.sceneManager.push(vignette);
      return;
    }

    if (npc.name === 'Capitã Marta' && this.currentMapId === 'castelo') {
      if (gameState.getFlag('terremoto_visto') && !gameState.getFlag('ato1_concluido')) {
        this.dialogueBox.start(
          npc.name,
          'O desfiladeiro a leste desabou\ncom o tremor da noite!\n---\nO Rei Auren o aguarda com\nurgência no Salão do Trono!',
          () => npc.resetDirection()
        );
        return;
      }

      if (gameState.getFlag('fera_derrotada') && !gameState.getFlag('terremoto_visto')) {
        this.dialogueBox.start(
          npc.name,
          'Parabéns pela vitória na\nCaverna, [NOME]!\n---\nO Rei ordenou que você descanse.\nSeus Aposentos ficam na Ala Leste\n(suba pelo corredor à direita).',
          () => npc.resetDirection()
        );
        return;
      }

      if (gameState.getFlag('selo_veyra_obtido')) {
        this.dialogueBox.start(
          npc.name,
          'A guarda real está com\nvocê, [NOME]! Desça à\nCâmara do Lume!',
          () => {
            gameState.setFlag('castelo_invadido', true);
            npc.resetDirection();
          }
        );
        return;
      }

      if (gameState.getFlag('rei_protegeu_vael')) {
        this.dialogueBox.start(
          npc.name,
          'Fuja pela saída sul,\n[NOME]! Vá ao Refúgio das\nRaízes na Grande Floresta!',
          () => {
            gameState.setFlag('marta_deixou_fugir', true);
            gameState.setFlag('refugio_aberto', true);
            npc.resetDirection();
          }
        );
        return;
      }
    }

    if (npc.name === 'Sael' && this.currentMapId === 'refugio_raizes') {
      this.dialogueBox.start(
        npc.name,
        npc.getActiveDialogue(),
        () => {
          gameState.setFlag('refugio_aberto', true);
          gameState.setFlag('origem_revelada', true);
          gameState.setFlag('medalhao_verdade', true);
          gameState.setFlag('travessia_feita', true);
          npc.resetDirection();
        }
      );
      return;
    }

    if (npc.name === 'Velho Orun' && this.currentMapId === 'refugio_raizes') {
      this.dialogueBox.start(
        npc.name,
        'Tome a Pedra do Eco e\naprenda a magia Eco,\nfilho de Aneth!\n---\nCom ela você abrirá a\nCripta do Refino e o\nTemplo do Coração!',
        () => {
          gameState.setFlag('pedra_eco_obtida', true);
          if (gameState.getItemQuantity('pedra_eco') === 0) {
            gameState.addItem('pedra_eco', 1);
          }
          if (!gameState.hasSpell('eco')) {
            gameState.spells.push('eco');
          }
          npc.resetDirection();
        }
      );
      return;
    }

    if (npc.name === 'Príncipe Dagan' && this.currentMapId === 'rochedo') {
      if (gameState.getFlag('dagan_aliado')) {
        this.dialogueBox.start(
          npc.name,
          'Você poupou meu povo e\nouviu Brumaterra e Maren!\nLutarei ao seu lado!',
          () => npc.resetDirection()
        );
        return;
      }

      this.dialogueBox.start(
        npc.name,
        'Você abriu o portão de\nmeu pai para Auren!\nPague com seu aço!',
        () => {
          gameState.setFlag('dagan_inimigo', true);
          npc.resetDirection();
          const daganDef = getMonsterDef('dagan')!;
          this.sceneManager.push(
            new BattleScene(
              this.sceneManager,
              this.input,
              daganDef,
              this.assetManager,
              () => this.handleHeroDefeat(),
              () => {
                this.dialogueBox.start(
                  'Príncipe Dagan',
                  'Dagan recua ferido:\n"Derrube Auren se quiser\nprovar sua honra!"'
                );
              }
            )
          );
        }
      );
      return;
    }

    if (npc.name === 'Lorde Vael' && this.currentMapId === 'cripta_refino') {
      this.dialogueBox.start(
        npc.name,
        'Então o filho de Aneth\ndesceu à fornalha! Seu\nlume alimentará o trono!',
        () => {
          npc.resetDirection();
          const vaelDef = getMonsterDef('vael')!;
          this.sceneManager.push(
            new BattleScene(
              this.sceneManager,
              this.input,
              vaelDef,
              this.assetManager,
              () => this.handleHeroDefeat(),
              () => {
                gameState.setFlag('vael_derrotado', true);
                gameState.setFlag('pim_salvo', true);
                gameState.setFlag('hesper_caiu', true);
                gameState.setFlag('olivia_lider_santuario', true);
                gameState.setFlag('iris_traicao_revelada', true);
                gameState.setFlag('ato4_concluido', true);
                this.dialogueBox.startWithChoice(
                  'CRIPTA DO REFINO',
                  'Vael cai! Pim e os cativos\nsão libertados! Íris surge\ne confessa sua espionagem.\n---\nEla implora perdão por\nter vigiado você para\nVael. O que decidir?',
                  ['Perdoar Íris', 'Exilar Íris'],
                  (choiceIdx) => {
                    if (choiceIdx === 0) {
                      gameState.setFlag('iris_perdoada', true);
                      this.dialogueBox.start(
                        'Íris',
                        'Você perdoa Íris. Ela\npromete ajudar Olívia a\nguiar o Santuário!\n---\nVá ao Porto do Sol rumo à\nIlha Veyra! [FIM DO ATO 4]'
                      );
                    } else {
                      this.dialogueBox.start(
                        'Irmã Olívia',
                        'Íris parte em exílio.\nOlívia assume o Santuário\ne liberta os cativos!\n---\nVá ao Porto do Sol rumo à\nIlha Veyra! [FIM DO ATO 4]'
                      );
                    }
                  }
                );
              }
            )
          );
        }
      );
      return;
    }

    // 1.7 Ato 5: Travessia para Ilha Veyra de BARCO, Templo do Coração e Confronto Final na Câmara do Lume
    if (
      (npc.name === 'Almirante Brasca' || npc.name === 'Marinheiro') &&
      this.currentMapId === 'cidade_2' &&
      gameState.getFlag('ato4_concluido')
    ) {
      if (gameState.getFlag('barco_obtido')) {
        this.dialogueBox.start(
          npc.name,
          'O barco espera no cais ao\nsul da cidade, [NOME].\n---\nO Templo do Coração fica\ncercado de montanhas. Fale\ncom Zéfiro, o inventor!',
          () => npc.resetDirection()
        );
        return;
      }
      const msg =
        npc.name === 'Almirante Brasca'
          ? 'Meu barco é seu, [NOME]!\nEstá ancorado logo ao sul\ndo cais. Rumo a Veyra!\n---\nMas ouça: o templo fica\ncercado de montanhas. Procure\nZéfiro, o inventor do cais!'
          : 'Tome o barco do cais, [NOME]!\nEstá ancorado ao sul. Rumo\nà Ilha Veyra!\n---\nO templo é cercado de\nmontanhas. Fale com Zéfiro,\no inventor do cais!';
      this.dialogueBox.start(npc.name, msg, () => {
        gameState.setFlag('barco_obtido', true);
        gameState.setFlag('ilha_acessivel', true);
        gameState.boatPos = { x: 45, y: 96 };
        soundManager.playSfx('victory');
        npc.resetDirection();
        this.dialogueBox.start(
          'BARCO',
          'Você recebeu um BARCO!\nAndando pela água ele\nnavega; ao pisar em terra\nvocê desembarca.\n---\nEncoste nele para embarcar\nde novo.'
        );
      });
      return;
    }

    if (npc.name === 'Velho Orun' && this.currentMapId === 'templo_coracao') {
      this.dialogueBox.start(
        npc.name,
        'Aqui sua mãe Aneth escondeu\nvocê de Auren, [NOME].\nTome o Selo de Veyra!\n---\nVolte ao Subsolo do\nCastelo Real e encare o\nRei na Câmara do Lume!',
        () => {
          gameState.setFlag('templo_coracao_aberto', true);
          gameState.setFlag('selo_veyra_obtido', true);
          if (gameState.getItemQuantity('selo_veyra') === 0) {
            gameState.addItem('selo_veyra', 1);
          }
          npc.resetDirection();
        }
      );
      return;
    }

    if (npc.name === 'Rei Auren' && this.currentMapId === 'castelo_subsolo') {
      gameState.setFlag('castelo_invadido', true);
      this.dialogueBox.start(
        npc.name,
        'Sem o refino, o reino\napaga, filho de Aneth!\nDefenderei minha coroa!',
        () => {
          npc.resetDirection();
          const aurenDef = getMonsterDef('auren')!;
          this.sceneManager.push(
            new BattleScene(
              this.sceneManager,
              this.input,
              aurenDef,
              this.assetManager,
              () => this.handleHeroDefeat(),
              () => {
                gameState.setFlag('auren_derrotado', true);
                this.dialogueBox.start(
                  'Rei Auren',
                  'Trinta anos carregando\neste fogo... Tome. Veja\nquanto pesa.',
                  () => {
                    this.promptFinalCrownChoice();
                  }
                );
              }
            )
          );
        }
      );
      return;
    }

    // 2. Rei Auren (Progressão dos Atos 1, 2, 3 e 4 no Salão do Trono)
    if (npc.name === 'Rei Auren') {
      if (gameState.getFlag('ato3_concluido')) {
        this.dialogueBox.start(
          npc.name,
          'Vael faz o que é preciso\npara manter este reino\naceso. Volte ao seu posto.',
          () => {
            gameState.setFlag('tavo_morto', true);
            gameState.setFlag('rei_protegeu_vael', true);
            npc.resetDirection();
          }
        );
        return;
      }

      if (gameState.getFlag('ato2_concluido') && !gameState.getFlag('ato3_concluido')) {
        const visitedNorth =
          gameState.getFlag('mina_velha_vista') ||
          gameState.getFlag('olo_ouvido') ||
          gameState.getFlag('maren_ouvida') ||
          gameState.getFlag('orun_encontrado');

        if (visitedNorth && !gameState.getFlag('chave_cobre_recebida')) {
          this.dialogueBox.start(
            npc.name,
            'Bom trabalho em Brumaterra\ne Pedrasul, [NOME]! Resta\napenas o Reino Cobreval.\n---\nTome a Chave de Cobre.\nAbra o portão de Cobre-\nAlto à noite para nós!',
            () => {
              gameState.setFlag('chave_cobre_recebida', true);
              gameState.addItem('chave_cobre', 1);
              npc.resetDirection();
            }
          );
          return;
        }

        if (gameState.getFlag('chave_cobre_recebida')) {
          this.dialogueBox.start(
            npc.name,
            'Cruze a Ponte de Cobre a\nnordeste e use a Chave\nem Cobre-Alto, [NOME]!',
            () => npc.resetDirection()
          );
          return;
        }

        this.dialogueBox.start(
          npc.name,
          'Vá a Vau-Cinza no sudoeste\ne a Rochedo no noroeste,\n[NOME]. Traga o tributo!',
          () => npc.resetDirection()
        );
        return;
      }

      const brascaDone = gameState.getFlag('brasca_poupado') || gameState.getFlag('brasca_executado');
      const santuarioDone = gameState.getFlag('medalhao_brilhou') || gameState.getFlag('olivia_aviso_dado');
      if (gameState.getFlag('ato1_concluido') && brascaDone && santuarioDone) {
        this.dialogueBox.start(
          npc.name,
          'Então a costa está segura\ne o Santuário abençoou\nsua jornada, [NOME]!\n---\nAgora vá cobrar a aliança\nde Olo em Vau-Cinza e de\nMaren em Rochedo!\n---\nTome 100 de ouro para a\nexpedição às fronteiras!\n[FIM DO ATO 2]',
          () => {
            gameState.setFlag('ato2_concluido', true);
            gameState.addGold(100);
            npc.resetDirection();
          }
        );
        return;
      }

      // 1. Pós-Terremoto: herói descansou nos Aposentos, a cutscene do terremoto passou e o Rei o orienta
      if (gameState.getFlag('terremoto_visto') && !gameState.getFlag('ato1_concluido')) {
        this.dialogueBox.start(
          npc.name,
          '[NOME], você sentiu a terra\ntremer durante a noite? O som\nveio do desfiladeiro ao leste!\n---\nNossas sentinelas confirmaram:\na grande barreira do Passo do\nSantuário desabou!\n---\nO caminho entre as montanhas\nestá aberto pela primeira vez\nem décadas rumo ao sul!\n---\nTome o Selo Real e 50 Moedas de\nOuro. Vá ao sul, atravesse o\nPasso e chegue ao Porto do Sol!\n---\n[FIM DO ATO 1: O Passo Aberto - Rumo ao Sul!]',
          () => {
            gameState.setFlag('ato1_concluido', true);
            gameState.setFlag('vael_patrono', true);
            gameState.addItem('selo_real', 1);
            gameState.addGold(50);
            soundManager.playSfx('victory');
            gameState.saveGame(this.currentMapId, this.player.tileX, this.player.tileY, this.player.direction);
            npc.resetDirection();
          }
        );
        return;
      }

      // 2. Herói derrotou a fera na Caverna das Sombras e volta com a Pulseira Antiga
      if (gameState.getFlag('fera_derrotada') && !gameState.getFlag('terremoto_visto')) {
        this.dialogueBox.start(
          npc.name,
          'Bravo, [NOME]! Você venceu a\nterrível criatura na Caverna das\nSombras e trouxe a Pulseira Antiga!\n---\nO Rei Daros e o Príncipe Dagan\njá chegaram ao castelo para o\nnosso banquete de aliança.\n---\nMas vejo que você está exausto\nde tão árdua batalha. Vá aos\nAposentos do Herói na Ala Leste.\n---\nDeite-se em sua cama e descanse!\nAmanhã celebraremos seu triunfo!',
          () => {
            gameState.setFlag('rei_mandou_descansar', true);
            gameState.saveGame(this.currentMapId, this.player.tileX, this.player.tileY, this.player.direction);
            npc.resetDirection();
          }
        );
        return;
      }

      if (gameState.getFlag('ato1_concluido')) {
        this.dialogueBox.start(
          npc.name,
          'Siga pelo Passo do Santuário\nou pela ponte ao sul, [NOME].\n---\nInvestigue a costa e os rumores\nsobre o Grande Lume no Porto do Sol!\nQue a luz guie sua jornada.',
          () => npc.resetDirection()
        );
        return;
      }

      if (gameState.getFlag('brinde_resolvido')) {
        this.dialogueBox.start(
          npc.name,
          'Você salvou a aliança,\n[NOME]! Mas o veneno\nveio pelo mar do sul.\n---\nTome o Selo Real e 50 de\nouro. Siga ao sul até o\nPorto do Sol!\n---\n[FIM DO ATO 1: A Sombra\nno Poço - Rumo ao Sul!]',
          () => {
            gameState.setFlag('vael_patrono', true);
            gameState.setFlag('ato1_concluido', true);
            gameState.addItem('selo_real', 1);
            gameState.addGold(50);
            npc.resetDirection();
          }
        );
        return;
      }

      if (gameState.getFlag('fera_derrotada')) {
        if (!gameState.getFlag('banquete_alianca')) {
          gameState.setFlag('banquete_alianca', true);
          gameState.flags.ensureBrindeCulpado();
        }
        this.dialogueBox.start(
          npc.name,
          'Bravo, [NOME]! A fera\ncaiu e o Rei Daros veio\npara o nosso banquete!\n---\nMas o Copeiro Real achou\nveneno na taça do brinde!\nAlguém do Conselho traiu!\n---\nFale com o Copeiro e os\nconselheiros na Ala Oeste\ne descubra o culpado!',
          () => npc.resetDirection()
        );
        return;
      }

      const activeDialogue = npc.getActiveDialogue();
      this.dialogueBox.start(npc.name, activeDialogue, () => {
        gameState.setFlag('rei_missao_recebida', true);
        gameState.setFlag('espada_recebida', true);
        gameState.setFlag('medalhao_recebido', true);
        gameState.saveGame(this.currentMapId, this.player.tileX, this.player.tileY, this.player.direction);
        npc.resetDirection();
      });
      return;
    }

    // 3. Copeiro Real (Missão "O Brinde" no Salão de Banquetes)
    if (npc.name === 'Copeiro Real' && gameState.getFlag('banquete_alianca')) {
      if (gameState.getFlag('brinde_resolvido')) {
        this.dialogueBox.start(
          npc.name,
          'Graças a você o brinde\nreal foi salvo! O Rei\nAuren o aguarda no Trono!',
          () => npc.resetDirection()
        );
        return;
      }

      const culpado = gameState.flags.ensureBrindeCulpado();
      let clueText = '';
      if (culpado === 'brenn') {
        clueText =
          'Alguém pôs veneno na taça!\nVi um homem de armadura\npesada e cheiro de forja\n---\nrondando a mesa: foi\nLorde Brenn! Confronte-o\nna sala do Conselho!';
      } else if (culpado === 'hald') {
        clueText =
          'Alguém pôs veneno na taça!\nVi um nobre contando\nmoedas de prata mexer na\n---\ntaça: foi Lorde Hald!\nConfronte-o na sala do\nConselho ao norte!';
      } else {
        clueText =
          'Alguém pôs veneno na taça!\nVi um vulto de manto\nescuro e anel de sinete\n---\njogar pó na taça: foi\nLorde Vael! Confronte-o\nna sala do Conselho!';
      }

      this.dialogueBox.start(npc.name, clueText, () => npc.resetDirection());
      return;
    }

    // 4. Conselheiros suspeitos durante "O Brinde"
    if (
      gameState.getFlag('banquete_alianca') &&
      !gameState.getFlag('brinde_resolvido') &&
      (npc.name === 'Lorde Brenn' || npc.name === 'Lorde Hald' || npc.name === 'Lorde Vael')
    ) {
      const culpado = gameState.flags.ensureBrindeCulpado();
      const mapSuspect: Record<string, string> = {
        'Lorde Brenn': 'brenn',
        'Lorde Hald': 'hald',
        'Lorde Vael': 'vael',
      };

      if (mapSuspect[npc.name] === culpado) {
        this.dialogueBox.start(
          npc.name,
          `Você confronta ${npc.name}\ndiante da guarda! Um\nfrasco de veneno cai!\n---\nO complô do brinde foi\ndesmascarado! Volte ao\nTrono e avise o Rei!`,
          () => {
            gameState.setFlag('brinde_resolvido', true);
            npc.resetDirection();
          }
        );
        return;
      }
    }

    const activeDialogue = npc.getActiveDialogue();
    this.dialogueBox.start(npc.name, activeDialogue, () => {
      if (npc.setFlagOnTalk) {
        gameState.setFlag(npc.setFlagOnTalk, true);
      }
      npc.resetDirection();
    });
  }

  private promptFinalCrownChoice(): void {
    this.dialogueBox.startWithChoice(
      'A COROA DE LUMINÁRIO',
      'A coroa repousa no chão\ndiante da fornalha fria.\nPegar a coroa?',
      ['Sim', 'Não'],
      (choiceIdx) => {
        if (choiceIdx === 1) {
          this.dialogueBox.start(
            'Velho Orun',
            'Alguém precisa segurar\no lume.',
            () => {
              this.promptFinalCrownChoice();
            }
          );
          return;
        }

        gameState.setFlag('final_b_coroa_vazia', true);
        const pages: string[] = [
          'A fornalha apagou. Mas\nnos olhos do novo Rei,\nbrilhou uma brasa dourada.',
          gameState.getFlag('brasca_poupado')
            ? 'Brasca lidera a frota\nlivre no Porto do Sol.'
            : 'Sem Brasca, o Porto do\nSol vigia o mar calado.',
          gameState.getFlag('olo_ouvido')
            ? 'Em Brumaterra, Olo limpa\nos rios com sua ajuda.'
            : 'Em Brumaterra, o pântano\nseguiu turvo e distante.',
          gameState.getFlag('maren_ouvida')
            ? 'Em Pedrasul, Maren ergue\nescolas onde havia minas.'
            : 'Em Pedrasul, as montanhas\nguardam rancor silencioso.',
          gameState.getFlag('dagan_aliado')
            ? 'Príncipe Dagan reconstrói\na Ponte de Cobre em paz.'
            : 'Em Cobre-Alto, as ruínas\nlembram a ponte caída.',
          gameState.getFlag('iris_perdoada')
            ? 'Íris e Irmã Olívia cuidam\ndo novo Santuário livre.'
            : 'Irmã Olívia guia sozinha\no Santuário renovado.',
          gameState.getFlag('relojoeiro_resolvido')
            ? 'E o relógio de Seu Tomé\nbate as horas de um novo\ntempo em Luminário.'
            : 'E o carrilhão de Cobre-\nAlto permaneceu mudo no\nhorizonte do norte.',
          'PÓS-CRÉDITOS: Na Vila\nAlvorada, Sael olha para\no Castelo ao longe.',
          'O céu está limpo, mas\numa tênue faísca dourada\nainda brilha na torre...',
          '[FIM - A LENDA DE\nLUMINÁRIO: A COROA VAZIA]',
        ];
        this.dialogueBox.start('NARRADOR', pages.join('\n---\n'), () => {
          gameState.setFlag('jogo_concluido', true);
          gameState.saveGame(
            this.currentMapId,
            this.player.tileX,
            this.player.tileY,
            this.player.direction
          );
          const credits = new CreditsScene(this.sceneManager, this.input, this.assetManager);
          this.sceneManager.fadeTransition(credits);
        });
      }
    );
  }

  /**
   * Tenta interagir de frente com NPC, placa, baú, poço ou balcão de loja.
   * Retorna true se houver interação.
   */
  public tryTalkToNpc(): boolean {
    const facing = this.player.getFacingTile();

    // 1. Tenta falar com NPC visível virado para o herói
    const directNpc = this.npcs.find((n) => n.isVisible() && n.tileX === facing.x && n.tileY === facing.y);
    if (directNpc) {
      this.interactWithNpcEntity(directNpc);
      return true;
    }

    // 2. Tenta ler placa de frente
    const sign = this.currentMap.getSignAt(facing.x, facing.y);
    if (sign) {
      if (sign.setFlag === 'garo_carga_vista') {
        if (!gameState.isNight() && !gameState.getFlag('garo_carga_vista')) {
          this.dialogueBox.start(
            sign.title || 'CAIXOTE DO CAIS',
            'Guardas reais vigiam os\ncaixotes sob o sol a pino.\nImpossível abrir sem alarde!\n---\nDescanse na Estalagem e\nespere a NOITE para invadir\no cais sem ser visto!'
          );
          return true;
        }
        gameState.setFlag('carga_perdida_resolvida', true);
      }
      if (sign.setFlag === 'vapor_coletado') {
        // Missão noturna do balão: o vapor só sobe com a maré da noite e exige o pedido de Zéfiro
        if (!gameState.getFlag('balao_missao_vapor')) {
          this.dialogueBox.start('CAIS', 'A água do cais brilha de\nleve, mas você não sabe\npara que serve...');
          return true;
        }
        if (gameState.getItemQuantity('frasco_vapor') > 0) {
          this.dialogueBox.start('VAPOR DA MARÉ', 'Você já encheu o frasco.\nLeve-o a Zéfiro!');
          return true;
        }
        if (!gameState.isNight()) {
          this.dialogueBox.start(
            'VAPOR DA MARÉ',
            'A maré está baixa e calma.\nO vapor só sobe à NOITE!\n---\nDescanse na Estalagem até\nanoitecer e volte aqui.'
          );
          return true;
        }
        soundManager.playSfx('chest');
        gameState.addItem('frasco_vapor', 1);
        gameState.setFlag('vapor_coletado', true);
        this.dialogueBox.start(sign.title || 'VAPOR DA MARÉ', sign.text);
        return true;
      }
      if (sign.id === 'placa_passo' || sign.title === 'PASSO DO SANTUÁRIO') {
        const text = gameState.getFlag('terremoto_visto')
          ? 'PASSO DO SANTUÁRIO:\nO desmoronamento recente abriu\num caminho de terra e pedregulhos\nentre as montanhas rumo ao sul!'
          : 'PASSO DO SANTUÁRIO:\nDesfiladeiro rochoso a leste.\nRochas maciças barram a passagem.\nNenhum caminho a pé.';
        this.dialogueBox.start(sign.title || 'PASSO DO SANTUÁRIO', text);
        return true;
      }
      if (sign.id === 'placa_aposentos' || sign.title === 'APOSENTOS DO HERÓI') {
        this.dialogueBox.start(
          sign.title || 'APOSENTOS DO HERÓI',
          'Aposentos Reais do Herói.\nUma cama confortável de dossel\naguarda após as batalhas.'
        );
        return true;
      }
      if (sign.setFlag) {
        gameState.setFlag(sign.setFlag, true);
      }
      if (sign.setFlag === 'diario_auren_lido' && gameState.getItemQuantity('diario_auren') === 0) {
        gameState.addItem('diario_auren', 1);
      }
      this.dialogueBox.start(sign.title || 'PLACA', sign.text);
      return true;
    }

    // 3. Tenta interagir com baú de frente
    const chest = this.currentMap.getChestAt(facing.x, facing.y);
    if (chest) {
      if (chest.id === 'bau_espada_solar' && !gameState.getFlag('guardiao_celeste_derrotado')) {
        soundManager.playSfx('error');
        this.dialogueBox.start(
          'ALTAR SELADO',
          'O baú sagrado está protegido\npela barreira mágica do Guardião!\nDerrote-o para libertar o selo.'
        );
        return true;
      }

      if (gameState.openedChests.has(chest.id)) {
        soundManager.playSfx('error');
        this.dialogueBox.start('BAÚ', 'O baú está vazio.');
      } else {
        soundManager.playSfx('chest');
        gameState.openedChests.add(chest.id);
        this.currentMap.setTileAt(chest.tileX, chest.tileY, 'chest_open');

        if (chest.gold) {
          gameState.addGold(chest.gold);
        }
        if (chest.item) {
          gameState.addItem(chest.item, 1);
        }
        if (chest.setFlagOnOpen) {
          gameState.setFlag(chest.setFlagOnOpen, true);
        } else if (chest.id === 'bau_ulan') {
          gameState.setFlag('bau_ulan_aberto', true);
        }

        const defaultMsg =
          chest.id === 'bau_espada_solar'
            ? 'Você abriu o baú do Altar Celeste!\nEncontrou a lendária ESPADA SOLAR\ne 250 Moedas de Ouro!'
            : 'Você abriu o baú do tesouro!';
        this.dialogueBox.start('BAÚ', chest.message || defaultMsg);
      }
      return true;
    }

    const facingTile = this.currentMap.getTileAt(facing.x, facing.y);

    // 4. Interação com Poço de Água ('well') — Missão "O Poço de Dona Bina" em Alvorada
    if (facingTile && facingTile.id === 'well') {
      if (this.currentMapId === 'cidade_1') {
        if (!gameState.getFlag('poco_bina_resolvido')) {
          this.dialogueBox.start(
            'POÇO DE ALVORADA',
            'Algo viscoso se mexe no\nfundo do poço escuro!\nUma Gosma-Cinza salta!',
            () => {
              const gosma = getMonsterDef('gosma_cinza')!;
              this.sceneManager.push(
                new BattleScene(
                  this.sceneManager,
                  this.input,
                  gosma,
                  this.assetManager,
                  () => this.handleHeroDefeat(),
                  () => {
                    gameState.setFlag('poco_bina_resolvido', true);
                    gameState.addGold(30);
                    this.dialogueBox.start(
                      'POÇO DE ALVORADA',
                      'A água voltou a correr\nlímpida no poço!\n---\nDona Bina agradece e lhe\nentrega 30 moedas de ouro!'
                    );
                  }
                )
              );
            }
          );
        } else {
          this.dialogueBox.start('POÇO DE ALVORADA', 'A água do poço está\nlímpida e fresca agora.');
        }
      } else {
        this.dialogueBox.start('POÇO', 'Um poço de pedra antigo.\nA água corre fria lá\nno fundo.');
      }
      return true;
    }

    // 4.5 Interação com Cama ('bed')
    if (facingTile && facingTile.id === 'bed') {
      this.interactWithBed();
      return true;
    }

    // 5. Se o tile à frente for um balcão ('counter'), tenta falar com o NPC atrás dele
    if (facingTile && facingTile.kind === 'counter') {
      const dx = facing.x - this.player.tileX;
      const dy = facing.y - this.player.tileY;
      const behindX = facing.x + dx;
      const behindY = facing.y + dy;
      const counterNpc = this.npcs.find((n) => n.isVisible() && n.tileX === behindX && n.tileY === behindY);
      if (counterNpc) {
        this.interactWithNpcEntity(counterNpc);
        return true;
      }
    }

    // 6. Interação com elementos interativos de cenário (barris, vasos, estantes de livros)
    if (facingTile && (facingTile.id === 'barrel' || facingTile.id === 'pot' || facingTile.id === 'bookshelf')) {
      this.interactWithScenery(facingTile.id, facing.x, facing.y);
      return true;
    }

    return false;
  }

  /**
   * Vasculha objetos do cenário por moedas, itens e notas históricas
   */
  private interactWithScenery(tileId: string, tileX: number, tileY: number): void {
    const flagKey = `scenery_${this.currentMapId}_${tileX}_${tileY}`;

    if (tileId === 'barrel') {
      if (gameState.getFlag(flagKey)) {
        soundManager.playSfx('cancel');
        this.dialogueBox.start('BARRIL', 'Você vasculhou o barril.\nNão há mais nada aqui.');
        return;
      }
      gameState.setFlag(flagKey, true);
      const roll = (tileX * 7 + tileY * 13) % 4;
      if (roll === 0) {
        soundManager.playSfx('coins');
        const gold = 6 + (tileX % 7);
        gameState.addGold(gold);
        this.dialogueBox.start('BARRIL', `Você revistou o barril e\nencontrou ${gold} Moedas de Ouro!`);
      } else if (roll === 1) {
        soundManager.playSfx('chest');
        gameState.addItem('erva_cura', 1);
        this.dialogueBox.start('BARRIL', 'Você revistou o barril e\nencontrou uma Erva Curativa!');
      } else if (roll === 2) {
        soundManager.playSfx('coins');
        const gold = 10;
        gameState.addGold(gold);
        this.dialogueBox.start('BARRIL', 'No fundo do barril havia\n10 Moedas de Ouro esquecidas!');
      } else {
        soundManager.playSfx('cursor');
        this.dialogueBox.start('BARRIL', 'O barril de carvalho contém\napenas maçãs secas e água.');
      }
      return;
    }

    if (tileId === 'pot') {
      if (gameState.getFlag(flagKey)) {
        soundManager.playSfx('cancel');
        this.dialogueBox.start('VASO', 'Um vaso de barro vazio.');
        return;
      }
      gameState.setFlag(flagKey, true);
      const roll = (tileX * 11 + tileY * 5) % 4;
      if (roll === 0) {
        soundManager.playSfx('coins');
        const gold = 5 + (tileY % 8);
        gameState.addGold(gold);
        this.dialogueBox.start('VASO', `Você espiou dentro do vaso e\nencontrou ${gold} Moedas de Ouro!`);
      } else if (roll === 1) {
        soundManager.playSfx('chest');
        gameState.addItem('tonico_brasa', 1);
        this.dialogueBox.start('VASO', 'Dentro do vaso de barro havia\num Tônico de Brasa!');
      } else {
        soundManager.playSfx('cursor');
        this.dialogueBox.start('VASO', 'Você espiou o interior do\nvaso, mas só havia poeira\ne sementes secas.');
      }
      return;
    }

    if (tileId === 'bookshelf') {
      soundManager.playSfx('cursor');
      if (this.currentMapId === 'castelo') {
        this.dialogueBox.start(
          'ESTANTE REAL',
          'Crônicas do Reino de Luminário:\n"O Grande Lume ardeu por eras\nno topo da torre central...\n---\n...guiando viajantes e afastando\nas criaturas das trevas que\nhabitam os ermos do mundo."'
        );
      } else if (this.currentMapId === 'templo_coracao' || this.currentMapId === 'santuario') {
        this.dialogueBox.start(
          'ESTANTE ANTIGA',
          'Escrituras Arcanas:\n"Três virtudes sustentam a luz:\nCoragem no aço, sabedoria no\nespírito e piedade no coração."'
        );
      } else if (this.currentMapId === 'cabana_orun') {
        this.dialogueBox.start(
          'ESTANTE DO EREMITA',
          'Anotações de Mestre Orun:\n"As ervas dos vales curam a carne,\nmas a vontade do herói cura\no próprio destino da terra."'
        );
      } else {
        this.dialogueBox.start(
          'ESTANTE',
          'Tomos encadernados em couro:\nReceitas medicinais, cartas\nmarítimas e lendas sobre os\nheróis do passado.'
        );
      }
      return;
    }
  }

  /**
   * Interação com a cama nos Aposentos do Herói ou estalagens
   */
  private interactWithBed(): void {
    const isPostBossRest = gameState.getFlag('fera_derrotada') && !gameState.getFlag('terremoto_visto');

    const promptText = isPostBossRest
      ? 'Esta é a sua cama macia nos Aposentos Reais.\nDeseja deitar e descansar após a árdua batalha?'
      : 'Deseja descansar em sua cama para restaurar PV e PM?';

    this.dialogueBox.startWithChoice(
      'APOSENTOS DO HERÓI',
      promptText,
      ['Descansar', 'Agora não'],
      (choiceIdx) => {
        if (choiceIdx !== 0) return;

        // Recupera PV e PM do herói
        gameState.hp = gameState.maxHp;
        gameState.mp = gameState.maxMp;
        soundManager.playSfx('inn');

        if (isPostBossRest) {
          this.triggerNightEarthquakeSequence();
        } else {
          this.dialogueBox.start(
            'APOSENTOS DO HERÓI',
            'Você descansou profundamente.\nSeu PV e PM foram completamente restaurados!'
          );
        }
      }
    );
  }

  /**
   * Cinemática dramática do terremoto do Passo durante o sono do herói
   */
  private triggerNightEarthquakeSequence(): void {
    this.dialogueBox.start(
      'APOSENTOS DO HERÓI',
      'Você se deita na cama macia.\nO cansaço da batalha o vence e\nvocê adormece profundamente...\n---\n...',
      () => {
        // Terremoto sacode o castelo
        this.quakeTimer = 45;
        soundManager.playSfx('hit');

        // Abre a VignetteScene com a arte do terremoto
        const vignette = new VignetteScene(
          this.sceneManager,
          this.input,
          'terremoto_passo',
          'O Passo Desaba',
          [
            'Durante a calada da noite,\no solo estremece com extrema\nviolência!',
            'Um estrondo ensurdecedor ecoa\npelas montanhas a leste do reino...\nPedras rolam pelo vale!',
            'A grande muralha rochosa do\ndesfiladeiro racha e desmorona\nnuma imensa nuvem de poeira!',
            'Uma fresta ampla se abre entre\nas rochas caídas, revelando o\ncaminho do Passo do Santuário!',
          ],
          () => {
            this.sceneManager.pop();

            // Retorna ao quarto pela manhã
            gameState.setFlag('terremoto_visto', true);
            gameState.setFlag('passo_desabado', true);
            gameState.setFlag('rei_aguarda_pos_terremoto', true);
            soundManager.playSfx('stairs');

            // Capitã Marta acorda o herói com a notícia urgente
            this.dialogueBox.start(
              'CAPITÃ MARTA',
              'Herói, acorde! Você sentiu esse\ntremor estarrecedor?!\n---\nAs sentinelas relataram que o\ndesfiladeiro do leste desabou\ndurante a noite!\n---\nO Rei Auren o convoca com a\nmáxima urgência ao Salão do Trono!',
              () => {
                gameState.saveGame(
                  this.currentMapId,
                  this.player.tileX,
                  this.player.tileY,
                  this.player.direction
                );
              }
            );
          }
        );
        this.sceneManager.push(vignette);
      }
    );
  }

  /**
   * Abre o mapa esquemático do reino mostrando marcos geográficos e posição do herói.
   */
  public openWorldMap(): void {
    soundManager.playSfx('confirm');
    this.sceneManager.push(
      new WorldMapScene(
        this.sceneManager,
        this.input,
        this.currentMapId,
        this.player.tileX,
        this.player.tileY
      )
    );
  }

  /**
   * Verifica se o herói já cumpriu os requisitos narrativos para entrar no mapa de destino.
   */
  private canEnterWarp(targetMap: string): boolean {
    if (
      this.currentMapId === 'castelo' &&
      targetMap === 'overworld' &&
      !gameState.getFlag('rei_missao_recebida')
    ) {
      this.player.setTilePosition(this.player.tileX, Math.max(1, this.player.tileY - 1), 'up');
      this.dialogueBox.start(
        'GUARDA REAL',
        'O Rei Auren aguarda você\nno Salão do Trono ao\nnorte, [NOME]!'
      );
      return false;
    }

    if (
      (targetMap === 'cidade_2' || targetMap === 'gruta_costa' || targetMap === 'santuario') &&
      !gameState.getFlag('ato1_concluido')
    ) {
      this.dialogueBox.start(
        'GUARDA DA FRONTEIRA',
        'Conclua primeiro a missão\ndo Rei em Alvorada e na\nCaverna das Sombras!'
      );
      return false;
    }

    if (
      (targetMap === 'vau_cinza' ||
        targetMap === 'cabana_orun' ||
        targetMap === 'rochedo' ||
        targetMap === 'mina_velha') &&
      !gameState.getFlag('ato2_concluido')
    ) {
      this.dialogueBox.start(
        'GUARDA DA FRONTEIRA',
        'As fronteiras do norte e\ndo pântano estão fechadas.\nFale com o Rei Auren!'
      );
      return false;
    }

    if (targetMap === 'cobre_alto' && !gameState.getFlag('chave_cobre_recebida')) {
      this.dialogueBox.start(
        'PORTÃO DE COBRE-ALTO',
        'O portão de Cobre-Alto\nestá trancado! Você precisa\nda Chave de Cobre do Rei.'
      );
      return false;
    }

    if (targetMap === 'refugio_raizes' && !gameState.getFlag('refugio_aberto')) {
      this.dialogueBox.start(
        'FLORESTA DENSA',
        'As raízes antigas fecham\na passagem secreta da\nfloresta.'
      );
      return false;
    }

    if (targetMap === 'cripta_refino' && !gameState.getFlag('pedra_eco_obtida')) {
      this.dialogueBox.start(
        'ALTAR DO SANTUÁRIO',
        'O altar está selado!\nVocê precisa da Pedra do\nEco do Refúgio das Raízes.'
      );
      return false;
    }

    if (targetMap === 'templo_coracao' && !gameState.getFlag('ilha_acessivel')) {
      this.dialogueBox.start(
        'COSTA DO SOL',
        'O mar revolto impede a\ntravessia até a Ilha Veyra.'
      );
      return false;
    }

    return true;
  }

  private triggerWarp(warp: PendingWarp, isDoor = false): void {
    if (!this.canEnterWarp(warp.targetMap)) {
      soundManager.playSfx('error');
      return;
    }
    soundManager.playSfx(isDoor ? 'door' : 'stairs');
    this.warpState = 'fade_out';
    this.warpProgress = 0;
    this.pendingWarp = warp;
  }

  private handleHeroDefeat(): void {
    // Respawn do herói no último ponto de repouso (estalagem ou trono do rei)
    const pt = gameState.respawn();
    gameState.transport = 'foot';
    this.loadMap(pt.mapId, pt.tileX, pt.tileY, pt.dir);
  }

  public update(): void {
    // Garante que a música do mapa esteja ativa ao retornar de batalhas ou cenas sobrepostas
    const currentBgm = soundManager.getCurrentBgm();
    if (!currentBgm || currentBgm === 'battle' || currentBgm === 'boss') {
      this.syncMapBgm();
    }

    // 1. Processa animação de transição entre mapas (Warp Fade)
    if (this.warpState === 'fade_out') {
      this.warpProgress += 1 / CONFIG.ui.fadeFrames;
      if (this.warpProgress >= 1) {
        this.warpProgress = 1;
        if (this.pendingWarp) {
          gameState.transport = 'foot';
          this.loadMap(
            this.pendingWarp.targetMap,
            this.pendingWarp.targetX,
            this.pendingWarp.targetY,
            this.pendingWarp.targetDir,
            this.pendingWarp.targetWarp
          );
          this.pendingWarp = null;
        }
        this.warpState = 'fade_in';
      }
      return;
    }

    if (this.warpState === 'fade_in') {
      this.warpProgress -= 1 / CONFIG.ui.fadeFrames;
      if (this.warpProgress <= 0) {
        this.warpProgress = 0;
        this.warpState = 'none';
      }
      return;
    }

    // 2. Alterna overlay de debug com F2
    if (this.input.wasPressed('debug')) {
      this.showDebug = !this.showDebug;
    }

    // 3. Se houver caixa de diálogo ativa, ela recebe o input
    if (this.dialogueBox.isOpen()) {
      this.dialogueBox.update(this.input);
      return;
    }

    // 3.1 Evento do Terremoto (pós-Ato 1): o Passo do Santuário desaba e abre caminho
    if (this.quakeTimer > 0) {
      this.quakeTimer--;
      if (this.quakeTimer % 14 === 0) soundManager.playSfx('hit');
      if (this.quakeTimer === 0) this.finishEarthquake();
      return;
    }
    if (
      this.currentMapId === 'overworld' &&
      gameState.getFlag('ato1_concluido') &&
      !gameState.getFlag('terremoto_visto') &&
      !this.player.isMoving
    ) {
      gameState.setFlag('terremoto_visto', true);
      this.quakeTimer = 150;
      return;
    }

    // 4. Interação quando parado: Falar com NPC/Placa/Baú ou Abrir Menu
    if (!this.player.isMoving && this.input.wasPressed('confirm') && gameState.transport === 'balloon') {
      this.tryLandBalloon();
      return;
    }
    if (!this.player.isMoving && this.input.wasPressed('confirm')) {
      const talked = this.tryTalkToNpc();
      if (!talked) {
        // Se não houver entidade na frente, abre a janela de comandos
        this.sceneManager.push(
          new MenuScene(
            this.sceneManager,
            this.input,
            () => this.tryTalkToNpc(),
            () => this.openWorldMap()
          )
        );
      }
      return;
    }

    // Atalho direto para abrir mapa do reino com a tecla M
    if (!this.player.isMoving && this.input.wasPressed('map')) {
      this.openWorldMap();
      return;
    }

    // 5. Atualiza o jogador e os NPCs no grid com checagem mútua de colisão
    const visibleNpcs = this.npcs.filter((n) => n.isVisible());
    for (const npc of visibleNpcs) {
      npc.update(
        this.currentMap,
        visibleNpcs,
        this.player.tileX,
        this.player.tileY,
        this.player.isMoving ? this.player.targetTileX : undefined,
        this.player.isMoving ? this.player.targetTileY : undefined
      );
    }
    this.player.update(this.input, this.transportSolidMap, visibleNpcs);
    this.currentMap.update();

    // 6. Câmera segue o herói suavemente travada nas bordas
    this.camera.follow(this.player.pixelX, this.player.pixelY);

    // 7. Checa se o herói terminou um passo sobre um ponto de Warp ou Porta
    if (this.player.consumeStepFinished() && this.warpState === 'none') {
      gameState.updateLocation(
        this.currentMapId,
        this.player.tileX,
        this.player.tileY,
        this.player.direction
      );

      const currentTile = this.currentMap.getTileAt(this.player.tileX, this.player.tileY);

      // Embarque / desembarque de barco e balão no mapa-múndi
      if (this.currentMapId === 'overworld') {
        this.handleTransportAfterStep();
        if (gameState.transport === 'balloon') {
          return; // sobrevoando: sem portais, encontros ou eventos de terreno
        }
      }      const isDoorTile =
        currentTile?.kind === 'door' ||
        currentTile?.id === 'castle_gate' ||
        this.currentMap.mapType === 'interior';

      const warp = this.currentMap.getWarpAt(this.player.tileX, this.player.tileY);
      if (warp) {
        const isStairs = warp.trigger === 'stairs';
        if (!isStairs || CONFIG.map.stairsMode === 'auto') {
          this.triggerWarp(
            {
              targetMap: warp.targetMap,
              targetWarp: warp.targetWarp,
              targetX: warp.targetX,
              targetY: warp.targetY,
              targetDir: warp.arriveDir,
            },
            isDoorTile && !isStairs
          );
          return;
        }
      } else if (currentTile?.kind === 'door') {
        // Som ao atravessar portas e portões internos (ex: salões do Castelo Real)
        soundManager.playSfx('door');
      }

      // Saída pela borda do mapa (em cidades e castelos)
      if (this.currentMap.exitOnEdge) {
        const atEdge =
          this.player.tileX <= 0 ||
          this.player.tileX >= this.currentMap.width - 1 ||
          this.player.tileY <= 0 ||
          this.player.tileY >= this.currentMap.height - 1;

        if (atEdge && this.currentMap.edgeExit) {
          const edgeWarp = this.currentMap.getWarpByName(this.currentMap.edgeExit);
          if (edgeWarp) {
            this.triggerWarp(
              {
                targetMap: edgeWarp.targetMap,
                targetWarp: edgeWarp.targetWarp,
                targetX: edgeWarp.targetX,
                targetY: edgeWarp.targetY,
                targetDir: edgeWarp.arriveDir,
              },
              this.currentMap.mapType === 'interior'
            );
            return;
          }
        }
      }

      // 7.1 Checa encontro aleatório de batalha apenas em mapas perigosos (overworld, cavernas)
      if (!this.currentMap.isSafe) {
        if (currentTile && currentTile.encounterRate > 0) {
          const rateMultiplier = gameState.isNight() ? 1.25 : 1.0;
          if (Math.random() < currentTile.encounterRate * rateMultiplier) {
            const monster = rollEncounterForTerrain(
              currentTile.id,
              this.currentMapId === 'overworld' ? this.player.tileX : undefined,
              this.currentMapId === 'overworld' ? this.player.tileY : undefined
            );
            if (monster) {
              this.sceneManager.push(
                new BattleScene(
                  this.sceneManager,
                  this.input,
                  monster,
                  this.assetManager,
                  () => this.handleHeroDefeat()
                )
              );
              return;
            }
          }
        }
      }
    }

    // 8. Temporizador do banner
    if (this.locationBannerTimer > 0) {
      this.locationBannerTimer--;
    }
  }

  /**
   * Desenha uma "luz de saída" pulsante com uma seta sobre warps que ficam em piso comum
   * (cavernas, minas, interiores), para o jogador enxergar por onde sair.
   */
  private renderExitMarkers(renderer: Renderer): void {
    const mapType = this.currentMap.mapType;
    if (mapType !== 'caverna' && mapType !== 'interior') return;

    const plainFloors = new Set(['cave_floor', 'wood_floor', 'castle_floor']);
    const pulse = Math.floor(Date.now() / 350) % 2 === 0;

    for (const warp of this.currentMap.getWarps()) {
      if (warp.trigger === 'stairs') continue;
      const tile = this.currentMap.getTileAt(warp.tileX, warp.tileY);
      if (!tile || !plainFloors.has(tile.id)) continue;

      const pos = this.camera.toScreen(warp.tileX * 16, warp.tileY * 16);
      if (pos.x < -16 || pos.x > CONFIG.screen.width || pos.y < -16 || pos.y > CONFIG.screen.height) continue;

      // Brilho de portal
      renderer.fillRect(pos.x, pos.y, 16, 16, NES_COLORS.DARK_BLUE);
      renderer.fillRect(pos.x + 1, pos.y + 1, 14, 14, pulse ? NES_COLORS.LIGHT_BLUE : NES_COLORS.CYAN);
      renderer.fillRect(pos.x + 3, pos.y + 3, 10, 10, NES_COLORS.WHITE);

      // Seta apontando para o lado oposto ao da chegada (direção da saída)
      const dx = warp.arriveDir === 'left' ? 1 : warp.arriveDir === 'right' ? -1 : 0;
      const dy = warp.arriveDir === 'up' ? 1 : warp.arriveDir === 'down' ? -1 : 0;
      const cx = pos.x + 8;
      const cy = pos.y + 8;
      const c = NES_COLORS.DARK_BLUE;
      for (let i = 0; i < 4; i++) {
        // ponta da seta e asas
        const tipX = cx + dx * 4;
        const tipY = cy + dy * 4;
        const bx = tipX - dx * i;
        const by = tipY - dy * i;
        if (dx === 0) {
          renderer.fillRect(bx - i, by, i * 2 + 1, 1, c);
        } else {
          renderer.fillRect(bx, by - i, 1, i * 2 + 1, c);
        }
      }
    }
  }

  /** Colisão do herói conforme o meio de transporte atual. */
  private isSolidForTransport(x: number, y: number): boolean {
    const map = this.currentMap;
    if (this.currentMapId !== 'overworld') return map.isSolid(x, y);

    const inBounds = x >= 0 && x < map.width && y >= 0 && y < map.height;
    const transport = gameState.transport;

    if (transport === 'balloon') return !inBounds;

    if (transport === 'boat') {
      if (!inBounds) return true;
      if (map.getTileAt(x, y)?.id === 'water') return false;
      return map.isSolid(x, y);
    }

    // A pé: pode encostar no barco ancorado para embarcar
    const boat = gameState.boatPos;
    if (boat && boat.x === x && boat.y === y) return false;
    return map.isSolid(x, y);
  }

  /** Processa embarque (pisar no veículo) e desembarque (barco chegando à terra) após cada passo. */
  private handleTransportAfterStep(): void {
    const px = this.player.tileX;
    const py = this.player.tileY;
    const transport = gameState.transport;

    if (transport === 'foot') {
      const boat = gameState.boatPos;
      const balloon = gameState.balloonPos;
      if (boat && boat.x === px && boat.y === py) {
        gameState.transport = 'boat';
        gameState.boatPos = null;
        soundManager.playSfx('confirm');
      } else if (balloon && balloon.x === px && balloon.y === py) {
        gameState.transport = 'balloon';
        gameState.balloonPos = null;
        soundManager.playSfx('stairs');
        this.dialogueBox.start(
          'BALÃO',
          'Você sobe no balão e voa\nsobre qualquer terreno!\n---\nAperte Z (confirmar) sobre\num terreno livre para pousar.'
        );
      }
      return;
    }

    if (transport === 'boat') {
      const tile = this.currentMap.getTileAt(px, py);
      if (tile?.id !== 'water') {
        // Desembarcou: o barco fica ancorado no último tile de água percorrido
        const dx = this.player.direction === 'left' ? 1 : this.player.direction === 'right' ? -1 : 0;
        const dy = this.player.direction === 'up' ? 1 : this.player.direction === 'down' ? -1 : 0;
        gameState.boatPos = { x: px + dx, y: py + dy };
        gameState.transport = 'foot';
        soundManager.playSfx('cursor');
      }
    }
  }

  /** Tenta pousar o balão no tile atual (só em terreno livre e sem portal). */
  private tryLandBalloon(): void {
    const px = this.player.tileX;
    const py = this.player.tileY;
    const tile = this.currentMap.getTileAt(px, py);
    const ok =
      tile !== null &&
      !tile.solid &&
      tile.id !== 'water' &&
      tile.kind !== 'entrance' &&
      !this.currentMap.getWarpAt(px, py);
    if (!ok) {
      soundManager.playSfx('error');
      this.dialogueBox.start('BALÃO', 'Não há onde pousar aqui.\nProcure um terreno livre!');
      return;
    }
    gameState.balloonPos = { x: px, y: py };
    gameState.transport = 'foot';
    soundManager.playSfx('stairs');
  }

  /** Desenha barco e balão estacionados e o veículo em uso pelo herói. */
  private renderVehicle(
    renderer: Renderer,
    kind: 'boat' | 'balloon',
    pixelX: number,
    pixelY: number,
    airborne = false
  ): void {
    const sprite = getVehicleSprite(kind);
    const pos = this.camera.toScreen(pixelX, pixelY);
    if (pos.x < -16 || pos.x > CONFIG.screen.width || pos.y < -16 || pos.y > CONFIG.screen.height) return;
    if (airborne) {
      const bob = Math.floor(Date.now() / 300) % 2;
      renderer.fillRect(pos.x + 3, pos.y + 13, 10, 2, NES_COLORS.DARK_GRAY);
      renderer.drawSprite(sprite, pos.x, pos.y - 6 - bob);
    } else {
      renderer.drawSprite(sprite, pos.x, pos.y);
    }
  }

  /** Conclui o terremoto: reabre os tiles originais do Passo do Santuário e exibe a vinheta cinematográfica. */
  private finishEarthquake(): void {
    if (this.currentMapId === 'overworld') {
      this.currentMap.setTileAt(82, 39, 'path');
      this.currentMap.setTileAt(83, 39, 'grass');
      for (let y = 40; y <= 45; y++) {
        this.currentMap.setTileAt(82, y, 'path');
        this.currentMap.setTileAt(83, y, 'path');
      }
    }
    soundManager.playSfx('stairs');
    const vignette = new VignetteScene(
      this.sceneManager,
      this.input,
      'terremoto_passo',
      'O Passo Desaba',
      [
        'O chão estremece com força!\nUm eco ressoa por todo o vale...',
        'No desfiladeiro a leste, um\ntrecho maciço de rocha racha\ne desaba num estrondo!',
        'A poeira sobe e uma fresta\nescura revela o caminho de\nterra no Passo do Santuário.',
        'A passagem a leste se abriu e\na ponte ao sul está livre!\nSiga ao sul rumo ao Porto do Sol!',
      ],
      () => {
        this.sceneManager.pop();
        gameState.setFlag('terremoto_visto', true);
        gameState.setFlag('passo_desabado', true);
      }
    );
    this.sceneManager.push(vignette);
  }

  public render(renderer: Renderer): void {
    // 1. Limpa tela com fundo preto (interiores menores ficam centralizados com fundo preto)
    renderer.clear(NES_COLORS.BLACK);

    // Tremor de tela durante o terremoto
    const shaking = this.quakeTimer > 0;
    if (shaking) {
      renderer.ctx.save();
      renderer.ctx.translate(Math.round((Math.random() - 0.5) * 6), Math.round((Math.random() - 0.5) * 6));
    }

    // 2. Renderiza tiles visíveis do mapa
    this.currentMap.render(renderer, this.camera, this.assetManager);

    // 2.1 Marcadores visuais de saída (warps sobre piso comum em cavernas e interiores)
    this.renderExitMarkers(renderer);
    // 3. Renderiza NPCs
    for (const npc of this.npcs) {
      npc.render(renderer, this.camera, this.assetManager);
    }

    // 4. Renderiza veículos estacionados e o herói (a bordo de barco/balão, se for o caso)
    if (this.currentMapId === 'overworld') {
      const boat = gameState.boatPos;
      const balloon = gameState.balloonPos;
      if (boat) this.renderVehicle(renderer, 'boat', boat.x * 16, boat.y * 16);
      if (balloon) this.renderVehicle(renderer, 'balloon', balloon.x * 16, balloon.y * 16);
      if (gameState.transport === 'boat') {
        this.renderVehicle(renderer, 'boat', this.player.pixelX, this.player.pixelY);
      }
    }
    if (gameState.transport !== 'balloon') {
      this.player.render(renderer, this.camera, this.assetManager);
    } else {
      this.renderVehicle(renderer, 'balloon', this.player.pixelX, this.player.pixelY, true);
    }

    if (shaking) renderer.ctx.restore();

    // 4.1 Filtro de luar noturno estilo 8-bit (aplica-se a mapas exteriores e cidades durante a noite)
    if (gameState.isNight() && this.currentMap.mapType !== 'caverna') {
      const tint = this.currentMap.mapType === 'interior' ? 0.28 : 0.52;
      renderer.drawNightTint(tint);
    }

    // 5. Banner de localização (exibido na entrada de cada mapa)
    if (this.locationBannerTimer > 0) {
      let displayTitle = this.locationBannerTitle;
      if (gameState.isNight() && this.currentMap.mapType !== 'caverna') {
        displayTitle += ' (NOITE)';
      }
      const bannerW = Math.max(160, renderer.measureText(displayTitle) + 24);
      const bannerH = 24;
      const bannerX = Math.floor((CONFIG.screen.width - bannerW) / 2);
      const bannerY = 8;

      renderer.drawWindow(bannerX, bannerY, bannerW, bannerH, NES_COLORS.BLACK);
      const textW = renderer.measureText(displayTitle);
      const textX = bannerX + Math.floor((bannerW - textW) / 2);
      renderer.drawText(displayTitle, textX, bannerY + 8, {
        color: NES_COLORS.GOLD,
      });
    }

    // 6. Dica discreta de controles no rodapé (apenas se diálogo fechado)
    if (!this.dialogueBox.isOpen()) {
      const hintText = '[ENTER] COMANDOS  [M] MAPA';
      renderer.drawText(hintText, 6, CONFIG.screen.height - 12, {
        color: NES_COLORS.WHITE,
      });
    }

    // 7. Caixa de diálogo clássica (letra por letra com indicador piscante)
    if (this.dialogueBox.isOpen()) {
      this.dialogueBox.render(renderer);
    }

    // 8. Transição de Warp em fade
    if (this.warpState !== 'none') {
      renderer.drawFade(this.warpProgress);
    }

    // 9. Overlay de depuração (F2)
    if (this.showDebug) {
      this.renderDebugOverlay(renderer);
    }
  }

  private renderDebugOverlay(renderer: Renderer): void {
    const dbgX = 6;
    const dbgY = 6;
    const dbgW = 150;
    const dbgH = 74;

    renderer.drawWindow(dbgX, dbgY, dbgW, dbgH, NES_COLORS.BLACK);

    const currentTile = this.currentMap.getTileAt(this.player.tileX, this.player.tileY);
    const tileName = currentTile ? currentTile.name : 'Vazio';

    renderer.drawText(`DEBUG (F2)`, dbgX + 6, dbgY + 6, { color: NES_COLORS.GOLD });
    renderer.drawText(`Mapa: ${this.currentMapId}`, dbgX + 6, dbgY + 18, {
      color: NES_COLORS.WHITE,
    });
    renderer.drawText(`Grid: X:${this.player.tileX} Y:${this.player.tileY}`, dbgX + 6, dbgY + 30, {
      color: NES_COLORS.WHITE,
    });
    renderer.drawText(`Tile: ${tileName}`, dbgX + 6, dbgY + 42, {
      color: NES_COLORS.LIGHT_BLUE,
    });
    renderer.drawText(`NPCs: ${this.npcs.length}`, dbgX + 6, dbgY + 54, {
      color: NES_COLORS.PALE_GREEN,
    });
  }

  public triggerBattle(monsterId = 'gosma_cinza'): void {
    const monster = getMonsterDef(monsterId) || getMonsterDef('gosma_cinza')!;
    this.sceneManager.push(
      new BattleScene(
        this.sceneManager,
        this.input,
        monster,
        this.assetManager,
        () => this.handleHeroDefeat()
      )
    );
  }
}
