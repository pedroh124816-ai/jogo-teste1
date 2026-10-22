import { Direction } from '../assets/heroGraphics';
import { NpcSpriteId } from '../assets/npcGraphics';
import { Renderer } from '../engine/Renderer';
import { Camera } from '../engine/Camera';
import { AssetManager } from '../assets/AssetManager';
import { CONFIG } from '../config';
import { gameState } from '../state/GameState';

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
}

export class NPC {
  public readonly id: string;
  public readonly name: string;
  public readonly spriteId: NpcSpriteId;

  public tileX: number;
  public tileY: number;
  public pixelX: number;
  public pixelY: number;

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
  }

  public render(renderer: Renderer, camera: Camera, assetManager: AssetManager): void {
    if (!this.isVisible()) return;
    const sprite = assetManager.getNpc(this.spriteId, this.direction);
    const screenPos = camera.toScreen(this.pixelX, this.pixelY);

    renderer.drawSprite(sprite, screenPos.x, screenPos.y);
  }
}
