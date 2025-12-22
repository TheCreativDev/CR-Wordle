/**
 * Wallpaper Module
 * Sets a random background wallpaper on page load.
 */

const Wallpaper = (function() {
  const WALLPAPERS = [
    'Card_Evolution.png',
    'Illustration_ClassicDeckEvo_GoblinsGambit.png',
    'Illustration_DartGoblinEVO_RunicMountain.png',
    'Illustration_DrillEvo_GoblinRevolution.png',
    'Illustration_ElectroDragonEvoDraft_Shocktober2.png',
    'Illustration_EliteBarbs.png',
    'Illustration_GoblinQueensJourney.png',
    'Illustration_Goblinstein_Shocktober2.png',
    'Illustration_LoveBuff_LumberLove.png',
    'Illustration_LoveSparks_ExplosiveValentines.png',
    'Illustration_MiddleBuff_DaggerDuchess.png',
    'Illustration_MusketeerEvoDraft_MusketsAtDawn.png',
    'Illustration_PheonixSpawner_MusketsAtDawn.png',
    'Illustration_SpookyChess_Shocktober2.png',
    'Illustration_TriWizardShowdown_MagicMayhem.png',
    'Mastery.png',
    'Prince_Victory.png',
    'Skeleton_King.png'
  ];

  const WALLPAPER_PATH = '../images/wallpapers/';

  /**
   * Pick a random wallpaper and set it as background
   */
  function init() {
    randomize();
  }

  /**
   * Set a new random wallpaper (different from current if possible)
   */
  function randomize() {
    const randomIndex = Math.floor(Math.random() * WALLPAPERS.length);
    const wallpaper = WALLPAPERS[randomIndex];
    const url = `${WALLPAPER_PATH}${wallpaper}`;

    document.documentElement.style.setProperty('--wallpaper-url', `url('${url}')`);
  }

  /**
   * Set a specific wallpaper by filename
   * @param {string} filename - The wallpaper filename
   */
  function setWallpaper(filename) {
    const url = `${WALLPAPER_PATH}${filename}`;
    document.documentElement.style.setProperty('--wallpaper-url', `url('${url}')`);
  }

  /**
   * Set wallpaper dim opacity (0-1)
   * @param {number} opacity - Dim overlay opacity (0 = no dim, 1 = fully dark)
   */
  function setDim(opacity) {
    document.documentElement.style.setProperty('--wallpaper-dim', String(opacity));
  }

  // Auto-init on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  return {
    init,
    randomize,
    setWallpaper,
    setDim,
    WALLPAPERS
  };
})();
