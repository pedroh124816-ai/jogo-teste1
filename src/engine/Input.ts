import { CONFIG } from '../config';

export type ActionName = 'up' | 'down' | 'left' | 'right' | 'confirm' | 'cancel' | 'map' | 'debug';

export class Input {
  private keysDown: Set<string> = new Set();
  private keysPressed: Set<string> = new Set();
  private keysReleased: Set<string> = new Set();

  private actionMap: Record<ActionName, readonly string[]> = {
    up: CONFIG.controls.up,
    down: CONFIG.controls.down,
    left: CONFIG.controls.left,
    right: CONFIG.controls.right,
    confirm: CONFIG.controls.confirm,
    cancel: CONFIG.controls.cancel,
    map: CONFIG.controls.map,
    debug: CONFIG.controls.debug,
  };

  private boundKeyDown: (e: KeyboardEvent) => void;
  private boundKeyUp: (e: KeyboardEvent) => void;
  private boundBlur: () => void;

  constructor() {
    this.boundKeyDown = this.handleKeyDown.bind(this);
    this.boundKeyUp = this.handleKeyUp.bind(this);
    this.boundBlur = this.handleBlur.bind(this);
    this.attach();
  }

  private attach(): void {
    if (typeof window === 'undefined') return;
    window.addEventListener('keydown', this.boundKeyDown);
    window.addEventListener('keyup', this.boundKeyUp);
    window.addEventListener('blur', this.boundBlur);
  }

  public detach(): void {
    if (typeof window === 'undefined') return;
    window.removeEventListener('keydown', this.boundKeyDown);
    window.removeEventListener('keyup', this.boundKeyUp);
    window.removeEventListener('blur', this.boundBlur);
    this.clearAll();
  }

  private handleKeyDown(e: KeyboardEvent): void {
    // Evita scroll da página com setas / Espaço / Enter
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
      e.preventDefault();
    }

    if (!this.keysDown.has(e.code)) {
      this.keysPressed.add(e.code);
    }
    this.keysDown.add(e.code);
  }

  private handleKeyUp(e: KeyboardEvent): void {
    this.keysDown.delete(e.code);
    this.keysReleased.add(e.code);
  }

  private handleBlur(): void {
    this.clearAll();
  }

  public clearAll(): void {
    this.keysDown.clear();
    this.keysPressed.clear();
    this.keysReleased.clear();
  }

  /**
   * Chamado no início de cada tick fixo para limpar gatilhos de borda.
   */
  public update(): void {
    this.keysPressed.clear();
    this.keysReleased.clear();
  }

  /**
   * Pressiona uma ação virtualmente (usado por controles touch / gamepad virtual).
   */
  public pressAction(action: ActionName): void {
    const codes = this.actionMap[action];
    const code = codes && codes.length > 0 ? codes[0] : action;
    if (!this.keysDown.has(code)) {
      this.keysPressed.add(code);
    }
    this.keysDown.add(code);
  }

  /**
   * Solta uma ação virtualmente (usado por controles touch / gamepad virtual).
   */
  public releaseAction(action: ActionName): void {
    const codes = this.actionMap[action];
    const code = codes && codes.length > 0 ? codes[0] : action;
    this.keysDown.delete(code);
    this.keysReleased.add(code);
  }

  /**
   * Retorna verdadeiro se a ação estiver sendo mantida pressionada.
   */
  public isDown(action: ActionName): boolean {
    const codes = this.actionMap[action];
    for (const code of codes) {
      if (this.keysDown.has(code)) return true;
    }
    return false;
  }

  /**
   * Retorna verdadeiro apenas no frame em que a ação foi pressionada.
   */
  public wasPressed(action: ActionName): boolean {
    const codes = this.actionMap[action];
    for (const code of codes) {
      if (this.keysPressed.has(code)) return true;
    }
    return false;
  }

  /**
   * Retorna verdadeiro se a ação acabou de ser solta.
   */
  public wasReleased(action: ActionName): boolean {
    const codes = this.actionMap[action];
    for (const code of codes) {
      if (this.keysReleased.has(code)) return true;
    }
    return false;
  }
}
