import { GAME_CONFIG, TERRAIN_TYPES } from './constants.js';
import { getRandomInt, getManhattanDistance, getEuclideanDistance } from './utils.js';

/**
 * Manages board generation and terrain
 */
export class BoardManager {
    constructor(game) {
        this.game = game;
    }

    /**
     * Initialize an empty board
     * @returns {Array} Empty game board
     */
    createEmptyBoard() {
        const board = [];
        for (let i = 0; i < GAME_CONFIG.GRID_SIZE; i++) {
            board[i] = new Array(GAME_CONFIG.GRID_SIZE).fill(null);
        }
        return board;
    }

    /**
     * Generate terrain on the board
     */
    generateTerrain() {
        const config = {
            waterDensity: 0.035,
            forestDensity: 0.0525,
            mountainDensity: 0.028
        };

        for (let row = 0; row < GAME_CONFIG.GRID_SIZE; row++) {
            for (let col = 0; col < GAME_CONFIG.GRID_SIZE; col++) {
                const random = Math.random();
                if (random < config.waterDensity) {
                    this.game.board[row][col] = { terrain: TERRAIN_TYPES.WATER };
                } else if (random < config.waterDensity + config.forestDensity) {
                    const treeVariant = (row + col) % 2;
                    const treeEmoji = treeVariant === 0 ? '🌳' : '🌲';
                    this.game.board[row][col] = { 
                        terrain: TERRAIN_TYPES.FOREST,
                        variant: treeEmoji
                    };
                } else if (random < config.waterDensity + config.forestDensity + config.mountainDensity) {
                    const mountainVariant = (row + col) % 3;
                    const mountainEmoji = mountainVariant === 0 ? '⛰️' : mountainVariant === 1 ? '🏔️' : '🗻';
                    this.game.board[row][col] = { 
                        terrain: TERRAIN_TYPES.MOUNTAIN,
                        variant: mountainEmoji
                    };
                }
            }
        }
    }

    /**
     * Generate goodie huts on the board
     */
    generateGoodieHuts() {
        const { REGION_SIZE, MAX_ATTEMPTS } = GAME_CONFIG.GOODIE_HUT_CONFIG;
        const regionsPerSide = Math.ceil(GAME_CONFIG.GRID_SIZE / REGION_SIZE);
        const hutsPerRegion = 1;
        
        for (let regionRow = 0; regionRow < regionsPerSide; regionRow++) {
            for (let regionCol = 0; regionCol < regionsPerSide; regionCol++) {
                let hutsPlaced = 0;
                let attempts = 0;
                
                while (hutsPlaced < hutsPerRegion && attempts < MAX_ATTEMPTS) {
                    const rowStart = regionRow * REGION_SIZE;
                    const colStart = regionCol * REGION_SIZE;
                    const row = rowStart + Math.floor(Math.random() * REGION_SIZE);
                    const col = colStart + Math.floor(Math.random() * REGION_SIZE);
                    
                    if (this.isValidHutPosition(row, col)) {
                        this.game.board[row][col] = { 
                            terrain: TERRAIN_TYPES.GOODIE_HUT 
                        };
                        hutsPlaced++;
                    }
                    attempts++;
                }
            }
        }
    }

    /**
     * Check if a position is valid for placing a goodie hut
     * @param {number} row - Row to check
     * @param {number} col - Column to check
     * @returns {boolean} Whether the position is valid
     */
    isValidHutPosition(row, col) {
        return this.isInBounds(row, col) && !this.game.board[row][col];
    }

    /**
     * Generate all possible edge positions for player placement
     * @returns {Array} Array of edge positions
     */
    generateEdgePositions() {
        const positions = [];
        const size = GAME_CONFIG.GRID_SIZE - 1;

        for (let i = 0; i < GAME_CONFIG.GRID_SIZE; i++) {
            positions.push({ row: 0, col: i });     // Top edge
            positions.push({ row: size, col: i });  // Bottom edge
            if (i > 0 && i < size) {
                positions.push({ row: i, col: 0 });     // Left edge
                positions.push({ row: i, col: size });  // Right edge
            }
        }

        return positions;
    }

    /**
     * Check if a position is on the board edge
     * @param {number} row - Row to check
     * @param {number} col - Column to check
     * @returns {boolean} Whether the position is on the edge
     */
    isEdgePosition(row, col) {
        return row === 0 || row === GAME_CONFIG.GRID_SIZE - 1 || 
               col === 0 || col === GAME_CONFIG.GRID_SIZE - 1;
    }

    /**
     * Assign starting positions to players
     * @param {Array} edgePositions - Available edge positions
     * @returns {Object} Map of player colors to their starting positions
     */
    assignPlayerPositions(edgePositions) {
        const playerPositions = {};
        const usedPositions = [];

        this.game.players.forEach(color => {
            let validPositions = edgePositions.filter(pos => {
                return usedPositions.every(usedPos => {
                    const manhattanDistance = getManhattanDistance(pos.row, pos.col, usedPos.row, usedPos.col);
                    const euclideanDistance = getEuclideanDistance(pos.row, pos.col, usedPos.row, usedPos.col);
                    return manhattanDistance >= GAME_CONFIG.MIN_PLAYER_DISTANCE && 
                           euclideanDistance >= GAME_CONFIG.MIN_PLAYER_DISTANCE;
                });
            });

            if (validPositions.length === 0) {
                validPositions = this.findBestAlternativePositions(edgePositions, usedPositions);
            }

            const position = validPositions[Math.floor(Math.random() * validPositions.length)];
            playerPositions[color] = position;
            usedPositions.push(position);

            edgePositions = this.filterNearbyPositions(edgePositions, position);
        });

        return playerPositions;
    }

    /**
     * Find best alternative positions when no ideal positions are available
     * @param {Array} edgePositions - Available edge positions
     * @param {Array} usedPositions - Already used positions
     * @returns {Array} Best alternative positions
     */
    findBestAlternativePositions(edgePositions, usedPositions) {
        let maxMinDistance = 0;
        let bestPositions = [];

        edgePositions.forEach(pos => {
            const minDistToOthers = Math.min(...usedPositions.map(usedPos => {
                const manhattan = getManhattanDistance(pos.row, pos.col, usedPos.row, usedPos.col);
                const euclidean = getEuclideanDistance(pos.row, pos.col, usedPos.row, usedPos.col);
                return Math.min(manhattan, euclidean);
            }));

            if (minDistToOthers > maxMinDistance) {
                maxMinDistance = minDistToOthers;
                bestPositions = [pos];
            } else if (minDistToOthers === maxMinDistance) {
                bestPositions.push(pos);
            }
        });

        return bestPositions;
    }

    /**
     * Filter out positions that are too close to a given position
     * @param {Array} positions - Available positions
     * @param {Object} position - Position to check against
     * @returns {Array} Filtered positions
     */
    filterNearbyPositions(positions, position) {
        return positions.filter(pos => {
            const manhattan = getManhattanDistance(pos.row, pos.col, position.row, position.col);
            const euclidean = getEuclideanDistance(pos.row, pos.col, position.row, position.col);
            return manhattan >= GAME_CONFIG.MIN_PLAYER_DISTANCE && 
                   euclidean >= GAME_CONFIG.MIN_PLAYER_DISTANCE;
        });
    }

    /**
     * Check if coordinates are within board bounds
     * @param {number} row - Row to check
     * @param {number} col - Column to check
     * @returns {boolean} Whether the coordinates are in bounds
     */
    isInBounds(row, col) {
        return row >= 0 && row < GAME_CONFIG.GRID_SIZE && 
               col >= 0 && col < GAME_CONFIG.GRID_SIZE;
    }
} 