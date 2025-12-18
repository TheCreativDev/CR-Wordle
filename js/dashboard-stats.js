/**
 * Dashboard Stats Display
 * Fetches and displays game statistics from Firebase
 */

(function() {
    /**
     * Load and display all statistics
     */
    function loadStats() {
        console.log('Loading game statistics from Firebase...');
        
        if (typeof FirebaseAnalytics === 'undefined') {
            console.error('FirebaseAnalytics not loaded');
            showError();
            return;
        }

        Promise.all([
            FirebaseAnalytics.fetchAllGames(),
            FirebaseAnalytics.fetchStats()
        ])
        .then(([games, stats]) => {
            console.log(`Loaded ${games.length} games`);
            displayStatistics(games, stats);
        })
        .catch((error) => {
            console.error('Error loading stats:', error);
            showError();
        });
    }

    /**
     * Calculate and display statistics
     */
    function displayStatistics(games, stats) {
        // Basic counts
        const totalGames = games.length;
        const gamesWon = games.filter(g => g.won).length;
        const gamesLost = games.filter(g => !g.won).length;
        const winRate = totalGames > 0 ? ((gamesWon / totalGames) * 100).toFixed(1) : 0;
        
        // Average guesses for wins
        const wonGames = games.filter(g => g.won);
        const avgGuesses = wonGames.length > 0 
            ? (wonGames.reduce((sum, g) => sum + g.guesses, 0) / wonGames.length).toFixed(1)
            : 'N/A';
        
        // Update DOM
        document.getElementById('total-games').textContent = totalGames;
        document.getElementById('games-won').textContent = gamesWon;
        document.getElementById('games-lost').textContent = gamesLost;
        document.getElementById('win-rate').textContent = `${winRate}%`;
        document.getElementById('avg-guesses').textContent = avgGuesses;
        document.getElementById('games-started').textContent = stats.gamesStarted || 0;
        
        // Most targeted cards
        displayTopCards(games);
    }

    /**
     * Display most frequently targeted cards
     */
    function displayTopCards(games) {
        const cardCounts = {};
        
        // Count each target card
        games.forEach(game => {
            const card = game.targetCard;
            if (card) {
                cardCounts[card] = (cardCounts[card] || 0) + 1;
            }
        });
        
        // Sort by count
        const sortedCards = Object.entries(cardCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10); // Top 10
        
        const container = document.getElementById('top-cards-list');
        
        if (sortedCards.length === 0) {
            container.innerHTML = '<p class="loading-text">No games recorded yet.</p>';
            return;
        }
        
        container.innerHTML = sortedCards.map(([cardName, count], index) => `
            <div class="top-card-item">
                <div>
                    <span style="color: var(--text-secondary); margin-right: 10px;">#${index + 1}</span>
                    <span class="top-card-name">${cardName}</span>
                </div>
                <span class="top-card-count">${count} ${count === 1 ? 'time' : 'times'}</span>
            </div>
        `).join('');
    }

    /**
     * Show error message
     */
    function showError() {
        document.getElementById('total-games').textContent = 'Error';
        document.getElementById('games-won').textContent = 'Error';
        document.getElementById('games-lost').textContent = 'Error';
        document.getElementById('win-rate').textContent = 'Error';
        document.getElementById('avg-guesses').textContent = 'Error';
        document.getElementById('games-started').textContent = 'Error';
        document.getElementById('top-cards-list').innerHTML = 
            '<p class="loading-text" style="color: var(--incorrect-red);">Failed to load statistics. Please check Firebase configuration.</p>';
    }

    /**
     * Auto-refresh stats every 30 seconds
     */
    function enableAutoRefresh() {
        setInterval(loadStats, 30000); // Refresh every 30 seconds
    }

    // Initialize when dashboard content is shown
    document.addEventListener('DOMContentLoaded', function() {
        // Wait for dashboard to be unlocked
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                const dashboardContent = document.getElementById('dashboard-content');
                if (dashboardContent && !dashboardContent.classList.contains('hidden')) {
                    loadStats();
                    enableAutoRefresh();
                    observer.disconnect();
                }
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['class']
        });
    });
})();
