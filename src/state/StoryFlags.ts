/**
 * Sistema tipado de Flags, Pontos de Dúvida e Lealdade da narrativa
 * conforme especificado em resumo-para-jogo.md.
 */

export type LealdadeState = 'fiel' | 'duvida' | 'rebelde';
export type BrindeCulpado = 'brenn' | 'hald' | 'vael';

export type BooleanFlagKey =
  // Ato 1
  | 'rei_missao_recebida'
  | 'espada_recebida'
  | 'medalhao_recebido'
  | 'sael_encontrado'
  | 'poco_bina_resolvido'
  | 'bau_ulan_aberto'
  | 'fera_derrotada'
  | 'pulseira_ulan_vista'
  | 'banquete_alianca'
  | 'brinde_resolvido'
  | 'vael_patrono'
  | 'ato1_concluido'
  | 'sonho_1_visto'
  // Ato 2
  | 'garo_carga_vista'
  | 'carga_perdida_resolvida'
  | 'tavo_investigando'
  | 'brasca_poupado'
  | 'brasca_executado'
  | 'medalhao_brilhou'
  | 'hesper_viu_medalhao'
  | 'olivia_aviso_dado'
  | 'ato2_concluido'
  | 'sonho_2_visto'
  // Ato 3
  | 'olo_ouvido'
  | 'maren_ouvida'
  | 'ervas_entregues'
  | 'pao_entregue'
  | 'mina_velha_vista'
  | 'orun_encontrado'
  | 'fera_era_guardiao'
  | 'chave_cobre_recebida'
  | 'cobre_alto_traido'
  | 'daros_derrotado'
  | 'ponte_destruida'
  | 'relojoeiro_resolvido'
  | 'carta_tavo_achada'
  | 'ato3_concluido'
  | 'sonho_3_visto'
  // Ato 4
  | 'tavo_morto'
  | 'rei_protegeu_vael'
  | 'marta_deixou_fugir'
  | 'iris_traicao_revelada'
  | 'refugio_aberto'
  | 'origem_revelada'
  | 'medalhao_verdade'
  | 'pedra_eco_obtida'
  | 'lente_olivia_obtida'
  | 'travessia_feita'
  | 'vael_derrotado'
  | 'pim_salvo'
  | 'hesper_caiu'
  | 'olivia_lider_santuario'
  | 'iris_perdoada'
  | 'dagan_aliado'
  | 'dagan_inimigo'
  | 'ato4_concluido'
  | 'sonho_4_visto'
  // Ato 5
  | 'ilha_acessivel'
  | 'templo_coracao_aberto'
  | 'selo_veyra_obtido'
  | 'diario_auren_lido'
  | 'castelo_invadido'
  | 'auren_derrotado'
  | 'final_b_coroa_vazia'
  | 'sonho_5_visto';

const DUVIDA_FLAG_KEYS: readonly BooleanFlagKey[] = [
  'brasca_poupado',
  'olo_ouvido',
  'maren_ouvida',
  'mina_velha_vista',
];

export class StoryFlags {
  private flags: Record<string, boolean> = {};
  public duvidaPontos = 0;
  public lealdade: LealdadeState = 'fiel';
  public brindeCulpado: BrindeCulpado | null = null;

  constructor() {
    this.reset();
  }

  public reset(): void {
    this.flags = {};
    this.duvidaPontos = 0;
    this.lealdade = 'fiel';
    this.brindeCulpado = null;
  }

  public get(flag: BooleanFlagKey | string): boolean {
    return Boolean(this.flags[flag]);
  }

  public set(flag: BooleanFlagKey | string, value = true): void {
    this.flags[flag] = value;
    this.recalculateDerivedState(flag, value);
  }

  private recalculateDerivedState(changedFlag: string, value: boolean): void {
    // 1. Recalcula duvida_pontos (0 a 4)
    let pts = 0;
    for (const k of DUVIDA_FLAG_KEYS) {
      if (this.flags[k]) pts++;
    }
    this.duvidaPontos = pts;

    // 2. Regra de Dagan (Ato 4): olo_ouvido + maren_ouvida + brasca_poupado >= 2
    const diplomaticCount =
      (this.flags['olo_ouvido'] ? 1 : 0) +
      (this.flags['maren_ouvida'] ? 1 : 0) +
      (this.flags['brasca_poupado'] ? 1 : 0);
    if (diplomaticCount >= 2) {
      this.flags['dagan_aliado'] = true;
      this.flags['dagan_inimigo'] = false;
    }

    // 3. Regras de Lealdade (Seção 4 de resumo-para-jogo.md)
    if (this.flags['rei_protegeu_vael']) {
      this.lealdade = 'rebelde';
    } else if (this.flags['cobre_alto_traido']) {
      this.lealdade = this.duvidaPontos >= 2 ? 'duvida' : 'fiel';
    } else if (changedFlag === 'rei_protegeu_vael' && !value) {
      this.lealdade = this.flags['cobre_alto_traido'] && this.duvidaPontos >= 2 ? 'duvida' : 'fiel';
    }
  }

  /**
   * Sorteia ou define o culpado da missão "O brinde" no Ato 1.
   */
  public ensureBrindeCulpado(forced?: BrindeCulpado): BrindeCulpado {
    if (forced) {
      this.brindeCulpado = forced;
      return forced;
    }
    if (!this.brindeCulpado) {
      const suspects: BrindeCulpado[] = ['brenn', 'hald', 'vael'];
      const idx = Math.floor(Math.random() * suspects.length);
      this.brindeCulpado = suspects[idx];
    }
    return this.brindeCulpado;
  }

  /**
   * Avalia uma expressão simples de condição de flag usada em mapas/NPCs.
   * Exemplos:
   * - "rei_missao_recebida" -> true se a flag for verdadeira
   * - "!rei_missao_recebida" -> true se a flag for falsa
   * - "lealdade:rebelde" -> true se lealdade === 'rebelde'
   * - "brinde_culpado:vael" -> true se brindeCulpado === 'vael'
   */
  public evaluateCondition(condition?: string): boolean {
    if (!condition || !condition.trim()) return true;
    const parts = condition.split(',').map((p) => p.trim()).filter(Boolean);

    for (const expr of parts) {
      if (expr.startsWith('lealdade:')) {
        const target = expr.slice('lealdade:'.length);
        if (this.lealdade !== target) return false;
      } else if (expr.startsWith('brinde_culpado:')) {
        const target = expr.slice('brinde_culpado:'.length);
        if (this.brindeCulpado !== target) return false;
      } else if (expr.startsWith('!')) {
        const flagName = expr.slice(1);
        if (this.get(flagName)) return false;
      } else {
        if (!this.get(expr)) return false;
      }
    }

    return true;
  }

  public toJSON(): {
    flags: Record<string, boolean>;
    duvidaPontos: number;
    lealdade: LealdadeState;
    brindeCulpado: BrindeCulpado | null;
  } {
    return {
      flags: { ...this.flags },
      duvidaPontos: this.duvidaPontos,
      lealdade: this.lealdade,
      brindeCulpado: this.brindeCulpado,
    };
  }

  public fromJSON(data: {
    flags?: Record<string, boolean>;
    duvidaPontos?: number;
    lealdade?: LealdadeState;
    brindeCulpado?: BrindeCulpado | null;
  }): void {
    this.reset();
    if (data && typeof data === 'object') {
      if (data.flags && typeof data.flags === 'object') {
        this.flags = { ...data.flags };
      }
      if (typeof data.duvidaPontos === 'number') {
        this.duvidaPontos = data.duvidaPontos;
      }
      if (data.lealdade === 'fiel' || data.lealdade === 'duvida' || data.lealdade === 'rebelde') {
        this.lealdade = data.lealdade;
      }
      if (data.brindeCulpado === 'brenn' || data.brindeCulpado === 'hald' || data.brindeCulpado === 'vael') {
        this.brindeCulpado = data.brindeCulpado;
      }
    }
  }
}

