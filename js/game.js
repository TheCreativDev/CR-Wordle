/**
 * Game Logic Module
 * Handles core game mechanics: card selection, comparison, and win detection
 */

const Game = (function() {
    // Private variables
    const MAX_GUESSES = 10;
    let targetCard = null;
    let guessedCards = [];
    let isGameWon = false;
    let isGameLost = false;

    /**
     * Initialize a new game with a random target card
     */
    function startNewGame() {
        targetCard = getRandomCard();
        guessedCards = [];
        isGameWon = false;
        isGameLost = false;
        console.log("New game started! Target:", targetCard.name); // Debug - remove in production
        return true;
    }

    /**
     * Get a random card from the card pool
     */
    function getRandomCard() {
        const randomIndex = Math.floor(Math.random() * CARDS.length);
        return CARDS[randomIndex];
    }

    /**
     * Check if a card has already been guessed
     */
    function isCardGuessed(cardId) {
        return guessedCards.some(card => card.id === cardId);
    }

    /**
     * Make a guess and get comparison results
     * @param {string} cardId - The ID of the guessed card
     * @returns {Object|null} - Comparison results or null if invalid guess
     */
    function makeGuess(cardId) {
        // Find the guessed card
        const guessedCard = CARDS.find(card => card.id === cardId);
        
        if (!guessedCard) {
            console.error("Card not found:", cardId);
            return null;
        }

        if (isCardGuessed(cardId)) {
            console.warn("Card already guessed:", cardId);
            return null;
        }

        if (isGameWon) {
            console.warn("Game already won");
            return null;
        }

        if (isGameLost) {
            console.warn("Game already lost");
            return null;
        }

        // Add to guessed cards
        guessedCards.push(guessedCard);

        // Compare the guessed card to the target
        const comparison = compareCards(guessedCard, targetCard);

        // Check for win
        if (guessedCard.id === targetCard.id) {
            isGameWon = true;
            comparison.isWin = true;
        }
        // Check for loss (max guesses reached and didn't win)
        else if (guessedCards.length >= MAX_GUESSES) {
            isGameLost = true;
            comparison.isLoss = true;
        }

        return comparison;
    }

    /**
     * Compare two cards and return comparison results
     * @param {Object} guessed - The guessed card
     * @param {Object} target - The target card
     * @returns {Object} - Comparison results for each attribute
     */
    function compareCards(guessed, target) {
        return {
            card: guessed,
            isWin: false,
            attributes: {
                elixir: compareNumeric(guessed.elixir, target.elixir),
                rarity: compareRarity(guessed.rarity, target.rarity),
                type: compareExact(guessed.type, target.type),
                range: compareExact(guessed.range, target.range),
                speed: compareSpeed(guessed.speed, target.speed),
                hitSpeed: compareHitSpeed(guessed.hitSpeed, target.hitSpeed),
                releaseYear: compareNumeric(guessed.releaseYear, target.releaseYear)
            }
        };
    }

    /**
     * Compare numeric values
     * @returns {Object} { value, isCorrect, direction }
     */
    function compareNumeric(guessed, target) {
        const isCorrect = guessed === target;
        let direction = null;
        
        if (!isCorrect) {
            direction = guessed < target ? "higher" : "lower";
        }

        return {
            value: guessed,
            isCorrect: isCorrect,
            direction: direction
        };
    }

    /**
     * Compare rarity values (ordinal comparison)
     */
    function compareRarity(guessed, target) {
        const guessedOrder = RARITY_ORDER[guessed];
        const targetOrder = RARITY_ORDER[target];
        const isCorrect = guessed === target;
        let direction = null;

        if (!isCorrect) {
            direction = guessedOrder < targetOrder ? "higher" : "lower";
        }

        return {
            value: guessed,
            isCorrect: isCorrect,
            direction: direction
        };
    }

    /**
     * Compare speed values (ordinal comparison)
     * N/A is treated as slower than "Slow" (order 0)
     */
    function compareSpeed(guessed, target) {
        // Case 1: Both are N/A → Correct match (green)
        if (guessed === "N/A" && target === "N/A") {
            return {
                value: guessed,
                isCorrect: true,
                direction: null,
                isNA: false  // Not grey, it's a correct match!
            };
        }

        // Case 2: Guessed is N/A, target is numeric → Show N/A as grey
        if (guessed === "N/A") {
            return {
                value: guessed,
                isCorrect: false,
                direction: null,
                isNA: false  // Grey cell, can't compare
            };
        }

        // Case 3: Target is N/A, guessed is numeric → Treat target as 0 (slower than Slow)
        if (target === "N/A") {
            // Any speed (Slow=1, Medium=2, etc.) is higher than N/A (0)
            return {
                value: guessed,
                isCorrect: false,
                direction: "lower",  // Target (N/A=0) is lower/slower than guess
                isNA: false
            };
        }

        // Case 4: Both are valid speeds → Normal comparison
        const guessedOrder = SPEED_ORDER[guessed];
        const targetOrder = SPEED_ORDER[target];
        const isCorrect = guessed === target;
        let direction = null;

        if (!isCorrect) {
            direction = guessedOrder < targetOrder ? "higher" : "lower";
        }

        return {
            value: guessed,
            isCorrect: isCorrect,
            direction: direction
        };
    }

    /**
     * Compare hit speed values (numeric, but can be N/A)
     */
    function compareHitSpeed(guessed, target) {
        // Case 1: Both are N/A → Correct match (green)
        if (guessed === "N/A" && target === "N/A") {
            return {
                value: guessed,
                isCorrect: true,
                direction: null,
                isNA: false // set to false bcs right match
            }
        };
        // Case 2: Guessed is N/A, target is numeric → Show N/A as grey
        if (guessed === "N/A") {
            return {
                value: guessed,
                isCorrect: false,
                direction: null,
                isNA: true  // Grey cell, can't compare
            };
        }
        // Case 3: Target is N/A, guessed is numeric → Treat target as 0
        if (target === "N/A") {
            // Guessed value is always > 0, so show "lower" arrow
            return {
                value: guessed,
                isCorrect: false,
                direction: "lower",  // Target (0) is lower than guess
                isNA: false
            };
        }
        // Case 4: Both are numeric → Normal comparison
        const isCorrect = guessed === target;
        let direction = null;

        if (!isCorrect) {
            // Lower hit speed = faster attacks, so logic is inverted for user understanding
            // But we show "lower" if guessed is higher than target (needs to go down)
            direction = guessed < target ? "higher" : "lower";
        }

        return {
            value: guessed,
            isCorrect: isCorrect,
            direction: direction
        };
    }

    /**
     * Compare exact match (for categorical values like type, range)
     */
    function compareExact(guessed, target) {
        return {
            value: guessed,
            isCorrect: guessed === target,
            direction: null
        };
    }

    /**
     * Get the current game state
     */
    function getGameState() {
        return {
            isGameWon: isGameWon,
            guessCount: guessedCards.length,
            guessedCards: [...guessedCards],
            targetCard: isGameWon ? targetCard : null // Only reveal target after win
        };
    }

    /**
     * Get the number of guesses made
     */
    function getGuessCount() {
        return guessedCards.length;
    }

    /**
     * Check if the game has been won
     */
    function hasWon() {
        return isGameWon;
    }

    /**
     * Get all available cards for autocomplete
     */
    function getAvailableCards() {
        return CARDS.filter(card => !isCardGuessed(card.id));
    }

    /**
     * Search cards by name (for autocomplete)
     */
    function searchCards(query) {
        const lowerQuery = query.toLowerCase().trim();
        if (!lowerQuery) return [];

        return CARDS.filter(card => 
            card.name.toLowerCase().includes(lowerQuery) && 
            !isCardGuessed(card.id)
        ).slice(0, 8); // Limit to 8 results
    }

    // Public API
    return {
        startNewGame,
        makeGuess,
        getGameState,
        getGuessCount,
        hasWon,
        hasLost: () => isGameLost,
        getTargetCard: () => targetCard,
        getAvailableCards,
        searchCards,
        isCardGuessed
    };
})();
