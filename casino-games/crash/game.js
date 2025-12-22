/**
 * Crash Game
 * Cash out before the multiplier crashes
 */

(function() {
    'use strict';

    // Game configuration
    const config = {
        name: 'Crash',
        description: 'Cash out before the multiplier crashes!',
        icon: '📈',
        odds: 'Unlimited',
        enabled: true
    };

    // Game state
    let ctx = null;
    let crashInterval = null;
    let crashMultiplier = 1;
    let crashPoint = 1;
    let hasCashedOut = false;

    /**
     * Get the modal HTML for this game
     */
    function getModalHTML() {
        return `
            <div id="crash-game" class="game-container hidden">
                <h2 class="game-modal-title">📈 Crash</h2>
                <p class="game-modal-description">
                    The multiplier starts at 1.00x and rises rapidly. 
                    <strong>Cash out before it crashes!</strong> The crash point is random - 
                    it could crash at 1.01x or soar past 10x. Greed is your enemy!
                </p>
                
                <div class="bet-section">
                    <label class="bet-label">Your Bet</label>
                    <div class="bet-input-group">
                        <button class="bet-adjust" data-adjust="-10">-10</button>
                        <button class="bet-adjust" data-adjust="-1">-1</button>
                        <input type="number" id="crash-bet" class="bet-input" value="10" min="1">
                        <button class="bet-adjust" data-adjust="+1">+1</button>
                        <button class="bet-adjust" data-adjust="+10">+10</button>
                    </div>
                    <button class="bet-max" id="crash-bet-max">MAX</button>
                </div>

                <div class="crash-display">
                    <div class="crash-multiplier" id="crash-multiplier">1.00x</div>
                    <div class="crash-graph" id="crash-graph">
                        <div class="crash-line" id="crash-line"></div>
                    </div>
                </div>

                <div class="crash-controls">
                    <button class="crash-start-btn" id="crash-start">Start Round</button>
                    <button class="crash-cashout-btn hidden" id="crash-cashout">Cash Out</button>
                </div>

                <div class="game-result hidden" id="crash-result">
                    <span class="result-text"></span>
                    <span class="result-amount"></span>
                </div>

                <button class="play-again-btn hidden" id="crash-play-again">Play Again</button>
            </div>
        `;
    }

    /**
     * Initialize the game
     */
    function init(context) {
        ctx = context;

        const betInput = document.getElementById('crash-bet');
        const betMaxBtn = document.getElementById('crash-bet-max');
        const startBtn = document.getElementById('crash-start');
        const cashoutBtn = document.getElementById('crash-cashout');
        const playAgainBtn = document.getElementById('crash-play-again');

        if (!betInput) return; // Modal not rendered yet

        // Bet adjustments
        document.querySelectorAll('#crash-game .bet-adjust').forEach(btn => {
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

        startBtn.addEventListener('click', () => {
            const bet = parseInt(betInput.value);
            if (bet > ctx.getScore() || bet < 1) {
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
        const startBtn = document.getElementById('crash-start');
        const cashoutBtn = document.getElementById('crash-cashout');
        const multiplierEl = document.getElementById('crash-multiplier');
        const lineEl = document.getElementById('crash-line');
        const resultEl = document.getElementById('crash-result');
        const playAgainBtn = document.getElementById('crash-play-again');

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

        const bet = parseInt(document.getElementById('crash-bet').value);
        const winnings = bet * crashMultiplier;
        
        const cashoutBtn = document.getElementById('crash-cashout');
        const resultEl = document.getElementById('crash-result');
        const playAgainBtn = document.getElementById('crash-play-again');
        const resultText = resultEl.querySelector('.result-text');
        const resultAmount = resultEl.querySelector('.result-amount');

        cashoutBtn.classList.add('hidden');
        
        resultEl.classList.remove('hidden', 'win', 'lose');
        resultEl.classList.add('win');
        resultText.textContent = `🎉 Cashed out at ${crashMultiplier.toFixed(2)}x!`;
        resultAmount.textContent = `+${(winnings - bet).toFixed(0)} points`;
        
        ctx.updateScore(ctx.getScore() + winnings - bet);
        playAgainBtn.classList.remove('hidden');
    }

    /**
     * Handle crash
     */
    function crash(bet) {
        clearInterval(crashInterval);
        crashInterval = null;

        const multiplierEl = document.getElementById('crash-multiplier');
        const lineEl = document.getElementById('crash-line');
        const cashoutBtn = document.getElementById('crash-cashout');
        const resultEl = document.getElementById('crash-result');
        const playAgainBtn = document.getElementById('crash-play-again');
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
            ctx.updateScore(ctx.getScore() - bet);
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
        
        document.getElementById('crash-multiplier').textContent = '1.00x';
        document.getElementById('crash-multiplier').classList.remove('crashed');
        document.getElementById('crash-line').style.width = '0';
        document.getElementById('crash-line').classList.remove('crashed');
        document.getElementById('crash-result').classList.add('hidden');
        document.getElementById('crash-play-again').classList.add('hidden');
        document.getElementById('crash-start').classList.remove('hidden');
        document.getElementById('crash-start').disabled = false;
        document.getElementById('crash-cashout').classList.add('hidden');
    }

    // Register with the game registry
    CasinoGameRegistry.register('crash', {
        ...config,
        init: init,
        reset: reset,
        getModalHTML: getModalHTML
    });
})();
