# Lenda de Luminário — Bíblia de Design Visual de Personagens

> **Documento de Referência de Direção de Arte e Caracterização Visual**  
> Define a identidade visual, silhuetas, paletas de cores (`NES_COLORS` em `src/engine/Palette.ts`), trajes, símbolos de facção, leitura em grade `16×16` e variações por ato para o **Protagonista (`[NOME]`)** e os **12 Personagens Marcantes** de **Lenda de Luminário**.

---

## 1. Diretrizes Gerais de Direção de Arte

### 1.1 Restrições Técnicas e Estética (`16×16` NES → Meta Futura SNES)
- **Grade de Sprite no Mapa:** `16×16` pixels (`CONFIG.screen.tileSize = 16`), com 4 direções (`down`, `up`, `left`, `right`).
  - **Protagonista:** 2 frames de caminhada por direção (total de 8 matrizes em `src/assets/heroGraphics.ts`).
  - **NPCs:** 1 a 2 frames por direção em `src/assets/npcGraphics.ts`.
- **Contorno e Leitura:** Todo sprite usa contorno externo em `BLACK` (`#000000`) de 1 pixel para garantir leitura imediata tanto sobre pisos claros (`castle_floor`, `sand`, `path`) quanto escuros (`cave_floor`, `grass`, `water`).
- **Proporção Chibi Clássica (Estilo *Dragon Quest I–III* / *Final Fantasy Tactics*):**
  - **Linhas 0–6 (7 px de altura):** Cabeça, cabelo, elmo, coroa ou capuz (onde mora 60% do reconhecimento imediato do personagem).
  - **Linhas 7–12 (6 px de altura):** Torso, capa, ombreiras, braços e insígnia/amuleto peitoral.
  - **Linhas 13–15 (3 px de altura):** Bainha da túnica/manto, pernas e botas.
- **Limite de Cores por Sprite:** Entre **3 e 5 cores ativas** (além do contorno `BLACK` e do fundo `transparent`), todas extraídas estritamente de `NES_COLORS` (`src/engine/Palette.ts`).
- **Artes de Batalha (Chefes e Duelos):** Quando um personagem aparece como inimigo ou chefe em `BattleScene` (`ulan_fera`, `brasca`, `daros`, `vael`, `dagan`, `auren`), seu retrato frontal é carregado como PNG externo (`48×48` a `64×64` px para humanos/duelos, até `80×80` px para a forma final de Auren), mantendo a mesma paleta base do sprite de mapa.

---

### 1.2 Semiótica de Cores e Facções (Linguagem Visual do Mundo)

Cada facção possui um vocabulário visual próprio para que o jogador compreenda alianças, classes sociais e tensões políticas apenas batendo o olho na tela:

| Facção / Origem | Cores Dominantes (`NES_COLORS`) | Formas e Silhueta | Símbolo / Motivo Visual |
|---|---|---|---|
| **Coroa e Corte de Luminário** (`auren`, `vael`, `marta`, `herói` no Ato 1) | `RED` (`#d82800`), `BLUE` (`#2038ec`), `GOLD` (`#f8b800`), `WHITE` (`#fcfcfc`) | Simétrica, vertical, imponente; capas retas, ombreiras rígidas, golas altas | **Sol Coroado:** círculo dourado com raios retos (a luz que vem de cima para baixo) |
| **Vila de Alvorada e Povo Comum** (`tavo`, `iris`) | `BROWN` (`#885818`), `LIGHT_BLUE` (`#3cbcfc`), `RED` (`#d82800`), `SAND` (`#e4a050`) | Acolhedora e prática; túnicas de trabalho, couro gasto, aventais e lenços | **Trigo e Alvorada:** costuras simples, tecidos remendados mas limpos |
| **Povo Guardião Veyra e Rebeldes** (`sael`, `orun`, herança do `herói`) | `FOREST_GREEN` (`#007800`), `PALE_GREEN` (`#b8f818`), `CYAN` (`#74dcff`), `DARK_BROWN` (`#503000`) | Orgânica e assimétrica; capuzes, xales diagonais, tranças e mantos de viagem | **Espiral do Coração (Raiz Dupla):** dois arcos entrelaçados que cercam um centro vazio ("guardar sem possuir") |
| **Reino Industrial de Cobreval** (`daros`, `dagan`) | `DIRT` (`#a85000`), `SAND` (`#e4a050`), `DARK_GRAY` (`#444444`), `MED_GRAY` (`#7c7c7c`) | Angular, pesada e geométrica; peitorais rebitados, ombreiras em dente de engrenagem | **Roda Dentada e Ponteiro:** coroa e broches em formato de engrenagem de cobre polido |
| **Igreja da Luz — Ala Honesta vs. Ala Corrupta** (`olivia` vs. `hesper`) | `WHITE` (`#fcfcfc`), `LIGHT_BLUE` (`#3cbcfc`) vs. `GOLD` (`#f8b800`), `DARK_RED` (`#881400`) | Olívia: véu baixo e hábito simples sem ouro. Hesper: mitra vertical alta e estola pesada de ouro | **Chama Branca** (fé original) vs. **Cálice de Lume Dourado** (monopólio da luz benta) |
| **Guilda do Sol / Mercadores** (`garo`) | `FOREST_GREEN` (`#007800`), `GOLD` (`#f8b800`), `DARK_RED` (`#881400`), `DARK_BROWN` (`#503000`) | Arredondada e larga; boina bufante, casaco forrado e bolsa de moedas presa ao cinto | **Balança Solar:** moeda dourada sobre veludo verde |

---

### 1.3 O Lume, a Treva e a Lente de Olívia (Feedback Visual de Corrupção)
- **Lume Puro / Refinado:** Representado sempre pelo par `GOLD` (`#f8b800`) + `YELLOW` (`#f8d878`). Nos personagens que abusam do minério (`auren`, `vael`, `hesper`), o dourado deixa de ser apenas adorno da roupa e passa a dominar a silhueta.
- **Magia do Eco (Veyra):** Representada pelo par `CYAN` (`#74dcff`) + `LIGHT_BLUE` (`#3cbcfc`) — uma luz fria, serena e translúcida, em contraste direto com o amarelo-quente opressivo do lume real.
- **Efeito da Lente de Olívia (`lente_olivia`, Ato 4):** Quando o jogador possui a Lente ativa, NPCs contaminados pelo contato direto com o tráfico ou refino de lume (`vael`, `hesper`, `garo`, `brenn`) exibem um **halo/pulsação de pixels `GOLD` (`#f8b800`) e `YELLOW` (`#f8d878`) nos olhos e no contorno do peito**, denunciando visualmente quem lucra com a Treva.

---

## 2. O Protagonista: `[NOME]` (O Filho de Aneth)

### 2.1 Identidade e Conceito Visual
- **ID no Sistema:** `player` / `[NOME]` (escolhido pelo jogador, máx. 8 caracteres)
- **Sprite Fonte:** `src/assets/heroGraphics.ts` (`HERO_RAW_DATA`)
- **Idade Aparente:** 17–18 anos (salvo ainda bebê na Queda de Vale-Veyra, em `A.-17`).
- **Conceito Central ("O Filho de Dois Mundos"):** Visualmente, o protagonista começa o jogo parecendo o arquétipo perfeito do "Campeão Real de Luminário" — túnica azul-real impecável, capa vermelha curta da guarda de elite do Rei Auren e postura disciplinada ensinada por Mestre Tavo. Contudo, dois elementos da sua própria aparência guardam o segredo da sua origem Veyra desde o primeiro segundo de jogo:
  1. **Os cabelos dourado-claros (`GOLD` / `YELLOW`):** Em Luminário, todos acreditam que seus cabelos claros são uma "bênção solar", mas na verdade são o traço genético das antigas guardiãs da Ilha Veyra (como sua mãe, Aneth).
  2. **O Medalhão de Alvorada no peito (`LIGHT_BLUE` / `CYAN` engastado em `GOLD`):** Entregue por Auren no início do Ato 1 como se fosse uma joia real, o centro azul-ciano do amuleto no peito do sprite já destoa do vermelho/ouro da Coroa e antecipa a cor da magia **Eco**.

### 2.2 Anatomia, Trajes e Equipamentos Icônicos
- **Cabeça e Rosto:** Cabelos curtos e levemente desalinhados na testa (franja dividida ao centro em `GOLD` `#f8b800` com topo iluminado em `YELLOW` `#f8d878`, sem elmo pesado para manter a expressividade jovem e vulnerável). Olhos escuros e atentos (`BLACK` sobre `SKIN` `#fca044`).
- **Torso (Túnica de Alvorada):** Túnica de combate azul-real (`BLUE` `#2038ec`) ajustada ao corpo, com faixa peitoral e insígnia central em azul-celeste/ciano (`LIGHT_BLUE` `#3cbcfc`) representando o **Medalhão de Alvorada** pendurado sobre o esterno.
- **Capa Curta Carmesim:** Capa de lã vermelha (`RED` `#d82800`) presa nos ombros por fivelas escuras. Vista de frente (`down`), aparece nas laterais dos ombros e braços; vista de costas (`up`), cobre o dorso inteiro, criando um contraste vibrante entre o cabelo dourado, a capa vermelha e o chão do mapa.
- **Armas e Perfil (`left` / `right`):** Nas vistas laterais, empunha a **Espada de Alvorada** (ou escudo/punho de aço em `WHITE` `#fcfcfc` e `LIGHT_BLUE` `#3cbcfc` à frente do corpo), com botas de marcha em couro marrom-escuro (`DARK_BROWN` `#503000`).
- **Animação de Caminhada / Marcha em 2 Frames:**
  - *Frente e Costas (`down` e `up`):* As colunas das pernas permanecem estritamente ancoradas (perna esquerda em x=3..6, perna direita em x=9..12). O Frame 0 estende a ponta da bota esquerda à frente com o pé direito apoiado; o Frame 1 estende a ponta da bota direita com o pé esquerdo apoiado. Isso elimina qualquer tremelique horizontal ou espasmo em apenas um dos pés.
  - *Perfis Laterais (`left` e `right`):* Alternância clássica entre **Passo Aberto** (Frame 0: perna dianteira estendida na direção da marcha, perna traseira estendida em impulsão) e **Passo Fechado** (Frame 1: pernas de passagem alinhadas verticalmente no centro sob o tronco). Elimina o antigo efeito de "deslizar ambos os pés juntos".

### 2.3 Paleta NES Exata (`HERO_PALETTE`)

| Código na Matriz | Constante `NES_COLORS` | Hex | Aplicação no Sprite `16×16` |
|---|---|---|---|
| `k` | `BLACK` | `#000000` | Contorno externo, olhos e divisões de armadura/botas |
| `g` | `GOLD` | `#f8b800` | Base do cabelo Veyra, aro do Medalhão e guarda da espada |
| `y` | `YELLOW` | `#f8d878` | Brilho superior do cabelo (luz no topo da cabeça) |
| `s` | `SKIN` | `#fca044` | Rosto, pescoço e mãos |
| `b` | `BLUE` | `#2038ec` | Túnica principal de Luminário e calças |
| `c` | `LIGHT_BLUE` | `#3cbcfc` | Brilho central no peito (**Medalhão de Alvorada** / Eco) e detalhes da armadura |
| `r` | `RED` | `#d82800` | Capa real nas costas e ombreiras/mangas |
| `w` | `WHITE` | `#fcfcfc` | Lâmina da Espada de Alvorada / reflexo metálico lateral |
| `t` | `DARK_BROWN` | `#503000` | Botas de viagem, bainha e cinto nucal da capa |

### 2.4 Evolução Visual por Ato (Roteiro de Estados do Herói)

| Fase da Jornada | Estado / Flag | Mudança Visual (Retrato / Descrição / Sprite Opcional) |
|---|---|---|
| **Atos 1 e 2** | `lealdade = 'fiel'` | Visual clássico intacto: capa vermelha limpa de Luminário, túnica azul vibrante, postura de soldado orgulhoso da Coroa. |
| **Ato 3** | `lealdade = 'duvida'` | A **Pulseira de Ulan** (couro marrom com fio ciano) passa a envolver o punho esquerdo; a barra da capa vermelha ganha marcas de cinza após a queda de Cobre-Alto. |
| **Ato 4** | `lealdade = 'rebelde'` (`rei_protegeu_vael`) | Após a morte de Tavo, o herói arranca o fecho dourado da Coroa: a capa vermelha pode dar lugar ao xale verde-musgo Veyra (`FOREST_GREEN`) ou manter-se rasgada, enquanto o centro do peito brilha mais forte com a **Pedra do Eco** (`CYAN` `#74dcff`). |
| **Ato 5 e Epílogo** | `selo_veyra_obtido` / `final_b_coroa_vazia` | Com o **Selo de Veyra**, uma marca sutil em `CYAN` e `GOLD` repousa no peito. Na cena da coroação ("A Coroa Vazia"), recebe o aro dourado da Coroa sobre os cabelos claros, fundindo a silhueta do Rei Auren com o azul/ciano dos guardiões Veyra. |

---

## 3. Os 12 Personagens Marcantes

---

### 3.1 Rei Auren (`auren`) — O Salvador Coroado de Lume

- **ID Narrativo:** `auren` | **Sprite ID Atual:** `npc_king` (futuro dedicado: `npc_auren`)
- **Papel:** Pai adotivo do herói, soberano de Luminário e antagonista trágico (Chefe Final na Câmara do Lume).
- **Onde Aparece:** Castelo Real — Salão do Trono (Atos 1, 3, 4); Câmara do Lume (Ato 5).
- **Idade e Biotipo:** ~58 anos. Alto, ombros largos mas levemente curvados pelo peso de quatro décadas de reinado desde o Inverno de Cinzas (`A.-40`). Rosto grave, olhos fundos e expressão paterna calorosa que esconde exaustão e paranoia.
- **Trajes e Símbolos:**
  - **A Coroa de Lume:** Coroa alta de três pontas forjada em ouro puro e lume bruto (`GOLD` `#f8b800` e `YELLOW` `#f8d878`). Não é apenas joia: ela amplifica constantemente o medo de Auren de um novo inverno.
  - **Barba e Cabelos Brancos (`WHITE` `#fcfcfc`):** Longa barba branca que desce até o peito, conferindo-lhe a aparência de um patriarca sábio e benevolente (inspirado nos reis clássicos de *Dragon Quest*, subvertendo a expectativa do jogador).
  - **Manto Real Carmesim e Estola Solar:** Manto pesado em `RED` (`#d82800`) com bordados verticais em `GOLD` (`#f8b800`) que descem dos ombros até a bainha, e botas em couro escuro (`DARK_BROWN` `#503000`).
- **Leitura no Sprite `16×16` (`npc_king`):**
  - Topo (linhas 0–2): Coroa dourada larga (`y` / `g`) ocupando 8 a 10 pixels de largura — a silhueta de cabeça mais imponente do jogo.
  - Rosto (linhas 2–5): Cabelo e barba brancos (`w`) emoldurando o rosto (`s`).
  - Corpo (linhas 6–13): Manto vermelho amplo (`r`, 12 px de largura) cortado por duas faixas verticais douradas (`y`) e cinto real no centro.
- **Transformação em Batalha (Ato 5 — *Rei Auren, o Coroado de Lume*):**
  - **Fase 1 (O Pai Rei):** Luta de espada real em punho, manto vermelho esvoaçante, postura triste e solene ("O reino não pode parar").
  - **Fase 2 (Devorado pelo Lume):** As veias da Câmara do Lume conectam-se ao seu manto; a barba branca tinge-se de reflexos dourados incandescentes (`YELLOW` / `GOLD`), os olhos brilham em ouro puro sem pupila e a sombra ao seu redor torna-se cinza-escura (`DARK_GRAY` / Treva).

| Elemento | Cor `NES_COLORS` | Hex | Significado Visual |
|---|---|---|---|
| Coroa e Estola Real | `GOLD` / `YELLOW` | `#f8b800` / `#f8d878` | Riqueza do lume e obsessão pelo controle |
| Cabelos e Barba | `WHITE` | `#fcfcfc` | Aparência paterna, idade e sabedoria aparente |
| Manto Real | `RED` / `DARK_RED` | `#d82800` / `#881400` | Sangue da Guerra das Veias sob a pompa da Coroa |
| Botas | `DARK_BROWN` | `#503000` | Base terrena e rígida |

---

### 3.2 Mestre Tavo (`tavo`) — O Veterano de Alvorada

- **ID Narrativo:** `tavo` | **Sprite ID Atual:** `npc_guard` / `npc_elder` (dedicado: `npc_tavo`)
- **Papel:** Mentor de esgrima do herói, figura paterna cotidiana e investigador leal que descobre a verdade sobre os cativos (assassinado por Vael no Ato 4).
- **Onde Aparece:** Vila de Alvorada e Castelo Real (Ato 1); Taverna do Porto do Sol (Ato 2); Rochedo (Ato 3); Castelo Real (Ato 4, onde morre nos braços do herói).
- **Idade e Biotipo:** ~52 anos. Tronco forte de ex-soldado de linha de frente, estatura média, queixo quadrado com barba curta grisalha ("sal e pimenta") e uma pequena cicatriz na sobrancelha esquerda.
- **Trajes e Símbolos:**
  - **Meia-Armadura de Instrutor:** Não usa o elmo fechado dos guardas comuns; tem a cabeça descoberta com cabelos grisalhos curtos (`LIGHT_GRAY` `#bcbcbc` e `MED_GRAY` `#7c7c7c`), mostrando o rosto franco e bem-humorado.
  - **Ombreira Única de Aço e Surcote Azul-Desbotado:** Veste um gibão de couro marrom (`BROWN` `#885818` / `DARK_BROWN` `#503000`) sob um peitoral de aço gasto (`LIGHT_GRAY` `#bcbcbc`) e um lenço/capa curta azul-petróleo (`DARK_BLUE` `#002888` ou `BLUE` `#2038ec`) — sinal de que já serviu na Guarda Real na juventude, mas aposentou-se na vila.
  - **O Alforje de Couro:** No Ato 2 em diante, carrega a tiracolo o alforje marrom onde guarda as anotações sobre o tráfico de cativos ("a prova está no meu alforje").
- **Leitura no Sprite `16×16` (`npc_tavo`):**
  - Topo (linhas 0–5): Sem capacete; cabeleira grisalha curta (`a` / `m`) e bigode/barba curta grisalha no queixo, diferenciando-o imediatamente dos guardas de elmo (`npc_guard`) e dos anciãos de barba longa branca (`npc_elder`).
  - Torso (linhas 6–12): Peitoral cinza-claro (`a`) com faixa diagonal marrom (`t`, o alforje/boldrié) e ombreiras largas sobre túnica azul (`b`).
  - Pernas (linhas 13–15): Botas pesadas de couro (`t`).

| Elemento | Cor `NES_COLORS` | Hex | Significado Visual |
|---|---|---|---|
| Cabelos e Barba Curta | `LIGHT_GRAY` / `MED_GRAY` | `#bcbcbc` / `#7c7c7c` | Experiência militar e honestidade sem vaidade |
| Peitoral e Espada | `LIGHT_GRAY` | `#bcbcbc` | Disciplina marcial ("Espada firme, queixo erguido") |
| Gibão e Alforje | `DARK_BROWN` / `BROWN` | `#503000` / `#885818` | Raízes humildes em Alvorada e as provas que carrega |
| Túnica Interna | `BLUE` | `#2038ec` | Antiga lealdade sincera a Luminário (espelhada no herói) |

---

### 3.3 Lorde Vael (`vael`) — O Arquiteto da Conveniência

- **ID Narrativo:** `vael` | **Sprite ID Atual:** `npc_elder` (dedicado: `npc_vael`)
- **Papel:** Líder de fato do Conselho dos Cinco, patrono calculista do herói, sequestrador de Pim e assassino de Mestre Tavo (Chefe do Ato 4 na Cripta de Refino).
- **Onde Aparece:** Castelo Real — Câmara do Conselho e Salão de Banquetes (Atos 1, 3, 4); Santuário da Luz / Cripta de Refino (Ato 4).
- **Idade e Biotipo:** ~42 anos. Alto, esguio, postura impecavelmente ereta com as mãos quase sempre cruzadas às costas ou segurando um anel de sinete. Rosto afilado, pele pálida (`LIGHT_SKIN` `#f8d8b0`), cabelos negros ou castanho-muito-escuros pentados para trás com têmporas levemente prateadas.
- **Trajes e Símbolos:**
  - **Gola Alta Rígida e Manto Azul-Noite com Carmesim Escuro:** Ao contrário do vermelho vivo de Auren, Vael veste tons frios e aristocráticos: sobretudo longo em `NAVY_BLUE` (`#001858`) e `DARK_RED` (`#881400`), com ombreiras pontiagudas debruadas em `GOLD` (`#f8b800`).
  - **Broche da Moeda e da Chave:** No peito, um broche dourado em forma de losango (símbolo do tesouro real e das grades da Cripta de Refino).
  - **Rapieira Oculta / Lâmina de Lume:** Usa uma lâmina fina de corte silencioso — a arma conveniente e sem alarde que mata Tavo nos corredores do castelo.
- **Leitura no Sprite `16×16` (`npc_vael`):**
  - Topo (linhas 0–5): Cabelo escuro liso penteado para trás (`k` / `m`) e rosto pálido (`p`), sem barba, com olhar estreito e frio.
  - Pescoço/Ombros (linhas 6–8): Gola alta levantada em `GOLD` (`y`) e `DARK_RED` (`d`), criando uma silhueta em "V" pontiaguda nos ombros.
  - Corpo (linhas 8–14): Túnica longa e estreita em azul-marinho/escuro (`b` / `d`) com filete central dourado (`y`).
- **Com a Lente de Olívia / Em Batalha (Ato 4):** Sob a `lente_olivia`, o peito e as mãos de Vael faiscam em ouro intenso (`GOLD`), revelando que ele manipula lume refinado diretamente na Cripta. Em batalha, ergue sua rapieira banhada em luz dourada corrompida.

| Elemento | Cor `NES_COLORS` | Hex | Significado Visual |
|---|---|---|---|
| Pele Pálida | `LIGHT_SKIN` | `#f8d8b0` | Nobre de gabinete que nunca trabalha ao sol |
| Sobretudo Aristocrático | `DARK_RED` / `NAVY_BLUE` | `#881400` / `#001858` | Frieza política, ambição calculada e segredos de Estado |
| Gola Alta e Debrum | `GOLD` | `#f8b800` | Riqueza acumulada com o refino e tráfico de cativos |

---

### 3.4 Íris (`iris`) — A Amiga Dividida pelo Medo

- **ID Narrativo:** `iris` | **Sprite ID Atual:** `npc_girl` (dedicado: `npc_iris`)
- **Papel:** Amiga de infância do herói em Alvorada e irmã mais velha do menino Pim; chantageada por Vael a entregar a rota de Tavo para salvar a vida do irmão.
- **Onde Aparece:** Vila de Alvorada (Ato 1); Castelo Real (Atos 1, 3); Porto do Sol (Atos 2, 4 — onde procura notícias do irmão nos navios e armazéns).
- **Idade e Biotipo:** 17 anos (mesma idade do herói). Estatura média-baixa, ágil, olhos grandes e expressivos que começam radiantes no Ato 1 e vão ficando tensos e esquivos a partir do Ato 2.
- **Trajes e Símbolos:**
  - **Cabelos Castanhos com Fita Vermelha:** Cabelos castanho-escuros (`DARK_BROWN` `#503000`) presos em uma trança lateral que cai sobre o ombro direito, amarrada com uma fita vermelha (`RED` `#d82800`).
  - **Vestido Campestre de Alvorada com Xale Branco:** Blusa de linho branco (`WHITE` `#fcfcfc`) com mangas curtas vermelhas, saia longa em tom carmesim/terracota (`RED` `#d82800` / `DARK_RED` `#881400`) e uma pequena bolsa de couro na cintura onde guarda o boneco de madeira ou lembrança de **Pim**.
  - **O Contraste Visual:** Suas cores (`WHITE`, `RED`, `DARK_BROWN`) são quentes e familiares na Vila de Alvorada, fazendo o jogador confiar nela instantaneamente — o que torna a revelação de sua traição forçada no Ato 4 ainda mais dolorosa.
- **Leitura no Sprite `16×16` (`npc_girl` / `npc_iris`):**
  - Topo (linhas 0–5): Cabelo castanho (`t`) emoldurando o rosto (`s`), com um pequeno ponto vermelho/branco no laço lateral.
  - Torso (linhas 6–9): Corpete branco luminoso (`w`) com mangas vermelhas (`r`).
  - Saia (linhas 10–14): Saia rodada vermelha (`r`) com barra marcada e sapatos marrons (`t`).
- **Variação por Flag (Ato 4):** Quando `iris_traicao_revelada` está ativa, Íris mantém a direção virada para longe do herói (`up` ou oposta) até que ele fale com ela, representando sua vergonha e culpa.

| Elemento | Cor `NES_COLORS` | Hex | Significado Visual |
|---|---|---|---|
| Cabelos Trançados | `DARK_BROWN` | `#503000` | Origem humilde e camponesa na Vila de Alvorada |
| Blusa e Avental | `WHITE` | `#fcfcfc` | Inocência inicial e afeto genuíno pelo herói e por Pim |
| Saia e Fita | `RED` | `#d82800` | Vitalidade no Ato 1; no Ato 4, ecoa a culpa pelo sangue de Tavo |

---

### 3.5 Príncipe Dagan (`dagan`) — O Herdeiro de Cobre e Cinzas

- **ID Narrativo:** `dagan` | **Sprite ID Dedicado:** `npc_dagan`
- **Papel:** Príncipe herdeiro de Cobreval, filho do Rei Daros; rival orgulhoso do herói que escapa da queda de Cobre-Alto e se torna aliado ou inimigo no Ato 4 conforme a reputação moral do herói (`dagan_aliado` vs. `dagan_inimigo`).
- **Onde Aparece:** Castelo Real — Salão de Banquetes (Ato 1, vítima da tentativa de envenenamento em *"O brinde"*); Cobre-Alto e Ponte de Cobre (Ato 3); Rochedo em Pedrasul (Ato 4); Portões do Castelo Real e Epílogo (Ato 5).
- **Idade e Biotipo:** 20 anos. Porte atlético e marcial, ligeiramente mais alto que o herói, queixo erguido, olhar afiado e desconfiado. Cabelos curtos espetados em tom ruivo-acobreado (`DIRT` `#a85000` / `SAND` `#e4a050`).
- **Trajes e Símbolos:**
  - **Armadura de Placas de Cobre Polido:** Peitoral e ombreiras angulares em bronze e cobre (`DIRT` `#a85000` com reflexos em `SAND` `#e4a050` e `GOLD` `#f8b800`), forjados nas fundições reais de Cobre-Alto.
  - **Capa Curta Cinza-Forja e Broche de Engrenagem:** Sobre o ombro esquerdo, usa uma meia-capa cinza-chumbo (`DARK_GRAY` `#444444` / `MED_GRAY` `#7c7c7c`) presa por um broche em forma de roda dentada.
  - **Alabarda / Espada Larga de Relojoaria:** Arma de lâmina pesada com guarda dentada.
- **Leitura no Sprite `16×16` (`npc_dagan`):**
  - Topo (linhas 0–5): Diadema fino de cobre na testa e cabelo espetado acobreado/areia (`d` / `y`), sem elmo fechado para destacar sua juventude de príncipe rival (contraste direto com o cabelo loiro-ouro do herói).
  - Torso (linhas 6–12): Ombreiras quadradas de cobre (`d` / `y`) sobre cota de malha cinza-escura (`m`) e capa lateral cinza.
  - Pernas (linhas 13–15): Grevas metálicas cinzas (`m`) e botas marrons (`t`).
- **Evolução Visual (Ato 3 → Ato 4):** Após destruir a Ponte de Cobre na fuga noturna (`ponte_destruida`), sua capa ostenta uma faixa rasgada do estandarte do pai (`daros`), jurando vingança até descobrir que o herói também foi usado por Auren.

| Elemento | Cor `NES_COLORS` | Hex | Significado Visual |
|---|---|---|---|
| Armadura e Cabelo | `DIRT` / `SAND` | `#a85000` / `#e4a050` | Identidade industrial e mineral de Cobreval |
| Cota e Meia-Capa | `MED_GRAY` / `DARK_GRAY` | `#7c7c7c` / `#444444` | Aço das forjas e a fumaça de Cobre-Alto |
| Detalhes da Coroa Menor | `GOLD` | `#f8b800` | Sangue real e orgulho da dinastia de Cobreval |

---

### 3.6 Rei Daros (`daros`) — O Monarca das Forjas Traído

- **ID Narrativo:** `daros` | **Sprite ID Dedicado:** `npc_daros`
- **Papel:** Soberano de Cobreval, aliado ambicioso de Auren que recebe parte do lume refinado, mas é traído numa invasão noturna quando o próprio herói abre os portões de Cobre-Alto (Chefe trágico do Ato 3).
- **Onde Aparece:** Castelo Real — Banquete da Aliança (Ato 1); Cobre-Alto — Fortaleza das Forjas (Ato 3, chefe).
- **Idade e Biotipo:** ~54 anos. Maciço, peito largo de ferreiro-rei, barba espessa dividida em duas tranças presas por anéis de bronze. Voz trovejante e presença física intimidadora, mas leal à palavra dada entre aliados.
- **Trajes e Símbolos:**
  - **A Coroa de Engrenagem (Coroa Dentada):** Diferente da coroa solar pontiaguda de Auren, a coroa de Daros tem o formato de uma pesada engrenagem de relógio em cobre e ouro (`DIRT` `#a85000` e `GOLD` `#f8b800`).
  - **Armadura Real de Fornalha:** Couraça peitoral escura de ferro temperado (`DARK_GRAY` `#444444` e `MED_GRAY` `#7c7c7c`) adornada com tubulações e placas de cobre (`DIRT` `#a85000`) e manto escuro cor de brasa (`DARK_RED` `#881400`).
  - **Martelo-Espada de Cobre-Alto:** Empunha um malho de guerra / lâmina pesada forjada a vapor no coração da capital.
- **Leitura no Sprite `16×16` (`npc_daros`):**
  - Topo (linhas 0–2): Coroa dentada larga em tom de cobre/ouro (`d` / `y`).
  - Rosto (linhas 3–6): Barba escura/ruivo-acinzentada (`t` / `d`) mais quadrada e fechada que a barba branca de Auren.
  - Corpo (linhas 7–14): Silhueta robusta (12–14 px de largura) combinando couraça cinza-metálica (`m`) no centro e manto vermelho-brasa escuro (`d`) nos ombros.

| Elemento | Cor `NES_COLORS` | Hex | Significado Visual |
|---|---|---|---|
| Coroa e Placas | `DIRT` / `GOLD` | `#a85000` / `#f8b800` | Soberania industrial das forjas e relógios de Cobreval |
| Couraça Pesada | `MED_GRAY` / `DARK_GRAY` | `#7c7c7c` / `#444444` | Muralhas intransponíveis (que só caem por traição interna) |
| Manto de Brasa | `DARK_RED` | `#881400` | Orgulho militar e o fogo das fundições |

---

### 3.7 Sael (`sael`) — A Voz das Raízes e Líder Rebelde Veyra

- **ID Narrativo:** `sael` | **Sprite ID Dedicado:** `npc_sael`
- **Papel:** Líder dos rebeldes Veyra no Bosque de Brasa e no Refúgio das Raízes; conheceu Aneth pessoalmente, tenta alertar o herói no Ato 1 e revela sua verdadeira origem no Ato 4.
- **Onde Aparece:** Borda do Bosque de Brasa (Ato 1); Refúgio das Raízes (Ato 4); Colina distante no pós-créditos (Ato 5: *"Veremos quanto tempo"*).
- **Idade e Biotipo:** ~34 anos (sobreviveu à Queda de Vale-Veyra ainda adolescente, quando Aneth ficou para trás). Esguio, silencioso, movimentos rápidos de patrulheiro florestal. Olhos intensos e traços finos típicos do povo Veyra, com uma mecha clara/prateada ou ciano-pálida entre os cabelos escuros sob o capuz.
- **Trajes e Símbolos:**
  - **Capuz e Manto de Folhagem de Brasa:** Capuz fundo em verde-floresta (`FOREST_GREEN` `#007800`) que projeta sombra sobre a metade superior do rosto no Ato 1 (quando o herói ainda o enxerga como um "rebelde perigoso"), com bordas em verde-pálido (`PALE_GREEN` `#b8f818`).
  - **Xale Trançado Veyra e Broche de Raiz:** No peito, usa um xale diagonal em couro marrom (`DARK_BROWN` `#503000`) preso por uma fivela de pedra turquesa (`CYAN` `#74dcff`) com o mesmo símbolo entalhado no **Medalhão de Alvorada** do herói e na **Pulseira de Ulan**.
  - **Arco Curto e Adaga de Osso/Eco:** Armas silenciosas de guerrilha que nunca usam lume.
- **Leitura no Sprite `16×16` (`npc_sael`):**
  - Topo (linhas 0–5): Capuz pontiagudo em `FOREST_GREEN` (`g`) com borda iluminada em `PALE_GREEN` (`l`), deixando visíveis os olhos firmes e uma faixa de tecido no pescoço.
  - Torso (linhas 6–12): Túnica de patrulheiro verde-floresta (`g`) cortada diagonalmente por um boldrié marrom (`t`) e um ponto central `LIGHT_BLUE` / `CYAN` (`c`) — o símbolo Veyra que o conecta visualmente ao Medalhão no peito do herói.
  - Pernas (linhas 13–15): Botas leves de couro escuro (`t`) próprias para caminhar entre as árvores sem fazer ruído.

| Elemento | Cor `NES_COLORS` | Hex | Significado Visual |
|---|---|---|---|
| Capuz e Manto | `FOREST_GREEN` / `PALE_GREEN` | `#007800` / `#b8f818` | Camuflagem no Bosque de Brasa e comunhão com a terra viva |
| Insígnia Veyra | `LIGHT_BLUE` / `CYAN` | `#3cbcfc` / `#74dcff` | Conexão direta com o Medalhão de Aneth e a magia Eco |
| Boldrié e Botas | `DARK_BROWN` | `#503000` | Vida austera de resistência no Refúgio das Raízes |

---

### 3.8 Velho Orun (`orun`) — O Último Mestre do Eco

- **ID Narrativo:** `orun` | **Sprite ID Atual:** `npc_elder` (dedicado: `npc_orun`)
- **Papel:** Ancião guardião Veyra, memória viva da Ilha Veyra e mestre que ensina ao herói a magia ancestral (**Eco**), revela o nome verdadeiro da Fera (`Ulan`) e conduz o rito do **Selo de Veyra** no Templo-Coração.
- **Onde Aparece:** Cabana de Orun no Pântano de Brumaterra (Ato 3); Refúgio das Raízes (Ato 4); Templo-Coração na Ilha Veyra e Epílogo (Ato 5).
- **Idade e Biotipo:** ~75 anos. Baixo, curvado, sereno, mas com uma presença espiritual imensa. Longos cabelos e barba brancos (`WHITE` `#fcfcfc`) trançados com pequenas contas de pedra azul-ciano (`CYAN` `#74dcff`). Olhos semicerrados que parecem enxergar a ressonância das coisas antes da forma física.
- **Trajes e Símbolos:**
  - **Manto Tecido de Junco e Musgo Antigo:** Diferente das vestes nobres dos conselheiros de Luminário, Orun veste uma túnica rústica em camadas de verde-escuro/musgo (`FOREST_GREEN` `#007800`), marrom-terra (`DARK_BROWN` `#503000`) e estola azul-ciano (`LIGHT_BLUE` `#3cbcfc`) com o símbolo da **Espiral do Coração**.
  - **Cajado de Raiz Viva com a Pedra do Eco:** Apoia-se em um cajado de madeira retorcida (`DARK_BROWN`) em cujo topo flutua ou se encaixa um cristal ressonante azul-celeste (`CYAN` `#74dcff` / `LIGHT_BLUE` `#3cbcfc`).
- **Leitura no Sprite `16×16` (`npc_orun`):**
  - Topo (linhas 0–6): Cabeça ligeiramente mais baixa (postura curvada de sábio ancião), cabelos e barba longa branca (`w`) que desce até a cintura.
  - Torso e Cajado (linhas 6–13): Túnica em verde-musgo (`g`) e azul-celeste (`c`), com um cajado vertical na lateral (`t` com topo `c`) que quebra a simetria do sprite e o distingue de qualquer ancião humano comum (`npc_elder`).

| Elemento | Cor `NES_COLORS` | Hex | Significado Visual |
|---|---|---|---|
| Barba e Cabelos | `WHITE` | `#fcfcfc` | Antiguidade anterior à Guerra das Veias |
| Pedra do Eco e Estola | `CYAN` / `LIGHT_BLUE` | `#74dcff` / `#3cbcfc` | Domínio puro da magia Eco ("guardar sem possuir") |
| Túnica e Cajado | `FOREST_GREEN` / `DARK_BROWN` | `#007800` / `#503000` | Retiro no pântano de Brumaterra e raízes da Ilha Veyra |

---

### 3.9 Irmã Olívia (`olivia`) — A Claridade Silenciosa

- **ID Narrativo:** `olivia` | **Sprite ID Dedicado:** `npc_olivia`
- **Papel:** Sacerdotisa honesta do Santuário da Luz; percebe que a "luz benta" da Igreja é sustentada pelo sofrimento nos porões (Cripta de Refino), alerta o herói no Ato 2, entrega a **Lente de Olívia** no Ato 4 e assume a reforma do Santuário após a queda de Hesper.
- **Onde Aparece:** Santuário da Luz — Ala Lateral / Claustro (Atos 2, 4, 5).
- **Idade e Biotipo:** ~29 anos. Postura recolhida e serena, mãos frequentemente unidas junto ao peito em prece ou segurando um pequeno estojo de cristal. Rosto suave, olhar compassivo mas firme.
- **Trajes e Símbolos:**
  - **Hábito Branco e Véu Azul-Celeste Sem Ouro:** Em contraste deliberado com o Sumo Sacerdote Hesper, Olívia **não usa um único fio de ouro (`GOLD`)** em suas vestes. Seu hábito é de linho branco puro (`WHITE` `#fcfcfc`) com véu e escapulário em azul-celeste (`LIGHT_BLUE` `#3cbcfc` e `BLUE` `#2038ec`) — as cores da água limpa e da fé antes da corrupção pelo lume.
  - **A Lente de Olívia:** Carrega presa a um cordão de prata um monóculo/lente de quartzo polido (`CYAN` `#74dcff`), instrumento que ela mesma lapidou para enxergar a contaminação do minério nas pessoas da corte.
- **Leitura no Sprite `16×16` (`npc_olivia`):**
  - Topo (linhas 0–5): Véu monástico arredondado em `LIGHT_BLUE` (`c`) e `WHITE` (`w`) cobrindo os cabelos e emoldurando o rosto (`s`).
  - Corpo (linhas 6–14): Hábito longo branco (`w`) com faixa central vertical azul-celeste (`c` / `b`), silhueta limpa e humilde em formato de sino suave.

| Elemento | Cor `NES_COLORS` | Hex | Significado Visual |
|---|---|---|---|
| Hábito Monástico | `WHITE` | `#fcfcfc` | Honestidade espiritual ("Não confie na luz que só brilha para os ricos") |
| Véu e Escapulário | `LIGHT_BLUE` / `BLUE` | `#3cbcfc` / `#2038ec` | Serenidade, verdade e afinidade visual com o Eco/água limpa |
| Ausência de `GOLD` | — | — | Recusa consciente em lucrar com o lume refinado nos porões |

---

### 3.10 Sumo Sacerdote Hesper (`hesper`) — O Mercador de Bênçãos

- **ID Narrativo:** `hesper` | **Sprite ID Atual:** `npc_elder` (dedicado: `npc_hesper`)
- **Papel:** Líder corrupto da Igreja da Luz no Santuário; supervisiona o refino secreto do lume na Cripta subterrânea usando cativos, cobra pelas bênçãos reais e esconde do herói o significado do brilho do Medalhão de Alvorada.
- **Onde Aparece:** Santuário da Luz — Altar Principal (Atos 2 e 4, até ser deposto em `hesper_caiu`).
- **Idade e Biotipo:** ~60 anos. Alto, corpulento e pomposo, queixo erguido em ângulo de superioridade moral, olhos pequenos e calculistas.
- **Trajes e Símbolos:**
  - **Mitra Solar Dourada:** Chapéu cerimonial alto (`GOLD` `#f8b800` e `WHITE` `#fcfcfc`) que alonga sua silhueta verticalmente diante do altar do Santuário, fazendo-o parecer uma autoridade divina inquestionável.
  - **Paramentos de Ouro e Carmesim sobre Branco:** Veste uma túnica branca (`WHITE`) quase inteiramente coberta por uma pesada estola dourada (`GOLD` `#f8b800`) e ombreiras em vermelho-escuro (`DARK_RED` `#881400`) — ostentando na superfície do templo o minério extraído no sangue da Cripta de Refino logo abaixo de seus pés.
- **Leitura no Sprite `16×16` (`npc_hesper`):**
  - Topo (linhas 0–3): Mitra alta dourada e branca (`y` / `w`), diferenciando-o imediatamente da coroa larga de Auren e do véu baixo azul de Olívia.
  - Rosto (linhas 3–5): Rosto austero (`s`) com cavanhaque branco fino (`w`).
  - Corpo (linhas 6–14): Manto largo branco (`w`) sobrecarregado de dourado (`y`) nos ombros e no peito, com bordas em `DARK_RED` (`d`).
- **Com a Lente de Olívia (Ato 4):** Suas mãos e sua mitra brilham intensamente em `GOLD` / `YELLOW`, denunciando o contato diário com as cubas de refino da Cripta.

| Elemento | Cor `NES_COLORS` | Hex | Significado Visual |
|---|---|---|---|
| Mitra e Estola Pesada | `GOLD` / `YELLOW` | `#f8b800` / `#f8d878` | Monopólio da "luz benta" e contaminação direta pelo lume |
| Túnica Cerimonial | `WHITE` | `#fcfcfc` | Fachada de santidade da Igreja oficial |
| Ombreiras Litúrgicas | `DARK_RED` | `#881400` | Cumplicidade com a Coroa e com Lorde Vael |

---

### 3.11 Garo (`garo`) — O Sorriso do Porto do Sol

- **ID Narrativo:** `garo` | **Sprite ID Atual:** `npc_merchant` (dedicado: `npc_garo`)
- **Papel:** Mestre mercador da Guilda do Sol no Porto do Sol; pragmático, sorridente e moralmente escorregadio — vende equipamentos úteis ao herói no balcão da frente enquanto despacha "cargas especiais" (cativos acorrentados) nos armazéns do cais.
- **Onde Aparece:** Porto do Sol (`cidade_2`, Atos 2, 4 e 5).
- **Idade e Biotipo:** ~45 anos. Baixo e largo (biotipo rechonchudo), bigode encerado nas pontas, sorriso constante de negociante que nunca perde a compostura ("Tudo dentro da lei. As correntes? Costume do ofício").
- **Trajes e Símbolos:**
  - **Boina de Veludo Verde e Casaco Forrado:** Usa uma boina larga de mercador portuário em verde-floresta (`FOREST_GREEN` `#007800`) com faixa dourada (`GOLD` `#f8b800`) e um casaco volumoso verde com mangas e gola em veludo carmesim-escuro (`DARK_RED` `#881400`).
  - **Cinto de Moedas e Chaveiro de Porão:** Na cintura larga, carrega uma bolsa estufada de ouro (`GOLD`) de um lado e o molho de chaves dos armazéns portuários do outro.
- **Leitura no Sprite `16×16` (`npc_merchant` / `npc_garo`):**
  - Topo (linhas 0–3): Boina/chapéu arredondado em `FOREST_GREEN` (`g`) e `GOLD` (`y`).
  - Rosto (linhas 3–5): Rosto largo (`s`) com olhos vivos.
  - Corpo (linhas 6–13): Torso arredondado em verde (`g`) com mangas largas em `DARK_RED` (`d`) — a silhueta mais larga na altura da cintura entre os NPCs humanos.
- **Com a Lente de Olívia / Flag `garo_carga_vista`:** Exibe reflexos dourados nas mãos e na bolsa (pagamento em lume/ouro real de Vael e Brenn), e seu diálogo muda para um tom defensivo e nervoso.

| Elemento | Cor `NES_COLORS` | Hex | Significado Visual |
|---|---|---|---|
| Casaco e Boina da Guilda | `FOREST_GREEN` | `#007800` | Ostentação comercial e riqueza mercantil do Porto do Sol |
| Mangas de Veludo | `DARK_RED` | `#881400` | Contratos assinados com a nobreza da capital |
| Faixa e Bolsa de Ouro | `GOLD` | `#f8b800` | Lucro obtido sobre o tráfico de cativos |

---

### 3.12 Capitã Marta (`marta`) — O Espelho de Aço no Portão

- **ID Narrativo:** `marta` | **Sprite ID Atual:** `npc_guard` (dedicado: `npc_marta`)
- **Papel:** Comandante da Guarda Real do Castelo de Luminário; soldada incorruptível que admira o herói e acredita sinceramente estar protegendo o povo, mas cuja consciência vai pesando a cada ato até deixar o herói fugir no Ato 4 (`marta_deixou_fugir`) e abrir o portão lateral na marcha final do Ato 5 (`castelo_invadido`).
- **Onde Aparece:** Castelo Real — Portão Principal do Pátio Sul (Atos 1, 3, 4 e 5).
- **Idade e Biotipo:** ~32 anos. Postura militar rigorosa, ombros retos, olhar direto e honesto. Cabelos ruivo-escuros ou castanhos presos sob o elmo de capitã.
- **Trajes e Símbolos:**
  - **Elmo de Capitã com Penacho Carmesim e Visor Aberto:** Diferente dos soldados rasos (cujo elmo cobre quase toda a testa com viseira cinza fechada), o elmo de Marta tem um **penacho vermelho-vivo (`RED` `#d82800`) ou dourado (`GOLD` `#f8b800`) no topo** e visor aberto que deixa seu rosto claro e olhos visíveis — porque Marta é uma personagem que **olha nos olhos do herói** quando duvida das ordens.
  - **Armadura de Aço Prateado e Capa da Guarda Real:** Couraça reluzente em `LIGHT_GRAY` (`#bcbcbc`) e `MED_GRAY` (`#7c7c7c`), capa vermelha (`RED` `#d82800`) e faixa peitoral azul (`BLUE` `#2038ec`) de oficial comandante.
  - **Lança / Espada de Guarda de Portão:** Mantém a arma em posição de sentinela vertical ao lado do corpo (exceto no Ato 4, quando abaixa a guarda para deixá-lo passar).
- **Leitura no Sprite `16×16` (`npc_marta`):**
  - Topo (linhas 0–2): Crista/penacho vermelho (`r`) e filete dourado (`y`) no topo do elmo prateado (`a`), distinguindo-a imediatamente do Sentinela Real comum (`npc_guard`) postado no outro lado do portão.
  - Rosto (linhas 3–6): Rosto visível (`s`) emoldurado por protetores laterais prateados (`a`).
  - Corpo (linhas 7–13): Peitoral prateado (`a`) com insígnia azul/dourada no centro e ombreiras vermelhas (`r`).
- **Sem Corrupção na Lente de Olívia:** Mesmo vivendo dentro do Castelo Real, Marta **não** apresenta qualquer brilho de corrupção sob a `lente_olivia` no Ato 4 — confirmando visualmente ao jogador que ela é honesta.

| Elemento | Cor `NES_COLORS` | Hex | Significado Visual |
|---|---|---|---|
| Armadura de Oficial | `LIGHT_GRAY` / `MED_GRAY` | `#bcbcbc` / `#7c7c7c` | Dever, retidão militar e honra incorruptível |
| Penacho e Capa | `RED` | `#d82800` | Posto de Capitã da Guarda Real de Luminário |
| Filete de Comando | `GOLD` / `BLUE` | `#f8b800` / `#2038ec` | Espelho moral do próprio herói dentro das muralhas |

---

## 4. Referência Rápida: Personagens Secundários-Chave e Chefes Especiais

Para manter a unidade visual com o Protagonista e os 12 Marcantes ao longo dos 5 atos, os demais personagens de destaque seguem estas diretrizes diretas dentro da mesma paleta `NES_COLORS`:

| ID | Nome | Papel / Local | Diretriz Visual Resumida (`16×16` + Paleta NES) |
|---|---|---|---|
| `ulan` | **Ulan (A Fera da Caverna)** | Chefe do Ato 1 (`caverna_sombras`) | Ex-guardião Veyra deformado por anos contendo a veia de lume sem o Selo: silhueta corcunda e musculosa em `DARK_GRAY` (`#444444`) e `DARK_BROWN` (`#503000`), veias e olhos rachados brilhando em `GOLD` (`#f8b800`), mas com a **Pulseira Veyra** (`CYAN` `#74dcff`) ainda intacta no pulso esquerdo. |
| `aneth` | **Aneth** | Mãe do herói (Sonhos 1 e 4) | Silhueta idêntica à linhagem do herói e de Sael: cabelos longos dourado-claros (`YELLOW` / `GOLD`), manto branco e verde-pálido (`WHITE` / `PALE_GREEN`) da Ilha Veyra e o **Medalhão de Alvorada** (`CYAN` / `GOLD`) nas mãos. |
| `maren` | **Rainha Maren** | Soberana de Pedrasul (`rochedo`, Ato 3) | Mulher alta de cabelos grisalhos trançados, tiara de ferro escuro (`DARK_GRAY`), manto de pele de lobo da montanha (`LIGHT_GRAY` / `DARK_BROWN`) sobre armadura austera azul-gelo (`BLUE` / `LIGHT_BLUE`) — nobreza digna sem ouro nem ostentação. |
| `olo` | **Regente Olo** | Governante de Brumaterra (`vau_cinza`, Ato 3) | Homem magro de meia-idade com capa de junco impermeável (`FOREST_GREEN` / `SAND`), colar de conchas ribeirinhas (`WHITE`) e lenço no rosto para filtrar a névoa da Febre-Cinza. |
| `brasca` | **Almirante Brasca** | Rebelde do mar (`gruta_costa`, Ato 2) | Ex-oficial naval robusto: tricórnio/casaca marítima em `NAVY_BLUE` (`#001858`) sem as insígnias reais (arrancadas), faixa vermelha (`RED`) na cintura, barba cerrada e sabre de abordagem (`WHITE`). |
| `brenn` | **Lorde Brenn** | Conselheiro das Minas (`castelo_real`, `mina_velha`) | Nobre corpulento e agressivo em armadura cerimonial marrom-ferrugem e dourada (`DIRT` `#a85000`, `GOLD` `#f8b800`, `DARK_RED` `#881400`); brilha intensamente sob a `lente_olivia`. |
| `hald` | **Lorde Hald** | Conselheiro das Finanças (`castelo_real`) | Nobre esguio de óculos/monóculo e túnica verde-escura com gola dourada (`FOREST_GREEN`, `GOLD`, `MED_GRAY`), sempre próximo aos livros-razão da Coroa. |
| `ilka` | **Dama Ilka** | Conselheira dos Celeiros (`castelo_real`) | Nobre honesta de meia-idade com vestido azul e areia (`BLUE`, `SAND`, `WHITE`), sem excesso de joias; **não** brilha sob a `lente_olivia`. |
| `ysolde` | **Dama Ysolde** | Conselheira dos Arquivos (`castelo_real`) | Nobre idosa e curvada em xale cinza e azul-escuro (`MED_GRAY`, `NAVY_BLUE`, `LIGHT_SKIN`), olhar assustado de quem conhece a verdade nas crônicas rasgadas e se cala por medo. |
| `pim` | **Pim** | Irmão menino de Íris (`cripta_refino`, Ato 4) | Sprite menor (12–13 px de altura útil na matriz `16×16`), cabelos castanhos (`DARK_BROWN`) iguais aos de Íris e camisa branca/azul-clara (`WHITE` / `LIGHT_BLUE`), criando reconhecimento imediato de parentesco. |

---

## 5. Mapa de Implementação de Sprites (`src/assets/`)

Todos os sprites abaixo estão implementados em `src/assets/heroGraphics.ts` e `src/assets/npcGraphics.ts` (4 direções `16×16`), mantendo intactas as 5 classes genéricas originais (`npc_elder`, `npc_girl`, `npc_guard`, `npc_merchant`, `npc_king`), adicionando `npc_villager` e os 12 sprites dedicados dos personagens marcantes:

| Personagem | ID Narrativo (`resumo-para-jogo.md`) | `spriteId` Genérico (Legado) | `spriteId` Dedicado (`npcGraphics.ts`) | Paleta Principal (`NES_COLORS`) |
|---|---|---|---|---|
| **Herói (`[NOME]`)** | `player` | `HERO_RAW_DATA` | `HERO_RAW_DATA` (`heroGraphics.ts`) | `GOLD`, `YELLOW`, `BLUE`, `LIGHT_BLUE`, `CYAN`, `RED`, `DARK_RED`, `DARK_BROWN` |
| **Rei Auren** | `auren` | `npc_king` | `npc_auren` | `GOLD`, `YELLOW`, `WHITE`, `RED`, `DARK_RED`, `DARK_BROWN` |
| **Mestre Tavo** | `tavo` | `npc_guard` | `npc_tavo` | `LIGHT_GRAY`, `MED_GRAY`, `BLUE`, `DARK_BROWN`, `WHITE` |
| **Lorde Vael** | `vael` | `npc_elder` | `npc_vael` | `LIGHT_SKIN`, `NAVY_BLUE`, `DARK_RED`, `GOLD`, `YELLOW`, `DARK_GRAY` |
| **Íris** | `iris` | `npc_girl` | `npc_iris` | `DARK_BROWN`, `BROWN`, `WHITE`, `RED`, `DARK_RED` |
| **Príncipe Dagan** | `dagan` | `npc_guard` | `npc_dagan` | `DIRT`, `SAND`, `GOLD`, `MED_GRAY`, `DARK_GRAY`, `DARK_BROWN` |
| **Rei Daros** | `daros` | `npc_king` | `npc_daros` | `DIRT`, `GOLD`, `SAND`, `MED_GRAY`, `DARK_GRAY`, `DARK_RED` |
| **Sael** | `sael` | `npc_merchant` | `npc_sael` | `FOREST_GREEN`, `PALE_GREEN`, `CYAN`, `DARK_BROWN` |
| **Velho Orun** | `orun` | `npc_elder` | `npc_orun` | `WHITE`, `FOREST_GREEN`, `LIGHT_BLUE`, `CYAN`, `DARK_BROWN` |
| **Irmã Olívia** | `olivia` | `npc_girl` | `npc_olivia` | `WHITE`, `LIGHT_BLUE`, `CYAN`, `BLUE` |
| **Sumo Sacerdote Hesper** | `hesper` | `npc_elder` | `npc_hesper` | `GOLD`, `YELLOW`, `WHITE`, `DARK_RED` |
| **Garo** | `garo` | `npc_merchant` | `npc_garo` | `FOREST_GREEN`, `DARK_RED`, `GOLD`, `YELLOW`, `DARK_BROWN` |
| **Capitã Marta** | `marta` | `npc_guard` | `npc_marta` | `LIGHT_GRAY`, `MED_GRAY`, `RED`, `DARK_RED`, `GOLD`, `BLUE` |
| **Aldeão Comum** | — | `npc_villager` | `npc_villager` | `DARK_BROWN`, `BROWN`, `LIGHT_BLUE` |

---

## 6. Bestiário e Direção de Arte de Monstros e Animações de Batalha (Estilo Final Fantasy & Dragon Quest)

### 6.1 Filosofia Visual e Sistema de Animações (`BattleEffects.ts` & `BattleScene.ts`)

O combate de **Lenda de Luminário** adota a consagrada apresentação visual híbrida da era de ouro dos JRPGs:
- **Enquadramento Clássico Frontal:** A arena central apresenta o monstro em destaque contra o fundo escuro da batalha, transmitindo peso, escala e ameaça imediata (escola *Dragon Quest*).
- **Vida Orgânica na Arena (Animações de Espera / Idle):** O monstro não permanece como uma imagem estática. Através de `renderMonster` em `src/engine/BattleEffects.ts`, cada criatura possui um ciclo respiratório procedural contínuo:
  - **Gosmas e Criaturas Amorfas (`gosma_cinza`, `caranguejo_vidro`, `sapo_lume`):** *Squash & Stretch* senoidal vertical suave (`scaleY` entre 0.94 e 1.06 com compensação inversa em `scaleX`), dando a sensação de gelatina viva pulsante.
  - **Criaturas Aladas / Voadoras (`corvo_manchado`, `morcego_treva`):** Flutuação vertical oscilatória em arco contínuo (`hoverOffsetY` de 4 a 6 pixels) simulando o bater de asas e sustentação no ar.
  - **Feras, Humanoides e Chefes (`ulan_fera`, `lobo_brasa`, `bandoleiro`, `mineiro_louco`, etc.):** Respiração torácica ritmada com expansão de peito e ombros (`scaleY` sutil de 1.025 e recuo vertical de 1 pixel).
- **Impacto Físico e Hit-Stop:**
  - **Impacto do Golpe:** Ao sofrer dano, o sprite do monstro executa um piscar estroboscópico em silhueta branca pura (`hitFlashTimer`), acompanhado de tremor sísmico horizontal violento (`hitShakeTimer` de ±4 a ±6 pixels) e breve congelamento de quadros (*hit-stop* de 120ms) que confere peso esmagador a cada acerto.
  - **Investida do Monstro (*Lunge*):** Quando o monstro ataca, seu sprite avança velozmente em direção ao jogador (`lungeOffsetY` de até 14 pixels para baixo), desfere três marcas carmesins de garras cortantes na tela e recua suavemente à sua posição inicial.
  - **Ataque de Espada do Herói (`triggerSlash`):** Arco de luz prateada diagonal que corta a tela com brilho branco intenso (`NES_COLORS.WHITE`), dispersão radial de 16 faíscas brilhantes em arco (`GOLD` e `WHITE`). Em **golpes críticos**, executa um corte duplo cruzado em 'X' com feixes adicionais de partículas douradas.
  - **Feitiços Elementais (`triggerSpell`):** Efeitos visuais dedicados desenhados proceduralmente no Canvas:
    - `centelha`: Relâmpagos em ziguezague elétrico azul/ciano com estalos estroboscópicos e feixes radiais.
    - `fagulha`: Pilares verticais e labaredas de fogo carmesim/dourado subindo com brasas incandescentes dispersas.
    - `cura` / `cura_maior`: Cruzes de luz sagrada branca e pilares de partículas efervescentes ascendentes douradas.
    - `protecao`: Escudo rúnico translúcido esférico em anéis concêntricos que pulsionam ao redor do alvo.
    - `eco`: Ondas de choque em anéis concêntricos na cor ciano Veyra (`#74dcff`) expandindo-se do centro com partículas estelares.
  - **Derrota e Dissolução Retrô (`triggerMonsterDefeat`):** Ao ter seu HP zerado, o monstro não simplesmente desaparece: seu sprite sofre uma dissolução horizontal em fatias (*scanlines* estilo NES/SNES), desintegrando-se em linhas alternadas que sobem como poeira de cinzas enquanto fumaça sobe ao ar.

---

### 6.2 Fichas de Direção de Arte dos Monstros do Ato 1

Todos os monstros do Ato 1 estão implementados na resolução padrão `32×32` pixels (comunidades selvagens e feras comuns) e `48×48` pixels (o chefe Ulan Fera), com paletas estritamente derivadas de `NES_COLORS`:

#### 1. Gosma Cinzenta (`gosma_cinza` — 32×32)
- **Conceito:** A primeira ameaça das estradas de Luminário. Uma massa gelatinosa translúcida contaminada pelas cinzas vulcânicas e poeira de lume bruto.
- **Silhueta e Detalhes:** Formato clássico de gota d'água afunilada no topo no mais puro estilo *Dragon Quest*. Destaque de luz vítrea curva no ombro superior esquerdo em branco (`W`) e cinza claro (`O`), corpo cinza médio (`X`) e olhos expressivos brancos com pupilas pretas redondas e núcleo rubro de infecção (`R`).
- **Comportamento em Batalha:** *Squash & Stretch* elástico contínuo.

#### 2. Lebre Cinzenta (`lebre_cinza` — 32×32)
- **Conceito:** Animal silvestre corrompido que perdeu o medo do homem; rápida, agressiva e traiçoeira.
- **Silhueta e Detalhes:** Orelhas longas e eretas em 'V' com interior rosado/pálido (`P`) e pontas escuras. Olhos injetados de vermelho brilhante (`R`/`Y`), focinho com pequenas presas pontiagudas brancas (`W`), peito cinza claro e patas traseiras comprimidas como molas prontas para o salto.
- **Comportamento em Batalha:** Respiração curta e inquieta com saltos súbitos de investida.

#### 3. Corvo Manchado (`corvo_manchado` — 32×32)
- **Conceito:** Pássaro carniceiro de bico curvado que nidifica nas fendas da pedreira e ataca viajantes isolados.
- **Silhueta e Detalhes:** Asas largas abertas com envergadura que preenche a tela, penas primárias em degraus (`X`, `M`, `#`). Bico afiado dourado/âmbar curvado para baixo (`Y`), olhos carmesins vigilantes e cauda aberta com garras amarelas em garra estendidas.
- **Comportamento em Batalha:** Flutuação contínua em arco suave como se estivesse pairando contra as correntes térmicas.

#### 4. Lobo-Brasa (`lobo_brasa` — 32×32)
- **Conceito:** Predador das encostas pedregosas cuja pelagem queima com cinzas quentes e fagulhas incandescentes.
- **Silhueta e Detalhes:** Juba imponente em chamas com degradê vivo de vermelho escuro (`O`), carmesim (`R`), ouro (`Y`) e faíscas brancas (`W`). Focinho agressivo de rosnado expondo presas pontiagudas brancas, olhos de fogo dourado e cauda flamejante.
- **Comportamento em Batalha:** Respiração pesada e investidas em lunge com marcas triplas de garras na tela.

#### 5. Tronco Pálido (`tronco_palido` — 32×32)
- **Conceito:** Espírito da floresta ressequida e petrificada pela Praga das Cinzas; madeira oca e retorcida.
- **Silhueta e Detalhes:** Galhos secos e pontiagudos bifurcados no topo como chifres. Casca cinzenta rachada (`L`) com nós profundos marrons (`B`) formando uma carranca aterrorizante: olhos profundos vazados brilhando em âmbar/dourado (`Y`) e mandíbula dentada de madeira lascada. Musgo verde-escuro (`G`) acumulado nas fendas e raízes contorcidas que servem de pernas.
- **Comportamento em Batalha:** Postura rígida que estremece bruscamente ao desferir golpes pesados com raízes.

#### 6. Bandoleiro (`bandoleiro` — 32×32)
- **Conceito:** Ladrão e desertor dos caminhos que espreita caravanas e viajantes desavisados nas rotas de Alvorada.
- **Silhueta e Detalhes:** Capuz marrom esfarrapado (`B`), máscara/lenço no rosto deixando apenas os olhos implacáveis visíveis (`R`/`K`), jaqueta de couro ajustada e uma cimitarra/adaga de aço prateado com lâmina reluzente em branco e cinza claro (`W`, `M`, `L`) empunhada em diagonal pronta para o bote.
- **Comportamento em Batalha:** Postura bípede marcial com respiração firme e golpes velozes de lâmina.

#### 7. Morcego da Treva (`morcego_treva` — 32×32)
- **Conceito:** Habitante da Caverna das Sombras; caçador cego dotado de ecolocalização e sede de sangue.
- **Silhueta e Detalhes:** Envergadura completa de asas membranosas em azul-marinho profundo (`NAVY_BLUE`) e negro, sustentadas por falanges pontiagudas. Corpo central felpudo, orelhas triangulares eretas de radar, olhos vermelhos brilhantes e presas caninas brancas afiadas descendo do lábio superior.
- **Comportamento em Batalha:** Flutuação vertical contínua com ondulação rítmica na ponta das asas.

#### 8. Mineiro Louco (`mineiro_louco` — 32×32)
- **Conceito:** Trabalhador das minas esquecidas enlouquecido pelo confinamento e vapores das cinzas subterrâneas.
- **Silhueta e Detalhes:** Capacete de mineração com lanterna frontal em ouro reluzente (`Y`) projetando iluminação no escuro. Rosto desfigurado por olheiras escuras e olhos esbugalhados brancos/vermelhos em delírio. Macacão de operário azul-escuro manchado de carvão e picareta pesada de ferro curvada (`M`, `W`, `B`) erguida acima da cabeça pronta para o golpe.
- **Comportamento em Batalha:** Movimento trêmulo e errático com golpes contundentes que provocam tremor de tela.

#### 9. Ulan Fera (`ulan_fera` — Chefe do Ato 1, 48×48)
- **Conceito:** Ulan, o outrora nobre guerreiro do Povo Guardião Veyra, deformado e consumido pela Praga das Cinzas na Caverna das Sombras após passar décadas contendo a veia de lume desprovido do Selo Sagrado.
- **Silhueta Colossal:** Monstro titânico de 48×48 pixels. Chifres curvos e pontiagudos que despontam do crânio com espinhos avermelhados e dourados. Mandíbula dilatada em rugido ensurdecedor repleta de presas gigantescas brancas (`W`), olhos de praga vazados fumegantes em vermelho rubro (`R`), dourado (`G`) e pupilas em amarelo incandescente (`Y`). Ombros colossais musculosos com pelos eriçados escuros (`#`, `D`, `X`).
- **O Detalhe Crucial da Lore — A Pulseira Veyra:**
  - No pulso esquerdo da fera (coordenadas x=34..41, y=33..37 da matriz), reluz uma **pulseira de ouro sagrado (`G`, `Y`) engastando um cristal ciano radiante (`C` `#74dcff`) e azul-celeste (`L` `#3cbcfc`)**, com um ponto central de reflexo puro em branco (`W`).
  - Essa joia ancestral intocada pela corrupção é o **elo visual que comprova a identidade trágica de Ulan** e recompensa o jogador como **drop garantido (100%)** ao final do duelo, abrindo as portas do Ato 2 e da revelação sobre o passado do herói.
- **Comportamento em Batalha:** Respiração imponente de besta colossal, investidas com cortes devastadores de garras, rugidos com tremor sísmico e dissolução final solene em scanlines ao ser libertado da maldição.


