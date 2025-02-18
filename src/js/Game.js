import { PLAYER_COLORS, GAME_CONFIG, TERRAIN_TYPES } from './constants.js';
import { SoundManager } from './SoundManager.js';
import { UIManager } from './UIManager.js';
import { BoardManager } from './BoardManager.js';
import { PieceManager } from './PieceManager.js';
import { VisibilityManager } from './VisibilityManager.js';
import { AIManager } from './AIManager.js';

/**
 * Main game class that coordinates all game components
 */
export class Game {
    constructor() {
        this.board = [];
        this.allPlayers = PLAYER_COLORS;
        this.players = [];
        this.currentPlayer = null;
        this.selectedPiece = null;
        this.validMoves = [];
        this.capturedPieces = {};
        this.movesRemaining = {};
        this.exploredSquares = {};
        this.movedPieces = new Set();
        this.isGameInProgress = false;
        this.isProcessingTurn = false;
        
        // Initialize managers
        this.soundManager = new SoundManager();
        this.uiManager = new UIManager(this);
        this.boardManager = new BoardManager(this);
        this.pieceManager = new PieceManager(this);
        this.visibilityManager = new VisibilityManager(this);
        this.aiManager = new AIManager(this);
        this.isOnlineGame = false;

        // Set up event listeners
        this.setupEventListeners();
    }

    /**
     * Set up event listeners for game controls
     */
    setupEventListeners() {
        const backToMenuButton = document.getElementById('backToMenu');
        if (backToMenuButton) {
            backToMenuButton.addEventListener('click', () => this.returnToMenu());
        }
    }

    /**
     * Return to the mode selection menu
     */
    returnToMenu() {
        // Hide game container
        const gameContainer = document.querySelector('.game-container');
        if (gameContainer) {
            gameContainer.style.display = 'none';
        }

        // Show mode selection menu
        const modeSelectionMenu = document.querySelector('.mode-selection-menu');
        if (modeSelectionMenu) {
            modeSelectionMenu.style.display = 'flex';
        }

        // Reset game state
        this.resetGameState();
    }

    /**
     * Reset all game state to initial values
     */
    resetGameState() {
        this.board = [];
        this.players = [];
        this.currentPlayer = null;
        this.selectedPiece = null;
        this.validMoves = [];
        this.capturedPieces = {};
        this.movesRemaining = {};
        this.exploredSquares = {};
        this.movedPieces.clear();
        this.isOnlineGame = false;
        this.aiManager.aiPlayers.clear();
    }

    /**
     * Initialize game state for the given player configuration
     */
    initializeGameState(playerCount) {
        // Initialize players array with the first N colors
        this.players = this.allPlayers.slice(0, playerCount);
        this.currentPlayer = this.players[0];

        // Initialize per-player state objects
        this.players.forEach(color => {
            this.capturedPieces[color] = [];
            this.movesRemaining[color] = GAME_CONFIG.MOVES_PER_TURN;
            this.exploredSquares[color] = new Set();
        });
    }

    /**
     * Initialize the game with the given configuration
     */
    async initializeGame(playerCount, isOnline = false, withAI = false) {
        console.log('Initializing game:', { playerCount, isOnline, withAI });
        
        try {
            // Prevent multiple initializations
            if (this.isGameInProgress) {
                console.log('Game already in progress, resetting first...');
                this.resetGameState();
            }

            this.isOnlineGame = isOnline;
            this.isGameInProgress = true;
            
            // Initialize game state
            this.initializeGameState(playerCount);
            
            console.log('Creating empty board...');
            this.board = this.boardManager.createEmptyBoard();
            
            console.log('Generating terrain...');
            await this.boardManager.generateTerrain();
            console.log('Generating goodie huts...');
            await this.boardManager.generateGoodieHuts();

            console.log('Placing players...');
            const edgePositions = this.boardManager.generateEdgePositions();
            const playerPositions = this.boardManager.assignPlayerPositions(edgePositions);

            for (const color of this.players) {
                console.log(`Placing pieces for ${color}...`);
                await this.placePiecesForPlayer(color, playerPositions[color]);
            }

            console.log('Initializing visibility...');
            this.players.forEach(color => {
                const visibleSquares = this.visibilityManager.getVisibleSquares(color);
                visibleSquares.forEach(square => {
                    this.exploredSquares[color].add(square);
                });
            });

            console.log('Updating game state...');
            await this.updateGameState();

            // If the first player is AI, trigger their turn after a short delay
            if (this.aiManager.isAIPlayer(this.currentPlayer)) {
                setTimeout(() => this.aiManager.makeAIMoves(), 500);
            }
            
            console.log('Game initialized successfully');
        } catch (error) {
            console.error('Error initializing game:', error);
            this.isGameInProgress = false;
            this.uiManager.showMessage('Failed to initialize game. Please try again.', 'warning');
            throw error;
        }
    }

    /**
     * Place initial pieces for a player
     * @param {string} color - Player color
     * @param {Object} position - Starting position
     */
    placePiecesForPlayer(color, position) {
        // Place king in the starting position
        this.board[position.row][position.col] = { type: 'king', color: color };
        
        // Find edge positions for main pieces (excluding pawns)
        const edgePositions = [];
        // First try adjacent positions to king
        for (let r = position.row - 1; r <= position.row + 1; r++) {
            for (let c = position.col - 1; c <= position.col + 1; c++) {
                if (this.boardManager.isInBounds(r, c) && 
                    this.boardManager.isEdgePosition(r, c) &&
                    !this.board[r][c] &&
                    !(r === position.row && c === position.col)) {
                    edgePositions.push({ row: r, col: c, priority: 1 }); // Priority 1 for adjacent positions
                }
            }
        }
        
        // If we need more positions, look for other edge positions within reasonable distance
        if (edgePositions.length < 2) {
            const maxDistance = 3; // Look up to 3 squares away
            for (let r = 0; r < this.board.length; r++) {
                for (let c = 0; c < this.board[r].length; c++) {
                    if (this.boardManager.isInBounds(r, c) && 
                        this.boardManager.isEdgePosition(r, c) &&
                        !this.board[r][c] &&
                        !(r === position.row && c === position.col)) {
                        
                        const distance = Math.abs(r - position.row) + Math.abs(c - position.col);
                        if (distance <= maxDistance && !edgePositions.some(pos => pos.row === r && pos.col === c)) {
                            edgePositions.push({ row: r, col: c, priority: distance });
                        }
                    }
                }
            }
        }

        // Sort positions by priority (lower number = higher priority)
        edgePositions.sort((a, b) => a.priority - b.priority);

        // Place 2 main pieces (excluding pawns) in edge positions
        const mainPieceTypes = ['rook', 'knight', 'bishop', 'queen'];
        for (let i = 0; i < 2 && edgePositions.length > 0; i++) {
            const pos = edgePositions.shift();
            const randomPiece = mainPieceTypes[Math.floor(Math.random() * mainPieceTypes.length)];
            this.board[pos.row][pos.col] = { type: randomPiece, color: color };
        }

        // Find positions for pawns (one square away from edge)
        const pawnPositions = [];
        const centerRow = Math.floor(this.board.length / 2);
        const centerCol = Math.floor(this.board[0].length / 2);

        // Helper function to get the direction towards center
        const getDirectionFromEdge = (row, col) => {
            const dRow = centerRow - row;
            const dCol = centerCol - col;
            return {
                rowDir: dRow === 0 ? 0 : dRow > 0 ? 1 : -1,
                colDir: dCol === 0 ? 0 : dCol > 0 ? 1 : -1
            };
        };

        // Find potential pawn positions around the king and other pieces
        const allPieces = [position, ...edgePositions.slice(0, 2)];
        for (const piece of allPieces) {
            const dir = getDirectionFromEdge(piece.row, piece.col);
            const pawnRow = piece.row + dir.rowDir;
            const pawnCol = piece.col + dir.colDir;

            if (this.boardManager.isInBounds(pawnRow, pawnCol) && 
                !this.board[pawnRow][pawnCol] &&
                !this.boardManager.isEdgePosition(pawnRow, pawnCol)) {
                pawnPositions.push({ row: pawnRow, col: pawnCol, 
                    priority: Math.abs(pawnRow - piece.row) + Math.abs(pawnCol - piece.col) });
            }
        }

        // If we still need more pawn positions, look in a wider area
        if (pawnPositions.length < 2) {
            const dir = getDirectionFromEdge(position.row, position.col);
            for (let r = position.row - 2; r <= position.row + 2; r++) {
                for (let c = position.col - 2; c <= position.col + 2; c++) {
                    if (this.boardManager.isInBounds(r, c) && 
                        !this.board[r][c] &&
                        !this.boardManager.isEdgePosition(r, c)) {
                        // Check if this position is "in front of" our pieces (towards center)
                        const isInFront = (r - position.row) * dir.rowDir >= 0 && 
                                        (c - position.col) * dir.colDir >= 0;
                        if (isInFront) {
                            pawnPositions.push({ 
                                row: r, 
                                col: c, 
                                priority: Math.abs(r - position.row) + Math.abs(c - position.col)
                            });
                        }
                    }
                }
            }
        }

        // Sort pawn positions by priority and place pawns
        pawnPositions.sort((a, b) => a.priority - b.priority);
        for (let i = 0; i < 2 && pawnPositions.length > 0; i++) {
            const pos = pawnPositions.shift();
            this.board[pos.row][pos.col] = { type: 'pawn', color: color };
        }
    }

    /**
     * Handle square click event
     * @param {number} row - Clicked row
     * @param {number} col - Clicked column
     * @param {Event} event - Click event
     */
    handleSquareClick(row, col, event) {
        const visibleSquares = this.visibilityManager.getVisibleSquares();
        if (!visibleSquares.has(`${row},${col}`)) {
            return; // Can't interact with fogged squares
        }

        const piece = this.board[row][col];

        // Check if no moves remaining
        if (this.movesRemaining[this.currentPlayer] <= 0) {
            const endTurnButton = document.querySelector('.end-turn-button');
            if (endTurnButton) {
                endTurnButton.classList.add('blink');
            }
            return;
        }

        // Check if piece has already moved this turn
        if (piece && piece.color === this.currentPlayer && this.movedPieces.has(`${row},${col}`)) {
            this.uiManager.showMessage("This piece has already moved this turn!", "warning");
            return;
        }

        if (this.selectedPiece) {
            const selectedRow = this.selectedPiece.row;
            const selectedCol = this.selectedPiece.col;

            if (this.isValidMove(selectedRow, selectedCol, row, col)) {
                this.movePiece(selectedRow, selectedCol, row, col);
            } else {
                this.clearSelection();
                if (piece && piece.color === this.currentPlayer && !this.movedPieces.has(`${row},${col}`)) {
                    this.selectPiece(row, col);
                }
            }
        } else if (piece && piece.color === this.currentPlayer && !this.movedPieces.has(`${row},${col}`)) {
            this.selectPiece(row, col);
        }
    }

    /**
     * Select a piece
     * @param {number} row - Piece row
     * @param {number} col - Piece column
     */
    selectPiece(row, col) {
        this.selectedPiece = { row, col };
        this.validMoves = this.pieceManager.getValidMoves(row, col);
        this.updateGameState();
    }

    /**
     * Clear piece selection
     */
    clearSelection() {
        this.selectedPiece = null;
        this.validMoves = [];
        this.updateGameState();
    }

    /**
     * Check if a move is valid
     * @param {number} fromRow - Starting row
     * @param {number} fromCol - Starting column
     * @param {number} toRow - Target row
     * @param {number} toCol - Target column
     * @returns {boolean} Whether the move is valid
     */
    isValidMove(fromRow, fromCol, toRow, toCol) {
        return this.validMoves.some(move => 
            move.row === toRow && move.col === toCol
        );
    }

    /**
     * Move a piece
     * @param {number} fromRow - Starting row
     * @param {number} fromCol - Starting column
     * @param {number} toRow - Target row
     * @param {number} toCol - Target column
     */
    async movePiece(fromRow, fromCol, toRow, toCol) {
        const piece = this.board[fromRow][fromCol];
        const targetCell = this.board[toRow][toCol];

        // First, mark the piece as moved and decrease moves
        this.movedPieces.add(`${toRow},${toCol}`);
        this.movesRemaining[this.currentPlayer]--;

        // Handle goodie hut capture
        if (targetCell?.terrain === TERRAIN_TYPES.GOODIE_HUT) {
            this.soundManager.playGoodieHut();
            this.board[toRow][toCol] = piece;
            this.board[fromRow][fromCol] = null;
            this.handleGoodieHut(toRow, toCol);
        } else {
            // Handle normal move/capture
            if (targetCell && !targetCell.terrain) {
                this.soundManager.playCapture();
                
                if (targetCell.type === 'king') {
                    this.board[toRow][toCol] = piece;
                    this.board[fromRow][fromCol] = null;
                    await this.updateGameState(); // Update state before handling king capture
                    await this.handleKingCapture(targetCell.color);
                    return;
                }
            } else {
                this.soundManager.playMove();
            }

            this.board[toRow][toCol] = piece;
            this.board[fromRow][fromCol] = null;
        }

        this.clearSelection();
        await this.updateGameState();
    }

    /**
     * Handle goodie hut effects
     * @param {number} row - Goodie hut row
     * @param {number} col - Goodie hut column
     */
    handleGoodieHut(row, col) {
        const availablePieces = ['rook', 'knight', 'bishop', 'queen', 'pawn'];
        const pieceType = availablePieces[Math.floor(Math.random() * availablePieces.length)];
        
        // Find a valid adjacent position for the new piece
        const adjacentPositions = [
            { row: row - 1, col: col },
            { row: row + 1, col: col },
            { row: row, col: col - 1 },
            { row: row, col: col + 1 }
        ].filter(pos => 
            this.boardManager.isInBounds(pos.row, pos.col) && 
            !this.board[pos.row][pos.col]
        );

        if (adjacentPositions.length > 0) {
            const newPos = adjacentPositions[Math.floor(Math.random() * adjacentPositions.length)];
            this.board[newPos.row][newPos.col] = { type: pieceType, color: this.currentPlayer };
            this.uiManager.showMessage(
                `You found a new ${pieceType}!`,
                'reward'
            );
        } else {
            this.uiManager.showMessage(
                `Found a ${pieceType}, but no space to place it!`,
                'warning'
            );
        }
    }

    /**
     * Handle king capture
     * @param {string} color - Color of captured king
     */
    async handleKingCapture(color) {
        // First update the game state to show the current board
        await this.updateGameState();
        
        // Remove all pieces of the defeated player
        for (let row = 0; row < this.board.length; row++) {
            for (let col = 0; col < this.board[row].length; col++) {
                if (this.board[row][col]?.color === color) {
                    this.board[row][col] = null;
                }
            }
        }
        
        // Remove the player from the game
        this.players = this.players.filter(player => player !== color);
        
        // Show defeat message
        this.uiManager.showMessage(`${color.charAt(0).toUpperCase() + color.slice(1)} has been defeated!`);
        
        // Check if game is over (human player eliminated or only one player remains)
        const isHumanEliminated = !this.players.includes('white');
        const onlyOnePlayerLeft = this.players.length === 1;
        
        if (isHumanEliminated || onlyOnePlayerLeft) {
            const winner = isHumanEliminated ? this.players[0] : 'white';
            this.gameOver(winner);
            return;
        }
        
        // Update game state to show removed pieces
        await this.updateGameState();
        
        // Switch turn if it was the current player's turn
        if (this.currentPlayer === color) {
            await this.switchTurn();
        }
    }

    /**
     * Handle game over
     * @param {string} winner - Winning player's color
     */
    gameOver(winner) {
        this.soundManager.playGameOver();
        this.uiManager.showGameOver(winner);
    }

    /**
     * Switch to next player's turn
     */
    async switchTurn() {
        if (this.isProcessingTurn) {
            console.log('Turn switch already in progress, ignoring request');
            return;
        }

        try {
            this.isProcessingTurn = true;
            
            // Clear any existing selection
            this.clearSelection();
            
            // Get next player
            const currentIndex = this.players.indexOf(this.currentPlayer);
            const nextPlayer = this.players[(currentIndex + 1) % this.players.length];
            
            // Show turn transition screen
            if (!this.aiManager.isAIPlayer(nextPlayer)) {
                await this.uiManager.showTurnTransition(nextPlayer);
            }
            
            // Update game state
            this.currentPlayer = nextPlayer;
            this.movesRemaining[nextPlayer] = GAME_CONFIG.MOVES_PER_TURN;
            this.movedPieces.clear();
            
            // Update UI
            await this.updateGameState();
            
            // If next player is AI, trigger their turn
            if (this.aiManager.isAIPlayer(nextPlayer)) {
                setTimeout(() => this.aiManager.makeAIMoves(), 500);
            }
        } catch (error) {
            console.error('Error switching turns:', error);
            this.uiManager.showMessage('Failed to switch turns. Please try again.', 'warning');
        } finally {
            this.isProcessingTurn = false;
        }
    }

    /**
     * Update game state and UI
     */
    async updateGameState() {
        try {
            const visibleSquares = this.visibilityManager.getVisibleSquares(this.currentPlayer);
            this.uiManager.createBoard(this.board, visibleSquares);
            this.uiManager.updateTurnIndicator(this.currentPlayer, this.movesRemaining[this.currentPlayer]);
        } catch (error) {
            console.error('Error updating game state:', error);
            this.uiManager.showMessage('Failed to update game state. Please refresh the page.', 'warning');
        }
    }
} 