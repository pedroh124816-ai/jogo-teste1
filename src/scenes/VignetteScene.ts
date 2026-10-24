import { Scene } from '../engine/Scene';
import { Renderer } from '../engine/Renderer';
import { Input } from '../engine/Input';
import { SceneManager } from '../engine/SceneManager';
import { NES_COLORS } from '../engine/Palette';
import { CONFIG } from '../config';
import { getCutsceneCanvas, getCutsceneData, CutsceneGraphicData } from '../assets/cutsceneGraphics';
import { soundManager } from '../engine/AudioManager';

export class VignetteScene implements Scene {
  public readonly name = 'VignetteScene';
  public readonly isTransparent = false;

  private input: Input;
  private cutsceneId: string;
  private speakerName: string;
  private pages: string[];
  private onFinished: () => void;

  private data: CutsceneGraphicData | null = null;
  private frameTimer = 0;
  private currentFrame = 0;

  private currentPage = 0;
  private visibleChars = 0;
  private textTimer = 0;
  private isPageComplete = false;
  private cursorBlink = 0;

  constructor(
    _sceneManager: SceneManager,
    input: Input,
    cutsceneId: string,
    speakerName: string,
    textOrPages: string | string[],
    onFinished: () => void
  ) {
    this.input = input;
    this.cutsceneId = cutsceneId;
    this.speakerName = speakerName;
    this.onFinished = onFinished;

    const rawPages = Array.isArray(textOrPages)
      ? textOrPages
      : textOrPages.split(/\n---\n|\n\n/).map((p) => p.trim());

    this.pages = rawPages.map((p) => this.wrapPageText(p, 27));

    this.data = getCutsceneData(cutsceneId);
  }

  private wrapPageText(page: string, maxCharsPerLine = 27): string {
    const rawLines = page.split('\n');
    const wrapped: string[] = [];
    for (const rawLine of rawLines) {
      if (rawLine.length <= maxCharsPerLine) {
        wrapped.push(rawLine);
        continue;
      }
      const words = rawLine.split(' ');
      let current = '';
      for (const word of words) {
        if (!current) {
          current = word;
        } else if (current.length + 1 + word.length <= maxCharsPerLine) {
          current += ' ' + word;
        } else {
          wrapped.push(current);
          current = word;
        }
      }
      if (current) wrapped.push(current);
    }
    return wrapped.join('\n');
  }

  public enter(): void {
    this.frameTimer = 0;
    this.currentFrame = 0;
    this.currentPage = 0;
    this.visibleChars = 0;
    this.textTimer = 0;
    this.isPageComplete = false;
    this.cursorBlink = 0;
  }

  public update(): void {
    this.cursorBlink++;
    this.frameTimer++;

    // Alternância de quadros de animação (respiração/chamas)
    if (this.data && this.data.frames.length > 1) {
      const ticksPerFrame = Math.max(10, Math.floor(60 / (this.data.fps || 1.5)));
      if (this.frameTimer >= ticksPerFrame) {
        this.frameTimer = 0;
        this.currentFrame = (this.currentFrame + 1) % this.data.frames.length;
      }
    }

    // Máquina de escrever do texto
    const text = this.pages[this.currentPage] || '';
    if (!this.isPageComplete) {
      this.textTimer++;
      if (this.textTimer >= 2) {
        this.textTimer = 0;
        this.visibleChars++;
        if (this.visibleChars >= text.length) {
          this.visibleChars = text.length;
          this.isPageComplete = true;
        }
      }

      // Apertar confirm acelera o texto
      if (this.input.wasPressed('confirm') || this.input.wasPressed('cancel')) {
        this.visibleChars = text.length;
        this.isPageComplete = true;
        return;
      }
      return;
    }

    // Página completa: aguarda avanço
    if (this.input.wasPressed('confirm') || this.input.wasPressed('cancel')) {
      soundManager.playSfx('confirm');
      if (this.currentPage + 1 < this.pages.length) {
        this.currentPage++;
        this.visibleChars = 0;
        this.textTimer = 0;
        this.isPageComplete = false;
      } else {
        // Conclui a vinheta
        this.onFinished();
      }
    }
  }

  public render(renderer: Renderer): void {
    // 1. Fundo preto puro de cinema
    renderer.clear(NES_COLORS.BLACK);

    // 2. Quadro cinematográfico centralizado (128x72)
    const cutsceneW = this.data?.width || 128;
    const cutsceneH = this.data?.height || 72;
    const imgX = Math.floor((CONFIG.screen.width - cutsceneW) / 2);
    const imgY = 16;

    // Moldura externa da imagem
    renderer.drawWindow(imgX - 4, imgY - 4, cutsceneW + 8, cutsceneH + 8, NES_COLORS.BLACK);

    // Desenha o canvas da cutscene
    const canvas = getCutsceneCanvas(this.cutsceneId, this.currentFrame);
    if (canvas) {
      renderer.ctx.drawImage(canvas, imgX, imgY);
    }

    // 3. Janela de diálogo dramática na parte inferior
    const boxW = 240;
    const boxH = 96;
    const boxX = Math.floor((CONFIG.screen.width - boxW) / 2);
    const boxY = 112;

    renderer.drawWindow(boxX, boxY, boxW, boxH, NES_COLORS.BLACK);

    // Nome do locutor
    if (this.speakerName) {
      renderer.drawText(this.speakerName, boxX + 12, boxY + 10, { color: NES_COLORS.GOLD });
      renderer.fillRect(boxX + 10, boxY + 22, boxW - 20, 1, NES_COLORS.WHITE);
    }

    // Texto com efeito máquina de escrever
    const fullText = this.pages[this.currentPage] || '';
    const textToShow = fullText.slice(0, this.visibleChars);
    renderer.drawText(textToShow, boxX + 12, boxY + 30, {
      color: NES_COLORS.WHITE,
      lineHeight: 14,
    });

    // Indicador de página completa piscante
    if (this.isPageComplete) {
      const blink = Math.floor(this.cursorBlink / 20) % 2 === 0;
      if (blink) {
        renderer.drawText('▼', boxX + boxW - 18, boxY + boxH - 14, { color: NES_COLORS.GOLD });
      }
    }
  }
}
