/**
 * Coin Flip Game (Placeholder)
 * Double or nothing - 50/50 chance
 */

(function() {
    'use strict';

    // Register placeholder with the game registry
    CasinoGameRegistry.register('coin-flip', {
        name: 'Coin Flip',
        description: 'Double or nothing! 50/50 chance to double your bet.',
        icon: '🪙',
        odds: '2x Multiplier',
        enabled: false
    });
})();
