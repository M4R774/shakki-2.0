import { Game } from './Game.js';

// Start the game only after DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    const game = new Game();
    game.initializeGame(2); // Start with 2 players by default
}); 