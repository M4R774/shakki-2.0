import { AUDIO_CONFIG } from './constants.js';

/**
 * Manages all game audio including sound effects and background music
 */
export class SoundManager {
    constructor() {
        this.initializeAudio();
        this.setupControls();
        this.preloadSounds();
    }

    /**
     * Initialize audio elements and set their volumes
     */
    initializeAudio() {
        // Initialize audio elements
        this.moveSound = document.getElementById('moveSound') || new Audio();
        this.captureSound = document.getElementById('captureSound') || new Audio();
        this.turnSound = document.getElementById('turnSound') || new Audio();
        this.gameOverSound = document.getElementById('gameOverSound') || new Audio();
        this.backgroundMusic = document.getElementById('backgroundMusic') || new Audio();
        this.goodieHutSound = document.getElementById('goodieHutSound') || new Audio();
        
        // Set initial states
        this.soundEnabled = true;
        this.musicEnabled = false;
        
        // Set volumes from config
        this.backgroundMusic.volume = AUDIO_CONFIG.BACKGROUND_MUSIC;
        this.moveSound.volume = AUDIO_CONFIG.MOVE_SOUND;
        this.captureSound.volume = AUDIO_CONFIG.CAPTURE_SOUND;
        this.turnSound.volume = AUDIO_CONFIG.TURN_SOUND;
        this.gameOverSound.volume = AUDIO_CONFIG.GAME_OVER_SOUND;
        this.goodieHutSound.volume = AUDIO_CONFIG.GOODIE_HUT_SOUND;

        // Add error handling for audio loading
        const audioElements = [
            this.moveSound, 
            this.captureSound, 
            this.turnSound, 
            this.gameOverSound, 
            this.backgroundMusic,
            this.goodieHutSound
        ];

        audioElements.forEach(audio => {
            audio.addEventListener('error', (e) => {
                console.error('Error loading audio file:', e);
            });
        });
    }

    /**
     * Set up sound control buttons
     */
    setupControls() {
        this.soundToggle = document.querySelector('.sound-toggle');
        this.musicToggle = document.querySelector('.music-toggle');
        
        if (this.soundToggle && this.musicToggle) {
            this.soundToggle.addEventListener('click', () => this.toggleSound());
            this.musicToggle.addEventListener('click', () => this.toggleMusic());
        }
    }

    /**
     * Preload all sound files
     */
    preloadSounds() {
        try {
            this.moveSound.load();
            this.captureSound.load();
            this.turnSound.load();
            this.gameOverSound.load();
            this.backgroundMusic.load();
            this.goodieHutSound.load();
        } catch (error) {
            console.error('Error preloading sounds:', error);
        }
    }
    
    /**
     * Play a sound if sound is enabled
     * @param {HTMLAudioElement} sound - The sound to play
     */
    async playSound(sound) {
        if (this.soundEnabled && sound) {
            try {
                sound.currentTime = 0;
                const playPromise = sound.play();
                if (playPromise !== undefined) {
                    await playPromise;
                }
            } catch (error) {
                console.error('Error playing sound:', error);
            }
        }
    }
    
    /**
     * Play move sound effect
     */
    async playMove() {
        await this.playSound(this.moveSound);
    }
    
    /**
     * Play capture sound effect
     */
    async playCapture() {
        await this.playSound(this.captureSound);
    }
    
    /**
     * Play turn change sound effect
     */
    async playTurn() {
        await this.playSound(this.turnSound);
    }
    
    /**
     * Play game over sound effect
     */
    async playGameOver() {
        await this.playSound(this.gameOverSound);
    }
    
    /**
     * Play goodie hut capture sound effect
     */
    async playGoodieHut() {
        await this.playSound(this.goodieHutSound);
    }
    
    /**
     * Toggle sound effects on/off
     */
    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        this.soundToggle.classList.toggle('muted', !this.soundEnabled);
        
        // Play a test sound when enabling
        if (this.soundEnabled) {
            this.playMove();
        }
    }
    
    /**
     * Toggle background music on/off
     */
    toggleMusic() {
        this.musicEnabled = !this.musicEnabled;
        this.musicToggle.classList.toggle('muted', !this.musicEnabled);
        
        if (this.musicEnabled) {
            try {
                const playPromise = this.backgroundMusic.play();
                if (playPromise !== undefined) {
                    playPromise.catch(error => {
                        console.error('Error playing background music:', error);
                        // If there's an error, revert the toggle
                        this.musicEnabled = false;
                        this.musicToggle.classList.toggle('muted', !this.musicEnabled);
                    });
                }
            } catch (error) {
                console.error('Error playing background music:', error);
                // If there's an error, revert the toggle
                this.musicEnabled = false;
                this.musicToggle.classList.toggle('muted', !this.musicEnabled);
            }
        } else {
            this.backgroundMusic.pause();
            this.backgroundMusic.currentTime = 0;
        }
    }
} 