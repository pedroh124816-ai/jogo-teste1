import { describe, it, expect } from 'vitest';
import { CUTSCENE_RAW_DATA, getCutsceneData } from '../src/assets/cutsceneGraphics';
import { NES_COLORS } from '../src/engine/Palette';

describe('Validação das Cinemáticas Retrô 8-bits (Pixel Art)', () => {
  const REQUIRED_CUTSCENES = [
    'tavo_morte',
    'ulan_ultimo_suspiro',
    'terremoto_passo',
    'queda_ponte_cobre',
    'intro_grande_treva',
    'intro_grande_lume',
  ];

  it('todas as cutscenes prioritárias requisitadas devem estar cadastradas', () => {
    for (const id of REQUIRED_CUTSCENES) {
      const data = getCutsceneData(id);
      expect(data, `Cutscene ${id} deve existir`).toBeDefined();
    }
  });

  it('todas as matrizes de cutscenes devem ter exatamente 128x72 e caracteres válidos na paleta', () => {
    for (const [id, data] of Object.entries(CUTSCENE_RAW_DATA)) {
      expect(data.width).toBe(128);
      expect(data.height).toBe(72);
      expect(data.frames.length).toBeGreaterThanOrEqual(2);

      const validNesHexValues = new Set([...Object.values(NES_COLORS), 'transparent']);

      // Valida paleta
      for (const [char, colorHex] of Object.entries(data.palette)) {
        expect(
          validNesHexValues.has(colorHex),
          `Cor '${colorHex}' na paleta de ${id} deve ser da paleta oficial NES ou transparent`
        ).toBe(true);
      }

      // Valida cada frame e cada pixel
      data.frames.forEach((frame, fIdx) => {
        expect(frame.length, `Frame ${fIdx} de ${id} deve ter 72 linhas`).toBe(72);
        frame.forEach((row, rIdx) => {
          expect(row.length, `Linha ${rIdx} do frame ${fIdx} de ${id} deve ter 128 caracteres`).toBe(128);
          for (let x = 0; x < row.length; x++) {
            const ch = row[x];
            expect(
              ch in data.palette,
              `Caractere '${ch}' em ${id} [F:${fIdx}, Y:${rIdx}, X:${x}] deve estar na paleta`
            ).toBe(true);
          }
        });
      });
    }
  });

  it('Morte de Mestre Tavo (Ato 4): deve ter 2 frames de respiração, sangue, armadura e alforje com a prova', () => {
    const tavo = CUTSCENE_RAW_DATA['tavo_morte'];
    expect(tavo).toBeDefined();
    expect(tavo.frames.length).toBe(2);

    // Frame 0 e Frame 1 devem ter diferenças sutis (movimento do peito / respiração)
    const f0Str = tavo.frames[0].join('');
    const f1Str = tavo.frames[1].join('');
    expect(f0Str).not.toBe(f1Str);

    // Deve conter cores de sangue (DARK_RED / RED), alforje (DARK_BROWN / BROWN) e cabelo grisalho (LIGHT_GRAY / WHITE)
    expect(tavo.palette['A']).toBe(NES_COLORS.DARK_RED);
    expect(tavo.palette['R']).toBe(NES_COLORS.RED);
    expect(tavo.palette['Z']).toBe(NES_COLORS.DARK_BROWN);
    expect(tavo.palette['L']).toBe(NES_COLORS.LIGHT_GRAY);
    expect(tavo.palette['W']).toBe(NES_COLORS.WHITE);

    // A carta/prova no alforje deve ter caracteres de papel e alforje
    expect(f0Str.includes('A')).toBe(true);
    expect(f0Str.includes('Z')).toBe(true);
    expect(f0Str.includes('W')).toBe(true);
  });

  it('Último Suspiro de Ulan (Ato 1): deve ter olhar humano marejado e Pulseira Antiga brilhando', () => {
    const ulan = CUTSCENE_RAW_DATA['ulan_ultimo_suspiro'];
    expect(ulan).toBeDefined();
    expect(ulan.frames.length).toBe(2);

    // Cores da pulseira e lágrimas: ouro (GOLD/YELLOW) e ciano místico (CYAN/LIGHT_BLUE)
    expect(ulan.palette['O']).toBe(NES_COLORS.GOLD);
    expect(ulan.palette['C']).toBe(NES_COLORS.CYAN);
    expect(ulan.palette['I']).toBe(NES_COLORS.LIGHT_BLUE);
    expect(ulan.palette['W']).toBe(NES_COLORS.WHITE);

    const f0Str = ulan.frames[0].join('');
    const f1Str = ulan.frames[1].join('');
    expect(f0Str).not.toBe(f1Str);
    expect(f0Str.includes('C')).toBe(true);
    expect(f0Str.includes('O')).toBe(true);
  });

  it('A Queda da Ponte de Cobre (Ato 3): deve conter fogo intenso, escuridão e Príncipe Dagan com sua capa', () => {
    const ponte = CUTSCENE_RAW_DATA['queda_ponte_cobre'];
    expect(ponte).toBeDefined();
    expect(ponte.frames.length).toBe(2);

    // Cores de chamas e capa real: DARK_RED, RED, GOLD, YELLOW, WHITE
    expect(ponte.palette['R']).toBe(NES_COLORS.RED);
    expect(ponte.palette['O']).toBe(NES_COLORS.GOLD);
    expect(ponte.palette['Y']).toBe(NES_COLORS.YELLOW);

    const f0Str = ponte.frames[0].join('');
    const f1Str = ponte.frames[1].join('');
    expect(f0Str).not.toBe(f1Str);
    expect(f0Str.includes('R')).toBe(true);
    expect(f0Str.includes('Y')).toBe(true);
  });

  it('Melhorias da Introdução: Grande Treva e Grande Lume no topo do Castelo', () => {
    const treva = CUTSCENE_RAW_DATA['intro_grande_treva'];
    const lume = CUTSCENE_RAW_DATA['intro_grande_lume'];

    expect(treva).toBeDefined();
    expect(lume).toBeDefined();

    // Treva deve conter fendas vermelhas/douradas
    const trevaStr = treva.frames[0].join('');
    expect(trevaStr.includes('A')).toBe(true);
    expect(trevaStr.includes('R')).toBe(true);

    // Lume deve conter o feixe de luz divino e colinas verdes
    const lumeStr = lume.frames[0].join('');
    expect(lumeStr.includes('W')).toBe(true);
    expect(lumeStr.includes('O')).toBe(true);
    expect(lumeStr.includes('C')).toBe(true);
    expect(lumeStr.includes('G')).toBe(true);
  });

  it('O Passo Desaba (fim do Ato 1): desfiladeiro ao entardecer com fresta de terra aberta, poeira e pedras', () => {
    const passo = CUTSCENE_RAW_DATA['terremoto_passo'];
    expect(passo).toBeDefined();
    expect(passo.id).toBe('terremoto_passo');
    expect(passo.name).toBe('O Passo Desaba');
    expect(passo.act).toBe(1);
    expect(passo.width).toBe(128);
    expect(passo.height).toBe(72);
    expect(passo.frames.length).toBe(2);

    // Valida paleta: céu laranja/roxo, rochas cinzas, vale verde, poeira e caminho de terra
    expect(passo.palette['N']).toBe(NES_COLORS.NAVY_BLUE);
    expect(passo.palette['A']).toBe(NES_COLORS.DARK_RED);
    expect(passo.palette['R']).toBe(NES_COLORS.RED);
    expect(passo.palette['H']).toBe(NES_COLORS.SKIN);
    expect(passo.palette['S']).toBe(NES_COLORS.SAND);
    expect(passo.palette['G']).toBe(NES_COLORS.DEEP_GREEN);
    expect(passo.palette['F']).toBe(NES_COLORS.FOREST_GREEN);
    expect(passo.palette['P']).toBe(NES_COLORS.GRASS_GREEN);
    expect(passo.palette['Z']).toBe(NES_COLORS.DARK_BROWN);
    expect(passo.palette['T']).toBe(NES_COLORS.BROWN);
    expect(passo.palette['X']).toBe(NES_COLORS.DIRT);
    expect(passo.palette['D']).toBe(NES_COLORS.DARK_GRAY);
    expect(passo.palette['M']).toBe(NES_COLORS.MED_GRAY);
    expect(passo.palette['L']).toBe(NES_COLORS.LIGHT_GRAY);

    const f0Str = passo.frames[0].join('');
    const f1Str = passo.frames[1].join('');

    // Frames devem ser diferentes (animação de desabamento)
    expect(f0Str).not.toBe(f1Str);

    // Céu ao entardecer presente em ambos
    expect(f0Str.includes('N')).toBe(true);
    expect(f0Str.includes('A')).toBe(true);
    expect(f0Str.includes('H')).toBe(true);

    // Vale verde e castelo ao fundo presentes
    expect(f0Str.includes('P')).toBe(true);
    expect(f0Str.includes('F')).toBe(true);
    expect(f0Str.includes('O')).toBe(true); // Lume / beacon do castelo

    // Poeira e caminho de terra
    expect(f0Str.includes('X')).toBe(true);
    expect(f0Str.includes('T')).toBe(true);
    expect(f1Str.includes('X')).toBe(true);
    expect(f1Str.includes('T')).toBe(true);

    // Frame 1 deve ter poeira marrom mais densa e caminho aberto (mais pixels de poeira/areia/pele clara J/S)
    const dustCountF0 = (f0Str.match(/[STJ]/g) || []).length;
    const dustCountF1 = (f1Str.match(/[STJ]/g) || []).length;
    expect(dustCountF1, 'Frame 1 deve ter poeira e areia mais densas que Frame 0').toBeGreaterThan(dustCountF0);

    // Pássaros fugindo no canto superior (linhas 0-14, colunas 90-127)
    let birdsFoundF0 = false;
    let birdsFoundF1 = false;
    for (let r = 0; r < 15; r++) {
      const row0 = passo.frames[0][r].slice(90);
      const row1 = passo.frames[1][r].slice(90);
      if (row0.includes('K')) birdsFoundF0 = true;
      if (row1.includes('K')) birdsFoundF1 = true;
    }
    expect(birdsFoundF0, 'Pássaros devem estar voando no canto superior no Frame 0').toBe(true);
    expect(birdsFoundF1, 'Pássaros devem estar voando no canto superior no Frame 1').toBe(true);
  });
});
