import { describe, it, expect } from 'vitest';
import { MONSTER_RAW_DATA } from '../src/assets/monsterGraphics';

describe('Validação de Gráficos de Monstros (Pixel Art)', () => {
  it('todos os monstros cadastrados devem ter dimensões e paletas válidas', () => {
    for (const [id, data] of Object.entries(MONSTER_RAW_DATA)) {
      expect(data.matrix.length, `Altura de ${id} deve ser ${data.height}`).toBe(data.height);

      for (let y = 0; y < data.matrix.length; y++) {
        const row = data.matrix[y];
        expect(row.length, `Linha ${y} de ${id} deve ter largura ${data.width}`).toBe(data.width);

        for (let x = 0; x < row.length; x++) {
          const char = row[x];
          expect(char in data.palette, `Caractere '${char}' em ${id} (x=${x}, y=${y}) deve existir na paleta`).toBe(true);
        }
      }
    }
  });

  it('deve conter todos os monstros obrigatórios do Ato 1', () => {
    const act1Monsters = [
      'gosma_cinza',
      'lebre_cinza',
      'corvo_manchado',
      'lobo_brasa',
      'tronco_palido',
      'bandoleiro',
      'morcego_treva',
      'mineiro_louco',
      'ulan_fera',
    ];

    for (const id of act1Monsters) {
      expect(MONSTER_RAW_DATA[id], `Monstro ${id} deve existir em MONSTER_RAW_DATA`).toBeDefined();
    }
  });

  it('deve conter todos os 6 monstros do Ato 2 com sprites originais 32x32', () => {
    const act2Monsters = [
      'caranguejo_vidro',
      'contrabandista',
      'sirena_coral',
      'gaivota_abissal',
      'tartaruga_espinho',
      'anemona_eletrica',
    ];

    for (const id of act2Monsters) {
      const m = MONSTER_RAW_DATA[id];
      expect(m, `Monstro do Ato 2 ${id} deve existir em MONSTER_RAW_DATA`).toBeDefined();
      expect(m.width).toBe(32);
      expect(m.height).toBe(32);
    }
  });

  it('ulan_fera deve possuir a Pulseira Veyra em sua arte e paleta', () => {
    const ulan = MONSTER_RAW_DATA['ulan_fera'];
    expect(ulan).toBeDefined();
    expect(ulan.width).toBe(48);
    expect(ulan.height).toBe(48);

    // Deve conter cores ciano e ouro na paleta
    expect(ulan.palette['C']).toBeDefined();
    expect(ulan.palette['G']).toBeDefined();

    // Deve conter os pixels da Pulseira Veyra na matriz
    const matrixJoined = ulan.matrix.join('');
    expect(matrixJoined.includes('C'), 'Ulan Fera deve ter pixel ciano (C) da Pulseira Veyra').toBe(true);
  });
});
