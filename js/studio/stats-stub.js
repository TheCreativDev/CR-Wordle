/**
 * Stats Stub (Developer Studio)
 * Requirement: no stats tracking/persistence.
 */

// Match the public API that js/ui.js expects.
const Stats = (function() {
  function recordWin() {}
  function recordLoss() {}
  function getStats() {
    return {
      gamesPlayed: 0,
      gamesWon: 0,
      winRate: 0,
      averageGuesses: 0,
      bestGame: null,
      currentStreak: 0,
      maxStreak: 0
    };
  }
  function reset() {}

  return {
    recordWin,
    recordLoss,
    getStats,
    reset
  };
})();
