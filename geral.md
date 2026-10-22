# Diretrizes Gerais e Arquitetura do Projeto: Lenda de Luminário

> **Documento de Referência Absoluta (Fonte da Verdade)**  
> Este documento define a visão, arquitetura, regras invioláveis, decisões de design, problemas conhecidos e roadmap de **Lenda de Luminário**.  
> Todo agente ou desenvolvedor **DEVE** seguir rigorosamente as diretrizes aqui documentadas.

---

## 1. Protocolo de Operação

1. **Leitura Obrigatória Prévia**: Todo agente deve ler este arquivo antes de iniciar qualquer trabalho.
2. **Fluxo de Trabalho (Uma Etapa por Vez)**:
   - O agente **sempre entrega um plano antes de alterar código** e aguarda aprovação do usuário.
   - Etapas que mexem no mesmo núcleo (`MapScene`, `tiles`, `menu`, `config`) são executadas sequencialmente.
   - Ao final de cada etapa: entregar roteiro manual de teste + passar em `npm test`, `npm run typecheck` e `npm run build` + atualizar o estado e problemas conhecidos neste arquivo (mantendo-o enxuto).
3. **Segregação de Documentos**:
   - `geral.md`: arquitetura, regras, decisões técnicas, problemas conhecidos e estado do projeto.
   - `narrativa.md`: bíblia completa da história, lore, facções e 5 atos.
   - `resumo-para-jogo.md`: tabela técnica de locais, personagens, flags, lealdade e os 15 diálogos-chave (`28 × 3`).
   - `balanceamento.md`: curvas de XP, tabelas de atributos, preços e fórmulas matemáticas (quando criado).

---

## 2. Visão Geral e Decisões de Design

- **Título**: Lenda de Luminário (provisório)
- **Objetivo**: RPG 2D em pixel art com as mecânicas do primeiro *Dragon Quest* (exploração em grade, cidades, masmorras, batalhas por turnos), com mundo, personagens e história 100% originais (tom político de moral cinzenta inspirado em *Final Fantasy Tactics*).
- **Visual**: Hoje em estilo NES (`256×224`, tiles `16×16`). A meta futura é chegar próximo ao remaster de *Dragon Quest I* (SNES), com tiles mais detalhados e litoral com borda — por isso resolução, tamanho de tile e arte ficam centralizados em `config.ts` e atrás de `IAssetLoader`.
- **Herói e Grupo**: Herói silencioso cujo nome (`[NOME]`, máx. 8 caracteres) é escolhido pelo jogador. Jogo **solo** (sem sistema de grupo/party); aliados como Mestre Tavo e Íris são NPCs fixos por ato.
- **Caixa de Diálogo**: Confirmada em **28 caracteres por linha e 3 linhas por página** (`src/engine/DialogueBox.ts`). Páginas separadas por `---` ou `\n\n`.
- **Cidades Vivas e Animais**: Cidades terão de 12 a 20 NPCs (alguns errantes), falas variáveis por flag, segredos em barris/vasos/estantes e catálogo de loja próprio. Animais aparecem nas cidades como NPCs errantes com fala curta, e no mundo como inimigos selvagens por bioma.
- **Escadas**: Disparam ao pisar (`stairsMode: 'auto'` em `config.ts`), mantendo suporte para troca pelo comando `ESCADAS` no menu (`'command'`).
- **Batalha**: Visão frontal estilo *Dragon Quest I*, com módulo reutilizável de efeitos (`tweens` com easing, tremor de tela, flash, *hit-stop*), animações descritas em dados, velocidade configurável e animações puláveis. Arte dos monstros será em **PNGs externos** com paleta consistente (via `IAssetLoader`), em vez de matrizes em código.

---

## 3. Stack Tecnológica

| Componente | Tecnologia | Papel |
|---|---|---|
| **Linguagem** | TypeScript 7 (Strict Mode) | Tipagem estática rigorosa para entidades, mapas, eventos e dados |
| **Bundler / Dev Server** | Vite 8 | Servidor de desenvolvimento e build de produção |
| **Testes Automatizados** | Vitest 5 | Validação de mapas, warps, alcançabilidade (BFS) e glifos da fonte |
| **Renderização** | HTML5 Canvas 2D puro | Sem frameworks de jogo; loop de timestep fixo a 60 Hz e pilha de cenas |
| **Formato de Mapas** | Tiled JSON 1.10+ | Mapas em `src/data/maps/*.json` registrados automaticamente via `import.meta.glob` |
| **Gerador de Overworld** | Node.js script (`.mjs`) | Gera **apenas** o `overworld.json` (seed fixa); nunca sobrescreve os demais mapas |
| **Assets Gráficos** | `IAssetLoader` | Abstrai matrizes procedurais atuais e futuros spritesheets/PNGs |

---

## 4. Estrutura de Pastas

```text
jogo/
├── index.html                           # Canvas #game
├── package.json                         # Scripts: dev, build, typecheck, test, validate:maps
├── geral.md                             # ESTE DOCUMENTO (Fonte da Verdade)
├── narrativa.md                         # Bíblia da narrativa (5 atos, lore, personagens)
├── resumo-para-jogo.md                  # Especificação narrativa técnica (flags, locais, diálogos 28x3)
├── balanceamento.md                     # Tabelas de atributos, equipamentos, monstros e fórmulas (futuro)
├── scripts/
│   └── generate_game_maps.mjs           # Gerador exclusivo do overworld.json
├── test/
│   ├── map-validation.test.ts           # Validador de warps, reciprocidade, tiles e BFS
│   └── font-glyphs.test.ts              # Validador de cobertura de glifos 8x8 em textos
├── dragon-warrior-info-master/          # Referência de estudo (NADA daqui entra no jogo)
└── src/
    ├── main.ts                          # Bootstrap do jogo
    ├── config.ts                        # Resolução, tamanho de tile, controles, tempos e seed
    ├── assets/                          # AssetManager.ts, fontGraphics, heroGraphics, npcGraphics, tileGraphics
    ├── data/
    │   ├── tiles.ts                     # Catálogo de tiles por id de string (TILE_DEFS_BY_ID)
    │   └── maps/                        # index.ts + 13 arquivos .json (overworld, castelo, cidades, caverna, santuário)
    ├── engine/                          # Game, Renderer, Input, Camera, Scene, SceneManager, TiledMap, DialogueBox, BitmapFont, Palette
    ├── entities/                        # Player.ts, NPC.ts
    └── scenes/                          # TitleScene, MapScene, MenuScene, WorldMapScene, BattleScene
```

---

## 5. Regras Arquiteturais Invioláveis

1. **Conteúdo 100% Original**: Nenhum nome, monstro, tabela, diálogo ou gráfico do *Dragon Warrior/Quest* original entra no projeto. A pasta `dragon-warrior-info-master` é **exclusivamente referência de estudo**. O monstro inicial chama-se **Gosma-Cinza**.
2. **Warps por ID Semântico**: Formato estrito `target: "id_do_mapa:nome_do_warp"`, com reciprocidade obrigatória e tile de chegada não-sólido, validados por `test/map-validation.test.ts`.
3. **Escopo Restrito do Gerador de Mapas**: `scripts/generate_game_maps.mjs` gera **exclusivamente o `overworld.json`** (com seed fixa em `config.ts`). Todos os demais mapas são editados diretamente em JSON/Tiled e o script **nunca deve sobrescrevê-los**.
4. **Resolução e Tamanho de Tile em `config.ts`**: Resolução (`256×224`) e tamanho de tile (`16×16`) vêm de `src/config.ts`, sem números mágicos espalhados pelo código, e só mudam com aprovação explícita do usuário.
5. **Tiles por ID de String**: No código, todo tile é referenciado por ID semântico (`grass`, `water`, `wall`, etc.), nunca por número mágico de GID.
6. **Cobertura de Glifos da Fonte**: Todo caractere usado no código ou JSON deve existir em `src/assets/fontGraphics.ts` (validado por `test/font-glyphs.test.ts`).
7. **Assets atrás de `IAssetLoader`**: Cenas e entidades consomem gráficos apenas via `AssetManager`.
8. **Idioma**: Respostas, textos de jogo e documentação sempre em **português do Brasil**.

---

## 6. Problemas Conhecidos (Pendentes de Correção no Código)

1. **Persistência e Áudio pendentes**: Sem save/load em `localStorage`; sem motor de áudio chiptune.

---

## 7. Roadmap e Ordem Recomendada

1. **Narrativa e Documentação Base** — ✅ **Concluída**
   - `geral.md`, `narrativa.md` e `resumo-para-jogo.md` alinhados e posicionados na raiz do projeto.
2. **Correções de Mapa (Sub-etapas 2A, 2B, 2C e 2D)** — ✅ **Concluída**
   - ✅ **2A**: Câmera alinhada à grade (sem meio tile cortado e com interiores centralizados no fundo preto), `worldSeed` em `config.ts`, florestas andáveis (`solid: false`) com `encounterRate: 0.12`, sprite `village_entrance` redesenhado e entradas do `overworld.json` visíveis e validadas por teste.
   - ✅ **2B**: `generate_game_maps.mjs` isolado exclusivamente para `overworld.json`, continente com costa irregular orgânica e praias, Castelo Real em miniatura `3×2` estilo *Dragon Quest* (torres com bandeiras e portão único na grama), Bosque de Brasa transitável e `WorldMapScene` (tecla `M`) renderizando a matriz real de `overworld.json` em escala 2×2 px.
   - ✅ **2C / 2D**: `castelo.json` expandido para complexo monumental `38×36` em 5 zonas (Pátio Real estilo *FF6 Figaro*, Grande Átrio com colunata estilo *DQ6*, Ala Oeste com Câmara do Conselho dos Cinco completo e Salão de Banquetes, Ala Leste com Biblioteca Real, Quarto do Herói e acesso ao subsolo, e Salão do Trono em dois patamares), alto contraste entre muralhas de pedra escura (`wall`) e lajotas claras do piso (`castle_floor`), e Baú de Ulan em `caverna_b2.json`.
3. **Inventário, Equipamento, Loja e Estalagem** — ✅ **Concluída**
   - Estado do Herói (`src/state/GameState.ts`) com ouro, nível, PV/PM, atributos, equipamentos e mochila de itens.
   - Catálogo original em JSON (`src/data/items.json` e `src/data/items.ts`); menus `STATUS` e `ITENS` interativos em `MenuScene.ts` para usar consumíveis, equipar/desequipar armas/armaduras/escudos/acessórios e inspecionar itens-chave.
   - Baús do mapa integrados ao `GameState` entregando ouro e itens reais.
   - Cenas `ShopScene.ts` (compra/venda com ouro real) e `InnScene.ts` (pernoite pago com fade e restauração de PV/PM) integradas à `MapScene.ts`.
4. **Sistema de Flags, Eventos e Nome do Herói** — ✅ **Concluída**
   - Gerenciador tipado de flags (`src/state/StoryFlags.ts`) com `duvida_pontos`, cálculo automático de `lealdade` (`'fiel' | 'duvida' | 'rebelde'`), `dagan_aliado` e sorteio de `brinde_culpado`.
   - Tela de escolha do nome do herói (`src/scenes/NameEntryScene.ts`, até 8 caracteres) integrada ao `NOVO JOGO` da `TitleScene.ts`, interpolação automática de `[NOME]` e suporte ao separador `---` na `DialogueBox.ts`.
   - Condições de aparição e variação de falas de NPCs e baús por flag (`showIfFlag`, `hideIfFlag`, `setFlagOnTalk`, `altFlag`, `altDialogue`, `setFlagOnOpen`) e gatilho do Sonho 1 na Estalagem.
5. **Batalha, Balanceamento e Monstros Originais** — ✅ **Concluída**
   - Documento `balanceamento.md` (curvas níveis 1-15, fórmulas com variação e crítico, catálogo do Ato 1).
   - Catálogo de monstros originais (`src/data/monsters.json` e `monsters.ts`) com 9 monstros do Ato 1, magias e drops.
   - Matrizes procedurais de monstros em `src/assets/monsterGraphics.ts` e suporte em `AssetManager.ts`.
   - Módulo de efeitos `BattleEffects.ts` (tremor de tela, flash de impacto no monstro, hit-stop, textos flutuantes de dano).
   - Cena de combate frontal completa (`BattleScene.ts`) com comandos Atacar/Magia/Itens/Fugir, EXP/Ouro, subida de nível, derrotas com penalidade e respawn no trono real.
   - Encontros aleatórios disparados por passo nos terrenos com taxa de encontro no overworld e cavernas (cidades, castelos e interiores são zonas seguras `isSafe = true`; montanhas são caminháveis com taxa de encontro própria; lojas exibem `[E]` e impedem venda de itens equipados).
6. **Fatia Vertical do Ato 1 Completo** — ✅ **Concluída**
   - Integração ponta a ponta do Ato 1: convocação do Rei Auren, Vila de Alvorada (treino de Mestre Tavo D02, Íris, missão do poço de Dona Bina contra Gosma-Cinza, Sonho 1 na estalagem), encontro com Sael na clareira do Bosque de Brasa (D03), Caverna das Sombras (marcas de picareta em B1, Baú de Ulan e chefe `Ulan, a Fera` em B2 com D04 e entrega da `Pulseira Antiga`), retorno ao Castelo Real, Banquete da Aliança com Rei Daros e Príncipe Dagan, investigação e resolução da missão "O Brinde" (Copeiro Real + confronto com o conselheiro culpado), patrocínio de Lorde Vael e entrega do `Selo Real` (`ato1_concluido = true`).
7. **Expansão do Mundo (Atos 2 a 5)** — ✅ **Concluída**
   - ✅ **7A**: `DialogueBox.startWithChoice` para escolhas morais, catálogo de itens-chave/equipamentos/lojas dos Atos 2–5 (`items.json`), monstros regionais e os 5 chefes (`Brasca`, `Daros`, `Dagan`, `Vael`, `Auren`) + magia `Eco` (`monsters.json` e `monsterGraphics.ts`), e 9 novos mapas Tiled JSON conectados ao `overworld.json` (totalizando 22 mapas).
   - ✅ **7B (Ato 2)**: Porto do Sol (`cidade_2.json`), missão "A carga perdida" de Garo (D05), Gruta da Costa (`gruta_costa.json`) com duelo contra Almirante Brasca (D06) e escolha moral (`Poupar / Executar`), Santuário da Luz (`santuario.json`) com Sumo Sacerdote Hesper e Irmã Olívia (D07), e Sonhos 1 a 5 na Estalagem (`InnScene.ts`).
   - ✅ **7C (Ato 3)**: Vau-Cinza (`vau_cinza.json`) com Regente Olo (D08) e missão "As águas de Vau-Cinza", Cabana de Orun (`cabana_orun.json`) com revelação de Ulan (D09), Rochedo (`rochedo.json`) com Rainha Maren, Carta de Vael e missão "O pão das pedras" na Mina Velha (`mina_velha.json`), e Fortaleza de Cobre-Alto (`cobre_alto.json`) com missão missable "O relojoeiro" (Seu Tomé) e chefe Rei Daros (D10 + queda da Ponte de Cobre).
   - ✅ **7D (Ato 4)**: Emboscada de Mestre Tavo (D11), proteção de Vael pelo Rei Auren (D12, `lealdade = 'rebelde'`), ajuda da Capitã Marta, revelação de Sael (D13) e entrega da `Pedra do Eco` + magia `Eco` por Orun no Refúgio das Raízes (`refugio_raizes.json`), aliança ou duelo com Príncipe Dagan em Rochedo, `Lente da Verdade` de Irmã Olívia e chefe Lorde Vael na Cripta do Refino (`cripta_refino.json`) com escolha sobre Íris (`Perdoar Íris / Exilar Íris`).
   - ✅ **7E (Ato 5 + Final B)**: Travessia marítima para a Ilha Veyra, Templo do Coração (`templo_coracao.json`) com mural de Aneth e `Selo de Veyra`, Diário de Auren e confronto final na Câmara do Lume (`castelo_subsolo.json`) contra Rei Auren (D14), loop da escolha final `"Pegar a coroa?"` (`Sim / Não`), **Final B — A Coroa Vazia** (D15), epílogo reativo às 6 escolhas do jogador e cena pós-créditos de Sael.
8. **Abertura em 8-bit, Save/Load e Progressão Geográfica Guiada** — ✅ **Concluída**
   - Cutscene de abertura animada em 8-bit (`IntroScene.ts`) em 4 atos ilustrados proceduralmente (A Grande Treva, O Lume Real, O Medalhão Antigo, O Chamado do Rei), levando diretamente ao Salão do Trono (`castelo`, tile `18, 6`) com diálogo imediato do Rei Auren.
   - Sistema completo de Save/Load em `localStorage` (`GameState.saveGame()`, `loadGame()`, `hasSaveData()`) integrado à opção `CONTINUAR` na tela de título (`TitleScene.ts`), ao comando `SALVAR` no menu principal (`MenuScene.ts`) e com auto-save ao descansar na Estalagem (`InnScene.ts`) ou falar com o Rei Auren.
   - Diferenciação estilo *Dragon Quest I* entre colinas marrons caminháveis (`mountain`, `solid: false`, `encounterRate: 0.08`) e **Cordilheiras Cinzas intransponíveis (`high_mountain`, `solid: true`, `encounterRate: 0`, GID 43, desenhadas sobre fundo de grama verde como as árvores e montanhas marrons)** + rios sinuosos e pontes/passos de montanha em um **Overworld expandido para `128×128` tiles** (4× a área anterior) com silhueta continental orgânica (penínsulas, golfos, enseadas e arquipélago austral).
9. **Sistema de Áudio 8-Bit (BGM e Efeitos Sonoros estilo Square Enix NES)** — ✅ **Concluída**
   - Sintetizador e sequenciador chiptune puro em Web Audio API (`src/engine/AudioManager.ts`) com 3 canais (ondas quadradas `square` para melodia/harmonia, onda triangular `triangle` para baixo e ruído LFSR para percussão e impactos).
   - 8 trilhas musicais (`BGM`) em loop contínuo: `title` (Prelúdio de Luminário em arpejos estilo Cristal), `overworld` (Marcha de Luminário), `castle` (Corte de Luminário), `town` (Brisa da Vila), `cave` (Ecos da Sombra), `shrine` (Santuário e Lenda), `battle` (Lâmina em Guarda) e `boss` (Fúria da Sombra).
   - 17 efeitos sonoros (`SFX`) e fanfarras clássicas integrados a todas as cenas: `level_up` (fanfarra ao subir de nível), `victory` (fanfarra ao vencer batalhas), `defeat` (jingle fúnebre ao ser derrotado), `chest` (fanfarra ao abrir um baú), `inn` (acalanto ao dormir na estalagem), `encounter`, `attack`, `crit`, `hit`, `magic`, `heal`, `coins`, `stairs`, `cursor`, `confirm`, `cancel` e `error`.

---

## 8. Estado Atual das Funcionalidades

- [x] Engine base (Canvas 2D, 60 Hz Fixed Timestep, Input, Pilha de Cenas, Fonte Bitmap 8×8 acentuada).
- [x] Câmera alinhada à grade 16×16 (sem meio tile cortado nas bordas) e centralização de mapas menores que a tela com fundo preto.
- [x] 22 mapas Tiled JSON conectados por warps semânticos e validados por testes (warps, chegada andável, BFS, entradas visíveis).
- [x] Overworld expandido (`128×128`) com silhueta continental orgânica (penínsulas, golfos, enseadas e arquipélago austral), colinas marrons transitáveis (`mountain`) e cordilheiras cinzas intransponíveis (`high_mountain` sobre fundo de grama) estilo *Dragon Quest I*, rios sinuosos e pontes que isolam os Atos 1–5 sem spoilers prematuros, e mapa da tecla `M` (`WorldMapScene`) em alta resolução (`128×128` px).
- [x] Castelo Real monumental (`38×36`, 5 zonas inspiradas em *FF6* e *DQ*, Conselho dos Cinco completo, Biblioteca, Quarto do Herói, Salão de Banquetes e Salão do Trono em patamares) e Baú de Ulan na Caverna B2.
- [x] Cidades, castelos e interiores protegidos contra encontros aleatórios (`isSafe = true`).
- [x] Herói em grade com 4 direções e colisão; 5 classes visuais de NPCs que viram ao falar; interação por balcão; placas e baús que abrem.
- [x] Caixa de diálogo `28 × 3` com máquina de escrever, paginação por `---` e `\n\n`, interpolação dinâmica de `[NOME]` e menu de escolhas morais (`startWithChoice`).
- [x] Documentação base (`geral.md`, `narrativa.md`, `resumo-para-jogo.md`, `balanceamento.md`) sincronizada e validada.
- [x] Inventário, equipamentos, baús reais, loja de compra/venda (com proteção e ícone `[E]` para itens equipados) e estalagem funcionais (Etapa 3).
- [x] Sistema de flags (`StoryFlags`), escolha de nome (`NameEntryScene`) e diálogos/aparições condicionais de NPCs (Etapa 4).
- [x] Sistema de batalha completo, balanceamento reajustado no Bosque de Brasa, catálogo de monstros originais e encontros por terreno e coordenada geográfica (Etapa 5).
- [x] Fatia vertical completa do Ato 1 (Etapa 6).
- [x] Campanha completa dos Atos 2 a 5 e Final B ("A Coroa Vazia") com epílogo reativo (Etapa 7).
- [x] Cutscene de abertura em 8-bit (`IntroScene.ts`), início guiado no Salão do Trono do Rei Auren, sistema de Save/Load (`localStorage`) e progressão geográfica guiada por montanhas cinzas e rios (Etapa 8).
- [x] Sintetizador de áudio 8-bit chiptune (`AudioManager.ts`) com 8 trilhas musicais estilo Square Enix NES e 17 efeitos sonoros/fanfarras (Etapa 9).



