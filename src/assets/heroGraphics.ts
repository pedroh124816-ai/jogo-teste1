import { NES_COLORS } from '../engine/Palette';
import { PixelMatrix } from './tileGraphics';

export type Direction = 'up' | 'down' | 'left' | 'right';

const HERO_PALETTE: Record<string, string> = {
  '.': 'transparent',
  'k': NES_COLORS.BLACK,
  'g': NES_COLORS.GOLD,
  'y': NES_COLORS.YELLOW,
  's': NES_COLORS.SKIN,
  'p': NES_COLORS.LIGHT_SKIN,
  'b': NES_COLORS.BLUE,
  'c': NES_COLORS.LIGHT_BLUE,
  'n': NES_COLORS.CYAN,
  'r': NES_COLORS.RED,
  'd': NES_COLORS.DARK_RED,
  'w': NES_COLORS.WHITE,
  'm': NES_COLORS.MED_GRAY,
  't': NES_COLORS.DARK_BROWN,
};

/**
 * Sprite 16x16 do Protagonista ([NOME], o Filho de Aneth).
 *
 * Elementos de design (conforme personagens.md):
 * - Cabelos dourado-claros (g/y): herança genética Veyra (Aneth).
 * - Túnica azul-real (b) e capa curta carmesim (r/d): campeão de Luminário.
 * - Medalhão de Alvorada no centro do peito (aro dourado g + núcleo ciano n/c).
 * - Espada de Alvorada (lâmina w, guarda g) visível nos perfis laterais.
 * - Animação de caminhada em 2 frames:
 *   - down/up: alternância simétrica pé esquerdo à frente / pé direito à frente sem deslocamento lateral.
 *   - left/right: alternância clássica passo aberto (passada) / passo fechado (pernas unidas sob o corpo).
 */
export const HERO_RAW_DATA: Record<Direction, [PixelMatrix, PixelMatrix]> = {
  // Olhando para BAIXO (frente: Medalhão de Alvorada visível no peito)
  down: [
    // Frame 0: pé esquerdo dá o passo à frente, pé direito em apoio
    [
      '.....kggggk.....',
      '....kgyyyygk....',
      '...kgggyygggk...',
      '...kggssssggk...',
      '...kgskssksgk...',
      '...kgssssssgk...',
      '....kssssssk....',
      '..krkbbggbbkrk..',
      '.krrkbbnnbbkrrk.',
      '.kdrkbbccbbkrdk.',
      '..kkttgygttk....',
      '..kbbbbbbbbk....',
      '...kbbk..kbbk...',
      '...kttk..kttk...',
      '..ktttk..kttk...',
      '...kkk....kk....',
    ],
    // Frame 1: pé direito dá o passo à frente, pé esquerdo em apoio
    [
      '.....kggggk.....',
      '....kgyyyygk....',
      '...kgggyygggk...',
      '...kggssssggk...',
      '...kgskssksgk...',
      '...kgssssssgk...',
      '....kssssssk....',
      '..krkbbggbbkrk..',
      '.krrkbbnnbbkrrk.',
      '.kdrkbbccbbkrdk.',
      '..kkttgygttk....',
      '..kbbbbbbbbk....',
      '...kbbk..kbbk...',
      '...kttk..kttk...',
      '...kttk..ktttk..',
      '....kk....kkk...',
    ],
  ],

  // Olhando para CIMA (costas: capa carmesim de Luminário com dobras em d)
  up: [
    // Frame 0: pé esquerdo dá o passo à frente
    [
      '.....kggggk.....',
      '....kgyyyygk....',
      '...kgggyygggk...',
      '...kggggggggk...',
      '...kgyyyyyygk...',
      '...kggggggggk...',
      '....kttttttkk...',
      '..kkrrrrrrrrkk..',
      '.krrdrrrrrrdrrk.',
      '.krrdrrrrrrdrrk.',
      '.krrrrrrrrrrrrk.',
      '.kddddrrrrrrrrk.',
      '..krrk....krrk..',
      '...kttk..kttk...',
      '..ktttk..kttk...',
      '...kkk....kk....',
    ],
    // Frame 1: pé direito dá o passo à frente
    [
      '.....kggggk.....',
      '....kgyyyygk....',
      '...kgggyygggk...',
      '...kggggggggk...',
      '...kgyyyyyygk...',
      '...kggggggggk...',
      '....kttttttkk...',
      '..kkrrrrrrrrkk..',
      '.krrdrrrrrrdrrk.',
      '.krrdrrrrrrdrrk.',
      '.krrrrrrrrrrrrk.',
      '.krrrrrrrrddddk.',
      '..krrk....krrk..',
      '...kttk..kttk...',
      '...kttk..ktttk..',
      '....kk....kkk...',
    ],
  ],

  // Olhando para a ESQUERDA (perfil com capa vermelha, Medalhão ciano e Espada de Alvorada)
  left: [
    // Frame 0: passo aberto (perna dianteira avança para a esquerda, traseira estendida atrás)
    [
      '....kggggk......',
      '...kgyyyygk.....',
      '..kgggyyyggk....',
      '..kggssssggk....',
      '..ksksssggk.....',
      '..ksssssgk......',
      '...kssssk.......',
      '..kcnkbbkrk.....',
      '.kwwgkbbbkrrk...',
      '.kwwkbbcckrdk...',
      '..kgkbbttkrrk...',
      '...kkbbbbkrdk...',
      '....kbbbbk.kk...',
      '..kttk..kttk....',
      '.ktttk...kttk...',
      '..kkk.....kk....',
    ],
    // Frame 1: passo fechado (pernas se encontram no centro de apoio sob o corpo)
    [
      '....kggggk......',
      '...kgyyyygk.....',
      '..kgggyyyggk....',
      '..kggssssggk....',
      '..ksksssggk.....',
      '..ksssssgk......',
      '...kssssk.......',
      '..kcnkbbkrk.....',
      '.kwwgkbbbkrrk...',
      '.kwwkbbcckrdk...',
      '..kgkbbttkrrk...',
      '...kkbbbbkrdk...',
      '....kbbbbk.kk...',
      '....kttttk......',
      '...kttttk.......',
      '....kkkk........',
    ],
  ],

  // Olhando para a DIREITA (perfil espelhado com capa, Medalhão e Espada de Alvorada)
  right: [
    // Frame 0: passo aberto (perna dianteira avança para a direita, traseira estendida atrás)
    [
      '......kggggk....',
      '.....kgyyyygk...',
      '....kgggyyyggk..',
      '....kggssssggk..',
      '.....kggsssksk..',
      '......kgsssssk..',
      '.......kssssk...',
      '.....krkbbknck..',
      '...krrkbbbgwwk..',
      '...kdrkccbbkwwk.',
      '...krrkttbbkgk..',
      '...kdrkbbbbkk...',
      '...kk.kbbbbk....',
      '....kttk..kttk..',
      '...kttk...ktttk.',
      '....kk.....kkk..',
    ],
    // Frame 1: passo fechado (pernas se encontram no centro de apoio sob o corpo)
    [
      '......kggggk....',
      '.....kgyyyygk...',
      '....kgggyyyggk..',
      '....kggssssggk..',
      '.....kggsssksk..',
      '......kgsssssk..',
      '.......kssssk...',
      '.....krkbbknck..',
      '...krrkbbbgwwk..',
      '...kdrkccbbkwwk.',
      '...krrkttbbkgk..',
      '...kdrkbbbbkk...',
      '...kk.kbbbbk....',
      '......kttttk....',
      '.......kttttk...',
      '........kkkk....',
    ],
  ],
};

export { HERO_PALETTE };
