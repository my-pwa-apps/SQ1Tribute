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

        // Game state
        this.rooms = {};
        this.items = {};
        this.currentRoomId = null;
        this.inventory = [];
        this.score = 0;
        this.maxScore = 215;
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

        this.setupInput();
    }

    // ---- Input ----
    setupInput() {
        this.canvas.addEventListener('click', (e) => {
            if (this.cutscene) {
                this.skipCutscene();
                return;
            }
            if (this.titleScreen) {
                this.titleScreen = false;
                this.goToRoom('broom_closet', 320, 310);
                return;
            }
            if (this.dead || this.won) return;
            const rect = this.canvas.getBoundingClientRect();
            const scaleX = this.WIDTH / rect.width;
            const scaleY = this.HEIGHT / rect.height;
            const x = (e.clientX - rect.left) * scaleX;
            const y = (e.clientY - rect.top) * scaleY;
            this.handleClick(x, y);
        });

        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const scaleX = this.WIDTH / rect.width;
            const scaleY = this.HEIGHT / rect.height;
            this.mouseX = (e.clientX - rect.left) * scaleX;
            this.mouseY = (e.clientY - rect.top) * scaleY;
        });

        document.querySelectorAll('.action-btn').forEach(btn => {
            btn.addEventListener('click', () => this.setAction(btn.dataset.action));
        });

        document.addEventListener('keydown', (e) => {
            this.keysDown[e.key] = true;
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
        });

        document.addEventListener('keyup', (e) => {
            delete this.keysDown[e.key];
        });

        document.getElementById('btn-save').addEventListener('click', () => this.openSaveModal('save'));
        document.getElementById('btn-load').addEventListener('click', () => this.openSaveModal('load'));
        document.getElementById('save-modal-close').addEventListener('click', () => this.closeSaveModal());
        document.getElementById('save-modal').addEventListener('click', (e) => {
            if (e.target === document.getElementById('save-modal')) this.closeSaveModal();
        });
    }

    setAction(action) {
        this.currentAction = action;
        this.selectedItem = null;
        document.querySelectorAll('.action-btn').forEach(b => b.classList.remove('active'));
        const btn = document.querySelector(`[data-action="${action}"]`);
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
        const container = document.getElementById('inventory-items');
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
        document.getElementById('score-display').textContent = `Score: ${this.score} / ${this.maxScore}`;
    }

    setFlag(f, v) { this.flags[f] = (v === undefined) ? true : v; }
    getFlag(f) { return this.flags[f] || false; }

    // ---- Messages ----
    showMessage(text) {
        this.message = text;
        const el = document.getElementById('message-text');
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
        this.showMessage(msg + ' — Press R to restart.');
    }

    victory(msg) {
        this.won = true;
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
        document.getElementById('score-display').textContent = 'Score: 0 / 215';
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

        // Current action indicator (Sierra-style top bar)
        if (!this.dead && !this.won) {
            const actionLabel = this.selectedItem
                ? `Use ${this.items[this.selectedItem]?.name || '?'} on...`
                : this.currentAction.charAt(0).toUpperCase() + this.currentAction.slice(1);
            ctx.font = '10px "Courier New"';
            ctx.fillStyle = 'rgba(0,0,0,0.5)';
            ctx.fillRect(0, 0, ctx.measureText(actionLabel).width + 12, 14);
            ctx.fillStyle = '#aabbcc';
            ctx.fillText(actionLabel, 6, 10);
        }

        if (this.dead) this.drawDeathOverlay(ctx);
        if (this.won) this.drawWinOverlay(ctx);

        // Room transition fade-in
        if (this.roomTransition > 0) {
            ctx.fillStyle = `rgba(0,0,0,${this.roomTransition})`;
            ctx.fillRect(0, 0, this.WIDTH, this.HEIGHT);
        }
    }

    // ---- Title Screen ----
    drawTitleScreen(ctx) {
        // Starfield
        ctx.fillStyle = '#050515';
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
        ng.addColorStop(0, 'rgba(40,20,80,0.15)');
        ng.addColorStop(0.5, 'rgba(20,10,60,0.08)');
        ng.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = ng;
        ctx.fillRect(0, 0, this.WIDTH, this.HEIGHT);

        // Title with shadow
        ctx.textAlign = 'center';
        ctx.font = 'bold 44px "Courier New"';
        ctx.fillStyle = '#112244';
        ctx.fillText('STAR SWEEPER', this.WIDTH / 2 + 2, 122);
        const glow = Math.sin(this.animTimer / 500) * 0.3 + 0.7;
        ctx.fillStyle = `rgba(100,180,255,${glow})`;
        ctx.fillText('STAR SWEEPER', this.WIDTH / 2, 120);

        ctx.font = '20px "Courier New"';
        ctx.fillStyle = '#aaccff';
        ctx.fillText('A   S P A C E   A D V E N T U R E', this.WIDTH / 2, 158);

        // Sierra tribute line with decorative border
        ctx.strokeStyle = '#334466';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(150, 180); ctx.lineTo(490, 180);
        ctx.stroke();
        ctx.font = '12px "Courier New"';
        ctx.fillStyle = '#556688';
        ctx.fillText('A tribute to classic Sierra adventure games', this.WIDTH / 2, 196);
        ctx.beginPath();
        ctx.moveTo(150, 204); ctx.lineTo(490, 204);
        ctx.stroke();

        // Ship silhouette — more detailed
        ctx.fillStyle = '#1a2a44';
        ctx.beginPath();
        ctx.moveTo(190, 262);
        ctx.lineTo(230, 250);
        ctx.lineTo(260, 248);
        ctx.lineTo(380, 248);
        ctx.lineTo(410, 250);
        ctx.lineTo(450, 262);
        ctx.lineTo(430, 272);
        ctx.lineTo(400, 268);
        ctx.lineTo(240, 268);
        ctx.lineTo(210, 272);
        ctx.closePath();
        ctx.fill();
        // Hull detail
        ctx.fillStyle = '#223355';
        ctx.fillRect(250, 253, 140, 2);
        // Bridge dome
        ctx.fillStyle = '#223355';
        ctx.fillRect(300, 243, 40, 6);
        // Engine nacelles
        ctx.fillStyle = '#152035';
        ctx.fillRect(210, 264, 15, 8);
        ctx.fillRect(415, 264, 15, 8);
        // Engine glow
        ctx.fillStyle = `rgba(100,150,255,${0.4 + Math.sin(this.animTimer / 200) * 0.2})`;
        ctx.fillRect(206, 266, 6, 4);
        ctx.fillRect(430, 266, 6, 4);
        // Particle trail
        for (let p = 0; p < 8; p++) {
            const px = 200 - p * 8 + Math.sin(this.animTimer / 100 + p) * 2;
            const py = 268 + Math.sin(this.animTimer / 150 + p * 0.7) * 2;
            const pa = 0.3 - p * 0.035;
            if (pa > 0) {
                ctx.fillStyle = `rgba(100,150,255,${pa})`;
                ctx.fillRect(px, py, 3, 2);
            }
        }
        // Windows
        ctx.fillStyle = '#4477aa';
        for (let wx = 270; wx < 380; wx += 18) {
            ctx.fillRect(wx, 254, 5, 3);
        }

        // Prompt
        const blink = Math.floor(this.animTimer / 600) % 2;
        if (blink) {
            ctx.font = '18px "Courier New"';
            ctx.fillStyle = '#ffdd55';
            ctx.fillText('[ Click to Begin ]', this.WIDTH / 2, 340);
        }

        // Copyright-style line
        ctx.font = '10px "Courier New"';
        ctx.fillStyle = '#334455';
        ctx.fillText('Procedural pixel art \u2022 No sprites \u2022 Pure JavaScript', this.WIDTH / 2, 385);

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
        const s = 1.6 + (y - 280) / 90 * 0.6;

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(x, y + 20 * s, 8 * s, 2.5 * s, 0, 0, Math.PI * 2);
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
            ctx.fillRect(x - 7 * s, y - 1 * s + as, 2 * s, 2 * s);
            ctx.fillRect(x + 5 * s, y - 1 * s - as, 2 * s, 2 * s);
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
        for (const hs of room.hotspots) {
            if (hs.hidden) continue;
            if (this.mouseX >= hs.x && this.mouseX <= hs.x + hs.w &&
                this.mouseY >= hs.y && this.mouseY <= hs.y + hs.h) {
                const name = hs.name || '???';
                ctx.font = '12px "Courier New"';
                const tw = ctx.measureText(name).width;
                const tx = Math.max(4, Math.min(this.mouseX - tw / 2, this.WIDTH - tw - 12));
                const ty = Math.max(24, this.mouseY - 24);
                // Sierra-style label with double border
                ctx.fillStyle = '#0a0a20';
                ctx.fillRect(tx - 6, ty - 14, tw + 12, 20);
                ctx.strokeStyle = '#8899aa';
                ctx.lineWidth = 1;
                ctx.strokeRect(tx - 6, ty - 14, tw + 12, 20);
                ctx.strokeStyle = '#445566';
                ctx.strokeRect(tx - 4, ty - 12, tw + 8, 16);
                ctx.fillStyle = '#FFFF88';
                ctx.fillText(name, tx, ty);
                break;
            }
        }
    }

    // ---- Overlays ----
    drawDeathOverlay(ctx) {
        ctx.fillStyle = 'rgba(60,0,0,0.6)';
        ctx.fillRect(0, 0, this.WIDTH, this.HEIGHT);

        // Sierra-style bordered message box
        const bx = 100, by = 110, bw = 440, bh = 170;
        ctx.fillStyle = '#1a0000';
        ctx.fillRect(bx, by, bw, bh);
        ctx.strokeStyle = '#ff4444';
        ctx.lineWidth = 3;
        ctx.strokeRect(bx + 2, by + 2, bw - 4, bh - 4);
        ctx.strokeStyle = '#882222';
        ctx.lineWidth = 1;
        ctx.strokeRect(bx + 6, by + 6, bw - 12, bh - 12);

        ctx.textAlign = 'center';
        ctx.font = 'bold 32px "Courier New"';
        ctx.fillStyle = '#FF3333';
        ctx.fillText('YOU DIED', this.WIDTH / 2, by + 50);

        // Wrap the death message
        ctx.font = '13px "Courier New"';
        ctx.fillStyle = '#ddaaaa';
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
            ctx.fillStyle = '#ffdd55';
            ctx.fillText('Press R to try again', this.WIDTH / 2, by + bh - 22);
        }
        ctx.textAlign = 'left';
    }

    drawWinOverlay(ctx) {
        ctx.fillStyle = 'rgba(0,0,40,0.7)';
        ctx.fillRect(0, 0, this.WIDTH, this.HEIGHT);

        // Sierra-style bordered victory box
        const bx = 80, by = 60, bw = 480, bh = 280;
        ctx.fillStyle = '#0a0a30';
        ctx.fillRect(bx, by, bw, bh);
        ctx.strokeStyle = '#ffdd55';
        ctx.lineWidth = 3;
        ctx.strokeRect(bx + 2, by + 2, bw - 4, bh - 4);
        ctx.strokeStyle = '#886622';
        ctx.lineWidth = 1;
        ctx.strokeRect(bx + 6, by + 6, bw - 12, bh - 12);

        // Star decorations in corners
        ctx.fillStyle = '#ffdd55';
        ctx.font = '16px "Courier New"';
        ctx.fillText('\u2605', bx + 14, by + 24);
        ctx.fillText('\u2605', bx + bw - 26, by + 24);
        ctx.fillText('\u2605', bx + 14, by + bh - 12);
        ctx.fillText('\u2605', bx + bw - 26, by + bh - 12);

        ctx.textAlign = 'center';
        ctx.font = 'bold 30px "Courier New"';
        const glow = Math.sin(this.animTimer / 400) * 0.3 + 0.7;
        ctx.fillStyle = `rgba(255,255,0,${glow})`;
        ctx.fillText('CONGRATULATIONS!', this.WIDTH / 2, by + 55);

        ctx.font = '16px "Courier New"';
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText('You have saved the galaxy!', this.WIDTH / 2, by + 95);

        ctx.font = 'bold 18px "Courier New"';
        ctx.fillStyle = '#88ff88';
        ctx.fillText(`Final Score: ${this.score} / ${this.maxScore}`, this.WIDTH / 2, by + 135);

        // Score rating
        let rating = 'Space Janitor';
        if (this.score >= this.maxScore) rating = 'Galactic Legend';
        else if (this.score >= 180) rating = 'Space Hero';
        else if (this.score >= 150) rating = 'Star Captain';
        else if (this.score >= 100) rating = 'Cadet';
        ctx.font = '14px "Courier New"';
        ctx.fillStyle = '#ffcc44';
        ctx.fillText(`Rank: ${rating}`, this.WIDTH / 2, by + 160);

        ctx.font = '14px "Courier New"';
        ctx.fillStyle = '#88bbff';
        ctx.fillText('From humble janitor to galactic hero...', this.WIDTH / 2, by + 195);
        ctx.fillText('Your story will be told across the stars.', this.WIDTH / 2, by + 215);

        if (Math.floor(this.animTimer / 700) % 2) {
            ctx.font = '14px "Courier New"';
            ctx.fillStyle = '#ffdd55';
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
            document.getElementById('score-display').textContent = `Score: ${this.score} / ${this.maxScore}`;
            this.setAction('walk');
            this.updateInventoryUI();
            this.goToRoom(data.currentRoomId, data.playerX, data.playerY);
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
        const modal = document.getElementById('save-modal');
        document.getElementById('modal-title').textContent = mode === 'save' ? 'Save Game' : 'Load Game';
        const list = document.getElementById('slot-list');
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
        document.getElementById('save-modal').classList.remove('open');
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
