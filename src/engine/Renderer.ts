import { CONFIG } from '../config';
import { BitmapFont, DrawTextOptions } from './BitmapFont';
import { Sprite } from '../assets/AssetManager';
import { NES_COLORS, PaletteMonitor } from './Palette';

export class Renderer {
  public readonly width = CONFIG.screen.width; // 256
  public readonly height = CONFIG.screen.height; // 224

  public readonly canvas: HTMLCanvasElement;
  public readonly ctx: CanvasRenderingContext2D;
  public readonly font: BitmapFont;
  public readonly paletteMonitor: PaletteMonitor;

  private currentScale = 1;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = this.canvas.getContext('2d', { alpha: false });
    if (!ctx) {
      throw new Error('Falha ao obter contexto 2D do Canvas.');
    }
    this.ctx = ctx;

    // Garante que o buffer interno seja exatamente 256x224
    this.canvas.width = this.width;
    this.canvas.height = this.height;

    this.font = new BitmapFont();
    this.paletteMonitor = new PaletteMonitor();

    // Desativa suavização no canvas interno
    this.disableSmoothing();

    // Configura redimensionamento com escala inteira
    this.handleResize();
    window.addEventListener('resize', () => this.handleResize());
  }

  public disableSmoothing(): void {
    this.ctx.imageSmoothingEnabled = false;
    // Tipagens legadas de navegadores
    (this.ctx as unknown as { mozImageSmoothingEnabled?: boolean }).mozImageSmoothingEnabled = false;
    (this.ctx as unknown as { webkitImageSmoothingEnabled?: boolean }).webkitImageSmoothingEnabled = false;
    (this.ctx as unknown as { msImageSmoothingEnabled?: boolean }).msImageSmoothingEnabled = false;
  }

  /**
   * Calcula o maior fator de escala inteiro que cabe na janela (ex: 2x, 3x, 4x, etc.)
   * Isso evita artefatos onde alguns pixels aparentam ter tamanhos desiguais.
   */
  public handleResize(): void {
    const windowW = window.innerWidth;
    const windowH = window.innerHeight;

    const scaleX = Math.floor(windowW / this.width);
    const scaleY = Math.floor(windowH / this.height);
    let scale = Math.min(scaleX, scaleY);

    if (scale < 1) scale = 1;
    this.currentScale = scale;

    const displayW = this.width * scale;
    const displayH = this.height * scale;

    this.canvas.style.width = `${displayW}px`;
    this.canvas.style.height = `${displayH}px`;
  }

  public getScale(): number {
    return this.currentScale;
  }

  /**
   * Limpa o canvas com uma cor sólida.
   */
  public clear(color: string = NES_COLORS.BLACK): void {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(0, 0, this.width, this.height);
    this.disableSmoothing();
  }

  /**
   * Desenha um sprite 16x16 ou de qualquer dimensão na posição inteira.
   */
  public drawSprite(sprite: Sprite, x: number, y: number): void {
    this.ctx.drawImage(sprite.canvas, Math.round(x), Math.round(y));
  }

  /**
   * Desenha texto usando a fonte bitmap 8x8.
   */
  public drawText(text: string, x: number, y: number, options: DrawTextOptions = {}): void {
    this.font.drawText(this.ctx, text, x, y, options);
  }

  public measureText(text: string): number {
    return this.font.measureWidth(text);
  }

  /**
   * Desenha uma janela clássica estilo Dragon Quest NES:
   * - Fundo preto puro ou azul escuro
   * - Borda branca com cantos arredondados de 1 pixel e moldura dupla
   */
  public drawWindow(
    x: number,
    y: number,
    width: number,
    height: number,
    bgColor: string = NES_COLORS.BLACK
  ): void {
    const rx = Math.round(x);
    const ry = Math.round(y);
    const rw = Math.round(width);
    const rh = Math.round(height);

    // Fundo interno
    this.ctx.fillStyle = bgColor;
    this.ctx.fillRect(rx + 2, ry + 2, rw - 4, rh - 4);

    // Borda branca estilo NES Dragon Quest:
    // Cantos arredondados (chanfrados em 1-2px)
    this.ctx.fillStyle = NES_COLORS.WHITE;

    // Linhas horizontais externas
    this.ctx.fillRect(rx + 2, ry, rw - 4, 1);
    this.ctx.fillRect(rx + 2, ry + rh - 1, rw - 4, 1);

    // Linhas verticais externas
    this.ctx.fillRect(rx, ry + 2, 1, rh - 4);
    this.ctx.fillRect(rx + rw - 1, ry + 2, 1, rh - 4);

    // Pontos dos cantos chanfrados (1px diagonal)
    this.ctx.fillRect(rx + 1, ry + 1, 1, 1);
    this.ctx.fillRect(rx + rw - 2, ry + 1, 1, 1);
    this.ctx.fillRect(rx + 1, ry + rh - 2, 1, 1);
    this.ctx.fillRect(rx + rw - 2, ry + rh - 2, 1, 1);

    // Linha interna decorativa Dragon Quest (separação de 2 pixels)
    if (rw >= 12 && rh >= 12) {
      this.ctx.fillStyle = NES_COLORS.WHITE;
      // Topo & Base internos
      this.ctx.fillRect(rx + 3, ry + 2, rw - 6, 1);
      this.ctx.fillRect(rx + 3, ry + rh - 3, rw - 6, 1);
      // Laterais internas
      this.ctx.fillRect(rx + 2, ry + 3, 1, rh - 6);
      this.ctx.fillRect(rx + rw - 3, ry + 3, 1, rh - 6);
    }
  }

  /**
   * Fade em degraus estilo NES (quantizado em steps, não gradiente suave contínuo).
   * progress: 0 (totalmente visível) a 1 (totalmente escuro).
   */
  public drawFade(progress: number, steps = CONFIG.ui.fadeSteps): void {
    if (progress <= 0) return;
    const clamped = Math.min(1, Math.max(0, progress));
    // Quantiza o progresso em degraus
    const stepValue = Math.floor(clamped * steps) / steps;
    if (stepValue <= 0) return;

    this.ctx.fillStyle = `rgba(0, 0, 0, ${stepValue})`;
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  /**
   * Filtro de iluminação noturna estilo NES (azul-marinho escuro e profundo).
   * intensity: opacidade da noite (padrão 0.52).
   */
  public drawNightTint(intensity = 0.52): void {
    if (intensity <= 0) return;
    const alpha = Math.min(0.75, Math.max(0.1, intensity));
    this.ctx.fillStyle = `rgba(10, 16, 44, ${alpha})`;
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  /**
   * Desenha retângulo colorido preenchido.
   */
  public fillRect(x: number, y: number, w: number, h: number, color: string): void {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  }
}
