import { Input, ActionName } from './Input';

export class TouchControls {
  private input: Input;
  private container: HTMLElement | null = null;
  private toggleButton: HTMLElement | null = null;
  private isVisible = false;
  private activeTouchAction: ActionName | null = null;

  constructor(input: Input) {
    this.input = input;
    this.init();
  }

  private isTouchDevice(): boolean {
    return (
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      window.matchMedia('(pointer: coarse)').matches
    );
  }

  private init(): void {
    // Se for touch device, ativa por padrão; caso contrário, deixa disponível via botão
    this.isVisible = this.isTouchDevice();

    this.createDomElements();
    this.setupEvents();
    this.updateVisibility();

    // Reavalia caso o usuário redimensione ou conecte touch
    window.addEventListener('resize', () => {
      if (!this.isVisible && this.isTouchDevice()) {
        this.isVisible = true;
        this.updateVisibility();
      }
    });
  }

  private createDomElements(): void {
    // Botão flutuante no topo para alternar gamepad touch e fullscreen
    const topBar = document.createElement('div');
    topBar.id = 'touch-top-bar';
    topBar.className = 'touch-top-bar';
    topBar.innerHTML = `
      <button type="button" id="touch-toggle-btn" class="top-util-btn" title="Alternar Controles Touch" aria-label="Alternar Controles">&#127918;</button>
      <button type="button" id="fullscreen-toggle-btn" class="top-util-btn" title="Tela Cheia" aria-label="Tela Cheia">&#x26F6;</button>
    `;
    document.body.appendChild(topBar);

    this.toggleButton = document.getElementById('touch-toggle-btn');
    const fsButton = document.getElementById('fullscreen-toggle-btn');

    if (this.toggleButton) {
      this.toggleButton.addEventListener('click', () => {
        this.isVisible = !this.isVisible;
        this.updateVisibility();
      });
    }

    if (fsButton) {
      fsButton.addEventListener('click', () => {
        this.toggleFullscreen();
      });
    }

    // Container principal do Gamepad Virtual
    this.container = document.createElement('div');
    this.container.id = 'touch-controls';
    this.container.className = 'touch-controls';
    this.container.setAttribute('aria-label', 'Controles Touch Virtuais');

    this.container.innerHTML = `
      <!-- D-Pad Direcional -->
      <div class="dpad-wrapper" id="dpad-zone">
        <div class="dpad-cross">
          <button type="button" class="dpad-button dpad-up" data-action="up" aria-label="Cima">&#9650;</button>
          <button type="button" class="dpad-button dpad-left" data-action="left" aria-label="Esquerda">&#9664;</button>
          <div class="dpad-center"></div>
          <button type="button" class="dpad-button dpad-right" data-action="right" aria-label="Direita">&#9654;</button>
          <button type="button" class="dpad-button dpad-down" data-action="down" aria-label="Baixo">&#9660;</button>
        </div>
      </div>

      <!-- Atalho de Menu e Mapa -->
      <div class="touch-center-group">
        <button type="button" class="touch-pill-button" data-action="map" aria-label="Mapa do Reino">MAPA</button>
      </div>

      <!-- Botões de Ação B e A -->
      <div class="action-buttons-wrapper">
        <button type="button" class="touch-action-button button-b" data-action="cancel" aria-label="Cancelar ou Voltar">
          <span>B</span>
        </button>
        <button type="button" class="touch-action-button button-a" data-action="confirm" aria-label="Confirmar ou Interagir">
          <span>A</span>
        </button>
      </div>
    `;

    document.body.appendChild(this.container);
  }

  private toggleFullscreen(): void {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {
        // Ignora caso negado pelo navegador
      });
    } else {
      document.exitFullscreen().catch(() => {
        // Ignora
      });
    }
  }

  private updateVisibility(): void {
    if (this.container) {
      this.container.style.display = this.isVisible ? 'flex' : 'none';
    }
    if (this.toggleButton) {
      this.toggleButton.style.opacity = this.isVisible ? '0.9' : '0.4';
    }
  }

  private vibrate(): void {
    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(10);
      }
    } catch {
      // Ignora se não for suportado
    }
  }

  private setupEvents(): void {
    if (!this.container) return;

    // 1. Suporte a botões de ação e pílula de mapa
    const buttons = this.container.querySelectorAll<HTMLButtonElement>('[data-action]');
    buttons.forEach((btn) => {
      const action = btn.getAttribute('data-action') as ActionName | null;
      if (!action) return;

      const handlePress = (e: Event) => {
        e.preventDefault();
        e.stopPropagation();
        btn.classList.add('pressed');
        this.vibrate();
        this.input.pressAction(action);
      };

      const handleRelease = (e: Event) => {
        e.preventDefault();
        e.stopPropagation();
        btn.classList.remove('pressed');
        this.input.releaseAction(action);
      };

      btn.addEventListener('pointerdown', handlePress);
      btn.addEventListener('pointerup', handleRelease);
      btn.addEventListener('pointercancel', handleRelease);
      btn.addEventListener('pointerleave', handleRelease);
    });

    // 2. D-Pad inteligente com suporte a arrasto de polegar (Touch Move)
    const dpadZone = document.getElementById('dpad-zone');
    if (dpadZone) {
      let dpadTouchId: number | null = null;

      const getDpadAction = (touchX: number, touchY: number): ActionName | null => {
        const rect = dpadZone.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const deltaX = touchX - centerX;
        const deltaY = touchY - centerY;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

        // Zona morta no centro
        if (distance < 14) return null;

        // Determina o quadrante predominante
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
          return deltaX > 0 ? 'right' : 'left';
        } else {
          return deltaY > 0 ? 'down' : 'up';
        }
      };

      const updateDpadAction = (action: ActionName | null) => {
        if (this.activeTouchAction === action) return;

        // Solta a ação anterior
        if (this.activeTouchAction) {
          this.input.releaseAction(this.activeTouchAction);
          const oldBtn = dpadZone.querySelector(`.dpad-${this.activeTouchAction}`);
          if (oldBtn) oldBtn.classList.remove('pressed');
        }

        // Ativa a nova ação
        this.activeTouchAction = action;
        if (action) {
          this.input.pressAction(action);
          this.vibrate();
          const newBtn = dpadZone.querySelector(`.dpad-${action}`);
          if (newBtn) newBtn.classList.add('pressed');
        }
      };

      dpadZone.addEventListener('touchstart', (e: TouchEvent) => {
        e.preventDefault();
        if (e.changedTouches.length === 0) return;
        const touch = e.changedTouches[0];
        dpadTouchId = touch.identifier;
        const action = getDpadAction(touch.clientX, touch.clientY);
        updateDpadAction(action);
      }, { passive: false });

      dpadZone.addEventListener('touchmove', (e: TouchEvent) => {
        e.preventDefault();
        if (dpadTouchId === null) return;
        for (let i = 0; i < e.touches.length; i++) {
          const touch = e.touches[i];
          if (touch.identifier === dpadTouchId) {
            const action = getDpadAction(touch.clientX, touch.clientY);
            updateDpadAction(action);
            break;
          }
        }
      }, { passive: false });

      const clearDpad = (e: TouchEvent) => {
        e.preventDefault();
        dpadTouchId = null;
        updateDpadAction(null);
      };

      dpadZone.addEventListener('touchend', clearDpad, { passive: false });
      dpadZone.addEventListener('touchcancel', clearDpad, { passive: false });
    }
  }
}
