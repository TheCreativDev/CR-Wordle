/**
 * Crash Game
 * Cash out before the multiplier crashes
 */

(function() {
    'use strict';

    // Game state
    let crashInterval = null;
    let crashMultiplier = 1;
    let crashPoint = 1;
    let hasCashedOut = false;

    // DOM Elements (assigned in init)
    let betInput, betMaxBtn, startBtn, cashoutBtn, playAgainBtn;
    let multiplierEl, lineEl, resultEl;

    /**
     * Initialize the game
     */
    function init() {
        // Get DOM elements
        betInput = document.getElementById('bet-input');
        betMaxBtn = document.getElementById('bet-max');
        startBtn = document.getElementById('start-btn');
        cashoutBtn = document.getElementById('cashout-btn');
        playAgainBtn = document.getElementById('play-again-btn');
        multiplierEl = document.getElementById('crash-multiplier');
        lineEl = document.getElementById('crash-line');
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

        startBtn.addEventListener('click', () => {
            const bet = parseInt(betInput.value);
            if (bet > CasinoShared.getScore() || bet < 1) {
                alert('Invalid bet amount!');
                return;
            }
            startCrash(bet);
        });

        cashoutBtn.addEventListener('click', () => {
            cashOut();
        });

        playAgainBtn.addEventListener('click', () => {
            reset();
        });
    }

    /**
     * Start the crash game
     */
    function startCrash(bet) {
        // Generate crash point (exponential distribution)
        const random = Math.random();
        crashPoint = Math.max(1.01, 1 / (1 - random * 0.99));
        crashPoint = Math.min(crashPoint, 20); // Cap at 20x
        
        crashMultiplier = 1;
        hasCashedOut = false;

        startBtn.disabled = true;
        startBtn.classList.add('hidden');
        cashoutBtn.classList.remove('hidden');
        resultEl.classList.add('hidden');
        playAgainBtn.classList.add('hidden');

        const startTime = performance.now();
        
        crashInterval = setInterval(() => {
            const elapsed = (performance.now() - startTime) / 1000;
            crashMultiplier = Math.pow(1.05, elapsed * 10);

            // Update display
            multiplierEl.textContent = crashMultiplier.toFixed(2) + 'x';
            const lineWidth = Math.min((crashMultiplier - 1) / 5 * 100, 100);
            lineEl.style.width = lineWidth + '%';

            // Check for crash
            if (crashMultiplier >= crashPoint) {
                crash(bet);
            }
        }, 50);
    }

    /**
     * Cash out before crash
     */
    function cashOut() {
        if (hasCashedOut || !crashInterval) return;
        
        hasCashedOut = true;
        clearInterval(crashInterval);
        crashInterval = null;

        const bet = parseInt(betInput.value);
        const winnings = bet * crashMultiplier;
        
        const resultText = resultEl.querySelector('.result-text');
        const resultAmount = resultEl.querySelector('.result-amount');

        cashoutBtn.classList.add('hidden');
        
        resultEl.classList.remove('hidden', 'win', 'lose');
        resultEl.classList.add('win');
        resultText.textContent = `🎉 Cashed out at ${crashMultiplier.toFixed(2)}x!`;
        resultAmount.textContent = `+${(winnings - bet).toFixed(0)} points`;
        
        CasinoShared.updateScore(CasinoShared.getScore() + winnings - bet);
        if (typeof Animations !== 'undefined' && Animations.winConfettiForMultiplier) {
            Animations.winConfettiForMultiplier(crashMultiplier);
        }
        playAgainBtn.classList.remove('hidden');
    }

    /**
     * Handle crash
     */
    function crash(bet) {
        clearInterval(crashInterval);
        crashInterval = null;

        const resultText = resultEl.querySelector('.result-text');
        const resultAmount = resultEl.querySelector('.result-amount');

        multiplierEl.textContent = crashPoint.toFixed(2) + 'x';
        multiplierEl.classList.add('crashed');
        lineEl.classList.add('crashed');
        cashoutBtn.classList.add('hidden');

        if (!hasCashedOut) {
            resultEl.classList.remove('hidden', 'win', 'lose');
            resultEl.classList.add('lose');
            resultText.textContent = `💥 Crashed at ${crashPoint.toFixed(2)}x!`;
            resultAmount.textContent = `-${bet} points`;
            CasinoShared.updateScore(CasinoShared.getScore() - bet);
            if (typeof Animations !== 'undefined' && Animations.bigLoss) {
                Animations.bigLoss(bet);
            }
        }

        playAgainBtn.classList.remove('hidden');
    }

    /**
     * Reset game state
     */
    function reset() {
        // Stop any running game
        if (crashInterval) {
            clearInterval(crashInterval);
            crashInterval = null;
        }

        crashMultiplier = 1;
        hasCashedOut = false;
        
        multiplierEl.textContent = '1.00x';
        multiplierEl.classList.remove('crashed');
        lineEl.style.width = '0';
        lineEl.classList.remove('crashed');
        resultEl.classList.add('hidden');
        playAgainBtn.classList.add('hidden');
        startBtn.classList.remove('hidden');
        startBtn.disabled = false;
        cashoutBtn.classList.add('hidden');
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
