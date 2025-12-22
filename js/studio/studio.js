/**
 * Developer Studio bootstrap
 * - Builds animation lab demo row
 * - Wires animation selector + sequential reveal
 * - Wires category-box styling controls (CSS vars)
 */

(function() {
  const STORAGE_KEY = 'cr_wordle_studio_settings';

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
  const boxShadow = qs('box-shadow');
  const boxShadowLabel = qs('box-shadow-label');
  const boxSurface = qs('box-surface');
  const boxNeu = qs('box-neu');

  const saveApplyBtn = qs('save-apply');
  const applyStatus = qs('apply-status');
  const gameFrame = qs('studio-game-frame');

  if (!animStage) {
    return;
  }

  const demoCells = [
    { label: 'Card', state: 'na' },
    { label: '3', state: 'correct' },
    { label: 'Epic', state: 'incorrect', arrow: '↓' },
    { label: 'Troop', state: 'incorrect' },
    { label: 'Ranged', state: 'correct' },
    { label: 'Fast', state: 'incorrect', arrow: '↑' },
    { label: '1.2s', state: 'incorrect', arrow: '↓' },
    { label: '2018', state: 'correct' }
  ];

  function createFlipCell({ label, state, arrow }) {
    const card = document.createElement('div');
    card.className = 'flip-card';

    const inner = document.createElement('div');
    inner.className = 'flip-inner';

    const front = document.createElement('div');
    front.className = 'flip-face flip-front';
    front.textContent = '…';

    const back = document.createElement('div');
    back.className = 'flip-face flip-back';

    if (state === 'correct') back.classList.add('is-correct');
    if (state === 'incorrect') back.classList.add('is-incorrect');
    if (state === 'na') back.classList.add('is-na');

    back.innerHTML = `${label}${arrow ? ` <span class="arrow">${arrow}</span>` : ''}`;

    inner.appendChild(front);
    inner.appendChild(back);
    card.appendChild(inner);

    return card;
  }

  function buildAnimRow() {
    animStage.innerHTML = '';
    demoCells.forEach((cell, i) => {
      const el = createFlipCell(cell);
      el.style.setProperty('--reveal-delay', `${i * Number(animDelay.value)}ms`);
      animStage.appendChild(el);
    });
  }

  function setAnimClass() {
    animStage.classList.remove('anim-flip-y', 'anim-flip-x', 'anim-flip-y-pop');
    const v = animStyle.value;
    if (v === 'flip-y') animStage.classList.add('anim-flip-y');
    if (v === 'flip-x') animStage.classList.add('anim-flip-x');
    if (v === 'flip-y-pop') animStage.classList.add('anim-flip-y-pop');
  }

  function resetAnim() {
    animStage.querySelectorAll('.flip-card').forEach((card, i) => {
      card.classList.remove('is-revealing');
      card.style.setProperty('--reveal-delay', `${i * Number(animDelay.value)}ms`);
      card.style.setProperty('--reveal-duration', `${Number(animDuration.value)}ms`);

      // Force restart by resetting animation state
      const inner = card.querySelector('.flip-inner');
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
    // Apply duration globally on the stage to keep things simple
    animStage.querySelectorAll('.flip-card').forEach((card) => {
      card.style.setProperty('--reveal-duration', `${Number(animDuration.value)}ms`);
      card.classList.add('is-revealing');
    });
  }

  function applyBoxVars() {
    document.documentElement.style.setProperty('--guess-cell-radius', `${Number(boxRadius.value)}px`);
    document.documentElement.style.setProperty('--guess-cell-border-width', `${Number(boxBorder.value)}px`);

    const surface = boxSurface.value === 'secondary' ? 'var(--bg-secondary)' : 'var(--bg-card)';
    document.documentElement.style.setProperty('--guess-cell-front-bg', surface);

    const strength = Number(boxShadow.value);
    const neu = boxNeu.value;

    if (neu === 'none' || strength === 0) {
      document.documentElement.style.setProperty('--guess-cell-shadow', 'none');
      return;
    }

    // Use neutral black/white alpha shadows (no new theme colors).
    const dark = `rgba(0, 0, 0, ${0.10 + strength * 0.012})`;
    const light = `rgba(255, 255, 255, ${0.05 + strength * 0.008})`;

    if (neu === 'outset') {
      document.documentElement.style.setProperty(
        '--guess-cell-shadow',
        `-${strength}px -${strength}px ${strength * 2}px ${light}, ${strength}px ${strength}px ${strength * 2}px ${dark}`
      );
    } else {
      document.documentElement.style.setProperty(
        '--guess-cell-shadow',
        `inset -${strength}px -${strength}px ${strength * 2}px ${light}, inset ${strength}px ${strength}px ${strength * 2}px ${dark}`
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
        shadowStrength: Number(boxShadow.value),
        surface: boxSurface.value,
        neumorphism: boxNeu.value
      }
    };
  }

  function loadSettings() {
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
        if (Number.isFinite(parsed.boxes.shadowStrength)) boxShadow.value = String(parsed.boxes.shadowStrength);
        if (parsed.boxes.surface) boxSurface.value = parsed.boxes.surface;
        if (parsed.boxes.neumorphism) boxNeu.value = parsed.boxes.neumorphism;
      }

      applyStatus.textContent = 'Loaded saved settings';
    } catch {
      // ignore
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
    boxShadowLabel.textContent = `${boxShadow.value}`;
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

  [boxRadius, boxBorder, boxShadow, boxSurface, boxNeu].forEach((el) => {
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

  // Initial render
  loadSettings();
  applyToStudioPreview();
})();
