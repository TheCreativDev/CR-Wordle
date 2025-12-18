/**
 * Main Application Entry Point
 * Initializes and coordinates all game modules
 */

const App = (function() {
    /**
     * Initialize the application
     */
    function init() {
        console.log('CR Wordle - Initializing...');
        
        // Validate card data
        if (!CARDS || CARDS.length === 0) {
            console.error('No card data found! Please add cards to data/cards.js');
            alert('Error: No card data found. Please add cards to the game.');
            return;
        }

        console.log(`Loaded ${CARDS.length} cards`);

        // Initialize UI
        UI.init();
        
        // Start first game
        startNewGame();
        
        console.log('CR Wordle - Ready!');
    }

    /**
     * Start a new game
     */
    function startNewGame() {
        Game.startNewGame();
        UI.resetUI();
        
        // Log game start to Firebase
        if (typeof FirebaseAnalytics !== 'undefined') {
            FirebaseAnalytics.logGameStart();
        }
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Public API
    return {
        startNewGame
    };
})();
