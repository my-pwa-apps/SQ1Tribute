const { test, expect } = require('@playwright/test');

// The game has no bundler, so its module boundaries are enforced by load order
// and a registry rather than by imports. These tests assert the contract holds
// at runtime, which a static check cannot prove.

test.describe('module architecture', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await page.evaluate(() => localStorage.clear());
        await page.reload();
    });

    test('every room module registers through the registry', async ({ page }) => {
        const result = await page.evaluate(() => ({
            moduleCount: window.StarSweeper._roomModules.length,
            roomIds: Object.keys(window.engine.rooms).sort()
        }));

        expect(result.moduleCount).toBeGreaterThanOrEqual(4);
        expect(result.roomIds).toEqual([
            'broom_closet', 'cantina', 'cave', 'corridor', 'desert',
            'docking_bay', 'draknoid_brig', 'draknoid_ship', 'engine_room',
            'outpost', 'pod_bay', 'science_lab', 'shop'
        ]);
    });

    test('the shared art module is loaded before any room needs it', async ({ page }) => {
        const missing = await page.evaluate(() => [
            'ditherRect', 'stars', 'metalWall', 'perspectiveFloor', 'sceneFont',
            'alarmGlow', 'alarmLight', 'gradientRect', 'drawEscapePod',
            'drawShuttleCraft', 'drawFreighter', 'drawComputerTerminal',
            'drawFireEffect', 'drawPlayerBody', 'drawPlayerSleeping'
        ].filter((name) => typeof window[name] !== 'function'));

        expect(missing).toEqual([]);
    });

    test('every registered room can be entered and drawn', async ({ page }) => {
        await page.keyboard.press('e');
        const failures = await page.evaluate(() => {
            const e = window.engine;
            const broken = [];
            for (const id of Object.keys(e.rooms)) {
                try {
                    e.goToRoom(id, 320, 330);
                    e.roomTransition = 0;
                    e.render();
                } catch (err) {
                    broken.push(`${id}: ${err.message}`);
                }
            }
            return broken;
        });

        expect(failures).toEqual([]);
    });

    test('destroy() detaches listeners and stops the render loop', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const e = window.engine;
            const attached = e._listeners.length;
            e.destroy();
            const before = e.animTimer;
            await new Promise((resolve) => setTimeout(resolve, 250));
            return {
                attached,
                remaining: e._listeners.length,
                loopRunning: e._loopRunning,
                advanced: e.animTimer !== before,
                globalCleared: window.engine === undefined
            };
        });

        expect(result.attached).toBeGreaterThan(10);
        expect(result.remaining).toBe(0);
        expect(result.loopRunning).toBe(false);
        expect(result.advanced).toBe(false);
        expect(result.globalCleared).toBe(true);
    });
});
