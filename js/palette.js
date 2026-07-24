// ============================================================
// STAR SWEEPER - SHARED COLOUR PALETTE
// ------------------------------------------------------------
// Central colour vocabulary for the engine and game content.
//
// Every value here is byte-identical to the literal it replaced,
// so extracting these names does not change a single rendered
// pixel. New art should prefer these names over raw hex so the
// game keeps one coherent colour signature.
// ============================================================

(function (global) {
    'use strict';

    // The canonical IBM EGA 16-colour hardware palette. Kept as a
    // reference ramp for art that wants to stay period-accurate.
    const EGA = {
        BLACK: '#000000',
        BLUE: '#0000AA',
        GREEN: '#00AA00',
        CYAN: '#00AAAA',
        RED: '#AA0000',
        MAGENTA: '#AA00AA',
        BROWN: '#AA5500',
        LIGHT_GRAY: '#AAAAAA',
        DARK_GRAY: '#555555',
        BRIGHT_BLUE: '#5555FF',
        BRIGHT_GREEN: '#55FF55',
        BRIGHT_CYAN: '#55FFFF',
        BRIGHT_RED: '#FF5555',
        BRIGHT_MAGENTA: '#FF55FF',
        YELLOW: '#FFFF55',
        WHITE: '#FFFFFF'
    };

    const PALETTE = {
        EGA,

        // ---- Structural / line work ----
        OUTLINE: '#000000',
        EDGE_HIGHLIGHT: '#AAAAAA',
        EDGE_SHADOW: '#222222',
        PANEL_SEAM: '#555555',

        // ---- Ship interior (hull, panels, decking) ----
        HULL_BASE: '#38384e',
        HULL_PANEL: '#4a4a60',
        FLOOR_LIGHT: '#484860',
        FLOOR_DARK: '#3a3a50',

        // ---- Alert / emergency lighting ----
        ALERT_DIM: '#AA0000',
        ALERT_BRIGHT: '#FF5555',

        // ---- Sierra text window (AGI print box) ----
        WINDOW_PAPER: '#FFFFFF',
        WINDOW_BORDER: '#AA0000',
        WINDOW_INK: '#000000',
        WINDOW_HINT_DIM: '#777777',
        WINDOW_BLUE: '#0000AA',

        // ---- HUD / status text ----
        TEXT_PRIMARY: '#FFFFFF',
        TEXT_ACCENT: '#FFFF55',
        TEXT_POSITIVE: '#55FF55',
        TEXT_NEGATIVE: '#FF8855',
        TEXT_MUTED: '#AAAAAA',

        // ---- Player sprite ----
        PLAYER: {
            suit: '#FFFFFF',
            suitShadow: '#EEEEEE',
            legs: '#BBBBBB',
            legHighlight: '#DDDDDD',
            collar: '#555555',
            belt: '#333333',
            buckle: '#AAAAAA',
            skin: '#FFCC88',
            skinShadow: '#EEBB77',
            hair: '#BB7733',
            iris: '#4477CC',
            boots: '#222222'
        }
    };

    global.SS_PALETTE = PALETTE;
})(typeof window !== 'undefined' ? window : globalThis);
