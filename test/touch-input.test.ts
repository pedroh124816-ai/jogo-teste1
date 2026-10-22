import { describe, it, expect } from 'vitest';
import { Input } from '../src/engine/Input';

describe('Suporte a Controles Virtuais Touch no Input', () => {
  it('pressAction e releaseAction devem simular corretamente toques de botões virtuais', () => {
    const input = new Input();

    // 1. Simula toque no botão A (confirm)
    input.pressAction('confirm');
    expect(input.isDown('confirm')).toBe(true);
    expect(input.wasPressed('confirm')).toBe(true);

    // 2. Tick seguinte com dedo mantido pressionado
    input.update();
    expect(input.isDown('confirm')).toBe(true);
    expect(input.wasPressed('confirm')).toBe(false);

    // 3. Solta o botão
    input.releaseAction('confirm');
    expect(input.isDown('confirm')).toBe(false);
    expect(input.wasReleased('confirm')).toBe(true);

    // 4. Tick seguinte sem toque
    input.update();
    expect(input.isDown('confirm')).toBe(false);
    expect(input.wasReleased('confirm')).toBe(false);
  });

  it('deve suportar ações direcionais do D-Pad', () => {
    const input = new Input();

    input.pressAction('right');
    expect(input.isDown('right')).toBe(true);

    // Simula arrasto no D-pad de direita para baixo
    input.releaseAction('right');
    input.pressAction('down');

    expect(input.isDown('right')).toBe(false);
    expect(input.isDown('down')).toBe(true);

    input.releaseAction('down');
    expect(input.isDown('down')).toBe(false);
  });
});
