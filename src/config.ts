/**
 * Constantes globais de jogo.
 * Ajuste aqui ritmo, controles e comportamento sem mexer em engine/cenas.
 * Todos os tempos são em FRAMES de lógica (1 frame = 1/updatesPerSecond s).
 */
export const CONFIG = {
  game: {
    title: 'Lenda de Luminário',
    subtitle: 'Capítulo I: O Despertar',
    version: 'v0.1',
  },

  screen: {
    /** Resolução interna (NES). A tela é escalada por um fator inteiro. */
    width: 256,
    height: 224,
    tileSize: 16,
    /** Limite de cores por tela; acima disso a engine emite aviso no console. */
    maxColorsPerScreen: 16,
  },

  loop: {
    /** Taxa fixa da lógica (fixed timestep). */
    updatesPerSecond: 60,
    /** Máximo de updates por frame de render (evita "espiral da morte"). */
    maxUpdatesPerFrame: 5,
  },

  /** Teclas por ação (valores de KeyboardEvent.code). */
  controls: {
    up: ['ArrowUp', 'KeyW'],
    down: ['ArrowDown', 'KeyS'],
    left: ['ArrowLeft', 'KeyA'],
    right: ['ArrowRight', 'KeyD'],
    confirm: ['Enter', 'KeyZ'],
    cancel: ['Escape', 'KeyX'],
    map: ['KeyM'],
    debug: ['F2'],
    debugBattle: ['F4'],
  },

  player: {
    /** Duração de um passo (frames para atravessar 1 tile de 16 px). */
    stepFrames: 16,
    /** Frames entre trocas do quadro de animação de caminhada. */
    walkAnimFrames: 12,
    /** No DQ clássico o herói "marcha" mesmo parado. */
    animateWhenIdle: true,
    startTile: { x: 36, y: 50 },
    startDirection: 'down',
  },

  map: {
    /** Semente fixa para geração determinística da costa do Overworld. */
    worldSeed: 20261015,
    /** Frames entre os quadros da animação da água. */
    waterAnimFrames: 40,
    /** Modo de ativação de escadas: 'auto' (ao pisar) ou 'command' (pelo menu). */
    stairsMode: 'auto' as 'auto' | 'command',
  },

  ui: {
    /** Duração de cada metade do fade (saída e entrada). */
    fadeFrames: 16,
    /** Degraus de escurecimento do fade (estilo NES, sem gradiente suave). */
    fadeSteps: 4,
    pressStartBlinkFrames: 30,
    cursorBlinkFrames: 16,
    /** Velocidade do texto: frames por caractere (0 = instantâneo). */
    textFramesPerChar: 2,
    /** Linhas por página na janela de mensagens. */
    messageLines: 3,
    /** Frames parado até a janela de status aparecer no mapa. */
    idleStatusFrames: 45,
  },

  debug: {
    /** Overlay de debug (FPS, cores, posição) ligado ao iniciar. Alterna com F2. */
    overlayOnStart: false,
    warnOnColorOverflow: true,
  },
} as const;
