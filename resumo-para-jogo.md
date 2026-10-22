# Lenda de Luminário — Resumo para o Jogo

Versão enxuta e técnica da narrativa, para implementação. A história completa está em `narrativa.md`.

---

## 0. Convenções

- **Mecânica base:** herói solo, sem sistema de grupo. Mestre Tavo e Íris são NPCs que aparecem em locais fixos conforme o ato.
- **Ids:** `snake_case`.
- **Tipos de Flags:**
  - **Booleanas** (padrão): `true` / `false`.
  - **Inteiras**: `duvida_pontos` (`0` a `4`).
  - **Enums (strings restritas)**:
    - `lealdade`: `'fiel'` (padrão), `'duvida'` ou `'rebelde'`. Muda o que os NPCs dizem (ver seção 9).
    - `brinde_culpado`: `'brenn'`, `'hald'` ou `'vael'` (sorteado ao iniciar a missão "O brinde" e salvo no `localStorage`).
- **Nome do herói:** `[NOME]`. Escolhido pelo jogador na abertura (máximo de 8 caracteres). Nos diálogos, o marcador `[NOME]` conta como 8 caracteres e é substituído dinamicamente.
- **Caixa de diálogo (CONFIRMADO):** verificado em `src/engine/DialogueBox.ts` — o limite real é exatamente **28 caracteres por linha e 3 linhas por página**. Os diálogos da seção 11 já obedecem a essa métrica exata.
- **Formato dos diálogos:** cada bloco de código é um diálogo; `---` ou `\n\n` separam páginas.

---

## 1. Locais

> **Mapeamento com arquivos atuais em `src/data/maps/`**:
> - `castelo_real` → `castelo.json` (+ `castelo_subsolo.json`)
> - `alvorada` → `cidade_1.json` (+ interiores `cidade_1_*.json`)
> - `porto_sol` → `cidade_2.json`
> - `santuario_luz` → `santuario.json`
> - `caverna_sombras` → `caverna_b1.json`, `caverna_b2.json` (e opcionalmente `caverna_b3.json`)

| id | Nome | Tipo | Reino | Ato | O que acontece |
|---|---|---|---|---|---|
| `castelo_real` | Castelo Real | Castelo, cidade | Luminário | 1, 4, 5 | Convocação, Espada e Medalhão, banquete, "O brinde"; confronto com Auren (Ato 4); portão lateral aberto por Marta (Ato 5) |
| `campos_alvorada` | Campos de Alvorada | Região | Luminário | 1 | Monstros iniciais (`Gosma-Cinza`, etc.); liga o castelo a Alvorada |
| `alvorada` | Vila de Alvorada | Vila | Luminário | 1 | Treino com Tavo, Íris, estalagem de Nena (sonho 1), "O poço de Dona Bina" |
| `bosque_brasa` | Bosque de Brasa | Floresta | Luminário | 1+ | Encontro com Sael (Ato 1); abriga o refúgio; mais encontros |
| `caverna_sombras` | Caverna das Sombras | Masmorra (2-3 andares) | Luminário | 1 | Chefe `ulan_fera`; marcas de picareta; baú de Ulan (opcional) |
| `porto_sol` | Porto do Sol | Cidade | Luminário | 2, 4, 5 | Garo, cativos, "A carga perdida", Tavo na taverna; sonhos 2 e 5; barco para a ilha |
| `costa_sol` | Costa do Sol | Região | Luminário | 2 | Contrabandistas, caranguejos de vidro |
| `gruta_costa` | Gruta da Costa | Local de duelo | Luminário | 2 | Duelo com Brasca e escolha poupar/executar |
| `santuario_luz` | Santuário da Luz | Templo | Luminário | 2, 4 | Bênção do Medalhão; Olívia e Hesper; Lente de Olívia (Ato 4) |
| `cripta_refino` | Cripta de Refino | Masmorra (2 níveis) | Luminário | 4 | Cativos, Pim, chefe `vael` |
| `vau_cinza` | Vau-Cinza | Cidade | Brumaterra | 3 | Regente Olo, "Ervas do brejo" |
| `pantano_brumaterra` | Pântano de Brumaterra | Região | Brumaterra | 3 | Treva em estado puro |
| `cabana_orun` | Cabana de Orun | Local | Brumaterra | 3 | Orun revela que a Fera tinha nome |
| `rochedo` | Rochedo | Cidade | Pedrasul | 3, 4 | Rainha Maren, "Pão de pedra", sonho 3 (opcional), "A carta de Tavo" |
| `montanhas_pedrasul` | Montanhas de Pedrasul | Região | Pedrasul | 3 | Monstros de montanha |
| `mina_velha` | Mina Velha | Masmorra (3 níveis) | Pedrasul | 3 | Cativos Veyra, capatazes de Brenn |
| `planalto_cobreval` | Planalto de Cobreval | Região | Cobreval | 3 | Golens e guardas |
| `cobre_alto` | Cobre-Alto | Cidade | Cobreval | 3 | "O relojoeiro", invasão, chefe `daros` |
| `ponte_cobre` | Ponte de Cobre | Passagem | Cobreval | 3 | Destruída por Dagan (`ponte_destruida`) |
| `refugio_raizes` | Refúgio das Raízes | Cidade escondida | Luminário (floresta) | 4 | Sael, Orun, origem do herói, sonho 4, "A travessia" |
| `ilha_veyra` | Ilha Veyra | Região | Povos esquecidos | 5 | Ruínas e ecos |
| `templo_coracao` | Templo-Coração | Masmorra (3 salas) | Povos esquecidos | 5 | Medalhão abre a porta; Selo de Veyra |
| `camara_lume` | Câmara do Lume | Masmorra (2 andares) | Luminário | 5 | Diário do Rei, chefe `auren` |

---

## 2. Personagens

| id | Nome | Papel | Onde ficam (por ato) |
|---|---|---|---|
| `auren` | Rei Auren | Vilão | Castelo Real (1, 3, 4); Câmara do Lume (5) |
| `tavo` | Mestre Tavo | Mentor | Alvorada e Castelo (1); Porto do Sol (2); Rochedo (3, opcional); Castelo (4, morre) |
| `vael` | Lorde Vael | Conselheiro, rival, assassino | Castelo (1, 3, 4); Cripta de Refino (4) |
| `iris` | Íris | Amiga, traidora | Alvorada (1); Castelo (1, 3); Porto do Sol (2, 4) |
| `dagan` | Príncipe Dagan | Herdeiro, rival | Castelo (1); Cobre-Alto (3); Rochedo (4); portões do castelo (5) |
| `daros` | Rei Daros | Chefe | Castelo (1, banquete); Cobre-Alto (3) |
| `sael` | Sael | Líder rebelde Veyra | Bosque de Brasa (1); Refúgio (4); Refúgio (pós-créditos) |
| `orun` | Velho Orun | Guardião, mestre do Eco | Cabana (3); Refúgio (4); Templo-Coração (5) |
| `olivia` | Irmã Olívia | Sacerdotisa honesta | Santuário (2, 4) |
| `hesper` | Sumo Sacerdote Hesper | Sacerdote corrupto | Santuário (2, 4) |
| `garo` | Garo | Mercador ambíguo | Porto do Sol (2, 4, 5) |
| `marta` | Capitã Marta | Guarda que duvida | Castelo (1, 3, 4, 5) |
| `maren` | Rainha Maren | Soberana de Pedrasul | Rochedo (3, 4) |
| `olo` | Regente Olo | Governante de Brumaterra | Vau-Cinza (3) |
| `brasca` | Almirante Brasca | Rebelde | Gruta da Costa (2); Porto do Sol (4, 5, se poupado) |
| `ulan` | Ulan (a Fera) | Chefe do Ato 1 | Caverna das Sombras (1) |
| `aneth` | Aneth | Mãe do herói (só em memória) | Sonhos |
| `pim` | Pim | Irmão de Íris, refém | Cripta de Refino (4) |
| `kessa` | General Kessa | Comandante de Cobreval | Cobre-Alto (3) |
| `nena` | Nena | Estalajadeira | Alvorada (1) |
| `bina` | Dona Bina | Camponesa | Alvorada (1) |
| `tome` | Seu Tomé | Relojoeiro | Cobre-Alto (3) |
| `brenn` | Lorde Brenn | Conselheiro das minas, corrupto | Castelo (1, 3); Mina Velha (3) |
| `hald` | Lorde Hald | Conselheiro das finanças, ambíguo | Castelo (1, 3) |
| `ilka` | Dama Ilka | Conselheira honesta | Castelo (1, 3, 4) |
| `ysolde` | Dama Ysolde | Conselheira medrosa | Castelo (1, 3) |

---

## 3. Eventos principais e flags

### Ato 1
| Flag | Quando é ativada | Efeito |
|---|---|---|
| `rei_missao_recebida` | Auren convoca o herói | Abre `campos_alvorada` e `alvorada` |
| `espada_recebida` | Na convocação | Item inicial `espada_alvorada` entregue pelo Rei |
| `medalhao_recebido` | Na convocação | Item-chave `medalhao_alvorada` |
| `sael_encontrado` | Primeiro encontro no bosque | Sael avisa; o herói não escuta |
| `poco_bina_resolvido` | Missão concluída | Recompensa em ouro |
| `bau_ulan_aberto` | Opcional (baú na caverna) | Pista: Ulan era um guardião Veyra |
| `fera_derrotada` | Vence `ulan_fera` | Libera a volta ao castelo |
| `pulseira_ulan_vista` | Após a luta | Símbolo igual ao do Medalhão |
| `banquete_alianca` | Banquete no castelo | Apresenta Daros e Dagan |
| `brinde_culpado` | Início da missão "O brinde" | Enum sorteado (`'brenn'`, `'hald'` ou `'vael'`) e salvo |
| `brinde_resolvido` | Missão "O brinde" concluída | Ensina a desconfiar do conselho |
| `vael_patrono` | Fim do banquete | Vael apresenta-se como patrono |
| `ato1_concluido` | Rei envia ao Porto do Sol | Abre `porto_sol`, `costa_sol` |

### Ato 2
| Flag | Quando | Efeito |
|---|---|---|
| `garo_carga_vista` | Vê as correntes | Muda o diálogo de Garo |
| `carga_perdida_resolvida` | Missão concluída | Mostra a criança na caixa |
| `tavo_investigando` | Cena na taverna | Tavo avisa que algo está errado |
| `brasca_poupado` | Escolha "Poupar" | +1 em `duvida_pontos` |
| `brasca_executado` | Escolha "Executar" | `brasca_poupado` fica falso |
| `medalhao_brilhou` | No altar | O Medalhão brilha |
| `hesper_viu_medalhao` | No altar | Hesper esconde o fato |
| `olivia_aviso_dado` | Após a bênção | Olívia sussurra o aviso |
| `ato2_concluido` | Rei envia a Brumaterra e Pedrasul | Abre `vau_cinza`, `rochedo` e adjacentes |

### Ato 3
| Flag | Quando | Efeito |
|---|---|---|
| `olo_ouvido` | Escolha "Ouvir" | +1 em `duvida_pontos` |
| `maren_ouvida` | Escolha "Ouvir" | +1 em `duvida_pontos` |
| `ervas_entregues` | Missão concluída | Pista do rio brilhante |
| `pao_entregue` | Missão concluída | Recompensa e reputação |
| `mina_velha_vista` | Entra na mina | +1 em `duvida_pontos` (obrigatório) |
| `orun_encontrado` | Na cabana | Orun fala da Fera |
| `fera_era_guardiao` | Após Orun | Revela o nome de Ulan |
| `chave_cobre_recebida` | Rei envia a Cobre-Alto | Item-chave |
| `cobre_alto_traido` | À noite, no portão | Invasão. Calcula `lealdade` |
| `daros_derrotado` | Vence `daros` | Dagan escapa |
| `ponte_destruida` | Fuga de Dagan | `ponte_cobre` destruída; Cobreval fecha |
| `relojoeiro_resolvido` | Missão feita antes da invasão | Payoff nas ruínas e no epílogo (perdível após invasão) |
| `carta_tavo_achada` | Opcional | Prova contra Vael |
| `ato3_concluido` | Saída das ruínas | Abre o Ato 4 |

### Ato 4
| Flag | Quando | Efeito |
|---|---|---|
| `tavo_morto` | Vael o mata | Tavo some do jogo |
| `rei_protegeu_vael` | Confronto com Auren | `lealdade` vira `rebelde` |
| `marta_deixou_fugir` | Cena no portão | Herói foge do castelo |
| `iris_traicao_revelada` | Carta ou cena | Muda os diálogos de Íris |
| `refugio_aberto` | Sael o recebe | Abre `refugio_raizes` |
| `origem_revelada` | No refúgio | Sael e Orun revelam |
| `medalhao_verdade` | No refúgio | O Medalhão é de Aneth |
| `pedra_eco_obtida` | Orun ensina o Eco | Item e habilidade |
| `lente_olivia_obtida` | Olívia a entrega | Mostra NPCs corrompidos |
| `travessia_feita` | Missão concluída | Reputação entre rebeldes |
| `vael_derrotado` | Vence `vael` | Cripta liberada |
| `pim_salvo` | Após `vael_derrotado` | Pim volta para Íris |
| `hesper_caiu` | Após a cripta | Hesper é preso |
| `olivia_lider_santuario` | Após a cripta | Olívia assume |
| `iris_perdoada` | Escolha sim/não | Define o destino de Íris |
| `dagan_aliado` | Se `olo_ouvido` + `maren_ouvida` + `brasca_poupado` ≥ 2 | Líderes testemunham a favor do herói; Dagan se alia |
| `dagan_inimigo` | Caso contrário | Duelo menor no Rochedo |
| `ato4_concluido` | Cripta concluída | Abre o barco |

### Ato 5
| Flag | Quando | Efeito |
|---|---|---|
| `ilha_acessivel` | Barco no Porto do Sol | Abre `ilha_veyra` |
| `templo_coracao_aberto` | Medalhão no encaixe | Abre o templo |
| `selo_veyra_obtido` | Fim do templo | Item-chave (contenção duradoura do lume) |
| `diario_auren_lido` | Câmara do Lume | Cena do início bom |
| `castelo_invadido` | Marta abre o portão | Abre `camara_lume` |
| `auren_derrotado` | Vence `auren` | Cena do último pedido |
| `final_b_coroa_vazia` | Aceita a coroa | Epílogo (seção 10) |

---

## 4. Lealdade (regras)

- `lealdade = 'fiel'` no início.
- `duvida_pontos` (inteiro) soma: `brasca_poupado`, `olo_ouvido`, `maren_ouvida` e `mina_velha_vista` (+1 cada).
- Em `cobre_alto_traido`: se `duvida_pontos` ≥ 2 → `lealdade = 'duvida'`; senão, continua `'fiel'`.
- Em `rei_protegeu_vael`: `lealdade = 'rebelde'`, sempre.

---

## 5. Progressão por ato

| Ato | Abre | Chefe | Itens-chave | Fim |
|---|---|---|---|---|
| 1 | `castelo_real`, `campos_alvorada`, `alvorada`, `bosque_brasa`, `caverna_sombras` | `ulan_fera` | `espada_alvorada`, `medalhao_alvorada`, `selo_real` | `ato1_concluido` |
| 2 | `porto_sol`, `costa_sol`, `gruta_costa`, `santuario_luz` | (duelo Brasca, menor) | — | `ato2_concluido` |
| 3 | `vau_cinza`, `pantano_brumaterra`, `cabana_orun`, `rochedo`, `montanhas_pedrasul`, `mina_velha`, `planalto_cobreval`, `cobre_alto` | `daros` | `chave_cobre` | `ato3_concluido` |
| 4 | `refugio_raizes`, `cripta_refino` (+ retorno ao castelo e ao santuário) | `vael` | `pedra_eco`, `lente_olivia` | `ato4_concluido` |
| 5 | `ilha_veyra`, `templo_coracao`, `camara_lume` | `auren` | `selo_veyra` | `final_b_coroa_vazia` |

---

## 6. Chefes

| id | Local | Ato | Gatilho | Observação |
|---|---|---|---|---|
| `ulan_fera` | `caverna_sombras` | 1 | Fundo da caverna | Tratado como monstro. Fala "...Aneth?" ao morrer (D04) |
| `daros` | `cobre_alto` | 3 | Invasão noturna | Trágico; fala D10 antes da luta |
| `vael` | `cripta_refino` | 4 | Cripta | Tem a prova do assassinato; liberta Pim ao cair |
| `auren` | `camara_lume` | 5 | Fim da câmara | Duas fases; pede D14 no fim |
| `brasca` (duelo menor) | `gruta_costa` | 2 | Gruta | Escolha poupar/executar depois |

---

## 7. Itens-chave

| id | Origem | Função |
|---|---|---|
| `espada_alvorada` | Auren (Ato 1) | Arma inicial entregue na convocação |
| `medalhao_alvorada` | Auren (Ato 1) | Amuleto de Aneth; abre o Templo-Coração |
| `selo_real` | Auren (Ato 1) | Abre portões e acessos oficiais |
| `chave_cobre` | Auren (Ato 3) | Abre o portão interno de Cobre-Alto |
| `pedra_eco` | Orun (Ato 4) | Habilita a magia Eco |
| `lente_olivia` | Olívia (Ato 4) | Revela NPCs corrompidos pelo lume |
| `selo_veyra` | Templo-Coração (Ato 5) | Ritual que permite conter a veia matriz do lume de forma duradoura |

---

## 8. Temas de monstros por região

| Região | Tema | Exemplos |
|---|---|---|
| `campos_alvorada` | Fauna comum adoecendo | Gosma-Cinza, Lebre-Cinza, Corvo Manchado, Javali Doente |
| `bosque_brasa` | Feras corrompidas e desertores (mais encontros) | Lobo de Brasa, Tronco-Pálido, Desertor, Bandoleiro |
| `costa_sol` | Vidro, sombras e contrabando | Caranguejo de Vidro, Gaivota-Sombra, Contrabandista, Marujo Revoltado |
| `planalto_cobreval` | Constructos e soldados | Golem de Cobre, Guarda de Cobreval, Fornalheiro, Soldado de Luminário |
| `montanhas_pedrasul` | Rocha e capatazes | Lobo-da-Neve, Harpia, Rochedo-Vivo, Capataz da Mina |
| `pantano_brumaterra` | Treva em estado puro | Sapo-Lume, Névoa Viva, Afogado, Mosquito-Cinza |
| `caverna_sombras`, `mina_velha` | Treva subterrânea | Morcego-Treva, Mineiro Louco, Capataz |
| `ilha_veyra` | Guardiões e ecos | Guardião Espectral, Estátua Viva, Eco de Cativo |

---

## 9. Variações de NPCs por flag

| NPC | Condição | Diferença |
|---|---|---|
| `sael` | `lealdade = rebelde` | Acolhe o herói; senão, desconfia |
| `marta` | `lealdade = fiel` no portão (Ato 4) | Tenta prendê-lo e hesita; senão, o deixa fugir sem falar |
| `garo` | `garo_carga_vista` | Fica nervoso e muda as ofertas |
| `brasca` | `brasca_poupado` | Aparece no Porto como aliado; senão, só é lembrado |
| `dagan` | `dagan_aliado` | Se une no Ato 5; senão, é hostil |
| `iris` | `iris_traicao_revelada` | Evita o herói; se perdoada, ajuda no Ato 5 |
| `maren`, `olo` | Foram ouvidos | Mandam apoio no Ato 5 e intercedem junto a Dagan; senão, hesitam |
| NPCs corrompidos | `lente_olivia_obtida` | Mostram um brilho dourado e liberam diálogos de verdade |

---

## 10. Final B: A Coroa Vazia

Gatilho: `auren_derrotado`. Sequência:

1. Pergunta "Pegar a coroa?" (Sim/Não). Sim continua. Não faz Orun dizer "Alguém precisa segurar o lume." e repete a pergunta.
2. Coroação na praça; o povo canta (D15).
3. Epílogo por flags:
   - `maren_ouvida` / `olo_ouvido`: tratados de paz; senão, tensão nas fronteiras.
   - `relojoeiro_resolvido`: o relógio de Cobre-Alto é reconstruído.
   - `dagan_aliado`: Dagan ao lado do herói, desconfiado; senão, parte para o norte reunindo exércitos.
   - `iris_perdoada`: Íris serve como informante; senão, é exilada.
   - `brasca_poupado`: Brasca é almirante da nova frota.
   - `olivia_lider_santuario`: reforma da igreja.
4. Cena final: na Câmara do Lume o herói olha o Medalhão e se pergunta por quanto tempo resistirá.
5. Pós-créditos: Sael, no Refúgio, olha a coroa de longe e diz "Veremos quanto tempo".

---

## 11. Diálogos-chave (15, no limite exato de 28 × 3)

### D01 — Rei Auren (convocação, `castelo_real`, Ato 1)
```
Herói de Luminário,
os poços de Alvorada
escurecem. É a Treva.
---
Vá à Caverna das Sombras
e traga paz ao meu povo.
---
Leve este Medalhão.
Ele guardará você.
```

### D02 — Mestre Tavo (treino, `alvorada`, Ato 1)
```
Postura, [NOME]! Espada
firme, queixo erguido.
Assim se serve ao Rei!
---
Um dia você será mais
forte que eu. Hoje ainda
tropeça na galinha.
```

### D03 — Sael (aviso, `bosque_brasa`, Ato 1)
```
Você serve a um ladrão.
Pergunte ao Rei o que
há sob a caverna.
---
Você não vai ouvir. Eu
sei. Treinaram bem você.
```

### D04 — Ulan (ao morrer, `caverna_sombras`, Ato 1)
```
...Aneth?
---
Perdoe... não pude
guardar a porta...
```

### D05 — Garo (`porto_sol`, Ato 2)
```
Cargas especiais? Mão de
obra contratada, herói.
Tudo dentro da lei.
---
As correntes? Costume
do ofício. Só isso.
```

### D06 — Almirante Brasca (`gruta_costa`, Ato 2; depois: escolha Poupar / Executar)
```
Eu só abro as jaulas que
o seu Rei fecha.
Mate-me, se tiver coragem.
```

### D07 — Irmã Olívia (`santuario_luz`, Ato 2)
```
Não confie na luz que
só brilha para os ricos.
---
Pergunte aos que vivem
nos porões, filho.
```

### D08 — Regente Olo (`vau_cinza`, Ato 3; depois: escolha Ouvir / Ignorar)
```
Nós não criamos a Treva.
Ela desce dos rios que
o seu Rei suja.
---
Ouça-me, só uma vez.
```

### D09 — Velho Orun (`cabana_orun`, Ato 3)
```
O que você matou na
caverna tinha nome.
Ulan guardava a porta.
```

### D10 — Rei Daros (`cobre_alto`, Ato 3, antes da luta)
```
Você abriu o meu portão!
Eu recebi você como
filho de um aliado!
```

### D11 — Mestre Tavo (morrendo, `castelo_real`, Ato 4)
```
[NOME]... a prova está
no meu alforje. Não
confie em Vael.
---
Não foi um monstro.
Foi só conveniência,
e todos obedeceram.
```

### D12 — Rei Auren (confronto, `castelo_real`, Ato 4)
```
Eu chorei por Tavo, sim.
Mas Vael me é útil. O
reino não pode parar.
---
Era só mais um inverno,
filho. Só mais um.
```

### D13 — Sael (origem, `refugio_raizes`, Ato 4)
```
Esse Medalhão era de
Aneth, sua mãe. Ela era
guardiã do Templo.
---
Você é Veyra, [NOME].
Seu povo ainda existe.
```

### D14 — Rei Auren (derrotado, `camara_lume`, Ato 5)
```
O lume me devorou, filho.
Você resiste. Eu nunca
soube resistir.
---
Não deixe que ele caia
em mãos piores que as
minhas.
```

### D15 — Narrador (coroação, `castelo_real`, final B)
```
O povo ergue a voz:
"Longa vida ao Rei!"
---
O Medalhão pesa no
peito. Por quanto tempo
você resistirá?
```

---

## 12. Notas para implementação

- **Sem party:** Tavo e Íris são NPCs que mudam de lugar a cada ato; as cenas de "companhia" são roteirizadas.
- **Estalagens e sonhos:** 5 sonhos, ativados ao descansar: Alvorada (1), Porto do Sol (2), Rochedo ou Vau-Cinza (3), Refúgio (4), Porto do Sol (5).
- **Escolhas sim/não:** poupar Brasca, ouvir Olo, ouvir Maren, perdoar Íris, aceitar a coroa.
- **O brinde:** o culpado é sorteado no início da missão (`brinde_culpado`); o resultado é salvo no `localStorage` e as pistas mudam conforme o sorteio.
- **Ponte destruída:** depois de `ponte_destruida`, `planalto_cobreval` e `cobre_alto` ficam fechados, salvo pelas ruínas logo após a luta com Daros.
- **Cortes se o escopo estourar:** ver a seção 11 de `narrativa.md`.
