/**
 * Theme Defaults — Single source of truth for all tunable UI parameters.
 * Used by: base game (index.html), Developer Studio (developer-studio.html)
 * 
 * To update these defaults:
 * 1. Open Developer Studio and tweak values until satisfied
 * 2. Click "Export Defaults" button
 * 3. Replace this file's THEME_DEFAULTS object with the exported code
 */

const THEME_DEFAULTS = {
  version: 1,

  animation: {
    style: 'flip-y',
    staggerMs: 600,
    durationMs: 1600
  },

  cells: {
    radiusPx: 18,
    borderWidthPx: 2,
    shadowSizePx: 12,
    shadowIntensityPct: 90,
    surface: 'card',
    neumorphism: 'inset',

    correctBg: '#33c764',
    incorrectBg: '#e74c3c',
    correctBorder: '#2eff6d',
    incorrectBorder: '#7a0c00',

    fontFamily: "'Supercell Magic', system-ui, -apple-system, 'Segoe UI', Arial, sans-serif",
    fontSizePx: 18,
    fontColor: '#ffffff',

    arrowColor: '#000000',
    arrowOpacityPct: 55,
    arrowSizePx: 103
  },

  wallpaper: {
    image: 'Illustration_SpookyChess_Shocktober2.png',
    dimPct: 20
  }
};

// Export for module usage (if needed in future)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = THEME_DEFAULTS;
}