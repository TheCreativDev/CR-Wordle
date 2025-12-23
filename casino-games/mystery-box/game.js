/**
 * Mystery Box Game
 * Choose a box; reveal a weighted random multiplier.
 */

(function() {
    'use strict';

    let betInput, betMaxBtn, playAgainBtn;
    let resultEl;

    const boxes = {
        wooden: [
            { m: 0.5, w: 20 },
            { m: 1.0, w: 30 }, // push
            { m: 1.25, w: 30 },
            { m: 1.5, w: 15 },
            { m: 2.0, w: 5 }
        ],
        golden: [
            { m: 0.0, w: 15 }, // lose
            { m: 1.0, w: 20 }, // push
            { m: 1.5, w: 30 },
            { m: 2.5, w: 20 },
            { m: 4.0, w: 10 },
            { m: 6.0, w: 5 }
        ],
        legendary: [
            { m: 0.0, w: 45 },
            { m: 2.0, w: 25 },
            { m: 4.0, w: 15 },
            { m: 6.0, w: 10 },
            { m: 10.0, w: 5 }
        ]
    };

    function init() {
        betInput = document.getElementById('bet-input');
        betMaxBtn = document.getElementById('bet-max');
        playAgainBtn = document.getElementById('play-again-btn');
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

        document.querySelectorAll('.mystery-box').forEach(box => {
            box.addEventListener('click', () => {
                const bet = parseInt(betInput.value);
                if (bet > CasinoShared.getScore() || bet < 1) {
                    alert('Invalid bet amount!');
                    return;
                }

                // Select visual state
                document.querySelectorAll('.mystery-box').forEach(b => {
                    b.classList.remove('selected');
                    b.disabled = true;
                });
                box.classList.add('selected');

                openBox(box.dataset.box, box, bet);
            });
        });

        playAgainBtn.addEventListener('click', () => reset());
    }

    function openBox(kind, boxEl, bet) {
        // Animate opening
        boxEl.classList.add('open');

        setTimeout(() => {
            const outcome = weightedOutcome(boxes[kind]);
            showOutcome(kind, outcome, bet);
        }, 700);
    }

    function weightedOutcome(list) {
        const total = list.reduce((s, o) => s + o.w, 0);
        let r = Math.random() * total;
        for (const o of list) {
            if (r < o.w) return o.m;
            r -= o.w;
        }
        return list[list.length - 1].m;
    }

    function showOutcome(kind, multiplier, bet) {
        resultEl.classList.remove('hidden', 'win', 'lose', 'push');
        const resultText = resultEl.querySelector('.result-text');
        const resultAmount = resultEl.querySelector('.result-amount');

        if (multiplier === 0) {
            resultEl.classList.add('lose');
            resultText.textContent = kind === 'legendary' ? '💀 Empty Legendary! 0x' : '😢 Empty Box! 0x';
            resultAmount.textContent = `-${bet} points`;
            CasinoShared.updateScore(CasinoShared.getScore() - bet);
            if (typeof Animations !== 'undefined' && Animations.bigLoss) {
                Animations.bigLoss(bet);
            }
        } else if (multiplier === 1.0) {
            resultEl.classList.add('push');
            resultText.textContent = '🤝 Push! 1x';
            resultAmount.textContent = 'Bet returned';
        } else {
            const winnings = bet * multiplier;
            resultEl.classList.add('win');
            const flair = multiplier >= 6 ? '✨ Legendary Loot!' : multiplier >= 4 ? '🎁 Epic Treasure!' : '🎉 You Win!';
            resultText.textContent = `${flair} (${multiplier}x)`;
            resultAmount.textContent = `+${winnings.toFixed(0)} points`;
            CasinoShared.updateScore(CasinoShared.getScore() + winnings - bet);
            if (typeof Animations !== 'undefined' && Animations.winConfettiForMultiplier) {
                Animations.winConfettiForMultiplier(multiplier);
            }
        }

        playAgainBtn.classList.remove('hidden');
        // Re-enable boxes
        document.querySelectorAll('.mystery-box').forEach(b => { b.disabled = false; b.classList.remove('open'); });
    }

    function reset() {
        resultEl.classList.add('hidden');
        playAgainBtn.classList.add('hidden');
        document.querySelectorAll('.mystery-box').forEach(b => {
            b.classList.remove('selected', 'open');
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
