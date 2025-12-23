/**
 * Lucky Spin Game
 * Spin the wheel to land on a multiplier.
 */

(function() {
    'use strict';

    let betInput, betMaxBtn, spinBtn, playAgainBtn;
    let wheelEl, resultEl;

    // Define wheel wedges (degrees sum to 360)
    const wedges = [
        { label: '0x', multiplier: 0, color: '#e74c3c', size: 60 },  // 0x Lose
        { label: '1x', multiplier: 1, color: '#a0a0a0', size: 50 },  // 1x Push
        { label: '2x', multiplier: 2, color: '#2ecc71', size: 90 },  // 2x Win
        { label: '3x', multiplier: 3, color: '#27ae60', size: 80 },  // 3x Win
        { label: '5x', multiplier: 5, color: '#f39c12', size: 50 },  // 5x Win
        { label: '10x', multiplier: 10, color: '#ffd56b', size: 30 } // 10x Win
    ];

    function init() {
        betInput = document.getElementById('bet-input');
        betMaxBtn = document.getElementById('bet-max');
        spinBtn = document.getElementById('spin-btn');
        playAgainBtn = document.getElementById('play-again-btn');
        wheelEl = document.getElementById('wheel');
        resultEl = document.getElementById('game-result');

        if (!betInput) return;

        buildWheelGraphics();

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

        spinBtn.addEventListener('click', () => {
            const bet = parseInt(betInput.value);
            if (bet > CasinoShared.getScore() || bet < 1) {
                alert('Invalid bet amount!');
                return;
            }
            spinBtn.disabled = true;
            spinWheel(bet);
        });

        playAgainBtn.addEventListener('click', () => {
            reset();
        });
    }

    function buildWheelGraphics() {
        // Build conic-gradient for wedges
        let gradientParts = [];
        let currentAngle = 0;
        const labels = [];

        wedges.forEach(w => {
            const start = currentAngle;
            const end = currentAngle + w.size;
            gradientParts.push(`${w.color} ${start}deg ${end}deg`);
            // Label at middle angle
            const mid = start + (w.size / 2);
            labels.push({ angle: mid, text: w.label });
            currentAngle = end;
        });

        wheelEl.style.background = `conic-gradient(${gradientParts.join(', ')})`;

        // Add labels positioned around
        labels.forEach(l => {
            const span = document.createElement('span');
            span.className = 'wedge-label';
            span.textContent = l.text;
            const radius = 90; // label radius
            const rad = (l.angle - 90) * Math.PI / 180; // rotate to top as 0deg
            const x = Math.cos(rad) * radius;
            const y = Math.sin(rad) * radius;
            span.style.transform = `translate(calc(50% + ${x}px), calc(50% + ${y}px)) rotate(${l.angle}deg)`;
            wheelEl.appendChild(span);
        });

        // Center button display
        const center = document.createElement('div');
        center.className = 'wheel-center';
        center.textContent = 'SPIN';
        wheelEl.appendChild(center);
    }

    function spinWheel(bet) {
        resultEl.classList.add('hidden');
        resultEl.classList.remove('win', 'lose', 'push');
        playAgainBtn.classList.add('hidden');

        // Choose outcome by weighted degrees
        const totalDegrees = wedges.reduce((s, w) => s + w.size, 0); // 360
        const roll = Math.random() * totalDegrees;
        let cumulative = 0;
        let chosenIndex = 0;
        for (let i = 0; i < wedges.length; i++) {
            cumulative += wedges[i].size;
            if (roll <= cumulative) { chosenIndex = i; break; }
        }

        // Compute target angle so that chosen wedge centers at pointer (top)
        const chosen = wedges[chosenIndex];
        const startAngle = wedges.slice(0, chosenIndex).reduce((s,w)=>s+w.size,0);
        const midAngle = startAngle + chosen.size / 2;
        const pointerAngle = 0; // top
        const offset = 360 * 4; // extra spins
        const targetRotation = offset + (360 - midAngle + pointerAngle); // align mid under pointer

        wheelEl.style.transform = `rotate(${targetRotation}deg)`;

        // Resolve after spin animation
        setTimeout(() => {
            showSpinResult(chosen, bet);
        }, 2700);
    }

    function showSpinResult(wedge, bet) {
        resultEl.classList.remove('hidden', 'win', 'lose', 'push');
        const resultText = resultEl.querySelector('.result-text');
        const resultAmount = resultEl.querySelector('.result-amount');

        if (wedge.multiplier === 0) {
            resultEl.classList.add('lose');
            resultText.textContent = '😢 Unlucky! 0x';
            resultAmount.textContent = `-${bet} points`;
            CasinoShared.updateScore(CasinoShared.getScore() - bet);
            if (typeof Animations !== 'undefined' && Animations.bigLoss) {
                Animations.bigLoss(bet);
            }
        } else if (wedge.multiplier === 1) {
            resultEl.classList.add('push');
            resultText.textContent = '🤝 Push! 1x';
            resultAmount.textContent = 'Bet returned';
            // no score change
        } else {
            const winnings = bet * wedge.multiplier;
            resultEl.classList.add('win');
            resultText.textContent = `🎉 You Win! ${wedge.label}`;
            resultAmount.textContent = `+${winnings.toFixed(0)} points`;
            CasinoShared.updateScore(CasinoShared.getScore() + winnings - bet);
            if (typeof Animations !== 'undefined' && Animations.winConfettiForMultiplier) {
                Animations.winConfettiForMultiplier(wedge.multiplier);
            }
        }

        playAgainBtn.classList.remove('hidden');
        spinBtn.disabled = false;
    }

    function reset() {
        resultEl.classList.add('hidden');
        playAgainBtn.classList.add('hidden');
        spinBtn.disabled = false;
        wheelEl.style.transform = 'rotate(0deg)';
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
