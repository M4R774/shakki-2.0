import { createElement, capitalizeFirstLetter, animateElement, removeElementAfterDelay } from './utils.js';
import { TERRAIN_TYPES } from './constants.js';

/**
 * Manages all UI-related functionality for the game
 */
export class UIManager {
    constructor(game) {
        this.game = game;
        this.chessboard = document.querySelector('.chessboard');
        this.turnIndicator = document.querySelector('.turn-indicator');
        this.endTurnButton = document.querySelector('.end-turn-button');
        this.messageContainer = null;
        this.transitionOverlay = null;
        this.ensureChessboard();
    }

    /**
     * Ensure the chessboard element exists
     */
    ensureChessboard() {
        if (!this.chessboard) {
            console.log('Creating chessboard element');
            this.chessboard = createElement('div', { className: 'chessboard' });
            const gameContainer = document.querySelector('.game-container');
            if (gameContainer) {
                gameContainer.appendChild(this.chessboard);
            } else {
                console.error('Game container not found');
            }
        }
    }

    /**
     * Create and render the game board
     * @param {Array} board - The game board data
     * @param {Set} visibleSquares - Set of visible square coordinates
     */
    createBoard(board, visibleSquares) {
        this.ensureChessboard();
        
        console.log('Creating board with dimensions:', board.length, 'x', board[0]?.length);
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
        const isAITurn = this.game.aiManager.isAIPlayer(this.game.currentPlayer);
        const isVisible = !isAITurn && visibleSquares.has(`${row},${col}`);
        const isExplored = this.game.exploredSquares[this.game.currentPlayer]?.has(`${row},${col}`);
        
        const square = createElement('div', {
            className: `square ${(row + col) % 2 === 0 ? 'white' : 'black'}`,
            dataset: { row, col }
        });

        // Add fog of war styling
        if (!isVisible) {
            square.classList.add('fog');
            if (isExplored) {
                square.classList.add('explored');
                // Only show terrain in explored but not visible squares
                if (cell?.terrain) {
                    this.addTerrainToSquare(square, cell);
                }
                // Do not show pieces in explored but not visible squares
            }
        } else {
            // Show everything in visible squares
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
        if (!this.turnIndicator) {
            this.turnIndicator = document.querySelector('.turn-indicator');
        }

        if (this.turnIndicator) {
            this.turnIndicator.textContent = `${capitalizeFirstLetter(currentPlayer)}'s Turn (${movesRemaining} moves remaining)`;
            this.turnIndicator.className = `turn-indicator ${currentPlayer}`;
        }

        if (!this.endTurnButton) {
            this.endTurnButton = document.querySelector('.end-turn-button');
        }

        if (this.endTurnButton) {
            const isAITurn = this.game.aiManager.isAIPlayer(currentPlayer);
            this.endTurnButton.disabled = isAITurn;
            this.endTurnButton.classList.toggle('blink', movesRemaining <= 0 && !isAITurn);
        }
    }

    /**
     * Show a game message
     * @param {string} message - Message to display
     * @param {string} type - Message type (info, warning, reward, tech)
     */
    async showMessage(message, type = 'info') {
        // Don't show messages during AI turns unless they are warnings
        if (this.game.aiManager.isAIPlayer(this.game.currentPlayer) && type !== 'warning') {
            return;
        }

        if (!this.messageContainer) {
            this.messageContainer = document.querySelector('.message-container');
            if (!this.messageContainer) {
                this.messageContainer = createElement('div', { className: 'message-container' });
                document.body.appendChild(this.messageContainer);
            }
        }

        const messageElement = createElement('div', { 
            className: `game-message ${type}`,
            'aria-live': 'polite'  // For accessibility
        });
        
        const icon = createElement('span', { className: 'message-icon' }, this.getMessageIcon(type));
        const text = createElement('span', { className: 'message-text' }, message);
        
        messageElement.appendChild(icon);
        messageElement.appendChild(text);
        this.messageContainer.appendChild(messageElement);

        try {
            await animateElement(messageElement, 'fadeIn 0.5s ease-out, fadeOut 0.5s ease-in 2.5s');
            await removeElementAfterDelay(messageElement, 3000);
        } catch (error) {
            console.error('Error animating message:', error);
            messageElement.remove();
        }

        // Remove container if empty
        if (this.messageContainer && this.messageContainer.children.length === 0) {
            this.messageContainer.remove();
            this.messageContainer = null;
        }
    }

    /**
     * Get icon for message type
     * @param {string} type - Message type
     * @returns {string} Icon for the message type
     */
    getMessageIcon(type) {
        switch (type) {
            case 'reward': return '🎁';
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
        return new Promise((resolve) => {
            // Remove any existing transition overlay
            if (this.transitionOverlay) {
                this.transitionOverlay.remove();
            }

            this.transitionOverlay = createElement('div', {
                className: `turn-transition ${nextPlayer}`
            });

            const content = createElement('div', { className: 'transition-content' });
            content.innerHTML = `
                <h2>${capitalizeFirstLetter(nextPlayer)}'s Turn</h2>
                <p>Click the button when you're ready to play</p>
                <button class="start-turn-button">Start Turn</button>
            `;
            
            this.transitionOverlay.appendChild(content);
            document.body.appendChild(this.transitionOverlay);
            
            // Disable game container interaction during transition
            const gameContainer = document.querySelector('.game-container');
            if (gameContainer) {
                gameContainer.style.pointerEvents = 'none';
            }
            
            const button = this.transitionOverlay.querySelector('.start-turn-button');
            const cleanup = () => {
                if (this.transitionOverlay) {
                    this.transitionOverlay.remove();
                    this.transitionOverlay = null;
                }
                if (gameContainer) {
                    gameContainer.style.pointerEvents = 'auto';
                }
                resolve();
            };

            // Handle both click and keyboard events
            button.addEventListener('click', cleanup);
            button.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    cleanup();
                }
            });
            button.focus();
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
            <div class="button-group">
                <button onclick="location.reload()">Play Again</button>
                <button onclick="document.querySelector('.game-over-overlay').remove(); document.querySelector('.mode-selection-menu').style.display = 'flex'; document.querySelector('.game-container').style.display = 'none';">Back to Menu</button>
            </div>
        `;
        
        overlay.appendChild(message);
        document.body.appendChild(overlay);
        
        const gameContainer = document.querySelector('.game-container');
        gameContainer.style.pointerEvents = 'none';
    }
} 