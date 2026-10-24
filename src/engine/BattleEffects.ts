import { NES_COLORS } from './Palette';
import { Renderer } from './Renderer';
import { Sprite } from '../assets/AssetManager';

export interface FloatingText {
  text: string;
  x: number;
  y: number;
  color: string;
  lifetime: number;
  maxLifetime: number;
}

export interface BattleParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  lifetime: number;
  maxLifetime: number;
  gravity?: number;
}

export type SlashType = 'normal' | 'critical' | 'claw';
export type SpellAnimType = 'centelha' | 'fagulha' | 'cura' | 'cura_maior' | 'protecao' | 'eco';

export class BattleEffects {
  // 1. Tremor de tela (Screen Shake)
  private shakeTimer = 0;
  private shakeDuration = 0;
  private shakeIntensity = 0;

  // 2. Flash do monstro
  private flashTimer = 0;
  private flashVisible = false;

  // 3. Hit-stop
  private hitStopFrames = 0;

  // 4. Textos flutuantes
  private floatingTexts: FloatingText[] = [];

  // 5. Partículas visuais de combate
  private particles: BattleParticle[] = [];

  // 6. Temporizador global de respiração/idle
  private idleTimer = 0;

  // 7. Animação de Corte de Espada / Garras
  private slashActive = false;
  private slashType: SlashType = 'normal';
  private slashTimer = 0;
  private slashMaxFrames = 12;
  private slashX = 128;
  private slashY = 114;
  private onSlashComplete?: () => void;

  // 8. Animação de Ataque do Monstro (Investida / Lunge)
  private lungeActive = false;
  private lungeTimer = 0;
  private lungeMaxFrames = 16;
  public lungeOffsetY = 0;
  private onLungeImpact?: () => void;
  private onLungeComplete?: () => void;

  // 9. Animação de Magias
  private spellActive = false;
  private spellType: SpellAnimType = 'centelha';
  private spellTimer = 0;
  private spellMaxFrames = 18;
  private spellTargetX = 128;
  private spellTargetY = 114;
  private onSpellComplete?: () => void;

  // 10. Animação de Derrota / Dissolução do Monstro
  private defeatActive = false;
  private defeatTimer = 0;
  private defeatMaxFrames = 30;
  private onDefeatComplete?: () => void;

  // Cache de sprites sombreados para cavernas
  private caveShadedCache: Map<string, HTMLCanvasElement> = new Map();

  private getCaveShadedCanvas(monsterId: string, sprite: Sprite): HTMLCanvasElement {
    const cached = this.caveShadedCache.get(monsterId);
    if (cached && cached.width === sprite.width && cached.height === sprite.height) {
      return cached;
    }
    if (typeof document === 'undefined') {
      return sprite.canvas;
    }
    const c = document.createElement('canvas');
    c.width = sprite.width;
    c.height = sprite.height;
    const cctx = c.getContext('2d');
    if (!cctx) return sprite.canvas;

    cctx.imageSmoothingEnabled = false;
    cctx.drawImage(sprite.canvas, 0, 0);
    cctx.globalCompositeOperation = 'source-atop';

    // Reduz o contraste excessivo com véu escuro de caverna
    cctx.fillStyle = 'rgba(14, 10, 22, 0.36)';
    cctx.fillRect(0, 0, c.width, c.height);

    // Sombreamento gradual mais denso na base do personagem
    const grad = cctx.createLinearGradient(0, 0, 0, c.height);
    grad.addColorStop(0, 'rgba(28, 18, 12, 0.10)');
    grad.addColorStop(0.6, 'rgba(12, 10, 20, 0.25)');
    grad.addColorStop(1, 'rgba(6, 4, 12, 0.50)');
    cctx.fillStyle = grad;
    cctx.fillRect(0, 0, c.width, c.height);

    cctx.globalCompositeOperation = 'source-over';
    this.caveShadedCache.set(monsterId, c);
    return c;
  }

  public update(): void {
    this.idleTimer++;

    // Hit-stop congela a passagem de tempo de efeitos temporais
    if (this.hitStopFrames > 0) {
      this.hitStopFrames--;
      return;
    }

    // Processa tremor de tela
    if (this.shakeTimer > 0) {
      this.shakeTimer--;
      if (this.shakeTimer <= 0) {
        this.shakeIntensity = 0;
      }
    }

    // Processa flash do monstro (pisca a cada 3 frames)
    if (this.flashTimer > 0) {
      this.flashTimer--;
      this.flashVisible = Math.floor(this.flashTimer / 3) % 2 === 0;
    } else {
      this.flashVisible = false;
    }

    // Processa textos flutuantes
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.lifetime--;
      ft.y -= 0.5; // Sobe suavemente
      if (ft.lifetime <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }

    // Processa partículas
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.lifetime--;
      p.x += p.vx;
      p.y += p.vy;
      if (p.gravity) {
        p.vy += p.gravity;
      }
      if (p.lifetime <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // Processa animação de corte
    if (this.slashActive) {
      this.slashTimer++;
      if (this.slashTimer >= this.slashMaxFrames) {
        this.slashActive = false;
        if (this.onSlashComplete) {
          const cb = this.onSlashComplete;
          this.onSlashComplete = undefined;
          cb();
        }
      }
    }

    // Processa animação de investida do monstro (lunge)
    if (this.lungeActive) {
      this.lungeTimer++;
      const half = Math.floor(this.lungeMaxFrames / 2);
      if (this.lungeTimer < half) {
        // Arrancada para frente (desce em Y em direção à tela)
        this.lungeOffsetY = Math.round((this.lungeTimer / half) * 14);
      } else if (this.lungeTimer === half) {
        this.lungeOffsetY = 14;
        if (this.onLungeImpact) {
          const impactCb = this.onLungeImpact;
          this.onLungeImpact = undefined;
          impactCb();
        }
      } else {
        // Retorno suave à base
        const progress = (this.lungeTimer - half) / (this.lungeMaxFrames - half);
        this.lungeOffsetY = Math.round((1 - progress) * 14);
      }

      if (this.lungeTimer >= this.lungeMaxFrames) {
        this.lungeActive = false;
        this.lungeOffsetY = 0;
        if (this.onLungeComplete) {
          const compCb = this.onLungeComplete;
          this.onLungeComplete = undefined;
          compCb();
        }
      }
    }

    // Processa animação de magia
    if (this.spellActive) {
      this.spellTimer++;
      this.updateSpellParticles();
      if (this.spellTimer >= this.spellMaxFrames) {
        this.spellActive = false;
        if (this.onSpellComplete) {
          const cb = this.onSpellComplete;
          this.onSpellComplete = undefined;
          cb();
        }
      }
    }

    // Processa animação de derrota/dissolução
    if (this.defeatActive) {
      this.defeatTimer++;
      // Gera fumaça/cinzas subindo do monstro
      if (Math.random() < 0.6) {
        this.addParticle({
          x: 128 + (Math.random() * 40 - 20),
          y: 114 + (Math.random() * 20 - 10),
          vx: (Math.random() - 0.5) * 0.8,
          vy: -1.2 - Math.random() * 0.8,
          color: Math.random() < 0.5 ? NES_COLORS.MED_GRAY : NES_COLORS.DARK_GRAY,
          size: Math.random() < 0.5 ? 2 : 3,
          lifetime: 20,
          maxLifetime: 20,
        });
      }

      if (this.defeatTimer >= this.defeatMaxFrames) {
        this.defeatActive = false;
        if (this.onDefeatComplete) {
          const cb = this.onDefeatComplete;
          this.onDefeatComplete = undefined;
          cb();
        }
      }
    }
  }

  // =========================================================================
  // GATILHOS DE ANIMAÇÃO
  // =========================================================================

  public triggerScreenShake(intensity = 4, duration = 16): void {
    this.shakeIntensity = intensity;
    this.shakeDuration = duration;
    this.shakeTimer = duration;
  }

  public triggerMonsterFlash(duration = 18): void {
    this.flashTimer = duration;
    this.flashVisible = true;
  }

  public triggerHitStop(frames = 6): void {
    this.hitStopFrames = frames;
  }

  public addFloatingText(text: string, x: number, y: number, color = '#fcfcfc', lifetime = 40): void {
    this.floatingTexts.push({
      text,
      x,
      y,
      color,
      lifetime,
      maxLifetime: lifetime,
    });
  }

  public addParticle(p: BattleParticle): void {
    this.particles.push(p);
  }

  /**
   * Dispara a animação clássica de fatiamento de espada contra o monstro.
   */
  public triggerSlash(
    x: number,
    y: number,
    isCrit = false,
    onComplete?: () => void
  ): void {
    this.slashActive = true;
    this.slashType = isCrit ? 'critical' : 'normal';
    this.slashTimer = 0;
    this.slashMaxFrames = isCrit ? 14 : 10;
    this.slashX = x;
    this.slashY = y;
    this.onSlashComplete = onComplete;

    // Se for crítico, dispara hit-stop e flash de tela inicial
    if (isCrit) {
      this.triggerHitStop(7);
      this.triggerScreenShake(4, 16);
    }

    // Gera erupção de faíscas brilhantes
    const count = isCrit ? 22 : 12;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.2 + Math.random() * (isCrit ? 3.5 : 2.2);
      this.addParticle({
        x: x + (Math.random() * 8 - 4),
        y: y + (Math.random() * 8 - 4),
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 0.5,
        color: Math.random() < 0.6 ? NES_COLORS.GOLD : NES_COLORS.WHITE,
        size: Math.random() < 0.3 ? 3 : 2,
        lifetime: 14 + Math.floor(Math.random() * 10),
        maxLifetime: 24,
        gravity: 0.12,
      });
    }
  }

  /**
   * Dispara o ataque físico do monstro com arrancada (lunge) e corte de garras na tela.
   */
  public triggerMonsterAttack(
    onImpact?: () => void,
    onComplete?: () => void
  ): void {
    this.lungeActive = true;
    this.lungeTimer = 0;
    this.lungeMaxFrames = 16;
    this.lungeOffsetY = 0;
    this.onLungeImpact = () => {
      // Dispara marcas de corte de garras e impacto
      this.triggerClawSlash(128, 114);
      if (onImpact) onImpact();
    };
    this.onLungeComplete = onComplete;
  }

  public triggerClawSlash(x: number, y: number): void {
    this.slashActive = true;
    this.slashType = 'claw';
    this.slashTimer = 0;
    this.slashMaxFrames = 10;
    this.slashX = x;
    this.slashY = y;

    // Faíscas carmesins de impacto
    for (let i = 0; i < 10; i++) {
      this.addParticle({
        x: x + (Math.random() * 20 - 10),
        y: y + (Math.random() * 20 - 10),
        vx: (Math.random() - 0.5) * 3,
        vy: (Math.random() - 0.5) * 3,
        color: Math.random() < 0.5 ? NES_COLORS.RED : NES_COLORS.DARK_RED,
        size: 2,
        lifetime: 12,
        maxLifetime: 12,
      });
    }
  }

  /**
   * Dispara a animação visual de magia elemental ou de suporte.
   */
  public triggerSpell(
    spellId: string,
    targetX: number,
    targetY: number,
    onComplete?: () => void
  ): void {
    this.spellActive = true;
    this.spellType = (spellId as SpellAnimType) || 'centelha';
    this.spellTimer = 0;
    this.spellTargetX = targetX;
    this.spellTargetY = targetY;
    this.onSpellComplete = onComplete;

    switch (this.spellType) {
      case 'centelha':
        this.spellMaxFrames = 16;
        this.triggerScreenShake(3, 14);
        break;
      case 'fagulha':
        this.spellMaxFrames = 20;
        this.triggerScreenShake(4, 16);
        break;
      case 'cura':
      case 'cura_maior':
        this.spellMaxFrames = 22;
        break;
      case 'protecao':
        this.spellMaxFrames = 18;
        break;
      case 'eco':
        this.spellMaxFrames = 24;
        this.triggerScreenShake(2, 18);
        break;
      default:
        this.spellMaxFrames = 16;
    }
  }

  private updateSpellParticles(): void {
    const tx = this.spellTargetX;
    const ty = this.spellTargetY;

    if (this.spellType === 'fagulha') {
      // Erupção de labaredas em espiral
      for (let i = 0; i < 3; i++) {
        this.addParticle({
          x: tx + (Math.random() * 32 - 16),
          y: ty + 16,
          vx: (Math.random() - 0.5) * 1.5,
          vy: -2.2 - Math.random() * 2,
          color: Math.random() < 0.5 ? NES_COLORS.YELLOW : NES_COLORS.RED,
          size: Math.random() < 0.5 ? 3 : 2,
          lifetime: 14,
          maxLifetime: 14,
        });
      }
    } else if (this.spellType === 'cura' || this.spellType === 'cura_maior') {
      // Partículas sagradas subindo da caixa de status
      if (this.spellTimer % 2 === 0) {
        this.addParticle({
          x: tx + (Math.random() * 40 - 20),
          y: ty + 8,
          vx: (Math.random() - 0.5) * 0.6,
          vy: -1.5 - Math.random() * 1.2,
          color: Math.random() < 0.5 ? NES_COLORS.PALE_GREEN : NES_COLORS.WHITE,
          size: 2,
          lifetime: 18,
          maxLifetime: 18,
        });
      }
    } else if (this.spellType === 'eco') {
      // Partículas ciano de ressonância Veyra
      const angle = (this.spellTimer * 0.6) + Math.random();
      const dist = 10 + this.spellTimer * 2;
      this.addParticle({
        x: tx + Math.cos(angle) * dist,
        y: ty + Math.sin(angle) * dist,
        vx: Math.cos(angle) * 0.8,
        vy: Math.sin(angle) * 0.8,
        color: NES_COLORS.CYAN,
        size: 2,
        lifetime: 12,
        maxLifetime: 12,
      });
    }
  }

  /**
   * Dispara a animação clássica de derrota e dissolução do monstro.
   */
  public triggerMonsterDefeat(onComplete?: () => void): void {
    this.defeatActive = true;
    this.defeatTimer = 0;
    this.defeatMaxFrames = 28;
    this.onDefeatComplete = onComplete;
    this.triggerScreenShake(2, 20);
  }

  // =========================================================================
  // ESTADOS E CONSULTAS
  // =========================================================================

  public isBusy(): boolean {
    return this.slashActive || this.lungeActive || this.spellActive || this.defeatActive;
  }

  public isHitStopped(): boolean {
    return this.hitStopFrames > 0;
  }

  public isMonsterFlashVisible(): boolean {
    return this.flashVisible;
  }

  public isDefeatActive(): boolean {
    return this.defeatActive;
  }

  public getScreenOffset(): { x: number; y: number } {
    if (this.shakeTimer <= 0 || this.shakeIntensity <= 0) {
      return { x: 0, y: 0 };
    }
    const decay = this.shakeTimer / this.shakeDuration;
    const currentIntensity = this.shakeIntensity * decay;
    const offsetX = Math.round((Math.random() * 2 - 1) * currentIntensity);
    const offsetY = Math.round((Math.random() * 2 - 1) * currentIntensity);
    return { x: offsetX, y: offsetY };
  }

  public getFloatingTexts(): readonly FloatingText[] {
    return this.floatingTexts;
  }

  public reset(): void {
    this.shakeTimer = 0;
    this.shakeIntensity = 0;
    this.flashTimer = 0;
    this.flashVisible = false;
    this.hitStopFrames = 0;
    this.floatingTexts = [];
    this.particles = [];
    this.slashActive = false;
    this.lungeActive = false;
    this.lungeOffsetY = 0;
    this.spellActive = false;
    this.defeatActive = false;
    this.defeatTimer = 0;
  }

  // =========================================================================
  // RENDERIZAÇÃO DOS EFEITOS E ANIMAÇÕES
  // =========================================================================

  /**
   * Renderiza o sprite do monstro aplicando idle orgânico (respiração/squash/voo),
   * investida física e efeito de dissolução por scanlines na derrota.
   */
  public renderMonster(
    renderer: Renderer,
    sprite: Sprite,
    baseX: number,
    baseY: number,
    monsterId: string,
    isCave = false
  ): void {
    // Se o flash estiver ativo no frame de invisibilidade, não desenha
    if (this.flashVisible) return;

    const ctx = renderer.ctx;
    let renderX = baseX;
    let renderY = baseY + this.lungeOffsetY;
    let scaleX = 1;
    let scaleY = 1;

    // 1. Aplica Idle Orgânico específico por espécie
    if (!this.defeatActive && !this.lungeActive) {
      if (
        monsterId === 'gosma_cinza' ||
        monsterId === 'gosma_azul' ||
        monsterId === 'gosma_vermelha' ||
        monsterId === 'gosma_dourada' ||
        monsterId === 'anemona_eletrica'
      ) {
        // Squash & stretch senoidal
        const bounce = Math.sin(this.idleTimer * 0.09);
        scaleX = 1 + bounce * 0.06;
        scaleY = 1 - bounce * 0.06;
        // Mantém a base assentada no solo da arena
        renderY += Math.round(bounce * 1.5);
      } else if (
        monsterId === 'corvo_manchado' ||
        monsterId === 'morcego_treva' ||
        monsterId === 'gaivota_abissal' ||
        monsterId === 'guardiao_espectral'
      ) {
        // Flutuação aérea contínua
        const hover = Math.sin(this.idleTimer * 0.1) * 3;
        renderY += Math.round(hover);
      } else {
        // Respiração rítmica de peito para criaturas terrestres e chefes
        const breathe = Math.sin(this.idleTimer * 0.05);
        renderY += Math.round(breathe * 1.2);
        scaleY = 1 + breathe * 0.02;
      }
    }

    const sourceCanvas = isCave ? this.getCaveShadedCanvas(monsterId, sprite) : sprite.canvas;

    // Desenha sombra elíptica projetada no chão da arena sob o monstro
    if (!this.defeatActive) {
      const shadowCx = Math.round(baseX + sprite.width / 2);
      const shadowCy = Math.round(baseY + sprite.height - 2 + this.lungeOffsetY);
      const shadowRx = Math.round(sprite.width * 0.42);
      const shadowRy = Math.max(3, Math.round(sprite.height * 0.11));
      ctx.save();
      ctx.fillStyle = isCave ? 'rgba(0, 0, 0, 0.62)' : 'rgba(0, 0, 0, 0.42)';
      ctx.beginPath();
      if (typeof ctx.ellipse === 'function') {
        ctx.ellipse(shadowCx, shadowCy, shadowRx, shadowRy, 0, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillRect(shadowCx - shadowRx, shadowCy - shadowRy, shadowRx * 2, shadowRy * 2);
      }
      ctx.restore();
    }

    // 2. Renderização durante a Dissolução (Derrota)
    if (this.defeatActive) {
      const progress = this.defeatTimer / this.defeatMaxFrames;
      // Pisca em vermelho/branco antes de dissolver
      if (this.defeatTimer < 8 && Math.floor(this.defeatTimer / 2) % 2 === 0) {
        ctx.fillStyle = NES_COLORS.RED;
        ctx.fillRect(renderX, renderY, sprite.width, sprite.height);
        return;
      }

      // Efeito de dissolução em scanlines estilo Dragon Quest / Final Fantasy
      const h = sprite.height;
      const w = sprite.width;
      const dissolveThreshold = Math.floor(progress * 4); // 0 a 3

      for (let y = 0; y < h; y++) {
        // Linhas somem alternadamente conforme o progresso
        if ((y + Math.floor(progress * 10)) % 4 < dissolveThreshold) {
          continue; // Linha dissolvida
        }
        // As linhas restantes afundam levemente
        const sinkY = Math.floor(progress * 8);
        ctx.drawImage(
          sourceCanvas,
          0,
          y,
          w,
          1,
          renderX,
          renderY + y + sinkY,
          w,
          1
        );
      }
      return;
    }

    // 3. Renderização normal com suporte a transformações e sombreamento de caverna
    if (scaleX === 1 && scaleY === 1) {
      if (isCave) {
        ctx.drawImage(sourceCanvas, Math.round(renderX), Math.round(renderY));
      } else {
        renderer.drawSprite(sprite, renderX, renderY);
      }
    } else {
      const drawW = Math.round(sprite.width * scaleX);
      const drawH = Math.round(sprite.height * scaleY);
      const drawX = Math.round(renderX + (sprite.width - drawW) / 2);
      const drawY = Math.round(renderY + (sprite.height - drawH));
      ctx.drawImage(sourceCanvas, drawX, drawY, drawW, drawH);
    }
  }

  /**
   * Renderiza todos os efeitos visuais (cortes, magias, partículas e textos).
   */
  public render(renderer: Renderer): void {
    const ctx = renderer.ctx;

    // 1. Renderiza Corte de Espada / Golpe do Herói / Garras
    if (this.slashActive) {
      this.renderSlash(ctx);
    }

    // 2. Renderiza Efeito Visual de Magia
    if (this.spellActive) {
      this.renderSpell(ctx);
    }

    // 3. Renderiza Partículas de Combate
    for (const p of this.particles) {
      const alpha = Math.max(0, p.lifetime / p.maxLifetime);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = alpha;
      ctx.fillRect(Math.round(p.x), Math.round(p.y), p.size, p.size);
    }
    ctx.globalAlpha = 1.0;

    // 4. Renderiza Textos Flutuantes de Dano
    for (const ft of this.floatingTexts) {
      renderer.drawText(ft.text, Math.round(ft.x), Math.round(ft.y), {
        color: ft.color,
      });
    }
  }

  private renderSlash(ctx: CanvasRenderingContext2D): void {
    const progress = this.slashTimer / this.slashMaxFrames;
    const cx = this.slashX;
    const cy = this.slashY;

    if (this.slashType === 'claw') {
      // Três marcas de garras carmesins descendo em diagonal
      ctx.strokeStyle = NES_COLORS.RED;
      ctx.lineWidth = 2;
      const clawLen = 22;
      const offsets = [-7, 0, 7];

      for (const off of offsets) {
        const x1 = cx - 12 + off;
        const y1 = cy - 14 + off * 0.4;
        const currentLen = clawLen * Math.min(1, progress * 1.6);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x1 + currentLen * 0.8, y1 + currentLen);
        ctx.stroke();
      }
      return;
    }

    // Corte de Espada do Herói (Arco luminoso diagonal)
    const startX = cx + 18 - progress * 36;
    const startY = cy - 18 + progress * 36;

    // Linha principal brilhante em branco
    ctx.strokeStyle = NES_COLORS.WHITE;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx + 16, cy - 16);
    ctx.lineTo(startX, startY);
    ctx.stroke();

    // Rastro secundário de brilho dourado/prateado
    ctx.strokeStyle = this.slashType === 'critical' ? NES_COLORS.YELLOW : NES_COLORS.LIGHT_BLUE;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx + 18, cy - 18);
    ctx.lineTo(startX + 2, startY + 2);
    ctx.stroke();

    // Se for golpe crítico, desenha o segundo corte cruzado em 'X'
    if (this.slashType === 'critical') {
      const crossX = cx - 18 + progress * 36;
      const crossY = cy - 18 + progress * 36;
      ctx.strokeStyle = NES_COLORS.WHITE;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(cx - 16, cy - 16);
      ctx.lineTo(crossX, crossY);
      ctx.stroke();

      ctx.strokeStyle = NES_COLORS.RED;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx - 18, cy - 18);
      ctx.lineTo(crossX - 2, crossY + 2);
      ctx.stroke();
    }
  }

  private renderSpell(ctx: CanvasRenderingContext2D): void {
    const progress = this.spellTimer / this.spellMaxFrames;
    const tx = this.spellTargetX;
    const ty = this.spellTargetY;

    if (this.spellType === 'centelha') {
      // Relâmpagos em ziguezague descendo do topo da arena
      const strobe = Math.floor(this.spellTimer / 2) % 2 === 0;
      ctx.strokeStyle = strobe ? NES_COLORS.WHITE : NES_COLORS.GOLD;
      ctx.lineWidth = 2;

      // Raio principal
      ctx.beginPath();
      ctx.moveTo(tx - 4, 60);
      ctx.lineTo(tx + 6, 75);
      ctx.lineTo(tx - 6, 92);
      ctx.lineTo(tx + 4, 106);
      ctx.lineTo(tx, ty);
      ctx.stroke();

      // Raio secundário ramificado
      if (this.spellTimer > 4) {
        ctx.beginPath();
        ctx.moveTo(tx + 6, 75);
        ctx.lineTo(tx + 16, 88);
        ctx.lineTo(tx + 8, 102);
        ctx.stroke();
      }
    } else if (this.spellType === 'protecao') {
      // Escudo defensivo pulsando ao redor do herói
      const radius = 18 + Math.sin(progress * Math.PI) * 6;
      ctx.strokeStyle = NES_COLORS.CYAN;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(tx, ty, radius, 0, Math.PI * 2);
      ctx.stroke();

      // Losango protetor interno
      ctx.strokeStyle = NES_COLORS.LIGHT_BLUE;
      ctx.lineWidth = 1;
      ctx.strokeRect(tx - radius * 0.6, ty - radius * 0.6, radius * 1.2, radius * 1.2);
    } else if (this.spellType === 'eco') {
      // Ondas sonoras/mágicas circulares Veyra expandindo pelo centro da arena
      const maxR = 48;
      const r1 = progress * maxR;
      const r2 = Math.max(0, (progress - 0.3) * maxR);

      ctx.strokeStyle = NES_COLORS.CYAN;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(tx, ty, r1, 0, Math.PI * 2);
      ctx.stroke();

      if (r2 > 0) {
        ctx.strokeStyle = NES_COLORS.LIGHT_BLUE;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(tx, ty, r2, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  }
}
