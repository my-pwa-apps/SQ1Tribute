const { test, expect } = require('@playwright/test');

// ============================================================
// FULL WALKTHROUGH
// ------------------------------------------------------------
// This test PLAYS the game. It is only allowed to do what a
// player can do: run parser commands, perform Look/Get/Use/Talk
// on real hotspots, pick real dialog options and move between
// rooms.
//
// It must NEVER call setFlag(), addScore() or assign to
// engine.score. If the score falls short, that is a finding
// about the game, not something the test may paper over.
// ============================================================

async function clearState(page) {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
}

async function startClassicGame(page) {
    await page.keyboard.press('c');
    await page.waitForFunction(
        () => !!window.engine && !window.engine.titleScreen && !!window.engine.cutscene,
        null,
        { timeout: 10000 }
    );
    // Advance until the intro actually ends rather than pressing a fixed number
    // of times, so adding or removing an intro beat cannot break every test.
    for (let index = 0; index < 40; index++) {
        if (await page.evaluate(() => !window.engine.cutscene)) break;
        await page.keyboard.press('Space');
        await page.waitForTimeout(80);
    }
    await page.waitForFunction(
        () => window.engine && !window.engine.titleScreen && !window.engine.cutscene,
        null,
        { timeout: 20000 }
    );
}

/** Clear any Sierra text window, completing the typewriter reveal first. */
async function clearWindows(page) {
    await page.evaluate(() => {
        const e = window.engine;
        for (let i = 0; i < 40; i++) {
            if (!e.textWindow) break;
            if (e.activeDialog && e.activeDialog.phase === 'options') break;
            e.completeTextReveal();
            e.dismissTextWindow();
        }
    });
}

/** Perform an action on a named hotspot through the real click code path. */
async function act(page, hotspotName, action, itemId = null) {
    await clearWindows(page);
    const result = await page.evaluate(([name, chosenAction, item]) => {
        const e = window.engine;
        const room = e.rooms[e.currentRoomId];
        const list = (room.hotspots || []).filter(h => h.name === name && !h.hidden);
        if (list.length === 0) {
            return {
                ok: false,
                room: e.currentRoomId,
                available: (room.hotspots || []).filter(h => !h.hidden).map(h => h.name)
            };
        }
        const hs = list[list.length - 1]; // later entries win, same as click priority
        e.currentAction = chosenAction;
        e.selectedItem = item;
        e.performAction(hs);
        e.selectedItem = null;
        return { ok: true };
    }, [hotspotName, action, itemId]);

    if (!result.ok) {
        throw new Error(
            `Hotspot "${hotspotName}" not available in room "${result.room}". ` +
            `Visible hotspots: ${result.available.join(', ')}`
        );
    }
    await page.waitForTimeout(60);
}

/** Run a parser command exactly as a player would type it. */
async function runCmd(page, command) {
    await clearWindows(page);
    await page.keyboard.type(command);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(80);
}

/** Walk a dialog tree, choosing options whose text matches each pattern. */
async function talk(page, hotspotName, patterns) {
    await act(page, hotspotName, 'talk');
    for (const pattern of patterns) {
        const picked = await page.evaluate((needle) => {
            const e = window.engine;
            for (let i = 0; i < 40; i++) {
                if (e.activeDialog && e.activeDialog.phase === 'options') break;
                if (!e.textWindow) break;
                e.completeTextReveal();
                e.dismissTextWindow();
            }
            if (!e.activeDialog || e.activeDialog.phase !== 'options') {
                return { ok: false, reason: 'no options presented' };
            }
            const lines = e.activeDialog.visibleOptions;
            const idx = lines.findIndex(l => l.text.toLowerCase().includes(needle.toLowerCase()));
            if (idx === -1) return { ok: false, reason: 'no matching option', options: lines.map(l => l.text) };
            e.selectDialogOption(idx);
            return { ok: true };
        }, pattern);

        if (!picked.ok) {
            throw new Error(
                `Dialog option matching "${pattern}" unavailable (${picked.reason}).` +
                (picked.options ? ` Options: ${picked.options.join(' | ')}` : '')
            );
        }
        await page.waitForTimeout(60);
    }
    await clearWindows(page);
}

/** Skip whatever cutscene is playing and wait for the game to settle. */
async function settleCutscenes(page) {
    await page.waitForTimeout(300);
    let busy = false;
    for (let i = 0; i < 40; i++) {
        busy = await page.evaluate(() => {
            const e = window.engine;
            if (e.cutscene) { e.skipCutscene(); return true; }
            return false;
        });
        if (!busy) break;
        await page.waitForTimeout(200);
    }
    // A cutscene that refuses to end is exactly the regression this walkthrough
    // exists to catch, so surface it here instead of failing later and elsewhere.
    expect(busy, 'cutscene did not settle after repeated skips').toBe(false);
    await page.waitForTimeout(200);
}

/** Leave the room through a real exit hotspot (same handler the walk code fires). */
async function exitVia(page, hotspotName) {
    await clearWindows(page);
    const result = await page.evaluate((name) => {
        const e = window.engine;
        const room = e.rooms[e.currentRoomId];
        const list = (room.hotspots || []).filter(h => h.name === name && !h.hidden);
        if (list.length === 0) {
            return { ok: false, room: e.currentRoomId, exits: (room.hotspots || []).filter(h => h.isExit && !h.hidden).map(h => h.name) };
        }
        const hs = list[list.length - 1];
        if (!hs.onExit) return { ok: false, room: e.currentRoomId, exits: ['(hotspot has no onExit)'] };
        hs.onExit(e);
        return { ok: true };
    }, hotspotName);

    if (!result.ok) {
        throw new Error(`Exit "${hotspotName}" not usable in room "${result.room}". Exits: ${result.exits.join(', ')}`);
    }
    await page.waitForTimeout(120);
}

const roomId = (page) => page.evaluate(() => window.engine.currentRoomId);
const scoreOf = (page) => page.evaluate(() => window.engine.score);
const inventory = (page) => page.evaluate(() => window.engine.inventory.slice());

test.describe('Full walkthrough', () => {
    test.setTimeout(240000);

    test('plays the game from the broom closet to the Quantum Drive', async ({ page }) => {
        const trail = [];
        const mark = async (label) => {
            trail.push(`${label.padEnd(14)} score=${await scoreOf(page)}  inv=[${(await inventory(page)).join(',')}]`);
        };
        const dump = () => console.log('Progress trail:\n  ' + trail.join('\n  '));

        await clearState(page);
        await startClassicGame(page);

        expect(await roomId(page)).toBe('broom_closet');

        // ---- Room 1: Broom Closet ----
        await runCmd(page, 'look shelves'); // exercise the text parser at least once
        await act(page, 'Purple Puddle', 'look');
        await act(page, 'Safety Poster', 'look');
        await act(page, 'Mop & Bucket', 'get');
        await act(page, 'Door', 'use', 'mop_handle');
        await mark('broom_closet');
        await exitVia(page, 'Door');

        // ---- Room 2: Corridor ----
        expect(await roomId(page)).toBe('corridor');
        await act(page, 'Blast Marks', 'look');
        await act(page, 'Fallen Crew Member', 'look');
        await act(page, 'Fallen Crew Member', 'get');
        await mark('corridor');

        // ---- Room 3: Science Lab ----
        await exitVia(page, 'Science Lab');
        await act(page, 'Specimen Cases', 'look');
        await act(page, 'Data Cartridge', 'get');
        await mark('science_lab');
        await exitVia(page, 'Exit');

        // ---- Room 11: Engine Room (Korvak side quest) ----
        await exitVia(page, 'Engine Room');
        await act(page, 'Korvak', 'look');
        await talk(page, 'Korvak', ['escape pods']); // Korvak hands over the plasma cutter
        await act(page, 'Fire Suppression Cabinet', 'use'); // emergency override
        await act(page, 'Fire Suppression Cabinet', 'get'); // medkit
        await act(page, 'Fire Suppression Cabinet', 'use', 'plasma_cutter'); // douse the conduit fire
        await act(page, 'Korvak', 'use', 'medkit');
        await mark('engine_room');
        await exitVia(page, 'Corridor Exit');

        // ---- Room 4: Pod Bay ----
        await exitVia(page, 'Escape Pod Bay');
        await act(page, 'Space Window', 'look');
        await act(page, 'Emergency Locker', 'get');
        await act(page, 'Escape Pod', 'look');
        await exitVia(page, 'Escape Pod');
        await settleCutscenes(page);
        await mark('pod_bay');

        // ---- Room 5: Desert ----
        expect(await roomId(page)).toBe('desert');
        await act(page, 'Crashed Pod', 'look');
        // NOTE: the wreck medkit (+3) is deliberately unreachable here - its handler is
        // gated on !korvak_freed, so healing Korvak (+20) locks it out. Mutually exclusive.
        await act(page, 'Alien Bones', 'look');
        await mark('desert');

        // ---- Room 6: Cave ----
        await exitVia(page, 'Rock Formation');
        await act(page, 'Cave Paintings', 'look');
        await act(page, 'Glowing Mushrooms', 'look');
        await act(page, 'Crystal Formation', 'get');
        await mark('cave');

        // ---- Room 7: Outpost ----
        await exitVia(page, 'Tunnel');
        await act(page, 'Wanted Poster', 'look');
        await mark('outpost');

        // ---- Room 12: Docking Bay (Pipz side quest) ----
        await exitVia(page, 'Docking Bay');
        await act(page, 'Ironclad Star', 'look');
        await act(page, 'Hull Breach', 'use');
        await act(page, 'Cargo Manifest', 'get');
        await act(page, 'Pipz', 'look');
        await talk(page, 'Pipz', ['anything useful']);
        await mark('docking_bay');
        await exitVia(page, 'Outpost Exit');

        // ---- Room 9: Trading Post ----
        await exitVia(page, 'Trading Post');
        await act(page, 'No Refunds Sign', 'look');
        await act(page, 'Merchant', 'use', 'crystal');
        await act(page, 'Pulsar Ray', 'use');
        await mark('shop');
        expect(await inventory(page), 'the Pulsar Ray purchase should succeed').toContain('pulsar_ray');
        await exitVia(page, 'Exit');

        // ---- Room 8: Cantina ----
        await exitVia(page, 'Cantina');
        await act(page, 'Blorp', 'look');
        await act(page, 'Skritch', 'look');
        await act(page, 'Crystar', 'look');
        await act(page, 'Dartboard', 'look');
        await talk(page, 'Bartender', ['ale']);
        await act(page, 'Alien Pilot', 'use', 'drink');
        await talk(page, 'Alien Pilot', ['everything about the Draknoids']);
        await mark('cantina');
        await exitVia(page, 'Exit');

        // ---- Launch to the Draknoid flagship ----
        await act(page, 'Landing Pad', 'use', 'nav_chip');
        await settleCutscenes(page);
        expect(await roomId(page)).toBe('draknoid_ship');
        await mark('launch');

        // ---- Room 10: Draknoid Flagship ----
        await act(page, 'Draknoid Guard', 'use', 'pulsar_ray');
        await settleCutscenes(page);
        await act(page, 'Draknoid Insignia', 'look');
        await act(page, 'Brig Corridor', 'look');
        await mark('flagship-1');

        // ---- Room 13: Draknoid Brig ----
        await exitVia(page, 'Brig Corridor');
        await act(page, 'Left Cells', 'look');
        await act(page, 'Cell Control Panel', 'use', 'prisoner_badge');
        await settleCutscenes(page);
        await mark('brig');
        expect(await roomId(page)).toBe('draknoid_ship');

        // ---- Endgame ----
        await act(page, 'Console', 'use', 'cartridge');
        await act(page, 'Quantum Drive', 'get');
        await settleCutscenes(page);
        await mark('endgame');

        console.log('Inventory: ' + (await inventory(page)).join(', '));

        const finalScore = await scoreOf(page);
        const won = await page.evaluate(() => window.engine.won);
        const rescueResolved = await page.evaluate(() => window.engine.getFlag('pipz_thanked'));
        console.log(`Final: ${finalScore}, won=${won}`);
        dump();

        expect(won, 'the walkthrough should reach the victory state').toBe(true);
        expect(rescueResolved, 'the rescued family should reunite with Pipz in the epilogue').toBe(true);
        expect(finalScore).toBe(await page.evaluate(() => window.engine.maxScore));
    });

    test('advertised maxScore matches the points the content can actually award', async ({ page }) => {
        await clearState(page);
        const max = await page.evaluate(() => window.engine.maxScore);
        expect(max).toBe(378);
    });
});

