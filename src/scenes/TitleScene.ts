import { Scene } from '../engine/Scene';
import { Renderer } from '../engine/Renderer';
import { Input } from '../engine/Input';
import { SceneManager } from '../engine/SceneManager';
import { CONFIG } from '../config';
import { NES_COLORS } from '../engine/Palette';
import { AssetManager } from '../assets/AssetManager';
import { MapScene } from './MapScene';
import { NameEntryScene } from './NameEntryScene';
import { DialogueBox } from '../engine/DialogueBox';
import { gameState, GameState } from '../state/GameState';
import { soundManager } from '../engine/AudioManager';

export class TitleScene implements Scene {
  public readonly name = 'TitleScene';
  public readonly isTransparent = false;

  private sceneManager: SceneManager;
  private input: Input;
  private assetManager: AssetManager;
  private dialogueBox: DialogueBox;
  private selectedOption = 0; // 0 = NOVO JOGO, 1 = CONTINUAR
  private options = ['NOVO JOGO', 'CONTINUAR'];
  private mode: 'main' | 'slots' = 'main';
  private slotMode: 'new' | 'load' = 'new';
  private slotCursor = 0;
  private overwriteArmed = false;

  // Animação de estrelas no fundo (estilo introdução NES)
  private stars: Array<{ x: number; y: number; brightness: number; speed: number }> = [];
  private timer = 0;

  constructor(sceneManager: SceneManager, input: Input, assetManager: AssetManager) {
    this.sceneManager = sceneManager;
    this.input = input;
    this.assetManager = assetManager;
    this.dialogueBox = new DialogueBox();

    // Gera posições de estrelas
    for (let i = 0; i < 28; i++) {
      this.stars.push({
        x: Math.floor(Math.random() * CONFIG.screen.width),
        y: Math.floor(Math.random() * (CONFIG.screen.height - 40)),
        brightness: Math.random(),
        speed: 0.02 + Math.random() * 0.04,
      });
    }
  }

  public enter(): void {
    this.selectedOption = gameState.hasSaveData() ? 1 : 0;
    this.mode = 'main';
    this.overwriteArmed = false;
    this.timer = 0;
    soundManager.playBgm('title');
  }

  private updateSlots(): void {
    if (this.input.wasPressed('cancel')) {
      soundManager.playSfx('cancel');
      this.mode = 'main';
      this.overwriteArmed = false;
      return;
    }
    if (this.input.wasPressed('up')) {
      this.slotCursor = (this.slotCursor + GameState.SLOT_COUNT - 1) % GameState.SLOT_COUNT;
      this.overwriteArmed = false;
      soundManager.playSfx('cursor');
    } else if (this.input.wasPressed('down')) {
      this.slotCursor = (this.slotCursor + 1) % GameState.SLOT_COUNT;
      this.overwriteArmed = false;
      soundManager.playSfx('cursor');
    }

    if (!this.input.wasPressed('confirm')) return;
    const slot = this.slotCursor + 1;
    const exists = gameState.hasSaveData(slot);

    if (this.slotMode === 'new') {
      if (exists && !this.overwriteArmed) {
        // Pede segunda confirmação antes de sobrescrever um save existente
        this.overwriteArmed = true;
        soundManager.playSfx('error');
        return;
      }
      soundManager.playSfx('confirm');
      gameState.currentSlot = slot;
      if (exists) gameState.clearSaveData(slot);
      const nameScene = new NameEntryScene(this.sceneManager, this.input, this.assetManager);
      this.sceneManager.fadeTransition(nameScene);
      return;
    }

    // Carregar
    if (!exists || !gameState.loadGame(slot)) {
      soundManager.playSfx('error');
      return;
    }
    soundManager.playSfx('confirm');
    const mapScene = new MapScene(
      this.sceneManager,
      this.input,
      this.assetManager,
      gameState.savedMapId,
      gameState.savedTileX,
      gameState.savedTileY,
      gameState.savedDir
    );
    this.sceneManager.fadeTransition(mapScene);
  }

  private renderSlots(renderer: Renderer): void {
    renderer.drawWindow(12, 12, 232, 200, NES_COLORS.BLACK);
    const heading = this.slotMode === 'new' ? 'ESCOLHA UM SAVE' : 'CARREGAR JOGO';
    renderer.drawText(heading, Math.floor((CONFIG.screen.width - renderer.measureText(heading)) / 2), 28, {
      color: NES_COLORS.GOLD,
    });

    for (let i = 0; i < GameState.SLOT_COUNT; i++) {
      const y = 52 + i * 40;
      const selected = i === this.slotCursor;
      renderer.drawWindow(24, y, 208, 34, NES_COLORS.BLACK);
      if (selected && Math.floor(this.timer / CONFIG.ui.cursorBlinkFrames) % 2 === 0) {
        renderer.drawText('►', 28, y + 12, { color: NES_COLORS.WHITE });
      }
      const summary = gameState.getSlotSummary(i + 1);
      const color = selected ? NES_COLORS.WHITE : NES_COLORS.LIGHT_GRAY;
      renderer.drawText(`SAVE ${i + 1}`, 40, y + 6, { color: NES_COLORS.LIGHT_BLUE });
      if (summary) {
        renderer.drawText(`${summary.name}  NV ${summary.level}`, 40, y + 18, { color });
        if (summary.completed) renderer.drawText('★', 212, y + 6, { color: NES_COLORS.GOLD });
      } else {
        renderer.drawText('- VAZIO -', 40, y + 18, { color: NES_COLORS.DARK_GRAY });
      }
    }

    let hint = 'Z: ESCOLHER   X: VOLTAR';
    if (this.overwriteArmed) hint = 'SOBRESCREVER? APERTE Z';
    renderer.drawText(hint, Math.floor((CONFIG.screen.width - renderer.measureText(hint)) / 2), 184, {
      color: this.overwriteArmed ? NES_COLORS.GOLD : NES_COLORS.PALE_GREEN,
    });
  }

  public update(): void {
    this.timer++;

    if (this.dialogueBox.isOpen()) {
      this.dialogueBox.update(this.input);
      return;
    }

    if (this.mode === 'slots') {
      this.updateSlots();
      return;
    }

    // Alternar opção com cima / baixo
    if (this.input.wasPressed('up') || this.input.wasPressed('down')) {
      this.selectedOption = (this.selectedOption + 1) % this.options.length;
      soundManager.playSfx('cursor');
    }

    // Confirmar com Enter ou Z
    if (this.input.wasPressed('confirm')) {
      if (this.selectedOption === 0) {
        soundManager.playSfx('confirm');
        // NOVO JOGO -> escolhe o slot de save e depois o nome
        this.mode = 'slots';
        this.slotMode = 'new';
        this.slotCursor = 0;
        this.overwriteArmed = false;
      } else {
        // CONTINUAR -> escolhe qual save carregar
        if (!gameState.hasSaveData()) {
          soundManager.playSfx('error');
          this.dialogueBox.start(
            'SISTEMA',
            'Nenhum jogo salvo\nencontrado. Escolha\nNOVO JOGO para iniciar!'
          );
          return;
        }
        soundManager.playSfx('confirm');
        this.mode = 'slots';
        this.slotMode = 'load';
        this.overwriteArmed = false;
        // Posiciona o cursor no primeiro slot ocupado
        let first = 0;
        for (let s = 1; s <= GameState.SLOT_COUNT; s++) {
          if (gameState.hasSaveData(s)) {
            first = s - 1;
            break;
          }
        }
        this.slotCursor = first;
      }
    }
  }

  public render(renderer: Renderer): void {
    // 1. Fundo preto com estrelas cintilantes
    renderer.clear(NES_COLORS.BLACK);

    // Desenha estrelas
    for (const star of this.stars) {
      star.brightness += star.speed;
      const b = (Math.sin(star.brightness) + 1) / 2;
      let starColor = NES_COLORS.DARK_GRAY as string;
      if (b > 0.7) starColor = NES_COLORS.WHITE;
      else if (b > 0.4) starColor = NES_COLORS.MED_GRAY;
      renderer.fillRect(star.x, star.y, 1, 1, starColor);
    }

    if (this.mode === 'slots') {
      this.renderSlots(renderer);
      if (this.dialogueBox.isOpen()) this.dialogueBox.render(renderer);
      return;
    }

    // 2. Moldura externa decorativa de tela de título (estilo DQ)
    renderer.drawWindow(12, 12, 232, 200, NES_COLORS.BLACK);

    // 3. Logo e Título
    const title = CONFIG.game.title;
    const titleW = renderer.measureText(title);
    const titleX = Math.floor((CONFIG.screen.width - titleW) / 2);
    const titleY = 40;

    // Sombra do título
    renderer.drawText(title, titleX + 1, titleY + 1, { color: NES_COLORS.DARK_BLUE });
    renderer.drawText(title, titleX, titleY, { color: NES_COLORS.GOLD });

    // Subtítulo
    const sub = CONFIG.game.subtitle;
    const subW = renderer.measureText(sub);
    const subX = Math.floor((CONFIG.screen.width - subW) / 2);
    renderer.drawText(sub, subX, 60, { color: NES_COLORS.LIGHT_BLUE });

    // Linha divisória ornamental
    renderer.fillRect(36, 76, 184, 1, NES_COLORS.WHITE);

    // Espada/Escudo decorativo estilizado no centro
    const loreText = 'UM CLÁSSICO RPG DE 8 BITS';
    const loreW = renderer.measureText(loreText);
    renderer.drawText(loreText, Math.floor((CONFIG.screen.width - loreW) / 2), 92, {
      color: NES_COLORS.MED_GRAY,
    });

    // 4. Menu de opções
    const hasSave = gameState.hasSaveData();
    const menuBoxY = 124;
    for (let i = 0; i < this.options.length; i++) {
      const optY = menuBoxY + i * 16;
      const isSelected = i === this.selectedOption;

      // Cursor estilo Dragon Quest (►)
      if (isSelected) {
        const blink = Math.floor(this.timer / CONFIG.ui.cursorBlinkFrames) % 2 === 0;
        if (blink) {
          renderer.drawText('►', 84, optY, { color: NES_COLORS.WHITE });
        }
      }

      let textColor: string = isSelected ? NES_COLORS.WHITE : NES_COLORS.LIGHT_GRAY;
      if (i === 1 && !hasSave) {
        textColor = NES_COLORS.DARK_GRAY;
      }
      renderer.drawText(this.options[i], 98, optY, { color: textColor });

      if (i === 1 && hasSave && gameState.isGameCompleted()) {
        renderer.drawText('★', 174, optY, { color: NES_COLORS.GOLD });
      }
    }

    // 5. Prompt inferior piscante "PRESSIONE ENTER"
    const blinkPrompt = Math.floor(this.timer / CONFIG.ui.pressStartBlinkFrames) % 2 === 0;
    if (blinkPrompt) {
      const prompt = 'APERTE ENTER OU Z';
      const promptW = renderer.measureText(prompt);
      renderer.drawText(prompt, Math.floor((CONFIG.screen.width - promptW) / 2), 174, {
        color: NES_COLORS.PALE_GREEN,
      });
    }

    // Rodapé de copyright / versão
    renderer.drawText(CONFIG.game.version, 24, 192, { color: NES_COLORS.DARK_GRAY });
    renderer.drawText('2026', 204, 192, { color: NES_COLORS.DARK_GRAY });

    if (this.dialogueBox.isOpen()) {
      this.dialogueBox.render(renderer);
    }
  }
}

