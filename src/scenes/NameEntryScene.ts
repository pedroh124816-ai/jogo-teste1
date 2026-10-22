import { Scene } from '../engine/Scene';
import { Renderer } from '../engine/Renderer';
import { Input } from '../engine/Input';
import { SceneManager } from '../engine/SceneManager';
import { NES_COLORS } from '../engine/Palette';
import { CONFIG } from '../config';
import { AssetManager } from '../assets/AssetManager';
import { IntroScene } from './IntroScene';
import { gameState } from '../state/GameState';
import { FONT_GLYPHS } from '../assets/fontGraphics';
import { soundManager } from '../engine/AudioManager';

const CHAR_GRID: string[][] = [
  ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'],
  ['J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R'],
  ['S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', '-'],
  ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i'],
  ['j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r'],
  ['s', 't', 'u', 'v', 'w', 'x', 'y', 'z', ' '],
];

const ACTION_ROW = 6; // Linha especial abaixo da grade: col 0..3 = APAGAR, col 4..8 = PRONTO

export class NameEntryScene implements Scene {
  public readonly name = 'NameEntryScene';
  public readonly isTransparent = false;

  private sceneManager: SceneManager;
  private input: Input;
  private assetManager: AssetManager;

  private currentName = '';
  private readonly maxLen = 8;

  private cursorRow = 0;
  private cursorCol = 0;
  private timer = 0;

  private keyListener: ((e: KeyboardEvent) => void) | null = null;

  constructor(sceneManager: SceneManager, input: Input, assetManager: AssetManager) {
    this.sceneManager = sceneManager;
    this.input = input;
    this.assetManager = assetManager;
  }

  public enter(): void {
    this.currentName = '';
    this.cursorRow = 0;
    this.cursorCol = 0;
    this.timer = 0;
    soundManager.playBgm('title');

    if (typeof window !== 'undefined') {
      this.keyListener = (e: KeyboardEvent) => {
        if (e.key === 'Backspace') {
          this.currentName = this.currentName.slice(0, -1);
          soundManager.playSfx('cancel');
          return;
        }
        if (e.key.length === 1 && e.key in FONT_GLYPHS && this.currentName.length < this.maxLen) {
          // Evita que z/x de controle de jogo dupliquem quando o usuário navega na grade,
          // a menos que esteja digitando com Shift ou outras letras
          if ((e.key === 'z' || e.key === 'x') && !e.shiftKey) {
            return;
          }
          this.currentName += e.key;
          soundManager.playSfx('cursor');
        }
      };
      window.addEventListener('keydown', this.keyListener);
    }
  }

  public exit(): void {
    if (typeof window !== 'undefined' && this.keyListener) {
      window.removeEventListener('keydown', this.keyListener);
      this.keyListener = null;
    }
  }

  public update(): void {
    this.timer++;

    const totalRows = CHAR_GRID.length + 1; // 6 linhas de letras + 1 linha de ações
    const cols = 9;

    if (this.input.wasPressed('up')) {
      this.cursorRow = (this.cursorRow - 1 + totalRows) % totalRows;
      soundManager.playSfx('cursor');
    } else if (this.input.wasPressed('down')) {
      this.cursorRow = (this.cursorRow + 1) % totalRows;
      soundManager.playSfx('cursor');
    } else if (this.input.wasPressed('left')) {
      if (this.cursorRow === ACTION_ROW) {
        this.cursorCol = this.cursorCol < 4 ? 5 : 0;
      } else {
        this.cursorCol = (this.cursorCol - 1 + cols) % cols;
      }
      soundManager.playSfx('cursor');
    } else if (this.input.wasPressed('right')) {
      if (this.cursorRow === ACTION_ROW) {
        this.cursorCol = this.cursorCol < 4 ? 5 : 0;
      } else {
        this.cursorCol = (this.cursorCol + 1) % cols;
      }
      soundManager.playSfx('cursor');
    }

    if (this.input.wasPressed('cancel')) {
      if (this.currentName.length > 0) {
        this.currentName = this.currentName.slice(0, -1);
        soundManager.playSfx('cancel');
      }
      return;
    }

    if (this.input.wasPressed('confirm')) {
      if (this.cursorRow === ACTION_ROW) {
        if (this.cursorCol < 4) {
          // APAGAR
          this.currentName = this.currentName.slice(0, -1);
          soundManager.playSfx('cancel');
        } else {
          // PRONTO / CONFIRMAR
          soundManager.playSfx('confirm');
          this.confirmNameAndStart();
        }
        return;
      }

      const ch = CHAR_GRID[this.cursorRow]?.[this.cursorCol];
      if (ch !== undefined && this.currentName.length < this.maxLen) {
        this.currentName += ch;
        soundManager.playSfx('confirm');
        if (this.currentName.length === this.maxLen) {
          this.cursorRow = ACTION_ROW;
          this.cursorCol = 5;
        }
      }
    }
  }

  private confirmNameAndStart(): void {
    gameState.reset();
    gameState.setHeroName(this.currentName);
    const introScene = new IntroScene(this.sceneManager, this.input, this.assetManager);
    this.sceneManager.fadeTransition(introScene);
  }

  public render(renderer: Renderer): void {
    renderer.clear(NES_COLORS.BLACK);

    // 1. Janela superior: Nome do Herói
    renderer.drawWindow(16, 10, 224, 52, NES_COLORS.BLACK);
    renderer.drawText('QUAL É O SEU NOME, HERÓI?', 28, 20, { color: NES_COLORS.GOLD });

    // Slots de 8 caracteres
    const slotsStartX = 64;
    const slotsY = 38;
    for (let i = 0; i < this.maxLen; i++) {
      const sx = slotsStartX + i * 14;
      const ch = this.currentName[i] || '_';
      const isCurrentSlot = i === this.currentName.length;
      const color =
        i < this.currentName.length
          ? NES_COLORS.WHITE
          : isCurrentSlot
            ? NES_COLORS.PALE_GREEN
            : NES_COLORS.DARK_GRAY;
      renderer.drawText(ch, sx, slotsY, { color });
    }

    // 2. Janela da Grade de Caracteres
    const gx = 16;
    const gy = 68;
    const gw = 224;
    const gh = 144;
    renderer.drawWindow(gx, gy, gw, gh, NES_COLORS.BLACK);

    for (let r = 0; r < CHAR_GRID.length; r++) {
      for (let c = 0; c < CHAR_GRID[r].length; c++) {
        const ch = CHAR_GRID[r][c];
        const cx = gx + 22 + c * 21;
        const cy = gy + 14 + r * 16;
        const isSelected = this.cursorRow === r && this.cursorCol === c;

        if (isSelected) {
          const blink = Math.floor(this.timer / CONFIG.ui.cursorBlinkFrames) % 2 === 0;
          if (blink) {
            renderer.drawText('►', cx - 10, cy, { color: NES_COLORS.GOLD });
          }
        }

        const label = ch === ' ' ? '_' : ch;
        renderer.drawText(label, cx, cy, {
          color: isSelected ? NES_COLORS.WHITE : NES_COLORS.LIGHT_GRAY,
        });
      }
    }

    // Linha divisória e botões de ação (APAGAR / PRONTO)
    renderer.fillRect(gx + 10, gy + 114, gw - 20, 1, NES_COLORS.DARK_GRAY);

    const isDelSelected = this.cursorRow === ACTION_ROW && this.cursorCol < 4;
    const isOkSelected = this.cursorRow === ACTION_ROW && this.cursorCol >= 4;

    if (isDelSelected) {
      renderer.drawText('►', gx + 18, gy + 124, { color: NES_COLORS.GOLD });
    }
    renderer.drawText('APAGAR', gx + 30, gy + 124, {
      color: isDelSelected ? NES_COLORS.WHITE : NES_COLORS.LIGHT_GRAY,
    });

    if (isOkSelected) {
      renderer.drawText('►', gx + 114, gy + 124, { color: NES_COLORS.GOLD });
    }
    const okLabel = this.currentName.trim().length > 0 ? 'CONFIRMAR' : 'USAR "Herói"';
    renderer.drawText(okLabel, gx + 126, gy + 124, {
      color: isOkSelected ? NES_COLORS.PALE_GREEN : NES_COLORS.GOLD,
    });
  }
}
