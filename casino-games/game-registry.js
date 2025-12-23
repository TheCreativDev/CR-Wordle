/**
 * Casino Game Registry
 * Central system for registering casino games
 * Games register via manifest.js in their folders
 */

const CasinoGameRegistry = (function() {
    'use strict';

    const games = new Map();
    const gameOrder = [];

    /**
     * Register a game with the registry
     * @param {string} id - Unique game identifier (folder name)
     * @param {object} manifest - Game manifest data
     */
    function register(id, manifest) {
        if (games.has(id)) {
            console.warn(`Game "${id}" is already registered. Skipping.`);
            return;
        }

        const gameConfig = {
            id: id,
            name: manifest.name || 'Unknown Game',
            description: manifest.description || '',
            icon: manifest.icon || '🎮',
            odds: manifest.odds || 'N/A',
            enabled: manifest.enabled !== false,
            path: `casino-games/${id}/`
        };

        games.set(id, gameConfig);
        gameOrder.push(id);
        console.log(`Game "${id}" registered successfully.`);
    }

    /**
     * Get all registered games in order
     * @returns {Array} Array of game configs
     */
    function getAllGames() {
        return gameOrder.map(id => games.get(id));
    }

    /**
     * Get a specific game by ID
     * @param {string} id - Game identifier
     * @returns {object|null} Game config or null
     */
    function getGame(id) {
        return games.get(id) || null;
    }

    /**
     * Get all enabled games
     * @returns {Array} Array of enabled game configs
     */
    function getEnabledGames() {
        return getAllGames().filter(g => g.enabled);
    }

    /**
     * Get all disabled/placeholder games
     * @returns {Array} Array of disabled game configs
     */
    function getPlaceholderGames() {
        return getAllGames().filter(g => !g.enabled);
    }

    /**
     * Generate game card HTML for a game
     * @param {object} game - Game config
     * @returns {string} HTML string
     */
    function generateGameCardHTML(game) {
        const buttonText = game.enabled ? 'Play Now' : 'Coming Soon';
        const buttonDisabled = game.enabled ? '' : 'disabled';
        const href = game.enabled ? `${game.path}index.html` : '#';
        const onClick = game.enabled ? '' : 'onclick="return false;"';

        return `
            <div class="game-card">
                <div class="game-card-inner">
                    <div class="game-icon">${game.icon}</div>
                    <h3 class="game-title">${game.name}</h3>
                    <p class="game-description">${game.description}</p>
                    <div class="game-odds">${game.odds}</div>
                    <a href="${href}" class="game-play-btn" ${buttonDisabled} ${onClick}>${buttonText}</a>
                </div>
            </div>
        `;
    }

    /**
     * Generate all game cards HTML
     * @returns {string} HTML string for all games
     */
    function generateAllGameCardsHTML() {
        return getAllGames().map(game => generateGameCardHTML(game)).join('\n');
    }

    // Public API
    return {
        register,
        getAllGames,
        getGame,
        getEnabledGames,
        getPlaceholderGames,
        generateGameCardHTML,
        generateAllGameCardsHTML
    };
})();
