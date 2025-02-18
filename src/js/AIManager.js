/**
 * Manages AI players and their moves
 */
export class AIManager {
    constructor(game) {
        this.game = game;
        this.aiPlayers = new Set();
    }

    /**
     * Add an AI player
     * @param {string} color - Color of the AI player
     */
    addAIPlayer(color) {
        this.aiPlayers.add(color);
    }

    /**
     * Check if a player is AI
     * @param {string} color - Color to check
     * @returns {boolean} Whether the player is AI
     */
    isAIPlayer(color) {
        return this.aiPlayers.has(color);
    }

    /**
     * Make moves for the current AI player
     */
    async makeAIMoves() {
        if (!this.isAIPlayer(this.game.currentPlayer)) {
            return;
        }

        // Collect and execute all moves at once
        const moves = [];
        while (this.game.movesRemaining[this.game.currentPlayer] > 0) {
            const move = this.findBestMove();
            if (!move) break;
            moves.push(move);
            
            // Update internal game state without visual updates
            const piece = this.game.board[move.fromRow][move.fromCol];
            const targetSquare = this.game.board[move.toRow][move.toCol];
            
            // Handle captures silently
            if (targetSquare && !targetSquare.terrain) {
                if (targetSquare.type === 'king') {
                    this.game.handleKingCapture(targetSquare.color);
                    return; // End turn immediately if a king is captured
                }
            }

            // Update board state
            this.game.board[move.toRow][move.toCol] = piece;
            this.game.board[move.fromRow][move.fromCol] = null;
            this.game.movedPieces.add(`${move.toRow},${move.toCol}`);
            this.game.movesRemaining[this.game.currentPlayer]--;

            // Handle goodie hut captures silently
            if (targetSquare?.terrain === 'goodieHut') {
                this.handleGoodieHutSilently(move.toRow, move.toCol);
            }
        }

        // Switch turn without transition
        this.game.switchTurn();
    }

    /**
     * Handle goodie hut capture without visual feedback
     */
    handleGoodieHutSilently(row, col) {
        const availablePieces = ['rook', 'knight', 'bishop', 'queen', 'pawn'];
        const pieceType = availablePieces[Math.floor(Math.random() * availablePieces.length)];
        
        // Find a valid adjacent position for the new piece
        const adjacentPositions = [
            { row: row - 1, col: col },
            { row: row + 1, col: col },
            { row: row, col: col - 1 },
            { row: row, col: col + 1 }
        ].filter(pos => 
            this.game.boardManager.isInBounds(pos.row, pos.col) && 
            !this.game.board[pos.row][pos.col]
        );

        if (adjacentPositions.length > 0) {
            const newPos = adjacentPositions[Math.floor(Math.random() * adjacentPositions.length)];
            this.game.board[newPos.row][newPos.col] = { 
                type: pieceType, 
                color: this.game.currentPlayer 
            };
        }
    }

    /**
     * Find the best move for the current AI player
     * @returns {Object|null} The best move found, or null if no moves available
     */
    findBestMove() {
        const possibleMoves = [];
        const currentColor = this.game.currentPlayer;

        // Collect all possible moves for all pieces
        for (let row = 0; row < this.game.board.length; row++) {
            for (let col = 0; col < this.game.board[row].length; col++) {
                const piece = this.game.board[row][col];
                if (piece && piece.color === currentColor && !this.game.movedPieces.has(`${row},${col}`)) {
                    const validMoves = this.game.pieceManager.getValidMoves(row, col);
                    validMoves.forEach(move => {
                        possibleMoves.push({
                            fromRow: row,
                            fromCol: col,
                            toRow: move.row,
                            toCol: move.col,
                            score: this.evaluateMove(row, col, move.row, move.col)
                        });
                    });
                }
            }
        }

        if (possibleMoves.length === 0) {
            return null;
        }

        // Sort moves by score and pick the best one
        possibleMoves.sort((a, b) => b.score - a.score);
        return possibleMoves[0];
    }

    /**
     * Evaluate a move's score
     * @param {number} fromRow - Starting row
     * @param {number} fromCol - Starting column
     * @param {number} toRow - Target row
     * @param {number} toCol - Target column
     * @returns {number} Score for the move
     */
    evaluateMove(fromRow, fromCol, toRow, toCol) {
        let score = 0;
        const piece = this.game.board[fromRow][fromCol];
        const targetSquare = this.game.board[toRow][toCol];

        // Base score for piece values
        const pieceValues = {
            'pawn': 1,
            'knight': 3,
            'bishop': 3,
            'rook': 5,
            'queen': 9,
            'king': 0 // King doesn't move for captures typically
        };

        // Prioritize captures
        if (targetSquare && !targetSquare.terrain) {
            score += pieceValues[targetSquare.type] * 10;
            if (targetSquare.type === 'king') {
                score += 1000; // Heavily prioritize king captures
            }
        }

        // Prioritize goodie hut captures
        if (targetSquare?.terrain === 'goodieHut') {
            score += 15;
        }

        // Prioritize center control for non-king pieces
        if (piece.type !== 'king') {
            const centerRow = Math.floor(this.game.board.length / 2);
            const centerCol = Math.floor(this.game.board[0].length / 2);
            const currentDistanceToCenter = Math.abs(fromRow - centerRow) + Math.abs(fromCol - centerCol);
            const newDistanceToCenter = Math.abs(toRow - centerRow) + Math.abs(toCol - centerCol);
            if (newDistanceToCenter < currentDistanceToCenter) {
                score += 2;
            }
        }

        // Add some randomness to make AI less predictable
        score += Math.random() * 2;

        return score;
    }
} 