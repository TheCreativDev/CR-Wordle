/**
 * Main Application Entry Point
 * Initializes and coordinates all game modules
 */

const App = (function() {
    /**
     * Apply theme defaults from THEME_DEFAULTS to CSS variables
     */
    function applyThemeDefaults() {
        if (typeof THEME_DEFAULTS === 'undefined') return;
        
        const d = THEME_DEFAULTS;
        const root = document.documentElement;

        // Animation
        if (d.animation) {
            root.style.setProperty('--reveal-stagger-ms', d.animation.staggerMs);
            root.style.setProperty('--reveal-duration-ms', d.animation.durationMs);
            root.style.setProperty('--reveal-style', d.animation.style);

            // Apply reveal style class to body
            document.body.classList.remove('reveal-style-flip-y', 'reveal-style-flip-x', 'reveal-style-flip-y-pop');
            if (d.animation.style === 'flip-x') {
                document.body.classList.add('reveal-style-flip-x');
            } else if (d.animation.style === 'flip-y-pop') {
                document.body.classList.add('reveal-style-flip-y-pop');
            }
        }

        // Cells
        if (d.cells) {
            root.style.setProperty('--guess-cell-radius', `${d.cells.radiusPx}px`);
            root.style.setProperty('--guess-cell-border-width', `${d.cells.borderWidthPx}px`);
            
            if (d.cells.correctBg) root.style.setProperty('--attr-correct-bg', d.cells.correctBg);
            if (d.cells.incorrectBg) root.style.setProperty('--attr-incorrect-bg', d.cells.incorrectBg);
            if (d.cells.correctBorder) root.style.setProperty('--attr-correct-border', d.cells.correctBorder);
            if (d.cells.incorrectBorder) root.style.setProperty('--attr-incorrect-border', d.cells.incorrectBorder);
            
            if (d.cells.fontFamily) root.style.setProperty('--attr-font-family', d.cells.fontFamily);
            if (d.cells.fontSizePx) root.style.setProperty('--attr-font-size', `${d.cells.fontSizePx}px`);
            if (d.cells.fontColor) root.style.setProperty('--attr-font-color', d.cells.fontColor);
            
            if (d.cells.arrowColor) root.style.setProperty('--attr-arrow-color', d.cells.arrowColor);
            if (d.cells.arrowOpacityPct !== undefined) root.style.setProperty('--attr-arrow-opacity', d.cells.arrowOpacityPct);
            if (d.cells.arrowSizePx) root.style.setProperty('--attr-arrow-size', `${d.cells.arrowSizePx}px`);

            // Neumorphic shadows
            const size = d.cells.shadowSizePx || 0;
            const intensityPct = d.cells.shadowIntensityPct || 0;
            const neu = d.cells.neumorphism || 'none';

            if (neu === 'none' || size === 0 || intensityPct === 0) {
                root.style.setProperty('--guess-cell-shadow', 'none');
            } else {
                const intensity = Math.max(0, Math.min(1, intensityPct / 100));
                const dark = `rgba(0, 0, 0, ${0.06 + intensity * 0.22})`;
                const light = `rgba(255, 255, 255, ${0.03 + intensity * 0.14})`;
                const blur = size * 2;

                if (neu === 'outset') {
                    root.style.setProperty('--guess-cell-shadow',
                        `-${size}px -${size}px ${blur}px ${light}, ${size}px ${size}px ${blur}px ${dark}`);
                } else {
                    root.style.setProperty('--guess-cell-shadow',
                        `inset -${size}px -${size}px ${blur}px ${light}, inset ${size}px ${size}px ${blur}px ${dark}`);
                }
            }
        }

        // Wallpaper - handled by wallpaper.js, but set default if needed
        if (d.wallpaper) {
            root.style.setProperty('--wallpaper-dim', d.wallpaper.dimPct / 100);
        }

        console.log('Theme defaults applied');
    }

    /**
     * Initialize the application
     */
    function init() {
        console.log('CR Wordle - Initializing...');
        
        // Apply theme defaults first
        applyThemeDefaults();
        
        // Validate card data
        if (!CARDS || CARDS.length === 0) {
            console.error('No card data found! Please add cards to data/cards.js');
            alert('Error: No card data found. Please add cards to the game.');
            return;
        }

        console.log(`Loaded ${CARDS.length} cards`);

        // Initialize UI
        UI.init();
        
        // Start first game
        startNewGame();
        
        console.log('CR Wordle - Ready!');
    }

    /**
     * Start a new game
     */
    function startNewGame() {
        Game.startNewGame();
        UI.resetUI();
        
        // Log game start to Firebase global counter
        if (typeof FirebaseAnalytics !== 'undefined') {
            FirebaseAnalytics.logGameStart();
        }
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Public API
    return {
        startNewGame
    };
})();
