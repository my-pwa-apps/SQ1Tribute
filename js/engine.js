// ============================================================
// STAR SWEEPER - GAME ENGINE
// A tribute to classic Sierra-style space adventure games
// ============================================================

class GameEngine {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.WIDTH = 640;
        this.HEIGHT = 400;
        this.canvas.width = this.WIDTH;
        this.canvas.height = this.HEIGHT;
        this.dom = {
            messageText: document.getElementById('message-text'),
            inventoryItems: document.getElementById('inventory-items'),
            saveModal: document.getElementById('save-modal'),
            modalTitle: document.getElementById('modal-title'),
            slotList: document.getElementById('slot-list'),
            saveModalClose: document.getElementById('save-modal-close'),
            btnSave: document.getElementById('btn-save'),
            btnLoad: document.getElementById('btn-load'),
            btnMute: document.getElementById('btn-mute')
        };
        this.actionButtons = Array.from(document.querySelectorAll('.action-btn'));

        // Game state
        this.rooms = {};
        this.items = {};
        this.currentRoomId = null;
        this.inventory = [];
        this.score = 0;
        this.maxScore = 260;
        this.flags = {};
        this.dead = false;
        this.won = false;
        this.titleScreen = true;

        // Player
        this.playerX = 320;
        this.playerY = 310;
        this.playerTargetX = null;
        this.playerTargetY = null;
        this.playerDir = 1;
        this.playerFacing = 'toward'; // 'left','right','toward','away'
        this.playerWalking = false;
        this.playerFrame = 0;
        this.playerFrameTimer = 0;
        this.playerVisible = true;
        this.playerSpeed = 3;

        // Action system
        this.currentAction = 'walk';
        this.selectedItem = null;
        this.pendingAction = null;

        // Arrow key state
        this.keysDown = {};

        // Mouse
        this.mouseX = 0;
        this.mouseY = 0;

        // Message
        this.message = '';

        // Timing
        this.lastTime = 0;
        this.animTimer = 0;

        // Cutscene system
        this.cutscene = null; // { elapsed, duration, draw, onEnd }

        // Room transition fade
        this.roomTransition = 0;
        this.exitCooldown = 0;

        // Reusable drawables array for Y-sorted rendering (avoid per-frame allocation)
        this._drawables = [];

        // CRT scanline overlay (pre-rendered for performance)
        this.scanlineCanvas = document.createElement('canvas');
        this.scanlineCanvas.width = this.WIDTH;
        this.scanlineCanvas.height = this.HEIGHT;
        const slCtx = this.scanlineCanvas.getContext('2d');
        slCtx.fillStyle = 'rgba(0,0,0,0.12)';
        for (let y = 0; y < this.HEIGHT; y += 2) {
            slCtx.fillRect(0, y, this.WIDTH, 1);
        }

        // CRT vignette overlay (pre-rendered for performance)
        this.vignetteCanvas = document.createElement('canvas');
        this.vignetteCanvas.width = this.WIDTH;
        this.vignetteCanvas.height = this.HEIGHT;
        const vigCtx = this.vignetteCanvas.getContext('2d');
        const vig = vigCtx.createRadialGradient(
            this.WIDTH / 2, this.HEIGHT / 2, this.HEIGHT * 0.35,
            this.WIDTH / 2, this.HEIGHT / 2, this.WIDTH * 0.7
        );
        vig.addColorStop(0, 'rgba(0,0,0,0)');
        vig.addColorStop(1, 'rgba(0,0,0,0.3)');
        vigCtx.fillStyle = vig;
        vigCtx.fillRect(0, 0, this.WIDTH, this.HEIGHT);

        this.sound = new SoundEngine();

        // Screen shake (intensity decays over time)
        this.screenShake = 0;
        this.screenShakeDecay = 0.003; // per ms

        // VR state
        this.vrActive = false;
        this.vr = null;

        // === AGI-INSPIRED SYSTEMS ===

        // Horizon line (AGI default: 36 out of 168; scaled to 400px → ~86)
        // Objects above horizon can't walk there (unless ignoring horizon)
        this.horizon = 240; // Default: top of walkable area

        // Priority/depth foreground layers (AGI OBJLIST y-sorting)
        // Rooms can register draw callbacks that render AFTER the player
        // based on Y-position, giving proper depth occlusion
        this.foregroundLayers = []; // { y, draw(ctx, eng) }

        // Walkable area barriers (AGI priority 0/1 control lines)
        // Rooms can define rectangular barriers the player can't cross
        this.barriers = []; // { x, y, w, h }

        // Edge transitions (AGI EGOEDGE / NEWROOM)
        // Rooms can define what happens when ego hits screen edges
        this.edgeTransitions = { left: null, right: null, top: null, bottom: null };

        // Animated NPC objects (AGI ANIOBJ system)
        this.npcs = []; // AnimatedNPC instances

        // Sierra-style text window (drawn on canvas, AGI PRINT/TEXTWIN)
        this.textWindow = null; // { text, x, y, w, h, timer, duration }

        // === AGS-INSPIRED SYSTEMS ===

        // Player idle animation (AGS Character.IdleView / IdleDelay)
        // After standing still for idleDelay ms, a random idle anim plays,
        // then a random pause before the next one. Limited to blink/feettap/eyeroll.
        this.idleTimer = 0;          // ms since player last moved
        this.idleDelay = 4000;       // ms before first idle anim
        this.idleActive = false;     // whether an idle anim is currently playing
        this.idleType = null;        // 'blink' | 'feettap' | 'eyeroll'
        this.idleElapsed = 0;        // ms into the current idle animation
        this.idlePauseTimer = 0;     // ms remaining in pause between idles
        this.idleTypes = ['blink', 'feettap', 'eyeroll'];
        this.idleDurations = { blink: 250, feettap: 1800, eyeroll: 1400 };

        // Dialog tree system (AGS Dialog / DialogTopic / DialogOptions)
        this.dialogs = {};           // registered dialog trees { id: DialogTree }
        this.activeDialog = null;    // currently displayed dialog (or null)

        // Depth scaling (AGS WalkableArea.ScalingNear / ScalingFar)
        // Characters scale smaller when further away (near top of walkable area)
        this.depthScaling = null;    // { nearY, farY, nearScale, farScale } or null to disable

        this.setupInput();
    }

    // ---- Input ----
    getCanvasCoords(event) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.WIDTH / rect.width;
        const scaleY = this.HEIGHT / rect.height;
        return {
            x: (event.clientX - rect.left) * scaleX,
            y: (event.clientY - rect.top) * scaleY
        };
    }

    setupInput() {
        this.canvas.addEventListener('click', (e) => {
            this.sound.init();
            if (this.cutscene) {
                this.skipCutscene();
                return;
            }
            if (this.titleScreen) {
                this.startNewGame();
                return;
            }
            if (this.dead || this.won) return;
            // AGS-inspired: dialog options click handling
            if (this.activeDialog && this.activeDialog.phase === 'options') {
                const coords = this.getCanvasCoords(e);
                const r = this._getDialogBoxRect();
                if (r) {
                    const lines = this.activeDialog.visibleOptions;
                    if (coords.x >= r.boxX && coords.x <= r.boxX + r.boxW &&
                        coords.y >= r.boxY + r.pad && coords.y <= r.boxY + r.pad + lines.length * r.lineH) {
                        const idx = Math.floor((coords.y - r.boxY - r.pad) / r.lineH);
                        if (idx >= 0 && idx < lines.length) {
                            this.sound.uiClick();
                            this.selectDialogOption(idx);
                        }
                    }
                }
                return;
            }
            // AGI-inspired: dismiss text window on click
            if (this.textWindow) { this.dismissTextWindow(); return; }
            const coords = this.getCanvasCoords(e);
            this.handleClick(coords.x, coords.y);
        });

        this.canvas.addEventListener('mousemove', (e) => {
            const coords = this.getCanvasCoords(e);
            this.mouseX = coords.x;
            this.mouseY = coords.y;
        });

        this.actionButtons.forEach(btn => {
            btn.addEventListener('click', () => this.setAction(btn.dataset.action));
        });

        document.addEventListener('keydown', (e) => {
            this.keysDown[e.key] = true;
            this.sound.init();
            if (this.cutscene) {
                if (this.cutscene.onAdvance || e.key === ' ' || e.key === 'Escape' || e.key === 'Enter') {
                    this.skipCutscene();
                }
                return;
            }
            // AGS-inspired: dialog option keyboard selection
            if (this.activeDialog && this.activeDialog.phase === 'options') {
                const lines = this.activeDialog.visibleOptions;
                if (lines && lines.length > 0) {
                    // Number keys 1-9 select options directly (AGS numbered options)
                    if (e.key >= '1' && e.key <= '9') {
                        const idx = parseInt(e.key) - 1;
                        if (idx < lines.length) {
                            this.sound.uiClick();
                            this.selectDialogOption(idx);
                        }
                        return;
                    }
                    // Arrow keys navigate
                    if (e.key === 'ArrowUp') {
                        e.preventDefault();
                        this.activeDialog.selectedIndex = Math.max(0, (this.activeDialog.selectedIndex || 0) - 1);
                        return;
                    }
                    if (e.key === 'ArrowDown') {
                        e.preventDefault();
                        this.activeDialog.selectedIndex = Math.min(lines.length - 1, (this.activeDialog.selectedIndex || 0) + 1);
                        return;
                    }
                    // Enter confirms selection
                    if (e.key === 'Enter' || e.key === ' ') {
                        this.sound.uiClick();
                        this.selectDialogOption(this.activeDialog.selectedIndex || 0);
                        return;
                    }
                    // Escape closes dialog
                    if (e.key === 'Escape') {
                        this.activeDialog = null;
                        this.textWindow = null;
                        return;
                    }
                }
                return;
            }
            // AGI-inspired: dismiss text window with Enter/Space/Escape
            if (this.textWindow && (e.key === ' ' || e.key === 'Enter' || e.key === 'Escape')) {
                this.dismissTextWindow();
                return;
            }
            if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                e.preventDefault();
            }
            if ((e.key === 'r' || e.key === 'R') && (this.dead || this.won)) {
                this.restart();
            }
            if (e.key === 'F5') { e.preventDefault(); this.openSaveModal('save'); }
            if (e.key === 'F7') { e.preventDefault(); this.openSaveModal('load'); }
            if (e.key === 'Escape') this.closeSaveModal();
            if (this.dom.saveModal.classList.contains('open')) return;
            if (e.key === 'l') this.setAction('look');
            if (e.key === 'g') this.setAction('get');
            if (e.key === 'u') this.setAction('use');
            if (e.key === 't') this.setAction('talk');
            if (e.key === 'w') this.setAction('walk');
            if (e.key === 'm' || e.key === 'M') {
                if (!this.dead && !this.won && !this.titleScreen) {
                    const muted = this.sound.toggleMute();
                    if (this.dom.btnMute) this.dom.btnMute.textContent = muted ? 'Sound: OFF' : 'Sound: ON';
                }
            }
        });

        document.addEventListener('keyup', (e) => {
            delete this.keysDown[e.key];
        });

        // Clear stuck keys when window loses focus
        window.addEventListener('blur', () => {
            this.keysDown = {};
        });

        this.dom.btnSave.addEventListener('click', () => this.openSaveModal('save'));
        this.dom.btnLoad.addEventListener('click', () => this.openSaveModal('load'));
        if (this.dom.btnMute) {
            this.dom.btnMute.addEventListener('click', () => {
                this.sound.init();
                const muted = this.sound.toggleMute();
                this.dom.btnMute.textContent = muted ? 'Sound: OFF' : 'Sound: ON';
            });
        }
        this.dom.saveModalClose.addEventListener('click', () => this.closeSaveModal());
        this.dom.saveModal.addEventListener('click', (e) => {
            if (e.target === this.dom.saveModal) this.closeSaveModal();
        });

        // Touch support for canvas
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.sound.init();
            const touch = e.touches[0];
            const coords = this.getCanvasCoords(touch);
            this.mouseX = coords.x;
            this.mouseY = coords.y;
            if (this.cutscene) { this.skipCutscene(); return; }
            if (this.titleScreen) {
                this.startNewGame();
                return;
            }
            if (this.dead || this.won) return;
            // Handle dialog options (same as click handler)
            if (this.activeDialog && this.activeDialog.phase === 'options') {
                const r = this._getDialogBoxRect();
                if (r) {
                    const lines = this.activeDialog.visibleOptions;
                    if (coords.x >= r.boxX && coords.x <= r.boxX + r.boxW &&
                        coords.y >= r.boxY + r.pad && coords.y <= r.boxY + r.pad + lines.length * r.lineH) {
                        const idx = Math.floor((coords.y - r.boxY - r.pad) / r.lineH);
                        if (idx >= 0 && idx < lines.length) {
                            this.sound.uiClick();
                            this.selectDialogOption(idx);
                        }
                    }
                }
                return;
            }
            if (this.textWindow) { this.dismissTextWindow(); return; }
            this.handleClick(coords.x, coords.y);
        }, { passive: false });

        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const coords = this.getCanvasCoords(touch);
            this.mouseX = coords.x;
            this.mouseY = coords.y;
        }, { passive: false });

        // D-pad touch controls
        const dpadBtns = {
            'dpad-up': 'ArrowUp', 'dpad-down': 'ArrowDown',
            'dpad-left': 'ArrowLeft', 'dpad-right': 'ArrowRight'
        };
        for (const [id, key] of Object.entries(dpadBtns)) {
            const btn = document.getElementById(id);
            if (!btn) continue;
            const press = (ev) => { ev.preventDefault(); this.keysDown[key] = true; };
            const release = (ev) => { ev.preventDefault(); delete this.keysDown[key]; };
            btn.addEventListener('touchstart', press, { passive: false });
            btn.addEventListener('touchend', release, { passive: false });
            btn.addEventListener('touchcancel', release, { passive: false });
            btn.addEventListener('mousedown', press);
            btn.addEventListener('mouseup', release);
            btn.addEventListener('mouseleave', release);
        }
    }

    setAction(action) {
        this.currentAction = action;
        this.sound.uiClick();
        this.selectedItem = null;
        this.actionButtons.forEach(b => b.classList.remove('active'));
        const btn = this.actionButtons.find((button) => button.dataset.action === action);
        if (btn) btn.classList.add('active');
        this.updateInventoryUI();
    }

    // ---- Room Management ----
    registerRoom(room) { this.rooms[room.id] = room; }
    registerItem(item) { this.items[item.id] = item; }

    startNewGame() {
        this.titleScreen = false;
        this.sound.gameStart();
        if (this.onGameStart) {
            this.onGameStart();
        } else {
            this.goToRoom('broom_closet', 320, 310);
        }
    }

    goToRoom(roomId, px, py) {
        const room = this.rooms[roomId];
        if (!room) { console.error('Room not found:', roomId); return; }
        this.roomTransition = 1.0; // Start fade-in
        this.exitCooldown = 500; // Prevent immediate re-exit when spawning near an exit
        this.sound.roomTransition();
        this.sound.stopAmbient(); // Stop ambient from previous room
        this.clearRoomState(); // AGI-inspired: clear per-room state
        this.currentRoomId = roomId;
        if (px !== undefined) this.playerX = px;
        if (py !== undefined) this.playerY = py;
        this.playerWalking = false;
        this.playerTargetX = null;
        this.playerTargetY = null;
        this.playerFacing = 'toward';
        this.pendingAction = null;
        if (room.onEnter) room.onEnter(this);
        this.showMessage(room.description);
    }

    // ---- Inventory ----
    addToInventory(itemId) {
        if (!this.inventory.includes(itemId)) {
            this.inventory.push(itemId);
            this.sound.pickup();
            this.updateInventoryUI();
        }
    }

    removeFromInventory(itemId) {
        this.inventory = this.inventory.filter(i => i !== itemId);
        if (this.selectedItem === itemId) this.selectedItem = null;
        this.updateInventoryUI();
    }

    hasItem(id) { return this.inventory.includes(id); }

    updateInventoryUI() {
        const container = this.dom.inventoryItems;
        container.innerHTML = '';
        this.inventory.forEach(itemId => {
            const item = this.items[itemId];
            if (!item) return;
            const el = document.createElement('div');
            el.className = 'inv-item' + (this.selectedItem === itemId ? ' selected' : '');
            el.textContent = item.name;
            el.addEventListener('click', () => this.handleInventoryClick(itemId));
            container.appendChild(el);
        });
    }

    handleInventoryClick(itemId) {
        const item = this.items[itemId];
        if (!item) return;
        if (this.currentAction === 'look') {
            this.showMessage(item.description);
        } else if (this.currentAction === 'use') {
            this.selectedItem = (this.selectedItem === itemId) ? null : itemId;
            if (this.selectedItem) this.showMessage(`Using ${item.name}. Click on something to use it with.`);
            this.updateInventoryUI();
        } else {
            this.setAction('use');
            this.selectedItem = itemId;
            this.showMessage(`Selected ${item.name}. Click somewhere to use it.`);
            this.updateInventoryUI();
        }
    }

    // ---- Score & Flags ----
    addScore(pts) {
        this.score = Math.min(this.score + pts, this.maxScore);
        this.sound.scoreUp();
    }

    setFlag(f, v) { this.flags[f] = (v === undefined) ? true : v; }
    getFlag(f) { return this.flags[f] ?? false; }

    // ---- Messages ----
    showMessage(text) {
        this.message = text;
        const el = this.dom.messageText;
        el.textContent = text;
        el.parentElement.scrollTop = el.parentElement.scrollHeight;
    }

    // ---- Cutscene System ----
    playCutscene(opts) {
        // opts: { duration, draw(ctx, w, h, progress, elapsed), onEnd(), onAdvance(), skippable }
        this.cutscene = {
            elapsed: 0,
            duration: opts.duration || 3000,
            draw: opts.draw,
            onEnd: opts.onEnd || (() => {}),
            onAdvance: opts.onAdvance || null,
            skippable: opts.skippable !== false
        };
        this.playerVisible = false;
    }

    skipCutscene() {
        if (!this.cutscene) return;
        // Phase-advancing cutscenes: click advances instead of skipping
        if (this.cutscene.onAdvance) {
            this.cutscene.onAdvance();
            return;
        }
        if (this.cutscene.skippable) {
            const onEnd = this.cutscene.onEnd;
            this.cutscene = null;
            this.playerVisible = true;
            onEnd();
        }
    }

    /** Trigger screen shake with given intensity (pixels of max offset) */
    shake(intensity) {
        this.screenShake = intensity || 8;
    }

    // ---- Death & Victory ----
    die(msg) {
        this.dead = true;
        this.sound.death();
        this.showMessage(msg + ' \u2014 Press R to restart.');
    }

    victory(msg) {
        this.won = true;
        this.sound.victory();
        this.showMessage(msg);
    }

    restart() {
        this.inventory = [];
        this.score = 0;
        this.flags = {};
        this.dead = false;
        this.won = false;
        this.titleScreen = false;
        this.selectedItem = null;
        this.cutscene = null;
        this.roomTransition = 0;
        this.screenShake = 0;
        this.playerVisible = true;
        this.playerFacing = 'toward';
        this.playerTargetX = null;
        this.playerTargetY = null;
        this.playerWalking = false;
        this.pendingAction = null;
        this.sound.stopAmbient();
        this.setAction('walk');
        this.updateInventoryUI();
        this.goToRoom('broom_closet', 320, 310);
    }

    // ---- Click Handling ----
    handleClick(x, y) {
        const room = this.rooms[this.currentRoomId];
        if (!room) return;
        const hotspot = this.findHotspot(x, y, room);

        if (this.currentAction === 'walk') {
            if (hotspot && hotspot.isExit) {
                this.playerTargetX = hotspot.walkToX !== undefined ? hotspot.walkToX : (hotspot.x + hotspot.w / 2);
                this.playerTargetY = hotspot.walkToY !== undefined ? hotspot.walkToY : null;
                this.playerWalking = true;
                this.pendingAction = () => { if (hotspot.onExit) hotspot.onExit(this); };
            } else if (hotspot && hotspot.walk) {
                hotspot.walk(this);
            } else if (y > 240) {
                this.playerTargetX = Math.max(30, Math.min(610, x));
                this.playerTargetY = Math.max(280, Math.min(370, y));
                this.playerWalking = true;
                this.pendingAction = null;
            } else if (hotspot) {
                this.showMessage(hotspot.description || 'You see nothing noteworthy.');
            }
        } else {
            if (hotspot) {
                this.performAction(hotspot);
            } else {
                this.sound.error();
                this.showMessage("Nothing interesting there.");
            }
        }
    }

    findHotspot(x, y, room) {
        if (!room.hotspots) return null;
        for (let i = room.hotspots.length - 1; i >= 0; i--) {
            const hs = room.hotspots[i];
            if (hs.hidden) continue;
            if (x >= hs.x && x <= hs.x + hs.w && y >= hs.y && y <= hs.y + hs.h) return hs;
        }
        return null;
    }

    performAction(hotspot) {
        const action = this.currentAction;
        if (action === 'use' && this.selectedItem) {
            if (hotspot.useItem) {
                hotspot.useItem(this, this.selectedItem);
            } else {
                this.sound.error();
                this.showMessage("That doesn't seem to work.");
            }
            return;
        }
        const handler = hotspot[action];
        if (handler) {
            handler(this);
        } else {
            const fallback = {
                look: hotspot.description || "Nothing special about that.",
                get: "You can't take that.",
                use: "You can't use that right now.",
                talk: "It doesn't seem very talkative."
            };
            this.sound.error();
            this.showMessage(fallback[action] || "Nothing happens.");
        }
    }

    // === AGI-INSPIRED: PRIORITY/DEPTH SYSTEM (OBJLIST) ===

    /** Register a foreground draw layer (drawn after player if y > player y).
     *  Like AGI's y-sorted object list, lower Y = behind, higher Y = in front. */
    addForegroundLayer(y, drawFn) {
        this.foregroundLayers.push({ y, draw: drawFn });
    }

    clearForegroundLayers() {
        this.foregroundLayers = [];
    }

    // === AGI-INSPIRED: WALKABLE AREA BARRIERS (CONTROL LINES) ===

    /** Add a rectangular barrier the player cannot walk through.
     *  Like AGI priority 0 (unconditional block) control lines. */
    addBarrier(x, y, w, h) {
        this.barriers.push({ x, y, w, h });
    }

    clearBarriers() {
        this.barriers = [];
    }

    /** Check if a position collides with any barrier (AGI CanBHere).
     *  Tests the player's baseline (feet position). */
    collidesBarrier(px, py) {
        // Player baseline is roughly a 14px-wide line at foot level
        const halfW = 7;
        for (const b of this.barriers) {
            if (px + halfW > b.x && px - halfW < b.x + b.w &&
                py >= b.y && py <= b.y + b.h) {
                return true;
            }
        }
        return false;
    }

    // === AGI-INSPIRED: EDGE TRANSITIONS (EGOEDGE/NEWROOM) ===

    /** Set what happens when ego hits a screen edge.
     *  Like AGI's var[EGOEDGE] triggering room changes. */
    setEdgeTransition(edge, callback) {
        // edge: 'left', 'right', 'top', 'bottom'
        this.edgeTransitions[edge] = callback;
    }

    clearEdgeTransitions() {
        this.edgeTransitions = { left: null, right: null, top: null, bottom: null };
    }

    checkEdgeTransitions() {
        if (this.exitCooldown > 0) return;
        const margin = 5;
        if (this.playerX <= 30 + margin && this.edgeTransitions.left) {
            this.edgeTransitions.left(this);
        } else if (this.playerX >= 610 - margin && this.edgeTransitions.right) {
            this.edgeTransitions.right(this);
        } else if (this.playerY <= this.horizon + margin && this.edgeTransitions.top) {
            this.edgeTransitions.top(this);
        } else if (this.playerY >= 370 - margin && this.edgeTransitions.bottom) {
            this.edgeTransitions.bottom(this);
        }
    }

    // === AGI-INSPIRED: SIERRA TEXT WINDOW (PRINT/TEXTWIN) ===

    /** Show a Sierra-style text window on the canvas (like AGI's Print/Display).
     *  Classic blue box with white border and yellow text. */
    showTextWindow(text, opts) {
        opts = opts || {};
        const ctx = this.ctx;
        ctx.font = '13px "Courier New"';

        // Word-wrap text to fit dialogue width
        const maxLineW = opts.maxWidth || 420;
        const words = text.split(' ');
        const lines = [];
        let line = '';
        for (const word of words) {
            const test = line ? line + ' ' + word : word;
            if (ctx.measureText(test).width > maxLineW) {
                if (line) lines.push(line);
                line = word;
            } else {
                line = test;
            }
        }
        if (line) lines.push(line);

        const lineH = 16;
        const pad = 12;
        const boxW = maxLineW + pad * 2 + 16;
        const boxH = lines.length * lineH + pad * 2 + 4;
        const boxX = opts.x !== undefined ? opts.x : Math.round((this.WIDTH - boxW) / 2);
        const boxY = opts.y !== undefined ? opts.y : Math.round((this.HEIGHT - boxH) / 2 - 40);

        this.textWindow = {
            text: text,
            lines: lines,
            x: boxX, y: boxY, w: boxW, h: boxH,
            timer: 0,
            duration: opts.duration || 0, // 0 = click to dismiss
            color: opts.color || '#FFFF55',
            bgColor: opts.bgColor || '#0000AA'
        };
    }

    /** Draw the Sierra-style text window (called during render). */
    drawTextWindow(ctx) {
        if (!this.textWindow) return;
        const tw = this.textWindow;

        // AGI-style box: solid EGA blue background, double border
        ctx.fillStyle = tw.bgColor;
        ctx.fillRect(tw.x, tw.y, tw.w, tw.h);

        // Outer border (white)
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.strokeRect(tw.x + 1, tw.y + 1, tw.w - 2, tw.h - 2);

        // Inner border (lighter blue)
        ctx.strokeStyle = '#5555FF';
        ctx.lineWidth = 1;
        ctx.strokeRect(tw.x + 4, tw.y + 4, tw.w - 8, tw.h - 8);

        // Text
        ctx.font = '13px "Courier New"';
        ctx.fillStyle = tw.color;
        ctx.textAlign = 'left';
        const startY = tw.y + 12 + 10;
        for (let i = 0; i < tw.lines.length; i++) {
            ctx.fillText(tw.lines[i], tw.x + 16, startY + i * 16);
        }

        ctx.textAlign = 'left';
    }

    dismissTextWindow() {
        this.textWindow = null;
        // AGS-inspired: advance dialog state if in an active dialog
        if (this.activeDialog) {
            this._advanceDialog();
        }
    }

    // === AGI-INSPIRED: ANIMATED NPC OBJECTS (ANIOBJ SYSTEM) ===

    /** Register an NPC with AGI-style properties.
     *  Like AGI's ANIOBJ struct with motion, cycling, priority. */
    addNPC(npcDef) {
        const npc = new AnimatedNPC(npcDef, this);
        this.npcs.push(npc);
        return npc;
    }

    removeNPC(id) {
        this.npcs = this.npcs.filter(n => n.id !== id);
    }

    clearNPCs() {
        this.npcs = [];
    }

    getNPC(id) {
        return this.npcs.find(n => n.id === id) || null;
    }

    // === AGI-INSPIRED: ROOM SETUP HELPERS ===

    /** Called by goToRoom — clears per-room AGI state */
    clearRoomState() {
        this.clearForegroundLayers();
        this.clearBarriers();
        this.clearEdgeTransitions();
        this.clearNPCs();
        this.textWindow = null;
        this.activeDialog = null;
        this.depthScaling = null;
        // Reset idle animation so it starts fresh in new room
        this.idleTimer = 0;
        this.idleActive = false;
        this.idleType = null;
        this.idleElapsed = 0;
        this.idlePauseTimer = 0;
    }

    // === AGS-INSPIRED: DEPTH SCALING (WalkableArea.ScalingNear/Far) ===

    /** Set up perspective depth scaling for the current room.
     *  Characters at nearY get nearScale, at farY get farScale, linearly interpolated.
     *  e.g. setDepthScaling(280, 370, 0.7, 1.0) — smaller at top, full size at bottom */
    setDepthScaling(farY, nearY, farScale, nearScale) {
        this.depthScaling = { farY, nearY, farScale, nearScale };
    }

    /** Get the depth scale factor for a given Y position (AGS get_area_scaling). */
    getDepthScale(y) {
        if (!this.depthScaling) return 1.0;
        const ds = this.depthScaling;
        if (y <= ds.farY) return ds.farScale;
        if (y >= ds.nearY) return ds.nearScale;
        const t = (y - ds.farY) / (ds.nearY - ds.farY);
        return ds.farScale + t * (ds.nearScale - ds.farScale);
    }

    // === AGS-INSPIRED: DIALOG TREE SYSTEM (Dialog/DialogTopic) ===

    /** Register a dialog tree.
     *  dialogDef: {
     *    id: string,
     *    topics: [{
     *      id: string,
     *      text: string,                    // NPC greeting / topic intro
     *      options: [{
     *        text: string,                   // option display text
     *        response: string,               // NPC response
     *        action?: function(engine),       // optional callback
     *        nextTopic?: string,              // goto another topic (or null = return to options)
     *        endDialog?: boolean,             // close dialog after this
     *        once?: boolean,                  // disappear after chosen (AGS DFLG_OFFPERM)
     *        condition?: function(engine),    // only show if returns true
     *      }]
     *    }],
     *    startTopic: string                  // id of initial topic
     *  }
     */
    registerDialog(dialogDef) {
        this.dialogs[dialogDef.id] = {
            ...dialogDef,
            chosenOptions: {}  // track which options have been chosen (AGS DFLG_HASBEENCHOSEN)
        };
    }

    /** Start a dialog conversation (AGS Dialog.Start). */
    startDialog(dialogId, topicId) {
        const dlg = this.dialogs[dialogId];
        if (!dlg) return;
        const topic = topicId
            ? dlg.topics.find(t => t.id === topicId)
            : dlg.topics.find(t => t.id === dlg.startTopic);
        if (!topic) return;

        // Show the NPC's greeting as a text window, then show options
        this.activeDialog = {
            dialogId: dialogId,
            topicId: topic.id,
            phase: 'greeting',  // 'greeting' -> 'options' -> 'response' -> back to 'options' or end
            greetingText: topic.text,
            responseText: null,
            pendingAction: null,
            pendingNextTopic: null,
            pendingEnd: false
        };

        if (topic.text) {
            this.showTextWindow(topic.text, { color: '#FFFFFF', duration: 0 });
        } else {
            // No greeting, skip to options
            this.activeDialog.phase = 'options';
            this._showDialogOptions();
        }
    }

    /** Internal: display dialog options as a clickable list (AGS show_dialog_options). */
    _showDialogOptions() {
        const dlg = this.dialogs[this.activeDialog.dialogId];
        const topic = dlg.topics.find(t => t.id === this.activeDialog.topicId);
        if (!topic) { this.activeDialog = null; return; }

        // Filter visible options (respecting once/condition flags)
        const visibleOpts = [];
        for (let i = 0; i < topic.options.length; i++) {
            const opt = topic.options[i];
            // Skip if it was a once-only option and already chosen
            if (opt.once && dlg.chosenOptions[this.activeDialog.topicId + '_' + i]) continue;
            // Skip if condition is specified and not met
            if (opt.condition && !opt.condition(this)) continue;
            visibleOpts.push({ index: i, opt });
        }

        if (visibleOpts.length === 0) {
            // No options available — end dialog
            this.activeDialog = null;
            this.textWindow = null;
            return;
        }

        // Build the dialog options display (AGS-style numbered list in blue box)
        const lines = visibleOpts.map((v, idx) => {
            const chosen = dlg.chosenOptions[this.activeDialog.topicId + '_' + v.index];
            const prefix = (idx + 1) + '. ';
            return { text: prefix + v.opt.text, chosen: !!chosen, optIndex: v.index };
        });

        this.activeDialog.phase = 'options';
        this.activeDialog.visibleOptions = lines;
        this.activeDialog.selectedIndex = 0; // keyboard selection

        // We don't use showTextWindow for this — we render a custom options panel
        this.textWindow = null; // clear any existing text window
    }

    /** Handle dialog option selection (by number key or click). */
    selectDialogOption(displayIndex) {
        if (!this.activeDialog || this.activeDialog.phase !== 'options') return;
        const lines = this.activeDialog.visibleOptions;
        if (displayIndex < 0 || displayIndex >= lines.length) return;

        const dlg = this.dialogs[this.activeDialog.dialogId];
        const topic = dlg.topics.find(t => t.id === this.activeDialog.topicId);
        const optInfo = lines[displayIndex];
        const opt = topic.options[optInfo.optIndex];

        // Mark as chosen (AGS DFLG_HASBEENCHOSEN)
        dlg.chosenOptions[this.activeDialog.topicId + '_' + optInfo.optIndex] = true;

        // Show the player's line first, then NPC response
        if (opt.response) {
            this.activeDialog.phase = 'response';
            this.activeDialog.responseText = opt.response;
            this.activeDialog.pendingAction = opt.action || null;
            this.activeDialog.pendingNextTopic = opt.nextTopic || null;
            this.activeDialog.pendingEnd = !!opt.endDialog;
            this.showTextWindow(opt.response, { color: '#FFFFFF', duration: 0 });
        } else {
            // No response text, execute immediately
            if (opt.action) opt.action(this);
            if (opt.endDialog) {
                this.activeDialog = null;
                this.textWindow = null;
            } else if (opt.nextTopic) {
                this.startDialog(this.activeDialog.dialogId, opt.nextTopic);
            } else {
                this._showDialogOptions();
            }
        }
    }

    /** Called when text window is dismissed during active dialog. */
    _advanceDialog() {
        if (!this.activeDialog) return false;

        if (this.activeDialog.phase === 'greeting') {
            // Greeting dismissed — show options
            this.activeDialog.phase = 'options';
            this._showDialogOptions();
            return true;
        }

        if (this.activeDialog.phase === 'response') {
            // Response dismissed — execute action, then next topic or back to options
            const ad = this.activeDialog;
            if (ad.pendingAction) ad.pendingAction(this);

            if (ad.pendingEnd) {
                this.activeDialog = null;
                this.textWindow = null;
            } else if (ad.pendingNextTopic) {
                this.startDialog(ad.dialogId, ad.pendingNextTopic);
            } else {
                this._showDialogOptions();
            }
            return true;
        }

        return false;
    }

    /** Compute the dialog options box layout (shared by draw + click). */
    _getDialogBoxRect() {
        if (!this.activeDialog || !this.activeDialog.visibleOptions) return null;
        const lines = this.activeDialog.visibleOptions;
        if (lines.length === 0) return null;
        const lineH = 18;
        const pad = 12;
        // Auto-size width based on longest option text
        this.ctx.font = '13px "Courier New"';
        let maxTextW = 200;
        for (const line of lines) {
            const tw = this.ctx.measureText(line.text).width;
            if (tw > maxTextW) maxTextW = tw;
        }
        const boxW = Math.min(560, Math.round(maxTextW) + pad * 2 + 24);
        const boxH = lines.length * lineH + pad * 2 + 4;
        const boxX = Math.round((this.WIDTH - boxW) / 2);
        const boxY = Math.round((this.HEIGHT - boxH) / 2 - 20);
        return { boxX, boxY, boxW, boxH, lineH, pad, startY: boxY + pad + 14 };
    }

    /** Render the dialog options panel (called from render). */
    _drawDialogOptions(ctx) {
        if (!this.activeDialog || this.activeDialog.phase !== 'options') return;
        const lines = this.activeDialog.visibleOptions;
        if (!lines || lines.length === 0) return;
        const r = this._getDialogBoxRect();
        if (!r) return;

        // AGS-style dialog box: dark blue with border
        ctx.fillStyle = '#000088';
        ctx.fillRect(r.boxX, r.boxY, r.boxW, r.boxH);
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.strokeRect(r.boxX + 1, r.boxY + 1, r.boxW - 2, r.boxH - 2);
        ctx.strokeStyle = '#5555FF';
        ctx.lineWidth = 1;
        ctx.strokeRect(r.boxX + 4, r.boxY + 4, r.boxW - 8, r.boxH - 8);

        ctx.font = '13px "Courier New"';
        ctx.textAlign = 'left';
        const sel = this.activeDialog.selectedIndex;

        for (let i = 0; i < lines.length; i++) {
            const isHover = i === sel;
            const isRead = lines[i].chosen;

            // Highlight bar behind selected option
            if (isHover) {
                ctx.fillStyle = 'rgba(80, 80, 200, 0.5)';
                ctx.fillRect(r.boxX + 6, r.startY + i * r.lineH - 13, r.boxW - 12, r.lineH);
            }

            if (isHover) {
                ctx.fillStyle = '#FFFF55';
            } else if (isRead) {
                ctx.fillStyle = '#888899';
            } else {
                ctx.fillStyle = '#FFFFFF';
            }

            ctx.fillText(lines[i].text, r.boxX + r.pad + 8, r.startY + i * r.lineH);
        }

        // Detect mouse hover over dialog options
        if (this.mouseX >= r.boxX && this.mouseX <= r.boxX + r.boxW &&
            this.mouseY >= r.boxY + r.pad && this.mouseY <= r.boxY + r.pad + lines.length * r.lineH) {
            const hoverIdx = Math.floor((this.mouseY - r.boxY - r.pad) / r.lineH);
            if (hoverIdx >= 0 && hoverIdx < lines.length) {
                this.activeDialog.selectedIndex = hoverIdx;
            }
        }
    }

    // ---- Update Loop ----
    update(dt) {
        this.animTimer += dt;

        // Cutscene update
        if (this.cutscene) {
            this.cutscene.elapsed += dt;
            if (this.cutscene.elapsed >= this.cutscene.duration) {
                const onEnd = this.cutscene.onEnd;
                this.cutscene = null;
                this.playerVisible = true;
                onEnd();
            }
            return;
        }

        if (this.dead || this.won || this.titleScreen) return;

        // Decrement exit cooldown unconditionally
        if (this.exitCooldown > 0) this.exitCooldown -= dt;

        // Arrow key walking
        const arrowLeft = this.keysDown['ArrowLeft'];
        const arrowRight = this.keysDown['ArrowRight'];
        const arrowUp = this.keysDown['ArrowUp'];
        const arrowDown = this.keysDown['ArrowDown'];
        if (arrowLeft || arrowRight || arrowUp || arrowDown) {
            // Cancel any click-walk
            this.playerTargetX = null;
            this.playerTargetY = null;
            this.pendingAction = null;
            this.playerWalking = true;
            // Determine facing (AGI-style: 8 directions mapped to 4 loops)
            if (arrowLeft && arrowUp) { this.playerFacing = 'left'; this.playerDir = -1; }
            else if (arrowRight && arrowUp) { this.playerFacing = 'right'; this.playerDir = 1; }
            else if (arrowLeft && arrowDown) { this.playerFacing = 'left'; this.playerDir = -1; }
            else if (arrowRight && arrowDown) { this.playerFacing = 'right'; this.playerDir = 1; }
            else if (arrowLeft) { this.playerFacing = 'left'; this.playerDir = -1; }
            else if (arrowRight) { this.playerFacing = 'right'; this.playerDir = 1; }
            else if (arrowUp) { this.playerFacing = 'away'; }
            else if (arrowDown) { this.playerFacing = 'toward'; }
            // Move X (AGI-style: check barriers before committing)
            // AGS-inspired: scale walk speed by depth for perspective realism
            const depthSpd = this.depthScaling ? this.getDepthScale(this.playerY) : 1;
            const spd = this.playerSpeed * depthSpd;
            if (arrowLeft || arrowRight) {
                const newX = Math.max(30, Math.min(610, this.playerX + spd * this.playerDir));
                if (!this.collidesBarrier(newX, this.playerY)) {
                    this.playerX = newX;
                }
            }
            // Move Y (respect horizon like AGI)
            if (arrowUp || arrowDown) {
                const yDir = arrowUp ? -1 : 1;
                const minY = Math.max(this.horizon, 280);
                const newY = Math.max(minY, Math.min(370, this.playerY + spd * yDir));
                if (!this.collidesBarrier(this.playerX, newY)) {
                    this.playerY = newY;
                }
            }
            this.playerFrameTimer += dt;
            if (this.playerFrameTimer > 140) {
                this.playerFrame = (this.playerFrame + 1) % 4;
                this.playerFrameTimer = 0;
                if (this.playerFrame % 2 === 0) this.sound.footstep();
            }
            // Check if player walked into an exit hotspot at its walk-to position
            const room = this.rooms[this.currentRoomId];
            if (this.exitCooldown <= 0 && room && room.hotspots) {
                for (let i = room.hotspots.length - 1; i >= 0; i--) {
                    const hs = room.hotspots[i];
                    if (!hs.isExit || hs.hidden) continue;
                    const exitX = hs.walkToX !== undefined ? hs.walkToX : (hs.x + hs.w / 2);
                    const exitY = hs.walkToY !== undefined ? hs.walkToY : this.playerY;
                    // Check if player is close enough to the exit walk-to point
                    if (Math.abs(this.playerX - exitX) < 15 && Math.abs(this.playerY - exitY) < 10) {
                        if (hs.onExit) {
                            this.playerWalking = false;
                            hs.onExit(this);
                        }
                        break;
                    }
                }
            }
            // AGI-inspired: check screen edge transitions
            this.checkEdgeTransitions();
        }
        // Click-target walking
        else if (this.playerWalking && (this.playerTargetX !== null || this.playerTargetY !== null)) {
            const dx = this.playerTargetX !== null ? this.playerTargetX - this.playerX : 0;
            const dy = this.playerTargetY !== null ? this.playerTargetY - this.playerY : 0;
            const dist = Math.sqrt(dx * dx + dy * dy);
            // AGS-inspired: scale walk speed by depth for perspective realism
            const depthSpd = this.depthScaling ? this.getDepthScale(this.playerY) : 1;
            const spd = this.playerSpeed * depthSpd;
            if (dist < spd + 1) {
                if (this.playerTargetX !== null) this.playerX = this.playerTargetX;
                if (this.playerTargetY !== null) this.playerY = this.playerTargetY;
                this.playerWalking = false;
                this.playerTargetX = null;
                this.playerTargetY = null;
                this.playerFacing = 'toward';
                if (this.pendingAction) {
                    const act = this.pendingAction;
                    this.pendingAction = null;
                    act();
                }
            } else {
                // Determine primary direction for facing
                if (Math.abs(dx) >= Math.abs(dy)) {
                    this.playerDir = dx > 0 ? 1 : -1;
                    this.playerFacing = dx > 0 ? 'right' : 'left';
                } else {
                    this.playerFacing = dy < 0 ? 'away' : 'toward';
                }
                // Move proportionally
                const mx = (dx / dist) * spd;
                const my = (dy / dist) * spd;
                const newPX = Math.max(30, Math.min(610, this.playerX + mx));
                const minY = Math.max(this.horizon, 280);
                const newPY = Math.max(minY, Math.min(370, this.playerY + my));
                // AGI-inspired: check barriers before committing move
                if (!this.collidesBarrier(newPX, newPY)) {
                    this.playerX = newPX;
                    this.playerY = newPY;
                } else if (!this.collidesBarrier(newPX, this.playerY)) {
                    // Slide along X only (like AGI allowing partial movement)
                    this.playerX = newPX;
                } else if (!this.collidesBarrier(this.playerX, newPY)) {
                    // Slide along Y only
                    this.playerY = newPY;
                } else {
                    // Completely blocked — stop walking (AGI sets BLOCKED flag)
                    this.playerWalking = false;
                    this.playerTargetX = null;
                    this.playerTargetY = null;
                }
                this.playerFrameTimer += dt;
                if (this.playerFrameTimer > 140) {
                    this.playerFrame = (this.playerFrame + 1) % 4;
                    this.playerFrameTimer = 0;
                    if (this.playerFrame % 2 === 0) this.sound.footstep();
                }
            }
        } else {
            // No arrow keys and no click-walk target — player is standing still
            this.playerWalking = false;
            this.playerFrame = 0;

            // AGS-inspired: player idle animation (randomized one-shot with pauses)
            this.idleTimer += dt;
            if (this.idleActive) {
                // Currently playing an idle animation — advance it
                this.idleElapsed += dt;
                if (this.idleElapsed >= this.idleDurations[this.idleType]) {
                    // Animation finished — enter random pause before next
                    this.idleActive = false;
                    this.idleType = null;
                    this.idlePauseTimer = 3000 + Math.random() * 5000; // 3-8s pause
                }
            } else if (this.idleTimer >= this.idleDelay) {
                // Idle delay met, but in pause between anims
                if (this.idlePauseTimer > 0) {
                    this.idlePauseTimer -= dt;
                } else {
                    // Pick a random idle animation and start it
                    this.idleActive = true;
                    this.idleType = this.idleTypes[Math.floor(Math.random() * this.idleTypes.length)];
                    this.idleElapsed = 0;
                }
            }
        }

        // Reset idle timer when player moves (AGS reset_character_idling_time)
        if (this.playerWalking || arrowLeft || arrowRight || arrowUp || arrowDown) {
            this.idleTimer = 0;
            this.idleActive = false;
            this.idleType = null;
            this.idleElapsed = 0;
            this.idlePauseTimer = 0;
        }

        const room = this.rooms[this.currentRoomId];
        if (room && room.onUpdate) room.onUpdate(this, dt);

        // AGI-inspired: update NPCs (motion, cycling, collision)
        for (const npc of this.npcs) {
            npc.update(dt, this);
        }

        // AGI-inspired: dismiss timed text windows
        if (this.textWindow && this.textWindow.duration > 0) {
            this.textWindow.timer += dt;
            if (this.textWindow.timer >= this.textWindow.duration) {
                this.textWindow = null;
            }
        }

        // Room transition fade
        if (this.roomTransition > 0) {
            this.roomTransition = Math.max(0, this.roomTransition - dt * 0.002);
        }

        // Screen shake decay
        if (this.screenShake > 0) {
            this.screenShake = Math.max(0, this.screenShake - dt * this.screenShakeDecay);
        }
    }

    // ---- Render ----
    render() {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.WIDTH, this.HEIGHT);

        // Apply screen shake offset
        if (this.screenShake > 0) {
            const shakeX = (Math.random() - 0.5) * this.screenShake * 2;
            const shakeY = (Math.random() - 0.5) * this.screenShake * 2;
            ctx.save();
            ctx.translate(shakeX, shakeY);
        }

        // Cutscene rendering
        if (this.cutscene) {
            const cs = this.cutscene;
            const progress = Math.min(cs.elapsed / cs.duration, 1);
            cs.draw(ctx, this.WIDTH, this.HEIGHT, progress, cs.elapsed);
            // Skip hint
            if (cs.skippable && cs.elapsed > 500) {
                ctx.fillStyle = 'rgba(255,255,255,0.25)';
                ctx.font = '10px "Courier New"';
                ctx.textAlign = 'right';
                ctx.fillText('Click to skip', this.WIDTH - 10, this.HEIGHT - 8);
                ctx.textAlign = 'left';
            }
            if (this.screenShake > 0) ctx.restore();
            return;
        }

        if (this.titleScreen) {
            this.drawTitleScreen(ctx);
            return;
        }

        const room = this.rooms[this.currentRoomId];
        if (room && room.draw) room.draw(ctx, this.WIDTH, this.HEIGHT, this);

        // === AGI-INSPIRED: Y-SORTED RENDERING (OBJLIST priority system) ===
        // Collect all drawable entities with Y-positions, sort back-to-front
        this._drawables.length = 0;

        // Player
        if (this.playerVisible && !this.dead) {
            this._drawables.push({ y: this.playerY, type: 'player' });
        }

        // NPCs
        for (const npc of this.npcs) {
            if (npc.visible) {
                this._drawables.push({ y: npc.y, type: 'npc', ref: npc });
            }
        }

        // Foreground layers registered by rooms
        for (const layer of this.foregroundLayers) {
            this._drawables.push({ y: layer.y, type: 'layer', ref: layer });
        }

        // Sort by Y (lower Y = behind, drawn first — AGI's MakeObjList)
        this._drawables.sort((a, b) => a.y - b.y);

        // Draw all in sorted order
        for (const d of this._drawables) {
            if (d.type === 'player') this.drawPlayer(ctx);
            else if (d.type === 'npc') d.ref.draw(ctx, this);
            else d.ref.draw(ctx, this);
        }

        this.drawHotspotLabel(ctx, room);

        // Current action indicator (Sierra-style menu bar)
        if (!this.dead && !this.won) {
            // Solid bar across top (EGA black)
            ctx.fillStyle = '#000000';
            ctx.fillRect(0, 0, this.WIDTH, 16);
            ctx.fillStyle = '#555555';
            ctx.fillRect(0, 16, this.WIDTH, 1);
            const actionLabel = this.selectedItem
                ? `Use ${this.items[this.selectedItem]?.name || '?'} on...`
                : this.currentAction.charAt(0).toUpperCase() + this.currentAction.slice(1);
            ctx.font = 'bold 11px "Courier New"';
            ctx.fillStyle = '#FFFFFF';
            ctx.fillText(actionLabel, 8, 12);
            // Score in the bar
            ctx.fillStyle = '#FFFF55';
            ctx.textAlign = 'right';
            ctx.fillText(`Score: ${this.score} / ${this.maxScore}`, this.WIDTH - 8, 12);
            ctx.textAlign = 'left';
        }

        // AGI-inspired: Sierra text window overlay
        this.drawTextWindow(ctx);

        // AGS-inspired: dialog options overlay
        this._drawDialogOptions(ctx);

        if (this.dead) this.drawDeathOverlay(ctx);
        if (this.won) this.drawWinOverlay(ctx);

        // VR HUD: render message + inventory on canvas (visible on panorama)
        if (this.vrActive && !this.dead && !this.won && !this.cutscene && !this.titleScreen) {
            // Message area background
            ctx.fillStyle = 'rgba(0, 0, 100, 0.85)';
            ctx.fillRect(0, 350, this.WIDTH, 50);
            ctx.strokeStyle = '#5555FF';
            ctx.lineWidth = 1;
            ctx.strokeRect(0, 350, this.WIDTH, 50);
            // Message text (word-wrapped)
            ctx.fillStyle = '#FFFFFF';
            ctx.font = '12px "Courier New"';
            ctx.textAlign = 'left';
            const maxW = this.WIDTH - 20;
            const words = (this.message || '').split(' ');
            let line = '', textY = 365;
            for (const w of words) {
                const test = line + w + ' ';
                if (ctx.measureText(test).width > maxW && line) {
                    ctx.fillText(line.trim(), 10, textY);
                    line = w + ' ';
                    textY += 14;
                    if (textY > 395) break;
                } else {
                    line = test;
                }
            }
            if (line.trim() && textY <= 395) ctx.fillText(line.trim(), 10, textY);
            // Inventory strip
            if (this.inventory.length > 0) {
                ctx.fillStyle = 'rgba(0, 0, 60, 0.85)';
                ctx.fillRect(0, 332, this.WIDTH, 18);
                ctx.strokeStyle = '#333388';
                ctx.strokeRect(0, 332, this.WIDTH, 18);
                ctx.fillStyle = '#AAAAAA';
                ctx.font = '10px "Courier New"';
                const invStr = 'INV: ' + this.inventory.map(id => {
                    const nm = this.items[id]?.name || id;
                    return this.selectedItem === id ? '[' + nm + ']' : nm;
                }).join(' | ');
                ctx.fillText(invStr, 10, 345);
            }
        }

        // Room transition fade-in
        if (this.roomTransition > 0) {
            ctx.fillStyle = `rgba(0,0,0,${this.roomTransition})`;
            ctx.fillRect(0, 0, this.WIDTH, this.HEIGHT);
        }

        // Restore screen shake transform before overlays
        if (this.screenShake > 0) ctx.restore();

        // CRT scanline overlay
        ctx.drawImage(this.scanlineCanvas, 0, 0);

        // CRT vignette (pre-rendered)
        ctx.drawImage(this.vignetteCanvas, 0, 0);
    }

    // ---- Title Screen ----
    drawTitleScreen(ctx) {
        const W = this.WIDTH, H = this.HEIGHT;
        const t = this.animTimer;

        // ---- Deep space background ----
        ctx.fillStyle = '#000008';
        ctx.fillRect(0, 0, W, H);

        // Distant star layers (parallax feel via different seed densities)
        let rng = 54321;
        const nx = () => { rng = (rng * 16807) % 2147483647; return (rng & 0xFFFF) / 0xFFFF; };
        // Dim far stars
        for (let i = 0; i < 120; i++) {
            const sx = nx() * W, sy = nx() * H;
            const b = 60 + Math.floor(nx() * 50);
            const tw = Math.sin(t / 800 + i * 0.7) * 15;
            ctx.fillStyle = `rgb(${b + tw},${b + tw},${b + tw + 8})`;
            ctx.fillRect(sx, sy, 1, 1);
        }
        // Brighter near stars
        rng = 98765;
        for (let i = 0; i < 60; i++) {
            const sx = nx() * W, sy = nx() * H;
            const b = 140 + Math.floor(nx() * 115);
            const tw = Math.sin(t / 400 + i * 1.3) * 25;
            ctx.fillStyle = `rgb(${b + tw},${b + tw},${b + tw + 15})`;
            const size = nx() > 0.85 ? 2 : 1;
            ctx.fillRect(sx, sy, size, 1);
        }

        // ---- Nebula glow (purple/blue, Space Quest style) ----
        const nebX = 480 + Math.sin(t / 12000) * 30;
        const nebY = 120 + Math.cos(t / 9000) * 15;
        const ng = ctx.createRadialGradient(nebX, nebY, 5, nebX, nebY, 180);
        ng.addColorStop(0, 'rgba(80,40,140,0.12)');
        ng.addColorStop(0.3, 'rgba(40,30,120,0.07)');
        ng.addColorStop(0.7, 'rgba(20,20,80,0.03)');
        ng.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = ng;
        ctx.fillRect(0, 0, W, H);

        // Second nebula patch (reddish)
        const neb2X = 140 + Math.sin(t / 15000) * 20;
        const neb2Y = 280 + Math.cos(t / 11000) * 10;
        const ng2 = ctx.createRadialGradient(neb2X, neb2Y, 5, neb2X, neb2Y, 100);
        ng2.addColorStop(0, 'rgba(120,40,40,0.06)');
        ng2.addColorStop(0.5, 'rgba(80,20,40,0.03)');
        ng2.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = ng2;
        ctx.fillRect(0, 0, W, H);

        // ---- Large planet (SQ1-style desert world) ----
        const planetX = 500, planetY = 320, planetR = 85;
        // Planet shadow (dark side, crescent effect)
        const pg = ctx.createRadialGradient(planetX - 25, planetY - 20, planetR * 0.1, planetX, planetY, planetR);
        pg.addColorStop(0, '#AA8855');
        pg.addColorStop(0.35, '#997744');
        pg.addColorStop(0.6, '#775533');
        pg.addColorStop(0.85, '#443322');
        pg.addColorStop(1, '#221811');
        ctx.fillStyle = pg;
        ctx.beginPath();
        ctx.arc(planetX, planetY, planetR, 0, Math.PI * 2);
        ctx.fill();
        // Atmospheric glow
        ctx.strokeStyle = 'rgba(170,140,100,0.15)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(planetX, planetY, planetR + 2, 0, Math.PI * 2);
        ctx.stroke();
        ctx.strokeStyle = 'rgba(120,100,80,0.08)';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(planetX, planetY, planetR + 5, 0, Math.PI * 2);
        ctx.stroke();
        // Surface details (craters/terrain bands)
        ctx.save();
        ctx.beginPath();
        ctx.arc(planetX, planetY, planetR, 0, Math.PI * 2);
        ctx.clip();
        ctx.fillStyle = 'rgba(0,0,0,0.08)';
        ctx.beginPath(); ctx.arc(planetX - 30, planetY - 20, 25, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(planetX + 15, planetY + 30, 15, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(planetX - 50, planetY + 25, 10, 0, Math.PI * 2); ctx.fill();
        // Terrain bands
        ctx.fillStyle = 'rgba(100,80,50,0.06)';
        ctx.fillRect(planetX - planetR, planetY - 10, planetR * 2, 8);
        ctx.fillRect(planetX - planetR, planetY + 20, planetR * 2, 5);
        ctx.restore();

        // ---- Small moon ----
        const moonX = 420, moonY = 240, moonR = 12;
        const mg = ctx.createRadialGradient(moonX - 3, moonY - 3, 1, moonX, moonY, moonR);
        mg.addColorStop(0, '#BBBBAA');
        mg.addColorStop(0.7, '#888877');
        mg.addColorStop(1, '#444440');
        ctx.fillStyle = mg;
        ctx.beginPath();
        ctx.arc(moonX, moonY, moonR, 0, Math.PI * 2);
        ctx.fill();

        // ---- ISS Constellation flying across (animated) ----
        const shipCycle = (t % 20000) / 20000; // 20s loop
        const shipX = -80 + shipCycle * (W + 160);
        const shipY = 175 + Math.sin(shipCycle * Math.PI * 2) * 8;
        const shipS = 1.2;
        // Engine trail
        for (let p = 0; p < 10; p++) {
            const trailX = shipX - 45 * shipS - p * 6;
            const trailAlpha = 0.35 - p * 0.035;
            if (trailAlpha > 0) {
                ctx.fillStyle = `rgba(80,200,255,${trailAlpha})`;
                ctx.fillRect(trailX, shipY - 1, 4, 2);
            }
        }
        // Ship hull
        ctx.fillStyle = '#667788';
        ctx.beginPath();
        ctx.moveTo(shipX + 35 * shipS, shipY);
        ctx.lineTo(shipX + 20 * shipS, shipY - 7 * shipS);
        ctx.lineTo(shipX - 25 * shipS, shipY - 8 * shipS);
        ctx.lineTo(shipX - 40 * shipS, shipY - 4 * shipS);
        ctx.lineTo(shipX - 40 * shipS, shipY + 4 * shipS);
        ctx.lineTo(shipX - 25 * shipS, shipY + 8 * shipS);
        ctx.lineTo(shipX + 20 * shipS, shipY + 7 * shipS);
        ctx.closePath();
        ctx.fill();
        // Hull highlight
        ctx.fillStyle = '#7799AA';
        ctx.beginPath();
        ctx.moveTo(shipX + 30 * shipS, shipY - 1);
        ctx.lineTo(shipX + 15 * shipS, shipY - 5 * shipS);
        ctx.lineTo(shipX - 20 * shipS, shipY - 6 * shipS);
        ctx.lineTo(shipX - 20 * shipS, shipY);
        ctx.closePath();
        ctx.fill();
        // Bridge
        ctx.fillStyle = '#55AACC';
        ctx.fillRect(shipX - 2 * shipS, shipY - 10 * shipS, 12 * shipS, 3 * shipS);
        // Windows
        ctx.fillStyle = '#88EEFF';
        for (let wi = 0; wi < 4; wi++) {
            ctx.fillRect(shipX - 10 * shipS + wi * 8 * shipS, shipY - 2, 3, 2);
        }
        // Engine pods
        ctx.fillStyle = '#556677';
        ctx.fillRect(shipX - 42 * shipS, shipY - 6 * shipS, 6 * shipS, 4 * shipS);
        ctx.fillRect(shipX - 42 * shipS, shipY + 2 * shipS, 6 * shipS, 4 * shipS);
        // Engine glow
        const eGlow = 0.5 + Math.sin(t / 80) * 0.3;
        ctx.fillStyle = `rgba(80,200,255,${eGlow})`;
        ctx.fillRect(shipX - 44 * shipS, shipY - 5 * shipS, 3 * shipS, 2 * shipS);
        ctx.fillRect(shipX - 44 * shipS, shipY + 3 * shipS, 3 * shipS, 2 * shipS);

        // ---- Title text (SQ1 style: big, dramatic, spaced out) ----
        ctx.textAlign = 'center';

        // "STAR SWEEPER" main title with shadow
        ctx.font = 'bold 44px "Courier New"';
        // Drop shadow
        ctx.fillStyle = '#0000AA';
        ctx.fillText('STAR SWEEPER', W / 2 + 3, 58);
        // Main text (AGI-style: 2-frame blink between yellow and white)
        const titleBlink = Math.floor(t / 600) % 2;
        ctx.fillStyle = titleBlink ? '#FFFF55' : '#FFFFFF';
        ctx.fillText('STAR SWEEPER', W / 2, 55);

        // Subtitle
        ctx.font = '15px "Courier New"';
        ctx.fillStyle = '#55FFFF';
        ctx.fillText('A   S P A C E   A D V E N T U R E', W / 2, 78);

        // Thin decorative line under subtitle
        ctx.strokeStyle = '#5555FF';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(160, 86);
        ctx.lineTo(480, 86);
        ctx.stroke();

        // ---- SQ1-style scrolling credits area (bottom third) ----
        ctx.font = '12px "Courier New"';
        ctx.fillStyle = '#AAAAAA';
        ctx.fillText('A tribute to Sierra On-Line adventure games', W / 2, H - 90);

        ctx.font = '11px "Courier New"';
        ctx.fillStyle = '#5555FF';
        ctx.fillText('Inspired by Space Quest: The Sarien Encounter (1986)', W / 2, H - 72);

        ctx.font = '10px "Courier New"';
        ctx.fillStyle = '#555555';
        ctx.fillText('Procedural pixel art  \u2022  No sprites  \u2022  Pure JavaScript', W / 2, H - 54);

        // ---- Blinking prompt ----
        const blink = Math.floor(t / 600) % 2;
        if (blink) {
            ctx.font = 'bold 14px "Courier New"';
            ctx.fillStyle = '#FFFF55';
            ctx.fillText('\u25B6  Click or press any key to begin  \u25C0', W / 2, H - 22);
        }

        // Copyright
        ctx.font = '9px "Courier New"';
        ctx.fillStyle = '#555555';
        ctx.fillText('\u00A9 2025-2026', W / 2, H - 6);

        ctx.textAlign = 'left';
    }

    // ---- Player Sprite ----
    drawPlayer(ctx) {
        const x = Math.round(this.playerX);
        const y = Math.round(this.playerY);
        const dir = this.playerDir;
        const facing = this.playerFacing;
        const walking = this.playerWalking;
        const frame = this.playerFrame;
        // Perspective scale: smaller when further away (low Y)
        let s = 1.85 + (y - 280) / 90 * 0.3;
        // AGS-inspired: depth scaling multiplier from walkable area
        if (this.depthScaling) {
            s *= this.getDepthScale(y);
        }

        // Idle animation effects (blink, feettap, eyeroll)
        const idleType = this.idleActive ? this.idleType : null;
        const idleT = this.idleElapsed || 0; // ms into current idle

        // Eye-roll: pupils shift left-then-right-then-center over duration
        let idleHeadOfs = 0;
        if (idleType === 'eyeroll') {
            const p = idleT / this.idleDurations.eyeroll; // 0..1
            if (p < 0.3) idleHeadOfs = Math.round(-1.5 * s);       // look left
            else if (p < 0.6) idleHeadOfs = Math.round(1.5 * s);   // look right
            else idleHeadOfs = 0;                                   // center
        }

        // Foot tap: discrete 2-frame tap — right foot only (impatient)
        let idleFootTap = 0;
        if (idleType === 'feettap') {
            const tapFrame = Math.floor(idleT / 200) % 2; // alternates every 200ms
            idleFootTap = tapFrame === 0 ? 2 * s : 0;
        }

        // Blink: eyes close for the duration (drawn later as overlay)

        // Leg animation — separate left/right so only right foot taps
        let leftLeg = 0, rightLeg = 0;
        if (walking) {
            const walkCycle = Math.sin(frame * Math.PI / 2) * 3 * s;
            leftLeg = walkCycle;
            rightLeg = -walkCycle;
        } else if (idleFootTap > 0) {
            rightLeg = -idleFootTap; // only right foot lifts
        }
        const as = walking ? Math.cos(frame * Math.PI / 2) * 2 * s : 0;

        if (facing === 'toward') {
            // ---- FRONT VIEW (facing camera) ----
            // Legs
            ctx.fillStyle = '#2828AA';
            ctx.fillRect(x - 4 * s, y + 1 * s, 3 * s, 8 * s + leftLeg);
            ctx.fillRect(x + 1 * s, y + 1 * s, 3 * s, 8 * s + rightLeg);
            ctx.fillStyle = '#3535BB';
            ctx.fillRect(x - 3 * s, y + 2 * s, 1 * s, 6 * s + leftLeg);
            ctx.fillRect(x + 2 * s, y + 2 * s, 1 * s, 6 * s + rightLeg);
            // Boots
            ctx.fillStyle = '#222222';
            ctx.fillRect(x - 5 * s, y + 9 * s + leftLeg, 4 * s, 3 * s);
            ctx.fillRect(x, y + 9 * s + rightLeg, 4 * s, 3 * s);
            ctx.fillStyle = '#1a1a1a';
            ctx.fillRect(x - 5 * s, y + 11 * s + leftLeg, 5 * s, 1 * s);
            ctx.fillRect(x, y + 11 * s + rightLeg, 5 * s, 1 * s);
            // Body
            ctx.fillStyle = '#4444DD';
            ctx.fillRect(x - 5 * s, y - 10 * s, 10 * s, 11 * s);
            ctx.fillStyle = '#3838CC';
            ctx.fillRect(x - 5 * s, y - 10 * s, 1 * s, 11 * s);
            ctx.fillRect(x + 4 * s, y - 10 * s, 1 * s, 11 * s);
            ctx.fillStyle = '#5050EE';
            ctx.fillRect(x - 1 * s, y - 6 * s, 2 * s, 4 * s);
            // Gold collar
            ctx.fillStyle = '#CCAA44';
            ctx.fillRect(x - 4 * s, y - 10 * s, 8 * s, 1 * s);
            // V-neck
            ctx.fillStyle = '#EEDDCC';
            ctx.fillRect(x - 1 * s, y - 10 * s, 2 * s, 2 * s);
            // Shoulder patches
            ctx.fillStyle = '#CC2222';
            ctx.fillRect(x - 5 * s, y - 9 * s, 2 * s, 2 * s);
            ctx.fillRect(x + 3 * s, y - 9 * s, 2 * s, 2 * s);
            ctx.fillStyle = '#FFDD44';
            ctx.fillRect(x - 4.5 * s, y - 8.5 * s, 1 * s, 1 * s);
            ctx.fillRect(x + 3.5 * s, y - 8.5 * s, 1 * s, 1 * s);
            // Name tag
            ctx.fillStyle = '#EEEEEE';
            ctx.fillRect(x - 4 * s, y - 6 * s, 4 * s, 2 * s);
            ctx.fillStyle = '#3333AA';
            ctx.font = `${Math.max(4, s * 1.5)}px "Courier New"`;
            ctx.fillText('WILKINS', x - 4 * s, y - 4.5 * s);
            // Chest pocket
            ctx.fillStyle = '#3838CC';
            ctx.fillRect(x + 1 * s, y - 7 * s, 3 * s, 3 * s);
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(x + 3 * s, y - 8 * s, 0.5 * s, 2 * s);
            // Belt
            ctx.fillStyle = '#666666';
            ctx.fillRect(x - 5 * s, y, 10 * s, 2 * s);
            ctx.fillStyle = '#DDCC22';
            ctx.fillRect(x - 1.5 * s, y - 0.5 * s, 3 * s, 2.5 * s);
            // Arms
            ctx.fillStyle = '#4444DD';
            ctx.fillRect(x - 7 * s, y - 8 * s + as, 2 * s, 7 * s);
            ctx.fillRect(x + 5 * s, y - 8 * s - as, 2 * s, 7 * s);
            ctx.fillStyle = '#CCAA44';
            ctx.fillRect(x - 7 * s, y - 2 * s + as, 2 * s, 1 * s);
            ctx.fillRect(x + 5 * s, y - 2 * s - as, 2 * s, 1 * s);
            // Hands
            ctx.fillStyle = '#FFCC88';
            ctx.fillRect(x - 7 * s, y - 1 * s + as, 2 * s, 2.5 * s);
            ctx.fillRect(x + 5 * s, y - 1 * s - as, 2 * s, 2.5 * s);
            // Head
            ctx.fillStyle = '#FFCC88';
            ctx.fillRect(x - 4 * s, y - 18 * s, 8 * s, 8 * s);
            ctx.fillStyle = '#EEBB77';
            ctx.fillRect(x - 4 * s, y - 11 * s, 8 * s, 1 * s);
            // Cheek blush (both sides visible)
            ctx.fillStyle = 'rgba(255,150,120,0.25)';
            ctx.fillRect(x - 4 * s, y - 13 * s, 2 * s, 2 * s);
            ctx.fillRect(x + 2 * s, y - 13 * s, 2 * s, 2 * s);
            // Ears (both visible)
            ctx.fillStyle = '#EEBB77';
            ctx.fillRect(x - 5 * s, y - 15 * s, 1 * s, 3 * s);
            ctx.fillRect(x + 4 * s, y - 15 * s, 1 * s, 3 * s);
            // Hair
            ctx.fillStyle = '#BB7733';
            ctx.fillRect(x - 4 * s, y - 19 * s, 8 * s, 4 * s);
            ctx.fillStyle = '#CC8844';
            ctx.fillRect(x - 2 * s, y - 19 * s, 4 * s, 1 * s);
            // Sideburns (both)
            ctx.fillStyle = '#BB7733';
            ctx.fillRect(x - 5 * s, y - 19 * s, 1 * s, 5 * s);
            ctx.fillRect(x + 4 * s, y - 19 * s, 1 * s, 5 * s);
            ctx.fillStyle = '#AA6622';
            ctx.fillRect(x - 5 * s, y - 14 * s, 1 * s, 1 * s);
            ctx.fillRect(x + 4 * s, y - 14 * s, 1 * s, 1 * s);
            // Eyebrows (both)
            ctx.fillStyle = '#996622';
            ctx.fillRect(x - 3 * s, y - 16 * s, 2 * s, 1 * s);
            ctx.fillRect(x + 1 * s, y - 16 * s, 2 * s, 1 * s);
            // Eyes (both visible!) — the key feature
            // Left eye
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(x - 3 * s, y - 15 * s, 2.5 * s, 2 * s);
            ctx.fillStyle = '#4477CC';
            ctx.fillRect(x - 2.5 * s + idleHeadOfs, y - 15 * s, 1.5 * s, 2 * s);
            ctx.fillStyle = '#111133';
            ctx.fillRect(x - 2 * s + idleHeadOfs, y - 14.5 * s, 1 * s, 1 * s);
            // Right eye
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(x + 0.5 * s, y - 15 * s, 2.5 * s, 2 * s);
            ctx.fillStyle = '#4477CC';
            ctx.fillRect(x + 1 * s + idleHeadOfs, y - 15 * s, 1.5 * s, 2 * s);
            ctx.fillStyle = '#111133';
            ctx.fillRect(x + 1 * s + idleHeadOfs, y - 14.5 * s, 1 * s, 1 * s);
            // Nose (centered, small)
            ctx.fillStyle = '#EEBB77';
            ctx.fillRect(x - 0.5 * s, y - 14 * s, 1 * s, 2 * s);
            // Mouth (centered smile)
            ctx.fillStyle = '#CC8866';
            ctx.fillRect(x - 1.5 * s, y - 12 * s, 3 * s, 1 * s);
            // Smile corners
            ctx.fillRect(x - 2 * s, y - 12.5 * s, 0.5 * s, 0.5 * s);
            ctx.fillRect(x + 1.5 * s, y - 12.5 * s, 0.5 * s, 0.5 * s);

        } else if (facing === 'away') {
            // ---- BACK VIEW (facing away from camera) ----
            // Legs
            ctx.fillStyle = '#2828AA';
            ctx.fillRect(x - 4 * s, y + 1 * s, 3 * s, 8 * s + leftLeg);
            ctx.fillRect(x + 1 * s, y + 1 * s, 3 * s, 8 * s + rightLeg);
            ctx.fillStyle = '#2020AA';
            ctx.fillRect(x - 3 * s, y + 2 * s, 1 * s, 6 * s + leftLeg);
            ctx.fillRect(x + 2 * s, y + 2 * s, 1 * s, 6 * s + rightLeg);
            // Boots
            ctx.fillStyle = '#222222';
            ctx.fillRect(x - 5 * s, y + 9 * s + leftLeg, 4 * s, 3 * s);
            ctx.fillRect(x, y + 9 * s + rightLeg, 4 * s, 3 * s);
            ctx.fillStyle = '#1a1a1a';
            ctx.fillRect(x - 5 * s, y + 11 * s + leftLeg, 5 * s, 1 * s);
            ctx.fillRect(x, y + 11 * s + rightLeg, 5 * s, 1 * s);
            // Body (back of uniform, darker)
            ctx.fillStyle = '#3838CC';
            ctx.fillRect(x - 5 * s, y - 10 * s, 10 * s, 11 * s);
            ctx.fillStyle = '#3030BB';
            ctx.fillRect(x - 5 * s, y - 10 * s, 1 * s, 11 * s);
            ctx.fillRect(x + 4 * s, y - 10 * s, 1 * s, 11 * s);
            // Back seam
            ctx.fillStyle = '#2828AA';
            ctx.fillRect(x - 0.5 * s, y - 9 * s, 1 * s, 10 * s);
            // Gold collar (back)
            ctx.fillStyle = '#CCAA44';
            ctx.fillRect(x - 4 * s, y - 10 * s, 8 * s, 1 * s);
            // Shoulder patches (back view)
            ctx.fillStyle = '#CC2222';
            ctx.fillRect(x - 5 * s, y - 9 * s, 2 * s, 2 * s);
            ctx.fillRect(x + 3 * s, y - 9 * s, 2 * s, 2 * s);
            // Belt
            ctx.fillStyle = '#666666';
            ctx.fillRect(x - 5 * s, y, 10 * s, 2 * s);
            // Arms
            ctx.fillStyle = '#3838CC';
            ctx.fillRect(x - 7 * s, y - 8 * s + as, 2 * s, 7 * s);
            ctx.fillRect(x + 5 * s, y - 8 * s - as, 2 * s, 7 * s);
            ctx.fillStyle = '#CCAA44';
            ctx.fillRect(x - 7 * s, y - 2 * s + as, 2 * s, 1 * s);
            ctx.fillRect(x + 5 * s, y - 2 * s - as, 2 * s, 1 * s);
            // Hands
            ctx.fillStyle = '#FFCC88';
            ctx.fillRect(x - 7 * s, y - 1 * s + as, 2 * s, 2.5 * s);
            ctx.fillRect(x + 5 * s, y - 1 * s - as, 2 * s, 2.5 * s);
            // Head (back of head, all hair)
            ctx.fillStyle = '#BB7733';
            ctx.fillRect(x - 4 * s, y - 19 * s, 8 * s, 9 * s);
            // Hair texture lines
            ctx.fillStyle = '#AA6622';
            ctx.fillRect(x - 3 * s, y - 18 * s, 1 * s, 7 * s);
            ctx.fillRect(x, y - 17 * s, 1 * s, 6 * s);
            ctx.fillRect(x + 2 * s, y - 18 * s, 1 * s, 7 * s);
            // Hair highlight
            ctx.fillStyle = '#CC8844';
            ctx.fillRect(x - 1 * s, y - 19 * s, 3 * s, 1 * s);
            // Ears peeking out
            ctx.fillStyle = '#EEBB77';
            ctx.fillRect(x - 5 * s, y - 15 * s, 1 * s, 2 * s);
            ctx.fillRect(x + 4 * s, y - 15 * s, 1 * s, 2 * s);
            // Neck
            ctx.fillStyle = '#FFCC88';
            ctx.fillRect(x - 2 * s, y - 10.5 * s, 4 * s, 1 * s);

        } else {
            // ---- SIDE VIEW (left or right) ---- [existing sprite]
            // Legs
            ctx.fillStyle = '#2828AA';
            ctx.fillRect(x - 4 * s, y + 1 * s, 3 * s, 8 * s + leftLeg);
            ctx.fillRect(x + 1 * s, y + 1 * s, 3 * s, 8 * s + rightLeg);
            ctx.fillStyle = '#3535BB';
            ctx.fillRect(x - 3 * s, y + 2 * s, 1 * s, 6 * s + leftLeg);
            ctx.fillRect(x + 2 * s, y + 2 * s, 1 * s, 6 * s + rightLeg);
            ctx.fillStyle = '#2020AA';
            ctx.fillRect(x - 4 * s, y + 5 * s + Math.max(leftLeg, 0), 3 * s, 1 * s);
            ctx.fillRect(x + 1 * s, y + 5 * s + Math.max(rightLeg, 0), 3 * s, 1 * s);
            // Boots
            ctx.fillStyle = '#222222';
            ctx.fillRect(x - 5 * s, y + 9 * s + leftLeg, 4 * s, 3 * s);
            ctx.fillRect(x, y + 9 * s + rightLeg, 4 * s, 3 * s);
            ctx.fillStyle = '#1a1a1a';
            ctx.fillRect(x - 5 * s, y + 11 * s + leftLeg, 5 * s, 1 * s);
            ctx.fillRect(x, y + 11 * s + rightLeg, 5 * s, 1 * s);
            ctx.fillStyle = '#444444';
            ctx.fillRect(x - 4 * s, y + 9 * s + leftLeg, 2 * s, 1 * s);
            ctx.fillRect(x + 1 * s, y + 9 * s + rightLeg, 2 * s, 1 * s);
            // Body
            ctx.fillStyle = '#4444DD';
            ctx.fillRect(x - 5 * s, y - 10 * s, 10 * s, 11 * s);
            ctx.fillStyle = '#3838CC';
            ctx.fillRect(x - 5 * s, y - 10 * s, 1 * s, 11 * s);
            ctx.fillRect(x + 4 * s, y - 10 * s, 1 * s, 11 * s);
            ctx.fillStyle = '#5050EE';
            ctx.fillRect(x - 1 * s, y - 8 * s, 2 * s, 6 * s);
            // Collar
            ctx.fillStyle = '#5555EE';
            ctx.fillRect(x - 4 * s, y - 10 * s, 8 * s, 2 * s);
            ctx.fillStyle = '#CCAA44';
            ctx.fillRect(x - 4 * s, y - 10 * s, 8 * s, 1 * s);
            ctx.fillStyle = '#EEDDCC';
            ctx.fillRect(x - 1 * s, y - 10 * s, 2 * s, 2 * s);
            // Patches
            ctx.fillStyle = '#CC2222';
            ctx.fillRect(x - 5 * s, y - 9 * s, 2 * s, 2 * s);
            ctx.fillRect(x + 3 * s, y - 9 * s, 2 * s, 2 * s);
            ctx.fillStyle = '#FFDD44';
            ctx.fillRect(x - 4.5 * s, y - 8.5 * s, 1 * s, 1 * s);
            ctx.fillRect(x + 3.5 * s, y - 8.5 * s, 1 * s, 1 * s);
            // Pocket
            ctx.fillStyle = '#3838CC';
            ctx.fillRect(x + 1 * s, y - 7 * s, 3 * s, 3 * s);
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(x + 3 * s, y - 8 * s, 0.5 * s, 2 * s);
            // Name tag
            ctx.fillStyle = '#EEEEEE';
            ctx.fillRect(x - 4 * s, y - 6 * s, 4 * s, 2 * s);
            ctx.fillStyle = '#3333AA';
            ctx.font = `${Math.max(4, s * 1.5)}px "Courier New"`;
            ctx.fillText('WILKINS', x - 4 * s, y - 4.5 * s);
            // Belt
            ctx.fillStyle = '#666666';
            ctx.fillRect(x - 5 * s, y, 10 * s, 2 * s);
            ctx.fillStyle = '#DDCC22';
            ctx.fillRect(x - 1.5 * s, y - 0.5 * s, 3 * s, 2.5 * s);
            ctx.fillStyle = '#CCBB11';
            ctx.fillRect(x - 1 * s, y, 2 * s, 1.5 * s);
            ctx.fillStyle = '#555555';
            ctx.fillRect(x - 5 * s, y, 2 * s, 3 * s);
            ctx.fillRect(x + 3 * s, y, 2 * s, 3 * s);
            // Arms
            ctx.fillStyle = '#4444DD';
            ctx.fillRect(x - 7 * s, y - 8 * s + as, 2 * s, 7 * s);
            ctx.fillRect(x + 5 * s, y - 8 * s - as, 2 * s, 7 * s);
            ctx.fillStyle = '#CCAA44';
            ctx.fillRect(x - 7 * s, y - 2 * s + as, 2 * s, 1 * s);
            ctx.fillRect(x + 5 * s, y - 2 * s - as, 2 * s, 1 * s);
            ctx.fillStyle = '#3838CC';
            ctx.fillRect(x - 7 * s, y - 5 * s + as, 1 * s, 4 * s);
            ctx.fillRect(x + 6 * s, y - 5 * s - as, 1 * s, 4 * s);
            // Hands
            ctx.fillStyle = '#FFCC88';
            ctx.fillRect(x - 7 * s, y - 1 * s + as, 2 * s, 2.5 * s);
            ctx.fillRect(x + 5 * s, y - 1 * s - as, 2 * s, 2.5 * s);
            ctx.fillStyle = '#EEBB77';
            ctx.fillRect(x - 7 * s, y + 0.5 * s + as, 2 * s, 0.5 * s);
            ctx.fillRect(x + 5 * s, y + 0.5 * s - as, 2 * s, 0.5 * s);
            // Head
            ctx.fillStyle = '#FFCC88';
            ctx.fillRect(x - 4 * s, y - 18 * s, 8 * s, 8 * s);
            ctx.fillStyle = '#EEBB77';
            ctx.fillRect(x - 4 * s, y - 11 * s, 8 * s, 1 * s);
            // Cheek blush
            ctx.fillStyle = 'rgba(255,150,120,0.25)';
            if (dir > 0) {
                ctx.fillRect(x + 2 * s, y - 13 * s, 2 * s, 2 * s);
            } else {
                ctx.fillRect(x - 4 * s, y - 13 * s, 2 * s, 2 * s);
            }
            // Ear
            ctx.fillStyle = '#EEBB77';
            if (dir > 0) {
                ctx.fillRect(x - 5 * s, y - 15 * s, 1 * s, 3 * s);
            } else {
                ctx.fillRect(x + 4 * s, y - 15 * s, 1 * s, 3 * s);
            }
            // Hair
            ctx.fillStyle = '#BB7733';
            ctx.fillRect(x - 4 * s, y - 19 * s, 8 * s, 4 * s);
            ctx.fillStyle = '#CC8844';
            ctx.fillRect(x - 2 * s, y - 19 * s, 3 * s, 1 * s);
            if (dir > 0) {
                ctx.fillStyle = '#BB7733';
                ctx.fillRect(x - 5 * s, y - 19 * s, 2 * s, 6 * s);
                ctx.fillStyle = '#AA6622';
                ctx.fillRect(x - 5 * s, y - 14 * s, 1 * s, 2 * s);
            } else {
                ctx.fillStyle = '#BB7733';
                ctx.fillRect(x + 3 * s, y - 19 * s, 2 * s, 6 * s);
                ctx.fillStyle = '#AA6622';
                ctx.fillRect(x + 4 * s, y - 14 * s, 1 * s, 2 * s);
            }
            ctx.fillStyle = '#AA6622';
            ctx.fillRect(x - 3 * s, y - 18 * s, 6 * s, 1 * s);
            // Eyebrow
            ctx.fillStyle = '#996622';
            if (dir > 0) {
                ctx.fillRect(x, y - 16 * s, 3 * s, 1 * s);
            } else {
                ctx.fillRect(x - 3 * s, y - 16 * s, 3 * s, 1 * s);
            }
            // Eye
            if (dir > 0) {
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(x, y - 15 * s, 3 * s, 2 * s);
                ctx.fillStyle = '#4477CC';
                ctx.fillRect(x + 1 * s, y - 15 * s, 2 * s, 2 * s);
                ctx.fillStyle = '#111133';
                ctx.fillRect(x + 2 * s + idleHeadOfs * 0.5, y - 14.5 * s, 1 * s, 1 * s);
            } else {
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(x - 3 * s, y - 15 * s, 3 * s, 2 * s);
                ctx.fillStyle = '#4477CC';
                ctx.fillRect(x - 3 * s, y - 15 * s, 2 * s, 2 * s);
                ctx.fillStyle = '#111133';
                ctx.fillRect(x - 3 * s + idleHeadOfs * 0.5, y - 14.5 * s, 1 * s, 1 * s);
            }
            // Nose
            ctx.fillStyle = '#EEBB77';
            if (dir > 0) {
                ctx.fillRect(x + 3 * s, y - 14 * s, 1 * s, 2 * s);
            } else {
                ctx.fillRect(x - 4 * s, y - 14 * s, 1 * s, 2 * s);
            }
            // Mouth
            ctx.fillStyle = '#CC8866';
            ctx.fillRect(x - 1 * s, y - 12 * s, 3 * s, 1 * s);
            if (dir > 0) {
                ctx.fillRect(x + 2 * s, y - 12.5 * s, 0.5 * s, 0.5 * s);
            } else {
                ctx.fillRect(x - 1.5 * s, y - 12.5 * s, 0.5 * s, 0.5 * s);
            }
            ctx.fillStyle = '#EEBB77';
            ctx.fillRect(x - 1 * s, y - 11.5 * s, 3 * s, 0.5 * s);
        }

        // Idle eye blink overlay — covers eyes with skin color
        if (idleType === 'blink') {
            ctx.fillStyle = '#FFCC88';
            if (facing === 'toward') {
                ctx.fillRect(x - 3 * s, y - 15 * s, 2.5 * s, 2 * s);
                ctx.fillRect(x + 0.5 * s, y - 15 * s, 2.5 * s, 2 * s);
            } else if (facing !== 'away') {
                if (dir > 0) {
                    ctx.fillRect(x, y - 15 * s, 3 * s, 2 * s);
                } else {
                    ctx.fillRect(x - 3 * s, y - 15 * s, 3 * s, 2 * s);
                }
            }
        }
    }

    // ---- Hotspot Label ----
    drawHotspotLabel(ctx, room) {
        if (!room || !room.hotspots || this.dead || this.won) return;
        for (let i = room.hotspots.length - 1; i >= 0; i--) {
            const hs = room.hotspots[i];
            if (hs.hidden) continue;
            if (this.mouseX >= hs.x && this.mouseX <= hs.x + hs.w &&
                this.mouseY >= hs.y && this.mouseY <= hs.y + hs.h) {
                const name = hs.name || '???';
                ctx.font = '12px "Courier New"';
                const tw = ctx.measureText(name).width;
                const tx = Math.max(4, Math.min(this.mouseX - tw / 2, this.WIDTH - tw - 12));
                const ty = Math.max(24, this.mouseY - 24);
                // Sierra-style label (EGA blue box)
                ctx.fillStyle = '#0000AA';
                ctx.fillRect(tx - 6, ty - 14, tw + 12, 20);
                ctx.strokeStyle = '#FFFFFF';
                ctx.lineWidth = 1;
                ctx.strokeRect(tx - 6, ty - 14, tw + 12, 20);
                ctx.fillStyle = '#FFFF55';
                ctx.fillText(name, tx, ty);
                break;
            }
        }
    }

    // ---- Overlays ----
    drawDeathOverlay(ctx) {
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(0, 0, this.WIDTH, this.HEIGHT);

        // Sierra-style bordered death box (EGA red/blue)
        const bx = 100, by = 110, bw = 440, bh = 170;
        ctx.fillStyle = '#0000AA';
        ctx.fillRect(bx, by, bw, bh);
        ctx.strokeStyle = '#FF5555';
        ctx.lineWidth = 2;
        ctx.strokeRect(bx + 2, by + 2, bw - 4, bh - 4);
        ctx.strokeStyle = '#5555FF';
        ctx.lineWidth = 1;
        ctx.strokeRect(bx + 6, by + 6, bw - 12, bh - 12);

        ctx.textAlign = 'center';
        ctx.font = 'bold 32px "Courier New"';
        ctx.fillStyle = '#FF5555';
        ctx.fillText('YOU DIED', this.WIDTH / 2, by + 50);

        // Wrap the death message
        ctx.font = '13px "Courier New"';
        ctx.fillStyle = '#FFFFFF';
        const deathMsg = this.message.split(' — ')[0].trim();
        const words = deathMsg.split(' ');
        let line = '', lineY = by + 80;
        for (const word of words) {
            const test = line ? line + ' ' + word : word;
            if (ctx.measureText(test).width > bw - 40) {
                ctx.fillText(line, this.WIDTH / 2, lineY);
                line = word;
                lineY += 18;
            } else {
                line = test;
            }
        }
        if (line) ctx.fillText(line, this.WIDTH / 2, lineY);

        // Blinking restart prompt
        if (Math.floor(this.animTimer / 700) % 2) {
            ctx.font = '14px "Courier New"';
            ctx.fillStyle = '#FFFF55';
            ctx.fillText('Press R to try again', this.WIDTH / 2, by + bh - 22);
        }
        ctx.textAlign = 'left';
    }

    drawWinOverlay(ctx) {
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(0, 0, this.WIDTH, this.HEIGHT);

        // Sierra-style bordered victory box (EGA blue/yellow)
        const bx = 80, by = 60, bw = 480, bh = 280;
        ctx.fillStyle = '#0000AA';
        ctx.fillRect(bx, by, bw, bh);
        ctx.strokeStyle = '#FFFF55';
        ctx.lineWidth = 2;
        ctx.strokeRect(bx + 2, by + 2, bw - 4, bh - 4);
        ctx.strokeStyle = '#5555FF';
        ctx.lineWidth = 1;
        ctx.strokeRect(bx + 6, by + 6, bw - 12, bh - 12);

        // Star decorations in corners
        ctx.fillStyle = '#FFFF55';
        ctx.font = '16px "Courier New"';
        ctx.fillText('\u2605', bx + 14, by + 24);
        ctx.fillText('\u2605', bx + bw - 26, by + 24);
        ctx.fillText('\u2605', bx + 14, by + bh - 12);
        ctx.fillText('\u2605', bx + bw - 26, by + bh - 12);

        ctx.textAlign = 'center';
        ctx.font = 'bold 30px "Courier New"';
        const congratsBlink = Math.floor(this.animTimer / 400) % 2;
        ctx.fillStyle = congratsBlink ? '#FFFF55' : '#FFFFFF';
        ctx.fillText('CONGRATULATIONS!', this.WIDTH / 2, by + 55);

        ctx.font = '16px "Courier New"';
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText('You have saved the galaxy!', this.WIDTH / 2, by + 95);

        ctx.font = 'bold 18px "Courier New"';
        ctx.fillStyle = '#55FF55';
        ctx.fillText(`Final Score: ${this.score} / ${this.maxScore}`, this.WIDTH / 2, by + 135);

        // Score rating
        let rating = 'Space Janitor';
        if (this.score >= 250) rating = 'Galactic Legend';
        else if (this.score >= 220) rating = 'Space Hero';
        else if (this.score >= 180) rating = 'Star Captain';
        else if (this.score >= 120) rating = 'Cadet';
        ctx.font = '14px "Courier New"';
        ctx.fillStyle = '#FFFF55';
        ctx.fillText(`Rank: ${rating}`, this.WIDTH / 2, by + 160);

        ctx.font = '14px "Courier New"';
        ctx.fillStyle = '#55FFFF';
        ctx.fillText('From humble janitor to galactic hero...', this.WIDTH / 2, by + 195);
        ctx.fillText('Your story will be told across the stars.', this.WIDTH / 2, by + 215);

        if (Math.floor(this.animTimer / 700) % 2) {
            ctx.font = '14px "Courier New"';
            ctx.fillStyle = '#FFFF55';
            ctx.fillText('Press R to play again', this.WIDTH / 2, by + 260);
        }
        ctx.textAlign = 'left';
    }

    // ---- Save / Load ----
    getSaveKey(slot) { return `starsweeper_save_${slot}`; }

    getSaveData() {
        return {
            version: 1,
            timestamp: Date.now(),
            currentRoomId: this.currentRoomId,
            playerX: this.playerX,
            playerY: this.playerY,
            playerDir: this.playerDir,
            playerFacing: this.playerFacing,
            inventory: [...this.inventory],
            score: this.score,
            flags: JSON.parse(JSON.stringify(this.flags)),
            itemNames: Object.fromEntries(
                Object.entries(this.items).map(([k, v]) => [k, { name: v.name, description: v.description }])
            )
        };
    }

    saveGame(slot) {
        if (this.titleScreen) { this.showMessage('Start the game before saving.'); return; }
        if (this.dead) { this.showMessage('You can\'t save when you\'re dead!'); return; }
        try {
            const data = this.getSaveData();
            localStorage.setItem(this.getSaveKey(slot), JSON.stringify(data));
            this.sound.save();
            this.showMessage(`Game saved to Slot ${slot + 1}.`);
        } catch (err) {
            this.showMessage('Save failed: ' + err.message);
        }
    }

    loadGame(slot) {
        try {
            const raw = localStorage.getItem(this.getSaveKey(slot));
            if (!raw) { this.showMessage('That slot is empty.'); return; }
            const data = JSON.parse(raw);
            this.inventory = data.inventory || [];
            this.score = data.score || 0;
            this.flags = data.flags || {};
            this.dead = false;
            this.won = false;
            this.titleScreen = false;
            this.selectedItem = null;
            this.cutscene = null;
            this.roomTransition = 0;
            this.playerVisible = true;
            this.playerWalking = false;
            this.playerTargetX = null;
            this.playerTargetY = null;
            this.pendingAction = null;
            this.playerDir = data.playerDir || 1;
            this.playerFacing = data.playerFacing || 'toward';
            this.screenShake = 0;
            // Restore modified item names/descriptions
            if (data.itemNames) {
                for (const [id, info] of Object.entries(data.itemNames)) {
                    if (this.items[id]) {
                        this.items[id].name = info.name;
                        this.items[id].description = info.description;
                    }
                }
            }
            this.setAction('walk');
            this.updateInventoryUI();
            this.goToRoom(data.currentRoomId, data.playerX, data.playerY);
            this.sound.save();
            this.showMessage(`Game loaded from Slot ${slot + 1}.`);
        } catch (err) {
            this.showMessage('Load failed: ' + err.message);
        }
    }

    deleteSave(slot) {
        try { localStorage.removeItem(this.getSaveKey(slot)); } catch { /* storage unavailable */ }
    }

    getSlotInfo(slot) {
        try {
            const raw = localStorage.getItem(this.getSaveKey(slot));
            if (!raw) return null;
            const data = JSON.parse(raw);
            const room = this.rooms[data.currentRoomId];
            const date = new Date(data.timestamp);
            return {
                room: room ? room.name : data.currentRoomId,
                score: data.score || 0,
                date: date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
        } catch { return null; }
    }

    openSaveModal(mode) {
        const modal = this.dom.saveModal;
        this.dom.modalTitle.textContent = mode === 'save' ? 'Save Game' : 'Load Game';
        const list = this.dom.slotList;
        list.innerHTML = '';
        for (let i = 0; i < 5; i++) {
            const info = this.getSlotInfo(i);
            const row = document.createElement('div');
            row.className = 'slot-row';
            const infoDiv = document.createElement('div');
            infoDiv.className = 'slot-info';
            if (info) {
                infoDiv.innerHTML = `<div class="slot-name">Slot ${i + 1}: ${info.room}</div><div class="slot-detail">Score: ${info.score}/${this.maxScore} &bull; ${info.date}</div>`;
            } else {
                infoDiv.innerHTML = `<div class="slot-name">Slot ${i + 1}</div><div class="slot-detail">— Empty —</div>`;
            }
            row.appendChild(infoDiv);
            const actionBtn = document.createElement('button');
            actionBtn.className = 'slot-action';
            actionBtn.textContent = mode === 'save' ? 'Save' : 'Load';
            if (mode === 'load' && !info) actionBtn.style.opacity = '0.3';
            actionBtn.addEventListener('click', () => {
                if (mode === 'save') {
                    this.saveGame(i);
                } else {
                    if (!info) return;
                    this.loadGame(i);
                }
                this.closeSaveModal();
            });
            row.appendChild(actionBtn);
            if (info) {
                const delBtn = document.createElement('button');
                delBtn.className = 'slot-action delete';
                delBtn.textContent = 'X';
                delBtn.title = 'Delete save';
                delBtn.addEventListener('click', () => {
                    this.deleteSave(i);
                    this.openSaveModal(mode);
                });
                row.appendChild(delBtn);
            }
            list.appendChild(row);
        }
        modal.classList.add('open');
    }

    closeSaveModal() {
        this.dom.saveModal.classList.remove('open');
    }

    // ---- VR Setup ----
    initVR() {
        if (typeof VRSystem !== 'undefined') {
            this.vr = new VRSystem(this);
        }
    }

    // ---- Game Loop ----
    start() {
        // Initialize VR support if available
        this.initVR();

        const loop = (timestamp) => {
            // When VR is active, the XR frame loop handles update+render
            if (!this.vrActive) {
                const dt = Math.min(timestamp - this.lastTime, 100);
                this.lastTime = timestamp;
                this.update(dt);
                this.render();
            }
            requestAnimationFrame(loop);
        };
        requestAnimationFrame(loop);
    }
}


// ============================================================
// AGI-INSPIRED: ANIMATED NPC CLASS (ANIOBJ)
// Based on Sierra's original AGI ANIOBJ structure from ANIOBJ.H
// Supports motion types: NORMAL, WANDER, FOLLOW, MOVETO
// Supports cycling types: NORMAL, ENDLOOP, REVERSE, STOPPED
// ============================================================

class AnimatedNPC {
    /**
     * Create an animated NPC, modeled after AGI's ANIOBJ struct.
     * @param {Object} def - NPC definition
     * @param {string} def.id - Unique identifier
     * @param {number} def.x - Initial X position
     * @param {number} def.y - Initial Y position (baseline, like AGI)
     * @param {Function} def.draw - Draw function: draw(ctx, eng, npc)
     * @param {string} [def.motionType] - 'normal','wander','follow','moveto'
     * @param {number} [def.stepSize] - Pixels per step (AGI stepsize)
     * @param {number} [def.stepTime] - Ms between steps (AGI movefreq scaled)
     * @param {number} [def.cycleTime] - Ms between animation frames (AGI cyclfreq)
     * @param {number} [def.celCount] - Number of animation frames
     * @param {boolean} [def.fixedPriority] - If true, ignores y-sorting
     * @param {number} [def.priority] - Fixed priority value
     * @param {boolean} [def.ignoreBarriers] - If true, walks through barriers
     * @param {boolean} [def.ignoreHorizon] - If true, can go above horizon
     * @param {Object} [def.motionParams] - Parameters for motion type
     */
    constructor(def, engine) {
        this.id = def.id;
        this.x = def.x || 0;
        this.y = def.y || 310;
        this.drawFn = def.draw;
        this.visible = def.visible !== false;

        // AGI motion system
        this.motionType = def.motionType || 'normal';
        this.stepSize = def.stepSize || 2;
        this.stepTime = def.stepTime || 200;  // ms between moves
        this.stepCounter = 0;
        this.direction = 0; // 0=stopped, 1-8 like AGI (1=N, 2=NE, 3=E, etc.)
        this.blocked = false;
        this.stopped = false;
        this.ignoreBarriers = def.ignoreBarriers || false;
        this.ignoreHorizon = def.ignoreHorizon || false;
        this.fixedPriority = def.fixedPriority || false;
        this.priority = def.priority || 0;

        // AGI facing (auto-select loop based on direction)
        this.facing = def.facing || 'toward'; // 'left','right','toward','away'

        // AGI animation cycling
        this.cycleTime = def.cycleTime || 250;  // ms between frames
        this.cycleCounter = 0;
        this.cel = 0;                           // current frame
        this.celCount = def.celCount || 1;      // total frames
        this.cycleType = def.cycleType || 'normal'; // 'normal','endloop','reverse','stopped'

        // Previous position (for collision/stopped detection)
        this.prevX = this.x;
        this.prevY = this.y;

        // Motion parameters (like AGI parms[])
        this.motionParams = def.motionParams || {};

        // Wander state
        this._wanderDist = 0;
        this._wanderDir = 0;

        // Follow/moveto state
        this._moveTargetX = this.motionParams.targetX || 0;
        this._moveTargetY = this.motionParams.targetY || 0;
        this._onArrival = this.motionParams.onArrival || null;

        // Callback for when NPC is clicked
        this.onClick = def.onClick || null;
    }

    // AGI direction deltas (0=none, 1=N, 2=NE, 3=E, 4=SE, 5=S, 6=SW, 7=W, 8=NW)
    static xs = [0, 0, 1, 1, 1, 0, -1, -1, -1];
    static ys = [0, -1, -1, 0, 1, 1, 1, 0, -1];

    // AGI-style loop selection tables
    static twoLoop  = [4, 4, 0, 0, 0, 4, 1, 1, 1]; // S,S,R,R,R,S,L,L,L
    static fourLoop = [4, 3, 0, 0, 0, 2, 1, 1, 1]; // S,B,R,R,R,F,L,L,L

    /** AGI-style: compute direction from current position to target. */
    static moveDirection(ox, oy, nx, ny, delta) {
        const newdir = [[8, 1, 2], [7, 0, 3], [6, 5, 4]];
        const idx = (d, threshold) => d <= -threshold ? 0 : d >= threshold ? 2 : 1;
        return newdir[idx(ny - oy, delta)][idx(nx - ox, delta)];
    }

    /** Update the NPC's direction based on motion type (AGI ObjDir). */
    updateDirection(engine) {
        switch (this.motionType) {
            case 'wander':
                this._wander();
                break;
            case 'follow':
                this._follow(engine);
                break;
            case 'moveto':
                this._moveTo(engine);
                break;
        }
    }

    /** AGI-style wander: pick random direction and distance. */
    _wander() {
        if (this._wanderDist <= 0 || this.stopped) {
            this.direction = Math.floor(Math.random() * 9); // 0-8
            this._wanderDist = Math.floor(Math.random() * 30) + 5;
        }
        this._wanderDist -= this.stepSize;
    }

    /** AGI-style follow: move toward ego. */
    _follow(engine) {
        const endDist = this.motionParams.followDist || 20;
        const dir = AnimatedNPC.moveDirection(
            this.x, this.y,
            engine.playerX, engine.playerY,
            endDist
        );
        if (dir === 0) {
            // Arrived
            this.direction = 0;
            this.motionType = 'normal';
            if (this._onArrival) this._onArrival(engine, this);
            return;
        }
        if (this.stopped) {
            // Blocked — try random direction (AGI follow behavior)
            this.direction = Math.floor(Math.random() * 8) + 1;
            this._wanderDist = Math.floor(Math.random() * 15) + 5;
        } else {
            this.direction = dir;
        }
    }

    /** AGI-style moveto: move toward target coordinates. */
    _moveTo(engine) {
        this.direction = AnimatedNPC.moveDirection(
            this.x, this.y,
            this._moveTargetX, this._moveTargetY,
            this.stepSize
        );
        if (this.direction === 0) {
            this.motionType = 'normal';
            if (this._onArrival) this._onArrival(engine, this);
        }
    }

    /** Start a moveTo motion (like AGI MoveObj). */
    startMoveTo(x, y, onArrival) {
        this.motionType = 'moveto';
        this._moveTargetX = x;
        this._moveTargetY = y;
        this._onArrival = onArrival || null;
    }

    /** Start following ego (like AGI FollowEgo). */
    startFollow(dist, onArrival) {
        this.motionType = 'follow';
        this.motionParams.followDist = dist || 20;
        this._onArrival = onArrival || null;
    }

    /** Start wandering (like AGI StartWander). */
    startWander() {
        this.motionType = 'wander';
        this._wanderDist = 0;
    }

    /** Stop all motion (like AGI StopMotion). */
    stopMotion() {
        this.motionType = 'normal';
        this.direction = 0;
    }

    /** Update facing based on current direction (AGI loop selection). */
    updateFacing() {
        if (this.direction === 0) return;
        const facings = ['toward', 'away', 'right', 'right', 'right', 'toward', 'left', 'left', 'left'];
        this.facing = facings[this.direction];
    }

    /** Advance animation cel (AGI AdvanceCel). */
    advanceCel() {
        const last = this.celCount - 1;
        switch (this.cycleType) {
            case 'normal':
                this.cel = (this.cel + 1) > last ? 0 : this.cel + 1;
                break;
            case 'endloop':
                if (this.cel >= last) {
                    this.cycleType = 'stopped';
                    this.direction = 0;
                } else {
                    this.cel++;
                }
                break;
            case 'reverse':
                this.cel = this.cel > 0 ? this.cel - 1 : last;
                break;
            case 'stopped':
                break;
        }
    }

    /** Main update — called each frame (AGI Animate cycle). */
    update(dt, engine) {
        if (!this.visible) return;

        // Step timing (AGI moveclk)
        this.stepCounter += dt;
        if (this.stepCounter >= this.stepTime) {
            this.stepCounter = 0;

            // Save previous position for stopped detection
            this.prevX = this.x;
            this.prevY = this.y;

            // Update direction based on motion type
            this.updateDirection(engine);

            // Move in current direction
            if (this.direction > 0 && this.direction <= 8) {
                const nx = this.x + AnimatedNPC.xs[this.direction] * this.stepSize;
                const ny = this.y + AnimatedNPC.ys[this.direction] * this.stepSize;

                // Border check (AGI MOVEOBJS)
                const clampedX = Math.max(30, Math.min(610, nx));
                const horizon = this.ignoreHorizon ? 0 : engine.horizon;
                const clampedY = Math.max(Math.max(horizon, 280), Math.min(370, ny));

                // Barrier check (AGI CanBHere)
                if (this.ignoreBarriers || !engine.collidesBarrier(clampedX, clampedY)) {
                    this.x = clampedX;
                    this.y = clampedY;
                }
            }

            // Stopped detection (AGI STOPPED flag)
            this.stopped = (this.x === this.prevX && this.y === this.prevY);

            // Update facing from direction
            this.updateFacing();
        }

        // Animation cycling (AGI cycleclk)
        if (this.cycleType !== 'stopped' && this.celCount > 1) {
            this.cycleCounter += dt;
            if (this.cycleCounter >= this.cycleTime) {
                this.cycleCounter = 0;
                this.advanceCel();
            }
        }
    }

    /** Draw the NPC — delegates to the custom draw function. */
    draw(ctx, engine) {
        if (!this.visible || !this.drawFn) return;
        this.drawFn(ctx, engine, this);
    }
}
