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
     * Get valid moves for AI considering fog of war
     * @param {number} row - Starting row
     * @param {number} col - Starting column
     * @returns {Array} Array of valid moves
     */
    getValidMovesForAI(row, col) {
        const visibleSquares = this.game.visibilityManager.getVisibleSquares(this.currentAIPlayer);
        const allValidMoves = this.game.pieceManager.getValidMoves(row, col);
        
        // Filter moves to only include visible squares
        return allValidMoves.filter(move => 
            visibleSquares.has(`${move.row},${move.col}`)
        );
    }

    /**
     * Make moves for the current AI player
     */
    async makeAIMoves() {
        this.currentAIPlayer = this.game.currentPlayer;
        const visibleSquares = this.game.visibilityManager.getVisibleSquares(this.currentAIPlayer);
        
        while (this.game.movesRemaining[this.currentAIPlayer] > 0) {
            // Find all AI pieces that haven't moved yet
            const pieces = [];
            for (let row = 0; row < this.game.board.length; row++) {
                for (let col = 0; col < this.game.board[row].length; col++) {
                    const piece = this.game.board[row][col];
                    if (piece && 
                        piece.color === this.currentAIPlayer && 
                        !this.game.movedPieces.has(`${row},${col}`) &&
                        visibleSquares.has(`${row},${col}`)) {
                        pieces.push({ row, col, piece });
                    }
                }
            }
            
            if (pieces.length === 0) break;
            
            // For each piece, evaluate possible moves
            let bestMove = null;
            let bestScore = -Infinity;
            
            for (const { row, col, piece } of pieces) {
                const validMoves = this.getValidMovesForAI(row, col);
                
                for (const move of validMoves) {
                    const score = this.evaluateMove(row, col, move.row, move.col);
                    if (score > bestScore) {
                        bestScore = score;
                        bestMove = { from: { row, col }, to: move };
                    }
                }
            }
            
            if (bestMove) {
                await this.game.movePiece(
                    bestMove.from.row,
                    bestMove.from.col,
                    bestMove.to.row,
                    bestMove.to.col
                );
                
                // Add a small delay between moves
                await new Promise(resolve => setTimeout(resolve, 500));
            } else {
                break;
            }
        }
        
        // End turn if no more moves available
        if (this.game.currentPlayer === this.currentAIPlayer) {
            await this.game.switchTurn();
        }
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
     * Evaluate a potential move
     * @param {number} fromRow - Starting row
     * @param {number} fromCol - Starting column
     * @param {number} toRow - Target row
     * @param {number} toCol - Target column
     * @returns {number} Score for the move
     */
    evaluateMove(fromRow, fromCol, toRow, toCol) {
        const piece = this.game.board[fromRow][fromCol];
        const target = this.game.board[toRow][toCol];
        let score = 0;
        
        // Base score for piece values
        const pieceValues = {
            pawn: 1,
            knight: 3,
            bishop: 3,
            rook: 5,
            queen: 9,
            king: 0 // Kings don't move towards capture
        };
        
        // Capturing moves
        if (target) {
            if (target.terrain === 'goodie-hut') {
                score += 4; // Goodie huts are valuable
            } else if (target.color !== this.currentAIPlayer) {
                score += (pieceValues[target.type] || 0) * 2; // Double value for captures
                if (target.type === 'king') {
                    score += 100; // Huge bonus for capturing kings
                }
            }
        }
        
        // Movement towards center (for better board control)
        const centerRow = Math.floor(this.game.board.length / 2);
        const centerCol = Math.floor(this.game.board[0].length / 2);
        const currentDistanceToCenter = Math.abs(fromRow - centerRow) + Math.abs(fromCol - centerCol);
        const newDistanceToCenter = Math.abs(toRow - centerRow) + Math.abs(toCol - centerCol);
        score += (currentDistanceToCenter - newDistanceToCenter) * 0.1;
        
        return score;
    }
} 