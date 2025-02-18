import { DIRECTIONS, TERRAIN_TYPES } from './constants.js';

/**
 * Manages piece movement and validation
 */
export class PieceManager {
    constructor(game) {
        this.game = game;
    }

    /**
     * Get valid moves for a piece
     * @param {number} row - Current row
     * @param {number} col - Current column
     * @returns {Array<{row: number, col: number}>} Array of valid move positions
     */
    getValidMoves(row, col) {
        const piece = this.game.board[row][col];
        if (!piece) return [];

        const moveGenerators = {
            pawn: () => this.getPawnMoves(row, col),
            rook: () => this.getSlidingMoves(row, col, DIRECTIONS.ORTHOGONAL),
            knight: () => this.getKnightMoves(row, col),
            bishop: () => this.getSlidingMoves(row, col, DIRECTIONS.DIAGONAL),
            queen: () => this.getSlidingMoves(row, col, DIRECTIONS.ALL),
            king: () => this.getKingMoves(row, col)
        };

        return moveGenerators[piece.type]?.() || [];
    }

    /**
     * Get valid moves for a pawn
     * @param {number} row - Current row
     * @param {number} col - Current column
     * @returns {Array<{row: number, col: number}>} Array of valid moves
     */
    getPawnMoves(row, col) {
        const piece = this.game.board[row][col];
        const moves = [];
        
        // Normal moves (orthogonal)
        this.addMovesInDirections(row, col, DIRECTIONS.ORTHOGONAL, moves, 
            (targetCell) => !targetCell);

        // Capture moves (diagonal) - including goodie huts
        this.addMovesInDirections(row, col, DIRECTIONS.DIAGONAL, moves, 
            (targetCell) => targetCell && (
                targetCell.terrain === TERRAIN_TYPES.GOODIE_HUT || 
                (!targetCell.terrain && targetCell.color !== piece.color)
            ));

        return moves;
    }

    /**
     * Get valid moves for a knight
     * @param {number} row - Current row
     * @param {number} col - Current column
     * @returns {Array<{row: number, col: number}>} Array of valid moves
     */
    getKnightMoves(row, col) {
        const moves = [];
        const pieceColor = this.game.board[row][col].color;

        this.addMovesInDirections(row, col, DIRECTIONS.KNIGHT, moves, 
            () => true, // We'll validate in isValidDestination
            (newRow, newCol) => this.isValidDestination(newRow, newCol, pieceColor));

        return moves;
    }

    /**
     * Get valid moves for a king
     * @param {number} row - Current row
     * @param {number} col - Current column
     * @returns {Array<{row: number, col: number}>} Array of valid moves
     */
    getKingMoves(row, col) {
        const moves = [];
        const pieceColor = this.game.board[row][col].color;

        this.addMovesInDirections(row, col, DIRECTIONS.ALL, moves, 
            () => true, // We'll validate in isValidDestination
            (newRow, newCol) => this.isValidDestination(newRow, newCol, pieceColor));

        return moves;
    }

    /**
     * Get valid moves for sliding pieces (rook, bishop, queen)
     * @param {number} row - Current row
     * @param {number} col - Current column
     * @param {Array<Array<number>>} directions - Array of direction vectors
     * @returns {Array<{row: number, col: number}>} Array of valid moves
     */
    getSlidingMoves(row, col, directions) {
        const piece = this.game.board[row][col];
        const moves = [];

        for (const [rowDir, colDir] of directions) {
            let newRow = row + rowDir;
            let newCol = col + colDir;

            while (this.isInBounds(newRow, newCol)) {
                const targetCell = this.game.board[newRow][newCol];
                
                if (!targetCell) {
                    // Empty square - valid move
                    moves.push({ row: newRow, col: newCol });
                } else if (targetCell.terrain === TERRAIN_TYPES.GOODIE_HUT) {
                    // Goodie hut - valid move and stop
                    moves.push({ row: newRow, col: newCol });
                    break;
                } else if (targetCell.terrain) {
                    // Other terrain - stop
                    break;
                } else if (targetCell.color !== piece.color) {
                    // Enemy piece - valid move and stop
                    moves.push({ row: newRow, col: newCol });
                    break;
                } else {
                    // Friendly piece - stop
                    break;
                }

                newRow += rowDir;
                newCol += colDir;
            }
        }

        return moves;
    }

    /**
     * Helper method to add moves in given directions based on validation functions
     * @private
     */
    addMovesInDirections(row, col, directions, moves, cellValidator, moveValidator = null) {
        directions.forEach(([rowOffset, colOffset]) => {
            const newRow = row + rowOffset;
            const newCol = col + colOffset;

            if (this.isInBounds(newRow, newCol)) {
                const targetCell = this.game.board[newRow][newCol];
                if (cellValidator(targetCell) && 
                    (!moveValidator || moveValidator(newRow, newCol))) {
                    moves.push({ row: newRow, col: newCol });
                }
            }
        });
    }

    /**
     * Check if coordinates are within board bounds
     * @param {number} row - Row to check
     * @param {number} col - Column to check
     * @returns {boolean} Whether the coordinates are in bounds
     */
    isInBounds(row, col) {
        return row >= 0 && row < this.game.board.length && 
               col >= 0 && col < this.game.board[0].length;
    }

    /**
     * Check if a destination is valid for a piece
     * @param {number} row - Destination row
     * @param {number} col - Destination column
     * @param {string} pieceColor - Color of the moving piece
     * @returns {boolean} Whether the destination is valid
     */
    isValidDestination(row, col, pieceColor) {
        if (!this.isInBounds(row, col)) return false;
        
        const targetCell = this.game.board[row][col];
        const piece = this.game.selectedPiece ? 
            this.game.board[this.game.selectedPiece.row][this.game.selectedPiece.col] : null;
            
        // Allow knights to move through terrain if technology is unlocked
        if (piece?.type === 'knight' && 
            this.game.knightTerrainBypass && 
            piece.color === this.game.currentPlayer) {
            return !targetCell || targetCell.color !== pieceColor || 
                   (targetCell.terrain && targetCell.terrain !== TERRAIN_TYPES.MOUNTAIN);
        }
        
        // Never allow capturing friendly pieces
        if (targetCell?.color === pieceColor) {
            return false;
        }
        
        // Allow movement to empty squares
        if (!targetCell) {
            return true;
        }
        
        // Allow movement to goodie huts
        if (targetCell.terrain === TERRAIN_TYPES.GOODIE_HUT) {
            return true;
        }

        // Allow capturing enemy pieces if no terrain
        if (!targetCell.terrain && targetCell.color !== pieceColor) {
            return true;
        }

        // Mountains and other terrain are impassable
        return false;
    }
} 