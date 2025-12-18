/**
 * Dashboard JavaScript
 * Handles filtering, view switching, card rendering, and modal functionality
 */

const Dashboard = (function() {
    // State
    let currentView = 'grid'; // 'grid' or 'list'
    let filteredCards = [];
    let currentModalIndex = -1;

    // DOM Elements
    let elements = {};

    /**
     * Initialize the dashboard
     */
    function init() {
        // Cache DOM elements
        cacheElements();
        
        // Set up event listeners
        setupEventListeners();
        
        // Initial render
        applyFilters();
        
        console.log(`Dashboard loaded with ${CARDS.length} cards`);
    }

    /**
     * Cache DOM elements for performance
     */
    function cacheElements() {
        elements = {
            // View toggle
            gridViewBtn: document.getElementById('grid-view-btn'),
            listViewBtn: document.getElementById('list-view-btn'),
            
            // Filter panel
            filterToggleBtn: document.getElementById('filter-toggle-btn'),
            filterPanel: document.getElementById('filter-panel'),
            activeFilterCount: document.getElementById('active-filter-count'),
            clearFiltersBtn: document.getElementById('clear-filters-btn'),
            noResultsClearBtn: document.getElementById('no-results-clear-btn'),
            
            // Filter inputs
            filterName: document.getElementById('filter-name'),
            filterElixirOp: document.getElementById('filter-elixir-op'),
            filterElixirVal: document.getElementById('filter-elixir-val'),
            filterHitspeedOp: document.getElementById('filter-hitspeed-op'),
            filterHitspeedVal: document.getElementById('filter-hitspeed-val'),
            filterYearOp: document.getElementById('filter-year-op'),
            filterYearVal: document.getElementById('filter-year-val'),
            filterRarity: document.getElementById('filter-rarity'),
            filterType: document.getElementById('filter-type'),
            filterRange: document.getElementById('filter-range'),
            filterSpeed: document.getElementById('filter-speed'),
            
            // Cards container
            cardsContainer: document.getElementById('cards-container'),
            cardCount: document.getElementById('card-count'),
            noResults: document.getElementById('no-results'),
            
            // Modal
            modal: document.getElementById('card-modal'),
            modalCloseBtn: document.getElementById('modal-close-btn'),
            modalPrevBtn: document.getElementById('modal-prev-btn'),
            modalNextBtn: document.getElementById('modal-next-btn'),
            modalCardImage: document.getElementById('modal-card-image'),
            modalMissingIndicator: document.getElementById('modal-missing-indicator'),
            modalCardName: document.getElementById('modal-card-name'),
            modalElixir: document.getElementById('modal-elixir'),
            modalRarity: document.getElementById('modal-rarity'),
            modalType: document.getElementById('modal-type'),
            modalRange: document.getElementById('modal-range'),
            modalSpeed: document.getElementById('modal-speed'),
            modalHitspeed: document.getElementById('modal-hitspeed'),
            modalYear: document.getElementById('modal-year'),
            modalCardIndex: document.getElementById('modal-card-index')
        };
    }

    /**
     * Set up event listeners
     */
    function setupEventListeners() {
        // View toggle
        elements.gridViewBtn.addEventListener('click', () => setView('grid'));
        elements.listViewBtn.addEventListener('click', () => setView('list'));
        
        // Filter toggle
        elements.filterToggleBtn.addEventListener('click', toggleFilterPanel);
        
        // Clear filters
        elements.clearFiltersBtn.addEventListener('click', clearAllFilters);
        elements.noResultsClearBtn.addEventListener('click', clearAllFilters);
        
        // Filter inputs - apply on change
        elements.filterName.addEventListener('input', debounce(applyFilters, 200));
        elements.filterElixirOp.addEventListener('change', applyFilters);
        elements.filterElixirVal.addEventListener('input', debounce(applyFilters, 200));
        elements.filterHitspeedOp.addEventListener('change', applyFilters);
        elements.filterHitspeedVal.addEventListener('input', debounce(applyFilters, 200));
        elements.filterYearOp.addEventListener('change', applyFilters);
        elements.filterYearVal.addEventListener('input', debounce(applyFilters, 200));
        
        // Checkbox filters
        [elements.filterRarity, elements.filterType, elements.filterRange, elements.filterSpeed].forEach(group => {
            group.addEventListener('change', applyFilters);
        });
        
        // Select All / Select None buttons
        document.querySelectorAll('.select-all-btn').forEach(btn => {
            btn.addEventListener('click', () => selectAllCheckboxes(btn.dataset.target, true));
        });
        document.querySelectorAll('.select-none-btn').forEach(btn => {
            btn.addEventListener('click', () => selectAllCheckboxes(btn.dataset.target, false));
        });
        
        // Modal events
        elements.modalCloseBtn.addEventListener('click', closeModal);
        elements.modal.querySelector('.modal-overlay').addEventListener('click', closeModal);
        elements.modalPrevBtn.addEventListener('click', showPreviousCard);
        elements.modalNextBtn.addEventListener('click', showNextCard);
        
        // Keyboard navigation
        document.addEventListener('keydown', handleKeyDown);
    }

    /**
     * Set the current view mode
     */
    function setView(view) {
        currentView = view;
        
        // Update buttons
        elements.gridViewBtn.classList.toggle('active', view === 'grid');
        elements.listViewBtn.classList.toggle('active', view === 'list');
        
        // Update container class
        elements.cardsContainer.classList.remove('grid-view', 'list-view');
        elements.cardsContainer.classList.add(view + '-view');
        
        // Re-render cards
        renderCards();
    }

    /**
     * Toggle filter panel visibility
     */
    function toggleFilterPanel() {
        const isHidden = elements.filterPanel.classList.toggle('hidden');
        elements.filterToggleBtn.classList.toggle('active', !isHidden);
    }

    /**
     * Select all or none checkboxes for a filter group
     */
    function selectAllCheckboxes(target, checked) {
        const group = document.getElementById('filter-' + target);
        group.querySelectorAll('input[type="checkbox"]').forEach(cb => {
            cb.checked = checked;
        });
        applyFilters();
    }

    /**
     * Clear all filters
     */
    function clearAllFilters() {
        // Reset text input
        elements.filterName.value = '';
        
        // Reset numeric filters
        elements.filterElixirOp.value = '';
        elements.filterElixirVal.value = '';
        elements.filterHitspeedOp.value = '';
        elements.filterHitspeedVal.value = '';
        elements.filterYearOp.value = '';
        elements.filterYearVal.value = '';
        
        // Reset all checkboxes to checked
        document.querySelectorAll('.checkbox-group input[type="checkbox"]').forEach(cb => {
            cb.checked = true;
        });
        
        applyFilters();
    }

    /**
     * Apply all filters and render results
     */
    function applyFilters() {
        let cards = [...CARDS];
        let activeFilters = 0;
        
        // Name filter
        const nameQuery = elements.filterName.value.toLowerCase().trim();
        if (nameQuery) {
            cards = cards.filter(card => card.name.toLowerCase().includes(nameQuery));
            activeFilters++;
        }
        
        // Elixir filter
        const elixirResult = applyNumericFilter(cards, 'elixir', elements.filterElixirOp.value, elements.filterElixirVal.value);
        cards = elixirResult.cards;
        if (elixirResult.active) activeFilters++;
        
        // Hit Speed filter
        const hitspeedOp = elements.filterHitspeedOp.value;
        if (hitspeedOp === 'na') {
            cards = cards.filter(card => card.hitSpeed === 'N/A');
            activeFilters++;
        } else {
            const hitspeedResult = applyNumericFilter(cards, 'hitSpeed', hitspeedOp, elements.filterHitspeedVal.value, true);
            cards = hitspeedResult.cards;
            if (hitspeedResult.active) activeFilters++;
        }
        
        // Year filter
        const yearResult = applyNumericFilter(cards, 'releaseYear', elements.filterYearOp.value, elements.filterYearVal.value);
        cards = yearResult.cards;
        if (yearResult.active) activeFilters++;
        
        // Rarity filter
        const rarityResult = applyCheckboxFilter(cards, 'rarity', elements.filterRarity);
        cards = rarityResult.cards;
        if (rarityResult.active) activeFilters++;
        
        // Type filter
        const typeResult = applyCheckboxFilter(cards, 'type', elements.filterType);
        cards = typeResult.cards;
        if (typeResult.active) activeFilters++;
        
        // Range filter
        const rangeResult = applyCheckboxFilter(cards, 'range', elements.filterRange);
        cards = rangeResult.cards;
        if (rangeResult.active) activeFilters++;
        
        // Speed filter
        const speedResult = applyCheckboxFilter(cards, 'speed', elements.filterSpeed);
        cards = speedResult.cards;
        if (speedResult.active) activeFilters++;
        
        // Update state and render
        filteredCards = cards;
        renderCards();
        updateFilterBadge(activeFilters);
    }

    /**
     * Apply a numeric filter
     */
    function applyNumericFilter(cards, field, op, val, allowNA = false) {
        if (!op || val === '') {
            return { cards, active: false };
        }
        
        const numVal = parseFloat(val);
        if (isNaN(numVal)) {
            return { cards, active: false };
        }
        
        const filtered = cards.filter(card => {
            const cardVal = card[field];
            
            // Handle N/A values
            if (cardVal === 'N/A') {
                return allowNA ? false : false;
            }
            
            switch (op) {
                case 'eq': return cardVal === numVal;
                case 'lt': return cardVal < numVal;
                case 'gt': return cardVal > numVal;
                case 'lte': return cardVal <= numVal;
                case 'gte': return cardVal >= numVal;
                default: return true;
            }
        });
        
        return { cards: filtered, active: true };
    }

    /**
     * Apply a checkbox filter
     */
    function applyCheckboxFilter(cards, field, groupElement) {
        const checkboxes = groupElement.querySelectorAll('input[type="checkbox"]');
        const checkedValues = [];
        let allChecked = true;
        
        checkboxes.forEach(cb => {
            if (cb.checked) {
                checkedValues.push(cb.value);
            } else {
                allChecked = false;
            }
        });
        
        // If all are checked, no filter is active
        if (allChecked) {
            return { cards, active: false };
        }
        
        const filtered = cards.filter(card => checkedValues.includes(card[field]));
        return { cards: filtered, active: true };
    }

    /**
     * Update the filter badge count
     */
    function updateFilterBadge(count) {
        if (count > 0) {
            elements.activeFilterCount.textContent = count;
            elements.activeFilterCount.classList.remove('hidden');
        } else {
            elements.activeFilterCount.classList.add('hidden');
        }
    }

    /**
     * Render cards based on current view and filters
     */
    function renderCards() {
        // Update count
        elements.cardCount.textContent = `${filteredCards.length} card${filteredCards.length !== 1 ? 's' : ''}`;
        
        // Show/hide no results
        if (filteredCards.length === 0) {
            elements.cardsContainer.innerHTML = '';
            elements.noResults.classList.remove('hidden');
            return;
        }
        
        elements.noResults.classList.add('hidden');
        
        // Render based on view
        if (currentView === 'grid') {
            renderGridView();
        } else {
            renderListView();
        }
    }

    /**
     * Render grid view
     */
    function renderGridView() {
        elements.cardsContainer.innerHTML = filteredCards.map((card, index) => `
            <div class="card-item" data-index="${index}" data-card-id="${card.id}">
                <div class="card-image-container">
                    <img class="card-image" src="${card.image}" alt="${card.name}" 
                         onerror="this.src='images/cards/placeholder.png'; this.parentElement.querySelector('.missing-indicator').classList.remove('hidden');">
                    <span class="missing-indicator hidden">Missing</span>
                </div>
                <span class="card-name">${card.name}</span>
            </div>
        `).join('');
        
        // Add click handlers
        addCardClickHandlers();
    }

    /**
     * Render list view
     */
    function renderListView() {
        elements.cardsContainer.innerHTML = filteredCards.map((card, index) => `
            <div class="card-item" data-index="${index}" data-card-id="${card.id}">
                <div class="card-image-container">
                    <img class="card-image" src="${card.image}" alt="${card.name}"
                         onerror="this.src='images/cards/placeholder.png'; this.parentElement.querySelector('.missing-indicator').classList.remove('hidden');">
                    <span class="missing-indicator hidden">Missing</span>
                </div>
                <span class="card-name">${card.name}</span>
                <div class="card-quick-info">
                    <span class="quick-info-item">💧 ${card.elixir}</span>
                    <span class="quick-info-item">📦 ${card.type}</span>
                    <span class="quick-info-item">⭐ ${card.rarity}</span>
                </div>
            </div>
        `).join('');
        
        // Add click handlers
        addCardClickHandlers();
    }

    /**
     * Add click handlers to card items
     */
    function addCardClickHandlers() {
        elements.cardsContainer.querySelectorAll('.card-item').forEach(item => {
            item.addEventListener('click', () => {
                const index = parseInt(item.dataset.index, 10);
                openModal(index);
            });
        });
    }

    /**
     * Open the card detail modal
     */
    function openModal(index) {
        currentModalIndex = index;
        const card = filteredCards[index];
        
        if (!card) return;
        
        // Set image
        elements.modalCardImage.src = card.image;
        elements.modalCardImage.onerror = function() {
            this.src = 'images/cards/placeholder.png';
            elements.modalMissingIndicator.classList.remove('hidden');
        };
        elements.modalCardImage.onload = function() {
            if (!this.src.includes('placeholder')) {
                elements.modalMissingIndicator.classList.add('hidden');
            }
        };
        elements.modalMissingIndicator.classList.add('hidden');
        
        // Set card details
        elements.modalCardName.textContent = card.name;
        elements.modalElixir.textContent = card.elixir;
        
        // Rarity with color
        elements.modalRarity.textContent = card.rarity;
        elements.modalRarity.className = 'attr-value rarity-' + card.rarity.toLowerCase();
        
        elements.modalType.textContent = card.type;
        elements.modalRange.textContent = card.range;
        elements.modalSpeed.textContent = card.speed;
        elements.modalHitspeed.textContent = card.hitSpeed === 'N/A' ? 'N/A' : card.hitSpeed + 's';
        elements.modalYear.textContent = card.releaseYear;
        
        // Card index
        elements.modalCardIndex.textContent = `${index + 1} of ${filteredCards.length}`;
        
        // Update navigation buttons
        elements.modalPrevBtn.disabled = index === 0;
        elements.modalNextBtn.disabled = index === filteredCards.length - 1;
        
        // Show modal
        elements.modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }

    /**
     * Close the modal
     */
    function closeModal() {
        elements.modal.classList.add('hidden');
        document.body.style.overflow = '';
        currentModalIndex = -1;
    }

    /**
     * Show previous card in modal
     */
    function showPreviousCard() {
        if (currentModalIndex > 0) {
            openModal(currentModalIndex - 1);
        }
    }

    /**
     * Show next card in modal
     */
    function showNextCard() {
        if (currentModalIndex < filteredCards.length - 1) {
            openModal(currentModalIndex + 1);
        }
    }

    /**
     * Handle keyboard navigation
     */
    function handleKeyDown(e) {
        // Only handle if modal is open
        if (elements.modal.classList.contains('hidden')) return;
        
        switch (e.key) {
            case 'Escape':
                closeModal();
                break;
            case 'ArrowLeft':
                showPreviousCard();
                break;
            case 'ArrowRight':
                showNextCard();
                break;
        }
    }

    /**
     * Debounce utility
     */
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Public API (for future edit functionality)
    return {
        refresh: applyFilters,
        getFilteredCards: () => [...filteredCards]
    };
})();
