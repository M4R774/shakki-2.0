/**
 * Game board directions for piece movements
 */
export const DIRECTIONS = {
    ORTHOGONAL: [
        [0, 1], [0, -1], [1, 0], [-1, 0]
    ],
    DIAGONAL: [
        [1, 1], [1, -1], [-1, 1], [-1, -1]
    ],
    ALL: [
        [0, 1], [0, -1], [1, 0], [-1, 0],
        [1, 1], [1, -1], [-1, 1], [-1, -1]
    ],
    KNIGHT: [
        [-2, -1], [-2, 1], [-1, -2], [-1, 2],
        [1, -2], [1, 2], [2, -1], [2, 1]
    ]
};

/**
 * Game configuration constants
 */
export const GAME_CONFIG = {
    GRID_SIZE: 16,
    PIECES_PER_SIDE: 5,
    MOVES_PER_TURN: 3,
    MIN_PLAYER_DISTANCE: 6,
    GOODIE_HUT_CONFIG: {
        DENSITY: 0.05,
        MAX_ATTEMPTS: 100,
        REGION_SIZE: 4
    }
};

/**
 * Terrain types in the game
 */
export const TERRAIN_TYPES = {
    EMPTY: 'empty',
    FOREST: 'forest',
    WATER: 'water',
    MOUNTAIN: 'mountain',
    GOODIE_HUT: 'goodie-hut'
};

/**
 * Vision ranges for different piece types
 */
export const VISION_RANGES = {
    'rook': 3,
    'knight': 3,
    'pawn': 1,
    'default': 2  // for king, queen, bishop
};

/**
 * Available player colors
 */
export const PLAYER_COLORS = ['white', 'black', 'red', 'blue'];

/**
 * Audio volume settings
 */
export const AUDIO_CONFIG = {
    BACKGROUND_MUSIC: 0.3,
    MOVE_SOUND: 0.5,
    CAPTURE_SOUND: 0.5,
    TURN_SOUND: 0.4,
    GAME_OVER_SOUND: 0.6,
    GOODIE_HUT_SOUND: 0.5
}; 