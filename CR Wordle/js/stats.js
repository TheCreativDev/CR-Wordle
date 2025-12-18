/**
 * Stats Module
 * Handles localStorage persistence for game statistics
 */

const Stats = (function() {
    const STORAGE_KEY = 'cr_wordle_stats';

    // Default stats structure
    const defaultStats = {
        gamesPlayed: 0,
        gamesWon: 0,
        totalGuesses: 0,
        bestGame: null,
        currentStreak: 0,
        maxStreak: 0
    };

    /**
     * Get stats from localStorage
     */
    function getStoredStats() {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                return { ...defaultStats, ...JSON.parse(stored) };
            }
        } catch (e) {
            console.error('Error reading stats from localStorage:', e);
        }
        return { ...defaultStats };
    }

    /**
     * Save stats to localStorage
     */
    function saveStats(stats) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
        } catch (e) {
            console.error('Error saving stats to localStorage:', e);
        }
    }

    /**
     * Record a win
     * @param {number} guessCount - Number of guesses it took to win
     */
    function recordWin(guessCount) {
        const stats = getStoredStats();
        
        stats.gamesPlayed++;
        stats.gamesWon++;
        stats.totalGuesses += guessCount;
        stats.currentStreak++;
        
        // Update best game
        if (stats.bestGame === null || guessCount < stats.bestGame) {
            stats.bestGame = guessCount;
        }
        
        // Update max streak
        if (stats.currentStreak > stats.maxStreak) {
            stats.maxStreak = stats.currentStreak;
        }
        
        saveStats(stats);
    }

    /**
     * Record a loss (if you implement a max guess limit in the future)
     */
    function recordLoss() {
        const stats = getStoredStats();
        
        stats.gamesPlayed++;
        stats.currentStreak = 0;
        
        saveStats(stats);
    }

    /**
     * Get formatted stats for display
     */
    function getStats() {
        const stats = getStoredStats();
        
        // Calculate win rate
        const winRate = stats.gamesPlayed > 0 
            ? Math.round((stats.gamesWon / stats.gamesPlayed) * 100) 
            : 0;
        
        // Calculate average guesses (only for won games)
        const averageGuesses = stats.gamesWon > 0 
            ? (stats.totalGuesses / stats.gamesWon).toFixed(1)
            : 0;
        
        return {
            gamesPlayed: stats.gamesPlayed,
            gamesWon: stats.gamesWon,
            winRate: winRate,
            averageGuesses: averageGuesses,
            bestGame: stats.bestGame,
            currentStreak: stats.currentStreak,
            maxStreak: stats.maxStreak
        };
    }

    /**
     * Reset all stats
     */
    function reset() {
        saveStats({ ...defaultStats });
    }

    // Public API
    return {
        recordWin,
        recordLoss,
        getStats,
        reset
    };
})();
