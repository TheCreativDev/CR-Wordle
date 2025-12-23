/**
 * Casino Shared Module
 * Common functionality for all casino game pages
 * Each game page includes this for score management and Firebase integration
 */

const CasinoShared = (function() {
    'use strict';

    let userScore = 0;
    let scoreValueEl = null;
    let isInitialized = false;

    /**
     * Initialize the shared module
     */
    function init() {
        scoreValueEl = document.getElementById('score-value');
        
        // Load user score when Firebase is ready
        if (typeof FirebaseAnalytics !== 'undefined' && FirebaseAnalytics.ready) {
            FirebaseAnalytics.ready().then(() => {
                loadUserScore();
            }).catch((error) => {
                console.error('Firebase auth error:', error);
                updateScoreDisplay(0);
            });
        } else {
            setTimeout(loadUserScore, 500);
        }
    }

    /**
     * Load user's global score from Firebase
     * Uses the centralized globalScore field, initializing from game logs if needed
     */
    async function loadUserScore() {
        if (typeof FirebaseAnalytics === 'undefined') {
            updateScoreDisplay(0);
            isInitialized = true;
            return;
        }

        try {
            // This will initialize from game logs if globalScore doesn't exist yet
            const score = await FirebaseAnalytics.initializeGlobalScoreIfNeeded();
            userScore = score;
            updateScoreDisplay(userScore);
            isInitialized = true;
        } catch (error) {
            console.error('Error loading global score:', error);
            updateScoreDisplay(0);
            isInitialized = true;
        }
    }

    /**
     * Update the score display
     */
    function updateScoreDisplay(score) {
        userScore = score;
        if (!scoreValueEl) return;
        
        const formattedScore = Number(score.toFixed(2)).toLocaleString('en-US', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        });
        
        scoreValueEl.textContent = formattedScore;
    }

    /**
     * Animate score change and persist to Firebase
     * @param {number} newScore - The new score to set
     * @returns {Promise} - Resolves when score is saved to Firebase
     */
    function animateScoreChange(newScore) {
        const startScore = userScore;
        const diff = newScore - startScore;
        const duration = 500;
        const startTime = performance.now();

        function update(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            const currentScore = startScore + (diff * eased);
            updateScoreDisplay(currentScore);

            if (progress < 1) {
                requestAnimationFrame(update);
            } else {
                updateScoreDisplay(newScore);
            }
        }

        requestAnimationFrame(update);
        
        // Persist the new score to Firebase
        if (typeof FirebaseAnalytics !== 'undefined' && FirebaseAnalytics.setGlobalScore) {
            return FirebaseAnalytics.setGlobalScore(newScore)
                .then(() => {
                    console.log('Casino score saved:', newScore);
                })
                .catch((error) => {
                    console.error('Error saving casino score:', error);
                });
        }
        
        return Promise.resolve();
    }

    /**
     * Get current score
     */
    function getScore() {
        return userScore;
    }

    /**
     * Check if module is initialized and score is loaded
     */
    function isReady() {
        return isInitialized;
    }

    /**
     * Get game context for game modules
     */
    function getGameContext() {
        return {
            getScore: getScore,
            updateScore: animateScoreChange,
            isReady: isReady
        };
    }

    // Public API
    return {
        init,
        getScore,
        updateScore: animateScoreChange,
        isReady,
        getGameContext
    };
})();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => CasinoShared.init());
} else {
    CasinoShared.init();
}
