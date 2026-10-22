import './style.css';
import { Game } from './engine/Game';
import { TitleScene } from './scenes/TitleScene';

async function bootstrap() {
  const canvas = document.getElementById('game') as HTMLCanvasElement | null;
  if (!canvas) {
    throw new Error('Elemento canvas #game não foi encontrado no DOM.');
  }

  try {
    const game = new Game(canvas);

    // Inicializa carregamento de assets (procedurais ou PNG)
    await game.init();

    // Empilha a cena inicial: Tela de Título
    const titleScene = new TitleScene(game.sceneManager, game.input, game.assetManager);
    game.sceneManager.push(titleScene);

    // Inicia o game loop
    game.start();

    // Exponibiliza instância de debug no window
    (window as unknown as { __GAME__?: Game }).__GAME__ = game;
  } catch (err) {
    console.error('Erro fatal ao inicializar o jogo:', err);
    const app = document.getElementById('app');
    if (app) {
      const errorDiv = document.createElement('div');
      errorDiv.className = 'boot-error';
      errorDiv.textContent = `Erro ao inicializar Lenda de Luminário:\n${String(err)}`;
      app.appendChild(errorDiv);
    }
  }
}

// Inicializa quando o DOM estiver pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap);
} else {
  bootstrap();
}
