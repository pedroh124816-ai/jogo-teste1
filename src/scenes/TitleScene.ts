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
import { gameState } from '../state/GameState';
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
    this.timer = 0;
    soundManager.playBgm('title');
  }

  public update(): void {
    this.timer++;

    if (this.dialogueBox.isOpen()) {
      this.dialogueBox.update(this.input);
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
        // NOVO JOGO -> abre tela de escolha do nome [NOME]
        const nameScene = new NameEntryScene(this.sceneManager, this.input, this.assetManager);
        this.sceneManager.fadeTransition(nameScene);
      } else {
        // CONTINUAR -> carrega save do localStorage se existir
        if (!gameState.hasSaveData() || !gameState.loadGame()) {
          soundManager.playSfx('error');
          this.dialogueBox.start(
            'SISTEMA',
            'Nenhum jogo salvo\nencontrado. Escolha\nNOVO JOGO para iniciar!'
          );
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

