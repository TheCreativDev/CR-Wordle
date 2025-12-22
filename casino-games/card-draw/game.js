/**
 * Card Draw Game
 * Draw a higher card than the dealer to win
 */

(function() {
    'use strict';

    const CARD_VALUES = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
    const CARD_SUITS = ['♠', '♥', '♦', '♣'];

    // Game configuration
    const config = {
        name: 'Card Draw',
        description: "Draw a card and beat the dealer's hand.",
        icon: '🃏',
        odds: 'Up to 3x',
        enabled: true
    };

    // Shared context (set during init)
    let ctx = null;

    /**
     * Get the modal HTML for this game
     */
    function getModalHTML() {
        return `
            <div id="cards-game" class="game-container hidden">
                <h2 class="game-modal-title">🃏 Card Draw</h2>
                <p class="game-modal-description">
                    Draw a card higher than the dealer to win! Ace is highest (14). 
                    If you draw higher by 5+ ranks, win <strong>3x</strong>. 
                    By 2-4 ranks, win <strong>2x</strong>. By 1 rank, win <strong>1.5x</strong>. Ties push.
                </p>
                
                <div class="bet-section">
                    <label class="bet-label">Your Bet</label>
                    <div class="bet-input-group">
                        <button class="bet-adjust" data-adjust="-10">-10</button>
                        <button class="bet-adjust" data-adjust="-1">-1</button>
                        <input type="number" id="cards-bet" class="bet-input" value="10" min="1">
                        <button class="bet-adjust" data-adjust="+1">+1</button>
                        <button class="bet-adjust" data-adjust="+10">+10</button>
                    </div>
                    <button class="bet-max" id="cards-bet-max">MAX</button>
                </div>

                <div class="cards-display">
                    <div class="card-slot dealer-slot">
                        <span class="card-slot-label">Dealer</span>
                        <div class="playing-card" id="dealer-card">?</div>
                    </div>
                    <div class="vs-indicator">VS</div>
                    <div class="card-slot player-slot">
                        <span class="card-slot-label">You</span>
                        <div class="playing-card" id="player-card">?</div>
                    </div>
                </div>

                <button class="draw-btn" id="draw-cards-btn">Draw Cards</button>

                <div class="game-result hidden" id="cards-result">
                    <span class="result-text"></span>
                    <span class="result-amount"></span>
                </div>

                <button class="play-again-btn hidden" id="cards-play-again">Draw Again</button>
            </div>
        `;
    }

    /**
     * Initialize the game
     */
    function init(context) {
        ctx = context;

        const betInput = document.getElementById('cards-bet');
        const betMaxBtn = document.getElementById('cards-bet-max');
        const drawBtn = document.getElementById('draw-cards-btn');
        const playAgainBtn = document.getElementById('cards-play-again');

        if (!betInput) return; // Modal not rendered yet

        // Bet adjustments
        document.querySelectorAll('#cards-game .bet-adjust').forEach(btn => {
            btn.addEventListener('click', () => {
                const adjust = parseInt(btn.dataset.adjust);
                let newValue = Math.max(1, parseInt(betInput.value || 0) + adjust);
                newValue = Math.min(newValue, Math.floor(ctx.getScore()));
                betInput.value = newValue;
            });
        });

        betMaxBtn.addEventListener('click', () => {
            betInput.value = Math.floor(ctx.getScore());
        });

        drawBtn.addEventListener('click', () => {
            const bet = parseInt(betInput.value);
            if (bet > ctx.getScore() || bet < 1) {
                alert('Invalid bet amount!');
                return;
            }
            drawBtn.disabled = true;
            drawCards(bet);
        });

        playAgainBtn.addEventListener('click', () => {
            reset();
        });
    }

    /**
     * Draw cards and determine winner
     */
    function drawCards(bet) {
        const dealerCardEl = document.getElementById('dealer-card');
        const playerCardEl = document.getElementById('player-card');
        const resultEl = document.getElementById('cards-result');
        const playAgainBtn = document.getElementById('cards-play-again');

        // Draw random cards
        const dealerValue = Math.floor(Math.random() * 13);
        const playerValue = Math.floor(Math.random() * 13);
        const dealerSuit = CARD_SUITS[Math.floor(Math.random() * 4)];
        const playerSuit = CARD_SUITS[Math.floor(Math.random() * 4)];

        const dealerCard = CARD_VALUES[dealerValue] + dealerSuit;
        const playerCard = CARD_VALUES[playerValue] + playerSuit;

        // Show dealer card first
        setTimeout(() => {
            dealerCardEl.textContent = dealerCard;
            dealerCardEl.classList.add('revealed');
            dealerCardEl.classList.add(dealerSuit === '♥' || dealerSuit === '♦' ? 'red' : 'black');
        }, 300);

        // Show player card
        setTimeout(() => {
            playerCardEl.textContent = playerCard;
            playerCardEl.classList.add('revealed');
            playerCardEl.classList.add(playerSuit === '♥' || playerSuit === '♦' ? 'red' : 'black');

            // Determine winner
            setTimeout(() => {
                resultEl.classList.remove('hidden', 'win', 'lose', 'push');
                const resultText = resultEl.querySelector('.result-text');
                const resultAmount = resultEl.querySelector('.result-amount');

                const diff = playerValue - dealerValue;

                if (diff > 0) {
                    // Player wins
                    let multiplier;
                    if (diff >= 5) {
                        multiplier = 3;
                    } else if (diff >= 2) {
                        multiplier = 2;
                    } else {
                        multiplier = 1.5;
                    }
                    const winnings = bet * multiplier;
                    resultEl.classList.add('win');
                    resultText.textContent = `🎉 You Win! (${multiplier}x)`;
                    resultAmount.textContent = `+${winnings.toFixed(0)} points`;
                    ctx.updateScore(ctx.getScore() + winnings - bet);
                } else if (diff < 0) {
                    // Player loses
                    resultEl.classList.add('lose');
                    resultText.textContent = '😢 Dealer Wins!';
                    resultAmount.textContent = `-${bet} points`;
                    ctx.updateScore(ctx.getScore() - bet);
                } else {
                    // Push
                    resultEl.classList.add('push');
                    resultText.textContent = "🤝 Push! It's a tie.";
                    resultAmount.textContent = 'Bet returned';
                }

                playAgainBtn.classList.remove('hidden');
            }, 400);
        }, 800);
    }

    /**
     * Reset game state
     */
    function reset() {
        document.getElementById('dealer-card').textContent = '?';
        document.getElementById('player-card').textContent = '?';
        document.getElementById('dealer-card').className = 'playing-card';
        document.getElementById('player-card').className = 'playing-card';
        document.getElementById('cards-result').classList.add('hidden');
        document.getElementById('cards-play-again').classList.add('hidden');
        document.getElementById('draw-cards-btn').disabled = false;
    }

    // Register with the game registry
    CasinoGameRegistry.register('cards', {
        ...config,
        init: init,
        reset: reset,
        getModalHTML: getModalHTML
    });
})();
