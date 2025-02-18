import { PLAYER_COLORS, GAME_CONFIG, TERRAIN_TYPES } from './constants.js';
import { SoundManager } from './SoundManager.js';
import { UIManager } from './UIManager.js';
import { BoardManager } from './BoardManager.js';
import { PieceManager } from './PieceManager.js';
import { VisibilityManager } from './VisibilityManager.js';

/**
 * Main game class that coordinates all game components
 */
export class Game {
    constructor() {
        this.board = [];
        this.allPlayers = PLAYER_COLORS;
        this.players = this.allPlayers.slice(0, 2); // Default to 2 players
        this.currentPlayer = this.players[0];
        this.selectedPiece = null;
        this.validMoves = [];
        this.capturedPieces = {
            white: [],
            black: [],
            red: [],
            blue: []
        };
        this.movesRemaining = {
            white: GAME_CONFIG.MOVES_PER_TURN,
            black: GAME_CONFIG.MOVES_PER_TURN,
            red: GAME_CONFIG.MOVES_PER_TURN,
            blue: GAME_CONFIG.MOVES_PER_TURN
        };
        this.exploredSquares = {
            white: new Set(),
            black: new Set(),
            red: new Set(),
            blue: new Set()
        };
        this.movedPieces = new Set();
        
        // Initialize managers
        this.soundManager = new SoundManager();
        this.uiManager = new UIManager(this);
        this.boardManager = new BoardManager(this);
        this.pieceManager = new PieceManager(this);
        this.visibilityManager = new VisibilityManager(this);
    }

    /**
     * Initialize a new game
     * @param {number} playerCount - Number of players
     */
    initializeGame(playerCount) {
        // Reset game state
        this.players = this.allPlayers.slice(0, playerCount);
        this.currentPlayer = this.players[0];
        this.board = this.boardManager.createEmptyBoard();
        this.selectedPiece = null;
        this.validMoves = [];
        this.capturedPieces = {
            white: [],
            black: [],
            red: [],
            blue: []
        };
        this.exploredSquares = {
            white: new Set(),
            black: new Set(),
            red: new Set(),
            blue: new Set()
        };
        this.movedPieces.clear();
        this.movesRemaining = {
            white: GAME_CONFIG.MOVES_PER_TURN,
            black: GAME_CONFIG.MOVES_PER_TURN,
            red: GAME_CONFIG.MOVES_PER_TURN,
            blue: GAME_CONFIG.MOVES_PER_TURN
        };

        // Initialize board
        this.boardManager.generateTerrain();
        this.boardManager.generateGoodieHuts();

        // Place players
        const edgePositions = this.boardManager.generateEdgePositions();
        const playerPositions = this.boardManager.assignPlayerPositions(edgePositions);

        // Place pieces for each player
        this.players.forEach(color => {
            this.placePiecesForPlayer(color, playerPositions[color]);
        });

        // Update UI
        this.updateGameState();
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
                    this.handleKingCapture(targetCell.color);
                    return;
                }
            } else {
                this.soundManager.playMove();
            }

            this.board[toRow][toCol] = piece;
            this.board[fromRow][fromCol] = null;
        }

        // Update game state
        this.movedPieces.add(`${toRow},${toCol}`);
        this.movesRemaining[this.currentPlayer]--;
        this.clearSelection();
        this.updateGameState();
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
                `Your expedition discovered a new ${pieceType}! It has been placed at position (${newPos.row}, ${newPos.col}).`,
                'reward'
            );
        } else {
            this.uiManager.showMessage(
                `Found a ${pieceType} in the goodie hut, but no space to place it! The piece has been lost.`,
                'warning'
            );
        }
    }

    /**
     * Handle king capture
     * @param {string} color - Color of captured king
     */
    handleKingCapture(color) {
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
        
        // Check if game is over
        if (this.players.length === 1) {
            this.gameOver(this.players[0]);
            return;
        }
        
        // Switch turn if it was the current player's turn
        if (this.currentPlayer === color) {
            this.switchTurn();
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
        this.movedPieces.clear();
        const currentPlayerIndex = this.players.indexOf(this.currentPlayer);
        const nextPlayer = this.players[(currentPlayerIndex + 1) % this.players.length];
        
        this.soundManager.playTurn();
        await this.uiManager.showTurnTransition(nextPlayer);
        
        // Count next player's pieces before switching
        let pieceCount = 0;
        for (let row = 0; row < this.board.length; row++) {
            for (let col = 0; col < this.board[row].length; col++) {
                if (this.board[row][col]?.color === nextPlayer) {
                    pieceCount++;
                }
            }
        }
        
        // Calculate new moves: carry over unused moves but cap at piece count
        const unusedMoves = this.movesRemaining[nextPlayer];
        this.movesRemaining[nextPlayer] = Math.min(GAME_CONFIG.MOVES_PER_TURN + unusedMoves, pieceCount);
        
        this.currentPlayer = nextPlayer;
        this.updateGameState();
    }

    /**
     * Update game state and UI
     */
    updateGameState() {
        const visibleSquares = this.visibilityManager.getVisibleSquares();
        
        // If no moves remaining, mark all current player's pieces as moved
        if (this.movesRemaining[this.currentPlayer] <= 0) {
            for (let row = 0; row < this.board.length; row++) {
                for (let col = 0; col < this.board[row].length; col++) {
                    if (this.board[row][col]?.color === this.currentPlayer) {
                        this.movedPieces.add(`${row},${col}`);
                    }
                }
            }
        }
        
        this.uiManager.createBoard(this.board, visibleSquares);
        this.uiManager.updateTurnIndicator(this.currentPlayer, this.movesRemaining[this.currentPlayer]);
    }
} 