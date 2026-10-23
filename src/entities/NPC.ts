import { Direction } from '../assets/heroGraphics';
import { NpcSpriteId } from '../assets/npcGraphics';
import { Renderer } from '../engine/Renderer';
import { Camera } from '../engine/Camera';
import { AssetManager } from '../assets/AssetManager';
import { CONFIG } from '../config';
import { gameState } from '../state/GameState';

export interface INpcMap {
  isSolid(tileX: number, tileY: number): boolean;
  getWarpAt?(tileX: number, tileY: number): unknown;
}

export interface NpcConfig {
  id: string;
  name: string;
  spriteId: NpcSpriteId;
  tileX: number;
  tileY: number;
  direction?: Direction;
  dialogue: string;
  showIfFlag?: string;
  hideIfFlag?: string;
  setFlagOnTalk?: string;
  altFlag?: string;
  altDialogue?: string;
  wanderRadius?: number;
}

export class NPC {
  public readonly id: string;
  public readonly name: string;
  public readonly spriteId: NpcSpriteId;

  public tileX: number;
  public tileY: number;
  public pixelX: number;
  public pixelY: number;

  public readonly originTileX: number;
  public readonly originTileY: number;
  public wanderRadius: number;

  public isMoving = false;
  public startTileX: number;
  public startTileY: number;
  public targetTileX: number;
  public targetTileY: number;
  private moveProgress = 0;
  private wanderTimer: number;
  public isTalking = false;

  public direction: Direction;
  public readonly originalDirection: Direction;
  public readonly dialogue: string;
  public readonly showIfFlag?: string;
  public readonly hideIfFlag?: string;
  public readonly setFlagOnTalk?: string;
  public readonly altFlag?: string;
  public readonly altDialogue?: string;

  constructor(config: NpcConfig) {
    this.id = config.id;
    this.name = config.name;
    this.spriteId = config.spriteId;
    this.tileX = config.tileX;
    this.tileY = config.tileY;
    this.originTileX = config.tileX;
    this.originTileY = config.tileY;
    this.startTileX = config.tileX;
    this.startTileY = config.tileY;
    this.targetTileX = config.tileX;
    this.targetTileY = config.tileY;
    this.pixelX = config.tileX * CONFIG.screen.tileSize;
    this.pixelY = config.tileY * CONFIG.screen.tileSize;
    this.direction = config.direction ?? 'down';
    this.originalDirection = this.direction;
    this.dialogue = config.dialogue;
    this.showIfFlag = config.showIfFlag;
    this.hideIfFlag = config.hideIfFlag;
    this.setFlagOnTalk = config.setFlagOnTalk;
    this.altFlag = config.altFlag;
    this.altDialogue = config.altDialogue;

    // Define raio de perambulação padrão por tipo
    if (config.wanderRadius !== undefined) {
      this.wanderRadius = config.wanderRadius;
    } else if (this.spriteId === 'npc_dog' || this.spriteId === 'npc_cat') {
      this.wanderRadius = 2;
    } else if (this.spriteId === 'npc_villager' || this.spriteId === 'npc_girl') {
      this.wanderRadius = 1;
    } else {
      this.wanderRadius = 0;
    }

    // Temporizador inicial escalonado para variação natural
    this.wanderTimer = Math.floor(45 + Math.random() * 90);
  }

  public isVisible(): boolean {
    if (this.showIfFlag && !gameState.flags.evaluateCondition(this.showIfFlag)) {
      return false;
    }
    if (this.hideIfFlag && gameState.flags.evaluateCondition(this.hideIfFlag)) {
      return false;
    }
    return true;
  }

  public getActiveDialogue(): string {
    if (this.altFlag && this.altDialogue && gameState.flags.evaluateCondition(this.altFlag)) {
      return this.altDialogue;
    }
    return this.dialogue;
  }

  /**
   * Vira o NPC em direção ao herói para conversar
   */
  public faceHero(heroTileX: number, heroTileY: number): void {
    this.isTalking = true;
    const dx = heroTileX - this.tileX;
    const dy = heroTileY - this.tileY;

    if (Math.abs(dx) > Math.abs(dy)) {
      this.direction = dx > 0 ? 'right' : 'left';
    } else if (dy !== 0) {
      this.direction = dy > 0 ? 'down' : 'up';
    }
  }

  public resetDirection(): void {
    this.direction = this.originalDirection;
    this.isTalking = false;
    this.wanderTimer = Math.floor(90 + Math.random() * 90);
  }

  /**
   * Atualiza a movimentação autônoma do NPC
   */
  public update(
    map: INpcMap,
    otherNpcs: readonly NPC[],
    playerTileX: number,
    playerTileY: number,
    playerTargetX?: number,
    playerTargetY?: number
  ): void {
    if (!this.isVisible()) return;

    if (this.isMoving) {
      const stepFrames = 22; // velocidade suave de caminhada
      this.moveProgress += 1 / stepFrames;
      if (this.moveProgress >= 1) {
        this.tileX = this.targetTileX;
        this.tileY = this.targetTileY;
        this.pixelX = this.tileX * CONFIG.screen.tileSize;
        this.pixelY = this.tileY * CONFIG.screen.tileSize;
        this.isMoving = false;
        this.moveProgress = 0;
        this.wanderTimer = Math.floor(120 + Math.random() * 180); // 2 a 5 segundos de repouso
      } else {
        const startPx = this.startTileX * CONFIG.screen.tileSize;
        const startPy = this.startTileY * CONFIG.screen.tileSize;
        const targetPx = this.targetTileX * CONFIG.screen.tileSize;
        const targetPy = this.targetTileY * CONFIG.screen.tileSize;
        this.pixelX = Math.round(startPx + (targetPx - startPx) * this.moveProgress);
        this.pixelY = Math.round(startPy + (targetPy - startPy) * this.moveProgress);
      }
      return;
    }

    if (this.isTalking || this.wanderRadius <= 0) return;

    this.wanderTimer--;
    if (this.wanderTimer <= 0) {
      const dirs: Direction[] = ['up', 'down', 'left', 'right'];
      const chosenDir = dirs[Math.floor(Math.random() * dirs.length)];

      // 30% de chance de apenas mudar a direção sem andar
      if (Math.random() < 0.3) {
        this.direction = chosenDir;
        this.wanderTimer = Math.floor(80 + Math.random() * 120);
        return;
      }

      let dx = 0;
      let dy = 0;
      if (chosenDir === 'up') dy = -1;
      else if (chosenDir === 'down') dy = 1;
      else if (chosenDir === 'left') dx = -1;
      else if (chosenDir === 'right') dx = 1;

      const nextX = this.tileX + dx;
      const nextY = this.tileY + dy;

      // Raio máximo a partir da origem
      const dist = Math.abs(nextX - this.originTileX) + Math.abs(nextY - this.originTileY);
      if (dist > this.wanderRadius) {
        this.wanderTimer = Math.floor(60 + Math.random() * 60);
        return;
      }

      // Colisão com cenário
      if (map.isSolid(nextX, nextY)) {
        this.wanderTimer = Math.floor(60 + Math.random() * 60);
        return;
      }

      // Evita entrar em portas ou warps
      if (map.getWarpAt && map.getWarpAt(nextX, nextY)) {
        this.wanderTimer = Math.floor(60 + Math.random() * 60);
        return;
      }

      // Colisão com jogador
      if (
        (nextX === playerTileX && nextY === playerTileY) ||
        (playerTargetX !== undefined && nextX === playerTargetX && nextY === playerTargetY)
      ) {
        this.wanderTimer = Math.floor(60 + Math.random() * 60);
        return;
      }

      // Colisão com outros NPCs
      let blockedByNpc = false;
      for (const other of otherNpcs) {
        if (other === this || !other.isVisible()) continue;
        if (
          (other.tileX === nextX && other.tileY === nextY) ||
          (other.isMoving && other.targetTileX === nextX && other.targetTileY === nextY)
        ) {
          blockedByNpc = true;
          break;
        }
      }

      if (blockedByNpc) {
        this.wanderTimer = Math.floor(60 + Math.random() * 60);
        return;
      }

      // Inicia o passo
      this.direction = chosenDir;
      this.isMoving = true;
      this.moveProgress = 0;
      this.startTileX = this.tileX;
      this.startTileY = this.tileY;
      this.targetTileX = nextX;
      this.targetTileY = nextY;
    }
  }

  public render(renderer: Renderer, camera: Camera, assetManager: AssetManager): void {
    if (!this.isVisible()) return;
    const sprite = assetManager.getNpc(this.spriteId, this.direction);
    const screenPos = camera.toScreen(this.pixelX, this.pixelY);

    renderer.drawSprite(sprite, screenPos.x, screenPos.y);
  }
}
