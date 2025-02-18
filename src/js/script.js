import { Game } from './Game.js';

// Start the game only after DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded');
    let game = new Game();
    let isInitializing = false;
    
    // Set up mode selection handlers
    const newGameBtn = document.getElementById('newGameBtn');
    const multiPlayerBtn = document.getElementById('multiPlayerMode');
    const startButton = document.getElementById('startGame');
    const gameContainer = document.querySelector('.game-container');
    const modeSelectionMenu = document.querySelector('.mode-selection-menu');
    const setupMenu = document.querySelector('.ai-setup-menu');
    const startGameSetupBtn = document.getElementById('startGameSetup');
    const backFromSetupBtn = document.getElementById('backFromSetup');
    const totalPlayerCountSelect = document.getElementById('totalPlayerCount');

    console.log('Elements found:', { 
        newGameBtn, 
        multiPlayerBtn, 
        startButton, 
        gameContainer, 
        modeSelectionMenu,
        setupMenu,
        startGameSetupBtn,
        backFromSetupBtn,
        totalPlayerCountSelect
    });

    // Initialize player setup visibility
    function initializePlayerSetup() {
        const playerCount = parseInt(totalPlayerCountSelect.value);
        const setupSections = [
            document.getElementById('player1Setup'),
            document.getElementById('player2Setup'),
            document.getElementById('player3Setup'),
            document.getElementById('player4Setup')
        ];

        setupSections.forEach((section, index) => {
            if (section) {
                section.style.display = index < playerCount ? 'flex' : 'none';
                
                // Reset select to "Human" when hidden
                if (index >= playerCount) {
                    const select = section.querySelector('select');
                    if (select) select.value = 'human';
                }
            }
        });
    }

    // New Game button
    newGameBtn.addEventListener('click', () => {
        console.log('New Game button clicked');
        modeSelectionMenu.style.display = 'none';
        setupMenu.style.display = 'flex';
        initializePlayerSetup();
    });

    // Handle player count changes
    totalPlayerCountSelect.addEventListener('change', () => {
        initializePlayerSetup();
    });

    // Game setup menu handlers
    startGameSetupBtn.addEventListener('click', async () => {
        if (isInitializing) {
            console.log('Game initialization already in progress');
            return;
        }

        try {
            isInitializing = true;
            console.log('Start Game Setup button clicked');
            
            const totalPlayers = parseInt(totalPlayerCountSelect.value);
            const playerTypes = [];
            
            // Collect player types (human/ai)
            for (let i = 1; i <= totalPlayers; i++) {
                const playerType = document.getElementById(`player${i}Type`).value;
                playerTypes.push(playerType);
            }
            
            console.log('Starting game with configuration:', { totalPlayers, playerTypes });
            setupMenu.style.display = 'none';
            gameContainer.style.display = 'flex';
            startButton.style.display = 'block';
            startButton.textContent = 'Restart Game';
            
            // Initialize the game with the player configuration
            await game.initializeGame(totalPlayers, false);
            
            // Add AI players based on the configuration
            const playerColors = ['white', 'black', 'red', 'blue'];
            playerTypes.forEach((type, index) => {
                if (type === 'ai') {
                    game.aiManager.addAIPlayer(playerColors[index]);
                }
            });

            // If the first player is AI, end turn immediately
            if (playerTypes[0] === 'ai') {
                console.log('First player is AI, ending turn automatically');
                await game.switchTurn();
            }
        } catch (error) {
            console.error('Failed to start game:', error);
            setupMenu.style.display = 'flex';
            gameContainer.style.display = 'none';
        } finally {
            isInitializing = false;
        }
    });

    backFromSetupBtn.addEventListener('click', () => {
        setupMenu.style.display = 'none';
        modeSelectionMenu.style.display = 'flex';
    });

    // Disable multiplayer for now
    multiPlayerBtn.disabled = true;
    multiPlayerBtn.style.opacity = '0.6';
    multiPlayerBtn.style.cursor = 'not-allowed';

    // Start/Restart button
    startButton.addEventListener('click', async () => {
        if (isInitializing) {
            console.log('Game initialization already in progress');
            return;
        }

        try {
            isInitializing = true;
            console.log('Start/Restart button clicked');
            
            const totalPlayers = parseInt(totalPlayerCountSelect.value);
            const playerTypes = [];
            
            // Re-collect player types for restart
            for (let i = 1; i <= totalPlayers; i++) {
                const playerType = document.getElementById(`player${i}Type`).value;
                playerTypes.push(playerType);
            }
            
            // Initialize the game with the player configuration
            await game.initializeGame(totalPlayers, false);
            
            // Add AI players based on the configuration
            const playerColors = ['white', 'black', 'red', 'blue'];
            playerTypes.forEach((type, index) => {
                if (type === 'ai') {
                    game.aiManager.addAIPlayer(playerColors[index]);
                }
            });

            // If the first player is AI, end turn immediately
            if (playerTypes[0] === 'ai') {
                console.log('First player is AI, ending turn automatically');
                await game.switchTurn();
            }
        } catch (error) {
            console.error('Failed to restart game:', error);
        } finally {
            isInitializing = false;
        }
    });

    // End turn button
    const endTurnButton = document.querySelector('.end-turn-button');
    if (endTurnButton) {
        endTurnButton.addEventListener('click', async () => {
            if (!game.isProcessingTurn) {
                console.log('End turn button clicked');
                await game.switchTurn();
            }
        });
    }

    console.log('All event listeners set up');
}); 