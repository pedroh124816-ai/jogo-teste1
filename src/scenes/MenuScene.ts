import { Scene } from '../engine/Scene';
import { Renderer } from '../engine/Renderer';
import { Input } from '../engine/Input';
import { SceneManager } from '../engine/SceneManager';
import { NES_COLORS } from '../engine/Palette';
import { CONFIG } from '../config';
import { gameState } from '../state/GameState';
import { getItemDef } from '../data/items';
import { soundManager } from '../engine/AudioManager';

type MenuMode = 'commands' | 'status' | 'items' | 'message';

export class MenuScene implements Scene {
  public readonly name = 'MenuScene';
  public readonly isTransparent = true;

  private sceneManager: SceneManager;
  private input: Input;

  private mode: MenuMode = 'commands';
  private selectedIndex = 0;
  private itemCursor = 0;
  private itemScroll = 0;
  private readonly maxVisibleItems = 5;

  private commands = ['FALAR', 'STATUS', 'ITENS', 'MAPA', 'MAGIA', 'SALVAR'];

  private messageDialogText: string | null = null;
  private returnModeAfterMessage: MenuMode = 'commands';
  private onTalkCallback?: () => boolean;
  private onOpenMapCallback?: () => void;
  private cursorTimer = 0;

  constructor(
    sceneManager: SceneManager,
    input: Input,
    onTalk?: () => boolean,
    onOpenMap?: () => void
  ) {
    this.sceneManager = sceneManager;
    this.input = input;
    this.onTalkCallback = onTalk;
    this.onOpenMapCallback = onOpenMap;
  }

  public enter(): void {
    this.mode = 'commands';
    this.selectedIndex = 0;
    this.itemCursor = 0;
    this.itemScroll = 0;
    this.messageDialogText = null;
    this.cursorTimer = 0;
    soundManager.playSfx('confirm');
  }

  public update(): void {
    this.cursorTimer++;

    // 1. Caixa de mensagem ativa
    if (this.mode === 'message') {
      if (this.input.wasPressed('confirm') || this.input.wasPressed('cancel')) {
        soundManager.playSfx('confirm');
        this.messageDialogText = null;
        this.mode = this.returnModeAfterMessage;
      }
      return;
    }

    // 2. Janela de STATUS aberta
    if (this.mode === 'status') {
      if (this.input.wasPressed('confirm') || this.input.wasPressed('cancel')) {
        soundManager.playSfx('cancel');
        this.mode = 'commands';
      }
      return;
    }

    // 3. Sub-menu interativo de ITENS
    if (this.mode === 'items') {
      const inv = gameState.inventory;

      if (this.input.wasPressed('cancel')) {
        soundManager.playSfx('cancel');
        this.mode = 'commands';
        return;
      }

      if (inv.length === 0) {
        if (this.input.wasPressed('confirm')) {
          soundManager.playSfx('cancel');
          this.mode = 'commands';
        }
        return;
      }

      if (this.input.wasPressed('up')) {
        this.itemCursor = (this.itemCursor - 1 + inv.length) % inv.length;
        this.adjustItemScroll(inv.length);
        soundManager.playSfx('cursor');
      } else if (this.input.wasPressed('down')) {
        this.itemCursor = (this.itemCursor + 1) % inv.length;
        this.adjustItemScroll(inv.length);
        soundManager.playSfx('cursor');
      } else if (this.input.wasPressed('confirm')) {
        const slot = inv[this.itemCursor];
        if (slot) {
          const result = gameState.useOrEquipItem(slot.itemId);
          soundManager.playSfx(result.success ? 'heal' : 'error');
          // Ajusta cursor caso o último item tenha sido consumido
          if (this.itemCursor >= gameState.inventory.length) {
            this.itemCursor = Math.max(0, gameState.inventory.length - 1);
          }
          this.adjustItemScroll(gameState.inventory.length);
          this.showMessage(result.message, 'items');
        }
      }
      return;
    }

    // 4. Navegação na janela principal de COMANDOS
    if (this.input.wasPressed('up')) {
      this.selectedIndex = (this.selectedIndex - 1 + this.commands.length) % this.commands.length;
      soundManager.playSfx('cursor');
    } else if (this.input.wasPressed('down')) {
      this.selectedIndex = (this.selectedIndex + 1) % this.commands.length;
      soundManager.playSfx('cursor');
    }

    if (this.input.wasPressed('confirm')) {
      const cmd = this.commands[this.selectedIndex];

      if (cmd === 'FALAR') {
        if (this.onTalkCallback) {
          const spoke = this.onTalkCallback();
          if (spoke) {
            this.sceneManager.pop();
            return;
          }
        }
        soundManager.playSfx('error');
        this.showMessage('Não há ninguém à frente\npara conversar.', 'commands');
        return;
      }

      if (cmd === 'STATUS') {
        soundManager.playSfx('confirm');
        this.mode = 'status';
        return;
      }

      if (cmd === 'ITENS') {
        soundManager.playSfx('confirm');
        this.itemCursor = 0;
        this.itemScroll = 0;
        this.mode = 'items';
        return;
      }

      if (cmd === 'MAPA') {
        if (this.onOpenMapCallback) {
          this.sceneManager.pop();
          this.onOpenMapCallback();
          return;
        }
      }

      if (cmd === 'MAGIA') {
        if (gameState.spells.length === 0) {
          soundManager.playSfx('error');
          this.showMessage('Você ainda não despertou\nmagias do Lume.', 'commands');
          return;
        }

        if (gameState.hasSpell('cura') || gameState.hasSpell('cura_maior')) {
          const isMajor = gameState.hasSpell('cura_maior') && gameState.mp >= 7;
          const cost = isMajor ? 7 : 3;
          const healMin = isMajor ? 60 : 25;
          const healMax = isMajor ? 80 : 35;
          const spellName = isMajor ? 'Cura Maior' : 'Cura';

          if (gameState.hp >= gameState.maxHp) {
            soundManager.playSfx('error');
            this.showMessage('Seus PV já estão no\nmáximo.', 'commands');
            return;
          }

          if (gameState.mp < cost) {
            soundManager.playSfx('error');
            this.showMessage('Pontos de Magia (PM)\ninsuficientes!', 'commands');
            return;
          }

          soundManager.playSfx('heal');
          gameState.mp -= cost;
          const heal = healMin + Math.floor(Math.random() * (healMax - healMin + 1));
          const before = gameState.hp;
          gameState.hp = Math.min(gameState.maxHp, gameState.hp + heal);
          const recovered = gameState.hp - before;
          this.showMessage(`Lançou ${spellName}!\nRecuperou ${recovered} PV\n(${gameState.hp}/${gameState.maxHp}).`, 'commands');
          return;
        }

        soundManager.playSfx('error');
        this.showMessage('Suas magias ativas só\npodem ser usadas em luta.', 'commands');
        return;
      }

      if (cmd === 'SALVAR') {
        soundManager.playSfx('coins');
        gameState.saveGame();
        this.showMessage(
          `Jogo salvo com sucesso!\nHerói: ${gameState.name} (Nv.${gameState.level})\nProgresso registrado.`,
          'commands'
        );
        return;
      }
    }

    if (this.input.wasPressed('cancel')) {
      soundManager.playSfx('cancel');
      this.sceneManager.pop();
    }
  }

  private adjustItemScroll(total: number): void {
    if (total <= this.maxVisibleItems) {
      this.itemScroll = 0;
      return;
    }
    if (this.itemCursor < this.itemScroll) {
      this.itemScroll = this.itemCursor;
    } else if (this.itemCursor >= this.itemScroll + this.maxVisibleItems) {
      this.itemScroll = this.itemCursor - this.maxVisibleItems + 1;
    }
  }

  private showMessage(text: string, returnMode: MenuMode): void {
    this.messageDialogText = text;
    this.returnModeAfterMessage = returnMode;
    this.mode = 'message';
  }

  public render(renderer: Renderer): void {
    // 1. Janela de Comandos (canto superior esquerdo)
    const winX = 8;
    const winY = 8;
    const winW = 88;
    const winH = 114;

    renderer.drawWindow(winX, winY, winW, winH, NES_COLORS.BLACK);
    renderer.drawText('COMANDOS', winX + 12, winY + 8, { color: NES_COLORS.PALE_GREEN });
    renderer.fillRect(winX + 8, winY + 18, winW - 16, 1, NES_COLORS.WHITE);

    for (let i = 0; i < this.commands.length; i++) {
      const itemY = winY + 24 + i * 14;
      const isSelected = i === this.selectedIndex;

      if (isSelected && (this.mode === 'commands' || this.cursorTimer % CONFIG.ui.cursorBlinkFrames < CONFIG.ui.cursorBlinkFrames / 2)) {
        renderer.drawText('►', winX + 10, itemY, {
          color: this.mode === 'commands' ? NES_COLORS.WHITE : NES_COLORS.MED_GRAY,
        });
      }

      const color = isSelected ? NES_COLORS.WHITE : NES_COLORS.LIGHT_GRAY;
      renderer.drawText(this.commands[i], winX + 22, itemY, { color });
    }

    // 2. HUD Rápido do Herói (canto superior direito)
    const hudX = 140;
    const hudY = 8;
    const hudW = 108;
    const hudH = 74;
    renderer.drawWindow(hudX, hudY, hudW, hudH, NES_COLORS.BLACK);
    renderer.drawText(gameState.name, hudX + 10, hudY + 8, { color: NES_COLORS.GOLD });
    renderer.fillRect(hudX + 8, hudY + 18, hudW - 16, 1, NES_COLORS.WHITE);
    renderer.drawText(`NÍVEL: ${gameState.level}`, hudX + 10, hudY + 24, { color: NES_COLORS.WHITE });
    renderer.drawText(`PV: ${gameState.hp}/${gameState.maxHp}`, hudX + 10, hudY + 36, { color: NES_COLORS.WHITE });
    renderer.drawText(`PM: ${gameState.mp}/${gameState.maxMp}`, hudX + 10, hudY + 48, { color: NES_COLORS.WHITE });
    renderer.drawText(`OURO: ${gameState.gold}`, hudX + 10, hudY + 60, { color: NES_COLORS.GOLD });

    // 3. Janela de STATUS detalhada
    if (this.mode === 'status') {
      this.renderStatusWindow(renderer);
    }

    // 4. Janela interativa de ITENS
    if (this.mode === 'items' || (this.mode === 'message' && this.returnModeAfterMessage === 'items')) {
      this.renderItemsWindow(renderer);
    }

    // 5. Caixa de mensagem inferior (quando ativa)
    if (this.mode === 'message' && this.messageDialogText !== null) {
      const msgX = 8;
      const msgY = 152;
      const msgW = 240;
      const msgH = 64;

      renderer.drawWindow(msgX, msgY, msgW, msgH, NES_COLORS.BLACK);
      renderer.drawText(this.messageDialogText, msgX + 10, msgY + 10, {
        color: NES_COLORS.WHITE,
        lineHeight: 12,
      });

      const blink = Math.floor(this.cursorTimer / CONFIG.ui.cursorBlinkFrames) % 2 === 0;
      if (blink) {
        renderer.drawText('▼', msgX + msgW - 18, msgY + msgH - 14, { color: NES_COLORS.GOLD });
      }
    }
  }

  private renderStatusWindow(renderer: Renderer): void {
    const sx = 8;
    const sy = 90;
    const sw = 240;
    const sh = 126;

    renderer.drawWindow(sx, sy, sw, sh, NES_COLORS.BLACK);
    renderer.drawText('ATRIBUTOS E EQUIPAMENTO', sx + 12, sy + 8, { color: NES_COLORS.GOLD });
    renderer.fillRect(sx + 8, sy + 18, sw - 16, 1, NES_COLORS.WHITE);

    renderer.drawText(`ATQ TOTAL: ${gameState.getAtk()}`, sx + 12, sy + 24, { color: NES_COLORS.WHITE });
    renderer.drawText(`DEF TOTAL: ${gameState.getDef()}`, sx + 128, sy + 24, { color: NES_COLORS.WHITE });
    renderer.drawText(`AGILIDADE: ${gameState.agi}`, sx + 12, sy + 36, { color: NES_COLORS.LIGHT_GRAY });
    renderer.drawText(`EXP: ${gameState.exp}`, sx + 128, sy + 36, { color: NES_COLORS.LIGHT_GRAY });

    renderer.fillRect(sx + 8, sy + 48, sw - 16, 1, NES_COLORS.DARK_GRAY);

    const weaponName = getItemDef(gameState.equipment.weapon || '')?.name || 'Nenhuma';
    const armorName = getItemDef(gameState.equipment.armor || '')?.name || 'Nenhuma';
    const shieldName = getItemDef(gameState.equipment.shield || '')?.name || 'Nenhum';
    const accName = getItemDef(gameState.equipment.accessory || '')?.name || 'Nenhum';

    renderer.drawText(`ARMA:   ${weaponName}`, sx + 12, sy + 54, { color: NES_COLORS.PALE_GREEN });
    renderer.drawText(`ARMAD.: ${armorName}`, sx + 12, sy + 68, { color: NES_COLORS.PALE_GREEN });
    renderer.drawText(`ESCUDO: ${shieldName}`, sx + 12, sy + 82, { color: NES_COLORS.PALE_GREEN });
    renderer.drawText(`ACESS.: ${accName}`, sx + 12, sy + 96, { color: NES_COLORS.GOLD });
  }

  private renderItemsWindow(renderer: Renderer): void {
    const ix = 8;
    const iy = 86;
    const iw = 240;
    const ih = 130;

    renderer.drawWindow(ix, iy, iw, ih, NES_COLORS.BLACK);
    renderer.drawText('MOCHILA (ENTER: USAR/EQUIPAR)', ix + 10, iy + 8, { color: NES_COLORS.PALE_GREEN });
    renderer.fillRect(ix + 8, iy + 18, iw - 16, 1, NES_COLORS.WHITE);

    const inv = gameState.inventory;
    if (inv.length === 0) {
      renderer.drawText('Sua mochila está vazia.', ix + 14, iy + 32, { color: NES_COLORS.LIGHT_GRAY });
      return;
    }

    const visible = inv.slice(this.itemScroll, this.itemScroll + this.maxVisibleItems);
    for (let i = 0; i < visible.length; i++) {
      const realIdx = this.itemScroll + i;
      const slot = visible[i];
      const def = getItemDef(slot.itemId);
      const rowY = iy + 24 + i * 12;
      const isSelected = realIdx === this.itemCursor;

      if (isSelected && this.mode === 'items') {
        const blink = Math.floor(this.cursorTimer / CONFIG.ui.cursorBlinkFrames) % 2 === 0;
        if (blink) {
          renderer.drawText('►', ix + 8, rowY, { color: NES_COLORS.WHITE });
        }
      }

      const equipped = gameState.isEquipped(slot.itemId);
      const badge = equipped ? 'E ' : '  ';
      const itemName = def ? def.name : slot.itemId;
      const color = isSelected ? NES_COLORS.WHITE : equipped ? NES_COLORS.GOLD : NES_COLORS.LIGHT_GRAY;

      renderer.drawText(`${badge}${itemName}`, ix + 18, rowY, { color });
      if (slot.quantity > 1 || def?.type === 'consumable') {
        renderer.drawText(`x${slot.quantity}`, ix + iw - 36, rowY, { color });
      }
    }

    // Descrição do item selecionado no rodapé da janela
    renderer.fillRect(ix + 8, iy + 88, iw - 16, 1, NES_COLORS.DARK_GRAY);
    const currentSlot = inv[this.itemCursor];
    const currentDef = currentSlot ? getItemDef(currentSlot.itemId) : null;
    if (currentDef) {
      renderer.drawText(currentDef.description, ix + 10, iy + 94, {
        color: NES_COLORS.LIGHT_BLUE,
        lineHeight: 12,
      });
    }
  }
}
