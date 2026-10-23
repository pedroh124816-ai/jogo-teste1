import { Scene } from '../engine/Scene';
import { Renderer } from '../engine/Renderer';
import { Input } from '../engine/Input';
import { SceneManager } from '../engine/SceneManager';
import { NES_COLORS } from '../engine/Palette';
import { AssetManager } from '../assets/AssetManager';
import { DialogueBox } from '../engine/DialogueBox';
import { MapScene } from './MapScene';
import { gameState } from '../state/GameState';
import { soundManager } from '../engine/AudioManager';
import { getCutsceneCanvas } from '../assets/cutsceneGraphics';

interface IntroSlide {
  title: string;
  text: string;
}

const INTRO_SLIDES: IntroSlide[] = [
  {
    title: 'I. A GRANDE TREVA',
    text: 'Há trinta anos, a Grande\nTreva subiu das fendas e\ncobriu a terra em sombras.',
  },
  {
    title: 'II. O LUME REAL',
    text: 'O Rei Auren acendeu o\nGrande Lume no Castelo e\nuniu os quatro reinos.',
  },
  {
    title: 'III. O MEDALHÃO ANTIGO',
    text: 'Criado nos muros reais\nsem conhecer sua origem,\n[NOME] guarda um Medalhão.',
  },
  {
    title: 'IV. O CHAMADO DO REI',
    text: 'Mas a sombra voltou na\nVila de Alvorada. No Trono,\no Rei Auren chama [NOME]!',
  },
];

export class IntroScene implements Scene {
  public readonly name = 'IntroScene';
  public readonly isTransparent = false;

  private sceneManager: SceneManager;
  private input: Input;
  private assetManager: AssetManager;
  private dialogueBox: DialogueBox;

  private slideIndex = 0;
  private timer = 0;
  private finished = false;
  private stars: Array<{ x: number; y: number; phase: number }> = [];

  constructor(sceneManager: SceneManager, input: Input, assetManager: AssetManager) {
    this.sceneManager = sceneManager;
    this.input = input;
    this.assetManager = assetManager;
    this.dialogueBox = new DialogueBox();

    for (let i = 0; i < 32; i++) {
      this.stars.push({
        x: (i * 47 + 13) % 220 + 18,
        y: (i * 29 + 7) % 90 + 24,
        phase: i * 0.7,
      });
    }
  }

  public enter(): void {
    this.slideIndex = 0;
    this.timer = 0;
    this.finished = false;
    soundManager.playBgm('title');
    this.startCurrentSlide();
  }

  private startCurrentSlide(): void {
    const slide = INTRO_SLIDES[this.slideIndex];
    if (!slide) {
      this.finishIntro();
      return;
    }
    this.timer = 0;
    this.dialogueBox.start(slide.title, slide.text, () => {
      soundManager.playSfx('confirm');
      this.slideIndex++;
      if (this.slideIndex < INTRO_SLIDES.length) {
        this.startCurrentSlide();
      } else {
        this.finishIntro();
      }
    });
  }

  private finishIntro(): void {
    if (this.finished) return;
    this.finished = true;
    // Posiciona o herói diretamente diante do Trono Real do Rei Auren e salva o início da jornada
    gameState.saveGame('castelo', 18, 6, 'up');
    const mapScene = new MapScene(
      this.sceneManager,
      this.input,
      this.assetManager,
      'castelo',
      18,
      6,
      'up',
      true
    );
    this.sceneManager.fadeTransition(mapScene);
  }

  public update(): void {
    this.timer++;

    if (this.input.wasPressed('cancel')) {
      soundManager.playSfx('cancel');
      this.finishIntro();
      return;
    }

    if (this.dialogueBox.isOpen()) {
      this.dialogueBox.update(this.input);
    }
  }

  public render(renderer: Renderer): void {
    renderer.clear(NES_COLORS.BLACK);

    // Moldura do palco visual (224x116 na parte superior)
    const stageX = 16;
    const stageY = 12;
    const stageW = 224;
    const stageH = 118;
    renderer.drawWindow(stageX, stageY, stageW, stageH, NES_COLORS.BLACK);

    // Renderiza arte da cutscene dedicada se disponível, ou arte procedural
    const cutsceneId =
      this.slideIndex === 0
        ? 'intro_grande_treva'
        : this.slideIndex === 1
        ? 'intro_grande_lume'
        : null;
    const canvas = cutsceneId ? getCutsceneCanvas(cutsceneId, Math.floor(this.timer / 30)) : null;

    if (canvas) {
      const imgX = stageX + Math.floor((stageW - canvas.width) / 2);
      const imgY = stageY + Math.floor((stageH - canvas.height) / 2);
      renderer.ctx.drawImage(canvas, imgX, imgY);
    } else {
      if (this.slideIndex === 0) {
        this.renderSlideDarkness(renderer, stageX + 8, stageY + 8, stageW - 16, stageH - 16);
      } else if (this.slideIndex === 1) {
        this.renderSlideCastleLight(renderer, stageX + 8, stageY + 8, stageW - 16, stageH - 16);
      } else if (this.slideIndex === 2) {
        this.renderSlideMedallion(renderer, stageX + 8, stageY + 8, stageW - 16, stageH - 16);
      } else {
        this.renderSlideThroneCall(renderer, stageX + 8, stageY + 8, stageW - 16, stageH - 16);
      }
    }

    // Dica discreta de pular abertura
    renderer.drawText('[ENTER] AVANÇAR   [ESC] PULAR', 32, 134, {
      color: NES_COLORS.MED_GRAY,
    });

    if (this.dialogueBox.isOpen()) {
      this.dialogueBox.render(renderer);
    }
  }

  private renderStars(renderer: Renderer): void {
    for (const st of this.stars) {
      const b = Math.sin(this.timer * 0.06 + st.phase);
      const col = b > 0.5 ? NES_COLORS.WHITE : b > -0.2 ? NES_COLORS.LIGHT_GRAY : NES_COLORS.DARK_GRAY;
      renderer.fillRect(st.x, st.y, 1, 1, col);
    }
  }

  /**
   * Quadro 1: A Grande Treva cobrindo a terra (vinheta cinematográfica retrô 128x72).
   */
  private renderSlideDarkness(
    renderer: Renderer,
    x: number,
    y: number,
    w: number,
    h: number
  ): void {
    renderer.fillRect(x, y, w, h, NES_COLORS.NAVY_BLUE);
    this.renderStars(renderer);
    const frame = Math.floor(this.timer / 20) % 2;
    const canvas = getCutsceneCanvas('intro_grande_treva', frame);
    if (canvas) {
      const cx = x + Math.floor((w - 128) / 2);
      const cy = y + Math.floor((h - 72) / 2);
      renderer.drawWindow(cx - 3, cy - 3, 128 + 6, 72 + 6, NES_COLORS.NAVY_BLUE);
      renderer.ctx.drawImage(canvas, cx, cy);
    }
  }

  /**
   * Quadro 2: O Grande Lume no Topo do Castelo (vinheta cinematográfica retrô 128x72).
   */
  private renderSlideCastleLight(
    renderer: Renderer,
    x: number,
    y: number,
    w: number,
    h: number
  ): void {
    renderer.fillRect(x, y, w, h, NES_COLORS.DARK_BLUE);
    this.renderStars(renderer);
    const frame = Math.floor(this.timer / 20) % 2;
    const canvas = getCutsceneCanvas('intro_grande_lume', frame);
    if (canvas) {
      const cx = x + Math.floor((w - 128) / 2);
      const cy = y + Math.floor((h - 72) / 2);
      renderer.drawWindow(cx - 3, cy - 3, 128 + 6, 72 + 6, NES_COLORS.DARK_BLUE);
      renderer.ctx.drawImage(canvas, cx, cy);
    }
  }

  /**
   * Quadro 3: O Medalhão de Veyra pulsando na escuridão.
   */
  private renderSlideMedallion(
    renderer: Renderer,
    x: number,
    y: number,
    w: number,
    h: number
  ): void {
    renderer.fillRect(x, y, w, h, NES_COLORS.BLACK);

    const cx = x + Math.floor(w / 2);
    const cy = y + Math.floor(h / 2);
    const pulse = Math.floor(this.timer / 12) % 2 === 0;

    // Corrente do medalhão
    for (let i = 0; i < 24; i += 3) {
      renderer.fillRect(cx - 14 + Math.floor(i / 2), cy - 36 + i, 2, 2, NES_COLORS.LIGHT_GRAY);
      renderer.fillRect(cx + 12 - Math.floor(i / 2), cy - 36 + i, 2, 2, NES_COLORS.LIGHT_GRAY);
    }

    // Halo de luz ao redor do medalhão
    const haloRadius = pulse ? 26 : 22;
    renderer.fillRect(cx - haloRadius, cy - haloRadius, haloRadius * 2, haloRadius * 2, NES_COLORS.DARK_BROWN);
    renderer.fillRect(cx - 18, cy - 18, 36, 36, NES_COLORS.GOLD);
    renderer.fillRect(cx - 14, cy - 14, 28, 28, NES_COLORS.DARK_BLUE);

    // Símbolo ancestral de Veyra (estrela de luz verde-dourada no centro)
    const gemColor = pulse ? NES_COLORS.PALE_GREEN : NES_COLORS.WHITE;
    renderer.fillRect(cx - 2, cy - 10, 4, 20, gemColor);
    renderer.fillRect(cx - 10, cy - 2, 20, 4, gemColor);
    renderer.fillRect(cx - 5, cy - 5, 10, 10, NES_COLORS.GOLD);
    renderer.fillRect(cx - 2, cy - 2, 4, 4, NES_COLORS.WHITE);
  }

  /**
   * Quadro 4: O herói caminhando pelo tapete real do Salão do Trono até o Rei Auren.
   */
  private renderSlideThroneCall(
    renderer: Renderer,
    x: number,
    y: number,
    w: number,
    h: number
  ): void {
    renderer.fillRect(x, y, w, h, NES_COLORS.DARK_GRAY);

    const cx = x + Math.floor(w / 2);

    // Tapete vermelho central
    renderer.fillRect(cx - 16, y + 8, 32, h - 8, NES_COLORS.RED);
    renderer.fillRect(cx - 18, y + 8, 2, h - 8, NES_COLORS.GOLD);
    renderer.fillRect(cx + 16, y + 8, 2, h - 8, NES_COLORS.GOLD);

    // Colunas laterais
    const pillar = this.assetManager.getTile('pillar');
    for (let rowY = y + 16; rowY < y + h - 16; rowY += 28) {
      renderer.drawSprite(pillar, cx - 48, rowY);
      renderer.drawSprite(pillar, cx + 32, rowY);
    }

    // Trono e Rei Auren ao fundo
    const throne = this.assetManager.getTile('throne');
    renderer.drawSprite(throne, cx - 8, y + 10);

    const kingSprite = this.assetManager.getNpc('npc_king', 'down');
    renderer.drawSprite(kingSprite, cx - 8, y + 22);

    // Guardas reais perfilados
    const guardSprite = this.assetManager.getNpc('npc_guard', 'down');
    renderer.drawSprite(guardSprite, cx - 30, y + 26);
    renderer.drawSprite(guardSprite, cx + 14, y + 26);

    // Herói caminhando em direção ao Rei Auren
    const walkOffset = Math.max(0, 32 - Math.floor(this.timer / 3));
    const stepFrame = walkOffset > 0 ? ((Math.floor(this.timer / 8) % 2) as 0 | 1) : 0;
    const heroSprite = this.assetManager.getHero('up', stepFrame);
    renderer.drawSprite(heroSprite, cx - 8, y + 48 + walkOffset);
  }
}
