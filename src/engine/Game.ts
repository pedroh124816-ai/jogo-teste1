import { CONFIG } from '../config';
import { Renderer } from './Renderer';
import { Input } from './Input';
import { TouchControls } from './TouchControls';
import { SceneManager } from './SceneManager';
import { AssetManager } from '../assets/AssetManager';

export class Game {
  public readonly renderer: Renderer;
  public readonly input: Input;
  public readonly touchControls: TouchControls;
  public readonly sceneManager: SceneManager;
  public readonly assetManager: AssetManager;

  private isRunning = false;
  private animationFrameId: number | null = null;

  // Fixed Timestep
  private readonly stepMs = 1000 / CONFIG.loop.updatesPerSecond; // ~16.666ms
  private accumulator = 0;
  private lastTime = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new Renderer(canvas);
    this.input = new Input();
    this.touchControls = new TouchControls(this.input);
    this.sceneManager = new SceneManager();
    this.assetManager = new AssetManager();
  }

  public async init(): Promise<void> {
    // 1. Carrega assets (procedurais ou PNG via IAssetLoader)
    await this.assetManager.init();
  }

  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTime = performance.now();
    this.accumulator = 0;
    this.animationFrameId = requestAnimationFrame(this.loop.bind(this));
  }

  public stop(): void {
    this.isRunning = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  private loop(currentTime: number): void {
    if (!this.isRunning) return;

    // Proteção contra salto temporal (ex: aba em segundo plano)
    let elapsedMs = currentTime - this.lastTime;
    if (elapsedMs > 250) {
      elapsedMs = 250;
    }
    this.lastTime = currentTime;
    this.accumulator += elapsedMs;

    // Fixed timestep loop de lógica
    let updateCount = 0;
    while (this.accumulator >= this.stepMs && updateCount < CONFIG.loop.maxUpdatesPerFrame) {
      // 1. Atualiza lógica da cena ativa
      this.sceneManager.update(1 / CONFIG.loop.updatesPerSecond);

      // 2. Limpa gatilhos únicos de tecla no final do tick
      this.input.update();

      this.accumulator -= this.stepMs;
      updateCount++;
    }

    // Renderiza a cada quadro do navegador
    this.sceneManager.render(this.renderer);

    this.animationFrameId = requestAnimationFrame(this.loop.bind(this));
  }
}
