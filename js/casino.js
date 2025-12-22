/**
 * Casino Module
 * Handles score loading, display, and game orchestration
 * Games are loaded from casino-games/ folder via CasinoGameRegistry
 */

(function() {
    'use strict';

    // ===== State =====
    let userScore = 0;
    let currentGame = null;

    // ===== DOM Elements =====
    const scoreValueEl = document.getElementById('score-value');
    const gamesGrid = document.querySelector('.games-grid');
    const gameModal = document.getElementById('game-modal');
    const gameModalsContainer = document.getElementById('game-modals-container');
    const closeModalBtn = document.getElementById('close-game-modal');

    // ===== Score Management =====

    /**
     * Load user's total score from Firebase
     */
    async function loadUserScore() {
        if (typeof FirebaseAnalytics === 'undefined') {
            updateScoreDisplay(0);
            return;
        }

        try {
            const games = await FirebaseAnalytics.fetchAllGames();
            const wonGames = games.filter(g => g.won);
            
            userScore = wonGames.reduce((sum, g) => {
                const score = Number(g.score);
                return sum + (Number.isFinite(score) ? score : 0);
            }, 0);

            updateScoreDisplay(userScore);
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

    /**
     * Animate score change
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
    }

    /**
     * Get current score (for games)
     */
    function getScore() {
        return userScore;
    }

    // ===== Game Rendering =====

    /**
     * Render all game cards from the registry
     */
    function renderGameCards() {
        if (!gamesGrid) return;
        gamesGrid.innerHTML = CasinoGameRegistry.generateAllGameCardsHTML();
    }

    /**
     * Render all game modals from the registry
     */
    function renderGameModals() {
        if (!gameModalsContainer) return;
        
        const enabledGames = CasinoGameRegistry.getEnabledGames();
        const modalsHTML = enabledGames
            .map(game => game.getModalHTML ? game.getModalHTML() : '')
            .filter(html => html)
            .join('\n');
        
        gameModalsContainer.innerHTML = modalsHTML;
    }

    // ===== Modal Management =====

    function openGame(gameId) {
        currentGame = gameId;
        
        // Hide all game containers
        document.querySelectorAll('.game-container').forEach(el => el.classList.add('hidden'));
        
        // Show the selected game
        const gameContainer = document.getElementById(`${gameId}-game`);
        if (gameContainer) {
            gameContainer.classList.remove('hidden');
        }
        
        // Reset game state
        CasinoGameRegistry.resetGame(gameId);
        
        // Show modal
        gameModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }

    function closeGame() {
        gameModal.classList.add('hidden');
        document.body.style.overflow = '';
        
        // Reset the game being closed
        if (currentGame) {
            CasinoGameRegistry.resetGame(currentGame);
        }
        
        currentGame = null;
    }

    // ===== Event Listeners =====

    function initEventListeners() {
        // Game card buttons (use event delegation since cards are dynamic)
        gamesGrid.addEventListener('click', (e) => {
            const btn = e.target.closest('.game-play-btn[data-game]');
            if (btn && !btn.disabled) {
                e.preventDefault();
                const gameId = btn.dataset.game;
                if (gameId) {
                    openGame(gameId);
                }
            }
        });

        // Close modal
        closeModalBtn.addEventListener('click', closeGame);
        gameModal.addEventListener('click', (e) => {
            if (e.target === gameModal) {
                closeGame();
            }
        });

        // Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !gameModal.classList.contains('hidden')) {
                closeGame();
            }
        });
    }

    // ===== Initialize =====

    function init() {
        // Render game cards and modals from registry
        renderGameCards();
        renderGameModals();

        // Set up event listeners
        initEventListeners();

        // Create shared context for games
        const gameContext = {
            getScore: getScore,
            updateScore: animateScoreChange
        };

        // Initialize all games with context
        CasinoGameRegistry.initAllGames(gameContext);

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
