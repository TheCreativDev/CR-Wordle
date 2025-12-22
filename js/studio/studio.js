/**
 * Developer Studio bootstrap
 * - Builds animation lab demo row
 * - Wires animation selector + sequential reveal
 * - Wires category-box styling controls (CSS vars)
 * - Uses THEME_DEFAULTS as initial values (loaded from js/theme-defaults.js)
 */

(function() {
  const STORAGE_KEY = 'cr_wordle_studio_settings';

  // Use THEME_DEFAULTS if available, otherwise fall back to hardcoded values
  const defaults = (typeof THEME_DEFAULTS !== 'undefined') ? THEME_DEFAULTS : {
    animation: { style: 'flip-y', staggerMs: 120, durationMs: 450 },
    cells: {
      radiusPx: 12, borderWidthPx: 2, shadowSizePx: 8, shadowIntensityPct: 55,
      surface: 'card', neumorphism: 'outset',
      correctBg: '#2ecc71', incorrectBg: '#e74c3c',
      correctBorder: '#2ecc71', incorrectBorder: '#e74c3c',
      fontFamily: "system-ui, -apple-system, 'Segoe UI', Arial, sans-serif",
      fontSizePx: 14, fontColor: '#ffffff',
      arrowColor: '#000000', arrowOpacityPct: 35, arrowSizePx: 72
    },
    wallpaper: { image: 'Card_Evolution.png', dimPct: 20 }
  };

  function qs(id) {
    return document.getElementById(id);
  }

  const animStyle = qs('anim-style');
  const animDelay = qs('anim-delay');
  const animDelayLabel = qs('anim-delay-label');
  const animDuration = qs('anim-duration');
  const animDurationLabel = qs('anim-duration-label');
  const animRun = qs('anim-run');
  const animReset = qs('anim-reset');
  const animStage = qs('anim-stage');

  const boxRadius = qs('box-radius');
  const boxRadiusLabel = qs('box-radius-label');
  const boxBorder = qs('box-border');
  const boxBorderLabel = qs('box-border-label');
  const shadowSize = qs('shadow-size');
  const shadowSizeLabel = qs('shadow-size-label');
  const shadowIntensity = qs('shadow-intensity');
  const shadowIntensityLabel = qs('shadow-intensity-label');
  const boxSurface = qs('box-surface');
  const boxNeu = qs('box-neu');

  const correctBg = qs('cell-correct-bg');
  const incorrectBg = qs('cell-incorrect-bg');
  const correctBorder = qs('cell-correct-border');
  const incorrectBorder = qs('cell-incorrect-border');
  const fontFamily = qs('cell-font-family');
  const fontSize = qs('cell-font-size');
  const fontSizeLabel = qs('cell-font-size-label');
  const fontColor = qs('cell-font-color');

  const arrowColor = qs('arrow-color');
  const arrowOpacity = qs('arrow-opacity');
  const arrowOpacityLabel = qs('arrow-opacity-label');
  const arrowSize = qs('arrow-size');
  const arrowSizeLabel = qs('arrow-size-label');

  const wallpaperSelect = qs('wallpaper-select');
  const wallpaperDim = qs('wallpaper-dim');
  const wallpaperDimLabel = qs('wallpaper-dim-label');

  const saveApplyBtn = qs('save-apply');
  const exportDefaultsBtn = qs('export-defaults');
  const applyStatus = qs('apply-status');
  const gameFrame = qs('studio-game-frame');

  if (!animStage) {
    return;
  }

  const demoCells = [
    // Mirrors a real guess row: 1 card cell + 7 attribute cells.
    { kind: 'card', name: 'Demo Card', image: 'images/cards/placeholder.png' },
    { label: '3', state: 'correct' },
    { label: 'Epic', state: 'incorrect', arrow: '↓' },
    { label: 'Troop', state: 'disabled' },
    { label: 'Ranged', state: 'correct' },
    { label: 'Fast', state: 'incorrect', arrow: '↑' },
    { label: '1.2s', state: 'incorrect', arrow: '↓' },
    { label: '2018', state: 'correct' }
  ];

  function createCardCell({ name, image }) {
    const cell = document.createElement('div');
    cell.className = 'guess-cell card-cell';

    const img = document.createElement('img');
    img.src = image;
    img.alt = name;
    img.onerror = function() {
      this.src = 'images/cards/placeholder.png';
    };

    const label = document.createElement('span');
    label.className = 'card-name';
    label.textContent = name;

    cell.appendChild(img);
    cell.appendChild(label);

    return cell;
  }

  function createDisabledCell() {
    const cell = document.createElement('div');
    cell.className = 'guess-cell disabled-category reveal-stagger reveal-no-flip';
    return cell;
  }

  function createAttributeCell({ label, state, arrow }) {
    if (state === 'disabled') {
      return createDisabledCell();
    }

    const cell = document.createElement('div');
    cell.className = 'guess-cell guess-attr reveal-stagger';

    const inner = document.createElement('div');
    inner.className = 'flip-inner';

    const front = document.createElement('div');
    front.className = 'guess-face front';

    const back = document.createElement('div');
    back.className = 'guess-face back';

    if (state === 'correct') back.classList.add('correct');
    if (state === 'incorrect') back.classList.add('incorrect');
    if (state === 'na') back.classList.add('na');

    if (state === 'na') {
      back.textContent = 'N/A';
    } else {
      const value = document.createElement('span');
      value.textContent = label;
      back.appendChild(value);

      if (arrow) {
        const arrowEl = document.createElement('span');
        arrowEl.className = 'arrow';
        arrowEl.textContent = arrow;
        back.appendChild(arrowEl);
      }
    }

    inner.appendChild(front);
    inner.appendChild(back);
    cell.appendChild(inner);
    return cell;
  }

  function applyRevealStyle(style) {
    document.body.classList.remove('reveal-style-flip-y', 'reveal-style-flip-x', 'reveal-style-flip-y-pop');
    if (style === 'flip-x') document.body.classList.add('reveal-style-flip-x');
    else if (style === 'flip-y-pop') document.body.classList.add('reveal-style-flip-y-pop');
    else document.body.classList.add('reveal-style-flip-y');
  }

  function buildAnimRow() {
    animStage.innerHTML = '';
    let revealIndex = 0;
    demoCells.forEach((cell) => {
      const el = cell.kind === 'card' ? createCardCell(cell) : createAttributeCell(cell);

      // Match the real game: only attribute cells participate in reveal timing.
      if (cell.kind !== 'card') {
        el.style.setProperty('--reveal-delay', `${revealIndex * Number(animDelay.value)}ms`);
        el.style.setProperty('--reveal-duration', `${Number(animDuration.value)}ms`);
        revealIndex += 1;
      }

      animStage.appendChild(el);
    });
  }

  function setAnimClass() {
    applyRevealStyle(animStyle.value);
  }

  function resetAnim() {
    animStage.querySelectorAll('.reveal-stagger').forEach((cell, i) => {
      cell.classList.remove('reveal');
      cell.style.setProperty('--reveal-delay', `${i * Number(animDelay.value)}ms`);
      cell.style.setProperty('--reveal-duration', `${Number(animDuration.value)}ms`);

      const inner = cell.querySelector('.flip-inner');
      if (inner) {
        inner.style.animation = 'none';
        // eslint-disable-next-line no-unused-expressions
        inner.offsetHeight;
        inner.style.animation = '';
      }
    });
  }

  function runAnim() {
    resetAnim();
    requestAnimationFrame(() => {
      animStage.querySelectorAll('.reveal-stagger').forEach((cell) => {
        cell.classList.add('reveal');
      });
    });
  }

  function applyBoxVars() {
    document.documentElement.style.setProperty('--guess-cell-radius', `${Number(boxRadius.value)}px`);
    document.documentElement.style.setProperty('--guess-cell-border-width', `${Number(boxBorder.value)}px`);

    const surface = boxSurface.value === 'secondary' ? 'var(--bg-secondary)' : 'var(--bg-card)';
    document.documentElement.style.setProperty('--guess-cell-front-bg', surface);

    if (correctBg) document.documentElement.style.setProperty('--attr-correct-bg', String(correctBg.value));
    if (incorrectBg) document.documentElement.style.setProperty('--attr-incorrect-bg', String(incorrectBg.value));
    if (correctBorder) document.documentElement.style.setProperty('--attr-correct-border', String(correctBorder.value));
    if (incorrectBorder) document.documentElement.style.setProperty('--attr-incorrect-border', String(incorrectBorder.value));

    if (fontFamily) document.documentElement.style.setProperty('--attr-font-family', String(fontFamily.value));
    if (fontSize) document.documentElement.style.setProperty('--attr-font-size', `${Number(fontSize.value)}px`);
    if (fontColor) document.documentElement.style.setProperty('--attr-font-color', String(fontColor.value));

    if (arrowColor) document.documentElement.style.setProperty('--attr-arrow-color', String(arrowColor.value));
    if (arrowOpacity) document.documentElement.style.setProperty('--attr-arrow-opacity', String(Number(arrowOpacity.value)));
    if (arrowSize) document.documentElement.style.setProperty('--attr-arrow-size', `${Number(arrowSize.value)}px`);

    const size = Number(shadowSize ? shadowSize.value : 0);
    const intensityPct = Number(shadowIntensity ? shadowIntensity.value : 0);
    const neu = boxNeu.value;

    if (neu === 'none' || size === 0 || intensityPct === 0) {
      document.documentElement.style.setProperty('--guess-cell-shadow', 'none');
      return;
    }

    // Use neutral black/white alpha shadows (no new theme colors).
    const intensity = Math.max(0, Math.min(1, intensityPct / 100));
    const dark = `rgba(0, 0, 0, ${0.06 + intensity * 0.22})`;
    const light = `rgba(255, 255, 255, ${0.03 + intensity * 0.14})`;

    const blur = size * 2;

    if (neu === 'outset') {
      document.documentElement.style.setProperty(
        '--guess-cell-shadow',
        `-${size}px -${size}px ${blur}px ${light}, ${size}px ${size}px ${blur}px ${dark}`
      );
    } else {
      document.documentElement.style.setProperty(
        '--guess-cell-shadow',
        `inset -${size}px -${size}px ${blur}px ${light}, inset ${size}px ${size}px ${blur}px ${dark}`
      );
    }
  }

  function applyRevealVars() {
    document.documentElement.style.setProperty('--reveal-stagger-ms', `${Number(animDelay.value)}`);
    document.documentElement.style.setProperty('--reveal-duration-ms', `${Number(animDuration.value)}`);
    document.documentElement.style.setProperty('--reveal-style', animStyle.value);
  }

  function getSettings() {
    return {
      version: 1,
      animation: {
        style: animStyle.value,
        staggerMs: Number(animDelay.value),
        durationMs: Number(animDuration.value)
      },
      boxes: {
        radiusPx: Number(boxRadius.value),
        borderWidthPx: Number(boxBorder.value),
        shadowSizePx: Number(shadowSize ? shadowSize.value : 0),
        shadowIntensityPct: Number(shadowIntensity ? shadowIntensity.value : 0),
        surface: boxSurface.value,
        neumorphism: boxNeu.value,
        correctBg: correctBg ? String(correctBg.value) : undefined,
        incorrectBg: incorrectBg ? String(incorrectBg.value) : undefined,
        correctBorder: correctBorder ? String(correctBorder.value) : undefined,
        incorrectBorder: incorrectBorder ? String(incorrectBorder.value) : undefined,
        fontFamily: fontFamily ? String(fontFamily.value) : undefined,
        fontSizePx: fontSize ? Number(fontSize.value) : undefined,
        fontColor: fontColor ? String(fontColor.value) : undefined,
        arrowColor: arrowColor ? String(arrowColor.value) : undefined,
        arrowOpacityPct: arrowOpacity ? Number(arrowOpacity.value) : undefined,
        arrowSizePx: arrowSize ? Number(arrowSize.value) : undefined
      },
      wallpaper: {
        image: wallpaperSelect ? String(wallpaperSelect.value) : undefined,
        dimPct: wallpaperDim ? Number(wallpaperDim.value) : 20
      }
    };
  }

  /**
   * Generate JS code for theme-defaults.js based on current settings
   */
  function generateExportCode() {
    const s = getSettings();
    return `const THEME_DEFAULTS = {
  version: 1,

  animation: {
    style: '${s.animation.style}',
    staggerMs: ${s.animation.staggerMs},
    durationMs: ${s.animation.durationMs}
  },

  cells: {
    radiusPx: ${s.boxes.radiusPx},
    borderWidthPx: ${s.boxes.borderWidthPx},
    shadowSizePx: ${s.boxes.shadowSizePx},
    shadowIntensityPct: ${s.boxes.shadowIntensityPct},
    surface: '${s.boxes.surface}',
    neumorphism: '${s.boxes.neumorphism}',

    correctBg: '${s.boxes.correctBg}',
    incorrectBg: '${s.boxes.incorrectBg}',
    correctBorder: '${s.boxes.correctBorder}',
    incorrectBorder: '${s.boxes.incorrectBorder}',

    fontFamily: "${s.boxes.fontFamily}",
    fontSizePx: ${s.boxes.fontSizePx},
    fontColor: '${s.boxes.fontColor}',

    arrowColor: '${s.boxes.arrowColor}',
    arrowOpacityPct: ${s.boxes.arrowOpacityPct},
    arrowSizePx: ${s.boxes.arrowSizePx}
  },

  wallpaper: {
    image: '${s.wallpaper.image}',
    dimPct: ${s.wallpaper.dimPct}
  }
};

// Export for module usage (if needed in future)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = THEME_DEFAULTS;
}`;
  }

  function loadSettings() {
    // First apply defaults from THEME_DEFAULTS
    applyDefaultsToInputs();

    // Then override with any saved localStorage settings
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') return;

      if (parsed.animation) {
        if (parsed.animation.style) animStyle.value = parsed.animation.style;
        if (Number.isFinite(parsed.animation.staggerMs)) animDelay.value = String(parsed.animation.staggerMs);
        if (Number.isFinite(parsed.animation.durationMs)) animDuration.value = String(parsed.animation.durationMs);
      }

      if (parsed.boxes) {
        if (Number.isFinite(parsed.boxes.radiusPx)) boxRadius.value = String(parsed.boxes.radiusPx);
        if (Number.isFinite(parsed.boxes.borderWidthPx)) boxBorder.value = String(parsed.boxes.borderWidthPx);

        // Back-compat: previous builds stored "shadowStrength".
        if (shadowSize) {
          if (Number.isFinite(parsed.boxes.shadowSizePx)) shadowSize.value = String(parsed.boxes.shadowSizePx);
          else if (Number.isFinite(parsed.boxes.shadowStrength)) shadowSize.value = String(parsed.boxes.shadowStrength);
        }
        if (shadowIntensity && Number.isFinite(parsed.boxes.shadowIntensityPct)) shadowIntensity.value = String(parsed.boxes.shadowIntensityPct);

        if (parsed.boxes.surface) boxSurface.value = parsed.boxes.surface;
        if (parsed.boxes.neumorphism) boxNeu.value = parsed.boxes.neumorphism;

        if (correctBg && typeof parsed.boxes.correctBg === 'string') correctBg.value = parsed.boxes.correctBg;
        if (incorrectBg && typeof parsed.boxes.incorrectBg === 'string') incorrectBg.value = parsed.boxes.incorrectBg;
        if (correctBorder && typeof parsed.boxes.correctBorder === 'string') correctBorder.value = parsed.boxes.correctBorder;
        if (incorrectBorder && typeof parsed.boxes.incorrectBorder === 'string') incorrectBorder.value = parsed.boxes.incorrectBorder;
        if (fontFamily && typeof parsed.boxes.fontFamily === 'string') fontFamily.value = parsed.boxes.fontFamily;
        if (fontSize && Number.isFinite(parsed.boxes.fontSizePx)) fontSize.value = String(parsed.boxes.fontSizePx);
        if (fontColor && typeof parsed.boxes.fontColor === 'string') fontColor.value = parsed.boxes.fontColor;

        if (arrowColor && typeof parsed.boxes.arrowColor === 'string') arrowColor.value = parsed.boxes.arrowColor;
        if (arrowOpacity && Number.isFinite(parsed.boxes.arrowOpacityPct)) arrowOpacity.value = String(parsed.boxes.arrowOpacityPct);
        if (arrowSize && Number.isFinite(parsed.boxes.arrowSizePx)) arrowSize.value = String(parsed.boxes.arrowSizePx);
      }

      if (parsed.wallpaper) {
        if (wallpaperSelect && typeof parsed.wallpaper.image === 'string') wallpaperSelect.value = parsed.wallpaper.image;
        if (wallpaperDim && Number.isFinite(parsed.wallpaper.dimPct)) wallpaperDim.value = String(parsed.wallpaper.dimPct);
      }

      applyStatus.textContent = 'Loaded saved settings';
    } catch {
      // ignore
    }
  }

  /**
   * Apply THEME_DEFAULTS values to all input controls
   */
  function applyDefaultsToInputs() {
    // Animation
    if (defaults.animation) {
      if (defaults.animation.style) animStyle.value = defaults.animation.style;
      if (defaults.animation.staggerMs) animDelay.value = String(defaults.animation.staggerMs);
      if (defaults.animation.durationMs) animDuration.value = String(defaults.animation.durationMs);
    }

    // Cells
    if (defaults.cells) {
      if (defaults.cells.radiusPx) boxRadius.value = String(defaults.cells.radiusPx);
      if (defaults.cells.borderWidthPx !== undefined) boxBorder.value = String(defaults.cells.borderWidthPx);
      if (shadowSize && defaults.cells.shadowSizePx !== undefined) shadowSize.value = String(defaults.cells.shadowSizePx);
      if (shadowIntensity && defaults.cells.shadowIntensityPct !== undefined) shadowIntensity.value = String(defaults.cells.shadowIntensityPct);
      if (defaults.cells.surface) boxSurface.value = defaults.cells.surface;
      if (defaults.cells.neumorphism) boxNeu.value = defaults.cells.neumorphism;

      if (correctBg && defaults.cells.correctBg) correctBg.value = defaults.cells.correctBg;
      if (incorrectBg && defaults.cells.incorrectBg) incorrectBg.value = defaults.cells.incorrectBg;
      if (correctBorder && defaults.cells.correctBorder) correctBorder.value = defaults.cells.correctBorder;
      if (incorrectBorder && defaults.cells.incorrectBorder) incorrectBorder.value = defaults.cells.incorrectBorder;
      if (fontFamily && defaults.cells.fontFamily) fontFamily.value = defaults.cells.fontFamily;
      if (fontSize && defaults.cells.fontSizePx) fontSize.value = String(defaults.cells.fontSizePx);
      if (fontColor && defaults.cells.fontColor) fontColor.value = defaults.cells.fontColor;

      if (arrowColor && defaults.cells.arrowColor) arrowColor.value = defaults.cells.arrowColor;
      if (arrowOpacity && defaults.cells.arrowOpacityPct !== undefined) arrowOpacity.value = String(defaults.cells.arrowOpacityPct);
      if (arrowSize && defaults.cells.arrowSizePx) arrowSize.value = String(defaults.cells.arrowSizePx);
    }

    // Wallpaper
    if (defaults.wallpaper) {
      if (wallpaperSelect && defaults.wallpaper.image) wallpaperSelect.value = defaults.wallpaper.image;
      if (wallpaperDim && defaults.wallpaper.dimPct !== undefined) wallpaperDim.value = String(defaults.wallpaper.dimPct);
    }
  }

  function saveSettings(settings) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // ignore
    }
  }

  function applyToStudioPreview() {
    syncLabels();
    applyRevealVars();
    applyBoxVars();
    setAnimClass();
    buildAnimRow();
    resetAnim();
  }

  function applyToGameCorner(settings) {
    if (!gameFrame || !gameFrame.contentWindow) return;
    gameFrame.contentWindow.postMessage(
      { type: 'crw:applyStudioSettings', payload: settings },
      '*'
    );
  }

  function syncLabels() {
    animDelayLabel.textContent = `${animDelay.value}ms`;
    animDurationLabel.textContent = `${animDuration.value}ms`;

    boxRadiusLabel.textContent = `${boxRadius.value}px`;
    boxBorderLabel.textContent = `${boxBorder.value}px`;
    if (shadowSizeLabel && shadowSize) shadowSizeLabel.textContent = `${shadowSize.value}px`;
    if (shadowIntensityLabel && shadowIntensity) shadowIntensityLabel.textContent = `${shadowIntensity.value}%`;
    if (fontSizeLabel && fontSize) fontSizeLabel.textContent = `${fontSize.value}px`;
    if (arrowOpacityLabel && arrowOpacity) arrowOpacityLabel.textContent = `${arrowOpacity.value}%`;
    if (arrowSizeLabel && arrowSize) arrowSizeLabel.textContent = `${arrowSize.value}px`;
    if (wallpaperDimLabel && wallpaperDim) wallpaperDimLabel.textContent = `${wallpaperDim.value}%`;
  }

  // Wire events
  animStyle.addEventListener('change', () => {
    setAnimClass();
    resetAnim();
  });

  animDelay.addEventListener('input', () => {
    syncLabels();
    buildAnimRow();
  });

  animDuration.addEventListener('input', () => {
    syncLabels();
    resetAnim();
  });

  animRun.addEventListener('click', runAnim);
  animReset.addEventListener('click', () => {
    buildAnimRow();
    resetAnim();
  });

  [
    boxRadius,
    boxBorder,
    shadowSize,
    shadowIntensity,
    boxSurface,
    boxNeu,
    correctBg,
    incorrectBg,
    correctBorder,
    incorrectBorder,
    fontFamily,
    fontSize,
    fontColor,
    arrowColor,
    arrowOpacity,
    arrowSize,
    wallpaperSelect,
    wallpaperDim
  ].filter(Boolean).forEach((el) => {
    el.addEventListener('input', () => {
      applyToStudioPreview();
    });
    el.addEventListener('change', () => {
      applyToStudioPreview();
    });
  });

  if (saveApplyBtn) {
    saveApplyBtn.addEventListener('click', () => {
      const settings = getSettings();
      saveSettings(settings);

      // Apply immediately if possible, then reload so the entire embedded game
      // (including any already-rendered UI) picks up the new CSS vars/classes.
      applyToGameCorner(settings);

      if (gameFrame) {
        const baseSrc = 'studio-game.html';
        gameFrame.src = `${baseSrc}?applied=${Date.now()}`;
      }

      applyStatus.textContent = `Applied & reloaded game corner (${new Date().toLocaleTimeString()})`;
    });
  }

  if (exportDefaultsBtn) {
    exportDefaultsBtn.addEventListener('click', async () => {
      const code = generateExportCode();
      try {
        await navigator.clipboard.writeText(code);
        applyStatus.textContent = `✓ Copied theme-defaults.js to clipboard! Paste into js/theme-defaults.js`;
      } catch {
        // Fallback: show in a prompt
        const ta = document.createElement('textarea');
        ta.value = code;
        ta.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:9999;font-family:monospace;font-size:12px;';
        document.body.appendChild(ta);
        ta.select();
        applyStatus.textContent = 'Copy the code from the textarea (Ctrl+C), then click elsewhere to close';
        ta.addEventListener('blur', () => ta.remove());
      }
    });
  }

  // Initial render
  loadSettings();
  applyToStudioPreview();
})();
