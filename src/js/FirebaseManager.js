/**
 * Manages Firebase integration and online multiplayer functionality
 * Currently disabled - will be implemented later
 */
export class FirebaseManager {
    constructor(game) {
        this.game = game;
    }

    /**
     * Enable/disable game controls based on turn
     */
    disableControls() {
        const endTurnButton = document.querySelector('.end-turn-button');
        if (endTurnButton) {
            endTurnButton.disabled = true;
        }
    }

    enableControls() {
        const endTurnButton = document.querySelector('.end-turn-button');
        if (endTurnButton) {
            endTurnButton.disabled = false;
        }
    }
}