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

        // CRT scanline overlay (pre-rendered for performance)
        this.scanlineCanvas = document.createElement('canvas');
        this.scanlineCanvas.width = this.WIDTH;
        this.scanlineCanvas.height = this.HEIGHT;
        const slCtx = this.scanlineCanvas.getContext('2d');
        slCtx.fillStyle = 'rgba(0,0,0,0.12)';
        for (let y = 0; y < this.HEIGHT; y += 2) {
            slCtx.fillRect(0, y, this.WIDTH, 1);
        }

        this.sound = new SoundEngine();

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
                this.titleScreen = false;
                this.sound.gameStart();
                this.goToRoom('broom_closet', 320, 310);
                return;
            }
            if (this.dead || this.won) return;
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
                if (e.key === ' ' || e.key === 'Escape' || e.key === 'Enter') {
                    this.skipCutscene();
                }
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
            const rect = this.canvas.getBoundingClientRect();
            const scaleX = this.WIDTH / rect.width;
            const scaleY = this.HEIGHT / rect.height;
            const cx = (touch.clientX - rect.left) * scaleX;
            const cy = (touch.clientY - rect.top) * scaleY;
            this.mouseX = cx;
            this.mouseY = cy;
            if (this.cutscene) { this.skipCutscene(); return; }
            if (this.titleScreen) {
                this.titleScreen = false;
                this.sound.gameStart();
                this.goToRoom('broom_closet', 320, 310);
                return;
            }
            if (this.dead || this.won) return;
            this.handleClick(cx, cy);
        }, { passive: false });

        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const rect = this.canvas.getBoundingClientRect();
            const scaleX = this.WIDTH / rect.width;
            const scaleY = this.HEIGHT / rect.height;
            this.mouseX = (touch.clientX - rect.left) * scaleX;
            this.mouseY = (touch.clientY - rect.top) * scaleY;
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

    goToRoom(roomId, px, py) {
        const room = this.rooms[roomId];
        if (!room) { console.error('Room not found:', roomId); return; }
        this.roomTransition = 1.0; // Start fade-in
        this.exitCooldown = 500; // Prevent immediate re-exit when spawning near an exit
        this.sound.roomTransition();
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
    getFlag(f) { return this.flags[f] || false; }

    // ---- Messages ----
    showMessage(text) {
        this.message = text;
        const el = this.dom.messageText;
        el.textContent = text;
        el.parentElement.scrollTop = el.parentElement.scrollHeight;
    }

    // ---- Cutscene System ----
    playCutscene(opts) {
        // opts: { duration, draw(ctx, w, h, progress, elapsed), onEnd() }
        this.cutscene = {
            elapsed: 0,
            duration: opts.duration || 3000,
            draw: opts.draw,
            onEnd: opts.onEnd || (() => {}),
            skippable: opts.skippable !== false
        };
        this.playerVisible = false;
    }

    skipCutscene() {
        if (this.cutscene && this.cutscene.skippable) {
            const onEnd = this.cutscene.onEnd;
            this.cutscene = null;
            this.playerVisible = true;
            onEnd();
        }
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
        this.playerVisible = true;
        this.playerFacing = 'toward';
        this.playerTargetY = null;
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
            // Determine facing
            if (arrowLeft) { this.playerFacing = 'left'; this.playerDir = -1; }
            else if (arrowRight) { this.playerFacing = 'right'; this.playerDir = 1; }
            else if (arrowUp) { this.playerFacing = 'away'; }
            else if (arrowDown) { this.playerFacing = 'toward'; }
            // Move X
            if (arrowLeft || arrowRight) {
                const newX = Math.max(30, Math.min(610, this.playerX + this.playerSpeed * this.playerDir));
                if (newX !== this.playerX) this.playerX = newX;
            }
            // Move Y
            if (arrowUp || arrowDown) {
                const yDir = arrowUp ? -1 : 1;
                const newY = Math.max(280, Math.min(370, this.playerY + this.playerSpeed * yDir));
                if (newY !== this.playerY) this.playerY = newY;
            }
            this.playerFrameTimer += dt;
            if (this.playerFrameTimer > 140) {
                this.playerFrame = (this.playerFrame + 1) % 4;
                this.playerFrameTimer = 0;
                if (this.playerFrame % 2 === 0) this.sound.footstep();
            }
            // Check if player walked into an exit hotspot at its walk-to position
            if (this.exitCooldown > 0) this.exitCooldown -= dt;
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
        }
        // Click-target walking
        else if (this.playerWalking && (this.playerTargetX !== null || this.playerTargetY !== null)) {
            const dx = this.playerTargetX !== null ? this.playerTargetX - this.playerX : 0;
            const dy = this.playerTargetY !== null ? this.playerTargetY - this.playerY : 0;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < this.playerSpeed + 1) {
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
                const mx = (dx / dist) * this.playerSpeed;
                const my = (dy / dist) * this.playerSpeed;
                this.playerX += mx;
                this.playerY += my;
                // Clamp
                this.playerX = Math.max(30, Math.min(610, this.playerX));
                this.playerY = Math.max(280, Math.min(370, this.playerY));
                this.playerFrameTimer += dt;
                if (this.playerFrameTimer > 140) {
                    this.playerFrame = (this.playerFrame + 1) % 4;
                    this.playerFrameTimer = 0;
                    if (this.playerFrame % 2 === 0) this.sound.footstep();
                }
            }
        } else {
            this.playerFrame = 0;
        }

        const room = this.rooms[this.currentRoomId];
        if (room && room.onUpdate) room.onUpdate(this, dt);

        // Room transition fade
        if (this.roomTransition > 0) {
            this.roomTransition = Math.max(0, this.roomTransition - dt * 0.002);
        }
    }

    // ---- Render ----
    render() {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.WIDTH, this.HEIGHT);

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
            return;
        }

        if (this.titleScreen) {
            this.drawTitleScreen(ctx);
            return;
        }

        const room = this.rooms[this.currentRoomId];
        if (room && room.draw) room.draw(ctx, this.WIDTH, this.HEIGHT, this);
        if (this.playerVisible && !this.dead) this.drawPlayer(ctx);
        this.drawHotspotLabel(ctx, room);

        // Current action indicator (Sierra-style menu bar)
        if (!this.dead && !this.won) {
            // Solid bar across top
            ctx.fillStyle = '#14142c';
            ctx.fillRect(0, 0, this.WIDTH, 16);
            ctx.fillStyle = '#334';
            ctx.fillRect(0, 16, this.WIDTH, 1);
            const actionLabel = this.selectedItem
                ? `Use ${this.items[this.selectedItem]?.name || '?'} on...`
                : this.currentAction.charAt(0).toUpperCase() + this.currentAction.slice(1);
            ctx.font = 'bold 11px "Courier New"';
            ctx.fillStyle = '#ddeeff';
            ctx.fillText(actionLabel, 8, 12);
            // Score in the bar
            ctx.fillStyle = '#ffdd55';
            ctx.textAlign = 'right';
            ctx.fillText(`Score: ${this.score} / ${this.maxScore}`, this.WIDTH - 8, 12);
            ctx.textAlign = 'left';
        }

        if (this.dead) this.drawDeathOverlay(ctx);
        if (this.won) this.drawWinOverlay(ctx);

        // Room transition fade-in
        if (this.roomTransition > 0) {
            ctx.fillStyle = `rgba(0,0,0,${this.roomTransition})`;
            ctx.fillRect(0, 0, this.WIDTH, this.HEIGHT);
        }

        // CRT scanline overlay
        ctx.drawImage(this.scanlineCanvas, 0, 0);

        // CRT vignette (darker edges)
        const vig = ctx.createRadialGradient(
            this.WIDTH / 2, this.HEIGHT / 2, this.HEIGHT * 0.35,
            this.WIDTH / 2, this.HEIGHT / 2, this.WIDTH * 0.7
        );
        vig.addColorStop(0, 'rgba(0,0,0,0)');
        vig.addColorStop(1, 'rgba(0,0,0,0.3)');
        ctx.fillStyle = vig;
        ctx.fillRect(0, 0, this.WIDTH, this.HEIGHT);
    }

    // ---- Title Screen ----
    drawTitleScreen(ctx) {
        // Starfield (EGA-style black background)
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, this.WIDTH, this.HEIGHT);
        let rng = 99;
        for (let i = 0; i < 150; i++) {
            rng = (rng * 16807) % 2147483647;
            const sx = (rng % this.WIDTH);
            rng = (rng * 16807) % 2147483647;
            const sy = (rng % this.HEIGHT);
            rng = (rng * 16807) % 2147483647;
            const bright = 120 + (rng % 135);
            const twinkle = Math.sin(this.animTimer / 300 + i) * 30;
            ctx.fillStyle = `rgb(${bright + twinkle},${bright + twinkle},${bright + twinkle + 20})`;
            ctx.fillRect(sx, sy, (rng % 3 === 0) ? 2 : 1, 1);
        }

        // Slow-moving nebula background
        const nebulaX = 400 + Math.sin(this.animTimer / 8000) * 50;
        const nebulaY = 80 + Math.cos(this.animTimer / 6000) * 20;
        const ng = ctx.createRadialGradient(nebulaX, nebulaY, 10, nebulaX, nebulaY, 120);
        ng.addColorStop(0, 'rgba(85,85,255,0.08)');
        ng.addColorStop(0.5, 'rgba(85,85,255,0.04)');
        ng.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = ng;
        ctx.fillRect(0, 0, this.WIDTH, this.HEIGHT);

        // Sierra-style bordered title box
        const bx = 80, by = 30, bw = 480, bh = 250;
        ctx.fillStyle = '#0000AA';
        ctx.fillRect(bx, by, bw, bh);
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.strokeRect(bx + 2, by + 2, bw - 4, bh - 4);
        ctx.strokeStyle = '#5555FF';
        ctx.lineWidth = 1;
        ctx.strokeRect(bx + 6, by + 6, bw - 12, bh - 12);

        // Title text
        ctx.textAlign = 'center';
        ctx.font = 'bold 36px "Courier New"';
        const glow = Math.sin(this.animTimer / 500) * 0.3 + 0.7;
        ctx.fillStyle = `rgba(255,255,85,${glow})`;
        ctx.fillText('STAR SWEEPER', this.WIDTH / 2, by + 52);

        ctx.font = '16px "Courier New"';
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText('A   S P A C E   A D V E N T U R E', this.WIDTH / 2, by + 80);

        // Decorative separator
        ctx.strokeStyle = '#5555FF';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(bx + 30, by + 92); ctx.lineTo(bx + bw - 30, by + 92);
        ctx.stroke();

        // Ship silhouette
        ctx.fillStyle = '#5555FF';
        ctx.beginPath();
        ctx.moveTo(230, by + 128);
        ctx.lineTo(260, by + 118);
        ctx.lineTo(280, by + 116);
        ctx.lineTo(360, by + 116);
        ctx.lineTo(380, by + 118);
        ctx.lineTo(410, by + 128);
        ctx.lineTo(395, by + 136);
        ctx.lineTo(370, by + 133);
        ctx.lineTo(270, by + 133);
        ctx.lineTo(245, by + 136);
        ctx.closePath();
        ctx.fill();
        // Bridge dome
        ctx.fillRect(308, by + 111, 24, 5);
        // Engine glow
        ctx.fillStyle = `rgba(85,255,255,${0.4 + Math.sin(this.animTimer / 200) * 0.3})`;
        ctx.fillRect(226, by + 130, 5, 3);
        ctx.fillRect(411, by + 130, 5, 3);
        // Windows
        ctx.fillStyle = '#55FFFF';
        for (let wx = 290; wx < 360; wx += 14) {
            ctx.fillRect(wx, by + 121, 4, 2);
        }
        // Particle trail
        for (let p = 0; p < 6; p++) {
            const px = 222 - p * 7 + Math.sin(this.animTimer / 100 + p) * 2;
            const py = by + 131 + Math.sin(this.animTimer / 150 + p * 0.7) * 1;
            const pa = 0.4 - p * 0.06;
            if (pa > 0) {
                ctx.fillStyle = `rgba(85,255,255,${pa})`;
                ctx.fillRect(px, py, 3, 2);
            }
        }

        // Second separator
        ctx.strokeStyle = '#5555FF';
        ctx.beginPath();
        ctx.moveTo(bx + 30, by + 152); ctx.lineTo(bx + bw - 30, by + 152);
        ctx.stroke();

        // Credits (Sierra-style)
        ctx.font = '12px "Courier New"';
        ctx.fillStyle = '#55FFFF';
        ctx.fillText('A tribute to Sierra On-Line adventure games', this.WIDTH / 2, by + 175);
        ctx.fillStyle = '#AAAAAA';
        ctx.fillText('Inspired by Space Quest: The Sarien Encounter', this.WIDTH / 2, by + 195);
        ctx.font = '11px "Courier New"';
        ctx.fillStyle = '#555555';
        ctx.fillText('Procedural pixel art \u2022 No sprites \u2022 Pure JavaScript', this.WIDTH / 2, by + 225);

        // Prompt (below box)
        const blink = Math.floor(this.animTimer / 600) % 2;
        if (blink) {
            ctx.font = 'bold 16px "Courier New"';
            ctx.fillStyle = '#FFFF55';
            ctx.fillText('- Click to Begin -', this.WIDTH / 2, by + bh + 50);
        }

        // Bottom text
        ctx.font = '10px "Courier New"';
        ctx.fillStyle = '#555555';
        ctx.fillText('\u00A9 2025', this.WIDTH / 2, this.HEIGHT - 10);

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
        const s = 1.85 + (y - 280) / 90 * 0.3;

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(x, y + 12 * s, 8 * s, 2.5 * s, 0, 0, Math.PI * 2);
        ctx.fill();

        // Leg animation
        const ls = walking ? Math.sin(frame * Math.PI / 2) * 3 * s : 0;
        const as = walking ? Math.cos(frame * Math.PI / 2) * 2 * s : 0;

        if (facing === 'toward') {
            // ---- FRONT VIEW (facing camera) ----
            // Legs
            ctx.fillStyle = '#2828AA';
            ctx.fillRect(x - 4 * s, y + 1 * s, 3 * s, 8 * s + ls);
            ctx.fillRect(x + 1 * s, y + 1 * s, 3 * s, 8 * s - ls);
            ctx.fillStyle = '#3535BB';
            ctx.fillRect(x - 3 * s, y + 2 * s, 1 * s, 6 * s + ls);
            ctx.fillRect(x + 2 * s, y + 2 * s, 1 * s, 6 * s - ls);
            // Boots
            ctx.fillStyle = '#222222';
            ctx.fillRect(x - 5 * s, y + 9 * s + ls, 4 * s, 3 * s);
            ctx.fillRect(x + 0 * s, y + 9 * s - ls, 4 * s, 3 * s);
            ctx.fillStyle = '#1a1a1a';
            ctx.fillRect(x - 5 * s, y + 11 * s + ls, 5 * s, 1 * s);
            ctx.fillRect(x + 0 * s, y + 11 * s - ls, 5 * s, 1 * s);
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
            ctx.fillRect(x - 2.5 * s, y - 15 * s, 1.5 * s, 2 * s);
            ctx.fillStyle = '#111133';
            ctx.fillRect(x - 2 * s, y - 14.5 * s, 1 * s, 1 * s);
            // Right eye
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(x + 0.5 * s, y - 15 * s, 2.5 * s, 2 * s);
            ctx.fillStyle = '#4477CC';
            ctx.fillRect(x + 1 * s, y - 15 * s, 1.5 * s, 2 * s);
            ctx.fillStyle = '#111133';
            ctx.fillRect(x + 1 * s, y - 14.5 * s, 1 * s, 1 * s);
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
            ctx.fillRect(x - 4 * s, y + 1 * s, 3 * s, 8 * s + ls);
            ctx.fillRect(x + 1 * s, y + 1 * s, 3 * s, 8 * s - ls);
            ctx.fillStyle = '#2020AA';
            ctx.fillRect(x - 3 * s, y + 2 * s, 1 * s, 6 * s + ls);
            ctx.fillRect(x + 2 * s, y + 2 * s, 1 * s, 6 * s - ls);
            // Boots
            ctx.fillStyle = '#222222';
            ctx.fillRect(x - 5 * s, y + 9 * s + ls, 4 * s, 3 * s);
            ctx.fillRect(x + 0 * s, y + 9 * s - ls, 4 * s, 3 * s);
            ctx.fillStyle = '#1a1a1a';
            ctx.fillRect(x - 5 * s, y + 11 * s + ls, 5 * s, 1 * s);
            ctx.fillRect(x + 0 * s, y + 11 * s - ls, 5 * s, 1 * s);
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
            ctx.fillRect(x + 0 * s, y - 17 * s, 1 * s, 6 * s);
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
            ctx.fillRect(x - 4 * s, y + 1 * s, 3 * s, 8 * s + ls);
            ctx.fillRect(x + 1 * s, y + 1 * s, 3 * s, 8 * s - ls);
            ctx.fillStyle = '#3535BB';
            ctx.fillRect(x - 3 * s, y + 2 * s, 1 * s, 6 * s + ls);
            ctx.fillRect(x + 2 * s, y + 2 * s, 1 * s, 6 * s - ls);
            ctx.fillStyle = '#2020AA';
            ctx.fillRect(x - 4 * s, y + 5 * s + Math.max(ls, 0), 3 * s, 1 * s);
            ctx.fillRect(x + 1 * s, y + 5 * s - Math.min(ls, 0), 3 * s, 1 * s);
            // Boots
            ctx.fillStyle = '#222222';
            ctx.fillRect(x - 5 * s, y + 9 * s + ls, 4 * s, 3 * s);
            ctx.fillRect(x + 0 * s, y + 9 * s - ls, 4 * s, 3 * s);
            ctx.fillStyle = '#1a1a1a';
            ctx.fillRect(x - 5 * s, y + 11 * s + ls, 5 * s, 1 * s);
            ctx.fillRect(x + 0 * s, y + 11 * s - ls, 5 * s, 1 * s);
            ctx.fillStyle = '#444444';
            ctx.fillRect(x - 4 * s, y + 9 * s + ls, 2 * s, 1 * s);
            ctx.fillRect(x + 1 * s, y + 9 * s - ls, 2 * s, 1 * s);
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
                ctx.fillRect(x + 0 * s, y - 16 * s, 3 * s, 1 * s);
            } else {
                ctx.fillRect(x - 3 * s, y - 16 * s, 3 * s, 1 * s);
            }
            // Eye
            if (dir > 0) {
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(x + 0 * s, y - 15 * s, 3 * s, 2 * s);
                ctx.fillStyle = '#4477CC';
                ctx.fillRect(x + 1 * s, y - 15 * s, 2 * s, 2 * s);
                ctx.fillStyle = '#111133';
                ctx.fillRect(x + 2 * s, y - 14.5 * s, 1 * s, 1 * s);
            } else {
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(x - 3 * s, y - 15 * s, 3 * s, 2 * s);
                ctx.fillStyle = '#4477CC';
                ctx.fillRect(x - 3 * s, y - 15 * s, 2 * s, 2 * s);
                ctx.fillStyle = '#111133';
                ctx.fillRect(x - 3 * s, y - 14.5 * s, 1 * s, 1 * s);
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
    }

    // ---- Hotspot Label ----
    drawHotspotLabel(ctx, room) {
        if (!room || !room.hotspots) return;
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
        const glow = Math.sin(this.animTimer / 400) * 0.3 + 0.7;
        ctx.fillStyle = `rgba(255,255,85,${glow})`;
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
        localStorage.removeItem(this.getSaveKey(slot));
    }

    getSlotInfo(slot) {
        const raw = localStorage.getItem(this.getSaveKey(slot));
        if (!raw) return null;
        try {
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
        this.saveModalMode = mode;
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

    // ---- Game Loop ----
    start() {
        const loop = (timestamp) => {
            const dt = Math.min(timestamp - this.lastTime, 100);
            this.lastTime = timestamp;
            this.update(dt);
            this.render();
            requestAnimationFrame(loop);
        };
        requestAnimationFrame(loop);
    }
}
