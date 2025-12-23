/**
 * Stats Module
 * Handles Firebase persistence for game statistics
 * Calculates game stats from individual game records stored in Firebase
 * Uses global score from users/{uid}/globalScore for current balance
 */

const Stats = (function() {
    /**
     * Load stats by fetching all games from Firebase and calculating stats
     * @returns {Promise} - Resolves with calculated stats object
     */
    function loadStatsFromGames() {
        return new Promise((resolve) => {
            if (typeof FirebaseAnalytics === 'undefined') {
                resolve(getDefaultStats());
                return;
            }

            FirebaseAnalytics.fetchAllGames()
                .then((games) => {
                    const stats = calculateStatsFromGames(games);
                    resolve(stats);
                })
                .catch((error) => {
                    console.error('Error loading games from Firebase:', error);
                    resolve(getDefaultStats());
                });
        });
    }

    /**
     * Calculate stats from array of game records
     */
    function calculateStatsFromGames(games) {
        const totalGames = games.length;
        const wonGames = games.filter(g => g.won);
        const lostGames = games.filter(g => !g.won);
        
        const gamesWon = wonGames.length;
        const gamesLost = lostGames.length;
        
        // Total guesses for won games
        const totalGuesses = wonGames.reduce((sum, g) => sum + (g.guesses || 0), 0);
        
        // Best game (lowest guesses to win)
        let bestGame = null;
        if (wonGames.length > 0) {
            bestGame = Math.min(...wonGames.map(g => g.guesses));
        }
        
        return {
            gamesStarted: totalGames,
            gamesWon: gamesWon,
            gamesLost: gamesLost,
            totalGuesses: totalGuesses,
            bestGame: bestGame
        };
    }

    /**
     * Get default stats structure
     */
    function getDefaultStats() {
        return {
            gamesStarted: 0,
            gamesWon: 0,
            gamesLost: 0,
            totalGuesses: 0,
            bestGame: null
        };
    }

    /**
     * Load global stats from Firebase (async)
     * @returns {Promise} - Resolves with global stats object
     */
    function loadGlobalStats() {
        return new Promise((resolve) => {
            if (typeof FirebaseAnalytics === 'undefined') {
                resolve({ gamesStarted: 0 });
                return;
            }

            FirebaseAnalytics.fetchStats()
                .then((stats) => {
                    resolve({ gamesStarted: stats.gamesStarted || 0 });
                })
                .catch((error) => {
                    console.error('Error loading global stats:', error);
                    resolve({ gamesStarted: 0 });
                });
        });
    }

    /**
     * Record a win - handled by FirebaseAnalytics.logGame()
     * This is called for compatibility but actual recording happens in ui.js
     * @param {number} guessCount - Number of guesses it took to win
     */
    function recordWin(guessCount) {
        // Stats are recorded via FirebaseAnalytics.logGame() in ui.js handleWin()
        // This function exists for API compatibility
        console.log('Win recorded via FirebaseAnalytics.logGame()');
    }

    /**
     * Record a loss - handled by FirebaseAnalytics.logGame()
     * This is called for compatibility but actual recording happens in ui.js
     */
    function recordLoss() {
        // Stats are recorded via FirebaseAnalytics.logGame() in ui.js handleLoss()
        // This function exists for API compatibility
        console.log('Loss recorded via FirebaseAnalytics.logGame()');
    }

    /**
     * Get formatted stats for display (async)
     * @returns {Promise} - Resolves with formatted stats
     */
    function getStats() {
        const statsPromise = Promise.all([loadStatsFromGames(), loadGlobalStats()]);
        
        // Fetch current global balance
        const globalScorePromise = (typeof FirebaseAnalytics !== 'undefined' && FirebaseAnalytics.getGlobalScore)
            ? FirebaseAnalytics.getGlobalScore().catch(() => null)
            : Promise.resolve(null);
        
        return Promise.all([statsPromise, globalScorePromise])
            .then(([[userStats, globalStats], globalScore]) => {
                const gamesStarted = userStats.gamesStarted || 0;
                const gamesWon = userStats.gamesWon || 0;
                const gamesLost = userStats.gamesLost || 0;
                const totalGuesses = userStats.totalGuesses || 0;
                
                // Calculate win rate based on completed games
                const completedGames = gamesWon + gamesLost;
                const winRate = completedGames > 0 
                    ? Math.round((gamesWon / completedGames) * 100) 
                    : 0;
                
                // Calculate average guesses (only for won games)
                const averageGuesses = gamesWon > 0 
                    ? (totalGuesses / gamesWon).toFixed(1)
                    : 0;
                
                return {
                    gamesStarted: gamesStarted,
                    gamesWon: gamesWon,
                    gamesLost: gamesLost,
                    winRate: winRate,
                    averageGuesses: averageGuesses,
                    bestGame: userStats.bestGame,
                    // globalScore = current balance (Wordle earnings + casino wins/losses)
                    globalScore: typeof globalScore === 'number' ? globalScore : 0,
                    globalGamesStarted: globalStats.gamesStarted || 0
                };
            });
    }

    /**
     * Initialize - no longer needed but kept for API compatibility
     * @returns {Promise}
     */
    function init() {
        return Promise.resolve();
    }

    // Public API
    return {
        init,
        recordWin,
        recordLoss,
        getStats
    };
})();
