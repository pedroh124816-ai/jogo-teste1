import { CONFIG } from '../config';
import { Direction } from '../assets/heroGraphics';
import { Renderer } from '../engine/Renderer';
import { Camera } from '../engine/Camera';
import { AssetManager } from '../assets/AssetManager';
import { Input } from '../engine/Input';
import { NPC } from './NPC';

export interface ISolidMap {
  isSolid(tileX: number, tileY: number): boolean;
}

export class Player {
  // Posição no grid (lógica discreta)
  public tileX: number;
  public tileY: number;

  // Posição em pixels no mundo (para interpolação suave)
  public pixelX: number;
  public pixelY: number;

  // Direção atual
  public direction: Direction;

  // Estado de deslocamento passo a passo
  public isMoving = false;
  private moveProgress = 0; // 0.0 a 1.0
  private startTileX: number;
  private startTileY: number;
  private targetTileX: number;
  private targetTileY: number;

  // Animação de caminhada
  private animFrame = 0;
  private animTimer = 0;

  constructor(startX: number = CONFIG.player.startTile.x, startY: number = CONFIG.player.startTile.y) {
    this.tileX = startX;
    this.tileY = startY;
    this.startTileX = startX;
    this.startTileY = startY;
    this.targetTileX = startX;
    this.targetTileY = startY;

    this.pixelX = startX * CONFIG.screen.tileSize;
    this.pixelY = startY * CONFIG.screen.tileSize;
    this.direction = CONFIG.player.startDirection as Direction;
  }

  /**
   * Reposiciona o jogador imediatamente no grid (usado em transições entre mapas)
   */
  public setTilePosition(tileX: number, tileY: number, direction?: Direction): void {
    this.tileX = tileX;
    this.tileY = tileY;
    this.startTileX = tileX;
    this.startTileY = tileY;
    this.targetTileX = tileX;
    this.targetTileY = tileY;

    this.pixelX = tileX * CONFIG.screen.tileSize;
    this.pixelY = tileY * CONFIG.screen.tileSize;
    this.isMoving = false;
    this.moveProgress = 0;
    this.didJustFinishStep = false;
    if (direction) {
      this.direction = direction;
    }
  }

  public didJustFinishStep = false;

  public consumeStepFinished(): boolean {
    const finished = this.didJustFinishStep;
    this.didJustFinishStep = false;
    return finished;
  }

  /**
   * Retorna a coordenada do tile exatamente à frente do jogador
   */
  public getFacingTile(): { x: number; y: number } {
    let dx = 0;
    let dy = 0;
    if (this.direction === 'up') dy = -1;
    else if (this.direction === 'down') dy = 1;
    else if (this.direction === 'left') dx = -1;
    else if (this.direction === 'right') dx = 1;
    return { x: this.tileX + dx, y: this.tileY + dy };
  }

  public update(input: Input, solidMap: ISolidMap, npcs: readonly NPC[] = []): void {
    if (this.isMoving) {
      this.updateMovement(input, solidMap, npcs);
    } else {
      this.checkInput(input, solidMap, npcs);
    }

    this.updateAnimation();
  }

  private checkInput(input: Input, solidMap: ISolidMap, npcs: readonly NPC[]): void {
    let desiredDir: Direction | null = null;

    // Prioridade de leitura direcional
    if (input.isDown('up')) desiredDir = 'up';
    else if (input.isDown('down')) desiredDir = 'down';
    else if (input.isDown('left')) desiredDir = 'left';
    else if (input.isDown('right')) desiredDir = 'right';

    if (!desiredDir) return;

    // 1. Sempre vira na direção indicada
    this.direction = desiredDir;

    // 2. Calcula o tile de destino
    let dx = 0;
    let dy = 0;
    if (desiredDir === 'up') dy = -1;
    else if (desiredDir === 'down') dy = 1;
    else if (desiredDir === 'left') dx = -1;
    else if (desiredDir === 'right') dx = 1;

    const nextX = this.tileX + dx;
    const nextY = this.tileY + dy;

    // 3. Testa colisão com o mapa
    if (solidMap.isSolid(nextX, nextY)) {
      return;
    }

    // 4. Testa colisão com NPCs sólidos
    for (const npc of npcs) {
      if (npc.tileX === nextX && npc.tileY === nextY) {
        return;
      }
    }

    // 5. Inicia passo de 16 pixels
    this.isMoving = true;
    this.moveProgress = 0;
    this.startTileX = this.tileX;
    this.startTileY = this.tileY;
    this.targetTileX = nextX;
    this.targetTileY = nextY;
  }

  private updateMovement(input: Input, solidMap: ISolidMap, npcs: readonly NPC[]): void {
    const stepFrames = Math.max(1, CONFIG.player.stepFrames);
    this.moveProgress += 1 / stepFrames;

    if (this.moveProgress >= 1) {
      // Passo concluído: crava na posição exata do tile
      this.tileX = this.targetTileX;
      this.tileY = this.targetTileY;
      this.pixelX = this.tileX * CONFIG.screen.tileSize;
      this.pixelY = this.tileY * CONFIG.screen.tileSize;
      this.isMoving = false;
      this.moveProgress = 0;
      this.didJustFinishStep = true;

      // Encadeamento contínuo se o jogador continuar segurando
      this.checkInput(input, solidMap, npcs);
    } else {
      // Interpolação linear da posição
      const startPixelX = this.startTileX * CONFIG.screen.tileSize;
      const startPixelY = this.startTileY * CONFIG.screen.tileSize;
      const endPixelX = this.targetTileX * CONFIG.screen.tileSize;
      const endPixelY = this.targetTileY * CONFIG.screen.tileSize;

      this.pixelX = Math.round(startPixelX + (endPixelX - startPixelX) * this.moveProgress);
      this.pixelY = Math.round(startPixelY + (endPixelY - startPixelY) * this.moveProgress);
    }
  }

  private updateAnimation(): void {
    const animRate = this.isMoving
      ? CONFIG.player.walkAnimFrames
      : (CONFIG.player.animateWhenIdle ? CONFIG.player.walkAnimFrames * 2 : 0);

    if (animRate > 0) {
      this.animTimer++;
      if (this.animTimer >= animRate) {
        this.animTimer = 0;
        this.animFrame = (this.animFrame + 1) % 2;
      }
    } else {
      this.animFrame = 0;
    }
  }

  public render(renderer: Renderer, camera: Camera, assetManager: AssetManager): void {
    const sprite = assetManager.getHero(this.direction, this.animFrame);
    const screenPos = camera.toScreen(this.pixelX, this.pixelY);

    renderer.drawSprite(sprite, screenPos.x, screenPos.y);
  }
}
