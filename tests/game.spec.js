const { test, expect } = require('@playwright/test');

async function clearState(page) {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
}

async function finishIntro(page, modeKey = 'e') {
    await page.keyboard.press(modeKey);
    for (let index = 0; index < 14; index++) {
        await page.keyboard.press('Space');
        await page.waitForTimeout(120);
    }
    await expect(page.locator('#message-text')).toContainText('broom closet', { timeout: 5000 });
    await page.keyboard.press('Space');
}

function lateGameSave(inventory, flags) {
    return {
        version: 1,
        timestamp: Date.now(),
        currentRoomId: 'draknoid_ship',
        playerX: 200,
        playerY: 310,
        playerDir: 1,
        playerFacing: 'toward',
        crtEffects: true,
        inventory,
        score: 300,
        flags: { guard_defeated: true, ...flags },
        itemNames: {}
    };
}

async function loadSave(page, data) {
    await page.evaluate((save) => {
        localStorage.setItem('starsweeper_save_0', JSON.stringify(save));
    }, data);
    await page.keyboard.press('F7');
    await page.locator('.slot-action', { hasText: 'Load' }).first().click();
    await expect(page.locator('#message-text')).toContainText('Game loaded');
    await page.keyboard.press('Space');
}

async function runClassicCommand(page, command) {
    // Clear any open Sierra text window first. A player has to do the same, and it
    // stops the first typed character being swallowed as the dismiss keypress.
    await page.evaluate(() => {
        const e = window.engine;
        for (let i = 0; i < 20 && e.textWindow; i++) {
            e.completeTextReveal();
            e.dismissTextWindow();
        }
    });
    await page.keyboard.type(command);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(100);
}

async function saveAndReadData(page) {
    await page.keyboard.press('F5');
    await page.locator('.slot-action', { hasText: 'Save' }).first().click();
    return page.evaluate(() => JSON.parse(localStorage.getItem('starsweeper_save_0')));
}

async function ensureServiceWorkerControl(page) {
    await page.evaluate(() => navigator.serviceWorker.ready);
    const controlled = await page.evaluate(() => navigator.serviceWorker.controller !== null);
    if (!controlled) await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => navigator.serviceWorker.controller !== null, null, { timeout: 10000 });
}

test('title mode switching keeps inactive gameplay chrome hidden', async ({ page }) => {
    await clearState(page);
    await expect(page.locator('body')).toHaveClass(/title-screen/);
    const initialMode = await page.locator('body').evaluate((body) => body.classList.contains('classic-mode') ? 'classic' : 'enhanced');
    await page.keyboard.press('F10');
    await expect(page.locator('body')).toHaveClass(new RegExp(initialMode === 'classic' ? 'enhanced-mode' : 'classic-mode'));
    await expect(page.locator('#action-bar')).toBeHidden();
    await expect(page.locator('#message-text')).toContainText(/interface selected/i);
});

test('game starts, announces narration, and saves a validated slot', async ({ page }) => {
    await clearState(page);
    await finishIntro(page);
    await expect(page.locator('#canvas-accessibility')).toContainText('broom closet');
    await page.keyboard.press('F5');
    await expect(page.locator('.slot-row')).toHaveCount(5);
    await page.locator('.slot-action', { hasText: 'Save' }).first().click();
    const save = await page.evaluate(() => JSON.parse(localStorage.getItem('starsweeper_save_0')));
    expect(save.currentRoomId).toBe('broom_closet');
    expect(save.flags.alarm_active).toBe(true);
});

test('walking out of the closet does not bounce the player straight back in', async ({ page }) => {
    await clearState(page);
    await finishIntro(page);
    await page.evaluate(() => window.engine.setFlag('closet_door_open'));

    const hold = async (key, ms) => {
        await page.keyboard.down(key);
        await page.waitForTimeout(ms);
        await page.keyboard.up(key);
        await page.waitForTimeout(250);
    };
    const room = () => page.evaluate(() => window.engine.currentRoomId);

    await hold('ArrowUp', 2000);
    expect(await room()).toBe('corridor');

    // Walking forward on arrival used to re-trigger the door behind the player.
    await hold('ArrowUp', 1500);
    expect(await room()).toBe('corridor');
    await hold('ArrowDown', 1500);
    expect(await room()).toBe('corridor');
    await hold('ArrowUp', 1500);
    expect(await room()).toBe('corridor');
});

test('enhanced Look actions display a response and chain on the next click', async ({ page }) => {
    await clearState(page);
    await finishIntro(page);
    await page.getByRole('button', { name: 'Look', exact: true }).click();

    const canvas = page.locator('#game-canvas');
    const box = await canvas.boundingBox();
    await page.mouse.click(box.x + box.width * (320 / 640), box.y + box.height * (150 / 400));
    await expect(page.locator('#message-text')).toContainText('reinforced sliding door');

    // A click while the typewriter is still running must only finish the text.
    await page.mouse.click(box.x + box.width * (565 / 640), box.y + box.height * (130 / 400));
    await expect(page.locator('#message-text')).toContainText('reinforced sliding door');

    // Once the text is fully revealed, the dismissing click performs the action.
    await page.waitForFunction(() => window.engine.isTextFullyRevealed());
    await page.mouse.click(box.x + box.width * (565 / 640), box.y + box.height * (130 / 400));
    await expect(page.locator('#message-text')).toContainText(/safety|poster/i);
});

test('stage scales up to fill a large viewport without overflowing', async ({ page }) => {
    await page.setViewportSize({ width: 1600, height: 1000 });
    await clearState(page);
    await page.waitForFunction(() => window.engine);
    const box = await page.locator('#game-canvas').boundingBox();
    expect(box.width).toBeGreaterThan(900);
    expect(box.width / box.height).toBeCloseTo(1.6, 1);
    const fits = await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);
    expect(fits).toBe(true);
});

test('repeated hints never reduce adventure score', async ({ page }) => {
    await clearState(page);
    await finishIntro(page);
    const scores = await page.evaluate(() => {
        window.engine.score = 10;
        window.engine.showHint();
        const first = window.engine.score;
        window.engine.dismissTextWindow();
        window.engine.showHint();
        return { first, second: window.engine.score };
    });
    expect(scores).toEqual({ first: 10, second: 10 });
});

test('the conduit fire can be put out by acting on the fire itself', async ({ page }) => {
    await clearState(page);
    await finishIntro(page);
    const result = await page.evaluate(() => {
        const e = window.engine;
        const act = (name, action, item) => {
            const hs = e.rooms.engine_room.hotspots.filter((h) => h.name === name && !h.hidden).pop();
            if (!hs) return false;
            e.currentAction = action;
            e.selectedItem = item || null;
            e.performAction(hs);
            e.selectedItem = null;
            e.textWindow = null;
            return true;
        };
        const attempt = (setup) => {
            e.flags = {};
            e.inventory = [];
            e.goToRoom('engine_room', 320, 340);
            e.roomTransition = 0;
            setup(act);
            return e.getFlag('fire_suppressed');
        };
        return {
            fireTargetable: (() => {
                e.flags = {};
                e.goToRoom('engine_room', 320, 340);
                return e.rooms.engine_room.hotspots.some((h) => h.name === 'Conduit Fire' && !h.hidden);
            })(),
            blockedBeforeCabinet: attempt((a) => a('Conduit Fire', 'use')),
            viaFire: attempt((a) => { a('Fire Suppression Cabinet', 'use'); a('Conduit Fire', 'use'); }),
            viaCutter: attempt((a) => {
                e.addToInventory('plasma_cutter');
                a('Fire Suppression Cabinet', 'use');
                a('Fire Suppression Cabinet', 'use', 'plasma_cutter');
            })
        };
    });
    expect(result.fireTargetable, 'the fire needs its own hotspot').toBe(true);
    expect(result.blockedBeforeCabinet, 'cannot douse it before opening the cabinet').toBe(false);
    expect(result.viaFire, 'using the fire should put it out').toBe(true);
    expect(result.viaCutter, 'the original cabinet route must keep working').toBe(true);
});

test('death can be recovered with restart', async ({ page }) => {
    await clearState(page);
    await finishIntro(page, 'c');
    await runClassicCommand(page, 'LOOK PUDDLE');
    await expect(page.locator('#canvas-accessibility')).toContainText(/purple|puddle/i);
    await page.keyboard.press('Space');
    await runClassicCommand(page, 'DRINK PUDDLE');
    await expect(page.locator('#canvas-accessibility')).toContainText(/press r to restart/i);
    await page.keyboard.press('r');
    await expect(page.locator('#message-text')).toContainText('broom closet');
});

test('save modal traps and restores keyboard focus', async ({ page }) => {
    await clearState(page);
    await finishIntro(page);
    await page.keyboard.press('F5');
    const firstAction = page.locator('.slot-action').first();
    await expect(firstAction).toBeFocused();
    await page.keyboard.press('Shift+Tab');
    await expect(page.locator('#save-modal-close')).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(firstAction).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(page.locator('#save-modal')).not.toHaveClass(/open/);
});

test('classic rendering performs no full-canvas pixel readbacks', async ({ page }) => {
    await page.addInitScript(() => {
        const original = CanvasRenderingContext2D.prototype.getImageData;
        globalThis.__imageReads = 0;
        CanvasRenderingContext2D.prototype.getImageData = function (...args) {
            globalThis.__imageReads++;
            return original.apply(this, args);
        };
    });
    await clearState(page);
    await finishIntro(page, 'c');
    await page.waitForTimeout(500);
    await expect.poll(() => page.evaluate(() => globalThis.__imageReads)).toBe(0);
});

test('primary cartridge route lowers the final force field', async ({ page }) => {
    await clearState(page);
    await finishIntro(page, 'c');
    await loadSave(page, lateGameSave(['cartridge', 'pulsar_ray'], {}));
    await runClassicCommand(page, 'USE CARTRIDGE ON CONSOLE');
    await expect(page.locator('#canvas-accessibility')).toContainText(/field drops|drops the field/i);
    await page.keyboard.press('Space');
    await runClassicCommand(page, 'USE CONSOLE');
    await expect(page.locator('#canvas-accessibility')).toContainText(/already off|already offline/i);
    const save = await saveAndReadData(page);
    expect(save.flags.field_down).toBe(true);
    expect(save.score).toBe(325);
    await page.keyboard.press('Space');
    await runClassicCommand(page, 'GET QUANTUM DRIVE');
    await page.keyboard.press('Space');
    await expect(page.locator('#canvas-accessibility')).toContainText('THE END');
});

test('alternate recovery route lowers the final force field', async ({ page }) => {
    await clearState(page);
    await finishIntro(page, 'c');
    await loadSave(page, lateGameSave(['cargo_manifest', 'frequency_chip', 'pulsar_ray'], { rescued_prisoners: true }));
    await runClassicCommand(page, 'USE CARGO MANIFEST ON CONSOLE');
    await expect(page.locator('#canvas-accessibility')).toContainText(/maintenance burst/i);
    const save = await saveAndReadData(page);
    expect(save.flags.field_down).toBe(true);
    expect(save.flags.field_bypassed_without_cartridge).toBe(true);
    expect(save.score).toBe(305);
});

test('update prompt is announced and keyboard operable', async ({ page }) => {
    await clearState(page);
    await page.evaluate(() => showUpdateBanner());
    const banner = page.locator('#pwa-update-banner');
    await expect(banner).toHaveAttribute('role', 'status');
    await expect(banner.getByRole('button', { name: /reload/i })).toBeVisible();
});

test.describe('touch controls', () => {
    test('touch defaults to Enhanced and Classic exposes a parser recovery path', async ({ page }, testInfo) => {
        test.skip(testInfo.project.name !== 'mobile-chromium');
        await clearState(page);
        await expect(page.locator('body')).toHaveClass(/enhanced-mode/);

        const canvas = page.locator('#game-canvas');
        const box = await canvas.boundingBox();
        await page.touchscreen.tap(box.x + box.width * (220 / 640), box.y + box.height * (352 / 400));
        for (let index = 0; index < 14; index++) {
            await page.keyboard.press('Space');
            await page.waitForTimeout(120);
        }
        await expect(page.locator('#touch-parser')).toBeVisible();
        await expect(page.locator('#dpad')).toBeVisible();
        await expect(page.locator('#save-load-bar')).toBeVisible();
        await expect(page.locator('#btn-save')).toBeHidden();
        await page.locator('#btn-tools').click();
        await expect(page.locator('#btn-save')).toBeVisible();
        await page.locator('#touch-parser-input').fill('LOOK');
        await page.locator('#touch-parser button[type="submit"]').click();
        await expect(page.locator('#message-text')).not.toHaveText('Choose Classic Parser or Enhanced Click to begin.');
    });
});

test('installed app reloads from cache while offline', async ({ page, context }) => {
    await clearState(page);
    await ensureServiceWorkerControl(page);
    await context.setOffline(true);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.locator('#game-canvas')).toBeVisible();
    await context.setOffline(false);
});

test('installed app falls back to cache when navigation stalls', async ({ page }) => {
    await clearState(page);
    await ensureServiceWorkerControl(page);
    const started = Date.now();
    const response = await page.goto('/index.html?delay=5000', { waitUntil: 'domcontentloaded', timeout: 7000 });
    expect(response.status()).toBe(200);
    expect(Date.now() - started).toBeLessThan(4500);
    await expect(page.locator('#game-canvas')).toBeVisible();
});

test('production security headers are served', async ({ request }) => {
    const response = await request.get('/');
    expect(response.headers()['x-content-type-options']).toBe('nosniff');
    expect(response.headers()['referrer-policy']).toBe('no-referrer');
    expect(response.headers()['content-security-policy']).toContain("frame-ancestors 'none'");
});
