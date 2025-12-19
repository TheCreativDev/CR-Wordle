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
     * Display card completion grid
     * Shows all cards with brightness based on whether they've been won as target
     */
    function displayTopCards(games) {
        const container = document.getElementById('top-cards-list');
        
        if (games.length === 0) {
            container.innerHTML = '<p class="loading-text">No games recorded yet.</p>';
            return;
        }
        
        // Count how many times each card was won as target
        const cardWinCounts = {};
        games.forEach(game => {
            if (game.won && game.targetCard) {
                cardWinCounts[game.targetCard] = (cardWinCounts[game.targetCard] || 0) + 1;
            }
        });
        
        // Sort cards by elixir (low to high)
        const sortedCards = [...CARDS].sort((a, b) => a.elixir - b.elixir);
        
        // Generate card grid HTML
        container.innerHTML = sortedCards.map(card => {
            const winCount = cardWinCounts[card.name] || 0;
            const isCompleted = winCount > 0;
            const opacity = isCompleted ? '1' : '0.4';
            
            return `
                <div class="completion-card" 
                     style="opacity: ${opacity}" 
                     title="${card.name}${isCompleted ? ` - Won ${winCount} time${winCount !== 1 ? 's' : ''}` : ' - Not completed yet'}">
                    <img src="${card.image}" alt="${card.name}" class="completion-card-img">
                    ${isCompleted ? `<div class="completion-count">${winCount}</div>` : ''}
                </div>
            `;
        }).join('');
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

    // Wait a bit for Firebase to initialize, then load stats
    setTimeout(function() {
        const dashboardContent = document.getElementById('dashboard-content');
        if (dashboardContent && !dashboardContent.classList.contains('hidden')) {
            console.log('Dashboard visible, loading stats now...');
            loadStats();
            enableAutoRefresh();
        } else {
            console.log('Dashboard not visible yet, will check again...');
            // Check every 500ms until dashboard is visible
            const checkInterval = setInterval(function() {
                const dashboardContent = document.getElementById('dashboard-content');
                if (dashboardContent && !dashboardContent.classList.contains('hidden')) {
                    console.log('Dashboard now visible, loading stats...');
                    loadStats();
                    enableAutoRefresh();
                    clearInterval(checkInterval);
                }
            }, 500);
        }
    }, 1000); // Wait 1 second for Firebase to initialize
})();
