// Star Sweeper metadata shared by the browser runtime and validation tools.
(function (root, factory) {
    const content = factory();
    if (typeof module === 'object' && module.exports) module.exports = content;
    else root.StarSweeperContent = content;
}(typeof globalThis !== 'undefined' ? globalThis : this, () => ({
    game: {
        id: 'star_sweeper',
        title: 'STAR SWEEPER',
        shortTitle: 'Star Sweeper',
        subtitle: 'A   S P A C E   A D V E N T U R E',
        creditsLine: 'A modern tribute to Sierra On-Line adventure games',
        inspirationLine: 'Inspired by Space Quest: The Sarien Encounter (1986)',
        copyright: '\u00A9 2025-2026',
        storagePrefix: 'starsweeper',
        // Highest score actually achievable in a single playthrough, verified by
        // tests/full-game.spec.js. Pipz's reunion is a score-neutral epilogue beat.
        // The desert wreck medkit (+3) is gated on !korvak_freed, so it is mutually
        // exclusive with the more valuable Korvak rescue route.
        // Keep this in sync when scoring opportunities change, otherwise the game
        // advertises points a player can never earn.
        maxScore: 378,
        startRoom: 'broom_closet',
        startX: 320,
        startY: 310,
        victory: {
            headline: 'CONGRATULATIONS!',
            subhead: 'You have saved the galaxy!',
            ranks: [
                { min: 0.95, title: 'Astral Champion, First Class', flavor: 'They will name a mop after you. Possibly two.' },
                { min: 0.80, title: 'Galactic Hero', flavor: 'Headlines on six worlds. None of them spelled your name right.' },
                { min: 0.60, title: 'Star Captain', flavor: 'Promotion paperwork is, regrettably, your problem now.' },
                { min: 0.35, title: 'Spaceworthy Cadet', flavor: 'You did it the hard way. The galaxy noticed. Mostly.' },
                { min: 0, title: 'Marginally Employed Janitor', flavor: 'You won. Technically. The galaxy will note this in the appendix.' }
            ],
            closingLines: [
                'From humble janitor to galactic hero...',
                'Your story will be told across the stars.'
            ]
        }
    },
    items: [
        { id: 'keycard', name: 'Keycard', description: 'A Level 3 security keycard. The label reads "DR. CHEN - XENOPHYSICS".' },
        { id: 'cartridge', name: 'Data Cartridge', description: 'A data cartridge labeled "QUANTUM DRIVE v3.1 - TECHNICAL SPECIFICATIONS". Could be important.' },
        { id: 'survival_kit', name: 'Survival Kit', description: 'A standard-issue survival kit: water purification tablets, nutrient bars, and a signal mirror.' },
        { id: 'crystal', name: 'Xenon Crystal', description: 'A fist-sized crystal that pulses with a mesmerizing blue-green inner light. It looks very valuable.' },
        { id: 'credits', name: 'Buckazoids', description: 'A credit chip. The standard galactic currency.' },
        { id: 'pulsar_ray', name: 'Pulsar Ray', description: 'A compact Mark IV energy sidearm. Small but packs a punch.' },
        { id: 'drink', name: 'Keronian Ale', description: 'A glass of potent alien ale. The liquid shimmers an unsettling shade of green.' },
        { id: 'nav_chip', name: 'Nav Chip', description: 'A navigation chip containing hyperspace coordinates to the Draknoid flagship location.' },
        { id: 'mop_handle', name: 'Mop Handle', description: 'A sturdy titanium alloy mop handle. Not much of a weapon, but great for prying things open.' },
        { id: 'plasma_cutter', name: 'Plasma Cutter', description: 'A handheld plasma cutting tool from the engine room. Can slice through metal - or force field emitters.' },
        { id: 'medkit', name: 'Medkit', description: 'A standard-issue medical kit. Contains bandages, stimulant injectors, and a blood-coagulating spray.' },
        { id: 'prisoner_badge', name: 'Prisoner Badge', description: 'A Draknoid-issued prisoner identification tag. Has a magnetic strip that might work on internal ship doors.' },
        { id: 'cargo_manifest', name: 'Cargo Manifest', description: 'A battered data pad showing the manifest of the freighter "Ironclad Star". Most entries are redacted.' },
        { id: 'frequency_chip', name: 'Frequency Chip', description: 'A signal chip pulled from the wrecked freighter. Pre-loaded with emergency distress frequencies.' }
    ],
    // Shared progression rules. Dialog trees and room hotspots both reach these
    // transactions, so they must have exactly one implementation.
    rules: {
        spendCredits(e, amount) {
            const remaining = (e.getFlag('credits_amount') || 0) - amount;
            e.setFlag('credits_amount', remaining);
            e.items['credits'].name = `Buckazoids (${remaining})`;
            e.items['credits'].description = `A credit chip with ${remaining} buckazoids remaining.`;
            if (remaining <= 0) e.removeFromInventory('credits');
        },
        buyDrink(e) {
            e.sound.sell();
            this.spendCredits(e, 10);
            e.addToInventory('drink');
            e.updateInventoryUI();
        },
        buyPulsarRay(e) {
            e.sound.sell();
            this.spendCredits(e, 30);
            e.setFlag('bought_ray');
            e.addToInventory('pulsar_ray');
            if (!e.getFlag('scored_pulsar_ray')) {
                e.setFlag('scored_pulsar_ray');
                e.addScore(10);
            }
            e.updateInventoryUI();
        },
        sellCrystal(e) {
            e.sound.sell();
            e.removeFromInventory('crystal');
            e.addToInventory('credits');
            e.setFlag('credits_amount', 50);
            e.items['credits'].name = 'Buckazoids (50)';
            e.items['credits'].description = 'A credit chip with 50 buckazoids.';
            if (!e.getFlag('scored_crystal_sale')) {
                e.setFlag('scored_crystal_sale');
                e.addScore(10);
            }
            e.updateInventoryUI();
        },
        givePilotDrink(e) {
            e.sound.drink();
            e.removeFromInventory('drink');
            e.setFlag('pilot_has_drink');
            e.updateInventoryUI();
        },
        grantNavChip(e) {
            if (e.getFlag('pilot_left')) return;
            e.addToInventory('nav_chip');
            e.setFlag('pilot_left');
            e.addScore(20);
            e.updateInventoryUI();
        },
        healKorvak(e) {
            if (e.getFlag('korvak_freed')) return;
            e.removeFromInventory('medkit');
            e.setFlag('korvak_freed');
            e.setFlag('korvak_left');
            e.addScore(20);
            if (!e.getFlag('korvak_gave_cutter')) {
                e.addToInventory('plasma_cutter');
                e.setFlag('korvak_gave_cutter');
            }
            e.updateInventoryUI();
        }
    }
})));
