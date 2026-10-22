# Balanceamento e Fórmulas de Combate: Lenda de Luminário

> **Documento de Referência Numérica do Sistema de RPG**  
> Define as curvas de progressão de nível, catálogo de monstros, probabilidades de encontro e fórmulas matemáticas de combate.

---

## 1. Curva de Progressão do Herói (Níveis 1 ao 15)

O herói progride acumulando Pontos de Experiência (EXP) obtidos ao derrotar monstros. Ao subir de nível, seus PV e PM são totalmente restaurados.

| Nível | EXP Próx | EXP Total | PV Máx | PM Máx | ATQ Base | DEF Base | Agilidade | Magia Aprendida |
|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---|
| **1** | 0 | 0 | 28 | 10 | 8 | 4 | 6 | — |
| **2** | 10 | 10 | 33 | 12 | 10 | 6 | 7 | — |
| **3** | 18 | 28 | 38 | 15 | 13 | 8 | 9 | **Cura** (3 PM) |
| **4** | 28 | 56 | 44 | 18 | 16 | 10 | 11 | — |
| **5** | 42 | 98 | 51 | 22 | 19 | 13 | 13 | **Centelha** (4 PM) |
| **6** | 60 | 158 | 58 | 26 | 23 | 16 | 15 | — |
| **7** | 85 | 243 | 66 | 30 | 27 | 19 | 17 | **Proteção** (3 PM) |
| **8** | 120 | 363 | 74 | 35 | 31 | 22 | 20 | — |
| **9** | 165 | 528 | 83 | 40 | 36 | 26 | 22 | **Fagulha** (6 PM) |
| **10** | 225 | 753 | 92 | 45 | 41 | 30 | 25 | — |
| **11** | 300 | 1053 | 102 | 50 | 46 | 34 | 28 | — |
| **12** | 400 | 1453 | 112 | 56 | 52 | 39 | 31 | **Cura Maior** (7 PM) |
| **13** | 520 | 1973 | 123 | 62 | 58 | 44 | 34 | — |
| **14** | 670 | 2643 | 134 | 68 | 64 | 49 | 37 | — |
| **15** | 850 | 3493 | 146 | 75 | 71 | 55 | 40 | — |

---

## 2. Catálogo de Magias

| Magia | Custo PM | Nível | Tipo | Efeito |
|:---|:---:|:---:|:---:|:---|
| **Cura** | 3 | 3 | Recuperação | Restaura 25 a 35 PV do herói. |
| **Centelha** | 4 | 5 | Dano Mágico | Causa 16 a 24 de dano elemental (ignora DEF física). |
| **Proteção** | 3 | 7 | Suporte | Aumenta a DEF do herói em +6 até o fim do combate. |
| **Fagulha** | 6 | 9 | Dano Mágico | Causa 34 a 46 de dano de fogo elemental. |
| **Cura Maior** | 7 | 12 | Recuperação | Restaura 60 a 80 PV do herói. |

---

## 3. Fórmulas Matemáticas de Combate

### 3.1 Dano Físico do Herói
O dano do herói considera seu ATQ total (`ATQ_Base + Bônus_Arma`) e a DEF do inimigo:
$$\text{DanoBase} = \text{ATQ}_{\text{Herói}} - \left\lfloor \frac{\text{DEF}_{\text{Monstro}}}{2} \right\rfloor$$
A variação aleatória fica entre 85% e 115%:
$$\text{DanoFinal} = \max\left(1, \left\lfloor \text{DanoBase} \times (0.85 + \text{random} \times 0.30) \right\rfloor\right)$$

### 3.2 Golpe Crítico
Ocorre com probabilidade de 1 em 16 (~6,25%):
$$\text{DanoCrítico} = \max\left(2, \left\lfloor \text{ATQ}_{\text{Herói}} \times 1.5 - \text{DEF}_{\text{Monstro}} \times 0.5 \right\rfloor\right)$$

### 3.3 Dano Físico do Monstro
O dano infligido ao herói segue fórmula espelhada com base na DEF total do herói (`DEF_Base + Bônus_Equipamentos`):
$$\text{DanoBaseMonstro} = \text{ATQ}_{\text{Monstro}} - \left\lfloor \frac{\text{DEF}_{\text{Herói}}}{2} \right\rfloor$$
$$\text{DanoFinalMonstro} = \max\left(1, \left\lfloor \text{DanoBaseMonstro} \times (0.85 + \text{random} \times 0.30) \right\rfloor\right)$$

### 3.4 Chance de Fuga
A chance de escapar com sucesso depende da relação de agilidade entre o herói e o monstro:
$$\text{ChanceFuga} = \min\left(0.90, \max\left(0.25, \frac{\text{AGI}_{\text{Herói}}}{\text{AGI}_{\text{Herói}} + \text{AGI}_{\text{Monstro}}} \times 1.15\right)\right)$$
- **Chefes** (como `ulan_fera`): chance de fuga é **0%** (fuga bloqueada).

---

## 4. Monstros do Ato 1 (Tabelas de Atributos)

### 4.1 Campos de Alvorada (`grass`, `flower_grass`, `sand`)
Região inicial entre o Castelo Real e a Vila de Alvorada. Ideal para níveis 1 a 3.

| Monstro | PV | ATQ | DEF | AGI | EXP | Ouro | Drop | Chance |
|:---|:---:|:---:|:---:|:---:|:---:|:---:|:---|:---:|
| **Gosma-Cinza** | 7 | 6 | 3 | 4 | 2 | 3 | Erva de Cura | 10% |
| **Lebre-Cinza** | 12 | 9 | 4 | 8 | 4 | 6 | Erva de Cura | 15% |
| **Corvo Manchado** | 16 | 12 | 6 | 10 | 7 | 9 | Tocha | 10% |

### 4.2 Bosque de Brasa (`tree`)
Floresta ao norte e leste de Alvorada. Suavizado para início do jogo (níveis 2 a 4).

| Monstro | PV | ATQ | DEF | AGI | EXP | Ouro | Drop | Chance |
|:---|:---:|:---:|:---:|:---:|:---:|:---:|:---|:---:|
| **Lobo de Brasa** | 14 | 10 | 5 | 9 | 6 | 8 | Erva de Cura | 20% |
| **Tronco Pálido** | 18 | 12 | 8 | 5 | 9 | 11 | Tônico de Brasa | 15% |
| **Bandoleiro** | 22 | 14 | 7 | 10 | 14 | 16 | Adaga de Cobre | 8% |

### 4.3 Caverna das Sombras (`cave_floor`)
Masmorra de pedras e minas abandonadas. Nível recomendado: 5 a 7.

| Monstro | PV | ATQ | DEF | AGI | EXP | Ouro | Drop | Chance |
|:---|:---:|:---:|:---:|:---:|:---:|:---:|:---|:---:|
| **Morcego das Trevas** | 24 | 20 | 10 | 16 | 20 | 16 | Erva de Cura | 20% |
| **Mineiro Enlouquecido**| 36 | 26 | 15 | 11 | 30 | 32 | Tocha | 25% |
| **Ulan, a Fera (Chefe)**| 110 | 34 | 18 | 14 | 120 | 150 | Pulseira Antiga| 100% |

---

## 5. Zonas de Encontro por Terreno

| Terreno (`id`) | Taxa de Encontro | Monstros e Pesos |
|:---|:---:|:---|
| `grass` (Grama) | 4% por passo | Gosma-Cinza (60%), Lebre-Cinza (40%) |
| `flower_grass` (Grama Florida) | 4% por passo | Gosma-Cinza (50%), Lebre-Cinza (50%) |
| `sand` (Areia) | 5% por passo | Lebre-Cinza (50%), Corvo Manchado (50%) |
| `tree` (Bosque) | 12% por passo | Lebre-Cinza (25%), Lobo de Brasa (35%), Tronco Pálido (25%), Bandoleiro (15%) |
| `mountain` (Montanha) | 8% por passo | Corvo Manchado (50%), Lobo de Brasa (35%), Lebre-Cinza (15%) |
| `cave_floor` (Chão de Caverna)| 8% por passo | Morcego das Trevas (55%), Mineiro Enlouquecido (45%) |
