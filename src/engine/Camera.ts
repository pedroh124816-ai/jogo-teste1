import { CONFIG } from '../config';

export class Camera {
  public x = 0;
  public y = 0;

  public readonly viewportWidth = CONFIG.screen.width;
  public readonly viewportHeight = CONFIG.screen.height;

  private mapPixelWidth = 0;
  private mapPixelHeight = 0;

  public setMapBounds(mapWidthInTiles: number, mapHeightInTiles: number): void {
    this.mapPixelWidth = mapWidthInTiles * CONFIG.screen.tileSize;
    this.mapPixelHeight = mapHeightInTiles * CONFIG.screen.tileSize;
  }

  /**
   * Centraliza a câmera no ponto de foco (ex: o herói),
   * travando nas bordas do mapa para não mostrar o vazio.
   */
  public follow(focusX: number, focusY: number): void {
    const tileSize = CONFIG.screen.tileSize;
    const halfCols = Math.floor(this.viewportWidth / tileSize / 2);
    const halfRows = Math.floor(this.viewportHeight / tileSize / 2);

    // Alvo alinhado à grade de tiles (evita meio tile cortado nas bordas quando parado)
    let targetX = focusX - halfCols * tileSize;
    let targetY = focusY - halfRows * tileSize;

    // Se o mapa for menor que a viewport, centraliza o mapa com fundo preto
    if (this.mapPixelWidth <= this.viewportWidth) {
      targetX = -Math.floor((this.viewportWidth - this.mapPixelWidth) / 2);
    } else {
      // Clamping nas bordas
      const maxX = this.mapPixelWidth - this.viewportWidth;
      targetX = Math.max(0, Math.min(targetX, maxX));
    }

    if (this.mapPixelHeight <= this.viewportHeight) {
      targetY = -Math.floor((this.viewportHeight - this.mapPixelHeight) / 2);
    } else {
      const maxY = this.mapPixelHeight - this.viewportHeight;
      targetY = Math.max(0, Math.min(targetY, maxY));
    }

    // Posições inteiras para manter os pixels nítidos sem tremulação subpixel
    this.x = Math.round(targetX);
    this.y = Math.round(targetY);
  }

  public toScreen(worldX: number, worldY: number): { x: number; y: number } {
    return {
      x: Math.round(worldX - this.x),
      y: Math.round(worldY - this.y),
    };
  }
}
