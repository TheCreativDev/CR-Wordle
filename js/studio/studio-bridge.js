/**
 * Studio Bridge (runs inside studio-game.html)
 * Listens for studio settings and applies them to the game corner.
 */

(function() {
  const STORAGE_KEY = 'cr_wordle_studio_settings';

  function clearRevealStyleClasses() {
    document.body.classList.remove('reveal-style-flip-y', 'reveal-style-flip-x', 'reveal-style-flip-y-pop');
  }

  function applyRevealStyle(style) {
    clearRevealStyleClasses();
    if (style === 'flip-x') document.body.classList.add('reveal-style-flip-x');
    else if (style === 'flip-y-pop') document.body.classList.add('reveal-style-flip-y-pop');
    else document.body.classList.add('reveal-style-flip-y');
  }

  function applySettings(settings) {
    if (!settings || typeof settings !== 'object') return;

    try {
      const { animation, boxes } = settings;

      if (animation) {
        if (Number.isFinite(animation.staggerMs)) {
          document.documentElement.style.setProperty('--reveal-stagger-ms', String(animation.staggerMs));
        }
        if (Number.isFinite(animation.durationMs)) {
          document.documentElement.style.setProperty('--reveal-duration-ms', String(animation.durationMs));
        }
        if (typeof animation.style === 'string') {
          applyRevealStyle(animation.style);
        }
      }

      if (boxes) {
        if (Number.isFinite(boxes.radiusPx)) {
          document.documentElement.style.setProperty('--guess-cell-radius', `${boxes.radiusPx}px`);
        }
        if (Number.isFinite(boxes.borderWidthPx)) {
          document.documentElement.style.setProperty('--guess-cell-border-width', `${boxes.borderWidthPx}px`);
        }

        // Surface maps to the game theme vars.
        if (boxes.surface === 'secondary') {
          document.documentElement.style.setProperty('--guess-cell-front-bg', 'var(--bg-secondary)');
        } else {
          document.documentElement.style.setProperty('--guess-cell-front-bg', 'var(--bg-card)');
        }

        // Shadow
        const strength = Number(boxes.shadowStrength);
        const neu = boxes.neumorphism;
        if (!strength || neu === 'none') {
          document.documentElement.style.setProperty('--guess-cell-shadow', 'none');
        } else {
          const dark = `rgba(0, 0, 0, ${0.10 + strength * 0.012})`;
          const light = `rgba(255, 255, 255, ${0.05 + strength * 0.008})`;
          if (neu === 'inset') {
            document.documentElement.style.setProperty(
              '--guess-cell-shadow',
              `inset -${strength}px -${strength}px ${strength * 2}px ${light}, inset ${strength}px ${strength}px ${strength * 2}px ${dark}`
            );
          } else {
            document.documentElement.style.setProperty(
              '--guess-cell-shadow',
              `-${strength}px -${strength}px ${strength * 2}px ${light}, ${strength}px ${strength}px ${strength * 2}px ${dark}`
            );
          }
        }
      }
    } catch {
      // ignore
    }
  }

  // Load saved settings on startup
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      applySettings(JSON.parse(raw));
    } else {
      // Ensure a default class exists
      applyRevealStyle('flip-y');
    }
  } catch {
    applyRevealStyle('flip-y');
  }

  // Listen for live updates
  window.addEventListener('message', (event) => {
    const data = event.data;
    if (!data || data.type !== 'crw:applyStudioSettings') return;
    applySettings(data.payload);
  });
})();
