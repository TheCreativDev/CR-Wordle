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

        // Wait for authentication if not ready yet
        const user = auth.currentUser;
        if (!user) {
            console.log('Waiting for authentication...');
            // Retry after a short delay
            setTimeout(() => logGame(gameData), 500);
            return;
        }

        try {
            const gamesRef = database.ref('games/' + user.uid);
            const newGameRef = gamesRef.push();
            
            const gameRecord = {
                timestamp: firebase.database.ServerValue.TIMESTAMP,
                won: gameData.won,
                guesses: gameData.guesses,
                score: typeof gameData.score === 'number' ? gameData.score : 0,
                scoreBase: typeof gameData.scoreBase === 'number' ? gameData.scoreBase : 0,
                scoreMultiplier: typeof gameData.scoreMultiplier === 'number' ? gameData.scoreMultiplier : 1,
                disabledCategories: Array.isArray(gameData.disabledCategories) ? gameData.disabledCategories : [],
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

        // Make sure user is authenticated
        const user = auth.currentUser;
        if (!user) {
            return Promise.reject('User not authenticated');
        }

        return database.ref('games/' + user.uid)
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

    /**
     * Get the user's global score from Firebase
     * @returns {Promise<number>} - Promise that resolves with the global score
     */
    function getGlobalScore() {
        if (typeof firebase === 'undefined' || !firebase.database) {
            return Promise.reject('Firebase not initialized');
        }

        const user = auth.currentUser;
        if (!user) {
            return Promise.reject('User not authenticated');
        }

        return database.ref('users/' + user.uid + '/globalScore')
            .once('value')
            .then((snapshot) => {
                const score = snapshot.val();
                return typeof score === 'number' ? score : null;
            });
    }

    /**
     * Set the user's global score in Firebase
     * @param {number} score - The new global score
     * @returns {Promise} - Promise that resolves when score is saved
     */
    function setGlobalScore(score) {
        if (typeof firebase === 'undefined' || !firebase.database) {
            return Promise.reject('Firebase not initialized');
        }

        const user = auth.currentUser;
        if (!user) {
            return Promise.reject('User not authenticated');
        }

        const safeScore = Number.isFinite(score) ? Number(score.toFixed(2)) : 0;
        return database.ref('users/' + user.uid + '/globalScore').set(safeScore);
    }

    /**
     * Add to the user's global score (atomic increment)
     * @param {number} amount - The amount to add (can be negative)
     * @returns {Promise<number>} - Promise that resolves with the new score
     */
    function addToGlobalScore(amount) {
        if (typeof firebase === 'undefined' || !firebase.database) {
            return Promise.reject('Firebase not initialized');
        }

        const user = auth.currentUser;
        if (!user) {
            return Promise.reject('User not authenticated');
        }

        const scoreRef = database.ref('users/' + user.uid + '/globalScore');
        return scoreRef.transaction((currentScore) => {
            const current = typeof currentScore === 'number' ? currentScore : 0;
            const newScore = Number((current + amount).toFixed(2));
            return Math.max(0, newScore); // Ensure score never goes negative
        }).then((result) => {
            return result.snapshot.val();
        });
    }

    /**
     * Initialize global score from existing game logs if not already set
     * This is for migrating existing users who don't have a globalScore yet
     * @returns {Promise<number>} - Promise that resolves with the global score
     */
    function initializeGlobalScoreIfNeeded() {
        if (typeof firebase === 'undefined' || !firebase.database) {
            return Promise.reject('Firebase not initialized');
        }

        const user = auth.currentUser;
        if (!user) {
            return Promise.reject('User not authenticated');
        }

        return getGlobalScore().then((existingScore) => {
            // If score already exists, return it
            if (existingScore !== null) {
                return existingScore;
            }

            // Calculate score from existing game logs
            return fetchAllGames().then((games) => {
                const wonGames = games.filter(g => g.won);
                const totalScore = wonGames.reduce((sum, g) => {
                    const score = Number(g.score);
                    return sum + (Number.isFinite(score) ? score : 0);
                }, 0);

                const safeScore = Number(totalScore.toFixed(2));
                return setGlobalScore(safeScore).then(() => safeScore);
            }).catch(() => {
                // If fetching games fails, initialize to 0
                return setGlobalScore(0).then(() => 0);
            });
        });
    }

    /**
     * Promise that resolves when Firebase auth is ready
     * @returns {Promise} - Promise that resolves when user is authenticated
     */
    function ready() {
        if (typeof firebase === 'undefined' || !auth) {
            return Promise.reject('Firebase not initialized');
        }

        // If already authenticated, resolve immediately
        if (auth.currentUser) {
            return Promise.resolve(auth.currentUser);
        }

        // Wait for auth state change
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject('Authentication timeout');
            }, 10000);

            const unsubscribe = auth.onAuthStateChanged((user) => {
                if (user) {
                    clearTimeout(timeout);
                    unsubscribe();
                    resolve(user);
                }
            });
        });
    }

    // Public API
    return {
        logGame,
        logGameStart,
        fetchAllGames,
        fetchStats,
        getGlobalScore,
        setGlobalScore,
        addToGlobalScore,
        initializeGlobalScoreIfNeeded,
        ready
    };
})();
