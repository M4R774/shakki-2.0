import { Game } from './Game.js';

// Start the game only after DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded');
    const game = new Game();
    
    // Set up mode selection handlers
    const localBtn = document.getElementById('localMode');
    const aiBtn = document.getElementById('aiMode');
    const multiPlayerBtn = document.getElementById('multiPlayerMode');
    const startButton = document.getElementById('startGame');
    const gameContainer = document.querySelector('.game-container');
    const modeSelectionMenu = document.querySelector('.mode-selection-menu');

    console.log('Elements found:', { 
        localBtn, 
        aiBtn, 
        multiPlayerBtn, 
        startButton, 
        gameContainer, 
        modeSelectionMenu 
    });

    // Local game mode
    localBtn.addEventListener('click', () => {
        console.log('Local button clicked');
        modeSelectionMenu.style.display = 'none';
        gameContainer.style.display = 'flex';
        startButton.style.display = 'block';
        startButton.textContent = 'Restart Game';
        
        const playerCount = parseInt(document.getElementById('playerCount').value);
        console.log('Starting local game with', playerCount, 'players');
        game.initializeGame(playerCount, false, false);
    });

    // AI game mode
    aiBtn.addEventListener('click', () => {
        console.log('AI button clicked');
        modeSelectionMenu.style.display = 'none';
        gameContainer.style.display = 'flex';
        startButton.style.display = 'block';
        startButton.textContent = 'Restart Game';
        
        console.log('Starting AI game');
        game.initializeGame(2, false, true);
        game.aiManager.addAIPlayer('black');
    });

    // Disable multiplayer for now
    multiPlayerBtn.disabled = true;
    multiPlayerBtn.style.opacity = '0.6';
    multiPlayerBtn.style.cursor = 'not-allowed';

    // Start/Restart button
    startButton.addEventListener('click', () => {
        console.log('Start/Restart button clicked');
        if (game.aiManager.aiPlayers.size > 0) {
            // Restart AI game
            console.log('Restarting AI game');
            game.initializeGame(2, false, true);
            game.aiManager.addAIPlayer('black');
        } else {
            // Restart local game
            const playerCount = parseInt(document.getElementById('playerCount').value);
            console.log('Restarting local game with', playerCount, 'players');
            game.initializeGame(playerCount, false, false);
        }
    });

    // End turn button
    const endTurnButton = document.querySelector('.end-turn-button');
    if (endTurnButton) {
        endTurnButton.addEventListener('click', () => {
            console.log('End turn button clicked');
            game.switchTurn();
        });
    }

    console.log('All event listeners set up');
}); 