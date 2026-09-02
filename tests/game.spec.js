const { test, expect } = require('@playwright/test');

async function clearState(page) {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
}

async function finishIntro(page, modeKey = 'e') {
    await page.keyboard.press(modeKey);
    // The intro cutscene is created when the title screen is dismissed; wait for
    // it before polling, or the loop exits before a single beat has played.
    await page.waitForFunction(
        () => !!window.engine && !window.engine.titleScreen && !!window.engine.cutscene,
        null,
        { timeout: 10000 }
    );
    // Data-driven rather than a fixed press count: intro beats change over time.
    for (let index = 0; index < 40; index++) {
        if (await page.evaluate(() => !window.engine.cutscene)) break;
        await page.keyboard.press('Space');
        await page.waitForTimeout(90);
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

test('startup advances preserve the warning, explosions, and emergency sequence', async ({ page }) => {
    await clearState(page);
    await page.evaluate(() => {
        const e = window.engine;
        e.__introAnnouncements = [];
        e.__introExplosions = 0;
        const announce = e.announce.bind(e);
        e.announce = (text) => {
            e.__introAnnouncements.push(text);
            announce(text);
        };
        e.sound.explosion = () => { e.__introExplosions++; };
    });
    await page.keyboard.press('e');
    for (let index = 0; index < 18; index++) {
        await page.keyboard.press('Space');
        await page.waitForTimeout(120);
    }
    const intro = await page.evaluate(() => ({
        announcements: window.engine.__introAnnouncements,
        explosions: window.engine.__introExplosions,
        room: window.engine.currentRoomId
    }));
    expect(intro.announcements.join(' ')).toMatch(/proximity alert|what the/i);
    expect(intro.announcements.join(' ')).toMatch(/ship shudders violently/i);
    expect(intro.announcements.join(' ')).toMatch(/need to get out/i);
    expect(intro.explosions).toBe(2);
    expect(intro.room).toBe('broom_closet');
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

test('the broom closet walls are outside the walkable floor', async ({ page }) => {
    await clearState(page);
    await finishIntro(page);

    const collision = await page.evaluate(() => ({
        floor: window.engine.collidesBarrier(500, 350),
        rightWall: window.engine.collidesBarrier(600, 350),
        leftWall: window.engine.collidesBarrier(40, 310)
    }));
    expect(collision).toEqual({ floor: false, rightWall: true, leftWall: true });

    await page.evaluate(() => {
        const e = window.engine;
        e.playerX = 500;
        e.playerY = 350;
        e.keysDown.ArrowRight = true;
        for (let frame = 0; frame < 100; frame++) e.update(16);
        delete e.keysDown.ArrowRight;
    });
    const playerX = await page.evaluate(() => window.engine.playerX);
    expect(playerX).toBeLessThan(545);
});

test('using the science lab exit returns to the corridor', async ({ page }) => {
    await clearState(page);
    await finishIntro(page);
    const result = await page.evaluate(() => {
        const e = window.engine;
        e.goToRoom('science_lab', 320, 330);
        e.roomTransition = 0;
        e.currentAction = 'use';
        const exit = e.rooms.science_lab.hotspots.find((hotspot) => hotspot.name === 'Exit');
        e.performAction(exit);
        return e.currentRoomId;
    });

    expect(result).toBe('corridor');
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

test('title, player, and Draknoid motifs have distinct procedural signatures', async ({ page }) => {
    await clearState(page);
    const signatures = await page.evaluate(() => {
        const sound = window.engine.sound;
        const originalCtx = sound.ctx;
        const originalOsc = sound._osc;
        sound.ctx = { currentTime: 0 };
        const capture = (play) => {
            const notes = [];
            sound._osc = (type, frequency, start, duration) => {
                notes.push([type, Math.round(frequency), start, duration]);
                return null;
            };
            play();
            return notes;
        };
        try {
            return {
                title: capture(() => sound.titleTheme()),
                player: capture(() => sound.playerMotif()),
                draknoid: capture(() => sound.draknoidMotif())
            };
        } finally {
            sound._osc = originalOsc;
            sound.ctx = originalCtx;
        }
    });
    expect(signatures.title.length).toBeGreaterThanOrEqual(14);
    expect(signatures.player.length).toBeGreaterThanOrEqual(9);
    expect(signatures.draknoid.length).toBeGreaterThanOrEqual(9);
    expect(signatures.title).not.toEqual(signatures.player);
    expect(signatures.player).not.toEqual(signatures.draknoid);
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

test('distinct reactor and guard deaths restart into a clean game', async ({ page }) => {
    await clearState(page);
    await finishIntro(page);

    const deaths = [
        { room: 'engine_room', hotspot: 'Reactor Core', action: 'get' },
        { room: 'draknoid_ship', hotspot: 'Draknoid Guard', action: 'walk' }
    ];
    for (const death of deaths) {
        await page.evaluate(({ room, hotspot, action }) => {
            const e = window.engine;
            e.goToRoom(room, 320, 330);
            e.roomTransition = 0;
            e.currentAction = action;
            const target = e.rooms[room].hotspots.find((candidate) => candidate.name === hotspot);
            e.performAction(target);
        }, death);
        expect(await page.evaluate(() => window.engine.dead)).toBe(true);
        await expect(page.locator('#canvas-accessibility')).toContainText(/press r to restart/i);

        await page.keyboard.press('r');
        const state = await page.evaluate(() => ({
            dead: window.engine.dead,
            room: window.engine.currentRoomId,
            score: window.engine.score,
            inventory: window.engine.inventory
        }));
        expect(state).toEqual({ dead: false, room: 'broom_closet', score: 0, inventory: [] });
    }
});

test('sound initialization does not raise page errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await clearState(page);
    await page.waitForTimeout(100);

    const optionalState = await page.evaluate(async () => {
        await window.engine.sound.init();
        window.engine.updateSoundUI();
        return {
            soundStatus: window.engine.sound.getStatus()
        };
    });
    expect(errors).toEqual([]);
    expect(['on', 'off', 'paused', 'blocked']).toContain(optionalState.soundStatus);
});

test('WebXR mode makes Wilkins first-person and maps locomotion into the game world', async ({ page }) => {
    await page.addInitScript(() => {
        Object.defineProperty(navigator, 'xr', {
            configurable: true,
            value: { isSessionSupported: async () => true }
        });
    });
    await clearState(page);
    await page.waitForFunction(() => window.engine?.vr?.supported === true);
    await expect(page.locator('#btn-vr')).toBeVisible();

    const result = await page.evaluate(() => {
        const engine = window.engine;
        const vr = engine.vr;
        const desktopCanvas = engine.canvas;
        const wallCenter = vr._canvasToWorld(320, 150);
        const floorFront = vr._canvasToWorld(320, 400);
        const rendererReady = vr._initScene();

        vr._activateFirstPersonState();
        const immersive = {
            canvasChanged: engine.canvas !== desktopCanvas,
            playerVisible: engine.playerVisible,
            vrActive: engine.vrActive,
            immersiveView: engine.immersiveView
        };
        vr._setMovementKeys(1, -1);
        const movement = {
            right: engine.keysDown.ArrowRight,
            up: engine.keysDown.ArrowUp,
            left: engine.keysDown.ArrowLeft,
            down: engine.keysDown.ArrowDown
        };
        engine.titleScreen = false;
        engine.goToRoom('broom_closet', 320, 310);
        engine.roomTransition = 0;
        engine.render();
        vr._updateRoomTextures();
        vr.renderer.setSize(320, 200, false);
        vr.camera.position.set(0, 1.65, 1.1);
        vr.camera.lookAt(0, 1.55, -3.8);
        vr.renderer.render(vr.scene, vr.camera);
        const gl = vr.renderer.getContext();
        const pixels = new Uint8Array(4 * 16 * 16);
        gl.readPixels(152, 92, 16, 16, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
        const litChannels = pixels.reduce((count, value, index) =>
            count + (index % 4 !== 3 && value > 8 ? 1 : 0), 0);
        vr._clearMovementKeys();
        vr._restoreDesktopState();

        return {
            immersive,
            movement,
            rendererReady,
            litChannels,
            restored: engine.canvas === desktopCanvas && engine.playerVisible &&
                !engine.vrActive && !engine.immersiveView,
            wallCenter: { x: wallCenter.x, y: wallCenter.y, z: wallCenter.z },
            floorFront: { x: floorFront.x, y: floorFront.y, z: floorFront.z }
        };
    });

    expect(result.immersive).toEqual({
        canvasChanged: true,
        playerVisible: false,
        vrActive: true,
        immersiveView: true
    });
    expect(result.movement).toEqual({ right: true, up: true, left: false, down: false });
    expect(result.rendererReady).toBe(true);
    expect(result.litChannels).toBeGreaterThan(100);
    expect(result.restored).toBe(true);
    expect(result.wallCenter.x).toBeCloseTo(0, 5);
    expect(result.wallCenter.z).toBeLessThan(-3.8);
    expect(result.floorFront.z).toBeCloseTo(3, 5);
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
        for (let index = 0; index < 18; index++) {
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

test.describe('regression coverage for documented features', () => {
    test('the parser answers nonsense with snark rather than silence', async ({ page }) => {
        await clearState(page);
        await finishIntro(page, 'c');
        const before = await page.locator('#message-text').textContent();
        await runClassicCommand(page, 'EAT MOP');
        await expect(page.locator('#message-text')).not.toHaveText(before);
        const reply = await page.locator('#message-text').textContent();
        expect(reply.trim().length).toBeGreaterThan(10);
    });

    test('F9 toggles CRT effects and F2 toggles object highlighting', async ({ page }) => {
        await clearState(page);
        await finishIntro(page);

        const crtBefore = await page.evaluate(() => window.engine.crtEffects);
        await page.keyboard.press('F9');
        expect(await page.evaluate(() => window.engine.crtEffects)).toBe(!crtBefore);

        await page.keyboard.press('F2');
        // The Objects button must mirror the engine state for screen readers.
        await expect(page.locator('#btn-scan')).toHaveAttribute('aria-pressed', 'true');
        await page.keyboard.press('F2');
        await expect(page.locator('#btn-scan')).toHaveAttribute('aria-pressed', 'false');
    });

    test('F3 recalls the last typed parser command into the input line', async ({ page }) => {
        await clearState(page);
        await finishIntro(page, 'c');
        await runClassicCommand(page, 'LOOK');
        await page.evaluate(() => {
            const e = window.engine;
            for (let i = 0; i < 20 && e.textWindow; i++) { e.completeTextReveal(); e.dismissTextWindow(); }
        });
        await page.keyboard.press('F3');
        expect((await page.evaluate(() => window.engine.commandLine)).toLowerCase()).toBe('look');
    });

    test('a completed game refuses to overwrite a save slot', async ({ page }) => {
        await clearState(page);
        await finishIntro(page);
        await page.evaluate(() => window.engine.victory('done'));
        await page.keyboard.press('F5');
        await expect(page.locator('#message-text')).toContainText(/already complete/i);
        await expect(page.locator('#save-modal')).toBeHidden();
    });

    test('corrupt save data is rejected instead of loading a broken world', async ({ page }) => {
        await clearState(page);
        await finishIntro(page);
        await page.evaluate(() => {
            localStorage.setItem('starsweeper_save_0', JSON.stringify({
                version: 1, timestamp: 1, currentRoomId: 'no_such_room',
                playerX: 320, playerY: 330, inventory: [], score: 0, flags: {}
            }));
        });
        await page.keyboard.press('F7');
        await page.locator('.slot-action', { hasText: 'Load' }).first().click();
        await expect(page.locator('#message-text')).toContainText(/corrupted/i);
        expect(await page.evaluate(() => window.engine.currentRoomId)).toBe('broom_closet');
    });

    test('a save cannot pollute Object.prototype through crafted keys', async ({ page }) => {
        await clearState(page);
        await finishIntro(page);
        await page.evaluate(() => {
            localStorage.setItem('starsweeper_save_0', JSON.stringify({
                version: 1, timestamp: 1, currentRoomId: 'broom_closet',
                playerX: 320, playerY: 330, inventory: ['__proto__', 'constructor'],
                score: 0, flags: { __proto__: { polluted: true } },
                itemNames: { __proto__: { name: 'pwn', description: 'pwn' } }
            }));
        });
        await page.keyboard.press('F7');
        await page.locator('.slot-action', { hasText: 'Load' }).first().click();
        await page.keyboard.press('Space');
        const result = await page.evaluate(() => ({
            polluted: {}.polluted !== undefined,
            protoName: {}.name !== undefined,
            inventory: window.engine.inventory
        }));
        expect(result.polluted).toBe(false);
        expect(result.protoName).toBe(false);
        expect(result.inventory).toEqual([]);
    });

    test('arriving at the flagship unarmed can retreat instead of softlocking', async ({ page }) => {
        await clearState(page);
        await finishIntro(page, 'c');
        await loadSave(page, lateGameSave([], { guard_defeated: false, flew_away: true }));
        await page.evaluate(() => {
            const e = window.engine;
            e.setFlag('flew_unarmed');
            const airlock = e.rooms.draknoid_ship.hotspots.find((h) => h.name === 'Airlock');
            airlock.onExit(e);
            e.skipCutscene();
        });
        await expect
            .poll(() => page.evaluate(() => window.engine.currentRoomId), { timeout: 10000 })
            .toBe('outpost');
        const flags = await page.evaluate(() => ({
            flewAway: window.engine.getFlag('flew_away'),
            flewUnarmed: window.engine.getFlag('flew_unarmed')
        }));
        expect(flags.flewAway).toBe(false);
        expect(flags.flewUnarmed).toBe(false);
    });

    test('relaunching the shuttle does not award the launch points twice', async ({ page }) => {
        await clearState(page);
        await finishIntro(page, 'c');
        const scores = await page.evaluate(() => {
            const e = window.engine;
            e.goToRoom('outpost', 520, 305);
            e.roomTransition = 0;
            e.addToInventory('nav_chip');
            e.addToInventory('pulsar_ray');
            const pad = e.rooms.outpost.hotspots.find((h) => h.name === 'Landing Pad');
            const before = e.score;
            pad.use(e);
            const afterFirst = e.score;
            e.skipCutscene();
            // Simulate the retreat path making the shuttle available again.
            e.setFlag('flew_away', false);
            pad.use(e);
            e.skipCutscene();
            return { before, afterFirst, afterSecond: e.score };
        });
        expect(scores.afterFirst).toBe(scores.before + 15);
        expect(scores.afterSecond).toBe(scores.afterFirst);
    });

    test('inventory items are focusable buttons that select with the keyboard', async ({ page }) => {
        await clearState(page);
        await finishIntro(page);
        await page.evaluate(() => window.engine.addToInventory('keycard'));
        const item = page.locator('#inventory-items .inv-item').first();
        await expect(item).toHaveRole('button');
        await expect(item).toHaveAttribute('aria-pressed', 'false');
        await item.focus();
        await page.keyboard.press('Enter');
        await expect(item).toHaveAttribute('aria-pressed', 'true');
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
