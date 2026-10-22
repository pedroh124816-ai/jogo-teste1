/**
 * Paleta de cores inspirada no NES (Nintendo Entertainment System)
 * para manter a autenticidade estética de Dragon Quest (1986).
 *
 * Cada cor é mapeada para um índice ou valor hexadecimal.
 */
export const NES_COLORS = {
  // Pretos e neutros
  BLACK: '#000000',
  DARK_GRAY: '#444444',
  MED_GRAY: '#7c7c7c',
  LIGHT_GRAY: '#bcbcbc',
  WHITE: '#fcfcfc',

  // Azuis (típicos de janelas de diálogo e água do DQ)
  NAVY_BLUE: '#001858',
  DARK_BLUE: '#002888',
  BLUE: '#2038ec',
  LIGHT_BLUE: '#3cbcfc',
  CYAN: '#74dcff',

  // Verdes (grama, floresta)
  DEEP_GREEN: '#004800',
  FOREST_GREEN: '#007800',
  GRASS_GREEN: '#58b838',
  PALE_GREEN: '#b8f818',

  // Amarelos, Terrosos e Areia
  DARK_BROWN: '#503000',
  BROWN: '#885818',
  DIRT: '#a85000',
  SAND: '#e4a050',
  GOLD: '#f8b800',
  YELLOW: '#f8d878',

  // Vermelhos e Tom de Pele
  DARK_RED: '#881400',
  RED: '#d82800',
  SKIN: '#fca044',
  LIGHT_SKIN: '#f8d8b0',
} as const;

export type NesColorName = keyof typeof NES_COLORS;

/**
 * Paleta ativa da tela para verificação de limite de cores.
 * Dragon Quest no NES usava menos de 16 cores por cena simultaneamente.
 */
export class PaletteMonitor {
  private activeColors = new Set<string>();

  public reset(): void {
    this.activeColors.clear();
  }

  public register(color: string): void {
    if (color && color !== 'transparent') {
      this.activeColors.add(color.toLowerCase());
    }
  }

  public getColorCount(): number {
    return this.activeColors.size;
  }

  public getActiveColors(): string[] {
    return Array.from(this.activeColors);
  }
}
