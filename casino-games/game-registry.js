/**
 * Casino Game Registry
 * Central system for registering and managing casino games
 */

const CasinoGameRegistry = (function() {
    'use strict';

    const games = new Map();

    /**
     * Register a game with the registry
     * @param {string} id - Unique game identifier
     * @param {object} config - Game configuration
     */
    function register(id, config) {
        if (games.has(id)) {
            console.warn(`Game "${id}" is already registered. Skipping.`);
            return;
        }

        const gameConfig = {
            id: id,
            name: config.name || 'Unknown Game',
            description: config.description || '',
            icon: config.icon || '🎮',
            odds: config.odds || 'N/A',
            enabled: config.enabled !== false,
            init: config.init || null,
            reset: config.reset || null,
            getModalHTML: config.getModalHTML || null
        };

        games.set(id, gameConfig);
        console.log(`Game "${id}" registered successfully.`);
    }

    /**
     * Get all registered games
     * @returns {Array} Array of game configs
     */
    function getAllGames() {
        return Array.from(games.values());
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
        return Array.from(games.values()).filter(g => g.enabled);
    }

    /**
     * Get all disabled/placeholder games
     * @returns {Array} Array of disabled game configs
     */
    function getPlaceholderGames() {
        return Array.from(games.values()).filter(g => !g.enabled);
    }

    /**
     * Initialize a specific game
     * @param {string} id - Game identifier
     * @param {object} context - Shared context (score functions, etc.)
     */
    function initGame(id, context) {
        const game = games.get(id);
        if (game && game.init && typeof game.init === 'function') {
            game.init(context);
        }
    }

    /**
     * Initialize all enabled games
     * @param {object} context - Shared context
     */
    function initAllGames(context) {
        games.forEach((game, id) => {
            if (game.enabled && game.init) {
                game.init(context);
            }
        });
    }

    /**
     * Reset a specific game state
     * @param {string} id - Game identifier
     */
    function resetGame(id) {
        const game = games.get(id);
        if (game && game.reset && typeof game.reset === 'function') {
            game.reset();
        }
    }

    /**
     * Generate game card HTML for a game
     * @param {object} game - Game config
     * @returns {string} HTML string
     */
    function generateGameCardHTML(game) {
        const buttonText = game.enabled ? 'Play Now' : 'Coming Soon';
        const buttonDisabled = game.enabled ? '' : 'disabled';
        const dataAttr = game.enabled ? `data-game="${game.id}"` : '';

        return `
            <div class="game-card" ${dataAttr}>
                <div class="game-card-inner">
                    <div class="game-icon">${game.icon}</div>
                    <h3 class="game-title">${game.name}</h3>
                    <p class="game-description">${game.description}</p>
                    <div class="game-odds">${game.odds}</div>
                    <button class="game-play-btn" ${dataAttr} ${buttonDisabled}>${buttonText}</button>
                </div>
            </div>
        `;
    }

    /**
     * Generate all game cards HTML
     * @returns {string} HTML string for all games
     */
    function generateAllGameCardsHTML() {
        const allGames = getAllGames();
        return allGames.map(game => generateGameCardHTML(game)).join('\n');
    }

    /**
     * Generate modal content HTML for a game
     * @param {string} id - Game identifier
     * @returns {string} HTML string or empty
     */
    function generateGameModalHTML(id) {
        const game = games.get(id);
        if (game && game.getModalHTML && typeof game.getModalHTML === 'function') {
            return game.getModalHTML();
        }
        return '';
    }

    // Public API
    return {
        register,
        getAllGames,
        getGame,
        getEnabledGames,
        getPlaceholderGames,
        initGame,
        initAllGames,
        resetGame,
        generateGameCardHTML,
        generateAllGameCardsHTML,
        generateGameModalHTML
    };
})();
