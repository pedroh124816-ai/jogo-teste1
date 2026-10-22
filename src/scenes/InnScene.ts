import { Scene } from '../engine/Scene';
import { Renderer } from '../engine/Renderer';
import { Input } from '../engine/Input';
import { SceneManager } from '../engine/SceneManager';
import { NES_COLORS } from '../engine/Palette';
import { CONFIG } from '../config';
import { gameState } from '../state/GameState';
import { soundManager } from '../engine/AudioManager';

type InnPhase = 'prompt' | 'resting' | 'result';

export class InnScene implements Scene {
  public readonly name = 'InnScene';
  public readonly isTransparent = true;

  private sceneManager: SceneManager;
  private input: Input;
  private cost: number;

  private phase: InnPhase = 'prompt';
  private selectedIndex = 0; // 0 = MANHÃ, 1 = NOITE, 2 = NÃO
  private chosenTime: 'day' | 'night' = 'day';
  private sleepTimer = 0;
  private readonly sleepDuration = 60;
  private resultMessage = '';
  private cursorTimer = 0;

  constructor(sceneManager: SceneManager, input: Input, cost = 10) {
    this.sceneManager = sceneManager;
    this.input = input;
    this.cost = cost;
  }

  public enter(): void {
    this.phase = 'prompt';
    this.selectedIndex = 0;
    this.sleepTimer = 0;
    this.cursorTimer = 0;
  }

  public update(): void {
    this.cursorTimer++;

    if (this.phase === 'resting') {
      this.sleepTimer++;
      if (this.sleepTimer >= this.sleepDuration) {
        gameState.setTimeOfDay(this.chosenTime);
        const res = gameState.restAtInn(this.cost);
        if (res.success) {
          const timeMsg =
            this.chosenTime === 'day'
              ? 'Você acordou com o sol da manhã!\nPV e PM restaurados!'
              : 'Você acordou sob o luar da noite!\nPV e PM restaurados!';

          if (gameState.getFlag('ato4_concluido') && !gameState.getFlag('sonho_5_visto')) {
            gameState.setFlag('sonho_5_visto', true);
            this.resultMessage = gameState.interpolateText(
              "Sonho: 'O Templo-Coração\nespera por você na ilha.'\n" + timeMsg
            );
          } else if (gameState.getFlag('refugio_aberto') && !gameState.getFlag('sonho_4_visto')) {
            gameState.setFlag('sonho_4_visto', true);
            this.resultMessage = gameState.interpolateText(
              "Sonho: Aneth põe o Medalhão\nem seu peito: 'Viva, filho.'\n" + timeMsg
            );
          } else if (gameState.getFlag('ato2_concluido') && !gameState.getFlag('sonho_3_visto')) {
            gameState.setFlag('sonho_3_visto', true);
            this.resultMessage = gameState.interpolateText(
              "Sonho: 'Ulan, feche a porta\ndo Templo! Eles vêm aí!'\n" + timeMsg
            );
          } else if (gameState.getFlag('ato1_concluido') && !gameState.getFlag('sonho_2_visto')) {
            gameState.setFlag('sonho_2_visto', true);
            this.resultMessage = gameState.interpolateText(
              "Sonho: Uma mulher corre na\nfloresta com um bebê...\n" + timeMsg
            );
          } else if (!gameState.getFlag('sonho_1_visto')) {
            gameState.setFlag('sonho_1_visto', true);
            this.resultMessage = gameState.interpolateText(
              "Sonho: 'Não tema o escuro,\n[NOME]... guarde o Lume.'\n" + timeMsg
            );
          } else {
            this.resultMessage = timeMsg;
          }
          gameState.saveGame();
        } else {
          this.resultMessage = res.message;
        }
        this.phase = 'result';
      }
      return;
    }

    if (this.phase === 'result') {
      if (this.input.wasPressed('confirm') || this.input.wasPressed('cancel')) {
        soundManager.playSfx('confirm');
        this.sceneManager.pop();
      }
      return;
    }

    // Fase prompt (MANHÃ / NOITE / NÃO)
    const optionsCount = 3;
    if (this.input.wasPressed('up')) {
      this.selectedIndex = (this.selectedIndex - 1 + optionsCount) % optionsCount;
      soundManager.playSfx('cursor');
    } else if (this.input.wasPressed('down')) {
      this.selectedIndex = (this.selectedIndex + 1) % optionsCount;
      soundManager.playSfx('cursor');
    } else if (this.input.wasPressed('cancel')) {
      soundManager.playSfx('cancel');
      this.sceneManager.pop();
    } else if (this.input.wasPressed('confirm')) {
      if (this.selectedIndex === 0 || this.selectedIndex === 1) {
        if (gameState.gold < this.cost) {
          soundManager.playSfx('error');
          this.resultMessage = 'Sinto muito, viajante.\nVocê não tem moedas\nsuficientes para o quarto.';
          this.phase = 'result';
        } else {
          this.chosenTime = this.selectedIndex === 0 ? 'day' : 'night';
          soundManager.playSfx('inn');
          this.sleepTimer = 0;
          this.phase = 'resting';
        }
      } else {
        soundManager.playSfx('cancel');
        this.sceneManager.pop();
      }
    }
  }

  public render(renderer: Renderer): void {
    // HUD de status e ouro no topo
    renderer.drawWindow(136, 8, 112, 54, NES_COLORS.BLACK);
    renderer.drawText(`PV: ${gameState.hp}/${gameState.maxHp}`, 148, 16, { color: NES_COLORS.WHITE });
    renderer.drawText(`PM: ${gameState.mp}/${gameState.maxMp}`, 148, 28, { color: NES_COLORS.WHITE });
    renderer.drawText(`OURO: ${gameState.gold} O`, 148, 42, { color: NES_COLORS.GOLD });

    if (this.phase === 'prompt') {
      // Janela MANHÃ / NOITE / NÃO
      renderer.drawWindow(8, 72, 96, 64, NES_COLORS.BLACK);
      const opts = ['MANHÃ', 'NOITE', 'NÃO'];
      for (let i = 0; i < opts.length; i++) {
        const y = 82 + i * 16;
        if (i === this.selectedIndex) {
          renderer.drawText('►', 18, y, { color: NES_COLORS.WHITE });
        }
        renderer.drawText(opts[i], 32, y, {
          color: i === this.selectedIndex ? NES_COLORS.WHITE : NES_COLORS.LIGHT_GRAY,
        });
      }

      // Diálogo do Hospedeiro
      renderer.drawWindow(8, 142, 240, 74, NES_COLORS.BLACK);
      renderer.drawText('HOSPEDEIRO', 18, 150, { color: NES_COLORS.GOLD });
      renderer.fillRect(16, 160, 224, 1, NES_COLORS.WHITE);
      renderer.drawText(
        `Bem-vindo à Estalagem!\nO pernoite custa ${this.cost} moedas.\nAté quando deseja dormir?`,
        18,
        166,
        { color: NES_COLORS.WHITE, lineHeight: 12 }
      );
      return;
    }

    if (this.phase === 'resting') {
      // Escurecimento suave de noite de sono
      const half = this.sleepDuration / 2;
      const ratio =
        this.sleepTimer <= half
          ? this.sleepTimer / half
          : (this.sleepDuration - this.sleepTimer) / half;
      renderer.drawFade(Math.min(1, Math.max(0, ratio)));
      return;
    }

    if (this.phase === 'result') {
      renderer.drawWindow(8, 142, 240, 74, NES_COLORS.BLACK);
      renderer.drawText('HOSPEDEIRO', 18, 150, { color: NES_COLORS.GOLD });
      renderer.fillRect(16, 160, 224, 1, NES_COLORS.WHITE);
      renderer.drawText(this.resultMessage, 18, 166, {
        color: NES_COLORS.WHITE,
        lineHeight: 12,
      });

      const blink = Math.floor(this.cursorTimer / CONFIG.ui.cursorBlinkFrames) % 2 === 0;
      if (blink) {
        renderer.drawText('▼', 230, 200, { color: NES_COLORS.GOLD });
      }
    }
  }
}
