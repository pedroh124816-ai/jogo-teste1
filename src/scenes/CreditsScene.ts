import { Scene } from '../engine/Scene';
import { Renderer } from '../engine/Renderer';
import { Input } from '../engine/Input';
import { SceneManager } from '../engine/SceneManager';
import { NES_COLORS } from '../engine/Palette';
import { AssetManager } from '../assets/AssetManager';
import { CONFIG } from '../config';
import { TitleScene } from './TitleScene';
import { soundManager } from '../engine/AudioManager';
import { gameState } from '../state/GameState';

interface CreditLine {
  text: string;
  color?: string;
  isHeader?: boolean;
  spacing?: number;
}

export class CreditsScene implements Scene {
  public readonly name = 'CreditsScene';
  public readonly isTransparent = false;

  private sceneManager: SceneManager;
  private input: Input;
  private assetManager: AssetManager;

  private scrollY: number;
  private timer = 0;
  private isFinished = false;
  private lines: CreditLine[] = [];
  private totalContentHeight = 0;
  private stars: Array<{ x: number; y: number; brightness: number; speed: number }> = [];

  constructor(sceneManager: SceneManager, input: Input, assetManager?: AssetManager) {
    this.sceneManager = sceneManager;
    this.input = input;
    this.assetManager = assetManager ?? new AssetManager();
    this.scrollY = CONFIG.screen.height + 10;

    // Gera estrelas sutis de fundo
    for (let i = 0; i < 35; i++) {
      this.stars.push({
        x: Math.floor(Math.random() * CONFIG.screen.width),
        y: Math.floor(Math.random() * CONFIG.screen.height),
        brightness: Math.random(),
        speed: 0.015 + Math.random() * 0.03,
      });
    }

    this.buildCredits();
  }

  private buildCredits(): void {
    const heroName = gameState.name || 'Herói';

    this.lines = [
      { text: 'A LENDA DE LUMINÁRIO', color: NES_COLORS.GOLD, isHeader: true, spacing: 6 },
      { text: 'FINAL B: A COROA VAZIA', color: NES_COLORS.CYAN, spacing: 32 },

      { text: '- PROTAGONISTA -', color: NES_COLORS.LIGHT_BLUE, isHeader: true, spacing: 6 },
      { text: heroName.toUpperCase(), color: NES_COLORS.WHITE, spacing: 4 },
      { text: 'O Último Guardião de Veyra', color: NES_COLORS.LIGHT_GRAY, spacing: 28 },

      { text: '- CRIAÇÃO E HISTÓRIA -', color: NES_COLORS.LIGHT_BLUE, isHeader: true, spacing: 6 },
      { text: 'Bíblia da Narrativa (5 Atos)', color: NES_COLORS.WHITE, spacing: 4 },
      { text: 'O Povo Veyra e a Forja do Lume', color: NES_COLORS.LIGHT_GRAY, spacing: 4 },
      { text: 'Conflito Político e Moralidade', color: NES_COLORS.LIGHT_GRAY, spacing: 28 },

      { text: '- MUNDO & GEOGRAFIA -', color: NES_COLORS.LIGHT_BLUE, isHeader: true, spacing: 6 },
      { text: 'Reino de Luminário', color: NES_COLORS.WHITE, spacing: 4 },
      { text: 'Planalto de Cobreval', color: NES_COLORS.LIGHT_GRAY, spacing: 4 },
      { text: 'Montanhas de Pedrasul', color: NES_COLORS.LIGHT_GRAY, spacing: 4 },
      { text: 'Pântano de Brumaterra', color: NES_COLORS.LIGHT_GRAY, spacing: 4 },
      { text: 'Ilha Ancestral de Veyra', color: NES_COLORS.CYAN, spacing: 28 },

      { text: '- PERSONAGENS & DESTINOS -', color: NES_COLORS.LIGHT_BLUE, isHeader: true, spacing: 6 },
      { text: 'Rei Auren, o Protetor Obcecado', color: NES_COLORS.WHITE, spacing: 4 },
      { text: 'Mestre Tavo & Íris de Alvorada', color: NES_COLORS.LIGHT_GRAY, spacing: 4 },
      { text: 'Sael, o Mensageiro do Bosque', color: NES_COLORS.LIGHT_GRAY, spacing: 4 },
      { text: 'Velho Orun & Guardião Ulan', color: NES_COLORS.LIGHT_GRAY, spacing: 4 },
      { text: 'Príncipe Dagan & Rainha Maren', color: NES_COLORS.LIGHT_GRAY, spacing: 4 },
      { text: 'Regente Olo & Almirante Brasca', color: NES_COLORS.LIGHT_GRAY, spacing: 4 },
      { text: 'Irmã Olívia & Lorde Vael', color: NES_COLORS.LIGHT_GRAY, spacing: 28 },

      { text: '- SISTEMA & COMBATE -', color: NES_COLORS.LIGHT_BLUE, isHeader: true, spacing: 6 },
      { text: 'Engine 2D em TypeScript & Vite', color: NES_COLORS.WHITE, spacing: 4 },
      { text: 'Canvas 2D a 60 Hz Estilo NES', color: NES_COLORS.LIGHT_GRAY, spacing: 4 },
      { text: 'Combate Clássico por Turnos', color: NES_COLORS.LIGHT_GRAY, spacing: 4 },
      { text: '22 Mapas em Tiled JSON', color: NES_COLORS.LIGHT_GRAY, spacing: 28 },

      { text: '- ÁUDIO CHIPTUNE 8-BIT -', color: NES_COLORS.LIGHT_BLUE, isHeader: true, spacing: 6 },
      { text: 'Web Audio API Procedural', color: NES_COLORS.WHITE, spacing: 4 },
      { text: '8 Trilhas Musicais em Loop', color: NES_COLORS.LIGHT_GRAY, spacing: 4 },
      { text: '18 Efeitos Sonoros Retrô', color: NES_COLORS.LIGHT_GRAY, spacing: 36 },

      { text: 'A coroa agora repousa', color: NES_COLORS.WHITE, spacing: 4 },
      { text: 'sobre a cabeça daquele que', color: NES_COLORS.WHITE, spacing: 4 },
      { text: 'conhece a dor dos que pagam', color: NES_COLORS.WHITE, spacing: 4 },
      { text: 'o preço do ouro e da luz.', color: NES_COLORS.WHITE, spacing: 20 },

      { text: 'Por quanto tempo resistirá', color: NES_COLORS.GOLD, spacing: 4 },
      { text: 'a promessa de um novo tempo?', color: NES_COLORS.GOLD, spacing: 48 },

      { text: 'O B R I G A D O   P O R   J O G A R', color: NES_COLORS.CYAN, isHeader: true, spacing: 40 },
    ];

    let h = 0;
    for (const l of this.lines) {
      h += 10 + (l.spacing ?? 6);
    }
    this.totalContentHeight = h;
  }

  public enter(): void {
    this.timer = 0;
    this.isFinished = false;
    this.scrollY = CONFIG.screen.height + 10;
    soundManager.playBgm('title');
  }

  public update(): void {
    this.timer++;

    const isFast = this.input.isDown('confirm') || this.input.isDown('cancel');
    const speed = isFast ? 1.6 : 0.45;

    if (!this.isFinished) {
      this.scrollY -= speed;
      // Se todo o texto já subiu, fixa na tela final
      if (this.scrollY < -this.totalContentHeight + (CONFIG.screen.height - 70)) {
        this.isFinished = true;
      }
    }

    // Se pressionar confirm após terminar (ou a qualquer momento para pular se já terminou)
    if (this.isFinished && (this.input.wasPressed('confirm') || this.input.wasPressed('cancel'))) {
      soundManager.playSfx('confirm');
      const titleScene = new TitleScene(this.sceneManager, this.input, this.assetManager);
      this.sceneManager.fadeTransition(titleScene);
    }
  }

  public render(renderer: Renderer): void {
    // 1. Fundo preto com estrelas cintilantes
    renderer.clear(NES_COLORS.BLACK);

    for (const star of this.stars) {
      star.brightness += star.speed;
      const b = (Math.sin(star.brightness) + 1) / 2;
      let starColor = NES_COLORS.DARK_GRAY as string;
      if (b > 0.7) starColor = NES_COLORS.WHITE;
      else if (b > 0.4) starColor = NES_COLORS.MED_GRAY;
      renderer.fillRect(star.x, star.y, 1, 1, starColor);
    }

    // 2. Rolagem dos créditos
    let currentY = Math.floor(this.scrollY);

    for (const line of this.lines) {
      const text = line.text;
      const textW = renderer.measureText(text);
      const textX = Math.floor((CONFIG.screen.width - textW) / 2);

      // Renderiza apenas se estiver na área visível da tela
      if (currentY >= -12 && currentY <= CONFIG.screen.height + 10) {
        if (line.isHeader) {
          // Sombra decorativa para cabeçalhos
          renderer.drawText(text, textX + 1, currentY + 1, { color: NES_COLORS.DARK_BLUE });
        }
        renderer.drawText(text, textX, currentY, { color: line.color ?? NES_COLORS.WHITE });
      }

      currentY += 10 + (line.spacing ?? 6);
    }

    // 3. Moldura e tela final fixa quando a rolagem termina
    if (this.isFinished) {
      const boxW = 220;
      const boxH = 90;
      const boxX = Math.floor((CONFIG.screen.width - boxW) / 2);
      const boxY = Math.floor((CONFIG.screen.height - boxH) / 2);

      renderer.drawWindow(boxX, boxY, boxW, boxH, NES_COLORS.BLACK);

      const title = 'A LENDA DE LUMINÁRIO';
      const titleW = renderer.measureText(title);
      renderer.drawText(title, Math.floor((CONFIG.screen.width - titleW) / 2), boxY + 14, {
        color: NES_COLORS.GOLD,
      });

      const sub = '★ A COROA VAZIA ★';
      const subW = renderer.measureText(sub);
      renderer.drawText(sub, Math.floor((CONFIG.screen.width - subW) / 2), boxY + 30, {
        color: NES_COLORS.CYAN,
      });

      const fin = '[ F I M ]';
      const finW = renderer.measureText(fin);
      renderer.drawText(fin, Math.floor((CONFIG.screen.width - finW) / 2), boxY + 48, {
        color: NES_COLORS.WHITE,
      });

      // Prompt piscante
      const blink = Math.floor(this.timer / 25) % 2 === 0;
      if (blink) {
        const prompt = 'APERTE ENTER PARA O TÍTULO';
        const promptW = renderer.measureText(prompt);
        renderer.drawText(prompt, Math.floor((CONFIG.screen.width - promptW) / 2), boxY + 68, {
          color: NES_COLORS.PALE_GREEN,
        });
      }
    } else {
      // Dica discreta no rodapé durante o scroll
      renderer.drawText('SEGURE [ENTER] PARA ACELERAR', 24, CONFIG.screen.height - 10, {
        color: NES_COLORS.DARK_GRAY,
      });
    }
  }
}
