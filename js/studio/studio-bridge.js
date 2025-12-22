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

        if (typeof boxes.correctBg === 'string') {
          document.documentElement.style.setProperty('--attr-correct-bg', boxes.correctBg);
        }
        if (typeof boxes.incorrectBg === 'string') {
          document.documentElement.style.setProperty('--attr-incorrect-bg', boxes.incorrectBg);
        }
        if (typeof boxes.correctBorder === 'string') {
          document.documentElement.style.setProperty('--attr-correct-border', boxes.correctBorder);
        }
        if (typeof boxes.incorrectBorder === 'string') {
          document.documentElement.style.setProperty('--attr-incorrect-border', boxes.incorrectBorder);
        }

        if (typeof boxes.fontFamily === 'string') {
          document.documentElement.style.setProperty('--attr-font-family', boxes.fontFamily);
        }
        if (Number.isFinite(boxes.fontSizePx)) {
          document.documentElement.style.setProperty('--attr-font-size', `${boxes.fontSizePx}px`);
        }
        if (typeof boxes.fontColor === 'string') {
          document.documentElement.style.setProperty('--attr-font-color', boxes.fontColor);
        }

        if (typeof boxes.arrowColor === 'string') {
          document.documentElement.style.setProperty('--attr-arrow-color', boxes.arrowColor);
        }
        if (Number.isFinite(boxes.arrowOpacityPct)) {
          document.documentElement.style.setProperty('--attr-arrow-opacity', String(boxes.arrowOpacityPct));
        }
        if (Number.isFinite(boxes.arrowSizePx)) {
          document.documentElement.style.setProperty('--attr-arrow-size', `${boxes.arrowSizePx}px`);
        }

        // Surface maps to the game theme vars.
        if (boxes.surface === 'secondary') {
          document.documentElement.style.setProperty('--guess-cell-front-bg', 'var(--bg-secondary)');
        } else {
          document.documentElement.style.setProperty('--guess-cell-front-bg', 'var(--bg-card)');
        }

        // Shadow
        const size = Number(boxes.shadowSizePx ?? boxes.shadowStrength ?? 0);
        const intensityPct = Number(boxes.shadowIntensityPct ?? 55);
        const neu = boxes.neumorphism;
        if (!size || !intensityPct || neu === 'none') {
          document.documentElement.style.setProperty('--guess-cell-shadow', 'none');
        } else {
          const intensity = Math.max(0, Math.min(1, intensityPct / 100));
          const dark = `rgba(0, 0, 0, ${0.06 + intensity * 0.22})`;
          const light = `rgba(255, 255, 255, ${0.03 + intensity * 0.14})`;
          const blur = size * 2;
          if (neu === 'inset') {
            document.documentElement.style.setProperty(
              '--guess-cell-shadow',
              `inset -${size}px -${size}px ${blur}px ${light}, inset ${size}px ${size}px ${blur}px ${dark}`
            );
          } else {
            document.documentElement.style.setProperty(
              '--guess-cell-shadow',
              `-${size}px -${size}px ${blur}px ${light}, ${size}px ${size}px ${blur}px ${dark}`
            );
          }
        }
      }

      // Wallpaper settings
      const { wallpaper } = settings;
      if (wallpaper) {
        if (typeof wallpaper.image === 'string') {
          const url = `images/wallpapers/${wallpaper.image}`;
          document.documentElement.style.setProperty('--wallpaper-url', `url('${url}')`);
        }
        if (Number.isFinite(wallpaper.dimPct)) {
          document.documentElement.style.setProperty('--wallpaper-dim', String(wallpaper.dimPct / 100));
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
