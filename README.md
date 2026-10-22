# Lenda de Luminário ⚔️

Um RPG 2D clássico em pixel art (estilo 8-bits Dragon Quest & Final Fantasy), construído em **TypeScript** e **HTML5 Canvas** com **Vite**, jogável direto no navegador com suporte a controles de teclado e **gamepad virtual touch para mobile**.

## 🎮 Como Jogar

### No Computador (Teclado)
- **Mover:** Setas Direcionais ou `W`, `A`, `S`, `D`
- **Confirmar / Interagir / Falar / Menu:** `Enter` ou `Z`
- **Cancelar / Voltar:** `Escape` ou `X`
- **Mapa do Reino:** `M`

### No Celular / Tablet (Touch)
- **D-Pad Virtual:** Direcionais na tela com suporte a toque e arrasto de polegar
- **Botão A:** Confirmar / Interagir
- **Botão B:** Cancelar / Voltar
- **Botão MAPA:** Atalho para o mapa-múndi
- **Botão 🎮 (Topo):** Oculta ou exibe os controles touch
- **Botão ⛶ (Topo):** Alterna modo de tela cheia

## 💾 Sistema de Salvar e Continuar
O progresso é salvo no `localStorage` do navegador ao:
- Abrir o Menu no mapa e escolher **Salvar**
- Descansar em qualquer **Estalagem**
- Concluir o prólogo inicial

## 🛠️ Desenvolvimento

```bash
# Instalar dependências
npm install

# Rodar servidor local
npm run dev

# Rodar servidor acessível pelo celular na mesma rede Wi-Fi
npm run dev -- --host

# Executar testes
npm test

# Compilar para produção
npm run build
```
