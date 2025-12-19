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
    let playAgainBtn;
    let lossPlayAgainBtn;
    let statsBtn;
    let statsModal;
    let closeModalBtn;
    let resetStatsBtn;

    // Autocomplete state
    let selectedIndex = -1;
    let currentResults = [];

    // Category toggle state (persists during session only)
    const disabledCategories = new Set();
    const MIN_ENABLED_CATEGORIES = 2;
    const TOGGLEABLE_CATEGORIES = ['elixir', 'rarity', 'type', 'range', 'speed', 'hitSpeed', 'releaseYear'];

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
        playAgainBtn = document.getElementById('play-again-btn');
        lossPlayAgainBtn = document.getElementById('loss-play-again-btn');
        statsBtn = document.getElementById('stats-btn');
        statsModal = document.getElementById('stats-modal');
        closeModalBtn = document.getElementById('close-modal');
        resetStatsBtn = document.getElementById('reset-stats-btn');

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

        // Reset stats button
        resetStatsBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to reset all statistics?')) {
                Stats.reset();
                updateStatsDisplay();
            }
        });

        // Play again button
        playAgainBtn.addEventListener('click', () => {
            if (typeof App !== 'undefined' && App.startNewGame) {
                App.startNewGame();
            }
        });

        // Loss play again button
        lossPlayAgainBtn.addEventListener('click', () => {
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
            <!-- Card Image -->
            <div class="guess-cell card-cell">
                <img src="${card.image}" alt="${card.name}" onerror="this.src='images/cards/placeholder.png'">
                <span class="card-name">${card.name}</span>
            </div>
            
            <!-- Elixir -->
            ${renderAttributeCell(attrs.elixir, 'elixir')}
            
            <!-- Rarity -->
            ${renderAttributeCell(attrs.rarity, 'rarity')}
            
            <!-- Type -->
            ${renderAttributeCell(attrs.type, 'type')}
            
            <!-- Range -->
            ${renderAttributeCell(attrs.range, 'range')}
            
            <!-- Speed -->
            ${renderAttributeCell(attrs.speed, 'speed')}
            
            <!-- Hit Speed -->
            ${renderHitSpeedCell(attrs.hitSpeed, 'hitSpeed')}
            
            <!-- Release Year -->
            ${renderAttributeCell(attrs.releaseYear, 'releaseYear')}
        `;

        // Insert at top of guesses container
        guessesContainer.insertBefore(row, guessesContainer.firstChild);
    }

    /**
     * Render a single attribute cell
     */
    function renderAttributeCell(attr, category = null) {
        // Check if this category is disabled
        if (category && isCategoryDisabled(category)) {
            return `<div class="guess-cell disabled-category"></div>`;
        }

        if (attr.isNA) {
            return `<div class="guess-cell na">N/A</div>`;
        }

        const statusClass = attr.isCorrect ? 'correct' : 'incorrect';
        const arrow = attr.direction ? getArrow(attr.direction) : '';

        return `
            <div class="guess-cell ${statusClass}">
                <span>${attr.value}</span>
                ${arrow ? `<span class="arrow">${arrow}</span>` : ''}
            </div>
        `;
    }

    /**
     * Render hit speed cell (handles decimal display)
     */
    function renderHitSpeedCell(attr, category = null) {
        // Check if this category is disabled
        if (category && isCategoryDisabled(category)) {
            return `<div class="guess-cell disabled-category"></div>`;
        }

        if (attr.isNA || attr.value === "N/A") {
            return `<div class="guess-cell na">N/A</div>`;
        }

        const statusClass = attr.isCorrect ? 'correct' : 'incorrect';
        const arrow = attr.direction ? getArrow(attr.direction) : '';
        const displayValue = typeof attr.value === 'number' ? attr.value.toFixed(1) + 's' : attr.value;

        return `
            <div class="guess-cell ${statusClass}">
                <span>${displayValue}</span>
                ${arrow ? `<span class="arrow">${arrow}</span>` : ''}
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
     * Handle game win
     */
    function handleWin() {
        const guessCount = Game.getGuessCount();
        const gameState = Game.getGameState();
        
        // Update stats
        Stats.recordWin(guessCount);
        
        // Log to Firebase
        if (typeof FirebaseAnalytics !== 'undefined') {
            FirebaseAnalytics.logGame({
                won: true,
                guesses: guessCount,
                targetCard: gameState.targetCard.name,
                guessedCards: gameState.guessedCards.map(c => c.name)
            });
        }
        
        // Show win message
        guessCountSpan.textContent = guessCount;
        winMessage.classList.remove('hidden');
        
        // Disable search
        searchInput.disabled = true;
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
                targetCard: targetCard.name,
                guessedCards: gameState.guessedCards.map(c => c.name)
            });
        }
        
        // Show loss message with target card
        document.getElementById('target-card-image').src = targetCard.image;
        document.getElementById('target-card-name').textContent = targetCard.name;
        lossMessage.classList.remove('hidden');
        
        // Add red tint to search input
        searchInput.classList.add('game-lost');
        
        // Disable search
        searchInput.disabled = true;
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
     * Update stats display in modal
     */
    function updateStatsDisplay() {
        const stats = Stats.getStats();
        
        document.getElementById('stat-games').textContent = stats.gamesPlayed;
        document.getElementById('stat-wins').textContent = stats.gamesWon;
        document.getElementById('stat-winrate').textContent = stats.winRate + '%';
        document.getElementById('stat-average').textContent = stats.averageGuesses;
        document.getElementById('stat-best').textContent = stats.bestGame || '-';
        document.getElementById('stat-streak').textContent = stats.currentStreak;
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
