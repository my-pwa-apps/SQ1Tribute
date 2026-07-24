const { test, expect } = require('@playwright/test');

test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
        Date.now = () => 1;
    });
});

const stableSave = (room, crtEffects = false) => ({
    version: 1,
    timestamp: 1,
    currentRoomId: room,
    playerX: 320,
    playerY: 330,
    playerDir: 1,
    playerFacing: 'toward',
    crtEffects,
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
    for (let index = 0; index < 14; index++) {
        await page.keyboard.press('Space');
        await page.waitForTimeout(40);
    }
    if (await page.locator('body').evaluate((body) => body.classList.contains('classic-mode'))) {
        await page.keyboard.press('F10');
    }
}

async function loadRoom(page, room, crtEffects = false) {
    await page.evaluate((save) => {
        localStorage.setItem('starsweeper_save_0', JSON.stringify(save));
    }, stableSave(room, crtEffects));
    await page.keyboard.press('F7');
    await page.locator('.slot-action', { hasText: 'Load' }).first().click();
    await page.keyboard.press('Space');
    await expect(page.locator('#canvas-accessibility')).toContainText(/game loaded/i);
}

async function expectCanvas(page, name) {
    await page.evaluate(() => document.fonts.ready);
    await expect(page.locator('#game-canvas')).toHaveScreenshot(name, {
        animations: 'disabled',
        maxDiffPixelRatio: 0.002,
        timeout: 10000
    });
}

test.describe('visual regression', () => {
    test('desktop room art matrix', async ({ page }, testInfo) => {
        test.skip(testInfo.project.name !== 'chromium');
        await page.goto('/?visual-test=1');
        await page.evaluate(() => localStorage.clear());
        await page.reload();
        await expectCanvas(page, 'title.png');

        await startEnhanced(page);
        for (const room of ['corridor', 'desert', 'cave', 'cantina', 'docking_bay', 'draknoid_ship']) {
            await loadRoom(page, room);
            await expectCanvas(page, `${room}.png`);
        }

        await loadRoom(page, 'corridor', true);
        await expectCanvas(page, 'corridor-crt.png');
    });

    test('mobile scene detail and framing', async ({ page }, testInfo) => {
        test.skip(testInfo.project.name !== 'mobile-chromium');
        await startEnhanced(page);
        for (const room of ['cantina', 'shop', 'outpost', 'draknoid_ship']) {
            await loadRoom(page, room);
            await page.evaluate(() => document.fonts.ready);
            await expect(page.locator('#game-container')).toHaveScreenshot(`${room}-mobile.png`, {
                animations: 'disabled',
                maxDiffPixelRatio: 0.002,
                timeout: 10000
            });
        }
        const dimensions = await page.evaluate(() => ({
            scrollWidth: document.documentElement.scrollWidth,
            clientWidth: document.documentElement.clientWidth
        }));
        expect(dimensions.scrollWidth).toBe(dimensions.clientWidth);
    });
});
