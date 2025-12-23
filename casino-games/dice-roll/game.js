/**
 * Dice Roll Game
 * Guess if two dice total will be lower, higher, or exactly 7
 */

(function() {
    'use strict';

    const DICE_FACES = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

    // DOM Elements (assigned in init)
    let betInput, betMaxBtn, diceChoices, playAgainBtn;
    let dice1El, dice2El, displayEl, resultEl;

    /**
     * Initialize the game
     */
    function init() {
        // Get DOM elements
        betInput = document.getElementById('bet-input');
        betMaxBtn = document.getElementById('bet-max');
        diceChoices = document.querySelectorAll('.dice-choice');
        playAgainBtn = document.getElementById('play-again-btn');
        dice1El = document.getElementById('dice1');
        dice2El = document.getElementById('dice2');
        displayEl = document.getElementById('dice-display');
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

        // Dice choice selection
        diceChoices.forEach(choice => {
            choice.addEventListener('click', () => {
                const bet = parseInt(betInput.value);
                if (bet > CasinoShared.getScore() || bet < 1) {
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
                    CasinoShared.updateScore(CasinoShared.getScore() + winnings - bet);
                    if (typeof Animations !== 'undefined' && Animations.winConfettiForMultiplier) {
                        Animations.winConfettiForMultiplier(multiplier);
                    }
                } else {
                    resultEl.classList.add('lose');
                    resultText.textContent = `😢 You Lose! Total: ${total}`;
                    resultAmount.textContent = `-${bet} points`;
                    CasinoShared.updateScore(CasinoShared.getScore() - bet);
                    if (typeof Animations !== 'undefined' && Animations.bigLoss) {
                        Animations.bigLoss(bet);
                    }
                }

                playAgainBtn.classList.remove('hidden');
            }
        }, 80);
    }

    /**
     * Reset game state
     */
    function reset() {
        displayEl.classList.add('hidden');
        resultEl.classList.add('hidden');
        playAgainBtn.classList.add('hidden');
        diceChoices.forEach(el => {
            el.classList.remove('selected');
            el.disabled = false;
        });
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
