/**
 * Animations Module
 * Provides confetti shimmer and loss burst animations across the site.
 */

const Animations = (function() {
    'use strict';

    let canvas, ctx, particles = [], running = false;
    let styleInjected = false;

    function ensureCanvas() {
        if (canvas) return;
        canvas = document.createElement('canvas');
        canvas.id = 'fx-canvas';
        canvas.style.position = 'fixed';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.width = '100vw';
        canvas.style.height = '100vh';
        canvas.style.pointerEvents = 'none';
        canvas.style.zIndex = '9999';
        document.body.appendChild(canvas);
        ctx = canvas.getContext('2d');
        onResize();
        window.addEventListener('resize', onResize);
    }

    function injectStyles() {
        if (styleInjected) return;
        const style = document.createElement('style');
        style.textContent = `
            @keyframes bodyShake {
                0% { transform: translate3d(0,0,0); }
                20% { transform: translate3d(-6px, 0, 0) rotate(-0.5deg); }
                40% { transform: translate3d(6px, 0, 0) rotate(0.6deg); }
                60% { transform: translate3d(-4px, 0, 0) rotate(-0.4deg); }
                80% { transform: translate3d(4px, 0, 0) rotate(0.4deg); }
                100% { transform: translate3d(0,0,0); }
            }
            .shake-strong { animation: bodyShake 600ms cubic-bezier(0.2,0.8,0.2,1); }
            .flash-overlay {
                position: fixed; inset: 0; pointer-events: none; z-index: 9998;
                background: radial-gradient(ellipse at center, rgba(255,0,0,0.28) 0%, rgba(255,0,0,0.12) 45%, rgba(255,0,0,0.0) 70%);
            }
        `;
        document.head.appendChild(style);
        styleInjected = true;
    }

    function onResize() {
        if (!canvas) return;
        canvas.width = Math.floor(window.innerWidth * window.devicePixelRatio);
        canvas.height = Math.floor(window.innerHeight * window.devicePixelRatio);
    }

    function randint(min, max) { return (Math.random() * (max - min) + min) | 0; }
    function randf(min, max) { return Math.random() * (max - min) + min; }

    function loop() {
        if (!running) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const now = performance.now();
        particles = particles.filter(p => now - p.birth < p.life);
        for (const p of particles) {
            const t = (now - p.birth) / p.life;
            const x = p.x + p.vx * t * p.life * 0.001;
            const y = p.y + p.vy * t * p.life * 0.001 + 0.5 * p.g * Math.pow(t * p.life * 0.001, 2);
            const size = p.size * (p.fade ? (1 - t) : 1);
            const rot = p.rotSpeed ? p.rotSpeed * t * 120 : 0;
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(rot * Math.PI / 180);
            ctx.globalAlpha = p.alpha * (1 - t);
            if (p.shape === 'rect') {
                ctx.fillStyle = p.color;
                ctx.fillRect(-size/2, -size/2, size, size * 0.6);
            } else if (p.shape === 'triangle') {
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.moveTo(0, -size/2);
                ctx.lineTo(size/2, size/2);
                ctx.lineTo(-size/2, size/2);
                ctx.closePath();
                ctx.fill();
            } else {
                const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, size/2);
                grad.addColorStop(0, p.color);
                grad.addColorStop(1, 'transparent');
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.arc(0, 0, size/2, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        }
        if (particles.length === 0) {
            running = false;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            return;
        }
        requestAnimationFrame(loop);
    }

    function start() {
        ensureCanvas();
        injectStyles();
        if (!running) {
            running = true;
            requestAnimationFrame(loop);
        }
    }

    // Public Effects
    function confetti(options = {}) {
        const {
            count = 180,
            spread = 70,
            originX = window.innerWidth / 2,
            originY = window.innerHeight * 0.2,
            colors = ['#ffe066','#ffd56b','#fff8dc','#f39c12','#ff7f50'],
            power = 120,
            shimmer = true
        } = options;
        start();
        const px = originX * window.devicePixelRatio;
        const py = originY * window.devicePixelRatio;
        for (let i = 0; i < count; i++) {
            const angle = randf(-spread/2, spread/2) + (i % 2 === 0 ? -90 : -70);
            const speed = randf(power*0.6, power*1.2);
            const vx = Math.cos(angle * Math.PI/180) * speed;
            const vy = Math.sin(angle * Math.PI/180) * speed;
            const color = colors[randint(0, colors.length)];
            particles.push({
                x: px, y: py,
                vx, vy,
                g: randf(120, 220),
                color,
                size: randf(8, 16) * window.devicePixelRatio,
                alpha: shimmer ? randf(0.8, 1) : 1,
                shape: Math.random() < 0.5 ? 'rect' : 'circle',
                rotSpeed: randf(-1.2, 1.2),
                birth: performance.now(),
                life: randint(900, 1800),
                fade: true
            });
        }
        running = true;
    }

    function lossBurst(options = {}) {
        const { particlesCount = 90, originX = window.innerWidth/2, originY = window.innerHeight/2, shake = true, flash = true } = options;
        start();
        const px = originX * window.devicePixelRatio;
        const py = originY * window.devicePixelRatio;
        for (let i = 0; i < particlesCount; i++) {
            const angle = randf(0, 360);
            const speed = randf(160, 280);
            const vx = Math.cos(angle * Math.PI/180) * speed;
            const vy = Math.sin(angle * Math.PI/180) * speed;
            const color = ['#e74c3c','#ff6b6b','#ff8787'][randint(0,3)];
            particles.push({
                x: px, y: py,
                vx, vy,
                g: randf(220, 320),
                color,
                size: randf(10, 18) * window.devicePixelRatio,
                alpha: 1,
                shape: 'triangle',
                rotSpeed: randf(-2.0, 2.0),
                birth: performance.now(),
                life: randint(800, 1600),
                fade: true
            });
        }
        running = true;
        if (flash) flashRed();
        if (shake) bodyShake();
    }

    function flashRed() {
        const overlay = document.createElement('div');
        overlay.className = 'flash-overlay';
        document.body.appendChild(overlay);
        setTimeout(() => overlay.remove(), 450);
    }

    function bodyShake() {
        document.body.classList.add('shake-strong');
        setTimeout(() => document.body.classList.remove('shake-strong'), 650);
    }

    // Helper policies for casino games
    function winConfettiForMultiplier(mult) {
        if (mult >= 6) confetti({ count: 220, spread: 90, power: 160 });
        else if (mult >= 3) confetti({ count: 160, spread: 80, power: 140 });
        else confetti({ count: 120, spread: 70, power: 120 });
    }

    function bigLoss(bet) {
        const score = (typeof CasinoShared !== 'undefined' && CasinoShared.getScore) ? CasinoShared.getScore() : 0;
        const ratio = score > 0 ? bet / score : 1;
        if (ratio >= 0.25) lossBurst({ particlesCount: 120, shake: true, flash: true });
        else lossBurst({ particlesCount: 80, shake: true, flash: false });
    }

    return {
        confetti,
        lossBurst,
        winConfettiForMultiplier,
        bigLoss
    };
})();
