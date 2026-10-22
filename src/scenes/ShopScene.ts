import { Scene } from '../engine/Scene';
import { Renderer } from '../engine/Renderer';
import { Input } from '../engine/Input';
import { SceneManager } from '../engine/SceneManager';
import { NES_COLORS } from '../engine/Palette';
import { CONFIG } from '../config';
import { gameState } from '../state/GameState';
import { getItemDef, ItemDef, SHOP_CATALOGS } from '../data/items';
import { soundManager } from '../engine/AudioManager';

type ShopMode = 'root' | 'buy' | 'sell' | 'message';

export class ShopScene implements Scene {
  public readonly name = 'ShopScene';
  public readonly isTransparent = true;

  private sceneManager: SceneManager;
  private input: Input;
  private shopCatalog: ItemDef[];

  private mode: ShopMode = 'root';
  private rootIndex = 0;
  private listIndex = 0;
  private listScroll = 0;
  private readonly maxVisible = 5;

  private messageText = '';
  private returnMode: ShopMode = 'root';
  private cursorTimer = 0;

  constructor(sceneManager: SceneManager, input: Input, mapId = 'cidade_1_loja') {
    this.sceneManager = sceneManager;
    this.input = input;
    const ids = SHOP_CATALOGS[mapId] || SHOP_CATALOGS['cidade_1_loja'];
    this.shopCatalog = ids.map((id) => getItemDef(id)!).filter(Boolean);
  }

  public enter(): void {
    this.mode = 'root';
    this.rootIndex = 0;
    this.listIndex = 0;
    this.listScroll = 0;
    this.cursorTimer = 0;
  }

  public update(): void {
    this.cursorTimer++;

    if (this.mode === 'message') {
      if (this.input.wasPressed('confirm') || this.input.wasPressed('cancel')) {
        soundManager.playSfx('confirm');
        this.mode = this.returnMode;
      }
      return;
    }

    if (this.mode === 'root') {
      if (this.input.wasPressed('up')) {
        this.rootIndex = (this.rootIndex + 2) % 3;
        soundManager.playSfx('cursor');
      } else if (this.input.wasPressed('down')) {
        this.rootIndex = (this.rootIndex + 1) % 3;
        soundManager.playSfx('cursor');
      } else if (this.input.wasPressed('cancel')) {
        soundManager.playSfx('cancel');
        this.sceneManager.pop();
      } else if (this.input.wasPressed('confirm')) {
        if (this.rootIndex === 0) {
          soundManager.playSfx('confirm');
          this.listIndex = 0;
          this.listScroll = 0;
          this.mode = 'buy';
        } else if (this.rootIndex === 1) {
          soundManager.playSfx('confirm');
          this.listIndex = 0;
          this.listScroll = 0;
          this.mode = 'sell';
        } else {
          soundManager.playSfx('cancel');
          this.sceneManager.pop();
        }
      }
      return;
    }

    if (this.mode === 'buy') {
      if (this.input.wasPressed('cancel')) {
        soundManager.playSfx('cancel');
        this.mode = 'root';
        return;
      }

      const total = this.shopCatalog.length;
      if (this.input.wasPressed('up')) {
        this.listIndex = (this.listIndex - 1 + total) % total;
        this.adjustScroll(total);
        soundManager.playSfx('cursor');
      } else if (this.input.wasPressed('down')) {
        this.listIndex = (this.listIndex + 1) % total;
        this.adjustScroll(total);
        soundManager.playSfx('cursor');
      } else if (this.input.wasPressed('confirm')) {
        const item = this.shopCatalog[this.listIndex];
        if (!item) return;

        if (!gameState.spendGold(item.price)) {
          soundManager.playSfx('error');
          this.showMessage('Você não tem moedas de\nouro suficientes!', 'buy');
          return;
        }

        soundManager.playSfx('coins');
        gameState.addItem(item.id, 1);
        this.showMessage(`Comprou ${item.name}\npor ${item.price} moedas de ouro!`, 'buy');
      }
      return;
    }

    if (this.mode === 'sell') {
      if (this.input.wasPressed('cancel')) {
        soundManager.playSfx('cancel');
        this.mode = 'root';
        return;
      }

      const sellable = this.getSellableSlots();
      if (sellable.length === 0) {
        if (this.input.wasPressed('confirm')) {
          soundManager.playSfx('cancel');
          this.mode = 'root';
        }
        return;
      }

      const total = sellable.length;
      if (this.input.wasPressed('up')) {
        this.listIndex = (this.listIndex - 1 + total) % total;
        this.adjustScroll(total);
        soundManager.playSfx('cursor');
      } else if (this.input.wasPressed('down')) {
        this.listIndex = (this.listIndex + 1) % total;
        this.adjustScroll(total);
        soundManager.playSfx('cursor');
      } else if (this.input.wasPressed('confirm')) {
        const entry = sellable[this.listIndex];
        if (!entry) return;

        if (entry.def.unsellable) {
          soundManager.playSfx('error');
          this.showMessage(`${entry.def.name} é um item\nespecial e não pode\nser vendido.`, 'sell');
          return;
        }

        if (gameState.isEquipped(entry.def.id) && entry.quantity <= 1) {
          soundManager.playSfx('error');
          this.showMessage('Você precisa desequipar o\nitem antes de vendê-lo.', 'sell');
          return;
        }

        soundManager.playSfx('coins');
        const sellPrice = Math.max(1, Math.floor(entry.def.price / 2));
        gameState.removeItem(entry.def.id, 1);
        gameState.addGold(sellPrice);

        const remaining = this.getSellableSlots().length;
        if (this.listIndex >= remaining) {
          this.listIndex = Math.max(0, remaining - 1);
        }
        this.adjustScroll(remaining);

        this.showMessage(`Vendeu ${entry.def.name}\npor ${sellPrice} moedas de ouro!`, 'sell');
      }
    }
  }

  private getSellableSlots(): Array<{ def: ItemDef; quantity: number }> {
    return gameState.inventory
      .map((s) => ({ def: getItemDef(s.itemId)!, quantity: s.quantity }))
      .filter((x) => Boolean(x.def) && !x.def.unsellable);
  }

  private adjustScroll(total: number): void {
    if (total <= this.maxVisible) {
      this.listScroll = 0;
      return;
    }
    if (this.listIndex < this.listScroll) {
      this.listScroll = this.listIndex;
    } else if (this.listIndex >= this.listScroll + this.maxVisible) {
      this.listScroll = this.listIndex - this.maxVisible + 1;
    }
  }

  private showMessage(text: string, returnMode: ShopMode): void {
    this.messageText = text;
    this.returnMode = returnMode;
    this.mode = 'message';
  }

  public render(renderer: Renderer): void {
    // 1. Janela de comando da loja (canto superior esquerdo)
    renderer.drawWindow(8, 8, 108, 66, NES_COLORS.BLACK);
    renderer.drawText('MERCADOR', 18, 16, { color: NES_COLORS.GOLD });
    renderer.fillRect(16, 26, 92, 1, NES_COLORS.WHITE);

    const options = ['COMPRAR', 'VENDER', 'SAIR'];
    for (let i = 0; i < options.length; i++) {
      const y = 32 + i * 12;
      const isSelected = i === this.rootIndex;
      if (isSelected && this.mode === 'root') {
        renderer.drawText('►', 16, y, { color: NES_COLORS.WHITE });
      }
      renderer.drawText(options[i], 28, y, {
        color: isSelected ? NES_COLORS.WHITE : NES_COLORS.LIGHT_GRAY,
      });
    }

    // 2. Janela de Ouro (canto superior direito)
    renderer.drawWindow(144, 8, 104, 42, NES_COLORS.BLACK);
    renderer.drawText('SEU OURO', 156, 16, { color: NES_COLORS.PALE_GREEN });
    renderer.drawText(`${gameState.gold} O`, 156, 30, { color: NES_COLORS.GOLD });

    // 3. Lista de Compra ou Venda
    if (this.mode === 'buy' || (this.mode === 'message' && this.returnMode === 'buy')) {
      this.renderBuyWindow(renderer);
    } else if (this.mode === 'sell' || (this.mode === 'message' && this.returnMode === 'sell')) {
      this.renderSellWindow(renderer);
    } else if (this.mode === 'root') {
      renderer.drawWindow(8, 144, 240, 72, NES_COLORS.BLACK);
      renderer.drawText(
        'Bem-vindo à Loja de Alvorada!\nArmas, armaduras e ervas\npara sua jornada.',
        18,
        156,
        { color: NES_COLORS.WHITE, lineHeight: 14 }
      );
    }

    // 4. Mensagem de confirmação / erro
    if (this.mode === 'message') {
      renderer.drawWindow(8, 152, 240, 64, NES_COLORS.BLACK);
      renderer.drawText(this.messageText, 18, 164, {
        color: NES_COLORS.WHITE,
        lineHeight: 14,
      });
      const blink = Math.floor(this.cursorTimer / CONFIG.ui.cursorBlinkFrames) % 2 === 0;
      if (blink) {
        renderer.drawText('▼', 230, 200, { color: NES_COLORS.GOLD });
      }
    }
  }

  private renderBuyWindow(renderer: Renderer): void {
    const wx = 8;
    const wy = 78;
    const ww = 240;
    const wh = 138;

    renderer.drawWindow(wx, wy, ww, wh, NES_COLORS.BLACK);
    renderer.drawText('MERCADORIAS', wx + 12, wy + 8, { color: NES_COLORS.GOLD });
    renderer.drawText('PREÇO', wx + ww - 54, wy + 8, { color: NES_COLORS.GOLD });
    renderer.fillRect(wx + 8, wy + 18, ww - 16, 1, NES_COLORS.WHITE);

    const visible = this.shopCatalog.slice(this.listScroll, this.listScroll + this.maxVisible);
    for (let i = 0; i < visible.length; i++) {
      const idx = this.listScroll + i;
      const item = visible[i];
      const ry = wy + 24 + i * 12;
      const isSelected = idx === this.listIndex;

      if (isSelected && this.mode === 'buy') {
        renderer.drawText('►', wx + 10, ry, { color: NES_COLORS.WHITE });
      }

      const color = isSelected ? NES_COLORS.WHITE : NES_COLORS.LIGHT_GRAY;
      renderer.drawText(item.name, wx + 22, ry, { color });
      renderer.drawText(`${item.price}O`, wx + ww - 52, ry, { color: NES_COLORS.GOLD });
    }

    renderer.fillRect(wx + 8, wy + 88, ww - 16, 1, NES_COLORS.DARK_GRAY);
    const current = this.shopCatalog[this.listIndex];
    if (current) {
      const owned = gameState.getItemQuantity(current.id);
      renderer.drawText(current.description, wx + 10, wy + 94, {
        color: NES_COLORS.LIGHT_BLUE,
        lineHeight: 12,
      });
      renderer.drawText(`Possui: ${owned}`, wx + ww - 84, wy + 120, {
        color: NES_COLORS.PALE_GREEN,
      });
    }
  }

  private renderSellWindow(renderer: Renderer): void {
    const wx = 8;
    const wy = 78;
    const ww = 240;
    const wh = 138;

    renderer.drawWindow(wx, wy, ww, wh, NES_COLORS.BLACK);
    renderer.drawText('VENDER ITEM', wx + 12, wy + 8, { color: NES_COLORS.PALE_GREEN });
    renderer.drawText('VALOR', wx + ww - 54, wy + 8, { color: NES_COLORS.GOLD });
    renderer.fillRect(wx + 8, wy + 18, ww - 16, 1, NES_COLORS.WHITE);

    const sellable = this.getSellableSlots();
    if (sellable.length === 0) {
      renderer.drawText('Não há itens vendáveis.', wx + 16, wy + 34, {
        color: NES_COLORS.LIGHT_GRAY,
      });
      return;
    }

    const visible = sellable.slice(this.listScroll, this.listScroll + this.maxVisible);
    for (let i = 0; i < visible.length; i++) {
      const idx = this.listScroll + i;
      const entry = visible[i];
      const ry = wy + 24 + i * 12;
      const isSelected = idx === this.listIndex;

      if (isSelected && this.mode === 'sell') {
        renderer.drawText('►', wx + 10, ry, { color: NES_COLORS.WHITE });
      }

      const isEquippedSingle = gameState.isEquipped(entry.def.id) && entry.quantity <= 1;
      const tag = isEquippedSingle ? '[E] ' : '';
      const sellPrice = Math.max(1, Math.floor(entry.def.price / 2));
      const color = isSelected ? NES_COLORS.WHITE : (isEquippedSingle ? NES_COLORS.LIGHT_BLUE : NES_COLORS.LIGHT_GRAY);
      renderer.drawText(`${tag}${entry.def.name} x${entry.quantity}`, wx + 22, ry, { color });
      renderer.drawText(`${sellPrice}O`, wx + ww - 52, ry, { color: NES_COLORS.GOLD });
    }

    renderer.fillRect(wx + 8, wy + 88, ww - 16, 1, NES_COLORS.DARK_GRAY);
    const current = sellable[this.listIndex];
    if (current) {
      renderer.drawText(current.def.description, wx + 10, wy + 94, {
        color: NES_COLORS.LIGHT_BLUE,
        lineHeight: 12,
      });
    }
  }
}
