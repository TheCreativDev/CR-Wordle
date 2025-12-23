/**
 * Card Draw Game
 * Draw a higher card than the dealer to win
 */

(function() {
    'use strict';

    const CARD_VALUES = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
    const CARD_SUITS = ['♠', '♥', '♦', '♣'];

    // DOM Elements (assigned in init)
    let betInput, betMaxBtn, drawBtn, playAgainBtn;
    let dealerCardEl, playerCardEl, resultEl;

    /**
     * Initialize the game
     */
    function init() {
        // Get DOM elements
        betInput = document.getElementById('bet-input');
        betMaxBtn = document.getElementById('bet-max');
        drawBtn = document.getElementById('draw-btn');
        playAgainBtn = document.getElementById('play-again-btn');
        dealerCardEl = document.getElementById('dealer-card');
        playerCardEl = document.getElementById('player-card');
        resultEl = document.getElementById('game-result');

        if (!betInput) return; // Elements not found

        // Bet adjustments
        document.querySelectorAll('.bet-adjust').forEach(btn => {
            btn.addEventListener('click', () => {
                const adjust = parseInt(btn.dataset.adjust);
                let newValue = Math.max(1, parseInt(betInput.value || 0) + adjust);
                newValue = Math.min(newValue, Math.floor(CasinoShared.getScore()));
                betInput.value = newValue;
            });
        });

        betMaxBtn.addEventListener('click', () => {
            betInput.value = Math.floor(CasinoShared.getScore());
        });

        drawBtn.addEventListener('click', () => {
            const bet = parseInt(betInput.value);
            if (bet > CasinoShared.getScore() || bet < 1) {
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
                    CasinoShared.updateScore(CasinoShared.getScore() + winnings - bet);
                    if (typeof Animations !== 'undefined' && Animations.winConfettiForMultiplier) {
                        Animations.winConfettiForMultiplier(multiplier);
                    }
                } else if (diff < 0) {
                    // Player loses
                    resultEl.classList.add('lose');
                    resultText.textContent = '😢 Dealer Wins!';
                    resultAmount.textContent = `-${bet} points`;
                    CasinoShared.updateScore(CasinoShared.getScore() - bet);
                    if (typeof Animations !== 'undefined' && Animations.bigLoss) {
                        Animations.bigLoss(bet);
                    }
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
        dealerCardEl.textContent = '?';
        playerCardEl.textContent = '?';
        dealerCardEl.className = 'playing-card';
        playerCardEl.className = 'playing-card';
        resultEl.classList.add('hidden');
        playAgainBtn.classList.add('hidden');
        drawBtn.disabled = false;
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
