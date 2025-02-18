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
        if (!piece || piece.terrain) return [];

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
     * Check if a cell can be moved to or captured
     * @param {Object} targetCell - The cell to check
     * @param {string} pieceColor - Color of the moving piece
     * @returns {Object} Object containing canMove and shouldStop flags
     */
    validateCell(targetCell, pieceColor) {
        // If no cell, it's a valid move
        if (!targetCell) {
            return { canMove: true, shouldStop: false };
        }

        // If it's terrain (including goodie huts), can't move there (except goodie huts)
        if (targetCell.terrain) {
            if (targetCell.terrain === TERRAIN_TYPES.GOODIE_HUT) {
                return { canMove: true, shouldStop: true };
            }
            return { canMove: false, shouldStop: true };
        }

        // If it's a piece
        if (targetCell.color) {
            // Can't move to friendly pieces
            if (targetCell.color === pieceColor) {
                return { canMove: false, shouldStop: true };
            }
            // Can capture enemy pieces
            return { canMove: true, shouldStop: true };
        }

        // Shouldn't get here, but just in case
        return { canMove: false, shouldStop: true };
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
        
        // Normal moves (orthogonal) - can only move to empty squares
        this.addMovesInDirections(row, col, DIRECTIONS.ORTHOGONAL, moves, 
            (targetCell) => !targetCell);

        // Capture moves (diagonal) - can only capture pieces and goodie huts
        this.addMovesInDirections(row, col, DIRECTIONS.DIAGONAL, moves, 
            (targetCell) => targetCell && (
                targetCell.terrain === TERRAIN_TYPES.GOODIE_HUT || 
                (targetCell.color && targetCell.color !== piece.color)
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

        DIRECTIONS.KNIGHT.forEach(([rowOffset, colOffset]) => {
            const newRow = row + rowOffset;
            const newCol = col + colOffset;

            if (this.isInBounds(newRow, newCol)) {
                const targetCell = this.game.board[newRow][newCol];
                const { canMove } = this.validateCell(targetCell, pieceColor);
                if (canMove) {
                    moves.push({ row: newRow, col: newCol });
                }
            }
        });

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

        DIRECTIONS.ALL.forEach(([rowOffset, colOffset]) => {
            const newRow = row + rowOffset;
            const newCol = col + colOffset;

            if (this.isInBounds(newRow, newCol)) {
                const targetCell = this.game.board[newRow][newCol];
                const { canMove } = this.validateCell(targetCell, pieceColor);
                if (canMove) {
                    moves.push({ row: newRow, col: newCol });
                }
            }
        });

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
                const { canMove, shouldStop } = this.validateCell(targetCell, piece.color);
                
                if (canMove) {
                    moves.push({ row: newRow, col: newCol });
                }
                
                if (shouldStop) break;

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
    addMovesInDirections(row, col, directions, moves, cellValidator) {
        directions.forEach(([rowOffset, colOffset]) => {
            const newRow = row + rowOffset;
            const newCol = col + colOffset;

            if (this.isInBounds(newRow, newCol)) {
                const targetCell = this.game.board[newRow][newCol];
                if (cellValidator(targetCell)) {
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
     * Count the number of pieces a player has
     * @param {string} color - Player color
     * @returns {number} Number of pieces
     */
    countPieces(color) {
        let count = 0;
        for (let row = 0; row < this.game.board.length; row++) {
            for (let col = 0; col < this.game.board[row].length; col++) {
                const cell = this.game.board[row][col];
                if (cell?.color === color && !cell.terrain) {
                    count++;
                }
            }
        }
        return count;
    }
} 