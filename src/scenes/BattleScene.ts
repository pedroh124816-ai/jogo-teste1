import { Scene } from '../engine/Scene';
import { Renderer } from '../engine/Renderer';
import { Input } from '../engine/Input';
import { SceneManager } from '../engine/SceneManager';
import { NES_COLORS } from '../engine/Palette';
import { MonsterDef, getSpellDef } from '../data/monsters';
import { gameState } from '../state/GameState';
import { AssetManager, Sprite } from '../assets/AssetManager';
import { BattleEffects } from '../engine/BattleEffects';
import { getItemDef } from '../data/items';
import { BgmTrackId, soundManager } from '../engine/AudioManager';

export type BattleState =
  | 'intro'
  | 'command_select'
  | 'magic_select'
  | 'item_select'
  | 'message_wait'
  | 'victory'
  | 'defeat'
  | 'flee';

export class BattleScene implements Scene {
  public readonly name = 'BattleScene';
  public readonly isTransparent = false;

  private sceneManager: SceneManager;
  private input: Input;
  private monster: MonsterDef;
  private assetManager: AssetManager;
  private onDefeat?: () => void;
  private onVictory?: () => void;

  private monsterHp: number;
  private heroDefBonus = 0;
  private battleEffects = new BattleEffects();

  private state: BattleState = 'intro';
  private commandIndex = 0;
  private magicIndex = 0;
  private itemIndex = 0;

  // Fila de mensagens de texto na caixa superior
  private messageQueue: string[] = [];
  private currentMessage = '';
  private onQueueFinished?: () => void;
  private cursorBlinkTimer = 0;

  private monsterSprite: Sprite | null = null;
  private previousBgm: BgmTrackId | null = null;

  constructor(
    sceneManager: SceneManager,
    input: Input,
    monster: MonsterDef,
    assetManager: AssetManager,
    onDefeat?: () => void,
    onVictory?: () => void
  ) {
    this.sceneManager = sceneManager;
    this.input = input;
    this.monster = monster;
    this.assetManager = assetManager;
    this.onDefeat = onDefeat;
    this.onVictory = onVictory;
    this.monsterHp = monster.maxHp;
  }

  public enter(): void {
    this.battleEffects.reset();
    try {
      this.monsterSprite = this.assetManager.getMonster(this.monster.spriteId);
    } catch {
      this.monsterSprite = null;
    }

    this.previousBgm = soundManager.getCurrentBgm();
    soundManager.playSfx('encounter');
    soundManager.playBgm(this.monster.canFlee ? 'battle' : 'boss');

    const monsterName = this.monster.name;
    this.queueMessages(
      [`Um ${monsterName}\nsurgira no caminho!`],
      () => {
        this.state = 'command_select';
      }
    );
  }

  public exit(): void {
    if (this.state !== 'defeat' && this.previousBgm) {
      soundManager.playBgm(this.previousBgm);
    }
  }

  /**
   * Adiciona mensagens à fila para exibição sequencial com confirmação do jogador.
   */
  private queueMessages(messages: string[], onFinished?: () => void): void {
    this.messageQueue = [...messages];
    this.onQueueFinished = onFinished;
    this.advanceMessage();
  }

  private advanceMessage(): void {
    if (this.messageQueue.length > 0) {
      this.currentMessage = this.messageQueue.shift()!;
      if (this.currentMessage.startsWith('Subiu para o Nível')) {
        soundManager.playSfx('level_up');
      }
      this.state = 'message_wait';
    } else {
      this.currentMessage = '';
      if (this.onQueueFinished) {
        const cb = this.onQueueFinished;
        this.onQueueFinished = undefined;
        cb();
      }
    }
  }

  public update(): void {
    this.cursorBlinkTimer++;
    this.battleEffects.update();

    // Se estiver no meio de animação visual (corte, magia, investida, dissolução), bloqueia inputs
    if (this.battleEffects.isBusy()) {
      return;
    }

    // Se houver mensagem aguardando confirmação
    if (this.state === 'message_wait') {
      if (this.input.wasPressed('confirm') || this.input.wasPressed('cancel')) {
        this.advanceMessage();
      }
      return;
    }

    switch (this.state) {
      case 'command_select':
        this.updateCommandSelect();
        break;
      case 'magic_select':
        this.updateMagicSelect();
        break;
      case 'item_select':
        this.updateItemSelect();
        break;
      case 'victory':
        if (this.input.wasPressed('confirm')) {
          if (this.onVictory) this.onVictory();
          this.sceneManager.pop();
        }
        break;
      case 'defeat':
        if (this.input.wasPressed('confirm')) {
          gameState.respawnAtCastle();
          if (this.onDefeat) this.onDefeat();
          this.sceneManager.pop();
        }
        break;
      case 'flee':
        if (this.input.wasPressed('confirm')) {
          this.sceneManager.pop();
        }
        break;
    }
  }

  private updateCommandSelect(): void {
    if (this.input.wasPressed('up')) {
      this.commandIndex = (this.commandIndex - 1 + 4) % 4;
      soundManager.playSfx('cursor');
    } else if (this.input.wasPressed('down')) {
      this.commandIndex = (this.commandIndex + 1) % 4;
      soundManager.playSfx('cursor');
    }

    if (this.input.wasPressed('confirm')) {
      switch (this.commandIndex) {
        case 0: // ATACAR
          this.executeHeroAttack();
          break;
        case 1: // MAGIA
          if (gameState.spells.length === 0) {
            soundManager.playSfx('error');
            this.queueMessages(['Você não conhece\nnenhuma magia ainda!'], () => {
              this.state = 'command_select';
            });
          } else {
            soundManager.playSfx('confirm');
            this.magicIndex = 0;
            this.state = 'magic_select';
          }
          break;
        case 2: // ITENS
          soundManager.playSfx('confirm');
          this.itemIndex = 0;
          this.state = 'item_select';
          break;
        case 3: // FUGIR
          soundManager.playSfx('confirm');
          this.executeHeroFlee();
          break;
      }
    }
  }

  private updateMagicSelect(): void {
    const spells = gameState.spells;
    if (this.input.wasPressed('cancel')) {
      soundManager.playSfx('cancel');
      this.state = 'command_select';
      return;
    }

    if (this.input.wasPressed('up')) {
      this.magicIndex = (this.magicIndex - 1 + spells.length) % spells.length;
      soundManager.playSfx('cursor');
    } else if (this.input.wasPressed('down')) {
      this.magicIndex = (this.magicIndex + 1) % spells.length;
      soundManager.playSfx('cursor');
    }

    if (this.input.wasPressed('confirm')) {
      const spellId = spells[this.magicIndex];
      const spellDef = getSpellDef(spellId);
      if (!spellDef) return;

      if (gameState.mp < spellDef.mpCost) {
        soundManager.playSfx('error');
        this.queueMessages(['Pontos de Magia (PM)\ninsuficientes!'], () => {
          this.state = 'magic_select';
        });
        return;
      }

      this.executeHeroSpell(spellDef);
    }
  }

  private getUsableCombatItems(): { itemId: string; name: string; quantity: number }[] {
    const list: { itemId: string; name: string; quantity: number }[] = [];
    for (const slot of gameState.inventory) {
      const def = getItemDef(slot.itemId);
      if (def && def.type === 'consumable' && (def.healHp || def.healMp)) {
        list.push({ itemId: def.id, name: def.name, quantity: slot.quantity });
      }
    }
    return list;
  }

  private updateItemSelect(): void {
    const items = this.getUsableCombatItems();
    if (this.input.wasPressed('cancel')) {
      soundManager.playSfx('cancel');
      this.state = 'command_select';
      return;
    }

    if (items.length === 0) {
      soundManager.playSfx('error');
      this.queueMessages(['Nenhum item utilizável\nna mochila!'], () => {
        this.state = 'command_select';
      });
      return;
    }

    if (this.input.wasPressed('up')) {
      this.itemIndex = (this.itemIndex - 1 + items.length) % items.length;
      soundManager.playSfx('cursor');
    } else if (this.input.wasPressed('down')) {
      this.itemIndex = (this.itemIndex + 1) % items.length;
      soundManager.playSfx('cursor');
    }

    if (this.input.wasPressed('confirm')) {
      const selected = items[this.itemIndex];
      const result = gameState.useOrEquipItem(selected.itemId);
      soundManager.playSfx('heal');
      this.queueMessages([result.message], () => {
        this.executeMonsterTurn();
      });
    }
  }

  private executeHeroAttack(): void {
    const heroAtk = gameState.getAtk();
    const monsterDef = this.monster.def;
    const isCrit = Math.random() < 0.0625; // 1 em 16

    let damage: number;
    if (isCrit) {
      damage = Math.max(2, Math.floor(heroAtk * 1.5 - monsterDef * 0.5));
    } else {
      const base = heroAtk - Math.floor(monsterDef / 2);
      const variation = 0.85 + Math.random() * 0.3;
      damage = Math.max(1, Math.floor(base * variation));
    }

    const targetX = 128;
    const targetY = 114;

    soundManager.playSfx(isCrit ? 'crit' : 'attack');

    // Dispara animação visual de corte de espada antes da mensagem
    this.battleEffects.triggerSlash(targetX, targetY, isCrit, () => {
      this.battleEffects.triggerMonsterFlash(16);
      this.battleEffects.addFloatingText(
        `${damage}`,
        targetX,
        targetY - 24,
        isCrit ? NES_COLORS.YELLOW : NES_COLORS.WHITE
      );
      this.monsterHp -= damage;

      const attackMsg = isCrit
        ? `Golpe Crítico!\nCausou ${damage} de dano ao\n${this.monster.name}!`
        : `${gameState.name} ataca!\nCausou ${damage} de dano ao\n${this.monster.name}!`;

      this.queueMessages([attackMsg], () => {
        this.checkBattleOutcome();
      });
    });
  }

  private executeHeroSpell(spell: ReturnType<typeof getSpellDef>): void {
    if (!spell) return;
    gameState.mp -= spell.mpCost;

    const targetX = 128;
    const targetY = 114;
    const heroBoxX = 68;
    const heroBoxY = 188;

    soundManager.playSfx(spell.type === 'heal' ? 'heal' : 'magic');

    if (spell.type === 'heal') {
      const heal = Math.floor(spell.powerMin + Math.random() * (spell.powerMax - spell.powerMin + 1));
      this.battleEffects.triggerSpell(spell.id, heroBoxX, heroBoxY, () => {
        const before = gameState.hp;
        gameState.hp = Math.min(gameState.maxHp, gameState.hp + heal);
        const actualHeal = gameState.hp - before;
        this.battleEffects.addFloatingText(`+${actualHeal}`, 50, 180, NES_COLORS.PALE_GREEN);

        this.queueMessages(
          [`Lançou ${spell.name}!\nRecuperou ${actualHeal} PV!`],
          () => {
            this.executeMonsterTurn();
          }
        );
      });
    } else if (spell.type === 'buff') {
      this.battleEffects.triggerSpell(spell.id, heroBoxX, heroBoxY, () => {
        this.heroDefBonus += spell.powerMin;
        this.battleEffects.addFloatingText(`DEF+${spell.powerMin}`, 50, 180, NES_COLORS.CYAN);

        this.queueMessages(
          [`Lançou ${spell.name}!\nA defesa de ${gameState.name}\naumentou em +${spell.powerMin}!`],
          () => {
            this.executeMonsterTurn();
          }
        );
      });
    } else if (spell.type === 'damage') {
      const dmg = Math.floor(spell.powerMin + Math.random() * (spell.powerMax - spell.powerMin + 1));
      this.battleEffects.triggerSpell(spell.id, targetX, targetY, () => {
        this.battleEffects.triggerMonsterFlash(20);
        this.battleEffects.addFloatingText(`${dmg}`, targetX, targetY - 24, NES_COLORS.GOLD);
        this.monsterHp -= dmg;

        this.queueMessages(
          [`Lançou ${spell.name}!\nCausou ${dmg} de dano mágico\nao ${this.monster.name}!`],
          () => {
            this.checkBattleOutcome();
          }
        );
      });
    }
  }

  private executeHeroFlee(): void {
    if (!this.monster.canFlee) {
      soundManager.playSfx('error');
      this.queueMessages(['Não é possível fugir\ndeste confronto!'], () => {
        this.executeMonsterTurn();
      });
      return;
    }

    const heroAgi = gameState.agi;
    const monsterAgi = this.monster.agi;
    const fleeChance = Math.min(0.9, Math.max(0.25, (heroAgi / (heroAgi + monsterAgi)) * 1.15));

    if (Math.random() < fleeChance) {
      soundManager.playSfx('stairs');
      this.queueMessages([`${gameState.name} escapou\ncom sucesso do combate!`], () => {
        this.state = 'flee';
      });
    } else {
      soundManager.playSfx('error');
      this.queueMessages(['Tentou fugir, mas o\ninimigo bloqueou o caminho!'], () => {
        this.executeMonsterTurn();
      });
    }
  }

  private checkBattleOutcome(): void {
    if (this.monsterHp <= 0) {
      // Dispara dissolução em scanlines estilo Final Fantasy / Dragon Quest
      this.battleEffects.triggerMonsterDefeat(() => {
        this.executeVictory();
      });
    } else {
      this.executeMonsterTurn();
    }
  }

  private executeVictory(): void {
    soundManager.stopBgm();
    soundManager.playSfx('victory');

    const expGained = this.monster.exp;
    const goldGained = this.monster.gold;
    gameState.addGold(goldGained);
    const levelResult = gameState.addExp(expGained);

    const msgs: string[] = [
      `Derrotou ${this.monster.name}!`,
      `Ganhou ${expGained} pontos de EXP\ne ${goldGained} moedas de ouro!`,
    ];

    if (levelResult.leveledUp) {
      msgs.push(
        `Subiu para o Nível ${levelResult.newLevel}!\nPV+${levelResult.hpGain} PM+${levelResult.mpGain}\nATQ+${levelResult.atkGain} DEF+${levelResult.defGain} AGI+${levelResult.agiGain}`
      );
      for (const sp of levelResult.learnedSpells) {
        const spDef = getSpellDef(sp);
        if (spDef) {
          msgs.push(`Aprendeu a magia:\n${spDef.name}!`);
        }
      }
    }

    // Checagem de drop de item
    if (this.monster.dropItemId && this.monster.dropChance) {
      if (Math.random() <= this.monster.dropChance) {
        const itemDef = getItemDef(this.monster.dropItemId);
        if (itemDef) {
          gameState.addItem(itemDef.id, 1);
          msgs.push(`O monstro deixou cair:\n${itemDef.name}!`);
        }
      }
    }

    // Flags especiais de chefes
    if (this.monster.id === 'ulan_fera') {
      gameState.setFlag('fera_derrotada', true);
      gameState.setFlag('pulseira_ulan_vista', true);
    }

    this.queueMessages(msgs, () => {
      this.state = 'victory';
    });
  }

  private executeMonsterTurn(): void {
    if (this.monsterHp <= 0) {
      this.checkBattleOutcome();
      return;
    }

    const heroDef = gameState.getDef() + this.heroDefBonus;
    const base = this.monster.atk - Math.floor(heroDef / 2);
    const variation = 0.85 + Math.random() * 0.3;
    const damage = Math.max(1, Math.floor(base * variation));

    // Monstro arranca para a frente com investida (lunge) e corte de garras
    this.battleEffects.triggerMonsterAttack(
      () => {
        // Momento do impacto físico:
        soundManager.playSfx('hit');
        this.battleEffects.triggerScreenShake(5, 18);
        this.battleEffects.addFloatingText(`-${damage}`, 50, 175, NES_COLORS.RED);
        gameState.hp = Math.max(0, gameState.hp - damage);
      },
      () => {
        // Ao concluir a investida:
        const msg = `${this.monster.name} ataca!\n${gameState.name} sofreu ${damage}\npontos de dano!`;

        this.queueMessages([msg], () => {
          if (gameState.hp <= 0) {
            this.executeDefeat();
          } else {
            this.state = 'command_select';
          }
        });
      }
    );
  }

  private executeDefeat(): void {
    soundManager.playSfx('defeat');
    this.queueMessages(
      [
        `${gameState.name} tombou em combate...`,
        'Suas forças se esvaíram e\nmetade do ouro foi perdida.',
      ],
      () => {
        this.state = 'defeat';
      }
    );
  }

  public render(renderer: Renderer): void {
    const offset = this.battleEffects.getScreenOffset();

    // Fundo preto clássico NES
    renderer.clear(NES_COLORS.BLACK);

    // 1. Caixa de Mensagem Superior (240x48 px, suporta até 3 linhas de 28 caracteres)
    renderer.drawWindow(8 + offset.x, 8 + offset.y, 240, 48, NES_COLORS.BLACK);
    if (this.currentMessage) {
      const lines = this.currentMessage.split('\n');
      for (let i = 0; i < lines.length && i < 3; i++) {
        renderer.drawText(lines[i], 16 + offset.x, 16 + offset.y + i * 11, {
          color: NES_COLORS.WHITE,
        });
      }
      // Indicador piscante de avanço
      if (Math.floor(this.cursorBlinkTimer / 20) % 2 === 0) {
        renderer.drawText('▼', 236 + offset.x, 38 + offset.y, { color: NES_COLORS.GOLD });
      }
    }

    // 2. Arena Central com Moldura (160x96 px)
    renderer.drawWindow(48 + offset.x, 60 + offset.y, 160, 96, NES_COLORS.BLACK);

    // Nome do Monstro no topo da arena
    const nameWidth = renderer.measureText(this.monster.name);
    const nameX = 48 + Math.floor((160 - nameWidth) / 2) + offset.x;
    renderer.drawText(this.monster.name, nameX, 66 + offset.y, { color: NES_COLORS.GOLD });

    // Renderiza Sprite do Monstro com idle orgânico, investida e dissolução na derrota
    if ((this.monsterHp > 0 || this.battleEffects.isDefeatActive()) && this.monsterSprite) {
      const spr = this.monsterSprite;
      const sprX = 48 + Math.floor((160 - spr.width) / 2) + offset.x;
      const sprY = 78 + Math.floor((72 - spr.height) / 2) + offset.y;
      this.battleEffects.renderMonster(renderer, spr, sprX, sprY, this.monster.spriteId);
    }

    // Renderiza todos os efeitos visuais (cortes de espada, crítico, magias, partículas e textos)
    this.battleEffects.render(renderer);

    // 3. Status do Herói no canto inferior esquerdo (120x56 px)
    renderer.drawWindow(8, 160, 120, 56, NES_COLORS.BLACK);
    renderer.drawText(`${gameState.name} Nv ${gameState.level}`, 16, 168, {
      color: NES_COLORS.WHITE,
    });
    renderer.drawText(`PV: ${gameState.hp}/${gameState.maxHp}`, 16, 179, {
      color: gameState.hp < Math.floor(gameState.maxHp * 0.3) ? NES_COLORS.RED : NES_COLORS.LIGHT_BLUE,
    });
    renderer.drawText(`PM: ${gameState.mp}/${gameState.maxMp}`, 16, 190, {
      color: NES_COLORS.CYAN,
    });
    renderer.drawText(`G: ${gameState.gold}`, 16, 201, {
      color: NES_COLORS.GOLD,
    });

    // 4. Menu de Comandos ou Submenus no canto inferior direito
    if (this.state === 'magic_select') {
      this.renderMagicMenu(renderer);
    } else if (this.state === 'item_select') {
      this.renderItemMenu(renderer);
    } else {
      this.renderCommandsMenu(renderer);
    }
  }

  private renderCommandsMenu(renderer: Renderer): void {
    renderer.drawWindow(134, 160, 114, 56, NES_COLORS.BLACK);
    const commands = ['ATACAR', 'MAGIA', 'ITENS', 'FUGIR'];

    for (let i = 0; i < commands.length; i++) {
      const y = 167 + i * 11;
      if (i === this.commandIndex && this.state === 'command_select') {
        renderer.drawText('►', 140, y, { color: NES_COLORS.GOLD });
      }
      renderer.drawText(commands[i], 150, y, {
        color: i === this.commandIndex && this.state === 'command_select' ? NES_COLORS.WHITE : NES_COLORS.MED_GRAY,
      });
    }
  }

  private renderMagicMenu(renderer: Renderer): void {
    const spells = gameState.spells;
    const h = Math.min(100, Math.max(56, 24 + spells.length * 12));
    const yTop = 216 - h;
    renderer.drawWindow(100, yTop, 148, h, NES_COLORS.BLACK);

    renderer.drawText('MAGIAS', 108, yTop + 6, { color: NES_COLORS.GOLD });

    for (let i = 0; i < spells.length; i++) {
      const spellId = spells[i];
      const def = getSpellDef(spellId);
      if (!def) continue;

      const y = yTop + 20 + i * 12;
      const canCast = gameState.mp >= def.mpCost;

      if (i === this.magicIndex) {
        renderer.drawText('►', 104, y, { color: NES_COLORS.GOLD });
      }
      renderer.drawText(`${def.name} (${def.mpCost})`, 114, y, {
        color: canCast ? NES_COLORS.WHITE : NES_COLORS.DARK_GRAY,
      });
    }
  }

  private renderItemMenu(renderer: Renderer): void {
    const items = this.getUsableCombatItems();
    const h = Math.min(100, Math.max(56, 24 + items.length * 12));
    const yTop = 216 - h;
    renderer.drawWindow(100, yTop, 148, h, NES_COLORS.BLACK);

    renderer.drawText('ITENS', 108, yTop + 6, { color: NES_COLORS.GOLD });

    if (items.length === 0) {
      renderer.drawText('Sem itens', 114, yTop + 20, { color: NES_COLORS.MED_GRAY });
      return;
    }

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const y = yTop + 20 + i * 12;

      if (i === this.itemIndex) {
        renderer.drawText('►', 104, y, { color: NES_COLORS.GOLD });
      }
      renderer.drawText(`${item.name} x${item.quantity}`, 114, y, {
        color: NES_COLORS.WHITE,
      });
    }
  }
}
