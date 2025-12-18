/**
 * Firebase Analytics Module
 * Tracks game statistics to Firebase Realtime Database
 */

const FirebaseAnalytics = (function() {
    
    /**
     * Log a completed game to Firebase
     * @param {Object} gameData - Data about the completed game
     */
    function logGame(gameData) {
        if (typeof firebase === 'undefined' || !firebase.database) {
            console.warn('Firebase not initialized, skipping analytics');
            return;
        }

        try {
            const gamesRef = database.ref('games');
            const newGameRef = gamesRef.push();
            
            const gameRecord = {
                timestamp: firebase.database.ServerValue.TIMESTAMP,
                won: gameData.won,
                guesses: gameData.guesses,
                targetCard: gameData.targetCard,
                guessedCards: gameData.guessedCards || [],
                date: new Date().toISOString()
            };

            newGameRef.set(gameRecord)
                .then(() => {
                    console.log('Game logged to Firebase successfully');
                })
                .catch((error) => {
                    console.error('Error logging game:', error);
                });
        } catch (error) {
            console.error('Firebase error:', error);
        }
    }

    /**
     * Log when a new game starts
     */
    function logGameStart() {
        if (typeof firebase === 'undefined' || !firebase.database) {
            return;
        }

        try {
            const statsRef = database.ref('stats/gamesStarted');
            statsRef.transaction((current) => {
                return (current || 0) + 1;
            });
        } catch (error) {
            console.error('Error logging game start:', error);
        }
    }

    /**
     * Fetch all games for analytics
     * @returns {Promise} - Promise that resolves with games data
     */
    function fetchAllGames() {
        if (typeof firebase === 'undefined' || !firebase.database) {
            return Promise.reject('Firebase not initialized');
        }

        return database.ref('games')
            .orderByChild('timestamp')
            .once('value')
            .then((snapshot) => {
                const games = [];
                snapshot.forEach((childSnapshot) => {
                    games.push({
                        id: childSnapshot.key,
                        ...childSnapshot.val()
                    });
                });
                return games;
            });
    }

    /**
     * Fetch general stats
     * @returns {Promise} - Promise that resolves with stats data
     */
    function fetchStats() {
        if (typeof firebase === 'undefined' || !firebase.database) {
            return Promise.reject('Firebase not initialized');
        }

        return database.ref('stats').once('value')
            .then((snapshot) => snapshot.val() || {});
    }

    // Public API
    return {
        logGame,
        logGameStart,
        fetchAllGames,
        fetchStats
    };
})();
