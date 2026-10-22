import { Scene } from './Scene';
import { Renderer } from './Renderer';
import { CONFIG } from '../config';

type TransitionState = 'none' | 'fade_out' | 'fade_in';

export class SceneManager {
  private stack: Scene[] = [];

  // Transições de fade
  private transitionState: TransitionState = 'none';
  private transitionProgress = 0; // 0 a 1
  private nextScene: Scene | null = null;
  private nextSceneData: unknown = null;
  private fadeFrames = CONFIG.ui.fadeFrames;

  constructor() {}

  public get currentScene(): Scene | null {
    return this.stack.length > 0 ? this.stack[this.stack.length - 1] : null;
  }

  public get stackSize(): number {
    return this.stack.length;
  }

  /**
   * Empilha uma nova cena (ex: abrir Menu sobre o Mapa).
   */
  public push(scene: Scene, data?: unknown): void {
    this.stack.push(scene);
    scene.enter?.(data);
  }

  /**
   * Remove a cena do topo (ex: fechar Menu e voltar ao Mapa).
   */
  public pop(): Scene | undefined {
    const popped = this.stack.pop();
    popped?.exit?.();
    return popped;
  }

  /**
   * Substitui a cena do topo sem transição.
   */
  public replace(scene: Scene, data?: unknown): void {
    const old = this.stack.pop();
    old?.exit?.();
    this.stack.push(scene);
    scene.enter?.(data);
  }

  /**
   * Inicia transição suave de fade (NES-style) substituindo a cena atual.
   */
  public fadeTransition(toScene: Scene, data?: unknown): void {
    if (this.transitionState !== 'none') return;
    this.nextScene = toScene;
    this.nextSceneData = data;
    this.transitionState = 'fade_out';
    this.transitionProgress = 0;
  }

  public update(dt: number): void {
    // 1. Processa animação de transição, se ativa
    if (this.transitionState === 'fade_out') {
      this.transitionProgress += 1 / this.fadeFrames;
      if (this.transitionProgress >= 1) {
        this.transitionProgress = 1;
        // Efetua a troca de cena
        if (this.nextScene) {
          while (this.stack.length > 0) {
            const sc = this.stack.pop();
            sc?.exit?.();
          }
          this.stack.push(this.nextScene);
          this.nextScene.enter?.(this.nextSceneData);
          this.nextScene = null;
          this.nextSceneData = null;
        }
        this.transitionState = 'fade_in';
      }
      return;
    }

    if (this.transitionState === 'fade_in') {
      this.transitionProgress -= 1 / this.fadeFrames;
      if (this.transitionProgress <= 0) {
        this.transitionProgress = 0;
        this.transitionState = 'none';
      }
      // Durante o fade in a cena já recebe updates
    }

    // 2. Atualiza apenas a cena do topo da pilha
    const active = this.currentScene;
    if (active) {
      active.update(dt);
    }
  }

  public render(renderer: Renderer): void {
    if (this.stack.length === 0) return;

    // Encontra a cena opaca mais alta para renderizar da base para o topo
    let firstOpaqueIndex = this.stack.length - 1;
    while (firstOpaqueIndex > 0 && this.stack[firstOpaqueIndex].isTransparent) {
      firstOpaqueIndex--;
    }

    for (let i = firstOpaqueIndex; i < this.stack.length; i++) {
      this.stack[i].render(renderer);
    }

    // Aplica o overlay de fade, se em transição
    if (this.transitionState !== 'none') {
      renderer.drawFade(this.transitionProgress);
    }
  }
}
