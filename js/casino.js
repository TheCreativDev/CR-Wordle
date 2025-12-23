/**
 * Casino Module
 * Handles score loading, display, and game card rendering
 * Games are loaded from casino-games/ folder via CasinoGameRegistry
 */

(function() {
    'use strict';

    // ===== State =====
    let userScore = 0;

    // ===== DOM Elements =====
    const scoreValueEl = document.getElementById('score-value');
    const gamesGrid = document.querySelector('.games-grid');

    // ===== Score Management =====

    /**
     * Load user's global score from Firebase
     */
    async function loadUserScore() {
        if (typeof FirebaseAnalytics === 'undefined') {
            updateScoreDisplay(0);
            return;
        }

        try {
            // Use the centralized global score, initializing from game logs if needed
            const score = await FirebaseAnalytics.initializeGlobalScoreIfNeeded();
            updateScoreDisplay(score);
        } catch (error) {
            console.error('Error loading score:', error);
            updateScoreDisplay(0);
        }
    }

    /**
     * Update the score display
     */
    function updateScoreDisplay(score) {
        userScore = score;
        const formattedScore = Number(score.toFixed(2)).toLocaleString('en-US', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        });
        
        scoreValueEl.textContent = formattedScore;
    }

    // ===== Game Rendering =====

    /**
     * Render all game cards from the registry
     */
    function renderGameCards() {
        if (!gamesGrid) return;
        gamesGrid.innerHTML = CasinoGameRegistry.generateAllGameCardsHTML();
    }

    // ===== Initialize =====

    function init() {
        // Render game cards from registry
        renderGameCards();

        // Load user score
        if (typeof FirebaseAnalytics !== 'undefined' && FirebaseAnalytics.ready) {
            FirebaseAnalytics.ready().then(() => {
                loadUserScore();
            });
        } else {
            setTimeout(loadUserScore, 500);
        }
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
