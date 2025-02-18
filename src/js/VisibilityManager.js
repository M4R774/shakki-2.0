import { DIRECTIONS, VISION_RANGES } from './constants.js';

/**
 * Manages visibility and fog of war mechanics
 */
export class VisibilityManager {
    constructor(game) {
        this.game = game;
    }

    /**
     * Get all squares visible to the current player
     * @returns {Set} Set of visible square coordinates
     */
    getVisibleSquares() {
        const visibleSquares = new Set();
        
        // Add all squares within vision range of current player's pieces
        for (let row = 0; row < this.game.board.length; row++) {
            for (let col = 0; col < this.game.board[row].length; col++) {
                const piece = this.game.board[row][col];
                if (piece?.color === this.game.currentPlayer) {
                    const visionRange = this.getVisionRange(piece.type);
                    this.addVisibleSquaresInRange(row, col, visionRange, visibleSquares, piece.type);
                }
            }
        }
        
        // Add visible squares to current player's explored squares
        visibleSquares.forEach(square => {
            this.game.exploredSquares[this.game.currentPlayer].add(square);
        });
        
        return visibleSquares;
    }

    /**
     * Get vision range for a piece type
     * @param {string} pieceType - Type of piece
     * @returns {number} Vision range
     */
    getVisionRange(pieceType) {
        return VISION_RANGES[pieceType] || VISION_RANGES.default;
    }

    /**
     * Add visible squares within range of a piece
     * @param {number} centerRow - Center row
     * @param {number} centerCol - Center column
     * @param {number} range - Vision range
     * @param {Set} visibleSquares - Set to add visible squares to
     * @param {string} pieceType - Type of piece
     */
    addVisibleSquaresInRange(centerRow, centerCol, range, visibleSquares, pieceType) {
        if (pieceType === 'pawn') {
            this.addPawnVisibleSquares(centerRow, centerCol, visibleSquares);
        } else {
            this.addNormalVisibleSquares(centerRow, centerCol, range, visibleSquares);
        }
        
        // Always add the center square
        visibleSquares.add(`${centerRow},${centerCol}`);
    }

    /**
     * Add visible squares for a pawn
     * @param {number} centerRow - Pawn's row
     * @param {number} centerCol - Pawn's column
     * @param {Set} visibleSquares - Set to add visible squares to
     */
    addPawnVisibleSquares(centerRow, centerCol, visibleSquares) {
        // Add orthogonal squares within range 1
        DIRECTIONS.ORTHOGONAL.forEach(([rowDir, colDir]) => {
            const newRow = centerRow + rowDir;
            const newCol = centerCol + colDir;
            if (this.isInBounds(newRow, newCol)) {
                visibleSquares.add(`${newRow},${newCol}`);
            }
        });
        
        // Add diagonal squares (always visible regardless of range)
        DIRECTIONS.DIAGONAL.forEach(([rowDir, colDir]) => {
            const newRow = centerRow + rowDir;
            const newCol = centerCol + colDir;
            if (this.isInBounds(newRow, newCol)) {
                visibleSquares.add(`${newRow},${newCol}`);
            }
        });
    }

    /**
     * Add visible squares for non-pawn pieces
     * @param {number} centerRow - Piece's row
     * @param {number} centerCol - Piece's column
     * @param {number} range - Vision range
     * @param {Set} visibleSquares - Set to add visible squares to
     */
    addNormalVisibleSquares(centerRow, centerCol, range, visibleSquares) {
        for (let row = centerRow - range; row <= centerRow + range; row++) {
            for (let col = centerCol - range; col <= centerCol + range; col++) {
                if (this.isInBounds(row, col)) {
                    visibleSquares.add(`${row},${col}`);
                }
            }
        }
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
} 