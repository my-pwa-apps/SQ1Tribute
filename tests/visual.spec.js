const { test, expect } = require('@playwright/test');

test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
        Date.now = () => 1;
    });
});

const stableSave = (room) => ({
    version: 1,
    timestamp: 1,
    currentRoomId: room,
    playerX: 320,
    playerY: 330,
    playerDir: 1,
    playerFacing: 'toward',
    inventory: [],
    score: 0,
    flags: {},
    itemNames: {}
});

async function startEnhanced(page) {
    await page.goto('/?visual-test=1');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.keyboard.press('e');
    for (let index = 0; index < 18; index++) {
        await page.keyboard.press('Space');
        await page.waitForTimeout(40);
    }
    if (await page.locator('body').evaluate((body) => body.classList.contains('classic-mode'))) {
        await page.keyboard.press('F10');
    }
}

async function loadRoom(page, room) {
    await page.evaluate((save) => {
        localStorage.setItem('starsweeper_save_0', JSON.stringify(save));
    }, stableSave(room));
    await page.keyboard.press('F7');
    await page.locator('.slot-action', { hasText: 'Load' }).first().click();
    await page.keyboard.press('Space');
    await expect(page.locator('#canvas-accessibility')).toContainText(/game loaded/i);
}

async function expectCanvas(page, name) {
    await page.evaluate(() => document.fonts.ready);
    await expect(page.locator('#game-canvas')).toHaveScreenshot(name, {
        animations: 'disabled',
        maxDiffPixels: 300,
        timeout: 10000
    });
}

async function setRoomState(page, room, flags) {
    await page.evaluate(([roomId, roomFlags]) => {
        const e = window.engine;
        Object.entries(roomFlags).forEach(([name, value]) => e.setFlag(name, value));
        e.goToRoom(roomId, 320, 330);
        e.roomTransition = 0;
        e.textWindow = null;
        e.animTimer = 1;
    }, [room, flags]);
}

test.describe('visual regression', () => {
    test('desktop room art matrix', async ({ page }, testInfo) => {
        test.skip(testInfo.project.name !== 'chromium');
        await page.goto('/?visual-test=1');
        await page.evaluate(() => localStorage.clear());
        await page.reload();
        await expectCanvas(page, 'title.png');

        await startEnhanced(page);
        for (const room of [
            'broom_closet', 'corridor', 'science_lab', 'pod_bay', 'engine_room',
            'desert', 'cave', 'outpost', 'cantina', 'shop', 'docking_bay',
            'draknoid_brig', 'draknoid_ship'
        ]) {
            // The docking bay plays its arrival cinematic once; this matrix
            // captures room art, so mark it as already seen.
            await setRoomState(page, room, room === 'docking_bay' ? { saw_freighter_crash: true } : {});
            await expectCanvas(page, `${room}.png`);
        }

        await setRoomState(page, 'science_lab', {});
        await page.evaluate(() => {
            window.engine.animTimer = 300;
            window.engine.render();
        });
        await expectCanvas(page, 'science-lab-monitor-on.png');

        await setRoomState(page, 'outpost', {});
        await page.evaluate(() => {
            const e = window.engine;
            e.playerFacing = 'toward';
            e.playerWalking = false;
            e.idleActive = true;
            e.idleType = 'shrug';
            e.idleElapsed = 800;
            e.render();
        });
        await expectCanvas(page, 'wilkins-shrug.png');
    });

    test('mobile scene detail and framing', async ({ page }, testInfo) => {
        test.skip(testInfo.project.name !== 'mobile-chromium');
        await startEnhanced(page);
        for (const room of ['cantina', 'shop', 'outpost', 'draknoid_ship']) {
            await loadRoom(page, room);
            await page.evaluate(() => document.fonts.ready);
            await expect(page.locator('#game-container')).toHaveScreenshot(`${room}-mobile.png`, {
                animations: 'disabled',
                maxDiffPixels: 300,
                timeout: 10000
            });
        }
        const dimensions = await page.evaluate(() => ({
            scrollWidth: document.documentElement.scrollWidth,
            clientWidth: document.documentElement.clientWidth
        }));
        expect(dimensions.scrollWidth).toBe(dimensions.clientWidth);
    });

    test('rescued prisoners reunite with Pipz in the epilogue', async ({ page }, testInfo) => {
        test.skip(testInfo.project.name !== 'chromium');
        await startEnhanced(page);
        await page.evaluate(() => {
            const e = window.engine;
            e.setFlag('guard_defeated');
            e.setFlag('field_down');
            e.setFlag('rescued_prisoners');
            e.goToRoom('draknoid_ship', 320, 330);
            e.roomTransition = 0;
            e.currentAction = 'get';
            const drive = e.rooms.draknoid_ship.hotspots.find((hotspot) => hotspot.name === 'Quantum Drive');
            e.performAction(drive);
            e.cutscene.elapsed = 8500;
            e.animTimer = e.scoreFlashUntil + 1;
            e._visualTestUpdate = e.update;
            e.update = () => {};
        });
        await expectCanvas(page, 'pipz-reunion.png');
    });

    test('major puzzle states remain visually legible', async ({ page }, testInfo) => {
        test.skip(testInfo.project.name !== 'chromium');
        await startEnhanced(page);

        const states = [
            ['pod_bay', { pod_launched: true, got_kit: true }, 'pod-bay-launched.png'],
            ['engine_room', { cabinet_opened: true, fire_suppressed: true, korvak_freed: true }, 'engine-room-resolved.png'],
            ['outpost', { flew_away: true }, 'outpost-ship-gone.png'],
            ['cantina', { pilot_has_drink: true, pilot_left: true }, 'cantina-pilot-left.png'],
            ['shop', { bought_ray: true }, 'shop-ray-bought.png'],
            ['draknoid_brig', { brig_cells_open: true, rescued_prisoners: true }, 'draknoid-brig-rescued.png'],
            ['draknoid_ship', { guard_defeated: true, guard_anim_done: true, field_down: true }, 'draknoid-ship-secured.png']
        ];

        for (const [room, flags, image] of states) {
            await setRoomState(page, room, flags);
            await expectCanvas(page, image);
        }
    });

    test('cinematic story beats preserve the Sierra presentation', async ({ page }, testInfo) => {
        test.skip(testInfo.project.name !== 'chromium');
        await page.goto('/?visual-test=1');
        await page.evaluate(() => localStorage.clear());
        await page.reload();
        await page.keyboard.press('e');
        await page.evaluate(() => {
            const e = window.engine;
            e.cutscene.elapsed = 4300;
            e._visualTestUpdate = e.update;
            e.update = () => {};
        });
        await expectCanvas(page, 'intro-status.png');
        await page.evaluate(() => {
            const e = window.engine;
            e.update = e._visualTestUpdate;
            delete e._visualTestUpdate;
            e.cutscene.onAdvance();
            e.cutscene.elapsed = 6400;
            e.render();
            e.cutscene.onAdvance();
            e.cutscene.elapsed = 7100;
            e.render();
            e.cutscene.onAdvance();
            e.cutscene.elapsed = 7600;
            e.render();
            e._visualTestUpdate = e.update;
            e.update = () => {};
        });
        await expectCanvas(page, 'intro-wakeup.png');
        await page.evaluate(() => {
            const e = window.engine;
            e.update = e._visualTestUpdate;
            delete e._visualTestUpdate;
        });

        for (let index = 0; index < 18; index++) {
            await page.keyboard.press('Space');
            await page.waitForTimeout(40);
        }
        await setRoomState(page, 'pod_bay', {});
        await page.evaluate(() => {
            const e = window.engine;
            e.addToInventory('cartridge');
            e.addToInventory('survival_kit');
            const pod = e.rooms.pod_bay.hotspots.find((hotspot) => hotspot.name === 'Escape Pod');
            pod.onExit(e);
            e.textWindow = null;
            e.cutscene.elapsed = 3200;
            e._visualTestUpdate = e.update;
            e.update = () => {};
        });
        await expectCanvas(page, 'pod-launch-cutscene.png');

        await page.evaluate(() => {
            const e = window.engine;
            e.update = e._visualTestUpdate;
            delete e._visualTestUpdate;
            e.skipCutscene();
            e.setFlag('guard_defeated');
            e.setFlag('guard_anim_done');
            e.setFlag('field_down');
            e.score = e.game.maxScore;
            e.goToRoom('draknoid_ship', 320, 330);
            e.roomTransition = 0;
            const drive = e.rooms.draknoid_ship.hotspots.find((hotspot) => hotspot.name === 'Quantum Drive');
            e.currentAction = 'get';
            e.performAction(drive);
            e.cutscene.elapsed = 4700;
            e._visualTestUpdate = e.update;
            e.update = () => {};
        });
        await expectCanvas(page, 'victory-escape-cutscene.png');

        await page.evaluate(() => {
            const e = window.engine;
            e.update = e._visualTestUpdate;
            delete e._visualTestUpdate;
            e.skipCutscene();
            e.completeTextReveal();
        });
        await expectCanvas(page, 'victory-overlay.png');
    });

    test('interface surfaces keep their Sierra styling', async ({ page }, testInfo) => {
        test.skip(testInfo.project.name !== 'chromium');
        await startEnhanced(page);

        await setRoomState(page, 'cantina', {});
        await page.evaluate(() => {
            const e = window.engine;
            e.currentAction = 'talk';
            const pilot = e.rooms.cantina.hotspots.filter((hotspot) => hotspot.name === 'Alien Pilot' && !hotspot.hidden).pop();
            e.performAction(pilot);
            for (let i = 0; i < 20; i++) {
                if (e.activeDialog && e.activeDialog.phase === 'options') break;
                if (!e.textWindow) break;
                e.completeTextReveal();
                e.dismissTextWindow();
            }
        });
        await expectCanvas(page, 'dialog-options.png');

        await page.evaluate(() => {
            const e = window.engine;
            e.activeDialog = null;
            e.textWindow = null;
            e.die('The airlock cycles. Space is exactly as cold as advertised.');
            e.completeTextReveal();
        });
        await expectCanvas(page, 'death-overlay.png');

        await page.goto('/?visual-test=1');
        await page.evaluate(() => localStorage.clear());
        await page.reload();
        await page.keyboard.press('c');
        for (let index = 0; index < 18; index++) {
            await page.keyboard.press('Space');
            await page.waitForTimeout(40);
        }
        await page.evaluate(() => {
            const e = window.engine;
            e.textWindow = null;
            e.showMessage('"SAFETY FIRST!" declares the poster, featuring a cheerful stick figure.');
            e.completeTextReveal();
        });
        await expectCanvas(page, 'classic-parser-window.png');
    });
});
