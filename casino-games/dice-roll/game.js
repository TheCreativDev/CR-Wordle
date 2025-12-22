/**
 * Dice Roll Game
 * Guess if two dice total will be lower, higher, or exactly 7
 */

(function() {
    'use strict';

    const DICE_FACES = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

    // Game configuration
    const config = {
        name: 'Dice Roll',
        description: 'Guess higher or lower. Beat the house!',
        icon: '🎲',
        odds: 'Up to 6x',
        enabled: true
    };

    // Shared context (set during init)
    let ctx = null;

    /**
     * Get the modal HTML for this game
     */
    function getModalHTML() {
        return `
            <div id="dice-game" class="game-container hidden">
                <h2 class="game-modal-title">🎲 Dice Roll</h2>
                <p class="game-modal-description">
                    Two dice will be rolled. Predict if the total will be <strong>higher than 7</strong>, 
                    <strong>exactly 7</strong>, or <strong>lower than 7</strong>. The riskier the bet, the bigger the reward!
                </p>
                
                <div class="bet-section">
                    <label class="bet-label">Your Bet</label>
                    <div class="bet-input-group">
                        <button class="bet-adjust" data-adjust="-10">-10</button>
                        <button class="bet-adjust" data-adjust="-1">-1</button>
                        <input type="number" id="dice-bet" class="bet-input" value="10" min="1">
                        <button class="bet-adjust" data-adjust="+1">+1</button>
                        <button class="bet-adjust" data-adjust="+10">+10</button>
                    </div>
                    <button class="bet-max" id="dice-bet-max">MAX</button>
                </div>

                <div class="dice-choices">
                    <button class="dice-choice" data-choice="low">
                        <span class="choice-label">Lower</span>
                        <span class="choice-range">2-6</span>
                        <span class="choice-multiplier">2x</span>
                    </button>
                    <button class="dice-choice lucky" data-choice="seven">
                        <span class="choice-label">Lucky 7</span>
                        <span class="choice-range">= 7</span>
                        <span class="choice-multiplier">6x</span>
                    </button>
                    <button class="dice-choice" data-choice="high">
                        <span class="choice-label">Higher</span>
                        <span class="choice-range">8-12</span>
                        <span class="choice-multiplier">2x</span>
                    </button>
                </div>

                <div class="dice-display hidden" id="dice-display">
                    <div class="dice" id="dice1">⚀</div>
                    <div class="dice" id="dice2">⚀</div>
                </div>

                <div class="game-result hidden" id="dice-result">
                    <span class="result-text"></span>
                    <span class="result-amount"></span>
                </div>

                <button class="play-again-btn hidden" id="dice-play-again">Roll Again</button>
            </div>
        `;
    }

    /**
     * Initialize the game
     */
    function init(context) {
        ctx = context;

        const betInput = document.getElementById('dice-bet');
        const betMaxBtn = document.getElementById('dice-bet-max');
        const diceChoices = document.querySelectorAll('.dice-choice');
        const playAgainBtn = document.getElementById('dice-play-again');

        if (!betInput) return; // Modal not rendered yet

        // Bet adjustments
        document.querySelectorAll('#dice-game .bet-adjust').forEach(btn => {
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

        // Dice choice selection
        diceChoices.forEach(choice => {
            choice.addEventListener('click', () => {
                const bet = parseInt(betInput.value);
                if (bet > ctx.getScore() || bet < 1) {
                    alert('Invalid bet amount!');
                    return;
                }

                diceChoices.forEach(c => {
                    c.classList.remove('selected');
                    c.disabled = true;
                });
                choice.classList.add('selected');
                
                rollDice(choice.dataset.choice, bet);
            });
        });

        playAgainBtn.addEventListener('click', () => {
            reset();
        });
    }

    /**
     * Roll the dice
     */
    function rollDice(choice, bet) {
        const dice1El = document.getElementById('dice1');
        const dice2El = document.getElementById('dice2');
        const displayEl = document.getElementById('dice-display');
        const resultEl = document.getElementById('dice-result');
        const playAgainBtn = document.getElementById('dice-play-again');

        displayEl.classList.remove('hidden');
        dice1El.classList.add('rolling');
        dice2El.classList.add('rolling');

        // Rolling animation
        let rollCount = 0;
        const rollInterval = setInterval(() => {
            dice1El.textContent = DICE_FACES[Math.floor(Math.random() * 6)];
            dice2El.textContent = DICE_FACES[Math.floor(Math.random() * 6)];
            rollCount++;

            if (rollCount >= 15) {
                clearInterval(rollInterval);
                
                // Final result
                const die1 = Math.floor(Math.random() * 6) + 1;
                const die2 = Math.floor(Math.random() * 6) + 1;
                const total = die1 + die2;

                dice1El.textContent = DICE_FACES[die1 - 1];
                dice2El.textContent = DICE_FACES[die2 - 1];
                dice1El.classList.remove('rolling');
                dice2El.classList.remove('rolling');

                // Determine win
                let won = false;
                let multiplier = 0;

                if (choice === 'low' && total < 7) {
                    won = true;
                    multiplier = 2;
                } else if (choice === 'high' && total > 7) {
                    won = true;
                    multiplier = 2;
                } else if (choice === 'seven' && total === 7) {
                    won = true;
                    multiplier = 6;
                }

                // Show result
                resultEl.classList.remove('hidden', 'win', 'lose');
                const resultText = resultEl.querySelector('.result-text');
                const resultAmount = resultEl.querySelector('.result-amount');

                if (won) {
                    const winnings = bet * multiplier;
                    resultEl.classList.add('win');
                    resultText.textContent = `🎉 You Win! Total: ${total}`;
                    resultAmount.textContent = `+${winnings.toFixed(0)} points`;
                    ctx.updateScore(ctx.getScore() + winnings - bet);
                } else {
                    resultEl.classList.add('lose');
                    resultText.textContent = `😢 You Lose! Total: ${total}`;
                    resultAmount.textContent = `-${bet} points`;
                    ctx.updateScore(ctx.getScore() - bet);
                }

                playAgainBtn.classList.remove('hidden');
            }
        }, 80);
    }

    /**
     * Reset game state
     */
    function reset() {
        document.getElementById('dice-display').classList.add('hidden');
        document.getElementById('dice-result').classList.add('hidden');
        document.getElementById('dice-play-again').classList.add('hidden');
        document.querySelectorAll('.dice-choice').forEach(el => {
            el.classList.remove('selected');
            el.disabled = false;
        });
    }

    // Register with the game registry
    CasinoGameRegistry.register('dice', {
        ...config,
        init: init,
        reset: reset,
        getModalHTML: getModalHTML
    });
})();
