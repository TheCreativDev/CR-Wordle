/**
 * UI Controller Module
 * Handles all DOM interactions, rendering, and user input
 */

const UI = (function() {
    // DOM Elements
    let searchInput;
    let autocompleteList;
    let guessesContainer;
    let winMessage;
    let lossMessage;
    let guessCountSpan;
    let scorePointsSpan;
    let playAgainBtn;
    let lossPlayAgainBtn;
    let statsBtn;
    let statsModal;
    let closeModalBtn;

    // Autocomplete state
    let selectedIndex = -1;
    let currentResults = [];

    // Category toggle state (persists during session only)
    const disabledCategories = new Set();
    const MIN_ENABLED_CATEGORIES = 2;
    const TOGGLEABLE_CATEGORIES = ['elixir', 'rarity', 'type', 'range', 'speed', 'hitSpeed', 'releaseYear'];

    function getRevealTiming() {
        const styles = getComputedStyle(document.documentElement);
        const staggerRaw = styles.getPropertyValue('--reveal-stagger-ms').trim();
        const durationRaw = styles.getPropertyValue('--reveal-duration-ms').trim();

        const stagger = Number.parseInt(staggerRaw, 10);
        const duration = Number.parseInt(durationRaw, 10);

        return {
            stagger: Number.isFinite(stagger) ? stagger : 120,
            duration: Number.isFinite(duration) ? duration : 450
        };
    }

    /**
     * Initialize UI elements and event listeners
     */
    function init() {
        // Get DOM elements
        searchInput = document.getElementById('card-search');
        autocompleteList = document.getElementById('autocomplete-list');
        guessesContainer = document.getElementById('guesses-container');
        winMessage = document.getElementById('win-message');
        lossMessage = document.getElementById('loss-message');
        guessCountSpan = document.getElementById('guess-count');
        scorePointsSpan = document.getElementById('score-points');
        playAgainBtn = document.getElementById('play-again-btn');
        lossPlayAgainBtn = document.getElementById('loss-play-again-btn');
        statsBtn = document.getElementById('stats-btn');
        statsModal = document.getElementById('stats-modal');
        closeModalBtn = document.getElementById('close-modal');

        // Set up event listeners
        setupEventListeners();
        
        // Set up category toggle listeners
        setupCategoryToggles();
    }

    /**
     * Set up category toggle event listeners
     */
    function setupCategoryToggles() {
        const toggleableLabels = document.querySelectorAll('.attribute-label.toggleable');
        
        toggleableLabels.forEach(label => {
            label.addEventListener('click', () => {
                const category = label.dataset.category;
                toggleCategory(category, label);
            });
        });
    }

    /**
     * Toggle a category on/off
     */
    function toggleCategory(category, labelElement) {
        // Check if we're trying to disable
        if (!disabledCategories.has(category)) {
            // Count currently enabled categories
            const enabledCount = TOGGLEABLE_CATEGORIES.length - disabledCategories.size;
            
            // Enforce minimum enabled categories
            if (enabledCount <= MIN_ENABLED_CATEGORIES) {
                return; // Can't disable - would go below minimum
            }
            
            // Disable the category
            disabledCategories.add(category);
            labelElement.classList.add('disabled');
        } else {
            // Enable the category
            disabledCategories.delete(category);
            labelElement.classList.remove('disabled');
        }
    }

    /**
     * Check if a category is disabled
     */
    function isCategoryDisabled(category) {
        return disabledCategories.has(category);
    }

    function getBaseScoreForGuesses(guessCount) {
        if (!Number.isFinite(guessCount) || guessCount <= 0) return 0;
        if (guessCount === 1) return 10;
        if (guessCount === 2) return 5;
        if (guessCount === 3) return 3;
        if (guessCount === 4) return 2;
        return 1;
    }

    function getCategoryDisabledMultiplier(category) {
        // elixir, rarity, year (releaseYear) => 1.5x each
        if (category === 'elixir' || category === 'rarity' || category === 'releaseYear') {
            return 1.5;
        }
        // all other toggleable categories => 1.25x each
        return 1.25;
    }

    function computeScore(guessCount) {
        const base = getBaseScoreForGuesses(guessCount);
        let multiplier = 1;
        disabledCategories.forEach((category) => {
            multiplier *= getCategoryDisabledMultiplier(category);
        });

        // Store with 2-decimal precision (avoid floating point noise)
        const score = Number((base * multiplier).toFixed(2));
        return { base, multiplier: Number(multiplier.toFixed(4)), score };
    }

    function formatScoreForDisplay(score) {
        if (!Number.isFinite(score)) return '0';
        // Show up to 2 decimals, trim trailing zeros
        return score.toFixed(2).replace(/\.00$/, '').replace(/(\.[0-9])0$/, '$1');
    }

    /**
     * Set up all event listeners
     */
    function setupEventListeners() {
        // Search input events
        searchInput.addEventListener('input', handleSearchInput);
        searchInput.addEventListener('keydown', handleKeyDown);
        searchInput.addEventListener('focus', handleSearchFocus);

        // Close autocomplete when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.search-container')) {
                hideAutocomplete();
            }
        });

        // Stats modal events
        statsBtn.addEventListener('click', showStatsModal);
        closeModalBtn.addEventListener('click', hideStatsModal);
        statsModal.addEventListener('click', (e) => {
            if (e.target === statsModal) {
                hideStatsModal();
            }
        });

        // Play again button
        playAgainBtn.addEventListener('click', () => {
            if (typeof Wallpaper !== 'undefined' && Wallpaper.randomize) {
                Wallpaper.randomize();
            }
            if (typeof App !== 'undefined' && App.startNewGame) {
                App.startNewGame();
            }
        });

        // Loss play again button
        lossPlayAgainBtn.addEventListener('click', () => {
            if (typeof Wallpaper !== 'undefined' && Wallpaper.randomize) {
                Wallpaper.randomize();
            }
            if (typeof App !== 'undefined' && App.startNewGame) {
                App.startNewGame();
            }
        });
    }

    /**
     * Handle search input changes
     */
    function handleSearchInput(e) {
        const query = e.target.value;
        
        // Don't show autocomplete if game is over
        if (Game.hasWon() || Game.hasLost()) {
            hideAutocomplete();
            return;
        }
        
        if (query.length < 1) {
            hideAutocomplete();
            return;
        }

        currentResults = Game.searchCards(query);
        selectedIndex = -1;
        renderAutocomplete(currentResults);
    }

    /**
     * Handle search input focus
     */
    function handleSearchFocus() {
        const query = searchInput.value;
        if (query.length >= 1) {
            currentResults = Game.searchCards(query);
            renderAutocomplete(currentResults);
        }
    }

    /**
     * Handle keyboard navigation in autocomplete
     */
    function handleKeyDown(e) {
        if (currentResults.length === 0) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                selectedIndex = Math.min(selectedIndex + 1, currentResults.length - 1);
                updateAutocompleteSelection();
                break;
            
            case 'ArrowUp':
                e.preventDefault();
                selectedIndex = Math.max(selectedIndex - 1, -1);
                updateAutocompleteSelection();
                break;
            
            case 'Enter':
                e.preventDefault();
                // Don't allow selection if game is over
                if (Game.hasWon() || Game.hasLost()) {
                    hideAutocomplete();
                    break;
                }
                if (selectedIndex >= 0 && selectedIndex < currentResults.length) {
                    // User has navigated with arrow keys - select that card
                    selectCard(currentResults[selectedIndex]);
                } else if (currentResults.length > 0) {
                    // No explicit selection - auto-select the first (topmost) card
                    selectCard(currentResults[0]);
                }
                break;
            
            case 'Escape':
                hideAutocomplete();
                break;
        }
    }

    /**
     * Render autocomplete dropdown
     */
    function renderAutocomplete(cards) {
        if (cards.length === 0) {
            hideAutocomplete();
            return;
        }

        autocompleteList.innerHTML = cards.map((card, index) => `
            <div class="autocomplete-item ${index === selectedIndex ? 'selected' : ''}" 
                 data-card-id="${card.id}">
                <img src="${card.image}" alt="${card.name}" onerror="this.src='images/cards/placeholder.png'">
                <span>${card.name}</span>
            </div>
        `).join('');

        // Add click handlers to items
        autocompleteList.querySelectorAll('.autocomplete-item').forEach(item => {
            item.addEventListener('click', () => {
                const cardId = item.dataset.cardId;
                const card = CARDS.find(c => c.id === cardId);
                if (card) selectCard(card);
            });
        });

        showAutocomplete();
    }

    /**
     * Update visual selection in autocomplete
     */
    function updateAutocompleteSelection() {
        const items = autocompleteList.querySelectorAll('.autocomplete-item');
        items.forEach((item, index) => {
            item.classList.toggle('selected', index === selectedIndex);
        });
    }

    /**
     * Select a card from autocomplete
     */
    function selectCard(card) {
        // Don't allow selection if game is over
        if (Game.hasWon() || Game.hasLost()) {
            hideAutocomplete();
            return;
        }

        hideAutocomplete();
        searchInput.value = '';

        // Make the guess
        const result = Game.makeGuess(card.id);
        
        if (result) {
            renderGuessRow(result);

            if (result.isWin) {
                handleWin();
            }
            // Check for loss
            else if (result.isLoss) {
                handleLoss();
            }
        }
    }

    /**
     * Render a guess row with comparison results
     */
    function renderGuessRow(result) {
        const row = document.createElement('div');
        row.className = 'guess-row';

        const card = result.card;
        const attrs = result.attributes;

        row.innerHTML = `
            <!-- Card Image (no reveal animation) -->
            <div class="guess-cell card-cell">
                <img src="${card.image}" alt="${card.name}" onerror="this.src='images/cards/placeholder.png'">
                <span class="card-name">${card.name}</span>
            </div>
            
            <!-- Attribute cells (sequential reveal) -->
            ${renderAttributeCell(attrs.elixir, 'elixir', 0)}
            ${renderAttributeCell(attrs.rarity, 'rarity', 1)}
            ${renderAttributeCell(attrs.type, 'type', 2)}
            ${renderAttributeCell(attrs.range, 'range', 3)}
            ${renderAttributeCell(attrs.speed, 'speed', 4)}
            ${renderHitSpeedCell(attrs.hitSpeed, 'hitSpeed', 5)}
            ${renderAttributeCell(attrs.releaseYear, 'releaseYear', 6)}
        `;

        // Insert at top of guesses container
        guessesContainer.insertBefore(row, guessesContainer.firstChild);

        // Trigger reveal animation on next frame so the DOM is ready
        requestAnimationFrame(() => {
            row.querySelectorAll('.reveal-stagger').forEach((cell) => {
                cell.classList.add('reveal');
            });
        });
    }

    /**
     * Render a single attribute cell
     */
    function renderAttributeCell(attr, category = null, revealIndex = 0) {
        const timing = getRevealTiming();
        const delay = revealIndex * timing.stagger;

        // Check if this category is disabled
        if (category && isCategoryDisabled(category)) {
            return `<div class="guess-cell disabled-category reveal-stagger reveal-no-flip" style="--reveal-delay: ${delay}ms; --reveal-duration: ${timing.duration}ms;"></div>`;
        }

        // N/A rendering (flip-reveal still applies)
        if (attr.isNA) {
            return `
                <div class="guess-cell guess-attr reveal-stagger" style="--reveal-delay: ${delay}ms; --reveal-duration: ${timing.duration}ms;">
                    <div class="flip-inner">
                        <div class="guess-face front"></div>
                        <div class="guess-face back na">N/A</div>
                    </div>
                </div>
            `;
        }

        const statusClass = attr.isCorrect ? 'correct' : 'incorrect';
        const arrow = attr.direction ? getArrow(attr.direction) : '';

        return `
            <div class="guess-cell guess-attr reveal-stagger" style="--reveal-delay: ${delay}ms; --reveal-duration: ${timing.duration}ms;">
                <div class="flip-inner">
                    <div class="guess-face front"></div>
                    <div class="guess-face back ${statusClass}">
                        <span>${attr.value}</span>
                        ${arrow ? `<span class="arrow">${arrow}</span>` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Render hit speed cell (handles decimal display)
     */
    function renderHitSpeedCell(attr, category = null, revealIndex = 0) {
        const timing = getRevealTiming();
        const delay = revealIndex * timing.stagger;

        // Check if this category is disabled
        if (category && isCategoryDisabled(category)) {
            return `<div class="guess-cell disabled-category reveal-stagger reveal-no-flip" style="--reveal-delay: ${delay}ms; --reveal-duration: ${timing.duration}ms;"></div>`;
        }

        if (attr.isNA || attr.value === "N/A") {
            return `
                <div class="guess-cell guess-attr reveal-stagger" style="--reveal-delay: ${delay}ms; --reveal-duration: ${timing.duration}ms;">
                    <div class="flip-inner">
                        <div class="guess-face front"></div>
                        <div class="guess-face back na">N/A</div>
                    </div>
                </div>
            `;
        }

        const statusClass = attr.isCorrect ? 'correct' : 'incorrect';
        const arrow = attr.direction ? getArrow(attr.direction) : '';
        const displayValue = typeof attr.value === 'number' ? attr.value.toFixed(1) + 's' : attr.value;

        return `
            <div class="guess-cell guess-attr reveal-stagger" style="--reveal-delay: ${delay}ms; --reveal-duration: ${timing.duration}ms;">
                <div class="flip-inner">
                    <div class="guess-face front"></div>
                    <div class="guess-face back ${statusClass}">
                        <span>${displayValue}</span>
                        ${arrow ? `<span class="arrow">${arrow}</span>` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Get arrow character for direction
     */
    function getArrow(direction) {
        return direction === 'higher' ? '↑' : '↓';
    }

    /**
     * Calculate total reveal animation duration (all cells flipped)
     */
    function getTotalRevealDuration() {
        const timing = getRevealTiming();
        const attributeCount = 7; // elixir, rarity, type, range, speed, hitSpeed, releaseYear
        // Last cell starts at (attributeCount - 1) * stagger, then takes duration to complete
        return (attributeCount - 1) * timing.stagger;
    }

    /**
     * Handle game win
     */
    function handleWin() {
        const guessCount = Game.getGuessCount();
        const gameState = Game.getGameState();

        const scoreResult = computeScore(guessCount);
        
        // Update stats
        Stats.recordWin(guessCount);
        
        // Log to Firebase
        if (typeof FirebaseAnalytics !== 'undefined') {
            FirebaseAnalytics.logGame({
                won: true,
                guesses: guessCount,
                score: scoreResult.score,
                scoreBase: scoreResult.base,
                scoreMultiplier: scoreResult.multiplier,
                disabledCategories: Array.from(disabledCategories),
                targetCard: gameState.targetCard.name,
                guessedCards: gameState.guessedCards.map(c => c.name)
            });
            
            // Update global score for casino
            FirebaseAnalytics.addToGlobalScore(scoreResult.score)
                .then((newScore) => {
                    console.log('Global score updated:', newScore);
                })
                .catch((error) => {
                    console.error('Error updating global score:', error);
                });
        }
        
        // Disable search immediately
        searchInput.disabled = true;
        
        // Delay win message until all attribute cards have flipped
        const revealDelay = getTotalRevealDuration();
        setTimeout(() => {
            guessCountSpan.textContent = guessCount;
            if (scorePointsSpan) {
                scorePointsSpan.textContent = formatScoreForDisplay(scoreResult.score);
            }
            winMessage.classList.remove('hidden');
            if (typeof Animations !== 'undefined' && Animations.confetti) {
                Animations.confetti({ count: 160, spread: 80, power: 140 });
            }
        }, revealDelay);
    }

    /**
     * Handle game loss
     */
    function handleLoss() {
        const targetCard = Game.getTargetCard();
        const gameState = Game.getGameState();
        
        // Update stats
        Stats.recordLoss();
        
        // Log to Firebase
        if (typeof FirebaseAnalytics !== 'undefined') {
            FirebaseAnalytics.logGame({
                won: false,
                guesses: gameState.guessCount,
                score: 0,
                scoreBase: 0,
                scoreMultiplier: 1,
                disabledCategories: Array.from(disabledCategories),
                targetCard: targetCard.name,
                guessedCards: gameState.guessedCards.map(c => c.name)
            });
        }
        
        // Add red tint to search input and disable immediately
        searchInput.classList.add('game-lost');
        searchInput.disabled = true;
        
        // Delay loss message until all attribute cards have flipped
        const revealDelay = getTotalRevealDuration();
        setTimeout(() => {
            document.getElementById('target-card-image').src = targetCard.image;
            document.getElementById('target-card-name').textContent = targetCard.name;
            lossMessage.classList.remove('hidden');
            if (typeof Animations !== 'undefined' && Animations.lossBurst) {
                Animations.lossBurst({ particlesCount: 70, shake: true, flash: false });
            }
        }, revealDelay);
    }

    /**
     * Reset UI for new game
     */
    function resetUI() {
        guessesContainer.innerHTML = '';
        winMessage.classList.add('hidden');
        lossMessage.classList.add('hidden');
        searchInput.classList.remove('game-lost');
        searchInput.value = '';
        searchInput.disabled = false;
        searchInput.focus();
        hideAutocomplete();
    }

    /**
     * Show autocomplete dropdown
     */
    function showAutocomplete() {
        autocompleteList.classList.remove('hidden');
    }

    /**
     * Hide autocomplete dropdown
     */
    function hideAutocomplete() {
        autocompleteList.classList.add('hidden');
        selectedIndex = -1;
        currentResults = [];
    }

    /**
     * Show stats modal
     */
    function showStatsModal() {
        updateStatsDisplay();
        statsModal.classList.remove('hidden');
    }

    /**
     * Hide stats modal
     */
    function hideStatsModal() {
        statsModal.classList.add('hidden');
    }

    /**
     * Update stats display in modal (async)
     */
    function updateStatsDisplay() {
        // Show loading state
        document.getElementById('stat-games').textContent = '...';
        document.getElementById('stat-wins').textContent = '...';
        document.getElementById('stat-losses').textContent = '...';
        document.getElementById('stat-winrate').textContent = '...';
        document.getElementById('stat-average').textContent = '...';
        document.getElementById('stat-best').textContent = '...';
        document.getElementById('stat-score').textContent = '...';
        document.getElementById('stat-global-games').textContent = '...';
        
        Stats.getStats().then((stats) => {
            document.getElementById('stat-games').textContent = stats.gamesStarted;
            document.getElementById('stat-wins').textContent = stats.gamesWon;
            document.getElementById('stat-losses').textContent = stats.gamesLost;
            document.getElementById('stat-winrate').textContent = stats.winRate + '%';
            document.getElementById('stat-average').textContent = stats.averageGuesses;
            document.getElementById('stat-best').textContent = stats.bestGame || '-';
            document.getElementById('stat-score').textContent = formatScoreForDisplay(stats.globalScore || 0);
            document.getElementById('stat-global-games').textContent = stats.globalGamesStarted;
        }).catch((error) => {
            console.error('Error loading stats:', error);
            document.getElementById('stat-games').textContent = '-';
            document.getElementById('stat-wins').textContent = '-';
            document.getElementById('stat-losses').textContent = '-';
            document.getElementById('stat-winrate').textContent = '-';
            document.getElementById('stat-average').textContent = '-';
            document.getElementById('stat-best').textContent = '-';
            document.getElementById('stat-score').textContent = '-';
            document.getElementById('stat-global-games').textContent = '-';
        });
    }

    // Public API
    return {
        init,
        resetUI,
        updateStatsDisplay,
        showStatsModal,
        hideStatsModal
    };
})();
