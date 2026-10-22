import { FONT_GLYPHS } from '../assets/fontGraphics';

export interface DrawTextOptions {
  color?: string;
  lineHeight?: number;
}

export class BitmapFont {
  public readonly charWidth = 8;
  public readonly charHeight = 8;

  // Cache de canvas para glifos por cor: cache[cor][char] = HTMLCanvasElement
  private glyphCache: Map<string, Map<string, HTMLCanvasElement>> = new Map();

  constructor() {}

  /**
   * Obtém ou cria a imagem rasterizada de 8x8 pixels para um caractere em uma cor.
   */
  private getGlyphCanvas(char: string, color: string): HTMLCanvasElement {
    let colorMap = this.glyphCache.get(color);
    if (!colorMap) {
      colorMap = new Map();
      this.glyphCache.set(color, colorMap);
    }

    let canvas = colorMap.get(char);
    if (canvas) return canvas;

    canvas = document.createElement('canvas');
    canvas.width = this.charWidth;
    canvas.height = this.charHeight;
    const ctx = canvas.getContext('2d')!;

    // Caractere desconhecido cai para '?' ou espaço
    const rows = FONT_GLYPHS[char] || FONT_GLYPHS['?'] || FONT_GLYPHS[' '];

    ctx.fillStyle = color;
    for (let y = 0; y < 8; y++) {
      const row = rows[y] || '........';
      for (let x = 0; x < 8; x++) {
        if (row[x] === '#') {
          ctx.fillRect(x, y, 1, 1);
        }
      }
    }

    colorMap.set(char, canvas);
    return canvas;
  }

  /**
   * Desenha um texto (com suporte a quebras de linha '\n') na posição (x, y).
   */
  public drawText(
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    options: DrawTextOptions = {}
  ): void {
    const color = options.color ?? '#fcfcfc';
    const lineHeight = options.lineHeight ?? 8;

    let curX = Math.floor(x);
    let curY = Math.floor(y);

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      if (char === '\n') {
        curX = Math.floor(x);
        curY += lineHeight;
        continue;
      }

      if (char !== ' ') {
        const glyph = this.getGlyphCanvas(char, color);
        ctx.drawImage(glyph, curX, curY);
      }
      curX += this.charWidth;
    }
  }

  /**
   * Mede a largura em pixels de uma linha de texto.
   */
  public measureWidth(text: string): number {
    const lines = text.split('\n');
    let maxLen = 0;
    for (const line of lines) {
      if (line.length > maxLen) maxLen = line.length;
    }
    return maxLen * this.charWidth;
  }
}
