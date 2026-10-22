import { describe, it, expect, beforeEach } from 'vitest';
import { gameState } from '../src/state/GameState';
import { DialogueBox } from '../src/engine/DialogueBox';
import { NPC } from '../src/entities/NPC';

describe('Sistema de Flags, Lealdade, Nome do Herói e Diálogos Condicionais (Etapa 4)', () => {
  beforeEach(() => {
    gameState.reset();
  });

  it('deve calcular duvida_pontos, lealdade e dagan_aliado conforme seção 4 de resumo-para-jogo.md', () => {
    expect(gameState.flags.lealdade).toBe('fiel');
    expect(gameState.flags.duvidaPontos).toBe(0);

    // 1 ponto de dúvida: em cobre_alto_traido continua 'fiel'
    gameState.setFlag('brasca_poupado', true);
    expect(gameState.flags.duvidaPontos).toBe(1);
    gameState.setFlag('cobre_alto_traido', true);
    expect(gameState.flags.lealdade).toBe('fiel');

    // 2 pontos de dúvida (e 2 escolhas diplomáticas): vira 'duvida' e ativa 'dagan_aliado'
    gameState.setFlag('olo_ouvido', true);
    expect(gameState.flags.duvidaPontos).toBe(2);
    expect(gameState.flags.lealdade).toBe('duvida');
    expect(gameState.getFlag('dagan_aliado')).toBe(true);

    // Em rei_protegeu_vael: vira sempre 'rebelde'
    gameState.setFlag('rei_protegeu_vael', true);
    expect(gameState.flags.lealdade).toBe('rebelde');
  });

  it('deve sortear e manter brinde_culpado entre brenn, hald ou vael', () => {
    const culpado = gameState.flags.ensureBrindeCulpado();
    expect(['brenn', 'hald', 'vael']).toContain(culpado);
    expect(gameState.flags.ensureBrindeCulpado()).toBe(culpado);
    expect(gameState.flags.evaluateCondition(`brinde_culpado:${culpado}`)).toBe(true);
  });

  it('deve limitar [NOME] a 8 caracteres, interpolar [NOME] e paginar por --- na DialogueBox', () => {
    gameState.setHeroName('LuminarioHeroi');
    expect(gameState.name).toBe('Luminari');
    expect(gameState.name.length).toBe(8);

    const box = new DialogueBox();
    const d02 =
      'Postura, [NOME]! Espada\nfirme, queixo erguido.\nAssim se serve ao Rei!\n---\nUm dia você será mais\nforte que eu. Hoje ainda\ntropeça na galinha.';

    const pages = box.paginateText(gameState.interpolateText(d02));
    expect(pages.length).toBe(2);
    expect(pages[0]).toContain('Postura, Luminari!');
    expect(pages[1]).toContain('tropeça na galinha.');

    for (const p of pages) {
      const lines = p.split('\n');
      expect(lines.length).toBeLessThanOrEqual(3);
      for (const l of lines) {
        expect(l.length).toBeLessThanOrEqual(28);
      }
    }
  });

  it('NPC deve alternar fala e visibilidade conforme flags da história', () => {
    const rei = new NPC({
      id: 'npc_10',
      name: 'Rei Auren',
      spriteId: 'npc_king',
      tileX: 18,
      tileY: 5,
      dialogue: 'Fala inicial antes da missão.',
      setFlagOnTalk: 'rei_missao_recebida',
      altFlag: 'rei_missao_recebida',
      altDialogue: 'Vá à Vila de Alvorada, [NOME].',
      hideIfFlag: 'tavo_morto',
    });

    expect(rei.isVisible()).toBe(true);
    expect(rei.getActiveDialogue()).toBe('Fala inicial antes da missão.');

    gameState.setFlag('rei_missao_recebida', true);
    expect(rei.getActiveDialogue()).toBe('Vá à Vila de Alvorada, [NOME].');

    gameState.setFlag('tavo_morto', true);
    expect(rei.isVisible()).toBe(false);
  });
});
