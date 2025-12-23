/**
 * Coin Flip Game
 * Pick Heads or Tails. 2x win, ultra-rare edge 10x.
 */

(function() {
    'use strict';

    // DOM Elements (assigned in init)
    let betInput, betMaxBtn, choiceButtons, playAgainBtn;
    let coinEl, resultEl;

    function init() {
        betInput = document.getElementById('bet-input');
        betMaxBtn = document.getElementById('bet-max');
        choiceButtons = document.querySelectorAll('.coin-choice');
        playAgainBtn = document.getElementById('play-again-btn');
        coinEl = document.getElementById('coin');
        resultEl = document.getElementById('game-result');

        if (!betInput) return;

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

        // Choices
        choiceButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const bet = parseInt(betInput.value);
                if (bet > CasinoShared.getScore() || bet < 1) {
                    alert('Invalid bet amount!');
                    return;
                }

                // Disable choices during flip
                choiceButtons.forEach(b => {
                    b.classList.remove('selected');
                    b.disabled = true;
                });
                btn.classList.add('selected');

                flipCoin(btn.dataset.choice, bet);
            });
        });

        playAgainBtn.addEventListener('click', () => {
            reset();
        });
    }

    function flipCoin(choice, bet) {
        resultEl.classList.add('hidden');
        resultEl.classList.remove('win', 'lose');
        playAgainBtn.classList.add('hidden');

        coinEl.classList.remove('edge-win');
        // Decide result with ultra-rare edge event (~0.2%)
        const edgeEvent = Math.random() < 0.002;
        if (edgeEvent) {
            coinEl.classList.add('edge-win');
            // Delay then resolve jackpot
            setTimeout(() => {
                showResult('edge', true, 10, bet);
            }, 1600);
            return;
        }

        // Normal flip
        coinEl.classList.add('spinning');

        // After animation, resolve to heads/tails
        setTimeout(() => {
            coinEl.classList.remove('spinning');
            const isHeads = Math.random() < 0.5;
            const outcome = isHeads ? 'heads' : 'tails';
            const won = outcome === choice;
            showResult(outcome, won, won ? 2 : 0, bet);
        }, 1800);
    }

    function showResult(outcome, won, multiplier, bet) {
        resultEl.classList.remove('hidden', 'win', 'lose', 'push');
        const resultText = resultEl.querySelector('.result-text');
        const resultAmount = resultEl.querySelector('.result-amount');

        if (outcome === 'edge') {
            const winnings = bet * multiplier;
            resultEl.classList.add('win');
            resultText.textContent = `💫 Edge! Jackpot ${multiplier}x`;
            resultAmount.textContent = `+${winnings.toFixed(0)} points`;
            CasinoShared.updateScore(CasinoShared.getScore() + winnings - bet);
            if (typeof Animations !== 'undefined' && Animations.winConfettiForMultiplier) {
                Animations.winConfettiForMultiplier(multiplier);
            }
        } else if (won) {
            const winnings = bet * multiplier;
            resultEl.classList.add('win');
            resultText.textContent = `🎉 You Win! ${outcome.toUpperCase()} (${multiplier}x)`;
            resultAmount.textContent = `+${winnings.toFixed(0)} points`;
            CasinoShared.updateScore(CasinoShared.getScore() + winnings - bet);
            if (typeof Animations !== 'undefined' && Animations.winConfettiForMultiplier) {
                Animations.winConfettiForMultiplier(multiplier);
            }
        } else {
            resultEl.classList.add('lose');
            resultText.textContent = `😢 You Lose! It was ${outcome.toUpperCase()}`;
            resultAmount.textContent = `-${bet} points`;
            CasinoShared.updateScore(CasinoShared.getScore() - bet);
            if (typeof Animations !== 'undefined' && Animations.bigLoss) {
                Animations.bigLoss(bet);
            }
        }

        playAgainBtn.classList.remove('hidden');
        // Re-enable choices
        document.querySelectorAll('.coin-choice').forEach(b => { b.disabled = false; });
    }

    function reset() {
        resultEl.classList.add('hidden');
        playAgainBtn.classList.add('hidden');
        document.querySelectorAll('.coin-choice').forEach(b => {
            b.classList.remove('selected');
            b.disabled = false;
        });
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
