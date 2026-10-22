import { Renderer } from './Renderer';

export interface Scene {
  readonly name: string;
  /**
   * Se true, a cena imediatamente anterior na pilha continua sendo desenhada por baixo
   * (essencial para janelas de menu/diálogo sobre o mapa no estilo Dragon Quest).
   */
  readonly isTransparent?: boolean;

  enter?(data?: unknown): void;
  exit?(): void;
  update(dt: number): void;
  render(renderer: Renderer): void;
}
