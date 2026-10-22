import { Renderer } from './Renderer';
import { Input } from './Input';
import { NES_COLORS } from './Palette';
import { CONFIG } from '../config';
import { gameState } from '../state/GameState';
import { soundManager } from './AudioManager';

export class DialogueBox {
  private active = false;
  private speakerName: string | null = null;
  private pages: string[] = [];
  private currentPageIndex = 0;

  // Efeito máquina de escrever (letra por letra)
  private visibleCharCount = 0;
  private charTimer = 0;
  private isCurrentPageComplete = false;
  private blinkTimer = 0;

  private onCloseCallback: (() => void) | null = null;
  private choiceOptions: string[] = [];
  private choiceCursor = 0;
  private onChoiceCallback: ((index: number, label: string) => void) | null = null;

  // Dimensões clássicas da janela no canvas 256x224
  private readonly boxX = 8;
  private readonly boxY = 136;
  private readonly boxW = 240;
  private readonly boxH = 80;
  private readonly maxCharsPerLine = 28;
  private readonly maxLinesPerPage = 3;

  constructor() {}

  public isOpen(): boolean {
    return this.active;
  }

  /**
   * Inicia o diálogo com nome do falante e texto.
   * Substitui dinamicamente [NOME] e quebra o texto em páginas (28x3).
   */
  public start(speakerName: string | null, fullText: string, onClose?: () => void): void {
    this.active = true;
    this.speakerName = speakerName ? gameState.interpolateText(speakerName) : null;
    this.onCloseCallback = onClose ?? null;
    this.choiceOptions = [];
    this.choiceCursor = 0;
    this.onChoiceCallback = null;
    const interpolated = gameState.interpolateText(fullText);
    this.pages = this.paginateText(interpolated);
    this.currentPageIndex = 0;
    this.resetTypewriter();
  }

  /**
   * Inicia um diálogo que exibe uma janela de escolha ao final da última página.
   */
  public startWithChoice(
    speakerName: string | null,
    fullText: string,
    options: string[],
    onChoice: (index: number, label: string) => void
  ): void {
    this.start(speakerName, fullText);
    this.choiceOptions = options;
    this.choiceCursor = 0;
    this.onChoiceCallback = onChoice;
  }

  private resetTypewriter(): void {
    this.visibleCharCount = 0;
    this.charTimer = 0;
    this.isCurrentPageComplete = false;
    this.blinkTimer = 0;
  }

  /**
   * Quebra o texto em páginas para caber na janela (28 colunas x 3 linhas).
   * Suporta tanto '\n\n' quanto '---' como separadores explícitos de página.
   */
  public paginateText(text: string): string[] {
    const normalized = text.replace(/\r\n/g, '\n');
    const rawParagraphs = normalized.split(/\n\s*---\s*\n|\n\n/);
    const resultPages: string[] = [];

    for (const paragraph of rawParagraphs) {
      const rawLines = paragraph.split('\n').filter((l) => l.length > 0);
      const allFit = rawLines.every((l) => l.length <= this.maxCharsPerLine);

      let lines: string[] = [];
      if (allFit && rawLines.length > 0) {
        lines = rawLines;
      } else {
        const words = paragraph.replace(/\n/g, ' ').split(' ');
        let currentLine = '';

        for (const word of words) {
          if (!word) continue;
          if ((currentLine + (currentLine ? ' ' : '') + word).length <= this.maxCharsPerLine) {
            currentLine += (currentLine ? ' ' : '') + word;
          } else {
            if (currentLine) lines.push(currentLine);
            currentLine = word;
          }
        }
        if (currentLine) {
          lines.push(currentLine);
        }
      }

      for (let i = 0; i < lines.length; i += this.maxLinesPerPage) {
        const pageLines = lines.slice(i, i + this.maxLinesPerPage);
        resultPages.push(pageLines.join('\n'));
      }
    }

    return resultPages.length > 0 ? resultPages : ['...'];
  }

  public update(input: Input): void {
    if (!this.active) return;

    this.blinkTimer++;
    const currentText = this.pages[this.currentPageIndex] || '';

    // 1. Processo de revelação letra por letra
    if (!this.isCurrentPageComplete) {
      // Se o jogador pressionar Confirmar ou Cancelar enquanto digita, completa a página instantaneamente
      if (input.wasPressed('confirm') || input.wasPressed('cancel')) {
        this.visibleCharCount = currentText.length;
        this.isCurrentPageComplete = true;
        return;
      }

      this.charTimer++;
      if (this.charTimer >= CONFIG.ui.textFramesPerChar) {
        this.charTimer = 0;
        this.visibleCharCount++;
        if (this.visibleCharCount >= currentText.length) {
          this.visibleCharCount = currentText.length;
          this.isCurrentPageComplete = true;
        }
      }
      return;
    }

    const isLastPage = this.currentPageIndex + 1 >= this.pages.length;
    const hasChoices = isLastPage && this.choiceOptions.length > 0;

    if (hasChoices) {
      if (input.wasPressed('up')) {
        soundManager.playSfx('cursor');
        this.choiceCursor = (this.choiceCursor - 1 + this.choiceOptions.length) % this.choiceOptions.length;
        return;
      }
      if (input.wasPressed('down')) {
        soundManager.playSfx('cursor');
        this.choiceCursor = (this.choiceCursor + 1) % this.choiceOptions.length;
        return;
      }
      if (input.wasPressed('confirm')) {
        soundManager.playSfx('confirm');
        const idx = this.choiceCursor;
        const label = this.choiceOptions[idx];
        const cb = this.onChoiceCallback;
        this.active = false;
        this.choiceOptions = [];
        this.onChoiceCallback = null;
        this.onCloseCallback = null;
        cb?.(idx, label);
        return;
      }
      return;
    }

    // 2. Página já completada: aguarda confirmação do jogador
    if (input.wasPressed('confirm') || input.wasPressed('cancel')) {
      soundManager.playSfx('confirm');
      if (!isLastPage) {
        // Avança para a próxima página
        this.currentPageIndex++;
        this.resetTypewriter();
      } else {
        // Encerra o diálogo
        this.close();
      }
    }
  }

  public close(): void {
    this.active = false;
    this.choiceOptions = [];
    this.onChoiceCallback = null;
    const cb = this.onCloseCallback;
    this.onCloseCallback = null;
    cb?.();
  }

  public render(renderer: Renderer): void {
    if (!this.active) return;

    // 1. Caixa principal preta com moldura clássica estilo Dragon Quest
    renderer.drawWindow(this.boxX, this.boxY, this.boxW, this.boxH, NES_COLORS.BLACK);

    // 2. Placa com o nome do interlocutor no topo, se houver
    let textStartY = this.boxY + 12;
    if (this.speakerName) {
      const nameTag = `[ ${this.speakerName} ]`;
      renderer.drawText(nameTag, this.boxX + 12, this.boxY + 8, {
        color: NES_COLORS.GOLD,
      });
      textStartY = this.boxY + 22;
      renderer.fillRect(this.boxX + 10, this.boxY + 18, this.boxW - 20, 1, NES_COLORS.DARK_GRAY);
    }

    // 3. Texto da página atual revelado letra por letra
    const currentText = this.pages[this.currentPageIndex] || '';
    const textToShow = currentText.substring(0, this.visibleCharCount);

    renderer.drawText(textToShow, this.boxX + 12, textStartY, {
      color: NES_COLORS.WHITE,
      lineHeight: 12,
    });

    const isLastPage = this.currentPageIndex + 1 >= this.pages.length;
    const hasChoices = isLastPage && this.choiceOptions.length > 0;

    // 4. Janela de escolhas (se na última página completa) ou indicador piscando
    if (this.isCurrentPageComplete) {
      if (hasChoices) {
        const choiceW = 124;
        const choiceH = this.choiceOptions.length * 14 + 14;
        const choiceX = this.boxX + this.boxW - choiceW;
        const choiceY = this.boxY - choiceH - 4;
        renderer.drawWindow(choiceX, choiceY, choiceW, choiceH, NES_COLORS.BLACK);

        for (let i = 0; i < this.choiceOptions.length; i++) {
          const isSelected = i === this.choiceCursor;
          const rowY = choiceY + 8 + i * 14;
          if (isSelected) {
            renderer.drawText('►', choiceX + 8, rowY, { color: NES_COLORS.GOLD });
          }
          renderer.drawText(this.choiceOptions[i], choiceX + 20, rowY, {
            color: isSelected ? NES_COLORS.GOLD : NES_COLORS.WHITE,
          });
        }
      } else {
        const blink = Math.floor(this.blinkTimer / CONFIG.ui.cursorBlinkFrames) % 2 === 0;
        if (blink) {
          const indicator = !isLastPage ? '▼' : '►';
          renderer.drawText(indicator, this.boxX + this.boxW - 18, this.boxY + this.boxH - 14, {
            color: NES_COLORS.GOLD,
          });
        }
      }
    }
  }
}
