import { createElement, capitalizeFirstLetter, animateElement, removeElementAfterDelay } from './utils.js';
import { TERRAIN_TYPES } from './constants.js';

/**
 * Manages all UI-related functionality for the game
 */
export class UIManager {
    constructor(game) {
        this.game = game;
        this.chessboard = document.querySelector('.chessboard');
        this.setupEventListeners();
    }

    /**
     * Set up event listeners for UI elements
     */
    setupEventListeners() {
        const playerCount = document.getElementById('playerCount');
        const startButton = document.getElementById('startGame');
        const endTurnButton = document.querySelector('.end-turn-button');
        
        startButton.addEventListener('click', () => {
            this.game.initializeGame(parseInt(playerCount.value));
            startButton.textContent = 'New Game';
        });

        if (endTurnButton) {
            endTurnButton.addEventListener('click', () => {
                this.game.switchTurn();
            });
        }
    }

    /**
     * Create and render the game board
     * @param {Array} board - The game board data
     * @param {Set} visibleSquares - Set of visible square coordinates
     */
    createBoard(board, visibleSquares) {
        this.chessboard.innerHTML = '';
        
        for (let row = 0; row < board.length; row++) {
            for (let col = 0; col < board[row].length; col++) {
                const square = this.createSquare(row, col, board[row][col], visibleSquares);
                
                // Add valid move indicators only for visible squares
                if (this.game.selectedPiece && 
                    this.game.validMoves && 
                    visibleSquares.has(`${row},${col}`)) {
                    const isValidMove = this.game.validMoves.some(move => 
                        move.row === row && move.col === col
                    );
                    if (isValidMove) {
                        const targetCell = board[row][col];
                        // Show capture indicator for enemy pieces and goodie huts
                        if (targetCell && (
                            targetCell.terrain === TERRAIN_TYPES.GOODIE_HUT || 
                            (targetCell.color && targetCell.color !== this.game.currentPlayer)
                        )) {
                            square.classList.add('valid-capture');
                        } else {
                            square.classList.add('valid-move');
                        }
                    }
                }
                
                this.chessboard.appendChild(square);
            }
        }
    }

    /**
     * Create a single square element for the board
     * @param {number} row - Row index
     * @param {number} col - Column index
     * @param {Object} cell - Cell data
     * @param {Set} visibleSquares - Set of visible square coordinates
     * @returns {HTMLElement} The created square element
     */
    createSquare(row, col, cell, visibleSquares) {
        const isVisible = visibleSquares.has(`${row},${col}`);
        const isExplored = this.game.exploredSquares[this.game.currentPlayer].has(`${row},${col}`);
        
        const square = createElement('div', {
            className: `square ${(row + col) % 2 === 0 ? 'white' : 'black'}`,
            dataset: { row, col }
        });

        if (!isVisible) {
            square.classList.add('fog');
            if (isExplored) {
                square.classList.add('explored');
                if (cell?.terrain) {
                    this.addTerrainToSquare(square, cell);
                }
            }
        } else {
            if (cell?.terrain) {
                this.addTerrainToSquare(square, cell);
            } else if (cell) {
                const piece = this.createPiece(cell);
                if (this.game.movedPieces.has(`${row},${col}`)) {
                    piece.classList.add('moved');
                }
                square.appendChild(piece);
            }
        }

        square.addEventListener('click', (e) => this.game.handleSquareClick(row, col, e));
        return square;
    }

    /**
     * Add terrain visuals to a square
     * @param {HTMLElement} square - The square element
     * @param {Object} cell - Cell data containing terrain information
     */
    addTerrainToSquare(square, cell) {
        square.classList.add(cell.terrain);
        if (cell.variant) {
            square.dataset.variant = cell.variant;
        }
    }

    /**
     * Create a piece element
     * @param {Object} pieceData - Data for the piece
     * @returns {HTMLElement} The created piece element
     */
    createPiece(pieceData) {
        return createElement('div', {
            className: 'piece',
            dataset: {
                type: pieceData.type,
                color: pieceData.color
            }
        }, this.getPieceSymbol(pieceData));
    }

    /**
     * Get the Unicode symbol for a piece
     * @param {Object} pieceData - Data for the piece
     * @returns {string} Unicode symbol for the piece
     */
    getPieceSymbol(pieceData) {
        const pieces = {
            white: { king: '♔', queen: '♕', rook: '♖', bishop: '♗', knight: '♘', pawn: '♙' },
            black: { king: '♚', queen: '♛', rook: '♜', bishop: '♝', knight: '♞', pawn: '♟' },
            red: { king: '♔', queen: '♕', rook: '♖', bishop: '♗', knight: '♘', pawn: '♙' },
            blue: { king: '♔', queen: '♕', rook: '♖', bishop: '♗', knight: '♘', pawn: '♙' }
        };
        return pieces[pieceData.color][pieceData.type];
    }

    /**
     * Update the turn indicator
     * @param {string} currentPlayer - Current player color
     * @param {number} movesRemaining - Number of moves remaining
     */
    updateTurnIndicator(currentPlayer, movesRemaining) {
        const turnIndicator = document.querySelector('.turn-indicator');
        turnIndicator.textContent = `${capitalizeFirstLetter(currentPlayer)}'s Turn (${movesRemaining} moves remaining)`;
        turnIndicator.className = `turn-indicator ${currentPlayer}`;

        const endTurnButton = document.querySelector('.end-turn-button');
        if (endTurnButton) {
            endTurnButton.disabled = false; // Always enable the end turn button
            endTurnButton.classList.toggle('blink', movesRemaining <= 0);
        }
    }

    /**
     * Show a game message
     * @param {string} message - Message to display
     * @param {string} type - Message type (info, warning, reward, tech)
     */
    async showMessage(message, type = 'info') {
        let messageContainer = document.querySelector('.message-container');
        if (!messageContainer) {
            messageContainer = createElement('div', { className: 'message-container' });
            document.body.appendChild(messageContainer);
        }

        const messageElement = createElement('div', { className: `game-message ${type}` });
        
        // Add icon
        const icon = createElement('span', { className: 'message-icon' }, this.getMessageIcon(type));
        const text = createElement('span', { className: 'message-text' }, message);
        
        messageElement.appendChild(icon);
        messageElement.appendChild(text);
        messageContainer.appendChild(messageElement);

        // Animate and remove
        await animateElement(messageElement, 'slideInDown 0.5s ease-out, fadeOut 0.5s ease-in 2.5s');
        await removeElementAfterDelay(messageElement, 3000);

        // Remove container if empty
        if (messageContainer.children.length === 0) {
            messageContainer.remove();
        }
    }

    /**
     * Get icon for message type
     * @param {string} type - Message type
     * @returns {string} Icon for the message type
     */
    getMessageIcon(type) {
        switch (type) {
            case 'reward': return '🏕️';
            case 'tech': return '🔬';
            case 'warning': return '⚠️';
            default: return 'ℹ️';
        }
    }

    /**
     * Show the turn transition screen
     * @param {string} nextPlayer - Next player's color
     * @returns {Promise} Resolves when the transition is complete
     */
    showTurnTransition(nextPlayer) {
        return new Promise(resolve => {
            const transition = createElement('div', {
                className: `turn-transition ${nextPlayer}`
            });

            transition.innerHTML = `
                <h2>${capitalizeFirstLetter(nextPlayer)}'s Turn</h2>
                <p>Click the button when you're ready to play</p>
                <button>Start Turn</button>
            `;
            
            document.body.appendChild(transition);
            
            const gameContainer = document.querySelector('.game-container');
            gameContainer.style.pointerEvents = 'none';
            
            const button = transition.querySelector('button');
            button.addEventListener('click', () => {
                transition.remove();
                gameContainer.style.pointerEvents = 'auto';
                resolve();
            });
        });
    }

    /**
     * Show the game over screen
     * @param {string} winner - Winner's color
     */
    showGameOver(winner) {
        const overlay = createElement('div', { className: 'game-over-overlay' });
        const message = createElement('div', { className: 'game-over-message' });
        
        message.innerHTML = `
            <h2>Game Over!</h2>
            <p>${capitalizeFirstLetter(winner)} is victorious!</p>
            <button onclick="location.reload()">Play Again</button>
        `;
        
        overlay.appendChild(message);
        document.body.appendChild(overlay);
        
        const gameContainer = document.querySelector('.game-container');
        gameContainer.style.pointerEvents = 'none';
    }
} 